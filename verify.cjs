// Run real application functions with Three.js math and a small DOM/event harness.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const THREE=require('./three.min.js');
class Element {
 constructor(){this.style={setProperty(){}};this.children=[];this.events={};this.dataset={};const s=new Set();this.classList={add:(...x)=>x.forEach(v=>s.add(v)),remove:(...x)=>x.forEach(v=>s.delete(v)),contains:x=>s.has(x),toggle:(x,v)=>v?s.add(x):s.delete(x)};this.clientWidth=1200}
 addEventListener(n,f){(this.events[n]??=[]).push(f)}
 click(e={}){for(const f of this.events.click||[])f({target:this,...e})}
 append(e){this.children.push(e);e.parentElement=this}replaceChildren(){this.children=[]}setAttribute(){}setPointerCapture(){}focus(){}remove(){}getBoundingClientRect(){return {left:0,top:0,width:1200,height:800}}
 querySelector(s){return this.parts?.[s]||(this.parts??={},this.parts[s]=new Element())}get firstElementChild(){return this.children[0]}
}
const els=new Map(),events={},timers=[];
const document={querySelector:s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)},createElement:()=>new Element(),body:new Element()};
THREE.WebGLRenderer=class{setPixelRatio(){}setSize(){}render(){}};
THREE.TextureLoader=class{load(){return new THREE.Texture()}};
const ctx=vm.createContext({THREE,document,LOCAL_ASSETS:{},innerWidth:1200,innerHeight:800,devicePixelRatio:1,structuredClone,console,Math,performance:{now:()=>1},setTimeout:f=>{timers.push(f);return timers.length},clearTimeout(){},requestAnimationFrame(){},addEventListener:(n,f)=>(events[n]??=[]).push(f)});
vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);vm.runInContext(fs.readFileSync('revision.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('ending.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);const flush=()=>{let f;while(f=timers.shift())f()};
run('enterMarket()');assert.equal(run('ghosts.length'),3);assert.equal(run('interactables.filter(m=>m.userData.type!=="ghost").length'),30);
run('controls.keys.add("KeyW"); update(100); update(116)');assert(run('currentZ')<3);run('controls.keys.clear(); controls.keys.add("KeyS")');for(let t=132;t<1000;t+=16)run(`update(${t})`);assert(run('velocity')>0);
run('controls.keys.clear(); const hosts=[...eligibleProducts]; hosts.forEach(src=>{const el=document.createElement("div");document.body.append(el);maybeStroke(el,src)});');
assert.equal(run('state.availableStrokes.length'),run('state.currentStrokeQuota'));flush();
run('leaveMarket()');flush();assert.equal(run('state.successfulVisitCount'),1);
run('DEBUG.forceMarketOpen=false; enterMarket()');assert.equal(run('ghosts.length'),1);assert.equal(run('interactables.filter(m=>m.userData.type!=="ghost").length'),0);run('leaveMarket()');flush();assert.equal(run('state.successfulVisitCount'),1);
run('DEBUG.forceMarketOpen=true; enterMarket(); ghosts.forEach(g=>interactGhost(g));');flush();assert.equal(run('state.currentStrokesCollected'),run('state.currentStrokeQuota'));run('leaveMarket()');flush();assert.equal(run('state.successfulVisitCount'),2);
run('enterMarket()');assert(run('inventory.classList.contains("visible")'));
// Actual raycast selection of each of the three vendor hitboxes.
for(const id of [1,2,3]){
 run(`{const g=ghosts.find(g=>g.cfg.id===${id}); camera.position.set(0,2.15,g.group.position.z+4); camera.lookAt(g.group.position.x,2.05,g.group.position.z);camera.updateMatrixWorld();controls.alt=true;onSceneClick({clientX:600,clientY:400});}`);
 assert.equal(run('activeGhost.cfg.id'),id);flush();
}
run('currentZ=camera.position.z;updateInventory()');const initial=run('state.availableStrokes.length');const button=run('inventoryItems.children[0]');
run('update(1200); update(1216)');assert.strictEqual(run('inventoryItems.children[0]'),button,'Buttons must survive frames');
// Reposition to vendor 3 after frame updates, then click a real registered inventory handler.
run('camera.position.set(0,2.15,ghosts[2].group.position.z+4);interactGhost(ghosts[2]);');flush();run('controls.alt=true;updateInventory();inventoryItems.children[0].click()');assert(run('offerConfirm.classList.contains("show")'));assert.equal(run('selectedStroke'),0);
run('offerConfirm.click({target:{dataset:{answer:"no"}}})');assert.equal(run('state.availableStrokes.length'),initial);assert(!run('controls.modal'));
run('inventoryItems.children[0].click();offerConfirm.click({target:{dataset:{answer:"yes"}}})');flush();assert.equal(run('state.availableStrokes.length'),initial-1);assert(run('state.acquiredProducts.at(-1).includes("stall-03")'));assert.equal(run('acquired.querySelector("span").textContent'),'OBJECT ACQUIRED');
run('leaveMarket()');flush();run('DEBUG.forceMarketOpen=false;enterMarket();leaveMarket()');flush();assert.equal(run('state.successfulVisitCount'),3);
assert.equal(run('state.attemptCount'),5);
console.log('PASS: five attempts, open/closed population, W/S, all 3 ghost raycasts, stable inventory buttons, NO preservation, YES consumption and vendor-03 reward.');
// Finishing is independent of visit count and current ownership.
run('state.successfulVisitCount=100; DEBUG.forceMarketOpen=true; enterMarket()');
assert.equal(run('phase'),'market');assert(!run('state.endingReady'));
run('state.availableStrokes.splice(0,state.availableStrokes.length)');
assert(run('state.discoveredStrokeTypes.length')>0,'Spending must retain discovery history');
run('let endingDraws=0; while(!state.endingReady && endingDraws<60){state.currentStrokesCollected=0;awardStroke();endingDraws++}');
assert(run('state.endingReady'));assert.equal(run('state.discoveredStrokeTypes.length'),12);
assert.equal(run('phase'),'market','The last stroke must not immediately end the visit');
flush();run('leaveMarket()');assert.equal(run('phase'),'returning');flush();assert.equal(run('phase'),'composition');
assert.equal(run('arrangement.length'),12);assert.equal(run('ticket.hidden'),true);run('finishComposition()');assert.equal(run('phase'),'composition','Must drag before Finish');
run('{const p=arrangement[0];p.el.events.pointerdown[0]({button:0,pointerId:1,clientX:400,clientY:100,preventDefault(){}});p.el.events.pointermove[0]({pointerId:1,clientX:500,clientY:220});p.el.events.pointerup[0]({pointerId:1});}');
const originalArrangement=run('JSON.stringify(arrangement.map(({src,x,y})=>({src,x,y})))');
run('finish.click()');assert.equal(run('phase'),'finished');assert.equal(run('JSON.stringify(state.finalComposition)'),originalArrangement);assert.equal(run('JSON.stringify(arrangement.map(({src,x,y})=>({src,x,y})))'),originalArrangement);
console.log('PASS: discovery retained after spending; duplicate protection reaches all 12; ending waits for corridor exit; drag-only composition and Finish preserve exact positions.');
