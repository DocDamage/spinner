# V32 — Cinematic Encounter Director

## Release objective

V32 turns V31 Dynamic Scene Staging into a deterministic multi-beat encounter director. The release will make Spinner's 6,616 world assets participate more deeply in actual play by presenting coherent visual storyboards for the systems players already use.

The director is a presentation and recall layer. It must not create replacement combat, travel, party, inventory, economy, faction, settlement, operation, activity, tournament, crisis, reward, or progression authority.

## Player promise

When an important event occurs, Spinner should show where it begins, what pressure changes the situation, and how the outcome leaves the world. The resulting sequence must be understandable at a glance, replayable later, accessible without motion, stable across reloads, and distinct enough that universes, factions, biomes, and event families feel intentional.

## In scope

### 1. Three-beat cinematic storyboards

Eligible events receive three deterministic beats:

1. **Arrival** — establishes environment, route, venue, or destination.
2. **Pressure** — introduces the actor, hazard, faction, rival, crisis, or objective.
3. **Aftermath** — reflects the resolved result, reward opportunity, recovery, or persistent world consequence.

Each beat stages a bounded composition from the existing V30 catalog. A storyboard must avoid duplicate asset IDs inside the sequence and recent repetition across sequences when compatible alternatives exist.

### 2. Existing-system integration

The director will support explicit profiles for:

- ordinary Wheel results
- origin and recruitment events
- travel and route arrival
- battle opening, boss pressure, victory, defeat, and recovery
- power, training, transformation, artifact, and rare events
- faction campaigns and stronghold events
- settlement relief and rebuilding
- tactical operations
- activities, races, and tournaments
- multiverse crisis phases

Integration reads authoritative V13–V31 state and writes only V32 presentation metadata.

### 3. Context identity

Selection will incorporate the save seed plus the real event, universe, destination, biome, faction, operation, activity, crisis, and result context that already exists. Rules should favor assets whose family, tags, rarity, and usage targets fit the current beat.

Faction and biome identity must come from catalog metadata and deterministic presentation tokens. V32 must not invent a second faction or world model.

### 4. Cinematic Chronicle

Completed storyboards enter a bounded local Chronicle containing only the event reference, context summary, beat descriptors, staged asset IDs, visual variation, and completion time or sequence index needed for replay.

Players can:

- replay a storyboard without rerolling gameplay
- bookmark meaningful sequences
- filter by universe and event family
- inspect staged assets in the existing Atlas
- remove an individual Chronicle entry
- clear visual history without deleting campaign progress

Chronicle storage must remain bounded and migration-safe.

### 5. Accessibility and performance

- Every beat has a concise generated caption assembled from trusted local metadata.
- Storyboard controls are keyboard reachable and screen-reader labeled.
- Reduced-motion mode uses instant beat changes and no essential information is motion-only.
- Mobile layouts preserve readable captions and touch targets without dense ambience.
- A low-effects mode avoids expensive transitions while keeping all content available.
- Composition and replay must work offline from the PWA cache.

### 6. Player controls

Players can pause automatic beat advancement, move backward or forward, hide the director, replay the current sequence, and request a visual-only remix. Remix changes presentation variation only; it cannot change the event, result, reward, opponent, route, or persistent world consequence.

## State boundary

V32 may own:

- director preferences
- the bounded visual Chronicle
- storyboard asset references and captions
- visual variation counters
- bookmarks and presentation-only filters

V32 may not own:

- health, energy, combat results, or enemy state
- currencies, inventory, items, equipment, relic ownership, or rewards
- party members, relationships, wounds, or loyalty
- faction membership, territory, strongholds, settlements, operations, activities, or crises
- travel location, progression, unlocks, achievements, or discovery authority

Staged assets continue to use the existing V30 discovery history. Atlas favorites continue to use V26 state.

## Migration and compatibility

- Migration is idempotent and preserves all V13–V31 state.
- Existing V31 preferences and scene history seed compatible V32 settings once.
- Invalid or missing V32 state falls back to normalized defaults.
- If the V32 experience fails to load, bootstrap explicitly continues with V31 Dynamic Scene Staging.
- Historical validators must remain forward compatible with later catalog growth.

## Validation contract

V32 is complete only when automated coverage proves:

1. migration is idempotent and preserves V31 state
2. the same seed and context produce the same storyboard
3. arrival, pressure, and aftermath use unique compatible assets
4. every supported event family selects a valid profile
5. no V32 action changes authoritative gameplay state
6. replay and remix cannot reroll or duplicate rewards
7. Chronicle history, bookmarks, filters, and variation are bounded
8. staged assets update existing V30 discovery state only
9. captions are escaped, meaningful, and available without animation
10. reduced-motion, keyboard, mobile, reload, offline, and PWA-upgrade journeys pass
11. browser console and page-error checks stay clean
12. every historical unit, content, and Chromium journey remains green

## Delivery slices

1. **Domain contract** — migration, profiles, deterministic three-beat composition, state boundaries, and unit tests.
2. **Wheel and battle integration** — first complete runtime storyboards and accessible controls.
3. **World-system integration** — travel, factions, settlements, operations, activities, tournaments, and crises.
4. **Chronicle** — bounded replay, bookmarks, filters, Atlas inspection, and deletion controls.
5. **Release hardening** — mobile, reduced motion, low effects, offline/PWA upgrades, full Chromium regression, documentation, and release metadata.

V32 implementation should proceed test-first through these slices rather than landing one unreviewable presentation rewrite.
