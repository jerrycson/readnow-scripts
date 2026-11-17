import {deflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';

// Lossless embedded buffer. The figure uses actual software renderer pixels.
function png(width,height,rgba) {
 const crc=b=>{let c=-1;for(const v of b){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^-1)>>>0;};
 const chunk=(type,data)=>{const t=Buffer.from(type),len=Buffer.alloc(4),end=Buffer.alloc(4);len.writeUInt32BE(data.length);end.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([len,t,data,end]);};
 const head=Buffer.alloc(13);head.writeUInt32BE(width);head.writeUInt32BE(height,4);head[8]=8;head[9]=6;
 const row=width*4,scan=Buffer.alloc((row+1)*height),bytes=Buffer.from(rgba);
 for(let y=0;y<height;y++)bytes.copy(scan,y*(row+1)+1,y*row,(y+1)*row);
 return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}
const names={baseline40:'40차 기본형',held42:'42차 보류안',candidate47:'47차 후보'};
const labels=(x,y,t)=>'<text x="'+x+'" y="'+y+'">'+t+'</text>';
const svg=(w,h,title,content)=>'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img"><title>'+title+'</title><style>text{font-family:Malgun Gothic,Arial,sans-serif;fill:#24392f;font-size:15px}image{image-rendering:pixelated}</style><rect width="100%" height="100%" fill="#faf8f1"/>'+content+'</svg>';
const img=(uri,x,y,w,h)=>'<image href="'+uri+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="none"/>';
const poly=(ls,color,width)=>ls.map(l=>'<polyline points="'+l.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>').join('');
export function plate47(ref,paper,registered) {
 const bounds={B3:[90,76,179,142],S3:[4,47,73,113],A5:[70,81,165,147]};
 const cols=Object.entries(bounds),rows=['source',...Object.keys(names)];
 const original='data:image/webp;base64,'+readFileSync(new URL('../wallner-fig1-crop35.webp',import.meta.url)).toString('base64');
 let s='<defs><image id="plate" href="'+original+'" width="'+Math.round(2007*725/1280)+'" height="1143" preserveAspectRatio="none"/></defs>'+labels(18,28,'같은 카메라로 본 아래 경계 · 청록은 원도판 추적, 자주는 실제 메시의 가시선');
 for(const [i,[id]] of cols.entries())s+=labels(157+209*i,58,id+(id==='S3'?' 측면':' 사선'));
 for(const [r,name] of rows.entries()){
  const y=70+r*148;s+=labels(14,y+60,name==='source'?'Wallner 그림 1':names[name]);
  for(const [i,[id,[x0,y0,x1,y1]]] of cols.entries()){
   const w=x1-x0,h=y1-y0,cell=ref.paper[id],x=144+i*209;
   s+='<svg x="'+x+'" y="'+y+'" width="'+w*2+'" height="'+h*2+'" viewBox="'+[x0,y0,w,h].join(' ')+'">';
   if(name==='source'){s+='<use href="#plate" transform="translate(-'+cell.box[0]+' -'+cell.box[1]+')"/>';}
   else{
    const {width,height,rgb}=registered[name][id],rgba=Buffer.alloc(w*h*4);
    for(let v=0;v<h;v++)for(let u=0;u<w;u++){const at=4*(v*w+u),idx=3*((v+y0)*width+u+x0);for(let k=0;k<3;k++)rgba[at+k]=rgb[idx+k];rgba[at+3]=255;}
    s+=img(png(w,h,rgba),x0,y0,w,h)+poly(cell.lines,'#08837b',.55)+poly(paper[id][name].lines,'#974772',.5);
   }
   s+='</svg>';
  }
 }
 s+=labels(14,675,'Wallner 등 (2022), 그림 1 · CC BY 4.0 · 부분 확대, 선과 측정 창 추가')+
   '<a href="https://doi.org/10.1007/s00266-021-02753-y">'+labels(14,700,'출처 DOI 10.1007/s00266-021-02753-y')+'</a><a href="https://creativecommons.org/licenses/by/4.0/">'+labels(398,700,'이용허락 creativecommons.org/licenses/by/4.0/')+'</a>';
 return svg(791,716,'지정 도판과 40·42·47차 실렌더',s);
}
export function posePlate47(views,frames) {
 let s=labels(16,25,'같은 자세의 실제 픽셀 · 왼쪽 48픽셀 2배 확대, 오른쪽 192픽셀 원본에서 몸통 부분');
 for(const [i,key] of Object.keys(names).entries())s+=labels(196+i*249,53,names[key]);
 for(const [r,v] of views.entries()){
  const y=65+r*111;s+=labels(8,y+39,'수평 '+v.yaw+'° / '+v.pitch+'°')+labels(8,y+64,'양팔 '+v.arm+'°');
  for(const [j,key] of Object.keys(names).entries()){
   const x=155+j*249,a=frames[key][r][48],b=frames[key][r][192],crop=Buffer.alloc(134*103*4),bytes=Buffer.from(b.data);
   for(let h=0;h<103;h++){const off=((44+h)*192+24)*4;bytes.copy(crop,h*134*4,off,off+134*4);}
   s+=img(png(48,48,a.data),x,y,96,96)+img(png(134,103,crop),x+103,y,134,103);
  }
 }
 return svg(913,76+111*views.length,'중립·팔 올림과 보류 시점 실제 몸통 비교',s);
}
