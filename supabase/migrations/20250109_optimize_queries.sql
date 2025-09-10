-- Query Optimization Indexes for Tax Management System
-- TASK-048: 쿼리 최적화

-- 1. 기본 복합 인덱스 (날짜 + 거래 유형)
CREATE INDEX IF NOT EXISTS idx_tax_transactions_date_type 
ON tax_transactions(transaction_date DESC, transaction_type);

-- 2. 거래처 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_supplier 
ON tax_transactions(supplier_name);

-- 3. 프로젝트별 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_project_date 
ON tax_transactions(project_id, transaction_date DESC)
WHERE project_id IS NOT NULL;

-- 4. 클라이언트별 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_client_date 
ON tax_transactions(client_id, transaction_date DESC)
WHERE client_id IS NOT NULL;

-- 5. 복합 인덱스 (거래 유형 + 날짜 + 금액)
CREATE INDEX IF NOT EXISTS idx_tax_transactions_composite 
ON tax_transactions(transaction_type, transaction_date DESC, total_amount);

-- 6. 부분 인덱스 (소프트 삭제)
CREATE INDEX IF NOT EXISTS idx_tax_transactions_not_deleted 
ON tax_transactions(deleted_at) 
WHERE deleted_at IS NULL;

-- 7. 금액 범위 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_amount 
ON tax_transactions(total_amount)
WHERE deleted_at IS NULL;

-- 8. 부가세 계산용 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_vat 
ON tax_transactions(supply_amount, vat_amount)
WHERE deleted_at IS NULL;

-- 9. 텍스트 검색 인덱스 (GIN)
CREATE INDEX IF NOT EXISTS idx_tax_transactions_search 
ON tax_transactions 
USING gin(to_tsvector('simple', 
  COALESCE(supplier_name, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(business_number, '')
));

-- 10. 월별 집계용 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_monthly 
ON tax_transactions(
  date_trunc('month', transaction_date), 
  transaction_type
) WHERE deleted_at IS NULL;

-- 11. 세금계산서 번호 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_invoice 
ON tax_transactions(tax_invoice_number)
WHERE tax_invoice_number IS NOT NULL;

-- 12. 원천세 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_transactions_withholding 
ON tax_transactions(withholding_tax_amount)
WHERE withholding_tax_amount > 0;

-- 월별 요약 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_monthly_summary_lookup 
ON tax_monthly_summary(year, month);

-- 클라이언트 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_clients_search 
ON clients USING gin(to_tsvector('simple', 
  COALESCE(name, '') || ' ' || 
  COALESCE(company, '') || ' ' || 
  COALESCE(email, '')
));

-- 프로젝트 테이블 인덱스  
CREATE INDEX IF NOT EXISTS idx_projects_status_date 
ON projects(status, start_date DESC)
WHERE status != 'COMPLETED';

CREATE INDEX IF NOT EXISTS idx_projects_client 
ON projects(client_id)
WHERE deleted_at IS NULL;

-- 통계 정보 업데이트
ANALYZE tax_transactions;
ANALYZE tax_monthly_summary;
ANALYZE clients;
ANALYZE projects;

-- 쿼리 최적화를 위한 RPC 함수
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- EXPLAIN ANALYZE를 위한 함수
CREATE OR REPLACE FUNCTION explain_analyze_query(query_text text)
RETURNS TABLE(plan_line text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || query_text;
END;
$$;

-- 느린 쿼리 감지를 위한 뷰
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  min_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- 100ms 이상
ORDER BY mean_exec_time DESC
LIMIT 50;

-- 인덱스 사용 통계 뷰
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 테이블 통계 뷰
CREATE OR REPLACE VIEW table_stats AS
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 캐시 히트율 함수
CREATE OR REPLACE FUNCTION cache_hit_ratio()
RETURNS TABLE(
  database_name text,
  cache_hit_ratio numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    datname as database_name,
    ROUND(
      100.0 * sum(heap_blks_hit) / 
      NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
      2
    ) as cache_hit_ratio
  FROM pg_stat_database
  GROUP BY datname
  ORDER BY cache_hit_ratio DESC;
$$;

-- 자동 VACUUM 설정 최적화
ALTER TABLE tax_transactions SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- 소프트 삭제 컬럼 추가 (없는 경우)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tax_transactions' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE tax_transactions 
    ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- 성능 모니터링 로그 테이블
CREATE TABLE IF NOT EXISTS query_performance_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash text NOT NULL,
  query_text text NOT NULL,
  execution_time_ms numeric NOT NULL,
  row_count integer,
  cache_hit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_query_performance_log_time 
ON query_performance_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_log_slow 
ON query_performance_log(execution_time_ms DESC)
WHERE execution_time_ms > 100;

-- 로그 정리 함수 (30일 이상 된 로그 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_performance_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM query_performance_log
  WHERE created_at < now() - interval '30 days';
$$;

COMMENT ON INDEX idx_tax_transactions_date_type IS '날짜 및 거래 유형별 조회 최적화';
COMMENT ON INDEX idx_tax_transactions_supplier IS '거래처 검색 최적화';
COMMENT ON INDEX idx_tax_transactions_project_date IS '프로젝트별 거래 조회 최적화';
COMMENT ON INDEX idx_tax_transactions_composite IS '복합 조건 조회 최적화';
COMMENT ON INDEX idx_tax_transactions_not_deleted IS '소프트 삭제 필터링 최적화';
COMMENT ON INDEX idx_tax_transactions_search IS '전문 검색 최적화';