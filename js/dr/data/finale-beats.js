// ══════════════════════════════════════════════════════════════════════
// js/dr/data/finale-beats.js — the crowning, in the order it happens
// ══════════════════════════════════════════════════════════════════════
//
// THE FINALE IS ITS OWN EPISODE AND IT IS NOT SHAPED LIKE THE OTHER NINE.
// Before this file the engine emitted three bare scenes — the stage opening,
// the duels, and the placements — all with `text: ''`, and every one of them
// was drawn on a screen titled "Sashay Away: the mirror message". The biggest
// night of the season was rendered under a heading about somebody leaving.
//
// The shape below is the one the show actually runs, checked against the
// wikitext of five seasons rather than assumed:
//
//   S9  · a LIP SYNC FOR THE CROWN BRACKET: four queens, two semi-finals,
//         then a final. The two semi-final losers share third and fourth.
//         Miss Congeniality came out of an online vote, tallied in public.
//   S12 · a top three, and TWO runners-up — both losers of the final.
//   S14 · a Las Vegas revue: five walked in, three were cut, the last two
//         lip synced.
//   S15 · the same, and the cut is announced as an elimination.
//   S16 · runway category "Grande Finale Eleganza", then the maxi challenge
//         is "the top 3 perform in individual show-stopping ORIGINAL
//         NUMBERS", then a Top Two, then the crown lip sync. Miss
//         Congeniality went to two queens that year.
//   S17 · identical, with four performing instead of three.
//
// So the modern night runs: the eliminated cast comes back → the finale
// runway → one-on-one interviews with the host → each finalist performs her
// own original number → the field is cut to two → the two lip sync for the
// crown → Miss Congeniality → the runner-up → the crowning.
//
// The host's language is his own and is quoted, not paraphrased: "Two queens
// stand before me", "Con-drag-ulations, you are America's Next Drag
// Superstar", "Now let the music play", "Now prance". Getting these slightly
// wrong is the tell that nobody checked.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const FINALE_BEATS = [
  // ══ THE CAST COMES BACK ══════════════════════════════════════════════
  {
    id: 'finale-return', step: 'finale-return', scope: 'once', speaker: 'narrator',
    note: 'Every queen sent home this season walks back into the room.',
    tiers: [tier('return', 'The whole season, back in one place.', [
      "The door opens and it keeps opening. One by one the queens who went home this season come back through it, in the best drag they own, and the room gets louder with every one of them. There is screaming. There is a queen crying before she has said a word. The season has been a slow subtraction for months and tonight, for one night, all of it is in the same room again.",
      "They come back in reverse order, which means the first one through the door is the one who left last week and the last one through is the one who barely got to unpack. Every entrance gets the same scream. By the end the room is at full capacity for the first time since the premiere and nobody can hear anybody.",
      "The finalists are already on the stage when the rest of the cast walks in, and the finalists lose their composure immediately. Whatever poise they had built up for tonight is gone in four seconds. Somebody's wig is at risk. Somebody is holding two people at once. The room has not been this full since the first day and it will not be again.",
      "The returning queens arrive loud and arrive gorgeous, because every one of them has had weeks to think about exactly what she was going to wear back into this room. Nobody comes back understated. The reunion happens in the doorway and spills into the middle of the floor and the crew give up on getting anybody to their marks.",
      "The season walks back in. The early boots who never got a fair run, the ones who went out in the middle when it started to hurt, the one who left last week and has not slept since. They all come through the same door and the noise they make together is the sound of a cast that survived something as a group and knows it.",
      "For one night the subtraction runs backwards. Every queen this competition removed comes back through the door and the room does the maths out loud — the screaming gets louder each time — until the whole cast is standing where it started and the only difference is that three of them are dressed to be crowned.",
    ])],
  },

  // ══ THE FINALE RUNWAY ════════════════════════════════════════════════
  {
    id: 'finale-eleganza', step: 'finale-runway', scope: 'once', speaker: 'host',
    note: 'The host opens the finale and names the category. Always Grande Finale Eleganza.',
    tiers: [tier('open', 'The category is Grande Finale Eleganza.', [
      "\"Welcome, welcome, welcome,\" the host says, and the room answers before he finishes. \"Tonight, one of you will be crowned America's Next Drag Superstar. The category is… Grande Finale Eleganza.\" The lights come up on a runway that is longer than it has been all season, and the first queen steps onto it.",
      "The host takes the stage alone. \"Racers,\" he says, \"you have come a long way.\" A pause, exactly as long as it needs to be. \"The category is Grande Finale Eleganza. Let's get to it.\" The music starts and the runway is lit like nothing this season has been lit.",
      "\"This is the last time I will say this to this cast,\" the host says. \"The category is… Grande Finale Eleganza.\" Something goes through the room at the words *last time*. The finalists hear it. They walk anyway, because walking is the job, and the looks that come down that runway are the most expensive things any of them own.",
      "The stage is dressed for a coronation and the host does not undersell it. \"Tonight we crown a winner. But first — the category is Grande Finale Eleganza.\" Every look tonight has been planned since the day these queens were cast, saved for exactly this, and it shows from the first step.",
    ])],
  },
  {
    id: 'finale-walk', step: 'finale-runway', scope: 'per-finalist', speaker: 'narrator',
    note: 'One finalist walks the finale runway.',
    tiers: [tier('walk', 'The best look she owns, saved all season for tonight.', [
      "{a} walks the finale runway in the look she has been saving since the day she packed. It is the most expensive thing she owns and she wears it like it cost nothing. The panel stops talking. That is the review.",
      "This is the look {a} would have shown in week one if she had been brave enough, and she is brave enough now. She takes the runway slowly, because there is no reason to rush any more, and the audience noise builds the whole length of it.",
      "{a} comes out and the room reacts before she has finished arriving. The silhouette is a statement about the entire season she has just run — everything she got told to fix, fixed, and everything she got told to lose, kept. She earned the right to that.",
      "There is nothing tentative in {a}'s walk. She has been on this runway every week for months and she has never once looked like she belonged on it more than she does right now. Somewhere behind her a queen who went home in week three says her name out loud.",
      "{a} takes the finale runway like a woman who already knows what she looks like. The reveal — and there is a reveal, because of course there is — lands exactly where she planned it, and the noise it gets is the loudest of her season.",
      "The look {a} chose is not the safe one. She could have walked something clean and correct and let the night carry her; instead she walked the risk, and it pays, and you can see her register that it paid about halfway down the runway.",
    ])],
  },

  // ══ THE INTERVIEWS ═══════════════════════════════════════════════════
  {
    id: 'finale-interview', step: 'finale-interview', scope: 'per-finalist', speaker: 'host',
    note: 'One-on-one with the host. Why should she be the winner?',
    tiers: [tier('interview', 'The question every finalist is asked, and has to answer alone.', [
      "The host sits {a} down and asks the question straight. \"Why should you be America's Next Drag Superstar?\" {a} has had weeks to prepare an answer and she uses about a third of it, because the prepared version is not the true one and she can hear the difference as it leaves her mouth. What she says instead is shorter and it lands harder.",
      "\"Tell me why it should be you.\" {a} does not answer immediately. The pause is long enough to be uncomfortable and she lets it be uncomfortable, and then she says the thing she came here to say — not about the competition, about what got her to it. The host does not interrupt her once.",
      "One chair, one queen, one question. {a} makes her case and it is a good case: the challenges she won, the week she should have gone home and did not, the queen she became somewhere around the middle of this. The host listens with his chin on his hand and at the end he says only \"mm\", which from him is a lot.",
      "{a} sits down opposite the host and gets asked why the crown should be hers, and the answer she gives is the one she has been rehearsing in the mirror at her station for a month. It comes out steadier than she expected. \"I did not come here to be liked,\" she says. \"I came here to be undeniable.\"",
      "The host asks {a} what winning would mean. It is a softer question than the one she prepared for and it takes her apart a little. She talks about the person who is not here to see this. She gets most of the way through it before her voice goes, and the host lets it go, and she finishes anyway.",
      "\"Convince me.\" {a} laughs at that, because it is a ridiculous thing to be asked after everything, and then she does convince him. She lists it plainly — what she won, what she survived, what she fixed after being told to fix it — and never once mentions another finalist, which the host notices.",
      "{a}'s interview is not a pitch. She was asked why it should be her and she answered by describing who she was when she walked in the door, which was not this. \"You watched it happen,\" she says. \"You all watched it happen.\" That is the whole argument and it does not need another sentence.",
      "The host asks {a} the question and she answers it like somebody who has already made peace with either outcome, which is a strange kind of confidence and a real one. She says she has done everything she came to do. She says the crown would be the proof and not the point. Then she smiles and says she wants it anyway.",
    ])],
  },

  // ══ THE SHOWCASE ═════════════════════════════════════════════════════
  {
    id: 'finale-showcase-open', step: 'finale-showcase', scope: 'once', speaker: 'host',
    note: 'The finale maxi challenge: each finalist performs her own original number.',
    tiers: [tier('open', 'Individual show-stopping original numbers.', [
      "\"Ladies,\" the host says, \"your final challenge.\" The stage behind him is being rebuilt while he speaks. \"Each of you will perform an individual, show-stopping, original number. Your song. Your stage. Your name on it.\" There is no brief beyond that, because at this point there does not need to be one.",
      "The last maxi challenge of the season is the simplest one they have been given and the hardest: one original number each, alone on that stage, no cast to hide inside and no format to blame. Whatever a queen is, it is going to be visible for three minutes.",
      "\"This is the one you have been auditioning for since the first day.\" The host names the final challenge — an original number, performed solo, on the biggest stage this show builds — and the finalists go backstage to become the version of themselves they want the world to keep.",
      "The finale challenge is a showcase. Every finalist gets the stage to herself, a song that belongs to her and nobody else, and however long it takes to prove the case she just made in that chair. No partners. No teams. No excuses left.",
    ])],
  },
  {
    id: 'finale-showcase', step: 'finale-showcase', scope: 'per-finalist', speaker: 'narrator',
    note: 'One finalist performs her original number. Tiered by how well it goes.',
    tierBy: 'perf',
    tiers: [
      tier('killed', 'The number of her life.', [
        "{a}'s number is the best thing she has done here and everybody in the building knows it by the second chorus. The choreography is hers, the song is hers, and the moment near the end where she stops dancing entirely and just stands there is the single most confident thing anybody has done on this stage all season. The room comes up.",
        "It goes off. {a} takes the stage alone and does not give it back for three minutes — the dancers, the reveal, the key change she absolutely did not need to attempt and absolutely lands. When the lights drop, the returning cast are on their feet at the back and half of them are screaming her name.",
        "{a} performs like somebody who decided a long time ago what tonight was going to look like. Every beat is placed. The number builds and keeps building past where it should have stopped, and the ending is enormous, and when it is over she is breathing hard and grinning and the noise does not stop for a while.",
        "The whole season has been leading here without saying so. {a}'s original number is fast and funny and then, without warning, it is not funny at all, and the turn is so well-judged that the panel visibly stops assessing and starts watching. She has never been better and she may never be again.",
      ]),
      tier('strong', 'A real performance, and it holds.', [
        "{a}'s number is polished and it is hers. Nothing about it is borrowed. She sings live where she needs to, she lets the dancers work where she does not, and the whole thing has the clean shape of something rehearsed until it stopped being frightening. The panel are nodding before it ends.",
        "It is a good number, and more than that it is a coherent one — {a} knows exactly what she is selling and she sells it for the full three minutes. There is one moment near the middle that is genuinely thrilling. The rest is solid, and solid on this stage is not a small thing.",
        "{a} delivers. The song suits her voice, the staging suits her body, and she does not attempt a single thing she cannot do. That sounds like faint praise and it is not: half the finalists who have stood here have overreached, and she does not, and the number is stronger for the discipline.",
        "The number works. {a} comes out swinging, holds the room through the middle eight where these things usually sag, and finishes on a note she has clearly been hitting in the shower for six weeks. The applause is real and it lasts.",
      ]),
      tier('shaky', 'It does not quite land.', [
        "{a}'s number is ambitious and the ambition is visible in the wrong way. There is a costume change that takes two beats longer than the music allows and she spends the rest of the song a half-step behind it. The ending recovers most of it. Most is not all, on a night like this.",
        "It does not quite come together. {a} has the idea and the look and the nerve, and somewhere between the second verse and the bridge the number stops being about her and starts being about the staging. She finishes strong. The middle is what the panel will remember.",
        "{a} plays it safer than she has played anything all season, and safe is the one thing this stage does not reward. The number is clean, competent and slightly small, and you can see her realise partway through that she should have risked more. The applause is warm. It is not loud.",
        "The number gets away from {a} early — a missed cue, and then the chase to catch back up, which she nearly manages. What is frustrating is that the material is good. On another night, with one more rehearsal, this is the performance of her life. Tonight it is the one she will think about.",
      ]),
    ],
  },

  // ══ THE CUT ══════════════════════════════════════════════════════════
  {
    id: 'finale-cut', step: 'finale-cut', scope: 'once', speaker: 'host',
    note: 'The host narrows the finalists to the two who will lip sync for the crown.',
    tiers: [tier('cut', 'The field becomes two.', [
      "The finalists stand in a line and the host takes his time, because he always takes his time and tonight he has earned it. \"I have made my decision.\" He names the two who will lip sync for the crown. The queens who are not named take it standing up straight, which is the last thing this competition asks of anybody.",
      "\"Two queens will lip sync for the crown tonight,\" the host says. \"The rest of you have run a hell of a race.\" The names come one at a time with a gap between them that is longer than it needs to be, and in that gap every finalist does the arithmetic on her own season.",
      "The cut is the cruellest minute of the night and everybody in the room knows it is coming. The host thanks the finalists who are going no further and he means it, and then he names the two who are, and the line breaks apart into hugs before he has finished the sentence.",
      "\"I have consulted with the judges,\" the host says, \"but the final decision is mine to make.\" It always was. He names two. The others step back, and the stage suddenly looks very large for the two who are left on it.",
    ])],
  },
  {
    id: 'finale-cut-reaction', step: 'finale-cut', scope: 'per-cut', speaker: 'narrator',
    note: 'A finalist who came this far and stops here.',
    tiers: [tier('cut', 'Third or fourth, on the last night.', [
      "{a} does not get to lip sync for the crown and she takes it the way she has taken everything else here, which is squarely. She hugs both queens who did. She tells them to go and win it. Then she walks to the back and lets her face do whatever it needs to do out of frame.",
      "It stops here for {a}. She is a finalist, which is a sentence she will get to say for the rest of her life, and right now that is not much comfort and later it will be enormous. She claps for the two who go on. She means it, and it costs her.",
      "{a} came within one name of the crown. She stands there while the two names are read and neither is hers and the composure she keeps in that moment is the most impressive thing she has done in weeks. \"I got here,\" she says afterwards, to nobody in particular. \"I got all the way here.\"",
      "The cut takes {a} out on the last night of the season and there is no version of that which is not brutal. She is gracious about it immediately and devastated about it privately and both of those are true at once, which is the thing this competition does to people.",
    ])],
  },

  // ══ THE CROWN LIP SYNC ═══════════════════════════════════════════════
  {
    id: 'finale-crown-lipsync', step: 'finale-lipsync', scope: 'once', speaker: 'host',
    note: 'The host sets up the final lip sync. Not for your life — for the crown.',
    tiers: [tier('setup', 'Two queens stand before me.', [
      "\"Two queens stand before me,\" the host says, and the line lands differently tonight because tonight nobody is going home — tonight somebody is getting crowned. \"Ladies. This is your last chance to impress me. The time has come for you to lip sync… FOR THE CROWN.\"",
      "The host lets the room settle. \"You have both fought your way here. Now there is one thing left.\" A beat. \"The time has come… for you to lip sync… for the CROWN.\" The word gets the reaction it always gets and the two queens on the stage do not move a muscle.",
      "\"Nobody is sashaying away tonight,\" the host says. \"Tonight, one of you is getting crowned.\" He turns to the two of them. \"Good luck — and don't mess it up.\" The music cue is already coming up under his last word.",
      "It is the same ritual as every week and it is not the same at all, and the host plays that for everything it is worth. \"Two queens stand before me.\" The pause goes on. \"Lip sync… for the crown.\"",
    ])],
  },

  // ══ MISS CONGENIALITY ════════════════════════════════════════════════
  {
    id: 'finale-congeniality', step: 'finale-award', scope: 'once', speaker: 'host',
    note: 'The audience award, voted by the people watching. {a} is the winner.',
    tiers: [tier('award', 'The sash that is not the crown and is not nothing.', [
      "\"Before we crown a winner,\" the host says, \"there is one more title to give out. Voted for by the people who watched every second of this — Miss Congeniality.\" He says {a}'s name and the cast reaction is instant and unanimous, which is the entire point of the award: nobody in that room is surprised.",
      "The Miss Congeniality sash comes out and the cast start shouting a name before the host has read it, and the name they are shouting is {a}'s. He reads it anyway. She covers her face with both hands. Somebody behind her is already crying on her behalf.",
      "\"This one is not decided by me,\" the host says. \"It is decided by everybody watching at home.\" The votes went to {a} — the queen this season liked best, which is not always the queen who lasted longest and is not remotely the same prize as the crown. She takes the sash and looks genuinely wrecked by it.",
      "Miss Congeniality goes to {a}, and the room agrees with it loudly. It is the award you cannot campaign for. She holds the sash and says thank you about nine times and does not manage a tenth.",
    ])],
  },

  // ══ THE CROWNING ═════════════════════════════════════════════════════
  {
    id: 'finale-runnerup', step: 'finale-crown', scope: 'once', speaker: 'host',
    note: 'The runner-up is named. {a} is the runner-up.',
    tiers: [tier('runnerup', 'Second, on the last night.', [
      "The host holds the pause for as long as the pause can be held. \"The runner-up of this season…\" {a}'s name. She closes her eyes for exactly one second and then she is applauding, and the applause is real, because she knows what she did to get here.",
      "\"{a},\" the host says. \"You are the runner-up.\" She takes it standing, and she takes it well, and the queen beside her grabs her hand and does not let go. Second place on a stage like this is a cruel, extraordinary thing to be.",
      "The runner-up is named and it is {a}, and the noise the returning cast make for her is nearly as loud as the one that is about to come. She has been in the top of this competition since it started. Tonight was one lip sync away and one lip sync is everything.",
      "{a} hears her name in the runner-up's slot and does not flinch. She has known for about ninety seconds. She hugs the winner before the winner has been announced, which tells you everything about the season these two ran together.",
    ])],
  },
  {
    id: 'finale-crowning', step: 'finale-crown', scope: 'once', speaker: 'host',
    note: 'The crowning itself. {a} is the winner.',
    tiers: [tier('crown', "Con-drag-ulations, you are America's Next Drag Superstar.", [
      "\"Con-drag-ulations,\" the host says. \"{a} — you are America's Next Drag Superstar!\" The crown goes on and the scepter goes in her hand and the room comes apart. She does not cry until about four seconds in and then she does not stop.",
      "The host says the words this whole thing exists to arrive at. \"{a}, you are the winner of this season, and you are America's Next Drag Superstar.\" The confetti is already falling before he finishes. She looks at the crown like she is not sure it is for her, and then she puts it on, and then she is sure.",
      "\"{a}!\" The crown, the scepter, the entire returning cast losing their minds at the back of the stage. She goes down on one knee without meaning to. When she gets back up she is a different thing than she was when she walked through that door in episode one, and everybody watching has seen it happen week by week.",
      "It is {a}. The host crowns her and she holds it on her own head with one hand because it does not quite fit and she does not care in the slightest. \"America's Next Drag Superstar,\" he says again, in case anybody missed it. Nobody missed it.",
    ])],
  },
  {
    id: 'finale-speech', step: 'finale-crown', scope: 'once', speaker: 'narrator',
    note: 'The winner says something. Never polished — she did not know she had won.',
    tiers: [tier('speech', 'What she says with the crown on.', [
      "{a} tries to make a speech and it does not go well and that is what makes it good. She thanks the cast. She thanks the queens who went home in the first three weeks by name, all of them, which nobody expected her to be able to do. Then she says \"I'm sorry, I had something\" and gives up on it entirely.",
      "The crown is on and {a} has the microphone and no idea what to do with it. \"I didn't write anything down,\" she says, \"because I didn't want to jinx it.\" Then she talks anyway, about the person who told her she would never do this, and about proving them wrong being much less important than she used to think it was.",
      "\"Everybody in this room got me here,\" {a} says, and gestures at a cast she has spent months competing against, and means it without qualification. \"I did not do a single thing in this competition alone.\" She holds the scepter like she is worried about dropping it. She thanks her mother twice.",
      "{a} takes the microphone and says the thing she has not said out loud in the entire season: that she nearly did not come. That there was a version of this year where she stayed home. \"And I would have missed this,\" she says, and looks at the crown on her own head, and cannot get the rest of the sentence out.",
      "The winner's speech is nine words long. \"This is for every queen who thought it was them.\" {a} says it, hands the microphone back, and the room is louder for the brevity than it would have been for a paragraph.",
    ])],
  },
  {
    id: 'finale-prance', step: 'finale-crown', scope: 'once', speaker: 'host',
    note: 'The last line of the season. The host sends them all off dancing.',
    tiers: [tier('prance', 'Now let the music play. Now prance.', [
      "\"Now,\" the host says over a room that is already past listening, \"let the music play!\" The whole cast floods the stage — winner, runner-up, every queen sent home since the premiere — and he watches them go and adds the only instruction left. \"Now prance, my queens. PRANCE!\"",
      "The music comes up and the host raises his arms and gives the season its last order. \"Prance, my queens! Prance!\" And they do. Every one of them, in the best drag they own, on the stage that took them apart and put them back together, dancing.",
      "\"If you can't love yourself,\" the host calls out, \"how in the hell are you gonna love somebody else?\" The room gives him his amen one final time and he laughs and lets the music take over. \"Now let the music play. Prance, my queens!\" And the season ends the way it should end, which is loud.",
      "The last thing the host says this season is not about the crown at all. \"Now let the music play!\" The cast comes forward, all of them at once, and he steps back to let them have it. \"Prance, my queens. Prance!\"",
    ])],
  },
];

export const FINALE_IDS = FINALE_BEATS.map(b => b.id);

/** Beats with a tier that has no lines written — the gap check. */
export function unwrittenFinaleTiers() {
  const out = [];
  for (const b of FINALE_BEATS) {
    for (const t of b.tiers || []) {
      if (!t.lines || !t.lines.length) out.push(`${b.id}/${t.id}`);
    }
  }
  return out;
}
