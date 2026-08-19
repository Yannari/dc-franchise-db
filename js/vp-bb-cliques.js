// ══════════════════════════════════════════════════════════════════════
// vp-bb-cliques.js — the board somebody else filled in
// ══════════════════════════════════════════════════════════════════════
//
// Built out of what the twist IS: a sorting. Not a competition, not a choice,
// not a room anybody walked into — a list of four headings with everybody's
// name already written under one of them, by a hand nobody saw.
//
// So the screen is a school corridor noticeboard: four columns, hard rules
// between them, names typed rather than written. The only decoration is the
// clique badge, because the whole point is that this was done TO the house
// administratively.
//
// Two acts, one builder. The sorting and the dissolution are the same board
// seen twice, and the second one is the first with every column struck out —
// which is exactly what dissolution feels like from inside it.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const CQ_CSS = `
.bbcq-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#7dd3fc;text-shadow:0 0 18px rgba(125,211,252,.25);margin-bottom:4px}
.bbcq-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* THE BOARD. Institutional, flat, faintly fluorescent. */
.bbcq-board{position:relative;max-width:660px;margin:0 auto 20px;padding:20px 16px 16px;
  border-radius:6px;overflow:hidden;
  background:linear-gradient(180deg,rgba(18,24,32,.97),rgba(9,13,18,.98));
  border:1px solid rgba(125,211,252,.20);box-shadow:inset 0 0 60px rgba(0,0,0,.7)}
.bbcq-head{font-family:var(--font-mono,ui-monospace,monospace);font-size:8px;letter-spacing:2.4px;
  color:#64748b;text-align:center;border-bottom:1px solid rgba(125,211,252,.18);
  padding-bottom:7px;margin-bottom:12px}

.bbcq-cols{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1}
.bbcq-col{flex:1 1 140px;min-width:132px;max-width:158px;padding:9px 8px 10px;border-radius:4px;
  background:rgba(125,211,252,.04);border:1px solid rgba(125,211,252,.16)}
.bbcq-col.is-safe{background:rgba(74,222,128,.09);border-color:#4ade80;
  box-shadow:0 0 0 1px rgba(74,222,128,.20),0 0 24px -8px rgba(74,222,128,.9)}
.bbcq-col.is-over{opacity:.5}
.bbcq-cn{font-family:var(--font-display);font-size:12px;letter-spacing:1.2px;color:#7dd3fc;
  text-align:center;margin-bottom:2px}
.bbcq-col.is-safe .bbcq-cn{color:#4ade80}
.bbcq-tag{font-family:var(--font-mono,monospace);font-size:7px;letter-spacing:1.4px;
  text-align:center;color:#64748b;margin-bottom:8px;min-height:9px}
.bbcq-col.is-safe .bbcq-tag{color:#4ade80}
.bbcq-m{display:flex;align-items:center;gap:6px;padding:3px 2px}
.bbcq-f{width:26px;height:26px;border-radius:3px;overflow:hidden;flex:none;
  border:1px solid rgba(125,211,252,.30);background:#0b1219}
.bbcq-f img,.bbcq-f .bb-av,.bbcq-f .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbcq-n{font-size:10.5px;color:#e6edf3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbcq-col.is-over .bbcq-n{text-decoration:line-through;text-decoration-thickness:1.5px;color:#64748b}
.bbcq-legend{text-align:center;font-family:var(--font-mono,monospace);font-size:8px;letter-spacing:1.3px;
  color:#64748b;margin-top:13px;position:relative;z-index:1}
`;

export function rpBuildBBCliques(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const over = act.type === 'teams-dissolved';
  const stateKey = _key(ep, over ? 'cqe' : 'cq');
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'lede' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'rule' }];
  const total = steps.length;
  const shown = state.idx >= 1;

  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const teams = act.teams || [];

  const COLS = `<div class="bbcq-cols">${teams.map((t, i) => `
    <div class="bbcq-col ${over ? 'is-over' : ''}">
      <div class="bbcq-cn">${esc(t.name || '')}</div>
      <div class="bbcq-tag">${over ? 'DISSOLVED' : `${(t.members || []).length} SORTED`}</div>
      ${(shown || over) ? (t.members || []).map(n => `
        <div class="bbcq-m" title="${esc(n)}">
          <div class="bbcq-f">${AV(n, 26)}</div>
          <div class="bbcq-n">${esc(n)}</div>
        </div>`).join('')
    : '<div class="bbcq-n" style="text-align:center;color:#475569">— — —</div>'}
    </div>`).join('') || '<div class="bbcq-n">nobody was sorted</div>'}</div>`;

  const BOARD = `<div class="bbcq-board">
    <div class="bbcq-head">${over
    ? 'NOTICE &#183; THE FOLLOWING GROUPINGS NO LONGER APPLY'
    : 'NOTICE &#183; HOUSE GROUPINGS &#183; NOT SUBJECT TO APPEAL'}</div>
    ${COLS}
    <div class="bbcq-legend">${over
    ? 'NO GROUP IS SAFE BECAUSE ONE OF ITS OWN IS IN CHARGE ANY MORE'
    : 'A CLIQUE WHOSE MEMBER WINS HEAD OF HOUSEHOLD IS SAFE ENTIRE'}</div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'lede') {
      return over
        ? _card('THE SORTING IS OVER',
          `The four groupings stop applying tonight. Nobody voted on that either.
           <br><br>For as long as they lasted, three people were safe every week for no reason
           except a heading somebody typed on night one. Those three are now exactly as exposed as
           everybody else, and they are about to find out whether any of it turned into a friendship.`,
          'red')
        : _card('NOBODY CHOSE THIS',
          `The house has been sorted into four cliques, by who these people already are. There was no
           competition and no vote. Nobody applied and nobody may leave.
           <br><br>It is the only grouping in this game that is not evidence of anything — an alliance
           tells you who somebody trusts, and this tells you only what somebody looked like on day
           one.`, 'gold');
    }
    if (step.kind === 'rule') {
      return over
        ? _card('AND EVERYBODY IS ON THEIR OWN',
          `From here a Head of Household protects one person: themselves.
           <br><br>The houseguests who spent this game being covered by an accident of sorting have to
           start being covered by people who actually chose them — and the ones who never bothered to
           make that second thing are the ones who will not see the difference coming.`,
          'red', 'is-final')
        : _card('AND THE RULE IS ONE LINE',
          `Whenever a houseguest wins Head of Household, their <b>entire clique</b> is immune from
           eviction that week.
           <br><br>Four people safe instead of one, and three of them did nothing whatsoever to earn
           it. Every Head of Household this season will sit down to make a block and find that the
           name they wanted is protected by a heading — and everybody watching will be doing the
           arithmetic on which clique they would rather have been put in.`,
          'gold', 'is-final');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcq', css: CQ_CSS,
    title: over ? 'THE CLIQUES ARE OVER' : 'THE CLIQUES',
    sub: over ? 'The headings stop applying.' : 'Sorted on night one. Not subject to appeal.',
    stage: BOARD,
    cards: steps.map(card).join(''),
    firstLabel: over ? 'The notice' : 'The sorting',
  });
}
