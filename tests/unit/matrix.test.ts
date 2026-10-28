// QA-001: one named case per PRD section 14.1 item, written from the requirement rather than the
// implementation. Cases already covered in depth elsewhere are referenced in docs/testing/qa-matrix.md.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  serializePost,
  countCharacters,
  getLimitStatus,
  LINKEDIN_LIMIT,
} from '../../src/services/serializer';
import { MarkedAdapter } from '../../src/services/markdown';
import { emptyDocument, textDocument, type PostDocument } from '../../src/domain/document';
import { IndexedDraftRepository, PostNookDatabase } from '../../src/storage/drafts';

const para = (...content: PostDocument['content']) => ({ type: 'paragraph', content }) as const;
const text = (value: string, ...marks: ('bold' | 'italic')[]) => ({
  type: 'text' as const,
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});
const doc = (...content: PostDocument['content']): PostDocument =>
  ({ type: 'doc', content }) as PostDocument;

describe('14.1 serializer', () => {
  it('empty document', () => {
    expect(serializePost(emptyDocument())).toBe('');
    expect(serializePost(emptyDocument(), 'unicode')).toBe('');
  });
  it('single paragraph', () => {
    expect(serializePost(textDocument('Hello there'))).toBe('Hello there');
  });
  it('multiple paragraphs are separated by one blank line', () => {
    expect(serializePost(textDocument('One\n\nTwo\n\nThree'))).toBe('One\n\nTwo\n\nThree');
  });
  it('single line break stays a single newline', () => {
    expect(serializePost(textDocument('One\nTwo'))).toBe('One\nTwo');
  });
  it('bullet and numbered lists', () => {
    const item = (value: string) => ({ type: 'listItem' as const, content: [para(text(value))] });
    expect(serializePost(doc({ type: 'bulletList', content: [item('A'), item('B')] }))).toBe(
      '• A\n• B',
    );
    expect(serializePost(doc({ type: 'orderedList', content: [item('A'), item('B')] }))).toBe(
      '1. A\n2. B',
    );
  });
  it('mixed paragraphs and lists keep blank lines around the list', () => {
    const item = { type: 'listItem' as const, content: [para(text('Point'))] };
    expect(
      serializePost(
        doc(para(text('Intro')), { type: 'bulletList', content: [item] }, para(text('End'))),
      ),
    ).toBe('Intro\n\n• Point\n\nEnd');
  });
  it('bold and italic marks: no markup in plain, styled letters in Unicode', () => {
    const marked = doc(para(text('Bold', 'bold'), text(' and '), text('it', 'italic')));
    expect(serializePost(marked)).toBe('Bold and it');
    const unicode = serializePost(marked, 'unicode');
    expect(unicode).not.toContain('Bold');
    expect(unicode).toContain(' and ');
    expect(unicode).not.toMatch(/\*|_|<b>/);
  });
  it('Unicode conversion leaves digits, punctuation and unsupported letters readable', () => {
    const out = serializePost(doc(para(text('Héllo, 42!', 'bold'))), 'unicode');
    expect(out).toContain('é');
    expect(out).toContain(',');
    expect(out).toContain('!');
    expect(out).not.toContain('H');
  });
  it('emoji, including ZWJ sequences and flags, are copied unchanged', () => {
    const value = 'Ship it 🚀 👩‍💻 🇮🇹';
    expect(serializePost(textDocument(value))).toBe(value);
    expect(serializePost(doc(para(text(value, 'bold'))), 'unicode')).toContain('🚀 👩‍💻 🇮🇹');
  });
  it('hashtags and mentions are never restyled', () => {
    const out = serializePost(doc(para(text('Read #DevTools with @Ada', 'bold'))), 'unicode');
    expect(out).toContain('#DevTools');
    expect(out).toContain('@Ada');
  });
  it('URLs are never restyled, even when marked', () => {
    const out = serializePost(
      doc(para(text('See https://example.com/a?b=1', 'italic'))),
      'unicode',
    );
    expect(out).toContain('https://example.com/a?b=1');
  });
  it('non-Latin text is preserved in both modes', () => {
    const value = 'مرحبا 日本語 Привет';
    expect(serializePost(textDocument(value))).toBe(value);
    expect(serializePost(doc(para(text(value, 'bold'))), 'unicode')).toBe(value);
  });
  it('excessive whitespace is normalized at block boundaries', () => {
    expect(serializePost(textDocument('\n\n\nOne   \n\n\n\n\nTwo\n\n\n'))).toBe('One\n\nTwo');
  });
  it('unsupported editor nodes are refused instead of copied silently', () => {
    const table = {
      type: 'doc',
      content: [{ type: 'table', content: [] }],
    } as unknown as PostDocument;
    expect(() => serializePost(table)).toThrow(/unsupported content/);
  });
  it('malformed input is refused and the original is not modified', () => {
    const malformed = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text' }] }],
    } as unknown as PostDocument;
    const before = structuredClone(malformed);
    expect(() => serializePost(malformed)).toThrow();
    expect(() => serializePost(null as unknown as PostDocument)).toThrow();
    expect(malformed).toEqual(before);
  });
});

describe('14.1 Markdown adapter', () => {
  const adapter = new MarkedAdapter();
  it('valid Markdown', () => {
    expect(serializePost(adapter.parse('**Hi** there\n\n- one\n- two'))).toBe(
      'Hi there\n\n• one\n• two',
    );
  });
  it('invalid Markdown stays readable text instead of failing', () => {
    expect(serializePost(adapter.parse('**unclosed *emphasis _and ~~strike'))).toContain(
      'unclosed',
    );
  });
  it('mixed formatting keeps both marks', () => {
    const out = JSON.stringify(adapter.parse('***both*** and **bold _italic_**'));
    expect(out).toContain('"bold"');
    expect(out).toContain('"italic"');
  });
  it('nested structures keep their nesting', () => {
    expect(serializePost(adapter.parse('- a\n  - b\n    - c'))).toBe('• a\n  • b\n    • c');
  });
  it('unsupported syntax keeps its words', () => {
    const out = serializePost(
      adapter.parse('# Title\n\n> quote\n\n`code`\n\n[link](https://x.test)'),
    );
    for (const word of ['Title', 'quote', 'code', 'link']) expect(out).toContain(word);
  });
  it('empty content gives an empty, valid document', () => {
    expect(serializePost(adapter.parse(''))).toBe('');
    expect(serializePost(adapter.parse('   \n\n  '))).toBe('');
  });
  it('large content within the limit imports; over the limit is refused', () => {
    const large = Array.from({ length: 2000 }, (_, i) => `Paragraph ${i}`).join('\n\n');
    expect(serializePost(adapter.parse(large)).split('\n\n')).toHaveLength(2000);
    expect(() => adapter.parse('x'.repeat(200001))).toThrow(/limited/);
  });
  it('embedded HTML is inert text, never markup', () => {
    const out = serializePost(
      adapter.parse('<img src=x onerror=alert(1)> <script>alert(1)</script>'),
    );
    expect(out).toContain('<img src=x onerror=alert(1)>');
    expect(out).toContain('<script>');
  });
});

describe('14.1 character counter (UTF-16 estimate)', () => {
  it('ASCII', () => expect(countCharacters('Hello')).toBe(5));
  it('accented characters (precomposed)', () => expect(countCharacters('café')).toBe(4));
  it('combining characters count each code unit', () => expect(countCharacters('café')).toBe(5));
  it('emoji and surrogate pairs count two units each', () => {
    expect(countCharacters('🚀')).toBe(2);
    expect(countCharacters('𝐁')).toBe(2);
  });
  it('newlines count', () =>
    expect(countCharacters(serializePost(textDocument('a\n\nb')))).toBe(4));
  it('Unicode styling output is counted after styling', () => {
    const styled = serializePost(doc(para(text('Bold', 'bold'))), 'unicode');
    expect(countCharacters(styled)).toBe(8);
  });
  it('exactly 3,000 is within the limit; 3,001 is over', () => {
    expect(LINKEDIN_LIMIT).toBe(3000);
    expect(getLimitStatus(3000)).not.toBe('over');
    expect(getLimitStatus(3001)).toBe('over');
  });
});

describe('14.1 draft repository', () => {
  const databases: PostNookDatabase[] = [];
  const repository = () => {
    const db = new PostNookDatabase('matrix-' + crypto.randomUUID());
    databases.push(db);
    return new IndexedDraftRepository(db);
  };
  afterEach(async () => {
    vi.restoreAllMocks();
    for (const db of databases.splice(0)) await db.delete();
  });
  it('create, read, update, delete', async () => {
    const repo = repository();
    const created = await repo.createDraft('T', textDocument('a'));
    expect(await repo.getDraft(created.id)).toEqual(created);
    const updated = await repo.updateDraft(created.id, 1, textDocument('b'), 'T2');
    expect(updated).toMatchObject({ revision: 2, title: 'T2' });
    await repo.deleteDraft(created.id, 2);
    await expect(repo.getDraft(created.id)).rejects.toMatchObject({ code: 'missing' });
  });
  it('conflict detection rejects a stale revision and keeps the stored version', async () => {
    const repo = repository();
    const draft = await repo.createDraft('T', textDocument('a'));
    await repo.updateDraft(draft.id, 1, textDocument('b'), 'T');
    await expect(repo.updateDraft(draft.id, 1, textDocument('stale'), 'T')).rejects.toMatchObject({
      code: 'conflict',
    });
    expect((await repo.getDraft(draft.id)).content).toEqual(textDocument('b'));
  });
  it('invalid documents are refused on create and update', async () => {
    const repo = repository();
    const bad = { type: 'doc', content: [{ type: 'script' }] } as unknown as PostDocument;
    await expect(repo.createDraft('T', bad)).rejects.toMatchObject({ code: 'invalid' });
    const draft = await repo.createDraft('T', textDocument('kept'));
    await expect(repo.updateDraft(draft.id, 1, bad, 'T')).rejects.toBeTruthy();
    expect((await repo.getDraft(draft.id)).content).toEqual(textDocument('kept'));
    expect((await repo.listDrafts()).drafts).toHaveLength(1);
  });
  it('storage quota failure is reported as quota and leaves earlier drafts intact', async () => {
    const repo = repository();
    const kept = await repo.createDraft('Kept', textDocument('safe'));
    vi.spyOn(repo.db.drafts, 'add').mockRejectedValue(
      new DOMException('The quota has been exceeded.', 'QuotaExceededError'),
    );
    await expect(repo.createDraft('New', textDocument('x'))).rejects.toMatchObject({
      code: 'quota',
    });
    expect((await repo.getDraft(kept.id)).content).toEqual(textDocument('safe'));
  });
  it('a quota error inside an aborted transaction is still reported as quota', async () => {
    const repo = repository();
    const draft = await repo.createDraft('Kept', textDocument('safe'));
    vi.spyOn(repo.db.drafts, 'put').mockRejectedValue(
      Object.assign(new Error('Transaction aborted'), {
        name: 'AbortError',
        inner: new DOMException('The quota has been exceeded.', 'QuotaExceededError'),
      }),
    );
    await expect(repo.updateDraft(draft.id, 1, textDocument('more'), 'Kept')).rejects.toMatchObject(
      { code: 'quota' },
    );
    expect((await repo.getDraft(draft.id)).content).toEqual(textDocument('safe'));
  });
});
