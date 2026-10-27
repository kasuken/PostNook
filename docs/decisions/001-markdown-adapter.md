# ADR 001: Isolate Markdown conversion behind an adapter

Status: accepted for the foundation prototype. Date: 2026-10-27.

The PRD flags Tiptap Markdown's beta status and requires replaceable conversion. PostNook stores structured editor JSON and must never execute imported HTML.

Use the pinned `marked` lexer through `MarkedAdapter`. Convert tokens directly into the supported document schema; never render parser HTML. This avoids coupling persisted content to an editor-specific Markdown extension. The tradeoff is explicit mapping code and a limited syntax contract, covered by unit and browser tests.

Paragraphs, bold, italic, hard breaks, and lists become editable nodes. Headings become paragraphs, code becomes readable text, blockquotes flatten, and tables become rows separated with `|`. Links retain their label and URL; images retain alternative text and URL. Embedded HTML stays inert literal text. Ordinary paste does not automatically parse Markdown.

Import is limited to 200,000 characters. Invalid converted output fails before replacing existing content. Adapter Markdown serialization is a portability/testing utility, not the publishing representation or a promise of lossless round-trip for every Markdown dialect.

Tiptap's Markdown extension could reduce custom mapping but adds beta API and schema coupling. Reevaluate behind the same interface when feature requirements justify it. Clipboard output always uses `PostSerializer`.

References: [Tiptap Markdown](https://tiptap.dev/docs/editor/markdown), [Marked documentation](https://marked.js.org/). Runtime behavior is established by pinned dependencies and tests.
