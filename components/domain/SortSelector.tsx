'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SORT_KEYS, SORT_LABEL, isSortKey, type SortKey } from '@/lib/api/sort';

export interface SortSelectorProps {
  basePath: string;
  current: SortKey;
}

export function SortSelector({ basePath, current }: SortSelectorProps) {
  const router = useRouter();
  const params = useSearchParams();
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (!isSortKey(v)) return;
    const p = new URLSearchParams(params?.toString());
    if (v === 'ballot') p.delete('sort');
    else p.set('sort', v);
    const qs = p.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  return (
    <label className="mono mono-10 inline-flex items-center gap-2 text-dim">
      <span aria-hidden>정렬 //</span>
      <select
        value={current}
        onChange={onChange}
        className="mono mono-10 border border-hair bg-bg px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-cyan"
        aria-label="정렬"
      >
        {SORT_KEYS.map((k) => (
          <option key={k} value={k}>
            {SORT_LABEL[k]}
          </option>
        ))}
      </select>
    </label>
  );
}
