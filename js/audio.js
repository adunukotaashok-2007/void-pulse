const Audio = (() => {
  let ctx = null;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, type, vol, delay) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, filterFreq) {
    if (!ctx) return;
    const len = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq || 400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  return {
    init,
    collect() {
      tone(880, 0.15, 'sine', 0.07);
      tone(1100, 0.15, 'sine', 0.05, 0.06);
      tone(1320, 0.2, 'sine', 0.04, 0.12);
    },
    hit() {
      tone(80, 0.3, 'sawtooth', 0.12);
      noise(0.2, 0.15, 500);
    },
    pulse() {
      tone(1500, 0.8, 'sine', 0.08);
      tone(200, 0.6, 'triangle', 0.06);
    },
    death() {
      tone(300, 1.5, 'sawtooth', 0.1);
      tone(100, 2, 'square', 0.06);
      noise(0.5, 0.2, 300);
      tone(50, 1.5, 'sawtooth', 0.08, 0.3);
    },
    startDrone() {
      if (!ctx) return;
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o1.type = 'sine'; o1.frequency.value = 55;
      o2.type = 'sine'; o2.frequency.value = 55.3;
      f.type = 'lowpass'; f.frequency.value = 120;
      g.gain.value = 0.025;
      o1.connect(f); o2.connect(f);
      f.connect(g); g.connect(ctx.destination);
      o1.start(); o2.start();
      return () => { try { o1.stop(); o2.stop(); } catch(e){} };
    }
  };
})();
