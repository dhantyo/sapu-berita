package id.sapu.berita;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;

import java.util.ArrayList;
import java.util.List;

/** The user's real browser, which every non-news link is handed to. */
final class Browsers {
    static final String PREFS = "sapu";
    private static final String KEY_FORWARD = "forward_browser";
    /** Tried in order when the user hasn't picked one. */
    private static final String[] COMMON = {
        "com.android.chrome", "com.brave.browser", "org.mozilla.firefox", "com.microsoft.emmx",
        "com.sec.android.app.sbrowser", "com.opera.browser", "com.UCMobile.intl", "com.mi.globalbrowser",
    };

    private Browsers() {}

    /** Installed apps that can open web links, except us. */
    static List<ResolveInfo> installed(Context context) {
        Intent probe = new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com/"))
            .addCategory(Intent.CATEGORY_BROWSABLE);
        List<ResolveInfo> all = context.getPackageManager().queryIntentActivities(probe, PackageManager.MATCH_ALL);
        List<ResolveInfo> others = new ArrayList<>();
        for (ResolveInfo r : all) {
            if (!r.activityInfo.packageName.equals(context.getPackageName())) others.add(r);
        }
        return others;
    }

    static String chosen(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_FORWARD, null);
    }

    static void choose(Context context, String packageName) {
        SharedPreferences.Editor e = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        e.putString(KEY_FORWARD, packageName).apply();
    }

    /** The browser links get forwarded to: the user's choice, else a common one, else any. */
    static String target(Context context) {
        List<ResolveInfo> list = installed(context);
        String pick = chosen(context);
        if (pick != null && contains(list, pick)) return pick;
        for (String c : COMMON) if (contains(list, c)) return c;
        return list.isEmpty() ? null : list.get(0).activityInfo.packageName;
    }

    static void open(Context context, Uri uri) {
        Intent view = new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        String pkg = target(context);
        if (pkg != null) view.setPackage(pkg);
        try {
            context.startActivity(view);
        } catch (ActivityNotFoundException e) {
            view.setPackage(null);
            context.startActivity(Intent.createChooser(view, null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
    }

    static CharSequence label(Context context, String packageName) {
        try {
            PackageManager pm = context.getPackageManager();
            return pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0));
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }

    private static boolean contains(List<ResolveInfo> list, String pkg) {
        for (ResolveInfo r : list) if (r.activityInfo.packageName.equals(pkg)) return true;
        return false;
    }
}
