// 자동 반영 길의 검증 대상 이름으로 정정 검사를 실행한다.
import fs from 'node:fs';
import './corrections57.mjs';
await import('./learning-manifests57.mjs');
const manifest=JSON.parse(fs.readFileSync(new URL('../../research/hub/releases.json',import.meta.url),'utf8'));
if(manifest.releases.some(r=>r.round===57))await import('./observation57.mjs');
