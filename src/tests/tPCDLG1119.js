// tPCDLG1119 — (chkdone1 11/19 · pcauto2 다음 걸음) 🖥 PC 배치 「크롬 창 로그인」 결과 카드(웹앱)
//   도우미 /api/login 모양 그대로 읽음 · 필요한 창이 있을 때만 카드 · ✕(같은 창들이면 다시 안 띄움)·오늘 숨김·⚙ 끄기 · 휴대폰은 안 물음 · 브라우저 팝업 0
// 실행: node src/tests/tPCDLG1119.js · 시험 자료에 손님 정보·계정 값 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x !== undefined ? JSON.stringify(x).slice(0, 300) : ''); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((d) => fs.existsSync(path.join(d, 'lab', 'pcdock')));
const T = fs.readFileSync(process.env.RN_APP || path.join(ROOT, 'src', 'app.html'), 'utf8');
const i = T.indexOf('/* ◆pcdlg 시작'); const j = T.indexOf('/* ◆pcdlg 끝 */', i); ok(i > 0 && j > i, '덩어리 있음'); const B = T.slice(i, j);
const store = {}; const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
const F = new Function('localStorage', 'document', 'S', 'PHONE_THIN', 'esc', 'toast', B.replace(/document\.addEventListener[^\n]*\n/g, '').replace(/setTimeout\(pcdLgTick, 20000\);/, '') + '\nreturn { pcdLgCfg, pcdLgPut, pcdLgSig, pcdLgShow, pcdLgLine, pcdLgToday, pcdLgSetHtml };')(localStorage, {}, {}, false, (s) => String(s), () => {});
const D = F.pcdLgCfg(); ok(D.on === 1 && D.min === 1 && D.idle === 10, '기본: 켜짐 · 1분 · 도우미 없으면 10분', D);
F.pcdLgPut({ min: 999, idle: 0 }); ok(F.pcdLgCfg().min === 60 && F.pcdLgCfg().idle === 2, '⚙ 값은 테두리 안(1~60분 · 2~120분)', F.pcdLgCfg());
const J = { ok: true, app: 'readnow-pcdock', ver: '0.1.10', at: Date.now(), need: [{ name: '알라딘', t: 'a', how: '로그인 단추 못 찾음' }, { name: '예스24', t: 'b', how: '' }], done: 3 };
ok(F.pcdLgShow(J), '필요한 창이 있으면 카드');
ok(!F.pcdLgShow({ ...J, need: [] }) && !F.pcdLgShow(null), '필요 0개·도우미 없음이면 카드 없음');
ok(F.pcdLgSig(J) === F.pcdLgSig({ need: [{ name: '예스24' }, { name: '알라딘' }] }), '✕ 표시는 창 이름 묶음(차례 상관없음)');
F.pcdLgPut({ x: F.pcdLgSig(J) }); ok(!F.pcdLgShow(J), '✕ 뒤 같은 창들이면 다시 안 띄움');
ok(F.pcdLgShow({ ...J, need: [...J.need, { name: '쿠팡' }] }), '✕ 뒤라도 새 창이 더 생기면 다시 보임');
F.pcdLgPut({ x: '', day: F.pcdLgToday() }); ok(!F.pcdLgShow(J), '오늘 숨김'); F.pcdLgPut({ day: '2000-01-01' }); ok(F.pcdLgShow(J), '다음 날 다시 보임');
F.pcdLgPut({ on: 0 }); ok(!F.pcdLgShow(J), '⚙ 끄면 카드 없음'); F.pcdLgPut({ on: 1 });
ok(/필요 2개/.test(F.pcdLgLine(J)) && /됨 3개/.test(F.pcdLgLine(J)), '⚙ 한 줄 상태', F.pcdLgLine(J));
ok(/data-pcdlg-on/.test(F.pcdLgSetHtml()) && /\$\{pcdLgSetHtml\(\)\}/.test(T), '⚙ ⑭ 관리도구에 켜기·간격 칸');
ok(/'x-rn-dock-web': '1'/.test(B) && /127\.0\.0\.1:8796\/api\/login/.test(B), '도우미 주소·머리(도우미 CORS가 받는 것)');
const P = fs.readFileSync(path.join(ROOT, 'lab', 'pcdock', 'readnow-pcdock.js'), 'utf8'); const C = fs.readFileSync(path.join(ROOT, 'lab', 'pcdock', 'pcdock-config.js'), 'utf8');
ok(/PORT: 8796/.test(C) && /allow-headers': 'x-rn-dock-web'/.test(P) && /need: L && !L\.x \? L\.need\.map\(\(x\) => \(\{ name: x\.name, t: x\.t, how: x\.how \}\)\)/.test(P), '도우미 쪽 포트·머리·need 모양이 같음');
ok(/PHONE_THIN \|\| !c\.on/.test(B), '휴대폰은 묻지 않음');
ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(B) && !/password|passwd|비밀번호 *=/.test(B.replace(/비밀번호 관리자/g, '')), '브라우저 팝업 0 · 계정 값 다루지 않음');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
