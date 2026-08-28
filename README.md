# Multiverse Wheel V10.1

A browser-based multiverse character wheel and custom-hero simulator with a
1,326-character roster.

## Run locally

The app has no build step. Serve the repository with any static HTTP server:

```powershell
python -m http.server 8765
```

Then open:

`http://localhost:8765/Multiverse_Wheel_V8_1326_Real_Repo_Images.html`

## Structure

- `styles/app.css` — shared V5–V8 presentation and responsive layout
- `styles/v9.css` — structured campaign, build lab, combat-preview, and coach UI
- `js/data/` — base data, expansion content, and the large mega roster
- `js/domain/` — independently testable balance, combat, campaign, wheel, trait,
  save, derived-state cache, simulation, and roster-validation services
- `js/ui/` — escaped interface templates and accessible dialog focus management
- `js/core.js` — wheel state, randomization, persistence, and base rendering
- `js/v5-systems.js` — missions, relationships, forms, and simulator systems
- `js/v6-custom-hero.js` — custom hero, combat, activities, gallery, and campaign
- `js/v8-everything.js` — V8 progression, modes, archive, and UI shell
- `js/v8-integration.js` — compatibility and integration hardening
- `js/v9-gameplay.js` — thin adapter connecting domain services to the legacy game
- `js/v10-performance.js` — fingerprinted derived-state memoization for hot render paths
- `js/v10-late-run.js` — searchable, paged, lazy power-library and bounded log rendering
- `js/v10-tactical-advisor.js` — intent-aware combat recommendations with player-confirmed staging
- `js/v11-experience.js` — quick starts, stage route, reward comparison, collection focus, and combat presentation
- `js/v12-command-center.js` — contextual objectives, session pulse, keyboard controls, and portable backups
- `js/media-resolver.js` — repository image matching and cached lookup
- `js/performance.js` — lazy gallery metadata/image loading
- `js/bootstrap.js` — application startup

Scripts are classic deferred scripts and must remain in their current HTML order,
because each version layer extends the preceding `MultiverseWheel` prototype.

## Validate changes

```powershell
npm run validate
```

This runs the Node test suite, validates all 1,326 runtime roster entries, and
checks local HTML asset references. Browser state is stored locally with a V9
schema marker while remaining compatible with existing V6–V8 saves.

For the release gate, which also runs the automated Chromium journeys for
quick start, first power, reward comparison, collection focus, combat,
accessibility preferences, command-center shortcuts, and backup export:

```powershell
npm run validate:release
```

For a deterministic 5,000-build balance sample:

```powershell
npm run analyze:balance
```

## Core gameplay loop

Each 10-spin stage now has an objective, three connected decisions, a recurring
rival, a pre-boss camp, and a boss altered by the player's choices. Builds are
limited to three active power sets and a capacity budget; other acquired sets
become passives capped at +12 per stat across the collection. Combat exposes enemy intent, outcome previews,
counter/support actions, typed interactions, a short action journal, and an
intent-aware recommendation that the player can inspect before committing.

## V10 experience pass

New runs can begin from four editable quick-start identities or the full origin
creator. The main route now exposes all ten stage beats, combat has an optional
focused view and mobile sticky actions, and victory rewards show permanent gains
and tradeoffs before selection. Roster discovery awards milestones, can focus
three wheels toward a selected universe, and converts max-mastery duplicates
into credits and archive shards. Saved display controls cover larger text, high
contrast, and reduced motion.

## V10.1 command center

A persistent objective bar now identifies the next meaningful action and keeps
the current streak, threat level, score, and distance to the next boss visible.
Fast-wheel and optional haptic settings persist with the run, keyboard shortcuts
cover the primary game and combat actions, and the Save Vault can export or
validate and restore a portable JSON timeline backup. Saved reduced-motion now
also shortens the actual wheel animation.
