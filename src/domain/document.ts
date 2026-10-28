export type Mark = { type: 'bold' | 'italic' };
export interface PostNode {
  type: 'doc' | 'paragraph' | 'text' | 'hardBreak' | 'bulletList' | 'orderedList' | 'listItem';
  content?: PostNode[];
  text?: string;
  marks?: Mark[];
  attrs?: { start?: number; type?: null };
}
export interface PostDocument extends PostNode {
  type: 'doc';
  content: PostNode[];
}
export type OutputMode = 'plain' | 'unicode';
export const emptyDocument = (): PostDocument => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});
// Text nodes never hold newlines: each line break becomes a hard break, as in the editor.
export const textNodes = (text: string, marks: Mark[] = []): PostNode[] =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .flatMap((line, index) => [
      ...(index ? [{ type: 'hardBreak' as const }] : []),
      ...(line ? [{ type: 'text' as const, text: line, ...(marks.length ? { marks } : {}) }] : []),
    ]);
export const textDocument = (text: string): PostDocument => ({
  type: 'doc',
  content: text
    .replace(/\r\n?/g, '\n')
    .split(/\n\n+/)
    .map((p) => ({ type: 'paragraph', content: textNodes(p) })),
});

export function validateDocument(value: unknown): value is PostDocument {
  let count = 0;
  function visit(raw: unknown, parent: string, depth: number): boolean {
    if (++count > 50000 || depth > 32 || !raw || typeof raw !== 'object') return false;
    const n = raw as PostNode;
    const allowed: Record<string, string[]> = {
      root: ['doc'],
      doc: ['paragraph', 'bulletList', 'orderedList'],
      paragraph: ['text', 'hardBreak'],
      listItem: ['paragraph', 'bulletList', 'orderedList'],
      bulletList: ['listItem'],
      orderedList: ['listItem'],
    };
    if (!allowed[parent]?.includes(n.type)) return false;
    if (n.type === 'text')
      return (
        typeof n.text === 'string' &&
        n.text.length > 0 &&
        n.content === undefined &&
        (n.marks === undefined ||
          (Array.isArray(n.marks) &&
            n.marks.every((m) => m && ['bold', 'italic'].includes(m.type))))
      );
    if (n.type === 'hardBreak')
      return (
        n.content === undefined &&
        n.text === undefined &&
        (n.marks === undefined ||
          (Array.isArray(n.marks) &&
            n.marks.every((m) => m && ['bold', 'italic'].includes(m.type))))
      );
    if (n.text !== undefined || n.marks !== undefined) return false;
    if (n.content !== undefined && !Array.isArray(n.content)) return false;
    if (n.type !== 'paragraph' && !n.content?.length) return false;
    if (n.type === 'listItem' && n.content?.[0]?.type !== 'paragraph') return false;
    if (n.attrs?.start !== undefined && (!Number.isSafeInteger(n.attrs.start) || n.attrs.start < 1))
      return false;
    return (n.content ?? []).every((c) => visit(c, n.type, depth + 1));
  }
  return visit(value, 'root', 0);
}
