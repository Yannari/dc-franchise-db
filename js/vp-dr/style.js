// ══════════════════════════════════════════════════════════════════════
// vp-dr/style.js — the shell, the palette, the icons
// ══════════════════════════════════════════════════════════════════════
//
// The kit every screen is built from, lifted out of the approved mockup
// (`mockup-drag-race-vp.html`) so the seventeen builders cannot drift from
// it one screen at a time. The mockup is the source of truth; if this file
// and that file disagree, this file is wrong.
//
// ── WHAT MAKES IT READ AS A GAME RATHER THAN A RECAP ──────────────────
//
//   A HUD, not a header      episode pips, the maxi, the category, queens
//                            remaining — the state, always on.
//   A character-select rail  portraits and meters down the right, live.
//   Beveled chrome           corner-notched panels with a glowing accent
//                            rail, colour-coded by family: gold for the
//                            werk room, cyan for scoring, violet for
//                            relationships, red for the lip sync.
//   Portraits                the franchise's own cel-shaded busts are the
//                            one photographic-weight element on the page,
//                            so they carry the identity and get the frames.
//
// ── AND WHERE THE SET CAME FROM ───────────────────────────────────────
//
// Every stage primitive is a real thing, off the Fandom wiki: the
// black-and-white CHECKERED catwalk, a perimeter of bulbs on a gold border,
// 36 spotlights with hanging crystal beads, the judges' panel to the LEFT
// facing the runway, the centre arch everybody enters through, the lowered
// platform the safe queens stand on; and in the room, mirror stations with
// bulb frames, printed-vinyl brick, the neon lip, the LED "WERK" sign and
// the shelf of statuettes an eliminated queen takes with her.
//
// NO EMOJI ANYWHERE. Every icon is inline SVG; `_icon` throws on a name it
// does not know, so a typo is a crash rather than an invisible blank.
import { avatarUrl } from '../avatar-registry.js';
import { JUDGES } from '../dr/data/judges.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The five atmospheres. A screen names one; anything else is a crash. */
export const DR_PHASES = ['werk', 'stage', 'untucked', 'lipsync', 'chart'];

export const DR_CSS = `
.dr-wrap{--dr-red:#FF294B;--dr-pink:#FF3D9A;--dr-hot:#FF7BC8;--dr-violet:#7B2FF7;
  --dr-cyan:#00E5FF;--dr-gold:#FFC83D;--dr-green:#3BE08A;
  --dr-ink:#0A0207;--dr-panel:#170912;--dr-panel2:#210C1A;--dr-line:#4A1F38;
  --dr-text:#FFF0F7;--dr-dim:#C9A6BC;--dr-paper:#F4EFE4;
  position:relative;z-index:2;max-width: 1100px;margin:0 auto;padding:18px 18px 96px;
  color:var(--dr-text);font:15px/1.55 'Helvetica Neue',Helvetica,Arial,sans-serif}
.dr-disp{font-family:Impact,Haettenschweiler,'Arial Narrow Bold','Franklin Gothic Bold',sans-serif;
  letter-spacing:.02em;text-transform:uppercase;font-weight:400}
.dr-fash{font-family:Didot,'Bodoni MT','Playfair Display',Georgia,'Times New Roman',serif;font-style:italic}
.dr-num{font-variant-numeric:tabular-nums}

/* THE ATMOSPHERE STARTS BELOW THE NAV. top: 46px, never 0 — the app's nav
   bar is 46px tall and a fixed layer at 0 paints straight over it. */
.dr-atmo{position:fixed;top: 46px;left:0;right:0;bottom:0;z-index:0;pointer-events:none}
.dr-phase-werk .dr-atmo{background:radial-gradient(1100px 420px at 50% 0%,rgba(255,61,154,.24),transparent 72%),
  radial-gradient(600px 340px at 8% 34%,rgba(255,200,61,.09),transparent 72%),
  linear-gradient(180deg,#31091A,#1A040D 55%,#0A0207)}
.dr-phase-stage .dr-atmo{background:radial-gradient(900px 420px at 50% 0%,rgba(255,61,154,.40),transparent 68%),
  radial-gradient(900px 600px at 50% 40%,rgba(123,47,247,.28),transparent 70%),
  linear-gradient(180deg,#2B0A4E,#14042A 55%,#0A0207)}
.dr-phase-untucked .dr-atmo{background:radial-gradient(800px 380px at 70% 8%,rgba(123,47,247,.26),transparent 70%),
  linear-gradient(180deg,#1B0730,#120522 60%,#0A0207)}
.dr-phase-lipsync .dr-atmo{background:radial-gradient(800px 400px at 50% 10%,rgba(255,41,75,.34),transparent 70%),
  linear-gradient(180deg,#3A0413,#1A0209 55%,#0A0207)}
.dr-phase-chart .dr-atmo{background:linear-gradient(180deg,#E9E2D2,#F4EFE4)}
.dr-phase-chart .dr-wrap{color:#1a1a1a}
.dr-brick{position:absolute;inset:0;opacity:.15;
  background-image:linear-gradient(90deg,rgba(0,0,0,.6) 2px,transparent 2px),
    linear-gradient(180deg,rgba(0,0,0,.6) 2px,transparent 2px);
  background-size:64px 26px;mask-image:linear-gradient(180deg,#000,transparent 55%)}
.dr-haze{position:absolute;inset:0;opacity:.5;
  background:radial-gradient(500px 200px at 20% 70%,rgba(255,255,255,.10),transparent 70%),
    radial-gradient(600px 240px at 80% 40%,rgba(255,123,200,.10),transparent 70%);
  animation:drDrift 26s ease-in-out infinite alternate}
@keyframes drDrift{from{transform:translate3d(-3%,0,0)}to{transform:translate3d(3%,-2%,0) scale(1.07)}}

/* ── THE HUD ── the state, always on ── */
.dr-hud{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;
  padding:11px 18px;margin-bottom:16px;border:1px solid var(--dr-line);
  background:linear-gradient(180deg,rgba(23,9,18,.97),rgba(10,2,7,.94));
  box-shadow:0 10px 30px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07)}
.dr-hud-k{font-size:9px;letter-spacing:.26em;color:var(--dr-dim)}
.dr-hud-v{font-size:19px;line-height:1.1}
.dr-hud-cat{color:var(--dr-hot);font-size:15px}
.dr-pips{display:flex;gap:4px;margin-top:4px}
.dr-pips i{width:16px;height:5px;background:#3a1a2c}
.dr-pips i.dr-p-done{background:var(--dr-red)}
.dr-pips i.dr-p-now{background:var(--dr-gold);box-shadow:0 0 10px var(--dr-gold)}
.dr-hud-left{display:flex;align-items:center;gap:9px;padding:5px 13px;
  background:rgba(255,41,75,.15);border:1px solid rgba(255,41,75,.5)}
.dr-hud-left b{font-size:23px;line-height:1;color:#fff}

/* ── BEVELED CHROME ── a game object, not a card ── */
.dr-panel{position:relative;background:linear-gradient(180deg,var(--dr-panel2),var(--dr-panel));
  border:1px solid var(--dr-line);
  clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 12px 34px rgba(0,0,0,.55)}
.dr-panel::before{content:"";position:absolute;left:0;top:14px;bottom:0;width:3px;
  background:var(--dr-accent,var(--dr-red));box-shadow:0 0 14px var(--dr-accent,var(--dr-red))}
.dr-a-room{--dr-accent:var(--dr-gold)}
.dr-a-score{--dr-accent:var(--dr-cyan)}
.dr-a-bond{--dr-accent:var(--dr-violet)}
.dr-a-lip{--dr-accent:var(--dr-red)}

/* ── SECTION TITLE ── a marquee of bulbs, the runway's real perimeter ── */
.dr-sec{margin:22px 0 14px}
.dr-bulbs{height:12px;background:linear-gradient(90deg,var(--dr-gold),#7d5500);
  display:flex;align-items:center;justify-content:space-around;padding:0 8px;overflow:hidden}
.dr-bulbs i{width:5px;height:5px;border-radius:50%;background:#fff6d8;
  box-shadow:0 0 6px 2px rgba(255,220,140,.9);animation:drChase 1.6s linear infinite}
@keyframes drChase{0%,100%{opacity:1}50%{opacity:.22}}
.dr-sec h2{margin:10px 0 1px;font-size:38px;line-height:1}
.dr-sec p{margin:0;color:var(--dr-dim);font-size:12px;letter-spacing:.16em;text-transform:uppercase}

/* ── PORTRAITS ── */
.dr-por{object-fit:cover;display:block;background:#2a0f22;border:1px solid rgba(255,255,255,.22)}
.dr-bust{position:relative;flex:0 0 auto;display:inline-block}
.dr-bust .dr-por{box-shadow:0 8px 22px rgba(0,0,0,.6)}
.dr-station::after{content:"";position:absolute;inset:-5px;pointer-events:none;
  background:radial-gradient(circle at 50% 0,rgba(255,240,200,.95) 0 1.7px,transparent 2.2px) 0 0/10px 10px repeat-x,
    radial-gradient(circle at 50% 100%,rgba(255,240,200,.95) 0 1.7px,transparent 2.2px) 0 100%/10px 10px repeat-x}
.dr-initials{display:grid;place-items:center;background:linear-gradient(160deg,#4a1030,#20060f);
  border:1px solid rgba(255,255,255,.22);color:#ffd9ec;font-weight:700}
.dr-out .dr-por,.dr-out .dr-initials{filter:grayscale(1) brightness(.45)}

/* ── LAYOUT: the screen and its rail ── */
.dr-game{display:grid;grid-template-columns:1fr 292px;gap:18px;align-items:start}
.dr-rail{position:sticky;top:60px;padding:12px;--dr-accent:var(--dr-cyan)}
.dr-rail h4{margin:0 0 10px;font-size:11px;letter-spacing:.24em;color:var(--dr-cyan)}
.dr-slot{display:grid;grid-template-columns:38px 1fr auto;gap:9px;align-items:center;
  padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.07)}
.dr-slot:last-child{border-bottom:none}
.dr-meter{height:4px;background:rgba(255,255,255,.13);margin-top:3px;overflow:hidden}
.dr-meter i{display:block;height:100%;background:linear-gradient(90deg,var(--dr-cyan),var(--dr-pink))}
.dr-chip{font-size:9px;letter-spacing:.08em;padding:3px 7px;font-weight:700}
.dr-c-win{background:var(--dr-gold);color:#241a00}
.dr-c-high{background:#7dd3fc;color:#04283d}
.dr-c-safe{background:#4b3a46;color:#efe3ec}
.dr-c-low{background:#fb923c;color:#2b1400}
.dr-c-btm{background:#fca5a5;color:#2b0000}
.dr-c-btm2{background:#f87171;color:#2b0000}
.dr-c-elim{background:#7f1d1d;color:#fecaca}

/* ── STEPS: hidden until revealed, and they RISE rather than blink in ── */
.dr-step{opacity:0;transform:translateY(14px);transition:opacity .45s ease,transform .45s ease;
  margin:14px 0}
.dr-step.dr-vis{opacity:1;transform:none}

/* ── STICKY CONTROLS ── */
.dr-controls{position:fixed;left:0;right:0;bottom:0;z-index:80;display:flex;gap:12px;
  align-items:center;justify-content:center;padding:12px;
  background:linear-gradient(180deg,rgba(10,2,7,0),rgba(10,2,7,.97) 40%)}
.dr-btn{font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.06em;
  text-transform:uppercase;font-size:16px;padding:11px 26px;cursor:pointer;border:none;color:#fff;
  background:linear-gradient(90deg,var(--dr-red,#FF294B),var(--dr-violet,#7B2FF7));
  clip-path:polygon(9px 0,100% 0,calc(100% - 9px) 100%,0 100%);
  box-shadow:0 6px 26px rgba(255,41,75,.5)}
.dr-btn.dr-ghost{background:transparent;border:1px solid rgba(255,255,255,.4);clip-path:none}
.dr-btn:focus-visible{outline:2px solid #00E5FF;outline-offset:2px}
.dr-controls.dr-done .dr-btn{opacity:.35;pointer-events:none}
.dr-counter{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#e6c8da;
  font-variant-numeric:tabular-nums}

.dr-ic{width:20px;height:20px;display:inline-block;vertical-align:-4px;flex:0 0 20px}
.dr-ic svg{width:100%;height:100%;display:block}

@media(prefers-reduced-motion:reduce){
  .dr-wrap *,.dr-wrap *::before,.dr-wrap *::after{animation:none!important;transition:none!important}
  .dr-step{opacity:1;transform:none}
}
@media(max-width:900px){.dr-game{grid-template-columns:1fr}.dr-rail{position:static}
  .dr-hud{grid-template-columns:1fr}}
`;

/**
 * The twelve icons, as inline SVG.
 *
 * CSS and SVG only — the project's VP rules forbid emoji outright, and for a
 * good reason: an emoji is a different glyph on every platform and none of
 * them belongs to this show's world.
 */
export const DR_ICONS = {
  mirror: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="7" fill="none" stroke="#FFC83D" stroke-width="1.6"/><circle cx="12" cy="10" r="4" fill="rgba(255,200,61,.25)"/><path d="M9 20h6" stroke="#FFC83D" stroke-width="1.6"/></svg>',
  wig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c5 0 7 4 7 8 0 5-3 7-3 10H8c0-3-3-5-3-10 0-4 2-8 7-8z" fill="none" stroke="#FF3D9A" stroke-width="1.6"/><path d="M9 8c1 2 5 2 6 0" stroke="#FF3D9A" stroke-width="1.4"/></svg>',
  sewing: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16h16v3H4z" fill="#00E5FF"/><path d="M6 16V8h7l3 4" fill="none" stroke="#00E5FF" stroke-width="1.6"/><path d="M16 12v4" stroke="#00E5FF" stroke-width="1.6"/></svg>',
  runway: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l4 18H5z" fill="none" stroke="#FF7BC8" stroke-width="1.6"/><path d="M7 12h10" stroke="#FF7BC8" stroke-width="1.4"/></svg>',
  microphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="#FFC83D" stroke-width="1.6"/><path d="M6 12a6 6 0 0012 0M12 18v3" fill="none" stroke="#FFC83D" stroke-width="1.6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="14" height="11" rx="2" fill="none" stroke="#00E5FF" stroke-width="1.6"/><path d="M17 11l4-3v9l-4-3z" fill="#00E5FF"/></svg>',
  lipstick: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="10" width="6" height="11" rx="1" fill="#3D0A63" stroke="#FF294B" stroke-width="1.4"/><path d="M10 10V5a2 2 0 014 0v5z" fill="#FF294B"/></svg>',
  crown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l4 5 5-8 5 8 4-5v10H3z" fill="#FFC83D" stroke="#8a5f00" stroke-width=".8"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6L21 9.4l-4.6 4.3 1.2 6.1L12 17l-5.6 2.8 1.2-6.1L3 9.4l6.4-.8z" fill="#FF3D9A"/></svg>',
  hanger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a2 2 0 012 2c0 1.6-2 1.6-2 3" fill="none" stroke="#7dd3fc" stroke-width="1.6"/><path d="M12 9L4 16h16z" fill="none" stroke="#7dd3fc" stroke-width="1.6"/></svg>',
  spotlight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 6-14 0z" fill="#fff3cf"/><path d="M5 9l-2 12h18L19 9z" fill="rgba(255,240,200,.22)" stroke="#fff3cf" stroke-width="1"/></svg>',
  heels: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v9c0 3 3 4 6 5l7 3v-2l-6-3c-2-1-4-2-4-4V4z" fill="none" stroke="#FF294B" stroke-width="1.6"/><path d="M18 18v3" stroke="#FF294B" stroke-width="2"/></svg>',
};

/** One icon. Throws on a name it does not know — a typo must be a crash. */
export function _icon(type) {
  const svg = DR_ICONS[type];
  if (!svg) throw new Error(`_icon: no such icon "${type}" (have: ${Object.keys(DR_ICONS).join(', ')})`);
  return `<span class="dr-ic">${svg}</span>`;
}

const initialsOf = name => String(name || '?').trim().split(/\s+/)
  .map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';

/**
 * A queen's portrait, ALWAYS through the resolver.
 *
 * Never a path built from a slug: a portrait is a per-season choice now, so a
 * slug cannot answer "which of this person's looks does this season use?" and
 * a concatenated path draws the wrong face confidently.
 * `tests/no-direct-avatar-paths.test.js` fails the build over it.
 *
 * Falls back to initials rather than a broken image, because the SHAPE of a
 * row must not depend on whether the art exists.
 */
export function _portrait(name, ep, { slug = '', size = 48, station = false, cls = '' } = {}) {
  const url = avatarUrl({
    playerSlug: slug || String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    show: ep?.format || 'drag-race',
  });
  const box = `width:${size}px;height:${size}px`;
  const frame = `class="dr-bust ${station ? 'dr-station' : ''} ${cls}"`;
  if (!url) {
    return `<span ${frame}><span class="dr-initials" style="${box};font-size:${Math.round(size / 2.8)}px"
      title="${esc(name)}">${esc(initialsOf(name))}</span></span>`;
  }
  return `<span ${frame}><img class="dr-por" style="${box}" src="${esc(url)}"
    alt="${esc(name)}" width="${size}" height="${size}" loading="lazy"></span>`;
}

/**
 * A judge's portrait, from the registry in js/dr/data/judges.js.
 *
 * The host has two looks and they are not interchangeable: out of drag in the
 * werk room, in drag on the main stage. A screen says which room it is and
 * gets the right one — `portraitStage` where it exists, `portrait` otherwise.
 */
export function _judgePortrait(judgeId, { stage = false, size = 52 } = {}) {
  const j = JUDGES.find(x => x.id === judgeId);
  if (!j) throw new Error(`_judgePortrait: no such judge "${judgeId}"`);
  const src = (stage && j.portraitStage) || j.portrait;
  const box = `width:${size}px;height:${size}px`;
  if (!src) {
    return `<span class="dr-bust"><span class="dr-initials" style="${box};font-size:${Math.round(size / 2.8)}px"
      title="${esc(j.name)}">${esc(initialsOf(j.name))}</span></span>`;
  }
  return `<span class="dr-bust"><img class="dr-por" style="${box}" src="${esc(src)}"
    alt="${esc(j.name)}" width="${size}" height="${size}" loading="lazy"></span>`;
}

/** The bulb marquee that heads every section. */
export function _bulbs(n = 12) {
  return `<div class="dr-bulbs">${Array.from({ length: n }, (_, i) =>
    `<i style="animation-delay:${(i * 0.1).toFixed(1)}s"></i>`).join('')}</div>`;
}

/**
 * The HUD: what episode, what the challenge is, tonight's category, and how
 * many queens are left. Built from the ROW, never from live state.
 */
export function _hud(ep) {
  const dr = ep?.dr || {};
  const total = Number(dr.totalEpisodes) || 0;
  /* `dr.ep` FIRST. The transcript builds on a shadow row whose `num` is
     negative — that is how reveal state is kept out of the viewer's own
     episode — and reading it here printed "EPISODE -5" at the top of every
     transcribed screen. The episode's real number is on the row itself. */
  const now = Number(dr.ep ?? ep?.num) || 0;
  const pips = total
    ? `<div class="dr-pips">${Array.from({ length: total }, (_, i) => {
      const k = i + 1 < now ? 'dr-p-done' : i + 1 === now ? 'dr-p-now' : '';
      return `<i class="${k}"></i>`;
    }).join('')}</div>` : '';
  const left = (dr.living || []).length;
  return `<!--dr-chrome--><div class="dr-hud">
    <div><span class="dr-hud-k">EPISODE</span>
      <div class="dr-hud-v dr-disp dr-num">${String(now).padStart(2, '0')}</div>${pips}</div>
    <div><span class="dr-hud-k">MAXI CHALLENGE</span>
      <div class="dr-hud-v dr-disp">${esc(dr.challenge?.name || '—')}</div>
      ${dr.runway?.category
    ? `<div class="dr-hud-cat dr-fash">Category is… ${esc(dr.runway.category)}</div>` : ''}</div>
    ${left ? `<div class="dr-hud-left"><span class="dr-hud-k">QUEENS<br>LEFT</span>
      <b class="dr-disp dr-num">${String(left).padStart(2, '0')}</b></div>` : '<span></span>'}
  </div><!--/dr-chrome-->`;
}

/**
 * The frame every screen sits in.
 *
 * `phase` picks the atmosphere and is checked against the list rather than
 * defaulted: a screen that names a room this file has never heard of is a
 * typo, and defaulting it would draw the werk room over the main stage
 * without saying anything.
 */
export function _shell(content, ep, { phase, title, subtitle = '', sidebar = '', hud = true } = {}) {
  if (!DR_PHASES.includes(phase)) {
    throw new Error(`_shell: unknown phase "${phase}" (have: ${DR_PHASES.join(', ')})`);
  }
  const atmo = `<div class="dr-atmo">${phase === 'werk' ? '<div class="dr-brick"></div>' : ''}${
    phase === 'stage' ? '<div class="dr-haze"></div>' : ''}</div>`;
  const body = sidebar
    ? `<div class="dr-game"><div>${content}</div>
        <!--dr-chrome--><aside class="dr-panel dr-rail" id="dr-sidebar-inner">${sidebar}</aside><!--/dr-chrome--></div>`
    // The mount exists even with no sidebar, so `_updateSidebar` has somewhere
    // to write if a later step decides it wants one.
    : `${content}<div id="dr-sidebar-inner" hidden></div>`;
  return `<style>${DR_CSS}</style>
  <div class="dr-phase-${phase}">${atmo}
    <div class="dr-wrap">
      ${hud ? _hud(ep) : ''}
      <!--dr-chrome--><div class="dr-sec">${_bulbs()}
        <h2 class="dr-disp">${esc(title)}</h2>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><!--/dr-chrome-->
      ${body}
    </div>
  </div>`;
}
