# V31 Dynamic Scene Staging

V31 brings V30's 6,616 original world assets into ordinary Wheel play. Every eligible result can stage a coherent visual scene without creating a second combat, reward, economy, party, relic, faction, settlement, operation, activity, or crisis system.

## Release goals

- Compose a context-aware live scene for ordinary Wheel events.
- Use the complete V30 catalog and prefer V30 assets while retaining stable legacy IDs.
- Support origin, battle, boss, power, transformation, training, recruit, artifact, recovery, hazard, rare-event, and default profiles.
- Avoid recent visual repetition and keep bounded scene history.
- Let players remix only the visual composition for the current event.
- Reuse V30/V27 discovery state and the existing V30-aware V28 inspector.
- Import settings and history from the unmerged V29 prototype when present.
- Remain responsive, keyboard operable, reduced-motion safe, local-first, and offline-capable.

## Scene composition

`DynamicSceneEngine` selects three to six assets, with four by default. Each event profile defines four visual roles:

1. environment;
2. focal detail;
3. support;
4. scene detail.

Selection uses the save seed, current spin, event identity, universe, destination, faction, event text, usage targets, and a visual variation counter. The same event and variation produce the same composition. Recent scene assets are excluded when possible and the engine falls back only when exclusions would leave a role empty.

V31 delegates catalog search and scoring to V30's `WorldExpansionEngine`. Staged V30 assets are recorded through `state.v30.discoveries`; legacy assets use V27 discovery state. V31 has no discovery store of its own.

## Visual-only remix

Remix Scene increments the current event's visual variation and composes another scene. It does not change the pending event, battle odds, rewards, choices, inventory, currency, progression, relationships, relic ownership, world simulation, or any other gameplay authority.

Original and remixed scenes remain in bounded history. History cards open the existing asset inspector.

## Save compatibility

V31 adds `state.v31` with only:

- scene settings;
- current composition;
- bounded history;
- per-event remix counters;
- presentation statistics.

When an older save contains the experimental `state.v29` scene layer but no V31 state, V31 imports its compatible settings, current scene, history, counters, and statistics once. V30 and all earlier authoritative subsystem state remain unchanged.

## Fallback

V31 loads after V30. If the V31 engine or experience layer fails, bootstrap logs the failure and continues with V30 Massive World Expansion.

## Validation contract

V31 validation covers:

- idempotent migration and V29 preference import;
- preservation of V30 state;
- unique, deterministic, context-aware composition;
- V30 catalog and discovery integration;
- recent-repeat avoidance;
- visual-only remix behavior;
- bounded settings and history;
- responsive and reduced-motion styling;
- bootstrap fallback and service-worker caching;
- package, manifest, launch-page, and runtime release alignment;
- Chromium journeys for staging, remix, inspection, history, persistence, and legacy event controls.
