// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/twist-screens.js — every other twist, and the merge, on the stepped stage
// ══════════════════════════════════════════════════════════════════════
//
// The engine's twist blocks (twists.js generateTwistScenes, stored on the episode as
// ep.twistScenes; vp-screens.js _buildPostTwistBlocks after the vote) are
// { type, label, scenes: [{ text, players, badge, tribeLabel, faceOff, juryHeader }] }. Each plays
// on the venue's set: the host announces it, a title card, every card in the engine's own words
// (a new tribe as its own card), and the two people it hit hardest react (lines/twist.js).
//
// The reaction is picked here, keyed on the episode, the twist and the two names, and asks only
// for facts that never change in a season (register, archetype, age, stats): the same words on
// every replay, and the season's line ledger is never touched by watching it.
import { POOLS } from '../td/script/lines/index.js';
import { fill } from '../td/script/write.js';
import { registerOf, ageOf } from '../td/script/facts.js';
import { matches } from '../script/pick.js';
import { stableRng } from '../script/rng.js';
import { pStats } from '../players.js';
import { players as _players } from '../core.js';
import { placeScene, plateKey, placeName, venueOf, VENUES, cleanText } from './steps.js';

export const ANNOUNCE = {
  'tribe-swap': `Drop your buffs. We're switching tribes.`,
  'tribe-dissolve': `Drop your buffs. One of your tribes is about to stop existing.`,
  'tribe-expansion': `Drop your buffs. You're getting a brand new tribe today.`,
  'producer-swap': `Production has made a decision. Don't bother arguing. It won't help.`,
  mutiny: `Anybody who wants out of their tribe, now's your chance. Step forward.`,
  'schoolyard-pick': `Captains, pick your teams. Whoever's left standing at the end has a problem.`,
  abduction: `Winners, you get to take somebody from the other tribe. Choose carefully.`,
  kidnapping: `Winners, you get to take somebody from the other tribe. Choose carefully.`,
  'shared-immunity': `Today, immunity comes with a plus-one.`,
  'double-safety': `Two of you are safe today. Everybody else, good luck.`,
  'hero-duel': `Two of you, one duel. The winner is safe.`,
  'guardian-angel': `Somebody out here is watching over one of you.`,
  'no-tribal': `Good news. Nobody goes home this episode. Don't get used to it.`,
  'no-challenge': `No challenge today. Nobody is safe. Nobody.`,
  'double-elim': `Two of you are going home this episode.`,
  'double-boot': `Two of you are going home this episode.`,
  'double-tribal': `Both tribes are voting. Two of you are going home.`,
  'multi-tribal': `Every tribe is voting. Plan accordingly.`,
  'penalty-vote': `There's a penalty on the table. Somebody is paying it.`,
  'rock-draw': `If it's a tie, we go straight to rocks. No revote.`,
  'open-vote': `No secret ballots. You vote out loud, in front of everyone.`,
  'cultural-reset': `Everything you think you know about your alliances? Prove it.`,
  'jury-elimination': `The jury gets a say this time.`,
  'elimination-swap': `Being voted out isn't the end for everyone today.`,
  'exile-duel': `Being voted out means a duel. Win it and you stay alive.`,
  'fire-making': `Being voted out isn't the end. There's a second life on the line.`,
  'tied-destinies': `Your fates are linked. If your partner goes home, so do you.`,
  'chain-of-command': `There's a chain of command now. Somebody's at the top of it.`,
  'emissary-vote': `An emissary is coming to your vote. They get a say.`,
  ambassadors: `Each tribe names an ambassador. One person's game ends without a vote.`,
  'returning-player': `Somebody you thought was gone is coming back.`,
  'spirit-island': `The ones you voted out haven't gone far.`,
  'second-chance': `One of the people you voted out is getting a second chance.`,
  'late-arrival': `You've got company. Somebody new is joining the game.`,
  'fan-vote-boot': `The fans have a say this time.`,
  'three-gifts': `A summit. Some of you are coming back with something.`,
  auction: `Welcome to the auction. Spend wisely. Or don't.`,
  journey: `A few of you are going on a journey. Not all of you will come back empty-handed.`,
  'idol-wager': `Anybody holding an idol, I've got an offer for you.`,
  'loved-ones': `I've got some people here who've missed you.`,
  'the-feast': `Today, you eat. All of you. Together.`,
  'merge-reward': `Welcome to your merge feast. Enjoy it. It won't last.`,
};
const GROUP = {
  'tribe-swap': 'shuffle', 'tribe-dissolve': 'shuffle', 'tribe-expansion': 'shuffle', 'producer-swap': 'shuffle', mutiny: 'shuffle',
  'schoolyard-pick': 'shuffle', abduction: 'shuffle', kidnapping: 'shuffle',
  'shared-immunity': 'safety', 'double-safety': 'safety', 'hero-duel': 'safety', 'guardian-angel': 'safety', 'no-tribal': 'safety',
  'no-challenge': 'danger', 'double-elim': 'danger', 'double-boot': 'danger', 'double-tribal': 'danger', 'multi-tribal': 'danger',
  'penalty-vote': 'danger', 'rock-draw': 'danger', 'open-vote': 'danger', 'cultural-reset': 'danger', 'jury-elimination': 'danger',
  'elimination-swap': 'danger', 'exile-duel': 'danger', 'fire-making': 'danger', 'tied-destinies': 'danger', 'chain-of-command': 'danger',
  'emissary-vote': 'danger', ambassadors: 'danger',
  'returning-player': 'return', 'spirit-island': 'return', 'second-chance': 'return', 'late-arrival': 'return', 'fan-vote-boot': 'return',
  'three-gifts': 'advantage', auction: 'advantage', journey: 'advantage', 'idol-wager': 'advantage',
  'loved-ones': 'feast', 'the-feast': 'feast', 'merge-reward': 'feast',
};

// what a reaction line may know: only what cannot change during a season
function staticFacts(a, b) {
  const band = n => { const y = ageOf(n); return y == null ? null : y < 20 ? 'teen' : y < 30 ? 'twenties' : y < 40 ? 'thirties' : 'older'; };
  let s = {}; try { s = pStats(a) || {}; } catch { s = {}; }
  const f = { register: registerOf(a), registerB: b ? registerOf(b) : null, arch: _players.find(p => p.name === a)?.archetype || null,
    strong: (s.physical ?? 5) >= 7, brainy: (s.mental ?? 5) >= 7, sly: (s.strategic ?? 5) >= 7, hot: (s.temperament ?? 5) <= 3, calm: (s.temperament ?? 5) >= 8 };
  const ab = band(a); if (ab) f.age = ab;
  return f;
}

/** Two people react to what just happened: a scripted exchange, the same on every replay. */
export function reactionLines(kind, a, b, key) {
  const pool = POOLS[kind] || [];
  const facts = staticFacts(a, b);
  const fits = pool.filter(e => matches(e.when, facts));
  if (!fits.length) return [];
  // a line written for how {a} talks wins when there is one, the way the camp picker leans
  const weighted = fits.flatMap(e => (e.when?.register ? [e, e, e] : [e]));
  const e = weighted[Math.floor(stableRng('td-react', key, kind, a, b || '')() * weighted.length)];
  return e.turns.map(t => ({ kind: t.conf ? 'conf' : t.beat ? 'beat' : 'say', by: t.by === 'a' ? a : t.by === 'b' ? b : null,
    text: fill(t.conf || t.beat || t.say, { a, b }, {}) }));
}
const toSteps = (lines, who) => lines.map(l => (l.kind === 'conf' ? { k: 'conf', by: l.by, text: l.text }
  : l.kind === 'beat' ? { k: 'beat', text: l.text, focus: who }
    : { k: 'say', by: l.by, text: l.text, focus: who, loud: /!/.test(l.text) && l.text.length < 70 }));

// everyone in it on the set, the host among them (on the plate's host mark when it has one)
function gather(venue, spot, tod, people, host) {
  const key = plateKey(venue, spot, tod) || plateKey(venue, VENUES[venue].public, tod);
  const shown = people.slice(0, 10);
  let places = placeScene(key, shown, [], { host });
  if (!places[host]) { places = placeScene(key, [...shown, host], []); places[host] = { ...places[host], host: true }; }
  return { key, places };
}

// the Summit's gifts, and where each pedestal stands in the tent's frame
const GIFT = { 1: { name: 'Survival Kit', u: .515 }, 2: { name: 'Idol Clue', u: .255 }, 3: { name: 'Immunity Totem', u: .79 } };

/** The twist screen: 'twist' (before the challenge) or 'post-twist' (after the vote). o: { host, setting }. */
export function tdTwistBlocksScreen(ep, blocks, o = {}, { post = false } = {}) {
  const list = (blocks || []).filter(b => b && (b.scenes || []).length);
  if (!list.length) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const steps = [];
  list.forEach((blk, bi) => {
    let named = [...new Set(blk.scenes.flatMap(s => s.players || []))].filter(Boolean);
    // a twist that names nobody (a feast, a reward for all) happens to everybody: the whole cast is on
    // the set, and the pair who react are one from each of the first two tribes
    const tribes = (ep.gsSnapshot?.tribes || []).map(t => (t.members || []).filter(Boolean)).filter(t => t.length);
    if (!named.length) named = [...new Set(tribes.length > 1 ? tribes.flat() : (ep.gsSnapshot?.activePlayers || tribes.flat()))];
    // the Summit has its own tent at Stawaki (the user's frame): the three gifts on their pedestals, each
    // nominee walking up to the one they take, before the camp hears about it
    const gifts = blk.type === 'three-gifts' ? ((ep.twists || []).find(t => t?.type === 'three-gifts')?.giftResults || []) : [];
    const tent = gifts.length && plateKey(venue, 'summit', 'day');
    if (tent) {
      const who = gifts.map(g => g.player);
      // on the ring between the pedestals, sized to them; the host off to the side
      const gaps = [.385, .655, .13, .9];
      const tp = Object.fromEntries(who.map((n, i) => [n, { u: gaps[i % gaps.length], v: .745, s: .18, h: 22 }]));
      tp[host] = { u: .07, v: .745, s: .18, h: 22, host: true };
      steps.push({ k: 'scene', spot: 'summit', tod: 'day', plate: tent, place: 'The Summit', time: '9:00 AM', card: bi === 0, focus: who, bg: [], places: tp, host, wide: true });
      steps.push({ k: 'say', by: host, host: true, text: `Welcome to the Summit. One of you from each tribe, and three gifts. You each take one back to camp.` });
      steps.push({ k: 'say', by: host, host: true, text: `Gift one: a survival kit for your whole tribe. Gift two: a clue to a hidden immunity idol. Gift three: an Immunity Totem, for you and nobody else.` });
      steps.push({ k: 'title', kicker: 'Twist', name: blk.label || 'The Summit', faces: who });
      const taken = {};
      gifts.forEach(g => {
        const G = GIFT[g.gift] || GIFT[1], k = (taken[g.gift] = (taken[g.gift] || 0) + 1) - 1;
        steps.push({ k: 'beat', text: `${g.player} walks up to gift ${g.gift} and takes the ${G.name}.`, focus: [g.player],
          act: { kind: 'pick', who: [g.player], tu: G.u + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * .07, label: G.name }, side: [{ tab: 'log', text: `${g.player} (${g.tribe}): ${G.name}` }] });
      });
    }
    const spot = post ? 'ceremony' : V.public, tod = post ? 'night' : 'day';
    const { key, places } = gather(venue, spot, tod, named, host);
    steps.push({ k: 'scene', spot, tod, plate: key, place: post ? V.ceremony : placeName(V.public),
      time: post ? '9:00 PM' : tent ? '11:00 AM' : '10:00 AM', card: bi === 0 && !tent, focus: [], bg: [], places, host });
    if (!post && !tent) steps.push({ k: 'say', by: host, host: true, text: ANNOUNCE[blk.type] || `Listen up, everybody. Things are about to change.` });
    if (!tent) steps.push({ k: 'title', kicker: post ? 'After the vote' : 'Twist', name: blk.label || 'Twist', faces: named.slice(0, 6) });
    for (const s of blk.scenes) {
      const who = (s.players || []).filter(n => places[n]);
      if (s.tribeLabel) {
        steps.push({ k: 'title', kicker: 'New tribe', name: s.tribeLabel, faces: (s.players || []).slice(0, 8),
          side: [{ tab: 'log', text: `${s.tribeLabel}: ${(s.players || []).join(', ')}` }] });
      } else if (s.faceOff && who.length === 2) {
        steps.push({ k: 'title', kicker: 'Face-off', name: `${who[0]} vs ${who[1]}`, faces: who, vs: true });
      } else if (s.juryHeader) {
        steps.push({ k: 'title', kicker: 'The jury', name: 'The jury', faces: (s.players || []).slice(0, 8) });
      } else if (cleanText(s.text)) {
        steps.push({ k: 'beat', text: cleanText(s.text), focus: who.length && who.length < named.length ? who : [],
          badge: s.badge ? { text: String(s.badge).toUpperCase(), cls: ['bad', 'red'].includes(s.badgeClass) ? 'danger' : 'gold' } : null });
      }
    }
    // the twist as the people in it talk it through (td/story/twist.js): where they are (the twist's
    // own set, or back at their camp), then every line
    const told = !post ? ep.twistStory?.[blk.type] : null;
    for (const sc of told || []) {
      const g = gather(venue, V.public, 'day', sc.players, host);
      steps.push({ k: 'scene', spot: V.public, tod: 'day', plate: g.key, place: sc.at === 'camp' ? `${sc.camp || 'Back'} camp` : (blk.label || 'The twist'),
        time: sc.at === 'camp' ? '2:00 PM' : '11:00 AM', card: false, focus: sc.players.slice(0, 4), bg: [], places: g.places, host });
      for (const l of sc.lines) {
        const text = cleanText(l.text);
        if (!text) continue;
        steps.push(l.kind === 'beat' ? { k: 'beat', text, focus: sc.players.slice(0, 4) } : l.kind === 'conf' ? { k: 'conf', by: l.by, text } : { k: 'say', by: l.by, text, focus: sc.players.slice(0, 4) });
      }
    }
    // the two it hit hardest: anyone named alone on a card first, then the first two named
    if (!post && !(told || []).length) {
      const solo = blk.scenes.filter(s => !s.tribeLabel && (s.players || []).length === 1).map(s => s.players[0]);
      const nobody = !blk.scenes.some(s => (s.players || []).length);
      const r = stableRng('td-react-pair', ep.num, blk.type);
      const across = !nobody ? [] : tribes.length > 1 ? [tribes[0][Math.floor(r() * tribes[0].length)], tribes[1][Math.floor(r() * tribes[1].length)]]
        : [...named].sort((x, y) => x.localeCompare(y)).map(n => [r(), n]).sort((x, y) => x[0] - y[0]).map(x => x[1]).slice(0, 2);
      const pair = [...new Set([...solo, ...across, ...named])].filter(n => places[n] && n !== host).slice(0, 2);
      if (pair.length === 2) steps.push(...toSteps(reactionLines(`twist.react.${GROUP[blk.type] || 'other'}`, pair[0], pair[1], `${ep.num}|${blk.type}`), pair));
    }
  });
  return { id: post ? 'post-twist' : 'twist', kind: 'twist', venue, ep: ep.num, label: list.map(b => b.label).join(' · '), host, steps };
}

/**
 * The merge. m: { name, participants, alliances: [{ name, members }], bottom: [names] }, read from the
 * episode's own snapshot by vp-screens.js (the same reading the classic merge screen makes).
 */
export function tdMergeScreen(ep, m, o = {}) {
  if (!m?.participants?.length) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const steps = [];
  const { key, places } = gather(venue, V.public, 'day', m.participants, host);
  steps.push({ k: 'scene', spot: V.public, tod: 'day', plate: key, place: placeName(V.public), time: '9:00 AM', card: true, focus: [], bg: [], places, host });
  steps.push({ k: 'say', by: host, host: true, text: `Drop your buffs. From now on, you're one tribe.` });
  steps.push({ k: 'title', kicker: 'The merge', name: m.name || 'One tribe', faces: m.participants.slice(0, 8),
    side: [{ tab: 'log', text: `${m.participants.length} players: ${m.participants.join(', ')}` },
      ...(m.alliances || []).map(a => ({ tab: 'allies', name: a.name, who: a.members })),
      ...((m.bottom || []).length ? [{ tab: 'secrets', text: `On the bottom, with no alliance: ${m.bottom.join(', ')}` }] : [])] });
  steps.push({ k: 'say', by: host, host: true, text: `${m.participants.length} of you left. From here on, it's every player for themselves.` });
  const top = (m.alliances || [])[0];
  const pairTop = (top?.members || []).filter(n => places[n]).slice(0, 2);
  if (pairTop.length === 2) steps.push(...toSteps(reactionLines('twist.react.merge', pairTop[0], pairTop[1], `${ep.num}|merge`), pairTop));
  const pairLow = (m.bottom || []).filter(n => places[n] && !pairTop.includes(n)).slice(0, 2);
  if (pairLow.length === 2) steps.push(...toSteps(reactionLines('twist.react.bottom', pairLow[0], pairLow[1], `${ep.num}|bottom`), pairLow));
  // the merge feast, as the people at it talk (td/story/twist.js feast)
  for (const sc of ep.twistStory?.['merge-reward'] || []) {
    steps.push({ k: 'scene', spot: V.public, tod: 'night', plate: gather(venue, V.public, 'night', sc.players, host).key || key, place: 'The Merge Feast', time: '7:00 PM', card: false, focus: sc.players.slice(0, 4), bg: [], places, host });
    for (const l of sc.lines) {
      const text = cleanText(l.text);
      if (!text) continue;
      steps.push(l.kind === 'beat' ? { k: 'beat', text, focus: sc.players.slice(0, 4) } : l.kind === 'conf' ? { k: 'conf', by: l.by, text } : { k: 'say', by: l.by, text, focus: sc.players.slice(0, 4) });
    }
  }
  return { id: 'merge', kind: 'twist', venue, ep: ep.num, label: 'The Merge', host, steps };
}

/**
 * The twists whose classic pages are hand-built rather than drawn from twist cards: each played on
 * the venue's stage from the record the engine wrote. Returns a stepped screen, 'skip' for a classic
 * page this one already covers, or null (the classic page plays).
 */
export function tdMiscTwistScreen(ep, id, o = {}) {
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const block = (type, label, scenes, opts) => tdTwistBlocksScreen(ep, [{ type, label, scenes }], o, opts);
  const active = ep.gsSnapshot?.activePlayers || [];
  // First Impressions and the auction play as dialogue (td/story/twist.js); the auction's three classic
  // pages become one stepped screen
  if (id === 'first-impressions' && ep.tdFirstImp?.length) return tdFirstImpressionsScreen(ep, o);
  if (id === 'auction-title' && ep.tdAuction?.lots?.length) return tdAuctionScreen(ep, o);
  if (/^auction-(floor|results)$/.test(id) && ep.tdAuction?.lots?.length) return 'skip';
  if (id === 'feast' && (ep.feastEvents || []).length) {
    const merge = (ep.twists || []).some(t => t.type === 'merge-reward' || t.catalogId === 'merge-reward');
    return block('the-feast', merge ? 'The Merge Feast' : 'The Feast', ep.feastEvents.map(e => ({ text: e.text, players: e.players || [], badge: e.badgeText, badgeClass: e.badgeClass })));
  }
  if (id === 'no-tribal' && ep.noTribal) return block('no-tribal', 'No Tribal Council', [{ text: `No votes, no blindsides, no torches. Everyone is safe tonight. For now.`, players: active }]);
  if (id === 'fan-vote-return' && ep.fanVoteReturnee) {
    const r = ep.fanVoteReturnee;
    return block('returning-player', 'The Fans Have Spoken', [{ text: `Last night the fans voted. One eliminated player has earned the right to come back.`, players: [] },
      { text: `${r} walks back into the game.`, players: [r], badge: 'RETURNING', badgeClass: 'gold' }]);
  }
  if (id === 'schoolyard-pick' && ep.schoolyardPick?.picks?.length) {
    const sp = ep.schoolyardPick;
    const scenes = [{ text: `The captains: ${(sp.captains || []).join(' and ')}. They pick their tribes one name at a time.`, players: sp.captains || [] }];
    for (const p of sp.picks) scenes.push({ text: `${p.captain} picks ${p.picked}.`, players: [p.captain, p.picked] });
    if (sp.lastPicked) scenes.push({ text: `${sp.lastPicked} is the last one standing. Nobody picked ${sp.lastPicked}.`, players: [sp.lastPicked], badge: 'LAST PICK', badgeClass: 'bad' });
    if (sp.exiled) scenes.push({ text: `${sp.exiled} is sent to Exile.`, players: [sp.exiled], badge: 'EXILED', badgeClass: 'bad' });
    for (const t of sp.newTribes || []) if (t?.members?.length) scenes.push({ tribeLabel: t.name, players: t.members });
    return block('schoolyard-pick', 'Schoolyard Pick', scenes);
  }
  if (id === 'disadvantage-trial') {
    const tw = (ep.twists || []).find(t => t.type === 'disadvantage-vote');
    const tr = tw?.trial || ep.disadvantageTrial;
    if (!tr) return null;
    const people = [...new Set([...(tr.order || []), ...Object.keys(tr.votes || {})])];
    const { key, places } = gather(venue, 'ceremony', 'night', people, host);
    const steps = [{ k: 'scene', spot: 'ceremony', tod: 'night', plate: key, place: 'The Disadvantage Trial', time: 'Before the challenge', card: true, focus: [], bg: [], places, host, ceremony: true }];
    steps.push({ k: 'say', by: host, host: true, text: `Before the challenge, you're voting one of you a handicap. Make your case: why it shouldn't be you, or who it should be.` });
    steps.push({ k: 'title', kicker: 'Twist', name: 'The Disadvantage Trial', faces: people.slice(0, 8) });
    for (const b of tr.debate || []) steps.push({ k: 'say', by: b.speaker, text: cleanText(b.text), focus: [b.speaker, b.target].filter((n, i, a) => n && places[n] && a.indexOf(n) === i), loud: b.type === 'accuse' || b.type === 'dispute' });
    steps.push({ k: 'say', by: host, host: true, text: `Time to vote.` });
    for (const [v, t] of Object.entries(tr.votes || {})) steps.push({ k: 'beat', text: `${v} votes ${t}.`, focus: [v].filter(n => places[n]), side: [{ tab: 'tally', voter: v, target: t }] });
    steps.push({ k: 'title', kicker: 'The handicap goes to', name: tr.target, faces: [tr.target], tone: 'out' });
    if (tr.flipped) steps.push({ k: 'beat', text: `The handicap turned the challenge: ${tr.flipped.from} lost immunity to ${tr.flipped.to}.`, focus: [tr.flipped.from, tr.flipped.to].filter(n => places[n]) });
    else steps.push({ k: 'beat', text: `${tr.target} runs the challenge with a handicap.`, focus: [tr.target].filter(n => places[n]) });
    return { id: 'disadvantage-trial', kind: 'tribal', venue, ep: ep.num, label: 'Disadvantage Trial', host, steps };
  }
  if (/^coc-(chain|summary)$/.test(id) && ep.chainOfCommand) return 'skip';
  if (id === 'coc-briefing' && ep.chainOfCommand?.chain?.length) {
    const coc = ep.chainOfCommand;
    const people = [...new Set([coc.immunityWinner, ...coc.chain.map(l => l.player)].filter(Boolean))];
    const { key, places } = gather(venue, 'ceremony', 'night', people, host);
    const steps = [{ k: 'scene', spot: 'ceremony', tod: 'night', plate: key, place: V.ceremony, time: '9:00 PM', card: true, focus: [], bg: [], places, host, ceremony: true }];
    steps.push({ k: 'say', by: host, host: true, text: `Tonight there's no vote. ${coc.immunityWinner} won immunity, so ${coc.immunityWinner} picks who is safe next. Whoever is picked picks the next one. The last one standing goes home.`, focus: [coc.immunityWinner] });
    steps.push({ k: 'title', kicker: 'Twist', name: 'Chain of Command', faces: people.slice(0, 8), tone: 'fire' });
    for (const l of coc.chain) {
      if (l.type === 'pick') {
        if (l.hesitation && l.hesitationText) steps.push({ k: 'beat', text: cleanText(l.hesitationText), focus: [l.pickedBy].filter(n => places[n]), tense: true });
        steps.push({ k: 'beat', text: `${l.pickedBy} picks ${l.player}. ${l.player} is safe.`, focus: [l.pickedBy, l.player].filter(n => places[n]), side: [{ tab: 'room', text: `#${l.position}: ${l.pickedBy} picks ${l.player}` }] });
      } else if (l.type === 'eliminated') {
        steps.push({ k: 'say', by: host, host: true, text: `${l.player}. Nobody picked you. You're going home.`, focus: [l.player], tense: true });
        steps.push({ k: 'out', who: l.player, focus: [l.player] });
      }
    }
    return { id: 'coc', kind: 'tribal', venue, ep: ep.num, label: 'Chain of Command', host, steps };
  }
  return null;
}

// ── First Impressions and the auction, as dialogue (td/story/twist.js writes them at sim time) ──
// Lines are { kind: 'say' | 'conf' | 'beat', by, text }; the host's lines are by the host's name.
function talkSteps(lines, host, focus = []) {
  const out = [];
  for (const l of lines || []) {
    const text = cleanText(l.text);
    if (!text) continue;
    if (l.kind === 'beat') out.push({ k: 'beat', text, focus });
    else if (l.kind === 'conf') out.push({ k: 'conf', by: l.by, text });
    else if (l.by === host) out.push({ k: 'say', by: host, host: true, text });
    else out.push({ k: 'say', by: l.by, text, focus: [l.by] });
  }
  return out;
}

/** First Impressions: each tribe's gut vote, as the people in it talk it through. */
export function tdFirstImpressionsScreen(ep, o = {}) {
  const fi = ep.tdFirstImp;
  if (!fi?.length) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const steps = [];
  fi.forEach((r, i) => {
    const people = [...new Set([...r.booth.map(b => b.voter), r.boot])];
    const pub = gather(venue, V.public, 'day', people, host);
    steps.push({ k: 'scene', spot: V.public, tod: 'day', plate: pub.key, place: `${r.tribe} camp`, time: 'Day 1, 4:00 PM', card: i === 0, focus: [], bg: [], places: pub.places, host });
    if (i === 0) steps.push({ k: 'title', kicker: 'Twist', name: 'First Impressions', faces: people.slice(0, 8) });
    steps.push(...talkSteps(r.huddle, host, people.slice(0, 4)));
    const cer = gather(venue, 'ceremony', 'night', people, host);
    steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate: cer.key, place: V.ceremony, time: 'Day 1, 9:00 PM', card: true, focus: [], bg: [], places: cer.places, host, ceremony: true });
    steps.push({ k: 'say', by: host, host: true, text: `${r.tribe}, you've known each other for one day. No alliances, no history, nothing to go on but your gut. Vote out the person you trust the least.` });
    for (const b of r.booth) {
      const s = talkSteps(b.lines, host);
      if (!s.length) s.push({ k: 'conf', by: b.voter, text: `${b.voted}.` });
      s[0] = { ...s[0], side: [{ tab: 'tally', voter: b.voter, target: b.voted }] };
      steps.push(...s);
    }
    steps.push({ k: 'title', kicker: `${r.tribe} votes out`, name: r.boot, faces: [r.boot], tone: 'out' });
    steps.push(...talkSteps(r.read, host, [r.boot]));
    steps.push({ k: 'title', kicker: 'Twist', name: `${r.boot} joins ${r.sentTo}`, faces: [r.boot], tone: 'fire' });
    steps.push(...talkSteps(r.twist, host, [r.boot]));
    if (r.welcome?.length) {
      const them = [...new Set([r.boot, ...r.welcome.map(l => l.by).filter(Boolean)])];
      const camp = gather(venue, V.public, 'night', them, host);
      steps.push({ k: 'scene', spot: V.public, tod: 'night', plate: camp.key, place: `${r.sentTo} camp`, time: 'Later that night', card: false, focus: [r.boot], bg: [], places: camp.places, host });
      steps.push(...talkSteps(r.welcome, host, them.slice(0, 3)));
    }
    steps.push(...talkSteps(r.after, host));
  });
  return { id: 'first-impressions', kind: 'twist', venue, ep: ep.num, label: 'First Impressions', host, steps };
}

/** The auction: every lot put up, bid on, sold and opened, in the bidders' own words. */
export function tdAuctionScreen(ep, o = {}) {
  const A = ep.tdAuction;
  if (!A?.lots?.length) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const people = [...new Set([...A.lots.flatMap(l => l.lines.map(x => x.by)), ...A.open.map(x => x.by)].filter(n => n && n !== host))];
  const { key, places } = gather(venue, V.public, 'day', people, host);
  const steps = [{ k: 'scene', spot: V.public, tod: 'day', plate: key, place: 'The Auction', time: '10:00 AM', card: true, focus: [], bg: [], places, host }];
  steps.push({ k: 'title', kicker: 'Twist', name: 'The Auction', faces: people.slice(0, 8) });
  steps.push(...talkSteps(A.open, host, people.slice(0, 2)));
  for (const lot of A.lots) {
    steps.push({ k: 'title', kicker: `Lot ${lot.order}`, name: lot.title, faces: lot.winner ? [lot.winner] : [] });
    const s = talkSteps(lot.lines, host);
    if (s.length && lot.winner) s[s.length - 1] = { ...s[s.length - 1], side: [{ tab: 'log', text: `Lot ${lot.order}: ${lot.winner}, $${lot.finalBid}` }] };
    steps.push(...s);
  }
  steps.push(...talkSteps(A.close, host));
  return { id: 'auction', kind: 'twist', venue, ep: ep.num, label: 'The Auction', host, steps };
}
