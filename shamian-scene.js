// Actual guangzhou-3d geometry, always displayed as Gaussian/brush fragments.
// Not a scanned/trained 3DGS scene. Everything is packaged for file:// playback.
let shamianScene = null;
const SHAMIAN_RANGE = {front:11, back:-51, side:19};
function buildShamianStreet(){
  const root=new THREE.Group();root.name='Shamian / extracted street';world.add(root);
  const buckets=Array.from({length:4},()=>({position:[],normal:[],color:[]}));
  const matrix=new THREE.Matrix4(),normalMatrix=new THREE.Matrix3();
  const p=new THREE.Vector3(),n=new THREE.Vector3();
  // Keep the real street scale. Draw context beyond the short playable range.
  function append(data,transform,kind,tint){
    const out=buckets[kind],idx=data.index||Array.from({length:data.position.length/3},(_,i)=>i);
    normalMatrix.getNormalMatrix(transform);
    for(let k=0;k<idx.length;k+=3){
      const tri=[];
      for(let j=0;j<3;j++){
        const i=idx[k+j];p.fromArray(data.position,i*3).applyMatrix4(transform);
        if(data.normal)n.fromArray(data.normal,i*3).applyMatrix3(normalMatrix).normalize();else n.set(0,1,0);
        const c=data.color?data.color.slice(i*3,i*3+3):tint;
        tri.push({p:p.toArray(),n:n.toArray(),c});
      }
      if(tri.every(v=>v.p[0]<-52)||tri.every(v=>v.p[0]>52)||tri.every(v=>v.p[2]<-100)||tri.every(v=>v.p[2]>38))continue;
      for(const v of tri){out.position.push(...v.p);out.normal.push(...v.n);out.color.push(...v.c);}
    }
  }
  SHAMIAN_DATA.buildings.forEach(g=>append(g,matrix.identity(),0,[.65,.63,.57]));
  SHAMIAN_DATA.parts.forEach(part=>part.instances.forEach(i=>{
    if(Math.abs(i.matrix[12])<62&&i.matrix[14]>-110&&i.matrix[14]<48)append(part.geometry,matrix.fromArray(i.matrix),1,i.color);
  }));
  SHAMIAN_DATA.trees.forEach(tree=>tree.instances.forEach(m=>{
    if(Math.abs(m[12])<58&&m[14]>-105&&m[14]<43)append(tree.geometry,matrix.fromArray(m),2,[.22,.3,.19]);
  }));
  append(SHAMIAN_DATA.road,matrix.identity(),3,[.49,.5,.46]);
  // Flat local ground matches the extracted preset's zero-height terrain.
  // Below the source road and the existing stall cloths, so none get buried.
  const ground={position:[-60,-.045,45,60,-.045,45,60,-.045,-110,-60,-.045,-110],normal:[0,1,0,0,1,0,0,1,0,0,1,0],index:[0,1,2,0,2,3]};
  append(ground,matrix.identity(),3,[.69,.68,.61]);
  const uniforms={uPulse:{value:0},uTime:{value:0},uPixels:{value:innerHeight},uInkCenters:{value:Array.from({length:3},()=>new THREE.Vector3())},uInkAmount:{value:new Float32Array(3)}};
  // Retain source surfaces only for collision, never as visible solid streets.
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const colliders=[];
  buckets.forEach((b,i)=>{if(!b.position.length)return;const geometry=new THREE.BufferGeometry();for(const key of ['position','normal','color'])geometry.setAttribute(key,new THREE.Float32BufferAttribute(b[key],3));geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;mesh.name=['source buildings','source details','source trees','source road + ground'][i];root.add(mesh);if(i<3)colliders.push(mesh);});
  // Area-weighted sampling of the source triangles. Fixed pool: no new particles
  // or geometries are allocated while the visitor moves or triggers a reward.
  const rng=seeded(929),triangles=[];let areaSum=0;
  for(const b of buckets)for(let i=0;i<b.position.length;i+=9){
    const a=new THREE.Vector3().fromArray(b.position,i),v=new THREE.Vector3().fromArray(b.position,i+3),c=new THREE.Vector3().fromArray(b.position,i+6);
    const area=new THREE.Vector3().subVectors(v,a).cross(new THREE.Vector3().subVectors(c,a)).length()*.5;
    if(area<.001)continue;areaSum+=area;triangles.push({a,b:v,c,color:b.color.slice(i,i+3),area:areaSum});
  }
  const positions=[],colors=[],sizes=[];
  for(let attempts=0;positions.length/3<48000&&attempts<240000;attempts++){
    const pick=rng()*areaSum;let lo=0,hi=triangles.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid].area<pick)lo=mid+1;else hi=mid;}
    const tri=triangles[lo],u=Math.sqrt(rng()),v=rng();p.copy(tri.a).multiplyScalar(1-u).addScaledVector(tri.b,u*(1-v)).addScaledVector(tri.c,u*v);
    if(Math.abs(p.x)>52||p.z<-100||p.z>38)continue;
    positions.push(p.x,p.y+.025,p.z);colors.push(...tri.color);sizes.push(.16+rng()*.32);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  const pointMaterial=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,uniforms,
    vertexShader:`uniform float uPulse,uTime,uPixels;uniform vec3 uInkCenters[3];uniform float uInkAmount[3];attribute float aSize;varying vec3 vC;varying float vShape,vDepth;
    void main(){vec3 p=position;float ink=0.;for(int i=0;i<3;i++){ink=max(ink,(1.-smoothstep(3.,15.,distance(position.xz,uInkCenters[i].xz)))*uInkAmount[i]);}float drift=.16+uPulse*.35+ink*.7;
      p.x+=sin(position.z*1.7+position.y+uTime*.7)*drift;p.y+=sin(position.x*2.3+uTime*.9)*drift*.6;p.z+=cos(position.x+uTime)*drift*.4;
      vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixels/max(1.,-mv.z)*(1.6+ink*.4),1.,75.);vC=mix(color,vec3(.08),ink*.6);vShape=max(step(.5,fract(aSize*71.)),ink);}`,
    fragmentShader:`varying vec3 vC;varying float vShape,vDepth;void main(){vec2 q=(gl_PointCoord-.5)*2.;q.x+=q.y*.3*vShape;q.x*=1.+vShape*2.5;float r=dot(q,q);if(r>1.)discard;
      float alpha=exp(-r*3.5)*.9*(1.-smoothstep(40.,115.,vDepth));vec3 c=mix(vC,vec3(.12,.13,.11),.45+vShape*.2);gl_FragColor=vec4(c,alpha);
      #include <encodings_fragment>
    }`
  });
  const points=new THREE.Points(geometry,pointMaterial);points.frustumCulled=false;root.add(points);
  const reward=new THREE.Mesh(new THREE.PlaneGeometry(1,1.4),mat(DATA.strokes[0]));reward.visible=false;reward.renderOrder=5;root.add(reward);
  shamianScene={root,uniforms,points,colliders,pulse:0,effects:true,reward,rewardAge:2,rewardOrigin:new THREE.Vector3()};street=points;
  // Shader fallback stays point-based; never restore solid street surfaces.
  if(typeof renderer.compile==='function'){
    let failed=false;
    try{renderer.compile(scene,camera);failed=renderer.info.programs.some(p=>p.diagnostics&&p.diagnostics.runnable===false);}catch(e){failed=true;}
    if(failed){
      shamianScene.effects=false;
      const pixels=new Uint8Array(32*32*4);
      for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=((x-15.5)/15.5)**2+((y-15.5)/15.5)**2;pixels.set([255,255,255,r>1?0:Math.round(230*Math.exp(-r*3.5))],i);}
      const sprite=new THREE.DataTexture(pixels,32,32,THREE.RGBAFormat);sprite.needsUpdate=true;
      points.material=new THREE.PointsMaterial({map:sprite,size:.55,vertexColors:true,transparent:true,depthWrite:false});
      shamianScene.fallbackTexture=sprite;pointMaterial.dispose();msg('BASIC SPLAT MODE',3500);
    }
  }
  scene.background=new THREE.Color('#ffffff');scene.fog=new THREE.Fog('#ffffff',40,115);
  camera.far=180;camera.updateProjectionMatrix();controls.pitch=SHAMIAN_DATA.report.pitch;
  root.updateMatrixWorld(true);
}
function updateShamianStreet(dt,t){
  if(!shamianScene)return;
  const s=shamianScene;
  s.pulse=Math.max(0,s.pulse-dt*.8);s.uniforms.uPulse.value=s.pulse;s.uniforms.uTime.value=t*.001;s.uniforms.uPixels.value=innerHeight;
  s.rewardAge+=dt;s.reward.visible=s.rewardAge<1.3;
  if(s.reward.visible){s.reward.position.copy(s.rewardOrigin);s.reward.position.y+=s.rewardAge*.75;s.reward.quaternion.copy(camera.quaternion);s.reward.material.opacity=Math.sin(s.rewardAge/1.3*Math.PI)*.8;}
}
function shamianCanMove(x,z,oldX,oldZ){
  if(!shamianScene)return true;
  const step=new THREE.Vector3(x-oldX,0,z-oldZ),length=step.length();if(length<.00001)return true;
  const ray=new THREE.Raycaster(new THREE.Vector3(oldX,1.1,oldZ),step.normalize(),0,length+.32);
  return ray.intersectObjects(shamianScene.colliders,false).length===0;
}
// Third cloth lies just before a real building corner, rather than inside it.
// Do not mutate DATA or product mappings: this offset is presentation-only.
function fitShamianStalls(){
  interactables.filter(m=>m.userData.cfg.id===3&&m.userData.type!=='ghost').forEach(m=>m.position.z+=3.5);
  ghosts[2].group.position.z+=3.5;
}
const shamianBaseAward=awardStroke;
awardStroke=function(src){
  const before=state.currentStrokesCollected;shamianBaseAward(src);
  if(testVersion!=='B'||!shamianScene||state.currentStrokesCollected===before)return;
  const product=state.interactedProducts[state.interactedProducts.length-1];
  const g=(phase==='inspect'?ghosts.find(g=>g.cfg.products.includes(product)):activeGhost)||ghosts.reduce((a,b)=>distance(a.group)<distance(b.group)?a:b);
  g.pulse=1;const s=shamianScene;s.pulse=1;s.rewardAge=0;
  s.rewardOrigin.copy(g.typography.items[0].m.getWorldPosition(new THREE.Vector3()));
  s.reward.material.map=textures.get(src);s.reward.material.needsUpdate=true;
};
