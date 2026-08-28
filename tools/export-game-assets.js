'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {loadRoster}=require('./roster-loader.js');
const {MACGUFFINS}=require('../js/domain/v14-engine.js');

const root=path.resolve(__dirname,'..');
const context=vm.createContext({console});
for(const file of ['base.js','expansion.js','mega-roster.js']){
  vm.runInContext(fs.readFileSync(path.join(root,'js','data',file),'utf8'),context,{filename:file});
}
const artifacts=vm.runInContext('DATA.artifacts',context);
const transformations=vm.runInContext('DATA.transformations',context);
const characters=loadRoster(root);
const characterTransformations=characters.flatMap(character=>(character.forms||[]).map((name,index)=>({
  kind:'transformation',id:`source:${character.id}:${index}`,name,sourceType:'character',characterId:character.id,
  characterName:character.name,universe:character.universe,version:character.version,index
})));
const catalog={
  version:2,
  generatedAt:new Date().toISOString(),
  characters:characters.map(({id,name,universe,version})=>({kind:'character',id,name,universe,version})),
  items:artifacts.map(({id,name,universe})=>({kind:'item',id,name,universe})),
  macguffins:MACGUFFINS.map(({id,name,chapter,summary})=>({kind:'macguffin',id,name,universe:'Multiverse Wheel — Chronicle Saga',chapter,summary})),
  transformations:[
    ...transformations.map(({id,name,source,tags})=>({kind:'transformation',id:`global:${id}`,name,sourceType:'global',characterName:source||'',universe:source||'Crossover',tags:tags||[]})),
    ...characterTransformations
  ]
};
const destination=path.join(root,'assets','game-asset-catalog.json');
fs.writeFileSync(destination,`${JSON.stringify(catalog,null,2)}\n`,'utf8');
console.log(`Wrote ${catalog.characters.length} characters, ${catalog.items.length} items, ${catalog.macguffins.length} MacGuffins, and ${catalog.transformations.length} exact-ID transformations to ${path.relative(root,destination)}.`);
