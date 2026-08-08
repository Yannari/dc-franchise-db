// The green room: alumni hosts talking about tonight, members answering back.
//
// Birdie's crowd is written by the sampler from fan personas. This is the other
// room and it needs a different voice entirely — not louder fans, but people who
// have SAT WHERE THE PLAYER IS SITTING. So the lines are built from the host's
// own record: their placement, their wins, the votes they survived, the seasons
// they came back for. "I went home 9th in season 4 doing exactly this" is worth
// more than any amount of adjectives, and it cannot be faked because it is read
// out of players_database.json.
//
// The physics come from ChatBCC's documented model, not its interface: hosts
// hold the mic, members comment underneath, and there are no tomatoes and no
// ratios in the main line. A pile-on belongs on Birdie; this room is a
// conversation between people who know each other.
//
// Pure: events and host records in, message records out. Seeded, so a night
// reads the same every time it is opened.
import { eventLabel, words } from './adapter.js';
import { pickRotating } from './freshness.js';
import { TRAIT_TAKES, assignTraits } from './voices.js';

/** Deterministic rng — the same night must not say different things on reload. */
function seeded(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/**
 * Pick without repeating what was just said.
 *
 * Two hosts in a row delivering the same sentence about different people is the
 * single most obvious tell that a room is generated — it happened on the first
 * render, with Jacques and Alejandro both opening "That nomination speech told
 * the whole camp more than it told…". Remembering the last few choices per pool
 * costs nothing and removes it.
 *
 * That memory is per-EPISODE, though, and the audit found what that costs: a
 * night is near-perfect and a season is 55% distinct, because every episode
 * begins having forgotten everything and walks into the same end of the same
 * pool. `pickRotating` starts each episode somewhere else in it. See
 * freshness.js — the salt is what stops every pool in the room shifting by the
 * same amount on the same night.
 */
function pickFresh(arr, rng, used, episode = 0, salt = 0) {
  return pickRotating(arr, rng, used, { episode, salt });
}
const titleCase = s => String(s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/**
 * The credential a host is speaking from.
 *
 * Every one of these is a fact on their record. A host with nothing relevant
 * gets an empty string and simply does not claim anything — silence beats an
 * invented résumé, and the spec's validators would reject the invention anyway.
 */
function credential(host, w) {
  const bits = [];
  if (host.wins) bits.push(`won a season`);
  if (host.bestPlacement === 2) bits.push(`finished runner-up`);
  if (host.expertise.includes('the jury')) bits.push(`sat on a jury`);
  if (host.expertise.includes('competitions')) bits.push(`relied on ${w.challenge} wins`);
  if (host.seasonsPlayed >= 3) bits.push(`played ${host.seasonsPlayed} seasons`);
  if (host.expertise.includes('surviving votes')) bits.push(`survived plenty of votes`);
  return bits;
}

/**
 * The angle this alumnus naturally speaks from.
 *
 * Host records deliberately have no hand-maintained archetype. Derive one from
 * facts already on the eligible-host record and the canonical voice profile,
 * so a new alumnus acquires a lens without somebody editing this file.
 */
export function hostLens(host) {
  return lensRanking(host)[0];
}

/**
 * Every lens this alumnus could credibly speak from, best fit first.
 *
 * The old version returned the first match and stopped, which sounds harmless
 * and was not. `competitions` expertise is the most common thing on a record —
 * anybody with challenge wins has it — so it swallowed the panel: measured on
 * the real database, EIGHT of twelve hosts came out `challenge-beast`, one was
 * a strategist, three were villains, and `goat`, `underdog` and `social` were
 * unreachable. Eight people sharing a pool of five sentences is not a room, and
 * no amount of freshness memory fixes it, because there is nothing else in
 * there to reach for.
 *
 * A ranking rather than an answer, so `assignLenses` can hand somebody their
 * SECOND-best lens when their first is oversubscribed.
 */
export function lensRanking(host) {
  const voice = String(host.voice || '').toLowerCase();
  const exp = host.expertise || [];
  const scored = [
    ['villain', /villain|cruel|ruthless|manipulat|cutthroat|mean-girl|sadistic|schem/.test(voice) ? 6 : 0],
    ['goat', !host.wins && host.bestPlacement != null && host.bestPlacement <= 3 ? 5 : 0],
    ['strategist', exp.includes('alliances') || exp.includes('jury management') ? 4 : 0],
    ['challenge-beast', exp.includes('competitions') ? 3 : 0],
    ['underdog', exp.includes('surviving votes') ? 2 : 0],
    // Always available, always last: somebody with no distinguishing record
    // talks about the people rather than the game, which is a real way to be.
    ['social', 0.5],
  ];
  return scored.sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

/**
 * Who speaks from which angle, across the whole panel.
 *
 * Per-host assignment cannot see the collision, so it has to be done for the
 * panel at once: each lens takes only as many hosts as it has words to support,
 * and everybody else moves to their next-best angle. The take-less lenses
 * (`strategist`, `underdog`, `social`) are not a demotion — a host on one of
 * those draws from the general pool, which is four times bigger than any lens
 * pool, so overflow lands somewhere MORE varied rather than less.
 */
export function assignLenses(speakers) {
  const list = speakers || [];
  const cap = new Map();
  for (const [name, kinds] of Object.entries(LENS_TAKES)) {
    const lines = Object.values(kinds).reduce((n, arr) => n + arr.length, 0);
    // Roughly one host per six lines of material, and never nobody.
    cap.set(name, Math.max(1, Math.round(lines / 6)));
  }
  const taken = new Map();
  const out = new Map();
  // Strongest claim first, so a genuine villain gets `villain` and the person
  // who merely has no other trait is the one who moves.
  const order = [...list].sort((a, b) =>
    (LENS_TAKES[lensRanking(b)[0]] ? 1 : 0) - (LENS_TAKES[lensRanking(a)[0]] ? 1 : 0));
  for (const host of order) {
    const ranked = lensRanking(host);
    const pick = ranked.find(l => !LENS_TAKES[l] || (taken.get(l) || 0) < cap.get(l))
      || ranked[ranked.length - 1];
    taken.set(pick, (taken.get(pick) || 0) + 1);
    out.set(host.slug, pick);
  }
  return out;
}

/**
 * Complete opinions, not labels glued onto a generic sentence. Only kinds where
 * a lens genuinely changes the read are listed; everything else uses TAKES.
 */
export const LENS_TAKES = {
  villain: {
    eviction: [
      ({ s }) => `${s} is going to call that cruel. It was. It was also clean, and clean is what matters when you are the one staying.`,
      ({ s }) => `The room did not owe ${s} honesty after ${s} made honesty strategically stupid.`,
      ({ s }) => `I like the person who smiled through that goodbye. Lying is easy; keeping the relationship warm after the vote is the skill.`,
      ({ s }) => `${s} wanted loyalty without ever making betrayal expensive. Somebody finally noticed.`,
      ({ s }) => `No speech saves ${s} there. The only useful move was making somebody else more irritating before the meeting.`,
      ({ s }) => `Everyone is mourning ${s}'s game now. Half of them have been waiting weeks to enjoy this privately.`,
    ],
    nomination: [
      ({ s }) => `If I put ${s} there, I would call them a pawn too. People sit still when you give the danger a polite name.`,
      ({ s }) => `${s} is not the target yet. The smart play is making the room comfortable enough to decide they should be.`,
      ({ s }) => `That speech was camouflage. The real message was to everybody who now knows ${s} can be touched.`,
      ({ s }) => `You nominate ${s} when you want information. Watch who panics, who campaigns and who looks pleased.`,
      ({ s }) => `I would stop reassuring ${s}. A nervous nominee burns more relationships than a calm one.`,
      ({ s }) => `The move is cowardly. Cowardly moves work all the time; people just hate admitting it.`,
    ],
    betrayal: [
      ({ s }) => `${s} trusted a promise more than the person making it. That is not loyalty; that is lazy risk assessment.`,
      ({ s }) => `The betrayal is good. The apology is where they got greedy and tried to keep the jury vote too.`,
      ({ s }) => `If you cut ${s}, look at ${s} and own it. Shame is only useful to the person you just betrayed.`,
      ({ s }) => `${s} can be angry. The move still worked, and anger does not reverse a vote.`,
    ],
  },
  'challenge-beast': {
    eviction: [
      ({ s, w }) => `${s} could have won one more ${w.challenge} and delayed this. That is not the same as having a path out.`,
      ({ s }) => `People blame the last loss because it is visible. ${s} lost the room long before losing anything physical.`,
      ({ s }) => `${s} kept waiting for a win to repair relationships. A win gives safety, not affection.`,
      ({ s }) => `The strongest player leaving is not automatically a big move. Sometimes the obvious move is obvious because it is right.`,
      ({ s }) => `${s} performed under pressure all season. The problem was needing to perform every single time.`,
      ({ s }) => `That is what happens when your résumé becomes everybody else's reason to agree.`,
    ],
    nomination: [
      ({ s, w }) => `Putting ${s} there only works if you can beat them in the next ${w.challenge}. Now you have made sure they know they need it.`,
      ({ s }) => `${s} looks calm. Competitors love a problem with rules; the social part after the win is where this gets messy.`,
      ({ s }) => `If the plan is to scare ${s}, congratulations. If the plan is to weaken them, this may do the opposite.`,
      ({ s }) => `${s} has one clear job now while everybody else has six conversations to manage. I prefer the clear job.`,
      ({ s }) => `The seat gives ${s} urgency and takes away any reason to hide. That can be a terrible trade.`,
      ({ s }) => `Do not nominate a strong player for theatre. Either finish the move or leave them sleeping.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} was behind early and never rushed. That is not luck; that is knowing the ${w.challenge} better than the people beside you.`,
      ({ s }) => `The recovery was the impressive part. Anybody looks composed before the first mistake.`,
      ({ s }) => `${s} won safety and advertised the exact skill set everybody has to remove. Fair trade tonight, expensive tomorrow.`,
      ({ s }) => `People will say that looked easy. It looked easy because ${s} did the ugly part correctly.`,
      ({ s }) => `That is a pressure win. I care about those more than padding a résumé while already safe.`,
      ({ s }) => `${s} should celebrate for ten minutes and spend the rest of the night making the win feel less threatening.`,
    ],
  },
  goat: {
    eviction: [
      ({ s }) => `${s} learned too late that being included in every plan can mean nobody considers you part of one.`,
      ({ s }) => `The easy person to sit beside hears a lot. ${s} heard everything except how the room valued ${s}.`,
      ({ s }) => `People kept ${s} comfortable because comfort was the only thing they needed from that relationship.`,
      ({ s }) => `${s} was not betrayed by an alliance. ${s} was released by people who never expected resistance.`,
      ({ s }) => `Low threat is useful until the room decides it no longer needs another available number.`,
      ({ s }) => `${s} had access and mistook it for influence. Those feel identical right up to the vote.`,
    ],
    nomination: [
      ({ s }) => `Calling ${s} a pawn tells you exactly how little the decision-maker thinks ${s} can change the week. I would take that personally.`,
      ({ s }) => `${s} is being used because everybody expects gratitude for surviving. That expectation can be weaponised.`,
      ({ s }) => `The room will talk freely around ${s} now. The question is whether ${s} finally uses what people volunteer.`,
      ({ s }) => `A supposedly safe nominee has one advantage: nobody hides how disposable they think you are.`,
      ({ s }) => `${s} does not need to look powerful. ${s} needs two people to realise this could be their chair next.`,
      ({ s }) => `Being underestimated is only strategy if ${s} eventually does something with the information.`,
    ],
    finale: [
      ({ s }) => `${s} cannot win by pretending the easy-opponent label never existed. Explain why the people using it were wrong.`,
      ({ s }) => `The jury already knows why somebody brought ${s}. It is waiting to hear what ${s} did with being underestimated.`,
      ({ s }) => `Surviving is part of a case, not the whole case. ${s} needs to name the moment survival became agency.`,
      ({ s }) => `If ${s} says “social game,” somebody on that jury will ask which vote changed because of it. Have the answer ready.`,
    ],
  },
};

/**
 * Canon voice beats résumé archetype. These are complete thoughts for alumni
 * who regularly make the panel, written from voice-profiles.json rather than
 * by decorating the same analyst sentence with a catchphrase.
 */
const CHARACTER_TAKES = {
  bowie: {
    nomination: [
      ({ s }) => `Oh, I hate this for ${s}. Everybody is smiling like it is a tiny favour and it is absolutely not a tiny favour.`,
      ({ s }) => `Can we please stop calling ${s} a pawn like that makes the chair softer? You still put their game in everybody else's hands!`,
      ({ s }) => `I want ${s} to stay calm. I also want ${s} to make it extremely awkward for every person pretending this was harmless.`,
    ],
    eviction: [
      ({ s }) => `No, that goodbye hurt. ${s} was trying so hard to make everybody else feel okay about voting them out, and now I am upset.`,
      ({ s }) => `I knew ${s} was leaving and somehow I still talked myself into hope. Terrible evening. Beautiful television. I need a minute.`,
      ({ s }) => `The game reason makes sense. Emotionally, I reject it. Those two opinions can share a room.`,
    ],
  },
  jacques: {
    nomination: [
      ({ s }) => `Putting ${s} on display without finishing the move? Amateur staging. Now the star of the show knows exactly where to aim.`,
      ({ s }) => `Everyone rehearsed that calm little ceremony beautifully. Unfortunately, ${s} was the only one watching the judges.`,
      ({ s }) => `A nomination should be decisive, elegant and devastating. This was nervous, obvious and somehow still smug.`,
    ],
    eviction: [
      ({ s }) => `${s} mistook composure for control. I know the difference; one wins the performance and the other keeps you in it.`,
      ({ s }) => `A dramatic exit cannot rescue poor technique, but I will admit ${s} sold the final pose.`,
      ({ s }) => `They smiled, hugged ${s}, and executed the routine exactly as rehearsed. Cold. Precise. Finally, some professionalism.`,
    ],
  },
  wayne: {
    nomination: [
      ({ s }) => `Okay, putting ${s} up as a “friend” is like passing your teammate the puck after the whistle. What are they supposed to do with that?`,
      ({ s }) => `I would tell ${s} I have their back. Like, actually tell them—not nominate them and hope they understand friendship through clues.`,
      ({ s }) => `Maybe this is secretly smart. It feels bad, though. My smart-move alarm and bad-friend alarm are both going off and one is way louder.`,
    ],
    eviction: [
      ({ s }) => `Aw, man. ${s} knew, right? Everybody did the sad hug before the vote. That is basically lining up for handshakes before the game ends.`,
      ({ s }) => `I am fine. Totally fine. I just think if you promise ${s} safety, you should mean it, and apparently that is controversial now.`,
      ({ s }) => `${s} needed one teammate to take a penalty for them and everybody suddenly forgot they were on a team.`,
    ],
  },
  cameron: {
    nomination: [
      ({ s }) => `Technically, ${s} has fewer choices now, which should make them easier to predict. Except panic changes behaviour, so—sorry—the nomination may have made the entire week less predictable.`,
      ({ s }) => `Everyone is treating ${s} like a controlled variable. People are not controlled variables. I learned that somewhat catastrophically.`,
      ({ s }) => `The probability that ${s} stays looks decent. The probability that ${s} still trusts any of these people afterward is, um, considerably lower.`,
    ],
    eviction: [
      ({ s }) => `The vote looks sudden, but it is more like structural failure: one small crack, then another, and by tonight ${s} had nothing load-bearing left.`,
      ({ s }) => `I counted three possible escapes for ${s}. Then everybody hugged, which eliminated all three. Social cues are horrible, but occasionally very efficient.`,
      ({ s }) => `Statistically, ${s} was in trouble. Emotionally, I kept revising the model because I did not like the answer.`,
    ],
  },
  macarthur: {
    nomination: [
      ({ s }) => `Listen up, genius: if you put ${s} on the block, you do not get to act shocked when ${s} starts naming names. You handed them the megaphone.`,
      ({ s }) => `That was not a warning shot. That was missing from six feet away and asking everybody to admire the aim.`,
      ({ s }) => `Either ${s} is the target or this plan is wasting everybody's time. Pick one, say it loudly, move!`,
    ],
    eviction: [
      ({ s }) => `Case closed. ${s} kept interrogating the obvious liar and ignoring the quiet one holding the evidence.`,
      ({ s }) => `Everybody says ${s} played too hard. Wrong! ${s} announced every move like a police siren and then wondered why people ran.`,
      ({ s }) => `I hate a unanimous pile-on. Not because it is mean—because it is lazy. Somebody in that room just got away without showing their hand.`,
    ],
  },
  alejandro: {
    nomination: [
      ({ s }) => `Poor ${s}. They were offered the word “pawn” and accepted it like a compliment. Such pretty wrapping on such an ugly little message.`,
      ({ s }) => `Reassuring ${s} now would be cruel. Let the uncertainty work; frightened people reveal whom they truly trust.`,
      ({ s }) => `The nomination is almost flattering. Somebody considers ${s} dangerous—just not dangerous enough to fear the consequences.`,
    ],
    eviction: [
      ({ s }) => `${s} wanted honesty from people who benefited from the lie. Admirable, perhaps. Effective? No.`,
      ({ s }) => `Everyone gave ${s} a beautiful goodbye. That is how you know the betrayal was settled long before tonight.`,
      ({ s }) => `I would feel sorry for ${s}, but they made trust so inexpensive. Naturally, everybody bought some.`,
    ],
  },
};

/** Put a real résumé fact into speech without turning it into “so hear me out.” */
function withCredential(line, fact, rng) {
  return pick([
    () => `${line} I ${fact}; that is the part I recognise.`,
    () => `Having ${fact}, I keep coming back to this: ${line}`,
    () => `${line} Maybe I notice it because I ${fact}.`,
    () => `I ${fact}. What stayed with me was this: ${line}`,
    () => `${line} I learned that after I ${fact}.`,
    () => `This may be my own history talking—I ${fact}—but ${line}`,
  ], rng)();
}

/**
 * What a host says about one moment.
 *
 * Four or more readings per kind, because a room where every eviction gets the
 * same sentence stops being people within about two episodes. The readings
 * DISAGREE with each other on purpose — fame is reach, not correctness, and a
 * panel that speaks with one voice reads as a press release.
 */
export const TAKES = {
  eviction: [
    ({ s, w }) => `${s} was gone the moment the ${w.home} stopped needing ${s.split(' ')[0]}. You can feel that shift days before the ${w.vote}.`,
    ({ s, w }) => `Everyone will say ${s} played too hard. ${s} played too visibly. Those are different mistakes and only one of them is fixable.`,
    ({ s }) => `I do not think ${s} did anything wrong tonight. Sometimes the number is just up and there is no version of the day where it is not.`,
    ({ s, w }) => `Watch the ${w.home} in the hour before. Nobody sits next to somebody they are about to send home. Nobody.`,
    ({ s }) => `${s} asked the wrong person for the truth. That is the whole game right there.`,
    ({ s }) => `${s} spent the week proving they were dangerous and the month proving nobody owed them a warning.`,
    ({ s, w }) => `The ${w.vote} is simple. The interesting part is how many people felt relieved when ${s} finally heard it.`,
    ({ s }) => `${s} had conversations. What ${s} did not have was anybody willing to look foolish on their behalf.`,
    ({ s }) => `That exit started when ${s} won an argument everybody else quietly resented losing.`,
    ({ s, w }) => `You can survive being the target. You cannot survive the whole ${w.home} enjoying the idea.`,
    ({ s }) => `${s} kept asking whether the plan had changed. Nobody asks that many times unless the room already feels different.`,
    ({ s }) => `This was not one bad day. This was six small withdrawals and no social capital left when the bill came.`,
    ({ s }) => `${s} needed one person to risk being wrong. Every relationship stopped just short of that line.`,
    ({ s }) => `The game did not get away from ${s}. The people did, one private conversation at a time.`,
    ({ s, w }) => `Notice who hugged ${s} before the result and who waited until after. That is the next ${w.vote}.`,
    ({ s }) => `${s} leaves with the right diagnosis and the wrong suspect, which is the cruelest version of this game.`,
    ({ s }) => `Everybody calls an eviction inevitable after it happens. Three days ago, one honest conversation saves ${s}.`,
    ({ s }) => `${s} was useful until the room realised being useful and being exhausting can coexist.`,
    ({ s }) => `The saddest part is that ${s} finally read the room correctly during the goodbye hugs.`,
    ({ s }) => `That was a social eviction wearing strategic language because nobody wanted to say they were tired of ${s}.`,
  ],
  blindside: [
    ({ s }) => `That was not a vote, that was a decision made somewhere ${s} was not standing. Beautiful work by whoever held it together.`,
    ({ s }) => `A blindside that clean means somebody lied to a friend and did it well. I would like to know who, because that is the winner.`,
    ({ s }) => `${s} had it. Genuinely had it. And then stopped counting, which is when the floor goes.`,
    ({ s, w }) => `The tell was earlier: the ${w.home} got polite. It always gets polite before this.`,
    ({ s }) => `I have been on the wrong end of one of these. You do not see it because the people hiding it are the people you check with.`,
    ({ s }) => `${s} checked every relationship except the one between everybody else.`,
    ({ s }) => `The clean part was not the lying. It was making each person believe they were the only one lying to ${s}.`,
    ({ s }) => `${s} saw every clue and filed each one under somebody else's problem.`,
    ({ s, w }) => `A unanimous face is harder than a unanimous ${w.vote}. That ${w.home} held both.`,
    ({ s }) => `Whoever reassured ${s} last did the most dangerous work and will get the least credit.`,
    ({ s }) => `That only stays secret when the people excluded from the plan do not realise they were excluded.`,
    ({ s }) => `${s} was counting promises. The other side was counting people willing to break them.`,
    ({ s }) => `The pause before ${s} stood up told you the whole season had just replayed in their head.`,
    ({ s }) => `A great blindside makes the target look foolish. A perfect one makes the audience feel foolish too.`,
    ({ s }) => `${s} trusted the right people individually. Collectively, they became the wrong people.`,
    ({ s }) => `Nobody leaked because nobody needed to feel important more than they needed ${s} gone. That is rare.`,
    ({ s }) => `${s} thought silence meant calm. Silence that coordinated is never calm.`,
    ({ s }) => `The person who planned it deserves credit. The people who acted normal deserve the win.`,
    ({ s }) => `${s} did not miss the numbers; ${s} missed that the emotional vote had already happened.`,
    ({ s }) => `The reveal was five seconds. Keeping ${s} comfortable took the entire week.`,
  ],
  'comp-win': [
    ({ s, w }) => `${s} needed that ${w.challenge} and knew it. You could see the difference between wanting it and needing it.`,
    ({ s }) => `Great win, terrible timing. Winning now paints the target ${s} has been avoiding all season.`,
    ({ s, w }) => `That is a real ${w.challenge} performance, not a lucky one. The difference matters when we are ranking these later.`,
    ({ s }) => `I would rather be ${s} tonight than anyone else in that room, and I would rather be almost anyone else next week.`,
    ({ s }) => `${s} did not just win. ${s} showed everybody exactly what has to be prevented next time.`,
    ({ s, w }) => `That ${w.challenge} exposed who prepared, who panicked and who has been coasting on reputation.`,
    ({ s }) => `The impressive part was recovering after the mistake. Anybody looks strong before something goes wrong.`,
    ({ s }) => `${s} made the difficult section look ordinary, which is how people talk themselves out of targeting a threat.`,
    ({ s }) => `Win equity went up. Social room went down. ${s} has to know both happened.`,
    ({ s }) => `The person celebrating hardest beside ${s} is already planning how not to face them again.`,
    ({ s, w }) => `People will call that dominance. I call it surviving one ${w.challenge} with a larger problem afterwards.`,
    ({ s }) => `${s} was calm because ${s} trusted the preparation. Everybody else was performing confidence.`,
    ({ s }) => `One win is safety. Two is a pattern. This one made ${s} a pattern.`,
    ({ s }) => `That performance earns respect and costs secrecy. You rarely get to keep both.`,
    ({ s }) => `${s} chose the right moment to stop hiding. The question is whether there was any choice.`,
    ({ s }) => `The scoreboard says ${s}. The strategic winner is whoever now gets to point at ${s}.`,
    ({ s }) => `Winning under pressure is jury material. Creating the pressure yourself is not.`,
    ({ s }) => `${s} has become the answer to every future plan, which is a rough prize to collect this early.`,
    ({ s, w }) => `That was technique, not luck. The ${w.home} will pretend otherwise because technique is scarier.`,
    ({ s }) => `A challenge win only changes the week if the winner knows what to do with the room afterwards.`,
  ],
  nomination: [
    ({ s }) => `Putting ${s} up is the safe read. Safe reads are how you get to fifth.`,
    ({ s }) => `${s} on the block is not the story. Who is not on it is the story.`,
    ({ s, w }) => `That nomination speech told the whole ${w.home} more than it told ${s}.`,
    ({ s }) => `I think ${s} stays. And when that happens, everybody who promised this was a harmless nomination gets to explain why they volunteered ${s}'s name.`,
    ({ s }) => `This is a warning shot presented as a plan. ${s} should treat it as both.`,
    ({ s }) => `The nomination is safe because the decision-maker is scared of the conversation the real move requires.`,
    ({ s }) => `${s} is being told pawn. The room is hearing permission.`,
    ({ s }) => `The speech protected the nominator and exposed everybody who nodded along.`,
    ({ s }) => `Putting ${s} up creates three new deals and none of them include the person with the power.`,
    ({ s }) => `${s} was nominated for being expendable. Surviving is how you make that assessment expensive.`,
    ({ s, w }) => `The ${w.home} did not react to ${s}. It reacted to the second name, and that is where the plan is.`,
    ({ s }) => `A pawn who knows they are a pawn is manageable. ${s} knows this is somebody else's rehearsal.`,
    ({ s }) => `Nobody fought the nomination because nobody wanted to be the first person caught caring. Give it until breakfast. They will all care very loudly in private.`,
    ({ s }) => `${s} keeps treating loyalty like homework. These people put you on the block, watched you say thank you, and learned they can do it again.`,
    ({ s }) => `The safest nomination is often the person whose revenge everybody has underestimated.`,
    ({ s }) => `Nobody looked surprised, which means this was agreed before the meeting we watched.`,
    ({ s }) => `${s} is not the target today. The block has a way of editing that sentence overnight.`,
    ({ s }) => `This nomination tells ${s} they are outside. What ${s} does with that information decides the season.`,
    ({ s }) => `That speech was basically, “I trust you enough to risk your game instead of mine.” If ${s} accepts that as a compliment, nominate them again next week.`,
    ({ s }) => `If the plan needs ${s} calm, putting them up was a spectacular way to lose the first requirement.`,
  ],
  'veto-used': [
    ({ s }) => `Using it was right. Using it and saying that was not.`,
    ({ s }) => `${s} just spent the only piece of power anyone was going to hand out this week. I hope it bought something.`,
    ({ s }) => `That veto changed the target and the blame in one move. Both matter, and people only ever count the first.`,
    ({ s }) => `I would have sat on it. But I lost playing my way, so take that for what it is worth.`,
    ({ s }) => `${s} saved one person and publicly chose everyone they were willing to endanger instead.`,
    ({ s }) => `Power is not using the veto. Power is making the room thank you for how you used it.`,
    ({ s }) => `The ceremony solved the block and detonated the next nomination.`,
    ({ s }) => `${s} had leverage for five minutes and spent four of them explaining too much.`,
    ({ s }) => `Using it was bold. Announcing the alliance while using it was charity for the opposition.`,
    ({ s }) => `The saved player owes ${s}. The replacement nominee hates ${s}. One of those feelings lasts longer.`,
    ({ s }) => `That veto was a receipt. Every private promise became public the second ${s} stood up.`,
    ({ s }) => `${s} made the correct move in the loudest possible way. Style has strategic costs.`,
    ({ s }) => `Not using it would have been cowardly. Using it without a replacement plan was careless.`,
    ({ s }) => `The move only works if the person saved can be trusted. That is the part nobody is discussing.`,
    ({ s }) => `${s} bought loyalty from one person with money borrowed from the entire room.`,
    ({ s }) => `Everybody remembers who got saved. Jurors also remember who got offered up in exchange.`,
    ({ s }) => `The veto did not reveal the plan. ${s}'s face before the decision did.`,
    ({ s }) => `A power used late can move a season. A power explained badly can move the target onto you.`,
    ({ s }) => `${s} chose a side. The people pretending there are still no sides are the ones in trouble.`,
    ({ s }) => `That was either the move of the season or the beginning of ${s}'s eviction package.`,
  ],
  betrayal: [
    ({ s }) => `Call it what it is. ${s} got played by somebody who meant it, and meaning it is the part people cannot fake for long.`,
    ({ s }) => `There is a difference between a betrayal and a decision. That was a decision, and ${s} will not hear the difference for weeks.`,
    ({ s }) => `Everybody at home is furious. Everybody who has played is nodding.`,
    ({ s }) => `The apology after is the tell. If you are apologising you are already scared of the jury.`,
    ({ s }) => `${s} did not lose an ally tonight. ${s} learned the alliance ended before the conversation did.`,
    ({ s }) => `The betrayer planned the move. ${s} supplied the trust that made it clean.`,
    ({ s }) => `You can recover from a broken deal. Recovering from looking foolish is the harder social problem.`,
    ({ s }) => `${s} will remember the lie. The jury will remember whether the liar needed it.`,
    ({ s }) => `That was cold, precise and completely survivable if the person who did it owns every inch.`,
    ({ s }) => `The dangerous part is not ${s}'s anger. It is everybody else realising the promise was disposable.`,
    ({ s }) => `A betrayal this public is a campaign speech for both sides. Only one gets to deliver theirs first.`,
    ({ s }) => `${s} gave loyalty as evidence and the other person used it as access.`,
    ({ s }) => `The move makes sense. The performance of regret is what may cost the vote.`,
    ({ s }) => `Nobody breaks a real relationship without leaving fingerprints on the weeks before it. Go look.`,
    ({ s }) => `${s} was not naive. The betrayer was simply willing to become somebody ${s} had ruled out.`,
    ({ s }) => `This is why a final deal needs a reason beyond liking each other. Feelings bend when money gets close.`,
    ({ s }) => `The house just learned that person's promises have an expiration date. Useful move, expensive label.`,
    ({ s }) => `${s} can punish the betrayal or use it. The better players manage to do both.`,
    ({ s }) => `That cut creates one enemy and six nervous allies. The arithmetic is not as clean as it looked.`,
    ({ s }) => `The apology was for the audience. The decision had been emotionally finished days ago.`,
  ],
  'alliance-formed': [
    ({ s }) => `Any alliance built in one conversation dies in one conversation. Ask me how I know.`,
    ({ s }) => `${s} just found the only real number in that room. Now the hard part: keeping it boring.`,
    ({ s }) => `Four people, one plan, no chance. It is always four.`,
    ({ s }) => `I like this for ${s} and I do not like it for anybody sitting next to ${s}.`,
    ({ s }) => `The alliance is real if somebody gives up an option for it. Until then, this is a group photo.`,
    ({ s }) => `${s} found numbers. Trust will be decided the first time the easy vote benefits somebody else.`,
    ({ s }) => `Everybody agreed too quickly. At least one person walked in already planning the version without ${s}.`,
    ({ s }) => `The best alliance meeting is the one nobody realises happened. This one had an opening ceremony.`,
    ({ s }) => `${s} needs this group quiet, boring and slightly unhappy. Excitement is how alliances get noticed.`,
    ({ s }) => `A name gives people comfort. Shared risk gives them loyalty. This has only the name so far.`,
    ({ s }) => `Count who shared information and who only promised future information. ${s} should notice the difference.`,
    ({ s }) => `That group contains two shields, one passenger and the person already drawing a replacement chart.`,
    ({ s }) => `${s} is treating the alliance as protection. Somebody else is treating ${s} as the protection.`,
    ({ s }) => `They agreed on a target before agreeing why they trust each other. That clock is already running.`,
    ({ s }) => `The dangerous alliance is not the four in the room. It is the pair who spoke after the four left.`,
    ({ s }) => `${s} finally has a structure. Now stop announcing it through body language.`,
    ({ s }) => `This works until somebody has to choose between the group and a relationship formed earlier.`,
    ({ s }) => `Half of them need the alliance. Half of them need ${s} to believe in it. Different incentives.`,
    ({ s }) => `The first real test is not a vote. It is whether bad news reaches ${s} without being requested.`,
    ({ s }) => `I believe the deal. I do not believe all four people mean the same deal.`,
  ],
  'showmance-formed': [
    ({ s, w }) => `Fine. Sweet, even. And it just made both of them a two-for-one that the next ${w.vote} will absolutely take.`,
    ({ s }) => `Every season somebody decides the safest person to trust is the one they like most. It has never once been true.`,
    ({ s }) => `Good for them. Genuinely. Terrible for their game, also genuinely.`,
    ({ s }) => `The pair is the target now, not ${s}. That happens instantly and nobody in there feels it.`,
    ({ s }) => `The affection looks real. So does the target it just painted across two backs.`,
    ({ s }) => `${s} gained one person who will share everything and lost five people willing to share anything.`,
    ({ s }) => `Romance is not the mistake. Becoming strategically inseparable in public is the mistake.`,
    ({ s }) => `Every private minute together is a meeting the rest of the room cannot attend. People count those.`,
    ({ s }) => `${s} thinks the relationship creates safety. The house sees one nomination solving two problems.`,
    ({ s }) => `The couple is sweet. The way everybody stopped talking when they entered was not.`,
    ({ s }) => `One of them is in love and one is still gaming. The dangerous moment is when those roles switch.`,
    ({ s }) => `${s} now has perfect information from one person and worse information from everybody else.`,
    ({ s }) => `Pairs survive when they maintain separate rooms. These two just merged every relationship they had.`,
    ({ s }) => `The first person to call this cute is also the first person putting them on the block together.`,
    ({ s }) => `${s} can have the relationship or hide the strategic pair. Trying to do both is what looks suspicious.`,
    ({ s }) => `Nothing makes a loose alliance become serious faster than a visible couple.`,
    ({ s }) => `I am happy for ${s}. I am even happier for whoever needed a bigger target.`,
    ({ s }) => `The room will tell each of them the other is safe right up to the double eviction.`,
    ({ s }) => `A showmance is a shield only if the other person is the one people want first.`,
    ({ s }) => `The relationship may last. Their voting flexibility ended tonight.`,
  ],
  'showmance-broken': [
    ({ s }) => `That was going to end. It ended loudly, which is the only part that costs anything.`,
    ({ s }) => `${s} is now the one person in there with nothing to lose, and that is dangerous for everybody.`,
    ({ s, w }) => `A breakup in that ${w.home} is a vote block coming apart in public. Watch who moves first.`,
    ({ s }) => `I feel for both of them and I am also writing down every name they said out loud.`,
    ({ s }) => `The relationship ended. The information they gave each other is still fully alive.`,
    ({ s }) => `${s} just became emotionally unpredictable and strategically available. Everybody will come shopping.`,
    ({ s }) => `Breakups do not split a pair evenly. One keeps the friends and one keeps the secrets.`,
    ({ s }) => `The cruel part is that the best move for ${s} now looks exactly like revenge, even when it is not.`,
    ({ s }) => `People will comfort both of them and recruit whichever one cries less.`,
    ({ s }) => `${s} lost a guaranteed number and gained the ability to enter rooms that stopped inviting the couple.`,
    ({ s }) => `Every alliance attached to that relationship has to choose which half it actually liked.`,
    ({ s }) => `The fight was personal. The names dropped during it were pure game and everybody heard them.`,
    ({ s }) => `A public breakup is an accidental house meeting with much better information.`,
    ({ s }) => `${s} needs one quiet night. The room will give them eight strategic conversations instead.`,
    ({ s }) => `The pair target is gone. In its place are two people who know exactly how to hurt each other's game.`,
    ({ s }) => `Who apologises first matters less than who other players check on first.`,
    ({ s }) => `${s} can rebuild a game faster than trust, and the season will not wait for both.`,
    ({ s }) => `That argument freed the middle and exposed which side each person thought the couple belonged to.`,
    ({ s }) => `The smartest player tonight says nothing to either half and listens to what both volunteer.`,
    ({ s }) => `A broken showmance is not one less alliance. It is two new campaigns with shared opposition research.`,
  ],
  finale: [
    ({ s }) => `Whatever happens tonight, the season turned three weeks ago and nobody watching noticed.`,
    ({ s }) => `A jury does not reward the best game. It rewards the game it was allowed to see.`,
    ({ s }) => `I have sat in that chair. You cannot argue somebody into liking you in eight minutes.`,
    ({ s }) => `Winners get remembered. Finalists get asked what went wrong for the rest of their lives.`,
    ({ s }) => `The jury is not choosing between games. It is choosing between the stories those games left in the room.`,
    ({ s }) => `${s} needs to own the pain before claiming the move. Reversing that order loses people.`,
    ({ s }) => `A résumé answers what happened. The vote answers whether anybody enjoyed giving ${s} credit.`,
    ({ s }) => `The best finalist tonight will spend less time proving intelligence and more time making jurors feel intelligent.`,
    ({ s }) => `One honest apology is worth more than three moves the jury already knows about.`,
    ({ s }) => `${s} cannot rewrite the season now. ${s} can decide whether the jury feels seen inside it.`,
    ({ s }) => `Final speeches rarely gain seven votes. They lose the two you assumed were locked.`,
    ({ s }) => `The juror asking about loyalty is usually asking whether the relationship was ever real. Answer that question.`,
    ({ s }) => `Comp wins look smaller in these chairs. Social debts look enormous.`,
    ({ s }) => `${s} played for the end. Tonight we find out whether ${s} played for these specific people.`,
    ({ s }) => `There is always one juror pretending to be undecided and one undecided juror pretending not to care.`,
    ({ s }) => `The winner will be whoever explains the same betrayals without making the jurors feel foolish twice.`,
    ({ s }) => `Owning a move means naming what it cost somebody else, not saying you would do it again.`,
    ({ s }) => `${s} should stop saying “the house.” A finalist gets credit by naming where their own hands were.`,
    ({ s }) => `The jury knows the numbers. What it still wants is a reason to feel good writing one name.`,
    ({ s }) => `Tonight is not a debate. It is seven personal exit interviews happening at the same time.`,
  ],
  'episode-aired': [
    ({ s, w }) => `Quiet ${w.episode}, loud consequences. Those are the ones that decide seasons.`,
    ({ s, w }) => `Nothing in that ${w.episode} was an accident. Somebody is running this and doing it well enough that we cannot see it yet.`,
    ({ s, w }) => `The edit is protecting somebody. It is always protecting somebody.`,
    ({ s, w }) => `Three people in that ${w.home} still think they are in a majority. Two of them are wrong.`,
    ({ s, w }) => `The loud story in this ${w.episode} is not the important one. Watch who gained access without making a promise.`,
    ({ s, w }) => `Nobody went home in that conversation, but somebody lost the next ${w.vote}.`,
    ({ s, w }) => `That ${w.episode} was connective tissue. People skip it and then call the blindside sudden.`,
    ({ s, w }) => `The ${w.home} is splitting by comfort, not alliance, and comfort is harder to repair.`,
    ({ s, w }) => `One person received bad news and thanked the messenger. That is the player I am watching.`,
    ({ s, w }) => `The edit showed the argument. The game moved during the apology nobody finished.`,
    ({ s, w }) => `Everybody improved their position except the person narrating how well positioned they are.`,
    ({ s, w }) => `The quietest player in that ${w.episode} was present for every useful conversation. That is not an accident.`,
    ({ s, w }) => `This looked like a reset ${w.episode}. Resets are where the best players change the defaults.`,
    ({ s, w }) => `The next target was chosen tonight without anybody saying a name. Watch the seating.`,
    ({ s, w }) => `Two apologies, three fake laughs and one door held open too long. The ${w.home} is not fine.`,
    ({ s, w }) => `The episode gave us a winner. The week gave us somebody becoming impossible to sit beside.`,
    ({ s, w }) => `A small promise in a boring scene will matter more than the challenge montage. Save this.`,
    ({ s, w }) => `Everyone left the room saying “we.” They were describing three different groups.`,
    ({ s, w }) => `Nothing exploded because the person holding the match decided another day was better.`,
    ({ s, w }) => `The season did not turn tonight. It quietly removed the option of turning back.`,
  ],
};

/** Anything with no written take gets an honest generic one rather than silence. */
export const GENERIC_TAKES = [
  ({ s, k }) => `The ${k.toLowerCase()} is the headline. What it does to the numbers is the actual story.`,
  ({ s, k }) => `People are going to talk about ${s || 'that'} all week and miss what it cost.`,
  ({ s, k }) => `I have seen this exact thing go both ways. It usually comes down to who talks first afterwards.`,
  ({ s, k }) => `Small moment. Watch it matter in nine days.`,
];

/** What a member says under a host's message. Members react; they do not analyse. */
const COMMENTS = [
  'this is the only take i trust', 'ok but you would say that',
  'wait you actually called it before the episode', 'respectfully no',
  'i have watched this three times and you are right',
  'nobody asked but go off', 'this is why you are still my favourite',
  'genuinely never thought of it that way', 'the way this aged in ten minutes',
  'not you calling it a decision', 'ok legend', 'hard disagree and i will not explain',
  'saying what we were all thinking', 'this comment section is not ready',
  'wait because that is exactly what bothered me',
  'you skipped one tiny detail and it changes everything',
  'the confidence is almost convincing',
  'bookmarking this for when it goes terribly wrong',
  'no because now i need to rewatch the whole conversation',
  'you make a strong point against your own argument',
  'the silence from everyone else is LOUD',
  'i disagree but unfortunately this is funny',
  'this room loves hindsight dressed as prophecy',
  'oh you came in here ready to fight tonight',
  'somebody check on the group chat after this',
  'that last sentence was unnecessarily lethal',
  'finally somebody noticed the seating order',
  'i know one former castmate just muted this room',
  'this is either brilliant or cursed. no middle ground',
  'please name the three private wars',
  'the episode gave you evidence and you chose violence',
  'i was with you until the last five words',
  'put this take back in the oven',
  'not the alumni revisionist history starting already',
  'you can tell who is still holding a grudge in here',
  'the producers could never air the real version of this take',
  'okay now say who benefits',
  'this feels personal because it absolutely is',
];

/**
 * Turn one episode's events into a hosted conversation.
 *
 * Only hosts author messages — that is the room's rule, and it is enforced here
 * rather than in the renderer, so no path exists that puts a fan persona on the
 * main stage.
 */
export function buildChatMessages(events, speakers, {
  format = 'total-drama', season = 0, episode = 0, seed = 1,
} = {}) {
  if (!events?.length || !speakers?.length) return [];
  const rng = seeded(seed);
  const w = words(format);
  const out = [];
  let n = 0;
  // One memory per pool, so a busy night does not recycle a line while a quiet
  // one still has the whole pool available.
  const usedByKind = new Map();
  const usedCreds = new Set();
  // Decided once for the panel rather than per message: a lens is only worth
  // having if the people who hold it are not all holding the same one.
  const lensOf = assignLenses(speakers);
  const sharers = new Map();
  for (const l of lensOf.values()) sharers.set(l, (sharers.get(l) || 0) + 1);
  // Derived from the canonical profile, capped like the lenses so one delivery
  // cannot take the panel — the failure that put eight hosts on one lens is the
  // same failure available here, and `warm` matches 82 of 183 descriptions.
  const traitOf = assignTraits(speakers);
  const traitSharers = new Map();
  for (const t of traitOf.values()) traitSharers.set(t, (traitSharers.get(t) || 0) + 1);

  // The loudest moments get covered; a room does not discuss every nomination.
  const worth = events.filter(e => e.kind !== 'episode-aired' || events.length === 1);
  const covered = worth.length > 8 ? worth.filter((_, i) => i % 2 === 0) : worth;

  for (const ev of covered.length ? covered : events) {
    // Rotate a seeded window through the panel. `slice(0, n)` made a seven-host
    // night functionally a two-host room forever; fame picked the panel, then
    // array position silently prevented most of it from speaking.
    const count = Math.min(speakers.length, 2 + Math.floor(rng() * 2));
    const start = Math.floor(rng() * speakers.length);
    const speaking = Array.from({ length: count }, (_, i) =>
      speakers[(start + i) % speakers.length]);
    for (const host of speaking) {
      const subject = ev.subject ? titleCase(ev.subject) : '';
      const lens = lensOf.get(host.slug) || 'social';
      const trait = traitOf.get(host.slug);
      const characterPool = CHARACTER_TAKES[host.slug]?.[ev.kind] || [];
      const lensPool = LENS_TAKES[lens]?.[ev.kind] || [];
      // Lean on your own angle as far as its words can carry you, and no
      // further. A flat 58% had eight hosts pulling from five sentences most of
      // the time; dividing by how many people share the lens is the term that
      // was missing, and the general pool it falls back to is four times bigger.
      const share = lensPool.length / (2 * Math.max(1, sharers.get(lens) || 1));
      // If a canonical voice exists for this exact host and event, use it.
      // Probability here reintroduced personality drift: one unlucky roll made
      // Bowie or Cameron snap back into the same polished analyst as everyone.
      const useCharacter = characterPool.length > 0;
      // ── and everybody who is not one of the named few ──
      //
      // CHARACTER_TAKES above covers the handful whose whole appeal is how they
      // talk. There are 183 canonical profiles and twelve on a panel, so the
      // other 170 arrive with a description and no voice, and two strategists
      // agreeing about a nomination still sound like one writer. A DELIVERY —
      // blunt, deadpan, theatrical, formal — generalises where an opinion does
      // not, and it is the part a reader actually hears. See voices.js.
      //
      // Below the character pool, above the lens, because a lens is a read on
      // the game and a voice is a person.
      const traitPool = (trait && TRAIT_TAKES[trait]?.[ev.kind]) || [];
      // Same term the lens needed, for the same reason: a four-line pool leaned
      // on by three hosts every week repeats, whatever it is called. Measured —
      // a flat 62% took the room from 72% distinct DOWN to 67%, reproducing the
      // exact bug in a nicer costume.
      const tShare = traitPool.length / (2 * Math.max(1, traitSharers.get(trait) || 1));
      const useTrait = !useCharacter && traitPool.length > 0 && rng() < Math.min(0.62, tShare);
      const useLens = !useCharacter && !useTrait
        && lensPool.length > 0 && rng() < Math.min(0.58, share);
      const pool = useCharacter ? characterPool
        : useTrait ? traitPool
          : useLens ? lensPool
            : (TAKES[ev.kind] || GENERIC_TAKES);
      const poolKey = `${ev.kind}:${useCharacter ? host.slug
        : useTrait ? trait : useLens ? lens : 'general'}`;
      if (!usedByKind.has(poolKey)) usedByKind.set(poolKey, new Set());
      let line = pickFresh(pool, rng, usedByKind.get(poolKey), episode, poolKey)
        ({ s: subject, w, k: eventLabel(ev.kind, format) });

      // Records should sharpen an occasional opinion, not introduce every post
      // like an alumni panelist reading their own biography.
      const creds = credential(host, w);
      if (!useCharacter && !useTrait && creds.length && rng() < 0.14) {
        line = withCredential(line, pickFresh(creds, rng, usedCreds, episode, host.slug), rng);
      }

      out.push({
        id: `c-${season}-${episode}-${String(n++).padStart(4, '0')}`,
        format, season, episode,
        stream: 'chat',
        channel: 'main-stage',
        authorType: 'host',
        authorSlug: host.slug,
        author: host.name,
        stars: host.stars,
        native: host.native,
        kind: ev.kind,
        subject: ev.subject || null,
        eventLabel: eventLabel(ev.kind, format),
        lens,
        trait: useTrait ? trait : null,
        text: line,
        at: Math.max(0, ev.at + Math.round((rng() - 0.3) * 4 * 60 * 1000)),
        likes: 40 + Math.floor(rng() * 400) + host.stars * 60,
        comments: [],
        hostReplied: false,
      });
    }
  }

  out.sort((a, b) => a.at - b.at);

  // Members answer underneath. Two previews is what the room shows; the count is
  // the real number, so "42 comments" is not decoration.
  const usedComments = new Set();
  for (const m of out) {
    const count = 2 + Math.floor(rng() * 60);
    m.commentCount = count;
    m.comments = Array.from({ length: Math.min(2, count) }, (_, i) => ({
      id: `${m.id}-c${i}`,
      author: `member${1 + Math.floor(rng() * 900)}`,
      text: pickFresh(COMMENTS, rng, usedComments, episode, m.kind || ''),
    }));
    // A host answering back is the room's highest signal, so it is rare.
    m.hostReplied = rng() < 0.22;
  }

  return out;
}
