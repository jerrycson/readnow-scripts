const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..');
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
    S.pbooks.set('b1', { id: 'b1', title: '소년이 온다', publisher: '창비', contributors: [{ name: '한강', role: '지은이' }] });
    S.pbooks.set('b3', { id: 'b3', title: '정의란', publisher: '김영사', contributors: [{ name: '마이클 샌델' }, { name: '헤르만 헤세' }] }); S.pbooks.set('b2', { id: 'b2', title: '코스모스', publisher: '사이언스북스', contributors: [{ name: '칼 세이건', role: '지은이' }, { name: '홍승수', role: '옮긴이' }] }); bump('p');
    OUT.p = ['소년이 온다 한강 장편소설 창비', '데미안 헤르만 헤세 지음 전영애 옮김 민음사', 'The Great Gatsby 위대한 개츠비 문학동네', '코스모스 칼 세이건 사이언스북스', '정의란 무엇인가 마이클 샌델 김영사', 'K-IFRS 법인세 회계 삼일인포마인'].map((x) => { const q = spineParse(x); return x + ' ⇒ ' + JSON.stringify({ t: q.title, o: q.orig, a: q.author, tr: q.trans, p: q.publisher }) + ' q1=' + spineQ1(q) + ' q2=' + spineQ2(q); });
    // 2단계 검색 흉내
    const rcalls = []; window.pptRemote = async (req, onPart) => { rcalls.push(req.queries); const cands = {}; for (const q of req.queries || []) cands[q] = /한강/.test(q) ? [{ itemId: 'A1', title: '소년이 온다', cov: 1 }, { itemId: 'A2', title: '소년이 온다 (큰글자)', cov: 0.9 }] : Array.from({ length: 8 }, (_, i) => ({ itemId: 'X' + i, title: '소년이 온다 ' + i, cov: 0.97 })); return { items: {}, cands, errs: {} }; };
    window.pptRecent = async () => ({}); S.pmLoaded = true; S.ppt = { mode: 'spine', items: [], spines: [] }; S.detail = { ppt: 1 };
    const sp = spineParse('소년이 온다 한강 장편소설 창비'); S.ppt.items = [{ n: 1, q: spineQ1(sp), raw: '소년이 온다 한강 장편소설 창비', sp, st: 'wait' }];
    await pptLookup([], [], [spineQ1(sp)]); const it = S.ppt.items[0]; OUT.calls = JSON.stringify(rcalls); OUT.after = JSON.stringify({ q: it.q, q2: it.q2, n: (it.cands || []).length, first: (it.cands || []).slice(0, 3).map((c) => c.itemId), st: it.st, itemId: it.itemId || null });
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await br.close(); })();`);
