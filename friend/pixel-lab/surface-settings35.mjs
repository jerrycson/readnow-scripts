export const surfaceDefaults = Object.freeze({
  showNac:false, areolaDiameter:.5, areolaAspect:.5, nippleDiameter:.5, nippleHeight:.5, nippleShape:'dome'
});
export const surfaceAxes = [
  ['areolaDiameter','유륜 지름'],['areolaAspect','유륜 윤곽 · 가로 타원에서 세로 타원'],
  ['nippleDiameter','유두 지름'],['nippleHeight','유두 돌출']
];
export const tipShapes = [['dome','둥근 끝'],['plateau','평평한 끝'],['taper','좁아지는 끝'],['inset','중심 함입']];
export function surfaceValues(value={}){
  const settings={...surfaceDefaults,...value};
  if(typeof settings.showNac!=='boolean'||!tipShapes.some(([k])=>k===settings.nippleShape)||
    surfaceAxes.some(([k])=>!Number.isFinite(settings[k])||settings[k]<0||settings[k]>1))
    throw Error('유두·유륜 설정 범위를 확인해 주세요.');
  return Object.fromEntries(Object.keys(surfaceDefaults).map(k=>[k,settings[k]]));
}
