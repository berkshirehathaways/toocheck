import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/site/config';
import { listDistricts, listElections } from '@/mocks/loader';

export const metadata = {
  title: '지역 선택',
  description: '내 지역구를 선택해 후보자를 비교해 보세요. mock 단계에는 테스트 지역 1곳을 제공합니다.',
};

export default function DistrictListPage() {
  const elections = listElections();
  const lookups = elections.map((e) => ({ election: e, districts: listDistricts(e.id) }));

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">districts</p>
        <h1 className="text-2xl font-semibold tracking-tight">지역 선택</h1>
        <p className="text-sm text-muted-foreground">
          정식 베타 단계에서는 우편번호·주소 검색으로 지역구를 안내합니다. 현재 mock 단계에서는
          아래 테스트 지역 1곳을 이용해 주세요.
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-border bg-muted/30 p-5">
        <h2 className="text-sm font-semibold">우편번호로 지역 찾기 (준비 중)</h2>
        <div aria-disabled className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            placeholder="우편번호 5자리"
            disabled
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="button" disabled>
            검색
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          실 데이터 단계에서 도로명·우편번호 기반 매칭으로 연결됩니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">테스트 지역 바로가기</h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <Button asChild size="lg">
            <Link href={`/districts/${SITE.testDistrictId}`}>
              샘플 시 가나구청장 (2026 지방선거) 살펴보기
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            본 District 및 후보 정보는 시연용 가상 데이터입니다. 실제 지역구·후보·정당과 무관합니다.
          </p>
        </div>
      </section>

      <section className="space-y-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">등록된 선거</p>
        <ul className="space-y-1">
          {lookups.map(({ election, districts }) => (
            <li key={election.id}>
              · {election.name} ({election.electionDate}) — District {districts.length}개
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
