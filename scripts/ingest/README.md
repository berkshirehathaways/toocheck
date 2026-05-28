# 수집 파이프라인 — #14 §1 확정 명세

운영자가 CLI로 실행하는 수집 스크립트. 각 스크립트는 **재현 가능한 curl/파서 패턴**을 코드화.
각 스크립트는 **단일 후보 수집** 또는 **단일 입력 단위** 기준. 전국 확장은 별도 wave PR.

## 실행 방법

```bash
# 종로구 1번 후보 (유찬종) 풀 파이프라인 예
HUBOID=100154016
ELECTION_ID=0020260603  # info.nec 형식 (앞에 00)

pnpm tsx scripts/ingest/02-parse-detail-html.ts $HUBOID > data/curated/${HUBOID}_detail.json
pnpm tsx scripts/ingest/06-fetch-wikidata.ts "유찬종" "1959-11-20" > data/curated/${HUBOID}_wiki.json
pnpm tsx scripts/ingest/04-fetch-smc.ts 872 9 > data/curated/${HUBOID}_smc.json
```

## 스크립트 목록

| # | 파일 | 입력 | 출력 |
|---|---|---|---|
| 01 | fetch-candidate-index.ts | sgId, sgTypecode, regionId | huboid 인덱스 + PDF 경로 |
| 02 | parse-detail-html.ts | huboid (info.nec) | 정형 14 필드 JSON |
| 03 | fetch-promise-text.ts | ocrCnvrSeqNo | 5대공약 본문 + NEC 4요소 |
| 04 | fetch-smc.ts | mno, period | 서울시의원 의정활동 |
| 05 | fetch-peti.ts | 성명 | 재산 카테고리별 + 가족 합계 |
| 06 | fetch-wikidata.ts | 이름, NEC 출생일 | Wikidata 정보 (가드레일 통과 시만) |

## 검수 게이트

각 스크립트는 `reviewStatus: 'pending'` 으로 출력. 운영자가 검수 후 `'reviewed'` 로 승격.
**§17 의심 단어 자동 검출**: `lib/forbidden-words.ts` 매칭 시 `needsReview: true`.
