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
