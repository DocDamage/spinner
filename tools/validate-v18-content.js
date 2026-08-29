'use strict';

const fs=require('node:fs');
const path=require('node:path');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
require('../js/domain/v16-engine.js');
require('../js/domain/v17-engine.js');
const {V18_SCHEMA_VERSION,RARITY_TIERS,CURRENCIES,RECIPES,EconomyCraftingEngine,migrateV18}=require('../js/domain/v18-engine.js');

const root=path.resolve(__dirname,'..'),failures=[];
const artifacts=[{id:'validator-relic',name:'Validator Relic',powers:['Signal'],bonuses:{energy:5}}];
const state=migrateV18({seed:18,spin:5,credits:1000,customCharacter:{homeworld:'Earth-Prime'},party:[],kits:[],artifacts:[]},artifacts),engine=new EconomyCraftingEngine(),market=engine.rotateMarket(state,artifacts);
if(V18_SCHEMA_VERSION!==18||state.schemaVersion<18)failures.push('V18 schema migration missing');
if(RARITY_TIERS.length!==8||RARITY_TIERS.at(-1)?.id!=='forbidden')failures.push('rarity ladder incomplete');
for(const key of ['credits','cosmicFragments','salvage','voidMarks','bountySeals'])if(!CURRENCIES[key])failures.push(`currency missing: ${key}`);
for(const key of ['field-forge','masterwork','forbidden'])if(!RECIPES[key])failures.push(`craft recipe missing: ${key}`);
if(!market.offers.some(item=>item.kind==='equipment')||!market.offers.some(item=>item.kind==='material'))failures.push('market stock incomplete');
engine.addCurrency(state,'salvage',50);engine.addCurrency(state,'cosmicFragments',10);const crafted=engine.craft(state,'field-forge');if(!crafted.ok||!state.lootInventory.length)failures.push('crafting does not create inventory');
if(!engine.equip(state,state.lootInventory[0]?.id).ok||!Object.values(engine.equippedBonuses(state).stats).some(value=>value>0))failures.push('equipment does not affect stat model');
const html=fs.readFileSync(path.join(root,'Multiverse_Wheel_V8_1326_Real_Repo_Images.html'),'utf8'),bootstrap=fs.readFileSync(path.join(root,'js','bootstrap.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const ref of ['styles/v18.css','js/domain/v18-engine.js','js/v18-experience.js'])if(!bootstrap.includes(ref)&&!sw.includes(ref))failures.push(`V18 runtime reference missing: ${ref}`);
for(const ref of ['styles/v18.css','js/domain/v18-engine.js','js/v18-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));if(pkg.version!=='18.0.0')failures.push('package version is not 18.0.0');if(!String(manifest.name).includes('V18'))failures.push('PWA manifest is not V18');
const report={schema:state.v18.schemaVersion,rarities:RARITY_TIERS.length,currencies:Object.keys(CURRENCIES).length,recipes:Object.keys(RECIPES).length,offers:market.offers.length,contracts:state.v18.contracts.length,failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V18 content valid: ${report.rarities} rarities, ${report.currencies} currencies, ${report.recipes} recipes, ${report.offers} market offers, ${report.contracts} contracts.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
