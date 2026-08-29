'use strict';

const fs=require('node:fs');
const path=require('node:path');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
const {migrateV16}=require('../js/domain/v16-engine.js');
const {V17_SCHEMA_VERSION,RealityRulesEngine,migrateV17,CHAIN_DEFINITIONS}=require('../js/domain/v17-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const value={seed:1701,spin:6,customCharacter:{homeworld:'Earth-Prime'},party:[],kits:[],artifacts:[]};migrateV16(value,[]);migrateV17(value,[]);
const engine=new RealityRulesEngine(),dna=engine.dna(value,'Earth-Prime'),routes=engine.routesFor(value,'Earth-Prime'),summary=engine.summary(value);
if(value.v17.schemaVersion!==V17_SCHEMA_VERSION)failures.push('V17 migration schema is not 17');
if(Object.keys(dna.laws||{}).length!==6)failures.push('Universe DNA does not expose all six law axes');
if(routes.length!==7||routes.filter(route=>route.secret).length!==2)failures.push('Reality route generation must provide five public plus two secret destinations');
if(summary.offeredQuests.length<3)failures.push('Faction quest board does not seed three offers');
if(Object.keys(CHAIN_DEFINITIONS).length<6)failures.push('Wheel current catalog is incomplete');
for(const modifier of Object.values(engine.ruleModifiers(value)))if(modifier<-.12||modifier>.12)failures.push(`Reality modifier escaped safety cap: ${modifier}`);

const bootstrap=fs.readFileSync(path.join(root,'js','bootstrap.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),css=fs.readFileSync(path.join(root,'styles','v17.css'),'utf8'),experience=fs.readFileSync(path.join(root,'js','v17-experience.js'),'utf8'),pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for(const ref of ['styles/v17.css','js/domain/v17-engine.js','js/v17-experience.js'])if(!bootstrap.includes(ref))failures.push(`bootstrap does not load ${ref}`);
for(const ref of ['styles/v17.css','js/domain/v17-engine.js','js/v17-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
for(const marker of ['data-v16-world-tab="dna"','data-v16-world-tab="routes"','data-v16-world-tab="quests"','v17Secret','FACTION QUEST COMPLETE'])if(!experience.includes(marker))failures.push(`V17 integration marker missing: ${marker}`);
for(const marker of ['v17-reality-beacon','v17-route-grid','v17-quest-grid','v17-favor-grid'])if(!css.includes(marker))failures.push(`V17 UI style marker missing: ${marker}`);
const packageMajor=Number(String(pkg.version||'0').split('.')[0]);if(!Number.isInteger(packageMajor)||packageMajor<17)failures.push(`package version ${pkg.version} predates V17`);
if(!String(pkg.scripts?.validate||'').includes('validate-v17-content.js')||!pkg.scripts?.['validate:v17'])failures.push('package validation scripts do not include V17');

const report={schema:value.v17.schemaVersion,dnaLaws:Object.keys(dna.laws),routes:{total:routes.length,secrets:routes.filter(route=>route.secret).length},quests:summary.offeredQuests.length,wheelCurrents:Object.keys(CHAIN_DEFINITIONS).length,packageVersion:pkg.version,failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V17 content valid: ${report.dnaLaws.length} reality laws, ${report.routes.total} destinations (${report.routes.secrets} secret), ${report.quests} quest offers, ${report.wheelCurrents} Wheel currents.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
