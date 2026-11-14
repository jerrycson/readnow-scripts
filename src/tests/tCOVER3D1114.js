// tCOVER3D1114 — (11/14 coverfix1) 📐 반듯한 평면 표지 vs 세워 찍은 입체 물건 사진 판별(엔진 연구 V02 · cloud/cover3d.js)
//   정범님 11/14 20:00: 3차원 물건 사진이 표지로 붙은 것을 모두 내리고 고유 디자인 · 특히 미등록 상품
//   ① 순수 셈: 신호(카메라 틀·촬영 배경)·판별·저장 꼴·채점·틀린 길 끄기·단계 · 미등록 알아보기(unregOf) · 서가 자료에서 관리자 값이 새 판별을 이김
//   표본 견줌(선택): RN_COV3D_LAB=<labels.json·sample.json·full/ 있는 폴더> RN_JPEG=<jpeg-js 폴더> — 실제 사진 정답표와 견줌(연구 상자에서만)
// 실행: node src/tests/tCOVER3D1114.js · 손님 정보 없음(모두 지어낸 그림·상품)
const path = require('path'); const fs = require('fs');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const T = require(path.join(ROOT, 'cloud/cover3d.js')); const PH = require(path.join(ROOT, 'cloud/shop-photo.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
/* 지어낸 그림: fill(x,y) → [r,g,b] */
const img = (w, h, fill) => { const d = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = fill(x, y); const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } return d; };
/* 촬영 사진 흉내: 위 벽(회색) · 아래 나무 바닥(따뜻한 색) · 가운데 비스듬한 책 */
const studio = (w, h) => img(w, h, (x, y) => { const fy = y / h, fx = x / w; const inBook = fy > 0.12 && fy < 0.88 && fx > 0.25 + (0.88 - fy) * 0.1 && fx < 0.8 - (fy - 0.12) * 0.05; if (inBook) return [(x * 7) % 200 + 30, (y * 3) % 180 + 40, 90]; return fy < 0.7 ? [200, 205, 215] : [160, 145, 128]; });
const flat = (w, h) => img(w, h, (x, y) => [(x * 13 + y * 7) % 255, (x * 5) % 255, (y * 11) % 255]);
const sgA = T.signals(studio(600, 800), 600, 800); const sgB = T.signals(studio(1200, 1600), 1200, 1600); const sgC = T.signals(flat(500, 700), 500, 700);
ok(!sgA.cam && sgB.cam && !sgC.cam, `카메라 틀: 600×800 아님 · 1200×1600 맞음 · 500×700 아님`);
ok(sgB.wall === 2 && sgB.floor === 2 && sgB.bg === 2, `촬영 배경: 위 벽 ${sgB.wall} · 아래 바닥 ${sgB.floor}`);
ok(sgC.bg === 0, `평면 표지 그림은 배경 신호 없음(${sgC.wall}/${sgC.floor})`);
const D = (sg, un, oldk) => T.decide(sg, { un, old: { k: oldk || 'c', s: 70 } });
ok(D(sgB, false).k === 'o' && D(sgB, false).path === 'cam_bg', '카메라 틀 + 배경 → 입체 사진(o · cam_bg)');
ok(D({ cam: true, bg: 0 }, true).k === 'o' && D({ cam: true, bg: 0 }, true).path === 'cam_un', '미등록 + 카메라 틀(배경 안 보임 · 앞에서 찍은 것) → o');
ok(D({ cam: true, bg: 0 }, false).k === 'c', '등록 상품 + 카메라 틀만(배경·예전 판정 없음) → 표지 그대로(c)');
ok(D(sgC, false).k === 'c' && D(sgC, true).k === 'c', '평면 표지(카메라 틀 아님·배경 없음)는 미등록이어도 c');
ok(D(sgC, false, 'n').k === 'n' && D(sgC, false, 'o').k === 'o', '예전 판정 자리 그림 n·비스듬한 상자 o는 그대로 이음');
ok(T.decide(sgB, { old: { k: 'c' }, off: new Set(['cam_bg']) }).k === 'c', '스스로 끈 길(off)로는 o를 내지 않음');
const v = T.valStr(D(sgB, true)); ok(T.G2_RE.test(v) && T.pkPart(v) === 'o92' && PH.PK_RE.test(T.pkPart(v)) && /cam/.test(T.sigPart(v)), `저장 꼴 ${v} · 서가 pk 꼴과 맞음`);
ok(T.keyG('bk_1') === 'g2:bk_1' && !PH.PK_RE.test('c|x') && T.pkPart('c|x') === 'c', '저장 열쇠 g2: · 못 받은 그림 c|x');
/* 채점·틀린 길 끄기·단계 */
const vals = new Map([['a', 'o92|cam.bg2'], ['b', 'o92|cam.bg2'], ['c', 'o80|cam.bg0.un'], ['d', 'c|bg0'], ['e', 'o62|bg2.un'], ['f', 'o62|bg2.un'], ['g', 'o62|bg2.un'], ['h', 'o62|bg2.un'], ['i', 'o62|bg2.un'], ['j', 'o62|bg2.un']]);
const picks = new Map([['a', 'O'], ['b', 'N'], ['c', 'O'], ['d', 'O'], ['e', 'C'], ['f', 'C'], ['g', 'C'], ['h', 'C'], ['i', 'C'], ['j', 'O']]);
const sc = T.score(vals, picks); ok(sc.n === 10 && sc.tp === 4 && sc.fp === 5 && sc.fn === 1 && sc.byPath.un_bg2.n === 6, `채점: 맞힌 o ${sc.tp} · 틀린 o ${sc.fp} · 놓침 ${sc.fn} · 길별 ${JSON.stringify(sc.byPath.un_bg2)}`);
const of = T.offFrom(sc, []); ok(of.off.includes('un_bg2') && !of.off.includes('cam_bg') && of.why.length === 1, `틀린 길 끄기: ${of.why.join(' / ')}`);
const st = T.stageOf({ prec: 0.5, tp: 5, fp: 5 }, 4); ok(st.n === 3 && T.stageOf({ prec: 0.97, tp: 30, fp: 1 }, 4).n === 4, `단계: 정밀도 떨어지면 4→${st.n} · 높으면 그대로`);
/* 미등록 알아보기 */
ok(SH.unregOf({ ids: [{ kind: 'usedCode', value: 'U1' }] }) && !SH.unregOf({ isbn13: '9788900000000' }) && !SH.unregOf({ ids: [{ kind: 'usedCode' }, { kind: 'isbn13' }] }) && SH.unregOf({}) && !SH.unregOf({ aladinCode: 'x' }) && !SH.unregOf({}, { isbn13: '9791100000000' }), '미등록 = ISBN·알라딘 상품코드 없음(번호가 상품코드뿐)');
/* 서가 자료: 관리자 값이 새 판별을 이김 · 새 판별이 서가 pk 칸으로 */
{ const it = [{ id: 'A', t: '가', p: 1000, at: '2026-11-14', im: 'https://x/o/img%2Fbk_1%2Ff' }, { id: 'B', t: '나', p: 1000, at: '2026-11-14', im: 'https://x/o/img%2Fbk_2%2Ff' }];
  const pkf = (im) => (/bk_1/.test(im) ? 'o92' : 'o80'); const rows = SH.shelfRows(it, null, null, null, null, null, null, pkf, new Map([['B', { k: 'C', src: null }]]), null); const ix = SH.SHELF_COLS.indexOf('pk');
  const m = new Map(rows.map((r) => [r[0], r[ix]])); ok(m.get('A') === 'o92' && m.get('B') === 'C', `서가 pk: 자동 ${m.get('A')} · 관리자 ${m.get('B')}(관리자가 이김)`); }
/* 실제 정답표(선택) */
if (process.env.RN_COV3D_LAB) { const Dd = process.env.RN_COV3D_LAB; const jpeg = require(process.env.RN_JPEG || 'jpeg-js'); const IMG = require(path.join(ROOT, 'cloud/shop-img.js')); const lab = JSON.parse(fs.readFileSync(Dd + '/labels.json')); const S = JSON.parse(fs.readFileSync(Dd + '/sample.json')); let tp = 0, fn = 0, fpF = 0, nF = 0;
  for (const [i, l] of Object.entries(lab)) { if (l === '?') continue; let im; try { im = IMG.decode(fs.readFileSync(Dd + '/full/' + i), jpeg); } catch (e) { continue; } const r = T.decide(T.signals(im.data, im.width, im.height), { un: S[+i].un, old: PH.judge(im.data, im.width, im.height) }); if (l === 'P') r.k === 'o' ? tp++ : fn++; if (l === 'F') { nF++; if (r.k === 'o') fpF++; } }
  ok(tp / (tp + fn) >= 0.95 && fpF / Math.max(1, nF) <= 0.02, `정답표: 실물 사진 재현율 ${(tp / (tp + fn)).toFixed(3)} · 평면 표지 오판 ${fpF}/${nF}`); }
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
