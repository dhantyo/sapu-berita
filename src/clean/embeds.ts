// Social posts quoted in an article are part of the story. Their live embeds load third-party scripts
// (blocked by most news sites' CSP inside our overlay anyway), so each one becomes a static card:
// platform, author, the post's text when the embed carries it, and a link out. YouTube gets its thumbnail.
//
//   <figure data-embed="instagram">
//     <figcaption><b>Instagram</b> · @hype.kompascom</figcaption>
//     <p>caption…</p>
//     <a href="…" data-embed-link="instagram">instagram.com/reel/…</a>   ← label localized by the overlay
//   </figure>

export type Platform = 'x' | 'instagram' | 'tiktok' | 'youtube' | 'facebook';

export const PLATFORM_NAMES: Record<Platform, string> = {
  x: 'X', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook',
};

interface Embed {
  platform: Platform;
  url: string;
  author?: string;
  text?: string;
  /** YouTube only. */
  videoId?: string;
  title?: string;
}

/** Boilerplate the embed snippets carry before their script runs. */
const BOILERPLATE = /view this (post|profile) on (instagram|facebook)|a post shared by|lihat (postingan|kiriman) ini|watch on youtube|^@\S+$|^\s*$/i;
const MAX_TEXT = 320;

/**
 * Put the story's own video (from the page data) at the top when the article text doesn't already carry it.
 * It goes in as the page's iframe would, so the usual embed handling turns it into a card and a player.
 */
export function prependMainVideo(root: HTMLElement, embedUrl: string): boolean {
  const id = /\/embed\/([\w-]{6,})/.exec(embedUrl)?.[1];
  if (!id || root.innerHTML.includes(id)) return false;
  const frame = root.ownerDocument.createElement('iframe');
  frame.setAttribute('src', embedUrl);
  root.prepend(frame);
  return true;
}

/** Replace every recognised embed in `root` with a static card. Returns how many were converted. */
export function convertEmbeds(root: HTMLElement): number {
  let n = 0;
  const doc = root.ownerDocument;
  for (const el of [...root.querySelectorAll('blockquote, iframe')]) {
    if (!root.contains(el)) continue;
    const embed = el.tagName === 'IFRAME' ? fromIframe(el) : fromBlockquote(el);
    if (!embed) continue;
    // Replace the embed's wrapper paragraph/figure when it holds nothing else, so no empty shell is left.
    const parent = el.parentElement;
    const target = parent && parent !== root && /^(P|FIGURE|DIV)$/.test(parent.tagName) && norm(parent.textContent) === norm(el.textContent)
      ? parent : el;
    target.replaceWith(card(doc, embed));
    n++;
  }
  return n;
}

function fromBlockquote(el: Element): Embed | undefined {
  const cls = el.getAttribute('class') ?? '';
  const links = [...el.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')!);

  if (/twitter-tweet/.test(cls)) {
    const url = links.reverse().find((h) => /(twitter|x)\.com\/[^/]+\/status\/\d+/.test(h));
    if (!url) return undefined;
    return {
      platform: 'x', url: clean(url),
      author: handle(el.textContent ?? '') ?? pathAuthor(url),
      text: textOf(el.querySelector('p')),
    };
  }
  if (/instagram-media/.test(cls)) {
    const url = el.getAttribute('data-instgrm-permalink') ?? links.find((h) => /instagram\.com\/(p|reel|tv)\//.test(h));
    if (!url) return undefined;
    const caption = [...el.querySelectorAll('p')].map((p) => norm(p.textContent)).find((t) => t && !BOILERPLATE.test(t));
    return { platform: 'instagram', url: clean(url), author: handle(el.textContent ?? ''), text: trim(caption) };
  }
  if (/tiktok-embed/.test(cls)) {
    const url = el.getAttribute('cite') ?? links.find((h) => /tiktok\.com\/@[^/]+\/video\//.test(h));
    if (!url) return undefined;
    const author = el.querySelector('a[href*="tiktok.com/@"]')?.textContent?.trim() || pathAuthor(url);
    return { platform: 'tiktok', url: clean(url), author, text: textOf(el.querySelector('p')) };
  }
  return undefined;
}

function fromIframe(el: Element): Embed | undefined {
  const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
  let u: URL;
  try {
    u = new URL(src, el.ownerDocument.baseURI);
  } catch {
    return undefined;
  }
  const host = u.hostname.replace(/^www\./, '');

  if (/(^|\.)youtube(-nocookie)?\.com$/.test(host) && u.pathname.startsWith('/embed/')) {
    const videoId = u.pathname.split('/')[2];
    if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return undefined;
    const title = el.getAttribute('title') ?? undefined;
    return {
      platform: 'youtube', url: `https://www.youtube.com/watch?v=${videoId}`, videoId,
      title: title && !/^youtube( video player)?$/i.test(title.trim()) ? title.trim() : undefined,
    };
  }
  if (host === 'facebook.com' && u.pathname.startsWith('/plugins/')) {
    const href = u.searchParams.get('href');
    if (!href) return undefined;
    return { platform: 'facebook', url: clean(href), author: pathAuthor(href) };
  }
  if (host === 'platform.twitter.com') {
    const id = u.searchParams.get('id');
    return id && /^\d+$/.test(id) ? { platform: 'x', url: `https://x.com/i/status/${id}` } : undefined;
  }
  if (host === 'instagram.com' && /^\/(p|reel|tv)\/[^/]+/.test(u.pathname)) {
    const path = u.pathname.replace(/\/embed\/?.*$/, '/');
    return { platform: 'instagram', url: `https://www.instagram.com${path}` };
  }
  return undefined;
}

function card(doc: Document, e: Embed): HTMLElement {
  const fig = doc.createElement('figure');
  fig.setAttribute('data-embed', e.platform);
  const caption = doc.createElement('figcaption');
  const name = doc.createElement('b');
  name.textContent = PLATFORM_NAMES[e.platform];
  caption.append(name);
  const detail = e.platform === 'youtube' ? e.title : e.author;
  if (detail) caption.append(` · ${detail}`);

  const link = doc.createElement('a');
  link.setAttribute('href', e.url);
  link.setAttribute('data-embed-link', e.platform);

  if (e.platform === 'youtube' && e.videoId) {
    const thumb = doc.createElement('img');
    thumb.setAttribute('src', `https://i.ytimg.com/vi/${e.videoId}/hqdefault.jpg`);
    thumb.setAttribute('alt', e.title ?? 'YouTube');
    link.append(thumb);
    fig.append(link, caption);
  } else {
    link.textContent = displayUrl(e.url);
    fig.append(caption);
    if (e.text) {
      const p = doc.createElement('p');
      p.textContent = e.text;
      fig.append(p);
    }
    fig.append(link);
  }
  return fig;
}

/** "@handle" from embed text like "— Name (@handle) Nov 10" or "A post shared by X (@handle)". */
function handle(text: string): string | undefined {
  const m = text.match(/\(@([\w.]{1,40})\)/) ?? text.match(/(?:^|\s)@([\w.]{2,40})\b/);
  return m ? `@${m[1]}` : undefined;
}

function pathAuthor(url: string): string | undefined {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean)[0];
    if (!seg || /^(i|p|reel|tv|status|watch|share|permalink\.php|story\.php)$/.test(seg)) return undefined;
    return seg.startsWith('@') ? seg : `@${seg}`;
  } catch {
    return undefined;
  }
}

/** Drop tracking parameters from a post URL. */
function clean(url: string): string {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref|igsh|igshid|s|t|si|fbclid)/.test(k)) u.searchParams.delete(k);
    return u.href;
  } catch {
    return url;
  }
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 28 ? `${u.pathname.slice(0, 27)}…` : u.pathname;
    return `${u.hostname.replace(/^www\./, '')}${path}`;
  } catch {
    return url;
  }
}

function textOf(el: Element | null): string | undefined {
  const t = norm(el?.textContent);
  return t && !BOILERPLATE.test(t) ? trim(t) : undefined;
}

function trim(t: string | undefined): string | undefined {
  if (!t) return undefined;
  return t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT - 1).trimEnd()}…` : t;
}

function norm(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}
