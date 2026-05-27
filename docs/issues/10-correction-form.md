# [#10] 정정 요청 폼

## 목적
사용자/캠프/언론이 데이터 오류를 신고할 수 있게 한다. mock 단계에선 console.log + 로컬 파일 append + 토스트만 처리.

> 참조: PRD §13.5, §15.7, §18

## 산출물

```
app/(public)/correction/
├── page.tsx                                # 정정 요청 폼
└── thank-you/
    └── page.tsx                            # 접수 완료 안내

app/api/correction-requests/
└── route.ts                                # POST (mock 처리)

components/domain/
└── CorrectionForm.tsx                       # 폼 본체

lib/
└── correction-storage.ts                    # mock 영속화 (메모리 + 로컬 파일)
```

## 폼 필드 (PRD §15.7)

| 필드 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 요청자 유형 | radio | ✅ | 후보자/캠프 / 일반 사용자 / 언론 / 기타 |
| 대상 후보 | select | ✅ | District 내 후보 (query로 prefill) |
| 오류 항목 | select | ✅ | 재산/납세/체납/병역/전과/공약/기타 (query로 prefill) |
| 요청 내용 | textarea | ✅ | 20자 이상 |
| 근거 링크 | url | ❌ | http(s)만 |
| 첨부 자료 | file | ❌ | mock 단계엔 비활성 |
| 연락처 이메일 | email | ❌ | 권장 (회신용) |
| 개인정보 동의 | checkbox | ✅ | 정확한 문구 사람 결정 |

검증: `react-hook-form` + `zod`

## API (mock)

```ts
// POST /api/correction-requests
interface CorrectionRequestPayload {
  candidateId: string;
  fieldName: 'asset' | 'tax' | 'arrears' | 'military' | 'criminal' | 'promise' | 'other';
  requesterType: 'candidate_or_camp' | 'general' | 'press' | 'other';
  message: string;
  evidenceUrl?: string;
  contactEmail?: string;
  consent: true;
}
interface CorrectionRequestResponse {
  id: string;         // e.g. mock-${Date.now()}
  status: 'received';
  receivedAt: string;
}
```

mock 처리:
- `console.log(payload)`
- `lib/correction-storage.ts` 가 메모리 배열에 append (서버 재시작 시 휘발)
- 선택: `mocks/correction-log.json` 파일에 append (gitignored)

응답 200 후 → `/correction/thank-you?id=...`

## thank-you 페이지
- "접수가 완료되었습니다 (mock-ID: ${id})" 표시
- PRD §18.3 공지 문구
- 다른 후보 보기 / 비교표 보기 / 홈 링크

## 후보 상세에서의 진입
- `<CorrectionLink candidateId fieldName />` 클릭 시 query prefill:
  - `/correction?candidateId=...&fieldName=asset`

## 수용 기준
- [ ] 필수 필드 검증 (react-hook-form + zod)
- [ ] 후보 상세에서 진입 시 candidateId/fieldName 자동 채움
- [ ] 제출 후 thank-you 페이지로 redirect
- [ ] thank-you 페이지에 PRD §18.3 공지 문구 표시
- [ ] 폼 안내 문구 금지어 검사 통과
- [ ] mock-ID가 thank-you 페이지에 표시
- [ ] 폼 에러 메시지가 한국어
- [ ] disabled 첨부 파일 필드에 "현재 첨부는 지원하지 않습니다" 명시
- [ ] 동의 체크박스 미체크 시 제출 불가

## 의존
- #2, #4

## Out of scope
- 실제 데이터 영속화 (DB)
- 첨부 파일 업로드 처리
- 관리자 대시보드 (#13 후속)
- Cloudflare Turnstile (배포 단계)

## 🚨 사람 결정 필요

- [ ] **연락처 이메일 필수 여부**: 권장(권장, 회신 가능성↑) vs 필수 (진입 장벽↑)
- [ ] **첨부 파일**: mock에선 비활성(권장) / 입력만 받고 무시 / 로컬 파일로 저장
- [ ] **반복 제출 방지**: mock에선 무시(권장) vs 간단한 디바운싱
- [ ] **개인정보 동의 문구**: 정확한 워딩
  - 예시안: "정정 요청 처리 목적으로 입력하신 내용과 (선택 시) 이메일을 보관·이용합니다. 보관 기간은 처리 완료 후 30일 이내 파기합니다."
- [ ] **mock 영속화 강도**: 메모리만(권장, 단순) vs 로컬 JSON 파일 append vs SQLite
- [ ] **mock-ID 사용자 노출**: 노출(권장, 추적 가능성 안내) vs 비공개
- [ ] **요청자 유형 "기타"**: 자유 텍스트 1줄 추가 표시 여부
- [ ] **폼 제출 후 화면**: 별도 페이지(권장) vs 같은 페이지에 토스트만
