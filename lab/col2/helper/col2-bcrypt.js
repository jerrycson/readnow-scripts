/* col2-bcrypt.js — 🟩 네이버 커머스API 전자서명용 bcrypt(hashpw) — 바깥 꾸러미 없이(로거 PC에 npm 설치를 하지 않게)
 * 근거(원문): https://apicenter.commerce.naver.com/docs/auth '전자서명' — client_secret_sign = Base64( BCrypt.hashpw(client_id + '_' + timestamp, client_secret) )
 *   · client_secret 자체가 bcrypt 소금($2a$..$ + 22자) · 문서의 보기 값(aaaabbbbcccc · $2a$10$abcdefghijklmnopqrstuv · 1643961623299)으로 시험(t_naver ①)
 * 셈: OpenBSD bcrypt(eksblowfish) 그대로 — 2a·2b·2y 머리 · 비밀글 UTF-8 · 72바이트까지 · 끝에 0 하나 붙임
 * Blowfish 처음 값(P 18개 · S 4×256)은 원주율 16진 소수 자리 그대로라, 표를 베껴 넣지 않고 처음 쓸 때 정수 셈(Machin 공식)으로 만들어 둠(한 번 · 수십 ms)
 *   · 맞는지: P[0]=243F6A88 · S0[0]=D1310BA6 · S3[255]=3AC372E6 을 시험이 확인 */
'use strict';
let PI = null; /* Uint32Array(18 + 1024) */
function piWords() { if (PI) return PI; const N = 18 + 1024; const bits = BigInt(N * 32 + 64); const one = 1n << bits;
  const atanInv = (x) => { const X = BigInt(x), X2 = X * X; let t = one / X, s = t, k = 1n, sg = -1n; while (t) { t /= X2; const q = t / (2n * k + 1n); if (!q) break; s += sg * q; sg = -sg; k++; } return s; };
  const pi = 16n * atanInv(5) - 4n * atanInv(239); /* pi × 2^bits */ const frac = pi - 3n * one; const sh = frac >> 64n; /* 소수 자리 N×32비트 */
  const W = new Uint32Array(N); for (let i = 0; i < N; i++) W[i] = Number((sh >> BigInt((N - 1 - i) * 32)) & 0xffffffffn); PI = W; return W; }
const B64 = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function b64enc(b, n) { let o = '', i = 0; while (i < n) { let c1 = b[i++] & 0xff; o += B64[(c1 >> 2) & 0x3f]; c1 = (c1 & 0x03) << 4; if (i >= n) { o += B64[c1 & 0x3f]; break; } let c2 = b[i++] & 0xff; c1 |= (c2 >> 4) & 0x0f; o += B64[c1 & 0x3f]; c1 = (c2 & 0x0f) << 2; if (i >= n) { o += B64[c1 & 0x3f]; break; } c2 = b[i++] & 0xff; c1 |= (c2 >> 6) & 0x03; o += B64[c1 & 0x3f]; o += B64[c2 & 0x3f]; } return o; }
function b64dec(s, n) { const v = (c) => B64.indexOf(c); const out = []; let i = 0; while (i < s.length - 1 && out.length < n) { const c1 = v(s[i++]), c2 = v(s[i++]); if (c1 < 0 || c2 < 0) break; out.push(((c1 << 2) | ((c2 & 0x30) >> 4)) & 0xff); if (out.length >= n || i >= s.length) break; const c3 = v(s[i++]); if (c3 < 0) break; out.push((((c2 & 0x0f) << 4) | ((c3 & 0x3c) >> 2)) & 0xff); if (out.length >= n || i >= s.length) break; const c4 = v(s[i++]); if (c4 < 0) break; out.push((((c3 & 0x03) << 6) | c4) & 0xff); } return out; }
function hashpw(password, salt) { const m = /^\$(2[aby]?)\$(\d\d)\$([./A-Za-z0-9]{22})/.exec(String(salt || '')); if (!m) throw new Error('bcrypt 소금 꼴이 아님($2a$NN$ + 22자)'); const ver = m[1], cost = +m[2]; if (cost < 4 || cost > 31) throw new Error('bcrypt 비용 4~31');
  const sb = b64dec(m[3], 16); if (sb.length !== 16) throw new Error('bcrypt 소금 길이');
  const pw = [...Buffer.from(String(password), 'utf8')]; pw.push(0); const key = pw.slice(0, 72);
  const W = piWords(); const P = new Uint32Array(W.subarray(0, 18)); const S = new Uint32Array(W.subarray(18));
  const F = (x) => ((((S[x >>> 24] + S[256 | ((x >>> 16) & 0xff)]) ^ S[512 | ((x >>> 8) & 0xff)]) + S[768 | (x & 0xff)]) >>> 0);
  const LR = new Uint32Array(2);
  const enc = () => { let l = LR[0], r = LR[1]; l ^= P[0]; for (let i = 1; i <= 16; i += 2) { r ^= F(l) ^ P[i]; l ^= F(r) ^ P[i + 1]; } r ^= P[17]; LR[0] = r >>> 0; LR[1] = l >>> 0; };
  const stream = (d) => { let off = 0; return () => { let w = 0; for (let i = 0; i < 4; i++) { w = ((w << 8) | (d[off] & 0xff)) >>> 0; off = (off + 1) % d.length; } return w >>> 0; }; };
  const expand = (data, k) => { const ks = stream(k); for (let i = 0; i < 18; i++) P[i] = (P[i] ^ ks()) >>> 0; const ds = data ? stream(data) : null; LR[0] = 0; LR[1] = 0;
    for (let i = 0; i < 18; i += 2) { if (ds) { LR[0] ^= ds(); LR[1] ^= ds(); } enc(); P[i] = LR[0]; P[i + 1] = LR[1]; }
    for (let i = 0; i < 1024; i += 2) { if (ds) { LR[0] ^= ds(); LR[1] ^= ds(); } enc(); S[i] = LR[0]; S[i + 1] = LR[1]; } };
  expand(sb, key); const rounds = 2 ** cost; for (let r = 0; r < rounds; r++) { expand(null, key); expand(null, sb); }
  const ct = [0x4f727068, 0x65616e42, 0x65686f6c, 0x64657253, 0x63727944, 0x6f756274]; /* "OrpheanBeholderScryDoubt" */
  for (let k = 0; k < 6; k += 2) { LR[0] = ct[k]; LR[1] = ct[k + 1]; for (let i = 0; i < 64; i++) enc(); ct[k] = LR[0]; ct[k + 1] = LR[1]; }
  const out = []; for (const w of ct) out.push((w >>> 24) & 0xff, (w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff);
  return `$${ver}$${m[2]}$${b64enc(sb, 16)}${b64enc(out, 23)}`; }
/* 네이버 전자서명 — Base64(표준) ( hashpw(id + '_' + ts, secret) ) */
const nvSign = (id, secret, ts) => Buffer.from(hashpw(`${id}_${ts}`, secret), 'utf8').toString('base64');
module.exports = { hashpw, nvSign, piWords };
