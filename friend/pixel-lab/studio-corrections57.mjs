// 이전 공개 파일을 고치지 않는 추가 정정. 파일 SHA와 원래 행 전체가 같을 때만 적용한다.
const original=Object.freeze({id:'r56-56',subject:'W',episode:'B21 중립 정면 화면 오른쪽 어두운 골 최저점',source:'chest-eval56.json',unit:'px',task:'comparison',method:'direct',outcome:'measured',metricBefore:25,metricAfter:22,note:'측면 보호안, 일부 개선·전체 보류 · atlas:B21 · 실험 강제 적용값. 56 기본에서 미채택.',publicationPhase:'pre-publication',adoption:'not-approved'});
export const correction57=Object.freeze({id:'r57-correction-b21-dark-groove',at:'2026-11-18',rowId:original.id,
 sourceFile:'studio-training56.json',sourceSha256:'9a3f3f38cc3fd3e0415f59a564c5dca6878003ddb99dab072a3a021dd0d79e5b',
 excludeFromLearning:true,original,
 reason:'57차 정정 · 원도 하부선과 모델의 어두운 골은 같은 피부·가시 경계가 아니므로 형상 개선 학습·승격 근거에서 제외합니다. 25→22px는 당시 밝기 검출 출력으로 보존합니다.',
 evidence:'x344의 옛 y397은 전방 피부 4469번 면(n·view 0.703), 실제 가시선은 y449.51의 10217/10222번 면입니다. 명암선을 외곽선으로 해석한 대응이 무효이며 숫자 산출 오류로 바꾸지 않습니다.',
 retained:'r56-57의 5→7개 피크 열은 검출 기술값으로 유지합니다. 해부학적 이중 주름이나 형태 개선을 뜻하지 않습니다.'});
const fields=Object.keys(original);
function exactRow(row){const keys=Object.keys(row).filter(k=>k!=='learningCorrection');return keys.length===fields.length&&fields.every(k=>Object.hasOwn(row,k)&&row[k]===original[k]);}
const marker=Object.freeze({id:correction57.id,sourceFile:correction57.sourceFile,sourceSha256:correction57.sourceSha256,excludeFromLearning:true});
export function applyCorrections57(rows,{file,sha256}){
 return rows.map(row=>{
  if(row.id!==correction57.rowId)return row;
  if(file!==correction57.sourceFile||sha256!==correction57.sourceSha256)throw Error('정정 대상의 공개 원본 지문이 다릅니다.');
  if(!exactRow(row))throw Error('정정 대상의 원래 행 내용이 다릅니다.');
  return {...row,learningCorrection:{...marker}};
 });
}
export function learningCorrection(row){
 const mark=row.learningCorrection;if(mark==null)return null;
 if(!exactRow(row)||Object.keys(mark).length!==Object.keys(marker).length||Object.entries(marker).some(([k,v])=>mark[k]!==v))throw Error('검증하지 않은 학습 정정 표식입니다.');
 return correction57;
}
