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

/* (0.1.72 y24reg3) 예스24 원문과 같은 꼴의 화면 부품(Vue) 흉내 — input change → vm.clickExcelImport(e) → this.getExcelDataToJson(파일,27) → 바코드 빈 줄 뺌 → /api/Product/GetReadExcelFile → rsData.PRODUCT_CHECK_RESULT · 표는 글로 안 그림(RealGrid처럼) · 끝에 칸 값을 비움
 *  mode 'ok' = 오류코드 0 · 'err' = 서버가 오류코드(S.vmErr) · 'empty' = 엑셀 머리글이 달라 '바코드' 칸이 빔 */
const VMJS = (mode) => `<script>(function(){var MODE=${JSON.stringify(mode)};var vm={selectedType:'01',rqData:{EXCEL_DATA_LIST:[]},rsData:{PRODUCT_CHECK_RESULT:null,REG_COUNT:0,PROGIBITION_PRODUCT_LIST:[],BANNED_WORD_USE_PRODUCT_LIST:[]},
getExcelDataToJson:function(f,h){return new Promise(function(res){var fr=new FileReader();fr.onload=function(){var A=String(fr.result).trim().split('\\n').filter(function(l){return l&&l[0]!=='#'});res(A.map(function(l){var a=l.split(',');return MODE==='empty'?{'상품번호':a[0],'판매자 자체코드':a[1]}:{'바코드':a[0],'판매자 자체코드':a[1]}}))};fr.readAsText(f)})},
clickExcelImport:function(e){var self=this,f=e.target.files[0];if(!f)return;this.rqData.EXCEL_DATA_LIST=[];this.rsData.PRODUCT_CHECK_RESULT=null;this.getExcelDataToJson(f,27).then(function(rows){rows.forEach(function(r){if(r['바코드'])self.rqData.EXCEL_DATA_LIST.push({BARCODE:r['바코드'],MAN_NO:r['판매자 자체코드']})});if(!self.rqData.EXCEL_DATA_LIST.length)return;api('/api/Product/GetReadExcelFile',{PRODUCT_LIST:self.rqData.EXCEL_DATA_LIST,TYPE:'01'},function(t){var j=JSON.parse(t);self.rsData.REG_COUNT=0;j.RESULT_LIST.forEach(function(x){if(x.ERROR_CODE==0)self.rsData.REG_COUNT++});self.rsData.PRODUCT_CHECK_RESULT=j;LINES=j.RESULT_LIST.filter(function(x){return x.ERROR_CODE==0}).map(function(x){return x.BARCODE+','+x.MAN_NO})})});e.target.value=''}};
var el=document.getElementById('f');el.onchange=function(e){return vm.clickExcelImport(e)};document.body.__vue__=vm})()</script>`;
function fakeY24() { const S = { prods: [{ GOODS_NO: '100000001', EAN: '9788900000009', ENTR_GOODS_CD: 'OLD001' }], regs: [], log: [], noPreview: false, gridOnly: false, seq: 200000000, vm: '', vmErr: 0, chk: [] };
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title><script>function api(p,o,cb){var x=new XMLHttpRequest();x.open('POST',p);x.setRequestHeader('Content-Type','application/json');x.onload=function(){cb&&cb(x.responseText)};x.send(JSON.stringify(o))}</script></head><body>${b}</body></html>`;
  const bulk = () => page('대량등록', `<div><div class="custom-radio"><input type="radio" name="radio-inline" value="01" id="r1"><label for="r1"><span>바코드</span></label></div><div class="custom-radio"><input type="radio" name="radio-inline" value="02" id="r2"><label for="r2"><span>상품번호</span></label></div></div>
<button type="button" class="btn btn-success" onclick="document.getElementById('f').click()"> 엑셀파일 업로드 </button><input type="file" id="f" hidden="hidden">
<div id="productGrid">조회된 데이터가 없습니다.</div><button type="button" onclick="api('/api/Product/DeleteAll',{})">상품삭제</button>
<div class="btnarea_wrap_btm"><button type="button" class="btn btn-primary btn-lg" id="reg"> 등록 </button></div>
<div class="layerPop" id="pop" style="display:none"><h1> 등록 완료 </h1><button type="button" class="close">×</button><ul><li>총 <span id="ns">0</span>개의 상품이 판매중으로 등록되었습니다.</li><li>총 <span>0</span>개의 상품이 미출간으로 등록되었습니다.</li></ul></div>
<script>var LINES=[];document.getElementById('f').onchange=function(){if(!document.getElementById('r1').checked)return alert('바코드를 고르세요');var fr=new FileReader();fr.onload=function(){LINES=String(fr.result).trim().split('\\n');${'if(window.NOPV)return;if(window.GRIDONLY){var R=LINES.map(function(l){var a=l.split(",");return {BARCODE:a[0],ENTR_GOODS_CD:a[1],RSLT_MSG:""}});var gv={getDataSource:function(){return {getRowCount:function(){return R.length},getJsonRow:function(i){return R[i]}}},getItemIndex:function(i){return i}};document.getElementById("productGrid").__vue__={gridView:gv};return;}'}document.getElementById('productGrid').innerText=LINES.join(' | ')};fr.readAsText(this.files[0])};
document.getElementById('reg').onclick=function(){if(!LINES.length)return alert('파일 없음');if(!confirm('선택한 상품을 등록하시겠습니까?'))return;if(window.DONE_MODE==='noreg')return;api('/api/Product/BulkReg',{lines:LINES},function(t){var j=JSON.parse(t);if(window.DONE_MODE==='inform'){var d=document.createElement('div');d.className='modal';d.setAttribute('role','dialog');d.innerText='상품저장 '+j.n+'/'+j.n+'건의 상품이 등록 되었습니다.';document.body.appendChild(d);return}if(window.DONE_MODE==='silent')return;document.getElementById('ns').innerText=j.n;document.getElementById('pop').style.display='block'})};
document.querySelector('#pop .close').onclick=function(){document.getElementById('pop').style.display='none'};</script>`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => { S.log.push({ m: q.method, p: u.pathname, body: b.slice(0, 300) });
      const H = (code, type, body) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8' }); s.end(body); };
      if (u.pathname === '/api/Product/BulkReg') { const o = JSON.parse(b || '{}'); let n = 0; for (const ln of o.lines || []) { const [isbn, self] = ln.split(','); if (!isbn || !self) continue; S.prods.unshift({ GOODS_NO: String(++S.seq), EAN: isbn, ENTR_GOODS_CD: self }); n++; } S.regs.push(n); return H(200, 'application/json', JSON.stringify({ n, RESULT_CODE: 'S000' })); }
      if (u.pathname === '/api/Product/GetReadExcelFile') { const o = JSON.parse(b || '{}'); S.chk.push((o.PRODUCT_LIST || []).length); return H(200, 'application/json', JSON.stringify({ RESULT_CODE: 'S000', RESULT_LIST: (o.PRODUCT_LIST || []).map((x) => ({ BARCODE: x.BARCODE, GOODS_NO: '', MAN_NO: x.MAN_NO, ERROR_CODE: S.vmErr || 0 })) })); }
      if (u.pathname === '/api/Product/ProductList') return H(200, 'application/json', JSON.stringify({ PRODUCT_LIST: S.prods, TOTAL_COUNT: S.prods.length, RESULT_CODE: 'S000' }));
      if (u.pathname === '/api/Product/DeleteAll') { S.prods = []; return H(200, 'application/json', '{}'); }
      if (u.pathname.startsWith('/api/')) return H(200, 'application/json', JSON.stringify({ RESULT_LIST: [], TOTAL_COUNT: 0 }));
      if (u.pathname === '/') return H(200, 'text/html', page('판매관리', '첫 화면'));
      if (u.pathname === '/Product/BulkRegistrationByExcel') return H(200, 'text/html', bulk().replace('<body>', S.noPreview ? '<body><script>window.NOPV=1</script>' : S.gridOnly ? '<body><script>window.GRIDONLY=1</script>' : '<body>').replace('</body>', S.vm ? VMJS(S.vm) + '</body>' : '</body>').replace('</head>', S.done ? `<script>window.DONE_MODE=${JSON.stringify(S.done)}</script></head>` : '</head>'));
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
    { const J = RG.judgePre; const V = (o) => ({ vm: true, w: { ch: 1, called: 1, parsed: { n: 1, keys: ['바코드'], emp: [] } }, nList: 1, res: true, rows: [{ bc: '8809866320756', no: '', e: 0 }], reg: 1, ...o });
      ok(J(['8809866320756'], null) === '' && J(['8809866320756'], { vm: false }) === '' && J(['8809866320756'], V({ res: false })) === '' && J(['8809866320756'], V()) === '', '판단: 화면 부품이 없거나 결과 전·오류 0이면 멈추지 않음(예전 판단 그대로)');
      const m1 = J(['8809866320756'], V({ rows: [{ bc: '8809866320756', e: -2 }], reg: 0 })), m2 = J(['8809866320756'], V({ rows: [{ bc: '1111111111111', e: 0 }] })), m3 = J(['8809866320756'], V({ nList: 0, res: true, rows: [], w: { ch: 1, called: 1, parsed: { n: 1, keys: ['상품번호', '판매가'], emp: ['판매가'] } } })), m4 = J(['8809866320756'], V({ reg: 0 }));
      ok([m1, m2, m3, m4].every((m) => m.startsWith(RG.PRE_HEAD)) && /오류코드 -2 그 바코드로 등록된 상품이 없음/.test(m1) && /결과 표에 없음/.test(m2) && /상품번호,판매가/.test(m3) && /빈 칸: 판매가/.test(m3) && /등록 가능한 줄 0/.test(m4), '판단: 오류코드 뜻·결과에 없음·바코드 칸 빔·등록 가능 0 → 머리글 「예스24 엑셀 확인 결과(누르기 전 멈춤…)」', [m1, m2, m3, m4].join(' / '));
      const big = RG.fitRaw({ net: Array.from({ length: 12 }, () => ({ p: '/api/Product/X', st: 200, req: 'r'.repeat(300), body: 'b'.repeat(300) })), vs: { rows: Array.from({ length: 30 }, () => ({ bc: '9788900000001', no: '', e: 0 })) }, btn: Array(20).fill('단추'), txt: 't'.repeat(300) });
      ok(JSON.stringify(big).length <= 2800, 'raw 줄이기 2800자 안', JSON.stringify(big).length);
      const H0 = '<div><button>엑셀파일 업로드</button><input type="file" id="a"></div><input type="file" id="b">'; ok(typeof RG._js.JS_MARK_FILE === 'string' && /data-rn-up/.test(RG._js.JS_MARK_FILE) && H0, '파일 칸 고르기 코드 있음'); }
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
    console.log('③-2 (y24first1 · HOME 11/14) 미리보기가 그림 표(RealGrid)라 화면 글에 줄이 없어도 표 자료에서 우리 줄을 찾음');
    Y.S.gridOnly = true; { const n3 = Y.S.regs.length; await H.api('POST', '/y24/reg/put', job('job-G', [row(5)])); const xg = await resOf('job-G'); ok(xg && xg.state === 'done' && Y.S.regs.length === n3 + 1, '표 자료(getDataSource·getJsonRow)에서 ISBN을 보고 [등록] → done', xg && xg.msg); } Y.S.gridOnly = false;
    console.log('④ 미리보기가 안 뜨면 멈춤');
    Y.S.noPreview = true; const n2 = Y.S.regs.length; await H.api('POST', '/y24/reg/put', job('job-E', [row(4)])); x = await resOf('job-E');
    ok(x && x.state === 'fail' && x.pre && /미리보기/.test(x.msg) && x.todo && Y.S.regs.length === n2, '미리보기 목록에 우리 줄이 없으면 [등록]을 누르지 않고 멈춤 + 사람이 할 일', x && x.msg);
    ok(!Y.S.log.some((l) => /DeleteAll/.test(l.p)) && Y.S.prods.length >= 4, '상품삭제 같은 다른 단추는 끝까지 안 누름');
    ok(fs.readdirSync(path.join(D, 'home', 'y24reg')).length === 0, '올린 엑셀 임시 파일은 끝나면 지움(이 PC 안)');
    console.log('⑤ (0.1.72 y24reg3 · HOME 11/16 표 0줄) 화면 부품(Vue)의 서버 확인 결과를 읽고 오류면 누르기 전에 멈춤');
    Y.S.noPreview = false; Y.S.vm = 'ok'; Y.S.vmErr = 0; { const n5 = Y.S.regs.length, c5 = Y.S.chk.length; await H.api('POST', '/y24/reg/put', job('job-V1', [row(6)])); const xv = await resOf('job-V1');
      ok(xv && xv.state === 'done' && Y.S.regs.length === n5 + 1 && Y.S.chk.length === c5 + 1, '서버 확인 오류코드 0 → 표 글이 없어도 [등록] → done', xv && xv.msg); }
    Y.S.vm = 'err'; Y.S.vmErr = -4; { const n6 = Y.S.regs.length; await H.api('POST', '/y24/reg/put', job('job-V2', [row(7)])); const xe = await resOf('job-V2');
      ok(xe && xe.state === 'fail' && xe.pre && xe.msg.startsWith(RG.PRE_HEAD) && /오류코드 -4/.test(xe.msg) && /상태정보/.test(xe.msg) && Y.S.regs.length === n6, "서버가 오류코드 -4 → '예스24 엑셀 확인 결과(누르기 전 멈춤…)'로 멈춤 · [등록] 안 누름", xe && xe.msg);
      const rw = (xe && xe.raw) || {}; ok(rw.fi && rw.fi.n === 1 && rw.fi.pick === 0 && /단추 곁/.test(rw.fi.how) && rw.fi.vm && rw.up && rw.up.ch >= 1 && rw.up.called === 1 && rw.vs && rw.vs.rows && rw.vs.rows[0].e === -4 && (rw.net || []).some((q) => /GetReadExcelFile/.test(q.p) && /ERROR_CODE/.test(q.body || '')) && JSON.stringify(rw).length <= 3000, 'raw에 파일 칸·change·읽기 수·서버 결과·요청/응답 앞부분(3000자 안)', JSON.stringify(rw).slice(0, 400)); }
    Y.S.vm = 'empty'; { const n7 = Y.S.regs.length, c7 = Y.S.chk.length; await H.api('POST', '/y24/reg/put', job('job-V3', [row(8)])); const xm = await resOf('job-V3');
      ok(xm && xm.state === 'fail' && xm.pre && xm.msg.startsWith(RG.PRE_HEAD) && /'바코드' 칸이 비어/.test(xm.msg) && /상품번호/.test(xm.msg) && Y.S.regs.length === n7 && Y.S.chk.length === c7, "엑셀 머리글이 달라 '바코드' 칸이 비면 읽은 칸 이름과 함께 멈춤", xm && xm.msg); }
    Y.S.vm = '';
    console.log("⑥ (y24reg5 · 0.1.75 · HOME 11/17 00:08Z 블루레이) '등록 완료' 창이 없어도 등록상품 목록(자체코드)으로 확인 · 누르기는 늘지 않음");
    Y.S.done = 'inform'; { const n8 = Y.S.regs.length, r8 = Y.S.log.filter((l) => l.p === '/api/Product/BulkReg').length; await H.api('POST', '/y24/reg/put', job('job-I1', [row(9)])); const xi = await resOf('job-I1');
      ok(xi && xi.state === 'done' && xi.gno && xi.gno.aladin_U9 && xi.cnt && xi.cnt.sale === 1 && xi.cnt.tot === 1 && Y.S.regs.length === n8 + 1 && Y.S.log.filter((l) => l.p === '/api/Product/BulkReg').length === r8 + 1, "알림 창 「1/1건의 상품이 등록 되었습니다」(미출간 0일 때 예스24 원문) → 셈 읽고 목록에서 확인 → done", xi && xi.msg); }
    Y.S.done = 'silent'; { const n9 = Y.S.regs.length; await H.api('POST', '/y24/reg/put', job('job-I2', [row(10)])); const xs = await resOf('job-I2', 200);
      ok(xs && xs.state === 'done' && xs.gno && xs.gno.aladin_U10 && Y.S.regs.length === n9 + 1 && /못 봄/.test(xs.msg) && xs.raw && xs.raw.vl && xs.raw.vl.k === 1, "창·알림을 전혀 못 봐도 등록상품 목록에 자체코드가 있으면 done(예전엔 unsure로 멈춤)", xs && xs.msg); }
    Y.S.done = 'noreg'; { const n10 = Y.S.regs.length, r10 = Y.S.log.filter((l) => l.p === '/api/Product/BulkReg').length; await H.api('POST', '/y24/reg/put', job('job-I3', [row(11)])); const xn = await resOf('job-I3', 200);
      ok(xn && xn.state === 'unsure' && !Object.keys(xn.gno || {}).length && Y.S.regs.length === n10 && Y.S.log.filter((l) => l.p === '/api/Product/BulkReg').length === r10 && xn.todo && 'raw' in xn, '목록에도 없고 창도 없으면 unsure(다시 누르지 않음 · 사람/클라우드 확인)', xn && xn.msg); }
    Y.S.done = '';
    ok(JSON.stringify(RG.doneCounts('상품저장 1/1건의 상품이 등록 되었습니다.')) === '{"sale":1,"unpub":0,"tot":1,"fail":0}' && RG.doneCounts('2/3건의 상품이 등록 되었습니다. 상품[8809866320756] 등록에 실패했습니다.').fail === 1 && RG.doneCounts('', { tot: 1, pc: 1, un: 0, pub: 1 }).sale === 1 && RG.doneCounts('', { tot: 1, pc: 0, un: 0, pub: 0 }) === null, '알림 글·실패 글·화면 부품 셈 읽기');
    ok(JSON.stringify(RG.mnoOf([{ lid: 'a', bc: '8809866320756', isbn: '8809866320756' }, { lid: 'b', isbn: '9788900000009' }], { rows: [{ bc: '8809866320756', no: '150109556' }, { bc: '9788900000009', no: '' }] })) === '{"a":"150109556"}', '카탈로그 상품번호(mno) 짝 — 번호가 있을 때만');
    ok(JSON.stringify(RG.netIns([{ p: '/api/Product/InsertProductByExcel', st: 200, body: '{"RESULT_CODE":"S000","UNPUBLISHED_YN":"N","X":1}' }, { p: '/api/Product/ProductList', st: 200, body: '{}' }])) === '[{"st":200,"rc":"S000","un":"N"}]', '[등록] 응답은 결과 코드·미출간 표시만');
  } finally { try { await H.stop(); } catch (e) {} killDir(D); }
  Y.srv.close(); L.done('t_y24reg');
})();
