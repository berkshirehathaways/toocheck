// 시드 텍스트가 forbidden-words 사전을 통과하는지 검사 (CI/사전 검수용).
import { findForbiddenWords } from '../lib/forbidden-words';
import {
  candidates,
  checkCards,
  promises,
} from '../mocks/seed';

const failures: Array<{ where: string; word: string; context: string }> = [];

const collect = (where: string, text: string | undefined) => {
  if (!text) return;
  for (const h of findForbiddenWords(text)) {
    failures.push({ where, word: h.word, context: h.context });
  }
};

for (const c of candidates) collect(`candidate.${c.id}.party`, c.party);
for (const p of promises) {
  collect(`promise.${p.id}.title`, p.title);
  collect(`promise.${p.id}.body`, p.body);
  collect(`promise.${p.id}.crossCheckText`, p.crossCheckText);
}
for (const cc of checkCards) {
  collect(`checkCard.${cc.id}.title`, cc.title);
  collect(`checkCard.${cc.id}.body`, cc.body);
}

if (failures.length === 0) {
  console.log('[check:forbidden] OK — 시드 전 텍스트가 금지어 사전을 통과했습니다.');
  process.exit(0);
}

console.error('[check:forbidden] 금지어 매칭이 발견되었습니다:');
for (const f of failures) {
  console.error(`  - ${f.where} / "${f.word}" in: ${f.context}`);
}
process.exit(1);
