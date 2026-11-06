const Game = (() => {
  let running = false;
  let score = 0, orbs = 0, hp = 100;
  let time = 0, diff = 1;
  let touchTarget = null, lastTap = 0;
  let droneStop = null;
  const keys = {};

  function init() {
    Renderer.init();

    addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; e.preventDefault(); });
    addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

    const c = document.getElementById('c');
    c.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      touchTarget = { x: t.clientX + camX(), y: t.clientY + camY() };
      const now = Date.now();
      if (now - lastTap < 300) doPulse();
      lastTap = now;
    });
    c.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      touchTarget = { x: t.clientX + camX(), y: t.clientY + camY() };
    });
    c.addEventListener('touchend', () => { touchTarget = null; });
    c.addEventListener('mousedown', e => { touchTarget = { x: e.clientX + camX(), y: e.clientY + camY() }; });
    c.addEventListener('mousemove', e => { if (touchTarget) touchTarget = { x: e.clientX + camX(), y: e.clientY + camY() }; });
    c.addEventListener('mouseup', () => { touchTarget = null; });
    c.addEventListener('dblclick', doPulse);

    document.getElementById('btnStart').addEventListener('click', start);
    document.getElementById('btnRetry').addEventListener('click', start);
  }

  function camX() { return Entities.player.x - Renderer.W / 2; }
  function camY() { return Entities.player.y - Renderer.H / 2; }

  function doPulse() {
    const p = Entities.player;
    Entities.addPulse(p.x, p.y);
    Entities.emit(p.x, p.y, 15, '#0ff', 4);
    Audio.pulse();
  }

  function start() {
    Audio.init();
    if (droneStop) droneStop();
    droneStop = Audio.startDrone();

    score = 0; orbs = 0; hp = 100; time = 0; diff = 1;
    touchTarget = null;

    Entities.init();
    const p = Entities.player;
    for (let i = 0; i < 12; i++) Entities.spawnOrb(p.x, p.y);
    for (let i = 0; i < 4; i++) Entities.spawnEnemy(p.x, p.y, diff);

    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('deathScreen').classList.remove('active');
    document.getElementById('hud').style.display = 'flex';

    running = true;
    loop();
  }

  function loop() {
    if (!running) return;
    time++;
    diff = 1 + time / 2000;

    if (keys[' ']) { doPulse(); keys[' '] = false; }

    const result = Entities.update(time, diff, touchTarget, keys);

    if (result) {
      if (result.type === 'collect') {
        orbs++;
        score += 15;
        hp = Math.min(100, hp + 4);
        Audio.collect();
      }
      if (result.type === 'hit') {
        hp -= 20;
        Renderer.setShake(15);
        Audio.hit();
        if (hp <= 0) { hp = 0; die(); return; }
      }
    }

    score += Math.floor(Math.hypot(Entities.player.vx, Entities.player.vy));

    document.getElementById('hScore').textContent = score;
    document.getElementById('hOrbs').textContent = orbs;
    const fill = document.getElementById('hpFill');
    fill.style.width = hp + '%';
    fill.style.background = hp < 30 ? '#f24' : '#0f8';

    Renderer.draw(time);
    requestAnimationFrame(loop);
  }

  function die() {
    running = false;
    Audio.death();
    if (droneStop) droneStop();
    const p = Entities.player;
    Entities.emit(p.x, p.y, 60, '#f24', 5);
    Entities.emit(p.x, p.y, 40, '#ff8', 4);
    Renderer.setShake(25);

    let frames = 0;
    function deathAnim() {
      frames++;
      Entities.update(time, diff, null, {});
      Renderer.draw(time);
      if (frames < 50) requestAnimationFrame(deathAnim);
      else {
        document.getElementById('hud').style.display = 'none';
        document.getElementById('finalStats').textContent =
          `Score: ${score} | Orbs: ${orbs} | Time: ${Math.floor(time / 60)}s`;
        document.getElementById('deathScreen').classList.add('active');
      }
    }
    deathAnim();
  }

  init();
})();
