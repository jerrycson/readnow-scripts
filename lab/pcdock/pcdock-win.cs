// pcdock-win.cs — 🖥 PC 배치 도우미의 윈도우 다루기(user32 · shcore · dwmapi · psapi) — pcdock.ps1이 한 번 엮어(dll) 다시 씀
// · DPI 인식(모니터마다 · V2)으로 켜서 모든 자리를 '실제 화소'로 읽고 놓음 — 배율이 다른 모니터 사이로 옮겨도 크기가 어긋나지 않게
// · 창 놓기: 최소화·최대화를 풀고 → 놓고 → 보이지 않는 테두리(윈도우 10·11의 그림자 테두리)만큼 바로잡아 칸에 딱 맞춤
// · 메모리 비우기: EmptyWorkingSet(프로그램은 그대로 · 쓰던 메모리를 디스크 쪽으로 내려 둠 — 다시 쓰면 돌아옴)
// · 닫기: WM_CLOSE를 보내 '닫아 달라고' 부탁만(저장 안 한 문서는 그 프로그램이 물음 · 강제 종료 없음)
// · (0.1.3) 윈도우 PowerShell 5.1의 Add-Type은 C# 5 컴파일러 — tests/t_cs.js가 mcs -langversion:5로 엮어 봄(0.1.1~0.1.2는 한 줄 타입 오류로 아예 안 엮였음)
// · 탐색기 탭(윈도우 11): 창을 앞으로 → Ctrl+T → Ctrl+L(주소창) → 경로 글자(유니코드 입력) → Enter · 단계마다 그 창이 맨 앞인지 보고 아니면 글자를 치지 않고 멈춤
using System;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

public static class RnDock {
  public delegate bool EP(IntPtr h, IntPtr l);
  public delegate bool MP(IntPtr m, IntPtr dc, ref RECT r, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L; public int T; public int R; public int B; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] public struct MONITORINFOEX { public int cbSize; public RECT rcMonitor; public RECT rcWork; public uint dwFlags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string szDevice; }
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr v);
  [DllImport("shcore.dll")] static extern int SetProcessDpiAwareness(int v);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool EnumDisplayMonitors(IntPtr dc, IntPtr clip, MP f, IntPtr l);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern bool GetMonitorInfo(IntPtr m, ref MONITORINFOEX mi);
  [DllImport("shcore.dll")] static extern int GetDpiForMonitor(IntPtr m, int t, out uint x, out uint y);
  [DllImport("user32.dll")] static extern bool EnumWindows(EP f, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint c);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int w, int hh, uint f);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")] static extern IntPtr GetWL(IntPtr h, int i);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT r, int n);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out int v, int n);
  [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint a, bool i, uint pid);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  [DllImport("psapi.dll")] static extern bool EmptyWorkingSet(IntPtr h);
  [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr h, uint code);
  [DllImport("kernel32.dll")] static extern bool GetExitCodeProcess(IntPtr h, out uint code);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint f, UIntPtr extra);
  [DllImport("user32.dll", SetLastError = true)] static extern uint SendInput(uint n, INPUT[] inputs, int size);
  [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
  [StructLayout(LayoutKind.Sequential)] public struct PT { public int X; public int Y; }
  [DllImport("user32.dll")] static extern bool GetCursorPos(out PT p);
  [StructLayout(LayoutKind.Sequential)] public struct MOUSEINPUT { public int dx; public int dy; public uint mouseData; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
  [StructLayout(LayoutKind.Sequential)] public struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
  [StructLayout(LayoutKind.Explicit)] public struct INPUTU { [FieldOffset(0)] public MOUSEINPUT mi; [FieldOffset(0)] public KEYBDINPUT ki; }
  [StructLayout(LayoutKind.Sequential)] public struct INPUT { public uint type; public INPUTU u; }

  public class Mon { public string Id; public bool Primary; public RECT B; public RECT Wa; public uint Dpi; }
  public class Win { public long H; public uint Pid; public string Proc; public string Cls; public string Title; public RECT R; public bool Ic; public bool Zm; public string Udd; } // (0.1.6) Udd = 크롬 프로필 폴더(--user-data-dir · 소문자 · 없으면 "" · 모르면 null) — PowerShell이 프로세스 명령 줄에서 채움

  static bool aware = false;
  // DPI 인식 — 다른 무엇보다 먼저(Forms를 불러오기 전에)
  public static string Aware() { if (aware) return "already"; aware = true;
    try { if (SetProcessDpiAwarenessContext(new IntPtr(-4))) return "pmv2"; } catch (Exception) { }
    try { if (SetProcessDpiAwareness(2) == 0) return "pm"; } catch (Exception) { }
    try { SetProcessDPIAware(); return "system"; } catch (Exception) { }
    return "none"; }

  public static List<Mon> Monitors() { var L = new List<Mon>();
    EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (IntPtr m, IntPtr dc, ref RECT r, IntPtr l) => {
      var mi = new MONITORINFOEX(); mi.cbSize = Marshal.SizeOf(typeof(MONITORINFOEX));
      if (GetMonitorInfo(m, ref mi)) { uint dx = 96, dy = 96; try { if (GetDpiForMonitor(m, 0, out dx, out dy) != 0) dx = 96; } catch (Exception) { dx = 96; }
        L.Add(new Mon { Id = mi.szDevice, Primary = (mi.dwFlags & 1) != 0, B = mi.rcMonitor, Wa = mi.rcWork, Dpi = dx }); }
      return true; }, IntPtr.Zero);
    return L; }

  static bool Cloaked(IntPtr h) { try { int v; if (DwmGetWindowAttribute(h, 14, out v, 4) == 0) return v != 0; } catch (Exception) { } return false; }
  static Dictionary<uint, string> procNames = new Dictionary<uint, string>();
  static string ProcName(uint pid) { string n; if (procNames.TryGetValue(pid, out n)) return n; try { n = Process.GetProcessById((int)pid).ProcessName; } catch (Exception) { n = ""; } procNames[pid] = n; return n; }

  // 사람이 보는 맨 위 창만(보이고 · 제목 있고 · 도구 창 아님 · 숨겨진(cloaked) 창 아님 · 주인 창 없음)
  public static List<Win> Windows() { var L = new List<Win>(); procNames.Clear();
    EnumWindows((h, l) => {
      if (!IsWindowVisible(h)) return true; if (GetWindowTextLength(h) == 0) return true; if (GetWindow(h, 4) != IntPtr.Zero) return true;
      long ex = GetWL(h, -20).ToInt64(); if ((ex & 0x80L) != 0) return true; if (Cloaked(h)) return true;
      uint pid; GetWindowThreadProcessId(h, out pid);
      var c = new StringBuilder(256); GetClassName(h, c, 256); var t = new StringBuilder(512); GetWindowText(h, t, 512);
      RECT r; GetWindowRect(h, out r);
      L.Add(new Win { H = h.ToInt64(), Pid = pid, Proc = ProcName(pid), Cls = c.ToString(), Title = t.ToString(), R = r, Ic = IsIconic(h), Zm = IsZoomed(h) });
      return true; }, IntPtr.Zero);
    return L; }

  // (0.1.6) 숨은 맨 위 창 — 트레이로만 뜨는 프로그램(카카오톡 등)이 창을 숨긴 채 떠 있을 때 · 그 프로세스 이름 + 제목(정규식) · 주인 창 없음 · 도구 창 아님
  public static List<Win> Hidden(string proc, string title) { var L = new List<Win>(); procNames.Clear(); System.Text.RegularExpressions.Regex re; try { re = new System.Text.RegularExpressions.Regex(title ?? "", System.Text.RegularExpressions.RegexOptions.IgnoreCase); } catch (Exception) { re = new System.Text.RegularExpressions.Regex("(?!)"); }
    EnumWindows((h, l) => {
      if (IsWindowVisible(h)) return true; if (GetWindowTextLength(h) == 0) return true; if (GetWindow(h, 4) != IntPtr.Zero) return true;
      long ex = GetWL(h, -20).ToInt64(); if ((ex & 0x80L) != 0) return true;
      uint pid; GetWindowThreadProcessId(h, out pid); string pn = ProcName(pid); if (!string.Equals(pn, proc ?? "", StringComparison.OrdinalIgnoreCase)) return true;
      var t = new StringBuilder(512); GetWindowText(h, t, 512); if (!re.IsMatch(t.ToString())) return true;
      var c = new StringBuilder(256); GetClassName(h, c, 256); RECT r; GetWindowRect(h, out r);
      L.Add(new Win { H = h.ToInt64(), Pid = pid, Proc = pn, Cls = c.ToString(), Title = t.ToString(), R = r, Ic = IsIconic(h), Zm = IsZoomed(h) });
      return true; }, IntPtr.Zero);
    return L; }
  // (0.1.6) 숨은 창을 보이게(SW_SHOW · 최소화면 되살림) — 보이면 true
  public static bool Unhide(long hv) { IntPtr h = new IntPtr(hv); if (!IsWindow(h)) return false; ShowWindow(h, 5); if (IsIconic(h)) ShowWindow(h, 9); Thread.Sleep(200); return IsWindowVisible(h); }

  // (0.1.6) 크롬 창 고르기 — 띄우기 바로 전에 있던 창(pre)·이미 다른 단계가 잡은 창(claimed)은 빼고, 프로세스 이름·창 종류·프로필(udd)이 맞는 것
  //  udd: null 또는 "*" = 아무 프로필(PowerShell은 $null을 ""로 넘기므로 "*") · "" = 평소 크롬(--user-data-dir 없음) · 그 밖 = 그 폴더 · uddNot: 이 정규식에 맞는 프로필은 뺌(우리 도우미 크롬 — …\readnow\…)
  //  hint(정규식 · 대소문자 무시): 제목이 맞는 창을 먼저 — 없으면 맨 위(가장 최근에 뜬) 창 · 고른 창이 없으면 0
  //  (0.1.5까지는 크롬을 모두 띄운 뒤 '새로 뜬 아무 크롬 창'을 단계 차례대로 집어서, 윈도우 창 차례(맨 위 = 마지막에 뜬 창)대로 거꾸로 놓였음 — 정범님 11/14 15:36)
  public static long PickNew(Win[] now, long[] pre, long[] claimed, string proc, string cls, string udd, string uddNot, string hint) {
    var skip = new HashSet<long>(); if (pre != null) foreach (var x in pre) skip.Add(x); if (claimed != null) foreach (var x in claimed) skip.Add(x);
    System.Text.RegularExpressions.Regex hr = null, nr = null; var O = System.Text.RegularExpressions.RegexOptions.IgnoreCase;
    try { if (!string.IsNullOrEmpty(hint)) hr = new System.Text.RegularExpressions.Regex(hint, O); } catch (Exception) { hr = null; }   // 단서 글이 잘못돼도 멈추지 않음(단서 없이)
    try { if (!string.IsNullOrEmpty(uddNot)) nr = new System.Text.RegularExpressions.Regex(uddNot, O); } catch (Exception) { nr = null; }
    long first = 0;
    foreach (var w in now) { if (w == null || skip.Contains(w.H)) continue;
      if (!string.IsNullOrEmpty(proc) && !string.Equals(w.Proc, proc, StringComparison.OrdinalIgnoreCase)) continue;
      if (!string.IsNullOrEmpty(cls) && w.Cls != cls) continue;
      if (udd != null && udd != "*" && w.Udd != null && w.Udd != udd) continue;
      if (nr != null && w.Udd != null && w.Udd.Length > 0 && nr.IsMatch(w.Udd)) continue;
      if (hr != null && hr.IsMatch(w.Title ?? "")) return w.H;
      if (first == 0) first = w.H; }
    return hr != null ? -first : first; } // 제목 단서가 있는데 맞는 창이 없으면 음수(= 고를 창은 있지만 제목이 아직 안 맞음 · PowerShell이 몇 초 더 기다렸다가 그 창을 씀)

  // (0.1.9) 옛 먼저 닫기 판정(CloseWhy — 크롬 창·수집기 제목을 늘 지켜 크롬 위주 배치에선 거의 아무것도 안 닫혔음)은 뺌 · 이제 PowerShell CloseSet(apps.js closeRules 규칙 · NeverWhy 지킴)

  // 칸에 놓기 — 돌려주는 값: 놓은 뒤 보이는 테두리 자리
  public static RECT Place(long hv, int x, int y, int w, int hh) { IntPtr h = new IntPtr(hv);
    if (IsIconic(h) || IsZoomed(h)) ShowWindow(h, 9);
    const uint F = 0x0004 | 0x0010 | 0x0040; // 순서 그대로 · 앞으로 안 꺼냄 · 보이기
    SetWindowPos(h, IntPtr.Zero, x, y, w, hh, F);
    // 모니터 배율이 바뀌면 창이 스스로 크기를 고침 → 한 번 더
    SetWindowPos(h, IntPtr.Zero, x, y, w, hh, F);
    RECT r, f; GetWindowRect(h, out r);
    if (DwmGetWindowAttribute(h, 9, out f, Marshal.SizeOf(typeof(RECT))) == 0) {
      int dl = f.L - r.L, dt = f.T - r.T, dr = r.R - f.R, db = r.B - f.B;
      if (dl != 0 || dt != 0 || dr != 0 || db != 0) SetWindowPos(h, IntPtr.Zero, x - dl, y - dt, w + dl + dr, hh + dt + db, F);
      DwmGetWindowAttribute(h, 9, out f, Marshal.SizeOf(typeof(RECT))); return f; }
    GetWindowRect(h, out r); return r; }

  // 메모리 비우기 — 되면 true
  public static bool Trim(uint pid) { IntPtr p = OpenProcess(0x0100 | 0x0400, false, pid); if (p == IntPtr.Zero) return false; try { return EmptyWorkingSet(p); } finally { CloseHandle(p); } }

  // 닫아 달라고 부탁(WM_CLOSE) — 강제 종료는 아래 Kill(남은 것만)
  public static bool Close(long hv) { IntPtr h = new IntPtr(hv); if (!IsWindow(h)) return false; return PostMessage(h, 0x0010, IntPtr.Zero, IntPtr.Zero); }
  public static bool Exists(long hv) { return IsWindow(new IntPtr(hv)); }
  public static bool Visible(long hv) { return IsWindowVisible(new IntPtr(hv)); } // (0.1.6) 닫기 부탁 뒤 트레이로 숨는 프로그램(카카오톡·Claude)은 숨으면 닫힌 것으로 봄
  // (0.1.9 · 정범님 11/17 16:16 「수집기든 뭐든 전부 닫게」) 닫아 달라고 부탁해도 남은 프로그램을 강제로 끝냄(TerminateProcess) — 끝냈다고 받아들여지면 true
  //  PowerShell이 '그 프로세스가 가진 다른 창이 없고 · 셸·시스템·PC 배치 자신이 아님'을 확인한 뒤에만 부름
  public static bool Kill(uint pid) { if (pid == 0) return false; IntPtr p = OpenProcess(0x0001, false, pid); if (p == IntPtr.Zero) return false; try { return TerminateProcess(p, 1); } finally { CloseHandle(p); } }
  // (0.1.9) 프로세스가 아직 살아 있나 — 못 열면(이미 끝남·없음) false · 열었는데 끝 코드가 STILL_ACTIVE(259)면 true
  //  (0.1.8까지는 창이 숨기만 해도 '닫힘'으로 봐서 트레이로 숨은 카카오톡·Claude가 그대로 살아 있었음)
  public static bool Alive(uint pid) { if (pid == 0) return false; IntPtr p = OpenProcess(0x1000, false, pid); if (p == IntPtr.Zero) return false; try { uint c; if (!GetExitCodeProcess(p, out c)) return true; return c == 259; } finally { CloseHandle(p); } }

  static INPUT Kb(ushort vk, ushort scan, uint flags) { INPUT i = new INPUT(); i.type = 1; i.u.ki.wVk = vk; i.u.ki.wScan = scan; i.u.ki.dwFlags = flags; return i; }
  static void Send(List<INPUT> L) { if (L.Count == 0) return; SendInput((uint)L.Count, L.ToArray(), Marshal.SizeOf(typeof(INPUT))); }
  static void Combo(ushort vk, bool ctrl) { var L = new List<INPUT>(); if (ctrl) L.Add(Kb(0x11, 0, 0)); L.Add(Kb(vk, 0, 0)); L.Add(Kb(vk, 0, 2)); if (ctrl) L.Add(Kb(0x11, 0, 2)); Send(L); }
  static void TypeText(string s) { var L = new List<INPUT>(); foreach (char c in s) { L.Add(Kb(0, c, 4)); L.Add(Kb(0, c, 4 | 2)); } Send(L); }
  // 창을 맨 앞으로(윈도우가 막으면 Alt를 한 번 눌렀다 떼는 흔한 방법으로 한 번 더) — 맨 앞이 되면 true
  public static bool Front(long hv) { IntPtr h = new IntPtr(hv); if (GetForegroundWindow() == h) return true;
    if (IsIconic(h)) ShowWindow(h, 9); SetForegroundWindow(h); Thread.Sleep(150); if (GetForegroundWindow() == h) return true;
    keybd_event(0x12, 0, 0, UIntPtr.Zero); keybd_event(0x12, 0, 2, UIntPtr.Zero); SetForegroundWindow(h); Thread.Sleep(250); return GetForegroundWindow() == h; }
  // (0.1.10 · 정범님 11/18 I-1118-1208) 창 안 한 점을 왼쪽 단추로 한 번 누름(진짜 마우스 누름 — 크롬은 사람이 누른 뒤에야 비밀번호 관리자가 채운 값을 페이지에 넘김)
  //  창이 맨 앞이 아니거나 점이 창 밖이면 누르지 않고 까닭 · 누른 뒤 마우스 자리는 되돌림 · 글자는 치지 않음(값을 다루지 않음) · 되면 ""
  public static string ClickAt(long hv, int x, int y) { IntPtr h = new IntPtr(hv);
    if (!IsWindow(h)) return "창이 없어짐";
    if (!Front(hv)) return "창을 앞으로 못 가져옴";
    RECT r; if (!GetWindowRect(h, out r) || x < r.L || x >= r.R || y < r.T || y >= r.B) return "누를 자리가 창 밖";
    PT old; bool had = GetCursorPos(out old);
    if (!SetCursorPos(x, y)) return "마우스를 못 옮김";
    Thread.Sleep(80); if (GetForegroundWindow() != h) { if (had) SetCursorPos(old.X, old.Y); return "누르기 직전 다른 창이 앞에 옴"; }
    var L = new List<INPUT>(); INPUT d = new INPUT(); d.type = 0; d.u.mi.dwFlags = 0x0002; L.Add(d); INPUT u = new INPUT(); u.type = 0; u.u.mi.dwFlags = 0x0004; L.Add(u); Send(L);
    Thread.Sleep(120); if (had) SetCursorPos(old.X, old.Y); return ""; }
  static string TitleOf(IntPtr h) { var t = new StringBuilder(512); GetWindowText(h, t, 512); return t.ToString(); }
  // 탐색기 창에 탭 하나(경로) 더하기 — 되면 "" · 안 되면 까닭
  public static string ExplorerTab(long hv, string path, string leaf, int ms) { IntPtr h = new IntPtr(hv);
    if (!IsWindow(h)) return "창이 없어짐";
    if (!Front(hv)) return "탐색기 창을 앞으로 못 가져옴";   // (0.1.3) Front는 long을 받음 — 0.1.1~0.1.2는 여기서 IntPtr를 넘겨 C# 글 전체가 안 엮였음(모든 윈도우 일 실패 · 「모니터를 못 읽었습니다」)
    Combo(0x54, true); Thread.Sleep(900);                       // Ctrl+T 새 탭
    if (GetForegroundWindow() != h) return "새 탭 뒤 다른 창이 앞에 옴";
    Combo(0x4C, true); Thread.Sleep(350);                       // Ctrl+L 주소창
    if (GetForegroundWindow() != h) return "주소창을 못 잡음";
    TypeText(path); Thread.Sleep(120); Combo(0x0D, false);      // 경로 + Enter
    string want = (leaf ?? "").ToLowerInvariant(); var sw = Stopwatch.StartNew();
    while (sw.ElapsedMilliseconds < ms) { Thread.Sleep(250); string t = TitleOf(h).ToLowerInvariant(); if (want.Length > 0 && t.Contains(want)) return ""; }
    return "탭을 열었지만 그 폴더로 바뀌지 않음"; }
}
