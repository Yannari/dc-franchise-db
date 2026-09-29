// ══════════════════════════════════════════════════════════════════════
// tr/castle/testing.js — asking for a commitment, then watching whether it
// holds
// ══════════════════════════════════════════════════════════════════════
//
// DISTINCT FROM trust.js ON PURPOSE. trust.js is about FORMING bonds — a
// confidence shared, a circle closing, an alliance warming. This family is
// about PROBING one that already exists: a deliberate, engineered test with
// a controlled variable, run BY one player ON another, to find out whether
// the other person is who they say they are. trust.js's own flagship
// ("will you vote with me tonight?") is the one place the two families
// already overlap in shape — a real ask with a real answer — and every
// event here is built the same way for the same reason: a probe is only a
// probe if the outcome is a genuine check against the TARGET's stats, never
// a coin the actor's own narration dresses up afterward.
//
// No belief writes. A test that comes back "failed" tells the tester
// something about the target's character, not their alignment — a loyal
// Faithful can fail a loyalty oath out of nerves, and a smooth Traitor can
// pass every single one of these. That gap between what a test measures and
// what the room WANTS it to measure is the whole reason this family reads
// as "frequently wrong" rather than as free evidence.
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcAdvanceCiting, arcContinue } from './effects.js';
import { lineFor, pronounSlots } from './lines.js';
import { findOpenThread, priorMoments } from '../threads.js';

const FAMILY = 'testing';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// Line pools chosen by hash, not by rng — see lines.js for why a `pick()`
// added to an event that did not already have one reroutes the season.
// ── REWRITE (Task 7 stage 6): THE FOUR COIN-FLIP TESTS ────────────────
//
// `testing-small-dare`, `testing-ask-for-alibi-check`, `testing-double-check-
// story` and `testing-silence-test` all shipped the same shape — one `rng() <
// stat` comparison and two branches — and the audit marked all four REWRITE
// for it ("2 branches, short of four materially different paths"). Two of them
// also wrote no thread at all before stage 2's migration.
//
// The shape is wrong in a specific way rather than merely thin: a test has a
// SUBJECT and a RESULT, and a coin flip collapses them. Whether the account
// stands up is one axis; whether the person being tested WORKS OUT THEY ARE
// BEING TESTED is a completely different one, and it is the axis this family's
// own flagship (`testing-decoy-secret`) is built on. Every one of the four now
// forks on both, and every fork reads something stored — the arc's own beat
// count (how many times this pair has been round this), the tested player's
// stats, and in the alibi check the third party's willingness to be drawn.
const DARE_LINES = {
  complied: [
    '{a} asks {b} for something small and pointless, just to see what happens.\n{a}: "Swap seats with me for dinner?"\n{b}: "Sure. Why?"\n{a}: "No reason."\n{a} (to camera): "No questions. Just did it. That tells me something."',
    '{a} tests {b} with a tiny favour.\n{a}: "Can you grab my jumper from upstairs?"\n{b}: "Yeah, course."\n{a} (to camera): "Easy-going. Or eager to please. Either way, noted."',
    '{a} asks {b} for something slightly odd.\n{a}: "Sit next to me tonight at the table."\n{b}: "Alright."\n{a} (to camera): "{b} didn’t even ask why."',
    '{a} floats a small ask, and {b} goes along with it.\n{b}: "Whatever you want."\n{a}: "You didn’t even ask why."\n{b}: "Should I have?"\n{a} (to camera): "That’s a person who trusts me. Or wants me to think so."',
  ],
  refused: [
    '{a} asks {b} for something small, and {b} wants to know why.\n{a}: "Can you sit at the other end tonight?"\n{b}: "Why?"\n{a}: "Just humour me."\n{b}: "Not without a reason."',
    '{b} pushes back on a tiny ask.\n{b}: "What’s this for?"\n{a}: "Nothing."\n{b}: "Then I’ll stay where I am."\n{a} (to camera): "Guarded. Very guarded."',
    '{a} asks a harmless favour, and {b} won’t do it without an explanation.\n{b}: "Why do you need me to do that?"\n{a}: "No reason. It’s tiny."\n{b}: "Then do it yourself."\n{a} (to camera): "Four seconds of effort, and {b} wanted a reason. Interesting."',
    '{b} says no to something that costs nothing.\n{b}: "I don’t do things just because."\n{a}: "It’s a cup of tea, {b}."\n{b}: "It’s the principle."\n{a} (to camera): "Fair. Also suspicious."',
  ],
  'named-the-test': [
    '{b} does the favour, then calls it out.\n{b}: "That was a test, wasn’t it?"\n{a}: "What? No."\n{b}: "It was. It’s fine. Did I pass?"',
    '{a} gets the favour, and a diagnosis.\n{b}: "You’re checking if I’ll do what you say."\n{a}: "Maybe."\n{b}: "I will. Within reason."',
    '{b} does it, then smiles at {a}.\n{b}: "Nice try."\n{a}: "Nice try at what?"\n{b}: "Don’t. I know a test when I see one."\n{a} (to camera): "{b} saw right through me. That’s either a Faithful being clever, or a Traitor being careful."',
    '{b} spots the test straight away.\n{b}: "What are you actually trying to find out?"\n{a}: "Nothing. I just needed a hand."\n{b}: "Course you did."',
  ],
  'over-delivered': [
    '{a} asks {b} a small favour, and {b} does far more than asked.\n{a}: "Just the jumper."\n{b}: "I brought your book too. And a tea."\n{a} (to camera): "Why so keen?"',
    '{b} turns a four-second favour into twenty minutes of being helpful.\n{a}: "Honestly, that’s plenty, thanks."\n{b}: "No, no, let me do the rest as well."\n{a} (to camera): "Either {b} is the nicest person here, or {b} really needs me to like {bObj}."',
    '{b} goes above and beyond for {a}.\n{b}: "Anything else?"\n{a}: "No, honestly, that’s plenty."',
    '{b} does the favour and keeps offering more.\n{b}: "Anything else? Tea? Blanket? Anything?"\n{a}: "I’m fine. Really."\n{a} (to camera): {cam:too-nice}',
  ],
};

const ALIBI_CHECK_LINES = {
  ok: [
    '{a} quietly checks {b}’s story with somebody else. It matches.\n{a} (to camera): "{b} said the kitchen. Someone else saw {bObj} in the kitchen. Clean."',
    '{a} takes {b}’s version of last night to a third person.\n{a} (to camera): "Checks out. Good. One less person to worry about."',
    '{a} asks around about {b}’s evening, casually.\n{a} (to camera): "Everyone puts {b} exactly where {b} said. I believe it now."',
    '{a} does a quiet check on {b}.\n{a} (to camera): "Nothing wrong with {b}’s story. I’m almost disappointed."',
  ],
  bad: [
    '{a} checks {b}’s story with someone else, and gets a different night.\n{a} (to camera): "{b} said the kitchen. Someone else has {b} in the corridor. At the same time."',
    '{a} asks around about {b}, and the stories don’t match.\n{a} (to camera): "That’s two different versions of {b}’s evening. Only one of them can be true."',
    '{a} compares {b}’s account with a witness.\n{a} (to camera): {cam:holding-info}',
    '{a} finds a hole in {b}’s evening.\n{a} (to camera): "An hour of {b}’s night doesn’t exist. I want to know where it went."',
  ],
  'nobody-would-say': [
    '{a} asks three people about {b}’s evening. None of them will say.\n{a} (to camera): "Nobody wants to be the one who puts {b} anywhere. That’s interesting in itself."',
    '{a} tries to check {b}’s story, and nobody will commit.\n{a} (to camera): "Everyone’s very careful all of a sudden."',
    '{a} gets nowhere checking up on {b}.\n{a} (to camera): {cam:unsure-info}',
    'Nobody {a} asks will confirm where {b} was.\n{a} (to camera): "Either nobody saw {b}, or nobody wants to say."',
  ],
  'got-back-to-them': [
    '{a} checks {b}’s story with someone, and that someone tells {b} before lunch.\n{a} (to camera): "Great. Now {b} knows I’ve been asking questions."',
    '{b} finds out {a} has been checking up on {bObj}.\n{a} (to camera): {cam:story-close}',
    '{a}’s quiet check isn’t quiet any more.\n{a} (to camera): "I asked one person. One. And it got straight back to {b}."',
    '{a} learns that {b} knows about the check.\n{a} (to camera): "Nothing stays secret in this castle. Nothing."',
  ],
};
const OATH_LINES = {
  sincere: [
    '{a} asks {b} to commit in front of the others, and {b} does, straight away.\n{a}: "Say it. Here. That you’re with me."\n{b}: "I’m with you. Everyone heard it."',
    '{a} puts the question in public, and {b} answers in public.\n{a}: "Will you stand by me at the table?"\n{b}: "Yes. No question."',
    '{b} gives {a} a promise in front of the room.\n{b}: "I’ve got {a}’s back. If anyone’s got a problem with that, tell me."\n{a}: "You didn’t have to say that in front of everyone."\n{b}: "I wanted them to hear it."',
    '{a} asks, and {b} swears to it without hesitating.\n{a}: "Swear to me you’re not writing my name."\n{b}: "I swear. On my kids."\n{a} (to camera): "No pause. Nothing. I believe {b}."',
  ],
  reluctant: [
    '{b} says what {a} wants to hear, but it takes a while.\n{a}: "Are you with me?"\n{b}: "I… yeah. Yes. I am."\n{a} (to camera): "Too long. That took too long."',
    '{b} gets to the right answer the long way round.\n{b}: "I mean, it depends what happens, but — yes. Fine. Yes."\n{a}: "That was a long way round to yes."\n{b}: "It’s still a yes."\n{a} (to camera): "That’s a maybe dressed as a yes."',
    '{b} commits, with visible effort.\n{b}: "Okay. I promise."\n{a}: "You didn’t sound sure."',
    '{b} agrees, but not happily.\n{a}: "Can I count on you tonight?"\n{b}: "…Yes. Probably. Yes."\n{a} (to camera): {cam:unsure-info}',
  ],
  refuses: [
    '{b} refuses, in front of everyone.\n{a}: "Just say you’re with me."\n{b}: "I’m not promising anyone anything. Not in here."\n{a}: "Wow."',
    '{b} won’t make the commitment.\n{b}: "I’ll decide at the table, like everyone else."\n{a}: "Just like everyone else. Right."\n{b}: "Don’t take it personally."\n{a} (to camera): "Publicly refused. That hurt."',
    '{b} says no, loudly enough for the room.\n{b}: "I don’t make promises I might break."\n{a}: "I didn’t ask you to shout it."\n{b}: "Then don’t ask me in front of people."',
    '{b} turns down the oath.\n{a}: "Just tell me you’re with me."\n{b}: "I can’t tell you that. Not yet."\n{a} (to camera): {cam:frozen-out}',
  ],
  'asked-for-one-back': [
    '{b} swears it, then asks {a} to swear the same.\n{b}: "I’m with you. Now say it back."\n{a}: "...I’m with you."\n{b}: "Good."',
    '{b} gives an oath and asks for one in return.\n{b}: "Fair’s fair. Your turn."\n{a}: "Fine. I promise too."\n{b}: "Say it properly."\n{a} (to camera): "I wasn’t expecting to have to promise anything."',
    '{b} makes it mutual.\n{b}: "I’ll promise if you do."\n{a}: "Fine. Deal."',
    '{b} demands the same promise back.\n{b}: "It goes both ways, or it doesn’t go at all."\n{a}: "Alright. Both ways."\n{b}: "Good. Shake on it."',
  ],
};

const REVERSE_PSYCH_LINES = {
  calm: [
    '{a} pretends to distrust {b}, just to see the reaction. {b} laughs it off.\n{a}: "You know, I’ve started to wonder about you."\n{b}: "Wonder away. I’ll be here."',
    '{a} accuses {b} of something {a} doesn’t believe. {b} just agrees, cheerfully.\n{a}: "You’re a Traitor, aren’t you?"\n{b}: "Obviously. Pass the salt."',
    '{a} tries to rattle {b}, and gets nothing.\n{a}: "I’ve been watching you, you know."\n{b}: "Watch away. I’m very boring."\n{a} (to camera): "Calm as anything. Either innocent or ice cold."',
    '{b} shrugs off {a}’s fake suspicion.\n{b}: "If you really thought that, you wouldn’t say it to my face."\n{a}: "Maybe I would."\n{b}: "Then say it at the table."',
  ],
  rattled: [
    '{a} pretends to distrust {b}, and {b} gets visibly rattled.\n{a}: "I’m not sure about you any more."\n{b}: "What? Why? What have I done?"\n{a}: "Nothing. Just a feeling."\n{a} (to camera): "I didn’t even mean it. Look how {b} reacted."',
    '{a} says something {a} doesn’t mean, and {b} spends ten minutes answering it.\n{b}: "I swear, I’ve done nothing, ask anyone—"\n{a}: "I was joking."\n{b}: "That wasn’t funny."\n{a} (to camera): "That was a lot of defence for a fake accusation."',
    '{b} panics at a fake suspicion.\n{b}: {say:deny}\n{a}: "Relax. I was joking."\n{b}: "Well, don’t."\n{a} (to camera): "Why so rattled? I was bluffing."',
    '{a} tests {b}, and {b} goes red.\n{a}: "I think it might be you, you know."\n{b}: "Me? Why me? What have I done?"\n{a} (to camera): {cam:holding-info}',
  ],
  'saw-through-it': [
    '{b} sees straight through {a}.\n{b}: "You don’t believe that. So what are you actually asking me?"\n{a}: "Nothing."\n{b}: "Yeah, right."',
    '{b} calls out the trick while {a} is still doing it.\n{b}: "You’re testing me."\n{a}: "I’m having a conversation."\n{b}: "You’re having a test. I can smell it."\n{a} (to camera): "Busted."',
    '{b} spots the game.\n{b}: "Nice try. I’m not falling for that."\n{a}: "Falling for what?"\n{b}: "Exactly."',
    '{b} names it before {a} finishes.\n{b}: "This is the bit where you pretend to suspect me to see if I panic. I’m not panicking."\n{a}: "I wasn’t going to do that."\n{b}: "You were halfway through."',
  ],
  'turned-it-round': [
    '{b} takes the bait, runs with it, and ends up questioning {a}.\n{b}: "Funny you should say that, because I’ve been wondering about you."\n{a}: "Me?"\n{b}: "You."',
    '{b} agrees with {a}’s fake suspicion, and turns it round.\n{b}: "You’re right to be suspicious. So what are you going to do about it?"\n{a}: "I was going to watch you, mostly."\n{b}: "Then I’ll give you something to watch."\n{a} (to camera): "I didn’t have a plan for that."',
    '{b} flips it on {a}.\n{b}: "Why are you asking? Guilty people ask."\n{a}: "Is that what you think?"\n{b}: "It’s what the room will think."',
    'By the end, {a} is the one explaining {aRef}.\n{a} (to camera): {cam:story-close}',
  ],
};

const HYPOTHETICAL_LINES = {
  reassured: [
    '{a} asks {b} what {bSub} would do if {a} got banished next.\n{a}: "If it’s me tomorrow, what do you do?"\n{b}: "I go after whoever did it. Simple."\n{a} (to camera): "That felt real."',
    '{a} asks the question, and {b} gives a proper answer.\n{a}: "If they come for me, will you fight for me?"\n{b}: "I’ll stand up at the table and say your name’s not going on my slate."',
    '{a} tests {b} with a hypothetical.\n{a}: "What if it’s me next?"\n{b}: "Then they’ll have to get past me first."',
    '{b} answers the hypothetical sincerely.\n{b}: "I’d defend you. I would."\n{a}: "Even if the whole table turned?"\n{b}: "Especially then."',
  ],
  hedged: [
    '{a} asks what {b} would do if {a} were next, and {b} hedges.\n{a}: "If it’s me tomorrow?"\n{b}: "Well, it depends what people say, doesn’t it?"\n{a} (to camera): "It depends. Great."',
    '{a} asks a direct question and gets a paragraph.\n{b}: "I mean, you know how I feel, but the room’s the room…"\n{a}: "Yes or no, {b}."\n{b}: "…It’s complicated."\n{a} (to camera): "That’s not an answer."',
    '{b} won’t commit to a hypothetical.\n{b}: "Let’s not think about that."\n{a}: "I need to think about it."',
    '{b} dodges the question.\n{a}: "If they came for me, would you defend me?"\n{b}: "Let’s not get ahead of ourselves."\n{a} (to camera): {cam:unsure-info}',
  ],
  'asked-it-back': [
    '{a} asks what {b} would do. {b} asks {a} first.\n{b}: "You go. What would you do if it was me?"\n{a}: "I… I’d defend you."\n{b}: "Then so would I."',
    '{b} turns the hypothetical round.\n{b}: "You tell me first, then I’ll tell you."\n{a}: "I asked first."\n{b}: "And I asked second. Go on."\n{a} (to camera): "I hadn’t planned for that."',
    '{b} won’t answer until {a} does.\n{b}: "Same question, back at you."\n{a}: "That’s not how questions work."\n{b}: "It is in here."',
    '{b} asks it straight back.\n{a}: "If it came down to you or me, what would you do?"\n{b}: "What would you do?"\n{a} (to camera): "Why won’t anyone just answer a question in here?"',
  ],
  'made-a-condition': [
    '{b} says yes, then names a price.\n{b}: "I’d defend you. If you’d do the same for me, every time."\n{a}: "Deal."',
    '{b} agrees, with a condition.\n{b}: "Yes. As long as you tell me who you’re voting for tonight."\n{a}: "That’s a steep price for a yes."\n{b}: "Take it or leave it."\n{a} (to camera): "Everything costs something in here."',
    '{b} puts a condition on the promise.\n{b}: "Answer me one thing first."\n{a}: "Go on."',
    '{b} wants something back.\n{b}: "I’ll back you. You back me. That’s the deal."\n{a}: "Deal."\n{b}: "Say it like you mean it."',
  ],
};

// See the note over `DARE_LINES` for why these four events were all rewritten
// together: they shipped one `rng() < stat` comparison each, and a test has a
// subject and a result rather than a single coin.
const DOUBLE_CHECK_LINES = {
  consistent: [
    '{a} asks {b} to walk through the morning again. It matches, word for word.\n{a}: "Sorry, where were you before the mission?"\n{b}: "Same as I said. Kitchen, then the courtyard."\n{a} (to camera): "Same answer. Good."',
    '{a} makes {b} tell it twice, and it comes out the same.\n{a}: "Just once more, from the top."\n{b}: "Dinner, fire, up at eleven. Same as before."\n{a} (to camera): "Including the boring bits. That’s what the truth sounds like."',
    '{a} checks {b}’s story a second time.\n{b}: {say:answer-clean}\n{a}: "And after that?"\n{b}: "Bed. Same as I said this morning."\n{a} (to camera): "Consistent. I’ll take that."',
    '{b} repeats the account without a hitch.\n{a}: "Tell me last night again."\n{b}: "Kitchen, then the fire, then up. Why?"\n{a}: "No reason."\n{a} (to camera): "Nothing changed. That’s reassuring."',
  ],
  inconsistent: [
    '{a} asks {b} to go through the morning again, and it comes out different.\n{b}: "Courtyard, then the library."\n{a}: "Earlier you said the kitchen."\n{b}: "Did I? Kitchen, then."',
    'The second version has a room in it the first one didn’t.\n{a} (to camera): {cam:holding-info}',
    '{b}’s story shifts the second time.\n{b}: {say:answer-shaky}\n{a}: "This morning you said the library."\n{b}: "Did I? I meant after the library."\n{a} (to camera): "That’s not what {b} said this morning."',
    '{a} catches a change in {b}’s account.\n{a}: "You said eleven earlier."\n{b}: "Eleven, twelve. It was late."\n{a} (to camera): "Small change. But a change."',
  ],
  'would-not-repeat-it': [
    '{b} won’t go through it again.\n{b}: "I’ve told you."\n{a}: "Just once more."\n{b}: "No."',
    '{b} declines to repeat the story.\n{b}: "Why do you need it twice?"\n{a}: "Humour me."\n{b}: "No. Once is enough."\n{a} (to camera): "Refusing to repeat it. That’s either offended or careful."',
    '{b} shuts it down.\n{b}: "Asked and answered."\n{a}: "Just once more."\n{b}: "No. Ask me something new."',
    '{b} won’t tell it a second time.\n{a}: "Go through it again for me?"\n{b}: "I’ve told you. I’m not doing it twice."\n{a} (to camera): {cam:unsure-info}',
  ],
  'asked-why-twice': [
    '{b} answers again, then asks {a} why.\n{b}: "That’s twice you’ve asked. Why is it twice?"\n{a}: "Just making sure."\n{b}: "Of what?"',
    '{b} tells it again, then turns it round.\n{b}: "What’s changed since yesterday?"\n{a}: "Nothing’s changed. I’m just checking."\n{b}: "People don’t check for nothing."\n{a} (to camera): "I didn’t have a good answer to that."',
    '{b} notices the double check.\n{b}: "You’re checking my story."\n{a}: "Everyone’s checking everyone’s."',
    '{b} answers, then questions {a}.\n{b}: "Why do you care so much about my morning?"\n{a}: "I care about everyone’s morning."\n{b}: "No, you don’t."',
  ],
};

const SILENCE_LINES = {
  chased: [
    '{a} goes quiet on purpose, to see if {b} will fill it. {b} does, almost straight away.\n{b}: "What? What is it? Why’ve you gone quiet?"\n{a}: "Nothing."\n{b}: "It’s not nothing."',
    '{a} stops mid-thought, and {b} can’t leave it.\n{b}: "Finish what you were saying."\n{a}: "Doesn’t matter."\n{b}: "It does now."',
    '{a} lets a silence hang, and {b} rushes to fill it.\n{b}: "What? Why are you looking at me like that? Have I done something?"\n{a}: "No. Nothing."\n{a} (to camera): "Nervous people can’t stand silence."',
    '{b} chases {a}’s silence.\n{b}: "You’re worrying me."\n{a}: "Sorry. Miles away."\n{b}: "You’re never miles away."',
  ],
  letgo: [
    '{a} goes quiet on purpose. {b} goes quiet right back.\n{a} (to camera): "{b} just sat in the silence. Comfortable as anything."',
    '{a} leaves a gap. {b} sits in it and says nothing.\n{a} (to camera): {cam:unsure-info}',
    '{a} tests {b} with silence, and {b} doesn’t bite.\n{a} (to camera): "Calm. Too calm? I can’t tell."',
    '{b} lets the quiet be quiet.\n{a} (to camera): "Nothing. Not even a fidget."',
  ],
  'filled-it-with-their-own': [
    '{a} leaves a gap, and {b} fills it with something {a} never asked about.\n{b}: "Actually, I’ve been meaning to say — I don’t trust some of your friends."\n{a} (to camera): "I didn’t ask. {b} volunteered. Why?"',
    'The silence gets used, and {b} uses it.\n{b}: "While we’re here — who are you voting for tonight?"\n{a}: "I asked you first."\n{b}: "You didn’t ask anything. You went quiet."\n{a} (to camera): "I set the trap. {b} walked through it with a question of {bPos} own."',
    '{b} fills {a}’s silence with a change of subject.\n{b}: "Anyway. The mission tomorrow."\n{a}: "Right. The mission."\n{b}: "Unless you wanted to say something else?"',
    '{b} takes the silence and runs with it.\n{b}: "Since you’re not talking, I will. Who’s been off with you this week?"\n{a}: "…Nobody."\n{a} (to camera): "{b} steered the whole conversation. I let {bObj}."',
  ],
  'out-waited-them': [
    '{b} lets the silence run, then lets it run longer, and {a} breaks first.\n{a}: "Okay, fine, I was testing you."\n{b}: "I know."',
    '{a} sets the silence trap and steps in it.\n{a} (to camera): "I cracked first. {b} just waited me out."',
    '{b} out-waits {a}.\n{b}: "Were you going to say something?"\n{a}: "No. Yes. Forget it."',
    '{a} can’t hold the silence as long as {b}.\n{a} (to camera): {cam:story-close}',
  ],
};
const COLD_READ_LINES = {
  'read-it-right': [
    '{a} mentions {c} in front of {b}, just to watch {bPos} face. Something crosses it.\n{a}: "Did you see {c} at breakfast? Very quiet."\n{b}: "Was {cSub}? I didn’t notice."\n{a} (to camera): "{b} noticed. {b}’s face noticed."',
    '{a} says something about {c} and watches {b} instead of listening.\n{a}: "{c} was very quiet at breakfast, wasn’t {c}?"\n{b}: "Was {c}? I didn’t notice."\n{a} (to camera): "Got exactly what I came for."',
    '{a} drops {c}’s name into the chat, and watches.\n{a} (to camera): {cam:holding-info}',
    '{a} tests {b} with a line about {c}.\n{a}: "What do you make of {c}?"\n{b}: "{c}? Fine. Why?"\n{a} (to camera): "Mention {c}, and {b} looks away. Every time."',
  ],
  'read-it-wrong': [
    '{a} drops {c}’s name in front of {b}, and nothing happens.\n{a}: "{c} was acting odd last night."\n{b}: "Was {c}? Seemed normal to me."\n{a} (to camera): "Nothing. No reaction at all. Maybe I’m wrong about the two of them."',
    '{a} is sure {b} has a problem with {c}. {b} doesn’t.\n{b}: "{c}? {c}’s lovely."\n{a}: "Really? I thought you two didn’t get on."\n{b}: "Where did you hear that?"\n{a} (to camera): "Or I’ve got it all wrong."',
    '{a} reads {b} wrong.\n{a}: "You and {c} have fallen out, haven’t you?"\n{b}: "No. Should we have?"\n{a} (to camera): {cam:unsure-info}',
    '{a}’s test on {b} comes back blank.\n{a}: "Do you trust {c}?"\n{b}: "As much as anyone. Why?"\n{a} (to camera): "Either {b}’s a brilliant actor or I’m a rubbish detective."',
  ],
  'said-it-aloud': [
    '{a} brings up {c} to see how {b} reacts, then admits it.\n{a}: "Sorry. I was watching your face just then."\n{b}: "Why?"\n{a}: "Because of {c}."',
    '{a} owns up to the test.\n{a}: "I was testing you. About {c}."\n{b}: "And?"\n{a}: "And I don’t know."',
    '{a} tells {b} exactly what {aSub} was doing.\n{b}: "That’s honest, I suppose."\n{a}: "I was watching how you’d react to {c}’s name."\n{b}: "And?"',
    '{a} can’t keep the test to {aRef}.\n{a}: "I said {c}’s name to see if you’d flinch."\n{b}: "Did I?"\n{a}: "No."',
  ],
  'kept-it': [
    '{a} reads {b} on {c}, gets a clear answer, and gives nothing away.\n{a} (to camera): "I learned something. {b} doesn’t know I learned it."',
    '{b} answers a question {bSub} didn’t know was a question.\n{a} (to camera): {cam:holding-info}',
    '{a} gets what {aSub} needed and moves the conversation on.\n{a} (to camera): "Got it. Moving on."',
    '{a} keeps the result to {aRef}.\n{a} (to camera): "That’s one for my notes."',
  ],
};

// -- TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ------------
//
// One branch (`followed-through`) became four. The premise is that somebody is
// still quietly being marked, and the only outcome written was that they were
// still passing -- so the event could never report the thing it exists to look
// for. It can now: the promise is half-kept, it is dropped, or the person
// being marked works out that they are being marked, which is the worst of the
// four for the person doing the marking.
const FOLLOW_THROUGH_LINES = {
  'followed-through': [
    '{a} keeps quietly checking whether {b} is still doing what {bSub} promised.\n{a} (to camera): "{b} said {bSub}’d vote with me. {b} has, every time. So far."',
    '{a} watches {b} keep {bPos} word, day after day.\n{a} (to camera): "Consistent. I can work with consistent."',
    '{a} checks, and {b} is still keeping it.\n{a} (to camera): {cam:story-fine}',
    '{a} never mentions the promise again, but watches.\n{a} (to camera): "{b}’s kept it. Every single day."',
  ],
  'half-kept-it': [
    '{b} has done most of it. {a} notices which part is missing.\n{a} (to camera): "Most of the promise, kept. The important bit, not."',
    '{b} nearly keeps {bPos} word.\n{a} (to camera): {cam:unsure-info}',
    '{a} notices {b} slipping on the promise.\n{a} (to camera): "Nearly isn’t the same as did."',
    '{b} keeps half the promise.\n{a} (to camera): "Half a promise. I’ll remember that."',
  ],
  'dropped-it': [
    '{b} stopped keeping the promise a day ago, and {a} noticed.\n{a} (to camera): "{b} hasn’t done what {bSub} said {bSub}’d do. I’m not saying anything. Yet."',
    '{a} watches {b} not keep {bPos} word, and says nothing.\n{a} (to camera): {cam:holding-info}',
    '{b} has quietly given up on the promise.\n{a} (to camera): "Promises are cheap in here. I just learned how cheap."',
    '{a} sees {b} break {bPos} word.\n{a} (to camera): "Noted. Very noted."',
  ],
  'clocked-the-check': [
    '{b} works out {a} has been checking up on {bObj}.\n{b}: "You keep asking me that. Every day, in slightly different words."\n{a}: "Do I?"\n{b}: "You do."',
    '{b} calls {a} out on the checking.\n{b}: "I know what you’re doing."\n{a}: "What am I doing?"\n{b}: "Checking I keep my promise. Every day."\n{a} (to camera): "Caught."',
    '{b} lets {a} know {bSub} has noticed.\n{b}: "You can stop checking. I’m keeping my word."\n{a}: "I wasn’t checking."\n{b}: "You were. It’s fine. I’d check too."',
    '{b} spots the pattern in {a}’s questions.\n{b}: "Every morning, the same question. Why?"\n{a}: "Because I want to know."\n{b}: "Then ask me properly."',
  ],
};


registerEvent({
  id: 'testing-small-dare',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `testing|morning`.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'social', 'intuition'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-small-dare');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // HOW MANY TIMES THIS PAIR HAS ALREADY BEEN ROUND IT, off the stored arc.
    // The second small ask is a small ask; the fourth is a pattern, and a
    // person with any intuition at all eventually names it.
    const existing = findOpenThread(FAMILY, [a, b]);
    const times = existing ? priorMoments(existing, ctx.ep).length : 0;
    const scores = {
      complied: (st.loyalty / 10) * 0.5 + 0.1,
      refused: (1 - st.loyalty / 10) * 0.45 + 0.05,
      'named-the-test': (st.intuition / 10) * 0.3 + Math.min(3, times) * 0.1,
      'over-delivered': (st.social / 10) * 0.3 + (st.loyalty / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'complied';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'named-the-test' ? 'did the thing and said what it had been'
      : branch === 'over-delivered' ? 'was asked for a small thing and gave an afternoon'
        : 'set a small test to see if it would be taken';
    const bondDelta = branch === 'complied' ? 0.5
      : branch === 'refused' ? -0.5
        : branch === 'named-the-test' ? -1 : 1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(DARE_LINES[branch], `testing-small-dare|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    // TERMINAL: a test that gets named out loud is a test that has stopped
    // working, and `turned-back` is what it came home as — the same outcome
    // `testing-cold-read-check:clocked-the-check` closes on.
    if (thread && branch === 'named-the-test') {
      api.resolveArc(thread.id, 'turned-back', { source: sceneWhy });
    }
    const out = { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
    // AND ON ONE BRANCH THE DIRECTION REVERSES, which `roles: 'initiator-first'`
    // cannot express: when {b} names the test, {b} is speaking and {a} is the
    // one answering for it. An explicit pair on the result takes precedence
    // over `roles` — see `sceneSpeakers` in js/tr/events.js.
    if (branch === 'named-the-test') { out.speaker = b; out.respondent = a; }
    return out;
  },
});

registerEvent({
  id: 'testing-ask-for-alibi-check',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'dawn',
  // ACT: TESTING. Asking somebody to vouch for a night presumes there are
  // nights worth asking about and enough people left that an alibi can be
  // checked against somebody else's.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  // ADVANCES AND CITES (Plan 5 Task 2). `testing|dawn` held no advancer at
  // all, so a test opened at dawn could never be followed up at dawn. A
  // cross-check is definitionally a repeat: the second one is only worth
  // narrating against the first, which is what the citation supplies.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'social', 'loyalty'],
    knowledge: ['witnessed', 'incomplete'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-ask-for-alibi-check');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // THE THIRD PARTY IS A REAL PERSON WITH A REAL DISPOSITION, read off the
    // living roster and their own stats rather than treated as an oracle. A
    // check is only as good as the person you check with, and two of the four
    // branches below are about that person rather than about {b}.
    const others = (ctx.living || []).filter(n => n !== a && n !== b);
    const c = others.length ? others[Math.floor(rng() * others.length)] : null;
    const sc = c ? pStats(c) : null;
    const scores = {
      ok: (st.temperament / 10) * 0.45 + 0.1,
      bad: (1 - st.temperament / 10) * 0.4 + 0.05,
      // A castle that will not be drawn is a castle full of careful people.
      'nobody-would-say': sc ? (sc.temperament / 10) * 0.25 + (1 - sc.social / 10) * 0.15 : 0,
      // And a sociable third party is a third party who repeats things.
      'got-back-to-them': sc ? (sc.social / 10) * 0.3 + (1 - sc.loyalty / 10) * 0.15 : 0,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'ok';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'nobody-would-say' ? 'could not get anybody to be drawn on it'
      : branch === 'got-back-to-them' ? 'checked an account with somebody who repeated the checking'
        : 'took somebody\'s account of the night to a third party';
    const bondDelta = branch === 'ok' ? 0.5
      : branch === 'bad' ? -1
        : branch === 'nobody-would-say' ? 0 : -1.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    if (branch === 'got-back-to-them' && c) api.addBond(a, c, -0.5, { source: sceneWhy });
    const line = lineFor(ALIBI_CHECK_LINES[branch],
      `testing-ask-for-alibi-check|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    // ONE PARTICIPANT ON THE RECORD, BECAUSE ONE PERSON IS IN THIS SCENE.
    // Every branch of an alibi check is conducted BEHIND {b}'s back — {a} takes
    // {b}'s account to third parties ({b} is not in the room), and even
    // `got-back-to-them` has {b} finding out afterwards rather than being
    // present. Reporting `pair: [a, b]` put {b} into `sceneParticipants`, so the
    // screen composed a two-hander and handed {b} an establishing card ("{a} and
    // {b} are at the bottom of the stairs"), a face-to-face reaction ("{b}
    // stumbles, laughs...") and a consequence that then said "{b} has no idea a
    // question was asked" — three cards of a conversation {b} was never in. Same
    // defect and same fix as `susp-pattern-tracking`, `trust-defend-in-absentia`
    // and `cover-feign-fear:borrowed-it`: report `actor` alone, so `_mode`
    // composes the solo/single scene the event actually is. The convened pair
    // [a, b] is still keyed for cooldowns at pick time (js/tr/events.js), and
    // `api.addBond(a, b, …)` above is untouched, so the simulation is unchanged.
    return { branch: branch === 'ok' ? 'checks-out' : branch === 'bad' ? 'inconsistent' : branch,
      actor: a, topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-loyalty-oath',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['boldness', 'loyalty', 'strategic'],
    relationship: ['close-ally', 'neutral'],
  },
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 2 ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-loyalty-oath');
    const sceneWhy = 'asked for it out loud';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const sincereScore = (st.loyalty / 10) * 0.5 + (st.boldness / 10) * 0.3 + 0.1;
    const reluctantScore = 0.35;
    const refusesScore = (1 - st.loyalty / 10) * 0.5 + (1 - st.boldness / 10) * 0.15;
    // A FOURTH ANSWER TO BEING ASKED, and it is the only one that changes who
    // is being tested: {b} swears and requires the same of {a}. Strategic and
    // boldness in the person UNDER the test, a pairing none of the three
    // above reads.
    const mutualScore = (st.strategic / 10) * 0.35 + (st.boldness / 10) * 0.2;
    const total = sincereScore + reluctantScore + refusesScore + mutualScore;
    const roll = rng() * total;
    let branch;
    if (roll < sincereScore) branch = 'sincere';
    else if (roll < sincereScore + reluctantScore) branch = 'reluctant';
    else if (roll < sincereScore + reluctantScore + refusesScore) branch = 'refuses';
    else branch = 'asked-for-one-back';

    const line = lineFor(OATH_LINES[branch], `testing-loyalty-oath|${ctx.ep}|${branch}`, { a, b });
    // A mutual oath binds harder than a given one: both of them are in it.
    const bondDelta = branch === 'sincere' ? 2 : branch === 'asked-for-one-back' ? 2.5
      : branch === 'reluctant' ? 0 : -2;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    // THE EVENT DOES NOT KNOW WHO IT IS WATCHING and must not pretend to. An
    // oath sworn sincerely reads as `kind` whoever swears it — and a Traitor
    // swearing one has their affection damped to a quarter by crowd.js anyway,
    // which is the whole point of putting that rule in ONE place. Declaring
    // `masterful` here instead paid six Faithfuls a villain's ledger over 100
    // seasons, because `a` is whoever the scene drew and not a Traitor.
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: t?.id, bondDelta,
      crowd: branch === 'sincere' ? { name: a, colour: 'kind', mult: 0.6 }
        : branch === 'refuses' ? { name: a, colour: 'cowardly', mult: 0.4 } : null };
  },
});

registerEvent({
  id: 'testing-reverse-psychology',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  // ACT: TESTING. Baiting somebody to watch their face is a mid-season move:
  // early there is nothing to bait them about, late the room is too small for
  // a test this indirect to stay private.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'intuition', 'boldness', 'strategic'],
    relationship: ['close-ally', 'neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-reverse-psychology');
    const sceneWhy = 'argued the opposite to see what came back';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // FOUR OUTCOMES, TWO OF WHICH GO BADLY FOR THE TESTER. Sharpness is what
    // gets a bait caught and nerve is what gets it turned round, so the person
    // being tested decides all four -- which is what a test is for.
    const scores = {
      'stayed-calm': (st.temperament / 10) * 0.5 + 0.15,
      'got-rattled': (1 - st.temperament / 10) * 0.55 + 0.15,
      'saw-through-it': (st.intuition / 10) * 0.5 + (st.mental / 10) * 0.25,
      'turned-it-round': (st.boldness / 10) * 0.4 + (st.strategic / 10) * 0.35,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0);
    let roll = rng() * total;
    let branch = 'stayed-calm';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const pool = branch === 'stayed-calm' ? REVERSE_PSYCH_LINES.calm
      : branch === 'got-rattled' ? REVERSE_PSYCH_LINES.rattled : REVERSE_PSYCH_LINES[branch];
    const bondDelta = branch === 'stayed-calm' ? 0.5
      : branch === 'got-rattled' ? -1 : branch === 'saw-through-it' ? -1.5 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(pool, `testing-reverse-psychology|${branch}|${ctx.ep}`, { a, b });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    // THE DIRECTION IS THE BRANCH'S ON TWO OF THESE. On `saw-through-it` and
    // `turned-it-round` the person being tested takes the conversation over,
    // and the `roles: 'initiator-first'` declaration above would hand the
    // reaction card to the wrong one. `speaker`/`respondent` on the result
    // takes precedence -- see `sceneSpeakers` in js/tr/events.js.
    const bTakesIt = branch === 'saw-through-it' || branch === 'turned-it-round';
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
      threadId: t?.id, bondDelta };
  },
});

registerEvent({
  // ── REWRITE (Task 7 stage 5) ────────────────────────────────────────
  //
  // Two branches, `reassured` and `hedged`, chosen by one coin against
  // loyalty — the audit’s "2 branches, short of four materially different
  // paths" — and between them 17 of 287 loud seasons once `evening` opened up.
  //
  // FOUR ANSWERS TO A HYPOTHETICAL, and the two new ones are the two a real
  // person actually gives: they ask it back, or they answer it with a price
  // on it. Both are refusals of the frame, and neither is the same scene as
  // agreeing or waffling.
  id: 'testing-hypothetical-loyalty-question',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'strategic', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-hypothetical-loyalty-question');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const scores = {
      reassured: (st.loyalty / 10) * 0.6 + 0.1,
      hedged: (1 - st.loyalty / 10) * 0.4 + (1 - st.boldness / 10) * 0.25,
      'asked-it-back': (st.boldness / 10) * 0.4 + (st.intuition / 10) * 0.3,
      'made-a-condition': (st.strategic / 10) * 0.45 + (st.mental / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'asked-it-back' ? 'answered a hypothetical with the same hypothetical'
      : branch === 'made-a-condition' ? 'answered a hypothetical with a price on it'
        : 'asked a hypothetical and watched the answer';
    const bondDelta = branch === 'reassured' ? 1
      : branch === 'hedged' ? -0.5 : branch === 'asked-it-back' ? 0 : 0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(HYPOTHETICAL_LINES[branch],
      `testing-hypothetical-loyalty-question|${branch}|${ctx.ep}`, { a, b });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
    // ON `asked-it-back` THE ANSWERER TAKES THE SCENE OVER, and the
    // `roles: 'initiator-first'` declaration above would hand the reaction
    // card to the wrong one. `speaker`/`respondent` on the result takes
    // precedence — see `sceneSpeakers`, js/tr/events.js, and the identical
    // note on `testing-reverse-psychology` above.
    const bTakesIt = branch === 'asked-it-back';
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
      threadId: t?.id, bondDelta };
  },
});
registerEvent({
  id: 'testing-double-check-story',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'morning',
  // ACT: TESTING. Going back over a story you were already told is the
  // middle-act instinct: doubt with the patience to be quiet about it.
  acts: { early: 0.7, middle: 1.4, late: 0.8 },
  // ADVANCES AND CITES (Plan 5 Task 2). `testing|morning` held no advancer
  // either. "Walk me through your morning AGAIN" is the single most literal
  // citation in the pool — the whole event is somebody re-asking a question
  // they already asked, and the day they first asked it is the point.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'intuition', 'boldness'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-double-check-story');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    // HOW MANY TIMES {a} HAS ALREADY DONE THIS TO {b}, off the stored arc.
    // "Walk me through it again" is a question that changes meaning entirely
    // on the third asking, and both new branches are about that.
    const existing = findOpenThread(FAMILY, [a, b]);
    const times = existing ? priorMoments(existing, ctx.ep).length : 0;
    const scores = {
      consistent: (st.temperament / 10) * 0.5 + 0.15,
      inconsistent: (1 - st.temperament / 10) * 0.45 + 0.05,
      'would-not-repeat-it': (st.boldness / 10) * 0.2 + Math.min(3, times) * 0.1,
      'asked-why-twice': (st.intuition / 10) * 0.25 + Math.min(3, times) * 0.12,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'consistent';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'would-not-repeat-it' ? 'would not walk through it a second time'
      : branch === 'asked-why-twice' ? 'answered it again and asked why it was being asked again'
        : 'checked one account against another';
    const bondDelta = branch === 'consistent' ? 0
      : branch === 'inconsistent' ? -1
        : branch === 'would-not-repeat-it' ? -1.5 : -0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(DOUBLE_CHECK_LINES[branch],
      `testing-double-check-story|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    // TERMINAL: a check the subject names out loud has stopped being a check.
    if (thread && branch === 'asked-why-twice') {
      api.resolveArc(thread.id, 'turned-back', { source: sceneWhy });
    }
    const out = { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
    // The direction reverses when {b} turns the question round — see the same
    // note on `testing-small-dare` above.
    if (branch === 'asked-why-twice') { out.speaker = b; out.respondent = a; }
    return out;
  },
});

registerEvent({
  id: 'testing-silence-test',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'dawn',
  // The second advancer in `testing|dawn` — see the note on the pair cooldown
  // above susp-whisper-about-absent.
  advancesThread: true,
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'loyalty', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-silence-test');
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const sa = pStats(a);
    const scores = {
      chased: (st.social / 10) * 0.5 + (st.loyalty / 10) * 0.35,
      letgo: (1 - st.social / 10) * 0.4 + 0.05,
      // Somebody with something to put down will use a silence for their own
      // purposes, which is a result and not a failure.
      'filled-it-with-their-own': (st.social / 10) * 0.25 + (1 - st.temperament / 10) * 0.2,
      // And a person more comfortable with quiet than the person running the
      // test wins the test. That is {a}'s temperament against {b}'s.
      'out-waited-them': Math.max(0, (st.temperament - sa.temperament) / 10) * 0.5,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'chased';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'filled-it-with-their-own' ? 'used somebody else\'s silence for their own purposes'
      : branch === 'out-waited-them' ? 'out-waited the person running the silence'
        : 'left a silence to see who filled it';
    const bondDelta = branch === 'chased' ? 1
      : branch === 'letgo' ? -1
        : branch === 'filled-it-with-their-own' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(SILENCE_LINES[branch], `testing-silence-test|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, line, { source: sceneWhy });
    const out = { branch: branch === 'letgo' ? 'let-it-go' : branch,
      pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, bondDelta };
    // The direction reverses when the test runs backwards — see the same note
    // on `testing-small-dare` above.
    if (branch === 'out-waited-them') { out.speaker = b; out.respondent = a; }
    return out;
  },
});

registerEvent({
  // ── REWRITE (Task 7 stage 5) ──────────────────────────────────
  //
  // The audit’s verdict was REWRITE, and there were two things wrong rather
  // than one. The fork was in the wording — one branch, `cold-read`, over one
  // pool — and the effect was `api.addBond(a, b, 0)`, a delta of exactly
  // zero, which the scene API refuses with a `blockedBy: 'no-op'` receipt. So
  // this event fired, printed a sentence, and changed nothing about the
  // season at all.
  //
  // FOUR OUTCOMES, AND A COLD READ IS THE ONE MOVE IN THE POOL THAT CAN BE
  // WRONG WITHOUT ANYBODY FINDING OUT. That asymmetry is the event:
  //
  //   read-it-right  — {a} says the thing about {c} that {b} had not said,
  //                    and {b} confirms it. {a} has a real read now.
  //   read-it-wrong  — {a} does the same and is simply wrong, and {b} does not
  //                    correct it, which is worse for {a} than being corrected.
  //   said-it-aloud  — {a} tells {b} what {a} has just done, which turns a
  //                    private read into a shared one and costs {a} the edge.
  //   kept-it        — {a} gets the read and gives {b} nothing, and {b} feels
  //                    the giving-nothing.
  //
  // NOTHING HERE READS ALIGNMENT. `suspicion(a, c)` is what {a} already
  // thinks, which is the same pure read `trust-trade-reads` makes, and
  // `read-it-right` is scored on {a}’s intuition rather than on whether {c}
  // is in fact a Traitor. Being right about somebody’s MOOD is not being
  // right about their role, and this event claims only the first.
  id: 'testing-cold-read-check',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'social', 'strategic'],
    knowledge: ['incomplete', 'misinformed', 'witnessed'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a] = ctx.actors;
    return pStats(a).intuition >= 7 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-cold-read-check');
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : [b]);
    const sa = pStats(a);
    const scores = {
      'read-it-right': (sa.intuition / 10) * 0.6 + (sa.social / 10) * 0.2,
      'read-it-wrong': (1 - sa.intuition / 10) * 0.5 + 0.2,
      'said-it-aloud': (sa.social / 10) * 0.4 + Math.max(0, getBond(a, b)) / 10 * 0.3,
      'kept-it': (sa.strategic / 10) * 0.45 + (1 - sa.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[keys.length - 1];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'read-it-wrong' ? 'read them cold and got it wrong'
      : branch === 'said-it-aloud' ? 'said the read out loud instead of keeping it'
        : branch === 'kept-it' ? 'took a read and gave nothing back for it'
          : 'read them cold and said nothing about it';
    // EVERY BRANCH MOVES SOMETHING NOW. The old version’s zero delta was
    // refused by the scene API outright, so the event had no consequence at
    // all; these are small on purpose, because a cold read is a small move.
    const bondDelta = branch === 'read-it-right' ? 0.5
      : branch === 'read-it-wrong' ? -0.5 : branch === 'said-it-aloud' ? 1 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b], { source: sceneWhy,
      seed: lineFor(COLD_READ_LINES[branch], `testing-cold-read-check|${branch}|${ctx.ep}`,
        { a, b, c: target }) });
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: a, respondent: b, target,
      threadId: t?.id, bondDelta };
  },
});
registerEvent({
  id: 'testing-follow-through-check',
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  // CITES (Plan 5 Task 2). "Whatever they'd been asked before" is a sentence
  // with a hole in it where the day should be.
  citesResidue: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'intuition', 'temperament', 'social'],
    relationship: ['close-ally', 'neutral', 'rival'],
    knowledge: ['witnessed', 'incomplete'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return findOpenThread(FAMILY, [a, b]) ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-follow-through-check');
    const sceneWhy = 'checked whether a promise was kept';
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    const sb = pStats(b);
    const scores = {
      'followed-through': (sb.loyalty / 10) * 0.5 + (sb.temperament / 10) * 0.25,
      'half-kept-it': (1 - sb.loyalty / 10) * 0.35 + (sb.strategic / 10) * 0.25,
      'dropped-it': (1 - sb.loyalty / 10) * 0.5 + 0.1,
      'clocked-the-check': (sb.intuition / 10) * 0.45 + (sb.social / 10) * 0.2,
    };
    const total = Object.values(scores).reduce((acc, v) => acc + v, 0);
    let roll = rng() * total;
    let branch = 'followed-through';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'followed-through' ? 0.5
      : branch === 'half-kept-it' ? -0.5 : branch === 'dropped-it' ? -2 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep,
      lineFor(FOLLOW_THROUGH_LINES[branch], `testing-follow-through-check|${branch}|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    // On `clocked-the-check` the marked player ends the arrangement, so the
    // scene changes hands and the field says so rather than the sentence.
    const bTakesIt = branch === 'clocked-the-check';
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', speaker: bTakesIt ? b : a, respondent: bTakesIt ? a : b,
      threadId: thread?.id, cited, bondDelta };
  },
});

// ── FLAGSHIP: the decoy secret — a four-way fork on the TARGET's own
// loyalty, temperament, social, and intuition ────────────────────────────
//
// The actor plants a piece of fabricated "secret" information with a single
// target and does nothing else — the test is entirely about what the
// target does with it next:
//   KEPT-QUIET          — high loyalty + temperament. It never resurfaces
//                         anywhere. Real trust confirmed; bond gain, and
//                         the thread closes clean.
//   REPEATED-INNOCENTLY  — high social, otherwise unremarkable: the target
//                         just isn't built to sit on information, no malice
//                         in it. Moderate bond hit; thread advances instead
//                         of closing, because the leak is now itself a
//                         live fact the tester has to manage.
//   REPEATED-MALICIOUSLY — high strategic + low loyalty: the target used
//                         the "secret" as currency. Heavy bond damage, and
//                         the thread closes with an outcome that marks the
//                         target as an active risk, not just a leaky one.
//   CAUGHT-THE-TEST       — high intuition: the target clocks that they
//                         were being tested and says so, outright. Damages
//                         the TESTER's own credibility instead of the
//                         target's — a genuinely different kind of failure,
//                         with the bond hit landing on the tester's side of
//                         the ledger via a small negative to the actor
//                         (modeled as a symmetric bond change, since the
//                         only bond value this engine tracks is symmetric,
//                         but the residue explicitly says whose failure it
//                         was).
const DECOY_LINES = {
  keptQuiet: [
    '{a} tells {b} a fake secret, to see if it spreads. It doesn’t.\n{a} (to camera): "I told {b} I had a shield. Nobody else has heard it. {b} kept it."',
    '{b} sits on the planted secret completely.\n{a} (to camera): "Not a whisper. {b} passed."',
    '{a} checks whether the fake secret has got out. It hasn’t.\n{a} (to camera): "{b} kept it. I trust {b} a bit more now."',
    '{b} keeps {a}’s fake secret to {bRef}.\n{a} (to camera): {cam:story-fine}',
  ],
  innocent: [
    '{b} passes the fake secret on within a day, without meaning to.\n{a} (to camera): "{b} told someone. I don’t think {b} meant anything by it. But {b} can’t keep a secret."',
    'The fake secret gets out through {b}, clearly by accident.\n{a} (to camera): "Not malicious. Just leaky. Good to know."',
    '{b} lets it slip to someone at dinner.\n{a} (to camera): "Loose lips. Not evil. Just loose."',
    '{a} hears the fake secret come back round, via {b}.\n{a} (to camera): "{b} talks. That’s all it tells me."',
  ],
  malicious: [
    '{b} takes the planted secret and uses it, on purpose.\n{a} (to camera): "{b} used my fake secret to get something. That’s not a slip. That’s a play."',
    '{b} trades {a}’s "secret" for leverage the moment it’s useful.\n{a} (to camera): "Now I know exactly what {b} does with things I tell {bObj}."',
    '{b} spends the fake secret deliberately.\n{a} (to camera): {cam:holding-info}',
    '{b} uses {a}’s secret against {aObj}.\n{a} (to camera): "Fake secret, real betrayal."',
  ],
  caughtTest: [
    '{b} looks {a} in the eye.\n{b}: "You’re testing me, aren’t you?"\n{a}: "What? No."\n{b}: "That secret was fake."',
    '{b} sees straight through the plant.\n{b}: "Nice try."\n{a}: "Nice try at what?"\n{b}: "Nobody has a shield. You wanted to see if I’d tell."\n{a} (to camera): "{b} knew. Straight away."',
    '{b} calls {a}’s bluff.\n{b}: "You made that up to see if I’d tell."\n{a}: "Why would I do that?"\n{b}: "Because it’s what I’d do."',
    '{b} figures out the fake secret was a test.\n{b}: "That shield you told me about. You made it up, didn’t you?"\n{a}: "…Maybe."\n{a} (to camera): {cam:story-close}',
  ],
};

registerEvent({
  id: 'testing-decoy-secret',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected', 'backfire'],
    voice: ['intuition', 'loyalty', 'social', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-decoy-secret');
    const sceneWhy = 'planted a secret to see where it travelled';
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const keptScore = (st.loyalty / 10) * 0.5 + (st.temperament / 10) * 0.3 + 0.1;
    const innocentScore = (st.social / 10) * 0.5 + 0.15;
    const maliciousScore = (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.4;
    const caughtScore = (st.intuition / 10) * 0.6;
    const total = keptScore + innocentScore + maliciousScore + caughtScore;
    const roll = rng() * total;
    let branch;
    if (roll < keptScore) branch = 'keptQuiet';
    else if (roll < keptScore + innocentScore) branch = 'innocent';
    else if (roll < keptScore + innocentScore + maliciousScore) branch = 'malicious';
    else branch = 'caughtTest';

    const line = pronounSlots(pick(rng, DECOY_LINES[branch])
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b), { a, b });
    const existing = findOpenThread(FAMILY, [a, b]);
    let bondDelta;
    let threadId;
    if (branch === 'keptQuiet') {
      bondDelta = 2;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'passed-clean', { source: sceneWhy });
        threadId = existing.id;
      } else threadId = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line })?.id;
    } else if (branch === 'innocent') {
      bondDelta = -1;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      const t = existing
        ? api.advanceArc(existing.id, line, { source: sceneWhy })
        : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line });
      threadId = t?.id;
    } else if (branch === 'malicious') {
      bondDelta = -3;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'failed-maliciously', { source: sceneWhy });
        threadId = existing.id;
      } else threadId = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line })?.id;
    } else {
      bondDelta = -1;
      api.addBond(a, b, bondDelta, { source: sceneWhy });
      // WRITE THE BEAT, THEN CLOSE (whole-plan review, F3). `closeThread` sets
      // state and outcome and writes NOTHING — no beat, no residue — so a
      // branch that computed a line and went straight to it printed nothing at
      // all. This is the payoff scene of the story it is closing; it has to say
      // what happened before it says it is over.
      if (existing) {
        api.advanceArc(existing.id, line, { source: sceneWhy });
        api.resolveArc(existing.id, 'test-exposed', { source: sceneWhy });
        threadId = existing.id;
      } else threadId = api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: line })?.id;
    }
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId, bondDelta };
  },
});


// -- PLAN 5 TASK 4: THE `night` WINDOW ----------------------------------
//
// The last check of the day, and the one that ends the probe. A test that is
// never scored is not a test, and until this event the only place a testing
// thread could be RESOLVED was `testing-decoy-secret` in evening - one event,
// in the pool's most crowded window, behind a 5-episode pair cooldown.

const NIGHT_CHECK_LINES = {
  confirmed: [
    '{a} goes back over what {aSub} asked {b}, and what {b} did about it. It comes out clean.\n{a} (to camera): "{b} passed. Twice. I believe in {b}."',
    'Before sleeping, {a} goes over the test on {b} once more.\n{a} (to camera): {cam:story-fine}',
    '{a} lies in bed, happy with how {b} came through.\n{a} (to camera): "Clean. {b}’s one of the good ones."',
    '{a} checks the day against {b}, and {b} holds.\n{a} (to camera): "Confirmed. For now."',
  ],
  failed: [
    '{a} lays out the day before sleeping, and finds exactly where {b} failed.\n{a} (to camera): "There. That’s the moment. {b} slipped."',
    'It takes until lights out for {a} to see it.\n{a} (to camera): {cam:certain}',
    '{a} goes through it again and {b} fails every time.\n{a} (to camera): "I didn’t want it to be {b}. It’s looking like {b}."',
    '{a} realises {b} didn’t pass.\n{a} (to camera): "Failed. I’ll say it at the table."',
  ],
  inconclusive: [
    '{a} can’t make the day prove anything about {b}, either way.\n{a} (to camera): {cam:unsure-info}',
    'The test on {b} comes back neither one thing nor the other.\n{a} (to camera): "I hate a maybe. Give me a yes or a no."',
    '{a} lies awake over {b}.\n{a} (to camera): "Nothing proves anything. That’s this game."',
    '{a} can’t decide about {b}.\n{a} (to camera): {cam:undecided}',
  ],
  misread: [
    '{a} comes out of the night certain about {b}, and certain the wrong way.\n{a} (to camera): "I’ve worked {b} out. I’m sure of it."',
    'The test gives {a} a clean answer about {b}. It’s the wrong answer.\n{a} (to camera): {cam:certain}',
    '{a} misreads what {b} did.\n{a} (to camera): "I know exactly what {b} is now."',
    '{a} is sure, and wrong.\n{a} (to camera): "No doubt in my mind about {b}."',
  ],
};

registerEvent({
  id: 'testing-night-scores-it',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'loyalty', 'mental', 'temperament'],
    knowledge: ['tested-before', 'first-test'],
  },
  // The direction is a property of THIS event, not of the sentence it happens
  // to draw: the pair is [the one running the test, the one being tested].
  // See `sceneSpeakers` in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return findOpenThread(FAMILY, ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-night-scores-it');
    const sceneWhy = 'the night settled what the test proved';
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    // TWO PEOPLE'S STATS, because a test result is a joint fact: whether the
    // tested player held (loyalty, temperament) AND whether the tester was
    // sharp enough to read what they saw (mental, intuition).
    const passScore = (sb.loyalty / 10) * 0.5 + (sb.temperament / 10) * 0.4;
    const failScore = (1 - sb.loyalty / 10) * 0.5 + (sa.intuition / 10) * 0.4;
    const noneScore = (1 - sa.mental / 10) * 0.6 + 0.2;
    // A FOURTH RESULT, and it is the one the other three cannot express: a
    // CONFIDENT WRONG READ. `inconclusive` is the tester getting no answer;
    // this is the tester getting an answer and it being false, which is a
    // different and more dangerous thing to carry into a week. Low intuition
    // with high confidence -- the corner `noneScore` (low mental) misses.
    const misreadScore = (1 - sa.intuition / 10) * 0.4 + (sb.social / 10) * 0.25;
    const total = passScore + failScore + noneScore + misreadScore;
    const roll = rng() * total;
    let branch;
    if (roll < passScore) branch = 'confirmed';
    else if (roll < passScore + failScore) branch = 'failed';
    else if (roll < passScore + failScore + noneScore) branch = 'inconclusive';
    else branch = 'misread';

    const line = pronounSlots(pick(rng, NIGHT_CHECK_LINES[branch])
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b), { a, b });
    const thread = findOpenThread(FAMILY, [a, b]);
    // A misread warms the bond exactly as a pass would, because {a} believes
    // it was a pass. That is the whole cost of the branch.
    const bondDelta = branch === 'confirmed' ? 2 : branch === 'misread' ? 1.5
      : branch === 'failed' ? -2.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { note, cited } = arcAdvanceCiting(api, thread, ctx.ep, line, { source: sceneWhy });
    const outcome = branch === 'confirmed' ? 'passed-clean'
      : branch === 'failed' ? 'failed-maliciously' : null;
    if (outcome) api.resolveArc(thread.id, outcome, { source: sceneWhy });
    return { branch, pair: [a, b], topic: b, topicKind: 'testing-probe', threadId: thread.id, cited, note, outcome, bondDelta };
  },
});
