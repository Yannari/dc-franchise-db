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
const FOLD = /^bb-ss-(rule|clue|houseclue|mission|role|store|houseend)-/;
const GATHER = /\b(everybody|everyone|housemates)\b[^.?!]*\bliving room\b/i;
const MOOD_OF = id => (/^bb-ss-rule-/.test(id) ? 'ceremony' : /^bb-ss-(clue|houseclue)-/.test(id) ? 'secret' : /^bb-ss-(mission|role)-/.test(id) ? 'mission' : /^bb-ss-store-/.test(id) ? 'store' : 'house');
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
export function ssArrange(out, row, o) {
  // Big Brother's move-in night and its primer are not Secret Story's launch (the user: "move-in night conflicts
  // with the arrivals"); the Voice's week-open and after-eviction words are the narrator's now
  for (let i = out.length - 1; i >= 0; i--) if (/^(bb-movein(-v)?|theme-primer-v|bb-theme-open-v|bb-theme-vote-v)$/.test(out[i].id)) out.splice(i, 1);
  // (the theme's "the lines are now open" after the nominations: the narrator and the Voice close the days now)
  for (const s of out) if (s.id === 'bb-noms-v') s.steps = (s.steps || []).filter(st => !/^The speakers in the living room click on\.?$|The lines are now open/.test(String(st.t || '')));
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
    if (!FOLD.test(id) || (pz >= 0 && i > pz) || (F.steps || []).length > 7) continue;
    let host = -1;
    for (let j = i - 1; j >= 0 && host < 0; j--) { if (out[j].kind === 'houselife') host = j; else if (!FOLD.test(String(out[j].id || '')) && out[j].kind !== 'scene') break; }
    let before = false;
    if (host < 0) for (let j = i + 1; j < out.length && host < 0; j++) { if (out[j].kind === 'houselife') { host = j; before = true; } else if (!FOLD.test(String(out[j].id || ''))) break; }
    if (host < 0) continue;
    const steps = (F.steps || []).map((st, k) => (k === 0 ? { ...st, scene: asScene(F) } : st));
    const H = out[host];
    H.steps = before ? [...steps, ...H.steps] : [...H.steps, ...steps];
    out.splice(i, 1);
    i--;
  }
  // the Voice's game's winner goes with the game itself
  {
    const g = idx(/^bb-ss-game-w/), comp = idx(/^bb-hoh-v$/);
    if (g >= 0 && comp >= 0 && (out[g].steps || []).length <= 6) { out[comp].steps = [...out[comp].steps, ...out[g].steps]; out.splice(g, 1); }
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
    if (order[0]) say(`${order[0]} was the very first through the door, and paid for the privilege: the public saw ${order[0]}'s secret before anybody else's.`, [order[0]], 'ss-studio', 'studio-wide');
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
    say(pickBy(['the game picks up where it left off.', 'nobody in the House of Secrets got much sleep.', 'the hunt went on, and so did the lies.'], `${k}|0`), (prev.houseAtStart || []).slice(0, 5));
    if (right[0]) say(`${right[0].by} pressed the buzzer on ${right[0].target}, and found the secret: ${money(right[0].took)} changed hands.`, [right[0].by, right[0].target], 'confessional-showdown', 'dr');
    else if (wrong[0]) say(`${wrong[0].by} pressed the buzzer on ${wrong[0].target}... and was wrong.`, [wrong[0].by, wrong[0].target], 'confessional-showdown', 'dr');
    if (game) say(`${game.winner} won the Voice's game.`, [game.winner], 'ss-arena', 'arena');
    if (kiss) say(`At ${String(party.name || 'the party').replace(/^The /, 'the ')}, ${kiss.who[0]} and ${kiss.who[1]} kissed in front of everybody.`, kiss.who.slice(0, 2));
    else if (fight) say(`At ${String(party.name || 'the party').replace(/^The /, 'the ')}, ${fight.who[0]} and ${fight.who[1]} had it out in front of everybody.`, fight.who.slice(0, 2));
    if (out) say(`And at the prime, the public sent ${out} home. ${pickBy([`${out}'s bed is empty now`, `The house is one housemate lighter`, `The house is still getting over it`], `${k}|o`)}.`, [out], 'ss-studio-crowd', 'studio-wide');
    say(pickBy(['Betrayal, lies, alliances changing sides. In short, an almost normal week in the House of Secrets.', 'But here, the walls have ears, and nothing stays buried for long.', 'And in this house, a secret never stays hidden for long.'], `${k}|t`), [], 'living-screens');
    hook = pickBy(['So who will be the next to walk into the airlock?', 'So who will crack the next secret?', 'So who will be standing in the airlock this week?'], `${k}|h`);
  }
  const xs = n => (n <= 1 ? [50] : Array.from({ length: n }, (_, i) => Math.round(20 + (60 * i) / (n - 1))));
  const sceneOf = e => ({ set: e.set, plate: e.plate, room: 'Previously', cam: 1, kicker: 'Previously in Secret Story', cast: (e.who || []).filter(Boolean).map((n, i, a) => [n, xs(a.length)[i]]) });
  const steps = [
    { k: 'beat', t: `Previously in Secret Story... ${said[0].t}`, toast: ['PREVIOUSLY', '#ff3ea5'], scene: sceneOf(said[0]) },
    ...said.slice(1).map(e => ({ k: 'beat', t: e.t, scene: sceneOf(e) })),
    { k: 'beat', t: hook, scene: sceneOf({ t: hook, plate: 'foyer', set: 'door' }) }];
  return { id: `bb-ss-previously-w${week}`, kind: 'twist', anchor: 'start', day: 1, week, time: 'RECAP', ...LIVING, plate: 'living-screens', sceneful: true,
    kicker: 'Secret Story', title: 'Previously', label: 'Previously', sub: 'In Secret Story', cast: [], steps, ss: true };
}

// ── the end of the days: the narrator, then the Voice asks the public to vote ──
function ssTonightScreen(row, o) {
  const week = row.num || 1;
  const acts = row.acts || [];
  const prime = acts.find(a => a?.type === 'ss-prime');
  const noms = prime?.nominees || acts.find(a => a?.type === 'nominations')?.nominees || [];
  if (!noms.length) return null;
  const k = `${week}|tonight`;
  const party = acts.find(a => a?.type === 'ss-party');
  const love = party && (party.moments || []).find(m => m.kind === 'kiss');
  const segs = (prime?.segments || []).map(s => s.kind);
  /** @type {any[]} */ const steps = [
    { k: 'beat', t: love ? `Whether they're living brand-new feelings, like ${love.who[0]} and ${love.who[1]}, or worrying about tomorrow, one thing is sure: the night will be full of thought for every player.`
      : pickBy(["Whether they're counting their friends or their enemies, one thing is sure: the night will be full of thought for every player.",
        'Trust has to be earned in this house, and it can be lost very fast. Tonight, nobody really knows who to rely on.',
        'The lights go out in the House of Secrets. Nobody is asleep yet.'], `${k}|n`), toast: ['TONIGHT', '#ff3ea5'] },
    { k: 'beat', t: `And tomorrow, at the prime: ${segs.includes('phone') ? 'the red phone will ring, ' : ''}${segs.includes('dilemma') ? 'a dilemma will cost somebody dearly, ' : ''}${segs.includes('visit') ? 'somebody will get a visit from home, ' : ''}and one of ${listOf(noms)} will leave the House of Secrets for good.` },
    o.ssv(`This is the Voice. ${nw(noms.length).replace(/^./, c => c.toUpperCase())} housemates face elimination this week: ${listOf(noms)}. One of them will leave the adventure for good.`, { toast: ['THE VOICE', '#e0b84a'] }),
    o.ssv('Vote now to save your favourite housemate.', { votecall: noms.slice() }),
    o.ssv('The Voice is counting on you, and will see you tomorrow night, live, for the result of your votes. That is all for now.'),
  ];
  return { id: `bb-ss-tonight-w${week}`, kind: 'twist', anchor: 'start', day: 1, week, time: '23:30', ...LIVING, plate: 'living-sofas',
    kicker: 'Secret Story', title: 'Tonight', label: 'Tonight', sub: `${nw(noms.length)} nominees`, cast: noms.map((n, i, a) => [n, a.length === 1 ? 50 : Math.round(20 + 60 * i / (a.length - 1))]), steps, ss: true };
}
