const Renderer = (() => {
  let canvas, ctx, W, H;
  let camX = 0, camY = 0, shake = 0;

  function init() {
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');
    resize();
    addEventListener('resize', resize);
  }

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  }

  function setShake(v) { shake = v; }

  function draw(time) {
    const p = Entities.player;
    camX += (p.x - W / 2 - camX) * 0.1;
    camY += (p.y - H / 2 - camY) * 0.1;

    const sx = shake > 0.3 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0.3 ? (Math.random() - 0.5) * shake : 0;
    if (shake > 0) shake *= 0.9;

    ctx.fillStyle = '#020210';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-camX + sx, -camY + sy);

    // Stars
    for (const s of Entities.stars) {
      const fl = 0.3 + Math.sin(time * s.sp + s.b * 100) * 0.3;
      ctx.fillStyle = `rgba(150,180,255,${fl * s.b})`;
      ctx.fillRect(s.x * 0.4, s.y * 0.4, s.s, s.s);
    }

    // Player light
    const lg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.light);
    lg.addColorStop(0, 'rgba(0,255,255,0.06)');
    lg.addColorStop(0.5, 'rgba(0,100,200,0.02)');
    lg.addColorStop(1, 'transparent');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.light, 0, Math.PI * 2);
    ctx.fill();

    // Pulses
    for (const pw of Entities.pulses) {
      ctx.strokeStyle = `rgba(0,255,255,${pw.a * 0.5})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(pw.x, pw.y, pw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Orbs
    for (const o of Entities.orbs) {
      if (o.vis < 0.03) continue;
      ctx.globalAlpha = o.vis;
      const bob = Math.sin(o.phase) * 3;
      const g = ctx.createRadialGradient(o.x, o.y + bob, 0, o.x, o.y + bob, o.r * 4);
      g.addColorStop(0, `hsla(${o.hue},90%,65%,0.4)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y + bob, o.r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsl(${o.hue},90%,75%)`;
      ctx.shadowColor = `hsl(${o.hue},90%,60%)`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(o.x, o.y + bob, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Enemies
    for (const e of Entities.enemies) {
      if (e.vis < 0.03) continue;
      ctx.globalAlpha = e.vis;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 1.5);
      g.addColorStop(0, 'rgba(80,0,40,0.8)');
      g.addColorStop(0.6, 'rgba(40,0,20,0.4)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#200010';
      ctx.shadowColor = '#f04';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (0.8 + Math.sin(e.phase * 2) * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f04';
      ctx.beginPath();
      ctx.arc(e.x - 4, e.y - 3, 2, 0, Math.PI * 2);
      ctx.arc(e.x + 4, e.y - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Particles
    for (const pt of Entities.particles) {
      ctx.globalAlpha = pt.life / pt.max;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (pt.life / pt.max), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Trail
    for (let i = 1; i < p.trail.length; i++) {
      const t = p.trail[i];
      if (t.a < 0.03) continue;
      ctx.strokeStyle = `rgba(0,255,255,${t.a * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    // Player
    if (p.invuln <= 0 || Math.floor(time / 3) % 2 === 0) {
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Fog of war
    const fg = ctx.createRadialGradient(W / 2 + sx, H / 2 + sy, p.light * 0.3, W / 2 + sx, H / 2 + sy, p.light * 1.5);
    fg.addColorStop(0, 'transparent');
    fg.addColorStop(0.7, 'rgba(0,0,10,0.5)');
    fg.addColorStop(1, 'rgba(0,0,10,0.92)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, W, H);
  }

  return { init, draw, setShake, get W() { return W; }, get H() { return H; } };
})();
