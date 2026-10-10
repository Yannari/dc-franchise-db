// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/returns.js — the return challenge, the emissary, and Tied Destinies on the stepped stage
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-09): "RI return and the emissary's choice don't have a viewer", "Tied Destinies
// announcement too". PURE, like twists.js: an episode record in, a screen of steps out, on the
// venue's own sets.
//
// - THE RETURN: the voted-out who are still alive (Redemption's champion, Rescue Island's castaways,
//   the Edge of Extinction) compete for one way back in, on the venue's challenge arena: each stage of
//   the challenge with its own motion and talk (contest.js), who drops out at each, and the one who
//   walks back into the game.
// - THE EMISSARY: a player from the winning team visits the losers' camp before their vote (the
//   pitches, the deals, what they notice), then, after the vote, names a second person to go home.
// - TIED DESTINIES: the host pairs everyone up; if one of a pair is voted out, both go.
//
// RENDER, NEVER INVENT: who competes, who drops out, who wins, who pitches what, who the emissary
// picks and why, and every pairing and how each one took it, are the engine's own record. The words
// here are the host's, the staging, and what each person says to that in their own voice.
import { placeScene, plateKey, placeName, venueOf, VENUES, cleanText, TIEBREAK_SPOT, campSlot, teamSpot } from './steps.js';
import { arenaPlaces, contestStyle, contestTalk, roundTaken, contestResult } from './contest.js';
import { familyOf } from '../td/story/voice-family.js';
import { emissaryDay } from './emissary.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const fam = n => { try { return familyOf(n); } catch { return 'plain'; } };
const V = (n, o, ...k) => pickBy(o[fam(n)] || o.any, n, ...k);
// a voiced line nobody on this screen has said yet: the speaker's family first, then the general ones
const freshV = (used, n, o, ...k) => { const own = [...(o[fam(n)] || []), ...(o.any || [])].filter(t => !used.has(t)); const t = own.length ? pickBy(own, n, ...k) : V(n, o, ...k); used.add(t); return t; };
const listOf = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };

// An engine sentence with quoted speech in it: the staging as a beat, each quote said by the last
// person named before it (among `who`)
function playText(steps, text, who, focus) {
  const raw = String(text || '');
  let last = who[0];
  for (const m of raw.matchAll(/"([^"]+)"|([^"]+)/g)) {
    if (m[2] != null) {
      for (const n of who) if (m[2].includes(n)) last = n;
      const t = cleanText(m[2].trim());
      if (t && !/^[\s.,;:—-]+$/.test(t)) steps.push({ k: 'beat', text: t, focus });
    } else {
      const q = cleanText(m[1].trim());
      if (q && q.split(/\s+/).length >= 2) steps.push({ k: 'say', by: last, text: q, focus, loud: /!/.test(q) && q.length < 70 });
    }
  }
}

// the arena a venue settles things on (the duel's and the tiebreaker's), by day
function arenaOf(venue) {
  const spot = (TIEBREAK_SPOT[venue] || ['beach']).find(s => plateKey(venue, s, 'day') || plateKey(venue, s, 'night'));
  return spot ? { spot, key: plateKey(venue, spot, 'day') || plateKey(venue, spot, 'night') } : null;
}

// ══════════════════════════════════════════════════════════════════════
// THE RETURN
// ══════════════════════════════════════════════════════════════════════
export function hasReturn(ep) { return !!(ep.rescueReturn?.phases?.length || ep.riReentry?.winner || ep.rescueReturnChallenge?.winner); }
export function tdReturnScreen(ep, o = {}) {
  if (!hasReturn(ep)) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const A = arenaOf(venue);
  if (!A) return null;
  const bond = bondOf(ep);
  const rich = ep.rescueReturn?.phases?.length ? ep.rescueReturn : null;
  const ri = ep.riReentry?.winner ? ep.riReentry : null;
  const rc = ep.rescueReturnChallenge?.winner ? ep.rescueReturnChallenge : null;
  const winners = rich ? ((rich.winners || []).length ? rich.winners : [rich.winner]) : [(ri || rc).winner];
  const winner = winners[0];
  const field = rich ? (rich.competitors || [winner]) : (ri?.duelists || [winner, ...((ri || rc).losers || [])]);
  const losers = field.filter(n => !winners.includes(n));
  const label = rich ? (rich.challengeLabel || 'The Return') : ((ri || rc).challengeLabel || 'The Return');
  const style = contestStyle(ri?.challengeType || label, ri?.challenge?.desc || '');
  const places = arenaPlaces(A.spot, field) || placeScene(A.key, field.slice(0, 9), [], { host });
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });

  steps.push({ k: 'scene', spot: A.spot, tod: 'day', plate: A.key, place: 'The Return', time: 'Day', card: true, focus: field, bg: [], places, host });
  say(field.length > 1 ? `Every one of you was voted out of this game. ${winners.length > 1 ? `${winners.length === 2 ? 'Two' : winners.length} of you` : 'One of you'} gets to walk back in. The rest of you are done for good.` : `${winner}, you've earned your way back.`);
  steps.push({ k: 'title', kicker: 'The return challenge', name: label, faces: field.slice(0, 8), vs: field.length === 2 });
  if (ri?.challenge?.desc) say(ri.challenge.desc);
  // what each of them is fighting for, in their own voice
  for (const n of field.slice(0, 4)) steps.push({ k: 'say', by: n, focus: [n], text: V(n, {
    loud: ['I did not survive out there just to lose today!', "Let's go! I've been waiting for this!"],
    sharp: ['Every person who wrote my name down is about to regret it.', "They should have made sure I stayed gone."],
    soft: ["I want this so badly. I'm not ready to go home.", "I've thought about this day every day since the vote."],
    dry: ["Okay. Let's get this over with, preferably with me winning.", "I've been training for this for days. Let's see if it shows."],
    odd: ["I've never been more ready for anything in my life. Except maybe lunch.", 'Back in the game, here I come! Probably!'],
    any: ["I'm getting back in that game.", 'This is my second chance. I am not wasting it.'],
  }, 'want', ep.num) });

  if (rich) {
    // Rescue / the Edge: stage by stage, people drop out until only the returners are left
    let left = [...field];
    rich.phases.forEach((ph, i) => {
      const fell = (ph.eliminated || []).filter(n => left.includes(n));
      const ordered = Object.keys(ph.scores || {}).filter(n => left.includes(n)).sort((a, b) => ph.scores[b] - ph.scores[a]);
      steps.push({ k: 'title', kicker: `Stage ${i + 1}`, name: ph.name || `Stage ${i + 1}`, faces: left.slice(0, 8) });
      const st = contestStyle(ph.stat ? `${ph.name} ${ph.blurb || ''}` : label);
      const act = { kind: 'contest', style: st, who: left, lead: ordered[0] };
      if (ph.blurb) steps.push({ k: 'beat', text: cleanText(ph.blurb), focus: left, act });
      if (ordered.length >= 2) for (const t of contestTalk({ ahead: ordered[0], behind: ordered[ordered.length - 1], style: st, bond, key: `rr|${ep.num}|${i}`, focus: left })) steps.push({ ...t, act });
      for (const e of ph.events || []) playText(steps, e.text, left, left);
      if (fell.length) {
        steps.push({ k: 'beat', text: `${listOf(fell)} ${fell.length > 1 ? 'are' : 'is'} out of the challenge.`, focus: fell, act: { kind: 'cry', who: fell }, side: [{ tab: 'log', text: `Stage ${i + 1}: ${listOf(fell)} out` }] });
        left = left.filter(n => !fell.includes(n));
      }
    });
  } else if (ri?.phases?.length) {
    // Redemption's return: the engine's rounds, its own account of each
    ri.phases.forEach((p, i) => {
      const last = i === ri.phases.length - 1;
      steps.push({ k: 'title', kicker: last ? 'Final round' : `Round ${i + 1}`, name: p.name || (last ? 'Winner takes all' : 'The return challenge'), faces: field.slice(0, 8) });
      const behind = field.filter(n => n !== p.winner).sort((a, b) => (p.scores?.[a] || 0) - (p.scores?.[b] || 0))[0];
      const act = { kind: 'contest', style, who: field, lead: p.winner };
      for (const t of contestTalk({ ahead: p.winner, behind, style, bond, key: `ri|${ep.num}|${i}`, focus: field })) steps.push({ ...t, act });
      if (p.narration) steps.push({ k: 'beat', text: cleanText(p.narration), focus: field, act, side: [{ tab: 'log', text: `${p.name || `Round ${i + 1}`}: ${p.winner}` }] });
      if (!last) steps.push(...roundTaken(p.winner, behind, `ri|${ep.num}|${i}`, field));
    });
  } else {
    const act = { kind: 'contest', style, who: field, lead: winner };
    steps.push({ k: 'beat', text: `${listOf(field)} go all out.`, focus: field, act, tense: true });
    if (losers[0]) for (const t of contestTalk({ ahead: winner, behind: losers[0], style, bond, key: `rc|${ep.num}`, focus: field })) steps.push({ ...t, act });
  }

  // the result: who walks back in, and how the rest take it
  say(winners.length > 1 ? `${listOf(winners)}, you're back in the game!` : `${winner}, you're back in the game!`, { focus: winners });
  steps.push(...contestResult(winner, losers[0] || null, { bond, key: `ret|${ep.num}`, focus: field }));
  for (const w of winners.slice(1)) steps.push({ k: 'say', by: w, focus: [w], loud: true, text: V(w, { any: ["We're both back! Can you believe it?", "I'm back in. I'm actually back in."] }, 'w2', ep.num) });
  steps.push({ k: 'title', kicker: 'Back in the game', name: listOf(winners), faces: winners, tone: 'fire' });
  if (losers.length) {
    say(losers.length > 1 ? `${listOf(losers)}, that's the end of the road. For good.` : `${losers[0]}, that's the end of the road. For good.`, { focus: losers });
    for (const n of losers.slice(1, 3)) steps.push({ k: 'say', by: n, focus: [n], text: V(n, {
      loud: ['Unbelievable. Unbelievable!'], sharp: ["Fine. Enjoy it. It won't last."], soft: ["I gave it everything. I'm proud of that, at least."], dry: ['Well. That was a lot of effort for a trip home.'],
      any: ["That's it, then. I'm done.", 'Good luck in there. You earned it.'],
    }, 'out', ep.num) });
    steps.push({ k: 'out', who: losers[0], focus: losers });
  }
  return { id: 'return', kind: 'island', venue, ep: ep.num, label: 'The Return', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE EMISSARY
// ══════════════════════════════════════════════════════════════════════
// the losers' camp, as the emissary walks into it
function campPlate(ep, o, team) {
  const venue = venueOf(ep, o), pub = VENUES[venue]?.public || 'communal-grounds';
  const slot = team ? campSlot(ep, team, venue) : null;
  const spot = teamSpot(venue, pub, slot);
  return { venue, spot: pub, key: plateKey(venue, spot, 'day') || plateKey(venue, pub, 'day') };
}
export function tdEmissaryScoutScreen(ep, o = {}) {
  const E = ep.emissary;
  if (!E?.name) return null;
  const host = o.host || 'Chris';
  const C = campPlate(ep, o, E.targetTribe);
  if (!C.key) return null;
  const em = E.name;
  const hosts = (ep.tribesAtStart || []).find(t => t.name === E.targetTribe)?.members || [];
  const evs = ep.emissaryScoutEvents || [];
  const near = [...new Set([...evs.flatMap(e => e.players || []), ...hosts])].filter(n => n !== em).slice(0, 7);
  const steps = [];
  steps.push({ k: 'scene', spot: C.spot, tod: 'day', plate: C.key, place: `${E.targetTribe} Camp`, time: 'Afternoon', card: true, focus: [em], bg: [], places: placeScene(C.key, [em, ...near], []), act: { kind: 'arrive', who: [em] } });
  steps.push({ k: 'title', kicker: 'The emissary', name: em, faces: [em] });
  steps.push({ k: 'beat', text: `${E.tribe} won, and sent ${em} to ${E.targetTribe}'s camp. Tonight ${em} watches their vote, and then picks a second person to go home.`, focus: [em] });
  // the day itself, as conversations (emissary.js): the camp going quiet, each pitch in private, the
  // target noticing, the one nobody sits with, the deal by the water, the emissary's read before the vote
  steps.push(...emissaryDay({ ep, em, hosts: [...new Set([...hosts, ...near])], bond: bondOf(ep) }));
  return { id: 'emissary-scouting', kind: 'camp', venue: C.venue, ep: ep.num, label: 'The Emissary', host, steps, team: E.targetTribe };
}
export function tdEmissaryChoiceScreen(ep, o = {}) {
  const E = ep.emissary, P = ep.emissaryPick;
  if (!E?.name || !P?.name) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const key = plateKey(venue, 'ceremony', 'night') || plateKey(venue, VENUES[venue]?.public || 'communal-grounds', 'night');
  if (!key) return null;
  const em = E.name, pick = P.name;
  const tribal = (ep.tribalPlayers || []).filter(n => n !== ep.eliminated);
  const places = placeScene(key, [em, pick, ...tribal.filter(n => n !== pick)].slice(0, 9), [], { host });
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate: key, place: "The Emissary's Choice", time: '9:30 PM', card: true, focus: [em], bg: [], places, host });
  say(`${E.targetTribe}, you've had your vote. But you're not done. ${em}, it's your turn.`, { focus: [em] });
  steps.push({ k: 'beat', text: `${em} stands up. Every head at the fire turns to follow.`, focus: [em, ...tribal.slice(0, 4)], tense: true });
  steps.push({ k: 'say', by: em, focus: [em], text: V(em, {
    sharp: ["I've enjoyed my visit. Really. But somebody has to go, and I've made up my mind."],
    loud: ["Okay. I'm not going to drag this out. I know who it is."],
    soft: ["I'm really sorry. I've thought about it all day, and I don't feel good about it."],
    dry: ["I'll keep this short, since I'm not the one who has to live with it here."],
    any: ["I listened to all of you today. This wasn't easy."],
  }, 'pre', ep.num) });
  steps.push({ k: 'title', kicker: "The emissary's choice", name: pick, faces: [em, pick], vs: true, tone: 'out' });
  // the engine's reason is a sentence about the emissary: staged, and then said in the emissary's own words
  if (P.reason) {
    const why = cleanText(String(P.reason).replace(/^"|"$/g, ''));
    const pitched = (/swayed by (.+?)'s pitch/i.exec(why) || [])[1];
    const aboutEm = why.startsWith(`${em} `);
    if (aboutEm) steps.push({ k: 'beat', text: why, focus: [em, pick] });
    steps.push({ k: 'say', by: em, focus: [em, pick], text: pitched ? V(em, { sharp: [`${pitched} made a very persuasive case today. ${pick}, it's you.`], loud: [`${pitched} told me everything I needed to know. ${pick}, sorry. It's you.`], soft: [`${pitched} made a case I couldn't ignore. ${pick}, I'm so sorry. It's you.`], any: [`${pitched} made a good case. ${pick}, it's you.`] }, 'why', ep.num)
      : aboutEm ? V(em, { sharp: [`${pick}. Nothing personal. Well, a little personal.`], soft: [`${pick}. I'm really sorry.`], loud: [`${pick}. That's my pick.`], any: [`${pick}. It's you.`] }, 'why2', ep.num) : why });
  }
  steps.push({ k: 'say', by: pick, focus: [pick], loud: true, text: V(pick, {
    loud: ['Are you serious? You were here for one day!'], sharp: ['How brave of you. Picking someone you barely know.'],
    soft: ["Oh. Okay. I... okay."], dry: ['Great. Voted out by a tourist.'], odd: ['Wait, me? Is this a bit? Tell me this is a bit.'],
    any: ["I can't believe this.", "Wow. Okay."],
  }, 'hit', ep.num), act: { kind: 'shake', who: [pick] } });
  for (const s of (ep.emissaryBondShifts || []).slice(0, 2)) {
    if (s.reason === 'ally-grudge' && s.from && tribal.includes(s.from)) steps.push({ k: 'say', by: s.from, focus: [s.from, em], text: (s === (ep.emissaryBondShifts || [])[0] ? V(s.from, { loud: [`You're going to pay for that, ${em}.`], sharp: [`I'll remember this at the merge, ${em}.`], any: [`I won't forget this, ${em}.`] }, 'grudge', s.from) : V(s.from, { loud: [`Unbelievable. Enjoy the walk back, ${em}.`], sharp: [`Lovely visit, ${em}. Do come again. Actually, don't.`], soft: [`That was our friend, ${em}.`], any: [`Thanks for nothing, ${em}.`, `We'll see you at the merge, ${em}.`] }, 'grudge2', s.from)), side: [{ tab: 'log', text: `${s.from} holds a grudge against ${em}` }] });
    else if (s.reason === 'gratitude' && s.from && tribal.includes(s.from)) steps.push({ k: 'beat', text: `${s.from} catches ${em}'s eye and gives the smallest nod.`, focus: [s.from, em], side: [{ tab: 'log', text: `${s.from} is grateful to ${em}` }] });
  }
  say(`${pick}, the emissary has spoken. Time for you to go.`, { focus: [pick] });
  steps.push({ k: 'out', who: pick, focus: [pick] });
  if (ep.emissaryDissolve?.player) {
    const d = ep.emissaryDissolve;
    say(`${d.fromTribe} has one person left. ${d.player}, you're joining ${d.toTribe}.`, { focus: [d.player] });
    steps.push({ k: 'say', by: d.player, focus: [d.player], text: V(d.player, { soft: ["I have to start all over again. With people I don't know."], loud: ['Great! Just great!'], any: ["Starting over. Okay. I can do that."] }, 'dissolve', ep.num) });
  }
  return { id: 'emissary-choice', kind: 'tribal', venue, ep: ep.num, label: "The Emissary's Choice", host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// TIED DESTINIES
// ══════════════════════════════════════════════════════════════════════
const REACT = {
  relieved: { soft: ["Oh, thank goodness. It's you.", "I'm so glad it's you."], loud: ["Yes! We've got this!"], sharp: ["You'll do. Don't make me regret it."], dry: ['Could have been worse. Could have been a lot worse.'], any: ["I'll take it.", "Okay. I can work with this."] },
  cautious: { soft: ["Okay. We can do this. Probably."], loud: ["Fine! Fine. Let's just not mess this up."], sharp: ["Interesting. Let's see how long this lasts."], dry: ['Well. This is a choice someone made.'], any: ['Not the worst. Not the best.', "Okay. We'll figure it out."] },
  dread: { soft: ["Oh no. Oh no, no, no."], loud: ['You have got to be kidding me!'], sharp: ['Wonderful. My life depends on the person I trust least.'], dry: ["Great. If you go, I go. That's comforting."], any: ["You're kidding.", 'Of all people.'] },
  fury: { soft: ["I can't do this. Not with them."], loud: ["No way! No way! Pick somebody else!"], sharp: ['This is a death sentence, and everybody here knows it.'], dry: ['Perfect. Tied to my least favourite person. Love this game.'], any: ['This is a disaster.', 'You did this on purpose.'] },
};
// the second of a pair answers the first (never the same line back)
const REPLY = {
  relieved: { soft: ["Same. I'm so glad it's you."], loud: ["We're unstoppable!"], any: ['Good. We look out for each other.', "I couldn't have asked for better."] },
  cautious: { loud: ['Just follow my lead!'], dry: ["That's the spirit. Sort of."], any: ["We'll be fine. Just don't do anything stupid.", 'I can live with that.'] },
  dread: { sharp: ["The feeling's mutual."], loud: ["Don't look at ME like that!"], any: ["Believe me, I'm not happy either.", "Trust me, I didn't pick this."] },
  fury: { loud: ["Oh, you think I'm happy about it?!"], sharp: ['Charming. Truly.'], any: ['Like I wanted this?', 'Yeah, well, same to you.'] },
};
// a pair's huddle after the draw: the first says what they need, the other answers; no two pairs alike
const HUDDLE = {
  relieved: [['Okay. Nobody touches either of us. We keep our heads down and vote together.', "Deal. We look out for each other."], ["As long as nobody's looking at us, we're fine.", "I'll find out who is getting votes."], ['We stick together, we stay. Simple.', "Simple. I like simple."]],
  cautious: [["Who's more likely to get votes, you or me? Be honest.", 'Probably me. So we need to move the votes somewhere else.'], ['We need to know who the targets are before anyone else does.', "Let's split up and listen. Meet back here."], ["I don't really know you. So tell me who you'd vote for.", 'Fair. Let me think about it and come find you.']],
  dread: [['If you mess this up, we both go home. Do you understand that?', 'Trust me, I like this even less than you do.'], ['We do not have to like each other. We just have to survive tonight.', 'Fine. Just for tonight.'], ["Who have you upset this week? I need a list.", "That's a short list. Shorter than yours."]],
  fury: [["Don't talk to me. Just don't get us voted out.", 'Then help me instead of yelling at me.'], ['You and me? This is a nightmare.', 'Then wake up and start helping.'], ["I'll work with you tonight. That's it. Tonight.", 'Believe me, one night is plenty.']],
};
const ORDER = ['fury', 'dread', 'cautious', 'relieved'];
export function tdTiedDestiniesScreen(ep, o = {}) {
  const td = (ep.twists || []).find(t => t.tiedDestinies && (t.pairs || []).length);
  if (!td) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o), pub = VENUES[venue]?.public || 'communal-grounds';
  const key = plateKey(venue, pub, 'day');
  if (!key) return null;
  const all = [...new Set(td.pairs.flatMap(p => [p.a, p.b]))];
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: pub, tod: 'day', plate: key, place: placeName(pub), time: 'Morning', card: true, focus: [], bg: [], places: placeScene(key, all.slice(0, 9), [], { host }), host });
  say(`Gather round, everybody. Today, nobody plays alone.`);
  steps.push({ k: 'title', kicker: 'Twist', name: 'Tied Destinies', faces: all.slice(0, 8) });
  say(`I'm pairing you up. If your partner is voted out tonight, you go home with them. Your fates are tied.`);
  say(`Which means tonight is a double elimination. Two of you are going home.`, { tense: true });
  steps.push({ k: 'beat', text: `The whole group looks around at each other at once.`, focus: all.slice(0, 6), act: { kind: 'shake', who: all.slice(0, 4) } });
  const react = td.reactions || {};
  const saidT = new Set();
  td.pairs.forEach((p, i) => {
    say(pickBy([`${p.a}... and ${p.b}.`, `Next pair: ${p.a}, you're tied to ${p.b}.`, `${p.a}. Your partner is ${p.b}.`], 'pair', ep.num, i), { focus: [p.a, p.b] });
    const ra = react[p.a] || 'cautious', rb = react[p.b] || 'cautious';
    const first = ORDER.indexOf(ra) <= ORDER.indexOf(rb) ? p.a : p.b, second = first === p.a ? p.b : p.a;
    const r1 = react[first] || 'cautious', r2 = react[second] || 'cautious';
    steps.push({ k: 'say', by: first, focus: [p.a, p.b], text: freshV(saidT, first, REACT[r1] || REACT.cautious, 'r1', ep.num, i), loud: r1 === 'fury',
      act: r1 === 'relieved' ? { kind: 'hug', who: [p.a, p.b] } : r1 === 'fury' ? { kind: 'shout', who: [first] } : null,
      side: [{ tab: 'log', text: `${p.a} + ${p.b}: ${ra} / ${rb}` }] });
    steps.push({ k: 'say', by: second, focus: [p.a, p.b], text: freshV(saidT, second, REPLY[r2] || REPLY.cautious, 'r2', ep.num, i) });
  });
  // each pair huddles: what being tied means for the vote (each pair its own exchange)
  const usedH = {};
  td.pairs.slice(0, 4).forEach((p, i) => {
    const r = react[p.a] || 'cautious', opts = HUDDLE[r] || HUDDLE.cautious;
    const n = usedH[r] = (usedH[r] ?? hash(`${ep.num}|${r}`) % opts.length) + 1;
    const [x, y] = opts[(n - 1) % opts.length];
    steps.push({ k: 'say', by: p.a, focus: [p.a, p.b], text: x });
    steps.push({ k: 'say', by: p.b, focus: [p.a, p.b], text: y });
  });
  say(`Good luck. You're going to need each other.`);
  return { id: 'tied-destinies', kind: 'camp', venue, ep: ep.num, label: 'Tied Destinies', host, steps };
}

// ── Tied Destinies at Tribal ──────────────────────────────────────────
// The user (2026-10-09): "the double elimination isn't announced, the viewer acts like it isn't one,
// and nobody talks about being tied". The host reminds them before the vote and asks one pair what
// it does to their vote; after the boot is read, the partner goes too, and they walk out together.
export function tiedDestiniesTribal(scr, ep) {
  const td = ep?.tiedDestinies;
  if (!scr?.steps?.length || !td?.pairs?.length) return scr;
  const host = scr.host || 'Chris';
  const tribal = ep.tribalPlayers || [];
  const partnerOf = n => { const p = td.pairs.find(x => x.a === n || x.b === n); return p ? (p.a === n ? p.b : p.a) : null; };
  const pre = [{ k: 'say', by: host, host: true, text: `Before we vote: your destinies are tied. Whoever goes home tonight takes their partner with them. Two of you are leaving.` }];
  // the pair with the most to lose talks about it
  const pair = td.pairs.find(p => tribal.includes(p.a) && tribal.includes(p.b) && ['dread', 'fury'].includes((td.reactions || {})[p.a])) || td.pairs.find(p => tribal.includes(p.a) && tribal.includes(p.b));
  if (pair) {
    pre.push({ k: 'say', by: host, host: true, text: `${pair.a}, you're tied to ${pair.b}. Does that change how you vote tonight?`, focus: [pair.a, pair.b] });
    pre.push({ k: 'say', by: pair.a, focus: [pair.a, pair.b], text: V(pair.a, {
      sharp: [`It changes who I can afford to annoy. ${pair.b} hasn't exactly made that easy.`], loud: [`It changes everything! If ${pair.b} goes, I go!`],
      soft: [`I'm voting to keep both of us here. That's all I can do.`], dry: [`It means I'm voting for two people's survival instead of one. No pressure.`],
      any: [`Of course it does. If ${pair.b} goes, I go.`, `I can't just think about me tonight. I have to think about ${pair.b} too.`],
    }, 'tdq', ep.num) });
    pre.push({ k: 'say', by: pair.b, focus: [pair.a, pair.b], text: V(pair.b, {
      sharp: ['Relax. Nobody is coming for us. Probably.'], loud: ["Nobody's touching us tonight!"], soft: ["We've got each other's backs. That's the plan."],
      any: ["We're in this together, whether we like it or not.", 'Just keep your head down and we both stay.'],
    }, 'tda', ep.num) });
  }
  const at = Math.min(2, scr.steps.length);
  scr.steps.splice(at, 0, ...pre);
  // the partner goes too
  const partner = td.eliminatedPartner || ep.tiedDestiniesCollateral || null;
  const target = td.eliminatedTarget || ep.eliminated;
  const iOut = scr.steps.findIndex(s => s.k === 'out' && s.who === target);
  if (partner && iOut >= 0) {
    const tail = [
      { k: 'say', by: host, host: true, text: `And ${target}, your destiny is tied to ${partner}. ${partner}, you're going home too.`, focus: [target, partner], tense: true },
      { k: 'say', by: partner, focus: [partner], loud: true, text: V(partner, {
        loud: ["Are you serious? I didn't even get a vote against me!"], sharp: ["Well. That's a very elegant way to lose."],
        soft: ["I knew this could happen. It still hurts."], dry: ['Voted out by proxy. That has to be a first.'], odd: ['Wait, me too? Can I appeal?'],
        any: ["I can't believe it. Nobody even wrote my name.", "That's it, then. We go together."],
      }, 'tdout', ep.num), act: { kind: 'shake', who: [partner] } },
      { k: 'say', by: target, focus: [target, partner], text: V(target, {
        soft: [`I'm so sorry, ${partner}. This is my fault.`], loud: [`Don't look at me like that, ${partner}!`], sharp: [`Don't take it personally, ${partner}. They weren't aiming at you.`],
        any: [`Sorry, ${partner}. I really am.`, `Come on, ${partner}. Let's go.`],
      }, 'tdsorry', ep.num) },
      { k: 'out', who: partner, focus: [partner] },
    ];
    scr.steps.splice(iOut + 1, 0, ...tail);
    // they walk out together: the partner on the exit with the one who was voted out
    for (const s of scr.steps.slice(iOut + 1)) if (s.k === 'scene' && (s.exit === target || s.exit)) {
      if (!s.places[partner]) s.places = { ...s.places, [partner]: { u: .78, v: .74, s: .22 } };
      if (!s.exitWith) s.exitWith = partner;
    }
    scr.label = `${scr.label} · Tied Destinies`;
  }
  return scr;
}
