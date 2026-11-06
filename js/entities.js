const Entities = (() => {
  let player, stars, orbs, enemies, particles, pulses;

  function init() {
    player = {
      x: 0, y: 0, vx: 0, vy: 0,
      r: 10, light: 150, invuln: 0, trail: []
    };
    stars = [];
    orbs = [];
    enemies = [];
    particles = [];
    pulses = [];

    for (let i = 0; i < 500; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 6000,
        y: (Math.random() - 0.5) * 6000,
        s: Math.random() * 2 + 0.5,
        b: Math.random(),
        sp: Math.random() * 0.03 + 0.01
      });
    }
  }

  function spawnOrb(px, py) {
    const a = Math.random() * Math.PI * 2;
    const d = 200 + Math.random() * 500;
    orbs.push({
      x: px + Math.cos(a) * d,
      y: py + Math.sin(a) * d,
      r: 5 + Math.random() * 3,
      hue: 160 + Math.random() * 60,
      phase: Math.random() * 6.28,
      vis: 0
    });
  }

  function spawnEnemy(px, py, diff) {
    const a = Math.random() * Math.PI * 2;
    const d = 400 + Math.random() * 400;
    enemies.push({
      x: px + Math.cos(a) * d,
      y: py + Math.sin(a) * d,
      speed: 0.6 + Math.random() * 1.2 * diff,
      r: 12 + Math.random() * 15,
      phase: Math.random() * 6.28,
      wobble: 1 + Math.random() * 2,
      vis: 0
    });
  }

  function emit(x, y, count, color, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30 + Math.random() * 30,
        max: 60, color,
        size: 1 + Math.random() * 3
      });
    }
  }

  function addPulse(x, y) {
    pulses.push({ x, y, r: 0, max: 500, a: 1 });
  }

  function update(time, diff, touchTarget, keys) {
    const p = player;
    let ax = 0, ay = 0;

    if (keys['w'] || keys['arrowup']) ay = -1;
    if (keys['s'] || keys['arrowdown']) ay = 1;
    if (keys['a'] || keys['arrowleft']) ax = -1;
    if (keys['d'] || keys['arrowright']) ax = 1;

    if (touchTarget) {
      const dx = touchTarget.x - p.x;
      const dy = touchTarget.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) { ax = dx / dist; ay = dy / dist; }
    }

    p.vx += ax * 0.25;
    p.vy += ay * 0.25;
    p.vx *= 0.93;
    p.vy *= 0.93;
    p.x += p.vx;
    p.y += p.vy;
    if (p.invuln > 0) p.invuln--;

    p.trail.push({ x: p.x, y: p.y, a: 1 });
    if (p.trail.length > 40) p.trail.shift();
    p.trail.forEach(t => t.a *= 0.93);

    // Orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.phase += 0.04;
      const dist = Math.hypot(o.x - p.x, o.y - p.y);
      o.vis = Math.max(o.vis * 0.99, dist < p.light ? 1 - dist / p.light : 0);
      if (dist < p.r + o.r + 8) {
        emit(o.x, o.y, 10, `hsl(${o.hue},90%,60%)`, 2);
        orbs.splice(i, 1);
        spawnOrb(p.x, p.y);
        return { type: 'collect' };
      }
      if (dist > 1000) { orbs.splice(i, 1); spawnOrb(p.x, p.y); }
    }

    // Pulse reveal
    for (const pw of pulses) {
      for (const o of orbs)
        if (Math.abs(Math.hypot(o.x - pw.x, o.y - pw.y) - pw.r) < 30) o.vis = 1;
      for (const e of enemies)
        if (Math.abs(Math.hypot(e.x - pw.x, e.y - pw.y) - pw.r) < 30) e.vis = 1;
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.phase += 0.05;
      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist, ny = dy / dist;
      const wx = -ny * Math.sin(e.phase * e.wobble) * 0.5;
      const wy = nx * Math.sin(e.phase * e.wobble) * 0.5;
      e.x += (nx + wx) * e.speed;
      e.y += (ny + wy) * e.speed;
      e.vis = Math.max(e.vis * 0.995, dist < p.light * 0.7 ? 0.8 : 0);

      if (dist < p.r + e.r && p.invuln <= 0) {
        p.invuln = 40;
        const ka = Math.atan2(p.y - e.y, p.x - e.x);
        p.vx += Math.cos(ka) * 6;
        p.vy += Math.sin(ka) * 6;
        emit(p.x, p.y, 20, '#f24', 3);
        return { type: 'hit' };
      }
      if (dist > 1200) { enemies.splice(i, 1); spawnEnemy(p.x, p.y, diff); }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx; pt.y += pt.vy;
      pt.vx *= 0.97; pt.vy *= 0.97;
      pt.life--;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].r += 7;
      pulses[i].a = 1 - pulses[i].r / pulses[i].max;
      if (pulses[i].r >= pulses[i].max) pulses.splice(i, 1);
    }

    while (orbs.length < 12) spawnOrb(p.x, p.y);
    while (enemies.length < 3 + Math.floor(diff * 2)) spawnEnemy(p.x, p.y, diff);

    return null;
  }

  return {
    init, spawnOrb, spawnEnemy, emit, addPulse, update,
    get player() { return player; },
    get stars() { return stars; },
    get orbs() { return orbs; },
    get enemies() { return enemies; },
    get particles() { return particles; },
    get pulses() { return pulses; }
  };
})();
