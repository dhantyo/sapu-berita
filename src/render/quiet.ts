/**
 * Keep the original page quiet while the clean view is open: video stories (video.tribunnews.com) and
 * many articles autoplay a player underneath, which would keep talking behind the reader.
 *
 * Pauses the page's <video>/<audio>, and YouTube players the page drives through YouTube's JS API
 * (enablejsapi=1) by the same message the page itself would send. Players started later by the page's
 * scripts are caught by a `play` listener and a few repeat passes. The reader's own players live in its
 * shadow root, which document queries and these listeners never reach.
 */
const YT = /^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//;
const REPEAT_MS = [400, 1200, 2500, 5000, 9000];

export function quietPage(doc: Document): () => void {
  const pauseAll = () => {
    for (const m of doc.querySelectorAll<HTMLMediaElement>('video, audio')) {
      try {
        if (!m.paused) m.pause();
      } catch {
        // detached or blocked: nothing to do
      }
    }
    for (const f of doc.querySelectorAll<HTMLIFrameElement>('iframe')) {
      const src = f.getAttribute('src') ?? '';
      if (!YT.test(src)) continue;
      try {
        if (/[?&]enablejsapi=1/.test(src)) {
          f.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
        } else if (/[?&]autoplay=1/.test(src)) {
          // Not scriptable: reload it without autoplay.
          f.setAttribute('src', src.replace(/([?&])autoplay=1/, '$1autoplay=0'));
        }
      } catch {
        // cross-origin quirks: leave it
      }
    }
  };
  const onPlay = (e: Event) => {
    const media = e.target;
    if (media instanceof HTMLMediaElement) media.pause();
  };
  doc.addEventListener('play', onPlay, true); // `play` doesn't bubble; capture sees every element's
  pauseAll();
  const timers = REPEAT_MS.map((ms) => setTimeout(pauseAll, ms));
  return () => {
    doc.removeEventListener('play', onPlay, true);
    timers.forEach(clearTimeout);
  };
}
