export function alignment({top,chin,sole,centerX,cropLeft,cropRight},heads,size=512,mode='height'){
 if(![top,chin,sole,centerX,cropLeft,cropRight,heads,size].every(Number.isFinite)||!(top<chin&&chin<sole&&cropLeft<cropRight&&heads>=2&&size>0))throw new Error('머리끝 < 턱 < 발바닥 순서와 좌우 범위를 확인해 주세요.');
 const unit=(size-16)/(heads+1.1),modelTop=size/2-heads/2*unit;
 const factor=mode==='head'?unit/(chin-top):(heads*unit)/(sole-top);
 return {factor,dx:size/2-centerX*factor,dy:modelTop-top*factor,headRatio:(sole-top)/(chin-top),unit,modelTop,modelSole:modelTop+heads*unit};
}
