'use strict';
const $=id=>document.getElementById(id),stage=$('stage'),shell=$('shell'),carrier=$('shell-carrier');
const PITY_LIMIT=2,reduced=matchMedia('(prefers-reduced-motion: reduce)');
let phase='loading',losses=0,pointer=null,keyboard=false,start={x:0,y:0},timer=null;
function randomInt(n){const values=new Uint32Array(1);crypto.getRandomValues(values);return Math.floor(values[0]/4294967296*n)}
function judge(faces){const heads=faces.reduce((sum,f)=>sum+Number(f),0);return heads===3?'鸿运':heads===2?'吉':'平'}
function chooseFaces(streak){if(streak>=PITY_LIMIT)return{faces:[[1,1,0],[1,0,1],[0,1,1],[1,1,1]][randomInt(4)],pity:true};return{faces:[randomInt(2),randomInt(2),randomInt(2)],pity:false}}
function later(fn,ms){clearTimeout(timer);timer=setTimeout(fn,reduced.matches?0:ms)}
function neutral(){shell.style.setProperty('--dx','0px');shell.style.setProperty('--dy','0px');shell.style.setProperty('--tilt','0deg');shell.classList.remove('keyboard-shake')}
function renderVerdict(outcome){
 const host=$('verdict'),ns='http://www.w3.org/2000/svg',characters=[...outcome];
 host.dataset.characters=String(characters.length);
 const cells=characters.map(character=>{
  const svg=document.createElementNS(ns,'svg'),text=document.createElementNS(ns,'text');
  text.textContent=character;text.setAttribute('x','0');text.setAttribute('y','0');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('viewBox','-100 -900 1200 1200');svg.appendChild(text);
  return {svg,text};
 });
 host.replaceChildren(...cells.map(cell=>cell.svg));
 const loaded=document.fonts?document.fonts.load('1000px "Oracle Classical Mincho"',outcome+'吉'):Promise.resolve();
 loaded.catch(()=>{}).then(()=>{
  if(host.hidden||!host.contains(cells[0].svg))return;
  // Each fortune character uses exactly the same scale as the single 吉 glyph.
  const probe=document.createElementNS(ns,'text');probe.textContent='吉';probe.setAttribute('opacity','0');
  cells[0].svg.appendChild(probe);const reference=probe.getBBox();probe.remove();
  cells.forEach(({svg,text})=>{
   const b=text.getBBox(),frame=characters.length>1?reference:b;
   if(frame.width<=0||frame.height<=0)return;
   const pad=Math.max(frame.width,frame.height)*.012,w=frame.width+pad*2,h=frame.height+pad*2;
   svg.setAttribute('viewBox',`${b.x+b.width/2-w/2} ${b.y+b.height/2-h/2} ${w} ${h}`);
  });
 });
}
function enter(){if(!['loading','result'].includes(phase))return;window.oracleAudio?.stopResult();phase='entering';$('again').hidden=true;$('result').hidden=true;$('verdict').hidden=true;$('coins').innerHTML='';neutral();carrier.className='shell-carrier entering';shell.disabled=true;$('hint').textContent='WAIT FOR THE SHELL';later(()=>{carrier.className='shell-carrier';phase='idle';shell.disabled=false;$('hint').textContent='HOLD AND SHAKE · RELEASE TO CAST'},1450)}
function begin(){if(phase!=='idle')return false;phase='shaking';$('hint').textContent='SHAKE GENTLY · RELEASE TO CAST';return true}
function cancel(){if(phase!=='shaking')return;window.oracleAudio?.stopShake();phase='idle';pointer=null;keyboard=false;neutral();$('hint').textContent='HOLD AND SHAKE · RELEASE TO CAST'}
function cast(){if(phase!=='shaking')return;window.oracleAudio?.land(reduced.matches);phase='casting';pointer=null;keyboard=false;neutral();shell.disabled=true;$('hint').textContent='LET THE COINS SETTLE';
 const {faces,pity}=chooseFaces(losses),outcome=judge(faces);losses=outcome!=='平'?0:losses+1;
 const rect=stage.getBoundingClientRect(),size=carrier.getBoundingClientRect(),spread=Math.min(rect.width*.22,160),vertical=Math.min(rect.height*.15,82),mouthY=-size.height*.46;
 const anchors=[[-spread,-vertical*.32],[spread*.85,-vertical*.7],[spread*.02,vertical*1.15]];
 faces.forEach((face,i)=>{const coin=document.createElement('div');coin.className='coin flying';coin.setAttribute('role','img');coin.setAttribute('aria-label',`Coin ${i+1}: ${face?'script face':'pattern face'}`);coin.dataset.face=String(face);const[x,y]=anchors[i],jitter=Math.min(18,rect.width*.025);coin.style.cssText=`--x:${x+(randomInt(201)/100-1)*jitter}px;--y:${y+(randomInt(201)/100-1)*jitter}px;--r:${randomInt(45)-22}deg;--mouth-x:${(i-1)*9}px;--mouth-y:${mouthY}px;--arc-x:${x*.55}px;--delay:${i*.12}s`;coin.innerHTML=`<svg viewBox="817 396 754 754" aria-hidden="true"><image href="assets/${face?'coin-script':'coin-pattern'}.png" width="2388" height="1668"/></svg>`;$('coins').appendChild(coin)});
 carrier.className='shell-carrier exiting';later(()=>{carrier.className='shell-carrier hidden';phase='result';$('verdict').dataset.outcome=outcome!=='平'?'open':'rest';$('verdict').hidden=false;renderVerdict(outcome);$('announcement').textContent=outcome==='鸿运'?'GREAT FORTUNE. THE MARKET IS OPEN.':outcome==='吉'?'THE MARKET IS OPEN.':'THE MARKET RESTS TONIGHT.';$('result').hidden=false;$('again').hidden=false;$('hint').textContent='';window.oracleAudio?.bell(outcome);stage.dataset.lastFaces=faces.join('');stage.dataset.pity=String(pity)},2050);
}
shell.addEventListener('pointerdown',event=>{if(event.button!==0||!begin())return;window.oracleAudio?.begin(event.clientX,event.clientY);pointer=event.pointerId;start={x:event.clientX,y:event.clientY};shell.setPointerCapture(pointer);event.preventDefault()});
shell.addEventListener('pointermove',event=>{if(phase!=='shaking'||event.pointerId!==pointer)return;window.oracleAudio?.move(event.clientX,event.clientY);const dx=Math.max(-23,Math.min(23,(event.clientX-start.x)*.28)),dy=Math.max(-9,Math.min(9,(event.clientY-start.y)*.15));shell.style.setProperty('--dx',`${dx}px`);shell.style.setProperty('--dy',`${dy}px`);shell.style.setProperty('--tilt',`${dx*.4}deg`)});
shell.addEventListener('pointerup',event=>{if(event.pointerId===pointer)cast()});shell.addEventListener('pointercancel',cancel);shell.addEventListener('lostpointercapture',()=>{if(pointer!==null)cancel()});
shell.addEventListener('keydown',event=>{if(![' ','Enter'].includes(event.key))return;event.preventDefault();if(!event.repeat&&begin()){keyboard=true;window.oracleAudio?.begin(0,0);window.oracleAudio?.keyboard();shell.classList.add('keyboard-shake')}});shell.addEventListener('keyup',event=>{if(![' ','Enter'].includes(event.key))return;event.preventDefault();if(keyboard)cast()});shell.addEventListener('blur',()=>{if(keyboard)cancel()});window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});$('again').addEventListener('click',()=>{window.oracleAudio?.unlock();enter()});
Promise.all(['turtle-shell','coin-script','coin-pattern'].map(name=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=`assets/${name}.png`}))).then(enter).catch(()=>{$('hint').textContent='ARTWORK COULD NOT LOAD. KEEP THE ASSETS FOLDER BESIDE THIS PAGE.'});




