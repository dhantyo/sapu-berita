// Live check: open real article links in your installed Chrome, run the built reader on them exactly as the
// Apple bookmark does, and report what it extracted. Works on sites that block plain downloads (Bisnis, Tirto).
//
//   npm run build
//   npm run inspect -- <url> [<url> …] [--dark] [--desktop] [--shot <folder>] [--blocks]
//
// Prints per link: rendered or not, the logo it chose (and how it's drawn), the meta row, the summary box,
// leftover link lists, image count, and the first paragraph. --shot saves a phone screenshot per link;
// --blocks lists every block of the extracted article (what a reader would scroll through).
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { ROOT } from './lib/rules.ts';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const shotDir = args.includes('--shot') ? args[args.indexOf('--shot') + 1] : undefined;
const urls = args.filter((a, i) => /^https?:\/\//.test(a) && args[i - 1] !== '--shot');
if (!urls.length) {
  console.error('usage: npm run inspect -- <url> [<url> …] [--dark] [--desktop] [--shot <folder>]');
  process.exit(1);
}

const corePath = join(ROOT, 'dist', 'shortcut.js');
if (!existsSync(corePath)) {
  console.error('dist/shortcut.js is missing: run `npm run build` first.');
  process.exit(1);
}
const core = readFileSync(corePath, 'utf8');
if (shotDir) mkdirSync(shotDir, { recursive: true });

const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
// Your installed Chrome; set CHROME_PATH to use another Chromium browser (Brave, Edge).
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });

let n = 0;
for (const url of urls) {
  const context = await browser.newContext(
    flag('--desktop')
      ? { viewport: { width: 1280, height: 900 }, colorScheme: flag('--dark') ? 'dark' : 'light' }
      : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PHONE_UA, colorScheme: flag('--dark') ? 'dark' : 'light' },
  );
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2500); // let the page's own scripts settle, like a reader would
    const report = await page.evaluate(async (code) => {
      (0, eval)(code);
      for (let i = 0; i < 80 && !document.querySelector('.sapuberita-overlay'); i++) await new Promise((r) => setTimeout(r, 100));
      await new Promise((r) => setTimeout(r, 2500)); // logo analysis, extra pages
      const root = document.querySelector('.sapuberita-overlay')?.shadowRoot;
      if (!root) return { rendered: false };
      const text = (sel: string) => root.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim();
      const logo = root.querySelector('.logo') as HTMLElement | null;
      const logoImg = logo?.querySelector('img');
      const src = logoImg?.getAttribute('src') ?? '';
      return {
        rendered: true,
        title: text('h1'),
        meta: [...root.querySelectorAll('.meta > span')].map((s) => s.textContent?.trim()).join(' · '),
        logo: src.startsWith('data:') ? '(inline SVG from the page)' : src.replace(/[?&]sapu=1$/, ''),
        logoDrawn: logo ? `${logo.dataset.state}${logo.dataset.onDark ? `, on dark: ${logo.dataset.onDark}` : ''}` : text('.outlet-name') ? 'name only' : 'none',
        summary: text('.content blockquote > b'),
        summaryPoints: root.querySelectorAll('.content blockquote li').length,
        linkLists: [...root.querySelectorAll('.content ul')].filter((u) => u.querySelectorAll('a').length >= 2).length,
        images: root.querySelectorAll('.content img').length,
        players: [...root.querySelectorAll<HTMLIFrameElement>('.content iframe.player')].map((f) => new URL(f.src).hostname).join(', '),
        cards: root.querySelectorAll('.content figure[data-embed]').length,
        firstParagraph: text('.content p')?.slice(0, 120),
        blocks: [...(root.querySelector('.content')?.children ?? [])].map(
          (b) => `${b.tagName.toLowerCase()}${b.querySelector('img') ? '+img' : ''}${b.querySelector('a') ? '+link' : ''}: ${(b.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100)}`,
        ),
      };
    }, core);
    console.log(`\n${url}`);
    const { blocks, ...summary } = report as typeof report & { blocks?: string[] };
    for (const [k, v] of Object.entries(summary)) if (v !== undefined && v !== '') console.log(`  ${k.padEnd(15)} ${v}`);
    if (flag('--blocks') && blocks) blocks.forEach((b, i) => console.log(`  ${String(i + 1).padStart(3)}. ${b}`));
    if (shotDir) {
      const file = join(shotDir, `inspect-${++n}${flag('--dark') ? '-dark' : ''}.png`);
      await page.screenshot({ path: file });
      console.log(`  ${'screenshot'.padEnd(15)} ${file}`);
    }
  } catch (err) {
    console.log(`\n${url}\n  error           ${String(err).split('\n')[0]}`);
  }
  await context.close();
}
await browser.close();
