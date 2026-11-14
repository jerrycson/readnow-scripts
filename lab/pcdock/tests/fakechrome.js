#!/usr/bin/env node
/* fakechrome.js — 시험용 가짜 크롬(0.1.4) · 받은 인자를 FAKE_CHROME_LOG에 한 줄씩 적고, FAKE_CHROME_MODE대로 '창'을 흉내
 *  ok(기본) = --app 주소를 불러 화면이 서버를 부른 것처럼 + FAKE_WIN 파일(창이 떠 있음) · dead = 아무것도 안 함(크롬 프로필이 닫히는 중이라 부탁이 사라짐)
 *  oncedead = 처음 한 번만 dead(FAKE_CHROME_LOG 줄 수로 셈) */
'use strict';
const fs = require('fs'), http = require('http');
const L = process.env.FAKE_CHROME_LOG; let n = 0; try { n = fs.readFileSync(L, 'utf8').split('\n').filter(Boolean).length; } catch (e) {}
if (L) fs.appendFileSync(L, JSON.stringify(process.argv.slice(2)) + '\n');
const mode = process.env.FAKE_CHROME_MODE || 'ok';
if (mode === 'dead' || (mode === 'oncedead' && n === 0)) process.exit(0);
const app = (process.argv.find((a) => a.startsWith('--app=')) || '').slice(6);
if (process.env.FAKE_WIN) fs.writeFileSync(process.env.FAKE_WIN, '1');
if (app) http.get(app, (r) => { r.resume(); r.on('end', () => process.exit(0)); }).on('error', () => process.exit(0)); else process.exit(0);
