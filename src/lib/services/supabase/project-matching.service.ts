import { createClient } from '@/lib/services/supabase/client';
import type { Transaction } from './tax-transactions.service';

export interface Client {
  id: string;
  name: string;
  business_number?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  client?: Client;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date?: string;
  budget?: number;
  created_at: string;
  updated_at: string;
}

export interface MatchingResult {
  transaction: Transaction;
  suggestedClient?: Client;
  suggestedProject?: Project;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'date_amount' | 'none';
  reason: string;
}

/**
 * 클라이언트 목록 조회
 */
export async function fetchClients(): Promise<Client[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  return data || [];
}

/**
 * 프로젝트 목록 조회
 */
export async function fetchProjects(clientId?: string): Promise<Project[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('projects')
    .select(`
      *,
      client:clients(*)
    `)
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return data || [];
}

/**
 * 문자열 유사도 계산 (Levenshtein Distance)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein Distance 알고리즘
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 사업자번호 정규화
 */
function normalizeBusinessNumber(businessNumber?: string): string {
  if (!businessNumber) return '';
  return businessNumber.replace(/[-\s]/g, '');
}

/**
 * 클라이언트 자동 매칭
 */
export async function matchTransactionToClient(
  transaction: Transaction,
  clients?: Client[]
): Promise<{ client?: Client; confidence: number; reason: string }> {
  // 클라이언트 목록이 없으면 조회
  const clientList = clients || await fetchClients();
  
  if (clientList.length === 0) {
    return { confidence: 0, reason: '등록된 클라이언트가 없습니다' };
  }

  let bestMatch: Client | undefined;
  let bestConfidence = 0;
  let bestReason = '';

  // 1. 사업자번호 정확히 일치
  if (transaction.supplier_business_number) {
    const normalizedTransactionBN = normalizeBusinessNumber(transaction.supplier_business_number);
    
    for (const client of clientList) {
      if (client.business_number) {
        const normalizedClientBN = normalizeBusinessNumber(client.business_number);
        
        if (normalizedTransactionBN === normalizedClientBN) {
          return {
            client,
            confidence: 1.0,
            reason: '사업자번호 완전 일치'
          };
        }
      }
    }
  }

  // 2. 거래처명 유사도 매칭
  for (const client of clientList) {
    const similarity = calculateSimilarity(
      transaction.supplier_name,
      client.name
    );
    
    if (similarity > bestConfidence) {
      bestMatch = client;
      bestConfidence = similarity;
      
      if (similarity === 1) {
        bestReason = '거래처명 완전 일치';
      } else if (similarity > 0.8) {
        bestReason = `거래처명 높은 유사도 (${Math.round(similarity * 100)}%)`;
      } else if (similarity > 0.6) {
        bestReason = `거래처명 중간 유사도 (${Math.round(similarity * 100)}%)`;
      } else {
        bestReason = `거래처명 낮은 유사도 (${Math.round(similarity * 100)}%)`;
      }
    }
  }

  // 3. 부분 문자열 매칭
  if (bestConfidence < 0.8) {
    for (const client of clientList) {
      const supplierNameLower = transaction.supplier_name.toLowerCase();
      const clientNameLower = client.name.toLowerCase();
      
      if (supplierNameLower.includes(clientNameLower) || 
          clientNameLower.includes(supplierNameLower)) {
        const confidence = 0.7;
        if (confidence > bestConfidence) {
          bestMatch = client;
          bestConfidence = confidence;
          bestReason = '거래처명 부분 일치';
        }
      }
    }
  }

  return {
    client: bestMatch,
    confidence: bestConfidence,
    reason: bestReason || '일치하는 클라이언트 없음'
  };
}

/**
 * 프로젝트 자동 매칭
 */
export async function matchTransactionToProject(
  transaction: Transaction,
  client?: Client,
  projects?: Project[]
): Promise<{ project?: Project; confidence: number; reason: string }> {
  // 프로젝트 목록 조회
  const projectList = projects || await fetchProjects(client?.id);
  
  if (projectList.length === 0) {
    return { confidence: 0, reason: '진행 중인 프로젝트가 없습니다' };
  }

  const transactionDate = new Date(transaction.transaction_date);
  let bestMatch: Project | undefined;
  let bestConfidence = 0;
  let bestReason = '';

  for (const project of projectList) {
    let confidence = 0;
    let reasons: string[] = [];

    // 1. 클라이언트 일치 확인
    if (client && project.client_id === client.id) {
      confidence += 0.3;
      reasons.push('클라이언트 일치');
    }

    // 2. 날짜 범위 확인
    const projectStart = new Date(project.start_date);
    const projectEnd = project.end_date ? new Date(project.end_date) : new Date();
    
    if (transactionDate >= projectStart && transactionDate <= projectEnd) {
      confidence += 0.4;
      reasons.push('프로젝트 기간 내 거래');
    } else {
      // 프로젝트 기간 근처인 경우 부분 점수
      const daysBefore = Math.floor((projectStart.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysAfter = Math.floor((transactionDate.getTime() - projectEnd.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBefore >= 0 && daysBefore <= 30) {
        confidence += 0.2;
        reasons.push(`프로젝트 시작 ${daysBefore}일 전`);
      } else if (daysAfter >= 0 && daysAfter <= 30) {
        confidence += 0.2;
        reasons.push(`프로젝트 종료 ${daysAfter}일 후`);
      }
    }

    // 3. 프로젝트 상태 확인
    if (project.status === 'in_progress') {
      confidence += 0.2;
      reasons.push('진행 중인 프로젝트');
    } else if (project.status === 'planning') {
      confidence += 0.1;
      reasons.push('계획 중인 프로젝트');
    }

    // 4. 금액 범위 확인 (예산 대비)
    if (project.budget) {
      const transactionAmount = Number(transaction.total_amount);
      const budgetRatio = transactionAmount / project.budget;
      
      if (budgetRatio <= 0.3) {
        confidence += 0.1;
        reasons.push('프로젝트 예산 범위 내');
      }
    }

    if (confidence > bestConfidence) {
      bestMatch = project;
      bestConfidence = confidence;
      bestReason = reasons.join(', ');
    }
  }

  return {
    project: bestMatch,
    confidence: bestConfidence,
    reason: bestReason || '매칭되는 프로젝트 없음'
  };
}

/**
 * 거래 자동 매칭 (클라이언트 + 프로젝트)
 */
export async function autoMatchTransaction(
  transaction: Transaction
): Promise<MatchingResult> {
  try {
    // 1. 클라이언트 매칭
    const clientMatch = await matchTransactionToClient(transaction);
    
    // 2. 프로젝트 매칭
    let projectMatch = { project: undefined, confidence: 0, reason: '' };
    if (clientMatch.client) {
      projectMatch = await matchTransactionToProject(
        transaction, 
        clientMatch.client
      );
    }

    // 3. 종합 신뢰도 계산
    const totalConfidence = (clientMatch.confidence * 0.6 + 
                             (projectMatch.confidence || 0) * 0.4);

    // 4. 매칭 타입 결정
    let matchType: MatchingResult['matchType'] = 'none';
    if (clientMatch.confidence === 1.0) {
      matchType = 'exact';
    } else if (clientMatch.confidence > 0.7) {
      matchType = 'fuzzy';
    } else if (projectMatch.confidence > 0.5) {
      matchType = 'date_amount';
    }

    return {
      transaction,
      suggestedClient: clientMatch.client,
      suggestedProject: projectMatch.project,
      confidence: totalConfidence,
      matchType,
      reason: [clientMatch.reason, projectMatch.reason]
        .filter(r => r)
        .join(' | ')
    };
  } catch (error) {
    console.error('Error in auto matching:', error);
    return {
      transaction,
      confidence: 0,
      matchType: 'none',
      reason: '매칭 중 오류 발생'
    };
  }
}

/**
 * 여러 거래 일괄 매칭
 */
export async function batchAutoMatch(
  transactions: Transaction[]
): Promise<MatchingResult[]> {
  // 클라이언트와 프로젝트 미리 로드 (성능 최적화)
  const [clients, projects] = await Promise.all([
    fetchClients(),
    fetchProjects()
  ]);

  const results: MatchingResult[] = [];

  for (const transaction of transactions) {
    const clientMatch = await matchTransactionToClient(transaction, clients);
    
    let projectMatch = { project: undefined, confidence: 0, reason: '' };
    if (clientMatch.client) {
      const clientProjects = projects.filter(p => p.client_id === clientMatch.client.id);
      projectMatch = await matchTransactionToProject(
        transaction,
        clientMatch.client,
        clientProjects
      );
    }

    const totalConfidence = (clientMatch.confidence * 0.6 + 
                             (projectMatch.confidence || 0) * 0.4);

    let matchType: MatchingResult['matchType'] = 'none';
    if (clientMatch.confidence === 1.0) {
      matchType = 'exact';
    } else if (clientMatch.confidence > 0.7) {
      matchType = 'fuzzy';
    } else if (projectMatch.confidence > 0.5) {
      matchType = 'date_amount';
    }

    results.push({
      transaction,
      suggestedClient: clientMatch.client,
      suggestedProject: projectMatch.project,
      confidence: totalConfidence,
      matchType,
      reason: [clientMatch.reason, projectMatch.reason]
        .filter(r => r)
        .join(' | ')
    });
  }

  return results;
}

/**
 * 거래에 프로젝트 연결
 */
export async function linkTransactionToProject(
  transactionId: string,
  projectId: string,
  clientId?: string
): Promise<void> {
  const supabase = createClient();
  
  const updateData: any = {
    project_id: projectId,
    updated_at: new Date().toISOString()
  };

  if (clientId) {
    updateData.client_id = clientId;
  }

  const { error } = await supabase
    .from('tax_transactions')
    .update(updateData)
    .eq('id', transactionId);

  if (error) {
    console.error('Error linking transaction to project:', error);
    throw error;
  }
}

/**
 * 거래 프로젝트 연결 해제
 */
export async function unlinkTransactionFromProject(
  transactionId: string
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('tax_transactions')
    .update({
      project_id: null,
      client_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId);

  if (error) {
    console.error('Error unlinking transaction from project:', error);
    throw error;
  }
}