'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {chromium}=require('playwright');
const {MACGUFFINS,hash32}=require('../js/domain/v14-engine.js');

const root=path.resolve(__dirname,'..');
const context=vm.createContext({console});
for(const file of ['base.js','expansion.js','mega-roster.js'])vm.runInContext(fs.readFileSync(path.join(root,'js','data',file),'utf8'),context,{filename:file});
const artifacts=vm.runInContext('DATA.artifacts',context);
const records=[
  ...artifacts.map(item=>({kind:'item',id:item.id,name:item.name,universe:item.universe,summary:item.special||item.powers?.[0]||'Multiversal artifact'})),
  ...MACGUFFINS.map(item=>({kind:'macguffin',id:item.id,name:item.name,universe:'Chronicle Saga',summary:item.function}))
];
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const initials=value=>String(value).split(/\s+/).filter(word=>!/^(the|of|and)$/i.test(word)).slice(0,3).map(word=>word[0]).join('').toUpperCase();

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:420,height:560},deviceScaleFactor:1});
  for(const [index,record] of records.entries()){
    const hash=hash32(`${record.kind}|${record.id}`),hue=hash%360,second=(hue+48+(hash%72))%360,glyph=initials(record.name);
    await page.setContent(`<!doctype html><html><style>*{box-sizing:border-box}html,body{margin:0;width:420px;height:560px;overflow:hidden;background:#02050d;font-family:Arial,sans-serif}.card{position:relative;width:420px;height:560px;overflow:hidden;border:2px solid hsla(${hue},90%,72%,.7);border-radius:28px;background:radial-gradient(circle at 72% 18%,hsla(${hue},95%,62%,.28),transparent 27%),radial-gradient(circle at 22% 66%,hsla(${second},90%,55%,.2),transparent 38%),linear-gradient(145deg,#071020,#10172c 54%,#060811);color:white}.grid{position:absolute;inset:0;opacity:.18;background-image:linear-gradient(hsla(${hue},80%,70%,.22) 1px,transparent 1px),linear-gradient(90deg,hsla(${hue},80%,70%,.22) 1px,transparent 1px);background-size:28px 28px}.orbit{position:absolute;left:67px;top:60px;width:286px;height:286px;border:4px solid hsla(${hue},90%,72%,.5);border-radius:50%;box-shadow:0 0 52px hsla(${hue},100%,60%,.22),inset 0 0 45px hsla(${second},100%,58%,.2)}.orbit:before,.orbit:after{content:"";position:absolute;border:2px solid hsla(${second},90%,72%,.48);border-radius:50%;transform:rotate(35deg)}.orbit:before{inset:28px -34px}.orbit:after{inset:-30px 38px;transform:rotate(-48deg)}.core{position:absolute;left:135px;top:128px;display:grid;width:150px;height:150px;place-items:center;border:1px solid hsla(${hue},100%,85%,.65);border-radius:34% 66% 54% 46%;background:linear-gradient(145deg,hsla(${hue},90%,60%,.72),hsla(${second},90%,42%,.42));box-shadow:0 0 42px hsla(${hue},100%,65%,.5);font-size:52px;font-weight:900;letter-spacing:-.05em;text-shadow:0 3px 18px #02050d}.type{position:absolute;left:28px;top:28px;color:hsl(${hue},95%,82%);font-size:12px;font-weight:900;letter-spacing:.18em}.copy{position:absolute;left:28px;right:28px;bottom:27px;padding:19px;border-left:4px solid hsl(${hue},90%,68%);background:rgba(2,8,20,.76)}h1{margin:0;font-size:30px;line-height:1.02}p{margin:9px 0 0;color:#b9c8dc;font-size:14px;line-height:1.35}.source{display:block;margin-top:10px;color:hsl(${second},90%,76%);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}</style><body><article class="card"><div class="grid"></div><div class="type">${record.kind==='item'?'ARTIFACT DOSSIER':'CHRONICLE KEY'} • ${String(index+1).padStart(2,'0')}</div><div class="orbit"></div><div class="core">${escape(glyph)}</div><div class="copy"><h1>${escape(record.name)}</h1><p>${escape(record.summary)}</p><span class="source">${escape(record.universe)}</span></div></article></body></html>`);
    const directory=path.join(root,record.kind==='item'?'item_images':'macguffin_images');fs.mkdirSync(directory,{recursive:true});const destination=path.join(directory,`${record.id}.png`);await page.locator('.card').screenshot({path:destination,type:'png'});const source={asset:record,sourcePage:'generated-project-art',generator:'tools/generate-relic-art.js',generatedAt:new Date().toISOString()};fs.writeFileSync(`${destination}.source.json`,`${JSON.stringify(source,null,2)}\n`,'utf8');
  }
  await browser.close();console.log(`Generated ${records.length} rights-safe relic cards.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
