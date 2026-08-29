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
require('../js/domain/v22-engine.js');
require('../js/domain/v23-engine.js');
require('../js/domain/v24-engine.js');
const {V25_SCHEMA_VERSION,CrisisArcEngine,migrateV25,CRISIS_FAMILIES_V25,CRISIS_POSTURES_V25,CRISIS_SUPPORT_TIERS_V25}=require('../js/domain/v25-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[{id:'ally-a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['support']},{id:'ally-b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed']}];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time'],bonuses:{mind:4}}];
const state={seed:25001,spin:20,credits:18000,customCharacter:{codename:'Validator',homeworld:'Earth-Prime',stats:{might:84,defense:84,speed:88,skill:90,mind:92,energy:88,hax:82}},party:['ally-a','ally-b'],kits:[],artifacts:['relic-a'],lootInventory:[],equipment:{}};
migrateV25(state,artifacts,roster);Object.assign(state.v18.wallet,{salvage:1400,cosmicFragments:260,voidMarks:20,bountySeals:20});for(const id of state.party){const rec=state.v19.records[id];if(rec){rec.status='active';Object.assign(rec.axes,{loyalty:80,trust:82,respect:80,friendship:76,resentment:2,fear:4});}}
const world=Object.values(state.v16.universes)[0];world.stability=34;world.corruption=74;world.threat=78;
const engine=new CrisisArcEngine(),created=engine.createCrisis(state,{sourceKey:'validator:v25:fracture',sourceType:'validator',family:'reality-fracture',primaryUniverse:world.name,universeIds:[world.name],severity:72,label:'Validator Reality Cascade'}),beforeWallet={credits:state.credits,salvage:state.v18.wallet.salvage,fragments:state.v18.wallet.cosmicFragments};
const plan=created.ok?engine.planResponse(state,created.crisis.id,{posture:'stabilization',supportTier:2,allyIds:['ally-a'],relicId:'relic-a'}):{ok:false};
const started=created.ok?engine.beginResponse(state,created.crisis.id):{ok:false};const afterStartWallet={credits:state.credits,salvage:state.v18.wallet.salvage,fragments:state.v18.wallet.cosmicFragments};
let guard=0;while(state.v25.activeCrisisId&&guard++<24){const crisis=state.v25.crises[state.v25.activeCrisisId],phase=crisis.phases[crisis.phaseIndex];engine.processEvent(state,{id:`validator-v25-${guard}`,type:phase.events[0],outcome:'win'},roster);}const resolved=state.v25.crises[created.crisis?.id||''];

if(state.v25.schemaVersion!==V25_SCHEMA_VERSION)failures.push('V25 migration schema is not 25');
if(state.v24?.schemaVersion!==24)failures.push('V24 state was not preserved through V25 migration');
if(Object.keys(CRISIS_FAMILIES_V25).length!==10)failures.push('V25 crisis family catalog is incomplete');
for(const family of ['reality-fracture','corruption-surge','invasion-wave','temporal-storm','relic-cascade','faction-world-war','refugee-exodus','stronghold-breach','nemesis-uprising','convergence-event'])if(!CRISIS_FAMILIES_V25[family])failures.push(`V25 crisis family missing: ${family}`);
if(Object.keys(CRISIS_POSTURES_V25).length<6||Object.keys(CRISIS_SUPPORT_TIERS_V25).length!==4)failures.push('V25 response catalogs are incomplete');
if(!created.ok||!plan.ok||!started.ok)failures.push('V25 create/plan/start flow is not functional');
if(started.ok&&(afterStartWallet.credits!==beforeWallet.credits-CRISIS_SUPPORT_TIERS_V25[2].cost.credits||afterStartWallet.salvage!==beforeWallet.salvage-CRISIS_SUPPORT_TIERS_V25[2].cost.salvage||afterStartWallet.fragments!==beforeWallet.fragments-CRISIS_SUPPORT_TIERS_V25[2].cost.cosmicFragments))failures.push('V25 response did not spend authoritative V18 resources exactly once');
if(resolved?.status!=='resolved'||resolved.phases?.length!==5||!resolved.phases.every(p=>p.status==='completed'))failures.push('V25 Wheel-driven five-phase crisis did not reach resolution');
if(state.v25.wallet!==undefined)failures.push('V25 introduced a duplicate wallet');
const before=JSON.stringify(state.v25);engine.summary(state);engine.summary(state);if(JSON.stringify(state.v25)!==before)failures.push('V25 summary/render access mutates crisis state');

const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const bootstrap=read('js/bootstrap.js'),sw=read('sw.js'),css=read('styles/v25.css'),experience=read('js/v25-experience.js'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html'),docs=read('docs/V25_CATACLYSMS_MULTIVERSE_CRISIS_ARCS.md');
for(const ref of ['styles/v25.css','js/domain/v25-engine.js','js/v25-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v25.css','js/domain/v25-engine.js','js/v25-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
if(bootstrap.indexOf('js/v25-experience.js')<bootstrap.indexOf('js/domain/v25-engine.js'))failures.push('V25 experience must load after V25 domain engine');
for(const marker of ['oldCaches','oldCaches.length','self.clients.claim()','SKIP_WAITING'])if(!sw.includes(marker))failures.push(`service-worker safety marker missing: ${marker}`);
for(const marker of ['V25 • CATACLYSMS & MULTIVERSE CRISIS ARCS','data-v16-world-tab="crises"','data-v25-plan','data-v25-start','data-v25-open','data-v25-scan'])if(!experience.includes(marker))failures.push(`V25 browser marker missing: ${marker}`);
for(const marker of ['v25-crisis-beacon','v25-phase-track','v25-crisis-grid','v25-planner','v25-active','v25-history'])if(!css.includes(marker))failures.push(`V25 UI style marker missing: ${marker}`);
for(const marker of ['Wheel','V16','V18','V19','V20','V21','V22','V23','V24','five-phase','recoverable','offline'])if(!docs.toLowerCase().includes(marker.toLowerCase()))failures.push(`V25 documentation marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<25)failures.push(`package version is ${pkg.version}, expected major >= 25`);
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)failures.push('package and lockfile versions do not match');
if(!String(pkg.scripts?.validate||'').includes('validate-v25-content.js')||!String(pkg.scripts?.['validate:content']||'').includes('validate-v25-content.js')||!pkg.scripts?.['validate:v25'])failures.push('package validation scripts do not include V25');
const expectedBrand=`V${major}`;if(!String(manifest.name||'').includes(expectedBrand)||!String(manifest.short_name||'').includes(expectedBrand))failures.push(`PWA manifest branding must match ${expectedBrand}`);
if(!index.includes(`Multiverse Wheel ${expectedBrand}`))failures.push(`index launcher is not branded for ${expectedBrand}`);
if(!sw.includes(`multiverse-wheel-v${major}-`))failures.push(`service-worker cache name must match current package major V${major}`);
const lockText=read('package-lock.json');for(const expected of ['https://registry.npmjs.org/@playwright/test/-/test-1.62.1.tgz','sha512-DTcUc8qii+cpHvtOwggMtBRMjKZHXYWdw8syRYu2vtzuq4Wxphqq4NfCs5Zt44L6mA8rfDfj+PHnxFc/FeK6mQ=='])if(!lockText.includes(expected))failures.push('package-lock dependency URL/hash changed unexpectedly');

const report={schema:state.v25.schemaVersion,families:Object.keys(CRISIS_FAMILIES_V25).length,postures:Object.keys(CRISIS_POSTURES_V25).length,crisisResolved:resolved?.status==='resolved',packageVersion:pkg.version,firstInstallClaimGuard:sw.includes('oldCaches.length'),failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V25 content valid: ${report.families} crisis families, ${report.postures} response postures, five-phase resolution ${report.crisisResolved?'on':'off'}, first-install claim guard ${report.firstInstallClaimGuard?'on':'off'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
