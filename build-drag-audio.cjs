// A short dry friction sound, distinct from the user's ticket-selection recording.
const fs=require('fs'),path=require('path');
const rate=44100,count=Math.floor(rate*.24),wav=Buffer.alloc(44+count*2);
wav.write('RIFF',0);wav.writeUInt32LE(36+count*2,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(count*2,40);
let seed=1763,low=0,soft=0;
for(let i=0;i<count;i++){
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;
 const white=seed/4294967296*2-1,t=i/rate,u=i/count;
 low+=.055*(white-low);soft+=.48*(white-low-soft);
 const envelope=Math.min(1,t/.012)*Math.pow(1-u,1.5)*(.65+.35*Math.sin(t*70)**2);
 wav.writeInt16LE(Math.round(soft*envelope*.75*32767),44+i*2);
}
fs.writeFileSync(path.join(__dirname,'audio/entry-drag.wav'),wav);
