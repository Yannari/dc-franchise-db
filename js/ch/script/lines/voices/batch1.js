// ══════════════════════════════════════════════════════════════════════
// voices/batch1.js — the vote, in every voice
// ══════════════════════════════════════════════════════════════════════
//
// A ceremony is twenty people saying a name, so the ballot is the most-aired
// line on the show. Every tag Total Drama's voice system reads (22, plus the
// families and the ages) gets its own way to say it, most of them more than
// one, kept apart by what the ballot MEANS: a neutral vote, a vote against a
// friend, against an enemy, with the plan, a promise kept, a vote alone, a
// false yes's confessional, a break from the plan, a change of mind. A loud
// voice voting for a friend does not sound like a loud voice voting for an enemy.
//
// Rules from the overlay (project memory, TD voice overlay): personality beats
// age (an age variant never speaks for a hard voice; write.js), no invented
// past (nothing here says "you know why" or "after what you did"), flowing
// speech, every line names {b}.

const NEUTRAL = {
  quiet: ['Just {b}.', '{b}. That\'s all.', '{b}. Sorry.', 'Mm. {b}.'],
  dry: ['{b}. You knew it was coming.', '{b}. Nobody\'s surprised.', '{b}. I know, I\'m as surprised as you are.', '{b}. I\'m not going to explain it.'],
  loud: ['{b}! Let\'s go!', '{b}! That\'s my vote, TJ!', '{b}! Loud and clear!', 'It\'s {b}! Loud enough for you?', '{b}! That\'s my vote!'],
  warm: ['{b}. I\'m sorry, I really am.', '{b}. Please don\'t hate me.', '{b}. I\'ll give you a hug after, I promise.', 'I\'m so sorry, {b}. It\'s you.'],
  blunt: ['{b}. Not complicated.', '{b}, and I\'m not going to pretend it\'s hard.', '{b}. That\'s my vote.', '{b}. Easy one.'],
  theatrical: ['With a very heavy heart... {b}.', '{b}. That\'s all I\'m saying.', 'And my vote goes to... {b}!', '{b}. I thought about it, and it\'s still {b}.'],
  anxious: ['Oh gosh, okay. {b}. Sorry. {b}.', '{b}? Yeah. Yes. {b}.', 'I think... {b}. Yes. {b}.', '{b}. Please don\'t be mad.'],
  calm: ['{b}. It just makes sense.', '{b}. Nothing more to it than that.', '{b}. It\'s the right move.', 'I\'ll say {b}, quietly.'],
  competitive: ['{b}. Go prove you deserve to stay.', '{b}. Win your way back if you want it.', '{b}. Let\'s see what you\'re made of.'],
  schemer: ['{b}. It\'s best for everybody, really.', '{b}. It\'s just good strategy.', '{b}. I\'m sure you understand.', '{b}. Purely business.'],
  cruel: ['{b}. Honestly, it\'s overdue.', '{b}. You\'ve got the best shot in there of anybody.'],
  chaotic: ['{b}! Let\'s make it interesting!', '{b}, because why not?'],
  food: ['{b}. I don\'t have a better name than that.', '{b}. That\'s it from me.'],
  ditzy: ['Wait, is it my turn? Oh! {b}.', '{b}. I\'m new to this, but I know what I\'m doing.'],
  nerdy: ['{b}. I did the math on this one.', '{b}. Purely on the numbers.'],
  earnest: ['{b}. I\'m sorry, and I mean that.', '{b}. I\'ll tell you why to your face later.'],
  flirty: ['{b}. Sorry. You\'d do the same to me.', '{b}. Don\'t be mad, it doesn\'t suit you.'],
  tough: ['{b}. Deal with it.', '{b}. Go handle it.'],
  bossy: ['{b}. Everybody should be saying the same thing.', '{b}. That\'s the right call, people.'],
  emotional: ['{b}... sorry, give me a second. {b}.', '{b}. This is harder than I thought it would be.'],
  goofy: ['{b}! Final answer!', '{b}. Lock it in, TJ.'],
  proud: ['{b}. Obviously.', '{b}. I\'m not losing any sleep over it.'],
  teen: ['{b}, I guess.', 'Um, {b}? Yeah. {b}.'],
  adult: ['I\'m going with {b}.', '{b}. Simple as that.'],
  grown: ['{b}. I\'ve been around long enough to know when it\'s time.', 'I\'ll say {b}, and I\'ll sleep fine.'],
  sharp: ['{b}. There\'s some history there.'],
  soft: ['{b}. I\'m sorry.'],
  odd: ['{b}. Yeah. {b}.'],
};

const FRIEND = {
  quiet: ['...{b}. I\'m sorry.'],
  dry: ['{b}. I know what I just did, and I meant it.'],
  loud: ['{b}! And I hate saying it!'],
  warm: ['{b}. I love you, I\'m sorry, I\'ll explain everything later.', '{b}. Please come back, okay? Please.'],
  blunt: ['{b}. It\'s not about us being friends.'],
  theatrical: ['This is killing me. Actually killing me. {b}.'],
  anxious: ['Oh, I feel sick. {b}. I\'m so sorry.'],
  calm: ['{b}. We\'ll talk after.'],
  competitive: ['{b}. You\'ll win your way back, I know you will.'],
  schemer: ['{b}. Trust me, this helps you in the long run.'],
  cruel: ['{b}. Friends don\'t last forever in here.'],
  chaotic: ['{b}! I know! I\'m sorry!'],
  food: ['{b}. I\'ll talk to you after, I promise.'],
  ditzy: ['{b}? Wait, we\'re still friends, right? We\'re still friends.'],
  nerdy: ['{b}. I ran it every way I could and it kept coming out you.'],
  earnest: ['{b}. I\'m not going to lie to you about it.'],
  flirty: ['{b}. Don\'t look at me like that, it isn\'t fair.'],
  tough: ['{b}. Nothing personal. Go get it done in there.'],
  bossy: ['{b}. It\'s the right call, even if I hate it.'],
  emotional: ['{b}... I can\'t even look at you right now.'],
  goofy: ['{b}. Please don\'t hold it against me.'],
  proud: ['{b}. I don\'t make choices I regret.'],
  teen: ['{b}. Sorry. Like, really sorry.'],
  adult: ['{b}. I\'m sorry, I\'ll explain later.'],
  grown: ['{b}. I hope you know it isn\'t about you.'],
  soft: ['{b}... I\'m so sorry.'],
  sharp: ['{b}. Don\'t take it personally.'],
};

const ENEMY = {
  quiet: ['{b}.'],
  dry: ['{b}. Imagine my surprise.', '{b}. That one wasn\'t hard.'],
  loud: ['{b}! Bye!', '{b}! And I\'d say it twice if they let me!'],
  warm: ['{b}. Sorry.'],
  blunt: ['{b}. We don\'t get along. That\'s no secret.'],
  theatrical: ['Oh, this one I\'ve been waiting for. {b}.'],
  anxious: ['{b}. Please don\'t come back angry.'],
  calm: ['{b}. It\'s a little personal.'],
  competitive: ['{b}. Let\'s see what you\'ve got in there.'],
  schemer: ['{b}. Happily.'],
  cruel: ['{b}. Happily.', '{b}. I think you can win in there, and I\'d rather it was you than me.'],
  chaotic: ['{b}. I\'ve said it to your face before.'],
  food: ['{b}. You\'ve been floating all season.'],
  ditzy: ['{b}! I\'m not sorry!'],
  nerdy: ['{b}. Nobody in this room is surprised.'],
  earnest: ['{b}. I\'d rather be honest about it than pretend.'],
  flirty: ['{b}. You\'re strong enough to come back.'],
  tough: ['{b}. Come at me after if you want.'],
  bossy: ['{b}, and I think everybody should be doing the same.'],
  emotional: ['{b}. And I\'m not even going to cry about it.'],
  goofy: ['{b}! I\'d vote twice if TJ let me.'],
  proud: ['{b}. Obviously.'],
  sharp: ['{b}. Happily.'],
};

const PLAN = {
  quiet: ['{b}. Same as everybody.'],
  dry: ['{b}. Like we talked about.', '{b}. Like we agreed.'],
  loud: ['{b}! Team stays together!'],
  warm: ['{b}. I\'m with my people.'],
  blunt: ['{b}. We decided, so that\'s it.'],
  theatrical: ['{b}. The group has spoken!'],
  anxious: ['{b}. That\'s what we said, right? Yeah. {b}.'],
  calm: ['{b}. We\'re all on the same page.'],
  competitive: ['{b}. We play as a team, we win as a team.'],
  schemer: ['{b}. Exactly as planned.'],
  cruel: ['{b}. It\'s not personal. It\'s the group\'s vote.'],
  chaotic: ['{b}! For the squad!'],
  food: ['{b}. That\'s it from me.'],
  ditzy: ['{b}. That\'s what we said.'],
  nerdy: ['{b}. We ran the numbers as a group.'],
  earnest: ['{b}. I made a commitment to my group.'],
  flirty: ['{b}. Sorry, I\'m voting with my group.'],
  tough: ['{b}. I back my people.'],
  bossy: ['{b}. Like we planned. Everybody.'],
  emotional: ['{b}. I don\'t love it, but I\'m sticking with them.'],
  goofy: ['{b}. That\'s the group\'s vote.'],
  proud: ['{b}. We don\'t lose votes.'],
  teen: ['{b}. That\'s the plan.'],
  adult: ['{b}. I\'m sticking with the people I came in with.'],
  grown: ['{b}. I keep my word to the people I work with.'],
};

const WORD = {
  quiet: ['{b}. I said I would.'],
  dry: ['{b}. I made a promise, and I\'m keeping it.'],
  loud: ['{b}! I promised and I deliver!'],
  warm: ['{b}. I promised someone, and I keep my promises.'],
  blunt: ['{b}. I gave my word.'],
  calm: ['{b}. A promise is a promise.'],
  schemer: ['{b}. A deal is a deal, for now.'],
  earnest: ['{b}. I told somebody I would, and I meant it.'],
  tough: ['{b}. My word means something.'],
  bossy: ['{b}. Deals get honored.'],
  proud: ['{b}. I don\'t break deals.'],
  sharp: ['{b}. I keep my deals.'],
  soft: ['{b}. I promised.'],
};

const OWN = {
  quiet: ['{b}. My call.'],
  dry: ['{b}. Nobody asked me, so I\'ll just say it.'],
  loud: ['{b}! Nobody tells me what to do!'],
  warm: ['{b}. That\'s my own decision, nobody pushed me.'],
  blunt: ['{b}. Nobody told me to. I just think it\'s right.'],
  theatrical: ['A free agent speaks! {b}!'],
  anxious: ['{b}. I hope that was the right call.'],
  calm: ['{b}. I thought about it on my own.'],
  competitive: ['{b}, because I\'d rather face anybody else.'],
  schemer: ['{b}. I decided this on my own.'],
  cruel: ['{b}. Nobody had to talk me into that one.'],
  chaotic: ['{b}! Nobody saw that coming, including me!'],
  nerdy: ['{b}. My own read, my own reasons.'],
  earnest: ['{b}. I\'m voting with my gut.'],
  tough: ['{b}. I make my own calls.'],
  bossy: ['{b}. I don\'t need a group to tell me who to vote for.'],
  proud: ['{b}. I don\'t follow anybody in here.'],
  goofy: ['{b}. I went back and forth, and I landed on you.'],
  sharp: ['{b}. Entirely my own idea.'],
  soft: ['{b}. That\'s just how I feel.'],
};

// A false yes: the spoken name is short; the confessional after it is the voice.
const FALSE_CONF = {
  quiet: ['I said yes to them. I never said I meant it.'],
  dry: ['I agreed with them this morning. Then I changed my mind.'],
  loud: ['Did I tell them I was voting their way? Yeah! Did I? No!'],
  warm: ['I feel bad lying to them, but I\'d feel worse going home.'],
  blunt: ['I lied to them. That\'s the game.'],
  theatrical: ['And the award for best supporting liar goes to... me.'],
  anxious: ['They\'re going to know it was me. Oh no. They\'re definitely going to know.'],
  calm: ['They\'ll be upset for a day. I\'ll still be here.'],
  competitive: ['I\'m not here to keep anybody else\'s promises. I\'m here to win.'],
  schemer: ['Saying yes was easy. The vote is what I really think.', 'They heard what they wanted to hear. That was the point.'],
  cruel: ['Watching them count the votes was the best part of my week.'],
  chaotic: ['I said yes! Then I said something else! Keep up!'],
  nerdy: ['Saying yes kept me out of the conversation. The vote kept me out of the Arena.'],
  earnest: ['I hate that I lied. I\'d do it again, though.'],
  flirty: ['I smiled, I nodded, and I did what I wanted.'],
  tough: ['They wanted a yes, so I gave them one. They never asked if I meant it.'],
  bossy: ['If they wanted my vote, they should\'ve made a plan I agreed with.'],
  emotional: ['I almost cried when I said yes to them. I was that nervous.'],
  goofy: ['Plot twist. The plot twist was me.'],
  proud: ['They really thought they had me.'],
  sharp: ['Saying yes cost me nothing, and they believed it.'],
  soft: ['I didn\'t want to lie. I just wanted to stay.'],
};

const BROKE = {
  quiet: ['{b}. I\'m sorry. I couldn\'t do it.'],
  dry: ['{b}. I know that\'s not the name. I don\'t care.'],
  loud: ['{b}! I know, I know! I had to!'],
  warm: ['{b}. I\'m sorry, guys. I just couldn\'t.'],
  blunt: ['{b}. I didn\'t agree with the plan, so I didn\'t follow it.'],
  theatrical: ['Forgive me, my people. {b}.'],
  anxious: ['{b}. Please don\'t be mad. You\'re going to be mad.'],
  calm: ['{b}. I made a different call this week.'],
  schemer: ['{b}. Sometimes the plan is wrong.'],
  earnest: ['{b}. I owe some people an explanation, and they\'ll get one.'],
  tough: ['{b}. I don\'t take orders.'],
  bossy: ['{b}. The plan was bad, and someone had to say so.'],
  emotional: ['{b}. I\'m sorry. I couldn\'t live with the other name.'],
  proud: ['{b}. I don\'t need permission.'],
  sharp: ['{b}. The plan didn\'t suit me.'],
  soft: ['{b}. I\'m so sorry, everyone.'],
};

const CHANGED = {
  quiet: ['{b}. I changed my mind.'],
  dry: ['{b}. Yes, it was a different name an hour ago.'],
  loud: ['{b}! Changed my mind! Deal with it!'],
  warm: ['{b}. I know I said something else. I\'m sorry.'],
  blunt: ['{b}. I changed my mind, and that\'s allowed.'],
  anxious: ['I... {b}. I\'m going {b}. I think. Yes.'],
  calm: ['{b}. I changed my mind when I heard everybody else.'],
  schemer: ['{b}. Plans change.'],
  chaotic: ['{b}! Didn\'t see that coming, did you? Neither did I!'],
  earnest: ['{b}. I\'ll be honest, I changed my mind at the last second.'],
  emotional: ['{b}. I\'m sorry, I panicked.'],
  goofy: ['{b}. I changed my mind at the last second.'],
  sharp: ['{b}. You know why.'],
  soft: ['{b}. Sorry. I changed my mind.'],
};

const at = (map, i = 0) => ({ [i]: map });
const out = {};
// ballot.any — neutral entries, the TJ-led ones speak on turn 1
for (const id of ['bl.1', 'bl.2', 'bl.3', 'bl.4', 'bl.5', 'bl.6', 'bl.7', 'bl.8', 'bl.9', 'bl.13', 'bl.14', 'bl.15', 'bl.17', 'bl.18']) out[id] = at(NEUTRAL);
for (const id of ['bl.10', 'bl.11', 'bl.12', 'bl.16']) out[id] = at(NEUTRAL, 1);
for (const id of ['bl.19', 'bl.20']) out[id] = at(FRIEND);
for (const id of ['bl.21', 'bl.22', 'bl.23']) out[id] = at(ENEMY);
for (const id of ['bp.1', 'bp.2', 'bp.3', 'bp.4', 'bp.5']) out[id] = at(PLAN);
out['bp.6'] = at(FRIEND);
for (const id of ['bw.1', 'bw.2', 'bw.3']) out[id] = at(WORD);
for (const id of ['bo.1', 'bo.2', 'bo.3', 'bo.4', 'bo.5']) out[id] = at(OWN);
out['bf.1'] = at(FALSE_CONF, 2); out['bf.2'] = at(FALSE_CONF, 2); out['bf.3'] = at(FALSE_CONF, 2);
for (const id of ['bb.1', 'bb.2', 'bb.3']) out[id] = at(BROKE);
for (const id of ['bc.1', 'bc.2', 'bc.3']) out[id] = at(CHANGED);
export default out;
