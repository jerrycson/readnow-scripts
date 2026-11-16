import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {DATA} from '../continuous/mesh-data.mjs';
const source=process.argv[2];
if(!source)throw Error('MakeHuman CC0 default_weights.mhw 폴더가 필요합니다.');
const weights=JSON.parse(readFileSync(join(source,'default_weights.mhw'),'utf8')).weights;
const count=DATA.forms.female.positions.length,regions={};
for(const [side,suffix] of [['right','.L'],['left','.R']]){
  const groups={chest:[/^breast$/],girdle:[/^clavicle$/,/^shoulder/],toes:[/^toe/]};
  for(let digit=1;digit<=5;digit++)for(let joint=1;joint<=3;joint++)groups['finger'+digit+'-'+joint]=[new RegExp('^finger'+digit+'-['+joint+'-3]$')];
  for(const [name,patterns] of Object.entries(groups)){
    const values=new Map();
    for(const [bone,entries] of Object.entries(weights)){
      if(!bone.endsWith(suffix)||!patterns.some(rx=>rx.test(bone.slice(0,-2))))continue;
      for(const [i,w] of entries)if(i<count)values.set(i,(values.get(i)||0)+w);
    }
    const pairs=[];
    for(const [i,w] of [...values].sort((a,b)=>a[0]-b[0])){
      const value=Math.round(255*Math.min(1,w));if(value)pairs.push([i,value]);
    }
    regions[side+'.'+name]=pairs;
  }
}
const entries=Object.entries(regions).map(([id,pairs])=>{
  const lines=[];
  for(let i=0;i<pairs.length;i+=12)lines.push('    '+pairs.slice(i,i+12).map(p=>JSON.stringify(p)).join(','));
  return '  '+JSON.stringify(id)+':[\n'+lines.join(',\n')+'\n  ]';
});
writeFileSync(new URL('../continuous/regions33.mjs',import.meta.url),'// CC0 MakeHuman. Each pair contains the original vertex index and its 0–255 weight.\nexport const regions={\n'+entries.join(',\n')+'\n};\n');
