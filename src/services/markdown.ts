import { Marked, type Token, type Tokens } from 'marked';
import { type MarkdownAdapter } from '../domain/contracts';
import {
  type Mark,
  type PostDocument,
  type PostNode,
  textDocument,
  validateDocument,
} from '../domain/document';
import { serializePost } from './serializer';

const parser = new Marked({ gfm: true, breaks: false });
function mergeText(nodes: PostNode[]): PostNode[] {
  return nodes.filter((n) => n.type !== 'text' || Boolean(n.text));
}
function inline(tokens: Token[], marks: Mark[] = []): PostNode[] {
  return mergeText(
    tokens.flatMap((token): PostNode[] => {
      if (token.type === 'strong' || token.type === 'em')
        return inline(token.tokens ?? [], [
          ...marks,
          { type: token.type === 'strong' ? 'bold' : 'italic' },
        ]);
      if (token.type === 'br') return [{ type: 'hardBreak' }];
      if (token.type === 'link')
        return [...inline(token.tokens ?? [], marks), { type: 'text', text: ` (${token.href})` }];
      if (token.type === 'image')
        return [{ type: 'text', text: `${token.text || 'Image'} (${token.href})` }];
      if (token.type === 'text' && token.tokens) return inline(token.tokens, marks);
      const text = 'text' in token ? String(token.text) : token.raw;
      return text ? [{ type: 'text', text, ...(marks.length ? { marks } : {}) }] : [];
    }),
  );
}
function blocks(tokens: Token[]): PostNode[] {
  return tokens.flatMap((t): PostNode[] => {
    switch (t.type) {
      case 'space':
        return [];
      case 'paragraph':
      case 'heading':
      case 'text':
        return [
          {
            type: 'paragraph',
            content: inline(t.tokens ?? [{ type: 'text', raw: t.raw, text: t.text }]),
          },
        ];
      case 'list':
        return [
          {
            type: t.ordered ? 'orderedList' : 'bulletList',
            content: (t as Tokens.List).items.map((item) => {
              const content = blocks(item.tokens);
              if (content[0]?.type !== 'paragraph') content.unshift({ type: 'paragraph' });
              return { type: 'listItem', content };
            }),
          },
        ];
      case 'blockquote':
        return blocks(t.tokens ?? []);
      case 'table':
        return [(t as Tokens.Table).header, ...(t as Tokens.Table).rows].map((row) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: row.map((c) => c.text).join(' | ') }],
        }));
      default:
        return textDocument('text' in t ? String(t.text) : t.raw).content;
    }
  });
}
export class MarkedAdapter implements MarkdownAdapter {
  parse(markdown: string): PostDocument {
    if (markdown.length > 200000)
      throw new Error(
        'Import is limited to 200,000 characters. Import a smaller section; your draft is unchanged.',
      );
    const content = blocks(parser.lexer(markdown));
    const doc: PostDocument = {
      type: 'doc',
      content: content.length ? content : [{ type: 'paragraph' }],
    };
    if (!validateDocument(doc))
      throw new Error('This Markdown could not be imported safely. Your draft is unchanged.');
    return doc;
  }
  serialize(document: PostDocument): string {
    if (!validateDocument(document)) throw new Error('Unsupported document.');
    function block(node: PostNode): string {
      if (node.type === 'text') {
        let text = (node.text ?? '').replace(/([\\`*_{}[\]<>#!|])/g, '\\$1');
        if (node.marks?.some((m) => m.type === 'italic')) text = `*${text}*`;
        if (node.marks?.some((m) => m.type === 'bold')) text = `**${text}**`;
        return text;
      }
      if (node.type === 'hardBreak') return '  \n';
      if (node.type === 'paragraph') return (node.content ?? []).map(block).join('');
      if (node.type === 'bulletList' || node.type === 'orderedList')
        return (node.content ?? [])
          .map(
            (n, i) =>
              `${node.type === 'bulletList' ? '-' : `${i + 1}.`} ${block(n).replace(/\n/g, '\n  ')}`,
          )
          .join('\n');
      return (node.content ?? []).map(block).join('\n\n');
    }
    return block(document) || serializePost(document);
  }
}
