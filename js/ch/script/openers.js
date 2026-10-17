// ══════════════════════════════════════════════════════════════════════
// ch/script/openers.js — every conversation starts somewhere
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "there's no setup in a lot of these conversations, so we're mostly stumbling into the
// middle of them with no context". Two seasons measured: a recruit opened on its first spoken line 39 times in
// 39, a meeting 25 in 52, a leverage threat 17 in 17. A scene whose first line is somebody already talking
// gets one line before it: who, where, and why they are talking (write.js). Never the same one twice in a day;
// a kind out of fresh openers that day starts as it is.
//
// {a} {b} {c} are the scene's parts, {target} and {alliance} its slots; a line naming a slot the scene does
// not have is skipped.
export const OPENERS = {
  // a moment of somebody alone (all confessional): the moment that set it off, so it never reads as the tail of the
  // scene before (the user, 2026-10-16: "mike has a random last confessional why"). By the scene's ending first.
  'psyche.belong': ['{a} watches the rest of the alliance laughing at the other end of the pool, and stays on the far side.', 'The alliance heads to the gym without asking {a} along.'],
  'psyche.prove': ['{a} is the last one still training in the gym, long after everybody else has gone to bed.', '{a} scrolls back through the daily results on the board and does not like the look of it.'],
  'psyche.control': ['{a} walks past a closed bedroom door with voices behind it, and stops.', '{a} counts the votes on {a.posAdj} fingers for the third time today.'],
  'psyche.protect': ['{a} watches {a.posAdj} friends from across the deck, counting who is safe and who is not.', "Everybody in {a}'s group is asleep. {a} is not."],
  'psyche.temper': ['{a} walks out of the kitchen before the argument can start, and keeps walking.', '{a} sits on the steps with {a.posAdj} fists still clenched.'],
  'psyche.redemption': ['{a} looks out at the Arena from the top of the path and stands there for a long time.', '{a} is up before everybody, running laps on the beach.'],
  'psyche.home': ['{a} sits alone by the pool, turning a friendship bracelet from home around and around.', 'It is late, and {a} is looking at the one photo from home {a} was allowed to bring.'],
  'injury-healed': ['{a} tests {a.posAdj} {part} on the stairs, then takes them two at a time.', 'For the first time in days, {a} runs on the beach without limping.'],
  'arena-eve-alone': ['It is late. {a} sits alone on the steps, the night before the Arena.', 'Everybody else has gone to bed. {a} is still sitting by the pool, alone.'],
  recruit: ['{a} needs one more vote, and goes looking for {b}.', '{a} catches {b} alone by the pool and asks for a minute.', '{a} sits down next to {b} on the deck. This one is about the vote.', '{a} has been counting votes all afternoon and is one short. {a} finds {b}.'],
  meeting: ['{a} gets the group together in the bedroom and shuts the door. The vote is tonight.', 'One by one, {a}\'s people drift out to the far end of the beach to settle the vote.', '{a} calls everybody in {alliance} to the gym, where nobody can listen in.', 'The alliance meets in the kitchen while the rest of the house is at the pool.'],
  spark: ['{a} and {b} end up sitting together again, and neither of them moves away.', '{a} has been finding reasons to be wherever {b} is all day.', 'Late in the afternoon, {a} and {b} are the only two left by the pool.', '{a} sits down next to {b} at dinner, a little closer than they need to.'],
  flirt: ['{a} has been looking over at {b} all afternoon, and finally goes over.', '{a} wanders over to where {b} is sitting, pretending it\'s an accident.', '{a} finds {b} at the bar and leans on the counter right next to them.', '{a} catches {b}\'s eye across the room and heads over.'],
  // the day of the Arena (season.js pickDay runs on day 3, before the duel): "today", never "tomorrow"
  'pick-guess': ['Everybody who could be picked today ends up in the kitchen, trying not to look worried.', 'The ones who could be called out this afternoon sit by the pool, guessing.', 'Nobody who might be picked today can sit still. They end up talking about it.'],
  'pick-talk': ['{a} is going into the Arena this afternoon. {b} sits down to help {a} decide who to pick.', 'A few hours before the Arena, {a} and {b} talk it through on the steps outside.', '{b} finds {a} alone in the gym, staring at nothing. In a few hours {a} has to pick an opponent.'],
  'leverage-threat': ['{a} has heard {a}\'s name is in the mix for tonight, and goes straight to {b}.', '{a} isn\'t going to wait for the vote. {a} finds {b} first.', 'Word reaches {a} that the house is looking at {a}. {a} goes looking for {b}.'],
  fight: ['The drinks have been flowing for hours when {a} and {b} end up face to face at the bar.', 'It has been building between {a} and {b} all night, and it finally boils over.', 'Somebody bumps somebody at the bar. It is {a} and {b}, and neither of them backs down.'],
  'fight-physical': ['The night has gone on too long. {a} and {b} are standing far too close.', 'Everybody at the bar can feel it coming between {a} and {b}.'],
  'trash-talk': ['{a} and {b} have been needling each other all week. It starts again.', '{a} walks past {b} and can\'t resist.', 'In the middle of the common room, {a} and {b} pick up right where they left off.'],
  'alliance-grow': ['{a} has a proposal for {b}, and it\'s about {alliance}.', '{a} pulls {b} out to the deck, away from everybody.', '{a} has been watching {b} all week, and thinks {b} is ready to join.'],
  'alliance-form': ['{a} quietly gathers a few trusted people in the bedroom.', 'After the daily, {a} pulls a few people aside, one at a time, and then all together.', '{a} has an idea for a group, and starts with the people {a} trusts most.'],
  deal: ['{a} wants a guarantee, and asks {b} to talk somewhere quiet.', '{a} and {b} sit at the end of the dock, where nobody can hear them.', '{a} and {b} end up alone in the gym.'],
  receipts: ['{b} said {a}\'s name at the last vote, and {a} hasn\'t let it go.', '{a} has been waiting all day to get {b} alone.', '{a} walks into the kitchen, sees {b}, and stops.'],
  'counter-pitch': ['{a} knows the house is lining up against {a}, and has another name ready.', '{a} has one chance to move the vote, and the name is {b}.', 'Before the vote, {a} gets the room to listen. {a} has a different name for tonight.'],
  'arena-eve-confront': ['The night before the Arena, {a} walks right up to {b}.', '{a} has something to say to {b} before tomorrow, and says it in front of everybody.'],
  'arena-eve-pep': ['The night before the Arena, {a} goes to find {b}.', '{a} knocks on {b}\'s door late. Tomorrow {b} goes into the Arena.'],
  'alliance-leave': ['{a} has had enough of the group, and tells {b} first.', '{a} pulls {b} aside. Something has to change.'],
  // each way out of a group its own way in: a member pushed or cut loose did not decide to go (the opener
  // said "has had enough of the group" over somebody being thrown out)
  'alliance-leave.pushed-out': ['{b} has news for {a}, and the rest of the group already knows it.', 'The group has talked without {a}. {b} is the one sent to say it.'],
  'alliance-leave.cut-loose': ['{b} has stopped trusting {a}, and has decided to say so.', '{b} finds {a} alone. It is not a friendly visit.'],
  'alliance-leave.exposed': ['Everybody heard {a}\'s vote. {b} wants an explanation.', 'The vote is over, and {b} goes straight to {a}.'],
  'alliance-leave.walked-friend': ['{a} has heard who the group is coming for, and it is somebody {a} will not give up.', '{a} has made a choice between the group and a friend.'],
  'alliance-leave.defected': ['Word has got around about {a}, and {b} is the last to hear it.', '{b} has been told something about {a} that {b} does not want to believe.'],
  'alliance-switch': ['{b} knocks on the door of a group {b} was never in.', '{b} has walked out of one alliance and is looking for another.'],
  'alliance-merge': ['Two groups that have spent weeks voting against each other are about to stop.', '{a} and {b} lead rival groups, and they have asked to meet alone.'],
  'alliance-end.drifted': ['{alliance} has not met in days, and {a} and {b} both know why.', 'Nobody has called a meeting of {alliance} all week.'],
  // an alliance that ends because the final starts ends at the start line, not in the villa kitchen
  'alliance-end.final': ['On the start line of the final, {a} and {b} find each other one last time.', 'Before the final starts, {a} and {b} stand together for the last time as allies.'],
  'alliance-end': ['What\'s left of {alliance} sits in the bedroom, and nobody wants to say it first.', '{a} and {b} end up alone in the kitchen. The group is falling apart.'],
  'deal-broken': ['{b} heard what {a} did at the vote, and goes to find {a}.', '{a} can feel {b} staring across the common room. {b} walks over.'],
  'spare-deal': ['{a} catches {b} alone with a quiet offer: spare me, and I\'ll spare you.', '{a} has a deal in mind for {b}, and it only works if nobody else hears it.'],
  'partner-blame': ['{a} is still fuming about how the daily went, and {b} is right there.', 'Back at the villa after the daily, {a} hasn\'t calmed down.'],
  'team-blame': ['The losing team gets back to the villa, and {a} is already looking for someone to blame.'],
  'vet-dismisses': ['{a} has been on this show more times than anybody, and lets {b} know it.', '{a}, a veteran, watches {b}, a rookie, and can\'t help commenting.'],
  'vet-mentors-rookie': ['{a} has been here before. {b} hasn\'t. {a} sits down to help.', '{a} sees {b} struggling and pulls up a chair.'],
  'rookie-hazing': ['The veterans have decided the rookies need to earn their place. {a} starts with {b}.', '{a} has a job for {b}, and it\'s not a nice one.'],
  'after-vote': ['After the vote, {b} goes looking for {a}.', '{a} slips out of the common room after the vote. {b} follows.'],
  'scheme-lie': ['{a} has a story for {b}, and most of it isn\'t true.', '{a} waits until {b} is alone, then leans in.'],
  homesick: ['{a} has been quiet all day. {b} notices.', '{b} finds {a} sitting alone on the steps, staring out at the water.'],
  'injury-target': ['{a} and {b} watch {target} limp across the villa.', 'In the gym, out of earshot, {a} has a thought about {target}.'],
  'injury-care': ['{b} can barely walk. {a} goes to find some ice.', '{a} sees {b} wince on the stairs and stops to help.'],
  injury: ['The medics come running.', '{a} hits the ground and doesn\'t get up straight away.'],
  'kitchen-blowup': ['It starts in the kitchen, over nothing.', 'The kitchen is too small for this many people, and today it shows.', 'Nobody will remember later how it started. It started in the kitchen.'],
  'kitchen-disaster': ['{a} has decided to cook for everybody. This could go either way.'],
  'bank-brag': ['The bank totals are on the board, and {a} can\'t stop looking at them.', '{a} sits down next to {b} with a smile that means money.'],
  'money-talk': ['{a} and {b} have been looking at the bank totals, and neither of them likes what they see.', 'Out by the pool, {a} and {b} do the math on {target}\'s bank.'],
  'floater-callout': ['{a} has been watching who does what in this house, and {b} hasn\'t done much.', 'In front of everybody, {a} turns to {b}.'],
  'show-banter': ['{a} and {b} come from different shows, and they can\'t agree on which one was harder.'],
  'ride-to-the-final': ['{a} and {b} are the last two awake, sitting on the roof.', '{a} has been thinking about the end of the game, and about who to take there.'],
  jealousy: ['{a} watches {c} laughing with {b}, and doesn\'t like it.', '{a} has been quiet all evening, and {c} finally asks why.'],
  'hot-tub-truths': ['Late at night, the hot tub fills up, and the truth comes out.', '{a} and {b} are the last two in the hot tub.'],
  'bunk-whisper': ['Lights out. {a} rolls over and whispers to {b}.', 'The bedroom is dark, and {a} can\'t sleep.'],
  outing: ['In front of the whole house, {a} decides to say it out loud.'],
  'pool-games': ['The pool is full, and somebody suggests chicken fights.'],
  'house-dinner': ['Everybody sits down for dinner at the long table.'],
  'party-deal': ['{a} and {b} find a quiet corner of the club.'],
  'beach-date': ['{a} and {b} slip away from the villa to walk on the beach.'],
  showmance: ['{a} and {b} have stopped pretending.', 'Everybody in the villa has noticed {a} and {b}.'],
  pda: ['{b} and {c} are on the sofa, wrapped around each other, and {a} is sitting right next to them.'],
  'throw-caught': ['{a} saw something at the daily, and can\'t let it go.'],
  'loyalty-test': ['{a} wants to know whose side {b} is on, and has a way to find out.'],
  plea: ['{a} doesn\'t want to go into the Arena, and has one person left to ask.', '{a} catches {b} on the stairs. {a} needs {b}\'s vote.'],
  'ranking-beef': ['{a} hasn\'t stopped thinking about TJ\'s list all morning.'],
  'expelled-goodbye': ['TJ has gone. {a}\'s bag is packed.', '{a} has an hour to say goodbye.'],
  'expelled-blame': ['The house is still in shock. {a} walks up to {b}.'],
  'morning-after': ['The morning after the Arena, the villa is quiet.'],
  'gym-training': ['{a} and {b} are the only two in the gym.'],
  'gym-flex': ['{a} is in the gym, and wants everybody to know it.'],
  'beach-run': ['{a} and {b} go for a run along the beach before breakfast.'],
  psyche: ['{a} has been somewhere else all day.'],
  'arc-payback': ['{a} has been waiting a long time for this.'],
  'arc-beast': ['Everybody is talking about {target} again.'],
  volunteer: ['Before anybody else can speak, {a} stands up.'],
  arrival: ['On the airstrip, {a} spots {b} and stops dead.'],
  'gossip-backfire': ["{a} has been talking about {b} behind {b}'s back, and {c} has been listening.", "In the kitchen, {a} leans in close to {c}. It's about {b}."],
  'party-slip': ['At the bar, a few drinks in, {a} leans on {b}.', 'Out on the deck, away from the music, {a} sits down next to {b}.'],
  'party-callout': ['The music is loud, and {a} is louder.', '{a} has had a few drinks and a few things to say to {b}.'],
  'party-tears': ['Away from the dance floor, {a} has gone quiet.', '{a} slips out of the club for some air.'],
  'alliance-betrayal': ['The group gathers after the vote. Nobody is looking at {b}.', '{a} has been waiting for the vote to be over to get {b} alone.'],
  'empty-threat': ["{a} said a name at the vote. Tonight, it's somebody else's."],
  'bunk-war': ["There's one good bunk left, and {a} and {b} both want it."],
  'sunset-talk': ['{a} and {b} sit on the sand and watch the sun go down.'],
  'arc-giant-falls': ['The morning after the Arena, the house wakes up to a strange quiet.'],
  'house-debate': ['Before the vote, the house ends up in the common room. Somebody has to start it.', 'Dinner is over, but nobody gets up from the table. The vote is tomorrow.', 'Out on the deck, the vote comes up again, and this time nobody changes the subject.'],
  'partner-draw': ['TJ has a hat full of names, and today everybody gets a partner.'],
};

// Scenes staged by the viewer with their own opening (a daily, the vote, the Arena, the final's moments), or
// led by TJ, never get one.
export const NO_OPENER = new Set(['previously', 'daily', 'callout', 'arena', 'ceremony', 'run-name', 'run-snacks', 'quit', 'medical', 'disqualified',
  'tj-house-meeting', 'power-rankings', 'final-start', 'final-cp', 'instant-elimination', 'champions', 'final-podium', 'villa-reveal', 'purge', 'return-arena', 'arena-goodbye', 'champion-reflect', 'late-arrival']);
