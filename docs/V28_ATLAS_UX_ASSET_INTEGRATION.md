# Spinner V28 — Atlas UX & Asset Integration

V28 turns the 1,912-asset world-content library from V27 into a more usable production surface. It does **not** add another simulation system. V16–V27 remain authoritative for gameplay, world state, economy, factions, settlements, operations, activities, crises, favorites, discovery history, and the asset catalog itself.

## Goals

- make the Atlas faster to search and scan
- persist browsing preferences across saves/reloads
- let players isolate favorites and already-discovered assets
- expose useful asset metadata and related content instead of showing only thumbnails
- make context art from worlds, strongholds, settlements, operations, activities, and crises directly inspectable
- improve keyboard, touch, and small-screen browsing without destabilizing legacy World tabs

## Schema 28 ownership

`state.v28` owns only UI/inspection state:

- `atlas.search`
- `atlas.kind`
- `atlas.group`
- `atlas.rarity`
- `atlas.sort`
- `atlas.favoritesOnly`
- `atlas.discoveredOnly`
- `atlas.page`
- `atlas.pageSize`
- `atlas.view`
- `inspector.selectedAssetId`
- UX statistics for inspections, filter changes, and keyboard shortcuts

V28 intentionally creates no wallet, currency, inventory, crafting, combat, faction, settlement, operation, activity, or crisis state.

## Atlas UX

The Atlas now supports persistent search and filters, four sort modes (name, family, rarity, newest release), favorites-only and discovered-only modes, grid/compact layout switching, and persisted pagination.

Press `/` while not typing in another control to focus Atlas search.

## Asset inspector

Clicking an Atlas card or contextual world-art card opens a native dialog with:

- asset name
- family and rarity
- subtype
- world/theme
- faction context
- intended usage targets
- tags
- provenance notes
- related assets selected from family/tag/usage overlap

Opening the inspector records the asset through the existing V27 discovery system; V28 does not create a second discovery database.

## Fallback behavior

`js/bootstrap.js` loads V28 only after a successful V27 load. If V28 fails, the application explicitly continues as **V27 World Content Mega-Pack**.

## Validation

Run:

```powershell
npm run validate:boundaries
npm run validate:v28
npm run validate
npm run test:e2e
npm run validate:release
```

V28 validation checks schema ownership, persistent UX preferences, favorites/discovery reuse, sorting, asset inspection, related-asset lookup, responsive styling, bootstrap wiring, PWA cache wiring, and package metadata. Chromium journeys cover persistent controls, inspector behavior, state-backed favorites/discovery views, the `/` shortcut, and legacy World-tab compatibility.

## Primary files

- `js/domain/v28-engine.js`
- `js/v28-experience.js`
- `styles/v28.css`
- `tests/v28.test.js`
- `tests/e2e/v28.spec.js`
- `tools/validate-v28-content.js`

Release wiring also updates `js/bootstrap.js`, `sw.js`, `package.json`, `package-lock.json`, `manifest.webmanifest`, `index.html`, and `README.md`.
