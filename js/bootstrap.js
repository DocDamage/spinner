'use strict';
window.addEventListener('DOMContentLoaded',async()=>{
  const loadScript=src=>new Promise((resolve,reject)=>{const existing=document.querySelector(`script[data-mw-src="${src}"]`);if(existing)return existing.dataset.loaded==='true'?resolve():existing.addEventListener('load',resolve,{once:true});const script=document.createElement('script');script.src=src;script.defer=false;script.dataset.mwSrc=src;script.addEventListener('load',()=>{script.dataset.loaded='true';resolve();},{once:true});script.addEventListener('error',()=>reject(new Error(`Unable to load ${src}`)),{once:true});document.head.appendChild(script);});
  const loadStyle=href=>{if(document.querySelector(`link[href="${href}"]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.mwStyle='true';document.head.appendChild(link);};
  let release='V15-compatible shell';
  try{
    loadStyle('styles/v16.css');
    if(!window.MultiverseDomain?.LivingMultiverseEngine)await loadScript('js/domain/v16-engine.js');
    await loadScript('js/v16-experience.js');
    release='V16 Living Multiverse';
    try{
      loadStyle('styles/v17.css');
      if(!window.MultiverseDomain?.RealityRulesEngine)await loadScript('js/domain/v17-engine.js');
      await loadScript('js/v17-experience.js');
      release='V17 Reality Rules';
      document.title='Multiverse Wheel V17 — Reality Rules';
      const description=document.querySelector('meta[name="description"]');if(description)description.content='Forge a Level 1 hero across a Living Multiverse where every reality has unique laws, destinations, faction quests, and evolving Wheel currents.';
    }catch(error){
      console.error('V17 Reality Rules failed to load; continuing with V16 Living Multiverse.',error);
      document.title='Multiverse Wheel V16 — Living Multiverse';
    }
  }catch(error){
    console.error('V16 Living Multiverse failed to load; starting the V15-compatible shell.',error);
  }
  document.documentElement.dataset.release=release.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  window.game=new MultiverseWheel();
});
