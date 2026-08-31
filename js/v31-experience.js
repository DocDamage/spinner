'use strict';
(()=>{
  const {DynamicSceneEngine,migrateV31}=MultiverseDomain;
  if(!DynamicSceneEngine||!MultiverseDomain.WorldExpansionEngine||!window.WorldAssetArtV30)throw new Error('V31 Dynamic Scene Staging dependencies are incomplete.');
  const P=MultiverseWheel.prototype,scenes=new DynamicSceneEngine(),artifacts=()=>Array.from(ART.values()),roster=()=>Array.from(CHAR.values());
  const safe=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const label=value=>String(value||'').replace(/[-_]/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
  const art=asset=>WorldAssetArtV30.dataUri(asset,{width:720,height:480});

  P.ensureV31=function(state=this.state){
    if(!state)return state;
    if(Number(state.v31?.schemaVersion||0)<31)migrateV31(state,artifacts(),roster());
    else scenes.ensure(state,artifacts(),roster());
    return state;
  };

  const newState=P.newState;
  P.newState=function(seed){return this.ensureV31(newState.call(this,seed));};
  const loadState=P.loadState;
  P.loadState=function(){const state=loadState.call(this);return state?this.ensureV31(state):state;};
  const save=P.save;
  P.save=function(){if(this.state)this.ensureV31();return save.call(this);};

  P.dynamicSceneAssetsV31=function(){
    this.ensureV31();
    return scenes.assets(scenes.current(this.state));
  };

  P.sceneStageV31=function(scene){
    if(!this.state.v31.settings.enabled)return '<section class="v31-scene-stage v31-scene-disabled"><div><b>Dynamic scenes hidden</b><span>Gameplay is unchanged. Show scenes whenever you want the visual context back.</span></div><button type="button" data-v31-toggle-scenes>Show scenes</button></section>';
    if(!scene)return'';
    const assets=scenes.assets(scene),where=[scene.universe,scene.destination].filter(Boolean).join(' • ');
    return `<section class="v31-scene-stage" aria-label="Dynamic scene staging"><header><div><span>V31 • LIVE SCENE</span><b>${safe(scene.eventLabel)}</b><small>${safe(where||scene.usageTarget)}</small></div><nav><button type="button" data-v31-remix>Remix scene</button><button type="button" data-v31-history>History</button><button type="button" data-v31-toggle-scenes>Hide</button></nav></header><div class="v31-scene-grid">${assets.map((asset,index)=>`<button type="button" class="v31-scene-asset" data-v28-inspect="${safe(asset.id)}" aria-label="Inspect ${safe(asset.name)}"><img src="${safe(art(asset))}" alt=""><span><b>${safe(asset.name)}</b><small>${index===0?'Environment':index===1?'Focal detail':index===2?'Support':'Scene detail'} • ${safe(label(asset.kind))}${Number(asset.release)===30?' • V30':''}</small></span></button>`).join('')}</div></section>`;
  };

  P.openSceneHistoryV31=function(){
    this.ensureV31();
    this.state.v31.stats.historyViews+=1;
    let dialog=document.getElementById('v31-scene-history');
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.id='v31-scene-history';
      dialog.className='v31-history-dialog';
      document.body.appendChild(dialog);
    }
    const history=scenes.history(this.state,12);
    dialog.innerHTML=`<button class="v31-history-close" data-v31-history-close aria-label="Close">×</button><span>V31 • SCENE HISTORY</span><h2>Recent staged Wheel scenes</h2><p>These are visual compositions only. Existing combat, economy, factions, settlements, activities, operations, crises, party, and relic systems remain authoritative.</p><div class="v31-history-list">${history.map(scene=>`<section><header><b>${safe(scene.eventLabel)}</b><small>Spin ${scene.spin} • ${safe(scene.universe)}${scene.destination?` • ${safe(scene.destination)}`:''}${scene.variation?` • Remix ${scene.variation}`:''}</small></header><div>${scenes.assets(scene).map(asset=>`<button type="button" data-v28-inspect="${safe(asset.id)}"><img src="${safe(art(asset))}" alt=""><span>${safe(asset.name)}</span></button>`).join('')}</div></section>`).join('')||'<p>No staged scenes yet. Spin the Wheel to create one.</p>'}</div>`;
    if(dialog.open)dialog.close();
    dialog.showModal?.();
    this.save?.();
  };

  const renderEvent=P.renderEvent;
  P.renderEvent=function(){
    this.ensureV31();
    const result=renderEvent.call(this),pending=this.state?.pending;
    if(!pending||pending.type==='ending'||!this.eventPanel)return result;
    let scene=null;
    if(this.state.v31.settings.enabled){
      scene=scenes.current(this.state,pending)||scenes.compose(this.state,pending);
      if(scene)this.save?.();
    }
    this.eventPanel.insertAdjacentHTML('afterbegin',this.sceneStageV31(scene));
    return result;
  };

  const inject=P.injectV26UI;
  P.injectV26UI=function(){
    inject.call(this);
    this.ensureV31();
    const version=document.querySelector('.v13-title-head span'),copy=document.querySelector('.v13-title-head p');
    if(version)version.textContent='V31 • DYNAMIC SCENE STAGING';
    if(copy)copy.textContent='Every Wheel result now stages a coherent live scene from the 6,616-asset world library. Remix or revisit the visuals without rerolling gameplay.';
    if(!document.getElementById('v31-help'))document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v31-help"><h3>V31 Dynamic Scene Staging</h3><p>Ordinary Wheel events now compose context-aware V30 world art for the environment, focal detail, support, and scene detail. Remix changes visuals only; combat, rewards, choices, economy, party, relic, faction, settlement, operation, activity, and crisis state remain authoritative in their existing systems.</p></section>');
    document.documentElement.dataset.v31='dynamic-scene-staging';
  };

  const bind=P.bind;
  P.bind=function(){
    bind.call(this);
    if(this._v31Bound)return;
    this._v31Bound=true;
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-v31-remix]')){
        event.preventDefault();
        event.stopPropagation();
        if(this.state.pending){scenes.remix(this.state,this.state.pending);this.save?.();this.renderEvent?.();}
        return;
      }
      if(event.target.closest('[data-v31-history]')){
        event.preventDefault();
        event.stopPropagation();
        return this.openSceneHistoryV31();
      }
      if(event.target.closest('[data-v31-history-close]'))return document.getElementById('v31-scene-history')?.close();
      if(event.target.closest('[data-v31-toggle-scenes]')){
        event.preventDefault();
        event.stopPropagation();
        this.state.v31.settings.enabled=!this.state.v31.settings.enabled;
        if(this.state.v31.settings.enabled&&this.state.pending&&!scenes.current(this.state,this.state.pending))scenes.compose(this.state,this.state.pending);
        this.save?.();
        this.renderEvent?.();
      }
    },true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')document.getElementById('v31-scene-history')?.close();});
  };
})();
