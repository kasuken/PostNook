import {
  validateDocument,
  type PostDocument,
  type PostNode,
  type OutputMode,
} from '../domain/document';

function styled(text: string, bold: boolean, italic: boolean): string {
  const start =
    bold && italic ? [0x1d468, 0x1d482] : bold ? [0x1d400, 0x1d41a] : [0x1d434, 0x1d44e];
  return Array.from(text)
    .map((c) => {
      if (!bold && italic && c === 'h') return '\u210e';
      if (/[A-Z]/.test(c)) return String.fromCodePoint(start[0]! + c.charCodeAt(0) - 65);
      if (/[a-z]/.test(c)) return String.fromCodePoint(start[1]! + c.charCodeAt(0) - 97);
      if (bold && !italic && /[0-9]/.test(c)) return String.fromCodePoint(0x1d7ce + Number(c));
      return c;
    })
    .join('');
}

function inline(nodes: PostNode[], mode: OutputMode): string {
  // Protect complete URL/hashtag/mention spans, even across differently marked nodes.
  const plain = nodes.map((n) => (n.type === 'hardBreak' ? '\n' : (n.text ?? ''))).join('');
  const protectedRanges = [
    ...plain.matchAll(
      /(?:https?:\/\/|www\.)\S+|[\p{L}\p{N}.-]+\.[a-z]{2,}(?:\/\S*)?|[#@][\p{L}\p{N}_]+/giu,
    ),
  ].map((m) => [m.index, m.index + m[0].length]);
  let offset = 0;
  return nodes
    .map((n) => {
      const value = n.type === 'hardBreak' ? '\n' : (n.text ?? '');
      const bold = n.marks?.some((m) => m.type === 'bold') ?? false;
      const italic = n.marks?.some((m) => m.type === 'italic') ?? false;
      return Array.from(value)
        .map((c) => {
          const protectedChar = protectedRanges.some(
            ([from, to]) => offset >= from! && offset < to!,
          );
          offset += c.length;
          return mode === 'unicode' && (bold || italic) && !protectedChar
            ? styled(c, bold, italic)
            : c;
        })
        .join('');
    })
    .join('');
}

export function serializePost(document: PostDocument, mode: OutputMode = 'plain'): string {
  if (!validateDocument(document))
    throw new Error('This draft contains unsupported content. Your original has not been changed.');
  function block(n: PostNode, depth = 0): string {
    if (n.type === 'paragraph') return inline(n.content ?? [], mode);
    if (n.type === 'bulletList' || n.type === 'orderedList') {
      const indent = '  '.repeat(depth + 1);
      let number = 0;
      return (n.content ?? [])
        .map((item) => {
          const parts = (item.content ?? [])
            .map((child) => ({
              text:
                child.type === 'paragraph'
                  ? indent + block(child).replace(/\n/g, '\n' + indent)
                  : block(child, depth + 1),
              paragraph: child.type === 'paragraph',
            }))
            .filter((part) => part.text.trim());
          const body = parts.map((part) => part.text).join('\n');
          // An empty item would copy as a lone marker, so only its nested lists are kept.
          if (!parts[0]?.paragraph) return body;
          const marker = n.type === 'bulletList' ? '• ' : `${++number}. `;
          return '  '.repeat(depth) + marker + body.slice(indent.length);
        })
        .filter((body) => body)
        .join('\n');
    }
    return '';
  }
  return document.content
    .map((n) => block(n))
    .join('\n\n')
    .replace(/[^\S\n]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
export const countCharacters = (text: string) => text.length;
export const LINKEDIN_LIMIT = 3000;
export const getLimitStatus = (count: number) =>
  count > LINKEDIN_LIMIT ? 'over' : count >= LINKEDIN_LIMIT - 100 ? 'approaching' : 'normal';
