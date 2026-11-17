// tVERIFY2_1118 — (11/18 일꾼 verify2) 수집기가 PC 배치 /api/diag의 find(0.1.7)·lastClose(0.1.9)도 PC 신호(pcBeat.pcs[이름].dock)에 옮기는지
// 실행: node src/tests/tVERIFY2_1118.js (순수 · 가짜 PC 배치 답 · 손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const find = (rel) => [path.resolve(__dirname, '..', '..', rel), path.resolve(__dirname, '..', rel), process.env.RN_REPO ? path.join(process.env.RN_REPO, rel) : ''].filter(Boolean).find((x) => fs.existsSync(x));
const COL = fs.readFileSync(find('src/readnow-collector.src.js'), 'utf8');
const a = COL.indexOf('  let DOCKST = null;'); const b = COL.indexOf('  async function pcBeat()', a);
ok(a > 0 && b > a, 'dockRead 덩어리를 찾음'); if (!(a > 0 && b > a)) process.exit(1);
const mk = (answer) => { let url = ''; const f = new Function('GM_xmlhttpRequest', 'PUBONLY', 'PC_NAME', 'nowIso', COL.slice(a, b) + '\nreturn { dockRead, st: () => DOCKST };');
  const m = f((o) => { url = o.url; o.onload({ responseText: JSON.stringify(answer) }); }, false, 'JS-MAIN', () => '2026-11-18T00:00:00.000Z'); m.dockRead(); return { st: m.st(), url }; };
const base = { app: 'readnow-pcdock', ver: '0.1.9', mons: 3, errs: [], last: { at: 1, by: '단추', ok: true, rows: [], pre: { closed: [{ proc: 'x' }], kept: [] }, skip: [] } };
console.log('① 0.1.9 답 — find·lastClose 옮김');
const r1 = mk({ ...base, find: { at: 5, err: '', from: { kakao: '프로세스 C:\\Program Files\\Kakao\\KakaoTalk.exe', 'a.b c': 'x'.repeat(100) }, miss: { claude: '바로 가기 없음' } },
  lastClose: { at: 9, n: 7, sum: '닫힘 5 · 강제 종료 1 · 남음 1', left: [{ p: 'mstsc', why: '관리자 권한' }] } });
ok(r1.url === 'http://127.0.0.1:8796/api/diag?pc=JS-MAIN', '읽는 주소 그대로(127.0.0.1:8796 · 읽기만)', r1.url);
ok(r1.st && r1.st.ver === '0.1.9' && r1.st.mons === 3, '판·모니터 수 그대로', r1.st);
ok(r1.st.find && r1.st.find.at === 5 && /KakaoTalk/.test(r1.st.find.from.kakao) && r1.st.find.miss.claude === '바로 가기 없음', 'find.from·miss 옮김', r1.st.find);
ok(Object.keys(r1.st.find.from).every((k) => /^[\w-]+$/.test(k)) && r1.st.find.from.a_b_c.length === 60, 'find 칸 이름은 영문·숫자만 · 값 60자로 자름', r1.st.find.from);
ok(r1.st.lastClose && r1.st.lastClose.n === 7 && r1.st.lastClose.sum === '닫힘 5 · 강제 종료 1 · 남음 1' && r1.st.lastClose.left[0].p === 'mstsc', 'lastClose(마지막 ⛔ 전체 닫기) 옮김', r1.st.lastClose);
ok(r1.st.last && r1.st.last.pre && r1.st.last.pre.closed.length === 1, 'last.pre(③ 먼저 닫기) 그대로', r1.st.last);
console.log('② 옛 판(0.1.8) 답 — 칸이 없으면 null');
const r2 = mk(base);
ok(r2.st && r2.st.find === null && r2.st.lastClose === null && r2.st.seen, '없으면 null(옛 판도 그대로 읽힘)', r2.st);
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
