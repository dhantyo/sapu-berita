package id.sapu.berita;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.verify.domain.DomainVerificationManager;
import android.content.pm.verify.domain.DomainVerificationUserState;
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

import java.util.Map;
import java.util.Set;

/**
 * One screen, two steps: let Sapu Berita open the news sites' links (Android's "Open by default"),
 * then try it on a real article. Your browser stays your browser; only news links change.
 * Built in code (no layouts) to keep the app tiny.
 */
public class SetupActivity extends Activity {
    private static final String SAMPLE = "https://nasional.kompas.com/read/2026/11/10/20432761/hidayat-nur-wahid-mundur-dari-wakil-ketua-mpr";
    private static final int OCHRE = Color.rgb(176, 122, 18);

    private TextView status;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        boolean night = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK)
            == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        int ink = night ? Color.rgb(232, 232, 230) : Color.rgb(18, 18, 18);
        int muted = night ? Color.rgb(168, 168, 165) : Color.rgb(92, 92, 92);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(24);
        col.setPadding(pad, dp(48), pad, pad);

        TextView title = text(getString(R.string.app_name), 30, ink, true);
        title.setTypeface(Typeface.SERIF, Typeface.BOLD);
        col.addView(title);
        TextView lead = text(getString(R.string.setup_lead), 16, muted, false);
        lead.setPadding(0, dp(8), 0, dp(24));
        col.addView(lead);

        col.addView(step("1", getString(R.string.setup_links_title), ink));
        status = text("", 14, muted, false);
        col.addView(status);
        boolean modern = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S;
        TextView how = text(getString(modern ? R.string.setup_links_how : R.string.setup_links_how_old), 14, muted, false);
        how.setPadding(0, dp(6), 0, 0);
        col.addView(how);
        if (modern) col.addView(button(getString(R.string.setup_links_button), true, v -> openLinkSettings()));

        col.addView(step("2", getString(R.string.setup_try_title), ink));
        col.addView(button(getString(R.string.setup_try_button), !modern,
            v -> startActivity(new Intent(this, ReaderActivity.class).setData(Uri.parse(SAMPLE)))));

        TextView privacy = text(getString(R.string.setup_privacy), 13, muted, false);
        privacy.setPadding(0, dp(28), 0, 0);
        col.addView(privacy);

        ScrollView scroll = new ScrollView(this);
        scroll.addView(col);
        scroll.setFitsSystemWindows(true);
        setContentView(scroll);
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    private void refresh() {
        Set<String> domains = NewsSites.get(this).domains();
        int total = domains.size();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            int active = activeDomains(domains);
            status.setText(active == 0 ? getString(R.string.setup_links_none, total)
                : getString(R.string.setup_links_some, active, total));
        } else {
            status.setText(getString(R.string.setup_links_old_status, total));
        }
    }

    /** Android 12+: how many of our news domains the user has approved for this app. */
    private int activeDomains(Set<String> domains) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return 0;
        DomainVerificationManager dvm = getSystemService(DomainVerificationManager.class);
        if (dvm == null) return 0;
        DomainVerificationUserState state;
        try {
            state = dvm.getDomainVerificationUserState(getPackageName());
        } catch (Exception e) {
            return 0;
        }
        if (state == null || !state.isLinkHandlingAllowed()) return 0;
        Map<String, Integer> hosts = state.getHostToStateMap();
        int active = 0;
        for (String d : domains) {
            if (on(hosts.get(d)) || on(hosts.get("*." + d))) active++;
        }
        return active;
    }

    private static boolean on(Integer s) {
        return s != null && (s == DomainVerificationUserState.DOMAIN_STATE_SELECTED
            || s == DomainVerificationUserState.DOMAIN_STATE_VERIFIED);
    }

    private void openLinkSettings() {
        Intent i = new Intent(Settings.ACTION_APP_OPEN_BY_DEFAULT_SETTINGS, Uri.parse("package:" + getPackageName()));
        try {
            startActivity(i);
        } catch (Exception e) {
            startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
        }
    }

    // ── tiny view helpers ──────────────────────────────────────────────
    private View step(String number, String label, int ink) {
        TextView t = text(number + "   " + label, 17, ink, true);
        t.setPadding(0, dp(20), 0, dp(4));
        return t;
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setLineSpacing(0, 1.25f);
        return t;
    }

    private Button button(String label, boolean primary, View.OnClickListener onClick) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        b.setGravity(Gravity.CENTER);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(24));
        if (primary) {
            bg.setColor(OCHRE);
            b.setTextColor(Color.WHITE);
        } else {
            bg.setColor(Color.TRANSPARENT);
            bg.setStroke(dp(1), OCHRE);
            b.setTextColor(OCHRE);
        }
        b.setBackground(bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48));
        lp.topMargin = dp(12);
        b.setLayoutParams(lp);
        b.setOnClickListener(onClick);
        return b;
    }

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }
}
