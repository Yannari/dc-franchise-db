// ══════════════════════════════════════════════════════════════════════
// rr/threads.js — storylines the engine carries across legs
// ══════════════════════════════════════════════════════════════════════
//
// docs/ridonculous-race-scenes.md "Threads". A thread is opened by a scene, advanced by
// the scenes that are its later steps, and closed by its ending scenes. Nothing here
// decides an ending: threads only read the record and tell the talk layer which scene
// a storyline wants next (threadSteps), so a crush interrupted twice gets its confession
// before the season ends and a rivalry that has been building gets its payoff.
const DATING = ['dating', 'newly-dating', 'on-off', 'married', 'once-engaged'];
const SAB = ['push', 'ram', 'steal', 'kidnap-pet', 'course-sabotage', 'fake-shortcut', 'mind-game'];
const o = (kind, endings = null) => ({ kind, endings });

// who: 'person' (the people the scene names: a crush's two lovers), 'team' (the scene's team),
// 'teams' (the scene's two teams). `if` narrows an opening by the team it would open on.
export const THREADS = {
  crush: { who: 'person',
    opens: [o('crush-noticed'), o('flirt', ['returned']), o('crush-confided')],
    steps: ['crush-noticed', 'crush-confided', 'flirt', 'near-kiss', 'confession-attempt', 'confession'],
    closes: [o('confession', ['mutual', 'crushed', 'reversed', 'not-now']), o('near-kiss', ['kiss']), o('goodbye-kiss')] },
  rivalry: { who: 'teams',
    opens: [o('trash-talk'), o('gloat', ['rubbed-in']), o('mock-the-struggle', ['laugh']), o('queue-jump', ['called-out']),
      o('accusation'), o('tug-of-war', ['win', 'lose']), o('boomerang-decide', ['target-rival', 'standoff']),
      ...SAB.map(k => o(k, ['works', 'seen']))],
    steps: ['trash-talk', 'gloat', 'shove', ...SAB, 'confront', 'revenge'],
    closes: [o('save-your-enemy', ['saves']), o('comeuppance'), o('revenge', ['takes-high-road'])] },
  debt: { who: 'teams',
    opens: [o('help-offer', ['accepted']), o('rescue', ['saves']), o('deal', ['struck']), o('borrow', ['lent'])],
    steps: ['repay', 'romance-costs', 'medevac-choice', 'express-give'],
    closes: [o('repay'), o('medevac-choice', ['repays-kindness']), o('express-give', ['to-an-ally']), o('deal-broken', ['walk-away'])] },
  secret: { who: 'team',
    opens: [o('old-wound', ['surfaces'])],
    steps: ['old-wound', 'makeup'],
    closes: [o('old-wound', ['told-calmly', 'explodes']), o('makeup', ['grand-gesture'])] },
  curse: { who: 'team',
    opens: [o('local-rule', ['broken']), o('souvenir', ['kept'])],
    steps: ['weather', 'identity-crisis', 'local-help', 'souvenir'],
    closes: [o('souvenir', ['left']), o('local-help', ['accepted'])] },
  'team-bond': { who: 'team',
    opens: [o('blame', ['deflected', 'blow-up']), o('snap')],
    if: (st, id) => ['exes', 'enemies', 'rivals', 'on-off', 'once-engaged'].includes(st.teams[id]?.rel),
    steps: ['blame', 'pep-talk', 'bond-moment'],
    closes: [o('bond-moment', ['gratitude']), o('breakup', ['ends-it'])] },
  alliance: { who: 'teams',
    opens: [o('alliance-pitch', ['accepted', 'trial']), o('secret-meeting'), o('superteam-pick', ['chosen'])],
    steps: ['alliance-check', 'share-info', 'alliance-betrayal'],
    closes: [o('alliance-betrayal', ['discovered']), o('deal-broken', ['walk-away'])] },
  villain: { who: 'team',
    opens: SAB.map(k => o(k, ['works', 'seen'])),
    steps: ['accusation', 'confront', 'revenge', 'comeuppance'],
    closes: [o('comeuppance'), o('save-your-enemy', ['saves'])] },
  underdog: { who: 'team',
    opens: [o('don-fakeout', ['relief'])],
    steps: ['celebrate', 'identity-moment', 'don-place'],
    closes: [o('int-exit'), o('int-bleachers')] },
  breakup: { who: 'team',
    opens: [o('snap'), o('blame', ['blow-up'])],
    if: (st, id) => DATING.includes(st.teams[id]?.rel),
    steps: ['silent-treatment', 'breakup', 'back-together'],
    closes: [o('makeup'), o('back-together', ['kiss']), o('breakup', ['ends-it'])] },
  broke: { who: 'team',
    opens: [o('money-worry'), o('surrender')],
    steps: ['beg', 'sell', 'borrow', 'repay'],
    closes: [o('beg', ['generous']), o('repay', ['paid']), o('reward', ['prize-joy'])] },
  injury: { who: 'team',
    opens: [o('injury', ['carried', 'serious'])],
    steps: ['exhaustion', 'quit-talk', 'medevac-choice'],
    closes: [o('exhaustion', ['second-wind']), o('quit-talk', ['talked-back']), o('medevac-choice')] },
  leader: { who: 'team',
    opens: [o('leader-shift')],
    steps: ['decide-side', 'plan-the-leg', 'leader-shift'],
    closes: [o('decide-side', ['agree']), o('plan-the-leg', ['strategy'])] },
};
for (const [id, t] of Object.entries(THREADS)) t.id = id;

const people = (st, id) => (id && st.teams[id] ? [st.teams[id].a, st.teams[id].b] : []);
const matches = (list, sc) => list.some(x => x.kind === sc.kind && (!x.endings || x.endings.includes(sc.data?.ending)));
const subset = (a, b) => a.every(x => b.includes(x));

function whoFor(st, def, sc) {
  if (def.who === 'person') return [...new Set(sc.data?.facts?.lovers?.filter(Boolean) || sc.who.slice(0, 1))];
  if (def.who === 'teams') return sc.data?.other ? [...people(st, sc.data.team), ...people(st, sc.data.other)] : [];
  return people(st, sc.data?.team);
}
const participants = (st, sc) => [...new Set([...people(st, sc.data?.team), ...people(st, sc.data?.other), ...(sc.who || [])])];
const keyOf = who => [...who].sort().join('|');
const teamsGone = (st, who) => who.every(n => st.gone.some(id => people(st, id).includes(n)));

// Read one scene into the threads: close, advance, or open. A null scene only sweeps
// the threads whose people have all left the race.
export function advanceThreads(state, sc) {
  state.threads ||= [];
  for (const th of state.threads) if (!th.closed && teamsGone(state, th.who)) th.closed = 'gone';
  if (!sc) return;
  const here = participants(state, sc);
  for (const th of state.threads) {
    if (th.closed || !subset(th.who, here)) continue;
    const def = THREADS[th.thread];
    if (matches(def.closes, sc)) { th.closed = `${sc.kind}:${sc.data.ending}`; th.lastLeg = state.leg; continue; }
    if (sc.data?.ending === 'interrupted') continue;      // an interruption leaves the thread where it was
    const idx = def.steps.indexOf(sc.kind);
    if (idx >= th.step) { th.step = idx + 1; th.lastLeg = state.leg; }
  }
  for (const def of Object.values(THREADS)) {
    if (!matches(def.opens, sc)) continue;
    if (def.if && !def.if(state, sc.data?.team)) continue;
    const who = whoFor(state, def, sc);
    if (who.length < (def.who === 'team' ? 2 : def.who === 'teams' ? 4 : 1)) continue;
    const k = keyOf(who);
    if (state.threads.some(t => !t.closed && t.thread === def.id && keyOf(t.who) === k)) continue;
    state.threads.push({ id: `th${state.threads.length + 1}`, thread: def.id, who, step: def.steps.indexOf(sc.kind) + 1,
      since: state.leg, lastLeg: state.leg, closed: null, cause: sc.id });
  }
}

// The next step of every open thread whose people are all here, longest-waiting and
// nearest to the payoff first.
export function threadSteps(state, here) {
  const out = [];
  for (const th of state.threads || []) {
    if (th.closed || !subset(th.who, here)) continue;
    const def = THREADS[th.thread];
    const kindId = def.steps[th.step] ?? def.closes[0].kind;
    const weight = 1 + 0.25 * (state.leg - th.lastLeg) + 0.5 * Math.min(th.step, def.steps.length) / def.steps.length;
    out.push({ threadId: th.id, kindId, weight, who: th.who });
  }
  return out.sort((a, b) => b.weight - a.weight);
}
