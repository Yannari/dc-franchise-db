// ══════════════════════════════════════════════════════════════════════
// vp-bb-twins.js — the two of them, and the house that has one name for it
// ══════════════════════════════════════════════════════════════════════
//
// The audience knows and the house does not, so every screen here is built
// around a thing only the viewer can see: two stat lines under one photograph,
// with the one currently in the building lit. Everything the house notices — a
// conversation that did not happen, a competition they should have won — is
// listed underneath as evidence nobody has assembled yet.
//
// Two screens a week, at opposite ends of it. THE JOB is handed over on Monday
// and the viewer is told what is coming while the house is not; THE WEEK comes
// after eviction night and says whether it came off, who noticed, and how close
// the room is to saying the word.
//
// The comparison bar is the whole idea. A viewer looking at it should be able
// to predict the tell before the house feels it: the twin who is three points
// down on endurance is going to come off that wall early, and somebody in that
// room is going to spend a week unable to say why.

const STYLE = `<style>
.bbtw{--tw-a:#58a6ff;--tw-b:#a371f7;--tw-warn:#e3b341;--tw-bad:#f85149;--tw-ok:#3fb950;
  position:relative;color:#e6edf3}
.bbtw .tw-wrap{max-width:1100px;margin:0 auto;padding:0 12px 24px}
.bbtw .tw-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(60% 40% at 30% 0%,rgba(88,166,255,.14),transparent 60%),
    radial-gradient(60% 40% at 70% 0%,rgba(163,113,247,.14),transparent 60%),
    linear-gradient(180deg,#0d1020,#08090f 62%,#050508)}
.bbtw .tw-head{position:relative;z-index:2;text-align:center;padding:14px 6px 4px}
.bbtw .tw-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:4px;color:#8b949e}
.bbtw .tw-title{font-family:var(--font-display);font-size:32px;letter-spacing:3px;color:#fff;margin:7px 0 3px}
.bbtw .tw-sub{font-size:11.5px;color:#8b949e;max-width:640px;margin:0 auto}

/* ── one photograph, two people ── */
.bbtw .tw-pair{position:relative;z-index:2;display:grid;grid-template-columns:1fr 128px 1fr;gap:14px;
  align-items:center;margin:16px auto 0;max-width:820px;padding:16px;border-radius:12px;
  background:linear-gradient(180deg,rgba(18,20,36,.94),rgba(8,9,16,.96));
  border:1px solid rgba(255,255,255,.1)}
@media(max-width:760px){.bbtw .tw-pair{grid-template-columns:1fr}}
.bbtw .tw-side{padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.08)}
.bbtw .tw-side.is-a{background:linear-gradient(180deg,rgba(88,166,255,.10),transparent)}
.bbtw .tw-side.is-b{background:linear-gradient(180deg,rgba(163,113,247,.10),transparent)}
.bbtw .tw-side.is-on{box-shadow:0 0 0 1px currentColor,0 0 26px rgba(255,255,255,.08)}
.bbtw .tw-side.is-a.is-on{color:var(--tw-a)}
.bbtw .tw-side.is-b.is-on{color:var(--tw-b)}
.bbtw .tw-who{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
.bbtw .tw-who b{font-family:var(--font-display);font-size:16px;color:#fff}
.bbtw .tw-who span{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.6px}
.bbtw .tw-row{display:flex;align-items:center;gap:7px;font-size:10.5px;color:#c9d1d9;margin-bottom:3px}
.bbtw .tw-row i{width:74px;font-style:normal;color:#8b949e;text-transform:capitalize}
.bbtw .tw-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden}
.bbtw .tw-bar b{display:block;height:100%;border-radius:3px;background:currentColor;opacity:.85}
.bbtw .tw-row em{width:22px;text-align:right;font-style:normal;font-family:ui-monospace,Consolas,monospace;
  font-size:9.5px;color:#8b949e}
.bbtw .tw-row.is-up em{color:#7ee787}
.bbtw .tw-row.is-down em{color:#ff8b84}
.bbtw .tw-face{text-align:center}
.bbtw .tw-face figure{width:96px;height:96px;margin:0 auto;border-radius:10px;overflow:hidden;
  border:2px solid rgba(255,255,255,.18)}
.bbtw .tw-face figure .bb-av{width:96px!important;height:96px!important;border-radius:8px}
.bbtw .tw-face .tw-name{font-family:var(--font-display);font-size:17px;color:#fff;margin-top:7px}
.bbtw .tw-face .tw-note{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.4px;
  color:#8b949e;margin-top:3px}

/* ── the card taped under the shelf ── */
.bbtw .tw-job{position:relative;z-index:2;max-width:760px;margin:18px auto 0;padding:18px 20px;
  border-radius:10px;background:linear-gradient(155deg,#f4ecd8,#e6dcc2);color:#2b2415;
  box-shadow:0 14px 34px rgba(0,0,0,.5);transform:rotate(-.5deg)}
.bbtw .tw-job .tw-job-k{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2.6px;
  color:#8a7a52}
.bbtw .tw-job h4{margin:6px 0 8px;font-family:var(--font-display);font-size:25px;letter-spacing:1px;color:#1c170c}
.bbtw .tw-job p{margin:0;font-size:14px;line-height:1.62}
.bbtw .tw-job-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px;
  border-top:1px dashed rgba(43,36,21,.32);padding-top:11px}
.bbtw .tw-chip{font-family:ui-monospace,Consolas,monospace;font-size:8.5px;letter-spacing:1.3px;
  padding:4px 9px;border-radius:20px;background:rgba(43,36,21,.1);color:#4a3f24}
.bbtw .tw-chip.is-pay{background:rgba(46,120,60,.16);color:#2c5c33}
.bbtw .tw-chip.is-risk{background:rgba(160,50,40,.14);color:#8a3128}

/* ── the note left in the storeroom ── */
.bbtw .tw-hand{position:relative;z-index:2;max-width:700px;margin:14px auto 0;padding:13px 16px;
  border-radius:8px;font-size:13px;line-height:1.62;color:#3a3324;
  background:repeating-linear-gradient(180deg,#fbf6e6,#fbf6e6 21px,#e9e0c6 22px);
  box-shadow:0 8px 22px rgba(0,0,0,.42);transform:rotate(.4deg)}
.bbtw .tw-hand b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;
  letter-spacing:2px;color:#8a7a52;margin-bottom:6px}
.bbtw .tw-hand.is-blind{background:linear-gradient(180deg,#2a2118,#1b150f);color:#c9b892;
  box-shadow:0 8px 22px rgba(0,0,0,.6)}
.bbtw .tw-hand.is-blind b{color:var(--tw-bad)}

.bbtw .tw-swap{position:relative;z-index:2;max-width:760px;margin:14px auto 0;padding:12px 15px;
  border-radius:10px;font-size:13.5px;line-height:1.6;color:#d6dde5;
  background:rgba(255,255,255,.04);border-left:3px solid var(--tw-warn)}
.bbtw .tw-swap b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
  color:var(--tw-warn);margin-bottom:5px}
.bbtw .tw-tells{position:relative;z-index:2;max-width:760px;margin:14px auto 0;display:flex;
  flex-direction:column;gap:8px}
.bbtw .tw-tell{padding:11px 13px;border-radius:9px;font-size:13px;line-height:1.6;color:#d6dde5;
  background:linear-gradient(180deg,rgba(20,22,40,.9),rgba(10,11,20,.94));
  border:1px solid rgba(255,255,255,.07);border-left:3px solid var(--tw-a)}
.bbtw .tw-tell b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
  color:#8b949e;margin-bottom:5px}
.bbtw .tw-tell.is-loud{border-left-color:var(--tw-bad)}
.bbtw .tw-tell.is-good{border-left-color:var(--tw-warn)}

/* ── the verdict, big enough to be the first thing you see ── */
.bbtw .tw-verdict{position:relative;z-index:2;max-width:760px;margin:16px auto 0;padding:22px 18px;
  border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,.12);
  background:radial-gradient(70% 120% at 50% 0%,rgba(255,255,255,.07),rgba(0,0,0,.4))}
.bbtw .tw-verdict.is-done{border-color:rgba(227,179,65,.5);
  background:radial-gradient(70% 120% at 50% 0%,rgba(227,179,65,.2),rgba(0,0,0,.5))}
.bbtw .tw-verdict.is-fail{border-color:rgba(248,81,73,.45);
  background:radial-gradient(70% 120% at 50% 0%,rgba(248,81,73,.16),rgba(0,0,0,.5))}
.bbtw .tw-verdict h3{margin:0;font-family:var(--font-display);font-size:clamp(28px,6vw,52px);
  letter-spacing:4px;color:#fff;line-height:1}
.bbtw .tw-verdict .tw-vsub{margin-top:8px;font-size:12px;color:#b9c2cc}

/* ── the quota, and how close the room is ── */
.bbtw .tw-meters{position:relative;z-index:2;max-width:760px;margin:14px auto 0;display:grid;
  grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:640px){.bbtw .tw-meters{grid-template-columns:1fr}}
.bbtw .tw-meter{padding:12px 15px;border-radius:10px;background:rgba(0,0,0,.3);
  border:1px solid rgba(255,255,255,.09)}
.bbtw .tw-meter-h{display:flex;justify-content:space-between;font-family:ui-monospace,Consolas,monospace;
  font-size:8.5px;letter-spacing:1.6px;color:#8b949e;margin-bottom:7px}
.bbtw .tw-meter-t{height:9px;border-radius:5px;background:rgba(255,255,255,.07);overflow:hidden}
.bbtw .tw-meter-t b{display:block;height:100%}
.bbtw .tw-meter-t b.is-quota{background:linear-gradient(90deg,var(--tw-b),var(--tw-warn))}
.bbtw .tw-meter-t b.is-heat{background:linear-gradient(90deg,var(--tw-a),var(--tw-bad))}
.bbtw .tw-pips{display:flex;gap:5px;margin-top:8px}
.bbtw .tw-pip{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.09)}
.bbtw .tw-pip.is-on{background:var(--tw-warn);box-shadow:0 0 10px rgba(227,179,65,.55)}

.bbtw .tw-big{position:relative;z-index:2;max-width:760px;margin:16px auto 0;padding:24px 18px;
  border-radius:12px;text-align:center;border:1px solid rgba(227,179,65,.5);
  background:radial-gradient(70% 110% at 50% 0%,rgba(227,179,65,.22),rgba(0,0,0,.55))}
.bbtw .tw-big figure{width:88px;height:88px;border-radius:10px;overflow:hidden;display:inline-block;
  margin:0 6px;border:3px solid var(--tw-warn);box-shadow:0 0 30px rgba(227,179,65,.4);vertical-align:middle}
.bbtw .tw-big figure .bb-av{width:88px!important;height:88px!important;border-radius:7px}
.bbtw .tw-big h3{margin:12px 0 0;font-family:var(--font-display);font-size:clamp(22px,4vw,36px);color:#fff}
</style>`;

const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

const money = v => `$${(Number(v) || 0).toLocaleString()}`;

function statPanel(label, stats, other, side, on, esc) {
  const rows = KEYS.map(k => {
    const v = Number(stats?.[k]) || 0;
    const d = v - (Number(other?.[k]) || 0);
    return `<div class="tw-row ${d > 0 ? 'is-up' : d < 0 ? 'is-down' : ''}">
      <i>${k}</i><span class="tw-bar"><b style="width:${v * 10}%"></b></span>
      <em>${v}${d ? (d > 0 ? '▲' : '▼') : ''}</em></div>`;
  }).join('');
  return `<div class="tw-side is-${side} ${on ? 'is-on' : ''}">
    <div class="tw-who"><b>${esc(label)}</b><span>${on ? 'IN THE HOUSE' : 'IN THE STOREROOM'}</span></div>
    ${rows}</div>`;
}

/** The pair, under the one photograph the house has of them. */
function pairBlock(act, esc, avatar) {
  const st = act.twins || {};
  const onA = (act.swap?.active || st.active || 'a') === 'a';
  return `<div class="tw-pair">
    ${statPanel(esc(act.front), st.statsA, st.statsB, 'a', onA, esc)}
    <div class="tw-face">
      <figure>${avatar(act.front, 96)}</figure>
      <div class="tw-name">${esc(act.front)}</div>
      <div class="tw-note">ONE PHOTOGRAPH ON THAT WALL</div>
    </div>
    ${statPanel(esc(st.other || 'the other one'), st.statsB, st.statsA, 'b', !onA, esc)}
  </div>`;
}

/** Jobs done out of jobs needed, and how close the room is to the word. */
function meters(done, quota, heat) {
  const pips = Array.from({ length: Math.max(1, quota) },
    (_, i) => `<div class="tw-pip ${i < done ? 'is-on' : ''}"></div>`).join('');
  return `<div class="tw-meters">
    <div class="tw-meter">
      <div class="tw-meter-h"><span>JOBS FINISHED</span><span>${done} / ${quota}</span></div>
      <div class="tw-meter-t"><b class="is-quota" style="width:${
        Math.round(Math.min(1, done / Math.max(1, quota)) * 100)}%"></b></div>
      <div class="tw-pips">${pips}</div>
    </div>
    <div class="tw-meter">
      <div class="tw-meter-h"><span>HOW CLOSE THE HOUSE IS</span><span>${Math.round(heat * 100)}%</span></div>
      <div class="tw-meter-t"><b class="is-heat" style="width:${Math.round(heat * 100)}%"></b></div>
    </div>
  </div>`;
}

const shell = (inner, extra = '') => `<div class="rp-page bbtw">${STYLE}
  <div class="tw-bg"></div><div class="tw-wrap">${inner}</div>${extra}</div>`;

/**
 * THE JOB — Monday, and only the viewer is holding the card.
 */
export function rpBuildBBTwinBrief(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const m = act.mission || {};
  const risk = m.noise >= 0.6 ? 'THE WHOLE HOUSE WILL SEE THIS'
    : m.noise >= 0.38 ? 'SOMEBODY IS LIKELY TO NOTICE' : 'QUIET, IF THEY ARE CAREFUL';
  const hard = m.difficulty >= 0.5 ? 'VERY HARD' : m.difficulty >= 0.35 ? 'HARD' : 'DOABLE';

  return shell(`
    <div class="tw-head">
      <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; ONLY YOU CAN SEE THIS</div>
      <div class="tw-title">THE JOB</div>
      <div class="tw-sub">One card, taped under a shelf in the storeroom, where exactly one person
        in this house ever looks.</div>
    </div>
    ${pairBlock(act, esc, avatar)}
    ${act.swap ? `<div class="tw-swap"><b>THE CHANGEOVER</b>${act.swap.text}</div>` : ''}
    ${act.swap?.handoff ? `<div class="tw-hand ${act.swap.handoff.blind ? 'is-blind' : ''}">
      <b>${act.swap.handoff.blind ? 'NO NOTE' : `THE HANDOFF &middot; ${
        Math.round((act.swap.handoff.quality || 0) * 100)}% OF THE WEEK MADE IT ACROSS`}</b>
      ${act.swap.handoff.text}</div>` : ''}

    <div class="tw-job">
      <div class="tw-job-k">THIS WEEK&rsquo;S JOB</div>
      <h4>${esc(m.name || '')}</h4>
      <p>${esc(m.brief || '')}</p>
      <div class="tw-job-meta">
        <span class="tw-chip is-pay">${money(m.pay)}</span>
        <span class="tw-chip">${hard}</span>
        <span class="tw-chip is-risk">${risk}</span>
      </div>
    </div>

    <div class="tw-tells">${(act.beats || []).map(b => `<div class="tw-tell ${
      act.accepted ? 'is-good' : ''}"><b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>

    ${meters(act.completed || 0, act.quota || 3, act.exposure || 0)}
  `);
}

/**
 * THE WEEK — after eviction night. Did it come off, and who felt it.
 */
export function rpBuildBBTwinWeek(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const d = act.debrief || null;
  const tells = act.tells?.beats || [];
  const verdict = !d ? null
    : d.declined ? { cls: '', big: 'NO JOB', sub: 'They turned it down. The week does not count towards anything.' }
      : d.impossible ? { cls: '', big: 'NO WAY IN', sub: 'The week never gave them the opening the job needed.' }
        : d.worked ? { cls: 'is-done', big: 'JOB DONE',
          sub: `${esc(d.mission?.name || '')} &middot; ${money(d.paid)} banked` }
          : { cls: 'is-fail', big: 'JOB FAILED',
            sub: `${esc(d.mission?.name || '')} &middot; nothing paid, and it does not count` };

  return shell(`
    <div class="tw-head">
      <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; ONLY YOU CAN SEE THIS</div>
      <div class="tw-title">TWO OF THEM</div>
      <div class="tw-sub">The house has one name for this person and has never counted them.</div>
    </div>

    ${verdict ? `<div class="tw-verdict ${verdict.cls}">
      <h3>${verdict.big}</h3><div class="tw-vsub">${verdict.sub}</div></div>` : ''}

    ${pairBlock(act, esc, avatar)}

    ${(d?.beats || []).length ? `<div class="tw-tells">${d.beats.map(b => `<div class="tw-tell ${
      b.badgeClass === 'gold' ? 'is-good' : ''}"><b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>` : ''}

    ${tells.length ? `<div class="tw-tells">${tells.map(b => `<div class="tw-tell ${
      b.badgeText === 'SOMETHING THEY CANNOT DO' ? 'is-loud' : ''
    }"><b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>`
    : `<div class="tw-swap" style="border-left-color:#3fb950"><b>NOBODY FELT A THING</b>
        A whole week of one of them at a time, and not one person in that house noticed anything worth
        mentioning. Which is the best possible week and the least interesting one to watch.</div>`}

    ${meters(act.completed || 0, act.quota || 3, act.exposureLevel || 0)}
  `);
}

/** Both of them, at last. */
export function rpBuildBBTwinEntry(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  return shell(`
    <div class="tw-head">
      <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; THE QUOTA, MET</div>
      <div class="tw-title">BOTH OF THEM</div>
      <div class="tw-sub">${act.completed || 0} jobs across ${act.swaps || 0} changeovers, and not one of
        them was ever meant to be possible for one person.</div>
    </div>
    <div class="tw-verdict is-done">
      <h3>THEY BOTH GET IN</h3>
      <div class="tw-vsub">${money(act.banked)} banked &middot; one photograph becomes two</div>
    </div>
    <div class="tw-big">
      <figure>${avatar(act.front, 88)}</figure><figure>${avatar(act.other, 88)}</figure>
      <h3>${esc(act.front)} &amp; ${esc(act.other)}</h3>
    </div>
    <div class="tw-tells">${(act.beats || []).map(b => `<div class="tw-tell is-good">
      <b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>
  `);
}

/**
 * Somebody said it out loud — or nobody ever did, and the season ran out.
 *
 * The same screen for both, because they are the same ending from the twins'
 * side: the jobs stop, the second one never plays, and the room finds out
 * anyway. The only difference is who is holding the moment.
 */
export function rpBuildBBTwinCaught(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const quiet = !!act.unfinished;
  return shell(`
    <div class="tw-head">
      <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; ${quiet ? 'THE SEASON RAN OUT' : 'SOMEBODY SAID IT'}</div>
      <div class="tw-title">${quiet ? 'NOBODY EVER KNEW' : 'THERE ARE TWO OF THEM'}</div>
      <div class="tw-sub">${quiet
        ? `${esc(act.swaps || 0)} changeovers and not one person in that house ever said the word.
           It made no difference: they needed ${esc(act.quota)} jobs and finished ${esc(act.completed)}.`
        : `${esc(act.teller)} says it in front of everybody, and the jobs stop where they are.`}</div>
    </div>
    <div class="tw-verdict is-fail">
      <h3>${quiet ? 'NOT ENOUGH' : 'FOUND OUT'}</h3>
      <div class="tw-vsub">${esc(act.completed || 0)} of ${esc(act.quota || 0)} jobs finished
        &middot; ${money(act.lost)} unpaid &middot; ${esc(act.other)} never plays</div>
    </div>
    <div class="tw-big" style="border-color:rgba(248,81,73,.5);
      background:radial-gradient(70% 110% at 50% 0%,rgba(248,81,73,.2),rgba(0,0,0,.55))">
      <figure style="border-color:#f85149;box-shadow:0 0 30px rgba(248,81,73,.4)">${avatar(act.front, 88)}</figure>
      <figure style="border-color:#f85149;box-shadow:0 0 30px rgba(248,81,73,.4)">${avatar(act.other, 88)}</figure>
      <h3>${esc(act.front)} &amp; ${esc(act.other)}</h3>
    </div>
    ${pairBlock(act, esc, avatar)}
    <div class="tw-tells">${(act.beats || []).map(b => `<div class="tw-tell is-loud">
      <b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>
  `);
}

/** One eviction, two people. */
export function rpBuildBBTwinOut(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  return shell(`
    <div class="tw-head">
      <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; ONE VOTE, TWO PEOPLE</div>
      <div class="tw-title">THERE WERE TWO</div>
      <div class="tw-sub">The house gets its answer about four seconds too late to use it.</div>
    </div>
    <div class="tw-verdict is-fail">
      <h3>BOTH OF THEM GO</h3>
      <div class="tw-vsub">${esc(act.completed || 0)} of ${esc(act.quota || 0)} jobs finished
        &middot; ${money(act.lost)} banked and lost in the same sentence</div>
    </div>
    <div class="tw-big" style="border-color:rgba(248,81,73,.5);
      background:radial-gradient(70% 110% at 50% 0%,rgba(248,81,73,.22),rgba(0,0,0,.55))">
      <figure style="border-color:#f85149;box-shadow:0 0 30px rgba(248,81,73,.4)">${avatar(act.front, 88)}</figure>
      <figure style="border-color:#f85149;box-shadow:0 0 30px rgba(248,81,73,.4);filter:grayscale(.6)">${avatar(act.other, 88)}</figure>
      <h3>${esc(act.front)} &amp; ${esc(act.other)}</h3>
    </div>
    <div class="tw-tells">${(act.beats || []).map(b => `<div class="tw-tell is-loud">
      <b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>
  `);
}
