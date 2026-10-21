(() => {
  // Exact same recording, speed and level as the oracle's auspicious verdict.
  const verdict=new Audio('oracle/audio/result-open.mp4');
  verdict.preload='auto';verdict.loop=false;verdict.volume=.48;
  const previous=AudioManager.play,voices=new Set();
  let friction=null;
  AudioManager.play=function(name){
    if(!['endingReveal','threadAppear'].includes(name))return previous.call(this,name);
    if(phase!=='finished'||document.hidden)return;
    if(name==='endingReveal'){
      verdict.currentTime=0;Promise.resolve(verdict.play()).catch(()=>{});return;
    }
    const ctx=this.ctx;if(!ctx)return;
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    if(!friction){
      friction=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.3),ctx.sampleRate);
      const data=friction.getChannelData(0);let smooth=0;
      for(let i=0;i<data.length;i++){smooth=smooth*.45+(Math.random()*2-1)*.55;data[i]=smooth;}
    }
    const now=ctx.currentTime,o=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
    o.buffer=friction;o.loop=false;
    filter.type='bandpass';filter.Q.value=.55;
    filter.frequency.setValueAtTime(1800,now);filter.frequency.exponentialRampToValueAtTime(550,now+.24);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.15,now+.035);g.gain.exponentialRampToValueAtTime(.0001,now+.26);
    o.connect(filter);filter.connect(g);g.connect(ctx.destination);voices.add(o);
    o.onended=()=>{voices.delete(o);o.disconnect();filter.disconnect();g.disconnect();};o.start(now);o.stop(now+.28);
  };
  const stop=()=>{verdict.pause();verdict.currentTime=0;for(const o of voices){try{o.stop();}catch(_){}}voices.clear();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});addEventListener('pagehide',stop);
})();
