// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/finale-house.js — the final three's last days, as scenes
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "the final dialogue and scenes are really too short we dont get anything", and the finale
// week's House Life was still the classic screen. The engine's finale-house act (bb-finale.js) records the facts:
// the final three, the memory wall's moments (who stopped at whose photo, the eviction one of them caused), who
// studied for Part Three and how well, and the final two the house could see without anybody saying it. This
// writes them as conversations, in the shape bb/story scenes have, so the House Life segment stages them like any
// other week (steps.js storyLifeScreen): the wall, the studying, the deal by the pool, and the last night.
// Every fact said here is the engine's; the words around them are written here, seeded by the week.

const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const pick = (list, key) => list[hash(key) % list.length];
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth'];
const listOf = names => names.length <= 1 ? (names[0] || '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

// The engine writes a memory as one line of prose: `Ripper stops at Nichelle's photograph. "Week one..."` or
// `"That one was me," Brightly says, at Scary's picture. "I'd do it again."`. The words in quotation marks are
// what was said; what is left, without its "X says", is what happened.
function split(text, by) {
  const said = [];
  const rest = String(text || '').replace(/[“"]([^”"]+)[”"]/g, (_, q) => { said.push(q.trim()); return ' '; })
    .replace(new RegExp(`\\b${by}\\s+(says|said|adds|asks)\\b,?`, 'g'), ' ')
    .replace(/\s+([,.])/g, '$1').replace(/^[\s,.]+|[\s,]+$/g, '').replace(/\s+/g, ' ').trim();
  const line = said.map(q => q.replace(/,$/, '.')).join(' ');
  const beat = rest && /[a-z]/i.test(rest) ? (rest.endsWith('.') ? rest : `${rest}.`).replace(/^at /, `${by} is at `) : '';
  return { beat: beat.charAt(0).toUpperCase() + beat.slice(1), line: line ? line.charAt(0).toUpperCase() + line.slice(1) : '' };
}

// how another finalist answers a memory, by what kind of memory it is ({v} is the person on the photo)
const ANSWER = {
  'THE WALL': [
    'I forgot {v} was even here until I saw that photo.',
    '{v} would have loved to be standing here.',
    'Week one feels like a different season.',
  ],
  'THE ONE THEY DID': [
    "You don't have to explain it to me. I was in the room.",
    '{v} is going to ask you about that on finale night. You know that, right?',
    "I'd have done the same thing. I just wouldn't have said it out loud.",
  ],
  'THE WEEK IT TURNED': [
    "That's not how I remember that week at all.",
    'Every one of us thinks that week was about them.',
    'That was the week I stopped trusting anybody in here.',
  ],
};
const OPEN_WALL = [
  'Look at all of them.',
  'Every face on there had a plan to be standing where we are.',
  "I walk past this wall every day, and I still don't look at it properly.",
];
const JURY_WALL = [
  'Everybody on this end of the wall is voting on finale night.',
  "That's the jury. Every one of them is going to be looking at us on finale night.",
];
const JURY_REPLY = [
  'Then be nice to the wall.',
  "I've been counting them in my head all week. I keep getting a different number.",
  "Don't. If I start counting jury votes now, I won't sleep until finale night.",
];
const WALL_DR = [
  'Seeing them all up there, I know exactly who I hurt to get here. I would still do it.',
  'Every one of those photos is a week I survived. I am not taking a single one of them for granted.',
  'That wall is the jury and the people who never got there. I owe some of them an apology, and some of them owe me one.',
];
// the quiz before Part Three: the questions are real (the order they left), the answer is right or wrong by how
// well the one answering studied (act.study)
const QUIZ_RIGHT = ['{n}. Easy.', 'That was {n}.', '{n}. I could do this list in my sleep.'];
const QUIZ_WRONG = ['{w}?', 'Was that {w}?', '{w}. Definitely {w}.'];
const QUIZ_FIX = ['No. It was {n}.', 'It was {n}. {w} was later.', 'Wrong. {n}.'];
const QUIZ_AFTER = ['I knew that.', "Okay. I'm going to need the whole list again.", 'Ask me again tomorrow.'];
const NOT_STUDY_DR = [
  "Everybody's upstairs memorising the season. I'm spending my time with the people who decide it.",
  "I'm not going to win Part Three with flash cards. I'd rather make sure whoever wins it wants to sit next to me.",
];
const STUDY_DR = [
  'Part Three is about the jury, and I lived with every one of them. If I lose it, it will not be because I did not study.',
  'Win Part Three and I choose who sits next to me. That is the whole game now.',
];
// the final two the house can see: said once, quietly, by the pool
const DEAL = [
  [{ by: 'a', t: "Nobody's said it out loud all week." }, { by: 'b', t: "Then let's not start now. We both know." }, { by: 'a', t: 'I just need to hear it once.' }, { by: 'b', t: 'Final two.' }, { by: 'a', t: 'Final two.' }],
  [{ by: 'a', t: 'Whatever happens in Part Three, we are still what we were.' }, { by: 'b', t: 'Final two. Same as always.' }, { by: 'a', t: 'Same as always.' }],
  [{ by: 'b', t: "If you win the last part, I'm not going to ask you anything." }, { by: 'a', t: "You won't have to. I'm taking you." }, { by: 'b', t: "Don't say it. Just do it." }],
];
const ODD_DR = [
  'I know what that is. I have known for weeks. The only way I get to the end is to win Part Three myself.',
  'They think I cannot see it. The whole house could see it. So I win, or I go home third.',
  'Two people who never talk about the end are the two people who have already planned it.',
];
// the last night
const TOAST = [
  [{ by: 'a', t: 'To the final three.' }, { by: 'b', t: 'To whoever wins.' }, { by: 'c', t: 'To never eating slop again.' }],
  [{ by: 'a', t: 'To everybody on that wall.' }, { by: 'b', t: 'Even the ones who hate us?' }, { by: 'a', t: 'Especially those ones.' }],
];
const FIRST_THING = [
  'The first thing I am doing is ordering a pizza and not sharing it.',
  'I am going to sleep for a week in a room with no cameras in it.',
  'I am calling my mom. Then I am crying. Then I am calling her again.',
  'Find out what the world thinks of me. Then probably hide.',
  'A long shower with nobody knocking on the door.',
];
const WIN_DR = [
  'Winning this would mean every hard choice was worth it.',
  'I came in here to win, not to be liked. In a few days I find out if that was the right way round.',
  'If I win this, the version of me who walked through that door on day one is going to lose it.',
  'Whatever happens on finale night, nobody can take these days away from me.',
];

/** The final three's last days, as bb/story scenes for steps.js storyLifeScreen. */
export function finaleHouseScenes(act, { week = 0, priorEvicted = [] } = {}) {
  const f3 = (act.finalists || []).slice(0, 3);
  if (f3.length < 2) return [];
  const key = s => `${week}|${f3.join('|')}|${s}`;
  const groups = act.acts || [];
  const beatsOf = title => (groups.find(g => g.title === title)?.beats || []).filter(b => b && typeof b === 'object');
  const wall = [...priorEvicted];
  const jury = (act.jury || []).filter(n => !f3.includes(n));
  const scenes = [];
  const scene = (id, room, roomName, cast, mood, lines, extra = {}) => scenes.push({ id: `finale:${week}:${id}`, type: 'life', step: id, room, roomName, cast, mood, lines, ...extra });
  const say = (by, text) => ({ kind: 'say', by, text });
  const dr = (by, text) => ({ kind: 'dr', by, text });
  const beat = text => ({ kind: 'beat', by: null, text });

  // ── the memory wall ──
  {
    const [a, b, c] = f3;
    const lines = [beat(`The living room, in front of the memory wall. Every face on it is black and white now, except three.`),
      say(a, pick(OPEN_WALL, key('open')))];
    let turn = 0;
    for (const m of beatsOf('The Memory Wall')) {
      const by = (m.players || [])[0];
      if (!by || !f3.includes(by)) { lines.push(beat(String(m.text || ''))); continue; }
      const { beat: b0, line } = split(m.text, by);
      if (b0) lines.push(beat(b0));
      if (line) lines.push(say(by, line));
      const other = f3.filter(n => n !== by)[turn++ % 2];
      const v = (m.players || []).find(n => !f3.includes(n));
      const pool = (ANSWER[m.tag] || ANSWER['THE WALL']).filter(x => v || !x.includes('{v}'));
      if (other && pool.length) lines.push(say(other, pick(pool, key(`ans|${m.tag}|${by}`)).replace(/\{v\}/g, v || '')));
    }
    if (jury.length) {
      // never the person who has just spoken, so the wall stays a conversation
      const lastBy = [...lines].reverse().find(l => l.kind === 'say')?.by;
      const jw = f3.find(n => n !== lastBy) || a;
      const jr = f3.find(n => n !== lastBy && n !== jw) || f3.find(n => n !== jw) || a;
      lines.push(say(jw, pick(JURY_WALL, key('jury'))));
      lines.push(say(jr, pick(JURY_REPLY, key('jreply'))));
    }
    lines.push(dr(pick(f3, key('walldr')), pick(WALL_DR, key('walldr2'))));
    scene('wall', 'living-room', 'Living Room', f3, 'house', lines, { spot: 'memory-wall' });
  }

  // ── studying for Part Three ──
  {
    const study = act.study || {};
    const byStudy = [...f3].sort((x, y) => (study[y] || 0) - (study[x] || 0));
    const quizzer = byStudy[0], answerer = byStudy[1];
    const lines = [];
    const rev = beatsOf('Studying for Part Three');
    // every one of the engine's studying beats airs (who is revising, who is not), the quizzer's first
    const opener = rev.find(r => (r.players || [])[0] === quizzer) || rev[0];
    lines.push(beat(opener ? String(opener.text) : `${quizzer} has the whole season written out on the back of a cereal box.`));
    for (const r of rev) if (r !== opener && r.tag !== 'NOT REVISING') lines.push(beat(String(r.text)));
    // two real questions: the order they left the house in
    const asked = wall.length >= 2 ? [hash(key('q1')) % wall.length, hash(key('q2')) % wall.length] : [];
    if (asked.length && asked[0] === asked[1]) asked[1] = (asked[1] + 1) % wall.length;
    for (const [qi, at] of asked.entries()) {
      const n = wall[at];
      lines.push(say(quizzer, `${qi ? 'Next one.' : 'Okay. Quiz.'} Who was the ${ORD[at] || `number ${at + 1}`} person out the door?`));
      const right = (study[answerer] || 0) >= 0.5 || qi === 0 && (study[answerer] || 0) >= 0.35;
      if (right) lines.push(say(answerer, pick(QUIZ_RIGHT, key(`qr|${qi}`)).replace(/\{n\}/g, n)));
      else {
        const w = wall[(at + 1) % wall.length];
        lines.push(say(answerer, pick(QUIZ_WRONG, key(`qw|${qi}`)).replace(/\{w\}/g, w)));
        lines.push(say(quizzer, pick(QUIZ_FIX, key(`qf|${qi}`)).replace(/\{n\}/g, n).replace(/\{w\}/g, w)));
        lines.push(say(answerer, pick(QUIZ_AFTER, key(`qa|${qi}`))));
      }
    }
    lines.push(dr(quizzer, pick(STUDY_DR, key('sdr'))));
    const skip = rev.find(r => r.tag === 'NOT REVISING');
    const skipper = skip ? (skip.players || [])[0] : null;
    if (skipper && f3.includes(skipper)) lines.push(beat(String(skip.text)), dr(skipper, pick(NOT_STUDY_DR, key('ndr'))));
    scene('study', 'bedroom', 'Bedroom', [quizzer, answerer], 'plan', lines);
  }

  // ── the deal by the pool (the final two nobody names) ──
  {
    const odd = beatsOf('The Last Quiet Days').find(b => b.tag === 'THE ODD ONE OUT');
    const [o, a, b] = odd?.players || [];
    if (o && a && b && f3.includes(o) && f3.includes(a) && f3.includes(b)) {
      const who = { a, b };
      const lines = [beat(String(odd.text)), beat(`Late at night, by the pool. ${a} and ${b} sit with their feet in the water.`),
        ...pick(DEAL, key('deal')).map(x => say(who[x.by], x.t)),
        beat(`Inside, ${o} watches them through the glass door.`),
        dr(o, pick(ODD_DR, key('odd')))];
      scene('deal', 'backyard', 'Backyard', [a, b], 'deals', lines, { spot: 'pool-wide' });
    }
  }

  // ── the last night ──
  {
    const [a, b, c] = f3;
    const who = { a, b, c: c || a };
    const lines = [beat(`The last night in the house. ${a} has found the last bottle of something fizzy at the back of the storage room.`),
      ...pick(TOAST, key('toast')).map(x => say(who[x.by], x.t)),
      say(b, 'What is the first thing you are doing when you get out?')];
    const used = new Set();
    for (const n of f3) {
      let t = pick(FIRST_THING, key(`first|${n}`));
      for (let k = 1; used.has(t) && k < FIRST_THING.length; k++) t = FIRST_THING[(FIRST_THING.indexOf(t) + 1) % FIRST_THING.length];
      used.add(t);
      lines.push(say(n, t));
    }
    const quiet = beatsOf('The Last Quiet Days').find(x => x.tag === 'THE LAST QUIET DAYS');
    lines.push(beat(quiet ? String(quiet.text) : 'Somebody says out loud that in a few days one of them will have won this, and the room goes quiet.'));
    const drs = new Set();
    for (const n of f3) {
      let t = pick(WIN_DR, key(`win|${n}`));
      for (let k = 1; drs.has(t) && k < WIN_DR.length; k++) t = WIN_DR[(WIN_DR.indexOf(t) + 1) % WIN_DR.length];
      drs.add(t);
      lines.push(dr(n, t));
    }
    scene('night', 'kitchen', 'Kitchen', f3, 'fun', lines);
  }
  return scenes.map(sc => ({ ...sc, why: [`The final ${f3.length === 3 ? 'three' : 'two'}: ${listOf(f3)}.`] }));
}
