#!/usr/bin/env node
/* 🛍 우리숍(booksqueen.com) 결과물 모으기 (11/11 shop1) — shop/ 폴더 그대로 + robots.txt(검색 허용) + hosting-stamp.json
 *  쓰임: node hosting/build-shop.js [저장소 뿌리] [내보낼 폴더=<뿌리>/.hosting/shop]
 *  · 관리 웹앱(app/)·설명서·수집기 파일은 담지 않음 — 이 사이트엔 손님 화면만 · 설명 글(.md)도 뺌 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const OUT = path.resolve(process.argv[3] || path.join(ROOT, '.hosting', 'shop'));
const ROBOTS = 'User-agent: *\nAllow: /\nSitemap: https://booksqueen.com/sitemap.xml\n';
const OK = /\.(html|css|js|png|jpg|webp|svg|ico|txt)$/i;
function build(root = ROOT, out = OUT) {
  const src = path.join(root, 'shop'); if (!fs.existsSync(path.join(src, 'index.html'))) throw new Error('shop/index.html 없음: ' + src);
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true }); const list = [];
  for (const n of fs.readdirSync(src).sort()) { const p = path.join(src, n); if (!fs.statSync(p).isFile() || !OK.test(n) || n.startsWith('.')) continue; fs.copyFileSync(p, path.join(out, n)); list.push(n); }
  { const walk = (d, rel) => { if (!fs.existsSync(d)) return; for (const n of fs.readdirSync(d).sort()) { if (n.startsWith('.')) continue; const p = path.join(d, n); const r = rel + '/' + n; if (fs.statSync(p).isDirectory()) { if (/^q\d{2}$/.test(n)) walk(p, r); continue; } if (!/\.(svg|json|js)$/i.test(n)) continue; fs.mkdirSync(path.join(out, rel), { recursive: true }); fs.copyFileSync(p, path.join(out, r)); list.push(r); } }; walk(path.join(src, 'brand'), 'brand'); } /* (11/13 shoplogo1) 👑 로고 시안 그림·목록·셈(brand/ · 시안별 판 폴더 qNN/ 포함) — 미리보기·프로젝트 html은 손님 사이트에 올리지 않음(관리 사이트 readnow.kr/shop/brand/에만) */
  fs.writeFileSync(path.join(out, 'robots.txt'), ROBOTS); /* (11/11 shop2) Sitemap 줄 — /sitemap.xml은 클라우드가 판매중 목록에서 만듦(hosting/shop.json rewrites) */ list.push('robots.txt');
  let commit = process.env.GITHUB_SHA || ''; if (!commit) { try { commit = cp.execSync('git -C "' + root + '" rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) {} }
  const stamp = { commit: commit || null, at: new Date().toISOString(), files: list.length + 1 }; fs.writeFileSync(path.join(out, 'hosting-stamp.json'), JSON.stringify(stamp));
  return { out, list, stamp };
}
module.exports = { build, ROBOTS };
if (require.main === module) { const r = build(); console.log(`🛍 우리숍 결과물 ${r.stamp.files}개 → ${r.out} (커밋 ${String(r.stamp.commit).slice(0, 7)})`); }
