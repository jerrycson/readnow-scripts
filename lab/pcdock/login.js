/* login.js — 🔐 (0.1.10 · 정범님 11/18 I-1118-1208·I-1118-1259 · 리드 결정 F61) ③으로 띄운 크롬 창이 알라딘 로그인 페이지면 로그인되게
 *  길: 크롬 자체 비밀번호 관리자가 아이디·비밀번호를 채움 → 이 도우미는 「로그인」 단추만 누름(진짜 마우스 누름 — 크롬은 사람이 누른 뒤에야 채운 값을 페이지에 넘김)
 *  이 도우미는 로그인 값을 읽지도·두지도·넣지도 않음 — 설정에도 없음(settings.js가 비밀값 이름의 칸을 거절) · 안 되면 「크롬 창 로그인 필요」 알림만
 *  고르는 창: 평소 프로필로 띄운 크롬(크롬·웹 사이트·원격·Claude 웹) — 번외·ALPS 도우미 창(자기 프로필)과 PC 배치 자신은 뺌 */
'use strict';
/* 알라딘 로그인 주소 꼴(PowerShell -match · 대소문자 안 가림) — /login/wlogin.aspx · /login/wlogin_naver.aspx · /m/mlogin.aspx */
const PAT = 'aladin\\.co\\.kr/(login/|m/mlogin)';
const isLoginUrl = (u) => new RegExp(PAT, 'i').test(String(u || ''));
/* 평소 프로필 크롬 단계인가(apps.js chromeStep 꼴: uddNot이 있고 udd가 비었음) */
const plainChrome = (st) => !!(st && !st.self && !st.helper && st.match && (st.match.procs || []).includes('chrome') && !st.match.udd && st.match.uddNot);
/* steps(계획) · res(PowerShell 'run' 결과 — 단계 차례와 같음)에서 볼 창 고르기 · 창 번호가 겹치면 하나만 */
function pickWins(steps, res) { const S = steps || [], R = res || [], out = [], seen = new Set();
  R.forEach((x, i) => { const st = S.length === R.length ? S[i] : S.find((q) => q.inst === x.inst && q.name === x.name); if (!plainChrome(st) || !x || !x.ok || !+x.h || x.helper) return;
    if (seen.has(+x.h)) return; seen.add(+x.h); out.push({ h: +x.h, name: String(x.name || '').slice(0, 30), t: String(x.title || '').slice(0, 40) }); });
  return out.slice(0, 12); }
/* PowerShell 'login' 결과 → 기록(창 이름·제목 앞부분·까닭만 · 주소는 '?' 앞까지) */
function sumUp(r, wins, by, at) { const W = wins || [], rows = (r && r.rows) || [];
  const row = (x) => { const w = W.find((q) => q.h === +x.h) || {}; return { h: +x.h || 0, name: w.name || '', t: w.t || '', how: String(x.how || '').slice(0, 120), clicked: !!x.clicked, u: String(x.u || '').split('?')[0].slice(0, 80) }; };
  const login = rows.filter((x) => x.login);
  return { at: at || Date.now(), by: by || '', ok: !!(r && r.ok), err: r && !r.ok ? String(r.err || '까닭 모름').slice(0, 160) : undefined, seen: rows.length,
    done: login.filter((x) => x.clicked && !x.still).map(row), need: login.filter((x) => !x.clicked || x.still).map(row), x: 0 }; }
/* 화면·웹앱에 띄울 알림 한 줄(없으면 '') */
function noticeOf(L) { if (!L || !L.need || !L.need.length || L.x) return '';
  const n = L.need.length, w = L.need[0]; return `크롬 창 로그인 필요 — ${w.name || w.t || '크롬 창'}${n > 1 ? ` 외 ${n - 1}개` : ''}: ${w.how || '로그인 페이지에 머물러 있음'}`; }
module.exports = { PAT, isLoginUrl, plainChrome, pickWins, sumUp, noticeOf };
