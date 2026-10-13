const fs=require('fs'); const O='/home/claude/w/out/', REPO='/home/claude/readnow-scripts/', FB=__dirname+'/fb/package/';
const main=fs.readFileSync(O+'readnow-collector.user.js','utf8'); const hEnd=main.indexOf('// ==/UserScript==');
const reqs=[...main.slice(0,hEnd).matchAll(/\/\/ @require\s+(\S+)/g)].map(m=>m[1]);
for (const u of reqs){ const m=u.match(/main\/([\w.-]+)/); let t; if(m) t=fs.readFileSync(fs.existsSync(O+m[1])?O+m[1]:REPO+m[1],'utf8'); else { const f=u.split('/').pop(); t=/firebase/.test(f)?fs.readFileSync(FB+f,'utf8'):''; } try{ new Function(t); }catch(e){ console.log('BAD',u,e.message);} }
try{ new Function(main.slice(hEnd)); }catch(e){console.log('BAD main', e.message)}
