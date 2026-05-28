# 작업 이슈 분할안 — mock-first localhost MVP

본 문서는 PRD v0.1을 **mock 데이터 기반 localhost MVP**로 구현하기 위한 이슈 분할안이다.
각 이슈는 **단일 PR로 머지될 수 있는 단위**이며, 각 이슈 본문 하단의 `🚨 사람 결정 필요` 섹션은 작업 착수 전에 별도로 결정해야 한다.

## 단계 구성

### Phase −1 — 의사결정 (모든 이슈의 선결 조건)
0. [#0 사람 결정 필요 사항 — 일괄 트래커](./00-decisions.md)

### Phase 0 — 기반 (순차)
1. [#1 프로젝트 세팅](./01-project-setup.md)
2. [#2 도메인 타입 & mock 시드](./02-domain-types-mock-seed.md)
3. [#3 도메인 유틸 함수](./03-domain-utils.md)

### Phase 1 — 사용자 화면 (`#4` 이후 `#5~#9` 병렬 가능)
4. [#4 디자인 시스템 & 공통 컴포넌트](./04-design-system.md)
5. [#5 랜딩 + 서비스 원칙 페이지](./05-landing-principles.md)
6. [#6 지역 선택 + 후보 목록](./06-district-candidates.md)
7. [#7 후보 상세](./07-candidate-detail.md)
8. [#8 후보 비교표](./08-compare-table.md)
9. [#9 공유 카드 생성](./09-share-card.md)

### Phase 2 — 부가
10. [#10 정정 요청 폼](./10-correction-form.md)
11. [#11 Mock API routes](./11-mock-api.md)
12. [#12 출시 전 QA 체크리스트 & 자동화 테스트](./12-qa-checklist.md)

### Phase 3 — 실데이터 수집 (mock → real 전환)
13. [#13 실데이터 수집 파이프라인 — 소스 매핑 & 갭 트래커](./13-data-ingestion.md)

## 의존 그래프

```
#1 ─▶ #2 ─▶ #3
              ╲
               #4 ─▶ {#5, #6, #7, #8, #9}
                          ╲
                           #10, #11, #12
```

`#11(Mock API)`는 화면 이슈들과 병행 가능하지만, **`#11`이 먼저 끝나면 #5~#9는 곧장 API 클라이언트를 사용**하는 식으로 진행하는 것을 권장.

## 권장 작업 순서

1. Phase 0 세 이슈를 한 사람이 빠르게 끝낸다 (반나절).
2. `#4`를 마친 뒤 `#5~#9`를 동시 진행 (병렬화 효과 최대).
3. `#10~#12`는 사용자 화면이 90% 끝난 뒤 묶어서 처리.

## "사람 결정 필요" 일괄 검토

각 이슈 하단의 `🚨 사람 결정 필요` 항목은 **[#0 의사결정 트래커](./00-decisions.md)** 에 카테고리별(A~G)로 모아 두었다.
**모든 작업 이슈 착수 전에 #0의 결정을 먼저 마치는 것**을 권장한다 (특히 A·B·D1은 #2/#5/#7의 시드와 콘텐츠에 직접 영향).

## GitHub 이슈로 일괄 등록

검토가 끝나면 아래로 12개 이슈를 한 번에 생성:

```bash
for f in $(ls docs/issues/[0-9][0-9]-*.md | sort); do
  title=$(head -1 "$f" | sed 's/^# //')
  gh issue create --title "$title" --body-file "$f"
done
```

라벨/마일스톤 등록을 함께 하고 싶다면 `--label "phase-0,mock"` 등을 추가.
