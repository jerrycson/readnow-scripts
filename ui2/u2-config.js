/* 리드나우 2 — 설정 한 곳 (이 파일만 바꾸면 불러올 곳이 바뀜)
 * U2_BASE: 지금 웹앱(배포본 app/)이 있는 주소 — 틀(index.html)·본문(readnow-webapp.js)·공용 파일(../readnow-*.js)을 여기서 '그대로 불러옴'(복사하지 않음)
 * 저장소를 옮겨도(readnow-ui2) 이 줄만 맞으면 됨 · 이 폴더 안 다른 경로는 모두 상대 경로 */
window.U2_VER = '0.4.15';
/* (0.4.14 priv1 11/13) readnow.kr/ui2/ 에서 열면 같은 주소의 지금 웹앱(readnow.kr/app/)을 불러옴 — 같은 출처라 로그인·기기 저장을 함께 씀 · 저장소 비공개(Pages 끔) 준비 · 다른 곳(옛 주소·시험)은 그대로 */
window.U2_BASE = (typeof location !== 'undefined' && location.hostname === 'readnow.kr') ? 'https://readnow.kr/app/' : 'https://jerrycson.github.io/readnow-scripts/app/';
