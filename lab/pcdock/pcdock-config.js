/* pcdock-config.js — 🖥 PC 배치 도우미(pcdock) 판 번호·포트·자리 (정범님 11/12 'JS-MAIN 실행·배치 작은 창')
 *  · 판 번호 PCDOCK_VER는 웹앱 APP_VER·번외 COL2_VER와 따로(이 묶음만 · 새 판 받기가 이 값을 견줌)
 *  · 포트 8796 — 운영 인쇄 도우미 8898 · 로거 도우미 8899 · 번외 8797 과 겹치지 않음(쓰고 있으면 아무 빈 포트)
 *  · 자료 자리 %LOCALAPPDATA%\ReadNow\pcdock (설정 JSON · 비밀값 없음) */
'use strict';
module.exports = {
  PCDOCK_VER: '0.1.4',
  PORT: 8796,
  AVOID_PORTS: [8898, 8899, 8797],
  RAW: ['https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/lab/pcdock/', 'https://readnow.kr/lab/pcdock/'],
  /* 작은 창 크기(처음 화면) · 설정 창 크기 — 실제 화소가 아니라 윈도우 배율이 적용된 크기(크롬이 그렇게 받음) */
  WIN: { w: 340, h: 470 }, SET_WIN: { w: 1180, h: 760 }, CLEAN_WIN: { w: 560, h: 720 },
  IDLE_EXIT_MIN: 15, /* 창이 닫히고 이만큼 아무도 안 부르면 도우미도 스스로 꺼짐(메모리를 붙잡고 있지 않게) */
};
