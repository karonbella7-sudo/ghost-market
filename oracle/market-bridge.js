'use strict';
// Only the copied, embedded oracle participates in the main experience.
const marketFaces=/^#market=([01]{3})$/.exec(location.hash)?.[1];
if(marketFaces&&window.parent!==window){
  chooseFaces=()=>({faces:[...marketFaces].map(Number),pity:false});
  const continueButton=$('again');
  continueButton.textContent='ENTER THE MARKET';
  let submitted=false;
  continueButton.addEventListener('click',event=>{
    event.preventDefault();event.stopImmediatePropagation();
    if(phase!=='result'||submitted)return;
    submitted=true;continueButton.disabled=true;window.oracleAudio?.quiet();
    window.parent.postMessage({type:'ghost-market:oracle-complete',faces:marketFaces},'*');
  },true);
}
