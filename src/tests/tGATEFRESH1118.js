/* tGATEFRESH1118 — 시험 서버가 띄우는 웹앱(/app/)이 이 커밋 원본(src/app.html)으로 새로 지은 것인지 (gateused1 11/18 · chk1040 확인)
 * 까닭: 시험 문지기(test-gate)가 그 커밋에 올라 있던 app/(옛 결과물)을 띄워, /app/index.html을 여는 시험 26개+가 새 화면 대신 옛 화면을 보고 통과·실패했음
 * 하는 일(브라우저 없음 · 2초): RN_APP(시험 자리 app.html = 이 커밋 src/app.html 사본)에서 release.js와 같은 방법으로 본문 스크립트를 떼어
 *   서버의 /app/readnow-webapp.js · /app/index.html과 견줌(설명서 판 줄 MANUAL_VER는 지을 때 채우므로 양쪽 다 지움)
 *   → 옛 결과물이면 ❌ · 새로 지은 것이면 ✅
 * 쓰는 법: RN_PORT=<시험 서버> RN_APP=<app.html> node tGATEFRESH1118.js */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const PORT = process.env.RN_PORT || '8766'; const APP = process.env.RN_APP || path.join(__dirname, '..', 'app.html');
const get = (p) => new Promise((res, rej) => { http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => { let b = ''; r.setEncoding('utf8'); r.on('data', (d) => { b += d; }); r.on('end', () => res({ code: r.statusCode, body: b })); }).on('error', rej); });
const noMan = (t) => t.replace(/^const MANUAL_VER = [^\n]*$/m, 'const MANUAL_VER = …;');
(async () => {
  const fail = []; const ok = (m) => console.log('  ✓ ' + m); const no = (m) => { fail.push(m); console.log('  ❌ ' + m); };
  const html = fs.readFileSync(APP, 'utf8'); const st = html.indexOf('\n<script>\n'); const en = html.lastIndexOf('\n</script>\n</body>');
  if (st < 0 || en < st) { console.log('❌ 원본 app.html에서 본문 스크립트 자리를 못 찾음'); process.exit(1); }
  let js = html.slice(st + '\n<script>\n'.length, en); const vm = js.match(/^const APP_VER = '([\d.]+)';[^\n]*$/m);
  if (!vm) { console.log('❌ 원본 app.html에 APP_VER 줄이 없음'); process.exit(1); }
  js = js.replace(vm[0], () => '/* APP_VER — app/index.html 틀에 있음(서비스 워커·새 판 확인이 그 줄을 읽음) */');
  const sj = await get('/app/readnow-webapp.js'), si = await get('/app/index.html');
  if (sj.code !== 200 || si.code !== 200) no(`시험 서버가 /app/을 못 줌(본문 ${sj.code} · 틀 ${si.code})`);
  else {
    const sv = (si.body.match(/const APP_VER = '([\d.]+)'/) || [])[1];
    if (sv === vm[1]) ok(`/app/index.html 판 번호 ${sv} = 원본`); else no(`/app/index.html 판 번호 ${sv || '없음'} ≠ 원본 ${vm[1]} — 옛 결과물을 띄움`);
    if (si.body.includes(`readnow-webapp.js?v=${vm[1]}`)) ok('/app/index.html이 이 판 본문(readnow-webapp.js?v=' + vm[1] + ')을 부름'); else no('/app/index.html이 이 판 본문을 부르지 않음');
    if (noMan(sj.body) === noMan(js)) ok(`/app/readnow-webapp.js(${Math.round(sj.body.length / 1024)}KB) = 원본 본문(설명서 판 줄만 뺌)`);
    else { const a = noMan(sj.body).split('\n'), b = noMan(js).split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
      no(`/app/readnow-webapp.js가 원본 본문과 다름 — 옛 결과물을 띄움(첫 다른 줄 ${i + 1}: 띄움 「${(a[i] || '(끝)').slice(0, 60)}」 · 원본 「${(b[i] || '(끝)').slice(0, 60)}」)`); }
  }
  console.log(fail.length ? `❌ tGATEFRESH1118 실패 ${fail.length}` : '✅ tGATEFRESH1118 통과 — 시험 서버의 웹앱이 이 커밋 원본으로 새로 지은 것');
  process.exit(fail.length ? 1 : 0);
})().catch((e) => { console.log('❌ tGATEFRESH1118 오류: ' + e.message); process.exit(1); });
