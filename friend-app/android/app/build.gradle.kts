// 🐾 책방 친구 (안드로이드) — 다른 앱 위에 캐릭터만 띄우는 작은 앱 · 안의 화면은 GitHub Pages friend/ (사이드로드 APK · 플레이 스토어 아님)
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
val friendVer = (System.getenv("FRIEND_VERSION") ?: "0.1.0").removePrefix("friend-v")
val verParts = friendVer.split(".").map { it.filter(Char::isDigit).ifEmpty { "0" }.toInt() } + listOf(0, 0, 0)
android {
    namespace = "kr.readnow.friend"
    compileSdk = 35
    defaultConfig {
        applicationId = "kr.readnow.friend"
        minSdk = 26
        targetSdk = 35
        versionCode = verParts[0] * 10000 + verParts[1] * 100 + verParts[2]
        versionName = friendVer
    }
    // 서명: 늘 같은 열쇠여야 새 판을 덮어 설치할 수 있음 — GitHub 비밀(FRIEND_KS_B64 등)이 있으면 그것, 없으면 디버그 열쇠(덮어 설치가 안 될 수 있음 · 자동 작업이 경고)
    val ksFile = System.getenv("FRIEND_KS_FILE")
    signingConfigs {
        if (ksFile != null && file(ksFile).exists()) {
            create("friend") {
                storeFile = file(ksFile)
                storePassword = System.getenv("FRIEND_KS_PASS")
                keyAlias = System.getenv("FRIEND_KS_ALIAS") ?: "friend"
                keyPassword = System.getenv("FRIEND_KS_PASS")
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (ksFile != null && file(ksFile).exists()) signingConfigs.getByName("friend") else signingConfigs.getByName("debug")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
}
