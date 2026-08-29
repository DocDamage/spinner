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
const {FactionCampaignEngine}=require('../js/domain/v21-engine.js');
require('../js/domain/v22-engine.js');
const {V23_SCHEMA_VERSION,TacticalOperationsEngine,migrateV23,OPERATION_FAMILIES_V23,APPROACHES_V23,SUPPLY_TIERS_V23}=require('../js/domain/v23-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[{id:'ally-a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['healing','support']},{id:'ally-b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed','martial']}];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
const state={seed:23001,spin:14,credits:14000,customCharacter:{codename:'Validator',homeworld:'Earth-Prime',stats:{skill:72}},party:['ally-a','ally-b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'}};
migrateV23(state,artifacts,roster);Object.assign(state.v18.wallet,{salvage:1200,cosmicFragments:220,voidMarks:20,bountySeals:20});for(const f of Object.values(state.v16.factions))f.reputation=80;
const factions=new FactionCampaignEngine(),factionId=Object.keys(state.v16.factions)[0];factions.joinFaction(state,factionId,roster);Object.assign(state.v21.memberships[factionId],{rank:5,rankXp:320,authority:78});
const territory=Object.values(state.v21.territories)[0];territory.controllerFactionId=factionId;territory.contested=false;
for(const id of state.party){const rec=state.v19.records[id];if(rec){rec.status='active';Object.assign(rec.axes,{loyalty:80,trust:80,respect:80,friendship:75,resentment:2});}}
const engine=new TacticalOperationsEngine(),created=engine.createOperation(state,{sourceKey:'validator:v23',sourceType:'validator',family:'rescue',settlementId:territory.id,territoryId:territory.id,factionId,urgency:72,label:'Validator Rescue'}),beforeWallet={credits:state.credits,salvage:state.v18.wallet.salvage};
const plan=created.ok?engine.planOperation(state,created.operation.id,{approach:'stealth',allyIds:['ally-a'],factionSupport:true,relicId:'relic-a',supplyCommitment:1,priority:'civilians'}):{ok:false};
const deployed=created.ok?engine.beginOperation(state,created.operation.id):{ok:false};
const afterDeployWallet={credits:state.credits,salvage:state.v18.wallet.salvage};
let guard=0;while(state.v23.activeOperationId&&guard++<20){const op=state.v23.operations[state.v23.activeOperationId],stage=op.stages[op.stageIndex];engine.processEvent(state,{id:`validator-${guard}`,type:stage.events[0],outcome:stage.requiredOutcome||'win'},roster);}
const resolved=state.v23.operations[created.operation?.id||''];

if(state.v23.schemaVersion!==V23_SCHEMA_VERSION)failures.push('V23 migration schema is not 23');
if(state.v22?.schemaVersion!==22)failures.push('V22 state was not preserved through V23 migration');
if(Object.keys(OPERATION_FAMILIES_V23).length<13)failures.push('V23 mission family catalog is incomplete');
if(Object.keys(APPROACHES_V23).length<4||Object.keys(SUPPLY_TIERS_V23).length!==4)failures.push('V23 planning catalogs are incomplete');
if(!created.ok||!plan.ok||!deployed.ok)failures.push('V23 create/plan/deploy flow is not functional');
if(deployed.ok&&(afterDeployWallet.credits!==beforeWallet.credits-SUPPLY_TIERS_V23[1].cost.credits||afterDeployWallet.salvage!==beforeWallet.salvage-SUPPLY_TIERS_V23[1].cost.salvage))failures.push('V23 deployment did not spend authoritative V18 supply resources exactly once');
if(resolved?.status!=='completed')failures.push('V23 Wheel-driven multi-stage operation did not reach aftermath');
const mod=plan.modifiers||{};if(Number(mod.odds)<-.06||Number(mod.odds)>.06||Number(mod.damage)<-.08||Number(mod.damage)>.08)failures.push('V23 planning modifier escaped combat bounds');
const before=JSON.stringify(state.v23);engine.summary(state);engine.summary(state);if(JSON.stringify(state.v23)!==before)failures.push('V23 summary/render access mutates operation state');

const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const bootstrap=read('js/bootstrap.js'),sw=read('sw.js'),css=read('styles/v23.css'),experience=read('js/v23-experience.js'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html'),docs=read('docs/V23_TACTICAL_MISSIONS_WARFRONT_OPERATIONS.md');
for(const ref of ['styles/v23.css','js/domain/v23-engine.js','js/v23-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v23.css','js/domain/v23-engine.js','js/v23-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
if(bootstrap.indexOf('js/v23-experience.js')<bootstrap.indexOf('js/domain/v23-engine.js'))failures.push('V23 experience must load after V23 domain engine');
for(const marker of ['oldCaches','oldCaches.length','self.clients.claim()','SKIP_WAITING'])if(!sw.includes(marker))failures.push(`service-worker safety marker missing: ${marker}`);
for(const marker of ['V23 • TACTICAL MISSIONS & WARFRONT OPERATIONS','data-v16-world-tab="operations"','data-v23-plan','data-v23-deploy','data-v23-open','data-v23-scan'])if(!experience.includes(marker))failures.push(`V23 browser marker missing: ${marker}`);
for(const marker of ['v23-operation-beacon','v23-stage-track','v23-operation-grid','v23-planner','v23-active','v23-history'])if(!css.includes(marker))failures.push(`V23 UI style marker missing: ${marker}`);
for(const marker of ['Wheel remains','V21 campaigns','V22 civilian','V18 economy','V19 relationships','V20 relic','five stages','recoverable'])if(!docs.toLowerCase().includes(marker.toLowerCase()))failures.push(`V23 documentation marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<23)failures.push(`package version is ${pkg.version}, expected major >= 23`);
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)failures.push('package and lockfile versions do not match');
if(!String(pkg.scripts?.validate||'').includes('validate-v23-content.js')||!String(pkg.scripts?.['validate:content']||'').includes('validate-v23-content.js')||!pkg.scripts?.['validate:v23'])failures.push('package validation scripts do not include V23');
const expectedBrand=`V${major}`;if(!String(manifest.name||'').includes(expectedBrand)||!String(manifest.short_name||'').includes(expectedBrand))failures.push(`PWA manifest branding must match ${expectedBrand}`);
if(!index.includes(`Multiverse Wheel ${expectedBrand}`))failures.push(`index launcher is not branded for ${expectedBrand}`);
if(!sw.includes(`multiverse-wheel-v${major}-`))failures.push(`service-worker cache name must match current package major V${major}`);
const lockText=read('package-lock.json');for(const expected of ['https://registry.npmjs.org/@playwright/test/-/test-1.62.1.tgz','sha512-DTcUc8qii+cpHvtOwggMtBRMjKZHXYWdw8syRYu2vtzuq4Wxphqq4NfCs5Zt44L6mA8rfDfj+PHnxFc/FeK6mQ=='])if(!lockText.includes(expected))failures.push('package-lock dependency URL/hash changed unexpectedly');

const report={schema:state.v23.schemaVersion,families:Object.keys(OPERATION_FAMILIES_V23).length,approaches:Object.keys(APPROACHES_V23).length,operationCompleted:resolved?.status==='completed',combatOdds:mod.odds,combatDamage:mod.damage,packageVersion:pkg.version,firstInstallClaimGuard:sw.includes('oldCaches.length'),failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V23 content valid: ${report.families} mission families, ${report.approaches} approaches, operation completion ${report.operationCompleted?'on':'off'}, planning caps ${Math.round(Number(report.combatOdds||0)*100)}% odds / ${Math.round(Number(report.combatDamage||0)*100)}% damage, first-install claim guard ${report.firstInstallClaimGuard?'on':'off'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}