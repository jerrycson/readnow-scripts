// 🐾 책방 친구 (윈도우) — 실행 파일 입구. 모든 일은 lib.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    readnow_friend_lib::run()
}
