const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const s = fs.readFileSync('/home/claude/w/readnow-collector.user.js', 'utf8'); const a = s.indexOf('  function makeFiller(doc, W0, opt) {'); const b = s.indexOf('    return { fill, attachImages, attachOne, photoTodo, prep, hook, $ }; }', a); const MF = s.slice(a, b) + '    return { attachOne, editorPhoto, fitWidth }; }';
const PAGE = `<html><head><script src="/jq.js"></script></head><body><input id="mainCover" value=""><img id="mainCoverimg" src="space.gif"><script>var ED=''; var Editor={getContent:()=>ED}; var EditorManager={pasteContent:(h)=>{ED+=h;}}; function InsertHtml(img){ EditorManager.pasteContent(img); }</script></body></html>`;
// 알라딘이 돌려줄 법한 화면(모양 추정 — 실제는 reg_probe로 확인): 대표 창은 pd(id)로 opener 칸 채움 · 편집기 창은 opener.InsertHtml
const RESP_MAIN = `<html><head><script type="text/javascript">function pd(objId){ return window.opener.document.getElementById(objId); } pd('mainCover').value='scm996008826671.jpg'; pd('mainCoverimg').src='https://image.aladin.co.kr/usedshop/scm996008826671.jpg'; self.close();</script></head><body></body></html>`;
const RESP_ED = `<html><body>ok <a href="https://image.aladin.co.kr/Community/y/zz.jpg">x</a></body></html>`;
(async () => { const br = await chromium.launch(); const p = await br.newPage(); const posts = [];
  await p.route('**/*', async (r) => { const u = r.request().url(); if (u.endsWith('/scm/wrecord.aspx')) return r.fulfill({ body: PAGE, contentType: 'text/html; charset=utf-8' });
    if (u.includes('/scm/upload/imgUpPopup.aspx') && r.request().method() === 'POST') { posts.push(['main', (r.request().postData() || '').match(/name="(\w+)"/g)]); return r.fulfill({ body: RESP_MAIN, contentType: 'text/html; charset=utf-8' }); }
    if (u.includes('/scm/upload/wimage_upload_scm.aspx') && r.request().method() === 'POST') { posts.push(['ed', (r.request().postData() || '').match(/name="(\w+)"/g)]); return r.fulfill({ body: RESP_ED, contentType: 'text/html; charset=utf-8' }); }
    return r.fulfill({ status: 404, body: '' }); });
  await p.goto('https://www.aladin.co.kr/scm/wrecord.aspx'); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const out = await p.evaluate(async (MF) => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const nowIso = () => new Date().toISOString(); const PC_NAME = 'T'; const W = () => ({}); const probes = [];
    const C = (n) => ({ doc: (id) => ({ set: async (v) => probes.push([n, id, Object.keys(v.last || {})]) }) }); const firebase = {};
    const makeFiller = eval('(' + MF.trim().replace(/^function makeFiller/, 'function') + ')'); const F = makeFiller(document, window, { auto: true });
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 800; const blob = await new Promise((r) => cv.toBlob(r, 'image/png')); const file = new File([blob], 'big.png', { type: 'image/png' });
    const fit = await F.fitWidth(file, 570); const bm = await createImageBitmap(fit);
    const r1 = await F.attachOne('mainCover', file); const r2 = await F.editorPhoto(file, '설명1');
    return { fitW: bm.width, fitName: fit.name, r1, mainVal: document.getElementById('mainCover').value, r2, ED: Editor.getContent(), probes }; }, MF);
  console.log(JSON.stringify({ ...out, posts }, null, 1)); console.log('ERRS', errs); await br.close(); })();
