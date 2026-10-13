const fs = require('fs'); const s = fs.readFileSync('/home/claude/w/readnow-collector.user.js', 'utf8');
const a = s.indexOf('  let REGDOC = null, regUnsub = null;'); const b = s.indexOf('\n', s.indexOf('const pcCan = '));
const code = s.slice(a, b); global.window = global; 
const run = (withReg, doc) => { if (withReg) global.ReadnowRegistry = require('/home/claude/w/out/readnow-registry.js'); else delete global.ReadnowRegistry; const f = new Function(code + '; return (d) => { REGDOC = d; return pcCan; };')(); const pc = f(doc); return ['read', 'startDelivery', 'usedInfo', 'c2bAdd', 'lookup', 'metrics', 'market', 'aladinBuy', 'cashTest', 'permCheck', 'zzz'].map((t) => t + ':' + (pc(t) ? 'Y' : '-')).join(' '); };
console.log('noReg ', run(false, null)); console.log('reg   ', run(true, null)); console.log('lookOff', run(true, { overrides: { kinds: { lookup: { off: true } } } }));
