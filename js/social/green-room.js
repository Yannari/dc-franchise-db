// The green room as a conversation: what happened, said by a person, and the people next to them
// answering back.
//
// The user, 2026-10-24: "chatalumni is still so vague it's like they're not even human talking...
// why are they all talking like yoda and not in their voice/archetype". Read on the published Big
// Brother season, a night of hosts said things like "The interesting part is who was standing close
// enough to notice and said nothing" over ten different twists, while the members underneath quoted
// what had actually happened ("Ireland's secret HOH safety deal"): the events carry the moment, and
// the hosts never used it. Nobody answered anybody either; each host posted a maxim and left.
//
// So the first host on a moment SAYS the moment (the event's own `moment`, or who did what), in the
// way that host talks, and the hosts after them answer that host by name: agreeing or pushing back,
// in their own voices. The twelve deliveries are voices.js's (DELIVERY).
//
// A line knows what it assumes about the player it names, because the player of an event is not
// always the one it happened to: `hit` lines are for somebody on the receiving end (nominated,
// evicted, blindsided, betrayed), `win` lines for somebody who did well (a competition, the veto),
// and `any` lines assume neither (a twist's player can be the one who pulled it).
//
// Pure: an event and a host in, a sentence out. The caller's rng picks, so a night reads the same on
// every reload.
import { DELIVERY, VOICE_OVERRIDE } from './voices.js';

const cap = s => String(s || '').replace(/^./, c => c.toUpperCase());
const title = slug => String(slug || '').split(/[-_ ]/).filter(Boolean).map(cap).join(' ');

// A moment is written as a fragment about its subject: "Won veto and removed himself from Ireland's
// block." The passive ones need their verb: "Nominated by Ireland's secret HOH..." is "was nominated".
const PASSIVE = /^(nominated|renominated|evicted|saved|blindsided|backdoored|targeted|exposed|caught|crowned|chosen|picked|named|banished|eliminated|cut|dumped|sent home)\b/i;

/** One sentence of what happened, with the names in it, or null when the event says nothing. */
export function factOf(ev, w = {}) {
  if (!ev) return null;
  const s = ev.subject ? title(ev.subject) : '';
  const a = ev.actor ? title(ev.actor) : '';
  const moment = String(ev.moment || '').trim();
  if (moment && s) {
    const whole = moment.replace(/\.*$/, '.');
    // a moment that is already a sentence ("The twin reveal brought Jane into the house...", or one that
    // opens on the name) is said as it is
    if (/^(the|a|an|his|her|their|its|this|that|after|when|in|on|with)\b/i.test(moment) || moment.toLowerCase().startsWith(s.toLowerCase())) return cap(whole);
    const body = whole.replace(/^./, c => c.toLowerCase());
    return `${s} ${PASSIVE.test(moment) ? 'was ' : ''}${body}`;
  }
  if (!s) return null;
  switch (ev.kind) {
    case 'nomination': return a ? `${a} put ${s} ${w.onDanger || 'up'}.` : null;
    case 'eviction': return `${s} is gone.`;
    case 'blindside': return a ? `${a} blindsided ${s}.` : `${s} never saw it coming.`;
    case 'comp-win': return `${s} won the ${w.challenge || 'challenge'}.`;
    case 'veto-used': return `${s} used the veto.`;
    case 'betrayal': return a ? `${a} turned on ${s}.` : null;
    default: return null;
  }
}

/** What an event's player is to it: on the receiving end, the one who did well, or either. */
export function roleOf(ev) {
  if (/^(nomination|eviction|blindside|betrayal|backdoor)$/.test(ev?.kind || '')) return 'hit';
  if (/^(comp-win|veto-used|finale)$/.test(ev?.kind || '')) return 'win';
  return 'any';
}

// ── how somebody talks ──
// The delivery a description NAMES FIRST is how the person talks ("Nervous, over-analytical": nervous;
// "Brash, loud cop": blunt). voices.js ranks by rarity instead, which made Cameron formal and MacArthur
// excitable (from "hyper-competitive"); that ranking stays for its own takes, and this one is for the
// green room. Compound words are not the word ("sweet-poison" is not sweet).
const NOT_THE_WORD = [[/hyper-competitive/g, 'competitive'], [/sweet-(poison|talk\w*)/g, '$1'], [/over-analytical/g, 'analytical']];
// a host whose description says nothing about delivery, by the hashtags the user writes on a voice
const TAG_VOICE = { blunt: 'blunt', tough: 'streetwise', competitive: 'blunt', bossy: 'blunt', cruel: 'manipulative', schemer: 'manipulative',
  flirty: 'manipulative', dry: 'deadpan', quiet: 'deadpan', theatrical: 'theatrical', chaotic: 'theatrical', emotional: 'theatrical',
  anxious: 'nervous', warm: 'warm', earnest: 'warm', goofy: 'excitable', ditzy: 'excitable', food: 'excitable' };
const LENS_VOICE = { villain: 'manipulative', 'challenge-beast': 'blunt', goat: 'nervous', underdog: 'nervous', strategist: 'formal', social: 'warm' };

export function deliveryOf(host, lens) {
  if (VOICE_OVERRIDE[host?.name] && REACT[VOICE_OVERRIDE[host.name]]) return VOICE_OVERRIDE[host.name];
  const raw = String(host?.voice || '').toLowerCase();
  let text = raw.replace(/#-?[a-z]+/g, ' ');
  for (const [re, to] of NOT_THE_WORD) text = text.replace(re, to);
  let best = null;
  for (const [trait, [re]] of Object.entries(DELIVERY)) {
    if (!REACT[trait]) continue;
    const m = new RegExp(re.source).exec(text);
    if (m && (!best || m.index < best.at)) best = { trait, at: m.index };
  }
  if (best) return best.trait;
  for (const m of raw.matchAll(/#(-?)([a-z]+)/g)) if (!m[1] && TAG_VOICE[m[2]]) return TAG_VOICE[m[2]];
  return LENS_VOICE[lens] || 'warm';
}

// ── the first host on a moment: the fact, then the person ──
// `f` is the fact (a whole sentence), `s` the player it is about.
export const REACT = {
  blunt: {
    any: [({ f }) => `${f} The whole house watched that happen and nobody said a word. Unreal.`, ({ f }) => `${f} Honestly, that's the most anyone's done all week.`,
      ({ f }) => `${f} Good. Somebody in there finally played.`, ({ f }) => `${f} That's the move. I'd have done it a week earlier.`],
    hit: [({ f, s }) => `${f} And ${s} is supposed to just sit there and take it? No.`, ({ f, s }) => `Can we talk about this? ${f} ${s} has to fight back now or it's over.`,
      ({ f, s }) => `${f} ${s} saw it coming and did nothing. That's on ${s}.`],
    win: [({ f, s }) => `${f} Good. ${s} needed that.`, ({ f, s }) => `${f} Now don't waste it, ${s}.`, ({ f }) => `${f} About time somebody showed up and competed.`],
  },
  deadpan: {
    any: [({ f }) => `${f} Okay.`, ({ f }) => `${f} Noted.`, ({ f, s }) => `${f} ${s} is going to be weird about this for a while.`, ({ f }) => `So. ${f} That's where we are.`],
    hit: [({ f, s }) => `${f} ${s} looked surprised. ${s} shouldn't have.`, ({ f }) => `${f} I've seen worse. Not recently.`, ({ f }) => `${f} Anyway.`],
    win: [({ f }) => `${f} Good for them. Genuinely.`, ({ f, s }) => `${f} ${s} smiled for nearly a whole second.`, ({ f }) => `${f} That's a week bought. Weeks run out.`],
  },
  theatrical: {
    any: [({ f }) => `${f} I had to pause it. I had to stand up and walk around my kitchen.`, ({ f }) => `Excuse me. EXCUSE me. ${f} Somebody give that house an award.`,
      ({ f }) => `${f} This is the episode. This is the one people are going to talk about.`, ({ f }) => `${f} I gasped. Out loud. My neighbour knocked on the wall.`],
    hit: [({ f, s }) => `${f} If I were ${s} I'd be crying in the shower right now, and honestly, valid.`, ({ f, s }) => `${f} ${s}'s face! I'll be thinking about ${s}'s face for a week.`,
      ({ f, s }) => `${f} Poor ${s}. That was a tragedy in three acts and nobody even bowed.`],
    win: [({ f, s }) => `${f} ${s} came out of that like the lead in the final number.`, ({ f, s }) => `${f} The comeback arc! ${s}, I'm so proud of you.`, ({ f }) => `${f} Standing ovation. From my couch, but still.`],
  },
  nervous: {
    any: [({ f }) => `${f} Is nobody else stressed about this? Just me?`, ({ f }) => `${f} I can't watch this part. I'm watching it, but I can't.`,
      ({ f }) => `${f} This is exactly the kind of thing I used to lose sleep over.`, ({ f }) => `Oh no. ${f} Okay. Okay.`],
    hit: [({ f }) => `Oh no. ${f} I'd be throwing up.`, ({ f, s }) => `${f} I'd have panicked. Like, actually panicked. I don't know how ${s} is keeping it together.`,
      ({ f, s }) => `${f} Somebody please tell ${s} it's going to be okay. Even if it isn't.`],
    win: [({ f, s }) => `${f} Oh, thank goodness. I was so worried for ${s}.`, ({ f }) => `${f} I could breathe again. I didn't know I'd stopped.`, ({ f, s }) => `${f} Okay, but now everybody's going to come for ${s}, right? Right?`],
  },
  excitable: {
    any: [({ f }) => `${f} I'm SCREAMING.`, ({ f }) => `WAIT. ${f} Did everybody see that?!`, ({ f }) => `${f} Okay, I need to talk to someone about this immediately.`, ({ f }) => `Okay okay okay. ${f} I'm obsessed.`],
    hit: [({ f, s }) => `${f} Noooo, not ${s}! I wasn't ready!`, ({ f }) => `${f} My heart. My actual heart.`, ({ f, s }) => `${f} ${s}, I'm so sorry, but this is the best episode.`],
    win: [({ f, s }) => `${f} GO ${s}!`, ({ f }) => `${f} Best night of the season, no contest!`, ({ f, s }) => `${f} I jumped off the couch. ${s} deserved that so much!`],
  },
  sarcastic: {
    any: [({ f }) => `${f} Shocking. Truly. Nobody could've seen it coming, except everybody.`, ({ f }) => `${f} Great. Love that for them.`,
      ({ f }) => `${f} Oh, so we're doing strategy now. Cute.`, ({ f }) => `${f} And the award for subtlety goes to... nobody.`],
    hit: [({ f, s }) => `${f} ${s} is taking it with all the calm of a cat in a bath.`, ({ f, s }) => `${f} I'm sure ${s} will handle this with grace. Any minute now.`, ({ f }) => `${f} Somebody's mum is very proud tonight.`],
    win: [({ f, s }) => `${f} Wow, ${s} can do something. Who knew.`, ({ f }) => `${f} Enjoy the week. It's only a week.`, ({ f, s }) => `${f} ${s} is going to be insufferable about this, and fair enough.`],
  },
  warm: {
    any: [({ f }) => `${f} Everyone's going to be so tired tomorrow. Be gentle with each other in there.`, ({ f }) => `${f} Hugs all round. They're going to need them.`,
      ({ f }) => `${f} What a night. I just want everybody in there to be okay.`, ({ f, s }) => `${f} I hope somebody's sitting with ${s} tonight, whatever happens next.`],
    hit: [({ f, s }) => `${f} I just hope somebody checks on ${s} tonight.`, ({ f }) => `${f} That one hurt a bit, not going to lie.`, ({ f, s }) => `${f} ${s} deserved better than how that went down.`],
    win: [({ f, s }) => `${f} I'm so happy for ${s}. That was earned.`, ({ f, s }) => `${f} That's a hard week, and ${s} is still standing. I'm a bit proud, honestly.`, ({ f }) => `${f} Moments like that are why I love this show.`],
  },
  formal: {
    any: [({ f }) => `${f} That changes the numbers for the rest of the week.`, ({ f }) => `For the record: ${f} Everything after that follows from it.`,
      ({ f }) => `${f} Quietly, that's the most important thing that happened tonight.`, ({ f }) => `${f} I'd like to see the vote count before I commit to a read.`],
    hit: [({ f, s }) => `${f} The question now is what ${s} does with the next two days.`, ({ f }) => `${f} It was the correct move, if not the kind one.`, ({ f, s }) => `${f} ${s} had two chances to stop it. Neither was taken.`],
    win: [({ f, s }) => `${f} A good result for ${s}, and an expensive one later.`, ({ f, s }) => `${f} ${s} has a week to turn that into votes.`, ({ f }) => `${f} The win is safety. What it buys is the interesting part.`],
  },
  manipulative: {
    any: [({ f }) => `${f} Lovely. Quiet, deniable, effective.`, ({ f }) => `${f} The good moves look like accidents. That one almost did.`,
      ({ f }) => `${f} Somebody in that house is having a wonderful evening.`, ({ f }) => `${f} I'd have smiled through it and thanked them afterwards.`],
    hit: [({ f, s }) => `${f} Now watch who goes to comfort ${s}. That's who wanted it.`, ({ f, s }) => `${f} If I were sitting next to ${s} tomorrow, I'd be the first to offer sympathy.`,
      ({ f, s }) => `${f} ${s} trusted the wrong smile. It happens to the best of us. Not to me.`],
    win: [({ f, s }) => `${f} Now ${s} has something people want. That's when the fun starts.`, ({ f, s }) => `${f} I'd be ${s}'s best friend by breakfast.`, ({ f, s }) => `${f} Lovely for ${s}. Wins make people so much easier to talk to.`],
  },
  boastful: {
    any: [({ f }) => `${f} Cute. I did that in my sleep.`, ({ f }) => `${f} Not bad. Not me, but not bad.`, ({ f }) => `${f} Somebody's been watching my season.`, ({ f }) => `${f} Fine. I'll allow it.`],
    hit: [({ f, s }) => `${f} ${s} should've called me first.`, ({ f, s }) => `${f} That never happened to me, and I'd love for ${s} to ask me why.`, ({ f }) => `${f} I'd give it a six. It'd be a ten if I'd done it.`],
    win: [({ f, s }) => `${f} Good, ${s}. Still not my record.`, ({ f, s }) => `${f} I won that kind of thing twice a week. Well done, ${s}.`, ({ f }) => `${f} Cute win. Call me when it's a streak.`],
  },
  streetwise: {
    any: [({ f }) => `${f} Cold. I like cold.`, ({ f }) => `${f} That's how it works in there. You hit first or you get hit.`, ({ f }) => `${f} Nobody's safe in that place. Nobody.`, ({ f }) => `${f} Respect. That took guts.`],
    hit: [({ f, s }) => `${f} If that was me I'd be in somebody's face by now. ${s} is too nice.`, ({ f, s }) => `${f} ${s} better watch their back now.`, ({ f, s }) => `${f} ${s} got played. Happens. Get up.`],
    win: [({ f, s }) => `${f} ${s} came to fight. Good.`, ({ f, s }) => `${f} That's how you do it, ${s}. Make them sweat.`, ({ f }) => `${f} Now everybody knows not to mess with that one.`],
  },
  mystical: {
    any: [({ f }) => `${f} The house wanted that. You could feel it.`, ({ f }) => `${f} Something's moving in the stars right now, I'm just saying.`,
      ({ f }) => `${f} I had a dream about this. Not this exactly. But close.`, ({ f }) => `${f} The universe is balancing something. I don't know what yet.`],
    hit: [({ f, s }) => `${f} ${s}'s energy has been off all week. This was always coming.`, ({ f }) => `${f} Everything happens for a reason, even the ugly stuff.`, ({ f, s }) => `${f} ${s} will be okay. ${s}'s path just bent a little.`],
    win: [({ f, s }) => `${f} ${s}'s energy was glowing today. I called it.`, ({ f, s }) => `${f} The universe owed ${s} one.`, ({ f }) => `${f} That was meant to happen. You could see it.`],
  },
};

// ── the hosts after them: answering the one before, by name ──
// `p` is the host being answered, `s` the player the moment is about; `hit` lines only for a player on
// the receiving end.
export const REPLY = {
  blunt: {
    agree: { any: [({ p }) => `@${p} exactly. Say it louder.`, ({ p }) => `@${p} yeah, that's it. No notes.`, ({ p }) => `@${p} finally somebody said it.`], hit: [({ p, s }) => `@${p} agreed, and ${s} knows it too.`] },
    disagree: { any: [({ p }) => `@${p} no. That's not what happened.`, ({ p }) => `@${p} you're being way too nice about it.`, ({ p }) => `@${p} hard no. Watch it again.`], hit: [({ p, s }) => `@${p} come on. ${s} walked right into that.`] },
  },
  deadpan: {
    agree: { any: [({ p }) => `@${p} Yes.`, ({ p }) => `@${p} That.`, ({ p }) => `@${p} Correct, unfortunately.`, ({ p }) => `@${p} Sure. Also yes.`], hit: [] },
    disagree: { any: [({ p }) => `@${p} No.`, ({ p }) => `@${p} I don't think so.`, ({ p }) => `@${p} That's one way to watch it. The wrong one.`, ({ p }) => `@${p} Respectfully, no.`], hit: [] },
  },
  theatrical: {
    agree: { any: [({ p }) => `@${p} THANK you. Somebody in this room gets it.`, ({ p }) => `@${p} yes, yes, a thousand times yes.`, ({ p }) => `@${p} I'm putting this on a poster.`, ({ p }) => `@${p} you took the words right out of my mouth, and I had a whole speech ready.`], hit: [] },
    disagree: { any: [({ p }) => `@${p} I'm sorry, did we watch the same episode?`, ({ p }) => `@${p} I can't believe what I'm reading.`, ({ p }) => `@${p} the audacity of this take.`], hit: [({ p, s }) => `@${p} no, darling. No. ${s} deserves a better reading than that.`] },
  },
  nervous: {
    agree: { any: [({ p }) => `@${p} okay, yeah, that's what I was worried about.`, ({ p }) => `@${p} I was thinking that but I didn't want to say it.`, ({ p }) => `@${p} yes. Oh no. Yes.`, ({ p }) => `@${p} that actually makes me feel better? I think?`], hit: [] },
    disagree: { any: [({ p }) => `@${p} um, I sort of read it the other way? Sorry.`, ({ p }) => `@${p} maybe? I feel like it's more complicated. Sorry.`], hit: [({ p, s }) => `@${p} I could be wrong, but I don't think ${s} saw it like that.`, ({ p, s }) => `@${p} I'm not sure that's fair to ${s}?`] },
  },
  excitable: {
    agree: { any: [({ p }) => `@${p} YES. This!`, ({ p }) => `@${p} I literally said that out loud!`, ({ p }) => `@${p} okay, you get it, you totally get it!`, ({ p }) => `@${p} we're the same person tonight!`], hit: [] },
    disagree: { any: [({ p }) => `@${p} noooo, you're wrong, but I love you!`, ({ p }) => `@${p} okay but hear me out, it's the opposite!`, ({ p }) => `@${p} wait, what? No!`], hit: [({ p, s }) => `@${p} no way! ${s} is going to be totally fine!`] },
  },
  sarcastic: {
    agree: { any: [({ p }) => `@${p} wow, a correct opinion in this room. Mark the calendar.`, ({ p }) => `@${p} annoyingly, yes.`, ({ p }) => `@${p} I hate that you're right.`, ({ p }) => `@${p} fine. You win this one.`], hit: [] },
    disagree: { any: [({ p }) => `@${p} bold take for someone who watched with their eyes shut.`, ({ p }) => `@${p} sure, and I'm the king of the house.`, ({ p }) => `@${p} great theory. Wrong, but great.`, ({ p }) => `@${p} love the confidence. Hate the read.`], hit: [] },
  },
  warm: {
    agree: { any: [({ p }) => `@${p} and you said it so kindly too.`, ({ p }) => `@${p} yes, totally.`, ({ p, s }) => `@${p} this, and I hope ${s} hears it.`], hit: [({ p, s }) => `@${p} agreed. Poor ${s}.`] },
    disagree: { any: [({ p }) => `@${p} I see it a bit differently, but I get why you'd say that.`], hit: [({ p, s }) => `@${p} I think we're being a little hard on ${s}.`, ({ p, s }) => `@${p} I don't know, I think ${s} did their best with a tough week.`, ({ p, s }) => `@${p} gently, no. ${s} was in an impossible spot.`] },
  },
  formal: {
    agree: { any: [({ p }) => `@${p} Agreed. That's the correct read.`, ({ p }) => `@${p} Yes. The numbers support that.`, ({ p }) => `@${p} Precisely.`], hit: [({ p, s }) => `@${p} I'd add only that ${s} saw it coming.`] },
    disagree: { any: [({ p }) => `@${p} I'd dispute that. The timeline doesn't support it.`, ({ p }) => `@${p} I see the argument, but the count says otherwise.`, ({ p }) => `@${p} Respectfully, that skips a step.`], hit: [({ p, s }) => `@${p} That's not quite right. ${s} had options.`] },
  },
  manipulative: {
    agree: { any: [({ p }) => `@${p} beautifully put. I couldn't agree more.`, ({ p }) => `@${p} you see it. Most people don't.`, ({ p }) => `@${p} yes, and the clever part is nobody will blame anyone for it.`, ({ p }) => `@${p} I'd say the same, only quieter.`], hit: [] },
    disagree: { any: [({ p }) => `@${p} that's exactly what they want you to think.`, ({ p }) => `@${p} charming read. A little naive, but charming.`, ({ p }) => `@${p} oh, you sweet thing. No.`], hit: [({ p, s }) => `@${p} look again. ${s} isn't the one who lost tonight.`] },
  },
  boastful: {
    agree: { any: [({ p }) => `@${p} correct, and I said it first.`, ({ p }) => `@${p} yes. I've been saying this for seasons.`, ({ p }) => `@${p} good. You're learning from me.`, ({ p }) => `@${p} finally, someone with my eye for it.`], hit: [] },
    disagree: { any: [({ p }) => `@${p} no, and I'd know. I've been in that chair.`, ({ p }) => `@${p} cute take. Wrong, but cute.`, ({ p }) => `@${p} let the professionals handle this one.`, ({ p }) => `@${p} I'd explain it, but you wouldn't get it.`], hit: [] },
  },
  streetwise: {
    agree: { any: [({ p }) => `@${p} straight up.`, ({ p }) => `@${p} facts.`, ({ p }) => `@${p} yeah, that's real.`, ({ p }) => `@${p} you know how it is.`], hit: [] },
    disagree: { any: [({ p }) => `@${p} nah. Nah.`, ({ p }) => `@${p} it's not that simple in there.`, ({ p }) => `@${p} come on, man.`], hit: [({ p, s }) => `@${p} that's soft. ${s} knew what they were doing.`] },
  },
  mystical: {
    agree: { any: [({ p }) => `@${p} yes. I felt that too.`, ({ p }) => `@${p} you're tuned in tonight.`, ({ p }) => `@${p} the room agrees with you, I can tell.`, ({ p }) => `@${p} exactly. It was written.`], hit: [] },
    disagree: { any: [({ p }) => `@${p} hmm, I'm getting a different energy from it.`, ({ p }) => `@${p} I don't think that's what the house was saying.`, ({ p }) => `@${p} the vibe was off, but not like that.`, ({ p }) => `@${p} trust me, there's more under it.`], hit: [] },
  },
};

/** The lines a voice has for this player's role: what assumes nothing, and what fits the role. */
// (a win takes only its own: "That's the move, I'd have done it a week earlier" is not about a competition)
export const reactPool = (voice, role) => (role === 'win' ? REACT[voice]?.win || []
  : [...(REACT[voice]?.any || []), ...(role === 'hit' ? REACT[voice]?.hit || [] : [])]);
export const replyPool = (voice, stance, role) => [...(REPLY[voice]?.[stance]?.any || []), ...(role === 'hit' ? REPLY[voice]?.[stance]?.hit || [] : [])];
