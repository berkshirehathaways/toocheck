// 결정 F15: 자체 정의 에러 코드 + HTTP status, {error:{code,message}} 표준 포맷
import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'not_found'
  | 'bad_request'
  | 'invalid_district'
  | 'invalid_candidate'
  | 'invalid_sort'
  | 'validation_failed'
  | 'forbidden_words';

interface ApiErrorOptions {
  status?: number;
  details?: Record<string, unknown>;
}

const DEFAULT_STATUS: Record<ApiErrorCode, number> = {
  not_found: 404,
  bad_request: 400,
  invalid_district: 400,
  invalid_candidate: 400,
  invalid_sort: 400,
  validation_failed: 400,
  forbidden_words: 422,
};

export function apiError(code: ApiErrorCode, message: string, opts?: ApiErrorOptions) {
  const status = opts?.status ?? DEFAULT_STATUS[code];
  return NextResponse.json(
    { error: { code, message, ...(opts?.details ? { details: opts.details } : {}) } },
    { status }
  );
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
