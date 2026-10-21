// Discovery survives spending within a session, never a browser refresh.
const strokeTypes=[...new Set(DATA.strokes)];
state.discoveredStrokeTypes=[];
state.endingReady=false;
state.duplicateStrokeRun=0;
Object.defineProperty(state,'ownedStrokes',{get:()=>state.availableStrokes});

function chooseEncounterStroke(){
  const missing=strokeTypes.filter(src=>!state.discoveredStrokeTypes.includes(src));
  if(!missing.length)return pick(strokeTypes);
  // Increasing preference for missing types, with a cap on consecutive duplicates.
  const preference=.35+.5*(state.discoveredStrokeTypes.length/strokeTypes.length)+.1*state.duplicateStrokeRun;
  if(state.duplicateStrokeRun>=3||Math.random()<preference)return pick(missing);
  return pick(strokeTypes);
}
awardStroke=function(){
  if(!open||state.currentStrokesCollected>=state.currentStrokeQuota)return;
  const src=chooseEncounterStroke();
  state.currentStrokesCollected++;
  state.collectedStrokes.push(src);
  state.availableStrokes.push(src);
  if(!state.discoveredStrokeTypes.includes(src)){
    state.discoveredStrokeTypes.push(src);
    state.duplicateStrokeRun=0;
  }else state.duplicateStrokeRun++;
  state.endingReady=strokeTypes.length>0&&state.discoveredStrokeTypes.length===strokeTypes.length;
  AudioManager.play('strokeAcquire');
  msg('STROKE ×1');
  showAcquired(src,'STROKE');
};
// The hidden fragment and its acquisition image must be the same chosen asset.
maybeStroke=function(el,product){
  if(!eligibleProducts.has(product)||state.currentStrokesCollected>=state.currentStrokeQuota)return;
  eligibleProducts.delete(product);
  awardStroke();
};

const composition=document.createElement('section');
composition.id='composition';composition.setAttribute('aria-label','Compose your Ghost Market');
const board=document.createElement('div');board.id='composition-board';
const pieces=document.createElement('div');pieces.id='composition-pieces';
const prompt=document.createElement('p');prompt.id='composition-prompt';prompt.textContent='PUT THE PIECES TOGETHER.';
const finish=document.createElement('button');finish.id='composition-finish';finish.textContent='FINISH';finish.disabled=true;
const endingText=document.createElement('p');endingText.id='composition-ending';endingText.textContent='THIS IS YOUR GHOST MARKET.';
board.append(pieces);board.append(prompt);board.append(finish);board.append(endingText);composition.append(board);document.body.append(composition);
let compositionScale=1,compositionDragged=false,compositionDrag=null,compositionOrder=1;
const arrangement=[];
const exploreAgain=document.createElement('button');exploreAgain.id='explore-again';exploreAgain.textContent='EXPLORE AGAIN';exploreAgain.hidden=true;board.append(exploreAgain);
exploreAgain.addEventListener('click',()=>location.reload());
function fitComposition(){compositionScale=Math.min(innerWidth/1000,innerHeight/700);board.style.transform=`translate(-50%,-50%) scale(${compositionScale})`}
addEventListener('resize',fitComposition);
function drawStroke(piece){piece.el.style.left=piece.x+'px';piece.el.style.top=piece.y+'px'}
function beginComposition(){
  phase='composition';controls.keys.clear();controls.busy=false;controls.modal=false;velocity=0;
  activeGhost=null;selectedStroke=null;
  clearTimeout(instructionTimer);clearTimeout(feedbackTimer);clearTimeout(acquiredTimer);
  hideGuide();feedback.classList.remove('show');acquired.classList.remove('show');
  inventory.classList.remove('visible');inspection.classList.remove('active');offerConfirm.classList.remove('show');closedMessage.classList.remove('show');
  market.classList.remove('active');entry.classList.add('leaving');ticket.hidden=true;
  document.body.classList.remove('has-inventory','is-crossing');
  composition.classList.add('visible');fitComposition();
  compositionDragged=false;compositionDrag=null;finish.disabled=true;finish.classList.remove('available');composition.classList.remove('finished');exploreAgain.hidden=true;pieces.style.transform='';
  arrangement.length=0;pieces.replaceChildren();
  // A ring of untouched, equally sized stroke images leaves the middle empty.
  const compositionAssets=getCompositionAssets();
  compositionAssets.forEach((src,i)=>{
    const angle=-Math.PI/2+i*Math.PI*2/compositionAssets.length;
    const el=document.createElement('div');el.className='composition-stroke';
    const img=document.createElement('img');img.src=src;img.alt='';img.draggable=false;el.append(img);
    const piece={src,el,x:448+370*Math.cos(angle),y:285+225*Math.sin(angle)};
    arrangement.push(piece);drawStroke(piece);pieces.append(el);
    el.addEventListener('pointerdown',e=>{
      if(phase!=='composition'||e.button!==0||compositionDrag)return;
      e.preventDefault();el.setPointerCapture(e.pointerId);el.style.zIndex=String(++compositionOrder);
      compositionDrag={piece,id:e.pointerId,startX:e.clientX,startY:e.clientY,x:piece.x,y:piece.y};
    });
    el.addEventListener('pointermove',e=>{
      const drag=compositionDrag;if(!drag||drag.piece!==piece||drag.id!==e.pointerId||phase!=='composition')return;
      const dx=(e.clientX-drag.startX)/compositionScale,dy=(e.clientY-drag.startY)/compositionScale;
      piece.x=THREE.MathUtils.clamp(drag.x+dx,20,876);piece.y=THREE.MathUtils.clamp(drag.y+dy,76,510);drawStroke(piece);
      if(Math.hypot(dx,dy)>3){compositionDragged=true;finish.disabled=false;finish.classList.add('available')}
    });
    const release=e=>{if(compositionDrag?.id===e.pointerId)compositionDrag=null};
    el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
  });
}
function finishComposition(){
  if(phase!=='composition'||!compositionDragged||compositionDrag)return;
  phase='finished';finish.disabled=true;
  state.endingStartedAt=performance.now();AudioManager.play('endingReveal');
  state.finalComposition=arrangement.map(({src,x,y})=>({src,x,y}));
  const left=Math.min(...arrangement.map(p=>p.x)),top=Math.min(...arrangement.map(p=>p.y));
  const right=Math.max(...arrangement.map(p=>p.x+104)),bottom=Math.max(...arrangement.map(p=>p.y+104));
  const scale=Math.min(1.5,980/(right-left),620/(bottom-top));
  // One common transform preserves every relative position and overlap exactly.
  pieces.style.transform=`translate(${500-(left+right)*scale/2}px,${320-(top+bottom)*scale/2}px) scale(${scale})`;
  composition.classList.add('finished');
  drawCompositionThreads();
  // Reveal the actual existing Gaussian street renderer, not a substitute picture.
  market.classList.remove('fading');market.classList.add('active');
  camera.position.set(0,1.75,-12);camera.rotation.set(0,0,0);camera.updateMatrixWorld();
  exploreAgain.hidden=false;
}
// A sparse spatial graph: minimum-length connections plus a few local links.
function compositionConnections(nodes){
  if(nodes.length<2)return [];
  const candidates=[];
  for(let a=0;a<nodes.length;a++)for(let b=a+1;b<nodes.length;b++)
    candidates.push({a,b,d:Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y)});
  candidates.sort((a,b)=>a.d-b.d);
  const parent=nodes.map((_,i)=>i),degree=nodes.map(()=>0),edges=[],keys=new Set();
  const root=i=>{while(parent[i]!==i)i=parent[i];return i;};
  const add=e=>{edges.push(e);keys.add(e.a+':'+e.b);degree[e.a]++;degree[e.b]++;};
  for(const e of candidates){const a=root(e.a),b=root(e.b);if(a!==b){parent[a]=b;add(e);}}
  const turn=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const crosses=(e,f)=>{
    if([e.a,e.b].some(i=>i===f.a||i===f.b))return false;
    const a=nodes[e.a],b=nodes[e.b],c=nodes[f.a],d=nodes[f.b];
    return turn(a,b,c)*turn(a,b,d)<0&&turn(c,d,a)*turn(c,d,b)<0;
  };
  const localLimit=Math.max(100,edges.map(e=>e.d).sort((a,b)=>a-b)[Math.floor(edges.length/2)]*1.6);
  for(const e of candidates){
    if(edges.length>=Math.ceil(nodes.length*1.35))break;
    if(!keys.has(e.a+':'+e.b)&&e.d<localLimit&&degree[e.a]<3&&degree[e.b]<3&&!edges.some(f=>crosses(e,f)))add(e);
  }
  return edges;
}
function drawCompositionThreads(){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('class','composition-threads');svg.setAttribute('viewBox','0 0 1000 700');svg.setAttribute('aria-hidden','true');
  const nodes=arrangement.map(p=>({x:p.x+52,y:p.y+52}));
  compositionConnections(nodes).forEach((edge,i)=>{
    const a=nodes[edge.a],b=nodes[edge.b],path=document.createElementNS(ns,'path');
    path.setAttribute('d','M '+a.x+' '+a.y+' L '+b.x+' '+b.y);
    path.setAttribute('pathLength','1');path.setAttribute('class','composition-thread');
    path.setAttribute('vector-effect','non-scaling-stroke');
    path.style.setProperty('--thread-delay',(i*.12)+'s');
    let sounded=false;
    path.addEventListener('animationstart',event=>{if(event.animationName==='thread-reveal'&&!sounded&&phase==='finished'){sounded=true;AudioManager.play('threadAppear');}});
    svg.append(path);
  });
  pieces.append(svg);
}
finish.addEventListener('click',finishComposition);
const loopReturn=leaveMarket;
leaveMarket=function(){
  if(!state.endingReady){loopReturn();return}
  if(!['market','closed'].includes(phase)||controls.busy||controls.modal)return;
  phase='returning';controls.keys.clear();velocity=0;
  inventory.classList.remove('visible');market.classList.add('fading');hideGuide();
  setTimeout(()=>{if(open)state.successfulVisitCount++;beginComposition()},1150);
};
