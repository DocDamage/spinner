# Multiverse Wheel V13 — Director's Cut

## Product goal

Turn the existing content-rich simulator into a focused, replayable game whose
first decision is obvious, whose random wheel still gives the player agency,
whose characters and universes feel distinct, and whose ending reflects the
run that produced it.

V13 is additive and save-compatible. Existing V6–V12 saves are migrated when
loaded. Existing systems—custom origins, tactical combat, stage arcs, rivals,
quests, collection progress, activities, side modes, achievements, Hall of
Fame, New Game+, accessibility preferences, and portable backups—remain
available unless an acceptance criterion explicitly replaces their surface.

## Release principles

1. One primary action is visually dominant at every step.
2. Advanced information remains available without occupying the primary play
   surface.
3. Randomness creates variety; Fate creates bounded player agency.
4. Character identity is mechanical, not only descriptive.
5. Earlier choices return as later consequences.
6. Permanent meta progression unlocks variety and expression rather than raw
   mandatory power.
7. A seeded run remains deterministic when the same choices are repeated.
8. Keyboard, touch, reduced-motion, high-contrast, large-text, color-blind,
   screen-reader, and sound-volume paths are first-class.

## Workstreams and acceptance criteria

### 1. Front door and progressive onboarding

- A dedicated title surface appears before the gameplay dashboard.
- It offers Continue, New Timeline, Daily Challenge, Archive, and Settings.
- New Timeline uses a three-step flow: hero, rules, confirmation.
- Quick-start presets remain available; full custom creation is still
  reversible.
- Challenge and balance modes move out of the always-visible header.
- Starting a run closes the title surface and focuses the primary play action.
- Returning players may bypass onboarding without losing its help content.

### 2. Condensed play surface

- The default Play view centers the wheel, objective, active event, and a
  compact build/resource rail.
- Hero, party, conditions, library, chronicle, route, and collection details
  are available in labeled drawers or existing dedicated tabs.
- Empty secondary panels do not create large blank regions.
- Desktop, tablet, and 390 px mobile layouts have no horizontal overflow.
- A screen-reader-accessible wheel manifest lists the current slices and the
  landed result.

### 3. Fate and wheel agency

- Every run has a capped Fate resource with documented earn/spend rules.
- Before spinning, the player may lock one slice, ban one eligible event type,
  or favor one event family.
- After landing, the player may reroll once or nudge to an adjacent slice when
  affordable.
- Boss, scripted story, first-power, and daily challenge integrity cannot be
  bypassed by Fate.
- Fate operations are deterministic and recorded in the run chronicle.

### 4. Canonical roster and character identity

- Universe aliases are grouped under canonical labels while preserving the
  original source label for display/search.
- Collection targeting no longer shows separate entries for aliases such as
  Marvel/Marvel Comics, DC/DC Comics, Naruto variants, or Sonic variants.
- Every runtime character receives a deterministic identity model containing
  a role, passive, ultimate, structured weakness tags, and signature moves.
- Hand-authored profiles win over generated fallbacks.
- Validation reports aliases, duplicate IDs, missing media, and generated
  identity coverage.

### 5. Builds, mastery, and rewards

- Power rewards show current-versus-new changes before the choice is committed.
- Players can save, name, equip, and delete at least three loadout presets.
- Power sources can be pinned and their mastery quest surfaced in the HUD.
- Mastery levels 2 and 4 offer mutually exclusive deterministic branches.
- Build identity, synergies, conflicts, capacity, counters, and structured
  weaknesses are visible in Build Lab and reward comparisons.
- Equipment changes provide a short local undo opportunity.

### 6. Combat and bosses

- Low-threat non-boss encounters offer deterministic Quick Resolve with an
  explicit reward/risk preview.
- Manual combat supports a party assist meter and a spendable combo action.
- Weakness/exploit windows are visible and mechanically meaningful.
- Boss phases expose a named rule, phase transition, and counterplay.
- Higher difficulty changes intent/action selection as well as numeric scale.
- Victory and defeat produce an after-action report containing damage, healing,
  counters, assists, criticals, resources, and pivotal actions.
- Existing tactical advice, focus mode, guard, counter, support, tags, forms,
  cooldowns, and status effects continue to work.

### 7. Relationships, rivals, and universe stories

- Allies gain visible loyalty from relevant actions and unlock assists at
  defined thresholds.
- Low loyalty can produce refusal or departure; destructive outcomes require a
  clearly telegraphed choice.
- Rival memory includes player strategies and at least one relationship axis.
- A rival arc can end in recruitment, redemption, escape, permanent nemesis,
  sacrifice, or final transformation according to recorded state.
- Major canonical universes receive data-driven event packs with locations,
  factions, dilemmas, hazards, and callbacks.
- A choice callback returns later in the same stage or finale and modifies a
  reward, ally, boss, or ending.

### 8. Endings, recap, and New Game+

- The binary ending expands into multiple named endings derived from alignment,
  protected worlds, relationships, rival state, and major decisions.
- The final screen shows a chronological highlight reel, build identity, MVP
  ally, final rival outcome, objective record, score breakdown, and unlocks.
- A share card can be downloaded as an image and copied as accessible text.
- A compact challenge code contains the seed, starting preset, rules, and
  gameplay modifiers without containing personal information.
- New Game+ asks the player to choose one legacy benefit and one dangerous
  mutator.

### 9. Replay and offline play

- A local-date Daily Challenge uses the same seed and rules for all players on
  that date.
- Daily and seeded runs record local personal bests separately from normal
  runs.
- At least three local save slots are available in addition to portable backup
  import/export.
- The app ships a web manifest and service worker, remains playable after its
  static shell has been cached, and communicates update availability.
- Online leaderboards and cloud saves remain optional integrations; the local
  game never requires an account.

### 10. Architecture, content tooling, and release proof

- New V13 rules live in testable domain modules rather than additional
  unstructured prototype math.
- A single V13 adapter may bridge the domain modules to the legacy game while
  migration proceeds.
- V13 state has an explicit schema version and idempotent migration.
- Content packs have a documented schema and validator.
- Automated tests cover migration, canonical universes, Fate invariants,
  daily/challenge determinism, slots, mastery choices, relationship outcomes,
  endings, and offline asset references.
- Deterministic simulations report completion rate, strategy dominance,
  resource economy, Fate use, and ending distribution.
- Release validation includes complete 30-spin desktop and mobile journeys,
  keyboard-only operation, display preferences, save restoration, and an
  offline reload.

## Delivery sequence

1. Foundation: V13 domain model, migration, canonicalization, slots, Fate,
   challenge codes, and tests.
2. Shell: title screen, setup flow, condensed Play view, drawers, settings, and
   accessible wheel manifest.
3. Run agency: Fate interactions, reward/build comparisons, presets, pins,
   mastery branches, and undo.
4. Combat: Quick Resolve, assist/combo meter, exploit windows, boss rules, and
   after-action reports.
5. Narrative: event packs, loyalty, callbacks, rival outcomes, and endings.
6. Replay: recap/share card, Daily Challenge, expanded New Game+, save slots,
   manifest/service worker, and update UX.
7. Hardening: migration audit, content reports, simulations, full journeys,
   performance/accessibility review, documentation, and release packaging.

## Definition of done

V13 is complete only when every acceptance criterion above has implementation
evidence and automated or inspected verification. A passing legacy validation
suite alone is not sufficient.

## Delivery status

Implemented and release-validated on 2026-08-28. See
[`V13_RELEASE_EVIDENCE.md`](V13_RELEASE_EVIDENCE.md) for the acceptance mapping,
test inventory, content audit, and fixed-seed balance report.
