'use strict';
(function attachV31Engine(root,factory){
  const api=factory(root);
  root.MultiverseDomain=root.MultiverseDomain||{};
  Object.assign(root.MultiverseDomain,api);
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window,function(root){
  const V31_SCHEMA_VERSION=31;
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const uniq=list=>[...new Set((list||[]).map(value=>String(value||'').trim()).filter(Boolean))];

  const PROFILES=Object.freeze({
    origin:{usageTarget:'world',roles:[['place','building','district','landmark'],['flora','fauna','weather','anomaly'],['organization','npc','companion','service'],['route','portal','transit','vehicle']]},
    battle:{usageTarget:'operation',roles:[['place','dungeon','ruin','stronghold'],['encounter','hazard','anomaly','weather'],['weapon','armor','technology','vehicle'],['organization','npc','companion','relic']]},
    boss:{usageTarget:'crisis',roles:[['landmark','stronghold','dungeon','ruin'],['crisis','anomaly','hazard','weather'],['weapon','armor','technology','relic'],['organization','encounter','vehicle','treasure']]},
    power:{usageTarget:'inventory',roles:[['technology','weapon','relic','item'],['resource','utility','armor','treasure'],['service','shop','interior','venue'],['organization','npc','companion','vehicle']]},
    transform:{usageTarget:'world',roles:[['landmark','place','portal','anomaly'],['weather','hazard','flora','resource'],['armor','relic','technology','treasure'],['route','vehicle','mount','companion']]},
    transformation:{usageTarget:'world',roles:[['landmark','place','portal','anomaly'],['weather','hazard','flora','resource'],['armor','relic','technology','treasure'],['route','vehicle','mount','companion']]},
    training:{usageTarget:'activity',roles:[['venue','place','activity','district'],['service','technology','utility','furnishing'],['organization','npc','companion','food'],['route','vehicle','mount','transit']]},
    recruit:{usageTarget:'settlement',roles:[['settlement','district','building','place'],['organization','npc','companion','service'],['route','vehicle','mount','transit'],['venue','food','shop','furnishing']]},
    artifact:{usageTarget:'shop',roles:[['shop','service','ruin','interior'],['relic','treasure','item','technology'],['resource','utility','weapon','armor'],['organization','npc','encounter','portal']]},
    recovery:{usageTarget:'settlement',roles:[['interior','settlement','service','venue'],['food','resource','flora','treasure'],['technology','utility','furnishing','companion'],['npc','organization','route','transit']]},
    hazard:{usageTarget:'crisis',roles:[['hazard','anomaly','weather','crisis'],['route','portal','vehicle','transit'],['service','utility','resource','armor'],['organization','npc','encounter','landmark']]},
    rare:{usageTarget:'world',roles:[['landmark','ruin','portal','dungeon'],['relic','treasure','anomaly','technology'],['vehicle','mount','route','fauna'],['organization','companion','encounter','service']]},
    default:{usageTarget:'world',roles:[['place','building','district','landmark'],['organization','npc','companion','vehicle'],['item','technology','relic','treasure'],['route','portal','service','weather']]}
  });

  class DynamicSceneEngine{
    constructor(){
      const World=root.MultiverseDomain?.WorldExpansionEngine;
      this.world=World?new World():null;
      const Legacy=root.MultiverseDomain?.WorldContentMegaEngine;
      this.legacy=Legacy?new Legacy():null;
    }

    ensure(state={},artifacts=[],roster=[]){
      if(Number(state.v30?.schemaVersion||0)<30&&root.MultiverseDomain?.migrateV30)root.MultiverseDomain.migrateV30(state,artifacts,roster);
      const fresh=!state.v31||typeof state.v31!=='object';
      const imported=fresh&&state.v29&&typeof state.v29==='object'?state.v29:{};
      state.v31=fresh?{
        settings:clone(imported.settings||{}),
        current:clone(imported.current||null),
        history:clone(imported.history||[]),
        remixByEvent:clone(imported.remixByEvent||{}),
        stats:clone(imported.stats||{})
      }:state.v31;
      const v=state.v31;
      v.schemaVersion=V31_SCHEMA_VERSION;
      state.v31Version=V31_SCHEMA_VERSION;
      state.schemaVersion=Math.max(Number(state.schemaVersion||0),V31_SCHEMA_VERSION);
      v.settings={enabled:true,slots:4,avoidRepeat:12,historyLimit:24,...(v.settings||{})};
      v.settings.enabled=v.settings.enabled!==false;
      v.settings.slots=Math.max(3,Math.min(6,Number(v.settings.slots)||4));
      v.settings.avoidRepeat=Math.max(4,Math.min(24,Number(v.settings.avoidRepeat)||12));
      v.settings.historyLimit=Math.max(8,Math.min(40,Number(v.settings.historyLimit)||24));
      const validScene=scene=>scene&&Array.isArray(scene.assetIds)&&scene.assetIds.some(id=>this.world?.find(id));
      v.current=validScene(v.current)?{...v.current,release:V31_SCHEMA_VERSION}:null;
      v.history=Array.isArray(v.history)?v.history.filter(validScene).map(scene=>({...scene,release:V31_SCHEMA_VERSION})).slice(0,v.settings.historyLimit):[];
      v.remixByEvent=v.remixByEvent&&typeof v.remixByEvent==='object'?v.remixByEvent:{};
      v.stats={scenesComposed:0,sceneRemixes:0,assetsStaged:0,historyViews:0,...(v.stats||{})};
      return state;
    }

    profile(type){return PROFILES[String(type||'').toLowerCase()]||PROFILES.default;}

    eventKey(state,event={}){
      return `${Number(state.spin||0)}:${String(event.type||'event')}:${String(event.ref||event.id||event.label||'unknown')}`;
    }

    context(state,event={}){
      const universe=String(state.v16?.currentUniverse||state.customCharacter?.homeworld||event.sub||'Earth-Prime');
      const rawDestination=state.v17?.currentDestination||state.v17?.destination||state.v17?.currentDestinationId||'';
      const destination=String(typeof rawDestination==='object'?(rawDestination.name||rawDestination.label||rawDestination.id||''):rawDestination);
      const membership=state.v21?.membership||{};
      const faction=String(membership.primaryFactionId||membership.primaryFaction||membership.factionId||event.faction||'');
      return{
        universe,
        destination,
        faction,
        tags:uniq([universe,destination,faction,event.type]),
        words:uniq([event.label,event.sub,event.resultText,universe,destination,faction])
      };
    }

    recentAssetIds(state){
      this.ensure(state);
      return uniq(state.v31.history.slice(0,state.v31.settings.avoidRepeat).flatMap(scene=>scene.assetIds||[]));
    }

    pick(state,event,roleKinds,index,variation,exclude=[]){
      if(!this.world)return null;
      const profile=this.profile(event.type),context=this.context(state,event),salt=`${this.eventKey(state,event)}|${variation}|${index}`,blocked=uniq(exclude);
      let asset=this.world.pick(state,{usageTarget:profile.usageTarget,kinds:roleKinds,tags:context.tags,words:context.words,salt,exclude:blocked,preferV30:true});
      if(!asset&&blocked.length)asset=this.world.pick(state,{usageTarget:profile.usageTarget,kinds:roleKinds,tags:context.tags,words:context.words,salt:`${salt}|fallback`,exclude:[],preferV30:true});
      return asset||null;
    }

    compose(state,event={},options={}){
      this.ensure(state);
      if(!state.v31.settings.enabled||!event)return null;
      const key=this.eventKey(state,event),variation=Number(options.variation??state.v31.remixByEvent[key]??0)||0,current=state.v31.current;
      if(!options.force&&current?.eventKey===key&&Number(current.variation||0)===variation&&current.assetIds?.every(id=>this.world?.find(id)))return clone(current);
      const profile=this.profile(event.type),context=this.context(state,event),recent=this.recentAssetIds(state),assetIds=[];
      for(let index=0;index<state.v31.settings.slots;index+=1){
        const roles=profile.roles[index%profile.roles.length],asset=this.pick(state,event,roles,index,variation,[...recent,...assetIds]);
        if(asset&&!assetIds.includes(asset.id))assetIds.push(asset.id);
      }
      if(!assetIds.length)return null;
      const scene={
        id:`scene:${key}:${variation}`,
        eventKey:key,
        spin:Number(state.spin||0),
        eventType:String(event.type||'event'),
        eventRef:String(event.ref||''),
        eventLabel:String(event.label||event.title||event.type||'Wheel Event'),
        universe:context.universe,
        destination:context.destination,
        faction:context.faction,
        usageTarget:profile.usageTarget,
        assetIds,
        variation,
        release:V31_SCHEMA_VERSION
      };
      state.v31.current=scene;
      state.v31.history=[clone(scene),...state.v31.history.filter(item=>item.id!==scene.id)].slice(0,state.v31.settings.historyLimit);
      state.v31.stats.scenesComposed+=1;
      state.v31.stats.assetsStaged+=assetIds.length;
      for(const id of assetIds){
        const asset=this.world.find(id);
        if(Number(asset?.release)===30){
          if(!state.v30?.discoveries?.includes(id))this.world.markDiscovered(state,id);
        }else if(!state.v27?.discoveries?.includes(id))this.legacy?.markDiscovered(state,id);
      }
      return clone(scene);
    }

    remix(state,event={}){
      this.ensure(state);
      const key=this.eventKey(state,event),variation=(Number(state.v31.remixByEvent[key])||0)+1;
      state.v31.remixByEvent[key]=variation;
      state.v31.stats.sceneRemixes+=1;
      return this.compose(state,event,{force:true,variation});
    }

    current(state,event=null){
      this.ensure(state);
      if(event&&state.v31.current?.eventKey!==this.eventKey(state,event))return null;
      return clone(state.v31.current);
    }

    assets(scene){return(scene?.assetIds||[]).map(id=>this.world?.find(id)).filter(Boolean);}

    history(state,limit=12){
      this.ensure(state);
      return state.v31.history.slice(0,Math.max(1,Math.min(24,Number(limit)||12))).map(clone);
    }

    summary(state){
      this.ensure(state);
      return{schemaVersion:V31_SCHEMA_VERSION,current:clone(state.v31.current),history:state.v31.history.length,settings:clone(state.v31.settings),stats:clone(state.v31.stats)};
    }
  }

  function migrateV31(state={},artifacts=[],roster=[]){return new DynamicSceneEngine().ensure(state,artifacts,roster);}

  return{V31_SCHEMA_VERSION,DynamicSceneEngine,migrateV31,V31_SCENE_PROFILES:PROFILES};
});
