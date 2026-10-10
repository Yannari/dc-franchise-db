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
      say(A, VA(A, { any: [`I'll do what I can.`], sharp: [`I'll do what I have to.`], soft: [`I'll try. That's all I can promise.`], loud: [`Nobody's going home from here! Trust me!`] }, `promise-${s.tribe}`), [A, ask]);
    }
    conf(A, VA(A, {
      sharp: [`They picked me because they think I'll protect them. I'll protect whoever keeps me in this game.`],
      loud: [`This is the biggest thing I've done out here, and I'm not blowing it!`],
      soft: [`Somebody's game ends today because of what I say. I don't know if I can live with that.`],
      dry: [`I get to decide who goes home today. Everybody's going to be very nice to me this morning.`],
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
    emotional: n => [`I hate this. I really hate this. If I have to say a name... it's ${n}. I'm sorry.`],
  };
  if (leadName) say(lead, (OPEN[typeOf(lead)] || OPEN.emotional)(leadName)[0], [lead, other]);
  if (otherName && leadName) {
    say(other, V(other, {
      sharp: [`${leadName}? Cute. No. If anybody's going, it's ${otherName}.`], loud: [`No way! ${leadName} is one of mine! What about ${otherName}?`],
      soft: [`Please, not ${leadName}. ${leadName} is my friend. What about ${otherName}?`], dry: [`Interesting pick. I was going to say ${otherName}.`],
      odd: [`Counter-offer: ${otherName}. And I keep ${leadName}. And we never speak of this again.`], any: [`Not ${leadName}. What about ${otherName}?`],
    }, 'counter'), [other, lead]);
    say(lead, V(lead, {
      sharp: [`${otherName} is on my team. I'm not walking back into camp having handed over ${otherName}.`], loud: [`No! ${otherName} is ours! You can't have ${otherName}!`],
      soft: [`I can't give you ${otherName}. I'd never be able to look at my team again.`], dry: [`And I can walk back having given up ${otherName}? No.`],
      odd: [`${otherName} is like family. Annoying family. But family.`], any: [`I can't give you ${otherName}.`],
    }, 'defend'), [lead, other]);
    say(other, V(other, { any: [`And you think I can walk back having given up ${leadName}?`], loud: [`Well, I can't give you ${leadName} either!`], dry: [`Then we have a problem.`] }, 'standoff'), [other, lead]);
    beat(`Neither of them says anything for a long time.`, amb, { tense: true });
  }
  if (m.resistFired && def && dom) {
    say(def, V(def, {
      sharp: [`No. I see exactly what you're doing, and it's not going to work on me.`], loud: [`Stop! I'm not doing your dirty work for you!`],
      soft: [`I know you think I'll just go along with it. I won't. Not this time.`], dry: [`You're very good at this. I'm still saying no.`], odd: [`Nice try. I've seen this movie. I know how it ends.`], any: [`No. I'm not doing this your way.`],
    }, 'resist'), [def, dom], { loud: true });
    say(dom, V(dom, { any: [`...Okay. Then what do you suggest?`], sharp: [`Fine. Then you come up with something better.`], loud: [`Then what?! Somebody has to go!`] }, 'resist-back'), [dom, def]);
  } else if (dom && typeOf(dom) === 'manipulator') {
    say(dom, `Let me ask you something. Honestly. Who on your team do you think is holding you back?`, [dom, def || other]);
    beat(`${def || other} opens ${P(def || other).posAdj} mouth, and then closes it again.`, [def || other]);
  } else if (dom && typeOf(dom) === 'villain') {
    say(dom, V(dom, { any: [`Here's how this goes. You agree with me, or we draw rocks, and I like my odds.`], loud: [`Agree with me, or we go to rocks! Your choice!`] }, 'threat'), [dom, def || other]);
  }
  if (m.agreed && m.sharedEnemy && m.target === m.sharedEnemy) {
    say(other, `What about ${m.sharedEnemy}?`, [other, lead]);
    beat(`${lead} goes very still.`, [lead]);
    say(lead, V(lead, { any: [`...Actually? Yeah. I can't stand ${m.sharedEnemy}.`], soft: [`I feel bad saying it, but... yeah. ${m.sharedEnemy}.`], loud: [`Oh, thank god somebody said it! ${m.sharedEnemy}!`] }, 'shared'), [lead, other]);
    say(other, V(other, { any: [`Me neither.`], loud: [`RIGHT?!`], dry: [`So we agree on something.`] }, 'shared2'), [other]);
    beat(`They both laugh, a little too loudly, and then stop.`, amb);
  }

  // ── the deal, or the rocks ──
  if (m.agreed && m.target) {
    const T = m.target;
    say(lead, `So. ${T}?`, [lead, other], { tense: true });
    say(other, V(other, { any: [`${T}.`], soft: [`...${T}. I'm sorry, ${T}.`], sharp: [`${T}. Done.`] }, 'agree'), [other, lead]);
    beat(`They shake hands. Neither of them looks happy about it.`, amb);
    hostSay(`Have you reached a decision?`, amb);
    beat(`${A1} and ${A2} look at each other one more time.`, amb, { tense: true });
    hostSay(`${T}... is going home tonight.`, [], { tense: true });
    steps.push({ k: 'title', kicker: 'They agree', name: T, faces: [T], tone: 'out' });
  } else if (m.eliminatedByRocks || m.rockDrawLoser) {
    const L = m.rockDrawLoser || m.eliminated, W = amb.find(n => n !== L);
    say(A1, V(A1, { any: [`I'm not giving you anybody.`], soft: [`I can't do it. I can't give you a name.`], loud: [`I'm not giving you ANYBODY!`] }, 'nodeal'), [A1, A2]);
    say(A2, V(A2, { any: [`Then neither will I.`], sharp: [`Then we're done here.`], dry: [`Then I guess we're doing this the hard way.`] }, 'nodeal2'), [A2, A1]);
    hostSay(`No deal?`, amb);
    say(A1, `No deal.`, [A1]);
    hostSay(`Then it comes down to the rocks. One white, one black. Draw the black, and you're the one going home.`, amb, { tense: true });
    beat(`The host holds out the bag. ${A1} and ${A2} each reach in and take a rock, and keep their fists closed.`, amb, { tense: true });
    hostSay(`Open your hands.`, amb);
    beat(`${W} opens first. White.`, [W]);
    beat(`${L} doesn't need to look. ${L} looks anyway. Black.`, [L], { tense: true, act: { kind: 'shake', who: [L] } });
    say(L, V(L, {
      sharp: [`A rock. I'm going home because of a rock.`], loud: [`NO! No, no, no! Are you kidding me?!`], soft: [`Oh. Okay. Okay... I tried. I really tried.`],
      dry: [`Well. That's one way to go.`], odd: [`I want a rematch. Best of three.`], any: [`I'm going home.`],
    }, 'lost'), [L], { shock: true });
    say(W, V(W, { any: [`I'm sorry. I really am.`], sharp: [`It was never going to be personal.`], loud: [`I'm sorry! I didn't want it to be like this!`] }, 'won'), [W, L]);
    steps.push({ k: 'title', kicker: 'The black rock', name: L, faces: [L], tone: 'out' });
  }

  // ── the walk back with the news ──
  const gone = m.eliminated;
  if (gone) {
    const goneTribe = tribeOf(gone);
    const gs2 = sel.find(s => s.tribe === goneTribe);
    const myAmb = gs2?.ambassador;
    if (gs2 && myAmb && myAmb !== gone) {
      const key = campKey(goneTribe, 'day');
      const mates = (gs2.members || []).filter(n => n !== myAmb);
      const friend = mates.filter(n => n !== gone).sort((x, y) => bond(gone, y) - bond(gone, x))[0];
      if (key) {
        steps.push({ k: 'scene', spot: Vn.public, tod: 'day', plate: key, place: `${goneTribe} Camp`, time: 'Late afternoon', card: false, cut: true, focus: [myAmb, gone], bg: [], places: placeScene(key, [myAmb, gone, friend, ...mates].filter(Boolean).filter((n, i, a) => a.indexOf(n) === i).slice(0, 8), []), act: { kind: 'arrive', who: [myAmb] } });
        beat(`${goneTribe} sees ${myAmb} coming back up the path, and starts to cheer, then stops. ${myAmb} isn't smiling.`, [myAmb, ...mates.slice(0, 3)], { tense: true });
        say(myAmb, V(myAmb, { any: [`I need to tell you guys something.`], soft: [`I'm so sorry. I need to tell you something.`], sharp: [`Sit down. All of you.`], loud: [`Okay. Everybody. Listen.`] }, 'news'), [myAmb]);
        say(myAmb, V(myAmb, { any: [`They're sending ${gone} home.`], soft: [`${gone}... it's you. I'm so sorry.`], sharp: [`It's ${gone}. It had to be somebody.`], dry: [`${gone}. It's ${gone}.`] }, 'name'), [myAmb, gone], { tense: true });
        say(gone, V(gone, {
          sharp: [`You had one job. Protect this team. And you gave them ME?`], loud: [`WHAT?! You gave them me?! Out of everybody?!`], soft: [`...Did you fight for me? Even a little?`],
          dry: [`Of everyone on this team, you picked me. Good to know.`], odd: [`Me? But I was so nice to you! I shared my blanket!`], any: [`Me? Why me?`],
        }, 'gone-react'), [gone, myAmb], { shock: true });
        say(myAmb, V(myAmb, {
          soft: [`I fought for you, I swear. But it was you, or one of us going to rocks, and I couldn't risk it.`], sharp: [`It was you, or it was me at the rocks. I made the call.`],
          loud: [`I tried! I fought for you! They wouldn't budge!`], dry: [`I fought. I lost. I'm sorry.`], odd: [`I tried everything. I even did my negotiating face.`], any: [`I tried. I'm sorry.`],
        }, 'amb-defend'), [myAmb, gone]);
        if (friend) say(friend, V(friend, { any: [`This isn't fair. ${gone} didn't do anything.`], loud: [`This is garbage! ${gone} should be staying!`], soft: [`${gone}... no. I'm so sorry.`], sharp: [`We sent you in there to protect us, ${myAmb}.`] }, 'gone-friend'), [friend, myAmb]);
        steps.push({ k: 'out', who: gone, focus: [gone] });
        conf(myAmb, V(myAmb, {
          sharp: [`I'd do it again. I'm not sure my team will ever forgive me, but I'd do it again.`], loud: [`That was the worst thing I've ever had to do. EVER.`],
          soft: [`I keep seeing ${gone}'s face when I said the name. I don't think I'm going to sleep tonight.`], dry: [`Being the ambassador is great until you have to come home.`],
          odd: [`Note to self: never volunteer for anything again.`], any: [`I had to give them a name. I'm not proud of it.`],
        }, 'amb-conf'));
      }
    } else if (gone && gs2) {
      steps.push({ k: 'out', who: gone, focus: [gone] });
    }
  }
  return steps;
}
