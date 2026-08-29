'use strict';

(function attachWorldContent(root,factory){
  const api=factory();
  root.WORLD_CONTENT_CATALOG=api.WORLD_CONTENT_CATALOG;
  root.WORLD_CONTENT_META=api.WORLD_CONTENT_META;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window,function(){
  const RARITIES=['common','uncommon','rare','epic','legendary'];
  const TARGETS={
    building:['settlement','stronghold','faction','operation','mission','shop','travel','world'],
    place:['world','travel','operation','mission','activity','crisis','settlement'],
    interior:['shop','stronghold','operation','mission','settlement','faction'],
    item:['shop','inventory','crafting','operation','mission','crisis','stronghold','settlement'],
    vehicle:['travel','race','activity','operation','mission','faction','crisis','stronghold'],
    npc:['settlement','shop','faction','operation','mission','activity','crisis','stronghold'],
    stronghold:['stronghold','faction','mission','crisis'],
    settlement:['settlement','civilian','crisis','world'],
    activity:['activity','race','tournament','world'],
    crisis:['crisis','world','mission','stronghold','civilian'],
    icon:['ui','status','inventory','world','mission']
  };
  const THEMES=[
    {name:'Neon',theme:'cyberpunk',tags:['city','technology','night']},
    {name:'Frontier',theme:'frontier',tags:['rugged','civilian','outpost']},
    {name:'Aegis',theme:'heroic',tags:['defense','faction','security']},
    {name:'Sunspire',theme:'fantasy',tags:['arcane','radiant','ancient']},
    {name:'Ironroot',theme:'industrial',tags:['forge','mechanical','heavy']},
    {name:'Voidglass',theme:'cosmic',tags:['space','dimensional','strange']}
  ];
  const compact=(value)=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const uniq=list=>[...new Set((list||[]).map(String).filter(Boolean))];
  const title=(theme,type)=>`${theme.name} ${type.name}`;
  function records(kind,themes,types){
    let n=0;
    return themes.flatMap((theme,ti)=>types.map((type,yi)=>{
      const name=type.nameTemplate?type.nameTemplate.replace('{theme}',theme.name):title(theme,type);
      const rarity=type.rarity||RARITIES[(ti+yi)%RARITIES.length];
      const id=`v26-${kind}-${compact(name)}`;
      n+=1;
      return {
        id,kind,name,subtype:type.subtype||compact(type.name),sourceFranchise:'Spinner Original Multiverse',
        world:type.world||theme.theme||'multiverse',faction:type.faction||'neutral',rarity,
        tags:uniq([kind,theme.theme,...theme.tags,...(type.tags||[])]),
        path:`generated:v26/${kind}/${id}`,mime:'image/svg+xml',width:720,height:480,sha256:null,
        sourcePage:'generated-project-art',verified:true,fallbackAllowed:true,
        usageTargets:uniq([...(TARGETS[kind]||[]),...(type.usageTargets||[])]),
        notes:type.notes||`V26 rights-safe project art: ${kind} ${n}.`,
        visualSeed:`${kind}|${theme.name}|${type.name}|${ti}|${yi}`
      };
    }));
  }

  const buildingTypes=[
    {name:'Clinic',subtype:'medical',tags:['medical','relief','health']},
    {name:'Market Hall',subtype:'market',tags:['vendor','economy','civilian']},
    {name:'Academy',subtype:'academy',tags:['training','school','mentor']},
    {name:'Archive',subtype:'archive',tags:['library','knowledge','relic']},
    {name:'Forgeworks',subtype:'forge',tags:['crafting','equipment','industrial']},
    {name:'Transit Depot',subtype:'depot',tags:['transport','vehicle','logistics']},
    {name:'Sanctuary',subtype:'sanctuary',tags:['refugee','recovery','civilian']},
    {name:'Arena',subtype:'arena',tags:['tournament','combat','activity']}
  ];
  const placeTypes=[
    {name:'Downtown Sector',subtype:'city',tags:['city','street','vendor']},
    {name:'Wildwood Reach',subtype:'forest',tags:['forest','wildlife','hunt']},
    {name:'Storm Coast',subtype:'coast',tags:['ocean','port','weather']},
    {name:'Ashen Wastes',subtype:'wasteland',tags:['ruin','hazard','post-apocalyptic']},
    {name:'Skybreak Peaks',subtype:'mountain',tags:['mountain','training','hidden']},
    {name:'Starport Ring',subtype:'space-station',tags:['space','travel','vehicle']},
    {name:'Hidden Temple',subtype:'temple',tags:['shrine','relic','ancient']},
    {name:'Fracture Zone',subtype:'fracture',tags:['dimensional','corruption','crisis']}
  ];
  const interiorThemes=THEMES.slice(0,5);
  const interiorTypes=[
    {name:'War Room',subtype:'war-room',tags:['command','faction','strategy']},
    {name:'Medical Bay',subtype:'medical-bay',tags:['medical','wound','recovery']},
    {name:'Workshop',subtype:'workshop',tags:['crafting','forge','repair']},
    {name:'Vault Interior',subtype:'vault',tags:['relic','secure','treasure']},
    {name:'Hangar Deck',subtype:'hangar',tags:['vehicle','travel','logistics']},
    {name:'Common Hall',subtype:'common-hall',tags:['civilian','party','social']}
  ];
  const itemTypes=[
    {name:'Pulse Blade',subtype:'weapon',tags:['weapon','energy','melee']},
    {name:'Aegis Shield',subtype:'shield',tags:['armor','defense','equipment']},
    {name:'Phase Grappler',subtype:'gadget',tags:['gadget','mobility','technology']},
    {name:'Restoration Kit',subtype:'healing',tags:['healing','consumable','medical']},
    {name:'Catalyst Core',subtype:'catalyst',tags:['transformation','crafting','energy']},
    {name:'Relic Fragment',subtype:'relic-fragment',tags:['relic','crafting','rare']},
    {name:'Field Rations',subtype:'provisions',tags:['food','supply','civilian']},
    {name:'Quantum Battery',subtype:'fuel',tags:['fuel','vehicle','technology']},
    {name:'Siege Charge',subtype:'siege-supply',tags:['stronghold','siege','mission']},
    {name:'Recovery Supply Crate',subtype:'relief-supply',tags:['settlement','relief','construction']}
  ];
  const vehicleThemes=THEMES.slice(0,5);
  const vehicleTypes=[
    {name:'Street Runner',subtype:'car',tags:['car','race','ground']},
    {name:'Courier Bike',subtype:'motorcycle',tags:['motorcycle','race','ground']},
    {name:'Cargo Hauler',subtype:'truck',tags:['truck','cargo','logistics']},
    {name:'Rescue Carrier',subtype:'rescue',tags:['ambulance','evacuation','civilian']},
    {name:'Siege APC',subtype:'apc',tags:['war','armored','faction']},
    {name:'Kestrel VTOL',subtype:'vtol',tags:['air','helicopter','mission']},
    {name:'Starfighter',subtype:'starfighter',tags:['space','combat','fast']},
    {name:'Dimensional Skiff',subtype:'dimensional',tags:['portal','travel','cosmic']}
  ];
  const npcThemes=THEMES.slice(0,5);
  const npcTypes=[
    {name:'Field Medic',subtype:'medic',tags:['medical','relief','civilian']},
    {name:'Quartermaster',subtype:'quartermaster',tags:['vendor','supply','stronghold']},
    {name:'Portal Engineer',subtype:'engineer',tags:['technology','travel','stronghold']},
    {name:'Faction Operative',subtype:'operative',tags:['faction','mission','covert']},
    {name:'Scavenger',subtype:'scavenger',tags:['salvage','wasteland','vendor']},
    {name:'Arena Host',subtype:'host',tags:['activity','tournament','civilian']}
  ];
  const strongholdThemes=THEMES.slice(0,4);
  const strongholdTypes=[
    {name:'Command Bastion',subtype:'command',tags:['command','faction','defense']},
    {name:'Relic Citadel',subtype:'relic-vault',tags:['relic','vault','secure']},
    {name:'Portal Fortress',subtype:'portal',tags:['travel','dimensional','defense']},
    {name:'Research Keep',subtype:'research',tags:['science','archive','technology']},
    {name:'Refuge Stronghold',subtype:'refuge',tags:['civilian','sanctuary','relief']}
  ];
  const settlementThemes=[
    {name:'Intact',theme:'stable',tags:['intact','civilian','safe']},
    {name:'Strained',theme:'strained',tags:['strained','supply','civilian']},
    {name:'Rebuilding',theme:'rebuilding',tags:['rebuilding','construction','recovery']},
    {name:'Fortified',theme:'fortified',tags:['fortified','security','faction']}
  ];
  const settlementTypes=[
    {name:'Township',subtype:'town',tags:['town','housing','market']},
    {name:'Harbor Community',subtype:'harbor',tags:['port','food','travel']},
    {name:'Industrial Ward',subtype:'industrial',tags:['factory','crafting','jobs']},
    {name:'Sanctuary District',subtype:'sanctuary',tags:['refugee','relief','housing']},
    {name:'Frontier Village',subtype:'village',tags:['village','farm','civilian']}
  ];
  const activityThemes=[
    {name:'Circuit',theme:'competition',tags:['competition','crowd','score']},
    {name:'Grand',theme:'elite',tags:['elite','tournament','rare']},
    {name:'Community',theme:'civilian',tags:['civilian','festival','friendly']},
    {name:'Hazard',theme:'extreme',tags:['hazard','danger','challenge']}
  ];
  const activityTypes=[
    {name:'Raceway',subtype:'race',tags:['race','vehicle','speed']},
    {name:'Battle Arena',subtype:'tournament',tags:['battle','tournament','combat']},
    {name:'Relic Trial Grounds',subtype:'trial',tags:['relic','trial','training']},
    {name:'Hunt Course',subtype:'hunt',tags:['hunt','wildlife','tracking']},
    {name:'Rescue Drill Zone',subtype:'rescue-drill',tags:['rescue','civilian','training']}
  ];
  const crisisThemes=[
    {name:'Fractured',theme:'reality-fracture',tags:['fracture','dimensional','crisis']},
    {name:'Corrupted',theme:'corruption',tags:['corruption','hazard','crisis']},
    {name:'Besieged',theme:'invasion',tags:['invasion','siege','crisis']},
    {name:'Temporal',theme:'temporal',tags:['time','anomaly','crisis']}
  ];
  const crisisTypes=[
    {name:'Skyline',subtype:'city-crisis',tags:['city','evacuation','damage']},
    {name:'Stronghold',subtype:'stronghold-crisis',tags:['stronghold','breach','defense']},
    {name:'Refugee Corridor',subtype:'refugee-crisis',tags:['refugee','civilian','evacuation']},
    {name:'Relic Core',subtype:'relic-crisis',tags:['relic','energy','meltdown']},
    {name:'Reality Gate',subtype:'portal-crisis',tags:['portal','dimensional','invasion']}
  ];
  const iconThemes=[
    {name:'Core',theme:'core-ui',tags:['ui','core']},
    {name:'Faction',theme:'faction-ui',tags:['ui','faction']},
    {name:'World',theme:'world-ui',tags:['ui','world']},
    {name:'Mission',theme:'mission-ui',tags:['ui','mission']},
    {name:'Status',theme:'status-ui',tags:['ui','status']}
  ];
  const iconTypes=[
    {name:'Battle Badge',subtype:'battle',tags:['battle','combat']},
    {name:'Travel Badge',subtype:'travel',tags:['travel','route']},
    {name:'Relic Badge',subtype:'relic',tags:['relic','artifact']},
    {name:'Vehicle Badge',subtype:'vehicle',tags:['vehicle','transport']},
    {name:'Stronghold Badge',subtype:'stronghold',tags:['stronghold','base']},
    {name:'Civilian Badge',subtype:'civilian',tags:['civilian','settlement']},
    {name:'Crisis Badge',subtype:'crisis',tags:['crisis','hazard']},
    {name:'Reward Badge',subtype:'reward',tags:['reward','loot']}
  ];

  const catalog=[
    ...records('building',THEMES,buildingTypes),
    ...records('place',THEMES,placeTypes),
    ...records('interior',interiorThemes,interiorTypes),
    ...records('item',THEMES,itemTypes),
    ...records('vehicle',vehicleThemes,vehicleTypes),
    ...records('npc',npcThemes,npcTypes),
    ...records('stronghold',strongholdThemes,strongholdTypes),
    ...records('settlement',settlementThemes,settlementTypes),
    ...records('activity',activityThemes,activityTypes),
    ...records('crisis',crisisThemes,crisisTypes),
    ...records('icon',iconThemes,iconTypes)
  ];
  const counts=catalog.reduce((out,item)=>(out[item.kind]=(out[item.kind]||0)+1,out),{});
  return {
    WORLD_CONTENT_CATALOG:Object.freeze(catalog.map(Object.freeze)),
    WORLD_CONTENT_META:Object.freeze({schemaVersion:1,release:26,total:catalog.length,counts:Object.freeze(counts),source:'generated-project-art'})
  };
});
