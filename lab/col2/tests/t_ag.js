/* t_ag — (0.1.43 adapt10 · 약속 64) 🔄 번외 목표·방법 장부(helper/col2-ag.js)
 *  ① 운영 공용 readnow-adapt-core.js(◆AG)로 회차 닫기·칸마다 길 성적·15분마다 col2_adapt/<PC> 쓰기(막이 col2_* 그대로)
 *  ② 성공률이 무너지면 '바뀜' 줄 · 틀을 아직 못 받았으면 메모리에만 모아 둠(일은 그대로)
 *  ③ 고리 자리(그림자 일·예스24 운영 읽기·네이버 API·도우미 CORE.ag)가 붙어 있음(글 검사) · 지어낸 값만 · 실행: node tests/t_ag.js */
const fs = require('fs'), path = require('path'), os = require('os');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const AC = [path.join(__dirname, '../../../readnow-adapt-core.js'), path.join(__dirname, '../../../../readnow-adapt-core.js')].find((f) => fs.existsSync(f));
const A = require(AC); const AG = require('../helper/col2-ag.js');
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'c2ag-')); const outs = []; let core = null;
const ag = AG.makeAg({ home: HOME, A: () => core, out: (c, id, v) => outs.push({ c, id, v }), pc: () => 'PC 시험', ver: '0.1.43', roundN: 10, outMs: 0 });
console.log('① 틀 받기 전 · 받은 뒤 회차');
for (let i = 0; i < 12; i++) { ag.obs('y24_ops', 'tpl', { n: 1, ok: 1, ms: 30 }); ag.fill('y24_ops', { n_list: { tpl: 20 } }); }
ok(ag.tick() === 0 && !outs.length, '틀(CORE.ag)이 없으면 닫지도 쓰지도 않음(메모리에만)');
core = A; ag.tick(); const g = ag.S.g.c2_y24_ops;
ok(g && g.champ === 'tpl' && g.methods.tpl.d[0][1] === 12 && g.methods.tpl.d[0][2] === 12, '회차 닫힘 — 챔피언 tpl · 12번 중 12번', g && g.methods);
const nest = (x) => Array.isArray(x) ? x.some((y) => Array.isArray(y) || nest(y)) : x && typeof x === 'object' ? Object.values(x).some(nest) : false;
ok(outs.length === 1 && !nest(outs[0].v), '쓰는 문서에 배열 안 배열 없음(웹 SDK가 거절함 — 장부 몸통은 글 gs)');
ok(outs.length === 1 && outs[0].c === 'col2_adapt' && outs[0].id === 'PC_시험' && JSON.parse(outs[0].v.gs).c2_y24_ops, 'col2_adapt/<PC>에 장부를 씀(막이 col2_*)', outs[0] && { c: outs[0].c, id: outs[0].id });
ok(fs.existsSync(path.join(HOME, 'col2-ag.json')), '이 PC 파일에도 남김');
const sm = A.agSummary(g); ok(sm.fl && sm.fl.f.n_list && sm.fl.f.n_list.tpl[0] === 12, '칸마다 길 성적(fl) — n_list · tpl', sm.fl);
console.log('② 무너지면 바뀜 줄');
const T0 = Date.now(); for (let d = 0; d < 6; d++) { for (let i = 0; i < 10; i++) ag.obs('nv_ops', 'api', { n: 1, ok: 1 }); ag.close(true); }
for (let d = 0; d < 3; d++) { for (let i = 0; i < 10; i++) ag.obs('nv_ops', 'api', { n: 1, ok: 0, why: '401 GW.AUTHN 010-0000-0000' }); ag.close(true); }
const ln = ag.S.lines.filter((l) => l.eng === 'c2_nv_ops'); ok(ln.some((l) => l.kind === '바뀜' && /네이버/.test(l.t)), "성공률이 무너지면 '바뀜' 줄(발견 모음으로 넘길 꼴)", ln.map((l) => l.t));
ok(!JSON.stringify(ag.S).includes('010-0000'), '까닭 글의 전화번호 꼴은 가림');
const v = ag.view(); ok(v.ready && v.goals.c2_nv_ops && v.goals.c2_nv_ops.st === 'broken', '/jobs 요약(view) — 판정 무너짐', v.goals.c2_nv_ops);
console.log('③ 고리 자리');
const rd = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
ok(/col2-ag\.js'\)\.get\(\)/.test(rd('helper/col2-jobs.js')) && /AGX\.obs\(eng, mid/.test(rd('helper/col2-jobs.js')), '그림자 일 결과마다 성적');
ok(/AGX\.obs\('y24_ops', 'tpl'/.test(rd('helper/col2-y24.js')) && /AGX\.obs\('y24_ops', 'learn'/.test(rd('helper/col2-y24.js')), '예스24 운영 읽기 — 배운 조건·다시 배움 두 길');
ok(/AGX\.obs\('nv_ops', 'api'/.test(rd('helper/col2-nv.js')) && /async function call0\(/.test(rd('helper/col2-nv.js')), '네이버 API 읽기 성적(규칙은 call0 그대로)');
ok(/CORE\.ag = /.test(rd('helper/readnow-col2-helper.js')) && /readnow-adapt-core\.js/.test(rd('col2-config.js')) && JSON.parse(rd('bundle.json')).files.includes('helper/col2-ag.js'), '도우미가 공용 틀을 CORE.ag로 받음 · 묶음 목록에 col2-ag.js');
fs.rmSync(HOME, { recursive: true, force: true });
console.log(bad ? `✗ ${bad}개 실패` : '✓ t_ag 모두 통과'); process.exit(bad ? 1 : 0);
