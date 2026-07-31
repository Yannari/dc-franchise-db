// Big Brother editorial voice layer. Mechanics decide what happened; this file
// decides how a particular person makes that moment feel like theirs.

const hashPick = (list, key) => {
  let hash = 2166136261;
  for (const ch of String(key)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return list[hash % list.length];
};

// Behavioral scenes, not catchphrases. Two seasons can introduce the same
// character differently without turning them into a different person.
const ARRIVALS = {
  Bowie: [
    `Bowie hugs the first three people through the door, laughs at the bedroom scramble, and quietly chooses the bed with a view of both exits. He is socializing. He is also taking attendance.`,
    `Bowie lets everyone else argue over beds while he studies who argues, who gives in, and who pretends not to care. His suitcase stays closed. His first read of the house does not.`,
  ],
  Chase: [
    `Chase finds a camera before he finds a bed and gives it a thumbs-up meant for an audience he cannot hear. Two people laugh. A third asks whether he is always like this.`,
    `Chase claims the room with the best light, explains why the light matters, and misses the fact that somebody else was already unpacking there. His first negotiation begins as an accident.`,
  ],
  Ripper: [
    `Ripper drops his bag on the biggest bed and calls it strategy. Nobody challenges him, partly because it is the first hour and partly because he has already taken his shoes off.`,
    `The storage-room door opens and Ripper disappears through it before the welcome champagne is poured. He returns eating something nobody else knew they had and refuses to say where the rest is.`,
  ],
  'Scary Girl': [
    `Scary Girl waves at every camera one by one. Not generally—individually, until she has found all of them. The room gets quieter around camera number nine.`,
    `Scary Girl chooses the bed furthest from the door and asks, very pleasantly, whether the cameras can see in the dark. Nobody answers. She seems happy with that.`,
  ],
  Nichelle: [
    `Nichelle enters like she has hit this mark before: smile, turn, names, eye contact. The performance is flawless until she has to wrestle her suitcase through the bedroom door.`,
    `Nichelle knows exactly how her entrance will look on television. What she cannot control is who takes the vanity beside her, and the first tiny crack in the smile arrives before dinner.`,
  ],
  Axel: [
    `Axel checks the exits, the pantry and the backyard before she picks a bed. When somebody asks what she is looking for, she says, “Weak points.” They laugh. She was not joking.`,
    `Axel starts reorganizing the food because eighteen people cannot live on cereal and vibes. Ripper objects from across the kitchen. The season's first territorial dispute takes forty-three minutes.`,
  ],
  Zee: [
    `Zee sits on the kitchen counter while everybody else sprints for bedrooms. By the time the beds are settled, he has eaten half a bowl of cereal and somehow heard four life stories.`,
    `Zee forgets where he left his bag, helps Wayne carry somebody else's, and ends up on the couch listening to an alliance pitch he does not realize is an alliance pitch.`,
  ],
  Brightly: [
    `Brightly produces snacks from her bag, learns who needs gluten-free food, and breaks up a bedroom argument without raising her voice. Ten minutes later she knows exactly who started it.`,
    `Brightly makes the kitchen feel like a classroom on the first day: everybody gets a question, nobody feels tested, and somehow she leaves with more answers than anyone else.`,
  ],
  Hicks: [
    `Hicks takes the last bed offered and says it suits him fine. While louder people perform their introductions, he watches who keeps checking the memory wall when a new face appears.`,
    `Hicks spends the first hour carrying bags and the second leaning against the kitchen island. He says almost nothing. By midnight, three people have told him who they already distrust.`,
  ],
  Emmah: [
    `Emmah loses a bedroom, wins the argument about closet space, and makes sure the whole house understands those were two separate contests.`,
    `Emmah arrives ready to be underestimated and gets annoyed when nobody does. Before the first toast, she has challenged one joke, one assumption and one person who interrupted her.`,
  ],
  Millie: [
    `Millie reads every name on the memory wall twice, then gets caught reading it a third time. She says she is bad with names. She is already attaching observations to all of them.`,
    `Millie picks a bed near the edge of the room and listens to everybody describe themselves. Her face gives away exactly one thought: none of these introductions are reliable evidence.`,
  ],
  Caleb: [
    `Caleb's entrance stops three conversations. He notices, pretends not to, and volunteers for the worst bed before anybody can accuse him of expecting the best one.`,
    `Caleb carries two suitcases upstairs at once. It is meant as a nice gesture; by the time he comes back down, the house has already promoted it into evidence.`,
  ],
  Wayne: [
    `Wayne introduces himself twice to the same person, laughs harder than they do, and starts a house tour despite knowing no more about the house than anyone following him.`,
    `Wayne gives up the bed he wanted because somebody says they called it first. Five minutes later he is cheering about the bed he got as though it won a championship.`,
  ],
  Raj: [
    `Raj stays close to Wayne until the bedroom scramble separates them, then has to introduce himself without a teammate beside him. The attempt is awkward, sincere and immediately effective.`,
    `Raj laughs at the wrong moment in the first group toast, goes bright red, and is rescued by three people laughing with him. His first social bond forms out of pure embarrassment.`,
  ],
  Julia: [
    `Julia loves the house, loves the cast and especially loves the camera angle over the kitchen island. The warmth lasts until somebody puts a suitcase in front of that camera.`,
    `Julia compliments six outfits in ten minutes and means at least two of them. When she finally sits down, she can already rank which compliments bought something back.`,
  ],
  Priya: [
    `Priya has trained for the competitions, the slop and the lack of sleep. She has not trained for eighteen people choosing beds at once, and this bothers her more than it should.`,
    `Priya finds the gym, tests one weight, and leaves before anyone can call it showing off. The problem is that four people watched her decide not to show off.`,
  ],
  MK: [
    `MK says the house is “nice” in a tone that gives the house a two-star review. While everyone poses by the memory wall, she checks which conversations happen just outside camera range.`,
    `MK takes the bed nobody wanted because it is closest to the hallway. She calls this laziness. It also happens to let her hear every late-night trip to the storage room.`,
  ],
  Damien: [
    `Damien walks through the door thrilled, terrified and visibly reconsidering every decision that led to the door. He asks where the emergency exit is before he asks where he sleeps.`,
    `Damien recognizes half the house as people he would never approach at a party. Unfortunately, this party has no phones, no closing time and a locked front door.`,
  ],
};

const FALLBACKS = {
  mastermind: [
    n => `${n} waits out the bedroom rush and takes the bed nobody noticed has a clear view of the hallway.`,
    n => `${n} asks where everyone is from, remembers every answer, and offers almost nothing in return.`,
  ],
  schemer: [
    n => `${n} is generous with compliments and careful with facts. By dinner, both habits have been noticed.`,
    n => `${n} joins three different first-night conversations and tells each group a slightly different version of the same story.`,
  ],
  villain: [
    n => `${n} makes one joke sharp enough to split the room between people who laugh and people who remember it.`,
    n => `${n} claims a good bed without asking. The first person to object becomes useful information.`,
  ],
  hero: [
    n => `${n} carries bags until everybody else has chosen a room, then discovers kindness has left exactly one bed.`,
    n => `${n} notices who has been standing alone and makes the first conversation easy for them.`,
  ],
  'social-butterfly': [
    n => `${n} turns unpacking into a kitchen-table conversation and somehow gets the whole room answering questions.`,
    n => `${n} has a nickname from somebody before the suitcases are open.`,
  ],
  'challenge-beast': [
    n => `${n} tries not to look too interested in the gym. Looking away from it so deliberately has the opposite effect.`,
    n => `${n} carries too much in one trip and immediately regrets giving the house a demonstration.`,
  ],
  'loyal-soldier': [
    n => `${n} makes one real connection while everybody else is trying to make six.`,
    n => `${n} gives up a bed, helps with a suitcase and accidentally looks like somebody worth keeping.`,
  ],
  underdog: [
    n => `${n} gets talked over twice, then lands the line everybody repeats at dinner.`,
    n => `${n} looks overwhelmed until somebody else admits they are overwhelmed too.`,
  ],
  goat: [
    n => `${n} loses track of the bedroom plan and ends up included in a conversation nobody intended to include them in.`,
    n => `${n} asks an innocent question that makes three strategic people suddenly stop talking.`,
  ],
  hothead: [
    n => `${n} has a strong opinion about the bedrooms before learning where the bathroom is.`,
    n => `${n} laughs loudly, talks louder and discovers the kitchen acoustics are not on anybody's side.`,
  ],
  wildcard: [
    n => `${n} opens the wrong door, finds a camera passage and wants to know whether it counts as a bedroom.`,
    n => `${n} starts a first-night game whose rules change halfway through and somehow gets everyone playing.`,
  ],
  'chaos-agent': [
    n => `${n} moves a decorative object six inches and starts an argument about whether it was better before.`,
    n => `${n} finds the most unnecessary button in the house and presses it before anyone can say not to.`,
  ],
  floater: [
    n => `${n} takes part in every introduction and leaves no conversation owing an answer.`,
    n => `${n} chooses the middle bed, the middle seat and a first-night position nobody can object to.`,
  ],
  'perceptive-player': [
    n => `${n} watches the bedroom scramble from the doorway and learns more than the people fighting over beds.`,
    n => `${n} notices the first pair before either member of the pair calls it one.`,
  ],
  showmancer: [
    n => `${n} makes one conversation last long enough for the rest of the house to begin narrating it.`,
    n => `${n} offers to share a dresser and creates the first rumor of the season by accident.`,
  ],
};

export function bbArrivalLine(name, { archetype = 'floater', season = '', slot = 0 } = {}) {
  const pool = ARRIVALS[name] || FALLBACKS[archetype] || FALLBACKS.floater;
  const chosen = hashPick(pool, `${season}|${name}|${slot}`);
  return typeof chosen === 'function' ? chosen(name) : chosen;
}

export const BB_CHARACTER_VOICE_CARDS = Object.freeze(Object.fromEntries(
  Object.keys(ARRIVALS).map(name => [name, { arrivals:ARRIVALS[name].length }]),
));

