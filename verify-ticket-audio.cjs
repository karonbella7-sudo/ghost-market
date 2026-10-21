const fs=require('fs'),vm=require('vm'),assert=require('assert');
const sounds=[],notes=[];let time=1;
class Audio{constructor(src){this.src=src;this.plays=0;sounds.push(this);}play(){this.plays++;return Promise.resolve();}pause(){}}
const parameter=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){}});
const audio={get currentTime(){return time;},destination:{},createOscillator(){const o={frequency:parameter(),connect(n){return n;},start(){notes.push(o);},stop(){},disconnect(){}};return o;},createGain(){return{gain:parameter(),connect(){},disconnect(){}};}};
const ctx={Audio,phase:'entry',performance:{now:()=>1000},document:{hidden:false,addEventListener(){}},addEventListener(){},requestAnimationFrame(){},AudioManager:{ctx:null,last:{},start(){this.ctx=audio;},play(){}}};
vm.createContext(ctx);
for(const file of ['market-audio.js','ticket-audio.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
ctx.AudioManager.play('objectRustle');assert.equal(notes.length,1);assert.equal(notes[0].type,'triangle');
ctx.AudioManager.play('objectRustle');assert.equal(notes.length,1);
time+=.2;ctx.phase='inspect';ctx.AudioManager.play('objectRustle');assert.equal(notes.length,2);assert.equal(notes[1].type,'triangle');
assert(!sounds.some(s=>s.src.includes('entry-drag')));
ctx.phase='ticket';ctx.AudioManager.play('ticketSelect');assert.equal(sounds.find(s=>s.src.includes('ticket-paper')).plays,1);
const assets={LOCAL_ASSETS:{}};vm.createContext(assets);vm.runInContext(fs.readFileSync('stall-assets.js','utf8'),assets);
for(const [file,data] of Object.entries(assets.LOCAL_ASSETS))assert(Buffer.from(data.split(',')[1],'base64').equals(fs.readFileSync(file)));
console.log('PASS: shared original drag sound; first-gesture unlock; repeat guard; independent ticket recording; offline assets.');
