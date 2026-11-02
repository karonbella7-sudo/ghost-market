(()=>{
 const hint=document.createElement('button');hint.textContent='CLICK TO LOOK AROUND · HOLD LEFT ALT FOR CURSOR';
 hint.style.cssText='position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:95;padding:12px 20px;background:white;border:1px solid #aaa;font:14px monospace';document.body.append(hint);
 const locked=()=>document.pointerLockElement===canvas;
 const request=()=>{if(!moving()||controls.alt||locked())return;try{const result=canvas.requestPointerLock();result?.catch(()=>{hint.hidden=false})}catch(e){hint.hidden=false}};
 hint.onclick=request;
 canvas.addEventListener('click',()=>{if(!controls.alt)request()});
 document.addEventListener('mousemove',e=>{if(!locked()||!moving()||controls.alt)return;controls.yaw-=e.movementX*.003;controls.pitch=THREE.MathUtils.clamp(controls.pitch-e.movementY*.003,-Math.PI/4,Math.PI/4);lastPointer=null});
 addEventListener('keydown',e=>{if(e.code==='AltLeft'&&locked())document.exitPointerLock();if(['KeyW','KeyS'].includes(e.code))request()});
 addEventListener('keyup',e=>{if(e.code==='AltLeft')request()});
 document.addEventListener('pointerlockchange',()=>{lastPointer=null;if(!locked()){controls.keys.clear();velocity=0}});
 function sync(){if(locked()&&(!moving()||controls.alt))document.exitPointerLock();hint.hidden=!moving()||controls.alt||locked();if(moving()&&!locked())canvas.style.cursor='default';requestAnimationFrame(sync)}sync();
})();
