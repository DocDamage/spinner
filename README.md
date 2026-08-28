# Multiverse Wheel V16 — Living Multiverse

A local-first browser game about forging a custom hero, bending a seeded event
wheel with Fate, and writing a connected multiverse saga alone or with up to ten
local or directly connected players. The runtime roster contains 1,326 character profiles.
V16 adds a persistent Living Multiverse where worlds, factions, relic ownership,
and recurring nemeses keep evolving between player decisions.

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

## V16 Living Multiverse

- Every completed encounter advances a deterministic world tick derived from the
  run seed. Discovered realities persist stability, corruption, threat, collapse
  state, visit history, and off-screen events.
- Six seeded factions maintain goals, ethos, reputation, power, resources, and
  bilateral relations. Existing Chronicle intentions slowly influence faction
  reputation, while faction wars and alliances alter world pressure.
- Major losses can promote enemies into recurring nemeses. Nemeses remember the
  cause, gain levels off-screen, hunt routes, and directly reduce battle odds
  when they return. Tactical-combat knockouts and quick/legacy battles use the
  same persistent nemesis rules.
- Relic ownership is tracked separately from the player inventory. Artifacts
  lost to hazards can remain in the multiverse and later be recovered by a
  faction, creating hooks for future recovery missions and faction content.
- The Living Multiverse continues in bounded offline catch-up: one world tick
  per 90 minutes away, capped at 12 ticks per load so time away can create new
  history without silently destroying a run.
- A new **WORLD** panel exposes an interactive discovered-reality map, travel
  focus, world meters, faction state, nemesis dossiers, and the persistent
  long-memory timeline. Choosing a discovered reality makes normal opponent
  selection favor characters from that universe when enough valid roster
  candidates exist.
- Stability, corruption, average faction reputation, and nemesis power feed
  back into battle probability within hard safety caps. High corruption/threat
  also increases eligible hazard pressure before the next wheel is generated.
- V16 state is isolated under `state.v16`, migrates idempotently from V15 saves,
  rides inside existing host-authoritative multiplayer snapshots, and is
  precached by the service worker for offline play.

The [V16 Living Multiverse guide](docs/V16_LIVING_MULTIVERSE.md) documents the
simulation, state model, world UI, compatibility guarantees, validation, and
next expansion targets.

## V15 Hero Ascension

- Cross-device table play connects 2–10 browsers directly with WebRTC. The
  host owns the timeline and save; each guest receives a seat, and only the
  current captain or expected council voter can change the shared state.
- GitHub Pages needs no backend account or secret. Each guest exchanges one
  invite and one answer code with the host. Built-in STUN attempts a direct
  route, and the lobby accepts optional TURN credentials when a NAT or firewall
  requires relaying.
- Every hero starts at Level 1. Encounters and victories award XP, each new
  level awards a core attribute point, and the sheet visualizes allocation,
  modifiers, derived stats, XP, and the next unlock.
- Active power sources unlock at Levels 1, 5, and 10. Technique capacity grows
  from two to six slots, individual source techniques unlock through both hero
  level and mastery, and transformations have visible level gates.
- The expanded Hero Forge now has 12 lineages, 10 callings, 12 backgrounds, 18
  skills, and ten optional identity/story prompts. Portable `.mwhero.json`
  files use a checksum and strict 27-point validation; imports deliberately
  reset to Level 1 without powers, forms, items, companions, or reward stats.
- Transformation media uses 2,346 exact IDs. A form never borrows a fuzzy base
  portrait: verified exact art wins, otherwise the game renders a clearly
  labeled exact-ID card. The downloader stages transformation candidates under
  a stricter review threshold before activation.

## Chronicle Saga

- Local hot-seat and online table play support 1–10 named players, rotating
  captains, and optional private council voting for story decisions.
- The Chronicle War is one ten-chapter time-fracture saga, from The Hour That
  Broke through The Unwritten Horizon. Every chapter identifies the location,
  opposition, objective, revelation, consequence, and story key at stake.
- Every story scene offers four authored approaches plus a freeform plan. A
  custom plan uses a seeded d20 check, a selected skill, and a visible risk.
- Player intent—Protect, Discover, Connect, or Defy—stays visible and changes
  real battle and hazard odds.
- The Hero Forge uses a 27-point, d20-inspired system with six abilities, twelve
  lineages, ten callings, twelve backgrounds, eighteen skills, saves, traits, ideals,
  bonds, flaws, and an editable origin.
- The character dossier includes derived Armor, Initiative, Resolve, passive
  perception, ability/save details, trained skill bonuses, stat bars, and a
  seven-axis canvas constellation.
- All 32 gameplay artifacts and all 10 Chronicle MacGuffins now have local,
  project-generated art. Verified character replacements can override legacy
  portraits without overwriting the original library.

The [Chronicle Saga guide](docs/CHRONICLE_SAGA.md) documents story, multiplayer,
character creation, choices, and stat mapping. The [asset pipeline guide](docs/ASSET_PIPELINE.md)
documents safe downloads, review, provenance, and repairs.

## Foundation retained from V13

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

- `styles/app.css`, `styles/v9.css`, `styles/v13.css`, `styles/v14.css`,
  `styles/v15.css`, `styles/v16.css` — legacy, structured, title/play/combat,
  saga, progression, creator, online-table, and Living Multiverse presentation
- `js/data/` — base data, expansions, and mega roster
- `js/domain/` — independently testable balance, combat, campaign, save,
  simulation, roster, V13 state, Fate, identity, narrative, legacy, daily,
  challenge-code, Hero Ascension, and Living Multiverse rules
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
- `js/domain/v14-engine.js` — independently testable character creation,
  multiplayer, Chronicle Saga, freeform-choice, migration, and asset rules
- `js/v14-experience.js` — V14 browser integration and presentation
- `js/domain/v15-engine.js` — Level 1 progression, power gates, portable hero
  validation, and network protocol rules
- `js/v15-experience.js` — exact transformation media, expanded creator,
  attribute allocation, and host-authoritative WebRTC table integration
- `js/domain/v16-engine.js` — seeded worlds, factions, nemeses, relic ownership,
  long memory, world evolution, offline catch-up, and gameplay pressure
- `js/v16-experience.js` — V16 migration hooks, wheel/combat integration, world
  travel focus, World State UI, and tactical nemesis wiring
- `download_game_assets.py` — staged search, scoring, format validation,
  duplicate audit, provenance, review sheet, acceptance, and active manifest
- `tools/generate-relic-art.js` — deterministic local artifact/MacGuffin cards
- `manifest.webmanifest`, `sw.js` — installable offline shell

Scripts are classic deferred scripts through V15. `js/bootstrap.js` loads the
V16 domain and experience layers after V15 but before constructing the game
instance, preserving the documented prototype-extension order without rewriting
the large compatibility HTML shell.

## Validation

Run the unit, roster, migration, content, syntax/reference, journey, and offline
asset checks:

```powershell
npm run validate
```

Run only the Living Multiverse validator:

```powershell
npm run validate:v16
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

State migration is idempotent and marked with schema version 16. Autosaves are
local to the browser; portable JSON backup import/export remains available.
