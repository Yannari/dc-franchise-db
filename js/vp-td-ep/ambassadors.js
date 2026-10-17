// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/ambassadors.js — the Ambassadors twist, as conversations
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10: "same for ambassadors too, it needs to be deep, dramatic, filled with suspense".
// The engine (twists.js) decides everything: who each team sends (and who nearly went), each one's way
// of negotiating (manipulator, villain, dealmaker, loyal shield, emotional), who leads the talk and
// whether the other pushes back, each side's first name, a shared enemy, a deal or the rocks, and who
// goes. This writes it: each camp choosing its ambassador, the two meeting on neutral ground, the
// negotiation line by line, the deal or the draw, and the walk back to camp with the news.
import { placeScene, plateKey, VENUES, teamSpot, campSlot } from './steps.js';
import { voicer, P, listOf } from './voiced.js';

const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };

/** steps for the whole twist. ctx: { ep, host, venue, neutral (plate key) } */
export function ambassadorsDay({ ep, host, venue, neutral }) {
  const d = ep.ambassadorData, m = d?.ambassadorMeeting;
  if (!m) return [];
  const V = voicer(`amb|${ep.num}`);
  const bond = bondOf(ep);
  const steps = [];
  const say = (by, text, focus = [by], extra = {}) => steps.push({ k: 'say', by, text, focus, ...extra });
  const hostSay = (text, focus = [], extra = {}) => steps.push({ k: 'say', by: host, host: true, text, focus, ...extra });
  const beat = (text, focus = [], extra = {}) => steps.push({ k: 'beat', text, focus, ...extra });
  const conf = (by, text) => steps.push({ k: 'conf', by, text });
  const Vn = VENUES[venue] || VENUES['hosted-camp'];
  const campKey = (tribe, tod) => plateKey(venue, teamSpot(venue, Vn.public, campSlot(ep, tribe, venue)), tod) || plateKey(venue, Vn.public, tod);
  const sel = d.ambassadorSelections || [];
  const amb = sel.map(s => s.ambassador).filter(Boolean);
  const typeOf = n => (m.types || []).find(t => t.name === n)?.type || 'emotional';
  // the ambassador's own lines (accepting, the confessional) follow how they negotiate: a manipulator
  // doesn't agonise on camera the way an emotional one does
  const STYLE = { manipulator: 'sharp', villain: 'sharp', dealmaker: 'dry', 'loyal-shield': 'soft', emotional: 'soft' };
  const VA = (n, o, tag) => { const f = STYLE[typeOf(n)]; return f && o[f] ? V('', { any: o[f] }, `${tag}|${n}`) : V(n, o, tag); };
  const tribeOf = n => sel.find(s => (s.members || []).includes(n) || s.ambassador === n)?.tribe || null;

  // ── each camp chooses ──
  for (const s of sel) {
    const A = s.ambassador, R = s.runnerUp;
    const mates = (s.members || []).filter(n => n !== A);
    const backer = mates.filter(n => n !== R).sort((x, y) => bond(A, y) - bond(A, x))[0] || mates[0];
    const key = campKey(s.tribe, 'day');
    if (!key) continue;
    steps.push({ k: 'scene', spot: Vn.public, tod: 'day', plate: key, place: `${s.tribe} Camp`, time: 'Morning', card: !steps.some(x => x.k === 'scene'), cut: steps.some(x => x.k === 'scene'), focus: [A, backer, R].filter(Boolean), bg: [], places: placeScene(key, [A, backer, R, ...mates].filter(Boolean).filter((n, i, a) => a.indexOf(n) === i).slice(0, 8), []) });
    beat(`${s.tribe} has to send one person to meet the other team. Whoever goes decides who goes home tonight.`, mates.slice(0, 3), { tense: true });
    if (backer) say(backer, V(backer, {
      sharp: [`It should be ${A}. ${A} is the only one of us who can lie with a straight face.`], loud: [`${A}! Send ${A}! ${A} can talk to anybody!`],
      soft: [`I think it should be ${A}. Everybody trusts ${A}.`], dry: [`${A}. Obviously. The rest of us would panic.`], odd: [`I nominate ${A}. ${A} has the best negotiating face.`],
      any: [`It should be ${A}.`],
    }, `nom-${s.tribe}`), [backer, A]);
    if (R) {
      say(R, V(R, {
        sharp: [`I could do it. I'm just saying.`], loud: [`Wait, why not me? I'd crush it!`], soft: [`I mean... I could go, if nobody else wants to.`],
        dry: [`I was going to volunteer, but sure.`], odd: [`I also have a negotiating face. Look. This is it.`], any: [`I could go.`],
      }, `ru-${s.tribe}`), [R]);
      if (backer) say(backer, V(backer, { any: [`No offense, ${R}, but ${A}'s better at this.`, `Next time, ${R}. Okay?`], loud: [`Sorry, ${R}! It's ${A}!`] }, `ru2-${s.tribe}`), [backer, R]);
    }
    say(A, VA(A, {
      sharp: [`Fine. I'll go. Just don't make me regret it.`, `Okay. I'll handle it. I always do.`], loud: [`I got this! Leave it to me!`, `Let's go! Nobody from this team is going home!`],
      soft: [`Okay. I'll try my best. I'm scared, but okay.`, `I'll do it. I won't let you down, I promise.`], dry: [`Sure. Send the person who talks.`, `Great. No pressure.`],
      odd: [`I accept this sacred quest.`, `I'll go. If I don't come back, tell my mom I was brave.`], any: [`Okay. I'll go.`],
    }, `accept-${s.tribe}`), [A]);
    const ask = mates.find(n => n !== backer && n !== R) || backer;
    if (ask) {
      say(ask, V(ask, {
        sharp: [`Whatever they offer you, the answer is no. None of us.`], loud: [`Don't you DARE give them one of us!`], soft: [`Please come back with all of us still here.`],
        dry: [`Try not to sell us out. It'd be awkward.`], odd: [`Bring us back a good deal. And maybe a snack.`], any: [`Don't give them any of us.`],
      }, `ask-${s.tribe}`), [ask, A]);
      say(A, VA(A, { any: [`I'll do what I can.`, `I'll bring back the best deal I can get.`], sharp: [`I'll do what I have to.`, `I'll handle it. That's what you sent me for.`], soft: [`I'll try. That's all I can promise.`, `I'll fight for every one of you. I promise.`], loud: [`Nobody's going home from here! Trust me!`, `Nobody's touching this team! Not on my watch!`] }, `promise-${s.tribe}`), [A, ask]);
    }
    conf(A, VA(A, {
      sharp: [`They picked me because they think I'll protect them. I'll protect whoever keeps me in this game.`, `Everybody thinks I'm going in there for the team. I'm going in there for me.`],
      loud: [`This is the biggest thing I've done out here, and I'm not blowing it!`, `I've got the whole team riding on my back! No pressure! Lots of pressure!`],
      soft: [`Somebody's game ends today because of what I say. I don't know if I can live with that.`, `I didn't want this. I just didn't know how to say no.`],
      dry: [`I get to decide who goes home today. Everybody's going to be very nice to me this morning.`, `Ambassador. It sounds important. It mostly means I get blamed.`],
      odd: [`I've never negotiated anything in my life. I once traded a sandwich for half a sandwich. I lost.`],
      any: [`Somebody's going home because of what I say today.`],
    }, `conf-${s.tribe}`));
  }

  // ── the neutral ground ──
  if (!neutral || amb.length < 2) return steps;
  const [A1, A2] = amb;
  steps.push({ k: 'scene', spot: 'neutral', tod: 'day', plate: neutral, place: 'Neutral Ground', time: 'Afternoon', card: false, cut: true, focus: amb, bg: [], places: placeScene(neutral, amb, [], { host }), host });
  hostSay(`${listOf(amb)}. You're here for your teams. Between you, you agree on one name, and that person goes home tonight. If you can't agree... ${amb.length === 2 ? 'you draw rocks, and one of you goes home instead' : 'the rocks decide'}.`, amb);
  steps.push({ k: 'title', kicker: 'Twist', name: 'The Ambassadors', faces: amb, vs: amb.length === 2 });
  hostSay(`You've got as long as you need. I'll be back.`);
  beat(`The host walks away. ${listOf(amb)} ${amb.length === 2 ? 'look at each other' : 'look at one another'}.`, amb, { tense: true });
  const b12 = bond(A1, A2);
  if (b12 >= 3) { say(A1, V(A1, { any: [`Of all the people they could have sent.`], soft: [`Hey, you. I'm kind of glad it's you.`], sharp: [`Well. At least it's somebody I like.`] }, 'meet1'), amb); say(A2, V(A2, { any: [`Yeah. This is going to be hard.`], loud: [`Ugh, why does it have to be you? I like you!`], dry: [`This would be easier if I hated you.`] }, 'meet2'), amb); }
  else if (b12 <= -2) { say(A1, V(A1, { any: [`Great. It's you.`], sharp: [`Of course they sent you.`], loud: [`You?! Seriously?!`] }, 'meet1'), amb); say(A2, V(A2, { any: [`Trust me, I'm thrilled too.`], sharp: [`Try to keep up.`], dry: [`The feeling's mutual.`] }, 'meet2'), amb); }
  else { say(A1, V(A1, { any: [`So. You're the one.`], soft: [`Hi. This is so weird.`], loud: [`Okay! Let's do this!`] }, 'meet1'), amb); say(A2, V(A2, { any: [`Looks like it.`], dry: [`Apparently.`], sharp: [`Let's get this over with.`] }, 'meet2'), amb); }

  // ── the negotiation ──
  // The user, 2026-10-17: "the ambassadors should have a better debate with actual reasonings and a conclusion, when
  // they announce the eliminated with reactions, maybe drama, and goodbye". Every reason is the record's: challenge wins
  // (chalRecord), the alliance a name holds together, a grudge (bond), how loved a name is on its own team, the team
  // sizes, and the engine's own reason for the name they settle on (twists.js targetReason).
  const S = ep.gsSnapshot || {};
  const winsOf = n => (S.chalRecord || globalThis.gs?.chalRecord || {})[n]?.wins || 0;
  const allianceOf = n => (S.namedAlliances || []).find(a => a.active !== false && (a.members || []).includes(n)) || null;
  const teamOf = n => sel.find(s => (s.members || []).includes(n) || s.ambassador === n) || null;
  const liked = n => { const mates = (teamOf(n)?.members || []).filter(x => x !== n); return mates.length ? mates.reduce((a, x) => a + bond(n, x), 0) / mates.length : 0; };
  const word = n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || String(n);
  // why `by` wants `n` gone, and why `by` won't hand over `n`, their own: each reason said once in the meeting (two names
  // from one alliance are not both "holding it together"), and two people's words never the same sentence
  const usedCase = new Set();
  const pickH = (arr, ...k) => arr[[...k.join('|')].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) % arr.length];
  const caseAgainst = (by, n) => {
    const w = winsOf(n), al = allianceOf(n);
    const opts = [
      bond(by, n) <= -2 && ['grudge:' + n, [`I'll be honest with you. ${n} and I have never gotten along, and I'm not walking into the merge with ${n} there.`, `I can't stand ${n}. I'm not going to pretend this is strategy. I just don't want ${n} at the merge.`]],
      w >= 2 && ['wins:' + n, [`${n} has won ${word(w)} challenges. If ${n} makes the merge, ${n} wins immunity every week and neither of us ever gets a shot.`, `${word(w).replace(/^./, c => c.toUpperCase())} challenge wins. That's ${n}. Let ${n} into the merge, and we're all playing for second.`]],
      al && ['al:' + al.name, [`${n} is holding ${al.name} together. Take ${n} out, and ${al.name} falls apart before the merge.`, `${al.name} runs through ${n}. Without ${n}, it's just a group of people who used to have a plan.`]],
      liked(n) >= 3 && ['liked:' + n, [`Everybody on ${P(n).posAdj} team loves ${n}. At the end, that's a jury that votes for ${n}. I'd rather deal with it now.`, `Have you seen how ${P(n).posAdj} team looks at ${n}? That's a winner's jury, and it's already forming.`]],
      ['threat:' + n, [`${n} is the one on your side I'd be scared of at the merge. You know it, and I know it.`, `If I'm honest, ${n} is the name I've been worried about since day one.`]],
    ].filter(Boolean);
    const [key, lines] = opts.find(([k]) => !usedCase.has(k)) || opts[opts.length - 1];
    usedCase.add(key);
    return pickH(lines, by, n, key);
  };
  const usedFor = new Set();
  const caseFor = (by, n) => {
    const opts = [
      bond(by, n) >= 4 && [`${n} is my closest friend out here. I'm not handing ${P(n).obj} over.`, `${n} has had my back since day one. You're not getting ${n}.`, `Not ${n}. ${n} is the one person here I actually trust.`],
      winsOf(n) >= 2 && [`${n} is the reason my team has won anything. Without ${n}, we lose every challenge until the merge.`, `${n} carries us. Give you ${n}, and my team doesn't win another challenge.`],
      allianceOf(n)?.members?.includes(by) && [`${n} is with me. I'm not walking back into camp having given up my own ally.`, `${n} and I are in this together. That's not on the table.`],
      [`${n} hasn't done anything to deserve this. I'm not putting ${P(n).posAdj} name on the table.`, `I'm not giving you ${n}. ${n} has been nothing but good to my team.`],
    ].filter(Boolean)[0];
    const fresh = opts.filter(t => !usedFor.has(t.replace(n, '')));
    const t = pickH(fresh.length ? fresh : opts, by, n, 'for');
    usedFor.add(t.replace(n, ''));
    return t;
  };
  const props = m.proposals || [];
  const p1 = props.find(x => x.proposer === A1)?.proposed || null;
  const p2 = props.find(x => x.proposer === A2)?.proposed || null;
  const dom = m.dominator, def = m.defender;
  const lead = dom || A1, other = lead === A1 ? A2 : A1;
  const leadName = lead === A1 ? p1 : p2, otherName = lead === A1 ? p2 : p1;
  const OPEN = {
    manipulator: n => [`I've been thinking about this all day, and there's one name I keep coming back to. What if we talked about ${n}?`],
    villain: n => [`Let's not waste each other's time. It's ${n}. Say yes, and we both go back to camp.`],
    dealmaker: n => [`Here's what I'm thinking. ${n} goes home, and when we merge, I owe you one. A real one.`],
    'loyal-shield': n => [`Before we start, I'm not giving you anybody from my team. So let's talk about yours. Let's talk about ${n}.`],
    emotional: n => [`I hate this. I really hate this. If I have to say a name, it's ${n}. I'm sorry.`],
  };
  if (leadName) {
    say(lead, (OPEN[typeOf(lead)] || OPEN.emotional)(leadName)[0], [lead, other]);
    say(other, `Why ${leadName}?`, [other, lead]);
    say(lead, caseAgainst(lead, leadName), [lead, other]);
  }
  if (otherName && leadName) {
    say(other, caseFor(other, leadName), [other, lead]);
    say(other, V(other, {
      sharp: [`If we're being honest about threats, let's talk about ${otherName}.`], loud: [`And while we're at it, what about ${otherName}?`],
      soft: [`If it has to be somebody, can we at least talk about ${otherName}?`], dry: [`Funny. I came here with a different name. ${otherName}.`],
      odd: [`Counter-offer: ${otherName}. And I keep ${leadName}. And we never speak of this again.`], any: [`What about ${otherName}?`],
    }, 'counter'), [other, lead]);
    say(other, caseAgainst(other, otherName), [other, lead]);
    say(lead, caseFor(lead, otherName), [lead, other]);
    say(other, V(other, { any: [`And you think I can walk back having given up ${leadName}?`], loud: [`Well, I can't give you ${leadName} either!`], dry: [`Then we have a problem.`] }, 'standoff'), [other, lead]);
    beat(`Neither of them says anything for a long time.`, amb, { tense: true });
    // the numbers: the smaller team has less to give
    const sizeOf = n => (teamOf(n)?.members || []).length;
    const [small, big] = sizeOf(A2) - sizeOf(A1) >= 2 ? [A1, A2] : sizeOf(A1) - sizeOf(A2) >= 2 ? [A2, A1] : [null, null];
    if (small) {
      say(small, `Think about the numbers. Your team has ${word(sizeOf(big))} people, mine has ${word(sizeOf(small))}. You can lose one and still be fine at the merge. We can't.`, [small, big]);
      say(big, V(big, { any: [`That's not my problem. That's what happens when you lose challenges.`], soft: [`I know. I know it isn't fair. But I have to go back to my team too.`], dry: [`Losing challenges was a choice. Not mine, but a choice.`] }, 'numbers'), [big, small]);
    }
  }
  if (m.resistFired && def && dom) {
    say(def, V(def, {
      sharp: [`No. I see exactly what you're doing, and it's not going to work on me.`], loud: [`Stop! I'm not doing your dirty work for you!`],
      soft: [`I know you think I'll just go along with it. I won't. Not this time.`], dry: [`You're very good at this. I'm still saying no.`], odd: [`Nice try. I've seen this movie. I know how it ends.`], any: [`No. I'm not doing this your way.`],
    }, 'resist'), [def, dom], { loud: true });
    say(dom, V(dom, { any: [`Okay. Then what do you suggest?`], sharp: [`Fine. Then you come up with something better.`], loud: [`Then what?! Somebody has to go!`] }, 'resist-back'), [dom, def]);
  } else if (dom && typeOf(dom) === 'manipulator') {
    say(dom, `Let me ask you something. Honestly. Who on your team do you think is holding you back?`, [dom, def || other]);
    beat(`${def || other} opens ${P(def || other).posAdj} mouth, and then closes it again.`, [def || other]);
  } else if (dom && typeOf(dom) === 'villain') {
    say(dom, V(dom, { any: [`Here's how this goes. You agree with me, or we draw rocks, and I like my odds.`], loud: [`Agree with me, or we go to rocks! Your choice!`] }, 'threat'), [dom, def || other]);
  }

  // ── the conclusion: the deal and why, or the rocks ──
  const why = String(m.targetReason || '');
  if (m.agreed && m.target) {
    const T = m.target;
    // the one giving up a teammate, and the one taking the name
    const giver = amb.find(a => teamOf(T)?.tribe && teamOf(a)?.tribe === teamOf(T).tribe) || other;
    const taker = amb.find(a => a !== giver) || lead;
    if (m.sharedEnemy && T === m.sharedEnemy) {
      say(other, `What about ${T}?`, [other, lead]);
      beat(`${lead} goes very still.`, [lead]);
      say(lead, V(lead, { any: [`Actually? Yeah. I can't stand ${T}.`], soft: [`I feel bad saying it, but yeah. ${T}.`], loud: [`Oh, thank goodness somebody said it! ${T}!`] }, 'shared'), [lead, other]);
      say(other, V(other, { any: [`Me neither.`], loud: [`RIGHT?!`], dry: [`So we agree on something.`] }, 'shared2'), [other]);
      beat(`They both laugh, a little too loudly, and then stop.`, amb);
      say(lead, `It's not about threats any more. We'd both rather go into the merge without ${T}. That's the deal.`, amb);
    } else if (/steered/.test(why) && dom) {
      say(dom, `Forget the names we came in with. Who's the one person neither of us could ever get on our side? It's ${T}.`, [dom, def || other]);
      say(def || other, `I hadn't thought about it like that.`, [def || other, dom]);
      say(dom, `You don't have to. That's what I'm here for.`, [dom]);
    } else if (/grudge/.test(why) && dom) {
      say(dom, `${T}. That's my price. Take it, or we go to rocks, and I like my odds a lot more than you like yours.`, [dom, def || other], { tense: true });
      beat(`${def || other} looks at the bag of rocks on the table, and then back at ${dom}.`, [def || other]);
    } else {
      if (T === leadName || T === otherName) say(taker, `It keeps coming back to ${T}. Nothing you've said changes why.`, [taker, giver]);
      else { say(taker, `Okay. Forget both of them. What about ${T}?`, [taker, giver]); say(taker, caseAgainst(taker, T), [taker, giver]); }
      say(giver, T === leadName || T === otherName ? `${T} is the one I came here to protect.` : `${T} is on my team.`, [giver, taker]);
      beat(`${giver} doesn't say no.`, [giver], { tense: true });
      say(giver, V(giver, { any: [`But you're right. I couldn't beat ${T} at the merge either.`], soft: [`I hate that you're right. I couldn't beat ${T} at the merge either.`], sharp: [`Fine. You're right, and I hate it. I couldn't beat ${T} at the merge either.`] }, 'concede'), [giver, taker]);
    }
    say(lead, `So. ${T}?`, [lead, other], { tense: true });
    say(other, V(other, { any: [`${T}.`], soft: [`${T}. I'm sorry, ${T}.`], sharp: [`${T}. Done.`] }, 'agree'), [other, lead]);
    beat(`They shake hands. Neither of them looks happy about it.`, amb);
    conf(giver, V(giver, {
      sharp: [`I gave up one of my own. It was the right move for my game, and I'll keep telling myself that.`], loud: [`I just gave away somebody from MY team. I feel sick.`],
      soft: [`I have to go back and look ${T}'s friends in the eye. I don't know how I'm going to do that.`], dry: [`Nobody ever thanks the ambassador.`],
      any: [`I'll have to live with that one.`],
    }, 'giver-conf'));
    hostSay(`Have you reached a decision?`, amb);
    beat(`${A1} and ${A2} look at each other one more time.`, amb, { tense: true });
    hostSay(`${T} is going home tonight.`, [], { tense: true });
    steps.push({ k: 'title', kicker: 'They agree', name: T, faces: [T], tone: 'out' });
  } else if (m.eliminatedByRocks || m.rockDrawLoser) {
    const L = m.rockDrawLoser || m.eliminated, W = amb.find(n => n !== L);
    say(A1, V(A1, { any: [`I'm not giving you anybody. I'd rather take my chances.`], soft: [`I can't do it. I can't give you a name.`], loud: [`I'm not giving you ANYBODY!`] }, 'nodeal'), [A1, A2]);
    say(A2, V(A2, { any: [`Then neither will I.`], sharp: [`Then we're done here.`], dry: [`Then I guess we're doing this the hard way.`] }, 'nodeal2'), [A2, A1]);
    conf(A2, `Neither of us would give up our own. So now one of us goes home instead. I don't know if that's brave or stupid.`);
    hostSay(`No deal?`, amb);
    say(A1, `No deal.`, [A1]);
    hostSay(`Then it comes down to the rocks. One white, one black. Draw the black, and you're the one going home.`, amb, { tense: true });
    beat(`The host holds out the bag. ${A1} and ${A2} each reach in and take a rock, and keep their fists closed.`, amb, { tense: true });
    hostSay(`Open your hands.`, amb);
    beat(`${W} opens first. White.`, [W]);
    beat(`${L} doesn't need to look. ${L} looks anyway. Black.`, [L], { tense: true, act: { kind: 'shake', who: [L] } });
    say(L, V(L, {
      sharp: [`A rock. I'm going home because of a rock.`], loud: [`NO! No, no, no! Are you kidding me?!`], soft: [`Oh. Okay. Okay. I tried. I really tried.`],
      dry: [`Well. That's one way to go.`], odd: [`I want a rematch. Best of three.`], any: [`I'm going home.`],
    }, 'lost'), [L], { shock: true });
    say(W, V(W, { any: [`I'm sorry. I really am.`], sharp: [`It was never going to be personal.`], loud: [`I'm sorry! I didn't want it to be like this!`] }, 'won'), [W, L]);
    say(L, V(L, { any: [`Don't be. I didn't give them anybody. Tell my team that.`], soft: [`Tell my team I didn't give them anybody. Please.`], sharp: [`Tell my team I protected every one of them. Make sure they know.`] }, 'lost2'), [L, W]);
    steps.push({ k: 'title', kicker: 'The black rock', name: L, faces: [L], tone: 'out' });
  }

  // ── the news, at camp: the reactions, the fight, the goodbye ──
  const gone = m.eliminated;
  if (gone) {
    const goneTribe = tribeOf(gone);
    const gs2 = sel.find(s => s.tribe === goneTribe);
    const myAmb = gs2?.ambassador;
    const key = gs2 ? campKey(goneTribe, 'day') : null;
    const mates = gs2 ? (gs2.members || []).filter(n => n !== myAmb && n !== gone) : [];
    const friend = mates.slice().sort((x, y) => bond(gone, y) - bond(gone, x) || x.localeCompare(y))[0] || null;
    const cool = mates.filter(n => n !== friend).sort((x, y) => bond(gone, x) - bond(gone, y) || x.localeCompare(y))[0] || null;
    if (gs2 && myAmb && myAmb !== gone && key) {
      steps.push({ k: 'scene', spot: Vn.public, tod: 'day', plate: key, place: `${goneTribe} Camp`, time: 'Late afternoon', card: false, cut: true, focus: [myAmb, gone], bg: [], places: placeScene(key, [myAmb, gone, friend, cool, ...mates].filter(Boolean).filter((n, i, a) => a.indexOf(n) === i).slice(0, 8), []), act: { kind: 'arrive', who: [myAmb] } });
      beat(`${goneTribe} sees ${myAmb} coming back up the path, and starts to cheer, then stops. ${myAmb} isn't smiling.`, [myAmb, ...mates.slice(0, 3)], { tense: true });
      say(myAmb, V(myAmb, { any: [`I need to tell you guys something.`], soft: [`I'm so sorry. I need to tell you something.`], sharp: [`Sit down. All of you.`], loud: [`Okay. Everybody. Listen.`] }, 'news'), [myAmb]);
      say(myAmb, V(myAmb, { any: [`They're sending ${gone} home.`], soft: [`${gone}, it's you. I'm so sorry.`], sharp: [`It's ${gone}. It had to be somebody.`], dry: [`${gone}. It's ${gone}.`] }, 'name'), [myAmb, gone], { tense: true });
      say(gone, V(gone, {
        sharp: [`You had one job. Protect this team. And you gave them ME?`], loud: [`WHAT?! You gave them me?! Out of everybody?!`], soft: [`Did you fight for me? Even a little?`],
        dry: [`Of everyone on this team, you picked me. Good to know.`], odd: [`Me? But I was so nice to you! I shared my blanket!`], any: [`Me? Why me?`],
      }, 'gone-react'), [gone, myAmb], { shock: true });
      // why, as the ambassador tells it: the meeting's own reason
      say(myAmb, m.sharedEnemy && gone === m.sharedEnemy ? `Honestly? They wanted you gone, and so did I. You've made enemies out here, ${gone}. I'm sorry.`
        : /steered/.test(why) ? `They kept steering it back to you. Every name I gave them, they came back to you. I couldn't stop it.`
          : /grudge/.test(why) ? `It was you, or it was me at the rocks. They wouldn't take anybody else. I made the call.`
            : winsOf(gone) >= 2 ? `They're scared of you, ${gone}. You've won ${word(winsOf(gone))} challenges. Nobody wants to face you at the merge.`
              : `I fought for you, I swear. But it was you, or one of us going to the rocks, and I couldn't risk the team.`, [myAmb, gone]);
      if (m.sharedEnemy && gone === m.sharedEnemy) beat(`${gone} stares at ${myAmb}. Nobody else says a word.`, [gone, myAmb], { tense: true });
      // the fight: the one closest to the one leaving takes it out on the ambassador; somebody else takes the ambassador's side
      if (friend) {
        say(friend, V(friend, { any: [`This isn't fair. ${gone} didn't do anything.`], loud: [`This is garbage! ${gone} should be staying!`], soft: [`${gone}, no. I'm so sorry.`], sharp: [`We sent you in there to protect us, ${myAmb}.`] }, 'gone-friend'), [friend, myAmb], { loud: bond(friend, myAmb) < 1 });
        if (bond(friend, myAmb) < 1) say(myAmb, V(myAmb, { any: [`You weren't in that room. You don't get to say that.`], loud: [`Then YOU go next time!`], soft: [`I know. I know. I'm sorry.`] }, 'amb-back'), [myAmb, friend], { loud: true });
      }
      if (cool && cool !== friend && bond(cool, myAmb) >= 1) say(cool, V(cool, { any: [`${myAmb} did what any of us would've done. Somebody had to go.`], dry: [`It's a game. Somebody was always going home today.`], sharp: [`Better ${gone} than one of us. I said it.`] }, 'amb-side'), [cool, friend || myAmb]);
      // the goodbye
      if (friend) beat(`${gone} hugs ${friend} for a long time.`, [gone, friend], { act: { kind: 'hug', who: [gone, friend] } });
      say(gone, V(gone, {
        sharp: [`Win this. For me. And don't trust ${myAmb}.`], loud: [`You guys better win this! I mean it! For me!`], soft: [`I'm going to miss you all so much. Go win this.`],
        dry: [`Well. It's been real. Mostly real. Win something.`], odd: [`Remember me. Name a rock after me.`], any: [`Go win this. For me.`],
      }, 'bye'), [gone, ...(friend ? [friend] : [])]);
      steps.push({ k: 'out', who: gone, focus: [gone] });
      conf(gone, V(gone, {
        sharp: [`I didn't get voted out. I got traded. There's a difference, and ${myAmb} knows it.`], loud: [`I didn't even get a VOTE! Two people in a clearing decided my whole game!`],
        soft: [`I didn't get to fight for myself. That's the part that hurts.`], dry: [`Voted out by a committee of two. Very efficient.`], any: [`I never even got a vote.`],
      }, 'gone-conf'));
      conf(myAmb, V(myAmb, {
        sharp: [`I'd do it again. I'm not sure my team will ever forgive me, but I'd do it again.`], loud: [`That was the worst thing I've ever had to do. EVER.`],
        soft: [`I keep seeing ${gone}'s face when I said the name. I don't think I'm going to sleep tonight.`], dry: [`Being the ambassador is great until you have to come home.`],
        odd: [`Note to self: never volunteer for anything again.`], any: [`I had to give them a name. I'm not proud of it.`],
      }, 'amb-conf'));
    } else if (gs2 && myAmb === gone && key) {
      // the ambassador drew the black rock: the host brings the news to a team that sent somebody and got nobody back
      steps.push({ k: 'scene', spot: Vn.public, tod: 'day', plate: key, place: `${goneTribe} Camp`, time: 'Late afternoon', card: false, cut: true, focus: mates.slice(0, 3), bg: [], places: placeScene(key, [...mates].slice(0, 8), [], { host }), host, act: { kind: 'arrive', who: [host] } });
      beat(`${goneTribe} waits for ${gone} to come back up the path. The host walks into camp instead.`, mates.slice(0, 3), { tense: true });
      hostSay(`There was no deal. ${gone} wouldn't give up any of you, and ${gone} drew the black rock. ${gone} is gone.`, mates.slice(0, 3), { tense: true });
      if (friend) say(friend, V(friend, { any: [`No. ${gone} did that for us?`], loud: [`NO! ${gone} went home for US?!`], soft: [`${gone} protected every single one of us.`], sharp: [`${gone} took a rock for this team. Remember that.`] }, 'rock-friend'), [friend], { shock: true });
      if (cool && cool !== friend) conf(cool, V(cool, { any: [`${gone} went down protecting us. I'm grateful. I'm also a little relieved it wasn't me.`], dry: [`Noble. Very noble. Also, one fewer of us.`] }, 'rock-cool'));
      steps.push({ k: 'out', who: gone, focus: [] });
    } else if (gs2) {
      steps.push({ k: 'out', who: gone, focus: [gone] });
    }
  }
  return steps;
}
