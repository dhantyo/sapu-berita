plugins {
    id("com.android.application")
}

// Version comes from the repo's package.json, like the extension and the Shortcut.
// versionCode must only ever grow: 0.1.0-beta.1 -> 10001, 0.1.0 -> 10099, 0.1.1 -> 10199.
val appVersion: String = Regex(""""version"\s*:\s*"([^"]+)"""")
    .find(rootProject.file("../../package.json").readText())!!.groupValues[1]
val appVersionCode: Int = run {
    val (core, pre) = appVersion.split("-", limit = 2).let { it[0] to it.getOrNull(1) }
    val (major, minor, patch) = core.split(".").map { it.toInt() }
    val preNumber = pre?.substringAfterLast(".")?.toIntOrNull() ?: 99
    ((major * 100 + minor) * 100 + patch) * 100 + (if (pre == null) 99 else preNumber)
}

// Release signing from the environment (CI secrets); without it, release builds fall back to the debug key.
val releaseKeystore: String? = System.getenv("SAPU_KEYSTORE")

android {
    namespace = "id.sapu.berita"
    compileSdk = 35

    defaultConfig {
        applicationId = "id.sapu.berita"
        minSdk = 26
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersion
    }

    signingConfigs {
        if (releaseKeystore != null) {
            create("release") {
                storeFile = file(releaseKeystore)
                storePassword = System.getenv("SAPU_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("SAPU_KEY_ALIAS")
                keyPassword = System.getenv("SAPU_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Every published APK must carry the same key, or Android refuses the update.
            // The key lives only in CI secrets (see apps/android/README.md); never commit it.
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // WebViewCompat.addDocumentStartJavaScript: run the cleaner as soon as the HTML is parsed.
    implementation("androidx.webkit:webkit:1.12.1")
}
