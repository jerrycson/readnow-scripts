'use strict';
/* 운영 연결 없이 실제 공용 노트 화면을 두 탭에서 조작. Playwright와 브라우저 필요. */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { mockDb } = require('./stability.test.cjs');
const guard = require('../../../cloud/notes-guard.js');
async function run({ browser, shotPath, root = path.resolve(__dirname, '../../..') }) {
  const results = [], pages = [], errors = []; const db = mockDb({ 'jb_notes/j1': { kind: 'jbmemo', text: '처음 메모', state: 'open', at: '2026-01-01' }, 'jb_notes/slot_1': { kind: 'slot', slot: 1, draft: '' } });
  let fail = false; const docs = () => [...db.data].filter(([k]) => k.startsWith('jb_notes/')).map(([k, v]) => [k.slice(9), v]);
  const core = fs.readFileSync(path.join(root, 'src/notes-core.js'), 'utf8');
  const broadcast = async () => { for (const p of pages) if (!p.isClosed()) await p.evaluate(d => { window.testDocs = new Map(d); if (window.testChanged) window.testChanged(); }, docs()); };
  const make = async width => {
    const context = await browser.newContext({ viewport: { width, height: 900 } }); const p = await context.newPage(); p.setDefaultTimeout(5000); pages.push(p); p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>' }));
    await p.exposeFunction('testWrite', async ops => { if (fail) throw Error('가짜 저장 실패'); const r = await guard.write(db, id => db.collection('jb_notes').doc(id), ops, new Date().toISOString(), 'TEST'); await broadcast(); return r; });
    const mount = async () => { await p.addScriptTag({ content: core }); await p.evaluate(d => {
      window.testDocs = new Map(d); window.testUI = JBN.mount(document.querySelector('#root'), { docs: () => testDocs, onChange: f => { window.testChanged = f; }, write: ops => window.testWrite(ops), status: () => ({ ok: true, label: '가짜 저장소' }), send: () => window.testSend ? window.testSend() : Promise.resolve({ status: 'queued', via: 'outbox' }) });
    }, docs()); };
    await p.goto('http://notes.test/'); await mount(); p.testMount = mount; return p;
  };
  const a = await make(1100), b = await make(390);
  const test = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: e.stack }); } };
  const until = async fn => { for (let i = 0; i < 100; i++) { if (await fn()) return; await new Promise(r => setTimeout(r, 30)); } throw Error('조건 확인 시간 초과'); };
  const edit = async p => { await p.locator('[data-tab="mine"]').click(); await p.locator('[data-act="mtoggle"][data-mid="j1"]').click(); await p.locator('[data-act="medit"][data-mid="j1"]').click(); };
  await test('노트 화면: 빠른 연속 입력 뒤 마지막 초안 저장', async () => { await a.locator('#jbn-feed-ta').fill('하나'); await until(() => db.data.get('jb_notes/slot_1').draft === '하나'); await a.locator('#jbn-feed-ta').fill('하나 둘'); await a.locator('#jbn-feed-ta').fill('하나 둘 셋'); await until(() => db.data.get('jb_notes/slot_1').draft === '하나 둘 셋'); });
  await test('노트 화면: 두 탭 편집 충돌은 원문 보존·실패 글 표시', async () => { await edit(a); await edit(b); await a.locator('#jbn-med').fill('첫 탭에서 쓴 글'); await b.locator('#jbn-med').fill('둘째 탭에서 쓴 글'); await b.locator('[data-act="msave"]').click(); await until(() => db.data.get('jb_notes/j1').text === '둘째 탭에서 쓴 글'); await a.locator('[data-act="msave"]').click(); await a.locator('[aria-label="미저장 글"]').first().waitFor(); assert.equal(db.data.get('jb_notes/j1').text, '둘째 탭에서 쓴 글'); assert((await a.locator('[aria-label="미저장 글"]').evaluateAll(els => els.map(e => e.value))).some(x => x.includes('첫 탭에서 쓴 글'))); });
  await test('노트 화면: 저장 실패 뒤 새 메모는 다시 열어도 남음', async () => { fail = true; await b.locator('#jbn-mine-ta').fill('실패 뒤 복구할 메모'); await b.locator('[data-act="mineadd"]').click(); await b.locator('[aria-label="미저장 글"]').first().waitFor(); await b.reload(); await b.testMount(); assert((await b.locator('[aria-label="미저장 글"]').evaluateAll(els => els.map(e => e.value))).some(x => x.includes('실패 뒤 복구할 메모'))); fail = false; });
  if (shotPath) await b.screenshot({ path: shotPath, fullPage: true });
  await test('노트 화면: 같은 미저장 글 재시도로 한 번만 생성', async () => { fail = false; const buttons = b.locator('[data-act="recover"]'); await buttons.first().click(); await until(() => [...db.data.values()].some(x => x.text === '실패 뒤 복구할 메모')); assert.equal([...db.data.values()].filter(x => x.text === '실패 뒤 복구할 메모').length, 1); });
  await test('노트 화면: 대기 타이머 전에 닫아도 초안 저장', async () => { await b.locator('[data-tab="review"]').click(); await b.locator('#jbn-feed-ta').fill('닫기 직전 초안'); await b.evaluate(() => testUI.destroy()); await until(() => db.data.get('jb_notes/slot_1').draft === '닫기 직전 초안'); await b.testMount(); });
  await test('노트 화면: 보내기 응답을 기다리는 중 들어온 새 초안 보존', async () => {
    await b.evaluate(() => { window.testSend = () => new Promise(resolve => { window.finishSend = resolve; }); });
    await b.locator('[data-act="send"]').click(); await b.waitForFunction(() => !!window.finishSend);
    await guard.write(db, id => db.collection('jb_notes').doc(id), [{ op: 'merge', id: 'slot_1', base: { draft: '' }, data: { draft: '보내는 동안 다른 기기가 쓴 글' } }], 'later', 'OTHER'); await broadcast();
    await b.evaluate(() => { window.finishSend({ status: 'queued', via: 'outbox' }); window.testSend = null; });
    await until(() => [...db.data.values()].some(x => x.kind === 'batch')); assert.equal(db.data.get('jb_notes/slot_1').draft, '보내는 동안 다른 기기가 쓴 글');
  });
  await test('노트 화면: 쌓기 두 번에도 새 메모 한 건', async () => {
    await b.waitForFunction(() => !testUI.U.busy && document.querySelector('#jbn-feed-ta').value === '보내는 동안 다른 기기가 쓴 글'); await b.locator('#jbn-feed-ta').fill('두 번 눌러도 하나'); await b.locator('[data-act="feedmemo"]').click(); await b.locator('[data-act="feedmemo"]').click();
    await until(() => [...db.data.values()].some(x => x.kind === 'memo' && x.text === '두 번 눌러도 하나')); assert.equal([...db.data.values()].filter(x => x.kind === 'memo' && x.text === '두 번 눌러도 하나').length, 1);
  });
  await test('노트 화면: 모바일에서 미저장 안내 가로 넘침 없음', async () => { const size = await b.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth })); assert(size.width <= size.viewport + 1, JSON.stringify(size)); });
  await test('노트 화면: 브라우저 실행 오류 없음', () => assert.deepEqual(errors, []));
  for (const p of pages) await p.context().close(); return results;
}
module.exports = { run };
if (require.main === module) (async () => { const { chromium } = require('playwright'); const browser = await chromium.launch({ headless: true, ...(process.env.RN_BROWSER ? { executablePath: process.env.RN_BROWSER } : {}) }); try { const r = await run({ browser }); for (const x of r) console.log((x.ok ? '✓ ' : '✗ ') + x.name + (x.error ? '\n' + x.error : '')); if (r.some(x => !x.ok)) process.exitCode = 1; } finally { await browser.close(); } })().catch(e => { console.error(e); process.exitCode = 1; });
