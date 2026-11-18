// tLOCKDR1_1118 — (11/18 일꾼 lockdr1 · 정범님 I-1118-1947-22.1) 잠금 서랍: 까닭 고치기 · 상품마다 유의 사항(최상·상 포함) + 개별·전체 갱신 · 시장 지표 접고 펼치기 + 개별·전체 갱신
// 실행: node src/tests/tLOCKDR1_1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || path.resolve(__dirname, '..', 'app.html');
const T = fs.readFileSync(APP, 'utf8');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } return S.slice(i); };
const lineOf = (pre) => { const i = T.indexOf(pre); if (i < 0) return ''; return T.slice(i, T.indexOf('\n', i)); };
const DRAW = fnIn(T, 'plkDrDraw');

console.log('① 까닭 고치기');
ok(/\$\{plkWhyEd\(v, F\)\}/.test(DRAW), '서랍 줄마다 까닭 고치기 칸(plkWhyEd)');
ok(!/<span class="plk-why">\$\{v\.why \? '📝 ' \+ esc\(v\.why\)/.test(DRAW), '읽기만 하던 까닭 글은 없어짐');
const WE = fnIn(T, 'plkWhyEd');
ok(/data-plkws=/.test(WE) && /data-plkwt=/.test(WE) && /class="plk-w plk-dw"/.test(WE), '저장 단추·글 칸이 .plk-w 안(카드와 같은 저장 길 plkWhySave)');
const WS = fnIn(T, 'plkWhySave', 'async function ');
ok(/act: 'why'/.test(WS) && /closest\('#plkDr'\)/.test(WS) && /plkDrDraw\(\)/.test(WS), '저장은 act:why · 서랍에서 저장하면 서랍을 다시 그림');
ok(/act === 'why' \? \{ why, hist: firebase\.firestore\.FieldValue\.arrayUnion\(E\) \}/.test(fnIn(T, 'plkSet', 'async function ')), '까닭 고침은 기록(hist)에 덧붙임 — 지우지 않음');
{ const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); const num = (n) => String(n); const plkKst = (s) => String(s || '').slice(5, 16);
  const f = new Function('esc', 'num', 'plkKst', WE + '\nreturn plkWhyEd;')(esc, num, plkKst);
  const h = f({ id: 'k1', why: '새 까닭', hist: [{ act: 'lock', why: '처음 까닭', by: 'a@x', at: '2026-11-18T01:00:00Z' }, { act: 'why', why: '새 까닭', by: 'b@x', at: '2026-11-18T02:00:00Z' }] }, { wOpen: new Set(['k1']) });
  ok(/고친 기록 1번/.test(h) && /처음 까닭/.test(h) && / open>/.test(h), '고친 횟수·앞 까닭을 보여 주고 열림 상태를 기억', h.slice(0, 300)); }

console.log('② 유의 사항 — 상품마다 · 최상·상 포함');
ok(/\$\{plkNoteLine\(v, l\)\}/.test(DRAW), '서랍 줄마다 유의 사항 줄');
const NL = fnIn(T, 'plkNoteLine');
ok(/noteRow\(\{ listingId: lid, grade: plkGrOf\(v, l\) \}\)/.test(NL), '웹앱 유의 사항 길(noteRow)을 그대로 씀');
ok(!/최상|'상'/.test(fnIn(T, 'plkNoteAuto')) && !/grade/.test(fnIn(T, 'plkNoteAuto')), '저절로 읽기 맡김에 등급 거르기가 없음(최상·상도 읽음)');
ok(/plkNoteRef\(lid\)/.test(fnIn(T, 'noteRefresh')), 'noteRefresh가 서랍 상태 줄을 고침');
ok(/noteAsk\(lid,/.test(fnIn(T, 'plkNoteAuto')) && /S\._plkNA/.test(fnIn(T, 'plkNoteAuto')) && /nmax/.test(fnIn(T, 'plkNoteAuto')), '기록 없으면 저절로 noteAsk(한 세션 한 번 · 최대 nmax개)');
ok(/id="plkna"/.test(DRAW) && /twiceArm\(b, `유의 사항/.test(fnIn(T, 'plkNoteAll', 'async function ')), '전체 유의 사항 갱신 단추(두 번 누르기)');
{ const S = { uinfo: new Map([['1', undefined], ['2', null], ['3', { note: '책등 얼룩' }]]), noteW: new Map(), _noteNo: new Set(['2']) }; const noteSt = () => {};
  const f = new Function('S', 'noteSt', fnIn(T, 'plkNoteSt') + '\nreturn plkNoteSt;')(S, noteSt);
  ok(/읽는 중/.test(f('1')) && /못 읽음/.test(f('2')) && f('3') === '', '상태: 읽는 중 · 못 읽음 · 읽음', [f('1'), f('2'), f('3')]);
  S._plkNA = new Set(['2']); ok(/맡김/.test(f('2')), '저절로 맡긴 뒤엔 「맡김」'); }

console.log('③ 시장 지표 — 기본 접힘 · 개별·전체 갱신');
ok(/\$\{plkMkBox\(v, l, F\)\}/.test(DRAW), '서랍 줄마다 시장 지표 칸');
const MB = fnIn(T, 'plkMkBox');
ok(/<details class="plk-mkd"/.test(MB) && /F\.mkOpen && F\.mkOpen\.has\(v\.id\)/.test(MB) && /\$\{op \? plkMkBody\(v\.id\) : ''\}/.test(MB), '기본 접힘 · 펼친 칸만 그림');
ok(/prBlocks\(\{ page1: page1FromMetrics\(l\), l, src: '시장 지표', noTools: 1 \}\)/.test(fnIn(T, 'plkMkBody')), '그리기는 웹앱 시장 지표 블록(prBlocks) 그대로');
ok(/prd_book_metrics/.test(fnIn(T, 'plkMkLoad', 'async function ')) && /pmPut\(bid/.test(fnIn(T, 'plkMkLoad', 'async function ')), '펼칠 때 서버 기록을 읽어 pmPut');
const MS = fnIn(T, 'plkMkSend', 'async function ');
ok(/type: 'metrics', keys, label, status: 'queued'/.test(MS) && /uploadedAt: TS\(\)/.test(MS), '맡김 꼴 = 상품 상세 「지금 다시 읽기」와 같은 shp_cmds metrics');
ok(/data-plkmkr=/.test(fnIn(T, 'plkMkBody')) && /id="plkma"/.test(DRAW), '개별 「시장 지표 갱신」·전체 「전체 시장 지표 갱신」 단추');
{ const A = fnIn(T, 'plkMkAll', 'async function '); const sent = []; let armed = 0;
  const S = { pmetrics: new Map([['b1', { lastCheckedAt: new Date(Date.now() - 10 * 60e3).toISOString() }], ['b2', { lastCheckedAt: new Date(Date.now() - 5 * 3600e3).toISOString() }]]) };
  const LS = new Map([['k1', { id: 'k1', bookId: 'b1' }], ['k2', { id: 'k2', bookId: 'b2' }], ['k3', { id: 'k3', bookId: 'b3' }], ['k4', { id: 'k4' }]]);
  const env = { S, plkDOpt: () => ({ mkGapMin: 60, mkMax: 200 }), plkMkS: () => ({ req: {}, at: {} }), plkListing: (k) => LS.get(k), plkMkBusy: () => false, PMK_REQ_GAP_MS: 30 * 60e3, num: String, toast: () => {}, errKo: String, twiceArm: () => { armed++; return 'go'; }, plkMkSend: async (K) => { sent.push(...K); } };
  const f = new Function(...Object.keys(env), A + '\nreturn plkMkAll;')(...Object.values(env));
  f({ disabled: false }, [{ id: 'k1' }, { id: 'k2' }, { id: 'k3' }, { id: 'k4' }]).then(() => { ok(armed === 1 && sent.join() === 'k2,k3', '전체 갱신: 1시간 안에 읽은 것·도서 정보 없는 것은 빼고 한 번에 맡김(두 번 누르기)', sent);
    console.log('④ 설정·임시 요소');
    ok(/localStorage\.getItem\('rn-plk-dopt'\)/.test(fnIn(T, 'plkDOpt')) && /\$\{plkDSetHtml\(F\)\}/.test(DRAW), '세세한 값은 「⚙ 서랍 설정」(약속 79)');
    ok(!/\b(alert|confirm|prompt)\(/.test([fnIn(T, 'plkNoteAll', 'async function '), A, MS, fnIn(T, 'plkDrBind')].join('\n')), '브라우저 팝업 없음');
    ok(T.includes("plkSet(l, true, { why: ta.value.trim(), act: 'why' })"), '까닭 저장 길 하나');
    console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0); }); }
