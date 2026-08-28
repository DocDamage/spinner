# Multiverse Wheel V13 release evidence

- Release candidate: V13.0.0 — Director's Cut
- Evidence date: 2026-08-28
- Deterministic simulation seed: `20260828`

## Acceptance evidence

| Workstream | Shipped implementation | Verification |
| --- | --- | --- |
| Foundation | Schema-13 migration, canonical universes, generated character identities, Fate economy, deterministic challenge codes, three save slots | Node migration, identity, Fate, determinism, and repository tests |
| Shell | Title command deck, Continue/New/Daily/Archive/Settings actions, three-step setup, condensed Play view, accessible wheel manifest, responsive UI | Chromium setup, keyboard, persistence, desktop, and 390 px mobile journeys |
| Run agency | Fate interventions, pins, five presets, 30-second undo, reward comparisons, M2/M4 mastery choices, Build Lab | Node invariants plus browser reward/build journey |
| Combat | Quick Resolve, assist/combo meter, exploit windows, adaptive tactics, boss rules, after-action metrics | Combat domain tests and complete browser campaigns |
| Narrative | 12 universe packs, 36 events, delayed callbacks, loyalty/refusal/departure rules, rival resolutions, seven endings | Content validator, narrative tests, deterministic full journey, and 5,000-run simulation |
| Replay | Recap, score breakdown, MVP/highlights, text and local PNG sharing, Daily records, selectable New Game+ benefits/mutators | Daily integrity, ending/share/NG+ browser journey and Node repository tests |
| Offline and install | Web app manifest, rights-safe project icons, versioned service worker shell, update/install UI, social preview metadata | Offline reference validation and cached Chromium reload |

## Automated release gate

`npm run validate:release` is the release command. It runs:

- 45 Node tests covering domain rules, migrations, content, persistence, and full deterministic journeys.
- Static project validation across local references and JavaScript sources.
- V13 content validation across all 1,326 characters, 123 canonical universes, 12 event packs, 36 events, and 49 offline-shell references.
- Nine Chromium journeys, including a full 30-spin desktop run, a full 30-spin run at 390 px with no horizontal overflow, keyboard-only operation, settings/save restoration, Daily Challenge integrity, ending/share/New Game+, and cached offline reload.

The final release gate passed on 2026-08-28. A V6 relationship-alias runtime defect discovered by the new complete-campaign tests was corrected in `js/v6-custom-hero.js`; the targeted regression journeys and complete gate pass with the correction.

## Deterministic balance report

Command: `node tools/simulate-v13.js 5000 20260828`

The simulator samples five evenly represented player styles so every narrative branch has a realistic route to appear. Its fixed-seed result was:

- Completion: 83.8%; final victory: 65.9%.
- Strategy use: clash 20.2%, blitz 20.0%, counter 19.9%, mystic 20.0%, outlast 19.9%. No strategy dominates the sample.
- Fate per run: 9.88 earned, 8.04 spent, 4.84 remaining.
- Average ending resources: 53.8 energy and 46.5 loyalty.
- Ending distribution: Last Light 23.6%, Covenant 18.5%, Rivals' End 13.7%, Sovereign 13.3%, Living Nexus 12.5%, Fractured Timeline 10.4%, Horizon Guardian 7.9%.

These numbers are regression evidence, not a claim of universal player balance. Re-run the same command after tuning rules and compare the fixed-seed output.

## Content and asset audit

The character roster validates at 1,326 unique entries. Identity coverage is complete through deterministic V13 fallbacks: every character receives a passive, ultimate, moves, and weakness tags even when those fields are not hand-authored. The media audit matches 1,298 entries directly by normalized name; 28 use the existing resolver fallback or remain candidates for bespoke art. That is a quality backlog, not a broken local-reference condition.

Project-owned release assets:

- `icons/icon-192.png` and `icons/icon-512.png`: deterministic, code-native MW wheel marks.
- `assets/multiverse-wheel-v13-social.png`: original 1200×630 cosmic command-deck share image with no franchise characters or third-party logos.

## Manual handoff

No external deployment was performed. From the repository root, run `npm run validate:release` for the complete gate, then serve the directory over HTTP to exercise install and service-worker behavior in a browser.
