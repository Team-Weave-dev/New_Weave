-- 세무 관리 시스템 재설계 마이그레이션
-- 2025년 1월 9일

-- 1. 매입매출 거래 테이블 생성
CREATE TABLE IF NOT EXISTS tax_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 거래 기본 정보
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('매입', '매출')),
    
    -- 프로젝트/클라이언트 연동
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- 거래처 정보
    supplier_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(50),
    
    -- 금액 정보
    supply_amount DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) DEFAULT 0,
    withholding_tax_3_3 DECIMAL(15, 2) DEFAULT 0,
    withholding_tax_6_8 DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    
    -- 분류 및 상태
    category VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    
    -- 증빙 자료
    document_url TEXT,
    document_type VARCHAR(50),
    
    -- 메타데이터
    metadata JSONB
);

-- 인덱스 생성
CREATE INDEX idx_tax_transactions_date ON tax_transactions(transaction_date);
CREATE INDEX idx_tax_transactions_type ON tax_transactions(transaction_type);
CREATE INDEX idx_tax_transactions_user_date ON tax_transactions(user_id, transaction_date);
CREATE INDEX idx_tax_transactions_project ON tax_transactions(project_id);
CREATE INDEX idx_tax_transactions_client ON tax_transactions(client_id);

-- 2. 월별 매출 집계 테이블 생성
CREATE TABLE IF NOT EXISTS tax_monthly_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- 매출 정보
    total_sales DECIMAL(15, 2) DEFAULT 0,
    total_purchases DECIMAL(15, 2) DEFAULT 0,
    vat_payable DECIMAL(15, 2) DEFAULT 0,
    
    -- 원천세 정보
    withholding_tax_collected DECIMAL(15, 2) DEFAULT 0,
    withholding_tax_paid DECIMAL(15, 2) DEFAULT 0,
    
    -- 집계 정보
    transaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_year_month UNIQUE(user_id, year, month)
);

-- 인덱스 생성
CREATE INDEX idx_tax_monthly_summary_user ON tax_monthly_summary(user_id);
CREATE INDEX idx_tax_monthly_summary_period ON tax_monthly_summary(year, month);

-- 3. RLS (Row Level Security) 정책 설정
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_monthly_summary ENABLE ROW LEVEL SECURITY;

-- tax_transactions RLS 정책
CREATE POLICY "Users can view their own tax transactions"
    ON tax_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tax transactions"
    ON tax_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax transactions"
    ON tax_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax transactions"
    ON tax_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- tax_monthly_summary RLS 정책
CREATE POLICY "Users can view their own tax summaries"
    ON tax_monthly_summary FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tax summaries"
    ON tax_monthly_summary FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. 트리거 함수 생성 - 자동 업데이트 타임스탬프
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_tax_transactions_updated_at
    BEFORE UPDATE ON tax_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 월별 집계 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_monthly_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 거래가 추가되거나 수정될 때 월별 집계 업데이트
    INSERT INTO tax_monthly_summary (
        user_id,
        year,
        month,
        total_sales,
        total_purchases,
        vat_payable,
        withholding_tax_collected,
        withholding_tax_paid,
        transaction_count,
        last_updated
    )
    SELECT 
        NEW.user_id,
        EXTRACT(YEAR FROM NEW.transaction_date)::INTEGER,
        EXTRACT(MONTH FROM NEW.transaction_date)::INTEGER,
        CASE WHEN NEW.transaction_type = '매출' THEN NEW.total_amount ELSE 0 END,
        CASE WHEN NEW.transaction_type = '매입' THEN NEW.total_amount ELSE 0 END,
        CASE WHEN NEW.transaction_type = '매출' THEN NEW.vat_amount 
             WHEN NEW.transaction_type = '매입' THEN -NEW.vat_amount 
             ELSE 0 END,
        CASE WHEN NEW.transaction_type = '매출' THEN COALESCE(NEW.withholding_tax_3_3, 0) + COALESCE(NEW.withholding_tax_6_8, 0) ELSE 0 END,
        CASE WHEN NEW.transaction_type = '매입' THEN COALESCE(NEW.withholding_tax_3_3, 0) + COALESCE(NEW.withholding_tax_6_8, 0) ELSE 0 END,
        1,
        NOW()
    ON CONFLICT (user_id, year, month) DO UPDATE SET
        total_sales = tax_monthly_summary.total_sales + 
            CASE WHEN NEW.transaction_type = '매출' THEN NEW.total_amount ELSE 0 END -
            CASE WHEN TG_OP = 'UPDATE' AND OLD.transaction_type = '매출' THEN OLD.total_amount ELSE 0 END,
        total_purchases = tax_monthly_summary.total_purchases + 
            CASE WHEN NEW.transaction_type = '매입' THEN NEW.total_amount ELSE 0 END -
            CASE WHEN TG_OP = 'UPDATE' AND OLD.transaction_type = '매입' THEN OLD.total_amount ELSE 0 END,
        vat_payable = tax_monthly_summary.vat_payable + 
            CASE WHEN NEW.transaction_type = '매출' THEN NEW.vat_amount 
                 WHEN NEW.transaction_type = '매입' THEN -NEW.vat_amount 
                 ELSE 0 END -
            CASE WHEN TG_OP = 'UPDATE' THEN
                CASE WHEN OLD.transaction_type = '매출' THEN OLD.vat_amount 
                     WHEN OLD.transaction_type = '매입' THEN -OLD.vat_amount 
                     ELSE 0 END
            ELSE 0 END,
        withholding_tax_collected = tax_monthly_summary.withholding_tax_collected + 
            CASE WHEN NEW.transaction_type = '매출' THEN COALESCE(NEW.withholding_tax_3_3, 0) + COALESCE(NEW.withholding_tax_6_8, 0) ELSE 0 END -
            CASE WHEN TG_OP = 'UPDATE' AND OLD.transaction_type = '매출' THEN COALESCE(OLD.withholding_tax_3_3, 0) + COALESCE(OLD.withholding_tax_6_8, 0) ELSE 0 END,
        withholding_tax_paid = tax_monthly_summary.withholding_tax_paid + 
            CASE WHEN NEW.transaction_type = '매입' THEN COALESCE(NEW.withholding_tax_3_3, 0) + COALESCE(NEW.withholding_tax_6_8, 0) ELSE 0 END -
            CASE WHEN TG_OP = 'UPDATE' AND OLD.transaction_type = '매입' THEN COALESCE(OLD.withholding_tax_3_3, 0) + COALESCE(OLD.withholding_tax_6_8, 0) ELSE 0 END,
        transaction_count = tax_monthly_summary.transaction_count + 
            CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE 0 END,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_monthly_summary_on_transaction
    AFTER INSERT OR UPDATE ON tax_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_summary();

-- 6. 삭제 시 월별 집계 업데이트 함수
CREATE OR REPLACE FUNCTION update_monthly_summary_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tax_monthly_summary SET
        total_sales = total_sales - 
            CASE WHEN OLD.transaction_type = '매출' THEN OLD.total_amount ELSE 0 END,
        total_purchases = total_purchases - 
            CASE WHEN OLD.transaction_type = '매입' THEN OLD.total_amount ELSE 0 END,
        vat_payable = vat_payable - 
            CASE WHEN OLD.transaction_type = '매출' THEN OLD.vat_amount 
                 WHEN OLD.transaction_type = '매입' THEN -OLD.vat_amount 
                 ELSE 0 END,
        withholding_tax_collected = withholding_tax_collected - 
            CASE WHEN OLD.transaction_type = '매출' THEN COALESCE(OLD.withholding_tax_3_3, 0) + COALESCE(OLD.withholding_tax_6_8, 0) ELSE 0 END,
        withholding_tax_paid = withholding_tax_paid - 
            CASE WHEN OLD.transaction_type = '매입' THEN COALESCE(OLD.withholding_tax_3_3, 0) + COALESCE(OLD.withholding_tax_6_8, 0) ELSE 0 END,
        transaction_count = transaction_count - 1,
        last_updated = NOW()
    WHERE user_id = OLD.user_id 
        AND year = EXTRACT(YEAR FROM OLD.transaction_date)::INTEGER
        AND month = EXTRACT(MONTH FROM OLD.transaction_date)::INTEGER;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 삭제 트리거 적용
CREATE TRIGGER update_monthly_summary_on_transaction_delete
    AFTER DELETE ON tax_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_summary_on_delete();

-- 7. 기존 tax_records 테이블의 데이터 마이그레이션 (선택적)
-- 기존 데이터가 있다면 아래 쿼리를 실행하여 마이그레이션 가능
/*
INSERT INTO tax_transactions (
    user_id,
    transaction_date,
    transaction_type,
    client_id,
    supplier_name,
    business_number,
    supply_amount,
    vat_amount,
    total_amount,
    status,
    metadata
)
SELECT 
    user_id,
    COALESCE(filed_date, due_date, CURRENT_DATE) as transaction_date,
    CASE 
        WHEN tax_type IN ('VAT_SALES', 'INCOME_TAX') THEN '매출'
        ELSE '매입'
    END as transaction_type,
    client_id,
    COALESCE(
        (SELECT company FROM clients WHERE clients.id = tax_records.client_id),
        '미지정'
    ) as supplier_name,
    business_number,
    amount as supply_amount,
    amount * 0.1 as vat_amount,
    amount * 1.1 as total_amount,
    status,
    metadata
FROM tax_records
WHERE EXISTS (
    SELECT 1 FROM tax_records WHERE tax_records.user_id IS NOT NULL
);
*/

-- 8. 샘플 데이터 삽입 (개발 환경용)
-- 실제 프로덕션에서는 주석 처리 또는 제거
/*
INSERT INTO tax_transactions (
    user_id,
    transaction_date,
    transaction_type,
    supplier_name,
    business_number,
    supply_amount,
    vat_amount,
    total_amount,
    category,
    description
) VALUES 
    (auth.uid(), '2025-01-05', '매출', 'A개발사', '123-45-67890', 1000000, 100000, 1100000, '서비스', '웹사이트 개발'),
    (auth.uid(), '2025-01-06', '매입', 'B디자인', '234-56-78901', 500000, 50000, 550000, '외주', '디자인 작업'),
    (auth.uid(), '2025-01-07', '매출', 'C마케팅', '345-67-89012', 2000000, 200000, 2200000, '컨설팅', '마케팅 전략 수립'),
    (auth.uid(), '2025-01-08', '매입', 'D카페', '456-78-90123', 30000, 3000, 33000, '복리후생', '회의 케이터링');
*/