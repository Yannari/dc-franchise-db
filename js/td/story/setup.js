// ══════════════════════════════════════════════════════════════════════
// td/story/setup.js — the line that sets a scene before anybody speaks
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-09: "wheres the narration setup" — Gabby: "Want the rest of mine?" at The
// Fishing Spot, with nothing to say who is where or doing what. 474 of 848 aired story scenes
// opened straight on dialogue. A scene that does not set itself gets a set-up line from where it is
// staged (places.js kinds) and the time of day: who finds whom, and what they were doing.
//
// {s1} is the first person to speak, {s2} the next, {all} everybody in it; {here} is the place
// with its preposition ("on the fishing rocks"). Every line is checked like a pool line (venue and
// time words, write.js placeOk), so nothing here puts firewood on the plane or breakfast at dusk.
// Nothing here is a fact about anyone: it is staging, not a choice anybody made.

// what s2 is doing when s1 arrives, by the kind of place (no possessives: no pronoun to get wrong)
export const DOING = {
  water: { any: ['skipping stones', 'watching the water', 'trying to catch something for dinner', 'rinsing out a shirt', 'sitting at the edge of the water', 'filling the water jugs'] },
  eat: { pre: ['picking at breakfast', 'scraping the bottom of the breakfast pot', 'eating breakfast on the end of a bench'],
    post: ['picking at dinner', 'scraping the bottom of the dinner pot', 'eating dinner slowly, not really hungry'], any: ['picking at a bowl of something grey'] },
  work: { any: ['sorting the supplies', 'fixing something that keeps breaking', 'cleaning up after everybody', 'hauling firewood', 'stacking firewood', 'carrying water up from the shore'] },
  fire: { pre: ['raking out last night\'s ashes', 'trying to get the fire going again'], post: ['feeding the fire', 'poking at the coals', 'sitting by the fire'] },
  sleep: { pre: ['only just awake', 'folding up a blanket', 'shaking out a sleeping bag'], post: ['lying down for a rest', 'folding up a blanket', 'trying and failing to nap'] },
  wash: { any: ['washing up', 'filling a water bottle', 'rinsing out a cup', 'splashing water around, trying to wake up'] },
  aside: { any: ['taking a break from everybody', 'sitting in the shade', 'killing time', 'doing nothing in particular', 'staring out at nothing', 'drawing in the dirt with a stick', 'retying a shoelace for the third time', 'counting clouds, apparently', 'hiding from the chores', 'eating something out of a pocket'] },
  public: { any: ['trying to look busy', 'watching everybody else work', 'pretending to read', 'stretching', 'people-watching', 'sorting out a tangle of rope', 'eating something out of a pocket'] },
  secret: { any: ['alone, well away from everybody', 'alone, where nobody else can hear', 'keeping well out of sight'] },
};

// what a group is doing together
export const GROUP = {
  water: ['skipping stones and killing time', 'sitting at the water\'s edge', 'trying, and failing, to catch fish'],
  eat: { pre: ['eating breakfast together'], post: ['eating dinner together'], any: ['eating together'] },
  work: ['getting the chores done', 'sorting through the supplies', 'hauling firewood'],
  fire: { pre: ['standing round the cold fire pit'], post: ['gathered round the fire', 'sitting round the fire as it gets dark'] },
  sleep: { pre: ['slowly waking up'], post: ['lying around, nobody quite ready to sleep'] },
  wash: ['taking turns at the water'],
  aside: ['sitting a little apart from the others', 'taking a break together'],
  public: ['standing around together', 'all talking over each other', 'hanging around with nothing much to do'],
  secret: ['huddled together where nobody can hear', 'well away from the others'],
};

// a pair: s1 comes to s2 ({doing} from DOING); a secret talk: s1 takes s2 somewhere quiet
export const PAIR = [
  '{s1} drops down next to {s2} {here}. {s2} is {doing}.',
  '{s1} heads over to {s2}, who is {doing} {here}.',
  '{s1} finds {s2} {here}, {doing}.',
  '{s2} is {here}, {doing}, when {s1} comes over.',
  '{s1} wanders over to {s2}, who is {here}, {doing}.',
  '{s1} sits down next to {s2} {here}. {s2} is {doing}.',
];
export const SECRET = [
  '{s1} pulls {s2} aside, {here}, well away from everybody.',
  '{s1} and {s2} talk quietly {here}, where nobody can overhear.',
  '{s1} catches {s2} alone {here}.',
  '{s1} waits until the others are busy, then finds {s2} {here}.',
  '{s1} and {s2} meet {here}, both checking over their shoulders first.',
  '{s1} follows {s2} {here}, keeping a few steps behind until they are out of sight.',
  '{s1} taps {s2} on the shoulder and nods towards the quiet. They end up {here}.',
  '{s2} is alone {here} when {s1} turns up, a little out of breath.',
  '{s1} and {s2} leave the camp one at a time, and meet up again {here}.',
  '{s1} finds {s2} {here}, and checks that nobody followed.',
];
export const CROWD = ['{all} are {here}, {doing}.', '{here_cap}, {all} are {doing}.'];
