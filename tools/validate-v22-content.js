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
require('../js/domain/v21-engine.js');
const {V22_SCHEMA_VERSION,SettlementEngine,migrateV22,NEED_DEFS_V22,CIVILIAN_ACTIONS_V22}=require('../js/domain/v22-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[{id:'ally-a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['healing','support']},{id:'ally-b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed','martial']}];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
const state={seed:22001,spin:12,credits:12000,customCharacter:{codename:'Validator',homeworld:'Earth-Prime',stats:{skill:72}},party:['ally-a','ally-b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'}};
migrateV22(state,artifacts,roster);Object.assign(state.v18.wallet,{salvage:1000,cosmicFragments:200,voidMarks:20,bountySeals:20});for(const f of Object.values(state.v16.factions))f.reputation=75;
const factions=new global.MultiverseDomain.FactionCampaignEngine(),factionId=Object.keys(state.v16.factions)[0];factions.joinFaction(state,factionId,roster);Object.assign(state.v21.memberships[factionId],{rank:5,rankXp:300,authority:75});const territory=Object.values(state.v21.territories)[0];territory.controllerFactionId=factionId;territory.contested=false;const built=factions.buildStronghold(state,{territoryId:territory.id,factionId});const engine=new SettlementEngine(),settlement=state.v22.settlements[territory.id],aid=engine.action(state,settlement.id,'aid',roster),sanctuary=built.ok?engine.buildSanctuary(state,built.stronghold.id):{ok:false};

if(state.v22.schemaVersion!==V22_SCHEMA_VERSION)failures.push('V22 migration schema is not 22');
if(state.v21?.schemaVersion!==21)failures.push('V21 state was not preserved through V22 migration');
if(Object.keys(state.v22.settlements).length!==Object.keys(state.v21.territories).length)failures.push('V22 settlement generation does not cover every V21 territory');
if(Object.keys(NEED_DEFS_V22).length<7||Object.keys(CIVILIAN_ACTIONS_V22).length<5)failures.push('civilian need/action catalogs are incomplete');
if(!aid.ok)failures.push('civilian relief action is not functional');
if(!sanctuary.ok)failures.push('V21 stronghold to V22 sanctuary integration is not functional');
if(engine.marketModifier(state)<-.06||engine.marketModifier(state)>.08)failures.push('civilian market modifier escaped release bounds');
const before=JSON.stringify(state.v22);engine.summary(state);engine.summary(state);if(JSON.stringify(state.v22)!==before)failures.push('V22 summary/render access mutates civilian state');

const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const bootstrap=read('js/bootstrap.js'),sw=read('sw.js'),css=read('styles/v22.css'),experience=read('js/v22-experience.js'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html'),docs=read('docs/V22_SETTLEMENTS_CIVILIAN_WORLDS.md');
for(const ref of ['styles/v22.css','js/domain/v22-engine.js','js/v22-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v22.css','js/domain/v22-engine.js','js/v22-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
if(bootstrap.indexOf('js/v22-experience.js')<bootstrap.indexOf('js/domain/v22-engine.js'))failures.push('V22 experience must load after V22 domain engine');
for(const marker of ['oldCaches','oldCaches.length','self.clients.claim()'])if(!sw.includes(marker))failures.push(`service-worker first-install guard missing: ${marker}`);
if(!sw.includes('multiverse-wheel-v22-civilian-1'))failures.push('service-worker cache name is not V22');
for(const marker of ['V22 • SETTLEMENTS & CIVILIAN WORLDS','data-v16-world-tab="civilians"','data-v22-action','data-v22-build-sanctuary','data-v22-open'])if(!experience.includes(marker))failures.push(`V22 browser marker missing: ${marker}`);
for(const marker of ['v22-civilian-beacon','v22-current','v22-grid','v22-sanctuary','v22-request'])if(!css.includes(marker))failures.push(`V22 UI style marker missing: ${marker}`);
for(const marker of ['civilian populations','refugees','sanctuaries','public opinion','V18 wallet','normal Wheel'])if(!docs.toLowerCase().includes(marker.toLowerCase()))failures.push(`V22 documentation marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<22)failures.push(`package version is ${pkg.version}, expected major >= 22`);
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)failures.push('package and lockfile versions do not match');
if(!String(pkg.scripts?.validate||'').includes('validate-v22-content.js')||!String(pkg.scripts?.['validate:content']||'').includes('validate-v22-content.js')||!pkg.scripts?.['validate:v22'])failures.push('package validation scripts do not include V22');
const expectedBrand=`V${major}`;if(!String(manifest.name||'').includes(expectedBrand)||!String(manifest.short_name||'').includes(expectedBrand))failures.push(`PWA manifest branding must match ${expectedBrand}`);
if(!index.includes(`Multiverse Wheel ${expectedBrand}`))failures.push(`index launcher is not branded for ${expectedBrand}`);
const lockText=read('package-lock.json');for(const expected of ['https://registry.npmjs.org/@playwright/test/-/test-1.62.1.tgz','sha512-DTcUc8qii+cpHvtOwggMtBRMjKZHXYWdw8syRYu2vtzuq4Wxphqq4NfCs5Zt44L6mA8rfDfj+PHnxFc/FeK6mQ=='])if(!lockText.includes(expected))failures.push('package-lock dependency URL/hash changed unexpectedly');

const report={schema:state.v22.schemaVersion,settlements:Object.keys(state.v22.settlements).length,needs:Object.keys(NEED_DEFS_V22).length,actions:Object.keys(CIVILIAN_ACTIONS_V22).length,sanctuaryBuilt:sanctuary.ok,marketModifier:engine.marketModifier(state),packageVersion:pkg.version,firstInstallClaimGuard:sw.includes('oldCaches.length'),failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V22 content valid: ${report.settlements} settlements, ${report.needs} need families, ${report.actions} relief actions, sanctuary ${report.sanctuaryBuilt?'on':'off'}, market modifier ${Math.round(report.marketModifier*100)}%, first-install claim guard ${report.firstInstallClaimGuard?'on':'off'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
