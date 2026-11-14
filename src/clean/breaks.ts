// Paragraphs written as one <p> with blank lines between them (Tribrata News, some CMS editors):
//   <p>First…<br><br>Second…<br><br>Third…</p>  →  <p>First…</p><p>Second…</p><p>Third…</p>
// Real paragraphs space correctly, junk rules match each line on its own, and the reader can mark
// a single paragraph with Tandai. A single <br> (a line break inside a paragraph) is kept.

const isBlank = (n: Node) => n.nodeType === 3 && !(n.textContent ?? '').trim();
const isBr = (n: Node | null): n is HTMLBRElement => !!n && n.nodeType === 1 && (n as Element).tagName === 'BR';

/** Returns how many paragraphs were split. */
export function splitBreaks(root: HTMLElement): number {
  const doc = root.ownerDocument;
  let n = 0;
  for (const p of [...root.querySelectorAll('p')]) {
    const nodes = [...p.childNodes];
    const groups: Node[][] = [[]];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      if (isBr(node)) {
        // A blank line: this <br>, optional whitespace, and another <br>.
        let j = i + 1;
        while (j < nodes.length && isBlank(nodes[j]!)) j++;
        if (isBr(nodes[j] ?? null)) {
          groups.push([]);
          i = j;
          continue;
        }
      }
      groups[groups.length - 1]!.push(node);
    }
    const parts = groups.filter((g) => g.some((x) => !isBlank(x) && !isBr(x)));
    if (parts.length < 2) continue;
    const paragraphs = parts.map((g) => {
      const q = doc.createElement('p');
      q.append(...g);
      return q;
    });
    p.replaceWith(...paragraphs);
    n++;
  }
  return n;
}
