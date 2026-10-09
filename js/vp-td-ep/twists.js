// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/twists.js — the islands on the stepped stage: Redemption, Rescue, Exile
// ══════════════════════════════════════════════════════════════════════
//
// PURE, like steps.js: an episode record in, a screen of steps out. The non-challenge twist
// screens the classic viewer shows as cards (rpBuildRIChoice, rpBuildRILife,
// rpBuildRescueIslandLife, the Exile Island block) played as scenes on the island plates
// (tools/td-camp/venues/islands.py): who is there, what each of them is doing, the event as it
// happens with the people in it, and the find, the choice or the duel ahead as a moment.
//
// RENDER, NEVER INVENT (§18.3). Every island event is the engine's own sentence
// (ep.riLifeEvents / ep.rescueIslandEvents, written when it fired). The words written here are
// the host's, the stage directions that say what the classic card already said, and the choice
// quote (one pool, shared with the classic card); tdStepTranscript hands all of it to the text
// backlog (_textTdIslands).
import { TD_MARKS } from './marks.js';
import { placeScene, plateKey, placeName, venueOf, VENUES, cleanText, TIEBREAK_SPOT, TIEBREAK_AT } from './steps.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const ISL = 'islands';
const plate = (spot, tod) => plateKey(ISL, spot, tod);

// ── the choice ────────────────────────────────────────────────────────
// What the voted-out say at the crossroads. The classic card draws from the same pools, by the
// same key, so both viewers say the same line.
export const RI_ACCEPT_QUOTES = [
  `I didn't come this far to quit. Light the torch — I'm staying.`,
  `They think they got rid of me? I'll claw my way back into this game.`,
  `I'm not done. Not even close.`,
  `Every person who wrote my name is going to regret it.`,
  `This isn't over. I've got unfinished business.`,
  `You want me out? You'll have to beat me yourself.`,
];
export const RI_DECLINE_QUOTES = [
  `I've said what I needed to say. I'm at peace with this.`,
  `I gave it everything. Time to go home.`,
  `There's nothing left for me here. I'm done.`,
  `I'd rather leave with my dignity than fight in some gladiator pit.`,
  `My torch is snuffed. That's the game.`,
];
export const riChoiceQuote = (ep, accepted) => pickBy(accepted ? RI_ACCEPT_QUOTES : RI_DECLINE_QUOTES, 'ri-choice', ep.num, ep.eliminated);

// ── what an island event looks like ───────────────────────────────────
const BADGE = {
  processing: ['Processing', 'iron'], training: ['Training', 'fire'], 'training-life': ['Training', 'fire'], 'edge-train': ['Training', 'fire'],
  'training-injury': ['Injury', 'danger'], 'training-injury-life': ['Injury', 'danger'], 'edge-injury': ['Injury', 'danger'],
  'shared-training': ['Sparring', 'fire'], 'shared-training-life': ['Sparring', 'fire'], reflection: ['Reflection', 'iron'], motivation: ['Fire lit', 'gold'],
  'mental-breakdown': ['Broken', 'danger'], 'mental-breakdown-life': ['Broken', 'danger'], 'mental-hardened': ['Hardened', 'iron'], 'mental-hardened-life': ['Hardened', 'iron'],
  'mental-obsessed': ['Obsessed', 'danger'], 'mental-obsessed-life': ['Obsessed', 'danger'], 'sizing-up': ['Sizing up', 'fire'], history: ['Shared history', 'iron'],
  'enemy-arrives': ['Rival arrives', 'danger'], 'ally-arrives': ['Ally arrives', 'green'], 'trash-talk': ['Trash talk', 'fire'], intimidation: ['Intimidation', 'fire'],
  'grudge-confrontation': ['Confrontation', 'danger'], 'cold-war': ['Cold war', 'iron'], 'explosive-fight': ['Blow up', 'danger'], 'bonding-meal': ['Bonding', 'green'],
  'emotional-talk': ['Heart to heart', 'green'], bittersweet: ['Bittersweet', 'iron'], 'heartbreak-preview': ['Heartbreak', 'danger'], comedy: ['Comic relief', 'gold'],
  'midnight-talk': ['Late night', 'iron'], 'resource-conflict': ['Friction', 'fire'], 'alliance-plot': ['Plotting', 'fire'], comfort: ['Comfort', 'green'],
  'mutual-respect': ['Respect', 'iron'], 'revenge-talk': ['Revenge pact', 'danger'], bonding: ['Bonding', 'green'], rivalry: ['Rivalry', 'danger'],
  'game-talk': ['Game talk', 'gold'], struggling: ['Struggling', 'danger'], thriving: ['Thriving', 'green'], 'quit-temptation': ['Wavering', 'fire'], quit: ['Quit', 'danger'],
  'edge-social': ['Leaning on each other', 'green'], 'edge-rest': ['Resting', 'iron'],
  'group-breakfast': ['Breakfast', 'gold'], 'group-storm': ['Storm', 'danger'], 'group-fire': ['By the fire', 'green'],
  'group-chores': ['Chore war', 'fire'], 'group-comeback': ['Who goes back', 'danger'],
};
const badgeOf = t => { const b = BADGE[t]; return b ? { text: b[0].toUpperCase(), cls: b[1] } : { text: 'ISLAND LIFE', cls: 'fire' }; };
const ACT = [
  ['train', ['training', 'training-life', 'edge-train', 'shared-training', 'shared-training-life']],
  ['hurt', ['training-injury', 'training-injury-life', 'edge-injury']],
  ['shout', ['trash-talk', 'intimidation', 'rivalry', 'grudge-confrontation', 'explosive-fight', 'resource-conflict', 'revenge-talk', 'enemy-arrives']],
  ['laugh', ['comedy']],
  ['lean', ['midnight-talk', 'emotional-talk', 'game-talk', 'alliance-plot', 'history', 'sizing-up', 'cold-war', 'edge-social']],
  ['hug', ['comfort', 'bonding-meal', 'bonding', 'mutual-respect', 'ally-arrives', 'bittersweet']],
  ['cry', ['mental-breakdown', 'mental-breakdown-life', 'struggling', 'heartbreak-preview', 'quit-temptation']],
  ['fire', ['motivation', 'mental-hardened', 'mental-hardened-life', 'mental-obsessed', 'mental-obsessed-life', 'thriving']],
  ['rest', ['edge-rest']],
  ['storm', ['quit']],
  ['gust', ['group-storm']],
  ['laugh', ['group-breakfast']],
  ['lean', ['group-fire']],
  ['shout', ['group-chores', 'group-comeback']],
];
const actKind = (t, text) => (t === 'processing' && /breaks? down/i.test(text) ? 'cry' : (ACT.find(([, ts]) => ts.includes(t)) || [null])[0]);
// what a resident is doing while somebody else's moment plays
const BUSY_FOR = { train: 'stretch', hurt: 'nap', rest: 'nap', cry: 'nap', fire: 'whittle', laugh: 'eat', hug: 'fish', lean: 'whittle', shout: 'stretch' };
// the time of day an event belongs to, by what its sentence says happened (narrative only)
const nightOf = (t, text) => ['midnight-talk', 'mental-breakdown', 'mental-breakdown-life'].includes(t) || /\b(at night|3 AM|by the fire|the dark)\b/i.test(text);
// morning: alone with it (training, processing); afternoon: with each other; night: the fire, the dark
// a written scene says what it is (td/script/island.js): the late talks, a breakdown, the fire
const NIGHT_SCENES = new Set(['isle.pair:late', 'isle.trio:late', 'isle.mind:broken', 'isle.group:fire']);
const isNight = e => (e.scene ? NIGHT_SCENES.has(`${e.scene.kind}:${e.scene.data?.ending}`) : nightOf(e.type, cleanText(e.text)));
// an arrival is met before anything else happens to the new arrival
const isArrival = e => e.type === 'sizing-up' || (e.scene && e.scene.data?.ending === 'size');
const rankOf = e => (isArrival(e) ? -1 : isNight(e) ? 2 : e.player2 ? 1 : 0);

// The voted-out who are still out there, as the episode began: the record, never live state.
function residentsOf(ep, rescue) {
  const snap = ep.riPlayersPreDuel || ep.gsSnapshot?.riPlayers || [];
  const evs = rescue ? (ep.rescueIslandEvents || []) : (ep.riLifeEvents || []);
  return [...new Set([...snap, ...evs.flatMap(e => [e.player, e.player2])].filter(Boolean))];
}

// ══════════════════════════════════════════════════════════════════════
// THE CHOICE — the voted-out at the crossroads (Redemption), or landed on Rescue Island
// ══════════════════════════════════════════════════════════════════════
export function tdRiChoiceScreen(ep, o = {}) {
  const elim = ep.eliminated, choice = ep.riChoice;
  if (!elim || !choice) return null;
  const host = o.host || 'Chris';
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  // Disventure Camp's crossroads: the sign, the torch, and the voted-out's walk (the user's frames)
  const venue = venueOf(ep, o);
  const sign = venue === 'survival-island' ? plate('sign-soluna', 'night') : venue === 'carnival' ? plate('sign-stawaki', 'night') : null;
  if (sign) {
    const take = choice === 'RESCUE ISLAND' || choice === 'REDEMPTION ISLAND';
    // which island the torch leads to: the one they took, or the one the season offered
    const isle = choice === 'REDEMPTION ISLAND' || (choice !== 'RESCUE ISLAND' && globalThis.seasonConfig?.riFormat === 'redemption') ? 'Redemption Island' : 'Rescue Island';
    const torch = venue === 'survival-island' ? { u: .77, v: .7 } : { u: .76, v: .7 };
    const places = { [elim]: { u: .5, v: .71, s: .2 }, [host]: { u: .19, v: .71, s: .2, host: true } };
    steps.push({ k: 'scene', spot: 'sign', tod: 'night', plate: sign, place: 'One Final Choice', time: '9:15 PM', card: true, focus: [elim], bg: [], places });
    say(`${elim}, this is where it ends... or doesn't.`, { focus: [elim] });
    steps.push({ k: 'beat', text: `${elim} reads the sign. Left: the path to the Motel. Right: take the torch and fight your way back from ${isle}.`, focus: [elim], tense: true });
    steps.push({ k: 'title', kicker: 'One final choice', name: elim, faces: [elim] });
    steps.push({ k: 'say', by: elim, text: riChoiceQuote(ep, take), focus: [elim], loud: take });
    steps.push({ k: 'beat', text: take ? `${elim} pulls the torch out of the ground and heads right, into the dark.` : `${elim} looks at the torch for a long moment... then turns and takes the left path to the Motel.`,
      focus: [elim], act: { kind: 'torch', who: [elim], take, tu: torch.u, tv: torch.v }, side: [{ tab: 'residents', text: take ? `${elim} takes the torch.` : `${elim} goes to the Motel.` }] });
    steps.push({ k: 'title', kicker: take ? 'Torch taken' : 'Leaving the game', name: take ? isle : 'The Motel', faces: [elim], tone: take ? 'fire' : 'out' });
    // down the path they chose (the user's frames): the torch carried toward Rescue, or the walk to the Motel
    const path = plate(take ? 'path-rescue' : 'path-motel', 'night');
    if (path) {
      steps.push({ k: 'scene', spot: take ? 'path-rescue' : 'path-motel', tod: 'night', plate: path, place: take ? `The Path to ${isle}` : 'The Path to the Motel', time: '9:20 PM', card: false, cut: true,
        focus: [elim], bg: [], wide: true, places: { [elim]: { u: take ? .42 : .58, v: .95, s: .3, h: 34, crowd: true } } });
      steps.push({ k: 'beat', text: take ? `${elim} follows the torchlight into the trees. ${isle} is a long way from here.` : `${elim} follows the arrow. Somewhere at the end of this path is a bed, and no more votes.`,
        focus: [elim], act: { kind: 'path', who: [elim], dir: take ? 'R' : 'L', lit: take } });
    }
    if (!take) return { id: 'ri-choice', kind: 'island', venue: ISL, ep: ep.num, label: 'One Final Choice', host, steps };
    // the choice was made at the sign: Redemption Island is where the path ends, never a second
    // crossroads asking again (the user, 2026-10-08: "two different scenes for the RI choice")
    if (choice === 'REDEMPTION ISLAND') {
      const key = riPlace(ep, o, 'night');
      const already = residentsOf(ep, false).filter(n => n !== elim);
      if (islandMapOn(ep, o) && landing(steps, elim, already, 'Redemption Island')) {
        steps.push({ k: 'beat', text: `${elim} wades onto Skull Beach. The next duel decides whether ${elim} gets back in.`, focus: [elim], side: [{ tab: 'residents', text: `${elim} arrives (episode ${ep.num}).` }] });
      } else if (key) {
        const places = placeScene(key, [elim], []);
        steps.push({ k: 'scene', spot: 'redemption-camp', tod: 'night', plate: key, place: 'Redemption Island', time: 'That night', card: false, cut: true, focus: [elim], bg: [], places, act: { kind: 'arrive', who: [elim] } });
        steps.push({ k: 'beat', text: `${elim} reaches Redemption Island. The next duel decides whether ${elim} gets back in.`, focus: [elim], side: [{ tab: 'residents', text: `${elim} arrives (episode ${ep.num}).` }] });
      }
      return { id: 'ri-choice', kind: 'island', venue: ISL, ep: ep.num, label: 'One Final Choice', host, steps };
    }
  }
  if (choice === 'RESCUE ISLAND') {
    const already = (ep.riArrival?.existingResidents || []).filter(n => n !== elim);
    if (islandMapOn(ep, o) && landing(steps, elim, already, 'Rescue Island')) {
      steps.push({ k: 'beat', text: `The boat drops ${elim} on Skull Beach. The game isn't over.`, focus: [elim], side: [{ tab: 'residents', text: `${elim} arrives (episode ${ep.num}).` }] });
    } else {
      const key = plate('rescue-camp', 'night');
      const places = placeScene(key, [elim, ...already].slice(0, 9), []);
      steps.push({ k: 'scene', spot: 'rescue-camp', tod: 'night', plate: key, place: 'Rescue Island', time: 'That night', card: !sign, cut: !!sign, focus: [elim], bg: [], places,
        acts: Object.fromEntries(already.map(n => [n, pickBy(['whittle', 'nap', 'fish'], n, ep.num)])), act: { kind: 'arrive', who: [elim] } });
      steps.push({ k: 'beat', text: `A boat drops ${elim} on the shore of Rescue Island. The game isn't over.`, focus: [elim], side: [{ tab: 'residents', text: `${elim} arrives (episode ${ep.num}).` }] });
    }
    steps.push({ k: 'say', by: elim, text: riChoiceQuote(ep, true), focus: [elim], loud: true });
    if (already.length) {
      steps.push({ k: 'beat', text: `${already.length === 1 ? already[0] : already.slice(0, -1).join(', ') + ' and ' + already[already.length - 1]} look${already.length === 1 ? 's' : ''} up from the fire.`, focus: already.slice(0, 4), act: { kind: 'lean', who: [elim, already[0]] } });
    }
    steps.push({ k: 'title', kicker: 'Rescue Island', name: `${already.length + 1} castaway${already.length ? 's' : ''}`, faces: [...already, elim].slice(-6) });
    return { id: 'ri-choice', kind: 'island', venue: ISL, ep: ep.num, label: 'Rescue Island', host, steps };
  }
  const accepted = choice === 'REDEMPTION ISLAND';
  const key = plateKey(venueOf(ep, o), 'exit', 'night') || plate('rescue-crossroads', 'night');
  const hostMark = ((TD_MARKS[key] || {}).m || []).find(m => m.kind === 'host');
  const places = { [elim]: { u: .4, v: .7, s: .16 } };
  if (hostMark) places[host] = { u: hostMark.u, v: hostMark.v, s: hostMark.s, host: true };
  else places[host] = { u: .72, v: .72, s: .18, host: true };
  steps.push({ k: 'scene', spot: 'rescue-crossroads', tod: 'night', plate: key, place: 'The Crossroads', time: '9:20 PM', card: true, focus: [elim], bg: [], places });
  say(`${elim}, the tribe has spoken. But this season, being voted out doesn't have to be the end.`);
  say(`Go right, and you live on Redemption Island and fight a duel for your place in the game. Go left, and you go home.`);
  steps.push({ k: 'title', kicker: 'One final choice', name: elim, faces: [elim] });
  steps.push({ k: 'say', by: elim, text: riChoiceQuote(ep, accepted), focus: [elim], loud: accepted });
  steps.push({ k: 'beat', text: accepted ? `${elim} takes the path to the right.` : `${elim} takes the path home.`, focus: [elim],
    act: { kind: 'path', who: [elim], dir: accepted ? 'R' : 'L', lit: accepted }, side: [{ tab: 'residents', text: accepted ? `${elim} goes to Redemption Island.` : `${elim} goes home.` }] });
  steps.push({ k: 'title', kicker: accepted ? 'Bound for' : 'Torch snuffed', name: accepted ? 'Redemption Island' : 'Going home', faces: [elim], tone: accepted ? 'fire' : 'out' });
  if (accepted && islandMapOn(ep, o)) landing(steps, elim, residentsOf(ep, false).filter(n => n !== elim), 'Redemption Island');
  return { id: 'ri-choice', kind: 'island', venue: ISL, ep: ep.num, label: 'One Final Choice', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// ISLAND LIFE — Redemption Island before the duel, or a day on Rescue Island
// ══════════════════════════════════════════════════════════════════════
// The post-duel events (winner-*, loser-*) belong to the duel screen, which stays classic.
const POST_DUEL = ['winner-relief', 'winner-hardened', 'winner-streak', 'winner-obsessed', 'loser-graceful', 'loser-bitter', 'loser-emotional', 'loser-neutral'];

// Redemption Island is an island (Boney Island) everywhere but the film lot (its prison set, the cage
// stage) and Stawaki (its Exile Beach); the user, 2026-10-08: "redemption island still uses a 3D scene"
function riPlace(ep, o, tod) {
  const venue = venueOf(ep, o);
  // the island itself: Skull Rock in 4K (the user, 2026-10-09: the Boney Island frame is a blurry 930px
  // capture); Boney Island only if Skull Rock is ever missing
  const isle = plateKey(ISL, 'skull-rock', tod) ? 'skull-rock' : 'boney-island';
  // the island as a place (zz_zzzredemption.py, the user's frames, 2026-10-09): Skull Beach
  const at = venue === 'film-lot' ? ['film-lot', 'cage-stage'] : islandMapOn(ep, o) ? [RI_VENUE, 'skull-beach'] : venue === 'carnival' ? [ISL, 'stawaki-exile'] : [ISL, isle];
  return plateKey(at[0], at[1], tod) || plateKey(at[0], at[1], tod === 'night' ? 'day' : 'night');
}
export function tdIslandLifeScreen(ep, rescue, o = {}) {
  const all = rescue ? (ep.rescueIslandEvents || []) : (ep.riLifeEvents || []).filter(e => !POST_DUEL.includes(e.type));
  // the day in order: each moment keeps its place among those of its own time of day
  const events = all.filter(e => cleanText(e.text)).map((e, i) => ({ e, i })).sort((a, b) => rankOf(a.e) - rankOf(b.e) || a.i - b.i).map(x => x.e);
  if (!events.length) return null;
  const spot = rescue ? 'rescue-camp' : 'redemption-camp';
  const isle = rescue ? 'Rescue Island' : 'Redemption Island';
  const residents = residentsOf(ep, rescue);
  const steps = [];
  // when each resident got here (for the Intel drawer)
  const arrived = ep.gsSnapshot?.riArrivalEp || {};
  const streak = ep.riDuel?.preStreakData || {};
  const roll = residents.map(n => ({ tab: 'residents', text: `${n}${arrived[n] ? ` · here since episode ${arrived[n]}` : ''}${streak[n] >= 1 ? ` · ${streak[n]} duel win${streak[n] > 1 ? 's' : ''}` : ''}` }));
  // each resident's own first activity this episode: what they are doing in the background
  const busy = {};
  for (const e of events) for (const n of [e.player, e.player2, e.player3].filter(Boolean)) if (!busy[n]) busy[n] = BUSY_FOR[actKind(e.type, e.text)] || 'whittle';
  const TIME = { '-1': 'Day', 0: 'Day', 1: 'Later that day', 2: 'Night' };
  let rank = -9;
  const open = r => {
    const t = r === 2 ? 'night' : 'day';
    const key = riPlace(ep, o, t) || plate(spot, t);
    const places = placeScene(key, residents.slice(0, 9), []);
    // morning to afternoon: the light moves on, nobody moves (no new card)
    steps.push({ k: 'scene', spot, tod: t, plate: key, place: isle, time: TIME[r], card: rank === -9 || r === 2, focus: [], bg: [], places,
      acts: Object.fromEntries(residents.map(n => [n, busy[n] || 'whittle'])) });
    rank = r;
  };
  for (const e of events) {
    const r = Math.max(rankOf(e), 0);   // an arrival opens the day, on the same set
    if (r !== rank) { open(r); if (steps.length === 1) steps[0].side = roll; }
    playEvent(steps, e, residents, isle);
  }
  // what is coming: the duel tonight, or everyone still waiting for their way back
  if (!rescue && ep.riDuel) {
    const d = ep.riDuel.duelists || [ep.riDuel.winner, ep.riDuel.loser];
    steps.push({ k: 'title', kicker: 'Next on Redemption Island', name: 'The Duel', faces: d, vs: true });
  } else if (rescue) {
    steps.push({ k: 'title', kicker: 'Still on Rescue Island', name: `${residents.length} waiting for a way back`, faces: residents.slice(0, 8) });
  }
  return { id: rescue ? 'rescue-life' : 'ri-life', kind: 'island', venue: ISL, ep: ep.num, label: isle, host: o.host || 'Chris', steps };
}

// one island moment, played: its written lines one click each, or the engine's sentence as a beat
function playEvent(steps, e, residents, isle) {
  const text = cleanText(e.text);
  const who = [e.player, e.player2, e.player3].filter(n => n && residents.includes(n));
  let kind = actKind(e.type, text);
  if ((kind === 'hug' || kind === 'lean') && who.length < 2) kind = null;   // nobody to hold on to
  const side = [{ tab: 'log', text: `${badgeOf(e.type).text}: ${who.join(', ')}` }];
  if (e.type === 'quit') side.push({ tab: 'residents', text: `${who[0]} quits ${isle}.` });
  const gain = e.stat && ['training', 'training-life', 'edge-train', 'shared-training', 'shared-training-life'].includes(e.type) ? { who: who[0], stat: e.stat, up: true }
    : e.stat && /injury/.test(e.type) ? { who: who[0], stat: e.stat, up: false } : null;
  if (Array.isArray(e.lines) && e.lines.length) {
    // a written scene: one click per line, the moment's badge on its first stage direction
    const first = steps.length;
    for (const l of e.lines) {
      const t = cleanText(l.text);
      if (!t) continue;
      if (l.kind === 'conf') steps.push({ k: 'conf', by: l.by, text: t });
      else if (l.kind === 'beat') steps.push({ k: 'beat', text: t, focus: who });
      else steps.push({ k: 'say', by: l.by, text: t, focus: who, loud: /!/.test(t) && t.length < 70 });
    }
    const lead = steps[first];
    if (lead) {
      lead.act = kind ? { kind, who } : null;
      lead.side = side;
      if (gain) lead.gain = gain;
      const firstBeat = steps.slice(first).find(x => x.k === 'beat');
      (firstBeat || lead).badge = badgeOf(e.type);
    }
    return;
  }
  const step = { k: 'beat', text, badge: badgeOf(e.type), focus: who, act: kind ? { kind, who } : null, side };
  if (gain) step.gain = gain;
  steps.push(step);
}

// ══════════════════════════════════════════════════════════════════════
// THE ISLAND AS A MAP (the user, 2026-10-09: "the 4K Skull Rock as a map like the other maps, with
// zones"; Redemption and Rescue alike, "the difference is that people here stay"). Boney Island
// (tools/td-camp/venues/zz_zzzredemption.py): the map, Skull Beach under the skull, the Shoreline's
// lagoon, the Rocky Beach, and the Cave (its mouth, and the pool inside the cliffs). Each moment is
// played where that kind of moment happens; the map (map.js tdIslandMap) holds them by time of day.
// The film lot keeps its prison set (the cage stage).
// ══════════════════════════════════════════════════════════════════════
export const RI_VENUE = 'redemption';
export const islandMapOn = (ep, o = {}) => venueOf(ep, o) !== 'film-lot' && !!plateKey(RI_VENUE, 'map', 'day');
export const islandName = rescue => (rescue ? 'Rescue Island' : 'Redemption Island');
// what kind of moment happens where: training on the stones, a fight on the stones or the open beach,
// meals and comfort by the lagoon, a breakdown alone at the cave mouth, scheming deep inside it; a quiet
// moment wherever there is somewhere to sit and think. The same moment always lands in the same place.
const PLACE_FOR = { train: ['rocky-beach'], hurt: ['rocky-beach'], shout: ['rocky-beach', 'skull-beach'], laugh: ['shoreline', 'skull-beach'], hug: ['shoreline', 'skull-beach'],
  storm: ['shoreline'], cry: ['cave-entrance', 'shoreline'], rest: ['cave-entrance', 'shoreline'], fire: ['skull-beach', 'rocky-beach'], gust: ['skull-beach'],
  lean: ['skull-beach', 'shoreline', 'rocky-beach'] };
const QUIET = ['skull-beach', 'shoreline', 'cave-entrance'];
const HIDDEN = new Set(['alliance-plot', 'game-talk', 'cold-war', 'revenge-talk', 'history']);
export function islandPlaceOf(e) {
  if (isArrival(e)) return 'skull-beach';
  if (HIDDEN.has(e.type)) return 'cave-inside';
  const opts = PLACE_FOR[actKind(e.type, cleanText(e.text))] || QUIET;
  return opts[hash(`${e.type}|${e.player}|${e.player2 || ''}|${String(e.text || '').slice(0, 40)}`) % opts.length];
}
/** The island's moments this episode, in the day's order (the duel's aftermath belongs to the duel). */
export function islandEvents(ep, rescue) {
  const all = rescue ? (ep.rescueIslandEvents || []) : (ep.riLifeEvents || []).filter(e => !POST_DUEL.includes(e.type));
  return all.filter(e => cleanText(e.text)).map((e, i) => ({ e, i })).sort((a, b) => rankOf(a.e) - rankOf(b.e) || a.i - b.i).map(x => x.e);
}
export const islandResidents = (ep, rescue) => residentsOf(ep, rescue);
export const islandWindowOf = e => Math.max(rankOf(e), 0);
export const islandBadge = e => badgeOf(e.type).text;
const CLOCK = ['9:00 AM', '3:00 PM', '9:00 PM'];
/** One island moment as its own screen, on the place it happens. */
export function tdIslandConvScreen(ep, rescue, e, o = {}) {
  const residents = residentsOf(ep, rescue), isle = islandName(rescue);
  const place = islandPlaceOf(e), w = islandWindowOf(e), tod = w === 2 ? 'night' : 'day';
  const key = plateKey(RI_VENUE, place, tod) || plateKey(RI_VENUE, place, tod === 'night' ? 'day' : 'night');
  if (!key) return null;
  const who = [e.player, e.player2, e.player3].filter(n => n && residents.includes(n));
  const steps = [{ k: 'scene', spot: place, tod, plate: key, place: placeName(place), time: CLOCK[w], card: true, focus: who, bg: [], places: placeScene(key, who, []) }];
  playEvent(steps, e, residents, isle);
  return { id: 'ri-conv', kind: 'island', venue: RI_VENUE, ep: ep.num, label: isle, host: o.host || 'Chris', steps };
}
/** The crossing: the Boat of Losers out to the island at night, and the landing on Skull Beach. */
function landing(steps, elim, already, isle) {
  const far = plateKey(RI_VENUE, 'approach', 'night'), beach = plateKey(RI_VENUE, 'skull-beach', 'night');
  if (!far || !beach) return false;
  steps.push({ k: 'scene', spot: 'approach', tod: 'night', plate: far, place: isle, time: 'That night', card: true, focus: [], bg: [], places: {}, wide: true });
  steps.push({ k: 'beat', text: `The Boat of Losers chugs out across the dark water toward Boney Island, ${elim} alone on the deck.`, focus: [], act: { kind: 'ride', ride: 'boat', riders: [elim] } });
  steps.push({ k: 'scene', spot: 'skull-beach', tod: 'night', plate: beach, place: 'Skull Beach', time: 'That night', card: false, cut: true, focus: [elim, ...already.slice(0, 4)], bg: [],
    places: placeScene(beach, [elim, ...already].slice(0, 9), []), act: { kind: 'arrive', who: [elim] } });
  return true;
}

// ══════════════════════════════════════════════════════════════════════
// EXILE ISLAND — who sends whom, the crossing, the search, the find
// ══════════════════════════════════════════════════════════════════════
const ITEMS = {
  idol: 'Hidden Immunity Idol', secondLife: 'Second Life Amulet', extraVote: 'Extra Vote', safetyNoPower: 'Safety Without Power', soleVote: 'Sole Vote',
  clue: 'Idol Clue', voteSteal: 'Vote Steal', legacy: 'Legacy Advantage', kip: 'Knowledge is Power', amulet: 'Amulet', 'idol-totem': 'Hidden Immunity Idol',
  beware: 'Beware Advantage', teamSwap: 'Team Swap', voteBlock: 'Vote Block',
};
export const itemName = t => ITEMS[t] || 'Advantage';

// The classic card's sentence for each find (vp-screens.js, the Exile Island block), word for word.
function foundText(name, f, P) {
  const s = P.sub === 'they';
  if (f?.type === 'idol') return `${name} searched the island — and found a Hidden Immunity Idol.`;
  if (f?.type === 'secondLife') return `${name} searched the island — and found the Second Life Amulet buried under a rock. If ${P.sub} ${s ? 'get' : 'gets'} voted out, ${P.sub} can fight to stay.`;
  if (f?.type === 'extraVote') return `${name} searched the island — and found an Extra Vote hidden in the shelter.`;
  if (f?.type === 'safetyNoPower') return `${name} searched the island — and found a Safety Without Power. An escape hatch from tribal — but it costs ${P.obj} ${P.posAdj} vote.`;
  if (f?.type === 'soleVote') return `${name} searched the island — and found a Sole Vote. When played, ${P.sub} cast${s ? '' : 's'} the only vote. Everyone else is silenced.`;
  if (f?.type === 'clue') return `${name} searched the island — and found a clue to a Hidden Immunity Idol back at camp.`;
  return `${name} searched the island thoroughly — but came up empty.`;
}
// Why the tribe picked them, from their stats (the classic card's reasons).
function tribeReason(name, S, P) {
  return S.intuition >= 7 ? `${name} is perceptive — sending ${P.obj} to exile keeps ${P.obj} away from camp politics.`
    : S.strategic >= 7 ? `${name} is a strategic player — isolating ${P.obj} before tribal disrupts ${P.posAdj} plans.`
    : S.physical >= 7 ? `${name} is a physical threat — exile can't weaken ${P.obj}, but it can isolate ${P.obj}.`
    : S.social >= 7 ? `${name} is well-connected — sending ${P.obj} away strips ${P.obj} of ${P.posAdj} influence before the vote.`
    : `${name} drew the short straw. The tribe didn't overthink it.`;
}

/**
 * d: { exiled, chooser, chooserTribe, chooserMembers, found, schoolyard, returns }
 * o: { host, setting, pronouns(name), stats(name), chooserReason(chooser, exiled) }
 */
export function tdExileScreen(ep, d, o = {}) {
  if (!d?.exiled) return null;
  const host = o.host || 'Chris';
  const name = d.exiled;
  const P = (o.pronouns && o.pronouns(name)) || { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' };
  const S = (o.stats && o.stats(name)) || {};
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  // 1. back at camp after the challenge: the call
  const chooserSide = d.chooserMembers?.length ? d.chooserMembers : (d.chooser ? [d.chooser] : []);
  const key = plateKey(venue, V.public, 'day');
  const focus = [...chooserSide.slice(0, 7), name];
  // the host comes out to the camp for this: on the plate's host mark if it has one, else beside them
  const places = placeScene(key, focus, [], { host });
  if (!places[host]) { Object.assign(places, placeScene(key, [...focus, host], [])); places[host] = { ...places[host], host: true }; }
  steps.push({ k: 'scene', spot: V.public, tod: 'day', plate: key, venue, place: placeName(V.public), time: '3:40 PM', card: true, focus, bg: [], places, team: d.chooserTribe || null });
  if (d.schoolyard) {
    say(`${name}, neither captain picked you. You're going to Exile Island.`, { focus: [name] });
    steps.push({ k: 'beat', text: `Neither captain picked ${name}. ${P.Sub} ${P.sub === 'they' ? 'are' : 'is'} sent to Exile Island alone.`, focus: [name], badge: { text: 'NOT CHOSEN', cls: 'danger' } });
  } else if (d.chooserMembers?.length) {
    say(`${d.chooserTribe}, you won. That means you get to send one person to Exile Island.`, { focus: d.chooserMembers.slice(0, 4) });
    steps.push({ k: 'beat', text: `${d.chooserTribe} huddle up to make the call.`, focus: d.chooserMembers.slice(0, 4), act: { kind: 'lean', who: d.chooserMembers.slice(0, 2) } });
    steps.push({ k: 'beat', text: tribeReason(name, S, P), focus: [name], badge: { text: `${String(d.chooserTribe).toUpperCase()}'S CALL`, cls: 'fire' }, side: [{ tab: 'log', text: `${d.chooserTribe} sends ${name} to Exile Island.` }] });
  } else if (d.chooser) {
    const reason = o.chooserReason ? o.chooserReason(d.chooser, name) : '';
    say(`${d.chooser}, immunity comes with a second prize. Pick someone to send to Exile Island.`, { focus: [d.chooser] });
    steps.push({ k: 'beat', text: `${d.chooser} won immunity — and used that power to send ${name} to Exile Island.${reason ? ' ' + reason : ''}`, focus: [d.chooser, name], act: { kind: 'shout', who: [d.chooser] }, badge: { text: 'PERSONAL CALL', cls: 'danger' }, side: [{ tab: 'log', text: `${d.chooser} sends ${name} to Exile Island.` }] });
  }
  steps.push({ k: 'title', kicker: 'Sent to Exile Island', name, faces: [name], tone: 'out' });
  // 2. the island: alone, the search, the find
  // Wawanakwa sends its exiles to Boney Island (Total Drama Island); elsewhere the exile beach
  // ...and Skull Rock, Boney Island's cliff, wherever a venue has no exile of its own (the user's frames)
  const skull = !['survival-island', 'carnival'].includes(venueOf(ep, o)) && plate('skull-rock', 'day');
  const boney = !skull && venueOf(ep, o) === 'hosted-camp' && plate('boney-island', 'day');
  const solx = venueOf(ep, o) === 'survival-island' && plate('soluna-exile', 'day');
  const stwx = venueOf(ep, o) === 'carnival' && plate('stawaki-exile', 'night');
  const exileSpot = skull ? 'skull-rock' : boney ? 'boney-island' : solx ? 'soluna-exile' : stwx ? 'stawaki-exile' : 'exile-beach',
    exilePlace = (skull || boney) && venueOf(ep, o) === 'hosted-camp' ? 'Boney Island' : 'Exile Island';
  const k2 = plate(exileSpot, 'day');
  steps.push({ k: 'scene', spot: exileSpot, tod: 'day', plate: k2, place: exilePlace, time: '4:30 PM', card: true, focus: [name], bg: [], places: placeScene(k2, [name], []), act: { kind: 'arrive', who: [name] } });
  steps.push({ k: 'beat', text: d.returns
    ? `${name} is sent to Exile Island. ${P.Sub} will search for advantages — but ${P.sub} ${P.sub === 'they' ? 'are' : 'is'} not safe. ${P.Sub} will return for Tribal Council.`
    : d.schoolyard ? `${name} is sent to Exile Island. ${P.Sub} will skip this episode's challenge and tribal — and return to the tribe that loses a member.`
    : `${name} is sent to Exile Island and will miss Tribal Council tonight.`, focus: [name], badge: { text: 'SENT TO EXILE', cls: 'danger' } });
  steps.push({ k: 'beat', text: `${name} searches the island.`, focus: [name], act: { kind: 'search', who: [name] }, tense: true });
  const f = d.found;
  steps.push({ k: 'found', who: name, item: f?.type || null, label: f?.type ? itemName(f.type) : 'Nothing', text: foundText(name, f, P),
    side: f?.type ? [{ tab: 'secrets', text: `${name} found ${f.type === 'clue' ? 'a clue to an idol' : 'the ' + itemName(f.type)} on Exile Island.` }] : [] });
  if (!d.returns) {
    const k3 = plate(exileSpot, 'night');
    steps.push({ k: 'scene', spot: exileSpot, tod: 'night', plate: k3, place: exilePlace, time: 'That night', card: false, focus: [name], bg: [], places: placeScene(k3, [name], []), acts: {} });
    steps.push({ k: 'beat', text: `${name} spends the night alone while the others go to Tribal Council.`, focus: [name], act: { kind: 'rest', who: [name] } });
  }
  return { id: d.returns ? 'exile-format' : 'exile-island', kind: 'island', venue: ISL, ep: ep.num, label: 'Exile Island', host, steps };
}

/** Why an immunity winner sent this one away (the classic card's reasons; bond and threat passed in). */
export const exileChooserReason = (chooser, exiled, bond, threat) => (bond(chooser, exiled) <= -1 ? `There's bad blood between them. This was personal.`
  : threat(exiled) >= 2.5 ? `${exiled} is too dangerous to leave at camp unchecked.` : `${chooser} wants ${exiled} isolated before the vote.`);

/** The episode's exile, from the twist or the format, in one shape. */
export function exileOf(ep, format) {
  if (format) {
    const x = ep.exileFormatData;
    return x?.exiled ? { exiled: x.exiled, chooser: x.chooser || null, chooserTribe: x.chooserTribe || null, chooserMembers: x.chooserMembers || null, found: x.exileFound || null, returns: true } : null;
  }
  const t = (ep.twists || []).find(x => x.type === 'exile-island' && x.exiled);
  return t ? { exiled: t.exiled, chooser: t.exileChooser || null, chooserTribe: t.exileChooserTribe || null, chooserMembers: t.exileChooserMembers || null, found: t.exileFound || null, schoolyard: !!t.schoolyardExile } : null;
}

// ══════════════════════════════════════════════════════════════════════
// THE REDEMPTION DUEL — on the venue's challenge zone (the user: "the duel can use the duel backgrounds
// we use for the tiebreaker"): the host's opener, what the challenge is, every round in the engine's own
// narration with the host between rounds and the breathing moments, the result, and after
// ══════════════════════════════════════════════════════════════════════
const POST_DUEL_EV = ['winner-relief', 'winner-hardened', 'winner-streak', 'winner-obsessed', 'loser-graceful', 'loser-bitter', 'loser-emotional', 'loser-neutral'];
export function tdRiDuelScreen(ep, o = {}) {
  const d = ep.riDuel;
  if (!d?.winner) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const who = d.duelists || [d.winner, d.loser].filter(Boolean);
  const spot = (TIEBREAK_SPOT[venue] || ['beach']).find(s => plateKey(venue, s, 'day') || plateKey(venue, s, 'night'));
  const key = spot ? (plateKey(venue, spot, 'day') || plateKey(venue, spot, 'night')) : riPlace(ep, o, 'day');
  const kVenue = spot ? venue : ISL;
  if (!key) return null;
  const at = TIEBREAK_AT[spot];
  const places = at ? Object.fromEntries(who.map((n, i) => [n, { u: at[i % at.length][0], v: at[i % at.length][1], s: .3, h: 30, crowd: true }])) : placeScene(key, who, [], { host });
  const steps = [];
  const say = (text, extra = {}) => { const t = cleanText(text); if (t) steps.push({ k: 'say', by: host, host: true, text: t.replace(/^"|"$/g, ''), ...extra }); };
  steps.push({ k: 'scene', spot: spot || 'duel', tod: /-night$/.test(key) ? 'night' : 'day', plate: key, place: 'The Duel', time: 'Redemption Island', card: true, focus: who, bg: [], places, host });
  say(d.host?.opener || `Welcome to the duel. One of you goes back to Redemption Island. The other one goes home for good.`);
  steps.push({ k: 'title', kicker: d.isThreeWay ? 'Three-way duel' : 'Redemption duel', name: d.challenge?.name || d.challengeLabel || 'The Duel', faces: who, vs: who.length === 2 });
  if (d.challenge?.desc || d.challengeDesc) say(d.challenge?.desc || d.challengeDesc);
  const streak = d.preStreakData || {};
  for (const n of who) if (streak[n] >= 1) steps.push({ k: 'beat', text: `${n} has won ${streak[n]} duel${streak[n] > 1 ? 's' : ''} already.`, focus: [n], side: [{ tab: 'residents', text: `${n}: ${streak[n]} duel win${streak[n] > 1 ? 's' : ''} before tonight` }] });
  const between = [d.host?.after1, d.host?.after2];
  (d.phases || []).forEach((p, i) => {
    steps.push({ k: 'beat', text: cleanText(p.narration || `${p.winner} takes ${p.name || `round ${i + 1}`}.`), focus: who, tense: i === (d.phases.length - 1),
      side: [{ tab: 'log', text: `${p.name || `Round ${i + 1}`}: ${p.winner}` }] });
    const m = (d.breathingMoments || [])[i];
    if (m?.text) steps.push({ k: 'beat', text: cleanText(m.text), focus: (m.players || [m.player, m.target]).filter(n => n && places[n]) });
    if (between[i]) say(between[i]);
  });
  if (d.tiebreaker) steps.push({ k: 'beat', text: cleanText(d.tiebreaker.text || d.tiebreaker.narration || `It comes down to a tiebreaker.`), focus: who, tense: true });
  say(d.host?.closer || `${d.winner} wins the duel.`, { focus: [d.winner] });
  steps.push({ k: 'title', kicker: 'Still alive', name: d.winner, faces: [d.winner], tone: 'fire' });
  if (d.loser) {
    steps.push({ k: 'say', by: host, host: true, text: `${d.loser}, you're out of the game. For good this time.`, focus: [d.loser] });
    steps.push({ k: 'out', who: d.loser, focus: [d.loser] });
  }
  for (const e of (ep.riLifeEvents || []).filter(e => POST_DUEL_EV.includes(e.type) && cleanText(e.text)))
    steps.push({ k: 'beat', text: cleanText(e.text), focus: (e.players || [e.player]).filter(n => n && places[n]) });
  return { id: 'ri-duel', kind: 'island', venue: kVenue, ep: ep.num, label: 'Redemption Duel', host, steps };
}
