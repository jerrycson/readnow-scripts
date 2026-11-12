// pcdock-win.cs — 🖥 PC 배치 도우미의 윈도우 다루기(user32 · shcore · dwmapi · psapi) — pcdock.ps1이 한 번 엮어(dll) 다시 씀
// · DPI 인식(모니터마다 · V2)으로 켜서 모든 자리를 '실제 화소'로 읽고 놓음 — 배율이 다른 모니터 사이로 옮겨도 크기가 어긋나지 않게
// · 창 놓기: 최소화·최대화를 풀고 → 놓고 → 보이지 않는 테두리(윈도우 10·11의 그림자 테두리)만큼 바로잡아 칸에 딱 맞춤
// · 메모리 비우기: EmptyWorkingSet(프로그램은 그대로 · 쓰던 메모리를 디스크 쪽으로 내려 둠 — 다시 쓰면 돌아옴)
using System;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

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

  public class Mon { public string Id; public bool Primary; public RECT B; public RECT Wa; public uint Dpi; }
  public class Win { public long H; public uint Pid; public string Proc; public string Cls; public string Title; public RECT R; public bool Ic; public bool Zm; }

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
}
