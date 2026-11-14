import { describe, expect, it } from 'vitest';
import { isYoutubeEmbed, youtubeId } from '../src/youtube.ts';

describe('youtubeId', () => {
  it('reads every address form the reader meets', () => {
    for (const a of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?si=x',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      'https://i.ytimg.com/vi_webp/dQw4w9WgXcQ/hqdefault.webp',
    ]) expect(youtubeId(a), a).toBe('dQw4w9WgXcQ');
  });

  it('ignores channels, other sites and junk', () => {
    expect(youtubeId('https://www.youtube.com/@tribunvideo')).toBeUndefined();
    expect(youtubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeUndefined();
    expect(youtubeId('not a url')).toBeUndefined();
  });

  it('tells an embedded player from a link or a thumbnail', () => {
    expect(isYoutubeEmbed('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    expect(isYoutubeEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(isYoutubeEmbed('https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg')).toBe(false);
  });
});
