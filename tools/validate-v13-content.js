'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {loadRoster}=require('./roster-loader.js');
const {canonicalUniverseGroups,identityFor,UNIVERSE_EVENT_PACKS,V13StateEngine,NarrativeExperienceEngine}=require('../js/domain/v13-engine.js');

const root=path.resolve(__dirname,'..'),roster=loadRoster(root),failures=[];
const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'').toLowerCase();
const ids=new Map();for(const character of roster)ids.set(character.id,(ids.get(character.id)||0)+1);
const duplicateIds=[...ids].filter(([,count])=>count>1).map(([id,count])=>({id,count}));if(duplicateIds.length)failures.push(`${duplicateIds.length} duplicate roster ids`);

const identities=roster.map(identityFor),invalidIdentities=identities.filter(identity=>!identity.role||!identity.passive?.name||!identity.ultimate?.name||identity.moves.length<1||identity.weaknessTags.length<1);if(invalidIdentities.length)failures.push(`${invalidIdentities.length} invalid character identities`);
const generatedCoverage=Object.fromEntries(['role','passive','ultimate','moves','weaknessTags'].map(field=>[field,identities.filter(identity=>identity.generated[field]).length]));
const aliasGroups=canonicalUniverseGroups(roster).filter(group=>group.sourceLabels.length>1).map(group=>({universe:group.universe,sourceLabels:group.sourceLabels,total:group.total}));

const packIds=new Set(),eventIds=new Set(),callbackTypes=new Set();
for(const pack of UNIVERSE_EVENT_PACKS){
  if(packIds.has(pack.id))failures.push(`Duplicate event pack id ${pack.id}`);packIds.add(pack.id);
  if(!pack.universe||pack.locations.length<3||pack.factions.length<3||pack.events.length<3)failures.push(`Incomplete event pack ${pack.id}`);
  for(const event of pack.events){
    if(eventIds.has(event.id))failures.push(`Duplicate universe event id ${event.id}`);eventIds.add(event.id);
    if(!event.title||!event.location||!event.faction||!event.hazard||event.choices.length<2)failures.push(`Incomplete universe event ${event.id}`);
    for(const choice of event.choices){if(!choice.id||!choice.label||!choice.cost||!choice.gain||!choice.effect)failures.push(`Incomplete choice in ${event.id}`);if(choice.effect?.callback?.type)callbackTypes.add(choice.effect.callback.type);}
  }
}
const callbackState=new V13StateEngine().migrate({spin:9}),narrative=new NarrativeExperienceEngine();
for(const type of callbackTypes){const callback=narrative.scheduleCallback(callbackState,{id:`validate-${type}`,type,dueSpin:9});const outcome=narrative.resolveCallback(callbackState,callback.id);if(!outcome?.title||!outcome.effect)failures.push(`Callback ${type} has no resolvable outcome`);}

const mediaContext=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(root,'character_image_manifest.js'),'utf8'),mediaContext,{filename:'character_image_manifest.js'});const manifest=mediaContext.window.CHARACTER_IMAGE_MANIFEST||[],mediaNames=new Set(manifest.map(item=>normalize(item.name))),missingMedia=roster.filter(character=>!mediaNames.has(normalize(character.name))).map(character=>({id:character.id,name:character.name,universe:character.universe}));

const webManifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));if(!webManifest.name||!webManifest.start_url||!fs.existsSync(path.join(root,webManifest.start_url)))failures.push('Web manifest start URL is invalid');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),offlineRefs=[...sw.matchAll(/'\.\/([^']+)'/g)].map(match=>match[1]).filter(ref=>ref&&!ref.endsWith('/'));const missingOffline=[...new Set(offlineRefs)].filter(ref=>!fs.existsSync(path.join(root,ref)));if(missingOffline.length)failures.push(`Missing offline assets: ${missingOffline.join(', ')}`);

const report={
  roster:{total:roster.length,duplicateIds,canonicalUniverses:canonicalUniverseGroups(roster).length,aliasGroups,generatedIdentityCoverage:generatedCoverage,invalidIdentityCount:invalidIdentities.length},
  media:{manifestEntries:manifest.length,matchedByName:roster.length-missingMedia.length,missingCount:missingMedia.length,missing:missingMedia.slice(0,50)},
  story:{packCount:UNIVERSE_EVENT_PACKS.length,eventCount:eventIds.size,callbackTypes:[...callbackTypes].sort()},
  offline:{shellReferenceCount:new Set(offlineRefs).size,missing:missingOffline},
  failures
};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else{
  console.log(`V13 content valid: ${report.roster.total} characters, ${report.roster.canonicalUniverses} canonical universes, ${report.story.packCount} story packs / ${report.story.eventCount} events, ${report.offline.shellReferenceCount} offline shell references.`);
  console.log(`Identity fallbacks: role ${generatedCoverage.role}, passive ${generatedCoverage.passive}, ultimate ${generatedCoverage.ultimate}, moves ${generatedCoverage.moves}, weakness tags ${generatedCoverage.weaknessTags}.`);
  console.log(`Media report: ${report.media.matchedByName}/${report.roster.total} matched by normalized name; ${report.media.missingCount} require resolver fallback or new art.`);
  if(aliasGroups.length)console.log(`Canonical alias groups: ${aliasGroups.map(group=>`${group.universe} (${group.sourceLabels.join(' / ')})`).join('; ')}.`);
  if(failures.length)console.error(`Failures: ${failures.join('; ')}`);
}
if(failures.length)process.exitCode=1;
