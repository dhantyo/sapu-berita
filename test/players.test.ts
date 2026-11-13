import { describe, expect, it } from 'vitest';
import { heightFromMessage, playerFor } from '../src/render/players.ts';

describe('playerFor', () => {
  it('maps YouTube links of every shape to the no-cookie player', () => {
    for (const href of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://m.youtube.com/live/dQw4w9WgXcQ?feature=share',
    ]) {
      expect(playerFor('youtube', href, false)).toEqual({ src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', aspect: '16 / 9' });
    }
    expect(playerFor('youtube', 'https://www.youtube.com/@kompastv', false)).toBeUndefined();
  });

  it('maps Instagram posts and reels', () => {
    expect(playerFor('instagram', 'https://www.instagram.com/reel/C1a2B3c4D5e/?igsh=x', false)?.src).toBe(
      'https://www.instagram.com/reel/C1a2B3c4D5e/embed/captioned/',
    );
    expect(playerFor('instagram', 'https://www.instagram.com/kompascom/', false)).toBeUndefined();
  });

  it('maps TikTok videos, X posts (theme follows the reader) and Facebook', () => {
    expect(playerFor('tiktok', 'https://www.tiktok.com/@user/video/7312345678901234567', false)?.src).toBe('https://www.tiktok.com/embed/v2/7312345678901234567');
    expect(playerFor('x', 'https://x.com/user/status/1856000000000000000', true)?.src).toBe(
      'https://platform.twitter.com/embed/Tweet.html?id=1856000000000000000&dnt=true&theme=dark',
    );
    expect(playerFor('facebook', 'https://www.facebook.com/user/videos/123', false)?.src).toMatch(/^https:\/\/www\.facebook\.com\/plugins\/video\.php\?href=/);
    expect(playerFor('facebook', 'https://www.facebook.com/user/posts/123', false)?.src).toMatch(/plugins\/post\.php/);
  });

  it('refuses links that are not URLs', () => {
    expect(playerFor('youtube', 'not a url', false)).toBeUndefined();
  });
});

describe('heightFromMessage', () => {
  it('reads Instagram, X and TikTok resize messages', () => {
    expect(heightFromMessage(JSON.stringify({ type: 'MEASURE', details: { height: 712.4 } }))).toBe(713);
    expect(heightFromMessage({ 'twttr.embed': { method: 'twttr.private.resize', params: [{ height: 388 }] } })).toBe(388);
    expect(heightFromMessage({ signalSource: 'tiktok', height: 760 })).toBe(760);
  });

  it('ignores anything else', () => {
    expect(heightFromMessage('hello')).toBeUndefined();
    expect(heightFromMessage({ type: 'MEASURE', details: { height: 10 } })).toBeUndefined();
    expect(heightFromMessage(null)).toBeUndefined();
  });
});
