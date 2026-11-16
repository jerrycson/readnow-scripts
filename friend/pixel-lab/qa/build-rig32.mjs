import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {deflateSync} from 'node:zlib';
import {DATA} from '../continuous/mesh-data.mjs';

// Original CC0 MakeHuman vertex IDs are preserved in both adult forms.
const source = process.argv[2];
if (!source) throw Error('Pass the directory containing default.mhskel and default_weights.mhw');
const read = file => JSON.parse(readFileSync(join(source,file),'utf8'));
const {bones} = read('default.mhskel');
const {weights} = read('default_weights.mhw');
const count = DATA.forms.female.positions.length;
const roots = {neck:'neck01',jaw:'jaw'};
for (const [side,suffix] of [['left','.R'],['right','.L']]) {
  for (const [joint,bone] of Object.entries({shoulder:'upperarm01',elbow:'lowerarm01',wrist:'wrist',hip:'upperleg01',knee:'lowerleg01',ankle:'foot'})) roots[side+'.'+joint]=bone+suffix;
}
const total = new Float32Array(count);
for (const entries of Object.values(weights)) for (const [i,w] of entries) if (i<count) total[i]+=w;
const packed={};
for (const [key,root] of Object.entries(roots)){
  const column=new Float32Array(count);
  for(const [bone,entries] of Object.entries(weights)){
    let ancestor=bone;
    while(ancestor && ancestor!==root) ancestor=bones[ancestor]?.parent;
    if(!ancestor) continue;
    const neckFraction = root==='neck01' && /^neck0/.test(bone) ? Number(bone.at(-1))/4 : 1;
    for(const [i,w] of entries) if(i<count && total[i]) column[i]+=w*neckFraction/total[i];
  }
  packed[key]=deflateSync(Uint8Array.from(column,v=>Math.round(Math.min(1,v)*255)),{level:9}).toString('base64');
}
writeFileSync(new URL('../continuous/rig32-weights.mjs',import.meta.url),'// MakeHuman CC0, source and regeneration in qa/build-rig32.mjs.\nexport const packedWeights='+JSON.stringify(packed)+';\n');
