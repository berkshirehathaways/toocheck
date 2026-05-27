import { readFileSync } from 'node:fs';
import path from 'node:path';

// public/fonts에 번들된 Pretendard OTF를 모듈 로드 시 1회 읽음.
const fontDir = path.join(process.cwd(), 'public', 'fonts');

export const pretendardRegular: ArrayBuffer = bufferToArrayBuffer(
  readFileSync(path.join(fontDir, 'Pretendard-Regular.otf'))
);
export const pretendardBold: ArrayBuffer = bufferToArrayBuffer(
  readFileSync(path.join(fontDir, 'Pretendard-Bold.otf'))
);

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.byteLength; i++) view[i] = buf[i] as number;
  return ab;
}

export const SATORI_FONTS = [
  { name: 'Pretendard', data: pretendardRegular, weight: 400 as const, style: 'normal' as const },
  { name: 'Pretendard', data: pretendardBold, weight: 700 as const, style: 'normal' as const },
];
