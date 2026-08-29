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
const {V20_SCHEMA_VERSION,RelicMasteryEngine,migrateV20,SET_DEFS,RELIC_PERSONALITIES}=require('../js/domain/v20-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[
  {id:'ally-a',name:'Aegis',universe:'Marvel',role:'support',tags:['healing','support']},
  {id:'ally-b',name:'Blitz',universe:'DC',role:'speedster',tags:['speed','martial']}
];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
const state={seed:2001,spin:8,credits:900,customCharacter:{codename:'Validator',homeworld:'Earth-Prime'},party:['ally-a','ally-b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'}};
migrateV20(state,artifacts,roster);
const engine=new RelicMasteryEngine(),gear=state.v20.gear['gear-a'],relic=state.v20.relics['relic-a'];
if(state.v20.schemaVersion!==V20_SCHEMA_VERSION)failures.push('V20 migration schema is not 20');
if(!gear||!gear.setId||gear.level!==1)failures.push('existing V18 equipment was not upgraded into V20 mastery');
if(!relic?.personality?.id||!relic?.quest?.id)failures.push('owned artifact lacks persistent V20 personality/quest state');
if(Object.keys(SET_DEFS).length<5)failures.push('equipment set catalog is incomplete');
if(Object.keys(RELIC_PERSONALITIES).length<6)failures.push('relic personality catalog is incomplete');
for(let i=0;i<20;i++)engine.noteCommerce(state,'purchase',100);const discount=engine.vendorDiscount(state);if(!(discount>0&&discount<=.14))failures.push('vendor loyalty discount escaped expected bounds');
const pair=new global.MultiverseDomain.PartyConsequencesEngine().pair(state,'ally-a','ally-b',roster);Object.assign(pair,{compatibility:95,trust:95,friendship:95,rivalry:0,resentment:0});state.v19.morale=90;Object.assign(relic,{awakened:true,bearerId:'hero',status:'owned'});if(!engine.convergence(state).ready)failures.push('Legacy Convergence threshold does not unlock');

const bootstrap=fs.readFileSync(path.join(root,'js','bootstrap.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),css=fs.readFileSync(path.join(root,'styles','v20.css'),'utf8'),experience=fs.readFileSync(path.join(root,'js','v20-experience.js'),'utf8'),pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
for(const ref of ['styles/v20.css','js/domain/v20-engine.js','js/v20-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v20.css','js/domain/v20-engine.js','js/v20-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
for(const marker of ['oldCaches','oldCaches.length','self.clients.claim()'])if(!sw.includes(marker))failures.push(`service-worker first-install guard missing: ${marker}`);
for(const marker of ['LEGACY CONVERGENCE','RELIC BONDS','data-v20-forge','data-v20-purify','data-v20-signature','data-v20-dispute'])if(!experience.includes(marker))failures.push(`V20 integration marker missing: ${marker}`);
for(const marker of ['v20-relic-beacon','v20-grid','v20-convergence','v20-relic-bars','v20-legacy-forge'])if(!css.includes(marker))failures.push(`V20 UI style marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<20)failures.push(`package version is ${pkg.version}, expected major >= 20`);
if(!String(pkg.scripts?.validate||'').includes('validate-v20-content.js')||!pkg.scripts?.['validate:v20'])failures.push('package validation scripts do not include V20');
const expectedBrand=`V${major}`;if(!Number.isFinite(major)||!String(manifest.name||'').includes(expectedBrand)||!String(manifest.short_name||'').includes(expectedBrand))failures.push(`PWA manifest branding must match current package major ${expectedBrand}`);

const report={schema:state.v20.schemaVersion,gearSet:gear?.setId,relicPersonality:relic?.personality?.id,setFamilies:Object.keys(SET_DEFS).length,relicPersonalities:Object.keys(RELIC_PERSONALITIES).length,vendorDiscount:discount,legacyConvergence:engine.convergence(state).ready,firstInstallClaimGuard:sw.includes('oldCaches.length'),failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V20 content valid: ${report.setFamilies} equipment sets, ${report.relicPersonalities} relic personalities, vendor discount ${Math.round(report.vendorDiscount*100)}%, Legacy Convergence ${report.legacyConvergence?'ready':'blocked'}, first-install claim guard ${report.firstInstallClaimGuard?'on':'off'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
