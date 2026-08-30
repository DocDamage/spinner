# Multiverse Wheel V31 — Dynamic Scene Staging

A local-first browser/PWA game about forging a custom hero through a persistent multiverse built around a seeded event Wheel. The runtime roster contains **1,326 character profiles**, and the world-content library contains **6,616 rights-safe visuals across 40 asset families**.

V31 builds on V30 Massive World Expansion by staging context-aware world art inside ordinary Wheel results. Each live scene draws from the complete V30 catalog, avoids recent repetition, supports visual-only remix and history, and opens into the existing Atlas inspector without changing combat, rewards, choices, economy, party, relic, faction, settlement, operation, activity, or crisis authority.

Play the current published release at [docdamage.github.io/spinner](https://docdamage.github.io/spinner/). V31 is under development until its pull-request validation is green and merged.

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
- **V28 — Atlas UX & Asset Integration:** persistent Atlas preferences, favorites/discovery modes, sorting, compact browsing, inspection, related assets, and keyboard-friendly navigation.
- **V30 — Massive World Expansion:** +4,704 original assets, 15 new families, 6,616 total world assets, eight-slot context enrichment, deterministic field encounters, travel plans, and V30-aware Atlas tools.
- **V31 — Dynamic Scene Staging:** context-aware live Wheel scenes, recent-repeat avoidance, visual-only remix, bounded history, V30 discovery integration, and V29 prototype migration.

`js/bootstrap.js` loads the release layers in order. V31 is intentionally layered on V30; if V31 fails to load, the application explicitly continues with V30 Massive World Expansion.

## Dynamic scenes during Wheel play

Eligible Wheel results stage a default four-card composition for the environment, focal detail, support, and scene detail. Selection is deterministic from the save seed, spin, event identity, universe, destination, faction, event text, and visual variation. V30 assets are preferred and staged discoveries use the existing V30 discovery history.

Players can hide scenes, reopen them later, inspect every asset, browse bounded scene history, or remix the current visual composition. Remix does not reroll the pending event or modify any gameplay outcome. Compatible settings and history from the unmerged V29 prototype are imported once when an older save contains them.

## 6,616 original world assets

The combined V30 library spans **40 families**. Existing families remain available for buildings, places, interiors, items, vehicles, NPC roles, strongholds, settlements, activities, crises, icons, props, landmarks, shops, resources, flora, fauna, hazards, transit, furnishings, technology, weapons, armor, food, and utility equipment.

V30 adds 15 new families:

- districts
- dungeons
- ruins
- portals
- routes
- weather
- anomalies
- organizations
- companions
- mounts
- relics / McGuffin opportunities
- treasure
- services
- venues
- encounters

World content is deterministic original SVG project art rendered locally. It does not hotlink remote media and it is not presented as exact franchise character or transformation imagery.

Exact character and transformation images remain a separate review-first pipeline. V30 does not silently replace missing franchise imagery with generated fallback character art.

## Deterministic field encounters

`WorldExpansionEngine` can compose a six-role encounter from the world-content catalog without introducing a second combat or reward system:

1. **Scene** — the location or environmental stage.
2. **Actor** — NPC, companion, organization, creature, or encounter presence.
3. **Mobility** — vehicle, mount, route, portal, or transit context.
4. **Pressure** — hazard, anomaly, weather, or crisis pressure.
5. **Reward** — treasure, relic, resource, item, weapon, armor, or technology opportunity.
6. **Support** — service, venue, shop, utility, food, NPC, or companion support.

The same save seed, owner context, difficulty, and salt produce the same encounter. Recorded scouting remains bounded and does not create a new wallet, inventory, party, or progression authority.

## Travel plans

V30 can also assemble deterministic travel context from:

- routes, portals, or transit infrastructure
- vehicles or mounts
- weather, hazards, or anomalies
- intermediate stops such as districts, places, landmarks, venues, ruins, or dungeons
- a destination-linked field encounter

These plans enrich the existing V17 travel/reality layer rather than replacing it.

## Atlas and world UX

Open **World → Atlas**. V30 preserves V28's persistent browsing tools and adds:

- a **V30 only** filter
- `NEW V30` asset badges
- all 40 families in V30-aware browsing groups
- V30-aware related-asset inspection
- eight stable contextual visuals for world entities
- a field-encounter preview with **Scout Next**
- responsive/mobile layout rules
- reduced-motion behavior

Existing favorites continue to use V26 state and discovery history continues to use V27 state.

## Stable gameplay authority

V30 does **not** introduce replacement systems for:

- V13+ combat and hero progression
- V17 travel/reality state
- V18 economy, markets, crafting, or inventory
- V19 party and relationship state
- V20 relic ownership, bonding, corruption, or equipment mastery
- V21 factions and strongholds
- V22 settlements and civilian simulation
- V23 operations
- V24 activities and competition circuits
- V25 crises

V30 owns world-content enrichment, field-encounter/travel composition metadata, recent scouting state, and its associated presentation statistics. A relic-shaped V30 reward is an opportunity that existing V18/V20 systems may resolve; it is not a duplicate relic inventory.

## Project-boundary protection

`tools/validate-spinner-boundaries.js` remains part of normal validation and guards against foreign-project/backend contamination. Spinner database/runtime boundaries remain distinct from unrelated projects.

## Validation

```powershell
npm run validate:boundaries
npm run validate:v30
npm run validate
npm run test:e2e
npm run validate:release
```

V30 validation checks:

- exact 1,912 + 4,704 = 6,616 asset counts
- 40 combined families and 15 new families
- unique IDs and generated-project-art provenance
- dedicated SVG renderers for the new families
- V27/V28 save compatibility and idempotent migration
- stable legacy context prefixes plus V30 enrichment
- deterministic six-role field encounters
- deterministic travel plans
- no duplicate economy, inventory, or party state
- bootstrap fallback ordering
- PWA/service-worker caching and release branding
- normal unit/content validation and Chromium release journeys

See [`docs/V30_MASSIVE_WORLD_EXPANSION.md`](docs/V30_MASSIVE_WORLD_EXPANSION.md) for the full V30 release contract. Earlier release contracts remain in `docs/` for historical and compatibility details.
