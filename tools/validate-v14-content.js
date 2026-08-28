'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {loadRoster}=require('./roster-loader.js');
const {MACGUFFINS,SAGA_CHAPTERS}=require('../js/domain/v14-engine.js');

const root=path.resolve(__dirname,'..'),failures=[],roster=loadRoster(root);
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets','game-asset-catalog.json'),'utf8'));
const context=vm.createContext({self:{}});vm.runInContext(fs.readFileSync(path.join(root,'game_asset_manifest.js'),'utf8'),context,{filename:'game_asset_manifest.js'});const manifest=context.self.GAME_ASSET_MANIFEST||[];
const expected={character:catalog.characters.length,item:catalog.items.length,macguffin:catalog.macguffins.length};
if(expected.character!==roster.length)failures.push(`catalog has ${expected.character} characters, runtime has ${roster.length}`);
if(expected.item!==32)failures.push(`expected 32 item records, found ${expected.item}`);if(expected.macguffin!==10)failures.push(`expected 10 MacGuffins, found ${expected.macguffin}`);
if(SAGA_CHAPTERS.length!==10||new Set(SAGA_CHAPTERS.map(item=>item.id)).size!==10)failures.push('Chronicle Saga must contain 10 unique chapters');
if(MACGUFFINS.length!==10||new Set(MACGUFFINS.map(item=>item.id)).size!==10)failures.push('Chronicle Saga must contain 10 unique MacGuffins');
for(const chapter of SAGA_CHAPTERS){if(chapter.choices.length!==4||!chapter.macguffin?.id||!chapter.objective||!chapter.reveal)failures.push(`incomplete chapter ${chapter.id}`);}
const keys=new Set();for(const entry of manifest){const key=`${entry.kind}:${entry.id}`;if(keys.has(key))failures.push(`duplicate manifest entry ${key}`);keys.add(key);const target=path.join(root,entry.path);if(!fs.existsSync(target))failures.push(`missing active asset ${entry.path}`);if(!entry.width||!entry.height||!entry.mime||!entry.sha256)failures.push(`incomplete manifest metadata ${key}`);const source=`${target}.source.json`;if(!fs.existsSync(source))failures.push(`missing source record ${path.relative(root,source)}`);}
for(const item of catalog.items)if(!keys.has(`item:${item.id}`))failures.push(`item has no active image: ${item.id}`);for(const item of catalog.macguffins)if(!keys.has(`macguffin:${item.id}`))failures.push(`MacGuffin has no active image: ${item.id}`);
const html=fs.readFileSync(path.join(root,'Multiverse_Wheel_V8_1326_Real_Repo_Images.html'),'utf8');for(const ref of ['game_asset_manifest.js','styles/v14.css','js/domain/v14-engine.js','js/v14-experience.js'])if(!html.includes(ref))failures.push(`HTML does not load ${ref}`);
const report={catalog:expected,active:{total:manifest.length,characters:manifest.filter(item=>item.kind==='character').length,items:manifest.filter(item=>item.kind==='item').length,macguffins:manifest.filter(item=>item.kind==='macguffin').length},story:{chapters:SAGA_CHAPTERS.length,macguffins:MACGUFFINS.length,choices:SAGA_CHAPTERS.reduce((sum,item)=>sum+item.choices.length,0)},failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V14 content valid: ${report.catalog.character} catalog characters; ${report.active.items} item images; ${report.active.macguffins} MacGuffin images; ${report.story.chapters} chapters / ${report.story.choices} authored choices.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
