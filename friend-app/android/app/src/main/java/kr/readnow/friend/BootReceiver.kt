package kr.readnow.friend

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Settings

/** 폰을 켜거나 앱을 새 판으로 바꾼 뒤: 끄기 전에 켜 두었으면 다시 띄움 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        if (!FriendService.prefs(c).getBoolean("on", false) || !Settings.canDrawOverlays(c)) return
        try { c.startForegroundService(Intent(c, FriendService::class.java)) } catch (e: Exception) {}
    }
}
