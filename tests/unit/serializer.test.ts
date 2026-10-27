import { describe, expect, it } from 'vitest';
import { serializePost, countCharacters, getLimitStatus } from '../../src/services/serializer';
import {
  emptyDocument,
  textDocument,
  validateDocument,
  type PostDocument,
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
