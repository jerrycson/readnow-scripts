// 🔬 클라우드 /px 판단(pxJudge) 함수 단위 시험 — 쿠키·우리 기기·로봇·30분 같은 기기·첫 방문과 다음 방문이 같은 열쇠
const fs = require('fs'); const crypto = require('crypto');
const src = fs.readFileSync(__dirname + '/../cloud/index.js', 'utf8'); const a = src.indexOf('/* PXLIB-START'), b = src.indexOf('/* PXLIB-END */'); if (a < 0 || b < 0) { console.log('❌ t94c 실패 — PXLIB 칸 없음'); process.exit(1); }
const L = new Function(src.slice(a, b) + '\nreturn { pxJudge, pxCk, pxSetCk, PX_BOT };')(); const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const R = {}; const seen = new Map(); const SELF = new Set(); let now = Date.parse('2026-10-26T12:00:00Z');
const D = () => ({ now, hash, isSelf: (k) => SELF.has(k), seen });
const CH = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36'; const IPH = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari/604.1';
// 1) 첫 방문(쿠키 없음) → 사람 · 쿠키 둘(rnv·rnvp Partitioned) 심음 · 열쇠 = IP+UA 해시
const j1 = L.pxJudge({ lid: '404935000', ua: CH, ref: 'https://www.aladin.co.kr/', ip: '1.2.3.4', cookie: '' }, D());
R.first = { human: j1.inc.human, noCk: j1.inc.noCk, uniq: j1.inc.uniq, ck: j1.setCk.length, part: /Partitioned/.test(j1.setCk[1] || ''), same: /SameSite=None/.test(j1.setCk[0] || '') && /Secure/.test(j1.setCk[0]) && /Max-Age=31536000/.test(j1.setCk[0]) && /Path=\/px/.test(j1.setCk[0]), bk: j1.bk, al: j1.inc.fromAladin };
// 2) 같은 브라우저가 IP를 바꿔 쿠키를 들고 다시 옴 → 같은 열쇠(bk) · ck · 쿠키 다시 안 심음
const ck = j1.setCk.map((x) => x.split(';')[0]).join('; ');
now += 40 * 60e3; const j2 = L.pxJudge({ lid: '404935000', ua: CH, ref: '', ip: '5.6.7.8', cookie: 'foo=1; ' + ck }, D());
R.back = { sameKey: j2.bk === j1.bk, ck: j2.inc.ck, setCk: j2.setCk.length, uniq: j2.inc.uniq };
// 3) 30분 안 같은 기기(쿠키 없음 · 같은 IP+UA) → uniq 0 · 같은 열쇠
now += 5 * 60e3; const j3a = L.pxJudge({ lid: '404935001', ua: IPH, ref: '', ip: '9.9.9.9', cookie: '' }, D()); now += 60e3; const j3b = L.pxJudge({ lid: '404935001', ua: IPH, ref: '', ip: '9.9.9.9', cookie: '' }, D());
R.dup = { u1: j3a.inc.uniq, u2: j3b.inc.uniq, same: j3a.bk === j3b.bk, mob: j3a.inc.mobile };
// 4) 다른 브라우저(같은 IP·다른 UA) → 다른 열쇠
const j4 = L.pxJudge({ lid: '404935001', ua: CH, ref: '', ip: '9.9.9.9', cookie: '' }, D()); R.other = j4.bk !== j3a.bk;
// 5) 로봇 → bot · 열쇠 없음 · 쿠키 안 심음
const j5 = L.pxJudge({ lid: '404935000', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)', ip: '66.1.1.1' }, D()); const j5b = L.pxJudge({ lid: '404935000', ua: '', ip: '66.1.1.1' }, D());
R.bot = { b: j5.inc.bot, h: j5.inc.human || 0, bk: j5.bk, ck: j5.setCk.length, empty: j5b.inc.bot };
// 6) 우리 기기 — IP 등록(me.gif와 같은 계산) → ours · 사람 아님 · 열쇠 안 모음
const me = L.pxJudge({ lid: 'me', ua: CH, ip: '7.7.7.7', cookie: '' }, D()); SELF.add(me.ipk); SELF.add('c' + me.key);
const j6 = L.pxJudge({ lid: '404935000', ua: CH, ip: '7.7.7.7', cookie: '' }, D()); R.selfIp = { ours: j6.inc.ours, human: j6.inc.human || 0, bk: j6.bk };
// 7) 우리 기기 휴대폰이 데이터망으로 IP가 바뀜 — 쿠키로 알아봄
const meP = L.pxJudge({ lid: 'me', ua: IPH, ip: '10.0.0.1', cookie: '' }, D()); SELF.add(meP.ipk); SELF.add('c' + meP.key); const ckP = meP.setCk.map((x) => x.split(';')[0]).join('; ');
const j7 = L.pxJudge({ lid: '404935000', ua: IPH, ip: '211.234.1.1', cookie: ckP }, D()); R.selfCk = { ours: j7.inc.ours, human: j7.inc.human || 0 };
// 8) 쿠키를 막은 우리 휴대폰이 IP가 바뀜 → 놓침(손님으로 셈) — 화면 설명의 한계와 같음
const j8 = L.pxJudge({ lid: '404935000', ua: IPH, ip: '211.234.9.9', cookie: '' }, D()); R.miss = { human: j8.inc.human };
// 9) 샵매니저 화면 출처가 그대로 오면 ours
const j9 = L.pxJudge({ lid: '404935000', ua: CH, ref: 'https://www.aladin.co.kr/scm/wrecord.aspx?action=2', ip: '3.3.3.3' }, D()); R.scm = j9.inc.ours;
// 10) 쿠키 해석 — 이상한 값은 버림 · rnvp만 있어도 씀
R.ckp = [L.pxCk('rnv=zz; rnvp=0123456789abcdef').v, L.pxCk('rnv=zz; rnvp=0123456789abcdef').p, L.pxCk('xrnv=0123456789abcdef').v];
// 11) 30분 표가 끝없이 커지지 않음
now += 3 * 3600e3; L.pxJudge({ lid: '404935002', ua: CH, ip: '1.1.1.1' }, D()); R.seenSize = seen.size;
// 12) 한국 날짜
const k = L.pxJudge({ lid: '1', ua: CH, ip: '1' }, { now: Date.parse('2026-10-26T15:30:00Z'), hash, isSelf: () => false, seen: new Map() }); R.day = k.day;
// 13) 원문 IP·UA가 결과에 없음(해시만)
R.noRaw = !JSON.stringify([j1, j2, j6]).includes('1.2.3.4') && !JSON.stringify([j1]).includes('Chrome/130');
console.log(JSON.stringify(R));
const ok = R.first.human === 1 && R.first.noCk === 1 && R.first.uniq === 1 && R.first.ck === 2 && R.first.part && R.first.same && R.first.bk && R.first.bk.length === 10 && R.first.al === 1
  && R.back.sameKey && R.back.ck === 1 && R.back.setCk === 0 && R.back.uniq === 1 && R.dup.u1 === 1 && R.dup.u2 === 0 && R.dup.same && R.dup.mob === 1 && R.other
  && R.bot.b === 1 && R.bot.h === 0 && R.bot.bk === null && R.bot.ck === 0 && R.bot.empty === 1 && R.selfIp.ours === 1 && R.selfIp.human === 0 && R.selfIp.bk === null
  && R.selfCk.ours === 1 && R.selfCk.human === 0 && R.miss.human === 1 && R.scm === 1 && R.ckp[0] === null && R.ckp[1] === '0123456789abcdef' && R.ckp[2] === null && R.seenSize === 1 && R.day === '2026-10-27' && R.noRaw;
console.log(ok ? '✓ t94c 통과' : '❌ t94c 실패');
