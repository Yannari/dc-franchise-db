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
    swim: ['{a} swallows a mouthful of the lagoon and stops, coughing.', "{a}'s arms give out halfway, and {a} has to hang on to the buoy rope.", '{a} drops the flag on the way back, and it sinks. Back out for another one.'],
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
  passSay: ['Move!', 'Excuse me!', 'Bye!', 'Coming through!'],
  passSayRun: ['See you at the top!'],
  // the one who was struggling a moment ago is the one passing: say so
  passBack: ['{a} gets going again and goes past {b}.', 'Somehow {a} finds some legs and catches {b}.'],
  taunt: [["Is that all you've got, {b}?", 'Keep talking.'], ['You look tired, {b}.', 'You look scared.'], ['I can hear you breathing from here, {b}.', 'Then you know how close I am.']],
  tauntBites: ['{b} slows down for a second. It got in.', '{b} glances back, and loses a step.'],
  tauntFires: ['{b} speeds up, teeth gritted.', "{b} doesn't answer. {b} just goes faster."],
  help: ['{a} leans over and points {b} to the right piece.', '{a} finishes a section, then shows {b} where the corner piece goes.'],
  helpSay: ['Thank you! I owe you!', 'You kept the deal.', "I won't forget that."],
  close: ["It's neck and neck! {a} and {b}, there's nothing in it!", '{a} and {b} are side by side! This is going to come down to the last second!'],
  go: ['GO!', 'Three, two, one... GO!', 'And GO! GO! GO!'],
  // a stage reached: who got there first, and somebody in the middle of it, in that stage's own way
  stage: ['{a} is first to {name}.', 'First to {name}: {a}.', '{a} gets to {name} with nobody close.', '{a} reaches {name} ahead of everybody.'],
  stageLast: ['{a} reaches {name} first, and the finish is right there.', '{a} comes out of the last stretch first, with the arch in sight.'],
  behind: ['At the back, {b} is still coming.', '{b} is last, and losing ground.', "{b} is a long way back, and knows it."],
  through: {
    cp1: [["{c} gets a bag up on one shoulder and staggers off with it.", "{c} drags a bag by the corners because lifting it isn't happening any more."],
      ["{c} is halfway down the beach, sand up to the ankles, counting steps out loud.", '{c} switches the bag to the other shoulder without stopping.'],
      ["{c} drops a bag at the flag and turns straight around for the next one.", "{c} throws the last bag at the flag and falls down next to it."]],
    cp2: [['{c} lifts the first dome, looks, and puts it back down.', '{c} eats the first plate fast, without breathing.'],
      ['{c} is chewing with both eyes shut, and both hands flat on the table.', '{c} has a bucket at the feet, just in case.'],
      ['{c} is down to the last plate, and the last plate is the worst one.', '{c} scrapes the last plate clean and shows TJ the empty plate.']],
    cp3: [['{c} sorts every edge piece into a pile before fitting a single one.', "{c} has the corners in and is talking to the frame."],
      ['{c} has half the frame done and is guarding it from the wind with both arms.', '{c} pulls three pieces back out and starts that section again.'],
      ['{c} has two pieces left, and neither of them fits.', '{c} turns the last piece around and around in both hands.']],
    cp4: [['{c} reaches the halfway rope and grabs it for one breath.', "{c} swims past the halfway rope, head down, not looking up."],
      ['{c} grabs the flag at the far buoy and holds on for a breath.', '{c} rounds the buoy and starts the long swim back.'],
      ["{c} gets a hand on the dock ladder and can't lift a leg out of the water.", '{c} hauls up the ladder and lies flat on the dock.']],
    cp5: [['{c} is up the jungle trail and slipping in the mud on every switchback.', '{c} ducks under the vines and keeps running.'],
      ['{c} goes up the rope ladder hand over hand, and it swings with every step.', '{c} stops halfway up the ladder for one breath, then keeps climbing.'],
      ['{c} rolls over the lip of the cliff and lies flat for a second.', '{c} gets to the cliff top and has to lean on a rock to stand.'],
      ['{c} scrambles up the volcano path on hands and feet, and the black rock slides out from under every step.', '{c} stops on the volcano path to breathe, and the arch is still a long way up.'],
      ['{c} can see the finish arch, and finds one more gear.', '{c} is on the last stretch, and every step looks like it hurts.']],
  },
  // the stage with the fear in it (final.js stageFear)
  fear: {
    heights: { froze: ['{a} gets to the bottom of the rope ladder, looks up, and stops dead. {a} is terrified of heights.', "{a} is a third of the way up the ladder and can't move a hand."],
      say: ["I can't. I can't do this.", "Don't look down. Don't look down. Don't look down."],
      beaten: ['{a} hates heights, and goes up the ladder anyway, without stopping once.', "{a}'s hands are shaking on the rope, and {a} climbs anyway."],
      after: ['{a} goes up one rung at a time, eyes on the rope, and finally gets over the top.', 'It takes forever, but {a} makes it to the top of the ladder.'] },
    'deep water': { froze: ['{a} stops in the open water and grabs the buoy rope. {a} is terrified of deep water.', "{a} gets out past where the bottom drops away and panics."],
      say: ["I can't see the bottom. I can't see the bottom.", 'Okay. Breathe. Just breathe.'],
      beaten: ['{a} is scared of deep water and swims straight out over it anyway.', '{a} is scared of deep water, so {a} keeps both eyes on the buoy and does not look down once.'],
      after: ['{a} holds the rope until the breathing slows down, then lets go and swims.', "{a} starts swimming again, slowly. It's ugly, but it's moving."] },
    'gross food': { froze: ['{a} lifts the second dome and goes white.', '{a} smells the second plate and has to walk away from the table.'],
      say: ['What is that? No. What IS that?', "I'm going to be sick. I'm going to be sick."],
      beaten: ['{a} looks at the second plate, holds both nostrils shut and eats it anyway.', '{a} gags once, then eats the whole plate in four bites.'],
      after: ['{a} comes back to the table, sits down, and starts again.', "{a} gets it down, one tiny bite at a time."] },
  },
  pre: [['Enjoy the lead while it lasts.', 'Come and take it.'], ["I'm right behind you. All day.", 'I know. I can hear you.'], ["This is the one where I catch you.", 'You keep saying that.']],
  preFirst: [['Good luck out there.', "You too. You'll need it."], ['May the best one win.', 'Oh, the best one will.']],
};
const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

/**
 * The totals read out at the finish, from the bottom up, division by division: the suspense before the crowning.
 * Shared with the viewer like cpLines: { kind, by, text, fx: { who, place } }.
 */
export function podiumLines(podium = {}, totals = {}, pairPodium = null) {
  if (pairPodium) return pairPodiumLines(pairPodium, totals);
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

// A Pairs season reads pairs, from the bottom up: each pair on its partners' average (final.js finishPairs).
function pairPodiumLines(pairPodium = {}, totals = {}) {
  const out = [];
  const divs = Object.keys(pairPodium);
  const gendered = divs.some(d => d !== 'all');
  const avg = p => Math.round(p.reduce((t, n) => t + (totals[n] || 0), 0) / Math.max(1, p.length));
  divs.forEach((d, di) => {
    const ord = pairPodium[d] || [];
    if (gendered) out.push({ kind: 'tj', by: 'TJ', text: di === 0 ? `Let's start with ${divName(d)}'s pairs.` : `Now, ${divName(d)}'s pairs.`, fx: {} });
    for (let i = ord.length - 1; i >= 1; i--) {
      const p = ord[i];
      out.push({ kind: 'tj', by: 'TJ', text: i === 1 ? `And in second place, with an average of ${avg(p)} points... ${nameList(p)}.` : `In ${ORD[i + 1] || `number ${i + 1}`} place, with an average of ${avg(p)} points: ${nameList(p)}.`, fx: { who: p[0], pair: p, place: i + 1 } });
    }
    if (ord[0]) out.push({ kind: 'beat', by: null, text: `That leaves one pair. ${nameList(ord[0])} can barely stand still.`, fx: { who: ord[0][0], pair: ord[0], place: 1 } });
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
  // ...from the people running THIS checkpoint: the standings before it still list whoever the instant
  // elimination sent home (the user, 2026-10-16: James trash-talked the leader after he was gone)
  const running = new Set(rec.order || []);
  const ld = prev ? (Object.values(prev)[0] || []).filter(r => !running.size || running.has(r[0])) : null;
  if (ld && ld.length >= 2) { const [l1, l2] = pick(FX.pre, 'pre'); L('say', ld[1][0], l1, -1, { to: ld[0][0] }); L('say', ld[0][0], l2, -1, { to: ld[1][0] }); }
  else if ((rec.order || []).length >= 2) { const [l1, l2] = pick(FX.preFirst, 'pre'); L('say', rec.order[0], l1, -1, { to: rec.order[1] }); L('say', rec.order[1], l2, -1, { to: rec.order[0] }); }
  (rec.beats || []).forEach((b, i) => {
    const k = `${b.t}|${b.kind}`;
    const [x, y] = b.who;
    if (b.kind === 'cp-start') { L('tj', 'TJ', pick(FX.go, k), i, { gong: 1, start: 1 }); return; }
    if (b.kind === 'cp-stage') {
      const [first, back, mid] = b.who;
      // one wording per stage in turn, so a checkpoint never says the same thing twice
      const sw = b.data.last ? pick(FX.stageLast, k) : FX.stage[(b.data.i + hashOf(`${seed}|${rec.id}`)) % FX.stage.length];
      L('beat', null, fill(sw, { a: first, name: b.data.name }), i, { stage: b.data.i, focus: [first], act: { [first]: 'strain' } });
      const thr = FX.through[rec.id]?.[Math.min(b.data.i, (FX.through[rec.id] || []).length - 1)];
      if (thr && mid && mid !== first) L('beat', null, fill(pick(thr, k + 'm'), { c: mid }), i, { stage: b.data.i, focus: [mid], act: { [mid]: 'strain' } });
      if (back && back !== first && back !== mid && b.data.i % 2 === 1) L('beat', null, fill(pick(FX.behind, k + 'b'), { b: back }), i, { stage: b.data.i, focus: [back], act: { [back]: 'slump' } });
      return;
    }
    if (b.kind === 'cp-fear') {
      const F = FX.fear[b.data.thing];
      if (!F) return;
      if (b.data.froze) {
        L('beat', null, fill(pick(F.froze, k), { a: x }), i, { stage: b.data.i, focus: [x], act: { [x]: 'flinch' }, shake: 1 });
        L('say', x, pick(F.say, k + 's'), i, { stage: b.data.i });
        L('beat', null, fill(pick(F.after, k + 'a'), { a: x }), i, { stage: b.data.i, focus: [x], act: { [x]: 'strain' } });
      } else L('beat', null, fill(pick(F.beaten, k), { a: x }), i, { stage: b.data.i, focus: [x], act: { [x]: 'strain' } });
      return;
    }
    if (b.kind === 'cp-lead') { L('beat', null, fill(pick(FX.lead, k), { a: x }), i, { focus: [x], act: { [x]: 'strain' } }); return; }
    if (b.kind === 'cp-struggle') { const t = FX.struggle[b.data.how] || FX.struggle.run; L('beat', null, fill(t[(b.data.n + Number(String(rec.id).slice(2))) % t.length], { a: x }), i, { focus: [x], act: { [x]: 'slump' }, shake: b.data.n ? 1 : 0 }); return; }
    if (b.kind === 'cp-pass') {
      const back = rec.beats[i - 1]?.kind === 'cp-struggle' && rec.beats[i - 1].who[0] === x;
      L('beat', null, fill(pick(back ? FX.passBack : FX.pass, k), { a: x, b: y }), i, { focus: [x, y], act: { [x]: 'strain', [y]: 'flinch' } });
      L('say', x, pick(rec.id === 'cp5' ? [...FX.passSay, ...FX.passSayRun] : FX.passSay, k + 's'), i, { to: y });
      return;
    }
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
