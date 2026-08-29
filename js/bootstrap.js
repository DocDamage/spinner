'use strict';
window.addEventListener('DOMContentLoaded',async()=>{
  const loadScript=src=>new Promise((resolve,reject)=>{const existing=document.querySelector(`script[data-mw-src="${src}"]`);if(existing)return existing.dataset.loaded==='true'?resolve():existing.addEventListener('load',resolve,{once:true});const script=document.createElement('script');script.src=src;script.defer=false;script.dataset.mwSrc=src;script.addEventListener('load',()=>{script.dataset.loaded='true';resolve();},{once:true});script.addEventListener('error',()=>reject(new Error(`Unable to load ${src}`)),{once:true});document.head.appendChild(script);});
  const loadStyle=href=>{if(document.querySelector(`link[href="${href}"]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.mwStyle='true';document.head.appendChild(link);};
  let release='V15-compatible shell';
  try{
    loadStyle('styles/v16.css');
    if(!window.MultiverseDomain?.LivingMultiverseEngine)await loadScript('js/domain/v16-engine.js');
    await loadScript('js/v16-experience.js');release='V16 Living Multiverse';
    try{
      loadStyle('styles/v17.css');
      if(!window.MultiverseDomain?.RealityRulesEngine)await loadScript('js/domain/v17-engine.js');
      await loadScript('js/v17-experience.js');release='V17 Reality Rules';
      try{
        loadStyle('styles/v18.css');
        if(!window.MultiverseDomain?.EconomyCraftingEngine)await loadScript('js/domain/v18-engine.js');
        await loadScript('js/v18-experience.js');release='V18 Multiversal Economy';
        try{
          loadStyle('styles/v19.css');
          if(!window.MultiverseDomain?.PartyConsequencesEngine)await loadScript('js/domain/v19-engine.js');
          await loadScript('js/v19-experience.js');await loadScript('js/v19-hardening.js');release='V19 Party Consequences';
          document.title='Multiverse Wheel V19 — Party Consequences';
          const description=document.querySelector('meta[name="description"]');if(description)description.content='Forge a Level 1 hero through a Living Multiverse where trust, rivalry, wounds, reserves, betrayals, personal quests, and party bonds change combat and endings.';
          try{
            loadStyle('styles/v20.css');
            if(!window.MultiverseDomain?.RelicMasteryEngine)await loadScript('js/domain/v20-engine.js');
            await loadScript('js/v20-experience.js');release='V20 Relic Bonds & Equipment Mastery';
            document.title='Multiverse Wheel V20 — Relic Bonds & Equipment Mastery';
            if(description)description.content='Forge a hero whose equipment gains mastery and whose relics bond, awaken, corrupt, choose allies, get stolen by nemeses, and reshape combat and endings.';
            try{
              loadStyle('styles/v21.css');
              if(!window.MultiverseDomain?.FactionCampaignEngine)await loadScript('js/domain/v21-engine.js');
              await loadScript('js/domain/v21-hardening.js');await loadScript('js/v21-experience.js');await loadScript('js/v21-integration.js');await loadScript('js/v21-runtime-fixes.js');release='V21 Faction Campaigns & Strongholds';
              document.title='Multiverse Wheel V21 — Faction Campaigns & Strongholds';if(description)description.content='Join persistent factions, fight long campaigns through the Wheel, shape territory and diplomacy, and build recoverable multiversal strongholds.';
              try{
                loadStyle('styles/v22.css');
                if(!window.MultiverseDomain?.SettlementEngine)await loadScript('js/domain/v22-engine.js');
                await loadScript('js/v22-experience.js');release='V22 Settlements & Civilian Worlds';
                document.title='Multiverse Wheel V22 — Settlements & Civilian Worlds';if(description)description.content='Protect civilian worlds, rebuild settlements, shelter refugees, answer relief requests through the Wheel, and leave behind worlds worth saving.';
                try{
                  loadStyle('styles/v23.css');
                  if(!window.MultiverseDomain?.TacticalOperationsEngine)await loadScript('js/domain/v23-engine.js');
                  await loadScript('js/v23-experience.js');release='V23 Tactical Missions & Warfront Operations';
                  document.title='Multiverse Wheel V23 — Tactical Missions & Warfront Operations';if(description)description.content='Plan persistent tactical operations, answer warfront and civilian crises through normal Wheel play, and carry their consequences back into factions, settlements, party bonds, relics, and strongholds.';
                  try{
                    loadStyle('styles/v24.css');
                    if(!window.MultiverseDomain?.ActivityCircuitEngine)await loadScript('js/domain/v24-engine.js');
                    await loadScript('js/v24-experience.js');release='V24 Multiverse Activities & Competition Circuits';
                    document.title='Multiverse Wheel V24 — Multiverse Activities & Competition Circuits';if(description)description.content='Race, compete, hunt, train, and celebrate through persistent Wheel-driven activities while existing economy, party, relic, faction, settlement, and operation systems remain authoritative.';
                    try{
                      loadStyle('styles/v25.css');
                      if(!window.MultiverseDomain?.CrisisArcEngine)await loadScript('js/domain/v25-engine.js');
                      await loadScript('js/v25-experience.js');release='V25 Cataclysms & Multiverse Crisis Arcs';
                      document.title='Multiverse Wheel V25 — Cataclysms & Multiverse Crisis Arcs';if(description)description.content='Answer persistent multiverse-scale emergencies through ordinary Wheel outcomes while existing worlds, factions, civilians, strongholds, relics, operations, and activities remain authoritative.';
                    }catch(error){console.error('V25 Cataclysms & Multiverse Crisis Arcs failed to load; continuing with V24 Multiverse Activities & Competition Circuits.',error);document.title='Multiverse Wheel V24 — Multiverse Activities & Competition Circuits';}
                  }catch(error){console.error('V24 Multiverse Activities & Competition Circuits failed to load; continuing with V23 Tactical Missions & Warfront Operations.',error);document.title='Multiverse Wheel V23 — Tactical Missions & Warfront Operations';}
                }catch(error){console.error('V23 Tactical Missions & Warfront Operations failed to load; continuing with V22 Settlements & Civilian Worlds.',error);document.title='Multiverse Wheel V22 — Settlements & Civilian Worlds';}
              }catch(error){console.error('V22 Settlements & Civilian Worlds failed to load; continuing with V21 Faction Campaigns & Strongholds.',error);document.title='Multiverse Wheel V21 — Faction Campaigns & Strongholds';}
            }catch(error){console.error('V21 Faction Campaigns & Strongholds failed to load; continuing with V20 Relic Bonds & Equipment Mastery.',error);document.title='Multiverse Wheel V20 — Relic Bonds & Equipment Mastery';}
          }catch(error){console.error('V20 Relic Bonds & Equipment Mastery failed to load; continuing with V19 Party Consequences.',error);document.title='Multiverse Wheel V19 — Party Consequences';}
        }catch(error){console.error('V19 Party Consequences failed to load; continuing with V18 Multiversal Economy.',error);document.title='Multiverse Wheel V18 — Multiversal Economy';}
      }catch(error){console.error('V18 Multiversal Economy failed to load; continuing with V17 Reality Rules.',error);document.title='Multiverse Wheel V17 — Reality Rules';}
    }catch(error){console.error('V17 Reality Rules failed to load; continuing with V16 Living Multiverse.',error);document.title='Multiverse Wheel V16 — Living Multiverse';}
  }catch(error){console.error('V16 Living Multiverse failed to load; starting the V15-compatible shell.',error);}
  document.documentElement.dataset.release=release.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  window.game=new MultiverseWheel();
});
