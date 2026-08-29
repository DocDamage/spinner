'use strict';

importScripts('./game_asset_manifest.js');

const CACHE_NAME='multiverse-wheel-v19-party-1';
const APP_SHELL=[
  './',
  './Multiverse_Wheel_V8_1326_Real_Repo_Images.html',
  './manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './assets/multiverse-wheel-v13-social.png',
  './styles/app.css','./styles/v9.css','./styles/v13.css','./styles/v14.css','./styles/v15.css','./styles/v16.css','./styles/v17.css','./styles/v18.css','./styles/v19.css',
  './character_image_manifest.js','./game_asset_manifest.js','./assets/game-asset-catalog.json',
  './js/config.js','./js/data/base.js','./js/data/expansion.js','./js/data/mega-roster.js',
  './js/core.js','./js/v5-systems.js','./js/v6-custom-hero.js','./js/v8-everything.js','./js/v8-integration.js',
  './js/media-resolver.js','./js/performance.js',
  './js/domain/balance-engine.js','./js/domain/combat-engine.js','./js/domain/combat-advisor.js','./js/domain/campaign-engine.js',
  './js/domain/trait-engine.js','./js/domain/save-repository.js','./js/domain/roster-validator.js','./js/domain/wheel-service.js',
  './js/domain/derived-state-cache.js','./js/domain/collection-window.js','./js/domain/experience-engine.js','./js/domain/session-engine.js','./js/domain/v13-engine.js','./js/domain/v14-engine.js','./js/domain/v15-engine.js','./js/domain/v16-engine.js','./js/domain/v17-engine.js','./js/domain/v18-engine.js','./js/domain/v19-engine.js',
  './js/ui/view-templates.js','./js/ui/dialog-controller.js','./js/ui/tab-controller.js',
  './js/v9-gameplay.js','./js/v10-performance.js','./js/v10-late-run.js','./js/v10-tactical-advisor.js','./js/v11-experience.js','./js/v12-command-center.js',
  './js/v13-foundation.js','./js/v13-shell.js','./js/v13-agency.js','./js/v13-combat.js','./js/v13-narrative.js','./js/v13-replay.js','./js/v14-experience.js','./js/v15-experience.js','./js/v16-experience.js','./js/v17-experience.js','./js/v18-experience.js','./js/v19-experience.js','./js/bootstrap.js',
  ...(self.GAME_ASSET_MANIFEST||[]).map(entry=>`./${entry.path}`)
];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('multiverse-wheel-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./Multiverse_Wheel_V8_1326_Real_Repo_Images.html',copy));return response;}).catch(()=>caches.match('./Multiverse_Wheel_V8_1326_Real_Repo_Images.html')));return;}
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;})));
});
