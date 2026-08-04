// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/dough.js — "The Trough"
//
// The themed screen for js/bb-comps/classics.js → Rollin' in the Dough
// (`variant: 'dough'`).
//
// The competition is a yard filled thigh-deep with raw dough, and the screen
// is made of that and nothing else. Pale, warm, soft and slightly disgusting:
// everything on it is a blob rather than a box. No panel here has a uniform
// corner radius — every card is cut with four different ones so it sits like
// something that was dropped rather than drawn, the whole thing settles with a
// squash when it lands, and flour drifts across the yard the entire time.
//
// The instrument is what the houseguests actually do. Each trip is an ARMFUL:
// a clump of dough sized by how much they went in with, coins pushed into it
// and showing at the surface. Greedy trips are visibly bigger clumps. A
// spilled trip is not a struck-through bar — it is a splat, with its coins
// sinking back into the pit where nobody is getting them again. The vault at
// the end of the row is a glass jar, and it fills with what actually survived
// the wall.
//
// Declines when the trip data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

/** A stable 0..n-1 from a name, for blob shapes — decoration, never outcome. */
function hash(str, n) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  return n ? h % n : h;
}

/** Four different corner radii, so nothing on this screen is a rectangle. */
const blob = seed => {
  const r = k => 30 + ((seed >> (k * 3)) % 9) * 6;
  return `${r(0)}% ${r(1)}% ${r(2)}% ${r(3)}% / ${r(3)}% ${r(2)}% ${r(1)}% ${r(0)}%`;
};

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigDough(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withTrips = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.trips) && v.trips.length);
  if (!withTrips.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PHYSICAL', accent: '#e8c88a' };
  const CRUST = '#c08a4a';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_dough_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 53 + salt * 37 + pool.length) % pool.length];

  const RUN_FLAV = [
    'Nothing is bagged. Everything is carried in the arms, which is the whole competition.',
    'The wall is the slow part. Almost nobody works that out in time.',
    'Coins that go into the dough are not coming back out of it tonight.',
    'A big armful is worth more and drops more, and both are true every trip.',
    'The pit is thigh-deep and gets deeper wherever somebody has already been.',
    'It gets into the hair almost immediately and stays there for two days.',
  ];
  const WIN_FLAV = [
    'The pit gets drained. It takes longer than the competition did.',
    'Won by whoever was least greedy on the third trip.',
    'The jars get counted out loud. One of them is nearly empty.',
    'Everybody is the same colour by the end. The totals are not.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.trips ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withTrips.length;
  steps.push({ kind: 'win' });

  if (sealed) {
    const keep = planSeal(steps, {
      countKind: 'run', cap: Math.max(2, Math.ceil(fieldSize / 2)),
      isResult: st => st.kind === 'win',
    });
    steps = steps.slice(0, keep);
    steps.push({ kind: 'cut' }, { kind: 'irony' });
  }

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  const shown = steps.slice(0, revealed).filter(s => s.kind === 'run' && breakdown[s.name])
    .map(s => ({ name: s.name, ...breakdown[s.name] }))
    .sort((a, b) => (b.vault ?? -1) - (a.vault ?? -1));

  const biggestLoad = Math.max(6, ...withTrips.flatMap(([, v]) => (v.trips || []).map(t => t.load || 0)));
  const bestVault = Math.max(1, ...withTrips.map(([, v]) => v.vault || 0));

  /**
   * The armfuls.
   *
   * Each trip is a clump of dough sized by what they picked up, with the coins
   * pushed into it and showing. A spilled trip is a splat: the clump is flat,
   * and its coins are drawn sinking rather than sitting.
   */
  const armfuls = (list, who) => `<div class="dgh-pit">
    ${list.map((t, k) => {
    const load = t.load || 0;
    const size = 26 + Math.round((load / biggestLoad) * 30);
    const coins = Math.max(1, Math.min(6, Math.round(load / 3)));
    const shape = blob(hash(who + k, 512));
    return `<span class="dgh-armful ${t.spilled ? 'is-splat' : ''}"
        style="width:${sealed ? 34 : size}px;height:${sealed ? 34 : size}px;border-radius:${shape}"
        title="Trip ${t.trip}: ${t.spilled ? 'spilled' : `${load} coins`}">
        ${Array.from({ length: sealed ? 1 : coins }, (_, c) => `<i style="left:${18 + (c * 13) % 60}%;top:${
  22 + (c * 29) % 56}%"></i>`).join('')}
        <b>${sealed ? MASK : (t.spilled ? '' : load)}</b>
      </span>`;
  }).join('')}
  </div>`;

  /** The jar: what actually got over the wall. */
  const jar = bd => {
    const pct = sealed ? 0 : Math.round(((bd.vault || 0) / bestVault) * 100);
    return `<div class="dgh-jar" title="${bd.vault ?? 0} in the jar">
      <span class="dgh-lid"></span>
      <span class="dgh-glass"><span class="dgh-coins" style="height:${pct}%"></span></span>
      <b>${sealed ? MASK : (bd.vault ?? 0)}</b>
    </div>`;
  };

  const cards = steps.map((s, i) => {
    if (i > state.idx) {
      return `<div class="dgh-row is-covered" style="border-radius:${blob(hash('lock' + i, 512))}">
        <span class="dgh-lock">still in the pit</span></div>`;
    }

    if (s.kind === 'open') {
      return `<article class="dgh-row dgh-open" style="border-radius:${blob(hash('open', 512))}">
        <div class="dgh-text"><span class="dgh-chip">${E(s.beat.badgeText || 'THE PIT')}</span>
          <p class="dgh-body">${E(s.beat.text)}</p></div>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('dgh', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still wading', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('dgh', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="dgh-row dgh-win" style="border-radius:${blob(hash(winner, 512))}">
        <div class="dgh-who"><figure>${AV(winner, 46)}</figure><b>${E(winner)}</b>
          <em>${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</em></div>
        <div class="dgh-text">
          <p class="dgh-body">${E(winner)} banked ${sealed ? MASK : (w.vault ?? 0)} across ${
  sealed ? MASK : (w.trips || []).length} trips${w.spills ? `, and gave ${w.spills === 1 ? 'one armful' : `${w.spills} armfuls`} back to the pit on the way` : ' without dropping a single coin'}.</p>
          <p class="dgh-flav">${E(flav(WIN_FLAV, i))}</p>
        </div>
        ${jar(w)}
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="dgh-row dgh-note" style="border-radius:${blob(hash('note' + i, 512))}">
        <div class="dgh-text"><span class="dgh-chip is-quiet">${E(s.beat.badgeText || '')}</span>
          <p class="dgh-body">${E(s.beat.text)}</p></div>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    return `<article class="dgh-row dgh-run ${(bd.spills || 0) >= 2 ? 'is-messy' : ''} ${bd.threw ? 'is-threw' : ''}"
        style="border-radius:${blob(hash(s.name, 512))}">
      <div class="dgh-who">
        <figure>${AV(s.name, 40)}</figure>
        <b>${E(s.name)}</b>
        <em>${sealed ? MASK : E(s.beat.badgeText || '')}</em>
      </div>
      <div class="dgh-text">
        <p class="dgh-body">${E(s.beat.text)}</p>
        ${armfuls(bd.trips || [], s.name)}
        <div class="dgh-meta">
          <span>trips <b>${sealed ? MASK : (bd.trips || []).length}</b></span>
          <span>dropped <b>${sealed ? MASK : (bd.spills ?? 0)}</b></span>
          <span>biggest armful <b>${sealed ? MASK : (bd.bestLoad ?? 0)}</b></span>
          ${bd.haveNot ? '<span>have-not <b>yes</b></span>' : ''}
        </div>
        <p class="dgh-flav">${E(flav(RUN_FLAV, i))}</p>
      </div>
      ${jar(bd)}
    </article>`;
  }).join('');

  // The shelf of jars, along the bottom.
  const shelf = sealed ? '' : `<div class="dgh-shelf">
    <span class="dgh-shelfk">ON THE SHELF</span>
    ${shown.length ? shown.map((r, i) => `<span class="dgh-jarlet ${i === 0 ? 'is-top' : ''}">
      <s style="height:${Math.round(((r.vault || 0) / bestVault) * 100)}%"></s>
      <i>${E(String(r.name).split(' ')[0])}</i><b>${E(r.vault)}</b></span>`).join('')
    : '<span class="dgh-shelfe">nothing on it yet</span>'}
  </div>`;

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigdough">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Inter:wght@400;500&display=swap');
  .sigdough{--dg-dough:#e9dcc0;--dg-dough2:#d8c8a4;--dg-crust:${CRUST};--dg-flour:#fff8ec;
    --dg-coin:#f0b429;--dg-deep:#3a2c1c;--dg-dim:#bda887;
    max-width:1100px;margin:0 auto;color:#f6ecd9;font-family:Inter,system-ui,sans-serif;
    background:
      radial-gradient(circle at 18% 12%,rgba(233,220,192,.14),transparent 34%),
      radial-gradient(circle at 76% 42%,rgba(233,220,192,.1),transparent 30%),
      linear-gradient(180deg,#4a3826,#2b2013 82%);
    padding:0;position:relative;overflow:clip}

  /* flour, drifting across the yard the whole time */
  .dg-flour{position:absolute;inset:0;pointer-events:none;z-index:0}
  .dg-flour i{position:absolute;width:3px;height:3px;border-radius:50%;background:var(--dg-flour);
    opacity:.4;animation:dgDrift 9s linear infinite}
  @keyframes dgDrift{
    0%{transform:translate(0,-8px);opacity:0}
    12%{opacity:.5}
    100%{transform:translate(26px,340px);opacity:0}}

  .dg-head{position:relative;z-index:1;padding:16px 16px 13px}
  .dg-week{font-family:'Baloo 2',system-ui,sans-serif;font-size:10px;letter-spacing:2.6px;color:#c9b48c}
  .dg-name{font-family:'Baloo 2',system-ui,sans-serif;font-weight:700;font-size:36px;line-height:1.05;
    color:var(--dg-dough);text-shadow:0 3px 0 rgba(0,0,0,.28);margin:1px 0 2px}
  .dg-sub{font-family:'Baloo 2',system-ui,sans-serif;font-size:11.5px;color:#cdb994}
  .dg-sealed{margin-top:8px;display:inline-block;font-family:'Baloo 2',sans-serif;font-size:10px;
    letter-spacing:2px;color:var(--dg-deep);background:var(--dg-dough);padding:3px 12px;
    border-radius:40% 60% 55% 45% / 55% 45% 60% 40%}
  /* the surface of the pit, wobbling under the header */
  .dg-surface{height:14px;background:
    radial-gradient(ellipse 30px 10px at 12% 40%,var(--dg-dough2),transparent 70%),
    radial-gradient(ellipse 40px 12px at 42% 60%,var(--dg-dough2),transparent 70%),
    radial-gradient(ellipse 34px 10px at 74% 35%,var(--dg-dough2),transparent 70%),
    linear-gradient(180deg,var(--dg-dough),var(--dg-dough2));
    animation:dgWobble 6s ease-in-out infinite}
  @keyframes dgWobble{50%{transform:scaleY(1.35)}}

  .dg-body{position:relative;z-index:1;padding:13px 16px 0}
  .dgh-what{padding:10px 13px;margin-bottom:13px;background:rgba(233,220,192,.1);
    border-radius:44% 56% 52% 48% / 8% 9% 9% 8%}
  .dgh-what b{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:16px;color:var(--dg-dough)}
  .dgh-what-c{font-family:'Baloo 2',sans-serif;font-size:9px;letter-spacing:1.6px;color:var(--dg-coin);
    margin-right:8px}
  .dgh-what-d{font-size:12.5px;line-height:1.62;color:#e2d3b8;margin:5px 0 0}
  .dgh-w{display:flex;flex-wrap:wrap;gap:11px;margin-top:8px}
  .dgh-w span{font-family:'Baloo 2',sans-serif;font-size:9px;color:#bda887;display:flex;align-items:center;gap:5px}
  .dgh-w s{display:block;width:38px;height:7px;background:rgba(233,220,192,.2);text-decoration:none;
    border-radius:9px}
  .dgh-w s b{display:block;height:100%;background:var(--dg-dough);border-radius:9px}

  /* every run is a trough of dough — nothing here is a rectangle */
  .dgh-row{display:grid;grid-template-columns:126px 1fr 54px;gap:13px;align-items:center;
    padding:13px 15px;margin-bottom:11px;
    background:linear-gradient(180deg,rgba(233,220,192,.13),rgba(58,44,28,.5));
    box-shadow:inset 0 2px 0 rgba(255,248,236,.12),0 6px 14px rgba(0,0,0,.3);
    animation:dgPlop .34s cubic-bezier(.2,1.5,.4,1) both}
  @keyframes dgPlop{from{opacity:0;transform:scale(.94) translateY(-6px)}to{opacity:1;transform:none}}
  .dgh-row.is-covered{grid-template-columns:1fr;justify-items:center;opacity:.28;animation:none;
    background:linear-gradient(180deg,var(--dg-dough2),#a8946f);padding:14px}
  .dgh-lock{font-family:'Baloo 2',sans-serif;font-size:11px;color:var(--dg-deep)}
  .dgh-row.is-messy{box-shadow:inset 0 2px 0 rgba(255,248,236,.12),0 6px 14px rgba(0,0,0,.3),
    0 0 0 2px rgba(192,138,74,.4)}
  .dgh-row.is-threw{opacity:.7}
  .dgh-open,.dgh-note{grid-template-columns:1fr}

  .dgh-who{display:flex;flex-direction:column;gap:4px}
  .dgh-who figure{margin:0}
  .dgh-who .bb-av{border-radius:52% 48% 45% 55% / 50% 55% 45% 50%;border:2px solid var(--dg-dough)}
  .dgh-who b{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:15px;color:var(--dg-dough)}
  .dgh-who em{font-style:normal;font-family:'Baloo 2',sans-serif;font-size:9px;letter-spacing:1.2px;
    color:var(--dg-coin)}
  .dgh-text{min-width:0}
  .dgh-chip{display:inline-block;font-family:'Baloo 2',sans-serif;font-size:9px;letter-spacing:1.4px;
    color:var(--dg-deep);background:var(--dg-dough);padding:2px 10px;margin-bottom:6px;
    border-radius:46% 54% 50% 50% / 55% 45% 55% 45%}
  .dgh-chip.is-quiet{background:rgba(233,220,192,.32)}
  .dgh-body{font-size:13.5px;line-height:1.62;margin:0;color:#f3e8d3}
  .dgh-flav{font-family:'Baloo 2',sans-serif;font-size:11px;color:#bda887;margin:7px 0 0}

  /* armfuls of dough with the coins showing */
  .dgh-pit{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:10px 0 8px;padding:9px 11px;
    background:linear-gradient(180deg,rgba(58,44,28,.55),rgba(30,22,13,.5));
    border-radius:30% 70% 66% 34% / 12% 14% 12% 14%}
  .dgh-armful{position:relative;flex:none;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle at 34% 30%,var(--dg-flour),var(--dg-dough) 42%,var(--dg-dough2));
    box-shadow:inset -3px -4px 7px rgba(140,116,80,.5),0 3px 6px rgba(0,0,0,.35);
    transition:transform .25s}
  .dgh-armful:hover{transform:scale(1.06) rotate(-2deg)}
  .dgh-armful i{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--dg-coin);
    box-shadow:inset 0 -1px 0 rgba(120,80,10,.6),0 0 5px rgba(240,180,41,.45)}
  .dgh-armful b{position:relative;font-family:'Baloo 2',sans-serif;font-weight:700;font-size:12px;
    color:#6b5330}
  .dgh-armful.is-splat{height:16px!important;
    border-radius:52% 48% 40% 60% / 90% 88% 12% 10%!important;
    background:radial-gradient(ellipse at 50% 40%,var(--dg-dough2),#a8946f);
    box-shadow:inset 0 -2px 5px rgba(110,88,58,.6)}
  .dgh-armful.is-splat i{opacity:.45;box-shadow:none;background:#9d7c3e}

  .dgh-meta{display:flex;flex-wrap:wrap;gap:14px;font-family:'Baloo 2',sans-serif;font-size:10px;
    color:#bda887}
  .dgh-meta b{color:var(--dg-dough);font-size:13px}

  /* the jar at the end of the trough */
  .dgh-jar{display:flex;flex-direction:column;align-items:center;gap:3px}
  .dgh-lid{width:34px;height:6px;border-radius:4px 4px 2px 2px;background:var(--dg-crust);
    box-shadow:inset 0 -2px 0 rgba(0,0,0,.25)}
  .dgh-glass{position:relative;width:30px;height:52px;border-radius:5px 5px 12px 12px;overflow:hidden;
    background:rgba(255,248,236,.12);box-shadow:inset 0 0 0 2px rgba(255,248,236,.28),
      inset -4px 0 6px rgba(255,255,255,.16)}
  .dgh-coins{position:absolute;left:0;right:0;bottom:0;transition:height .55s ease;
    background:repeating-linear-gradient(180deg,var(--dg-coin) 0 4px,#d99a1c 4px 7px)}
  .dgh-jar b{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:13px;color:var(--dg-coin)}

  .dgh-win{background:linear-gradient(180deg,rgba(240,180,41,.22),rgba(58,44,28,.5))}

  /* the shelf of jars */
  .dgh-shelf{display:flex;align-items:flex-end;gap:9px;overflow-x:auto;margin-top:13px;padding:10px 12px 8px;
    background:linear-gradient(180deg,transparent,rgba(192,138,74,.22));
    border-bottom:4px solid var(--dg-crust)}
  .dgh-shelfk{font-family:'Baloo 2',sans-serif;font-size:9px;letter-spacing:1.6px;color:#bda887;flex:none;
    padding-bottom:4px}
  .dgh-jarlet{position:relative;flex:none;width:34px;height:44px;border-radius:4px 4px 10px 10px;
    overflow:hidden;background:rgba(255,248,236,.12);box-shadow:inset 0 0 0 2px rgba(255,248,236,.25);
    display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:2px}
  .dgh-jarlet s{position:absolute;left:0;right:0;bottom:0;text-decoration:none;
    background:repeating-linear-gradient(180deg,var(--dg-coin) 0 4px,#d99a1c 4px 7px)}
  .dgh-jarlet i{position:relative;font-style:normal;font-family:'Baloo 2',sans-serif;font-size:8px;
    color:#4a3a1c;font-weight:600}
  .dgh-jarlet b{position:relative;font-family:'Baloo 2',sans-serif;font-size:11px;color:#3a2c10}
  .dgh-jarlet.is-top{box-shadow:inset 0 0 0 2px var(--dg-coin)}
  .dgh-shelfe{font-family:'Baloo 2',sans-serif;font-size:10px;color:#bda887}

  .dgh-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;align-items:center;
    padding:11px;background:linear-gradient(180deg,rgba(43,32,19,0),rgba(43,32,19,.97) 45%)}
  .dgh-count,.dgh-done{font-family:'Baloo 2',sans-serif;font-size:10px;letter-spacing:1.6px;color:#bda887}
  .dgh-done{color:var(--dg-dough)}

  ${sealCss('dgh', CRUST)}
  @media(max-width:700px){
    .dg-name{font-size:26px}
    .dgh-row{grid-template-columns:1fr;gap:9px}
    .dgh-who{flex-direction:row;align-items:center}
    .dgh-jar{flex-direction:row;gap:7px}
    .dgh-glass{width:60px;height:26px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigdough *,.sigdough *::before,.sigdough *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="dg-flour" aria-hidden="true">${Array.from({ length: 16 }, (_, k) =>
    `<i style="left:${(k * 6.4 + 3) % 97}%;top:${(k * 13) % 70}%;animation-delay:${(k * 0.55).toFixed(2)}s"></i>`).join('')}</div>

  <div class="dg-head">
    <div class="dg-week">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
    <div class="dg-name">${E(comp.name || "Rollin' in the Dough")}</div>
    <div class="dg-sub">thigh-deep &middot; carried in the arms &middot; over the wall anyway</div>
    ${sealed ? `<div class="dg-sealed">RESULT SEALED${done ? ' — THE HOUSE NEVER FINDS OUT' : ''}</div>` : ''}
  </div>
  <div class="dg-surface" aria-hidden="true"></div>

  <div class="dg-body">
    <div class="dgh-what">
      <span class="dgh-what-c">${E(cat.label)}</span><b>${E(comp.name || "Rollin' in the Dough")}</b>
      ${comp.desc ? `<p class="dgh-what-d">${E(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="dgh-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
      ${(comp.excluded || []).filter(Boolean).length ? `<p class="dgh-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
    </div>

    ${cards}
    ${shelf}
  </div>

  <div class="dgh-ctrl">
    ${done ? `<span class="dgh-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE PIT IS DRAINED.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.dgh-row:not(.is-covered)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Into the pit' : 'Pull the next out'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="dgh-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
