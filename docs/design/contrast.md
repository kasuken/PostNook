# Contrast measurements

Measured from computed theme tokens in running Chrome on 2026-10-27, using WCAG sRGB relative luminance. These opaque pairs are used by the rendered controls; disabled controls and decorative seams are excluded. Automated axe checks separately inspect rendered editor screens at each documented width. This is not a complete accessibility certification.

Run `node scripts/measure-contrast.mjs` with the development server on port 4173.

| Theme | Role                     | Foreground / background | Measured | Minimum | Result |
| ----- | ------------------------ | ----------------------- | -------- | ------- | ------ |
| Light | Editor text              | #242139 / #ffffff       | 15.54:1  | 4.5:1   | Pass   |
| Light | Secondary text on paper  | #686477 / #ffffff       | 5.71:1   | 4.5:1   | Pass   |
| Light | Secondary text on canvas | #686477 / #f4f3f8       | 5.17:1   | 4.5:1   | Pass   |
| Light | Primary button           | #ffffff / #6246c6       | 6.54:1   | 4.5:1   | Pass   |
| Light | Primary hover            | #ffffff / #5034b0       | 8.54:1   | 4.5:1   | Pass   |
| Light | Active control           | #6246c6 / #eeebfc       | 5.58:1   | 4.5:1   | Pass   |
| Light | Error message            | #a92e42 / #fff0f2       | 6.02:1   | 4.5:1   | Pass   |
| Light | Saved status             | #306646 / #ffffff       | 6.74:1   | 4.5:1   | Pass   |
| Light | Focus ring against paper | #6246c6 / #ffffff       | 6.54:1   | 3:1     | Pass   |
| Light | Control boundary         | #8c849f / #ffffff       | 3.55:1   | 3:1     | Pass   |
| Dark  | Editor text              | #f2eff9 / #211e2e       | 14.34:1  | 4.5:1   | Pass   |
| Dark  | Secondary text on paper  | #b6b0c7 / #211e2e       | 7.77:1   | 4.5:1   | Pass   |
| Dark  | Secondary text on canvas | #b6b0c7 / #181621       | 8.53:1   | 4.5:1   | Pass   |
| Dark  | Primary button           | #241647 / #b6a0ff       | 7.39:1   | 4.5:1   | Pass   |
| Dark  | Primary hover            | #241647 / #c8b8ff       | 9.18:1   | 4.5:1   | Pass   |
| Dark  | Active control           | #b6a0ff / #342a4b       | 5.99:1   | 4.5:1   | Pass   |
| Dark  | Error message            | #ffacb9 / #3a242f       | 8.05:1   | 4.5:1   | Pass   |
| Dark  | Saved status             | #a2d6b0 / #211e2e       | 9.91:1   | 4.5:1   | Pass   |
| Dark  | Focus ring against paper | #c4b3ff / #211e2e       | 8.71:1   | 3:1     | Pass   |
| Dark  | Control boundary         | #8c849f / #211e2e       | 4.59:1   | 3:1     | Pass   |
