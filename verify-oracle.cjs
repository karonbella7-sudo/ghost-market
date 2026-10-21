const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('oracle/market-bridge.js','utf8');
const judgeLine=fs.readFileSync('oracle/oracle.js','utf8').split(/\r?\n/).find(line=>line.startsWith('function judge('));
const verdictContext={};vm.createContext(verdictContext);vm.runInContext(judgeLine,verdictContext);
for(let bits=0;bits<8;bits++){const faces=[bits&1,(bits>>1)&1,(bits>>2)&1],heads=faces.reduce((a,b)=>a+b,0);assert.equal(verdictContext.judge(faces),heads===3?'鸿运':heads===2?'吉':'平');}
for(const faces of ['000','100','110','111']){
 let listener,quiet=0,messages=[];
 const button={addEventListener:(name,fn,capture)=>{assert(capture);listener=fn;}};
 const parent={postMessage:data=>messages.push(data)};
 const ctx={location:{hash:'#market='+faces},window:{parent,oracleAudio:{quiet:()=>quiet++}},$:()=>button,phase:'idle',chooseFaces:()=>null};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 assert.equal(ctx.chooseFaces().faces.join(''),faces);
 const event={preventDefault(){},stopImmediatePropagation(){}};
 listener(event);assert.equal(messages.length,0);
 ctx.phase='result';listener(event);listener(event);
 assert.equal(messages.length,1);assert.equal(messages[0].faces,faces);assert.equal(quiet,1);
 assert.equal(button.textContent,'ENTER THE MARKET');assert(button.disabled);
}
const html=fs.readFileSync('oracle/index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync('oracle/'+match[1]),match[1]);
for(const file of ['oracle/oracle.js','oracle/oracle-audio.js','oracle/market-bridge.js','final.js'])new vm.Script(fs.readFileSync(file,'utf8'));
console.log('PASS: oracle assets, syntax, all outcome classes, result gating, duplicate prevention and audio cleanup.');
