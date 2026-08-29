'use strict';

(function attachV26Engine(root,factory){
  const api=factory(root);
  root.MultiverseDomain=root.MultiverseDomain||{};
  Object.assign(root.MultiverseDomain,api);
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window,function(root){
  const V26_SCHEMA_VERSION=26;
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const hash32=value=>{if(root.MultiverseDomain?.hash32)return root.MultiverseDomain.hash32(String(value));let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const uniq=list=>[...new Set((list||[]).map(String).filter(Boolean))];
  const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const tokenSet=value=>new Set(normalize(value).split(/\s+/).filter(Boolean));
  const catalog=()=>root.WORLD_CONTENT_CATALOG||(typeof require==='function'?require('../data/world-content.js').WORLD_CONTENT_CATALOG:[]);
  const kindTargets={
    world:['place','building'],travel:['place','vehicle'],shop:['building','interior','item','npc'],
    stronghold:['stronghold','building','interior','vehicle','item','npc'],
    settlement:['settlement','building','place','npc','item'],
    operation:['place','interior','vehicle','npc','item'],
    activity:['activity','place','vehicle','npc'],crisis:['crisis','place','vehicle','item','npc'],
    faction:['building','stronghold','vehicle','npc','item'],inventory:['item','icon'],ui:['icon']
  };

  class WorldContentEngine{
    ensure(state={},artifacts=[],roster=[]){
      const needsMigration=Number(state.v26?.schemaVersion||0)<V26_SCHEMA_VERSION;
      if(needsMigration&&root.MultiverseDomain?.migrateV25)root.MultiverseDomain.migrateV25(state,artifacts,roster);
      state.v26=state.v26&&typeof state.v26==='object'?state.v26:{};
      const v=state.v26;
      v.schemaVersion=V26_SCHEMA_VERSION;state.v26Version=V26_SCHEMA_VERSION;state.schemaVersion=Math.max(Number(state.schemaVersion||0),V26_SCHEMA_VERSION);
      v.assignments=v.assignments&&typeof v.assignments==='object'?v.assignments:{};
      v.favorites=uniq(v.favorites).filter(id=>this.find(id));
      v.recent=uniq(v.recent).filter(id=>this.find(id)).slice(0,30);
      v.settings={showContextArt:true,atlasDense:false,...(v.settings||{})};
      v.stats={atlasViews:0,assetsSeen:0,assignmentsCreated:0,favoritesAdded:0,...(v.stats||{})};
      this.syncAssignments(state);
      return state;
    }

    catalog(){return catalog();}
    find(id){return this.catalog().find(asset=>asset.id===String(id||''))||null;}
    kinds(){return this.catalog().reduce((out,item)=>(out[item.kind]=(out[item.kind]||0)+1,out),{});}
    query({kind='',subtype='',rarity='',search='',tags=[],usageTarget='',limit=0}={}){
      const words=tokenSet(search),wantedTags=uniq(tags).map(normalize);
      let result=this.catalog().filter(asset=>{
        if(kind&&asset.kind!==kind)return false;
        if(subtype&&asset.subtype!==subtype)return false;
        if(rarity&&asset.rarity!==rarity)return false;
        if(usageTarget&&!asset.usageTargets?.includes(usageTarget))return false;
        if(wantedTags.length&&!wantedTags.every(tag=>asset.tags.some(x=>normalize(x)===tag)))return false;
        if(words.size){
          const hay=tokenSet([asset.name,asset.kind,asset.subtype,asset.world,asset.faction,...asset.tags,...asset.usageTargets].join(' '));
          for(const word of words)if(!hay.has(word)&&![...hay].some(token=>token.includes(word)))return false;
        }
        return true;
      });
      return limit>0?result.slice(0,limit):result;
    }

    score(asset,{usageTarget='',tags=[],words=[]}={}){
      let score=0;
      if(usageTarget&&asset.usageTargets?.includes(usageTarget))score+=60;
      const targetTags=uniq(tags).map(normalize),assetTags=new Set((asset.tags||[]).map(normalize));
      for(const tag of targetTags)if(assetTags.has(tag))score+=14;
      const hay=normalize([asset.name,asset.subtype,asset.world,...asset.tags].join(' '));
      for(const word of words.map(normalize).filter(Boolean))if(hay.includes(word))score+=5;
      if(asset.rarity==='legendary')score+=3;
      return score;
    }

    pick(state,{usageTarget='',kinds=[],tags=[],words=[],salt='',exclude=[]}={}){
      const desired=kinds.length?kinds:(kindTargets[usageTarget]||[]);
      const blocked=new Set(exclude);
      const pool=this.catalog().filter(asset=>(!desired.length||desired.includes(asset.kind))&&!blocked.has(asset.id));
      if(!pool.length)return null;
      const scored=pool.map(asset=>({asset,score:this.score(asset,{usageTarget,tags,words})})).sort((a,b)=>b.score-a.score||a.asset.id.localeCompare(b.asset.id));
      const best=scored[0]?.score||0,candidates=scored.filter(row=>row.score>=Math.max(0,best-8)).map(row=>row.asset);
      return candidates[hash32(`${state.seed||0}|${usageTarget}|${salt}`)%candidates.length]||candidates[0]||null;
    }

    assign(state,ownerType,ownerId,{kinds=[],tags=[],words=[],slots=3}={}){
      const key=`${ownerType}:${String(ownerId||'default')}`,existing=state.v26?.assignments?.[key];
      if(existing&&Array.isArray(existing.assetIds)&&existing.assetIds.every(id=>this.find(id)))return existing;
      const assetIds=[];
      for(let slot=0;slot<Math.max(1,Math.min(5,Number(slots)||3));slot++){
        const asset=this.pick(state,{usageTarget:ownerType,kinds,tags,words,salt:`${key}|${slot}`,exclude:assetIds});
        if(asset)assetIds.push(asset.id);
      }
      const assignment={key,ownerType:String(ownerType),ownerId:String(ownerId||'default'),assetIds,createdAtSpin:Number(state.spin||0)};
      state.v26.assignments[key]=assignment;state.v26.stats.assignmentsCreated+=1;
      return assignment;
    }

    assignmentAssets(state,ownerType,ownerId,options={}){
      return this.assign(state,ownerType,ownerId,options).assetIds.map(id=>this.find(id)).filter(Boolean);
    }

    syncAssignments(state){
      if(!state.v26)return state;
      const sync=(type,id,options)=>{if(id)this.assign(state,type,id,options);};
      const currentUniverse=state.v16?.currentUniverse||state.customCharacter?.homeworld||'Earth-Prime';
      sync('world',currentUniverse,{tags:[currentUniverse],slots:4});
      for(const hold of Object.values(state.v21?.strongholds||{}))sync('stronghold',hold.id,{tags:[hold.type,hold.status,hold.universe],words:[hold.name],slots:4});
      for(const town of Object.values(state.v22?.settlements||{}))sync('settlement',town.id,{tags:[town.status,town.universe],words:[town.name,town.locationId],slots:4});
      for(const op of Object.values(state.v23?.operations||{}))sync('operation',op.id,{tags:[op.type,op.universe,op.status],words:[op.label,op.objective],slots:4});
      for(const activity of Object.values(state.v24?.activities||{}))sync('activity',activity.id,{tags:[activity.family,activity.universe,activity.status],words:[activity.label,activity.venue],slots:4});
      for(const crisis of Object.values(state.v25?.crises||{}))sync('crisis',crisis.id,{tags:[crisis.family,crisis.primaryUniverse,crisis.status],words:[crisis.label],slots:4});
      return state;
    }

    context(state,type,id='',limit=4){
      const mapping=kindTargets[type]||[];
      const assets=this.assignmentAssets(state,type,id||'default',{kinds:mapping,slots:Math.max(1,Math.min(5,limit))});
      return assets.slice(0,limit);
    }

    markSeen(state,id){
      const asset=this.find(id);if(!asset||!state.v26)return false;
      state.v26.recent=[id,...state.v26.recent.filter(x=>x!==id)].slice(0,30);
      state.v26.stats.assetsSeen+=1;return true;
    }

    toggleFavorite(state,id){
      const asset=this.find(id);if(!asset||!state.v26)return{ok:false,error:'World asset not found.'};
      const set=new Set(state.v26.favorites),added=!set.has(id);added?set.add(id):set.delete(id);
      state.v26.favorites=[...set];if(added)state.v26.stats.favoritesAdded+=1;
      return{ok:true,added,asset:clone(asset)};
    }

    summary(state){
      this.ensure(state);
      const counts=this.kinds(),assignments=Object.values(state.v26.assignments);
      return{schemaVersion:V26_SCHEMA_VERSION,total:this.catalog().length,counts,assignments:assignments.length,favorites:state.v26.favorites.length,recent:state.v26.recent.map(id=>this.find(id)).filter(Boolean),stats:clone(state.v26.stats)};
    }
  }

  function migrateV26(state={},artifacts=[],roster=[]){return new WorldContentEngine().ensure(state,artifacts,roster);}
  return {V26_SCHEMA_VERSION,WorldContentEngine,migrateV26,WORLD_CONTENT_KIND_TARGETS_V26:kindTargets};
});
