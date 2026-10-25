require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const got = []; const ch = { properties: { writeWithoutResponse: true }, writeValueWithoutResponse: async (b) => got.push(...b) };
    const dev = { name: 'P50 라벨기', addEventListener() {}, gatt: { connected: true, connect: async () => ({ getPrimaryServices: async () => [{ getCharacteristics: async () => [{ properties: { read: true } }, ch] }] }) } };
    Object.defineProperty(navigator, 'bluetooth', { value: { requestDevice: async () => dev }, configurable: true });
    localStorage.setItem('rn-label', JSON.stringify({ w: 40, h: 20, sku: true, title: true, mode: 'bt' }));
    await btConnect(true); await lblSend([{ sku: 'PNKa0001', ttl: '시험 상품', gr: '상' }], LBL(), 2);
    const txt = new TextDecoder('latin1').decode(new Uint8Array(got)); const head = txt.slice(0, 120); const tail = txt.slice(-30);
    const m = txt.match(/BITMAP 0,0,(\d+),(\d+),0,/); const wb = +m[1], H = +m[2]; const start = txt.indexOf(m[0]) + m[0].length; const bits = got.slice(start, start + wb * H); const black = bits.reduce((a, b) => a + (8 - b.toString(2).split('').filter((x) => x === '1').length), 0);
    // escpos
    const C = LBL(); C.bt.proto = 'escpos'; localStorage.setItem('rn-label', JSON.stringify(C)); got.length = 0; await lblSend([{ sku: 'PNKa0001', ttl: '', gr: '' }], LBL(), 1);
    return { head, tail, wb, H, blackDots: black, total: wb * H * 8, esc: got.slice(0, 10), escLen: got.length, cfg: LBL() }; });
  console.log(JSON.stringify(r, null, 1)); console.log('errors', errs);
});
