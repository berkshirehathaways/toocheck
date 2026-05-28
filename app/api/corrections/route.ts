import { addCorrection, listCorrections, type CorrectionRequest } from '@/lib/correction-storage';
import { findForbiddenWords } from '@/lib/forbidden-words';
import { apiError, jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

interface SubmitBody {
  requesterType?: CorrectionRequest['requesterType'];
  targetCandidateId?: string;
  targetField?: string;
  factualClaim?: string;
  evidenceUrl?: string;
  email?: string;
  consent?: boolean;
}

const VALID_TYPES: CorrectionRequest['requesterType'][] = [
  'candidate_or_camp',
  'general',
  'press',
  'other',
];

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return apiError('bad_request', 'invalid JSON body');
  }
  if (!body.requesterType || !VALID_TYPES.includes(body.requesterType)) {
    return apiError('validation_failed', 'requesterType required');
  }
  if (!body.factualClaim || body.factualClaim.trim().length < 5) {
    return apiError('validation_failed', 'factualClaim required (min 5 chars)');
  }
  if (body.consent !== true) {
    return apiError('validation_failed', 'consent must be true');
  }
  const hits = findForbiddenWords(body.factualClaim);
  if (hits.length > 0) {
    return apiError('forbidden_words', '본문에 정치 중립성 정책에 어긋나는 표현이 포함되어 있습니다.', {
      details: { words: hits.map((h) => h.word) },
    });
  }
  const rec = addCorrection({
    requesterType: body.requesterType,
    targetCandidateId: body.targetCandidateId,
    targetField: body.targetField,
    factualClaim: body.factualClaim.trim(),
    evidenceUrl: body.evidenceUrl,
    email: body.email,
    consent: true,
  });
  return jsonOk({ id: rec.id, receivedAt: rec.receivedAt }, { status: 201 });
}

export function GET() {
  // dev 편의용: 메모리에 쌓인 신고 목록 (mock 단계 한정)
  return jsonOk({ corrections: listCorrections() });
}
