# PostNook design system

Baseline: TF-007/TF-008, Dotcraft 1.1.0. Apply frontend-design, better-layout, better-typography, better-colors, better-accessibility, and animate to the React/Tailwind stack.

## Tokens and typography

`src/styles/app.css` defines semantic CSS variables and Tailwind aliases. Use `--canvas` for the outer surface, `--paper` for writing/dialogs, `--ink` and `--muted` for text, `--accent`/`--on-accent` for primary actions, `--accent-soft` for selected controls, `--focus` for focus outlines, and named danger/success roles for status. Decorative seams use `--line`; input boundaries use the stronger `--control-border`. Do not use decorative seams as the sole way to identify a control.

Light and dark themes change role values, not component structure. [Measured contrast](contrast.md) records 20 pairs from the running UI. Error, warning, save, and active states also use words, icons, or pressed semantics.

The font stack is Segoe UI Variable, Segoe UI, system-ui, -apple-system, sans-serif. No font requests or bundled font licenses are needed. The editor uses 1rem text, generous unitless line height, and normal wrapping. Labels are compact; the wordmark is bold with close tracking. Counter digits are tabular. URLs wrap, title input retains its full editable value, and text content uses automatic direction. Full localization remains outside the foundation.

Spacing roles use 4/8/12/16/24 pixels. Control radius is 8px; dialog radius is 16px. Elevation belongs to dialogs, not to every block. Most controls target 40px. The narrow toolbar uses 32px hit areas at 320px, above the 24px minimum; controls do not overlap. Focus uses a 2px outline with 3px offset. Use the existing CSS roles rather than introducing one-off colors.

## Component states and behavior

| Component        | States                                                    | Keyboard and semantics                                                                                               |
| ---------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Button           | Primary, secondary, ghost, danger; hover, focus, disabled | Native button, Enter/Space, disabled prevents activation                                                             |
| IconButton       | Default, pressed, disabled                                | Required accessible label, tooltip title, aria-pressed for toggles                                                   |
| Formatting group | Bold, italic, lists, history, clear, import               | Native fieldset; temporary disabling prevents edits during draft transitions; selection preserved by editor commands |
| Draft row        | Active, inactive, long title                              | Button opens the selected draft; time and active indicator are textual                                               |
| Modal            | Settings, draft list, import, confirmation, fallback      | Native showModal makes the background inert; Tab/Shift+Tab wrap; Escape closes; trigger regains focus                |
| Settings         | System, light, dark                                       | Pressed buttons, keyboard activation, persisted choice                                                               |
| Counter          | Normal, approaching, over                                 | Tabular UTF-16 estimate; text warning accompanies color                                                              |
| SaveIndicator    | Saved, saving, unsaved, failed, conflict                  | Polite status announcement; words and icon identify the state                                                        |
| Notice           | Storage, import, clipboard, load errors                   | Alert with an explicit recovery action; content remains visible                                                      |
| Copy feedback    | Idle, copying, copied, failure                            | Result announced only after actual write; failure opens selectable fallback                                          |

The local showcase at `sidepanel.html?studio` demonstrates these foundations. Hover/focus are live interaction states; selected and disabled fixtures are visible. Its error, save, and copy examples are labelled simulations. The normal application has real IndexedDB, clipboard, and settings services. The production entry excludes the showcase.

## Motion and layout

Typing, formatting, and keyboard actions are immediate. Only button color feedback transitions over 140ms when reduced motion is not requested. There are no layout animations, decorative loops, or animation libraries. The writing region scrolls; essential actions remain in the footer. Dialog content scrolls within the panel. Tests cover widths 320/400/600 and 200% text resizing; actual browser-zoom and human screen-reader checks remain part of TF-010.

## Ownership

Shared foundations live in `src/components/ui.tsx` and the token stylesheet. Feature components own editor, drafts, preview, and settings behavior. The production shell should reuse these components rather than fork visual states. Unit/component tests cover disabled commands, status labels, and keyboard theme changes; browser tests cover native-dialog focus and rendered contrast via axe. See [UI review](ui-review.md) for limits and follow-up ownership.
