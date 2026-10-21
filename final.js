// Final prototype: progression, chance encounters and collection are independent.
const EXPERIENCE={openChances:[.70,.85,1],npc:.45,anomaly:.4,hiddenStroke:.3,card:.3,npcClicks:3};
const testVersion='B',clamp01=x=>THREE.MathUtils.clamp(x,0,1);
function seeded(seed){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
let street=null,visualItems=[],playerX=0,layer=0,closedRun=0,oracle=null,events=[],ink=[],inHidden=false,hiddenRoot=null,hiddenReturn=null,foundReturn='market',entranceTick=0,foundTimer;
state.foundTraces=[];state.behaviorTraces=[];state.arrangements={};
DATA.stalls.find(c=>c.id===1).base='assets/stall-one-wave.png';
DATA.stalls.find(c=>c.id===2).base='assets/stall-two-noise.png';
DATA.stalls.find(c=>c.id===3).base='assets/stall-three-poster.png';
let ambientPassers=[];
const divination=$('#divination');
let oracleFrame=null;
const foundButton=$('#found-open'),foundPanel=$('#found-panel'),foundPapers=$('#found-papers');
const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const retainedHideGuide=hideGuide;
hideGuide=function(){
  // Entry instructions remain anchored and visible while searching/dragging.
  if(phase==='entry')return;
  retainedHideGuide();
};
// Gentle pointer parallax for the entry paper only; foreground dragging is unchanged.
entry.addEventListener('pointermove',e=>{
  if(phase!=='entry'||reduced||e.pointerType==='touch')return;
  const x=THREE.MathUtils.clamp(e.clientX/innerWidth*2-1,-1,1)*12;
  const y=THREE.MathUtils.clamp(e.clientY/innerHeight*2-1,-1,1)*9;
  entry.style.setProperty('--paper-x',x+'px');
  entry.style.setProperty('--paper-y',y+'px');
});
function centerEntryPaper(){entry.style.setProperty('--paper-x','0px');entry.style.setProperty('--paper-y','0px');}
entry.addEventListener('pointerleave',centerEntryPaper);
window.addEventListener('blur',centerEntryPaper);
function resolveOracle(random=Math.random){
  const isOpen=state.attemptCount<2||random()<EXPERIENCE.openChances[Math.min(closedRun,2)];
  const heads=isOpen?(random()<.5?2:3):(random()<.5?0:1);
  const faces=Array.from({length:3},(_,i)=>i<heads);
  for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[faces[i],faces[j]]=[faces[j],faces[i]];}
  return {isOpen,heads,faces,direction:['EAST','WEST','SOUTH','NORTH'][Math.floor(random()*4)]};
}
beginCrossing=function(){
  if(phase!=='ticket')return;phase='divination';hideGuide();divination.hidden=false;
  oracle=resolveOracle();controls.keys.clear();
  oracleFrame=document.createElement('iframe');
  oracleFrame.title='Ghost Market — Three Coin Oracle';
  oracleFrame.src='oracle/index.html#market='+oracle.faces.map(Number).join('');
  divination.replaceChildren(oracleFrame);
};
function receiveOracleResult(event){
  // file:// frames have opaque origins; authenticate the exact frame and result.
  if(phase!=='divination'||!oracleFrame||event.source!==oracleFrame.contentWindow)return;
  if(event.data?.type!=='ghost-market:oracle-complete'||event.data.faces!==oracle.faces.map(Number).join(''))return;
  phase='casting';divination.hidden=true;divination.replaceChildren();oracleFrame=null;
  document.body.classList.add('is-crossing');enterMarket();phase='crossing';window.focus();
  setTimeout(()=>{if(phase!=='crossing')return;document.body.classList.remove('is-crossing');phase=open?'market':'closed';lastFrame=performance.now();movementGuide();updateInventory();},reduced?250:1400);
}
window.addEventListener('message',receiveOracleResult);
function movementGuide(){guide('W / S TO MOVE<span class="instruction-sub">MOUSE TO LOOK · HOLD LEFT ALT TO INTERACT<br>WALK BEYOND THE MARKET TO RETURN</span>');}
resetWorld=function(){
  if(shamianScene?.fallbackTexture)shamianScene.fallbackTexture.dispose();
  if(world){const geos=new Set(),mats=new Set();world.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());scene.remove(world);}
  world=new THREE.Group();scene.add(world);ghosts=[];interactables=[];visualItems=[];events=[];ink=[];street=null;shamianScene=null;hiddenRoot=null;inHidden=false;
  $('#hidden-return').hidden=true;
  ambientPassers=[];
};
enterMarket=function(){
  if(!oracle)oracle=resolveOracle();open=oracle.isOpen;state.currentMarketOpen=open;state.attemptCount++;
  if(open){state.successfulVisitCount++;closedRun=0;}else closedRun++;
  layer=Math.min(7,state.successfulVisitCount);
  state.currentStrokeQuota=open?(Math.random()<.5?2:3):2;state.currentStrokesCollected=0;
  eligibleProducts=new Set(shuffle(DATA.stalls).slice(0,state.currentStrokeQuota).map(c=>pick(c.products)));
  ghostHosts=new Set(shuffle(DATA.stalls).slice(0,state.currentStrokeQuota).map(c=>c.id));
  currentZ=targetZ=3;playerX=0;velocity=0;activeGhost=null;selectedStroke=null;controls.keys.clear();controls.alt=controls.busy=controls.modal=false;controls.yaw=0;lastPointer=null;
  state.arrangements={};resetWorld();
  // Refreshing language uses cached maps; prepare every eligible text first.
  [...DATA.texts,...DATA.strokes].forEach(src=>{if(!textures.has(src))mat(src).dispose();});
  if(open){DATA.stalls.forEach(addStall);fitShamianStalls();initVendorTypography();ghosts.forEach(g=>{g.pulse=0;g.dwell=0;g.home=g.group.position.clone();});createInk();}
  buildShamianStreet();spawnEncounters();spawnAmbientPassers();
  phase=open?'market':'closed';entry.classList.add('leaving');market.classList.remove('fading');market.classList.add('active');
  camera.position.set(0,1.75,3);camera.rotation.set(controls.pitch,0,0);camera.updateMatrixWorld();inventorySignature='';updateInventory();
  // Baseline street is permanently fragmented in every layer, including closure.
  applyLayerVisuals(0,0);oracle=null;
};
const retainedAddStall=addStall;
addStall=function(c){
  if(c.wall){
    retainedAddStall(c);
    if(c.id===2){
      const base=interactables.find(m=>m.userData.type==='stall'&&m.userData.cfg.id===2);
      const key=c.base+'#zoom-1.8';
      let zoom=textures.get(key);
      if(!zoom){zoom=new THREE.TextureLoader().load(LOCAL_ASSETS[c.base]||c.base);zoom.encoding=THREE.sRGBEncoding;zoom.repeat.set(1/1.8,1/1.8);zoom.offset.set((1-1/1.8)/2,(1-1/1.8)/2);textures.set(key,zoom);}
      base.material.map=zoom;
    }
    return;
  }
  const side=Math.sign(c.x)||1,y=3.2,yaw=-side*Math.PI/2;
  if(c.id===1){
    const backing=new THREE.Mesh(new THREE.PlaneGeometry(4.9,3.45),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
    backing.position.set(c.x+side*.015,y,c.z);backing.rotation.y=yaw;
    backing.userData={type:'stall-backing',cfg:c};world.add(backing);
  }
  const base=plane(c.base,4.9,3.45,[c.x,y,c.z],[0,yaw,0]);
  base.userData={type:'stall',cfg:c};interactables.push(base);
  c.products.forEach(src=>{
    const p=plane(src,rand(.62,1.08),rand(.47,.85),[c.x-side*.055,y+rand(-1.15,1.1),c.z+rand(-1.7,1.7)],[0,yaw,0]);
    p.rotateZ(rand(-.35,.35));
    p.userData={type:'product',cfg:c,src};interactables.push(p);
  });
  // Presentation only: preserve vendor placement, product ownership and interaction ranges.
  addGhost(c);
};
function createInk(){
  for(const g of ghosts){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.25,1),mat(pick(DATA.texts)));m.position.copy(g.home).add(new THREE.Vector3(-.5,.5,.3));m.userData={type:'ink',g};world.add(m);ink.push(m);}
}
function recollectTrace(src){if(!state.behaviorTraces.includes(src))state.behaviorTraces.push(src);}
const retainedRecordProduct=recordProduct;
recordProduct=function(src){retainedRecordProduct(src);if(layer>=2&&eligibleProducts.has(src)){eligibleProducts.delete(src);awardStroke();}if(layer>=7)recollectTrace(src);};
// Preserve the existing missing-type weighting and historical discovery semantics.
awardStroke=function(){
  if(state.currentStrokesCollected>=state.currentStrokeQuota)return false;
  const src=chooseEncounterStroke();state.currentStrokesCollected++;state.collectedStrokes.push(src);state.availableStrokes.push(src);
  if(!state.discoveredStrokeTypes.includes(src)){state.discoveredStrokeTypes.push(src);state.duplicateStrokeRun=0;}else state.duplicateStrokeRun++;
  state.endingReady=strokeTypes.length>0&&state.discoveredStrokeTypes.length===strokeTypes.length;
  AudioManager.play('strokeAcquire');showAcquired(src,'STROKE');
  if(shamianScene){shamianScene.pulse=1;const g=activeGhost||ghosts.find(g=>distance(g.group)<12);if(g){g.pulse=1;const s=shamianScene;s.rewardOrigin.copy(g.group.position).add(new THREE.Vector3(0,2,0));s.rewardAge=0;s.reward.material.map=textures.get(src)||mat(src).map;s.reward.material.needsUpdate=true;}}
  return true;
};
interactGhost=function(g){
  if(!open||layer<3||distance(g.group)>=10)return;
  activeGhost=g;g.pulse=1;AudioManager.play('ghostReveal');
  if(ghostHosts.has(g.cfg.id)&&awardStroke())ghostHosts.delete(g.cfg.id);
  if(layer>=7){g.typography.items.forEach((item,i)=>{if(g.cfg.id!==3)item.m.position.x+=(i%2?.35:-.35);});recollectTrace(g.typography.items[0].src);}
  inventorySignature='';updateInventory();if(layer>=5&&!controls.busy)msg('SELECT A STROKE TO TRADE');
};
const legacyOpenInspection=openInspection;
openInspection=function(c){
  if(!open)return;legacyOpenInspection(c);controls.alt=false;
  surface.style.backgroundColor=c.id===1?'#ffffff':'#dbdbcf';
  surface.style.backgroundSize=c.id===2?'180% 180%':'cover';
  surface.style.backgroundPosition='center';
  const elements=[...inspectProducts.children];
  elements.forEach((el,i)=>{
    const key=c.products[i];if(layer>=7&&state.arrangements[key])el.style.transform=state.arrangements[key];
    el.addEventListener('pointerup',()=>{if(layer>=7){state.arrangements[key]=el.style.transform;recollectTrace(key);const item=interactables.find(m=>m.userData.src===key);if(item){item.position.x+=.12;item.position.z-=.08;}}});
  });
};
closeInspection=function(){if(phase!=='inspect'||controls.busy)return;inspection.classList.remove('active');inspection.setAttribute('aria-hidden','true');phase=open?'market':'closed';lastPointer=null;updateInventory();movementGuide();};
closeStall.addEventListener('click',e=>{e.stopImmediatePropagation();closeInspection();},true);
updateInventory=function(){
  const visible=layer>=5&&['market','closed'].includes(phase)&&!inHidden;
  inventory.classList.toggle('visible',visible);document.body.classList.toggle('has-inventory',visible);inventory.style.pointerEvents=visible&&freeCursor()?'auto':'none';
  foundButton.hidden=!(visible&&state.foundTraces.length);
  if(!visible)return;
  $('#inventory-guide').textContent=!open?'TRACES YOU KEEP':activeGhost?'SELECT A STROKE TO TRADE':'SELECT A VENDOR FIRST';
  const signature=JSON.stringify([state.availableStrokes,state.acquiredProducts,activeGhost?.cfg.id,state.foundTraces.length]);if(signature===inventorySignature)return;inventorySignature=signature;inventoryItems.replaceChildren();
  for(const [type,list] of [['stroke',state.availableStrokes],['product',state.acquiredProducts]])list.forEach((src,i)=>{
    const b=document.createElement('button');b.className='inventory-object '+type;b.setAttribute('aria-label',type==='stroke'?'Offer stroke':'View object');b.innerHTML=`<img src="${src}" alt="">`;
    b.addEventListener('click',()=>{if(!freeCursor()||controls.busy)return;if(type==='product'){AudioManager.play('paperOpen');showAcquired(src,'OBJECT',true);return;}if(!open||!activeGhost){msg('SELECT A VENDOR FIRST');return;}if(distance(activeGhost.group)>=10){msg('MOVE CLOSER TO THE VENDOR');return;}selectedStroke=i;controls.modal=true;controls.keys.clear();velocity=0;offerConfirm.classList.add('show');$('#offer-confirm [data-answer="yes"]').focus();});inventoryItems.append(b);
  });
};
const retainedConfirm=confirmOffer;
confirmOffer=function(){if(layer<5||!open||!activeGhost)return;activeGhost.pulse=1;retainedConfirm();};
function sceneHit(e){const r=canvas.getBoundingClientRect();scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);raycaster.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2},camera);}
onSceneClick=function(e){
  if(!['market','closed'].includes(phase)||!freeCursor()||controls.modal||controls.busy)return;sceneHit(e);
  if(inHidden){const hit=raycaster.intersectObjects(hiddenRoot.children.filter(x=>x.userData.action))[0];if(hit&&hit.distance<12)hiddenAction(hit.object);return;}
  const eventHit=raycaster.intersectObjects(events.filter(x=>!x.done).map(x=>x.mesh))[0];
  if(eventHit&&eventHit.distance<10){triggerEncounter(events.find(x=>x.mesh===eventHit.object));return;}
  if(!open)return;
  if(layer>=3){const hit=raycaster.intersectObjects(ghosts.filter(g=>distance(g.group)<10).map(g=>g.hit))[0];if(hit){interactGhost(ghosts.find(g=>g.hit===hit.object));return;}}
  if(layer>=2){const hit=raycaster.intersectObjects(ink.filter(m=>m.visible))[0];if(hit&&hit.distance<10){if(awardStroke()){hit.object.visible=false;hit.object.userData.used=true;}return;}}
  if(layer>=4){const words=ghosts.flatMap(g=>g.typography.items.map(i=>i.m));const hit=raycaster.intersectObjects(words)[0];if(hit&&hit.distance<10){const g=ghosts.find(g=>g.typography.items.some(i=>i.m===hit.object));g.pulse=1;if(ghostHosts.has(g.cfg.id)&&awardStroke())ghostHosts.delete(g.cfg.id);else AudioManager.play('textTouch');if(layer>=7){hit.object.position.x+=.6;hit.object.position.y+=.25;const item=g.typography.items.find(i=>i.m===hit.object);item.composed=hit.object.position.clone();recollectTrace(item.src);}return;}}
  const hit=raycaster.intersectObjects(interactables.filter(m=>m.userData.type!=='ghost'))[0];if(hit&&hit.distance<13)openInspection(hit.object.userData.cfg);
};
canvas.addEventListener('pointerdown',e=>{e.stopImmediatePropagation();onSceneClick(e);},true);
addEventListener('pointermove',e=>{if(e.target!==canvas)return;e.stopImmediatePropagation();if(!moving()||freeCursor()){lastPointer=null;return;}if(lastPointer){controls.yaw-=(e.clientX-lastPointer.x)*.003;controls.pitch=THREE.MathUtils.clamp(controls.pitch-(e.clientY-lastPointer.y)*.003,-Math.PI/4,Math.PI/4);}lastPointer={x:e.clientX,y:e.clientY};},{capture:true});
function applyLayerVisuals(dt,t){
  if(open&&layer>=4)updateVendorTypography(dt);
  ghosts.forEach(g=>{
    const d=distance(g.group),near=clamp01((13-d)/8);g.pulse=Math.max(0,g.pulse-dt*.7);g.dwell=d<9?Math.min(8,g.dwell+dt):Math.max(0,g.dwell-dt);
    g.group.visible=open&&layer>=3;g.group.rotation.y=Math.atan2(playerX-g.group.position.x,currentZ-g.group.position.z);
    g.clear.material.opacity=near;g.blur.material.opacity=(1-near)*.55;
    g.typography.root.visible=open&&layer>=2;
    if(layer<4)g.typography.items.forEach((item,i)=>{item.m.visible=i<3;item.m.material.opacity=(.08+near*.5);});
    else g.typography.items.forEach(item=>{item.m.visible=true;item.m.material.opacity=Math.min(1,item.m.material.opacity*(1+g.pulse*.3+g.dwell*.025));if(layer>=7&&item.composed)item.m.position.copy(item.composed);});
    // Third vendor briefly rests when a nearby visitor meets it.
    if(layer>=4&&g.cfg.id===3&&d<5&&!g.met){g.typography.pause=2.2;g.met=true;}if(d>9)g.met=false;
  });
  ink.forEach(m=>{m.visible=layer>=2&&!m.userData.used;m.material.opacity=.12+.65*clamp01((15-distance(m))/10);});
  if(open&&layer>=6&&shamianScene){
    const uniforms=shamianScene.uniforms;
    ghosts.forEach((g,i)=>{uniforms.uInkCenters.value[i].copy(g.group.position);const target=clamp01((14-distance(g.group))/9)*(.5+g.dwell/16);uniforms.uInkAmount.value[i]+=(target-uniforms.uInkAmount.value[i])*(1-Math.exp(-dt*(target>uniforms.uInkAmount.value[i]?1.2:.3)));});
    if(layer>=7){const g=ghosts.find(g=>distance(g.group)<7);if(g&&Math.abs(velocity)>.1){g.walkMemory=(g.walkMemory||0)+dt;if(g.walkMemory>3){g.walkMemory=0;const item=pick(g.typography.items);item.composed=(item.composed||item.m.position.clone()).add(new THREE.Vector3(.13,.08,0));recollectTrace(item.src);}}}
  }
}
// Fixed footprints define the market even when closed; wandering ghosts do not move its boundary.
const marketLeaveDistance=20;
function outsideMarketArea(x,z){
  return DATA.stalls.every(stall=>Math.hypot(x-stall.x,z-(stall.z+(stall.id===3?3.5:0)))>marketLeaveDistance);
}
update=function(t){
  const dt=Math.min(.05,(t-lastFrame)/1000||.016);lastFrame=t;
  const desired=moving()?((controls.keys.has('KeyS')?1:0)-(controls.keys.has('KeyW')?1:0))*3:0;velocity+=(desired-velocity)*(1-Math.exp(-dt*9));if(!moving())velocity=0;
  const x=playerX+velocity*Math.sin(controls.yaw)*dt,z=currentZ+velocity*Math.cos(controls.yaw)*dt;
  // Splat scenery is visual only, with no source-building collision.
  playerX=x;currentZ=z;
  camera.position.set(playerX,1.75,currentZ);camera.rotation.order='YXZ';camera.rotation.set(controls.pitch,controls.yaw,0);camera.updateMatrixWorld();
  // A slower walking cadence (~0.6 seconds at full speed), not a running beat.
  if(Math.abs(velocity)<.05)stepDistance=0;
  stepDistance+=Math.abs(velocity*dt);if(stepDistance>1.8){AudioManager.play('footstep');stepDistance=0;}
  canvas.style.cursor=freeCursor()?'default':'none';
  if(!inHidden){applyLayerVisuals(dt,t);updateShamianStreet(dt,t);updateEncounters(dt);}
  if(activeGhost&&distance(activeGhost.group)>11&&!controls.modal){activeGhost=null;inventorySignature='';}
  updateInventory();
  closedMessage.classList.toggle('show',!open&&!inHidden&&currentZ<-28);if(!open){closedMessage.style.left='50%';closedMessage.style.top='24%';}
  if(inHidden){if(Math.abs(playerX)>12||currentZ>8||currentZ<-22)exitHidden();}
  else if(!controls.busy&&!controls.modal&&outsideMarketArea(playerX,currentZ))leaveMarket();
};
leaveMarket=function(){
  if(!['market','closed'].includes(phase)||controls.busy||controls.modal)return;
  if(inHidden){exitHidden();return;}
  phase='returning';controls.keys.clear();velocity=0;inventory.classList.remove('visible');foundButton.hidden=true;closedMessage.classList.remove('show');market.classList.add('fading');hideGuide();
  setTimeout(()=>{if(phase!=='returning')return;if(state.endingReady)beginComposition();else renderEntry();},1100);
};
const retainedEntry=renderEntry;
renderEntry=function(){
  retainedEntry();foundButton.hidden=true;divination.hidden=true;$('#hidden-return').hidden=true;foundPanel.hidden=true;state.behaviorTraces.slice(-12).forEach((src,i)=>makeTrace(src,60+i,'stroke'));
  // Use actual posters/textures to conceal the ticket, not fabricated labels.
  const cover=Object.keys(LOCAL_ASSETS).filter(s=>s.startsWith('assets/v2/poster/')||s.startsWith('assets/v2/texture/'));
  if(!state.attemptCount)cover.slice(0,9).forEach((src,i)=>makeTrace(src,i));
  if(traces.children.length){const first=traces.children[0];first.style.transform=`translate(${innerWidth/2-120}px,${innerHeight/2-90}px) rotate(-8deg)`;}
  guide('CLICK THE TICKET IN THE CENTER.<span class="instruction-sub">MOVE THE OBJECTS TO UNCOVER IT.</span>');
};
// Independent optional events. Values are prototype knobs, not progression rules.
function spawnEncounters(){
  const direction=oracle?.direction||'EAST',side=direction==='WEST'||direction==='NORTH'?-1:1;
  const add=(kind,src,x,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(kind==='npc'?1.35:.9,kind==='npc'?2.6:1.15),mat(src));m.position.set(x,kind==='npc'?1.3:.75,z);m.userData.type='event';world.add(m);events.push({kind,src,mesh:m,done:false,clicks:0,following:false,arrived:false});};
  if(Math.random()<EXPERIENCE.npc)add('npc',pick(DATA.ghosts).blur,side*2.5,-15);
  if(Math.random()<EXPERIENCE.anomaly)add('anomaly',pick(DATA.stalls.flatMap(c=>c.products)),side*3,-25);
  if(Math.random()<EXPERIENCE.hiddenStroke)add('stroke',pick(DATA.texts),-side*2,-34);
  if(Math.random()<EXPERIENCE.card)add('card',pick(DATA.texts),side*3.5,-39);
}
function triggerEncounter(ev){
  if(ev.done)return;
  if(ev.kind==='npc'){ev.clicks++;if(ev.clicks===2){ev.mesh.rotation.y+=.65;AudioManager.play('ghostReveal');}if(ev.clicks>=EXPERIENCE.npcClicks){ev.following=true;ev.goal=new THREE.Vector3(12,1.3,-28);}return;}
  collectCard(ev.src,'A fragment found between one visit and the next.');
  ev.done=true;ev.mesh.visible=false;
}
// Visual extras only: never register with events, ghosts, or interactables.
function spawnAmbientPassers(){
  const count=open?6:2;
  for(let i=0;i<count;i++){
    const height=rand(2.3,3.1),x=(i%2?1:-1)*rand(1.8,7.5),z=-5-i*(34/count)+rand(-1.5,1.5);
    const mesh=plane(DATA.ghosts[i%DATA.ghosts.length].blur,height*.62,height,[x,height/2,z]);
    mesh.material.opacity=.6;mesh.material.depthWrite=false;
    mesh.userData={type:'ambient-passer'};mesh.raycast=()=>{};
    ambientPassers.push({mesh,x,z,time:rand(0,Math.PI*2),speed:rand(.12,.22),opacity:mesh.material.opacity});
  }
}
function updateAmbientPassers(dt){
  for(const p of ambientPassers){
    if(!reduced)p.time+=dt*p.speed;
    p.mesh.position.x=p.x+Math.sin(p.time)*1.2;
    p.mesh.position.z=p.z+Math.cos(p.time*.73)*1.8;
    p.mesh.rotation.y=Math.atan2(playerX-p.mesh.position.x,currentZ-p.mesh.position.z);
    const d=Math.hypot(playerX-p.mesh.position.x,currentZ-p.mesh.position.z);
    // Passing directly through a silhouette softly dissolves it, never blocks movement.
    p.mesh.material.opacity=p.opacity*clamp01(d/1.5);
  }
}
function updateEncounters(dt){
  updateAmbientPassers(dt);
  for(const ev of events){if(ev.done)continue;if(ev.kind==='npc'&&ev.following){const delta=ev.goal.clone().sub(ev.mesh.position),d=delta.length();if(d>.1)ev.mesh.position.addScaledVector(delta.normalize(),Math.min(d,dt*1.1));else ev.arrived=true;if(ev.arrived&&distance(ev.mesh)<3&&!controls.busy){enterHidden();return;}}
    if(!(ev.kind==='npc'&&ev.clicks===2))ev.mesh.rotation.y=Math.atan2(playerX-ev.mesh.position.x,currentZ-ev.mesh.position.z);
  }
}
function collectCard(src,note){
  recordAchievement(src,inHidden?'HIDDEN MARKET':'FOUND');
  if(state.foundTraces.some(c=>c.src===src))return;
  if(DATA.stalls.some(c=>c.products.includes(src)))state.acquiredProducts.push(src);
  state.foundTraces.push({src,note});const toast=$('#found-toast');toast.querySelector('img').src=src;toast.classList.add('show');clearTimeout(foundTimer);foundTimer=setTimeout(()=>toast.classList.remove('show'),1900);AudioManager.play('foundAcquire');updateInventory();
}
foundButton.addEventListener('click',()=>{
  if(controls.busy||controls.modal||!state.foundTraces.length)return;foundReturn=phase;phase='found';controls.keys.clear();velocity=0;foundPanel.hidden=false;foundPapers.replaceChildren();foundButton.hidden=true;AudioManager.play('paperOpen');
  state.foundTraces.forEach((card,i)=>{const el=document.createElement('button');el.className='found-paper';const img=document.createElement('img');img.src=card.src;const note=document.createElement('span');note.textContent=card.note;el.append(img);el.append(note);foundPapers.append(el);let x=50+(i*137)%Math.max(180,innerWidth-260),y=20+(i*63)%Math.max(80,innerHeight-400),drag=null;const angle=(i%5-2)*6,draw=()=>el.style.transform=`translate(${x}px,${y}px) rotate(${angle}deg)`;draw();
    el.addEventListener('dblclick',()=>{el.classList.toggle('flipped');AudioManager.play('paperFlip');});el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);drag={x:e.clientX-x,y:e.clientY-y};AudioManager.play('objectRustle');});el.addEventListener('pointermove',e=>{if(!drag)return;x=THREE.MathUtils.clamp(e.clientX-drag.x,0,innerWidth-180);y=THREE.MathUtils.clamp(e.clientY-drag.y,0,Math.max(0,innerHeight-380));draw();});el.addEventListener('pointerup',()=>drag=null);el.addEventListener('pointercancel',()=>drag=null);
  });
});
function closeFound(){if(phase!=='found')return;AudioManager.play('paperClose');foundPanel.hidden=true;phase=foundReturn;lastPointer=null;updateInventory();}
$('#found-close').addEventListener('click',closeFound);
addEventListener('keydown',e=>{if(e.code==='Escape'&&phase==='found'){e.stopImmediatePropagation();closeFound();}},true);
function enterHidden(){
  inHidden=true;hiddenReturn={x:playerX,z:currentZ,yaw:controls.yaw};controls.keys.clear();velocity=0;activeGhost=null;
  world.children.forEach(o=>o.visible=false);hiddenRoot=new THREE.Group();world.add(hiddenRoot);
  for(let i=0;i<15;i++){const src=i%3?pick(DATA.texts):pick(DATA.stalls[i%3].products);const m=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.5),mat(src));m.position.set(Math.sin(i*2.4)*4,.5+(i%4)*.65,-3-i*.8);m.rotation.z=(i%3-1)*.15;hiddenRoot.add(m);}
  const card=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.4),mat(pick(DATA.texts)));card.position.set(-2,1.4,-6);card.userData={action:'card',src:pick(DATA.texts)};card.material.map=textures.get(card.userData.src)||mat(card.userData.src).map;hiddenRoot.add(card);
  const trader=new THREE.Mesh(new THREE.PlaneGeometry(1.5,2.5),mat(DATA.ghosts[2].clear));trader.position.set(2,1.25,-7);trader.userData={action:'trade'};hiddenRoot.add(trader);
  playerX=0;currentZ=3;controls.yaw=0;controls.pitch=0;$('#hidden-return').hidden=false;closedMessage.classList.remove('show');guide('HOLD LEFT ALT TO TOUCH WHAT REMAINS.');
}
function hiddenAction(mesh){
  if(mesh.userData.action==='card'){collectCard(mesh.userData.src,'A room behind the street. Nothing asked you to come here.');mesh.userData.action=null;mesh.visible=false;}
  else if(mesh.userData.action==='trade'){
    // Optional trade of an object (never a required stroke type or card).
    if(!state.acquiredProducts.length){msg('NOTHING TO EXCHANGE.');return;}
    controls.modal=true;offerConfirm.classList.add('show');$('#offer-confirm p').textContent='EXCHANGE AN OBJECT FOR A FOUND TRACE?';hiddenTrade=true;
  }
}
let hiddenTrade=false;
offerConfirm.addEventListener('click',e=>{if(!hiddenTrade||!e.target.dataset.answer)return;e.stopImmediatePropagation();if(e.target.dataset.answer==='yes'){const unseen=DATA.texts.filter(src=>!state.foundTraces.some(c=>c.src===src));if(unseen.length&&state.acquiredProducts.length){state.acquiredProducts.pop();collectCard(pick(unseen),'An object exchanged for a memory.');}else msg('NOTHING NEW TO EXCHANGE.');}hiddenTrade=false;controls.modal=false;offerConfirm.classList.remove('show');$('#offer-confirm p').textContent='TRADE THIS ITEM?';inventorySignature='';},true);
addEventListener('keydown',e=>{if(e.code==='Escape'&&hiddenTrade){e.stopImmediatePropagation();hiddenTrade=false;controls.modal=false;offerConfirm.classList.remove('show');$('#offer-confirm p').textContent='TRADE THIS ITEM?';}},true);
function exitHidden(){
  if(!inHidden)return;hiddenRoot.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});world.remove(hiddenRoot);hiddenRoot=null;world.children.forEach(o=>o.visible=true);
  shamianScene.colliders.forEach(m=>m.visible=false);shamianScene.root.children.filter(m=>m.isMesh&&m!==shamianScene.reward).forEach(m=>m.visible=false);inHidden=false;
  events.forEach(ev=>{ev.mesh.visible=!ev.done;if(ev.kind==='npc'&&ev.following){ev.done=true;ev.mesh.visible=false;}});
  playerX=hiddenReturn.x;currentZ=hiddenReturn.z+2;controls.yaw=hiddenReturn.yaw;controls.keys.clear();velocity=0;lastPointer=null;$('#hidden-return').hidden=true;movementGuide();
}
$('#hidden-return').addEventListener('click',()=>{if(!controls.modal&&!controls.busy)exitHidden();});
const retainedAnimate=animate;
animate=function(t){
  if(phase==='entry'&&t-entranceTick>2200){entranceTick=t;const choices=[...traces.children];if(choices.length){const item=pick(choices);if(!item.matches?.(':active'))item.classList.toggle('vanish');}}
  retainedAnimate(t);
};
renderEntry();
