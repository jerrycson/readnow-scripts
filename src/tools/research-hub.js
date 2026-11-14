#!/usr/bin/env node
/* 🔬 연구 모음 공개 판 만들기 — (11/11 일꾼 hub1 · 정범님 11/11 '전에 요청한 연구 자료들은 전부 어디 있어?')
 *  읽기: 비공개 연구 등록부 research/ENGINES/registry/studies.json (대화 저장소에만 있음)
 *  쓰기: facts-docs/research.json (공개 — 웹앱 📊 경영 › 🔬 연구 모음이 읽음)
 *  공개 판에는 연구마다 이름·물음 한 줄·상태·최신 결과 한 줄·웹앱 화면 열쇠·원본 위치(폴더 이름)만 — 손님·판매자 이름·대화·비밀값 없음
 *  시장 구조 연구(C로 시작하는 번호)는 이름·결과를 싣지 않고 '비공개'로만(공개 저장소에 그 가설을 올리지 않음)
 *  쓰는 법: node src/tools/research-hub.js <studies.json> [나갈 파일=facts-docs/research.json] [개인 정보 낱말 목록=…/secure/pii-words.txt]
 *  매일 엔진 한 걸음(비공개 저장소)이 등록부를 고친 뒤 이것을 돌리면 공개 판이 따라 바뀜 */
const fs = require('fs'); const path = require('path');
const [, , inF, outF0, piiF0] = process.argv;
if (!inF || !fs.existsSync(inF)) { console.error('등록부 파일을 주세요: node research-hub.js <studies.json>'); process.exit(2); }
const outF = outF0 || path.resolve(__dirname, '..', '..', 'facts-docs', 'research.json');
const piiF = piiF0 || [path.resolve(path.dirname(inF), '..', '..', '..', 'secure', 'pii-words.txt')].find((x) => fs.existsSync(x));
const R = JSON.parse(fs.readFileSync(inF, 'utf8'));

/* 연구마다 '무엇을 묻나'(사람이 고침) · 웹앱 화면 열쇠(open — 웹앱 RH_OPEN 이름) · 화면 없음이면 noScr에 까닭 */
const MAP = {
  R01: { q: '이 책을 지금 값에 올리면 곧 팔릴까, 얼마가 맞을까?', open: 'value' },
  R02: { q: '모은 시장 자료로 팔릴 확률을 스스로 배워 더 잘 맞히게 되나?', open: 'strategy' },
  R03: { q: '값을 언제·얼마로 바꾸면 순이익이 가장 큰가?', open: 'priceHist' },
  R04: { q: '7가지 전략 중 어느 것을 어느 무리에 붙이면 남는 돈이 늘까?', open: 'stratRun' },
  R05: { q: '정가보다 비싸게 팔리는 희귀본·절판본을 미리 알아볼 수 있나?', open: 'value' },
  R06: { q: '알라딘 세일즈포인트(수요 지수)가 우리 판매와 얼마나 맞물리나?', open: 'mkSp' },
  R07: { q: '상품 조회수가 판매를 미리 알려 주나 · 그림을 붙이면 조회가 느나?', open: 'pxExp' },
  R08: { q: '출판 시장 판매 흐름(분야·달)이 다음 달 우리 판매율을 맞히나?', open: 'kpipa' },
  R09: { q: '경쟁 판매자와 견준 이번 주 조언이 실제로 돈이 됐나?', open: 'strategy' },
  R10: { q: '출판 정보 글 중 우리 일에 쓸 만한 것을 사람 없이 골라낼 수 있나?', open: 'kpNews' },
  R11: { q: '알라딘 밖 출처(도서관·출판사 등)가 판단에 정말 보탬이 되나?', open: 'extHub' },
  R12: { q: '알라딘에 되팔면 받아 줄 확률과 받을 돈은 얼마인가?', open: 'aladinSell' },
  R13: { q: '판 값이 적정했나 — 엔진 평가가 정범님 평가와 맞나?', open: 'sevList' },
  R14: { q: '이 속도면 이번 달 매출은 얼마로 끝날까?', open: 'forecast' },
  R15: { q: '어떤 주문은 사람 없이 저절로 발송 요청해도 안전한가?', open: 'ship' },
  R16: { q: '값을 내리는 경쟁자에 어떻게 대응하면 순이익이 가장 큰가?', open: 'chase' },
  R17: { q: '바꾼 무리와 그대로 둔 같은 처지 무리를 견주면 효과가 정말 있나?', noScr: '⚡ 전략 실행·수동 일괄 그룹 안에 한 줄씩만 보임' },
  R18: { q: '실험이 하루 손해 한도(30일 일별 매출의 5%)를 넘지 않나?', noScr: '수동 일괄 그룹·전략 줄 안에 한 줄씩만 보임' },
  R19: { q: '미개봉·사인본·특전 같은 상태 글 요소가 값을 얼마나 바꾸나?', open: 'mkExtra' },
  R20: { q: '최저가 배지 같은 표시가 판매를 얼마나 늘리나?', open: 'value' },
  N01: { q: '무엇을 사들이면 가장 빨리·많이 남을까(추천만 · 돈 안 씀)?', noScr: '설계 단계' },
  N02: { q: '우리가 값을 바꾸면 경쟁자는 며칠 뒤 어떻게 따라오나?', noScr: '설계 단계' },
  N03: { q: '어느 경쟁 판매자가 곧 사라질까?', noScr: '설계 단계' },
  N04: { q: '값을 견줄 때 어느 판매자를 얼마나 믿어야 하나?', noScr: '그림자 셈(기록만) — 판매자 탭에 아직 화면 없음' },
  N05: { q: '요일·월급날·날씨·연휴 같은 때와 환경이 수요를 얼마나 바꾸나?', open: 'cons' },
  N06: { q: '구매평·문의 글을 보면 손님은 무엇을 가장 중요하게 보나?', open: 'voice' },
  N07: { q: '성공 기업 사례와 견줘 우리 기능에 빈 곳·뒤처진 곳은 어디인가?', open: 'benchCase' },
  N08: { q: '매출 상위 판매자는 무엇(분야·가격대·상태·SP)을 주력으로 하나 — 우리가 배울 것은?', open: 'sellerLearn' },
  N09: { q: '숍 앞 페이지(최근 등록 240개)에 어떤 종류가 놓이면 그 숍 전체 판매가 활발해지나?', open: 'sellerLearn' },
  N10: { q: '알라딘 화면이 바뀌어도 수집이 멈추지 않게 스스로 새 길을 찾나?', noScr: '진단·점검 문서(adapt_health)만 — 웹앱 화면은 아직' },
  N14: { q: '상품마다 궁금하게 만드는 소개 글(한 줄 · 키워드 10개 한 문장 · 판본 홍보)을 엔진이 사람·Claude만큼 쓰나?', open: 'aisum' },
  N11: { q: '구매자 나이·성별 분포와 함께 산 책이 판매 속도·값·매입값과 어떻게 이어지나?', open: 'sellerLearn' },
  N12: { q: '연구가 찾은 앞 페이지 전략대로 우리 상품을 다시 앞으로 올리면 정말 더 팔리나(상품 단위 · 견줄 무리와 채점)?', open: 'frontBump' },
  N13: { q: '끌올을 상품마다 언제·몇 번 했고, 끌올 뒤 정말 더 팔렸나(누적 판매율 차이·95% 신뢰 구간·유의 여부)?', open: 'bumpEff' }, /* (11/13 bump1) */
  N15: { q: '우리 상품의 판본(옛 판·새 판·다른 번역본·원서)은 모두 무엇이고, 새 판이 나왔나 — 엔진이 스스로 찾고 같은 책인지 판별하나?', open: 'edition' }, /* (11/14 edition1) */
};
/* 웹앱 쪽에서 쓰는 Firestore 요약 문서(있으면 그 문서의 at을 '마지막 갱신'으로 · 작은 문서만) */
const FS = { R12: 'buyback_stats', R19: 'extras_study', R20: 'badge_study', N06: 'voice_study', N07: 'bench_obs', N12: 'front_bump_eval', N13: 'front_bump_eval', N15: 'ed_study' }; /* (11/12 front1) seller_learn·seller_hyp는 커서 읽지 않음(웹앱이 at만 보려고 통째로 받음) */
/* 원본 위치 — 비공개 저장소의 폴더 이름만(파일 이름은 연구 폴더 안) */
const srcOf = (s) => { const D = (s.docs || []).map(String); const top = [...new Set(D.map((d) => (d.match(/^research\/([A-Z]+)\//) || [])[1]).filter(Boolean))]; return top.length ? top.map((t) => `research/${t}/`) : D.some((d) => /^reports\//.test(d)) ? ['reports/'] : []; };
const lvState = (s) => { const lv = String(s.level || ''); const L = s.metric && s.metric.last; if (L && L.value && !/첫 값 없음|꺼짐|배정 0/.test(L.value) && !/아직 안 돎/.test(lv)) return 'result'; /* 실험이 꺼졌거나 아직 안 돈 연구의 '0'은 결과로 치지 않음 */ if (/^L0|설계|아직 안 돎|멈춤/.test(lv)) return 'collect'; return 'run'; };
const out = { at: new Date().toISOString(), from: '연구 등록부(비공개) 요약', states: { run: '🔄 돌고 있음', collect: '📥 자료 모으는 중', result: '🟢 결과 있음' }, studies: [] };
for (const s of R.studies || []) {
  const id = String(s.id); const m = MAP[id] || {}; const L = (s.metric && s.metric.last) || null; const priv = /^C\d/.test(id);
  const row = { id, name: priv ? `🕵 시장 구조 연구 ${id}` : String(s.name || id), q: priv ? '물음·결과는 비공개 연구 폴더에만 둠(공개 판에 싣지 않음)' : m.q || '', lv: String(s.level || ''), st: lvState(s), at: (L && L.at) || (String(s.status || '').match(/\d{4}-\d{2}-\d{2}/) || [null])[0], last: priv ? (L ? '결과 있음 — 비공개' : '') : (L && L.value) || '', metric: priv ? '' : (s.metric && s.metric.primary) || '', src: srcOf(s), acts: priv ? '관찰' : String(s.acts || '') };
  if (!priv && m.open) row.open = m.open; else row.noScr = priv ? '비공개 연구(웹앱 화면 없음)' : m.noScr || '아직 웹앱 화면 없음';
  if (FS[id]) row.fs = FS[id]; out.studies.push(row);
}
/* 등록부 밖 재료 칸 — 🌦 기상청 날씨(소비심리 연구의 재료) */
out.studies.push({ id: 'W01', name: '🌦 기상청 날씨 — 소비심리 연구 재료', q: '지점마다 날마다 강수·기온·습도를 모아 날씨와 판매를 맞대 봄(N05의 재료)', lv: 'L0(모으기)', st: 'collect', at: null, last: '', metric: '', src: ['research/CONSUMER/'], acts: '관찰(모으기만)', open: 'wx', fs: 'wx_run' });
const txt = JSON.stringify(out, null, 1);
/* 공개 판 지킴 — 걸리면 쓰지 않음 */
const bad = [];
if (/01[016789]-?\d{3,4}-?\d{4}/.test(txt)) bad.push('휴대전화 번호 꼴');
if (/readnow-chats|정범님 \d|이 세션|유착|특혜|공모/.test(txt)) bad.push('비공개 저장소 이름·날짜 붙은 지시·비공개 가설 낱말');
if (piiF) { const W = fs.readFileSync(piiF, 'utf8').split(/\r?\n/).map((x) => x.trim()).filter((x) => x && !x.startsWith('#')); const hit = W.filter((w) => txt.includes(w)); if (hit.length) bad.push(`개인 정보 낱말 ${hit.length}개`); } else console.log('⚠ 개인 정보 낱말 목록을 못 찾아 이름 검사는 건너뜀 — 전화번호만 봄');
if (bad.length) { console.error('✗ 공개 판에 넣으면 안 되는 것: ' + bad.join(' · ') + ' — 쓰지 않음'); process.exit(1); }
fs.writeFileSync(outF, txt + '\n'); console.log(`✓ ${outF} — 연구 ${out.studies.length}개 · 화면 있음 ${out.studies.filter((x) => x.open).length} · 화면 없음 ${out.studies.filter((x) => x.noScr).length}`);
