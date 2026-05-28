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
  /** 후보 상세 페이지가 게시된 경우에만 존재(비례대표는 개인 페이지 없음). */
  id?: string;
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

// 정당별 스타일 — 텍스트색(AA 대비 확보)·칩 좌측 액센트색(한눈 식별).
const PARTY_STYLE: Record<string, { text: string; accent: string }> = {
  더불어민주당: { text: 'text-[#6ea8ff]', accent: 'border-l-[#3b6fd4]' },
  국민의힘: { text: 'text-[#ff8a8a]', accent: 'border-l-[#d44b4b]' },
  개혁신당: { text: 'text-[#ff9e64]', accent: 'border-l-[#d97636]' },
  조국혁신당: { text: 'text-[#7fd1ff]', accent: 'border-l-[#3aa3e0]' },
  진보당: { text: 'text-[#ff7b9c]', accent: 'border-l-[#d44b6b]' },
  정의당: { text: 'text-[#ffd24a]', accent: 'border-l-[#d4a82a]' },
};
const DEFAULT_PARTY = { text: 'text-ink/75', accent: 'border-l-hair' };
const NONPARTY = { text: 'text-ink/55', accent: 'border-l-hair' };

function partyStyle(party: string): { text: string; accent: string } {
  if (party === '무소속') return NONPARTY;
  return PARTY_STYLE[party] ?? DEFAULT_PARTY;
}

/** 후보 칩 — id가 있으면 상세 페이지로 링크(클릭 가능), 없으면(비례대표) 비링크 표시. */
function CandidateChip({ c }: { c: CandidateLite }) {
  const ps = partyStyle(c.party);
  const inner = (
    <>
      {c.ballotNumber > 0 ? (
        <span className="tabular-nums font-semibold text-cyan">{c.ballotNumber}</span>
      ) : null}
      <span className="font-semibold text-ink">{c.name}</span>
      <span className={ps.text}>{c.party}</span>
    </>
  );
  const base = `label-ko flex min-h-[40px] items-center gap-1.5 border border-hair border-l-2 px-2.5 py-2 ${ps.accent}`;

  if (!c.id) {
    return <span className={`${base} bg-white/[0.02] text-ink/70`}>{inner}</span>;
  }
  return (
    <Link
      href={`/candidates/${c.id}`}
      aria-label={`기호 ${c.ballotNumber} ${c.name} (${c.party}) 후보 상세 보기`}
      className={`${base} group bg-white/[0.04] transition-colors hover:border-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan`}
    >
      {inner}
      <span aria-hidden className="text-dim transition-colors group-hover:text-cyan">
        →
      </span>
    </Link>
  );
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
      <h2 className="mt-2 font-ko text-2xl font-bold text-ink sm:text-3xl">시·군·구로 후보 찾기</h2>
      <p className="label-ko mt-1.5 text-dim">
        예: <span className="text-ink/80">양천구</span> 입력 → 그 지역의 시·도지사·교육감·구청장·시·도의원·구의원 후보를 한 번에.
      </p>

      <div ref={boxRef} className="relative mt-5">
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
          className="w-full border-2 border-hair bg-bg px-4 py-3.5 text-base text-ink outline-none transition-colors focus:border-cyan"
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
                    'label-ko flex w-full items-baseline gap-2 px-4 py-2.5 text-left ' +
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
            {data.sido} {data.sigungu} · 2026 지방선거 후보{' '}
            <span className="text-cyan">· 후보를 누르면 상세 페이지로 이동합니다</span>
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
                <div className="mt-2 space-y-2.5">
                  {race.groups.map((g) => (
                    <div key={g.sggId}>
                      {race.sggCount > 1 ? (
                        <p className="label-ko flex items-center gap-1.5 text-ink/65">
                          <span aria-hidden className="inline-block h-1 w-1 bg-cyan/70" />
                          {g.sggName}
                        </p>
                      ) : null}
                      <ul className="mt-1.5 flex flex-wrap gap-2">
                        {g.candidates.map((c) => (
                          <li key={`${c.sggId}-${c.ballotNumber}-${c.name}`}>
                            <CandidateChip c={c} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="label-ko text-ink/55">
            * 후보 명단은 중앙선거관리위원회 등록 자료 기준입니다. 시·도의원·구의원은 거주 동에 따라
            위 선거구 중 하나에 투표합니다. 공약·재산 등 상세 자료는 순차 공개됩니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}
