package id.sapu.berita;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.role.RoleManager;
import android.content.Intent;
import android.content.pm.ResolveInfo;
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

import java.util.List;

/**
 * One screen, three steps: make Sapu Berita the default browser, pick the browser for every other link,
 * try it on a real article. Built in code (no layouts) to keep the app tiny.
 */
public class SetupActivity extends Activity {
    private static final int REQUEST_ROLE = 1;
    private static final String SAMPLE = "https://nasional.kompas.com/read/2026/11/10/20432761/hidayat-nur-wahid-mundur-dari-wakil-ketua-mpr";
    private static final int OCHRE = Color.rgb(176, 122, 18);

    private TextView defaultStatus;
    private Button forwardButton;

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

        col.addView(step("1", getString(R.string.setup_default_title), ink));
        defaultStatus = text("", 14, muted, false);
        col.addView(defaultStatus);
        col.addView(button(getString(R.string.setup_default_button), true, v -> requestDefault()));

        col.addView(step("2", getString(R.string.setup_forward_title), ink));
        col.addView(text(getString(R.string.setup_forward_hint), 14, muted, false));
        forwardButton = button("", false, v -> pickForward());
        col.addView(forwardButton);

        col.addView(step("3", getString(R.string.setup_try_title), ink));
        col.addView(button(getString(R.string.setup_try_button), false,
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
        defaultStatus.setText(isDefault() ? R.string.setup_default_on : R.string.setup_default_off);
        String target = Browsers.target(this);
        forwardButton.setText(getString(R.string.setup_forward_button,
            target == null ? getString(R.string.setup_forward_none) : Browsers.label(this, target)));
    }

    private boolean isDefault() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            RoleManager rm = getSystemService(RoleManager.class);
            return rm != null && rm.isRoleHeld(RoleManager.ROLE_BROWSER);
        }
        ResolveInfo r = getPackageManager().resolveActivity(
            new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com/")), 0);
        return r != null && getPackageName().equals(r.activityInfo.packageName);
    }

    private void requestDefault() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            RoleManager rm = getSystemService(RoleManager.class);
            if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_BROWSER) && !rm.isRoleHeld(RoleManager.ROLE_BROWSER)) {
                startActivityForResult(rm.createRequestRoleIntent(RoleManager.ROLE_BROWSER), REQUEST_ROLE);
                return;
            }
        }
        startActivity(new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS));
    }

    private void pickForward() {
        List<ResolveInfo> browsers = Browsers.installed(this);
        if (browsers.isEmpty()) return;
        CharSequence[] names = new CharSequence[browsers.size()];
        for (int i = 0; i < names.length; i++) names[i] = browsers.get(i).loadLabel(getPackageManager());
        new AlertDialog.Builder(this)
            .setTitle(R.string.setup_forward_title)
            .setItems(names, (d, which) -> {
                Browsers.choose(this, browsers.get(which).activityInfo.packageName);
                refresh();
            })
            .show();
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
        lp.topMargin = dp(10);
        b.setLayoutParams(lp);
        b.setOnClickListener(onClick);
        return b;
    }

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }
}
