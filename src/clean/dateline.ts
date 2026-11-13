/**
 * Detik (and others) write the dateline as loose text before the first paragraph:
 *
 *   <strong>Banjarmasin</strong> - <p>Kepolisian telah melimpahkan…</p>
 *
 * Shown as is, "Banjarmasin -" sits on a line of its own. Newspapers run it into the first sentence, so
 * move that short leading run (ending in a dash) into the start of the paragraph that follows it.
 */
const INLINE = /^(STRONG|B|SPAN|EM|I|A|FONT|SMALL)$/;
const MAX_DATELINE = 80;

export function joinDatelines(root: HTMLElement): void {
  for (const box of [root, ...root.querySelectorAll<HTMLElement>('div, section, article')]) joinIn(box);
}

function joinIn(box: HTMLElement): void {
  const run: ChildNode[] = [];
  let next: Element | null = null;
  for (const node of [...box.childNodes]) {
    if (node.nodeType === 8) continue; // comment
    if (node.nodeType === 3) {
      if (node.textContent?.trim() || run.length) run.push(node);
      continue;
    }
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    if (INLINE.test(el.tagName)) {
      run.push(el);
      continue;
    }
    next = el;
    break;
  }
  if (!run.length || next?.tagName !== 'P') return;
  const text = run.map((n) => n.textContent ?? '').join('').replace(/\s+/g, ' ').trim();
  if (!text || text.length > MAX_DATELINE || !/[-–—]$/.test(text)) return;

  const p = next;
  const first = p.firstChild;
  for (const node of run) p.insertBefore(node, first);
  // One space between "Banjarmasin -" and the sentence, however the source spaced it.
  const after = first?.textContent ?? '';
  const lastMoved = run[run.length - 1]!;
  if (lastMoved.nodeType === 3) lastMoved.textContent = lastMoved.textContent!.replace(/\s*$/, '');
  if (!/^\s/.test(after)) p.insertBefore(p.ownerDocument.createTextNode(' '), first);
}
