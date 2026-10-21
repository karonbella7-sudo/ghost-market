// State/interaction integration tests with real Three math, not a GPU screenshot.
const fs0=require('fs');
const harness=fs0.readFileSync('verify.cjs','utf8').split("vm.runInContext(fs.readFileSync('ending.js'")[0];
eval(harness+`
document.querySelectorAll=()=>[new Element(),new Element(),new Element()];
document.createElementNS=()=>new Element();
vm.runInContext('globalThis.window=globalThis;',ctx);
vm.runInContext('DATA.texts=["assets/v2/text/01.png","assets/v2/text/02.png"];',ctx);
for(const file of ['ending.js','vendor-motion.js','shamian/shamian-data.js','shamian-scene.js','final.js','collection.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),flush=()=>{let f;while(f=timers.shift())f();};
run('AudioManager.start=()=>{}');
assert.equal(run('phase'),'entry');assert.equal(run('state.successfulVisitCount'),0);
run('hideGuide()');assert(run('instruction.classList.contains("show")'));
run('phase="ticket";hideGuide()');assert(!run('instruction.classList.contains("show")'));
run('renderEntry()');assert(run('instruction.classList.contains("show")'));
// Probability and displayed coin faces come from the same single outcome.
for(const attempt of [0,1]){
 run('state.attemptCount='+attempt+';closedRun=0');
 const r=run('resolveOracle(()=>.999)');assert(r.isOpen);assert(r.heads>=2);assert.equal(r.faces.filter(Boolean).length,r.heads);
}
run('state.attemptCount=2;closedRun=0');
assert.equal(run('resolveOracle(()=>.999).isOpen'),false);
assert.equal(run('resolveOracle(()=>0).isOpen'),true);
for(const n of [0,1,2]){
 run('closedRun='+n);
 for(let i=0;i<100;i++){
  const r=run('resolveOracle(seeded('+i+'))');assert.equal(r.faces.filter(Boolean).length,r.heads);assert.equal(r.isOpen,r.heads>=2);if(n===2)assert(r.isOpen);
 }
}
run('state.attemptCount=0;closedRun=0;phase="ticket";beginCrossing();');assert.equal(run('phase'),'divination');
run('oracleFrame.contentWindow={};receiveOracleResult({source:{},data:{type:"ghost-market:oracle-complete",faces:oracle.faces.map(Number).join("")}})');assert.equal(run('phase'),'divination');
run('window.focus=()=>{};receiveOracleResult({source:oracleFrame.contentWindow,data:{type:"ghost-market:oracle-complete",faces:oracle.faces.map(Number).join("")}})');flush();assert(['market','closed'].includes(run('phase')));
// Reset only counters for deterministic layer testing. No browser persistence.
run('state.successfulVisitCount=0;closedRun=0;state.discoveredStrokeTypes=[];state.availableStrokes=[];state.collectedStrokes=[];');
for(let level=1;level<=8;level++){
 run('oracle={isOpen:true,direction:"EAST"};enterMarket();');
 assert.equal(run('state.successfulVisitCount'),level);assert.equal(run('layer'),Math.min(level,7));
 assert.equal(run('ghosts.length'),3);assert.equal(run('interactables.filter(m=>m.userData.type==="product").length'),27);
 assert.equal(run('ambientPassers.length'),6);
 assert(run('ambientPassers.every(p=>p.mesh.material.opacity===.6&&!interactables.includes(p.mesh)&&!events.some(e=>e.mesh===p.mesh))'));
 assert(run('interactables.filter(m=>m.userData.type==="stall").every(m=>m.position.y===3.2&&m.rotation.x===0)'));
 assert(run('interactables.filter(m=>m.userData.type==="product").every(m=>m.position.y>2)'));
 assert(run('interactables.filter(m=>m.userData.type==="product").every(m=>m.userData.cfg.products.includes(m.userData.src))'));
 assert.equal(run('ghosts[0].group.visible'),level>=3);
 assert.equal(run('ghosts[0].typography.root.visible'),level>=2);
 assert.equal(run('inventory.classList.contains("visible")'),level>=5);
 run('recordProduct([...eligibleProducts][0])');assert.equal(run('state.currentStrokesCollected'),level>=2?1:0);flush();
 if(level>=3){run('camera.position.copy(ghosts[0].group.position).add(new THREE.Vector3(0,2,4));controls.alt=true;scene.updateMatrixWorld(true);camera.lookAt(ghosts[0].group.position.clone().add(new THREE.Vector3(0,2,0)));camera.updateMatrixWorld();onSceneClick({clientX:600,clientY:400});');assert.equal(run('activeGhost.cfg.id'),1);flush();}
 if(level>=6){run('camera.position.copy(ghosts[0].group.position).add(new THREE.Vector3(0,1.75,2));for(let i=0;i<60;i++)applyLayerVisuals(.05,i*50);');assert(run('shamianScene.uniforms.uInkAmount.value[0]')>.2);}
 if(level===5){
  run('activeGhost=ghosts[0];camera.position.copy(activeGhost.group.position).add(new THREE.Vector3(0,2,3));controls.alt=true;inventorySignature="";updateInventory()');
  const history=run('state.discoveredStrokeTypes.length'),owned=run('state.availableStrokes.length');
  run('inventoryItems.children[0].click();offerConfirm.click({target:{dataset:{answer:"no"}}})');assert.equal(run('state.availableStrokes.length'),owned);
  run('inventoryItems.children[0].click();confirmOffer()');flush();assert.equal(run('state.availableStrokes.length'),owned-1);assert.equal(run('state.discoveredStrokeTypes.length'),history);assert(run('state.acquiredProducts.at(-1).includes("stall-01")'));
 }
 run('state.endingReady=false;leaveMarket()');flush();assert.equal(run('state.successfulVisitCount'),level,'Exit must not increment');
 // Closed visits preserve level, ownership, and are still explorable.
 const history=run('state.discoveredStrokeTypes.length');
 run('oracle={isOpen:false,direction:"WEST"};enterMarket()');assert.equal(run('ghosts.length'),0);assert.equal(run('interactables.length'),0);assert.equal(run('state.successfulVisitCount'),level);assert.equal(run('state.discoveredStrokeTypes.length'),history);
 run('awardStroke()');flush();assert.equal(run('state.currentStrokesCollected'),1);run('state.endingReady=false;leaveMarket()');flush();
}
// Distance exits in eight directions, for both open and closed visits.
assert.equal(run('outsideMarketArea(0,3)'),false);
for(let z=3;z>=-33;z--)assert.equal(run('outsideMarketArea(0,'+z+')'),false);
for(const isOpen of [true,false]){
 run('oracle={isOpen:'+isOpen+',direction:"EAST"};enterMarket();');
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4,x=Math.cos(angle)*80,z=-20+Math.sin(angle)*80;
  assert.equal(run('outsideMarketArea('+x+','+z+')'),true);
  run('phase=open?"market":"closed";playerX='+x+';currentZ='+z+';controls.keys.clear();velocity=0;controls.busy=controls.modal=false;state.endingReady=false;update(lastFrame+16);');
  assert.equal(run('phase'),'returning');flush();
 }
}
run('oracle={isOpen:true,direction:"EAST"};enterMarket();var previousCollision=shamianCanMove;shamianCanMove=()=>false;controls.keys.add("KeyW");update(lastFrame+50);');
assert(run('currentZ')<3);
run('shamianCanMove=previousCollision;controls.keys.clear();');
// Explicit encounter test independent of layer/market state.
run('oracle={isOpen:false,direction:"EAST"};enterMarket();let npc={kind:"npc",mesh:new THREE.Mesh(new THREE.PlaneGeometry(1,2),mat(DATA.ghosts[0].blur)),done:false,clicks:0};events.push(npc);world.add(npc.mesh);triggerEncounter(npc);');assert(!run('npc.following'));
run('triggerEncounter(npc)');assert(!run('npc.following'));run('triggerEncounter(npc)');assert(run('npc.following'));
const levelBefore=run('state.successfulVisitCount');run('enterHidden()');assert(run('inHidden'));assert.equal(run('state.successfulVisitCount'),levelBefore);
run('hiddenAction(hiddenRoot.children.find(m=>m.userData.action==="card"))');assert.equal(run('state.foundTraces.length'),1);
run('exitHidden()');assert(!run('inHidden'));assert.equal(run('state.successfulVisitCount'),levelBefore);
run('updateInventory()');assert(!run('foundButton.hidden'));run('foundButton.click()');assert.equal(run('phase'),'found');assert.equal(run('foundPapers.children.length'),1);run('closeFound()');assert.equal(run('phase'),'closed');
// All types collected, not visit count: wait until leaving before composition.
run('controls.busy=controls.modal=false;achievementButton.click()');assert.equal(run('phase'),'achievements');assert(!run('achievementPanel.hidden'));run('closeAchievements()');assert.equal(run('phase'),'closed');
const quotaBefore=run('state.currentStrokesCollected');
run('var loose={kind:"anomaly",src:DATA.stalls[0].products[0],mesh:new THREE.Mesh(),done:false};triggerEncounter(loose)');
assert(run('loose.done'));assert.equal(run('state.currentStrokesCollected'),quotaBefore);
assert(run('state.achievements.find(i=>i.src===loose.src).sources.includes("FOUND")'));
const uniqueBefore=run('state.achievements.length');run('triggerEncounter(loose);collectCard(loose.src,"duplicate")');assert.equal(run('state.achievements.length'),uniqueBefore);
run('var textFind={kind:"stroke",src:DATA.texts[0],mesh:new THREE.Mesh(),done:false};triggerEncounter(textFind)');assert.equal(run('state.currentStrokesCollected'),quotaBefore);assert(run('getCompositionAssets().includes(textFind.src)'));
run('let drawCount=0;while(!state.endingReady&&drawCount++<60){state.currentStrokesCollected=0;awardStroke();}');flush();assert(run('state.endingReady'));assert.equal(run('phase'),'closed');
run('leaveMarket()');flush();assert.equal(run('phase'),'composition');assert.equal(run('arrangement.length'),run('getCompositionAssets().length'));assert(run('arrangement.some(p=>DATA.texts.includes(p.src))'));
run('finishComposition()');assert.equal(run('phase'),'composition');
run('{const p=arrangement[0];p.el.events.pointerdown[0]({button:0,pointerId:1,clientX:400,clientY:100,preventDefault(){}});p.el.events.pointermove[0]({pointerId:1,clientX:500,clientY:220});p.el.events.pointerup[0]({pointerId:1});}');
const arrangementBefore=run('JSON.stringify(arrangement.map(({src,x,y})=>({src,x,y})))');run('finishComposition()');assert.equal(run('phase'),'finished');assert.equal(run('JSON.stringify(state.finalComposition)'),arrangementBefore);
assert.equal(run('pieces.children[pieces.children.length-1].children.length'),run('compositionConnections(arrangement).length'));
assert(run('compositionConnections(arrangement).length>=arrangement.length-1&&compositionConnections(arrangement).length<=Math.ceil(arrangement.length*1.35)'));
assert(run('new Set(compositionConnections(arrangement).flatMap(e=>[e.a,e.b])).size===arrangement.length'));
assert(!run('exploreAgain.hidden'));assert(run('market.classList.contains("active")'));
run('globalThis.location={reload:()=>{globalThis.restarted=true;}};exploreAgain.click()');assert(run('restarted'));
console.log('PASS: progression, trade, all-direction exits, unified FOUND, historical achievements/progress, text+stroke composition, six red paths, street reveal and restart.');
`);
