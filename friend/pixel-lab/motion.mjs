// A stance foot travels backward by one stride while the body advances.
// Coupling phase to measured stage displacement keeps that foot still on flat ground.
export function phaseFromDistance(phase,distance,stridePixels,stance){
 if(!Number.isFinite(stridePixels)||stridePixels<=0||!Number.isFinite(distance))return phase;
 return phase+Math.abs(distance)*Math.PI*2*stance/stridePixels;
}
