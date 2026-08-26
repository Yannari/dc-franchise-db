// How an alumnus talks, as opposed to what they think about tonight.
//
// The lens fix spread the panel across three angles — villain, challenge-beast,
// goat — and that is a real improvement to what hosts SAY. It does nothing for
// how they say it. Two strategists still deliver the same sentence, because a
// lens is a read on the game and a voice is a person.
//
// Doing it per host does not scale: there are 183 canonical voice profiles and
// twelve on a panel, so hand-writing complete event pools for each is hundreds
// of pools that mostly never fire. Delivery generalises where opinion does not
// — "blunt" is a way of speaking that forty people share, and it is the part
// the reader actually hears.
//
// ── the one thing this must not become ──
//
// A trait that decorates a generic sentence is worse than no trait at all. Glue
// "Honestly?" to the front of an even-handed paragraph and you have a nervous
// host who analyses exactly like the deadpan one, plus a tic. Every trait here
// owns COMPLETE constructions: its own sentence length, its own rhythm, its own
// way of arriving at a point. A deadpan take is short because deadpan people
// stop talking; a theatrical one runs long because they do not.
//
// ── deriving the trait ──
//
// voice-profiles.json is 183 free-text descriptions, and they are consistent
// about one thing: most of them end on how the person SPEAKS. "Silky,
// flattering speech that hides a knife." "Sharp, dismissive put-downs."
// "Tough-talking with a thick accent." That last clause is the delivery, and it
// is what these markers read.

/**
 * Delivery markers, and how many of the 183 profiles each one matches.
 *
 * The count is not decoration — it is the WEIGHT. A marker matching 82 profiles
 * is weak evidence about anybody; one matching 7 is strong. Taking the rarest
 * match rather than the first turns a table that put 82 hosts on `warm` into
 * one whose largest group is 36, spread over twelve traits, with nothing above
 * a fifth of the cast. Same principle that unswallowed the lenses: rank by how
 * much a signal actually distinguishes somebody, never by declaration order.
 *
 * Re-measure with `npm run audit:social` after editing any pattern here.
 */
export const DELIVERY = {
  // trait: [pattern, profiles matched when last measured]
  mystical: [/mystic|spiritual|new-age|cosmic|aura|zen|hippie|dream|surreal|bizarre/, 5],
  // `criminal` because a CRIMINAL LAW STUDENT is not streetwise. The
  // count drifting from 7 to 8 was this and only this: Hasan is composed and
  // formal, reads as a lawyer because he is training to be one, and the word
  // that put him in a jersey-tough delivery bucket was his degree.
  streetwise: [/tough|street|jersey|scrapp|hardened|delinquent|rebel|punk|criminal(?! law)|thug/, 6],
  boastful: [/boast|arrogant|egotis|vain|self-obsessed|narcissis|cocky|braggart|conceited/, 9],
  excitable: [/excit|hyper|energetic|bubbly|manic|enthusiast|bouncy|eager|giddy/, 13],
  theatrical: [/dramat|theatric|flamboyan|over-the-top|melodram|diva|showman|grandiose|poetic|opera/, 14],
  sarcastic: [/sarcas|snark|sardonic|mocking|cynic|smug|smart-alec|wry|ironic/, 15],
  formal: [/formal|articulate|precise|analytic|intellect|scholar|clinical|methodical|polite|proper/, 15],
  nervous: [/nervous|anxious|timid|shy|stammer|panick|insecure|jitter|worrier|meek|fearful/, 17],
  deadpan: [/deadpan|dry |monoton|stoic|laconic|unbothered|nonchalant|apathetic|bored|flat /, 19],
  manipulative: [/manipulat|silky|flatter|charm|schem|slick|smooth|honey|calculat|cunning/, 24],
  blunt: [/blunt|brash|loud|aggressive|abrasive|no-nonsense|harsh|gruff|confrontational|bossy/, 43],
  warm: [/kind|sweet|warm|gentle|caring|nurtur|supportive|optimis|cheerful|friendly|earnest/, 80],
};

/**
 * Characters distinctive enough that a derived trait would flatten them.
 *
 * Deliberately short and deliberately allowed to grow. The point of the deriver
 * is that a new alumnus acquires a voice without anybody editing a file; the
 * point of this is that the handful of people whose whole appeal is HOW they
 * talk are not averaged into a category with forty others.
 */
export const VOICE_OVERRIDE = {
  Alejandro: 'manipulative',
  Chris: 'theatrical',
  Courtney: 'formal',
  Duncan: 'streetwise',
  Ezekiel: 'nervous',
  Heather: 'blunt',
  Izzy: 'excitable',
  Noah: 'sarcastic',
  Owen: 'warm',
  Scott: 'manipulative',
  Sierra: 'excitable',
  Dawn: 'mystical',
};

/**
 * Every delivery this description supports, strongest evidence first.
 *
 * A ranking rather than an answer, so an oversubscribed trait can hand somebody
 * their second-strongest voice instead of forty people sharing one.
 */
export function traitRanking(description, name = '') {
  const override = VOICE_OVERRIDE[name];
  const text = String(description || '').toLowerCase();
  const hits = Object.entries(DELIVERY)
    .filter(([, [re]]) => re.test(text))
    .sort((a, b) => a[1][1] - b[1][1])
    .map(([trait]) => trait);
  if (override) return [override, ...hits.filter(t => t !== override)];
  return hits;
}

/**
 * Who speaks how, across the whole panel.
 *
 * Capped the same way lenses are, and for the same reason: a trait is only
 * worth having if the people who hold it are not all holding it. `cap` is
 * derived from how much material the trait actually has, so writing more
 * constructions widens it without anybody touching this function.
 *
 * Somebody whose description says nothing about delivery gets no trait rather
 * than a guessed one, and falls back to the lens and general pools. A wrong
 * voice is louder than no voice.
 */
export function assignTraits(hosts, takes = TRAIT_TAKES) {
  const cap = new Map();
  for (const [trait, kinds] of Object.entries(takes)) {
    const lines = Object.values(kinds).reduce((n, arr) => n + arr.length, 0);
    cap.set(trait, Math.max(1, Math.round(lines / 8)));
  }
  const taken = new Map();
  const out = new Map();
  // Strongest claim first: an override or a rare marker should not lose its
  // trait to somebody who merely matched the same broad word later in the list.
  const order = [...(hosts || [])].sort((a, b) =>
    claimStrength(b, takes) - claimStrength(a, takes));
  for (const host of order) {
    const ranked = traitRanking(host.voice, host.name);
    const pick = ranked.find(t => !takes[t] || (taken.get(t) || 0) < cap.get(t)) || null;
    if (pick) taken.set(pick, (taken.get(pick) || 0) + 1);
    out.set(host.slug, pick);
  }
  return out;
}

/** How strong somebody's claim on their best trait is. Overrides outrank all. */
function claimStrength(host, takes) {
  if (VOICE_OVERRIDE[host?.name]) return 1000;
  const best = traitRanking(host?.voice, host?.name)[0];
  if (!best || !takes[best]) return 0;
  return 100 - (DELIVERY[best]?.[1] ?? 99);
}

// ─── the voices ────────────────────────────────────────────────────────────
//
// Complete sentences, in a voice, about a specific moment. Read a column down
// and it should sound like one person; read a row across and the same person
// should sound consistent from a nomination to a finale.
//
// `s` is the player, `w` the show's vocabulary (`w.vote`, `w.challenge`,
// `w.home`), so a construction reads correctly in either format.

export const TRAIT_TAKES = {
  // Short. Stops talking. The joke is that there is no joke.
  deadpan: {
    eviction: [
      ({ s }) => `${s} is gone. Everyone saw it coming except ${s}. That's the whole story.`,
      ({ s }) => `People are calling that shocking. It was scheduled.`,
      ({ s }) => `${s} played for eight weeks and lost in about four minutes. It happens.`,
      ({ s }) => `I have nothing kind to say, so: ${s} was there, and now ${s} isn't.`,
      ({ s }) => `${s} is out. I would say more but there's not more.`,
      ({ s }) => `Nine people spent a week deciding that. It took me one look.`,
      ({ s }) => `${s} made one friend too few. That's the entire post-mortem.`,
      ({ s }) => `Sad. Predictable. In that order, which is the wrong order.`,
    ],
    nomination: [
      ({ s, w }) => `${s} is ${w.onDanger}. ${s} will be fine or ${s} won't. Those are the options.`,
      ({ s }) => `Everybody is very worked up about a decision that took somebody nine seconds.`,
      ({ s }) => `The speech said "nothing personal". It's always personal.`,
      ({ s }) => `${s} looks calm. Calm isn't information.`,
      ({ s, w }) => `${s} ${w.nominated}. This is the part where everybody lies for two days.`,
      ({ s, w }) => `${w.Pawn}. Sure. Those come off the board first, but sure.`,
      ({ s }) => `The room is doing a lot of reassuring. Reassuring is free.`,
      ({ s }) => `${s} will campaign now. It rarely works. It has to be done anyway.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} won a ${w.challenge}. That buys a week. Weeks run out.`,
      ({ s }) => `Good for ${s}. Now the hard part, which is everything else.`,
      ({ s }) => `A win isn't a plan. People keep confusing those.`,
      ({ s, w }) => `${s} is better at ${w.challenge}s than at conversations. We will see which one this season rewards.`,
      ({ s }) => `${s} is safe. Everybody else got a week older.`,
      ({ s, w }) => `A ${w.challenge} was held and somebody won it. Riveting.`,
      ({ s }) => `${s} is happy. Give it six days.`,
      ({ s }) => `The celebration lasted longer than the safety will.`,
    ],
    blindside: [
      ({ s }) => `${s} didn't know. That's what the word means.`,
      ({ s }) => `Well executed. Everybody lied to ${s} competently. There's not much more to say.`,
      ({ s }) => `The face is the whole show. I've watched it three times.`,
      ({ s }) => `Nobody warned ${s}, which tells you what ${s} was worth to them.`,
      ({ s }) => `${s} asked if everything was fine. Everything wasn't fine.`,
      ({ s }) => `Four people kept a secret for a day. That's the record broken tonight.`,
      ({ s }) => `Somebody hugged ${s} at breakfast. Cold work. I respect it.`,
      ({ s }) => `${s} is confused. ${s} was confused a week ago too, quietly.`,
    ],
    finale: [
      ({ s }) => `${s} won. The jury voted. Those two facts are related, which is more than some finales manage.`,
      ({ s }) => `Congratulations to ${s}, and my condolences to everybody rehearsing a speech about it.`,
      ({ s }) => `I would've voted the same way. I'm not going to explain why at length.`,
      ({ s }) => `A good finale. Nobody needs me to add anything to it.`,
      ({ s }) => `${s} won. The confetti is proportionate to the achievement, roughly.`,
      ({ s }) => `Somebody had to. It was ${s}. Fine.`,
      ({ s }) => `Good speech. Short. I have opinions about the other one.`,
      ({ s }) => `A jury made a reasonable decision. Note the date.`,
    ],
    'episode-aired': [
      () => `An episode happened. Some of it was even about the game.`,
      () => `Forty minutes. Two of them mattered. Standard.`,
      () => `I enjoyed it. You can't tell, but I did.`,
      () => `That's the most anybody has said out loud all season and none of it was true.`,
      () => `Things occurred. Some of them to people who deserved it.`,
      () => `I watched all of it. I'm not going to pretend that was a choice.`,
      () => `Quiet week. Quiet weeks are where the damage gets done.`,
      () => `Nobody did anything. It was still better than last week.`,
    ],
  },

  // Long. Arrives at the point by way of feeling. Everything is an event.
  theatrical: {
    eviction: [
      ({ s }) => `I'm not FINE. ${s} walked out of that door and took the only person in there willing to say something interesting with ${s}.`,
      ({ s, w }) => `Let the record show that the ${w.home} lost its last real character tonight, and that every one of them clapped while it happened.`,
      ({ s }) => `A tragedy in three acts, and ${s} wrote every one of them personally.`,
      ({ s }) => `They will talk about that goodbye for years. I'll talk about it for weeks. It's the same instinct, scaled.`,
      ({ s }) => `Somebody fetch me a chair. ${s} — GONE — and not one of them had the decency to look ashamed.`,
      ({ s }) => `I've watched a hundred of these and I still put my hands over my face. ${s} deserved a better exit and got a truthful one.`,
      ({ s, w }) => `The ${w.home} will be quieter tomorrow and every single one of them will pretend that's a relief.`,
      ({ s }) => `A whole season of build, and it ends in eleven seconds of silence. Devastating. Perfect. I hate it.`,
    ],
    nomination: [
      ({ s, w }) => `${s} ${w.onDanger} — ${s}! — and we're all meant to sit here as though this is a normal Thursday.`,
      ({ s }) => `Somebody hand ${s} a monologue, because that speech deserved better staging than it got.`,
      ({ s, w }) => `${w.Danger} is a stage and ${s} has just been handed the only lighting cue that matters. Use it.`,
      ({ s }) => `I've seen quieter funerals. I've seen quieter WEDDINGS.`,
      ({ s }) => `The way ${s} sat down. The WAY ${s} sat down. Give that person an award and a blanket.`,
      ({ s, w }) => `${w.Ceremony} is the second act and nobody in that room has read the script.`,
      ({ s }) => `I gasped. Out loud. Alone. That's the review.`,
      ({ s }) => `${s} is going to make something enormous out of this or be flattened by it, and there's no third option.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} wins the ${w.challenge} and I'm on my feet in an empty room, which is where the best applause happens.`,
      ({ s }) => `THAT is a moment. Not a good performance — a MOMENT. There's a difference and ${s} just found it.`,
      ({ s, w }) => `Every season needs one ${w.challenge} that people describe to each other for a decade. This is that one.`,
      ({ s }) => `${s} didn't just win. ${s} performed winning, in front of the exact people who needed to watch it.`,
      ({ s }) => `SCENES. Absolute SCENES. ${s} has never looked more alive than in the last four seconds of that.`,
      ({ s, w }) => `Give me a slow motion replay and a string section, because that ${w.challenge} deserved both.`,
      ({ s }) => `${s} won and half that camp forgot to arrange their faces. I saw every one of them.`,
      ({ s }) => `I have goosebumps and I'm not embarrassed about a single one of them.`,
    ],
    blindside: [
      ({ s }) => `The GASP. The turn. The slow realisation crossing ${s}'s face like weather. I've not breathed since.`,
      ({ s }) => `Somebody looked ${s} in the eye, promised the world, and then delivered a masterpiece. I'm appalled. I'm delighted.`,
      ({ s }) => `That's not a blindside, that's a third-act reveal, and whoever staged it has been holding it for weeks.`,
      ({ s }) => `I'll be describing ${s}'s face to strangers for the rest of my life.`,
      ({ s }) => `The room went silent. ${s} turned. And the whole season split neatly into before and after.`,
      ({ s }) => `Somebody wrote that name down while holding ${s}'s hand. HOLDING ${s}'s HAND.`,
      ({ s }) => `I've not stopped pacing. This is why the show exists. This exact eleven seconds.`,
      ({ s }) => `A masterpiece, cruelly staged, beautifully timed, and I'll be defending it to strangers all week.`,
    ],
    finale: [
      ({ s }) => `${s}. Confetti. A jury that finally said the quiet thing out loud. Give me a moment, I'm genuinely emotional.`,
      ({ s }) => `Every season builds to somebody standing there stunned, and tonight it's ${s}, and I wouldn't swap it.`,
      ({ s }) => `The speech, the vote, the pause before the last name — perfect television, and I say that as somebody who has LIVED it.`,
      ({ s }) => `They gave it to ${s}, and they were right, and I intend to be insufferable about having said so.`,
      ({ s }) => `${s}! On the floor! In tears! And so am I, and I'm not even in the building!`,
      ({ s }) => `That last vote hung in the air for a full second and I aged a year inside it.`,
      ({ s }) => `A finale with a real question in it, and a jury brave enough to answer. Magnificent.`,
      ({ s }) => `I want the speech framed. I want the pause before it framed separately.`,
    ],
    'episode-aired': [
      () => `WHAT an hour. I've aged, I've recovered, I've aged again.`,
      () => `Some episodes are television. That one was THEATRE, and I'll not be taking questions.`,
      () => `I need everybody to understand that I watched that standing up.`,
      () => `An absolute circus and I wouldn't change a single ring of it.`,
      () => `I've been shouting at furniture for forty minutes and I regret nothing.`,
      () => `That wasn't an episode, that was an INCIDENT.`,
      () => `Somebody in there's having the season of their life and doesn't know it yet.`,
      () => `I need a lie down, a rewatch, and then another lie down.`,
    ],
  },

  // Says the thing. Does not soften it. Slightly enjoys not softening it.
  blunt: {
    eviction: [
      ({ s }) => `${s} played badly. Not unluckily. Badly. Somebody should say it.`,
      ({ s }) => `Everyone is being gracious about ${s}. I'm not going to be. That was avoidable from week two.`,
      ({ s }) => `${s} spent a month being everybody's second choice and acted surprised to be nobody's first.`,
      ({ s }) => `Good riddance, strategically. That's not personal. It's just true.`,
      ({ s }) => `${s} got outplayed by people who aren't that good. That should sting more than a blindside.`,
      ({ s }) => `A month of hedging and ${s} ends up with nobody willing to spend a vote. Predictable.`,
      ({ s }) => `Everybody in there knew for three days. ${s} was the only one not asking.`,
      ({ s, w }) => `You can't be everyone's friend and expect a ${w.vote} to go your way. Pick one.`,
    ],
    nomination: [
      ({ s }) => `Put ${s} up and then look ${s} in the face while you say why. Anything else is cowardice with a microphone.`,
      ({ s }) => `That was a weak call and everybody in that room knows it, including the person who made it.`,
      ({ s, w }) => `${s} isn't ${w.pawn}. ${s} is a target with better manners applied to it.`,
      ({ s }) => `If you're going to do it, do it. The apology tour afterwards fools nobody.`,
      ({ s }) => `Name the threat. Every week somebody names the polite option and every week it costs them.`,
      ({ s }) => `${s} is being handled, not targeted. ${s} should be insulted enough to do something about it.`,
      ({ s }) => `That speech was six sentences of nothing. Say the name and sit down.`,
      ({ s }) => `Half that room agreed to this and none of them will admit it tomorrow.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} won because ${s} wanted it more. People hate that explanation because it's the one they can't copy.`,
      ({ s }) => `Stop calling it luck. ${s} was better tonight. Say the sentence.`,
      ({ s, w }) => `One ${w.challenge} doesn't make ${s} a threat. Six do. Count.`,
      ({ s }) => `${s} needed that and got it. Now stop celebrating and go do the hard part.`,
      ({ s, w }) => `Winning a ${w.challenge} is the easy half. ${s} has been failing the other half all season.`,
      ({ s }) => `${s} is now the biggest name on the board. Act like it or lose it.`,
      ({ s }) => `Everyone clapping for ${s} was doing arithmetic while they clapped.`,
      ({ s }) => `Good. Now do it again next week, because one is a story and two is a problem.`,
    ],
    blindside: [
      ({ s }) => `${s} got lied to for a week straight and never once checked. That's on ${s}.`,
      ({ s }) => `Clean work. Brutal, and clean. Those are usually the same thing.`,
      ({ s }) => `Everybody wants to blindside somebody and nobody wants to be the one who says the name out loud. Somebody did tonight.`,
      ({ s }) => `${s} trusted people who had no reason to be trustworthy. Don't call that a betrayal, call it arithmetic.`,
      ({ s }) => `${s} had two people telling ${s} the truth and picked the third. Own that.`,
      ({ s }) => `That wasn't clever. It was just done, which is more than most of them manage.`,
      ({ s }) => `Nobody owes ${s} a warning. Get better at asking.`,
      ({ s }) => `The people apologising tonight are the ones who wrote the name. Spare me.`,
    ],
    finale: [
      ({ s }) => `${s} won it. Anybody arguing otherwise didn't watch the same season I did.`,
      ({ s }) => `The jury got it right. It doesn't happen often enough to go unmentioned.`,
      ({ s }) => `Say what you like about ${s}. ${s} sat down, made a case, and didn't flinch. That's the job.`,
      ({ s }) => `Bitter jury nonsense. ${s} played the better game and everybody spent the night pretending not to know it.`,
      ({ s }) => `${s} made the moves. Everybody else made friends. Only one of those is the game.`,
      ({ s }) => `Anybody voting on feelings tonight should say so out loud instead of dressing it up.`,
      ({ s }) => `${s} won and didn't apologise for it. Finally.`,
      ({ s }) => `Second place gave the better speech. First place gave the better season. Those aren't the same prize.`,
    ],
    'episode-aired': [
      () => `Half that camp is playing scared and it's starting to show on screen.`,
      () => `Everybody is very busy being likeable. Somebody go and win something.`,
      () => `That was a lot of talking and almost no deciding.`,
      () => `Good episode. Terrible players. Both things.`,
      () => `Nobody in that camp wants to be the one holding the knife and it's making the whole season slow.`,
      () => `Stop managing each other and go play.`,
      () => `A lot of significant looks. Very few significant decisions.`,
      () => `Somebody needs to lose their temper in there before this gets boring.`,
    ],
  },

  // Builds the case before stating it. Precise about what is and is not known.
  formal: {
    eviction: [
      ({ s, w }) => `The decisive factor was not tonight's ${w.vote} but the one three weeks ago, where ${s} accepted a position ${s} never renegotiated.`,
      ({ s }) => `Three separate people had reason to remove ${s} and only one of them needed to act. That is what an untenable position looks like.`,
      ({ s }) => `I would distinguish between being outplayed and being outnumbered. ${s} was outnumbered, which is a different failure and a curable one.`,
      ({ s }) => `${s} misread influence for security. They are correlated and they are not the same, and the gap is exactly where this happened.`,
      ({ s }) => `${s} was removed by a coalition that did not exist ten days ago. The speed of its assembly is the finding here.`,
      ({ s, w }) => `On the record ${s} survived four ${w.vote}s. On the evidence ${s} was never once genuinely safe in any of them.`,
      ({ s }) => `I would resist the word betrayal. Nobody promised ${s} anything specific enough to break.`,
      ({ s }) => `The relevant error is sequencing. ${s} made the right move roughly a week after it would have worked.`,
    ],
    nomination: [
      ({ s }) => `Two readings are available. Either ${s} is the target, or ${s} is the instrument for finding out who defends ${s}. The next day resolves it.`,
      ({ s }) => `The stated reason and the operative reason are rarely identical. I would weigh whose name was NOT said more heavily than who was.`,
      ({ s }) => `Placing ${s} there costs the decision-maker a relationship and buys information. Whether that is a good trade depends on facts we do not have yet.`,
      ({ s }) => `Naming somebody is a public act. Read it for what it commits the author to, not for what it says about ${s}.`,
      ({ s }) => `Consider the counterfactual: had ${s} not been named, who would have been, and what does that name cost the same person?`,
      ({ s }) => `${s} is a low-risk name, which is precisely the objection to it. Low risk usually means low return.`,
      ({ s }) => `The speech contained one verifiable claim and four sentiments. I would examine the claim.`,
      ({ s }) => `This tells us more about the fears of whoever chose than about ${s}'s standing.`,
    ],
    'comp-win': [
      ({ s, w }) => `A ${w.challenge} win converts to safety immediately and to a target gradually. ${s} has bought one week and spent some of a later one.`,
      ({ s }) => `The timing is more interesting than the result. Winning this particular week forces ${s} to make a decision ${s} was avoiding.`,
      ({ s }) => `I would not overweight this. One result is a data point; the pattern across the season is the argument.`,
      ({ s, w }) => `${s} now has a résumé item. Résumé items are assets at a finale and liabilities before one.`,
      ({ s, w }) => `${s} has now won at a rate well above what the field would predict. At some point that stops being variance.`,
      ({ s }) => `Safety this week costs ${s} deniability next week. That is the trade and I am not sure ${s} has priced it.`,
      ({ s, w }) => `Note that ${s} won without needing it. Winning from safety is a different signal to winning from ${w.danger}.`,
      ({ s, w }) => `The interesting question is not who won the ${w.challenge} but who chose not to compete seriously.`,
    ],
    blindside: [
      ({ s }) => `For this to work, at least four people had to hold the same lie for a full day without a single leak. That is the achievement, not the vote.`,
      ({ s }) => `${s} had the information available and did not act on it. I want to be careful: that is a failure of interpretation, not of access.`,
      ({ s }) => `The tell was the politeness. Groups become courteous immediately before they do something they know is unkind.`,
      ({ s }) => `Note who did not look surprised. That is a shorter list than the one currently being circulated.`,
      ({ s }) => `Three conditions had to hold simultaneously for this. Two were fragile. It is a better operation than its result suggests.`,
      ({ s }) => `${s} performed a check and accepted a denial. A denial is not evidence; it is the absence of one.`,
      ({ s }) => `I would date the decision to two days ago, on the balance of who stopped speaking to whom.`,
      ({ s }) => `The cost is not the vote, it is that every remaining promise in that camp is now worth measurably less.`,
    ],
    finale: [
      ({ s }) => `The case for ${s} rests on three defensible moves and one relationship nobody else could have maintained. That is a sufficient argument.`,
      ({ s }) => `Juries reward legibility. ${s} made a game that could be explained in two minutes, which is not the same as the best game, but it is the one that wins.`,
      ({ s }) => `I would separate the result from the reasoning. ${s} deserved it; some of the votes cast for ${s} were reached by poor logic.`,
      ({ s }) => `A narrow verdict is not a weak one. It means the season posed a genuine question.`,
      ({ s }) => `Reduced to its parts: ${s} controlled two decisions, survived one and explained all three. Juries reward the third.`,
      ({ s }) => `The dissenting votes were coherent. I disagree with them and I would not call them bitter.`,
      ({ s }) => `${s} won on a case built weeks before there was a jury to hear it. That is the whole method.`,
      ({ s }) => `A result this narrow suggests the season posed a real question rather than a decorated one.`,
    ],
    'episode-aired': [
      () => `A structurally important episode with very little visible drama. Those are usually the ones worth rewatching.`,
      () => `Two alliances are now describing the same plan in incompatible terms. That resolves badly, and soon.`,
      () => `The edit is telling us less than usual, which I take as significant in itself.`,
      () => `Nothing tonight changed the standings. Several things changed what next week can be.`,
      () => `Two people are now operating on incompatible readings of the same conversation. That resolves within the week.`,
      () => `Very little happened and a great deal was arranged. Those are different and only one shows up on screen.`,
      () => `I would flag the seating. It has changed twice in three episodes and it changes before votes do.`,
      () => `An episode of positioning. Positioning is boring to watch and decisive to have done.`,
    ],
  },

  // Kind first, and the read arrives inside the kindness rather than after it.
  warm: {
    eviction: [
      ({ s }) => `I hope ${s} knows how many people in there liked ${s}. It didn't save ${s}, and it still mattered.`,
      ({ s }) => `That's a hard way to go out and ${s} handled it better than I did when it was me.`,
      ({ s, w }) => `${s} lost the ${w.vote}, not the room. Those look identical tonight and they won't in a month.`,
      ({ s }) => `Everybody wants to talk about the mistake. I want to talk about ${s} hugging the person who made it happen. That took something.`,
      ({ s }) => `${s} thanked people on the way out. After that. I don't know that I could have.`,
      ({ s }) => `Somebody in there's going to cry about this tonight and it won't be ${s}.`,
      ({ s, w }) => `${s} was good to people who could do nothing for ${s}. The ${w.vote} doesn't measure that and it still counts.`,
      ({ s }) => `Hard week. ${s} kept turning up for other people anyway, right to the end.`,
    ],
    nomination: [
      ({ s }) => `${s} is going to be fine. Not safe — fine. There's a difference and it gets you through the day.`,
      ({ s }) => `The worst part of that seat isn't the danger, it's being talked about in the third person while you're standing there.`,
      ({ s }) => `Whoever hugged ${s} afterwards did more for that week than any speech.`,
      ({ s }) => `I would tell ${s}: the people avoiding eye contact are the ones to talk to. They're avoiding it for a reason.`,
      ({ s }) => `${s} is scared and pretending not to be, and everybody can tell, and nobody is going to say so kindly.`,
      ({ s, w }) => `It's lonely being the name, in a ${w.home} full of people. That's the part nobody warns you about.`,
      ({ s }) => `${s} has one real friend in there. One is enough if ${s} actually uses it.`,
      ({ s }) => `Whoever sat with ${s} tonight without saying anything did the most useful thing all week.`,
    ],
    'comp-win': [
      ({ s, w }) => `Watching ${s} realise ${s} had actually won that ${w.challenge} was the best thing in the episode.`,
      ({ s }) => `${s} needed that. Not strategically — ${s} needed to believe ${s} belonged there, and now ${s} does.`,
      ({ s }) => `Look at who congratulated ${s} first. That's worth more to ${s} this week than the safety is.`,
      ({ s }) => `A win changes how somebody carries themselves for days. That's the part people underrate.`,
      ({ s }) => `${s} has been quietly having an awful time and needed exactly this. Look at ${s}.`,
      ({ s, w }) => `The best bit of that ${w.challenge} was ${s} checking on the person who came last.`,
      ({ s }) => `${s} won and apologised to the room. Never apologise for a good week, but I understand why ${s} did.`,
      ({ s }) => `Confidence is contagious in there. ${s} just handed some to three other people without noticing.`,
    ],
    blindside: [
      ({ s }) => `Brilliant move, and I'm still allowed to feel awful for ${s}. Both of those are true at once.`,
      ({ s }) => `${s} trusted people. I'm never going to be able to call that a mistake, even when it costs somebody the game.`,
      ({ s }) => `The hardest part isn't the vote. It's realising the conversation that morning was already a goodbye.`,
      ({ s }) => `Somebody in that room is going to feel sick about this for a week, and they should, and it was still the right play.`,
      ({ s }) => `That was very well played and I still had to look away when ${s} understood.`,
      ({ s }) => `${s} spent the morning defending the person who wrote ${s}'s name down. I'll be thinking about that for a while.`,
      ({ s }) => `Nobody in there enjoyed that as much as they're pretending to.`,
      ({ s }) => `${s} will forgive them. That's not weakness, and it will make the jury phase interesting.`,
    ],
    finale: [
      ({ s }) => `${s} won and the first thing ${s} did was look for the people who got ${s} there. That's who ${s} has been all season.`,
      ({ s }) => `A good winner. Not a flawless game — a good WINNER, which the show needs more than it admits.`,
      ({ s }) => `Everybody on that jury had a reason to be bitter and they voted honestly anyway. That's rarer than the win.`,
      ({ s }) => `I'm happy for ${s}, and I'm happy for the runner-up, and I'm aware that makes me useless as an analyst.`,
      ({ s }) => `${s} won and thanked the people who lost to ${s}. That's how you leave with everything.`,
      ({ s }) => `Nobody on that jury voted out of spite tonight. After that season. I'm genuinely moved.`,
      ({ s }) => `Both of them played hard and neither one turned cruel about it. That's rarer than the trophy.`,
      ({ s }) => `${s} deserved it and so did the person who didn't get it. Finales are unfair like that.`,
    ],
    'episode-aired': [
      () => `A lot of people had a hard night in there and mostly took care of each other. That's not nothing.`,
      () => `Genuinely lovely episode underneath all the scheming, if you were watching for it.`,
      () => `Whoever is doing the quiet reassuring in that camp is running the place and doesn't know it.`,
      () => `You could see the exhaustion tonight. They're further into this than the edit suggests.`,
      () => `They're tired. You can hear it in how carefully everybody is talking to each other.`,
      () => `Somebody made somebody else laugh tonight for the first time in about a week. That matters in there.`,
      () => `A lot of small kindnesses in an episode that will be remembered for one argument.`,
      () => `Whoever is holding that camp together isn't going to get any credit for it, as usual.`,
    ],
  },

  // Compliments that are load-bearing. Reads everything as a manoeuvre.
  manipulative: {
    eviction: [
      ({ s }) => `Beautifully done, and I mean by whoever kept smiling at ${s} right up to the ${'vote'}. That's the skill nobody credits.`,
      ({ s }) => `${s} was lovely to everybody and gave nobody a reason to need ${s}. Warmth isn't currency unless you charge for it.`,
      ({ s }) => `The eulogies in there are all being delivered by people who wrote the plan. Watch who is enjoying this quietly.`,
      ({ s }) => `${s} is going to spend the jury phase deciding who lied kindly. Kindly matters enormously and almost nobody plans for it.`,
      ({ s }) => `${s} left believing three separate people were on ${s}'s side. All three voted. That's craftsmanship.`,
      ({ s }) => `The trick isn't getting the votes. It's making sure ${s} thanks you on the way out, and somebody managed it.`,
      ({ s }) => `${s} was useful right up to the moment ${s} was expensive. That's a shorter window than people plan for.`,
      ({ s }) => `Now watch who visits ${s} in the jury. That visit is worth more than tonight was.`,
    ],
    nomination: [
      ({ s, w }) => `Calling ${s} ${w.pawn} is doing more work than the danger is. Give a threat a friendly name and people stop checking it.`,
      ({ s }) => `The seat isn't the move. Watching who comforts ${s} tonight is the move.`,
      ({ s }) => `Whoever made that decision wants to be liked for it, which means ${s} has leverage and about a day to notice.`,
      ({ s, w }) => `I would let ${s} panic slightly. Somebody frightened tells you every alliance in ${w.home} by lunchtime.`,
      ({ s }) => `Nominate somebody and then comfort them. It costs nothing and it buys a week of gratitude.`,
      ({ s }) => `${s} is the excuse, not the plan. The plan was making the room comfortable with a name being said out loud.`,
      ({ s }) => `The best of these look like favours. This one nearly does.`,
      ({ s }) => `Everybody is watching ${s}. That's the point. Nobody is watching the person who suggested it.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} won and immediately started apologising for it. That instinct is worth more than the ${w.challenge}.`,
      ({ s }) => `The clever thing now is for ${s} to look mildly embarrassed about it for two days. Nobody targets a winner who seems surprised.`,
      ({ s }) => `A win is a spotlight, and ${s} has never once been comfortable in one. Watch what ${s} gives away this week.`,
      ({ s }) => `Everybody is congratulating ${s}. Half of them started counting the moment ${s} crossed the line.`,
      ({ s, w }) => `A ${w.challenge} win is a receipt. ${s} should be very careful who gets to read it.`,
      ({ s }) => `${s} should lose the next one on purpose and won't, and that's how this ends.`,
      ({ s }) => `Notice who offered ${s} a deal within the hour. Speed like that means it was written beforehand.`,
      ({ s, w }) => `The win is fine. The victory lap is what puts ${s} ${w.onDanger} in nine days.`,
    ],
    blindside: [
      ({ s }) => `Whoever ran that kept ${s} warm right to the end. Cold blindsides get found; warm ones don't.`,
      ({ s }) => `The lie wasn't the achievement. Keeping four people from enjoying the lie in front of ${s} — that's the achievement.`,
      ({ s }) => `${s} asked the right question and accepted the first comfortable answer. It happens to everybody exactly once.`,
      ({ s }) => `Now the delicate part: whoever did it has to be sad about it convincingly for about six hours.`,
      ({ s }) => `Nobody flinched at breakfast. Getting four people to eat calmly next to ${s} is harder than getting the votes.`,
      ({ s }) => `${s} was given a small true thing to hold so ${s} wouldn't go looking for the large false one.`,
      ({ s }) => `Beautiful. Slightly greedy at the end, when somebody couldn't resist watching ${s}'s face.`,
      ({ s }) => `The apology tomorrow needs to be shorter than people think. Long apologies read as guilt.`,
    ],
    finale: [
      ({ s }) => `${s} won because ${s} let other people describe ${s}'s game for ${s}, all season, to the exact right audience.`,
      ({ s }) => `Owning the cut is the whole trick. Deny it and a jury smells it; own it warmly and they call it respect.`,
      ({ s }) => `Every vote for ${s} was set up weeks before anybody was on a jury. That's not luck, that's scheduling.`,
      ({ s }) => `A jury doesn't reward the best game. It rewards the game it was told about most flatteringly, by the person it liked.`,
      ({ s }) => `${s} spent the season making other people feel clever. A jury remembers how you made it feel, not what you did.`,
      ({ s }) => `Two votes there were bought in week four and didn't know it until tonight.`,
      ({ s }) => `${s} named the betrayals before the jury could. You can't be exposed by something you have already confessed.`,
      ({ s }) => `The runner-up argued the record. ${s} argued the relationships. Only one of those is on the ballot.`,
    ],
    'episode-aired': [
      () => `Everybody in there's being extremely nice to each other, which is how you know.`,
      () => `Two people had the same conversation with three different people tonight and only one of them realised it.`,
      () => `The person doing the least on screen is having the best week. That's almost always how it goes.`,
      () => `Somebody made a promise tonight they've no intention of keeping, and they made it beautifully.`,
      () => `Somebody said “I trust you” three times tonight. Nobody says that when it's true.`,
      () => `The quiet one is doing very well and would like you to keep not mentioning it.`,
      () => `Two alliances think they own the same person. That person knows.`,
      () => `An entire episode of people being reassured. Reassurance is what you offer instead of information.`,
    ],
  },
  // Hedges, doubles back, apologises for having an opinion at all — and is
  // usually right, which is the joke.
  nervous: {
    eviction: [
      ({ s }) => `I don't want to speak badly of ${s}, and I think — sorry — I think ${s} knew, and went anyway. Which is worse?`,
      ({ s }) => `Is it awful that I saw that coming? I didn't say anything. I should have said something.`,
      ({ s }) => `${s} asked me once what I would do in that spot and I gave a useless answer, and I've thought about it ever since.`,
      ({ s, w }) => `Everybody is fine about the ${w.vote} and I'm not fine about the ${w.vote}, which probably says more about me.`,
      ({ s }) => `I keep going back to the morning. ${s} was already alone by then and nobody, including me, would've noticed.`,
      ({ s }) => `Sorry — one more thing — ${s} thanked them. On the way out. I couldn't have done that.`,
      ({ s }) => `Maybe it was always going to happen. I would like to believe that. I don't entirely.`,
      ({ s }) => `I've been in that exact chair and I promise the worst part isn't the ${'vote'}, it's the four hours before it.`,
    ],
    nomination: [
      ({ s }) => `Oh, that's going to sit badly. Not the ceremony — the way nobody looked at ${s} afterwards.`,
      ({ s }) => `I would be spiralling. ${s} isn't spiralling, apparently, which I find slightly alarming.`,
      ({ s }) => `The word they're using for ${s} is doing a lot of damage in there and I don't think anybody means it unkindly, which is the problem.`,
      ({ s }) => `Sorry, can I say something? ${s} hasn't asked a single person what happened. That's not calm. That's frozen.`,
      ({ s }) => `Everybody says don't campaign too hard. I campaigned too hard. I also survived, so.`,
      ({ s }) => `I hate this bit. Two days of everybody being kind to somebody they've already decided about.`,
      ({ s }) => `${s} should talk to the quiet one. It's always the quiet one and nobody ever does.`,
      ({ s }) => `Is it me or has that room gone very polite? It goes polite before it goes badly.`,
    ],
    'comp-win': [
      ({ s, w }) => `Oh good — no, genuinely good, ${s} needed that. I think ${s} needed it more than the ${w.challenge} was worth.`,
      ({ s }) => `I was holding my breath and I'm not even in there. Sorry.`,
      ({ s }) => `${s} looked shocked. I always looked shocked. It reads as modesty and it's really just relief.`,
      ({ s }) => `The dangerous part starts now, doesn't it. Everybody knows ${s} can do it.`,
      ({ s }) => `I would spend this week apologising to people and that's exactly the wrong instinct, and I would do it anyway.`,
      ({ s, w }) => `A ${w.challenge} win buys a week. It doesn't buy a conversation, and the conversation is the hard bit.`,
      ({ s }) => `Sorry — did anybody else notice ${s} check on the person who came last? That's the whole person, right there.`,
      ({ s }) => `I'm pleased and I'm also worried, which is my entire personality, I'm aware.`,
    ],
    blindside: [
      ({ s }) => `Oh no. Oh, that's — no. ${s} said good morning to every one of them.`,
      ({ s }) => `I feel sick, actually. Well played, obviously. I still feel sick.`,
      ({ s }) => `The thing is ${s} did ask. ${s} asked and somebody looked ${s} in the face and said it was fine.`,
      ({ s }) => `Is that allowed? I know it's allowed. I mean is it — you know what I mean.`,
      ({ s }) => `I would never have the nerve. I would've told ${s} at lunch and ruined the whole thing.`,
      ({ s }) => `Somebody in that room is going to lie awake tonight and I don't think it's going to be ${s}.`,
      ({ s }) => `Sorry, I need a second. That was a very good move and I hated watching it.`,
      ({ s }) => `${s} will be replaying the last three days for a month. I still replay mine.`,
    ],
    finale: [
      ({ s }) => `${s} won and I burst into tears, which is embarrassing, and I'm not going to pretend otherwise.`,
      ({ s }) => `I thought the other one had it. I've thought that about six finales and been wrong about five.`,
      ({ s }) => `That jury was kinder than I expected. I don't know why I expected worse. Experience, probably.`,
      ({ s }) => `Sorry — the pause before the last vote. Did anybody else stop breathing, or.`,
      ({ s }) => `${s} said thank you to the person ${s} beat. That's the bit I'll remember.`,
      ({ s }) => `I would've frozen up there. ${s} didn't. That's a skill nobody puts on a résumé.`,
      ({ s }) => `It was close and I think it should have been close, if that makes sense.`,
      ({ s }) => `Everybody will argue about this for a week and I would just like to say ${s} was lovely to me once.`,
    ],
    'episode-aired': [
      () => `That was a lot. Sorry. That was just a lot.`,
      () => `Is anybody else worried about how quiet it has gone in there? No? Just me.`,
      () => `I laughed and then I felt bad for laughing, which is most weeks, honestly.`,
      () => `Something is going to happen. I can't tell you what. It's the flatness.`,
      () => `They're tired. You can hear it. Nobody is finishing their sentences.`,
      () => `I don't want to say I told you so, mostly because I didn't tell anybody.`,
      () => `Sorry — small thing — nobody has mentioned the one in the corner for three episodes.`,
      () => `I enjoyed that and now I'm anxious, which is the show working, I suppose.`,
    ],
  },

  // Arrives mid-thought and stays there. Punctuation is optional; volume is not.
  excitable: {
    eviction: [
      ({ s }) => `NO. NO no no not ${s}, I had a whole thing planned for ${s}, I had CHARTS`,
      ({ s }) => `okay okay okay so ${s} is gone and I'm NOT okay and I need everybody to know that`,
      ({ s, w }) => `THAT ${w.vote}?? after all that?? I was screaming, my neighbours heard, it's fine`,
      ({ s }) => `i genuinely thought ${s} had it, i said so out loud, to a room with nobody in it`,
      ({ s }) => `the way ${s} just STOOD there. i am going to be thinking about that all night. ALL NIGHT.`,
      ({ s }) => `who did this. WHO. i need names and i need them in an order i can be angry about`,
      ({ s }) => `${s} was my whole season?? and now what?? what do i DO`,
      ({ s }) => `honestly incredible television and also i am furious, both, at the same time, constantly`,
    ],
    nomination: [
      ({ s }) => `${s} IN TROUBLE. i am not calm. why is everybody else calm`,
      ({ s }) => `ok but did you SEE the face ${s} made, the little one, right at the end, i rewound it four times`,
      ({ s }) => `this is the best thing to happen all season and it has been on screen for nine seconds`,
      ({ s }) => `NOT the speech. not the SPEECH. i have secondhand everything right now`,
      ({ s }) => `${s} is going to win the whole thing off this, calling it, screenshot me, PLEASE screenshot me`,
      ({ s }) => `everybody in that room is lying and i love every single one of them for it`,
      ({ s }) => `i can't BELIEVE they did it in front of everyone. in FRONT of everyone!!`,
      ({ s, w }) => `${w.ceremony} is my christmas and nobody can take that from me`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} WON. ${s} WON THE ${w.challenge.toUpperCase()}. i am on the floor, i am unwell, this is amazing`,
      ({ s }) => `SEE. i said. i SAID. nobody listened and now look`,
      ({ s }) => `the last ten seconds of that i had my hands over my eyes like a coward, worth it, so worth it`,
      ({ s }) => `okay so now everybody is scared of ${s} and honestly? they should be? finally??`,
      ({ s }) => `i have watched that finish six times and it gets BETTER, how does it get better`,
      ({ s }) => `${s} did the little celebration!! the one from week two!! CALLBACK!!`,
      ({ s }) => `nobody tell ${s} how big a target this makes ${s}. let ${s} have tonight. LET ${s} HAVE TONIGHT`,
      ({ s }) => `that was so good i forgot to be worried and i am ALWAYS worried`,
    ],
    blindside: [
      ({ s }) => `I AM SCREAMING. the turn!! the little turn ${s} did!! i can't`,
      ({ s }) => `they LIED. to ${s}. at BREAKFAST. and then they DID IT. this show is insane and i love it`,
      ({ s }) => `okay everybody stop what you're doing and rewatch the last forty seconds, i will wait`,
      ({ s }) => `i knew, i KNEW, no i didn't know, i am lying, nobody knew, that's the POINT`,
      ({ s }) => `not ${s} saying "we're good" nine minutes before. NOT ${s} SAYING WE'RE GOOD.`,
      ({ s }) => `best blindside in years and i will be insufferable about it until somebody stops me`,
      ({ s }) => `my hands are actually shaking?? over a game show?? and i would do it again??`,
      ({ s }) => `whoever planned that's either a genius or a menace and i need to know which immediately`,
    ],
    finale: [
      ({ s }) => `${s}!!!!! ${s} WON!!!!! i have been saying this since episode one and NOBODY believed me`,
      ({ s }) => `the confetti!! the FACE!! i am crying, real crying, over confetti`,
      ({ s }) => `that final vote pause took a YEAR off my life and i would pay it again`,
      ({ s }) => `okay both of them were amazing and i refuse to be normal about either of them`,
      ({ s }) => `${s} did the speech and i just sat here going yes YES yes at a screen`,
      ({ s }) => `best finale in ages and i am already sad it's over, immediately, instantly sad`,
      ({ s }) => `i love ${s} i love the runner up i love the jury i love EVERYONE, sorry, i am emotional`,
      ({ s }) => `screenshot my old posts. SCREENSHOT THEM. i called this and nobody clapped`,
    ],
    'episode-aired': [
      () => `WHAT an episode, what a WEEK, what a SHOW, i need to go outside`,
      () => `okay who else watched that twice because i watched that twice`,
      () => `there's a thing brewing in there and NOBODY is talking about it and it's driving me insane`,
      () => `forty minutes went by in nine seconds, explain that, somebody explain that`,
      () => `i have three theories and two of them are unhinged and one of them is RIGHT`,
      () => `the edit is doing something. THE EDIT IS DOING SOMETHING. i can feel it`,
      () => `nothing happened and i still had the time of my life, what is wrong with me`,
      () => `next week is going to be carnage and i am so ready, so so ready`,
    ],
  },

  // Every moment is an opportunity to mention their own season, and they take it.
  boastful: {
    eviction: [
      ({ s }) => `${s} made the mistake I never made: getting comfortable. I was never comfortable. That is why I am still talked about.`,
      ({ s, w }) => `I survived six ${w.vote}s in a row. ${s} could not survive one, and the difference is not luck, whatever ${s} says afterwards.`,
      ({ s }) => `People forget I was in that exact position and turned it around inside a day. It can be done. It just is not done often.`,
      ({ s }) => `A shame. ${s} had potential — not my kind, obviously, but potential.`,
      ({ s }) => `If ${s} had watched my season properly this would not have happened. I am being serious.`,
      ({ s }) => `They will study this vote. They study mine. There is a difference in what they conclude.`,
      ({ s }) => `I called this three weeks ago, on record, and nobody wants to bring that up now.`,
      ({ s }) => `I would have seen it coming. That is not arrogance. That is just an accurate description of my game.`,
    ],
    nomination: [
      ({ s, w }) => `I was named four times and survived three of the ${w.vote}s that followed. ${s} has one shot at looking like that.`,
      ({ s }) => `Being the name is only frightening if you have never worn it well. I wore it beautifully.`,
      ({ s }) => `${s} should be flattered. Nobody spends a name on somebody who does not matter — I would know, mine came up constantly.`,
      ({ s }) => `That speech was fine. Mine were better. Ask anybody who was in the room.`,
      ({ s }) => `I would have turned this into a whole week of leverage. ${s} will turn it into two apologies and a nap.`,
      ({ s, w }) => `Being ${w.pawn} is a choice. I was never that. Not once, in three seasons.`,
      ({ s }) => `The trick is looking bored up there. I invented looking bored up there.`,
      ({ s }) => `${s} has my sympathy, which is worth quite a lot given my record.`,
    ],
    'comp-win': [
      ({ s, w }) => `Good win. Not a great one — I have won that ${w.challenge} format twice, and faster.`,
      ({ s }) => `${s} is celebrating like it is the first one. It is the first one. That is the difference between us.`,
      ({ s }) => `I remember that feeling. I had it a lot. Genuinely, a lot.`,
      ({ s, w }) => `One ${w.challenge} is a night. A résumé is a season. I would know which one I built.`,
      ({ s }) => `Everybody is very impressed. I am mildly impressed, which from me is enormous.`,
      ({ s }) => `${s} needed that. I never needed one, which people find irritating and cannot dispute.`,
      ({ s }) => `The technique was sloppy and it worked, and I have been on both sides of that sentence.`,
      ({ s }) => `Enjoy it. The week after your first win is the hardest week there is. I handled it. Most do not.`,
    ],
    blindside: [
      ({ s }) => `Nobody has ever blindsided me. I want that on the record before we discuss ${s}.`,
      ({ s }) => `Competent. Not elegant. I ran one of these that people still bring up unprompted.`,
      ({ s }) => `${s} should have been counting. I counted every single day. Every day.`,
      ({ s }) => `That is roughly my move from season four with the timing softened, and I do not mind saying so.`,
      ({ s }) => `Whoever built that has talent. Not my level. Talent.`,
      ({ s }) => `The face is good television. Mine was better, and I was not even the one going home.`,
      ({ s }) => `You cannot be shocked if you are paying attention. I was famously always paying attention.`,
      ({ s }) => `Ask ${s} in a month whether ${s} had the information. ${s} had the information.`,
    ],
    finale: [
      ({ s }) => `${s} won, and good for ${s}. Different era, different standard, but good for ${s}.`,
      ({ s }) => `That jury asked easier questions than mine did. Considerably easier.`,
      ({ s }) => `A fine résumé. Mine had two more of everything and I still had to fight for it.`,
      ({ s }) => `${s} gave a good speech. I gave a famous one. Those are not the same thing.`,
      ({ s }) => `People will compare this to my finale. Let them. I am comfortable.`,
      ({ s }) => `I picked ${s} in week two, publicly, and I would like that noted somewhere permanent.`,
      ({ s }) => `Winning is the easy part. Being remembered is the hard part, and we shall see.`,
      ({ s }) => `Congratulations to ${s} on joining a very small club that I have been in for some time.`,
    ],
    'episode-aired': [
      () => `Nobody in that camp is playing at the level I played at. I am not being unkind, it is just visible.`,
      () => `I said this would happen. I say a lot of things and they mostly happen.`,
      () => `A slow week. My seasons did not have slow weeks, largely because of me.`,
      () => `They are all so careful. Careful never got anybody a statue.`,
      () => `I would be running that place inside four days. Three, if the food was good.`,
      () => `Somebody in there is trying my strategy and doing it at about sixty per cent.`,
      () => `Entertaining enough. It is not what it was, and I say that as somebody who was there when it was.`,
      () => `Ask me next week and I will have been right about this too.`,
    ],
  },

  // Asks questions it does not want answered. Praise, delivered as an autopsy.
  sarcastic: {
    eviction: [
      ({ s }) => `A stunning turn of events, if you had somehow avoided watching any of the previous three episodes.`,
      ({ s }) => `${s} played a beautiful game, right up until the part where anybody had to vote.`,
      ({ s, w }) => `Nine people, one ${w.vote}, zero surprises, and yet somehow forty minutes of tension. Remarkable editing.`,
      ({ s }) => `Wonderful goodbye speech. Deeply moving. Changed absolutely nothing.`,
      ({ s }) => `So we have all agreed to pretend nobody knew? Lovely. I'll play along.`,
      ({ s }) => `${s} trusted the group. Bold. Innovative, even. Nobody has ever tried that before.`,
      ({ s }) => `And the people who did it are devastated, obviously. You can tell by the smiling.`,
      ({ s }) => `Congratulations to everyone involved on a clean, professional, entirely predictable evening.`,
    ],
    nomination: [
      ({ s }) => `"Nothing personal." A phrase that has never once preceded something impersonal.`,
      ({ s, w }) => `${s} is ${w.pawn}, apparently. Those are famous for how long they last.`,
      ({ s }) => `A brave call. Enormously brave. Truly the hardest possible name to say out loud.`,
      ({ s }) => `Everybody is being so supportive of ${s}. Almost as though something is about to happen to ${s}.`,
      ({ s }) => `I love a speech that explains the decision to everybody except the person it's about.`,
      ({ s }) => `${s} took it well, which in this house means ${s} has no idea.`,
      ({ s }) => `Fascinating that the two people nobody is afraid of ended up in the two chairs. Coincidence.`,
      ({ s }) => `And now two days of reassurance. My favourite genre.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} has won a ${w.challenge} and will now be safe for an entire week, which is nearly long enough to matter.`,
      ({ s }) => `Everybody looks thrilled for ${s}. Especially the four people doing sums behind their eyes.`,
      ({ s }) => `A famous victory. It will be remembered for as long as eight days.`,
      ({ s }) => `${s} is now a threat, which is a wonderful thing to become in front of witnesses.`,
      ({ s }) => `The humility is a nice touch. Nothing says humble like mentioning it four times.`,
      ({ s, w }) => `Congratulations on the ${w.challenge}. Do let us know how the conversations go, since those are the ones that count.`,
      ({ s }) => `Marvellous. Now ${s} has to make a decision, which has historically been the weak spot.`,
      ({ s }) => `I've never seen anybody enjoy a temporary reprieve quite so thoroughly.`,
    ],
    blindside: [
      ({ s }) => `Who could POSSIBLY have predicted that the people who stopped talking to ${s} were up to something.`,
      ({ s }) => `${s} asked if everything was fine and was told everything was fine. Case closed, apparently.`,
      ({ s }) => `An extraordinary betrayal, executed by people who will be extremely sad about it for nearly an hour.`,
      ({ s }) => `The hug beforehand was a nice flourish. Really committed to the bit.`,
      ({ s }) => `And they're all so sorry. You can hear it in the way none of them are looking up.`,
      ({ s }) => `${s} did nothing wrong except believe words spoken by people with an incentive to say them.`,
      ({ s }) => `Genuinely well done. I mean that, which is unusual for me, so enjoy it.`,
      ({ s }) => `Nobody saw it coming, apart from everybody, apart from ${s}.`,
    ],
    finale: [
      ({ s }) => `${s} wins, and somewhere a jury is congratulating itself on a difficult decision it made in nine seconds.`,
      ({ s }) => `A thoughtful, considered vote, arrived at entirely on the merits, obviously, as always.`,
      ({ s }) => `${s} gave a speech about integrity. In this game. With a straight face. Superb.`,
      ({ s }) => `The runner-up is taking it beautifully, which is to say through clenched everything.`,
      ({ s }) => `And so the season ends exactly where episode two said it would. Thrilling.`,
      ({ s }) => `${s} deserved it, and I say that having spent the whole season saying ${s} wouldn't get it.`,
      ({ s }) => `A narrow win, which means half of them will explain for years why they were right.`,
      ({ s }) => `Wonderful. Now everybody can go home and be honest for the first time since March.`,
    ],
    'episode-aired': [
      () => `A packed episode. Two conversations and a walk.`,
      () => `Everyone in there's playing a very deep game that nobody, including them, can describe.`,
      () => `Superb television if you enjoy watching people agree with each other about nothing.`,
      () => `Somebody said "I'm not here to make friends" and then made three. Consistency.`,
      () => `The strategy talk tonight was fascinating, in that none of it will survive contact with a vote.`,
      () => `Nothing happened, beautifully, for forty minutes.`,
      () => `A masterclass in saying a great deal while committing to none of it.`,
      () => `And next week: the same, but louder. I'll be watching, obviously.`,
    ],
  },

  // Short. Flat. No cushion, no ceremony, no interest in softening it.
  streetwise: {
    eviction: [
      ({ s }) => `${s} got played. Happens. Move on.`,
      ({ s }) => `Look — you don't get carried in there. ${s} wanted carrying.`,
      ({ s, w }) => `That ${w.vote} was decided at breakfast. Everything after was theatre.`,
      ({ s }) => `${s} was too nice to people who weren't being nice back. Simple as that.`,
      ({ s }) => `Nobody owed ${s} a heads up. That's not how it works and everybody knows it.`,
      ({ s }) => `${s} should have swung first. Two weeks ago. Whole different night.`,
      ({ s }) => `Cold. Correct. Both.`,
      ({ s }) => `You want loyalty, go home. This isn't that.`,
    ],
    nomination: [
      ({ s, w }) => `${s} is ${w.onDanger}. Fight or don't. Nobody is coming.`,
      ({ s, w }) => `${w.Pawn}. Right. Ask one how that usually ends.`,
      ({ s }) => `Say the name, take the heat. All that speech does is make enemies politely.`,
      ({ s }) => `${s} has got about a day. Use it on the two people who owe you something.`,
      ({ s }) => `Everybody in that room just found out who runs the place. Watch what they do with it.`,
      ({ s }) => `Don't cry in there. Cry after. That's not advice, that's survival.`,
      ({ s }) => `They put ${s} up because ${s} is easy. Stop being easy.`,
      ({ s }) => `Nothing personal, they said. It's always personal.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} took the ${w.challenge}. Good. Now don't waste it.`,
      ({ s }) => `Safe for a week. That's all it's. Don't get comfortable.`,
      ({ s }) => `Half that room just started counting. ${s} should be counting too.`,
      ({ s }) => `Nice. Nice doesn't last. What is the plan.`,
      ({ s }) => `${s} earned that. Nobody hands you anything in there.`,
      ({ s }) => `Now everybody knows what ${s} can do. That cuts both ways and it cuts fast.`,
      ({ s }) => `Win quiet next time. Loud wins get you targeted.`,
      ({ s }) => `Good week. Bank it. Say less.`,
    ],
    blindside: [
      ({ s }) => `Clean. Brutal. That's the job.`,
      ({ s }) => `${s} stopped checking. You never stop checking.`,
      ({ s }) => `They smiled at ${s} all morning. That's not evil, that's competent.`,
      ({ s }) => `Everybody wants the move. Nobody wants to write the name. Somebody did.`,
      ({ s }) => `${s} asked the wrong person. Always ask the one with nothing to gain.`,
      ({ s }) => `No warning, no leaks, no nerves. Respect.`,
      ({ s }) => `That's the game. People keep expecting it to be something else.`,
      ({ s }) => `${s} will be angry for a week and grateful for the lesson in a year.`,
    ],
    finale: [
      ({ s }) => `${s} did the work. Take the money.`,
      ({ s }) => `Jury got it right. Rare. Say it while it's true.`,
      ({ s }) => `${s} cut people and didn't whine about it. That's why ${s} is holding the cheque.`,
      ({ s }) => `Nobody wins that clean. Nobody. Stop pretending otherwise.`,
      ({ s }) => `Second place played scared at the end. That's the whole gap.`,
      ({ s }) => `Good speech. Short. Didn't apologise. Correct.`,
      ({ s }) => `Anybody still bitter tonight was never going to win it anyway.`,
      ({ s }) => `Earned. Next.`,
    ],
    'episode-aired': [
      () => `Nobody in there wants to be the bad guy. That's why nothing is happening.`,
      () => `All talk. Somebody go and do something.`,
      () => `Quiet week. Quiet weeks get people sent home.`,
      () => `Too much hugging. Not enough counting.`,
      () => `One of them is playing. The rest are visiting.`,
      () => `They will figure it out about four days too late. They always do.`,
      () => `Fine episode. Soft camp.`,
      () => `Something breaks next week. It has to.`,
    ],
  },

  // Reads the room as weather. Oblique, unhurried, occasionally unnervingly right.
  mystical: {
    eviction: [
      ({ s }) => `${s} had been fading from that room for days. The ${'vote'} only wrote it down.`,
      ({ s }) => `You could feel it in how people stood. Nobody stands near somebody they've decided about.`,
      ({ s }) => `${s} carried something heavy in there all season and I don't think it was strategy.`,
      ({ s, w }) => `The ${w.home} felt different on Tuesday. Whatever happened, happened then.`,
      ({ s }) => `There was no cruelty in that. There was no warmth either. It simply closed.`,
      ({ s }) => `${s} will be lighter tomorrow. That's not a consolation, it's an observation.`,
      ({ s }) => `Everybody is looking for the moment it turned. It didn't turn. It drifted.`,
      ({ s }) => `I hope somebody tells ${s} that being loved and being kept are different things.`,
    ],
    nomination: [
      ({ s }) => `${s} was already sitting apart before anybody said a word. The chair only made it visible.`,
      ({ s }) => `The room went still about an hour before that. It always goes still first.`,
      ({ s }) => `Whoever made that choice isn't at peace with it. You can hear it in the pauses.`,
      ({ s }) => `${s} should stop talking for a day and just watch. The answer is in the room, not in the conversations.`,
      ({ s }) => `They call ${s} safe. Safe is a word people use when they're avoiding a harder one.`,
      ({ s }) => `There's something unfinished between two of them and this isn't about ${s} at all.`,
      ({ s }) => `${s} is frightened and hiding it well. The hiding costs more than the fear.`,
      ({ s }) => `The energy in there tonight is the energy of people who have already decided and are waiting.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} didn't win that ${w.challenge}. ${s} stopped fighting it, and it arrived.`,
      ({ s }) => `Something settled in ${s} halfway through. You could see the exact second.`,
      ({ s }) => `A win changes how a person occupies a room. Watch ${s} at breakfast, not on the mat.`,
      ({ s }) => `The others felt that. Nobody said anything, and all of them felt it.`,
      ({ s }) => `${s} has been quietly unravelling for a week. This will hold ${s} together for another one.`,
      ({ s }) => `It came at the right time, which is rarer and more interesting than it coming at all.`,
      ({ s }) => `There's a cost to standing in the light. ${s} will find it in a few days.`,
      ({ s }) => `Whoever congratulated ${s} last is the one to watch. That pause meant something.`,
    ],
    blindside: [
      ({ s }) => `The room had already grieved ${s}. That's why nobody flinched.`,
      ({ s }) => `${s} knew. Not in words. People always know, and they always talk themselves out of it.`,
      ({ s }) => `There was too much kindness at breakfast. Kindness in that quantity is a warning.`,
      ({ s }) => `Something was carried out of that camp tonight and it wasn't just a person.`,
      ({ s }) => `Whoever built that's not going to sleep well, and they shouldn't, and it was still right.`,
      ({ s }) => `${s} looked up a half-second too late. The half-second is where the whole game lives.`,
      ({ s }) => `The air changed on Sunday. Everything after was just arrangement.`,
      ({ s }) => `They will call it a blindside. It was a slow closing that nobody named.`,
    ],
    finale: [
      ({ s }) => `${s} was always going to end up there. Not because of the moves — because of the way ${s} carries a room.`,
      ({ s }) => `That jury voted with something older than reasoning. They will explain it badly for years.`,
      ({ s }) => `There was peace in ${s} at the end. That's what a jury actually reads.`,
      ({ s }) => `The runner-up argued. ${s} simply was. One of those wins finales.`,
      ({ s }) => `Something closed cleanly tonight. Not every season gets that.`,
      ({ s }) => `${s} forgave them before they voted. They could feel it. That's the whole speech.`,
      ({ s }) => `A narrow verdict, which means the season asked a real question and got an honest answer.`,
      ({ s }) => `Whatever ${s} came in looking for, ${s} didn't leave with it, and left with something better.`,
    ],
    'episode-aired': [
      () => `The camp is holding its breath. It has been for three days.`,
      () => `Something is going to break, and it won't be where anybody is looking.`,
      () => `Quiet episode. Quiet isn't nothing — quiet is where the decisions get made.`,
      () => `Two people stopped finishing each other's sentences tonight. That's the story.`,
      () => `There's a person in that camp everybody has stopped seeing. Watch them.`,
      () => `The energy shifted at the fire. It always shifts at the fire.`,
      () => `Nobody lied tonight and nobody told the truth either. That's its own kind of week.`,
      () => `They're further from each other than they were, and none of them has noticed yet.`,
    ],
  },
};
