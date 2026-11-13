#!/usr/bin/env node
/* 🌐 Firebase Hosting에 낼 결과물 모으기 (11/10 · 1단계 — 지금 주소는 그대로 두고 같은 결과물을 새 주소에도 함께 냄)
 *  쓰임: node hosting/build.js [저장소 뿌리=이 파일 위 폴더] [내보낼 폴더=<뿌리>/.hosting/public]
 *  · 경로는 지금 공개 주소와 같은 모양으로 둠 — 예) …/readnow-scripts/app/ → <새 주소>/app/ · …/main/local/readnow-local.js → <새 주소>/local/readnow-local.js
 *    (나중에 주소를 바꿀 때 앞부분만 바꾸면 되게)
 *  · 담는 것은 아래 KEEP 목록뿐(브라우저·PC 도우미·수집기가 받는 파일) — 설명 글(.md)·진단·근거 자료·원본(src)·클라우드 코드는 담지 않음
 *  · 끝에 hosting-stamp.json(커밋·시각·파일 수)을 둠 — 배포 뒤 '올라간 것이 이 커밋인가' 확인용 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const OUT = path.resolve(process.argv[3] || path.join(ROOT, '.hosting', 'public'));
/* [뿌리 기준 경로, 폴더면 true] */
const KEEP = [['index.html'], ['pc-live.json'], ['app', true], ['manual', true], ['friend', true], ['aladin-terms', true], ['yes24-terms', true], ['facts-docs', true], ['local', true], ['lab/col2', true], ['lab/pcdock', true] /* (11/12 pcdock1) 🖥 PC 배치 도우미 묶음·설치 파일 */, ['shop/shelf-core.js'], ['cloud/shop-promo.js'], ['ui2', true] /* (priv1 11/13) 🧩 리드나우 2 — readnow-ui2 저장소의 결과물 사본(그 저장소 tools/to-scripts.sh가 넣음) → readnow.kr/ui2/ */, ['src/readnow-collector.src.js'] /* (priv1 11/13) 웹앱 번외(c2BenchFn·c2PubFn)가 운영 본체 글을 읽는 곳 — 저장소 비공개 뒤에도 */, ['cloud/setup-autodeploy.sh'], ['cloud/setup-billing.sh'], ['cloud/setup-hardening.sh'], ['cloud/setup-static-ip.sh'], ['cloud/setup-diagkey.sh'], ['cloud/setup-cloudbuild.sh'], ['cloud/setup-once.sh'] /* (cbuild 11/13) 🔑🛍☁ 한 번에 준비 — 진단 열쇠·우리숍 공개·Cloud Build 트리거 */ /* (priv2 11/13) ☁ 클라우드 배포를 Cloud Build 트리거로 — Cloud Shell 한 줄 */ /* (priv1 11/13) Cloud Shell 설치 글(비밀 없음) — curl -sL https://readnow.kr/cloud/setup-….sh | bash */]; /* (11/11 shopc1) 관리 웹앱 🏷 할인·배지가 같은 셈 파일을 ../cloud/shop-promo.js로 읽음(순수 셈 하나 · 비밀 없음) */ /* (11/11 shelf1) 관리 웹앱 📚 서가 책장 설정이 같은 주소에서 설정 틀을 읽게(손님 화면 파일 하나만) */
const TOP_JS = /^readnow-[a-z0-9-]+(\.user)?\.js$/; /* 뿌리의 수집기·감시기·공용 파일(readnow-*.js · *.user.js) */
const SKIP = (rel) => /(^|\/)\./.test(rel) || /\.md$/i.test(rel) || /\.storage\.json$/i.test(rel) || /(^|\/)node_modules\//.test(rel);

function copyTree(src, dst, rel, list) {
  const st = fs.statSync(src);
  if (st.isDirectory()) { for (const n of fs.readdirSync(src).sort()) copyTree(path.join(src, n), path.join(dst, n), rel ? rel + '/' + n : n, list); return; }
  if (SKIP(rel)) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); list.push({ f: rel, n: st.size });
}

function build(root = ROOT, out = OUT) {
  if (!fs.existsSync(path.join(root, 'readnow-collector.user.js'))) throw new Error('저장소 뿌리가 아님(readnow-collector.user.js 없음): ' + root);
  if (path.resolve(out) === path.resolve(root)) throw new Error('내보낼 폴더가 저장소 뿌리와 같음');
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const list = [];
  for (const [p] of KEEP) { const s = path.join(root, p); if (fs.existsSync(s)) copyTree(s, path.join(out, p), p, list); }
  for (const n of fs.readdirSync(root).sort()) if (TOP_JS.test(n)) copyTree(path.join(root, n), path.join(out, n), n, list);
  fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n'); list.push({ f: 'robots.txt', n: 26 });
  let commit = process.env.GITHUB_SHA || ''; if (!commit) { try { commit = cp.execSync('git -C "' + root + '" rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) {} }
  let pcVer = null; try { pcVer = JSON.parse(fs.readFileSync(path.join(root, 'pc-live.json'), 'utf8')).ver || null; } catch (e) {}
  const stamp = { commit: commit || null, at: new Date().toISOString(), files: list.length + 1, bytes: list.reduce((a, x) => a + x.n, 0), pcLive: pcVer };
  fs.writeFileSync(path.join(out, 'hosting-stamp.json'), JSON.stringify(stamp));
  return { out, list, stamp };
}

module.exports = { build, KEEP, TOP_JS, SKIP };
if (require.main === module) {
  const r = build();
  console.log(`🌐 Hosting 결과물 ${r.stamp.files}개 · ${(r.stamp.bytes / 1048576).toFixed(1)}MB → ${r.out} (커밋 ${String(r.stamp.commit).slice(0, 7)} · 수집기 ${r.stamp.pcLive})`);
}
