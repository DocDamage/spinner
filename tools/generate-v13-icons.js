'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');

(async()=>{
  const root=path.resolve(__dirname,'..'),output=path.join(root,'icons');fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true});
  for(const size of [192,512]){
    const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    await page.setContent(`<!doctype html><style>*{box-sizing:border-box}body{margin:0;background:#02050d}.icon{position:relative;width:${size}px;height:${size}px;overflow:hidden;border-radius:${Math.round(size*.18)}px;background:radial-gradient(circle at 50% 48%,rgba(45,212,191,.25),transparent 25%),radial-gradient(circle at 18% 12%,rgba(34,211,238,.22),transparent 34%),radial-gradient(circle at 86% 84%,rgba(168,85,247,.25),transparent 36%),linear-gradient(145deg,#071126,#02050d)}.ring,.ring:before,.ring:after{position:absolute;inset:16%;content:"";border:${Math.max(3,Math.round(size*.012))}px solid #67e8f9;border-radius:50%;box-shadow:0 0 ${Math.round(size*.08)}px rgba(34,211,238,.55),inset 0 0 ${Math.round(size*.05)}px rgba(34,211,238,.25)}.ring:before{inset:12%;border-color:rgba(196,181,253,.7);transform:rotate(24deg);clip-path:polygon(0 0,48% 0,48% 100%,0 100%)}.ring:after{inset:-10%;border-color:rgba(94,234,212,.28);border-width:${Math.max(2,Math.round(size*.007))}px}.spokes{position:absolute;inset:19%;border-radius:50%;background:repeating-conic-gradient(from -10deg,rgba(103,232,249,.72) 0 1.2deg,transparent 1.2deg 30deg);mask:radial-gradient(circle,transparent 0 43%,#000 44% 50%,transparent 51%)}.mark{position:absolute;inset:31%;display:grid;place-items:center;border:${Math.max(2,Math.round(size*.009))}px solid rgba(103,232,249,.62);border-radius:50%;background:linear-gradient(145deg,rgba(9,24,50,.98),rgba(4,8,21,.98));color:#effcff;font:900 ${Math.round(size*.14)}px/1 Arial,sans-serif;letter-spacing:-.08em;text-shadow:0 0 ${Math.round(size*.04)}px rgba(103,232,249,.9);box-shadow:0 0 ${Math.round(size*.06)}px rgba(124,58,237,.45)}.star{position:absolute;width:${Math.max(2,Math.round(size*.012))}px;height:${Math.max(2,Math.round(size*.012))}px;border-radius:50%;background:#fff;box-shadow:${Math.round(size*.66)}px ${Math.round(size*.13)}px #67e8f9,${Math.round(size*.12)}px ${Math.round(size*.69)}px #c4b5fd,${Math.round(size*.72)}px ${Math.round(size*.64)}px #5eead4}</style><div class="icon"><div class="star"></div><div class="ring"></div><div class="spokes"></div><div class="mark">MW</div></div>`);
    await page.locator('.icon').screenshot({path:path.join(output,`icon-${size}.png`),omitBackground:false});
  }
  await browser.close();console.log(`Generated V13 icons in ${output}`);
})().catch(error=>{console.error(error);process.exitCode=1;});
