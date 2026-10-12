// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/coach-tribal.js — the coaching twist at the vote, on the stepped stage
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10, of the coach season: "it needs to act like a real episode". Every pre-merge vote
// in a coach season played on the classic screens (steps.js tdTribalStepped refused anything with coach
// data), so the twist's biggest moments were tables: a coach on the block, the Save Card committed and
// signed, the votes landing on a coach, the replacement named, a signature refused. The engine decides
// all of it (coach-episode.js commitSaveCards before the read, maybeSaveCoach after it, eliminateCoach);
// this plays it: the coaches seated without a vote, the card called and signed (or not) before anybody
// writes a name, and after the read, the card's verdict and a coach's goodbye. Words only.
import { famOf, P, listOf } from './voiced.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

/** The coaches sitting at this vote (the tribe's, from the episode's own record). */
export function coachesAt(ep) {
  const t = ep?.tribalTribe;
  return (t && ep.coachData?.[t]?.coaches) || [];
}
/** Who the votes sent home before the card had its say: the coach saved, or the coach voted out. */
export function coachReadOut(ep) {
  return (ep.coachSaves || [])[0]?.coach || (ep.coachElimination || [])[0]?.coach || null;
}

function voice(ep, tagBase) {
  const used = new Set();
  return (n, o, tag) => {
    const f = famOf(n);
    const opts = (o[f] && o[f].length) ? o[f] : (o.any || Object.values(o)[0] || []);
    const fresh = opts.filter(t => !used.has(t));
    const list = fresh.length ? fresh : opts;
    const t = list[hash(`${ep.num}|${tagBase}|${tag}|${n}`) % list.length];
    used.add(t); return t;
  };
}

/** The coaches take their seats: steps after the host's opener. */
export function coachSeats(steps, ep, coaches) {
  if (!coaches.length) return;
  steps.push({ k: 'beat', text: `${listOf(coaches)} ${coaches.length > 1 ? 'sit' : `sit${P(coaches[0]).s}`} at the end of the row. No vote, but ${coaches.length > 1 ? 'they\'re' : `${P(coaches[0]).sub}'${P(coaches[0]).sub === 'they' ? 're' : 's'}`} still here, and still on the table.`, focus: coaches });
  steps[0].side = [...(steps[0].side || []), ...coaches.map(c => ({ tab: 'room', text: `${c} is a coach: no vote, but can be voted out.` }))];
}

const WHY = {
  decency: 'it is the right thing to do',
  'pact-already-broken': 'whatever they agreed was already broken',
  'bad-blood': 'they were never going to do each other favours',
  'rival-outbuilding': 'the other coach has built more of this team',
  strategic: 'the numbers did not come out in their favour',
};

const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const people = n => `${NUM[n] || n} ${n === 1 ? 'person' : 'people'}`;
const cap = t => t ? t[0].toUpperCase() + t.slice(1) : t;

/**
 * The coaches' huddle: whether tonight is the night for the Save Card, said before the host asks. The choice is
 * the engine's (coach-episode.js commitSaveCards, ep.coachCardCalls: played, held while in danger, or held because
 * nobody is coming); this only says it, so it can never disagree with what happens next. Co-coaches lean together
 * on the bench; a coach alone on a team has nobody to ask, so it is a confessional. A co-coach about to refuse to
 * sign stays evasive here: the refusal still lands when the host reads it. (The user, 2026-10-12: "do coach
 * signature and strategy, should we use the save card or not, is it in the stepped viewer?" It was not.)
 */
function huddle(steps, ep, coaches) {
  const d = (ep.coachCardCalls || []).find(c => c.tribe === ep.tribalTribe);
  if (!d || !coaches.length) return;
  const V = voice(ep, 'huddle');
  const lead = d.coach && coaches.includes(d.coach) ? d.coach : coaches[0], other = coaches.find(c => c !== lead);
  const heard = cap(d.aimed ? people(d.aimed) : 'some people');
  const verb = d.aimed === 1 ? 'has' : 'have';
  const side = text => [{ tab: 'room', text }];
  if (other) steps.push({ k: 'beat', text: `Before the votes, ${lead} leans over to ${other} at the end of the row and keeps ${P(lead).posAdj} voice down.`, focus: [lead, other] });

  if (d.why === 'safe') {
    if (other) {
      steps.push({ k: 'say', by: lead, text: V(lead, {
        sharp: [`Nobody's said our names all week. The card stays where it is.`, `They're not coming for us tonight. We keep it.`],
        loud: [`Nobody's coming for us! We keep the card, right?`, `Tonight's not about us. Card stays in the pocket!`],
        soft: [`I don't think anyone's coming for us tonight. Can we keep it?`, `It's not our night, is it? Let's hold on to it.`],
        dry: [`Nobody's even mentioned us. Let's not waste it.`, `We're the least interesting thing here tonight. We keep it.`],
        odd: [`The card is sleeping. Let it sleep.`, `My instincts say keep it. My instincts are rarely wrong. Occasionally wrong.`],
        any: [`Nobody's coming for us. We keep the card.`],
      }, 'safe-a'), focus: [lead, other], side: side(`Nobody's plan has a coach in it tonight: the card is held.`) });
      steps.push({ k: 'say', by: other, text: V(other, {
        sharp: [`Agreed. We'll need it later.`, `Fine. Later's when it matters.`],
        loud: [`Agreed! Save it for the big one!`, `Totally. Keep it!`],
        soft: [`Okay. That makes me feel better.`, `Yeah. Let's keep it.`],
        dry: [`Fine by me.`, `Sure. Wake me up when it's interesting.`],
        odd: [`Shh. Don't wake the card.`, `Yes. The card agrees.`],
        any: [`Agreed.`],
      }, 'safe-b'), focus: [other, lead] });
    } else steps.push({ k: 'conf', by: lead, text: V(lead, {
      sharp: [`Nobody's coming for me tonight. The card stays in my pocket.`, `I know what they're planning, and I'm not in it. I'm keeping the card.`],
      loud: [`Nobody's even said my name! The card is staying right where it is!`, `Not tonight! I'm saving this for when it counts!`],
      soft: [`I don't think it's me tonight. I really hope it's not me tonight. I'm keeping it.`, `I'm safe, I think. I'll hold on to it.`],
      dry: [`Nobody cares about me tonight. Which is exactly how I like it. Card stays.`, `Wasting it tonight would be like buying an umbrella in a drought.`],
      odd: [`The card told me to wait. We have an understanding.`, `I'm saving it. For a rainy day. Or a rainy vote.`],
      any: [`Nobody's coming for me tonight. I'm keeping the card.`],
    }, 'safe-c'), side: side(`Nobody's plan has ${lead} in it tonight: the card is held.`) });
    return;
  }

  if (d.held) {
    // in danger, and still holding it: a bet that the talk is only talk
    if (other) {
      steps.push({ k: 'say', by: lead, text: V(lead, {
        sharp: [`${heard} ${verb} said my name. Not enough to burn the card.`, `${heard} ${verb} been saying my name. I think it's noise.`],
        loud: [`${heard} ${verb} been saying my name! But I'm not wasting the card on a rumour!`, `People are talking about me! Do we play it? No. No, we don't. Right?`],
        soft: [`${heard} ${verb} said my name. I don't know if they mean it.`, `${heard} ${verb} been talking about me. Should I be worried?`],
        dry: [`${heard} ${verb} said my name. That's a conversation, not a vote.`, `I'm getting some attention. Not enough to spend the card on.`],
        odd: [`${heard} ${verb} been saying my name. Like a chant. A small, quiet chant.`, `I'm hearing whispers. Whispers aren't votes. Usually.`],
        any: [`${heard} ${verb} said my name. I'm not burning the card on that.`],
      }, 'gamble-a'), focus: [lead, other], tense: true, side: side(`${heard} ${verb} talked about voting ${lead} out; ${lead} holds the card anyway.`) });
      steps.push({ k: 'say', by: other, text: V(other, {
        sharp: [`Your call. Just don't make me regret it.`, `If you're wrong, you're the one going home.`],
        loud: [`Okay, but if you're wrong, I'm going to be SO mad!`, `It's your neck! Hopefully not literally!`],
        soft: [`Are you sure? I'll back you either way.`, `Okay. I trust you.`],
        dry: [`Bold. Let's see if it's smart too.`, `It's your neck.`],
        odd: [`I'll light a candle for you. Metaphorically.`, `Fortune favours the bold. Or eats them. One of those.`],
        any: [`It's your call.`],
      }, 'gamble-b'), focus: [other, lead] });
    }
    steps.push({ k: 'conf', by: lead, text: V(lead, {
      sharp: [`If I play it every time somebody says my name, it's gone by next week. I'm betting they won't follow through.`, `I can count. They don't have the numbers. I'm keeping it.`],
      loud: [`Is it risky? YES! Am I doing it anyway? ALSO YES!`, `I'm not wasting it! I just really, really hope I'm right!`],
      soft: [`I could be wrong. I really, really hope I'm not wrong.`, `Maybe I'm being stupid. But it might matter more later.`],
      dry: [`Either I'm right and I look clever, or I'm wrong and I'm on a boat. Let's find out.`, `If they really wanted me gone, they'd be quieter about it.`],
      odd: [`I'm keeping it. If I'm wrong, tell my plants I love them.`, `It's a gamble. I'm good at gambling. I've never gambled.`],
      any: [`I'm taking the risk. I'm keeping the card.`],
    }, 'gamble-c'), ...(other ? {} : { side: side(`${heard} ${verb} talked about voting ${lead} out; ${lead} holds the card anyway.`) }) });
    return;
  }

  // played: the call is coming; a co-coach who will refuse keeps it to themselves until the host asks
  const refuses = (d.refusers || []).includes(other);
  const playSide = side(`${heard} ${verb} talked about voting ${lead} out: ${lead} calls for the card.`);
  if (other) {
    steps.push({ k: 'say', by: lead, text: V(lead, {
      sharp: [`${heard} ${verb} been saying my name. Tonight's the night. Are you signing?`, `They're coming for me tonight. I'm calling it, and I need your signature.`],
      loud: [`${heard} ${verb} got my name! We have to play it! You'll sign, right?`, `It's tonight! I can feel it! You're signing, yes?`],
      soft: [`I think it's me tonight. ${heard} ${verb} said my name. Will you sign?`, `I'm scared. I want to play the card. Please say you'll sign.`],
      dry: [`${heard} ${verb} my name in mind. I'm cashing it in. You're signing.`, `I'd like to still be here tomorrow. Card. Tonight. Sign it.`],
      odd: [`The stars say tonight. So does the gossip. Will you sign?`, `My doom is near. Please sign my card.`],
      any: [`They're coming for me. I'm playing it. Will you sign?`],
    }, 'play-a'), focus: [lead, other], tense: true, side: playSide });
    steps.push({ k: 'say', by: other, text: refuses ? V(other, {
      sharp: [`We'll see.`, `Ask me when it's time.`],
      loud: [`Uh... let's see how it goes!`, `Ask me later!`],
      soft: [`I... I need to think about it.`, `Can we talk about it when it happens?`],
      dry: [`Mm.`, `I'll consider it.`],
      odd: [`The answer is hiding. I'll find it.`, `My pen is thinking.`],
      any: [`We'll see.`],
    }, 'play-no') : V(other, {
      sharp: [`I'll sign. You owe me.`, `Fine. Call it.`],
      loud: [`Of course I'll sign! Call it!`, `Yes! Let's do it!`],
      soft: [`I'll sign. I've got you.`, `Of course. Call it.`],
      dry: [`I'll sign. Try not to waste it.`, `Fine. Pen's ready.`],
      odd: [`I'll sign. I've been practising my signature.`, `Yes. I brought my lucky pen.`],
      any: [`I'll sign.`],
    }, 'play-yes'), focus: [other, lead] });
  } else steps.push({ k: 'conf', by: lead, text: V(lead, {
    sharp: [`${heard} ${verb} said my name this week. That's enough. I'm playing it.`, `I'm not waiting to find out the hard way. The card comes out tonight.`],
    loud: [`They're coming for me! So the card is coming OUT!`, `Nobody's sending me home tonight! I'm playing it!`],
    soft: [`I'm scared it's me. I'm playing the card.`, `I'd rather waste it than be wrong. It comes out tonight.`],
    dry: [`${heard} ${verb} said my name. That's not a rumour, that's a plan. Card's coming out.`, `I like being here. I'd like to keep being here. So, the card.`],
    odd: [`My left ear itches. That means danger. Card time.`, `I can sense it. Like a squirrel senses rain. I'm playing it.`],
    any: [`They're coming for me. I'm playing the card.`],
  }, 'play-c'), side: playSide });
}

/** Before the vote: the card called, and signed or refused. */
export function cardBeforeVote(steps, say, ep, coaches) {
  huddle(steps, ep, coaches);
  const commit = (ep.coachCardCommits || []).find(c => !c.tribe || c.tribe === ep.tribalTribe);
  if (!commit) {
    if (coaches.length && ((ep.coachCardNotPlayed || []).length || (ep.coachData?.[ep.tribalTribe]?.card || 'unused') === 'unused'))
      say(`Coaches: if you want to use the Save Card, now is the time. Once I read the votes, it's too late.`, { focus: coaches });
    if (coaches.length) steps.push({ k: 'beat', text: coaches.length > 1 ? `The coaches look at each other. Nobody moves.` : `${coaches[0]} doesn't move.`, focus: coaches, tense: true });
    return;
  }
  const V = voice(ep, 'card');
  const caller = commit.calledBy || commit.coach;
  say(`Coaches: if you want to use the Save Card, now is the time. Once I read the votes, it's too late.`, { focus: coaches });
  steps.push({ k: 'beat', text: `${caller} stands up.`, focus: [caller], tense: true });
  steps.push({ k: 'say', by: caller, text: V(caller, {
    sharp: [`We're playing it. I'm not going home on a guess.`, `We're using it. Tonight.`, `I can count. We're playing it.`],
    loud: [`We're playing it! I'm not taking ANY chances!`, `Card! We're using the card!`, `I'm not going home tonight! We're playing it!`],
    soft: [`I think... I think we have to play it. I'm sorry.`, `I don't want to, but I think we have to use it.`, `I'm scared. We're playing it.`],
    dry: [`I've heard my name more than I'd like this week. We're playing it.`, `Call it a hunch. We're playing it.`, `I'd rather waste it than need it. We're playing it.`],
    odd: [`I have a feeling. A bad one. We're playing the card.`, `My left ear is itchy. That means danger. We're playing it.`, `The card is coming out. Like a rabbit from a hat.`],
    any: [`We're playing it.`],
  }, 'call'), focus: [caller] });
  if (!(commit.votes || []).length) {
    say(`${caller}, you're the only coach on this team. Nobody else has to sign.`, { focus: [caller] });
  } else {
    say(`The card only works if every coach on the team signs it.`, { focus: coaches });
    for (const v of commit.votes) {
      say(`${v.coach}?`, { focus: [v.coach], tense: true });
      if (v.consents) steps.push({ k: 'say', by: v.coach, text: V(v.coach, {
        sharp: [`Fine. I'll sign. You owe me.`, `I'm signing. Don't make me regret it.`],
        loud: [`Signing! Obviously!`, `Give me that pen!`],
        soft: [`Of course I'll sign.`, `I'm signing. We look after each other.`],
        dry: [`Fine. Pen.`, `Signing. Reluctantly, but signing.`],
        odd: [`I'll sign. I'll even do my fancy signature.`, `Signed. With a little star.`],
        any: [`I'll sign.`],
      }, 'sign'), focus: [v.coach, caller] });
      else {
        steps.push({ k: 'say', by: v.coach, text: V(v.coach, {
          sharp: [`No. I'm not signing.`, `Not a chance.`],
          loud: [`No way! I'm not signing that!`, `NOPE!`],
          soft: [`I'm sorry. I can't sign it.`, `I... I'm not going to sign. I'm sorry.`],
          dry: [`I'm going to pass.`, `No, thank you.`],
          odd: [`My pen is out of ink. Forever.`, `I've decided I don't believe in signatures.`],
          any: [`I'm not signing.`],
        }, 'refuse'), focus: [v.coach, caller], shock: true });
        steps.push({ k: 'beat', text: `The whole row turns to look at ${v.coach}.`, focus: [v.coach, caller], tense: true });
        steps.push({ k: 'conf', by: v.coach, text: V(v.coach, {
          sharp: [`Sign a card to save ${caller}? So ${caller} can beat me at the merge? No.`, `I'm not here to keep ${caller} in the game.`],
          loud: [`I'm not throwing one of MY people under the bus for ${caller}!`, `Why would I save ${caller}? Seriously, why?`],
          soft: [`It means somebody on the team goes home instead. I couldn't do that to them.`, `I feel awful. But I couldn't sign it.`],
          dry: [`${caller} would have done the same to me. I just got there first.`, `I did the maths. ${caller} didn't come out of it well.`],
          odd: [`My gut said no. My gut is usually right. Except about soup.`, `I don't save people who beat me at checkers.`],
          any: [`I wasn't going to save ${caller}.`],
        }, 'why'), side: [{ tab: 'room', text: `${v.coach} won't sign: ${WHY[v.reason] || 'the reason stays private'}.` }] });
      }
    }
  }
  if (commit.signed) say(`The card is played. If the votes land on a coach tonight, that coach stays, and somebody else goes home instead.`, { focus: coaches, tense: true });
  else say(`Then there is no card tonight.`, { focus: coaches, tense: true });
}

/**
 * After the read. `steps` ends with { k: 'out', who: readOut }. Rewrites the ending when the card decides it,
 * and plays a coach's exit. ctx: { ep, host, tribal, coaches, readOut }
 */
export function cardAfterRead(steps, say, ctx) {
  const { ep, coaches, readOut } = ctx;
  const V = voice(ep, 'after');
  const save = (ep.coachSaves || []).find(s => s.coach === readOut);
  const refused = (ep.coachSaveRefusals || []).find(s => s.coach === readOut);
  const unplayed = (ep.coachCardNotPlayed || []).find(s => s.coach === readOut);
  const commit = (ep.coachCardCommits || []).find(c => !c.tribe || c.tribe === ep.tribalTribe);
  const outAt = steps.map(s => s.k).lastIndexOf('out');
  if (save && outAt >= 0) {
    const rep = save.replacement;
    const tail = [];
    tail.push({ k: 'title', kicker: 'The Save Card', name: `${readOut} stays`, faces: [readOut, rep].filter(Boolean), shock: true });
    tail.push({ k: 'say', by: ctx.host, host: true, text: `${readOut}, the votes say you're going home. But this team played the Save Card.`, focus: [readOut], tense: true });
    tail.push({ k: 'say', by: ctx.host, host: true, text: `It isn't free. ${readOut}, somebody on this team goes home in your place, and you pick who.`, focus: [readOut], tense: true });
    tail.push({ k: 'beat', text: `${readOut} looks down the row for a long time.`, focus: [readOut], tense: true });
    tail.push({ k: 'say', by: readOut, text: V(readOut, {
      sharp: [`${rep}. It's nothing personal. Actually, it's a little personal.`, `${rep}. You were never going to be on my side anyway.`],
      loud: [`I hate this! I HATE this! ...${rep}. I'm sorry!`, `${rep}! I'm sorry! I had to pick somebody!`],
      soft: [`I'm so sorry. ${rep}.`, `This is the worst thing I've ever had to do. ${rep}. I'm sorry.`],
      dry: [`${rep}. I'd say it was a hard choice. It wasn't.`, `${rep}. Don't take it personally. Or do. It's late.`],
      odd: [`I'm going to close my eyes and point. ...${rep}. Sorry.`, `${rep}. The universe told me. Blame the universe.`],
      any: [`${rep}.`],
    }, 'pick'), focus: [readOut, rep], shock: true });
    // what the replacement can say depends on whether anybody wrote their name
    const theirs = (ep.votingLog || []).filter(v => v.voted === rep).length;
    tail.push({ k: 'say', by: rep, text: V(rep, theirs ? {
      sharp: [`${theirs === 1 ? 'One vote' : `${theirs} votes`}, and I'm the one leaving. Fine.`, `You're serious. ${readOut} gets the votes, and I get the boat.`],
      loud: [`WHAT?! ${readOut} got MORE votes than me!`, `Are you KIDDING me?!`],
      soft: [`Oh. Okay. I... I didn't see that coming.`, `I wasn't the one with the most votes. That's how I go?`],
      dry: [`So that's how it ends. Not with the vote. With a coach.`, `Great. I'm going home on somebody else's votes.`],
      odd: [`I've been chosen! For the bad thing, but still.`, `I came second in the vote and first in going home. That's talent.`],
      any: [`${readOut} had more votes than me.`],
    } : {
      sharp: [`You're serious. Nobody even voted for me.`, `Wow. Nobody wrote my name, and I'm the one leaving.`],
      loud: [`WHAT?! Nobody even voted for me!`, `Are you KIDDING me?!`],
      soft: [`Oh. Okay. I... I didn't see that coming.`, `I didn't even get a vote. That's how I go?`],
      dry: [`So that's how it ends. Not with a vote. With a coach.`, `Great. I'm going home on somebody else's votes.`],
      odd: [`I've been chosen! For the bad thing, but still.`, `I didn't get a single vote and I still lost. That's talent.`],
      any: [`Nobody even voted for me.`],
    }, 'rep'), focus: [rep, readOut], shock: true });
    tail.push({ k: 'out', who: rep, focus: [rep] });
    steps.splice(outAt, 1, ...tail);
    return { out: rep, coachOut: false };
  }
  if (refused && outAt >= 0) {
    steps.splice(outAt, 0,
      { k: 'title', kicker: 'Not signed', name: `${readOut} goes home`, faces: [readOut, refused.refusedBy].filter(Boolean), shock: true },
      { k: 'say', by: ctx.host, host: true, text: `${readOut}, the card was played, and it needed every signature. ${refused.refusedBy} didn't sign. The card can't save you.`, focus: [readOut, refused.refusedBy], tense: true },
      { k: 'say', by: readOut, text: V(readOut, {
        sharp: [`${refused.refusedBy}. You'll regret that.`, `Remember this, ${refused.refusedBy}. Everybody else will.`],
        loud: [`You did this, ${refused.refusedBy}! YOU did this!`, `ONE signature! That's all I needed!`],
        soft: [`I would have signed for you, ${refused.refusedBy}. I really would have.`, `I thought we were on the same side.`],
        dry: [`Well played, ${refused.refusedBy}. Truly.`, `I'd clap, but I'm busy leaving.`],
        odd: [`I'm going to haunt your pen, ${refused.refusedBy}.`, `Betrayed by paperwork. What a way to go.`],
        any: [`You didn't sign, ${refused.refusedBy}.`],
      }, 'refusedOut'), focus: [readOut, refused.refusedBy], shock: true });
  } else if (unplayed && outAt >= 0 && unplayed.held !== false) {
    steps.splice(outAt, 0,
      { k: 'say', by: ctx.host, host: true, text: `And the Save Card stays in your pocket. ${readOut}, you're going home holding it.`, focus: [readOut], tense: true },
      { k: 'say', by: readOut, text: V(readOut, {
        sharp: [`I should have played it. I knew it, and I didn't.`, `I read the room wrong. That's never happened before.`],
        loud: [`I didn't see it coming! How did I not see it coming?!`, `I had the card! I HAD it!`],
        soft: [`I really didn't think it would be me.`, `I trusted you guys. I guess that was the mistake.`],
        dry: [`Holding it the whole time. That's going on my tombstone.`, `Well, that's embarrassing.`],
        odd: [`I'll frame it. It'll be a nice souvenir.`, `The card and I will go home together. It's the only one who stayed loyal.`],
        any: [`I should have played it.`],
      }, 'unplayed'), focus: [readOut], shock: true });
  } else if (commit?.signed && !save && readOut == null) {
    // the card spent on a night the votes went elsewhere
    const at = steps.map(s => s.k).lastIndexOf('out');
    const caller = commit.calledBy || commit.coach;
    steps.splice(at >= 0 ? at + 1 : steps.length, 0,
      { k: 'say', by: ctx.host, host: true, text: `And the Save Card? Spent, on a night nobody came for a coach.`, focus: coaches },
      { k: 'conf', by: caller, text: V(caller, {
        sharp: [`I wasted it. I'd rather waste it than need it, but I still wasted it.`],
        loud: [`I panicked! I PANICKED! And now it's gone!`],
        soft: [`I feel so stupid. Nobody was even coming for me.`],
        dry: [`Turns out the danger was mostly in my head. Expensive head.`],
        odd: [`The card is gone. I'll miss it. It was a good card.`],
        any: [`I wasted the card.`],
      }, 'wasted') });
  }
  // a coach voted out: the goodbye, and the people they trained
  const ce = (ep.coachElimination || []).find(x => x.coach === readOut);
  if (ce) {
    const at = steps.map(s => s.k).lastIndexOf('out');
    const c = readOut;
    const tail = [{ k: 'title', kicker: 'A coach goes home', name: c, faces: [c], shock: true },
      { k: 'say', by: ctx.host, host: true, text: `${c}, you came here to coach. Tonight, your team decided they're better off without you.`, focus: [c] },
      { k: 'say', by: c, text: V(c, {
        sharp: [`Fine. Good luck winning anything without me.`, `You'll miss me at the next challenge. Count on it.`],
        loud: [`You guys are gonna miss me SO much!`, `I loved this! Even tonight! Mostly!`],
        soft: [`I just want you all to know I'm proud of you. Even now.`, `I hope I helped. I really tried.`],
        dry: [`Well. I've been fired from worse.`, `I taught you to vote out the threat. I didn't think you'd use it on me.`],
        odd: [`Remember me when you lift a log.`, `I'll be watching from home. Wearing my whistle.`],
        any: [`Good luck, everybody.`],
      }, 'bye'), focus: [c] }];
    const rx = ce.reactions || [];
    // the one closest to them, and the one coldest (the engine marks only the extremes: bond 5 up, -3 down)
    const grief = rx.filter(r => r.bond >= 2).sort((a, b) => b.bond - a.bond)[0];
    const relief = rx.filter(r => r.bond <= -1 && r.contestant !== grief?.contestant).sort((a, b) => a.bond - b.bond)[0];
    if (grief) tail.push({ k: 'say', by: grief.contestant, text: V(grief.contestant, {
      sharp: [`This is a mistake, and everybody here is going to feel it.`], loud: [`No! Not ${c}! This is SO wrong!`],
      soft: [`I don't know what I'm going to do without you.`], dry: [`Great. Who's going to yell at me at sunrise now?`],
      odd: [`Who's going to coach me now? Me? That's terrifying.`], any: [`I'm going to miss you.`],
    }, 'grief'), focus: [grief.contestant, c] });
    if (relief) tail.push({ k: 'conf', by: relief.contestant, text: V(relief.contestant, {
      sharp: [`${c} never picked me. Now ${c} never will. Works for me.`], loud: [`Bye, ${c}! I won't miss the yelling!`],
      soft: [`I know I should feel bad. I don't, really.`], dry: [`One less person telling me I'm doing it wrong.`],
      odd: [`The coach is gone. Long live me.`], any: [`I won't miss ${c}.`],
    }, 'relief') });
    const lost = Object.keys(ce.lost || {}).filter(Boolean);
    if (lost.length) tail[tail.length - 1].side = [{ tab: 'room', text: `Everything ${c} taught goes with ${P(c).obj}: ${listOf(lost)} lose${lost.length > 1 ? '' : 's'} the training.` }];
    steps.splice(at >= 0 ? at : steps.length, 0, ...tail);
    return { out: c, coachOut: true };
  }
  return { out: readOut, coachOut: false };
}
