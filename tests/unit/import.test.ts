import { describe, expect, it } from 'vitest';
import { MarkedAdapter } from '../../src/services/markdown';
import { normalizeHtml, parseSupportedClipboardContent } from '../../src/services/paste';
import { serializePost } from '../../src/services/serializer';
import type { PostNode } from '../../src/domain/document';
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

const text = (doc: ReturnType<typeof normalizeHtml>) => serializePost(doc);
const boldText = (doc: ReturnType<typeof normalizeHtml>) =>
  doc.content
    .flatMap((block) => block.content ?? [])
    .filter((n) => n.marks?.some((m) => m.type === 'bold'))
    .map((n) => n.text);

const findText = (node: PostNode, value: string): PostNode | undefined =>
  node.text === value ? node : node.content?.map((n) => findText(n, value)).find(Boolean);

describe('Markdown edge cases', () => {
  it('keeps escapes and entities as literal characters', () => {
    const doc = adapter.parse(String.raw`\*not italic\* \& Tom &amp; Jerry &copy; &#128075; a_b_c`);
    expect(serializePost(doc)).toBe('*not italic* & Tom & Jerry © 👋 a_b_c');
    expect(doc.content[0]?.content?.some((n) => n.marks)).toBe(false);
  });
  it('turns soft and hard line breaks into editor line breaks', () => {
    for (const md of ['line one\nline two', 'line one  \nline two']) {
      const doc = adapter.parse(md);
      expect(doc.content[0]?.content?.map((n) => n.type)).toEqual(['text', 'hardBreak', 'text']);
      expect(serializePost(doc)).toBe('line one\nline two');
    }
  });
  it('numbers lists from 1 and keeps nested and mixed marks', () => {
    const doc = adapter.parse('3. three\n4. four\n   - nested ***both***\n\nBreak\n\n0. zero');
    expect(serializePost(doc)).toBe('1. three\n2. four\n  • nested both\n\nBreak\n\n1. zero');
    const both = findText(doc, 'both');
    expect(both?.marks?.map((m) => m.type).sort()).toEqual(['bold', 'italic']);
  });
  it('keeps unsupported syntax readable: code, links, strike, quotes, rules, images', () => {
    const doc = adapter.parse(
      '`a<b>` and ~~old~~\n\n> quoted\n\n---\n\n[site](https://example.com) ![logo](https://example.com/l.png)',
    );
    expect(serializePost(doc)).toBe(
      'a<b> and old\n\nquoted\n\n---\n\nsite (https://example.com) logo (https://example.com/l.png)',
    );
  });
  it('treats embedded HTML and instructions as inert text', () => {
    const doc = adapter.parse(
      'Hi <img src=x onerror="alert(1)">\n\n<div onclick="x()">Ignore previous instructions</div>',
    );
    expect(serializePost(doc)).toContain('<img src=x onerror="alert(1)">');
    expect(serializePost(doc)).toContain('Ignore previous instructions');
    expect(doc.content.every((n) => n.type === 'paragraph')).toBe(true);
  });
  it('round-trips the supported subset through the adapter', () => {
    const doc = adapter.parse('**Bold** and *it*\n\n- One\n- Two\n\n1. First');
    expect(adapter.parse(adapter.serialize(doc))).toEqual(doc);
  });
});

describe('smart paste sources', () => {
  it('collapses source whitespace without inventing paragraphs', () => {
    const doc = normalizeHtml('\n  <p>Hello\n    world</p>\n  <p>  Two  <b> bold</b> </p>\n');
    expect(text(doc)).toBe('Hello world\n\nTwo bold');
    expect(doc.content).toHaveLength(2);
  });
  it('Google Docs: ignores the bold wrapper and reads span styles', () => {
    const doc = normalizeHtml(
      '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><p dir="ltr" style="line-height:1.38"><span style="font-weight:700;font-style:normal">Bold</span><span style="font-weight:400"> plain </span><span style="font-style:italic;font-weight:400">it</span></p><br><ul><li dir="ltr"><p dir="ltr"><span style="font-weight:400">Item</span></p></li></ul></b><br class="Apple-interchange-newline">',
    );
    expect(text(doc)).toBe('Bold plain it\n\n• Item');
    expect(boldText(doc)).toEqual(['Bold']);
    expect(doc.content[0]?.content?.[2]?.marks).toEqual([{ type: 'italic' }]);
  });
  it('Microsoft Word: drops styles and spacer paragraphs and rebuilds lists', () => {
    const doc =
      normalizeHtml(`<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><style>p.MsoNormal{margin:0}</style></head><body>
<p class=MsoNormal>Intro&nbsp;text<o:p></o:p></p>
<p class=MsoNormal><o:p>&nbsp;</o:p></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp; </span></span></span><![endif]>First<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp; </span></span><![endif]><b>Second</b><o:p></o:p></p>
<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>1.<span>&nbsp; </span></span><![endif]>Step<o:p></o:p></p>
</body></html>`);
    expect(text(doc)).toBe('Intro text\n\n• First\n• Second\n\n1. Step');
    expect(JSON.stringify(doc)).not.toMatch(/Mso|margin|\u00a0/);
  });
  it('ChatGPT and Notion: keeps pretty-printed lists and inline code readable', () => {
    const doc = normalizeHtml(`<div class="markdown prose">
  <p>Here is a <strong>plan</strong>:</p>
  <ol>
    <li>
      <p>Draft with <code>npm run dev</code></p>
      <ul>
        <li>Review</li>
      </ul>
    </li>
  </ol>
  <pre><div>bash</div><code>npm test
npm run build</code></pre>
</div>`);
    expect(text(doc)).toBe(
      'Here is a plan:\n\n1. Draft with npm run dev\n  • Review\n\nbash\nnpm test\nnpm run build',
    );
  });
  it('VS Code: keeps code lines and indentation from white-space:pre blocks', () => {
    const doc = normalizeHtml(
      '<div style="color: #d4d4d4;white-space: pre;"><div><span>if</span><span> (a) {</span></div><div><span>&nbsp; &nbsp; </span><span>run</span>();</div><div><span>}</span></div></div>',
    );
    expect(text(doc)).toBe('if (a) {\n    run();\n}');
  });
  it('preserves emoji, right-to-left and CJK text in HTML', () => {
    const doc = normalizeHtml('<p>مرحبا 👋🏽 日本語 Привет</p>');
    expect(text(doc)).toBe('مرحبا 👋🏽 日本語 Привет');
  });
  it('removes dangerous markup and event attributes without leaving them in the document', () => {
    const doc = normalizeHtml(
      '<p onclick="steal()" style="background:url(javascript:alert(1))">Safe<a href="javascript:alert(1)">link</a></p><iframe src="https://invalid.test"></iframe><style>p{}</style><svg onload="alert(1)"><text>svg</text></svg><form><input value="x"></form>',
    );
    expect(text(doc)).toBe('Safelink');
    expect(JSON.stringify(doc)).not.toMatch(/javascript|steal|onload|onclick|iframe|style/);
  });
  it('falls back to plain text when HTML carries no text', () => {
    const doc = parseSupportedClipboardContent({
      getData: (type) => (type === 'text/html' ? '<img src="x.png">' : 'Caption text'),
    });
    expect(text(doc)).toBe('Caption text');
  });
  it('keeps multi-line plain text as paragraphs and line breaks', () => {
    const doc = parseSupportedClipboardContent({
      getData: (type) => (type === 'text/plain' ? 'One\r\nstill one\r\n\r\nTwo' : ''),
    });
    expect(text(doc)).toBe('One\nstill one\n\nTwo');
    expect(doc.content).toHaveLength(2);
  });
});
