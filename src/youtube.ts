/**
 * YouTube addresses, in one place: the reader meets them as embed iframes (/embed/ID), post links
 * (watch?v=ID, youtu.be/ID, /shorts/ID, /live/ID) and thumbnails used as a page's main image
 * (img.youtube.com/vi/ID/…, i.ytimg.com/vi/ID/…).
 */
const HOSTS = /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be|ytimg\.com)$/;
const ID = /^[\w-]{6,}$/;

/** The video id in any YouTube address, or undefined for anything else. */
export function youtubeId(address: string | null | undefined): string | undefined {
  let u: URL;
  try {
    u = new URL(address ?? '');
  } catch {
    return undefined;
  }
  if (!HOSTS.test(u.hostname)) return undefined;
  const id =
    u.searchParams.get('v') ??
    (u.hostname.endsWith('youtu.be') ? u.pathname.split('/')[1] : /\/(?:embed|shorts|live|vi|vi_webp)\/([\w-]+)/.exec(u.pathname)?.[1]);
  return id && ID.test(id) ? id : undefined;
}

/** True for an embedded player's address (an iframe's src), as opposed to a link or a thumbnail. */
export const isYoutubeEmbed = (address: string | null | undefined): boolean =>
  !!youtubeId(address) && /^https?:\/\/[^/]*youtube(-nocookie)?\.com\/embed\//.test(address ?? '');

export const youtubeEmbedUrl = (id: string) => `https://www.youtube.com/embed/${id}`;
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
