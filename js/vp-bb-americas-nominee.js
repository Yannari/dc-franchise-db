// ══════════════════════════════════════════════════════════════════════
// vp-bb-americas-nominee.js — the third chair
// ══════════════════════════════════════════════════════════════════════
//
// Three chairs. Two were filled by somebody in the building and the house can
// name who; the third was filled from outside and it cannot.
//
// Drawing them as identical chairs is the point. There is no visual difference
// between a chair the Head of Household filled and a chair the country filled,
// and that missing difference is exactly the problem the house spends the week
// having — it cannot tell them apart either, so it invents a culprit.
//
// In the direct variant there is genuinely nobody to find. The screen says so
// plainly, because the viewer is owed the answer the house never gets.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const AN_CSS = `
.bban-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#7dd3fc;text-shadow:0 0 18px rgba(125,211,252,.28);margin-bottom:4px}
.bban-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* THE MEMORY WALL. Not chairs — this is the object the whole format is built
   around, and a nomination is a photograph turning red on it. Two of these
   were turned by a hand in the building. The third turns by itself. */
.bban-wall{position:relative;max-width:560px;margin:0 auto 20px;padding:26px 20px 22px;
  border-radius:12px;overflow:hidden;
  background:radial-gradient(120% 90% at 50% -10%,rgba(125,211,252,.10),rgba(4,7,13,.96) 62%);
  border:1px solid rgba(125,211,252,.20);box-shadow:inset 0 0 60px rgba(0,0,0,.75)}
.bban-wall::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 3px)}
/* a studio light crossing the wall, forever */
.bban-wall::after{content:'';position:absolute;top:-40%;left:-60%;width:45%;height:180%;
  pointer-events:none;transform:rotate(14deg);
  background:linear-gradient(90deg,transparent,rgba(125,211,252,.09),transparent);
  animation:bban-sweep 7s linear infinite}
@keyframes bban-sweep{from{left:-60%}to{left:120%}}

.bban-frames{position:relative;display:flex;justify-content:center;gap:16px;flex-wrap:wrap}
.bban-frame{width:104px;text-align:center}
.bban-photo{position:relative;width:88px;height:88px;margin:0 auto;border-radius:4px;
  display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:#0b1220;border:2px solid #1f2b3d;
  filter:grayscale(1) brightness(.55);transition:filter .5s ease,border-color .5s ease}
.bban-photo img,.bban-photo .bb-av,.bban-photo .rp-portrait{width:100%;height:100%;object-fit:cover}
.bban-frame.is-up .bban-photo{filter:none;border-color:#c9343c;
  box-shadow:0 0 0 1px rgba(201,52,60,.5),0 0 22px -4px rgba(201,52,60,.8)}
.bban-frame.is-third .bban-photo{border-color:#7dd3fc;
  box-shadow:0 0 0 1px rgba(125,211,252,.55),0 0 30px -2px rgba(125,211,252,.85);
  animation:bban-pulse 2.6s ease-in-out infinite}
@keyframes bban-pulse{0%,100%{box-shadow:0 0 0 1px rgba(125,211,252,.5),0 0 22px -4px rgba(125,211,252,.7)}
  50%{box-shadow:0 0 0 1px rgba(125,211,252,.8),0 0 38px 0 rgba(125,211,252,.95)}}
/* the red wash that means nominated, wiping up the photo as it turns */
.bban-frame.is-up .bban-photo::after,.bban-frame.is-third .bban-photo::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(0deg,rgba(201,52,60,.34),transparent 70%)}
.bban-frame.is-third .bban-photo::after{background:linear-gradient(0deg,rgba(125,211,252,.30),transparent 70%)}
.bban-frame.is-third{animation:bban-slam .55s cubic-bezier(.2,1.5,.4,1) both}
@keyframes bban-slam{from{opacity:0;transform:translateY(-16px) scale(1.08)}to{opacity:1;transform:none}}

.bban-name{margin-top:7px;font-size:11.5px;color:#e6edf3;font-weight:600;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bban-by{font-family:var(--font-mono,ui-monospace,monospace);font-size:8.5px;
  letter-spacing:1.1px;color:#64748b;margin-top:2px}
.bban-frame.is-third .bban-by{color:#7dd3fc}
.bban-redact{display:inline-block;background:rgba(125,211,252,.22);color:transparent;
  border-radius:2px;padding:0 16px;user-select:none}
.bban-empty{width:88px;height:88px;margin:0 auto;border-radius:4px;
  border:2px dashed rgba(125,211,252,.35);display:flex;align-items:center;justify-content:center;
  color:rgba(125,211,252,.5);font-size:26px;font-family:var(--font-mono,monospace)}
.bban-plate{margin-top:14px;text-align:center;font-family:var(--font-mono,ui-monospace,monospace);
  font-size:9px;letter-spacing:2.4px;color:#7dd3fc;opacity:.75}
@media(prefers-reduced-motion:reduce){
  .bban-wall::after,.bban-frame.is-third .bban-photo,.bban-frame.is-third{animation:none}}
@media(max-width:520px){.bban-frame{width:88px}.bban-photo,.bban-empty{width:74px;height:74px}}
`;
/**
 * @param {object} ep   the episode view
 * @param {object} act  the `americas-nominee` act
 * @param {object} deps {tvState, reveal, esc} from vp-screens.js
 */
export function rpBuildBBAmericasNominee(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'an');
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'chairs' }, { kind: 'third' }, ...beats.map(b => ({ kind: 'beat', b }))];
  const total = steps.length;
  const seated = state.idx >= 1;

  // The act carries ONLY the third chair — that is all the twist produced. The
  // other two are the Head of Household's, so they come off the episode's
  // block with the third name taken out of it.
  const hohNoms = [...(ep.initialNominees || ep.finalNominees || [])]
    .filter(n => n && n !== act.nominee).slice(0, 2);

  // Avatars, because this is a memory wall and a memory wall has faces on it.
  // The two the Head of Household turned carry their name on the plate; the
  // third carries a redaction, which is the whole twist in one line of text.
  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const hoh = ep.hoh || act.hoh || null;

  const frame = (name, byLine, cls) => `<div class="bban-frame ${cls}">
      ${name
        ? `<div class="bban-photo">${AV(name, 88)}</div>
           <div class="bban-name">${esc(name)}</div>`
        : `<div class="bban-empty">?</div><div class="bban-name">&nbsp;</div>`}
      <div class="bban-by">${byLine}</div>
    </div>`;

  const WALL = `<div class="bban-wall">
    <div class="bban-frames">
      ${frame(hohNoms[0] || '', hoh ? `NAMED BY ${esc(hoh).toUpperCase()}` : 'NAMED INSIDE',
    hohNoms[0] ? 'is-up' : '')}
      ${frame(hohNoms[1] || '', hoh ? `NAMED BY ${esc(hoh).toUpperCase()}` : 'NAMED INSIDE',
    hohNoms[1] ? 'is-up' : '')}
      ${seated
    ? frame(act.nominee, `NAMED BY <span class="bban-redact">nobody in here</span>`, 'is-third')
    : frame('', 'THE THIRD KEY', '')}
    </div>
    <div class="bban-plate">${seated
    ? 'three photographs turned · two hands accounted for'
    : 'two photographs turned · one key still in the box'}</div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'chairs') {
      return _card('TWO PHOTOGRAPHS WITH A HAND BEHIND THEM',
        `The Head of Household turned two of these and the whole house watched it happen. There is a
         third photograph on that wall, and there is nobody in this building to ask about it.`, 'blue', '', hohNoms);
    }
    if (step.kind === 'third') {
      return _card('AND ONE WITHOUT',
        act.style === 'mvp'
          ? `${esc(act.nominee)} takes the third chair.${act.mvp ? ` ${esc(act.mvp)} was voted Most Valuable
             Player and named them — privately, with only ${esc(act.mvp)} ever told.` : ''}
             <br><br>You have just been given a name the house will never have. So there IS a culprit this
             week, and they are sitting in that room being no more suspicious than anybody else, while
             the house convicts somebody at random.`
          : `${esc(act.nominee)} takes the third chair, named by the audience directly.
             <br><br>Nobody in that house did this. Not one of them. They will still spend the week working
             out which of them did, because a chair with no hand on it is not a thing a house can leave
             alone.`,
        'red', 'is-final', [act.nominee]);
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bban', css: AN_CSS,
    title: "AMERICA'S NOMINEE",
    sub: 'Three photographs turn red. Two of them have a hand behind them.',
    stage: WALL,
    cards: steps.map(card).join(''),
    firstLabel: 'The block',
  });
}
