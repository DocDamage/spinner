'use strict';

const fs=require('node:fs');
const path=require('node:path');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
require('../js/domain/v16-engine.js');
require('../js/domain/v17-engine.js');
require('../js/domain/v18-engine.js');
const {V19_SCHEMA_VERSION,PartyConsequencesEngine,migrateV19,AXES}=require('../js/domain/v19-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const roster=[
  {id:'ally-a',name:'Aegis',universe:'Marvel',role:'support',tags:['healing','support']},
  {id:'ally-b',name:'Blitz',universe:'DC',role:'speedster',tags:['speed','martial']}
];
const state={seed:1901,spin:8,credits:500,customCharacter:{homeworld:'Earth-Prime'},party:['ally-a','ally-b'],kits:[],artifacts:[]};migrateV19(state,roster);
const engine=new PartyConsequencesEngine(),summary=engine.summary(state,roster),pair=engine.pair(state,'ally-a','ally-b',roster);
if(state.v19.schemaVersion!==V19_SCHEMA_VERSION)failures.push('V19 migration schema is not 19');
if(Object.keys(state.v19.records['ally-a']?.axes||{}).length!==AXES.length)failures.push('relationship records do not expose all seven axes');
if(!Number.isFinite(pair.compatibility)||pair.compatibility<10||pair.compatibility>95)failures.push('pair compatibility is outside expected bounds');
if(!summary.personalQuests['ally-a']||!summary.personalQuests['ally-b'])failures.push('personal quests were not seeded for active allies');
if(summary.morale<0||summary.morale>100)failures.push('party morale escaped bounds');
const surgePair=engine.pair(state,'ally-a','ally-b',roster);Object.assign(surgePair,{compatibility:95,trust:95,friendship:95,rivalry:0,resentment:0});state.v19.morale=90;if(!engine.bondSurge(state,roster).ready)failures.push('Resonant Ascension threshold does not unlock');

const bootstrap=fs.readFileSync(path.join(root,'js','bootstrap.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),css=fs.readFileSync(path.join(root,'styles','v19.css'),'utf8'),experience=fs.readFileSync(path.join(root,'js','v19-experience.js'),'utf8'),pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for(const ref of ['styles/v19.css','js/domain/v19-engine.js','js/v19-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v19.css','js/domain/v19-engine.js','js/v19-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
for(const marker of ['PARTY CONSEQUENCES','RESONANT ASCENSION','data-v19-bench','data-v19-incident','PERMADEATH'])if(!experience.includes(marker))failures.push(`V19 integration marker missing: ${marker}`);
for(const marker of ['v19-party-beacon','v19-team-layer','v19-axes','v19-incidents','v19-surge'])if(!css.includes(marker))failures.push(`V19 UI style marker missing: ${marker}`);
const major=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isFinite(major)||major<19)failures.push(`package version is ${pkg.version}, expected major >= 19`);
if(!String(pkg.scripts?.validate||'').includes('validate-v19-content.js')||!pkg.scripts?.['validate:v19'])failures.push('package validation scripts do not include V19');

const report={schema:state.v19.schemaVersion,axes:AXES.length,morale:summary.morale,pairCompatibility:pair.compatibility,personalQuests:Object.keys(summary.personalQuests).length,resonantAscension:engine.bondSurge(state,roster).ready,failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V19 content valid: ${report.axes} relationship axes, morale ${report.morale}, pair compatibility ${report.pairCompatibility}, ${report.personalQuests} personal quests, Resonant Ascension ${report.resonantAscension?'ready':'blocked'}.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
