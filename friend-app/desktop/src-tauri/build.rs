fn main() {
    // 화면(원격 GitHub Pages 주소)이 부를 수 있는 명령은 friend_post 하나뿐 — capabilities/default.json의 allow-friend-post
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(&["friend_post"])))
        .expect("tauri build 실패");
}
