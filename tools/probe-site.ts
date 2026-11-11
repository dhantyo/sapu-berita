// Probe a news site to draft a rule: samples a few live articles (phone user agent) and reports
// where the article text lives, junk blocks inside it, pagination links and metadata.
//   npm run probe -- https://www.suara.com [https://www.tempo.co …]
// Prints JSON per site. It drafts; a human (or reviewed rule) decides.
import { documentFromHtml, fetchHtml } from './lib/dom.ts';

const JUNK = /^(baca juga|baca:|simak juga|lihat juga|artikel terkait|berita terkait|baca selengkapnya|tonton juga|advertisement|iklan|scroll to continue|dapatkan update|ikuti (kami|berita)|follow)/i;

function sel(e: Element): string {
  const cls = (e.getAttribute('class') ?? '').trim().split(/\s+/).filter((c) => c && !/^(row|col|clearfix|container|w-|p-|m-|mt-|mb-|px-|py-)/.test(c)).slice(0, 2);
  return e.tagName.toLowerCase() + (e.id ? `#${e.id}` : '') + (cls.length ? `.${cls.join('.')}` : '');
}

function articleLinks(html: string, home: URL): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"'#?]+)["']/g)) {
    let u: URL;
    try {
      u = new URL(m[1]!, home);
    } catch {
      continue;
    }
    const sameSite = u.hostname === home.hostname || u.hostname.endsWith('.' + home.hostname.replace(/^www\./, ''));
    const path = u.pathname;
    // Article-ish: a numeric id or a date, and a hyphenated slug.
    // Skip assets (images, CSS, icons): article paths have no file extension.
    if (sameSite && !/\.[a-z0-9]{2,5}$/i.test(path) && /\d{4,}|\/\d{4}\/\d{2}\/\d{2}\//.test(path) && /[a-z]+-[a-z]+-[a-z]+/.test(path) && !/\/(tag|topik|indeks|video|foto|photo|galeri|gallery|tv)\//i.test(path)) {
      out.add(u.origin + path);
    }
  }
  return [...out].slice(0, 30);
}

async function probe(homeUrl: string) {
  const home = new URL(homeUrl);
  const { html } = await fetchHtml(home.href);
  const links = articleLinks(html, home);
  const samples: unknown[] = [];
  const containerVotes = new Map<string, number>();

  for (const url of links.slice(0, 4)) {
    try {
      const { html: page, finalUrl } = await fetchHtml(url);
      const doc = documentFromHtml(page, finalUrl);
      // Densest paragraph container.
      const counts = new Map<Element, number>();
      for (const p of doc.querySelectorAll('p')) {
        const t = (p.textContent ?? '').trim().length;
        if (t > 40 && p.parentElement) counts.set(p.parentElement, (counts.get(p.parentElement) ?? 0) + t);
      }
      const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
      const best = ranked[0];
      if (best) containerVotes.set(sel(best[0]), (containerVotes.get(sel(best[0])) ?? 0) + 1);
      const container = best?.[0];
      const junk = container
        ? [...container.querySelectorAll('*')]
            .filter((e) => JUNK.test((e.textContent ?? '').trim()) && (e.textContent ?? '').trim().length < 300 && e.children.length < 8)
            .map((e) => `${sel(e)} :: ${(e.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 50)}`)
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 4)
        : [];
      const paging = [...doc.querySelectorAll('a[href]')]
        .filter((a) => /^\s*(\d{1,2}|selanjutnya|berikutnya|next|tampilkan semua|show all|lihat semua)\s*$/i.test(a.textContent ?? '') &&
          /page=|halaman|\/\d{1,2}\/?$|single=|all/i.test(a.getAttribute('href') ?? ''))
        .map((a) => `${(a.textContent ?? '').trim()} -> ${(a.getAttribute('href') ?? '').slice(-50)} [${a.parentElement ? sel(a.parentElement) : ''}]`)
        .slice(0, 4);
      const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')].some((s) => /NewsArticle|"Article"/.test(s.textContent ?? ''));
      samples.push({
        url: finalUrl,
        chars: best?.[1],
        container: best ? `${sel(best[0])} < ${best[0].parentElement ? sel(best[0].parentElement) : ''}` : null,
        second: ranked[1] ? `${sel(ranked[1][0])} (${ranked[1][1]})` : null,
        junk,
        paging,
        jsonLdArticle: ld,
      });
    } catch (err) {
      samples.push({ url, error: String(err) });
    }
  }
  return { site: home.hostname, articleLinksFound: links.length, containerVotes: Object.fromEntries(containerVotes), samples };
}

const sites = process.argv.slice(2);
for (const s of sites) {
  try {
    console.log(JSON.stringify(await probe(s), null, 1));
  } catch (err) {
    console.log(JSON.stringify({ site: s, error: String(err) }));
  }
}
