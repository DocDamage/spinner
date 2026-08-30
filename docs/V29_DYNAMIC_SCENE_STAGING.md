# Spinner V29 — Dynamic Scene Staging

V29 makes the 1,912-asset world library visible during ordinary Wheel play. V27 remains the authoritative asset catalog and discovery store; V28 remains the authoritative Atlas/inspector UX. V29 composes those assets into context-aware visual scenes for live Wheel results without creating another gameplay simulation.

## Goals

- stage world assets directly on Wheel results instead of keeping them mostly inside the Atlas
- make battle, boss, power, transformation, training, recruit, artifact, recovery, hazard, rare-event, and origin results visually distinct
- avoid obvious asset repetition across recent scenes
- keep compositions deterministic for the same save/event/variation
- allow harmless scene remixing without rerolling encounters, rewards, odds, factions, economy, or consequences
- preserve scene history so previously shown locations, vehicles, gear, NPC roles, props, hazards, and environmental details can be revisited
- open every staged asset through the existing V28 inspector

## Schema 29 ownership

`state.v29` owns only visual scene state:

- `settings.enabled`
- `settings.slots`
- `settings.avoidRepeat`
- `settings.historyLimit`
- `current`
- `history`
- `remixByEvent`
- visual UX statistics (`scenesComposed`, `sceneRemixes`, `assetsStaged`, `historyViews`)

V29 does **not** own or duplicate wallet, currency, inventory, combat, factions, settlements, operations, activities, crises, rewards, party state, equipment, relics, or world simulation.

## Context-aware scene profiles

Each Wheel result type maps to an existing gameplay context and a set of visual roles. Examples:

- **Battle:** operation location/interior, hazard or vehicle, weapon/armor/utility, support prop/NPC/transit
- **Boss:** crisis-scale location/landmark/stronghold, hazard/technology, weapon/armor, response detail
- **Artifact:** shop/interior, item/technology/weapon, resource/utility/armor, furnishing/prop/NPC
- **Training:** place/interior/activity venue, furnishings/technology, NPC/food/resource, supporting prop/transit
- **Hazard:** hazard/place/crisis environment, vehicle/transit/technology, utility/resource/armor, NPC/prop/landmark
- **Origin/Rare:** broader world, landmark, flora/fauna, transit, shop, prop, resource, and technology staging

The composer uses the current universe, current destination when available, faction context when available, event label/subtitle, existing V27 usage targets, tags, and deterministic scoring.

## Repeat avoidance

The most recent staged scenes contribute an exclusion window. V29 first tries to build the new scene without those recently displayed assets. If a role becomes impossible because the exclusion set is too restrictive, that role can fall back to the full matching family instead of leaving the scene empty.

Defaults:

- 4 assets per scene
- avoid assets from the previous 12 scene records
- retain 24 scene records

Bounds keep the system safe on old saves and future UI changes.

## Scene remix

**Remix scene** increments only a visual variation counter tied to the current event key. The pending event, encounter identity, battle odds, rewards, choices, and all existing system state stay unchanged.

Remixes are kept in scene history so the player can inspect both the original composition and later visual variations.

## Discovery and inspection

A staged asset is genuinely visible to the player, so V29 records it through the existing V27 discovery list. It does not create a second discovery database.

Every staged thumbnail and every scene-history thumbnail uses the existing V28 inspector. The V28 inspector remains responsible for metadata, tags, usage targets, provenance, related assets, and inspection statistics.

## Browser UX

The live event panel gains a compact **V29 • LIVE SCENE** strip before the normal event controls. The strip includes:

- environment/focal/support/detail cards
- asset name and family
- click-to-inspect behavior
- **Remix scene**
- **History**
- persistent **Hide / Show scenes** preference

The history dialog shows the most recent staged Wheel scenes and their component assets. Desktop uses a four-card strip; narrow screens collapse to two columns. Reduced-motion users do not receive image zoom motion.

## Fallback behavior

`js/bootstrap.js` loads V29 only after V28 has loaded successfully. If the V29 engine, CSS, or experience layer fails, Spinner explicitly continues as **V28 Atlas UX & Asset Integration**.

## Validation

Run:

```powershell
npm run validate:boundaries
npm run validate:v29
npm run validate
npm run test:e2e
npm run validate:release
```

V29 validation covers schema ownership, idempotent migration, unique scene composition, context mapping, discovery reuse, visual-only remixing, repeat avoidance, history bounds, responsive styling, bootstrap fallback, PWA caching, package metadata, and Chromium journeys.

Chromium journeys verify that a real Wheel result receives staged art, remixes do not alter the pending encounter, scene assets open V28 inspection, history retains original/remixed scenes, scene visibility persists across reload, and legacy event controls remain usable.

## Primary files

- `js/domain/v29-engine.js`
- `js/v29-experience.js`
- `styles/v29.css`
- `tests/v29.test.js`
- `tests/e2e/v29.spec.js`
- `tools/validate-v29-content.js`

Release wiring also updates `js/bootstrap.js`, `sw.js`, `package.json`, `package-lock.json`, `manifest.webmanifest`, `index.html`, `README.md`, and V28 forward-compatible release validation.
