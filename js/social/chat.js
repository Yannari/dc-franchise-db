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
 */
function pickFresh(arr, rng, used) {
  const fresh = arr.filter(x => !used.has(x));
  const chosen = pick(fresh.length ? fresh : arr, rng);
  used.add(chosen);
  // Keep the memory shorter than the pool, or it empties and repeats anyway.
  if (used.size > Math.max(1, arr.length - 2)) used.delete([...used][0]);
  return chosen;
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
  if (host.wins) bits.push(`I won one of these`);
  if (host.bestPlacement === 2) bits.push(`I lost this at the end`);
  if (host.expertise.includes('the jury')) bits.push(`I sat on a jury`);
  if (host.expertise.includes('competitions')) bits.push(`I lived on ${w.challenge} wins`);
  if (host.seasonsPlayed >= 3) bits.push(`I have played ${host.seasonsPlayed} of these`);
  if (host.expertise.includes('surviving votes')) bits.push(`I had my name written down plenty`);
  return bits;
}

/**
 * The angle this alumnus naturally speaks from.
 *
 * Host records deliberately have no hand-maintained archetype. Derive one from
 * facts already on the eligible-host record and the canonical voice profile,
 * so a new alumnus acquires a lens without somebody editing this file.
 */
function hostLens(host) {
  const voice = String(host.voice || '').toLowerCase();
  if (/villain|cruel|ruthless|manipulat|cutthroat|mean-girl|sadistic|schem/.test(voice)) return 'villain';
  if (host.expertise.includes('competitions')) return 'challenge-beast';
  if (!host.wins && host.bestPlacement != null && host.bestPlacement <= 3) return 'goat';
  if (host.expertise.includes('alliances') || host.expertise.includes('jury management')) return 'strategist';
  if (host.expertise.includes('surviving votes')) return 'underdog';
  return 'social';
}

/** A factual lens changes the register without replacing the event-specific take. */
const LENS_FRAMES = {
  villain: [
    'Let me be unkind for a second. ', 'The polite version is not useful here. ',
    'If I wanted that player gone, this is exactly what I would say. ',
    'Somebody has to say the ugly part. ', 'I respect the nerve more than the excuse. ',
    'This is where being nice makes the read worse. ',
  ],
  'challenge-beast': [
    'A win can solve tonight, not the position. ', 'Look past the result and at the pressure. ',
    'This is what the scoreboard does not show. ', 'Safety and control are not the same prize. ',
    'The body can win the round; the relationships still decide the week. ',
    'I always watch who performs when losing is real. ',
  ],
  goat: [
    'The low-threat lane looks different from inside it. ', 'Being kept is not the same as being trusted. ',
    'People tell the supposedly easy opponent more than they mean to. ',
    'There is power in being underestimated, until there is not. ',
    'I know what it looks like when stronger players stop hiding the plan from you. ',
    'The person nobody fears still gets a vote and a memory. ',
  ],
  strategist: [
    'Count the relationships before the votes. ', 'The move is clean; the structure under it is not. ',
    'Information is the real competition here. ', 'The public plan and the actual plan separated days ago. ',
    'Watch who benefits without taking credit. ', 'The jury consequence matters before the tactical one does. ',
  ],
  underdog: [
    'The bottom always sees the crack before the majority admits it exists. ',
    'When your name is available, every silence gets loud. ',
    'Survival changes how you hear that conversation. ', 'The person in danger notices what comfortable players miss. ',
    'There is a read you only get when nobody is protecting your feelings. ',
    'The easy vote knows exactly how easy the room thinks it is. ',
  ],
  social: [
    'Watch the person, not only the move. ', 'The relationship changed before the plan did. ',
    'The room told us what happened before the vote did. ', 'Tone did more work than strategy there. ',
    'People remember how a move felt longer than how it counted. ',
    'The conversation after this matters more than the speech before it. ',
  ],
};

/**
 * What a host says about one moment.
 *
 * Four or more readings per kind, because a room where every eviction gets the
 * same sentence stops being people within about two episodes. The readings
 * DISAGREE with each other on purpose — fame is reach, not correctness, and a
 * panel that speaks with one voice reads as a press release.
 */
const TAKES = {
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
    ({ s }) => `If ${s} survives this the whole season reshuffles, and I think ${s} survives it.`,
    ({ s }) => `This is a warning shot presented as a plan. ${s} should treat it as both.`,
    ({ s }) => `The nomination is safe because the decision-maker is scared of the conversation the real move requires.`,
    ({ s }) => `${s} is being told pawn. The room is hearing permission.`,
    ({ s }) => `The speech protected the nominator and exposed everybody who nodded along.`,
    ({ s }) => `Putting ${s} up creates three new deals and none of them include the person with the power.`,
    ({ s }) => `${s} was nominated for being expendable. Surviving is how you make that assessment expensive.`,
    ({ s, w }) => `The ${w.home} did not react to ${s}. It reacted to the second name, and that is where the plan is.`,
    ({ s }) => `A pawn who knows they are a pawn is manageable. ${s} knows this is somebody else's rehearsal.`,
    ({ s }) => `That choice keeps the peace for one night and starts three private wars by breakfast.`,
    ({ s }) => `${s} needs to stop proving loyalty to people who just tested it without permission.`,
    ({ s }) => `The safest nomination is often the person whose revenge everybody has underestimated.`,
    ({ s }) => `Nobody looked surprised, which means this was agreed before the meeting we watched.`,
    ({ s }) => `${s} is not the target today. The block has a way of editing that sentence overnight.`,
    ({ s }) => `This nomination tells ${s} they are outside. What ${s} does with that information decides the season.`,
    ({ s }) => `The speech said trust. The seat said hierarchy. Believe the seat.`,
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
const GENERIC_TAKES = [
  ({ s, k }) => `The ${k.toLowerCase()} is the headline. What it does to the numbers is the actual story.`,
  ({ s, k }) => `People are going to talk about ${s || 'that'} all week and miss what it cost.`,
  ({ s, k }) => `I have seen this exact thing go both ways. It usually comes down to who talks first afterwards.`,
  ({ s, k }) => `Small moment. Watch it matter in nine days.`,
];

/** What a member says under a host's message. Members react; they do not analyse. */
const COMMENTS = [
  'this is the only take i trust', 'ok but you would say that',
  'screaming. you called it before it aired', 'respectfully no',
  'i have watched this three times and you are right',
  'nobody asked but go off', 'this is why you are still my favourite',
  'genuinely never thought of it that way', 'the way this aged in ten minutes',
  'not you calling it a decision', 'ok legend', 'hard disagree and i will not explain',
  'saying what we were all thinking', 'this comment section is not ready',
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
  const usedFramesByLens = new Map();

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
      const pool = TAKES[ev.kind] || GENERIC_TAKES;
      if (!usedByKind.has(ev.kind)) usedByKind.set(ev.kind, new Set());
      const line = pickFresh(pool, rng, usedByKind.get(ev.kind))
        ({ s: subject, w, k: eventLabel(ev.kind, format) });

      // The same event sounds different from somebody who won through comps,
      // somebody who reached the end as the easy opponent, or somebody whose
      // canonical voice is openly villainous. Frames are seeded and fresh too.
      const lens = hostLens(host);
      if (!usedFramesByLens.has(lens)) usedFramesByLens.set(lens, new Set());
      const frame = rng() < 0.68
        ? pickFresh(LENS_FRAMES[lens], rng, usedFramesByLens.get(lens)) : '';

      // Roughly a third of messages lead with the credential that earns them.
      const creds = credential(host, w);
      const lead = creds.length && rng() < 0.34
        ? `${pickFresh(creds, rng, usedCreds)}, so hear me out. ` : '';

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
        text: lead + frame + line,
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
  for (const m of out) {
    const count = 2 + Math.floor(rng() * 60);
    m.commentCount = count;
    m.comments = Array.from({ length: Math.min(2, count) }, (_, i) => ({
      id: `${m.id}-c${i}`,
      author: `member${1 + Math.floor(rng() * 900)}`,
      text: pick(COMMENTS, rng),
    }));
    // A host answering back is the room's highest signal, so it is rare.
    m.hostReplied = rng() < 0.22;
  }

  return out;
}
