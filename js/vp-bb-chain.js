// ══════════════════════════════════════════════════════════════════════
// vp-bb-chain.js — a chain, and the three people not on it
// ══════════════════════════════════════════════════════════════════════
//
// The screen is the object. This twist produces one artefact — an ordered
// chain of houseguests, each link handed to them by the person above — and any
// version of this screen that rendered it as a list of names would be throwing
// away the only thing the twist makes.
//
// So the chain is drawn as a chain: portraits welded into links, an iron
// connector between each pair, growing a link at a time as the picks are
// revealed. And underneath it, deliberately unattached and deliberately not
// styled like the rest, the three the chain never reached — standing in the
// cold with nothing joining them to anybody.
//
// The palette is iron rather than the green of the safety screens, because
// being made safe here is not a prize somebody won. It is a thing another
// houseguest decided about you in public.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const CHAIN_CSS = `
.bbch-title{font-family:var(--font-display);font-size:26px;letter-spacing:3px;text-align:center;
  color:#cbd5e1;text-shadow:0 0 20px rgba(203,213,225,.22);margin-bottom:4px}
.bbch-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* THE FORGE. Cold light from above, iron below. */
.bbch-room{position:relative;max-width:640px;margin:0 auto 20px;padding:20px 16px 16px;
  border-radius:12px;overflow:hidden;
  background:radial-gradient(120% 80% at 50% -10%,rgba(203,213,225,.10),rgba(8,10,14,.97) 62%);
  border:1px solid rgba(148,163,184,.24);box-shadow:inset 0 0 70px rgba(0,0,0,.75)}

/* the chain itself: links that wrap, with iron between them */
.bbch-chain{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;
  gap:0 2px;position:relative;z-index:1}
.bbch-link{width:60px;text-align:center;position:relative}
.bbch-ring{position:relative;width:46px;height:46px;margin:0 auto;border-radius:50%;overflow:hidden;
  border:2px solid #94a3b8;background:#0d1117;
  box-shadow:0 0 0 2px rgba(148,163,184,.14),0 0 16px -4px rgba(203,213,225,.55)}
.bbch-ring img,.bbch-ring .bb-av,.bbch-ring .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbch-link.is-first .bbch-ring{border-color:#fbbf24;
  box-shadow:0 0 0 2px rgba(251,191,36,.18),0 0 22px -3px rgba(251,191,36,.85)}
.bbch-nm{font-size:9.5px;color:#e6edf3;margin-top:4px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbch-ord{font-family:var(--font-mono,ui-monospace,monospace);font-size:8px;letter-spacing:1px;
  color:#64748b;margin-top:1px}
/* the iron between two links */
.bbch-weld{width:16px;height:14px;flex:none;opacity:.8}

/* THE THREE THE CHAIN NEVER REACHED. Unlinked on purpose: no connector, no
   ring, square and cold, sitting apart from the thing above them. */
.bbch-left{margin-top:20px;padding-top:16px;border-top:1px dashed rgba(248,113,113,.32);
  position:relative;z-index:1}
.bbch-leftlab{text-align:center;font-family:var(--font-mono,monospace);font-size:9px;
  letter-spacing:2px;color:#f87171;margin-bottom:10px}
.bbch-cold{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.bbch-one{width:76px;text-align:center}
.bbch-sq{width:56px;height:56px;margin:0 auto;overflow:hidden;border-radius:3px;
  border:1px solid rgba(248,113,113,.45);background:#140b0b;filter:grayscale(.55)}
.bbch-sq img,.bbch-sq .bb-av,.bbch-sq .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbch-one.is-safe .bbch-sq{border-color:#4ade80;filter:none;
  box-shadow:0 0 20px -4px rgba(74,222,128,.8)}
.bbch-one.is-nom .bbch-sq{border-width:2px;border-color:#ef4444}
.bbch-cnm{font-size:10px;color:#e6edf3;margin-top:5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbch-role{font-family:var(--font-mono,monospace);font-size:8px;letter-spacing:1.1px;margin-top:2px}
.bbch-one.is-safe .bbch-role{color:#4ade80}
.bbch-one.is-nom .bbch-role{color:#f87171}
.bbch-legend{text-align:center;font-size:9px;letter-spacing:1.2px;color:#64748b;margin-top:12px}
@media(prefers-reduced-motion:reduce){.bbch-ring{animation:none}}
`;

/** One welded joint between two links. Drawn, not typed — it is the twist. */
const WELD = `<svg class="bbch-weld" viewBox="0 0 16 14" aria-hidden="true">
  <ellipse cx="8" cy="7" rx="6.2" ry="3.4" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
</svg>`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `chain-of-safety` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBChainOfSafety(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'chain');
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'rule' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'block' }];
  const total = steps.length;
  const done = state.idx >= total - 1;
  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');

  // HOW MUCH OF THE CHAIN THE VIEWER HAS EARNED.
  //
  // Counted off the beats actually revealed rather than off the act, so the
  // diagram grows a link at a time alongside the cards. Ungated it drew the
  // finished chain on arrival, which gave away every pick — including who was
  // left over — before the first card was turned.
  const revealed = steps.slice(0, Math.max(0, state.idx + 1));
  const picksShown = revealed.filter(s => s.kind === 'beat' && s.b?.badgeText === 'SAFE').length;
  const order = (act.order || []).slice(0, Math.max(1, Math.min(picksShown + 1,
    (act.order || []).length)));
  const showLeft = state.idx >= 0 && picksShown >= (act.links || []).length;

  const CHAIN = `<div class="bbch-chain">${order.map((n, i) => `
    ${i ? WELD : ''}
    <div class="bbch-link ${i === 0 ? 'is-first' : ''}" title="${esc(n)}">
      <div class="bbch-ring">${AV(n, 46)}</div>
      <div class="bbch-nm">${esc(n)}</div>
      <div class="bbch-ord">${i === 0
    ? (act.variant === 'hoh' ? 'HOH' : 'WON IT') : `#${i + 1}`}</div>
    </div>`).join('')}</div>`;

  // The three, and what became of them — but only once the chain has actually
  // run out. Before that they are still in it.
  const role = n => (!done ? '' : n === act.safetyWinner ? 'SAFE' : 'NOMINATED');
  const cls = n => (!done ? '' : n === act.safetyWinner ? 'is-safe' : 'is-nom');
  const LEFT = showLeft && (act.leftover || []).length ? `<div class="bbch-left">
    <div class="bbch-leftlab">CHOSEN BY NOBODY</div>
    <div class="bbch-cold">${(act.leftover || []).map(n => `
      <div class="bbch-one ${cls(n)}" title="${esc(n)}">
        <div class="bbch-sq">${AV(n, 56)}</div>
        <div class="bbch-cnm">${esc(n)}</div>
        <div class="bbch-role">${role(n)}</div>
      </div>`).join('')}</div>
    <div class="bbch-legend">${done
    ? 'ONE COMPETED OUT OF IT. THE OTHER TWO ARE THE BLOCK.'
    : 'THREE LEFT, AND ONE COMPETITION BETWEEN THEM'}</div>
  </div>` : '';

  const ROOM = `<div class="bbch-room">${CHAIN}${LEFT}</div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'rule') {
      // QUÉBEC IS A DIFFERENT RULE AND HAS TO BE READ OUT AS ONE.
      //
      // This card was Canada's, always: "until three people are left", "it
      // stops at three", "those three compete". On a Québec chain every one of
      // those sentences is false, and it was printed above a chain that ran to
      // one and then ran again.
      if (act.style === 'quebec') {
        return _card('NO CEREMONY, NO VETO, NO VOTE',
          `Nobody is going to be nominated tonight either. One houseguest is safe, and their only
           job is to say somebody else's name — and then that one chooses, and so on down the
           house, out loud, in front of everybody still waiting.
           <br><br>It runs until ONE person is left that nobody said. They are nominated.
           <br><br>Then this house does the whole thing again. Whoever is left over the second
           time is the other nominee — and the two of them settle it between themselves, head to
           head, in a competition.
           <br><br><b>There is no vote.</b> Nobody in here has to put their name to it. This house
           only ever decides who is safe; the two people it forgets have to fight over the rest.`,
          'gold');
      }
      return _card('NO CEREMONY, NO VETO',
        `Nobody is going to be nominated tonight. One houseguest is safe, and ${act.variant === 'hoh'
    ? 'it is the Head of Household'
    : 'they won it'} — and their only job now is to say somebody else's name.
         <br><br>That houseguest chooses the next. And that one chooses the next. It runs down this
         house out loud, in front of everybody who has not been chosen yet, until three people are
         left standing there having been picked by nobody at all.
         <br><br><b>It stops at three.</b> The last houseguest saved does not get to choose again —
         there has to be a field left to compete, so whoever is holding the chain when three remain
         is simply told the choosing is over.
         <br><br>Those three compete. One wins safety. The other two are the nominees, on the spot,
         and there is no veto coming to take either of them down.`, 'gold');
    }
    if (step.kind === 'block') {
      // A Québec chain has no second competition to win, so the Canada card
      // for "nobody won it" was firing on every single one of them and telling
      // the viewer the chain had failed when it had done exactly its job.
      if (act.style === 'quebec') {
        return _card('THE TWO NOBODY SAID',
          `${esc((act.nominees || []).join(' and '))} are the nominees, and neither of them was put
           there by a person. Two chains ran the length of this house and neither one reached them.
           <br><br>There is nothing left to campaign for. No vote is coming — they settle it
           between the two of them.`, 'red', 'is-final', [...(act.nominees || [])]);
      }
      if (!act.safetyWinner) {
        return _card('THE CHAIN RUNS OUT', 'The chain ends and nobody wins the second competition.',
          'red', 'is-final');
      }
      return _card('WHAT THE HOUSE CHOSE',
        `${esc(act.safetyWinner)} wins the second safety competition and walks away from a block
         ${esc(act.safetyWinner)} was never technically on.
         <br><br>${esc((act.nominees || []).join(' and '))} are the nominees. Not because anybody put
         them there — because ${(act.links || []).length} houseguests in a row each had one name to
         give and not one of them said theirs.`, 'red', 'is-final', [...(act.nominees || [])]);
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbch', css: CHAIN_CSS,
    title: 'THE CHAIN OF SAFETY',
    sub: act.style === 'quebec'
      ? 'Twice down the house, and the two it never reached settle it themselves.'
      : act.variant === 'hoh'
        ? 'The Head of Household starts it. Nobody else gets a say in where it goes.'
        : 'One competition decides who starts it. After that the house decides everything.',
    stage: ROOM,
    cards: steps.map(card).join(''),
    firstLabel: 'Start the chain',
  });
}
