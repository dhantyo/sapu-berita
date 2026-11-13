/**
 * Embedded players for the social posts a story quotes (cards built by clean/embeds.ts).
 * Each platform's own official embed address, from the post's normal link. The original page loads
 * these same embeds, so playing them here reveals nothing new to the platforms.
 */
import type { Platform } from '../clean/embeds.ts';

export interface Player {
  src: string;
  /** Fixed shape (YouTube) or a starting height in px that the embed later corrects by message. */
  aspect?: string;
  height?: number;
}

export function playerFor(platform: Platform, href: string, dark: boolean): Player | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  const path = url.pathname;
  switch (platform) {
    case 'youtube': {
      const id =
        url.searchParams.get('v') ??
        (url.hostname.endsWith('youtu.be') ? path.slice(1).split('/')[0] : /\/(?:shorts|embed|live)\/([\w-]{6,})/.exec(path)?.[1]);
      return id && /^[\w-]{6,}$/.test(id) ? { src: `https://www.youtube-nocookie.com/embed/${id}`, aspect: '16 / 9' } : undefined;
    }
    case 'instagram': {
      const m = /\/(p|reel|tv)\/([\w-]+)/.exec(path);
      return m ? { src: `https://www.instagram.com/${m[1]}/${m[2]}/embed/captioned/`, height: 640 } : undefined;
    }
    case 'tiktok': {
      const id = /\/video\/(\d+)/.exec(path)?.[1];
      return id ? { src: `https://www.tiktok.com/embed/v2/${id}`, height: 740 } : undefined;
    }
    case 'x': {
      const id = /\/status(?:es)?\/(\d+)/.exec(path)?.[1];
      return id ? { src: `https://platform.twitter.com/embed/Tweet.html?id=${id}&dnt=true&theme=${dark ? 'dark' : 'light'}`, height: 420 } : undefined;
    }
    case 'facebook': {
      const video = /\/(videos|watch|reel)\b/.test(path) || url.searchParams.has('v');
      const plugin = video ? 'video' : 'post';
      return { src: `https://www.facebook.com/plugins/${plugin}.php?href=${encodeURIComponent(href)}&show_text=true&width=500`, height: video ? 320 : 560 };
    }
  }
  return undefined;
}

/**
 * Embeds tell their parent page how tall they want to be: Instagram as {type: "MEASURE", details: {height}},
 * X as {"twttr.embed": {method: "twttr.private.resize", params: [{height}]}}, TikTok as {height} or
 * {signalSource, height}. Returns the height, or undefined for any other message.
 */
export function heightFromMessage(data: unknown): number | undefined {
  let d = data;
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d);
    } catch {
      return undefined;
    }
  }
  if (!d || typeof d !== 'object') return undefined;
  const o = d as Record<string, any>;
  const h = o.type === 'MEASURE' ? o.details?.height : o['twttr.embed']?.method === 'twttr.private.resize' ? o['twttr.embed'].params?.[0]?.height : o.height;
  const n = Number(h);
  return Number.isFinite(n) && n > 50 && n < 5000 ? Math.ceil(n) : undefined;
}
