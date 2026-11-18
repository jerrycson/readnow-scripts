/* (juso2 · 정범님 11/18 12:08 「도로명주소 검색 API 승인키 등록했어, 확인해주고 적용할 곳을 적용해」) 📮 도로명주소 찾기 — 클라우드 공용 묶음
 *  쓰는 곳: 수집 서버 index.js(/juso — 관리 웹앱이 바로 못 부를 때 대신 · /diag juso=1 — 키 있음·길이·저장 시각·시험 검색)
 *           우리숍 창구 shop.js(/shop/juso — 손님 주문서 🔎 주소 찾기 · 숍 전용 서버 readnow-shop도 이 파일만 읽음, index.js는 안 읽음)
 *  승인키 = Firestore app_secrets/juso {key, at, by}(웹앱 ⚙ 설정 › ⑱ 🌐 외부 정보 › 📮 도로명주소 찾기에서 확인 뒤 저장) · 30분 기억
 *  키 값은 답·로그·진단에 넣지 않음(info()는 있음·길이·저장 시각만) · 주소만 돌려줌(쓰기 없음) · 같은 검색어는 10분 기억(바깥 API를 덜 부름) */
'use strict';
const API = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';
const ERRC = { E0001: '승인되지 않은 승인키(키가 틀림)', E0005: '검색어가 비었음', E0006: '시·도 이름만으로는 못 찾음', E0008: '검색어가 한 글자', E0009: '검색어는 글자와 숫자를 함께', E0010: '검색어가 너무 김', E0011: '검색어에 숫자가 너무 김', E0012: '특수문자·숫자만으로는 못 찾음', E0013: '쓸 수 없는 낱말·특수문자가 있음', E0014: '개발용 승인키 기간이 끝남 — 운영용으로 다시 신청', E0015: '찾는 범위를 넘음', '-999': '주소 서버 오류' };
const KEY_RE = /^[A-Za-z0-9+/=_-]{12,200}$/;
const KEY_TTL = 30 * 60e3; const Q_TTL = 10 * 60e3; const Q_MAX = 300;
/* 검색어 — 행정안전부 안내대로 특수문자·SQL 낱말을 뺌(웹앱 jusoQ와 같은 규칙) */
function clean(s) { return String(s == null ? '' : s).replace(/[%=><\[\]{}'"`;\\|^$*+?#&]/g, ' ').replace(/\b(OR|AND|SELECT|INSERT|DELETE|UPDATE|CREATE|DROP|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 80); }
/* 주소 서버 답 → { ok, total, list:[{road, road1, jibun, zip, bd}] } | { ok:false, code, why } */
function parse(j, status) { const R = j && j.results; const c = R && R.common; if (!c) return { ok: false, unsure: true, why: `주소 서버 답을 읽지 못함${status ? `(HTTP ${status})` : ''}` };
  const code = String(c.errorCode == null ? '' : c.errorCode).trim(); if (code !== '0') return { ok: false, code, why: (ERRC[code] || '오류 ' + code) + (c.errorMessage ? ' — ' + String(c.errorMessage).slice(0, 120) : '') };
  const list = (Array.isArray(R.juso) ? R.juso : []).slice(0, 30).map((x) => ({ road: String(x.roadAddr || '').trim(), road1: String(x.roadAddrPart1 || '').trim(), jibun: String(x.jibunAddr || '').trim(), zip: String(x.zipNo || '').replace(/\D/g, '').slice(0, 5), bd: String(x.bdNm || '').trim() })).filter((x) => x.road);
  return { ok: true, total: +c.totalCount || 0, list }; }
const defHttp = async (o) => { const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000); try { const r = await fetch(o.url, { headers: { Accept: 'application/json', ...(o.headers || {}) }, signal: ctl.signal }); return { status: r.status, text: await r.text() }; } catch (e) { throw new Error(e.name === 'AbortError' ? '응답 없음(15초)' : '연결 실패: ' + e.message); } finally { clearTimeout(t); } };
/* C = Firestore 칸 고르기(C('app_secrets')) · http = { url } → { status, text } (시험은 가짜를 넣음) */
function makeJuso({ C, log, http, now }) { const H = http || defHttp; const T = now || Date.now;
  const K = { k: null, at: 0, saved: null, err: null }; const QC = new Map();
  const loadKey = async (force) => { if (!force && K.k != null && T() - K.at < KEY_TTL) return K.k;
    try { const d = await C('app_secrets').doc('juso').get(); const v = (d.exists && d.data()) || {}; K.k = String(v.key || '').trim(); K.saved = v.at || null; K.err = null; } catch (e) { K.k = ''; K.saved = null; K.err = String((e && e.message) || e).slice(0, 120); log && log('📮 도로명주소 승인키를 못 읽음', K.err); }
    K.at = T(); if (force) QC.clear(); return K.k; };
  /* b = { q, key? } — key를 주면 그 키로 한 번만(웹앱 저장 전 확인 · 저장 안 함 · 기억 안 함) */
  const search = async (b) => { const q = clean(b && b.q); if (q.length < 2) return { ok: false, code: 'E0008', why: '두 글자 넘게 넣어 주세요' };
    let key = String((b && b.key) || '').trim(); const test = !!key; if (test && !KEY_RE.test(key)) return { ok: false, code: 'E0001', why: '승인키 꼴이 아님(영문·숫자 한 줄)' };
    if (!test) { key = await loadKey(); const m = QC.get(q); if (m && T() - m.at < Q_TTL) return { ...m.v, cached: 1 }; }
    if (!key) return { ok: false, code: 'NOKEY', why: '승인키가 아직 없음 — ⚙ 설정 › ⑱ 🌐 외부 정보 › 📮 도로명주소 찾기' };
    let r; try { r = await H({ url: `${API}?confmKey=${encodeURIComponent(key)}&currentPage=1&countPerPage=20&keyword=${encodeURIComponent(q)}&resultType=json`, headers: { Accept: 'application/json' } }); } catch (e) { return { ok: false, unsure: true, why: '주소 서버에 닿지 못함 — ' + String((e && e.message) || e).slice(0, 120) }; }
    let j = null; try { j = JSON.parse(r.text); } catch (e) {} const o = parse(j, r.status);
    if (!o.ok) { if (!test && o.code === 'E0001') K.at = 0; /* 키를 바꿨을 수 있음 — 다음에 다시 읽음 */ return o; }
    const v = { ...o, via: 'cloud' }; if (!test) { QC.set(q, { v, at: T() }); if (QC.size > Q_MAX) QC.delete(QC.keys().next().value); } return v; };
  /* 진단·숍 설정용 — 키 값은 절대 안 돌려줌 */
  const info = async (force) => { const k = await loadKey(force); return { has: !!k, len: k ? k.length : 0, shapeOk: k ? KEY_RE.test(k) : false, at: K.saved, readErr: K.err }; };
  const has = async () => !!(await loadKey());
  return { search, info, has, reset: () => { K.at = 0; K.k = null; QC.clear(); } }; }
module.exports = { makeJuso, clean, parse, ERRC, KEY_RE, API };
