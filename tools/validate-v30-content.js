'use strict';
const fs=require('node:fs'),path=require('node:path');
for(const version of [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28])require(`../js/domain/v${version}-engine.js`);
const {WORLD_CONTENT_CATALOG_V27}=require('../js/data/world-content-v27.js'),
  {migrateV28}=require('../js/domain/v28-engine.js'),
  {WORLD_CONTENT_V30_ADDED,WORLD_CONTENT_CATALOG_V30,WORLD_CONTENT_META_V30}=require('../js/data/world-content-v30.js'),
  WorldAssetArtV30=require('../js/world-asset-art-v30.js'),
  {V30_SCHEMA_VERSION,WorldExpansionEngine,migrateV30,WORLD_CONTENT_GROUPS_V30}=require('../js/domain/v30-engine.js'),
  root=path.resolve(__dirname,'..'),failures=[],read=file=>fs.readFileSync(path.join(root,file),'utf8');

const roster=[{id:'ally-a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['support']}],
  artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time'],bonuses:{mind:4}}],
  source={seed:30001,spin:30,credits:30000,customCharacter:{codename:'Atlas',homeworld:'Earth-Prime',stats:{might:82,defense:82,speed:86,skill:88,mind:90,energy:86,hax:80}},party:['ally-a'],kits:[],artifacts:['relic-a'],lootInventory:[],equipment:{}},
  state=migrateV28(JSON.parse(JSON.stringify(source)),artifacts,roster),
  v28Before=JSON.stringify(state.v28),v27WorldBefore=JSON.stringify(state.v27?.contexts?.['world:Earth-Prime']||null);
migrateV30(state,artifacts,roster);
const engine=new WorldExpansionEngine();

if(state.v30.schemaVersion!==V30_SCHEMA_VERSION)failures.push('V30 migration schema is not 30');
if(JSON.stringify(state.v28)!==v28Before)failures.push('V30 migration mutated V28 state');
if(JSON.stringify(state.v27?.contexts?.['world:Earth-Prime']||null)!==v27WorldBefore)failures.push('V30 migration mutated the V27 current-world context');
if(WORLD_CONTENT_CATALOG_V27.length!==1912)failures.push('V27 base catalog changed unexpectedly');
if(WORLD_CONTENT_META_V30.release!==30||WORLD_CONTENT_META_V30.baseTotal!==1912||WORLD_CONTENT_META_V30.addedTotal!==4704||WORLD_CONTENT_V30_ADDED.length!==4704||WORLD_CONTENT_META_V30.total!==6616||WORLD_CONTENT_CATALOG_V30.length!==6616)failures.push('V30 catalog totals are not 1,912 + 4,704 = 6,616');
if(Object.keys(WORLD_CONTENT_META_V30.counts).length!==40)failures.push('V30 must expose 40 combined asset families');
if((WORLD_CONTENT_META_V30.newFamilies||[]).length!==15)failures.push('V30 must expose exactly 15 new asset families');

const expanded=['building','place','item','vehicle','npc','stronghold','settlement','activity','crisis','weapon','armor','technology','food','district','dungeon','ruin','portal','route','weather','anomaly','organization','companion','mount','relic','treasure','service','venue','encounter'],
  newKinds=['district','dungeon','ruin','portal','route','weather','anomaly','organization','companion','mount','relic','treasure','service','venue','encounter'];
for(const kind of expanded)if(Number(WORLD_CONTENT_META_V30.addedCounts?.[kind]||0)<160)failures.push(`V30 ${kind} family is too shallow`);
for(const kind of newKinds)if(!(WORLD_CONTENT_META_V30.newFamilies||[]).includes(kind))failures.push(`V30 new-family metadata missing ${kind}`);

const ids=new Set();
for(const a of WORLD_CONTENT_CATALOG_V30){if(ids.has(a.id))failures.push(`duplicate combined asset id: ${a.id}`);ids.add(a.id);}
for(const a of WORLD_CONTENT_V30_ADDED){
  for(const key of ['id','kind','name','subtype','sourceFranchise','world','faction','rarity','tags','path','mime','width','height','sha256','sourcePage','verified','fallbackAllowed','usageTargets','notes','visualSeed','release'])if(!Object.prototype.hasOwnProperty.call(a,key))failures.push(`${a.id} missing ${key}`);
  if(!String(a.path).startsWith('generated:v30/')||a.sourceFranchise!=='Spinner Original Multiverse'||a.sourcePage!=='generated-project-art'||a.verified!==true||a.mime!=='image/svg+xml'||a.sha256!==null||a.release!==30)failures.push(`${a.id} breaks V30 generated-project-art provenance`);
}
for(const kind of newKinds){
  const sample=WORLD_CONTENT_V30_ADDED.find(x=>x.kind===kind),svg=WorldAssetArtV30.svg(sample);
  if(!svg.startsWith('<svg')||!svg.includes('SPINNER V30')||!svg.includes(sample.name)||/(?:href|src)=["']https?:\/\//i.test(svg))failures.push(`V30 renderer failed ${kind}`);
}
const existingSample=WORLD_CONTENT_V30_ADDED.find(x=>x.kind==='building'),existingSvg=WorldAssetArtV30.svg(existingSample);
if(!existingSvg.includes('SPINNER V30')||!existingSvg.includes(existingSample.name))failures.push('V30 did not upgrade existing-family art branding');

const legacy=state.v27?.contexts?.['world:Earth-Prime']?.assetIds||[],context=engine.context(state,'world','Earth-Prime',{slots:8}).map(x=>x.id);
if(JSON.stringify(context.slice(0,legacy.length))!==JSON.stringify(legacy.slice(0,context.length)))failures.push('V30 did not preserve V27 world assignment prefix');
if(!context.some(id=>Number(engine.find(id)?.release)===30))failures.push('V30 context did not add Massive World Expansion art');

const encounterA=engine.encounter(state,'world','Earth-Prime',{difficulty:3,salt:'validation',record:false}),encounterB=engine.encounter(state,'world','Earth-Prime',{difficulty:3,salt:'validation',record:false});
if(JSON.stringify(encounterA)!==JSON.stringify(encounterB))failures.push('V30 encounter generation is not deterministic');
for(const slot of ['scene','actor','mobility','pressure','reward','support'])if(!encounterA.resolvedAssets?.[slot])failures.push(`V30 encounter missing ${slot}`);
if(Object.values(encounterA.resolvedAssets||{}).some(a=>Number(a.release)!==30))failures.push('V30 encounter did not prefer V30 assets');
const encounterCount=state.v30.stats.encountersGenerated,logCount=state.v30.encounterLog.length;
engine.encounter(state,'operation','op-validation',{salt:'recorded',record:true});
if(state.v30.stats.encountersGenerated!==encounterCount+1||state.v30.encounterLog.length<Math.min(24,logCount+1))failures.push('V30 recorded encounter did not update bounded encounter state');

const travelA=engine.travelPlan(state,'Earth-Prime','Arcology',{record:false}),travelB=engine.travelPlan(state,'Earth-Prime','Arcology',{record:false});
if(JSON.stringify(travelA)!==JSON.stringify(travelB))failures.push('V30 travel plan is not deterministic');
for(const key of ['route','transport','conditions','stop','encounter'])if(!travelA[key])failures.push(`V30 travel plan missing ${key}`);
if(!['route','portal','transit'].includes(travelA.route?.kind||''))failures.push('V30 travel plan route slot has the wrong family');
if(!['vehicle','mount'].includes(travelA.transport?.kind||''))failures.push('V30 travel plan transport slot has the wrong family');

const snapshot=JSON.stringify(state),again=engine.ensure(state,artifacts,roster);
if(JSON.stringify(again)!==snapshot)failures.push('V30 ensure is not idempotent');
if(state.v30.wallet!==undefined||state.v30.currency!==undefined||state.v30.inventory!==undefined||state.v30.party!==undefined)failures.push('V30 introduced duplicate economy, inventory, or party state');
for(const group of ['structures','world','travel','gear','people','adventure','ui'])if(!WORLD_CONTENT_GROUPS_V30[group]?.length)failures.push(`V30 group missing ${group}`);

const bootstrap=read('js/bootstrap.js'),sw=read('sw.js'),css=read('styles/v30.css'),experience=read('js/v30-experience.js'),data=read('js/data/world-content-v30.js'),art=read('js/world-asset-art-v30.js'),engineSource=read('js/domain/v30-engine.js'),docs=read('docs/V30_MASSIVE_WORLD_EXPANSION.md'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html');
for(const ref of ['js/data/world-content-v30.js','js/world-asset-art-v30.js','styles/v30.css','js/domain/v30-engine.js','js/v30-experience.js']){if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);}
if(!bootstrap.includes('continuing with V28 Atlas UX & Asset Integration'))failures.push('V30 fallback does not explicitly preserve V28');
if(bootstrap.indexOf('js/v30-experience.js')<bootstrap.indexOf('js/domain/v30-engine.js'))failures.push('V30 experience loads before V30 engine');
for(const marker of ['V30 • MASSIVE WORLD EXPANSION','6,616','4,704','data-v30-new-only','v30-field-encounter','SCOUT NEXT'])if(!experience.includes(marker))failures.push(`V30 browser marker missing: ${marker}`);
for(const marker of ['v30-new-asset','v30-field-encounter','v30-encounter-grid','v30-context-strip'])if(!css.includes(marker))failures.push(`V30 CSS marker missing: ${marker}`);
for(const marker of ['WORLD_CONTENT_CATALOG_V30','district','dungeon','portal','mount','relic','encounter'])if(!data.includes(marker))failures.push(`V30 catalog marker missing: ${marker}`);
for(const marker of ['WorldAssetArtV30','SPINNER V30','customKinds','dungeon','portal','relic'])if(!art.includes(marker))failures.push(`V30 art marker missing: ${marker}`);
for(const marker of ['WorldExpansionEngine','ENCOUNTER_SLOTS','travelPlan','legacyAssetIds','preferV30'])if(!engineSource.includes(marker))failures.push(`V30 engine marker missing: ${marker}`);
for(const marker of ['6,616','4,704','40','15','dungeons','portals','companions','mounts','McGuffin','field encounter','travel plan','review-first'])if(!docs.toLowerCase().includes(marker.toLowerCase()))failures.push(`V30 documentation marker missing: ${marker}`);

const releaseMajor=Number(String(pkg.version||'0').split('.')[0]),lockMajor=Number(String(lock.version||'0').split('.')[0]),lockRootMajor=Number(String(lock.packages?.['']?.version||'0').split('.')[0]);
if(releaseMajor<30||releaseMajor!==lockMajor||releaseMajor!==lockRootMajor)failures.push('package/lock versions must stay aligned at release 30 or newer');
for(const script of ['validate-v30-content.js','validate-spinner-boundaries.js'])if(!String(pkg.scripts?.validate||'').includes(script))failures.push(`main validation script missing ${script}`);
if(!pkg.scripts?.['validate:v30']||!pkg.scripts?.['validate:boundaries'])failures.push('V30 dedicated validation scripts are missing');
const releaseTag=`V${releaseMajor}`;
if(!String(manifest.name||'').includes(releaseTag)||!String(manifest.short_name||'').includes(releaseTag)||!index.includes(`Multiverse Wheel ${releaseTag}`))failures.push(`current release branding is inconsistent for ${releaseTag}`);
if(!sw.includes(`multiverse-wheel-v${releaseMajor}-`))failures.push(`current service-worker cache is not versioned for ${releaseTag}`);

const report={schema:state.v30.schemaVersion,total:WORLD_CONTENT_META_V30.total,added:WORLD_CONTENT_META_V30.addedTotal,families:Object.keys(WORLD_CONTENT_META_V30.counts).length,newFamilies:WORLD_CONTENT_META_V30.newFamilies.length,context:context.length,encounterSlots:Object.keys(encounterA.resolvedAssets||{}).length,packageVersion:pkg.version,failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V30 content valid: ${report.total} total assets (+${report.added}), ${report.families} families (${report.newFamilies} new), ${report.context} context visuals, ${report.encounterSlots} encounter roles.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
