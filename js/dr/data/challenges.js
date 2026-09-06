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
    id: 'acting', name: 'Acting Challenge', tentpole: false, stage: 'pre', format: 'teams',
    blend: { acting: 0.6, comedy: 0.3, runway: 0.1 },
    runway: 'themed', assignment: 'draft', roles: 'parts', chalStyle: 'comedy', minCast: 6,
    desc: 'The queens are split into casts for a scripted parody and each takes a part with its own lines and a costume already waiting on the rack. They rehearse, get one walkthrough from the host, then shoot the scene in front of a director who does not do a second take. Forgetting lines, stepping on a scene partner, or playing every part the same way is what buries a queen here. Whoever makes her part land hardest on screen wins.',
  },
  {
    id: 'ball', name: 'The Ball', tentpole: true, stage: 'main', format: 'solo',
    blend: { design: 0.45, runway: 0.45, dance: 0.1 },
    runway: 'ball', assignment: 'none', roles: null, chalStyle: 'physical', minCast: 5,
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
    runway: 'design', assignment: 'none', roles: null, chalStyle: 'physical', minCast: 4,
    desc: 'Each queen is handed a fixed pile of unconventional material in the werk room and has one day, one sewing machine and one glue gun to turn it into a runway look. She designs it, builds it, finishes it and then presents it on the main stage as her runway for the night. A garment still wet with glue, one that will not close, or one that hides the material instead of using it is what sends her to the bottom. The look the panel would put on a magazine cover wins.',
  },
  {
    id: 'girl-group', name: 'Girl Group Challenge', tentpole: true, stage: 'pre', format: 'teams',
    blend: { singing: 0.35, dance: 0.35, comedy: 0.15, runway: 0.15 },
    runway: 'themed', assignment: 'captains', roles: 'slots', chalStyle: 'physical', minCast: 6,
    desc: 'The queens form girl groups, each writes her own verse of an original track, records it in a booth with a vocal coach, and then the whole group learns a choreography from a professional before filming the music video. Verses are written in the werk room that morning. A verse with no hook in it, a queen who cannot find the beat, or a group that lets one member swallow the camera is what loses. The tightest video wins, and its strongest member takes the win.',
  },
  {
    id: 'improv', name: 'Improv Challenge', tentpole: false, stage: 'pre', format: 'pairs',
    blend: { acting: 0.5, comedy: 0.5 },
    runway: 'themed', assignment: 'draft', roles: 'parts', chalStyle: 'comedy', minCast: 4,
    desc: 'Queens are paired into scenes with a premise and a character each but no script at all, and play them out in front of the host and a comedy coach who feed in twists partway through. Each scene runs until the host calls it, and every pair gets the same number of twists thrown at them. Blocking a partner, reaching for the same joke twice, or freezing the moment the twist lands is what dies out there. The queen who keeps the scene alive and gets the biggest laugh wins.',
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
    id: 'rumix', name: 'Rumix Challenge', tentpole: false, stage: 'pre', format: 'cast',
    blend: { singing: 0.4, dance: 0.4, comedy: 0.2 },
    runway: 'themed', assignment: 'draft', roles: 'slots', chalStyle: 'physical', minCast: 5,
    desc: 'The remaining queens each write a verse for a remix of one of the host’s own songs, record it with a vocal coach, then learn a single group choreography and film the number together. Verse order is drafted, and whoever takes the last verse has to close the track. A verse that does not scan, a recording the coach cannot rescue, or a queen who gets lost inside the choreography is what fails. The queen whose verse and performance carry the track wins.',
  },
  {
    id: 'runway-challenge', name: 'Runway Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { runway: 0.8, design: 0.2 },
    runway: 'ball', assignment: 'none', roles: null, chalStyle: 'social', minCast: 4,
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
    desc: 'Each queen picks a celebrity to impersonate on a spoof panel game show hosted by the host, with two guest contestants asking fill-in-the-blank questions. She sits on that panel in character for the entire taping, answering every question as her celebrity and playing off whoever is sitting beside her. Picking a character nobody in the room recognises, breaking character halfway through, or going the whole game without a single laugh is what dies on that panel. The funniest celebrity there wins.',
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
