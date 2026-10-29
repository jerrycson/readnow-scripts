//! 🐾 책방 친구 — 윈도우 바탕화면 프로그램 (Tauri 2 · WebView2)
//!
//! 이 프로그램은 '껍데기'뿐: 화면 전체(모니터 작업 영역)를 덮는 투명·테두리 없는·항상 위 창 하나에
//! GitHub Pages의 friend/index.html?host=tauri 를 엶 → 캐릭터 화면은 웹앱 판을 따라 늘 최신(이 껍데기는 거의 안 바뀜).
//! · 클릭 통과: 화면(JS)이 '눌리는 칸'(rects, CSS px)을 friend_post("rects")로 알려 줌 → 여기서 33ms마다 마우스 위치를 보고
//!   칸 안이면 창이 클릭을 받고(set_ignore_cursor_events(false)) 밖이면 뒤 프로그램으로 통과(true).
//! · 트레이: 보이기/숨기기 · 항상 위 · 모니터 바꾸기 · 시작 시 자동 실행 · 업데이트 확인 · 웹앱 열기 · 종료
//! · 연결 링크 readnow-friend://pair?t=…&c=…&d=… → 화면을 #pair=… 로 다시 엶(한 번만 쓰는 표 → 같은 계정 로그인)
//! · 껍데기 새 판: GitHub 판(friend-v…)을 6시간마다 확인 → …-setup.exe 를 받아 조용히(/S) 설치하고 다시 켬
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};
use tauri_plugin_autostart::ManagerExt as AutostartExt;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_opener::OpenerExt;

const PAGE: &str = "https://jerrycson.github.io/readnow-scripts/friend/index.html?host=tauri";
const WEBAPP: &str = "https://jerrycson.github.io/readnow-scripts/app/";
const RELEASES_API: &str = "https://api.github.com/repos/jerrycson/readnow-scripts/releases?per_page=30";
const LABEL: &str = "friend";
const VER: &str = env!("CARGO_PKG_VERSION");

/// 화면이 알려 준 눌리는 칸
#[derive(Default)]
struct Hit {
    rects: Vec<[f64; 4]>,
    ignoring: bool,
    /// 글 칸(입력칸)에 커서가 있는 동안 — 칸 밖으로 마우스가 가도 창이 키보드·클릭을 계속 받음
    kb_focus: bool,
}

#[derive(Default, Serialize, Deserialize, Clone)]
struct Prefs {
    monitor: Option<String>,
    on_top: Option<bool>,
    auto_set: Option<bool>,
}

struct App {
    hit: Mutex<Hit>,
    prefs: Mutex<Prefs>,
    hidden: AtomicBool,
    bye: AtomicBool,
}

fn prefs_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    app.path().app_config_dir().ok().map(|d| d.join("friend.json"))
}
fn load_prefs(app: &AppHandle) -> Prefs {
    prefs_path(app)
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}
fn save_prefs(app: &AppHandle) {
    let st = app.state::<Arc<App>>();
    let p = st.prefs.lock().unwrap().clone();
    if let Some(path) = prefs_path(app) {
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        let _ = std::fs::write(path, serde_json::to_string_pretty(&p).unwrap_or_default());
    }
}

/// 화면 → 프로그램 (원격 화면이 부를 수 있는 단 하나의 명령 · capabilities/default.json)
#[tauri::command]
fn friend_post(app: AppHandle, kind: String, data: serde_json::Value) {
    let st = app.state::<Arc<App>>();
    match kind.as_str() {
        "rects" => {
            let mut v = Vec::new();
            if let Some(arr) = data.get("r").and_then(|x| x.as_array()) {
                for r in arr.iter().take(200) {
                    if let Some(a) = r.as_array() {
                        if a.len() == 4 {
                            let f = |i: usize| a[i].as_f64().unwrap_or(0.0);
                            v.push([f(0), f(1), f(2), f(3)]);
                        }
                    }
                }
            }
            st.hit.lock().unwrap().rects = v;
        }
        "focus" => {
            // 글 칸에 들어가면(on) 창을 앞으로 세우고 클릭·키를 받음 · 나오면(off) 칸 밖 규칙으로 돌아감
            let on = data.get("on").and_then(|x| x.as_bool()).unwrap_or(false);
            st.hit.lock().unwrap().kb_focus = on;
            if on {
                if let Some(w) = win(&app) {
                    let _ = w.set_ignore_cursor_events(false);
                    let _ = w.set_focus();
                }
            }
        }
        "open" => {
            if let Some(u) = data.get("url").and_then(|x| x.as_str()) {
                if u.starts_with("https://") {
                    let _ = app.opener().open_url(u, None::<&str>);
                }
            }
        }
        "byeok" => st.bye.store(true, Ordering::SeqCst),
        _ => {} // ready · paired · notify · signout — 윈도우는 화면이 직접 보여 줌
    }
}

fn win(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(LABEL)
}

fn js(app: &AppHandle, code: &str) {
    if let Some(w) = win(app) {
        let _ = w.eval(code);
    }
}

/// 고른 모니터의 작업 영역(작업 표시줄 뺀 곳)에 창을 맞춤 — 배율(DPI)이 달라도 물리 픽셀로
fn fit_to_monitor(app: &AppHandle) {
    let Some(w) = win(app) else { return };
    let mons = w.available_monitors().unwrap_or_default();
    if mons.is_empty() {
        return;
    }
    let want = app.state::<Arc<App>>().prefs.lock().unwrap().monitor.clone();
    let m = want
        .and_then(|n| mons.iter().find(|m| m.name().map(|x| x == &n).unwrap_or(false)).cloned())
        .or_else(|| w.primary_monitor().ok().flatten())
        .unwrap_or_else(|| mons[0].clone());
    let wa = m.work_area();
    let _ = w.set_position(PhysicalPosition::new(wa.position.x, wa.position.y));
    let _ = w.set_size(PhysicalSize::new(wa.size.width, wa.size.height));
    let sf = m.scale_factor();
    js(
        app,
        &format!(
            "window.__rnFriendCmd&&window.__rnFriendCmd('geom',{{x:{},y:{},w:{},h:{},scale:{},monitors:{}}})",
            wa.position.x,
            wa.position.y,
            wa.size.width,
            wa.size.height,
            sf,
            mons.len()
        ),
    );
}

fn next_monitor(app: &AppHandle) {
    let Some(w) = win(app) else { return };
    let mons = w.available_monitors().unwrap_or_default();
    if mons.len() < 2 {
        js(app, "typeof toast==='function'&&toast('🖥 모니터가 하나뿐이에요')");
        return;
    }
    let cur = w.current_monitor().ok().flatten().and_then(|m| m.name().cloned());
    let i = mons.iter().position(|m| m.name().cloned() == cur).unwrap_or(0);
    let n = &mons[(i + 1) % mons.len()];
    app.state::<Arc<App>>().prefs.lock().unwrap().monitor = n.name().cloned();
    save_prefs(app);
    fit_to_monitor(app);
}

/// 클릭 통과: 33ms마다 마우스가 눌리는 칸 안인지 봄
fn hit_loop(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(33));
        let Some(w) = win(&app) else { continue };
        let st = app.state::<Arc<App>>();
        let (Ok(cur), Ok(pos), Ok(sf)) = (w.cursor_position(), w.inner_position(), w.scale_factor()) else { continue };
        let x = (cur.x - pos.x as f64) / sf;
        let y = (cur.y - pos.y as f64) / sf;
        let mut h = st.hit.lock().unwrap();
        let inside = !st.hidden.load(Ordering::Relaxed)
            && h.rects.iter().any(|r| x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);
        let typing = h.kb_focus && !st.hidden.load(Ordering::Relaxed);
        let want_ignore = !(inside || typing);
        if want_ignore != h.ignoring {
            h.ignoring = want_ignore;
            let _ = w.set_ignore_cursor_events(want_ignore);
        }
    });
}

/// readnow-friend://pair?t=…&c=…&d=… → 화면을 #pair=… 로 다시 엶
fn handle_link(app: &AppHandle, raw: &str) {
    let Ok(u) = url::Url::parse(raw) else { return };
    if u.scheme() != "readnow-friend" {
        return;
    }
    let mut t = String::new();
    let mut c = String::new();
    let mut d = String::new();
    for (k, v) in u.query_pairs() {
        match k.as_ref() {
            "t" => t = v.into_owned(),
            "c" => c = v.into_owned(),
            "d" => d = v.into_owned(),
            _ => {}
        }
    }
    if t.is_empty() || !t.chars().all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_') {
        return;
    }
    let enc = |s: &str| url::form_urlencoded::byte_serialize(s.as_bytes()).collect::<String>();
    let target = format!("{PAGE}#pair={}&c={}&d={}", enc(&t), enc(&c), enc(&d));
    if let Some(w) = win(app) {
        if let Ok(nu) = url::Url::parse(&target) {
            let _ = w.navigate(nu);
        }
        let _ = w.show();
    }
}

fn set_hidden(app: &AppHandle, hide: bool) {
    app.state::<Arc<App>>().hidden.store(hide, Ordering::SeqCst);
    js(app, &format!("window.__rnFriendCmd&&window.__rnFriendCmd('{}')", if hide { "hide" } else { "show" }));
}

/// 끄기: 화면에 '끔' 신호(같은 기기 웹앱 안 캐릭터가 바로 돌아오게)를 보내고 최대 1.5초 기다린 뒤 종료
fn quit(app: &AppHandle) {
    let st = app.state::<Arc<App>>().inner().clone();
    st.bye.store(false, Ordering::SeqCst);
    js(app, "window.__rnFriendCmd&&window.__rnFriendCmd('bye')");
    let app2 = app.clone();
    std::thread::spawn(move || {
        for _ in 0..30 {
            if st.bye.load(Ordering::SeqCst) {
                break;
            }
            std::thread::sleep(Duration::from_millis(50));
        }
        app2.exit(0);
    });
}

fn ver_tuple(s: &str) -> (u64, u64, u64) {
    let mut it = s.trim_start_matches(|c: char| !c.is_ascii_digit()).split('.').map(|x| {
        x.chars().take_while(|c| c.is_ascii_digit()).collect::<String>().parse::<u64>().unwrap_or(0)
    });
    (it.next().unwrap_or(0), it.next().unwrap_or(0), it.next().unwrap_or(0))
}

/// 껍데기 새 판 확인 → 있으면 받아 조용히 설치하고 다시 켬. manual = 트레이에서 누름(결과를 화면에 알림)
fn check_update(app: &AppHandle, manual: bool) {
    let app = app.clone();
    std::thread::spawn(move || {
        let say = |m: &str| {
            if manual {
                js(&app, &format!("typeof toast==='function'&&toast({})", serde_json::to_string(m).unwrap_or_default()));
            }
        };
        let agent = ureq::AgentBuilder::new().timeout(Duration::from_secs(30)).user_agent(&format!("readnow-friend/{VER}")).build();
        let list: serde_json::Value = match agent.get(RELEASES_API).call().and_then(|r| r.into_json().map_err(|e| e.into())) {
            Ok(v) => v,
            Err(_) => return say("🖥 업데이트 확인 실패 — 인터넷 연결을 확인해 주세요"),
        };
        let mut best: Option<((u64, u64, u64), String)> = None;
        for r in list.as_array().cloned().unwrap_or_default() {
            if r["draft"].as_bool().unwrap_or(false) || r["prerelease"].as_bool().unwrap_or(false) {
                continue;
            }
            let tag = r["tag_name"].as_str().unwrap_or("");
            let Some(v) = tag.strip_prefix("friend-v") else { continue };
            let asset = r["assets"].as_array().cloned().unwrap_or_default().into_iter().find_map(|a| {
                let n = a["name"].as_str().unwrap_or("");
                if n.ends_with("-setup.exe") {
                    a["browser_download_url"].as_str().map(|s| s.to_string())
                } else {
                    None
                }
            });
            if let Some(url) = asset {
                let vt = ver_tuple(v);
                if best.as_ref().map(|b| vt > b.0).unwrap_or(true) {
                    best = Some((vt, url));
                }
            }
        }
        let Some((vt, url)) = best else { return say("🖥 아직 올라온 프로그램 판이 없어요") };
        if vt <= ver_tuple(VER) {
            return say(&format!("🖥 프로그램이 최신이에요 ({VER})"));
        }
        if !url.starts_with("https://github.com/jerrycson/readnow-scripts/releases/download/") {
            return;
        }
        say("🖥 새 프로그램 판을 받는 중 — 받으면 저절로 설치하고 다시 켜져요");
        let dir = std::env::temp_dir().join("readnow-friend-update");
        let _ = std::fs::create_dir_all(&dir);
        let file = dir.join(format!("readnow-friend-{}.{}.{}-setup.exe", vt.0, vt.1, vt.2));
        let ok = (|| -> Result<(), Box<dyn std::error::Error>> {
            let r = agent.get(&url).call()?;
            let mut rd = r.into_reader();
            let mut f = std::fs::File::create(&file)?;
            std::io::copy(&mut rd, &mut f)?;
            Ok(())
        })();
        if ok.is_err() {
            return say("🖥 새 판 받기 실패 — 나중에 다시 해요");
        }
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            let exe = std::env::current_exe().map(|p| p.display().to_string()).unwrap_or_default();
            let ps = format!(
                "Start-Sleep -Seconds 2; Start-Process -FilePath '{}' -ArgumentList '/S' -Wait; Start-Process -FilePath '{}'",
                file.display().to_string().replace('\'', "''"),
                exe.replace('\'', "''")
            );
            let _ = std::process::Command::new("powershell")
                .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &ps])
                .creation_flags(0x08000000) // CREATE_NO_WINDOW
                .spawn();
            quit(&app);
        }
    });
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let st = app.state::<Arc<App>>().inner().clone();
    let on_top = st.prefs.lock().unwrap().on_top.unwrap_or(true);
    let auto = app.autolaunch().is_enabled().unwrap_or(false);
    let show = MenuItem::with_id(app, "show", "숨기기", true, None::<&str>)?;
    let top = CheckMenuItem::with_id(app, "top", "항상 위", true, on_top, None::<&str>)?;
    let mon = MenuItem::with_id(app, "mon", "모니터 바꾸기", true, None::<&str>)?;
    let autostart = CheckMenuItem::with_id(app, "auto", "시작 시 자동 실행", true, auto, None::<&str>)?;
    let upd = MenuItem::with_id(app, "upd", &format!("업데이트 확인 (지금 {VER})"), true, None::<&str>)?;
    let web = MenuItem::with_id(app, "web", "웹앱 열기", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&show, &top, &mon, &autostart, &sep, &upd, &web, &sep2, &quit_i])?;
    let show2 = show.clone();
    let top2 = top.clone();
    let auto2 = autostart.clone();
    TrayIconBuilder::with_id("friend-tray")
        .icon(app.default_window_icon().cloned().expect("아이콘 없음"))
        .tooltip("🐾 책방 친구")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, ev| match ev.id().as_ref() {
            "show" => {
                let st = app.state::<Arc<App>>();
                let hide = !st.hidden.load(Ordering::SeqCst);
                set_hidden(app, hide);
                let _ = show2.set_text(if hide { "보이기" } else { "숨기기" });
            }
            "top" => {
                let v = top2.is_checked().unwrap_or(true);
                if let Some(w) = win(app) {
                    let _ = w.set_always_on_top(v);
                }
                app.state::<Arc<App>>().prefs.lock().unwrap().on_top = Some(v);
                save_prefs(app);
            }
            "mon" => next_monitor(app),
            "auto" => {
                let v = auto2.is_checked().unwrap_or(false);
                let al = app.autolaunch();
                let _ = if v { al.enable() } else { al.disable() };
                app.state::<Arc<App>>().prefs.lock().unwrap().auto_set = Some(true);
                save_prefs(app);
            }
            "upd" => check_update(app, true),
            "web" => {
                let _ = app.opener().open_url(WEBAPP, None::<&str>);
            }
            "quit" => quit(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, ev| {
            // 트레이 아이콘을 왼쪽 클릭 = 보이기/숨기기 바꾸기 없이 '보이기'(숨겨 둔 것을 찾기 쉽게)
            if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, button_state: tauri::tray::MouseButtonState::Up, .. } = ev {
                set_hidden(tray.app_handle(), false);
            }
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // 이미 켜져 있을 때 다시 실행(또는 연결 링크) → 새로 켜지 않고 이 창으로
            for a in argv.iter().skip(1) {
                if a.starts_with("readnow-friend://") {
                    handle_link(app, a);
                }
            }
            set_hidden(app, false);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--autostart"])))
        .invoke_handler(tauri::generate_handler![friend_post])
        .setup(|app| {
            let h = app.handle().clone();
            let prefs = load_prefs(&h);
            let st = Arc::new(App { hit: Mutex::new(Hit { rects: vec![], ignoring: false, kb_focus: false }), prefs: Mutex::new(prefs.clone()), hidden: AtomicBool::new(false), bye: AtomicBool::new(false) });
            app.manage(st);
            // 처음 한 번: 시작 시 자동 실행을 켬(트레이에서 끌 수 있음)
            if prefs.auto_set.is_none() {
                let _ = h.autolaunch().enable();
                h.state::<Arc<App>>().prefs.lock().unwrap().auto_set = Some(true);
                save_prefs(&h);
            }
            #[cfg(any(windows, target_os = "linux"))]
            {
                let _ = app.deep_link().register_all(); // 설치 프로그램이 이미 했어도 다시(사용자 레지스트리만)
            }
            let init = format!(
                "window.__rnFriendHost=window.__rnFriendHost||{{type:'tauri',ver:'{VER}',post:function(k,d){{try{{var p=window.__TAURI_INTERNALS__&&window.__TAURI_INTERNALS__.invoke('friend_post',{{kind:String(k),data:d==null?null:d}});if(p&&p.catch)p.catch(function(){{}});}}catch(e){{}}}}}};"
            );
            let url = url::Url::parse(PAGE).expect("PAGE 주소");
            let w = WebviewWindowBuilder::new(app, LABEL, WebviewUrl::External(url))
                .title("책방 친구")
                .transparent(true)
                .decorations(false)
                .shadow(false)
                .resizable(false)
                .skip_taskbar(true)
                .always_on_top(prefs.on_top.unwrap_or(true))
                .focused(false)
                .visible(false)
                .initialization_script(&init)
                // 창이 투명해도 숨은 창으로 보고 타이머를 늦추지 않게(살아 있음 신호 30초가 밀리지 않게) · 앞 세 개는 Tauri 기본값
                .additional_browser_args("--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows")
                .build()?;
            let _ = w.set_ignore_cursor_events(true);
            h.state::<Arc<App>>().hit.lock().unwrap().ignoring = true;
            fit_to_monitor(&h);
            let _ = w.show();
            // 모니터 배율·배치가 바뀌면 다시 맞춤
            let h2 = h.clone();
            w.on_window_event(move |ev| {
                if let tauri::WindowEvent::ScaleFactorChanged { .. } = ev {
                    fit_to_monitor(&h2);
                }
            });
            let h3 = h.clone();
            std::thread::spawn(move || {
                let mut last = String::new();
                loop {
                    std::thread::sleep(Duration::from_secs(5));
                    if let Some(w) = win(&h3) {
                        let sig = w.available_monitors().unwrap_or_default().iter().map(|m| format!("{:?}{:?}{:?}", m.name(), m.work_area().position, m.work_area().size)).collect::<Vec<_>>().join("|");
                        if !last.is_empty() && sig != last {
                            fit_to_monitor(&h3);
                        }
                        last = sig;
                    }
                }
            });
            build_tray(&h)?;
            hit_loop(h.clone());
            // 연결 링크: 처음 켤 때 링크로 켜졌으면 · 켜진 뒤 오는 링크
            if let Ok(Some(urls)) = app.deep_link().get_current() {
                for u in urls {
                    handle_link(&h, u.as_str());
                }
            }
            let h4 = h.clone();
            app.deep_link().on_open_url(move |ev| {
                for u in ev.urls() {
                    handle_link(&h4, u.as_str());
                }
            });
            // 껍데기 새 판: 1분 뒤 · 그 뒤 6시간마다
            let h5 = h.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_secs(60));
                loop {
                    check_update(&h5, false);
                    std::thread::sleep(Duration::from_secs(6 * 3600));
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("책방 친구 실행 실패");
}
