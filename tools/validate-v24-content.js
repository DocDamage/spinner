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
const {V24_SCHEMA_VERSION,ActivityCircuitEngine,migrateV24,ACTIVITY_FAMILIES_V24,ACTIVITY_STYLES_V24}=require('../js/domain/v24-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[{id:'ally-a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['support']},{id:'ally-b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed']}];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time'],bonuses:{mind:4}}];
const state={seed:24001,spin:16,credits:14000,customCharacter:{codename:'Validator',homeworld:'Earth-Prime',stats:{might:80,defense:80,speed:90,skill:88,mind:82,energy:84,hax:76}},party:['ally-a','ally-b'],kits:[],artifacts:['relic-a'],lootInventory:[],equipment:{}};
migrateV24(state,artifacts,roster);Object.assign(state.v18.wallet,{salvage:1200,cosmicFragments:220,voidMarks:20,bountySeals:20});for(const id of state.party){const rec=state.v19.records[id];if(rec){rec.status='active';Object.assign(rec.axes,{loyalty:80,trust:80,respect:80,friendship:75,resentment:2});}}
const engine=new ActivityCircuitEngine(),created=engine.createActivity(state,{sourceKey:'validator:v24:race',sourceType:'validator',family:'speed-race',universe:'Earth-Prime',venue:'Validator Circuit',difficulty:1,heat:90,label:'Validator Velocity Cup'}),beforeCredits=state.credits;
const plan=created.ok?engine.planActivity(state,created.activity.id,{style:'technical',companionId:'ally-a',relicId:'relic-a'}):{ok:false};
const entered=created.ok?engine.beginActivity(state,created.activity.id):{ok:false};const afterEntryCredits=state.credits;
let guard=0;while(state.v24.activeActivityId&&guard++<24){const activity=state.v24.activities[state.v24.activeActivityId],segment=activity.segments[activity.segmentIndex];engine.processEvent(state,{id:`validator-v24-${guard}`,type:segment.events[0],outcome:'win'},roster);}const resolved=state.v24.activities[created.activity?.id||''];

if(state.v24.schemaVersion!==V24_SCHEMA_VERSION)failures.push('V24 migration schema is not 24');
if(state.v23?.schemaVersion!==23)failures.push('V23 state was not preserved through V24 migration');
if(Object.keys(ACTIVITY_FAMILIES_V24).length<12)failures.push('V24 activity family catalog is incomplete');
for(const family of ['speed-race','portal-rally','combat-tournament','survival-gauntlet','relic-trial','treasure-hunt','bounty-pursuit','rescue-drill','civilian-cup','stronghold-games','faction-grand-prix'])if(!ACTIVITY_FAMILIES_V24[family])failures.push(`V24 activity family missing: ${family}`);
if(Object.keys(ACTIVITY_STYLES_V24).length<4)failures.push('V24 competition style catalog is incomplete');
if(!created.ok||!plan.ok||!entered.ok)failures.push('V24 create/plan/enter flow is not functional');
if(entered.ok&&afterEntryCredits!==beforeCredits-resolved.entryCost)failures.push('V24 entry did not spend authoritative V18 Credits exactly once');
if(resolved?.status!=='completed'||resolved.rank<1||resolved.rank>4)failures.push('V24 Wheel-driven activity did not resolve to a valid placement');
if(state.v24.wallet!==undefined)failures.push('V24 introduced a duplicate wallet');
if(!Number.isFinite(Number(state.v24.season.points))||state.v24.season.points<=0)failures.push('V24 non-spendable circuit score did not advance after completion');
const before=JSON.stringify(state.v24);engine.summary(state);engine.summary(state);if(JSON.stringify(state.v24)!==before)failures.push('V24 summary/render access mutates activity state');

const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const bootstrap=read('js/bootstrap.js'),sw=read('sw.js'),css=read('styles/v24.css'),experience=read('js/v24-experience.js'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html'),docs=read('docs/V24_MULTIVERSE_ACTIVITIES_COMPETITION_CIRCUITS.md');
for(const ref of ['styles/v24.css','js/domain/v24-engine.js','js/v24-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v24.css','js/domain/v24-engine.js','js/v24-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
if(bootstrap.indexOf('js/v24-experience.js')<bootstrap.indexOf('js/domain/v24-engine.js'))failures.push('V24 experience must load after V24 domain engine');
for(const marker of ['oldCaches','oldCaches.length','self.clients.claim()','SKIP_WAITING'])if(!sw.includes(marker))failures.push(`service-worker safety marker missing: ${marker}`);
for(const marker of ['V24 • MULTIVERSE ACTIVITIES & COMPETITION CIRCUITS','data-v16-world-tab="activities"','data-v24-plan','data-v24-enter','data-v24-open','data-v24-scan'])if(!experience.includes(marker))failures.push(`V24 browser marker missing: ${marker}`);
for(const marker of ['v24-activity-beacon','v24-segment-track','v24-activity-grid','v24-planner','v24-active','v24-history'])if(!css.includes(marker))failures.push(`V24 UI style marker missing: ${marker}`);
for(const marker of ['Wheel','race','tournament','V18','V19','V20','V21','V22','V23','non-spendable'])if(!docs.toLowerCase().includes(marker.toLowerCase()))failures.push(`V24 documentation marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<24)failures.push(`package version is ${pkg.version}, expected major >= 24`);
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)failures.push('package and lockfile versions do not match');
if(!String(pkg.scripts?.validate||'').includes('validate-v24-content.js')||!String(pkg.scripts?.['validate:content']||'').includes('validate-v24-content.js')||!pkg.scripts?.['validate:v24'])failures.push('package validation scripts do not include V24');
const expectedBrand=`V${major}`;if(!String(manifest.name||'').includes(expectedBrand)||!String(manifest.short_name||'').includes(expectedBrand))failures.push(`PWA manifest branding must match ${expectedBrand}`);
if(!index.includes(`Multiverse Wheel ${expectedBrand}`))failures.push(`index launcher is not branded for ${expectedBrand}`);
if(!sw.includes(`multiverse-wheel-v${major}-`))failures.push(`service-worker cache name must match current package major V${major}`);
const lockText=read('package-lock.json');for(const expected of ['https://registry.npmjs.org/@playwright/test/-/test-1.62.1.tgz','sha512-DTcUc8qii+cpHvtOwggMtBRMjKZHXYWdw8syRYu2vtzuq4Wxphqq4NfCs5Zt44L6mA8rfDfj+PHnxFc/FeK6mQ=='])if(!lockText.includes(expected))failures.push('package-lock dependency URL/hash changed unexpectedly');
const report={schema:state.v24.schemaVersion,families:Object.keys(ACTIVITY_FAMILIES_V24).length,styles:Object.keys(ACTIVITY_STYLES_V24).length,activityCompleted:resolved?.status==='completed',rank:resolved?.rank,circuitPoints:state.v24.season.points,packageVersion:pkg.version,firstInstallClaimGuard:sw.includes('oldCaches.length'),failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V24 content valid: ${report.families} activity families, ${report.styles} competition styles, placement ${report.rank}, circuit score ${report.circuitPoints}, first-install claim guard ${report.firstInstallClaimGuard?'on':'off'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
