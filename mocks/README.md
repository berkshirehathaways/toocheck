# mocks/

mock 단계 시드 데이터 + in-memory loader. 모든 시드는 가상이며, 실제 정당·후보·지역과 무관합니다.

## 파일

- `seed.ts` — 8엔티티 시드 (Election 1 · District 1 · Candidate 4 · Disclosure 3 · Promise 16 · CheckCard 10)
- `loader.ts` — 9개 조회 함수 + `getCompareData` 합성. 모두 동기·순수, 반환값 deep clone.

## 후보 추가하는 방법

1. `seed.ts` `candidates` 배열에 `Candidate` 항목 추가
2. `disclosures` 배열에 `CandidateDisclosure` 항목 추가 (needs_check는 생략 가능)
3. `promises` / `checkCards` 배열에 후보 ID로 묶인 항목 추가
4. `pnpm typecheck` 확인

## 정정 후 시드 업데이트 절차

1. 정정 요청 받은 항목의 원문 출처 확인
2. 해당 후보의 `disclosure`/`promise`/`checkCard` 객체 수정
3. `sourceCheckedAt` 을 정정 반영 일자로 업데이트
4. 커밋 메시지에 `data: update cand_XXX (sourceCheckedAt=YYYY-MM-DD)` 형식 권장

## 규약 (결정 동결 사항)

- 모든 금액은 **원 단위** (예: 12억 3,400만 → `1234000000`) — PRD §12.2
- 모든 날짜는 ISO-8601 (`YYYY-MM-DD`), 표시 단계에서 `YYYY년 M월 D일 기준`으로 변환 — 결정 C4
- District 자료 기준일 = District 내 reviewed 후보 disclosure의 `sourceCheckedAt` **최소값** — 결정 C6
- 자산 상위 분위는 District 단위 **동적** 계산, 상위 20% — 결정 D3·D6
- 모든 sourceUrl은 `https://example.test/...` placeholder, 실 데이터 단계에 교체
- `reviewedBy` 는 mock 단계 `"admin"` 고정 — 결정 C5

## 시나리오 (결정 C1: 4명)

| 기호 | 시나리오 | 전과 | 체납 | 자산 분위 | 공약 구체성 | reviewStatus |
|---|---|---|---|---|---|---|
| 1 | 무난 | 없음 | 없음 | 하위 | 높음(평균 4.2) | reviewed |
| 2 | 전과 1건(도로교통법·벌금) + 청렴 공약 | 1건 | 없음 | 중위 | 보통(평균 2.0) | reviewed |
| 3 | 체납 1건(완납) + 부동산 비중 상위 + 주거·조세 공약 | 없음 | 1건 | 상위 | 낮음(평균 0.8) | reviewed |
| 4 | 자료 입력 전 (시연용 비노출 케이스) | — | — | — | n/a | needs_check |
