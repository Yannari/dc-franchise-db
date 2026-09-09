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
  /* ══ THE NIGHT OPENS ═════════════════════════════════════════════════
     THE FINALE'S FIRST SCREEN HAD NO WORDS ON IT. It drew the finalists in
     a row under a line naming the format — "Four queens. Two lip syncs,
     then one more." — and that was the entire opening of the biggest night
     of the season: a diagram. Every other screen in the show narrates
     itself; this one introduced the finale the way a fixture list
     introduces a football match.

     Measured at 757 pixels and zero revealable cards, against the
     crowning's 5,031 and sixteen.

     FOR THE WRITER: six variants per tier. The three tiers are the shapes a
     finale can take and they are genuinely different nights — say what is
     actually about to happen. No {a}: this beat is the night, not a queen. */
  {
    id: 'finale-open', step: 'finale-open', scope: 'once', speaker: 'narrator',
    note: 'The finale night opens. No {a}.',
    tiers: [
      tier('bracket', 'A lip sync bracket: semi-finals, then a final.', [
        "The finale is a bracket and the bracket is simple and the simplicity is what makes it terrifying. Two lip syncs, then one more. The winners of the first two face each other in the final. Everybody else watches from the side. There is no showcase, no interview, no performance that lets you show the panel who you are — there is only the song, and whether you are better at it than the person across the stage.",
        "Tonight the crown is decided by lip sync, round by round. The finalists are paired. The winners advance. The losers step aside. Nobody is going home — this is not that kind of night — but the two queens who do not make the final will watch the rest of the evening from the audience, and watching is its own kind of verdict.",
        "A bracket. Semi-finals, then a final. The host announces it and the room absorbs the shape of the night: two duels to decide who reaches the last one, and the last one decides the season. The finalists look at each other. The pairings have not been announced. The mathematics of who you want to face and who you do not is happening behind every set of eyes on that stage.",
        "The night runs on lip syncs and nothing else. The host lays it out — two semi-final rounds, the winners meet in the final — and the format strips away everything except the one thing this show has always used to decide who stays: a song, a stage, and whether you can win a room in three minutes.",
        "The finale is a tournament. The finalists stand in a line and the host draws the bracket — who sings against whom in the semis, and the winners face each other for the crown. It is the simplest format the show has ever used for a finale, and the simplicity removes every place to hide.",
        "Tonight is a bracket. Two semi-final lip syncs, then the final. The host draws the matchups and the room shifts as the finalists work out who they are facing and what that means. There are no interviews. There is no showcase. There is only the stage and the song and the three minutes you get to make a case for the crown with nothing but your body and somebody else's lyrics.",
      ]),
      tier('showcase', 'They perform solo, the host cuts the field, the last two sing.', [
        "The finale runs in two halves. In the first, every finalist performs an original number — her song, her staging, her three minutes to show the room who she is without a challenge brief or a category to answer. Then the host cuts the field to two, and the two lip sync for the crown. The showcase is the audition. The lip sync is the decision.",
        "Tonight each finalist gets a stage of her own. An original number, performed solo, no team and no format to share the weight with. Then the host narrows the field to two, and the last two standing sing for the crown. The night is built to find the queen who can carry a room alone, and the carrying starts now.",
        "The format is a showcase followed by a cut followed by a lip sync for the crown. Each finalist performs her own original number. The host watches all of them and then decides who goes further. The queens who do not make the final two will stand in the wings and watch the rest of the evening happen to somebody else.",
        "Original numbers, then a cut, then the crown. The host lays out the shape of the night and the finalists take it in. The showcase is the part they have been rehearsing since they were cast. The cut is the part they have been dreading. The lip sync is the part that decides everything, and only two of them will reach it.",
        "Tonight the finalists perform solo and then the field gets smaller. The host explains the shape: original numbers, a cut to two, and a final lip sync for the crown. Every finalist has had weeks to prepare her number. What she could not prepare for is the moment after, when the host decides if it was enough.",
        "The finale is a showcase. Each finalist takes the stage alone with an original number — her song, her choreography, her argument for the crown delivered in three minutes of performance. Then the host cuts the field to two and the two lip sync, and the lip sync is the last thing this season does before somebody is crowned.",
      ]),
      tier('duel', 'Two queens and one song for the crown.', [
        "Two queens and one song. The finale has already done its work — the field has been narrowed, the showcases are over, the cut has been made — and what remains is the simplest version of this show's oldest format: two people on a stage, one track, and whoever wins the room wins the crown. There is nothing else tonight.",
        "The finale comes down to a single lip sync. Two queens, one song, one crown. The rest of the season — every challenge, every runway, every critique — has been the sorting that produced these two, and now the sorting is done and what is left is three minutes of music and a decision.",
        "Tonight is one lip sync and nothing else. The host does not need to explain why — the season explained why, week by week, elimination by elimination, until only two queens remained. They stand across the stage from each other. The song has been chosen. The next three minutes are the season.",
        "Two queens face each other on a stage that is otherwise empty. One song. One crown. The format is stripped to its elements and the elements are the only ones this show has ever truly needed: a performer, an opponent, a track, and a room full of people waiting to see who wants it more.",
        "The finale is a duel. Two queens, one stage, one lip sync for the crown. Everything this season built — the records, the rivalries, the weeks of competition that brought these two here — reduces to a single performance. The host names the song. The queens take their marks. The room goes quiet.",
        "One lip sync decides the season. The host says it plainly: two queens, one song, and the winner wears the crown. There is no bracket, no showcase, no preliminary round. The season did the narrowing. Tonight does the deciding.",
      ]),
    ],
  },
  {
    id: 'finale-open-queen', step: 'finale-open', scope: 'per-finalist',
    speaker: 'narrator',
    note: 'One finalist, on the last day. {a} is the queen.',
    writerNote: 'What she is like on the morning of the finale, which is not '
      + 'what she was like in any other episode: she has already survived the '
      + 'competition and the only thing left is to be better than the people '
      + 'she survived it with. Some of them are calm and some of them have '
      + 'not slept. Six variants, and they must not all be nerves — one of '
      + 'these should be a queen who is genuinely enjoying it.',
    tiers: [tier('open', 'A finalist, on the last day of it.', [
      "{a} wakes up on finale morning and the quiet is wrong. The werk room has been full every other morning of this season and today it is not, because the queens who filled it are gone, and the ones who remain are somewhere else in the building doing the same thing she is doing: sitting with a coffee and a garment bag and the knowledge that today is the last day of this.",
      "There is a version of {a} who packed for this and a version of {a} who did not believe she would need what she packed, and the two of them are sharing a body this morning. She has been awake since four. The garment is pressed. The number is rehearsed. The only thing she has not prepared is what losing feels like, because preparing for it felt like inviting it.",
      "{a} is calm. Genuinely calm — not the performed kind that breaks under a question, the kind that comes from having already decided what today is. She has survived every round of this competition. She has the look. She has the number. She eats breakfast. She checks her nails. She is enjoying this, which is the one thing nobody told her a finale could be.",
      "The last morning. {a} stands in front of the mirror in the werk room and looks at the person looking back and the person looking back has changed since the premiere, and the change is visible in the way she holds her shoulders. She is not nervous. She is past nervous. She arrived at a place on the other side of it where the only thing left is the work, and the work is ready.",
      "{a} has not slept. She has been running the number in her head since midnight and the number is ready and she is not, and the gap between those two states is where the morning is living. She drinks a coffee that does nothing. She checks the garment. She checks it again. The queen across the room catches her eye and neither of them says anything, because what is there to say on a day like this.",
      "Finale morning and {a} is quiet in a way she has not been all season. The werk room is half-empty. The queens who are left are the queens who lasted, and lasting is its own kind of preparation. She sits at her station and looks at the mirror message from the last queen who went home and reads it one more time. Then she starts getting ready.",
    ])],
  },

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

  /* ONE QUEEN, COMING BACK. The whole cast returning was a single
     paragraph — the entire eliminated field walked back in and the screen
     rendered one card, 694 pixels, for the loudest minute of the night.
     This fires per returning queen so the room fills up on screen the way
     it fills up in the room.

     FOR THE WRITER: {a} is the returning queen, {b} is a finalist she goes
     to. Eight variants, and they have to differ by WHEN she went home,
     because that is the whole texture: the early boot nobody has seen since
     the premiere arrives differently from the queen who left last week. */
  {
    id: 'finale-return-queen', step: 'finale-return', scope: 'per-returnee',
    speaker: 'narrator',
    note: '{a} is the returning queen. {b} is a finalist she reaches first.',
    tiers: [
      tier('early', 'She went home early and has been waiting the longest.', [
        "{a} comes through the door and half the room does not recognise her immediately, because she went home so early that most of the season happened without her. The recognition arrives a second later and the noise it brings is enormous. She looks different — weeks away from the competition did that — and she walks straight to {b} and the hug is the hug of somebody who has been watching from a distance and is finally close enough to touch.",
        "The early boot gets the loudest entrance. {a} walks in and the room erupts, because the queens who have been here all season have been thinking about her in the abstract — a name on a mirror message, a face from the premiere — and now she is real again. She finds {b} and grabs both hands and says something that gets lost in the noise.",
        "{a} has been gone since the beginning. She walks back in and the drag she is wearing is the best she has ever worn, because she has had weeks to build it and nothing to do but build it. She looks at the finalists and the finalists look at her and the looking contains the whole distance between going home early and being here now. She reaches {b} first. The hug is long.",
        "Nobody has seen {a} since the premiere and {a} has seen everything. She has watched the season from her living room, episode by episode, and walking back into this room with all that knowledge is a different kind of arrival than the first one. She heads for {b} and the embrace says I watched you do this and I am glad I am back in the room where it happened.",
        "{a} comes back. She went home early and she has been carrying that for weeks and the carrying is visible in how carefully she has put herself together tonight. Every choice — the wig, the gown, the heel — is a correction of the version of herself that left this room in the premiere. She finds {b} and the noise around them is louder than anything she heard in her time competing.",
        "The door opens and {a} walks through it and the reaction she gets is proof that going home early does not mean being forgotten. She has been gone the longest and the distance shows in the drag — it is not the look of somebody who packed for a competition, it is the look of somebody who packed for a revenge. She reaches {b} and the hug lifts her off her feet.",
        "{a} arrives in a gown she could not have built inside this competition, because inside this competition she was given challenges and categories and tonight she was given only herself. She looks at the room she left weeks ago and the room has changed and she has changed and neither of them is sure what to make of the other. She crosses to {b} and the crossing is the longest walk she has taken in this building.",
        "She went home early. She has been thinking about it every day since. {a} walks back in and the finalists turn and there is a flash of something — surprise, recognition, the recalibration of a room that has been running without her — before the noise takes over. She makes straight for {b} and the hug is instant and full and does not pretend to be casual.",
      ]),
      tier('mid', 'She went out in the middle of it, with things unfinished.', [
        "{a} walks back in with the energy of somebody who left this competition with unfinished business and has been thinking about the unfinished part for weeks. She is polished. She is poised. She finds {b} and the hug has weight in it — the weight of shared weeks that were cut short. She looks at the finalists and the looking says I should be standing where you are and I know I am not.",
        "The mid-season cut returns and {a} is wearing the look she wished she had worn on the night she went home. She crosses the room with purpose and reaches {b} and says something quiet and specific that makes {b} laugh in the middle of everything. The queens around her are already pulling her into conversations she missed.",
        "{a} comes through the door and the room remembers her immediately, because she was here long enough to be part of the season's story and left early enough that the story changed shape after she left. She finds {b} and the reunion is warm and loud and carries the particular intensity of a friendship that was interrupted rather than finished.",
        "She was here for the middle of it and went home with things unsaid. {a} walks back in and the drag is excellent — better than anything she wore in the competition, because she had time — and the confidence is different. She has been watching the season and she knows exactly where she would have been if she had stayed. She reaches {b} and does not say any of that. The hug says it.",
        "{a} returns with the composure of somebody who has had weeks to process going home and has processed most of it and is still working on the rest. She walks to {b} and the embrace is tight and brief and honest. She looks at the stage. She looks at the finalists on it. She takes a seat in the audience with the posture of somebody who has earned this chair even if she did not earn one on the stage.",
        "The room knows {a}. She was here long enough to build alliances and rivalries and the kind of relationships that do not dissolve when you go home. She walks in and the queens who were her allies rush her and the queens who were not watch with a respect that was not there before she left. She reaches {b} through a crowd. The hug is the anchor of her night.",
        "{a} went home in the middle of the season with a record that could have gone either way, and the ambiguity of it is on her face as she walks back in. She could have lasted. She did not. She reaches {b} and the greeting is real and slightly too long and when it breaks she steps back and smooths her gown and looks at the room she left.",
        "She walks in wearing a look that took her six weeks to build, because six weeks is what she had, and the building was its own kind of therapy. {a} heads straight for {b} and the reunion is immediate and physical and everything the distance was not. Around them the room fills and the noise builds and {a} is part of a season again for the first time since she left it.",
      ]),
      tier('late', 'She was here last week and it is still raw.', [
        "{a} walks back in and it has been days. Days. She went home last week and the competition is still on her skin and the drag she is wearing tonight was packed in a suitcase she had not finished unpacking. She finds {b} and the hug is long and tight and shaking and neither of them lets go first.",
        "The most recent elimination walks back through the door and {a} is not ready. You can see the not-ready in her posture, in the set of her jaw, in the way she looks at the stage she was standing on a week ago. She reaches {b} and does not speak. The hug lasts. When it ends her eyes are wet and she does not wipe them.",
        "{a} comes back and it is raw. She went home days ago and days is not enough time and everybody in the room knows it. She is in gorgeous drag — she had it packed, she always had it packed — but the composure underneath is thin and the room handles her gently. She finds {b} and the greeting is quiet and close and says everything about how recently she was competing.",
        "She was here last week. {a} walks back in and the room gives her something enormous, because the room remembers what it was like to watch her leave and the memory is fresh. She crosses to {b} and the embrace is the one she did not get to have on the night she went home, and {b} holds on because {b} can feel the rawness and the rawness is real.",
        "{a} returns and the wound is still open. She went home recently enough that the lipstick message she wrote on the mirror was cleaned off days ago, not weeks, and the queens who read it are standing in front of her now. She finds {b} and the reunion is a collision — fast, hard, the kind of hug that happens when neither person has had enough time to become okay.",
        "The last queen sent home walks back in and {a} looks exactly like somebody who has not had time to be anywhere else. The drag is immaculate — she packed it before the competition started, hoping she would never need it this early — and the expression behind it is the expression of a person who is still running the lip sync in her head. She reaches {b}. The hug says I am not over it yet.",
        "{a} has been home for days, not weeks, and the difference is visible in everything about her. The other returning queens have had time to rebuild, to regroup, to arrive at the finale as graduates rather than casualties. {a} has not. She walks to {b} with the pace of somebody who is still inside the competition and the competition is still inside her.",
        "She went home last week and has not stopped thinking about it. {a} walks in and the room goes louder than it has for any other returning queen, because the room saw her leave and the leaving was recent and the queens who watched it happen are the ones making the noise. She finds {b} and grabs her and holds on and the holding is not a greeting, it is a completion of something that was interrupted too soon.",
      ]),
    ],
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

  // ══ THE INTERVIEW DIALOGUE ════════════════════════════════════════════
  // Michelle asks, the queen answers — real dialogue, tiered by archetype.
  // Substitutions: {a} name, {wins} win count, {bottoms} BTM2 count,
  // {best}/{worst} top/bottom drag craft, {arc} archetype, {style} drag style,
  // {record} compact record string.
  {
    id: 'finale-interview-ask', step: 'finale-interview', scope: 'per-finalist',
    speaker: 'michelle',
    note: 'Michelle asks the finalist her question. Tiered by archetype category.',
    tiers: [
      tier('fighter', 'Question for a fighter queen.', []),
      tier('schemer', 'Question for a strategic queen.', []),
      tier('heart', 'Question for a heart queen.', []),
      tier('wild', 'Question for a wild-card queen.', []),
    ],
  },
  {
    id: 'finale-interview-answer', step: 'finale-interview', scope: 'per-finalist',
    speaker: 'queen',
    note: 'The queen answers Michelle. Her voice, her story.',
    tiers: [
      tier('fighter', 'Fighter answers.', []),
      tier('schemer', 'Schemer answers.', []),
      tier('heart', 'Heart answers.', []),
      tier('wild', 'Wild-card answers.', []),
    ],
  },
  {
    id: 'finale-interview-follow', step: 'finale-interview', scope: 'per-finalist',
    speaker: 'michelle',
    note: 'Michelle follows up — pushes deeper.',
    tiers: [
      tier('fighter', 'Follow-up for a fighter.', []),
      tier('schemer', 'Follow-up for a schemer.', []),
      tier('heart', 'Follow-up for a heart.', []),
      tier('wild', 'Follow-up for a wild-card.', []),
    ],
  },
  {
    id: 'finale-interview-close', step: 'finale-interview', scope: 'per-finalist',
    speaker: 'queen',
    note: 'The queen closes. Her last word before the showcase.',
    tiers: [
      tier('fighter', 'Fighter closing.', []),
      tier('schemer', 'Schemer closing.', []),
      tier('heart', 'Heart closing.', []),
      tier('wild', 'Wild-card closing.', []),
    ],
  },

  // ══ THE CUT — SUSPENSE AND LAST WORDS ════════════════════════════════
  {
    id: 'finale-cut-suspense', step: 'finale-cut', scope: 'once', speaker: 'host',
    note: 'The host deliberates. Building suspense before naming the two who go on.',
    tiers: [tier('suspense', 'The room holds its breath.', [])],
  },
  {
    id: 'finale-cut-lastwords', step: 'finale-cut', scope: 'per-cut', speaker: 'queen',
    note: 'The cut queen speaks — her last words as a competitor.',
    tiers: [tier('cut', 'Her last words.', [])],
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
