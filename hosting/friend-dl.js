#!/usr/bin/env node
/* 🐾 책방 친구 설치 파일을 readnow.kr/dl/friend/ 에 함께 냄 (priv1 11/13 · 저장소 비공개 준비)
 *  쓰임(GitHub 자동 작업 '결과물 함께 내기' 안): GH_TOKEN=<작업 열쇠> node hosting/friend-dl.js <내보낼 폴더=.hosting/public/dl/friend>
 *  · 가장 새 friend-v… 판(GitHub Releases)의 파일(…_x64-setup.exe · .apk)을 받아 그 폴더에 둠 — 비공개 저장소의 판도 작업 열쇠로 받힘
 *  · latest.json { tag, ver, at, files:[{ name, size, kind(win|android), url }] } — 책방 친구 프로그램 '업데이트 확인'이 GitHub 대신 읽을 곳
 *  · index.html — 웹앱 🐾 '설치 파일 받기' 단추가 여는 쪽(윈도우·안드로이드 받기 단추만)
 *  · 받기를 못 하면 1로 끝남(작업은 경고만 · 다른 결과물은 그대로 올림) */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = process.env.GITHUB_REPOSITORY || 'jerrycson/readnow-scripts';
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', '.hosting', 'public', 'dl', 'friend'));
const H = (acc) => ({ Accept: acc || 'application/vnd.github+json', 'User-Agent': 'readnow-hosting', ...(process.env.GH_TOKEN ? { Authorization: 'Bearer ' + process.env.GH_TOKEN } : {}) });
const kindOf = (n) => (/\.apk$/i.test(n) ? 'android' : /-setup\.exe$/i.test(n) ? 'win' : null);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function page(J) {
  const row = (f) => `<a class="b" href="${esc(f.name)}" download>${f.kind === 'win' ? '🖥 윈도우 PC 프로그램' : '📱 안드로이드 앱'}<small>${esc(f.name)} · ${(f.size / 1048576).toFixed(1)}MB</small></a>`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>책방 친구 설치 파일</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:24px 16px;background:#FBF8F2;color:#2B2B2B}main{max-width:520px;margin:0 auto}h1{font-size:20px}.b{display:block;padding:14px 16px;margin:10px 0;border-radius:12px;background:#fff;border:1px solid #E5DFD3;color:inherit;text-decoration:none;font-weight:600}.b small{display:block;font-weight:400;color:#777;margin-top:4px}p{color:#666;font-size:14px;line-height:1.6}</style></head>
<body><main><h1>🐾 책방 친구 설치 파일 — 판 ${esc(J.ver)}</h1>${J.files.map(row).join('')}
<p>윈도우: 받은 …-setup.exe를 열어 설치합니다. 안드로이드: 받은 .apk를 열고 '출처를 알 수 없는 앱' 허용 뒤 설치합니다.<br>올린 때 ${esc(J.at)}</p></main></body></html>`;
}

async function main() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`, { headers: H() });
  if (!r.ok) throw new Error('판 목록을 못 받음 HTTP ' + r.status);
  const rel = (await r.json()).filter((x) => /^friend-v\d+\.\d+\.\d+$/.test(x.tag_name) && !x.draft && !x.prerelease).sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)))[0];
  if (!rel) throw new Error('friend-v… 판이 없음');
  fs.mkdirSync(OUT, { recursive: true });
  const files = [];
  for (const a of rel.assets || []) { const kind = kindOf(a.name); if (!kind || !/^[\w.-]+$/.test(a.name)) continue;
    const g = await fetch(a.url, { headers: H('application/octet-stream'), redirect: 'follow' }); if (!g.ok) throw new Error(a.name + ' 받기 실패 HTTP ' + g.status);
    const buf = Buffer.from(await g.arrayBuffer()); if (a.size && buf.length !== a.size) throw new Error(a.name + ' 크기가 다름');
    fs.writeFileSync(path.join(OUT, a.name), buf); files.push({ name: a.name, size: buf.length, kind, url: 'https://readnow.kr/dl/friend/' + a.name }); }
  if (!files.length) throw new Error(rel.tag_name + ' 판에 설치 파일이 없음');
  const J = { tag: rel.tag_name, ver: rel.tag_name.replace(/^friend-v/, ''), at: rel.published_at, files };
  fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(J)); fs.writeFileSync(path.join(OUT, 'index.html'), page(J));
  console.log(`🐾 책방 친구 ${J.tag} 설치 파일 ${files.length}개 → ${OUT}`); return J;
}
module.exports = { main, page, kindOf };
if (require.main === module) main().catch((e) => { console.error('⚠ ' + e.message); process.exit(1); });
