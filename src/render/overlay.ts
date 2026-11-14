import type { Article } from '../types.ts';
import { SIZE_STEPS, type Font, type Lang, type Settings, type Switch, type Theme } from '../settings.ts';
import { strings, type Strings } from './i18n.ts';
import { analyzeLoadedLogo, corsLogoUrl, opticalHeight, recolourNeeds } from './logo.ts';
import { PLATFORM_NAMES, type Platform } from '../clean/embeds.ts';
import { OVERLAY_CSS } from './styles.ts';
import { attachGallery, GALLERY_CSS } from './gallery.ts';
import type { UpdateOffer } from '../update.ts';
import { heightFromMessage, playerFor } from './players.ts';
import { quietPage } from './quiet.ts';
import { textKey } from '../dom.ts';

declare const __SAPU_VERSION__: string | undefined;
const VERSION = typeof __SAPU_VERSION__ === 'string' ? __SAPU_VERSION__ : 'dev';

const HOST_CLASS = 'sapuberita-overlay';
/** Body text size per settings step (px). Phones get 1.5px less via CSS. */
const SIZES = [16, 17.5, 19, 21, 23.5];

export interface OverlayHandle {
  /** Swap in a newer version of the article (e.g. after extra pages were merged). Keeps the scroll position. */
  update(article: Article, loadingMore?: boolean): void;
  /** Stop showing the "loading more pages" note without changing the article. */
  doneLoading(): void;
  show(): void;
  hide(): void;
  destroy(): void;
  /** Show the "new version available" bar (once per article view; the reader can dismiss it). */
  offerUpdate(offer: UpdateOffer): void;
}

export interface OverlayOptions {
  settings: Settings;
  /** Called after every settings change, to persist it. */
  onSettingsChange?: (settings: Settings) => void;
  loadingMore?: boolean;
  /** Start with only the floating button visible (settings.autoOpen off). */
  startHidden?: boolean;
  /**
   * Offer the "open automatically" switch. Off for the bookmark and the Shortcut: running them is the
   * request to open, so the setting would do nothing there.
   */
  autoOpenSetting?: boolean;
  /**
   * Offer the "check for updates" switch. Off for the bookmark and the Shortcut: they download the newest
   * version, site fixes included, every time they run.
   */
  updatesSetting?: boolean;
  /** Link target for "read on the original site". */
  originalUrl?: string;
  /** Builds the "report a problem" link for the current article; no link when unset. */
  reportUrl?: (article: Article) => string | undefined;
  /** The reader chose "not now" on the update bar. */
  onSnoozeUpdate?: (version: string) => void;
  /** Load the faces this font setting needs (see render/fonts.ts). Called on every render; must be cheap. */
  loadFonts?: (font: Font) => void;
}

/** Draw the article over the page inside a Shadow DOM. The original page stays underneath, untouched. */
export function renderOverlay(doc: Document, initial: Article, opts: OverlayOptions): OverlayHandle {
  doc.querySelector(`.${HOST_CLASS}`)?.remove();

  let article = initial;
  let settings = { ...opts.settings };
  let loading = opts.loadingMore ?? false;
  let panelOpen = false;
  let updateOffer: UpdateOffer | null = null;

  const host = doc.createElement('div');
  host.className = HOST_CLASS;
  // Top layer (Popover API): above everything the page does, whatever its z-index, including
  // full-screen interstitial ads that load after us. Older engines fall back to z-index.
  const topLayer = typeof (host as HTMLElement & { showPopover?: unknown }).showPopover === 'function';
  // Reading: a full-viewport, transparent popover carrier in the top layer (UA popover box neutralised).
  const READING_HOST = 'inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:visible;color:inherit';
  // Original page showing: a zero-size fixed carrier that only holds the floating reopen button.
  const IDLE_HOST = 'position:fixed;top:0;left:0;width:0;height:0;margin:0;padding:0;border:0;overflow:visible;z-index:2147483647';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = h(doc, 'style');
  style.textContent = GALLERY_CSS + OVERLAY_CSS;

  const root = h(doc, 'div', { class: 'root', role: 'dialog', 'aria-modal': 'true' });
  const reopen = h(doc, 'button', { type: 'button', class: 'reopen' });
  shadow.append(style, root, reopen);
  doc.documentElement.append(host);

  // ── Rendering ───────────────────────────────────────────────────────────
  // The chrome is rebuilt on every settings change (language, toggles); the article body
  // element itself is reused, so the reader's scroll position and images survive.
  const render = () => {
    const t = strings(settings.lang);
    const top = root.scrollTop;
    root.dataset.theme = settings.theme;
    root.dataset.font = settings.font;
    root.dataset.links = settings.links ? 'on' : 'off';
    root.dataset.summaries = settings.summaries ? 'on' : 'off';
    root.dataset.embeds = settings.embeds ? 'on' : 'off';
    opts.loadFonts?.(settings.font);
    root.style.setProperty('--fs', `${SIZES[settings.size]}px`);
    root.setAttribute('lang', settings.lang);
    root.setAttribute('aria-label', article.meta.title);

    const progress = h(doc, 'div', { class: 'progress', 'aria-hidden': 'true' });
    root.replaceChildren(
      masthead(t, progress),
      articleView(t),
      settingsPanel(t),
    );
    reopen.replaceChildren(broom(16), doc.createTextNode(t.reopen));
    reopen.title = t.reopenLong;
    reopen.setAttribute('aria-label', t.reopenLong);
    root.scrollTop = top;
    progressBar = progress;
    updateProgress();
  };

  const masthead = (t: Strings, progress: HTMLElement) => {
    const name = article.meta.siteName ?? doc.location?.hostname ?? '';
    const home = homepageOf(opts.originalUrl);
    const outlet = h(doc, 'a', { class: 'outlet', href: home ?? '', title: t.home(name), 'aria-label': t.home(name) });
    if (article.meta.logo) {
      outlet.append(logoMark(article.meta.logo, name, outlet));
    } else {
      outlet.append(h(doc, 'span', { class: 'outlet-name' }, name));
    }

    const aa = h(doc, 'button', {
      type: 'button', class: 'btn aa', 'aria-label': t.settings, 'aria-haspopup': 'dialog',
      'aria-expanded': String(panelOpen), 'aria-controls': 'sb-panel',
    }, h(doc, 'span', { class: 'big' }, 'A'), h(doc, 'span', { class: 'small' }, 'a'));
    aa.addEventListener('click', (e) => {
      e.stopPropagation();
      setPanel(!panelOpen);
    });

    const original = h(doc, 'button', { type: 'button', class: 'btn', title: t.originalLong }, t.original);
    original.addEventListener('click', hide);

    return h(doc, 'header', { class: 'bar' }, outlet, h(doc, 'div', { class: 'tools' }, aa, original), progress);
  };

  /**
   * The outlet logo, made to sit in our masthead:
   * - analysed (pixels) → trimmed of padding, sized optically, recoloured per theme only if its own colour wouldn't show;
   * - not analysable (server forbids pixel reads) → shown whole on a plate: the site's own dark header colour, or white in dark themes.
   * Hidden until settled so it never jumps.
   */
  const logoMark = (src: string, name: string, outlet: HTMLElement) => {
    // One download for display and analysis: CORS mode. If the server refuses CORS, try the outlet's other
    // official logo (it may live on a server that allows it: Merdeka); failing that, reload plainly as a plate.
    const img = doc.createElement('img');
    img.alt = name;
    img.crossOrigin = 'anonymous';
    const mark = h(doc, 'span', { class: 'logo', 'data-state': 'pending' }, img);
    const showName = () => outlet.append(h(doc, 'span', { class: 'outlet-name' }, name));

    const plate = () => {
      if (mark.dataset.state !== 'pending') return;
      mark.dataset.state = 'plate';
      mark.dataset.plate = article.meta.logoGround ? 'dark' : 'light';
      if (article.meta.logoGround) mark.style.setProperty('--logo-ground', article.meta.logoGround);
      const shown = doc.createElement('img');
      shown.alt = name;
      shown.addEventListener('error', () => outlet.replaceChildren(h(doc, 'span', { class: 'outlet-name' }, name)), { once: true });
      shown.addEventListener('load', () => {
        if (shown.naturalWidth / Math.max(1, shown.naturalHeight) < 1.6) {
          outlet.classList.add('square');
          shown.alt = '';
          showName();
        }
      }, { once: true });
      shown.src = src;
      img.replaceWith(shown);
    };

    const others = [...(article.meta.logoFallbacks ?? [])];
    const fail = () => {
      const other = mark.dataset.state === 'pending' ? others.shift() : undefined;
      if (other) {
        img.src = corsLogoUrl(other);
        return;
      }
      plate();
    };
    img.addEventListener('error', fail);
    img.addEventListener('load', () => {
      if (mark.dataset.state !== 'pending') return;
      const a = analyzeLoadedLogo(img);
      if (!a) return fail();
      const aspect = a.box.w / a.box.h;
      const square = aspect < 1.6;
      const height = square ? 30 : opticalHeight(aspect);
      const scale = height / a.box.h;
      // Crop to the drawn pixels: a window the size of the box, the full image shifted inside it.
      mark.style.width = `${a.box.w * scale}px`;
      mark.style.height = `${height}px`;
      img.style.width = `${a.naturalWidth * scale}px`;
      img.style.height = `${a.naturalHeight * scale}px`;
      img.style.left = `${-a.box.x * scale}px`;
      img.style.top = `${-a.box.y * scale}px`;
      const needs = recolourNeeds(a);
      mark.dataset.onLight = needs.onLight ? 'ink' : 'own';
      mark.dataset.onDark = needs.onDark ? 'white' : 'own';
      mark.dataset.badge = String(a.badge);
      mark.dataset.state = 'fitted';
      if (square) {
        outlet.classList.add('square');
        img.alt = '';
        showName();
      }
    });
    img.src = corsLogoUrl(src);
    return mark;
  };

  const articleView = (t: Strings) => {
    const m = article.meta;
    const head = h(doc, 'header');
    head.append(h(doc, 'h1', {}, ...titleNodes(doc, m.titleMarkup ?? m.title)));
    const deck = deckText(m.description, article.content);
    if (deck) head.append(h(doc, 'p', { class: 'deck' }, deck));

    const meta = h(doc, 'p', { class: 'meta' });
    if (m.section) meta.append(h(doc, 'span', { class: 'section' }, m.section));
    if (m.byline) {
      // Each reporter's name is unbreakable on its own; the row may wrap between names, never inside one.
      const by = h(doc, 'span', { class: 'byline' }, `${t.by} `);
      m.byline.split(/\s*,\s*/).forEach((name, i) => {
        if (i) by.append(', ');
        by.append(h(doc, 'span', { class: 'name' }, name));
      });
      meta.append(by);
    }
    if (m.editor && m.editor !== m.byline) meta.append(h(doc, 'span', { class: 'name' }, `${t.editor} ${m.editor}`));
    const date = formatDate(m.published, t);
    if (date) meta.append(h(doc, 'span', { class: 'date' }, date));
    if (meta.childNodes.length) head.append(meta);

    if (settings.hero && m.image && !startsWithImage(article.content)) {
      head.append(h(doc, 'figure', { class: 'hero' }, h(doc, 'img', { src: m.image, alt: '' })));
    }

    article.content.classList.add('content');
    localizeEmbeds(article.content, t);
    if (settings.embeds) livenEmbeds(article.content, isDark());
    const parts: Node[] = [head, article.content];
    if (updateOffer) parts.unshift(updateBar(t, updateOffer));
    if (loading) parts.push(h(doc, 'p', { class: 'status', role: 'status' }, h(doc, 'span', { class: 'spinner', 'aria-hidden': 'true' }), t.loadingMore));

    if (settings.sweepLine) {
      const bits: Node[] = [];
      if (article.swept > 0) bits.push(h(doc, 'span', { class: 'mark' }, broom(15), t.swept(article.swept)));
      if (article.pages > 1) bits.push(h(doc, 'span', {}, t.merged(article.pages)));
      if (opts.originalUrl) {
        bits.push(h(doc, 'a', { href: opts.originalUrl }, t.readOriginal, arrow()));
      }
      if (bits.length) parts.push(h(doc, 'footer', { class: 'sweep' }, ...bits));
      else parts.push(h(doc, 'div', { class: 'end' }));
    } else {
      parts.push(h(doc, 'div', { class: 'end' }));
    }
    return h(doc, 'main', { class: 'column' }, ...parts);
  };

  const isDark = () =>
    settings.theme === 'dark' || (settings.theme === 'auto' && !!doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches);

  // Embedded players ask for their height by message; grow the matching frame to fit the post.
  // Most messages on a news page come from ad frames: find the sending player before reading anything.
  doc.defaultView?.addEventListener('message', (e) => {
    if (!e.source) return;
    const frame = [...root.querySelectorAll<HTMLIFrameElement>('iframe.player')].find((f) => f.contentWindow === e.source);
    if (!frame || frame.style.aspectRatio) return;
    const height = heightFromMessage(e.data);
    if (height) frame.style.height = `${height}px`;
  });
  // A site whose security policy forbids frames from the platform: drop that player, the card shows again.
  doc.addEventListener('securitypolicyviolation', (e) => {
    if (!/frame-src|child-src|default-src/.test(e.effectiveDirective)) return;
    for (const frame of root.querySelectorAll<HTMLIFrameElement>('iframe.player')) {
      if (e.blockedURI && frame.src.startsWith(e.blockedURI)) frame.remove();
    }
  });

  const updateBar = (t: Strings, offer: UpdateOffer) => {
    const later = h(doc, 'button', { type: 'button', class: 'later' }, t.dismiss);
    later.addEventListener('click', () => {
      updateOffer = null;
      root.querySelector('.update')?.remove();
      opts.onSnoozeUpdate?.(offer.version);
    });
    return h(doc, 'aside', { class: 'update', role: 'status' },
      h(doc, 'span', { class: 'text' }, t.updateAvailable(offer.version)),
      h(doc, 'span', { class: 'actions' },
        h(doc, 'a', { class: 'btn', href: offer.url, target: '_blank', rel: 'noopener' }, t.updateAction),
        later));
  };

  const settingsPanel = (t: Strings) => {
    const panel = h(doc, 'section', { class: 'panel', id: 'sb-panel', role: 'dialog', 'aria-label': t.settings, 'data-open': String(panelOpen) });
    panel.addEventListener('click', (e) => e.stopPropagation());
    const close = h(doc, 'button', { type: 'button', class: 'icon-btn', 'aria-label': t.close }, cross());
    close.addEventListener('click', () => setPanel(false));
    panel.append(h(doc, 'div', { class: 'panel-head' }, h(doc, 'h2', {}, t.settings), close));

    // Text size
    const smaller = h(doc, 'button', { type: 'button', class: 'icon-btn', 'aria-label': t.smaller }, 'A−') as HTMLButtonElement;
    const larger = h(doc, 'button', { type: 'button', class: 'icon-btn', 'aria-label': t.larger }, 'A+') as HTMLButtonElement;
    smaller.style.fontSize = '13px';
    larger.style.fontSize = '18px';
    smaller.disabled = settings.size === 0;
    larger.disabled = settings.size === SIZE_STEPS - 1;
    smaller.addEventListener('click', () => change({ size: settings.size - 1 }, '.size .icon-btn:first-child'));
    larger.addEventListener('click', () => change({ size: settings.size + 1 }, '.size .icon-btn:last-child'));
    const dots = h(doc, 'div', { class: 'dots', role: 'img', 'aria-label': `${t.textSize} ${settings.size + 1}/${SIZE_STEPS}` });
    for (let i = 0; i < SIZE_STEPS; i++) dots.append(h(doc, 'i', { 'data-on': String(i === settings.size) }));
    panel.append(group(t.textSize, h(doc, 'div', { class: 'size' }, smaller, dots, larger)));

    // Font: each option previews itself in its own face
    const faces: Record<Font, string> = { serif: 'var(--serif)', sans: 'var(--sans)', legible: 'var(--legible)' };
    panel.append(group(t.font, segmented<Font>(t.font, settings.font, [
      ['sans', t.fontSans], ['serif', t.fontSerif], ['legible', t.fontLegible],
    ], (v) => change({ font: v }, `[data-value="${v}"]`), (btn, v) => (btn.style.fontFamily = faces[v]))));

    // Theme: swatch of each ground
    const grounds: Record<Exclude<Theme, 'auto'>, string> = {
      light: 'rgb(255 255 255)', sepia: 'rgb(247 241 228)', dark: 'rgb(18 18 18)',
    };
    panel.append(group(t.theme, segmented<Theme>(t.theme, settings.theme, [
      ['auto', t.themeAuto], ['light', t.themeLight], ['sepia', t.themeSepia], ['dark', t.themeDark],
    ], (v) => change({ theme: v }, `[data-value="${v}"]`), (btn, v) => {
      const sw = h(doc, 'span', { class: 'swatch', 'aria-hidden': 'true' });
      if (v === 'auto') {
        sw.classList.add('split');
        sw.append(splitSwatch());
      } else sw.style.background = grounds[v];
      btn.prepend(sw);
    })));

    // Language
    panel.append(group(t.language, segmented<Lang>(t.language, settings.lang, [
      ['id', 'Indonesia'], ['en', 'English'],
    ], (v) => change({ lang: v }, `[data-value="${v}"]`))));

    // Switches. How Sapu Berita behaves first; then what shows in the article, in the order it appears
    // on the page (photo under the headline, summary box, links and media in the text, the end note).
    const rows = (...keys: Switch[]) => h(doc, 'div', {}, ...keys.map(toggle));
    // "General" only lists what this build can change (the bookmark has neither switch).
    const general = () => {
      const keys: Switch[] = [];
      if (opts.autoOpenSetting !== false) keys.push('autoOpen');
      if (opts.updatesSetting !== false) keys.push('updates');
      return keys.length ? [group(t.general, rows(...keys))] : [];
    };
    panel.append(
      ...general(),
      group(t.inArticle, rows('hero', 'summaries', 'links', 'embeds', 'sweepLine')),
    );
    const report = opts.reportUrl?.(article);
    if (report) {
      panel.append(h(doc, 'div', { class: 'group report' },
        h(doc, 'span', { class: 'text' }, t.report),
        h(doc, 'a', { class: 'btn', href: report, target: '_blank', rel: 'noopener' }, t.reportAction)));
    }
    // Version, so bug reports say which build they came from.
    panel.append(h(doc, 'p', { class: 'version' }, `Sapu Berita ${VERSION}`));
    return panel;
  };

  const group = (label: string, control: Node) =>
    h(doc, 'div', { class: 'group' }, h(doc, 'span', { class: 'label' }, label), control);

  function segmented<V extends string>(
    label: string, current: V, options: Array<[V, string]>, onPick: (v: V) => void,
    decorate?: (btn: HTMLElement, v: V) => void,
  ) {
    const seg = h(doc, 'div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
    for (const [value, text] of options) {
      const btn = h(doc, 'button', { type: 'button', role: 'radio', 'aria-checked': String(value === current), 'data-value': value }, text);
      decorate?.(btn, value);
      btn.addEventListener('click', () => onPick(value));
      seg.append(btn);
    }
    return seg;
  }

  /** One on/off row; its label and hint come from the strings named after the switch. */
  function toggle(key: Switch) {
    const t = strings(settings.lang);
    const label = t[key];
    const text = h(doc, 'span', { class: 'text' }, label, h(doc, 'span', { class: 'hint' }, t[`${key}Hint`]));
    const on = settings[key];
    const sw = h(doc, 'button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(on), 'aria-label': label, 'data-switch': key });
    sw.addEventListener('click', () => change({ [key]: !on }, `[data-switch="${key}"]`));
    return h(doc, 'div', { class: 'switch-row' }, text, sw);
  }

  // ── State changes ───────────────────────────────────────────────────────
  /** Apply a settings change, re-render, keep keyboard focus on the control that was used. */
  const change = (patch: Partial<Settings>, refocus?: string) => {
    settings = { ...settings, ...patch };
    render();
    if (refocus) (root.querySelector(`.panel ${refocus}`) as HTMLElement | null)?.focus();
    opts.onSettingsChange?.(settings);
  };

  const setPanel = (open: boolean) => {
    panelOpen = open;
    const panel = root.querySelector('.panel') as HTMLElement | null;
    panel?.setAttribute('data-open', String(open));
    const aa = root.querySelector('.aa');
    aa?.setAttribute('aria-expanded', String(open));
    if (open) (panel?.querySelector('button[aria-checked="true"], .icon-btn') as HTMLElement | null)?.focus();
    else (aa as HTMLElement | null)?.focus();
  };

  root.addEventListener('click', () => panelOpen && setPanel(false));
  attachGallery(root, () => strings(settings.lang));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) {
      e.stopPropagation();
      setPanel(false);
    }
  });

  // Reading progress: a hairline of lidi ochre under the masthead.
  let progressBar: HTMLElement | null = null;
  let frame = 0;
  const updateProgress = () => {
    frame = 0;
    const max = root.scrollHeight - root.clientHeight;
    progressBar?.style.setProperty('transform', `scaleX(${max > 0 ? Math.min(1, root.scrollTop / max) : 0})`);
  };
  root.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(updateProgress);
  }, { passive: true });

  // ── Visibility ──────────────────────────────────────────────────────────
  const prevOverflow = doc.documentElement.style.overflow;
  const popover = host as HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
  let unquiet: (() => void) | undefined;
  const show = () => {
    unquiet ??= quietPage(doc);
    root.style.display = '';
    reopen.style.display = 'none';
    doc.documentElement.style.overflow = 'hidden';
    if (topLayer && !host.matches(':popover-open')) {
      host.setAttribute('popover', 'manual');
      host.style.cssText = READING_HOST;
      // Re-append first so we're also last in DOM order (ties go to the later element).
      doc.documentElement.append(host);
      popover.showPopover?.();
    }
  };
  const hide = () => {
    unquiet?.();
    unquiet = undefined;
    if (panelOpen) setPanel(false);
    root.style.display = 'none';
    reopen.style.display = '';
    doc.documentElement.style.overflow = prevOverflow;
    // Out of the top layer, so the full-viewport carrier never blocks the original page. A closed
    // popover is display:none, which would hide the reopen button, so drop the attribute too.
    if (topLayer) {
      if (host.matches(':popover-open')) popover.hidePopover?.();
      host.removeAttribute('popover');
      host.style.cssText = IDLE_HOST;
    }
  };
  reopen.addEventListener('click', show);

  render();
  if (opts.startHidden) hide();
  else show();

  return {
    update: (a, loadingMore = false) => {
      article = a;
      loading = loadingMore;
      render();
    },
    doneLoading: () => {
      loading = false;
      root.querySelector('.status')?.remove();
    },
    show,
    hide,
    offerUpdate: (offer) => {
      updateOffer = offer;
      render();
    },
    destroy: () => {
      hide();
      host.remove();
    },
  };
}

/**
 * Turn each social-post card into the platform's own player, once (the article body is reused across renders,
 * so a player keeps playing when settings change). The card stays underneath: switching embeds off shows it again.
 */
function livenEmbeds(content: Element, dark: boolean): void {
  const doc = content.ownerDocument;
  for (const fig of content.querySelectorAll<HTMLElement>('figure[data-embed]')) {
    if (fig.querySelector('iframe.player')) continue;
    const href = fig.querySelector('a[data-embed-link]')?.getAttribute('href');
    const player = href && playerFor(fig.dataset.embed as Platform, href, dark);
    if (!player) continue;
    const frame = doc.createElement('iframe');
    frame.className = 'player';
    frame.src = player.src;
    frame.title = PLATFORM_NAMES[fig.dataset.embed as Platform] ?? 'Media';
    frame.loading = 'lazy';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin'; // YouTube refuses to play without a referrer
    if (player.aspect) frame.style.aspectRatio = player.aspect;
    else frame.style.height = `${player.height ?? 500}px`;
    fig.prepend(frame);
  }
}

/** The outlet's homepage: the root of the site the article is on (regional sites stay regional). */
function homepageOf(articleUrl: string | undefined): string | undefined {
  if (!articleUrl) return undefined;
  try {
    return new URL('/', articleUrl).href;
  } catch {
    return undefined;
  }
}

/** Social-post cards (clean/embeds.ts): link labels in the reader's language, a play mark on video thumbnails. */
function localizeEmbeds(content: Element, t: Strings): void {
  for (const a of content.querySelectorAll<HTMLAnchorElement>('a[data-embed-link]')) {
    const platform = PLATFORM_NAMES[a.dataset.embedLink as Platform] ?? a.dataset.embedLink ?? '';
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    if (a.querySelector('img')) {
      a.setAttribute('aria-label', t.playOn(platform));
      if (!a.querySelector('.play')) {
        const play = icon(44, ['M9 7.5v9l7.5-4.5z']);
        play.classList.add('play');
        a.append(play);
      }
    } else {
      a.replaceChildren(t.openOn(platform), arrow());
    }
  }
}

/** The description as a deck, unless it just repeats the first lines of the article (common on Indonesian sites). */
export function deckText(description: string | undefined, content: Element): string | undefined {
  if (!description || description.length < 40) return undefined;
  // The opening paragraphs, not a video card or photo caption that may come first. (A description that is
  // junk, like an app ad, is dropped earlier by the site rules; see run() in index.ts.)
  const paragraphs = [...content.querySelectorAll('p')].filter((p) => !p.closest('figure, blockquote'));
  const opening = textKey(paragraphs.map((p) => p.textContent ?? '').join(' ').slice(0, 600) || (content.textContent ?? '').slice(0, 600));
  return opening.includes(textKey(description).slice(0, 60)) ? undefined : description;
}

/**
 * True if the body opens with its own photo (so the og:image hero would be a duplicate).
 * An image buried later in the article doesn't count: the hero is still the main photo.
 */
export function startsWithImage(content: Element, textBudget = 200): boolean {
  const walker = content.ownerDocument.createTreeWalker(content, 0x1 | 0x4); // elements + text
  let text = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === 3) text += (node.textContent ?? '').trim().length;
    else if ((node as Element).tagName === 'IMG') return true;
    if (text > textBudget) return false;
  }
  return false;
}

/** A title as text nodes, with `<i>…</i>` (from titleMarkup) as real italics. Never parsed as HTML. */
export function titleNodes(doc: Document, title: string): Array<Node | string> {
  return title.split(/(<i>[\s\S]*?<\/i>)/i).filter(Boolean).map((part) => {
    const m = /^<i>([\s\S]*?)<\/i>$/i.exec(part);
    return m ? h(doc, 'i', {}, m[1]!) : part.replace(/<\/?i>/gi, '');
  });
}

/**
 * Outlets write dates as ISO with an offset, or as "2026/11/13 14:59:46" / "2026-11-11 08:00:01" with
 * no zone at all, which is Jakarta time. Read those as WIB, not as the reader's own time zone.
 */
export function parseNewsDate(value: string): Date {
  const local = /^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (local) {
    const [, y, mo, d, hh, mm, ss = '00'] = local;
    return new Date(`${y}-${mo}-${d}T${hh}:${mm}:${ss}+07:00`);
  }
  return new Date(value);
}

function formatDate(iso: string | undefined, t: Strings): string | undefined {
  if (!iso) return undefined;
  const d = parseNewsDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const s = d.toLocaleString(t.dateLocale, {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  });
  return `${s} ${t.timeZoneLabel}`;
}

// ── Tiny DOM + icon helpers (authored SVG, one 1.6 stroke) ────────────────
function h(doc: Document, tag: string, attrs: Record<string, string> = {}, ...children: Array<Node | string>): HTMLElement {
  const node = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.append(c);
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * The "automatic" theme swatch: light top-left, dark bottom-right, split at 45°. Drawn as two halves that
 * meet on the diagonal (not one colour painted over the other, whose edge would leave a dark fringe on the
 * light side), with the same 1px ring as the other swatches on top of both.
 */
function splitSwatch(): SVGSVGElement {
  // Circle of radius 8.5 around (9, 9); the diagonal runs from bottom-left (2.99, 15.01) to top-right (15.01, 2.99).
  return svgEl('svg', { width: '18', height: '18', viewBox: '0 0 18 18', 'aria-hidden': 'true' },
    svgEl('path', { d: 'M2.99 15.01A8.5 8.5 0 0 1 15.01 2.99Z', fill: 'rgb(255 255 255)' }),
    svgEl('path', { d: 'M15.01 2.99A8.5 8.5 0 0 1 2.99 15.01Z', fill: 'rgb(18 18 18)' }),
    svgEl('circle', { cx: '9', cy: '9', r: '8.5', fill: 'none', class: 'ring' }));
}
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>, ...children: SVGElement[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

function icon(size: number, paths: string[]): SVGSVGElement {
  return svgEl('svg', {
    width: String(size), height: String(size), viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  }, ...paths.map((d) => svgEl('path', { d })));
}
/** The Sapu mark: a sapu lidi, handle up-right, bristles fanning down-left. Shared with Sapu Buzzer. */
const broom = (size: number) =>
  icon(size, ['M20 4 13 11', 'M11.2 9.2l3.6 3.6', 'M11.2 9.2C8 10 5.4 12.6 4 19c6.4-1.4 9-4 9.8-7.2', 'M6.8 16.4 9.6 13.6', 'M9 17.6l2.2-2.2']);
const cross = () => icon(18, ['M6 6l12 12', 'M18 6 6 18']);
const arrow = () => icon(14, ['M8 16 16 8', 'M9 8h7v7']);
