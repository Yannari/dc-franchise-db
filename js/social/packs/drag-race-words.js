// js/social/packs/drag-race-words.js
// What the runway's fandom says, and who says it.
//
// DATA ONLY. The reader and the topic list live in drag-race.js; this is the
// half a contributor edits to add a line. Same shape as traitors-words.js.
//
// NOBODY VOTES ON THIS SHOW. A panel ranks the week and the host decides, so
// there is no ballot here, no jury and nothing to campaign for. What this
// fandom argues about instead: who was robbed, whether the panel's taste holds
// up week to week, a track record, a lip sync, a look, and who the edit is
// quietly building into a winner.
//
// Slots: {subject} {actor} {season} {episode} {receipt}. A template naming one
// is only drawn when the event can fill it, so at least half of every pool
// stands on its own.

export const PHRASINGS = {

  // ── the win ───────────────────────────────────────────────────────────────

  'maxi-reaction': {
    'live-reaction': {
      timeline: [
        'SHE DID THAT. {subject} came for every single one of them tonight',
        'not {subject} winning that with the whole panel in agreement',
        'i have been saying it for weeks and tonight the panel finally caught up',
        'that was the best performance anybody has given this season, no notes',
        '{subject} winning and everyone else looking at the floor. delicious',
        'ok that was actually a masterclass and i am unwell about it',
      ],
      chat: [
        'That was a complete performance. {subject} took the week outright and nobody could argue it.',
        'Winning a week like that, with the panel agreeing before the critiques are over, is rare.',
        'I have done that challenge format. Making it look that easy is the hardest part of it.',
        'The gap between {subject} and the rest of that top tonight was enormous.',
        'A win on a week this stacked is worth two on a quiet one. That is a real one.',
        'What I liked most is that it did not look like a bid for a win. It just was one.',
      ],
    },
    'hot-take': {
      timeline: [
        'that win was the first one all season that was not up for debate',
        '{subject} has been building to that for four weeks and nobody was watching',
        'this is what winning a week is supposed to look like actually',
        'people are going to pretend this was close. it was not',
        'if {subject} does not take the crown after that i am rioting',
        '{receipt} and the room still acted surprised',
      ],
      chat: [
        'This is the week the season changed. {subject} stopped being a contender and became the one to beat.',
        'I would argue this was the first unanimous win of the season.',
        'A win changes how the panel watches you for a month. That is the part people underrate.',
        'The performance was good. The choice of how to play it was better.',
        'Nobody else in that top had a case tonight, and I say that as somebody who likes them all.',
        'The interesting question is who is going to answer this next week, because somebody has to.',
      ],
    },
    'stat-drop': {
      timeline: [
        'that is the win that makes the track record undeniable',
        'nobody else in that cast has a week like that on their record',
        'two of the best performances of the season and both from the same queen',
        'count the wins. go on. count them',
        '{subject} is quietly running this season and the edit keeps pretending otherwise',
        'that record is starting to look like a finalist record',
      ],
      chat: [
        'On the record, that is the strongest week anybody has put up so far.',
        'Wins stack. By this point in a season, a queen with several of them is not a surprise any more.',
        'I keep a list. {subject} is at the top of mine and it is not particularly close.',
        'The record says one thing and the edit says another. The record is usually right.',
        'A run like that is what a finalist looks like from the outside.',
        'Two strong weeks is momentum. Three is a front-runner, and we are there now.',
      ],
    },
  },

  'robbed-watch': {
    complaint: {
      timeline: [
        'robbed. flat out robbed and everyone in the chat knows it',
        'how is {subject} not in the top tonight. HOW',
        'that placement makes no sense and nobody has explained it',
        'somebody explain the logic because i cannot find it',
        'putting {subject} there was a decision and it was the wrong one',
        'we are just going to pretend that was fair then',
      ],
      chat: [
        'I do not understand that placement at all. {subject} had one of the best nights on that stage.',
        'A queen can survive being underrated once. Twice in three weeks starts to shape a season.',
        'That was a top performance placed in the middle, and I would like somebody to explain why.',
        'I have been on the wrong end of a call like that, and you can feel the room decide before you speak.',
        'It is not that the call was indefensible. It is that nobody has bothered to defend it.',
        'The panel saw something I did not, and I have watched it twice now.',
      ],
    },
    'hot-take': {
      timeline: [
        '{subject} was better than half that top and the panel knows it',
        'there is a favourite in that panel and it is not {subject}',
        'being forgettable is the only crime on this show apparently',
        'the placements tonight were about the story, not the performances',
        'this is what happens when the panel decides who you are in week two',
        'that call was about last week, not tonight',
      ],
      chat: [
        'Placements are cumulative whether anybody admits it or not, and {subject} is paying for an earlier week.',
        'Once the panel decides what kind of queen you are, you are fighting that and the week at once.',
        'The performance was strong. The reputation around it was not, and that is what got placed.',
        'I would separate the verdict from the reasoning. The verdict is arguable; the reasoning has not been given.',
        'This is the sort of call that looks much worse in a few weeks, when the record is read back.',
        'Nobody on that stage had a better night, and the placement will not say so.',
      ],
    },
    defence: {
      timeline: [
        'leave {subject} alone honestly, that was a good week and you all know it',
        'people dragging {subject} tonight did not watch the same episode',
        'not everybody has to be loud to be good at this',
        'a quiet week is not a bad week and this fandom cannot tell the difference',
        'protecting {subject} at all costs this season',
        'the hate tonight is so disproportionate it is actually funny',
      ],
      chat: [
        'I want to say something in {subject}\'s defence, because the room has been unkind tonight.',
        'A middling week is not a failure. Most of my own weeks were middling and I am still here.',
        'The standard being applied to {subject} is not the standard being applied to anybody else.',
        'She did what the week asked. That it was not flashy is a matter of taste, not quality.',
        'I would rather watch somebody get it right quietly than watch somebody swing and miss loudly.',
        'The pile-on is out of proportion to what actually happened on that stage.',
      ],
    },
  },

  'critique-court': {
    'hot-take': {
      timeline: [
        'the panel has had four different opinions about the same thing this season',
        'they praised that exact choice two weeks ago. TWO WEEKS',
        'the critiques tonight were vibes and nothing else',
        'whatever the panel says it wants, it never places for it',
        'the notes were contradictory and nobody on that stage could say so',
        'imagine being told to take a risk and then placed low for taking one',
      ],
      chat: [
        'The notes tonight did not match the placements, and that gap is where a season gets confusing.',
        'The panel is consistent about taste and wildly inconsistent about how it rewards it.',
        'Getting critiques you cannot act on is the worst part of standing there.',
        'I would like one week where the thing they said they wanted is the thing that placed.',
        'Judging a week against last week rather than against the week itself is how records ossify.',
        'They are being asked to compare a comedy performance with a design one. That is a hard job done loosely tonight.',
      ],
    },
    'quote-dunk': {
      timeline: [
        '"we wanted more" more WHAT. say the thing',
        'saying it was safe is not a note, it is a shrug',
        'they said the same sentence to three different queens tonight',
        '"i wanted to see you" she was RIGHT THERE',
        'this critique could be about literally anybody and that is the problem',
        'the notes get vaguer every week and the placements get firmer',
      ],
      chat: [
        'The note was so general it could have been given to anybody on that stage.',
        'If the feedback cannot be acted on next week, it is not feedback, it is a verdict.',
        'I have had that exact critique. It means they did not remember what you did.',
        'Praise that specific and criticism that vague in the same night is quite the combination.',
        'That was a lovely sentence about nothing in particular.',
        'Ask the panel to name the moment and half of them could not.',
      ],
    },
    'thread-opener': {
      timeline: [
        'thread: every time the panel has praised a choice and then placed someone low for it',
        'ok going through the critiques from episode {episode} because something is off',
        'let me line up what they said with what they did. it will not take long',
        'short thread on how the notes this season stopped matching the calls',
        'pulling up the tape because i do not think i imagined this',
        'quick one. the panel has two standards and they are not secret',
      ],
      chat: [
        'I want to lay the critiques out against the placements, because the room is arguing past each other.',
        'Going through this properly. What was said, what placed, and where those two part company.',
        'Let me take the panel seriously for a minute and see if the week holds up on its own terms.',
        'Before anybody shouts: here is what each of them actually said tonight, in order.',
        'I have a theory about how this panel is scoring the season, and I want to test it out loud.',
        'Worth separating the guest\'s taste from the rest of the panel here, because they were not watching the same show.',
      ],
    },
  },

  // ── the stage ─────────────────────────────────────────────────────────────

  'lipsync-reaction': {
    'live-reaction': {
      timeline: [
        'THAT is a lip sync. that is what it is supposed to look like',
        '{subject} fought for her life and WON it',
        'i am standing. in my kitchen. at midnight',
        'not a single wasted second in that performance',
        'she knew every word and every beat and used both',
        '{receipt} and she made it look like a headline set',
      ],
      chat: [
        'That is how you do it. {subject} performed the song rather than performing at the song.',
        'Standing in that spot and delivering that is much harder than it looked.',
        'She won that in the first thirty seconds and then kept going anyway.',
        'A lip sync like that resets how the room sees you for the rest of the season.',
        'The control in that was the impressive part. No panic, no flailing.',
        'I would happily watch that again before the credits.',
      ],
    },
    gloating: {
      timeline: [
        'and people said she could not perform. look at her',
        'every single person doubting {subject} this week owes her an apology',
        'told you. TOLD YOU',
        'the doubters have gone very quiet tonight',
        'she saved herself and took the whole room with her',
        'remember this the next time you count her out',
      ],
      chat: [
        'Everybody who wrote {subject} off this week should sit with that performance for a minute.',
        'The room had decided she was going home. She had not.',
        'That is the best possible answer to being underestimated, and she gave it without saying a word.',
        'I enjoyed that more than I should have, largely because of who doubted her.',
        'A win there is worth more than a quiet safe week. Everybody just watched it.',
        'She has bought herself weeks of goodwill with three minutes of work.',
      ],
    },
    respect: {
      timeline: [
        'both of them were good and that is the part nobody says',
        'no notes for either of them honestly, that was a hard one to call',
        'genuine respect for standing there and doing that under pressure',
        'that was not a fight, that was two people at their best',
        'hard to lose to a performance like that',
        'whatever happens next, that was a proper moment',
      ],
      chat: [
        'Both of them left everything on that stage, and only one could stay. That is the cruel part.',
        'Losing a lip sync that good is not a failure, and I hope she knows it.',
        'The one who went home did nothing wrong tonight. She met somebody in better form.',
        'You do not get performances like that from people who are frightened. Both of them committed.',
        'I have been in that pairing. You know halfway through whether it is going your way.',
        'Credit to whoever picked that song. It gave them both something to do.',
      ],
    },
  },

  'sashay-reaction': {
    'live-reaction': {
      timeline: [
        'no. NO. not {subject}',
        'she got robbed of weeks she should have had',
        'gutted. genuinely gutted about this one',
        'the season just lost its most interesting person',
        'i am not ready for that goodbye at all',
        'she deserved so much more than that',
      ],
      chat: [
        'I am sorry to see {subject} go. She was doing something nobody else in that cast was.',
        'That is an early exit for a queen who had much more to give.',
        'The room will be quieter next week, and not in a good way.',
        'She leaves with one of the better performances of the season behind her, for whatever it is worth tonight.',
        'A hard exit to watch. She knew before the song ended.',
        'You could see the others take it badly. That tells you what she was in that room.',
      ],
    },
    sympathy: {
      timeline: [
        'take your time and come back stronger, we will all be here',
        'she has nothing to be ashamed of at all',
        'one bad week does not undo a good season',
        'the way she handled that exit says more than any placement',
        'that goodbye was more gracious than i would have managed',
        'the fandom is going to be so good to her and she deserves it',
      ],
      chat: [
        'Going out is awful. Going out gracefully, in front of everyone, is much harder than it looks.',
        'She will look back at this season kindly in a year, once tonight stops stinging.',
        'The exit does not define the run, whatever it feels like this week.',
        'I hope somebody tells her how well she handled that, because she will not see it herself yet.',
        'The people who leave like that are the ones this fandom keeps.',
        'Nothing about tonight takes away what she did earlier in the season.',
      ],
    },
    'hot-take': {
      timeline: [
        'wrong queen went home and it is not close',
        'that exit was decided three weeks ago, not tonight',
        'the season needed her more than it needs whoever stayed',
        'sending her home for one bad week after the run she had is mad',
        'they got rid of the most interesting person in that room again',
        'this is the exit people will still be arguing about at the reunion',
      ],
      chat: [
        'I would argue the wrong queen went home, and the track records back me up.',
        'That decision was about a body of work, not about tonight, and it should have been about tonight.',
        'Losing her now costs the season more than it costs her.',
        'The person who stayed has had three quiet weeks. Nobody is talking about that.',
        'This is the exit that gets relitigated at the reunion, and it should be.',
        'She was the only queen in that cast taking real swings, and the swings are why she is gone.',
      ],
    },
  },

  'double-shantay-talk': {
    'live-reaction': {
      timeline: [
        'BOTH OF THEM. nobody is going home. i am fine',
        'the scream i just let out. both of them stay',
        'that is what a good lip sync buys you',
        'they were both too good to lose and the host knew it',
        'nobody goes home and the whole room is crying. lovely',
        'genuinely did not see that coming and i am delighted',
      ],
      chat: [
        'Both of them earned that. It is rare and it should stay rare, and tonight it was right.',
        'You could see it the moment the song ended. Neither of them deserved to go.',
        'Everybody stays, and next week just got considerably harder for the rest of them.',
        'That is the correct call and I say that as somebody who usually hates a reprieve.',
        'The room went up. That reaction was not manufactured.',
        'Two performances that good in the same three minutes is not something you can punish.',
      ],
    },
    complaint: {
      timeline: [
        'nobody went home AGAIN. what are we doing',
        'sweet but now next week takes two and one of them will be a favourite',
        'saving both is lovely until you see the double next week',
        'the cast is too big for this and everyone knows it',
        'i love them both but somebody had to go',
        'this is the kind of mercy that costs somebody else a place later',
      ],
      chat: [
        'A lovely moment tonight and a problem in a fortnight, when the numbers have to catch up.',
        'Saving both is generous. Somebody pays for that generosity later in the season.',
        'I enjoyed it, and I also think it takes the stakes out of the next few weeks.',
        'The schedule does not change because the host was moved. That is the part people forget.',
        'If nobody goes home now, two go later, and the second one will feel much worse.',
        'It was the right call for tonight and the wrong one for the season.',
      ],
    },
  },

  // ── the runway ────────────────────────────────────────────────────────────

  'runway-talk': {
    gushing: {
      timeline: [
        '{receipt} and half that cast understood the assignment perfectly',
        'the looks tonight were the best of the season, no argument',
        'i would frame that walk honestly',
        'that category brought out something special and you could feel it',
        'the craft on that stage tonight was ridiculous',
        'obsessed with what {subject} did with that brief',
      ],
      chat: [
        'That category gave everybody something to say, and most of them said it well.',
        'A strong runway night. Three of those would walk any stage anywhere.',
        'The ones who read the brief properly rather than literally are the ones who landed it.',
        'I love a category that can be answered ten different ways, and tonight it was.',
        'The construction on a couple of those was genuinely impressive up close.',
        'Best runway night of the season so far, and it is not particularly close.',
      ],
    },
    dunk: {
      timeline: [
        'some of those looks were made the night before and it SHOWS',
        'the category was right there and half of them ignored it',
        'a colour is not a concept, i am afraid',
        'that was a nice outfit and not an answer to the brief',
        'the panel was far too kind about that runway',
        'we are grading on effort again apparently',
      ],
      chat: [
        'Several of those did not answer the category at all, and the panel let it pass.',
        'A good garment and a wrong answer are different things, and tonight they were graded the same.',
        'You can see who planned for the week and who packed for a different one.',
        'The brief was clear. The interpretations were not.',
        'I would have sent a couple of those back to the werk room, honestly.',
        'The fabric was doing a lot of arguing on behalf of the idea.',
      ],
    },
    'hot-take': {
      timeline: [
        'a runway can save a bad week and this fandom refuses to admit it',
        'the best look tonight came from somebody in the bottom half',
        'every season has one category that separates the crafters from the shoppers',
        'the walk matters as much as the look and nobody talks about the walk',
        'that category was harder than it sounded and it showed',
        'presentation carried more of that stage than the sewing did',
      ],
      chat: [
        'The runway is scored much more heavily than anybody admits, and tonight proved it again.',
        'The best look on that stage belonged to a queen who placed nowhere near the top.',
        'Categories like that reward the people who can build, and that is not the same as the people who can perform.',
        'How you carry a look is half of it. A perfect garment walked badly reads as nothing.',
        'A brief that broad separates the cast fast. You can see who has a point of view.',
        'I would take one strong idea over three expensive ones, and so would the panel on a good night.',
      ],
    },
  },

  'mini-talk': {
    'live-reaction': {
      timeline: [
        'not {subject} winning the mini and then floating through the rest of the night',
        'the mini is the funniest five minutes of this show every single week',
        '{subject} won that in about four seconds',
        'genuinely the best part of the episode and it was over immediately',
        'i would watch an hour of just that',
        'she was so quick with that. deserved',
      ],
    },
    dunk: {
      timeline: [
        'winning the mini has never once mattered and yet',
        'congrats on the mini, see you in the bottom later',
        'the mini curse is real and i will not be taking questions',
        'that mini was over in a minute and will be forgotten in two',
        'imagine peaking at the mini',
        'the mini is a warm-up and half of them treat it like a final',
      ],
    },
  },

  // ── the season, watched from outside ──────────────────────────────────────

  'edit-watch': {
    'call-out': {
      timeline: [
        'the edit has decided who wins this season and we are all just watching',
        'three confessionals for {subject} and nobody else got one',
        'we have not heard from half that cast in two weeks',
        'being handed the story is not the same as earning it',
        'you can see the shape of this season from here and it is not subtle',
        'the winner\'s edit is doing a lot of heavy lifting tonight',
      ],
      chat: [
        'The edit is building somebody, and it has not been subtle about it for three weeks.',
        'There are queens in that cast we have barely met, and we are a third of the way in.',
        'Screen time is not a reward, but it does decide who the audience can root for.',
        'I would like one week where the story followed the stage instead of the other way round.',
        'Somebody is being set up here, and the placements have started agreeing with it.',
        'The people getting the fewest confessionals are the ones who will surprise everybody later.',
      ],
    },
    'hot-take': {
      timeline: [
        'the edit is not the show, the stage is, and this fandom keeps forgetting',
        'you cannot edit somebody into a good week',
        'half the discourse this season is about screen time and not performances',
        'nobody is being buried, some people are just quiet',
        'the edit tells you what the season thinks it is about. that is all',
        'an invisible queen with a strong record is the most dangerous thing here',
      ],
      chat: [
        'An edit can shape how a season feels. It cannot put a win on somebody\'s record.',
        'The quiet queens with strong records are the ones I would worry about, not the loud ones.',
        'Screen time follows story, and story follows conflict. That is not the same as who is good.',
        'I would rather read the record than read the edit, and they disagree this season.',
        'Being underexposed early is survivable. Being overexposed early rarely is.',
        'The audience decides who it likes in week two and spends the season defending that choice.',
      ],
    },
  },

  'track-record': {
    'stat-drop': {
      timeline: [
        'look at the record and tell me who is actually running this season',
        'she has never been in the bottom once and nobody mentions it',
        'wins are not everything but they are not nothing either',
        'consistent and never exciting is a real strategy and it is working',
        'the strongest record in that cast belongs to somebody nobody talks about',
        'that is now the deepest run without a bad week this season',
      ],
      chat: [
        'On the record alone, the front-runner is not who the room thinks it is.',
        'Never having been in the bottom is worth as much as an extra win by this stage.',
        'A record of quiet good weeks beats a record of one spectacular week and three poor ones.',
        'I score a season on the body of work, and the body of work here is fairly clear.',
        'Consistency is unglamorous and it is how most of these seasons are actually won.',
        'By this point, the top of that record has separated from the middle properly.',
      ],
    },
    'hot-take': {
      timeline: [
        'a record built on easy weeks is not the same as a record built on hard ones',
        'one big win does not beat four solid weeks, sorry',
        'the queen with the most wins is not automatically the best queen here',
        'peaking in week three is not a track record, it is a highlight',
        'people are ranking by vibes and the record says otherwise',
        'she is coasting on one good night from a month ago',
      ],
      chat: [
        'Not all wins are equal, and the ones on this record came on the easier weeks.',
        'I would take four steady weeks over one enormous one, and the panel usually does too.',
        'The gap between the best record and the loudest queen is the story of this season.',
        'A record tells you what somebody has done. It does not tell you what they can still do.',
        'Somebody is going to make a run from the middle of that record. They always do.',
        'Ranking by memory rather than by record is how a fandom gets a finale wrong.',
      ],
    },
    dunk: {
      timeline: [
        'that record does not say what you think it says',
        'safe eight weeks running is a record, technically',
        'she has done nothing for a month and is still here somehow',
        'never in the bottom, never memorable either',
        'a whole season of being fine',
        'reading that record out loud would take four seconds',
      ],
      chat: [
        'A long run of safe weeks is survival, not a case for the crown.',
        'She has been in that cast for a month and I could not tell you one thing she did.',
        'Avoiding the bottom is a skill. It is not the same as winning a season.',
        'The record is clean and it is also thin, and at this stage thin starts to count against you.',
        'There comes a week where safe stops being enough, and it usually arrives without warning.',
        'You cannot build a finale case out of not having been bad.',
      ],
    },
  },

  // ── the last night ────────────────────────────────────────────────────────

  'crown-verdict': {
    'live-reaction': {
      timeline: [
        'SHE WON. i am sobbing in a kitchen at 1am and i regret nothing',
        'the right queen won and i did not think we would get that',
        '{subject} took it and the whole season made sense at once',
        'been rooting for that since the first episode and it PAID OFF',
        'that crowning was everything, genuinely',
        'i am so normal about this. so normal',
      ],
      chat: [
        'The right result. {subject} had the record, the stage presence and the best final night.',
        'That is a deserved crown, and the run behind it was the strongest of the season.',
        'I am thrilled for her. She grew more across that season than anybody else in the cast.',
        'A finale that ended the way the season had been pointing for weeks. Satisfying.',
        'She was the best queen there on the night, which is not always how these end.',
        'Watching somebody arrive at that moment having earned every part of it is the whole show.',
      ],
    },
    'hot-take': {
      timeline: [
        'the record said this weeks ago and people refused to hear it',
        'best queen won. rare for this show honestly',
        'the finale was the easiest call of the whole season',
        'that crown was decided in the middle of the season, not tonight',
        'somebody else peaked louder but she was better for longer',
        '{receipt} and it still took people by surprise',
      ],
      chat: [
        'The finale confirmed what the record had been saying since the middle of the season.',
        'Crowns are won in the weeks nobody remembers, and hers were.',
        'I would argue the season was decided before the final night, and the final night agreed.',
        'The queen who peaked loudest is not the queen who won, and that is usually the healthy outcome.',
        'A finale like that makes the earlier placements look much more sensible.',
        'What settled it was consistency, and consistency is a strange thing to celebrate but it is the truth.',
      ],
    },
    complaint: {
      timeline: [
        'wrong winner and i will be saying that for years',
        'the crown went to the story, not the record',
        'she was handed that from episode four and we all watched it happen',
        'best queen of the season went home in week nine and nobody wants to talk about it',
        'that final decision undid a whole season of good judgement',
        'this fandom will be arguing about that result until the next one starts',
      ],
      chat: [
        'I do not think that is the right result, and the record does not think so either.',
        'There is a version of that finale where the best season wins, and we did not get it.',
        'The crown followed the narrative rather than the body of work, which happens more than anybody likes.',
        'She had two of the best weeks of the season. Somebody else had eight good ones.',
        'A finale can overwrite a season if you let the last night count for everything, and it did tonight.',
        'I will be arguing about that call for a long time, politely and at length.',
      ],
    },
  },

  'congeniality-talk': {
    gushing: {
      timeline: [
        'not {subject} getting it and deserving it more than anyone has',
        'she held that whole cast together and everyone knew it',
        'the nicest person in that room and she got the sash for it',
        'genuinely the best human being on that season',
        'she was kind to everybody and it was not for the cameras',
        'crying about {subject} again, as is tradition',
      ],
    },
    dunk: {
      timeline: [
        'the sash for being pleasant. the highest honour',
        'congrats on being everyone\'s second favourite',
        'that sash is what you get instead of a crown',
        'nicest queen in the room, safest queen in the room, coincidence',
        'she was lovely and that is genuinely all i can tell you about her season',
        'somebody had to win it i suppose',
      ],
    },
  },
};

/**
 * What an alumni host says when the room has no line of her own for the night.
 * `s` is the subject's display name — EMPTY for the four kinds below that have
 * no subject, which is why none of them name one.
 */
export const CHAT_TAKES = {
  'maxi-win': [
    ({ s }) => `${s} won that outright. Nobody on that stage had an argument.`,
    ({ s }) => `A win like that changes how the panel watches ${s} for the next month.`,
    ({ s }) => `I have done that kind of week. Making it look easy is the hard part.`,
    ({ s }) => `${s} took the week and did not look surprised about it, which tells you something.`,
    ({ s }) => `That was the best thing anybody has done on that stage this season.`,
    ({ s }) => `Winning a strong week is worth two quiet ones, and that was a strong week.`,
    ({ s }) => `The gap between ${s} and the rest of that top was enormous tonight.`,
    ({ s }) => `A performance that complete usually means somebody has been preparing for weeks.`,
  ],
  'high-praise': [
    ({ s }) => `${s} was very good tonight and a fraction away from the win.`,
    ({ s }) => `Being that close and not taking it is a frustrating place to stand.`,
    ({ s }) => `${s} has been in that top three times now. That is a real record.`,
    ({ s }) => `A high is a good week. It is also a week you can feel slipping away while you stand there.`,
    ({ s }) => `The performance was strong. The winner was simply stronger.`,
    ({ s }) => `I would have had ${s} higher, and I would not have argued too hard about it.`,
    ({ s }) => `Consistently near the top is how a season is won, whatever the highlights say.`,
    ({ s }) => `Nothing to fix there. Just somebody else having the better night.`,
  ],
  'low-placement': [
    ({ s }) => `${s} was in the bottom group and did not have to sing for it, which is a mercy.`,
    ({ s }) => `A low week is a warning. The queens who hear it properly do not get a second one.`,
    ({ s }) => `Being named down there does something to your head for the next week.`,
    ({ s }) => `${s} got away with one tonight, and she will know that better than anybody.`,
    ({ s }) => `The notes were harsh and, I thought, mostly fair.`,
    ({ s }) => `You can come back from a week like that. Plenty of us have.`,
    ({ s }) => `Not up for elimination, but not forgotten either. The panel remembers.`,
    ({ s }) => `I would rather be told now than find out in a fortnight.`,
  ],
  'bottom-two': [
    ({ s }) => `${s} is in the bottom two and about to perform for her place in this.`,
    ({ s }) => `Standing there waiting for the song to start is the longest minute of your life.`,
    ({ s }) => `${s} has been building to this for a couple of weeks. Tonight it caught up.`,
    ({ s }) => `Two queens, one stays. There is no clever way to describe it.`,
    ({ s }) => `The bottom two is where this show finds out who actually wants it.`,
    ({ s }) => `I have been in that pairing, and you know halfway through how it is going.`,
    ({ s }) => `Whatever happens next, ${s} has to shake it off and perform in about four seconds.`,
    ({ s }) => `The waiting is worse than the song. Everybody who has done it says the same.`,
  ],
  'lipsync-win': [
    ({ s }) => `${s} saved herself, and did it well enough that nobody will forget it.`,
    ({ s }) => `That is the performance you keep in your back pocket for exactly that moment.`,
    ({ s }) => `${s} has bought weeks of goodwill with three minutes of work.`,
    ({ s }) => `Winning that resets how the room sees her, and she knows it.`,
    ({ s }) => `Control is what wins those. No panic, no flailing, just the song.`,
    ({ s }) => `I would happily watch that again right now.`,
    ({ s }) => `She performed the song rather than at it, which is the whole difference.`,
    ({ s }) => `A good lip sync is the fastest way to change your season. That was a good one.`,
  ],
  sashay: [
    ({ s }) => `${s} is going home, and this cast is smaller for it.`,
    ({ s }) => `She leaves with a run that will look better in a month than it does tonight.`,
    ({ s }) => `That is a hard exit. ${s} did nothing wrong tonight except meet somebody in better form.`,
    ({ s }) => `You could see the room take it badly, and that tells you what she was in there.`,
    ({ s }) => `Going out in front of everybody is brutal, and she handled it better than I would have.`,
    ({ s }) => `The season loses somebody it needed. That happens most weeks and it never gets easier.`,
    ({ s }) => `I hope somebody tells ${s} how well she took that, because she will not see it yet.`,
    ({ s }) => `One bad week ends a good run. That is the cruelty of the format.`,
  ],
  'double-shantay': [
    () => `Nobody is going home. Both of them earned that, which is the only reason it should ever happen.`,
    () => `A reprieve is lovely tonight and a problem in a fortnight, when the numbers catch up.`,
    () => `Two performances that good in three minutes cannot be punished, and they were not.`,
    () => `The room went up. That reaction was not manufactured.`,
    () => `I usually hate a save. I have no complaints about this one.`,
    () => `Everybody stays, and next week just got much harder for the rest of that cast.`,
    () => `You could tell the moment the song ended that neither of them was leaving.`,
    () => `Generous, and somebody pays for that generosity later in the season.`,
  ],
  'mini-win': [
    ({ s }) => `${s} took the mini, which is five minutes of fun and no protection at all.`,
    ({ s }) => `Quick, silly and over. The mini is my favourite part of a night and the least important.`,
    ({ s }) => `Winning that puts you in a good mood for about an hour.`,
    ({ s }) => `${s} was fast on that. You cannot teach it.`,
    ({ s }) => `A mini win buys nothing and feels wonderful, which is a strange combination.`,
    ({ s }) => `The mini tells you who is loose and who is already worrying about the main event.`,
    ({ s }) => `I won a few of those. Not one of them saved me later.`,
    ({ s }) => `Good start to a night. Now the actual work begins.`,
  ],
  'runway-category': [
    () => `A category that broad separates a cast fast. You can see who has a point of view.`,
    () => `The ones who answered the brief rather than decorating it are the ones who landed it.`,
    () => `Strong runway night. Two or three of those would walk any stage anywhere.`,
    () => `You can always tell who planned for the week and who packed for a different one.`,
    () => `A good garment and a wrong answer are different things, and they get graded the same far too often.`,
    () => `How you carry a look is half of it. A perfect build walked badly reads as nothing.`,
    () => `I would have sent a couple of those back to the werk room, honestly.`,
    () => `The best look tonight did not come from the top of the call, which happens more than people think.`,
  ],
  congeniality: [
    ({ s }) => `${s} held that cast together, and the sash says so out loud.`,
    ({ s }) => `Being the person everybody goes to is real work, and it never shows on a record.`,
    ({ s }) => `I am glad ${s} got that. It is not a consolation prize whatever people say.`,
    ({ s }) => `The room decides that one, and the room is rarely wrong about it.`,
    ({ s }) => `Kind, and not for the cameras. You can tell the difference on a rewatch.`,
    ({ s }) => `A season is long. Somebody has to be the calm one, and ${s} was.`,
    ({ s }) => `That sash means more in five years than most placements do.`,
    ({ s }) => `Everybody in that cast will say the same thing about her, which is the whole point.`,
  ],
  finale: [
    () => `The right queen took it. The record said so weeks ago.`,
    () => `A crown is won in the weeks nobody remembers, and those weeks were there.`,
    () => `That is a deserving result and a satisfying way to end a season.`,
    () => `I would have had it the same way, and I did not expect to.`,
    () => `The finale confirmed the season rather than overturning it, which is the healthier outcome.`,
    () => `What settled that was consistency. Not glamorous, and true.`,
    () => `A final night that good makes the earlier calls look much more sensible.`,
    () => `Whatever anybody thinks of the result, that was a proper finale.`,
  ],
  'episode-aired': [
    () => `A good episode. The stage decided it, which is how it should be.`,
    () => `That was a stronger week than the last two, and the cast felt it.`,
    () => `The top and the bottom were both defensible tonight. That does not happen often.`,
    () => `You can feel the season narrowing. Everybody on that stage can feel it too.`,
    () => `Nobody coasted through that week, which is the sign of a cast that has worked out where it is.`,
    () => `The room is starting to separate properly, and the records are separating with it.`,
    () => `I enjoyed that far more than I expected to, and I am not sure the panel did.`,
    () => `From here on, a quiet week starts costing people. It always does.`,
  ],
};

/** The regulars who watch this show. */
export const PERSONAS = [
  {
    handle: '@lipsyncledger', name: 'nia', since: 3, archetype: 'analyst',
    voice: { caps: 0.1, emoji: 0.2, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2, feelings: {},
  },
  {
    handle: '@readthebrief', name: 'vic', since: 6, archetype: 'hater',
    voice: { caps: 0.3, emoji: 0.3, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.5, feelings: {},
  },
  {
    handle: '@robbedagain', name: 'juno', since: 2, archetype: 'stan',
    voice: { caps: 0.55, emoji: 0.7, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.85, feelings: {},
  },
  {
    handle: '@serveddaily', name: 'rae', since: 9, archetype: 'casual',
    voice: { caps: 0.25, emoji: 0.8, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.6, feelings: {},
  },
  {
    handle: '@untuckedhours', name: 'sol', since: 5, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.5, length: 'medium', punctuation: 'heavy' },
    platforms: ['timeline', 'chat'], volatility: 0.9, feelings: {},
  },
  {
    handle: '@twoqueensonesofa', name: 'bea', since: 8, archetype: 'shipper',
    voice: { caps: 0.2, emoji: 0.75, length: 'medium', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.45, feelings: {},
  },
];
