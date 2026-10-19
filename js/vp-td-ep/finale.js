// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/finale.js — the finale on the stepped stage, every format
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-09): "finale dialogue and viewer for all types of finales". The finale was the one
// episode still on the classic pages. Here:
//   tdFinalTribalScreen   the jury's night: the finalists make their case, each juror asks, the jury
//                         votes, the votes are read until the winner has them, and only then does each
//                         juror say why (traditional, fire-making, Koh-Lanta, jury cut: every format with
//                         a jury)
//   tdFinaleDecisionScreen  who the last immunity winner takes and who they cut, said to their faces
//                         (fire-making's decision, the jury cut / fan vote's final cut, Koh-Lanta's choice)
//   tdFanFinaleScreen     the fan vote: each finalist's campaign, the jury's reactions, the percentages
//   tdWinnerScreen        the winner, as the camp sees it (every format; the challenge finales' only
//                         stepped moment, their races stay classic like every challenge)
//
// PURE. Who is in the final, what they said, how each juror voted and why, who the immunity winner
// took: all the engine's record (finale.js). The host's lines and the reactions are worded here, in each
// person's voice (td/story/voice-family.js), never deciding anything.
import { placeScene, plateKey, venueOf, VENUES, cleanText } from './steps.js';
import { familyOf } from '../td/story/voice-family.js';
import { TD_MARKS } from './marks.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const fam = n => { try { return familyOf(n); } catch { return 'plain'; } };
const V = (n, o, ...k) => pickBy(o[fam(n)] || o.any, n, ...k);
// ...and inside one screen, nobody says what somebody else just said: their own voice's line not yet used, else any
// line not yet used (a local memory per screen, so a rebuilt screen says the same thing again)
const VOnce = () => { const used = new Set(); return (n, o, ...k) => {
  const own = (o[fam(n)] || []).filter(x => !used.has(x)), any = (o.any || []).filter(x => !used.has(x));
  const t = pickBy(own.length ? own : any.length ? any : (o[fam(n)] || o.any), n, ...k); used.add(t); return t; }; };
const listOf = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };
const unquote = t => cleanText(String(t || '').trim().replace(/^["“]+|["”]+$/g, '').replace(/…$/, '.'));
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const word = n => WORD[n] || String(n);

// the ceremony set at night (where every vote of the season happened), or the venue's public place
function ceremony(ep, o, tod = 'night') {
  const venue = venueOf(ep, o);
  // Total Drama Action's finale is in the Aftermath studio (the user, 2026-10-10)
  if (venue === 'film-lot' && TD_MARKS['islands/aftermath-studio-day']) return { venue, key: 'islands/aftermath-studio-day', spot: 'aftermath-studio' };
  const key = plateKey(venue, 'ceremony', tod) || plateKey(venue, 'ceremony', 'night') || plateKey(venue, VENUES[venue]?.public || 'communal-grounds', tod);
  return { venue, key, spot: plateKey(venue, 'ceremony', tod) || plateKey(venue, 'ceremony', 'night') ? 'ceremony' : (VENUES[venue]?.public || 'communal-grounds') };
}
function grounds(ep, o, tod = 'day') {
  const venue = venueOf(ep, o), pub = VENUES[venue]?.public || 'communal-grounds';
  return { venue, spot: pub, key: plateKey(venue, pub, tod) || plateKey(venue, pub, 'day') };
}
const seasonOf = o => o.seasonName || 'this season';
// where the jury sits (tools/td-camp/venues/zz_zzzzjury.py, the user's frames): the wide shot, and a close
// one where the venue has it. Null where a venue has none: the jury then stands at the ceremony as before.
export function juryPlates(ep, o) {
  const venue = venueOf(ep, o);
  // what each frame is: the tiki stage is painted at night, the big top, the cave and the lounge are indoors,
  // the Hawaiian beach is in the day
  return { wide: plateKey(venue, 'jury-bleachers', 'night'), close: plateKey(venue, 'jury-close', 'night'),
    night: venue === 'survival-island', indoor: ['carnival', 'hosted-camp', 'film-lot'].includes(venue), day: venue === 'world-tour' };
}
// the jury in the stands: the front row first, left to right, then the row behind, each person sized to the
// gap beside them (placeScene's group seating picks the centre seats of every row, and they overlapped)
export function seatJury(key, names) {
  const seats = ((TD_MARKS[key] || {}).m || []).filter(m => m.kind === 'seat' && m.u > .1 && m.u < .9 && m.v > .38 && m.v < .78)
    .sort((a, b) => b.v - a.v || a.u - b.u);
  const out = {};
  names.slice(0, seats.length).forEach((n, i) => {
    const m = seats[i];
    const row = seats.filter(x => Math.abs(x.v - m.v) < .03).map(x => x.u).sort((a, b) => a - b);
    const gap = row.length > 1 ? Math.min(...row.slice(1).map((u, k) => u - row[k])) : .2;
    out[n] = { u: m.u, v: m.v, s: m.s, sit: true, h: Math.max(8, Math.min(m.s * 95, (gap * .95) / .5625 * 100)) };
  });
  return out;
}
export const seatsOn = key => ((TD_MARKS[key] || {}).m || []).filter(m => m.kind === 'seat' && m.u > .1 && m.u < .9 && m.v > .38 && m.v < .78).length;

// ══════════════════════════════════════════════════════════════════════
// FINAL TRIBAL COUNCIL — the case, the questions, the vote, the reasons
// ══════════════════════════════════════════════════════════════════════
export function tdFinalTribalScreen(ep, o = {}) {
  const jr = ep.juryResult;
  const finalists = ep.finaleFinalists || [];
  if (!jr?.reasoning?.length || finalists.length < 2) return null;
  const host = o.host || 'Chris';
  const C = ceremony(ep, o);
  if (!C.key) return null;
  const bond = bondOf(ep);
  const pos = n => { try { return o.pronouns?.(n)?.posAdj || 'their'; } catch { return 'their'; } };
  const ftc = ep.ftcData || {};
  const jurors = jr.reasoning.map(r => r.juror);
  const winner = ep.winner || jr.winner || Object.entries(jr.votes || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });

  const J = juryPlates(ep, o);
  const seated = J.wide ? jurors.slice(0, Math.max(1, seatsOn(J.wide))) : [];
  // a cut to the stands (all of them seated, the one talking in focus), or to a close shot of one juror
  const toJury = (focus, close = false) => {
    const key = close && J.close ? J.close : J.wide;
    if (!key) return;
    const who = close && J.close ? focus.slice(0, 1) : seated;
    // the plate's own hour: these frames are painted at their time already (the tiki stage is night), and a
    // day plate asked for at night is darkened a second time
    steps.push({ k: 'scene', spot: key === J.close ? 'jury-close' : 'jury-bleachers', tod: /-night$/.test(key) ? 'night' : 'day', plate: key, place: 'The Jury', time: J.day ? 'Day' : 'Night', card: false,
      focus, bg: [], places: seatJury(key, who), host: null, wide: key !== J.close, still: true, ...(J.indoor ? { noWx: true } : {}), ...(J.night ? { nightFrame: true } : {}) });
  };
  const toFinal = (focus = finalists) => steps.push({ k: 'scene', spot: C.spot, tod: 'night', plate: C.key, place: 'Final Tribal Council', time: 'Night', card: false,
    focus, bg: [], places: placeScene(C.key, J.wide ? finalists : [...finalists, ...jurors.slice(0, 7)], [], { host }), host, wide: true });
  steps.push({ k: 'scene', spot: C.spot, tod: 'night', plate: C.key, place: 'Final Tribal Council', time: 'Night', card: true,
    focus: finalists, bg: [], places: placeScene(C.key, J.wide ? finalists : [...finalists, ...jurors.slice(0, 7)], [], { host }), host, wide: true });
  say(pickBy([
    `${listOf(finalists)}. Out of everybody who started this season, you're the last ${word(finalists.length)}. Tonight, for once, none of you get a vote.`,
    `Welcome to the final Tribal Council. ${listOf(finalists)}, everything you did to get here is about to be judged by the people you did it to.`,
  ], ep.num, finalists.join('|')));
  if (J.wide) {
    toJury(seated);
    steps.push({ k: 'beat', text: `The jury files in and takes their seats: ${listOf(jurors)}. Every one of them was voted out by somebody in this game, and some of them by somebody sitting right across from them.`, focus: seated, act: { kind: 'arrive', who: seated } });
    toFinal();
  } else steps.push({ k: 'beat', text: `The jury walks in: ${listOf(jurors)}. Every one of them was voted out by somebody in this game, and some of them by somebody sitting right here.`,
    focus: jurors.slice(0, 6), act: { kind: 'arrive', who: jurors.slice(0, 7) } });
  steps.push({ k: 'title', kicker: 'The Finale', name: 'Final Tribal Council', faces: finalists });
  say(`Finalists, this is the last time you get to make your case. Jury, this is the last time you get to ask. Let's start with why each of you thinks you should win.`);

  // the case: each finalist's own opening (finale.js generateFTCData), asked for by the host
  finalists.forEach((f, i) => {
    const lines = (ftc.finalistStatements?.[f] || []).map(unquote).filter(Boolean);
    if (!lines.length) return;
    // ("you first" only for the first: read 2026-10-14, "Hannah, you first." and "Richard, you first." after Diego had spoken)
    say(pickBy(i === 0 ? [`${f}.`, `${f}, you first.`, `${f}, why you?`] : [`${f}.`, `${f}, your turn.`, `${f}, why you?`], ep.num, f, i), { focus: [f] });
    steps.push({ k: 'say', by: f, focus: [f], text: lines.join(' ') });
  });

  // the jury asks (generateFTCData jurorQA): the question to their face, the answer, and how it lands
  const QA = (ftc.jurorQA || []).filter(q => q.juror && q.targetForQuestion && q.question);
  if (QA.length) say(pickBy([`Jury, the floor is yours.`, `Jury. Ask whatever you want.`], ep.num, 'qa'));
  QA.forEach((q, i) => {
    const t = q.targetForQuestion, j = q.juror;
    if (J.wide) toJury([j], !!J.close && i % 2 === 1);
    steps.push({ k: 'say', by: j, focus: J.wide ? [j] : [j, t], text: unquote(q.question), tense: bond(j, t) <= -2 });
    if (J.wide) toFinal([t]);
    if (q.response) steps.push({ k: 'say', by: t, focus: J.wide ? [t] : [t, j], text: unquote(q.response) });
    // the juror's face says whether that worked (their bond with who answered), never how they will vote
    const b = bond(j, t);
    if (i % 2 === 0) steps.push({ k: 'beat', focus: J.wide ? [t] : [j], text: (J.wide ? 'Up in the stands, ' : '') + (b >= 3 ? pickBy([`${j} nods slowly.`, `${j} almost smiles.`], j, ep.num, i)
      : b <= -2 ? pickBy([`${j} folds ${pos(j)} arms and doesn't say anything.`, `${j} shakes ${pos(j)} head, just slightly.`], j, ep.num, i)
        : pickBy([`${j} sits back and thinks about it.`, `${j} writes nothing down, but doesn't look away either.`], j, ep.num, i)) });
  });

  // the vote: each juror walks up, and the name stays theirs until it is read
  say(`Jury, it's time to vote. This time, you're not voting somebody out. You're voting for the winner.`, { tense: true });
  if (J.wide) toJury(seated);
  const swung = new Set((ep.ftcSwings || []).map(s => s.juror || s.name).filter(Boolean));
  const saidJ = new Set();
  const fresh = (n, o2, ...k) => { const list = o2[fam(n)] || o2.any; const free = list.filter(x => !saidJ.has(x)); const pool = free.length ? free : [...(o2.any || []), ...Object.values(o2).flat()].filter(x => !saidJ.has(x)); const x = pickBy(pool.length ? pool : list, n, ...k); saidJ.add(x); return x; };
  jurors.forEach((j, i) => {
    steps.push({ k: 'conf', by: j, text: swung.has(j) ? fresh(j, {
      loud: ["I walked in sure of my vote, and then I heard that answer. I changed it. Don't ask me to explain it, I just did!"],
      sharp: ["I had a name before tonight. One answer changed it. Somebody up there should be very happy, and somebody should be very worried."],
      soft: ["I changed my vote tonight. I didn't think I would. Something one of them said really got to me."],
      any: ["I came in with one name and I'm leaving with another. That's what tonight was for."],
    }, 'jvs', ep.num, i) : fresh(j, {
      loud: ["I knew who I was voting for before I sat down, and nothing up there changed my mind!", "That was a lot of talking. My vote didn't move an inch.", "I've been waiting all season to write this name, and I'm writing it big!"],
      sharp: ["Some of those answers were good. Some of them were rehearsed. I can tell the difference.", "I've had weeks on that bench to decide. Tonight just confirmed it.", "One of them answered the question. The others answered a question they wished I'd asked."],
      soft: ["This is the hardest vote I've had to write all season, and I don't even get to vote anybody out.", "I'm voting for the person I think played it best. I hope they know how much this means.", "My hand is shaking. It's a good shake, I think."],
      dry: ["I've been ready to write this name for about three weeks.", "They all talked. Only one of them actually answered me.", "I wrote the name nice and big, so there's no confusion."],
      any: ["I know exactly who I'm voting for. I knew before we even started.", "Tonight helped. Tonight made it clear.", "I listened to all of it. I'm voting for the game I'd want to have played.", "I came in with a name, and I'm leaving it in that urn.", "Whatever happens next, this vote is the one I'll stand by."],
    }, 'jv', ep.num, i), focus: [j] });
    if (i === Math.floor(jurors.length / 2)) steps.push({ k: 'beat', text: `One by one, the jurors walk up, write a name and drop it in the urn.`, focus: finalists });
  });

  // the reading: alternating finalists, the winner's clinching vote read last (and then it stops). A tie
  // (finale.js juryTiebreak) is read in full, lands on the tie, and goes to the revote, then if that ties
  // too to the finalist who was cut, or to two winners.
  const tb = ep.juryTiebreak;
  if (J.wide) toFinal();
  say(pickBy([`I'll read the votes.`, `I'll go tally the votes.`, `Okay. I have the votes.`], ep.num, 'read'));
  const readRound = (reasoning, win, clinchIt, tag) => {
    const need = Math.floor(reasoning.length / 2) + 1;
    const pools = {};
    reasoning.forEach(r => (pools[r.votedFor] ||= []).push(r));
    const rest = Object.keys(pools).filter(k => k !== win);
    const order = [], tally = {};
    let turn = 0;
    while (order.length < reasoning.length) {
      const other = turn % 2 === 0 ? rest.find(k => pools[k]?.length) : null;
      let pick = other || ((tally[win] || 0) < need - 1 || !rest.some(k => pools[k]?.length) ? win : rest.find(k => pools[k]?.length));
      if (!pools[pick]?.length) pick = Object.keys(pools).find(k => pools[k].length);
      if (!pick) break;
      order.push(pools[pick].shift()); tally[pick] = (tally[pick] || 0) + 1; turn++;
      if (clinchIt && pick === win && tally[win] >= need) break;
    }
    const t = {};
    order.forEach((r, i) => {
      t[r.votedFor] = (t[r.votedFor] || 0) + 1;
      const last = clinchIt && i === order.length - 1 && r.votedFor === win && t[win] >= need;
      if (last) {
        say(`${seasonOf(o) === 'this season' ? 'The winner' : `The winner of ${seasonOf(o)}`}...`, { focus: finalists, tense: true, hold: true });
        steps.push({ k: 'beat', text: `${host} unfolds the last one and takes a long look at it before turning it around.`, focus: finalists, tense: true });
      }
      const lead = Object.entries(t).sort((a, b) => b[1] - a[1]);
      const level = lead.length >= 2 && lead.every(x => x[1] === lead[0][1]);
      const line = last ? `${win}!` : lead.length >= 2 && i >= 1 ? (level ? `${r.votedFor}. That's ${word(lead[0][1])} vote${lead[0][1] === 1 ? '' : 's'} each.` : `${r.votedFor}. That's ${listOf(lead.map(([n, k]) => `${word(k)} ${n}`))}.`) : `${r.votedFor}.`;
      steps.push({ k: 'read', vote: r.votedFor, revote: tag === 'revote', deciding: last, tally: { ...t }, focus: [r.votedFor], line, tense: last || (lead.length >= 2 && lead[0][1] - lead[1][1] <= 1) });
    });
  };
  let crowned = winner;
  if (!tb) readRound(jr.reasoning, winner, true, 'first');
  else {
    readRound(jr.reasoning, tb.tied?.[0], false, 'first');
    const tied = tb.tied || [];
    say(`That's a tie. ${listOf(tied)}, the jury couldn't split you.`, { tense: true, focus: tied });
    steps.push({ k: 'beat', text: `Nobody moves. ${listOf(tied)} look at each other, then at the jury.`, focus: tied, tense: true });
    say(`Jury, you're voting again, and this time it's only between ${listOf(tied)}.`, { focus: jurors.slice(0, 5) });
    steps.push({ k: 'beat', text: `The jurors walk back up to the urn, one at a time.`, focus: jurors.slice(0, 6) });
    const rv = tb.revote?.reasoning || [];
    if (tb.method === 'revote') readRound(rv, tb.winner, true, 'revote');
    else {
      readRound(rv, tied[0], false, 'revote');
      if (tb.method === 'finalist-tiebreaker' && tb.tiebreaker) {
        say(`Still tied. So it comes down to one person: ${tb.tiebreaker}, the last one cut from this game. ${tb.tiebreaker}, who wins?`, { tense: true, focus: [tb.tiebreaker, ...tied] });
        steps.push({ k: 'say', by: tb.tiebreaker, focus: [tb.tiebreaker, tb.winner], tense: true, text: `${tb.winner}.` });
        if (tb.tiebreakerReason) steps.push({ k: 'beat', text: tb.tiebreakerReason, focus: [tb.tiebreaker] });
        crowned = tb.winner;
      } else {
        say(`Still tied. For the first time ever, there are two winners. ${listOf(tied)}!`, { tense: true, focus: tied });
        crowned = tied[0];
      }
    }
  }
  winnerMoment(steps, ep, o, crowned, finalists, jurors, bond, J.wide ? () => toJury(seated) : null);

  // and now the jury says why (generateFTCData / the jury vote's reasons), with the result known
  say(`Jury, you don't have to explain yourselves. But some of you want to.`);
  if (J.wide) toJury(seated);
  jr.reasoning.forEach((r, i) => {
    steps.push({ k: 'conf', by: r.juror, text: unquote(r.reason), focus: [r.juror, r.votedFor], side: [{ tab: 'tally', voter: r.juror, target: r.votedFor }] });
  });
  return { id: 'ftc', kind: 'tribal', venue: C.venue, ep: ep.num, label: 'Final Tribal Council', host, steps };
}

// the moment: the winner, the runners-up, the jury
function winnerMoment(steps, ep, o, winner, finalists, crowd, bond, toCrowd = null) {
  if (!winner) return;
  steps.push({ k: 'say', by: winner, focus: [winner], loud: true, act: { kind: 'roundwin', who: [winner], lose: finalists.filter(f => f !== winner) }, text: V(winner, {
    loud: ['I WON! I actually won! Are you serious?!', 'Yes! YES! Somebody pinch me!'],
    sharp: ['I told you all I knew what I was doing.', 'Well. I suppose that settles it.'],
    soft: ["Oh my gosh. I can't... thank you. Thank you, all of you.", "I don't know what to say. I really don't."],
    dry: ['Huh. I won. That just happened.', 'Okay. I think I need to sit down.'],
    any: ["I can't believe it. I won!", 'I won. I actually won.'],
  }, 'win', ep.num) });
  const VR = VOnce();
  finalists.filter(f => f !== winner).forEach((f, i) => {
    const b = bond(f, winner);
    steps.push({ k: 'say', by: f, focus: [f, winner], text: b >= 3 ? VR(f, {
      loud: ["Get over here! I'm so happy for you, I could scream!", "YES! That's my friend! That's my friend right there!"], soft: ["Come here. You deserve this. You really do."],
      any: ['Congratulations. Honestly, you earned it.', "I'm so happy for you. I really am."],
    }, 'ru', ep.num, i) : b <= -2 ? VR(f, {
      loud: ['Unbelievable. Un-be-lievable.', "Are you kidding me? Seriously?"], sharp: ['Congratulations. I hope the jury enjoys what they just did.'], dry: ['Great. Wonderful. Good for you.'],
      any: ["Congrats. I mean it. Mostly.", "Fine. Congratulations. I'm going to go stand over there now."],
    }, 'rx', ep.num, i) : VR(f, {
      soft: ["I'm a little crushed, but I'm happy for you. I mean that."], dry: ['Second place. I can live with that. Probably.'],
      any: ['Well played. You got me.', "It hurts, but you earned it.", "Okay. Okay. Good game. You played it better."],
    }, 'rn', ep.num, i) });
  });
  if (crowd?.length && toCrowd) toCrowd();
  if (crowd?.length) steps.push({ k: 'beat', text: crowd.length > 4 ? `${crowd.slice(0, 4).join(', ')} and the rest of the jury are on their feet.` : `${listOf(crowd)} ${crowd.length === 1 ? 'is' : 'are'} on their feet.`, focus: [winner, ...crowd.slice(0, 4)], applause: 'big' });
}

// ══════════════════════════════════════════════════════════════════════
// THE DECISION — who the last immunity winner takes, and who they cut
// ══════════════════════════════════════════════════════════════════════
export function tdFinaleDecisionScreen(ep, o = {}) {
  const fm = ep.firemakingDecision, fc = ep.finalCut, kl = ep.klChoice;
  if (!fm && !fc && !kl) return null;
  const host = o.host || 'Chris';
  const C = ceremony(ep, o);
  if (!C.key) return null;
  const bond = bondOf(ep);
  const imm = fm?.immunityWinner || fc?.winner || kl?.winner;
  const taken = fm ? [fm.saved] : fc ? [].concat(fc.brought || []) : [kl.chosen];
  const cut = fm ? null : fc ? fc.cut : kl.eliminated;
  const toFire = fm ? (fm.competitors || []) : [];
  const people = [...new Set([imm, ...taken, ...(cut ? [cut] : []), ...toFire])].filter(Boolean);
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: C.spot, tod: 'night', plate: C.key, place: 'The Decision', time: 'Night', card: true, focus: [imm], bg: [], places: placeScene(C.key, people, [], { host }), host, wide: true });
  if (fm) say(`${imm}, you won the last immunity, so you're in the final. And you get to choose one person to take with you. The other two make fire, and whoever loses goes home.`);
  else if (kl) say(`${imm}, you won the perch. You choose who comes to the final with you. The other one goes home, tonight, by your hand.`);
  else say(`${imm}, you won the last immunity. ${taken.length > 1 ? `You choose who sits next to you at the end.` : `You choose who comes with you to the end.`} Whoever you don't choose goes home tonight.`);
  steps.push({ k: 'title', kicker: 'The Finale', name: 'The Decision', faces: [imm] });
  // why (the engine's reason): a friend, or the one they can beat
  const strategic = fm ? fm.savedReason === 'strategic' : fc ? !fc.reasoning?.loyaltyDriven : kl.reason !== 'bond';
  steps.push({ k: 'conf', by: imm, focus: [imm], text: strategic ? V(imm, {
    sharp: [`I'm taking the person I can beat. That's not cruel. That's the whole game.`], loud: [`I ran the numbers in my head a hundred times. There's only one answer that wins me this.`],
    soft: [`I hate this. I'm choosing with my head, and my heart is going to be mad at me for a while.`], any: [`I have to take who I can beat in front of the jury. Anything else is me handing somebody the money.`],
  }, 'dw', ep.num) : V(imm, {
    soft: [`I made a promise, and I'm keeping it, even if it costs me.`], loud: [`Loyalty! That's the answer! I'm not even thinking about it!`],
    sharp: [`Everybody's going to say it's the wrong move. They can say it from the jury.`], any: [`I'm taking the person who got me here. I couldn't live with anything else.`],
  }, 'dl', ep.num) });
  say(`${imm}, who are you taking?`, { tense: true, focus: [imm, ...taken, ...(cut ? [cut] : []), ...toFire] });
  steps.push({ k: 'say', by: imm, focus: [imm, ...taken], tense: true, text: taken.length > 1 ? `${listOf(taken)}. I'm taking ${listOf(taken)}.` : `${taken[0]}.` });
  taken.forEach((t, i) => steps.push({ k: 'say', by: t, focus: [t, imm], text: V(t, {
    loud: [`Yes! Thank you! You won't regret it!`], soft: [`Thank you. I mean it. Thank you.`], sharp: [`Smart choice.`], dry: [`Well. That's a relief.`], any: [`Thank you. Seriously.`],
  }, 'tk', ep.num, i) }));
  if (cut) {
    const b = bond(cut, imm);
    const betrayed = kl?.betrayal || (b >= 2);
    steps.push({ k: 'say', by: cut, focus: [cut, imm], loud: !betrayed, text: betrayed ? V(cut, {
      soft: [`I thought it was going to be me. I really did. Okay.`], loud: [`After everything?! After EVERYTHING?`], sharp: [`I see. So that's what all those promises were worth.`], any: [`Wow. I didn't see that coming. Not from you.`],
    }, 'cb', ep.num) : V(cut, {
      loud: [`Of course. Of course it's me.`], sharp: [`It's the right move. I'd have done the same to you.`], soft: [`I get it. I do. It still hurts.`], dry: [`Called it.`], any: [`I knew it was coming. Doesn't make it easier.`],
    }, 'cc', ep.num) });
    steps.push({ k: 'out', who: cut, focus: [cut] });
  }
  if (toFire.length === 2) {
    say(`${listOf(toFire)}. You two are going to make fire. Whoever gets theirs to burn through the rope first is in the final. The other goes home.`, { tense: true, focus: toFire });
    toFire.forEach((p, i) => steps.push({ k: 'conf', by: p, focus: [p], text: V(p, {
      loud: [`Fire? Fine! I'll make the biggest fire this island has ever seen!`], soft: [`My hands are shaking already. I've practised this every night. I just have to do it once more.`],
      sharp: [`${imm} thinks I'm the easier one to beat. ${imm} is about to find out how wrong that is.`], any: [`It all comes down to a bit of rope and a fire. I'm not going home now.`],
    }, 'fr', ep.num, i) }));
  }
  return { id: 'finale-decision', kind: 'tribal', venue: C.venue, ep: ep.num, label: 'The Decision', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE FAN VOTE FINALE — the campaign, the jury watching, the percentages
// ══════════════════════════════════════════════════════════════════════
export function tdFanFinaleScreen(ep, o = {}) {
  const fc = ep.fanCampaign, fv = ep.fanVoteResult;
  if (!fc?.phases?.length || !fv?.winner) return null;
  const host = o.host || 'Chris';
  const G = grounds(ep, o, 'night');
  if (!G.key) return null;
  const finalists = fc.finalists || fc.phases.map(p => p.finalist);
  const jury = [...new Set(fc.phases.flatMap(p => (p.juryReactions || []).map(r => r.juror)))];
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: G.spot, tod: 'night', plate: G.key, place: 'The Fan Vote', time: 'Night', card: true, focus: finalists, bg: [], places: placeScene(G.key, [...finalists, ...jury.slice(0, 6)], [], { host }), host, wide: true });
  say(`No jury tonight. The people at home decide who wins. ${listOf(finalists)}, this is your one chance to talk to them.`);
  steps.push({ k: 'title', kicker: 'The Finale', name: 'The Fan Vote', faces: finalists });
  fc.phases.forEach((ph, i) => {
    say(pickBy([`${ph.finalist}, the camera's yours.`, `${ph.finalist}. Make your case.`], ep.num, ph.finalist), { focus: [ph.finalist] });
    steps.push({ k: 'say', by: ph.finalist, focus: [ph.finalist], text: unquote(ph.speech) });
    const fans = (ph.fanReactions || []).map(r => r.text).filter(Boolean).slice(0, 3);
    if (fans.length) steps.push({ k: 'beat', focus: [ph.finalist], text: `The live comments roll in: ${fans.map(x => `"${x}"`).join(', ')}.`, side: [{ tab: 'log', text: `${ph.finalist}: the fans are ${ph.pulseReaction || 'watching'}` }] });
    (ph.juryReactions || []).slice(0, 2).forEach(r => steps.push({ k: 'say', by: r.juror, focus: [r.juror, ph.finalist], text: unquote(r.text) }));
  });
  say(`The votes are in. Here's how the fans voted, from the bottom.`, { tense: true });
  const ranks = [...(fv.rankings || finalists)].reverse();
  ranks.forEach((n, i) => {
    const last = n === fv.winner;
    if (last) say(`And with ${fv.percentages?.[n] ?? '?'}% of the vote, the winner of ${seasonOf(o)}...`, { tense: true, hold: true, focus: finalists });
    steps.push({ k: 'say', by: host, host: true, focus: [n], text: last ? `${n}!` : `${n}, ${fv.percentages?.[n] ?? '?'}%.`, side: [{ tab: 'log', text: `${n}: ${fv.percentages?.[n] ?? '?'}%` }] });
  });
  winnerMoment(steps, ep, o, fv.winner, finalists, jury, bondOf(ep));
  return { id: 'fan-finale', kind: 'tribal', venue: G.venue, ep: ep.num, label: 'The Fan Vote', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE WINNER — the camp's last night, as the winner's
// ══════════════════════════════════════════════════════════════════════
export function tdWinnerScreen(ep, o = {}) {
  const winner = ep.winner;
  if (!winner) return null;
  const host = o.host || 'Chris';
  const G = grounds(ep, o, 'night');
  if (!G.key) return null;
  const finalists = (ep.finalChallengePlacements?.length ? ep.finalChallengePlacements : ep.finaleFinalists) || [winner];
  const byChallenge = !ep.juryResult && !ep.fanVoteResult;
  const runners = finalists.filter(f => f !== winner);
  const fans = ep.fanFavorite && ep.fanFavorite !== winner ? ep.fanFavorite : null;
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: G.spot, tod: 'night', plate: G.key, place: 'The Winner', time: 'Night', card: true, focus: [winner], bg: [], places: placeScene(G.key, [winner, ...runners].slice(0, 9), [], { host }), host, wide: true });
  if (byChallenge) {
    say(`${listOf(finalists)}: one last race, winner takes everything. And it's over.`);
    say(`The winner of ${seasonOf(o)}... ${winner}!`, { tense: true, focus: [winner] });
    winnerMoment(steps, ep, o, winner, finalists, [], bondOf(ep));
  } else {
    say(pickBy([`${winner}. The jury has spoken, and it's yours.`, `Ladies and gentlemen, ${winner}!`], ep.num, winner), { focus: [winner] });
  }
  steps.push({ k: 'beat', text: `Everybody who played this season comes running out of the dark at once, and ${winner} disappears under the pile.`, focus: [winner], applause: 'big' });
  steps.push({ k: 'title', kicker: 'Winner', name: winner, faces: [winner] });
  steps.push({ k: 'conf', by: winner, focus: [winner], text: V(winner, {
    loud: ["I came here to win, and I WON! I'm going to be screaming about this for a year!"],
    sharp: ["Everybody spent this whole season trying to work out how to beat me. Turns out the answer was: you don't."],
    soft: ["I keep thinking about the first day, when I didn't know anybody. Now I'm the one who won. I don't think it's sunk in yet."],
    dry: ["I won. I'm going to need someone to tell me that a few more times."],
    any: ["I won. After everything, I actually won. I don't know how to feel yet. Happy. Mostly happy."],
  }, 'wc', ep.num) });
  const VW = VOnce();
  runners.forEach((f, i) => steps.push({ k: 'conf', by: f, focus: [f], text: VW(f, {
    loud: ["So close! SO close! I'm going to think about that last moment for the rest of my life!", "I was RIGHT THERE! One more vote! That's going to haunt me forever!"],
    sharp: ["Second is first loser. I know that. I'll be fine. Eventually."],
    soft: ["I didn't win, and that hurts. But I got further than I ever thought I would."],
    dry: ["Runner-up. It has a nice ring to it. Not as nice as winner."],
    any: ["It wasn't my night. But I made it to the end, and nobody can take that away from me."],
  }, 'wr', ep.num, i) }));
  if (fans) say(`And before we go: the fans have their own favourite. ${fans}, America loves you.`, { focus: [fans] });
  say(pickBy([`That's it! That's the season! Goodnight, everybody!`, `And that's ${seasonOf(o)}. Thanks for watching!`], ep.num, 'bye'));
  return { id: 'winner', kind: 'camp', venue: G.venue, ep: ep.num, label: 'The Winner', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE BENCHES — at a challenge finale, everybody voted off picks a side
// ══════════════════════════════════════════════════════════════════════
// Total Drama Island's last episode: the losers sit in the bleachers behind the finalist they want to win, under a sign
// with that finalist's face on it (the user, 2026-10-15, with the set: tools/td-camp/venues/zz_zzzzzbenches.py). Who
// sits where and why is the engine's (finale.js generateBenchAssignments); here they walk over one at a time, in the
// order they went home, and say why. One scene, so the set is not rebuilt for every walk: each of them is off the set
// until their step (scene.arrives, stage.js castAt).
// the painted signs on each set, left then right, as fractions of the frame (a venue's own set gets its own here)
const BENCH_SIGNS = {
  'hosted-camp/benches-day': [[.115, .5456, .2094, .6411], [.8275, .5467, .9225, .6411]],
  'survival-island/benches-day': [[.1175, .5444, .2094, .64], [.8237, .5456, .9163, .64]],
  'carnival/benches-day': [[.115, .5211, .2081, .6144], [.8263, .52, .9213, .6144]],
  'film-lot/benches-day': [[.1194, .5456, .2131, .6411], [.8331, .5467, .9275, .6422]],
  'world-tour/benches-day': [[.1125, .5244, .2087, .62], [.83, .5267, .9256, .6233]],
};
export function tdBenchesScreen(ep, o = {}) {
  const A = ep.benchAssignments || {}, R = ep.benchReasons || {};
  const finalists = Object.keys(A);
  // two sets of bleachers, two signs: a three-way final keeps its classic page
  if (finalists.length !== 2) return null;
  const venue = venueOf(ep, o);
  // (a venue without its own bleachers, the islands or Redemption, uses the camp's)
  const key = plateKey(venue, 'benches', 'day') || plateKey('hosted-camp', 'benches', 'day');
  const signs = key && BENCH_SIGNS[key];
  if (!signs) return null;
  const host = o.host || 'Chris';
  const bond = bondOf(ep);
  const M = (TD_MARKS[key] || {}).m || [];
  // each side's seats, the front tier first, from the middle of the set outward
  const seats = [0, 1].map(k => M.filter(m => m.kind === 'seat' && (k ? m.u > .5 : m.u < .5)).sort((a, b) => b.v - a.v || (k ? a.u - b.u : b.u - a.u)));
  const stands = M.filter(m => m.kind === 'stand').sort((a, b) => a.u - b.u);
  const hm = M.find(m => m.kind === 'host');
  const places = {};
  finalists.forEach((f, i) => { const m = stands[i] || { u: i ? .59 : .41, v: .71, s: .12 }; places[f] = { u: m.u, v: m.v, s: m.s }; });
  if (hm) places[host] = { u: hm.u, v: hm.v, s: hm.s, host: true };
  // who walks over, in the order they went home (the engine's pool is gs.eliminated, in order)
  const order = [...new Set([...Object.keys(R), ...finalists.flatMap(f => A[f])])].filter(n => finalists.some(f => (A[f] || []).includes(n)));
  if (!order.length) return null;
  const sideOf = n => finalists.find(f => (A[f] || []).includes(n));
  const used = [0, 0];
  for (const n of order) {
    const k = finalists.indexOf(sideOf(n)), m = seats[k][used[k]++];
    // more of them than seats: they stand along the front of their bleachers
    places[n] = m ? { u: m.u, v: m.v, s: m.s, sit: true, h: Math.max(8, m.s * 78) }
      : { u: k ? .62 + (used[k] - seats[k].length) * .05 : .38 - (used[k] - seats[k].length) * .05, v: .8, s: .13, crowd: true };
  }
  const arrives = {};
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  steps.push({ k: 'scene', spot: 'benches', tod: 'day', plate: key, place: 'The Benches', time: 'Day', card: true, focus: finalists, bg: [], places, host, wide: true, arrives,
    signs: finalists.map((f, i) => ({ x0: signs[i][0], y0: signs[i][1], x1: signs[i][2], y1: signs[i][3], face: f })) });
  steps.push({ k: 'title', kicker: 'The Finale', name: 'Pick a Side', faces: finalists, vs: true });
  say(`Everybody who got voted off this season is back for the last day. And today you don't just watch. You pick a side.`);
  say(`${finalists[0]}'s bleachers are on the left. ${finalists[1]}'s are on the right. Sit behind the one you want to win.`, { focus: finalists });
  const eager = pickBy(finalists, ep.num, 'eager');
  steps.push({ k: 'say', by: eager, focus: [eager], text: V(eager, {
    loud: [`Come on, everybody! ${eager === finalists[0] ? 'Left' : 'Right'} side! Best side!`],
    sharp: [`Choose carefully. I remember everything.`],
    soft: [`No pressure, guys. Really. Okay, a little pressure.`],
    dry: [`Don't all rush at once.`],
    any: [`Okay. Let's see who my friends are.`],
  }, 'eager', ep.num) });

  // how they cross, by what they feel for the two of them; no way of crossing said twice while there are others left
  const CROSS = {
    torn: ['{n} stops in the middle and looks at {o} for a second. Then {n} sits down behind {f}.', '{n} gives {o} a sorry little wave, and sits down on {f}\'s side.', '{n} can\'t look at {o}. {n} sits down behind {f}.'],
    close: ['{n} heads straight for {f}\'s side.', '{n} doesn\'t even slow down. {f}\'s bleachers.', '{n} jogs over and drops onto {f}\'s bench.', '{n} goes straight to {f}\'s side and sits down.'],
    cold: ['{n} looks from one side to the other for a long time, then sits down behind {f}.', '{n} sighs, and picks {f}\'s side.', '{n} takes the long way round, and ends up on {f}\'s bench.', '{n} shrugs and sits down behind {f}.'],
    plain: ['{n} walks over and sits down behind {f}.', '{n} takes a seat on {f}\'s side.', '{n} climbs up into {f}\'s bleachers.', '{n} sits down on {f}\'s side.'],
  };
  const crossed = new Set();
  const cross = (kind, n, f, o) => {
    const all = CROSS[kind], left = all.filter(t => !crossed.has(t));
    const t = pickBy(left.length ? left : all, ep.num, n);
    crossed.add(t);
    return t.replace(/\{n\}/g, n).replace(/\{f\}/g, f).replace(/\{o\}/g, o);
  };
  // a reaction in the speaker's voice, written with {n} for the one walking over: a line is used once, whoever it names
  const said = new Set();
  const react = (by, pools, n, salt) => {
    const own = (pools[fam(by)] || []).filter(t => !said.has(t)), any = (pools.any || []).filter(t => !said.has(t));
    const t = pickBy(own.length ? own : any.length ? any : (pools[fam(by)] || pools.any), by, n, salt);
    said.add(t);
    return t.replace(/\{n\}/g, n);
  };
  let reacted = 0;
  order.forEach((n, i) => {
    const f = sideOf(n), other = finalists.find(x => x !== f);
    const b = bond(n, f), bo = bond(n, other);
    arrives[n] = steps.length;
    // how they cross: straight there, a long look at both, or a stop in front of the friend they are not picking
    const beat = cross(bo >= 3 ? 'torn' : b >= 3 ? 'close' : b <= 0 && bo <= 0 ? 'cold' : 'plain', n, f, other);
    steps.push({ k: 'beat', text: beat, focus: [n], act: { kind: 'arrive', who: [n] } });
    const why = unquote(R[n]?.reason);
    if (why) steps.push({ k: 'say', by: n, focus: [n], text: why });
    // the friend they walked past says something; now and then, the one they picked does
    if (bo >= 3) steps.push({ k: 'say', by: other, focus: [other, n], tense: true, text: react(other, {
      loud: ['{n}?! Seriously?!', 'Wait, {n}! Where are you going?!'],
      sharp: ['Wow, {n}. Noted.', 'Interesting choice, {n}. I\'ll remember it.'],
      soft: ['Oh. Okay. That\'s... okay.', '{n}? I thought... never mind.'],
      dry: ['Cool. Cool cool cool.', 'Great. Love that for me.'],
      any: ['Really, {n}?', 'Huh. Okay, {n}.'],
    }, n, 'past') });
    else if (b >= 4 && reacted < 3) {
      reacted++;
      steps.push({ k: 'say', by: f, focus: [f, n], text: react(f, {
        loud: ['YES! {n}! I knew it!', 'That\'s what I\'m talking about, {n}!', '{n}! My hero!'],
        sharp: ['Good. I knew I could count on you.', 'Smart choice, {n}.', 'Welcome aboard, {n}.'],
        soft: ['Thank you, {n}. Really.', '{n}! Thank you. That means a lot.', 'Aw, {n}.'],
        dry: ['Thanks, {n}. Somebody here has taste.', 'Good call, {n}.', 'Look at that. A fan.'],
        any: ['Thanks, {n}.', 'Glad you\'re with me, {n}.', 'Appreciate it, {n}.'],
      }, n, 'thanks') });
    }
  });

  const [nA, nB] = finalists.map(f => (A[f] || []).length);
  const cnt = (f, x) => `${f}: ${word(x)}.`;
  say(`And that's everybody. ${cnt(finalists[0], nA)} ${cnt(finalists[1], nB)}`, { focus: finalists });
  if (nA !== nB) {
    const hi = nA > nB ? finalists[0] : finalists[1], lo = hi === finalists[0] ? finalists[1] : finalists[0];
    if (!Math.min(nA, nB)) say(`${lo}, not one person. Ouch.`, { focus: [lo], tense: true });
    steps.push({ k: 'say', by: lo, focus: [lo], text: V(lo, {
      loud: [`That's fine! I didn't want a crowd anyway!`],
      sharp: [`Fine. I don't need a cheering section to win.`],
      soft: [`It's okay. I'll just have to win it myself.`],
      dry: [`Good. Fewer people to disappoint.`],
      any: [`Fine. I'll win it without them.`],
    }, 'lo', ep.num) });
    steps.push({ k: 'conf', by: hi, focus: [hi], text: V(hi, {
      loud: [`Did you SEE that? They picked ME! Now I just have to not blow it.`],
      sharp: [`More people on my side means more people who'll tell the world I deserved it. That matters.`],
      soft: [`I didn't think that many people liked me out here. Now I really don't want to let them down.`],
      dry: [`Most of the bleachers. Nice. They can't run the race for me, though.`],
      any: [`Seeing all of them behind me... okay. Now I really have to win this.`],
    }, 'hi', ep.num) });
  } else say(`${word(nA)} each. Dead even. Nice.`, { focus: finalists });

  // the assistants (finale.js selectAssistants): each finalist takes one person off their own bench into the final
  // challenge, by heart, by head, on impulse or after a long look at both (the user, 2026-10-19: "the benches finale
  // section in the stepped viewer don't have the assistant choice section")
  const AS = ep.assistants || null;
  if (AS && finalists.some(f => AS[f]?.name)) {
    steps.push({ k: 'title', kicker: 'The Finale', name: 'Pick an Assistant', faces: finalists, vs: true });
    say(`One more thing. Finalists, each of you takes one person off your bench to run the final challenge with you. Choose well.`, { focus: finalists });
    const moved = { ...places };
    finalists.forEach((f, i) => {
      const a = AS[f];
      if (!a?.name) {
        say(`${f}, nobody's sitting behind you. You're doing this alone.`, { focus: [f], tense: true });
        steps.push({ k: 'say', by: f, focus: [f], text: V(f, {
          loud: [`Good! I don't need anybody slowing me down!`], sharp: [`Fine. Then nobody gets to share the credit.`], soft: [`That's okay. I've been on my own out here before.`],
          dry: [`Great. A team of one. Very efficient.`], any: [`Then I'll do it by myself.`],
        }, 'solo', ep.num) });
        return;
      }
      const n = a.name, heart = a.heartPick, head = a.brainPick;
      const passed = n === heart ? head : heart;
      if (a.decision === 'agonized' || a.decision === 'impulsive') steps.push({ k: 'beat', focus: [f, heart, head].filter(Boolean),
        text: a.decision === 'impulsive' ? `${f} doesn't even look along the bench.` : `${f} looks from ${heart} to ${head}, and back again, for a long time.`, tense: a.decision === 'agonized' });
      steps.push({ k: 'say', by: f, focus: [f, n], text: a.decision === 'unanimous' ? V(f, {
        loud: [`${n}! Obviously! Get down here!`], sharp: [`${n}. That was never a question.`], soft: [`${n}. It was always going to be you.`], dry: [`${n}. That took no thought at all.`],
        any: [`${n}. Easy.`, `${n}. Who else?`],
      }, 'asU', ep.num, i) : a.decision === 'heart' ? V(f, {
        soft: [`${n}. I trust you more than anybody up there.`], loud: [`${n}! I don't care who's fastest. I want you with me!`],
        any: [`${n}. I want somebody next to me I actually trust.`],
      }, 'asH', ep.num, i) : a.decision === 'brain' ? V(f, {
        sharp: [`${n}. You give me the best chance of winning. That's all this is.`], dry: [`${n}. Sorry, ${passed}. ${n} is faster.`],
        any: [`${n}. You're my best shot at winning this.`],
      }, 'asB', ep.num, i) : a.decision === 'impulsive' ? `${n}! Let's go!` : `...${n}.` });
      // and down they come, to stand with them
      const fp = places[f];
      moved[n] = { u: Math.min(.92, Math.max(.08, fp.u + (i ? .07 : -.07))), v: fp.v, s: fp.s };
      steps.push({ k: 'scene', spot: 'benches', tod: 'day', plate: key, place: 'The Benches', time: 'Day', card: false, focus: [f, n], bg: [], places: { ...moved }, host, wide: true,
        signs: steps[0].signs });
      steps.push({ k: 'beat', focus: [n, f], text: `${n} climbs down from the bleachers and stands next to ${f}.`, act: { kind: 'arrive', who: [n] } });
      const ab = bond(n, f);
      steps.push({ k: 'say', by: n, focus: [n, f], text: ab >= 2 ? V(n, {
        loud: [`Let's win this thing!`], soft: [`I won't let you down. I promise.`], sharp: [`Good choice. Now let's not waste it.`], dry: [`I'm stretching. That counts as warming up.`],
        any: [`Let's go win this.`, `I've got you.`],
      }, 'asOk', ep.num, i) : V(n, {
        sharp: [`Don't make me regret this.`], loud: [`Fine! But I'm doing this for me too!`], dry: [`Well. This is a surprise for both of us.`],
        any: [`Okay. Let's just do this.`, `I'm in. Don't make it weird.`],
      }, 'asMeh', ep.num, i) });
      // the friend who wasn't picked, still in the stands
      if (passed && passed !== n && (A[f] || []).includes(passed) && bond(passed, f) >= 2) steps.push({ k: 'say', by: passed, focus: [passed], text: V(passed, {
        loud: [`Wow! Okay! I see how it is!`], sharp: [`Noted, ${f}.`], soft: [`That's fine. Really. Good luck.`], dry: [`Love being the backup.`],
        any: [`Huh. Okay.`, `Didn't see that coming.`],
      }, 'asP', ep.num, i) });
      if (a.decision === 'agonized' || a.decision === 'brain') steps.push({ k: 'conf', by: f, focus: [f], text: a.decision === 'brain'
        ? `${passed} is my friend. ${n} is the one who can help me win. Today I need the second one.`
        : n === heart ? `My head said ${head}. I went with ${heart}. If I lose, at least I lose with somebody I trust.` : `Every part of me wanted ${heart}. But ${head} is faster, and I didn't come this far to lose on a feeling.` });
    });
    const pairs = finalists.filter(f => AS[f]?.name).map(f => `${f} and ${AS[f].name}`);
    if (pairs.length) say(`So that's it. ${listOf(pairs)}. Everybody else, back up in the stands and make some noise.`, { focus: finalists });
  }
  return { id: 'benches', kind: 'camp', venue: key.split('/')[0], ep: ep.num, label: 'The Benches', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE GALLERY — who watches the finale from the stands: the jury, and the coaches voted out
// ══════════════════════════════════════════════════════════════════════
// (a coach voted out is kept out of gs.eliminated and the jury on purpose, coach-episode.js eliminateCoach;
// the user, 2026-10-19: "the coaches got completely skipped at the finale too". They watch and react. No vote.)
export function finaleGallery(ep) {
  const jury = [...new Set([...(ep.juryResult?.reasoning || []).map(r => r.juror), ...(ep.gsSnapshot?.jury || [])])];
  const fired = (ep.finaleCoaches || []).filter(c => c.firedEp && !jury.includes(c.name)).map(c => c.name);
  return { jury, coaches: fired, all: [...jury, ...fired] };
}
// the stands, as many shots of them as the venue's seats need (vp-td-ep/jury-vote.js does the same)
export function standsOf(ep, o, people) {
  const J = juryPlates(ep, o);
  const per = J.wide ? Math.max(1, seatsOn(J.wide)) : 0;
  const shots = [];
  if (per) for (let i = 0; i < people.length; i += per) shots.push(people.slice(i, i + per));
  const scene = (focus, shot = null, time = null) => {
    const k = shot ?? Math.max(0, shots.findIndex(s => s.includes(focus[0])));
    return { k: 'scene', spot: 'jury-bleachers', tod: /-night$/.test(J.wide) ? 'night' : 'day', plate: J.wide, place: 'The Stands', time: time || (J.day ? 'Day' : 'Night'), card: false, cut: true,
      focus, bg: [], places: seatJury(J.wide, shots[k] || []), host: null, wide: true, still: true, ...(J.indoor ? { noWx: true } : {}), ...(J.night ? { nightFrame: true } : {}) };
  };
  return { ok: !!J.wide && shots.length > 0, shots, scene };
}

// ══════════════════════════════════════════════════════════════════════
// FINAL IMMUNITY — the last challenge of the season, on the stage
// ══════════════════════════════════════════════════════════════════════
// The classic page was a results table ("Mixed", three question marks, a Reveal button). The engine's record:
// who won (ep.immunityWinner), the order they fell (ep.immunityNarrationStages: opening, each drop, the
// head-to-head, the win) and what kind of challenge (endurance or a puzzle). Played at the venue's challenge
// spot, with the jury and the coaches voted out watching from the stands and answering the drops.
export function tdFinalImmunityScreen(ep, o = {}) {
  const stages = ep.immunityNarrationStages || ep.finalChallengeStages || [];
  const winner = ep.immunityWinner;
  const finalists = (stages[0]?.remaining || ep.finaleEntrants || []).filter(Boolean);
  if (!winner || finalists.length < 2 || !stages.length) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const spots = { 'hosted-camp': 'challenge-zone', 'film-lot': 'cage-stage', 'world-tour': 'ceremony', 'survival-island': 'volcano', carnival: 'bumper-arena' };
  const spot = plateKey(venue, spots[venue], 'day') ? spots[venue] : (VENUES[venue]?.public || 'communal-grounds');
  const key = plateKey(venue, spot, 'day');
  if (!key) return null;
  const bond = bondOf(ep);
  const Vo = VOnce();
  const G = finaleGallery(ep);
  const S0 = standsOf(ep, o, G.all);
  // (a day challenge: the stands' own frame is painted at night only on the island)
  const S = { ...S0, scene: (f, k = null) => S0.scene(f, k, venue === 'survival-island' ? 'Night' : 'Day') };
  const steps = [];
  const say = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, ...extra });
  const places = placeScene(key, finalists, [], { host });
  const field = (focus = finalists) => steps.push({ k: 'scene', spot, tod: 'day', plate: key, place: 'Final Immunity', time: 'Day', card: false, cut: true, focus, bg: [], places, host, wide: true });
  const endurance = !/puzzle/i.test(stages[0]?.text || '');
  // who in the stands is with whom: each one's warmest finalist, and the one they least want to see win
  const fan = n => [...finalists].sort((a, b) => bond(n, b) - bond(n, a))[0];
  const foe = n => [...finalists].sort((a, b) => bond(n, a) - bond(n, b))[0];
  const cut = !!ep.finalCut, fire = !!ep.firemakingDecision;

  steps.push({ k: 'scene', spot, tod: 'day', plate: key, place: 'Final Immunity', time: 'Day', card: true, focus: finalists, bg: [], places, host, wide: true });
  say(pickBy([`${listOf(finalists)}. Welcome to the last challenge of the season.`, `This is it. The last challenge you'll ever do out here.`], ep.num, 'open'));
  say(fire ? `Win it, and you're safe tonight, and you decide who's safe with you. The other two make fire for the last seat.`
    : cut ? `Win it, and you're safe. And you choose who comes with you to Final Tribal. Everybody else goes home.`
      : `Win it, and it's the last thing the jury sees you do before they vote. No pressure.`, { focus: finalists });
  say(endurance ? `Each of you stands on your own post over the water. The posts get smaller as we go. Step off, touch the water, or fall, and you're out. The last one standing wins.`
    : `Each of you has the same puzzle in front of you. Every piece has to fit, and one wrong piece means taking it apart again. The first one to finish wins.`);
  steps.push({ k: 'title', kicker: 'The Finale', name: 'Final Immunity', faces: finalists, vs: true });
  // the stands: everybody who left, watching, and a voice for each finalist
  if (S.ok) {
    S.shots.forEach((s, i) => {
      steps.push(S.scene(s, i));
      if (i === 0) steps.push({ k: 'beat', text: `In the stands, the jury${G.coaches.length ? ` and ${G.coaches.length === 1 ? 'the coach' : 'the coaches'} who never made the merge` : ''} have come to watch.`, focus: s, act: { kind: 'arrive', who: s } });
    });
    const cheered = new Set();
    finalists.forEach((f, i) => {
      const n = G.all.filter(x => !cheered.has(x) && fan(x) === f && bond(x, f) >= 2).sort((a, b) => bond(b, f) - bond(a, f))[0];
      if (!n) return;
      cheered.add(n);
      steps.push(S.scene([n]));
      steps.push({ k: 'say', by: n, focus: [n], loud: fam(n) === 'loud', text: G.coaches.includes(n) ? Vo(n, {
        loud: [`Come on, ${f}! Everything I taught you! All of it!`], soft: [`You've got this, ${f}. You always did.`], sharp: [`${f}, remember what I told you. Don't look down.`],
        any: [`That's my camper down there! Let's go, ${f}!`, `${f}, I coached you for this. Go!`],
      }, f, 'coach') : Vo(n, {
        loud: [`LET'S GO, ${f.toUpperCase()}!`, `Come on, ${f}! Take it!`], soft: [`Go, ${f}! You can do it!`], dry: [`I'm cheering for ${f}. Quietly. Inside.`], sharp: [`${f}. Win this. Don't embarrass me.`],
        any: [`Come on, ${f}!`, `${f}! Let's go!`],
      }, f, 'cheer', i) });
    });
    field();
  }

  // the challenge: each drop, and the stands answering it
  say(pickBy([`Campers ready? Go!`, `Three, two, one... go!`], ep.num, 'go'), { tense: true });
  // (the engine's opening restates the rules the host just gave; its drops can repeat one sentence: each said once)
  steps.push({ k: 'beat', text: endurance ? `${listOf(finalists)} climb onto their posts.` : `${listOf(finalists)} tip their pieces out and start.`, focus: finalists });
  const told = new Set();
  const once = (t, d) => { const c = cleanText(t); if (!told.has(c)) { told.add(c); return c; }
    return pickBy(endurance ? [`${d} can't hold on any longer, and steps down into the water.`, `${d}'s legs give out. Into the water.`] : [`${d} gets one piece wrong, then another, and can't catch up.`, `${d} stops, stares at the board, and knows it's over.`], ep.num, d); };
  let reacted = 0;
  for (const st of stages.slice(1)) {
    if (st.type === 'drop' && st.dropper) {
      const d = st.dropper;
      steps.push({ k: 'beat', text: once(st.text, d), focus: [d], act: endurance ? { kind: 'shake', who: [d] } : null, tense: (st.remaining || []).length <= 2 });
      say(`${d} is out!`, { focus: [d] });
      steps.push({ k: 'say', by: d, focus: [d], text: Vo(d, {
        loud: [`NO! No, no, no!`, `Are you kidding me?!`], sharp: [`Fine. It doesn't matter. The jury votes, not the water.`], soft: [`I'm sorry. I gave it everything I had.`], dry: [endurance ? `Well. I'm wet.` : `Well. That piece was not my friend.`],
        any: [`That's it. I've got nothing left.`, `I tried. I really did.`],
      }, d, 'drop') });
      // the stands: somebody who wanted them gone, or somebody who wanted them to win
      if (S.ok && reacted < 3) {
        const glad = G.all.filter(x => foe(x) === d && bond(x, d) <= -2).sort((a, b) => bond(a, d) - bond(b, d))[0];
        const sad = G.all.filter(x => fan(x) === d && bond(x, d) >= 3)[0];
        const r = glad || sad;
        if (r) {
          reacted++;
          steps.push(S.scene([r]));
          steps.push({ k: 'say', by: r, focus: [r], feel: { [r]: glad ? 'relief' : 'shock' }, text: glad ? Vo(r, { sharp: [`Bye, ${d}.`], loud: [`HA! Yes! Gone!`], dry: [`I'd like to say I'm sad.`], any: [`Good.`, `One down.`] }, d, 'glad')
            : Vo(r, { soft: [`Oh, ${d}...`], loud: [`No! Come on!`], any: [`Ugh. So close.`, `No...`] }, d, 'sad') });
          field();
        }
      }
    } else if (st.type === 'headToHead') {
      const [a, b] = st.remaining || [];
      steps.push({ k: 'beat', text: cleanText(st.text), focus: [a, b].filter(Boolean), tense: true, contend: [a, b].filter(Boolean) });
      if (a && b) say(pickBy([`Two left. ${a} and ${b}. One of you is about to win the last immunity of the season.`, `Down to ${a} and ${b}. Nobody in the stands is breathing.`], ep.num, 'h2h'), { focus: [a, b], tense: true, hold: true, contend: [a, b] });
    } else if (st.type === 'win') {
      steps.push({ k: 'beat', text: endurance ? `${winner} is the last one standing.` : `${winner} drops the last piece into place.`, focus: [winner], act: { kind: 'roundwin', who: [winner], lose: finalists.filter(f => f !== winner) } });
    }
  }
  say(`${winner} wins final immunity!`, { focus: [winner] });
  steps.push({ k: 'title', kicker: 'Final Immunity', name: winner, faces: [winner] });
  steps.push({ k: 'say', by: winner, focus: [winner], loud: true, text: Vo(winner, {
    loud: [`YES! I did it! I actually did it!`], sharp: [`Exactly as planned.`], soft: [`Oh my gosh. I can't believe that just happened.`], dry: [`So that's what winning feels like. I could get used to it.`],
    any: [`I did it! I really did it!`],
  }, winner, 'won') });
  // and the stands, one last time: the loudest of the winner's people
  const happy = G.all.filter(x => fan(x) === winner && bond(x, winner) >= 2)[0];
  if (S.ok && happy) { steps.push(S.scene([happy])); steps.push({ k: 'beat', text: `${happy} jumps up in the stands and cheers.`, focus: [happy], applause: 'big' }); field([winner]); }
  // the ones who lost it, to the camera
  for (const f of finalists.filter(x => x !== winner)) steps.push({ k: 'conf', by: f, text: Vo(f, {
    sharp: [cut || fire ? `${winner} holds my game in one hand now. I hate that.` : `Losing that one hurts. It doesn't decide anything. The jury does.`],
    soft: [`I really wanted that one. I'm okay. I think I'm okay.`], loud: [`I was SO close! So close!`],
    any: cut || fire ? [`Now I have to hope ${winner} wants me next to them at the end.`, `It's out of my hands now. It's in ${winner}'s.`]
      : [`I didn't win it. But the jury remembers everything else I did.`, `One challenge doesn't win this game. I know that. It still stings.`, `${winner} earned that. Tonight I have to earn the jury.`],
  }, f, 'lost') });
  return { id: 'finale-challenge', kind: 'camp', venue, ep: ep.num, label: 'Final Immunity', host, steps };
}

// ══════════════════════════════════════════════════════════════════════
// THE WALK — the last morning, past everyone the season sent home
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-19, asked for the finale ritual: the finalists walk a path lined with a torch for every
// person voted out (and every coach their team fired), in the order they went. Each one gets their card, and
// a finalist says something to them: whether they wrote that name, whether they miss them, whether it was a
// blindside, read off the season's own votes and bonds. Words only.
const WALK = { 'hosted-camp': 'forest-trail', 'survival-island': 'jungle-trail', carnival: 'forest-edge', 'film-lot': 'trailers', 'world-tour': 'economy' };
export function tdFinaleWalkScreen(ep, o = {}) {
  const finalists = (ep.finaleEntrants || ep.finaleFinalists || []).filter(Boolean);
  const hist = (o.history || globalThis.gs?.episodeHistory || []).filter(h => h.num < ep.num);
  if (finalists.length < 2 || hist.length < 3) return null;
  const host = o.host || 'Chris';
  const venue = venueOf(ep, o);
  const spot = WALK[venue] && plateKey(venue, WALK[venue], 'day') ? WALK[venue] : (VENUES[venue]?.public || 'communal-grounds');
  const key = plateKey(venue, spot, 'day');
  if (!key) return null;
  const bond = bondOf(ep);
  const Vo = VOnce();
  const log = h => (h.votingLog || []).filter(v => v.voter && v.voter !== 'THE GAME' && v.voted);
  // who went, in order: every boot of every night, and the coaches their own teams fired
  const gone = [];
  for (const h of hist) {
    for (const c of h.coachElimination || []) gone.push({ who: c.coach, ep: h.num, coach: true, h });
    for (const n of [h.firstEliminated, h.eliminated].filter(Boolean)) if (!gone.some(g => g.who === n) && !finalists.includes(n)) gone.push({ who: n, ep: h.num, h });
    if (h.medevac?.name && !gone.some(g => g.who === h.medevac.name) && !finalists.includes(h.medevac.name)) gone.push({ who: h.medevac.name, ep: h.num, medevac: true, h });
  }
  if (gone.length < 2) return null;
  const steps = [];
  const places = placeScene(key, finalists, []);
  const fire = plateKey(venue, 'ceremony', 'night');
  steps.push({ k: 'scene', spot, tod: 'day', plate: key, place: 'The Walk', time: 'Morning', card: true, focus: finalists, bg: [], places, wide: true });
  steps.push({ k: 'beat', text: `The finalists find a path they've never walked before, lined with torches. Every torch has a name on it.`, focus: finalists });
  steps.push({ k: 'title', kicker: 'The Finale', name: 'The Walk', faces: gone.slice(0, 8).map(g => g.who) });
  steps.push({ k: 'say', by: finalists[0], focus: finalists, text: Vo(finalists[0], {
    soft: [`Oh. Oh, it's everybody.`], loud: [`Whoa. Is that... it's everybody we voted out!`], dry: [`Well, this isn't going to be emotional at all.`], sharp: [`So this is how they want us to feel before the vote.`],
    any: [`It's everybody. Everybody who went home.`],
  }, 'open') });
  // each torch: the card, and the finalist with the most to say to them
  const spoke = Object.fromEntries(finalists.map(f => [f, 0]));
  const usedT = new Set();
  gone.forEach((g, i) => {
    const b = g.who, h = g.h;
    const wrote = f => log(h).some(v => v.voter === f && v.voted === b);
    const blind = !!(h.tribalStory?.shocking || h.tribalStory?.blindside) && h.eliminated === b;
    // who speaks: whoever feels the most (a strong bond either way, or the vote), turn and turn about
    const f = [...finalists].sort((x, y) => (Math.abs(bond(y, b)) + (wrote(y) ? 2 : 0) - spoke[y] * 3) - (Math.abs(bond(x, b)) + (wrote(x) ? 2 : 0) - spoke[x] * 3) || x.localeCompare(y))[0];
    spoke[f]++;
    const bb = bond(f, b), n = word(g.ep);
    steps.push({ k: 'title', kicker: g.coach ? `Coach · episode ${n}` : `Episode ${n}`, name: b, faces: [b], tone: 'out' });
    const cat = g.coach ? 'coach' : g.medevac ? 'med' : wrote(f) && bb >= 2 ? 'wf' : wrote(f) && bb <= -1 ? 'wr' : blind ? 'bl' : bb >= 3 ? 'miss' : bb <= -3 ? 'foe' : wrote(f) ? 'wn' : 'any';
    const POOLS = {
      coach: { soft: [`${b} was our coach. It feels wrong walking past ${b}'s torch.`], any: [`${b} never even got to play. ${b} just coached, and got voted out for it.`, `Coach ${b}. Some of what ${b} taught us got us here.`, `${b} trained us for weeks and never got a turn. That's rough.`] },
      med: { any: [`${b} didn't get voted out. ${b} got hurt. That's the worst way to go.`, `Nobody voted for ${b}. ${b} just couldn't keep going. That still bothers me.`] },
      wf: { soft: [`I wrote your name, ${b}. I hated doing it. I'm so sorry.`], sharp: [`${b}, I'd do it again. I just wish it hadn't been you.`],
        any: [`I voted ${b} out, and ${b} was my friend. That one stays with you.`, `${b}. I wrote that name, and I still think about it.`, `${b}. That was the hardest vote I cast all season.`, `Sorry, ${b}. It was you or me.`] },
      wr: { sharp: [`No regrets on this one. ${b} would have done it to me first.`, `${b}. Exactly where ${b} belongs.`], loud: [`${b}! Ha! Best vote I ever cast!`, `${b}! Bye again!`], dry: [`${b}. I sleep fine.`, `${b}. Not my favourite torch.`],
        any: [`${b}. I voted ${b} out, and I'd do it again.`, `${b} was coming for me. I just got there first.`, `${b} and I were never going to the end together.`, `${b}. That one was easy.`] },
      wn: { any: [`${b}. My vote was on that one. Just the game.`, `I wrote ${b}'s name. Nothing personal, it was just the numbers.`, `${b}. That was a vote I had to make.`] },
      bl: { any: [`${b} never saw it coming. None of us really did.`, `${b}'s face that night. I'll never forget it.`, `${b} walked in sure it was somebody else.`] },
      miss: { soft: [`I miss ${b}. Losing ${b} was the worst night out here.`], loud: [`${b}! I wish you were here!`],
        any: [`${b} should be walking this path with us.`, `I still look for ${b} at camp sometimes.`, `Camp got quieter without ${b}.`, `${b}. I think about that night a lot.`] },
      foe: { sharp: [`I'm not going to pretend I miss ${b}.`], dry: [`${b}. Moving on.`], any: [`${b} and I never got along. I'm not sorry ${b} is a torch.`, `${b}. We didn't exactly part as friends.`] },
      any: { dry: [`${b}. Episode ${n}. Feels like a year ago.`], any: [`${b}. That feels like a long time ago now.`, `${b} went home in episode ${n}. I barely remember that week.`, `I didn't really know ${b}. Nobody got the chance to.`, `${b}. Seems like forever ago.`, `I liked ${b}. We just never really talked.`] },
    };
    // (a line is said once, whoever it names: a template is remembered by where it sits in its pool)
    const P0 = POOLS[cat], own = (P0[fam(f)] || []).map((t, j) => [`${cat}:${fam(f)}:${j}`, t]), any = (P0.any || []).map((t, j) => [`${cat}:any:${j}`, t]);
    const fresh = l => l.filter(([id]) => !usedT.has(id));
    const from = fresh(own).length ? fresh(own) : fresh(any).length ? fresh(any) : [...own, ...any];
    const [tid, text] = pickBy(from, f, b, ep.num);
    usedT.add(tid);
    steps.push({ k: 'say', by: f, focus: [f], text, ...(bb >= 3 && !wrote(f) ? { feel: { [f]: 'guilty' } } : {}) });
    // the boot's own last words, now and then: a throwback to the night they went
    // (a line that stands on its own: "Come here." and "I know you didn't." answer somebody who isn't in the shot)
    const last = (h.tribalStory?.exit || []).find(l => l.by === b && l.text && l.text.length >= 30 && l.text.length <= 140 && !/^(Come|I know|Okay|Ok|Yeah|No|Yes|Fine|Thanks|Thank|You too|Me too|Same|Sure|Right|Neither|Me neither|So|And|But|Well|Wow|Oh|Hey|Wait)\b/.test(l.text));
    if (last && i % 3 === 1 && fire) {
      steps.push({ k: 'scene', spot: 'ceremony', tod: 'night', plate: fire, place: `Episode ${n}`, time: 'The night they left', card: false, cut: true, focus: [b], bg: [], places: placeScene(fire, [b], []), throwback: true, noWx: true });
      steps.push({ k: 'say', by: b, focus: [b], text: cleanText(last.text) });
      steps.push({ ...steps[0], card: false, cut: true });
    }
  });
  // the end of the path
  steps.push({ k: 'beat', text: `At the end of the path, the three of them look back down the row of torches.`.replace('three', word(finalists.length)), focus: finalists });
  finalists.forEach((f, i) => steps.push({ k: 'conf', by: f, text: Vo(f, {
    soft: [`Every one of those torches is a person I lived with. I'm here because they're not. That's a strange thing to feel proud of.`],
    sharp: [`Every torch on that path is a decision. Some of them were mine. I'd make most of them again.`],
    loud: [`That walk was a lot! But I'm still here, and I'm going to win this thing!`],
    dry: [`A path of everyone I outlasted. Very subtle, ${host}.`],
    any: [`Walking past all of them, you realise how long it's been. And how lucky I am to still be here.`, `I made it past every one of those torches. Now I have to make it past the jury.`],
  }, f, 'end', i) }));
  return { id: 'finale-walk', kind: 'camp', venue, ep: ep.num, label: 'The Walk', host, steps };
}
