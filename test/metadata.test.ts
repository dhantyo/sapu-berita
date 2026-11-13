import { describe, expect, it } from 'vitest';
import { decodeEntities, extractMetadata } from '../src/extract/metadata.ts';

describe('metadata text', () => {
  it('decodes escaped and double-escaped entities', () => {
    expect(decodeEntities('&#039;Sindiran&#039; halus')).toBe("'Sindiran' halus");
    expect(decodeEntities('Q&amp;#039;s &quot;x&quot; &hellip;')).toBe('Q\'s "x" …');
    expect(decodeEntities('A &unknown; B &#0; C')).toBe('A &unknown; B &#0; C');
  });

  it('decodes JSON-LD description (Detik)', () => {
    document.head.innerHTML =
      '<script type="application/ld+json">{"@type":"NewsArticle","headline":"Judul","description":"&#039;Sindiran&#039; halus Nagita"}</script>';
    const m = extractMetadata(document);
    expect(m.description).toBe("'Sindiran' halus Nagita");
    document.head.innerHTML = '';
  });
});

describe('metadata from real outlet quirks', () => {
  const ld = (o: object) => `<script type="application/ld+json">${JSON.stringify({ '@type': 'NewsArticle', ...o })}</script>`;
  const meta = (html: string) => {
    document.head.innerHTML = html;
    const m = extractMetadata(document);
    document.head.innerHTML = '';
    return m;
  };

  it('keeps italics from a title but never shows the tags (Tirto)', () => {
    const m = meta(ld({ headline: 'Beban Pengganti Gibran dan Label Wapres &lt;i&gt;Giveaway&lt;/i&gt;' }));
    expect(m.title).toBe('Beban Pengganti Gibran dan Label Wapres Giveaway');
    expect(m.titleMarkup).toBe('Beban Pengganti Gibran dan Label Wapres <i>Giveaway</i>');
  });

  it('reads the editor (Tribun)', () => {
    const m = meta(ld({ headline: 'X', author: [{ name: 'Almurfi Syofyan' }], editor: { '@type': 'Person', name: 'Yoseph Hary W' } }));
    expect(m.byline).toBe('Almurfi Syofyan');
    expect(m.editor).toBe('Yoseph Hary W');
  });

  it('falls back to the modified time when no publish date exists (Tirto)', () => {
    const m = meta(ld({ headline: 'X' }) + '<meta property="article:modified_time" content="2026-11-11 08:00:01">');
    expect(m.published).toBe('2026-11-11 08:00:01');
  });
});
