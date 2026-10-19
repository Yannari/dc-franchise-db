// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/jury-vote.js — the Jury Elimination twist on the stepped stage
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-19): "the jury votes twist is extremely not well made visually and logically, there's
// no structure no drama no suspense no music … we don't even see all the members of the jury". It was nine
// steps at the ceremony with four jurors standing in it, each one saying the name out loud, then the result.
//
// Now it plays as a Tribal Council the players have no say in:
//   1. the fire: the players sit down, the host tells them they are not voting tonight
//   2. the jury walks in: every juror, seated in the stands (as many shots of the stands as it takes to show
//      all of them), and the one with a score to settle says hello to the person who voted them out
//   3. the pleas: everyone without immunity gets one chance to talk to the people they voted out
//   4. the deliberation: the jury argues it out in front of them (episode.js simulateJuryRoundtable: who
//      lobbied against whom, who was talked round, who would not be)
//   5. the vote: each juror alone in the booth, the name on the paper (hidden by the Intel spoiler switch)
//   6. the reading: one at a time, the count kept, the deciding vote held back; a tie goes back to the jury
//   7. the boot: how they take it, who answers from the stands, and the walk out of the game (steps.js walkOut)
//
// PURE. Who votes, for whom and who goes is the engine's record (episode.js, the jury-elimination twist);
// bonds are the episode's snapshot; who voted whom out is the season's history.
import { placeScene, plateKey, placeName, venueOf, VENUES, seatAll, walkOut, forwardClock } from './steps.js';
import { juryPlates, seatJury, seatsOn } from './finale.js';
import { familyOf } from '../td/story/voice-family.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const fam = n => { try { return familyOf(n); } catch { return 'plain'; } };
const listOf = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = n => WORD[n] || String(n);
const votes = n => `${word(n)} vote${n === 1 ? '' : 's'}`;

export function tdJuryEliminationScreen(ep, o = {}) {
  const tw = (ep.twists || []).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (!tw || !(tw.elimLog || []).length) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const V = VENUES[venue];
  const fire = plateKey(venue, 'ceremony', 'night') || plateKey(venue, V?.public || 'communal-grounds', 'night');
  if (!fire) return null;
  const snap = ep.gsSnapshot?.bonds || {};
  const bond = (a, b) => snap[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0;
  const P = n => { try { return o.pronouns?.(n) || globalThis.pronouns?.(n) || { sub: 'they', obj: 'them', posAdj: 'their' }; } catch { return { sub: 'they', obj: 'them', posAdj: 'their' }; } };
  const hist = o.history || (typeof window !== 'undefined' ? window.gs?.episodeHistory : null) || [];

  const log = tw.elimLog;
  const elim = tw.juryBooted;
  const jurors = [...new Set(log.map(e => e.juror))];
  const immune = [].concat(ep.immunityWinner || []).filter(Boolean);
  const room = [...new Set([...(ep.gsSnapshot?.activePlayers || []), elim])];
  const cands = room.filter(n => !immune.includes(n));
  const tally = tw.elimVotes || {};

  // who sent each juror home, and who a candidate sent home (the season's own votes)
  const outEp = j => hist.find(h => h.num < ep.num && (h.eliminated === j || h.firstEliminated === j));
  const votedOut = (x, j) => !!(outEp(j)?.votingLog || []).some(v => v.voter === x && v.voted === j);
  const allied = (j, x) => hist.some(h => h.num < ep.num && (h.alliances || []).some(a => (a.members || []).includes(j) && (a.members || []).includes(x)));
  const wrote = x => jurors.filter(j => votedOut(x, j));
  const avg = x => jurors.length ? jurors.reduce((t, j) => t + bond(j, x), 0) / jurors.length : 0;

  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  const said = new Set();
  // a line from the speaker's voice family, never the same line twice in one night
  const line = (n, pools, ...k) => {
    const own = pools[fam(n)] || [], any = pools.any || [];
    const list = [...own, ...own, ...any].filter(x => !said.has(x));
    const x = pickBy(list.length ? list : [...own, ...any], n, ep.num, ...k);
    said.add(x); return x;
  };

  // ── the sets ──
  let clock = '8:30 PM';
  const fireScene = (focus = [], extra = {}) => steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate: fire, place: V?.ceremony || 'Tribal Council', time: extra.time || clock, card: false, cut: true,
    focus, bg: [], places: firePlaces, seated: room, host, ceremony: true, ...extra });
  const J = juryPlates(ep, o);
  const per = J.wide ? Math.max(1, seatsOn(J.wide)) : 0;
  // the stands hold six to fourteen; a jury of every boot so far needs more than one shot of them
  const shots = [];
  if (per) for (let i = 0; i < jurors.length; i += per) shots.push(jurors.slice(i, i + per));
  const shotOf = j => shots.findIndex(s => s.includes(j));
  // without stands, the jury stands at the fire with the players
  const firePlaces = J.wide ? seatAll(fire, room, host) : seatAll(fire, [...room, ...jurors], host);
  const stands = (focus, { close = false, shot = null } = {}) => {
    if (!J.wide) { fireScene(focus); return; }
    const k = shot ?? Math.max(0, shotOf(focus[0]));
    const key = close && J.close ? J.close : J.wide;
    steps.push({ k: 'scene', spot: key === J.close ? 'jury-close' : 'jury-bleachers', tod: /-night$/.test(key) ? 'night' : 'day', plate: key, place: 'The Jury', time: J.day ? 'Day' : 'Night', card: false, cut: true,
      focus, bg: [], places: seatJury(key, key === J.close ? focus.slice(0, 1) : shots[k]), host: null, wide: key !== J.close, still: true, ...(J.indoor ? { noWx: true } : {}), ...(J.night ? { nightFrame: true } : {}) });
  };

  // ══ 1. THE FIRE ══
  steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate: fire, place: V?.ceremony || 'Tribal Council', time: '8:30 PM', card: true, focus: [], bg: [], places: firePlaces, seated: room, host, ceremony: true });
  say(pickBy([`Welcome to ${V?.ceremony || 'Tribal Council'}. Get comfortable. Tonight, none of you are voting.`,
    `Sit down, everybody. Tonight is going to be different. Put the pens away. You won't need them.`], ep.num));
  const burned = [...cands].sort((a, b) => wrote(b).length - wrote(a).length || avg(a) - avg(b) || a.localeCompare(b));
  const worst = burned[0];
  steps.push({ k: 'say', by: worst, focus: [worst], text: line(worst, {
    loud: ["Wait, what? Then who is?"], sharp: ["Not voting. I don't like the sound of that."], soft: ["Why do I feel like this is bad news?"], dry: ['That has never once been good news.'],
    any: ["Then who's voting?", "Okay. Who is, then?"],
  }, 'q') });
  say(`They are.`, { tense: true });
  steps.push({ k: 'title', kicker: 'Twist', name: 'The Jury Votes', faces: jurors.slice(0, 8), tone: 'fire' });

  // ══ 2. THE JURY WALKS IN ══
  if (J.wide) {
    shots.forEach((s, i) => {
      stands(s, { shot: i });
      steps.push({ k: 'beat', text: i === 0 ? `The jury walks in and takes the stands: ${listOf(s)}.` : `Behind them, ${listOf(s)}.`, focus: s, act: { kind: 'arrive', who: s } });
    });
    fireScene(cands.slice(0, 4), { time: '8:35 PM' });
  } else steps.push({ k: 'beat', text: `The jury walks in: ${listOf(jurors)}.`, focus: jurors.slice(0, 6), act: { kind: 'arrive', who: jurors.slice(0, 6) } });
  say(`${jurors.length === 1 ? 'Your juror' : `All ${word(jurors.length)} of them`} ${jurors.length === 1 ? 'was' : 'were'} voted out by somebody in this game. Tonight, they vote one of you out.`, { tense: true });
  if (immune.length) {
    say(`${listOf(immune)}, you won immunity. They can't touch you.`, { focus: immune });
    steps.push({ k: 'beat', text: `${immune[0]} lets out a breath. Everybody else is looking at the stands.`, focus: [immune[0], ...cands.slice(0, 2)], feel: { [immune[0]]: 'relief' } });
  }
  // the one who knows they are in trouble, to the camera
  if (wrote(worst).length >= 2) steps.push({ k: 'conf', by: worst, text: line(worst, {
    sharp: [`I voted out ${word(wrote(worst).length)} of the people in those stands. I'd call that a problem.`],
    soft: [`I wrote ${word(wrote(worst).length)} of those names. I can feel every one of them looking at me.`],
    loud: [`${word(wrote(worst).length)[0].toUpperCase()}${word(wrote(worst).length).slice(1)} of them! I voted out ${word(wrote(worst).length)} of them! This is a disaster!`],
    any: [`I count ${word(wrote(worst).length)} people up there I voted out. That's not a jury. That's a firing squad.`],
  }, 'trouble') });
  // a score to settle: the juror who most resents somebody who sent them home says hello
  const grudge = jurors.flatMap(j => cands.filter(x => votedOut(x, j)).map(x => ({ j, x, b: bond(j, x) }))).sort((a, b) => a.b - b.b)[0];
  if (grudge && grudge.b <= -2) {
    stands([grudge.j], { close: true });
    steps.push({ k: 'say', by: grudge.j, focus: [grudge.j], text: line(grudge.j, {
      sharp: [`Hello, ${grudge.x}. Don't get up.`], loud: [`Surprise, ${grudge.x}! Miss me?`], soft: [`Hi, ${grudge.x}. It's been a while.`], dry: [`${grudge.x}. Nice to see you again. For me, anyway.`],
      any: [`Hi, ${grudge.x}. Remember me?`],
    }, 'hi') });
    fireScene([grudge.x]);
    steps.push({ k: 'beat', text: `${grudge.x} can't quite look at ${grudge.j}.`, focus: [grudge.x], feel: { [grudge.x]: 'scared' } });
  }

  // ══ 3. THE PLEAS ══
  clock = '8:45 PM';
  say(`Before they vote, each of you gets one chance to talk to them. Make it count.`);
  const pleaOrder = [...cands].sort((a, b) => hash(`${ep.num}|plea|${a}`) - hash(`${ep.num}|plea|${b}`));
  // each plea is that player's own record: the names they wrote, and who they point the jury at instead
  const threat = x => wrote(x).length * 2 - avg(x);
  pleaOrder.forEach((c, i) => {
    const mine = wrote(c), a = avg(c), f = fam(c);
    const them = mine.slice(0, 2), more = mine.length - them.length;
    const names = more > 0 ? `${them.join(', ')} and ${word(more)} more of you` : listOf(them);
    const other = cands.filter(x => x !== c && wrote(x).length > mine.length).sort((x, y) => threat(y) - threat(x))[0];
    say(pickBy(i === 0 ? [`${c}, you first.`, `${c}.`] : [`${c}.`, `${c}, go ahead.`], ep.num, c), { focus: [c] });
    const opens = (mine.length ? [`${names}, I wrote your name${mine.length > 1 ? 's' : ''}. I'm not going to pretend I didn't.`, `I voted out ${names}. You all know that.`, `${names}. Yes, that was me.`,
      `Let's get it out of the way. My vote sent home ${names}.`, `I know what you're thinking. ${names}. That was my vote.`]
      : [`I never wrote a single name on that bench. Not one of you.`, `Not one person up there went home because of my vote.`]);
    const shape = x => (names ? x.split(names).join('~') : x);
    const free = opens.filter(x => !said.has(shape(x)));
    const open = pickBy(free.length ? free : opens, ep.num, c, 'o');
    said.add(shape(open));
    const close = line(c, a >= 1.5 ? {
      soft: [`I care about all of you, and I hope that counts tonight.`, `I never stopped liking any of you. I hope you can tell.`],
      any: [`I was honest with every one of you, and I'd do it the same way again.`, `Every one of you knew where you stood with me. I never hid it.`, `I told every one of you the truth, even when it cost me.`],
    } : mine.length >= 2 ? {
      sharp: [`I'm not apologising for playing. You'd have done the same to me.`, `You'd have done it to me first, given the chance. Some of you tried.`],
      soft: [`I'm sorry. I mean that. I've thought about it every day since.`, `I hated writing every one of those names. That's the truth.`, `I'm not proud of all of it. I'm sorry.`],
      loud: [`That's the game! Every one of you signed up for it!`, `You'd have done the exact same thing! Don't pretend you wouldn't!`],
      dry: [`It was strategy. I'd like to think you'd respect that, but I'm not counting on it.`, `It was a numbers game, and the numbers were against you. Sorry.`],
      any: [`It was the game. It was never about you as people.`, `Every one of those votes was about the game, not about you.`, `I'd like you to judge the game I played, not the night I played it on you.`],
    } : {
      loud: [`Remember who actually put you up there!`],
      any: [`I've played fair and kept my head down. Don't punish me for being quiet.`, `I've never been the one running things down here. Ask anybody.`],
    }, 'close', i);
    const point = other && (hash(`${ep.num}|pt|${c}`) % 2 === 0 || !mine.length) ? ` If you want the person who's really been running votes, look at ${other}.` : '';
    steps.push({ k: 'say', by: c, focus: [c], text: `${open} ${close}${point}`, side: [{ tab: 'room', text: mine.length ? `${c} voted out ${listOf(mine)}.` : `${c} has never voted out anyone on the jury.` }] });
  });
  // the stands answer the plea that landed worst
  const answer = jurors.filter(j => votedOut(worst, j) && bond(j, worst) <= -1).sort((a, b) => bond(a, worst) - bond(b, worst))[0];
  if (answer) {
    stands([answer]);
    steps.push({ k: 'say', by: answer, focus: [answer], text: line(answer, {
      sharp: [`"Never about us." Sure, ${worst}.`], loud: [`You wrote my name, ${worst}! I was there!`], dry: [`That was a lovely speech. I'm still voting.`],
      any: [`You wrote my name, ${worst}. I remember.`],
    }, 'ans'), feel: { [answer]: 'angry' } });
  }

  // ══ 4. THE DELIBERATION ══
  const rt = ep.juryRoundtable || {};
  const lobby = (rt.lobbyists || []).filter(l => cands.includes(l.target) && jurors.includes(l.juror))
    .sort((a, b) => (a.type === 'oppose' ? 0 : 1) - (b.type === 'oppose' ? 0 : 1) || a.juror.localeCompare(b.juror)).slice(0, 4);
  clock = '8:55 PM';
  say(`Jury, before you vote, you can talk it over. Out loud. They get to listen.`, { focus: cands.slice(0, 3) });
  const talked = new Set();
  if (lobby.length) for (const l of lobby) {
    const t = l.target;
    stands([l.juror]);
    const mine = votedOut(t, l.juror);
    steps.push({ k: 'say', by: l.juror, focus: [l.juror], loud: l.type === 'oppose' && fam(l.juror) === 'loud', text: l.type === 'oppose' ? line(l.juror, mine ? {
      sharp: [`${t} put me up here. I'm not asking anybody to settle that for me. I'm telling you what ${t} is like.`],
      any: [`${t} sent me home. So yes, I'm biased. I'm also right. ${t} goes.`],
    } : {
      sharp: [`I'll make this easy. ${t}. Next question.`], loud: [`It's ${t}! Come on, it's obviously ${t}!`], dry: [`If ${t} makes the end, we'll be handing ${P(t).obj} the money. I'd rather not.`],
      soft: [`I don't like saying it. But ${t} is the one who wins if we do nothing.`],
      any: [`Let's be honest. ${t} is the one who wins if we leave ${P(t).obj} in there.`, `${t} has played every one of us. ${t} goes.`],
    }, 'opp', t) : line(l.juror, {
      soft: [`Please, not ${t}. ${t} was the only one who ever checked on me.`], loud: [`Nobody touches ${t}! ${t} is the only one down there who played fair!`],
      any: [`Leave ${t} alone. ${t} never lied to me once.`, `If ${t} goes home tonight, we sent the wrong person home.`],
    }, 'champ', t), side: [{ tab: 'room', text: `${l.juror} ${l.type === 'oppose' ? 'wants' : 'is protecting'} ${t}${l.type === 'oppose' ? ' gone' : ''}.` }] });
    talked.add(l.juror);
    for (const s of (rt.shifts || []).filter(x => x.lobbyist === l.juror && x.finalist === t && jurors.includes(x.persuaded)).slice(0, 1)) {
      if (shotOf(s.persuaded) !== shotOf(l.juror)) stands([s.persuaded]);
      steps.push({ k: 'say', by: s.persuaded, focus: [s.persuaded], text: s.direction === 'against'
        ? line(s.persuaded, { dry: [`Hm. I hadn't looked at ${t} like that.`], any: [`Okay. You've got a point about ${t}.`, `...Yeah. I can see that about ${t}.`] }, 'sh', t)
        : line(s.persuaded, { soft: [`Okay. I'll leave ${t} out of it.`], any: [`Fine. ${t} is off my list.`] }, 'shf', t),
      side: [{ tab: 'room', text: `${l.juror} talks ${s.persuaded} round on ${t}.` }] });
      talked.add(s.persuaded);
    }
    for (const pb of (rt.pushbacks || []).filter(x => x.lobbyist === l.juror && x.finalist === t && jurors.includes(x.resistedBy)).slice(0, 1)) {
      if (shotOf(pb.resistedBy) !== shotOf(l.juror)) stands([pb.resistedBy]);
      steps.push({ k: 'say', by: pb.resistedBy, focus: [pb.resistedBy], text: pb.reason === 'strategic-mind'
        ? line(pb.resistedBy, { sharp: [`Thanks for the speech. I'll make my own mind up about ${t}.`], any: [`I'll make up my own mind about ${t}, thanks.`] }, 'pb', t)
        : line(pb.resistedBy, { loud: [`Save it! I know exactly how I feel about ${t}!`], any: [`You're not changing my mind about ${t}.`] }, 'pbs', t) });
      talked.add(pb.resistedBy);
    }
  } else {
    // nobody lobbied: the two with the strongest feelings say where they stand, and nothing more
    const felt = jurors.map(j => ({ j, b: Math.min(...cands.map(c => bond(j, c))) })).sort((a, b) => a.b - b.b).slice(0, 2);
    felt.forEach(({ j }, i) => {
      stands([j]);
      steps.push({ k: 'say', by: j, focus: [j], text: i === 0 ? line(j, { sharp: [`I don't need to talk it over.`], any: [`I already know who I'm voting for.`] }, 'nolob')
        : line(j, { soft: [`I'm still not sure. That's the honest answer.`], any: [`I'm going to listen to my gut on this one.`] }, 'nolob2') });
    });
  }
  // and the one the jury talked about most heard all of it
  const named = lobby.filter(l => l.type === 'oppose').map(l => l.target);
  const hot = named.length ? named.sort((a, b) => named.filter(x => x === b).length - named.filter(x => x === a).length)[0] : worst;
  fireScene([hot]);
  steps.push({ k: 'beat', text: pickBy([`Down at the fire, ${hot} heard every word of that.`, `${hot} stares at the ground and doesn't say anything.`], ep.num, hot), focus: [hot], feel: { [hot]: 'scared' } });

  // ══ 5. THE VOTE ══
  say(`Jury, it's time to vote. One at a time.`, { tense: true });
  const booth = plateKey(venue, 'voting-booth', 'night') || plateKey(venue, 'confessional', 'day');
  // the order gives nothing away: a stable shuffle, and nobody who voted for the boot opens it
  const order = [...log].sort((a, b) => hash(`${ep.num}|jv|${a.juror}`) - hash(`${ep.num}|jv|${b.juror}`) || a.juror.localeCompare(b.juror));
  if (order.length > 1 && order[0].votedOut === elim) { const k = order.findIndex(v => v.votedOut !== elim); if (k > 0) order.unshift(order.splice(k, 1)[0]); }
  order.forEach((v, i) => {
    const j = v.juror, t = v.votedOut, b = bond(j, t), p = P(t);
    const friend = room.filter(x => x !== t && bond(j, x) >= 2).sort((x, y) => bond(j, y) - bond(j, x))[0];
    const why = votedOut(t, j) && b <= -3 ? 'bitter' : votedOut(t, j) ? 'payback' : allied(j, t) && b <= -2 ? 'betrayed' : b <= -3 ? 'grudge' : b >= 3 ? 'fond' : friend ? 'friend' : 'threat';
    const POOL = {
      bitter: { sharp: [`I don't even need a minute. ${t}.`], loud: [`${t}! Bye! Don't let the door hit you!`], soft: [`I really tried to let it go. I couldn't. ${t}.`],
        any: [`${t} wrote my name down. Tonight I get to write ${t}'s.`, `I've waited a long time for this one. ${t}.`, `${t} sent me home. Now I'm sending ${p.obj} home.`] },
      payback: { dry: [`${t} voted for me, so this is only polite.`], any: [`${t} voted me out. I've cooled off since then. I'm still writing ${t}.`, `${t} made a move on me. This is mine.`, `It's just the game, ${t}. You taught me that.`] },
      betrayed: { soft: [`This one hurts, because we were friends. But ${t} let me go first.`], any: [`We were supposed to go to the end together, ${t}. You changed the plan first.`, `I trusted ${t}. That was my mistake. This is ${t}'s.`] },
      grudge: { sharp: [`${t}. The most honest vote I'll ever cast.`], any: [`I've watched ${t} from the bench, and I don't like what I've seen. ${t}.`, `${t} made a lot of enemies on the way up. We're all sitting together now.`] },
      fond: { loud: [`I love you, ${t}. You still have to go!`], soft: [`${t}, I'm so sorry. You're too good to leave in there.`], any: [`This is the hardest name I've written. ${t}. It's because you'd win.`, `${t}, I'm sorry. You played too well for me to leave you in.`] },
      friend: { any: [`I want ${friend} to win this. ${t} is the one standing in the way.`, `If I can do one thing from up here, it's help ${friend}. That means ${t} goes.`, `${t} beats ${friend} at the end. I'm not letting that happen.`] },
      threat: { dry: [`I did the math. It's ${t}.`], sharp: [`${t} is the one who wins if nobody stops ${p.obj}. So I'm stopping ${p.obj}.`],
        any: [`${t}. Nothing personal. Somebody has to go, and it should be the one who'd win.`, `I went back and forth. I keep landing on ${t}.`, `From the bench, ${t}'s game looks a lot better than it does down there. That's why.`] },
    };
    const text = line(j, POOL[why], 'vote', t);
    const why2 = { bitter: `${t} voted ${j} out`, payback: `${t} voted ${j} out`, betrayed: `${t} was ${j}'s ally`, grudge: `${j} can't stand ${t}`, fond: `${j} likes ${t}, and fears ${t} wins`, friend: `${j} is clearing the way for ${friend}`, threat: `${j} sees ${t} as the biggest threat` }[why];
    if (booth) steps.push({ k: 'scene', spot: 'voting-booth', tod: 'night', plate: booth, place: placeName('voting-booth'), time: '9:10 PM', card: i === 0, cut: i > 0, focus: [j], bg: [], places: placeScene(booth, [j]) });
    else if (i === 0) stands([j]);
    steps.push({ k: 'say', by: j, text, focus: [j], writes: t, side: [{ tab: 'why', voter: j, target: t, text: `${why2}.` }] });
    steps.push({ k: 'ballot', voter: j, voted: t, venue, side: [{ tab: 'tally', voter: j, target: t }] });
  });
  steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate: fire, place: V?.ceremony || 'Tribal Council', time: '9:20 PM', card: false, cut: true, focus: [], bg: [], places: firePlaces, seated: room, host, ceremony: true });
  clock = '9:20 PM';
  steps.push({ k: 'ballots', who: jurors, text: `${word(log.length)[0].toUpperCase()}${word(log.length).slice(1)} votes are in.` });

  // ══ 6. THE READING ══
  say(pickBy([`I'll read the votes. The person with the most votes leaves the game, tonight.`, `I'll read the votes. Once your name is read the most times, that's it. You're out.`], ep.num));
  const forElim = log.filter(v => v.votedOut === elim), rest = log.filter(v => v.votedOut !== elim);
  const tie = !!tw.juryTie && (tw.juryTiedPlayers || []).length > 1;
  const readOrder = [];
  { const a = [...forElim], b = [...rest];
    // keep it close as long as it can be: the other names and the boot's in turn, the boot's last vote held to the end
    while (a.length > 1 || b.length) { if (b.length) readOrder.push(b.shift()); if (a.length > 1) readOrder.push(a.shift()); }
    if (a.length) readOrder.push(a.shift()); }
  const need = Math.floor(log.length / 2) + 1;
  // the vote that ends it: a majority, or with none, the boot's last vote (on a tie, nothing ends it: the jury does)
  let decidesAt = -1;
  if (!tie) { let c = 0; readOrder.forEach((v, i) => { if (decidesAt < 0 && v.votedOut === elim && ++c >= need) decidesAt = i; }); if (decidesAt < 0) decidesAt = readOrder.map(v => v.votedOut).lastIndexOf(elim); }
  const t = {};
  const first = new Set();
  let restSaid = false;
  readOrder.forEach((v, i) => {
    const X = v.votedOut;
    if (decidesAt >= 0 && i > decidesAt) {
      if (!restSaid) { restSaid = true; say(`The rest, for the record.`); }
      t[X] = (t[X] || 0) + 1;
      steps.push({ k: 'read', vote: X, tally: { ...t }, focus: [X], line: `${X}.`, quick: true, of: log.length, left: readOrder.length - i - 1 });
      return;
    }
    const lead = Object.entries(t).sort((a, b) => b[1] - a[1]);
    const close = lead.length >= 2 && lead[0][1] - lead[1][1] <= 1 && lead[0][1] >= 1;
    const contend = lead.slice(0, 2).map(x => x[0]);
    const deciding = i === decidesAt;
    if (deciding) {
      say(pickBy([`Next vote...`, `Okay. Next vote...`], ep.num, i), { focus: contend, tense: true, hold: true, contend });
      steps.push({ k: 'beat', text: `${host} unfolds the paper and takes a long look at it before turning it around.`, focus: contend, tense: true, contend, drum: true });
    } else if (i === 0) say(`First vote...`);
    else if (close && i >= Math.max(2, Math.floor(readOrder.length / 2))) say(pickBy([`Next vote...`, `This one matters.`, `Okay...`, `Next...`], ep.num, 'h', i), { focus: contend, tense: true, hold: true, contend });
    t[X] = (t[X] || 0) + 1;
    const now = Object.entries(t).sort((a, b) => b[1] - a[1]);
    const count = now.map(([n, c]) => `${votes(c)} ${n}`).join(', ');
    const text = deciding ? `The jury has voted out... ${X}.${readOrder.length - i - 1 > 0 ? ` That's ${votes(t[X])}. That's enough.` : ''}`
      : now.length >= 2 && i >= 1 ? `${X}. That's ${count}.` : t[X] > 1 ? `${X}. That's ${votes(t[X])} ${X}.` : `${X}.`;
    steps.push({ k: 'read', vote: X, deciding, tally: { ...t }, focus: [X], line: text, tense: deciding || close, of: log.length, left: readOrder.length - i - 1, ...(close && !deciding && i >= 2 ? { contend } : {}) });
    // a face the first time it is read (not the boot's last: that one has its own moment)
    if (!deciding && !first.has(X) && room.includes(X)) {
      first.add(X);
      if (first.size <= 3) steps.push({ k: 'beat', focus: [X], feel: { [X]: t[X] > 1 ? 'scared' : 'surprised' },
        text: pickBy([`${X} looks up at the stands.`, `${X} nods slowly, like ${P(X).sub} expected that.`, `${X} glances along the row, trying to work out who wrote it.`], ep.num, X) });
    }
  });
  if (tie) {
    const tied = tw.juryTiedPlayers;
    steps.push({ k: 'title', kicker: 'Deadlock', name: 'A tie', faces: tied });
    say(`That's a tie. ${listOf(tied)}, ${votes(t[tied[0]] || 0)} each. Jury, you'll have to settle it between you.`, { tense: true, focus: tied });
    stands(jurors.slice(0, 1), { shot: 0 });
    steps.push({ k: 'beat', text: `The jury huddles in the stands. Nobody down at the fire can hear a word.`, focus: shots[0] || jurors.slice(0, 5) });
    fireScene(tied);
    steps.push({ k: 'beat', text: `${listOf(tied)} wait. Nobody moves.`, focus: tied, tense: true, contend: tied });
    say(`The jury has made its decision. The person leaving the game is...`, { focus: tied, tense: true, hold: true, contend: tied });
    steps.push({ k: 'read', vote: elim, deciding: true, tally: { ...t }, focus: [elim], line: `${elim}.`, tense: true, of: log.length, left: 0 });
  }

  // ══ 7. THE BOOT ══
  const saw = wrote(elim).length >= 2 || avg(elim) <= -1.5;
  const loudOne = ['loud', 'sharp'].includes(fam(elim));
  steps.push({ k: 'say', by: elim, focus: [elim], loud: !saw && loudOne, shock: !saw, act: !saw && loudOne ? { kind: 'shake', who: [elim] } : undefined,
    feel: { [elim]: saw ? 'guilty' : loudOne ? 'angry' : 'shock' }, text: saw ? line(elim, {
      dry: [`Yeah. I knew it the second they walked in.`], sharp: [`Of course. I put half of them up there.`], soft: [`I think I deserved that.`],
      any: [`I saw that coming when they walked in.`, `That's fair. I'd have voted for me too.`],
    }, 'took') : line(elim, {
      loud: [`Are you serious? What did I ever do to you?`], sharp: [`Wow. Bitter people with pens. What a combination.`], soft: [`Oh. Okay. I... okay.`], dry: [`Huh. Didn't have that one on my list.`],
      any: [`I didn't see that coming. At all.`, `Me? Really? Wow.`],
    }, 'shock') });
  // from the stands: the one who wanted it most
  const glad = log.filter(v => v.votedOut === elim).map(v => v.juror).filter(j => bond(j, elim) <= -1).sort((a, b) => bond(a, elim) - bond(b, elim))[0];
  if (glad) {
    stands([glad], { close: true });
    steps.push({ k: 'say', by: glad, focus: [glad], text: votedOut(elim, glad) ? line(glad, { sharp: [`Welcome to the bench, ${elim}.`], loud: [`Now you know how it feels!`], any: [`Now you know how it feels, ${elim}.`] }, 'glad')
      : line(glad, { dry: [`Goodnight, ${elim}.`], any: [`Sorry, ${elim}. Not that sorry.`] }, 'glad2') });
  }
  fireScene([elim]);
  // at the fire: their closest friend still playing, and whoever was next on the jury's list
  const pal = room.filter(x => x !== elim && bond(x, elim) >= 2).sort((a, b) => bond(b, elim) - bond(a, elim))[0];
  if (pal) steps.push({ k: 'beat', text: `${pal} has a hand over ${P(pal).posAdj} mouth.`, focus: [pal, elim], feel: { [pal]: 'shock' } });
  const next = Object.entries(tally).filter(([n, c]) => n !== elim && c > 0 && room.includes(n)).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (next && next !== pal) steps.push({ k: 'beat', text: `${next} sinks back in ${P(next).posAdj} seat. That was close.`, focus: [next], feel: { [next]: 'relief' } });
  steps.push({ k: 'out', who: elim, focus: [elim] });

  if (ep.riChoice) {
    steps.forEach(x => { if (x.k === 'out') x.island = true; });
    say(ep.riChoice === 'RESCUE ISLAND' ? `${elim}, you're not going home. You're going to Rescue Island.` : `${elim}, grab your torch. You have one more choice to make.`, { focus: [elim] });
  } else {
    const last = { kind: 'say', by: elim, text: wrote(elim).length ? line(elim, {
      soft: [`Voted out by the people I voted out. I guess that's fair. It still hurts.`], loud: [`I'll see all of you on that bench. Every single one of you!`],
      any: [`Voted out by the people I voted out. I suppose that's fair.`, `They had a long time to think about me up there. I should have known.`],
    }, 'last') : line(elim, {
      soft: [`I'm proud of how I played. I just wish I'd been the one to finish it.`], sharp: [`I didn't even get to play tonight. The jury played for me.`],
      any: [`I didn't even get a vote tonight. That's the part that stings.`],
    }, 'last2') };
    const after = next ? [{ kind: 'conf', by: next, text: line(next, {
      sharp: [`My name came out of that jury ${votes(tally[next])}. I'll be remembering who.`], soft: [`I was ${tally[next] === 1 ? 'one vote' : `${votes(tally[next])}`} away from that. I don't think I've breathed since.`],
      any: [`The jury had my name too. ${votes(tally[next])[0].toUpperCase()}${votes(tally[next]).slice(1)}. I'm still here, and I'm not wasting it.`],
    }, 'after') }] : [];
    walkOut(steps, say, { ep, venue, elim, host, story: { exit: [last], exitKind: 'alone', after } });
  }
  return { id: 'jury-elimination', kind: 'tribal', venue, ep: ep.num, label: 'The Jury Votes', host, steps: forwardClock(steps), elim, readTally: true };
}
