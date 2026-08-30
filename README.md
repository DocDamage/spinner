# Multiverse Wheel V29 — Dynamic Scene Staging

A local-first browser/PWA game about forging a custom hero through a persistent multiverse built around a seeded event Wheel. The runtime roster contains 1,326 character profiles.

V29 keeps V27's **1,912 rights-safe original world visuals across 25 asset families**, V28's inspectable Atlas, and now stages that library directly into ordinary Wheel results so battles, hazards, discoveries, training, recruits, artifacts, transformations, and rare events feel like events happening in actual places.

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
- **V29 — Dynamic Scene Staging:** context-aware live Wheel scenes, repeat avoidance, persistent scene history, visual-only remixes, and direct V28 inspection.

`js/bootstrap.js` loads these layers in order. If V29 fails, the game explicitly continues as V28.

## 1,912 original world assets

The combined V27–V29 library spans 25 families including buildings, places, interiors, items, vehicles, NPC roles, strongholds, settlements, activities, crises, icons, props, landmarks, shops, resources, flora, fauna, hazards, transit, furnishings, technology, weapons, armor, food, and utility equipment.

World content is deterministic original SVG project art rendered locally. It does not hotlink remote media and it is not presented as exact franchise character/form imagery.

Exact character and transformation images remain separate and review-first.

## V29 Dynamic Scene Staging

Every ordinary Wheel result can now receive a coherent visual composition from the existing world library. V29 uses the event type plus current universe, destination, faction context, tags, usage targets, and event text to choose appropriate scene pieces.

Default scenes contain four visual roles:

- **Environment** — the primary place, interior, building, landmark, stronghold, settlement, or crisis space.
- **Focal detail** — a vehicle, hazard, technology element, shop, NPC role, flora/fauna element, or other event-specific focus.
- **Support** — gear, resources, furnishings, utilities, transit, food, or environmental support appropriate to the event.
- **Scene detail** — props, NPC roles, secondary transit, resources, or other finishing context.

Scene size is bounded to 3–6 assets and defaults to four.

### Context-specific staging

Examples include:

- battles drawing from operation locations, hazards, vehicles, weapons, armor, utilities, NPC roles, and props
- bosses drawing from crisis-scale landmarks, strongholds, hazards, response technology, weapons, armor, and resources
- artifact results drawing from shops/interiors plus items, technology, weapons, resources, furnishings, and NPC roles
- training drawing from activity venues, interiors, furnishings, technology, food/resources, and mentors/support roles
- hazards drawing from crisis environments, hazards, vehicles/transit, response utilities, armor, resources, landmarks, and NPC roles
- origins and rare events using broader world, landmark, flora/fauna, transit, shop, prop, resource, and technology pools

## Repeat avoidance and scene history

V29 remembers recent staged scenes and first tries to avoid reusing assets shown in the previous 12 scene records. If an exclusion would leave a required visual role empty, the composer safely falls back to the wider matching pool instead of producing a broken scene.

The game retains up to 24 recent scenes by default. Open **History** from the live-scene strip to revisit them and inspect their component assets.

## Visual-only scene remix

**Remix scene** changes only the staged visual composition for the current event. It does not reroll or mutate:

- the pending encounter or event identity
- battle odds or opponent state
- rewards or choices
- currencies, inventory, crafting, or equipment
- factions, settlements, operations, activities, or crises
- party, relic, or world simulation state

The original scene and remixed variants remain available in scene history.

## Discovery and asset inspection

Showing an asset in a live scene records it through the existing V27 discovery history because the player has actually seen it. V29 does not create a second discovery database.

Click any staged asset to open the existing V28 inspector with its family, rarity, subtype, theme, faction context, usage targets, tags, provenance notes, and related assets.

Use **Hide** on a live scene if you prefer the older compact event presentation. The Show/Hide preference persists, and toggling visibility does not remix the existing scene.

## Stable gameplay authority

V29 owns only scene composition, scene history, remix counters, scene visibility/settings, and visual UX statistics. It adds no wallet, currency, inventory, crafting system, combat engine, faction engine, settlement engine, operation engine, activity engine, crisis engine, or replacement discovery system.

V16–V28 remain authoritative for gameplay and world state.

## V28 Atlas UX

Open **World → Atlas** for persistent search, family/group and rarity filters, sorting, Favorites-only and Seen-only modes, grid/compact layouts, `/` search focus, pagination, and detailed asset inspection.

## Project-boundary protection

`tools/validate-spinner-boundaries.js` remains part of normal validation and guards against the SERA/backend-RLS contamination signatures identified during the project audit.

## Validation

```powershell
npm run validate:boundaries
npm run validate:v29
npm run validate
npm run test:e2e
npm run validate:release
```

V29 validation covers schema ownership, idempotent migration, unique context-aware composition, V27 discovery reuse, visual-only remixing, repeat avoidance, bounded history, responsive styling, V28 inspection integration, fallback-safe bootstrap wiring, PWA caching, package/version alignment, and Chromium browser journeys.

See `docs/V29_DYNAMIC_SCENE_STAGING.md` for the V29 release contract, `docs/V28_ATLAS_UX_ASSET_INTEGRATION.md` for Atlas UX, and `docs/V27_WORLD_CONTENT_MEGAPACK.md` for the 1,912-asset catalog release.
