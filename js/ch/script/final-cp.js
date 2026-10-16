// ══════════════════════════════════════════════════════════════════════
// ch/script/final-cp.js — a final checkpoint, told: TJ's rules, the race, the finish, the standings
// ══════════════════════════════════════════════════════════════════════
//
// One telling for both the stepped viewer (vp-ch-ep/steps.js buildFinal draws each line with its leaderboard,
// slams and acts) and the text backlog (ch/transcript.js prints the same lines), so the two never disagree
// (CLAUDE.md: the backlog is a complete retranscription of the viewer). The race is final.js's: its beats,
// order, points and standings; nothing here decides anything.
//
// The user, 2026-10-16: "TJ not doing his job properly ... we barely know what they are supposed to do ...
// 6 frames for a challenge is a joke ... no suspense".

// TJ, before each checkpoint, out loud.
export const CP_TJ = {
  cp1: ["Checkpoint one! See those sandbags? Each one weighs about as much as a carry-on, twice over.",
    'You pick one up, you haul it the whole length of this beach, you drop it at your flag, and you run back for the next one.',
    'Five bags each. If a bag splits, you fill it back up before it counts. Nobody helps anybody.',
    'Every checkpoint is points. First man and first woman get ten, second gets eight, and it goes down from there. Ready?'],
  cp2: ["Welcome to checkpoint two, the Banquet! I hope you're hungry, because lunch is served.",
    "Under every dome is a plate of something you really, really don't want to eat. Fish eyes. Blended things. Things that used to be alive.",
    'You eat every bite. Keep it down. If it comes back up, you start that plate again.',
    'First to clean every plate gets the most points. And after this one, the lowest two on points in each division have a little surprise waiting.'],
  cp3: ["Good morning, sunshines! You didn't sleep, and I slept great. Checkpoint three!",
    'Each of you has a table with a puzzle frame and a pile of pieces. Fit every piece, and the frame locks.',
    "One piece in the wrong place and it won't lock, and you have to find which one. On no sleep. In this wind.",
    'Points by place, like always. And people, this is where a lot of finals are won and lost.'],
  cp4: ['Checkpoint four! Out there, way out there, is a buoy with your flag on it.',
    "You swim out, you grab your flag, and you swim it back to this dock. Don't drop it.",
    "Tired arms, cold water, no sleep. If you need to stop and hold the buoy, hold the buoy. Just don't quit on me.",
    "Points by place. One more checkpoint after this, and then somebody's a champion."],
  cp5: ["This is it. The last leg. Up this trail, all the way to the summit, where I'll be waiting at the finish arch.",
    'Whatever your legs have left, you leave it on this mountain.',
    'When you cross that line, we add it all up.',
    'The man and the woman with the most points over the whole final are the champions. Go get it!'],
};

const FX = {
  struggle: {
    haul: ["{a}'s sandbag splits open, and sand pours out all over the beach. Refill it, start again.", '{a} drops the bag halfway down the beach and has to stop to breathe.', "{a}'s legs buckle under the third bag. {a} gets up. Slowly."],
    eat: ['{a} gags on the fish eyes, and the plate goes back to the start.', '{a} stares at the plate for a full minute before picking up the fork.', '{a} gets one bite down, then has to walk away from the table.'],
    puzzle: ["{a}'s frame won't lock. One piece is wrong, and there's no telling which.", '{a} drops a handful of pieces, and the wind takes two of them across the ridge.', '{a} sits down in front of the puzzle and just stares at it.'],
    swim: ["{a}'s arms give out halfway, and {a} has to hang on to the buoy rope.", '{a} drops the flag on the way back, and it sinks. Back out for another one.', '{a} swallows a mouthful of the lagoon and stops, coughing.'],
    run: ["{a} has to walk for a stretch. The legs just won't run any more.", '{a} slips in the mud on the switchback and goes down hard, then gets back up.', '{a} stops with hands on knees, and two people go past.'],
  },
  comedy: {
    haul: ['{a} hugs the sandbag like a baby and tells it to behave.', '{a} trips over the flag, lands on the bag and just lies there laughing.'],
    eat: ['{a} pinches both nostrils shut, closes both eyes and talks to the plate before every bite.', '{a} asks TJ for ketchup. TJ says no. {a} asks again.'],
    puzzle: ['{a} tries to force a piece in with a fist.', '{a} gives every piece a name and talks to them one by one.'],
    swim: ['{a} does the whole way back on a back stroke, singing.', '{a} high-fives the buoy before heading back.'],
    run: ['{a} shouts every swear word there is at the mountain, in order.', '{a} narrates the whole run like a sports commentator.'],
  },
  comedySay: ["Don't look at me. I'm doing great.", 'This is fine. Everything is fine.', "I'd like to speak to the manager.", 'Nobody saw that. Nobody saw that.'],
  lead: ['{a} is out in front.', '{a} takes the lead, and nobody is close.', '{a} pulls away from the pack.'],
  pass: ['{a} goes past {b}.', '{a} catches {b} and keeps going.', '{a} squeezes by {b} on the inside.'],
  passSay: ['See you at the top!', 'Move!', 'Excuse me!', 'Bye!'],
  taunt: [["Is that all you've got, {b}?", 'Keep talking.'], ['You look tired, {b}.', 'You look scared.'], ['I can hear you breathing from here, {b}.', 'Then you know how close I am.']],
  tauntBites: ['{b} slows down for a second. It got in.', '{b} glances back, and loses a step.'],
  tauntFires: ['{b} speeds up, teeth gritted.', "{b} doesn't answer. {b} just goes faster."],
  help: ['{a} leans over and points {b} to the right piece.', '{a} finishes a section, then shows {b} where the corner piece goes.'],
  helpSay: ['Thank you! I owe you!', 'You kept the deal.', "I won't forget that."],
  close: ["It's neck and neck! {a} and {b}, there's nothing in it!", '{a} and {b} are side by side! This is going to come down to the last second!'],
  go: ['GO!', 'Three, two, one... GO!', 'And GO! GO! GO!'],
  pre: [['Enjoy the lead while it lasts.', 'Come and take it.'], ["I'm right behind you. All day.", 'I know. I can hear you.'], ["This is the one where I catch you.", 'You keep saying that.']],
  preFirst: [['Good luck out there.', "You too. You'll need it."], ['May the best one win.', 'Oh, the best one will.']],
};
const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

/**
 * The totals read out at the finish, from the bottom up, division by division: the suspense before the crowning.
 * Shared with the viewer like cpLines: { kind, by, text, fx: { who, place } }.
 */
export function podiumLines(podium = {}, totals = {}) {
  const out = [];
  const divs = Object.keys(podium);
  const gendered = divs.some(d => d !== 'all');
  divs.forEach((d, di) => {
    const ord = podium[d] || [];
    if (gendered) out.push({ kind: 'tj', by: 'TJ', text: di === 0 ? `Let's start with ${divName(d)}.` : `Now, ${divName(d)}.`, fx: {} });
    for (let i = ord.length - 1; i >= 1; i--) {
      const n = ord[i], pts = totals[n];
      out.push({ kind: 'tj', by: 'TJ', text: i === 1 ? `And in second place, with ${pts} points... ${n}.` : `In ${ORD[i + 1] || `number ${i + 1}`} place, with ${pts} points: ${n}.`, fx: { who: n, place: i + 1 } });
    }
    if (ord[0]) out.push({ kind: 'beat', by: null, text: `That leaves one name. ${ord[0]} can barely stand still.`, fx: { who: ord[0], place: 1 } });
  });
  return out;
}

const hashOf = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (list, key) => list[hashOf(key) % list.length];
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));
const nameList = ns => (ns.length <= 1 ? ns[0] || '' : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`);
const divName = d => (d === 'm' ? 'the men' : d === 'f' ? 'the women' : 'everybody');

/**
 * The checkpoint told, in order. Each line: { kind: 'tj' | 'say' | 'beat', by, text, at } where `at` is the beat
 * it belongs to (an index into rec.beats; -1 before the start), plus `fx` for the viewer (act, chip, shake,
 * gong, standings) that the backlog ignores.
 */
export function cpLines(rec, { seed = '', prev = null } = {}) {
  const out = [];
  const L = (kind, by, text, at, fx = {}) => out.push({ kind, by, text, at, fx });
  const pick = (list, k) => pickBy(list, `${seed}|${rec.id}|${k}`);
  const divs = Object.keys(rec.standings || { all: 1 });
  const gendered = divs.some(d => d !== 'all');
  for (const t of CP_TJ[rec.id] || []) L('tj', 'TJ', t, -1);
  // a word on the start line: the leader and the closest chaser, or two finalists on the first one
  const ld = prev ? Object.values(prev)[0] : null;
  if (ld && ld.length >= 2) { const [l1, l2] = pick(FX.pre, 'pre'); L('say', ld[1][0], l1, -1, { to: ld[0][0] }); L('say', ld[0][0], l2, -1, { to: ld[1][0] }); }
  else if ((rec.order || []).length >= 2) { const [l1, l2] = pick(FX.preFirst, 'pre'); L('say', rec.order[0], l1, -1, { to: rec.order[1] }); L('say', rec.order[1], l2, -1, { to: rec.order[0] }); }
  (rec.beats || []).forEach((b, i) => {
    const k = `${b.t}|${b.kind}`;
    const [x, y] = b.who;
    if (b.kind === 'cp-start') { L('tj', 'TJ', pick(FX.go, k), i, { gong: 1, start: 1 }); return; }
    if (b.kind === 'cp-lead') { L('beat', null, fill(pick(FX.lead, k), { a: x }), i, { focus: [x], act: { [x]: 'strain' } }); return; }
    if (b.kind === 'cp-struggle') { const t = FX.struggle[b.data.how] || FX.struggle.run; L('beat', null, fill(t[(b.data.n + Number(String(rec.id).slice(2))) % t.length], { a: x }), i, { focus: [x], act: { [x]: 'slump' }, shake: b.data.n ? 1 : 0 }); return; }
    if (b.kind === 'cp-pass') { L('beat', null, fill(pick(FX.pass, k), { a: x, b: y }), i, { focus: [x, y], act: { [x]: 'strain', [y]: 'flinch' } }); L('say', x, pick(FX.passSay, k + 's'), i, { to: y }); return; }
    if (b.kind === 'cp-taunt') {
      const [l1, l2] = pick(FX.taunt, k);
      L('say', x, fill(l1, { b: y }), i, { to: y, act: { [x]: 'shout' } });
      L('say', y, l2, i, { to: x });
      L('beat', null, fill(pick(b.data.bites ? FX.tauntBites : FX.tauntFires, k + 'r'), { b: y }), i, { focus: [y], act: { [y]: b.data.bites ? 'slump' : 'strain' } });
      return;
    }
    if (b.kind === 'cp-comedy') { const t = FX.comedy[b.data.how] || FX.comedy.run; L('beat', null, fill(pick(t, k), { a: x }), i, { focus: [x], act: { [x]: 'laugh' } }); L('say', x, pick(FX.comedySay, k + 's'), i); return; }
    if (b.kind === 'cp-help') { L('beat', null, fill(pick(FX.help, k), { a: x, b: y }), i, { focus: [x, y], act: { [x]: 'lean' } }); L('say', y, pick(FX.helpSay, k + 's'), i, { to: x }); return; }
    if (b.kind === 'cp-close') { L('tj', 'TJ', fill(pick(FX.close, k), { a: x, b: y }), i, { focus: [x, y], act: { [x]: 'strain', [y]: 'strain' }, shake: 1 }); return; }
    if (b.kind === 'cp-finish') {
      for (const d of divs) {
        const ord = b.who.filter(n => (rec.standings?.[d] || []).some(r => r[0] === n));
        if (!ord.length) continue;
        const [p1, p2, ...rest] = ord;
        L('tj', 'TJ', `${p1} finishes first${gendered ? ` among ${divName(d)}` : ''}! ${b.data.pts[p1]} points!`, i, { focus: [p1], act: { [p1]: 'cheer' }, chip: [p1, `+${b.data.pts[p1]}`], finish: d });
        if (p2) L('beat', null, `${p2} is second, ${b.data.pts[p2]} points.`, i, { focus: [p2], chip: [p2, `+${b.data.pts[p2]}`] });
        if (rest.length) L('beat', null, `Then ${nameList(rest)}.${rest.length > 1 ? ` ${rest[rest.length - 1]} is last, with ${b.data.pts[rest[rest.length - 1]]}.` : ''}`, i, { focus: rest.slice(-2), act: { [rest[rest.length - 1]]: 'slump' } });
      }
      for (const d of divs) {
        const rows = rec.standings?.[d] || [];
        if (!rows.length) continue;
        L('beat', null, `Standings after checkpoint ${String(rec.id).slice(2)}${gendered ? `, ${divName(d)}` : ''}: ${rows.map(([n, t]) => `${n} ${t}`).join(', ')}.`, i, { standings: d, focus: rows.slice(0, 2).map(r => r[0]) });
      }
    }
  });
  return out;
}
