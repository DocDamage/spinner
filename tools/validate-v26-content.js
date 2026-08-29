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
require('../js/domain/v25-engine.js');
const {WORLD_CONTENT_CATALOG,WORLD_CONTENT_META}=require('../js/data/world-content.js');
const WorldAssetArt=require('../js/world-asset-art.js');
const {V26_SCHEMA_VERSION,WorldContentEngine,migrateV26}=require('../js/domain/v26-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[{id:'ally-a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['support']}];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time'],bonuses:{mind:4}}];
const state={seed:26001,spin:22,credits:18000,customCharacter:{codename:'Atlas',homeworld:'Earth-Prime',stats:{might:82,defense:82,speed:86,skill:88,mind:90,energy:86,hax:80}},party:['ally-a'],kits:[],artifacts:['relic-a'],lootInventory:[],equipment:{}};
migrateV26(state,artifacts,roster);
const engine=new WorldContentEngine();

if(state.v26.schemaVersion!==V26_SCHEMA_VERSION)failures.push('V26 migration schema is not 26');
if(state.v25?.schemaVersion!==25)failures.push('V25 state was not preserved through V26 migration');
if(WORLD_CONTENT_META.release!==26||WORLD_CONTENT_META.total!==WORLD_CONTENT_CATALOG.length||WORLD_CONTENT_META.total<350)failures.push('V26 world-content catalog is not a hundreds-deep release catalog');
const requiredKinds=['building','place','interior','item','vehicle','npc','stronghold','settlement','activity','crisis','icon'];
for(const kind of requiredKinds)if(Number(WORLD_CONTENT_META.counts?.[kind]||0)<20)failures.push(`V26 ${kind} catalog is too shallow`);
const ids=new Set();
for(const asset of WORLD_CONTENT_CATALOG){
  if(ids.has(asset.id))failures.push(`duplicate V26 asset id: ${asset.id}`);ids.add(asset.id);
  for(const key of ['id','kind','name','subtype','sourceFranchise','world','faction','rarity','tags','path','mime','width','height','sha256','sourcePage','verified','fallbackAllowed','usageTargets','notes'])if(!Object.prototype.hasOwnProperty.call(asset,key))failures.push(`${asset.id} missing metadata field ${key}`);
  if(asset.sourceFranchise!=='Spinner Original Multiverse'||asset.sourcePage!=='generated-project-art'||asset.verified!==true)failures.push(`${asset.id} does not carry generated-project-art provenance`);
  if(asset.mime!=='image/svg+xml'||!String(asset.path).startsWith('generated:v26/'))failures.push(`${asset.id} is not using the V26 runtime SVG asset contract`);
  if(asset.sha256!==null)failures.push(`${asset.id} runtime-generated SVG must use null sha256 until materialized`);
  if(!Array.isArray(asset.tags)||asset.tags.length<3||!Array.isArray(asset.usageTargets)||!asset.usageTargets.length)failures.push(`${asset.id} has incomplete tags/usage targets`);
}
const worldA=engine.assignmentAssets(state,'world','Earth-Prime',{slots:4}).map(x=>x.id),before=JSON.stringify(state.v25);engine.ensure(state,artifacts,roster);const worldB=engine.assignmentAssets(state,'world','Earth-Prime',{slots:4}).map(x=>x.id);
if(JSON.stringify(worldA)!==JSON.stringify(worldB))failures.push('V26 seeded world assignments are not stable');
if(JSON.stringify(state.v25)!==before)failures.push('V26 ensure mutated authoritative V25 state');
state.v21.strongholds['validator-hold']={id:'validator-hold',name:'Validator Bastion',type:'Forward Base',universe:'Earth-Prime',playerAligned:true,status:'safe',integrity:92};
state.v23.operations['validator-operation']={id:'validator-operation',label:'Validator Escort',type:'escort',universe:'Earth-Prime',status:'planned'};
state.v24.activities['validator-activity']={id:'validator-activity',label:'Validator Rally',family:'portal-rally',universe:'Earth-Prime',status:'available'};
state.v25.crises['validator-crisis']={id:'validator-crisis',label:'Validator Fracture',family:'reality-fracture',primaryUniverse:'Earth-Prime',status:'watching'};
engine.syncAssignments(state);
for(const key of ['stronghold:validator-hold','operation:validator-operation','activity:validator-activity','crisis:validator-crisis'])if(!state.v26.assignments[key]?.assetIds?.length)failures.push(`V26 missing cross-system visual assignment ${key}`);
if(state.v26.wallet!==undefined||state.v26.currency!==undefined)failures.push('V26 introduced a duplicate wallet/currency');
const vehicle=engine.query({kind:'vehicle',search:'rescue'});if(!vehicle.length||vehicle.some(x=>x.kind!=='vehicle'))failures.push('V26 atlas search/filter contract is broken');
const sample=WORLD_CONTENT_CATALOG.find(x=>x.kind==='building'),svg=WorldAssetArt.svg(sample),uri=WorldAssetArt.dataUri(sample);if(!svg.startsWith('<svg')||!svg.includes('aria-label=')||!svg.includes(sample.name)||!uri.startsWith('data:image/svg+xml'))failures.push('V26 project-art renderer is invalid');
if(/https?:\/\//i.test(svg))failures.push('V26 generated SVG unexpectedly references remote media');

const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const bootstrap=read('js/bootstrap.js'),sw=read('sw.js'),css=read('styles/v26.css'),experience=read('js/v26-experience.js'),data=read('js/data/world-content.js'),art=read('js/world-asset-art.js'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html'),docs=read('docs/V26_WORLD_CONTENT_EXPANSION.md');
for(const ref of ['js/data/world-content.js','js/world-asset-art.js','styles/v26.css','js/domain/v26-engine.js','js/v26-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['js/data/world-content.js','js/world-asset-art.js','styles/v26.css','js/domain/v26-engine.js','js/v26-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
if(bootstrap.indexOf('js/v26-experience.js')<bootstrap.indexOf('js/domain/v26-engine.js'))failures.push('V26 experience must load after V26 domain engine');
if(!bootstrap.includes('continuing with V25 Cataclysms & Multiverse Crisis Arcs'))failures.push('V26 bootstrap fallback does not explicitly preserve V25');
for(const marker of ['oldCaches','oldCaches.length','self.clients.claim()','SKIP_WAITING'])if(!sw.includes(marker))failures.push(`service-worker safety marker missing: ${marker}`);
for(const marker of ['V26 • WORLD CONTENT EXPANSION','data-v16-world-tab="atlas"','data-v26-open','data-v26-kind','data-v26-search','v26-context-strip'])if(!experience.includes(marker))failures.push(`V26 browser marker missing: ${marker}`);
for(const marker of ['v26-world-content-beacon','v26-atlas-head','v26-kind-strip','v26-asset-grid','v26-asset-card','v26-context-strip'])if(!css.includes(marker))failures.push(`V26 UI style marker missing: ${marker}`);
for(const marker of ['WORLD_CONTENT_CATALOG','sourceFranchise','usageTargets','generated:v26/'])if(!data.includes(marker))failures.push(`V26 catalog source marker missing: ${marker}`);
for(const marker of ['data:image/svg+xml','aria-label','vehicle','building','crisis'])if(!art.includes(marker))failures.push(`V26 generated-art marker missing: ${marker}`);
for(const marker of ['376','buildings','places','vehicles','NPC','rights-safe','V16','V21','V22','V23','V24','V25','review-first','offline','Atlas'])if(!docs.toLowerCase().includes(marker.toLowerCase()))failures.push(`V26 documentation marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<26)failures.push(`package version is ${pkg.version}, expected major >= 26`);
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)failures.push('package and lockfile versions do not match');
if(!String(pkg.scripts?.validate||'').includes('validate-v26-content.js')||!String(pkg.scripts?.['validate:content']||'').includes('validate-v26-content.js')||!pkg.scripts?.['validate:v26'])failures.push('package validation scripts do not include V26');
const expectedBrand=`V${major}`;if(!String(manifest.name||'').includes(expectedBrand)||!String(manifest.short_name||'').includes(expectedBrand))failures.push(`PWA manifest branding must match ${expectedBrand}`);
if(!index.includes(`Multiverse Wheel ${expectedBrand}`))failures.push(`index launcher is not branded for ${expectedBrand}`);
if(!sw.includes(`multiverse-wheel-v${major}-`))failures.push(`service-worker cache name must match current package major V${major}`);
const lockText=read('package-lock.json');for(const expected of ['https://registry.npmjs.org/@playwright/test/-/test-1.62.1.tgz','sha512-DTcUc8qii+cpHvtOwggMtBRMjKZHXYWdw8syRYu2vtzuq4Wxphqq4NfCs5Zt44L6mA8rfDfj+PHnxFc/FeK6mQ=='])if(!lockText.includes(expected))failures.push('package-lock dependency URL/hash changed unexpectedly');

const report={schema:state.v26.schemaVersion,total:WORLD_CONTENT_META.total,kinds:WORLD_CONTENT_META.counts,stableAssignments:worldA.length,packageVersion:pkg.version,firstInstallClaimGuard:sw.includes('oldCaches.length'),failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V26 content valid: ${report.total} rights-safe world assets across ${Object.keys(report.kinds).length} families, ${report.stableAssignments} stable current-world context links, first-install claim guard ${report.firstInstallClaimGuard?'on':'off'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
