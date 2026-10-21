// Local media elements work with file://; no fetch or server is required.
(() => {
  const tracks = ['open-market', 'closed-market'].map(name => {
    const audio = new Audio(`audio/${name}.mp3`);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    return { audio, pending: false, blocked: false };
  });
  let unlocked = false;
  let previousTime = performance.now();
  const originalStart = AudioManager.start;
  AudioManager.start = function () {
    originalStart.call(this);
    unlocked = true;
  };

  // Retry autoplay only on a real gesture, never repeatedly every frame.
  const retry = () => tracks.forEach(track => { track.blocked = false; });
  addEventListener('pointerdown', retry);
  addEventListener('keydown', retry);

  function update(now) {
    const elapsed = Math.min((now - previousTime) / 1000, .1);
    previousTime = now;
    const inMarket = ['market', 'closed', 'inspect', 'found'].includes(phase)||(phase==='achievements'&&achievementReturn!=='entry');
    const ending=phase==='finished';
    const endingProgress=Math.max(0,Math.min(1,(now-(state.endingStartedAt??now)-2800)/4000));
    const endingFade=endingProgress*endingProgress*(3-2*endingProgress);
    const selected = unlocked && (inMarket||ending) ? (ending?0:(open ? 0 : 1)) : -1;
    tracks.forEach((track, index) => {
      const audio = track.audio;
      const volume = index === 1 ? .07 : .04;
      const step = elapsed * volume * .875;
      const target = index === selected ? volume*(ending?endingFade:1) : 0;
      audio.volume += Math.max(-step, Math.min(step, target - audio.volume));
      if (target > 0 && audio.paused && !track.pending && !track.blocked) {
        track.pending = true;
        Promise.resolve(audio.play()).catch(() => {
          track.blocked = true;
        }).finally(() => { track.pending = false; });
      }
      if (target === 0 && audio.volume < .001 && !track.pending) {
        audio.volume = 0;
        if (!audio.paused) audio.pause();
        if (audio.currentTime) audio.currentTime = 0;
      }
    });
    requestAnimationFrame(update);
  }
  addEventListener('pagehide', () => tracks.forEach(({ audio }) => audio.pause()));
  requestAnimationFrame(update);
})();
