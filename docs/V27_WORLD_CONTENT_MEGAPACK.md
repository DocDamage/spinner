# Spinner V27 — World Content Mega-Pack

V27 is the second large world-content release for Spinner. It keeps V26's 376-asset original library intact, adds **1,536** additional rights-safe project visuals, and presents a combined **1,912-asset** Atlas across **25 asset families**.

The release is deliberately additive. V16–V25 remain authoritative for worlds, economy, party consequences, relics, factions, strongholds, settlements, operations, activities, and crises. V26 remains authoritative for favorites/recent asset history and its original saved visual assignments. V27 adds denser visual context around those systems rather than replacing them.

## Content scale

V27 adds 1,536 assets:

- 96 buildings
- 96 places
- 72 interiors
- 120 items
- 96 vehicles
- 72 NPC roles
- 32 stronghold scenes
- 32 settlement scenes
- 32 activity scenes
- 32 crisis scenes
- 40 UI icons
- 96 props
- 48 landmarks
- 48 shops
- 72 resources
- 48 flora assets
- 48 fauna assets
- 48 hazards
- 48 transit assets
- 72 furnishings
- 72 technology assets
- 72 weapons
- 48 armor assets
- 48 food assets
- 48 utility assets

Together with V26, the Atlas contains 1,912 original assets.

## New V27 families

The 14 brand-new families are **props, landmarks, shops, resources, flora, fauna, hazards, transit, furnishings, technology, weapons, armor, food, and utility equipment**. These fill the environmental and object-level gaps that remained after V26.

Examples include cargo crates, street kiosks, generators, world gates, monuments, bridges, general stores, weapon shops, tech bazaars, ores, crystals, salvage, trees, herbs, wildlife, dimensional hazards, metro and portal stations, command furniture, drones, shield emitters, rifles, heavy weapons, field armor, meals, survival equipment, and rescue tools.

## Rights-safe visual strategy

Every V27 entry is original Spinner project art. Each entry carries formal metadata for identity, family, subtype, world/theme, faction, rarity, tags, usage targets, provenance, verification state, dimensions, media type, deterministic visual seed, and release number.

Runtime paths use `generated:v27/...`. Art is rendered locally as standalone SVG via `js/world-asset-art-v27.js`; there are no remote hotlinks in the generated SVG output. This keeps the PWA offline-capable without adding thousands of large raster binaries.

Character and transformation imagery is **not** silently replaced by these generic world assets. Exact character/form art remains on the existing review-first pipeline.

## Stable additive context

V27 does not reroll the visual identity that V26 already assigned to a saved world or entity.

For each world, stronghold, settlement, operation, activity, or crisis:

1. V27 reads the existing `state.v26.assignments` entry.
2. Those V26 asset IDs are preserved at the beginning of the V27 context.
3. Additional slots are filled deterministically from V27's expanded family set.
4. The enriched result is stored in `state.v27.contexts`.

Typical enriched contexts now include six visuals instead of four. A stronghold can therefore retain its V26 base/interior identity while also receiving furnishings, technology, weapons, armor, props, utilities, or vehicles. A settlement can add shops, food, resources, flora, transit, and street props. Operations and crises can add hazards, rescue utilities, tactical equipment, resources, and environmental detail.

V27 owns no wallet, currency, inventory, combat, faction, settlement, operation, activity, or crisis simulation.

## Mega-Atlas UX

World → Atlas remains the entry point. V27 upgrades it with:

- 1,912 assets across 25 families
- 14 new family filters
- semantic group filters for Structures, World, Gear, People, Events, and UI
- kind filtering
- rarity filtering
- text search
- 72-card pages with Previous/Next navigation
- favorites through existing V26 state
- V27 discovery tracking
- responsive context strips showing up to six assets

The paginated design prevents the nearly 2,000-card library from being rendered into the DOM at once.

## Persistence

V27 uses schema `27` and stores only:

- `state.v27.contexts`
- `state.v27.discoveries`
- `state.v27.settings`
- `state.v27.stats`

Migration is idempotent. Existing V26 state is not rewritten by V27 migration.

## Fallback safety

The V27 bootstrap layer is nested inside the working V26 release. V27 catalog data and the V27 SVG renderer are loaded into separate globals first. The existing V26 globals are activated only after the complete V27 layer has loaded successfully.

If V27 fails to load, bootstrap explicitly continues with **V26 World Content Expansion**.

## Project contamination guard

V27 adds `tools/validate-spinner-boundaries.js`. It scans Spinner source, tests, docs, styles, root scripts, and workflow text for distinctive foreign-project fingerprints associated with the accidentally mixed SERA prompt, including tenant/RLS-specific implementation signatures.

This validator uses narrow signatures rather than fuzzy words such as `SERA` or `RLS`, avoiding false positives from character names, image metadata, or ordinary Spinner content. It is part of the normal release validation path.

## Validation

Run:

```powershell
npm run validate:boundaries
npm run validate:v27
npm run validate
npm run test:e2e
npm run validate:release
```

Required release expectations:

- 376 V26 base assets remain intact.
- 1,536 V27 additions are present.
- Combined Atlas total is 1,912.
- There are 25 asset families.
- Every V27 generated asset has original-project provenance.
- New SVG art contains no remote image references.
- V26 assignment IDs are preserved at the front of V27 contexts.
- V27 creates no duplicate economy/inventory systems.
- Spinner project-boundary validation reports no SERA contamination signatures.
- Unit/content validation and Chromium release journeys pass on the exact release head.

## Primary files

- `js/data/world-content-v27.js`
- `js/world-asset-art-v27.js`
- `js/domain/v27-engine.js`
- `js/v27-experience.js`
- `styles/v27.css`
- `tests/v27.test.js`
- `tests/e2e/v27.spec.js`
- `tools/validate-v27-content.js`
- `tools/validate-spinner-boundaries.js`
- `docs/V27_WORLD_CONTENT_MEGAPACK.md`
