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
      "The door opens and it does not close. One by one the queens who went home this season come back through it — the early boots with a point to make, the mid-season cuts with unfinished business, the one who left last week and has barely slept. Each one arrives in the best drag she owns and the room screams like it is twelve premieres at once.",
      "They come back in reverse order, last out first through, and every re-entrance gets the kind of reception that would have changed the week she left. By the time the queen who went home first walks in — the one nobody has seen since the premiere — the noise is so loud the finalists on stage have given up pretending to be composed.",
      "The returning cast arrives gorgeous and furious about it, because every one of them has had weeks at home to build the look that says I went out too soon and I came back in THIS. The finalists watch them come through and you can see the competition restart in their faces for three seconds before the hugging takes over.",
      "Somebody backstage was supposed to be organising the entrances and has clearly lost control. The queens arrive in pairs, screaming names, grabbing finalists off their marks. The crew abandon the schedule around the fifth re-entrance. The room has not been this full since the first day and it will not be again.",
      "The whole season walks back in and the subtraction that defined every week runs in reverse. The room fills up queen by queen until the cast is whole, and it is strange and good to see them together again — the alliances and the rivalries and the friendships and the one queen who went home so early she never got to be any of those things, standing at the back, taking in a season that happened mostly without her.",
      "The early queens come through first and they are the loudest, because they have been waiting the longest. Then the mid-season cuts, who carry themselves differently now. Then the queen who left last, who still looks like she is deciding how she feels about being here. By the end the finalists are somewhere inside a group hug with no obvious exit strategy.",
      "For one night the season is whole. Every queen who sat in that chair and heard her name called walks back through the door and the room answers each one as though she never left. The noise builds. The cast fills. The finalists, who have been steeling themselves all day, are undone by the first hug.",
      "Each returning queen gets a cheer proportional to how long she has been gone, which means the queen who went home in week two gets one of the biggest reactions of the night. She takes it with her whole face. Later she will say it was worth going home early for that entrance back.",
    ])],
  },

  // ══ THE FINALE RUNWAY ════════════════════════════════════════════════
  {
    id: 'finale-eleganza', step: 'finale-runway', scope: 'once', speaker: 'host',
    note: 'The host opens the finale and names the category. Always Grande Finale Eleganza.',
    tiers: [tier('open', 'The category is Grande Finale Eleganza.', [
      "\"Welcome, welcome, welcome,\" the host says, and the room answers him before the third one lands. \"Tonight, one of you will be crowned America's Next Drag Superstar.\" He lets that sit. \"The category on the runway tonight is Grande Finale Eleganza.\" The lights come up and the runway is longer than it has been all season.",
      "The host takes the stage and looks at the finalists and, for one visible moment, enjoys what he is looking at. \"Racers, you have given me a hell of a season.\" A beat. \"The category is Grande Finale Eleganza. Show me what you saved for last.\" The music starts and it is the best track they have played all year.",
      "\"This is the last runway of this season,\" the host says, and something passes through the room at the word last. \"The category is Grande Finale Eleganza. I want to see the best drag you own, the thing you have been hiding in the bottom of the suitcase since the day you packed.\" He steps back. The first queen walks.",
      "\"I have asked you all season to bring it,\" the host says. \"Tonight I am asking one final time. The category is Grande Finale Eleganza.\" He scans the line. \"And if it is not your best, I will know.\" He is probably bluffing. Nobody wants to find out.",
      "The host opens with three words and a category. \"Finale night, queens. The category is Grande Finale Eleganza.\" Every finalist has had this garment ready since cast photos and the only question is whether it survived the suitcase. From the first step onto the runway, it did.",
      "\"Before anything else tonight,\" the host says, \"walk for me.\" Grande Finale Eleganza. The runway is lit from underneath for the first time this season and the queens step onto it and the whole room changes register — this is not a work room, not a challenge. This is the night the rest of the season was auditioning for.",
    ])],
  },
  {
    id: 'finale-walk', step: 'finale-runway', scope: 'per-finalist', speaker: 'narrator',
    note: 'One finalist walks the finale runway.',
    tiers: [tier('walk', 'The best look she owns, saved all season for tonight.', [
      "{a} takes the runway in a garment she has been saving all season and the saving was worth it. The silhouette earns the walk. The walk earns the reaction. She does not hurry a single step, because tonight is not a night for hurrying and the look does not need it.",
      "This is the look {a} packed first and unpacked last, every week, fourteen times, waiting for the one night it was built for. She walks it out and the construction is visible from the back row — every seam, every bead, every four-in-the-morning decision. None of them were wrong.",
      "{a} comes out and the cast reacts before she reaches the first turn. There is a noise the room makes for a look that is correct and a different noise for a look that exceeds what anyone expected, and this is the second noise. She hears it. She keeps walking.",
      "The finale runway is longer than the one she has been walking all season and {a} uses every inch of it. The reveal — there is always a reveal at a finale — lands where the room can see the whole thing at once and the reaction it earns is an answer to a question she did not ask out loud.",
      "{a} walks the finale runway the way she has walked nothing else this season: slowly, deliberately, and as though nobody is watching, which is a lie she is very good at telling. The look is a love letter to the style she has been building all year. The panel take notes they will not need.",
      "There is nothing tentative about it. {a} has walked this runway every week for months and she has never looked like she belonged on it more than she does right now. A queen in the back who went home on design week whispers to the queen beside her and both of them nod.",
      "{a} walks out in the kind of garment that makes the queen behind her wait two extra seconds before following, because following that immediately would be a mistake. The look is precise. The walk is earned. The moment at the end where she stops and lets the room catch up is the most confident thing she has done all season.",
      "It is not the loudest look on the finale runway but it may be the best-made, and {a} knows the difference between those two things. She walks it like a woman who trusts every stitch and the room responds to the trust — the applause is the quiet kind, the kind that means people are looking at the construction.",
    ])],
  },

  // ══ THE INTERVIEWS ═══════════════════════════════════════════════════
  {
    id: 'finale-interview', step: 'finale-interview', scope: 'per-finalist', speaker: 'host',
    note: 'One-on-one with the host. Why should she be the winner?',
    tiers: [tier('interview', 'The question every finalist is asked, and has to answer alone.', [
      "The host sits {a} down and does not waste the moment. \"Why should you be America's Next Drag Superstar?\" She has had weeks to prepare the answer and throws most of it away, because the rehearsed version is not the honest one and she can hear the difference. What she says instead is shorter. It lands harder.",
      "\"Tell me why it should be you.\" {a} does not answer immediately. The pause is long enough that the host almost fills it, and then she speaks, and what she says is not about the competition — it is about the cost, and whether the cost was worth it. The host leans back. He was not expecting that.",
      "One chair, one question, one queen. {a} makes her case and it is a good case: the challenges she won, the week she should have gone home and did not, the week she came back from the bottom and changed the way the room looked at her. The host listens without interrupting, which from him is a compliment nobody misses.",
      "\"What would losing tonight mean?\" The question goes sideways and it takes {a} apart a little. She talks about the person she was before this season. She talks about the version of herself she does not want to go back to being. She does not cry, but it is close, and the host lets the almost-crying stand because it is more honest than the tears would have been.",
      "\"Convince me.\" {a} laughs, because it is a ridiculous thing to be asked after weeks of doing exactly that, and then she does it anyway. She lists it flat: what she won, what she survived, what the judges told her to change and the one thing she refused to. She never mentions another finalist. The host notices.",
      "{a} is asked why the crown should be hers and she answers by describing the queen she was on day one — smaller, more frightened, unsure she had earned the chair she was sitting in. \"I am not that queen,\" she says. \"You watched it happen. All of you watched it happen.\" That is the whole argument. It does not need another word.",
      "The host asks {a} what she has learned and she says \"to stop apologising for the space I take up,\" and the truth of it is so plain there is nothing to follow it with. The host nods. She fills the silence by talking about the first time she walked into a room in drag and felt like the room was hers, and then she looks at this room and says it still feels exactly like that.",
      "{a}'s interview is not a pitch. It is a confession dressed as one. She talks about the person who told her she would never do this and about how proving them wrong turned out to be less satisfying than she expected. \"I did not do this for them,\" she says. \"I did this for me. The crown would be nice. But I already know what I am.\"",
      "The host asks the question and {a} answers it like somebody who has made peace with both outcomes, which is a strange kind of confidence and a real one. She says she did everything she came to do. She says the crown would be proof but not the point. Then she smiles and says she wants it anyway, and the honesty of the wanting is more compelling than any speech.",
      "\"Why you?\" {a} takes a breath. \"Because I was not comfortable for a single week,\" she says. \"Every challenge scared me. Every runway scared me. I did not feel ready for any of it and I did all of it and I am sitting in this chair.\" She looks at him. \"That is the answer. I kept showing up scared and I am still here.\"",
    ])],
  },

  // ══ THE SHOWCASE ═════════════════════════════════════════════════════
  {
    id: 'finale-showcase-open', step: 'finale-showcase', scope: 'once', speaker: 'host',
    note: 'The finale maxi challenge: each finalist performs her own original number.',
    tiers: [tier('open', 'Individual show-stopping original numbers.', [
      "\"Ladies,\" the host says. \"Your final challenge.\" The stage behind him is being rebuilt while he speaks. \"Each of you will perform an individual, show-stopping, original number. Your song. Your stage. Your name on it.\" There is no brief beyond that, because at this point there does not need to be.",
      "The last challenge of the season is the simplest they have been given and the hardest: one original number each, alone on that stage, with no team to share the credit and no format to hide inside. Whatever a queen is, it will be visible for three minutes.",
      "\"This is the one you have been preparing for since the day you were cast.\" The host names the final challenge — solo original numbers, performed on the biggest stage this competition builds — and the finalists go backstage to become the version of themselves they want the panel to remember.",
      "\"I am going to give you a stage, a song, and three minutes,\" the host says. \"What you do with them is entirely up to you.\" The finalists look at each other. They have known this was coming. Knowing does not make it smaller.",
      "\"Show me who you are,\" the host says. \"Not who this competition turned you into. Who you were before you walked through that door, and who you are leaving as.\" The final challenge: an original number, solo, for the last time these queens will stand on this stage as competitors.",
      "The host delivers the brief with the economy of a man who has done this many times: your song, your choreography, your three minutes. \"Do not waste a second of it,\" he says. \"I will be counting.\" He may not actually be counting. Nobody wants to test the theory.",
    ])],
  },
  {
    id: 'finale-showcase', step: 'finale-showcase', scope: 'per-finalist', speaker: 'narrator',
    note: 'One finalist performs her original number. Tiered by how well it goes.',
    tierBy: 'perf',
    tiers: [
      tier('killed', 'The number of her life.', [
        "{a} takes the stage and by the second chorus every person in the building knows what they are watching. The choreography is hers, the song is hers, and the moment near the end where she drops the performance entirely and stands there — no backup, nothing between her and the room — is the most confident thing anyone has done on this stage all season.",
        "It goes off. {a} owns the stage for three minutes and does not give it back — the dancers, the reveal, the key change she had absolutely no business attempting and absolutely lands. When the lights drop, the returning cast are on their feet and half of them are screaming before the applause has started.",
        "The number builds and keeps building past where it should crest, and {a} rides it all the way up. There is a death drop at the two-minute mark so well-timed the room makes a noise that sounds involuntary. She grins. She was not supposed to grin. She grins anyway and the grin makes it better.",
        "{a} performs like somebody who decided months ago what tonight would look like and has not deviated once. The song is her own, the arrangement sits in her range, and the reveal lands where it was designed to land. The ovation starts before the lights change.",
        "Three minutes and twelve seconds. That is how long it takes {a} to make the case that the rest of the night is a formality. She sings live, dances like the choreography is happening to her rather than being performed, and finishes on a moment so well-placed the silence before the applause is a sound in itself.",
        "The season has been leading here. {a}'s number is fast and funny and then, without warning, it is neither of those things, and the turn is so well-judged that the panel stops assessing and starts watching. She has never been this good. She may never need to be this good again, because tonight was the night that counted.",
      ]),
      tier('strong', 'A real performance, and it holds.', [
        "{a}'s number is polished and it is hers. Nothing about it is borrowed. She sings live where she needs to, lets the staging carry her where she does not, and the whole performance has the clean shape of something rehearsed until the fear went away. The panel are nodding before it finishes.",
        "It is a good number — more than good, it is coherent, which is harder than good on this stage. {a} knows exactly what she is selling and sells it for the full three minutes without losing the thread. There is one moment near the middle that is genuinely exciting. The rest is solid, and solid here is not a small thing.",
        "{a} delivers. The song suits her voice, the choreography suits her body, and she does not attempt a single thing she cannot do under this kind of pressure. That sounds like restraint and it is — the smart kind, the kind that wins competitions — and the panel can tell the difference.",
        "The number works. {a} comes out strong, holds the room through the middle section where these things usually sag, and finishes on a note she has clearly been hitting in the shower for six weeks. The applause is real and it lasts, and she takes it standing still.",
        "A confident, well-built number that does not overpromise. {a} opens with the vocal, moves into the choreography cleanly, and carries the whole thing to a finish that earns the response it gets. She walks off knowing she did what she came to do. Whether it was enough is the host's problem now.",
        "{a} performs a number that is exactly as ambitious as her skill set allows and not one beat more. She knows the move she cannot land under pressure and does not try it. She knows the note at the edge of her range and leaves it alone. What she does instead is tighter, cleaner, and harder to argue with.",
      ]),
      tier('shaky', 'It does not quite land.', [
        "{a}'s number is ambitious and the ambition is showing in the wrong way. A costume change eats two beats the song cannot spare and she spends the rest of the performance chasing it. The ending recovers most of the damage. Most is not all on a night when all is what this stage demands.",
        "It does not quite come together. {a} has the idea, the look, and the nerve, and somewhere between the second verse and the bridge the number stops being about her and starts being about the staging. She finishes strong. The middle is what the panel will remember.",
        "{a} plays it safer than she has played anything all season, and safe is the one thing this stage does not reward. The number is clean, competent, and slightly small, and you can see her realise partway through that she should have taken the risk. The applause is warm. It is not the kind that changes outcomes.",
        "The number gets away from {a} early — a missed cue, then the scramble to catch it, which she nearly manages. What is frustrating is that the material is there. On another night, with one more rehearsal, this is the performance of her life. Tonight it is the one she will replay for months.",
        "There is a stretch in the middle where {a} loses her place and the recovery is visible. She is good enough to pull it back, and she does, but the stumble colours everything after it and the panel's faces confirm what she already knows. She finishes. She knows what their notes say.",
        "{a}'s number is over-rehearsed in the way that pins everything a half-beat behind the music. She is thinking about the next move before the current one has landed and the audience can feel the gap. Her ending is the strongest section, which means the last impression is good and her own impression is that she left the good part too late.",
      ]),
    ],
  },

  // ══ THE CUT ══════════════════════════════════════════════════════════
  {
    id: 'finale-cut', step: 'finale-cut', scope: 'once', speaker: 'host',
    note: 'The host narrows the finalists to the two who will lip sync for the crown.',
    tiers: [tier('cut', 'The field becomes two.', [
      "The finalists stand in a line and the host takes his time, because he always takes his time and tonight he has earned it. \"I have made my decision.\" He names the two who will lip sync for the crown. The queens who are not named take it standing straight, which is the last thing this competition asks of them.",
      "\"Two queens will lip sync for the crown tonight,\" the host says. \"The rest of you have run an extraordinary race.\" The names come one at a time with a silence between them that is longer than it needs to be, and in that silence every finalist does the arithmetic of her own season.",
      "The cut is the cruellest minute of the night and the room knows it is coming. The host thanks the finalists who will go no further and means it, and then he names the two who will, and the line breaks into embraces before he has finished the sentence.",
      "\"I have consulted with the judges,\" the host says, \"but the decision is mine.\" It always was. He names two. The others step back, and the stage gets very large very quickly for the two people left standing at the front of it.",
      "The host looks at the finalists and takes a visible breath. \"I need to make a decision that changes lives, and I do not take that lightly.\" He names two queens. The stage splits — the people going forward and the people who are not — and both halves look exactly the same for three seconds before the difference sets in.",
      "\"You have all earned this finale,\" the host says. \"But only two of you can lip sync for the crown.\" The names come without ceremony — he respects the queens he is cutting too much to stretch it out — and the two who remain look at each other across a stage that has just gotten very quiet.",
    ])],
  },
  {
    id: 'finale-cut-reaction', step: 'finale-cut', scope: 'per-cut', speaker: 'narrator',
    note: 'A finalist who came this far and stops here.',
    tiers: [tier('cut', 'Third or fourth, on the last night.', [
      "{a} does not lip sync for the crown and she takes it the way she has taken everything else here: squarely. She hugs both queens who did. She tells them to win it. Then she walks to the back and lets her face do whatever it needs to do where the cameras have stopped following.",
      "It stops here for {a}. She is a finalist — a sentence she will carry for the rest of her career — and right now that is not enough comfort and later it will be enormous. She applauds the two who go on. She means it, and the meaning costs her something, and she pays it.",
      "{a} came within one name of the crown. She stands there while the two names are read and neither is hers and the composure she keeps in that moment is more impressive than anything she has done in weeks. \"I got here,\" she says afterwards, quietly. \"I got all the way here.\"",
      "The cut takes {a} out on the last night and there is no version of that which is gentle. She is gracious about it immediately and devastated about it privately and both of those are happening at the same time, which is what this competition does to people who gave it everything they had.",
      "{a} mouths the words before the host has finished saying them. She knew. She may have known since the showcase. She holds it together for the room and then she turns to the returning cast and the cast catches her, because that is what the cast is for tonight.",
      "Third or fourth, on the biggest night of the season. {a} steps forward, hugs both finalists hard enough to threaten a wig, and says something quiet that nobody else can hear. Whatever it was, it makes the queen about to be crowned laugh through tears.",
    ])],
  },

  // ══ THE CROWN LIP SYNC ═══════════════════════════════════════════════
  {
    id: 'finale-crown-lipsync', step: 'finale-lipsync', scope: 'once', speaker: 'host',
    note: 'The host sets up the final lip sync. Not for your life — for the crown.',
    tiers: [tier('setup', 'Two queens stand before me.', [
      "\"Two queens stand before me,\" the host says, and the words hit differently tonight because tonight nobody is going home — tonight somebody is being crowned. \"Ladies, this is your last chance to impress me. The time has come for you to lip sync… for the CROWN.\"",
      "The host lets the room settle. \"You have both fought your way here. Now there is one thing left.\" A beat. \"The time has come… for you to lip sync… for the crown.\" The word gets the reaction it always gets and the two queens on stage do not move a muscle.",
      "\"Nobody is sashaying away tonight,\" the host says. \"Tonight, one of you is being crowned.\" He turns to both of them. \"Good luck — and don't fuck it up.\" The music cue is already coming up under his last word.",
      "The same ritual as every week and not the same at all, and the host plays that for everything it is worth. \"Two queens stand before me.\" The pause stretches. \"Lip sync… for the crown.\" The room holds its breath and the two queens on that stage hold everything else.",
      "\"This is the last lip sync of the season,\" the host says, and for once there is nothing behind the words but what they mean. \"Two queens. One crown. Lip sync for the crown.\" The music drops and the two of them move at the same time and the room goes up.",
      "The host looks at each of them in turn and then at the room. \"I want to see everything you have left. Everything.\" He steps back. \"Now lip sync… for the CROWN.\" And they do.",
    ])],
  },

  // ══ MISS CONGENIALITY ════════════════════════════════════════════════
  {
    id: 'finale-congeniality', step: 'finale-award', scope: 'once', speaker: 'host',
    note: 'The audience award, voted by the people watching. {a} is the winner.',
    tiers: [tier('award', 'The sash that is not the crown and is not nothing.', [
      "\"Before we crown a winner,\" the host says, \"there is one more title to give out. Voted for by the people watching — Miss Congeniality.\" He says {a}'s name and the cast reaction is instant and unanimous, which is the point of this award: nobody in that room is surprised and everybody agrees.",
      "The Miss Congeniality sash comes out and the cast start shouting a name before the host has read it, and the name they are shouting is {a}'s. He reads it anyway. She covers her face with both hands. Somebody is already crying on her behalf and the sash has not reached her yet.",
      "\"This one is not my decision,\" the host says. \"It belongs to the people watching.\" The votes went to {a} — the queen this season liked best, which is not the same as the queen who lasted longest and is not the same prize as the crown. She takes the sash and she is genuinely undone by it.",
      "Miss Congeniality goes to {a} and the room agrees with it at volume. It is the award you cannot campaign for and cannot win by being strategic. She holds the sash and says thank you more times than she can count and does not manage a single word beyond it.",
      "{a} is named Miss Congeniality and she looks at the cast before she looks at the host, because the cast is the reason she is holding this. Every one of them is applauding. She mouths something at a specific queen in the back row and takes a sash that may mean more to her than a crown would have.",
      "\"Miss Congeniality,\" the host announces, and the name on the sash is {a}'s. She laughs — the startled kind, the kind that means she believed it and did not believe it at the same time. \"I was nice,\" she says. \"That is literally my entire thing.\" The room loves her for the joke and for meaning it.",
    ])],
  },

  // ══ THE CROWNING ═════════════════════════════════════════════════════
  {
    id: 'finale-runnerup', step: 'finale-crown', scope: 'once', speaker: 'host',
    note: 'The runner-up is named. {a} is the runner-up.',
    tiers: [tier('runnerup', 'Second, on the last night.', [
      "The host holds the pause as long as the pause can be held. \"The runner-up of this season…\" {a}'s name. She closes her eyes for one second and then she is applauding, and the applause is real, because she knows the season she ran and the season was extraordinary.",
      "\"{a},\" the host says. \"You are the runner-up.\" She takes it standing and she takes it well. The queen beside her grabs her hand and does not let go. Second place on a stage like this is a cruel and extraordinary thing to be.",
      "The runner-up is named and it is {a}, and the cheer the returning cast give her is its own kind of crown. She has been in the top of this competition since it began. She lost one lip sync tonight. One. She will carry that for a while and then she will set it down.",
      "{a} hears her name in the runner-up slot and does not flinch. She has known for about ninety seconds. She hugs the winner before the winner has been announced, which tells you everything about the season these two ran together.",
      "\"The runner-up…\" The host says it slowly and {a}'s name follows. One nod. The nod contains the entire season. She has done extraordinary things in this competition and tonight she was one lip sync short and one lip sync is everything. She holds the other queen's hand and raises it.",
      "{a} is the runner-up and the cast at the back give her a reaction that would be a standing ovation anywhere else. She lost one thing tonight. The one thing was the only thing that mattered. She handles it with a grace the room will remember longer than most crownings.",
    ])],
  },
  {
    id: 'finale-crowning', step: 'finale-crown', scope: 'once', speaker: 'host',
    note: 'The crowning itself. {a} is the winner.',
    tiers: [tier('crown', "Con-drag-ulations, you are America's Next Drag Superstar.", [
      "\"Con-drag-ulations,\" the host says. \"{a} — you are America's Next Drag Superstar!\" The crown goes on, the scepter goes in her hand, and the room comes apart. She does not cry until about four seconds in and then she does not stop.",
      "The host says the words: \"{a}, you are the winner of this season, and you are America's Next Drag Superstar.\" The confetti falls before he has finished. She looks at the crown as though she cannot believe it is for her, and then she puts it on, and then she believes it.",
      "\"{a}!\" The crown, the scepter, the entire returning cast losing composure at the back of the stage. She goes to her knees without meaning to. When she gets up she is a different thing than she was on the day she walked through that door, and everybody watching has seen it happen week by week.",
      "It is {a}. The host crowns her and she holds it on with one hand because the fit is not quite right and she does not care. \"America's Next Drag Superstar,\" he says again, in case anybody missed it. Nobody missed it.",
      "\"Con-drag-ulations, {a}.\" The host places the crown himself and says the full title: \"You are America's Next Drag Superstar.\" She laughs — a real laugh, not a camera laugh — and says \"are you sure?\" and he says he is sure, and the scepter goes into her hand, and the stage becomes a celebration.",
      "The host takes the crown from the pillow, holds it above {a}'s head, and says the words every finalist came here to hear: \"Con-drag-ulations. You are America's Next Drag Superstar.\" The crown goes on. The room erupts. She is buried in cast members before the confetti has reached the floor.",
    ])],
  },
  {
    id: 'finale-speech', step: 'finale-crown', scope: 'once', speaker: 'narrator',
    note: 'The winner says something. Never polished — she did not know she had won.',
    tiers: [tier('speech', 'What she says with the crown on.', [
      "{a} takes the microphone and the speech she prepared falls apart on the first word. \"I want to say something profound and I can't,\" she says, and the honesty is better than the speech would have been. She holds the crown on her head with one hand. \"I did it. I actually did it.\" The cast chant her name and she lets them carry it.",
      "\"I didn't write anything down,\" {a} says, \"because I didn't want to jinx it.\" Then she talks anyway, about the person who told her she would never be here, and about proving them wrong being much less important than she used to think it was. \"I'm not here because of them. I'm here because of me.\"",
      "\"Everybody in this room got me here,\" {a} says, and gestures at a cast she has spent months competing against, and means it. \"I did not do a single thing in this competition by myself.\" She holds the scepter like she is worried about dropping it. She thanks her mother. She thanks her mother again.",
      "{a} takes the microphone and says the thing she has not said once the entire season: that she nearly did not come. That there was a version of this year where she stayed home. \"And I would have missed this,\" she says, and looks at the crown, and cannot get the rest of the sentence out.",
      "The winner's speech is nine words long. \"This is for every queen who thought it was them.\" {a} says it, hands the microphone back, and the room is louder for the brevity than it would have been for a paragraph.",
      "\"I want to thank every queen who made me better,\" {a} says. \"Especially the ones who scared me half to death.\" The cast laugh. She names three of them. Two are crying. The third is pretending not to.",
      "{a} starts and stops. Starts again. \"My drag is not for everybody,\" she says, \"and the crown says it does not have to be.\" That one sentence does more work than a prepared speech would have. She hands the microphone back and the scepter catches the light.",
      "\"I prepared something,\" {a} says, and pulls a folded piece of paper from somewhere inside the gown. She looks at it. Looks at the room. Puts it away. \"It was terrible. Never mind.\" The crowd laughs. \"What I actually want to say is: I am standing in a room full of people who believed in me before I was good at this, and some of them are here tonight.\" She does not say who. She does not need to.",
      "{a} does not make a speech. She makes a list. She names every queen who went home this season, in order, and says one true thing about each one — specific, kind, and clearly remembered. It takes longer than a speech and it is better than one. By the end half the room is in tears and she has not said a word about herself.",
      "The winner's speech is not about winning. {a} talks about the first time she ever saw a drag queen perform — the age she was, the room she was in, the queen whose name she does not remember. \"I wanted to be that,\" she says. \"And now I am that for somebody else.\" She looks at the crown. \"This is the proof.\"",
    ])],
  },
  {
    id: 'finale-prance', step: 'finale-crown', scope: 'once', speaker: 'host',
    note: 'The last line of the season. The host sends them all off dancing.',
    tiers: [tier('prance', 'Now let the music play. Now prance.', [
      "\"Now,\" the host says over a room that is already past listening, \"let the music play!\" The whole cast floods the stage — winner, runner-up, every queen sent home since the premiere — and he watches them go and gives the season its final instruction. \"Now prance, my queens. PRANCE!\"",
      "The music comes up and the host raises his arms. \"Prance, my queens! Prance!\" And they do — every one of them, in the best drag they own, on the stage that took them apart and put them back together. Dancing.",
      "\"If you can't love yourself,\" the host calls out, \"how in the hell are you gonna love somebody else?\" The room gives him the amen one last time and he laughs and lets the music take over. \"Now let the music play. Prance, my queens!\" The season ends as it should end, which is loud.",
      "The last thing the host says this season is not about the crown. \"Now let the music play!\" The cast comes forward together and he steps back to let them have it. \"Prance, my queens. Prance!\" The season ends dancing. They always end dancing.",
      "\"If you can't love yourself, how in the hell are you gonna love somebody else?\" The room answers in unison and for one moment everyone in the building is saying the same words. The host grins. \"Now let the music play!\" The winner is in the middle of the cast, crown still on, holding somebody's hand. \"Prance, my queens!\"",
      "The host steps to the side and watches his cast fill the stage. \"Prance, my queens!\" he calls, and the word is both instruction and benediction and it is the last thing this season will hear him say. The music takes over. The queens dance. The winner dances with them, crown on, scepter up, surrounded by every queen this competition put her through, and none of them would have it any other way.",
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
