// Tiny Crisis teaser: three things only. A sealed 360 box with her name in focus,
// the pile vs the one box, and a gift to unwrap that ends at the list.
(() => {
  // Paste the MailerLite share link here once the form is published. The button then says "Join the list".
  const WAITLIST_URL = 'https://preview.mailerlite.io/forms/2746003/202495852712822661/share';

  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const track = (ev, p, once) => window.tcTrack && window.tcTrack(ev, p, once);
  track('page_view', {page: 'home'}, true);

  const joinBtn = $('joinBtn');
  joinBtn.addEventListener('click', () => track('join_click', {}, false));
  if (WAITLIST_URL) { joinBtn.href = WAITLIST_URL; joinBtn.textContent = 'Join the list'; }

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

  // ---------- 3. unwrap it: ribbon, paper, a second gift, its ribbon, then the sealed envelope ----------
  const gift = $('gift'), msg = $('unwrapMsg');
  const steps = ['Now the paper.', 'Oh. Another one.', 'Ribbon again. Of course.', 'A sealed envelope. Tap it.', 'Be first to see inside:'];
  let s = 0;
  gift.addEventListener('click', () => {
    if (s >= steps.length) { joinBtn.scrollIntoView({behavior: 'smooth', block: 'center'}); return; }
    s++; gift.classList.add('s' + s); msg.textContent = steps[s - 1];
    track('gift_step', {step: s}, false);
    if (s === steps.length) {                                  // envelope opened: the card rises, the button wakes up
      track('envelope_opened', {}, true);
      joinBtn.classList.remove('nudge'); void joinBtn.offsetWidth; joinBtn.classList.add('nudge');
    }
  });
})();
