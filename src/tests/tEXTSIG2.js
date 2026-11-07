// tEXTSIG2 — 11/07 하루 보고: 🌐 외부 정보 지문에서 교보 표지 주소의 '?t=시각 숫자'를 뺌(교보 다시 볼 때마다 '바뀜(옛 값 보관)' 165/165 되풀이) · 옛 지문도 저장된 값으로 다시 만들어 같음(resign)
const fs = require('fs'); const path = require('path'); const f = [path.join(__dirname, '../../readnow-ext-core.js'), path.join(__dirname, '../readnow-ext-core.js')].find((p) => fs.existsSync(p));
const m = { exports: {} }; new Function('module', 'exports', 'globalThis', 'window', fs.readFileSync(f, 'utf8'))(m, m.exports, {}, {}); const X = m.exports; let bad = 0; const ok = (c, t) => { console.log((c ? '  ✓ ' : '  ❌ ') + t); if (!c) bad++; };
const d = { title: '세계의 끝', pages: 796, cover: 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/9788937479601.jpg?t=2990088', desc: '소개', url: 'https://product.kyobobook.co.kr/detail/S000000620694' };
const s1 = X.sig({ none: false, d }, 'kyobo'); const s2 = X.sig({ none: false, d: { ...d, cover: d.cover.replace('2990088', '3001234') } }, 'kyobo');
ok(s1 === s2, '교보 표지 주소의 t 숫자만 다르면 지문이 같음');
ok(s1 !== X.sig({ none: false, d: { ...d, cover: d.cover.replace('9788937479601', '9788937479602') } }, 'kyobo'), '표지 주소 길이 다르면 다름');
ok(s1 !== X.sig({ none: false, d: { ...d, pages: 800 } }, 'kyobo'), '쪽수가 바뀌면 다름');
ok(X.sameSig('kyobo', { sig: '옛방식:1', d }, s2) === 'resign', '옛 방식 지문은 저장된 값(d)으로 다시 만들어 같음(resign) — 고친 다음 날부터 바로 같음');
ok(X.sig({ none: false, d: { ...d, cover: null } }, 'kyobo') === X.sig({ none: false, d: { ...d, cover: null } }, 'kyobo'), '표지 없음(null)도 그대로');
console.log(bad ? `❌ tEXTSIG2 실패 ${bad}` : '✓ tEXTSIG2 통과');
