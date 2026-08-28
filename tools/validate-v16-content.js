'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),failures=[];
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
const {V16_SCHEMA_VERSION,LivingMultiverseEngine,migrateV16}=require('../js/domain/v16-engine.js');
const roster=[{id:'hero',name:'Hero',universe:'Prime'},{id:'rival',name:'Rival',universe:'Elsewhere'}];
const state=migrateV16({seed:16,baseId:'hero',party:[],kits:[],artifacts:[],customCharacter:{homeworld:'Prime'}},roster),engine=new LivingMultiverseEngine();
const stable=JSON.stringify(state);migrateV16(state,roster);if(JSON.stringify(state)!==stable)failures.push('V16 migration is not idempotent');
if(state.v16.schemaVersion!==V16_SCHEMA_VERSION)failures.push('V16 schema version missing');
if(Object.keys(state.v16.factions).length<6)failures.push('Living Multiverse requires at least six seeded factions');
engine.registerNemesis(state,roster[1],'Validation rivalry');engine.advance(state,{roster,universe:'Prime',type:'battle',label:'Validation battle'});engine.travel(state,'Elsewhere');
if(!state.v16.worldEvents.length)failures.push('world simulation produced no events');
if(!state.v16.memory.length)failures.push('memory ledger produced no records');
if(state.v16.currentUniverse!=='Elsewhere')failures.push('world travel did not change focus');
if(!state.v16.nemeses.rival)failures.push('nemesis state did not persist');
const bootstrap=fs.readFileSync(path.join(root,'js','bootstrap.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const ref of ['styles/v16.css','js/domain/v16-engine.js','js/v16-experience.js']){if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);}
const report={schema:state.v16.schemaVersion,factions:Object.keys(state.v16.factions).length,worlds:Object.keys(state.v16.universes).length,events:state.v16.worldEvents.length,memories:state.v16.memory.length,nemeses:Object.keys(state.v16.nemeses).length,failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V16 content valid: ${report.factions} factions, ${report.worlds} worlds, ${report.events} world events, ${report.nemeses} nemesis records.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
