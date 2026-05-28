'use client';

import * as React from 'react';
import Link from 'next/link';
import { HudLabel } from './HudLabel';
import { RegistrationMarks } from './RegistrationMarks';

interface SigunguItem {
  sido: string;
  sigungu: string;
}

interface CandidateLite {
  name: string;
  party: string;
  ballotNumber: number;
  sggId: string;
  sggName: string;
  proportionalCount?: number;
}

interface SggGroup {
  sggName: string;
  sggId: string;
  candidates: CandidateLite[];
}

interface RaceResult {
  officeKind: string;
  label: string;
  level: 'sido' | 'sigungu';
  candidateCount: number;
  sggCount: number;
  groups: SggGroup[];
}

interface RegionResult {
  sido: string;
  sigungu: string;
  matched: boolean;
  races: RaceResult[];
}

const PARTY_TONE: Record<string, string> = {
  더불어민주당: 'text-[#5b8def]',
  국민의힘: 'text-[#e06b6b]',
  무소속: 'text-dim',
};

function partyClass(party: string): string {
  return PARTY_TONE[party] ?? 'text-ink/70';
}

export function RegionSearch() {
  const [list, setList] = React.useState<SigunguItem[]>([]);
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [selected, setSelected] = React.useState<SigunguItem | null>(null);
  const [data, setData] = React.useState<RegionResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch('/api/districts/sigungu-list', { cache: 'force-cache' })
      .then((r) => r.json())
      .then((j) => setList(j.sigungu ?? []))
      .catch(() => setError('지역 목록을 불러오지 못했습니다.'));
  }, []);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const suggestions = React.useMemo(() => {
    const q = query.replace(/\s/g, '');
    if (!q) return [];
    return list
      .filter((it) => (it.sigungu + it.sido).replace(/\s/g, '').includes(q))
      .slice(0, 8);
  }, [query, list]);

  const choose = React.useCallback(async (it: SigunguItem) => {
    setSelected(it);
    setQuery(`${it.sido} ${it.sigungu}`);
    setOpen(false);
    setError(null);
    setLoading(true);
    setData(null);
    try {
      const url = `/api/districts/by-region?sido=${encodeURIComponent(it.sido)}&sigungu=${encodeURIComponent(it.sigungu)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`조회 실패 (${res.status})`);
      setData((await res.json()) as RegionResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = suggestions[active];
      if (it) void choose(it);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <section className="relative hud-panel p-5 sm:p-6">
      <RegistrationMarks color="cyan" inset={8} />
      <HudLabel tone="cyan">내 지역구 후보 한눈에 보기</HudLabel>
      <h2 className="mt-2 font-ko text-xl font-bold text-ink">시·군·구로 후보 찾기</h2>
      <p className="label-ko mt-1 text-dim">
        예: <span className="text-ink/80">양천구</span> 입력 → 그 지역의 시·도지사·교육감·구청장·시·도의원·구의원 후보를 한 번에.
      </p>

      <div ref={boxRef} className="relative mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="시·군·구 이름을 입력하세요 (예: 양천구, 해운대구, 순천시)"
          className="label-ko w-full border border-hair bg-bg px-3 py-2.5 text-ink outline-none focus:border-cyan"
          aria-label="시군구 검색"
        />
        {open && suggestions.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full border border-hair bg-bg shadow-lg">
            {suggestions.map((it, i) => (
              <li key={`${it.sido}|${it.sigungu}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => void choose(it)}
                  className={
                    'label-ko flex w-full items-baseline gap-2 px-3 py-2 text-left ' +
                    (i === active ? 'bg-cyan/15 text-ink' : 'text-ink/80')
                  }
                >
                  <span className="font-medium">{it.sigungu}</span>
                  <span className="text-dim">{it.sido}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {loading ? (
        <p className="label-ko mt-5 text-dim">후보 조회 중…</p>
      ) : error ? (
        <p className="label-ko mt-5 text-[#e0b075]">{error}</p>
      ) : data ? (
        <div className="mt-5 space-y-4">
          <p className="label-ko text-dim">
            {data.sido} {data.sigungu} · 2026 지방선거 후보
          </p>
          {data.races.filter((race) => race.candidateCount > 0).map((race) => (
            <div key={race.officeKind} className="border-t border-hair-soft pt-3">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="font-ko font-semibold text-ink">{race.label}</h3>
                <span className="label-ko text-dim">후보 {race.candidateCount}명</span>
                {race.level === 'sigungu' && race.sggCount > 1 ? (
                  <span className="label-ko text-cyan">선거구 {race.sggCount}곳 · 거주 동에 따라 선택</span>
                ) : null}
              </div>
              {race.groups.length === 0 ? (
                <p className="label-ko mt-1 text-dim">등록 후보 없음</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {race.groups.map((g) => (
                    <div key={g.sggId}>
                      {race.sggCount > 1 ? (
                        <p className="label-ko text-dim">{g.sggName}</p>
                      ) : null}
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {g.candidates.map((c) => (
                          <li
                            key={`${c.sggId}-${c.ballotNumber}-${c.name}`}
                            className="label-ko border border-hair px-2 py-1 text-ink/85"
                          >
                            {c.ballotNumber > 0 ? (
                              <span className="text-cyan tabular-nums">{c.ballotNumber} </span>
                            ) : null}
                            <span className="font-medium">{c.name}</span>{' '}
                            <span className={partyClass(c.party)}>{c.party}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="label-ko text-dim">
            * 후보 명단은 중앙선거관리위원회 등록 자료 기준입니다. 시·도의원·구의원은 거주 동에 따라
            위 선거구 중 하나에 투표합니다. 공약·재산 등 상세 자료는 순차 공개됩니다.{' '}
            <Link href="/districts" className="text-cyan hover:underline">
              테스트 지역 상세 보기
            </Link>
          </p>
        </div>
      ) : null}
    </section>
  );
}
