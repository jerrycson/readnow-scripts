// pcbuild.js — 수집기를 띄우는 브라우저 시험(tj143·tlive)이 같이 쓰는 자리 찾기 (kfail2 11/17)
//  까닭: 두 시험이 옛 작업 자리(/home/claude/w/out/ · /home/claude/readnow-scripts/ · /home/claude/.npm-global)를 박아 두어 다른 컨테이너·시험 문지기 자리에서 바로 끝 코드 1
//  ① 저장소 뿌리 = 이 파일 위 두 칸(저장소 src/tests) 또는 시험 문지기 자리(Q/w/pw → Q) — split.js가 있는 쪽
//  ② 수집기 = 그 저장소의 src/readnow-collector.src.js를 src/split.js로 임시 폴더에 나눔(본체·모듈·pc-live-head.txt) — 판 낼 때와 같은 나누기
//  ③ Firebase compat 4파일(10.12.2 · 수집기 @require와 같은 판) = RN_FB 또는 이 폴더 fb/package 또는 ~/.cache/rn-gate/fb/package · 없으면 npm pack으로 받아 그 캐시에 둠
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = [path.join(__dirname, '..', '..'), path.join(__dirname, '..', '..', '..')].find((p) => fs.existsSync(path.join(p, 'src', 'split.js')) && fs.existsSync(path.join(p, 'src', 'readnow-collector.src.js')));
if (!ROOT) throw new Error('저장소 뿌리(src/split.js·src/readnow-collector.src.js)를 못 찾음');
function build() {
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-pcbuild-'));
  cp.execFileSync(process.execPath, [path.join(ROOT, 'src', 'split.js'), path.join(ROOT, 'src', 'readnow-collector.src.js'), T], { stdio: 'ignore' });
  if (!fs.existsSync(path.join(T, 'readnow-collector.user.js'))) throw new Error('split.js가 본체를 만들지 않음');
  return T + '/';
}
const FB_VER = '10.12.2', FB_FILES = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js', 'firebase-storage-compat.js'];
function fbDir() {
  const have = (d) => d && FB_FILES.every((f) => fs.existsSync(path.join(d, f)));
  const cache = path.join(os.homedir(), '.cache', 'rn-gate', 'fb', 'package');
  const found = [process.env.RN_FB, path.join(__dirname, 'fb', 'package'), cache].find(have); if (found) return found + '/';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-fb-'));
  cp.execSync(`npm pack firebase@${FB_VER} --silent`, { cwd: tmp, stdio: ['ignore', 'ignore', 'inherit'], timeout: 180e3 });
  const tgz = fs.readdirSync(tmp).find((f) => /\.tgz$/.test(f)); if (!tgz) throw new Error('npm pack firebase 실패');
  cp.execFileSync('tar', ['-xzf', tgz, ...FB_FILES.map((f) => 'package/' + f)], { cwd: tmp });
  fs.mkdirSync(cache, { recursive: true }); for (const f of FB_FILES) fs.copyFileSync(path.join(tmp, 'package', f), path.join(cache, f));
  fs.rmSync(tmp, { recursive: true, force: true });
  if (!have(cache)) throw new Error('Firebase compat 파일을 못 꾸림'); return cache + '/';
}
const playwright = () => require('playwright');
module.exports = { ROOT: ROOT + '/', build, fbDir, playwright };
