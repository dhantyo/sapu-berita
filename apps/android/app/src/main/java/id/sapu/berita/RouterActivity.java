package id.sapu.berita;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

/**
 * Every link the user taps arrives here once Sapu Berita is the default browser.
 * News article hosts open in the clean reader; everything else goes straight to the real browser.
 * Invisible (translucent, no history), so forwarding feels instant.
 */
public class RouterActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Uri uri = getIntent().getData();
        if (uri != null && NewsSites.get(this).isNews(uri)) {
            startActivity(new Intent(this, ReaderActivity.class).setData(uri));
        } else if (uri != null) {
            Browsers.open(this, uri);
        }
        finish();
        overridePendingTransition(0, 0);
    }
}
