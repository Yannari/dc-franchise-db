// ══════════════════════════════════════════════════════════════════════
// td/script/lines/romance2.js — love triangles and secret affairs, start to finish
// ══════════════════════════════════════════════════════════════════════
//
// romance.js decides each step (who is in it, how jealous, who gets caught, who tells,
// who gets chosen). The parts are named by role:
//
// romance.tri.<form>        {a} is caught between {b} and {c}: 'dual' (two showmances at
//                           once) or 'onesided' ({c} has fallen for {a}, who is with {b}).
// romance.tri.tension       {a} watches {b} (the one {a} is with) drift toward {c}.
// romance.tri.confront      {a} confronts {b} about {c}.
// romance.tri.escalate      {a} and {c} can't be in the same space; {b} is in the middle.
// romance.tri.exploit       {a} (outside it) plans to use {b} and {c}'s war over {target}.
// romance.tri.fight         {a} and {c} fight in public over {b}.
// romance.tri.ultimatum     {a} chooses {b} over {c}.
// romance.tri.reject-<villain|strategic|emotional>  {a} was not chosen by {b} (who chose {c}).
// romance.tri.faded         {a} quietly lets {c} go; {b} is still there.
// romance.tri.cut-<center|hand|vote>  the vote ended it: {target} is gone. 'center': {a} and
//                           {b} were fighting over {target}; 'hand': {a} wrote {target}'s name
//                           and {b} is left; 'vote': the others voted {target} out, {a} and
//                           {b} are left with each other.
// romance.tri.lonely        both people {a} was caught between are gone.
// romance.affair.form       {a} (with {target}) and {b} start something secret.
// romance.affair.hidden     {a} and {b} sneak around; {target} has no idea.
// romance.affair.noticed    {a} sees {b} and {c} together and realises.
// romance.affair.rumor      {a} tells {b}'s partner {c}... nothing yet; just hints around {c}.
// romance.affair.caught     {a} catches {b} and {c}.
// romance.affair.silent     {a} caught {b} and keeps quiet, for now, for a price.
// romance.affair.exposed    {a} tells {b} the truth about {c}.
// romance.affair.<stays|leaves>  {a} chooses {b} (the partner) or leaves for {c}.
// Ids: 'r2.'.

const FORM_DUAL = [
  { id: 'r2.fd1', turns: [
    { beat: '{a} spends the night whispering with {b} and the morning laughing with {c}.' },
    { by: 'b', conf: "I'm not blind. Neither is {c}. Neither of us has said anything yet." },
  ] },
  { id: 'r2.fd2', turns: [
    { by: 'c', say: "Where were you last night?" },
    { by: 'a', say: "Around." },
    { by: 'c', say: "Around {b}?" },
    { by: 'a', conf: "I didn't plan this. I like them both. That's not a plan. That's a disaster." },
  ] },
  { id: 'r2.fd3', turns: [
    { beat: '{b} and {c} both sit down next to {a} at the fire, one on each side. Nobody says a word.' },
    { by: 'a', conf: "I'm in so much trouble." },
  ] },
  { id: 'r2.fd4', when: { register: 'schemer' }, turns: [
    { beat: '{b} is on one side of the fire. {c} is on the other.' },
    { by: 'a', conf: "Two people think they're my person. Technically, they're both right. Technically, I'm a genius. Emotionally? A mess." },
  ] },
  { id: 'r2.fd5', turns: [
    { by: 'b', say: "So you and {c}, huh?" },
    { by: 'a', say: "What about me and {c}?" },
    { by: 'b', say: "Exactly. What about you and {c}?" },
    { by: 'b', conf: "The question isn't if this blows up. It's when." },
  ] },
  { id: 'r2.fd6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I really, really like {b}. And I really, really like {c}. I don't know how this happened. I'm a good person. I think." },
  ] },
];
const FORM_ONESIDED = [
  { id: 'r2.fo1', turns: [
    { beat: '{c} keeps finding reasons to be near {a}: carrying water, sitting close at the fire, volunteering for the same jobs.' },
    { by: 'b', conf: "{c} wouldn't call it a crush. I already have a word for it." },
  ] },
  { id: 'r2.fo2', turns: [
    { by: 'c', say: "You're really easy to talk to, you know that?" },
    { by: 'a', say: "Thanks. So are you." },
    { beat: '{b} is watching from across camp, jaw tight.' },
    { by: 'c', conf: "I know {a} is with {b}. I know. I'm not doing anything. I'm just… near." },
  ] },
  { id: 'r2.fo3', turns: [
    { beat: '{c} laughs at {a}\'s joke, way too hard.' },
    { by: 'b', say: "That wasn't that funny." },
    { by: 'c', say: "I thought it was." },
    { by: 'b', conf: "Nothing has happened. Nothing has to happen. I can see it from here." },
  ] },
  { id: 'r2.fo4', when: { register: 'schemer' }, turns: [
    { by: 'c', conf: "{a} and {b} look solid. Everybody looks solid until somebody new pays attention to them." },
  ] },
  { id: 'r2.fo5', turns: [
    { by: 'a', say: "{c} is just a friend." },
    { by: 'b', say: "{c} doesn't look at you like a friend." },
    { by: 'a', say: "How does {c} look at me?" },
    { by: 'b', say: "Like I do." },
  ] },
  { id: 'r2.fo6', turns: [
    { beat: '{b} is busy across camp, with no idea.' },
    { by: 'c', conf: "I didn't mean to fall for {a}. It's the worst timing. It's the worst person. It's happening anyway." },
  ] },
];
const TENSION = [
  { id: 'r2.t1', turns: [
    { beat: '{a} catches {b} and {c} sharing a coconut by the water. {a} says nothing.' },
    { by: 'a', conf: "That used to be our thing. Coconut by the water. Now it's their thing, apparently." },
  ] },
  { id: 'r2.t2', turns: [
    { beat: "At dinner, {a} sits right between {b} and {c}. On purpose." },
    { by: 'c', say: "Comfortable?" },
    { by: 'a', say: "Very." },
    { by: 'b', conf: "{a} has started guarding me like a parking space." },
  ] },
  { id: 'r2.t3', turns: [
    { by: 'b', say: "Want to collect firewood?" },
    { by: 'c', say: "I'll go!" },
    { by: 'a', say: "I'll go too." },
    { beat: 'The three of them collect firewood together in complete silence.' },
  ] },
  { id: 'r2.t4', turns: [
    { beat: '{c} makes {b} laugh, the kind of laugh that carries across camp. {a} hears it from the other side.' },
    { by: 'a', conf: "I used to be the one who made {b} laugh like that." },
  ] },
  { id: 'r2.t5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Why is {c} always around?" },
    { by: 'b', say: "We all live here." },
    { by: 'a', say: "{c} lives around YOU." },
  ] },
  { id: 'r2.t6', turns: [
    { by: 'a', conf: "{c} told {b} about home last night. The stuff I thought was just between us. It's not just between us anymore." },
  ] },
  { id: 'r2.t7', turns: [
    { beat: 'The sleeping spots have become a nightly negotiation. {a} wants to be next to {b}. So does {c}.' },
    { by: 'b', say: "I'll sleep in the middle. Again." },
    { by: 'a', conf: "{b} keeps the peace by sleeping between us. Every night. That's not peace. That's a border." },
  ] },
  { id: 'r2.t8', turns: [
    { by: 'a', say: "You and {c} have been spending a lot of time together." },
    { by: 'b', say: "We're on the same water run." },
    { by: 'a', say: "Every day?" },
    { by: 'b', conf: "{a} is counting. I can feel {a} counting." },
  ] },
  { id: 'r2.t9', turns: [
    { beat: '{a} builds a fishing spear alone. Usually {a} and {b} do that together. {b} is with {c}.' },
    { by: 'a', conf: "I didn't ask {b} to help. I wanted {b} to offer. {b} didn't." },
  ] },
  { id: 'r2.t10', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{c}, could you grab more water? You're so good at it." },
    { by: 'c', say: "Sure." },
    { beat: 'The second {c} is gone, {a} sits down next to {b}.' },
    { by: 'a', conf: "Divide and conquer. Works on votes. Works on crushes." },
  ] },
  { id: 'r2.t11', turns: [
    { by: 'c', say: "Morning, {b}! I saved you some breakfast." },
    { by: 'a', say: "I already got {b} breakfast." },
    { beat: '{b} ends up with two breakfasts and no appetite.' },
  ] },
  { id: 'r2.t12', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I don't want to be the jealous one. I'm not the jealous one. Why do I keep watching {b} and {c}, then?" },
  ] },
];
const CONFRONT = [
  { id: 'r2.cf1', turns: [
    { by: 'a', say: "What's going on with you and {c}?" },
    { by: 'b', say: "Nothing. We're friends." },
    { by: 'a', say: "You said that about us, once." },
    { by: 'b', conf: "I didn't have an answer. That was the answer." },
  ] },
  { id: 'r2.cf2', turns: [
    { by: 'a', say: "I'm not blind. I see how you look at {c}." },
    { by: 'b', say: "You're reading into things." },
    { by: 'a', say: "Then stop giving me things to read." },
  ] },
  { id: 'r2.cf3', turns: [
    { beat: '{c} is within earshot, pretending not to listen.' },
    { by: 'a', say: "Just tell me the truth. Please." },
    { by: 'b', say: "There's nothing to tell." },
    { beat: "{a}'s voice cracks." },
    { by: 'a', say: "I'm starting to feel like your backup plan." },
    { by: 'a', conf: "I wanted to believe {b}. I couldn't." },
  ] },
  { id: 'r2.cf4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Are you PLAYING me?!" },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "Why, so {c} doesn't hear?!" },
    { by: 'b', conf: "The whole camp heard. Including {c}." },
  ] },
  { id: 'r2.cf5', when: { calm: true }, turns: [
    { beat: '{c} is down by the water, out of earshot.' },
    { by: 'a', say: "I'm not going to yell. I deserve honesty. That's all." },
    { by: 'b', say: "Everything's fine. I promise." },
    { by: 'a', conf: "{b} said all the right things. {b}'s face said something else." },
  ] },
  { id: 'r2.cf6', turns: [
    { beat: '{c} is sitting across the fire.' },
    { beat: "{a} reaches for {b}'s hand at the fire. {b} hesitates. Just for a second." },
    { by: 'a', say: "Wow." },
    { by: 'a', conf: "One second. That's all it took for me to know." },
  ] },
];
const ESCALATE = [
  { id: 'r2.e1', turns: [
    { by: 'a', say: "Some people around here can't make up their minds." },
    { beat: '{b} flinches. {c} stares straight ahead.' },
    { by: 'b', conf: "I'm the reason this camp feels like a war zone. I know it. Everyone knows it." },
  ] },
  { id: 'r2.e2', turns: [
    { by: 'b', say: "Can we all just talk? The three of us?" },
    { by: 'a', say: "About what? You've made yourself pretty clear." },
    { by: 'c', say: "I'm not doing this." },
    { beat: 'Both of them walk away in opposite directions. {b} sits alone.' },
  ] },
  { id: 'r2.e3', turns: [
    { by: 'a', say: "{c} is fake. And only here for the game." },
    { by: 'c', say: "Say that to my face." },
    { by: 'a', say: "I just did." },
    { by: 'b', conf: "Every conversation is a minefield now. Fetching water is political." },
  ] },
  { id: 'r2.e4', turns: [
    { beat: '{c} finds {b} crying by the water.' },
    { by: 'c', say: "Is this about {a}?" },
    { beat: '{b} doesn\'t answer. {c} doesn\'t need {b.obj} to.' },
  ] },
  { id: 'r2.e5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Go sit with {c}. That's what you want anyway." },
    { by: 'b', say: "That's not fair." },
    { by: 'a', say: "None of this is fair." },
    { by: 'a', conf: "I'm making {b} choose by making {b} feel guilty. Is it mean? Yes. Will it work? Also yes." },
  ] },
  { id: 'r2.e6', turns: [
    { beat: '{a} and {c} refuse to look at each other during the whole challenge. {b} stands between them, miserable.' },
    { by: 'b', conf: "I can't breathe out here. Everything I do upsets somebody." },
  ] },
  { id: 'r2.e7', turns: [
    { by: 'a', say: "Pass the salt, {b}. Unless {c} needs it first." },
    { by: 'c', say: "Really?" },
    { by: 'a', say: "Just being polite." },
    { by: 'b', conf: "Even the salt is a fight now." },
  ] },
  { id: 'r2.e8', turns: [
    { beat: "{a} and {c} reach the fire at the same time and both stop, waiting for the other to sit somewhere else. Neither does." },
    { by: 'b', say: "There's room for everyone." },
    { by: 'a', say: "Is there?" },
  ] },
  { id: 'r2.e9', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Every time I turn around, there's {c}!" },
    { by: 'c', say: "Maybe stop turning around!" },
    { by: 'b', conf: "Two people I care about, and they can't share a camp. Or a sentence." },
  ] },
];
const EXPLOIT = [
  { id: 'r2.x1', turns: [
    { by: 'a', conf: "{b} and {c} are so busy fighting over {target} that nobody's watching me. I love a love triangle. It's free real estate." },
  ] },
  { id: 'r2.x2', turns: [
    { beat: '{b} and {c} are glaring at each other across the fire.' },
    { by: 'a', conf: "When this blows up, somebody gets burned. Burned people make desperate allies. I'll be right there with a bucket of water." },
  ] },
  { id: 'r2.x3', when: { register: 'schemer' }, turns: [
    { beat: '{a} drops a small comment to {b} about {c}. Then a small comment to {c} about {b}.' },
    { by: 'a', conf: "Just enough to keep it boiling. Never enough to get caught stirring." },
  ] },
  { id: 'r2.x4', turns: [
    { beat: "{b} and {c} haven't spoken all day." },
    { by: 'a', conf: "Three people, one mess, zero brain cells left for the game. That's three votes I might control." },
  ] },
  { id: 'r2.x5', turns: [
    { by: 'a', conf: "If {target} picks {c}, {b} will want revenge. Revenge needs numbers. I have numbers." },
  ] },
  { id: 'r2.x6', when: { register: 'cool' }, turns: [
    { beat: '{b} storms past {c} without a word.' },
    { by: 'a', conf: "I don't need to do anything. The triangle is doing my work for me. I'm just watching the clock." },
  ] },
];
const FIGHT = [
  { id: 'r2.f1', turns: [
    { by: 'a', say: "You've been moving in on {b} since day one!" },
    { by: 'c', say: "Maybe {b} likes being moved in on!" },
    { by: 'b', say: "Can you both STOP?!" },
    { beat: 'Half the camp scatters.' },
    { by: 'b', conf: "This is my fault. I know it's my fault." },
  ] },
  { id: 'r2.f2', turns: [
    { by: 'a', say: "You're a snake." },
    { by: 'c', say: "And you're delusional." },
    { by: 'b', say: "Guys, please—" },
    { by: 'a', say: "Stay out of it!" },
    { by: 'c', say: "Yeah, stay out of it!" },
  ] },
  { id: 'r2.f3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You don't deserve {b}!" },
    { beat: '{c} laughs. The kind of laugh that makes everything worse.' },
    { by: 'c', say: "And you do?" },
    { by: 'a', conf: "I wanted to throw {c} in the ocean. I settled for screaming. It was close." },
  ] },
  { id: 'r2.f4', turns: [
    { beat: 'It starts at the fire and spills out onto the sand. {a} and {c}, face to face, while {b} sits with {b.posAdj} head in {b.posAdj} hands.' },
    { by: 'c', say: "Just admit you're scared I'll win." },
    { by: 'a', say: "Win what? {b} isn't a prize!" },
    { by: 'b', conf: "That's the only thing either of them said that I agreed with." },
  ] },
  { id: 'r2.f5', turns: [
    { by: 'a', say: "Twenty minutes. We've been yelling for twenty minutes." },
    { by: 'c', say: "And I'll yell for twenty more." },
    { by: 'b', say: "Nobody's yelling anymore. Everybody go to bed." },
    { by: 'b', conf: "Worst fight of the season. About me. Great." },
  ] },
  { id: 'r2.f6', turns: [
    { by: 'c', say: "You're only mad because {b} smiles more around me." },
    { by: 'a', say: "Say that again." },
    { by: 'c', say: "{b} smiles more. Around. Me." },
    { beat: 'Someone has to physically step between them.' },
  ] },
];
const ULTIMATUM = [
  { id: 'r2.u1', turns: [
    { beat: '{a} sits {b} and {c} down at the fire.' },
    { by: 'a', say: "I can't keep doing this. I have to be honest. It's {b}." },
    { beat: "{b} lets out a breath. {c} doesn't move at all." },
    { by: 'a', conf: "Hardest conversation of my entire game. I did it anyway." },
  ] },
  { id: 'r2.u2', turns: [
    { by: 'a', say: "It's you. It's always been you." },
    { by: 'b', say: "Really?" },
    { by: 'a', say: "Really. Now I have to go tell {c}." },
    { by: 'a', conf: "The first conversation was easy. The second one wasn't." },
  ] },
  { id: 'r2.u3', turns: [
    { by: 'a', say: "I've made my decision." },
    { beat: "{b}'s face fills with relief. {c}'s face falls completely." },
    { by: 'c', conf: "I knew. I think I always knew. It still hurt to hear it." },
  ] },
  { id: 'r2.u4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "{c}, I'm so sorry. You didn't do anything wrong. I just… I choose {b}." },
    { by: 'c', say: "Okay." },
    { by: 'a', conf: "I hurt somebody I really care about today. On purpose. I feel sick." },
  ] },
  { id: 'r2.u5', turns: [
    { by: 'a', say: "I'm done going back and forth. {b}, if you'll still have me." },
    { by: 'b', say: "Took you long enough." },
    { beat: '{c} walks down to the water alone.' },
  ] },
  { id: 'r2.u6', when: { register: 'schemer' }, turns: [
    { beat: '{c} watches from the edge of the fire.' },
    { by: 'a', conf: "I chose {b}. Was it my heart or the numbers? Both. Mostly my heart. A little bit the numbers." },
  ] },
];
const REJECT_VILLAIN = [
  { id: 'r2.rv1', turns: [
    { beat: '{c} is standing right behind {b}.' },
    { by: 'a', say: "Fine. But don't think I'll forget this." },
    { by: 'b', say: "I'm sorry." },
    { by: 'a', say: "You will be." },
    { by: 'a', conf: "{b} just made the worst mistake of {b.posAdj} game. I'll make sure of it." },
  ] },
  { id: 'r2.rv2', turns: [
    { beat: '{c} is waiting a few steps away.' },
    { by: 'a', say: "You think I'm upset? I'm free now." },
    { by: 'b', say: "I didn't mean to—" },
    { by: 'a', say: "And you just lost the one person who was actually protecting you." },
  ] },
  { id: 'r2.rv3', turns: [
    { by: 'a', say: "Interesting choice." },
    { beat: '{a} walks away slowly, already counting.' },
    { by: 'a', conf: "{c} and {b}. Cute. Two names, side by side. Easy to write down together." },
  ] },
  { id: 'r2.rv4', turns: [
    { beat: '{b} and {c} walk off together.' },
    { by: 'a', conf: "Heartbroken? Me? I'm not heartbroken. I'm motivated." },
  ] },
  { id: 'r2.rv5', turns: [
    { beat: "{b} won't look at {a}." },
    { by: 'a', say: "Congratulations, {c}. Enjoy it." },
    { by: 'c', say: "Was that a threat?" },
    { by: 'a', say: "That was a congratulations. The threat comes later." },
  ] },
  { id: 'r2.rv6', when: { register: 'fiery' }, turns: [
    { beat: '{c} steps closer to {b}.' },
    { by: 'a', say: "You'll regret this! Both of you!" },
    { beat: '{a} storms off, kicking sand.' },
    { by: 'b', conf: "I was scared before. I'm more scared now." },
  ] },
];
const REJECT_STRATEGIC = [
  { id: 'r2.rs1', turns: [
    { beat: '{c} hovers a few steps behind {b}.' },
    { by: 'a', say: "I understand." },
    { by: 'b', say: "That's it?" },
    { by: 'a', say: "That's it." },
    { by: 'a', conf: "It stings. But a broken heart doesn't win a game. A plan does. I already have one." },
  ] },
  { id: 'r2.rs2', turns: [
    { beat: '{c} watches the whole thing.' },
    { by: 'a', say: "Game respects game." },
    { beat: '{a} shakes {b}\'s hand.' },
    { by: 'b', conf: "Most strategic handshake in the history of this game. I'm terrified." },
  ] },
  { id: 'r2.rs3', turns: [
    { beat: "{c} is already holding {b}'s hand." },
    { by: 'a', say: "No hard feelings." },
    { by: 'b', conf: "{a} said no hard feelings. {a} has never once had no hard feelings." },
  ] },
  { id: 'r2.rs4', turns: [
    { by: 'a', conf: "{b} picked {c}. Okay. That's two people I know will vote together. That's information. I can work with information." },
  ] },
  { id: 'r2.rs5', when: { register: 'cool' }, turns: [
    { beat: '{b} and {c} are standing together.' },
    { by: 'a', say: "Good luck to you both." },
    { by: 'a', conf: "I meant it. Mostly. The other part of me is already counting votes." },
  ] },
  { id: 'r2.rs6', turns: [
    { beat: '{c} is waiting by the fire.' },
    { by: 'a', say: "Can I ask you one thing? Was any of it strategy?" },
    { by: 'b', say: "No." },
    { by: 'a', say: "Huh. Then I'm the only one who was playing." },
  ] },
];
const REJECT_EMOTIONAL = [
  { id: 'r2.re1', turns: [
    { beat: '{c} is waiting further down the beach.' },
    { by: 'a', say: "I thought we had something real." },
    { by: 'b', say: "We did. Just not—" },
    { by: 'a', say: "Don't. Just don't." },
    { beat: '{a} walks away before the tears come. {a} spends the night alone by the water.' },
  ] },
  { id: 'r2.re2', turns: [
    { by: 'a', say: "After everything?" },
    { by: 'b', say: "I'm so sorry." },
    { by: 'a', conf: "I gave {b} everything out here. Everything. And {b} picked {c}." },
  ] },
  { id: 'r2.re3', turns: [
    { beat: '{c} hangs back, saying nothing.' },
    { beat: '{a} stares at {b} like {b} is a stranger.' },
    { by: 'a', say: "I don't even know you." },
    { by: 'b', conf: "{a} went quiet after that. The dangerous kind of quiet." },
  ] },
  { id: 'r2.re4', when: { register: 'sweet' }, turns: [
    { beat: '{c} is right there. That makes it worse.' },
    { by: 'a', say: "I hope you're happy. I really do." },
    { by: 'b', say: "I'm sorry." },
    { by: 'a', conf: "I meant it. I hope {b} is happy. I just wish it was with me." },
  ] },
  { id: 'r2.re5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "So that's it? Weeks of this and you just pick {c}?!" },
    { by: 'b', say: "I didn't want to hurt you." },
    { by: 'a', say: "Then you failed!" },
  ] },
  { id: 'r2.re6', turns: [
    { beat: 'Across camp, {b} and {c} are sitting together.' },
    { by: 'a', conf: "I keep replaying everything. Every look. Every night. Was any of it real for {b}? I'll never know now." },
  ] },
];
const FADED = [
  { id: 'r2.fa1', turns: [
    { beat: '{b} is waiting for {a} by the fire.' },
    { by: 'c', conf: "{a} stopped looking at me the way {a} used to. No fight. No goodbye. Just gone." },
  ] },
  { id: 'r2.fa2', turns: [
    { by: 'c', say: "We're not really a thing anymore, are we?" },
    { by: 'a', say: "No. I don't think we are." },
    { by: 'c', say: "Okay." },
    { by: 'a', conf: "It ended without a fight. {b} is still here. That's where I am now." },
  ] },
  { id: 'r2.fa3', turns: [
    { beat: '{a} and {c} barely talk anymore. {a} and {b} are inseparable.' },
    { by: 'b', conf: "I didn't have to fight for it. It just came back to me." },
  ] },
  { id: 'r2.fa4', turns: [
    { beat: '{a} and {b} are laughing together by the water.' },
    { by: 'c', conf: "I could feel {a} pulling away for days. By the time I accepted it, it was already over." },
  ] },
  { id: 'r2.fa5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm sorry if I made things confusing." },
    { by: 'c', say: "You did. It's fine. Go be with {b}." },
  ] },
  { id: 'r2.fa6', turns: [
    { by: 'b', conf: "The triangle just dissolved. Nobody had to say anything. {c} saw it. I saw it. Done." },
  ] },
];
const CUT_CENTER = [
  { id: 'r2.cc1', turns: [
    { beat: '{a} and {b} sit on opposite ends of the fire. The spot in the middle, where {target} used to sit, is empty.' },
    { by: 'a', conf: "We fought for weeks over {target}. Now {target}'s gone and we're still here. With nothing to fight about." },
  ] },
  { id: 'r2.cc2', turns: [
    { by: 'a', say: "So." },
    { by: 'b', say: "So." },
    { by: 'a', say: "Truce?" },
    { by: 'b', say: "I guess there's nothing left to fight about." },
  ] },
  { id: 'r2.cc3', turns: [
    { by: 'b', conf: "The vote took {target} out of it. Now {a} and I are left holding a rivalry with nothing in the middle." },
  ] },
  { id: 'r2.cc4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "This is your fault, you know." },
    { by: 'b', say: "MY fault?" },
    { by: 'a', say: "If you'd backed off, {target} would still be here!" },
  ] },
  { id: 'r2.cc5', turns: [
    { by: 'a', say: "I miss {target}." },
    { by: 'b', say: "Yeah. Me too." },
    { beat: 'For the first time in weeks, they sit next to each other.' },
  ] },
  { id: 'r2.cc6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{target} is gone. {b} and I have no reason to hate each other now. Which means we have every reason to work together." },
  ] },
];
const CUT_HAND = [
  { id: 'r2.ch1', turns: [
    { by: 'b', say: "You voted {target} out." },
    { by: 'a', say: "Yes." },
    { by: 'b', say: "Was that a choice or a warning?" },
    { by: 'a', say: "Both." },
  ] },
  { id: 'r2.ch2', turns: [
    { by: 'a', conf: "I had two people and one vote. I used it. {target} knows exactly who did it. So does {b}." },
  ] },
  { id: 'r2.ch3', turns: [
    { beat: '{b} watches {a} carefully all morning.' },
    { by: 'b', conf: "{a} chose me by writing down {target}'s name. Romantic? Terrifying? I genuinely can't tell." },
  ] },
  { id: 'r2.ch4', when: { register: 'schemer' }, turns: [
    { beat: '{b} sits down next to {a} and says nothing.' },
    { by: 'a', conf: "Sometimes the heart chooses. Sometimes the pen does. Mine did both at once." },
  ] },
  { id: 'r2.ch5', turns: [
    { by: 'b', say: "Are we okay?" },
    { by: 'a', say: "We're more than okay. I made sure of it." },
    { by: 'b', conf: "That should feel nice. Mostly it feels scary." },
  ] },
  { id: 'r2.ch6', turns: [
    { by: 'a', say: "I'm sorry you had to see me do that." },
    { by: 'b', say: "I'm not. I just didn't think you'd have the nerve." },
  ] },
];
const CUT_VOTE = [
  { id: 'r2.cv1', turns: [
    { by: 'a', say: "So I guess it's just us now." },
    { by: 'b', say: "I guess it is." },
    { by: 'a', conf: "Nobody chose. The others did it for us in about four seconds." },
  ] },
  { id: 'r2.cv2', turns: [
    { beat: "{a} and {b} sit together at the fire. Where {target} used to sit, nobody sits." },
    { by: 'b', conf: "We're a couple now, apparently. Decided by a vote neither of us controlled." },
  ] },
  { id: 'r2.cv3', turns: [
    { by: 'b', say: "Do you miss {target}?" },
    { by: 'a', say: "Is that a trick question?" },
    { by: 'b', say: "A little." },
    { by: 'a', say: "Then I'll answer it a little. Yes. A little." },
  ] },
  { id: 'r2.cv4', turns: [
    { beat: '{b} sits down next to {a}.' },
    { by: 'a', conf: "I spent weeks unable to choose. Turns out I didn't have to. Everyone else chose for me." },
  ] },
  { id: 'r2.cv5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm sorry it happened like this." },
    { by: 'b', say: "Me too. But I'm glad it's you." },
  ] },
  { id: 'r2.cv6', turns: [
    { by: 'b', conf: "{target} is gone, and I won. It doesn't feel like winning." },
  ] },
];
const LONELY = [
  { id: 'r2.l1', turns: [
    { beat: '{a} sits alone at the fire. Both people {a} was caught between are gone.' },
    { by: 'a', conf: "The triangle solved itself. In the cruellest possible way." },
  ] },
  { id: 'r2.l2', turns: [
    { by: 'a', conf: "A week ago I had two people. Now I have none. I don't even know what to feel." },
  ] },
  { id: 'r2.l3', turns: [
    { beat: '{a} stares into the fire for an hour without saying anything.' },
    { by: 'a', conf: "It's so quiet now. I never noticed how loud they both were." },
  ] },
  { id: 'r2.l4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "On the bright side, nobody's distracting me anymore. On the not-bright side, I'm sad. Mostly sad." },
  ] },
  { id: 'r2.l5', turns: [
    { by: 'a', conf: "I couldn't choose. The game chose for me. It chose nobody." },
  ] },
  { id: 'r2.l6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I hope they're both okay out there. I hope they don't hate me. I'd understand if they did." },
  ] },
];
const AFFAIR_FORM = [
  { id: 'r2.af1', turns: [
    { beat: '{a} keeps finding excuses to be alone with {b}. {target} doesn\'t notice.' },
    { by: 'a', conf: "I'm with {target}. I know I'm with {target}. I just keep ending up next to {b}." },
  ] },
  { id: 'r2.af2', turns: [
    { by: 'b', say: "We shouldn't be doing this." },
    { by: 'a', say: "Doing what? We're just talking." },
    { by: 'b', say: "Then why are we whispering?" },
  ] },
  { id: 'r2.af3', turns: [
    { beat: "{a} holds {b}'s eye a little too long. The two of them go quiet when {target} walks over." },
    { by: 'b', conf: "Nothing's happened. But nothing's going to stay nothing for long." },
  ] },
  { id: 'r2.af4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{target} is safe. {b} is exciting. Why choose? Nobody has to know." },
  ] },
  { id: 'r2.af5', turns: [
    { by: 'a', say: "Meet me by the water later?" },
    { by: 'b', say: "What about {target}?" },
    { by: 'a', say: "{target} will be asleep." },
  ] },
  { id: 'r2.af6', turns: [
    { by: 'b', conf: "I know {a} is with {target}. I know. I'm still going to the water after dark." },
  ] },
];
const AFFAIR_HIDDEN = [
  { id: 'r2.ah1', turns: [
    { beat: '{a} disappears for twenty minutes after dinner and comes back with wet hair and a story about washing up. {b} comes back five minutes later.' },
    { by: 'a', conf: "{target} didn't ask. I didn't explain. This is getting easy. That's the scary part." },
  ] },
  { id: 'r2.ah2', turns: [
    { by: 'b', say: "Third firewood run this week." },
    { by: 'a', say: "We need a lot of firewood." },
    { by: 'b', say: "We have so much firewood." },
    { by: 'a', conf: "{target} hasn't noticed. Everyone else has." },
  ] },
  { id: 'r2.ah3', turns: [
    { beat: "Late at night, after {target} falls asleep, {a} slips out. {b} is already waiting by the water." },
    { by: 'b', say: "I didn't think you'd come." },
    { by: 'a', say: "I always come." },
  ] },
  { id: 'r2.ah4', turns: [
    { beat: "{b} laughs at something {a} whispers. Too quiet, too close. {target} is ten feet away, talking strategy with someone else." },
    { by: 'b', conf: "If {target} turns around right now, it's over. {target} doesn't turn around." },
  ] },
  { id: 'r2.ah5', turns: [
    { beat: '{b} hands {a} an extra portion at dinner.' },
    { by: 'a', conf: "{target} used to be the one who did that. Now it's {b}. Nobody's noticed. Yet." },
  ] },
  { id: 'r2.ah6', when: { register: 'schemer' }, turns: [
    { beat: "{b} catches {a}'s eye across the fire and smiles." },
    { by: 'a', conf: "Two relationships, one camp, zero complaints. I'm either a genius or a disaster waiting to happen." },
  ] },
];
const AFFAIR_NOTICED = [
  { id: 'r2.an1', turns: [
    { beat: '{a} sees {b} and {c} coming back from the water. Separately. Five minutes apart. Both with wet hair.' },
    { by: 'a', conf: "Oh. Oh, no. Oh, I see it now. I can't unsee it." },
  ] },
  { id: 'r2.an2', turns: [
    { by: 'a', conf: "{b} is with somebody. That somebody isn't {c}. So why does {b} keep sneaking off with {c}?" },
  ] },
  { id: 'r2.an3', turns: [
    { beat: "{a} catches {b} and {c} holding hands behind a tree. They drop them fast." },
    { by: 'c', say: "It's not what it looks like." },
    { by: 'a', say: "I didn't say anything." },
    { by: 'a', conf: "I didn't have to. Their faces did." },
  ] },
  { id: 'r2.an4', when: { sharp: true }, turns: [
    { by: 'a', conf: "The way {b} looks at {c} when nobody's watching. I'm always watching." },
  ] },
  { id: 'r2.an5', turns: [
    { beat: '{b} and {c} come back from the water five minutes apart.' },
    { by: 'a', conf: "Now I know something nobody else knows. That's either a weapon or a burden. I haven't decided." },
  ] },
  { id: 'r2.an6', when: { register: 'sweet' }, turns: [
    { beat: '{b} and {c} jump apart when they see {a} coming.' },
    { by: 'a', conf: "I wish I hadn't seen it. Now I have to decide whether to break someone's heart." },
  ] },
];
const AFFAIR_RUMOR = [
  { id: 'r2.ar1', turns: [
    { by: 'a', say: "Hey, {c}, how are you and {b} doing? Like, really?" },
    { by: 'c', say: "Great. Why?" },
    { by: 'a', say: "No reason." },
    { by: 'c', conf: "Why does everybody keep asking me that?" },
  ] },
  { id: 'r2.ar2', turns: [
    { by: 'a', conf: "Half the camp knows about {b}. {c} is the only one who doesn't. I hate that I know." },
  ] },
  { id: 'r2.ar3', turns: [
    { beat: 'Across camp, {b} is laughing with somebody else.' },
    { beat: 'Two people stop whispering when {c} walks over. One of them is {a}.' },
    { by: 'c', say: "What?" },
    { by: 'a', say: "Nothing!" },
    { by: 'c', conf: "Everybody's acting weird around me. I don't know why. I'm starting to want to know." },
  ] },
  { id: 'r2.ar4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{c}, have you ever wondered where {b} goes at night?" },
    { by: 'c', say: "To the bathroom?" },
    { by: 'a', say: "Sure. Every night. For an hour." },
  ] },
  { id: 'r2.ar5', turns: [
    { beat: '{c} walks past {b}, with no idea.' },
    { by: 'a', conf: "The rumour's out. It isn't coming from me. But I'm not stopping it either." },
  ] },
  { id: 'r2.ar6', turns: [
    { by: 'c', say: "Is there something I should know about {b}?" },
    { by: 'a', say: "You should ask {b}." },
    { by: 'c', conf: "That wasn't a no." },
  ] },
];
const AFFAIR_CAUGHT = [
  { id: 'r2.ac1', turns: [
    { beat: '{a} walks around the rocks and finds {b} and {c} kissing.' },
    { by: 'b', say: "Wait— I can explain." },
    { by: 'a', say: "Can you?" },
    { by: 'a', conf: "I caught them. Now I'm holding the biggest secret in this camp. What do I do with it?" },
  ] },
  { id: 'r2.ac2', turns: [
    { by: 'a', say: "I know about you two." },
    { by: 'c', say: "Know what?" },
    { by: 'a', say: "Don't. I saw." },
    { by: 'b', conf: "We got caught. By {a}. Of all people." },
  ] },
  { id: 'r2.ac3', turns: [
    { beat: '{c} has already slipped away into the trees.' },
    { by: 'b', say: "Please don't tell anyone." },
    { by: 'a', say: "Why shouldn't I?" },
    { by: 'b', say: "Because I'm asking you not to." },
    { by: 'a', conf: "{b} is begging. I've never seen {b} beg before. Interesting." },
  ] },
  { id: 'r2.ac4', when: { register: 'fiery' }, turns: [
    { beat: '{b} and {c} jump apart.' },
    { by: 'a', say: "Are you KIDDING me right now?!" },
    { by: 'c', say: "Shh! Keep it down!" },
    { by: 'a', say: "Oh, NOW you want to be quiet!" },
  ] },
  { id: 'r2.ac5', turns: [
    { beat: '{a} catches {b} sneaking back from the water. {c} is two steps behind.' },
    { by: 'a', say: "Good walk?" },
    { by: 'b', conf: "{a} knows. I could see it on {a.posAdj} face. {a} knows everything." },
  ] },
  { id: 'r2.ac6', when: { register: 'schemer' }, turns: [
    { beat: '{c} stares at the ground.' },
    { by: 'a', say: "Relax. I won't say a word." },
    { by: 'b', say: "Really?" },
    { by: 'a', say: "For now." },
  ] },
];
const AFFAIR_SILENT = [
  { id: 'r2.as1', turns: [
    { by: 'b', say: "Are you going to tell?" },
    { by: 'a', say: "Depends." },
    { by: 'b', say: "On what?" },
    { by: 'a', say: "On how you vote." },
    { by: 'b', conf: "I'm being blackmailed. Over a kiss. In a game. This is my life now." },
  ] },
  { id: 'r2.as2', turns: [
    { beat: "{b} is across the fire, avoiding {a}'s eyes." },
    { by: 'a', conf: "I'm keeping it to myself. For now. A secret like this is worth more unsaid." },
  ] },
  { id: 'r2.as3', turns: [
    { by: 'b', say: "Thank you for not saying anything." },
    { by: 'a', say: "Don't thank me. You owe me." },
  ] },
  { id: 'r2.as4', when: { register: 'sweet' }, turns: [
    { beat: '{b} laughs at something by the fire, like nothing happened.' },
    { by: 'a', conf: "I should tell. I know I should tell. Every day I don't, I feel worse." },
  ] },
  { id: 'r2.as5', turns: [
    { beat: '{a} catches {b}\'s eye across the fire and holds it. {b} looks away first.' },
    { by: 'b', conf: "Every time {a} looks at me, I wonder if today's the day {a} tells." },
  ] },
  { id: 'r2.as6', when: { register: 'cool' }, turns: [
    { beat: '{b} keeps glancing over at {a}.' },
    { by: 'a', conf: "Knowing a secret is power. Telling it is spending it. I'm not ready to spend it." },
  ] },
];
const AFFAIR_EXPOSED = [
  { id: 'r2.ae1', turns: [
    { by: 'a', say: "{b}, sit down. This is going to hurt." },
    { by: 'b', say: "What's going on?" },
    { by: 'a', say: "It's {c}. And someone else." },
    { beat: "{b} doesn't say anything for a long time." },
  ] },
  { id: 'r2.ae2', turns: [
    { by: 'a', say: "I couldn't keep it in anymore. You deserve to know." },
    { by: 'b', say: "Know what?" },
    { by: 'a', say: "{c} has been sneaking off at night. Not alone." },
    { by: 'b', conf: "I knew something was off. I didn't want to know what." },
  ] },
  { id: 'r2.ae3', turns: [
    { by: 'b', say: "How long?" },
    { by: 'a', say: "A while." },
    { by: 'b', say: "And you knew?" },
    { by: 'a', say: "I'm telling you now." },
    { by: 'b', conf: "I'm angry at {c}. I'm a little angry at {a} too." },
  ] },
  { id: 'r2.ae4', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "WHERE IS {c}?!" },
    { by: 'a', say: "Maybe calm down first—" },
    { by: 'b', say: "WHERE?!" },
  ] },
  { id: 'r2.ae5', turns: [
    { beat: "Across camp, {c} has no idea what's coming." },
    { beat: "{b}'s face goes completely blank." },
    { by: 'b', say: "Thank you for telling me." },
    { by: 'a', conf: "{b} said thank you. That was the worst part. I'd rather {b} had yelled." },
  ] },
  { id: 'r2.ae6', when: { register: 'sweet' }, turns: [
    { beat: '{c} is nowhere to be seen.' },
    { by: 'a', say: "I'm so sorry. I didn't want to be the one to tell you." },
    { by: 'b', say: "I'm glad it was you." },
    { beat: '{a} hugs {b}. {b} is shaking.' },
  ] },
];
const AFFAIR_STAYS = [
  { id: 'r2.st1', turns: [
    { by: 'a', say: "It was a mistake. It's you. It's always been you." },
    { by: 'b', say: "I want to believe that." },
    { by: 'a', say: "Then believe it." },
    { by: 'c', conf: "{a} chose {b}. After everything. I was just the mistake." },
  ] },
  { id: 'r2.st2', turns: [
    { beat: "{a} and {b} reconcile by the fire. The whole camp watches like it's a car crash in slow motion." },
    { by: 'c', conf: "Nobody believes it'll last. Including me. Especially me." },
  ] },
  { id: 'r2.st3', turns: [
    { beat: '{c} watches them from across camp.' },
    { by: 'b', say: "If it happens again, we're done." },
    { by: 'a', say: "It won't." },
    { by: 'b', conf: "I took {a} back. I'm not sure I'll ever stop checking where {a} is at night." },
  ] },
  { id: 'r2.st4', turns: [
    { by: 'a', say: "{c}, I'm sorry. I'm staying with {b}." },
    { by: 'c', say: "Of course you are." },
    { by: 'c', conf: "Used and thrown back. Great. Love that for me." },
  ] },
  { id: 'r2.st5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} is my number. {c} was a distraction. I chose the number. That's the game." },
  ] },
  { id: 'r2.st6', turns: [
    { beat: '{c} walks past them without a word.' },
    { by: 'b', say: "Look me in the eye and promise." },
    { by: 'a', say: "I promise." },
    { by: 'b', conf: "{a} looked me in the eye. I don't know if that means anything anymore." },
  ] },
];
const AFFAIR_LEAVES = [
  { id: 'r2.lv1', turns: [
    { by: 'a', say: "I'm sorry, {b}. It's {c}. I should've told you sooner." },
    { by: 'b', say: "Yeah. You should have." },
    { beat: '{a} walks over to {c}. {b} watches them go.' },
  ] },
  { id: 'r2.lv2', turns: [
    { by: 'b', conf: "{a} chose {c}. Three reactions, one decision, and a camp that will never be the same." },
  ] },
  { id: 'r2.lv3', turns: [
    { by: 'a', say: "I can't keep lying. I want to be with {c}." },
    { by: 'b', say: "Then go." },
    { by: 'a', conf: "That was the worst thing I've ever done to someone. And I'd do it again." },
  ] },
  { id: 'r2.lv4', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "You're leaving me for {c}?! In front of EVERYONE?!" },
    { by: 'a', say: "I'm sorry!" },
    { by: 'b', say: "No, you're not!" },
  ] },
  { id: 'r2.lv5', turns: [
    { beat: '{a} and {c} sit together openly at the fire for the first time. {b} sits as far away as the camp allows.' },
    { by: 'c', conf: "We're not hiding anymore. I thought it would feel better than this." },
  ] },
  { id: 'r2.lv6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "{b}, I never meant to hurt you. I just fell for {c}." },
    { by: 'b', say: "You can't fall by accident twenty times." },
  ] },
];

export default {
  'romance.tri.dual': FORM_DUAL, 'romance.tri.onesided': FORM_ONESIDED, 'romance.tri.tension': TENSION, 'romance.tri.confront': CONFRONT,
  'romance.tri.escalate': ESCALATE, 'romance.tri.exploit': EXPLOIT, 'romance.tri.fight': FIGHT, 'romance.tri.ultimatum': ULTIMATUM,
  'romance.tri.reject-villain': REJECT_VILLAIN, 'romance.tri.reject-strategic': REJECT_STRATEGIC, 'romance.tri.reject-emotional': REJECT_EMOTIONAL,
  'romance.tri.faded': FADED, 'romance.tri.cut-center': CUT_CENTER, 'romance.tri.cut-hand': CUT_HAND, 'romance.tri.cut-vote': CUT_VOTE,
  'romance.tri.lonely': LONELY,
  'romance.affair.form': AFFAIR_FORM, 'romance.affair.hidden': AFFAIR_HIDDEN, 'romance.affair.noticed': AFFAIR_NOTICED,
  'romance.affair.rumor': AFFAIR_RUMOR, 'romance.affair.caught': AFFAIR_CAUGHT, 'romance.affair.silent': AFFAIR_SILENT,
  'romance.affair.exposed': AFFAIR_EXPOSED, 'romance.affair.stays': AFFAIR_STAYS, 'romance.affair.leaves': AFFAIR_LEAVES,
};

/** Data these scenes always carry: the person a scene is about but who is not in it. */
export const GUARANTEED = {
  'romance.tri.exploit': ['target'], 'romance.tri.cut-center': ['target'], 'romance.tri.cut-hand': ['target'], 'romance.tri.cut-vote': ['target'],
  'romance.affair.form': ['target'], 'romance.affair.hidden': ['target'],
};
