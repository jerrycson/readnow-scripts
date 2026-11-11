/* 📚 (11/12 shelf6) 우리숍 서가 — 표지 그림 풀기(JPEG 밖: PNG·GIF) · 외부 꾸러미 없음(PNG는 node 기본 zlib · GIF는 LZW 직접)
 *  까닭(배포 뒤 확인): 표지 대표색 셈에서 6권이 'SOI not found' — 알라딘 주소는 .jpg인데 받은 내용이 PNG·GIF·WebP라 jpeg-js가 못 풂
 *   → 앞 몇 바이트로 꼴을 보고(sniff) JPEG는 jpeg-js · PNG·GIF는 여기서 · WebP는 풀지 않고(손실 WebP 풀기는 무거움) 알라딘 원래 주소를 'WebP 말고' 다시 받아 풂(shop-cover.js)
 *  돌려줌: { data: RGBA Uint8Array, width, height } · 못 풀면 Error(message = 'fmt:<꼴>' 또는 까닭) */
'use strict';
const zlib = require('zlib');
const MAX_PX = 24e6; /* 그림 한 장 최대 화소(약 96MB RGBA) — 넘으면 풀지 않음 */

/* 앞 바이트로 꼴 보기 */
function sniff(b) { if (!b || b.length < 12) return 'short';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'gif';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('latin1', 4, 12) === 'ftypavif' || b.toString('latin1', 4, 12) === 'ftypheic') return 'avif';
  if (b[0] === 0x3c) return 'html'; return 'unknown'; }

/* PNG — 색 갈래 0(회색)·2(RGB)·3(팔레트)·4(회색+투명)·6(RGBA) · 비트 1·2·4·8·16 · 엇갈림(interlace)은 안 함 */
function decodePng(buf) { let p = 8; let W = 0, H = 0, bd = 0, ct = 0, il = 0; let pal = null, trns = null; const idat = [];
  while (p + 8 <= buf.length) { const len = buf.readUInt32BE(p); const ty = buf.toString('latin1', p + 4, p + 8); const d = buf.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (ty === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); bd = d[8]; ct = d[9]; il = d[12]; }
    else if (ty === 'PLTE') pal = d; else if (ty === 'tRNS') trns = d; else if (ty === 'IDAT') idat.push(d); else if (ty === 'IEND') break; }
  if (!W || !H) throw new Error('png 머리 없음'); if (W * H > MAX_PX) throw new Error('png 너무 큼'); if (il) throw new Error('fmt:png-interlace');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct]; if (!ch || ![1, 2, 4, 8, 16].includes(bd)) throw new Error('png 꼴 모름 ' + ct + '/' + bd);
  const raw = zlib.inflateSync(Buffer.concat(idat)); const bpp = Math.max(1, (ch * bd) >> 3); const stride = (W * ch * bd + 7) >> 3;
  if (raw.length < H * (stride + 1)) throw new Error('png 자료 모자람');
  const out = new Uint8Array(W * H * 4); let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  const samp = (row, i) => { /* i번째 표본(채널 단위) → 0~255 */ if (bd === 8) return row[i]; if (bd === 16) return row[i * 2]; const per = 8 / bd; const byte = row[Math.floor(i / per)]; const sh = 8 - bd * (1 + (i % per)); const v = (byte >> sh) & ((1 << bd) - 1); return ct === 3 ? v : Math.round(v * 255 / ((1 << bd) - 1)); };
  for (let y = 0; y < H; y++) { const f = raw[y * (stride + 1)]; const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255; }
    for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; let r, g, bl, al = 255;
      if (ct === 0) { r = g = bl = samp(cur, x); if (trns && trns.length >= 2 && bd <= 8 && samp(cur, x) === Math.round(trns.readUInt16BE(0) * 255 / ((1 << bd) - 1))) al = 0; }
      else if (ct === 2) { r = samp(cur, x * 3); g = samp(cur, x * 3 + 1); bl = samp(cur, x * 3 + 2); }
      else if (ct === 3) { const i = samp(cur, x); r = pal ? pal[i * 3] : 0; g = pal ? pal[i * 3 + 1] : 0; bl = pal ? pal[i * 3 + 2] : 0; if (trns && i < trns.length) al = trns[i]; }
      else if (ct === 4) { r = g = bl = samp(cur, x * 2); al = samp(cur, x * 2 + 1); }
      else { r = samp(cur, x * 4); g = samp(cur, x * 4 + 1); bl = samp(cur, x * 4 + 2); al = samp(cur, x * 4 + 3); }
      out[o] = r; out[o + 1] = g; out[o + 2] = bl; out[o + 3] = al; }
    const t = prev; prev = cur; cur = t; }
  return { data: out, width: W, height: H }; }

/* GIF — 첫 장면만(움직이는 표지는 거의 없음) · 바탕은 흰색 */
function decodeGif(buf) { let p = 6; const W = buf.readUInt16LE(p), H = buf.readUInt16LE(p + 2); const fl = buf[p + 4]; p += 7; if (!W || !H) throw new Error('gif 머리 없음'); if (W * H > MAX_PX) throw new Error('gif 너무 큼');
  let gct = null; if (fl & 0x80) { const n = 3 * (1 << ((fl & 7) + 1)); gct = buf.subarray(p, p + n); p += n; } let tIdx = -1;
  const out = new Uint8Array(W * H * 4).fill(255);
  while (p < buf.length) { const b = buf[p++];
    if (b === 0x21) { const lab = buf[p++]; if (lab === 0xf9 && buf[p] >= 4) { if (buf[p + 1] & 1) tIdx = buf[p + 4]; } while (p < buf.length && buf[p]) p += buf[p] + 1; p++; continue; }
    if (b !== 0x2c) break; const ix = buf.readUInt16LE(p), iy = buf.readUInt16LE(p + 2), iw = buf.readUInt16LE(p + 4), ih = buf.readUInt16LE(p + 6), f2 = buf[p + 8]; p += 9;
    let ct = gct; if (f2 & 0x80) { const n = 3 * (1 << ((f2 & 7) + 1)); ct = buf.subarray(p, p + n); p += n; } if (!ct) throw new Error('gif 색표 없음'); const inter = !!(f2 & 0x40);
    const mcs = buf[p++]; const parts = []; while (p < buf.length && buf[p]) { parts.push(buf.subarray(p + 1, p + 1 + buf[p])); p += buf[p] + 1; } p++; const data = Buffer.concat(parts);
    /* LZW */ const clear = 1 << mcs, eoi = clear + 1; let size = mcs + 1, next = eoi + 1; const pre = new Int32Array(4096), suf = new Uint8Array(4096), lenA = new Uint16Array(4096);
    for (let i = 0; i < clear; i++) { pre[i] = -1; suf[i] = i; lenA[i] = 1; } const px = new Uint8Array(iw * ih); let n = 0, old = -1, bits = 0, acc = 0, q = 0; const stack = new Uint8Array(4097);
    while (n < px.length) { while (bits < size && q < data.length) { acc |= data[q++] << bits; bits += 8; } if (bits < size) break; const code = acc & ((1 << size) - 1); acc >>>= size; bits -= size;
      if (code === clear) { size = mcs + 1; next = eoi + 1; old = -1; continue; } if (code === eoi) break;
      let c = code, first; if (code >= next) { if (old < 0) break; c = old; } let sp = 0; while (c >= 0 && sp < 4096) { stack[sp++] = suf[c]; c = pre[c]; } first = stack[sp - 1];
      if (code >= next) { for (let i = sp - 1; i >= 0 && n < px.length; i--) px[n++] = stack[i]; if (n < px.length) px[n++] = first; } else for (let i = sp - 1; i >= 0 && n < px.length; i--) px[n++] = stack[i];
      if (old >= 0 && next < 4096) { pre[next] = old; suf[next] = first; lenA[next] = lenA[old] + 1; next++; if (next === 1 << size && size < 12) size++; } old = code; }
    const rowOf = (r) => { if (!inter) return r; const P = [[0, 8], [4, 8], [2, 4], [1, 2]]; let k = r; for (const [s, st] of P) { const cnt = Math.ceil(Math.max(0, ih - s) / st); if (k < cnt) return s + k * st; k -= cnt; } return r; };
    for (let r = 0; r < ih; r++) { const y = iy + rowOf(r); if (y >= H) continue; for (let x = 0; x < iw; x++) { const X = ix + x; if (X >= W) continue; const i = px[r * iw + x]; if (i === tIdx) continue; const o = (y * W + X) * 4; out[o] = ct[i * 3]; out[o + 1] = ct[i * 3 + 1]; out[o + 2] = ct[i * 3 + 2]; out[o + 3] = 255; } }
    return { data: out, width: W, height: H }; }
  throw new Error('gif 장면 없음'); }

/* 아무 꼴 → RGBA (jpeg = jpeg-js 꾸러미) */
function decode(buf, jpeg) { const f = sniff(buf);
  if (f === 'jpeg') { if (!jpeg) throw new Error('jpeg-js 없음'); return jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 256, formatAsRGBA: true }); }
  if (f === 'png') return decodePng(buf); if (f === 'gif') return decodeGif(buf); throw new Error('fmt:' + f); }
module.exports = { sniff, decode, decodePng, decodeGif };
