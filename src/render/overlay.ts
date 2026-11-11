import type { Article } from '../types.ts';
import { SIZE_STEPS, type Font, type Lang, type Settings, type Theme } from '../settings.ts';
import { strings, type Strings } from './i18n.ts';
import { analyzeLoadedLogo, corsLogoUrl, opticalHeight, recolourNeeds } from './logo.ts';
import { PLATFORM_NAMES, type Platform } from '../clean/embeds.ts';
import { OVERLAY_CSS } from './styles.ts';

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
}

export interface OverlayOptions {
  settings: Settings;
  /** Called after every settings change, to persist it. */
  onSettingsChange?: (settings: Settings) => void;
  loadingMore?: boolean;
  /** Start with only the floating button visible (settings.autoOpen off). */
  startHidden?: boolean;
  /** Link target for "read on the original site". */
  originalUrl?: string;
}

/** Draw the article over the page inside a Shadow DOM. The original page stays underneath, untouched. */
export function renderOverlay(doc: Document, initial: Article, opts: OverlayOptions): OverlayHandle {
  doc.querySelector(`.${HOST_CLASS}`)?.remove();

  let article = initial;
  let settings = { ...opts.settings };
  let loading = opts.loadingMore ?? false;
  let panelOpen = false;

  const host = doc.createElement('div');
  host.className = HOST_CLASS;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = h(doc, 'style');
  style.textContent = OVERLAY_CSS;

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
    root.style.setProperty('--fs', `${SIZES[settings.size]}px`);
    root.setAttribute('lang', settings.lang);
    root.setAttribute('aria-label', article.meta.title);

    const progress = h(doc, 'div', { class: 'progress', 'aria-hidden': 'true' });
    root.replaceChildren(
      masthead(t, progress),
      articleView(t),
      settingsPanel(t),
    );
    reopen.replaceChildren(broom(18), doc.createTextNode(t.reopen));
    root.scrollTop = top;
    progressBar = progress;
    updateProgress();
  };

  const masthead = (t: Strings, progress: HTMLElement) => {
    const name = article.meta.siteName ?? doc.location?.hostname ?? '';
    const outlet = h(doc, 'a', { class: 'outlet', href: opts.originalUrl ?? '', title: t.readOriginal, 'aria-label': `${name}: ${t.readOriginal}` });
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
    // One download for display and analysis: CORS mode. If the server refuses CORS, reload plainly as a plate.
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

    img.addEventListener('error', plate, { once: true });
    img.addEventListener('load', () => {
      const a = analyzeLoadedLogo(img);
      if (!a) return plate();
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
    }, { once: true });
    img.src = corsLogoUrl(src);
    return mark;
  };

  const articleView = (t: Strings) => {
    const m = article.meta;
    const head = h(doc, 'header');
    head.append(h(doc, 'h1', {}, m.title));
    const deck = deckText(m.description, article.content);
    if (deck) head.append(h(doc, 'p', { class: 'deck' }, deck));

    const meta = h(doc, 'p', { class: 'meta' });
    if (m.section) meta.append(h(doc, 'span', { class: 'section' }, m.section));
    if (m.byline) meta.append(h(doc, 'span', {}, `${t.by} ${m.byline}`));
    const date = formatDate(m.published, t);
    if (date) meta.append(h(doc, 'span', { class: 'date' }, date));
    if (meta.childNodes.length) head.append(meta);

    if (settings.hero && m.image && !startsWithImage(article.content)) {
      head.append(h(doc, 'figure', { class: 'hero' }, h(doc, 'img', { src: m.image, alt: '' })));
    }

    article.content.classList.add('content');
    localizeEmbeds(article.content, t);
    const parts: Node[] = [head, article.content];
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
      ['serif', t.fontSerif], ['sans', t.fontSans], ['legible', t.fontLegible],
    ], (v) => change({ font: v }, `[data-value="${v}"]`), (btn, v) => (btn.style.fontFamily = faces[v]))));

    // Theme: swatch of each ground
    const grounds: Record<Theme, string> = {
      auto: 'linear-gradient(135deg, rgb(255 255 255) 50%, rgb(18 18 18) 50%)',
      light: 'rgb(255 255 255)', sepia: 'rgb(247 241 228)', dark: 'rgb(18 18 18)',
    };
    panel.append(group(t.theme, segmented<Theme>(t.theme, settings.theme, [
      ['auto', t.themeAuto], ['light', t.themeLight], ['sepia', t.themeSepia], ['dark', t.themeDark],
    ], (v) => change({ theme: v }, `[data-value="${v}"]`), (btn, v) => {
      const sw = h(doc, 'span', { class: 'swatch', 'aria-hidden': 'true' });
      sw.style.background = grounds[v];
      btn.prepend(sw);
    })));

    // Language
    panel.append(group(t.language, segmented<Lang>(t.language, settings.lang, [
      ['id', 'Indonesia'], ['en', 'English'],
    ], (v) => change({ lang: v }, `[data-value="${v}"]`))));

    // Toggles
    const toggles = h(doc, 'div', { class: 'group' });
    toggles.append(
      switchRow(t.hero, undefined, settings.hero, (v) => change({ hero: v }, '[data-switch="hero"]'), 'hero'),
      switchRow(t.autoOpen, t.autoOpenHint, settings.autoOpen, (v) => change({ autoOpen: v }, '[data-switch="autoOpen"]'), 'autoOpen'),
      switchRow(t.sweepLine, undefined, settings.sweepLine, (v) => change({ sweepLine: v }, '[data-switch="sweepLine"]'), 'sweepLine'),
    );
    panel.append(toggles);
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

  function switchRow(label: string, hint: string | undefined, on: boolean, onToggle: (v: boolean) => void, key: string) {
    const text = h(doc, 'span', { class: 'text' }, label);
    if (hint) text.append(h(doc, 'span', { class: 'hint' }, hint));
    const sw = h(doc, 'button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(on), 'aria-label': label, 'data-switch': key });
    sw.addEventListener('click', () => onToggle(!on));
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
  const show = () => {
    root.style.display = '';
    reopen.style.display = 'none';
    doc.documentElement.style.overflow = 'hidden';
  };
  const hide = () => {
    if (panelOpen) setPanel(false);
    root.style.display = 'none';
    reopen.style.display = '';
    doc.documentElement.style.overflow = prevOverflow;
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
    destroy: () => {
      hide();
      host.remove();
    },
  };
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
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const d = norm(description).slice(0, 60);
  const opening = norm((content.textContent ?? '').slice(0, 600));
  return opening.includes(d) ? undefined : description;
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

function formatDate(iso: string | undefined, t: Strings): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
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
function icon(size: number, paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    width: String(size), height: String(size), viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  })) svg.setAttribute(k, v);
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}
/** The Sapu mark: a sapu lidi, handle up-right, bristles fanning down-left. Shared with Sapu Buzzer. */
const broom = (size: number) =>
  icon(size, ['M20 4 13 11', 'M11.2 9.2l3.6 3.6', 'M11.2 9.2C8 10 5.4 12.6 4 19c6.4-1.4 9-4 9.8-7.2', 'M6.8 16.4 9.6 13.6', 'M9 17.6l2.2-2.2']);
const cross = () => icon(18, ['M6 6l12 12', 'M18 6 6 18']);
const arrow = () => icon(14, ['M8 16 16 8', 'M9 8h7v7']);
