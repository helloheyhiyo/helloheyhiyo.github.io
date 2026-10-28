// Tiny Crisis teaser: three things only. A sealed 360 box with her name in focus,
// the pile vs the one box, and a rattle to drop through a peg board that ends at the list.
(() => {
  // MailerLite "Tiny Crisis waitlist" form (group: Founding 50 waitlist). The email is sent from this page, no new tab (28 Oct).
  // If the send fails for any reason, the visitor goes to the hosted form instead, so nobody is lost.
  const ML_SUBSCRIBE = 'https://assets.mailerlite.com/jsonp/2746003/forms/202495852712822661/subscribe';
  const WAITLIST_URL = 'https://preview.mailerlite.io/forms/2746003/202495852712822661/share';

  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const track = (ev, p, once) => window.tcTrack && window.tcTrack(ev, p, once);
  track('page_view', {page: 'home'}, true);

  const joinBtn = $('joinBtn'), joinForm = $('joinForm'), joinEmail = $('joinEmail'), joinErr = $('joinErr');
  joinEmail.addEventListener('focus', () => track('email_focus', {}, true));
  joinForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = joinEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      joinErr.textContent = 'That email looks off. Try again?'; joinEmail.focus(); return;
    }
    joinErr.textContent = ''; joinBtn.disabled = true; joinBtn.textContent = 'Opening the file…';
    track('join_click', {}, false);
    const body = new FormData();
    body.append('fields[email]', email); body.append('ml-submit', '1'); body.append('anticsrf', 'true');
    let ok = false;
    try {
      const r = await fetch(ML_SUBSCRIBE, {method: 'POST', body});
      const j = await r.json().catch(() => ({}));
      ok = r.ok && j.success !== false;
    } catch (err) {
      // the browser blocked reading the reply: send it blind, it still lands in MailerLite
      try { await fetch(ML_SUBSCRIBE, {method: 'POST', body, mode: 'no-cors'}); ok = true; } catch (err2) { ok = false; }
    }
    if (ok) { location.href = 'joined.html'; return; }
    track('join_fallback', {}, true);
    location.href = WAITLIST_URL;
  });

  // ---------- 1. sealed 360: drag with momentum, a tap refuses to open ----------
  const box = $('box'), scene = $('scene');
  let rx = -12, ry = -30, tx = rx, ty = ry, vy = 0, lastT = 0;
  let auto = !reduce, dragging = false, lastX = 0, lastY = 0, moved = 0;
  const clampX = v => Math.max(-50, Math.min(20, v));

  function frame(t) {
    const dt = Math.min(48, t - (lastT || t)); lastT = t;
    if (!dragging) {
      if (Math.abs(vy) > 0.01) { ty += vy * dt / 16; vy *= Math.pow(0.94, dt / 16); }
      else if (auto && !document.hidden) ty += 0.014 * dt;
    }
    rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
    box.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  scene.addEventListener('pointerdown', e => {
    dragging = true; vy = 0; moved = 0; lastX = e.clientX; lastY = e.clientY;
    scene.classList.add('dragging'); scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) track('box_spun', {}, true);
    ty += dx * 0.5; tx = clampX(tx - dy * 0.3);
    vy = vy * 0.6 + dx * 0.2;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false; scene.classList.remove('dragging');
    if (moved < 6) { box.classList.remove('nope'); void box.offsetWidth; box.classList.add('nope'); }
  };
  scene.addEventListener('pointerup', release);
  scene.addEventListener('pointercancel', release);

  // only their name is in focus
  const nameIn = $('nameIn'), nameOut = $('nameOut');
  nameOut.classList.add('empty');
  nameIn.addEventListener('input', () => {
    const v = nameIn.value.trim();
    if (v) track('name_typed', {}, true);                                                                    // never sends the name itself
    nameOut.textContent = v || 'Their name';
    nameOut.classList.toggle('empty', !v);
    if (v) nameOut.style.setProperty('--ns', v.length > 6 ? (0.055 * 6 / v.length).toFixed(3) : '.055');   // long names shrink to fit
    else nameOut.style.removeProperty('--ns');                                                              // back to the small placeholder size
  });

  // ---------- 3. drop the rattle: a little peg board, four real list perks (28 Oct) ----------
  // Fair physics, no rigging: every slot is something every list member gets anyway, and the page says so.
  const PRIZES = [
    {name: 'First pick', long: 'First pick of the first 50'},
    {name: 'First look', long: 'First look at the samples'},
    {name: 'Your vote', long: 'A vote on the next box'},
    {name: 'Backstage', long: 'A look backstage at how a box is made'}
  ];
  const cv = $('board'), ctx = cv.getContext('2d'), slotsEl = $('slots'), dropBtn = $('dropBtn'), dropMsg = $('dropMsg');
  const W = 320, H = 312, R = 10, PR = 4.5, FLOOR = H - 6, DIV_TOP = H - 62, LEFT = 6, RIGHT = W - 6, SW = (RIGHT - LEFT) / 4;
  const C = {paper: '#F3E6C8', ink: '#2A1A0E', gold: '#E8B84A', red: '#A51F2F', redDk: '#7F1A1E', soft: 'rgba(42,26,14,.18)'};
  const pegs = [];
  for (let r = 0; r < 6; r++) {                                  // 2, 3, 4, 5, 6, 7 pegs: a pyramid like a real board
    const n = r + 2, gap = 40, y = 46 + r * 35;   // every gap (peg to peg, peg to wall) is wider than the rattle, so it can never wedge
    for (let i = 0; i < n; i++) pegs.push({x: W / 2 + (i - (n - 1) / 2) * gap, y, hit: 0});
  }
  const divs = [0, 1, 2, 3, 4].map(i => LEFT + i * SW);
  let ball = null, raf = 0, last = 0, audio = null, drops = 0, prize = null;

  function fit() {                                                // sharp on every phone
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function tick() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 900 + Math.random() * 500; o.type = 'triangle';
      g.gain.setValueAtTime(0.035, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.08);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.09);
    } catch (e) { /* sound is a bonus */ }
  }
  function rattle(x, y, a) {                                      // a baby rattle: red ball with a gold band, gold handle
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.roundRect(-2.6, R - 2, 5.2, 13, 2.6); ctx.fill();
    ctx.beginPath(); ctx.arc(0, R + 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R - 3.5, -0.4, Math.PI + 0.4, true); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-3.5, -3.5, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pegs) {
      const glow = p.hit > 0;
      ctx.fillStyle = glow ? C.gold : C.ink;
      ctx.beginPath(); ctx.arc(p.x, p.y, glow ? PR + 1.5 : PR, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = C.soft; ctx.lineWidth = 2;
    for (const x of divs) { ctx.beginPath(); ctx.moveTo(x, DIV_TOP); ctx.lineTo(x, H); ctx.stroke(); }
    if (ball) rattle(ball.x, ball.y, ball.a);
    else rattle(W / 2, 12, 0.25);                                 // waiting at the top
  }
  function land(i) {
    prize = PRIZES[i];
    [...slotsEl.children].forEach((li, k) => li.classList.toggle('win', k === i));
    try { sessionStorage.setItem('tcPrize', prize.long); } catch (e) {}
    track('game_landed', {slot: prize.name}, false);
    dropMsg.textContent = `It landed on ${prize.name}. Join and it's yours (the other three come with it):`;
    joinBtn.textContent = 'Claim my prize';
    joinBtn.classList.remove('nudge'); void joinBtn.offsetWidth; joinBtn.classList.add('nudge');
    if (navigator.vibrate) navigator.vibrate(25);
    dropBtn.disabled = false; dropBtn.textContent = 'Drop again';
    cv.dataset.landed = prize.name; cv.dataset.t = ball.t.toFixed(2);   // for the QC script
  }
  function step(dt) {
    const b = ball; b.vy += 1150 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.vx * dt / R;
    for (const p of pegs) {
      const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), m = R + PR;
      if (d < m && d > 0) {
        const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
        b.x = p.x + nx * m; b.y = p.y + ny * m;
        if (vn < 0) {
          b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny;             // bounce, losing some energy
          b.vx += (Math.random() - 0.5) * 60;                        // no rattle balances on a peg
          if (p.hit <= 0) tick(); p.hit = 0.16;
        }
      }
    }
    if (b.x < LEFT + R) { b.x = LEFT + R; b.vx = Math.abs(b.vx) * 0.5; }
    if (b.x > RIGHT - R) { b.x = RIGHT - R; b.vx = -Math.abs(b.vx) * 0.5; }
    if (b.y + R > DIV_TOP) for (const x of divs) {                // slot walls
      if (Math.abs(b.x - x) < R) { b.x = x + (b.x < x ? -R : R); b.vx = -b.vx * 0.4; }
    }
    if (b.y + R >= FLOOR) { b.y = FLOOR - R; b.vy = -b.vy * 0.3; b.vx *= 0.7; if (Math.abs(b.vy) < 40) b.vy = 0; }
    for (const p of pegs) if (p.hit > 0) p.hit -= dt;
    b.t += dt;
    if (b.y + R < FLOOR - 2 && Math.hypot(b.vx, b.vy) < 15) { b.still = (b.still || 0) + dt; if (b.still > 0.25) { b.vx += (b.x < W / 2 ? 1 : -1) * 90; b.vy -= 60; b.still = 0; } }   // resting on a peg: nudge it on
    else b.still = 0;
    return (b.y + R >= FLOOR - 0.5 && Math.abs(b.vy) < 1 && Math.abs(b.vx) < 25) || b.t > 8;
  }
  function slotOf(x) { return Math.max(0, Math.min(3, Math.floor((x - LEFT) / SW))); }
  function drop(fromX) {
    if (ball && !ball.done) return;
    drops++; track('game_drop', {n: drops}, false); if (drops === 1) track('game_first_drop', {}, true);
    [...slotsEl.children].forEach(li => li.classList.remove('win'));
    dropBtn.disabled = true; dropMsg.textContent = 'Rattling…';
    const x = fromX == null ? W / 2 + (Math.random() - 0.5) * 44 : Math.max(W / 2 - 75, Math.min(W / 2 + 75, fromX)) + (Math.random() - 0.5) * 8;   // a wide drop so all four slots get their share
    ball = {x, y: 12, vx: (Math.random() - 0.5) * 50, vy: 0, a: 0, t: 0, done: false};
    if (reduce) {                                                 // no animation: work out where it lands, then show it
      while (!step(1 / 120));
      ball.done = true; draw(); land(slotOf(ball.x)); return;
    }
    last = 0; cancelAnimationFrame(raf);
    const loop = t => {
      const dt = Math.min(0.033, (t - (last || t)) / 1000); last = t;
      let done = false;
      for (let k = 0; k < 4 && !done; k++) done = step(dt / 4);
      draw();
      if (done) { ball.done = true; land(slotOf(ball.x)); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(); drop((e.clientX - r.left) * W / r.width);
  });
  dropBtn.addEventListener('click', () => drop());
  window.addEventListener('resize', fit); fit();
})();
