// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/emissary.js — the emissary's day in the losing camp, as conversations
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10: "we need a better emissary with longer conversation, it's too expeditory". The
// engine (camp-events.js) decides the day: who pitches whom and how well it lands (pitchStrength), how
// well the emissary reads the camp and who they find on the outside, and the cross-team deal (genuine
// or not). This writes each of those as a scene: the camp going quiet when the emissary walks in, the
// pitch taken somewhere private with a real reason and a real question back, the target noticing, the
// emissary sitting down with the one nobody sits with, the deal by the water. Every line in the
// speaker's own voice (sharp, dry, loud, soft, odd). Words only: nothing here decides anything.
import { pronouns } from '../players.js';
import { famOf } from './voiced.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
// the speaker's family, an archetype's when their voice has none (voiced.js, shared by the twist scenes)
const fam = n => famOf(n);

/** The scouting day's steps after the emissary's arrival card. ctx: { ep, em, hosts, bond(a,b) } */
export function emissaryDay(ctx) {
  const { ep, em, hosts, bond } = ctx;
  const out = [];
  const used = new Set();
  // a line in the speaker's own way, never one already said on this screen
  const V = (n, o, tag) => {
    // their own family's lines; the general ones only when the family has none
    const opts = (o[fam(n)] && o[fam(n)].length) ? o[fam(n)] : (o.any || Object.values(o)[0] || []);
    const fresh = opts.filter(t => !used.has(t));
    const list = fresh.length ? fresh : opts;
    const t = list[hash(`${ep.num}|${tag}|${n}`) % list.length];
    used.add(t); return t;
  };
  const say = (by, text, focus = [by], extra = {}) => out.push({ k: 'say', by, text, focus, ...extra });
  const beat = (text, focus = [], extra = {}) => out.push({ k: 'beat', text, focus, ...extra });
  const conf = (by, text) => out.push({ k: 'conf', by, text });
  const P = n => { const p = pronouns(n); return { ...p, is: p.sub === 'they' ? 'are' : 'is', has: p.sub === 'they' ? 'have' : 'has', s: p.sub === 'they' ? '' : 's' }; };
  const evs = ep.emissaryScoutEvents || [];
  const team = ep.emissary?.targetTribe || 'the other team';

  // ── the camp goes quiet ──
  const around = hosts.filter(n => n !== em);
  const cold = [...around].sort((x, y) => bond(em, x) - bond(em, y))[0];
  const warm = [...around].filter(n => n !== cold).sort((x, y) => bond(em, y) - bond(em, x))[0];
  beat(`Every conversation at ${team}'s camp stops the second ${em} walks in.`, [em, ...around.slice(0, 3)], { tense: true });
  if (cold) {
    say(cold, V(cold, {
      sharp: [`Look who it is. Come to pick out our next victim?`, `Oh, good. The judge has arrived. Should we line up?`],
      loud: [`Oh, great. Are we supposed to make you breakfast too?`, `Wow. They really sent you here to watch us. That's insane.`],
      dry: [`Welcome. Please don't touch anything.`, `So you're the one who decides who goes home. Cool. Love that for us.`],
      soft: [`Hi... I guess we're all supposed to be really nice to you now, huh?`, `Hey. Sorry, this is just really weird for everybody.`],
      odd: [`Do we bow? I feel like we should bow.`, `Should somebody get you a crown? You look like you need a crown.`],
      any: [`So you're the one deciding who goes home. Great.`],
    }, 'cold'), [cold, em]);
    say(em, V(em, {
      sharp: [`Relax. I'm just here to watch. Unless somebody gives me a reason not to.`, `I didn't ask for this. But I'm not going to pretend I don't have a vote.`],
      loud: [`Hey, I didn't pick this! But yeah, I've got a vote, and I'm using it.`, `Trust me, I'm as freaked out as you are!`],
      soft: [`I know. I'm sorry. I'm going to try really hard to be fair.`, `I don't want to be the bad guy here. I really don't.`],
      dry: [`I'll keep my opinions to myself. For now.`, `Don't worry. I'm mostly going to sit here and watch.`],
      odd: [`I promise I'm mostly harmless. Mostly.`, `I come in peace! Mostly. Partly. We'll see.`],
      any: [`I'm just here to listen. For now.`],
    }, 'em-cold'), [em, cold]);
  }
  if (warm) {
    say(warm, V(warm, {
      soft: [`Ignore them. Come sit with us, it's okay.`, `Hey, it's not your fault. Come sit down.`],
      loud: [`Finally, a new face! Come on, sit, sit!`, `Okay, everybody calm down. Hey! Welcome!`],
      sharp: [`Everybody relax. We're all friends here. Right?`, `Don't mind them. Some of us actually have manners.`],
      dry: [`Water's over there. Try not to judge the shelter.`, `Take a seat. We were just pretending to like each other.`],
      odd: [`Welcome! I'd give you the tour, but this is the tour.`, `Hi! You can sit on my log. It's a good log.`],
      any: [`Come sit down. It's fine.`],
    }, 'warm'), [warm, em]);
    beat(`${em} sits down next to ${warm}. Everyone goes back to what they were doing. Nobody's really doing it.`, [em, warm]);
  }

  // ── each pitch, somewhere private ──
  evs.filter(e => e.type === 'emissaryPitch' && e.pitcher && e.pitchTarget).forEach((e, i) => {
    const p = e.pitcher, t = e.pitchTarget, strong = (e.pitchStrength || 0) >= 0.5, tp = P(t);
    const grudge = bond(p, t) <= -3;
    const arch = String(e.text || '');
    const reason = /playing everyone/.test(arch) ? 'liar' : /biggest threat/.test(arch) ? 'threat' : /would miss/.test(arch) ? 'nobody' : 'weak';
    beat(`${p} waits until ${t} is out of earshot, then walks over to ${em}.`, [p, em], { badge: { text: 'PITCH', cls: 'gold' }, side: [{ tab: 'log', text: `PITCH: ${p} wants ${t} gone` }] });
    say(p, V(p, {
      sharp: [`Got a minute? I think we can help each other.`, `Walk with me. I'll make this worth your time.`],
      loud: [`Hey. Can we talk? Like, actually talk?`, `Okay, I'm just going to be straight with you.`],
      soft: [`Hi. Sorry, can I steal you for a second?`, `Can I talk to you? It's kind of important.`],
      dry: [`So. You're the one with the power now. Congratulations.`, `I figured I'd save you some time.`],
      odd: [`Psst. Over here. Act casual.`, `Okay, don't look now, but we need to talk.`],
      any: [`Got a second?`],
    }, `p-open${i}`), [p, em]);
    say(em, V(em, {
      sharp: [`Let me guess. You have a name for me.`, `Everybody's been waiting to do this. You're just the first.`],
      loud: [`Sure! What's up?`, `Okay, hit me. What've you got?`],
      soft: [`Of course. What's going on?`, `Yeah, sure. Is everything okay?`],
      dry: [`I figured somebody would come over. You're first.`, `Go ahead. I've been expecting this.`],
      odd: [`I'm acting casual. This is me being casual.`, `Ooh, a secret meeting. I love a secret meeting.`],
      any: [`Sure. What is it?`],
    }, `em-open${i}`), [em, p]);
    const pitch = {
      liar: [`It's ${t}. ${tp.Sub} smile${tp.s} at everybody and lie${tp.s} to every single one of them. If you don't get rid of ${tp.obj} tonight, you'll be dealing with ${tp.obj} at the merge.`],
      threat: [`It's ${t}. ${tp.Sub} ${tp.is} the biggest threat on this team, and everybody here knows it. If ${t} makes the merge, ${tp.sub}'ll run the whole thing.`],
      nobody: [`Honestly? ${t}. Nobody here would miss ${tp.obj}. You'd be doing all of us a favor.`],
      weak: [`${t}. ${tp.Sub} ${tp.has} been dragging us down in every single challenge. It's not personal. We just keep losing.`],
    }[reason];
    say(p, pitch[0], [p, em]);
    beat(`${em} glances over at ${t}, who is busy with something on the other side of camp.`, [em, t]);
    say(em, V(em, {
      sharp: [`And what do you get out of it?`, `Funny. That's exactly what somebody who wants ${t} gone would say.`],
      loud: [`Okay, but why should I believe you?`, `Whoa. That's a lot. Why ${t}?`],
      soft: [`That's a really big thing to ask. What did ${t} do to you?`, `Are you sure? That's somebody's whole game.`],
      dry: [`Uh huh. And why ${t}, exactly?`, `Okay. And ${t} would say the same thing about you, so why should I listen to you?`],
      odd: [`Interesting. Very interesting. Why, though?`, `Hmm. Tell me more. Slowly.`],
      any: [`Why ${t}?`],
    }, `em-probe${i}`), [em, p]);
    say(p, grudge
      ? V(p, { sharp: [`Because ${t} has had it out for me since day one, and if I don't get ${tp.obj} first, ${tp.sub}'ll get me.`], loud: [`Because ${t} hates me! Ask anybody! If ${t} stays, I'm next!`], soft: [`Because ${t} has made every day out here really hard for me. I'm tired.`], dry: [`Because ${t} and I can't be in the same camp. Somebody has to go. I'd prefer it wasn't me.`], odd: [`Because ${t} and I are like oil and water. And I'm the water. And I'm drowning.`], any: [`Because it's ${tp.obj} or me.`] }, `p-why${i}`)
      : V(p, { sharp: [`Because I want to make the merge, and with ${t} around, I don't think I do.`], loud: [`Because I want to win this, and ${t} is in the way!`], soft: [`Because I want to stay. And I think ${t} is the one who'd send me home.`], dry: [`Because it's the smart move. For both of us.`], odd: [`Because I have a feeling. A strong one. In my stomach.`], any: [`Because it helps us both.`] }, `p-why${i}`), [p, em]);
    if (strong) {
      say(em, V(em, {
        sharp: [`Okay. That's actually useful. I'm not promising anything.`, `Fine. I'll keep it in mind. Don't make me regret it.`],
        loud: [`Okay. Okay, I hear you. I'm not saying yes, but I hear you.`, `Alright, that makes sense, honestly.`],
        soft: [`Okay. Thank you for being honest with me.`, `I'll think about it. I really will.`],
        dry: [`Noted. Genuinely.`, `That's a better reason than I expected.`],
        odd: [`I'm writing that down. In my head. In big letters.`, `Okay. You've planted a seed. A suspicious seed.`],
        any: [`I'll think about it.`],
      }, `em-yes${i}`), [em, p]);
      say(p, V(p, { any: [`That's all I'm asking.`, `That's all I wanted to hear.`], sharp: [`That's all I need.`], loud: [`Great! That's all I'm asking!`] }, `p-thanks${i}`), [p]);
      conf(em, V(em, {
        sharp: [`${p} came to me first, and ${p} had a real reason. That puts ${t} in a lot of trouble.`],
        loud: [`${p} made a really good case. I hate that it was a good case, but it was.`],
        soft: [`${p} seemed honestly scared of ${t}. I don't want to send anyone home, but that stuck with me.`],
        dry: [`${p} wants ${t} gone, and for once the reason holds up.`],
        odd: [`${p} made a very convincing speech. I almost clapped.`],
        any: [`${p} made a real case against ${t}. I'm listening.`],
      }, `em-conf${i}`));
    } else {
      say(em, V(em, {
        sharp: [`You want me to do your dirty work. I noticed.`, `You know I'm going to ask ${t} about you, right?`],
        loud: [`Okay, that sounds really personal, not gonna lie.`, `Wow. You really don't like ${t}, huh?`],
        soft: [`I don't know. That kind of sounds like it's about you two, not about me.`, `I hear you. I'm just not sure I believe you.`],
        dry: [`So the answer is: you'd like ${t} gone. Got it.`, `You know I'm going to talk to ${t} too, right?`],
        odd: [`I'm going to pretend I didn't see you sweating just now.`, `That was a lot of words for "I don't like ${t}."`],
        any: [`I'll think about it. Maybe.`],
      }, `em-no${i}`), [em, p]);
      say(p, V(p, { any: [`...Right. Of course. Just think about it.`, `Okay. Just... think about it.`], sharp: [`Suit yourself. You'll see I'm right.`], loud: [`Fine! But I'm telling you, I'm right!`] }, `p-left${i}`), [p]);
      conf(em, V(em, {
        sharp: [`${p} wants ${t} gone so badly, ${p} forgot to make it sound like it wasn't personal.`],
        loud: [`${p} basically begged me to get rid of ${t}. That makes me want to look at ${p} instead.`],
        soft: [`${p} was really nervous the whole time. I don't think it was about ${t}. I think it was about ${p}.`],
        dry: [`If somebody tries that hard to send me after one person, I start wondering why.`],
        odd: [`${p} pitched me ${t} like a used car. I'm not buying the car.`],
        any: [`${p}'s pitch felt personal. I'm not sure I trust it.`],
      }, `em-conf${i}`));
    }
    // the target noticing
    if (hash(`${ep.num}|notice|${t}`) % 3 !== 0) {
      beat(`Across camp, ${t} watches ${p} walk away from ${em}.`, [t, p], { tense: true });
      conf(t, V(t, {
        sharp: [`${p} just spent ten minutes alone with the emissary. That's never good news for me.`],
        loud: [`I saw that! I saw ${p} with ${em}! I'm not stupid!`],
        soft: [`I saw ${p} talking to ${em}, and my stomach just dropped. I think it's about me.`],
        dry: [`${p} and ${em} had a nice little chat. I'd love to know what about. I think I already do.`],
        odd: [`${p} and ${em} were whispering. Nobody whispers about nice things.`],
        any: [`I saw ${p} talking to ${em}. I've got a bad feeling.`],
      }, `t-conf${i}`));
    }
  });

  // ── the read: the one nobody sits with ──
  const obs = evs.find(e => e.type === 'emissaryObservation');
  if (obs) {
    const iso = obs.isolatedPlayer;
    if ((obs.observationQuality || 0) > 0.5 && iso && iso !== em) {
      const ip = P(iso);
      beat(`${em} sits back and watches for a while. Every time ${iso} walks over, the talking stops.`, [em, iso], { badge: { text: 'OBSERVATION', cls: 'iron' }, side: [{ tab: 'log', text: `OBSERVATION: ${iso} is on the outside` }] });
      say(em, V(em, { any: [`Mind if I sit here?`, `Is this seat taken?`], loud: [`Hey! Can I sit with you?`], dry: [`I'm sitting here. Hope that's okay.`] }, 'sit'), [em, iso]);
      say(iso, V(iso, {
        sharp: [`Go ahead. Nobody else is going to.`], loud: [`Sure, why not! Apparently I'm not very popular today.`],
        soft: [`Oh! Yeah, of course. Nobody really sits here.`], dry: [`It's a free log.`], odd: [`Yes! Finally, a visitor!`], any: [`Sure.`],
      }, 'iso1'), [iso, em]);
      say(em, `Can I ask you something? Why does everybody go quiet when you walk up?`, [em, iso]);
      say(iso, V(iso, {
        sharp: [`Because they're talking about me. I'm not stupid.`], loud: [`I don't know! Ask them!`],
        soft: [`...You noticed that too? I don't know what I did.`], dry: [`I have a theory. It's not a nice theory.`],
        odd: [`I think I'm intimidating. In a fun way. Probably.`], any: [`I don't know.`],
      }, 'iso2'), [iso, em]);
      say(em, V(em, { soft: [`For what it's worth, I noticed. And I'm sorry.`], sharp: [`For what it's worth, I noticed. That's either good news or bad news for you.`], any: [`Well, for what it's worth, I noticed.`] }, 'iso3'), [em, iso]);
      say(iso, `Is that a good thing or a bad thing?`, [iso, em]);
      say(em, V(em, { any: [`I haven't decided yet.`], soft: [`Honestly? I don't know yet.`], odd: [`Yes.`] }, 'iso4'), [em, iso]);
      conf(em, V(em, {
        sharp: [`${iso} is on the outside here, and everyone knows it. That makes ${ip.obj} the easy pick. Easy isn't always smart, though.`],
        loud: [`Nobody talks to ${iso}! Like, at all! That's either really sad or really useful.`],
        soft: [`${iso} is so alone over there. If I pick ${ip.obj}, I'm just doing what this team already wants. I don't know if that's fair.`],
        dry: [`${iso} is the obvious choice. The obvious choice makes me nervous.`],
        odd: [`${iso} sits alone, eats alone, and probably dreams alone. I relate to that a little.`],
        any: [`${iso} is on the outside. That matters.`],
      }, 'iso-conf'));
    } else {
      beat(`${em} tries to read the camp, but everybody is on their best behavior.`, [em], { badge: { text: 'OBSERVATION', cls: 'iron' } });
      conf(em, V(em, {
        sharp: [`Everybody here is suddenly very polite. Somebody's hiding something, and they're good at it.`],
        loud: [`Everybody's being so nice to me, it's creepy! I can't tell who's on the bottom!`],
        soft: [`Everyone seems to get along, which is nice, but it makes this so much harder.`],
        dry: [`I've watched them all afternoon and learned nothing. Which probably means something.`],
        odd: [`They're all smiling at me. Like a pack of wolves. Friendly wolves. Still wolves.`],
        any: [`I can't read this camp at all.`],
      }, 'obs-low'));
    }
  }

  // ── the deal by the water ──
  const deal = evs.find(e => e.type === 'emissaryDeal');
  if (deal) {
    const ally = (deal.players || []).find(n => n !== em);
    const genuine = /genuine/.test(deal.consequences || '');
    if (ally) {
      beat(`Later, ${em} and ${ally} end up alone by the water.`, [em, ally], { badge: { text: 'CROSS-TEAM DEAL', cls: 'green' }, side: [{ tab: 'log', text: `DEAL: ${em} and ${ally}` }] });
      say(ally, V(ally, {
        soft: [`So... are we okay? Like, you and me?`], loud: [`Please tell me you're not here to get rid of me.`],
        sharp: [`I hope you haven't forgotten who your friends are.`], dry: [`So. Should I be packing?`], odd: [`Am I in trouble? I feel like I'm in trouble.`], any: [`Are we okay?`],
      }, 'deal1'), [ally, em]);
      say(em, V(em, { any: [`Of course we are. That's actually what I wanted to talk to you about.`], loud: [`No way! You're the one person here I'm not worried about!`], dry: [`You're fine. Sit down. I want to ask you something.`] }, 'deal2'), [em, ally]);
      say(em, `When we merge, I want you with me. Whatever happens tonight.`, [em, ally]);
      say(ally, V(ally, {
        sharp: [`You're not just saying that because you're holding my fate in your hands?`], loud: [`Wait, really? Like, for real?`],
        soft: [`You mean that?`], dry: [`That's a convenient thing to say to somebody you could vote out tonight.`], odd: [`Is this a friendship bracelet moment? It feels like a friendship bracelet moment.`], any: [`You mean that?`],
      }, 'deal3'), [ally, em]);
      say(em, genuine ? V(em, { any: [`If I wanted to get rid of you, I wouldn't be telling you this.`], soft: [`I mean it. You're the only person here I really trust.`] }, 'deal4g')
        : V(em, { any: [`Would I lie to you?`], sharp: [`Have I ever lied to you? Don't answer that.`], loud: [`Of course I mean it! Come on!`] }, 'deal4s'), [em, ally]);
      say(ally, `...Okay. Deal.`, [ally, em]);
      beat(`They shake on it, quickly, before anybody can see.`, [em, ally]);
      conf(em, genuine
        ? V(em, { any: [`${ally} is the only person in this camp I'd trust. That deal's real.`], loud: [`I've got ${ally}! For real! That's huge!`], soft: [`I meant every word I said to ${ally}. I need at least one friend out here.`] }, 'deal-g')
        : V(em, { any: [`I need somebody on the inside of this team. ${ally} is perfect. Whether I keep the deal is a problem for later.`], sharp: [`${ally} believes me. That's the important part. The rest is details.`] }, 'deal-s'));
    }
  }

  // ── before the vote ──
  const pitches = evs.filter(e => e.type === 'emissaryPitch').length;
  conf(em, pitches ? V(em, {
    sharp: [`${pitches === 1 ? 'One person tried' : `${pitches === 2 ? 'Two' : 'Three'} people tried`} to sell me somebody today. I'll pick the one that helps me most later. They don't need to know that.`],
    loud: [`Everybody in that camp wanted something from me today! I've got a lot to think about!`],
    soft: [`Everyone was so nice to me today, and that's what makes this hard. Somebody's going home because of me.`],
    dry: [`I heard the pitches. Now I watch the vote, and I see who was lying.`],
    odd: [`Today I learned that power is fun and also makes everybody stare at you while you eat.`],
    any: [`I've heard everyone out. Now I watch the vote, and then it's my turn.`],
  }, 'close') : V(em, { any: [`Nobody pitched me anything. Either they trust me, or they're scared of me. I can work with both.`] }, 'close0'));
  return out;
}
