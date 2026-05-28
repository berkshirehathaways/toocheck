'use client';

import * as React from 'react';
import { useKakaoPostcodePopup } from 'react-daum-postcode';
import type { Address } from 'react-daum-postcode';

export interface AddressSearchResult {
  /** 우편번호 5자리 */
  zonecode: string;
  /** 시도명 — "서울특별시" */
  sido: string;
  /** 시군구명 — "종로구" */
  sigungu: string;
  /** 시군구 코드 5자리 — "11110" */
  sigunguCode: string;
  /** 법정동코드 10자리 — "1111010100" */
  bcode: string;
  /** 법정동명 — "청운동" */
  bname: string;
  /** 행정동명(있을 경우) — "청운효자동" */
  hname: string;
  /** 도로명 전체 주소 */
  roadAddress: string;
  /** 지번 전체 주소 */
  jibunAddress: string;
}

export interface AddressSearchProps {
  onSelect: (result: AddressSearchResult) => void;
  buttonLabel?: string;
  className?: string;
}

const POPUP_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

function toResult(addr: Address): AddressSearchResult {
  return {
    zonecode: addr.zonecode ?? '',
    sido: addr.sido ?? '',
    sigungu: addr.sigungu ?? '',
    sigunguCode: addr.sigunguCode ?? '',
    bcode: addr.bcode ?? '',
    bname: addr.bname ?? '',
    hname: addr.hname ?? '',
    roadAddress: addr.roadAddress ?? '',
    jibunAddress: addr.jibunAddress ?? '',
  };
}

export function AddressSearch({
  onSelect,
  buttonLabel = '주소 검색',
  className,
}: AddressSearchProps) {
  const open = useKakaoPostcodePopup(POPUP_SCRIPT_URL);

  const handleClick = React.useCallback(() => {
    open({
      onComplete: (data: Address) => {
        onSelect(toResult(data));
      },
    });
  }, [open, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        'label-ko-lg inline-flex items-center justify-center gap-2 border border-cyan bg-cyan px-5 py-3 text-bg transition-colors hover:bg-ink hover:border-ink'
      }
    >
      {buttonLabel} →
    </button>
  );
}
