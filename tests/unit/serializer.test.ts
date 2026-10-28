import { describe, expect, it } from 'vitest';
import { serializePost, countCharacters, getLimitStatus } from '../../src/services/serializer';
import {
  emptyDocument,
  textDocument,
  validateDocument,
  type PostDocument,
  type PostNode,
} from '../../src/domain/document';

describe('publishing text', () => {
  it('normalizes paragraphs and hard breaks without changing the original', () => {
    const doc = textDocument('\n\nOne\nline\n\n\nTwo\n\n');
    const original = structuredClone(doc);
    expect(serializePost(doc)).toBe('One\nline\n\nTwo');
    expect(doc).toEqual(original);
    expect(serializePost(emptyDocument())).toBe('');
  });
  it('serializes lists with deliberate boundaries and sequential numbers', () => {
    const doc: PostDocument = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Start' }] },
        {
          type: 'orderedList',
          attrs: { start: 6 },
          content: ['One', 'Two'].map((text) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
          })),
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'End' }] }],
            },
          ],
        },
      ],
    };
    expect(serializePost(doc)).toBe('Start\n\n1. One\n2. Two\n\n• End');
  });
  it('protects URLs split across marks and international content from Unicode transformation', () => {
    const doc: PostDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello https://ex', marks: [{ type: 'bold' }] },
            {
              type: 'text',
              text: 'ample.com #hello @writer 日本語 👋',
              marks: [{ type: 'italic' }],
            },
          ],
        },
      ],
    };
    expect(serializePost(doc)).toBe('Hello https://example.com #hello @writer 日本語 👋');
    expect(serializePost(doc, 'unicode')).toBe(
      '𝐇𝐞𝐥𝐥𝐨 https://example.com #hello @writer 日本語 👋',
    );
    expect(serializePost(doc, 'unicode')).toBe(serializePost(doc, 'unicode'));
  });
  const t = (text: string, bold = false): PostNode => ({
    type: 'text',
    text,
    ...(bold ? { marks: [{ type: 'bold' as const }] } : {}),
  });
  const p = (...content: PostNode[]): PostNode => ({ type: 'paragraph', content });
  const li = (...content: PostNode[]): PostNode => ({ type: 'listItem', content });
  const doc = (...content: PostNode[]): PostDocument => ({ type: 'doc', content });
  it('indents nested lists, extra item paragraphs, and line breaks inside items', () => {
    const nested = doc(
      p(t('Intro')),
      {
        type: 'bulletList',
        content: [
          li(p(t('a'), { type: 'hardBreak' }, t('b')), p(t('c')), {
            type: 'orderedList',
            content: [li(p(t('n1'))), li(p(t('n2')))],
          }),
          li(p(t('d'))),
        ],
      },
      p(t('Outro')),
    );
    expect(serializePost(nested)).toBe('Intro\n\n• a\n  b\n  c\n  1. n1\n  2. n2\n• d\n\nOutro');
  });
  it('drops empty list items and whitespace-only paragraphs so nothing copies as a stray marker', () => {
    expect(serializePost(doc({ type: 'bulletList', content: [li(p())] }))).toBe('');
    expect(
      serializePost(
        doc({
          type: 'orderedList',
          content: [li(p(t('x'))), li(p()), li(p(t('  '))), li(p(t('y')))],
        }),
      ),
    ).toBe('1. x\n2. y');
    expect(serializePost(doc(p(t('A')), p(t('   ')), p(), p(), p(t('B  '))))).toBe('A\n\nB');
    expect(
      serializePost(doc(p({ type: 'hardBreak' }, { type: 'hardBreak' }, t('B')), p(), p())),
    ).toBe('B');
  });
  it('emits no markup for marks and keeps literal Markdown and HTML that the writer typed', () => {
    const marked = doc(
      p(t('Bold', true), t(' and '), { ...t('italic'), marks: [{ type: 'italic' }] }),
    );
    expect(serializePost(marked)).toBe('Bold and italic');
    expect(serializePost(marked)).not.toMatch(/<|\*|_/);
    expect(serializePost(doc(p(t('**x** <b>y</b>'))))).toBe('**x** <b>y</b>');
  });
  it('generates the same text for the same document and mode', () => {
    const sample = doc(p(t('Hello', true), t(' 👋 ¡Hola! Привет مرحبا')));
    const runs = Array.from({ length: 5 }, () => serializePost(sample, 'unicode'));
    expect(new Set(runs).size).toBe(1);
    expect(serializePost(sample)).toBe('Hello 👋 ¡Hola! Привет مرحبا');
  });
  it('recounts after Unicode styling, which uses more UTF-16 units than plain text', () => {
    const sample = doc(p(t('Bold', true)));
    expect(countCharacters(serializePost(sample))).toBe(4);
    expect(countCharacters(serializePost(sample, 'unicode'))).toBe(8);
  });
  it.each([
    null,
    { type: 'doc', content: [] },
    { type: 'doc', content: [{ type: 'image' }] },
    { type: 'doc', content: [{ type: 'text', text: 'invalid root' }] },
  ])('rejects malformed input safely: %j', (doc) => {
    expect(validateDocument(doc)).toBe(false);
    expect(() => serializePost(doc as PostDocument)).toThrow();
  });
  it('counts output in UTF-16 units and uses explicit warning boundaries', () => {
    expect(countCharacters('aé👩‍💻e\u0301\n')).toBe(10);
    expect(getLimitStatus(2899)).toBe('normal');
    expect(getLimitStatus(2900)).toBe('approaching');
    expect(getLimitStatus(3000)).toBe('approaching');
    expect(getLimitStatus(3001)).toBe('over');
  });
});
