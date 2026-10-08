// ══════════════════════════════════════════════════════════════════════
// td/script/lines/drama2.js — breakdowns, explosions, apologies, enemies, paranoia
// ══════════════════════════════════════════════════════════════════════
//
// drama.meltdown.<total|crack|rare> — {a} falls apart in front of the camp (band: temper).
// drama.explode.<erupt|snap|crack> — {a} unloads on {b}.
// drama.sorry.<fight|meltdown|bomb|other> — the episode after, {a} apologises to {b}
//   for what {a} did ('fight': {b} was the one {a} fought; 'meltdown', 'bomb': {a}'s
//   outburst at camp; 'other': the rift just needs mending).
// drama.mess.<bad|good> — the hosted camp's mess hall (its own setting only: these lines
//   may name the mess hall, the trays and Chef).
// drama.nemesis.any — {a} and {b} hate each other, and the whole camp knows it.
// drama.paranoia.<bold|quiet> — {a} turns on {b}, {a}'s closest ally, for nothing.
//   'bold': to {b}'s face. 'quiet': {a} tells {b} (someone else) that {target} is playing
//   both sides; {target} is not in the scene.
// Ids: 'd2.'.

const MELT_TOTAL = [
  { id: 'd2.mt1', turns: [
    { beat: '{a} kicks the water bucket across camp, then the firewood, then sits down hard in the dirt.' },
    { by: 'a', say: "I can't do this! I can't do ANY of this!" },
    { beat: 'Nobody moves. Nobody knows what to do.' },
    { by: 'a', conf: "I don't even know what set me off. Everything. Everything set me off." },
  ] },
  { id: 'd2.mt2', turns: [
    { by: 'a', say: "Everybody just STOP LOOKING AT ME!" },
    { beat: 'Everybody looks away. That somehow makes it worse.' },
    { by: 'a', say: "Now you're IGNORING me?!" },
    { by: 'a', conf: "Yeah. That happened. In front of everyone. Great." },
  ] },
  { id: 'd2.mt3', when: { register: 'fiery' }, turns: [
    { beat: '{a} is screaming at the sky. Nobody is sure who or what it is aimed at.' },
    { by: 'a', say: "WHY IS EVERYTHING ALWAYS WET?!" },
    { by: 'a', conf: "I broke. Loudly. It was a long time coming." },
  ] },
  { id: 'd2.mt4', turns: [
    { beat: "{a} throws {a.posAdj} bowl, misses everyone, and storms off into the trees." },
    { by: 'a', conf: "No sleep, no food, no friends. Something had to give. It was me." },
  ] },
  { id: 'd2.mt5', when: { age: 'teen' }, turns: [
    { by: 'a', say: "I want to go HOME! I want my bed and my room and I want to GO HOME!" },
    { beat: 'The camp goes very quiet.' },
    { by: 'a', conf: "I'm embarrassed. I'm also still a little bit right." },
  ] },
  { id: 'd2.mt6', turns: [
    { by: 'a', say: "Fine! FINE! Vote me out! See if I care!" },
    { beat: '{a} clearly cares a great deal.' },
    { by: 'a', conf: "I didn't mean it. Please don't vote me out." },
  ] },
];
const MELT_CRACK = [
  { id: 'd2.mc1', turns: [
    { beat: "{a} has been holding it together all day. Then somebody asks if {a} is okay." },
    { by: 'a', say: "I'm— no. No, I'm not okay." },
    { beat: '{a} walks off before anyone sees {a.posAdj} face.' },
    { by: 'a', conf: "One question. That's all it took. The whole thing came down." },
  ] },
  { id: 'd2.mc2', turns: [
    { by: 'a', say: "Can everybody just give me a minute? A real minute?" },
    { beat: '{a} sits by the water with {a.posAdj} head in {a.posAdj} hands.' },
    { by: 'a', conf: "The pressure out here gets into you. Today it got all the way in." },
  ] },
  { id: 'd2.mc3', turns: [
    { beat: '{a} snaps at the fire for not lighting, then at {a.ref} for snapping.' },
    { by: 'a', say: "Stupid. Stupid, stupid, stupid." },
    { by: 'a', conf: "Everybody saw me lose it. I hate that they saw it." },
  ] },
  { id: 'd2.mc4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Nobody here takes anything seriously, and I'm sick of it!" },
    { beat: '{a} punches a tree. Then holds {a.posAdj} hand, wincing.' },
    { by: 'a', conf: "The tree won. Of course the tree won." },
  ] },
  { id: 'd2.mc5', turns: [
    { beat: "{a}'s voice keeps getting higher until it cracks completely." },
    { by: 'a', say: "I'm fine! I'm totally— I'm not fine." },
    { by: 'a', conf: "I didn't cry. I absolutely cried." },
  ] },
  { id: 'd2.mc6', when: { register: 'schemer' }, turns: [
    { beat: "{a}'s careful act slips in the middle of dinner. Just for a second, everyone sees how scared {a} is." },
    { by: 'a', conf: "Nobody's supposed to see the cracks. Today they saw all of them." },
  ] },
];
const MELT_RARE = [
  { id: 'd2.mr1', turns: [
    { beat: '{a}, who never loses it, very quietly puts down the cup in {a.posAdj} hand and walks away from the group.' },
    { by: 'a', conf: "I don't do this. I don't break. Today I came really close." },
  ] },
  { id: 'd2.mr2', turns: [
    { by: 'a', say: "Sorry. Give me a second." },
    { beat: '{a} takes a long, shaky breath. Everyone pretends not to notice.' },
    { by: 'a', conf: "Usually I'm the calm one. That's what scared everybody." },
  ] },
  { id: 'd2.mr3', when: { calm: true }, turns: [
    { beat: "{a}'s hands are shaking. That has never happened before." },
    { by: 'a', conf: "I keep it together for everyone. Nobody keeps it together for me." },
  ] },
  { id: 'd2.mr4', turns: [
    { beat: '{a} laughs at a joke. Then keeps laughing, a little too long, until it turns into something else.' },
    { by: 'a', conf: "I didn't know I was that tired until I was crying in front of everybody." },
  ] },
  { id: 'd2.mr5', turns: [
    { by: 'a', say: "I'm going for a walk. Don't follow me." },
    { beat: 'Everyone exchanges looks. {a} never says that.' },
    { by: 'a', conf: "I just needed ten minutes where nobody needed anything from me." },
  ] },
  { id: 'd2.mr6', when: { age: 'older' }, turns: [
    { beat: '{a} sits apart from everyone and rubs {a.posAdj} eyes for a long time.' },
    { by: 'a', conf: "I've held it together through worse. I don't know why today was the day. It just was." },
  ] },
];
const EXPLODE_ERUPT = [
  { id: 'd2.ee1', turns: [
    { by: 'a', say: "You! Yes, YOU! I'm done with you!" },
    { by: 'b', say: "What did I do?!" },
    { by: 'a', say: "You EXIST in my general direction!" },
    { by: 'b', conf: "I was just standing there. That was apparently enough." },
  ] },
  { id: 'd2.ee2', turns: [
    { beat: '{b} asks {a} to pass the water. {a} throws the whole cup.' },
    { by: 'b', say: "Seriously?!" },
    { by: 'a', say: "You wanted water! THERE'S your water!" },
    { by: 'b', conf: "The camp took two steps back. Nobody wants to be next." },
  ] },
  { id: 'd2.ee3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "One more word. I dare you. ONE MORE WORD." },
    { by: 'b', say: "Word." },
    { beat: '{a} has to be physically walked away by two people.' },
  ] },
  { id: 'd2.ee4', turns: [
    { by: 'a', say: "I'm sick of your face, I'm sick of your voice, I'm sick of your everything!" },
    { by: 'b', say: "Cool. Feel better?" },
    { by: 'a', say: "NO!" },
    { by: 'b', conf: "{a} needs a vacation. From me, apparently." },
  ] },
  { id: 'd2.ee5', turns: [
    { beat: '{a} goes off at {b} so fast that nobody even sees what started it.' },
    { by: 'b', say: "Okay! Okay! I'll move!" },
    { by: 'a', conf: "I'll feel bad later. Right now I don't." },
  ] },
  { id: 'd2.ee6', when: { strong: true }, turns: [
    { beat: "{a} snaps a branch in half right next to {b}'s head." },
    { by: 'a', say: "Next time, it's not the branch." },
    { by: 'b', conf: "That's a threat. I'm putting it on record. That was a threat." },
  ] },
];
const EXPLODE_SNAP = [
  { id: 'd2.es1', turns: [
    { by: 'b', say: "You've been a nightmare all day." },
    { by: 'a', say: "And you've been a nightmare all GAME." },
    { beat: 'The words land like a slap. {a} does not take them back.' },
  ] },
  { id: 'd2.es2', turns: [
    { by: 'a', say: "You know what nobody wants to tell you? Nobody likes you." },
    { by: 'b', say: "Wow." },
    { by: 'a', say: "Somebody had to say it." },
    { by: 'b', conf: "Nobody had to say it. {a} just wanted to." },
  ] },
  { id: 'd2.es3', turns: [
    { beat: '{a} gets right in {b}\'s face.' },
    { by: 'a', say: "Say it again. Go on." },
    { beat: "{b} doesn't say anything. That might be worse." },
    { by: 'a', conf: "{b} backed down. I won. So why do I feel worse?" },
  ] },
  { id: 'd2.es4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You're the weakest player here and everyone's too polite to say it." },
    { by: 'b', say: "And you're the meanest." },
    { by: 'a', say: "Mean isn't a strategy. Weak is a target." },
    { by: 'b', conf: "{a} lost it and said what {a} really thinks. Now I know." },
  ] },
  { id: 'd2.es5', turns: [
    { by: 'a', say: "Stop. Talking. To me." },
    { by: 'b', say: "I was talking to everyone." },
    { by: 'a', say: "Then stop talking to everyone!" },
    { by: 'b', conf: "{a} has been one bad moment away from this for days." },
  ] },
  { id: 'd2.es6', when: { gap: 'younger' }, turns: [
    { by: 'b', say: "Calm down, kid." },
    { by: 'a', say: "Don't you DARE call me kid!" },
    { by: 'b', say: "Then stop acting like one." },
    { by: 'a', conf: "{b} knew exactly what button to push. And pushed it." },
  ] },
];
const EXPLODE_CRACK = [
  { id: 'd2.ec1', turns: [
    { by: 'a', say: "Can you NOT do that right now?" },
    { by: 'b', say: "Do what?" },
    { by: 'a', say: "Breathe so loud!" },
    { by: 'b', conf: "{a} is normally so chill. Something is very wrong today." },
  ] },
  { id: 'd2.ec2', turns: [
    { beat: "{a}'s usual calm slips, and it all comes out on {b}." },
    { by: 'a', say: "You never listen! You never, ever listen!" },
    { by: 'b', say: "Whoa. Okay." },
    { by: 'a', conf: "It was short. It was loud. It was aimed at the wrong person. I know." },
  ] },
  { id: 'd2.ec3', turns: [
    { by: 'b', say: "Hey, you okay? You seem off." },
    { by: 'a', say: "I'm FINE. Stop asking!" },
    { by: 'b', conf: "Not fine. Very much not fine." },
  ] },
  { id: 'd2.ec4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Can you just leave me alone for five minutes? Please?" },
    { by: 'b', say: "Sure. Sorry." },
    { by: 'a', conf: "I snapped at {b}. {b} didn't deserve it. I'll fix it. Just not right now." },
  ] },
  { id: 'd2.ec5', turns: [
    { by: 'a', say: "This is exactly why nobody trusts you." },
    { beat: 'It comes out sharper than {a} meant it to. {b} goes quiet.' },
    { by: 'a', conf: "I meant it. I just didn't mean to say it." },
  ] },
  { id: 'd2.ec6', turns: [
    { beat: '{a} drops the firewood at {b}\'s feet with a crash.' },
    { by: 'a', say: "Your turn. Your turn forever." },
    { by: 'b', conf: "One bad day and {a} turns into somebody I've never met." },
  ] },
];

// ── the morning after ─────────────────────────────────────────────────
const SORRY_FIGHT = [
  { id: 'd2.sf1', turns: [
    { by: 'a', say: "About yesterday. The fight. I was out of line." },
    { by: 'b', say: "Yeah. You were." },
    { by: 'a', say: "I know. I'm sorry." },
    { beat: '{b} nods slowly.' },
    { by: 'b', conf: "Doesn't fix it. But the wall came down a little." },
  ] },
  { id: 'd2.sf2', turns: [
    { beat: '{a} finds {b} before anyone else is up.' },
    { by: 'a', say: "I'm not going to make excuses. I blew up at you. I'm sorry." },
    { by: 'b', say: "Thanks for saying it." },
    { by: 'a', conf: "Hardest sentence I've said all game. Easier than another day of not talking." },
  ] },
  { id: 'd2.sf3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Look. I've got a temper. You know that. Yesterday it got the better of me." },
    { by: 'b', say: "It got the better of everyone near you." },
    { by: 'a', say: "Fair. I'm sorry." },
    { by: 'b', conf: "{a} apologising is rarer than a good meal out here. I'll take it." },
  ] },
  { id: 'd2.sf4', turns: [
    { by: 'a', say: "Can we sit for a second?" },
    { beat: 'They sit by the fire, right where it all started.' },
    { by: 'a', say: "I regret how that went. All of it." },
    { by: 'b', say: "Me too, kind of." },
  ] },
  { id: 'd2.sf5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll be the bigger person. I'm sorry about the fight." },
    { by: 'b', say: "Being the bigger person doesn't count if you say it out loud." },
    { by: 'a', say: "Fine. I'm sorry. Smaller person sorry." },
    { by: 'b', conf: "Half an apology from {a} is worth a full one from most people." },
  ] },
  { id: 'd2.sf6', turns: [
    { by: 'a', say: "I keep thinking about what I said to you." },
    { by: 'b', say: "So do I." },
    { by: 'a', say: "I'm sorry. I didn't mean it." },
    { by: 'b', say: "You meant some of it." },
    { by: 'a', say: "I didn't mean it that loud." },
  ] },
];
const SORRY_MELTDOWN = [
  { id: 'd2.sm1', turns: [
    { by: 'a', say: "Hey. About yesterday. That wasn't about you. I just lost it." },
    { by: 'b', say: "I know. It's okay." },
    { by: 'a', conf: "I'm embarrassed. Saying it out loud to {b} helped a little." },
  ] },
  { id: 'd2.sm2', turns: [
    { by: 'a', say: "Sorry you had to see me like that." },
    { by: 'b', say: "We've all been there." },
    { by: 'a', say: "Not that loudly." },
    { by: 'b', say: "No. Not that loudly." },
  ] },
  { id: 'd2.sm3', turns: [
    { beat: '{a} shows up quieter today: first to the water, first to the fire, careful with everyone.' },
    { by: 'b', say: "Feeling better?" },
    { by: 'a', say: "Getting there. Sorry about yesterday." },
    { by: 'b', conf: "{a} didn't make a big speech. Just showed up different. That counts." },
  ] },
  { id: 'd2.sm4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "I don't lose it. I lost it. Sorry." },
    { by: 'b', say: "You're human." },
    { by: 'a', say: "Don't tell anyone." },
  ] },
  { id: 'd2.sm5', turns: [
    { by: 'a', say: "The pressure got to me. I'm not proud of it." },
    { by: 'b', say: "You don't have to be proud of it. Just be okay." },
    { by: 'a', conf: "{b} was nicer about it than I would've been." },
  ] },
  { id: 'd2.sm6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm so sorry about yesterday. I was awful." },
    { by: 'b', say: "You were sad. That's different." },
    { beat: '{a} hugs {b}, a little too hard.' },
  ] },
];
const SORRY_BOMB = [
  { id: 'd2.sb1', turns: [
    { by: 'a', say: "I ran my mouth yesterday. I'm sorry." },
    { by: 'b', say: "You did. A lot." },
    { by: 'a', say: "I know. I heard myself. Too late." },
    { by: 'b', conf: "Apology accepted. Memory not erased." },
  ] },
  { id: 'd2.sb2', turns: [
    { by: 'a', say: "What I said at the fire. That came out wrong." },
    { by: 'b', say: "How was it supposed to come out?" },
    { by: 'a', say: "Not at all. It wasn't supposed to come out at all." },
  ] },
  { id: 'd2.sb3', turns: [
    { beat: '{a} is careful with every word today. Every single one.' },
    { by: 'a', say: "I went too far yesterday. I get that now." },
    { by: 'b', conf: "{a} is walking on eggshells. Good. Yesterday {a} was walking on everybody." },
  ] },
  { id: 'd2.sb4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I may have said some things yesterday that were true but unhelpful." },
    { by: 'b', say: "Is that an apology?" },
    { by: 'a', say: "It's the best I've got." },
    { by: 'b', conf: "I'll take it. I won't trust it, but I'll take it." },
  ] },
  { id: 'd2.sb5', turns: [
    { by: 'a', say: "Can we pretend yesterday never happened?" },
    { by: 'b', say: "Nope." },
    { by: 'a', say: "Can we pretend it happened less?" },
    { by: 'b', say: "...Maybe." },
  ] },
  { id: 'd2.sb6', turns: [
    { by: 'a', say: "I'm sorry. Really. I was trying to be honest and I was just mean." },
    { by: 'b', say: "There's a difference." },
    { by: 'a', say: "I'm learning that." },
  ] },
];
const SORRY_OTHER = [
  { id: 'd2.so1', turns: [
    { by: 'a', say: "Hey. I think we got off on the wrong foot." },
    { by: 'b', say: "Which foot?" },
    { by: 'a', say: "All of them. I'm sorry." },
    { by: 'b', conf: "{a} reached out first. That counts for something." },
  ] },
  { id: 'd2.so2', turns: [
    { beat: '{a} finds {b} before anyone else is up. The conversation is short.' },
    { by: 'a', say: "I've been a jerk to you. I'd like to stop." },
    { by: 'b', say: "I'd like that too." },
  ] },
  { id: 'd2.so3', turns: [
    { by: 'a', say: "Truce?" },
    { by: 'b', say: "Why now?" },
    { by: 'a', say: "Because I'm tired of fighting, and you're tired of fighting, and we're both still here." },
    { by: 'b', conf: "Fair point. Still here. Might as well stop being miserable about it." },
  ] },
  { id: 'd2.so4', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um. I'm sorry. For the thing." },
    { by: 'b', say: "Which thing?" },
    { by: 'a', say: "All the things." },
    { by: 'b', conf: "Cutest apology I've ever had. I can't stay mad." },
  ] },
  { id: 'd2.so5', turns: [
    { by: 'a', say: "Look, I don't want things to be weird between us." },
    { by: 'b', say: "They've been weird for days." },
    { by: 'a', say: "Then I don't want them to stay weird." },
  ] },
  { id: 'd2.so6', turns: [
    { beat: "{a} doesn't bring it up directly. {a} just shows up today more helpful, more present, quieter." },
    { by: 'b', conf: "No speech. Just different. I liked that better than sorry." },
  ] },
];

// ── the mess hall (hosted camp) ───────────────────────────────────────
const MESS_BAD = [
  { id: 'd2.mb1', turns: [
    { by: 'a', say: "Hey! Back of the line! I've been standing here ten minutes!" },
    { by: 'b', say: "I was here first. I went to get a spoon." },
    { by: 'a', say: "That's not how lines work!" },
    { beat: 'Chef watches from the counter, grinning, as the whole hall picks a side.' },
  ] },
  { id: 'd2.mb2', turns: [
    { by: 'a', say: "Did you just take two portions?" },
    { by: 'b', say: "It's gray goop. Nobody wants two portions." },
    { by: 'a', say: "Then why did you TAKE two?" },
    { by: 'b', conf: "We're fighting over food none of us can even eat. That's the mess hall for you." },
  ] },
  { id: 'd2.mb3', turns: [
    { beat: '{a} and {b} both grab the last tray that looks almost edible.' },
    { by: 'b', say: "Let go." },
    { by: 'a', say: "You let go." },
    { beat: 'The tray slips. The food hits the floor. Chef sighs very loudly.' },
  ] },
  { id: 'd2.mb4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You put your elbow in my food!" },
    { by: 'b', say: "It improved it." },
    { by: 'a', say: "THAT'S IT!" },
    { beat: 'A spoonful of gray goop flies across the table. The mess hall erupts.' },
  ] },
  { id: 'd2.mb5', turns: [
    { by: 'b', say: "Can you move down? You're taking up half the bench." },
    { by: 'a', say: "Can you eat quieter? You're taking up half the noise." },
    { by: 'b', conf: "I've had better dinners in a parking lot. With better company." },
  ] },
  { id: 'd2.mb6', turns: [
    { by: 'a', say: "Chef, {b} cut the line." },
    { beat: 'Chef shrugs and slops something onto both trays.' },
    { by: 'b', say: "Snitch." },
    { by: 'a', conf: "Was it petty? Yes. Did it feel great? Also yes." },
  ] },
];
const MESS_GOOD = [
  { id: 'd2.mg1', turns: [
    { by: 'a', say: "Saved you a seat. And the only thing on the menu that's not moving." },
    { by: 'b', say: "You're a hero." },
    { by: 'a', say: "I know." },
    { by: 'b', conf: "Out here, a saved seat and a safe meal is basically a friendship bracelet." },
  ] },
  { id: 'd2.mg2', turns: [
    { by: 'a', say: "On a scale of one to ten, how dead is this meatloaf?" },
    { by: 'b', say: "It's past ten. It's haunted." },
    { by: 'a', say: "It just moved." },
    { beat: 'They spend all of dinner roasting Chef\'s cooking, laughing so hard Chef glares at them.' },
  ] },
  { id: 'd2.mg3', turns: [
    { beat: "{a} notices {b} came up short at the counter and slides half a portion over without a word." },
    { by: 'b', say: "You don't have to—" },
    { by: 'a', say: "Eat." },
    { by: 'b', conf: "{a} didn't make a big deal out of it. I'm going to remember it." },
  ] },
  { id: 'd2.mg4', turns: [
    { by: 'a', say: "Trade you my mystery pudding for your mystery bread." },
    { by: 'b', say: "What's wrong with the pudding?" },
    { by: 'a', say: "Nobody knows. That's the mystery." },
    { by: 'b', say: "Deal." },
  ] },
  { id: 'd2.mg5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I snuck you an extra roll. Don't tell Chef." },
    { by: 'b', say: "You're going to get us both in trouble." },
    { by: 'a', say: "Worth it." },
  ] },
  { id: 'd2.mg6', turns: [
    { by: 'b', say: "Sit with me? The other table's arguing again." },
    { by: 'a', say: "Isn't every table arguing?" },
    { by: 'b', say: "This one's arguing quieter." },
    { by: 'a', conf: "Best table in the mess hall. Mostly because {b} is at it." },
  ] },
];

// ── enemies ───────────────────────────────────────────────────────────
const NEMESIS = [
  { id: 'd2.n1', turns: [
    { beat: '{b} sits down at the fire. {a} stands up and leaves without a word.' },
    { by: 'a', conf: "I won't sit near {b}. I won't eat near {b}. I won't breathe near {b} if I can help it." },
  ] },
  { id: 'd2.n2', turns: [
    { by: 'a', say: "Some people around here should really learn to keep their mouths shut." },
    { beat: "{a} doesn't look at {b}. Everyone else does." },
    { by: 'b', conf: "{a} said it to the whole camp. It was for me. Everyone knows it was for me." },
  ] },
  { id: 'd2.n3', turns: [
    { beat: '{a} and {b} end up on water duty together. They finish it without one single word.' },
    { by: 'b', conf: "We were weirdly efficient. Hate is a great motivator." },
  ] },
  { id: 'd2.n4', turns: [
    { by: 'b', conf: "I'll do whatever it takes to make sure {a} doesn't make it to the end. Whatever it takes." },
  ] },
  { id: 'd2.n5', turns: [
    { by: 'a', say: "Hey, everybody. Big news. I'm still here." },
    { by: 'b', say: "Unfortunately." },
    { by: 'a', say: "For you, sure." },
    { by: 'a', conf: "Every day I'm here is a bad day for {b}. That's my favourite part of the game." },
  ] },
  { id: 'd2.n6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Can somebody tell {b} to stop looking at me?" },
    { by: 'b', say: "Can somebody tell {a} the world doesn't revolve around {a.obj}?" },
    { beat: 'Nobody tells anybody anything. Everyone just leaves.' },
  ] },
  { id: 'd2.n7', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I don't say {b}'s name anymore. Not at camp, not in here. {b} is just \"that person\". Everybody knows exactly who I mean." },
  ] },
];
const PARANOIA_BOLD = [
  { id: 'd2.pb1', turns: [
    { beat: '{a} pulls {b} aside after the challenge.' },
    { by: 'a', say: "I know what you're doing." },
    { by: 'b', say: "What am I doing?" },
    { by: 'a', say: "Don't play dumb. You've been talking to the others." },
    { by: 'b', say: "I've been talking to everyone! That's called camp!" },
    { by: 'b', conf: "I've been loyal to {a} since day one. Day one. And this is what I get?" },
  ] },
  { id: 'd2.pb2', turns: [
    { by: 'a', say: "Just tell me the truth. Are you flipping on me?" },
    { by: 'b', say: "What? No! Where is this coming from?" },
    { by: 'a', say: "Everyone's acting weird. Including you." },
    { by: 'b', conf: "{a} needs me more than anyone here, and {a} just accused me of betrayal. I don't even know what to do with that." },
  ] },
  { id: 'd2.pb3', turns: [
    { beat: '{a} confronts {b} in front of half the camp.' },
    { by: 'a', say: "Why were you whispering with them by the water?" },
    { by: 'b', say: "We were looking for crabs!" },
    { by: 'a', say: "Crabs. Sure." },
    { by: 'b', conf: "We were literally looking for crabs." },
  ] },
  { id: 'd2.pb4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I KNEW it! I knew you'd turn on me!" },
    { by: 'b', say: "I haven't turned on anyone!" },
    { by: 'a', say: "Not YET!" },
    { by: 'b', conf: "{a} is fighting a battle that isn't happening. And now maybe it will." },
  ] },
  { id: 'd2.pb5', turns: [
    { by: 'a', say: "You said my name. Yesterday. I heard you." },
    { by: 'b', say: "I said your name because I was defending you!" },
    { by: 'a', say: "That's exactly what someone would say." },
    { by: 'b', conf: "There's no way to win this conversation. I tried every way." },
  ] },
  { id: 'd2.pb6', when: { sly: true }, turns: [
    { by: 'a', say: "Walk me through where you were all afternoon." },
    { by: 'b', say: "Are you serious? Are you timing me now?" },
    { by: 'a', say: "Humour me." },
    { by: 'b', conf: "{a} thinks too much. Today {a} thought {a.posAdj} way right out of our alliance." },
  ] },
];
const PARANOIA_QUIET = [
  { id: 'd2.pq1', turns: [
    { by: 'a', say: "Can I tell you something? Watch {target}. Something's off." },
    { by: 'b', say: "Off how?" },
    { by: 'a', say: "Just watch." },
    { by: 'b', conf: "I never noticed anything off about {target}. Now I can't stop noticing." },
  ] },
  { id: 'd2.pq2', turns: [
    { by: 'a', say: "Has {target} seemed weird to you lately?" },
    { by: 'b', say: "Not really." },
    { by: 'a', say: "Huh. Must just be me then." },
    { by: 'a', conf: "I didn't accuse anyone. I just asked a question. Questions spread." },
  ] },
  { id: 'd2.pq3', turns: [
    { by: 'a', say: "I think {target} is playing both sides." },
    { by: 'b', say: "{target}? Really? That doesn't sound like {target}." },
    { by: 'a', say: "That's what makes it so good." },
    { by: 'b', conf: "{a} was so sure. I'm not sure of anything now." },
  ] },
  { id: 'd2.pq4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Just between us, I'd keep an eye on {target}." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Call it a feeling." },
    { by: 'a', conf: "If I'm wrong, nothing happens. If I'm right, I saw it first." },
  ] },
  { id: 'd2.pq5', turns: [
    { by: 'b', say: "You've been weird about {target} all day." },
    { by: 'a', say: "Because {target} has been weird all day." },
    { by: 'b', say: "Or you have." },
    { by: 'b', conf: "Either {target} is a traitor or {a} is losing it. I genuinely don't know which." },
  ] },
  { id: 'd2.pq6', turns: [
    { by: 'a', say: "If {target} ever asks, I never said anything. But I'd be careful." },
    { by: 'b', say: "Careful of what?" },
    { by: 'a', say: "Just careful." },
    { by: 'b', conf: "{target} has been nothing but loyal. Try proving that out here." },
  ] },
];

export default {
  'drama.meltdown.total': MELT_TOTAL, 'drama.meltdown.crack': MELT_CRACK, 'drama.meltdown.rare': MELT_RARE,
  'drama.explode.erupt': EXPLODE_ERUPT, 'drama.explode.snap': EXPLODE_SNAP, 'drama.explode.crack': EXPLODE_CRACK,
  'drama.sorry.fight': SORRY_FIGHT, 'drama.sorry.meltdown': SORRY_MELTDOWN, 'drama.sorry.bomb': SORRY_BOMB, 'drama.sorry.other': SORRY_OTHER,
  'drama.mess.bad': MESS_BAD, 'drama.mess.good': MESS_GOOD,
  'drama.nemesis.any': NEMESIS, 'drama.paranoia.bold': PARANOIA_BOLD, 'drama.paranoia.quiet': PARANOIA_QUIET,
};

/** Data these scenes always carry. */
export const GUARANTEED = { 'drama.paranoia.quiet': ['target'] };
