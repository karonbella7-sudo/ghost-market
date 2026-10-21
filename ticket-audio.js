// Play the supplied paper recording directly on the ticket's user gesture.
(() => {
  const paper=new Audio('audio/ticket-paper.mp3');
  paper.preload='auto';paper.loop=false;paper.volume=.6;
  const originalPlay=AudioManager.play;
  AudioManager.play=function(name){
    if(name!=='ticketSelect')return originalPlay.call(this,name);
    if(document.hidden)return;
    paper.currentTime=0;
    Promise.resolve(paper.play()).catch(()=>{});
  };
  const stop=()=>{paper.pause();paper.currentTime=0;};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  addEventListener('pagehide',stop);
})();
