// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-arrival2.js — arrivals by voice, age, stats, hometown and job
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: arrivals "only use their archetype, not their voices, their ages, their
// stats, so it gets repetitive". These sit in the same pools as n-arrival.js ('.any'), gated on
// the speaker's voice tags (td/story/voice.js; write.js plays a's strongest voice first), the
// authored age band, a standout stat, or the authored hometown / job ({home}, {job}).
//   arrive.host.any        the host introduces a
//   arrive.new.any         a first-timer's entrance (a and h)
//   arrive.back.any        a returnee's entrance
//   arrive.meet.greet.<tone>  a first hello between a (arriving) and b (waiting), and sometimes c:
//                          flirt, snark, awkward, hype, size, friendly, plain
//   arrive.wait.any        a, b, c (and d) on the dock, talking about who has shown up ({latest})
// Ids: 'nx.h', 'nx.n', 'nx.b', 'nx.g', 'nx.w' (n-tribal uses 'nx.f', 'nx.s', 'nx.a').

const H = (id, when, line) => ({ id, when, turns: [{ by: 'h', say: line }] });
const O = (by, say) => ({ by, say, opt: true });

export default {
  'arrive.host.any': [
    H('nx.h1', { voice: 'dry' }, "Here's {a}. Our producers said {a} was 'not thrilled' to be cast. Perfect."),
    H('nx.h2', { voice: 'dry' }, "Everybody, this is {a}. Try to impress {a}. Nobody ever has."),
    H('nx.h3', { voice: 'loud' }, "You probably heard {a} before you saw the boat. Everybody, {a}!"),
    H('nx.h4', { voice: 'loud' }, "Here's {a}! Our sound guy is already crying."),
    H('nx.h5', { voice: 'warm' }, "Here's {a}, who asked if there'd be a group hug. There won't."),
    H('nx.h6', { voice: 'warm' }, "Everybody, meet {a}. Be nice. {a.Sub}'ll be nice to you first anyway."),
    H('nx.h7', { voice: 'theatrical' }, "And now, making an entrance, because of course {a} is making an entrance... {a}!"),
    H('nx.h8', { voice: 'theatrical' }, "Here's {a}! Please hold your applause. {a} won't."),
    H('nx.h9', { voice: 'anxious' }, "Here's {a}! Breathe, {a}. You're doing great. Mostly."),
    H('nx.h10', { voice: 'anxious' }, "Everybody, this is {a}, who asked me four times on the phone if this show is safe. It isn't."),
    H('nx.h11', { voice: 'calm' }, "Here's {a}. Nothing bothers {a}. Challenge accepted."),
    H('nx.h12', { voice: 'competitive' }, "Here's {a}, who asked our producers for the rules in writing. In advance. Twice."),
    H('nx.h13', { voice: 'competitive' }, "And {a}! Already looking at all of you like you're in {a}'s way."),
    H('nx.h14', { voice: 'schemer' }, "Here's {a}. Smile, everyone. {a} is taking notes."),
    H('nx.h15', { voice: 'cruel' }, "Here's {a}. I'd say be nice, {a}, but I've seen the audition tape."),
    H('nx.h16', { voice: 'cruel' }, "Everybody, this is {a}. Don't take anything {a} says personally. Actually, do. It's better TV."),
    H('nx.h17', { voice: 'chaotic' }, "Here's {a}! We had to sign a lot of forms for this one."),
    H('nx.h18', { voice: 'food' }, "Here's {a}, whose first question was what's for lunch. The answer is sadness."),
    H('nx.h19', { voice: 'ditzy' }, "Here's {a}! {a} thought this was a cruise. We didn't correct {a}."),
    H('nx.h20', { voice: 'nerdy' }, "Here's {a}, who brought more books than clothes. Respect."),
    H('nx.h21', { voice: 'nerdy' }, "Everybody, meet {a}. {a} has already calculated how likely it is that this ends badly. Very."),
    H('nx.h22', { voice: 'earnest' }, "Here's {a}, who thanked every single person on the crew. Every single one."),
    H('nx.h23', { voice: 'flirty' }, "Here's {a}! Lock up your hearts, everybody."),
    H('nx.h24', { voice: 'tough' }, "Here's {a}. Don't let the smile fool you. Actually, there isn't a smile."),
    H('nx.h25', { voice: 'tough' }, "Everybody, this is {a}. I'd stay on {a}'s good side. If {a} has one."),
    H('nx.h26', { voice: 'bossy' }, "Here's {a}, who has already told the boat driver how to drive the boat."),
    H('nx.h27', { voice: 'emotional' }, "Here's {a}! And {a} is already crying. Happy tears? Let's say happy tears."),
    H('nx.h28', { voice: 'goofy' }, "Here's {a}! I asked {a} for a serious photo. This was the most serious one."),
    H('nx.h29', { voice: 'proud' }, "And here's {a}, who would like everybody to know {a} was a big deal back home."),
    H('nx.h30', { voice: 'blunt' }, "Here's {a}. Ask {a} what {a} thinks of you. Actually, don't."),
    H('nx.h31', { age: 'teen' }, "Here's {a}! Fresh out of school, and very not ready for this."),
    H('nx.h32', { age: 'twenties' }, "Here's {a}! Young, broke, and very motivated by a cash prize."),
    H('nx.h33', { age: 'thirties' }, "Here's {a}, who took vacation days for this. Bad call, {a}."),
    H('nx.h34', { age: 'older' }, "Here's {a}! Older than most of the cast and probably smarter than all of it."),
    H('nx.h35', { home: true }, "All the way from {home}, it's {a}!"),
    H('nx.h36', { home: true }, "Here's {a}! {home} is very proud. Or very relieved. One of those."),
    H('nx.h37', { job: true }, "Here's {a}. Day job: {job}. Night job, for the next few weeks: suffering."),
    H('nx.h38', { job: true }, "Everybody, meet {a}! Put {a.posAdj} job down as {job}. We'll see if that helps."),
    H('nx.h39', { tough: true }, "Here's {a}, and {a} looks like {a} has been in a fight with a bear. And won."),
    H('nx.h40', { sly: true }, "Here's {a}. I've been doing this a long time. I don't trust {a}. That's a compliment."),
    H('nx.h41', { loyal: true }, "Here's {a}! The kind of friend who helps you move. Twice."),
    H('nx.h42', { sharp: true }, "Here's {a}, who noticed the camera behind the tree before I did."),
  ],

  'arrive.new.any': [
    { id: 'nx.n1', when: { voice: 'dry' }, turns: [
      { by: 'a', say: "Wow. It's even worse than the brochure." },
      { by: 'h', say: "There wasn't a brochure." },
      { by: 'a', say: "Exactly." },
    ] },
    { id: 'nx.n2', when: { voice: 'dry' }, turns: [
      { by: 'h', say: "Excited, {a}?" },
      { by: 'a', say: "Can't you tell? This is my excited face." },
      { by: 'a', conf: "I'm here for the money, and also because I lost a bet, but mostly the money." },
    ] },
    { id: 'nx.n3', when: { voice: 'loud' }, turns: [
      { by: 'a', say: "LET'S GOOOO! Hi everybody!" },
      { by: 'h', say: "We're right here. You can use your inside voice." },
      { by: 'a', say: "This IS my inside voice!" },
    ] },
    { id: 'nx.n4', when: { voice: 'loud' }, turns: [
      { by: 'a', say: "Okay, who's ready to lose? Because it's not gonna be me!" },
      { by: 'h', say: "Great energy. Terrible strategy." },
      { by: 'a', conf: "I don't do quiet, because quiet gets forgotten, and nobody's forgetting me." },
    ] },
    { id: 'nx.n5', when: { voice: 'warm' }, turns: [
      { by: 'a', say: "Hi! Oh my gosh, hi, is everybody okay? That ride was so bumpy." },
      { by: 'h', say: "They're fine. Probably." },
      { by: 'a', say: "I brought snacks if anybody's feeling sick." },
      { by: 'a', conf: "I want everybody here to feel okay. Even the people I'm going to have to beat." },
    ] },
    { id: 'nx.n6', when: { voice: 'theatrical' }, turns: [
      { beat: "{a} pauses at the end of the ride, one hand raised, waiting for applause." },
      { by: 'h', say: "Any time now." },
      { by: 'a', say: "You have to let the moment breathe!" },
      { by: 'h', say: "The moment is breathing. The boat is leaving." },
    ] },
    { id: 'nx.n7', when: { voice: 'theatrical' }, turns: [
      { by: 'a', say: "Hello, darlings! The star has arrived!" },
      { by: 'h', say: "There are no stars here. Only contestants." },
      { by: 'a', say: "We'll see about that." },
      { by: 'a', conf: "Every great story needs a lead. I'm just saving everybody the trouble of figuring out who it is." },
    ] },
    { id: 'nx.n8', when: { voice: 'anxious' }, turns: [
      { by: 'a', say: "Is it safe to step here? It looks wobbly." },
      { by: 'h', say: "It's fine. Mostly." },
      { by: 'a', say: "Mostly? What does mostly mean?" },
      { by: 'a', conf: "I've been nervous about this for six months. Now I'm here, and I'm nervous about different things." },
    ] },
    { id: 'nx.n9', when: { voice: 'anxious' }, turns: [
      { by: 'a', say: "Hi, sorry, hi... where do I stand?" },
      { by: 'h', say: "Anywhere." },
      { by: 'a', say: "That's the worst answer." },
    ] },
    { id: 'nx.n10', when: { voice: 'calm' }, turns: [
      { by: 'a', say: "Hey. Nice view." },
      { by: 'h', say: "You're not freaked out at all?" },
      { by: 'a', say: "Should I be?" },
      { by: 'h', say: "Yes." },
      { by: 'a', conf: "People panic in places like this and then they make bad decisions, and I don't plan on panicking." },
    ] },
    { id: 'nx.n11', when: { voice: 'competitive' }, turns: [
      { by: 'a', say: "How many challenges are there? Ballpark." },
      { by: 'h', say: "Lots." },
      { by: 'a', say: "Good. I plan to win most of them." },
      { by: 'a', conf: "I'm not here to make friends. I'm here to win. If I make friends along the way, great. They'll be losing to a friend." },
    ] },
    { id: 'nx.n12', when: { voice: 'competitive' }, turns: [
      { beat: "{a} looks over everyone already waiting, one at a time." },
      { by: 'h', say: "Sizing up the competition?" },
      { by: 'a', say: "Already done." },
    ] },
    { id: 'nx.n13', when: { voice: 'schemer' }, turns: [
      { by: 'a', say: "Hi, everyone! I'm so happy to be here!" },
      { by: 'h', say: "Really?" },
      { by: 'a', say: "Really." },
      { by: 'a', conf: "Rule one: be the person nobody's worried about. That starts right now." },
    ] },
    { id: 'nx.n14', when: { voice: 'cruel' }, turns: [
      { by: 'a', say: "Ugh. Who picked these people?" },
      { by: 'h', say: "Our producers." },
      { by: 'a', say: "Fire them." },
      { by: 'a', conf: "Half of them won't last a week. The other half won't last two." },
    ] },
    { id: 'nx.n15', when: { voice: 'chaotic' }, turns: [
      { by: 'a', say: "Okay, which one of these trees is climbable? Asking for me." },
      { by: 'h', say: "None of them. Don't climb the trees." },
      { by: 'a', say: "Too late." },
      { beat: "{a} is already halfway up one." },
    ] },
    { id: 'nx.n16', when: { voice: 'food' }, turns: [
      { by: 'a', say: "So what's the food situation?" },
      { by: 'h', say: "Bad." },
      { by: 'a', say: "How bad?" },
      { by: 'h', say: "Worse than that." },
      { by: 'a', conf: "I can survive anything as long as there's food. They told me there's food. I'm choosing to believe them." },
    ] },
    { id: 'nx.n17', when: { voice: 'ditzy' }, turns: [
      { by: 'a', say: "Hi! Is this the hotel?" },
      { by: 'h', say: "No." },
      { by: 'a', say: "Is the hotel nearby?" },
      { by: 'h', say: "There is no hotel." },
      { by: 'a', say: "...Oh." },
    ] },
    { id: 'nx.n18', when: { voice: 'nerdy' }, turns: [
      { by: 'a', say: "Fun fact: most of the plants here are probably poisonous." },
      { by: 'h', say: "That's not fun." },
      { by: 'a', say: "It's a little fun." },
      { by: 'a', conf: "I know a lot about survival. I've read eleven books. I've just never actually done any of it." },
    ] },
    { id: 'nx.n19', when: { voice: 'earnest' }, turns: [
      { by: 'a', say: "Thank you so much for picking me. Really." },
      { by: 'h', say: "Don't thank me yet." },
      { by: 'a', say: "I'll thank you now and later." },
      { by: 'a', conf: "I want to play this the right way. If I lose, I want to lose with my head up." },
    ] },
    { id: 'nx.n20', when: { voice: 'flirty' }, turns: [
      { by: 'a', say: "Hey there. So these are the people I'm stuck with?" },
      { by: 'h', say: "For weeks." },
      { by: 'a', say: "I can work with that." },
      { beat: "{a} winks at somebody waiting. Somebody looks away fast." },
    ] },
    { id: 'nx.n21', when: { voice: 'tough' }, turns: [
      { beat: "{a} throws {a.posAdj} bag down, not bothering to look for a spot." },
      { by: 'h', say: "Making yourself at home?" },
      { by: 'a', say: "I've slept in worse." },
      { by: 'a', conf: "Everybody here is going to complain about the cold and the food. I'm not. That's how I win." },
    ] },
    { id: 'nx.n22', when: { voice: 'bossy' }, turns: [
      { by: 'a', say: "Okay, who's in charge of the teams? Because I have notes." },
      { by: 'h', say: "I'm in charge." },
      { by: 'a', say: "Then I have notes for you." },
    ] },
    { id: 'nx.n23', when: { voice: 'emotional' }, turns: [
      { by: 'a', say: "I'm sorry, I just... I can't believe I'm actually here." },
      { by: 'h', say: "Are you crying already?" },
      { by: 'a', say: "Happy tears! These are happy tears!" },
    ] },
    { id: 'nx.n24', when: { voice: 'goofy' }, turns: [
      { by: 'a', say: "Is this the line for the roller coaster?" },
      { by: 'h', say: "There's no roller coaster." },
      { by: 'a', say: "Then what's the line for?" },
      { by: 'h', say: "There's no line. Just go stand over there." },
    ] },
    { id: 'nx.n25', when: { voice: 'proud' }, turns: [
      { by: 'a', say: "Don't worry. I'll try not to make it look too easy." },
      { by: 'h', say: "Confident." },
      { by: 'a', say: "Accurate." },
    ] },
    { id: 'nx.n26', when: { voice: 'blunt' }, turns: [
      { by: 'h', say: "Welcome! What do you think?" },
      { by: 'a', say: "Honestly? It smells." },
      { by: 'h', say: "That's the lake." },
      { by: 'a', say: "Then the lake smells." },
    ] },
    { id: 'nx.n27', when: { age: 'teen' }, turns: [
      { by: 'a', say: "Wait, is this actually it? This is where we live?" },
      { by: 'h', say: "This is it." },
      { by: 'a', say: "My mom is going to lose it when she sees this." },
    ] },
    { id: 'nx.n28', when: { age: 'older' }, turns: [
      { by: 'a', say: "Hello, everyone. I think I've got a few years on most of you." },
      { by: 'h', say: "Just a few." },
      { by: 'a', say: "Don't worry, I'll keep up. And I'll be in bed by nine." },
      { by: 'a', conf: "They're all looking at me like I'm somebody's parent, which is good, because parents always know when you're lying." },
    ] },
    { id: 'nx.n29', when: { age: 'thirties' }, turns: [
      { by: 'a', say: "Hi, okay, where's the coffee?" },
      { by: 'h', say: "There's no coffee." },
      { by: 'a', say: "Then I'm going home." },
      { by: 'h', say: "Not until somebody votes you out." },
    ] },
    { id: 'nx.n30', when: { home: true }, turns: [
      { by: 'h', say: "So, {a}, all the way from {home}. Ready for something a little different?" },
      { by: 'a', say: "Different is one word for it." },
      { by: 'a', conf: "Back in {home}, nobody thought I'd make it on a show like this. I'm going to prove every one of them wrong." },
    ] },
    { id: 'nx.n31', when: { job: true }, turns: [
      { by: 'h', say: "So, {a}. It says here you're a {job}." },
      { by: 'a', say: "That's right." },
      { by: 'h', say: "Does that help out here?" },
      { by: 'a', say: "We're about to find out." },
    ] },
    { id: 'nx.n32', when: { strong: true, voice: ['tough', 'competitive', 'proud'] }, turns: [
      { beat: "{a} hops off carrying two bags. One of them isn't {a.posAdj}." },
      { by: 'h', say: "You know whose that is?" },
      { by: 'a', say: "No. It was in the way." },
    ] },
    { id: 'nx.n33', when: { brainy: true, voice: ['dry', 'nerdy', 'calm'] }, turns: [
      { by: 'a', say: "Interesting. The teams have to be even, so there are an even number of us." },
      { by: 'h', say: "Or there's a twist." },
      { by: 'a', say: "...Or there's a twist." },
      { by: 'a', conf: "I hate twists. Twists are where planning goes to die." },
    ] },
  ],

  'arrive.back.any': [
    { id: 'nx.b1', when: { voice: 'dry' }, turns: [
      { by: 'h', say: "Welcome back. Thrilled to be here?" },
      { by: 'a', say: "Thrilled. Can't you tell?" },
      { by: 'a', conf: "I said I'd never come back. Then they offered me another shot at the money. I'm not proud." },
    ] },
    { id: 'nx.b2', when: { voice: 'cruel' }, turns: [
      { by: 'a', say: "Oh good, new people, I love it when they don't know what I'm capable of." },
      { by: 'h', say: "They will soon." },
      { by: 'a', say: "Not soon enough." },
    ] },
    { id: 'nx.b3', when: { voice: 'goofy' }, turns: [
      { by: 'a', say: "I'm back! Did anybody find the sandwich I left here last time?" },
      { by: 'h', say: "That was years ago." },
      { by: 'a', say: "So that's a no?" },
    ] },
    { id: 'nx.b4', when: { voice: 'anxious' }, turns: [
      { by: 'a', say: "Oh no, it's exactly the same. Why did I say yes?" },
      { by: 'h', say: "Because we paid you." },
      { by: 'a', say: "Right. That's why." },
      { by: 'a', conf: "Last time I was so scared I couldn't think. This time I'm still scared. But I can think." },
    ] },
    { id: 'nx.b5', when: { past: ['final', 'early', 'blindsided', 'mid', 'none'], voice: 'competitive' }, turns: [
      { by: 'a', say: "I've been training since the day I went home." },
      { by: 'h', say: "That's a little intense." },
      { by: 'a', say: "That's the point." },
    ] },
    { id: 'nx.b6', when: { voice: 'warm' }, turns: [
      { by: 'a', say: "Oh, I missed this place, is that weird? That's weird." },
      { by: 'h', say: "It's very weird." },
      { by: 'a', conf: "I made real friends here last time. I want to do that again. And maybe, this time, also win." },
    ] },
    { id: 'nx.b7', when: { past: ['early', 'none'], voice: 'theatrical' }, turns: [
      { by: 'a', say: "The legend returns!" },
      { by: 'h', say: "You went home pretty early." },
      { by: 'a', say: "Legends are misunderstood!" },
    ] },
    { id: 'nx.b8', when: { voice: 'schemer' }, turns: [
      { by: 'a', say: "Hi, everyone, don't worry about me, I'm just happy to be back." },
      { by: 'a', conf: "The new people have seen me play. They think they know how I'll play this time. That's my favourite kind of mistake." },
    ] },
    { id: 'nx.b9', when: { age: 'older' }, turns: [
      { by: 'h', say: "Look at you, still standing." },
      { by: 'a', say: "Barely. My knees have opinions about this." },
      { by: 'a', conf: "These kids think the old one is the easy vote. They thought that last time too." },
    ] },
  ],

  // ── a first hello on the dock, in the tone the two voices make ──
  'arrive.meet.greet.flirt': [
    { id: 'nx.gf1', turns: [
      { by: 'b', say: "Well, hi." },
      { by: 'a', say: "Hi yourself." },
      O('c', "Oh, here we go."),
      { by: 'b', say: "I'm {b}. In case you need someone to stand next to." },
      { by: 'a', say: "I might." },
      { by: 'a', conf: "I've been here thirty seconds and somebody is already flirting with me. Good start." },
    ] },
    { id: 'nx.gf2', turns: [
      { beat: "{a} walks past {b} and they both look back at the same moment." },
      { by: 'b', say: "Do I know you?" },
      { by: 'a', say: "Not yet." },
      O('c', "Wow. Day one."),
    ] },
  ],
  'arrive.meet.greet.snark': [
    { id: 'nx.gs1', turns: [
      { by: 'b', say: "Nice bag. It's very... practical." },
      { by: 'a', say: "Nice face. It's very... there." },
      O('c', "Okay, okay. It's not even lunch."),
      { by: 'b', say: "I think we're going to get along." },
      { by: 'a', say: "I really doubt it." },
    ] },
    { id: 'nx.gs2', turns: [
      { by: 'a', say: "So this is everybody?" },
      { by: 'b', say: "This is everybody so far. Don't get excited." },
      { by: 'a', say: "I wasn't going to." },
      { by: 'b', conf: "Finally. Someone else who isn't pretending to love this." },
    ] },
    { id: 'nx.gs3', turns: [
      { by: 'b', say: "Let me guess. You're here to 'make friends'." },
      { by: 'a', say: "Let me guess. You're here to make enemies." },
      { by: 'b', say: "I'm here to make money." },
      { by: 'a', say: "Same. Great. So don't talk to me." },
    ] },
  ],
  'arrive.meet.greet.awkward': [
    { id: 'nx.ga1', turns: [
      { by: 'a', say: "Hi, um... is this where we stand?" },
      { by: 'b', say: "I think so? Nobody told me either." },
      { by: 'a', say: "Okay, cool, I'll just stand here then." },
      O('c', "You can stand by me. I don't bite."),
      { by: 'a', conf: "My first conversation here and I asked where to stand. Great, very cool." },
    ] },
    { id: 'nx.ga2', turns: [
      { beat: "{a} puts out a hand to shake. {b} goes in for a hug. It's a mess." },
      { by: 'b', say: "Sorry, sorry, I'm a hugger!" },
      { by: 'a', say: "I'm a... hand person." },
      O('c', "That was painful to watch."),
    ] },
  ],
  'arrive.meet.greet.hype': [
    { id: 'nx.gh1', turns: [
      { by: 'b', say: "Yes! Finally, somebody with energy!" },
      { by: 'a', say: "You know it!" },
      { beat: "They high-five so hard it echoes." },
      O('c', "Please don't do that again."),
      { by: 'b', say: "We're doing it again." },
    ] },
    { id: 'nx.gh2', turns: [
      { by: 'a', say: "Hey, hey, hey! What's up, everybody?" },
      { by: 'b', say: "There they are! Now it's a party!" },
      O('c', "It was not a party before. I can confirm."),
      { by: 'a', conf: "First impression: these people are fun. Second impression: some of these people are going to be a problem." },
    ] },
  ],
  'arrive.meet.greet.size': [
    { id: 'nx.gz1', turns: [
      { by: 'b', say: "So you're the competition." },
      { by: 'a', say: "One of them." },
      { by: 'b', say: "We'll see." },
      { by: 'a', say: "We will." },
      O('c', "Can you two maybe not do this before the teams are even picked?"),
      { by: 'b', conf: "{a} looks strong, and strong people go home early here, just saying." },
    ] },
    { id: 'nx.gz2', turns: [
      { beat: "{a} and {b} end up standing side by side, arms folded, both pretending not to look." },
      { by: 'a', say: "You work out?" },
      { by: 'b', say: "Every day. You?" },
      { by: 'a', say: "Twice a day." },
      { by: 'b', say: "...Cool." },
    ] },
  ],
  'arrive.meet.greet.friendly': [
    { id: 'nx.gr1', turns: [
      { by: 'b', say: "Hey, I'm {b}! Welcome to the worst place on Earth." },
      { by: 'a', say: "Ha! I'm {a}, and come on, it can't be that bad." },
      { by: 'b', say: "Oh, it's that bad." },
      O('c', "It's worse. I've been here twenty minutes."),
      { by: 'a', conf: "{b} seems nice, like actually nice, not fake nice, so I'll take it." },
    ] },
    { id: 'nx.gr2', turns: [
      { by: 'b', say: "Need a hand with that?" },
      { by: 'a', say: "Oh, thank you! It's heavier than it looks." },
      { by: 'b', say: "Everything here is heavier than it looks." },
      O('c', "Including the food."),
      { by: 'b', conf: "First person I've helped here. I hope that counts for something later." },
    ] },
    { id: 'nx.gr3', turns: [
      { by: 'a', say: "Hi! Is everybody as nervous as I am?" },
      { by: 'b', say: "More. Way more." },
      O('c', "I threw up on the boat."),
      { by: 'a', say: "Okay, that makes me feel better." },
    ] },
  ],
  'arrive.meet.greet.plain': [
    { id: 'nx.gp1', turns: [
      { by: 'b', say: "Hey." },
      { by: 'a', say: "Hey. I'm {a}." },
      { by: 'b', say: "{b}." },
      O('c', "And I'm {c}, since nobody asked."),
      { by: 'a', say: "Nice to meet you. All of you." },
    ] },
    { id: 'nx.gp2', turns: [
      { by: 'a', say: "So what's everybody's deal?" },
      { by: 'b', say: "Same as yours. Here to win." },
      O('c', "Here to not embarrass myself. Low bar."),
      { by: 'a', say: "That's a good bar." },
    ] },
    { id: 'nx.gp3', turns: [
      { by: 'b', say: "How was the ride?" },
      { by: 'a', say: "Long, bumpy, and smelly." },
      { by: 'b', say: "Same. Welcome." },
    ] },
  ],

  // ── the people waiting, between arrivals ──
  'arrive.wait.any': [
    { id: 'nx.w1', turns: [
      { beat: "While everyone watches {latest} settle in, {a}, {b} and {c} talk under their breath." },
      { by: 'a', say: "Okay, first impressions. {latest}?" },
      { by: 'b', say: "Strong. Maybe too strong." },
      { by: 'c', say: "Nice. Maybe too nice." },
      O('d', "Loud. Definitely too loud."),
      { by: 'a', say: "So we've got nothing." },
      { by: 'c', conf: "We've known each other for ten minutes and we're already ranking people. This show does something to you." },
    ] },
    { id: 'nx.w2', turns: [
      { by: 'b', say: "How many more are there?" },
      { by: 'a', say: "Feels like a hundred." },
      { by: 'c', say: "My feet hurt. Why are we standing?" },
      O('d', "Because there's nowhere to sit."),
      { by: 'b', say: "I'm sitting." },
      { beat: "{b} sits down right there. After a second, so do the others." },
    ] },
    { id: 'nx.w3', turns: [
      { by: 'c', say: "Did anyone else notice {latest} didn't say hi to anybody?" },
      { by: 'a', say: "Maybe {latest} is just nervous." },
      { by: 'b', say: "Or maybe {latest} is already playing." },
      O('d', "It's day one. Nobody's playing yet."),
      { by: 'c', say: "Somebody's always playing." },
      { by: 'b', conf: "Everybody here is watching everybody, including me. Especially me." },
    ] },
    { id: 'nx.w4', turns: [
      { by: 'a', say: "Quick. Who do we think wins this whole thing?" },
      { by: 'b', say: "Not {latest}." },
      { by: 'c', say: "Why not?" },
      { by: 'b', say: "Just a feeling." },
      O('d', "My money's on whoever hasn't shown up yet."),
      { by: 'a', conf: "The first rule of this place is never say who you think wins, and everybody just did, so that's good to know." },
    ] },
    { id: 'nx.w5', turns: [
      { by: 'b', say: "I'm going to forget everybody's names." },
      { by: 'a', say: "Just remember who's nice." },
      { by: 'c', say: "And who isn't." },
      O('d', "That's a shorter list."),
      { by: 'b', say: "Is it? Already?" },
    ] },
    { id: 'nx.w6', turns: [
      { beat: "The next ride is taking forever. {a}, {b} and {c} have run out of things to look at." },
      { by: 'a', say: "So... where's everybody from?" },
      { by: 'b', say: "Here and there." },
      { by: 'c', say: "Mostly there." },
      O('d', "That's not an answer."),
      { by: 'b', say: "It's a day-one answer." },
      { by: 'c', conf: "Nobody's giving anything away yet, not even where they're from, so this group is going to be fun." },
    ] },
  ],
};
