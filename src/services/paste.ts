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
      'pre',
      'code',
      'blockquote',
    ],
    ALLOWED_ATTR: [],
    RETURN_DOM_FRAGMENT: true,
  });
  function inline(node: Node, marks: Mark[] = []): PostNode[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizePlainText(node.textContent ?? '');
      return text ? [{ type: 'text', text, ...(marks.length ? { marks } : {}) }] : [];
    }
    if (!(node instanceof Element)) return [];
    if (node.tagName === 'BR') return [{ type: 'hardBreak' }];
    const kind = ['B', 'STRONG'].includes(node.tagName)
      ? 'bold'
      : ['I', 'EM'].includes(node.tagName)
        ? 'italic'
        : null;
    const next =
      kind && !marks.some((m) => m.type === kind) ? [...marks, { type: kind } as Mark] : marks;
    return [...node.childNodes].flatMap((n) => inline(n, next));
  }
  function blocks(container: ParentNode): PostNode[] {
    const result: PostNode[] = [];
    let pending: PostNode[] = [];
    const flush = () => {
      if (pending.length) {
        result.push({ type: 'paragraph', content: pending });
        pending = [];
      }
    };
    for (const node of container.childNodes) {
      if (node instanceof Element && ['UL', 'OL'].includes(node.tagName)) {
        flush();
        const items = [...node.children]
          .filter((n) => n.tagName === 'LI')
          .map((li) => {
            const content = blocks(li);
            if (content[0]?.type !== 'paragraph') content.unshift({ type: 'paragraph' });
            return { type: 'listItem' as const, content };
          });
        if (items.length)
          result.push({
            type: node.tagName === 'UL' ? 'bulletList' : 'orderedList',
            content: items,
          });
      } else if (node instanceof Element && node.tagName === 'TABLE') {
        flush();
        for (const row of node.querySelectorAll('tr'))
          result.push(
            ...textDocument([...row.children].map((c) => c.textContent ?? '').join(' | ')).content,
          );
      } else if (node instanceof Element && /^(P|DIV|H[1-6]|PRE|BLOCKQUOTE)$/.test(node.tagName)) {
        flush();
        const nested = blocks(node);
        result.push(...(nested.length ? nested : [{ type: 'paragraph' as const }]));
      } else pending.push(...inline(node));
    }
    flush();
    return result;
  }
  const content = blocks(clean);
  const document: PostDocument = {
    type: 'doc',
    content: content.length ? content : [{ type: 'paragraph' }],
  };
  if (!validateDocument(document))
    throw new Error('The pasted content could not be converted. Paste as plain text instead.');
  return document;
}
export function parseSupportedClipboardContent(data: Pick<DataTransfer, 'getData'>): PostDocument {
  const html = data.getData('text/html');
  if (html) return normalizeHtml(html);
  return textDocument(normalizePlainText(data.getData('text/plain')));
}
