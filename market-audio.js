// Street mix and shared original drag sound. Oracle audio remains separate.
(() => {
  const step=new Audio('audio/footstep.mp3');
  step.preload='auto';step.volume=.65;step.playbackRate=.9;
  step.preservesPitch=true;
  let pending=false,lastStep=-Infinity;
  const originalPlay=AudioManager.play;
  const inStreet=()=>['market','closed','inspect','found','achievements'].includes(phase);
  const sounds={objectRustle:[180,.035,.08],ghostReveal:[52,.025,.32],strokeAcquire:[420,.04,.12],exchange:[230,.035,.17],objectAcquire:[140,.04,.15],foundAcquire:[540,.04,.2],paperOpen:[240,.025,.14],paperClose:[170,.02,.12],paperFlip:[310,.025,.1],textTouch:[360,.025,.14]};
  const acquisitionNotes={strokeAcquire:[420,630,840],objectAcquire:[220,330],foundAcquire:[540,720,1080]};
  const collectionVolume=1.5;
  const collectionInteractions=new Set(['paperOpen','paperClose','paperFlip','textTouch','exchange']);
  AudioManager.play=function(name){
    const entryDrag=name==='objectRustle'&&phase==='entry';
    if(!inStreet()&&!entryDrag)return originalPlay.call(this,name);
    if(document.hidden)return;
    if(name==='objectRustle')this.start();
    if(name==='footstep'){
      const now=performance.now();
      if(!moving()||Math.abs(velocity)<.05||pending||!step.paused||now-lastStep<580)return;
      lastStep=now;step.currentTime=0;pending=true;
      Promise.resolve(step.play()).catch(()=>{}).finally(()=>{pending=false;});
      return;
    }
    const spec=sounds[name],ctx=this.ctx;
    if(!spec||!ctx)return originalPlay.call(this,name);
    const now=ctx.currentTime;
    if(now-(this.last[name]??-Infinity)<.12)return;
    this.last[name]=now;
    // A distinct short confirmation phrase, replacing (not layering over) the old beep.
    if(acquisitionNotes[name]){
      acquisitionNotes[name].forEach((frequency,i)=>{
        const at=now+i*.085,o=ctx.createOscillator(),g=ctx.createGain();
        o.type='sine';o.frequency.setValueAtTime(frequency,at);
        g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.065*collectionVolume/(1+i*.25),at+.012);
        g.gain.exponentialRampToValueAtTime(.0001,at+.27);
        o.connect(g).connect(ctx.destination);o.onended=()=>{o.disconnect();g.disconnect();};
        o.start(at);o.stop(at+.3);
      });
      return;
    }
    const [frequency,level,duration]=spec,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=name==='ghostReveal'?'sine':'triangle';
    o.frequency.setValueAtTime(frequency,now);
    o.frequency.exponentialRampToValueAtTime(Math.max(30,frequency*.62),now+duration);
    g.gain.setValueAtTime(.0001,now);
    g.gain.exponentialRampToValueAtTime(level*(name==='objectRustle'?3.75:1.8)*(collectionInteractions.has(name)?collectionVolume:1),now+.015);
    g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    o.connect(g).connect(ctx.destination);o.onended=()=>{o.disconnect();g.disconnect();};
    o.start(now);o.stop(now+duration+.03);
  };
  const quiet=()=>{step.pause();step.currentTime=0;};
  function update(){
    if(document.hidden||!['market','closed'].includes(phase))quiet();
    requestAnimationFrame(update);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet();});
  addEventListener('pagehide',quiet);requestAnimationFrame(update);
})();
