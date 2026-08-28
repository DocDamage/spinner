'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRoster(root = path.resolve(__dirname,'..')) {
  const context = vm.createContext({console});
  for (const file of ['base.js','expansion.js','mega-roster.js']) {
    const source = fs.readFileSync(path.join(root,'js','data',file),'utf8');
    vm.runInContext(source,context,{filename:file});
  }
  const roster = vm.runInContext('DATA.characters',context);
  const v5Lines = fs.readFileSync(path.join(root,'js','v5-systems.js'),'utf8').split(/\r?\n/);
  const literal = name => {
    const line = v5Lines.find(item => item.includes(`const ${name}=`));
    if (!line) throw new Error(`Unable to locate ${name}.`);
    return vm.runInNewContext(`(${line.match(new RegExp(`const ${name}=(.*);`))[1]})`);
  };
  const origins = literal('V5_ORIGINS');
  const variants = literal('V5_VARIANTS');
  const depthOrigins = literal('V51_ORIGINS');
  const byId = new Map(roster.map(character => [character.id,character]));
  const addOrigins = items => items.forEach(character => {
    if (byId.has(character.id)) return;
    roster.push(character);
    byId.set(character.id,character);
  });
  const addVariants = () => variants.forEach(([baseId,id,name,version,boost,extraPowers,extraTags]) => {
    const base = byId.get(baseId);
    if (!base || byId.has(id)) return;
    const character = structuredClone(base);
    Object.assign(character,{id,name,version});
    for (const [key,value] of Object.entries(boost || {})) character.stats[key] = Math.min(180,Number(character.stats[key] || 0) + value);
    character.powers = [...new Set([...(character.powers || []),...(extraPowers || [])])];
    character.tags = [...new Set([...(character.tags || []),...(extraTags || [])])];
    character.signature = extraPowers?.[0] || character.signature;
    roster.push(character);
    byId.set(id,character);
  });
  addOrigins(origins);
  addVariants();
  addOrigins(depthOrigins);
  addVariants();
  return roster;
}

module.exports = {loadRoster};
