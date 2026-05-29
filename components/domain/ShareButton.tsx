'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface KakaoShareContent {
  title: string;
  description: string;
  imageUrl: string;
  link: { mobileWebUrl: string; webUrl: string };
}
interface KakaoSDK {
  isInitialized: () => boolean;
  Share: {
    sendDefault: (opts: {
      objectType: 'feed';
      content: KakaoShareContent;
      buttons?: { title: string; link: { mobileWebUrl: string; webUrl: string } }[];
    }) => void;
  };
}
declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

export interface ShareButtonProps {
  /** 공유 대상 경로 (예: /candidates/123). 절대 URL은 런타임에 origin과 결합. */
  path: string;
  title: string;
  description: string;
  /** share-card PNG 경로 (예: /api/share-card/candidate/123). 카카오 공유 이미지로 사용. */
  imagePath?: string;
  className?: string;
  /** 버튼 라벨/크기 변형. compact는 아이콘+짧은 라벨. */
  size?: 'sm' | 'md';
}

const MENU_WIDTH = 176; // w-44

function ShareIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" />
      <path d="M8.3 10.7 15.7 6.3M8.3 13.3l7.4 4.4" />
    </svg>
  );
}

export function ShareButton({ path, title, description, imagePath, className, size = 'md' }: ShareButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [kakaoReady, setKakaoReady] = React.useState(false);
  const [canNativeShare, setCanNativeShare] = React.useState(false);
  // 팝오버가 오른쪽으로 넘치면 왼쪽 기준으로 뒤집어 화면 밖 잘림을 막는다.
  const [align, setAlign] = React.useState<'start' | 'end'>('start');
  const boxRef = React.useRef<HTMLDivElement>(null);

  const toggleOpen = React.useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next && boxRef.current) {
        const rect = boxRef.current.getBoundingClientRect();
        setAlign(rect.left + MENU_WIDTH <= window.innerWidth - 8 ? 'start' : 'end');
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    setKakaoReady(Boolean(window.Kakao?.isInitialized?.()));
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const absUrl = React.useCallback(
    (p: string) => (typeof window !== 'undefined' ? new URL(p, window.location.origin).href : p),
    []
  );

  const shareUrl = () => absUrl(path);

  const doKakao = () => {
    const k = window.Kakao;
    if (!k?.isInitialized()) return;
    const url = shareUrl();
    k.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: imagePath ? absUrl(imagePath) : absUrl('/og-default.png'),
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: '자세히 보기', link: { mobileWebUrl: url, webUrl: url } }],
    });
    setOpen(false);
  };

  const doNativeShare = async () => {
    try {
      await navigator.share({ title, text: description, url: shareUrl() });
    } catch {
      /* 사용자 취소 등은 무시 */
    }
    setOpen(false);
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 클립보드 접근 불가 시 무시 */
    }
  };

  const itemCls =
    'label-ko flex w-full items-center gap-2 px-3 py-2.5 text-left text-ink/85 transition-colors hover:bg-cyan/10 hover:text-cyan';

  return (
    <div ref={boxRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'label-ko inline-flex items-center gap-1.5 border border-hair text-ink/85 transition-colors hover:border-cyan hover:text-cyan',
          size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2'
        )}
      >
        <ShareIcon />
        공유
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-20 mt-1 w-44 border border-hair bg-bg shadow-lg',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {kakaoReady ? (
            <button type="button" role="menuitem" onClick={doKakao} className={itemCls}>
              <span aria-hidden className="inline-block h-2 w-2 bg-[#FEE500]" />
              카카오톡 공유
            </button>
          ) : null}
          {canNativeShare ? (
            <button type="button" role="menuitem" onClick={doNativeShare} className={itemCls}>
              <ShareIcon />
              공유하기
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={doCopy} className={itemCls}>
            <span aria-hidden className="inline-block h-2 w-2 border border-cyan/70" />
            {copied ? '링크 복사됨 ✓' : '링크 복사'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
