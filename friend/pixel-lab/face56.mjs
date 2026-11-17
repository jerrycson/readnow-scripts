import {form56}from './face-shape56.mjs';
// 55차 귀앞 단독 씬. 수동 표정 비교에서만 선택하며 중립은 입력 객체를 반환한다.
export function candidateFace56(lateral55,id,mode='source'){
 if(mode==='source'||id!=='F02')return lateral55;
 if(mode!=='fern05')throw RangeError('56차 얼굴 비교 방식을 확인하세요.');
 return form56(lateral55,id,{kind:'chinPad',opening:.48,width:1,inset:.024});
}
