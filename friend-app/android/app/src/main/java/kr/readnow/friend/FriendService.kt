package kr.readnow.friend

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Rect
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.core.app.NotificationCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject

/**
 * 🐾 책방 친구 — 다른 앱 위에 떠 있는 캐릭터(포그라운드 서비스 + SYSTEM_ALERT_WINDOW 오버레이)
 *
 * 화면(friend/index.html?host=android)은 '전체 화면 크기'의 투명 WebView에 그려지지만, 오버레이 창은 화면이 알려 준
 * '눌리는 칸'(rects)을 모두 감싸는 작은 직사각형만큼만 열림(WebView를 그만큼 거꾸로 옮겨 화면 좌표가 그대로 맞음).
 * → 캐릭터·단추·말풍선만 눌리고, 나머지는 원래 앱이 그대로 눌림(안드로이드 12+의 '믿지 않는 터치' 막힘도 없음).
 */
class FriendService : Service() {
    companion object {
        const val PAGE = "https://jerrycson.github.io/readnow-scripts/friend/index.html?host=android"
        const val ORIGIN = "https://jerrycson.github.io"
        const val CH_RUN = "run"
        const val CH_MSG = "msg"
        const val ACT_STOP = "kr.readnow.friend.STOP"
        const val EXTRA_PAIR = "pair" // readnow-friend://pair?... 전체
        const val EXTRA_CODE = "code" // 앱 칸에서 친 8자리
        @Volatile var running = false
        fun prefs(c: Context) = c.getSharedPreferences("friend", Context.MODE_PRIVATE)
    }

    private lateinit var wm: WindowManager
    private var root: FrameLayout? = null
    private var web: WebView? = null
    private var lp: WindowManager.LayoutParams? = null
    private val ui = Handler(Looper.getMainLooper())
    private var lastRects = "[]"
    private var lastKb = false
    private var hidden = false
    private var msgId = 100

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        BuildConfigLite.VER = try { packageManager.getPackageInfo(packageName, 0).versionName ?: "0" } catch (e: Exception) { "0" }
        channels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACT_STOP) { stopNicely(); return START_NOT_STICKY }
        startFg()
        if (!Settings.canDrawOverlays(this)) { stopSelf(); return START_NOT_STICKY }
        running = true
        prefs(this).edit().putBoolean("on", true).apply()
        if (web == null) addOverlay()
        intent?.getStringExtra(EXTRA_PAIR)?.let { pairLink(it) }
        intent?.getStringExtra(EXTRA_CODE)?.let { code -> web?.loadUrl("$PAGE#code=" + Uri.encode(code)) }
        return START_STICKY
    }

    private fun channels() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CH_RUN, "책방 친구 켜짐", NotificationManager.IMPORTANCE_MIN).apply { description = "캐릭터가 다른 앱 위에 떠 있는 동안 늘 보이는 알림(안드로이드 규칙)" })
        nm.createNotificationChannel(NotificationChannel(CH_MSG, "책방 친구 메시지", NotificationManager.IMPORTANCE_HIGH).apply { description = "💬 캐릭터 메시지를 받으면" })
    }

    private fun startFg() {
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val stop = PendingIntent.getService(this, 1, Intent(this, FriendService::class.java).setAction(ACT_STOP), PendingIntent.FLAG_IMMUTABLE)
        val n: Notification = NotificationCompat.Builder(this, CH_RUN)
            .setSmallIcon(android.R.drawable.star_on)
            .setContentTitle("🐾 책방 친구가 떠 있어요")
            .setContentText("눌러서 설정 · 끄기는 오른쪽 단추")
            .setContentIntent(open)
            .addAction(0, "끄기", stop)
            .setOngoing(true)
            .build()
        if (Build.VERSION.SDK_INT >= 34) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE) else startForeground(1, n)
    }

    /** 화면 크기(시스템 막대 뺀 곳)와 그 시작점 — WebView = 이 크기 · 화면 좌표의 원점 */
    private fun area(): Rect {
        return if (Build.VERSION.SDK_INT >= 30) {
            val m = wm.currentWindowMetrics
            val ins = m.windowInsets.getInsetsIgnoringVisibility(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            val b = m.bounds
            Rect(b.left + ins.left, b.top + ins.top, b.right - ins.right, b.bottom - ins.bottom)
        } else {
            @Suppress("DEPRECATION") val dm = android.util.DisplayMetrics().also { wm.defaultDisplay.getRealMetrics(it) }
            val sb = resources.getIdentifier("status_bar_height", "dimen", "android").let { if (it > 0) resources.getDimensionPixelSize(it) else 0 }
            val nb = resources.getIdentifier("navigation_bar_height", "dimen", "android").let { if (it > 0) resources.getDimensionPixelSize(it) else 0 }
            Rect(0, sb, dm.widthPixels, dm.heightPixels - nb)
        }
    }

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    private fun addOverlay() {
        val a = area()
        val w = object : WebView(this) {
            override fun dispatchKeyEvent(event: KeyEvent): Boolean {
                if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) { cmd("esc"); return true }
                return super.dispatchKeyEvent(event)
            }
        }
        w.setBackgroundColor(Color.TRANSPARENT)
        w.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        w.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            userAgentString = userAgentString + " ReadnowFriend/" + BuildConfigLite.VER
        }
        w.addJavascriptInterface(Bridge(), "RnHostAndroid")
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(w, "window.__rnFriendHost={type:'android',ver:'${BuildConfigLite.VER}',post:function(k,d){RnHostAndroid.post(String(k),JSON.stringify(d==null?null:d));}};", setOf(ORIGIN))
        }
        w.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val u = req.url
                if (u.host == "jerrycson.github.io" && u.path?.startsWith("/readnow-scripts/friend/") == true) return false
                openUrl(u.toString()); return true // 그 밖의 주소는 기본 브라우저로
            }
        }
        val fl = FrameLayout(this)
        fl.addView(w, FrameLayout.LayoutParams(a.width(), a.height()))
        val type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        val p = WindowManager.LayoutParams(1, 1, type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT)
        p.gravity = Gravity.TOP or Gravity.START
        p.x = a.left; p.y = a.top
        wm.addView(fl, p)
        root = fl; web = w; lp = p
        w.loadUrl(PAGE)
    }

    /** 화면이 알려 준 눌리는 칸(CSS px) → 그 칸들을 모두 감싸는 창(물리 px) · WebView는 반대로 옮겨 화면 좌표 그대로 */
    private fun applyRects(json: String, kb: Boolean) {
        val fl = root ?: return; val w = web ?: return; val p = lp ?: return
        val a = area(); val d = resources.displayMetrics.density
        var l = Int.MAX_VALUE; var t = Int.MAX_VALUE; var r = Int.MIN_VALUE; var b = Int.MIN_VALUE
        val arr = try { org.json.JSONArray(json) } catch (e: Exception) { org.json.JSONArray() }
        for (i in 0 until arr.length()) {
            val q = arr.optJSONArray(i) ?: continue
            l = minOf(l, (q.optDouble(0) * d).toInt() - 6); t = minOf(t, (q.optDouble(1) * d).toInt() - 6)
            r = maxOf(r, (q.optDouble(2) * d).toInt() + 6); b = maxOf(b, (q.optDouble(3) * d).toInt() + 6)
        }
        val wlp = w.layoutParams as FrameLayout.LayoutParams
        if (wlp.width != a.width() || wlp.height != a.height()) { wlp.width = a.width(); wlp.height = a.height(); w.layoutParams = wlp }
        if (hidden || arr.length() == 0 || r <= l || b <= t) {
            p.width = 1; p.height = 1; p.x = a.left; p.y = a.top
            p.flags = p.flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
            w.translationX = 0f; w.translationY = 0f
        } else {
            l = l.coerceIn(0, a.width() - 1); t = t.coerceIn(0, a.height() - 1); r = r.coerceIn(l + 1, a.width()); b = b.coerceIn(t + 1, a.height())
            p.width = r - l; p.height = b - t; p.x = a.left + l; p.y = a.top + t
            w.translationX = -l.toFloat(); w.translationY = -t.toFloat()
            p.flags = p.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
            p.flags = if (kb) p.flags and WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE.inv() else p.flags or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        }
        try { wm.updateViewLayout(fl, p) } catch (e: Exception) {}
        if (kb && !lastKb) w.requestFocus()
        lastKb = kb
    }

    inner class Bridge {
        @JavascriptInterface
        fun post(kind: String, json: String) {
            val o = try { JSONObject(json) } catch (e: Exception) { JSONObject() }
            when (kind) {
                "rects" -> { val r = o.optJSONArray("r")?.toString() ?: "[]"; val kb = o.optBoolean("kb"); ui.post { if (r != lastRects || kb != lastKb) { lastRects = r; applyRects(r, kb) } } }
                "notify" -> ui.post { notifyMsg(o.optString("title", "💬 책방 친구"), o.optString("text", "")) }
                "open" -> ui.post { openUrl(o.optString("url")) }
                "paired" -> prefs(this@FriendService).edit().putString("dev", o.optString("dev")).apply()
                "signout" -> prefs(this@FriendService).edit().remove("dev").apply()
                "byeok" -> ui.post { finishStop() }
            }
        }
    }

    private fun notifyMsg(title: String, text: String) {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) return
        val open = PendingIntent.getActivity(this, 2, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(this, CH_MSG).setSmallIcon(android.R.drawable.sym_action_chat).setContentTitle(title).setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text)).setAutoCancel(true).setContentIntent(open).setPriority(NotificationCompat.PRIORITY_HIGH).build()
        getSystemService(NotificationManager::class.java).notify(msgId++, n)
        if (msgId > 140) msgId = 100
    }

    private fun openUrl(u: String) {
        if (!u.startsWith("https://")) return
        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: Exception) {}
    }

    private fun cmd(c: String) { web?.evaluateJavascript("window.__rnFriendCmd&&window.__rnFriendCmd('$c')", null) }

    /** readnow-friend://pair?t=…&c=…&d=… → 화면을 #pair=… 로 */
    private fun pairLink(link: String) {
        val u = Uri.parse(link); val t = u.getQueryParameter("t") ?: return
        if (!t.matches(Regex("[A-Za-z0-9_-]{20,64}"))) return
        val c = u.getQueryParameter("c") ?: ""; val d = u.getQueryParameter("d") ?: ""
        web?.loadUrl("$PAGE#pair=" + Uri.encode(t) + "&c=" + Uri.encode(c) + "&d=" + Uri.encode(d))
    }

    fun setHidden(h: Boolean) { hidden = h; cmd(if (h) "hide" else "show") }

    /** 끄기: 화면에 '끔' 신호(같은 기기 웹앱 안 캐릭터가 바로 돌아옴) → 최대 1.5초 기다림 */
    private fun stopNicely() {
        prefs(this).edit().putBoolean("on", false).apply()
        if (web == null) { finishStop(); return }
        cmd("bye"); ui.postDelayed({ finishStop() }, 1500)
    }

    private var stopped = false
    private fun finishStop() {
        if (stopped) return; stopped = true
        running = false
        try { root?.let { wm.removeView(it) } } catch (e: Exception) {}
        web?.destroy(); web = null; root = null
        stopForeground(STOP_FOREGROUND_REMOVE); stopSelf()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ui.postDelayed({ applyRects(lastRects, lastKb) }, 300) // 화면 돌림 → WebView 크기·창 자리 다시
    }

    override fun onDestroy() { if (!stopped) { running = false; try { root?.let { wm.removeView(it) } } catch (e: Exception) {}; web?.destroy() }; super.onDestroy() }
}

/** BuildConfig 없이 판 번호(Gradle versionName과 같음 — 패키지 정보에서) */
object BuildConfigLite { @Volatile var VER: String = "0" }
