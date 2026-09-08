// ══════════════════════════════════════════════════════════════════════
// js/dr/data/split-beats.js — the two halves meet
// ══════════════════════════════════════════════════════════════════════
//
// ── WHAT THIS IS ──────────────────────────────────────────────────────
//
// A split premiere runs the cast in two halves over two episodes and nobody
// goes home. Then, on the third episode, the room doubles: everybody walks
// into a werk room that has twice as many people in it as it did last week,
// and half of those people are strangers who have already been on television.
//
// That moment did not exist. The engine restored the full cast with one line
// of state and the season carried on as though the two halves had always been
// in the room together — no scene, no screen, nothing. The most distinctive
// thing a split premiere does was the one thing it never showed.
//
// ── WHY IT IS ITS OWN PHASE ───────────────────────────────────────────
//
// Because it happens ONCE, before anything else on the night, and it is about
// the room rather than the challenge. Every queen has watched the other half
// perform and formed an opinion without ever meeting them. She knows who won
// over there. She knows who nearly went home. And the queens she spent the
// last two episodes with are now half of a much larger problem.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// FILL lines. CHANGE NOTHING ELSE — not an id, not a tier. Every id is named
// by js/dr/season.js and a renamed one silently stops being drawn.
//
//   · Placeholders are {a} and {b} only, and each beat's note says what they
//     are. Never a real name, never an invented queen name.
//   · SIX variants minimum per tier, genuinely different.
//   · NEVER state a cast size or a count of queens. No "the other six", no
//     "twelve of us now". tests/dr-prose-counts.test.js fails the build on
//     this and a room doubling is exactly the moment prose wants to count.
//   · Never say "the house" — it is Big Brother's noun. The werk room, the
//     room, the workroom.
//   · This show's words only: queens, the werk room, the main stage, the
//     panel, sashay, lip sync, maxi and mini challenge. There is no vote in
//     this show.
//   · No backticks anywhere in this file.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const SPLIT_BEATS = [
  {
    id: 'rejoin-open', step: 'rejoin', scope: 'once', speaker: 'narrator',
    variants: 6,
    note: 'The room doubles. No {a} — this is about the whole room, and '
      + 'naming one queen makes it her scene instead.',
    writerNote: 'Write the DOOR OPENING and the size of it. They have spent '
      + 'two episodes in a half-empty werk room and it felt like the whole '
      + 'show; now the other half walks in and it was never the whole show. '
      + 'Nobody has to say anything for it to land.',
    tierBy: 'always',
    tiers: [tier('open', 'Twice as many people as there were last week.', [
      'The werk room door swings wide and every mirror station that sat empty last week has somebody standing behind it — wigs, garment bags, a whole second cast that has been here the entire time.',
      'Heels hit the floor two at a time and the werk room shrinks by half in under a minute — queens shoulder past queens they have only ever seen through a screen, and nobody can find their station.',
      'The door opens and it does not stop opening — queen after queen files through until the werk room sounds like a cocktail party and every table has a stranger unpacking at it.',
      'Somebody laughs on the far side of the room and it is a laugh nobody here has ever heard in person — the werk room went from intimate to industrial between one episode and the next.',
      'Garment racks collide in the doorway as the second wave pours in, and the queens who were here first stand at their stations watching their quiet little room fill up with competition they have never touched.',
      'The room was theirs for two episodes and now it belongs to twice as many people — fabric rolls bump, mirrors get shared, and the comfortable distances everybody learned last week disappear.',
    ])],
  },
  {
    id: 'rejoin-read', step: 'rejoin', scope: 'per-queen', speaker: 'narrator',
    variants: 6,
    note: '{a} sizing up {b}, who was in the OTHER half. They have never '
      + 'shared a room and {a} has already watched her compete.',
    writerNote: 'The specific strangeness of this twist: she has an opinion '
      + 'about a person she has never met, formed entirely from watching her '
      + 'work. Sometimes the opinion survives the meeting and sometimes it '
      + 'does not. Tier by what she decides.',
    tierBy: 'read',
    tiers: [
      tier('threat', 'She saw the other half and this is the one who worried her.', [
        '{a} clocks {b} from across the room and does not blink — she watched that performance through the monitor and she has been thinking about it ever since.',
        '{a} catches {b} unpacking and her smile tightens at the edges — that is the queen who ate her premiere night alive, and she looks even more put-together in person.',
        '{a} pretends to adjust her wig while {b} sets up three stations away, but her eyes keep drifting — she has seen what {b} can do and none of it looked easy to beat.',
        '{a} watches {b} laugh with somebody from the other half and her stomach drops a little — the queen she hoped would stumble walked in looking like she owns the building.',
        '{a} sizes {b} up from her mirror and quietly reorganises her garment rack — she saw that silhouette on screen and knew immediately it was going to be a problem.',
        '{a} hears {b} greet the room and her jaw sets — she spent two episodes telling herself the other half was weaker, and {b} just made that story harder to believe.',
      ]),
      tier('warm', 'She liked what she saw, and says so.', [
        '{a} spots {b} and crosses the room with her arms open — she watched that lip sync through the monitor and has been waiting to tell her how good it was.',
        '{a} catches {b} at the mirror and leans in shoulder-first, complimenting the mug before {b} even finishes blending — she has wanted to meet this queen since premiere night.',
        '{a} waves {b} over to her station and starts asking about her dress before {b} can put her bag down — she liked everything she saw on that screen and she is not pretending otherwise.',
        '{a} pulls {b} into a hug that lasts a beat longer than polite and tells her she was the one worth watching on the other premiere — no strategy in it, just genuine admiration.',
        '{a} grabs {b} by the wrist and drags her to the couch, already talking about the look that made her yell at the monitor — she finally gets to say it to the face that wore it.',
        '{a} points at {b} from across the room and mouths the words before she even gets close — she has been telling everybody on her side that {b} was the one to watch.',
      ]),
      tier('unimpressed', 'She has heard the name all week and does not see it.', [
        '{a} glances at {b} arranging fabric and turns back to her own mirror with a shrug — she heard the name all week from the other half and the queen standing there does not match the hype.',
        '{a} watches {b} introduce herself to the room and something does not land — the confidence reads differently in person than it did through a screen, and not in a good way.',
        '{a} expected more from {b} and it shows in the polite little smile she gives before going back to her work — the premiere made {b} look dangerous but the werk room makes her look ordinary.',
        '{a} nods when {b} says hello and offers nothing back — she sat through that premiere waiting to be impressed, and it never happened, and meeting {b} in person did not fix it.',
        '{a} leans over to the queen beside her after {b} walks past and does not say anything — she just raises her eyebrows, and the eyebrows say everything the premiere did not.',
        '{a} takes one long look at {b} setting up and goes back to her garment bag — the other half talked about {b} like she was the second coming and {a} is not buying what she sees.',
      ]),
    ],
  },
  {
    id: 'rejoin-winners', step: 'rejoin', scope: 'once', speaker: 'narrator',
    variants: 6,
    note: 'The two queens who won their own half, meeting. {a} won the first '
      + 'night, {b} won the second.',
    writerNote: 'Each of them has been the best queen in the room for a week '
      + 'and exactly one of them is about to stop being that. Neither says so. '
      + 'Write what they do instead.',
    tierBy: 'always',
    tiers: [tier('winners', 'Two queens who have each been the best in the room.', [
      '{a} and {b} find each other in the crowd and the handshake is warm but the eye contact is an audit — each of them won a premiere and exactly one of them is about to stop being the frontrunner.',
      '{a} hugs {b} and holds on just long enough to feel how broad her shoulders are — they are both wearing winner energy and the room is not big enough for two queens who think they are the best.',
      '{a} and {b} end up side by side at the mirror and the compliments come fast and genuine, but underneath every nice thing is the same unspoken question: which premiere was harder to win.',
      '{a} tells {b} she watched her win and means it — but the smile she gives after is the smile of a queen who has been the best in every room she has walked into and is not ready to share that.',
      '{a} and {b} trade stories about their premiere nights like veterans comparing campaigns, both of them generous and both of them listening for the thing that says the other one is beatable.',
      '{a} catches {b} across the room and they gravitate toward each other without deciding to — two queens who won on different nights, sizing up whether this is a rivalry or an alliance before either says a word.',
    ])],
  },
];

export const SPLIT_IDS = SPLIT_BEATS.map(b => b.id);

/** A tier with no lines written — the gap check and the writer's to-do list. */
export function unwrittenSplitTiers() {
  const out = [];
  for (const b of SPLIT_BEATS) {
    for (const t of b.tiers || []) if (!t.lines?.length) out.push(`${b.id}/${t.id}`);
  }
  return out;
}
