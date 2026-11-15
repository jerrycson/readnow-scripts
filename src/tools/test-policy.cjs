'use strict';
// 변경 경로와 필수 회귀 시험은 공개 코드에서 같은 기준으로 고른다.
const CODE_RE = /^(src\/app\.html|app\/|src\/readnow-collector\.src\.js|readnow-[a-z0-9-]+\.js$|cloud\/|local\/|shop\/|friend\/|src\/tests\/|src\/tools\/)/;
function requiredTests(files) {
  const out = new Set();
  if (files.some((f) => /^(shop\/|cloud\/shop(?:[.-]|\/)|src\/app\.html$)/.test(f))) ['tSHOP1111', 'tSHOPC1111', 'tSHELF1111'].forEach((t) => out.add(t));
  if (files.some((f) => /^(src\/app\.html|src\/readnow-collector\.src\.js|readnow-exec-core\.js|local\/readnow-alps\.js|cloud\/index\.js)$/.test(f))) ['tSHIPMIX0', 'tSHIPHOLD1114', 'tSHIPPC', 'tSENDPREP1115'].forEach((t) => out.add(t));
  if (files.some((f) => /^(shop\/|src\/tests\/(?:tSHELFLIFE\.js|standalone\/shelf(?:-browser|\.test)\.cjs))/.test(f))) out.add('tSHELFLIFE');
  if (files.some((f) => /^(shop\/|src\/tests\/(?:tSHOPPAGE\.js|standalone\/(?:shop-page(?:-browser|\.test)|token-store\.test)\.cjs))/.test(f))) out.add('tSHOPPAGE');
  if (files.some(f => /^(shop\/(?:shop\.js|shop-acct\.js|shop-core\.js|cart-store\.js|token-store\.js|order-journal\.js|index\.html)|src\/tests\/(?:tORDERCLIENT\.js|standalone\/order-journal-browser\.cjs))$/.test(f))) out.add('tORDERCLIENT');
  if (files.some(f => /^(shop\/(?:shop\.js|shop-acct\.js|shop-core\.js|cart-store\.js|token-store\.js|order-journal\.js|index\.html)|cloud\/shop(?:-order-attempt)?\.js|src\/tests\/(?:tORDERINTEGRATED\.js|standalone\/order-contract-browser\.cjs))$/.test(f))) out.add('tORDERINTEGRATED');
  if (files.some(f => /^(shop\/(?:cart-store|shop|shop-acct|shop-core|shelf)\.js|shop\/index\.html|src\/tests\/(?:tCARTSTORE\.js|standalone\/(?:cart-store|shelf-cart)-browser\.cjs))$/.test(f))) out.add('tCARTSTORE');
  if (files.some(f => /^(shop\/(?:shop-acct|token-store)\.js|cloud\/shop-acct\.js)$/.test(f))) out.add('tSHOP9_1112');
  if (files.some(f => /^(shop\/(?:shop-core|shop)\.js|src\/tests\/tSHOPQTY_1113\.js)$/.test(f))) out.add('tSHOPQTY_1113');
  if (files.some(f => /^(shop\/(?:shop|shop-acct|order-journal|token-store)\.js|cloud\/shop(?:-acct|-order-attempt|-account-orders|-stock)?\.js|src\/tests\/(?:tACCOUNTAUTHUI\.js|standalone\/(?:account-auth-browser|order-journal-browser|order-attempt\.test)\.cjs))$/.test(f))) out.add('tACCOUNTAUTHUI');
  return [...out];
}
module.exports = { CODE_RE, requiredTests };
