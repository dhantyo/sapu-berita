package id.sapu.berita;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

/**
 * Receives links to the news sites the user approved under "Open by default".
 * Articles open in the clean reader; homepages, section pages and the like go to the normal browser.
 * Invisible (translucent, no history), so the hand-off feels instant.
 */
public class RouterActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Uri uri = getIntent().getData();
        if (uri != null && NewsSites.get(this).isArticle(uri)) {
            startActivity(new Intent(this, ReaderActivity.class).setData(uri));
        } else if (uri != null) {
            Browsers.open(this, uri);
        }
        finish();
        overridePendingTransition(0, 0);
    }
}
