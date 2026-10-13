/* ══════════ (1.7.0) 취소 목록 대조 — 안 팔린(판매중·일시판매중지) 상품 중 취소된 주문 줄과 상품 고유 정보로 정확히 맞는 것 ══════════
 * 맞춤 기준(하나라도 애매하면 넣지 않음 — 알아채기 전 취소가 아주 많아 '비슷함'으로는 표시하지 않음):
 *  ① 주문 줄의 알라딘 상품번호(aladinUsedCode)가 그 상품의 상품번호와 같음
 *  ② 상품번호가 없으면 ISBN + 관리코드 + 상태가 모두 같고, 그 셋이 같은 안 팔린 상품이 딱 하나일 때만
 *  어느 쪽이든 주문 시각이 그 상품 등록 시각보다 뒤여야 함(등록 전 주문은 다른 상품)
 * 취소 줄 = 판매 전 취소 주문(kind cancelledBeforeSale)의 모든 줄 + 판매 주문 안의 취소·품절취소·부분취소 줄
 * 기록: prd_cancel_hits/{상품 id} — 맞은 취소 줄을 쌓기만(arrayUnion · 지우지 않음) */
const CANCEL_LS = { cancelled: '취소', cancelledInOrder: '품절취소', partialCancelled: '부분취소' };
function cancelHits() { return memo('cancelHits', () => { const out = new Map(); if (!S.prodLoaded || !S.ordersLoaded) return out;
  const act = [...S.plist.values()].filter((l) => l.active); const byCode = new Map(act.filter((l) => l.usedCode).map((l) => [String(l.usedCode), l])); const byKey = new Map();
  act.forEach((l) => { if (!l.isbn13 || !l.sku) return; const k = l.isbn13 + '|' + l.sku + '|' + (l.grade || ''); byKey.set(k, (byKey.get(k) || []).concat([l])); });
  for (const o of S.orders.values()) { const pre = o.kind === 'cancelledBeforeSale'; if (!pre && o.kind !== 'sale') continue;
    (o.items || []).forEach((it, i) => { const ls = it.lineStatus; if (!pre && !CANCEL_LS[ls]) return;
      let l = null, how = null; if (it.aladinUsedCode && byCode.has(String(it.aladinUsedCode))) { l = byCode.get(String(it.aladinUsedCode)); how = '상품번호'; }
      else if (it.isbn13 && it.sku) { const L = byKey.get(it.isbn13 + '|' + it.sku + '|' + lineGrade(it)) || []; if (L.length === 1) { l = L[0]; how = 'ISBN·관리코드·상태'; } }
      if (!l) return; const od = String(o.orderedAt || ''); if (l.registeredAt && od && od.slice(0, 16) < String(l.registeredAt).slice(0, 16)) return;
      const kind = pre ? '판매 전 취소' : CANCEL_LS[ls]; const x = out.get(l.id) || { l, hits: [] }; x.hits.push({ o: String(o.orderNo || o.id), line: it.lineNo || i + 1, kind, at: od.slice(0, 16), how, price: it.price ?? null }); out.set(l.id, x); }); }
  for (const x of out.values()) { x.hits.sort((a, b) => b.at.localeCompare(a.at)); x.soldout = x.hits.some((h) => h.kind === '품절취소'); x.pre = x.hits.some((h) => h.kind === '판매 전 취소'); }
  return out; }); }
/* 맞은 것을 상품마다 기록(새로 맞은 줄만) — 10분에 한 번 · 자료가 바뀌었을 때만 */
async function cancelSync() { if (!S.prodLoaded || !S.ordersLoaded || S._cxBusy) return; const v = memoVer('cancelHits'); if (S._cxV === v && Date.now() - (S._cxAt || 0) < 600000) return; S._cxBusy = true;
  try { if (!S.cxDocs) { const M = new Map(); const qs = await db.collection('prd_cancel_hits').get(); qs.forEach((d) => M.set(d.id, d.data())); S.cxDocs = M; }
    const H = cancelHits(); const B = db.batch(); let n = 0; const AU = firebase.firestore.FieldValue.arrayUnion;
    for (const [id, x] of H) { const old = S.cxDocs.get(id); const have = new Set(((old && old.hits) || []).map((h) => h.o + '#' + h.line)); const add = x.hits.filter((h) => !have.has(h.o + '#' + h.line)); if (!add.length) continue;
      const doc = { listingId: id, usedCode: x.l.usedCode || null, isbn13: x.l.isbn13 || null, sku: x.l.sku || null, title: x.l.title || '', hits: AU(...add), lastAddAt: new Date().toISOString(), uploadedAt: TS() }; if (!old) doc.firstAt = new Date().toISOString();
      B.set(db.collection('prd_cancel_hits').doc(id), doc, { merge: true }); S.cxDocs.set(id, { ...(old || {}), hits: [...((old && old.hits) || []), ...add] }); if (++n >= 400) break; }
    if (n) await B.commit(); S._cxV = v; S._cxAt = Date.now(); } catch (e) { /* 권한·네트워크 — 화면 표시는 계산으로 그대로 */ } finally { S._cxBusy = false; } }
function cancelSlotHtml(compact) { if (!S.prodLoaded || !S.ordersLoaded) return compact ? '<div class="hint" style="margin:0">상품·주문 기록을 받는 중</div>' : ''; cancelSync(); const H = [...cancelHits().values()]; if (!H.length) return compact ? '<div class="hint" style="margin:0">취소 주문에 있던 판매중 상품 없음</div>' : '';
  const so = H.filter((x) => x.soldout).length; const pre = H.filter((x) => x.pre).length; const etc = H.filter((x) => !x.soldout && !x.pre).length;
  return `<button class="cxslot" data-cxopen="all"><b>⚠ 취소 주문에 있던 판매중 상품 ${num(H.length)}개</b><span>${so ? `<i class="x">품절취소 ${num(so)}</i> ` : ''}${pre ? `<i>판매 전 취소 ${num(pre)}</i> ` : ''}${etc ? `<i>그 밖 취소 ${num(etc)}</i>` : ''}</span><small>품절취소 = 주문은 왔는데 서가에서 못 찾아 취소한 것 — 지금도 판매중이면 유령 재고일 수 있음 → 서가 확인·판매중지 · 누르면 목록</small></button>`; }
function openCancelHits() { const H = [...cancelHits().values()].sort((a, b) => (b.soldout - a.soldout) || b.hits[0].at.localeCompare(a.hits[0].at));
  openListView({ title: '취소 주문에 있던 판매중 상품', rows: H, placeholder: '제목·관리코드·주문번호 검색', note: '안 팔린(판매중·일시판매중지) 상품 중, 취소된 주문 줄과 <b>상품번호</b> 또는 <b>ISBN·관리코드·상태</b>가 정확히 맞는 것만 모았습니다(비슷한 것은 넣지 않음 · 주문이 그 상품 등록 뒤일 때만). <b>품절취소</b>는 주문을 받고도 서가에서 못 찾아 취소한 것 — 지금도 판매중이면 서가에 없는 유령 재고일 수 있으니 확인하세요. <b>판매 전 취소</b>는 고객이 발송 전에 취소한 것 — 상품은 그대로 팔 수 있지만, 같은 상품이 여러 번 취소되면 가격·상태 설명을 다시 보세요. 이 기록은 상품마다 Firebase(prd_cancel_hits)에 쌓입니다.',
    filters: [['all', '전체'], ['so', '품절취소'], ['pre', '판매 전 취소'], ['etc', '그 밖 취소']], filterFn: (x, f) => (f === 'all' ? true : f === 'so' ? x.soldout : f === 'pre' ? x.pre : !x.soldout && !x.pre),
    text: (x) => `${x.l.title || ''} ${x.l.sku || ''} ${x.hits.map((h) => h.o).join(' ')}`, sum: (rs) => `${num(rs.length)}개 · 취소 줄 ${num(rs.reduce((a, x) => a + x.hits.length, 0))}개`,
    row: (x) => `<button class="item" data-pid="${esc(x.l.id)}"><span>${esc(x.l.title || '')} ${usedBtn(x.l)}<br><small>${esc(x.l.grade || '')} · ${esc(x.l.sku || '')} · 등록 ${esc(d10(x.l.registeredAt))} · ${x.hits.slice(0, 3).map((h) => `<b style="color:${h.kind === '품절취소' ? '#B0322A' : '#A8661B'}">${esc(h.kind)}</b> ${esc(h.at.slice(0, 10))} ${esc(h.o)} (${esc(h.how)})`).join(' · ')}${x.hits.length > 3 ? ` 외 ${x.hits.length - 3}` : ''}</small></span><span>${won(x.l.price)}</span></button>`,
    bind: (sh) => sh.querySelectorAll('[data-pid]').forEach((b) => (b.onclick = () => { openProduct(b.dataset.pid); })) }); }
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-cxopen]'); if (!b) return; e.preventDefault(); openCancelHits(); });
