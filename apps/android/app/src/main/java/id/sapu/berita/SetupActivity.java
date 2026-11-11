package id.sapu.berita;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.verify.domain.DomainVerificationManager;
import android.content.pm.verify.domain.DomainVerificationUserState;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * First run: a hand-held, three-step guide.
 *   1. What Sapu Berita does.
 *   2. Let it open news links. Android 12+: a drawing of the "Open by default" screen with numbered
 *      taps, a button that opens exactly that screen, and a live check when the reader comes back
 *      (which sites are on, which are missing, which belong to an official app). Android 8 to 11:
 *      open a news link so the system asks "which app?", and pick Sapu Berita, Always.
 *   3. Try it on a sample article.
 * Afterwards the same screen is a small home: status, fix-it button, sample, version.
 * Built in code (no layouts) to keep the app tiny.
 */
public class SetupActivity extends Activity {
    private static final String SAMPLE = "https://nasional.kompas.com/read/2026/11/10/20432761/hidayat-nur-wahid-mundur-dari-wakil-ketua-mpr";
    private static final String PREF_ONBOARDED = "onboarded";
    private static final int STEPS = 3;
    private static final boolean MODERN = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S;

    private int ink, muted, ochre, onOchre, card, good, warn;
    private ScrollView scroll;
    /** 0 = home, 1..3 = guide steps. */
    private int step;
    private TextView status;
    private Button nextButton;
    /** Step 2's main action; steps back once the job is done so "Next" leads. */
    private Button actionButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        ink = night ? Color.rgb(232, 232, 230) : Color.rgb(18, 18, 18);
        muted = night ? Color.rgb(168, 168, 165) : Color.rgb(92, 92, 92);
        ochre = night ? Color.rgb(222, 172, 70) : Color.rgb(176, 122, 18);
        onOchre = night ? Color.rgb(18, 18, 18) : Color.WHITE; // light ochre in dark mode needs dark text
        card = night ? Color.rgb(32, 32, 32) : Color.rgb(246, 243, 236);
        good = night ? Color.rgb(120, 200, 140) : Color.rgb(30, 120, 60);
        warn = night ? Color.rgb(240, 160, 90) : Color.rgb(170, 80, 20);

        scroll = new ScrollView(this);
        scroll.setFitsSystemWindows(true);
        setContentView(scroll);

        int saved = savedInstanceState != null ? savedInstanceState.getInt("step", -1) : -1;
        show(saved >= 0 ? saved : prefs().getBoolean(PREF_ONBOARDED, false) ? 0 : 1);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        out.putInt("step", step);
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshStatus(); // coming back from Settings: show what changed
    }

    @Override
    public void onBackPressed() {
        if (step > 1) show(step - 1);
        else super.onBackPressed();
    }

    private void show(int s) {
        step = s;
        status = null;
        nextButton = null;
        actionButton = null;
        LinearLayout col = column();
        switch (s) {
            case 1: welcome(col); break;
            case 2: if (MODERN) links(col); else linksOld(col); break;
            case 3: tryIt(col); break;
            default: home(col);
        }
        scroll.removeAllViews();
        scroll.addView(col);
        scroll.scrollTo(0, 0);
        refreshStatus();
    }

    // ── Step 1 ────────────────────────────────────────────────────────
    private void welcome(LinearLayout col) {
        col.addView(stepLabel(1));
        col.addView(title(getString(R.string.welcome_title)));
        col.addView(body(getString(R.string.welcome_lead), 16, muted, 8, 20));
        for (int id : new int[] {R.string.welcome_point_1, R.string.welcome_point_2, R.string.welcome_point_3}) {
            col.addView(bullet(getString(id)));
        }
        col.addView(button(getString(R.string.welcome_start), true, v -> show(2)));
    }

    // ── Step 2, Android 12+ ───────────────────────────────────────────
    private void links(LinearLayout col) {
        col.addView(stepLabel(2));
        col.addView(title(getString(R.string.links_title)));
        col.addView(body(getString(R.string.links_lead), 15, muted, 8, 14));
        col.addView(settingsDrawing());
        col.addView(body(getString(R.string.links_mock_note), 12, muted, 6, 14));
        col.addView(numbered(1, getString(R.string.links_do_1, getString(R.string.sys_open_supported))));
        col.addView(numbered(2, getString(R.string.links_do_2, getString(R.string.sys_add_link))));
        col.addView(numbered(3, getString(R.string.links_do_3, getString(R.string.sys_add), declaredHosts().size())));
        col.addView(numbered(4, getString(R.string.links_do_4)));
        actionButton = button(getString(R.string.links_open), true, v -> openLinkSettings());
        col.addView(actionButton);
        status = body("", 15, muted, 16, 0);
        col.addView(status);
        col.addView(body(getString(R.string.links_fallback, getString(R.string.sys_add_link), getString(R.string.sys_open_by_default)), 12, muted, 10, 0));
        nextButton = button(getString(R.string.next), false, v -> show(3));
        col.addView(nextButton);
    }

    /** A sketch of Android's "Open by default" screen and its "Add link" dialog, with the taps numbered. */
    private View settingsDrawing() {
        LinearLayout phone = box(card, dp(14), dp(16));

        TextView heading = sys(body(getString(R.string.sys_open_by_default), 18, ink, 0, 12));
        heading.setTypeface(Typeface.DEFAULT_BOLD);
        phone.addView(heading);

        // Row 1: the master switch.
        LinearLayout row1 = row();
        row1.addView(badge(1));
        row1.addView(grow(sys(body(getString(R.string.sys_open_supported), 14, ink, 0, 0))));
        row1.addView(fakeSwitch());
        phone.addView(row1);

        // Row 2: "+ Add link", ringed.
        LinearLayout row2 = row();
        row2.addView(badge(2));
        TextView add = body("+  " + getString(R.string.sys_add_link), 14, ochre, 0, 0);
        add.setTypeface(Typeface.DEFAULT_BOLD);
        add.setPadding(dp(10), dp(6), dp(10), dp(6));
        GradientDrawable ring = new GradientDrawable();
        ring.setCornerRadius(dp(8));
        ring.setStroke(dp(2), ochre);
        add.setBackground(ring);
        row2.addView(add);
        phone.addView(row2);

        // The dialog that opens: every site ticked, then "Add".
        LinearLayout dialog = box(blend(card, ink, 0.06f), dp(10), dp(12));
        LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        dlp.topMargin = dp(10);
        dlp.leftMargin = dp(28);
        dialog.setLayoutParams(dlp);
        List<String> sample = declaredHosts();
        for (int i = 0; i < Math.min(3, sample.size()); i++) {
            LinearLayout r = row();
            if (i == 0) r.addView(badge(3));
            else r.addView(spacer(dp(30)));
            r.addView(sys(body("☑  " + sample.get(i), 14, ink, 0, 0)));
            dialog.addView(r);
        }
        LinearLayout more = row();
        more.addView(spacer(dp(30)));
        more.addView(sys(body("☑  …", 14, muted, 0, 0)));
        dialog.addView(more);
        TextView addBtn = body(getString(R.string.sys_add), 14, ochre, 6, 0);
        addBtn.setTypeface(Typeface.DEFAULT_BOLD);
        addBtn.setGravity(Gravity.END);
        dialog.addView(addBtn);
        phone.addView(dialog);
        return phone;
    }

    /** The entries Android lists in its "Add link" dialog: our manifest's hosts, as the system reports them. */
    private List<String> declaredHosts() {
        List<String> out = new ArrayList<>();
        DomainVerificationUserState state = userState();
        if (state != null) out.addAll(new java.util.TreeSet<>(state.getHostToStateMap().keySet()));
        if (out.isEmpty()) for (String d : NewsSites.get(this).domains()) out.add("*." + d);
        return out;
    }

    // ── Step 2, Android 8 to 11 ───────────────────────────────────────
    private void linksOld(LinearLayout col) {
        col.addView(stepLabel(2));
        col.addView(title(getString(R.string.old_title)));
        col.addView(body(getString(R.string.old_lead), 15, muted, 8, 14));
        col.addView(numbered(1, getString(R.string.old_do_1)));
        col.addView(numbered(2, getString(R.string.old_do_2, getString(R.string.sys_always))));
        // A plain "view this link" with no app named: the system asks which app, unless one is already "Always".
        actionButton = button(getString(R.string.old_try), true,
            v -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(SAMPLE)).addCategory(Intent.CATEGORY_BROWSABLE)));
        col.addView(actionButton);
        status = body("", 15, muted, 16, 0);
        col.addView(status);
        String owner = oldOwner();
        if (owner != null) {
            col.addView(button(getString(R.string.old_clear, label(owner)), false, v ->
                startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + owner)))));
        }
        nextButton = button(getString(R.string.next), false, v -> show(3));
        col.addView(nextButton);
    }

    // ── Step 3 ────────────────────────────────────────────────────────
    private void tryIt(LinearLayout col) {
        col.addView(stepLabel(3));
        col.addView(title(getString(R.string.try_title)));
        col.addView(body(getString(R.string.try_lead), 15, muted, 8, 4));
        col.addView(button(getString(R.string.try_open), true, v -> openSample()));
        col.addView(body(getString(R.string.try_tip), 13, muted, 18, 0));
        col.addView(button(getString(R.string.done), false, v -> {
            prefs().edit().putBoolean(PREF_ONBOARDED, true).apply();
            show(0);
        }));
    }

    // ── Home (after the guide) ────────────────────────────────────────
    private void home(LinearLayout col) {
        TextView name = title(getString(R.string.app_name));
        name.setTypeface(geist(700));
        name.setLetterSpacing(-0.03f);
        col.addView(name);
        status = body("", 15, muted, 12, 0);
        col.addView(status);
        col.addView(button(getString(R.string.home_fix), false, v -> show(2)));
        col.addView(button(getString(R.string.home_try), false, v -> openSample()));
        TextView guide = body(getString(R.string.home_guide), 14, ochre, 18, 0);
        guide.setOnClickListener(v -> show(1));
        col.addView(guide);
        col.addView(body(getString(R.string.privacy), 13, muted, 28, 0));
        col.addView(body(getString(R.string.version, versionName()), 12, muted, 12, 0));
    }

    // ── Status ────────────────────────────────────────────────────────
    private void refreshStatus() {
        if (status == null) return;
        if (MODERN) refreshModern();
        else refreshOld();
    }

    private void refreshModern() {
        Set<String> domains = NewsSites.get(this).domains();
        int total = domains.size();
        DomainVerificationUserState state = userState();
        boolean allowed = state != null && state.isLinkHandlingAllowed();
        Map<String, Integer> hosts = state != null ? state.getHostToStateMap() : null;

        List<String> missing = new ArrayList<>();
        List<String> taken = new ArrayList<>();
        String takenBy = null;
        int active = 0;
        for (String d : domains) {
            if (hosts != null && (on(hosts.get(d)) || on(hosts.get("*." + d)))) {
                active++;
                continue;
            }
            String owner = otherOwner(d);
            if (owner != null) {
                taken.add(d);
                takenBy = owner;
            } else {
                missing.add(d);
            }
        }
        boolean done = allowed && missing.isEmpty() && active > 0;
        String text;
        if (!allowed && active > 0) text = getString(R.string.status_off, getString(R.string.sys_open_supported));
        else if (active == 0) text = getString(R.string.status_none);
        else if (missing.isEmpty()) text = "✓  " + getString(step == 0 ? R.string.status_active : R.string.status_all, active);
        else text = getString(R.string.status_some, active, total, missing.size() <= 4 ? join(missing) : getString(R.string.sites_count, missing.size()));
        if (!taken.isEmpty() && takenBy != null) text += "\n\n" + getString(R.string.status_taken, join(taken), label(takenBy));
        status.setText(text);
        status.setTextColor(done ? good : active == 0 || !allowed ? muted : warn);
        if (step == 0 && !done) status.setTextColor(warn);
        setNextPrimary(done);
    }

    private void refreshOld() {
        String owner = oldOwner();
        boolean ours = owner == null && resolvesToUs();
        if (ours) status.setText("✓  " + getString(R.string.old_status_ok));
        else if (owner != null) status.setText(getString(R.string.old_status_browser, label(owner), getString(R.string.sys_open_by_default), getString(R.string.sys_clear_defaults)));
        else status.setText("");
        status.setTextColor(ours ? good : warn);
        setNextPrimary(ours);
    }

    private void setNextPrimary(boolean primary) {
        if (actionButton != null) style(actionButton, !primary);
        if (nextButton == null) return;
        style(nextButton, primary);
        if (step == 2) nextButton.setText(getString(primary ? R.string.next : R.string.skip));
    }

    private DomainVerificationUserState userState() {
        if (!MODERN) return null;
        DomainVerificationManager dvm = getSystemService(DomainVerificationManager.class);
        if (dvm == null) return null;
        try {
            return dvm.getDomainVerificationUserState(getPackageName());
        } catch (Exception e) {
            return null;
        }
    }

    private static boolean on(Integer s) {
        return s != null && (s == DomainVerificationUserState.DOMAIN_STATE_SELECTED
            || s == DomainVerificationUserState.DOMAIN_STATE_VERIFIED);
    }

    /** Another app (not a browser, not us) that Android sends this site's links to, e.g. the outlet's own app. */
    private String otherOwner(String domain) {
        String pkg = resolver("https://" + domain + "/");
        if (pkg == null || pkg.equals(getPackageName()) || pkg.equals(Browsers.defaultBrowser(this))) return null;
        return isBrowser(pkg) ? null : pkg;
    }

    /** Android 8 to 11: the app already set to "Always" for news links, if it isn't us. */
    private String oldOwner() {
        String pkg = resolver(SAMPLE);
        return pkg == null || pkg.equals(getPackageName()) ? null : pkg;
    }

    private boolean resolvesToUs() {
        return getPackageName().equals(resolver(SAMPLE));
    }

    /** The package Android would open this link with right now; null when it would ask ("which app?"). */
    private String resolver(String url) {
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE);
        ResolveInfo r = getPackageManager().resolveActivity(view, PackageManager.MATCH_DEFAULT_ONLY);
        if (r == null || r.activityInfo == null || "android".equals(r.activityInfo.packageName)) return null;
        return r.activityInfo.packageName;
    }

    private boolean isBrowser(String pkg) {
        Intent probe = new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com/")).addCategory(Intent.CATEGORY_BROWSABLE);
        for (ResolveInfo i : getPackageManager().queryIntentActivities(probe, PackageManager.MATCH_ALL)) {
            if (pkg.equals(i.activityInfo.packageName)) return true;
        }
        return false;
    }

    private String label(String pkg) {
        try {
            ApplicationInfo ai = getPackageManager().getApplicationInfo(pkg, 0);
            return String.valueOf(getPackageManager().getApplicationLabel(ai));
        } catch (Exception e) {
            return pkg;
        }
    }

    // ── Actions ───────────────────────────────────────────────────────
    private void openLinkSettings() {
        Intent i = new Intent(Settings.ACTION_APP_OPEN_BY_DEFAULT_SETTINGS, Uri.parse("package:" + getPackageName()));
        try {
            startActivity(i);
        } catch (Exception e) {
            startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
        }
        // A reminder that stays on screen for a moment over the Settings page.
        Toast.makeText(this, getString(R.string.links_toast, getString(R.string.sys_add_link), getString(R.string.sys_add)), Toast.LENGTH_LONG).show();
    }

    private void openSample() {
        startActivity(new Intent(this, ReaderActivity.class).setData(Uri.parse(SAMPLE)));
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(Browsers.PREFS, MODE_PRIVATE);
    }

    private String versionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "?";
        }
    }

    private static String join(List<String> items) {
        StringBuilder b = new StringBuilder();
        for (String s : items) {
            if (b.length() > 0) b.append(", ");
            b.append(s);
        }
        return b.toString();
    }

    // ── View helpers ──────────────────────────────────────────────────
    private LinearLayout column() {
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(24), dp(36), dp(24), dp(32));
        return col;
    }

    private TextView stepLabel(int n) {
        TextView t = body(getString(R.string.step_of, n, STEPS).toUpperCase(), 12, ochre, 0, 8);
        t.setTypeface(geist(650));
        t.setLetterSpacing(0.06f);
        return t;
    }

    private TextView title(String s) {
        TextView t = body(s, 26, ink, 0, 0);
        t.setTypeface(geist(700));
        t.setLetterSpacing(-0.03f);
        t.setLineSpacing(0, 1.1f);
        return t;
    }

    private TextView body(String s, int sp, int color, int top, int bottom) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setLineSpacing(0, 1.3f);
        t.setTypeface(geist(400));
        t.setPadding(0, dp(top), 0, dp(bottom));
        return t;
    }

    private View bullet(String s) {
        LinearLayout r = row();
        r.setPadding(0, dp(6), 0, dp(6));
        TextView dot = body("•", 16, ochre, 0, 0);
        dot.setPadding(0, 0, dp(12), 0);
        r.addView(dot);
        r.addView(grow(body(s, 15, ink, 0, 0)));
        r.setGravity(Gravity.TOP);
        return r;
    }

    private View numbered(int n, String s) {
        LinearLayout r = row();
        r.setPadding(0, dp(6), 0, dp(6));
        r.addView(badge(n));
        r.addView(grow(body(s, 15, ink, 0, 0)));
        return r;
    }

    private TextView badge(int n) {
        TextView b = new TextView(this);
        b.setText(String.valueOf(n));
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        b.setTypeface(geist(700));
        b.setTextColor(onOchre);
        b.setGravity(Gravity.CENTER);
        GradientDrawable c = new GradientDrawable();
        c.setShape(GradientDrawable.OVAL);
        c.setColor(ochre);
        b.setBackground(c);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(22), dp(22));
        lp.rightMargin = dp(8);
        b.setLayoutParams(lp);
        return b;
    }

    private View fakeSwitch() {
        LinearLayout track = new LinearLayout(this);
        track.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
        track.setPadding(dp(3), dp(3), dp(3), dp(3));
        GradientDrawable t = new GradientDrawable();
        t.setCornerRadius(dp(12));
        t.setColor(ochre);
        track.setBackground(t);
        View knob = new View(this);
        GradientDrawable k = new GradientDrawable();
        k.setShape(GradientDrawable.OVAL);
        k.setColor(Color.WHITE);
        knob.setBackground(k);
        track.addView(knob, new LinearLayout.LayoutParams(dp(18), dp(18)));
        track.setLayoutParams(new LinearLayout.LayoutParams(dp(44), dp(24)));
        return track;
    }

    private LinearLayout box(int color, int radius, int pad) {
        LinearLayout b = new LinearLayout(this);
        b.setOrientation(LinearLayout.VERTICAL);
        b.setPadding(pad, pad, pad, pad);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(radius);
        bg.setColor(color);
        b.setBackground(bg);
        return b;
    }

    private LinearLayout row() {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        r.setGravity(Gravity.CENTER_VERTICAL);
        r.setPadding(0, dp(5), 0, dp(5));
        return r;
    }

    private View spacer(int width) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(width, 1));
        return v;
    }

    private <T extends View> T grow(T v) {
        v.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        return v;
    }

    private Button button(String label, boolean primary, View.OnClickListener onClick) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        b.setGravity(Gravity.CENTER);
        b.setStateListAnimator(null);
        b.setTypeface(geist(600));
        style(b, primary);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50));
        lp.topMargin = dp(14);
        b.setLayoutParams(lp);
        b.setOnClickListener(onClick);
        return b;
    }

    private void style(Button b, boolean primary) {
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(25));
        if (primary) {
            bg.setColor(ochre);
            b.setTextColor(onOchre);
        } else {
            bg.setColor(Color.TRANSPARENT);
            bg.setStroke(dp(1), ochre);
            b.setTextColor(ochre);
        }
        b.setBackground(bg);
    }

    private static int blend(int a, int b, float t) {
        return Color.rgb(
            Math.round(Color.red(a) + (Color.red(b) - Color.red(a)) * t),
            Math.round(Color.green(a) + (Color.green(b) - Color.green(a)) * t),
            Math.round(Color.blue(a) + (Color.blue(b) - Color.blue(a)) * t));
    }

    private Typeface geistBase;

    /** Geist (res/font/geist.ttf, variable 100 to 900, OFL), the Sapu Berita voice. */
    private Typeface geist(int weight) {
        if (geistBase == null) {
            try {
                geistBase = getResources().getFont(R.font.geist);
            } catch (Exception e) {
                geistBase = Typeface.DEFAULT;
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return Typeface.create(geistBase, weight, false);
        return Typeface.create(geistBase, weight >= 600 ? Typeface.BOLD : Typeface.NORMAL);
    }

    /** Text inside the drawing of Android's Settings screen: Android's own font, like the real thing. */
    private TextView sys(TextView t) {
        t.setTypeface(Typeface.DEFAULT);
        return t;
    }

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }
}
