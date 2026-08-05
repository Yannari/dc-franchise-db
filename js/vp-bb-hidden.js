// ══════════════════════════════════════════════════════════════════════
// vp-bb-hidden.js — something in this house
// ══════════════════════════════════════════════════════════════════════
//
// Eight places, drawn identically, and the screen is not allowed to know
// which one it is in.
//
// That is the whole design constraint. Every other twist screen in this format
// can show you the thing: a wall of photographs, a coin, a door, a medal. This
// one is about an object whose entire value is that nobody can see it, so a
// screen that marked the hiding spot would be telling the viewer the one fact
// the house is spending a month failing to work out.
//
// So the panels stay shut and identical the whole way through. What moves is
// the PEOPLE: faces appear against panels as houseguests search them, a face
// that gets caught goes red, and the belief meter across the bottom climbs
// every time somebody is seen — which is the twist's real engine, because a
// house that believes searches far harder than a house that does not.
//
// Only a find opens a panel, and only then.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const HP_CSS = `
.bbhp-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#c084fc;text-shadow:0 0 18px rgba(192,132,252,.28);margin-bottom:4px}
.bbhp-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* the house as a set of identical shut panels */
.bbhp-house{position:relative;max-width:560px;margin:0 auto 18px;padding:18px 16px 14px;
  border-radius:12px;overflow:hidden;
  background:radial-gradient(120% 90% at 50% -10%,rgba(192,132,252,.09),rgba(6,4,12,.97) 62%);
  border:1px solid rgba(192,132,252,.2);box-shadow:inset 0 0 60px rgba(0,0,0,.8)}
.bbhp-house::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.022) 0 1px,transparent 1px 3px)}
.bbhp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;position:relative;z-index:1}
@media(max-width:520px){.bbhp-grid{grid-template-columns:repeat(2,1fr)}}
.bbhp-panel{position:relative;aspect-ratio:1.35;border-radius:5px;
  background:linear-gradient(180deg,rgba(148,163,184,.10),rgba(2,6,12,.9));
  border:1px solid rgba(148,163,184,.26);display:flex;align-items:center;justify-content:center}
/* a drawer pull, so it reads as a place rather than a tile */
.bbhp-panel::after{content:'';position:absolute;left:50%;bottom:7px;width:22px;height:2px;
  transform:translateX(-50%);border-radius:2px;background:rgba(148,163,184,.4)}
.bbhp-panel.is-open{border-color:#c084fc;background:linear-gradient(180deg,rgba(192,132,252,.22),rgba(2,6,12,.9));
  box-shadow:0 0 22px -4px rgba(192,132,252,.9);animation:bbhp-open .5s ease-out both}
@keyframes bbhp-open{from{opacity:.3;transform:translateY(-6px)}to{opacity:1;transform:none}}
.bbhp-eyes{display:flex;gap:2px;flex-wrap:wrap;justify-content:center;padding:4px}
.bbhp-eyes img,.bbhp-eyes .bb-av,.bbhp-eyes .rp-portrait{width:20px;height:20px;border-radius:3px;
  filter:grayscale(.5) brightness(.85)}
.bbhp-eyes .is-caught img,.bbhp-eyes .is-caught .bb-av{filter:none;outline:1.5px solid #f47067;outline-offset:1px}

/* how much the house believes there is anything to find */
.bbhp-belief{margin-top:12px;position:relative;z-index:1}
.bbhp-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden}
.bbhp-bar i{display:block;height:100%;border-radius:3px;
  background:linear-gradient(90deg,#6b7280,#c084fc);transition:width .6s ease}
.bbhp-lbl{margin-top:5px;text-align:center;font-family:var(--font-mono,ui-monospace,monospace);
  font-size:8.5px;letter-spacing:1.6px;color:#8b949e}
.bbhp-cap{max-width:560px;margin:0 auto 12px;text-align:center;font-size:9px;color:#4b5563;
  font-family:var(--font-mono,ui-monospace,monospace);letter-spacing:.8px}
@media(prefers-reduced-motion:reduce){.bbhp-panel.is-open{animation:none}.bbhp-bar i{transition:none}}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  a `hidden-power` act (hidden | search | found | expired)
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBHidden(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const stateKey = _key(ep, `hp${act.phase || ''}`);
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'house' }, ...beats.map(b => ({ kind: 'beat', b }))];
  const total = steps.length;
  const open = state.idx >= 0;

  const searchers = act.searchers || [];
  const caught = new Set(beats.filter(b => b.badgeText === 'SEEN LOOKING')
    .flatMap(b => (b.players || []).slice(1)));
  // Only a find opens anything, and even then the panel is anonymous — the
  // viewer learns that it WAS somewhere, never where.
  const opened = act.phase === 'found' && state.idx >= total - 1;

  // Faces are spread across the panels deterministically: the point is that the
  // house is crawling over the place, not which drawer anybody chose.
  const PANELS = 8;
  const panel = i => {
    const here = searchers.filter((_, k) => (k + i * 3) % PANELS === i % PANELS).slice(0, 3);
    return `<div class="bbhp-panel ${opened && i === 5 ? 'is-open' : ''}">
      ${open && here.length ? `<div class="bbhp-eyes">${here.map(n =>
    `<span class="${caught.has(n) ? 'is-caught' : ''}" title="${esc(n)}">${AV(n, 20)}</span>`).join('')}</div>` : ''}
    </div>`;
  };

  const belief = Math.max(0, Math.min(4, Number(act.heat || 0)));
  const HOUSE = `<div class="bbhp-house">
    <div class="bbhp-grid">${Array.from({ length: PANELS }, (_, i) => panel(i)).join('')}</div>
    <div class="bbhp-belief">
      <div class="bbhp-bar"><i style="width:${open ? 12 + belief * 22 : 6}%"></i></div>
      <div class="bbhp-lbl">${act.phase === 'expired' ? 'NOBODY EVER LOOKED THERE'
    : belief >= 3 ? 'THE HOUSE IS CERTAIN THERE IS SOMETHING'
      : belief >= 1 ? 'THE HOUSE IS STARTING TO BELIEVE IT'
        : 'NOBODY REALLY BELIEVES IT YET'}</div>
    </div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'house') {
      if (act.phase === 'hidden') {
        return _card('SOMEWHERE IN HERE',
          `${esc(act.power)} is in this house, in a real place any one of them could reach, put there
           before they moved in. No clue. No competition. No map.
           <br><br>They are told it exists and nothing else, which is the most destabilising thing you
           can hand a group of people who already suspect each other.`, 'gold');
      }
      if (act.phase === 'expired') {
        return _card('NEVER FOUND',
          `The fuse runs out with it exactly where it was put. Not one of them ever looked there — and
           it is taken away without anybody in that house learning it was ever in the building.`,
          'grey', 'is-final');
      }
      return _card('LOOKING IS NOT A PRIVATE ACT',
        `${searchers.length ? `${esc(searchers.join(', '))} spent this week going through rooms.`
    : 'Nobody could quite bring themselves to start.'}
         <br><br>There are cameras in every one of them. A houseguest seen rummaging is a houseguest
         visibly behaving like somebody who thinks there is something to find, and that is a thing the
         rest of them can hold against ${searchers.length === 1 ? 'them' : 'each other'}.`, 'blue');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbhp', css: HP_CSS,
    title: 'SOMETHING IN THIS HOUSE',
    sub: act.phase === 'expired' ? 'It was there the whole time.'
      : act.found ? 'Somebody walked out of a room with it in their pocket.'
        : 'Eight places. No clue. And everybody watching everybody.',
    stage: HOUSE + `<div class="bbhp-cap">the panels are drawn identically on purpose &middot; this screen does not know which one it is in either</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'The house',
  });
}
