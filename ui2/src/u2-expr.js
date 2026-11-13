/* 리드나우 2 — 계산식 (설계안 5-6) · eval·new Function 없이 직접 읽는 작은 언어
 * 숫자·글('…' 또는 "…")·참/거짓 · + − × ÷ (* / 도 됨) % · 비교 > < >= <= = == != · 그리고/또는/아님 (&& || ! 도 됨) · 괄호
 * 이름: 변수 바·입력 위젯 값(U2.vars) · 자료 별칭(예 주문.전체수 — u2-data.js) · 점으로 이어 씀
 * 함수: 합 평균 개수 최대 최소 반올림(값,자리) 원(값) 퍼센트(a,b) 오늘() 날짜차(a,b) 만약(조건,가,나) 글(값) 숫자(값) 길이(값)
 * 0으로 나누면 결과 없음(—) · 결과 없는 값이 섞이면 결과 없음 · 너무 길거나 깊으면 멈춤(화면이 멈추지 않게) */
(function (root) {
  'use strict';
  const LIM = { len: 500, depth: 40, steps: 20000 }; /* 근거: 없음, 설정으로 바꿈 */
  const isId = (c) => /[\p{L}_$]/u.test(c), isIdN = (c) => /[\p{L}\p{N}_$]/u.test(c);
  const KW = { 그리고: '&&', 또는: '||', 아님: '!', 참: true, 거짓: false };
  function lex(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const n = Number(s.slice(i, j)); if (!isFinite(n)) throw new Error('숫자를 읽지 못함: ' + s.slice(i, j)); t.push({ k: 'n', v: n }); i = j; continue; }
      if (c === "'" || c === '"') { let j = i + 1, out = ''; while (j < s.length && s[j] !== c) { if (s[j] === '\\' && j + 1 < s.length) { out += s[j + 1]; j += 2; } else out += s[j++]; } if (j >= s.length) throw new Error('글 따옴표가 닫히지 않음'); t.push({ k: 's', v: out }); i = j + 1; continue; }
      if (isId(c)) { let j = i; while (j < s.length && (isIdN(s[j]) || (s[j] === '.' && isId(s[j + 1] || '')))) j++; const w = s.slice(i, j); i = j; if (w in KW) { const v = KW[w]; if (typeof v === 'boolean') t.push({ k: 'b', v }); else t.push({ k: 'o', v }); } else t.push({ k: 'id', v: w }); continue; }
      const two = s.slice(i, i + 2);
      if (['>=', '<=', '==', '!=', '&&', '||'].includes(two)) { t.push({ k: 'o', v: two }); i += 2; continue; }
      if ('+-*/×÷%<>=!(),'.includes(c)) { t.push({ k: 'o', v: c === '×' ? '*' : c === '÷' ? '/' : c === '=' ? '==' : c }); i++; continue; }
      throw new Error('모르는 글자: ' + c);
    }
    return t;
  }
  function parse(src) {
    src = String(src == null ? '' : src); if (src.length > LIM.len) throw new Error('식이 너무 김(' + LIM.len + '자 안)');
    const t = lex(src); let p = 0, depth = 0;
    const peek = () => t[p], is = (v) => t[p] && t[p].k === 'o' && t[p].v === v, eat = (v) => { if (!is(v)) throw new Error("'" + v + "'가 필요함"); p++; };
    const deep = (f) => { if (++depth > LIM.depth) throw new Error('식이 너무 깊음'); const r = f(); depth--; return r; };
    const bin = (next, ops) => () => { let l = next(); while (t[p] && t[p].k === 'o' && ops.includes(t[p].v)) { const o = t[p++].v; l = { t: 'bin', o, l, r: next() }; } return l; };
    const primary = () => deep(() => {
      const x = peek(); if (!x) throw new Error('식이 덜 끝남');
      if (x.k === 'n' || x.k === 's' || x.k === 'b') { p++; return { t: 'lit', v: x.v }; }
      if (is('(')) { p++; const e = expr(); eat(')'); return e; }
      if (is('-')) { p++; return { t: 'neg', e: primary() }; }
      if (is('!')) { p++; return { t: 'not', e: primary() }; }
      if (x.k === 'id') { p++; if (is('(')) { p++; const a = []; if (!is(')')) { a.push(expr()); while (is(',')) { p++; a.push(expr()); } } eat(')'); return { t: 'call', f: x.v, a }; } return { t: 'var', n: x.v }; }
      throw new Error("여기에 '" + x.v + "'는 올 수 없음");
    });
    const mul = bin(primary, ['*', '/', '%']), add = bin(mul, ['+', '-']);
    const cmp = () => { const l = add(); if (t[p] && t[p].k === 'o' && ['>', '<', '>=', '<=', '==', '!='].includes(t[p].v)) { const o = t[p++].v; return { t: 'bin', o, l, r: add() }; } return l; };
    const not = () => (is('!') ? (p++, { t: 'not', e: not() }) : cmp());
    const and = bin(not, ['&&']), or = bin(and, ['||']);
    const expr = () => deep(or);
    const ast = expr(); if (p < t.length) throw new Error("남은 글: '" + (t[p].v) + "'"); return ast;
  }
  const NIL = null;
  const isNil = (v) => v === null || v === undefined || (typeof v === 'number' && !isFinite(v));
  const toN = (v) => { if (typeof v === 'number') return v; if (typeof v === 'boolean') return v ? 1 : 0; if (typeof v === 'string') { const n = Number(v.replace(/[,₩원\s]/g, '')); return v.trim() !== '' && isFinite(n) ? n : NIL; } return NIL; };
  const flat = (a) => a.reduce((o, x) => o.concat(Array.isArray(x) ? x : [x]), []);
  const nums = (a) => flat(a).map(toN).filter((x) => !isNil(x));
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const FN = {
    합: (a) => nums(a).reduce((s, x) => s + x, 0),
    평균: (a) => { const n = nums(a); return n.length ? n.reduce((s, x) => s + x, 0) / n.length : NIL; },
    개수: (a) => flat(a).filter((x) => !isNil(x) && x !== '').length,
    최대: (a) => { const n = nums(a); return n.length ? Math.max(...n) : NIL; },
    최소: (a) => { const n = nums(a); return n.length ? Math.min(...n) : NIL; },
    반올림: ([v, d]) => { v = toN(v); if (isNil(v)) return NIL; const k = Math.pow(10, Math.max(0, Math.min(6, toN(d) || 0))); return Math.round(v * k) / k; },
    원: ([v]) => { v = toN(v); if (isNil(v)) return NIL; return (v < 0 ? '-' : '') + '₩' + Math.round(Math.abs(v)).toLocaleString('ko-KR'); },
    퍼센트: ([a, b]) => { a = toN(a); b = toN(b); if (isNil(a) || isNil(b) || b === 0) return NIL; return Math.round((a / b) * 1000) / 10; },
    오늘: () => ymd(new Date()),
    날짜차: ([a, b]) => { const x = Date.parse(a), y = Date.parse(b == null ? ymd(new Date()) : b); if (!isFinite(x) || !isFinite(y)) return NIL; return Math.round((y - x) / 864e5); },
    글: ([v]) => (isNil(v) ? '' : String(v)),
    숫자: ([v]) => toN(v),
    길이: ([v]) => (Array.isArray(v) ? v.length : isNil(v) ? 0 : String(v).length),
  };
  function run(ast, ctx) {
    let steps = 0; const get = (ctx && ctx.get) || (() => undefined);
    const ev = (n) => {
      if (++steps > LIM.steps) throw new Error('계산이 너무 많음');
      switch (n.t) {
        case 'lit': return n.v;
        case 'var': { const v = get(n.n); if (v === undefined) throw new Error('모르는 이름: ' + n.n); return v; }
        case 'neg': { const v = toN(ev(n.e)); return isNil(v) ? NIL : -v; }
        case 'not': return !truthy(ev(n.e));
        case 'call': {
          if (n.f === '만약') { if (n.a.length < 2) throw new Error('만약(조건, 가, 나)'); return truthy(ev(n.a[0])) ? ev(n.a[1]) : n.a[2] ? ev(n.a[2]) : NIL; }
          const f = FN[n.f]; if (!f) throw new Error('모르는 함수: ' + n.f); return f(n.a.map(ev));
        }
        case 'bin': {
          if (n.o === '&&') return truthy(ev(n.l)) && truthy(ev(n.r));
          if (n.o === '||') return truthy(ev(n.l)) || truthy(ev(n.r));
          const a = ev(n.l), b = ev(n.r);
          if (n.o === '==' || n.o === '!=') { const an = toN(a), bn = toN(b); const numLike = !isNil(an) && !isNil(bn) && !(typeof a === 'string' && typeof b === 'string'); const eq = numLike ? an === bn : String(a == null ? '' : a) === String(b == null ? '' : b); return n.o === '==' ? eq : !eq; }
          if (n.o === '+' && (typeof a === 'string' || typeof b === 'string') && (isNil(toN(a)) || isNil(toN(b)))) return (isNil(a) ? '' : String(a)) + (isNil(b) ? '' : String(b));
          const x = toN(a), y = toN(b); if (isNil(x) || isNil(y)) return n.o === '>' || n.o === '<' || n.o === '>=' || n.o === '<=' ? false : NIL;
          switch (n.o) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return y === 0 ? NIL : x / y; case '%': return y === 0 ? NIL : x % y; case '>': return x > y; case '<': return x < y; case '>=': return x >= y; case '<=': return x <= y; }
        }
      }
      throw new Error('읽지 못한 식');
    };
    return ev(ast);
  }
  const truthy = (v) => !(isNil(v) || v === false || v === 0 || v === '');
  const cache = new Map();
  const E = {
    parse, LIM, FN: Object.keys(FN).concat(['만약']),
    eval(src, ctx) { try { let a = cache.get(src); if (!a) { a = parse(src); if (cache.size > 500) cache.clear(); cache.set(src, a); } const v = run(a, ctx); return { v: isNil(v) ? null : v }; } catch (e) { return { v: null, err: e.message }; } },
    show(v) { if (v === null || v === undefined) return '—'; if (typeof v === 'boolean') return v ? '참' : '거짓'; if (typeof v === 'number') return (Math.round(v * 100) / 100).toLocaleString('ko-KR'); return String(v); },
    /* 글 속 {{식}}을 값으로 */
    fill(text, ctx) { return String(text == null ? '' : text).replace(/\{\{([^{}]{1,500})\}\}/g, (m, s) => { const r = E.eval(s.trim(), ctx); return r.err ? '⚠' + r.err : E.show(r.v); }); },
    truthy,
  };
  root.U2Expr = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
