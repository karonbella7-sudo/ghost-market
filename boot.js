(async()=>{
 const screen=document.getElementById('loading-screen'),bar=document.getElementById('loading-progress'),label=document.getElementById('loading-label');
 const scripts=JSON.parse(document.getElementById('boot-scripts').textContent);
 let done=0;bar.max=scripts.length+1;
 try{
  for(const src of scripts){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src));document.body.append(s)});bar.value=++done;label.textContent=`LOADING EXPERIENCE · ${Math.round(done/bar.max*100)}%`;}
  label.textContent='PREPARING THE TICKET PAGE';
  await Promise.all([...document.querySelectorAll('#entry img')].map(img=>img.decode()));
  bar.value=bar.max;label.textContent='READY · ENTER THE GHOST MARKET';
  const button=document.createElement('button');button.textContent='ENTER';button.onclick=()=>{AudioManager.start();screen.remove()};screen.append(button);
 }catch(error){label.textContent='LOADING FAILED · PLEASE RELOAD';const button=document.createElement('button');button.textContent='RETRY';button.onclick=()=>location.reload();screen.append(button);console.error(error);}
})();
