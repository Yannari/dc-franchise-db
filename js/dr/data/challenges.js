// ══════════════════════════════════════════════════════════════════════
// dr/data/challenges.js — the eighteen maxi challenge types
// ══════════════════════════════════════════════════════════════════════
//
// The eighteen the fan wiki lists, six of which are the tentpoles a season is
// expected to book: Snatch Game, the Ball, the Girl Group, the Makeover, the
// Roast and the Rusical.
//
// EVERY `desc` HAS A JOB, and it is not flavour. It is the only place the
// viewer is told what the queens are physically doing — the narration says
// what happened, never what the rules were — so each one states four things in
// order: the set-up, the mechanic, what goes wrong, and how you win. Two
// sentences and 200 characters are the floor, enforced by
// tests/dr-catalogue.test.js, the same bar the Big Brother competitions meet.
//
// Fields:
//   stage       'pre'  — performed before elimination day (filmed, taped)
//               'main' — performed on the main stage after the runway
//   format      how the room is divided
//   blend       which craft stats decide it, weights summing to 1
//   runway      what walks: one themed look, the built look, three walks, or a pair
//   assignment  how roles or materials are handed out
//   roles       what kind of role, if any, is drafted
//   chalStyle   the scheduler's pacing tag; two of the same never sit adjacent
//   minCast     below this the challenge does not work

export const TENTPOLES = ['snatch-game', 'ball', 'girl-group', 'makeover', 'roast', 'rusical'];

export const MAXI_TYPES = [
  {
  /* `runwayIsChallenge` — THE WALK IS THE CHALLENGE, so there is no second
     one. On a Ball, a Design challenge or a Runway challenge the thing she
     presents on the main stage IS the thing she was set to make: judging it
     again as a separate category scored the same look twice (the design blend
     already carries `runway` craft), and drew a Runway section on the screen
     narrating a walk the challenge had just narrated. Set it on any challenge
     whose deliverable is the look itself. */
    id: 'acting', name: 'Acting Challenge', tentpole: false, stage: 'pre', format: 'teams',
    blend: { acting: 0.6, comedy: 0.3, runway: 0.1 },
    runway: 'themed', assignment: 'draft', roles: 'parts', chalStyle: 'comedy', minCast: 6,
    /* IT IS TWO CHALLENGES AND THE DESC ONLY DESCRIBED ONE. Some scripts are
       a six-hander the room plays twice, cast against cast; others are one
       ensemble with a part for everybody. A viewer who is told to expect a
       split and gets a twelve-hander has been told the wrong rules. */
    desc: 'A scripted parody is cast from a script with named parts, each with its own lines and a costume already on the rack — either a small script the room plays twice as two rival casts, or one ensemble with a part for every queen. They take the parts, get a walkthrough from the host, then tape the scene on a set with a director who does not do a second take. Forgetting lines, stepping on a scene partner, or playing every part the same way is what buries a queen here. Whoever makes her part land hardest on camera wins.',
  },
  {
    id: 'ball', name: 'The Ball', tentpole: true, stage: 'main', format: 'solo',
    blend: { design: 0.45, runway: 0.45, dance: 0.1 },
    runway: 'ball', runwayIsChallenge: true, assignment: 'none', roles: null, chalStyle: 'physical', minCast: 5,
    desc: 'Three categories are announced and every queen must present three looks on the main stage: two pulled and styled from what she brought with her, and one built from scratch in the werk room out of the fabric on the wall. She has a single working day to cut, sew and fit the third. A look that falls apart on the runway, a category answered with the wrong idea, or a sewn piece that reads as a bedsheet is what sinks her. The strongest trio across all three categories wins.',
  },
  {
    id: 'choreography', name: 'Choreography Challenge', tentpole: false, stage: 'main', format: 'teams',
    blend: { dance: 0.6, singing: 0.2, runway: 0.2 },
    runway: 'themed', assignment: 'captains', roles: 'slots', chalStyle: 'physical', minCast: 6,
    desc: 'Teams learn and perform a full dance number staged by a professional choreographer, with a formation for every eight-count and one featured solo written into each routine. They rehearse in the studio all afternoon and then perform it live on the main stage. Missing the count, blowing a formation, or being visibly carried by the queens around you is what costs a team the night. The cleanest team wins, and the standout inside it takes the individual win.',
  },
  {
    id: 'commercial', name: 'Commercial Challenge', tentpole: false, stage: 'pre', format: 'pairs',
    blend: { acting: 0.45, comedy: 0.45, runway: 0.1 },
    runway: 'themed', assignment: 'random', roles: null, chalStyle: 'comedy', minCast: 4,
    desc: 'Pairs write, shoot and star in a thirty-second advert for a product the host names, with a set, a prop table and a camera crew that gives them one afternoon and no more. They pitch the concept themselves, play every role in it, and deliver the tagline straight to camera. A concept nobody can follow, a partner left standing there with nothing to do, or a tagline that dies in the room is what fails. The spot the judges would actually air wins.',
  },
  {
    id: 'design', name: 'Design Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { design: 0.7, runway: 0.3 },
    runway: 'design', runwayIsChallenge: true, assignment: 'none', roles: null, chalStyle: 'physical', minCast: 4,
    desc: 'Each queen is handed a fixed pile of unconventional material in the werk room and has one day, one sewing machine and one glue gun to turn it into a runway look. She designs it, builds it, finishes it and then presents it on the main stage as her runway for the night. A garment still wet with glue, one that will not close, or one that hides the material instead of using it is what sends her to the bottom. The look the panel would put on a magazine cover wins.',
  },
  {
    /* LIVE, LIKE EVERY OTHER NUMBER. `stage: 'pre'` means filmed during the
       week — the Snatch Game taping, an acting scene, a commercial, a
       photoshoot — and it put the girl group number on the Maxi screen BEFORE
       elimination day and before the panel had sat down. Every other live
       number is `main`: the rusical, the Rumix, choreography, the talent show.
       The queens sing and dance this one in front of the judges, on the night,
       as the show. */
    id: 'girl-group', name: 'Girl Group Challenge', tentpole: true, stage: 'main', format: 'teams',
    blend: { singing: 0.35, dance: 0.35, comedy: 0.15, runway: 0.15 },
    runway: 'themed', assignment: 'captains', roles: 'slots', chalStyle: 'physical', minCast: 6,
    desc: 'The queens form girl groups, each writes her own verse of an original track, records it in a booth with a vocal coach, and then the whole group learns a choreography from a professional before filming the music video. Verses are written in the werk room that morning. A verse with no hook in it, a queen who cannot find the beat, or a group that lets one member swallow the camera is what loses. The tightest video wins, and its strongest member takes the win.',
  },
  {
    /* SOLO, AND IT ALWAYS WAS. This said `pairs` and the engine has never
       once paired anybody: `assign` in js/dr/chal/acting.js gives every queen
       her own premise, returns `teams: []` and sets `division: 'solo'`, on
       thirty seasons out of thirty. Nothing read the field to decide the
       shape -- acting.js branches on `maxi.id` -- so the only consumers were
       the ones that DESCRIBE the night, and they described it wrongly: the
       challenge screen prints `ch.format` straight onto the card, so a solo
       week was captioned "pairs".
       `desc` below still says the queens are paired and is prose, so it is
       briefed rather than patched here. */
    id: 'improv', name: 'Improv Challenge', tentpole: false, stage: 'pre', format: 'solo',
    blend: { acting: 0.5, comedy: 0.5 },
    runway: 'themed', assignment: 'draft', roles: 'parts', chalStyle: 'comedy', minCast: 4,
    desc: 'Each queen walks out alone, is handed a character she has never seen — a psychic who is always slightly wrong, a tour guide of a building she has never entered — and plays the scene cold with nothing prepared and nobody to lean on. There is no rehearsal. She commits or she does not, and commitment matters more here than craft: a fearless queen who throws herself in beats a polished one who hesitates. Freezing on the mark — going blank, pulling back, waiting for a better idea — is what dies out there. The queen who stays in character the longest and gets the biggest laugh wins.',
  },
  {
    id: 'lipsync-challenge', name: 'Lip Sync LaLaPaRUza', tentpole: false, stage: 'main', format: 'solo',
    blend: { lipsync: 0.6, dance: 0.3, acting: 0.1 },
    runway: 'themed', assignment: 'draft', roles: null, chalStyle: 'physical', minCast: 6,
    desc: 'A bracket of lip syncs on the main stage. Queens choose their own opponents in an order the mini challenge decided, each pair performs a song head to head, and the loser drops into the next round of losers while the winner sits out and watches. Rounds continue until one queen is left unbeaten. Losing the words, standing still through a dance break, or leaving a stunt half-finished is what sends a queen down the bracket. The last queen standing wins.',
  },
  {
    id: 'makeover', name: 'Makeover Challenge', tentpole: true, stage: 'main', format: 'partnered',
    blend: { design: 0.35, runway: 0.35, acting: 0.15, comedy: 0.15 },
    runway: 'makeover', assignment: 'draft', roles: null, chalStyle: 'social', minCast: 4,
    desc: 'Each queen is given a partner who has never done drag — a member of the pit crew, a family member, or a queen already sent home — and must turn them into her drag sister: a look for each of them, a shared name and a family resemblance. She builds and paints both in one day, then they walk the runway together. A partner who cannot move in the shoes, a pair with no resemblance, or a queen who dressed herself better than her sister is what fails. The most convincing family wins.',
  },
  {
    id: 'music-video', name: 'Music Video Challenge', tentpole: false, stage: 'pre', format: 'cast',
    blend: { dance: 0.4, acting: 0.3, singing: 0.2, runway: 0.1 },
    runway: 'themed', assignment: 'host', roles: 'parts', chalStyle: 'physical', minCast: 5,
    desc: 'The whole cast shoots one music video for a track the host owns, and the host assigns the parts herself — featured verses down to background dancers, with no say from the queens. They learn the choreography and their lines and then film all day in take after take. Missing your mark, sleepwalking through a verse, or being impossible to find behind the featured queen is what sinks you here. The queen the camera keeps coming back to wins.',
  },
  {
    id: 'photoshoot', name: 'Photoshoot Challenge', tentpole: false, stage: 'pre', format: 'solo',
    blend: { runway: 0.5, acting: 0.3, comedy: 0.2 },
    runway: 'themed', assignment: 'none', roles: null, chalStyle: 'social', minCast: 4,
    desc: 'Each queen shoots a themed editorial with a photographer and a set that fights back — wind, water, a moving platform, a co-star who will not cooperate. She gets a set number of frames to come away with one shot that tells the story, and the set resets between queens. A blank face, fighting the set instead of using it, or a look that simply does not read on camera is what fails. The queen with the frame the judges would print wins.',
  },
  {
    id: 'roast', name: 'The Roast', tentpole: true, stage: 'main', format: 'solo',
    blend: { comedy: 0.7, acting: 0.2, runway: 0.1 },
    runway: 'themed', assignment: 'draft', roles: 'slots', chalStyle: 'comedy', minCast: 5,
    desc: 'Each queen writes and delivers a stand-up set roasting a guest of honour and the panel itself, in a running order the mini challenge decided — and opening the show and closing it are the two hardest slots in the room. Sets are written in the werk room and delivered live, once. A joke that does not land, a set that runs long, or a queen who roasts the room instead of the honouree is what dies on that stage. The biggest laughs win.',
  },
  {
    /* MAIN STAGE, NOT TAPED. This was `stage: 'pre'`, which files it with the
       challenges that are shot and played back and put its screen before the
       runway. The recording is the PREP; the challenge is performing the verse
       live to her own vocal. And comedy carries more of the blend than dance
       does now, because the wiki calls this the Verse Challenge and the verse
       is written to be quotable. */
    id: 'rumix', name: 'Rumix Challenge', tentpole: false, stage: 'main', format: 'cast',
    blend: { singing: 0.4, comedy: 0.3, dance: 0.3 },
    runway: 'themed', assignment: 'draft', roles: 'slots', chalStyle: 'physical', minCast: 5,
    desc: 'The remaining queens each write a verse for a remix of one of the host’s own songs, record it with a vocal coach, then learn a single group choreography and film the number together. Verse order is drafted, and whoever takes the last verse has to close the track. A verse that does not scan, a recording the coach cannot rescue, or a queen who gets lost inside the choreography is what fails. The queen whose verse and performance carry the track wins.',
  },
  {
    id: 'runway-challenge', name: 'Runway Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { runway: 0.8, design: 0.2 },
    runway: 'ball', runwayIsChallenge: true, assignment: 'none', roles: null, chalStyle: 'social', minCast: 4,
    desc: 'No maxi challenge in the werk room at all: the queens present three looks each on the main stage across three categories announced that morning, with only a short window to style, alter and repair. Each walk is judged on its own before the three are weighed together. A category missed, a walk with no story behind it, or a look that simply repeats the one before is what fails here. The strongest trio of walks wins the night.',
  },
  {
    id: 'rusical', name: 'The Rusical', tentpole: true, stage: 'main', format: 'cast',
    blend: { singing: 0.35, acting: 0.3, dance: 0.25, runway: 0.1 },
    runway: 'themed', assignment: 'draft', roles: 'parts', chalStyle: 'comedy', minCast: 6,
    desc: 'The whole cast stages an original musical on the main stage, with parts from the lead down to the ensemble handed out in a draft and a choice for the leads between singing live and lip syncing to the recording. They learn the songs and the staging with a choreographer and a vocal coach and then perform it once, live, with no second pass. A lead who cannot hold the tune, an ensemble member who disappears, or a part played with no character in it is what fails. The performance the panel cannot stop talking about wins.',
  },
  {
    id: 'singing', name: 'Singing Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { singing: 0.6, acting: 0.2, runway: 0.2 },
    runway: 'themed', assignment: 'draft', roles: 'slots', chalStyle: 'social', minCast: 4,
    desc: 'Each queen performs one song live on the main stage with a live band behind her, chosen from a list in an order the mini challenge set, after a single rehearsal with the musical director. She has to actually sing it rather than lip sync, and sell it to the room while she does. A cracked note, a forgotten lyric, or a performance that stands rooted to the spot is what fails. The queen the band would take on tour wins.',
  },
  {
    id: 'snatch-game', name: 'Snatch Game', tentpole: true, stage: 'pre', format: 'solo',
    blend: { comedy: 0.55, acting: 0.35, runway: 0.1 },
    runway: 'themed', assignment: 'draft', roles: 'characters', chalStyle: 'comedy', minCast: 5,
    desc: 'Each queen picks a celebrity to impersonate on a spoof panel game show hosted by the host, with two celebrity guests asking fill-in-the-blank questions. She sits on that panel in character for the entire taping, answering every question as her celebrity and playing off whoever is sitting beside her. Picking a character nobody in the room recognises, breaking character halfway through, or going the whole game without a single laugh is what dies on that panel. The funniest celebrity there wins.',
  },
  {
    id: 'stand-up', name: 'Stand-Up Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { comedy: 0.65, acting: 0.25, runway: 0.1 },
    runway: 'themed', assignment: 'draft', roles: 'slots', chalStyle: 'comedy', minCast: 4,
    desc: 'Each queen writes and performs a five-minute stand-up set for a live audience, in a running order decided by the mini challenge, after one coaching session with a working comic. She has to open strong, land three bits in the middle, and get off on a laugh. Bombing the opener, running out of material with time left, or rushing a punchline into the applause is what fails. The queen the audience laughed at the most wins.',
  },
  {
    id: 'talent-show', name: 'Talent Show Extravaganza', tentpole: false, stage: 'main', format: 'solo',
    blend: { comedy: 0.25, singing: 0.25, dance: 0.25, lipsync: 0.25 },
    runway: 'themed', assignment: 'none', roles: null, chalStyle: 'social', minCast: 4,
    desc: 'Each queen performs a talent of her own choosing on the main stage — a live vocal, a comedy set, a dance number, a burlesque routine, a lip sync built around a stunt — with one rehearsal slot and a single line to introduce herself. Every act gets the same stage and the same amount of time. Choosing a talent she does not actually have, a routine with no ending, or an act that turns out to be a runway walk with music is what fails. The act the room would pay to see again wins.',
  },
];

export function maxiById(id) {
  return MAXI_TYPES.find(m => m.id === id) || null;
}

/* ── WHERE IN A SEASON EACH CHALLENGE HAPPENS ──
   `[from, to]` as a fraction of the weeks before the finale: 0 is the
   premiere, 1 the last week before it. Read off the episode tables of US
   seasons 9–17 on the fandom wiki (the "Maxi Challenge" line of every
   episode), not remembered:

     Snatch Game   S9 6/12  S11 8/12  S12 6/12  S13 9/14  S14 10/14  S16 8/14  S17 7/14
     Makeover      S9 10/12 S10 10/12 S11 11/12 S12 10/12 S13 10/14 S15 13/14 S16 13 S17 13
     Rumix         S9 12/12 S10 12/12 S11 12/12 S14 14/14 S15 14/14 — the week before the finale
     Stand-up      S9 8  S11 10  S12 11  S13 12  S14 13  S15 11  S16 11  S17 10, 12
     Ball          S10 4  S12 4  S13 5  S14 3  S16 3  S17 6  (S9 11, S15 9 the outliers)
     Girl groups   S14 8  S15 6  S16 5
     Premieres     talent show (S14, S16, S17), design (S10, S11), runway (S9)

   The scheduler booked the six tentpoles uniformly anywhere in weeks 2..N-2
   and the fillers with no sense of time at all, so a played season opened on
   a fourteen-queen Rumix, ran the Makeover in week two and the Snatch Game
   with five left. A window is where a challenge BELONGS; the scheduler
   prefers it and only leaves it when nothing else fits. */
export const SEASON_WINDOW = {
  'talent-show': [0, 0.1], design: [0, 1], 'runway-challenge': [0, 1], photoshoot: [0, 0.6],
  choreography: [0, 0.5], acting: [0.05, 0.85], singing: [0.05, 0.7], improv: [0.1, 0.75],
  commercial: [0.1, 1], 'girl-group': [0.1, 0.55], rusical: [0.1, 0.85], ball: [0.1, 0.8],
  'snatch-game': [0.3, 0.7], 'lipsync-challenge': [0.35, 0.8], 'music-video': [0.4, 1],
  roast: [0.5, 0.95], 'stand-up': [0.5, 0.95], makeover: [0.65, 1], rumix: [0.8, 1],
};

/* ── AND HOW MANY QUEENS IT CAN HOLD ──
   A Rumix is a verse each on one track: the real ones run four to seven
   queens (the split premieres of S12/S13 are half a cast). Fourteen verses is
   not a song. */
export const MAX_CAST = { rumix: 8 };

/** Where `id` sits in a season, or everywhere if nobody has said. */
export const windowOf = id => SEASON_WINDOW[id] || [0, 1];

/* ── THE NAME AS IT READS INSIDE A SENTENCE ──
   Pools write "the post-mortem on {m}" and "This week is {c}", and the names
   are titles: "The post-mortem on Girl Group Challenge", "Can we talk about
   The Ball". Mid-sentence they want an article or a lower-case one — the
   Girl Group Challenge, the Ball, the Rusical — and Snatch Game wants neither.
   A line that OPENS on the name is re-capitalised by the renderer. */
export function nameInSentence(name) {
  const n = String(name || '');
  if (!n) return n;
  if (/^The /.test(n)) return `the ${n.slice(4)}`;
  if (/(Challenge|Extravaganza|LaLaPaRUza)$/.test(n)) return `the ${n}`;
  return n;
}

/** Capitalise a "the" that a substitution left at the start of a sentence. */
export const capSentenceThe = text => String(text || '')
  .replace(/(^|[.!?]\s+|^["\u201c]|[.!?]\s+["\u201c])the\b/g, (m, p) => `${p}The`);
