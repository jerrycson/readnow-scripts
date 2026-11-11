/* col2-y24learn.js — 🎓 예스24 '배우기 모드' (11/11 y24ops3 · 약속 48 · 반품 승인·문의 답 자동화 준비)
 * 왜: 반품 승인/거부·상품 문의 답은 저장 요청 모양(주소·보낸 칸)을 아직 몰라 사람 손(웹앱 🧰 예스24 운영 표 '✋ 사람 손') — 정범님이 실제로 1건 처리할 때 그 요청 모양을 받아 두면 다음 판에서 같은 모양으로 맡길 수 있음
 * 어떻게: 웹앱 🧰 예스24 운영 › 🎓 배우기 모드(두 번 누름) → POST /y24/learn {on, page, min}
 *   → 이 PC 번외 예스24 숨은 크롬(맡은 PC · 로그인된 세션)을 앞으로 꺼내 그 화면(반품관리·상품 문의)을 엶 · 그동안 번외는 그 창을 건드리지 않음(읽기·쓰기·확인 물음 대신 답하기 모두 멈춤 · 확인 물음은 사람이 답함)
 *   → 그 창이 보내는 /api/ 요청 중 '쓰기처럼 보이는 것'(목록·조회·처음 읽기가 아닌 것)만 모양으로 남김: 방식·주소(물음표 뒤 값은 가림)·보낸 칸 이름과 값 꼴(글 = '#s길이' · 숫자 = '#n' · 2~4자 코드 칸(…_GB·…_CD·…_YN)만 값 그대로)·응답 상태·응답 칸 이름·RESULT_CODE
 *   → 확인 물음 글은 숫자를 '#'로 가려 60자까지 · 로그인·비밀번호 길은 주소만(secret)
 *   → y24-learn.json(이 PC · 값 없음) · 웹앱이 GET /y24/learn으로 받아 app_settings/y24_learn에 올림(같은 모양 · 손님 이름·전화·주소·문의 글 없음)
 * 끄기: 웹앱 [끄기] · 정한 시간(기본 30분 · 최대 60분)이 지나면 저절로 · 끄면 창을 다시 숨기고 첫 화면부터 평소 읽기 */
'use strict';
const fs = require('fs'), path = require('path');
const PAGES = { '/Claim/ReturnManagementS1': '반품·교환 요청(승인/거부)', '/CustomerService/QAList': '상품 문의(답 쓰기)', '/Claim/CancelReturnList': '반품현황', '/CustomerService/PersonalQAList': '1:1 문의' };
const READ_RE = /\/api\/(Menu|Common)\/|\/api\/[^/]+\/[^/?]*(List|Init|Get[A-Z]\w*|Search\w*|Select\w*|Check\w*|Total|Count|Code)(?:\?|$)/;
const CODE_K = /(_GB|_CD|_YN|_TYPE|_CODE|_STAT|_STATE|_FLAG|_KIND)$/i;
const SECRET = /login|logout|passw|pwd|auth|cert|token|member\/(info|modify)|sellerinfo/i;
const MAXR = 60;
/* 값 → 꼴(값 없음) · 코드 칸(이름이 …_GB 등이고 값이 영숫자 1~4자)만 값 그대로 */
function shapeOf(v, d, k) { d = d || 0; if (v == null) return null; if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return k && CODE_K.test(k) && /^\d{1,4}$/.test(String(v)) ? v : '#n';
  if (typeof v === 'string') { if (k && CODE_K.test(k) && /^[A-Za-z0-9]{1,4}$/.test(v)) return v; if (v === '') return ''; return /^\d+$/.test(v) ? '#d' + v.length : '#s' + v.length; }
  if (d >= 4) return '#…'; if (Array.isArray(v)) return v.length ? [shapeOf(v[0], d + 1, k), '#len' + v.length] : [];
  if (typeof v === 'object') { const o = {}; for (const kk of Object.keys(v).slice(0, 60)) o[String(kk).slice(0, 50)] = shapeOf(v[kk], d + 1, kk); return o; } return '#?'; }
function bodyShape(post) { const s = String(post || ''); if (!s) return null; try { const j = JSON.parse(s); return { json: true, b: shapeOf(j) }; } catch (e) {}
  try { const o = {}; new URLSearchParams(s).forEach((v, k) => { o[String(k).slice(0, 50)] = shapeOf(v, 1, k); }); return { json: false, b: o }; } catch (e) { return { json: false, b: '#s' + s.length }; } }
function urlShape(u) { try { const x = new URL(u, 'https://uscm.yes24.com'); const q = {}; x.searchParams.forEach((v, k) => { q[String(k).slice(0, 40)] = shapeOf(v, 1, k); }); return { p: x.pathname.slice(0, 120), q: Object.keys(q).length ? q : null }; } catch (e) { return { p: '?', q: null }; } }
function respShape(text) { try { const j = JSON.parse(String(text || '')); if (!j || typeof j !== 'object') return null; const rc = j.RESULT_CODE != null ? String(j.RESULT_CODE).slice(0, 12) : null; const o = shapeOf(j); if (o && typeof o === 'object' && rc) o.RESULT_CODE = rc; return o; } catch (e) { return null; } }
const maskMsg = (m) => String(m || '').replace(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, '#전화').replace(/\d/g, '#').replace(/\s+/g, ' ').slice(0, 60);
const isWrite = (p, page) => !READ_RE.test(p) && !Object.keys(PAGES).some((x) => p.toLowerCase() === ('/api' + x).toLowerCase()) && !(page && p.toLowerCase() === ('/api' + page).toLowerCase()); /* 화면과 같은 이름의 길 = 그 화면 목록 읽기 */
/* 줄 하나 → 저장 꼴(값 없음) — 시험 t_y24learn이 직접 부름 */
function recOf(it, page) { const U = urlShape(it.u); const sec = SECRET.test(U.p); return { sig: String(it.m || 'GET').toUpperCase() + ' ' + U.p, m: String(it.m || 'GET').toUpperCase(), p: U.p, q: sec ? null : U.q, page: String(page || it.page || '/').slice(0, 80), secret: sec || undefined, body: sec ? null : bodyShape(it.post), w: isWrite(U.p, page || it.page) }; }
function makeLearn(o) { const { HOME, note, now } = o; const F = path.join(HOME, 'y24-learn.json');
  const rd = () => { try { const v = JSON.parse(fs.readFileSync(F, 'utf8')); return v && Array.isArray(v.recs) ? v : { recs: [] }; } catch (e) { return { recs: [] }; } };
  const L = { on: false, until: 0, page: '', by: '', at: 0, reads: 0, ...rd(), on0: false }; L.on = false;
  const save = () => { try { fs.writeFileSync(F, JSON.stringify({ recs: L.recs.slice(0, MAXR), reads: L.reads })); } catch (e) {} };
  const REQ = new Map();
  /* 요청을 봄(그 숨은 탭) — 배우기 중·번외 자기 요청 아님 */
  function req(id, it) { if (!L.on || it.mine) return; const r = recOf(it, it.page); if (!r.w) { L.reads++; return; } r.at = now(); REQ.set(id, r); if (REQ.size > 50) REQ.delete(REQ.keys().next().value); }
  function resp(id, st, text) { const r = REQ.get(id); if (!r) return; REQ.delete(id); r.st = +st || 0; r.resp = r.secret ? null : respShape(text); put(r); }
  function put(r) { const key = r.sig + '|' + JSON.stringify(r.body && r.body.b && typeof r.body.b === 'object' ? Object.keys(r.body.b).sort() : r.body); const old = L.recs.find((x) => x.key === key);
    if (old) { old.n = (old.n || 1) + 1; old.lastAt = r.at; old.st = r.st; if (r.resp) old.resp = r.resp; } else { L.recs.unshift({ key, n: 1, firstAt: r.at, lastAt: r.at, ...r }); L.recs = L.recs.slice(0, MAXR); }
    save(); note(`🎓 배우기: 저장 요청 모양 하나 받음 — ${r.sig}(응답 ${r.st || '?'}) · 값·손님 정보 없음`); }
  function dialog(p) { if (!L.on) return false; put({ sig: 'DIALOG ' + String(p.type || ''), m: 'DIALOG', p: '', page: L.page, w: true, at: now(), st: 0, msg: maskMsg(p.message), body: null }); return true; } /* 참 = 번외는 답하지 않음(사람이 그 창에서 답함) */
  function state() { return { ok: true, on: L.on, until: L.on ? L.until : null, page: L.on ? L.page : null, by: L.by || null, n: L.recs.length, reads: L.reads, recs: L.recs.slice(0, MAXR).map(({ key, ...x }) => x) }; }
  const sum = () => ({ on: L.on, until: L.on ? L.until : null, page: L.on ? L.page : null, n: L.recs.length });
  return { L, req, resp, dialog, state, sum, PAGES }; }
module.exports = { makeLearn, recOf, shapeOf, bodyShape, respShape, maskMsg, isWrite, PAGES, READ_RE };
