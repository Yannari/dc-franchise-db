// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/stage.js — paints step N of a Challenge screen
// ══════════════════════════════════════════════════════════════════════
//
// The approved mockup's player (mockup/mockup-ch-viewer.html v2), as a module
// that works inside one screen's root. A step's lasting effect on the stage is
// `apply` (who is where, who is out, the board); what it shows for that click is
// `present` (who is lit, the camera, the HUD, the slams, the line). Going
// forward applies one step with animation; going back or jumping rebuilds the
// screen from its first step, quietly, then presents the step (manual §18.1:
// paint step N deterministically, only the newest step animates).
import { CH_MARKS } from './marks.js';
import { liveGL } from '../vp-td-ep/glplate.js';
import { playerAvatarUrl } from '../players.js';
import { propsHtml } from './props.js';

export const AV = n => (n === 'TJ' ? 'assets/avatars/tj-maxx.png' : playerAvatarUrl(n));
const PLATE = k => `assets/sets/ch/${k}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const marks = k => (CH_MARKS[k] || { m: [] }).m;
const rnd = (a, b) => a + Math.random() * (b - a);
const ICON = {
  island: "<path d='M3 18c3-2 6-2 9 0s6 2 9 0' stroke='#111' stroke-width='2.2' fill='none'/><path d='M12 16V7m0 0c-2-3-6-3-7-1m7 1c2-3 6-3 7-1m-7 1c-1-2-1-4 1-5' stroke='#111' stroke-width='2' fill='none' stroke-linecap='round'/>",
  house: "<path d='M3 11l9-7 9 7v9H3z' fill='none' stroke='#111' stroke-width='2.2' stroke-linejoin='round'/><path d='M9 20v-6h6v6' stroke='#111' stroke-width='2'/>",
  fire: "<path d='M12 3c1 4 6 5 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 2 3 4 1-2 1-5 1-8z' fill='#111'/>",
  music: "<path d='M9 17V5l11-2v12' stroke='#111' stroke-width='2.2' fill='none'/><circle cx='6.5' cy='17.5' r='2.8' fill='#111'/><circle cx='17.5' cy='15' r='2.8' fill='#111'/>",
  skull: "<path d='M12 3a8 8 0 0 0-8 8c0 3 2 5 3 6v3h10v-3c1-1 3-3 3-6a8 8 0 0 0-8-8z' fill='#111'/><circle cx='9' cy='11' r='2' fill='#ff6a1a'/><circle cx='15' cy='11' r='2' fill='#ff6a1a'/>",
};
const HEART = "<svg viewBox='0 0 24 22'><path d='M12 21s-9-5.6-9-12A5 5 0 0 1 12 6a5 5 0 0 1 9 3c0 6.4-9 12-9 12z' fill='#ff3d6e' stroke='#111' stroke-width='1.6'/></svg>";

// ── the stage's state ─────────────────────────────────────────────────
function newState() {
  return { plate: null, toks: {}, home: {}, hidden: new Set(), out: new Set(), hangers: null, standers: null, sag: 0, board: {}, voters: 0, of: 0,
    duel: null, race: null, tally: null, props: [], poses: {}, power: [], chips: {}, scale: 1.5, scene: null, map: null, dance: [], bgAct: {}, speaker: null, water: 0 };
}

export class ChxStage {
  constructor(root, R) {
    this.root = root; this.R = R;
    const q = c => root.querySelector(c);
    this.el = { frame: q('.chx-frame'), world: q('.chx-world'), plate: q('.chx-platebox'), live: q('.chx-live'), props: q('.chx-props'), cast: q('.chx-cast'), wfx: q('.chx-wfx'),
      hud: q('.chx-hud'), conf: q('.chx-confbox'), dlg: q('.dlg'), cut: q('.cutin'), name: q('.dlg .name'), say: q('.dlg .say'), over: q('.over'), intel: q('.intel'), stat: q('.static') };
    this.ST = newState();
    this.typing = 0;
  }

  // A mark: [kind, index, group|side] read off the plate, a raw {u, v, s}, or null (anywhere free).
  mk(spec, n) {
    const ST = this.ST;
    if (spec && !Array.isArray(spec)) return spec;
    if (!spec) {
      const used = new Set(Object.values(ST.toks).filter(t => !t.classList.contains('gone')).map(t => t._m));
      const free = marks(ST.plate).filter(m => m.kind === 'stand' && !m.group && !used.has(m)).sort((a, b) => Math.abs(a.u - .5) - Math.abs(b.u - .5));
      return free[0] || { u: .5 + (n ? ((n.length * 7) % 9 - 4) * .05 : 0), v: .78, s: .11 };
    }
    const [kind, i = 0, group] = spec;
    const all = marks(ST.plate).filter(m => m.kind === kind && (kind === 'podium' || kind === 'duel' ? m.side === group : group ? m.group === group : !m.group));
    return all[i] || all[0] || marks(ST.plate).find(m => m.kind === kind) || null;
  }
  sizeOf(m) { return (m.s || .07) * this.ST.scale * 100; }
  put(n, spec, anim) {
    const ST = this.ST;
    const m = this.mk(spec, n); if (!m) return;
    let t = ST.toks[n];
    if (!t) {
      t = document.createElement('div'); t.className = 'tok' + (n === 'TJ' ? ' host' : ''); t.dataset.n = n;
      t.style.setProperty('--bd', (-Math.random() * 3).toFixed(2) + 's');
      t.innerHTML = `<div class='body'><div class='face'><img src='${esc(AV(n))}' alt=''></div><span class='tag'>${n === 'TJ' ? 'TJ Maxx' : esc(n)}</span></div><div class='shadow'></div>`;
      this.el.cast.append(t); ST.toks[n] = t;
    }
    if (!anim) t.style.transition = 'none';
    t.style.left = m.u * 100 + '%'; t.style.top = m.v * 100 + '%'; t.style.setProperty('--sz', this.sizeOf(m).toFixed(2) + 'cqh');
    t.style.zIndex = Math.round(m.v * 50);
    t.classList.toggle('small', this.sizeOf(m) < 7);
    if (!anim) { void t.offsetWidth; t.style.transition = ''; }
    t._m = m;
  }

  setScene(sc) {
    this.ST = newState();
    const ST = this.ST;
    Object.assign(ST, { plate: sc.plate, scale: sc.scale || 1.5, scene: sc, water: sc.water || 0 });
    this.root?.classList?.toggle('flashback', !!sc.flash);
    this.el.plate.innerHTML = `<img class='chx-plate' src='${PLATE(sc.plate)}.webp' alt=''><canvas class='chx-glc tdx-gl' data-src='${PLATE(sc.plate)}' data-hd='1' width='1920' height='1080'></canvas>`;
    this.el.cast.innerHTML = ''; this.el.wfx.innerHTML = ''; this.el.live.innerHTML = ''; if (this.el.props) this.el.props.innerHTML = '';
    for (const [n, spec] of Object.entries(sc.cast || {})) { ST.home[n] = spec; this.put(n, spec, false); }
    for (const n of sc.hidden || []) { ST.hidden.add(n); ST.toks[n]?.classList.add('gone'); }
    if (sc.water) for (const t of Object.values(ST.toks)) { t.style.top = `calc(${t.style.top} + 7cqh)`; t.querySelector('.face').style.boxShadow = 'inset 0 -5cqh 0 rgba(60,200,220,.55)'; }
    this.living(sc);
    try { liveGL(this.el.plate); } catch { /* the still plate stays */ }
  }

  living(sc) {
    let h = '';
    const night = sc.plate.endsWith('-night');
    for (const f of marks(sc.plate).filter(m => m.kind === 'fire')) {
      const fh = (f.fh || .05) * 100;
      h += `<div class='glow' style='left:${f.u * 100}%;top:${f.v * 100 - fh * .6}%;width:${fh * 2.8}cqh;height:${fh * 2.8}cqh'></div>`;
      for (let i = 0; i < (sc.embers ? 7 : 4); i++) h += `<div class='ember' style='left:${f.u * 100 + rnd(-.7, .7)}%;top:${f.v * 100 - fh * .9}%;--d:${rnd(1.8, 3.6).toFixed(2)}s;--dl:${(-rnd(0, 3)).toFixed(2)}s;--dx:${rnd(-2, 2).toFixed(2)}cqw'></div>`;
    }
    const inside = /^(common|kitchen|bunks|gym|conf)/.test(sc.plate);
    if (night && !inside) for (let i = 0; i < 16; i++) h += `<div class='fly' style='left:${rnd(2, 96)}%;top:${rnd(25, 70)}%;--d:${rnd(5, 11).toFixed(1)}s;--dl:${(-rnd(0, 6)).toFixed(1)}s;--dx:${rnd(-5, 5).toFixed(1)}cqw;--dy:${rnd(-4, 4).toFixed(1)}cqh'></div>`;
    if (!night) for (let i = 0; i < 12; i++) h += `<div class='mote' style='left:${rnd(2, 96)}%;top:${rnd(10, 70)}%;--d:${rnd(8, 16).toFixed(1)}s;--dl:${(-rnd(0, 8)).toFixed(1)}s;--dx:${rnd(-4, 4).toFixed(1)}cqw;--dy:${rnd(-3, 3).toFixed(1)}cqh'></div>`;
    if (sc.lasers) ['#ff3df2', '#2de2ff', '#ffd21a', '#ff6a1a'].forEach((c, i) => { h += `<div class='laser' style='left:${36 + i * 4}%;top:46%;--c:${c};--d:${2.4 + i * .5}s'></div>`; });
    this.el.live.innerHTML = h;
  }

  camera(focus, cam) {
    const W = this.el.world, ST = this.ST;
    if (cam) { W.style.transform = tf(cam[0], cam[1], cam[2]); return; }
    const ts = (focus || []).map(n => ST.toks[n]).filter(t => t && t._m && !t.classList.contains('gone'));
    if (!ts.length || ST.map) { W.style.transform = 'scale(1)'; return; }
    const xs = ts.map(t => t._m.u), ys = ts.map(t => t._m.v - (this.sizeOf(t._m) / 100) * .45);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const spread = Math.max(...xs) - Math.min(...xs);
    // people already drawn large (a close plate: the gym, the ridge) get no zoom; small ones a little
    const big = Math.max(...ts.map(t => t._m.s || .1));
    const z = big >= .13 ? 1 : Math.max(1, Math.min(big >= .1 ? 1.1 : 1.2, .7 / (spread + .42)));
    W.style.transform = tf(cx, cy + .07, z);
  }

  // ── one-shot effects ───────────────────────────────────────────────
  fxAt(cls, n, html, css) {
    const t = this.ST.toks[n]; if (!t || !t._m) return;
    const d = document.createElement('div'); d.className = cls;
    d.style.left = t._m.u * 100 + '%'; d.style.top = (t._m.v * 100 - this.sizeOf(t._m) * 1.05) + '%';
    if (css) Object.assign(d.style, css);
    d.innerHTML = html || ''; this.el.wfx.append(d); setTimeout(() => d.remove(), 2600);
  }
  splash(u, v, mud) {
    const W = this.el.wfx;
    for (let i = 0; i < 12; i++) { const d = document.createElement('div'); d.className = 'drop'; d.style.left = u * 100 + '%'; d.style.top = v * 100 + '%'; d.style.setProperty('--dx', rnd(-4, 4).toFixed(1) + 'cqw'); if (mud) d.style.background = '#8a6a44'; d.style.animationDelay = rnd(0, .1) + 's'; W.append(d); setTimeout(() => d.remove(), 1200); }
    const r = document.createElement('div'); r.className = 'splashring'; r.style.left = u * 100 + '%'; r.style.top = v * 100 + '%'; W.append(r); setTimeout(() => r.remove(), 1200);
  }
  puff(u, v) { const d = document.createElement('div'); d.className = 'puff'; d.style.left = u * 100 + '%'; d.style.top = v * 100 + '%'; this.el.wfx.append(d); setTimeout(() => d.remove(), 1100); }
  sparks() {
    for (let i = 0; i < 26; i++) { const s = document.createElement('div'); s.className = 'spark'; s.style.left = '50%'; s.style.top = '26%';
      s.style.setProperty('--dx', rnd(-35, 35).toFixed(1) + 'cqw'); s.style.setProperty('--dy', rnd(-15, 35).toFixed(1) + 'cqh'); s.style.setProperty('--r', rnd(0, 360).toFixed(0) + 'deg');
      s.style.background = Math.random() < .5 ? 'var(--caution)' : 'var(--fire)'; this.el.over.append(s); setTimeout(() => s.remove(), 1300); }
  }
  confetti() {
    const C = ['#ffd21a', '#ff6a1a', '#e3262d', '#2de2ff', '#ffffff'];
    for (let i = 0; i < 60; i++) { const s = document.createElement('div'); s.className = 'confetti'; s.style.left = rnd(0, 100) + '%'; s.style.background = C[i % C.length];
      s.style.setProperty('--dx', rnd(-8, 8).toFixed(1) + 'cqw'); s.style.setProperty('--r', rnd(180, 900).toFixed(0) + 'deg'); s.style.setProperty('--d', rnd(2.2, 4).toFixed(2) + 's'); s.style.setProperty('--dl', rnd(0, 1.2).toFixed(2) + 's');
      this.el.over.append(s); setTimeout(() => s.remove(), 5500); }
  }
  shake() { const f = this.el.frame; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
  wipe() { const w = document.createElement('div'); w.className = 'wipe'; w.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'; this.el.over.append(w); setTimeout(() => w.remove(), 1100); }
  burst() { const st = this.el.stat; st.classList.remove('burst'); void st.offsetWidth; st.classList.add('burst'); }

  // Under the pier (Hang On): along the deck, then hanging below it.
  hangAt(k, n, sag = 0) { const sp = Math.min(.046, .86 / Math.max(1, n)); return { u: .055 + k * sp + (.046 - sp) * 2, v: .655 + sag * .028, s: Math.min(.056, sp * 1.2) }; }
  pierAt(k, n) { const sp = Math.min(.045, .86 / Math.max(1, n)); return { u: .06 + k * sp + (.045 - sp) * 2, v: .505, s: Math.min(.06, sp * 1.3) }; }

  // ── a step's lasting effect ────────────────────────────────────────
  apply(s, anim) {
    if (s.scene) { this.setScene(s.scene); if (anim && s.scene.wipe) this.wipe(); }
    const ST = this.ST;
    ST.map = s.map || null;
    if (s.enter) for (const [n, spec] of Object.entries(s.enter)) {
      ST.hidden.delete(n); ST.toks[n]?.classList.remove('gone');
      const home = spec || ST.home[n] || null;
      if (!ST.toks[n] && anim && s.from) this.put(n, s.from, false);
      else if (!ST.toks[n] && anim) { this.put(n, { u: (this.mk(home, n)?.u ?? .5) < .5 ? -.08 : 1.08, v: (this.mk(home, n)?.v ?? .78), s: this.mk(home, n)?.s || .1 }, false); }
      ST.home[n] = home; this.put(n, home, anim);
      if (anim) { const t = ST.toks[n]; t.classList.add('walkin'); setTimeout(() => t.classList.remove('walkin'), 1000); }
    }
    if (s.move) for (const [n, spec] of Object.entries(s.move)) { ST.home[n] = spec; this.put(n, spec, anim); }
    if (s.shift) for (const [n, t] of Object.entries(ST.toks)) if (t._m && ST.poses[n] === 'swim') this.put(n, { ...t._m, u: Math.max(.03, t._m.u + s.shift.du) }, anim);
    if (s.pose) for (const [n, p] of Object.entries(s.pose)) { if (p) ST.poses[n] = p; else delete ST.poses[n]; }
    if (s.hide) for (const n of s.hide) { ST.hidden.add(n); ST.toks[n]?.classList.add('gone'); }
    if (s.show) for (const n of s.show) { ST.hidden.delete(n); ST.toks[n]?.classList.remove('gone'); }
    if (s.props) { ST.props = s.props; if (this.el.props) this.el.props.innerHTML = propsHtml(s.props); }
    if (s.tally) ST.tally = s.tally;
    if (s.exit) for (const n of s.exit) {
      const t = ST.toks[n]; if (!t) continue;
      const gate = marks(ST.plate).find(m => m.kind === 'gate');
      if (gate) this.put(n, ['gate'], anim);
      else if (t._m) this.put(n, { ...t._m, u: t._m.u < .5 ? -.1 : 1.1 }, anim);
      t.classList.add('gone'); ST.hidden.add(n);
    }
    // the daily: hanging under the pier / standing on the platforms
    if (s.hang === 'start') {
      ST.hangers = [...(s.still || [])];
      ST.hangers.forEach((n, k) => { this.put(n, this.hangAt(k, ST.hangers.length), anim); ST.toks[n]?.classList.add('hang'); ST.toks[n]?.style.setProperty('--rope', '3cqh'); });
    }
    if (s.stand === 'start') ST.standers = [...(s.still || [])];
    if (s.sag && ST.hangers) {
      ST.sag = s.sag;
      ST.hangers.forEach((n, k) => { if (!ST.out.has(n)) { this.put(n, this.hangAt(k, ST.hangers.length, s.sag), anim); ST.toks[n]?.style.setProperty('--rope', (3 + s.sag * 2.6) + 'cqh'); } });
    }
    if (s.drop) for (const n of s.drop) {
      ST.out.add(n); const t = ST.toks[n]; if (!t) continue;
      if (ST.hangers || s.splash || (ST.duel && ST.duel.format === 'hold')) {
        t.classList.remove('hang'); t.classList.add('fall');
        if (ST.duel?.format === 'hold') t.classList.add('mud');
        if (!anim) t.style.transition = 'none';
        const v = Math.min(.86, (t._m?.v || .7) + (ST.hangers ? .14 : .07));
        t.style.top = v * 100 + '%'; t._m = { ...t._m, v };
        if (anim) setTimeout(() => this.splash(t._m.u, v - .02, ST.duel?.format === 'hold'), 330); else { void t.offsetWidth; t.style.transition = ''; }
      } else { t.classList.add('out'); if (anim && t._m) this.puff(t._m.u, t._m.v); }
    }
    if (s.win) {
      if (ST.hangers) { ST.hangers.forEach((n, k) => { const t = ST.toks[n]; t?.classList.remove('hang', 'fall'); this.put(n, this.pierAt(k, ST.hangers.length), anim); }); ST.hangers = null; }
      ST.power = s.win; s.win.forEach(n => ST.toks[n]?.classList.add('safe'));
    }
    if (s.power) ST.power = s.power;
    if (s.boardReset) { ST.board = {}; ST.voters = 0; }
    if (s.vote) {
      const [v, n] = s.vote;
      const speak = marks(ST.plate).find(m => m.kind === 'speak');
      if (ST.speaker && ST.speaker !== v) this.put(ST.speaker, ST.home[ST.speaker], anim);
      if (speak) this.put(v, speak, anim);
      ST.speaker = v; ST.board[n] = (ST.board[n] || 0) + 1; ST.voters++; ST.of = s.of || ST.of;
    } else if (ST.speaker) { this.put(ST.speaker, ST.home[ST.speaker], anim); ST.speaker = null; }
    if (s.chip) ST.chips[s.chip[0]] = s.chip[1];
    if (s.race !== undefined && s.race !== null) ST.race = s.race;
    if (s.finish) ST.race = s.race || null;
    if (s.duel) {
      ST.duel = s.duel;
      if (s.hang === 'duel') [s.duel.a, s.duel.b].forEach(n => { ST.toks[n]?.classList.add('hang'); ST.toks[n]?.style.setProperty('--rope', '4cqh'); });
    }
    if (s.dance) ST.dance = s.dance;
    if (s.bg) ST.bgAct = s.bg;
  }

  // ── what this click shows ──────────────────────────────────────────
  present(s, anim, ctx) {
    const ST = this.ST, O = this.el.over;
    O.querySelectorAll('.seg,.spray,.stamp,.winner,.open,.tcard').forEach(e => e.remove());
    const focus = s.focus !== undefined ? s.focus : s.say ? [s.say[0]] : s.tj ? ['TJ'] : [];
    for (const [n, t] of Object.entries(ST.toks)) {
      t.classList.toggle('speak', !!(s.say && s.say[0] === n) || (!!s.tj && n === 'TJ'));
      t.classList.toggle('bg', focus.length > 0 && !focus.includes(n) && !(s.vote && n === s.vote[1]));
      t.classList.toggle('dance', ST.dance.includes(n) && !focus.includes(n));
      for (const a of ['sip', 'look']) t.classList.toggle(a, ST.bgAct[n] === a && !focus.includes(n));
      t.querySelector('.chip')?.remove();
      if (ST.chips[n]) t.insertAdjacentHTML('beforeend', `<div class='chip'>${esc(ST.chips[n])}</div>`);
      t.classList.remove('talkpop', 'shout', 'laugh', 'flinch', 'lean', 'cheer', 'cry');
      t.classList.toggle('dig', !!(s.dig && s.dig.includes(n)));
      t.classList.toggle('run', ST.poses[n] === 'run' || !!(ST.race && !s.finish && ST.race.some(r => r.who.includes(n)) && !s.say));
      for (const p of ['swim', 'climb', 'pull']) t.classList.toggle(p, ST.poses[n] === p);
    }
    if (anim && s.act) for (const [n, a] of Object.entries(s.act)) {
      const t = ST.toks[n]; if (!t) continue;
      const other = focus.find(x => x !== n);
      if (other && ST.toks[other]?._m && t._m) { const dir = ST.toks[other]._m.u > t._m.u ? 1 : -1; t.style.setProperty('--to', dir * 8 + '%'); t.style.setProperty('--rot', dir * 5 + 'deg'); t.style.setProperty('--away', -dir * 6 + '%'); }
      void t.offsetWidth; t.classList.add(a);
    }
    if (!anim && s.act) for (const [n, a] of Object.entries(s.act)) if (a === 'slump') ST.toks[n]?.classList.add('slump');
    if (anim && s.say && !(s.act && s.act[s.say[0]])) { const t = ST.toks[s.say[0]]; if (t) { void t.offsetWidth; t.classList.add('talkpop'); } }
    if (anim && s.vote) { const t = ST.toks[s.vote[1]]; if (t) { void t.offsetWidth; t.classList.add('flinch'); this.fxAt('pop', s.vote[1], String(ST.board[s.vote[1]]), { fontSize: '2.6cqw' }); } }
    if (anim && s.fx?.heart) for (const n of s.fx.heart) this.fxAt('heart', n, HEART);
    if (anim && s.loud && s.say) this.fxAt('excl', s.say[0], '!');
    this.camera(focus, s.cam);

    const P = ST.scene || {};
    let h = '';
    if (!ST.map && !P.conf) h += `<div class='loc ${anim && s.scene ? 'fresh' : ''}'><div class='ic'><svg viewBox='0 0 24 24'>${ICON[P.icon] || ICON.house}</svg></div><div class='txt'><div class='place'>${esc(P.place || '')}</div><div class='when'>${P.when || ''}</div></div></div>`;
    if (ST.power.length && !ST.map) h += `<div class='power'><b>SAFE</b>${ST.power.map(n => `<img src='${esc(AV(n))}' title='${esc(n)}' alt=''>`).join('')}</div>`;
    const pinId = P.island || (P.room ? 'villa' : null);
    if (pinId && !ST.map && !P.conf) {
      const pin = marks('map-day').find(m => m.kind === 'spot' && m.id === pinId);
      h += `<div class='mini' data-isle title='Open the island map'><div class='lbl'><span>Blue Lagoon</span><b>&#9679;</b></div><div class='m' style="background-image:url('${PLATE('map-day')}.webp')">${pin ? `<i class='pin' style='left:${pin.u * 100}%;top:${pin.v * 100}%'></i>` : ''}</div></div>`;
    }
    if (ST.voters) {
      const rows = Object.entries(ST.board).sort((a, b) => b[1] - a[1]);
      h += `<div class='board'><h5>THE VOTE</h5>${rows.map(([n, c]) => `<div class='row ${anim && s.vote && s.vote[1] === n ? 'hit' : ''}'><img src='${esc(AV(n))}' alt=''><div><div class='nm'>${esc(n)}</div><div class='ticks'>${'||||| '.repeat(Math.floor(c / 5)) + '|'.repeat(c % 5)}</div></div><div class='ct'>${c}</div></div>`).join('')}<div class='left'>${ST.voters} of ${ST.of || ST.voters} have voted</div></div>`;
    }
    if (ST.duel) h += duelHtml(ST.duel);
    else if (ST.tally) h += tallyHtml(ST.tally);
    const wb = (ST.props || []).find(p => p.k === 'board');
    if (wb) h += `<div class='board'><h5>${esc(wb.title || 'TOTALS')}</h5>${(wb.rows || []).map(r => `<div class='row'><img src='${esc(AV(r.full || r.n))}' alt=''><div><div class='nm'>${esc(r.n)}</div></div><div class='ct' style='${r.ok === false ? 'color:#ff7a6e;text-decoration:line-through' : ''}'>${esc(r.t)}${r.ok === true ? ' &#10003;' : ''}</div></div>`).join('')}</div>`;
    const word = (ST.props || []).filter(p => p.k === 'letter');
    if (word.length) h += `<div class='left-hud'><b>THE WORD</b>${word.map(p => `<span class='lt'>${esc(p.ch)}</span>`).join('')}</div>`;
    else if (ST.race) h += `<div class='race'>${ST.race.map(r => `<div class='r ${r.p >= 1 ? 'win' : ''}'><div class='fs'>${r.who.slice(0, 3).map(n => `<img src='${esc(AV(n))}' title='${esc(n)}' alt=''>`).join('')}</div><div class='bar'><b style='width:${Math.round(r.p * 100)}%'></b></div><div class='n'>${r.p >= 1 ? '&#10003;' : Math.round(r.p * 100) + '%'}</div></div>`).join('')}</div>`;
    const still = ST.hangers || ST.standers;
    if (still && !ST.duel) h += `<div class='left-hud'><b>${ST.hangers ? 'STILL HANGING' : 'STILL IN'}</b>${still.map(n => `<img class='${ST.out.has(n) ? 'out' : ''}' src='${esc(AV(n))}' title='${esc(n)}' alt=''>`).join('')}</div>`;
    if (s.roster) h += `<div class='roster'>${s.roster.map(r => `<div class='rc'><img src='${esc(AV(r.n))}' alt=''><div><div class='rn'>${esc(r.n)}</div>${r.show ? `<div class='rs'>${esc(r.show)}</div>` : ''}</div><span class='${r.rookie ? 'rk' : 'vt'}'>${r.rookie ? 'ROOKIE' : 'VET'}</span></div>`).join('')}</div>`;
    if (s.rules) h += `<div class='rules'><div class='k'>${esc(s.rules.k)}</div><div class='n'>${esc(s.rules.n)}</div><ol>${s.rules.li.map(x => `<li>${x}</li>`).join('')}</ol><div class='f'>${esc(s.rules.f)}</div></div>`;
    if (ST.map) h += mapHtml(ST.map, ST.plate);
    this.el.hud.innerHTML = h;

    if (s.card) O.insertAdjacentHTML('beforeend', titleCard(s.card));
    if (s.seg && !s.card) O.insertAdjacentHTML('beforeend', `<div class='seg'><div class='band'></div><div class='in'><div class='k'>${esc(s.seg[0].toUpperCase())}</div><div class='big'>${esc(s.seg[1])}</div></div></div>`);
    if (s.open && anim) this.openSeq(s.open);
    if (s.slam) this.slam(s.slam, anim);
    if (anim && s.shake) setTimeout(() => this.shake(), 250);
    if (anim && s.confetti) this.confetti();
    if (anim && s.gong) {
      const g = marks(ST.plate).find(m => m.kind === 'gong');
      if (g) for (let i = 0; i < 3; i++) setTimeout(() => { const r = document.createElement('div'); r.className = 'ring'; r.style.left = g.u * 100 + '%'; r.style.top = g.v * 100 + '%'; this.el.wfx.append(r); setTimeout(() => r.remove(), 1000); }, i * 220);
      this.shake();
    }
    if (anim && s.dig) for (const n of s.dig) { const t = ST.toks[n]; if (!t?._m) continue; for (let i = 0; i < 3; i++) setTimeout(() => this.puff(t._m.u, t._m.v), i * 320); }

    // the confessional cut
    const C = this.el.conf;
    // a player's introduction fills the frame under the dialogue box (their words show over it)
    this.el.frame.classList.toggle('introing', !!s.intro);
    if (s.intro) {
      const key = `intro:${s.intro.n}`;
      if (C.dataset.who !== key || !anim) { C.innerHTML = introHtml(s.intro, anim && !s.intro.still && C.dataset.who !== key); C.dataset.who = key; }
    } else if (C.dataset.who?.startsWith('intro:')) { C.innerHTML = ''; C.dataset.who = ''; }
    if (s.intro) { /* the introduction is the picture */ }
    else if (s.conf) {
      if (C.dataset.who !== s.conf[0]) {
        C.dataset.who = s.conf[0];
        const seat = marks('conf-day').find(m => m.kind === 'seat') || { u: .5 };
        const role = ctx.roleOf?.(s.conf[0]);
        C.innerHTML = `<div class='confcut'><img class='chx-plate' src='${PLATE('conf-day')}.webp' alt=''><div class='who' style='left:${seat.u * 100}%'><div class='face'><img src='${esc(AV(s.conf[0]))}' alt=''></div></div>`
          + `<div class='lower'><div class='n'>${esc(s.conf[0])}</div>${role ? `<div class='s'>${esc(role.toUpperCase())}</div>` : ''}</div><div class='rec'><i></i>CONFESSIONAL</div><div class='vig'></div><div class='grain'></div></div>`;
        if (anim) this.burst();
      }
    } else if (C.dataset.who) { C.innerHTML = ''; C.dataset.who = ''; if (anim) this.burst(); }

    this.dialogue(s, anim, ctx);
  }

  slam(sl, anim) {
    const O = this.el.over;
    if (sl.spray) {
      const drips = [140, 300, 470, 610, 760, 880].map((x, i) => `<rect class='drip' x='${x}' y='150' width='${5 + i % 3 * 2}' height='${40 + (i * 37) % 70}' rx='3' fill='${sl.color}' style='animation-delay:${(.7 + i * .12).toFixed(2)}s'/>`).join('');
      const size = sl.spray.length > 9 ? 140 : 168;
      O.insertAdjacentHTML('beforeend', `<div class='spray ${anim ? '' : 'still'}'><svg viewBox='0 0 1000 260'><g class='paint'><text x='500' y='170' text-anchor='middle' font-family='Black Ops One' font-size='${size}' fill='${sl.color}' stroke='#000' stroke-width='9' paint-order='stroke' filter='url(#chx-spr)'>${esc(sl.spray)}</text>${drips}</g></svg></div>`);
    }
    if (sl.stamp) { O.insertAdjacentHTML('beforeend', `<div class='stamp'>${esc(sl.stamp)}</div>`); if (anim) setTimeout(() => this.shake(), 120); }
    if (sl.winner) { O.insertAdjacentHTML('beforeend', `<div class='winner' style='font-size:${sl.winner.length > 26 ? 4.2 : 6}cqw'>${esc(sl.winner)}</div>`); if (anim) this.sparks(); }
  }

  openSeq(o) {
    const O = this.el.over;
    const cast = o.cast || [];
    const flash = cast.slice(0, 8);
    let h = "<div class='open'>";
    flash.forEach((n, i) => { h += `<div class='flash' style='animation-delay:${(i * .26).toFixed(2)}s'><img src='${esc(AV(n))}' alt=''><img src='${esc(AV(n))}' alt=''><b>${esc(n)}</b></div>`; });
    const t0 = flash.length * .26;
    h += `<div class='grid' style='animation-delay:${t0}s'>${cast.concat(['TJ']).slice(0, 20).map((n, i) => `<img src='${esc(AV(n))}' style='animation-delay:${(t0 + i * .03).toFixed(2)}s' alt=''>`).join('')}</div>`;
    h += `<div class='logo2' style='animation-delay:${t0 + .7}s'><div class='a'>${esc(o.season ? `SEASON ${o.season}` : 'THE CHALLENGE')}</div><div class='b'>The Challenge</div><div class='c'>${esc((o.title || 'Blue Lagoon').toUpperCase())}</div></div><div class='scan'></div></div>`;
    O.insertAdjacentHTML('beforeend', h);
    const me = O.querySelector('.open');
    setTimeout(() => { if (me.isConnected) { me.remove(); this.sparks(); this.shake(); } }, (t0 + 3.2) * 1000);
  }

  dialogue(s, anim, ctx) {
    const D = this.el.dlg, nm = this.el.name, say = this.el.say, cut = this.el.cut;
    clearInterval(this.typing);
    let who = null, text = '', kind = '';
    if (s.say) { who = s.say[0]; text = s.say[1]; }
    else if (s.tj) { who = 'TJ'; text = s.tj; kind = 'host'; }
    else if (s.conf) { who = s.conf[0]; text = s.conf[1]; kind = 'conf'; }
    else { text = s.dir || ''; kind = 'dir'; }
    D.className = 'dlg ' + kind + (anim && s.loud ? ' loud' : '');
    D.style.display = text ? '' : 'none';
    if (who) {
      D.style.setProperty('--cut', '13%');
      if (cut.dataset.who !== who) { cut.innerHTML = `<img src='${esc(AV(who))}' alt=''>`; cut.dataset.who = who; if (anim) { cut.classList.remove('fresh'); void cut.offsetWidth; cut.classList.add('fresh'); } }
      cut.style.display = '';
      nm.innerHTML = who === 'TJ' ? 'TJ Maxx<small>HOST</small>' : esc(who) + (kind === 'conf' ? '<small>CONFESSIONAL</small>' : '');
    } else { D.style.setProperty('--cut', '0%'); cut.style.display = 'none'; cut.dataset.who = ''; nm.innerHTML = ''; }
    const done = () => { say.innerHTML = `<span>${light(text, ctx)}</span>`; };
    if (!anim || !who || text.length < 30) { done(); if (anim) { say.classList.remove('punch'); void say.offsetWidth; say.classList.add('punch'); } return; }
    let i = 0; say.classList.remove('punch');
    this.typing = setInterval(() => { i += 2; say.innerHTML = `<span>${esc(text.slice(0, i))}<span class='caret'></span></span>`; if (i >= text.length) { clearInterval(this.typing); done(); } }, 20);
  }
}

function tf(x, y, z) {
  const lim = (1 - 1 / z) / 2;
  const tx = Math.max(-lim, Math.min(lim, .5 - x)), ty = Math.max(-lim, Math.min(lim, .5 - y));
  return `scale(${z}) translate(${(tx * 100).toFixed(2)}%,${(ty * 100).toFixed(2)}%)`;
}

// Names and the game's words light up once a line is complete.
function light(t, ctx) {
  const words = [...(ctx.names || []).map(n => [n, 'hn']), ...(ctx.game || []).map(g => [g, 'hg'])].filter(w => w[0]).sort((a, b) => b[0].length - a[0].length);
  if (!words.length) return esc(t);
  const re = new RegExp(`\\b(${words.map(w => w[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s')).join('|')})\\b`, 'g');
  const game = new Set((ctx.game || []));
  return esc(t).replace(re, m => `<span class='${game.has(m) ? 'hg' : 'hn'}'>${m}</span>`);
}

// The game's own count along the top: a face per side, a bar, the number the game is won on.
function tallyHtml(t) {
  return `<div class='race tally'><div class='th'>${esc(t.title)}</div>${t.rows.map(r => `<div class='r ${r.win ? 'win' : ''} ${r.mark === 'x' ? 'bad' : ''}'><div class='fs'>${r.who.slice(0, 3).map(n => `<img src='${esc(AV(n))}' title='${esc(n)}' alt=''>`).join('')}</div><div class='bar'><b style='width:${Math.round(Math.max(0, Math.min(1, r.v || 0)) * 100)}%'></b></div><div class='n'>${r.win ? '&#10003; ' : ''}${esc(r.txt)}</div></div>`).join('')}</div>`;
}

// A player's introduction package: their old show behind them (a veteran's whole career cycling through),
// the portrait sliding in, the name slammed, the facts, the seasons one by one, the badges, the rival.
function introHtml(t, anim) {
  const bgs = t.plates.map((p, i) => `<img class='ibg' src='${esc(p)}' style='animation-delay:${(i * 2.2).toFixed(1)}s;--n:${t.plates.length}' alt=''>`).join('');
  const seasons = t.career.map((c, i) => `<div class='iseason ${c.winner ? 'won' : ''}' style='animation-delay:${(.9 + i * .28).toFixed(2)}s'><b>${esc(c.where)}</b><span>${esc(c.result)}${c.wins ? ` · ${c.wins} wins` : ''}</span></div>`).join('');
  return `<div class='intro ${anim ? '' : 'still'} ${t.plates.length > 1 ? 'multi' : ''}'>${bgs}<div class='igrade'></div><div class='iscan'></div>
    <div class='iface'><img src='${esc(AV(t.n))}' alt=''></div>
    <div class='itext'><div class='ikick'>${t.rookie ? 'ROOKIE' : 'VETERAN'}${t.show ? ` · ${esc(t.show.toUpperCase())}` : ''}</div>
      <div class='iname'>${esc(t.n)}</div>
      ${t.facts.length ? `<div class='ifacts'>${t.facts.map(f => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
      ${seasons ? `<div class='iseasons'>${seasons}</div>` : ''}
      ${t.badges.length ? `<div class='ibadges'>${t.badges.map((b, i) => `<span style='animation-delay:${(1.6 + i * .2).toFixed(1)}s'>${esc(b)}</span>`).join('')}</div>` : ''}
      ${t.rival ? `<div class='irival'><img src='${esc(AV(t.rival))}' alt=''><span>RIVAL IN THE HOUSE</span><b>${esc(t.rival)}</b></div>` : ''}
      ${t.story ? `<div class='istory'>${esc(t.story)}</div>` : ''}
      ${t.tag ? `<div class='itag'>${esc(t.tag)}</div>` : ''}
    </div></div>`;
}

function duelHtml(d) {
  const row = n => {
    if (d.format === 'round' && d.score) {
      const max = d.max || Math.max(2, ...Object.values(d.score));
      const k = d.score[n] || 0;
      return `<div class='r ${d.ahead === n || d.done === n ? 'ahead' : ''}'><img src='${esc(AV(n))}' alt=''><div class='slots'>${Array.from({ length: max }, (_, i) => `<i class='${i < k ? (d.done === n ? 'lock' : 'on') : ''}'></i>`).join('')}</div><div class='n'>${k}</div></div>`;
    }
    const k = Math.max(0, Math.min(12, (d.prog || {})[n] || 0));
    return `<div class='r ${d.ahead === n || d.done === n ? 'ahead' : ''}'><img src='${esc(AV(n))}' alt=''><div class='slots'>${Array.from({ length: 12 }, (_, i) => `<i class='${i < k ? (k >= 12 ? 'lock' : 'on') : ''}'></i>`).join('')}</div><div class='n'>${d.format === 'hold' ? (d.done && d.done !== n ? 'OUT' : '&#9650;') : k}</div></div>`;
  };
  return `<div class='duelhud'>${row(d.a)}${row(d.b)}</div>`;
}

// A title card for a decision (the user, 2026-10-15: "title screens for important decisions, like in
// Big Brother"): it holds the screen until Next, the plate dimmed behind it, the faces of who it is about.
function titleCard(c) {
  const faces = c.faces || [];
  const face = (n, k) => `<div class='tf' style='animation-delay:${(.35 + k * .12).toFixed(2)}s'><img src='${esc(AV(n))}' alt=''><b>${esc(n)}</b></div>`;
  const row = c.vs && faces.length === 2 ? `${face(faces[0], 0)}<div class='tvs'>VS</div>${face(faces[1], 1)}` : faces.slice(0, 8).map(face).join('');
  return `<div class='tcard ${c.vs ? 'isvs' : ''}'><div class='ttape t1'></div><div class='ttape t2'></div><div class='tin'>`
    + `<div class='tk'>${esc(c.k)}</div><div class='tt'>${esc(c.t)}</div>${c.sub ? `<div class='ts'>${esc(c.sub)}</div>` : ''}`
    + (faces.length ? `${c.facesLabel ? `<div class='tl'>${esc(c.facesLabel)}</div>` : ''}<div class='tfaces'>${row}</div>` : '')
    + `<div class='tgo'>&#9654; Play on</div></div></div>`;
}

// The villa's rooms by name, under each pin, so a bubble says where it is (the user, 2026-10-15: "many
// overlap, so I don't know which room it is in").
const ROOM_NAME = { common: 'Common room', kitchen: 'Kitchen', gym: 'Gym', hottub: 'Hot tub', pool: 'Pool', loungers: 'Loungers',
  'bunk-a': 'Bedroom', 'bunk-b': 'Bedroom', confessional: 'Confessional', dining: 'Dining', bathroom: 'Bathroom', entrance: 'Entrance' };
// Pins far enough apart to read: a pin that would sit on one already placed moves down below it.
function spread(pins) {
  const out = [];
  for (const p of pins) {
    let u = Math.min(0.88, Math.max(0.12, p.u)), v = Math.max(0.26, p.v);   // inside the frame, below the clock and the tabs
    for (let k = 0; k < 6 && out.some(q => Math.abs(q.u - u) < 0.14 && Math.abs(q.v - v) < 0.16); k++) v += 0.1;
    out.push({ ...p, u, v: Math.min(v, 0.82) });
  }
  return out;
}
function pinHtml(p, label, { zone = '', extra = '' } = {}) {
  const bubs = p.r.bubs || [];
  const gos = bubs.map(x => x.go).join(',');
  const shown = bubs.slice(0, 3);
  return `<div class='mpin ${bubs.length ? 'live' : 'quiet'} ${extra}' style='left:${p.u * 100}%;top:${p.v * 100}%' data-zone='${esc(zone)}' data-gos='${gos}' data-label='${esc(label)}'>`
    + `<div class='bubs'>${shown.map(x => `<div class='bub ${x.star ? 'star' : ''}' data-go='${x.go}'>${esc(x.bub)}</div>`).join('')}${bubs.length > 3 ? `<div class='bub more'>+${bubs.length - 3} more</div>` : ''}</div>`
    + `${(p.r.who || []).length ? `<div class='faces'>${p.r.who.slice(0, 5).map(n => `<img src='${esc(AV(n))}' title='${esc(n)}' alt=''>`).join('')}</div>` : `<i class='mdot'></i>`}<div class='mlbl'>${esc(label)}</div></div>`;
}
// The island is the map: every place on it is a pin; the villa is one of them, and clicking it goes inside to
// its rooms (the user, 2026-10-15: "the island map should be the default map, with events all over the possible
// locations, like a video game"; "click a part of the map and go there, with a zoom, like Big Brother").
function mapHtml(m, plate) {
  let h = '';
  const isle = m.isle || [];
  const night = /night/.test(plate);
  const spots = marks('map-day').filter(x => x.kind === 'spot');
  const NAMES = { villa: 'The Villa', arena: 'The Arena', summit: 'The Summit', 'overnight-camp': 'The Camp', airstrip: 'The Airstrip', gorge: 'The Gorge',
    bridge: 'The Bridge', 'tiki-path': 'The Tiki Path', 'beach-field': 'The Field', lookout: 'The Lookout', club: 'The Beach Club', lagoon: 'The Lagoon',
    dock: 'The Dock', beach: 'The Beach', 'cliff-jump': 'The Cliff', gazebo: 'The Gazebo' };
  // inside the villa: who is in it, and how many conversations
  const inVilla = { who: [...new Set(m.rooms.flatMap(r => r.who || []))].slice(0, 5), bubs: [] };
  const nVilla = m.rooms.reduce((n, r) => n + r.bubs.length, 0);
  const ipins = spread(spots.map(sp => {
    if (sp.id === 'villa') return { u: sp.u, v: sp.v, r: inVilla, villa: true };
    const r = isle.find(x => x.at === sp.id) || { at: sp.id, who: [], bubs: [] };
    return { u: sp.u, v: sp.v, r };
  }).sort((x, y) => x.v - y.v));
  h += `<div class='mview isle' style="background-image:url('${PLATE(night ? 'map-night' : 'map-day')}.webp')">`
    + ipins.map(p => (p.villa
      ? `<div class='mpin villa-pin live' style='left:${p.u * 100}%;top:${p.v * 100}%' data-enter='villa' data-label='The Villa'><div class='bubs'><div class='bub enter'>${nVilla ? `${nVilla} conversation${nVilla > 1 ? 's' : ''} inside` : 'Go inside'}</div></div>`
        + `${inVilla.who.length ? `<div class='faces'>${inVilla.who.map(n => `<img src='${esc(AV(n))}' title='${esc(n)}' alt=''>`).join('')}</div>` : `<i class='mdot'></i>`}<div class='mlbl'>The Villa</div></div>`
      : pinHtml(p, p.r.place || NAMES[p.r.at] || p.r.at, { zone: p.r.at }))).join('') + '</div>';
  // the villa's rooms: every room on the plan, the ones with somebody in them lit
  const rooms = marks(plate).filter(x => x.kind === 'spot');
  const vpins = spread(rooms.map(sp => ({ u: sp.u, v: sp.v, r: m.rooms.find(x => x.at === sp.id) || { at: sp.id, who: [], bubs: [] } })).sort((x, y) => x.v - y.v));
  h += `<div class='mview villa'>${vpins.map(p => pinHtml(p, ROOM_NAME[p.r.at] || p.r.at, { zone: p.r.at })).join('')}`
    + `<button type='button' class='mback' data-mview='isle'>&#9664; The island</button></div>`;
  if (m.later.length) h += `<div class='later'>${m.later.map(l => `<div class='bub ${l.star ? 'star' : ''}' data-go='${l.go}'>${esc(l.bub)}</div>`).join('')}</div>`;
  if (m.hint) h += `<div class='mhint'>Click a place to go there. Forward plays them in order.</div>`;
  h += `<div class='clock'>${m.clock.map(([t, k]) => `<span class='${k}'>${k === 'done' ? '&#10003; ' : k === 'lock' ? '&#128274; ' : ''}${esc(t)}</span>`).join('')}</div>`;
  return h;
}
