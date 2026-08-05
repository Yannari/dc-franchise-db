// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/hanoi.js — "The Tiki Tower"
//
// The themed screen for js/bb-comps/classics.js → Tower of Hanoi
// (`variant: 'hanoi'`).
//
// A sunset beach, and the tower is a tiki totem. Three bamboo poles planted in
// black volcanic sand, five carved rings stacked widest-to-narrowest, and one
// rule: a wide ring may never come down on a narrow one. Put one down wrong
// and a conch sounds — and the tide comes in, takes the whole thing back to
// the first pole, and you start the four minutes again.
//
// Every mechanic gets its island: the horn is a conch, a reset is a wave, the
// clock is the sun going down, and a finished tower is crowned with a lei. The
// pegs are drawn as real carved rings with tapa banding rather than boxes,
// because the totem going back up is the only thing anybody is watching.
//
// Declines when the tower data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const DISCS = 5;
/** Carved-ring colours, widest to narrowest — sun-bleached wood into dark koa. */
const RING = ['#e8b163', '#dc9448', '#c87a3a', '#a75f2f', '#7f4526'];

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigHanoi(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withTowers = Object.entries(breakdown).filter(([, v]) => Number.isFinite(v?.reached));
  if (!withTowers.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PUZZLE', accent: '#ffb347' };
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_hanoi_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 37 + salt * 19 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The solution is longer than it looks and it is the same length for everybody.',
    'Narrow onto wide. That is the whole rule, and it ends most of these.',
    'The conch for a wrong ring is louder than the conch for finishing.',
    'Nobody out here is slow. People are wrong at speed.',
    'The rings go back to the first pole by themselves, which is the worst part.',
    'The sun is going down at exactly the rate the clock is.',
  ];
  const WIN_FLAV = [
    'The poles get pulled out of the sand. Two people are still at theirs, working it out.',
    'A competition where being confident cost more than being slow.',
    'The totem comes apart in four seconds. It went up in four minutes.',
    'Everybody knew the rule. That was never the difficulty.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who] ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withTowers.length;
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
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  // The sun sits where the field is: high while everybody is still building,
  // on the water by the time the last tower is called.
  const sunPct = Math.round(100 * (shown.length / Math.max(1, fieldSize)));

  /** Three bamboo poles in black sand, carved rings stacked on two of them. */
  const totem = bd => {
    const built = sealed ? 0 : Math.round((bd.reached || 0) * DISCS);
    const left = DISCS - built;
    const ring = (size, cls, k) => `<i class="tik-ring ${cls}" style="width:${26 + size * 13}px;
      background:${RING[size]};--k:${k}"></i>`;
    // The first pole keeps the rings nobody has moved yet, widest at the
    // bottom; the third grows the finished totem the same way.
    const poleStack = (count, from, cls) => Array.from({ length: count },
      (_, k) => ring(from - k, cls, k)).reverse().join('');
    return `<div class="tik-yard ${bd.solved && !sealed ? 'is-crowned' : ''}">
      <div class="tik-pole"><span class="tik-rings">${poleStack(left, left - 1, 'is-waiting')}</span>
        <b class="tik-pn">I</b></div>
      <div class="tik-pole"><span class="tik-rings"></span><b class="tik-pn">II</b></div>
      <div class="tik-pole is-target"><span class="tik-rings">${poleStack(built, DISCS - 1, 'is-set')}</span>
        <b class="tik-pn">III</b></div>
      <span class="tik-pct">${sealed ? MASK : `${Math.round((bd.reached || 0) * 100)}%`}</span>
    </div>`;
  };

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="tik-card is-locked"><span class="tik-lock">~ ~ ~</span></div>';

    if (s.kind === 'open') {
      return `<article class="tik-card tik-open">
        <header class="tik-hd"><span class="tik-tag">${E(s.beat.badgeText || 'THE TOWER')}</span>
          <span class="tik-sub">${fieldSize} on the sand</span></header>
        <p class="tik-body">${E(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('tik', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still building', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('tik', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="tik-card tik-win">
        <header class="tik-hd"><span class="tik-tag tik-tag-gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
          <span class="tik-sub">${w.solved ? 'tower complete' : 'furthest up'}</span></header>
        <div class="tik-win-b">
          <figure class="tik-win-av">${AV(winner, 74)}<span class="tik-lei" aria-hidden="true"></span></figure>
          <div>
            <div class="tik-win-n">${E(winner)}</div>
            <p class="tik-body">${w.solved
    ? `${E(winner)} rebuilt the whole totem in ${sealed ? MASK : `${Math.round(w.seconds || 0)} seconds`}${
      w.resets ? `, sent back to the first pole ${w.resets === 1 ? 'once' : `${w.resets} times`} on the way` : ' without one wrong ring'}.`
    : `Nobody finished it. ${E(winner)} was furthest up the pole when the sun went.`}</p>
          </div>
        </div>
        <p class="tik-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="tik-card tik-open">
        <header class="tik-hd"><span class="tik-tag tik-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="tik-body">${E(s.beat.text)}</p>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const resets = bd.resets || 0;
    return `<article class="tik-card tik-run ${bd.solved ? 'is-solved' : ''} ${bd.threw ? 'is-threw' : ''}">
      <header class="tik-hd">
        <span class="tik-runner">${AV(s.name, 34)}<b>${E(s.name)}</b></span>
        <span class="tik-tag ${bd.solved ? 'tik-tag-gold' : resets >= 3 ? 'tik-tag-red' : ''}">${
  sealed ? MASK : E(s.beat.badgeText || '')}</span>
      </header>
      <p class="tik-body">${E(s.beat.text)}</p>
      ${totem(bd)}
      ${!sealed && resets ? `<div class="tik-conch">${Array.from({ length: Math.min(4, resets) },
    (_, k) => `<span class="tik-wave" style="--w:${k}">
        <svg viewBox="0 0 46 16" aria-hidden="true"><path d="M1 11q5-8 11 0t11 0 11 0 11 0" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        CONCH &mdash; TAKEN BACK</span>`).join('')}</div>` : ''}
      <div class="tik-nums">
        <span><i>TIME</i><b>${sealed ? MASK : `${Math.round(bd.seconds || 0)}s`}</b></span>
        <span><i>CONCHES</i><b>${sealed ? MASK : resets}</b></span>
        <span><i>BUILT</i><b>${sealed ? MASK : `${Math.round((bd.reached || 0) * 100)}%`}</b></span>
        ${bd.haveNot ? '<span><i>HAVE-NOT</i><b>yes</b></span>' : ''}
      </div>
      <p class="tik-flav">${E(flav(RUN_FLAV, i))}</p>
    </article>`;
  }).join('');

  const board = sealed ? '' : `<aside class="tik-side">
    <div class="tik-side-h"><span class="tik-k">THE SAND</span>
      <span class="tik-side-r">${shown.length} / ${fieldSize} built</span></div>
    ${shown.length ? shown.map((r, i) => `<div class="tik-side-row ${i === 0 ? 'is-lead' : ''}">
      <span class="tik-side-p">${String(i + 1).padStart(2, '0')}</span>
      <span>${AV(r.name, 24)}</span>
      <span class="tik-side-n">${E(r.name)}</span>
      <span class="tik-side-t">${r.solved ? `${Math.round(r.seconds)}s` : `${Math.round((r.reached || 0) * 100)}%`}</span>
    </div>`).join('') : '<p class="tik-side-e">Nobody has come off the sand yet.</p>'}
  </aside>`;

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigtik">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Inter:wght@400;500;600&display=swap');
  .sigtik{--tk-ink:#fff2dd;--tk-dim:#c39a76;--tk-gold:#ffb347;--tk-sea:#2e8f97;--tk-deep:#12303a;
    --tk-line:rgba(255,179,71,.26);
    max-width:1100px;margin:0 auto;color:var(--tk-ink);
    font-family:Inter,system-ui,-apple-system,sans-serif;
    background:linear-gradient(180deg,#3a1c4a 0%,#8a3b52 26%,#e0663f 48%,#1d5a63 64%,#0c2a31 100%);
    border-radius:12px;padding:0 0 0;position:relative;overflow:clip}

  /* ── the beach ── */
  .tik-scene{position:relative;height:190px;overflow:hidden;
    border-radius:12px 12px 0 0}
  .tik-scene svg{position:absolute;inset:0;width:100%;height:100%}
  .tik-sun{position:absolute;left:50%;width:104px;height:104px;border-radius:50%;
    transform:translateX(-50%);
    background:radial-gradient(circle,#fff3c4 0%,#ffcf5c 42%,#ff8a3d 74%,rgba(255,138,61,0) 78%);
    box-shadow:0 0 70px 22px rgba(255,150,70,.42);
    top:calc(6px + var(--sun) * 0.9px);transition:top .6s ease;
    animation:tikSun 9s ease-in-out infinite}
  @keyframes tikSun{0%,100%{filter:brightness(1)}50%{filter:brightness(1.13)}}
  .tik-glare{position:absolute;left:0;right:0;bottom:0;height:74px;pointer-events:none;
    background:repeating-linear-gradient(180deg,rgba(255,214,150,.30) 0 2px,transparent 2px 7px);
    mask-image:radial-gradient(ellipse 40% 100% at 50% 100%,#000 0%,transparent 72%);
    -webkit-mask-image:radial-gradient(ellipse 40% 100% at 50% 100%,#000 0%,transparent 72%);
    animation:tikGlare 7s ease-in-out infinite}
  @keyframes tikGlare{0%,100%{opacity:.55}50%{opacity:.9}}

  .tik-head{position:relative;z-index:3;text-align:center;padding:16px 16px 0}
  .tik-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:3.4px;
    color:rgba(255,242,221,.72)}
  .tik-title{font-family:Pacifico,'Brush Script MT',cursive;font-size:44px;line-height:1.05;
    color:#fff3d6;text-shadow:0 3px 0 rgba(120,40,20,.45),0 0 34px rgba(255,179,71,.55);margin:2px 0}
  .tik-tagline{font-size:11px;letter-spacing:2px;color:#ffe0b0}

  .tik-body-wrap{padding:14px 14px 0;position:relative;z-index:3;
    background:linear-gradient(180deg,rgba(8,26,31,.55),rgba(6,20,24,.9) 22%)}

  /* ── the what-it-is panel ── */
  .tik-what{border:1px solid var(--tk-line);border-radius:12px;padding:10px 12px;margin-bottom:12px;
    background:rgba(255,179,71,.06)}
  .tik-what-h{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  .tik-what-c{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
    color:var(--tk-gold);border:1px solid var(--tk-line);border-radius:3px;padding:2px 7px}
  .tik-what-h b{font-family:Pacifico,cursive;font-size:19px;color:#ffe0b0}
  .tik-what-d{font-size:12.5px;line-height:1.6;color:#f0dcc4;margin:0}
  .tik-w{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
  .tik-w span{display:flex;align-items:center;gap:5px;font-family:ui-monospace,Consolas,monospace;
    font-size:8px;letter-spacing:1.2px;color:var(--tk-dim)}
  .tik-w s{display:block;width:44px;height:3px;border-radius:2px;background:rgba(255,179,71,.18);
    text-decoration:none}
  .tik-w s b{display:block;height:100%;border-radius:2px;background:var(--tk-gold)}

  .tik-grid{display:grid;grid-template-columns:1fr 236px;gap:12px;align-items:start}
  .tik-grid-sealed{display:block}
  .tik-side{position:sticky;top:56px;border:1px solid var(--tk-line);border-radius:12px;padding:9px;
    background:rgba(10,32,38,.82)}
  .tik-side-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px}
  .tik-side-r{font-family:ui-monospace,Consolas,monospace;font-size:8px;color:var(--tk-dim)}
  .tik-k{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--tk-dim)}
  .tik-side-row{display:grid;grid-template-columns:22px 24px 1fr auto;align-items:center;gap:7px;
    padding:4px 5px;border-radius:7px;font-size:11.5px}
  .tik-side-row.is-lead{background:rgba(255,179,71,.16)}
  .tik-side-p{font-family:ui-monospace,Consolas,monospace;font-size:9px;color:var(--tk-dim)}
  .tik-side-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tik-side-t{font-family:Pacifico,cursive;color:#ffe0b0;font-size:13px}
  .tik-side-e{font-size:11px;color:var(--tk-dim);margin:0}

  /* ── cards ── */
  .tik-card{border:1px solid var(--tk-line);border-radius:12px;padding:11px 12px;margin-bottom:9px;
    background:linear-gradient(180deg,rgba(28,64,72,.72),rgba(8,24,28,.88));
    animation:tikIn .32s ease both;position:relative;overflow:hidden}
  @keyframes tikIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .tik-card.is-locked{opacity:.14;text-align:center;padding:8px;animation:none;background:none}
  .tik-lock{font-family:ui-monospace,Consolas,monospace;letter-spacing:6px;color:var(--tk-dim)}
  .tik-card.is-threw{opacity:.72;border-style:dashed}
  .tik-card.is-solved{border-color:rgba(255,179,71,.55)}
  .tik-hd{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
  .tik-runner{display:flex;align-items:center;gap:8px}
  .tik-runner .bb-av{border-radius:50%;border:2px solid rgba(255,179,71,.4)}
  .tik-runner b{font-size:13px;letter-spacing:.4px}
  .tik-tag{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
    color:var(--tk-gold);border:1px solid var(--tk-line);background:rgba(255,179,71,.1);
    padding:2px 8px;border-radius:3px}
  .tik-tag-gold{color:#3a1c0a;background:var(--tk-gold);border-color:var(--tk-gold)}
  .tik-tag-red{color:#ffd9d1;border-color:rgba(230,90,70,.55);background:rgba(230,90,70,.2)}
  .tik-tag-quiet{color:var(--tk-dim);background:none}
  .tik-sub{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.4px;color:var(--tk-dim)}
  .tik-body{font-size:13.5px;line-height:1.65;margin:0}
  .tik-flav{font-size:10.5px;color:var(--tk-dim);font-style:italic;margin:7px 0 0}

  /* ── three poles in black sand ── */
  .tik-yard{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
    align-items:end;margin:11px 0 8px;padding:14px 12px 0;height:132px;border-radius:10px;
    background:linear-gradient(180deg,rgba(46,143,151,.16),rgba(20,16,14,.9) 62%),
      radial-gradient(ellipse 70% 40% at 50% 100%,rgba(255,179,71,.14),transparent 70%);
    border:1px solid rgba(255,179,71,.16);overflow:hidden}
  .tik-yard::after{content:'';position:absolute;left:0;right:0;bottom:0;height:22px;
    background:linear-gradient(180deg,#241a14,#120d0a);
    box-shadow:inset 0 2px 0 rgba(255,179,71,.16)}
  .tik-pole{position:relative;display:flex;flex-direction:column;justify-content:flex-end;
    align-items:center;height:100%;padding-bottom:22px;z-index:2}
  .tik-pole::before{content:'';position:absolute;bottom:18px;width:7px;height:88px;border-radius:4px;
    background:linear-gradient(90deg,#8a6a34,#d8b06a 42%,#7d5c2c);
    box-shadow:0 0 0 1px rgba(0,0,0,.35)}
  .tik-pole.is-target::before{background:linear-gradient(90deg,#8a6a34,#ffe6a8 42%,#7d5c2c)}
  .tik-rings{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;z-index:2}
  .tik-ring{display:block;height:11px;border-radius:6px;
    box-shadow:inset 0 -2px 0 rgba(0,0,0,.28),0 1px 3px rgba(0,0,0,.5);
    border:1px solid rgba(60,30,10,.5);position:relative}
  .tik-ring::after{content:'';position:absolute;inset:2px 5px;border-radius:3px;
    background:repeating-linear-gradient(90deg,rgba(60,26,10,.34) 0 2px,transparent 2px 6px)}
  .tik-ring.is-set{animation:tikSet .34s cubic-bezier(.2,1.3,.4,1) both;
    animation-delay:calc(var(--k) * .08s)}
  @keyframes tikSet{from{opacity:0;transform:translateY(-26px) scale(.92)}to{opacity:1;transform:none}}
  /* Still on the first pole: present, unlit, and clearly not done yet. */
  .tik-ring.is-waiting{opacity:.62;filter:saturate(.55) brightness(.85)}
  .tik-pn{position:absolute;bottom:3px;font-family:ui-monospace,Consolas,monospace;font-size:8px;
    letter-spacing:1.6px;color:rgba(255,224,176,.7);z-index:3}
  .tik-pct{position:absolute;right:10px;top:9px;font-family:Pacifico,cursive;font-size:17px;
    color:#ffe0b0;text-shadow:0 2px 6px rgba(0,0,0,.6)}
  .tik-yard.is-crowned{box-shadow:inset 0 0 30px rgba(255,179,71,.25)}
  .tik-yard.is-crowned .tik-pole.is-target::after{content:'';position:absolute;bottom:100px;width:34px;
    height:12px;border-radius:50%;border:3px dotted #ff7fa8;opacity:.9;
    animation:tikLei 2.6s ease-in-out infinite}
  @keyframes tikLei{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-3px) rotate(4deg)}}

  /* ── the tide taking it back ── */
  .tik-conch{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0 2px}
  .tik-wave{display:flex;align-items:center;gap:5px;color:#7fd7e0;
    font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.4px;
    border:1px solid rgba(127,215,224,.32);border-radius:20px;padding:3px 9px 3px 6px;
    background:rgba(46,143,151,.14);
    animation:tikWave .5s ease both;animation-delay:calc(var(--w) * .1s)}
  @keyframes tikWave{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
  .tik-wave svg{width:26px;height:10px}

  .tik-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
  .tik-nums span{display:flex;flex-direction:column;gap:2px}
  .tik-nums i{font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:7.5px;
    letter-spacing:1.4px;color:var(--tk-dim)}
  .tik-nums b{font-family:Pacifico,cursive;font-size:16px;color:#ffe0b0}

  .tik-win{border-color:rgba(255,179,71,.6);
    background:linear-gradient(180deg,rgba(120,66,26,.6),rgba(8,24,28,.9))}
  .tik-win-b{display:flex;gap:14px;align-items:flex-start}
  .tik-win-av{margin:0;position:relative}
  .tik-win-av .bb-av{border-radius:50%;border:3px solid var(--tk-gold);
    box-shadow:0 0 28px rgba(255,179,71,.45)}
  .tik-lei{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);width:66px;height:16px;
    border-radius:50%;border:4px dotted #ff7fa8;opacity:.95}
  .tik-win-n{font-family:Pacifico,cursive;font-size:26px;color:#ffe0b0;margin-bottom:2px}

  .tik-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;
    align-items:center;padding:10px;margin:6px -14px 0;
    background:linear-gradient(180deg,rgba(6,20,24,0),rgba(6,20,24,.96) 40%)}
  .tik-count,.tik-done{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;
    color:var(--tk-dim)}
  .tik-done{color:var(--tk-gold)}

  ${sealCss('tik', '#ffb347')}
  @media(max-width:860px){.tik-grid{grid-template-columns:1fr}.tik-side{position:static;order:-1}}
  @media(max-width:700px){.tik-title{font-size:30px}.tik-scene{height:140px}
    .tik-yard{height:118px}.tik-pole::before{height:74px}}
  @media(prefers-reduced-motion:reduce){
    .sigtik *,.sigtik *::before,.sigtik *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="tik-scene" aria-hidden="true">
    <div class="tik-sun" style="--sun:${sunPct}"></div>
    <svg viewBox="0 0 600 190" preserveAspectRatio="none">
      <path d="M0 132h600v58H0z" fill="#12303a" opacity=".9"/>
      <path d="M0 132q60 8 120 0t120 0 120 0 120 0 120 0v12H0z" fill="#2e8f97" opacity=".55"/>
      <path d="M0 150q75 10 150 0t150 0 150 0 150 0v40H0z" fill="#0c2a31"/>
    </svg>
    <svg viewBox="0 0 600 190" preserveAspectRatio="xMidYMax meet">
      <g fill="#1a0f18" opacity=".92">
        <path d="M56 190V96c0-6 3-9 6-9s6 3 6 9v94z"/>
        <path d="M62 92c-16-14-36-16-48-8 14-2 30 2 44 12zM62 92c16-15 38-17 50-9-15-2-32 2-46 13z"/>
        <path d="M62 92c-13-19-12-38-2-47-3 15 0 31 8 44zM62 92c15-16 34-20 46-14-15 1-31 7-42 18z"/>
        <path d="M540 190v-78c0-5 3-8 5-8s5 3 5 8v78z"/>
        <path d="M545 108c-13-12-30-13-40-7 12-1 25 2 36 10zM545 108c13-12 31-14 41-7-12-1-26 2-37 10z"/>
        <path d="M545 108c-11-16-10-32-2-39-2 12 0 26 7 37z"/>
      </g>
      <g opacity=".9">
        <rect x="150" y="128" width="5" height="62" fill="#2b1a10"/>
        <rect x="446" y="128" width="5" height="62" fill="#2b1a10"/>
        <path d="M152.5 112c9 8 9 18 0 24-9-6-9-16 0-24z" fill="#ffb347">
          <animate attributeName="opacity" values="1;.7;1" dur="1.7s" repeatCount="indefinite"/></path>
        <path d="M448.5 112c9 8 9 18 0 24-9-6-9-16 0-24z" fill="#ffb347">
          <animate attributeName="opacity" values=".75;1;.75" dur="2.1s" repeatCount="indefinite"/></path>
      </g>
    </svg>
    <div class="tik-glare"></div>
  </div>

  <div class="tik-head">
    <div class="tik-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
    <div class="tik-title">${E(comp.name || 'Tower of Hanoi')}</div>
    <div class="tik-tagline">three poles &middot; one rule &middot; the tide takes it all back</div>
  </div>

  <div class="tik-body-wrap">
    <div class="tik-what">
      <div class="tik-what-h"><span class="tik-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Tower of Hanoi')}</b></div>
      ${comp.desc ? `<p class="tik-what-d">${E(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="tik-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
      ${(comp.excluded || []).filter(Boolean).length ? `<p class="tik-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
    </div>

    <div class="${sealed ? 'tik-grid-sealed' : 'tik-grid'}">
      <div>${cards}</div>
      ${board}
    </div>

    <div class="tik-ctrl">
      ${done ? `<span class="tik-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE POLES COME OUT OF THE SAND.'}</span>` : `
        <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.tik-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Start the clock' : 'Next tower'}</button>
        <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
      <span class="tik-count">${Math.min(total, revealed)} / ${total}</span>
    </div>
  </div>
</div>`;
}
