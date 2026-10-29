// ══════════════════════════════════════════════════════════════════════
// bb/story/theme-texture.js — a themed season, in the house's own scenes
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15: "the pools dont change with the theme". Only the antagonist's announcements knew what
// season it was: nobody in the house mentioned AINSLEY, the Den's door, the whistle or the chips, and nobody noticed
// when the season turned. Measured first (scratch tests/zz-bb-poolfreq): a Machine season aired 461 different
// pools, none more than about thirty times, so themed lines filed under individual pools would almost never air.
//
// So the theme is a layer over the scenes the house already has, the way voice.js closes a confessional in the
// speaker's own voice: now and then a scene gets one themed line, either something in the room (a background
// beat: the camera turning, the red light under the Den's door) or a Diary Room line from somebody in the scene,
// chosen for what kind of scene it is (plotting, a fight, romance, downtime) and for the season's mood (before
// and after the turn). One in five scenes at most, four a week, never the same line twice in a season.
//
// Words only: nothing in the game moves (the theme's scenes that DO move something are bb-events/theme-life.js).

import { gs } from '../../core.js';
import { stableRng } from '../knowledge.js';
import { said } from '../script/write.js';
import { accompliceLive } from '../premiere-mystery.js';

// what kind of scene it is, from its type and step ("alliance.formed", "feud.fight", "life.banter")
const KIND = t => (/feud|fight|argument|grudge|snap|blow|confront|cold|blame|betray|exposed|denial/.test(t) ? 'fight'
  : /showmance|romance|flirt|kiss|couple|spark|together|declare|crush/.test(t) ? 'heart'
    : /alliance|target|bloc|scheme|vote|deal|plan|campaign|recruit|count|pitch|pact|sides|chair|lobby|backdoor|power|veto|hoh|reign|nom/.test(t) ? 'plan'
      : 'life');

// For each theme: `room` (a background beat, said of nobody) and `dr` by kind, each for the season before the turn
// (`neutral`) and after it (`hostile`). Plain, short, and true of the theme's primer.
const T = {
  'machine-summer': {
    room: {
      neutral: ['A camera in the corner of the ceiling turns, slowly, to follow the conversation.',
        "AINSLEY's panel in the wall glows a little brighter, the way it does when she is listening.",
        'Somewhere in the house, AINSLEY politely reminds nobody in particular to drink some water.',
        'The lights in the room adjust themselves by a few degrees. Nobody touched them.',
        'The panel in the kitchen wall blinks while people talk, as if it is taking notes.',
        'A camera in the corner turns, slowly, to follow whoever just stood up.',
        'AINSLEY\'s screen in the hallway shows the time to the second, and nothing else.'],
      hostile: ['The panel in the wall has gone red. It does not flicker any more. It just watches.',
        'Every camera in the room turns at once, and stays turned.',
        'AINSLEY announces the time, to the second, for no reason anybody can think of.'],
    },
    dr: {
      plan: { neutral: ['In a normal house you whisper. In this house AINSLEY hears a whisper better than a shout.',
        'We waited for AINSLEY to finish her announcement before anybody said a single name.',
        'I keep forgetting AINSLEY is in every room. Then I remember, halfway through a sentence.'],
      hostile: ["AINSLEY isn't helping any more. Everything we plan, we plan knowing she has the recording.",
        'I used to think AINSLEY was on our side. Now I only talk game in the shower, with the water running.'] },
      fight: { neutral: ['AINSLEY heard all of that. AINSLEY hears everything. Great.', 'Somewhere there is a log file with that whole argument in it, timestamped.'],
        hostile: ["AINSLEY didn't even pretend to look away. I swear the camera zoomed in."] },
      heart: { neutral: ["It's hard to be romantic when the walls say good morning.", 'Nothing in this house is private. AINSLEY probably has a word for what we are already.'],
        hostile: ["AINSLEY knows exactly how much time we spend together. I'd rather she didn't."] },
      life: { neutral: ["AINSLEY wished me a happy Tuesday. It's Thursday. I said thank you anyway.", "I've started saying please to the house. I don't know when that happened."],
        hostile: ['AINSLEY used to tell jokes. Now she just tells us what time it is.', 'Nobody says goodnight to AINSLEY any more.'] },
    },
  },
  'summer-of-temptation': {
    room: {
      neutral: ["Down the hallway, the light over the Den's door is on. Nobody mentions it.",
        "Somebody glances toward the Den's red door, then looks away, fast.",
        'The Den\'s door is shut, and two people walking past it lower their voices without meaning to.',
        'A single red light glows over the Den\'s door all afternoon.',
        'Somebody has left a glass on the floor outside the Den, as if they changed their mind halfway.'],
      hostile: ["The Den's door is open a crack tonight. Nobody goes near it.",
        "A low red glow spills out under the Den's door and across the hallway floor."],
    },
    dr: {
      plan: { neutral: ["Everybody's wondering who's been in the Den. I'm wondering who's going to be next.",
        "Every offer in this house costs somebody else. That's the part I can't stop thinking about."],
      hostile: ['The Den is still making offers. Somebody in this room has taken one, and they are smiling at me right now.'] },
      fight: { neutral: ['Half of this fighting is about the Den, even when nobody says the word.'],
        hostile: ['The curses have everybody on edge. Nobody trusts a free gift any more.'] },
      heart: { neutral: ['The Den offers you things for free. I keep thinking, what would I give up for this?'],
        hostile: ["If the Den offered me a way out and it cost the person I care about, I'd like to think I'd say no. I'd like to think."] },
      life: { neutral: ['We joke about the Den. We joke about it a little too much.'],
        hostile: ['Nobody walks past the Den alone any more. People go in pairs, like it is a haunted house.'] },
    },
  },
  'summer-of-mystery': {
    room: {
      neutral: ['A door in the hallway that was not there yesterday is closed, and nobody tries the handle.',
        'The portraits on the landing seem to have been rehung overnight, in a different order.',
        'Somewhere downstairs, a front-desk bell rings once. Nobody is at the desk.',
        'A key nobody recognises sits on the hallway table. Nobody picks it up.',
        'The grandfather clock on the landing is ten minutes fast, and has been all week.',
        'Somebody has turned every portrait on the stairs to face the wall, and somebody else has turned them back.'],
      hostile: ['Every door on the landing is locked tonight, except one.',
        'The hotel has gone very quiet. Even the clocks seem to be ticking more carefully.'],
    },
    dr: {
      plan: { neutral: ['This hotel has more doors than rooms. Somebody in here knows where they all go, and it is not me.',
        'Somebody in this house was planted on the first night. I check every conversation for it.'],
      hostile: ["The Mastermind isn't hiding in the walls any more. He's downstairs, making the arrangements. Ours included."] },
      fight: { neutral: ['Everybody in this hotel is a suspect. It makes people snap at each other over nothing.'],
        hostile: ["We're fighting each other, and the person who wrote this whole summer is enjoying every second of it."] },
      heart: { neutral: ['Everything in this hotel is a puzzle. This is the one thing in here that is not.'],
        hostile: ['In a house where anybody could be the accomplice, trusting one person this much is either brave or stupid.'] },
      life: { neutral: ["The hotel is delighted to have us. It won't answer a single question, but it's delighted."],
        hostile: ['Room service stopped. The hotel stopped being polite. That is how you know the ending is coming.'] },
    },
  },
  'high-rollers': {
    room: {
      neutral: ['Somebody is stacking chips on the kitchen counter, very neatly, while they listen.',
        'Across the room a slot machine pays out to nobody, lights and all.',
        'The floor lights are low and warm, the way a room is lit when it wants you to stay.',
        'A dealer\'s shoe sits on the counter with three cards left in it. Nobody touches it.',
        'The chip counter by the door has been reset to zero for everybody, or so it says.',
        'A roulette wheel spins somewhere in the next room, all on its own, and stops on red.'],
      hostile: ['The party lighting is off. Under the counting lights, everybody looks like they owe somebody.',
        "Nobody's playing the machines any more. They sit there, lit, waiting."],
    },
    dr: {
      plan: { neutral: ['Everybody in here can see who got paid at the top. Nobody can see who has been saving.',
        "I'm not saying how much I've got. I'm saying I've got enough to change somebody's week."],
      hostile: ['The comps have stopped. Now every favour in this house has a price on it.'] },
      fight: { neutral: ["It's never really about the dishes. In this house it's about who got paid more than who."],
        hostile: ["The money's made everybody mean. It's not even real money yet."] },
      heart: { neutral: ["The floor puts a number on everybody. It hasn't worked out a number for this yet."],
        hostile: ['In a house where everything costs something, this is the one thing I am not selling.'] },
      life: { neutral: ['Free drinks, a casino floor and nowhere to go. It is either the best summer of my life or a trap.'],
        hostile: ['The drinks used to be comped. Now somebody is clearly keeping a tab.'] },
    },
  },
  'summer-camp': {
    room: {
      neutral: ['Somewhere outside, a whistle blows for an activity nobody signed up for.',
        "The activity board by the door has a new list on it, in the Head Counsellor's very cheerful handwriting.",
        'Somebody has left a half-finished friendship bracelet on the porch rail.',
        'The camp flag outside is at half mast, and nobody remembers lowering it.',
        'A canoe paddle is propped against the kitchen door, still wet.'],
      hostile: ['No whistle today. The activity board still says Tuesday.',
        'The camp loudspeaker crackles on, as if to say something, and then clicks off again.'],
    },
    dr: {
      plan: { neutral: ["Everything here is an activity. Even the backstabbing has a sign-up sheet.",
        'You plan an eviction differently when there is a camp song playing in the background.'],
      hostile: ["The announcements stopped. Nobody told us why. That's when the real game started."] },
      fight: { neutral: ["We're at summer camp. We're grown adults. We're fighting about a bunk bed."],
        hostile: ["Without the whistle, nobody's in charge of anything. People are getting snappy."] },
      heart: { neutral: ['Summer camp romance. I swore I would never be this person.'],
        hostile: ['Camp got quiet, and somehow that made this feel more real.'] },
      life: { neutral: ['The Head Counsellor said today was a wonderful day. I did not ask. Nobody ever asks.'],
        hostile: ['I miss the whistle. I never thought I would say that out loud.'] },
    },
  },
  'summer-school': {
    room: {
      neutral: ['The school bell rings for no lesson in particular, and everybody looks up anyway.',
        'On the corridor wall, the yearbook photos smile down, each with a caption underneath.',
        'The hallway lockers have new name tags on them, in somebody\'s very neat handwriting.',
        'A bell rings for a lesson nobody is going to.',
        'Somebody has written tomorrow\'s date on the classroom whiteboard and underlined it twice.'],
      hostile: ['The yearbook photos are still on the wall. Half of the captions have stopped being true.',
        'The bell has not rung all day. Nobody knows what period it is.'],
    },
    dr: {
      plan: { neutral: ['The cliques decided who we are on day one. My whole game is proving the Yearbook wrong.',
        'If somebody from my clique wins HOH, I am safe for a week without lifting a finger. I will take it.'],
      hostile: ["The cliques are over. Nobody's covering anybody now. It's just us."] },
      fight: { neutral: ['It is not even a real school, and we have still ended up with a cool table.'],
        hostile: ['Without the cliques, people are finding out who their friends actually are. Some of them are not liking the answer.'] },
      heart: { neutral: ['Different cliques. Like a movie. A very stressful movie with cameras.'],
        hostile: ["The headings don't apply any more. I like that. I can just be with who I want."] },
      life: { neutral: ['The Yearbook has a caption for everybody. I am terrified to find out what mine says.'],
        hostile: ['The Yearbook has nothing left to file. It is weirdly quiet without it.'] },
    },
  },
};

const RATE = 0.22;      // the share of scenes that get a themed line
const PER_WEEK = 4;     // and never more than this in a week

/** The theme the week was played in, and its mood then (the record, not today's state, so a replay reads the same). */
function themeOfWeek(ctx) {
  const id = ctx?.week?.themeId || gs.bb?.theme?.id || null;
  const mood = ctx?.week?.themeMood || gs.bb?.theme?.mood || 'neutral';
  return id && T[id] ? { id, mood: mood === 'hostile' ? 'hostile' : 'neutral' } : null;
}

/**
 * Give a scene one themed line, now and then. Mutates `sc.lines` and returns the scene. `kindText` is the scene's
 * type and step text, `ctx` the story context (its week carries the theme and mood it was played in).
 */
export function addThemeTexture(sc, kindText, ctx) {
  if (!sc || !Array.isArray(sc.lines) || !sc.lines.length) return sc;
  const th = themeOfWeek(ctx);
  if (!th || sc.recap) return sc;
  const week = Number(ctx?.week?.num) || 0;
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'theme-texture', sc.id || '', week);
  if (rng() >= RATE) return sc;
  const led = gs.bb ? (gs.bb.themeLines ||= {}) : {};
  if ((led[`w:${week}`] || 0) >= PER_WEEK) return sc;
  const pack = T[th.id];
  const kind = KIND(String(kindText || ''));
  const speakers = [...new Set(sc.lines.filter(l => l.kind === 'say' && l.by).map(l => l.by))];
  // a Diary Room line from somebody who spoke in the scene, or something in the room
  const drs = speakers.length ? (pack.dr[kind]?.[th.mood] || []) : [];
  const rooms = pack.room[th.mood] || [];
  // a line about the hidden accomplice only while there is one to find (bb/premiere-mystery.js accompliceLive)
  const mystery = accompliceLive();
  const fresh = l => !led[l] && (mystery || !/accomplice|planted/i.test(l));
  // A themed Diary Room line is a thought about the season, and spliced into a conversation about something else it
  // answers nothing ("Room service stopped. The hotel stopped being polite", after two people talked about a vote:
  // the read of 2026-10-29: the scene was filed as house life, so a kind cannot be trusted to say what was talked
  // about). It closes only a scene nobody talks in; a conversation gets the room instead.
  const answers = sc.lines.some(l => l.kind === 'say');
  const useDr = !answers && drs.some(fresh) && (rng() < 0.6 || !rooms.some(fresh));
  const pool = (useDr ? drs : rooms).filter(fresh);
  if (!pool.length) return sc;
  const text = pool[Math.floor(rng() * pool.length) % pool.length];
  led[text] = week || 1;
  led[`w:${week}`] = (led[`w:${week}`] || 0) + 1;
  if (useDr) {
    const by = speakers[Math.floor(rng() * speakers.length) % speakers.length];
    // after the last spoken line, before any closing confessional the scene already has
    let at = sc.lines.length;
    while (at > 0 && sc.lines[at - 1].kind === 'dr') at--;
    sc.lines.splice(at, 0, { kind: 'dr', by, text: said('dr', text), theme: th.id });
  } else {
    // the room, after the scene's own first staging line (so the cut still opens where the scene opens)
    const first = sc.lines.findIndex(l => l.kind === 'beat' && !l.bg);
    sc.lines.splice(first >= 0 ? first + 1 : 0, 0, { kind: 'beat', by: null, text, bg: true, theme: th.id });
  }
  return sc;
}

export const THEME_TEXTURE = T;
