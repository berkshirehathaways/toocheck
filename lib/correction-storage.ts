// 결정 G1: 메모리 저장 (서버 재시작 시 휘발).
// 실데이터 단계엔 Supabase·Postgres 등으로 일괄 전환.

export interface CorrectionRequest {
  id: string; // 'mock-${timestamp}' (결정 G4)
  receivedAt: string; // ISO-8601
  requesterType: 'candidate_or_camp' | 'general' | 'press' | 'other';
  targetCandidateId?: string;
  targetField?: string;
  factualClaim: string;
  evidenceUrl?: string;
  email?: string;
  consent: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __toocheckCorrections: CorrectionRequest[] | undefined;
}

const store: CorrectionRequest[] =
  globalThis.__toocheckCorrections ?? (globalThis.__toocheckCorrections = []);

export function addCorrection(input: Omit<CorrectionRequest, 'id' | 'receivedAt'>): CorrectionRequest {
  const now = Date.now();
  const rec: CorrectionRequest = {
    id: `mock-${now}`,
    receivedAt: new Date(now).toISOString(),
    ...input,
  };
  store.push(rec);
  // eslint-disable-next-line no-console
  console.log('[correction] received', rec);
  return rec;
}

export function listCorrections(): CorrectionRequest[] {
  return [...store];
}
