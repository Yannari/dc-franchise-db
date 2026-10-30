// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-episode.js — a Secret Story week, laid out as the real show airs it
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "make sure it starts and ends with the narrator like the real show (except the prime,
// the narrator is used for the magneto recap)", "a whole screen for the Voice with four clicks that said
// basically nothing should just be in house life", "when they said gather in the living room we should see
// them in the living room", and "the prime being the same episode as the others makes them super long".
//
// The real dailies (docs/research/secret-story-transcripts.md §2, S14 Q06 and Q35 read in full):
//   "Précédemment dans Secret Story…" — the narrator over last time's storylines, ending on a question;
//   the generic with the Voice's slogan; the day; and at the end the narrator closes the night ("one thing is
//   sure, the night will be full of thought for every player"), teases tomorrow, and the Voice asks the public
//   to vote ("…the Voice is counting on you, and will see you tomorrow night, live. That is all for now.").
// The prime is the host's: the narrator only voices the week's package.
//
// This arranges the week's screens (steps.js calls it in its Secret Story pass) and names the parts the viewer
// plays as separate episodes: launch night (week one), the days, the prime.

const LIVING = { set: 'ceremony', room: 'Living Room', plate: 'living-sofas', cam: 4, kicker: 'Cam 04 · Living room' };
const spread = n => (n <= 1 ? [50] : Array.from({ length: n }, (_, i) => Math.round(14 + (72 * i) / (n - 1))));
const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const money = n => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
const nw = n => NUMW[n] || String(n);

/** Which part of a Secret Story episode a screen belongs to. */
export function ssPartOf(id) {
  if (id && typeof id === 'object') return id.ssAfterPrime ? 'prime' : ssPartOf(id.id);
  const s = String(id || '');
  if (/^bb-ss-(launch|secrets-v)|^bb-ss-launch-role/.test(s)) return 'launch';
  if (/^bb-ss-(prime|after|missionres)-|^bb-ss-(final|journeys|returns)-?/.test(s)) return 'prime';
  return 'daily';
}
export const SS_PART_LABEL = { launch: 'Launch Night', daily: 'The Days', prime: 'The Prime' };

// ── folding the Voice's little moments into house life ──
// (a sanction, a clue, a mission given, the store, the masters' pick: 3 to 7 clicks each, a screen of their own)
const FOLD = /^bb-ss-(rule|clue|houseclue|mission|role|store|houseend|vm|prod|duo)-/;
const GATHER = /\b(everybody|everyone|housemates)\b[^.?!]*\bliving room\b/i;
const MOOD_OF = id => (/^bb-ss-vm-(birthday|letter)-/.test(id) ? 'love' : /^bb-ss-vm-/.test(id) ? 'fun' : /^bb-ss-rule-/.test(id) ? 'ceremony' : /^bb-ss-(clue|houseclue)-/.test(id) ? 'secret' : /^bb-ss-(mission|role)-/.test(id) ? 'mission' : /^bb-ss-store-/.test(id) ? 'store' : 'house');
function asScene(F) {
  const house = (F.wall || []).filter(Boolean);
  const gather = (F.steps || []).some(st => typeof st.t === 'string' && GATHER.test(st.t)) && house.length;
  const cast = gather ? house.map((n, i, a) => [n, spread(a.length)[i]]) : (F.cast || []);
  return { ...(gather ? LIVING : { set: F.set, room: F.room, cam: F.cam, kicker: F.kicker, ...(F.plate ? { plate: F.plate } : {}) }),
    cast, mood: MOOD_OF(F.id), time: F.time, slate: true, folded: F.id };
}

/**
 * Arranges a Secret Story week's screens in place (steps.js's Secret Story pass).
 * @param {any[]} out the week's screens
 * @param {any} row the week's record
 * @param {{ prev?: any, ssv: Function, host: string }} o
 */
// THE PRIME IS LIVE (the user, 2026-10-28: "there's no confessional during the prime unless they're talking with
// Josh from the house"). On a live screen (launch night, the prime) a confessional line becomes a live call: Josh
// asks from the stage, the housemate answers him from the confessional (two calls a screen at most; the rest are
// cut). On launch night before the house (the opening, the arrivals), they are the portraits: recorded clips that
// play while a pair walks to the airlock, captioned as such. The magnetos are recorded packages of the week and keep
// theirs; house life after the prime is not live either, and nor is the final week's last party (taped in the garden).
const RECORDED = /^bb-ss-prime-(mag-|package)|^bb-hl|^bb-ss-(previously|tonight|returns)/;
// (on a live night they hear the host through the earpiece, wherever they are, and answer out loud: the user, 2026-10-29,
// "why are they going in the confessional they can talk with the host without being in the confessional through
// earrings and mic")
const CALL = [n => `${n}, can you hear me? Talk to me.`, (n, h) => `${n}, it's ${h}, in your ear. What's going through your head right now?`,
  n => `${n}, quickly. How are you feeling, right now?`, n => `${n}, the whole country is listening. What do you want to tell them?`];
export function ssLiveConfessionals(out, { host = 'Josh' } = {}) {
  for (const s of out) {
    const id = String(s.id || '');
    if (ssPartOf(s) === 'daily' || RECORDED.test(id) || !(s.steps || []).some(st => st.k === 'dr')) continue;
    const portrait = /^bb-ss-launch-open/.test(id);
    const asked = new Set();
    /** @type {any[]} */ const steps = [];
    // the room the screen is in when the call ends (a scene sticks until the next one)
    let room = null, back = false;
    for (const st of s.steps) {
      if (st.k !== 'dr') {
        if (st.scene && st.scene.set !== 'dr') room = st.scene;
        steps.push(back && !st.scene && room ? { ...st, scene: room } : st);
        back = false;
        continue;
      }
      if (portrait) { steps.push({ ...st, clip: true }); continue; }
      // (a call already made live, with the host's question before it: js/vp-bb-ep/ss-launch.js)
      if (st.live) { asked.add(st.by); steps.push(st); back = true; continue; }
      if (!asked.has(st.by)) {
        if (asked.size >= 2) continue;
        asked.add(st.by);
        steps.push({ k: 'host', by: host, t: pickBy(CALL, `${id}|${st.by}`)(st.by, host), ...(room ? { scene: room } : {}) });
      }
      // (said out loud, on the spot, through the microphone: not from the confessional)
      steps.push({ ...st, k: 'say', live: true, earpiece: true });
      back = true;
    }
    s.steps = steps;
  }
}

export function ssArrange(out, row, o) {
  // Big Brother's move-in night and its primer are not Secret Story's launch (the user: "move-in night conflicts
  // with the arrivals"); the Voice's week-open and after-eviction words are the narrator's now
  for (let i = out.length - 1; i >= 0; i--) if (/^(bb-movein(-v)?|theme-primer-v|bb-theme-open-v|bb-theme-vote-v)$/.test(out[i].id)) out.splice(i, 1);
  // (the theme's "the lines are now open" after the nominations: the narrator and the Voice close the days now)
  for (const s of out) if (s.id === 'bb-noms-v') s.steps = (s.steps || []).filter(st => !/^The speakers in the living room click on\.?$|The lines are now open|The house has chosen; the public will decide/.test(String(st.t || '')));
  const idx = re => out.findIndex(s => re.test(String(s.id || '')));
  const lastIdx = re => { for (let i = out.length - 1; i >= 0; i--) if (re.test(String(out[i].id || ''))) return i; return -1; };

  // the prime: the studio and the house live, nothing from the days inside it; the house talks to the host
  // before the nominees do (§3: "two rooms, two moods", the house first)
  let p0 = idx(/^bb-ss-prime-/), p1 = lastIdx(/^bb-ss-(after|prime)-/);
  if (p0 >= 0 && p1 > p0) {
    const later = [];
    for (let i = p1 - 1; i > p0; i--) if (out[i].kind === 'houselife' || out[i].kind === 'scene') later.unshift(...out.splice(i, 1));
    p1 = lastIdx(/^bb-ss-(after|prime)-/);
    const chat = idx(/^bb-ss-prime-chat-/), air = idx(/^bb-ss-prime-airlock-/);
    if (chat > air && air >= 0) out.splice(air, 0, ...out.splice(chat, 1));
    // the house that night, after the live show: the next days begin with it (it stays in the prime's episode, last)
    for (const s of later) s.ssAfterPrime = true;
    out.splice(p1 + 1, 0, ...later);
  }

  // the Voice's little moments become scenes of house life (the one before them; or after, at the top of a stretch)
  const prime0 = () => idx(/^bb-ss-prime-/);
  for (let i = 0; i < out.length; i++) {
    const F = out[i];
    const id = String(F.id || '');
    const pz = prime0();
    // (the Voice's moments and the production secrets' weeks always go into house life; the rest only when short)
    if (!FOLD.test(id) || (pz >= 0 && i > pz) || (F.steps || []).length > (/^bb-ss-(vm|prod|duo)-/.test(id) ? 16 : 7)) continue;
    let host = -1;
    // (back through up to three other screens of the days, never into launch night)
    for (let j = i - 1, seen = 0; j >= 0 && host < 0 && seen <= 3; j--) { if (out[j].kind === 'houselife') host = j; else if (/^bb-ss-(launch|secrets-v|previously)/.test(String(out[j].id || ''))) break; else if (!FOLD.test(String(out[j].id || ''))) seen++; }
    let before = false;
    if (host < 0) for (let j = i + 1, seen = 0; j < out.length && host < 0 && seen <= 3; j++) { if (out[j].kind === 'houselife') { host = j; before = true; } else if (/^bb-ss-prime-/.test(String(out[j].id || ''))) break; else if (!FOLD.test(String(out[j].id || ''))) seen++; }
    if (host < 0) continue;
    // (a production secret's week goes to the stretch of days with the fewest of them, so the roles spread out)
    if (/^bb-ss-(prod|duo)-/.test(id)) {
      const near = [];
      for (let j = 0; j < out.length; j++) if (out[j].kind === 'houselife' && (pz < 0 || j < pz) && !/^bb-ss-(launch|previously)/.test(String(out[j].id || ''))) near.push(j);
      const best = near.sort((x, y) => ((out[x]._prods || 0) - (out[y]._prods || 0)) || (Math.abs(x - i) - Math.abs(y - i)))[0];
      if (best != null) { host = best; before = best > i; }
      out[host]._prods = (out[host]._prods || 0) + 1;
    }
    const steps = (F.steps || []).map((st, k) => (k === 0 ? { ...st, scene: asScene(F) } : st));
    const H = out[host];
    H.steps = before ? [...steps, ...H.steps] : [...H.steps, ...steps];
    out.splice(i, 1);
    i--;
  }
  // what the Voice's game won airs right after the game, on its own screen (the user, 2026-10-28: "we need a screen
  // right after telling us what they won")
  {
    const g = idx(/^bb-ss-game-w/), comp = idx(/^bb-hoh-v$/);
    if (g >= 0 && comp >= 0 && g !== comp + 1) { const [G] = out.splice(g, 1); out.splice(idx(/^bb-hoh-v$/) + 1, 0, G); }
  }

  // the narrator opens the days, and closes them before the prime
  const pre = ssPreviouslyScreen(row, o);
  const launchEnd = lastIdx(/^bb-ss-(launch|secrets-v)/);
  if (pre) out.splice(launchEnd + 1, 0, pre);
  const close = ssTonightScreen(row, o);
  // (the night of the nominations)
  const nomsDay = out.find(s => s.id === 'bb-noms-v')?.day;
  if (close && nomsDay) close.day = nomsDay;
  const pz = prime0();
  if (close) { if (pz >= 0) out.splice(pz, 0, close); else out.push(close); }
  return out;
}

// ── "Previously in Secret Story…" ──
function ssPreviouslyScreen(row, o) {
  const week = row.num || 1;
  const acts = row.acts || [];
  const launch = acts.find(a => a?.type === 'ss-secrets');
  /** @type {Array<{ t: string, who?: string[], plate?: string, set?: string }>} */ const said = [];
  const say = (t, who = [], plate = 'living-sofas', set = 'ceremony') => said.push({ t, who, plate, set });
  let hook;
  if (launch) {
    const order = (launch.arrivals || []).length ? launch.arrivals : [];
    const pairs = (launch.secrets || []).filter(s => (s.holders || []).length > 1);
    say(`${nw(order.length).replace(/^./, c => c.toUpperCase())} new housemates moved into the House of Secrets, every one of them hiding something.`, order.slice(0, 6), 'ss-studio', 'studio-wide');
    // (the privilege is the Public's Signs twist's: js/ss/launch.js)
    if (order[0] && launch.launch?.signs) say(`${order[0]} was the very first through the door, and paid for the privilege: the public saw ${order[0]}'s secret before anybody else's.`, [order[0]], 'ss-studio', 'studio-wide');
    if (pairs.length) say(pairs.length === 1 ? 'And two of them walked in sharing one secret, pretending they had never met.' : `And ${nw(pairs.length)} pairs walked in sharing a secret, pretending they had never met.`, [], 'foyer', 'door');
    const ms = (launch.launch?.missions || []).filter(m => m.who);
    if (ms.length) say(`Before they had even unpacked, the Voice had given ${listOf(ms.map(m => m.who))} a first mission.`, ms.map(m => m.who), 'confessional-close', 'dr');
    hook = pickBy(['The game can begin. Who will be the first to crack a secret?', 'Now the hunt can begin. But who will dare press the buzzer first?', 'The doors are closed. The hunt is on.'], `${week}|pre|h`);
  } else {
    const prev = o.prev;
    if (!prev) return null;
    const pa = prev.acts || [];
    const out = prev.eliminated || pa.find(a => a?.type === 'eviction')?.evicted;
    const buzz = pa.filter(a => a?.type === 'ss-buzz' && a.outcome !== 'withdrawn');
    const right = buzz.filter(b => b.outcome === 'right');
    const wrong = buzz.filter(b => b.outcome === 'wrong');
    const party = pa.find(a => a?.type === 'ss-party');
    const kiss = party && (party.moments || []).find(m => m.kind === 'kiss');
    const fight = party && (party.moments || []).find(m => m.kind === 'fight');
    const game = pa.find(a => a?.type === 'ss-game' && a.winner);
    const k = `${week}|pre`;
    // (the final's recap knows the hunt is over: "So who will crack the next secret?" opened the last night)
    const fin = !!row.isFinale;
    say(fin ? pickBy(['the hunt came to an end, and every secret was told.', 'the buzzer went quiet for good.'], `${k}|0`)
      : pickBy(['the game picks up where it left off.', 'nobody in the House of Secrets got much sleep.', 'the hunt went on, and so did the lies.'], `${k}|0`), (prev.houseAtStart || []).slice(0, 5));
    if (right[0]) say(`${right[0].by} pressed the buzzer on ${right[0].target}, and found the secret: ${money(right[0].took)} changed hands.`, [right[0].by, right[0].target], 'confessional-showdown', 'dr');
    else if (wrong[0]) say(`${wrong[0].by} pressed the buzzer on ${wrong[0].target}... and was wrong.`, [wrong[0].by, wrong[0].target], 'confessional-showdown', 'dr');
    if (game) say(`${game.winner} won the Voice's game.`, [game.winner], 'ss-arena', 'arena');
    if (kiss) say(`At ${String(party.name || 'the party').replace(/^The /, 'the ')}, ${kiss.who[0]} and ${kiss.who[1]} kissed in front of everybody.`, kiss.who.slice(0, 2));
    else if (fight) say(`At ${String(party.name || 'the party').replace(/^The /, 'the ')}, ${fight.who[0]} and ${fight.who[1]} had it out in front of everybody.`, fight.who.slice(0, 2));
    if (out) say(`And at the prime, the public sent ${out} home. ${pickBy([`${out}'s bed is empty now`, `The house is one housemate lighter`, `The house is still getting over it`], `${k}|o`)}.`, [out], 'ss-studio-crowd', 'studio-wide');
    say(pickBy(['Betrayal, lies, alliances changing sides. In short, an almost normal week in the House of Secrets.', 'But here, the walls have ears, and nothing stays buried for long.', 'And in this house, a secret never stays hidden for long.'], `${k}|t`), [], 'living-screens');
    hook = fin ? pickBy(['Tonight, the final. Only one of them wins Secret Story.', 'Tonight, the public crowns the winner of Secret Story.'], `${k}|h`)
      : pickBy(['So who will be the next to walk into the airlock?', 'So who will crack the next secret?', 'So who will be standing in the airlock this week?'], `${k}|h`);
  }
  const xs = n => (n <= 1 ? [50] : Array.from({ length: n }, (_, i) => Math.round(20 + (60 * i) / (n - 1))));
  const sceneOf = e => ({ set: e.set, plate: e.plate, room: 'Previously', cam: 1, kicker: 'Previously in Secret Story', cast: (e.who || []).filter(Boolean).map((n, i, a) => [n, xs(a.length)[i]]) });
  const steps = [
    { k: 'beat', t: `Previously in Secret Story... ${said[0].t}`, toast: ['PREVIOUSLY', '#ff3ea5'], scene: sceneOf(said[0]) },
    ...said.slice(1).map(e => ({ k: 'beat', t: e.t, scene: sceneOf(e) })),
    { k: 'beat', t: hook, scene: sceneOf({ t: hook, plate: 'foyer', set: 'door' }) },
    // (the recap ends the way the real one does, on the show's name: the user, 2026-10-29)
    { k: 'beat', t: row.isFinale ? 'And now, the final of Secret Story.' : 'And now, on Secret Story.', toast: ['SECRET STORY', '#ff3ea5'], scene: sceneOf({ plate: 'living-screens', set: 'ceremony' }) }];
  return { id: `bb-ss-previously-w${week}`, kind: 'twist', anchor: 'start', day: 1, week, time: 'RECAP', ...LIVING, plate: 'living-screens', sceneful: true,
    kicker: 'Secret Story', title: 'Previously', label: 'Previously', sub: 'In Secret Story', cast: [], steps, ss: true };
}

// The night, before the narrator closes the days (the user, 2026-10-29: "this a rather empty closing section we dont even
// see anyone or conclusion or pause to any storyline and its badly written"): the week's storylines, each one last time
// in the dark: the nominees on the sofa, the couple under the covers, the hunter who cannot sleep, the feud that did not
// end, the one who feels the house closing in. Built from the week's own acts; nobody twice.
const NIGHT = (set, plate, room, who, cam = 8) => ({ set, plate, room, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${room}`,
  cast: who.map((n, i, w) => [n, w.length === 1 ? 50 : Math.round(20 + 60 * i / (w.length - 1))]) });
function nightScenes(row, noms, k) {
  const acts = row.acts || [];
  const used = new Set();
  const free = (...ns) => (ns.every(n => n && !used.has(n)) ? (ns.forEach(n => used.add(n)), true) : false);
  /** @type {any[]} */ const out = [];
  const R = (pool, s) => pickBy(pool, `${k}|${s}`);
  // the nominees, up late
  if (noms.length >= 2 && free(...noms.slice(0, 2))) {
    const [a, b] = noms;
    out.push({ k: 'beat', scene: NIGHT('ceremony', 'living-sofas', 'Living Room', noms.slice(0, 3), 4), t: R([`Midnight. ${listOf(noms)} are still up on the sofa. Nobody says the word "prime".`, `The house has gone to bed. ${listOf(noms)} have not.`], 'n0') },
      ...R([[["Whatever happens tomorrow, I'm glad I met you.", 'Stop it. You are not going anywhere.'], ["I can't sleep. I keep doing the maths.", "Then stop counting. It doesn't help. Trust me."]],
        [["One of us is gone tomorrow. I hate that.", "Then let's not spend tonight thinking about it."], ['Do you think they like me out there?', 'They love you. Go to sleep.']]], 'n1')[0].map((t, j) => ({ k: 'say', by: j ? b : a, t })));
  }
  // the couple, under the covers
  const love = [...acts].reverse().find(x => x?.type === 'ss-love' && x.a && x.b && x.kind !== 'plot') || null;
  const kiss = (acts.find(x => x?.type === 'ss-party')?.moments || []).find(m => m.kind === 'kiss');
  const pair = love ? [love.a, love.b] : kiss ? kiss.who.slice(0, 2) : null;
  if (pair && free(...pair)) {
    const [a, b] = pair;
    out.push({ k: 'beat', scene: NIGHT('bedroom', 'bedroom-beds', 'Bedroom', [a, b]), t: R([`Under the covers, ${a} and ${b} whisper about everything except the game.`, `${a} and ${b} have pushed their beds together. Nobody has said a word about it.`], 'l0') },
      ...R([['Are you awake?', 'Always, when you are.'], ['Promise me one thing. Whatever happens, we tell each other the truth.', 'Except our secrets.', 'Except our secrets.'], ['Goodnight.', 'Goodnight. Again.']], 'l1').map((t, j) => ({ k: 'say', by: j % 2 ? b : a, t })));
  }
  // the hunter who cannot sleep
  const hunt = (acts.find(x => x?.type === 'ss-hunt')?.moments || []).filter(m => m.who && m.about).sort((x, y) => (y.conf || 0) - (x.conf || 0));
  const hunter = hunt.find(m => !used.has(m.who) && !used.has(m.about));
  if (hunter && free(hunter.who)) out.push({ k: 'beat', scene: NIGHT('bedroom', 'bedroom-wide', 'Bedroom', [hunter.who]), t: `${hunter.who} lies awake, staring at the ceiling.` },
    { k: 'dr', by: hunter.who, t: (hunter.conf || 0) >= 0.55 ? R([`I'm close on ${hunter.about}. I can feel it. One more thing, and I press it.`, `${hunter.about}. I know it. I just need to be sure before I spend five thousand dollars.`], 'h0')
      : R([`Something about ${hunter.about} doesn't add up. I'll work it out.`, `Everybody is hiding something. ${hunter.about} is hiding it badly.`], 'h0') });
  // the feud that did not end
  const fight = (acts.find(x => x?.type === 'ss-party')?.moments || []).find(m => m.kind === 'fight') || acts.find(x => x?.type === 'ss-buzz' && x.outcome === 'wrong');
  const foes = fight ? (fight.who ? fight.who.slice(0, 2) : [fight.by, fight.target]) : null;
  if (foes && free(...foes)) out.push({ k: 'beat', scene: NIGHT('kitchen', 'kitchen-wide', 'Kitchen', foes, 2), t: R([`At one in the morning, ${foes[0]} and ${foes[1]} reach for the same glass in the kitchen. Neither of them lets go first.`, `${foes[0]} walks into the kitchen, sees ${foes[1]}, and walks straight back out.`], 'f0'), tense: foes },
    { k: 'dr', by: foes[0], t: R([`It's not over with ${foes[1]}. Not even close.`, `I'm not apologising to ${foes[1]}. ${foes[1]} can apologise to me.`], 'f1') });
  // the one the house is circling
  const counts = {};
  for (const m of hunt) counts[m.about] = (counts[m.about] || 0) + 1;
  const hunted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).find(n => !used.has(n));
  if (hunted && free(hunted)) out.push({ k: 'dr', by: hunted, scene: NIGHT('dr', 'confessional-close', 'Confessional', [hunted], 1), t: R(["They're getting closer. I need a new story by Monday.", "Everybody's looking at me differently this week. I can feel it.", "I'm keeping it. Whatever it costs, I'm keeping it."], 'w0') });
  return out;
}

// ── the end of the days: the night, the narrator, then the Voice asks the public to vote ──
function ssTonightScreen(row, o) {
  const week = row.num || 1;
  const acts = row.acts || [];
  const prime = acts.find(a => a?.type === 'ss-prime');
  const noms = prime?.nominees || acts.find(a => a?.type === 'nominations')?.nominees || [];
  const k = `${week}|tonight`;
  // the first week has no nominations and no prime (js/bb/secret-story.js ssNoPrimeWeek): the narrator closes the
  // days on what is coming
  if (!noms.length && row.ssNoPrime) {
    const night = nightScenes(row, [], k);
    const found = acts.filter(a => a?.type === 'ss-buzz' && a.outcome === 'right').length;
    return { id: `bb-ss-tonight-w${week}`, kind: 'twist', anchor: 'start', day: 1, week, time: '23:30', ...LIVING, plate: 'living-sofas', sceneful: true,
      kicker: 'Secret Story', title: 'Tonight', label: 'Tonight', sub: 'The first week ends', cast: night.find(s => s.scene)?.scene.cast || [], ss: true, steps: [
        { k: 'beat', scene: { ...LIVING, cast: [] }, t: pickBy(['A week ago they were strangers. Tonight, some of them would trust each other with anything. Anything except their secret.',
          `One week in the House of Secrets. The friendships are made, the first suspicions too, and ${found ? `${nw(found)} secret${found > 1 ? 's have' : ' has'} already fallen` : 'not one secret has fallen yet'}.`,
          'The first week ends. The lights go out, but nobody in the house is asleep.'], `${k}|n`), toast: ['TONIGHT', '#ff3ea5'] },
        ...night,
        { k: 'beat', scene: { ...LIVING, cast: [] }, t: pickBy(['Next week, it gets real: the first nominations, one by one, in the confessional. And at the prime, the public sends the first of them home.',
          'From next week, nobody is safe. The first nominations, the first prime, and the first goodbye.'], `${k}|next`) },
        o.ssv('The Voice will see you very soon. That is all for now.', { toast: ['THE VOICE', '#e0b84a'] })] };
  }
  if (!noms.length) return null;
  const party = acts.find(a => a?.type === 'ss-party');
  const love = party && (party.moments || []).find(m => m.kind === 'kiss');
  const segs = (prime?.segments || []).map(s => s.kind);
  const night = nightScenes(row, noms, k);
  // (the narrator names the couple the night showed, never a different one)
  const nightPair = night.find(s => s.scene?.room === 'Bedroom' && (s.scene.cast || []).length === 2)?.scene.cast.map(c => c[0]);
  /** @type {any[]} */ const steps = [
    ...night,
    { k: 'beat', ...(night.length ? { scene: { ...LIVING, cast: noms.map((n, i, a) => [n, a.length === 1 ? 50 : Math.round(20 + 60 * i / (a.length - 1))]) } } : {}), t: (nightPair || love) ? `Whether they're living brand-new feelings, like ${(nightPair || love.who)[0]} and ${(nightPair || love.who)[1]}, or worrying about tomorrow, one thing is sure: the night will be full of thought for every player.`
      : pickBy(["Whether they're counting their friends or their enemies, one thing is sure: the night will be full of thought for every player.",
        'Trust has to be earned in this house, and it can be lost very fast. Tonight, nobody really knows who to rely on.',
        'The lights go out in the House of Secrets. Nobody is asleep yet.'], `${k}|n`), toast: ['TONIGHT', '#ff3ea5'] },
    { k: 'beat', t: `And tomorrow, at the prime: ${segs.includes('phone') ? 'the red phone will ring, ' : ''}${segs.includes('dilemma') ? 'a dilemma will cost somebody dearly, ' : ''}${segs.includes('visit') ? 'somebody will get a visit from home, ' : ''}and one of ${listOf(noms)} will leave the House of Secrets for good.` },
    o.ssv(`This is the Voice. ${nw(noms.length).replace(/^./, c => c.toUpperCase())} housemates face elimination this week: ${listOf(noms)}. One of them will leave the adventure for good.`, { toast: ['THE VOICE', '#e0b84a'] }),
    o.ssv('Vote now to save your favourite housemate.', { votecall: noms.slice() }),
    o.ssv('The Voice is counting on you, and will see you tomorrow night, live, for the result of your votes. That is all for now.'),
  ];
  return { id: `bb-ss-tonight-w${week}`, kind: 'twist', anchor: 'start', day: 1, week, time: '23:30', ...LIVING, plate: 'living-sofas',
    kicker: 'Secret Story', title: 'Tonight', label: 'Tonight', sub: `${nw(noms.length)} nominees`, cast: night.find(s => s.scene)?.scene.cast || noms.map((n, i, a) => [n, a.length === 1 ? 50 : Math.round(20 + 60 * i / (a.length - 1))]), sceneful: true, steps, ss: true };
}
