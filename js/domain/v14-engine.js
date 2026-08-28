'use strict';

(function attachV14Engine(root){
  const V14_SCHEMA_VERSION=14;
  const POINT_BUY_BUDGET=27;
  const ABILITY_KEYS=['power','agility','endurance','intellect','insight','presence'];
  const ABILITY_META={
    power:{label:'Power',abbr:'PWR',description:'Raw force, lifting, breaking, and close combat.'},
    agility:{label:'Agility',abbr:'AGI',description:'Reflexes, precision, movement, and initiative.'},
    endurance:{label:'Endurance',abbr:'END',description:'Health, stamina, resistance, and concentration.'},
    intellect:{label:'Intellect',abbr:'INT',description:'Analysis, technology, investigation, and occult theory.'},
    insight:{label:'Insight',abbr:'INS',description:'Perception, judgment, willpower, and reading a scene.'},
    presence:{label:'Presence',abbr:'PRE',description:'Leadership, empathy, deception, and force of personality.'}
  };
  const POINT_BUY_COST=Object.freeze({8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9});
  const SKILLS={
    athletics:{label:'Athletics',ability:'power'},acrobatics:{label:'Acrobatics',ability:'agility'},stealth:{label:'Stealth',ability:'agility'},
    resilience:{label:'Resilience',ability:'endurance'},arcana:{label:'Arcana',ability:'intellect'},investigation:{label:'Investigation',ability:'intellect'},
    technology:{label:'Technology',ability:'intellect'},insight:{label:'Insight',ability:'insight'},perception:{label:'Perception',ability:'insight'},
    survival:{label:'Survival',ability:'insight'},deception:{label:'Deception',ability:'presence'},persuasion:{label:'Persuasion',ability:'presence'}
  };
  const LINEAGES={
    human:{label:'Unbound Human',summary:'Versatile, stubborn, and impossible for the timeline to predict.',bonuses:{presence:1,intellect:1},trait:'Unscripted — begin each chapter with one Inspiration.'},
    altered:{label:'Altered',summary:'A mortal physiology rewritten by one impossible incident.',bonuses:{power:1,endurance:1},trait:'Adaptive Biology — the first failed resistance in a chapter gains +2.'},
    synthetic:{label:'Synthetic',summary:'A constructed mind with a chosen soul and modular body.',bonuses:{intellect:2},trait:'Modular Frame — Technology proficiency also improves Defense.'},
    mystic:{label:'Mystic-Born',summary:'A living conduit for symbols, spirits, and unreal laws.',bonuses:{insight:1,presence:1},trait:'Resonant Will — custom plans using Arcana cost less Energy.'},
    alien:{label:'Worldstrider',summary:'A visitor whose natural laws differ from the home timeline.',bonuses:{agility:1,endurance:1},trait:'Foreign Physics — ignore the first movement hazard each stage.'},
    chronal:{label:'Chronal Echo',summary:'A person displaced from a future that no longer exists.',bonuses:{agility:1,insight:1},trait:'Second Memory — once per stage, reveal the risk of a decision.'}
  };
  const CALLINGS={
    vanguard:{label:'Vanguard',summary:'Direct force, protection, and momentum.',saves:['power','endurance'],skills:['athletics','resilience','perception','persuasion'],tags:['martial','strength','leadership'],legacyArchetype:'fighter',statBias:{might:5,defense:3}},
    sentinel:{label:'Sentinel',summary:'Endurance, rescue, and battlefield control.',saves:['endurance','insight'],skills:['resilience','insight','perception','survival'],tags:['defense','shield','willpower'],legacyArchetype:'soldier',statBias:{defense:6,energy:2}},
    operative:{label:'Operative',summary:'Mobility, precision, infiltration, and improvisation.',saves:['agility','intellect'],skills:['acrobatics','stealth','investigation','technology'],tags:['skill','stealth','strategy'],legacyArchetype:'detective',statBias:{speed:4,skill:5}},
    savant:{label:'Savant',summary:'Technology, analysis, preparation, and invention.',saves:['intellect','insight'],skills:['arcana','investigation','technology','perception'],tags:['genius','tech','prep'],legacyArchetype:'inventor',statBias:{mind:6,hax:2}},
    channeler:{label:'Channeler',summary:'Energy shaping, anomalies, and reality pressure.',saves:['intellect','presence'],skills:['arcana','insight','deception','persuasion'],tags:['magic','energy','hax'],legacyArchetype:'scientist',statBias:{energy:5,hax:5}},
    envoy:{label:'Envoy',summary:'Leadership, negotiation, morale, and impossible alliances.',saves:['insight','presence'],skills:['insight','perception','deception','persuasion'],tags:['leadership','support','willpower'],legacyArchetype:'performer',statBias:{mind:2,skill:2,energy:2}}
  };
  const BACKGROUNDS={
    survivor:{label:'Fracture Survivor',skills:['resilience','survival'],feature:'Shelter Sense — recovery choices restore 10% more.'},
    scholar:{label:'Forbidden Scholar',skills:['arcana','investigation'],feature:'Deep Record — story clues reveal one additional consequence.'},
    responder:{label:'Crisis Responder',skills:['athletics','perception'],feature:'First In — rescue decisions generate additional loyalty.'},
    outlaw:{label:'Timeline Outlaw',skills:['stealth','deception'],feature:'Hidden Route — risky custom plans gain +1 when escaping authority.'},
    inventor:{label:'Garage Inventor',skills:['technology','investigation'],feature:'Field Rig — dismantled rewards produce additional growth.'},
    diplomat:{label:'World Delegate',skills:['insight','persuasion'],feature:'Open Channel — neutral factions begin one step friendlier.'}
  };
  const PLAYER_COLORS=['#67e8f9','#fbbf24','#c4b5fd','#fb7185','#5eead4','#93c5fd','#f9a8d4','#bef264','#fdba74','#a5b4fc'];
  const INTENTIONS={
    protect:{label:'Protect',summary:'Prioritize lives and stability.',battle:{outlast:.035},hazard:.04,axes:{hope:2,order:1}},
    discover:{label:'Discover',summary:'Expose the hidden rule before acting.',battle:{counter:.035},hazard:.025,axes:{truth:2,freedom:1}},
    connect:{label:'Connect',summary:'Build trust and find a shared answer.',battle:{mystic:.02},hazard:.015,axes:{hope:1,freedom:2}},
    defy:{label:'Defy',summary:'Break the imposed rules and seize momentum.',battle:{clash:.03,blitz:.025},hazard:-.015,axes:{freedom:2,order:-1}}
  };
  const MACGUFFINS=[
    {id:'axis-shard',name:'Axis Shard',chapter:1,summary:'A compass fragment that points toward events erased from history.',function:'Reveals missing routes',risk:'Also reveals the bearer to the enemy'},
    {id:'memory-seed',name:'Memory Seed',chapter:2,summary:'A crystallized memory capable of restoring one overwritten world.',function:'Restores a lost truth',risk:'The restored truth may contradict the present'},
    {id:'echo-crown',name:'Echo Crown',chapter:3,summary:'A tournament seal that converts witnessed techniques into temporal fuel.',function:'Stabilizes borrowed power',risk:'Rewards spectacle over mercy'},
    {id:'name-of-dawn',name:'Name of Dawn',chapter:4,summary:'The true name of the first repaired timeline, encoded as living light.',function:'Prevents historical erasure',risk:'Can overwrite a chosen identity'},
    {id:'sun-engine',name:'Borrowed Sun Engine',chapter:5,summary:'A miniature star assembled from surrendered victories.',function:'Powers a world-scale defense',risk:'Consumes the futures it was built to save'},
    {id:'tomorrow-key',name:'Tomorrow Key',chapter:6,summary:'A key that opens only prisons whose inmates have not been born yet.',function:'Releases future allies',risk:'Releases future enemies as well'},
    {id:'tenfold-banner',name:'Tenfold Banner',chapter:7,summary:'A blank standard that becomes the symbol chosen by a coalition.',function:'Unites incompatible factions',risk:'Its meaning belongs to whoever raises it'},
    {id:'ending-mask',name:'Mask of the False Ending',chapter:8,summary:'A perfect conclusion designed to trap heroes who accept easy closure.',function:'Exposes counterfeit finales',risk:'Makes every true victory feel uncertain'},
    {id:'author-quill',name:'Unwritten Quill',chapter:9,summary:'A tool that can add one law to reality but cannot erase a cost.',function:'Writes a final rule',risk:'The rule binds its author first'},
    {id:'horizon-heart',name:'Heart of the Horizon',chapter:10,summary:'The choice at the center of every surviving timeline.',function:'Lets the coalition choose what the multiverse becomes',risk:'No authority can choose without surrendering control'}
  ];
  const chapterChoices=(chapter)=>[
    {id:'shield',label:'Save what is here',prompt:'Protect people and preserve the present before pursuing the larger mystery.',cost:'Lose time and let the enemy reposition',gain:'Hope, loyalty, and a protected world',intent:'protect',effect:{hope:3,order:1,energy:-.08,loyalty:4,worldsProtected:1}},
    {id:'pursue',label:'Follow the hidden trail',prompt:'Abandon the obvious objective long enough to learn who engineered this chapter.',cost:'The immediate crisis worsens',gain:'Truth, Fate, and boss intelligence',intent:'discover',effect:{truth:3,freedom:1,fate:1,bossPower:-.06}},
    {id:'accord',label:'Offer an impossible alliance',prompt:'Give a faction or rival a reason to help without forcing obedience.',cost:'Promise a future concession',gain:'Coalition strength and loyalty',intent:'connect',effect:{hope:2,freedom:2,loyalty:6,teamwork:1}},
    {id:'break',label:'Break the chapter’s rule',prompt:`Use the ${chapter.macguffinName} in a way its makers never intended.`,cost:'Heat, strain, and an unpredictable callback',gain:'Power now and freedom later',intent:'defy',effect:{freedom:3,order:-2,energy:-.12,heat:2,stats:1}}
  ];
  const SAGA_CHAPTERS=[
    {id:'broken-hour',act:'ACT I • THE FRACTURE',title:'The Hour That Broke',location:'The Crossroads at 00:00',antagonist:'The Pale Patrol',objective:'Recover the first route before the enemy edits the witnesses.',reveal:'Someone is repairing the multiverse by deleting every unpredictable life.',macguffinId:'axis-shard'},
    {id:'counterfeit-dawn',act:'ACT I • THE FRACTURE',title:'A Counterfeit Dawn',location:'A city that remembers two victories',antagonist:'The Victorious Dead',objective:'Decide which history survives when both populations are real.',reveal:'The erased timelines are returning as soldiers who believe your world stole their future.',macguffinId:'memory-seed'},
    {id:'echo-tournament',act:'ACT I • THE FRACTURE',title:'The Tournament of Echoes',location:'The Arena Between Seconds',antagonist:'The Crowned Referee',objective:'Win, sabotage, or transform a contest that feeds on borrowed powers.',reveal:'Every spectacular battle charges the machine building the final false timeline.',macguffinId:'echo-crown'},
    {id:'stolen-histories',act:'ACT II • THE CHRONICLE WAR',title:'The People Without Pasts',location:'The Archive of Unlived Lives',antagonist:'Archivist Zero',objective:'Restore identities without recreating the wars attached to them.',reveal:'Archivist Zero is a discarded future version of the first person who touched the Wheel.',macguffinId:'name-of-dawn'},
    {id:'borrowed-suns',act:'ACT II • THE CHRONICLE WAR',title:'The War of Borrowed Suns',location:'A convoy of mobile stars',antagonist:'The Solar Houses',objective:'Stop an arms race powered by harvested heroic endings.',reveal:'The final enemy cannot create energy; it can only persuade heroes to surrender possibility.',macguffinId:'sun-engine'},
    {id:'prison-tomorrow',act:'ACT II • THE CHRONICLE WAR',title:'The Prison Beyond Tomorrow',location:'A fortress outside causality',antagonist:'Your undefeated future rival',objective:'Choose which possible people deserve release into a history they might destroy.',reveal:'The rival has been fighting to prevent a future in which your coalition becomes the tyrant.',macguffinId:'tomorrow-key'},
    {id:'tenfold-rebellion',act:'ACT III • THE UNWRITTEN HORIZON',title:'The Tenfold Rebellion',location:'Ten worlds sharing one sky',antagonist:'The Perfect Timeline',objective:'Unite factions that agree on the enemy but not on what freedom means.',reveal:'The coalition can win the war and still lose the right to choose its own future.',macguffinId:'tenfold-banner'},
    {id:'false-final',act:'ACT III • THE UNWRITTEN HORIZON',title:'The False Final Battle',location:'A flawless reconstructed home',antagonist:'Everyone you failed to save',objective:'Recognize the comfortable ending before accepting it as real.',reveal:'The prison is not an illusion; it is a genuine peaceful branch that will die if you leave.',macguffinId:'ending-mask'},
    {id:'author-end',act:'ACT III • THE UNWRITTEN HORIZON',title:'The Author at the End',location:'The margin beyond all mapped worlds',antagonist:'Archivist Zero Ascendant',objective:'Write one final law without turning choice into another cage.',reveal:'The Wheel never chose a champion. It chose someone capable of refusing authorship.',macguffinId:'author-quill'},
    {id:'unwritten-horizon',act:'FINALE • THE CHOICE',title:'The Unwritten Horizon',location:'Every surviving world at once',antagonist:'The need for a single answer',objective:'Decide what the multiverse becomes and who retains the power to change it.',reveal:'The last MacGuffin is not an object—it is the coalition’s freely given consent.',macguffinId:'horizon-heart'}
  ].map((chapter,index)=>{
    const relic=MACGUFFINS.find(item=>item.id===chapter.macguffinId);
    const enriched={...chapter,number:index+1,macguffinName:relic.name,macguffin:relic};
    return Object.freeze({...enriched,choices:Object.freeze(chapterChoices(enriched))});
  });

  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const modifier=score=>Math.floor((Number(score)-10)/2);
  const hash32=value=>{let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;};
  const normalizeId=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  class CharacterCreationEngine{
    options(){return{abilities:clone(ABILITY_META),skills:clone(SKILLS),lineages:clone(LINEAGES),callings:clone(CALLINGS),backgrounds:clone(BACKGROUNDS),budget:POINT_BUY_BUDGET};}
    defaults(){return{name:'Alex',codename:'Riftwalker',homeworld:'Earth-Prime',lineage:'human',calling:'vanguard',background:'survivor',abilities:Object.fromEntries(ABILITY_KEYS.map(key=>[key,10])),proficiencies:['athletics','perception'],ideal:'Freedom requires room to make mistakes.',bond:'I will find the people lost between timelines.',flaw:'I take every failure as proof I need more power.',story:'',accent:'#22d3ee'};}
    pointBuySpent(abilities={}){return ABILITY_KEYS.reduce((sum,key)=>sum+(POINT_BUY_COST[clamp(Math.round(abilities[key]??10),8,15)]??99),0);}
    validate(config={}){
      const errors=[],abilities=config.abilities||{};
      for(const key of ABILITY_KEYS){const value=Number(abilities[key]);if(!Number.isInteger(value)||value<8||value>15)errors.push(`${ABILITY_META[key].label} must be an integer from 8 to 15.`);}
      const spent=this.pointBuySpent(abilities);if(spent>POINT_BUY_BUDGET)errors.push(`Point buy exceeds ${POINT_BUY_BUDGET} by ${spent-POINT_BUY_BUDGET}.`);
      if(!LINEAGES[config.lineage])errors.push('Choose a valid lineage.');if(!CALLINGS[config.calling])errors.push('Choose a valid calling.');if(!BACKGROUNDS[config.background])errors.push('Choose a valid background.');
      const profs=[...new Set((config.proficiencies||[]).map(normalizeId))];if(profs.length>4)errors.push('Choose no more than four trained skills.');for(const id of profs)if(!SKILLS[id])errors.push(`Unknown skill: ${id}.`);
      return{ok:errors.length===0,errors,spent,remaining:POINT_BUY_BUDGET-spent};
    }
    createSheet(config={}){
      const merged={...this.defaults(),...clone(config),abilities:{...this.defaults().abilities,...clone(config.abilities||{})}},verdict=this.validate(merged);if(!verdict.ok)return verdict;
      const lineage=LINEAGES[merged.lineage],calling=CALLINGS[merged.calling],background=BACKGROUNDS[merged.background];
      const abilities=Object.fromEntries(ABILITY_KEYS.map(key=>[key,Number(merged.abilities[key])+Number(lineage.bonuses[key]||0)]));
      const mods=Object.fromEntries(ABILITY_KEYS.map(key=>[key,modifier(abilities[key])]));
      const proficiencyBonus=2,proficiencies=[...new Set([...background.skills,...merged.proficiencies])];
      const skills=Object.fromEntries(Object.entries(SKILLS).map(([id,skill])=>[id,{...skill,proficient:proficiencies.includes(id),bonus:mods[skill.ability]+(proficiencies.includes(id)?proficiencyBonus:0)}]));
      const derived={
        might:Math.round(8+abilities.power*1.35+abilities.endurance*.35+Number(calling.statBias.might||0)),
        defense:Math.round(7+abilities.endurance*1.25+abilities.agility*.45+Number(calling.statBias.defense||0)+(merged.lineage==='synthetic'&&proficiencies.includes('technology')?2:0)),
        speed:Math.round(8+abilities.agility*1.45+abilities.insight*.25+Number(calling.statBias.speed||0)),
        skill:Math.round(7+abilities.agility*.8+abilities.intellect*.65+Number(calling.statBias.skill||0)),
        mind:Math.round(7+abilities.intellect*.9+abilities.insight*.6+Number(calling.statBias.mind||0)),
        energy:Math.round(6+abilities.endurance*.55+abilities.presence*.45+abilities.intellect*.35+Number(calling.statBias.energy||0)),
        hax:Math.round(2+abilities.intellect*.45+abilities.insight*.4+abilities.presence*.25+Number(calling.statBias.hax||0))
      };
      const sheet={...merged,lineageId:merged.lineage,callingId:merged.calling,backgroundId:merged.background,abilities,modifiers:mods,proficiencies,skills,proficiencyBonus,saves:[...calling.saves],lineageLabel:lineage.label,callingLabel:calling.label,backgroundLabel:background.label,traits:[lineage.trait,background.feature],tags:[...new Set([...calling.tags,...proficiencies])],derived,initiative:mods.agility,armor:10+mods.agility+Math.max(0,mods.endurance),resolve:10+mods.insight+mods.presence,passivePerception:10+skills.perception.bonus,maxHealth:20+mods.endurance*3+(merged.calling==='vanguard'?4:0),inspiration:1};
      return{ok:true,sheet,spent:verdict.spent,remaining:verdict.remaining};
    }
    preset(archetype='balanced'){
      const map={fighter:'vanguard',soldier:'sentinel',detective:'operative',inventor:'savant',scientist:'channeler',performer:'envoy',medic:'sentinel',hacker:'savant',athlete:'operative',civilian:'envoy',explorer:'operative',balanced:'vanguard'},calling=map[archetype]||'vanguard',config=this.defaults();config.calling=calling;config.background=calling==='savant'?'inventor':calling==='envoy'?'diplomat':calling==='operative'?'outlaw':'survivor';config.proficiencies=CALLINGS[calling].skills.slice(0,2);return this.createSheet(config).sheet;
    }
  }

  class MultiplayerEngine{
    create({count=1,names=[],decisionMode='captain'}={}){
      const total=clamp(Math.round(count),1,10),mode=total===1?'solo':'hotseat';
      return{mode,decisionMode:decisionMode==='council'&&total>1?'council':'captain',activeIndex:0,round:1,players:Array.from({length:total},(_,index)=>({id:`player-${index+1}`,name:String(names[index]||`Player ${index+1}`).trim().slice(0,30)||`Player ${index+1}`,color:PLAYER_COLORS[index],inspiration:1,decisions:0,turns:0})),vote:null};
    }
    normalize(value){return this.create({count:value?.players?.length||1,names:(value?.players||[]).map(player=>player.name),decisionMode:value?.decisionMode});}
    active(multiplayer){const players=multiplayer?.players||[];return players[clamp(multiplayer?.activeIndex||0,0,Math.max(0,players.length-1))]||null;}
    advance(multiplayer){if(!multiplayer?.players?.length)return null;multiplayer.players[multiplayer.activeIndex].turns++;multiplayer.activeIndex=(multiplayer.activeIndex+1)%multiplayer.players.length;if(multiplayer.activeIndex===0)multiplayer.round++;return this.active(multiplayer);}
    beginVote(multiplayer,eventId,choiceIds=[]){multiplayer.vote={eventId:String(eventId),choiceIds:[...new Set(choiceIds.map(String))],votes:{},voterIndex:0};return clone(multiplayer.vote);}
    castVote(multiplayer,playerId,choiceId){const vote=multiplayer?.vote;if(!vote||!vote.choiceIds.includes(String(choiceId)))return{ok:false,error:'That vote is not available.'};const player=multiplayer.players.find(item=>item.id===playerId);if(!player)return{ok:false,error:'Unknown player.'};vote.votes[player.id]=String(choiceId);player.decisions++;const remaining=multiplayer.players.filter(item=>!vote.votes[item.id]);vote.voterIndex=remaining.length?multiplayer.players.indexOf(remaining[0]):-1;if(remaining.length)return{ok:true,ready:false,next:remaining[0],votes:clone(vote.votes)};const counts=Object.fromEntries(vote.choiceIds.map(id=>[id,0]));for(const id of Object.values(vote.votes))counts[id]++;const captain=this.active(multiplayer),winner=[...vote.choiceIds].sort((a,b)=>counts[b]-counts[a]||(vote.votes[captain?.id]===b?1:0)-(vote.votes[captain?.id]===a?1:0)||vote.choiceIds.indexOf(a)-vote.choiceIds.indexOf(b))[0];return{ok:true,ready:true,winner,counts,caption:`${counts[winner]} of ${multiplayer.players.length} votes`};}
  }

  class SagaEngine{
    chapterFor({stage=1,branch=0,totalStages=3,finale=false}={}){if(finale)return clone(SAGA_CHAPTERS[9]);const beat=(Math.max(1,Math.round(stage))-1)*3+clamp(Math.round(branch),0,2),totalBeats=Math.max(1,Math.round(totalStages))*3,index=clamp(Math.floor(beat*9/totalBeats),0,8);return clone(SAGA_CHAPTERS[index]);}
    scene({stage=1,branch=0,totalStages=3,hero='the unscripted hero',rival='the rival',finale=false}={}){const chapter=this.chapterFor({stage,branch,totalStages,finale});return{...chapter,id:`${chapter.id}-${finale?'finale':`${stage}-${branch}`}`,prompt:`${chapter.objective} ${chapter.reveal} ${hero} must choose while ${rival} watches for the cost.`,choices:clone(chapter.choices)};}
    objective(state,options={}){const chapter=this.chapterFor(options),history=state?.v14?.saga?.history||[],last=history.at(-1);return{chapter:chapter.number,act:chapter.act,title:chapter.title,objective:chapter.objective,reveal:chapter.reveal,macguffin:clone(chapter.macguffin),lastChoice:last?.label||'',historyCount:history.length};}
    applyChoice(state,scene,choiceId){const choice=scene?.choices?.find(item=>item.id===choiceId);if(!choice)return{ok:false,error:'That story choice does not exist.'};const saga=state.v14.saga,effect=clone(choice.effect),intent=INTENTIONS[choice.intent];for(const key of ['hope','order','freedom','truth'])saga.axes[key]=Number(saga.axes[key]||0)+Number(effect[key]||0);if(!saga.macguffins.includes(scene.macguffin.id))saga.macguffins.push(scene.macguffin.id);const entry={sceneId:scene.id,chapter:scene.number,title:scene.title,label:choice.label,choiceId:choice.id,intent:choice.intent,effect,spin:Number(state.spin||0),playerId:state.v14.multiplayer.players[state.v14.multiplayer.activeIndex]?.id||'player-1'};saga.history.push(entry);saga.history=saga.history.slice(-80);saga.currentChapter=scene.number;saga.currentObjective=scene.objective;return{ok:true,choice:clone(choice),effect,entry,intention:clone(intent)};}
  }

  class ChoiceForgeEngine{
    options(){return{intentions:clone(INTENTIONS),skills:clone(SKILLS)};}
    setIntent(state,{stance='protect',description='',skill='insight',risk='measured'}={}){if(!INTENTIONS[stance])return{ok:false,error:'Choose a valid intent.'};if(!SKILLS[skill])return{ok:false,error:'Choose a valid skill.'};state.v14.intent={stance,description:String(description||'').trim().slice(0,240),skill,risk:['safe','measured','bold'].includes(risk)?risk:'measured',setAtSpin:Number(state.spin||0)};return{ok:true,intent:clone(state.v14.intent)};}
    bonuses(state,strategy=''){const intent=state?.v14?.intent||{},model=INTENTIONS[intent.stance]||INTENTIONS.protect;return{battle:Number(model.battle[strategy]||0),hazard:Number(model.hazard||0),axes:clone(model.axes),label:model.label};}
    resolveCustom(state,{text='',skill='insight',risk='measured',sceneId='scene'}={}){
      const plan=String(text||'').trim();if(plan.length<8)return{ok:false,error:'Describe the plan in at least eight characters.'};if(!SKILLS[skill])return{ok:false,error:'Choose a valid skill.'};const sheet=state?.customCharacter?.v14,bonus=Number(sheet?.skills?.[skill]?.bonus||0),riskDC={safe:10,measured:13,bold:16}[risk]||13,roll=1+(hash32(`${state.seed}|${state.spin}|${sceneId}|${plan}|${skill}`)%20),total=roll+bonus,success=total>=riskDC,critical=roll===20,consequence=success?{fate:critical?2:1,energy:risk==='bold'?-.05:0,freedom:1,truth:1}:{energy:risk==='safe'?-.04:risk==='bold'?-.14:-.09,heat:risk==='bold'?2:1,truth:1};const result={ok:true,plan,skill,risk,roll,bonus,total,dc:riskDC,success,critical,consequence,label:success?'The plan changes the chapter':'The plan works, but the chapter collects a cost'};state.v14.saga.customPlans.push({...result,sceneId,spin:Number(state.spin||0)});state.v14.saga.customPlans=state.v14.saga.customPlans.slice(-40);for(const key of ['hope','order','freedom','truth'])state.v14.saga.axes[key]+=Number(consequence[key]||0);return result;
    }
  }

  function migrateV14(state={}){
    const creator=new CharacterCreationEngine(),multiplayerEngine=new MultiplayerEngine();state.v14||={};const v14=state.v14;v14.schemaVersion=V14_SCHEMA_VERSION;
    const previousGroup=v14.multiplayer,normalizedGroup=previousGroup?.players?.length?multiplayerEngine.normalize(previousGroup):multiplayerEngine.create();
    normalizedGroup.activeIndex=clamp(previousGroup?.activeIndex||0,0,normalizedGroup.players.length-1);normalizedGroup.round=Math.max(1,Math.round(Number(previousGroup?.round)||1));normalizedGroup.vote=previousGroup?.vote||null;
    normalizedGroup.players=normalizedGroup.players.map((player,index)=>({...player,...clone(previousGroup?.players?.[index]||{}),id:player.id,name:String(previousGroup?.players?.[index]?.name||player.name).slice(0,30),color:player.color}));v14.multiplayer=normalizedGroup;
    v14.saga={currentChapter:1,currentObjective:SAGA_CHAPTERS[0].objective,axes:{hope:0,order:0,freedom:0,truth:0},history:[],customPlans:[],macguffins:[],bossPowerModifier:0,finalePending:false,...(v14.saga||{})};v14.saga.axes={hope:0,order:0,freedom:0,truth:0,...v14.saga.axes};v14.intent={stance:'protect',description:'',skill:'insight',risk:'measured',setAtSpin:0,...v14.intent};v14.assetAudit={reviewed:0,flagged:0,...v14.assetAudit};if(state.customCharacter&&!state.customCharacter.v14)state.customCharacter.v14=creator.preset(state.customCharacter.archetype);return state;
  }

  function assetFor(kind,id,manifest=root.GAME_ASSET_MANIFEST||[]){const normalizedKind=kind==='artifact'?'item':kind;return(manifest||[]).find(entry=>entry.kind===normalizedKind&&entry.id===id)||null;}

  const api={V14_SCHEMA_VERSION,POINT_BUY_BUDGET,ABILITY_KEYS,ABILITY_META,SKILLS,LINEAGES,CALLINGS,BACKGROUNDS,INTENTIONS,MACGUFFINS,SAGA_CHAPTERS,CharacterCreationEngine,MultiplayerEngine,SagaEngine,ChoiceForgeEngine,migrateV14,assetFor,hash32};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
