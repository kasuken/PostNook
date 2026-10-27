import { describe, expect, it } from 'vitest';
import { MarkedAdapter } from '../../src/services/markdown';
import { normalizeHtml, parseSupportedClipboardContent } from '../../src/services/paste';
import { serializePost } from '../../src/services/serializer';
const adapter = new MarkedAdapter();
describe('safe import', () => {
  it('parses Markdown through an isolated adapter and retains marks', () => {
    const doc = adapter.parse('**Hello** *world*\n\n- One\n- Two\n\n1. Next');
    expect(serializePost(doc)).toBe('Hello world\n\n• One\n• Two\n\n1. Next');
    expect(doc.content[0]?.content?.[0]?.marks).toEqual([{ type: 'bold' }]);
    expect(adapter.serialize(doc)).toContain('**Hello**');
  });
  it('preserves unsupported Markdown as readable content and never interprets HTML', () => {
    const doc = adapter.parse('# Heading\n\n```js\nalert(1)\n```\n\n<script>alert(2)</script>');
    expect(serializePost(doc)).toContain('Heading');
    expect(serializePost(doc)).toContain('alert(1)');
    expect(serializePost(doc)).toContain('<script>');
  });
  it('keeps normal paste literal and supports emoji, NBSP, and non-Latin text', () => {
    const doc = parseSupportedClipboardContent({
      getData: (type) => (type === 'text/plain' ? '**literal**\u00a0日本語 👋' : ''),
    });
    expect(serializePost(doc)).toBe('**literal** 日本語 👋');
  });
  it('removes executable HTML and turns a table into readable text', () => {
    const doc = normalizeHtml(
      '<p>Hello <b>world</b><img src="https://invalid.test/x" onerror="alert(1)"></p><script>alert(2)</script><table><tr><td>A</td><td>B</td></tr></table><p>End</p>',
    );
    expect(serializePost(doc)).toBe('Hello world\n\nA | B\n\nEnd');
    expect(JSON.stringify(doc)).not.toMatch(/onerror|script|invalid.test/);
  });
  it('keeps nested lists and safe paragraph boundaries', () => {
    const doc = normalizeHtml('<ul><li>Outer<ul><li>Inner</li></ul></li></ul><p>After</p>');
    expect(serializePost(doc)).toBe('• Outer\n  • Inner\n\nAfter');
  });
  it('rejects oversized Markdown before replacing any existing document', () => {
    expect(() => adapter.parse('x'.repeat(200001))).toThrow(/limited/);
  });
});
