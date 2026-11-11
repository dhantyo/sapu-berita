package id.sapu.berita;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/**
 * The clean reader: the news page in a WebView, with the Sapu Berita script injected at document start
 * (the same core as the desktop extension and the iPhone Shortcut). Links to other news articles stay
 * here; anything else is handed to the user's normal browser.
 */
public class ReaderActivity extends Activity {
    private static final String TAG = "SapuBerita";
    private static final String KEY_SETTINGS = "reader_settings";

    private WebView web;
    private String script;
    private boolean documentStart;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        script = readAsset("webview.js");
        // Debug builds: inspect pages from chrome://inspect on a computer.
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        // Android 15 draws apps edge-to-edge: keep the page (and our overlay's top bar) clear of the system bars.
        FrameLayout root = new FrameLayout(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setSupportMultipleWindows(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setAllowFileAccess(false);

        web.addJavascriptInterface(new Bridge(getApplicationContext()), "SapuBeritaAndroid");

        // Best: run the script before the page's own scripts, as soon as the HTML is parsed.
        if (script != null && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(web, script, Collections.singleton("*"));
            documentStart = true;
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri uri = request.getUrl();
                if (NewsSites.get(ReaderActivity.this).isArticle(uri)) return false;
                Browsers.open(ReaderActivity.this, uri);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // Older WebView without document-start scripts: inject now (the script guards against running twice).
                if (!documentStart && script != null) view.evaluateJavascript(script, null);
            }
        });

        load(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        load(intent);
    }

    private void load(Intent intent) {
        Uri uri = intent.getData();
        if (uri != null) web.loadUrl(uri.toString());
        else finish();
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            Log.e(TAG, "missing asset " + name + " (run npm run build)", e);
            return null;
        }
    }

    /** window.SapuBeritaAndroid: settings shared by every site, and the run's outcome for logging. */
    static final class Bridge {
        private final Context context;

        Bridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String loadSettings() {
            return context.getSharedPreferences(Browsers.PREFS, Context.MODE_PRIVATE).getString(KEY_SETTINGS, "");
        }

        @JavascriptInterface
        public void saveSettings(String json) {
            // Only a small JSON object of reader preferences; cap it so a hostile page can't bloat storage.
            if (json == null || json.length() > 2000) return;
            context.getSharedPreferences(Browsers.PREFS, Context.MODE_PRIVATE).edit().putString(KEY_SETTINGS, json).apply();
        }

        @JavascriptInterface
        public void onResult(String json) {
            Log.i(TAG, "result " + json);
        }
    }
}
