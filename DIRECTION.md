# Alpenwerk — Alpine architecture

## Brief
User-authored brief: an attractive, functional, local React SPA for a fictional Swiss bank selling illustrative fixed-term deposits. Russian (default), Swiss German and English. Compare, calculate, try a local application. No banking services, backend, real submission or deployment.

## Exploration
`design/explore.html` renders three complete hero studies with the same real product information.
1. **A viewing terrace above the Alps** (place): limestone ground, Golos grotesque, glacier blue, photographic richness. Chosen per user preference; the wide photographic horizon supports both the brand and the term-selection interaction.
2. **A machined bank vault** (object): dark green graphite, serif, warm metal, concentric material. Rejected: more exclusive and inward-looking than the accessible calculation-first brief.
3. **A Swiss exhibition poster** (printed): saturated clay-orange, condensed display, layered geometry. Rejected: memorable but more confrontational than the desired calm long-term perspective.

No existing history file found at inspection. History for this job stays in the workspace (`design/history.md`); writing to the global home directory is outside the writable scope.

## Refused category defaults
No dark-lime fintech dashboard, balances and recent-transactions skeleton, purple glow, emoji icons, pastel icon tiles or generic stock people. No fake founding date, banking licence, customer counts, guarantees, testimonials or regulatory claims. This is a website, so iPhone frames, iOS chrome, haptics and App Store screens are not deliverables.

## Tokens
Ground #f5f5f0; raised #ffffff; ink #253238; ink-2 #596567; rule #d9dfdc; accent #23536d; on-accent #ffffff. Dark calculator result: ground #233c47, ink #f6f8f5, secondary #c4d4d9. Accent means action, selected state and calculation curve. Photographic sky is not an additional UI accent.
Typeface: self-hosted Golos Text variable, 400–700, Latin and Cyrillic. The plan's Golos Display could not be verified as an official family; display treatment uses Golos Text at 500 with tight tracking instead of inventing a font asset.
Base size roles: 11px metadata, 14–16px body, 20px subheads, 32px product headings, 48px section displays, up to 88px hero. Responsive intermediate sizes are deliberate and documented in CRITIQUE.md. Display tracking −4%; body 1.55 leading. Content max width 1320px; desktop margin 56px, tablet 32px, mobile 20px. Spacing 4/8/12/16/24/32/48/64/96. Corners 4px controls, 8px large surfaces, capsules only for language/selection tags. Shadows restricted to elevated dialog.

## Richness
Wide view of Jungfrau, crisp daylight, cool grey-blue sky, snow and rock; image goes edge to edge within the content margin. Local image, source and licence in `public/images/SOURCE.md`. Bespoke mountain-outline product illustrations share one geometric hand and become longer/wider with the product horizon.

## Signature storyboard
Trigger: select or slide term (6/12/24 months). The selected product and rate change together. Graph uses a stable 0–24 month axis and full 24-month income scale for the chosen rate. Its endpoint moves from one-quarter to one-half to the end of the horizon, with 250ms interruptible coordinate transitions. Numbers update immediately, never delay correctness. Reduced motion: endpoint jumps with no transition. Native range keyboard interaction; no simulated browser haptics.

## Content and initial state
All exact screen content lives in the three typed dictionaries in `src/i18n.ts`, authored before the React layouts. Product names Basis/Panorama/Horizon are brand names across languages. Initial state Panorama / CHF / 100,000 / 12 months / monthly compounding. The complete dictionary includes nav, hero, products, comparison, calculation, monthly table, approach, five FAQs, closing, footer, product detail, application, validation and success states. All rates and product limitations match the user's table. No real data is fabricated.
