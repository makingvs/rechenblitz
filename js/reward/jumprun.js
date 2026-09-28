// Jump & Run mitten in der Einheit: Der eigene Avatar läuft, springt über Hindernisse
// und springt in die Blase mit der richtigen Lösung. Jede richtige Lösung = mehr Spielzeit.
// Bewusst ohne Sprachausgabe.
import { app, go, onLeave } from '../state.js';
import { parseFact } from '../tasks/facts.js';
import { pickFact } from '../adaptive.js';
import { poolOf } from '../strategies/index.js';
import { avatarImage, defaultLook } from '../avatar.js';
import { sounds, shuffle, esc } from '../util.js';

export const JR = { startSec: 60, bonusSec: 10, maxSec: 180, stumbleSec: 3 };
const OBSTACLES = ['🪨', '🌵', '🍄', '🪵'];

/**
 * Spielt ein Jump & Run in el. onDone({correct, wrong, coins}) nach dem Ende.
 * Gibt eine Aufräumfunktion zurück.
 */
export function runJumpRun(el, { pool, progress, look, onDone }) {
  const tasksPool = pool.filter(id => !id.startsWith('qty:'));
  el.innerHTML = `
    <div class="jr">
      <canvas class="jr-canvas"></canvas>
      <div class="jr-hud">
        <div class="jr-pill jr-time">⏱ <span>60</span> s</div>
        <div class="jr-task" hidden></div>
        <div class="jr-pill jr-score">✅ <span class="jr-ok">0</span> · ⭐ <span class="jr-coins">0</span></div>
      </div>
      <div class="jr-float"></div>
      <div class="jr-overlay">
        <div class="card intro-card">
          <div class="intro-icon">🏃</div>
          <h2>Jump & Run</h2>
          <p>Tippe, um zu springen – zweimal tippen für einen Doppelsprung.<br>
          Spring in die <b>Blase mit der richtigen Lösung</b>! Jede richtige Lösung schenkt dir <b>${JR.bonusSec} Sekunden</b> mehr Spielzeit.</p>
          <button class="btn btn-big btn-go" type="button">Los!</button>
        </div>
      </div>
    </div>`;
  const wrap = el.querySelector('.jr');
  const canvas = el.querySelector('.jr-canvas');
  const ctx = canvas.getContext('2d');
  const hud = {
    time: el.querySelector('.jr-time span'), task: el.querySelector('.jr-task'),
    ok: el.querySelector('.jr-ok'), coins: el.querySelector('.jr-coins'), float: el.querySelector('.jr-float'),
  };
  const overlay = el.querySelector('.jr-overlay');
  const img = avatarImage(look || defaultLook());

  let W = 0, H = 0, dpr = 1, groundY = 0, unit = 1;
  function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.82;
    unit = H / 800;
  }
  resize();
  window.addEventListener('resize', resize);

  // Spielzustand
  const st = {
    running: false, over: false, t: 0, last: 0, timeLeft: JR.startSec, played: 0,
    correct: 0, wrong: 0, coins: 0, dist: 0,
    player: { y: 0, vy: 0, jumps: 0, inv: 0 },
    items: [], particles: [], gate: null, nextGate: 2.5, nextObstacle: 4, nextCoins: 1.5, recent: [],
  };
  const G = () => 2600 * unit;
  const V1 = () => Math.sqrt(2 * G() * H * 0.2);          // Einfachsprung ≈ 20 % der Höhe
  const speed = () => W * 0.3 * (1 + Math.min(0.6, st.t / 180));
  const pSize = () => H * 0.17;
  const px = () => W * 0.2;
  const lanes = () => [0, H * 0.17, H * 0.33].map(h => groundY - pSize() * 0.5 - h);

  function jump() {
    if (!st.running) return;
    const p = st.player;
    if (p.y === 0 || p.jumps < 2) {
      p.vy = V1();
      p.jumps = p.y === 0 ? 1 : p.jumps + 1;
      sounds.pop();
    }
  }
  const onPointer = e => { if (e.target.closest('.jr-overlay')) return; e.preventDefault(); jump(); };
  const onKey = e => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
  wrap.addEventListener('pointerdown', onPointer);
  window.addEventListener('keydown', onKey);

  overlay.querySelector('button').addEventListener('click', () => {
    overlay.hidden = true;
    st.running = true;
    st.last = performance.now();
  });

  // ---------- Rechentore ----------
  function newGate() {
    let id = pickFact(progress, tasksPool, { weakShare: 0.2, recent: st.recent });
    st.recent = [...st.recent, id].slice(-4);
    const f = parseFact(id);
    const opts = new Set([f.answer]);
    const near = shuffle([-2, -1, 1, 2, 3, -3]);
    for (const d of near) { const v = f.answer + d; if (v >= 0 && v <= 20) opts.add(v); if (opts.size === 3) break; }
    const values = shuffle([...opts]);
    const x0 = W + speed() * 1.6;
    const r = H * 0.062;
    const ly = lanes();
    st.gate = { f, done: false, bubbles: values.map((v, i) => ({ v, x: x0 + i * r * 0.2, y: ly[i], r, state: 'idle', t: 0 })) };
    hud.task.innerHTML = f.parts.map(p => p === '?' ? '<span class="q">?</span>' : esc(p)).join(' ');
    hud.task.hidden = false;
    hud.task.classList.remove('good', 'bad');
  }

  function resolveGate(b) {
    const g = st.gate;
    g.done = true;
    const good = b.v === g.f.answer;
    b.state = good ? 'good' : 'bad';
    if (good) {
      st.correct++;
      const bonus = Math.max(0, Math.min(JR.bonusSec, JR.maxSec - st.played - st.timeLeft));
      st.timeLeft += bonus;
      floatText(bonus > 0 ? `+${bonus} s` : 'Super!', 'good');
      burst(b.x, b.y, ['⭐', '✨', '🎉']);
      sounds.star();
      hud.task.classList.add('good');
    } else {
      st.wrong++;
      floatText(`Richtig: ${g.f.answer}`, 'bad');
      sounds.wrong();
      hud.task.classList.add('bad');
    }
    hud.ok.textContent = st.correct;
  }

  function floatText(text, cls) {
    const d = document.createElement('div');
    d.className = 'jr-pop ' + cls;
    d.textContent = text;
    hud.float.appendChild(d);
    setTimeout(() => d.remove(), 1300);
  }

  function burst(x, y, emojis) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, v = (120 + Math.random() * 200) * unit;
      st.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 150 * unit, life: 0.9, ch: emojis[i % emojis.length] });
    }
  }

  // ---------- Schleife ----------
  function step() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - st.last) / 1000);
    st.last = now;
    if (st.running && !st.over) update(dt);
    render();
  }

  function update(dt) {
    st.t += dt;
    st.played += dt;
    st.timeLeft -= dt;
    hud.time.textContent = Math.max(0, Math.ceil(st.timeLeft));
    if (st.timeLeft <= 0) return finish();

    const v = speed();
    st.dist += v * dt;
    const p = st.player;
    if (p.y > 0 || p.vy > 0) {
      p.vy -= G() * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) { p.y = 0; p.vy = 0; p.jumps = 0; }
    }
    if (p.inv > 0) p.inv -= dt;

    const ps = pSize();
    const pcx = px(), pcy = groundY - p.y - ps * 0.5;
    const safeFromGate = () => !st.gate || st.gate.done || st.gate.bubbles[0].x - pcx > v * 1.4 || st.gate.bubbles[0].x < pcx - 100;

    // Hindernisse, Sterne, Tore erzeugen
    st.nextGate -= dt; st.nextObstacle -= dt; st.nextCoins -= dt;
    if (st.nextGate <= 0 && (!st.gate || st.gate.bubbles.every(b => b.x < -b.r))) { newGate(); st.nextGate = 6.5; }
    if (st.nextObstacle <= 0) {
      if (safeFromGate()) st.items.push({ kind: 'rock', ch: OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)], x: W + 40, y: groundY, s: H * 0.075 });
      st.nextObstacle = 2.2 + Math.random() * 2;
    }
    if (st.nextCoins <= 0) {
      const high = Math.random() < 0.5;
      for (let i = 0; i < 4; i++) st.items.push({ kind: 'coin', ch: '⭐', x: W + 40 + i * 50 * unit, y: groundY - (high ? H * 0.2 : H * 0.05) - Math.sin(i / 3 * Math.PI) * H * 0.05, s: H * 0.05 });
      st.nextCoins = 3 + Math.random() * 2;
    }

    // Bewegen & Kollision
    for (const it of st.items) {
      it.x -= v * dt;
      if (it.hit) continue;
      if (it.kind === 'coin') {
        if (Math.abs(it.x - pcx) < ps * 0.45 && Math.abs(it.y - it.s * 0.5 - pcy) < ps * 0.55) {
          it.hit = true; st.coins++; hud.coins.textContent = st.coins; sounds.pop();
        }
      } else if (p.inv <= 0 && Math.abs(it.x - pcx) < ps * 0.35 && p.y < it.s * 0.8) {
        it.hit = true;
        p.inv = 1.5;
        st.timeLeft = Math.max(1, st.timeLeft - JR.stumbleSec);
        floatText(`Autsch! −${JR.stumbleSec} s`, 'bad');
        sounds.wrong();
      }
    }
    st.items = st.items.filter(it => it.x > -80 && !(it.kind === 'coin' && it.hit));

    const g = st.gate;
    if (g) {
      for (const b of g.bubbles) {
        b.x -= v * dt;
        if (b.state !== 'idle') b.t += dt;
        if (!g.done && Math.hypot(b.x - pcx, b.y - pcy) < b.r + ps * 0.35) resolveGate(b);
      }
      if (!g.done && g.bubbles.every(b => b.x < pcx - b.r - ps * 0.4)) {
        g.done = true;
        floatText(`Das war ${g.f.answer}`, 'miss');
        hud.task.classList.add('bad');
      }
      if (g.done && g.bubbles.every(b => b.x < -b.r)) { st.gate = null; hud.task.hidden = true; }
    }

    for (const q of st.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * unit * dt; q.life -= dt; }
    st.particles = st.particles.filter(q => q.life > 0);
  }

  // ---------- Zeichnen ----------
  function render() {
    if (!W) return;
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#7CC7FF'); sky.addColorStop(1, '#D8F0FF');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // Sonne
    ctx.fillStyle = '#FFE066'; ctx.beginPath(); ctx.arc(W * 0.85, H * 0.16, H * 0.07, 0, 7); ctx.fill();
    // Wolken (langsam)
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * W * 0.37 - st.dist * 0.1) % (W + 200) + W + 200) % (W + 200) - 100;
      const y = H * (0.12 + (i % 2) * 0.1);
      cloud(x, y, H * 0.035);
    }
    // Hügel (Parallax)
    hills(st.dist * 0.2, H * 0.1, '#A8E6A1', groundY - H * 0.02);
    hills(st.dist * 0.45, H * 0.06, '#7ED17A', groundY);
    // Boden
    ctx.fillStyle = '#5DBB63'; ctx.fillRect(0, groundY, W, H * 0.03);
    ctx.fillStyle = '#B7794A'; ctx.fillRect(0, groundY + H * 0.03, W, H);
    ctx.fillStyle = '#A0663C';
    const tile = 60 * unit;
    for (let x = -(st.dist % tile); x < W; x += tile) ctx.fillRect(x, groundY + H * 0.07, tile * 0.5, H * 0.02);

    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (const it of st.items) {
      if (it.kind === 'rock' && it.hit) ctx.globalAlpha = 0.5;
      ctx.font = `${it.s}px serif`;
      ctx.fillText(it.ch, it.x, it.y + (it.kind === 'rock' ? it.s * 0.12 : 0));
      ctx.globalAlpha = 1;
    }

    // Rechenblasen
    if (st.gate) {
      for (const b of st.gate.bubbles) {
        const r = b.r * (b.state === 'bad' ? Math.max(0.2, 1 - b.t * 2) : b.state === 'good' ? 1 + b.t : 1);
        ctx.globalAlpha = b.state === 'good' ? Math.max(0, 1 - b.t * 1.5) : 1;
        ctx.fillStyle = b.state === 'good' ? '#22B573' : b.state === 'bad' ? '#FF6B6B' : 'rgba(255,255,255,.92)';
        ctx.strokeStyle = b.state === 'idle' ? '#6C5CE7' : '#fff';
        ctx.lineWidth = 5 * unit;
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.beginPath(); ctx.arc(b.x - r * 0.35, b.y - r * 0.4, r * 0.18, 0, 7); ctx.fill();
        ctx.fillStyle = b.state === 'idle' ? '#2B2A33' : '#fff';
        ctx.font = `800 ${r * 1.05}px ui-rounded, system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.v), b.x, b.y + r * 0.05);
        ctx.textBaseline = 'bottom';
        ctx.globalAlpha = 1;
      }
    }

    // Spielfigur
    const p = st.player, ps = pSize();
    const x = px(), y = groundY - p.y;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(x, groundY + 4, ps * 0.3 * (1 - Math.min(0.5, p.y / H)), ps * 0.06, 0, 0, 7); ctx.fill();
    if (!(p.inv > 0 && Math.floor(p.inv * 10) % 2)) {
      const bob = p.y === 0 && st.running ? Math.abs(Math.sin(st.t * 12)) * ps * 0.04 : 0;
      ctx.save();
      ctx.translate(x, y - bob);
      if (p.y > 0) ctx.rotate(Math.max(-0.25, Math.min(0.25, -p.vy / (V1() * 4))));
      if (img.complete && img.naturalWidth) ctx.drawImage(img, -ps * 0.45, -ps, ps * 0.9, ps * 1.1);
      else { ctx.fillStyle = '#6C5CE7'; ctx.beginPath(); ctx.arc(0, -ps * 0.5, ps * 0.4, 0, 7); ctx.fill(); }
      ctx.restore();
    }

    ctx.textBaseline = 'middle';
    for (const q of st.particles) {
      ctx.globalAlpha = Math.max(0, q.life);
      ctx.font = `${H * 0.04}px serif`;
      ctx.fillText(q.ch, q.x, q.y);
    }
    ctx.globalAlpha = 1;
  }

  function cloud(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7); ctx.arc(x + r, y - r * 0.5, r * 1.2, 0, 7); ctx.arc(x + r * 2.2, y, r, 0, 7);
    ctx.fill();
  }
  function hills(offset, amp, color, base) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, groundY + 1);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, base - amp - Math.sin((x + offset) / (W * 0.18)) * amp);
    ctx.lineTo(W, groundY + 1); ctx.closePath(); ctx.fill();
  }

  function finish() {
    st.over = true;
    st.running = false;
    hud.task.hidden = true;
    sounds.star();
    overlay.innerHTML = `
      <div class="card intro-card">
        <div class="intro-icon">🏁</div>
        <h2>${st.correct} ${st.correct === 1 ? 'Rechnung' : 'Rechnungen'} richtig!</h2>
        <p>Du hast ${st.coins} Sterne gesammelt und ${Math.round(st.played)} Sekunden gespielt.</p>
        <button class="btn btn-big btn-go" type="button">Weiter ➜</button>
      </div>`;
    overlay.hidden = false;
    overlay.querySelector('button').addEventListener('click', () => {
      cleanup();
      onDone({ correct: st.correct, wrong: st.wrong, coins: st.coins, seconds: Math.round(st.played) });
    });
  }

  const timer = setInterval(step, 16);
  function cleanup() {
    clearInterval(timer);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKey);
  }
  return cleanup;
}

// Eigenständig spielbar (Belohnung / Test im Erwachsenen-Bereich)
export function renderJumpRun(root, { back = 'menu' } = {}) {
  root.innerHTML = `<div class="jr-screen"><button class="icon-btn jr-exit" aria-label="Beenden">✕</button><div class="jr-host"></div></div>`;
  const progress = app.progress || { facts: {}, recentTimes: [] };
  const stop = runJumpRun(root.querySelector('.jr-host'), {
    pool: poolOf('gemischt'), progress, look: app.profile?.look, onDone: () => go(back),
  });
  onLeave(stop);
  root.querySelector('.jr-exit').addEventListener('click', () => go(back));
}
