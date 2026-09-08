// ══════════════════════════════════════════════════════════════════════
// dr/data/lipsync-voices.js — the lip sync, in this song's words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The same bug as the mini and the runway, on the most important ninety
// seconds in the show. `lipsync-beat` had four tiers keyed on how well she did
// and knew nothing about the song, so a queen fighting for her life to a
// six-minute power ballad and a queen doing it to a hyperpop banger got the
// same paragraph with a different name in it.
//
// And the song is not a decoration. js/dr/data/songs.js gives every title four
// tags, and its own header says what they are for — "the narration builds its
// third beat out of this" about `hook`. It never did. `lipsyncScore` reads
// them all to decide who wins; the words that describe the win read none.
//
// ── THE TWO POOLS ─────────────────────────────────────────────────────
//
//   LIPSYNC_TEMPOS  4 tempos × 4 score tiers.  What the song asks of a body.
//   LIPSYNC_HOOKS   5 hooks × 2 outcomes.      The moment it is won or lost.
//
// stage.js renders the tempo line as the beat, and the hook line after it when
// the song has a hook worth naming. Two pools rather than one crossed pool for
// the usual reason: 4 × 4 × 5 × 2 is a commission nobody finishes, and the
// hook is a separate moment in the song rather than a different way of
// describing the same one.
//
// ── WHY TEMPO AND NOT MOOD ────────────────────────────────────────────
//
// Both are authored, and tempo is the one that changes what the queen is
// physically doing. A ballad is stillness, a face, and the discipline not to
// fill the silence; an uptempo is a body that has to keep up for three
// minutes. Mood changes the colour of a performance and tempo changes the job,
// and it is the job that the old prose was wrong about — it described dance
// breaks and death drops over songs that have neither.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON, AND THIS IS THE HIGHEST-STAKES REGISTER IN THE SHOW. Two
// queens are lip syncing for their lives in front of a panel that has already
// decided everything except this. It is loud, it is close, and one of them is
// leaving. The werk room is funny; the main stage is verdict; this is neither.
// Keep it physical and present-tense-feeling — what her body is doing, what
// the room is doing, what the other queen can see out of the corner of her eye.
//
// NEVER QUOTE A LYRIC. `{s}` is the song's TITLE and that is the only part of
// it that may appear. No lines from the song, no paraphrase of its words, not
// one clause of it. This is not a style note, it is the rule the whole song
// bank is built on — songs.js exists because real titles are used as names and
// nothing else.
//
// Placeholders:
//   {a}  the queen performing.
//   {s}  the song title. Available everywhere here and nowhere else in the
//        show. Use it sparingly — naming it every line reads like a caption.
//
// Same rules as every other pool, all enforced by tests: no real people beyond
// the artist the title belongs to, this show's vocabulary only, never quote a
// stat by number, four variants minimum per tier, prose rather than captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The four cuts, best to worst. These are `LIPSYNC_TIERS` in js/dr/stage.js. */
export const LIPSYNC_TIER_IDS = ['legendary', 'strong', 'trying', 'lost'];
/**
 * Build tiers from whatever shape the author used.
 *
 * A HELPER THAT ONLY TAKES NOTES CANNOT BE FILLED. The pick pool in
 * maxi-voices.js shipped that way and the file stopped parsing the first time
 * somebody wrote prose into it, because there was nowhere for the lines to go
 * and they had to break out of the helper to put them somewhere. Same shape,
 * same trap, so the same tolerance: notes, note-and-lines pairs, and
 * already-built tiers, mixed freely and in tier order.
 */
const tiersFrom = (ids, args) => {
  const out = [];
  let i = 0;
  for (const id of ids) {
    const v = args[i];
    if (v && typeof v === 'object' && !Array.isArray(v)) { out.push(v); i += 1; continue; }
    if (Array.isArray(args[i + 1])) { out.push(tier(id, v, args[i + 1])); i += 2; continue; }
    out.push(tier(id, v));
    i += 1;
  }
  return out;
};


// ══════════════════════════════════════════════════════════════════════
// POOL 1 — WHAT THE SONG ASKS OF HER. One voice per tempo.
// ══════════════════════════════════════════════════════════════════════
//
// The tiers are ranked against the queens in THIS lip sync, which is usually
// two people. So `legendary` means she won it and won it well, and `lost`
// means she was visibly beaten — there is no middle of a field of two, and the
// four tiers exist because a triple or a lalaparuza puts more bodies on the
// stage.

const tempo = (id, note, ...rest) => ({
  tempo: id, note, tiers: tiersFrom(LIPSYNC_TIER_IDS, rest.flat()),
});

const T = (...args) => args;

export const LIPSYNC_TEMPOS = [
  tempo('ballad',
    'SLOW, AND THERE IS NOWHERE TO HIDE. No choreography to fall back on and '
    + 'no beat to ride. It is a face, a pair of hands, and the discipline not '
    + 'to fill the silence with tricks. The song is long and every second of '
    + 'it is her alone in a light.', [
      tier('legendary', 'She does almost nothing and it is devastating. The room stops moving.', [
        '{a} stands in the light and barely moves, and the room stops breathing, because what her face is doing to {s} is more devastating than any split or dip or reveal could be — a ballad stripped to a body and a feeling, and the feeling is filling the room.',
        'She does almost nothing. A hand lifts, falls. Her mouth shapes the words of {s} like she wrote them, and the panel leans forward, because the stillness is not empty — it is discipline, and the discipline is what makes a ballad lip sync legendary.',
        '{a} finds the center of {s} and lives there — no tricks, no acrobatics, no wig reveals, just a queen in a light singing a song she appears to mean, and the room is quieter than it has been all night because nobody wants to break whatever this is.',
        'The song is slow and {a} is slower, and the gap between the tempo and the performance is not a gap — it is a choice, and the choice is devastating, and the panel watches a queen turn restraint into the most commanding performance of the night.',
      ]),
      tier('strong', 'She holds it. The stillness reads as control rather than as a gap.', [
        '{a} holds the ballad and the holding is steady — no panic, no filler, no unnecessary movement to cover the silence between phrases. The stillness reads as a queen who trusts the song and trusts her own face to carry it.',
        'She lets {s} breathe and breathes with it. The performance is not spectacular but it is controlled, and control on a ballad is the thing that separates a queen who can lip sync from a queen who can only lip sync to fast songs.',
        '{a} finds the tempo and matches it, and matching a slow tempo is harder than matching a fast one because there is nothing to hide behind — every gesture matters and every pause is visible, and {a} makes both work.',
        'The ballad asks for patience and {a} has it. She moves when the song moves and stops when the song stops and the face never drops the thread, and the panel watches a solid ballad performance from a queen who understood the assignment.',
      ]),
      tier('trying', 'She fills the quiet with movement because the quiet frightens her.', [
        '{a} cannot sit in the quiet of {s}. The arms move, the feet move, the body is doing choreography that belongs to a different song at a different speed, and the room can see a queen fighting the tempo instead of serving it.',
        'The ballad asks for stillness and {a} gives it movement, and the movement has the energy of a queen who does not trust the song to hold the stage on its own and is trying to help it with gestures that do not help.',
        '{a} is lip syncing to a ballad and performing to an uptempo that only she can hear, and the mismatch between what the room is hearing and what her body is doing is the mismatch that loses a slow song every time.',
        'She fills every gap in {s} with something — a turn, a hair flip, a drop to the knees — and every something is wrong because the gaps are the song and the song does not want to be filled, and {a} has not figured that out.',
      ]),
      tier('lost', 'She has no idea what to do with a song this slow and it shows for minutes.', [
        '{a} is standing in a spotlight with a song she does not know how to perform. {s} is slow and long and the silence between its phrases is the silence of a queen who has run out of ideas and the song has not run out of minutes.',
        'The ballad exposes everything. {a} has no moves, no moments, no connection to {s}, and the performance is three minutes of a queen visibly searching for something to do while the song plays around her like background music in a room she is trying to leave.',
        '{a} mouths the words of {s} and the words are the only thing moving, because her body does not know what a body does during a ballad, and the room watches the kind of lip sync that makes a panel look at the floor rather than at the stage.',
        'She is lost in {s} and not in the way a ballad wants a performer to be lost — she is lost the way a person is lost when the music is playing and the spotlight is on and nobody is coming to save her from however many minutes are left.',
      ]),
    ]),
  tempo('mid',
    'A build. It starts contained and goes somewhere, and the performance has '
    + 'to go with it — a queen who gives everything in the first verse has '
    + 'nothing left when the song finally opens up.', [
      tier('legendary', 'She paces it exactly and arrives at the top of the song with the song.', [
        '{a} reads {s} like she has been living with it for years — the first verse is contained, the bridge is restrained, and when the song finally opens up she opens with it, and the room watches a performance that was paced so well it feels like the song was written for her.',
        'She holds back and holds back and holds back, and the holding is not hesitation — it is a plan, and the plan pays off when {s} hits the top and {a} arrives there at the same time with everything she has been saving, and the stage belongs to her.',
        '{a} paces {s} perfectly. She starts the lip sync at one level and finishes it at another, and the distance between the two levels is the arc of the song itself, and the panel watches a queen ride a build with the precision of somebody who counted the bars.',
        'The build is the whole point of a mid-tempo and {a} understands that — she does not show the room what she has until the song asks for it, and when it asks she delivers everything at once, and the contrast is what makes the performance legendary.',
      ]),
      tier('strong', 'She reads the build correctly and saves enough for it.', [
        '{a} paces herself through {s} and the pacing works — she does not peak early, she does not run out of energy, and when the final chorus arrives she has enough left to give it something, which is all a mid-tempo asks and more than most queens manage.',
        'She finds the build in {s} and follows it. The early verses are steady, the bridge has a lift, and the climax gets a gear she had not shown before, and the whole thing coheres into a lip sync that read the song and responded to it.',
        '{a} saves something for the end and the end is better for it. The song builds and her performance builds with it, not perfectly but visibly, and the panel watches a queen who understood that a mid-tempo is a story, not a sprint.',
        '{a} handles the build of {s} with the patience of a queen who has been through this before — she does not throw everything at the first verse, she does not coast through the bridge, and the final stretch has more energy than the opening, which is the whole assignment.',
      ]),
      tier('trying', 'She peaks early and spends the rest of the song at the same level.', [
        '{a} opens at full power and has nowhere to go when {s} opens up, and the last minute of the lip sync is a queen at the same level she was at in the first thirty seconds, which means the build happened without her and she did not notice.',
        'She gives the first verse everything and the song is not asking for everything yet, and by the time the song IS asking for everything she has already given it, and the flat line from verse two onward is the story the panel is watching.',
        '{a} peaks in the first chorus and stays there, and staying at one level while {s} rises is the mid-tempo version of falling behind — the song is climbing and she is standing on the step she started on.',
        'The build passes her. {a} starts the lip sync at a level that would have been perfect for the final chorus and maintains it through every section of {s}, which means the song gets louder and the performance does not, and the gap is visible.',
      ]),
      tier('lost', 'The song builds and she does not, and the gap between them is the story.', [
        '{s} builds and {a} does not. The song lifts, the arrangement opens, the energy in the room rises, and {a} is standing in the same place doing the same thing she was doing a minute ago, and the distance between the song and the performance is widening with every bar.',
        'The mid-tempo asks for a journey and {a} has not packed for one. She starts somewhere and stays there while {s} travels without her, and by the final chorus the song is somewhere she cannot reach from where she is standing.',
        '{a} lip syncs at one flat level through a song that has three distinct gears, and the flatness is not restraint — it is a queen who does not hear the build, or hears it and does not know how to match it, and the panel can see the difference.',
        'The song goes somewhere and {a} does not go with it. {s} builds through three sections and {a} performs the same section three times, and by the end the song has left her behind so completely that the lip sync is happening to her rather than through her.',
      ]),
    ]),
  tempo('dance',
    'A groove rather than a sprint. It wants hips and control and a body that '
    + 'sits in the pocket — the trap is treating it like an uptempo and '
    + 'running out of road.', [
      tier('legendary', 'She sits in the pocket and the whole room feels it before it sees it.', [
        '{a} drops into the groove of {s} and the groove takes her and she lets it — hips in the pocket, shoulders rolling, feet landing on the beat rather than chasing it, and the room feels the performance before it processes it because the body is doing something the brain follows.',
        'She finds the pocket of {s} and lives in it. Nothing is forced. The movement has the lazy precision of a queen who has danced to this tempo her whole life — not fast, not slow, just exactly where the beat wants a body to be.',
        '{a} sits so deep in the groove that the lip sync stops looking like a fight for survival and starts looking like a show she is putting on because she wants to, and the panel watches a queen who is not performing a song but inhabiting it.',
        'The dance track asks for hips and control and {a} delivers both without appearing to try, which is the whole trick of a dance-tempo lip sync — the effort should be invisible, the groove should be visible, and {a} has the ratio exactly right.',
      ]),
      tier('strong', 'She finds the groove and stays in it. Nothing is rushed.', [
        '{a} finds the pocket of {s} and holds it — not the deepest groove of the night, but a groove, real and steady, and the body is in the right place at the right time through enough of the song that the panel sees a queen who dances rather than a queen who moves.',
        'She is in the groove for most of {s} and the moments where she is in it fully are the moments that matter. The hips land on the beat, the feet know where the floor is, and the performance reads as a queen who belongs in this tempo.',
        '{a} stays in the pocket and the staying is controlled — she does not rush, she does not push the beat, and the performance has the steadiness of a queen who trusts the tempo to carry her if she lets it.',
        'The dance track demands a body that sits in the rhythm and {a}\'s body does — not spectacularly, but correctly, with the hips finding the pocket and the shoulders following, and the result is a solid dance-tempo lip sync from a queen who understood the assignment.',
      ]),
      tier('trying', 'She is on top of the beat instead of in it, all the way through.', [
        '{a} is dancing but she is dancing on top of {s} rather than inside it — the feet are a quarter-count ahead, the hips are anticipating rather than landing, and the whole performance has the energy of a queen who is chasing the groove instead of sitting in it.',
        'She is moving and the moving is correct, technically, but the relationship between the movement and the beat is adversarial rather than collaborative — she is fighting the tempo of {s} rather than riding it, and the fight shows.',
        '{a} treats the dance track like an uptempo and the tempo punishes her for it — she is too fast, too sharp, too on top of a groove that wants a body behind it rather than ahead of it, and the mismatch is visible from the panel.',
        'The groove is right there and {a} is right next to it but not in it, and the difference between next to the pocket and in the pocket is the difference between a lip sync that almost works and a lip sync that works, and this one almost works.',
      ]),
      tier('lost', 'She fights the tempo for three minutes and the tempo wins.', [
        '{a} fights the groove of {s} for the entire lip sync and the groove wins. She cannot find the pocket — the hips are somewhere else, the feet are somewhere else, and the body is moving to a song that is not the song playing in the room.',
        'The dance track plays and {a} moves and the movement has no relationship to the rhythm — she is fast when the beat is slow, slow when the beat is fast, and the disconnect between what the room hears and what her body does is total.',
        '{a} does not groove. She stands in a dance track and performs a series of movements that could belong to any song at any tempo, and the specificity of {s} — the thing that makes a dance-tempo lip sync different from any other — is completely absent from her body.',
        'She cannot find it. {s} has a pocket and {a} spends three minutes looking for it in the wrong place, and the panel watches a lip sync where the song and the performance are happening in the same room but not to each other.',
      ]),
    ]),
  tempo('uptempo',
    'FAST, AND IT DOES NOT STOP. Cardio as much as performance. She has to '
    + 'keep up, keep the words, and keep her face doing something while her '
    + 'lungs give out — and a wig that is not sewn down will not survive it.', [
      tier('legendary', 'She does not drop a word or a count and appears not to be breathing.', [
        '{a} hits every word of {s} at full speed and her body never stops moving, and the room watches a queen who is doing cardio and drag at the same time and making both look effortless, which is the most physically impressive thing a lip sync stage can show.',
        'The uptempo demands everything and {a} gives everything and appears to have more — the words are there, the movement is there, the face is there, and the wig survives, and the combination of all four at this speed is the combination that wins a lip sync outright.',
        '{a} does not drop a count or a word through the entire length of {s} and appears not to be out of breath, which at this tempo is either impossible or the result of a queen who has done this in heels on stages far less forgiving than this one.',
        'She matches the speed of {s} and exceeds it. The body is faster than the track demands, the words are ahead of the vocal, and the room is watching a queen who is not keeping up with an uptempo — she is ahead of it.',
      ]),
      tier('strong', 'She keeps up and the effort only shows once, near the end.', [
        '{a} keeps pace with {s} and the pace is punishing and she holds it — the words stay in the right place, the body stays in motion, and the effort only surfaces once, near the end, in a breath between phrases that the panel may or may not have caught.',
        'She matches the uptempo for the whole song and the fatigue only shows in the final thirty seconds, when a step is a half-beat late and a hand grabs the wig and the face recovers fast enough that the moment passes without becoming the story.',
        '{a} rides the speed of {s} and stays on it. The lip sync is not effortless — an uptempo never is — but the effort is managed, the words are there, and the body keeps going when a lesser performance would have started coasting.',
        'The uptempo asks for stamina and {a} has it. She is moving and mouthing and performing at full speed through almost all of {s}, and the one moment where the speed catches her is a moment she recovers from before the next bar.',
      ]),
      tier('trying', 'The song outruns her and she is chasing the words by the last chorus.', [
        'The speed catches up to {a} somewhere in the second verse of {s}. The words start slipping — a phrase late, a line skipped — and by the final chorus she is chasing the vocal rather than riding it, and the chase is visible from every seat in the room.',
        '{a} starts strong and the start is a promise the middle cannot keep, because {s} does not slow down and {a} does, and the deceleration from verse one to verse three is the story of a queen who ran out of tank before the song ran out of road.',
        'The uptempo wins. {a} keeps the words for the first half and loses them for the second, and the losing is gradual — a missed phrase here, a dropped count there — until the lip sync is a queen moving her mouth near the right shapes rather than on them.',
        '{a} is behind {s} by the bridge and further behind by the final chorus, and the distance is the distance between a body that can perform at this speed for ninety seconds and a song that runs for three minutes at this speed without stopping.',
      ]),
      tier('lost', 'She stops performing and starts surviving, and everybody can see the moment.', [
        'There is a moment — the panel can see it, the other queen can see it — when {a} stops lip syncing to {s} and starts enduring it. The words disappear, the movement becomes walking, and the rest of the song is a queen on a stage waiting for a song to end.',
        '{a} is overwhelmed by the speed of {s} from the first chorus. The words are gone, the choreography is gone, and what is left is a queen in heels and a wig trying to survive three minutes of a song that was faster than anything she prepared for.',
        'She stops. Not all at once — the mouth keeps moving for a while — but the body gives up on {s} somewhere around the bridge and the rest is a queen standing in an uptempo like a person standing in traffic, present but not participating.',
        '{a} cannot keep up with {s} and the cannot is immediate and total — the song starts fast and she starts slow and the gap between the two never closes, and the panel watches a lip sync where one queen is performing and the other is standing in the same room as a song.',
      ]),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — THE MOMENT IT IS WON OR LOST. One per hook.
// ══════════════════════════════════════════════════════════════════════
//
// Every song names the one place a lip sync is decided, and it is the same
// place for both queens — which is exactly what makes it worth narrating. Two
// outcomes only: she took it or she did not. There is no middle at a key
// change.
//
// This fires as a SECOND, SHORTER line after the tempo beat, so it should read
// as a moment rather than a summary. It also lands after a line it has never
// seen, so it may not restate how the overall performance went — only what
// happened at this one point in the song.

const hook = (id, note, tiers) => ({ hook: id, note, tiers });

const H = (nailed, missed) => [tier('nailed', nailed), tier('missed', missed)];

export const LIPSYNC_HOOKS = [
  hook('key-change',
    'The song lifts a whole step and everybody in the building knows it is '
    + 'coming, including both queens. Whoever owns that second owns the song.',
    [
      tier('nailed', 'She goes up with it and takes the room with her.', [
        'The key change hits and {a} goes up with it — the face lifts, the chest opens, and the room watches a queen who heard the shift coming and met it at the door.',
        'The song lifts a whole step and {a} lifts with it, and the lift is not just volume — it is the body finding a new register at the exact second the music does, and the panel sees it happen.',
        '{a} rides the key change the way the song intended it to be ridden — everything gets bigger at once, the emotion, the movement, the commitment, and the moment lands because she was ready for it.',
        'When {s} shifts up, {a} shifts with it, and the transition is so clean that the key change feels like it was written for this specific queen on this specific stage.',
      ]),
      tier('missed', 'The song goes up and she stays exactly where she was.', [
        'The key change arrives and {a} does not arrive with it. The song lifts and she stays where she was, and the distance between the song\'s new level and her old one is the distance the panel is measuring.',
        '{s} shifts up a whole step and {a} does not shift — the face is the same, the energy is the same, and the moment that was supposed to be the climax of the lip sync passes without her inside it.',
        'The key change happens around her. The song goes somewhere new and {a} stays somewhere old, and the panel watches a queen miss the one moment everybody in the building knew was coming.',
        '{a} is performing at one level when {s} lifts to another, and the lift happens without her, and the gap between the song\'s new energy and her unchanged energy is the gap that decides this.',
      ]),
    ]),
  hook('breakdown',
    'Everything drops out. A bar or two of almost nothing, and whatever she '
    + 'does in the gap is the thing the edit will use.',
    [
      tier('nailed', 'She does one thing in the gap and it is the right thing.', [
        'The track drops out and {a} does one thing in the silence — a gesture, a freeze, a look straight at the panel — and the thing she does is the thing the edit will use, and it is the right thing.',
        'Everything falls away for a bar and {a} fills the gap with a single moment so precise that the silence around it becomes part of the performance rather than a hole in it.',
        'The breakdown opens a door in {s} and {a} walks through it — one move, one beat of stillness, one choice made in the gap that says more about this lip sync than anything the vocals were covering.',
        '{a} owns the breakdown. The track goes quiet and she does not panic — she does something small and deliberate and devastating, and the room holds its breath until the beat comes back.',
      ]),
      tier('missed', 'The floor falls out of the song and she is caught standing still.', [
        'The breakdown arrives and {a} has nothing for it. The track drops and she is standing in the gap with the expression of a queen who did not know the gap was coming and does not know what to do now that it is here.',
        'Everything drops out of {s} and {a} is caught flat — no gesture, no freeze, no intentional moment, just a queen standing in silence that was supposed to be an opportunity and is instead an exposure.',
        'The track goes quiet and {a} goes quiet with it, but not on purpose — the breakdown catches her mid-move and she stops, and the stopping has the quality of a person startled rather than a performer choosing stillness.',
        '{a} misses the breakdown. The gap opens in {s} and she stands in it without filling it, and the empty bar is the loudest bar of the lip sync because it is the bar where something was supposed to happen and nothing did.',
      ]),
    ]),
  hook('spoken',
    'A spoken passage. No melody to ride and no choreography that fits — it is '
    + 'acting, in the middle of a lip sync, and the words have to land as if '
    + 'she means them.',
    [
      tier('nailed', 'She acts it rather than mouths it and the room goes quiet for it.', [
        'The spoken passage arrives and {a} stops dancing and starts acting — the face changes, the body stills, and the words of {s} come out of a mouth that appears to mean every syllable, and the room goes quiet because this is no longer a lip sync.',
        '{a} hits the spoken section and the lip sync becomes a monologue. She does not mouth the words — she delivers them, with weight and intention, and the room treats the moment the way you treat a moment that is real even when it is not.',
        'The melody drops away and the words are bare and {a} says them like she wrote them. The spoken passage of {s} asks for acting and she gives it acting, and the panel watches a queen shift gears mid-lip-sync without losing a thing.',
        'When the spoken passage arrives {a} is ready for it — the energy changes, the face changes, the performance pivots from movement to meaning, and the words land with the weight of somebody who has lived inside them.',
      ]),
      tier('missed', 'The words come out of a face that is not saying them.', [
        'The spoken passage arrives and {a}\'s mouth shapes the words but her face does not — the section asks for acting and she gives it lip syncing, and the gap between mouthing a line and meaning it is the gap the panel is watching widen.',
        '{a} hits the spoken section and keeps performing as if the melody were still there, and it is not, and the disconnect between a dancing body and spoken words is the moment the lip sync loses its footing.',
        'The words of the spoken passage move through {a}\'s face without engaging it — the lips are right, the expression is wrong, and the room sees a queen who memorized the words but did not prepare to say them.',
        '{a} mouths the spoken passage of {s} the same way she mouths the sung parts, and the spoken passage is the part of the song that punishes that — no melody to hide behind, no beat to ride, just words that are supposed to land and do not.',
      ]),
    ]),
  hook('dance-break',
    'The vocal stops and the track keeps going. Pure movement, no words to '
    + 'hide behind, for as long as the producer felt like.',
    [
      tier('nailed', 'The vocal drops out and she has something ready for it.', [
        'The vocal drops and {a} has been waiting for it — the body takes over, the choreography appears from somewhere she has been keeping it, and the dance break becomes the highlight of the lip sync because she was ready and the readiness shows.',
        '{a} hits the dance break with movement that has clearly been planned. The vocal stops and she does not — the feet go, the hips go, the arms go, and the room watches a queen who knew this moment was in {s} and prepared for it.',
        'The track goes instrumental and {a} fills the gap with pure body — no words to sync, no melody to follow, just movement and music, and the movement wins because she had something ready and the something is specific and physical and undeniable.',
        'When the dance break opens {a} steps into it with choreography sharp enough to make the room react. No words to hide behind, and she does not need them — the body is saying everything the mouth was saying, louder.',
      ]),
      tier('missed', 'The vocal drops out and she has nothing, and the track keeps playing.', [
        'The vocal drops and {a} has nothing. The track keeps playing and her body has no choreography for a section that has no words, and the dance break becomes a stretch of stage time she is standing in rather than performing through.',
        '{a} hits the dance break and the dance break hits back — the words disappear and so does the performance, because she was syncing to a vocal that is no longer there and has no plan for the gap.',
        'The instrumental section opens and {a} is caught without a move. The track is still playing and she is still standing and the distance between a queen who prepared for the break and a queen who did not is the distance the panel is measuring right now.',
        'The dance break arrives and {a} does not dance. The vocal drops out and what is left is a queen on a stage with an instrumental track and no idea what to do with it, and the track does not stop to wait for her to figure it out.',
      ]),
    ]),
  hook('none',
    'NO SINGLE MOMENT. This song hands nobody a gift — no lift, no gap, no '
    + 'break. It is won on consistency, which means these lines are about the '
    + 'ABSENCE of a moment: she has to make one, or she waits for one that is '
    + 'never coming.',
    [
      tier('nailed', 'There was no moment in the song so she built one where none was written.', [
        '{s} offers no gift — no key change, no break, no gap — and {a} does not wait for one. She builds a moment in the middle of a song that has no middle, and the moment is hers because nobody else was going to make one.',
        'The song has no obvious climax and {a} makes one anyway — a gesture, a turn, a shift in energy that arrives where the song did not plan it, and the panel watches a queen create something out of a track that was giving her nothing.',
        'There is no moment in {s} and {a} does not care. She picks a bar and makes it the bar, and the choice is so confident that the room treats it as the climax of a song that has no climax, which is the hardest thing a lip sync can do.',
        '{a} refuses to wait for a moment {s} was never going to give her. Instead she finds a seam in the track — a breath between phrases, a beat between sections — and drives a moment into it, and the moment holds.',
      ]),
      tier('missed', 'She spends the song waiting for a moment the song was never going to give her.', [
        '{a} performs through {s} as if a moment is coming — a build, a drop, a shift — and the moment never comes, because the song does not have one, and the waiting is visible as a queen pacing herself for a climax that was never written.',
        'The song gives her nothing and she takes nothing. {a} lip syncs through a track with no obvious peak and never creates one, and the flatness of the performance matches the flatness of {s} in a way that is honest and unhelpful.',
        '{a} waits for the song to hand her something and the song does not, and the entire lip sync is a queen performing at a steady level through a track that needed somebody to break it open, and nobody broke it open.',
        '{s} has no moment and {a} does not build one. The lip sync ends at the level it began, and the panel watches a queen who gave the song exactly what it offered — nothing exceptional — when the song was waiting for her to add it.',
      ]),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a song into a voice
// ══════════════════════════════════════════════════════════════════════

/**
 * Her lines for this song's tempo, or null.
 *
 * Null rather than a fallback, as everywhere else: the file ships empty and is
 * filled a tempo at a time, and an unwritten tempo keeps the generic
 * `lipsync-beat` in stage-beats.js exactly as it reads today.
 *
 * A song with no tempo tag, or one this file does not carry, also returns null
 * rather than guessing — there are four tempos in songs.js and a fifth would
 * be a data change that should show up as generic prose, not as a wrong one.
 */
export function tempoLinesFor(t, tierId) {
  const x = LIPSYNC_TEMPOS.find(v => v.tempo === t);
  const tr = x && x.tiers.find(y => y.id === tierId);
  return tr && tr.lines.length ? tr.lines : null;
}

/** The hook moment, or null — omitted entirely rather than faked. */
export function hookLinesFor(h, outcome) {
  const x = LIPSYNC_HOOKS.find(v => v.hook === h);
  const tr = x && x.tiers.find(y => y.id === outcome);
  return tr && tr.lines.length ? tr.lines : null;
}

/** Every (pool, key, tier) still waiting on prose. */
export function unwrittenLipsyncVoices() {
  const out = [];
  for (const v of LIPSYNC_TEMPOS) {
    for (const t of v.tiers) if (t.lines.length < 4) out.push(`tempo:${v.tempo}/${t.id}`);
  }
  for (const v of LIPSYNC_HOOKS) {
    for (const t of v.tiers) if (t.lines.length < 4) out.push(`hook:${v.hook}/${t.id}`);
  }
  return out;
}

/** How many tiers exist across both pools, for the progress report. */
export function lipsyncVoiceTierCount() {
  return LIPSYNC_TEMPOS.reduce((n, v) => n + v.tiers.length, 0)
    + LIPSYNC_HOOKS.reduce((n, v) => n + v.tiers.length, 0);
}
