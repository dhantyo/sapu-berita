package id.sapu.berita;

import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;

import java.util.List;

/**
 * Hands a page to the user's normal browser. Needed because once the user approves a news site for
 * Sapu Berita, a plain "view this link" would come straight back to us for that site's homepage.
 */
final class Browsers {
    static final String PREFS = "sapu";

    private Browsers() {}

    static void open(Context context, Uri uri) {
        Intent view = new Intent(Intent.ACTION_VIEW, uri)
            .addCategory(Intent.CATEGORY_BROWSABLE)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        String browser = defaultBrowser(context);
        if (browser != null) view.setPackage(browser);
        try {
            context.startActivity(view);
        } catch (ActivityNotFoundException e) {
            view.setPackage(null);
            Intent chooser = Intent.createChooser(view, null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                chooser.putExtra(Intent.EXTRA_EXCLUDE_COMPONENTS,
                    new ComponentName[] {new ComponentName(context, RouterActivity.class)});
            }
            context.startActivity(chooser);
        }
    }

    /** The app that opens ordinary web links (asked with a site we never claim). Null if unclear. */
    private static String defaultBrowser(Context context) {
        PackageManager pm = context.getPackageManager();
        Intent probe = new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com/"))
            .addCategory(Intent.CATEGORY_BROWSABLE);
        ResolveInfo r = pm.resolveActivity(probe, PackageManager.MATCH_DEFAULT_ONLY);
        if (r != null && r.activityInfo != null && !"android".equals(r.activityInfo.packageName)
            && !context.getPackageName().equals(r.activityInfo.packageName)) {
            return r.activityInfo.packageName;
        }
        // No default chosen yet (the system would show a chooser): pick any browser that isn't us.
        List<ResolveInfo> all = pm.queryIntentActivities(probe, PackageManager.MATCH_ALL);
        for (ResolveInfo i : all) {
            if (!context.getPackageName().equals(i.activityInfo.packageName)) return i.activityInfo.packageName;
        }
        return null;
    }
}
