'use strict';
// 변경 경로와 필수 회귀 시험은 공개 코드에서 같은 기준으로 고른다.
const CODE_RE = /^(src\/app\.html|src\/notes-core\.js|app\/|src\/readnow-collector\.src\.js|readnow-[a-z0-9-]+\.js$|cloud\/|local\/|shop\/|friend\/|src\/tests\/|src\/tools\/)/;
function requiredTests(files) {
  const out = new Set();
  if (files.some(f => /^(src\/(?:app\.html|notes-core\.js)|cloud\/(?:notes(?:-guard)?|index)\.js)$/.test(f))) ['tNOTESAFE', 'tNOTE2', 'tNOTE3', 'tNOTE4', 'tNOTE5', 'tNOTE5B', 'tNOTE5C', 'tNOTE6', 'tNOTE7'].forEach(t => out.add(t));
  if (files.includes('src/app.html')) out.add('tLIFECYCLE');
  if (files.some((f) => /^(shop\/|cloud\/shop(?:[.-]|\/)|src\/app\.html$)/.test(f))) ['tSHOP1111', 'tSHOPC1111', 'tSHELF1111', 'tSTOCKSAFE', 'tSHOPQTY_1113'].forEach((t) => out.add(t));
  if (files.some((f) => /^(src\/app\.html|src\/readnow-collector\.src\.js|readnow-exec-core\.js|local\/readnow-alps\.js|cloud\/index\.js)$/.test(f))) ['tSHIPMIX0', 'tSHIPHOLD1114', 'tSHIPPC', 'tSENDPREP1115'].forEach((t) => out.add(t));
  if (files.some((f) => /^(shop\/|src\/tests\/(?:tSHELFLIFE\.js|standalone\/shelf(?:-browser|\.test)\.cjs))/.test(f))) out.add('tSHELFLIFE');
  if (files.some((f) => /^(shop\/|src\/tests\/(?:tSHOPPAGE\.js|standalone\/shop-page(?:-browser|\.test)\.cjs))/.test(f))) out.add('tSHOPPAGE');
  if (files.some((f) => /^(cloud\/shop(?:-stock|-order-attempt)?\.js|src\/tests\/(?:tORDERRETRY\.js|standalone\/order-attempt\.test\.cjs))$/.test(f))) out.add('tORDERRETRY');
  if (files.some(f => /^(cloud\/shop(?:-acct|-account-orders)?\.js|shop\/shop-acct\.js|src\/tests\/(?:tACCOUNTORDERS\.js|standalone\/account-orders(?:-browser|\.test)\.cjs))$/.test(f))) ['tACCOUNTORDERS', 'tSHOP9_1112'].forEach(t => out.add(t));
  if (files.some(f => /^(cloud\/shop(?:-acct)?\.js|src\/tests\/(?:tACCOUNTIDENTITY\.js|standalone\/account-identity\.test\.cjs))$/.test(f))) ['tACCOUNTIDENTITY', 'tSHOP9_1112'].forEach(t => out.add(t));
  if (files.some(f => /^(cloud\/shop(?:-acct)?\.js|src\/tests\/(?:tACCOUNTSESSION\.js|tSHOPVIEW2_1114\.js|standalone\/account-session\.test\.cjs))$/.test(f))) ['tACCOUNTSESSION', 'tSHOP9_1112', 'tSHOPVIEW2_1114'].forEach(t => out.add(t));
  if (files.some(f => /^(shop\/(?:shop\.js|order-journal\.js|index\.html)|src\/tests\/(?:tORDERCLIENT\.js|standalone\/order-journal-browser\.cjs))$/.test(f))) out.add('tORDERCLIENT');
  if (files.some(f => /^(shop\/(?:shop\.js|order-journal\.js|index\.html)|cloud\/shop(?:-order-attempt)?\.js|src\/tests\/(?:tORDERINTEGRATED\.js|standalone\/order-contract-browser\.cjs))$/.test(f))) out.add('tORDERINTEGRATED');
  return [...out];
}
module.exports = { CODE_RE, requiredTests };
