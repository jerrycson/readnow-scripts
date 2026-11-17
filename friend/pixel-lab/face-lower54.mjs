import {shape54}from './face-support54.mjs';import {contour54}from './face-contour54.mjs';
export const rules={F02:{support:{shelf:.135,side:.25,jawMix:.47,anchor:.25},contour:[.027625,.027625,-.031875,-.06375,-.034,.002125]},
 M01:{support:{shelf:.19,side:.23,jawMix:.72,anchor:.5},contour:[-.017,0,-.034,-.017,0,.034]}};
export function lower54(base,id,r){const rule=rules[id];return contour54(shape54(base,id,r,rule.support),rule.contour);}
