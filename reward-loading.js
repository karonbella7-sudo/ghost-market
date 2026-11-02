// Decode a fresh element before revealing it; never reuse the previous reward's pixels.
let rewardRequest=0,foundRequest=0;
async function decodedReward(src){
  const img=new Image();img.alt='';
  img.src=typeof LOCAL_ASSETS!=='undefined'&&LOCAL_ASSETS[src]?LOCAL_ASSETS[src]:src;
  await img.decode();return img;
}
showAcquired=async function(src,label){
  const request=++rewardRequest;
  clearTimeout(acquiredTimer);acquired.classList.remove('show');
  controls.busy=true;velocity=0;controls.keys.clear();
  try{
    const img=await decodedReward(src);
    if(request!==rewardRequest)return;
    acquired.querySelector('img').replaceWith(img);
    acquired.querySelector('span').textContent=label==='STROKE'?'STROKE ACQUIRED':'OBJECT ACQUIRED';
    requestAnimationFrame(()=>{
      if(request!==rewardRequest)return;
      acquired.classList.add('show');
      acquiredTimer=setTimeout(()=>{acquired.classList.remove('show');controls.busy=false;inventorySignature='';updateInventory()},1600);
    });
  }catch(error){if(request===rewardRequest){controls.busy=false;msg('IMAGE COULD NOT LOAD');}}
};
async function revealFound(src){
  const request=++foundRequest,toast=$('#found-toast');
  clearTimeout(foundTimer);toast.classList.remove('show');
  try{const img=await decodedReward(src);if(request!==foundRequest)return;
    toast.querySelector('img').replaceWith(img);toast.classList.add('show');
    foundTimer=setTimeout(()=>toast.classList.remove('show'),1900);
  }catch(error){if(request===foundRequest)msg('FOUND. IMAGE COULD NOT LOAD');}
}
