'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {loadRoster}=require('./roster-loader.js');
require('../js/domain/v14-engine.js');
const {HeroProgressionEngine,HeroArchiveEngine,NetworkProtocolEngine}=require('../js/domain/v15-engine.js');

const root=path.resolve(__dirname,'..'),failures=[],roster=loadRoster(root),catalog=JSON.parse(fs.readFileSync(path.join(root,'assets','game-asset-catalog.json'),'utf8'));
const expectedTransformations=roster.reduce((sum,character)=>sum+(character.forms||[]).length,0);
const context=vm.createContext({console});for(const file of ['base.js','expansion.js','mega-roster.js'])vm.runInContext(fs.readFileSync(path.join(root,'js','data',file),'utf8'),context,{filename:file});
const globalForms=vm.runInContext('DATA.transformations.length',context),expectedTotal=expectedTransformations+globalForms,transformations=catalog.transformations||[];
if(transformations.length!==expectedTotal)failures.push(`catalog has ${transformations.length} transformations, expected ${expectedTotal}`);
const ids=new Set();for(const asset of transformations){if(ids.has(asset.id))failures.push(`duplicate transformation id ${asset.id}`);ids.add(asset.id);if(asset.kind!=='transformation'||!asset.name||!/^global:|^source:/.test(asset.id))failures.push(`invalid transformation catalog entry ${asset.id}`);}
const html=fs.readFileSync(path.join(root,'Multiverse_Wheel_V8_1326_Real_Repo_Images.html'),'utf8');for(const ref of ['styles/v15.css','js/domain/v15-engine.js','js/v15-experience.js'])if(!html.includes(ref))failures.push(`HTML does not load ${ref}`);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');for(const ref of ['styles/v15.css','js/domain/v15-engine.js','js/v15-experience.js'])if(!sw.includes(ref))failures.push(`service worker does not cache ${ref}`);
const progress=new HeroProgressionEngine();if(progress.activePowerSetLimit(1)!==1||progress.techniqueSlotLimit(1)!==2||progress.formLevel(0,'source')<4)failures.push('level-one gates are not restrictive');
if(typeof HeroArchiveEngine!=='function'||typeof NetworkProtocolEngine!=='function')failures.push('portable hero or network protocol engine missing');
const downloader=fs.readFileSync(path.join(root,'download_game_assets.py'),'utf8');for(const marker of ['verified_transformation_images','"transformations"','threshold = 100','duplicate_live_paths','--allow-duplicate'])if(!downloader.includes(marker))failures.push(`asset downloader safeguard missing: ${marker}`);
const report={creator:{lineages:Object.keys(globalThis.MultiverseDomain.LINEAGES).length,callings:Object.keys(globalThis.MultiverseDomain.CALLINGS).length,backgrounds:Object.keys(globalThis.MultiverseDomain.BACKGROUNDS).length,skills:Object.keys(globalThis.MultiverseDomain.SKILLS).length},progression:{levelOneSources:progress.activePowerSetLimit(1),levelOneTechniques:progress.techniqueSlotLimit(1),firstSourceFormLevel:progress.formLevel(0,'source')},assets:{globalForms,characterForms:expectedTransformations,total:transformations.length},failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else console.log(`V15 content valid: ${report.creator.lineages} lineages, ${report.creator.callings} callings, ${report.creator.skills} skills, ${report.assets.total} exact-ID transformation targets, Level 1 gates ${report.progression.levelOneSources} source / ${report.progression.levelOneTechniques} techniques.`);
if(failures.length){console.error(`Failures: ${failures.join('; ')}`);process.exitCode=1;}
