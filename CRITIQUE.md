# Alpenwerk — independent design critique

The explicitly invoked app-designer skill's independent critic reviewed all twelve screenshots in each round: full page, hero, calculator and application at RU/1440, DE/768 and EN/375. Its iOS rubric was adapted to the requested responsive website: native fluency means accessible web controls and comfortable mobile interaction, not iPhone chrome. The dark calculator panel provides the designed dark surface; a global dark theme was not requested.

## Scores

| Criterion | Round 1 | Round 2 |
|---|---:|---:|
| Concept on the pixel | 4 | 4 |
| Not the category average | 4 | 4 |
| Not the skill's average | 4 | 4 |
| Hierarchy | 4 | 4 |
| Typography | 4 | 4 |
| Colour | 4 | 4 |
| Richness | 4 | 4 |
| Rhythm and space | 4 | 4 |
| Craft details | 3 | 4 |
| Web/mobile fluency | 3 | 4 |
| Signature | 3 | 4 |
| Feature test | 3 | 3 |

Round 1: not done (8/12 at least 4). Round 2: done (11/12 at least 4; none below 3). No visible clipping, translation collisions or horizontal overflow in either round. The critic described the result as strong editorial banking design, below exceptional portfolio-level work; no inflated portfolio score is claimed.

## Executed changes

1. Chart ticks moved outside the scaled SVG into an unscaled 11px HTML axis, including selected-term emphasis.
2. Added translated 24-month income scale with actual calculated zero and maximum values.
3. Amount field uses locale grouping when unfocused and raw digits on focus. Entire value is selected on focus to make editing and automation reliable.
4. Language controls expanded to 36×44px. Mobile logo reduced to preserve space.
5. Tablet description minimum height reduced from 105 to 80px, keeping product rates aligned.

Also corrected the negative-position fixed skip-link capture artifact with opacity/transform: the link remains accessible and visible on keyboard focus. Ranges have 44px hit areas while their visible track stays 4px. Photo caption uses a solid dark plate for consistent contrast. The critic confirmed all five requests landed and found no remaining visible defects.

After round 2, small unscored improvements restore spacing around the now-taller term range, give footer language controls the same 44px height as the header, and simplify the header below 350px. Keyboard testing also prompted an explicit Tab/Shift+Tab loop inside the native dialog. These do not change the art direction.

## Scans and warning decisions

`scripts/scan-site.mjs` reuses the actual app-designer DOM and pixel scan from `shoot.mjs` on live sections in all nine language/viewport combinations. The skill source itself is unchanged. Web adapters are explicitly limited to:

- No iOS device chrome; section frames use `data-chrome="none"`.
- Screen-reader-only text is excluded from visual clipping checks; its intended CSS clipping makes it visually hidden, not inaccessible.
- Native closed `<details>` descendants are hidden for the scan because the skill's getBoundingClientRect-based visibility check otherwise includes their layout boxes.
- Emoji detection uses Unicode Emoji_Presentation or explicitly selected emoji presentation. Ordinary text-presentation copyright and arrow characters are not emoji.
- Scrollable tables are marked as scroll areas so intentional clipping is not reported as a defect.

Final mechanical report: `design/shots/r2/skill-scan.json`; responsive overflow/minimum-text report: `design/shots/r2/scan.json`.

Final build passes. All 11 Playwright tests pass: calculation checks, nine complete localized responsive scenarios, and language persistence/privacy/keyboard focus/reduced motion. Additional 320px checks pass on all three languages at the maximum amount.

Warning dispositions:

- **Section-edge text:** intentional alignment to the shared content margin; the scanner measures the section edge, not the viewport. Actual margins are 20/32/56px.
- **More than 7 sizes:** deliberate responsive website hierarchy includes display, product numbers, controls, image captions and metadata; all meaningful text is at least 11 CSS px, graph labels no longer scale below that. The independent critic scored typography 4.
- **Multiple left edges:** the product comparison has three columns and inset product content; these are deliberate repeated alignments, not random placement.
- **Small footer hero/flat hierarchy:** footer is deliberately quiet supporting content, not a second hero.
- **Em dash in Russian copy:** retained where grammatical and natural; not a layout defect or automatic writing substitution.
- **Footer language hit targets:** fixed to 44px height after the second critique.

## Verification limits

Screenshots and interactions are checked in local Google Chrome. Real touchscreen feel, native screen-reader narration, other browser engines and animation feel on a physical device were not independently verified. Financial rates are fictional. No real bank claims or guarantees are made.
