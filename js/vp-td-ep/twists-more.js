// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/twists-more.js — the last non-challenge twists on the stepped stage
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-09): "check all the twists that aren't challenges and make sure there's a viewer
// for them". A season played with each one scheduled left these on the classic screens: the open
// vote (and the emissary's night) never reached the stepped Tribal, and the late arrival, the jury
// elimination, Spirit Island, the fan vote and the ambassadors had classic pages only.
//
// PURE. Who arrives, who votes for whom and in what order, who the jury boots, who the spirit is
// and what they stir up, the fans' ranking, what the ambassadors agree: all the engine's record.
// The words are the host's and the players', each in their own voice (td/story/voice-family.js).
import { ambassadorsDay } from './ambassadors.js';
import { placeScene, plateKey, placeName, venueOf, VENUES, cleanText, campSlot, teamSpot } from './steps.js';
import { familyOf } from '../td/story/voice-family.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const fam = n => { try { return familyOf(n); } catch { return 'plain'; } };
const V = (n, o, ...k) => pickBy(o[fam(n)] || o.any, n, ...k);
const listOf = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };
// an engine sentence with quotes in it: the staging as a beat, each quote said by the last person named before it
function playText(steps, text, who, focus = who) {
  let last = who[0], cued = false, quoted = null;
  for (const m of String(text || '').matchAll(/"([^"]+)"|([^"]+)/g)) {
    if (m[2] != null) {
      let t = cleanText(m[2].trim());
      const named = who.filter(n => m[2].includes(n));
      if (named.length) last = named[named.length - 1];
      const cue = who.find(n => t.endsWith(`${n}:`));
      if (cue) { last = cue; t = t.slice(0, -(cue.length + 1)).trim(); }
      // "Alejandro says:" / "Owen, quietly:" is a cue for the next line, not a moment of its own
      else if (/:\s*$/.test(t) && named.length && t.split(/\s+/).length <= 5) t = '';
      cued = /:\s*$/.test(m[2]) || !!cue;
      if (t && !/^[\s.,;:—-]+$/.test(t)) { steps.push({ k: 'beat', text: t.replace(/:\s*$/, '.'), focus }); quoted = null; }
      continue;
    }
    const q = cleanText(m[1].trim());
    if (!q || (!cued && q.split(/\s+/).length < 2)) continue;
    // two quotes back to back are two people talking
    const by = quoted && quoted === last && who.length > 1 ? (who.find(n => n !== quoted) || last) : last;
    steps.push({ k: 'say', by, text: q, focus, loud: /!/.test(q) && q.length < 70 });
    quoted = by; cued = false;
  }
}
const camp = (ep, o, team, tod = 'day') => {
  const venue = venueOf(ep, o), pub = VENUES[venue]?.public || 'communal-grounds';
  const slot = team ? campSlot(ep, team, venue) : null;
  return { venue, spot: pub, key: plateKey(venue, teamSpot(venue, pub, slot), tod) || plateKey(venue, pub, tod) || plateKey(venue, pub, 'day') };
};

// ══════════════════════════════════════════════════════════════════════
// THE OPEN VOTE — at Tribal, each of them stands and says it out loud
// ══════════════════════════════════════════════════════════════════════
/** Turn a stepped Tribal's secret ballots into the open vote: no booth, no reading, every vote said in front of everyone. */
export function openVoteTribal(scr, ep) {
  if (!scr?.steps?.length || !ep?.openVote) return scr;
  const host = scr.host || 'Chris';
  const bond = bondOf(ep);
  const log = (ep.votingLog || []).filter(v => v.voted && v.voter !== 'THE GAME');
  const order = (ep.openVoteOrder || []).filter(n => log.some(v => v.voter === n));
  for (const v of log) if (!order.includes(v.voter)) order.push(v.voter);
  const said = new Map((ep.tribalStory?.booth || []).map(b => [b.voter, b.line]));
  const iFirstBooth = scr.steps.findIndex(s => s.k === 'scene' && s.spot === 'voting-booth');
  const iBallots = scr.steps.findIndex(s => s.k === 'ballots');
  if (iBallots < 0) return scr;
  const start = iFirstBooth >= 0 ? iFirstBooth : iBallots;
  const back = scr.steps.slice(start, iBallots).reverse().find(s => s.k === 'scene' && s.ceremony) || scr.steps.slice(0, start).reverse().find(s => s.k === 'scene');
  // the usual "you've all voted" line right before the booth does not happen on an open vote
  const pre = scr.steps[start - 1];
  const cutFrom = pre && pre.k === 'say' && pre.host && /vot/i.test(pre.text || '') ? start - 1 : start;
  const open = [];
  if (back) open.push({ ...back, card: false, cut: false });
  open.push({ k: 'say', by: host, host: true, text: `Tonight there's no booth. This is an open vote. One at a time, you stand up and say your vote out loud, in front of everyone.` });
  if (ep.immunityWinner && ep.openVoteOrder?.length) open.push({ k: 'say', by: host, host: true, text: `${ep.immunityWinner} picked the order. ${order[0]}, you're first.`, focus: [order[0]] });
  const tally = {};
  order.forEach((n, i) => {
    const v = log.find(x => x.voter === n);
    if (!v) return;
    tally[v.voted] = (tally[v.voted] || 0) + 1;
    const own = cleanText(said.get(n) || '');
    open.push({ k: 'say', by: n, focus: [n, v.voted], text: own && own.includes(v.voted) ? own : V(n, {
      sharp: [`I'm voting for ${v.voted}. I'm sure ${v.voted} understands.`], loud: [`${v.voted}. I'm not hiding it.`], soft: [`I'm sorry, ${v.voted}. I'm voting for you.`],
      dry: [`${v.voted}. That's my vote.`], any: [`I vote ${v.voted}.`, `My vote is for ${v.voted}.`],
    }, 'ov', ep.num, i), side: [{ tab: 'tally', voter: n, target: v.voted }, { tab: 'why', voter: n, target: v.voted, text: cleanText(String(v.reason || '').replace(/^\[[^\]]+\]\s*/, '')), bloc: null, with: [], betray: null, tags: ['open vote'] }] });
    // a vote from a friend lands in front of everyone
    if (bond(n, v.voted) >= 2) open.push({ k: 'say', by: v.voted, focus: [v.voted, n], loud: true, act: { kind: 'shake', who: [v.voted] }, text: V(v.voted, {
      loud: [`${n}?! Seriously?!`], sharp: [`Well. That's how it is, ${n}.`], soft: [`${n}... I thought we were friends.`], dry: [`Okay. Noted, ${n}.`], any: [`${n}? Wow.`],
    }, 'ovr', ep.num, i) });
  });
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const top = ranked[0], tied = ranked.filter(r => top && r[1] === top[1]).map(r => r[0]);
  const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const out = [];
  if (top && tied.length > 1) out.push({ k: 'say', by: host, host: true, text: `That's ${W[top[1]] || top[1]} votes each for ${listOf(tied)}. Out loud, in front of everybody, and it's a tie.`, focus: tied, tense: true });
  else if (top) out.push({ k: 'say', by: host, host: true, text: `That's ${W[top[1]] || top[1]} vote${top[1] > 1 ? 's' : ''} for ${top[0]}. Nobody has to wait for me to read anything tonight.`, focus: [top[0]] });
  // the secret reading is gone: everybody already heard every vote
  const rest = scr.steps.slice(iBallots + 1).filter(s => s.k !== 'read' && s.k !== 'ballots');
  scr.steps = [...scr.steps.slice(0, cutFrom), ...open, ...out, ...rest];
  scr.label = `${scr.label} · Open vote`;
  return scr;
}

// ══════════════════════════════════════════════════════════════════════
// THE LATE ARRIVAL
// ══════════════════════════════════════════════════════════════════════
const TAG = { mastermind: 'The Mastermind', schemer: 'The Schemer', hothead: 'The Hothead', 'challenge-beast': 'The Competitor', 'social-butterfly': 'The Social Butterfly',
  'loyal-soldier': 'The Loyal One', wildcard: 'The Wildcard', 'chaos-agent': 'The Chaos Agent', floater: 'The Floater', underdog: 'The Underdog', hero: 'The Hero',
  villain: 'The Villain', goat: 'The Easy Target', 'perceptive-player': 'The Observer', showmancer: 'The Romantic' };
const STAT = { physical: 'Strength', endurance: 'Endurance', mental: 'Brains', social: 'Charm', strategic: 'Strategy', loyalty: 'Loyalty', boldness: 'Guts', intuition: 'Instinct', temperament: 'Cool' };
export function tdLateArrivalScreen(ep, o = {}) {
  const a = ep.lateArrival;
  if (!a?.name) return null;
  const host = o.host || 'Chris';
  const C = camp(ep, o, a.tribe);
  if (!C.key) return null;
  const here = (a.alreadyHere || []).filter(n => n !== a.name).slice(0, 8);
  const p = (o.players || globalThis.players || []).find(x => x.name === a.name) || {};
  const stats = Object.entries(p.stats || {}).filter(([k]) => STAT[k]).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => ({ k: STAT[k], v }));
  const steps = [];
  steps.push({ k: 'scene', spot: C.spot, tod: 'day', plate: C.key, place: a.tribe ? `${a.tribe} Camp` : placeName(C.spot), time: 'Morning', card: true, focus: here.slice(0, 3), bg: [], places: placeScene(C.key, [a.name, ...here], []), host });
  steps.push({ k: 'say', by: host, host: true, text: a.tribe ? `${a.tribe}, I hope you saved some room. You're getting a new teammate.` : `Everybody, gather round. Somebody new is joining the game.` });
  steps.push({ k: 'beat', text: `Everyone at camp turns toward the path.`, focus: here.slice(0, 4), act: { kind: 'shake', who: here.slice(0, 3) } });
  steps.push({ k: 'intro', who: a.name, tag: TAG[p.archetype] || '', age: p.age || null, job: p.occupation || null, home: p.hometown || null, returnee: false, stats, n: (o.castSize || here.length + 1), of: o.castSize || here.length + 1 });
  steps.push({ k: 'beat', text: `${a.name} walks into camp${a.fromOtherSide ? ', straight from the other side of the island' : ''}.`, focus: [a.name], act: { kind: 'arrive', who: [a.name] } });
  steps.push({ k: 'say', by: a.name, focus: [a.name], text: V(a.name, {
    loud: ["Hi! I'm here! Did I miss anything good?"], sharp: ["Don't all look so thrilled. I'll grow on you."], soft: ["Hi, everyone. I'm really nervous. Please be nice."],
    dry: ["So. I hear you've all already picked your friends."], odd: ['Surprise! I come bearing nothing, but I come in peace.'],
    any: ["Hi, everybody. I know I'm late. I'm ready to catch up."],
  }, 'hi', ep.num) });
  // whoever is there answers, the way they feel about a new face
  here.slice(0, 2).forEach((n, i) => steps.push({ k: 'say', by: n, focus: [n, a.name], text: V(n, {
    loud: ['Great. One more mouth to feed.', "Welcome! Don't get comfortable."], sharp: ['Welcome. Do sit down. We were just deciding who to vote out.'],
    soft: ["Welcome! Don't worry, we're mostly friendly.", 'Hi! Come sit with us.'], dry: ['Great timing. You missed all the fun parts and none of the hard ones.'],
    any: ['Welcome to camp.', 'Hey. Pull up a log.'],
  }, 'here', ep.num, i) }));
  steps.push({ k: 'conf', by: a.name, text: V(a.name, {
    sharp: ['Everyone here has been playing for days. That means everyone here has already made enemies. I just have to find them.'],
    soft: ["Walking in late is terrifying. Everybody already has a friend. I just need one."], loud: ["I'm late. Fine. I'll just have to play twice as hard."],
    any: ["Coming in late means I'm behind. It also means nobody's had time to vote against me yet."],
  }, 'conf', ep.num) });
  steps.push({ k: 'title', kicker: 'A new arrival', name: a.name, faces: [a.name] });
  return { id: 'late-arrival', kind: 'camp', venue: C.venue, ep: ep.num, label: 'A New Arrival', host, steps, team: a.tribe || null };
}

// ══════════════════════════════════════════════════════════════════════
// THE JURY ELIMINATION — the voted-out come back and vote one of them out
// ══════════════════════════════════════════════════════════════════════
export function tdJuryEliminationScreen(ep, o = {}) {
  const tw = (ep.twists || []).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (!tw) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const key = plateKey(venue, 'ceremony', 'night') || plateKey(venue, VENUES[venue]?.public || 'communal-grounds', 'night');
  if (!key) return null;
  const bond = bondOf(ep);
  const jurors = [...new Set((tw.elimLog || []).map(e => e.juror))];
  const active = (ep.gsSnapshot?.activePlayers || []).concat(tw.juryBooted).filter((n, i, a) => a.indexOf(n) === i);
  const booted = tw.juryBooted;
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate: key, place: 'The Jury Returns', time: 'Night', card: true, focus: [], bg: [], places: placeScene(key, [...active.slice(0, 5), ...jurors.slice(0, 4)], [], { host }), host, wide: true });
  say(`Tonight, you don't vote. They do.`);
  steps.push({ k: 'beat', text: `${listOf(jurors.slice(0, 6))} walk in and take their places. Every one of them was voted out by somebody sitting here.`, focus: jurors.slice(0, 5), act: { kind: 'arrive', who: jurors.slice(0, 5) } });
  steps.push({ k: 'title', kicker: 'Twist', name: 'The Jury Votes', faces: jurors.slice(0, 8) });
  say(`The jury will vote one of you out of this game. ${ep.immunityWinner ? `${ep.immunityWinner} is safe. Everybody else, ` : ''}it's out of your hands.`, { tense: true });
  (tw.elimLog || []).forEach((e, i) => {
    const b = bond(e.juror, e.votedOut);
    steps.push({ k: 'say', by: e.juror, focus: [e.juror, e.votedOut], text: b <= -2 ? V(e.juror, {
      loud: [`${e.votedOut}. You know why.`], sharp: [`${e.votedOut}. I've been looking forward to this.`], soft: [`${e.votedOut}. After what you did to me, I can't vote any other way.`], any: [`${e.votedOut}. This one's personal.`],
    }, 'je', ep.num, i) : V(e.juror, {
      dry: [`${e.votedOut}. Biggest threat left. Nothing personal.`], soft: [`I'm so sorry, ${e.votedOut}. You're too dangerous to leave in there.`], any: [`${e.votedOut}. You're the one I can't let win.`, `My vote goes to ${e.votedOut}.`],
    }, 'je2', ep.num, i), side: [{ tab: 'tally', voter: e.juror, target: e.votedOut }] });
  });
  const n = (tw.elimVotes || {})[booted] || 0;
  if (tw.juryTie) say(`The jury tied. They had to talk it out. And they chose ${booted}.`, { tense: true, focus: [booted] });
  say(`${n} vote${n === 1 ? '' : 's'}. ${booted}, the jury has voted you out.`, { focus: [booted] });
  steps.push({ k: 'say', by: booted, focus: [booted], loud: true, act: { kind: 'shake', who: [booted] }, text: V(booted, {
    loud: ["You're kidding me! I didn't even get to vote!"], sharp: ["Bitter people with a vote. What a combination."], soft: ["I guess I deserved some of that."], dry: ['Voted out by the people I voted out. Poetic.'],
    any: ["I didn't see that coming.", "Wow. Okay."],
  }, 'jeo', ep.num) });
  steps.push({ k: 'out', who: booted, focus: [booted] });
  return { id: 'jury-elimination', kind: 'tribal', venue, ep: ep.num, label: 'The Jury Votes', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// SPIRIT ISLAND — one of the voted-out comes back to camp for a day
// ══════════════════════════════════════════════════════════════════════
export function tdSpiritIslandScreen(ep, o = {}) {
  const tw = (ep.twists || []).find(t => (t.type === 'spirit-island' || t.catalogId === 'spirit-island') && t.spiritVisitor);
  const evs = ep.spiritIslandEvents || [];
  if (!tw || !evs.length) return null;
  const host = o.host || 'Chris';
  const C = camp(ep, o, null);
  if (!C.key) return null;
  const spirit = tw.spiritVisitor;
  const here = [...new Set(evs.flatMap(e => e.players || []))].filter(n => n !== spirit);
  const steps = [];
  steps.push({ k: 'scene', spot: C.spot, tod: 'day', plate: C.key, place: placeName(C.spot), time: 'Morning', card: true, focus: [spirit], bg: [], places: placeScene(C.key, [spirit, ...here].slice(0, 9), [], { host }), host });
  steps.push({ k: 'say', by: host, host: true, text: `Look who's back. ${spirit} is on the jury, and today ${spirit} gets to spend one day at camp with you.` });
  steps.push({ k: 'title', kicker: 'Twist', name: 'Spirit Island', faces: [spirit] });
  steps.push({ k: 'say', by: host, host: true, text: `${spirit} can't vote tonight. But ${spirit} can talk, and ${spirit} remembers everything.` });
  for (const e of evs) {
    const who = (e.players || []).filter(Boolean);
    const first = steps.length;
    playText(steps, e.text, who);
    if (steps[first]) steps[first].badge = { text: String(e.type || 'spirit').replace(/^spirit-/, '').toUpperCase(), cls: /confront|tension/.test(e.type) ? 'danger' : /reunion/.test(e.type) ? 'green' : 'gold' };
  }
  steps.push({ k: 'conf', by: spirit, text: V(spirit, {
    sharp: ["One day at camp, and I've already told them exactly what I think. Some of them won't sleep tonight."], soft: ["It was so good to see everyone. Even the people who voted me out. Mostly."],
    loud: ["I got to say everything I wanted to say. Best day of the season!"], any: ["I'm out of the game, but I just reminded every one of them that my vote still counts."],
  }, 'sc', ep.num) });
  return { id: 'spirit-island', kind: 'camp', venue: C.venue, ep: ep.num, label: 'Spirit Island', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE FAN VOTE — the fans save their favourite
// ══════════════════════════════════════════════════════════════════════
export function tdFanVoteScreen(ep, o = {}) {
  const tw = (ep.twists || []).find(t => (t.type === 'fan-vote-boot' || t.catalogId === 'fan-vote-boot') && t.fanVoteSaved);
  if (!tw) return null;
  const host = o.host || 'Chris';
  const C = camp(ep, o, null);
  if (!C.key) return null;
  const results = (tw.fanVoteResults || []).slice(0, 5);
  const win = tw.fanVoteSaved;
  const people = [...new Set([win, ...results.map(r => r.name)])];
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: C.spot, tod: 'day', plate: C.key, place: placeName(C.spot), time: 'Morning', card: true, focus: [], bg: [], places: placeScene(C.key, people.slice(0, 9), [], { host }), host, wide: true });
  say(`The fans at home have been watching every minute. And they've voted.`);
  steps.push({ k: 'title', kicker: 'Twist', name: 'The Fan Vote', faces: people.slice(0, 6) });
  say(`Whoever the fans love most gets ${tw.fanVoteIsPreMerge ? 'immunity for their team tonight' : 'an Extra Vote'}. Here's your top ${results.length}, from the bottom.`);
  [...results].reverse().forEach((r, i) => {
    const last = r.name === win;
    say(`${last ? 'And the fans\' favourite, with ' : 'With '}${r.pct}% of the vote... ${r.name}.`, { focus: [r.name], tense: last, side: [{ tab: 'log', text: `${r.name}: ${r.pct}%` }] });
    if (last) steps.push({ k: 'say', by: r.name, focus: [r.name], loud: true, act: { kind: 'roundwin', who: [r.name], lose: [] }, text: V(r.name, {
      loud: ['The fans love me! Of course they do!'], sharp: ['Naturally. They have taste.'], soft: ["Oh my gosh. Thank you, everyone at home. Really."], dry: ["Huh. Apparently I'm popular. Who knew."],
      any: ['I can\'t believe it. Thank you!', 'The fans! I love the fans!'],
    }, 'fv', ep.num) });
  });
  const second = results[1]?.name;
  if (second && second !== win) steps.push({ k: 'conf', by: second, text: V(second, { sharp: [`Second place. Fine. The fans will come around.`], loud: ['Second?! Second!'], any: ['Second. So close. I\'ll take it.'] }, 'fv2', ep.num) });
  return { id: 'fan-vote', kind: 'camp', venue: C.venue, ep: ep.num, label: 'The Fan Vote', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE AMBASSADORS — one from each team, a deal, and somebody goes home
// ══════════════════════════════════════════════════════════════════════
export function tdAmbassadorsScreen(ep, o = {}) {
  const d = ep.ambassadorData, m = d?.ambassadorMeeting;
  if (!m) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const key = plateKey('islands', 'skull-rock', 'day') || plateKey(venue, VENUES[venue]?.public || 'communal-grounds', 'day');
  if (!key) return null;
  // the whole day as conversations (ambassadors.js); an episode simulated before the meeting kept its
  // proposals still plays it, from the same record
  const steps = ambassadorsDay({ ep, host, venue, neutral: key });
  if (!steps.length) return null;
  return { id: 'ambassadors', kind: 'tribal', venue: plateKey('islands', 'skull-rock', 'day') ? 'islands' : venue, ep: ep.num, label: 'The Ambassadors', host, steps };
}
