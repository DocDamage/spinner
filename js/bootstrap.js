'use strict';
window.addEventListener('DOMContentLoaded',async()=>{
  const loadScript=src=>new Promise((resolve,reject)=>{const existing=document.querySelector(`script[data-v16-src="${src}"]`);if(existing)return existing.dataset.loaded==='true'?resolve():existing.addEventListener('load',resolve,{once:true});const script=document.createElement('script');script.src=src;script.defer=false;script.dataset.v16Src=src;script.addEventListener('load',()=>{script.dataset.loaded='true';resolve();},{once:true});script.addEventListener('error',()=>reject(new Error(`Unable to load ${src}`)),{once:true});document.head.appendChild(script);});
  const loadStyle=href=>{if(document.querySelector(`link[href="${href}"]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.v16Style='true';document.head.appendChild(link);};
  try{
    loadStyle('styles/v16.css');
    if(!window.MultiverseDomain?.LivingMultiverseEngine)await loadScript('js/domain/v16-engine.js');
    await loadScript('js/v16-experience.js');
    document.title='Multiverse Wheel V16 — Living Multiverse';
    const description=document.querySelector('meta[name="description"]');if(description)description.content='Forge a Level 1 hero and survive a Living Multiverse where worlds, factions, relic owners, and nemeses keep evolving.';
  }catch(error){console.error('V16 Living Multiverse failed to load; starting the V15-compatible shell.',error);}
  window.game=new MultiverseWheel();
});
