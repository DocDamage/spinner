'use strict';

(()=>{
  const {WorldContentEngine,migrateV26}=MultiverseDomain;
  const P=MultiverseWheel.prototype,worldAssets=new WorldContentEngine();
  const artifacts=()=>Array.from(ART.values()),roster=()=>Array.from(CHAR.values());
  const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const label=v=>String(v||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const art=entry=>WorldAssetArt?.dataUri(entry,{width:720,height:480})||'';
  const first=object=>Object.values(object||{})[0]||null;

  P.ensureV26=function(state=this.state){if(!state)return state;migrateV26(state,artifacts(),roster());return state;};
  const newStateV26=P.newState;P.newState=function(seed){return this.ensureV26(newStateV26.call(this,seed));};
  const loadStateV26=P.loadState;P.loadState=function(){const state=loadStateV26.call(this);return state?this.ensureV26(state):state;};
  const saveV26=P.save;P.save=function(){if(this.state)this.ensureV26();return saveV26.call(this);};

  P.worldContentSummaryV26=function(){this.ensureV26();return worldAssets.summary(this.state);};
  P.favoriteWorldAssetV26=function(id){this.ensureV26();const result=worldAssets.toggleFavorite(this.state,id);if(!result.ok)return this.toast(result.error);this.toast(result.added?`${result.asset.name} added to favorites.`:`${result.asset.name} removed from favorites.`);this.save();this.renderWorldV16?.('atlas');this.renderWorldContentBeaconV26();};

  P.worldAssetCardV26=function(asset){
    const favorite=this.state.v26.favorites.includes(asset.id);
    return `<article class="v26-asset-card" data-v26-asset-card="${safe(asset.id)}"><img loading="lazy" src="${safe(art(asset))}" alt="${safe(asset.name)} project art"><div><span>${safe(label(asset.kind))} • ${safe(label(asset.rarity))}</span><h4>${safe(asset.name)}</h4><p>${safe(label(asset.subtype))} • ${safe(asset.world)}</p><small>${safe(asset.tags.slice(0,5).join(' • '))}</small></div><button type="button" data-v26-favorite="${safe(asset.id)}" aria-pressed="${favorite?'true':'false'}">${favorite?'★':'☆'} <span>${favorite?'Saved':'Save'}</span></button></article>`;
  };

  P.renderAtlasV26=function(){
    this.ensureV26();this.state.v26.stats.atlasViews+=1;
    const kind=this._v26AtlasKind||'',query=this._v26AtlasQuery||'',rarity=this._v26AtlasRarity||'';
    const all=worldAssets.query({kind,rarity,search:query}),visible=all.slice(0,72),summary=worldAssets.summary(this.state);
    const kinds=Object.entries(summary.counts).map(([id,count])=>`<button type="button" class="${kind===id?'active':''}" data-v26-kind="${safe(id)}">${safe(label(id))}<b>${count}</b></button>`).join('');
    const cards=visible.map(asset=>this.worldAssetCardV26(asset)).join('')||'<section class="v26-empty"><h3>No matching assets</h3><p>Clear a filter or search a broader world-content term.</p></section>';
    return `<section class="v26-atlas-head"><div><span>V26 • WORLD CONTENT EXPANSION</span><h3>The multiverse now has a visual library beyond the roster</h3><p>Rights-safe project art covers buildings, places, interiors, gear, vehicles, NPC roles, strongholds, settlements, activities, crisis scenes, and UI badges. These assets are context-linked to existing V16–V25 systems without creating new currencies or simulators.</p></div><aside><b>${summary.total}</b><small>world assets</small><b>${summary.assignments}</b><small>context links</small></aside></section><section class="v26-atlas-tools"><label><span>Search assets</span><input type="search" data-v26-search value="${safe(query)}" placeholder="vehicle, clinic, relic, forest…"></label><label><span>Rarity</span><select data-v26-rarity><option value="">All rarities</option>${['common','uncommon','rare','epic','legendary'].map(id=>`<option value="${id}" ${rarity===id?'selected':''}>${label(id)}</option>`).join('')}</select></label><button type="button" class="${kind?'':'active'}" data-v26-kind="">All <b>${summary.total}</b></button></section><nav class="v26-kind-strip" aria-label="World asset types">${kinds}</nav><div class="v26-atlas-status"><span>Showing ${visible.length} of ${all.length} matching assets</span><span>${summary.favorites} favorite${summary.favorites===1?'':'s'} • ${summary.counts.vehicle||0} vehicles • ${summary.counts.building||0} buildings • ${summary.counts.place||0} places</span></div><section class="v26-asset-grid">${cards}</section>`;
  };

  P.contextReferenceV26=function(tab){
    if(tab==='crises'){const x=this.state.v25?.crises?.[this.state.v25?.activeCrisisId]||first(this.state.v25?.crises);return x?{type:'crisis',id:x.id,label:x.label}:null;}
    if(tab==='activities'){const x=this.state.v24?.activities?.[this.state.v24?.activeActivityId]||first(this.state.v24?.activities);return x?{type:'activity',id:x.id,label:x.label}:null;}
    if(tab==='operations'){const x=this.state.v23?.operations?.[this.state.v23?.activeOperationId]||first(this.state.v23?.operations);return x?{type:'operation',id:x.id,label:x.label}:null;}
    if(tab==='civilians'){const x=first(this.state.v22?.settlements);return x?{type:'settlement',id:x.id,label:x.name}:null;}
    if(tab==='factions'){const x=Object.values(this.state.v21?.strongholds||{}).find(h=>h.playerAligned)||first(this.state.v21?.strongholds);return x?{type:'stronghold',id:x.id,label:x.name}:null;}
    const universe=this.state.v16?.currentUniverse||this.state.customCharacter?.homeworld||'Earth-Prime';return{type:'world',id:universe,label:universe};
  };

  P.renderContextArtV26=function(tab){
    if(!this.state.v26.settings.showContextArt||tab==='atlas')return;
    const body=document.querySelector('[data-v16-world-body]');if(!body||body.querySelector('.v26-context-strip'))return;
    const ref=this.contextReferenceV26(tab);if(!ref)return;const assets=worldAssets.context(this.state,ref.type,ref.id,4);if(!assets.length)return;
    body.insertAdjacentHTML('beforeend',`<section class="v26-context-strip"><header><div><span>V26 CONTEXT ART • ${safe(label(ref.type))}</span><h4>${safe(ref.label||ref.id)}</h4></div><button type="button" data-v26-open>OPEN ASSET ATLAS</button></header><div>${assets.map(asset=>`<article data-v26-asset-card="${safe(asset.id)}"><img loading="lazy" src="${safe(art(asset))}" alt="${safe(asset.name)}"><span>${safe(asset.name)}</span><small>${safe(label(asset.subtype))}</small></article>`).join('')}</div></section>`);
  };

  P.injectV26UI=function(){
    const world=document.getElementById('v16-world-modal');if(world&&!world.querySelector('[data-v16-world-tab="atlas"]'))(world.querySelector('[data-v16-world-tab="crises"]')||world.querySelector('[data-v16-world-tab="activities"]'))?.insertAdjacentHTML('afterend','<button type="button" data-v16-world-tab="atlas">ATLAS</button>');
    const beacon=document.getElementById('v25-crisis-beacon')||document.getElementById('v24-activity-beacon');if(beacon&&!document.getElementById('v26-world-content-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v26-world-content-beacon" class="v26-world-content-beacon" aria-label="World content atlas summary"></section>');
    const version=document.querySelector('.v13-title-head span'),copy=document.querySelector('.v13-title-head p');if(version)version.textContent='V26 • WORLD CONTENT EXPANSION';if(copy)copy.textContent='Explore a much denser multiverse with context-linked buildings, places, interiors, equipment, vehicles, NPCs, strongholds, settlements, activities, crisis scenes, and utility art.';
    if(!document.getElementById('v26-help'))document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v26-help"><h3>World Content Atlas</h3><p>Open World → Atlas to browse the V26 original world-art library. Existing strongholds, civilian settlements, operations, activities, crises, and the current universe receive stable seeded visual assignments. Character and transformation art remains on the stricter review-first pipeline and is never silently replaced.</p></section>');
    document.documentElement.dataset.v26='world-content-expansion';
  };

  P.renderWorldContentBeaconV26=function(){
    const root=document.getElementById('v26-world-content-beacon');if(!root)return;const s=this.worldContentSummaryV26();
    root.innerHTML=`<button type="button" data-v26-open><span>WORLD ASSET ATLAS</span><b>${s.total} original assets</b><small>${s.counts.building||0} buildings • ${s.counts.place||0} places • ${s.counts.vehicle||0} vehicles</small></button><div><span>CONTEXT COVERAGE</span><b>${s.assignments} stable assignments</b><small>${s.counts.item||0} items • ${s.counts.npc||0} NPC roles • ${s.favorites} favorites</small></div>`;
  };

  const renderWorldV26=P.renderWorldV16;
  P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){
    if(tab==='atlas'){this.ensureV26();this._v16WorldTab='atlas';document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab==='atlas'));const body=document.querySelector('[data-v16-world-body]');if(body)body.innerHTML=this.renderAtlasV26();return;}
    const result=renderWorldV26.call(this,tab);this.ensureV26();this.renderContextArtV26(tab);return result;
  };

  const renderAllV26=P.renderAll;
  P.renderAll=function(){this.ensureV26();const result=renderAllV26.call(this);this.injectV26UI();this.renderWorldContentBeaconV26();return result;};

  const bindV26=P.bind;
  P.bind=function(){bindV26.call(this);this.injectV26UI();if(this._v26Bound)return;this._v26Bound=true;
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-v26-open]'))return this.openWorldV16?.('atlas');
      const kind=event.target.closest('[data-v26-kind]');if(kind){this._v26AtlasKind=kind.dataset.v26Kind||'';return this.renderWorldV16?.('atlas');}
      const fav=event.target.closest('[data-v26-favorite]');if(fav){event.preventDefault();event.stopPropagation();return this.favoriteWorldAssetV26(fav.dataset.v26Favorite);}
      const card=event.target.closest('[data-v26-asset-card]');if(card){worldAssets.markSeen(this.state,card.dataset.v26AssetCard);this.save();}
    });
    document.addEventListener('input',event=>{if(event.target.matches('[data-v26-search]')){this._v26AtlasQuery=event.target.value||'';this.renderWorldV16?.('atlas');const input=document.querySelector('[data-v26-search]');input?.focus();input?.setSelectionRange?.(this._v26AtlasQuery.length,this._v26AtlasQuery.length);}});
    document.addEventListener('change',event=>{if(event.target.matches('[data-v26-rarity]')){this._v26AtlasRarity=event.target.value||'';this.renderWorldV16?.('atlas');}});
  };
})();
