// ===== V8.2 REAL GITHUB-REPO MEDIA RESOLVER =====
(() => {
  const P=MultiverseWheel.prototype;
  const STOP=new Set(['the','of','and','mode','state','form','full','peak','output','access','mastery','transformation','empowerment','era','prime','earth','current','adult','composite','apex']);
  const ENTRIES=(CHARACTER_IMAGE_MANIFEST||[]).map((e,i)=>({e,i,n:normalizeCharacterName(e.name),folder:normalizeCharacterName(e.folder),pathn:normalizeCharacterName(e.path),words:String(e.name||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean)}));
  const RESULT_CACHE=new Map();
  const UNIVERSE_NAME_CACHE=new Map();
  const FORM_HINTS={
    batman:[['hellbat','batmanhellbat']],flash:[['speedforce','flashspeedforceavatar']],green_lantern:[['whitelantern','whitelanternhaljordan'],['parallax','parallaxhaljordan']],
    superman:[['cosmicarmor','cosmicarmorsuperman']],thor:[['runeking','runekingthor'],['thorforce','oldkingthor'],['odinforce','oldkingthor']],hulk:[['worldbreaker','worldbreakerhulk'],['immortal','immortalhulk']],
    doctor_doom:[['godemperor','godemperordoom']],spider_man:[['captainuniverse','captainuniversespiderman']],scarlet_witch:[['houseofm','scarletwitchhouseofm']],cyclops:[['phoenix','phoenixfivecyclops']],
    venom:[['kinginblack','venomkinginblack']],gohan:[['beast','beastgohan']],piccolo:[['orange','orangepiccolo']],naruto:[['baryon','baryonmodenaruto']],sasuke:[['sixpaths','sixpathssasuke'],['rinnegan','sixpathssasuke'],['indra','sixpathssasuke']],
    kakashi:[['dualmangekyo','dmskakashi'],['dms','dmskakashi'],['kamui','dmskakashi']],ichigo:[['mugetsu','finalgetsugaichigo'],['finalgetsuga','finalgetsugaichigo']],luffy:[['gear5','gear5luffy'],['gearfifth','gear5luffy']],
    kaido:[['hybrid','hybridkaido']],gojo:[['awakened','awakenedgojo']],sukuna:[['heian','heiansukuna']],dante:[['sindeviltrigger','sindeviltriggerdante']],link:[['fiercedeity','fiercedeitylink']],shadow:[['super','supershadow']],sonic:[['archie','archiesonic']]
  };
  const tok=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\bfifth\b/g,' 5 ').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(x=>x&&!STOP.has(x));
  const candidates=c=>[c?.name,c?.id?.replace(/_/g,' '),c?.version].filter(Boolean);
  const universeNames=universe=>{
    const key=normalizeCharacterName(universe);
    if(!UNIVERSE_NAME_CACHE.has(key))UNIVERSE_NAME_CACHE.set(key,new Set(ENTRIES.filter(x=>imageUniverseScore(x.e.folder,universe)>0).map(x=>x.n)));
    return UNIVERSE_NAME_CACHE.get(key);
  };
  P.repoMediaEntry=function(c,form=''){
    if(!c||!ENTRIES.length)return null;
    const cn=normalizeCharacterName(c.name),cid=normalizeCharacterName(c.id),fn=normalizeCharacterName(form),un=c.universe||'';
    const cacheKey=`${cid||cn}|${normalizeCharacterName(un)}|${fn}`;
    if(RESULT_CACHE.has(cacheKey))return RESULT_CACHE.get(cacheKey);
    const exactNames=new Set(candidates(c).map(normalizeCharacterName));
    const ct=[...new Set(candidates(c).flatMap(tok))], ft=[...new Set(tok(form))];
    const namesInUniverse=universeNames(un);
    let hinted='';for(const [needle,target] of FORM_HINTS[c.id]||[])if(fn.includes(needle)){hinted=target;break;}
    let best=null,bestScore=-1e9;
    for(const x of ENTRIES){let s=imageUniverseScore(x.e.folder,un)*18;
      if(hinted&&x.n===hinted)s+=180;
      if(!form){if(x.n===cn||x.n===cid||exactNames.has(x.n))s+=150;else if(x.n.startsWith(cn)||cn.startsWith(x.n))s+=48;for(const t of ct)if(x.words.includes(t))s+=9;const extra=Math.max(0,x.words.length-ct.length);s-=extra*2;}
      else{if(x.n===fn)s+=105;const joined1=normalizeCharacterName(`${c.name} ${form}`),joined2=normalizeCharacterName(`${form} ${c.name}`);if(x.n===joined1||x.n===joined2)s+=150;for(const t of ct)if(x.words.includes(t))s+=8;for(const t of ft)if(x.words.includes(t)||x.n.includes(normalizeCharacterName(t)))s+=18;const formHit=ft.some(t=>x.words.includes(t)||x.n.includes(normalizeCharacterName(t)));if(x.n===cn&&!formHit)s-=45;}
      // Prefer the correct universe when identical names occur in multiple franchises.
      if(imageUniverseScore(x.e.folder,un)===0&&namesInUniverse.has(x.n))s-=35;
      if(s>bestScore){bestScore=s;best=x;}
    }
    const threshold=form?42:30,result=bestScore>=threshold?best.e:null;RESULT_CACHE.set(cacheKey,result);return result;
  };
  P.v8Media=function(c,form=''){const e=this.repoMediaEntry(c,form);return e?imagePath(e.path):'';};
  P.mediaCoverage=function(){if(this._v8MediaCoverage)return this._v8MediaCoverage;let base=0,form=0,formTargets=0;for(const c of DATA.characters){if(this.repoMediaEntry(c,''))base++;for(const f of c.forms||[]){formTargets++;if(this.repoMediaEntry(c,f))form++;}}return this._v8MediaCoverage={manifestEntries:ENTRIES.length,characters:DATA.characters.length,baseMatched:base,formTargets,formMatched:form};};
  const _context=P.context;P.context=function(){_context.call(this);const b=document.getElementById('v8-context');if(b&&!document.getElementById('v8-media-pill'))b.insertAdjacentHTML('beforeend',`<span class="v8-pill" id="v8-media-pill">Repo art <b>${ENTRIES.length}</b> indexed</span>`);};
  window.__SPINNER_MEDIA_AUDIT=()=>window.game?.mediaCoverage();
})();
