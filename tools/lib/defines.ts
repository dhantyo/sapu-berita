// Build-time constants every bundle needs (the release build and the preview server), defined once.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { transformSync } from 'esbuild';
import { ROOT } from './rules.ts';

export function sharedDefines(): Record<string, string> {
  const pswpCss = transformSync(readFileSync(join(ROOT, 'node_modules/photoswipe/dist/photoswipe.css'), 'utf8'), {
    loader: 'css',
    minify: true,
  }).code;
  return {
    // Geist, bundled so the reader's default face never waits on the network (render/fonts.ts).
    __GEIST__: JSON.stringify(readFileSync(join(ROOT, 'fonts/geist.woff2')).toString('base64')),
    __SAPU_VERSION__: JSON.stringify((JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }).version),
    // The photo viewer's stylesheet, injected into the reader's shadow root (render/gallery.ts).
    __PSWP_CSS__: JSON.stringify(pswpCss),
  };
}
