import DOMPurify from 'dompurify';
import {
  type PostDocument,
  type PostNode,
  type Mark,
  textDocument,
  validateDocument,
} from '../domain/document';

export function normalizePlainText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
}

const blockTags = /^(P|DIV|H[1-6]|PRE|BLOCKQUOTE|UL|OL|LI|TABLE|SECTION|ARTICLE|HEADER|FOOTER)$/;
const blockSelector = 'p,div,h1,h2,h3,h4,h5,h6,pre,blockquote,ul,ol,li,table';
// Sources state formatting either with tags or, like Google Docs, with inline styles.
// Styles are only read here and never rendered, because the result is rebuilt as JSON.
function markState(element: Element, marks: Mark[]): Mark[] {
  let bold = marks.some((m) => m.type === 'bold');
  let italic = marks.some((m) => m.type === 'italic');
  if (['B', 'STRONG'].includes(element.tagName)) bold = true;
  if (['I', 'EM'].includes(element.tagName)) italic = true;
  const style = element instanceof HTMLElement ? element.style : null;
  const weight = style?.fontWeight;
  if (weight) bold = weight === 'bold' || weight === 'bolder' || Number(weight) >= 600;
  if (style?.fontStyle) italic = style.fontStyle === 'italic' || style.fontStyle === 'oblique';
  return [
    ...(bold ? [{ type: 'bold' } as Mark] : []),
    ...(italic ? [{ type: 'italic' } as Mark] : []),
  ];
}
const isPre = (element: Element) =>
  element.tagName === 'PRE' ||
  (element instanceof HTMLElement && element.style.whiteSpace === 'pre');
// Preformatted text such as code from VS Code keeps its lines and indentation.
function preText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof Element)) return '';
  if (node.tagName === 'BR') return '\n';
  const text = [...node.childNodes].map(preText).join('');
  return blockTags.test(node.tagName) && !text.endsWith('\n') ? `${text}\n` : text;
}
const wordListStyle = (element: Element) =>
  /mso-list:\s*l\d/i.test(element.getAttribute('style') ?? '');
const sameMarks = (a?: Mark[], b?: Mark[]) =>
  (a ?? []).map((m) => m.type).join() === (b ?? []).map((m) => m.type).join();
// Source HTML is indented for readability, so its whitespace collapses as a browser renders it.
function tidyParagraph(nodes: PostNode[]): PostNode | null {
  const result: PostNode[] = [];
  for (const node of nodes) {
    const previous = result[result.length - 1];
    if (node.type === 'hardBreak') {
      if (previous?.type === 'text') previous.text = previous.text!.replace(/ +$/, '');
      result.push(node);
      continue;
    }
    let text = node.text!;
    if (!previous || previous.type === 'hardBreak' || previous.text!.endsWith(' '))
      text = text.replace(/^ +/, '');
    if (!text) continue;
    if (previous?.type === 'text' && sameMarks(previous.marks, node.marks)) previous.text += text;
    else result.push({ ...node, text });
  }
  const last = result[result.length - 1];
  if (last?.type === 'text') last.text = last.text!.replace(/ +$/, '');
  const content = result
    .filter((n) => n.type !== 'text' || n.text)
    .map((n) => (n.type === 'text' ? { ...n, text: n.text!.replace(/\u00a0/g, ' ') } : n));
  while (content[0]?.type === 'hardBreak') content.shift();
  while (content[content.length - 1]?.type === 'hardBreak') content.pop();
  // A paragraph of only spaces, such as Word's <p>&nbsp;</p>, is a spacer, not content.
  if (!content.some((n) => n.type === 'text' && n.text!.trim())) return null;
  return { type: 'paragraph', content };
}

export function normalizeHtml(html: string): PostDocument {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'div',
      'br',
      'b',
      'strong',
      'i',
      'em',
      'ul',
      'ol',
      'li',
      'table',
      'tr',
      'td',
      'th',
      'thead',
      'tbody',
      'a',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'pre',
      'code',
      'blockquote',
    ],
    ALLOWED_ATTR: ['style'],
    RETURN_DOM_FRAGMENT: true,
  });
  function inline(node: Node, marks: Mark[]): PostNode[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').replace(/[ \t\n\r\f]+/g, ' ');
      return text ? [{ type: 'text', text, ...(marks.length ? { marks } : {}) }] : [];
    }
    if (!(node instanceof Element)) return [];
    if (node.tagName === 'BR') return [{ type: 'hardBreak' }];
    // Word marks list bullets with a hidden-from-print span; the list itself carries them.
    if (/mso-list:\s*ignore/i.test(node.getAttribute('style') ?? '')) return [];
    const next = markState(node, marks);
    return [...node.childNodes].flatMap((n) => inline(n, next));
  }
  function listItem(element: Element, marks: Mark[]) {
    const content = blocks(element, marks);
    if (content[0]?.type !== 'paragraph') content.unshift({ type: 'paragraph' });
    return { type: 'listItem' as const, content };
  }
  function blocks(container: ParentNode, marks: Mark[]): PostNode[] {
    const result: PostNode[] = [];
    let pending: PostNode[] = [];
    let wordList = null as PostNode | null;
    const flush = () => {
      const paragraph = tidyParagraph(pending);
      if (paragraph) result.push(paragraph);
      pending = [];
    };
    for (const node of container.childNodes) {
      if (!(node instanceof Element)) {
        const text = inline(node, marks);
        if (text.some((n) => n.text?.trim())) wordList = null;
        pending.push(...text);
        continue;
      }
      const elementMarks = markState(node, marks);
      if (wordListStyle(node)) {
        flush();
        const marker = node.querySelector('[style*="mso-list"]')?.textContent?.trim() ?? '';
        const type = /^[\da-z]{1,4}[.)]$/i.test(marker) ? 'orderedList' : 'bulletList';
        const item = listItem(node, elementMarks);
        if (wordList?.type === type) wordList.content!.push(item);
        else {
          wordList = { type, content: [item] };
          result.push(wordList);
        }
        continue;
      }
      wordList = null;
      if (['UL', 'OL'].includes(node.tagName)) {
        flush();
        const items = [...node.children]
          .filter((n) => n.tagName === 'LI')
          .map((li) => listItem(li, elementMarks));
        if (items.length)
          result.push({
            type: node.tagName === 'UL' ? 'bulletList' : 'orderedList',
            content: items,
          });
      } else if (node.tagName === 'TABLE') {
        flush();
        for (const row of node.querySelectorAll('tr')) {
          const cells = [...row.children].map((c) =>
            (c.textContent ?? '').replace(/\s+/g, ' ').trim(),
          );
          const paragraph = tidyParagraph(textDocument(cells.join(' | ')).content[0]!.content!);
          if (paragraph) result.push(paragraph);
        }
      } else if (isPre(node)) {
        flush();
        const text = preText(node)
          .replace(/\n+$/, '')
          .replace(/\u00a0/g, ' ');
        result.push(...textDocument(text).content.filter((p) => p.content?.length));
      } else if (blockTags.test(node.tagName) || node.querySelector(blockSelector)) {
        // Inline wrappers around blocks, like Google Docs' outer <b>, keep the blocks apart.
        flush();
        result.push(...blocks(node, elementMarks));
      } else pending.push(...inline(node, marks));
    }
    flush();
    return result;
  }
  const content = blocks(clean, []);
  const document: PostDocument = {
    type: 'doc',
    content: content.length ? content : [{ type: 'paragraph' }],
  };
  if (!validateDocument(document))
    throw new Error('The pasted content could not be converted. Paste as plain text instead.');
  return document;
}
const hasText = (node: PostNode): boolean =>
  Boolean(node.text?.trim()) || (node.content ?? []).some(hasText);
export function parseSupportedClipboardContent(data: Pick<DataTransfer, 'getData'>): PostDocument {
  const html = data.getData('text/html');
  const plain = normalizePlainText(data.getData('text/plain'));
  if (html) {
    const document = normalizeHtml(html);
    // HTML that carries no text, such as a copied image, must not hide the plain text.
    if (hasText(document) || !plain.trim()) return document;
  }
  return textDocument(plain);
}
