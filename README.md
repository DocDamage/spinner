# Multiverse Wheel V13 — Director's Cut

A local-first browser game about building a custom hero, bending a seeded event
wheel with Fate, and carrying choices through a connected multiverse campaign.
The runtime roster contains 1,326 character profiles.

Play the current release at
[docdamage.github.io/spinner](https://docdamage.github.io/spinner/).

## Run locally

The app has no build step. Serve the repository with a static HTTP server:

```powershell
python -m http.server 8765
```

Open
`http://localhost:8765/Multiverse_Wheel_V8_1326_Real_Repo_Images.html`.
Serving over HTTP also enables installation and offline caching; opening the
HTML directly still supports the local game but not its service worker.

## V13 game loop

- The title command deck offers Continue, a three-step New Timeline setup,
  Daily Challenge, three isolated save slots, challenge codes, Archive, and
  Settings.
- The default Play view centers the current objective, wheel, event, and a
  compact hero/build/party/Fate rail. The full legacy dashboard remains one
  button away.
- Fate can lock, favor, or ban before eligible spins and nudge or reroll after
  landing. First-power, story, boss, and Daily Challenge wheels are protected.
- Every character has a deterministic role, passive, ultimate, signature move
  set, and structured weaknesses. Authored identity fields override fallbacks.
- Build Lab includes capacity and synergy, five named loadout presets, pins,
  30-second undo, reward comparisons, and exclusive Mastery 2/4 branches.
- Tactical battles include Quick Resolve previews, exploit windows, off-turn
  assists, team combos, adaptive enemy plans, named boss rules, and after-action
  reports.
- Loyalty changes assist costs and can cause refusal or departure. Thirty-six
  universe events across twelve major packs create delayed callbacks and feed
  rival outcomes, named endings, a chronological recap, and score breakdown.
- Completed runs support text recap, a local PNG share card, selectable New
  Game+ inheritance/mutator pairs, and Daily personal bests.

The [implementation plan](docs/V13_IMPLEMENTATION_PLAN.md) contains the product
criteria. [V13 content schema](docs/V13_CONTENT_SCHEMA.md) documents identity,
story-pack, callback, and offline-shell data.

## Structure

- `styles/app.css`, `styles/v9.css`, `styles/v13.css` — legacy, structured, and
  V13 title/play/combat/narrative/replay presentation
- `js/data/` — base data, expansions, and mega roster
- `js/domain/` — independently testable balance, combat, campaign, save,
  simulation, roster, V13 state, Fate, identity, narrative, legacy, daily, and
  challenge-code rules
- `js/ui/` — escaped templates and keyboard/focus controllers
- `js/core.js` through `js/v12-command-center.js` — the existing simulator
  layers retained for compatibility
- `js/v13-foundation.js` — schema migration, canonicalization, slots, Daily and
  challenge starts
- `js/v13-shell.js` — title/setup flow, condensed Play view, wheel manifest,
  and V13 settings
- `js/v13-agency.js` — Fate, presets, pins, undo, mastery, and build identity
- `js/v13-combat.js` — Quick Resolve, assists/combos, boss rules, exploits, and
  after-action reports
- `js/v13-narrative.js` — loyalty, event packs, callbacks, rival resolutions,
  endings, recap text, and share-card generation
- `js/v13-replay.js` — Daily records, selectable New Game+, install/update UX,
  and campaign-length hardening
- `manifest.webmanifest`, `sw.js` — installable offline shell

Scripts are classic deferred scripts and must remain in their documented HTML
order because each layer extends the preceding `MultiverseWheel` prototype.

## Validation

Run the unit, roster, migration, content, syntax/reference, journey, and offline
asset checks:

```powershell
npm run validate
```

Run the full release gate, including automated Chromium desktop/mobile
journeys, keyboard controls, persistence, and offline reload:

```powershell
npm run validate:release
```

Generate deterministic balance reports:

```powershell
npm run analyze:balance
npm run analyze:v13
```

For the detailed alias, generated-identity, and missing-media report:

```powershell
npm run validate:content -- --json
```

State migration is idempotent and marked with schema version 13. Autosaves are
local to the browser; portable JSON backup import/export remains available.
