'use strict';
// User-recorded coin samples; embedded bytes work from file:// without fetch.
window.oracleAudio=(()=>{
 let context=null,master=null,room=null,noiseBuffer=null,keyboardTimer=null,lastShake=-Infinity,previous=null;
 const voices=new Set(),shakeVoices=new Set(),samples={};let loading=null;
 const BGM_VOLUME=.24;let bgm=null,resultTrack=null;
 const resultTracks={};
 for(const [key,bytes] of Object.entries(window.oracleResultFiles||{})){const track=new Audio('data:video/mp4;base64,'+bytes);track.preload='auto';track.loop=false;track.volume=.48;track.playbackRate=1;track.addEventListener('ended',()=>{if(resultTrack===track){resultTrack=null}});track.addEventListener('error',()=>{if(resultTrack===track)resultTrack=null;console.warn('Result audio could not load:',key)});resultTracks[key]=track}
 if(window.oracleAmbienceFiles?.bgm){bgm=new Audio('data:video/mp4;base64,'+window.oracleAmbienceFiles.bgm);bgm.loop=true;bgm.preload='auto';bgm.volume=BGM_VOLUME;bgm.addEventListener('error',()=>console.warn('Background track could not load'))}
 function startBgm(){if(!bgm||document.hidden)return;bgm.volume=BGM_VOLUME;if(bgm.paused)bgm.play().catch(()=>{})}
 function loadSamples(){if(loading||!context)return;loading=Promise.all(Object.entries({...window.oracleAudioFiles,bellRest:window.oracleAmbienceFiles?.bellRest,bellOpen:window.oracleAmbienceFiles?.bellOpen}).filter(([,bytes])=>bytes).map(async([key,base64])=>{try{const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const buffer=await context.decodeAudioData(bytes.buffer);let peak=0;const mono=buffer.getChannelData(0);for(let i=0;i<mono.length;i++)peak=Math.max(peak,Math.abs(mono[i]));const hop=Math.max(1,Math.floor(buffer.sampleRate*.01)),active=[];let onset=0,found=false;for(let i=0;i<mono.length;i+=hop){let local=0;for(let j=i;j<Math.min(i+hop,mono.length);j++)local=Math.max(local,Math.abs(mono[j]));if(local>peak*.12){if(!found){onset=Math.max(0,i/buffer.sampleRate-.004);found=true}active.push(Math.max(0,i/buffer.sampleRate-.004))}}samples[key]={buffer,onset,active,normalization:Math.min(3,.65/Math.max(.001,peak))}}catch(error){console.warn('Coin sample could not decode:',key,error)}}))}
 function sample(key,at,level,pan,duration,shaking=false,randomStart=false,rate=1,fade=.018,smoothTail=false){
  const clip=samples[key];if(!clip||!ready())return false;
  const source=context.createBufferSource(),gain=context.createGain(),position=context.createStereoPanner();source.buffer=clip.buffer;
  const offset=randomStart&&clip.active.length?clip.active[Math.floor(Math.random()*clip.active.length)]:clip.onset;
  const length=Math.min(duration,clip.buffer.duration-offset);if(length<=.008)return false;
  const playbackLength=length/rate,peak=level*clip.normalization;
  source.playbackRate.value=rate;position.pan.value=pan;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+.002);
  if(smoothTail){
   // Keep the recorded resonance audible; the room carries the final decay.
   const hold=Math.min(.12,playbackLength*.2);
   gain.gain.setValueAtTime(peak,at+hold);
   gain.gain.exponentialRampToValueAtTime(peak*.32,at+playbackLength-.06);
   gain.gain.linearRampToValueAtTime(0,at+playbackLength);
  }else{
   gain.gain.setValueAtTime(peak,at+Math.max(.003,playbackLength-fade));
   gain.gain.linearRampToValueAtTime(0,at+playbackLength);
  }
  source.connect(gain);gain.connect(position);position.connect(master);
  // The room retains a quiet tail after the single recorded strike ends.
  if(smoothTail)gain.connect(room);
  voices.add(source);if(shaking)shakeVoices.add(source);
  source.onended=()=>{voices.delete(source);shakeVoices.delete(source);source.disconnect();gain.disconnect();position.disconnect()};
  source.start(at,offset,length);return true;
 }
 function unlock(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!context){context=new Audio();master=context.createGain();master.gain.value=.48;const compressor=context.createDynamicsCompressor();compressor.threshold.value=-16;compressor.ratio.value=5;master.connect(compressor);compressor.connect(context.destination);
  room=context.createConvolver();const length=Math.floor(context.sampleRate*3.6),impulse=context.createBuffer(2,length,context.sampleRate);for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.85))*.16}room.buffer=impulse;const wet=context.createGain();wet.gain.value=.32;room.connect(wet);wet.connect(master);noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.16),context.sampleRate);const noise=noiseBuffer.getChannelData(0);for(let i=0;i<noise.length;i++)noise[i]=Math.random()*2-1}
  startBgm();loadSamples();if(context.state==='suspended')context.resume().catch(()=>{});
 }catch(_){context=null}}
 function ready(){return context&&context.state==='running'&&!document.hidden}
 function tone(frequency,at,duration,level,pan=0,reverb=false){if(!ready())return;const oscillator=context.createOscillator(),envelope=context.createGain(),position=context.createStereoPanner();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,at);envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(level,at+.003);envelope.gain.exponentialRampToValueAtTime(.00001,at+duration);position.pan.value=pan;oscillator.connect(envelope);envelope.connect(position);position.connect(master);if(reverb)envelope.connect(room);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();position.disconnect()};oscillator.start(at);oscillator.stop(at+duration+.025)}
 function contact(at,force,pan,inside=false){if(!ready())return;const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),position=context.createStereoPanner();source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=inside?1900:3400;filter.Q.value=.65;position.pan.value=pan;const duration=inside?.014:.022;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(force*(inside?.11:.21),at+.0007);gain.gain.exponentialRampToValueAtTime(.00001,at+duration);source.connect(filter);filter.connect(gain);gain.connect(position);position.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();position.disconnect()};source.start(at);source.stop(at+duration+.005)}
 function metallic(at,force,inside,pan){
  // A dry broadband contact followed by short, irregular disk resonances.
  // Avoid the long, pitched chime of the previous coin sound.
  contact(at,force,pan,inside);const detune=.94+Math.random()*.12;
  const modes=inside?[[1460,.045,.033],[2310,.035,.019],[3870,.024,.013]]:[[2870,.105,.049],[4620,.068,.031],[6190,.041,.017],[7930,.027,.009]];
  modes.forEach(([frequency,decay,level])=>tone(frequency*detune,at,decay,force*level,pan));
  if(!inside)tone(185+Math.random()*55,at,.028,force*.075,pan);
 }
 function shake(force=.5){if(!ready())return;const now=context.currentTime;if(now-lastShake<.13)return;lastShake=now;force=Math.max(.2,Math.min(1,force));const pan=(Math.random()-.5)*.4;if(!sample('shake',now,.22+force*.48,pan,.11+force*.06,true,true))metallic(now,force,true,pan)}
 function begin(x,y){unlock();lastShake=-Infinity;previous={x,y}}
 function move(x,y){if(!previous){previous={x,y};return}const distance=Math.hypot(x-previous.x,y-previous.y);previous={x,y};if(distance>2)shake(Math.min(1,distance/30))}
 function stopShake(){clearInterval(keyboardTimer);keyboardTimer=null;previous=null;for(const source of shakeVoices){try{source.stop()}catch(_){}}shakeVoices.clear()}
 function keyboard(){stopShake();shake(.45);keyboardTimer=setInterval(()=>shake(.35+Math.random()*.35),150)}
 function land(reduced){stopShake();if(!ready())return;const now=context.currentTime;[-.55,.55,.05].forEach((pan,i)=>{
  // Only the initial spill is audible; enlargement and settling stay silent.
  const release=now+(reduced?.012*i:.025+i*.12);
  if(!sample('single',release,.34,pan*.5,.12))metallic(release,.42,true,pan*.5);
 })}
 function stopResult(){if(resultTrack){resultTrack.pause();resultTrack.currentTime=0;resultTrack=null}}
 function bell(verdict='平'){stopResult();if(document.hidden)return;const track=resultTracks[verdict!=='平'?'open':'rest'];if(!track)return;resultTrack=track;track.currentTime=0;track.play().catch(error=>{if(resultTrack===track)resultTrack=null;console.warn('Result audio could not play:',error)})}
 function quiet(){stopShake();stopResult();if(bgm)bgm.pause();for(const voice of voices){try{voice.stop()}catch(_){}}if(context&&context.state==='running')context.suspend().catch(()=>{})}
 window.addEventListener('blur',stopShake);document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet()});window.addEventListener('pagehide',quiet);
 return{begin,move,keyboard,stopShake,land,bell,unlock,stopResult,quiet};
})();


