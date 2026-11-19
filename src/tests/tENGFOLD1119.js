// 🕸 엔진 지도 접기/펼치기(enfold1 11/19 · 정범님 「끄는 게 아니라 접고/펼치게」) 시험 — node src/tests/tENGFOLD1119.js
// ① ✕ 오늘 숨김이 없고 접기·펼치기 단추 ② 접힘은 기기에 기억(날짜로 안 풀림) ③ 옛 「오늘 숨김」 기기는 접힘으로 옮김 ④ 아주 끄기(EN_OFF)는 그대로 ⑤ 팝업 없음
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const a = src.indexOf('const EN_HIDE ='), b = src.indexOf('const EN_CFG_F'); const blk = src.slice(a, b), clk = src.slice(src.indexOf("document.addEventListener('click', async (e) => { const b = e.target.closest && e.target.closest('[data-enx]')"), src.indexOf('const navLedHero'));
ok(a > 0 && b > a && clk.length > 100, '엔진 지도 코드 찾음');
ok(!/data-enx="x"/.test(blk) && !/k === 'x'/.test(clk), '✕ 오늘 숨김 단추·동작 없음');
ok(/data-enx="fold"/.test(blk) && /▾ 접기/.test(blk) && /▸ 펼치기/.test(blk) && /k === 'fold'/.test(clk), '▾ 접기 / ▸ 펼치기 단추');
ok(/class="en-bd"/.test(blk) && /en-sum/.test(blk) && /오늘 개입/.test(blk), '접으면 머리줄(제목·요약 숫자)만 남음 · 본문은 en-bd 안');
ok(/enLs\(EN_FOLD, f \? '1' : '0'\)/.test(clk) && !/EN_FOLD[^;]*enKDay/.test(blk + clk), '접힘 기억 = 기기 저장 · 날짜 없음');
// ③ 옛 숨김 옮기기 — 줄을 그대로 떼어 돌려 봄
const m = blk.match(/if \(enLs\(EN_HIDE\) != null\) \{[^\n]*\}\n/); ok(!!m, '옛 숨김 옮기기 줄 있음');
if (m) { const mem = {}; const enLs = (k, v) => { if (v === undefined) return k in mem ? mem[k] : null; if (v === null) delete mem[k]; else mem[k] = v; return null; }; const EN_HIDE = 'h', EN_FOLD = 'f';
  mem.h = '2026-11-19'; new Function('enLs', 'EN_HIDE', 'EN_FOLD', m[0])(enLs, EN_HIDE, EN_FOLD); ok(mem.f === '1' && !('h' in mem), '옛 「오늘 숨김」 기기 → 접힘 · 숨김 값 지움(카드는 사라지지 않음)');
  const m2 = { f: '0', h: 'x' }; const e2 = (k, v) => { if (v === undefined) return k in m2 ? m2[k] : null; if (v === null) delete m2[k]; else m2[k] = v; return null; }; new Function('enLs', 'EN_HIDE', 'EN_FOLD', m[0])(e2, 'h', 'f'); ok(m2.f === '0', '이미 펼침으로 고른 기기는 덮지 않음'); }
ok(/EN_OFF\) === '1'/.test(blk) && /data-enoff/.test(src) && /k === 'on'/.test(clk), '⚙ 아주 끄기·다시 보이기 그대로');
ok(!/\b(alert|confirm|prompt)\(/.test(blk + clk), 'alert·confirm·prompt 없음');
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
