# Multiverse Wheel V22 — Settlements & Civilian Worlds

V22 adds civilian populations, refugees, rebuilding, sanctuaries, public opinion, local economic pressure, and world recovery to the persistent simulation established in V16–V21.

The Wheel remains the center of play. V22 does not create a separate city-builder, settlement economy, tactical RTS, or second inventory.

## Ownership boundaries

V22 extends the existing release stack instead of shadowing it:

- **V16** remains authoritative for universes, threat, corruption, stability, factions, nemeses, world memory, and world ticks.
- **V17** remains authoritative for destinations, routes, short faction work, Favor, and travel focus.
- **V18** remains authoritative for Credits, Salvage, Cosmic Fragments, markets, equipment, crafting, and the transaction economy.
- **V19** remains authoritative for party relationships and relationship consequences.
- **V20** remains authoritative for relic bonds and equipment mastery.
- **V21** remains authoritative for faction membership, campaigns, territory control, strongholds, facilities, specialists, diplomacy, infiltration, and sieges.
- **V22** stores only civilian settlement, displacement, sanctuary, relief-request, public-opinion, and recovery state in `state.v22`.

## Civilian populations

Every persistent V21 territory receives one deterministic V22 settlement. Migration never rerolls an existing settlement.

Each settlement tracks:

- resident population;
- displaced population;
- food access;
- housing capacity;
- health;
- security;
- prosperity;
- morale;
- infrastructure;
- player public opinion;
- active civilian request;
- recovery history.

Settlement values are bounded. Repeated rendering does not advance them.

## Strategic pressure and displacement

Civilian pressure is derived from existing state:

- V21 contested territory;
- V21 front pressure;
- V21 stronghold sieges;
- V16 world threat;
- V16 world corruption;
- local territory stability and supply.

High pressure can create refugees and degrade security, infrastructure, food, and morale. Low pressure allows slow recovery.

Background simulation is bounded. It cannot silently delete a settlement or reduce a populated settlement below its protected civilian floor. Destructive permanent outcomes require explicit future authored choices rather than passive catch-up.

## Civilian requests through the normal Wheel

Settlements maintain persistent requests derived from their strongest current need:

- Refugee Influx;
- Food Shortage;
- Housing Crisis;
- Medical Emergency;
- Civilian Security;
- Infrastructure Damage;
- Local Economy Shock.

Requests progress from ordinary Wheel outcomes such as Recovery, Travel, Recruit, Training, Battle, Boss, Artifact, Rare, and recognized faction-service results.

A request is therefore context around the existing run rather than a detached quest minigame.

## Relief actions and the V18 wallet

Direct relief actions spend the authoritative V18 resources:

- **Emergency Aid** — food, health, morale, and public opinion;
- **Rebuild District** — infrastructure, housing, prosperity, and morale;
- **Medical Relief** — health and morale;
- **Open Relief Route** — food, security, prosperity, and trade access;
- **Resettle Refugees** — returns displaced residents to a community when capacity exists.

There is no new civilian currency.

Successful relief can also feed V19 Trust, Respect, Friendship, and Resentment through the existing relationship engine.

## Sanctuaries

A safe player-aligned V21 stronghold can open a V22 sanctuary.

The stronghold remains a V21 faction base. The sanctuary adds only civilian state:

- capacity;
- resident refugees;
- safety;
- stockpile;
- morale;
- history.

Sanctuary construction and resupply spend V18 Credits/materials. Refugees transfer into available sanctuaries gradually during world ticks, respecting capacity and stockpile limits.

## Public opinion

Each settlement tracks player public opinion from -100 to 100.

Relief, completed requests, and successful sanctuary work raise opinion. Future faction/campaign choices can use this value without inventing a parallel reputation system.

Faction reputation remains V16-owned.

## Local economies

V22 does not replace V18 markets. Civilian prosperity, security, and public opinion contribute a bounded local modifier to the existing V18 market price path.

The V22 modifier is capped between approximately -6% and +8%, so civilian recovery matters without overwhelming vendor loyalty, scarcity, faction reputation, or existing economy rules.

## World recovery

V22 world ticks are deterministic and capped during catch-up. A settlement under heavy strategic pressure can lose population to displacement and suffer material decline. A safer settlement gradually recovers.

The civilian layer therefore makes victories, campaigns, strongholds, and diplomacy visible in the lives of ordinary people without turning the game into a 4X simulation.

## UI

Open **World → Civilians** to view:

- total population and displaced population;
- average health, security, prosperity, and morale;
- the current settlement;
- food/housing/health/security/infrastructure meters;
- active civilian request;
- direct relief actions and costs;
- sanctuary network;
- all discovered settlements;
- local V18 market pressure.

A compact **Civilians** beacon is shown alongside Reality, Economy, Party, Legacy, and Faction Command surfaces.

## Persistence and compatibility

V22 migration is idempotent and upgrades V21 saves without rerolling V16 factions, V17 routes, V18 inventories, V19 relationships, V20 relics, or V21 campaigns/strongholds.

If the V22 browser layer fails to load, bootstrap falls back to the complete V21 game.

The service worker precaches V22 domain, browser, and CSS assets while preserving the existing first-install claim guard.

## Validation

The V22 release gate adds coverage for:

- migration/idempotence;
- one settlement per V21 territory;
- deterministic generation;
- bounded civilian metrics;
- displacement and background safety;
- capped catch-up;
- V18 relief costs;
- invalid-action no-spend behavior;
- V21 stronghold sanctuary integration;
- sanctuary capacity and refugee transfer;
- persistent Wheel-driven civilian requests;
- event deduplication;
- bounded market modifier;
- V19 relationship reaction;
- public-opinion bounds;
- civilian legacy endings;
- World → Civilians browser journeys;
- historical V13–V21 regression journeys.

V22 is complete only when both GitHub Actions jobs are green on the exact `main` commit.
