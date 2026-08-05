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
.bban-stage{max-width:470px;margin:0 auto 18px}
.bban-chairs{display:block;width:100%;height:auto}
.bban-seat{font-size:11px;letter-spacing:.6px;fill:#e6edf3;font-family:var(--font-mono,monospace)}
.bban-tag{font-size:8px;letter-spacing:1.3px;font-family:var(--font-mono,monospace)}
.bban-third{animation:bban-in .5s ease-out both}
@keyframes bban-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.bban-third{animation:none}}
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

  // The animated class goes on an INNER <g>: a CSS transform beats an SVG
  // transform attribute on the same element, and putting both on one node threw
  // the third chair on top of the first.
  const chair = (x, name, tag, lit, extra = '') => `<g transform="translate(${x} 16)"><g class="${extra}">
      <path d="M4 66 h56 v8 h-56z" fill="#334155"/>
      <path d="M9 74 v24 M55 74 v24" stroke="#334155" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M6 20 h52 a4 4 0 0 1 4 4 v42 h-60 v-42 a4 4 0 0 1 4-4z"
        fill="${lit ? 'rgba(125,211,252,.14)' : 'rgba(100,116,139,.08)'}"
        stroke="${lit ? '#7dd3fc' : '#475569'}" stroke-width="1.4"/>
      <text class="bban-tag" x="32" y="12" text-anchor="middle"
        style="fill:${lit ? '#7dd3fc' : '#64748b'}">${esc(tag)}</text>
      <text class="bban-seat" x="32" y="49" text-anchor="middle">${name ? esc(name) : '?'}</text>
    </g></g>`;

  const CHAIRS = `<svg class="bban-chairs" viewBox="0 0 300 118" role="img"
      aria-label="Three nomination chairs, the third filled from outside the house">
    ${chair(14, hohNoms[0] || '', 'THE HOH', Boolean(hohNoms[0]))}
    ${chair(114, hohNoms[1] || '', 'THE HOH', Boolean(hohNoms[1]))}
    ${chair(214, seated ? act.nominee : '', seated ? 'NOT THIS HOUSE' : 'THE THIRD',
    seated, seated ? 'bban-third' : '')}
  </svg>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'chairs') {
      return _card('TWO CHAIRS WITH A HAND ON THEM',
        `The Head of Household filled two of these and the whole house watched it happen. There is a
         third, and there is nobody in this building to ask about it.`, 'blue');
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
        'red', 'is-final');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bban', css: AN_CSS,
    title: "AMERICA'S NOMINEE",
    sub: 'Three on the block. Two of them were somebody in this house.',
    stage: `<div class="bban-stage">${CHAIRS}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'The block',
  });
}
