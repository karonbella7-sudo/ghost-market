// Historical collection is independent of spendable inventory.
state.achievements=[];
const collectionCatalog=[...new Set([...DATA.strokes,...DATA.texts,...DATA.stalls.flatMap(c=>c.products)])];
function recordAchievement(src,source){
  if(!collectionCatalog.includes(src))return;
  let item=state.achievements.find(item=>item.src===src);
  if(!item){item={src,kind:DATA.strokes.includes(src)?'STROKE':DATA.texts.includes(src)?'TEXT':'OBJECT',sources:[]};state.achievements.push(item);}
  if(!item.sources.includes(source))item.sources.push(source);
  refreshAchievements();
}
function getCompositionAssets(){return [...new Set([...state.discoveredStrokeTypes,...state.achievements.filter(item=>item.kind==='TEXT'||item.kind==='STROKE').map(item=>item.src)])];}
const achievementButton=document.createElement('button');achievementButton.id='achievements-open';achievementButton.textContent='ACHIEVEMENTS';
const achievementPanel=document.createElement('section');achievementPanel.id='achievements-panel';achievementPanel.hidden=true;achievementPanel.setAttribute('aria-label','Collection achievements');
const achievementClose=document.createElement('button');achievementClose.textContent='BACK';achievementClose.id='achievements-close';
const achievementTitle=document.createElement('h2');achievementTitle.textContent='TRACES OF YOUR VISITS';
const achievementProgress=document.createElement('p'),achievementMeter=document.createElement('progress');
achievementMeter.setAttribute('aria-label','Unique collection progress');
const achievementGrid=document.createElement('div');achievementGrid.id='achievement-grid';
achievementPanel.append(achievementClose,achievementTitle,achievementProgress,achievementMeter,achievementGrid);
document.body.append(achievementButton,achievementPanel);
let achievementReturn='entry';
function refreshAchievements(){
  achievementProgress.textContent=state.achievements.length+' / '+collectionCatalog.length+' UNIQUE FINDS · STROKES '+state.discoveredStrokeTypes.length+' / '+strokeTypes.length;
  achievementMeter.max=collectionCatalog.length;achievementMeter.value=state.achievements.length;
  achievementGrid.replaceChildren();
  for(const item of state.achievements){
    const card=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
    img.src=item.src;img.alt=item.kind;caption.textContent=item.kind+' · '+item.sources.join(' / ');card.append(img,caption);achievementGrid.append(card);
  }
  if(!state.achievements.length){const empty=document.createElement('p');empty.textContent='YOUR FINDS WILL APPEAR HERE.';achievementGrid.append(empty);}
}
achievementButton.addEventListener('click',()=>{
  if(!['entry','market','closed','inspect','found'].includes(phase)||controls.busy||controls.modal)return;
  achievementReturn=phase;phase='achievements';controls.keys.clear();velocity=0;lastPointer=null;
  refreshAchievements();achievementPanel.hidden=false;AudioManager.play('paperOpen');achievementClose.focus();
});
function closeAchievements(){if(phase!=='achievements')return;achievementPanel.hidden=true;phase=achievementReturn;lastPointer=null;AudioManager.play('paperClose');achievementButton.focus();}
achievementClose.addEventListener('click',closeAchievements);
addEventListener('keydown',e=>{if(e.code==='Escape'&&phase==='achievements'){e.stopImmediatePropagation();closeAchievements();}},true);
const collectionAward=awardStroke;
awardStroke=function(){const result=collectionAward();if(result)recordAchievement(state.collectedStrokes[state.collectedStrokes.length-1],'VENDOR');return result;};
const collectionAcquired=showAcquired;
showAcquired=function(src,label,preview=false){if(label==='OBJECT'&&!preview)recordAchievement(src,inHidden?'HIDDEN MARKET':'TRADE');collectionAcquired(src,label);};
const collectionRecollect=recollectTrace;
recollectTrace=function(src){collectionRecollect(src);if(DATA.texts.includes(src))recordAchievement(src,'LANGUAGE');};
const collectionAnimate=animate;
animate=function(t){
  achievementButton.hidden=!['entry','market','closed','inspect','found'].includes(phase);
  if(phase==='finished')updateShamianStreet(.016,t);
  collectionAnimate(t);
};
refreshAchievements();
