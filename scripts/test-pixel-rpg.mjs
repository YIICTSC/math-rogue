import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
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
      export * from './src/mini-games/pixel-rpg/campaign';
      export * from './src/mini-games/pixel-rpg/catalog';
      export * from './src/mini-games/pixel-rpg/save';
      export * from './src/mini-games/pixel-rpg/world';
      export * from './src/mini-games/pixel-rpg/music';
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
  for(const hero of m.HERO_LIST){
    const original=m.newAdventure(hero.id,31);
    assert(m.validAdventure(original));
    assert.equal(original.heroes[hero.id].deck.length,10);
    assert(original.heroes[hero.id].deck.some(c=>c.key===hero.signature.id));
    assert(m.createBattle(original,{region:0,variant:0}).party[0].hand.length>=3);
  }
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
      const p={x:rock.x-1,y:rock.y};
      s=at(s,p);
      for(let i=0;i<3;i++)s=m.step(s,'right').state;
      assert(s.flags.includes(s.map+':mechanism'),`Push rock onto plate in ${s.map}`);
      featured.add('rock');
    }else if(feature){
      s=use(s,'feature').state;
      assert(s.flags.includes(s.map+':mechanism'));
      featured.add(feature.feature);
    }
    return s;
  };
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
  mock.setItem('learning-rogue:pixel-rpg:v1:1:auto','broken');
  assert.equal(m.readSave(1,mock)[0].kind,'manual');
  assert(m.clearSlot(1,mock));
  assert.equal(m.readSave(2,mock).length,1);
  assert.equal(mock.getItem('learning-rogue:main:player'),'untouched');
  const tracks=await readdir('public/bgm-new/pixel-rpg');
  assert.deepEqual(new Set(tracks),new Set(m.PIXEL_RPG_TRACKS.map(name=>name+'.mp3')));
  assert((await Promise.all(tracks.map(file=>stat(`public/bgm-new/pixel-rpg/${file}`)))).every(s=>s.size>10000));
  console.log('PASS defeat/recovery, target validation, optional question bonus, independent autosave/manual, alternate-copy recovery and 25 music assets');
}finally{await rm(folder,{recursive:true,force:true});}
