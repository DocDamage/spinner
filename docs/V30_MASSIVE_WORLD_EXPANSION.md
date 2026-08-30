# V30 Massive World Expansion

V30 turns the V26–V28 World Atlas from a large visual library into a much broader world-building layer that can continuously feed existing Spinner systems without creating a parallel economy, combat model, or progression track.

## Release goals

- Increase the world library from **1,912** to **6,616** original project assets.
- Add **4,704** V30 assets while preserving all V26/V27 records and IDs.
- Expand from **25** to **40** asset families.
- Add hundreds of new buildings, places, items, vehicles, NPC roles, strongholds, settlements, activities, crises, weapons, armor, technology assets, and food assets.
- Add 15 entirely new world families: districts, dungeons, ruins, portals, routes, weather, anomalies, organizations, companions, mounts, relics/McGuffins, treasure, services, venues, and encounters.
- Keep existing saves, favorites, Atlas preferences, and V26/V27 context assignments usable.
- Wire new content into world, travel, shop, stronghold, settlement, operation, activity, crisis, faction, inventory, and party contexts.
- Add deterministic field encounters and travel-plan composition so content appears in play instead of existing only as static Atlas data.

## Content totals

V27 provides the preserved 1,912-asset base. V30 adds 4,704 records generated from 16 distinct visual/world themes and 28 expanded content families. Combined total: **6,616**.

The V30 themes are Arcology, Verdant, Obsidian, Celestial, Rustbelt, Abyssal, Solar, Lunar, Tidal, Volcanic, Frostbound, Dreamglass, Chronal, Neon, Mythic, and Wasteland. Each generated asset has a stable ID, release number, rarity, usage targets, tags, source/provenance metadata, visual seed, and generated-project-art path.

## New world families

### Districts
Market wards, foundry quarters, garden rings, old cities, arena rows, harbor wards, scholar districts, night markets, embassy miles, and outer rims give settlements and worlds neighborhood-scale identity.

### Dungeons and ruins
Vault labyrinths, forgotten temples, prison complexes, crystal mines, sunken facilities, monster nests, reality mazes, ancient catacombs, war bunkers, sky dungeons, fallen palaces, broken spaceports, collapsed towers, lost shrines, derelict factories, buried cities, and wrecked flagships give operations and exploration stronger locations.

### Portals and routes
World gates, hidden rifts, transit arches, quantum tunnels, time apertures, trade roads, sky lanes, portal corridors, ocean crossings, underground lines, convoy trails, race circuits, and smuggler routes make travel composition explicit.

### Weather and anomalies
Ion storms, meteor showers, acid rain, aurora surges, dust cyclones, solar flares, whiteouts, dream fog, time echoes, reality scars, gravity wells, memory zones, probability fields, and duplicate cities can appear as contextual pressure.

### Organizations
Explorer guilds, rescue corps, merchant leagues, ranger orders, arena syndicates, scholar assemblies, courier networks, monster wardens, free captains, and relic societies provide reusable faction-adjacent actors without replacing V21's authoritative faction state.

### Companions and mounts
Scout hounds, pocket automatons, spirit foxes, rescue drones, mechanical steeds, sky drakes, moon stags, glider mantas, siege walkers, and other travel/party visuals can enrich party, activity, and travel contexts without silently modifying the authoritative party roster.

### Relics and treasure
World Keys, Chronicle Shards, Reality Needles, Gatekeeper Coins, ancient caches, royal hoards, meteor chests, explorer finds, and other rare objects create explicit McGuffin and reward opportunities. They are presentation/context assets; V30 does not invent duplicate currency or inventory state.

### Services and venues
Repair garages, medical stations, courier desks, portal customs, training schools, vehicle rentals, recovery lodges, arenas, street circuits, festival plazas, raceways, hunt preserves, and championship domes make settlements and activities more concrete.

### Encounters
Roadside ambushes, lost travelers, caravans, monster packs, rival crews, distress signals, treasure guardians, portal accidents, weather rescues, and faction patrols provide encounter-specific visuals and tags.

## Runtime architecture

`js/data/world-content-v30.js` builds the combined catalog and V30 metadata.

`js/world-asset-art-v30.js` adds dedicated procedural SVG scene renderers for every new V30 family. Existing families continue through the V27 art renderer with V30 release branding. No remote image is required for V30 world art.

`js/domain/v30-engine.js` provides `WorldExpansionEngine`.

The engine:

- indexes all 6,616 assets;
- queries by family, group, rarity, tags, usage target, release, and search terms;
- favors V30 assets while preserving stable older assignments;
- preserves V27 context asset IDs as the prefix of upgraded V30 contexts;
- enriches contexts to up to 12 slots;
- synchronizes current world, strongholds, settlements, operations, activities, and crises;
- generates deterministic encounter packages;
- generates deterministic travel plans;
- tracks V30 discoveries and a bounded encounter log;
- does not add wallet, currency, or duplicate inventory state.

## Field encounter composition

Each field encounter can contain six independently selected roles:

1. **Scene** — venue, place, district, dungeon, ruin, or building.
2. **Actor** — NPC, organization, companion, or fauna.
3. **Mobility** — vehicle, mount, route, portal, or transit.
4. **Pressure** — weather, anomaly, hazard, crisis, or encounter event.
5. **Reward** — treasure, relic, item, technology, resource, weapon, or armor.
6. **Support** — service, food, companion, or utility asset.

The combination is seeded by the run seed, context, current spin, and scout nonce. Reopening the same context does not consume uncontrolled randomness. `Scout Next` advances the encounter intentionally and records it in the bounded V30 encounter log.

A reward whose family is `relic` is flagged as a McGuffin opportunity. V30 deliberately does not auto-grant the object because V18/V20 remain authoritative for economy, inventory, relic ownership, and mastery.

## Travel plan composition

The travel-plan helper selects:

- a route, portal, or transit link;
- a vehicle or mount;
- weather, anomaly, or hazard conditions;
- a service/place/district stop;
- an encounter/NPC/organization contact.

This is available to future wheel/event integration without creating a second travel simulator.

## Atlas and UI integration

V30 keeps the V28 Atlas workflow and extends it:

- all 6,616 assets are searchable;
- all 40 families can be filtered;
- expanded family groups cover structures, world, travel, gear, people, adventure, and UI;
- `V30 only` isolates the new 4,704 assets;
- favorites and discovery views continue to work;
- sort by newest correctly prioritizes release 30;
- V30 assets receive a visible `NEW V30` badge;
- the asset inspector understands V30 assets and related content;
- non-Atlas world tabs receive eight stable context visuals;
- field encounter cards appear under context art and can be intentionally rerolled with `Scout Next`.

## Save compatibility

V30 is additive. It creates `state.v30` and does not rewrite V26, V27, or V28 state. Existing V27 context assignments are used as a stable prefix for V30 context assignments wherever possible. Existing V26 favorites continue to point to the same asset IDs and may also contain V30 IDs because the authoritative global world catalog is upgraded after V30 loads.

`state.schemaVersion` is advanced to 30 while older subsystem version fields remain intact.

## Performance and accessibility

- Atlas pagination remains controlled by V28 page-size preferences.
- Images are deterministic SVG data URIs generated only for visible/context cards.
- Context strips use eight assets rather than rendering the full catalog.
- Encounter panels render a maximum of six role cards.
- Mobile layouts collapse to one-column encounter/context cards.
- Reduced-motion users receive no added animation requirement.
- All V30 visual cards use existing keyboard-accessible inspector controls or buttons.

## Validation contract

`tools/validate-v30-content.js` checks:

- exact catalog totals: 1,912 + 4,704 = 6,616;
- exactly 40 combined families and 15 new families;
- unique asset IDs;
- complete generated-project-art provenance;
- minimum content depth for every V30-expanded family;
- dedicated rendering for all 15 new families;
- V27 context-prefix preservation;
- deterministic encounter generation;
- encounter record/stat behavior;
- deterministic travel composition;
- absence of duplicate economy/inventory state;
- bootstrap load order and V28 fallback;
- service-worker caching;
- release branding and version alignment.

## Explicit non-goals

V30 does **not** replace character or transformation imagery with fallback art. Character/form imagery remains on the existing review-first real-image pipeline. It also does not duplicate V18 economy, V19 party consequences, V20 relic ownership/mastery, V21 factions/strongholds, V22 settlements, V23 operations, V24 activities, or V25 crisis simulation. V30 supplies those systems with a much larger, deterministic world-content layer.
