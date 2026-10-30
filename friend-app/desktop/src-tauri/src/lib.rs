//! 🐾 책방 친구 — 윈도우 바탕화면 프로그램 (Tauri 2 · WebView2)
//!
//! 이 프로그램은 '껍데기'뿐: 화면 전체(모니터 작업 영역)를 덮는 투명·테두리 없는·항상 위 창 하나에
//! GitHub Pages의 friend/index.html?host=tauri 를 엶 → 캐릭터 화면은 웹앱 판을 따라 늘 최신(이 껍데기는 거의 안 바뀜).
//! · 클릭 통과: 화면(JS)이 '눌리는 칸'(rects, CSS px)을 friend_post("rects")로 알려 줌 → 여기서 33ms마다 마우스 위치를 보고
//!   칸 안이면 창이 클릭을 받고(set_ignore_cursor_events(false)) 밖이면 뒤 프로그램으로 통과(true).
//! · 트레이: 보이기/숨기기 · 설정 · 항상 위 · 모니터 바꾸기 · 시작 시 자동 실행 · 업데이트 확인 · 웹앱 열기 · 종료
//! · (0.2.0 · P5) ⚙ 설정 창: 캐릭터 옆 ⚙(화면 open_settings) 또는 트레이 '설정' → friend/index.html?settings=1&win=set 을 보통 창(1100×760 · 항상 위 아님)으로 · 이미 열려 있으면 앞으로
//! · (0.2.0) 캐릭터 자리: Ctrl+끌기(화면 win_drag) → 모니터 안에서는 화면이 캐릭터를 옮기고 · 포인터가 다른 모니터로 넘어가면 창을 그 모니터로 옮김(drag_to) · 놓으면 모니터 이름·자리·배율을 friend.json에 저장 → 다시 켜도 같은 자리(그 모니터가 없으면 주 모니터 오른쪽 아래)
//! · 연결 링크 readnow-friend://pair?t=…&c=…&d=… → 화면을 #pair=… 로 다시 엶(한 번만 쓰는 표 → 같은 계정 로그인)
//! · 바깥 알림(10/29): ① 같은 PC 창구 http://127.0.0.1:47613/say?m=글(&f=보낸 곳) · /open?p=order|qna|bad (브라우저 요청은 뺌)
//! · 바깥 알림 ③ 연결 주소 readnow-friend://say?m=글(&f=보낸 곳) · readnow-friend://open?p=order|qna|bad — 허용 명령은 이 셋뿐
//! · 껍데기 새 판: GitHub 판(friend-v…)을 6시간마다 확인 → …-setup.exe 를 받아 조용히(/S) 설치하고 다시 켬
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use std::time::{Duration, Instant};

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
/// (0.2.0) ⚙ 설정 창 — 같은 화면을 설정만 보이는 모드로(캐릭터·알림·살아 있음 신호 없음)
const PAGE_SET: &str = "https://jerrycson.github.io/readnow-scripts/friend/index.html?settings=1&win=set";
const LABEL_SET: &str = "friend-set";
/// 두 창(캐릭터·설정)이 같은 WebView2 저장소(로그인·기기 이름)를 쓰려면 브라우저 인자가 똑같아야 함 — 다르면 둘째 창이 안 만들어짐
/// 창이 투명해도 숨은 창으로 보고 타이머를 늦추지 않게(살아 있음 신호 30초가 밀리지 않게) · 앞 세 개는 Tauri 기본값
const BROWSER_ARGS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows";
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
    /// 화면(JS)이 보고한 배율(devicePixelRatio) — 칸 좌표(CSS px)를 만든 바로 그 값. 0이면 아직 못 받음
    dpr: f64,
    /// (0.2.0) 연결 카드(코드 칸) 상자 — 카드가 열린 동안 늘 눌림(다른 칸 목록과 따로 · CSS px)
    card: Option<[f64; 4]>,
    /// (0.2.0) 커서가 든 글 칸의 상자(카드·입력 줄) — 글 쓰는 동안 이 상자(+여유 24px) 안은 늘 눌림. None이면 예전 화면(창 전체)
    focus_r: Option<[f64; 4]>,
    /// (0.2.0) 캐릭터를 끄는 중(Ctrl+끌기 자리 옮김) — 마지막 신호 시각 · 20초 넘게 소식이 없으면 끝난 것으로 봄
    drag_at: Option<Instant>,
    /// (0.2.1) 진단: 마지막 커서(CSS px) · 쓴 배율 · 칸 안이던 횟수(33ms 단위) · 받기/통과 바꾼 횟수 · 칸 안 다시 다짐 계수
    dbg_xy: [f64; 2],
    dbg_s: f64,
    n_in: u64,
    n_tog: u64,
    tick: u64,
    /// (0.2.1) 마지막으로 칸을 받은 때 · 받은 횟수 · 기본 상자를 쓰는 중인지
    rects_at: Option<Instant>,
    n_rects: u64,
    fb: bool,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, PartialEq)]
struct Prefs {
    monitor: Option<String>,
    on_top: Option<bool>,
    auto_set: Option<bool>,
    /// (0.2.0) 놓아 둔 캐릭터 자리: 기본 자리(작업 영역 오른쪽 아래)에서 옮긴 [가로, 세로] CSS px
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pos: Option<[f64; 2]>,
    /// 그 자리를 놓은 모니터 이름(다른 모니터에서는 안 씀 → 오른쪽 아래)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pos_mon: Option<String>,
    /// 놓을 때 그 모니터 배율(배율이 바뀌면 같은 물리 자리가 되게 환산)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pos_scale: Option<f64>,
    /// 놓은 자리의 화면 좌표(물리 px · 캐릭터 기준점 = 작업 영역 오른쪽 아래 + 옮긴 양) — 기록용
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pos_xy: Option<[i32; 2]>,
}

/// 저장된 자리를 지금 모니터(이름·배율)에 맞게: 같은 모니터일 때만 · 배율이 바뀌었으면 물리 자리가 같게 CSS px 환산
fn pos_for(p: &Prefs, mon: Option<&str>, sf: f64) -> Option<[f64; 2]> {
    let pos = p.pos?;
    if p.pos_mon.as_deref() != mon || mon.is_none() || !pos[0].is_finite() || !pos[1].is_finite() {
        return None;
    }
    let k = match p.pos_scale {
        Some(s0) if s0 > 0.1 && sf > 0.1 => s0 / sf,
        _ => 1.0,
    };
    Some([(pos[0] * k).round(), (pos[1] * k).round()])
}

/// 점이 상자 [l,t,r,b] 안인가(여유 pad)
fn in_box(x: f64, y: f64, r: &[f64; 4], pad: f64) -> bool {
    x >= r[0] - pad && x <= r[2] + pad && y >= r[1] - pad && y <= r[3] + pad
}

fn box4(v: Option<&serde_json::Value>) -> Option<[f64; 4]> {
    let a = v?.as_array()?;
    if a.len() != 4 {
        return None;
    }
    let f = |i: usize| a[i].as_f64();
    Some([f(0)?, f(1)?, f(2)?, f(3)?])
}

struct App {
    hit: Mutex<Hit>,
    prefs: Mutex<Prefs>,
    hidden: AtomicBool,
    bye: AtomicBool,
    /// (0.2.0) 창이 지금 덮고 있는 모니터 이름(fit_to_monitor가 씀)
    mon_now: Mutex<Option<String>>,
    /// (0.2.0) 연결 주소 readnow-friend:// 가 이 프로그램으로 등록돼 있나(켤 때 확인 · 화면 카드에 알림)
    link_ok: Mutex<Option<bool>>,
    /// 끌기 감시 실을 하나만
    drag_watch: AtomicBool,
    /// 설정 창을 만드는 중(두 번 눌러 둘 생기지 않게)
    set_opening: AtomicBool,
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
fn friend_post(app: AppHandle, window: tauri::Window, kind: String, data: serde_json::Value) {
    let st = app.state::<Arc<App>>();
    if window.label() == LABEL_SET {
        // 설정 창이 부를 수 있는 것: 링크 열기 · 설정 창 닫기 (칸·초점·끌기는 캐릭터 창 것만)
        match kind.as_str() {
            "open" => {
                if let Some(u) = data.get("url").and_then(|x| x.as_str()) {
                    if u.starts_with("https://") {
                        let _ = app.opener().open_url(u, None::<&str>);
                    }
                }
            }
            "settings_close" => {
                let w = window.clone();
                std::thread::spawn(move || {
                    let _ = w.close();
                });
            }
            _ => {}
        }
        return;
    }
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
            let mut h = st.hit.lock().unwrap();
            h.rects = v;
            h.rects_at = Some(Instant::now());
            h.n_rects += 1;
            h.fb = false;
            // 칸 좌표를 만든 배율을 같이 받음(hit_loop가 물리 px → CSS px 환산에 씀)
            h.dpr = data.get("dpr").and_then(|x| x.as_f64()).filter(|d| *d > 0.1 && *d < 8.0).unwrap_or(0.0);
            // (0.2.0) 연결 카드는 따로 늘 눌림
            h.card = box4(data.get("card"));
        }
        "focus" => {
            // 글 칸에 들어가면(on) 창을 앞으로 세우고 클릭·키를 받음 · 나오면(off) 칸 밖 규칙으로 돌아감
            // (0.2.0) 화면이 글 칸 상자(r)를 주면 그 상자 둘레만 늘 눌림(예전: 창 전체 — 글 칸에 커서가 있는 동안 바탕화면 전체가 안 눌렸음)
            let on = data.get("on").and_then(|x| x.as_bool()).unwrap_or(false);
            {
                let mut h = st.hit.lock().unwrap();
                h.kb_focus = on;
                h.focus_r = if on { box4(data.get("r")) } else { None };
                if on {
                    h.ignoring = false; // 아래에서 바로 받게 함 — hit_loop가 이 상태를 알아야 칸 밖에서 다시 통과로 돌림
                }
            }
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
        // (0.2.1) 진단: 화면이 30초마다 물음 → 클릭 통과 상태를 화면에 돌려줌(화면이 살아 있음 신호 문서 dbg에 적음 · 비밀값 없음)
        "hit_dbg" => {
            let (xy, s, n_in, n_tog, ign, nr, kb, dpr, n_rects, r_age, fb) = {
                let h = st.hit.lock().unwrap();
                (h.dbg_xy, h.dbg_s, h.n_in, h.n_tog, h.ignoring, h.rects.len(), h.kb_focus, h.dpr, h.n_rects, h.rects_at.map(|t| t.elapsed().as_secs_f64()).unwrap_or(-1.0), h.fb)
            };
            let (sf, ip, isz) = match win(&app) {
                Some(w) => (
                    w.scale_factor().unwrap_or(0.0),
                    w.inner_position().map(|p| [p.x, p.y]).unwrap_or([0, 0]),
                    w.inner_size().map(|z| [z.width, z.height]).unwrap_or([0, 0]),
                ),
                None => (0.0, [0, 0], [0, 0]),
            };
            js(
                &app,
                &format!(
                    "window.__rnFriendCmd&&window.__rnFriendCmd('hitdbg',{{v:'{VER}',x:{:.0},y:{:.0},s:{:.3},sf:{:.3},dpr:{:.3},nIn:{},nTog:{},ign:{},nr:{},kb:{},pos:[{},{}],size:[{},{}],hidden:{},nRects:{},rAge:{:.1},fb:{}}})",
                    xy[0], xy[1], s, sf, dpr, n_in, n_tog, ign, nr, kb, ip[0], ip[1], isz[0], isz[1], st.hidden.load(Ordering::Relaxed), n_rects, r_age, fb
                ),
            );
        }
        // (0.2.0) 화면이 다 뜬 뒤 자리·모니터 정보를 다시 달라고 함(켤 때 보낸 geom은 화면이 뜨기 전이라 사라질 수 있음)
        "need_geom" => fit_to_monitor(&app, true),
        // (0.2.0) ⚙ → 설정 창
        "open_settings" => {
            // (0.2.1) 다시 누르면 닫기 — 화면이 toggle:true를 주고 설정 창이 이미 있으면 닫음
            let toggle = data.get("toggle").and_then(|x| x.as_bool()).unwrap_or(false);
            match app.get_webview_window(LABEL_SET) {
                Some(w) if toggle => {
                    std::thread::spawn(move || {
                        let _ = w.close();
                    });
                }
                _ => open_settings(&app),
            }
        }
        // (0.2.1) 🐾 단추를 🗑 쓰레기통에 놓음 → 프로그램 끝내기(트레이 '종료'와 같음)
        "quit" => quit(&app),
        // (0.2.0) Ctrl+끌기: start → 끄는 동안 창 전체가 마우스를 받고 포인터 모니터를 지켜봄 · move → 살아 있음 · end → 자리 저장
        "win_drag" => {
            let phase = data.get("phase").and_then(|x| x.as_str()).unwrap_or("");
            match phase {
                "start" | "move" => {
                    {
                        let mut h = st.hit.lock().unwrap();
                        h.drag_at = Some(Instant::now());
                        h.ignoring = false;
                    }
                    if let Some(w) = win(&app) {
                        let _ = w.set_ignore_cursor_events(false);
                    }
                    if !st.drag_watch.swap(true, Ordering::SeqCst) {
                        drag_watch(app.clone());
                    }
                }
                "end" => {
                    st.hit.lock().unwrap().drag_at = None;
                    drag_end(&app, &data);
                }
                _ => {}
            }
        }
        _ => {} // ready · paired · notify · signout — 윈도우는 화면이 직접 보여 줌
    }
}

/// 화면 쪽 프로그램 다리(window.__rnFriendHost) — win = '' 캐릭터 창 · 'set' 설정 창
fn host_init(win: &str) -> String {
    format!(
        "window.__rnFriendHost=window.__rnFriendHost||{{type:'tauri',ver:'{VER}',win:'{win}',post:function(k,d){{try{{var p=window.__TAURI_INTERNALS__&&window.__TAURI_INTERNALS__.invoke('friend_post',{{kind:String(k),data:d==null?null:d}});if(p&&p.catch)p.catch(function(){{}});}}catch(e){{}}}}}};"
    )
}

/// (0.2.0) ⚙ 설정 창 열기 — 이미 있으면 앞으로 · 없으면 보통 창(테두리 · 1100×760 · 항상 위 아님)으로 만듦
/// 창 만들기는 다른 실에서(윈도우에서 명령·메뉴 처리 중에 바로 만들면 멈출 수 있음)
fn open_settings(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(LABEL_SET) {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
        return;
    }
    let st = app.state::<Arc<App>>().inner().clone();
    if st.set_opening.swap(true, Ordering::SeqCst) {
        return;
    }
    let app2 = app.clone();
    std::thread::spawn(move || {
        let built = url::Url::parse(PAGE_SET).ok().and_then(|u| {
            WebviewWindowBuilder::new(&app2, LABEL_SET, WebviewUrl::External(u))
                .title("🐾 책방 친구 설정")
                .inner_size(1100.0, 760.0)
                .min_inner_size(560.0, 420.0)
                .resizable(true)
                .decorations(true)
                .always_on_top(false)
                .skip_taskbar(false)
                .center()
                .focused(true)
                .initialization_script(&host_init("set"))
                .additional_browser_args(BROWSER_ARGS)
                .build()
                .ok()
        });
        match built {
            Some(w) => {
                let _ = w.set_focus();
            }
            None => js(&app2, "typeof toast==='function'&&toast('⚙ 설정 창을 열지 못했어요 — 트레이 🐾 › 설정으로 다시 해 주세요')"),
        }
        st.set_opening.store(false, Ordering::SeqCst);
    });
}

/// (0.2.0) 끄는 동안 포인터가 있는 모니터를 지켜봄(30ms) — 다른 모니터로 넘어가면 창을 그 모니터 작업 영역으로 옮기고 화면에 포인터 자리(drag_to)를 알림
fn drag_watch(app: AppHandle) {
    std::thread::spawn(move || {
        let st = app.state::<Arc<App>>().inner().clone();
        // 한 번 다른 모니터로 넘어간 뒤로는 포인터가 움직일 때마다 drag_to(창이 옮겨 가며 화면이 포인터 소식을 놓쳐도 캐릭터가 따라오게)
        let mut crossed = false;
        let mut last = (f64::NAN, f64::NAN);
        loop {
            std::thread::sleep(Duration::from_millis(30));
            let alive = st.hit.lock().unwrap().drag_at.map(|t| t.elapsed() < Duration::from_secs(20)).unwrap_or(false);
            if !alive {
                break;
            }
            let Ok(cur) = app.cursor_position() else { continue };
            let Some(m) = app.monitor_from_point(cur.x, cur.y).ok().flatten() else { continue };
            let now = st.mon_now.lock().unwrap().clone();
            let cross = m.name().is_some() && m.name().cloned() != now;
            if cross {
                st.prefs.lock().unwrap().monitor = m.name().cloned();
                fit_to_monitor(&app, false);
                crossed = true;
            }
            if !(cross || (crossed && (cur.x, cur.y) != last)) {
                continue;
            }
            last = (cur.x, cur.y);
            let wa = m.work_area();
            let sf = m.scale_factor().max(0.1);
            let x = (cur.x - wa.position.x as f64) / sf;
            let y = (cur.y - wa.position.y as f64) / sf;
            js(&app, &format!("window.__rnFriendCmd&&window.__rnFriendCmd('drag_to',{{x:{x:.1},y:{y:.1}}})"));
        }
        st.drag_watch.store(false, Ordering::SeqCst);
    });
}

/// (0.2.0) 끌기 끝: 지금 창의 모니터에 놓은 자리(dx·dy CSS px)를 기기별 friend.json에 저장
fn drag_end(app: &AppHandle, data: &serde_json::Value) {
    let st = app.state::<Arc<App>>();
    let dx = data.get("dx").and_then(|x| x.as_f64()).unwrap_or(0.0);
    let dy = data.get("dy").and_then(|x| x.as_f64()).unwrap_or(0.0);
    if !dx.is_finite() || !dy.is_finite() || dx.abs() > 20000.0 || dy.abs() > 20000.0 {
        return;
    }
    let mon = st.mon_now.lock().unwrap().clone();
    let Some(w) = win(app) else { return };
    let m = w.available_monitors().unwrap_or_default().into_iter().find(|m| m.name().cloned() == mon);
    let sf = m.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);
    let xy = m.as_ref().map(|m| {
        let wa = m.work_area();
        [wa.position.x + wa.size.width as i32 + (dx * sf).round() as i32, wa.position.y + wa.size.height as i32 + (dy * sf).round() as i32]
    });
    {
        let mut p = st.prefs.lock().unwrap();
        p.monitor = mon.clone();
        p.pos = Some([dx.round(), dy.round()]);
        p.pos_mon = mon;
        p.pos_scale = Some(sf);
        p.pos_xy = xy;
    }
    save_prefs(app);
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
/// with_pos: 저장된 캐릭터 자리도 화면에 줌(끄는 중 모니터를 옮길 때는 빼서 끄는 자리를 덮지 않음)
fn fit_to_monitor(app: &AppHandle, with_pos: bool) {
    let Some(w) = win(app) else { return };
    let mons = w.available_monitors().unwrap_or_default();
    if mons.is_empty() {
        return;
    }
    let st = app.state::<Arc<App>>();
    let want = st.prefs.lock().unwrap().monitor.clone();
    let m = want
        .and_then(|n| mons.iter().find(|m| m.name().map(|x| x == &n).unwrap_or(false)).cloned())
        .or_else(|| w.primary_monitor().ok().flatten())
        .unwrap_or_else(|| mons[0].clone());
    let wa = m.work_area();
    let _ = w.set_position(PhysicalPosition::new(wa.position.x, wa.position.y));
    let _ = w.set_size(PhysicalSize::new(wa.size.width, wa.size.height));
    let sf = m.scale_factor();
    *st.mon_now.lock().unwrap() = m.name().cloned();
    let mon_j = serde_json::to_string(&m.name().cloned().unwrap_or_default()).unwrap_or_else(|_| "\"\"".into());
    let link = match *st.link_ok.lock().unwrap() {
        Some(true) => "true",
        Some(false) => "false",
        None => "null",
    };
    let pos = if with_pos {
        match pos_for(&st.prefs.lock().unwrap(), m.name().map(|s| s.as_str()), sf) {
            Some(p) => format!(",pos:[{},{}]", p[0], p[1]),
            None => ",pos:null".to_string(),
        }
    } else {
        String::new()
    };
    js(
        app,
        &format!(
            "window.__rnFriendCmd&&window.__rnFriendCmd('geom',{{x:{},y:{},w:{},h:{},scale:{},monitors:{},mon:{},link:{}{}}})",
            wa.position.x,
            wa.position.y,
            wa.size.width,
            wa.size.height,
            sf,
            mons.len(),
            mon_j,
            link,
            pos
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
    fit_to_monitor(app, true); // 그 모니터에 놓아 둔 자리가 있으면 거기 · 없으면 오른쪽 아래
}

/// (0.2.1) 클릭 판정 순수 함수 — cur·pos = 물리 px(커서 · 창 안쪽 왼쪽 위) · sf = 창 배율 · dpr = 화면이 알린 배율(0이면 창 배율) · rects = CSS px
/// 돌려줌: (CSS x, CSS y, 칸 안?) — 화면 배율로 잰 자리와 창 배율로 잰 자리 둘 중 하나라도 칸 안(둘레 3px)이면 안
fn hit_inside(cur: (f64, f64), pos: (f64, f64), sf: f64, dpr: f64, rects: &[[f64; 4]]) -> (f64, f64, bool) {
    let sf = if sf > 0.1 { sf } else { 1.0 };
    let s = if dpr > 0.1 { dpr } else { sf };
    let (x, y) = ((cur.0 - pos.0) / s, (cur.1 - pos.1) / s);
    let (x2, y2) = ((cur.0 - pos.0) / sf, (cur.1 - pos.1) / sf);
    let inside = rects.iter().any(|r| in_box(x, y, r, 3.0) || ((sf - s).abs() > 0.01 && in_box(x2, y2, r, 3.0)));
    (x, y, inside)
}

/// (0.2.1) 칸을 못 받을 때 쓰는 기본 상자(CSS px) — 창 오른쪽 아래 너비 340 · 높이 660(창 높이 85%까지)
fn fallback_box(w: f64, h: f64) -> [f64; 4] {
    [(w - 340.0).max(0.0), (h - 660.0_f64.min(h * 0.85)).max(0.0), w, h]
}

#[cfg(test)]
mod hit_tests {
    use super::*;
    const R: [[f64; 4]; 3] = [[1484.0, 696.0, 1524.0, 736.0], [1490.0, 662.0, 1518.0, 690.0], [1341.0, 500.0, 1456.0, 860.0]];
    #[test]
    fn same_scale_inside_and_outside() {
        // 125% 모니터 · 창이 (0,0) · 🐾 가운데 CSS (1504,716) → 물리 (1880,895)
        assert!(hit_inside((1880.0, 895.0), (0.0, 0.0), 1.25, 1.25, &R).2);
        assert!(!hit_inside((100.0, 100.0), (0.0, 0.0), 1.25, 1.25, &R).2);
    }
    #[test]
    fn second_monitor_offset() {
        // 왼쪽 모니터(1920 물리) 오른쪽에 둔 150% 모니터 · 창 시작 (1920, 0)
        let cur = (1920.0 + 1504.0 * 1.5, 716.0 * 1.5);
        assert!(hit_inside(cur, (1920.0, 0.0), 1.5, 1.5, &R).2);
        assert!(!hit_inside((1504.0 * 1.5, 716.0 * 1.5), (1920.0, 0.0), 1.5, 1.5, &R).2);
    }
    #[test]
    fn negative_origin_left_monitor() {
        // 주 모니터 왼쪽에 둔 모니터(시작 x = -2560)
        let cur = (-2560.0 + 1504.0 * 1.25, 716.0 * 1.25);
        assert!(hit_inside(cur, (-2560.0, 0.0), 1.25, 1.25, &R).2);
    }
    #[test]
    fn mixed_scale_still_hits() {
        // 화면은 1.25로 그렸는데 창 배율이 1.5로 잠깐 어긋남(모니터를 옮기는 중) — 둘 중 하나로 맞으면 안
        assert!(hit_inside((1504.0 * 1.25, 716.0 * 1.25), (0.0, 0.0), 1.5, 1.25, &R).2);
        assert!(hit_inside((1504.0 * 1.5, 716.0 * 1.5), (0.0, 0.0), 1.5, 1.25, &R).2);
    }
    #[test]
    fn no_dpr_uses_window_scale() {
        assert!(hit_inside((1504.0 * 1.25, 716.0 * 1.25), (0.0, 0.0), 1.25, 0.0, &R).2);
    }
    #[test]
    fn edge_pad_3px() {
        assert!(hit_inside(((1524.0 + 2.5) * 1.25, 716.0 * 1.25), (0.0, 0.0), 1.25, 1.25, &R).2);
        assert!(!hit_inside(((1524.0 + 4.0) * 1.25, 716.0 * 1.25), (0.0, 0.0), 1.25, 1.25, &R).2);
    }
    #[test]
    fn fallback_box_bottom_right() {
        let b = fallback_box(1536.0, 864.0);
        assert!(b[0] > 1100.0 && b[2] == 1536.0 && b[3] == 864.0 && b[1] < 300.0);
        assert!(hit_inside((1504.0 * 1.25, 716.0 * 1.25), (0.0, 0.0), 1.25, 0.0, &[b]).2);
        assert!(!hit_inside((200.0, 200.0), (0.0, 0.0), 1.25, 0.0, &[b]).2);
    }
}

/// 클릭 통과: 33ms마다 마우스가 눌리는 칸 안인지 봄
fn hit_loop(app: AppHandle) {
    let t0 = Instant::now();
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(33));
        let Some(w) = win(&app) else { continue };
        let st = app.state::<Arc<App>>();
        let (Ok(cur), Ok(pos), Ok(sf)) = (w.cursor_position(), w.inner_position(), w.scale_factor()) else { continue };
        // (0.2.1) 창 크기도 잠금 전에 — 잠금을 쥔 채 메인 실에 묻으면(inner_size) 메인 실의 friend_post('rects')가 같은 잠금을 기다려 서로 멈춤
        let size = w.inner_size().ok();
        let mut h = st.hit.lock().unwrap();
        // 환산 배율: 화면이 보낸 devicePixelRatio가 있으면 그 값(칸을 그 값으로 계산함) · 없으면 창 배율
        // (0.2.1) 판정은 순수 함수 hit_inside(단위 시험 있음) — 화면 배율·창 배율 둘 다 · 칸 둘레 3px
        let s = if h.dpr > 0.0 { h.dpr } else { sf };
        let (x, y, mut inside) = hit_inside((cur.x, cur.y), (pos.x as f64, pos.y as f64), sf, h.dpr, &h.rects);
        // (0.2.1) 안전장치: 켠 뒤 10초가 지나도 화면에서 칸(rects)을 한 번도 못 받았으면(화면→프로그램 통로 문제) 오른쪽 아래 기본 상자(캐릭터·🐾·⚙·💬 자리)를 눌리는 칸으로
        if h.rects_at.is_none() && t0.elapsed() > Duration::from_secs(10) {
            if let Some(z) = size {
                let fb = fallback_box(z.width as f64 / sf, z.height as f64 / sf);
                let (_, _, i2) = hit_inside((cur.x, cur.y), (pos.x as f64, pos.y as f64), sf, 0.0, &[fb]);
                inside = inside || i2;
                h.fb = true;
            }
        }
        let shown = !st.hidden.load(Ordering::Relaxed);
        let inside = shown && inside;
        h.dbg_xy = [x, y];
        h.dbg_s = s;
        h.tick = h.tick.wrapping_add(1);
        if inside {
            h.n_in += 1;
        }
        // (0.2.0) 연결 카드는 열린 동안 늘 · 글 칸에 커서가 있으면 그 상자 둘레 · 끄는 중이면 창 전체
        let in_card = shown && h.card.as_ref().map(|r| in_box(x, y, r, 0.0)).unwrap_or(false);
        let typing = shown && h.kb_focus && h.focus_r.as_ref().map(|r| in_box(x, y, r, 24.0)).unwrap_or(true);
        let dragging = h.drag_at.map(|t| t.elapsed() < Duration::from_secs(20)).unwrap_or(false);
        let want_ignore = !(inside || in_card || typing || dragging);
        if want_ignore != h.ignoring {
            h.ignoring = want_ignore;
            h.n_tog += 1;
            let _ = w.set_ignore_cursor_events(want_ignore);
        } else if !want_ignore && h.tick % 30 == 0 {
            // (0.2.1) 칸 안에 머무는 동안 1초마다 '받기'를 다시 다짐 — 창 모양이 바뀌며(모니터 맞춤·항상 위) 통과 상태가 몰래 남는 경우 대비
            let _ = w.set_ignore_cursor_events(false);
        }
    });
}

/// (10/29) 바깥 알림·화면 열기 허용 목록 — 이 셋만 받음(딥링크·127.0.0.1 창구 공용)
const OPEN_PAGES: [&str; 3] = ["order", "qna", "bad"];
/// ① 같은 PC 창구 포트 — 127.0.0.1에서만 받음(밖에서 못 들어옴)
const LOCAL_PORT: u16 = 47613;
/// 창구 말하기 속도 제한(1.5초 안에 또 오면 429)
static LOCAL_LAST: Mutex<Option<Instant>> = Mutex::new(None);

/// 바깥 알림 한 줄: 글은 공백 정리 뒤 120자까지 · 화면에는 JSON 문자열로 넣어 줌(따옴표·줄바꿈 안전)
fn friend_say(app: &AppHandle, text: &str, from: &str) {
    let t: String = text.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(120).collect();
    if t.is_empty() {
        return;
    }
    let f: String = from.chars().take(30).collect();
    let tj = serde_json::to_string(&t).unwrap_or_else(|_| "\"\"".into());
    let fj = serde_json::to_string(&f).unwrap_or_else(|_| "\"\"".into());
    js(app, &format!("window.__rnFriendCmd&&window.__rnFriendCmd('say',{{text:{tj},from:{fj}}})"));
}

/// 허용 목록의 화면(order·qna·bad)을 열게 함
fn open_page(app: &AppHandle, p: &str) {
    if OPEN_PAGES.contains(&p) {
        js(app, &format!("window.__rnFriendCmd&&window.__rnFriendCmd('open',{{p:\"{p}\"}})"));
    }
}

/// ① 127.0.0.1 창구 시작(프로그램이 켜질 때 한 번) — 포트를 못 열면 조용히 그만둠(프로그램은 계속 돎)
fn start_local(app: AppHandle) {
    std::thread::spawn(move || {
        let Ok(listener) = std::net::TcpListener::bind(("127.0.0.1", LOCAL_PORT)) else {
            return;
        };
        for conn in listener.incoming().flatten() {
            handle_local(&app, conn);
        }
    });
}

/// 창구 요청 한 건: GET /say?m=…&f=… · GET /open?p=… · 브라우저(Origin 머리)가 보낸 요청은 거절
fn handle_local(app: &AppHandle, mut s: std::net::TcpStream) {
    use std::io::{Read, Write};
    let _ = s.set_read_timeout(Some(Duration::from_secs(2)));
    let mut buf: Vec<u8> = Vec::new();
    let mut tmp = [0u8; 1024];
    while buf.len() < 8192 && !buf.windows(4).any(|w| w == b"\r\n\r\n") {
        match s.read(&mut tmp) {
            Ok(0) | Err(_) => break,
            Ok(n) => buf.extend_from_slice(&tmp[..n]),
        }
    }
    let head = String::from_utf8_lossy(&buf).to_string();
    let mut lines = head.lines();
    let first = lines.next().unwrap_or("");
    let browser = lines.any(|l| l.to_ascii_lowercase().starts_with("origin:"));
    let mut it = first.split_whitespace();
    let method = it.next().unwrap_or("");
    let target = it.next().unwrap_or("");
    let (code, msg): (u16, &str) = if browser {
        (403, "브라우저 요청은 받지 않아요")
    } else if method != "GET" {
        (405, "GET만 받아요")
    } else {
        match url::Url::parse(&format!("http://127.0.0.1{target}")) {
            Err(_) => (400, "잘못된 주소"),
            Ok(u) => {
                let q = |k: &str| u.query_pairs().find(|(a, _)| a == k).map(|(_, v)| v.into_owned()).unwrap_or_default();
                match u.path() {
                    "/say" => {
                        let m = q("m");
                        let now = Instant::now();
                        let fast = match LOCAL_LAST.lock() {
                            Ok(mut last) => {
                                let f = last.map_or(false, |t| now.duration_since(t) < Duration::from_millis(1500));
                                if !f && !m.trim().is_empty() {
                                    *last = Some(now);
                                }
                                f
                            }
                            Err(_) => true,
                        };
                        if m.trim().is_empty() {
                            (400, "m=글 이 없어요")
                        } else if fast {
                            (429, "너무 빨리 보냈어요(1.5초 뒤 다시)")
                        } else {
                            friend_say(app, &m, &q("f"));
                            (200, "ok")
                        }
                    }
                    "/open" => {
                        let p = q("p");
                        if OPEN_PAGES.contains(&p.as_str()) {
                            open_page(app, &p);
                            (200, "ok")
                        } else {
                            (400, "허용되지 않은 화면(order·qna·bad)")
                        }
                    }
                    _ => (404, "없는 주소(/say · /open)"),
                }
            }
        }
    };
    let status = match code {
        200 => "200 OK",
        400 => "400 Bad Request",
        403 => "403 Forbidden",
        404 => "404 Not Found",
        405 => "405 Method Not Allowed",
        429 => "429 Too Many Requests",
        _ => "500 Internal Server Error",
    };
    let body = serde_json::json!({ "ok": code == 200, "msg": msg }).to_string();
    let resp = format!(
        "HTTP/1.1 {status}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    let _ = s.write_all(resp.as_bytes());
}

/// 같은 링크가 두 길(단일 실행 콜백 + deep-link 이벤트)로 두 번 오는 것 막기
static LAST_LINK: Mutex<Option<(String, Instant)>> = Mutex::new(None);

/// readnow-friend://pair?t=…&c=…&d=…(&k=코드) → 화면을 #pair=… 로 다시 엶 · (10/29) readnow-friend://say?m=… · …://open?p=…
fn handle_link(app: &AppHandle, raw: &str) {
    let Ok(u) = url::Url::parse(raw) else { return };
    if u.scheme() != "readnow-friend" {
        return;
    }
    if let Ok(mut last) = LAST_LINK.lock() {
        if let Some((l, t)) = last.as_ref() {
            if l == raw && t.elapsed() < Duration::from_secs(5) {
                return;
            }
        }
        *last = Some((raw.to_string(), Instant::now()));
    }
    match u.host_str().unwrap_or("") {
        "say" => {
            let get = |k: &str| u.query_pairs().find(|(a, _)| a == k).map(|(_, v)| v.into_owned()).unwrap_or_default();
            friend_say(app, &get("m"), &get("f"));
            return;
        }
        "open" => {
            let p = u.query_pairs().find(|(a, _)| a == "p").map(|(_, v)| v.into_owned()).unwrap_or_default();
            open_page(app, &p);
            return;
        }
        "pair" => {}
        _ => return,
    }
    let mut t = String::new();
    let mut c = String::new();
    let mut d = String::new();
    let mut code = String::new();
    for (k, v) in u.query_pairs() {
        match k.as_ref() {
            "t" => t = v.into_owned(),
            "c" => c = v.into_owned(),
            "d" => d = v.into_owned(),
            "k" => code = v.chars().filter(|ch| ch.is_ascii_alphanumeric()).take(12).collect(),
            _ => {}
        }
    }
    if t.is_empty() || !t.chars().all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_') {
        return;
    }
    let enc = |s: &str| url::form_urlencoded::byte_serialize(s.as_bytes()).collect::<String>();
    // (0.2.0) 이미 열린 화면이면 주소 끝(#…)만 바뀌어 다시 읽지 않던 것(설치 직후 켜 둔 채 웹앱 단추 → 아무 일 없음) → pl=시각을 붙여 늘 새로 읽음
    let pl = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
    let target = format!("{PAGE}&pl={pl}#pair={}&c={}&d={}&k={}", enc(&t), enc(&c), enc(&d), enc(&code));
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
                js(&app, &format!("typeof toast==='function'&&toast({},0,6000)", serde_json::to_string(m).unwrap_or_default()));
            }
        };
        say("🖥 업데이트 확인하는 중…");
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
            return say(&format!("🖥 최신 판({VER})입니다"));
        }
        if !url.starts_with("https://github.com/jerrycson/readnow-scripts/releases/download/") {
            return;
        }
        say(&format!("🖥 새 판 {}.{}.{} 받는 중 … 받으면 저절로 설치하고 다시 켜져요", vt.0, vt.1, vt.2));
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
    let set = MenuItem::with_id(app, "set", "⚙ 설정", true, None::<&str>)?;
    let top = CheckMenuItem::with_id(app, "top", "항상 위", true, on_top, None::<&str>)?;
    let mon = MenuItem::with_id(app, "mon", "모니터 바꾸기", true, None::<&str>)?;
    let autostart = CheckMenuItem::with_id(app, "auto", "시작 시 자동 실행", true, auto, None::<&str>)?;
    let upd = MenuItem::with_id(app, "upd", &format!("업데이트 확인 (지금 {VER})"), true, None::<&str>)?;
    let web = MenuItem::with_id(app, "web", "웹앱 열기", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&show, &set, &top, &mon, &autostart, &sep, &upd, &web, &sep2, &quit_i])?;
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
            "set" => open_settings(app),
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
            // (연결 링크는 deep-link 기능이 on_open_url로도 넘겨 줌 — handle_link가 5초 안 같은 링크를 한 번만 처리)
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
            start_local(h.clone()); // (10/29) ① 같은 PC 바깥 알림 창구 127.0.0.1:47613
            let prefs = load_prefs(&h);
            let st = Arc::new(App {
                hit: Mutex::new(Hit { rects: vec![], ignoring: false, kb_focus: false, dpr: 0.0, card: None, focus_r: None, drag_at: None, dbg_xy: [0.0, 0.0], dbg_s: 0.0, n_in: 0, n_tog: 0, tick: 0, rects_at: None, n_rects: 0, fb: false }),
                prefs: Mutex::new(prefs.clone()),
                hidden: AtomicBool::new(false),
                bye: AtomicBool::new(false),
                mon_now: Mutex::new(None),
                link_ok: Mutex::new(None),
                drag_watch: AtomicBool::new(false),
                set_opening: AtomicBool::new(false),
            });
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
                // (0.2.0) 첫 실행 때 등록 확인 — 안 됐으면 연결 카드에 '코드로 연결' 안내(화면 geom.link)
                *h.state::<Arc<App>>().link_ok.lock().unwrap() = app.deep_link().is_registered("readnow-friend").ok();
            }
            let init = host_init("");
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
                .additional_browser_args(BROWSER_ARGS)
                .build()?;
            let _ = w.set_ignore_cursor_events(true);
            h.state::<Arc<App>>().hit.lock().unwrap().ignoring = true;
            fit_to_monitor(&h, true);
            let _ = w.show();
            // 모니터 배율·배치가 바뀌면 다시 맞춤
            let h2 = h.clone();
            w.on_window_event(move |ev| {
                if let tauri::WindowEvent::ScaleFactorChanged { .. } = ev {
                    fit_to_monitor(&h2, true);
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
                            fit_to_monitor(&h3, true);
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefs_round_trip_and_old_file() {
        // 예전(0.1.x) friend.json도 그대로 읽힘
        let old: Prefs = serde_json::from_str(r#"{"monitor":"\\\\.\\DISPLAY1","on_top":true,"auto_set":true}"#).unwrap();
        assert_eq!(old.pos, None);
        let p = Prefs { monitor: Some("\\\\.\\DISPLAY2".into()), on_top: Some(true), auto_set: Some(true), pos: Some([-640.0, -120.0]), pos_mon: Some("\\\\.\\DISPLAY2".into()), pos_scale: Some(1.25), pos_xy: Some([3200, 1000]) };
        let j = serde_json::to_string(&p).unwrap();
        assert!(j.contains("\"pos\":[-640.0,-120.0]") && j.contains("\"pos_scale\":1.25"), "{j}");
        let back: Prefs = serde_json::from_str(&j).unwrap();
        assert_eq!(back, p);
    }

    #[test]
    fn pos_only_on_same_monitor_and_rescaled() {
        let p = Prefs { pos: Some([-600.0, -100.0]), pos_mon: Some("B".into()), pos_scale: Some(1.5), ..Default::default() };
        assert_eq!(pos_for(&p, Some("B"), 1.5), Some([-600.0, -100.0]));
        assert_eq!(pos_for(&p, Some("B"), 1.0), Some([-900.0, -150.0])); // 같은 물리 자리
        assert_eq!(pos_for(&p, Some("A"), 1.5), None); // 다른 모니터 → 오른쪽 아래
        assert_eq!(pos_for(&p, None, 1.5), None);
        assert_eq!(pos_for(&Prefs::default(), Some("B"), 1.0), None);
    }

    #[test]
    fn boxes() {
        assert_eq!(box4(Some(&serde_json::json!([1, 2, 3.5, 4]))), Some([1.0, 2.0, 3.5, 4.0]));
        assert_eq!(box4(Some(&serde_json::json!([1, 2, 3]))), None);
        assert_eq!(box4(Some(&serde_json::json!(null))), None);
        assert_eq!(box4(None), None);
        let r = [10.0, 10.0, 20.0, 20.0];
        assert!(in_box(15.0, 15.0, &r, 0.0) && !in_box(25.0, 15.0, &r, 0.0) && in_box(25.0, 15.0, &r, 6.0));
    }

    /// (0.2.1) 클릭 먹통 원인 지킴: 윈도우에서 화면→프로그램 요청(ipc 주소 fetch)은 ACL이 Origin 머리(경로 없는 출처)로 맞춤
    /// → capabilities의 원격 주소 중 하나는 출처 'https://jerrycson.github.io' 자체와 맞아야 함(0.1.0~0.2.0은 경로 붙은 주소뿐이라 늘 거절)
    #[test]
    fn capability_matches_origin_header() {
        use tauri::utils::acl::RemoteUrlPattern;
        let cap: serde_json::Value = serde_json::from_str(include_str!("../capabilities/default.json")).unwrap();
        let pats: Vec<RemoteUrlPattern> = cap["remote"]["urls"].as_array().unwrap().iter().map(|u| u.as_str().unwrap().parse().unwrap()).collect();
        let hit = |u: &str| { let u = url::Url::parse(u).unwrap(); pats.iter().any(|p| p.test(&u)) };
        assert!(hit("https://jerrycson.github.io"), "Origin 머리(윈도우 fetch 경로)");
        assert!(hit("https://jerrycson.github.io/readnow-scripts/friend/index.html?host=tauri"), "전체 주소(postMessage 경로)");
        assert!(!hit("https://evil.example.com"));
        assert!(!hit("http://jerrycson.github.io"));
        // 예전 주소 하나만으로는 Origin 머리와 안 맞음(먹통 재현)
        let old: RemoteUrlPattern = "https://jerrycson.github.io/readnow-scripts/*".parse().unwrap();
        assert!(!old.test(&url::Url::parse("https://jerrycson.github.io").unwrap()));
    }

    #[test]
    fn host_init_has_win() {
        assert!(host_init("set").contains("win:'set'") && host_init("").contains("win:''") && host_init("").contains("friend_post"));
    }
}
