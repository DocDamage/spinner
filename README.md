# Multiverse Wheel V28 — Atlas UX & Asset Integration

A local-first browser/PWA game about forging a custom hero through a persistent multiverse built around a seeded event Wheel. The runtime roster contains 1,326 character profiles.

V28 keeps V27's **1,912 rights-safe original world visuals across 25 asset families** and makes that library substantially easier to browse, inspect, filter, reuse, and understand inside the game.

Play the current release at [docdamage.github.io/spinner](https://docdamage.github.io/spinner/).

## Release stack

- **V16 — Living Multiverse:** worlds, factions, wars, nemeses, memory, and persistent simulation.
- **V17 — Reality Rules:** destinations, routes, Favor, travel, and universe rules.
- **V18 — Multiversal Economy:** markets, inventory, crafting, contracts, auctions, and artifact evolution.
- **V19 — Party Consequences:** relationships, morale, wounds, betrayal, defection, mentorship, and party endings.
- **V20 — Relic Bonds & Equipment Mastery:** mastery, signature gear, sets, relic bonds/corruption, quests, and theft/recovery.
- **V21 — Faction Campaigns & Strongholds:** membership, campaigns, territory, bases, diplomacy, infiltration, and sieges.
- **V22 — Settlements & Civilian Worlds:** populations, displacement, relief, rebuilding, sanctuaries, and public opinion.
- **V23 — Tactical Missions & Warfront Operations:** persistent multi-stage operations sourced from the existing world state.
- **V24 — Multiverse Activities & Competition Circuits:** races, tournaments, trials, hunts, and hosted events.
- **V25 — Cataclysms & Multiverse Crisis Arcs:** persistent macro emergencies and recoverable crisis-command responses.
- **V26 — World Content Expansion:** 376 original world assets, deterministic SVG art, Atlas browsing, and stable context assignment.
- **V27 — World Content Mega-Pack:** +1,536 original assets, 14 new families, pagination/group filters, enriched six-slot context, and project-boundary validation.
- **V28 — Atlas UX & Asset Integration:** persistent Atlas preferences, favorites/discovery modes, sorting, compact browsing, asset inspection, related assets, and keyboard-friendly navigation.

`js/bootstrap.js` loads these layers in order. If V28 fails, the game explicitly continues as V27.

## 1,912 original world assets

The combined V27/V28 library spans 25 families including buildings, places, interiors, items, vehicles, NPC roles, strongholds, settlements, activities, crises, icons, props, landmarks, shops, resources, flora, fauna, hazards, transit, furnishings, technology, weapons, armor, food, and utility equipment.

World content is deterministic original SVG project art rendered locally. It does not hotlink remote media and it is not presented as exact franchise character/form imagery.

Exact character and transformation images remain separate and review-first.

## V28 Atlas UX

Open **World → Atlas**. V28 adds:

- persistent search, family/group, rarity, page, and view preferences
- sorting by name, family, rarity, or release generation
- Favorites-only mode using existing V26 favorites
- Seen-only mode using existing V27 discoveries
- grid and compact layouts
- `/` keyboard shortcut to focus Atlas search
- responsive browsing for desktop and smaller screens
- clear/reset filtering

## Asset inspector

Use **Details** on an Atlas card to inspect it without changing the established V27 card/favorite interaction. Contextual world-art cards in worlds, strongholds, settlements, operations, activities, and crises remain directly clickable for inspection.

The inspector shows family, rarity, subtype, theme/world, faction context, intended usage targets, tags, provenance notes, and related assets. Inspection feeds the existing V27 discovery history; V28 does not create a duplicate content or progression system.

## Stable gameplay authority

V28 adds no wallet, currency, inventory, crafting system, combat engine, faction engine, settlement engine, operation engine, activity engine, or crisis engine. V16–V27 remain authoritative.

Schema 28 owns only Atlas UI preferences, inspector selection, and UX statistics.

## Project-boundary protection

`tools/validate-spinner-boundaries.js` remains part of normal validation and guards against the SERA/backend-RLS contamination signatures identified during the project audit.

## Validation

```powershell
npm run validate:boundaries
npm run validate:v28
npm run validate
npm run test:e2e
npm run validate:release
```

V28 validation covers persistent UI state, favorites/discovery reuse, deterministic sorting, inspection, related-asset resolution, no duplicate economy state, responsive styling, fallback-safe bootstrap wiring, PWA caching, and Chromium browser journeys.

See `docs/V28_ATLAS_UX_ASSET_INTEGRATION.md` for the detailed V28 release contract and `docs/V27_WORLD_CONTENT_MEGAPACK.md` for the 1,912-asset catalog release.
