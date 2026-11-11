#!/usr/bin/env node
/* 🛍 Firebase Hosting 사이트 만들기(없을 때만) — 우리숍 둘째 사이트 (11/11 shop1)
 *  쓰임: HOSTING_TOKEN=<1회용 토큰> node hosting/site.js [사이트 이름=hosting/shop.json의 site] [프로젝트=readnow-3a385]
 *  · 있으면 아무것도 안 바꿈 · 없으면 만듦(돈 안 듦 — 같은 프로젝트의 무료 한도 안 · 사이트 이름은 web.app 주소라 세상에 하나뿐 → 남이 쓰면 실패를 알림)
 *  · 결과를 표준 출력과 GITHUB_STEP_SUMMARY에 */
'use strict';
const fs = require('fs'), path = require('path');
const API = (process.env.HOSTING_API || 'https://firebasehosting.googleapis.com').replace(/\/$/, '');
const TOKEN = process.env.HOSTING_TOKEN || '';
const conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop.json'), 'utf8'));
async function call(method, url) { const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined }); const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch (e) {} return { ok: r.ok, status: r.status, j, t }; }
async function ensure(site, proj) {
  const g = await call('GET', `${API}/v1beta1/projects/${proj}/sites/${site}`); if (g.ok) return { site, made: false, url: g.j.defaultUrl || `https://${site}.web.app` };
  if (g.status !== 404) throw new Error(`사이트 읽기 실패 HTTP ${g.status} ${(g.j.error && g.j.error.message) || g.t.slice(0, 160)}`);
  const c = await call('POST', `${API}/v1beta1/projects/${proj}/sites?siteId=${encodeURIComponent(site)}`); if (!c.ok) throw new Error(`사이트 만들기 실패 HTTP ${c.status} ${(c.j.error && c.j.error.message) || c.t.slice(0, 160)} — 이름이 이미 쓰이면 다른 이름(예 booksqueen-shop)을 hosting/shop.json site에`);
  return { site, made: true, url: c.j.defaultUrl || `https://${site}.web.app` };
}
module.exports = { ensure };
if (require.main === module) { const site = process.argv[2] || process.env.SHOP_SITE || conf.site; const proj = process.argv[3] || 'readnow-3a385';
  if (!TOKEN) { console.log('::warning::HOSTING_TOKEN 없음 — 건너뜀'); process.exit(0); }
  ensure(site, proj).then((r) => { const m = `🛍 Hosting 사이트 ${r.site} ${r.made ? '새로 만듦' : '이미 있음'} · ${r.url}`; console.log(m); if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### ' + m + '\n'); })
    .catch((e) => { console.log('::error::' + e.message); process.exit(1); }); }
