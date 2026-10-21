// Shared A/B visual choreography. Hit planes remain children of the moving ghost.
// No changes to rewards, click handlers, stall mappings, audio or reach.
function initVendorTypography(){
  visualItems=visualItems.filter(item=>item.kind!=='text');
  ghosts.forEach(g=>{
    g.textGroup.children.slice().forEach(m=>{g.textGroup.remove(m);m.geometry.dispose();m.material.dispose();});
    const rng=seeded(928+g.cfg.id),range=(a,b)=>a+(b-a)*rng();
    const root=new THREE.Group();root.position.copy(g.group.position);world.add(root);
    const motion={root,rng,range,items:[],anchor:g.group.position.clone(),clock:0,travel:0,pause:1.2,from:g.group.position.clone(),to:g.group.position.clone(),target:0};
    g.typography=motion;
    const count=g.cfg.id===2?14:8;
    for(let i=0;i<count;i++){
      const src=DATA.texts[Math.floor(rng()*DATA.texts.length)];
      const m=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.95),mat(src));
      m.visible=true;m.material.opacity=0;m.renderOrder=1;root.add(m);
      const angle=i/count*Math.PI*2+range(-.2,.2),radius=range(1.8,3.5);
      m.position.set(Math.cos(angle)*radius,range(.6,4.7),Math.sin(angle)*1.7);
      m.rotation.z=range(-.18,.18);m.scale.setScalar(range(.8,1.4));
      motion.items.push({m,angle,radius,height:m.position.y,depth:range(1,2.1),speed:range(.24,.4),age:-range(0,1.8),life:range(.45,1.2),src});
    }
    // Fixed text and bounded waypoints share the stall's world-space anchor.
    motion.waypoints=motion.items.map(({m})=>motion.anchor.clone().add(new THREE.Vector3(m.position.x*.6,0,m.position.z*.7)));
  });
}
function refreshSpeech(motion,item){
  const {rng,range}=motion;
  let src=DATA.texts[Math.floor(rng()*DATA.texts.length)];
  if(src===item.src&&DATA.texts.length>1)src=DATA.texts[(DATA.texts.indexOf(src)+1)%DATA.texts.length];
  item.src=src;item.m.material.map=textures.get(src);item.m.material.needsUpdate=true;
  item.m.position.set(range(-3.1,3.1),range(.4,5.3),range(-1.6,1.5));
  item.m.scale.setScalar(range(.72,1.45));item.m.rotation.z=range(-.22,.22);
  item.life=range(.42,1.15);item.age=0;
}
function updateVendorTypography(dt){
  ghosts.forEach(g=>{
    const v=g.typography;if(!v)return;
    const near=clamp01((23-camera.position.distanceTo(v.anchor))/17);
    v.clock+=dt;
    if(g.cfg.id===3){
      // Movement is time-based, eased and separated by short rests, not walking.
      if(v.pause>0)v.pause-=dt;
      else{
        if(v.travel===0){v.from.copy(g.group.position);v.target=(v.target+1+Math.floor(v.rng()*(v.waypoints.length-1)))%v.waypoints.length;v.to.copy(v.waypoints[v.target]);}
        v.travel=Math.min(1,v.travel+dt/4.8);
        const u=v.travel*v.travel*(3-2*v.travel);
        g.group.position.lerpVectors(v.from,v.to,u);
        if(v.travel===1){v.travel=0;v.pause=v.range(.8,1.9);}
      }
    }
    v.items.forEach((item,i)=>{
      const m=item.m;
      if(g.cfg.id===1){
        const angle=item.angle+v.clock*item.speed;
        m.position.set(Math.cos(angle)*item.radius,item.height+Math.sin(angle)*.28,Math.sin(angle)*item.depth);
        m.quaternion.copy(camera.quaternion);
        m.material.opacity=.17+near*.68;
        // Transparent ghosts do not write depth: explicitly interleave the
        // orbit behind/in front using camera-space depth, including rear views.
        const textDepth=m.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse).z;
        const ghostDepth=g.group.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse).z;
        m.renderOrder=textDepth<ghostDepth?1:4;
      }else if(g.cfg.id===2){
        item.age+=dt*(.65+near*1.15);
        if(item.age>item.life+ .12)refreshSpeech(v,item);
        const envelope=clamp01(item.age/.07)*clamp01((item.life-item.age)/.13);
        // Far: a few simultaneous voices. Near: all fourteen independent slots.
        m.material.opacity=envelope*(.2+near*.68)*(i<5?1:clamp01(near*1.7-(i-5)*.065));
        m.quaternion.copy(camera.quaternion);
      }else{
        // Never mutate fixed text position, rotation or scale after initialization.
        m.material.opacity=i<4?.18+near*.65:.04+near*.79;
      }
      if(testVersion==='B')m.material.opacity=Math.min(1,m.material.opacity*(1+g.pulse*.35));
    });
  });
}
