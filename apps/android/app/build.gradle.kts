plugins {
    id("com.android.application")
}

android {
    namespace = "id.sapu.berita"
    compileSdk = 35

    defaultConfig {
        applicationId = "id.sapu.berita"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-alpha"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Alpha builds are signed with the debug key so they install without a keystore.
            // Before a public release: create a real signing key and wire it in here (never commit it).
            signingConfig = signingConfigs.getByName("debug")
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
