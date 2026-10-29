package kr.readnow.friend

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.text.InputFilter
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * 🐾 책방 친구 — 안내 화면(한국어): ① 다른 앱 위에 표시 ② 알림 ③ 배터리 최적화 제외 → 캐릭터 띄우기 · 연결 코드 칸
 * 웹앱의 연결 링크(readnow-friend://pair?...)로 열리면 바로 서비스에 넘겨 연결.
 */
class MainActivity : Activity() {
    private lateinit var box: LinearLayout
    private val green = Color.parseColor("#2F5D50")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handle(intent)
    }

    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); setIntent(intent); handle(intent) }
    override fun onResume() { super.onResume(); draw() }

    private fun handle(i: Intent?) {
        val d = i?.data ?: return
        if (d.scheme == "readnow-friend" && d.host == "pair") {
            if (!Settings.canDrawOverlays(this)) { pendingPair = d.toString(); draw(); return }
            startForegroundService(Intent(this, FriendService::class.java).putExtra(FriendService.EXTRA_PAIR, d.toString()))
            toastLine = "🔐 연결 링크를 받았어요 — 캐릭터 화면의 🐾 책방 친구 카드에서 결과를 보세요(안 되면 그 카드 칸에 코드 8자리)"
        }
    }

    private var pendingPair: String? = null
    private var toastLine: String? = null

    private fun okOverlay() = Settings.canDrawOverlays(this)
    private fun okNotify() = Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    private fun okBattery() = (getSystemService(POWER_SERVICE) as PowerManager).isIgnoringBatteryOptimizations(packageName)

    private fun tv(t: String, size: Float = 15f, bold: Boolean = false, color: Int = Color.parseColor("#1E2B28")) = TextView(this).apply {
        text = t; textSize = size; setTextColor(color); if (bold) setTypeface(typeface, Typeface.BOLD); setPadding(0, 10, 0, 6)
    }
    private fun btn(t: String, primary: Boolean = true, on: () -> Unit) = Button(this).apply {
        text = t; isAllCaps = false; textSize = 15f
        if (primary) { setBackgroundColor(green); setTextColor(Color.WHITE) }
        setOnClickListener { on() }
        layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = 8 }
    }
    private fun step(n: Int, title: String, ok: Boolean, why: String, action: String, go: () -> Unit) {
        box.addView(tv("${if (ok) "✅" else "⬜"} $n. $title", 17f, true, if (ok) green else Color.parseColor("#B0322A")))
        box.addView(tv(why, 14f, color = Color.parseColor("#5B6B66")))
        if (!ok) box.addView(btn(action) { go() })
    }

    private fun draw() {
        val sv = ScrollView(this); box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(44, 56, 44, 56) }; sv.addView(box); setContentView(sv)
        box.addView(tv("🐾 책방 친구", 26f, true, green))
        box.addView(tv("리드나우 캐릭터를 다른 앱 위에 띄워 새 주문·문의·불만족 평가·💬 메시지를 알려 줘요. 캐릭터 화면은 인터넷에서 받아 늘 최신이에요.", 15f))
        toastLine?.let { box.addView(tv(it, 15f, true, green)) }
        step(1, "다른 앱 위에 표시 허용", okOverlay(), "캐릭터가 다른 앱 위에 떠 있으려면 꼭 필요해요. 단추를 누르면 설정 화면이 열려요 → 목록에서 '책방 친구'를 찾아 스위치를 켜고 ← 뒤로 오세요.", "설정 열기") {
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
        }
        step(2, "알림 허용", okNotify(), "💬 메시지를 알림으로도 받고, 떠 있는 동안 위쪽에 '🐾 책방 친구가 떠 있어요'(끄기 단추)가 보여요. 단추 → '허용'.", "알림 허용하기") {
            if (Build.VERSION.SDK_INT >= 33) requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 7)
        }
        step(3, "배터리 최적화에서 빼기", okBattery(), "폰이 쉬는 동안 캐릭터가 꺼지지 않게 해요. 단추 → '허용'(또는 '제한 없음').", "배터리 설정 열기") {
            try { startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))) }
            catch (e: Exception) { startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)) }
        }
        box.addView(tv(if (FriendService.running) "지금: 캐릭터가 떠 있어요" else "지금: 꺼져 있어요", 16f, true))
        if (okOverlay()) {
            if (!FriendService.running) box.addView(btn("🐾 캐릭터 띄우기") {
                startForegroundService(Intent(this, FriendService::class.java).apply { pendingPair?.let { putExtra(FriendService.EXTRA_PAIR, it) } }); pendingPair = null; window.decorView.postDelayed({ draw() }, 500)
            }) else box.addView(btn("■ 캐릭터 끄기", false) { startService(Intent(this, FriendService::class.java).setAction(FriendService.ACT_STOP)); window.decorView.postDelayed({ draw() }, 1800) })
        }
        if (toastLine == null && FriendService.prefs(this).getString("dev", null).isNullOrEmpty()) box.addView(tv("🐾 연결이 필요해요 — 아래 칸에 코드를 넣거나 웹앱 단추를 누르세요(캐릭터 화면 카드는 머리줄을 끌어 옮기거나 접기 ▾로 작게 할 수 있어요)", 14f, true, Color.parseColor("#B0322A")))
        box.addView(tv("처음 한 번 연결", 17f, true, green))
        box.addView(tv("① 이 폰의 크롬에서 리드나우 웹앱 → ⚙ 설정 → 🐾 책방 친구 카드 → '🖥 이 기기에 책방 친구 프로그램 연결'을 누르면 이 앱이 열리며 저절로 연결돼요.\n② 저절로 안 되면 웹앱에 나온 연결 코드 8자리(10분 안 · 한 번만)를 아래에 넣고 '연결'.\n연결은 한 번이면 끝 — 그 뒤엔 켜기만 하면 저절로 로그인돼요.", 14f))
        val code = EditText(this).apply { hint = "ABCD-EFGH"; textSize = 22f; typeface = Typeface.MONOSPACE; filters = arrayOf(InputFilter.AllCaps(), InputFilter.LengthFilter(9)); gravity = Gravity.CENTER }
        box.addView(code)
        box.addView(btn("연결") {
            val v = code.text.toString().uppercase().filter { it.isLetterOrDigit() }
            if (v.length != 8) { code.error = "8자리(예: ABCD-EFGH)"; return@btn }
            if (!okOverlay()) { code.error = "먼저 1번(다른 앱 위에 표시)을 허용해 주세요"; return@btn }
            startForegroundService(Intent(this, FriendService::class.java).putExtra(FriendService.EXTRA_CODE, v))
            toastLine = "🔐 코드를 보냈어요 — 캐릭터 화면의 🐾 책방 친구 카드에서 결과를 보세요"; draw()
        })
        box.addView(btn("🌐 리드나우 웹앱 열기", false) { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://jerrycson.github.io/readnow-scripts/app/"))) })
        box.addView(tv("판 ${try { packageManager.getPackageInfo(packageName, 0).versionName } catch (e: Exception) { "?" }} · 새 판은 웹앱 ⚙ 설정 › 🐾 책방 친구 › ⬇ 설치 파일 받기", 12f, color = Color.parseColor("#5B6B66")))
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) { super.onRequestPermissionsResult(requestCode, permissions, grantResults); draw() }
}
