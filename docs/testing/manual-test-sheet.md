# Manual test sheet

These are the human checks that automation cannot cover. Do not script or automate LinkedIn, and do not share account credentials with anyone, including the person running the session. Use non-sensitive sample text. Before posting, set the post's visibility to a test audience you control or delete the post afterwards, and record nothing beyond the fields below.

Record for every run: date, tester, OS, browser and version, PostNook commit, output mode, and the source the text came from.

## LinkedIn paste compatibility (QA-005, PRD 14.4)

For each case: write or paste the text into PostNook, open Preview, choose Copy Post, paste into the LinkedIn post composer by hand, and compare it with the preview before and after publishing.

| #   | Case                                 | Source  | Mode    | Spacing as in preview? | Characters as expected? | LinkedIn count or limit message | Differences |
| --- | ------------------------------------ | ------- | ------- | ---------------------- | ----------------------- | ------------------------------- | ----------- |
| 1   | Short plain-text post                | Typed   | Plain   |                        |                         |                                 |             |
| 2   | Multiple paragraphs                  | Typed   | Plain   |                        |                         |                                 |             |
| 3   | Bullet list, including a nested item | Typed   | Plain   |                        |                         |                                 |             |
| 4   | Numbered list                        | Typed   | Plain   |                        |                         |                                 |             |
| 5   | URLs                                 | Typed   | Both    |                        |                         |                                 |             |
| 6   | Hashtags and mentions                | Typed   | Both    |                        |                         |                                 |             |
| 7   | Emoji-heavy post (ZWJ, flags)        | Typed   | Plain   |                        |                         |                                 |             |
| 8   | Non-English (RTL and CJK)            | Typed   | Plain   |                        |                         |                                 |             |
| 9   | Unicode-styled bold and italic       | Typed   | Unicode |                        |                         |                                 |             |
| 10  | About 3,000 characters (2,990–3,010) | Typed   | Plain   |                        |                         |                                 |             |
| 11  | Text copied from Word                | Word    | Plain   |                        |                         |                                 |             |
| 12  | Text copied from ChatGPT             | ChatGPT | Plain   |                        |                         |                                 |             |

Also note whether LinkedIn shows a "see more" cut, where it falls, and whether LinkedIn's counter agrees with PostNook's estimate in cases 7, 9 and 10.

## Keyboard-only journey (QA-004)

With no pointer:

1. Open PostNook from the toolbar action.
2. Create a first post.
3. Type and format with the shortcuts and the toolbar.
4. Rename the draft.
5. Create a second draft and switch back through the drafts dialog.
6. Import Markdown.
7. Open Preview and switch between desktop and mobile.
8. Return to Write, change theme in Settings, and choose Unicode output, reading the warning.
9. Copy the post.
10. Delete a draft after confirming.

Record any control you could not reach, unclear focus, focus lost after a dialog, or a trap.

## Screen-reader journey (QA-004)

Repeat the keyboard journey with NVDA or Narrator on Windows and VoiceOver on macOS. Record whether each of these is announced and understandable:

- control names;
- pressed state on the toolbar, theme and preview buttons;
- "Saved on this device" and the failure states;
- the character limit warnings;
- "Post copied";
- the Unicode warning dialog;
- reading the preview text.

## Results

Attach the completed tables to [QA-005](https://github.com/kasuken/PostNook/issues/35) and [QA-004](https://github.com/kasuken/PostNook/issues/34), and file a defect for each blocking difference.
