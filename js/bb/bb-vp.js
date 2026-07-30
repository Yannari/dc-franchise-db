// Big Brother visual-player builders. Pure screen construction plus small,
// prefixed reveal helpers; integration only needs to register the exports.

const ACT_META = [
  { id: 'hoh', label: 'HOH', title: 'Head of Household', kicker: 'POWER CHANGES HANDS' },
  { id: 'nominations', label: 'Noms', title: 'Nomination Ceremony', kicker: 'TWO KEYS ARE MISSING' },
  { id: 'veto', label: 'Veto', title: 'Power of Veto', kicker: 'SIX PLAY · ONE CAN CHANGE THE WEEK' },
  { id: 'veto-ceremony', label: 'Ceremony', title: 'Veto Ceremony', kicker: 'THE BLOCK IS FINAL' },
  { id: 'campaign', label: 'Campaign', title: 'The Campaign', kicker: 'EVERY CONVERSATION CAN MOVE A VOTE' },
  { id: 'eviction', label: 'Eviction', title: 'Live Eviction', kicker: 'ONE HOUSEGUEST LEAVES' },
];

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = name => String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

function portrait(name, role = '') {
  return `<div class="bbvp-person ${role ? `bbvp-person--${role}` : ''}">
    <div class="bbvp-avatar"><img src="assets/avatars/${slug(name)}.png" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${esc(String(name || '?')[0])}</span></div>
    <strong>${esc(name)}</strong>${role ? `<small>${esc(role.replace(/-/g, ' '))}</small>` : ''}
  </div>`;
}

function styles() {
  return `<style>
  .bbvp{--bb-red:#c9343c;--bb-ink:#f4efe6;--bb-muted:#a9a39a;--bb-line:rgba(244,239,230,.14);font-family:var(--font-body,system-ui);color:var(--bb-ink);background:#111214;min-height:100%;padding:24px;box-sizing:border-box}
  .bbvp *{box-sizing:border-box}.bbvp-head{border-bottom:1px solid var(--bb-line);padding-bottom:16px;margin-bottom:20px}.bbvp-live{font-size:10px;font-weight:900;letter-spacing:2.4px;color:#ef6269}.bbvp h1{font-family:var(--font-display,var(--font-body,system-ui));font-size:clamp(25px,4vw,46px);line-height:1;margin:8px 0 5px}.bbvp-kicker{font-size:11px;letter-spacing:1.7px;color:var(--bb-muted)}
  .bbvp-rail{display:grid;grid-template-columns:repeat(auto-fit,minmax(82px,1fr));gap:4px;margin:18px 0 24px}.bbvp-act{border-top:3px solid #34363a;padding:7px 4px 0;color:#777;font-size:9px;text-transform:uppercase;letter-spacing:.5px}.bbvp-act--past{border-color:#777;color:#aaa}.bbvp-act--now{border-color:var(--bb-red);color:#fff;font-weight:900}
  .bbvp-stage{max-width:920px;margin:0 auto}.bbvp-card{background:#191b1e;border:1px solid var(--bb-line);border-left:3px solid #52555b;padding:18px;margin:12px 0}.bbvp-card--power{border-left-color:var(--bb-red)}.bbvp-card--safe{border-left-color:#4b9d70}.bbvp-eyebrow{font-size:9px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase;color:var(--bb-muted);margin-bottom:10px}.bbvp-cast{display:flex;flex-wrap:wrap;gap:12px}.bbvp-person{display:grid;grid-template-columns:48px auto;grid-template-rows:24px 20px;column-gap:10px;align-items:center;min-width:150px}.bbvp-person strong{font-size:13px}.bbvp-person small{text-transform:uppercase;letter-spacing:1px;color:var(--bb-muted);font-size:8px}.bbvp-avatar{grid-row:1/3;width:48px;height:48px;border:2px solid #46494f;background:#25272b;overflow:hidden}.bbvp-avatar img,.bbvp-avatar span{width:100%;height:100%;object-fit:cover}.bbvp-avatar span{display:none;place-items:center;font-weight:900}.bbvp-person--hoh .bbvp-avatar,.bbvp-person--veto .bbvp-avatar{border-color:#d7ae58}.bbvp-person--nominee .bbvp-avatar,.bbvp-person--evicted .bbvp-avatar{border-color:var(--bb-red)}
  .bbvp-plan{display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:12px}.bbvp-chip{border:1px solid var(--bb-line);padding:6px 9px;text-transform:uppercase;letter-spacing:.7px;font-size:9px}.bbvp-chip--private{border-style:dashed;color:#d7ae58}.bbvp-arrow{color:#666}.bbvp-step{display:none}.bbvp-step--shown{display:block;animation:bbvp-in .2s ease-out}@keyframes bbvp-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.bbvp-step--shown{animation:none}}
  .bbvp-controls{display:flex;align-items:center;gap:10px;margin-top:18px}.bbvp-btn{min-height:44px;border:1px solid #666;background:#f4efe6;color:#111;padding:0 18px;font-weight:900;letter-spacing:1px;text-transform:uppercase;cursor:pointer}.bbvp-btn--all{background:transparent;color:#ddd}.bbvp-count{font-size:10px;letter-spacing:1px;color:var(--bb-muted);margin-left:auto}.bbvp-votes{display:grid;gap:8px}.bbvp-vote{display:grid;grid-template-columns:minmax(90px,1fr) 3fr auto;align-items:center;gap:10px;font-size:12px}.bbvp-bar{height:8px;background:#292b2f;overflow:hidden}.bbvp-fill{height:100%;background:var(--bb-red)}.bbvp-shift{color:#d7ae58;font-size:10px}.bbvp-verdict{text-align:center;padding:26px 12px}.bbvp-verdict strong{display:block;font-size:clamp(30px,6vw,64px);line-height:1;margin:10px 0;color:#fff}.bbvp-note{font-size:12px;color:var(--bb-muted);line-height:1.55}
  .bbvp-comp-name{font-family:var(--font-display,var(--font-body,system-ui));font-size:clamp(19px,3vw,30px);line-height:1.1;color:#fff}
  .bbvp-card--comp{border-left-color:#d7ae58;background:#1b1a17}
  .bbvp-card--house{border-left-style:dashed;border-left-color:#5a6b8c;background:#16181c}
  .bbvp-badge{display:inline-block;padding:3px 7px;border:1px solid currentColor;font-size:8px;letter-spacing:1.3px}
  .bbvp-badge--red{color:#ef6269}.bbvp-badge--green{color:#5fbf8c}.bbvp-badge--gold{color:#d7ae58}.bbvp-badge--blue{color:#7aa7e0}.bbvp-badge--grey{color:#9aa0a8}
  @media(max-width:680px){.bbvp{padding:16px}.bbvp-rail{grid-template-columns:repeat(3,1fr);row-gap:10px}.bbvp-vote{grid-template-columns:85px 1fr}.bbvp-vote>*:last-child{grid-column:2}.bbvp-controls{flex-wrap:wrap}.bbvp-count{width:100%;margin-left:0}}
  </style>`;
}

function rail(labels, activeIndex) {
  return `<div class="bbvp-rail" aria-label="Week progress">${labels.map((label, index) => `<div class="bbvp-act ${index < activeIndex ? 'bbvp-act--past' : index === activeIndex ? 'bbvp-act--now' : ''}"${index === activeIndex ? ' aria-current="step"' : ''}>${index + 1} · ${esc(label)}</div>`).join('')}</div>`;
}

function revealState(key) {
  if (typeof window === 'undefined') return -1;
  window._bbVpState ||= {};
  window._bbVpState[key] ||= { idx: -1 };
  return window._bbVpState[key].idx;
}

function steps(key, items) {
  const idx = revealState(key);
  return `${items.map((html, i) => `<div id="bbvp-step-${esc(key)}-${i}" class="bbvp-step ${i <= idx ? 'bbvp-step--shown' : ''}" data-bbvp-step="${i}">${html}</div>`).join('')}
    <div class="bbvp-controls" id="bbvp-controls-${esc(key)}">
      <button class="bbvp-btn" type="button" onclick="bbVpRevealNext('${esc(key)}',${items.length})">Reveal next</button>
      <button class="bbvp-btn bbvp-btn--all" type="button" onclick="bbVpRevealAll('${esc(key)}',${items.length})">Reveal all</button>
      <span class="bbvp-count" id="bbvp-count-${esc(key)}">${Math.max(0, idx + 1)} / ${items.length} revealed</span>
    </div>`;
}

function shell(week, meta, body, actIndex, labels) {
  return `${styles()}<article class="bbvp" data-bb-week="${Number(week.num) || 1}" data-bb-act="${actIndex}">
    <div class="bbvp-stage"><header class="bbvp-head"><div class="bbvp-live">● BIG BROTHER · WEEK ${Number(week.num) || 1}${week.compressed ? ' · LIVE DOUBLE EVICTION' : ''}</div><h1>Act ${actIndex + 1}: ${esc(meta.title)}</h1><div class="bbvp-kicker">${esc(meta.kicker)}</div></header>${rail(labels, actIndex)}${body}</div></article>`;
}

function tallyCard(title, tally, previous = null) {
  const entries = Object.entries(tally || {});
  const max = Math.max(1, ...entries.map(([, value]) => Number(value) || 0));
  return `<div class="bbvp-card"><div class="bbvp-eyebrow">${esc(title)}</div><div class="bbvp-votes">${entries.map(([name, value]) => {
    const before = previous?.[name];
    const delta = before == null ? 0 : value - before;
    return `<div class="bbvp-vote"><strong>${esc(name)}</strong><div class="bbvp-bar"><div class="bbvp-fill" style="width:${Math.round(value / max * 100)}%"></div></div><span>${value} vote${value === 1 ? '' : 's'}${delta ? ` <em class="bbvp-shift">${delta > 0 ? '+' : ''}${delta}</em>` : ''}</span></div>`;
  }).join('')}</div></div>`;
}

/**
 * The competition itself — which one was played, and what happened in it.
 *
 * The engine produces a named competition with several narrated beats per week;
 * without this the visual player showed only who threw it and who won, which
 * threw away almost everything the competition library generates.
 */
function competitionHeader(comp) {
  if (!comp) return '';
  return `<div class="bbvp-card"><div class="bbvp-eyebrow">Tonight's competition${comp.category ? ` · ${esc(comp.category)}` : ''}</div><div class="bbvp-comp-name">${esc(comp.name)}</div></div>`;
}

function competitionBeats(comp) {
  return (comp?.beats || []).map(beat =>
    `<div class="bbvp-card bbvp-card--comp"><div class="bbvp-eyebrow">${esc(beat.badgeText || 'Competition')}</div><div class="bbvp-note">${esc(beat.text)}</div></div>`);
}

/**
 * House life — the events between the ceremonies.
 *
 * Deliberately styled apart from the game cards. These are the alliances,
 * blow-ups, rumours and small hours that the rest of the week is made of, and
 * the visual player rendered none of them.
 */
function houseBeats(act) {
  return (act?.socialBeats || []).map(beat =>
    `<div class="bbvp-card bbvp-card--house"><div class="bbvp-eyebrow"><span class="bbvp-badge bbvp-badge--${esc(beat.badgeClass || 'grey')}">${esc(beat.badgeText || 'House')}</span></div><div class="bbvp-note">${esc(beat.text)}</div></div>`);
}

function hohScreen(week, act, key, index, labels) {
  const ranked = act.results || [];
  const threw = ranked.filter(entry => entry.threw);
  return shell(week, ACT_META[0], `<div class="bbvp-card"><div class="bbvp-eyebrow">Eligible to compete${act.outgoingHoh ? ` · ${esc(act.outgoingHoh)} sits out` : ''}</div><div class="bbvp-note">${ranked.length} houseguests enter. Some want power; others know winning paints a target.</div></div>${competitionHeader(act.competition)}${steps(key, [
    ...competitionBeats(act.competition),
    `<div class="bbvp-card"><div class="bbvp-eyebrow">Competition read</div><div class="bbvp-note">${threw.length ? `${esc(threw.map(entry => entry.name).join(', '))} held back intentionally.` : 'Nobody visibly threw the competition.'}</div></div>`,
    `<div class="bbvp-card bbvp-card--power"><div class="bbvp-eyebrow">New Head of Household</div>${portrait(act.winner, 'hoh')}</div>`,
    ...houseBeats(act),
  ])}`, index, labels);
}

function nominationScreen(week, act, key, index, labels) {
  const plan = week.plan || {};
  return shell(week, ACT_META[1], `<div class="bbvp-card"><div class="bbvp-eyebrow">Inside the HOH room · private intent</div><div class="bbvp-plan"><span class="bbvp-chip bbvp-chip--private">Target: ${esc(plan.target || '?')}</span><span class="bbvp-arrow">→</span><span class="bbvp-chip bbvp-chip--private">Pawn: ${esc(plan.pawn || '?')}</span>${plan.backdoorTarget ? `<span class="bbvp-chip bbvp-chip--private">Backdoor: ${esc(plan.backdoorTarget)}</span>` : ''}</div></div>${steps(key, [
    `<div class="bbvp-card"><div class="bbvp-eyebrow">The first key turns</div>${portrait(act.nominees?.[0], 'nominee')}</div>`,
    `<div class="bbvp-card bbvp-card--power"><div class="bbvp-eyebrow">The second key turns · nominations are locked</div><div class="bbvp-cast">${(act.nominees || []).map(name => portrait(name, 'nominee')).join('')}</div></div>`,
    ...houseBeats(act),
  ])}`, index, labels);
}

function vetoScreen(week, act, key, index, labels) {
  return shell(week, ACT_META[2], `<div class="bbvp-card"><div class="bbvp-eyebrow">Veto draw</div><div class="bbvp-cast">${(act.participants || []).map(name => portrait(name)).join('')}</div></div>${competitionHeader(act.competition)}${steps(key, [
    ...competitionBeats(act.competition),
    `<div class="bbvp-card bbvp-card--power"><div class="bbvp-eyebrow">Power of Veto winner</div>${portrait(act.winner, 'veto')}</div>`,
    ...houseBeats(act),
  ])}`, index, labels);
}

function ceremonyScreen(week, act, key, index, labels) {
  const first = act.used
    ? `<div class="bbvp-card bbvp-card--safe"><div class="bbvp-eyebrow">The veto is used</div>${portrait(act.saved, 'saved')}</div>`
    : `<div class="bbvp-card"><div class="bbvp-eyebrow">The veto is not used</div><div class="bbvp-note">The HOH's original nominations survive the ceremony.</div></div>`;
  const final = `<div class="bbvp-card bbvp-card--power"><div class="bbvp-eyebrow">Final nominees${act.replacement ? ` · ${esc(act.replacement)} takes the empty chair` : ''}</div><div class="bbvp-cast">${(act.nominees || []).map(name => portrait(name, 'nominee')).join('')}</div></div>`;
  return shell(week, ACT_META[3], steps(key, [first, final, ...houseBeats(act)]), index, labels);
}

function campaignScreen(week, act, meta, key, previousTally, index, labels) {
  const successful = (act.events || []).filter(event => event.success);
  const eventCards = (act.events || []).map(event => `<div class="bbvp-card"><div class="bbvp-eyebrow">${event.success ? 'Pitch lands' : 'Pitch resisted'}</div><div class="bbvp-note"><strong>${esc(event.nominee)}</strong> works on ${esc(event.voter)}. ${event.success ? 'The voter becomes persuadable.' : 'The voter does not commit.'}</div></div>`);
  return shell(week, meta, `<div class="bbvp-card"><div class="bbvp-eyebrow">Campaign temperature</div><div class="bbvp-note">${successful.length} of ${(act.events || []).length} pitches found an opening.</div></div>${steps(key, [...eventCards, ...houseBeats(act), tallyCard('Where the vote stands', act.votesAfterAct, previousTally)])}`, index, labels);
}

function evictionScreen(week, act, key, index, labels) {
  const ballotSteps = (act.ballots || []).map(ballot => `<div class="bbvp-card"><div class="bbvp-eyebrow">${esc(ballot.voter)} has voted</div><div class="bbvp-note">“I vote to evict <strong>${esc(ballot.evict)}</strong>.”${ballot.changed ? ` <span class="bbvp-shift">Campaign changed this vote.</span>` : ''}</div></div>`);
  const tie = act.tieBreak ? `<div class="bbvp-card bbvp-card--power"><div class="bbvp-eyebrow">The vote is tied · HOH breaks it</div><div class="bbvp-note">${esc(act.tieBreak.voter)} casts the deciding vote against <strong>${esc(act.tieBreak.evict)}</strong>.</div></div>` : '';
  const verdict = `<div class="bbvp-card bbvp-card--power bbvp-verdict"><div class="bbvp-eyebrow">Evicted from the Big Brother house</div>${portrait(act.evicted, 'evicted')}<strong>${esc(act.evicted)}</strong><div class="bbvp-note">By a vote of ${Object.values(act.votes || {}).sort((a,b)=>b-a).join('–') || '0–0'}.</div></div>`;
  return shell(week, ACT_META[5], `${tallyCard('Final locked vote', act.votes, week.preCampaignVotes)}${steps(key, [...ballotSteps, tie, verdict].filter(Boolean))}`, index, labels);
}

export function buildBBVPScreens(week) {
  if (!week?.acts || week.acts.length < 6) throw new Error('A Big Brother VP week requires the complete act sequence.');
  const fixed = type => week.acts.find(act => act.type === type);
  const campaigns = week.acts.filter(act => act.type === 'campaign');
  const prefix = `bb-w${Number(week.num) || 1}${week.compressed ? '-de' : ''}`;
  const labels = ['HOH', 'Nominations', 'Veto', 'Ceremony', ...campaigns.map((_, i) => campaigns.length > 1 ? `Campaign ${i + 1}` : 'Campaign'), 'Eviction'];
  const descriptors = [
    { id: 'hoh', label: 'HOH', build: (i) => hohScreen(week, fixed('hoh'), `${prefix}-a${i}`, i, labels) },
    { id: 'nominations', label: 'Nominations', build: (i) => nominationScreen(week, fixed('nominations'), `${prefix}-a${i}`, i, labels) },
    { id: 'veto', label: 'Veto', build: (i) => vetoScreen(week, fixed('veto'), `${prefix}-a${i}`, i, labels) },
    { id: 'ceremony', label: 'Ceremony', build: (i) => ceremonyScreen(week, fixed('veto-ceremony'), `${prefix}-a${i}`, i, labels) },
    ...campaigns.map((act, campaignIndex) => ({ id: `campaign-${campaignIndex + 1}`, label: campaigns.length > 1 ? `Campaign ${campaignIndex + 1}` : 'Campaign', build: (i) => campaignScreen(week, act, ACT_META[4], `${prefix}-a${i}`, campaignIndex ? campaigns[campaignIndex - 1].votesAfterAct : week.preCampaignVotes, i, labels) })),
    { id: 'eviction', label: 'Eviction', build: (i) => evictionScreen(week, fixed('eviction'), `${prefix}-a${i}`, i, labels) },
  ];
  return descriptors.map((descriptor, index) => ({ id: `${prefix}-${descriptor.id}`, label: `Act ${index + 1} · ${descriptor.label}`, html: descriptor.build(index) }));
}

export function buildBBDoubleEvictionVPScreens(result) {
  if (result?.twist !== 'double-eviction' || result.weeks?.length !== 2) {
    throw new Error('Double Eviction VP requires the two-week Double Eviction result.');
  }
  return result.weeks.flatMap(buildBBVPScreens);
}

function applyReveal(key, total) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const state = window._bbVpState?.[key];
  if (!state) return;
  for (let i = 0; i < total; i++) {
    document.getElementById(`bbvp-step-${key}-${i}`)?.classList.toggle('bbvp-step--shown', i <= state.idx);
  }
  const count = document.getElementById(`bbvp-count-${key}`);
  if (count) count.textContent = `${Math.max(0, state.idx + 1)} / ${total} revealed`;
}

export function bbVpRevealNext(key, total) {
  if (typeof window === 'undefined') return;
  window._bbVpState ||= {};
  window._bbVpState[key] ||= { idx: -1 };
  window._bbVpState[key].idx = Math.min(total - 1, window._bbVpState[key].idx + 1);
  applyReveal(key, total);
}

export function bbVpRevealAll(key, total) {
  if (typeof window === 'undefined') return;
  window._bbVpState ||= {};
  window._bbVpState[key] = { idx: total - 1 };
  applyReveal(key, total);
}
