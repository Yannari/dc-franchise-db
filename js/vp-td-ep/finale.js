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

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const fam = n => { try { return familyOf(n); } catch { return 'plain'; } };
const V = (n, o, ...k) => pickBy(o[fam(n)] || o.any, n, ...k);
const listOf = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };
const unquote = t => cleanText(String(t || '').trim().replace(/^["“]+|["”]+$/g, '').replace(/…$/, '.'));
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = n => WORD[n] || String(n);

// the ceremony set at night (where every vote of the season happened), or the venue's public place
function ceremony(ep, o, tod = 'night') {
  const venue = venueOf(ep, o);
  const key = plateKey(venue, 'ceremony', tod) || plateKey(venue, 'ceremony', 'night') || plateKey(venue, VENUES[venue]?.public || 'communal-grounds', tod);
  return { venue, key, spot: plateKey(venue, 'ceremony', tod) || plateKey(venue, 'ceremony', 'night') ? 'ceremony' : (VENUES[venue]?.public || 'communal-grounds') };
}
function grounds(ep, o, tod = 'day') {
  const venue = venueOf(ep, o), pub = VENUES[venue]?.public || 'communal-grounds';
  return { venue, spot: pub, key: plateKey(venue, pub, tod) || plateKey(venue, pub, 'day') };
}
const seasonOf = o => o.seasonName || 'this season';

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

  steps.push({ k: 'scene', spot: C.spot, tod: 'night', plate: C.key, place: 'Final Tribal Council', time: 'Night', card: true,
    focus: finalists, bg: [], places: placeScene(C.key, [...finalists, ...jurors.slice(0, 7)], [], { host }), host, wide: true });
  say(pickBy([
    `${listOf(finalists)}. Out of everybody who started this season, you're the last ${word(finalists.length)}. Tonight, for once, none of you get a vote.`,
    `Welcome to the final Tribal Council. ${listOf(finalists)}, everything you did to get here is about to be judged by the people you did it to.`,
  ], ep.num, finalists.join('|')));
  steps.push({ k: 'beat', text: `The jury walks in: ${listOf(jurors)}. Every one of them was voted out by somebody in this game, and some of them by somebody sitting right here.`,
    focus: jurors.slice(0, 6), act: { kind: 'arrive', who: jurors.slice(0, 7) } });
  steps.push({ k: 'title', kicker: 'The Finale', name: 'Final Tribal Council', faces: finalists });
  say(`Finalists, this is the last time you get to make your case. Jury, this is the last time you get to ask. Let's start with why each of you thinks you should win.`);

  // the case: each finalist's own opening (finale.js generateFTCData), asked for by the host
  finalists.forEach((f, i) => {
    const lines = (ftc.finalistStatements?.[f] || []).map(unquote).filter(Boolean);
    if (!lines.length) return;
    say(pickBy([`${f}.`, `${f}, you first.`, `${f}, your turn.`, `${f}, why you?`], ep.num, f, i), { focus: [f] });
    steps.push({ k: 'say', by: f, focus: [f], text: lines.join(' ') });
  });

  // the jury asks (generateFTCData jurorQA): the question to their face, the answer, and how it lands
  const QA = (ftc.jurorQA || []).filter(q => q.juror && q.targetForQuestion && q.question);
  if (QA.length) say(pickBy([`Jury, the floor is yours.`, `Jury. Ask whatever you want.`], ep.num, 'qa'));
  QA.forEach((q, i) => {
    const t = q.targetForQuestion, j = q.juror;
    steps.push({ k: 'say', by: j, focus: [j, t], text: unquote(q.question), tense: bond(j, t) <= -2 });
    if (q.response) steps.push({ k: 'say', by: t, focus: [t, j], text: unquote(q.response) });
    // the juror's face says whether that worked (their bond with who answered), never how they will vote
    const b = bond(j, t);
    if (i % 2 === 0) steps.push({ k: 'beat', focus: [j], text: b >= 3 ? pickBy([`${j} nods slowly.`, `${j} almost smiles.`], j, ep.num, i)
      : b <= -2 ? pickBy([`${j} folds ${pos(j)} arms and doesn't say anything.`, `${j} shakes ${pos(j)} head, just slightly.`], j, ep.num, i)
        : pickBy([`${j} sits back and thinks about it.`, `${j} writes nothing down, but doesn't look away either.`], j, ep.num, i) });
  });

  // the vote: each juror walks up, and the name stays theirs until it is read
  say(`Jury, it's time to vote. This time, you're not voting somebody out. You're voting for the winner.`, { tense: true });
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
      dry: ["I've been ready to write this name for about three weeks.", "They all talked. One of them said something true.", "I wrote it neatly. They deserve neat."],
      any: ["I know exactly who I'm voting for. I knew before we even started.", "Tonight helped. Tonight made it clear.", "I listened to all of it. I'm voting for the game I'd want to have played.", "I came in with a name, and I'm leaving it in that urn.", "Whatever happens next, this vote is the one I'll stand by."],
    }, 'jv', ep.num, i), focus: [j] });
    if (i === Math.floor(jurors.length / 2)) steps.push({ k: 'beat', text: `One by one, the jurors walk up, write a name and drop it in the urn.`, focus: finalists });
  });

  // the reading: alternating finalists, the winner's clinching vote read last (and then it stops)
  const need = Math.floor(jurors.length / 2) + 1;
  const byFor = {};
  jr.reasoning.forEach(r => (byFor[r.votedFor] ||= []).push(r));
  const order = [];
  const tally = {};
  const pools = Object.fromEntries(Object.entries(byFor).map(([k, v]) => [k, [...v]]));
  let clinched = false, turn = 0;
  const others = finalists.filter(f => f !== winner);
  while (!clinched && order.length < jurors.length) {
    // the others first, while the winner is kept one short of the line until the end
    const cand = turn % 2 === 0 ? others.find(f => pools[f]?.length) : null;
    const pick = cand || ((tally[winner] || 0) < need - 1 || !others.some(f => pools[f]?.length) ? winner : others.find(f => pools[f]?.length));
    const r = pools[pick]?.shift();
    if (!r) { const any = Object.keys(pools).find(k => pools[k].length); if (!any) break; order.push(pools[any].shift()); tally[any] = (tally[any] || 0) + 1; turn++; continue; }
    order.push(r); tally[pick] = (tally[pick] || 0) + 1; turn++;
    if (pick === winner && tally[winner] >= need) clinched = true;
  }
  say(pickBy([`I'll read the votes.`, `I'll go tally the votes.`, `Okay. I have the votes.`], ep.num, 'read'));
  const t = {};
  order.forEach((r, i) => {
    t[r.votedFor] = (t[r.votedFor] || 0) + 1;
    const last = i === order.length - 1 && r.votedFor === winner && t[winner] >= need;
    if (last) {
      say(`${seasonOf(o) === 'this season' ? 'The winner' : `The winner of ${seasonOf(o)}`}...`, { focus: finalists, tense: true, hold: true });
      steps.push({ k: 'beat', text: `${host} unfolds the last one and takes a long look at it before turning it around.`, focus: finalists, tense: true });
    }
    const lead = Object.entries(t).sort((a, b) => b[1] - a[1]);
    const level = lead.length >= 2 && lead.every(x => x[1] === lead[0][1]);
    const line = last ? `${winner}!` : lead.length >= 2 && i >= 1 ? (level ? `${r.votedFor}. That's ${word(lead[0][1])} vote${lead[0][1] === 1 ? '' : 's'} each.` : `${r.votedFor}. That's ${listOf(lead.map(([n, k]) => `${word(k)} ${n}`))}.`) : `${r.votedFor}.`;
    steps.push({ k: 'read', vote: r.votedFor, deciding: last, tally: { ...t }, focus: [r.votedFor], line, tense: last || (lead.length >= 2 && lead[0][1] - lead[1][1] <= 1) });
  });
  if (ep.juryTiebreak) steps.push({ k: 'beat', text: `It's a tie on the jury. ${ep.juryTiebreak.text || ep.juryTiebreak.reason || `It goes to the tiebreak, and the tiebreak goes to ${winner}.`}`, focus: finalists, tense: true });
  winnerMoment(steps, ep, o, winner, finalists, jurors, bond);

  // and now the jury says why (generateFTCData / the jury vote's reasons), with the result known
  say(`Jury, you don't have to explain yourselves. But some of you want to.`);
  jr.reasoning.forEach((r, i) => {
    steps.push({ k: 'conf', by: r.juror, text: unquote(r.reason), focus: [r.juror, r.votedFor], side: [{ tab: 'tally', voter: r.juror, target: r.votedFor }] });
  });
  return { id: 'ftc', kind: 'tribal', venue: C.venue, ep: ep.num, label: 'Final Tribal Council', host, steps };
}

// the moment: the winner, the runners-up, the jury
function winnerMoment(steps, ep, o, winner, finalists, crowd, bond) {
  if (!winner) return;
  steps.push({ k: 'say', by: winner, focus: [winner], loud: true, act: { kind: 'roundwin', who: [winner], lose: finalists.filter(f => f !== winner) }, text: V(winner, {
    loud: ['I WON! I actually won! Are you serious?!', 'Yes! YES! Somebody pinch me!'],
    sharp: ['I told you all I knew what I was doing.', 'Well. I suppose that settles it.'],
    soft: ["Oh my gosh. I can't... thank you. Thank you, all of you.", "I don't know what to say. I really don't."],
    dry: ['Huh. I won. That just happened.', 'Okay. I think I need to sit down.'],
    any: ["I can't believe it. I won!", 'I won. I actually won.'],
  }, 'win', ep.num) });
  finalists.filter(f => f !== winner).forEach((f, i) => {
    const b = bond(f, winner);
    steps.push({ k: 'say', by: f, focus: [f, winner], text: b >= 3 ? V(f, {
      loud: ["Get over here! I'm so happy for you, I could scream!"], soft: ["Come here. You deserve this. You really do."], any: ['Congratulations. Honestly, you earned it.'],
    }, 'ru', ep.num, i) : b <= -2 ? V(f, {
      loud: ['Unbelievable. Un-be-lievable.'], sharp: ['Congratulations. I hope the jury enjoys what they just did.'], dry: ['Great. Wonderful. Good for you.'], any: ["Congrats. I mean it. Mostly."],
    }, 'rx', ep.num, i) : V(f, {
      soft: ["I'm a little crushed, but I'm happy for you. I mean that."], dry: ['Second place. I can live with that. Probably.'], any: ['Well played. You got me.', "It hurts, but you earned it."],
    }, 'rn', ep.num, i) });
  });
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
  runners.forEach((f, i) => steps.push({ k: 'conf', by: f, focus: [f], text: V(f, {
    loud: ["So close! SO close! I'm going to think about that last moment for the rest of my life!"],
    sharp: ["Second is first loser. I know that. I'll be fine. Eventually."],
    soft: ["I didn't win, and that hurts. But I got further than I ever thought I would."],
    dry: ["Runner-up. It has a nice ring to it. Not as nice as winner."],
    any: ["It wasn't my night. But I made it to the end, and nobody can take that away from me."],
  }, 'wr', ep.num, i) }));
  if (fans) say(`And before we go: the fans have their own favourite. ${fans}, America loves you.`, { focus: [fans] });
  say(pickBy([`That's it! That's the season! Goodnight, everybody!`, `And that's ${seasonOf(o)}. Thanks for watching!`], ep.num, 'bye'));
  return { id: 'winner', kind: 'camp', venue: G.venue, ep: ep.num, label: 'The Winner', host, steps };
}
