/* 리드나우 클라우드 수집 (readnow-cloud) 0.1.0 — Google Cloud Run
 *
 * 하는 일 (PC 수집기와 같은 기준 파일·같은 저장 형식, PC 수집기와 함께 돌아도 됨)
 *  - /tick  (Cloud Scheduler가 매일 24시간 1분마다 부름 — 0.4.0부터: ① 주문확인요청은 매번, ② 발송 요청은 5분마다·필요할 때)
 *      ① 알라딘 판매관리 ① 주문확인요청 · ② 발송 요청 읽기 → shp_state/confirm · shp_state/current · shp_orders · shp_snapshots (= 실시간 주문 수집)
 *      ② 발송 요청 엑셀(ALPS 업로드 재료) · 우리 매물 유의 사항·사진(prd_used_info, 24시간에 한 번)
 *      ③ 웹앱이 맡긴 일(shp_cmds) 중 read · startDelivery 를 맡아 처리 (PC가 먼저 맡으면 PC가 함 — 트랜잭션으로 한 곳만)
 *      ⑤ (0.5.0) 알라딘에서 산 주문(매입): 5분마다 첫 쪽 → 새 주문은 상세까지 pur_aladin_orders 에 (웹앱이 바로 '주문함' 매입 기록으로)
 *      ④ 신호: app_settings/cloud { at, ok, err, ... } — PC 수집기는 이 신호가 10분 안이면 자동 '발송 요청 읽기'를 쉼 (손으로 누르는 것·다른 수집은 그대로)
 *  - /kick  (웹앱이 일을 맡긴 직후 부름: 5분 기다리지 않고 바로 ③)
 *  - /lookup (웹앱 '사진 가격': ISBN·알라딘 상품번호 → 새상품 정보 + 온라인 중고 첫 페이지 / 제목 → 알라딘 검색 후보)
 *      (0.9.3) 현금 판매 판매중지: 웹앱이 다시 맡길 때마다 실행 문 열쇠가 새것(맡긴 일#회차) — '확인 못함' 뒤 다시 하지 못하던 것 고침
 *      (0.9.2) 웹앱 '📥 상품 등록'도 씀: 모든 분류·Sales Point·순위·리뷰·규격·쪽수 등을 함께 · 제목 검색은 상품 구분(branch 1 국내·2 음반·3 DVD·7 외국)대로
 *  - /spines (웹앱 '사진 가격' 책등 사진 → Google Vision 글자 읽기 → 책등마다 글자 묶음)
 *  - (0.6.1) 현금 판매 → 알라딘 판매중지 자동(shp_cmds cashStop): 판매상태 일괄 변경과 같은 요청으로 판매중지 → '판매중지' 목록에서 그 상품을 찾아야 완료, 못 찾으면 '확인 필요'(완료로 적지 않음) → 현금 판매 기록의 그 줄에 결과
 *  - (0.6.0) 관리도구 1판: 맡긴 일은 노선표(readnow-registry.js + Firebase app_settings/sys_registry)에 '클라우드가 맡을 수 있음'인 종류만 맡음 ·
 *      1분마다 맡긴 일 살피기(sweep) — 맡고 멈춘 일은 다시 해도 되는 일만 대기로 되돌리고, 아니면 '사람 확인'으로 · 아무도 안 맡는 일·모르는 종류는 알림 → app_settings/sys_health
 *  - (0.5.8) 매일 결과 기록(개편 1단계): 판매중 상품 전체의 그날 모습(ml_days) + 가격 변경마다 그 뒤 판매(ml_outcomes) + 이어짐 점검(app_settings/ml_state)
 *  - (0.5.7) 매일 데이터 관리 비용(Firestore·Cloud Run·Vision·Storage·이미지 보관) 사용량 × 공식 단가 → app_settings/costs_auto_YYYY-MM (웹앱 매입 탭 '기타 지출')
 *  - /inventory · /storage-files (0.5.6, 웹앱 백업: 모든 칸의 문서 수·어림 크기 + 사진 파일 목록·크기 — 읽기만)
 *  - /status (상태 확인, 인증 없음 — 비밀 정보 없음)
 *  - (0.12.0) 일마다 켜기·끄기: app_settings/cloud_jobs { confirm·fast·ship·enrich·cmds·buy·repair·sweep·costs·ml·learn·req: false면 끔 } — 웹앱 설정·수집기 칸 편집기의 '☁ 클라우드가 하는 일' · 외부 정보 이어 받기는 app_settings/ext.cloud === true일 때만(기본 끔)
 *
 * 비밀: 알라딘 아이디·비밀번호(ALADIN_ID · ALADIN_PW)와 TICK_KEY는 Secret Manager에만 둠 (Firebase·웹앱·GitHub에는 절대 두지 않음)
 * 웹앱 호출 인증: Firebase 로그인 토큰(ID token) 확인 + 허용 이메일(ALLOW_EMAILS)
 */
'use strict';
const http = require('http');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, FieldPath } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const puppeteer = require('puppeteer-core');

const VER = '0.16.5'; // (0.16.5) 주문확인요청 시장 줄 색: 화면 안 분류가 비면 서버에서 같은 기준으로 다시(전부 빨강 되던 것) · 진단 lst // (0.16.4) 진단 mktchk(주문확인요청 시장 줄 색·유의사항 — 고객 정보 없이) // (0.16.3) 구글 토큰 주소 고침(service-accounts/default — 예전 주소는 404라 비용 보기·그림 PDF 글자 읽기가 못 했음) // (0.16.2) 나가는 인터넷 주소가 바뀌면(고정 주소 8.230.4.53 등) 로그인 쉬는 시간을 건너뛰고 바로 다시 로그인 · 진단 loginnow // (0.16.1) 진단 egress(나가는 인터넷 주소) // (0.16.0) 📥 등록 조회 = 샵매니저 상품등록 '알라딘 등록 상품 검색'(wpopup_sISBN · 사장님 10/16) — 상품명·번호 모두 · 후보에 등록 코드 · 못 쓰면 공개 검색 // (0.15.6) 진단 kpq에 문서 번호(doc) — 요약 넣을 때 그대로 // (0.15.5) 📰 이어 받기 상태(full)를 통째로 저장 — 옛 '다 받음'이 남아 g3_2·g3_5·알림판을 건너뛰던 것 // (0.15.4 자동 점검) 출고별 매출 탭 읽기: 웹앱 '출고 확정'이 덮은 날도 앞서 본 주문부터 이어 합침(tabEntries) · 예전 자동 확정 목록 보관(oldAuto.entries) · 밤에는 shp_state 안 읽음 · 진단: 알림 기기 구독·키 문서 안 내보냄 · 토큰 대상 정확히 // (0.15.3) 📰 목록 글 주소 뒤 ?page · 알림판 쪽 넘기기(보안 토큰·쿠키) // (0.15.2) 📰 목록 2쪽부터 글 주소 꼴(board.php?wr_id) · 알림판 목록 쪽 넘기기 // (0.15.1) 글 문서에 첨부 글자를 넣지 않음(웹앱이 목록을 가볍게 받게 — 글자는 저장소 .txt) // (0.15.0) 📰 출판 정보 게시판(KPIPA 조사연구보고서·출판 보고서·글로벌출판동향·출판전산망 알림판·출판산업 Q&A) — 글·첨부(PDF 글자) 모음 · 요약 넣는 길 /kp-in(암호) · 진단 kpbtest·kpq·kpkey·kpstat // (0.14.2) 진단 rawget POST // (0.14.1) 진단: kpipa 공개 화면 원문(rawget) // (0.14.0) 📦 출고별 매출 = ③ 배송&구매확정전으로 옮겨 온 주문(발송일 · 5분마다 → shp_days source 'tab') · 출고 시각 알림은 '출고 예정'만(확정 안 함) · 수거 달력(ship.pickup) // (0.13.9) 진단: 샵매니저 상품등록 검색 방식 읽기(scmreg · GET만) // (0.13.8) 등록 조회: 번호(바코드)로 알라딘에서 못 찾으면 교보·예스24에서 제목을 찾아 알라딘 후보 // (0.13.7) 진단: 등록 조회 시험(상품명 검색) // (0.13.6) 🛒 eBay 회원 탈퇴 알림 주소(/ebay-del) · 외부 정보 키 문제는 책마다 미룸 남기지 않음 · 진단에 상품·주문 요약 // (0.13.4) 외부 정보: 계속 실패하는 출처는 쉬는 시간 1→2→4→8→16시간 · 정보나루 '도서 없음'은 실패 아님 // (0.13.2 자동 점검) 출고 알림: 끊긴 기기에 계속 보내던 것·실패하면 1분마다 다시 읽던 것·클라우드 읽기를 꺼 두거나 회차가 앞에서 멈추면 알림·시험·로거 지킴이가 안 돌던 것 고침 · // (0.13.0) 📦 출고 시각 알림 — 출고 시각에 발송 요청을 새로 읽고 정밀 검토(주문 기록의 취소·반품 줄 빼기·다른 날 확정과 겹침 빼기) → 출고별 매출에 확정(사람이 먼저 확정했으면 그대로) → 고른 기기에 웹 푸시 · PC는 수집기가 웹앱 발송 요청 탭을 앞으로 // (0.12.15) /storage-get — 웹앱 사진 내려받기를 클라우드가 대신 꺼내 줌(저장소 CORS 막힘) // (0.12.14) 🔓 공개 화면(중고 목록·상품·검색)은 로그인 쿠키 없이 — 판매자 계정과 떼어 놓음 // (0.12.13) 경고창으로 로그인이 막히면 1시간마다만 다시 시도 // (0.12.12 자동 점검) 빠른 고리 시장 읽기 15초 바닥 없앰 · 미룬 유의 사항을 실패로 안 셈 · 출고 화면 남기기를 1MB 안으로(꾸밈 빼고 바이트로 자름) // (0.12.11) 알라딘 경고창을 닫고 내용을 남김(로그인 실패 까닭에 그대로) // (0.12.10) 상품 보강 표지 = 웹 주소(저장 경로였어서 휴대폰 출고 사진이 깨졌음) // (0.12.9) 회차 순서: 주문확인요청 → 읽은 시각 바로 → 급한 맡긴 일 → 시장 → 느린 맡긴 일(42초 안) → 발송 요청 · 단계별 걸린 시간(steps) // (0.12.8) 출고 시장: 시장 못 읽은 상품 먼저 · 늘 15초 이상 · 유의 사항 다시 읽기는 시장 뒤로 // (0.12.7 자동 점검) 오래된 기록 정리 기준 = 백업 받기 시작한 때 · 그 백업에 들어간 칸만 // (0.12.6) 주문확인요청 시장 읽기를 먼저·빠른 고리에서도 이어서 (휴대폰 출고 화면 시장이 '읽는 중'에 머물던 것) // (0.12.5 점검) 공용 파일은 올린 커밋(CODE_SHA)의 것만 · 발송준비시작 '끝남'은 확실할 때만 · 처음 본 때 덮지 않음 · 대기 목록 듣기 재사용·유의 사항 24시간 기억(읽기 줄임) · 끊긴 브라우저 정리 // (0.12.4) 💳 Google Cloud 실제 비용 — 결제 계정 예산 알림(Pub/Sub) → /billing → app_settings/costs_bill_YYYY-MM (setup-billing.sh 한 번) // (0.12.3 전체 점검) 회차가 10분 넘게 멈추면 스스로 다시 켬 · ext_run 날짜 칸 15일 지난 것 지움 // (0.12.2) 🌐 외부 정보 출처별 오늘 성공·실패 수(ext_run.res)·마지막 실패(lastErr) 기록 · GitHub에 올리면 저절로 배포(.github/workflows/deploy-cloud.yml) // (0.12.1) ☁ 클라우드 전체 스위치(cloud_jobs.all === false면 모든 일을 멈춤 — 각 일의 스위치는 그대로 기억) // (0.12.0) 클라우드가 하는 일마다 켜기·끄기(app_settings/cloud_jobs — 웹앱 설정·수집기 칸 편집기의 '☁ 클라우드가 하는 일') · 꺼 둔 일은 손대지 않음 · 🌐 외부 정보 이어 받기는 기본 끔(app_settings/ext.cloud === true일 때만) // (0.11.0) 안전 점검: 작은 오류 번호로 서버가 꺼지던 것 · 비밀을 환경 변수에서 지움 · 알라딘 로그인 실패 상태를 Firestore에 남겨(다시 켜져도) 아이디·비밀번호 문제면 6시간 쉼 · 공용 파일 마지막으로 받은 판으로 계속(문법 검사) · 주문 문서 400개씩 · 열쇠를 같은 시간으로 비교 · 기억 덜어 내기 · 외부 정보 기준을 공용 파일에서 · (0.10.0) 🌐 외부 정보 — PC가 꺼져 있을 때 클라우드가 이어 받음(10분마다 최대 90초)
initializeApp({ projectId: process.env.FB_PROJECT || 'readnow-3a385' });
const db = getFirestore();
const FV = FieldValue;
/* (0.12.5 점검 F5) 공용 파일은 '이 판을 올린 바로 그 커밋'의 것만 — 자동 배포가 CODE_SHA(커밋 번호)를 넣어 줌. 예전엔 GitHub main의 최신 파일을 30분마다 받아 바로 돌려서, 검사 없이 올린 파일이 곧장 클라우드에서 돌 수 있었음
 *  공용 파일이 바뀌면 자동 배포가 클라우드를 다시 올림(.github/workflows/deploy-cloud.yml의 paths) · CODE_SHA가 없으면(손으로 올린 판) 예전처럼 main */
const CODE_SHA = /^[0-9a-f]{40}$/.test(process.env.CODE_SHA || '') ? process.env.CODE_SHA : null;
const RAW = process.env.CORE_BASE || `https://raw.githubusercontent.com/jerrycson/readnow-scripts/${CODE_SHA || 'refs/heads/main'}/`;
const CORES_OPTIONAL = new Set(['readnow-register-core.js']); // 없어도 주문 읽기 등은 그대로 (등록 엔진 번호 맞춤만 글자 비교로)
const CORES = ['readnow-shipping-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js', 'readnow-sellers-core.js', 'readnow-core.js', 'readnow-register-core.js']; // (0.9.3) 등록 엔진 공용 파일: 상품 번호(ISBN·바코드) 맞춤 한 곳 // 출고·상품 파서 + 판매자 분류(웹앱 블록 색과 같은 기준)
const ALADIN_ID = process.env.ALADIN_ID || '', ALADIN_PW = process.env.ALADIN_PW || '', TICK_KEY = process.env.TICK_KEY || '';
delete process.env.ALADIN_ID; delete process.env.ALADIN_PW; delete process.env.TICK_KEY; /* (0.11.0) 읽은 뒤 환경 변수에서 지움 — 브라우저(자식 프로세스)·GitHub에서 받아 실행하는 공용 파일이 process.env로 볼 수 없게 */
process.on('unhandledRejection', (e) => { try { console.error('처리 안 된 오류', e && e.message ? e.message : String(e)); } catch (x) {} }); process.on('uncaughtException', (e) => { try { console.error('잡히지 않은 오류', e && e.message ? e.message : String(e)); } catch (x) {} }); /* (0.11.0) 한 요청의 오류로 서버 전체가 꺼지지 않게 */
const ALLOW = (process.env.ALLOW_EMAILS || 'jerrycson@gmail.com').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const ORIGINS = (process.env.ALLOW_ORIGINS || 'https://jerrycson.github.io').split(',').map((s) => s.trim());
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const AL = 'https://www.aladin.co.kr';
const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W = () => ({ uploadedAt: FV.serverTimestamp(), writer: 'cloud', writerSchema: 6 });
const C = (n) => db.collection(n);
const batchOps = async (ops) => { for (let i = 0; i < ops.length; i += 400) { const b = db.batch(); ops.slice(i, i + 400).forEach(([ref, v]) => b.set(ref, v, { merge: true })); await b.commit(); } };
const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ── 공용 기준 파일 (GitHub의 것 그대로 — PC 수집기·웹앱과 같은 판) ── */
let coreSrc = null, coreAt = 0, coreVer = {}; const coreGood = {}; /* (0.11.0) 파일마다 마지막으로 잘 받은 판 — GitHub가 잠깐 안 되거나 문법이 깨진 파일이 올라와도 그 판으로 계속 */
const vm = require('vm');
async function cores() {
  if (coreSrc && Date.now() - coreAt < 30 * 60e3) return coreSrc;
  const out = await Promise.all(CORES.map(async (f) => { let t = null, why = null; try { const r = await fetch(RAW + f + '?t=' + Date.now()); if (r.ok) { t = await r.text(); try { new vm.Script(t, { filename: f }); } catch (e) { why = '문법 오류: ' + e.message; t = null; } } else why = 'HTTP ' + r.status; } catch (e) { why = e.message; }
    if (t != null) { coreGood[f] = t; coreVer[f] = (t.match(/VERSION\s*[:=]\s*['"]([\d.]+)/) || [])[1] || '?'; return t; }
    if (coreGood[f]) { log(`${f} 받기 실패(${why}) — 마지막으로 받은 판으로 계속`); return coreGood[f]; }
    if (CORES_OPTIONAL.has(f)) { log(`${f} 받기 실패 (${why}) — 이 파일 없이 계속`); return ''; } throw new Error(`${f} 받기 실패 (${why})`); })); // 다섯 파일을 한꺼번에 받음 (차례로 받던 것보다 빠름)
  coreSrc = out.join('\n;\n'); coreAt = Date.now(); return coreSrc;
}

/* ── (0.6.0) 관리도구 노선표: GitHub의 readnow-registry.js(더 새것이면) → 없으면 함께 올린 같은 파일 · 살아 있는 값 = Firebase app_settings/sys_registry ── */
// 함께 올린 파일이 없어도(예: Dockerfile이 옛 판이라 이미지에 안 들어감) 죽지 않음 — GitHub에서 받고, 그것도 안 되면 예전 목록(클라우드가 맡던 종류)으로 계속
const REG_MIN = { VERSION: '0.0.0', merge: () => ({ KINDS: {} }), canHandle: (R, t, who) => who === 'cloud' && ['read', 'startDelivery', 'market', 'aladinBuy', 'usedInfo', 'cashStop'].includes(t), sweep: () => [] };
let REG_LOCAL = null; try { REG_LOCAL = require('./readnow-registry.js'); } catch (e) { console.log(new Date().toISOString(), '함께 올린 노선표 파일 없음 — GitHub에서 받음', e.message); }
let REGM = REG_LOCAL || REG_MIN, regAt = 0;
const vn = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
async function regMod() { if (Date.now() - regAt < 30 * 60e3) return REGM; regAt = Date.now();
  try { const r = await fetch(RAW + 'readnow-registry.js?t=' + Date.now()); if (r.ok) { const t = await r.text(); const m = { exports: {} }; new Function('module', 'exports', t)(m, m.exports); if (m.exports && m.exports.VERSION && vn(m.exports.VERSION) >= vn((REG_LOCAL || REG_MIN).VERSION)) { try { const R0 = m.exports.merge({}); m.exports.canHandle(R0, 'read', 'cloud'); REGM = m.exports; } catch (e) { log('GitHub 노선표가 돌지 않음 — 함께 올린 판 씀', e.message); } } } } catch (e) { log('노선표 파일 받기 실패 — 함께 올린 판 씀', e.message); }
  coreVer['readnow-registry.js'] = REGM.VERSION; return REGM; }
/* (0.7.0) 실행도구의 한 문 (readnow-exec-core.js) — 알라딘을 바꾸는 일(발송준비시작·판매중지)은 exec_log에 시작을 먼저 적고, 같은 일이 이미 끝났거나 하는 중이면 하지 않음.
 *  함께 올린 파일 → 없으면 GitHub에서 받음 → 그것도 안 되면 기록 없이 하지 않고 대기로 남김(PC 수집기가 맡을 수 있음) */
let EXEC_LOCAL = null; try { EXEC_LOCAL = require('./readnow-exec-core.js'); } catch (e) { console.log(new Date().toISOString(), '함께 올린 실행 문 파일 없음 — GitHub에서 받음', e.message); }
let EXECM = EXEC_LOCAL, execAt = 0;
async function execMod() { if (EXECM) coreVer['readnow-exec-core.js'] = EXECM.VERSION; /* (0.9.3) 함께 올린 파일이 있을 때도 판을 신호에 (예전엔 여기서 먼저 돌아가 관리도구에 '?'로 빨갛게) */ if (EXECM && (EXEC_LOCAL || Date.now() - execAt < 30 * 60e3)) return EXECM; execAt = Date.now();
  try { const r = await fetch(RAW + 'readnow-exec-core.js?t=' + Date.now()); if (r.ok) { const m = { exports: {} }; new Function('module', 'exports', await r.text())(m, m.exports); if (m.exports && m.exports.begin) EXECM = m.exports; } } catch (e) { log('실행 문 파일 받기 실패', e.message); }
  if (EXECM) coreVer['readnow-exec-core.js'] = EXECM.VERSION; return EXECM; }
async function regNow() { const M = await regMod(); let doc = null; try { const d = await C('app_settings').doc('sys_registry').get(); doc = d.exists ? d.data() : null; } catch (e) {} return { M, R: M.merge(doc) }; }
/* 맡긴 일 살피기 (1분마다, 회차 끝에): 멈춘 일·늦은 일·모르는 종류 → 되돌리기·사람 확인·알림. 상태 문서는 바뀐 때(또는 10분마다)만 씀 */
let sweepSig = '', sweepAt = 0; const seenFlag = new Set();
async function sysSweep() { const { M, R } = await regNow(); const now = Date.now();
  const [q1, q2] = await Promise.all([C('shp_cmds').where('status', '==', 'queued').get(), C('shp_cmds').where('status', '==', 'running').get()]);
  const cmds = [...q1.docs, ...q2.docs].map((d) => ({ id: d.id, ...d.data() }));
  let plan = M.sweep(R, cmds, now, { cloud: true, pc: true, webapp: true }); let pcAlive = null;
  if (plan.some((a) => a.act === 'late')) { try { const rs = await C('rn_status').get(); pcAlive = rs.docs.some((d) => { const v = d.data(); return v.atMs && now - v.atMs < 10 * 60e3; }); } catch (e) {} plan = M.sweep(R, cmds, now, { cloud: true, pc: !!pcAlive, webapp: true }); }
  const ev = [];
  for (const a of plan) { if (a.act !== 'requeue' && a.act !== 'stuck') { if (a.act === 'unknown' && !seenFlag.has(a.id)) { seenFlag.add(a.id); ev.push({ at: nowIso(), id: a.id, type: a.type, act: a.act, why: a.why }); } continue; }
    const ref = C('shp_cmds').doc(a.id); let done = false;
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const x = sn.exists ? { id: sn.id, ...sn.data() } : null; if (!x || x.status !== 'running') return; const again = M.sweep(R, [x], Date.now(), {}).find((y) => y.id === a.id); if (!again || again.act !== a.act) return;
      const h = { at: nowIso(), act: a.act, why: a.why, claim: x.claim || null };
      if (a.act === 'requeue') tx.update(ref, { status: 'queued', claim: null, attempts: a.attempts, sweepLog: FV.arrayUnion(h), uploadedAt: FV.serverTimestamp() });
      else tx.update(ref, { status: 'stuck', stuckAt: nowIso(), stuckWhy: a.why, sweepLog: FV.arrayUnion(h), uploadedAt: FV.serverTimestamp() }); done = true; });
    if (done) { ev.push({ at: nowIso(), id: a.id, type: a.type, act: a.act, why: a.why }); log('맡긴 일 살피기', a.act, a.type, a.id, a.why); } }
  const alerts = plan.filter((a) => a.act === 'late' || a.act === 'unknown').slice(0, 50); const counts = { queued: q1.size, running: q2.size };
  const sig = JSON.stringify([alerts.map((a) => a.id + a.act), counts]);
  if (ev.length || sig !== sweepSig || now - sweepAt > 10 * 60e3) { sweepSig = sig; sweepAt = now; const ref = C('app_settings').doc('sys_health');
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const old = (sn.exists && sn.data().events) || []; const events = [...old, ...ev].filter((e) => Date.parse(e.at) > now - 30 * 864e5).slice(-300);
      tx.set(ref, { at: nowIso(), ver: VER, reg: M.VERSION, regDoc: R.docVer || null, alerts, counts, pcAlive, events, lastEventAt: ev.length ? nowIso() : (sn.exists && sn.data().lastEventAt) || null, ...W() }, { merge: true }); }); }
  return { plan: plan.length, ev: ev.length }; }

/* ── 브라우저 (하나를 계속 씀, 일은 한 번에 하나씩) ── */
let browser = null, page = null, pageAt = 0, browserAt = 0; let chain = Promise.resolve(); let tickBusy = false; let tickAt = 0; // 1분 예약이 겹치면(앞 회차가 길면) 건너뜀 — 쌓이지 않게
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };
/* (0.9.1) 알라딘 화면 안의 읽기에 시간 제한 — 예전엔 화면 안 fetch에 제한이 없어, 알라딘(또는 브라우저)이 응답 하나를 붙잡으면 3분 동안 멈췄다가
 *  'Runtime.callFunctionOn timed out' 오류로 회차가 통째로 실패 → 맡긴 일(발송준비시작 등)·주문 읽기가 계속 밀렸음.
 *  ① 화면 안 fetch는 25초면 끊음(머리·본문 모두) ② 화면 일 하나(evaluate)는 60초(판매중지처럼 여러 번 묻는 일은 200초)면 끊고 그 화면을 버림
 *  ③ 버린 화면은 다음에 새로 만들고, 브라우저가 답이 없으면 브라우저를 다시 띄움(로그인은 저절로 다시) */
const FETCH_MS = 25000, EVAL_MS = 60000, EVAL_SLOW_MS = 230000;
const FETCH_GUARD = `(() => { if (window.__rnFetchGuard) return; window.__rnFetchGuard = 1; const f0 = window.fetch.bind(window);
  window.fetch = (u, o) => { o = o || {}; const ac = new AbortController(); if (o.signal) { try { if (o.signal.aborted) ac.abort(); else o.signal.addEventListener('abort', () => ac.abort()); } catch (e) {} } setTimeout(() => ac.abort(), ${FETCH_MS}); return f0(u, { ...o, signal: ac.signal }); }; })();`;
let pageBroken = false;
const withTO = (pr, ms, what) => { let t; return Promise.race([pr, new Promise((_, rej) => { t = setTimeout(() => { pageBroken = true; rej(Object.assign(new Error(`알라딘 화면이 ${Math.round(ms / 1000)}초 넘게 답이 없음 (${what}) — 화면을 새로 만들어 이어 감`), { pageTimeout: true })); }, ms); })]).finally(() => clearTimeout(t)); };
const isAbort = (e) => /abort|AbortError|signal is aborted|timed out|답이 없음/i.test(String((e && e.message) || e));
const isClosed = (e) => !isAbort(e) && /Target closed|Session closed|has been closed|detached|Connection closed|Protocol error/i.test(String((e && e.message) || e)); // 화면이 이미 닫혀 요청을 보내지 못함 (보냈는지 모를 일이 아님)
const curPage = (p) => (page && page !== p && !page.isClosed() ? page : p); // (0.9.1) 다른 단계가 화면을 새로 만들었으면 그 화면으로
function guardPage(pg) { const ev = pg.evaluate.bind(pg), ast = pg.addScriptTag.bind(pg);
  pg.evaluate = (...a) => withTO(ev(...a), EVAL_MS, 'evaluate'); pg.evaluateSlow = (...a) => withTO(ev(...a), EVAL_SLOW_MS, 'evaluate'); pg.addScriptTag = (...a) => withTO(ast(...a), EVAL_MS, 'addScriptTag'); return pg; }
async function dropPage(why) { const old = page; page = null; injectedSrc = null; pageBroken = false; log('화면 버림', why || '');
  if (old) { const closed = await Promise.race([old.close().then(() => true, () => false), sleep(5000).then(() => false)]); if (!closed && browser) { log('브라우저가 답이 없음 — 다시 띄움 (로그인은 저절로 다시)'); try { const pr = browser.process(); if (pr) pr.kill('SIGKILL'); } catch (e) {} try { await Promise.race([browser.close(), sleep(3000)]); } catch (e) {} browser = null; } } }
async function getPage() {
  if (pageBroken) await dropPage('응답 없음 뒤');
  if (browser && (!browser.connected || (browserAt && Date.now() - browserAt > 24 * 3600e3 && !page))) { try { const pr = browser.process(); if (pr) pr.kill('SIGKILL'); } catch (e) {} browser = null; } /* (0.12.5 점검 F10) 끊긴 Chromium을 남기지 않음(메모리 2GB 안) · 하루 지난 브라우저는 새로 */
  if (!browser || !browser.connected) { browserAt = Date.now(); browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, protocolTimeout: 240000, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--lang=ko-KR', '--disk-cache-size=33554432'] }); page = null; }
  if (page && !page.isClosed() && Date.now() - pageAt > 6 * 3600e3) { try { await page.close(); } catch (e) {} page = null; log('화면 새로 만듦 (6시간마다 — 메모리 정리, 로그인은 유지)'); } // 오래 켜 둔 화면은 메모리가 쌓임
  if (!page || page.isClosed()) { pageAt = Date.now(); page = guardPage(await browser.newPage()); page.on('dialog', (d) => { const t = d.type(); lastDialog = { type: t, msg: String(d.message() || '').slice(0, 300), at: Date.now(), url: (() => { try { return page.url(); } catch (e) { return ''; } })() }; log('알라딘 경고창', t, lastDialog.msg); (t === 'confirm' ? d.dismiss() : d.accept()).catch(() => {}); }); /* (0.12.11) 경고창(alert·confirm)을 닫고 내용을 남김 — 예전엔 처리하지 않아 화면이 멈춘 채 로그인 실패 까닭도 안 남았음 · confirm은 '취소'(뜻밖의 승인을 막음) */ await page.evaluateOnNewDocument(FETCH_GUARD); await page.setBypassCSP(true); /* 기준 파일을 넣으려고 (수집기도 Tampermonkey로 같은 일) */ await page.setUserAgent(UA); await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' }); page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(45000); }
  if (!/aladin\.co\.kr/.test(page.url())) { await page.goto(AL + '/', { waitUntil: 'domcontentloaded' }); injectedSrc = null; }
  await page.evaluate(FETCH_GUARD).catch(() => {}); // 지금 문서에도 (이미 열린 화면) // 새 화면 = 기준 파일 다시 넣기
  await ensureCores(page); return page;
}
// 기준 파일이 GitHub에서 바뀌면(30분마다 확인) 열린 화면에도 새 판을 다시 넣음 — 예전엔 처음 넣은 판을 계속 써서 파서 고침이 반영되지 않았음
let injectedSrc = null;
async function ensureCores(p) { const src = await cores(); const has = await p.evaluate(() => !!(window.ReadnowShipping && window.ReadnowProducts && window.ReadnowPricing && window.ReadNowCore)).catch(() => false); if (!has || injectedSrc !== src) { await p.addScriptTag({ content: src }); injectedSrc = src; } }

/* ── 로그인 (PC 수집기의 자동 로그인과 같은 방식: 보이는 아이디 칸 + 비밀번호 칸 + 로그인 단추) ── */
let lastDialog = null, probeAt = 0; /* (0.12.11) 마지막 경고창 */ let loginFailAt = 0, loginFailMsg = null, loginFailN = 0; // (0.9.0) 실패 쉬는 시간: 1번째 3분 → 2번째 10분 → 그 뒤 30분 (예전: 한 번만 실패해도 30분 동안 주문을 못 읽었음)
let loginKind = null, loginStLoaded = false; /* (0.11.0) 실패 상태를 Firestore(app_settings/cloud_login)에 남겨 다시 켜져도(배포·재시작) 쉬는 시간을 지킴 · 아이디·비밀번호·자동입력(보안 문자) 때문이면 6시간 쉼 — 계정 잠김 막기 */
const loginRest = () => (loginKind === 'cred' ? 360 : loginKind === 'alert' ? (loginFailN <= 1 ? 10 : 60) : loginFailN <= 1 ? 3 : loginFailN === 2 ? 10 : 30) * 60e3; /* (0.12.12) 알라딘 경고창으로 막히면 10분 → 그 뒤 1시간마다만 시도(막힌 계정에 자꾸 들어가 잠김이 길어지지 않게) · 웹앱 클라우드 시험은 바로 */
async function loginStLoad() { if (loginStLoaded) return; loginStLoaded = true; try { const d = await C('app_settings').doc('cloud_login').get(); const v = d.exists ? d.data() : null; if (v && v.failAt) { loginFailAt = +v.failAt || 0; loginFailN = +v.failN || 0; loginFailMsg = v.msg || null; loginKind = v.kind || null; loginFailIp = v.ip || null; } } catch (e) {} }
let loginFailIp = null, egIp = null, egAt = 0; /* (0.16.2) 막혔을 때의 나가는 주소 — 주소가 바뀌면 쉬는 시간은 그 옛 주소의 것이라 무시 */
async function egressIp() { if (egIp && Date.now() - egAt < 10 * 60e3) return egIp; try { const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(10000) }); const j = await r.json(); if (j && j.ip) { egIp = j.ip; egAt = Date.now(); } } catch (e) {} return egIp; }
const loginStSave = async () => { if (loginFailAt) await egressIp(); return C('app_settings').doc('cloud_login').set({ failAt: loginFailAt || 0, failN: loginFailN || 0, msg: loginFailMsg || null, kind: loginKind || null, ip: loginFailAt ? (egIp || null) : null, at: new Date().toISOString() }).catch(() => {}); };
async function loggedIn(p) { return p.evaluate(async () => { try { const r = await fetch('/scm/worders.aspx?searchType=1&limitDate=1', { credentials: 'include' }); const h = await r.text(); if (/\/login\/|wlogin/i.test(r.url)) return false; const d = new DOMParser().parseFromString(h, 'text/html'); return !(d.querySelector('input[type="password"]') && !/샵매니저/.test(d.title || '')); } catch (e) { return false; } }); }
async function login(p, force) {
  if (await loggedIn(p)) { if (loginFailAt) { loginFailAt = 0; loginFailN = 0; loginFailMsg = null; loginKind = null; loginStSave(); } return true; }
  if (!ALADIN_ID || !ALADIN_PW) throw new Error('알라딘 아이디·비밀번호 비밀(ALADIN_ID·ALADIN_PW)이 없음');
  await loginStLoad(); if (!force && loginFailAt && Date.now() - loginFailAt < loginRest() && loginKind !== 'cred') { const ip = await egressIp(); if (ip && ip !== loginFailIp) { log('나가는 주소가 바뀜', loginFailIp || '(모름)', '→', ip, '— 쉬는 시간 건너뛰고 로그인'); loginFailAt = 0; loginFailN = 0; } } if (!force && loginFailAt && Date.now() - loginFailAt < loginRest()) throw new Error(`로그인 실패 뒤 ${Math.round(loginRest() / 60e3)}분 쉬는 중 (계정 잠김 방지, ${loginFailN}번째): ` + (loginFailMsg || ''));
  log('알라딘 로그인'); lastDialog = null;
  await p.goto(AL + '/login/wlogin.aspx?returnurl=' + encodeURIComponent(AL + '/scm/worders.aspx'), { waitUntil: 'domcontentloaded' });
  const ok = await p.evaluate((id, pw) => {
    const pwI = [...document.querySelectorAll('input[type="password"]')].find((i) => i.getClientRects().length); if (!pwI) return 'no-pw';
    const form = pwI.form || document; const idI = [...form.querySelectorAll('input[type="text"],input[type="email"],input:not([type])')].find((i) => i.getClientRects().length && i !== pwI); if (!idI) return 'no-id';
    const setVal = (inp, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    setVal(idI, id); setVal(pwI, pw);
    [...document.querySelectorAll('input[type="checkbox"]')].forEach((c) => { const lab = (c.id && document.querySelector(`label[for="${c.id}"]`)) || c.closest('label') || c.parentElement; if (lab && /상태\s*유지|자동\s*로그인/.test(lab.textContent) && !c.checked) c.click(); });
    const btn = [...form.querySelectorAll('button,input[type="submit"],input[type="image"],a')].find((b) => /^\s*로그인\s*$/.test(b.textContent || b.value || b.alt || '') || b.type === 'submit' || b.type === 'image');
    if (btn) btn.click(); else if (pwI.form) pwI.form.submit(); else return 'no-btn'; return 'sent';
  }, ALADIN_ID, ALADIN_PW);
  if (ok !== 'sent') { loginFailAt = Date.now(); loginFailN++; loginKind = 'page'; loginFailMsg = '로그인 화면 모양이 다름 (' + ok + ')'; loginStSave(); throw new Error(loginFailMsg); }
  await p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}); await sleep(1500);
  if (!/aladin\.co\.kr/.test(p.url())) await p.goto(AL + '/', { waitUntil: 'domcontentloaded' });
  await ensureCores(p);
  if (!(await loggedIn(p))) { const dlg = lastDialog && lastDialog.msg ? `알라딘 경고창: ${lastDialog.msg}` : ''; const msg = dlg || await p.evaluate(() => (document.body.innerText.match(/(아이디|비밀번호|보안|인증|자동입력)[^\n]{0,80}/) || [''])[0]).catch(() => ''); loginFailAt = Date.now(); loginFailN++; loginKind = dlg ? 'alert' : /(아이디|비밀번호)[^\n]{0,40}(잘못|일치하지|틀렸|틀립|확인해|다시 입력|오류)|자동\s*입력\s*방지|보안\s*문자|캡차|captcha/i.test(msg || '') ? 'cred' : 'other'; /* 진짜 아이디·비밀번호 오류 글·자동입력 방지일 때만 6시간 — 로그인 화면의 칸 이름('아이디 찾기')만으로는 아님 */ loginFailMsg = msg || '로그인 뒤에도 샵매니저가 열리지 않음'; loginStSave(); throw new Error('알라딘 로그인 실패: ' + loginFailMsg + (loginKind === 'cred' ? ' — 아이디·비밀번호·보안 문자 문제로 보여 6시간 쉼(계정 잠김 막기). 비밀을 고친 뒤 웹앱 설정의 클라우드 시험으로 바로 다시' : '')); }
  loginFailAt = 0; loginFailN = 0; loginFailMsg = null; loginKind = null; loginStSave(); log('로그인 됨'); return true;
}

/* ── ① 주문확인요청: 1분마다 이것부터 (알라딘 요청 1번) ──
   읽자마자 바뀌었으면 바로 shp_state/confirm 에 씀 → 웹앱은 Firestore 실시간 수신이라 몇 초 안에 화면에 뜸.
   그 뒤 같은 회차에서 상품마다 '보강'(사진·등급·등록일·유의사항·지금 시장 첫 페이지 + 판매자 분류)을 하나씩 채워 넣음 — 채워질 때마다 화면도 그 상품만 채워짐 */
const CONFIRM_URL = '/scm/worder_preparatory_complete.aspx';
let lastConfirm = [], lastDelivAt = 0, lastConfirmAt = null; const skipUntil = new Map(), failN = new Map();
async function firstSeenHave(orders, field) { const out = new Set(); if (!orders.length) return out; try { for (let i = 0; i < orders.length; i += 100) { const sn = await db.getAll(...orders.slice(i, i + 100).map((o) => C('shp_orders').doc(o.orderNo))); sn.forEach((d) => { if (d.exists && d.get(field)) out.add(d.id); }); } } catch (e) { /* 확인을 못 하면 예전처럼 적음 */ } return out; }
async function confirmRead(p) {
  const R = await p.evaluate(async (u) => { const r = await fetch(u, { credentials: 'include' }); const t = await r.text(); if (/\/login\/|wlogin/i.test(r.url)) return { login: false };
    const d = new DOMParser().parseFromString(t, 'text/html'); if (d.querySelector('input[type="password"]') && !/샵매니저/.test(d.title || '')) return { login: false };
    const rc = window.ReadnowShipping.parseDeliveryPage(d); const bad = (rc.tabCounts || {})['주문확인요청'] > 0 && (!(rc.orders || []).length || rc.orders.every((o) => !(o.items || []).length)); return { login: true, rc, ...(bad ? { html: t.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<svg[\s\S]*?<\/svg>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/[ \t]{2,}/g, ' ').slice(0, 700000) } : {}) }; }, CONFIRM_URL); /* (0.12.11) 탭에는 N건인데 주문·상품을 0개 읽으면 = 화면 모양이 바뀐 것 → 쓰지 않고 화면을 남김 */
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  if (R.html) { while (Buffer.byteLength(R.html) > 900000) R.html = R.html.slice(0, Math.floor(R.html.length * 0.9)); /* (0.12.12 자동 점검) Firestore 문서 1MB 한도 — 한글이 많으면 70만 자가 넘쳐 화면을 못 남겼음 */ const n0 = R.rc.tabCounts['주문확인요청']; if (Date.now() - (probeAt || 0) > 30 * 60e3) { probeAt = Date.now(); await C('ext_probe').doc('aladinConfirm_' + extKst().replace(/-/g, '')).set({ src: 'aladinConfirm', why: `주문확인요청 탭 ${n0}건 · 읽은 주문 ${(R.rc.orders || []).length}건`, url: CONFIRM_URL, len: R.html.length, head: R.html, at: nowIso(), by: 'cloud', ver: VER, ...W() }).catch((e) => log('출고 화면 남기기 실패', e.message)); } throw new Error(`주문확인요청 탭은 ${n0}건인데 주문·상품을 하나도 못 읽음 — 알라딘 화면 모양이 바뀐 듯(화면을 남김 — 웹앱 🔬 못 읽은 화면 받기) · 아무것도 쓰지 않음`); }
  const rc = R.rc; if (!(rc.orders || []).length && !Object.keys(rc.tabCounts || {}).length) throw new Error('주문확인요청 화면을 제대로 못 읽음(탭 숫자 없음) — 아무것도 쓰지 않음'); /* (0.12.5 점검 F9) 빈·이상한 화면이 좋은 기록을 덮지 않게 */ const at = nowIso(); lastConfirmAt = at; lastConfirm = rc.orders;
  const csig = JSON.stringify(rc.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId)])); const ref = C('shp_state').doc('confirm');
  // (0.9.0) 같은 목록이면 Firestore를 다시 읽지 않음 (15초마다 읽으므로) — 목록 문서는 바뀐 때만 읽고 씀
  let cc = confirmDoc; if (!cc || cc.sig !== csig || Date.now() - confirmDocAt > 5 * 60e3) { cc = (await ref.get()).data() || null; confirmDocAt = Date.now(); } /* 5분마다는 서버와 맞춤 (PC 수집기가 쓴 경우) */
  try { await enrichMigrate(cc); } catch (e) { log('보강 칸 옮기기 실패 — 다음에 다시 (예전 칸은 그대로 둠)', e.message); }
  const changed = !cc || cc.sig !== csig; const enrich = await enrichOf(rc.orders);
  if (changed) { const bc = db.batch(); bc.set(ref, { at, orders: rc.orders, tabCounts: rc.tabCounts, sig: csig, pc: 'cloud', ...(cc && cc.enrich ? { enrich: cc.enrich } : {}), ...W() }); /* 옮기기 전이면 예전 칸을 지우지 않음 */ // (0.9.0) 보강(enrich)은 문서마다 따로(shp_enrich) — 주문이 많아도 목록 문서가 1MB를 넘지 않게
    const seen1 = await firstSeenHave(rc.orders.filter((o) => !(cc && (cc.orders || []).some((x) => x.orderNo === o.orderNo))), 'confirmFirstSeenAt'); /* (0.12.5 점검 F9) 처음 본 때는 주문 문서에 없을 때만 — 예전엔 목록이 한 번 비면 다시 나타날 때 늦은 시각으로 덮였음 */
    const oOps = rc.orders.map((o) => [C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, confirmSeenAt: at, ...((cc && (cc.orders || []).some((x) => x.orderNo === o.orderNo)) || seen1.has(o.orderNo) ? {} : { confirmFirstSeenAt: at }), buyer: o.buyer, orderedAt: o.orderedAt, items: o.items, ...W() }]);
    await batchOps(oOps); await bc.commit(); /* (0.11.0) 주문 문서는 400개씩 따로 먼저 — 한 묶음 500개 한도(주문이 많은 날 목록이 멈추던 것) · 목록(sig)은 주문을 다 쓴 뒤에(주문 쓰기가 실패하면 다음 회차에 다시) */ confirmDoc = { sig: csig, tabCounts: rc.tabCounts, orders: rc.orders }; } else confirmDoc = cc;
  return { n: rc.orders.length, changed, enrich, tabCounts: rc.tabCounts, prevTab: cc && cc.tabCounts }; }
/* (0.9.0) 상품 보강은 상품마다 문서 하나(shp_enrich/{매물번호}) — 예전엔 목록 문서 안 enrich 칸에 3일치를 모아 둬, 주문이 많아지면 문서가 1MB를 넘어 목록 저장이 통째로 실패할 수 있었음
 *  처음 한 번 예전 enrich 칸을 옮기고 그 칸을 지움(내용은 shp_enrich에 그대로). 기억(enrichMem)으로 같은 것을 다시 읽지 않음 */
let confirmDoc = null, confirmDocAt = 0, enrichMemAt = 0; const enrichMem = new Map();
async function enrichMigrate(cc) { const E = cc && cc.enrich; if (!E || !Object.keys(E).length) return; const ks = Object.keys(E);
  for (let i = 0; i < ks.length; i += 400) { const b = db.batch(); ks.slice(i, i + 400).forEach((k) => { b.set(C('shp_enrich').doc(String(k)), { ...E[k], listingId: String(k), at: E[k].at || nowIso(), migratedAt: nowIso(), ...W() }, { merge: true }); enrichMem.set(String(k), E[k]); }); await b.commit(); }
  await C('shp_state').doc('confirm').update({ enrich: FV.delete() }); delete cc.enrich; log('보강 칸 옮김', ks.length, '개 → shp_enrich'); }
async function enrichOf(orders) { if (!enrichMemAt || Date.now() - enrichMemAt > 30 * 60e3) { enrichMemAt = Date.now(); { const cut = new Date(Date.now() - 10 * 864e5).toISOString(); for (const [k, v] of enrichMem) if (!v || String(v.at || '') < cut) enrichMem.delete(k); } /* (0.11.0) 10일 넘은 기억은 덜어 냄 — 끝없이 커지던 것 */ { const now = Date.now(); for (const [k, t] of skipUntil) if (t < now) { skipUntil.delete(k); failN.delete(k); } if (seenFlag.size > 5000) seenFlag.clear(); } try { (await C('shp_enrich').where('at', '>=', new Date(Date.now() - 3 * 864e5).toISOString()).get()).forEach((d) => enrichMem.set(d.id, d.data())); } catch (e) { log('보강 읽기 실패', e.message); } }
  const out = {}; for (const o of orders) for (const it of o.items || []) { const k = String(it.listingId || ''); if (k && enrichMem.has(k)) out[k] = enrichMem.get(k); } return out; }
const enrichPut = async (lid, E, merge) => { await C('shp_enrich').doc(String(lid)).set({ ...E, listingId: String(lid), ...W() }, { merge: !!merge }); enrichMem.set(String(lid), { ...(merge ? enrichMem.get(String(lid)) || {} : {}), ...E }); };

/* 상품 보강: 우리 상품 기록(prd_listings·prd_books·prd_used_info) + 지금 시장(온라인 중고 첫 페이지 1번 + 판매자 분류)
   · 기존 시장 지표(prd_book_metrics)는 건드리지 않음 — 시장은 shp_market 에 새 문서로 쌓고(덮어쓰지 않음), 화면용 사본만 confirm.enrich 에
   · 시간 상자: 한 회차에 최대 40초 — 넘으면 다음 회차(1분 뒤)에 이어 함. 한 권 실패는 그 책만 건너뜀 */
async function ourOf(listingId) {
  const L = await C('prd_listings').where('listingId', 'in', [String(listingId), Number(listingId)].filter((x) => x === x)).limit(1).get(); const l = L.empty ? null : L.docs[0].data();
  const b = l && l.bookId ? (await C('prd_books').doc(l.bookId).get()).data() : null; const ui = (await C('prd_used_info').doc(String(listingId)).get()).data();
  const fr = b && b.images && b.images.front; const img = fr ? (fr.stored ? 'https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/' + encodeURIComponent(fr.stored) + '?alt=media' : fr.src || null) : null; /* (0.12.10) 저장 경로가 아니라 웹 주소로 — 휴대폰은 상품 자료 없이 이 값만으로 사진을 보임 */
  return { key: L.empty ? null : L.docs[0].id, usedCode: l ? l.usedCode || null : null, bookId: l ? l.bookId || null : null, grade: l ? l.grade || null : null, sku: l ? l.sku || null : null, regAt: l ? l.registeredAt || l.regDate || null : null,
    itemId: b && b.aladinItemId ? String(b.aladinItemId) : null, cover: img, note: (ui && ui.note) || null, /* (0.5.3) 등급 글자(l.condition '중' 등)를 유의 사항으로 쓰지 않음 — 빠진 것을 가렸음 */ photos: ui && ui.photos ? ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src) : [], ui: ui || null }; }
async function marketOf(p, itemId, ourUsed) {
  const u = await p.evaluate(async (id) => { const r = await fetch(`/shop/UsedShop/wuseditemall.aspx?ItemId=${id}&TabType=0`, { credentials: 'omit' }); if (!r.ok) throw new Error('HTTP ' + r.status); const d = new DOMParser().parseFromString(await r.text(), 'text/html'); if (/\/login\/|wlogin|adult/i.test(r.url)) throw new Error('로그인 없이는 못 보는 화면(19금 등)'); if (!/알라딘/.test(d.title || '') && !d.querySelector('link[rel="canonical"]')) throw new Error('알라딘 화면 같지 않음(막힘·오류 화면일 수 있음) — 빈 시장으로 쓰지 않음'); return window.ReadnowProducts.parseUsedPage(d); }, itemId); /* (0.12.13) 쿠키 없이 · 이상한 화면은 빈 시장으로 쓰지 않음 */
  const codes = [...new Set((u.listings || []).map((r) => r.sellerCode).filter((c) => c && String(c) !== '0' && String(c) !== '996008'))];
  const sd = {}; if (codes.length) (await db.getAll(...codes.map((c) => C('sellers').doc('sc_' + c)))).forEach((d) => { if (d.exists) sd[d.id] = d.data(); });
  const rows = await p.evaluate((L, sd, ourUsed) => { const PRC = window.ReadnowPricing, RNC = window.ReadNowCore, RS = window.ReadnowSellers;
    return L.map((r, i) => { const ours = String(r.sellerCode) === '996008' || (ourUsed && r.usedCode === ourUsed); const d = r.sellerCode ? sd['sc_' + r.sellerCode] : null; let c = 'unknown';
      try { c = ours ? 'ours' : PRC && PRC.isAladinSide(r) ? 'aladin' : d && RNC ? RNC.classifySellerDoc(d, RS).cls : 'unknown'; } catch (e) {}
      return { r: i + 1, n: r.sellerName || null, sc: r.sellerCode || null, g: r.grade || null, p: r.price ?? null, s: r.ship ?? null, lid: r.listingId || null, so: r.soldOut ? 1 : 0, c }; }); }, u.listings || [], sd, ourUsed || null);
  { const N = await nodeCls(); let fixed = 0; if (N) rows.forEach((w) => { if (w.c !== 'unknown' || !w.sc) return; const d = sd['sc_' + w.sc]; if (!d) return; try { const c = N.RNC.classifySellerDoc(d, N.RS).cls; if (c && c !== 'unknown') { w.c = c; fixed++; } } catch (e) {} }); if (fixed) log('시장 줄 색: 알라딘 화면 안 분류가 비어 서버에서 다시', itemId, fixed + '줄'); } /* (0.16.5) 사장님 10/17 '해리 포터 … 시장 줄이 전부 붉은색' — 판매자 기록은 모두 있었는데 화면 안 분류가 통째로 'unknown'(판매자 기록 없음 = 빨강)이었음 → 같은 기준 파일(readnow-core classifySellerDoc)을 서버(Node)에서도 돌려 채움 */
  return { u, rows }; }
let nodeClsC = null, nodeClsSrc = null; /* (0.16.5) 판매자 분류를 Node에서 — 알라딘 화면에 넣은 파일이 사라져도(화면 이동·새로 고침) 같은 기준으로 */
async function nodeCls() { try { await cores(); const a = coreGood['readnow-sellers-core.js'], b = coreGood['readnow-core.js']; if (!a || !b) return null; const key = a.length + ':' + b.length; if (nodeClsC && nodeClsSrc === key) return nodeClsC; const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(a, ctx); vm.runInContext(b, ctx); nodeClsC = ctx.ReadNowCore && ctx.ReadnowSellers ? { RNC: ctx.ReadNowCore, RS: ctx.ReadnowSellers } : null; nodeClsSrc = key; return nodeClsC; } catch (e) { log('서버 판매자 분류 준비 실패', e.message); return null; } }
const realNote = (n, g) => { const t = String(n || '').trim(); return t && t !== g && !/^(최상|상|중|하|새것같음|새상품)$/.test(t) ? t : null; };
const uiNext = new Map(), uiTry = new Map();
function midAfter(lid, grade, note) { lid = String(lid); if (grade !== '중' || realNote(note, grade)) { uiTry.delete(lid); uiNext.delete(lid); if (grade === '중') C('shp_cmds').doc('ui_' + lid).update({ status: 'done', doneAt: nowIso(), by: 'cloud', results: { [lid]: { ok: true, at: nowIso(), by: 'cloud' } }, uploadedAt: FV.serverTimestamp() }).catch(() => {}); return; }
  const k = (uiTry.get(lid) || 0) + 1; uiTry.set(lid, k); uiNext.set(lid, Date.now() + Math.min(30, 2 ** k) * 60e3);
  if (k >= 2) { const ref = C('shp_cmds').doc('ui_' + lid); db.runTransaction(async (tx) => { const sn = await tx.get(ref); const x = sn.exists ? sn.data() : null; if (x && (x.status === 'queued' || x.status === 'running')) { if (!x.cloudTried) tx.update(ref, { cloudTried: true, uploadedAt: FV.serverTimestamp() }); return; } if (x && x.status === 'done' && (x.tries || 0) >= 3) return;
      tx.set(ref, { type: 'usedInfo', listingIds: [lid], grade, status: 'queued', cloudTried: true, createdAt: nowIso(), by: 'cloud', tries: ((x && x.tries) || 0) + 1, uploadedAt: FV.serverTimestamp() }); }).catch(() => {}); } } // 클라우드가 두 번 못 읽으면 PC 수집기에 맡김
async function enrichConfirm(p, cr, force, until, minMs) {
  const t0 = Date.now(); const stopAt = Math.max(Math.min(t0 + 40000, until || Infinity), t0 + (minMs == null ? 15000 : minMs)); /* (0.12.12 자동 점검) 15초 바닥은 회차 본 단계에서만 — 빠른 고리(끝 무렵)에서도 15초를 넘겨 회차가 다음 1분 예약을 건너뛰게 했음 */ /* (0.12.8) 시장 읽기는 늘 15초 이상 — 앞 단계(맡긴 일 등)가 시간 상자를 다 써도 굶지 않게 */ const ref = C('shp_state').doc('confirm'); let n = 0, fail = 0; const todo = [];
  // (0.5.3) '중' 상품인데 유의 사항이 없으면(등급 글자만 있는 것도) 다시 읽음 — 2·4·8…분(최대 30분) 간격, 세 번째부터는 PC 수집기에도 맡김
  const midNo = (e, it) => (e && (e.grade || it.grade)) === '중' && !realNote(e && e.note, '중') && (uiNext.get(String(it.listingId)) || 0) <= Date.now();
  for (const o of lastConfirm) for (const it of o.items || []) { const lid = String(it.listingId || ''); if (!lid) continue; const e = cr.enrich[lid]; const mn = midNo(e, it); if (e && e.mkt && e.uiAt && !mn && !(force && force.has(lid))) continue; const uiOnly = e && (e.mkt || e.mktErr) && (!e.uiAt || mn); if (!uiOnly && (skipUntil.get(lid) || 0) > Date.now() && !(force && force.has(lid))) continue; todo.push({ o, it, lid, mn, needMkt: !(e && (e.mkt || e.mktErr)), force: !!(force && force.has(lid)) }); }
  /* (0.12.8) 시장을 아직 못 읽은 상품을 먼저(휴대폰 출고 화면이 기다리는 것) — 유의 사항만 다시 읽는 상품은 그 뒤, 남은 시간 안에서만 */
  todo.sort((a, b) => (b.needMkt ? 1 : 0) - (a.needMkt ? 1 : 0) || (b.force ? 1 : 0) - (a.force ? 1 : 0));
  const uiStop = Math.min(t0 + 40000, until || Infinity);
  for (const t of todo) { if (Date.now() > stopAt) break; if (!t.needMkt && Date.now() > uiStop) break;
    try { const prevE = cr.enrich[t.lid];
      if (prevE && (prevE.mkt || prevE.mktErr) && (!prevE.uiAt || t.mn) && !(force && force.has(t.lid))) { // (0.5.0) 시장은 이미 읽음 — 우리 매물 유의 사항·사진만 채움 (시장을 다시 읽지 않음)
        const gr = prevE.grade || t.it.grade || null; let ui0 = (await C('prd_used_info').doc(String(t.lid)).get()).data(); if (looksBlanked(ui0)) ui0 = await repairUsedInfo(t.lid, ui0); let ui = ui0;
        if (!ui0 || !ui0.checkedAt || Date.now() - Date.parse(ui0.checkedAt) > 864e5 || (gr === '중' && !(ui0 && ui0.note))) ui = (await refreshUsedInfo(p, t.lid, ui0, null, gr)) || ui0;
        midAfter(t.lid, gr, ui && ui.note);
        const E2 = { ...prevE, note: (ui && ui.note) || realNote(prevE.note, gr) || null, photos: ui && ui.photos ? ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src) : prevE.photos || [], uiAt: nowIso() };
        await enrichPut(t.lid, E2, true); cr.enrich[t.lid] = E2; n++; await sleep(300); continue; }
      const our = await ourOf(t.lid); let itemId = our.itemId, via = 'ours';
      if (looksBlanked(our.ui)) { const r = await repairUsedInfo(t.lid, our.ui); if (r && r.note) our.note = r.note; if (r && r.photos) our.photos = r.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src); our.ui = r; }
      const gr0 = our.grade || t.it.grade || null; const uiStale = !our.ui || !our.ui.checkedAt || Date.now() - Date.parse(our.ui.checkedAt) > 864e5 || (gr0 === '중' && !our.note); const uiLater = uiStale && t.needMkt; /* (0.12.8) 시장 먼저 — 유의 사항 다시 읽기(상품 화면 1~2번 · 몇 초)는 다음 차례(uiAt 없이 남겨 두면 위 '유의 사항만' 길로 채움) */
      if (uiStale && !uiLater) { try { const ui = await refreshUsedInfo(p, t.lid, our.ui, null, gr0); if (ui) { our.note = ui.note || our.note; if ((ui.photos || []).length) our.photos = ui.photos.filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src); } } catch (e) { log('유의 사항 읽기 실패', t.lid, e.message); } } // 주문확인요청 상품도 우리 매물 유의 사항·사진을 바로 읽음 (예전엔 발송 요청 때만)
      if (!itemId && t.it.title) { const q = String(t.it.title).replace(/^\[[^\]]*\]\s*/, '');
        const c = await p.evaluate(async (q) => { const P = window.ReadnowProducts; const r = await fetch('/search/wsearchresult.aspx?SearchTarget=All&SearchWord=' + encodeURIComponent(q), { credentials: 'omit' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html');
          return P.parseSearchResults(d).filter((x) => !x.used).map((x) => ({ itemId: x.itemId, cov: P.nameCoverage(q, x.title), img: x.img || null })).filter((x) => x.cov >= 0.9).sort((a, b) => b.cov - a.cov)[0] || null; }, q);
        if (c) { itemId = String(c.itemId); via = 'search'; if (!our.cover) our.cover = c.img; } }
      if (!uiLater) midAfter(t.lid, gr0, our.note); /* (0.12.12 자동 점검) 유의 사항을 '다음 차례'로 미룬 상품은 아직 읽어 보지 않았으니 실패로 세지 않음 — 예전엔 한 번만 실패해도 PC 수집기에 맡겼음 */
      const E = { at: nowIso(), cover: our.cover, grade: our.grade || t.it.grade || null, sku: our.sku, regAt: our.regAt, note: our.note, photos: our.photos, itemId, via, key: our.key, ...(uiLater ? {} : { uiAt: nowIso() }) };
      if (itemId) { const m = await marketOf(p, itemId, our.usedCode); const at = nowIso();
        E.mkt = { at, usedTotal: m.u.usedTotal ?? null, buyback: m.u.buyback || null, rows: m.rows };
        await C('shp_market').doc(`${t.o.orderNo}__${t.lid}__${at.replace(/[:.]/g, '-')}`).create({ orderNo: t.o.orderNo, listingId: t.lid, listingKey: our.key, bookId: our.bookId, aladinItemId: itemId, via, title: t.it.title || null, orderedAt: t.o.orderedAt || null, at,
          page1: m.u.listings || [], usedTotal: m.u.usedTotal ?? null, mins: m.u.mins || null, buyback: m.u.buyback || null, lastPage: m.u.lastPage || 1, by: 'cloud', ...W() }).catch(() => {}); }
      else { E.mktErr = '알라딘 상품번호를 못 찾음 (우리 기록·제목 검색 모두)'; skipUntil.set(t.lid, Date.now() + 3600e3); }
      await enrichPut(t.lid, { ...E, orderNo: t.o.orderNo }, false); cr.enrich[t.lid] = E; n++; await sleep(300);
    } catch (e) { fail++; const k = (failN.get(t.lid) || 0) + 1; failN.set(t.lid, k); skipUntil.set(t.lid, Date.now() + Math.min(60, 2 ** k) * 60e3); log('보강 실패', t.lid, `${k}번째 · ${Math.min(60, 2 ** k)}분 뒤 다시`, e.message); } } // 실패하면 2·4·8…분(최대 60분) 뒤 다시 — 매분 같은 실패를 되풀이하지 않음
  return { n, fail, left: todo.length - n - fail }; }

/* 우리 매물의 구매 유의 사항·사진 (알라딘 상품 화면) — 24시간에 한 번, 바뀐 판만 쌓음 (prd_used_info + v/ 판). 주문확인요청·발송 요청 둘 다 씀 */
async function refreshUsedInfo(p, lid, prev, at, grade) {
  const rd = (t) => p.evaluate(async ([lid, t]) => { const r0 = await fetch('/shop/wproduct.aspx?ItemId=' + lid + (t ? '&_=' + Date.now() : ''), { credentials: 'omit', cache: 'no-store' }); const html = await r0.text(); const d = new DOMParser().parseFromString(html, 'text/html'); const x = window.ReadnowProducts.parseUsedItemInfo(d, null); x._box = !!d.getElementById('usedDecription'); x._title = (d.title || '').slice(0, 80); x._len = html.length; x._url = r0.url; return x; }, [String(lid), t]);
  let info = await rd(0); if (!info._box || (!info.hasNote && grade === '중')) { await sleep(1500); const i2 = await rd(1); if (i2._box && (i2.hasNote || !info._box)) info = i2; } // 한 번 더 (캐시 피해서)
  const ref = C('prd_used_info').doc(String(lid)); at = at || nowIso();
  // (0.5.3) 유의 사항 칸(#usedDecription)이 없으면 위쪽 표지 사진이 있어도 '못 읽음' — 예전엔 표지 사진만으로 '읽음'이 되어 빈 판을 쌓기도 했음
  //   '중' 상품인데 글이 비면 잘못 읽은 것으로 보고 쓰지 않음 → 다음 회차에 다시 · 그래도 못 읽으면 PC 수집기에 맡김(shp_cmds/ui_상품번호)
  if (info.found && !info._box) { info.found = false; }
  if (info.found && !info.hasNote && grade === '중' && !(prev && prev.note)) { log("'중' 상품인데 유의 사항이 비어 있음 — 쓰지 않음", lid, info._title, info._len, info._url); await ref.set({ lastMissAt: at, lastMissWhy: "'중' 상품인데 유의 사항 글이 비어 있음 (클라우드)", lastMissTitle: info._title || null }, { merge: true }).catch(() => {}); return prev || null; }
  // (0.5.1) 화면에서 유의 사항 칸·사진을 하나도 못 찾으면(다른 화면이 왔거나 읽기 실패) 아무것도 바꾸지 않음 — 예전엔 '빈 판'을 새로 쌓아 있던 유의 사항이 화면에서 사라졌음
  if (!info.found) { log('유의 사항 칸을 못 찾음 — 기록 그대로 둠', lid, info._title, info._len, info._url); await ref.set({ lastMissAt: at, lastMissTitle: info._title || null }, { merge: true }).catch(() => {}); return prev || null; }
  delete info._title; delete info._len; delete info._url;
  if (prev && (prev.note || (prev.photos || []).length) && !info.note && !(info.photos || []).length) { await ref.set({ lastMissAt: at, lastMissWhy: '빈 내용 — 그대로 둠' }, { merge: true }).catch(() => {}); return prev; } // 있던 내용을 빈 것으로 바꾸지 않음
  const sig2 = JSON.stringify([info.note, info.photos.map((x) => x.file)]);
  if (prev && prev.sig === sig2) { await ref.set({ checkedAt: at }, { merge: true }); return { ...prev, checkedAt: at }; }
  const nv = ((prev && prev.versions) || 0) + 1; const b2 = db.batch(); const ver = { note: info.note || null, hasNote: info.hasNote, photos: info.photos.map((x) => ({ src: x.src, where: x.where, file: x.file })), sellerPhotoCount: info.sellerPhotoCount, photoDiff: info.photoDiff, found: info.found, sig: sig2, at };
  b2.set(ref.collection('v').doc(String(nv).padStart(4, '0')), { ...ver, listingId: String(lid), ...W() }); b2.set(ref, { listingId: String(lid), sellerCode: '996008', ours: true, ...ver, versions: nv, firstAt: (prev && prev.firstAt) || at, checkedAt: at, ...W() }, { merge: true }); await b2.commit();
  return { ...(prev || {}), ...ver, versions: nv, checkedAt: at }; }

// 빈 판으로 덮인 유의 사항 되살리기: 마지막 '제대로 읽은 판'(v/ 기록, 지우지 않고 쌓여 있음)의 내용을 다시 지금 값으로 — 판 기록은 그대로 두고 덧붙임
const looksBlanked = (x) => !!x && (x.found === false || (!x.note && !(x.photos || []).length && x.writer === 'cloud')) && x.versions > 1;
async function repairUsedInfo(lid, cur) { if (!looksBlanked(cur)) return cur;
  const vs = await C('prd_used_info').doc(String(lid)).collection('v').get(); const L = vs.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.found !== false && (x.note || (x.photos || []).length)).sort((a, b) => (a.id < b.id ? 1 : -1));
  const g = L[0]; if (!g) return cur; const fix = { note: g.note || null, hasNote: !!(g.hasNote || g.note), photos: g.photos || [], sellerPhotoCount: g.sellerPhotoCount || 0, photoDiff: !!g.photoDiff, found: true, sig: g.sig || null, repairedAt: nowIso(), repairedFrom: g.id };
  await C('prd_used_info').doc(String(lid)).set(fix, { merge: true }); log('유의 사항 되살림', lid, '판', g.id); return { ...cur, ...fix }; }
let lastRepairAt = 0;
async function repairSweep() { if (Date.now() - lastRepairAt < 6 * 3600e3) return 0; lastRepairAt = Date.now(); let n = 0;
  try { for (const q of [C('prd_used_info').where('found', '==', false).limit(300), C('prd_used_info').where('writer', '==', 'cloud').limit(500)]) { const qs = await q.get(); for (const d of qs.docs) { const x = d.data(); if (looksBlanked(x)) { const y = await repairUsedInfo(d.id, x); if (y !== x) n++; } } } } catch (e) { log('유의 사항 되살리기 실패', e.message); }
  return n; }

/* ── ② 발송 요청 읽기 (5분마다 · 주문확인요청에서 주문이 빠졌을 때 · 맡긴 일이 있을 때) — PC 수집기 shipReadJob과 같은 저장 형식 ── */
const sameMap = (a, b) => { a = a || {}; b = b || {}; const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every((k) => a[k] === b[k]); }; // 키 순서가 달라도 같으면 같음 (예전 비교는 순서가 다르면 늘 '바뀜' → 매번 다시 씀)
async function shipRead(p, until) {
  const R = await p.evaluate(async () => {
    const SH = window.ReadnowShipping; const get = async (u) => { const r = await fetch(u, { credentials: 'include' }); const t = await r.text(); return { url: r.url, doc: new DOMParser().parseFromString(t, 'text/html') }; };
    const d = await get('/scm/worder_delivery.aspx?orderstep=4'); if (/\/login\/|wlogin/i.test(d.url)) return { login: false };
    const r = SH.parseDeliveryPage(d.doc); let excel = null, exErr = null;
    try { const fd = new URLSearchParams({ status: '4', keywordType: '0', keyword: '', filterType: '0', limitDate: '0', dnb: '0', page: '' }); const rr = await fetch('/scm/worder_excel.aspx', { method: 'POST', body: fd, credentials: 'include' }); if (!rr.ok) throw new Error('HTTP ' + rr.status); excel = SH.parseAladinOrderExcel(new DOMParser().parseFromString(await rr.text(), 'text/html')); if (!excel) exErr = '엑셀 표를 못 찾음'; } catch (e) { exErr = e.message; }
    return { login: true, r, excel, exErr };
  });
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  const at = nowIso(); const { r, excel } = R;
  const sig = JSON.stringify(r.orders.map((o) => [o.orderNo, o.items.map((i) => i.listingId), o.deliveryNo])); const cur = (await C('shp_state').doc('current').get()).data();
  const changed = !cur || cur.sig !== sig; const b = db.batch(); let w = false; let oOps2 = null;
  if (changed) { w = true; b.set(C('shp_state').doc('current'), { at, tabCounts: r.tabCounts, orders: r.orders, sig, pc: 'cloud', excel: null, ...W() }); // 엑셀은 따로(shp_state/excel) — 목록 문서를 가볍게
    b.set(C('shp_snapshots').doc(at.replace(/[:.]/g, '-')), { at, tabCounts: r.tabCounts, orders: r.orders, by: 'cloud', ...W() });
    const seen2 = await firstSeenHave(r.orders.filter((o) => !(cur && (cur.orders || []).some((x) => x.orderNo === o.orderNo))), 'firstSeenAt');
    oOps2 = r.orders.map((o) => [C('shp_orders').doc(o.orderNo), { orderNo: o.orderNo, stage: '발송 요청', lastSeenAt: at, ...((cur && (cur.orders || []).some((x) => x.orderNo === o.orderNo)) || seen2.has(o.orderNo) ? {} : { firstSeenAt: at }), buyer: o.buyer, recipient: o.recipient, orderedAt: o.orderedAt, items: o.items, carrier: o.carrier, ...W() }]); }
  else if (cur && !sameMap(cur.tabCounts, r.tabCounts)) { w = true; b.set(C('shp_state').doc('current'), { at, tabCounts: r.tabCounts, pc: 'cloud', ...W() }, { merge: true }); }
  if (excel) { const xr = C('shp_state').doc('excel'); const xo = (await xr.get()).data(); const rows = excel.rows.map((v) => ({ v })); if (!xo || JSON.stringify(xo.rows) !== JSON.stringify(rows)) { w = true; b.set(xr, { at, header: excel.header, rows, pc: 'cloud', ...W() }); b.set(C('shp_excel').doc(at.replace(/[:.]/g, '-')), { at, header: excel.header, rows, by: 'cloud', ...W() }); /* (0.9.6) 바뀐 판마다 따로 보관 — 지금 문서는 덮어써도 옛 판이 남게 */ } }
  if (oOps2) await batchOps(oOps2); if (w) await b.commit(); /* (0.11.0) 주문 문서는 따로 400개씩 먼저 — 목록(sig)은 그 뒤에 */
  // 우리 매물 유의 사항·사진 (24시간에 한 번 — PC 수집기와 같은 기록, 바뀐 판만 쌓음)
  let nInfo = 0; const items = r.orders.flatMap((o) => o.items).filter((i) => i.listingId);
  /* (0.12.5 점검 F8) 24시간 안에 확인한 상품(이 클라우드가 기억)은 다시 읽지 않음 — 예전엔 4~5분마다 발송 요청의 모든 상품 문서를 읽었음 · '중' 상품(유의 사항 기다림)은 그대로 */
  const needI = items.filter((it) => { const c = uiSeen.get(String(it.listingId)); return it.grade === '중' || !c || Date.now() - c > 864e5; });
  const prevA = needI.length ? await db.getAll(...needI.map((it) => C('prd_used_info').doc(String(it.listingId)))) : []; const prevM = new Map(needI.map((it, k) => [it, prevA[k]]));
  for (let ii = 0; ii < items.length; ii++) { const it = items[ii]; if (until && Date.now() > until) break; if (!prevM.has(it)) continue; const prevs = { [ii]: prevM.get(it) }; // 시간 상자: 한 회차가 1분을 넘지 않게 — 남은 것은 다음 회차
    const ref = C('prd_used_info').doc(String(it.listingId)); let prev = prevs[ii] && prevs[ii].exists ? prevs[ii].data() : undefined; if (looksBlanked(prev)) prev = await repairUsedInfo(it.listingId, prev); const mid = it.grade === '중' && !(prev && prev.note) && (uiNext.get(String(it.listingId)) || 0) <= Date.now(); if (prev && prev.checkedAt) uiSeen.set(String(it.listingId), Date.parse(prev.checkedAt)); if (!mid && prev && prev.checkedAt && Date.now() - Date.parse(prev.checkedAt) < 864e5) continue;
    try { const nx = await refreshUsedInfo(p, it.listingId, prev, at, it.grade || null); uiSeen.set(String(it.listingId), Date.now()); if (it.grade === '중') midAfter(it.listingId, it.grade, nx && nx.note); if (nx && (!prev || nx.versions !== prev.versions)) nInfo++; void ref;
      await sleep(600); } catch (e) { log('유의 사항 읽기 실패', it.listingId, e.message); } }
  lastDelivAt = Date.now();
  return { deliv: r.orders.length, items: items.length, changed, nInfo, exErr: R.exErr || null }; }

/* ── ③ 웹앱이 맡긴 일 (read · startDelivery · market = 그 주문 책의 시장 다시 읽기) ── */
/* (0.12.9) 맡긴 일 두 갈래 — 급한 일(발송준비시작·판매중지·현금 판매중지·다시 읽기)은 회차 맨 앞, 느린 일(우리 매물 유의 사항 다시 읽기·시장 지표·알라딘 구매)은 시장 읽기 뒤 남은 시간에만
 *  예전엔 휴대폰이 맡긴 '중 상품 유의 사항 다시 읽기'가 쌓이면 회차 맨 앞에서 2분까지 써서 주문확인요청 다시 읽기·시장 읽기가 밀렸음 */
const CMD_SLOW = new Set(['usedInfo', 'market', 'aladinBuy']); const cmdUrgent = (t) => !CMD_SLOW.has(t), cmdSlow = (t) => CMD_SLOW.has(t);
async function runCmds(p, deadline, only) { deadline = deadline || Date.now() + 150000; // (0.9.1) 이 시각이 지나면 새 일을 맡지 않음(남은 일은 대기 그대로 → 다음 회차) — 회차가 Cloud Run 5분 한도를 넘지 않게
  /* (0.12.5 점검 F8) 대기 목록은 듣고 있는 목록(watchCmds)을 그대로 씀 — 예전엔 1분·15초마다 다시 읽어, PC 몫으로 남은 일이 많으면 읽기가 하루 수만 번 늘었음 · 듣기가 끊겼으면 예전처럼 읽음 */
  const qs = cmdUnsub && cmdDocs ? { docs: cmdDocs.slice(), size: cmdDocs.length } : await C('shp_cmds').where('status', '==', 'queued').get(); let n = 0, needRead = false; const force = new Set();
  let buy = false; const { M, R } = qs.size ? await regNow() : { M: null, R: null };
  for (const d of qs.docs) { if (Date.now() > deadline) { log('맡긴 일: 이번 회차 시간을 다 씀 — 남은 일은 다음 회차에'); break; } p = curPage(p); const x0 = d.data(); if (only && !only(x0.type)) continue; if (!M.canHandle(R, x0.type, 'cloud') || String(x0.cloudSkip || '').includes(` ${VER}가`)) continue; /* (0.6.0) 노선표에서 클라우드가 맡는 종류만 (예전: 이 자리의 목록) */ if (x0.type === 'usedInfo' && x0.cloudTried) continue; /* 클라우드가 이미 못 읽은 것 = PC 몫 */ let v = null;
    await db.runTransaction(async (tx) => { const sn = await tx.get(d.ref); const x = sn.data(); if (!x || x.status !== 'queued') return; tx.update(d.ref, { status: 'running', claim: { pc: 'cloud', at: nowIso() }, uploadedAt: FV.serverTimestamp() }); v = x; });
    if (!v) continue; n++;
    try { /* (0.9.1) 한 일이 실패해도 나머지 맡긴 일은 계속 — 예전엔 하나가 오류를 던지면 그 회차의 남은 일이 모두 밀리고 그 일은 '하는 중'으로 남았음 */
    if (v.type === 'startDelivery') { const results = {};
      const X = await execMod(); if (!X) { await d.ref.set({ status: 'queued', claim: null, cloudSkip: `클라우드 ${VER}가 실행 문 파일을 못 읽음 — 기록 없이 알라딘을 바꾸지 않음`, uploadedAt: FV.serverTimestamp() }, { merge: true }); log('발송준비시작: 실행 문 파일 없음 — 대기로'); continue; }
      let leftOver = false; for (const ono of v.orderNos || []) { if (Date.now() > deadline + 30000 && !results[ono]) { leftOver = true; continue; } /* (0.9.1) 회차 시간 넘음 — 시작 안 한 주문은 다음 회차로 */ const xk = `${d.id}:${ono}`; let g; try { g = await X.begin(db, { kind: 'startDelivery', key: xk, by: 'cloud', detail: { ono } }); } catch (e) { g = { ok: false, state: 'noledger', why: '실행 기록을 못 적음: ' + e.message }; }
        if (!g.ok) { results[ono] = { state: g.state === 'done' ? 'done' : 'unknown', at: nowIso(), msg: '실행 문: ' + g.why, by: 'cloud', gate: g.state }; continue; }
        /* (0.9.1) 보내기: ① 화면이 이미 닫혀 못 보냄 → 새 화면으로 한 번 더 ② 로그인 화면으로 돌아옴(처리 안 됨) → 그 자리에서 다시 로그인 뒤 한 번 더 ③ 보낸 뒤 답이 끊김 → 아래 목록 확인이 정함 */
        let rr = null, sendErr = null; for (let at = 0; at < 2 && !rr; at++) { p = curPage(p); if (p.isClosed && p.isClosed()) { try { p = await getPage(); } catch (e) { sendErr = { notSent: true, msg: '화면을 새로 못 만들어 보내지 못함: ' + e.message }; break; } } /* 보내기 전에 닫혀 있으면 = 확실히 안 보냄 → 새 화면 */
          try { const r1 = await p.evaluate(async (o) => { const r = await fetch('/scm/worder_process.aspx?cmd=StartDelivery&ono=' + encodeURIComponent(o), { credentials: 'include' }); const t = await r.text(); if (/\/login\/|wlogin/i.test(r.url)) return { login: false }; return { ok: r.ok, status: r.status, al: (t.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || null }; }, ono);
            if (r1.login === false) { if (at === 0) { try { await login(p); continue; } catch (e) { sendErr = { notSent: true, msg: '로그인 풀림 — 다시 로그인 실패: ' + e.message }; break; } } sendErr = { notSent: true, msg: '로그인 풀림 — 알라딘이 받지 않음(보내지지 않음)' }; break; }
            rr = r1; }
          catch (e) { /* 보내는 도중 오류(끊김·브라우저 멈춤·닫힘) = 알라딘이 받았는지 모름 → 목록 확인이 정함 */ sendErr = { noReply: true, msg: '답을 못 받음 — 목록으로 확인: ' + String(e.message).slice(0, 120) }; if (e.pageTimeout || pageBroken || isClosed(e)) { try { p = await getPage(); } catch (e2) {} } break; } }
        if (rr) results[ono] = { state: rr.ok && !/실패|오류|불가|잘못|없습니다|않습니다|error/i.test(rr.al || '') ? 'sent' : 'fail', at: nowIso(), http: rr.status, msg: rr.al, by: 'cloud' };
        else if (sendErr && sendErr.noReply) results[ono] = { state: 'sent', at: nowIso(), msg: sendErr.msg, by: 'cloud', noReply: true };
        else results[ono] = { state: 'fail', at: nowIso(), msg: (sendErr && sendErr.msg) || '보내지 못함', by: 'cloud', notSent: true }; // 보내지 않은 것이 확실 → 실패(다시 할 수 있음)
        await d.ref.set({ results, beatAt: nowIso(), uploadedAt: FV.serverTimestamp() }, { merge: true }).catch(() => {}); await sleep(800); } // (0.5.4) 한 건마다 결과·살아 있음 신호
      // 확인: 주문확인요청 화면을 다시 읽어 빠졌는지 — 화면을 제대로 읽었을 때만 '끝남'(로그인 화면·읽기 실패로 빈 목록이면 '확인 못함')
      // (0.9.1) 답이 끊긴 주문이 있으면 알라딘이 마저 처리할 틈(5초)을 준 뒤 확인 · 지금 화면으로 · 로그인 화면이면 다시 로그인 뒤 한 번 더
      if (Object.values(results).some((r) => r.noReply)) await sleep(5000);
      if (pageBroken) { try { p = await getPage(); } catch (e) {} } p = curPage(p);
      const readLeft = () => p.evaluate(async (u) => { const r = await fetch(u, { credentials: 'include' }); if (/\/login\/|wlogin/i.test(r.url)) return { ok: false, login: false }; const d = new DOMParser().parseFromString(await r.text(), 'text/html'); const x = window.ReadnowShipping.parseDeliveryPage(d); const left = (x.orders || []).map((o) => o.orderNo); const tc = (x && x.tabCounts) || {}; /* (0.12.5 점검 F2) '끝남'은 확실할 때만: 주문확인요청 목록을 다 본 경우(목록 주문 수 = 탭 숫자) 또는 그 주문이 발송 요청 목록에 실제로 보일 때 */ let deliv = null; try { const r2 = await fetch('/scm/worder_delivery.aspx?orderstep=4', { credentials: 'include' }); if (!/\/login\/|wlogin/i.test(r2.url)) { const d2 = new DOMParser().parseFromString(await r2.text(), 'text/html'); const y = window.ReadnowShipping.parseDeliveryPage(d2); deliv = (y.orders || []).map((o) => o.orderNo); } } catch (e) {} return { ok: !!Object.keys(tc).length, left, full: tc['주문확인요청'] != null && left.length >= tc['주문확인요청'], deliv }; }, CONFIRM_URL);
      try { let chk = null; for (let at = 0; at < 2; at++) { try { chk = await readLeft(); } catch (e) { if (at === 0 && (isClosed(e) || e.pageTimeout || pageBroken)) { p = await getPage(); continue; } throw e; } if (chk.login === false && at === 0) { await login(p); continue; } break; }
        for (const ono of Object.keys(results)) if (results[ono].state === 'sent') { results[ono].state = !chk || !chk.ok ? 'unknown' : chk.left.includes(ono) ? 'fail' : (chk.deliv && chk.deliv.includes(ono)) || chk.full ? 'done' : 'unknown'; results[ono].proof = !chk || !chk.ok ? null : chk.left.includes(ono) ? 'stillConfirm' : chk.deliv && chk.deliv.includes(ono) ? 'inDelivery' : chk.full ? 'confirmFullAbsent' : 'notFound'; } } catch (e) { for (const ono of Object.keys(results)) if (results[ono].state === 'sent') results[ono].state = 'unknown'; }
      for (const [ono, r] of Object.entries(results)) if (!r.gate) await X.finish(db, { kind: 'startDelivery', key: `${d.id}:${ono}` }, r.state === 'done' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown', { msg: r.msg || null, result: { http: r.http || null } }).catch(() => {});
      { const notSent = Object.values(results).filter((r) => r.notSent); // (0.9.1) 보내지 못한 주문(로그인 실패 등)·시간이 모자라 시작 못 한 주문이 있으면 '끝남'으로 닫지 않고 대기로 → 다음 회차(또는 PC)가 이어 함 (끝난 주문은 실행 문이 다시 보내지 않음)
        if (notSent.length || leftOver) { const nErr = (v.cloudErrN || 0) + (notSent.length ? 1 : 0); await d.ref.set({ status: 'queued', claim: null, results, cloudErr: notSent.length ? notSent[0].msg : '시간이 모자라 남은 주문은 다음 회차에', cloudErrN: nErr, cloudErrAt: nowIso(), ...(nErr >= 3 ? { cloudSkip: `클라우드 ${VER}가 3번 보내지 못함 — PC 수집기 몫` } : {}), uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; }
        else { await d.ref.set({ status: 'done', results, doneAt: nowIso(), uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; } } }
    else if (v.type === 'usedInfo') { const results = {}; let allOk = true; // (0.5.3) '중' 상품 유의 사항 다시 읽기 (웹앱이 맡김) — 못 읽으면 PC 수집기 몫으로 남김
      for (const lid of v.listingIds || []) { try { const prev = (await C('prd_used_info').doc(String(lid)).get()).data(); const ui = await refreshUsedInfo(p, lid, prev, null, v.grade || null); const ok = !!(ui && realNote(ui.note, v.grade));
          results[lid] = ok ? { ok: true, at: nowIso(), by: 'cloud' } : { ok: false, why: '클라우드: 상품 화면에서 유의 사항을 못 읽음', at: nowIso() }; if (!ok) allOk = false;
          if (ok) { const cr0 = (await C('shp_state').doc('confirm').get()).data(); if (cr0 && cr0.enrich && cr0.enrich[lid]) await C('shp_state').doc('confirm').update(new FieldPath('enrich', String(lid)), { ...cr0.enrich[lid], note: ui.note, photos: (ui.photos || []).filter((x) => x.where === 'desc').slice(0, 2).map((x) => x.src), uiAt: nowIso() }); } }
        catch (e) { results[lid] = { ok: false, why: e.message, at: nowIso() }; allOk = false; } }
      await d.ref.set(allOk ? { status: 'done', results, doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() } : { status: 'queued', cloudTried: true, cloudResults: results, claim: null, uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else if (v.type === 'market') { (v.listingIds || []).forEach((x) => force.add(String(x))); await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else if (v.type === 'aladinBuy') { buy = true; await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); }
    else if (v.type === 'cashStop' && Date.now() > deadline - 60000) { await d.ref.set({ status: 'queued', claim: null, uploadedAt: FV.serverTimestamp() }, { merge: true }); log('판매중지: 이번 회차 남은 시간이 모자라 다음 회차에'); } // (0.9.1) 판매중지는 최대 230초 — 회차 한도를 넘지 않게
    else if (v.type === 'cashStop') { const X = await execMod(); if (!X) { await d.ref.set({ status: 'queued', claim: null, cloudSkip: `클라우드 ${VER}가 실행 문 파일을 못 읽음 — 기록 없이 알라딘을 바꾸지 않음`, uploadedAt: FV.serverTimestamp() }, { merge: true }); continue; }
      let g; try { g = await X.begin(db, { kind: 'cashStop', key: d.id + '#' + (v.tries || 1), by: 'cloud', detail: { orderId: v.orderId, lineNo: v.lineNo, listingId: v.listingId || null, title: v.title || null } }); } catch (e) { g = { ok: false, state: 'noledger', why: e.message }; }
      if (!g.ok) { await d.ref.set({ status: 'done', result: { state: g.state === 'done' ? 'skip' : 'check', msg: '실행 문: ' + g.why }, doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); continue; }
      let r; try { r = await cashStopRun(p, v); } catch (e) { await X.finish(db, { kind: 'cashStop', key: d.id + '#' + (v.tries || 1) }, 'failed', { msg: e.message }).catch(() => {}); throw e; }
      await X.finish(db, { kind: 'cashStop', key: d.id + '#' + (v.tries || 1) }, r.state === 'done' ? 'done' : r.state === 'fail' ? 'failed' : 'unknown', { msg: r.msg || null }).catch(() => {}); await d.ref.set({ status: 'done', result: r, doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); log('현금 판매 판매중지', v.title || v.listingId, r.state); }
    else if (v.type === 'read') { await d.ref.set({ status: 'done', doneAt: nowIso(), by: 'cloud', uploadedAt: FV.serverTimestamp() }, { merge: true }); needRead = true; }
    else { await d.ref.set({ status: 'queued', claim: null, cloudSkip: `클라우드 ${VER}가 처리하는 길이 없는 종류 — 노선표 확인`, uploadedAt: FV.serverTimestamp() }, { merge: true }); log('맡긴 일: 처리 길 없음', v.type); }
    } catch (e) { const nErr = (v.cloudErrN || 0) + 1; const msg = String(e.message || e).slice(0, 300);
      await d.ref.set({ status: 'queued', claim: null, cloudErr: msg, cloudErrN: nErr, cloudErrAt: nowIso(), ...(nErr >= 3 && (!e.relogin || nErr >= 6) ? { cloudSkip: `클라우드 ${VER}가 3번 실패 — PC 수집기 몫 (마지막: ${msg.slice(0, 80)})` } : {}), uploadedAt: FV.serverTimestamp() }, { merge: true }).catch(() => {});
      log('맡긴 일 실패 — 대기로 되돌림', v.type, d.id, nErr + '번째', msg); if (e.relogin) throw e; if (e.pageTimeout || pageBroken || isClosed(e)) { try { p = await getPage(); } catch (e2) {} } } } // 노선표엔 클라우드 몫인데 이 판에 처리 길이 없으면 '끝남'으로 지우지 않고 대기로 되돌림
  return { n, needRead, force, buy, p };
}

/* ── (0.6.1) 현금 판매한 상품 → 알라딘 판매중지 (수집기 1.37.0의 같은 일과 같은 방법 — 상품 조회/수정 화면의 '판매상태 일괄 변경' 요청)
 *  ① 알라딘 상품번호: 맡긴 일 → 우리 상품 기록  ② 지금 상태 코드: 우리 상품 기록(판매중 1·일시판매중지 3·판매대기 41)  ③ 판매중지(15)로 바꿈
 *  ④ '판매중지' 목록에서 제목으로 찾아 그 상품번호가 있어야 'done' — 없으면 원래 상태를 다른 값으로 한 번씩 더, 그래도 없으면 'check'(완료로 적지 않음 — 사람 확인)
 *  ⑤ 현금 판매 기록(crm_orders)의 그 줄만 트랜잭션으로 고침(다른 줄·금액은 그대로) + 고친 기록 history */
const ST_CODE = { 판매중: 1, 판매대기: 41, 일시판매중지: 3, 판매중지: 15, 판매완료: 18, 판매금지: 16 };
async function cashStopRun(p, v) { const by = 'cloud';
  let lid = v.listingId ? String(v.listingId) : null; let ld = null; try { ld = (await C('prd_listings').doc(v.listingKey || ('aladin_' + v.usedCode)).get()).data() || null; } catch (e) {} if (!lid && ld && ld.listingId) lid = String(ld.listingId);
  if (!lid) return { state: 'fail', msg: '알라딘 상품번호를 못 찾음' };
  const before = (ld && ST_CODE[ld.status]) || 1; const kw = String(v.title || '').replace(/^\[[^\]]*\]\s*/, '').slice(0, 30);
  const R = await (p.evaluateSlow || p.evaluate)(async (a) => { const set = async (from) => { try { const fd = new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: String(from), stockStatusToDo: '15', items: a.lid }); const rr = await fetch('/scm/wrecord_edit_usedbatch.aspx', { method: 'POST', body: fd, credentials: 'include' }); const t = await rr.text(); if (/\/login\/|wlogin/i.test(rr.url)) return { login: false }; return { ok: rr.ok, al: (t.match(/alert\(['"]([^'"]{2,200})['"]\)/) || [])[1] || '' }; } catch (e) { return { ok: false, al: '답을 못 받음 (판매중지 목록으로 확인)' }; } }; /* (0.9.1) 보낸 뒤 답이 끊겨도 아래 판매중지 목록 확인이 정함 */
    const inStop = async () => { if (!a.kw) return null; try { const r = await fetch(`/scm/wrecord_edit.aspx?chkItemStockStatus=15&chkItemInDate=0&searchCat1=0&searchType=1&keyword=${encodeURIComponent(a.kw)}&ViewRowsCount=100&page=1&SortOrder=6&itemStockStatus=15&categoryId=0`, { credentials: 'include', cache: 'no-store' }); if (!r.ok) return null; const doc = new DOMParser().parseFromString(await r.text(), 'text/html'); return window.ReadnowProducts.parseScmList(doc).rows.some((x) => String(x.listingId) === String(a.lid)); } catch (e) { return null; } };
    let s1 = await set(a.before); if (s1.login === false) return { login: false }; let ok = await inStop(); let used = a.before; let al = s1.al;
    for (const alt of [1, 3, 41]) { if (ok !== false || alt === a.before) continue; const s2 = await set(alt); al = s2.al || al; used = alt; ok = await inStop(); }
    return { login: true, ok, used, al }; }, { lid, before, kw });
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  const st = R.ok ? 'done' : 'check'; const at = nowIso();
  await db.runTransaction(async (tx) => { const ref = C('crm_orders').doc(v.orderId); const sn = await tx.get(ref); if (!sn.exists) return; const o = sn.data(); const items = JSON.parse(JSON.stringify(o.items || [])); const it = items.find((x) => x.lineNo === v.lineNo); if (!it || (it.aladinStop && it.aladinStop.status === 'done') || it.released) return;
    it.listingId = it.listingId || lid; it.aladinStop = { status: st, at, by, from: 'cloud-stop', before: R.used, verified: R.ok === true, msg: R.al || null, cmd: v.id || null };
    tx.update(ref, { items, uploadedAt: FV.serverTimestamp(), history: FV.arrayUnion({ at, by, what: `알라딘 판매중지로 바꿈(클라우드 자동): ${v.title || lid}${R.ok ? ' · 판매중지 목록에서 확인함' : ' · 판매중지 목록에서 확인 못함(확인 필요)'}${R.al ? ' · 알라딘: ' + R.al : ''}` }) }); });
  return { state: st, listingId: lid, before: R.used, msg: R.al || null }; }

/* ── ④ 알라딘에서 산 주문 (매입) — 5분마다 첫 쪽(최신 주문)만 읽음 · 새 주문은 바로 상세(품목·가격·판매자)까지
   → pur_aladin_orders (PC 수집기 '알라딘 구매 내역'과 같은 저장 형식) → 웹앱이 실시간으로 받아 '주문함' 매입 기록을 만듦
   · 이미 받은 주문은 다시 쓰지 않음. 비고(배송 상태 등)가 바뀌면 원래 값은 두고 noteNow · noteLog 에 덧붙임 */
const BUY_URL = '/account/wmaininfo.aspx?pType=MyAccount&start=we'; let lastBuyAt = 0, lastBuyRes = null;
async function buyRead(p, until) {
  const R = await p.evaluate(async (u) => {
    const body = new URLSearchParams({ page: '1', searchYear: '0', searchMonth: '0', searchType: '0', searchShopType: '0', searchOrderStatus: '0' });
    const r = await fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }); const html = await r.text();
    if (/\/login\/|wlogin/i.test(r.url)) return { login: false }; const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = []; doc.querySelectorAll('td.td_date').forEach((td) => { const tr = td.closest('tr'); const d = (td.textContent || '').trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !tr) return;
      const a = tr.querySelector('td.td_link a'); const ono = a ? (a.textContent || '').trim() : null; if (!ono) return;
      const item = tr.querySelector('.td_left_item'); const txt = item ? item.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : '';
      const m = txt.match(/총\s*(\d+)\s*종\s*(\d+)\s*권[^,]*,\s*([\d,]+)\s*원/); const note = tr.querySelector('td.td_note'); const recvT = [...tr.querySelectorAll('td.td_date')].map((t) => t.textContent.trim()).find((t) => t && !/^\d{4}-/.test(t));
      out.push({ ono, date: d, summary: txt.replace(/\s*총\s*\d+\s*종.*$/, ''), kinds: m ? +m[1] : null, qty: m ? +m[2] : null, amount: m ? +m[3].replace(/,/g, '') : null, note: note ? note.textContent.replace(/\s+/g, ' ').trim() : null, recipient: recvT || null }); });
    if (!out.length && doc.querySelector('input[type="password"]')) return { login: false };
    return { login: true, rows: out }; }, BUY_URL);
  if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  lastBuyAt = Date.now(); const rows = R.rows || []; if (!rows.length) return (lastBuyRes = { rows: 0, nNew: 0, nDet: 0 });
  const refs = rows.map((x) => C('pur_aladin_orders').doc(x.ono)); const snaps = await db.getAll(...refs); const at = nowIso();
  const b = db.batch(); let w = 0, nNew = 0; const need = [];
  rows.forEach((x, i) => { const sn = snaps[i];
    if (!sn.exists) { b.set(refs[i], { ...x, collectedAt: at, by: 'cloud', ...W() }); w++; nNew++; need.push(x.ono); return; }
    const o = sn.data(); const cur = o.noteNow !== undefined ? o.noteNow : o.note ?? null;
    if ((x.note || null) !== (cur || null)) { b.set(refs[i], { noteNow: x.note || null, noteAt: at, noteLog: FV.arrayUnion({ at, note: x.note || null }), ...W() }, { merge: true }); w++; }
    if (!o.lines) need.push(x.ono); });
  if (w) await b.commit();
  let nDet = 0;
  for (const ono of need) { if (until && Date.now() > until) break;
    try { const d = await p.evaluate(async (ono) => { const r = await fetch('/account/wordersinfo.aspx?pType=OrdersInfo&ONO=' + encodeURIComponent(ono), { credentials: 'include' }); const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
        const tables = [...doc.querySelectorAll('table')].map((t) => t.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()).filter((t) => /\[중고|상품명|판매자|정가|수량/.test(t));
        const items = [...doc.querySelectorAll('a[href*="wproduct.aspx"]')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 1);
        const lines = []; doc.querySelectorAll('tr[id^="ordersItem_"]').forEach((tr) => { const sp = tr.querySelector('.td_item span') || tr.querySelector('.td_item a.linkblue'); const raw = sp ? sp.textContent.replace(/\s+/g, ' ').trim() : ''; if (!raw) return;
          const g = raw.match(/^\[(?:온라인)?중고-([^\]]+)\]\s*/); const title = raw.replace(/^\[[^\]]*\]\s*/, ''); const am = (tr.querySelector('.td_amount') || {}).textContent || ''; const q = (am.match(/(\d+)\s*\/\s*\d+/) || am.match(/(\d+)/) || [])[1];
          const pm = ((tr.querySelector('.td_mileage') || {}).textContent || '').match(/가격\s*:\s*([\d,]+)\s*원/); lines.push({ title, raw, grade: g ? g[1] : null, qty: q ? +q : 1, price: pm ? +pm[1].replace(/,/g, '') : null, itemId: (tr.id.match(/ordersItem_(\d+)/) || [])[1] || null }); });
        const sellers = [...doc.querySelectorAll('a[href*="wshopitem.aspx"]')].map((a) => ({ name: a.textContent.trim(), sc: (a.href.match(/SC=(\d+)/i) || [])[1] || null }));
        return { detailText: tables.join(' | ').slice(0, 6000) || doc.body.textContent.replace(/\s+/g, ' ').slice(0, 3000), items: [...new Set(items)].slice(0, 60), lines: lines.slice(0, 80), sellers }; }, ono);
      if (!d.lines.length && !d.items.length) { log('알라딘 주문 상세: 품목을 못 읽음', ono); continue; } // 화면이 다르면 쓰지 않음 (다음 회차·PC 수집기가 다시)
      await C('pur_aladin_orders').doc(ono).set({ ...d, detailAt: nowIso(), detailBy: 'cloud', ...W() }, { merge: true }); nDet++; await sleep(500); } catch (e) { log('알라딘 주문 상세 실패', ono, e.message); } }
  return (lastBuyRes = { rows: rows.length, nNew, nDet, left: need.length - nDet }); }

/* ── 신호 ── */
let lastErrLog = { err: null, at: 0 };
async function beat(x) { const at = nowIso(); await C('app_settings').doc('cloud').set({ at, ver: VER, cores: coreVer, ...x, ...W() }, { merge: true }).catch((e) => log('신호 저장 실패', e.message));
  if (x.ok === false && (x.err !== lastErrLog.err || Date.now() - lastErrLog.at > 30 * 60e3)) { lastErrLog = { err: x.err, at: Date.now() }; await C('cloud_log').add({ at, ...x, ver: VER, ...W() }).catch(() => {}); } // 같은 오류는 30분에 한 번만 기록
  if (x.ok) lastErrLog = { err: null, at: 0 }; }

// 한 회차(1분마다): ① 주문확인요청 → 맡긴 일 → (필요할 때만) ② 발송 요청 → 상품 보강
/* (0.9.0) 맡긴 일 듣기: 대기 중인 일이 생기면 바로 깨움 (웹앱이 단추를 누르면 15초를 기다리지 않음) */
let kickFlag = false, cmdUnsub = null; const KICK = () => { kickFlag = true; };
let cmdDocs = null, cmdDocsAt = 0; const uiSeen = new Map(); setInterval(() => { const cut = Date.now() - 3 * 864e5; for (const [k, v] of uiSeen) if (v < cut) uiSeen.delete(k); }, 6 * 3600e3).unref();
function watchCmds() { if (cmdUnsub) return; try { cmdUnsub = C('shp_cmds').where('status', '==', 'queued').onSnapshot((qs) => { cmdDocs = qs.docs; cmdDocsAt = Date.now(); if (!qs.empty) kickFlag = true; }, (e) => { cmdUnsub = null; cmdDocs = null; log('맡긴 일 듣기 끊김 — 다음 회차에 다시', e.message); }); } catch (e) { cmdUnsub = null; } }
/* 빠른 고리를 언제 돌릴지 (app_settings/main.shipFast · 웹앱 설정 ⑯): 'biz'(기본) = 평일 8~19시 · 'always' = 늘 · 'off' = 안 함(1분마다만)
 *  빠른 고리는 회차(요청)를 1분 가까이 열어 두므로 클라우드 사용 시간이 늘어남 → 비용과 맞바꿈. 그 밖의 시간에도 단추(맡긴 일)는 다음 회차(1분 안)에 처리 */
/* (0.12.0) 클라우드가 하는 일 켜기·끄기 — app_settings/cloud_jobs { 일: true/false } · 적어 두지 않은 일은 켜짐(외부 정보 이어 받기만 따로 기본 끔: app_settings/ext.cloud)
 *  confirm 주문확인요청 읽기 · fast 빠른 고리(15초) · ship 발송 요청 읽기 · enrich 주문 상세·우리 매물 유의 사항 · cmds 웹앱이 맡긴 일(발송준비시작·판매중지·현금 판매중지)
 *  buy 알라딘에서 산 주문(매입) 첫 쪽 · repair 유의 사항 되살림 · sweep 맡긴 일 살피기·알림 · costs 데이터 관리 비용 기록 · ml 판매 결과 기록 · learn 스스로 배우기 · req 웹앱이 부르는 일(사진 가격·등록 찾기·책등 읽기·백업 목록) */
const CJ_KEYS = ['confirm', 'fast', 'ship', 'enrich', 'cmds', 'buy', 'repair', 'sweep', 'costs', 'ml', 'learn', 'req', 'kpb']; /* (0.15.0) kpb = 📰 출판 정보 게시판 */
let cjCache = null, cjAt = 0;
async function cjobs() { if (cjCache && Date.now() - cjAt < 30e3) return cjCache; let d = {}; try { const sn = await C('app_settings').doc('cloud_jobs').get(); d = sn.exists ? sn.data() || {} : {}; } catch (e) { if (cjCache) return cjCache; }
  const allOn = d.all !== false; const J = { all: allOn }; CJ_KEYS.forEach((k) => { J[k] = allOn && d[k] !== false; }); cjCache = J; cjAt = Date.now(); return J; }
let fastCfg = null, fastCfgAt = 0;
async function fastMode() { if (!fastCfg || Date.now() - fastCfgAt > 5 * 60e3) { fastCfgAt = Date.now(); try { fastCfg = ((await C('app_settings').doc('main').get()).data() || {}).shipFast || {}; } catch (e) { fastCfg = fastCfg || {}; } }
  const mode = fastCfg.mode || 'biz'; if (mode === 'off') return { on: false, why: '설정에서 끔' };
  // PC 수집기가 15초마다 읽는 중이면(shp_state/fast.at 45초 안) 클라우드 빠른 고리는 쉼 — 같은 일을 두 번 하지 않고 비용을 아낌. PC가 꺼지면 다음 회차부터 다시 돎
  try { const f = (await C('shp_state').doc('fast').get()).data() || {}; const age = Date.now() - Date.parse(f.at || 0); if (age >= 0 && age < 45e3) return { on: false, why: `PC(${f.pc || '?'})가 15초마다 읽는 중` }; } catch (e) {}
  if (mode === 'always') return { on: true, why: '늘' };
  const k = new Date(Date.now() + 9 * 3600e3); const wd = k.getUTCDay(), h = k.getUTCHours(); const from = fastCfg.from ?? 8, to = fastCfg.to ?? 19; const on = wd >= 1 && wd <= 5 && h >= from && h < to; return { on, why: `평일 ${from}~${to}시` }; }
async function fastLoop(p, until, cr, cm, J) { J = J || {}; const FAST = 15000; let loops = 0, changed = 0, n = 0, rd = null; let last = Date.now();
  while (Date.now() < until) { while (Date.now() < Math.min(until, last + FAST) && !kickFlag) await sleep(300); if (Date.now() >= until && !kickFlag) break;
    kickFlag = false; last = Date.now(); loops++; p = curPage(p); if (pageBroken) { try { p = await getPage(); } catch (e) { break; } }
    try { const cm2 = J.cmds === false ? { n: 0, needRead: false, force: new Set() } : await runCmds(p, until + 20000, cmdUrgent); if (cm2.p) p = curPage(cm2.p); n += cm2.n; let c2; try { c2 = await confirmRead(p); } catch (e) { if (!e.relogin) throw e; await login(p); c2 = await confirmRead(p); }
      if (c2.changed) { changed++; cr = c2; } if (J.ship !== false && (cm2.needRead || (c2.prevTab && c2.tabCounts && c2.prevTab['발송 요청'] !== c2.tabCounts['발송 요청']))) { try { rd = await shipRead(p, Math.min(until + 5000, Date.now() + 20000)); lastDelivAt = Date.now(); } catch (e) { log('빠른 발송 요청 읽기 실패', e.message); } }
      if (J.enrich !== false) { try { await enrichConfirm(p, c2, cm2.force, Math.min(until, Date.now() + 12000), 0); } catch (e) {} } /* (0.12.6) 목록이 그대로여도 아직 시장을 못 읽은 상품이 있으면 빠른 고리에서도 이어 읽음(다 읽었으면 바로 끝남) */
      await C('app_settings').doc('cloud').set({ lastConfirmAt, lastLoopAt: nowIso(), ok: true, err: null }, { merge: true }).catch(() => {}); // 신선함 신호 — 웹앱 '읽은 시각'이 15초마다
    } catch (e) { log('빠른 읽기 실패', e.message); if (e.pageTimeout || pageBroken || isClosed(e)) { try { p = await getPage(); continue; } catch (e2) {} } break; } }
  return { cr, rd, n, loops, changed }; }

/* ══════════ (0.13.0) 📦 출고 시각 알림 (app_settings/ship_notify) ══════════
 *  설정: { on, at:'HH:MM'|null(=그날 출고 마감), devices:[웹앱 기기 이름](비우면 등록한 기기 모두), pcOpen:[수집기 PC], sticky, weekend, test }
 *  기기 등록: 웹앱이 app_settings/push_subs.subs[기기] = { sub(웹 푸시 구독), at } · 열쇠: app_secrets/push(비공개) — 공개 열쇠만 app_settings/push_pub
 *  순서: 출고 시각이 되면(영업일 · 하루 한 번) ① 발송 요청을 지금 다시 읽고 ② planConfirm(공용 출고 파일 — 웹앱 '출고 확정'과 같은 기준)
 *        ③ 정밀 검토: 주문 기록(crm_orders)의 취소·반품 줄은 뺌 · 주문 기록이 없으면 알림에 적음 · 최근 14일 다른 날 확정에 이미 있는 주문은 뺌(그날 그대로)
 *        ④ shp_days/오늘 = source 'auto'로 확정(사람이 이미 '출고 확정'·고침 했으면 그것을 그대로 씀) ⑤ 기기마다 웹 푸시 ⑥ 결과를 ship_notify.last에 */
let webpush = null; try { webpush = require('web-push'); } catch (e) { log('web-push 모듈 없음 — 출고 알림을 못 보냄', e.message); }
let pushK = null;
async function pushKeys() { if (pushK) return pushK; const r = C('app_secrets').doc('push'); let d = (await r.get()).data(); if (!d || !d.publicKey || !d.privateKey) { if (!webpush) return null; const k = webpush.generateVAPIDKeys(); d = { publicKey: k.publicKey, privateKey: k.privateKey, at: nowIso() }; await r.set(d); }
  await C('app_settings').doc('push_pub').set({ publicKey: d.publicKey, at: nowIso() }, { merge: true }); webpush.setVapidDetails('mailto:jerrycson@gmail.com', d.publicKey, d.privateKey); pushK = d; return d; }
let shipCoreC = null, shipCoreT = null;
function shipCoreNode() { const t = coreGood['readnow-shipping-core.js']; if (!t) return null; if (shipCoreC && shipCoreT === t) return shipCoreC; const m = { exports: {} }; try { vm.runInNewContext(t, { module: m, exports: m.exports, console, Date, JSON, Math, Intl, globalThis: {} }, { filename: 'readnow-shipping-core.js', timeout: 3000 }); } catch (e) { log('출고 공용 파일을 노드에서 못 엶', e.message); return null; } shipCoreC = m.exports; shipCoreT = t; return shipCoreC; }
const wonT = (n) => Math.round(+n || 0).toLocaleString('ko-KR') + '원';
/* (0.13.3) 받는 기기 = 웹앱에서 '이 기기에서 알림 받기'로 등록한 기기 모두(관리자 설정 아님) · 기기마다 종류(kind: ship 출고 · logger 로거)를 끌 수 있음(subs[이름].kinds[kind] === false) · names를 주면 그 안에서만 */
async function pushSend(names, payload, kind) { const K = await pushKeys(); if (!K) return { err: '열쇠 없음' }; const D = (await C('app_settings').doc('push_subs').get()).data() || {}; const subs = D.subs || {}; const list = (names && names.length ? names : Object.keys(subs)).filter((n) => subs[n] && subs[n].sub && !(kind && subs[n].kinds && subs[n].kinds[kind] === false)); const res = {};
  for (const n of list) { try { await webpush.sendNotification(subs[n].sub, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'high' }); res[n] = 'ok'; } catch (e) { res[n] = `실패 ${e.statusCode || ''} ${String(e.body || e.message || '').slice(0, 80)}`; if (e.statusCode === 404 || e.statusCode === 410) await C('app_settings').doc('push_subs').set({ subs: { [n]: { gone: nowIso(), sub: FV.delete() } } }, { merge: true }).catch(() => {}); } } /* (0.13.2 자동 점검) 끊긴 구독은 sub를 지움 — 예전엔 sub가 남아 매번 그 기기에 다시 보냄 */
  return res; }
async function shipNotifyTick(p) { if (!webpush) return null; const ref = C('app_settings').doc('ship_notify'); const cfg = (await ref.get()).data() || {}; await pushKeys().catch((e) => log('푸시 열쇠', e.message));
  const now = Date.now(); const day = kstDay(now); const k = new Date(now + 9 * 3600e3); const minNow = k.getUTCHours() * 60 + k.getUTCMinutes();
  /* 시험 보내기 */ if (cfg.test && (!cfg.testDone || cfg.test > cfg.testDone)) { const r = await pushSend(null, { title: '🔔 리드나우 출고 알림 시험', body: '이 기기에 출고 알림이 옵니다 — 누르면 웹앱 오늘 출고(발송 요청)', tag: 'rn-test', url: './?go=deliv' }); await ref.set({ testDone: cfg.test, testRes: r }, { merge: true }); }
  if (!cfg.on || cfg.sentDay === day) return null;
  if (cfg.lastErr && cfg.lastErr.day === day && now - Date.parse(cfg.lastErr.at || 0) < 15 * 60e3) return null; /* (0.13.2 자동 점검) 실패하면 15분 뒤에 다시 — 예전엔 3시간 동안 1분마다 발송 요청·주문 기록을 다시 읽었음 */
  const main = (await C('app_settings').doc('main').get()).data() || {}; const ship = main.ship || {}; const SHC = shipCoreNode(); if (!SHC || !SHC.planConfirm) return { err: '출고 공용 파일 0.6.0을 못 읽음' };
  const biz = SHC.isBizDay(new Date(now), ship.holidays || [], ship.pickup || {}); if (!biz && !cfg.weekend) return null;
  const at = /^\d\d:\d\d$/.test(cfg.at || '') ? cfg.at : (ship.dayCut || {})[day] || ship.cutTime || '14:00'; const atMin = +at.slice(0, 2) * 60 + +at.slice(3, 5); if (minNow < atMin || minNow > atMin + 180) return null; /* 시각이 지난 뒤 3시간 안에서만(늦은 날 밤에 엉뚱하게 보내지 않게) */
  let mine = false; await db.runTransaction(async (tx) => { const s0 = (await tx.get(ref)).data() || {}; if (s0.sentDay === day || (s0.busy && now - Date.parse(s0.busy) < 5 * 60e3)) return; tx.set(ref, { busy: nowIso() }, { merge: true }); mine = true; }); if (!mine) return null;
  const warn = []; try {
    try { if (!lastDelivAt || now - lastDelivAt > 90e3) await shipRead(p, Date.now() + 25000); } catch (e) { warn.push('발송 요청을 새로 못 읽어 마지막으로 읽은 목록으로(' + e.message + ')'); }
    const cur = (await C('shp_state').doc('current').get()).data() || { orders: [] }; const plan = (await C('shp_plan').doc(day).get()).data() || {};
    const from14 = kstDay(now - 14 * 864e5); const carry = {}; const qp = await C('shp_plan').where('day', '>=', from14).get(); qp.forEach((d) => { const v = d.data(); if (!v.day || v.day >= day) return; for (const [ono, to] of Object.entries(v.moveTo || {})) if (to && to > day) carry[ono] = to; });
    const R = SHC.planConfirm({ orders: cur.orders || [], plan, carry }); const ents = R.ents.map((e) => ({ ...e, ex: [...(e.ex || [])] }));
    /* 정밀 검토 */ const dup = new Map(); const held = new Map(); const qd = await C('shp_days').where('day', '>=', from14).get(); qd.forEach((d) => { const v = d.data(); if (d.id === day || v.void) return; (v.entries || []).forEach((x) => { if (x.hold || x.notCounted) held.set(x.orderNo, d.id); else dup.set(x.orderNo, d.id); }); }); /* (0.13.0) 보류(셈하지 않음)로 둔 주문은 겹침이 아님 — 오늘 나가면 오늘로 옮기고 보류에서 뺌 */
    const keep = []; for (const e of ents) { if (dup.has(e.orderNo)) { warn.push(`${e.orderNo} 이미 ${dup.get(e.orderNo)} 출고로 확정 — 오늘에서 뺌`); continue; } let od = null; try { od = (await C('crm_orders').doc(e.id).get()).data(); } catch (er) {}
      if (!od) warn.push(`${e.orderNo} 주문 기록이 아직 없음(발송 요청 목록으로만)`); else { const bad = (od.items || []).filter((it) => it.lineStatus && it.lineStatus !== 'normal').map((it) => it.title).filter(Boolean); if (bad.length) { e.ex = [...new Set([...e.ex, ...bad])]; warn.push(`${e.orderNo} 취소·반품 줄 ${bad.length}개 뺌`); } }
      const so = (cur.orders || []).find((x) => x.orderNo === e.orderNo); if (so && (so.items || []).length && so.items.every((it) => e.ex.includes(it.title))) { warn.push(`${e.orderNo} 남은 상품 없음 — 뺌`); continue; } keep.push(e); if (held.has(e.orderNo)) warn.push(`${e.orderNo} ${held.get(e.orderNo)}에 보류였던 주문 — 오늘 출고로 옮김`); }
    const dref = C('shp_days').doc(day); const ex = (await dref.get()).data(); const human = ex && (ex.source === 'confirm' || ex.source === 'edit'); const fin = human ? ex.entries || [] : keep;
    let items = 0, total = 0; fin.filter((e) => !e.notCounted).forEach((e) => { const so = (cur.orders || []).find((x) => x.orderNo === e.orderNo); (so ? so.items : []).forEach((it) => { if ((e.ex || []).includes(it.title)) return; items += +it.qty || 1; total += (+it.price || 0) * (+it.qty || 1); }); });
    if (false) await dref.set({ day, entries: fin, source: 'auto', confirmedAt: nowIso(), by: 'cloud (출고 알림)', orderCount: fin.length, itemCount: items, total, readAt: cur.at || null, check: warn.slice(0, 40), writerSchema: 6, history: FV.arrayUnion({ at: nowIso(), by: 'cloud', what: `출고 시각 자동 확정 ${fin.length}건${warn.length ? ` · 확인 ${warn.length}` : ''}` }), uploadedAt: FV.serverTimestamp() }, { merge: true });
    /* (0.14.0) 사장님 10/16: 출고별 매출은 발송 요청 목록이 아니라 ③ 배송&구매확정전으로 실제 옮겨 온 주문 — 여기서는 확정하지 않음(알림만 · 확정은 shipTabRead) */ if (false) for (const e of fin) { const hd = held.get(e.orderNo); if (!hd) continue; try { const r = C('shp_days').doc(hd); const v = (await r.get()).data() || {}; await r.set({ entries: (v.entries || []).filter((x) => x.orderNo !== e.orderNo), history: FV.arrayUnion({ at: nowIso(), by: 'cloud', what: `보류였던 ${e.orderNo} → ${day} 출고로 옮겨 감` }), uploadedAt: FV.serverTimestamp() }, { merge: true }); } catch (er) {} }
    const nOut = fin.filter((e) => !e.notCounted).length;
    const payload = { title: `📦 오늘 출고 예정 ${nOut}건 · ${items}권 · ${wonT(total)}`, body: (human ? '사람이 확정한 목록' : '발송 요청 기준 출고 예정 — 출고별 매출은 송장을 넣어 배송&구매확정전으로 옮겨 온 것으로 셈') + (warn.length ? ` · ⚠ 확인 ${warn.length}건: ${warn.slice(0, 2).join(' / ')}` : ' · 눌러서 발송 요청 목록'), tag: 'rn-ship-' + day, url: './?go=deliv', sticky: !!cfg.sticky };
    const go = nOut > 0 || !!cfg.empty; const sent = go ? await pushSend(null, payload, 'ship') : {};
    await ref.set({ sentDay: day, busy: null, last: { day, at: nowIso(), n: nOut, items, total, warn: warn.slice(0, 40), human: !!human, sent, pcOpen: go ? cfg.pcOpen || [] : [], title: payload.title, body: payload.body } }, { merge: true });
    log('출고 알림', day, nOut, '건', JSON.stringify(sent)); return { n: nOut, sent };
  } catch (e) { await ref.set({ busy: null, lastErr: { at: nowIso(), day, msg: e.message } }, { merge: true }).catch(() => {}); log('출고 알림 실패', e.message); return { err: e.message }; } }
/* ══════════ (0.14.0) 📦 출고별 매출 = ③ 배송&구매확정전으로 옮겨 온 주문 (사장님 10/16)
 *  그날 출고별 매출 = 어제 마지막으로 옮겨 온 주문(A) 다음(B)부터 오늘 마지막(C)까지 = 배송&구매확정전 화면에서 발송일이 그날인 주문(맨 위가 가장 최근)
 *  5분마다(07~24시 · 발송 요청 건수가 줄면 바로) 첫 쪽부터 읽어 '최근 10일보다 앞선 발송일'이 나오면 그만 → shp_days/{발송일} = source 'tab'(출고별 매출 표에서 사람이 고친 날(edit)만 그대로 · '출고 확정'한 날은 탭 기준으로 바꾸고 그 목록은 prevConfirm에 · 예전 자동 확정은 oldAuto에 보관 · 탭에서 본 주문은 tabEntries에도 두어 확정으로 덮여도 이어 합침 — 자동 점검 2026-10-16)
 *  주문 기록(crm_orders)이 아직 없어도 셀 수 있게 줄마다 상품(제목·수량·값)을 함께 둠 · 위(A)·맨 위(C) 주문번호도 남김(확인용) */
let lastTabAt = 0, lastTabDeliv = null;
async function shipTabRead(p, force) { const now = Date.now(); const k = new Date(now + 9 * 3600e3); const h = k.getUTCHours(); const day = kstDay(now);
  if (!force && h < 7) return null; /* (자동 점검 2026-10-16) 밤에는 shp_state도 읽지 않음(매 분 1읽기) */ const cur = (await C('shp_state').doc('current').get().catch(() => null)); const dv = cur && cur.exists ? ((cur.data().tabCounts || {})['발송 요청']) : null; const drop = lastTabDeliv != null && dv != null && dv < lastTabDeliv; if (dv != null) lastTabDeliv = dv;
  if (!force && !drop && (h < 7 || now - lastTabAt < 5 * 60e3)) return null; lastTabAt = now; const from = kstDay(now - 10 * 864e5);
  const R = await p.evaluate(async (td, from) => { const SH = window.ReadnowShipping; if (!SH || !SH.parseShippedPage) return { err: '출고 공용 파일 0.7.0이 아님' }; const all = []; let tabCounts = null, last = 1;
    for (let pg = 1; pg <= Math.min(last, 8); pg++) { const r = await fetch('/scm/worder_delivery_complete.aspx?page=' + pg + '&keywordType=0&keyword=&orderstep=5', { credentials: 'include', cache: 'no-store' }); if (/\/login\/|wlogin/i.test(r.url)) return { login: false }; const d = new DOMParser().parseFromString(await r.text(), 'text/html'); const x = SH.parseShippedPage(d, td); if (pg === 1) { tabCounts = x.tabCounts; last = x.lastPage; } x.orders.forEach((o) => all.push({ ...o, pos: all.length })); if (!x.orders.length || x.orders.some((o) => o.shipDay && o.shipDay < from)) break; }
    return { login: true, orders: all.map((o) => ({ orderNo: o.orderNo, shipDay: o.shipDay, pos: o.pos, orderedAt: o.orderedAt, buyer: o.buyer, items: o.items.map((i) => ({ title: i.title, qty: i.qty, price: i.price, listingId: i.listingId, sku: i.sku })) })), tabCounts }; }, day, from);
  if (R.err) return { err: R.err }; if (!R.login) throw Object.assign(new Error('로그인 풀림'), { relogin: true });
  const byDay = new Map(); for (const o of R.orders) { if (!o.shipDay || o.shipDay < from) continue; (byDay.get(o.shipDay) || byDay.set(o.shipDay, []).get(o.shipDay)).push(o); }
  const days = [...byDay.keys()].sort(); let w = 0;
  for (const d of days) { const L = byDay.get(d); const ref = C('shp_days').doc(d); const ex = (await ref.get()).data(); if (ex && ex.source === 'edit' && !ex.void) continue; /* 출고별 매출 표에서 사람이 직접 고친 날만 그대로 · 오늘 출고 화면 '출고 확정'(발송 요청 목록 기준)은 탭 기준으로 바꾸되 그 목록은 prevConfirm에 남김 */
    /* 고객이 수령확인하면 주문이 다음 탭(구매확정&정산대기)으로 빠지므로, 이미 적은 주문은 지우지 않고 새로 보인 주문만 더함(합집합) */
    const old = ex && ex.source === 'tab' ? ex.entries || [] : (ex && Array.isArray(ex.tabEntries) ? ex.tabEntries : []); /* (자동 점검 2026-10-16) 웹앱 '출고 확정'이 entries를 덮은 날도 앞서 탭에서 본 주문(tabEntries)부터 이어 합침 — 그사이 수령확인으로 탭에서 빠진 주문이 그날 매출에서 사라지던 것 */ const have = new Set(old.map((e) => e.orderNo)); const add = L.filter((o) => !have.has(o.orderNo)).map((o) => ({ id: 'aladin_' + o.orderNo, orderNo: o.orderNo, ex: [], pos: o.pos, items: o.items, orderedAt: o.orderedAt || null, seenAt: nowIso() }));
    if (ex && ex.source === 'tab' && !add.length && Array.isArray(ex.tabEntries)) continue; const ents = [...add, ...old]; const sig = ents.map((e) => e.orderNo).join(','); const prev = R.orders.find((o) => o.shipDay && o.shipDay < d); const top = L[0];
    let items = 0, total = 0; ents.forEach((o) => (o.items || []).forEach((i) => { items += +i.qty || 1; total += (+i.price || 0) * (+i.qty || 1); }));
    await ref.set({ day: d, entries: ents, tabEntries: ents, source: 'tab', sig, orderCount: ents.length, itemCount: items, total, top: top ? top.orderNo : (ex && ex.top) || null, prevLast: prev ? prev.orderNo : (ex && ex.prevLast) || null, readAt: nowIso(), by: 'cloud (배송&구매확정전)', writerSchema: 7, ...(ex && ex.source === 'auto' ? { oldAuto: { entries: ex.entries || [], orderCount: ex.orderCount || null, total: ex.total || null, confirmedAt: ex.confirmedAt || null } } /* (자동 점검 2026-10-16) 예전 자동 확정 목록도 지우지 않고 보관 */ : {}), ...(ex && ex.source === 'confirm' ? { prevConfirm: { entries: ex.entries || [], by: ex.by || null, confirmedAt: ex.confirmedAt || null, orderCount: ex.orderCount || null, total: ex.total || null } } : {}), history: FV.arrayUnion({ at: nowIso(), by: 'cloud', what: `배송&구매확정전 발송일 ${d} — 새로 ${add.length}건 · 모두 ${ents.length}건 ${items}권` }), uploadedAt: FV.serverTimestamp() }, { merge: true }); w++; }
  await C('app_settings').doc('cloud').set({ lastTabAt: nowIso(), lastTab: { n: R.orders.length, days: days.length, wrote: w, tab: (R.tabCounts || {})['배송&구매확정전'] ?? null } }, { merge: true }).catch(() => {});
  return { n: R.orders.length, days: days.length, wrote: w }; }
/* ══════════ (0.15.0) 📰 출판 정보 게시판 (KPIPA) — 사장님 10/16: 글과 첨부(PDF)를 받아 본문과 함께 요약
 *  출처: ① 조사연구보고서(www.kpipa.or.kr/p/g3_1) ② KPIPA 출판 보고서(g3_2) ③ 글로벌출판동향(g3_5) ④ 출판전산망 알림판(bnk.kpipa.or.kr — 공지·판매데이터 리포트·자료실·소식지·인터뷰) ⑤ 출판산업 Q&A(e.kpipa.or.kr)
 *  저장: mkt_kpipa_posts/{출처}_{글번호} = { src, id, title, date, views, cat, author, url, body(글자), imgs[], atts:[{name, url, ext, size, pick, why, path(저장소), pages, chars, isbns}], text(첨부 글자 앞부분), sumState('need'|'done'), sum{...} }
 *        첨부 원본·전체 글자 = Firebase 저장소 kpipa/{출처}/{글번호}/… · 한 번 받은 글은 다시 쓰지 않음(조회수만 바뀌면 views만)
 *  같은 내용 첨부(이름이 확장자만 다름 · 단면/펼침면): 더 보편적인 것 하나만 받음 — pdf > hwpx > hwp > 그 밖 · 단면 > 펼침면 (사장님 10/16)
 *  요약: 클라우드에는 언어 모델이 없으므로 Claude 예약 작업이 sumState 'need'인 글을 읽어 요약을 써서 /kp-in으로 넣음(암호화 · 공개 저장소에는 평문이 남지 않음)
 *  이어 하기: app_settings/kpb { cur:{src, page}, done:{src: true}, at } — 처음엔 모든 쪽, 그 뒤엔 첫 쪽부터 이미 받은 글이 나오면 그만 */
const crypto = require('crypto');
const KPB_UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', 'accept-language': 'ko-KR,ko;q=0.9' };
const kpbEnt = (s) => String(s || '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&middot;/g, '·').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
const kpbTxt = (h) => kpbEnt(String(h || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h\d)>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const kpbNum = (s) => { const n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10); return isNaN(n) ? null : n; };
const KPB_SRC = {
  g3_1: { name: '조사연구보고서', site: 'https://www.kpipa.or.kr', kind: 'gnu', board: 'g3_1' },
  g3_2: { name: 'KPIPA 출판 보고서', site: 'https://www.kpipa.or.kr', kind: 'gnu', board: 'g3_2' },
  g3_5: { name: '글로벌출판동향', site: 'https://www.kpipa.or.kr', kind: 'gnu', board: 'g3_5' },
  bnk: { name: '출판전산망 알림판', site: 'https://bnk.kpipa.or.kr', kind: 'bnk' },
  qa: { name: '출판산업 Q&A', site: 'https://e.kpipa.or.kr', kind: 'qa' } };
const BNK_TYPE = { '00': '공지사항', '91': '판매데이터 리포트', '20': '자료실', '92': '소식지', '93': '인터뷰', '98': '기타' };
/* 목록 한 쪽 → [{id, title, date, views, cat, att}] · last = 마지막 쪽 번호(알면) */
function kpbParseList(src, h) { const S = KPB_SRC[src]; const out = []; let last = null;
  if (S.kind === 'gnu') { const re = new RegExp(`href=['"](?:https?://www\\.kpipa\\.or\\.kr)?/p/(?:${S.board}/(\\d+)(?:\\?[^'"]*)?|b/board\\.php\\?bo_table=${S.board}&(?:amp;)?wr_id=(\\d+)[^'"]*)['"][^>]*class=['"]list-subject['"][^>]*>([\\s\\S]*?)</a>`, 'g'); let m; const seen = new Set(); /* (0.15.2) ?page=N 쪽은 주소가 board.php?bo_table=…&wr_id=… 꼴 */
    while ((m = re.exec(h))) { const id = m[1] || m[2]; const t = kpbTxt(m[3]).replace(/\s+/g, ' ').trim(); if (!t || seen.has(id)) continue; seen.add(id); const tail = h.slice(m.index, m.index + 1500); const dm = tail.match(/class="fz-date">\s*([\d.]+)/); const hm = tail.match(/class="fz-hit">\s*([\d,]+)/); out.push({ id, title: t, date: dm ? kpbDate(dm[1]) : null, views: hm ? kpbNum(hm[1]) : null }); }
    for (const m2 of h.matchAll(/[?&]page=(\d+)/g)) last = Math.max(last || 1, +m2[1]); const tm = h.match(/전체 <strong>([\d,]+)<\/strong>건/); if (tm) last = Math.max(last || 1, Math.ceil(kpbNum(tm[1]) / 15)); }
  else if (S.kind === 'bnk') { const re = /fnBbsNoticeBoardDetailView\('(\d+)','(\d+)'\)[^>]*>([\s\S]*?)<\/a>/g; let m; const seen = new Set();
    while ((m = re.exec(h))) { const id = m[1]; if (seen.has(id)) continue; seen.add(id); const blk = m[3]; const t = kpbTxt((blk.match(/<dt>([\s\S]*?)<\/dt>/) || [])[1] || '').replace(/\s+/g, ' ').trim(); const dd = [...blk.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((x) => kpbTxt(x[1]).trim()).filter(Boolean); const date = dd.find((x) => /^\d{4}-\d\d-\d\d$/.test(x)) || null; const views = kpbNum(dd.find((x) => /^[\d,]+$/.test(x)));
      out.push({ id, title: t, date, views, cat: BNK_TYPE[m[2]] || m[2], att: /paperclip/.test(blk) }); }
    const tm = h.match(/총\s*<b>([\d,]+)<\/b>/); if (tm) last = Math.ceil(kpbNum(tm[1]) / 15); }
  else if (S.kind === 'qa') { const re = /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td class="title"><a[^>]*goView\((\d+),\s*\d+\)[^>]*>([\s\S]*?)<\/a><\/td>\s*<td[^>]*>([\d,]*)<\/td>/g; let m;
    while ((m = re.exec(h))) out.push({ id: m[3], no: +m[1], title: kpbTxt(m[4]).replace(/\s+/g, ' ').trim(), cat: kpbTxt(m[2]).trim(), views: kpbNum(m[5]) });
    for (const m2 of h.matchAll(/goListPage\((\d+)\)/g)) last = Math.max(last || 1, +m2[1]); }
  return { rows: out, last }; }
function kpbDate(s) { const m = String(s || '').match(/(\d{2,4})[.-](\d{1,2})[.-](\d{1,2})/); if (!m) return null; const y = m[1].length === 2 ? '20' + m[1] : m[1]; return `${y}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; }
/* 글 하나 → { title, date, views, author, body, imgs, atts:[{name,url,size}] } */
function kpbParseView(src, h) { const S = KPB_SRC[src]; const o = { atts: [], imgs: [] }; const abs = (u) => /^https?:/i.test(u) ? u : S.site + (u.startsWith('/') ? '' : '/') + u;
  if (S.kind === 'gnu') { o.title = kpbTxt((h.match(/<span class="bo-v-tit">([\s\S]*?)<\/span>/) || [])[1] || ''); o.author = kpbTxt((h.match(/<span class="sv_member">([\s\S]*?)<\/span>/) || [])[1] || '') || null; o.views = kpbNum(kpbTxt((h.match(/class="article-hit">([\s\S]*?)<\/strong>/) || [])[1] || '').replace('조회', '')); o.date = kpbDate(kpbTxt((h.match(/class="article-date">([\s\S]*?)<\/strong>/) || [])[1] || '').replace('작성일', ''));
    const bm = h.match(/<div id="bo_v_con"[^>]*>([\s\S]*?)<\/div>\s*<!-- \} 본문 내용 끝/); const bh = bm ? bm[1] : ''; o.body = kpbTxt(bh); o.imgs = [...bh.matchAll(/<img[^>]+src="([^"]+)"/g)].map((x) => abs(x[1]));
    for (const m of h.matchAll(/<a href="([^"]+\/p\/download\/[^"]+)"[^>]*class="view_file_download"[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*\(([^)]*)\)/g)) o.atts.push({ name: kpbTxt(m[2]).trim(), url: abs(m[1]), size: m[3].trim() }); }
  else if (S.kind === 'bnk') { o.title = kpbTxt((h.match(/<header class="board-header">\s*<h4>([\s\S]*?)<\/h4>/) || [])[1] || ''); o.date = (h.match(/<div class="date">\s*(\d{4}-\d\d-\d\d)/) || [])[1] || null;
    const bm = h.match(/<div class="board-content">([\s\S]*?)<\/div>\s*<\/div>\s*(?:<div class="board-attach"|<\/article|<div class="board-footer")/); const bh = bm ? bm[1] : ''; o.body = kpbTxt(bh); o.imgs = [...bh.matchAll(/<img[^>]+src="([^"]+)"/g)].map((x) => abs(x[1]));
    for (const m of h.matchAll(/fnFileDownload\('([^']+)','([^']+)'\)/g)) { if (o.atts.some((a) => a.path0 === m[1])) continue; o.atts.push({ name: kpbEnt(m[2]).trim(), url: S.site + '/home/v3/fileDownload?file_url=' + m[1] + '&file_nm=' + encodeURIComponent(kpbEnt(m[2]).trim()), direct: S.site + m[1], path0: m[1] }); } }
  else if (S.kind === 'qa') { const cell = (lab) => { const m = h.match(new RegExp(`<th[^>]*>\\s*${lab}\\s*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`)); return m ? kpbTxt(m[1]).trim() : null; }; o.title = cell('질문'); o.cat = cell('카테고리'); o.views = kpbNum(cell('조회수'));
    const bm = h.match(/<td colspan="4"[^>]*class="bd01tdC"[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/); o.body = kpbTxt(bm ? bm[1] : ''); }
  return o; }
/* 같은 내용 첨부는 하나만: 이름에서 확장자·(단면|펼침면|펼침) 표시를 뗀 것이 같으면 한 무리 → pdf > hwpx > hwp > docx > xlsx > 그 밖 · 단면 > 펼침면 */
const KPB_EXT_RANK = { pdf: 0, hwpx: 1, hwp: 2, docx: 3, doc: 4, xlsx: 5, xls: 6, pptx: 7, zip: 8 };
function kpbPick(atts) { const key = (n) => String(n || '').replace(/\.[a-z0-9]+$/i, '').replace(/[\s_\-()]*(단면|펼침면|펼침|양면|낱장)[\s)]*$/u, '').replace(/\s+/g, '').toLowerCase(); const ext = (n) => (String(n || '').match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
  const G = new Map(); atts.forEach((a, i) => { a.ext = ext(a.name); const k = key(a.name); (G.get(k) || G.set(k, []).get(k)).push(i); });
  for (const [, ix] of G) { const L = ix.map((i) => atts[i]).sort((a, b) => (KPB_EXT_RANK[a.ext] ?? 9) - (KPB_EXT_RANK[b.ext] ?? 9) || (/펼침/.test(a.name) ? 1 : 0) - (/펼침/.test(b.name) ? 1 : 0)); L.forEach((a, j) => { a.pick = j === 0; a.why = j === 0 ? (L.length > 1 ? `같은 내용 ${L.length}개 중 보편적인 것(${a.ext}${/단면/.test(a.name) ? '·단면' : ''})` : '') : `같은 내용 — '${L[0].name}'만 받음`; }); }
  return atts; }
/* (0.15.3) 출판전산망(bnk) 목록 쪽 넘기기 = 그 화면의 보안 토큰(m_sCsrf)·세션 쿠키와 함께 POST — 15분마다 새로 */
let kpbJar = { c: '', tok: null, at: 0 };
async function kpbBnkSess(force) { if (!force && kpbJar.tok && Date.now() - kpbJar.at < 15 * 60e3) return kpbJar; const r = await fetch('https://bnk.kpipa.or.kr/home/v3/helpdesk/hlpBbsNoticeBoardList', { headers: KPB_UA, signal: AbortSignal.timeout(60000) }); const t = await r.text(); const ck = (typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : [r.headers.get('set-cookie') || '']).filter(Boolean).map((x) => x.split(';')[0]).join('; '); kpbJar = { c: ck, tok: (t.match(/m_sCsrf\s*=\s*"([^"]+)"/) || [])[1] || null, at: Date.now() }; return kpbJar; }
async function kpbGet(u, opt) { const o = opt || {}; let jar = null; if (o.post && /bnk\.kpipa/.test(u)) { jar = await kpbBnkSess(); o.post = o.post + (jar.tok ? '&_csrf=' + encodeURIComponent(jar.tok) : ''); } const r = await fetch(u, { method: o.post ? 'POST' : 'GET', body: o.post || undefined, headers: { ...KPB_UA, ...(o.post ? { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}), ...(o.ref ? { referer: o.ref } : {}), ...(jar ? { cookie: jar.c, 'X-CSRF-TOKEN': jar.tok || '', referer: 'https://bnk.kpipa.or.kr/home/v3/helpdesk/hlpBbsNoticeBoardList', origin: 'https://bnk.kpipa.or.kr' } : {}) }, redirect: 'follow', signal: AbortSignal.timeout(o.ms || 60000) }); if (!r.ok) throw new Error(`HTTP ${r.status} ${u.slice(0, 80)}`); return o.bin ? { buf: Buffer.from(await r.arrayBuffer()), ct: r.headers.get('content-type') || '', cd: r.headers.get('content-disposition') || '' } : await r.text(); }
function kpbListUrl(src, page) { const S = KPB_SRC[src]; if (S.kind === 'gnu') return { u: `${S.site}/p/${S.board}?page=${page}` }; if (S.kind === 'bnk') return { u: `${S.site}/home/v3/helpdesk/hlpBbsNoticeBoardList`, post: `tabIdx=&cPostType=&txtSearchText=&pageIndex=${page}&recordCountPerPage=15` }; return { u: `${S.site}/consult/onlinefaqConsultList.do?board_id=10&search_cond=&search_text=&pageInfo.page=${page}` }; }
function kpbViewUrl(src, id) { const S = KPB_SRC[src]; if (S.kind === 'gnu') return `${S.site}/p/${S.board}/${id}`; if (S.kind === 'bnk') return `${S.site}/home/v3/helpdesk/hlpBbsNoticeBoardDetailView/seq_${id}`; return `${S.site}/consult/onlinefaqConsultView.do?board_id=10&article_id=${id}&type_id=1`; }
let pdfParse = null; try { pdfParse = require('pdf-parse/lib/pdf-parse.js'); } catch (e) { log('pdf-parse 없음 — PDF 글자를 못 꺼냄', e.message); }
const kpbIsbns = (t) => [...new Set((String(t || '').match(/97[89]\d{10}/g) || []))];
/* 글 하나를 받아 저장(첨부 포함) — 이미 있으면 조회수만 */
async function kpbOne(src, row, until) { const ref = C('mkt_kpipa_posts').doc(`${src}_${row.id}`); const ex = (await ref.get()).data();
  if (ex && ex.fetchedAt && !ex.attPending) { if (row.views != null && row.views !== ex.views) await ref.set({ views: row.views, viewsAt: nowIso() }, { merge: true }); return 'have'; }
  const url = kpbViewUrl(src, row.id); const h = await kpbGet(url); const v = kpbParseView(src, h); const atts = kpbPick(v.atts || []); const { getStorage } = require('firebase-admin/storage'); const B = getStorage().bucket(BUCKET);
  let texts = []; let pending = false;
  for (const a of atts) { if (!a.pick) continue; if (until && Date.now() > until) { pending = true; break; } const old = ex && (ex.atts || []).find((x) => x.name === a.name && x.path); if (old) { Object.assign(a, { path: old.path, pages: old.pages, chars: old.chars, isbns: old.isbns, bytes: old.bytes }); continue; }
    try { const f = await kpbGet(a.direct || a.url, { bin: true, ref: url, ms: 120000 }); const safe = a.name.replace(/[\\/:*?"<>|#%]+/g, '_').slice(0, 120); const path = `kpipa/${src}/${row.id}/${safe}`; await B.file(path).save(f.buf, { contentType: a.ext === 'pdf' ? 'application/pdf' : f.ct || 'application/octet-stream', resumable: false }); a.path = path; a.bytes = f.buf.length;
      if (a.ext === 'pdf' && pdfParse) { try { const d = await pdfParse(f.buf); a.pages = d.numpages; const tx = String(d.text || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n'); a.chars = tx.length; a.isbns = kpbIsbns(tx).slice(0, 2000); await B.file(path + '.txt').save(Buffer.from(tx, 'utf8'), { contentType: 'text/plain; charset=utf-8', resumable: false }); texts.push(`[${a.name}]\n` + tx.slice(0, 120000)); } catch (e) { a.err = 'PDF 글자 못 꺼냄: ' + e.message.slice(0, 80); } } }
    catch (e) { a.err = e.message.slice(0, 120); pending = true; } }
  atts.forEach((a) => { delete a.path0; }); const S = KPB_SRC[src];
  const doc = { src, srcName: S.name, id: String(row.id), title: v.title || row.title || null, date: v.date || row.date || null, views: v.views ?? row.views ?? null, cat: v.cat || row.cat || null, author: v.author || null, url, body: String(v.body || '').slice(0, 60000), bodyChars: String(v.body || '').length, imgs: (v.imgs || []).slice(0, 20), atts, textChars: texts.join('').length, isbns: [...new Set(atts.flatMap((a) => a.isbns || []))].slice(0, 2000), attPending: pending, fetchedAt: ex && ex.fetchedAt ? ex.fetchedAt : nowIso(), lastFetchAt: nowIso(), sumState: ex && ex.sumState === 'done' ? 'done' : 'need', uploadedAt: FV.serverTimestamp() };
  await ref.set(doc, { merge: true }); return 'new'; }
/* 한 회차: 출처마다 목록을 읽어 새 글을 받음 · 처음엔 끝 쪽까지(이어 하기) · 그 뒤엔 첫 쪽에서 이미 받은 글만 나오면 그 출처는 끝 */
async function kpbTick(budgetMs) { const t0 = Date.now(); const until = t0 + (budgetMs || 150e3); const ref = C('app_settings').doc('kpb'); const st = (await ref.get()).data() || {}; const full = st.v === 4 ? st.full || {} : {}; /* (0.15.5) v4: 예전엔 merge 저장이라 옛 '다 받음'이 full 안에 남았음 → 한 번 더 처음부터 */ /* (0.15.3) 0.15.0~0.15.2는 목록을 못 읽은 출처를 '다 받음'으로 적었으므로 한 번 처음부터 */ const out = { n: 0, have: 0, err: [], by: {} };
  for (const src of Object.keys(KPB_SRC)) { if (Date.now() > until) break; let page = (full[src] && !full[src].done ? full[src].page : 1) || 1; let stop = false;
    for (let k = 0; k < 40 && !stop && Date.now() < until; k++) { let L; try { const q = kpbListUrl(src, page); L = kpbParseList(src, await kpbGet(q.u, { post: q.post })); } catch (e) { out.err.push(`${src} ${page}쪽: ${e.message.slice(0, 80)}`); break; }
      if (!L.rows.length) { if (L.last && page < L.last) { out.err.push(`${src} ${page}쪽: 글 줄을 못 찾음(화면 모양이 바뀜?)`); break; } full[src] = { page, done: true, at: nowIso(), last: L.last }; break; } let fresh = 0; /* 쪽이 더 있는데 줄이 없으면 '다 받음'으로 적지 않음 */
      for (const row of L.rows) { if (Date.now() > until) { stop = true; break; } try { const r = await kpbOne(src, row, until); if (r === 'new') { fresh++; out.n++; } else out.have++; } catch (e) { out.err.push(`${src}/${row.id}: ${e.message.slice(0, 80)}`); } await sleep(700); }
      out.by[src] = (out.by[src] || 0) + fresh; const backfill = !(full[src] && full[src].done);
      if (stop) { full[src] = { ...(full[src] || {}), page, done: false, at: nowIso() }; break; }
      if (!backfill && fresh === 0) break; /* 이미 다 받은 출처: 첫 쪽에 새 글이 없으면 끝 */
      if (L.last && page >= L.last) { full[src] = { page, done: true, at: nowIso(), last: L.last }; break; } page++; if (backfill) full[src] = { page, done: false, at: nowIso(), last: L.last }; } }
  const all = Object.keys(KPB_SRC).every((s) => full[s] && full[s].done); await ref.set({ v: 4, full, at: nowIso(), last: { ...out, ms: Date.now() - t0 }, backfillDone: all }, { mergeFields: ['v', 'full', 'at', 'last', 'backfillDone'] }); /* full은 통째로 바꿈(merge면 옛 출처 상태가 남음) */ return { ...out, ms: Date.now() - t0, backfillDone: all }; }

/* (0.16.2) 🔤 그림으로만 된 PDF 글자 읽기(구글 Vision OCR · 사장님 10/16 '그렇게 해') — pdf-parse로 쪽당 60자도 못 꺼낸 첨부만
 *  Vision files:annotate(PDF를 그대로 · 한 번에 5쪽) · 앞 20쪽까지(요약에 필요한 표지·요약·목차·본문 앞부분) · 9MB 넘는 PDF는 건너뜀(한 번에 보낼 수 있는 크기)
 *  원래 꺼낸 글(거의 빈 것)은 .pdftext.txt로 남기고(지우지 않음) OCR 글을 .txt에 · 첨부에 ocr {at, pages, chars} · 글은 다시 '요약 기다림'
 *  값: 한 달 1,000쪽까지 무료, 그 뒤 1,000쪽에 약 1.5달러 · Vision API가 꺼져 있으면 클라우드 계정으로 한 번 켜 봄(안 되면 app_settings/kpb_ocr에 까닭) */
let kpbOcrNextAt = 0;
async function visionPdf(tok, buf, pages) { const r = await fetch(`https://vision.googleapis.com/v1/files:annotate`, { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'content-type': 'application/json', 'x-goog-user-project': PROJECT }, body: JSON.stringify({ requests: [{ inputConfig: { content: buf.toString('base64'), mimeType: 'application/pdf' }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }], pages, imageContext: { languageHints: ['ko', 'en'] } }] }), signal: AbortSignal.timeout(170000) }); const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error((j.error && j.error.message) || 'HTTP ' + r.status); e.status = r.status; e.disabled = /SERVICE_DISABLED|has not been used|is disabled/i.test(JSON.stringify(j.error || {})); throw e; }
  const R = ((j.responses || [])[0] || {}).responses || []; return R.map((x, i) => ({ page: pages[i], text: (x.fullTextAnnotation && x.fullTextAnnotation.text) || '', err: x.error && x.error.message })); }
async function kpbOcrTick(budgetMs) { const t0 = Date.now(); const until = t0 + (budgetMs || 100e3); const sref = C('app_settings').doc('kpb_ocr'); const st = (await sref.get()).data() || {}; const out = { docs: 0, pages: 0, skip: 0, err: [] };
  if (st.offUntil && Date.now() < Date.parse(st.offUntil)) return { ...out, off: st.why || '쉬는 중' };
  const ss = await C('mkt_kpipa_posts').select('atts', 'sumState').get(); const need = []; ss.forEach((d) => { const A = (d.data() || {}).atts || []; A.forEach((a, i) => { if (a && a.ext === 'pdf' && a.path && a.pages && !a.ocr && !a.ocrSkip && (a.chars || 0) < a.pages * 60) need.push({ ref: d.ref, i }); }); });
  out.need = need.length; if (!need.length) { await sref.set({ at: nowIso(), last: out }, { merge: true }); return out; }
  const tok = await gToken(); const { getStorage } = require('firebase-admin/storage'); const B = getStorage().bucket(BUCKET);
  for (const n of need) { if (Date.now() > until) break; const d = (await n.ref.get()).data() || {}; const A = d.atts || []; const a = A[n.i]; if (!a || a.ocr) continue;
    try { const [buf] = await B.file(a.path).download(); if (buf.length > 9 * 1024 * 1024) { a.ocrSkip = `PDF가 ${Math.round(buf.length / 1048576)}MB라 한 번에 못 보냄(9MB까지)`; out.skip++; }
      else { const last = Math.min(a.pages, 20); const parts = []; for (let p = 1; p <= last && Date.now() < until; p += 5) { const pg = []; for (let k = p; k < p + 5 && k <= last; k++) pg.push(k); const R = await visionPdf(tok, buf, pg); R.forEach((x) => parts.push(`[${x.page}쪽]\n` + x.text)); out.pages += pg.length; }
        const tx = parts.join('\n\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n'); const f0 = B.file(a.path + '.txt'); try { const [ex0] = await f0.exists(); if (ex0) await f0.copy(B.file(a.path + '.pdftext.txt')); } catch (e) {}
        await f0.save(Buffer.from(tx, 'utf8'), { contentType: 'text/plain; charset=utf-8', resumable: false }); a.ocr = { at: nowIso(), pages: Math.ceil(parts.length), of: a.pages, chars: tx.length, by: 'vision' }; a.isbns = [...new Set([...(a.isbns || []), ...kpbIsbns(tx)])].slice(0, 2000); }
      const upd = { atts: A, ocrAt: nowIso(), isbns: [...new Set(A.flatMap((x) => x.isbns || []))].slice(0, 2000) }; if (a.ocr && a.ocr.chars > 200) { upd.sumState = 'need'; upd.sumWhy = d.sumState === 'done' ? '그림 PDF 글자를 새로 읽음 — 첨부까지 다시 요약' : null; } await n.ref.set(upd, { merge: true }); out.docs++; }
    catch (e) { if (e.disabled && !st.enTried) { try { const r = await fetch(`https://serviceusage.googleapis.com/v1/projects/${PROJECT}/services/vision.googleapis.com:enable`, { method: 'POST', headers: { Authorization: 'Bearer ' + tok } }); const j = await r.json().catch(() => ({})); await sref.set({ enTried: nowIso(), enRes: r.ok ? 'ok' : (j.error && j.error.message) || 'HTTP ' + r.status }, { merge: true }); st.enTried = 1; } catch (e2) {} await sref.set({ offUntil: new Date(Date.now() + 15 * 60e3).toISOString(), why: 'Vision API 켜는 중: ' + e.message.slice(0, 200) }, { merge: true }); out.err.push(e.message.slice(0, 160)); break; }
      out.err.push(`${n.ref.id}: ${e.message.slice(0, 120)}`); if (e.disabled || e.status === 403 || e.status === 429) { await sref.set({ offUntil: new Date(Date.now() + (e.status === 429 ? 60 : 360) * 60e3).toISOString(), why: e.message.slice(0, 300) }, { merge: true }); break; } } }
  await sref.set({ at: nowIso(), last: { ...out, ms: Date.now() - t0 } }, { merge: true }); return out; }
/* (0.15.0) 요약 넣는 길 /kp-in — Claude 예약 작업 → GitHub 자동 작업(diag/q.txt의 '@kpin 파일' 줄) → 여기 · 공개 저장소에는 암호문만
 *  열쇠: 클라우드가 처음 한 번 만든 RSA 쌍 — 개인 열쇠는 app_secrets/kpin(밖으로 안 나감) · 공개 열쇠는 app_settings/kpin_pub(진단 kpkey=1로 Claude가 받음)
 *  암호: openssl enc -aes-256-cbc -pbkdf2 -salt(비밀 글 = 임의 64자) · 그 비밀 글을 공개 열쇠로 RSA-OAEP(sha1) — 진단 결과와 같은 방식 */
async function kpinKey() { const r = C('app_secrets').doc('kpin'); let d = (await r.get()).data(); if (!d || !d.priv) { const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 3072, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } }); d = { priv: privateKey, pub: publicKey, at: nowIso() }; await r.set(d); await C('app_settings').doc('kpin_pub').set({ pub: publicKey, at: d.at }); } return d; }
function kpinOpen(d, kB64, eB64) { const pass = crypto.privateDecrypt({ key: d.priv, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' }, Buffer.from(kB64, 'base64')).toString('utf8').trim(); const E = Buffer.from(eB64, 'base64'); if (E.slice(0, 8).toString() !== 'Salted__') throw new Error('암호문 머리가 다름'); const salt = E.slice(8, 16); const kv = crypto.pbkdf2Sync(pass, salt, 10000, 48, 'sha256'); const dc = crypto.createDecipheriv('aes-256-cbc', kv.slice(0, 32), kv.slice(32)); return Buffer.concat([dc.update(E.slice(16)), dc.final()]).toString('utf8'); }
/* 요약 한 글: { id:'출처_번호', short:'한 줄', points:[핵심], biz:[우리 사업에 쓸 점], numbers:[{k,v}]?, tags:[] } — 고치지 않고 판(ver)으로 쌓음(sumHist) */
async function kpinApply(items, by) { let n = 0; const bad = []; for (const it of (items || []).slice(0, 400)) { const id = String(it && it.id || ''); if (!/^(g3_\d|bnk|qa)_\d+$/.test(id)) { bad.push(id); continue; } const ref = C('mkt_kpipa_posts').doc(id); const ex = (await ref.get()).data(); if (!ex) { bad.push(id + '(없음)'); continue; }
    const sum = { short: String(it.short || '').slice(0, 400), points: (it.points || []).map((x) => String(x).slice(0, 600)).slice(0, 12), biz: (it.biz || []).map((x) => String(x).slice(0, 600)).slice(0, 8), numbers: (it.numbers || []).slice(0, 20).map((x) => ({ k: String(x.k || '').slice(0, 80), v: String(x.v || '').slice(0, 120) })), tags: (it.tags || []).map((x) => String(x).slice(0, 30)).slice(0, 10), from: String(it.from || '').slice(0, 200), at: nowIso(), by: by || 'claude' };
    await ref.set({ sum, sumState: 'done', sumAt: sum.at, sumHist: FV.arrayUnion({ at: sum.at, short: sum.short }), uploadedAt: FV.serverTimestamp() }, { merge: true }); n++; } return { n, bad }; }
/* (0.13.1) 🌐 로거 지킴이 — 로거가 멈추거나 테더링이 끊기면 사람이 모르는 사이 수집이 서 버리므로, 5분마다 보고 오래가면 휴대폰·PC에 알림(웹 푸시 · 출고 알림에 등록한 기기)
 *  로거 = prd_jobs/pcBeat에서 pubOnly인 PC · ① 신호 15분 넘게 없음 → '로거 멈춤/꺼짐' ② 신호는 있는데 테더링 확인 안 됨(오늘 net 문서 helper.tetherOk=false)이 10분 넘게 → '테더링 끊김'
 *  같은 문제는 1시간에 한 번만 · 풀리면 '다시 정상' 한 번 · 상태는 app_settings/logger_watch(웹앱 홈 알림도 이것을 봄) */
async function loggerWatchTick() { if (!webpush) return null; const ref = C('app_settings').doc('logger_watch'); const W0 = (await ref.get()).data() || {}; const now = Date.now(); if (W0.checkedAt && now - Date.parse(W0.checkedAt) < 5 * 60e3) return null;
  const beats = ((await C('prd_jobs').doc('pcBeat').get()).data() || {}).pcs || {}; const AO = Array.isArray(W0.alwaysOn) ? W0.alwaysOn : ['HOME']; /* (0.16.2) 🖥 늘 켜 둘 PC(기본 HOME — 사장님 10/16) 도 신호를 지켜봄 · 웹앱에서 고름 */ const lg = Object.entries(beats).filter(([n, b]) => b && (b.pubOnly || AO.includes(n))); if (!lg.length) { await ref.set({ checkedAt: nowIso(), none: true }, { merge: true }); return null; }
  const day = kstDay(now); const net = ((await C('prd_jobs').doc('net_' + day).get()).data() || {}).pcs || {}; const st = { ...(W0.st || {}) }; const out = [];
  for (const [name, b] of lg) { const age = now - (b.atMs || 0); const n = net[name] || {}; const h = n.helper || null; const netAge = n.at ? now - Date.parse(n.at) : null;
    let prob = null; if (!b.pubOnly) { if (age > 10 * 60e3) prob = { k: 'down', msg: `🖥 ${name} 수집기가 ${Math.round(age / 60e3)}분째 신호 없음 — PC가 잠들었거나 꺼졌거나, 크롬이 수집기 탭을 멈췄을 수 있음(크롬 메모리 절약) · ${name}에서 알라딘 상품 조회 탭을 새로고침해 주세요` }; } else if (age > 15 * 60e3) prob = { k: 'down', msg: `🌐 로거(${name})가 ${Math.round(age / 60e3)}분째 신호 없음 — PC·공개 수집 크롬이 꺼졌거나 멈췄을 수 있음(로거 PC 확인)` };
    else if (b.gate && b.gate.ok === false) prob = { k: 'tether', msg: `📱 로거(${name}) 알라딘 길 막힘 — ${b.gate.why || '테더링 확인 안 됨'} · 휴대폰 USB 테더링·도우미(http://127.0.0.1:8899)를 확인해 주세요(그동안 알라딘 일은 안전하게 멈춤)` };
    else if (!b.gate && h && h.tetherOk === false && netAge != null && netAge < 15 * 60e3) prob = { k: 'tether', msg: `📱 로거(${name}) 테더링 끊김 — ${h.why || '테더링 확인 안 됨'} · 휴대폰 USB 테더링을 다시 켜 주세요(알라딘 일은 멈춤)` };
    const s0 = st[name] || {}; if (prob) { if (s0.k !== prob.k) { st[name] = { k: prob.k, since: nowIso(), sent: null, msg: prob.msg }; } else st[name] = { ...s0, msg: prob.msg }; const S1 = st[name]; const longEnough = now - Date.parse(S1.since) >= (prob.k === 'tether' ? 10 : 0) * 60e3; if (longEnough && (!S1.sent || now - Date.parse(S1.sent) > 3600e3)) { out.push({ name, title: !b.pubOnly ? `🖥 ${name} 수집기 멈춤` : prob.k === 'down' ? '🌐 로거 멈춤' : '📱 로거 알라딘 길 막힘', body: prob.msg }); S1.sent = nowIso(); } }
    else if (s0.k) { if (s0.sent) out.push({ name, title: !b.pubOnly ? `✓ ${name} 수집기 다시 정상` : '✓ 로거 다시 정상', body: `${b.pubOnly ? '로거' : 'PC'}(${name}) ${s0.k === 'down' ? '신호' : '알라딘 길(테더링)'} 돌아옴` }); st[name] = {}; } }
  const cfg = (await C('app_settings').doc('ship_notify').get()).data() || {}; const sent = [];
  for (const o of out) { try { sent.push(await pushSend(null, { title: o.title, body: o.body, tag: 'rn-logger-' + o.name, url: './', sticky: true }, 'logger')); } catch (e) { sent.push({ err: e.message }); } }
  await ref.set({ checkedAt: nowIso(), st, last: out.length ? { at: nowIso(), out, sent } : W0.last || null, none: false }, { merge: true }); return out.length ? out : null; }
async function tick(why) {
  const t0 = Date.now(); const out0 = {}; const J = await cjobs(); out0.jobs = J;
  if (!['confirm', 'cmds', 'ship', 'enrich', 'buy', 'fast'].some((k) => J[k])) { const out = { ok: true, err: null, why, idle: '알라딘 읽기 일을 모두 꺼 둠(설정 ☁ 클라우드가 하는 일)', jobs: J, tickMs: Date.now() - t0 }; try { const sn = await shipNotifyTick(null); if (sn) out.shipNotify = sn; } catch (e2) { out.shipNotify = { err: e2.message }; } try { const lw = await loggerWatchTick(); if (lw) out.loggerWatch = lw; } catch (e2) { out.loggerWatch = { err: e2.message }; } /* (0.13.2 자동 점검) 알라딘 읽기를 다 꺼 둬도 출고 알림·시험·로거 지킴이는 함(발송 요청은 마지막으로 읽은 목록으로) */ await beat(out); return out; } /* (0.12.0) 알라딘에 들어갈 일이 하나도 없으면 화면도 열지 않음 */
  if (J.cmds) watchCmds();
  try { let p = await getPage(); let cr = null; const errs = []; execMod().catch(() => {}); mlMod().catch(() => {}); /* (0.9.3) 늘 불러 판을 신호에 (함께 올린 파일이면 바로 돌아옴) */ // (0.9.1) 관리도구에 판이 '?'로 뜨지 않게 미리 읽음
    // (0.9.1) 맡긴 일(발송준비시작·판매중지 등 돈이 걸린 일) 먼저, 그리고 각 단계가 실패해도 다음 단계는 함 — 예전엔 주문 읽기가 실패하면 맡긴 일까지 그 회차를 통째로 건너뜀
    const step = async (name, fn) => { for (let a = 0; a < 2; a++) { try { const r = await fn(p); p = curPage(p); return r; } catch (e) { if (e.relogin && a === 0) { try { await login(p); continue; } catch (e2) { errs.push(`${name}: ${e2.message}`); return null; } } if ((e.pageTimeout || pageBroken || isClosed(e)) && a === 0) { try { p = await getPage(); continue; } catch (e2) { errs.push(`${name}: ${e2.message}`); return null; } } errs.push(`${name}: ${String(e.message || e).slice(0, 160)}`); return null; } } return null; };
    const steps = {}; const tm = async (k, fn) => { const ts = Date.now(); try { return await fn(); } finally { steps[k] = (steps[k] || 0) + (Date.now() - ts); } }; out0.steps = steps; /* (0.12.9) 단계마다 걸린 시간 — 웹앱 출고 '읽는 중' 옆·관리도구에 보임(어디서 1분을 넘는지) */
    if (J.confirm) cr = await tm('confirm', () => step('주문확인요청', confirmRead)); else if (!(await loggedIn(p).catch(() => false))) await login(p); // 로그인 확인을 겸함 (풀렸으면 여기서 다시 로그인)
    if (cr) await C('app_settings').doc('cloud').set({ lastConfirmAt, lastConfirmStep: nowIso() }, { merge: true }).catch(() => {}); /* (0.12.9) 읽자마자 '읽은 시각' — 예전엔 회차가 다 끝나야 적어 회차가 길면 웹앱에 'n분째 새로 못 읽음'이 떴음 */
    const cm = (J.cmds ? await tm('cmds', () => step('맡긴 일', (pp) => runCmds(pp, t0 + 120000, cmdUrgent))) : null) || { n: 0, needRead: false, force: new Set(), buy: false }; p = curPage(p); if (cm.needRead && J.confirm) cr = (await tm('confirm', () => step('주문확인요청', confirmRead))) || cr;
    if (!cr && J.confirm) throw new Error(errs.join(' · ') || '주문확인요청을 못 읽음');
    const delivDue = J.ship && (why !== 'schedule' || cm.needRead || (cr && cr.changed) || !lastDelivAt || Date.now() - lastDelivAt > 4.5 * 60e3 || (cr && cr.prevTab && cr.prevTab['발송 요청'] !== cr.tabCounts['발송 요청']));
    const until = t0 + 30000; // (0.9.0) 무거운 일은 30초 안에서 — 나머지 시간은 빠른 고리(15초마다 주문확인요청) · 한 회차는 1분 안에 끝냄 (다음 예약을 건너뛰지 않게) — 못 한 것은 다음 회차에 이어 함
    /* (0.12.6) 주문확인요청 상품의 시장 읽기(보강)를 발송 요청 읽기보다 먼저 — 예전엔 발송 요청 상품의 유의 사항 다시 읽기가 시간 상자(30초)를 다 써서 보강이 굶었고, 휴대폰 출고 화면 시장이 '읽는 중'에 오래 머물렀음 */
    let en = null; if (J.enrich && cr) { en = await tm('enrich', async () => { try { return await enrichConfirm(p, cr, cm.force, until - 4000); } catch (e) { return { err: e.message }; } }); }
    if (J.cmds && Date.now() < t0 + 42000) { const cs = await tm('cmdsSlow', () => step('맡긴 일(느린)', (pp) => runCmds(pp, t0 + 42000, cmdSlow))); if (cs) { cm.n += cs.n; if (cs.needRead) cm.needRead = true; (cs.force || new Set()).forEach((x) => cm.force.add(x)); if (cs.buy) cm.buy = true; } } /* (0.12.9) 느린 맡긴 일은 시장 읽기 뒤 42초 안에서만 — 남은 것은 다음 회차 */
    let rd = null; if (delivDue) rd = await tm('ship', () => step('발송 요청', (pp) => shipRead(pp, Math.max(until, Date.now() + 8000))));
    if (J.repair) { try { const nr = await repairSweep(); if (nr) log('유의 사항 되살림', nr, '건'); } catch (e) {} } // 6시간에 한 번: 빈 판으로 덮였던 유의 사항을 지난 판에서 되살림
    // (0.9.0) 빠른 고리: 남은 시간 동안 15초마다 ① 주문확인요청을 다시 읽고, 맡긴 일(발송준비시작 등)이 들어오면 기다리지 않고 바로 처리 — 새 주문이 웹앱에 15초 안에, 단추를 누르면 몇 초 안에
    { const fm = J.fast && J.confirm ? await fastMode() : { on: false, why: '설정 ☁에서 끔' }; out0.fastMode = fm.on ? fm.why : '꺼짐 · ' + fm.why; p = curPage(p); if (pageBroken) p = await getPage(); const r2 = await tm('fast', () => fastLoop(p, fm.on ? t0 + 50000 : Date.now(), cr, cm, J)); if (r2.cr) cr = r2.cr; if (r2.rd) rd = r2.rd; cm.n += r2.n; out0.fast = r2.loops; out0.fastChanged = r2.changed; }
    p = curPage(p); let by = null; if (J.buy && (cm.buy || !lastBuyAt || Date.now() - lastBuyAt > 5 * 60e3 || (lastBuyRes && lastBuyRes.left))) { try { by = await buyRead(p, until); } catch (e) { if (e.relogin) { try { await login(p); by = await buyRead(p, until); } catch (e2) { by = { err: e2.message }; } } else by = { err: e.message }; } }
    const out = { ok: !errs.length, err: errs.length ? errs.join(' · ').slice(0, 300) : null, why, ...out0, tickMs: Date.now() - t0, lastShipAt: nowIso(), lastConfirmAt, lastDelivAt: lastDelivAt ? new Date(lastDelivAt).toISOString() : null, lastBuyAt: lastBuyAt ? new Date(lastBuyAt).toISOString() : null, last: { confirm: cr ? cr.n : null, deliv: rd ? rd.deliv : null, delivRead: !!rd, enrich: en, buy: by }, cmds: cm.n, login: 'ok' };
    try { const sn = await shipNotifyTick(curPage(p)); if (sn) out.shipNotify = sn; } catch (e) { out.shipNotify = { err: e.message }; } try { const lw = await loggerWatchTick(); if (lw) out.loggerWatch = lw; } catch (e) { out.loggerWatch = { err: e.message }; } /* (0.13.0) 📦 출고 시각 알림 */
    if (J.ship) { const tb = await tm('tab', () => step('배송&구매확정전', (pp) => shipTabRead(pp))); if (tb) out.tab = tb; } /* (0.14.0) 📦 출고별 매출 = 배송&구매확정전으로 옮겨 온 주문 */
    await beat(out); log('tick', JSON.stringify(out)); return out;
  } catch (e) { const out = { ok: false, err: String(e.message || e).slice(0, 300), why, tickMs: Date.now() - t0, login: /로그인/.test(e.message) ? 'fail' : 'ok' }; try { const sn = await shipNotifyTick(null); if (sn) out.shipNotify = sn; } catch (e2) { out.shipNotify = { err: e2.message }; } try { const lw = await loggerWatchTick(); if (lw) out.loggerWatch = lw; } catch (e2) { out.loggerWatch = { err: e2.message }; } /* (0.13.2 자동 점검) 회차가 앞에서 멈춰도(알라딘 로그인 막힘 등) 출고 알림·로거 지킴이는 함 */ await beat(out); log('tick 실패', e.message); return out; }
}

/* ── 사진 가격: 알라딘 조회 (로그인 필요 없음) ── */
async function lookup(req) {
  const p = await getPage(); const items = {}, cands = {}, errs = {};
  const book = (u, code) => p.evaluate(async (u, code) => { const P = window.ReadnowProducts; const RG = window.ReadnowRegister; const get = async (x) => { const r = await fetch(x, { credentials: 'omit' }); return { url: r.url, doc: new DOMParser().parseFromString(await r.text(), 'text/html') }; };
    const g = await get(u); const b = P.parseProductPage(g.doc, g.url); if (!b.aladinItemId) return { err: '알라딘에서 이 책을 못 찾음' };
    const bm = g.doc.querySelector('meta[property="og:barcode"], meta[name="og:barcode"]'); const barcode = RG ? RG.pageBarcode(g.doc) : bm ? String(bm.getAttribute('content') || '').replace(/\D/g, '') || null : null; const codeOk = !code || (RG ? RG.matchCode({ isbn13: b.isbn13, barcode }, code) : [b.isbn13, barcode].includes(String(code))); /* 공용 파일을 못 받았을 때는 글자가 똑같을 때만 */ if (!codeOk) return { wrong: true, itemId: b.aladinItemId, title: b.title || null, isbn13: b.isbn13 || null, barcode }; /* (0.9.3) 찾던 번호와 다른 상품이면 쓰지 않음 */
    const us = P.parseUsedPage((await get(`/shop/UsedShop/wuseditemall.aspx?ItemId=${b.aladinItemId}&TabType=0`)).doc);
    return { itemId: b.aladinItemId, isbn13: b.isbn13 || null, barcode, title: b.title || null, subtitle: b.subtitle || null, author: (b.contributors || []).slice(0, 2).map((c) => c.name).join(', ') || null, publisher: b.publisher || null, pubDate: b.pubDate || null,
      cover: (b.images && b.images.front) || null, priceList: b.priceList ?? null, priceSales: b.priceSales ?? null, availability: b.availability || null, usedTotal: us.usedTotal ?? null, buyback: us.buyback || null, mins: us.mins || null, page1: us.listings || [], lastPage: us.lastPage || 1,
      /* (0.9.2) 등록 엔진: 상품 관리 코드 판정·카드에 쓰는 정보 */ categories: (b.categories || []).map((c) => ({ path: c.path || [], cids: c.cids || [] })), salesPoint: b.salesPoint ?? null, ranks: b.ranks || [], reviewCount: b.reviewCount ?? null, commentCount: b.commentCount ?? null, rating: b.rating ?? null, size: b.size || null, pages: b.pages || null, originalTitle: b.originalTitle || null, series: b.series || null }; }, u, code || null);
  const keep = async (key, r) => { r.at = nowIso(); items[key] = r; await C('prd_lookups').add({ key, ...r, by: 'cloud', ...W() }).catch(() => {}); };
  const TGT = { 1: 'Book', 2: 'Music', 3: 'DVD', 7: 'Foreign' }[+req.branch || 1] || 'Book'; // (0.9.2) 등록 엔진: 상품 구분(국내도서·음반·DVD·외국도서)에 맞춰 찾음
  const search = (q, tgt) => p.evaluate(async (q, tgt) => { const P = window.ReadnowProducts; const r = await fetch('/search/wsearchresult.aspx?SearchTarget=' + tgt + '&SearchWord=' + encodeURIComponent(q), { credentials: 'omit' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html');
      return P.parseSearchResults(d).filter((x) => !x.used).slice(0, 8).map((x) => ({ itemId: x.itemId, title: x.title, img: x.img || null, cov: Math.round(P.nameCoverage(q, x.title) * 1000) / 1000, channels: x.channels || null })); }, q, tgt);
  /* (0.16.0) 사장님 10/16: 등록 조회는 샵매니저 상품등록의 '알라딘 등록 상품 검색'(wpopup_sISBN — 로그인 필요)으로 — 상품명·번호 모두 먼저 이것 · 후보에 등록 코드(code = wrecord.aspx?ISBN=에 넣는 값)를 실음 · 이 검색을 못 쓰면(로그인 막힘) 예전 공개 검색으로 */
  const scm = (q, kind) => p.evaluate(async (q, kind, br) => { const P = window.ReadnowProducts; if (!P || !P.scmSearch) return { err: '상품 공용 파일 0.15.0이 아님' }; try { const R = await P.scmSearch(q, kind, br, null, 2); return { login: R.login, rows: (R.rows || []).slice(0, 20).map((x) => ({ ...x, cov: Math.round(P.nameCoverage(q, x.title) * 1000) / 1000, scm: true })) }; } catch (e) { return { err: e.message }; } }, q, kind, +req.branch || 1);
  const scmOk = async () => { if (!(await loggedIn(p).catch(() => false))) { try { await login(p); } catch (e) { return false; } } return true; };
  const scmUp = await scmOk(); const scmNote = scmUp ? null : '샵매니저 등록 검색을 못 씀(클라우드 알라딘 로그인 막힘) — 공개 검색으로 찾음';
  /* (0.9.3) 번호(ISBN·바코드)로 찾기: ① 상품 페이지(ISBN=)가 그 번호의 상품일 때만 ② 아니면(음반·DVD 바코드는 엉뚱한 책으로 갈 때가 있음) 그 번호로 검색해 앞 3개 중 번호가 맞는 상품 */
  for (const isbn of (req.isbns || []).slice(0, 40)) { try { if (scmUp) { const S0 = await scm(isbn, 'ISBN').catch((e) => ({ err: e.message })); const L = (S0 && S0.rows) || [];
        if (L.length === 1) { const r1 = await book(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(L[0].itemId)}`); if (r1 && !r1.err) { r1.scmCode = L[0].code; await keep(isbn, r1); await sleep(400); continue; } }
        if (L.length > 1) { cands[isbn] = L; errs[isbn] = `샵매니저 등록 검색에 이 번호의 상품이 ${L.length}개(판·에디션) — 맞는 상품을 누르세요`; await sleep(400); continue; } }
      let r = await book(`/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`, isbn); let wrong = r.wrong ? r : null;
      if (r.err || r.wrong) { r = null; for (const tgt of [...new Set([TGT, 'All'])]) { const C0 = await search(isbn, tgt).catch(() => []); for (const c of C0.slice(0, 3)) { await sleep(300); const r2 = await book(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(c.itemId)}`, isbn); if (r2 && !r2.err && !r2.wrong) { r = r2; break; } } if (r) break; } }
      if (!r && !wrong) { /* (0.13.8) 번호로 알라딘에서 못 찾으면(블루레이·DVD 바코드는 알라딘 검색에 없을 때가 많음 — 10/16 8800312881548) 교보 → 예스24에서 그 번호의 상품 제목을 찾아 알라딘에서 제목으로 후보를 냄(사람이 고름) */
        try { const X = await extMod(); for (const src of ['kyobo', 'yes24']) { if (!X || !X._adp || !X._adp[src]) break; const o = await X._adp[src]({ isbn, http: (x) => extHttp(x), cfg: {} }).catch(() => null); const t = o && o.ok && o.d && o.d.title ? String(o.d.title).replace(/\s*\[[^\]]*\]\s*/g, ' ').trim() : null; if (!t) continue; const C0 = await search(t, TGT).catch(() => []); if (C0.length) { cands[isbn] = C0; errs[isbn] = `알라딘 검색에 이 번호가 없어 ${src === 'kyobo' ? '교보문고' : '예스24'}에서 찾은 제목 '${t}'로 알라딘 후보 ${C0.length}개 — 맞는 상품을 누르세요`; break; } } } catch (e) {} if (cands[isbn]) { await sleep(400); continue; } }
      if (r) await keep(isbn, r); else errs[isbn] = wrong ? `알라딘이 다른 상품(${wrong.title || wrong.itemId})으로 연결함 — 이 번호의 상품을 찾지 못함 (상품명으로 찾아 고르세요)` : '알라딘에서 이 번호(ISBN·바코드)의 상품을 못 찾음'; } catch (e) { errs[isbn] = e.message; } await sleep(400); }
  for (const id of (req.itemIds || []).slice(0, 40)) { try { const r = await book(`/shop/wproduct.aspx?ItemId=${encodeURIComponent(id)}`); if (r.err) errs['id_' + id] = r.err; else await keep('id_' + id, r); } catch (e) { errs['id_' + id] = e.message; } await sleep(400); }
  for (const q of (req.queries || []).slice(0, 40)) { try { if (scmUp) { const S0 = await scm(q, 'NAME').catch((e) => ({ err: e.message })); if (S0 && S0.rows && (S0.rows.length || S0.login)) { cands[q] = S0.rows; await sleep(400); continue; } } cands[q] = await search(q, TGT); if (scmNote) errs['note_' + q] = scmNote; } catch (e) { errs['q_' + q] = e.message; } await sleep(400); }
  return { items, cands, errs, by: 'cloud', via: scmUp ? 'scm' : 'public', note: scmNote };
}

/* ── (0.9.5) 📥 등록 도우미: 알라딘 등록 화면의 분류·저자·출판사 팝업이 하는 검색을 대신 (읽기만) — 결과는 reg_aux에 보관(웹앱이 먼저 봄) ── */
async function regAux(b) { const op = String(b.op || ''); if (!['cat', 'author', 'brand'].includes(op)) throw Object.assign(new Error('모르는 일: ' + op), { code: 400 }); const a = b.a || {};
  const p = await getPage(); const r = await p.evaluate(async (op, a) => { const RG = window.ReadnowRegister; if (!RG || !RG.auxRun) return { err: '등록 엔진 공용 파일(0.3.0)을 못 읽음' }; try { return { v: await RG.auxRun(op, a) }; } catch (e) { return { err: e.message }; } }, op, a);
  if (r.err) { if (/로그인/.test(r.err)) { try { await login(p); } catch (e) {} } return { ok: false, err: r.err }; }
  const key = (await p.evaluate((op, a) => window.ReadnowRegister.auxKey(op, a), op, a)); await C('reg_aux').doc(key).set({ op, a, v: r.v, at: nowIso(), by: 'cloud', ...W() }).catch(() => {}); return { ok: true, v: r.v, key }; }

/* ── 사진 가격: 책등 글자 (Google Vision) → 책등마다 묶음 ── */
let visionClient = null;
async function spines(b64) {
  if (!visionClient) { const vision = require('@google-cloud/vision'); visionClient = new vision.ImageAnnotatorClient(); }
  const [res] = await visionClient.documentTextDetection({ image: { content: Buffer.from(b64, 'base64') }, imageContext: { languageHints: ['ko', 'en'] } });
  const fa = res.fullTextAnnotation; if (!fa || !fa.pages || !fa.pages.length) return { spines: [], w: 0, h: 0 };
  const pg = fa.pages[0]; const Wd = pg.width || 1, Ht = pg.height || 1; const paras = [];
  for (const bl of pg.blocks || []) for (const pa of bl.paragraphs || []) { const v = (pa.boundingBox && pa.boundingBox.vertices) || []; if (!v.length) continue; const xs = v.map((q) => q.x || 0), ys = v.map((q) => q.y || 0);
    const text = (pa.words || []).map((w) => (w.symbols || []).map((s) => s.text).join('')).join(' ').trim(); if (!text) continue;
    paras.push({ text, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }); }
  // 세운 책(책등이 세로)이면 가로 위치로, 눕힌 책(책등이 가로)이면 세로 위치로 묶음
  const tall = paras.filter((q) => q.y1 - q.y0 > q.x1 - q.x0).length >= paras.length / 2;
  const a0 = tall ? 'x0' : 'y0', a1 = tall ? 'x1' : 'y1', o0 = tall ? 'y0' : 'x0';
  paras.sort((m, n) => (m[a0] + m[a1]) - (n[a0] + n[a1])); const groups = [];
  for (const q of paras) { const g = groups[groups.length - 1]; const ov = g ? Math.min(g[a1], q[a1]) - Math.max(g[a0], q[a0]) : -1; const nar = g ? Math.min(g[a1] - g[a0], q[a1] - q[a0]) : 1;
    if (g && ov > nar * 0.45) { g.ps.push(q); g[a0] = Math.min(g[a0], q[a0]); g[a1] = Math.max(g[a1], q[a1]); g.y0 = Math.min(g.y0, q.y0); g.y1 = Math.max(g.y1, q.y1); g.x0 = Math.min(g.x0, q.x0); g.x1 = Math.max(g.x1, q.x1); }
    else groups.push({ ps: [q], x0: q.x0, x1: q.x1, y0: q.y0, y1: q.y1 }); }
  const out = groups.map((g) => ({ text: g.ps.sort((m, n) => m[o0] - n[o0]).map((q) => q.text).join(' ').replace(/\s+/g, ' ').trim(), box: { x: g.x0 / Wd, y: g.y0 / Ht, w: (g.x1 - g.x0) / Wd, h: (g.y1 - g.y0) / Ht } })).filter((s) => s.text.replace(/[^가-힣A-Za-z0-9]/g, '').length >= 2);
  return { spines: out, w: Wd, h: Ht, standing: tall };
}

/* ── (0.5.5) 사진 가격 조회 기록 저장·읽기 — 웹앱이 Firebase 규칙에 막힐 때 저절로 여기로 (관리자 권한이라 규칙과 관계없음, 허용한 계정만)
   ppt_sessions/{조회} = 웹앱과 같은 문서 · 사진은 ppt_photo_data/{조회} {data: JPEG base64} (Storage 대신 — Storage 권한을 따로 주지 않아도 되게) */
async function pptStore(b, u) { const fs = getFirestore(); const sid = String(b.sid || ''); const okId = /^[A-Za-z0-9_-]{8,40}$/.test(sid); const now = new Date().toISOString();
  if (b.op === 'save') { if (!okId) throw Object.assign(new Error('조회 번호가 이상함'), { code: 400 }); const doc = b.doc && typeof b.doc === 'object' ? b.doc : null; if (!doc) throw Object.assign(new Error('기록 없음'), { code: 400 });
    if (JSON.stringify(doc).length > 900e3) throw Object.assign(new Error('기록이 너무 큼 (1MB 한도)'), { code: 413 });
    const out = { ...doc, by: u.email, via: 'cloud', savedAt: now };
    if (b.photo) { const data = String(b.photo).replace(/^data:[^,]+,/, ''); if (data.length > 950e3) throw Object.assign(new Error('사진이 너무 큼'), { code: 413 }); await fs.collection('ppt_photo_data').doc(sid).set({ data, type: 'image/jpeg', at: now, by: u.email }); out.photoFs = true; }
    await fs.collection('ppt_sessions').doc(sid).set(out, { merge: true }); return { ok: true }; }
  if (b.op === 'list') { const qs = await fs.collection('ppt_sessions').orderBy('at', 'desc').limit(60).get(); return { ok: true, list: qs.docs.filter((d) => d.id !== '_perm_check').map((d) => { const v = d.data(); return { id: d.id, at: v.at || null, by: v.by || null, mode: v.mode || null, n: v.n || 0, found: v.found || 0, titles: v.titles || [], photoUrl: v.photoUrl || null, photoFs: !!v.photoFs }; }) }; }
  if (b.op === 'get') { if (!okId) throw Object.assign(new Error('조회 번호가 이상함'), { code: 400 }); const d = await fs.collection('ppt_sessions').doc(sid).get(); if (!d.exists) return { ok: true, doc: null };
    const v = d.data(); let photo = null; if (v.photoFs) { const p = await fs.collection('ppt_photo_data').doc(sid).get(); if (p.exists) photo = 'data:image/jpeg;base64,' + p.data().data; } return { ok: true, doc: v, photo }; }
  throw Object.assign(new Error('모르는 일: ' + b.op), { code: 400 }); }

/* ── HTTP ── */
async function authUser(req) {
  const h = req.headers.authorization || ''; const tok = h.startsWith('Bearer ') ? h.slice(7) : null; if (!tok) throw Object.assign(new Error('로그인 토큰 없음'), { code: 401 });
  const u = await getAuth().verifyIdToken(tok).catch(() => null); if (!u) throw Object.assign(new Error('로그인 토큰이 맞지 않음'), { code: 401 });
  if (u.email_verified === false) throw Object.assign(new Error('이메일 확인이 안 된 계정'), { code: 403 }); /* (0.11.0) 확인 안 된 이메일로 남의 주소를 쓰지 못하게 */
  if (!ALLOW.includes(String(u.email || '').toLowerCase())) throw Object.assign(new Error('허용되지 않은 계정: ' + u.email), { code: 403 }); return u;
}
const keyOk = (req) => { if (!TICK_KEY) return false; const a = Buffer.from(String(req.headers['x-tick-key'] || '')), b = Buffer.from(TICK_KEY); return a.length === b.length && require('crypto').timingSafeEqual(a, b); }; /* (0.11.0) 같은 시간으로 비교 */
const bodyOf = (req) => new Promise((res, rej) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > 15e6) { rej(Object.assign(new Error('너무 큼'), { code: 413 })); req.destroy(); } else ch.push(c); }); req.on('end', () => { try { res(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {}); } catch (e) { rej(Object.assign(new Error('JSON 아님'), { code: 400 })); } }); });

/* ── (0.5.6) 백업용 자료 목록 (/inventory · /storage-files) — 웹앱 '⑪ Firebase 자료 전체 내려받기'가 미리 크기를 보여 주고, 새로 생긴 칸도 빠짐없이 담게
 *   /inventory: Firestore의 모든 최상위 칸(listCollections — 코드에 이름을 적어 두지 않아도 새 칸이 저절로 잡힘) + 아래 칸(log·v·big)
 *               칸마다 문서 수(count — 문서를 다 읽지 않음) · 앞쪽 25건 평균 크기로 어림한 총 크기 / Storage(사진 파일) 폴더마다 파일 수·실제 크기
 *   /storage-files: 고른 폴더의 파일 이름·크기 목록 (웹앱이 그 목록대로 내려받아 나눠 ZIP으로) — 읽기만 함 */
const BUCKET = process.env.FB_BUCKET || 'readnow-3a385.firebasestorage.app';
const SUB_GROUPS = ['log', 'v', 'big'];
async function colStat(q) { let n = null, avg = null; try { n = (await q.count().get()).data().count; } catch (e) {}
  try { const qs = await q.limit(25).get(); if (qs.size) avg = Math.round(qs.docs.reduce((a, d) => a + Buffer.byteLength(JSON.stringify(d.data())) + d.ref.path.length, 0) / qs.size); } catch (e) {}
  return { n, avgBytes: avg, estBytes: n != null && avg != null ? n * avg : null }; }
const stGroupOf = (name) => { const top = name.split('/')[0]; if (top === 'img') return /_t\.webp$/.test(name) ? 'img(작은 그림)' : 'img'; return top; };
async function storageFiles(prefix) { const { getStorage } = require('firebase-admin/storage'); const [files] = await getStorage().bucket(BUCKET).getFiles({ prefix: prefix || '', autoPaginate: true });
  return files.filter((f) => !/\/$/.test(f.name) && !/_perm_check\.txt$/.test(f.name)).map((f) => ({ name: f.name, size: +((f.metadata && f.metadata.size) || 0), type: (f.metadata && f.metadata.contentType) || null })); }
/* (0.12.15) 사진 꺼내 주기 — 웹앱 '② 사진 내려받기'가 브라우저에서 저장소 파일을 직접 받으면 저장소의 CORS(다른 사이트에서 가져가기) 막힘에 걸려 하나도 못 받았음 → 클라우드가 대신 꺼내 base64로 (한 번에 최대 12개·합 12MB — 응답 32MB 한도 안) */
async function storageGet(names) { const { getStorage } = require('firebase-admin/storage'); const B = getStorage().bucket(BUCKET); const out = []; let tot = 0;
  for (const n of (names || []).slice(0, 12)) { const name = String(n || ''); if (!name || name.includes('..') || /^\//.test(name)) { out.push({ name, err: '이름이 이상함' }); continue; } if (tot > 12 * 1048576) { out.push({ name, later: true }); continue; }
    try { const f = B.file(name); const [buf] = await f.download(); const [md] = await f.getMetadata().catch(() => [{}]); tot += buf.length; out.push({ name, size: buf.length, type: md.contentType || null, b64: buf.toString('base64') }); } catch (e) { out.push({ name, err: String(e.message || e).slice(0, 120) }); } }
  return out; }
async function inventory() { const t0 = Date.now(); const cols = [];
  for (const c of await db.listCollections()) cols.push({ id: c.id, ...(await colStat(c)) });
  const subs = []; for (const g of SUB_GROUPS) subs.push({ id: g, ...(await colStat(db.collectionGroup(g))) });
  let storage = null; try { const F = await storageFiles(''); const G = {}; for (const f of F) { const g = stGroupOf(f.name); const x = G[g] || (G[g] = { n: 0, bytes: 0 }); x.n++; x.bytes += f.size; } storage = { bucket: BUCKET, groups: G }; }
  catch (e) { storage = { bucket: BUCKET, err: e.message }; }
  return { ok: true, at: nowIso(), ms: Date.now() - t0, cols: cols.sort((a, b) => a.id.localeCompare(b.id)), subs, storage }; }

/* ── (0.5.7) 데이터 관리 비용 자동 기록 → app_settings/costs_auto_YYYY-MM (달마다 한 문서, 날마다 한 칸 · 웹앱 매입 탭 '기타 지출') ──
 * 하루에 한 번(한국 시각 0시 20분 뒤), 아직 안 적은 날(어제까지)을 하루씩: Google Cloud 사용량(Cloud Monitoring — 이 프로젝트의 실제 측정값)
 *   × 공식 단가(아래 RATES, 출처·확인 날짜 함께) − 무료 한도 = 그날 추정 비용(달러) → 그날 환율(frankfurter, 유럽중앙은행 기준)로 원.
 * 실제 청구 금액은 Google 결제 화면에만 있음 → 웹앱에서 '청구서 금액(달)'을 넣으면 그 달은 청구서 금액이 확정값, 이 추정은 비교로 남음.
 * 이미 적은 날은 다시 쓰지 않음(그 날 칸이 있으면 그대로). Monitoring은 약 6주만 보관 → 처음 돌 때 6주 전부터 채움(한 번에 4일씩).
 * 읽기만 하는 권한(roles/monitoring.viewer · roles/artifactregistry.reader)은 deploy.sh가 줌 */
const COST_RATES = { asOf: '2026-10-08', usdKrwFallback: 1400,
  fsRead: 0.03 / 1e5, fsWrite: 0.09 / 1e5, fsDelete: 0.01 / 1e5, fsFreeRead: 50000, fsFreeWrite: 20000, fsFreeDelete: 20000, // cloud.google.com/firestore/pricing (Standard, 하루 무료)
  fsStoreGiBMonth: 0.000205479 * 730, fsFreeGiB: 1, // 같은 페이지: GiB·시간 단가 × 730시간
  runCpuSec: 0.0000336, runGiBSec: 0.0000035, runReq: 0.4 / 1e6, runFreeUsdMonth: 180000 * 0.000024 + 360000 * 0.0000025 + 2e6 * 0.4 / 1e6, runCpu: 1, runGiB: 2, // cloud.google.com/run/pricing — 서울=Tier 2(요청 처리 중에만 CPU), 무료 = Tier 1 단가로 한 달 $6.02 할인
  visionUnit: 1.5 / 1000, visionFreeMonth: 1000, // cloud.google.com/vision/pricing (글자 읽기)
  gcsGiBMonth: 0.02, gcsFreeGiB: 5, gcsFreeRegions: ['US-CENTRAL1', 'US-EAST1', 'US-WEST1'], // cloud.google.com/storage/pricing (Standard 한 지역; 무료 5GB는 미국 세 지역만)
  arGiBMonth: 0.10, arFreeGiB: 0.5 }; // Artifact Registry(클라우드 이미지 보관)
const PROJECT = process.env.FB_PROJECT || 'readnow-3a385';
async function gToken() { const r = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', { headers: { 'Metadata-Flavor': 'Google' } }); if (!r.ok) throw new Error('토큰 못 받음 ' + r.status); return (await r.json()).access_token; }
async function gGet(tok, url) { const r = await fetch(url, { headers: { Authorization: 'Bearer ' + tok } }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && j.error.message) || 'HTTP ' + r.status); return j; }
async function mSum(tok, filter, s, e, aligner) { const q = new URLSearchParams({ filter, 'interval.startTime': s, 'interval.endTime': e, 'aggregation.alignmentPeriod': '86400s', 'aggregation.perSeriesAligner': aligner || 'ALIGN_SUM', 'aggregation.crossSeriesReducer': 'REDUCE_SUM' });
  const j = await gGet(tok, `https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries?${q}`); let v = 0; for (const ts of j.timeSeries || []) for (const p of ts.points || []) v += +(p.value.int64Value ?? p.value.doubleValue ?? 0); return v; }
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const dayRange = (day) => { const s = Date.parse(day + 'T00:00:00+09:00'); return [new Date(s).toISOString(), new Date(s + 864e5).toISOString()]; };
async function fxRate(day) { try { const r = await fetch(`https://api.frankfurter.app/${day}?from=USD&to=KRW`); const j = await r.json(); if (j && j.rates && j.rates.KRW) return { rate: +j.rates.KRW, src: 'frankfurter(ECB) ' + (j.date || day) }; } catch (e) {} return { rate: COST_RATES.usdKrwFallback, src: '기본값(환율 못 받음)' }; }
async function costUsage(tok, day) { const [s, e] = dayRange(day); const U = {}; const tryM = async (k, f, al) => { try { U[k] = await mSum(tok, f, s, e, al); } catch (er) { U[k] = null; U.err = (U.err || []).concat(`${k}: ${er.message}`.slice(0, 160)); } };
  await tryM('fsRead', 'metric.type="firestore.googleapis.com/document/read_count"'); await tryM('fsWrite', 'metric.type="firestore.googleapis.com/document/write_count"'); await tryM('fsDelete', 'metric.type="firestore.googleapis.com/document/delete_count"');
  await tryM('runSec', 'metric.type="run.googleapis.com/container/billable_instance_time" AND resource.labels.service_name="readnow-cloud"'); await tryM('runReq', 'metric.type="run.googleapis.com/request_count" AND resource.labels.service_name="readnow-cloud"');
  await tryM('vision', 'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="consumed_api" AND resource.labels.service="vision.googleapis.com"');
  await tryM('gcsBytes', 'metric.type="storage.googleapis.com/storage/total_bytes"', 'ALIGN_MEAN'); return U; }
async function costDaily(maxDays) { const ST = C('app_settings').doc('costs_auto'); const st = (await ST.get()).data() || {}; const today = kstDay(Date.now()); const kNow = new Date(Date.now() + 9 * 3600e3);
  if (kNow.getUTCHours() === 0 && kNow.getUTCMinutes() < 20) return { skip: '0시 20분 뒤에' }; // 어제 측정값이 다 모인 뒤
  let day = st.lastDay ? kstDay(Date.parse(st.lastDay + 'T12:00:00+09:00') + 864e5) : kstDay(Date.now() - 42 * 864e5); if (day >= today) return { skip: '다 적음' };
  const tok = await gToken(); let bucketLoc = st.bucketLoc || null; if (!bucketLoc) { try { const { getStorage } = require('firebase-admin/storage'); const [m] = await getStorage().bucket(BUCKET).getMetadata(); bucketLoc = String(m.location || '').toUpperCase(); } catch (e) { bucketLoc = '?'; } }
  let arBytes = null; try { const j = await gGet(tok, `https://artifactregistry.googleapis.com/v1/projects/${PROJECT}/locations/asia-northeast3/repositories`); arBytes = (j.repositories || []).reduce((a, r) => a + (+r.sizeBytes || 0), 0); } catch (e) { arBytes = null; }
  let fsBytes = null; try { const inv = st.fsBytesAt && Date.now() - Date.parse(st.fsBytesAt) < 7 * 864e5 ? null : await inventory(); if (inv) fsBytes = (inv.cols || []).reduce((a, c) => a + (c.estBytes || 0), 0) + (inv.subs || []).reduce((a, c) => a + (c.estBytes || 0), 0); } catch (e) {}
  if (fsBytes == null) fsBytes = st.fsBytes ?? null; const R = COST_RATES; const done = [];
  for (let n = 0; n < (maxDays || 4) && day < today; n++, day = kstDay(Date.parse(day + 'T12:00:00+09:00') + 864e5)) {
    const U = await costUsage(tok, day); const fx = await fxRate(day); const ym = day.slice(0, 7); const dim = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
    const mo = (st.month && st.month.ym === ym) ? st.month : { ym, runUsd: 0, runDisc: 0, vision: 0 }; // 달 무료 한도는 그 달 누적으로
    const lines = []; const L = (key, service, item, qty, unit, free, billable, unitUsd, usd, note) => lines.push({ key, service, item, qty, unit, free, billable, unitUsd, usd: Math.round(usd * 1e6) / 1e6, note: note || null });
    const fz = (q, f) => Math.max(0, (q || 0) - f);
    if (U.fsRead != null) L('fs_read', 'Firestore', '문서 읽기', U.fsRead, '건', R.fsFreeRead, fz(U.fsRead, R.fsFreeRead), R.fsRead, fz(U.fsRead, R.fsFreeRead) * R.fsRead, '하루 무료 5만 건(미국 태평양 자정 기준)');
    if (U.fsWrite != null) L('fs_write', 'Firestore', '문서 쓰기', U.fsWrite, '건', R.fsFreeWrite, fz(U.fsWrite, R.fsFreeWrite), R.fsWrite, fz(U.fsWrite, R.fsFreeWrite) * R.fsWrite, '하루 무료 2만 건');
    if (U.fsDelete != null) L('fs_delete', 'Firestore', '문서 지우기', U.fsDelete, '건', R.fsFreeDelete, fz(U.fsDelete, R.fsFreeDelete), R.fsDelete, fz(U.fsDelete, R.fsFreeDelete) * R.fsDelete, '하루 무료 2만 건');
    if (fsBytes != null) { const g = fsBytes / 2 ** 30; L('fs_store', 'Firestore', '저장 용량', Math.round(g * 1000) / 1000, 'GiB', R.fsFreeGiB, Math.max(0, g - R.fsFreeGiB), R.fsStoreGiBMonth / dim, Math.max(0, g - R.fsFreeGiB) * R.fsStoreGiBMonth / dim, '칸마다 앞쪽 25건 평균으로 어림한 크기(백업 목록과 같은 값) · 무료 1GiB'); }
    if (U.runSec != null) { const cpu = U.runSec * R.runCpu, mem = U.runSec * R.runGiB; const g = cpu * R.runCpuSec + mem * R.runGiBSec + (U.runReq || 0) * R.runReq; const before = mo.runUsd; mo.runUsd += g; const disc = Math.min(g, Math.max(0, R.runFreeUsdMonth - before));
      L('run_cpu', 'Cloud Run', 'CPU 시간', Math.round(cpu), 'vCPU·초', null, Math.round(cpu), R.runCpuSec, cpu * R.runCpuSec, `요청 처리 중 시간 ${Math.round(U.runSec)}초 × ${R.runCpu} vCPU`); L('run_mem', 'Cloud Run', '메모리 시간', Math.round(mem), 'GiB·초', null, Math.round(mem), R.runGiBSec, mem * R.runGiBSec, `× ${R.runGiB} GiB`);
      L('run_req', 'Cloud Run', '요청', U.runReq || 0, '건', null, U.runReq || 0, R.runReq, (U.runReq || 0) * R.runReq, '1분마다 수집 + 웹앱 호출'); if (disc > 0) L('run_free', 'Cloud Run', '무료 한도 할인', null, null, null, null, null, -disc, `한 달 $${R.runFreeUsdMonth.toFixed(2)}까지 (이 달 누적 $${mo.runUsd.toFixed(3)})`); mo.runDisc += disc; }
    if (U.vision != null && U.vision > 0) { const before = mo.vision; mo.vision += U.vision; const bill = Math.max(0, mo.vision - R.visionFreeMonth) - Math.max(0, before - R.visionFreeMonth); L('vision', 'Vision API', '책등 글자 읽기', U.vision, '건', R.visionFreeMonth, bill, R.visionUnit, bill * R.visionUnit, '한 달 무료 1,000건 (이 달 누적 ' + mo.vision + '건)'); }
    if (U.gcsBytes != null) { const g = U.gcsBytes / 2 ** 30; const free = R.gcsFreeRegions.includes(bucketLoc) ? R.gcsFreeGiB : 0; L('gcs', 'Cloud Storage', '사진 저장', Math.round(g * 1000) / 1000, 'GiB', free, Math.max(0, g - free), R.gcsGiBMonth / dim, Math.max(0, g - free) * R.gcsGiBMonth / dim, `버킷 위치 ${bucketLoc}${free ? ' (무료 5GB 지역)' : ''}`); }
    if (arBytes != null) { const g = arBytes / 2 ** 30; L('ar', 'Artifact Registry', '클라우드 이미지 보관', Math.round(g * 1000) / 1000, 'GiB', R.arFreeGiB, Math.max(0, g - R.arFreeGiB), R.arGiBMonth / dim, Math.max(0, g - R.arFreeGiB) * R.arGiBMonth / dim, '배포할 때마다 쌓임 — deploy.sh가 최근 3개만 남기게 정리'); }
    const ref = C('app_settings').doc('costs_auto_' + ym); const rec = { rate: fx.rate, rateSrc: fx.src, lines: lines.map((x) => ({ ...x, krw: Math.round(x.usd * fx.rate) })), basis: '공식 단가 × 측정 사용량 − 무료 한도 (추정 — 실제는 청구서)', ratesAsOf: R.asOf, src: 'Cloud Monitoring', at: nowIso(), errs: U.err || null };
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); if (sn.exists && (sn.data().days || {})[day]) return; tx.set(ref, { ym, cat: '데이터 관리', vendor: 'Google Cloud (Firebase)', days: { [day]: rec }, ...W() }, { merge: true }); }); // 이미 적은 날은 그대로
    st.month = mo; st.lastDay = day; await ST.set({ lastDay: day, month: mo, bucketLoc, fsBytes, fsBytesAt: fsBytes != null ? (st.fsBytesAt && Date.now() - Date.parse(st.fsBytesAt) < 7 * 864e5 ? st.fsBytesAt : nowIso()) : null, arBytes, at: nowIso(), errs: U.err || null, ratesAsOf: R.asOf }, { merge: true });
    done.push({ day, krw: lines.reduce((a, x) => a + Math.round(x.usd * fx.rate), 0), err: U.err || null }); }
  return { done }; }
let costNextAt = 0;
/* ── (0.12.4) 💳 Google Cloud 실제 비용 — 결제 계정 '예산' 알림(Pub/Sub)이 하루 여러 번 이 달 실제 누적 비용(costAmount)을 /billing 으로 밀어 줌
 *  setup-billing.sh(Cloud Shell에서 한 번)가 예산(이 프로젝트만 · 메일 안 보냄)·주제·밀어 주기 구독을 만듦 → app_settings/costs_bill_YYYY-MM
 *  { ym, cur, mtd(마지막 값), at, days: { 날짜: { first, last, at } } } — 날마다 처음 값은 그대로 두고(덮어쓰지 않음) 마지막 값만 고침 · 열쇠 = TICK_KEY에서 만든 값(주소에만 · 비밀번호 아님) */
const billKey = () => (TICK_KEY ? require('crypto').createHash('sha256').update(TICK_KEY + ':billing').digest('hex').slice(0, 32) : '');
async function billingPush(b) { const m = (b && b.message) || {}; let d = {}; try { d = JSON.parse(Buffer.from(String(m.data || ''), 'base64').toString('utf8') || '{}'); } catch (e) { return { ok: false, err: '내용을 못 읽음' }; }
  const cost = Number(d.costAmount); if (!Number.isFinite(cost)) return { ok: true, skip: 'costAmount 없음' }; const start = String(d.costIntervalStart || m.publishTime || nowIso()); const ym = new Date(Date.parse(start) + 12 * 3600e3).toISOString().slice(0, 7); /* 달 시작(태평양 0시) → 그 달 */
  const at = String(m.publishTime || nowIso()); const day = kstDay(Date.parse(at) || Date.now()); const ref = C('app_settings').doc('costs_bill_' + ym);
  await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.exists ? sn.data() : {}; if (v.at && v.at > at) return; /* 늦게 온 옛 알림은 무시 */ const D = (v.days || {})[day] || {};
    tx.set(ref, { ym, cat: '데이터 관리', vendor: 'Google Cloud (Firebase)', src: '결제 계정 예산 알림(실제 누적 비용)', cur: String(d.currencyCode || 'KRW'), mtd: cost, at, budget: d.budgetDisplayName || null, budgetAmount: Number(d.budgetAmount) || null, days: { [day]: { ...(D.first == null ? { first: cost } : {}), last: cost, at } }, ...W() }, { merge: true }); });
  return { ok: true, ym, mtd: cost }; }

/* ── (0.5.8) 개편 1단계 '결과 기록' — 판정 → 실행 → 판매를 한 줄로 잇는 매일 기록 (기계 학습의 재료) ──
 *  ① ml_days/{날짜}_{n}: 하루 한 번(한국 1시 뒤) 판매중 상품 전체의 그날 모습 — 가격·등급·재고 기간·시장(첫 페이지 우리 자리·같은 등급 최저·전체 중고 수·매입가·판매 지수)·
 *     마지막 가격 변경·속한 감시 그룹. 칸마다 배열(열 단위)로 2000개씩 나눠 저장 → 하루 몇 문서. 판매 여부는 나중에 주문과 이어 붙임(다음 날들의 기록·주문으로)
 *  ② ml_outcomes/{반영 기록 id}: 가격을 바꾼 기록마다 그 뒤 팔렸는지·언제·얼마에·몇 시간 만에 (60일이 지나거나 팔리면 '닫힘' — 닫힌 것은 다시 쓰지 않음)
 *  ③ app_settings/ml_state: 마지막으로 만든 날·상품 수·어제 판매가 기록에 이어진 비율(로드맵 1단계 관문: 하루치 판매가 모두 이어짐)
 *  모든 값은 다시 계산할 수 있는 파생 자료 — 수집한 원래 기록(상품·시장·주문)은 건드리지 않음 */
const ML_VER = 1;
const shard = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
let _l2u = null, _l2uAt = 0; /* (0.11.0) 상품번호→상품코드 표를 1시간 기억 — 하루 일마다 상품 전체를 여러 번 읽던 것 */
async function lid2uMap() { if (_l2u && Date.now() - _l2uAt < 3600e3) return _l2u; const m = new Map(); (await C('prd_listings').select('usedCode', 'listingId').get()).forEach((d) => { const v = d.data(); if (v.listingId) m.set(String(v.listingId), v.usedCode); }); _l2u = m; _l2uAt = Date.now(); return m; }
async function mlSales(fromIso) { const out = new Map(); const t0 = Date.parse(fromIso); const day0 = new Date(t0 + 9 * 3600e3).toISOString().slice(0, 10); const kms = (s) => Date.parse(/[T]/.test(String(s)) ? s : String(s).replace(' ', 'T') + '+09:00');
  const add = (u, s) => { const L = out.get(u) || out.set(u, []).get(u); if (!L.some((x) => x.ono === s.ono)) L.push(s); };
  const bad = new Set(); const co = await C('crm_orders').where('orderedAt', '>=', day0).get(); co.forEach((d) => { const o = d.data(); const t = kms(o.orderedAt); if (!(t >= t0) || (o.kind && o.kind !== 'sale')) return; (o.items || []).forEach((it) => { if (!it.aladinUsedCode) return; if (it.lineStatus && it.lineStatus !== 'normal') { bad.add(o.orderNo + '|' + it.aladinUsedCode); return; } add(it.aladinUsedCode, { ono: o.orderNo, at: t, price: it.price || 0, src: 'crm' }); }); });
  const lid2u = await lid2uMap();
  const so = await C('shp_orders').where('orderedAt', '>=', day0).get(); so.forEach((d) => { const o = d.data(); const t = kms(o.orderedAt); if (!(t >= t0)) return; (o.items || []).forEach((it) => { const u = lid2u.get(String(it.listingId)); if (!u || bad.has(o.orderNo + '|' + u)) return; add(u, { ono: o.orderNo, at: t, price: it.price || 0, src: 'shp' }); }); });
  return out; }
async function mlSnapshot(day) { const t0 = Date.now(); const L = []; (await C('prd_listings').where('active', '==', true).get()).forEach((d) => L.push({ id: d.id, ...d.data() }));
  const bids = [...new Set(L.map((l) => l.bookId).filter(Boolean))]; const M = new Map(); for (const part of shard(bids, 300)) { (await db.getAll(...part.map((b) => C('prd_book_metrics').doc(String(b))))).forEach((d) => { if (d.exists) M.set(d.id, d.data()); }); }
  const since = new Date(Date.now() - 90 * 864e5).toISOString(); const lastAct = new Map(); (await C('prd_price_actions').where('at', '>=', since).get()).forEach((d) => { const a = d.data(); if (!a.key || a.to == null) return; const p = lastAct.get(a.key); if (!p || String(a.at) > String(p.at)) lastAct.set(a.key, { ...a, id: d.id }); });
  const watch = new Map(); try { (await C('prd_price_decisions').where('watch.gid', '>', '').get()).forEach((d) => { const w = d.data().watch; if (w && w.gid) watch.set(d.id, w.gid); }); } catch (e) {}
  const now = Date.parse(day + 'T23:59:59+09:00'); const ML = await mlMod(); if (!ML) throw new Error('학습 파일(readnow-ml-core.js)이 없어 하루 모습을 못 만듦');
  const rows = L.map((l) => ML.rawRow(l, M.get(String(l.bookId)), lastAct.get(l.id), watch.get(l.id), now)); // (0.8.0) 한 줄 만드는 곳은 readnow-ml-core.js 한 곳 — 웹앱도 같은 것으로 지금 상품을 셈
  const cols = Object.keys(rows[0] || { key: 0 }); const parts = shard(rows, 2000); const b = db.batch(); parts.forEach((p, i) => { const o = {}; cols.forEach((c) => (o[c] = p.map((r) => r[c]))); b.set(C('ml_days').doc(`${day}_${String(i).padStart(2, '0')}`), { day, i, n: p.length, ver: ML_VER, cols: o, ...W() }); });
  b.set(C('ml_days').doc(day), { day, shards: parts.length, n: rows.length, ver: ML_VER, colNames: cols, at: nowIso(), ms: Date.now() - t0, ...W() }); await b.commit(); return { n: rows.length, shards: parts.length }; }
async function mlOutcomes() { const since = new Date(Date.now() - 90 * 864e5).toISOString(); const acts = []; (await C('prd_price_actions').where('at', '>=', since).get()).forEach((d) => { const a = d.data(); if (a.key && a.to != null && a.kind !== 'hold' && a.kind !== 'unhold') acts.push({ id: d.id, ...a }); });
  if (!acts.length) return { n: 0 }; const closed = new Set(); (await C('ml_outcomes').where('at', '>=', since).select('closed').get()).forEach((d) => { if (d.get('closed')) closed.add(d.id); }); /* (0.9.3) 90일 안 것만 읽음 — 예전엔 닫힌 결과 전체를 날마다 읽어 쌓일수록 비용이 늘었음 */ const open = acts.filter((a) => !closed.has(a.id)); if (!open.length) return { n: 0 };
  const todo = open.sort((x, y) => String(x.at).localeCompare(String(y.at))).slice(0, 450); // 하루 450개까지(오래된 것부터) — 남으면 다음 날 이어서
  const first = String(todo[0].at); const sales = await mlSales(first); let n = 0, nSold = 0; const b = db.batch();
  for (const a of todo) { const t = Date.parse(a.at); const s = (sales.get(a.usedCode) || []).filter((x) => x.at >= t).sort((x, y) => x.at - y.at)[0] || null; const age = (Date.now() - t) / 864e5;
    b.set(C('ml_outcomes').doc(a.id), { key: a.key, usedCode: a.usedCode || null, at: a.at, from: a.from ?? null, to: a.to, kind: a.kind || null, batchId: a.batchId || null, batchName: a.batchName || null, sold: !!s, soldAt: s ? new Date(s.at).toISOString() : null, soldPrice: s ? s.price : null, hours: s ? Math.round((s.at - t) / 36e5 * 10) / 10 : null, src: s ? s.src : null, closed: !!s || age > 60, checkedAt: nowIso(), ver: ML_VER, ...W() }); n++; if (s) nSold++; }
  await b.commit(); return { n, nSold, open: open.length }; }

async function mlCheck(day) { // 관문: 어제 판매가 기록(그 전날 판매중 모습 또는 반영 기록)에 이어졌는지
  const t0 = Date.parse(day + 'T00:00:00+09:00'); const sales = await mlSales(new Date(t0).toISOString()); const prev = new Date(t0 - 864e5 + 9 * 3600e3).toISOString().slice(0, 10); let keys = new Set();
  const meta = await C('ml_days').doc(prev).get(); if (meta.exists) for (let i = 0; i < (meta.data().shards || 0); i++) { const d = await C('ml_days').doc(`${prev}_${String(i).padStart(2, '0')}`).get(); if (d.exists) (d.data().cols.key || []).forEach((k) => keys.add(k)); }
  let n = 0, hit = 0; for (const [u, L] of sales) { const inDay = L.filter((s) => s.at < t0 + 864e5); if (!inDay.length) continue; n += inDay.length; if (keys.has('aladin_' + u)) hit += inDay.length; }
  return { day, sales: n, linked: hit, prevSnapshot: meta.exists }; }
async function mlDaily() { const ST = C('app_settings').doc('ml_state'); const st = (await ST.get()).data() || {}; const k = new Date(Date.now() + 9 * 3600e3); if (k.getUTCHours() < 1) return { skip: '1시 뒤에' };
  const today = k.toISOString().slice(0, 10); if (st.lastDay === today) return { skip: '오늘 함' };
  const snap = await mlSnapshot(today); let out = null; try { out = await mlOutcomes(); } catch (e) { out = { err: e.message }; } let chk = null; try { chk = await mlCheck(new Date(Date.parse(today + 'T00:00:00+09:00') - 864e5 + 9 * 3600e3).toISOString().slice(0, 10)); } catch (e) { chk = { err: e.message }; }
  await ST.set({ lastDay: today, snap, outcomes: out, check: chk, ver: ML_VER, at: nowIso(), days: FV.arrayUnion(today) }, { merge: true }); return { snap, out, chk }; }

/* ── (0.8.0) 개편 6단계 '스스로 배우기' — 팔릴 확률 모델 (계산은 readnow-ml-core.js 한 곳, 웹앱과 같음)
 *  매일(한국 2시 뒤, 결과 기록 뒤) ① 배우기: 7일이 지나 결과를 아는 날들(최근 60일)의 하루 모습 + 그 뒤 7일 판매 → 새 모델(도전자)
 *  ② 그림자: 오늘 판매중 상품마다 지금 모델·도전자의 확률을 적어 두기만(ml_shadow) — 실제 판단에는 쓰지 않음
 *  ③ 채점: 7일이 지난 그림자를 실제 판매와 맞춰 로그 손실·AUC(ml_eval) ④ 승격: (0.9.3) 고정한 후보 하나가 지금 모델과 겨룬 채점 3번이 모두 1% 넘게 나으면 그 후보를 지금 모델로(ml_state.model, 기록 남김) — 아니면 탈락, 새 후보
 *  처음 지금 모델 = 기준선(1위 여부 × 등급별 평균 판매율). 모델은 조언 금액에만 쓰임 — 알라딘을 바꾸지 않음 */
let ML_LOCAL = null; try { ML_LOCAL = require('./readnow-ml-core.js'); } catch (e) { console.log(new Date().toISOString(), '함께 올린 학습 파일 없음 — GitHub에서 받음', e.message); }
let MLM = ML_LOCAL, mlmAt = 0;
async function mlMod() { if (MLM) coreVer['readnow-ml-core.js'] = MLM.VERSION; if (MLM && (ML_LOCAL || Date.now() - mlmAt < 30 * 60e3)) return MLM; mlmAt = Date.now();
  try { const r = await fetch(RAW + 'readnow-ml-core.js?t=' + Date.now()); if (r.ok) { const m = { exports: {} }; new Function('module', 'exports', await r.text())(m, m.exports); if (m.exports && m.exports.train) MLM = m.exports; } } catch (e) { log('학습 파일 받기 실패', e.message); }
  if (MLM) coreVer['readnow-ml-core.js'] = MLM.VERSION; return MLM; }
function trainOff(ML, X, Y) { if (!ML_LOCAL) return Promise.resolve(ML.train(X, Y)); // 함께 올린 파일이 있을 때만 일꾼을 씀 (없으면 이 자리에서)
  return new Promise((res) => { try { const { Worker } = require('worker_threads'); const w = new Worker(`const { parentPort, workerData } = require('worker_threads'); const ML = require(workerData.path); parentPort.postMessage(ML.train(workerData.X, workerData.Y));`, { eval: true, workerData: { path: require.resolve('./readnow-ml-core.js'), X, Y } });
    w.once('message', (m) => { res(m); w.terminate(); }); w.once('error', (e) => { log('일꾼 배우기 실패 — 이 자리에서', e.message); res(ML.train(X, Y)); }); } catch (e) { res(ML.train(X, Y)); } }); }
async function mlLoadDay(day) { const meta = await C('ml_days').doc(day).get(); if (!meta.exists) return null; const rows = [];
  for (let i = 0; i < (meta.data().shards || 0); i++) { const d = await C('ml_days').doc(`${day}_${String(i).padStart(2, '0')}`).get(); if (!d.exists) continue; const cols = d.data().cols || {}; const names = Object.keys(cols); const n = (cols.key || []).length; for (let k = 0; k < n; k++) { const r = {}; names.forEach((c) => (r[c] = cols[c][k])); rows.push(r); } }
  return rows; }
const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const dayEnd = (d) => Date.parse(d + 'T23:59:59+09:00');
function mlLabel(ML, rows, day, sales) { const t0 = Date.parse(day + 'T01:00:00+09:00'), t1 = t0 + ML.HORIZON_D * 864e5; /* (0.9.3) 하루 모습은 한국 1시 뒤에 찍음 → 그때부터 7일 (예전엔 그날 밤 23:59부터라 그날 팔린 책을 '안 팔림'으로 셈 — 잘 팔리는 책일수록 빠져 확률이 낮게 나왔음) */ return rows.map((r) => { const u = String(r.key || '').replace(/^aladin_/, ''); return (sales.get(u) || []).some((s) => s.at > t0 && s.at <= t1) ? 1 : 0; }); }
async function mlShadowWrite(day, champId, challId, rows, pc, ph) { const parts = shard(rows.map((r, i) => [r.key, pc[i], ph[i]]), 2000); const b = db.batch();
  parts.forEach((p, i) => b.set(C('ml_shadow').doc(`${day}_${String(i).padStart(2, '0')}`), { day, i, keys: p.map((x) => x[0]), pc: p.map((x) => x[1] == null ? null : Math.round(x[1] * 1000) / 1000), ph: p.map((x) => x[2] == null ? null : Math.round(x[2] * 1000) / 1000), ...W() }));
  b.set(C('ml_shadow').doc(day), { day, shards: parts.length, n: rows.length, champId, challId, at: nowIso(), ...W() }); await b.commit(); }
async function mlShadowLoad(day) { const meta = await C('ml_shadow').doc(day).get(); if (!meta.exists) return null; const out = { ...meta.data(), keys: [], pc: [], ph: [] };
  for (let i = 0; i < (meta.data().shards || 0); i++) { const d = await C('ml_shadow').doc(`${day}_${String(i).padStart(2, '0')}`).get(); if (!d.exists) continue; const v = d.data(); out.keys.push(...v.keys); out.pc.push(...v.pc); out.ph.push(...v.ph); } return out; }
async function mlLearn() { const ML = await mlMod(); if (!ML) return { skip: '학습 파일 없음' }; const ST = C('app_settings').doc('ml_state'); const st = (await ST.get()).data() || {}; const k = new Date(Date.now() + 9 * 3600e3);
  const today = k.toISOString().slice(0, 10); if (k.getUTCHours() < 2) return { skip: '2시 뒤에' }; if (st.lastDay !== today) return { skip: '오늘 결과 기록 먼저' }; if ((st.learn || {}).day === today) return { skip: '오늘 함' };
  const t0 = Date.now(); const days = [...new Set(st.days || [])].sort(); const lastLab = kday(Date.now() - (ML.HORIZON_D + 1) * 864e5); const lab = days.filter((d) => d <= lastLab).slice(-60);
  const champ0 = st.model && st.model.champion ? ((await C('ml_models').doc(st.model.champion).get()).data() || null) : null;
  const res = { day: today, labDays: lab.length, days: days.length, ver: ML.VERSION };
  // ③ 채점 먼저: 7일 지난 그림자
  const evals = []; try { const sales0 = lab.length ? await mlSales(new Date(dayEnd(lab[0]) - 864e5).toISOString()) : new Map();
    for (const d of days.filter((x) => x <= lastLab).slice(-14)) { const ev = await C('ml_eval').doc(d).get(); if (ev.exists) { evals.push(ev.data()); continue; } const sh = await mlShadowLoad(d); if (!sh) continue;
      const y = mlLabel(ML, sh.keys.map((key) => ({ key })), d, sales0); const ic = sh.pc.map((v, i) => [v, y[i]]).filter((x) => x[0] != null); const ih = sh.ph.map((v, i) => [v, y[i]]).filter((x) => x[0] != null);
      const e = { day: d, champId: sh.champId, challId: sh.challId, champ: ML.evaluate(ic.map((x) => x[0]), ic.map((x) => x[1])), chall: sh.challId ? ML.evaluate(ih.map((x) => x[0]), ih.map((x) => x[1])) : null, at: nowIso() }; await C('ml_eval').doc(d).set({ ...e, ...W() }); evals.push(e); } } catch (e) { res.evalErr = e.message; }
  res.evals = evals.length;
  if (lab.length < 3) { await ST.set({ learn: { day: today, state: 'wait', why: `결과를 아는 날 ${lab.length}일 — 3일부터 배움 (하루 모습을 쌓은 지 ${days.length}일)`, at: nowIso() } }, { merge: true }); return { ...res, wait: true }; }
  // ① 배우기
  const sales = await mlSales(new Date(dayEnd(lab[0]) - 864e5).toISOString()); const X = [], Y = [], R0 = [], D = [];
  let tot = 0; for (const d of lab) { const m0 = await C('ml_days').doc(d).get(); tot += m0.exists ? m0.data().n || 0 : 0; } const stride = Math.max(1, Math.ceil(tot / 200000)); res.stride = stride; // 메모리·시간: 많으면 고르게 줄여서 (최대 약 20만 줄)
  for (const d of lab) { const rows = await mlLoadDay(d); if (!rows) continue; const y = mlLabel(ML, rows, d, sales); rows.forEach((r, i) => { if (i % stride) return; const x = ML.feats(r); if (!x) return; X.push(x); Y.push(y[i]); R0.push(r); D.push(d); }); }
  if (X.length < 200) { await ST.set({ learn: { day: today, state: 'wait', why: `배울 줄 ${X.length}개 — 200개부터`, at: nowIso() } }, { merge: true }); return { ...res, wait: true, rows: X.length }; }
  const valFrom = lab.length >= 10 ? lab[lab.length - 7] : lab[Math.floor(lab.length * 0.7)]; const tr = [], va = []; D.forEach((d, i) => (d < valFrom ? tr : va).push(i)); if (!tr.length || !va.length) { tr.length = 0; va.length = 0; D.forEach((d, i) => (i % 5 ? tr : va).push(i)); }
  const cap = 150000; const trS = tr.length > cap ? tr.filter((_, i) => i % Math.ceil(tr.length / cap) === 0) : tr; // 많으면 고르게 줄여서 (시간·비용)
  const mdl = await trainOff(ML, trS.map((i) => X[i]), trS.map((i) => Y[i])); /* (0.9.0) 따로 도는 일꾼(worker)에서 — 배우는 동안에도 주문 읽기가 멈추지 않게 */ const base = ML.trainBase(tr.map((i) => R0[i]), tr.map((i) => Y[i]));
  const champ = champ0 || base; const pv = (M) => va.map((i) => ML.predict(M, R0[i])); const vy = va.map((i) => Y[i]);
  const val = { chall: ML.evaluate(pv(mdl), vy), champ: ML.evaluate(pv(champ), vy), base: ML.evaluate(pv(base), vy) };
  const challId = 'm_' + today; await C('ml_models').doc(challId).set({ ...mdl, id: challId, trainedAt: nowIso(), nTrain: trS.length, nVal: va.length, labDays: lab.length, valFrom, val, ...W() });
  if (!champ0) await C('ml_models').doc('base_' + today).set({ ...base, id: 'base_' + today, trainedAt: nowIso(), ...W() });
  const champId = champ0 ? st.model.champion : 'base_' + today;
  /* (0.9.3) 도전자를 며칠 고정: 그림자 채점을 받은 바로 그 모델만 승격 (예전엔 날마다 새 도전자로 그림자를 적고, 승격은 채점받지 않은 오늘 모델을 올렸음)
   *  후보(candidate) = 지금 모델과 겨루는 한 모델 · 그 후보의 채점이 3번 모이면 승격 또는 탈락 → 다음 날 새 후보 · 후보가 14일 넘게 채점 3번을 못 모으면 새 후보 */
  const cand0 = st.model && st.model.candidate; let candId = cand0 && cand0.id, candM = null;
  if (candId && (cand0.champ !== champId || Date.parse(today) - Date.parse(cand0.since || today) > 14 * 864e5)) candId = null;
  if (candId) { candM = (await C('ml_models').doc(candId).get()).data() || null; if (!candM) candId = null; }
  const candEv = candId ? evals.filter((e) => e.challId === candId && e.champId === champId).sort((a, b) => String(a.day).localeCompare(String(b.day))) : [];
  let pr = { ok: false, why: candId ? `후보 ${candId} 채점 ${candEv.length}/3번` : '새 후보' }; let nextCand = candId ? cand0 : null;
  if (candId && candEv.length >= 3) { pr = ML.shouldPromote(candEv); if (!pr.ok) { pr = { ...pr, rejected: candId }; nextCand = null; candId = null; candM = null; } }
  if (!candId) { candId = challId; candM = mdl; nextCand = { id: challId, since: today, champ: champId }; }
  // ② 그림자: 오늘 상품 — 지금 모델 · 후보
  let shadowN = 0; try { const rows = await mlLoadDay(today); if (rows && rows.length) { await mlShadowWrite(today, champId, candId, rows, rows.map((r) => ML.predict(champ, r)), rows.map((r) => ML.predict(candM, r))); shadowN = rows.length; } } catch (e) { res.shadowErr = e.message; }
  // ④ 승격 (채점받은 후보만)
  const model = { champion: champ0 ? st.model.champion : champId, kind: champ.kind, since: (st.model && st.model.since) || today, latestChallenger: challId, candidate: nextCand };
  if (pr.ok && nextCand && nextCand.id !== challId) { const to = nextCand.id; model.champion = to; model.kind = 'logit'; model.since = today; model.candidate = { id: challId, since: today, champ: to }; model.lastPromotion = { at: nowIso(), from: champId, to, why: pr.why, evals: candEv.map((e) => e.day) }; log('모델 승격', champId, '→', to, pr.why); }
  await ST.set({ learn: { day: today, state: 'ok', rows: X.length, train: trS.length, val: va.length, valFrom, metrics: val, shadow: shadowN, promote: pr, ms: Date.now() - t0, at: nowIso() }, model, ...(pr.ok ? { promotions: FV.arrayUnion(model.lastPromotion) } : {}) }, { merge: true });
  return { ...res, rows: X.length, val, shadowN, promote: pr }; }

/* ══════════ (0.10.0) 🌐 외부 정보 — PC 수집기가 꺼져 있을 때 클라우드가 이어 받음 ══════════
 *  같은 기준 파일(readnow-ext-core.js — GitHub의 것)·같은 기록 칸(ext_*)·같은 규칙(같으면 확인 시각만 · 바뀌면 옛 값을 ext_hist에 · 출처마다 하루 최대·다시 볼 날·요청 간격)
 *  맡는 때: 설정 ⑱ '클라우드가 이어 받기'가 켜져 있고(app_settings/ext.cloud !== false) · 외부 정보가 켜져 있고 · PC가 15분 넘게 맡지 않았을 때만 (PC가 켜져 있으면 PC가 함)
 *  한 번에 최대 90초(/daily 10분마다) — 비용: PC가 꺼져 있는 동안 하루 최대 약 3.6시간어치 실행(1 vCPU) · 알라딘 로그인은 쓰지 않음(손님으로 외부 사이트만)
 *  책 목록: 판매중·일시판매중지 상품(ISBN, 판매가 높은 순)을 하루 한 번 만들어 ext_cand에 나눠 저장 → 회차마다 상품 전체를 다시 읽지 않음(읽기 비용) */
const EBAYDEL = { t: null, at: 0 }; let EXTM = null, extmAt = 0; const EXT_C = { cache: {}, next: {}, idx: null, idxAt: 0, cand: null, candAt: 0, cur: {}, errs: {}, pauseUntil: {}, used: {}, usedDay: null, keys: null, keysAt: 0 };
async function extMod() { if (EXTM && Date.now() - extmAt < 30 * 60e3) return EXTM; extmAt = Date.now(); try { const r = await fetch(RAW + 'readnow-ext-core.js?t=' + Date.now()); if (r.ok) { const m = { exports: {} }; new Function('module', 'exports', await r.text())(m, m.exports); if (m.exports && m.exports.run) EXTM = m.exports; } } catch (e) { log('외부 정보 공용 파일 받기 실패', e.message); } if (EXTM) coreVer['readnow-ext-core.js'] = EXTM.VERSION; return EXTM; }
const extKst = (ms) => new Date((ms || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
const EXT_RUN = () => C('app_settings').doc('ext_run'); const EXT_BACKOFF = [1, 3, 7, 14, 30];
const extHttp = async (o) => { const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 30000); try { const r = await fetch(o.url, { method: o.method || 'GET', headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8', ...(o.headers || {}) }, body: o.data, signal: ctl.signal, redirect: 'follow' }); return { status: r.status, text: await r.text() }; } catch (e) { throw new Error(e.name === 'AbortError' ? '응답 없음(30초)' : '연결 실패: ' + e.message); } finally { clearTimeout(t); } };
async function extKeysC() { if (EXT_C.keys && Date.now() - EXT_C.keysAt < 10 * 60e3) return EXT_C.keys; let k = {}; try { const d = await C('app_secrets').doc('ext').get(); k = (d.exists && d.data().keys) || {}; } catch (e) { log('외부 연결 키를 못 읽음', e.message); } EXT_C.keys = k; EXT_C.keysAt = Date.now(); return k; }
/* (0.12.3 전체 점검) ext_run 날짜별 칸(cnt·res)은 15일 지난 것을 하루 한 번 지움 — 한 문서 색인 한도(4만)에 닿으면 외부 정보가 멈춤 (수집기 1.63.6과 같은 규칙) */
let extPruneDayC = ''; async function extPruneC(D) { const day = extKst(); if (extPruneDayC === day || !D) return; extPruneDayC = day; const cut = extKst(Date.now() - 15 * 864e5); const up = {}; for (const f of ['cnt', 'res']) { const ks = Object.keys(D[f] || {}).filter((d) => d < cut); if (ks.length) up[f] = Object.fromEntries(ks.map((d) => [d, FV.delete()])); } if (Object.keys(up).length) await EXT_RUN().set(up, { merge: true }).catch(() => {}); }
async function extUsedLoadC() { const day = extKst(); let u = {}; try { const d = await EXT_RUN().get(); if (d.exists) extPruneC(d.data()).catch(() => {}); u = ((d.exists && d.data().cnt) || {})[day] || {}; } catch (e) {} EXT_C.used = { ...u }; EXT_C.usedDay = day; return EXT_C.used; }
const extUsedAddC = (src, n) => { n = Math.max(1, n || 1); const day = extKst(); if (EXT_C.usedDay !== day) { EXT_C.used = {}; EXT_C.usedDay = day; } EXT_C.used[src] = (EXT_C.used[src] || 0) + n; return EXT_RUN().set({ cnt: { [day]: { [src]: FV.increment(n) } } }, { merge: true }).catch(() => {}); };
async function extIdxLoadC(X) { if (EXT_C.idx && Date.now() - EXT_C.idxAt < 60 * 60e3) return; const out = {}; for (const src of X.ORDER) out[src] = new Map(); try { const qs = await C('ext_index').get(); qs.forEach((d) => { const [src] = d.id.split('_'); const m = (d.data() || {}).m || {}; if (out[src]) Object.entries(m).forEach(([k, v]) => out[src].set(k, v)); }); } catch (e) {} EXT_C.idx = out; EXT_C.idxAt = Date.now(); }
const extIdxSetC = (X, src, isbn, val) => { const v = val || extKst(); (EXT_C.idx[src] = EXT_C.idx[src] || new Map()).set(isbn, v); return C('ext_index').doc(`${src}_${X.shard(isbn)}`).set({ m: { [isbn]: v }, ...W() }, { merge: true }).catch(() => {}); };
const extIdxErrKC = (src, isbn) => { const v = (EXT_C.idx[src] || new Map()).get(isbn); const m = String(v || '').match(/^E (\d{4}-\d\d-\d\d) (\d+)$/); return m ? +m[2] : 0; };
/* 책 목록 — ext_cand/{0..n} (하루 한 번 다시 만듦 · 상품 전체 읽기는 그때만) */
async function extCandsC(X) { if (EXT_C.cand && Date.now() - EXT_C.candAt < 6 * 3600e3) return EXT_C.cand;
  try { const m = await C('ext_cand').doc('meta').get(); const M = m.exists ? m.data() : null; if (M && M.at && M.v === 2 && Date.now() - Date.parse(M.at) < 24 * 3600e3 && M.n) { const L = []; for (let i = 0; i < M.parts; i++) { const d = await C('ext_cand').doc('p' + i).get(); if (d.exists) { try { L.push(...JSON.parse(d.data().J || '[]')); } catch (e) {} } } /* Firestore는 목록 안의 목록을 못 받아 한 쪽을 글자(JSON)로 */ if (L.length && L.length === M.n) { EXT_C.cand = L.map((r) => ({ isbn: r[0], p: r[1], title: r[2] || null, author: r[3] || null, media: r[4] || null })); EXT_C.candAt = Date.now(); return EXT_C.cand; } } } catch (e) { log('외부 정보 책 목록 읽기 실패', e.message); }
  const seen = new Map(); const qs = await C('prd_listings').where('status', 'in', ['판매중', '일시판매중지']).select('isbn13', 'isbn10', 'mediaType', 'title', 'author', 'price', 'status', 'usedCode', 'itemCode', 'barcode').get();
  qs.forEach((d) => { const l = d.data(); const isbn = X.keyOf ? X.keyOf(l) : String(l.isbn13 || '').replace(/[^0-9]/g, ''); if (!isbn) return; const isI = /^97[89]\d{10}$/.test(isbn); if (!isI && !['video', 'music'].includes(l.mediaType)) return; const p = +l.price || 0; const o = seen.get(isbn); if (!o || p > o.p) seen.set(isbn, { isbn, media: l.mediaType || null, title: String(l.title || '').replace(/^\[중고[^\]]*\]\s*/, '') || null, author: l.author || null, p }); });
  const L = [...seen.values()].sort((a, b) => b.p - a.p); const rows = L.map((b) => [b.isbn, b.p, b.title ? b.title.slice(0, 120) : null, b.author ? String(b.author).slice(0, 60) : null, b.media]); const per = 1000; const parts = Math.ceil(rows.length / per); /* 한 쪽 1,000권 — 한국어 제목이 길어도 문서 한도(1MiB) 안 */
  try { for (let i = 0; i < parts; i++) await C('ext_cand').doc('p' + i).set({ J: JSON.stringify(rows.slice(i * per, (i + 1) * per)), ...W() }); await C('ext_cand').doc('meta').set({ v: 2, at: nowIso(), n: rows.length, parts, from: qs.size, ...W() }); /* 쪽을 모두 쓴 뒤에만 meta */ } catch (e) { log('외부 정보 책 목록 저장 실패', e.message); }
  EXT_C.cand = L; EXT_C.candAt = Date.now(); log('외부 정보 책 목록', L.length, '권 (상품', qs.size, '개에서)'); return L; }
const extDueC = (src, isbn, cfg) => { const v = (EXT_C.idx[src] || new Map()).get(isbn); if (!v) return true; const m = String(v).match(/^E (\d{4}-\d\d-\d\d) (\d+)$/); if (m) return Date.now() - Date.parse(m[1] + 'T00:00:00+09:00') >= EXT_BACKOFF[Math.min(EXT_BACKOFF.length, +m[2]) - 1] * 864e5; return Date.now() - Date.parse(v + 'T00:00:00+09:00') >= cfg.src[src].refreshDays * 864e5; };
const extEligibleC = (X, src, b, cfg) => { if (X.eligible) return X.eligible(src, b, cfg); /* (0.11.0) 공용 파일 0.3.0부터 기준이 공용 파일에 */ const g = X.SOURCES[src].grp; if (!/^97[89]\d{10}$/.test(String(b.isbn || ''))) return g === 'used' && src !== 'yes24used' && !!b.title; if (g === 'foreign' && !cfg.foreignKr && X.isKrIsbn(b.isbn)) return false; if ((g === 'used' && src !== 'yes24used') || g === 'ebook') return !!b.title; return true; };
/* 한 출처·한 책의 결과 쓰기 — PC 수집기와 같은 규칙(같은 내용이면 확인 시각만 · '없음'은 두 번 잇달아일 때만 · 바뀌면 옛 값을 ext_hist에) */
const extBytes = (x) => Buffer.byteLength(JSON.stringify(x), 'utf8'); /* (0.11.0) 바이트로 — 출처 하나 150KB까지(한 문서에 출처가 여럿이라 합쳐 1MB 안) */
async function extSaveC(X, src, b, res) { const col = X.GROUPS[X.SOURCES[src].grp].col; const ref = C(col).doc(b.isbn); const now = nowIso();
  if (res.skip) return 'skip'; const snap = await ref.get(); const cur = snap.exists ? snap.data() : null; const prev = cur && cur.src ? cur.src[src] : null;
  if (!res.ok) { const err = { at: now, why: String(res.why || '').slice(0, 300), by: 'cloud', ...(res.mismatch ? { mismatch: true } : {}) }; if (cur) await ref.update({ [`src.${src}.err`]: err, uploadedAt: FV.serverTimestamp() }); else await ref.set({ isbn: b.isbn, title: b.title || null, src: { [src]: { err } }, ...W() }, { merge: true });
    if (res.probe) { const pid = `${src}_${extKst().replace(/-/g, '')}`; const pr = C('ext_probe').doc(pid); try { const ex = await pr.get(); if (!ex.exists) await pr.set({ src, isbn: b.isbn, title: b.title || null, why: res.why, url: res.probe.url, len: res.probe.len, head: res.probe.head, at: now, by: 'cloud', ...W() }); } catch (e) {} }
    return res.mismatch ? 'mismatch' : 'err'; }
  let d = res.d ?? null; if (d) { d = JSON.parse(JSON.stringify(d)); let g = 0; while (extBytes(d) > 150000 && g++ < 12) { if (Array.isArray(d.items) && d.items.length > 5) d.items = d.items.slice(0, Math.ceil(d.items.length / 2)); else if (d.kv) d.kv = null; else break; d.trunc = true; } } const sg = X.sig({ none: !!res.none, d });
  if (prev && prev.sig === sg) { await ref.update({ [`src.${src}.chk`]: now, [`src.${src}.err`]: FV.delete(), [`src.${src}.noneAt`]: FV.delete(), uploadedAt: FV.serverTimestamp() }); return 'same'; }
  if (res.none && prev && prev.d && !prev.none && !prev.noneAt) { await ref.update({ [`src.${src}.noneAt`]: now, [`src.${src}.chk`]: now, [`src.${src}.err`]: FV.delete(), uploadedAt: FV.serverTimestamp() }); return 'none1'; }
  if (prev && prev.at) { const hid = `${col}_${b.isbn}_${src}_${String(prev.at).replace(/[^0-9]/g, '').slice(0, 14)}`; const hr = C('ext_hist').doc(hid); try { const ex = await hr.get(); if (!ex.exists) await hr.set({ col, isbn: b.isbn, src, at: prev.at, chk: prev.chk || null, none: !!prev.none, d: prev.d ?? null, sig: prev.sig || null, ...W() }); } catch (e) { log('옛 값 보관 실패 — 바꾸지 않음', src, b.isbn, e.message); return 'err'; } }
  const obj = { at: now, chk: now, sig: sg, none: !!res.none, d, by: 'cloud', q: (d && d.q) || null };
  if (cur) await ref.update({ [`src.${src}`]: obj, ...(b.title && !cur.title ? { title: b.title } : {}), uploadedAt: FV.serverTimestamp() }); else await ref.set({ isbn: b.isbn, title: b.title || null, author: b.author || null, src: { [src]: obj }, ...W() }, { merge: true }); /* (1.59.0·0.11.0) 같은 책을 다른 출처가 막 만들었으면 그 출처 칸을 지우지 않게 */
  return prev ? 'changed' : 'new'; }
async function extOneC(X, src, b, cfg, keys) { const s = X.SOURCES[src]; const h = s.host;
  if (X.VIA_JOONGMO && X.VIA_JOONGMO.includes(src) && cfg.src.joongmo && cfg.src.joongmo.on) { let jm = null; try { const d = await C('ext_used').doc(b.isbn).get(); jm = d.exists && d.data().src ? d.data().src.joongmo : null; } catch (e) {} if (!jm) return { src, st: 'skip' }; if (jm.d && X.usedStats(jm.d, cfg.sim, cfg.usedMinPrice).match > 0) { extIdxSetC(X, src, b.isbn); return { src, st: 'viaJm' }; } }
  const at = Math.max(Date.now(), EXT_C.next[h] || 0); EXT_C.next[h] = at + s.paceMs * (0.8 + Math.random() * 0.4); if (at > Date.now()) await sleep(at - Date.now());
  let calls = 0; const httpF = async (o) => { calls++; if (calls > 1) await sleep(Math.min(s.paceMs, 1500)); return extHttp(o); };
  const res = await X.run(src, { isbn: b.isbn, title: b.title, author: b.author, keys, http: httpF, cache: EXT_C.cache, cfg }); if (calls > 1) EXT_C.next[h] = Math.max(EXT_C.next[h] || 0, Date.now() + s.paceMs); if (res.auth) { EXT_C.pauseUntil[src] = Date.now() + 10 * 60e3; return { src, st: 'skip', why: '키 문제 — ' + res.why }; } /* (0.13.6) 키 문제는 책 문제가 아님 — 책마다 미룸을 남기지 않고 10분 뒤(키를 다시 읽은 뒤) 다시 */
  if (res.skip) return { src, st: 'skip' }; let st; try { st = await extSaveC(X, src, b, res); } catch (e) { st = 'err'; res.ok = false; res.why = '저장 실패: ' + e.message; }
  if (calls) extUsedAddC(src, calls);
  if (st !== 'err' && st !== 'mismatch') { extIdxSetC(X, src, b.isbn); EXT_C.errs[src] = 0; if (EXT_C.pauseN) EXT_C.pauseN[src] = 0; }
  else { const k = Math.min(EXT_BACKOFF.length, extIdxErrKC(src, b.isbn) + 1); if (!/^저장 실패/.test(res.why || '')) extIdxSetC(X, src, b.isbn, `E ${extKst()} ${k}`); if (st === 'err') { EXT_C.errs[src] = (EXT_C.errs[src] || 0) + 1; if (res.limit) EXT_C.pauseUntil[src] = Date.now() + 6 * 3600e3; else if (EXT_C.errs[src] >= 5) { EXT_C.pauseN = EXT_C.pauseN || {}; const pn = EXT_C.pauseN[src] = Math.min(5, (EXT_C.pauseN[src] || 0) + 1); const ph = Math.min(24, 2 ** (pn - 1)); EXT_C.pauseUntil[src] = Date.now() + ph * 3600e3; EXT_C.errs[src] = 0; /* (1.72.2 · 클라우드 0.13.4) 계속 실패하는 출처는 쉬는 시간을 1→2→4→8→16시간으로 늘림(한 번이라도 되면 다시 1시간부터) */ log('외부 정보', s.label, `5번 잇달아 못 읽어 ${Math.round((EXT_C.pauseUntil[src] - Date.now()) / 3600e3)}시간 쉼 —`, res.why); } } }
  { const okR = st !== 'err'; const L0 = { at: nowIso(), ok: st !== 'err', st, why: st === 'err' || st === 'mismatch' ? String(res.why || '').slice(0, 200) : null, isbn: b.isbn, by: 'cloud', how: 'cloud' } ; /* (1.24.0 · 클라우드 0.12.2) 출처별 오늘 성공·실패 수(res) + 마지막 실패(lastErr — 성공이 와도 남음) → 웹앱 시장조사 탭 수집 현황에서 '매번 실패'를 바로 봄 */ EXT_RUN().set({ last: { [src]: L0 }, res: { [extKst()]: { [src]: { [okR ? 'ok' : 'err']: FV.increment(1) } } }, ...(okR ? {} : { lastErr: { [src]: L0 } }) }, { merge: true }).catch(() => {}); }
  return { src, st }; }
async function extFxC(X, keys) { const day = extKst(); const k = new Date(Date.now() + 9 * 3600e3); const hm = k.getUTCHours() * 60 + k.getUTCMinutes();
  const run = await EXT_RUN().get().catch(() => null); const F0 = (run && run.exists ? run.data().fx : null) || {}; const fxDay = F0.day || null; if (fxDay === day) return null; if (hm < 11 * 60 + 30 && F0.at && Date.now() - Date.parse(F0.at) < 6 * 3600e3) return null; if (F0.errAt && Date.now() - Date.parse(F0.errAt) < 3600e3) return null;
  const r = await X.fxRun({ keys, http: extHttp, day }); if (!r.ok) { await EXT_RUN().set({ fx: { err: r.why, errAt: nowIso() } }, { merge: true }).catch(() => {}); return r; }
  const ref = C('ext_fx').doc(r.date || day); const ex = await ref.get(); if (!ex.exists) await ref.set({ date: r.date || day, rates: r.rates, src: r.src, warn: r.warn || null, at: nowIso(), by: 'cloud', ...W() });
  await EXT_RUN().set({ fx: { day: hm >= 11 * 60 + 30 ? day : fxDay || null, date: r.date, src: r.src, usd: r.rates.USD, at: nowIso(), err: null } }, { merge: true }).catch(() => {}); return r; }
/* 맡음 이어 가기·놓기 — 늘 트랜잭션으로, 클라우드가 맡고 있을 때만 (그사이 PC가 맡았으면 건드리지 않음) */
async function extLeaseC(op) { let ok = false; try { await db.runTransaction(async (tx) => { const s = await tx.get(EXT_RUN()); const L = (s.exists && s.data().lease) || null; if (!L || L.pc !== 'cloud') return; tx.set(EXT_RUN(), { lease: { pc: 'cloud', tab: 'cloud', atMs: op === 'release' ? Date.now() - 5 * 60e3 : Date.now(), at: nowIso() } }, { merge: true }); ok = true; }); } catch (e) {} return ok; }
/* 이어 받기 한 번 (최대 budgetMs) — PC가 15분 넘게 맡지 않았을 때만 */
async function extCloud(budgetMs) { const X = await extMod(); if (!X) return { skip: '공용 파일 없음' }; let raw = {}; try { const d = await C('app_settings').doc('ext').get(); raw = d.exists ? d.data() : {}; } catch (e) {} const cfg = X.cfgOf(raw);
  if (!cfg.on) return { skip: '외부 정보 꺼짐' }; if (!(await cjobs()).all) return { skip: '☁ 클라우드 전체 꺼짐' }; if (raw.cloud !== true) return { skip: '클라우드 이어 받기 꺼짐(기본 · 설정 ⑱ 또는 ☁ 클라우드가 하는 일에서 켬)' }; /* (0.12.0) 기본 끔 — 켜 둔 때만 PC가 꺼져 있을 때 이어 받음 */
  let ok = false, holder = null; try { await db.runTransaction(async (tx) => { const s = await tx.get(EXT_RUN()); const L = (s.exists && s.data().lease) || null; holder = L; if (L && L.pc !== 'cloud' && Date.now() - (+L.atMs || 0) < 15 * 60e3) return; tx.set(EXT_RUN(), { lease: { pc: 'cloud', tab: 'cloud', atMs: Date.now(), at: nowIso() } }, { merge: true }); ok = true; }); } catch (e) { return { skip: '맡기 실패: ' + e.message }; }
  if (!ok) return { skip: `PC ${holder && holder.pc}가 맡는 중` };
  try { return await extCloudRun(X, cfg, budgetMs); } finally { await extLeaseC('release'); } } /* 어떻게 끝나든(오류·책 없음 포함) 맡음을 놓음 — PC가 바로 이어받게 */
async function extCloudRun(X, cfg, budgetMs) {
  const t0 = Date.now(); let leaseAt = Date.now(); const keys = await extKeysC(); await extUsedLoadC(); try { await extFxC(X, keys); } catch (e) { log('환율 실패', e.message); } await extIdxLoadC(X); const C0 = await extCandsC(X); if (!C0.length) return { skip: '책 없음' }; if (!(await extLeaseC('renew'))) return { skip: '맡음을 PC가 가져감' }; leaseAt = Date.now();
  const srcs = X.ORDER.filter((s) => cfg.src[s].on && X.keysReady(s, keys)); const tally = {}; const done = new Set(); const skipRun = {}; let guard = 0;
  while (Date.now() - t0 < budgetMs && guard++ < 2000) { let did = false; if (Date.now() - leaseAt > 60e3) { if (!(await extLeaseC('renew'))) break; leaseAt = Date.now(); } /* 1분마다 맡음 이어 가기 — PC가 그사이 맡았으면 멈춤 */
    for (const src of srcs) { if (Date.now() - leaseAt > 60e3) { if (!(await extLeaseC('renew'))) { guard = 1e9; break; } leaseAt = Date.now(); } if (done.has(src) || (EXT_C.pauseUntil[src] || 0) > Date.now() || (EXT_C.used[src] || 0) >= cfg.src[src].cap || (EXT_C.next[X.SOURCES[src].host] || 0) > Date.now()) continue;
      let i = EXT_C.cur[src] || 0, b = null; for (let n = 0; n < C0.length; n++, i++) { const x = C0[i % C0.length]; if (extEligibleC(X, src, x, cfg) && extDueC(src, x.isbn, cfg)) { b = x; i++; break; } } EXT_C.cur[src] = i % C0.length; if (!b) { done.add(src); continue; }
      const r = await extOneC(X, src, b, cfg, keys); did = true; const t = (tally[src] = tally[src] || {}); t[r.st] = (t[r.st] || 0) + 1; skipRun[src] = r.st === 'skip' ? (skipRun[src] || 0) + 1 : 0; if (skipRun[src] >= 20) done.add(src); /* 중고닷이 아직 안 본 책만 남음 — 이번 회차엔 그만(읽기 낭비 막기) */ if (Date.now() - t0 > budgetMs) break; }
    if (!did) { if (srcs.every((s) => done.has(s) || (EXT_C.pauseUntil[s] || 0) > Date.now() || (EXT_C.used[s] || 0) >= cfg.src[s].cap)) break; await sleep(400); } }
  const out = { at: nowIso(), ms: Date.now() - t0, books: C0.length, tally }; await EXT_RUN().set({ cloud: out }, { merge: true }).catch(() => {});
  log('외부 정보(클라우드 이어 받기)', JSON.stringify(out).slice(0, 400)); return out; }
let extNextAt = 0;
let kpbNextAt = 0; let mlNextAt = 0, learnNextAt = 0, lastDailyAt = Date.now(), dailyBusy = false;
/* (0.9.0) 무거운 하루 일(비용·결과 기록·배우기)은 주문 읽기(/tick)와 따로 /daily(10분마다 예약)에서 — 예전엔 1분 회차 끝에 붙어 있어, 길어지면 다음 회차(주문 읽기)를 건너뛰었음 */
/* (0.12.6) 🧹 원인·결과를 따지는 데 쓰지 않는 기계 기록만, 보관 기한이 지나고 '그 뒤에 끝낸 백업'에 이미 들어간 것만 지움 (정범 승인 2026-10-13)
 *  기준 = min(지금 − 보관 기한, 마지막으로 끝까지 받은 백업 때(app_settings/backup_log.last.at — 어느 기기든·전체든 바뀐 것만이든))
 *  → 백업을 안 받으면 아무것도 지우지 않음. 지운 수는 app_settings/retain_log 에 날짜별로 남김(지운 문서 이름 앞부분 일부도)
 *  · ext_probe(못 읽은 화면 사본) 14일 · perf_logs(속도 기록) 90일 · shp_snapshots(발송 요청 목록 판 — 같은 내용이 주문 문서에 있음) 90일 · bench_partial(절반도 못 읽은 회차의 상품 목록 — 통계에 안 씀) 30일 */
const RETAIN = [['ext_probe', 14], ['perf_logs', 90], ['shp_snapshots', 90], ['bench_partial', 30]]; let retainNextAt = 0;
async function retainSweep() { const bl = (await C('app_settings').doc('backup_log').get()).data() || {}; const end = bl.last && Date.parse(bl.last.at); if (!end) return { n: 0, skip: '백업 기록 없음 — 지우지 않음' };
  /* (0.12.7 자동 점검) 기준 = 백업을 '받기 시작한' 때(끝난 때가 아님 — 받는 동안·이어 받기 사이에 생긴 기록은 백업에 없을 수 있음) · 그 백업에 실제로 들어간 칸(last.cols)만 — 칸 목록이 없는 옛 백업 기록이면 지우지 않음 */
  const st = Date.parse(bl.last.startAt || ''); const last = st ? Math.min(st, end) : end; const cols = Array.isArray(bl.last.cols) ? bl.last.cols : null;
  const out = { n: 0, by: {}, more: false, backupAt: bl.last.at, startAt: bl.last.startAt || null }; const day = kstDay(Date.now());
  for (const [col, days] of RETAIN) { if (!cols || !cols.includes(col)) { (out.notInBackup = out.notInBackup || []).push(col); continue; } const cut = new Date(Math.min(Date.now() - days * 864e5, last)).toISOString(); const qs = await C(col).where('at', '<', cut).limit(300).get(); if (qs.empty) continue;
    const b = db.batch(); qs.docs.forEach((d) => b.delete(d.ref)); await b.commit(); out.n += qs.size; out.by[col] = { n: qs.size, cut, ids: qs.docs.slice(0, 5).map((d) => d.id) }; if (qs.size === 300) out.more = true; }
  if (out.n) await C('app_settings').doc('retain_log').set({ days: { [day]: FV.arrayUnion({ at: nowIso(), n: out.n, by: out.by, backupAt: out.backupAt }) } }, { merge: true }).catch(() => {});
  return out; }
async function dailyJobs() { if (dailyBusy) return { skipped: true }; dailyBusy = true; lastDailyAt = Date.now(); const out = {}; const J = await cjobs(); out.jobs = J;
  try { if (J.costs && Date.now() > costNextAt) { try { const r = await costDaily(4); out.costs = r; costNextAt = r.skip ? Date.now() + 15 * 60e3 : 0; if (r.done && r.done.length) log('비용 기록', JSON.stringify(r.done)); } catch (e) { costNextAt = Date.now() + 30 * 60e3; out.costsErr = e.message; log('비용 기록 실패', e.message); } }
    if (J.ml && Date.now() > mlNextAt) { try { const r = await mlDaily(); out.ml = r.skip ? undefined : r; mlNextAt = Date.now() + (r.skip ? 15 : 60) * 60e3; if (!r.skip) log('결과 기록', JSON.stringify(r).slice(0, 400)); } catch (e) { mlNextAt = Date.now() + 30 * 60e3; out.mlErr = e.message; log('결과 기록 실패', e.message); } }
    if (Date.now() > extNextAt) { try { const r = await extCloud(90e3); extNextAt = Date.now() + (r.skip ? 5 : 1) * 60e3; if (!r.skip) out.ext = { ms: r.ms, tally: r.tally }; else out.ext = r.skip; } catch (e) { extNextAt = Date.now() + 20 * 60e3; out.extErr = e.message; log('외부 정보 이어 받기 실패', e.message); } } /* (0.10.0) PC가 꺼져 있을 때만 */
    if (J.retain !== false && Date.now() > retainNextAt) { try { const r = await retainSweep(); retainNextAt = Date.now() + (r.more ? 15 : 360) * 60e3; if (r.n) { out.retain = r; log('보관 기한 지난 기계 기록 지움', JSON.stringify(r).slice(0, 300)); } } catch (e) { retainNextAt = Date.now() + 60 * 60e3; out.retainErr = e.message; log('보관 기한 정리 실패', e.message); } }
    if (J.kpb && Date.now() > kpbNextAt) { try { const r = await kpbTick(110e3); kpbNextAt = Date.now() + (r.backfillDone && !r.n ? 360 : 8) * 60e3; out.kpb = { n: r.n, have: r.have, ms: r.ms, err: r.err.slice(0, 5), backfillDone: r.backfillDone }; if (r.n) log('출판 정보 게시판', JSON.stringify(out.kpb).slice(0, 300)); } catch (e) { kpbNextAt = Date.now() + 30 * 60e3; out.kpbErr = e.message; log('출판 정보 게시판 실패', e.message); } } /* (0.15.0) 📰 처음엔 8분마다 이어 받기 · 다 받은 뒤엔 6시간마다 새 글 */
    if (J.kpb && Date.now() > kpbOcrNextAt) { try { const r = await kpbOcrTick(90e3); kpbOcrNextAt = Date.now() + (r.need > r.docs + r.skip ? 10 : 360) * 60e3; if (r.docs || r.err.length) { out.kpbOcr = r; log('그림 PDF 글자 읽기', JSON.stringify(r).slice(0, 300)); } } catch (e) { kpbOcrNextAt = Date.now() + 30 * 60e3; out.kpbOcrErr = e.message; log('그림 PDF 글자 읽기 실패', e.message); } } /* (0.16.2) 🔤 그림 PDF OCR */
    if (J.learn && Date.now() > learnNextAt) { try { const r = await mlLearn(); learnNextAt = Date.now() + (r.skip ? 20 : 120) * 60e3; if (!r.skip) { out.learn = r; log('스스로 배우기', JSON.stringify(r).slice(0, 400)); } } catch (e) { learnNextAt = Date.now() + 60 * 60e3; out.learnErr = e.message; log('스스로 배우기 실패', e.message); } }
  } finally { dailyBusy = false; } return out; }
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ''; if (ORIGINS.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  const path = (req.url || '/').split('?')[0];
  try {
    if (path === '/status' || path === '/') return send(200, { ok: true, lastDialog, loginFailMsg, ver: VER, code: CODE_SHA ? CODE_SHA.slice(0, 10) : 'main', cores: coreVer, login: loginFailAt ? 'fail' : 'unknown', hasCred: !!(ALADIN_ID && ALADIN_PW) });
    if (path === '/tick') { if (!keyOk(req)) return send(403, { ok: false, err: '열쇠가 맞지 않음' }); if (tickBusy) { if (Date.now() - tickAt > 10 * 60e3) { /* (0.12.3 전체 점검) 한 회차가 10분 넘게 안 끝나면(어딘가 응답 없이 멈춤) 스스로 다시 켬 — 예전엔 그 뒤 모든 회차를 '앞 회차가 도는 중'으로 건너뛰어 주문 읽기가 조용히 멈췄음 · 맡은 일은 정리·실행 기록(exec_log)이 지킴 */ console.error('tick 멈춤 10분 — 다시 켬'); try { await C('app_settings').doc('cloud').set({ ok: false, err: '회차가 10분 넘게 멈춰 클라우드를 다시 켬', at: new Date().toISOString() }, { merge: true }); } catch (e) {} setTimeout(() => process.exit(1), 500); } return send(200, { ok: true, skipped: '앞 회차가 아직 도는 중' }); } tickBusy = true; tickAt = Date.now(); try { const out = await serial(() => tick('schedule')); try { if ((await cjobs()).sweep) { const sw = await sysSweep(); if (sw.ev) out.sweep = sw; } } catch (e) { out.sweepErr = e.message; log('맡긴 일 살피기 실패', e.message); }
      if (Date.now() - lastDailyAt > 3 * 3600e3) { out.daily = await dailyJobs().catch((e) => ({ err: e.message })); } // 예비: /daily 예약이 3시간 넘게 없으면(예전 deploy) 여기서 — deploy.sh를 다시 돌리면 /daily가 따로 맡음
      return send(200, out); } finally { tickBusy = false; } }
    if (path === '/daily') { if (!keyOk(req)) return send(403, { ok: false, err: '열쇠가 맞지 않음' }); if (dailyBusy) return send(200, { ok: true, skipped: '앞 회차가 아직 도는 중' }); for (let w = 0; w < 25 && tickBusy; w++) await sleep(2000); /* (0.12.9) 1분 회차(주문 읽기)가 도는 중이면 끝나길 기다렸다가 — CPU 1개를 나눠 쓰며 회차를 길게 만들지 않게 */ const out = await dailyJobs(); return send(200, out); }
    if (path === '/ebay-del') { /* (0.13.6) 🛒 eBay '회원 탈퇴 알림' 받는 주소 — eBay가 Production 키를 켜려면 꼭 있어야 함(Marketplace Account Deletion)
       *  GET ?challenge_code= → sha256(challenge_code + 확인 토큰 + 이 주소)를 돌려줘 주인임을 증명 · POST(탈퇴 알림) → 받았다고 200만(우리는 eBay 회원 정보를 저장하지 않으므로 지울 것이 없음 · 받은 때만 기록)
       *  확인 토큰은 app_secrets/ebay_del.token(웹앱 설정 › 외부 정보에서 관리자 기기가 만들어 둠 — eBay 화면에 같은 값을 붙여 넣음) */
      const tk = await (async () => { if (EBAYDEL.t && Date.now() - EBAYDEL.at < 5 * 60e3) return EBAYDEL.t; try { const d = await C('app_secrets').doc('ebay_del').get(); EBAYDEL.t = (d.exists && d.data().token) || null; EBAYDEL.at = Date.now(); } catch (e) {} return EBAYDEL.t; })();
      const ep = 'https://' + String(req.headers.host || '') + '/ebay-del';
      if (req.method === 'GET') { const cc = new URL(req.url, 'http://x').searchParams.get('challenge_code') || ''; if (!cc || !tk) return send(400, { ok: false }); const h = require('crypto').createHash('sha256').update(cc + tk + ep).digest('hex'); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ challengeResponse: h })); }
      if (req.method === 'POST') { try { await bodyOf(req); } catch (e) {} try { await C('app_settings').doc('ebay_del').set({ lastAt: new Date().toISOString(), n: FieldValue.increment(1) }, { merge: true }); } catch (e) {} res.writeHead(204); return res.end(); }
      return send(405, { ok: false }); }
    if (path === '/diag') { /* (0.13.5) 🔎 읽기 전용 진단 — 대화 세션이 GitHub 자동 작업(diag.yml)을 거쳐 기록을 읽어 원인을 분석할 때만 · 열쇠는 해시만 코드에 · app_secrets·고객 문서는 읽지 않음 */
      /* 열쇠: 구글이 GitHub 자동 작업(gh-deployer, main 가지만)에 준 1회용 ID 토큰 — 구글 tokeninfo로 확인 · 비밀번호 저장 없음 */
      const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); let who = '';
      if (tok) { try { const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(tok)); const j = r.ok ? await r.json() : {}; if (j.email === 'gh-deployer@readnow-3a385.iam.gserviceaccount.com' && String(j.email_verified) === 'true' && String(j.aud || '') === 'readnow-diag' && Number(j.exp) * 1000 > Date.now()) who = j.email; } catch (e) {} }
      if (!who) return send(403, { ok: false });
      const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams); const out = { ok: true, at: new Date().toISOString() };
      const okPath = (p0) => /^(prd_jobs|prd_system|app_settings|rn_status|rn_logs|mkt_kpipa_ctg)\/[A-Za-z0-9_\-.]+$/.test(p0) && !/app_secrets|push_subs|secret|cred|_keys?$|apikey/i.test(p0); /* (자동 점검 2026-10-16) 알림 기기 구독(푸시 주소·열쇠)·키 문서는 진단으로 내보내지 않음 */
      if (q.doc) { const L = String(q.doc).split(',').filter(okPath).slice(0, 40); out.docs = {}; for (const p0 of L) { const d = await db.doc(p0).get(); out.docs[p0] = d.exists ? d.data() : null; } }
      if (q.logs) { const pc = String(q.pc || 'LOGGER'); const from = String(q.from || ''), to = String(q.to || '~'); const ss = await db.collection('rn_logs').where('slot', '>=', from).where('slot', '<=', to).get(); out.logs = []; ss.forEach((d) => { const v = d.data() || {}; if ((v.pc || String(d.id).split('_')[0]) === pc) out.logs.push({ id: d.id, slot: v.slot, lines: v.lines || [] }); }); out.logs.sort((a, b) => String(a.slot).localeCompare(String(b.slot))); }
      if (q.isbn) { const ss = await db.collection('prd_listings').where('isbn13', '==', String(q.isbn)).get(); out.listings = ss.docs.map((d) => { const v = d.data() || {}; return { id: d.id, status: v.status, active: v.active, qty: v.qty, lastSeenAt: v.lastSeenAt || null, registeredAt: v.registeredAt || null, soldAt: v.soldAt || null, usedCode: v.usedCode, price: v.price, grade: v.grade }; });
        const so = await db.collection('crm_orders').where('orderedAt', '>=', String(q.since || '2026-10-01')).get().catch(() => null); out.sales = []; if (so) so.forEach((d) => { const v = d.data() || {}; if (v.kind !== 'sale') return; for (const it of v.items || []) if (String(it.isbn13 || '') === String(q.isbn)) out.sales.push({ orderedAt: v.orderedAt, lineStatus: it.lineStatus, usedCode: it.aladinUsedCode || null, qty: it.qty || 1 }); }); /* 주문 시각·상태·상품 코드만(고객 정보 없음) */ }
      if (q.regitems) { /* 최근 등록 줄 — 조회 실패 까닭(고객 정보 없음) */ const ss = await db.collection('reg_items').orderBy('createdAt', 'desc').limit(+q.regitems || 30).get().catch((e) => ({ docs: [], err: e.message })); out.regItems = (ss.docs || []).map((d) => { const v = d.data() || {}; return { id: d.id, stage: v.stage, branch: v.branch, method: v.method || null, q: v.q || null, isbn: v.isbn || null, itemId: v.itemId || null, lookErr: v.lookErr || null, cands: (v.cands || []).slice(0, 5).map((c) => [c.itemId, c.title, c.cov]), info: v.info ? { title: v.info.title, itemId: v.info.itemId } : null, createdAt: v.createdAt || null, lookedAt: v.lookedAt || null, ws: v.ws || null, test: !!v.test }; }); }
      if (q.regq) { /* (0.13.7) 등록 조회 시험 — 상품명 검색이 왜 빈지(블루레이 등) */ try { out.regq = await serial(() => lookup({ branch: +q.br || 3, ...(q.asCode ? { isbns: [String(q.regq)] } : { queries: [String(q.regq)] }) })); } catch (e) { out.regq = { err: e.message }; }
        try { const p = await getPage(); out.regRaw = await p.evaluate(async (w, tg) => { const R = {}; for (const t of [tg, 'All', 'DVD', 'Blu-ray']) { try { const r = await fetch('/search/wsearchresult.aspx?SearchTarget=' + t + '&SearchWord=' + encodeURIComponent(w), { credentials: 'omit' }); const h = await r.text(); const d = new DOMParser().parseFromString(h, 'text/html'); const P = window.ReadnowProducts; const L = P && P.parseSearchResults ? P.parseSearchResults(d) : []; R[t] = { status: r.status, url: r.url, len: h.length, boxes: (h.match(/ss_book_box/g) || []).length, n: L.length, used: L.filter((x) => x.used).length, first: L.slice(0, 3), snip: (h.match(/ss_book_box[\s\S]{0,1500}/) || [''])[0].slice(0, 1500) }; } catch (e) { R[t] = { err: e.message }; } } return R; }, String(q.regq), { 1: 'Book', 2: 'Music', 3: 'DVD', 7: 'Foreign' }[+q.br || 3]); } catch (e) { out.regRaw = { err: e.message }; } }
      if (q.dump === 'listings') { const ss = await db.collection('prd_listings').get(); out.rows = ss.docs.map((d) => { const v = d.data() || {}; return [d.id, v.isbn13 || null, v.active === true ? 1 : v.active === false ? 0 : null, v.status || null, v.qty ?? null, v.lastSeenAt || null, v.registeredAt || null, v.price ?? null, v.grade || null, v.seenBy_scm || null, v.soldAt || null]; }); out.cols = ['id', 'isbn', 'active', 'status', 'qty', 'lastSeenAt', 'registeredAt', 'price', 'grade', 'seenBy_scm', 'soldAt']; }
      if (q.dump === 'orders') { const ss = await db.collection('crm_orders').where('orderedAt', '>=', String(q.since || '2026-09-01')).get(); out.rows = ss.docs.map((d) => { const v = d.data() || {}; return { id: d.id, kind: v.kind || null, pf: v.platform || null, at: v.orderedAt || null, st: v.status || v.stage || null, items: (v.items || []).map((it) => [it.lineStatus || null, it.aladinUsedCode || null, it.isbn13 || null, it.qty ?? null, it.price ?? null, it.condition || null, it.listingKey || null]) }; }); /* 주문 번호·고객 정보 없음 */ }
      if (q.dump === 'counts') { out.counts = {}; for (const c of ['prd_listings', 'crm_orders']) { try { out.counts[c] = (await db.collection(c).count().get()).data().count; } catch (e) { out.counts[c] = 'err ' + e.message; } } }
      if (q.scmreg) { /* (0.13.9) 샵매니저 상품등록(wrecord.aspx) 검색 방식 알아보기 — 읽기만(GET) · 화면 원문과 그 화면이 부르는 스크립트 중 검색 함수가 든 것 · (0.14.0) 로그인이 풀려 있으면 로그인 뒤 다시 */ try { const p = await getPage(); if (!(await loggedIn(p).catch(() => false))) await login(p); out.scmreg = await p.evaluate(async (u) => { const R = {}; const r = await fetch(u, { credentials: 'include', cache: 'no-store' }); const h = await r.text(); R.status = r.status; R.url = r.url; R.len = h.length; R.html = h.slice(0, 400000); const src = [...h.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]); R.src = src; R.js = {}; for (const s of src) { if (!/^\/|^https?:\/\/[^/]*aladin/i.test(s)) continue; try { const t = await (await fetch(s, { credentials: 'include' })).text(); if (/SearchISBN|SelectType|sISBN/i.test(t)) R.js[s] = t.slice(0, 200000); } catch (e) { R.js[s] = 'ERR ' + e.message; } } return R; }, String(q.scmreg === '1' ? '/scm/wrecord.aspx' : q.scmreg)); } catch (e) { out.scmreg = { err: e.message }; } }
      if (q.rawget) { /* (0.15.0) 출판 정보 게시판 화면 모양 확인 — kpipa.or.kr 쪽 공개 화면만(GET · 로그인 없음) */ out.rawget = {}; for (const u0 of String(q.rawget).split('|').slice(0, 6)) { const post = /^POST /.test(u0); const u = u0.replace(/^POST /, ''); try { const U = new URL(u); if (!/(^|\.)kpipa\.or\.kr$/i.test(U.hostname)) { out.rawget[u0] = { err: 'kpipa만' }; continue; } const r = await fetch(post ? U.origin + U.pathname : u, { method: post ? 'POST' : 'GET', body: post ? U.searchParams.toString() : undefined, headers: { ...(post ? { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}), 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', 'accept-language': 'ko-KR,ko;q=0.9' }, redirect: 'follow' }); const t = await r.text(); out.rawget[u0] = { status: r.status, url: r.url, len: t.length, ct: r.headers.get('content-type'), html: t.slice(0, 300000) }; } catch (e) { out.rawget[u0] = { err: e.message }; } } }
      if (q.kpbtest) { /* (0.15.0) 출판 정보 게시판 — 출처마다 목록 1·2쪽을 읽어 본 결과(저장 안 함) */ out.kpbtest = {}; for (const src of Object.keys(KPB_SRC)) { const R = {}; for (const pg of [1, 2]) { try { const u = kpbListUrl(src, pg); const H0 = await kpbGet(u.u, { post: u.post }); const L = kpbParseList(src, H0); const i0 = Math.max(H0.indexOf('fz-subject'), H0.indexOf('board-list-item'), H0.indexOf('goView')); R['p' + pg] = { n: L.rows.length, last: L.last, len: H0.length, snip: L.rows.length ? undefined : (i0 >= 0 ? H0.slice(i0, i0 + 700) : H0.slice(0, 900)), ids: L.rows.slice(0, 4).map((r) => r.id + ' ' + (r.date || '') + ' ' + String(r.title || '').slice(0, 30)) }; } catch (e) { R['p' + pg] = { err: e.message }; } } out.kpbtest[src] = R; } }
      if (q.mktchk) { /* (0.16.4) 주문확인요청 시장 줄 색·유의사항 점검 — 고객 정보 없이 상품 제목·판매자 줄만 */ try { const cc = (await C('shp_state').doc('confirm').get()).data() || {}; const qq = String(q.mktchk); const hits = []; for (const o of cc.orders || []) for (const it of o.items || []) { if (qq !== '*' && !String(it.title || '').includes(qq)) continue; hits.push({ lid: String(it.listingId || ''), title: it.title || null, grade: it.grade || null }); } if (!hits.length) { const sm = await C('shp_market').orderBy('at', 'desc').limit(+q.lim || 600).select('title', 'listingId', 'at').get(); const seen = new Set(); sm.forEach((d) => { const v = d.data() || {}; if (seen.has(v.listingId) || (qq !== '*' && !String(v.title || '').includes(qq))) return; seen.add(v.listingId); hits.push({ lid: String(v.listingId || ''), title: v.title || null, from: 'shp_market', at: v.at }); }); }
          out.mktchk = []; for (const h of hits.slice(0, +q.n || 6)) { const e = h.lid ? (await C('shp_enrich').doc(h.lid).get()).data() : null; const rows = (e && e.mkt && e.mkt.rows) || []; const scs = [...new Set(rows.map((r) => r.sc).filter((x) => x && x !== '0' && x !== '996008'))]; const ex = {}; if (scs.length) (await db.getAll(...scs.map((c) => C('sellers').doc('sc_' + c)))).forEach((d) => { const v = d.exists ? d.data() : null; ex[d.id.slice(3)] = v ? { keys: Object.keys(v).length, rate: v.tooltip ? 1 : 0, sales: v.salesCount ?? v.sales ?? null, at: v.updatedAt || v.at || null } : null; });
            const ui = h.lid ? (await C('prd_used_info').doc(h.lid).get()).data() : null; out.mktchk.push({ ...h, ui: ui ? { note: ui.note ?? null, checkedAt: ui.checkedAt || null, keys: Object.keys(ui).slice(0, 20) } : null, note: e ? e.note ?? null : 'enrich 없음', noteKeys: e ? Object.keys(e).filter((k) => /note|ui/i.test(k)) : [], uiNote: e && e.ui ? e.ui.note ?? null : null, mktAt: e && e.mkt ? e.mkt.at || null : null, rows: rows.slice(0, 15).map((r) => [r.r, r.n, r.sc, r.c]), sellers: ex }); } } catch (e) { out.mktchk = { err: e.message }; } }
      if (q.uiget) { /* (0.16.4) 우리 매물 상품 화면의 유의 사항 읽기 시험 — 고객 정보 없음 */ try { const p = await getPage(); if (!/aladin\.co\.kr/.test(p.url())) await p.goto(AL + '/home/welcome.aspx', { waitUntil: 'domcontentloaded' }); await ensureCores(p); out.uiget = await p.evaluate(async (lid) => { const r0 = await fetch('/shop/wproduct.aspx?ItemId=' + lid + '&_=' + Date.now(), { credentials: 'omit', cache: 'no-store' }); const html = await r0.text(); const d = new DOMParser().parseFromString(html, 'text/html'); const x = window.ReadnowProducts.parseUsedItemInfo(d, null); const i = html.indexOf('usedDecription'); const j = html.search(/유의\s*사항|상품\s*상태|구매\s*시\s*유의/); return { parsed: x, url: r0.url, len: html.length, box: i >= 0 ? html.slice(Math.max(0, i - 300), i + 2500) : null, near: j >= 0 ? html.slice(Math.max(0, j - 600), j + 2000) : null }; }, String(q.uiget)); } catch (e) { out.uiget = { err: e.message }; } }
      if (q.lst) { /* (0.16.5) 우리 매물 기록(prd_listings)의 칸 — 유의 사항이 어디에 있는지 */ try { const ss = await C('prd_listings').where('listingId', 'in', [String(q.lst), Number(q.lst)]).limit(3).get(); out.lst = ss.docs.map((d) => { const v = d.data() || {}; const o = {}; for (const [k, x] of Object.entries(v)) if (/note|desc|memo|cond|grade|title|state|사항/i.test(k)) o[k] = typeof x === 'string' ? x.slice(0, 300) : x; return { id: d.id, keys: Object.keys(v), pick: o }; }); if (!out.lst.length) { const d = (await C('prd_listings').doc(String(q.lst)).get()); out.lst = d.exists ? [{ id: d.id, keys: Object.keys(d.data()) }] : 'none'; } } catch (e) { out.lst = { err: e.message }; } }
      if (q.kpocr) { try { out.kpocr = await kpbOcrTick(+q.kpocr * 1000 || 60e3); } catch (e) { out.kpocr = { err: e.message }; } }
      if (q.kpbrun) { try { out.kpbrun = await kpbTick(+q.kpbrun * 1000 || 60e3); } catch (e) { out.kpbrun = { err: e.message }; } }
      if (q.kpkey) { try { const d = await kpinKey(); out.kpkey = { pub: d.pub, at: d.at }; } catch (e) { out.kpkey = { err: e.message }; } }
      if (q.kpq) { /* 요약할 글 — sumState 'need' 최신부터 · 본문 + 첨부 글자(앞부분) · 한 번에 글자 수 상한 */ try { const qs = await C('mkt_kpipa_posts').where('sumState', '==', 'need').limit(400).get(); const L = qs.docs.map((d) => ({ ...d.data(), _doc: d.id })).sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))); const cap = Math.min(4e6, (+q.kpcap || 1500) * 1000); let tot = 0; out.kpq = { left: L.length, posts: [] };
          for (const x of L.slice(0, +q.kpq || 20)) { const { getStorage } = require('firebase-admin/storage'); let full = ''; for (const a of x.atts || []) { if (!a.path || a.ext !== 'pdf') continue; try { const [b] = await getStorage().bucket(BUCKET).file(a.path + '.txt').download(); full += `\n[첨부 ${a.name} · ${a.pages || '?'}쪽]\n` + b.toString('utf8'); } catch (e) {} } const per = Math.min(+q.kpper || 400000, cap - tot); if (per < 2000) break; const body = String(x.body || ''); const t = full.slice(0, Math.max(0, per - body.length)); tot += body.length + t.length;
            out.kpq.posts.push({ doc: x._doc, id: x.id, src: x.srcName, title: x.title, date: x.date, cat: x.cat, url: x.url, atts: (x.atts || []).map((a) => ({ name: a.name, pick: a.pick, pages: a.pages, chars: a.chars, isbns: (a.isbns || []).length, err: a.err })), body, attText: t, attChars: full.length }); } } catch (e) { out.kpq = { err: e.message }; } }
      if (q.kpstat) { try { const st = (await C('app_settings').doc('kpb').get()).data() || {}; const cnt = {}; for (const s0 of Object.keys(KPB_SRC)) { const c1 = await C('mkt_kpipa_posts').where('src', '==', s0).count().get(); cnt[s0] = c1.data().count; } const need = (await C('mkt_kpipa_posts').where('sumState', '==', 'need').count().get()).data().count; out.kpstat = { st, cnt, need }; } catch (e) { out.kpstat = { err: e.message }; } }
      if (q.loginnow) { /* (0.16.2) 지금 한 번 로그인 시도(쉬는 시간 무시) — 주소 바꾼 뒤 확인용 */ try { const p = await getPage(); out.loginnow = { ok: await serial(() => login(p, true)), ip: await egressIp() }; } catch (e) { out.loginnow = { err: e.message, ip: egIp }; } }
      if (q.egress) { /* (0.16.1) 클라우드가 바깥으로 나갈 때의 인터넷 주소(알라딘이 보는 주소) */ try { const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(15000) }); out.egress = await r.json(); } catch (e) { out.egress = { err: e.message }; } }
      if (q.ebay) { /* eBay 키 시험 — 값은 돌려주지 않음(길이·Sandbox 여부·토큰 결과만) */ try { const d = await C('app_secrets').doc('ext').get(); const K = (d.exists && d.data().keys) || {}; const M = (d.exists && d.data().meta) || {}; const a = String(K.ebayAppId || '').trim(), c = String(K.ebayCertId || '').trim(); out.ebay = { appLen: a.length, certLen: c.length, sbx: /-SBX-/i.test(a), prd: /-PRD-/i.test(a), metaApp: M.ebayAppId || null, metaCert: M.ebayCertId || null };
          if (a && c) { const r = await fetch('https://api.ebay.com/identity/v1/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(a + ':' + c).toString('base64') }, body: 'grant_type=client_credentials&scope=' + encodeURIComponent('https://api.ebay.com/oauth/api_scope') }); const t = await r.text(); out.ebay.status = r.status; try { const j = JSON.parse(t); out.ebay.err = j.error || null; out.ebay.desc = j.error_description || null; out.ebay.ok = !!j.access_token; } catch (e) { out.ebay.body = t.slice(0, 200); } } } catch (e) { out.ebay = { err: e.message }; } }
      if (q.list) { const col = String(q.list); if (/^(prd_jobs|prd_system|app_settings|rn_status)$/.test(col)) { const ss = await db.collection(col).select().get(); out.ids = ss.docs.map((d) => d.id); } }
      return send(200, out); }
    if (path === '/kp-in') { /* (0.15.0) 📰 요약 넣기 — /diag와 같은 열쇠(GitHub 자동 작업의 1회용 ID 토큰)만 · 본문은 암호문 */ const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); let who = '';
      if (tok) { try { const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(tok)); const j = r.ok ? await r.json() : {}; if (j.email === 'gh-deployer@readnow-3a385.iam.gserviceaccount.com' && String(j.email_verified) === 'true' && String(j.aud || '') === 'readnow-diag' && Number(j.exp) * 1000 > Date.now()) who = j.email; } catch (e) {} }
      if (!who) return send(403, { ok: false }); try { const b = await bodyOf(req); const d = await kpinKey(); const J0 = JSON.parse(kpinOpen(d, String(b.k || ''), String(b.e || ''))); const r = await kpinApply(J0.items, J0.by || 'claude'); return send(200, { ok: true, ...r }); } catch (e) { return send(200, { ok: false, err: e.message }); } }
    if (path === '/billing') { const k = (String(req.url || '').match(/[?&]k=([A-Za-z0-9]+)/) || [])[1] || ''; const bk = billKey(); if (!bk || k.length !== bk.length || !require('crypto').timingSafeEqual(Buffer.from(k), Buffer.from(bk))) return send(403, { ok: false }); const b = await bodyOf(req); const out = await billingPush(b).catch((e) => ({ ok: false, err: e.message })); if (out.mtd != null) log('💳 실제 비용', out.ym, out.mtd); return send(200, out); } /* (0.12.4) Pub/Sub 밀어 주기 — 2xx면 다시 안 보냄 */
    const reqOff = async () => !(await cjobs()).req; const OFFMSG = { ok: false, off: true, err: '클라우드 설정(☁ 클라우드가 하는 일)에서 \'웹앱이 부르는 일\'을 꺼 둠' };
    if (path === '/kick') { await authUser(req); if (!(await cjobs()).cmds) return send(200, { ok: true, skipped: '맡긴 일 처리를 꺼 둠(☁ 설정)' }); KICK(); if (tickBusy) return send(200, { ok: true, queued: '도는 회차가 바로 처리 (빠른 고리)' }); tickBusy = true; tickAt = Date.now(); try { const out = await serial(() => tick('kick')); return send(200, out); } finally { tickBusy = false; } } // (0.9.0) 회차가 돌고 있으면 기다리지 않고 그 회차의 빠른 고리가 바로 처리
    if (path === '/regaux') { await authUser(req); if (await reqOff()) return send(200, OFFMSG); const b = await bodyOf(req); const out = await serial(() => regAux(b)); return send(200, out); } // (0.9.5) 📥 개별·미등록 등록: 분류·저자·출판사 찾기 (알라딘 팝업 대신)
    if (path === '/lookup') { await authUser(req); if (await reqOff()) return send(200, OFFMSG); const b = await bodyOf(req); const out = await serial(() => lookup(b)); return send(200, out); }
    if (path === '/inventory') { await authUser(req); if (await reqOff()) return send(200, OFFMSG); return send(200, await inventory()); }
    if (path === '/storage-files') { await authUser(req); if (await reqOff()) return send(200, OFFMSG); const b = await bodyOf(req); const pre = String(b.prefix || ''); if (!/^[A-Za-z0-9_\-\/]*$/.test(pre)) return send(400, { ok: false, err: '폴더 이름이 이상함' }); return send(200, { ok: true, files: await storageFiles(pre) }); }
    if (path === '/storage-get') { await authUser(req); if (await reqOff()) return send(200, OFFMSG); const b = await bodyOf(req); return send(200, { ok: true, files: await storageGet(b.names) }); }
    if (path === '/ppt') { const u = await authUser(req); if (await reqOff()) return send(200, OFFMSG); const b = await bodyOf(req); return send(200, await pptStore(b, u)); }
    if (path === '/spines') { await authUser(req); if (await reqOff()) return send(200, OFFMSG); const b = await bodyOf(req); if (!b.image) return send(400, { ok: false, err: '사진 없음' }); const out = await spines(String(b.image).replace(/^data:[^,]+,/, '')); return send(200, out); }
    if (path === '/test') { await authUser(req); const out = await serial(async () => { const p = await getPage(); try { await login(p, true); /* 사람이 누른 시험은 쉬는 시간과 상관없이 한 번 */ return { ok: true, login: 'ok', cores: coreVer }; } catch (e) { return { ok: false, login: 'fail', err: e.message }; } }); return send(200, out); }
    return send(404, { ok: false, err: '없는 주소' });
  } catch (e) { log('요청 실패', path, e.message); const code = Number.isInteger(e.code) && e.code >= 400 && e.code < 600 ? e.code : 500; /* (0.11.0) Firestore·Vision 오류의 작은 번호(3·14 등)를 HTTP 번호로 쓰면 서버가 꺼졌음 */ try { return send(code, { ok: false, err: e.message }); } catch (e2) { try { res.end(); } catch (e3) {} } }
});
server.listen(process.env.PORT || 8080, () => log(`readnow-cloud ${VER} 시작`));
