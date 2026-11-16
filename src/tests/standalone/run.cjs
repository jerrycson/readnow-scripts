'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
async function run() {
  const root = path.resolve(__dirname, '../../..'); const results = [];
  for (const file of ['stability.test.cjs', 'shelf.test.cjs', 'shop-page.test.cjs', 'token-store.test.cjs']) results.push(...await require('./' + file).run({ root }));
  const policy = require('../../tools/test-policy.cjs');
  for (const file of ['shop/shop.js', 'cloud/shop.js', 'src/app.html', 'readnow-exec-core.js', 'local/readnow-alps.js']) {
    results.push({ name: '시험 변경 감지: ' + file, ok: policy.CODE_RE.test(file) && policy.requiredTests([file]).length > 0 });
  }
  for (const file of ['shop/shop.js', 'shop/order-journal.js', 'cloud/shop-acct.js', 'cloud/shop.js', 'src/tests/standalone/account-auth-browser.cjs', 'src/tests/standalone/order-journal-browser.cjs']) results.push({ name: '계정 전환 주문 통합 시험 필수: ' + file, ok: policy.requiredTests([file]).includes('tACCOUNTAUTHUI') });
  for (const file of ['shop/token-store.js', 'shop/shop.js', 'shop/shop-acct.js', 'shop/shop-track.js', 'src/tests/standalone/token-store-browser.cjs']) results.push({ name: '로그인 거래 브라우저 시험 필수: ' + file, ok: policy.requiredTests([file]).includes('tTOKENSTORE') });
  const files = ['shop/shop-track.js', 'shop/token-store.js', 'shop/cart-store.js', 'shop/shop-acct.js', 'shop/order-journal.js', 'shop/shop.js', 'shop/shop-core.js', 'shop/shelf.js', 'readnow-exec-core.js', 'cloud/shop.js', 'cloud/index.js', 'local/readnow-alps.js', 'src/readnow-collector.src.js', 'src/tools/test-gate.js', 'src/tools/test-policy.cjs', 'hosting/build.js'];
  for (const f of files) { try { new vm.Script(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f }); results.push({ name: '구문: ' + f, ok: true }); } catch (e) { results.push({ name: f, ok: false, error: e.stack }); } }
  let n = 0; for (const m of fs.readFileSync(path.join(root, 'src/app.html'), 'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) { if (/\bsrc\s*=/.test(m[1]) || /application\/(?:ld\+)?json/.test(m[1])) continue; try { new vm.Script(m[2]); results.push({ name: '웹앱 스크립트 ' + ++n, ok: true }); } catch (e) { results.push({ name: '웹앱 스크립트 ' + ++n, ok: false, error: e.stack }); } }
  return results;
}
module.exports = { run };
if (require.main === module) run().then(r => { r.forEach(x => console.log((x.ok ? '✓ ' : '✗ ') + x.name + (x.error ? '\n' + x.error : ''))); console.log(r.filter(x => x.ok).length + '/' + r.length + ' 통과'); if (r.some(x => !x.ok)) process.exitCode = 1; }).catch(e => { console.error(e); process.exitCode = 1; });
