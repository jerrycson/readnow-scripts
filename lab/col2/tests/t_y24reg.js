/* t_y24reg — (11/10 y24auto · 정범님 '알라딘에 등록하고 또 다른 절차를 거쳐서 예스24에 등록하는 품을 또 들이라는 거야?') 🟦 예스24 자동 올림
 *  가짜 예스24 판매관리(이 시험 안에서만 꾸민 작은 서버 · 로그인된 세션으로 봄) — 대량 등록(엑셀 업로드) 화면: [바코드] 라디오 · 숨은 파일 칸 · 미리보기 표 · [등록](확인 물음) · '등록 완료' 창
 *  ① 순수 셈: 맡김 검사(처음엔 1건만 · 30줄까지 · 수량 1 · 되풀이 0) · 완료 창 글 · 자체코드 짝 · 로거·MJ-MAIN 거절 · 확인 물음(위험 낱말은 '아니오')
 *  ② 실제 흐름(숨은 크롬): 1건 → 파일 칸에 엑셀 넣음 → 미리보기 → [등록] → 완료 창 → 등록상품 목록에서 자체코드 확인 → done · 같은 상품 다시 맡기면 거절
 *     · 2건(첫 성공 뒤) → done · 🚚 출고 중엔 기다림(아무것도 안 누름) → 풀리면 이어감 · 미리보기가 안 뜨면 [등록]을 누르지 않고 멈춤 · 다른 위험 단추는 안 누름
 * 시험 자료에 손님 정보 없음 · 실행: node tests/t_y24reg.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const RG = require('../helper/col2-y24reg.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };

function fakeY24() { const S = { prods: [{ GOODS_NO: '100000001', EAN: '9788900000009', ENTR_GOODS_CD: 'OLD001' }], regs: [], log: [], noPreview: false, seq: 200000000 };
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title><script>function api(p,o,cb){var x=new XMLHttpRequest();x.open('POST',p);x.setRequestHeader('Content-Type','application/json');x.onload=function(){cb&&cb(x.responseText)};x.send(JSON.stringify(o))}</script></head><body>${b}</body></html>`;
  const bulk = () => page('대량등록', `<div><div class="custom-radio"><input type="radio" name="radio-inline" value="01" id="r1"><label for="r1"><span>바코드</span></label></div><div class="custom-radio"><input type="radio" name="radio-inline" value="02" id="r2"><label for="r2"><span>상품번호</span></label></div></div>
<button type="button" class="btn btn-success" onclick="document.getElementById('f').click()"> 엑셀파일 업로드 </button><input type="file" id="f" hidden="hidden">
<div id="productGrid">조회된 데이터가 없습니다.</div><button type="button" onclick="api('/api/Product/DeleteAll',{})">상품삭제</button>
<div class="btnarea_wrap_btm"><button type="button" class="btn btn-primary btn-lg" id="reg"> 등록 </button></div>
<div class="layerPop" id="pop" style="display:none"><h1> 등록 완료 </h1><button type="button" class="close">×</button><ul><li>총 <span id="ns">0</span>개의 상품이 판매중으로 등록되었습니다.</li><li>총 <span>0</span>개의 상품이 미출간으로 등록되었습니다.</li></ul></div>
<script>var LINES=[];document.getElementById('f').onchange=function(){if(!document.getElementById('r1').checked)return alert('바코드를 고르세요');var fr=new FileReader();fr.onload=function(){LINES=String(fr.result).trim().split('\\n');${'if(window.NOPV)return;'}document.getElementById('productGrid').innerText=LINES.join(' | ')};fr.readAsText(this.files[0])};
document.getElementById('reg').onclick=function(){if(!LINES.length)return alert('파일 없음');if(!confirm('선택한 상품을 등록하시겠습니까?'))return;api('/api/Product/BulkReg',{lines:LINES},function(t){var j=JSON.parse(t);document.getElementById('ns').innerText=j.n;document.getElementById('pop').style.display='block'})};
document.querySelector('#pop .close').onclick=function(){document.getElementById('pop').style.display='none'};</script>`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => { S.log.push({ m: q.method, p: u.pathname, body: b.slice(0, 300) });
      const H = (code, type, body) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8' }); s.end(body); };
      if (u.pathname === '/api/Product/BulkReg') { const o = JSON.parse(b || '{}'); let n = 0; for (const ln of o.lines || []) { const [isbn, self] = ln.split(','); if (!isbn || !self) continue; S.prods.unshift({ GOODS_NO: String(++S.seq), EAN: isbn, ENTR_GOODS_CD: self }); n++; } S.regs.push(n); return H(200, 'application/json', JSON.stringify({ n, RESULT_CODE: 'S000' })); }
      if (u.pathname === '/api/Product/ProductList') return H(200, 'application/json', JSON.stringify({ PRODUCT_LIST: S.prods, TOTAL_COUNT: S.prods.length, RESULT_CODE: 'S000' }));
      if (u.pathname === '/api/Product/DeleteAll') { S.prods = []; return H(200, 'application/json', '{}'); }
      if (u.pathname.startsWith('/api/')) return H(200, 'application/json', JSON.stringify({ RESULT_LIST: [], TOTAL_COUNT: 0 }));
      if (u.pathname === '/') return H(200, 'text/html', page('판매관리', '첫 화면'));
      if (u.pathname === '/Product/BulkRegistrationByExcel') return H(200, 'text/html', bulk().replace('<body>', S.noPreview ? '<body><script>window.NOPV=1</script>' : '<body>'));
      if (u.pathname === '/Product/ProductList') return H(200, 'text/html', page('등록상품', `<button type="button" onclick="api('/api/Product/ProductList',{SDATE:'2026-11-01',EDATE:'2026-11-10',goodsStatGb:'02',PAGE_NO:1,PAGE_SIZE:20})">조회</button>`));
      return H(200, 'text/html', page('기타', '없음')); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
const b64 = (rows) => Buffer.from(rows.map((r) => r.isbn + ',' + r.self).join('\n') + '\n' + '#'.repeat(40)).toString('base64');
const row = (k, o) => ({ lid: 'aladin_U' + k, isbn: '97889000000' + String(k).padStart(2, '0'), grade: '상', price: 9000, qty: 1, self: 'A01SKU' + k, title: '시험 책 ' + k, ...(o || {}) });
const job = (id, rows) => ({ id, rows, xlsx: b64(rows), by: '시험 웹앱' });

(async () => {
  console.log('① 순수 셈');
  { const c = RG.checkJob; const R0 = { ok1: null, lid: {}, sku: {} };
    ok(c(job('job-1', [row(1)]), R0) === '' && /1건짜리/.test(c(job('job-2', [row(1), row(2)]), R0)) && c(job('job-2', [row(1), row(2)]), { ...R0, ok1: 1 }) === '', '처음엔 1건짜리만 · 첫 성공 뒤 여러 건');
    ok(/30줄/.test(c(job('job-3', Array.from({ length: 31 }, (_, i) => row(i + 1))), { ...R0, ok1: 1 })) && /수량 1/.test(c(job('job-4', [row(1, { qty: 2 })]), R0)) && /ISBN/.test(c(job('job-5', [row(1, { isbn: '12' })]), R0)) && /판매가/.test(c(job('job-6', [row(1, { price: 0 })]), R0)) && /SKU/.test(c(job('job-7', [row(1, { self: '' })]), R0)), '30줄까지 · 수량 1권만 · ISBN·판매가·SKU 검사');
    ok(/되풀이/.test(c(job('job-8', [row(1)]), { ...R0, lid: { aladin_U1: {} } })) && /되풀이/.test(c(job('job-9', [row(1)]), { ...R0, sku: { A01SKU1: 'x' } })) && /되풀이/.test(c(job('job-10', [row(1), row(2, { self: 'A01SKU1' })]), { ...R0, ok1: 1 })), '되풀이 0 — 같은 상품·같은 SKU(이 PC 기록·같은 맡김 안)');
    ok(JSON.stringify(RG.doneCounts(' 등록 완료 × 총 3 개의 상품이 판매중으로 등록되었습니다. 총 1 개의 상품이 미출간으로 등록되었습니다.')) === '{"sale":3,"unpub":1}' && RG.doneCounts('아무 글') === null, "'등록 완료' 창 글 읽기(원문 꼴)");
    ok(JSON.stringify(RG.matchList([{ lid: 'a', self: 'S1' }, { lid: 'b', self: 'S2' }], [{ no: '9', self: 'S0, S1' }, { no: '8', self: 'S3' }])) === '{"a":"9"}', '자체코드 = 우리 SKU 짝');
    const D0 = fs.mkdtempSync(path.join(os.tmpdir(), 'y24reg_')); const mk = (pc) => RG.makeY24Reg({ HOME: D0, note: () => {}, pcName: () => pc, isLogger: () => /^LOGGER/.test(pc), enabled: () => true, holdOn: () => false, login: () => 'ok', kick: () => {} });
    const A = mk('MJ-MAIN').put(job('job-m', [row(1)])), B = mk('LOGGER').put(job('job-l', [row(1)])), C0 = mk('HOME');
    ok(A.code === 409 && /MJ-MAIN/.test(A.body.err) && B.code === 409 && /로거/.test(B.body.err), 'MJ-MAIN·로거 PC는 맡김을 받지 않음(출고 보호 · 약속 0)', A.body.err + ' / ' + B.body.err);
    ok(C0.dialog({ type: 'confirm', message: '선택한 상품을 등록하시겠습니까?' }) === true && C0.dialog({ type: 'confirm', message: '상품을 삭제하시겠습니까?' }) === false && C0.dialog({ type: 'confirm', message: '등록 취소하시겠습니까?' }) === false, "확인 물음: '등록'만 예 · 삭제·취소 낱말이 있으면 아니오");
    fs.rmSync(D0, { recursive: true, force: true }); }

  const Y = await fakeY24(); const repo = process.env.COL2_PROD_REPO || path.join(__dirname, '..', '..', '..');
  const env = { RN_COL2_Y24: Y.base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_CORE_DIR: repo };
  const H = await L.startHelper({ cfg: { on: true, y24: true, pc: 'HOME', hands: false, auto: false, headless: true, watch: { tickSec: 60, handoffMs: 200 } }, env }); const D = H.D;
  const feed = (b) => H.api('POST', '/y24/feed', { by: '시험 수집기', cfg: { ordMin: 0 }, hold: { on: false }, ...(b || {}) });
  const rs = async () => (await H.api('GET', '/y24/reg/state')).j;
  const resOf = async (id, n) => until(async () => { await feed(); const s = await rs(); return s.res && s.res[id] ? s.res[id] : null; }, n || 200);
  try {
    console.log('② 실제 흐름(숨은 크롬)');
    await feed(); const lg = await until(async () => { await feed(); const s = (await H.api('GET', '/status')).j.y24; return s.login === 'ok' && s.alive ? s : null; }, 120); ok(lg, '숨은 예스24 크롬이 판매관리 세션을 봄(로그인 됨)');
    let r = await H.api('POST', '/y24/reg/put', job('job-A', [row(1), row(2)])); ok(r.st === 400 && /1건짜리/.test(r.j.err), '처음엔 2건 맡김을 거절', r.j && r.j.err);
    const regs0 = Y.S.regs.length; r = await H.api('POST', '/y24/reg/put', job('job-B', [row(1)])); ok(r.j.ok && r.j.took === 'job-B', '1건 맡김 받음');
    let x = await resOf('job-B'); ok(x && x.state === 'done' && x.gno && x.gno.aladin_U1 && Y.S.regs.length === regs0 + 1 && Y.S.regs[regs0] === 1, '대량 등록 화면에서 엑셀 넣고 [등록] → 완료 창 → 등록상품 목록에서 자체코드 확인 → done', x && x.msg);
    let s = await rs(); ok(s.ok1 && s.done === 1, '첫 성공 기록(이 PC) → 여러 건이 열림', JSON.stringify({ ok1: s.ok1, done: s.done }));
    await H.api('POST', '/y24/reg/ack', { ids: ['job-B'] }); ok(!(await rs()).res['job-B'], '웹앱이 받은 결과는 지움(ack)');
    r = await H.api('POST', '/y24/reg/put', job('job-C', [row(1)])); ok(r.st === 400 && /되풀이/.test(r.j.err), '같은 상품을 다시 맡기면 거절(되풀이 0)', r.j.err);
    console.log('③ 출고 중 · 여러 건');
    await feed({ hold: { on: true, why: '시험 출고' } }); const n1 = Y.S.regs.length; r = await H.api('POST', '/y24/reg/put', job('job-D', [row(2), row(3)])); ok(r.j.ok, '첫 성공 뒤 2건 맡김 받음');
    for (let k = 0; k < 12; k++) { await feed({ hold: { on: true, why: '시험 출고' } }); await wait(250); } s = await rs(); ok(Y.S.regs.length === n1 && s.wait.length === 1 && /출고/.test(s.why || ''), '🚚 출고 중엔 아무것도 안 누르고 기다림', s.why);
    x = await resOf('job-D'); ok(x && x.state === 'done' && Object.keys(x.gno).length === 2 && Y.S.regs.length === n1 + 1 && Y.S.regs[n1] === 2, '출고가 끝나면 이어감 → 2건 done', x && x.msg);
    console.log('④ 미리보기가 안 뜨면 멈춤');
    Y.S.noPreview = true; const n2 = Y.S.regs.length; await H.api('POST', '/y24/reg/put', job('job-E', [row(4)])); x = await resOf('job-E');
    ok(x && x.state === 'fail' && x.pre && /미리보기/.test(x.msg) && x.todo && Y.S.regs.length === n2, '미리보기 목록에 우리 줄이 없으면 [등록]을 누르지 않고 멈춤 + 사람이 할 일', x && x.msg);
    ok(!Y.S.log.some((l) => /DeleteAll/.test(l.p)) && Y.S.prods.length >= 4, '상품삭제 같은 다른 단추는 끝까지 안 누름');
    ok(fs.readdirSync(path.join(D, 'home', 'y24reg')).length === 0, '올린 엑셀 임시 파일은 끝나면 지움(이 PC 안)');
  } finally { try { await H.stop(); } catch (e) {} killDir(D); }
  Y.srv.close(); L.done('t_y24reg');
})();
