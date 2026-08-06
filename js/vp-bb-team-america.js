// ══════════════════════════════════════════════════════════════════════
// vp-bb-team-america.js — the briefing nobody in the house received
// ══════════════════════════════════════════════════════════════════════
//
// Every other twist screen in this catalogue is a room the house is standing
// in. This one cannot be, because the house never sees any of it: three people
// are handed a job in private and the only thing anybody else ever witnesses
// is the work.
//
// So the screen is a DOSSIER — the thing the audience sees and the house does
// not. Stencilled type, a classification stripe, three personnel cards for the
// team, the mission stated as an objective, and a stamp across the whole thing
// when it resolves. It is the one place in the format where the viewer is
// straightforwardly on the other side of the glass from everybody living in
// the house.
//
// The detail that carries it is the EXPOSURE meter. Completing missions pays,
// but being seen is the real currency, and the meter is the only running total
// of how much the house has noticed across the season — which is the number
// the team should be playing against and mostly is not.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const TA_CSS = `
.bbta{--ta-ink:#e8e2d4;--ta-dim:#8a8577;--ta-line:#4a4638;--ta-red:#b8342c;--ta-blue:#3f6d8f}
.bbta-title{font-family:var(--font-display);font-size:clamp(26px,4.6vw,44px);letter-spacing:4px;text-align:center;color:var(--ta-ink);margin:0 0 2px;line-height:1}
.bbta-sub{font-family:var(--font-mono);text-align:center;font-size:9px;letter-spacing:2.6px;color:var(--ta-dim);text-transform:uppercase;margin-bottom:16px}

.bbta-file{position:relative;max-width:940px;margin:0 auto 20px;border:1px solid var(--ta-line);border-radius:3px;overflow:hidden;
  background:linear-gradient(180deg,#22201a 0%,#1a1814 60%,#121110 100%)}
.bbta-file::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.014) 0 2px,transparent 2px 5px)}
.bbta-band{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;
  background:repeating-linear-gradient(45deg,rgba(184,52,44,.22) 0 8px,rgba(184,52,44,.08) 8px 16px);
  border-bottom:1px solid var(--ta-line);font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.4px;color:#e0b3ae;text-transform:uppercase}
.bbta-body{position:relative;padding:14px 14px 58px}

.bbta-team{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:14px}
.bbta-card{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid var(--ta-line);border-radius:2px;background:rgba(255,255,255,.02)}
.bbta-card .bb-av{border:1px solid rgba(232,226,212,.2);filter:grayscale(.55) contrast(1.1)}
.bbta-nm{font-family:var(--font-mono);font-size:10.5px;color:var(--ta-ink);letter-spacing:.6px}
.bbta-role{font-family:var(--font-mono);font-size:7.5px;letter-spacing:1.4px;color:var(--ta-dim);text-transform:uppercase;margin-top:2px}
.bbta-card.is-lead{border-color:#8a7a3c;background:rgba(190,160,70,.09)}
.bbta-card.is-lead .bbta-nm{color:#e0c56a}

.bbta-obj{border:1px solid var(--ta-line);border-left:3px solid var(--ta-blue);padding:10px 12px;margin-bottom:12px;background:rgba(63,109,143,.06)}
.bbta-obj h4{margin:0 0 5px;font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.2px;color:var(--ta-dim);text-transform:uppercase;font-weight:600}
.bbta-obj b{font-family:var(--font-display);font-size:16px;letter-spacing:1.2px;color:var(--ta-ink);display:block;margin-bottom:4px}
.bbta-obj p{margin:0;font-size:11.5px;line-height:1.55;color:#c8c2b4}

.bbta-meters{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:560px){.bbta-meters{grid-template-columns:1fr}}
.bbta-meter{border:1px solid var(--ta-line);padding:8px 10px}
.bbta-mh{display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:8.5px;letter-spacing:1.6px;color:var(--ta-dim);text-transform:uppercase;margin-bottom:5px}
.bbta-mh b{color:var(--ta-ink);font-weight:400}
.bbta-bar{position:relative;height:7px;border:1px solid var(--ta-line);background:rgba(0,0,0,.35)}
.bbta-bar i{position:absolute;top:0;bottom:0;left:0;display:block}
.bbta-bar i.pay{background:linear-gradient(90deg,#6b5a24,#e0c56a)}
.bbta-bar i.exp{background:linear-gradient(90deg,#5a2420,var(--ta-red))}

.bbta-stamp{position:absolute;right:16px;bottom:8px;font-family:var(--font-display);font-size:clamp(20px,4vw,34px);letter-spacing:3px;
  border:3px solid currentColor;padding:2px 12px;transform:rotate(-8deg);opacity:.9;pointer-events:none}
.bbta-stamp.ok{color:#4f8f5b}
.bbta-stamp.no{color:var(--ta-red)}
.bbta-stamp.seen{color:#c08a2e}
@media(prefers-reduced-motion:reduce){.bbta-stamp{transform:none}}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `team-america` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBTeamAmerica(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, 'ta');
  const state = _init(stateKey);

  const m = act.mission || {};
  const beats = act.beats || [];
  const steps = [{ kind: 'brief' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'verdict' }];
  const total = steps.length;
  const resolved = state.idx >= total - 1;

  const cards = (act.members || []).map(n => `<div class="bbta-card ${n === m.lead ? 'is-lead' : ''}">
    ${avatar(n, 30)}
    <span><span class="bbta-nm">${esc(n)}</span>
    <span class="bbta-role">${n === m.lead ? 'running it' : 'in on it'}</span></span></div>`).join('');

  // Paid so far, and how much of the season's noticing they have earned.
  const earned = act.earned || 0;
  const payPct = Math.max(0, Math.min(100, (earned / 30000) * 100));
  const exposure = resolved && m.noticed ? 'The house is looking' : 'Clean, so far';
  const expPct = resolved && m.noticed ? 72 : 18;

  const stamp = !resolved ? ''
    : `<div class="bbta-stamp ${m.done ? (m.noticed ? 'seen' : 'ok') : 'no'}">${
      m.done ? (m.noticed ? 'DONE · SEEN' : 'COMPLETE') : 'FAILED'}</div>`;

  const STAGE = `<div class="bbta-file">
    <div class="bbta-band"><span>Eyes only &middot; not for the house</span>
      <span>Mission ${act.missionNumber || 1}</span></div>
    <div class="bbta-body">
      <div class="bbta-team">${cards}</div>
      <div class="bbta-obj">
        <h4>Objective</h4>
        <b>${esc(m.name || '')}</b>
        <p>${esc(m.ask || '')}</p>
      </div>
      <div class="bbta-meters">
        <div class="bbta-meter">
          <div class="bbta-mh"><span>Paid this season</span><b>$${earned.toLocaleString()}</b></div>
          <div class="bbta-bar"><i class="pay" style="width:${payPct}%"></i></div>
        </div>
        <div class="bbta-meter">
          <div class="bbta-mh"><span>Exposure</span><b>${esc(exposure)}</b></div>
          <div class="bbta-bar"><i class="exp" style="width:${expPct}%"></i></div>
        </div>
      </div>
      ${stamp}
    </div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'brief') {
      return _card('AN ALLIANCE NOBODY CHOSE',
        `The audience picked these three and told each of them privately. None of them chose it, none of
         them can refuse it, and the house is never told it exists.
         <br><br>Which is the cost hidden inside the money: three players who may be on opposite sides of
         this house now have to be seen together often enough to plan. The better they are at the job,
         the more obviously they are working together.`, 'gold', '', act.members || []);
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    if (!m.done) {
      return _card('NOT THIS WEEK',
        `No fee, and nothing gained.
         ${m.noticed
    ? '<br><br>And it was noticed anyway, which is the worst of both: a job not done, and a house that now '
      + 'knows somebody is pushing it. The next mission has to be run through that.'
    : '<br><br>Nobody saw them try, which is the only consolation on offer — a failed mission the house '
      + 'never knew about costs nothing but the money.'}`, 'red', 'is-final', [m.lead]);
    }
    // What the mission actually DID, in one line. The fee is the least
    // interesting thing that happened and it is the only thing the team is
    // told about — this is the part the house is going to be living in.
    const did = m.effect?.note
      ? `<br><br><b style="color:#e0c56a">And the house is different: ${esc(m.effect.note)}</b>` : '';
    return _card(m.noticed ? 'PAID, AND SEEN' : 'PAID, AND CLEAN',
      `The mission lands and all three are paid.${did}
       ${m.noticed
    ? '<br><br>But somebody clocked it. The house does not know who — it knows it is being steered, which '
      + 'is enough to make everybody watch everybody for a week, and the team has to keep meeting anyway.'
    : '<br><br>Nobody saw a thing. The house has just been moved and has no idea it happened.'}`,
      m.noticed ? 'red' : 'gold', 'is-final', act.members || []);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbta', css: TA_CSS,
    title: 'TEAM AMERICA',
    sub: 'Three houseguests · one job · no way to say no',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'The briefing',
  });
}
