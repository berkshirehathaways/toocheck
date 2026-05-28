'use client';

import * as React from 'react';
import Link from 'next/link';
import { AddressSearch, type AddressSearchResult } from './AddressSearch';
import { HudLabel } from './HudLabel';
import { RegistrationMarks } from './RegistrationMarks';

type Precision = 'sido' | 'sigungu_unique' | 'sigungu' | 'dong' | 'none';

interface SggListItem {
  sggId: string;
  sggName: string;
  candidateCount: number;
}

interface OfficeResult {
  officeKind: string;
  label: string;
  districtId: string | null;
  candidateCount: number;
  precision: Precision;
  sggIds: string[];
  sggList: SggListItem[];
  resolved: boolean;
  message: string;
}

interface LookupResponse {
  input: {
    sidoName: string;
    sigunguName?: string;
    bcode?: string;
    bname?: string;
  };
  sido: { name: string; matched: boolean };
  sigungu: { name: string | null; matched: boolean };
  resolvedHname: string | null;
  offices: OfficeResult[];
  meta: { coverageNote: string; dongPrecisionAvailable: boolean };
}

const PRECISION_LABEL: Record<Precision, string> = {
  dong: '동 단위 정밀',
  sigungu_unique: '선거구 확정',
  sigungu: '선거구 선택 필요',
  sido: '시·도 단위',
  none: '미매칭',
};

const PRECISION_TONE: Record<Precision, string> = {
  dong: 'text-lime',
  sigungu_unique: 'text-lime',
  sigungu: 'text-cyan',
  sido: 'text-cyan',
  none: 'text-dim',
};

function buildLookupUrl(addr: AddressSearchResult): string {
  const params = new URLSearchParams();
  params.set('sido', addr.sido);
  if (addr.sigungu) params.set('sigungu', addr.sigungu);
  if (addr.sigunguCode) params.set('sigunguCode', addr.sigunguCode);
  if (addr.bcode) params.set('bcode', addr.bcode);
  if (addr.bname) params.set('bname', addr.bname);
  if (addr.hname) params.set('hname', addr.hname);
  if (addr.zonecode) params.set('zonecode', addr.zonecode);
  return `/api/districts/lookup?${params.toString()}`;
}

export function DistrictLookupPanel() {
  const [addr, setAddr] = React.useState<AddressSearchResult | null>(null);
  const [data, setData] = React.useState<LookupResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelect = React.useCallback(async (result: AddressSearchResult) => {
    setAddr(result);
    setError(null);
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(buildLookupUrl(result), { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? `lookup failed (${res.status})`);
      }
      const json = (await res.json()) as LookupResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section className="relative hud-panel p-5 sm:p-6">
      <RegistrationMarks color="cyan" inset={8} />
      <HudLabel tone="cyan">우편번호·도로명·지번 모두 지원</HudLabel>
      <h2 className="mt-2 font-ko text-xl font-bold text-ink">주소로 내 지역구 후보 찾기</h2>
      <p className="label-ko mt-1 text-dim">
        카카오 우편번호로 검색합니다 · 입력한 주소는 서버에 저장되지 않고 룩업 즉시 휘발됩니다.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <AddressSearch onSelect={handleSelect} />
        {addr ? (
          <div className="text-sm text-ink/85">
            <p className="label-ko text-dim">검색된 주소</p>
            <p className="font-medium">{addr.roadAddress || addr.jibunAddress}</p>
            <p className="label-ko text-dim">
              {addr.sido} {addr.sigungu} {addr.bname}
              {addr.zonecode ? ` · 우편번호 ${addr.zonecode}` : ''}
            </p>
          </div>
        ) : (
          <p className="label-ko text-dim">
            주소 검색 버튼을 누르면 카카오 우편번호 검색창이 뜹니다.
          </p>
        )}
      </div>

      {loading ? (
        <p className="label-ko mt-5 text-dim">지역구 조회 중…</p>
      ) : error ? (
        <p className="label-ko mt-5 text-[#e0b075]">조회 실패: {error}</p>
      ) : data ? (
        <div className="mt-5 space-y-3">
          <p className="label-ko text-dim">
            {data.sido.name}
            {data.sigungu.name ? ` · ${data.sigungu.name}` : ''}
            {data.resolvedHname ? ` · ${data.resolvedHname}` : ''} ·{' '}
            <span className="text-ink/85">{data.meta.coverageNote}</span>
          </p>
          <ul className="divide-y divide-hair-soft border-y border-hair-soft">
            {data.offices.map((o) => (
              <li key={o.officeKind} className="py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-ko font-semibold text-ink">{o.label}</span>
                  <span className={'label-ko ' + PRECISION_TONE[o.precision]}>
                    {PRECISION_LABEL[o.precision]}
                  </span>
                  <span className="ml-auto label-ko tabular-nums text-ink/85">
                    후보 {o.candidateCount}명
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <p className="label-ko text-ink/75">{o.message}</p>
                  {o.districtId ? (
                    <Link
                      href={`/districts/${o.districtId}`}
                      className="label-ko shrink-0 border border-cyan px-3 py-1 text-cyan transition-colors hover:bg-cyan hover:text-bg"
                    >
                      자료 보기 →
                    </Link>
                  ) : null}
                </div>

                {/* 복수 선거구 fallback: 선거구 목록 노출 (거주 동에 따라 택1) */}
                {!o.resolved && o.sggList.length > 1 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {o.sggList.map((s) => (
                      <li
                        key={s.sggId}
                        className="label-ko border border-hair px-2 py-0.5 text-dim"
                      >
                        {s.sggName} · {s.candidateCount}명
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="label-ko text-dim">
            * 시·도지사·교육감·구청장은 전국 정확 매칭됩니다. 광역의원·기초의원은 선거구가
            1곳이면 자동 확정되고, 여러 곳이면 거주 동에 따라 위 선거구 중 하나입니다.
            동 단위 정밀 매칭은 조례 검수가 끝난 지역부터 순차 적용됩니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}
