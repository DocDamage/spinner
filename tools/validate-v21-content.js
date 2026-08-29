'use strict';

const fs=require('node:fs');
const path=require('node:path');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
require('../js/domain/v16-engine.js');
require('../js/domain/v17-engine.js');
require('../js/domain/v18-engine.js');
require('../js/domain/v19-engine.js');
require('../js/domain/v20-engine.js');
const {V21_SCHEMA_VERSION,FactionCampaignEngine,migrateV21,RANKS_V21,CAMPAIGN_DEFS_V21,FACILITY_DEFS_V21,SPECIALIST_ROLES_V21}=require('../js/domain/v21-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[{id:'ally-a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['healing','support']},{id:'ally-b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed','martial']}];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
const state={seed:21001,spin:8,credits:5000,customCharacter:{codename:'Validator',homeworld:'Earth-Prime',stats:{skill:72}},party:['ally-a','ally-b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'}};
migrateV21(state,artifacts,roster);Object.assign(state.v18.wallet,{salvage:800,cosmicFragments:160,voidMarks:20,bountySeals:20});for(const f of Object.values(state.v16.factions))f.reputation=70;
const engine=new FactionCampaignEngine(),factionId=Object.keys(state.v16.factions)[0],membership=engine.joinFaction(state,factionId,roster).membership;state.v21.memberships[factionId].rank=5;state.v21.memberships[factionId].rankXp=260;state.v21.memberships[factionId].authority=65;
const territory=Object.values(state.v21.territories)[0];territory.controllerFactionId=factionId;territory.contested=false;const built=engine.buildStronghold(state,{territoryId:territory.id,factionId});const campaign=engine.createCampaign(state,factionId,'border-war');

if(state.v21.schemaVersion!==V21_SCHEMA_VERSION)failures.push('V21 migration schema is not 21');
if(state.v20?.schemaVersion!==20)failures.push('V20 state was not preserved through V21 migration');
if(!membership||state.v21.primaryFactionId!==factionId)failures.push('primary faction membership is not functional');
if(RANKS_V21.length!==8||RANKS_V21[7]?.label!=='Regent')failures.push('faction rank catalog is incomplete');
if(Object.keys(CAMPAIGN_DEFS_V21).length<6||!campaign.ok)failures.push('campaign definitions/generation are incomplete');
if(Object.keys(FACILITY_DEFS_V21).length<10||SPECIALIST_ROLES_V21.length<10)failures.push('stronghold facility/specialist catalogs are incomplete');
if(Object.keys(state.v21.territories).length<5)failures.push('territory generation did not use V17 routes');
if(!built.ok||!state.v21.strongholds[built.stronghold.id])failures.push('stronghold construction is not functional');
if(engine.campaignCombatModifier(state).odds>.06||engine.campaignCombatModifier(state).damage>.08)failures.push('V21 combat modifiers exceed release cap');
const before=JSON.stringify(state.v21.campaigns[campaign.campaign.id]);engine.summary(state);engine.summary(state);if(JSON.stringify(state.v21.campaigns[campaign.campaign.id])!==before)failures.push('summary/render access progresses campaign state');

const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const bootstrap=read('js/bootstrap.js'),sw=read('sw.js'),css=read('styles/v21.css'),experience=read('js/v21-experience.js'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html');
for(const ref of ['styles/v21.css','js/domain/v21-engine.js','js/v21-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v21.css','js/domain/v21-engine.js','js/v21-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
for(const marker of ['oldCaches','oldCaches.length','self.clients.claim()'])if(!sw.includes(marker))failures.push(`service-worker first-install guard missing: ${marker}`);
if(!sw.includes("multiverse-wheel-v21-factions-1"))failures.push('service-worker cache name is not V21');
for(const marker of ['FACTION COMMAND','FACTION CAMPAIGNS & STRONGHOLDS','data-v21-faction-tab','data-v21-campaign-start','data-v21-build-hold','data-v21-diplomacy','data-v21-infiltration-action','data-v21-siege'])if(!experience.includes(marker))failures.push(`V21 integration marker missing: ${marker}`);
for(const marker of ['v21-faction-beacon','v21-subnav','v21-campaign-card','v21-territory-grid','v21-stronghold-grid','v21-facilities','v21-diplomacy-grid','v21-siege'])if(!css.includes(marker))failures.push(`V21 UI style marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<21)failures.push(`package version is ${pkg.version}, expected major >= 21`);
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)failures.push('package and lockfile versions do not match');
if(!String(pkg.scripts?.validate||'').includes('validate-v21-content.js')||!String(pkg.scripts?.['validate:content']||'').includes('validate-v21-content.js')||!pkg.scripts?.['validate:v21'])failures.push('package validation scripts do not include V21');
if(!String(manifest.name||'').includes('V21')||!String(manifest.short_name||'').includes('V21'))failures.push('PWA manifest is not branded for V21');
if(!index.includes('Multiverse Wheel V21'))failures.push('index launcher is not branded for V21');
const lockText=read('package-lock.json');for(const expected of ['https://registry.npmjs.org/@playwright/test/-/test-1.62.1.tgz','sha512-DTcUc8qii+cpHvtOwggMtBRMjKZHXYWdw8syRYu2vtzuq4Wxphqq4NfCs5Zt44L6mA8rfDfj+PHnxFc/FeK6mQ=='])if(!lockText.includes(expected))failures.push('package-lock dependency URL/hash changed unexpectedly');

const report={schema:state.v21.schemaVersion,ranks:RANKS_V21.length,campaignTypes:Object.keys(CAMPAIGN_DEFS_V21).length,facilities:Object.keys(FACILITY_DEFS_V21).length,specialists:SPECIALIST_ROLES_V21.length,territories:Object.keys(state.v21.territories).length,strongholdBuilt:built.ok,packageVersion:pkg.version,firstInstallClaimGuard:sw.includes('oldCaches.length'),failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V21 content valid: ${report.ranks} ranks, ${report.campaignTypes} campaign types, ${report.territories} territories, ${report.facilities} facilities, stronghold build ${report.strongholdBuilt?'on':'off'}, first-install claim guard ${report.firstInstallClaimGuard?'on':'off'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
