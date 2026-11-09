#!/usr/bin/env node
/* 🌐 Firebase Hosting 사용자 지정 도메인 등록·상태 보기 (11/10 · 2단계 준비)
 *  쓰임: HOSTING_TOKEN=<구글 접근 토큰> node hosting/domain.js [도메인=readnow.kr] [사이트=firebase.json의 site]
 *    · DOMAIN_MODE=status → 읽기만(없으면 '없음'만 알림) · 기본(register) → 없으면 등록하고 상태를 읽음 · 있으면 상태만 읽음(아무것도 바꾸지 않음)
 *    · HOSTING_API=<주소> → 시험용 가짜 서버 · 토큰은 자동 작업(OIDC)이 받은 1회용 — 출력에 남기지 않음
 *  출력: Firebase가 바라는 DNS 레코드(A·TXT·CNAME·ACME) · 지금 DNS에서 찾은 것 · 주인 확인·호스트·인증서 상태 · 남은 문제
 *    → 표준 출력과 GITHUB_STEP_SUMMARY(있으면)에 그대로 · domain-status.json(작업 결과물)
 *  API: v1beta1 projects/-/sites/<사이트>/customDomains (POST ?customDomainId=<도메인> · GET <도메인>) */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const API = (process.env.HOSTING_API || 'https://firebasehosting.googleapis.com').replace(/\/$/, '');
const TOKEN = process.env.HOSTING_TOKEN || '';

async function call(method, url, body) {
  const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + TOKEN, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : {}; } catch (e) {}
  if (!r.ok) { const e = new Error(`${method} ${url.replace(API, '')} → HTTP ${r.status} ${(j && j.error && j.error.message) || t.slice(0, 200)}`); e.status = r.status; throw e; }
  return j || {};
}

/* 상태 말 풀이(Firebase 값 → 쉬운 말) */
const SAY = {
  HOST_UNHOSTED: '아직 Firebase로 안 옴(DNS A 레코드를 바꿔야 함)', HOST_UNREACHABLE: '도메인을 찾을 수 없음(DNS 확인)', HOST_MISMATCH: 'DNS가 Firebase가 아닌 다른 곳을 가리킴', HOST_CONFLICT: 'Firebase와 다른 곳을 함께 가리킴(옛 A 레코드 지우기)', HOST_ACTIVE: '✅ Firebase가 이 도메인을 맡음',
  OWNERSHIP_MISSING: '주인 확인 TXT가 없음', OWNERSHIP_UNREACHABLE: '주인 확인을 못 읽음', OWNERSHIP_MISMATCH: 'TXT 값이 다름', OWNERSHIP_CONFLICT: '다른 Firebase 프로젝트도 주인이라 함', OWNERSHIP_PENDING: '주인 확인 기다리는 중', OWNERSHIP_ACTIVE: '✅ 주인 확인 끝',
  CERT_PREPARING: '인증서 준비 중', CERT_VALIDATING: '인증서 확인 중(DNS가 맞으면 저절로 넘어감 · 몇 분~24시간)', CERT_PROPAGATING: '인증서 퍼지는 중', CERT_ACTIVE: '✅ 인증서 발급 끝(https 됨)', CERT_EXPIRING_SOON: '인증서 곧 끝남', CERT_EXPIRED: '인증서 끝남',
};
const say = (v) => (v ? `${v} — ${SAY[v] || ''}`.replace(/ — $/, '') : '(없음)');

/* CustomDomain → 사람이 읽는 줄들 */
function describe(cd, domain) {
  const L = [];
  L.push(`### 🌐 ${domain} (Firebase Hosting 사용자 지정 도메인)`);
  L.push(`- 호스트: ${say(cd.hostState)}`);
  L.push(`- 주인 확인: ${say(cd.ownershipState)}`);
  const c = cd.cert || {}; L.push(`- 인증서: ${say(c.state)}${c.type ? ' · ' + c.type : ''}${c.expireTime ? ' · 끝 ' + c.expireTime : ''}`);
  if (cd.reconciling) L.push('- (Firebase가 아직 맞추는 중 — 몇 분 뒤 다시 보면 바뀜)');
  const R = cd.requiredDnsUpdates || {}; const rows = [];
  for (const kind of ['desired', 'discovered']) for (const set of R[kind] || []) for (const rec of set.records || []) rows.push({ kind, name: rec.domainName || set.domainName, type: rec.type, rdata: rec.rdata, act: rec.requiredAction || '' });
  const want = rows.filter((x) => x.kind === 'desired');
  L.push('', '**DNS에 있어야 할 레코드(Firebase가 바람)**' + (R.checkTime ? ` · 확인 ${R.checkTime}` : ''));
  if (want.length) { L.push('', '| 이름 | 종류 | 값 | 할 일 |', '|---|---|---|---|'); for (const x of want) L.push(`| ${x.name} | ${x.type} | \`${x.rdata}\` | ${x.act === 'ADD' ? '더함' : x.act === 'REMOVE' ? '지움' : x.act || '그대로'} |`); }
  else L.push('- (아직 없음 — 잠시 뒤 다시 보기)');
  const got = rows.filter((x) => x.kind === 'discovered');
  if (got.length) { L.push('', '**지금 DNS에서 찾은 것**', '', '| 이름 | 종류 | 값 | 할 일 |', '|---|---|---|---|'); for (const x of got) L.push(`| ${x.name} | ${x.type} | \`${x.rdata}\` | ${x.act === 'REMOVE' ? '지움' : x.act === 'ADD' ? '더함' : '그대로'} |`); }
  const v = c.verification || {};
  if (v.dns && v.dns.desired) { L.push('', '**인증서용 DNS(ACME)**'); for (const set of v.dns.desired) for (const rec of set.records || []) L.push(`- ${rec.domainName || set.domainName} ${rec.type} \`${rec.rdata}\` ${rec.requiredAction || ''}`); }
  if (v.http && v.http.path) L.push(`- 인증서 HTTP 확인: ${v.http.path} → \`${v.http.desiredResponse || ''}\` (지금 ${v.http.lastCheckTime || '?'})`);
  if (cd.legacy) { const g = cd.legacy; L.push('', '**옛 방식 등록(콘솔)**', `- 상태: ${g.status || '?'} · 인증서: ${(g.provisioning && g.provisioning.certStatus) || '?'} · DNS: ${(g.provisioning && g.provisioning.dnsStatus) || '?'}`); const pv = g.provisioning || {}; for (const ip of pv.expectedIps || []) L.push(`- A ${g.domainName} \`${ip}\``); if (pv.certChallengeDns) L.push(`- TXT ${pv.certChallengeDns.domainName} \`${pv.certChallengeDns.token}\``); if (pv.certChallengeHttp) L.push(`- HTTP ${pv.certChallengeHttp.path} → \`${pv.certChallengeHttp.token}\``); if (pv.discoveredIps) L.push(`- 지금 DNS A: ${pv.discoveredIps.join(', ')}`); }
  for (const i of [...(cd.issues || []), ...(c.issues || [])]) L.push(`- ⚠ 남은 문제: ${i.message || JSON.stringify(i)}`);
  return L.join('\n');
}

async function run(domain, site, mode) {
  const base = `${API}/v1beta1/projects/-/sites/${site}/customDomains`;
  let cd = null, made = false;
  try { cd = await call('GET', `${base}/${encodeURIComponent(domain)}`); }
  catch (e) { if (e.status !== 404) throw e; }
  if (!cd && mode !== 'status') {
    let op = null; try { op = await call('POST', `${base}?customDomainId=${encodeURIComponent(domain)}`, {}); made = true; }
    catch (e) { if (e.status !== 409) throw e; /* 그 사이 정범님이 콘솔에서 먼저 등록함 = 이미 있음 → 상태만 읽음 */ }
    cd = (op && op.response) || null;
    for (let i = 0; i < 6 && !(cd && cd.requiredDnsUpdates); i++) { /* 등록 직후엔 DNS 바람이 비어 있을 수 있음 → 조금 기다려 다시 읽음 */
      await new Promise((r) => setTimeout(r, Number(process.env.DOMAIN_WAIT_MS || 5000)));
      try { cd = await call('GET', `${base}/${encodeURIComponent(domain)}`); } catch (e) { if (e.status !== 404) throw e; }
    }
  }
  let legacy = null; /* 콘솔이 옛 방식(sites/<사이트>/domains)으로 등록했으면 거기 상태도 읽음(읽기만) */
  if (!cd || !cd.requiredDnsUpdates) { try { const L = await call('GET', `${API}/v1beta1/sites/${site}/domains`); legacy = (L.domains || []).find((d) => d.domainName === domain) || null; } catch (e) {} }
  if (!cd && legacy) cd = { legacy };
  return { cd, made, legacy };
}

module.exports = { run, describe };
if (require.main === module) {
  const domain = (process.argv[2] || process.env.CUSTOM_DOMAIN || 'readnow.kr').trim().toLowerCase();
  const site = process.argv[3] || JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8')).hosting.site;
  const mode = (process.env.DOMAIN_MODE || 'register').trim();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) { console.log('::error::도메인 꼴이 아님: ' + domain); process.exit(1); }
  if (!TOKEN) { console.log('::warning::HOSTING_TOKEN 없음 — 건너뜀'); process.exit(0); }
  run(domain, site, mode).then(({ cd, made }) => {
    const text = cd ? (made ? `🆕 ${domain} 새로 등록함\n\n` : `ℹ️ ${domain} 이미 등록돼 있음 — 상태만 읽음\n\n`) + describe(cd, domain) : `ℹ️ ${domain} 등록 안 됨(읽기만 하는 길이라 등록하지 않음)`;
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
    fs.writeFileSync(process.env.DOMAIN_OUT || 'domain-status.json', JSON.stringify({ domain, site, made, at: new Date().toISOString(), customDomain: cd }, null, 2));
    console.log('---- 원문(JSON) ----\n' + JSON.stringify(cd, null, 2));
  }).catch((e) => { console.log('::error::' + e.message); process.exit(1); });
}
