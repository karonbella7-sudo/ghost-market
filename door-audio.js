// Start from the door's actual animation clock, after its closed 0–12% hold.
(() => {
  const originalPlay=AudioManager.play,voices=new Set();
  let noise=null;
  const leftDoor=document.querySelector('.crossing-left');
  let animationRun=0;
  leftDoor.addEventListener('animationstart',event=>{
    if(event.animationName!=='crossing-left'||event.target!==leftDoor||reduced)return;
    const run=++animationRun;
    const animation=leftDoor.getAnimations().find(a=>a.animationName==='crossing-left');
    if(!animation)return;
    function waitForSeparation(){
      if(run!==animationRun||phase!=='crossing'||document.hidden)return;
      const progress=animation.effect.getComputedTiming().progress;
      if(progress!==null&&progress>.12){AudioManager.play('doorOpen');return;}
      if(animation.playState!=='finished')requestAnimationFrame(waitForSeparation);
    }
    requestAnimationFrame(waitForSeparation);
  });
  AudioManager.play=function(name){
    if(name!=='doorOpen')return originalPlay.call(this,name);
    const ctx=this.ctx;
    if(!ctx||document.hidden||phase!=='crossing')return;
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    const now=ctx.currentTime;
    if(now-(this.last.doorOpen??-Infinity)<.3)return;
    this.last.doorOpen=now;
    if(!noise){
      noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*1.5),ctx.sampleRate);
      const data=noise.getChannelData(0);let previous=0;
      for(let i=0;i<data.length;i++){previous=previous*.72+(Math.random()*2-1)*.28;data[i]=previous;}
    }
    for(const side of [-1,1]){
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),pan=ctx.createStereoPanner();
      const start=now,duration=1.06;
      source.buffer=noise;filter.type='bandpass';filter.Q.value=.65;
      filter.frequency.setValueAtTime(side<0?620:780,start);
      filter.frequency.exponentialRampToValueAtTime(240,start+duration);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(.24,start+duration*.2);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      pan.pan.setValueAtTime(side*.08,start);pan.pan.linearRampToValueAtTime(side*.85,start+duration);
      source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(ctx.destination);
      voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};
      source.start(start);source.stop(start+duration+.02);
    }
  };
  const stop=()=>{animationRun++;for(const source of voices){try{source.stop();}catch(_){}}voices.clear();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  addEventListener('pagehide',stop);
})();
