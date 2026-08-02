// Big Brother editorial voice layer. Writing follows behavior and game state,
// never a hard-coded character biography, so every roster and custom cast works.

import { pronouns } from './players.js';

const hash = value => {
  let h=2166136261; for(const ch of String(value)) h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0; return h;
};

const A = {
  mastermind: [
    n=>`${n} waits out the bedroom rush and takes the bed with the clearest view of the hallway.`,
    n=>`${n} learns where everybody is from, remembers every answer and offers almost nothing in return.`,
    (n,p)=>`${n} volunteers to make the first pot of coffee. From the kitchen, every introduction comes to ${p.obj}.`,
    n=>`${n} lets the loudest people choose rooms first. Watching who follows whom is worth more than a good mattress.`,
    n=>`${n} studies the memory wall long enough for somebody to joke about a quiz. ${n} laughs, but keeps reading.`,
    n=>`${n} asks casual questions with suspiciously useful follow-ups. By dinner, the house has supplied a map.`,
    n=>`${n} joins the smallest conversation in the room and leaves just before it becomes an alliance.`,
    n=>`${n} offers to organize the food, which sounds helpful and happens to reveal who expects to be obeyed.`,
    (n,p)=>`${n} unpacks slowly, listening as first impressions harden into facts around ${p.obj}.`,
  ],
  schemer: [
    n=>`${n} compliments somebody's jacket. Five minutes later, the conversation has moved from shopping to who made a bad first impression.`,
    n=>`${n} joins three first-night conversations and tells each group a slightly different version of the same story.`,
    n=>`${n} gives up a desirable bed, then makes sure the new occupant remembers where the favor came from.`,
    n=>`${n} starts asking who everybody clicked with before anybody is ready to admit they clicked.`,
    n=>`${n} offers two people the same private reassurance. The rooms are not private enough for this to stay clever.`,
    n=>`${n} laughs with the kitchen group, agrees with the bedroom group and belongs to neither by midnight.`,
    n=>`${n} finds the first person feeling excluded and arrives with sympathy, information and excellent timing.`,
    n=>`${n} calls the first-night talk “just vibes” while quietly testing three possible voting blocs.`,
    n=>`${n} remembers every compliment received and, more importantly, who needed one returned.`,
  ],
  villain: [
    n=>`${n} makes one joke sharp enough to divide the room between people who laugh and people who remember it.`,
    n=>`${n} claims a good bed without asking. The first person to object becomes useful information.`,
    (n,p)=>`${n} announces ${p.sub} did not come to play scared. Nobody asked, and the room goes briefly quiet.`,
    n=>`${n} looks over the cast and says, “This is going to be easy.” Half the room hears confidence; half hears a target.`,
    (n,p)=>`${n} refuses the welcome toast until somebody finds a glass ${p.sub} actually likes. By dinner, everybody has heard about it.`,
    n=>`${n} asks who snores, who cooks and who cannot keep a secret, with equal concern for all three answers.`,
    n=>`${n} takes the center seat and never quite gives it back, even after everybody stands up.`,
    n=>`${n} compliments the house, criticizes the bedrooms and ranks the competition before the door locks.`,
    n=>`${n} responds to the first awkward silence by naming it. The silence gets worse; ${n} looks delighted.`,
  ],
  hero: [
    n=>`${n} carries bags until everybody else has chosen a room, then discovers kindness has left exactly one bed.`,
    n=>`${n} notices who is standing alone and makes the first conversation easy for them.`,
    n=>`${n} learns the kitchen before the gym and starts asking about allergies before alliances.`,
    n=>`${n} gives up closet space to settle the first argument. Two people appreciate it; one files it under jury management.`,
    n=>`${n} makes a point of greeting the person everybody else talked over. The cameras are not the only ones watching.`,
    n=>`${n} turns an awkward group toast into something sincere enough that nobody makes fun of it.`,
    n=>`${n} takes the bed nobody wants so the bedroom argument can end. Two people thank ${n}; a third quietly decides ${n} is safe.`,
    n=>`${n} checks whether everyone has eaten. It is genuine, useful and already being interpreted as strategy.`,
    n=>`${n} breaks up a bedroom dispute without choosing a side, then worries both sides think they did.`,
  ],
  'social-butterfly': [
    n=>`${n} turns unpacking into a kitchen-table conversation and gets the whole room answering questions.`,
    n=>`${n} has a nickname from somebody before the suitcases are open.`,
    n=>`${n} learns the cast in clusters: hometowns, jobs, exes and who laughed at whose story.`,
    n=>`${n} enters one bedroom alone and leaves with six people discussing a group costume.`,
    n=>`${n} introduces two strangers who entered ten minutes earlier and somehow makes the introduction feel necessary.`,
    n=>`${n} keeps a first-night story alive through three rooms and improves the ending in each one.`,
    n=>`${n} settles in the middle of the couch and keeps pulling new arrivals into the same conversation until the room finally feels like a party.`,
    (n,p)=>`${n} knows who needs space, who needs attention and who resents how quickly ${p.sub} worked that out.`,
    n=>`${n} makes everybody feel remembered. By bedtime, several people mistake that feeling for a final two.`,
  ],
  'challenge-beast': [
    n=>`${n} tries not to look interested in the gym. Looking away from it so deliberately has the opposite effect.`,
    n=>`${n} carries too much in one trip and immediately regrets giving the house a demonstration.`,
    n=>`${n} asks about the backyard before the bedrooms. Three people exchange the same worried glance.`,
    n=>`${n} tests the pull-up bar once, casually, while making sure never to test it again in public.`,
    (n,p)=>`${n} volunteers for the heaviest suitcase and hears somebody whisper “first boot” behind ${p.obj}.`,
    n=>`${n} studies the house like the first competition might be hidden inside it.`,
    n=>`${n} claims exhaustion from move-in day, then reorganizes half the storage room without sitting down.`,
    n=>`${n} asks whether anyone wants to work out tomorrow. The silence is a complete strategic briefing.`,
    n=>`${n} loses the race for a bed and looks more bothered by losing than by the bed itself.`,
  ],
  'loyal-soldier': [
    n=>`${n} makes one real connection while everybody else is trying to make six.`,
    n=>`${n} gives up a bed and helps with a suitcase. The person receiving both favors stays beside ${n} at dinner.`,
    n=>`${n} finds the first person who speaks plainly and stays close for the rest of the night.`,
    (n,p)=>`${n} promises to save a seat at dinner. It is a tiny promise, and the fact ${p.sub} keeps it matters.`,
    n=>`${n} gets pulled into a bedroom group and immediately starts treating the group like a team.`,
    n=>`${n} remembers who made room on the couch and quietly decides that favor will be returned.`,
    n=>`${n} listens to one person's whole story instead of collecting pieces from everybody else's.`,
    n=>`${n} chooses trust early, visibly and with more certainty than the house has earned.`,
    n=>`${n} shakes on a first-night agreement that everybody else would have left deliberately vague.`,
  ],
  underdog: [
    n=>`${n} gets talked over twice, then lands the line everybody repeats at dinner.`,
    n=>`${n} looks overwhelmed until somebody else admits they are overwhelmed too.`,
    n=>`${n} loses every good bed and turns the worst corner of the room into the place people keep visiting.`,
    n=>`${n} enters expecting not to fit and is startled when the first conversation proves otherwise.`,
    n=>`${n} laughs off a clumsy introduction, which makes the room relax faster than a perfect one would have.`,
    n=>`${n} gets underestimated before the suitcase reaches the floor and notices exactly who does it.`,
    n=>`${n} stays near the edge of the welcome circle until somebody moves over without being asked.`,
    n=>`${n} admits to being nervous. Half the house finds it relatable; the other half calls it weakness.`,
    (n,p)=>`${n} asks where ${p.sub} should put ${p.posAdj} bag and receives three contradictory answers. The confusion finally gives ${n} somebody to laugh with.`,
  ],
  goat: [
    (n,p)=>`${n} loses track of the bedroom plan and gets included in a conversation nobody meant to include ${p.obj} in.`,
    n=>`${n} asks an innocent question that makes three strategic people stop talking.`,
    n=>`${n} forgets two names, invents a nickname and accidentally makes it stick.`,
    n=>`${n} offers everybody the same vague deal. Several people accept because it sounds harmless.`,
    n=>`${n} chooses a bed based on the blanket color and leaves the strategists searching for a deeper explanation.`,
    n=>`${n} wanders into the first alliance discussion looking for the bathroom and stays for snacks.`,
    (n,p)=>`${n} misunderstands the room assignment and ends up in the bed everybody had already decided ${p.sub} should take.`,
    (n,p)=>`${n} admits ${p.sub} has no first-night plan. Three people immediately start picturing where ${n} could fit into theirs.`,
    n=>`${n} contributes almost nothing to the opening conversation and still leaves it universally liked.`,
  ],
  hothead: [
    n=>`${n} has a strong opinion about the bedrooms before learning where the bathroom is.`,
    n=>`${n} laughs loudly, talks louder and discovers the kitchen acoustics are not on anybody's side.`,
    n=>`${n} calls somebody out for interrupting during the first round of introductions. It was an accident; the reaction is not.`,
    (n,p)=>`${n} loses the bed ${p.sub} wanted by ten seconds and argues the call like there should be instant replay.`,
    n=>`${n} starts a playful argument that stops being playful one response earlier than expected.`,
    (n,p)=>`${n} says ${p.sub} values honesty, then demonstrates with a first impression nobody requested.`,
    n=>`${n} declares the kitchen organization ridiculous and begins fixing it at full volume.`,
    n=>`${n} reacts to being called intense by becoming noticeably more intense.`,
    n=>`${n} is warm, funny and completely unfiltered long enough to make one friend and one enemy before dinner.`,
  ],
  wildcard: [
    n=>`${n} opens the wrong door, finds a camera passage and asks whether it counts as a bedroom.`,
    n=>`${n} starts a first-night game whose rules change halfway through and gets everyone playing anyway.`,
    n=>`${n} chooses a bed by spinning in a circle and pointing, disrupting two careful bedroom plans.`,
    n=>`${n} brings something nobody expected into the house and refuses to explain why it was essential.`,
    n=>`${n} gives the cameras a house tour despite having arrived twelve minutes ago.`,
    n=>`${n} proposes a midnight costume party before everybody has found their pajamas.`,
    n=>`${n} answers a basic introduction question with a story that creates six more questions.`,
    n=>`${n} rearranges the welcome snacks into a ranking of the cast and insists it means nothing.`,
    n=>`${n} picks the room everybody rejected and convinces half the house it was secretly the best one.`,
  ],
  'chaos-agent': [
    n=>`${n} moves a decorative object six inches and starts an argument about whether it looked better before.`,
    n=>`${n} finds the most unnecessary button in the house and presses it before anyone can object.`,
    n=>`${n} tells two people that each claimed the same bed first, then watches the dispute from the doorway.`,
    n=>`${n} invents a rumor about a hidden room to see who immediately starts searching.`,
    n=>`${n} changes the labels on two suitcases. The joke lasts three minutes; the suspicion lasts longer.`,
    n=>`${n} proposes drawing bedrooms from a hat after everybody has already chosen. Somehow, a vote begins.`,
    n=>`${n} announces a fake house rule with enough confidence that production has to correct it.`,
    n=>`${n} begins counting cameras aloud and deliberately skips one. Several people spend the night looking for it.`,
    n=>`${n} turns the first group photo into an argument over who is standing in the middle.`,
  ],
  floater: [
    n=>`${n} takes part in every introduction and leaves no conversation owing an answer.`,
    n=>`${n} chooses the middle bed, middle seat and a first-night position nobody can object to.`,
    n=>`${n} helps in the kitchen, visits each bedroom and belongs everywhere just long enough.`,
    n=>`${n} agrees that every room is the best room, depending entirely on who is asking.`,
    n=>`${n} lets other people supply the gossip and rewards each of them with excellent listening.`,
    n=>`${n} never starts a first-night conversation, but appears in the doorway whenever one becomes useful.`,
    n=>`${n} accepts the last available bed as though it was the plan from the beginning.`,
    n=>`${n} gives the house enough warmth to feel safe and too little information to be placed.`,
    n=>`${n} leaves bedtime with no obvious enemy, no obvious partner and several invitations for tomorrow.`,
  ],
  'perceptive-player': [
    n=>`${n} watches the bedroom scramble from the doorway and learns more than the people fighting over beds.`,
    n=>`${n} notices the first pair before either member calls it one.`,
    n=>`${n} catches who looks at whom when the word “alliance” is used as a joke.`,
    n=>`${n} remembers not just everybody's name but whose name each person forgets.`,
    n=>`${n} chooses a quiet seat with a reflection of the hallway in the television.`,
    n=>`${n} listens to the welcome stories and notices which details sound rehearsed.`,
    n=>`${n} spots the first fake laugh of the season and then watches who copies it.`,
    n=>`${n} says very little until one precise observation makes two people reconsider the room.`,
    n=>`${n} notices who offers help only when a camera is pointed in the right direction.`,
  ],
  showmancer: [
    n=>`${n} makes one conversation last long enough for the house to begin narrating it.`,
    n=>`${n} offers to share a dresser and creates the first rumor of the season by accident.`,
    (n,p)=>`${n} chooses a bed only after asking one particular person where ${p.sub} should put ${p.posAdj} suitcase.`,
    n=>`${n} forgets the room during one introduction and remembers every detail of the person giving it.`,
    n=>`${n} volunteers for kitchen duty only after seeing who else volunteered.`,
    n=>`${n} spends the first toast holding eye contact across the circle one second too long.`,
    n=>`${n} finds a reason to continue one conversation after everybody else has gone to unpack.`,
    n=>`${n} laughs at the same person's jokes often enough that the rest of the house starts counting.`,
    n=>`${n} insists there will be no showmance this season before anybody has suggested one.`,
  ],
};

// Four additional observations per archetype. These stay separate from the
// original pools so future writing passes can be reviewed without disturbing
// the deterministic no-repeat selection.
const ARRIVAL_ADDITIONS = {
  mastermind: [
    n=>`${n} takes the last open seat at the kitchen table and lets everybody else explain why they chose theirs.`,
    n=>`${n} asks who wants coffee in the morning. The answers reveal the early risers, the late sleepers and the people already volunteering to help.`,
    n=>`${n} notices which bedroom has the fewest strong personalities and puts a suitcase there without making an announcement.`,
    n=>`${n} loses a name during introductions, asks again and remembers who answers on that person's behalf.`,
  ],
  schemer: [
    n=>`${n} tells one bedroom that the kitchen group seems tight, then tells the kitchen that the bedrooms have already divided. Both conversations grow more serious.`,
    n=>`${n} offers to trade beds and waits to hear what the other person will include in the bargain.`,
    n=>`${n} asks two people separately what they thought of the same introduction. By dinner, ${n} knows which version is safer to repeat.`,
    n=>`${n} shares one harmless piece of gossip and follows it through the house to see where it comes back changed.`,
  ],
  villain: [
    n=>`${n} looks at the smallest bedroom, calls it “the losers' room,” and immediately learns who can take a joke.`,
    n=>`${n} asks everybody for an honest first impression, then objects to the first answer that is actually honest.`,
    n=>`${n} claims the best drawer after losing the best bed. Nobody stops it, but everybody notices.`,
    n=>`${n} gives the welcome toast a competitive edge and leaves half the circle wondering whether they were just threatened.`,
  ],
  hero: [
    n=>`${n} is halfway through unpacking when somebody asks for help, and the suitcase stays open for the next hour.`,
    n=>`${n} notices one plate missing from the table and finds the person who has not come out of the bedroom yet.`,
    n=>`${n} learns one houseguest's name twice rather than pretending to remember it once. The honesty lands well.`,
    n=>`${n} talks two people through a closet dispute, then stores half of ${n}'s clothes under the bed to make the solution work.`,
  ],
  'social-butterfly': [
    n=>`${n} starts in the kitchen, gets pulled into a bedroom story and returns with three more people than before.`,
    n=>`${n} discovers two houseguests grew up near each other and treats the coincidence like the evening's headline.`,
    n=>`${n} asks for everyone's worst habit. The answers are funny; who refuses to answer is more interesting.`,
    n=>`${n} is invited into both bedroom photos and somehow appears in neither group's discussion of threats.`,
  ],
  'challenge-beast': [
    n=>`${n} catches a falling suitcase one-handed. The room reacts before ${n} can pretend it was nothing.`,
    n=>`${n} asks how long the backyard stays closed and immediately regrets sounding so interested.`,
    n=>`${n} chooses the top bunk without using the ladder. One person laughs; two people update their threat list.`,
    n=>`${n} turns carrying groceries into a team task and pays close attention to who tries to compete.`,
  ],
  'loyal-soldier': [
    n=>`${n} makes room for the same person twice—once in the bedroom and again at the table. The second time feels deliberate.`,
    n=>`${n} is asked for a first impression and protects the person who confided in ${n} ten minutes earlier.`,
    n=>`${n} helps one houseguest unpack completely and misses most of the room-hopping happening elsewhere.`,
    n=>`${n} ends the night on the same couch where the first honest conversation began.`,
  ],
  underdog: [
    n=>`${n} arrives during the loudest conversation of the night and waits long enough for somebody to finally make space.`,
    n=>`${n} drops a suitcase in front of everyone, laughs first and turns an awkward entrance into the room's easiest moment.`,
    n=>`${n} is the last person invited into the bedroom photo and the first person somebody seeks out afterward.`,
    n=>`${n} admits to feeling out of place. The person beside ${n} quietly admits the same thing.`,
  ],
  goat: [
    n=>`${n} asks whether the Head of Household gets a bigger closet. The strategists laugh, then realize ${n} has changed the subject at exactly the right time.`,
    n=>`${n} offers to sleep anywhere and becomes the easiest person to include in three different bedroom plans.`,
    n=>`${n} mistakes a serious alliance joke for an actual joke. Everyone laughs harder than the line deserves.`,
    n=>`${n} spends twenty minutes looking for a missing bag that has been beside the couch the entire time. Two people help anyway.`,
  ],
  hothead: [
    n=>`${n} hears “calm down” before dinner and correctly points out that nobody has ever calmed down after hearing it.`,
    n=>`${n} takes charge of the bedroom vote, loses it and demands to know when it became a vote.`,
    n=>`${n} defends somebody from a joke more fiercely than the person being teased wanted or needed.`,
    n=>`${n} burns the first batch of food, blames the stove and wins back the room by making fun of the disaster.`,
  ],
  wildcard: [
    n=>`${n} packs an outfit specifically for the first night and changes into it before learning everybody's names.`,
    n=>`${n} decides the decorative chessboard should determine sleeping arrangements. Nobody agrees, but the game still gets played.`,
    n=>`${n} finds the storage-room costume box and returns wearing something production clearly did not intend for move-in.`,
    n=>`${n} asks the camera for advice during the bedroom scramble, waits for an answer and claims to receive one.`,
  ],
  'chaos-agent': [
    n=>`${n} starts an argument over whether the house clock is already wrong. Nobody knows the real time well enough to end it.`,
    n=>`${n} tells the kitchen that somebody called a house meeting. By the time everyone gathers, nobody can identify who supposedly called it.`,
    n=>`${n} hides one of the welcome champagne bottles and leads the search with remarkable enthusiasm.`,
    n=>`${n} suggests everybody reveal their first target as an icebreaker. The laughter arrives half a second late.`,
  ],
  floater: [
    n=>`${n} helps one room move a dresser, helps another divide the drawers and avoids being claimed by either.`,
    n=>`${n} agrees to an early breakfast with one group and a late-night snack with another. Neither invitation feels like a commitment.`,
    n=>`${n} listens to two incompatible versions of the bedroom dispute and gives each teller exactly enough agreement.`,
    n=>`${n} reaches bedtime having spent real time with everyone and private time with almost nobody.`,
  ],
  'perceptive-player': [
    n=>`${n} notices who stops talking when each new person enters and remembers the pattern.`,
    n=>`${n} watches one houseguest offer the same compliment three times and pays attention to which version sounds sincere.`,
    n=>`${n} spots the first conversation that continues through an interruption. That pair goes onto an early mental list.`,
    n=>`${n} asks one question about the bedroom argument and hears enough in the answer to avoid both sides.`,
  ],
  showmancer: [
    n=>`${n} asks the group a question and spends the answer looking at only one person. The rest of the couch notices.`,
    n=>`${n} offers to help with a suitcase and is still in that bedroom when everybody else has finished unpacking.`,
    n=>`${n} chooses the seat beside the same person at dinner and during the welcome toast. By the second time, it looks like a choice.`,
    n=>`${n} learns one person's entire dating history before learning which drawer is available.`,
  ],
};

Object.entries(ARRIVAL_ADDITIONS).forEach(([archetype, lines]) => A[archetype].push(...lines));

const STAT_ANGLES = {
  physical:n=>`The gym gets one quick glance—quick enough to be noticed.`,
  endurance:n=>`${n} is still carrying bags after everybody else has decided move-in is over.`,
  mental:n=>`${n} reads every label and house rule before opening the suitcase.`,
  strategic:(n,p)=>`${n} asks where everybody wants to sleep. Before long, people are also telling ${p.obj} who they hope ends up in the other room.`,
  social:n=>`By the first toast, three people are already saving ${n} a seat.`,
  intuition:n=>`${n} changes rooms after one look at who has settled beside whom.`,
  boldness:n=>`${n} volunteers an opinion before the room has agreed it is safe to have one.`,
  loyalty:n=>`${n} remembers the first person who made space and treats the gesture like it matters.`,
  temperament:n=>`When the bedroom scramble gets tense, ${n} is the one person who does not speed up.`,
};

const cache = new Map();
export function resetBBArrivalWriting(season='') { cache.delete(season); }

export function bbArrivalLine(name,{ archetype='floater',season='',slot=0,stats={} }={}) {
  const pool=A[archetype]||A.floater;
  if(!cache.has(season)) cache.set(season,{ byName:new Map(), used:new Set() });
  const state=cache.get(season); if(state.byName.has(name)) return state.byName.get(name);
  let index=hash(`${season}|${archetype}|${name}|${slot}`)%pool.length;
  for(let i=0;i<pool.length;i++) { const candidate=(index+i)%pool.length; if(!state.used.has(`${archetype}:${candidate}`)){ index=candidate; break; } }
  let text=pool[index](name,pronouns(name));
  const ranked=Object.entries(stats||{}).filter(([,v])=>Number.isFinite(Number(v))).sort((a,b)=>Number(b[1])-Number(a[1]));
  if(ranked[0]&&Number(ranked[0][1])>=8&&STAT_ANGLES[ranked[0][0]]) text+=` ${STAT_ANGLES[ranked[0][0]](name,pronouns(name))}`;
  state.byName.set(name,text); state.used.add(`${archetype}:${index}`); return text;
}

export const BB_ARRIVAL_VARIANT_COUNTS=Object.freeze(Object.fromEntries(Object.entries(A).map(([k,v])=>[k,v.length])));

export function describeBBCampaignReaction(pitch={},response={},rng=Math.random) {
  const voter=response.voter||'The voter',target=pitch.pitchTarget||'the other nominee',pitcher=pitch.pitcher||'The nominee';
  const choose=lines=>lines[Math.min(lines.length-1,Math.floor(rng()*lines.length))]; let tone='guarded',text;
  if(['caught-exaggeration','impossible-numbers'].includes(response.reason)){tone='skeptical';text=`${voter} makes ${pitcher} count the votes out loud. The list includes one person twice, and the meeting never recovers.`;}
  else if(response.reason==='protecting-target'){tone='cold';text=`${voter}'s face changes when ${target} is named. The conversation ends politely; the warning reaches ${target} less politely.`;}
  else if(response.reason==='does-not-save-me'){tone='numbers-focused';text=`${voter} asks the only question that matters: “What does evicting ${target} do for me?” ${pitcher} does not have a short answer.`;}
  else if(response.reason==='strong-plan-not-replaced'){text=`${voter} hears the pitch, nods in the right places and keeps returning to the vote already promised. ${pitcher} leaves without a name.`;}
  else if(response.reason==='chose-stronger-coalition'){tone='distracted';text=`${voter} listens while tracking a second conversation in the mirror behind ${pitcher}. There are two campaigns in the room.`;}
  else if((response.acceptChance||0)+(response.accepted?.22:-.06)>=.55){tone='receptive';text=choose([`${voter} shuts the bedroom door and asks ${pitcher} to count the votes again—slowly. It is the first sign the pitch might move.`,`${voter} never says yes. ${voter} does ask who takes the shot after ${target} leaves, which is a more useful answer.`]);}
  else if((response.acceptChance||0)>=.28){tone='uncertain';text=choose([`${voter} lets ${pitcher} finish, then offers the safest sentence in Big Brother: “I'll see where the house is.”`,`${voter} asks careful questions and gives careless answers. ${pitcher} cannot tell whether the vote moved or became harder to read.`]);}
  else {tone='unreceptive';text=choose([`${voter} listens with one hand already on the door. ${pitcher} gets courtesy, not a vote.`,`${target}'s name is barely out before ${voter} defends the existing plan. The pitch ends before the meeting does.`]);}
  if(response.leaked) text+=` Before ${pitcher} reaches the next room, somebody else knows the pitch.`;
  return {tone,text,badgeText:response.leaked?'PITCH LEAKED':'VOTE CHECK',badgeClass:response.leaked?'red':tone==='receptive'?'gold':'purple'};
}

export function summarizeBBCampaignReactions(pitch={},responses=[]) {
  if(!responses.length)return `${pitch.pitcher} finds no private opening before the vote.`;
  const yes=responses.filter(r=>r.accepted).map(r=>r.voter),leaks=responses.filter(r=>r.leaked).map(r=>r.voter);
  const join=n=>n.length<2?n[0]:n.length===2?`${n[0]} and ${n[1]}`:`${n.slice(0,-1).join(', ')}, and ${n.at(-1)}`; const parts=[];
  if(yes.length)parts.push(`${join(yes)} appears willing to evict ${pitch.pitchTarget}`); const no=responses.filter(r=>!r.accepted).map(r=>r.voter);
  if(no.length)parts.push(`${join(no)} gives no usable promise`); if(leaks.length)parts.push(`the pitch leaks through ${join(leaks)}`); return `${parts.join('; ')}.`;
}
