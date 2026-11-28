import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const folder=await mkdtemp(join(tmpdir(),'pixel-rpg-rules-'));
try{
  const outfile=join(folder,'entry.mjs');
  await build({
    stdin:{contents:`
      export * from './src/mini-games/pixel-rpg/adventure';
      export * from './src/mini-games/pixel-rpg/battle';
      export { BATTLE_ACTIONS, actionFrame, battleActionForActor } from './src/mini-games/pixel-rpg/battleActionArt';
      export { resolveBattleVoice } from './src/mini-games/pixel-rpg/battleVoice';
      export { guestSpriteUrl } from './src/mini-games/pixel-rpg/guestArt';
      export { TOWN_SHOPS } from './src/mini-games/pixel-rpg/towns';
      export * from './src/mini-games/pixel-rpg/campaign';
      export * from './src/mini-games/pixel-rpg/catalog';
      export * from './src/mini-games/pixel-rpg/save';
      export * from './src/mini-games/pixel-rpg/world';
      export * from './src/mini-games/pixel-rpg/music';
      export * from './src/mini-games/pixel-rpg/houseFurniture';
      export { definition as cardGame } from './src/mini-games/card-club/catalog';
      export { ClubSession } from './src/mini-games/card-club/session';
      export { seatsFor } from './src/mini-games/traditional-games/model';
      export { TraditionalSession } from './src/mini-games/traditional-games/session';
      export { gameCommand, tickGames } from './src/mini-games/gakuro-craft/homeGames';
      export { PROTAGONISTS } from './src/three/protagonistCatalog';
      export { ABYSS_HEROES } from './src/components/school-dungeon/dungeons2/roster';
      export { buildLesson } from './src/mini-games/gakuro-kart/questions';
      export { matchesSchoolAnswer,schoolAnswerOptions } from './src/utils/schoolAnswer';
    `,resolveDir:process.cwd()},
    outfile,platform:'node',format:'esm',bundle:true,define:{'import.meta.env':'{}'},logLevel:'silent',
  });
  const m=await import(pathToFileURL(outfile));
  assert.equal(m.JOB_LIST.length,26);
  assert.equal(m.HERO_LIST.length,53);
  assert(m.PROTAGONISTS.concat(m.ABYSS_HEROES).every(hero=>m.HEROES[hero.id]));
  const actorVoice=m.resolveBattleVoice('dungeons2-lyria','attack',()=>0);
  assert.deepEqual(actorVoice,{theme:'dungeons2',id:'lyria',file:'attack'});
  const voices=m.HERO_LIST.map(hero=>m.resolveBattleVoice(hero.id,'attack',()=>0));
  assert(voices.every(Boolean),'All 53 travelers have their own attack voice assigned');
  assert.equal(new Set(voices.map(voice=>`${voice.theme}:${voice.id}`)).size,53);
  const guests=m.HERO_LIST.filter(hero=>m.guestSpriteUrl(hero.id));
  assert.equal(guests.length,9);
  for(const {id} of guests)assert((await stat(`public/sprites/pixel-rpg/guests/${id}.webp`)).size>0);
  const names=new Set(), lines=new Set();
  const roaming=m.newAdventure('magic-akari',31);
  m.REGIONS.forEach((region,r)=>region.sites.forEach((site,s)=>{
    if(site.type!=='town')return;
    const base=m.mapId(r,s);
    for(const map of [base,...m.TOWN_SHOPS.map(service=>`${base}/${service}`)]){
      const landmark=m.area(map).points.find(point=>point.kind==='resident');
      assert(landmark?.npc,`${map} must have its own resident`);
      const action=m.interact({...roaming,map},landmark).effect;
      if(m.area(map).houseGame)assert.deepEqual(action,{type:'house-invitation',house:map});
      else{
        assert.equal(action?.type,'dialog');
        assert.deepEqual(action.scenes[0].speaker,landmark.label);
        assert.deepEqual(action.scenes[0].line,landmark.npc.line);
      }
      names.add(landmark.label[0]);lines.add(landmark.npc.line[0]);
    }
  }));
  assert.equal(names.size,88);assert.equal(lines.size,88);
  const targetBattle=m.createBattle(roaming,{region:3,variant:2});
  const first=targetBattle.enemies[0],second=targetBattle.enemies[1]??{...first,id:'other'};
  if(targetBattle.enemies.length===1)targetBattle.enemies.push(second);
  assert.equal(m.cursorTarget(targetBattle,roaming.leader,'foe',second.id),second.id);
  assert.equal(m.cursorTarget(targetBattle,roaming.leader,'self',second.id),roaming.leader);
  second.hp=0;
  assert.equal(m.cursorTarget(targetBattle,roaming.leader,'foe',second.id),first.id);
  console.log('PASS 53 distinct voice identities, nine guest sprites, 88 local residents, and cursor targeting');
  const action=(art,from='hero',to='foe',element='steel',value)=>({id:1,art,from,to,element,value});
  assert.equal(m.battleActionForActor([action('blade')],'hero'),'attack');
  assert.equal(m.battleActionForActor([action('critical','hero','foe','fire')],'hero'),'skill');
  assert.equal(m.battleActionForActor([action('gesture','hero','hero')],'hero'),'skill');
  assert.equal(m.battleActionForActor([action('status','foe','hero','dark',4)],'hero'),'damage');
  assert.equal(m.battleActionForActor([action('hit','foe','hero','steel',8)],'hero'),'damage');
  assert.equal(m.battleActionForActor([action('status','foe','hero','dark')],'hero'),undefined);
  assert.equal(m.battleActionForActor([],'hero',true),'skill');
  for(const hero of m.HERO_LIST){
    const original=m.newAdventure(hero.id,31);
    assert(m.validAdventure(original));
    assert.equal(original.heroes[hero.id].deck.length,10);
    assert(original.heroes[hero.id].deck.some(c=>c.key===hero.signature.id));
    assert(m.createBattle(original,{region:0,variant:0}).party[0].hand.length>=3);
    const frames=m.JOB_LIST.flatMap(job=>m.BATTLE_ACTIONS.map(art=>{
      const frame=m.actionFrame(hero.id,job.id,art);
      assert(Number.isInteger(frame),`${hero.id}/${job.id} missing ${art}`);
      return frame;
    }));
    assert.equal(new Set(frames).size,frames.length,`${hero.id} reuses an action frame`);
  }
  console.log('PASS physical/skill/damage selection and distinct battle frames for all 53 heroes across 26 jobs');
  console.log('PASS 53 named protagonists, individual signatures, 26 jobs, and 10-card starter builds');

  const directions=Object.keys(m.OFFSETS);
  const key=p=>`${p.x},${p.y}`;
  const route=(state,goal,allowedVehicle)=>{
    const nodeKey=node=>`${key(node.at)}:${node.vehicle}`;
    const seen=new Set([nodeKey(state)]),queue=[{p:state.at,vehicle:state.vehicle,from:-1,command:null}];
    let last=-1;
    for(let i=0;i<queue.length;i++){
      const {p,vehicle}=queue[i];
      if(goal(p)){last=i;break;}
      const candidate={...state,at:p,vehicle,trail:[p],repellent:64};
      const enqueue=(next,command)=>{
        if(next.map!==state.map||seen.has(nodeKey(next)))return;
        seen.add(nodeKey(next));queue.push({p:next.at,vehicle:next.vehicle,from:i,command});
      };
      for(const d of directions)enqueue(m.step(candidate,d).state,d);
      if(allowedVehicle&&vehicle!==allowedVehicle)enqueue(m.mount(candidate,allowedVehicle).state,'board');
    }
    assert(last>=0,`No route from ${state.map} ${key(state.at)} (${state.vehicle}) · visited ${seen.size} cells`);
    const res=[];
    for(let i=last;queue[i].from>=0;i=queue[i].from)res.push(queue[i].command);
    return res.reverse();
  };
  const advance=(state,goal,allowedVehicle)=>{
    for(const d of route(state,goal,allowedVehicle)){
      state=d==='board'?m.mount(state,allowedVehicle).state:m.step({...state,repellent:64},d).state;
    }
    return state;
  };
  const at=(state,l,allowedVehicle)=>advance(state,p=>m.same(p,l),allowedVehicle);
  const near=(state,l)=>advance(state,p=>m.distance(p,l)===1);
  const point=(s,kind)=>m.area(s.map).points.find(p=>p.kind===kind);
  const use=(s,kind)=>{
    const p=point(s,kind);
    assert(p,`Missing ${kind} in ${s.map}`);
    const next=m.interact(['gate','rock','secret'].includes(kind)?near(s,p):at(s,p),p);
    assert(next.state!==s||next.effect,`Interaction failed ${p.id}`);
    return next;
  };
  const layouts=new Map(), assets=new Set(), families={furniture:0,cards:0,traditional:0};
  let householdSave;
  for(const [r,region] of m.REGIONS.entries())for(const [i,site] of region.sites.entries()){
    if(site.type!=='town')continue;
    for(const service of m.TOWN_SHOPS){
      const town=m.mapId(r,i),room=m.area(`${town}/${service}`);
      const base=m.area(town),door=base.points.find(p=>p.link===room.id);
      const inside=m.interact(at({...roaming,map:town,at:base.start},door),door).state;
      assert.equal(inside.map,room.id);
      assert(m.same(inside.at,room.start));
      const signature=JSON.stringify(room.furniture);
      const layout=service==='home'?room.id:service;
      const previous=layouts.get(layout);
      if(previous)assert.equal(signature,previous);
      else assert(![...layouts.values()].includes(signature),`Shared layout for ${room.id}`);
      layouts.set(layout,signature);
      for(const piece of room.furniture)assets.add(piece[0]);
      for(const point of room.points){
        if(point.kind==='house-game')continue;
        assert(!m.furnitureAt(room,point),`${point.id} is under furniture`);
        assert(m.same(at(inside,point).at,point),`${point.id} is unreachable`);
      }
      const exit=point(inside,'exit');
      assert.equal(m.interact(at(inside,exit),exit).state.map,town);
      if(!room.houseGame)continue;
      const house=room.houseGame,board=point(inside,'house-game'),owner=point(inside,'resident');
      const {gold,item,quantity}=house.reward;
      families[house.family]++;
      assert.equal(m.furnitureAt(room,board),house.table);
      assert.deepEqual(at(inside,owner).at,{x:owner.x,y:owner.y});
      const beside=near(inside,board);
      const direction=directions.find(d=>m.same(m.add(beside.at,m.OFFSETS[d]),board));
      assert.deepEqual(m.interact({...beside,direction}).effect,{type:'house-invitation',house:room.id});
      const win=m.grantHouseReward(inside,room.id).state;
      assert.equal(win.gold,inside.gold+gold);
      assert.equal(win.items[item],inside.items[item]+quantity);
      assert.strictEqual(m.grantHouseReward(win,room.id).state,win);
      assert.strictEqual(m.grantHouseReward(inside,town).state,inside);
      assert.equal(m.grantHouseReward({...inside,items:{...inside.items,[item]:999}},room.id).state.items[item],999);
      const restored=m.restoreAdventure({...win,at:board,trail:[board]});
      assert(!m.furnitureAt(room,restored.at));
      assert(m.same(at(restored,exit).at,exit),'Old saves inside furniture can reach the exit');
      if(r===0)householdSave=restored;
      if(house.family==='furniture')continue;
      const seats=house.family==='cards'?m.cardGame(house.game).players:m.seatsFor(house.game);
      assert(seats.includes(2));
      let packet;
      const session=house.family==='cards'?new m.ClubSession('hero','',(_,v)=>packet=v):new m.TraditionalSession('hero','',(_,v)=>packet=v);
      const resident={name:owner.label[1],hero:'pixel-rpg-resident'};
      assert(session.join({id:'hero',name:'Akari',hero:'magic-akari',cpu:false}));
      assert(session.configure(house.game,2));
      assert(session.start(123,resident));
      assert.equal(packet.view.game,house.game);
      assert.equal(packet.view.players.length,2);
      assert.equal(packet.view.players[1].name,resident.name);
      assert.equal(packet.view.players[1].hero,resident.hero);
      assert(session.state.players[1].cpu);
    }
  }
  assert.equal(layouts.size,17);assert.deepEqual(families,{furniture:2,cards:3,traditional:3});
  for(const art of assets)assert((await stat(`public/sprites/rpg/furniture/${art}.webp`)).size>0);
  const {world,player,game}=m.startHouseBoard('connectfour','Akari');
  for(const cell of [3,1,2,0]){
    m.gameCommand(world,player,{type:'game_board',key:game.key,cell,round:game.round});
    world.time+=.8;m.tickGames(world,.8);
  }
  assert.equal(game.party.board.filter(v=>v===2).length,3);
  assert.equal(m.houseBoardResult(game),'win');
  const reversi=m.startHouseBoard('reversi','Akari');
  m.gameCommand(reversi.world,reversi.player,{type:'game_board',key:reversi.game.key,cell:19,round:reversi.game.round});
  assert(reversi.game.party.cpuTurn);
  reversi.world.time=1;m.tickGames(reversi.world,1);
  assert.equal(reversi.game.party.board.filter(Boolean).length,6);
  const tiedBoard=Array.from({length:42},(_,i)=>1+(Math.floor(i%7/2)+Math.floor(i/7))%2);
  assert.equal(m.houseBoardResult({...game,party:{...game.party,board:tiedBoard}}),'draw');
  console.log('PASS nine shop plans, eight distinct accessible houses, new furniture, CPU seats and genuine furniture board matches');
  let s=m.newAdventure('high-school-warrior',8517,{encounters:'symbol'});
  assert.equal(s.party.length,1);
  s=use(s,'keeper').state;
  assert.equal(s.party.length,3);
  assert(s.flags.includes('guild'));
  const lead=s.party[0];
  let altered=m.changeJob(s,lead,'guardian');
  assert.equal(altered.heroes[lead].job,'guardian');
  assert(m.maxHp(altered.heroes[lead])>m.maxHp(s.heroes[lead]));
  altered=m.editDeck({...altered,gold:120},lead,'add','remedy').state;
  altered=m.editDeck(altered,lead,'fuse',0,3).state;
  assert.equal(m.resolveParts(altered.heroes[lead].deck[0]).length,2);
  assert.equal(altered.heroes[lead].deck.length,10);
  const q={id:'signed',mode:'MATH_G7_POSITIVE_NEGATIVE',question:'小さい順に並べよ',options:['-3,-1,1','1,-1,-3','-1,-3,1','1,-3,-1'],correct:0};
  assert(!m.matchesSchoolAnswer(q.options[1],q.options[0],m.schoolAnswerOptions(q.mode,q.question)));
  assert.equal(m.applyStudy(s,q,false).state.learned.missed.length,1);
  assert.equal(m.applyStudy(m.applyStudy(s,q,false).state,q,true).state.learned.missed.length,0);
  assert.equal(m.buildLesson({mode:'ADDITION'},3).questions.length,3);

  const featured=new Set();
  const activate=(s)=>{
    const feature=point(s,'feature'),rock=point(s,'rock');
    if(rock){
      const plate=point(s,'plate'), shove=plate.x>rock.x?'right':'left';
      const p={x:rock.x-m.OFFSETS[shove].x,y:rock.y};
      s=at(s,p);
      for(let i=0;i<2*m.distance(rock,plate)-1;i++)s=m.step(s,shove).state;
      assert(s.flags.includes(s.map+':mechanism'),`Push rock onto plate in ${s.map}`);
      featured.add('rock');
    }else if(feature){
      s=use(s,'feature').state;
      assert(s.flags.includes(s.map+':mechanism'));
      featured.add(feature.feature);
    }
    return s;
  };
  const dungeonPlans=new Set();
  for(const [region,data] of m.REGIONS.entries())for(const [site,location] of data.sites.entries()){
    if(!['dungeon','sanctuary'].includes(location.type))continue;
    for(let floor=0;floor<m.floors(region,site);floor++){
      const id=m.mapId(region,site,floor),level=m.area(id);
      dungeonPlans.add(Buffer.from(level.tiles).toString('base64'));
      const probe={...m.newAdventure('magic-akari',207,{encounters:'symbol'}),map:id,at:level.start,trail:[level.start],repellent:64};
      assert(m.same(at(probe,point(probe,'exit')).at,point(probe,'exit')));
      const end=level.points.find(p=>['recruit','stairs','boss'].includes(p.kind));
      assert(m.same(at(activate(probe),end).at,end),`The puzzle opens the route on ${id}`);
      const passage=point(probe,'secret');
      const opened=m.interact(near(probe,passage),passage).state;
      const hidden=level.points.find(p=>p.id.endsWith(':north-cache'));
      assert(m.same(at(opened,hidden).at,hidden),`The optional passage reaches its rewards in ${id}`);
    }
  }
  assert(dungeonPlans.size>=16);
  console.log(`PASS ${dungeonPlans.size} distinct dungeon layouts, entry/exit, mechanisms and hidden rooms`);
  function finishBattle(state,encounter,useStudy=false){
    let b=m.createBattle(state,encounter);
    assert(b.enemies.every(e=>e.intent&&e.target));
    let phase=false, combo=false;
    for(let turn=0;turn<28&&!b.outcome;turn++){
      if(useStudy){
        const actor=b.party.find(p=>p.hp>0)?.id;
        if(actor){const before=b.link;b=m.studyBonus(b,actor,true);assert(b.spentStudy&&b.link>=before);assert.equal(m.studyBonus(b,actor,true),b);}
      }
      for(const actor of state.party){
        for(let n=0;n<6&&!b.outcome;n++){
          const p=m.fighter(b,actor);if(!p)break;
          const ally=b.party.slice().sort((x,y)=>x.hp/x.max-y.hp/y.max).find(x=>x.hp>0);
          const down=b.party.find(x=>x.hp<=0);
          if(down&&b.items.dew>0&&p.freeItem)b=m.battleItem(b,'dew',actor,down.id);
          if(p.hp/p.max<.5&&b.items.tonic>0&&p.freeItem)b=m.battleItem(b,'tonic',actor,p.id);
          const enemy=m.living(b).slice().sort((x,y)=>x.hp-y.hp)[0];
          if(!enemy)break;
          const link=m.availableCombos(b).find(c=>c.id==='all'||c.id==='courage'||c.id==='wisdom'||c.id==='crossfire')??m.availableCombos(b)[0];
          if(link&&b.link>=m.LINK_MAX){
            b=m.useCombo(b,link.id,enemy.id);
            combo=true;
            if(b.outcome)break;
          }
          if(p.limit>=m.LIMIT_MAX){
            b=m.useLimit(b,p.id,enemy.id);
            if(b.outcome)break;
          }
          const score=card=>{
            const resolved=m.inspect(card);
            return resolved.parts.reduce((sum,x)=>sum+(x.skill.damage??0)*(x.skill.repeats??1)+(x.skill.heal&&ally.hp/ally.max<.64?28:0)+
              (x.skill.block??0)*.32+(x.skill.poison??0)*1.6+(x.skill.draw??0)*1.5,0);
          };
          const card=m.fighter(b,actor)?.hand.filter(c=>m.canPlay(b,m.fighter(b,actor),c)).sort((a,b)=>score(b)-score(a))[0];
          if(!card)break;
          const target=m.inspect(card).target==='ally'?ally.id:enemy.id;
          const next=m.playCard(b,actor,card.id,target);
          assert(next!==b);
          phase||=next.enemies.some(e=>e.phase===2);
          b=next;
        }
      }
      if(!b.outcome)b=m.endTurn(b);
    }
    assert.equal(b.outcome,'win',`Could not win r${encounter.region} ${encounter.boss} with study=${useStudy}. Last turns: ${JSON.stringify(b.history.slice(0,5))}`);
    state={...state,items:b.items,rng:b.rng};
    return {reward:m.completeBattle(state,encounter,m.victory(b)),phase,combo};
  }
  let fights=0,phases=0,links=0;
  const run=(e,withStudy=false)=>{
    const win=finishBattle(s,e,withStudy);
    s=win.reward.state; fights++;phases+=Number(win.phase);links+=Number(win.combo);
    return win;
  };
  // Enter every main boss room and clear the whole campaign without requiring any quiz.
  for(let region=0;region<7;region++){
    assert.equal(s.stage,region);
    if(region>0)s=use(s,'keeper').state;
    s=use(s,'camp').state;
    s=use(s,'exit').state;
    assert.equal(s.map,'world');
    const site=region===3?2:1;
    const locate=site=>m.area('world').points.find(l=>l.link===m.mapId(region,site));
    const dest=locate(site);
    s=at(s,dest);
    s=m.interact(s,dest).state;
    assert.equal(s.map,m.mapId(region,site));
    if(region===0)s=use(s,'recruit').state;
    else if(region!==2&&m.area(s.map).place==='dungeon')s=activate(s);
    s=use(s,'chest').state;
    assert(s.flags.includes(`book-${region}`));
    assert.equal(s.party.length,4);
    for(const enemy of m.area(s.map).points.filter(p=>p.kind==='enemy')){
      const event=m.interact(at(s,enemy),enemy);s=event.state;
      const fight=event.effect;
      assert.equal(fight.type,'battle');
      run(fight.encounter);
    }
    s=use(s,'exit').state;
    const bossEntrance=locate(4);
    if(region===3){
      s=advance(s,p=>m.isShore(m.area('world'),p));
      s=m.mount(s,'submarine').state;
      assert.equal(s.vehicle,'submarine');
    }
    s=at(s,bossEntrance,region===3?'submarine':undefined);
    s=m.interact(s,bossEntrance).state;
    assert.equal(s.map,m.mapId(region,4));
    s=use(s,'camp').state;
    run({region,variant:1});
    for(let f=0;f<m.floors(region,4);f++){
      s=activate(s);
      const down=point(s,'stairs');
      if(down)s=m.interact(at(s,down),down).state;
    }
    const event=use(s,'boss');s=event.state;
    const boss=event.effect;
    assert.equal(boss.type,'battle');
    const win=run(boss.encounter);
    if(region===5)assert.equal(win.reward.effect.type,'ending');
    assert.equal(s.stage,region+1);
    const checkpoint=m.recover(s);
    assert.equal(checkpoint.map,s.checkpoint.map);
    assert(checkpoint.party.every(id=>checkpoint.heroes[id].hp===m.maxHp(checkpoint.heroes[id])));
    while(s.map!=='world')s=use(s,'exit').state;
    if(region===6)break;
    const target=m.sitePoint(region+1,0), vehicle=m.REGIONS[region].grant??m.REGIONS[region+1].required;
    if(!m.isAir(vehicle)&&s.vehicle!==vehicle){
      s=advance(s,p=>m.isShore(m.area('world'),p)||m.isWater(m.tileAt(m.area('world'),p)));
    }
    s=m.mount(s,vehicle).state;
    assert.equal(s.vehicle,vehicle,`Board ${vehicle}`);
    s=at(s,target,vehicle);
    const nextTown=m.area('world').points.find(p=>m.same(p,target));
    s=m.interact(s,nextTown).state;
    assert.equal(s.map,m.mapId(region+1,0));
  }
  assert(s.ending&&s.stage===7);
  assert(fights>=20&&phases>=5&&links>=7);
  assert(featured.size>=6);
  assert.equal(m.newAdventure(s.leader,123,{},s).cycle,1);
  assert.equal(m.newAdventure(s.leader,123,{},s).stage,0);
  assert(m.newAdventure(s.leader,123,{},s).heroes[lead].level>1);
  let cleared=s;
  for(let region=0;region<7;region++){
    const trial=finishBattle(cleared,{region,variant:0,boss:true,rush:region},true);
    cleared=trial.reward.state;
    if(region<6)assert.equal(trial.reward.effect.encounter.rush,region+1);
  }
  assert.equal(cleared.rank,1);assert(cleared.unlockedCards.includes('transfigure'));
  console.log(`PASS story through the ending and postgame, ${fights} completed fights, ${phases} phase shifts, ${links} Link battles, ${featured.size} puzzle types and all five vessels`);

  let loss=m.createBattle(m.newAdventure('magic-akari',21),{region:5,variant:0,boss:true});
  for(let i=0;i<30&&!loss.outcome;i++)loss=m.endTurn(loss);
  assert.equal(loss.outcome,'loss');
  const powered=m.createBattle(s,{region:5,variant:0,boss:true});
  const actor=powered.party[0].id;
  const boosted=m.studyBonus(powered,actor,true);
  assert.equal(m.fighter(boosted,actor).energy,m.fighter(powered,actor).energy+1);
  const noTarget=powered.party[0].hand.find(c=>m.inspect(c).target==='foe');
  assert.equal(m.playCard(powered,actor,noTarget.id,'not-a-target'),powered);
  const carried=m.createBattle({...s,link:m.LINK_MAX-2},{region:0,variant:0,surprise:'party'});
  assert.equal(carried.link,m.LINK_MAX);
  const duet=m.availableCombos(carried).find(combo=>combo.id==='road-duet');
  assert(duet&&m.COMBOS.length>=24);
  assert(!m.availableCombos(m.createBattle(m.newAdventure('magic-akari',24),{region:0,variant:0})).length);
  const linked=m.useCombo(carried,duet.id,m.comboMembers(carried,duet)[0].id);
  assert.equal(linked.link,0);
  const following=m.createBattle({...s,link:linked.link},{region:0,variant:0});
  assert.equal(following.link,0);
  const exhausted={...carried,party:carried.party.map((p,i)=>i===0?{...p,energy:0,hand:[]}:p)};
  assert.equal(m.nextActingHero(exhausted,exhausted.party[0].id),exhausted.party[1].id);
  assert(!m.canAct(exhausted,exhausted.party[0]));
  const freeCards=carried.party[0].hand.slice(0,2).map(card=>({...card,value:{key:'camp-shield'},temporary:true}));
  const zeroCost={...exhausted,party:exhausted.party.map((p,i)=>i===0?{...p,hand:freeCards}:p)};
  const firstHero=zeroCost.party[0].id;
  assert(m.canAct(zeroCost,zeroCost.party[0]));
  assert.equal(m.nextActingHero(zeroCost,firstHero),firstHero);
  const usedOne=m.playCard(zeroCost,firstHero,freeCards[0].id,firstHero);
  assert.equal(m.nextActingHero(usedOne,firstHero),firstHero);
  const usedBoth=m.playCard(usedOne,firstHero,freeCards[1].id,firstHero);
  assert.equal(usedBoth.party[0].hand.length,0);
  assert.equal(m.nextActingHero(usedBoth,firstHero),usedBoth.party[1].id);
  const lootState={...s,stage:0,licenses:['foot'],party:s.party.slice(0,2)};
  const lootFight=m.createBattle(lootState,{region:0,variant:0,boss:true});
  const summary=m.completeBattle(lootState,lootFight.encounter,m.victory(lootFight));
  assert.equal(summary.rewards.heroes.filter(h=>!h.reserve).length,2);
  assert(summary.rewards.heroes.filter(h=>h.reserve).every(h=>h.xp===Math.floor(65*.35)&&h.mastery===0));
  assert(summary.rewards.loot.some(item=>item.quantity===2&&item.name===m.ITEMS.tonic.name));
  assert(summary.rewards.loot.some(item=>item.name===m.VEHICLES.canoe));
  const map=new Map();
  const mock={getItem:id=>map.get(id)??null,setItem:(id,v)=>map.set(id,v),removeItem:id=>map.delete(id)};
  map.set('learning-rogue:main:player','untouched');
  assert(m.writeSave(1,s,'manual',mock));
  assert(m.writeSave(1,{...s,gold:s.gold+36},'auto',mock));
  assert(m.writeSave(2,m.newAdventure('dungeons2-lyria',573),'auto',mock));
  const written=m.readSave(1,mock);
  assert.equal(written.length,2);
  assert.equal(written.find(i=>i.kind==='manual').state.gold,s.gold);
  assert.equal(m.readSave(2,mock)[0].state.leader,'dungeons2-lyria');
  const dungeon=m.area(m.mapId(0,4));
  const oldGate={x:16,y:8};
  const oldSave={...s,map:dungeon.id,at:oldGate,trail:[oldGate],flags:[...s.flags,dungeon.id+':mechanism'],link:9};
  delete oldSave.dungeonLayout;
  assert(m.writeSave(3,oldSave,'manual',mock));
  const migrated=m.readSave(3,mock)[0].state;
  assert.equal(migrated.map,dungeon.id);
  assert(m.canTravel(m.activeTile(migrated,migrated.at),'foot',false));
  assert(m.same(at(migrated,point(migrated,'exit')).at,point(migrated,'exit')));
  assert.equal(m.createBattle(migrated,{region:0,variant:0}).link,9);
  mock.setItem('learning-rogue:pixel-rpg:v1:1:auto','broken');
  assert.equal(m.readSave(1,mock)[0].kind,'manual');
  assert(m.clearSlot(1,mock));
  assert.equal(m.readSave(2,mock).length,1);
  assert.equal(mock.getItem('learning-rogue:main:player'),'untouched');
  assert(m.writeSave(3,householdSave,'manual',mock));
  const restoredHouse=m.readSave(3,mock)[0].state;
  assert(m.houseRewardClaimed(restoredHouse,householdSave.map));
  assert.strictEqual(m.grantHouseReward(restoredHouse,restoredHouse.map).state,restoredHouse);
  const tracks=[...Object.values(m.PIXEL_RPG_MUSIC),...Object.values(m.PIXEL_RPG_MUSIC_FALLBACKS)];
  assert.equal(Object.keys(m.PIXEL_RPG_MUSIC).length,26);
  for(const file of new Set(tracks)){
    assert((await stat(`public/${file}`)).size>10000,file);
    assert((await stat(`public/web-audio/${file.replace(/\.mp3$/,'.ogg')}`)).size>10000,file);
  }
  console.log('PASS defeat/recovery, target validation, optional question bonus, independent autosave/manual, alternate-copy recovery and music for all 26 scenes');
}finally{await rm(folder,{recursive:true,force:true});}
