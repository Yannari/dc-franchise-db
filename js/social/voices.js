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
  streetwise: [/tough|street|jersey|scrapp|hardened|delinquent|rebel|punk|criminal|thug/, 7],
  boastful: [/boast|arrogant|egotis|vain|self-obsessed|narcissis|cocky|braggart|conceited/, 9],
  excitable: [/excit|hyper|energetic|bubbly|manic|enthusiast|bouncy|eager|giddy/, 12],
  theatrical: [/dramat|theatric|flamboyan|over-the-top|melodram|diva|showman|grandiose|poetic|opera/, 13],
  sarcastic: [/sarcas|snark|sardonic|mocking|cynic|smug|smart-alec|wry|ironic/, 15],
  formal: [/formal|articulate|precise|analytic|intellect|scholar|clinical|methodical|polite|proper/, 15],
  nervous: [/nervous|anxious|timid|shy|stammer|panick|insecure|jitter|worrier|meek|fearful/, 19],
  deadpan: [/deadpan|dry |monoton|stoic|laconic|unbothered|nonchalant|apathetic|bored|flat /, 19],
  manipulative: [/manipulat|silky|flatter|charm|schem|slick|smooth|honey|calculat|cunning/, 26],
  blunt: [/blunt|brash|loud|aggressive|abrasive|no-nonsense|harsh|gruff|confrontational|bossy/, 43],
  warm: [/kind|sweet|warm|gentle|caring|nurtur|supportive|optimis|cheerful|friendly|earnest/, 82],
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
      ({ s }) => `${s} is gone. Everyone saw it coming except ${s}. That is the whole story.`,
      ({ s }) => `People are calling that shocking. It was scheduled.`,
      ({ s }) => `${s} played for eight weeks and lost in about four minutes. It happens.`,
      ({ s }) => `I have nothing kind to say, so: ${s} was there, and now ${s} is not.`,
      ({ s }) => `${s} is out. I would say more but there is not more.`,
      ({ s }) => `Nine people spent a week deciding that. It took me one look.`,
      ({ s }) => `${s} made one friend too few. That is the entire post-mortem.`,
      ({ s }) => `Sad. Predictable. In that order, which is the wrong order.`,
    ],
    nomination: [
      ({ s }) => `${s} is on the block. ${s} will be fine or ${s} will not. Those are the options.`,
      ({ s }) => `Everybody is very worked up about a decision that took somebody nine seconds.`,
      ({ s }) => `The speech said "nothing personal". It is always personal.`,
      ({ s }) => `${s} looks calm. Calm is not information.`,
      ({ s }) => `${s} is nominated. This is the part where everybody lies for two days.`,
      ({ s }) => `A pawn. Sure. Pawns come off the board first, but sure.`,
      ({ s }) => `The room is doing a lot of reassuring. Reassuring is free.`,
      ({ s }) => `${s} will campaign now. It rarely works. It has to be done anyway.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} won a ${w.challenge}. That buys a week. Weeks run out.`,
      ({ s }) => `Good for ${s}. Now the hard part, which is everything else.`,
      ({ s }) => `A win is not a plan. People keep confusing those.`,
      ({ s, w }) => `${s} is better at ${w.challenge}s than at conversations. We will see which one this season rewards.`,
      ({ s }) => `${s} is safe. Everybody else got a week older.`,
      ({ s, w }) => `A ${w.challenge} was held and somebody won it. Riveting.`,
      ({ s }) => `${s} is happy. Give it six days.`,
      ({ s }) => `The celebration lasted longer than the safety will.`,
    ],
    blindside: [
      ({ s }) => `${s} did not know. That is what the word means.`,
      ({ s }) => `Well executed. Everybody lied to ${s} competently. There is not much more to say.`,
      ({ s }) => `The face is the whole show. I have watched it three times.`,
      ({ s }) => `Nobody warned ${s}, which tells you what ${s} was worth to them.`,
      ({ s }) => `${s} asked if everything was fine. Everything was not fine.`,
      ({ s }) => `Four people kept a secret for a day. That is the record broken tonight.`,
      ({ s }) => `Somebody hugged ${s} at breakfast. Cold work. I respect it.`,
      ({ s }) => `${s} is confused. ${s} was confused a week ago too, quietly.`,
    ],
    finale: [
      ({ s }) => `${s} won. The jury voted. Those two facts are related, which is more than some finales manage.`,
      ({ s }) => `Congratulations to ${s}, and my condolences to everybody rehearsing a speech about it.`,
      ({ s }) => `I would have voted the same way. I am not going to explain why at length.`,
      ({ s }) => `A good finale. Nobody needs me to add anything to it.`,
      ({ s }) => `${s} won. The confetti is proportionate to the achievement, roughly.`,
      ({ s }) => `Somebody had to. It was ${s}. Fine.`,
      ({ s }) => `Good speech. Short. I have opinions about the other one.`,
      ({ s }) => `A jury made a reasonable decision. Note the date.`,
    ],
    'episode-aired': [
      () => `An episode happened. Some of it was even about the game.`,
      () => `Forty minutes. Two of them mattered. Standard.`,
      () => `I enjoyed it. You cannot tell, but I did.`,
      () => `That is the most anybody has said out loud all season and none of it was true.`,
      () => `Things occurred. Some of them to people who deserved it.`,
      () => `I watched all of it. I am not going to pretend that was a choice.`,
      () => `Quiet week. Quiet weeks are where the damage gets done.`,
      () => `Nobody did anything. It was still better than last week.`,
    ],
  },

  // Long. Arrives at the point by way of feeling. Everything is an event.
  theatrical: {
    eviction: [
      ({ s }) => `I am not FINE. ${s} walked out of that door and took the only person in there willing to say something interesting with ${s}.`,
      ({ s, w }) => `Let the record show that the ${w.home} lost its last real character tonight, and that every one of them clapped while it happened.`,
      ({ s }) => `A tragedy in three acts, and ${s} wrote every one of them personally.`,
      ({ s }) => `They will talk about that goodbye for years. I will talk about it for weeks. It is the same instinct, scaled.`,
      ({ s }) => `Somebody fetch me a chair. ${s} — GONE — and not one of them had the decency to look ashamed.`,
      ({ s }) => `I have watched a hundred of these and I still put my hands over my face. ${s} deserved a better exit and got a truthful one.`,
      ({ s, w }) => `The ${w.home} will be quieter tomorrow and every single one of them will pretend that is a relief.`,
      ({ s }) => `A whole season of build, and it ends in eleven seconds of silence. Devastating. Perfect. I hate it.`,
    ],
    nomination: [
      ({ s }) => `${s} on the block — ${s}! — and we are all meant to sit here as though this is a normal Thursday.`,
      ({ s }) => `Somebody hand ${s} a monologue, because that speech deserved better staging than it got.`,
      ({ s }) => `The block is a stage and ${s} has just been given the only lighting cue that matters. Use it.`,
      ({ s }) => `I have seen quieter funerals. I have seen quieter WEDDINGS.`,
      ({ s }) => `The way ${s} sat down. The WAY ${s} sat down. Give that person an award and a blanket.`,
      ({ s }) => `Nominations are the second act and nobody in that room has read the script.`,
      ({ s }) => `I gasped. Out loud. Alone. That is the review.`,
      ({ s }) => `${s} is going to make something enormous out of this or be flattened by it, and there is no third option.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} wins the ${w.challenge} and I am on my feet in an empty room, which is where the best applause happens.`,
      ({ s }) => `THAT is a moment. Not a good performance — a MOMENT. There is a difference and ${s} just found it.`,
      ({ s, w }) => `Every season needs one ${w.challenge} that people describe to each other for a decade. This is that one.`,
      ({ s }) => `${s} did not just win. ${s} performed winning, in front of the exact people who needed to watch it.`,
      ({ s }) => `SCENES. Absolute SCENES. ${s} has never looked more alive than in the last four seconds of that.`,
      ({ s, w }) => `Give me a slow motion replay and a string section, because that ${w.challenge} deserved both.`,
      ({ s }) => `${s} won and half that camp forgot to arrange their faces. I saw every one of them.`,
      ({ s }) => `I have goosebumps and I am not embarrassed about a single one of them.`,
    ],
    blindside: [
      ({ s }) => `The GASP. The turn. The slow realisation crossing ${s}'s face like weather. I have not breathed since.`,
      ({ s }) => `Somebody looked ${s} in the eye, promised the world, and then delivered a masterpiece. I am appalled. I am delighted.`,
      ({ s }) => `That is not a blindside, that is a third-act reveal, and whoever staged it has been holding it for weeks.`,
      ({ s }) => `I will be describing ${s}'s face to strangers for the rest of my life.`,
      ({ s }) => `The room went silent. ${s} turned. And the whole season split neatly into before and after.`,
      ({ s }) => `Somebody wrote that name down while holding ${s}'s hand. HOLDING ${s}'s HAND.`,
      ({ s }) => `I have not stopped pacing. This is why the show exists. This exact eleven seconds.`,
      ({ s }) => `A masterpiece, cruelly staged, beautifully timed, and I will be defending it to strangers all week.`,
    ],
    finale: [
      ({ s }) => `${s}. Confetti. A jury that finally said the quiet thing out loud. Give me a moment, I am genuinely emotional.`,
      ({ s }) => `Every season builds to somebody standing there stunned, and tonight it is ${s}, and I would not swap it.`,
      ({ s }) => `The speech, the vote, the pause before the last name — perfect television, and I say that as somebody who has LIVED it.`,
      ({ s }) => `They gave it to ${s}, and they were right, and I intend to be insufferable about having said so.`,
      ({ s }) => `${s}! On the floor! In tears! And so am I, and I am not even in the building!`,
      ({ s }) => `That last vote hung in the air for a full second and I aged a year inside it.`,
      ({ s }) => `A finale with a real question in it, and a jury brave enough to answer. Magnificent.`,
      ({ s }) => `I want the speech framed. I want the pause before it framed separately.`,
    ],
    'episode-aired': [
      () => `WHAT an hour. I have aged, I have recovered, I have aged again.`,
      () => `Some episodes are television. That one was THEATRE, and I will not be taking questions.`,
      () => `I need everybody to understand that I watched that standing up.`,
      () => `An absolute circus and I would not change a single ring of it.`,
      () => `I have been shouting at furniture for forty minutes and I regret nothing.`,
      () => `That was not an episode, that was an INCIDENT.`,
      () => `Somebody in there is having the season of their life and does not know it yet.`,
      () => `I need a lie down, a rewatch, and then another lie down.`,
    ],
  },

  // Says the thing. Does not soften it. Slightly enjoys not softening it.
  blunt: {
    eviction: [
      ({ s }) => `${s} played badly. Not unluckily. Badly. Somebody should say it.`,
      ({ s }) => `Everyone is being gracious about ${s}. I am not going to be. That was avoidable from week two.`,
      ({ s }) => `${s} spent a month being everybody's second choice and acted surprised to be nobody's first.`,
      ({ s }) => `Good riddance, strategically. That is not personal. It is just true.`,
      ({ s }) => `${s} got outplayed by people who are not that good. That should sting more than a blindside.`,
      ({ s }) => `A month of hedging and ${s} ends up with nobody willing to spend a vote. Predictable.`,
      ({ s }) => `Everybody in there knew for three days. ${s} was the only one not asking.`,
      ({ s, w }) => `You cannot be everyone's friend and expect a ${w.vote} to go your way. Pick one.`,
    ],
    nomination: [
      ({ s }) => `Put ${s} up and then look ${s} in the face while you say why. Anything else is cowardice with a microphone.`,
      ({ s }) => `That was a weak nomination and everybody in that room knows it, including the person who made it.`,
      ({ s }) => `${s} is not a pawn. ${s} is a target with better manners applied to it.`,
      ({ s }) => `If you are going to do it, do it. The apology tour afterwards fools nobody.`,
      ({ s }) => `Nominate the threat. Every week somebody nominates the polite option and every week it costs them.`,
      ({ s }) => `${s} is being handled, not targeted. ${s} should be insulted enough to do something about it.`,
      ({ s }) => `That speech was six sentences of nothing. Say the name and sit down.`,
      ({ s }) => `Half that room agreed to this and none of them will admit it tomorrow.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} won because ${s} wanted it more. People hate that explanation because it is the one they cannot copy.`,
      ({ s }) => `Stop calling it luck. ${s} was better tonight. Say the sentence.`,
      ({ s, w }) => `One ${w.challenge} does not make ${s} a threat. Six do. Count.`,
      ({ s }) => `${s} needed that and got it. Now stop celebrating and go do the hard part.`,
      ({ s, w }) => `Winning a ${w.challenge} is the easy half. ${s} has been failing the other half all season.`,
      ({ s }) => `${s} is now the biggest name on the board. Act like it or lose it.`,
      ({ s }) => `Everyone clapping for ${s} was doing arithmetic while they clapped.`,
      ({ s }) => `Good. Now do it again next week, because one is a story and two is a problem.`,
    ],
    blindside: [
      ({ s }) => `${s} got lied to for a week straight and never once checked. That is on ${s}.`,
      ({ s }) => `Clean work. Brutal, and clean. Those are usually the same thing.`,
      ({ s }) => `Everybody wants to blindside somebody and nobody wants to be the one who says the name out loud. Somebody did tonight.`,
      ({ s }) => `${s} trusted people who had no reason to be trustworthy. Do not call that a betrayal, call it arithmetic.`,
      ({ s }) => `${s} had two people telling ${s} the truth and picked the third. Own that.`,
      ({ s }) => `That was not clever. It was just done, which is more than most of them manage.`,
      ({ s }) => `Nobody owes ${s} a warning. Get better at asking.`,
      ({ s }) => `The people apologising tonight are the ones who wrote the name. Spare me.`,
    ],
    finale: [
      ({ s }) => `${s} won it. Anybody arguing otherwise did not watch the same season I did.`,
      ({ s }) => `The jury got it right. It does not happen often enough to go unmentioned.`,
      ({ s }) => `Say what you like about ${s}. ${s} sat down, made a case, and did not flinch. That is the job.`,
      ({ s }) => `Bitter jury nonsense. ${s} played the better game and everybody spent the night pretending not to know it.`,
      ({ s }) => `${s} made the moves. Everybody else made friends. Only one of those is the game.`,
      ({ s }) => `Anybody voting on feelings tonight should say so out loud instead of dressing it up.`,
      ({ s }) => `${s} won and did not apologise for it. Finally.`,
      ({ s }) => `Second place gave the better speech. First place gave the better season. Those are not the same prize.`,
    ],
    'episode-aired': [
      () => `Half that camp is playing scared and it is starting to show on screen.`,
      () => `Everybody is very busy being likeable. Somebody go and win something.`,
      () => `That was a lot of talking and almost no deciding.`,
      () => `Good episode. Terrible players. Both things.`,
      () => `Nobody in that camp wants to be the one holding the knife and it is making the whole season slow.`,
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
      ({ s }) => `The stated reason and the operative reason are rarely identical. I would weigh who was NOT nominated more heavily than who was.`,
      ({ s }) => `Placing ${s} there costs the decision-maker a relationship and buys information. Whether that is a good trade depends on facts we do not have yet.`,
      ({ s }) => `A nomination is a public document. Read it for what it commits the author to, not for what it says about ${s}.`,
      ({ s }) => `Consider the counterfactual: had ${s} not been nominated, who would have been, and what does that name cost the same person?`,
      ({ s }) => `${s} is a low-risk nomination, which is precisely the objection to it. Low risk usually means low return.`,
      ({ s }) => `The speech contained one verifiable claim and four sentiments. I would examine the claim.`,
      ({ s }) => `This tells us more about the nominator's fears than about ${s}'s standing.`,
    ],
    'comp-win': [
      ({ s, w }) => `A ${w.challenge} win converts to safety immediately and to a target gradually. ${s} has bought one week and spent some of a later one.`,
      ({ s }) => `The timing is more interesting than the result. Winning this particular week forces ${s} to make a decision ${s} was avoiding.`,
      ({ s }) => `I would not overweight this. One result is a data point; the pattern across the season is the argument.`,
      ({ s, w }) => `${s} now has a résumé item. Résumé items are assets at a finale and liabilities before one.`,
      ({ s, w }) => `${s} has now won at a rate well above what the field would predict. At some point that stops being variance.`,
      ({ s }) => `Safety this week costs ${s} deniability next week. That is the trade and I am not sure ${s} has priced it.`,
      ({ s }) => `Note that ${s} won without needing it. Winning from safety is a different signal to winning from the block.`,
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
      ({ s }) => `I hope ${s} knows how many people in there liked ${s}. It did not save ${s}, and it still mattered.`,
      ({ s }) => `That is a hard way to go out and ${s} handled it better than I did when it was me.`,
      ({ s, w }) => `${s} lost the ${w.vote}, not the room. Those look identical tonight and they will not in a month.`,
      ({ s }) => `Everybody wants to talk about the mistake. I want to talk about ${s} hugging the person who made it happen. That took something.`,
      ({ s }) => `${s} thanked people on the way out. After that. I do not know that I could have.`,
      ({ s }) => `Somebody in there is going to cry about this tonight and it will not be ${s}.`,
      ({ s, w }) => `${s} was good to people who could do nothing for ${s}. The ${w.vote} does not measure that and it still counts.`,
      ({ s }) => `Hard week. ${s} kept turning up for other people anyway, right to the end.`,
    ],
    nomination: [
      ({ s }) => `${s} is going to be fine. Not safe — fine. There is a difference and it gets you through the day.`,
      ({ s }) => `The worst part of that seat is not the danger, it is being talked about in the third person while you are standing there.`,
      ({ s }) => `Whoever hugged ${s} afterwards did more for that week than any speech.`,
      ({ s }) => `I would tell ${s}: the people avoiding eye contact are the ones to talk to. They are avoiding it for a reason.`,
      ({ s }) => `${s} is scared and pretending not to be, and everybody can tell, and nobody is going to say so kindly.`,
      ({ s }) => `The block is lonely in a house full of people. That is the part nobody warns you about.`,
      ({ s }) => `${s} has one real friend in there. One is enough if ${s} actually uses it.`,
      ({ s }) => `Whoever sat with ${s} tonight without saying anything did the most useful thing all week.`,
    ],
    'comp-win': [
      ({ s, w }) => `Watching ${s} realise ${s} had actually won that ${w.challenge} was the best thing in the episode.`,
      ({ s }) => `${s} needed that. Not strategically — ${s} needed to believe ${s} belonged there, and now ${s} does.`,
      ({ s }) => `Look at who congratulated ${s} first. That is worth more to ${s} this week than the safety is.`,
      ({ s }) => `A win changes how somebody carries themselves for days. That is the part people underrate.`,
      ({ s }) => `${s} has been quietly having an awful time and needed exactly this. Look at ${s}.`,
      ({ s, w }) => `The best bit of that ${w.challenge} was ${s} checking on the person who came last.`,
      ({ s }) => `${s} won and apologised to the room. Never apologise for a good week, but I understand why ${s} did.`,
      ({ s }) => `Confidence is contagious in there. ${s} just handed some to three other people without noticing.`,
    ],
    blindside: [
      ({ s }) => `Brilliant move, and I am still allowed to feel awful for ${s}. Both of those are true at once.`,
      ({ s }) => `${s} trusted people. I am never going to be able to call that a mistake, even when it costs somebody the game.`,
      ({ s }) => `The hardest part is not the vote. It is realising the conversation that morning was already a goodbye.`,
      ({ s }) => `Somebody in that room is going to feel sick about this for a week, and they should, and it was still the right play.`,
      ({ s }) => `That was very well played and I still had to look away when ${s} understood.`,
      ({ s }) => `${s} spent the morning defending the person who wrote ${s}'s name down. I will be thinking about that for a while.`,
      ({ s }) => `Nobody in there enjoyed that as much as they are pretending to.`,
      ({ s }) => `${s} will forgive them. That is not weakness, and it will make the jury phase interesting.`,
    ],
    finale: [
      ({ s }) => `${s} won and the first thing ${s} did was look for the people who got ${s} there. That is who ${s} has been all season.`,
      ({ s }) => `A good winner. Not a flawless game — a good WINNER, which the show needs more than it admits.`,
      ({ s }) => `Everybody on that jury had a reason to be bitter and they voted honestly anyway. That is rarer than the win.`,
      ({ s }) => `I am happy for ${s}, and I am happy for the runner-up, and I am aware that makes me useless as an analyst.`,
      ({ s }) => `${s} won and thanked the people who lost to ${s}. That is how you leave with everything.`,
      ({ s }) => `Nobody on that jury voted out of spite tonight. After that season. I am genuinely moved.`,
      ({ s }) => `Both of them played hard and neither one turned cruel about it. That is rarer than the trophy.`,
      ({ s }) => `${s} deserved it and so did the person who did not get it. Finales are unfair like that.`,
    ],
    'episode-aired': [
      () => `A lot of people had a hard night in there and mostly took care of each other. That is not nothing.`,
      () => `Genuinely lovely episode underneath all the scheming, if you were watching for it.`,
      () => `Whoever is doing the quiet reassuring in that camp is running the place and does not know it.`,
      () => `You could see the exhaustion tonight. They are further into this than the edit suggests.`,
      () => `They are tired. You can hear it in how carefully everybody is talking to each other.`,
      () => `Somebody made somebody else laugh tonight for the first time in about a week. That matters in there.`,
      () => `A lot of small kindnesses in an episode that will be remembered for one argument.`,
      () => `Whoever is holding that camp together is not going to get any credit for it, as usual.`,
    ],
  },

  // Compliments that are load-bearing. Reads everything as a manoeuvre.
  manipulative: {
    eviction: [
      ({ s }) => `Beautifully done, and I mean by whoever kept smiling at ${s} right up to the ${'vote'}. That is the skill nobody credits.`,
      ({ s }) => `${s} was lovely to everybody and gave nobody a reason to need ${s}. Warmth is not currency unless you charge for it.`,
      ({ s }) => `The eulogies in there are all being delivered by people who wrote the plan. Watch who is enjoying this quietly.`,
      ({ s }) => `${s} is going to spend the jury phase deciding who lied kindly. Kindly matters enormously and almost nobody plans for it.`,
      ({ s }) => `${s} left believing three separate people were on ${s}'s side. All three voted. That is craftsmanship.`,
      ({ s }) => `The trick is not getting the votes. It is making sure ${s} thanks you on the way out, and somebody managed it.`,
      ({ s }) => `${s} was useful right up to the moment ${s} was expensive. That is a shorter window than people plan for.`,
      ({ s }) => `Now watch who visits ${s} in the jury. That visit is worth more than tonight was.`,
    ],
    nomination: [
      ({ s }) => `Calling ${s} a pawn is doing more work than the nomination is. Give a danger a friendly name and people stop checking it.`,
      ({ s }) => `The seat is not the move. Watching who comforts ${s} tonight is the move.`,
      ({ s }) => `Whoever made that decision wants to be liked for it, which means ${s} has leverage and about a day to notice.`,
      ({ s }) => `I would let ${s} panic slightly. A frightened nominee tells you every alliance in the house by lunchtime.`,
      ({ s }) => `Nominate somebody and then comfort them. It costs nothing and it buys a week of gratitude.`,
      ({ s }) => `${s} is the excuse, not the plan. The plan was making the room comfortable with a name being said out loud.`,
      ({ s }) => `The best nominations look like favours. This one nearly does.`,
      ({ s }) => `Everybody is watching ${s}. That is the point. Nobody is watching the person who suggested it.`,
    ],
    'comp-win': [
      ({ s, w }) => `${s} won and immediately started apologising for it. That instinct is worth more than the ${w.challenge}.`,
      ({ s }) => `The clever thing now is for ${s} to look mildly embarrassed about it for two days. Nobody targets a winner who seems surprised.`,
      ({ s }) => `A win is a spotlight, and ${s} has never once been comfortable in one. Watch what ${s} gives away this week.`,
      ({ s }) => `Everybody is congratulating ${s}. Half of them started counting the moment ${s} crossed the line.`,
      ({ s, w }) => `A ${w.challenge} win is a receipt. ${s} should be very careful who gets to read it.`,
      ({ s }) => `${s} should lose the next one on purpose and will not, and that is how this ends.`,
      ({ s }) => `Notice who offered ${s} a deal within the hour. Speed like that means it was written beforehand.`,
      ({ s }) => `The win is fine. The victory lap is what gets ${s} nominated in nine days.`,
    ],
    blindside: [
      ({ s }) => `Whoever ran that kept ${s} warm right to the end. Cold blindsides get found; warm ones do not.`,
      ({ s }) => `The lie was not the achievement. Keeping four people from enjoying the lie in front of ${s} — that is the achievement.`,
      ({ s }) => `${s} asked the right question and accepted the first comfortable answer. It happens to everybody exactly once.`,
      ({ s }) => `Now the delicate part: whoever did it has to be sad about it convincingly for about six hours.`,
      ({ s }) => `Nobody flinched at breakfast. Getting four people to eat calmly next to ${s} is harder than getting the votes.`,
      ({ s }) => `${s} was given a small true thing to hold so ${s} would not go looking for the large false one.`,
      ({ s }) => `Beautiful. Slightly greedy at the end, when somebody could not resist watching ${s}'s face.`,
      ({ s }) => `The apology tomorrow needs to be shorter than people think. Long apologies read as guilt.`,
    ],
    finale: [
      ({ s }) => `${s} won because ${s} let other people describe ${s}'s game for ${s}, all season, to the exact right audience.`,
      ({ s }) => `Owning the cut is the whole trick. Deny it and a jury smells it; own it warmly and they call it respect.`,
      ({ s }) => `Every vote for ${s} was set up weeks before anybody was on a jury. That is not luck, that is scheduling.`,
      ({ s }) => `A jury does not reward the best game. It rewards the game it was told about most flatteringly, by the person it liked.`,
      ({ s }) => `${s} spent the season making other people feel clever. A jury remembers how you made it feel, not what you did.`,
      ({ s }) => `Two votes there were bought in week four and did not know it until tonight.`,
      ({ s }) => `${s} named the betrayals before the jury could. You cannot be exposed by something you have already confessed.`,
      ({ s }) => `The runner-up argued the record. ${s} argued the relationships. Only one of those is on the ballot.`,
    ],
    'episode-aired': [
      () => `Everybody in there is being extremely nice to each other, which is how you know.`,
      () => `Two people had the same conversation with three different people tonight and only one of them realised it.`,
      () => `The person doing the least on screen is having the best week. That is almost always how it goes.`,
      () => `Somebody made a promise tonight they have no intention of keeping, and they made it beautifully.`,
      () => `Somebody said “I trust you” three times tonight. Nobody says that when it is true.`,
      () => `The quiet one is doing very well and would like you to keep not mentioning it.`,
      () => `Two alliances think they own the same person. That person knows.`,
      () => `An entire episode of people being reassured. Reassurance is what you offer instead of information.`,
    ],
  },
};
