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
  return { id: 'benches', kind: 'camp', venue: key.split('/')[0], ep: ep.num, label: 'The Benches', host, steps };
}
