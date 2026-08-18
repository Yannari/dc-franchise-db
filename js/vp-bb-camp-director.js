// ══════════════════════════════════════════════════════════════════════
// vp-bb-camp-director.js — the noticeboard, and the four names pinned to it
// ══════════════════════════════════════════════════════════════════════
//
// Built out of the object this twist actually is: a camp noticeboard with a
// list on it. The election goes up as a ballot, the four banished go up as
// pinned cards under a hand-lettered HIT THE ROAD, and the one who does not
// come back gets a line through them.
//
// Deliberately not the Wildcard's table or the Safety Suite's scoreboard. Those
// are about a price and an entitlement; this is about a NOTICE — a list of
// names somebody put up in public, which is the whole grievance the season is
// built on. Everything on this screen is pinned, taped or written by hand.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const CD_CSS = `
.bbcd2-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#fcd34d;text-shadow:0 0 18px rgba(252,211,77,.25);margin-bottom:4px}
.bbcd2-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* THE NOTICEBOARD. Cork, low evening light through pines. */
.bbcd2-board{position:relative;max-width:640px;margin:0 auto 20px;padding:20px 18px 16px;
  border-radius:10px;overflow:hidden;
  background:
    radial-gradient(120% 80% at 50% -10%,rgba(252,211,77,.10),rgba(24,18,10,.97) 62%),
    repeating-linear-gradient(41deg,rgba(120,86,42,.10) 0 3px,transparent 3px 7px);
  border:1px solid rgba(252,211,77,.22);box-shadow:inset 0 0 60px rgba(0,0,0,.75)}

/* the ballot: three names, the winner circled in pencil */
.bbcd2-ballot{max-width:300px;margin:0 auto 16px;padding:11px 13px 10px;border-radius:2px;
  background:rgba(247,242,228,.95);color:#26200f;position:relative;z-index:1;
  transform:rotate(-1.1deg);box-shadow:0 8px 22px -12px rgba(0,0,0,.95)}
.bbcd2-bh{font-family:var(--font-mono,ui-monospace,monospace);font-size:8px;letter-spacing:2px;
  color:#6d5f3a;border-bottom:1px solid rgba(0,0,0,.22);padding-bottom:5px;margin-bottom:6px}
.bbcd2-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:2px 0}
.bbcd2-row.is-won{font-weight:700}
.bbcd2-row.is-won .bbcd2-who{position:relative;display:inline-block;padding:0 5px}
.bbcd2-row.is-won .bbcd2-who::after{content:'';position:absolute;inset:-4px -3px;border:1.6px solid #8a5a12;
  border-radius:50%;transform:rotate(-3deg);opacity:.8}
.bbcd2-tick{font-family:var(--font-mono,monospace);font-size:9px;color:#6d5f3a}

/* the pinned four */
.bbcd2-hdr{text-align:center;font-family:var(--font-display);font-size:15px;letter-spacing:5px;
  color:#f87171;margin:6px 0 10px;position:relative;z-index:1;transform:rotate(-.6deg)}
.bbcd2-pins{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;position:relative;z-index:1}
.bbcd2-pin{width:88px;text-align:center;padding:7px 5px 6px;border-radius:2px;
  background:rgba(247,242,228,.94);color:#26200f;position:relative;
  box-shadow:0 7px 18px -11px rgba(0,0,0,.95)}
.bbcd2-pin:nth-child(odd){transform:rotate(-2deg)}
.bbcd2-pin:nth-child(even){transform:rotate(1.6deg)}
.bbcd2-pin::before{content:'';position:absolute;top:-4px;left:50%;width:7px;height:7px;margin-left:-3.5px;
  border-radius:50%;background:#b91c1c;box-shadow:0 1px 3px rgba(0,0,0,.6)}
.bbcd2-face{width:52px;height:52px;margin:2px auto 0;border-radius:2px;overflow:hidden;
  border:1px solid rgba(38,32,15,.35);background:#1a150c}
.bbcd2-face img,.bbcd2-face .bb-av,.bbcd2-face .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbcd2-nm{font-size:11px;font-weight:600;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbcd2-t{font-family:var(--font-mono,monospace);font-size:9px;color:#6d5f3a;margin-top:1px}
.bbcd2-pin.is-gone{filter:grayscale(.7);opacity:.72}
.bbcd2-pin.is-gone .bbcd2-nm{text-decoration:line-through;text-decoration-thickness:1.5px}
.bbcd2-gone{font-family:var(--font-mono,monospace);font-size:7px;letter-spacing:1.2px;color:#b91c1c;margin-top:2px}
.bbcd2-legend{text-align:center;font-family:var(--font-mono,monospace);font-size:8px;letter-spacing:1.3px;
  color:#8a7a55;margin-top:12px;position:relative;z-index:1}

@media(prefers-reduced-motion:reduce){.bbcd2-pin,.bbcd2-ballot,.bbcd2-hdr{transform:none!important}}
`;

export function rpBuildBBCampDirector(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'cdir');
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'notice' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'verdict' }];
  const total = steps.length;
  const settled = state.idx >= total - 1;
  // The backyard has not run until the beats have played, so no time and no
  // strike-through may appear before then.
  const ran = state.idx >= 1;

  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const times = act.times || [];

  const BALLOT = `<div class="bbcd2-ballot">
    <div class="bbcd2-bh">CAMP DIRECTOR &#183; ELECTED BY THE CABIN</div>
    ${(act.standing || []).map(s => `
      <div class="bbcd2-row ${s.name === act.director ? 'is-won' : ''}">
        <span class="bbcd2-who">${esc(s.name)}</span>
        <span class="bbcd2-tick">${s.name === act.director ? 'ELECTED' : ''}</span>
      </div>`).join('')}
  </div>`;

  const PINS = `<div class="bbcd2-hdr">HIT THE ROAD</div>
    <div class="bbcd2-pins">${(act.banished || []).map(n => {
    const t = times.find(x => x.name === n);
    const gone = settled && n === act.evicted;
    return `<div class="bbcd2-pin ${gone ? 'is-gone' : ''}" title="${esc(n)}">
        <div class="bbcd2-face">${AV(n, 52)}</div>
        <div class="bbcd2-nm">${esc(n)}</div>
        <div class="bbcd2-t">${ran && t ? t.score.toFixed(1) : '—'}</div>
        ${gone ? '<div class="bbcd2-gone">DID NOT COME BACK</div>' : ''}
      </div>`;
  }).join('') || '<div class="bbcd2-nm">nobody was named</div>'}</div>`;

  const BOARD = `<div class="bbcd2-board">${BALLOT}${PINS}
    <div class="bbcd2-legend">${settled
    ? 'FOUR NAMES, WRITTEN BY ONE PERSON, IN FRONT OF EVERYBODY'
    : 'NOBODY COMPETED FOR THIS JOB &#183; THE ROOM VOTED'}</div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'notice') {
      return _card('THE ROOM VOTES BEFORE IT KNOWS ANYBODY',
        `There is no competition for this. The houseguests elect a Camp Director on their first night,
         having known each other for one afternoon — so the vote goes to whoever seems warmest and least
         dangerous, which is a completely different question from who is best at this game.
         <br><br>Then they find out what the job is. The Camp Director names four people for the
         backyard, out loud, and one of those four does not come back inside.`, 'gold');
    }
    if (step.kind === 'verdict') {
      return _card('ELECTED FOR BEING PLEASANT',
        `${esc(act.evicted || '')} finishes last and is gone before a single Head of Household has been
         crowned. ${esc((act.survivors || []).join(', '))} walk back into the house.
         <br><br>${esc(act.director || 'The Camp Director')} was voted in this morning for being the
         least frightening person in the building, and has spent the evening putting four names on a
         board. Every one of them knows whose handwriting it was. That is the trade this twist makes,
         and it is why the most popular houseguest on night one is so rarely the most popular on night
         two.`,
        'red', 'is-final', [act.director, act.evicted]);
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcd2', css: CD_CSS,
    title: 'THE CAMP DIRECTOR',
    sub: 'Elected by the room. Resented by the morning.',
    stage: BOARD,
    cards: steps.map(card).join(''),
    firstLabel: 'The notice',
  });
}
