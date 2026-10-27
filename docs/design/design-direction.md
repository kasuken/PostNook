# A little room to write

Design baseline for TF-007. Dotcraft 1.1.0: frontend-design, better-layout,
better-typography, better-colors, better-accessibility, and animate.

## Directions considered

**The writer's notebook (selected).** An open writing surface with a violet
bookmark motif, humanist system typography, quiet chrome, and a steady footer.
The writing occupies the visual center; status lives next to the next action.

```text
PostNook                         Settings
Your little corner for better posts.
Draft title                     Drafts +
Write                 Preview
Formatting tools

The best ideas rarely arrive fully formed.
They start as a sentence in a notebook.
                    open writing space

Saved on this device          124 / 3,000
Plain text                    Copy Post
```

**The publishing console (rejected).** Persistent draft navigation, dense command
rows, and multiple bordered cards would help a larger publishing suite, but
consume too much of a 320-pixel panel and encourage scope beyond the local editor.

```text
Identity    Drafts    Settings
Draft list | Toolbar
Small idea | Editor card: The best ideas rarely
Next post  | arrive fully formed. They start as
           | a sentence in a notebook.
           | Preview card: the same post again
Status     | Export tools
```

## Chosen system

- Mist `#f4f3f8`: quiet browser-adjacent canvas.
- Paper `#ffffff`: writing and raised surfaces.
- Ink `#242139`: primary text.
- Graphite `#686477`: secondary text.
- Iris `#6246c6`: primary action, focus, active mode.
- Seam `#dedbe8`: subtle boundaries, never the only indicator of an input.

Use Segoe UI Variable / Segoe UI on Windows and the native system sans elsewhere.
These are deliberate familiar writing faces, with no font download or loading
shift. Body text uses a generous unitless line height; the wordmark uses heavier
weight and close tracking. Keep labels in sentence case and counters tabular.
The one signature detail is a folded bookmark N: it identifies the nook without
decorating the text. Use a modest 8/12/16/24 spacing rhythm, 8-pixel controls,
and larger corners only on floating dialogs.

## Brief critique before implementation

An initial card-heavy sketch made the editor feel like another dashboard. Remove
the editor card, ornamental gradients, and decorative status chips. Retain one
primary filled action (Copy Post; Create first post in the empty state), place
formatting in a recognizable toolbar, and let the text supply the personality.
Do not reproduce LinkedIn's identity or imply automatic publishing.

## Journeys

| Journey      | Sequence                                    | Focus and recovery                                      |
| ------------ | ------------------------------------------- | ------------------------------------------------------- |
| First post   | Welcome → create → editor                   | Focus the writing surface after create.                 |
| Return       | Open → load active draft → edit             | Do not present a blank draft on load failure.           |
| Markdown     | Editor → import dialog → insert             | Restore the selection; import is undoable.              |
| Preview/copy | Write → preview → copy → manual paste       | Preview uses serialized text; return preserves content. |
| Recovery     | Failed save → retry or keep a separate copy | Keep unsaved text visible and never label it saved.     |

At 320, 400, and 600 CSS pixels, retain a single column and wrap toolbar groups.
At larger widths increase whitespace instead of adding navigation. Long titles
have a full editable value; long URLs wrap. Editor content scrolls independently
of essential controls, with focus scroll clearance. Light and dark themes use
the same hierarchy, with measured contrasting text and status tokens.

Rendered [screen studies](prototype/README.md), [design tokens](design-system.md), and the [review record](ui-review.md) document the implemented baseline and browser checks.
No user research is claimed by this design rationale.
