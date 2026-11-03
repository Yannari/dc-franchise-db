// Celebrating: quick hits (3 to 5 lines), about what they just did (the task's type), who they are to each other
// (relFam) and where they are (at: task or mat). `hug`: they did it. `gloat-at-others`: they did it, and the teams
// still stuck get to hear about it. `jinx`: one of them says it out loud. Written again 2026-11-03 the way people
// celebrate on the real show (the user: "they talk like a bad translation"): yelling, relief, a hug, back to running.
const HUG = 'celebrate.hug', GLOAT = 'celebrate.gloat-at-others', JINX = 'celebrate.jinx';
const T = (extra = {}) => ({ at: 'task', ...extra });

export default {
  retire: [HUG, GLOAT, JINX, 'celebrate.any'],
  pools: {
    [HUG]: [
      // what they just did
      { id: 'ce.h-wet1', when: T({ taskType: 'water' }), turns: [
        { beat: '{a} climbs out of the water and hugs {b}, completely soaked.' },
        { by: 'b', say: "Ah! You're getting me all wet!" },
        { by: 'a', say: "I don't care! We did it!" },
      ] },
      { id: 'ce.h-wet2', when: T({ taskType: 'water' }), turns: [
        { by: 'a', say: "Oh my God, I'm freezing. I'm so cold." },
        { by: 'b', say: "Come here. Come here, I've got you." },
        { beat: '{b} wraps {a} in a hug, wet and all.' },
      ] },
      { id: 'ce.h-up1', when: T({ taskType: 'heights' }), turns: [
        { beat: 'Both feet back on the ground, {a} grabs {b} and won\'t let go.' },
        { by: 'a', say: "I'm on the ground. I'm on the ground. Oh, thank God." },
        { by: 'b', say: "You did it! I'm so proud of you!" },
      ] },
      { id: 'ce.h-up2', when: T({ taskType: 'heights' }), turns: [
        { by: 'b', say: "You did it. You actually did it." },
        { by: 'a', say: "I was so scared. I'm still shaking." },
        { beat: 'They hug, and {a} is still shaking a little.' },
      ] },
      { id: 'ce.h-eat1', when: T({ taskType: 'stomach' }), turns: [
        { beat: '{b} goes in for a hug, then stops halfway.' },
        { by: 'b', say: "I'm so proud of you. I'm not hugging you, though. Your breath." },
        { by: 'a', say: "Get over here!" },
        { by: 'b', say: "No! No way!" },
      ] },
      { id: 'ce.h-eat2', when: T({ taskType: 'stomach' }), turns: [
        { by: 'a', say: "I can still taste it. Please tell me that goes away." },
        { by: 'b', say: "It'll go away. Probably. Come here." },
        { beat: 'They hug, quickly.' },
      ] },
      { id: 'ce.h-brain1', when: T({ taskType: 'brains' }), turns: [
        { by: 'b', say: "You figured it out! How did you figure that out?" },
        { by: 'a', say: "I don't know! It just clicked!" },
        { beat: '{b} hugs {a} hard enough to lift {a.obj} off the ground.' },
      ] },
      { id: 'ce.h-arms1', when: T({ taskType: 'strength' }), turns: [
        { beat: '{a} drops to the ground, arms shaking, and {b} drops down next to {a.obj}.' },
        { by: 'a', say: "I can't feel my arms. I literally can't feel my arms." },
        { by: 'b', say: "You were amazing. Come here." },
      ] },
      { id: 'ce.h-hands1', when: T({ taskType: 'hands' }), turns: [
        { by: 'b', say: "Look at it! We actually made that!" },
        { by: 'a', say: "It's kind of a mess." },
        { by: 'b', say: "It's a mess, and it counts. Come here!" },
      ] },
      // who they are to each other
      { id: 'ce.h-fam1', when: T({ relFam: 'family' }), turns: [
        { by: 'a', say: "Wait till everybody at home sees this." },
        { by: 'b', say: "They're going to lose their minds." },
        { beat: 'They hug, tight.' },
        { by: 'a', say: "I love you. Okay. Let's go." },
      ] },
      { id: 'ce.h-love1', when: { relFam: 'romantic' }, turns: [
        { beat: '{a} kisses {b} on the cheek, then again, until {b} pushes {a.obj} away, laughing.' },
        { by: 'b', say: "Stop! We're in a race! People are watching!" },
        { by: 'a', say: "Let them watch." },
      ] },
      { id: 'ce.h-exes1', when: { relFam: 'exes' }, turns: [
        { beat: 'Without thinking, {a} and {b} hug. Then they both remember, and step back.' },
        { by: 'a', say: "Okay. That was just... a race hug." },
        { by: 'b', say: "Yeah. Totally. Just a race hug." },
        { beat: 'Neither of them looks at the other for a while.' },
      ] },
      // at the mat
      { id: 'ce.h-mat1', when: { at: 'mat' }, turns: [
        { beat: '{a} and {b} collapse on the grass beside the mat.' },
        { by: 'a', say: "I'm not getting up. I'm not getting up for anything." },
        { by: 'b', say: "Same. We're just lying here now." },
      ] },
      { id: 'ce.h-mat2', when: { at: 'mat' }, turns: [
        { by: 'b', say: "We made it. We're still in it." },
        { by: 'a', say: "Come here before I fall asleep standing up." },
        { beat: 'They hug, and lean on each other, and stay like that for a while.' },
      ] },
      // anywhere
      { id: 'ce.h-any1', turns: [
        { by: 'a', say: "Did that just work? First try?" },
        { by: 'b', say: "It worked! Oh my God, it worked!" },
        { beat: 'They hug, jumping up and down.' },
      ] },
      { id: 'ce.h-any2', turns: [
        { beat: '{a} goes for a high five, {b} goes for a hug, and they end up doing both.' },
        { by: 'b', say: "Yes! Let's go!" },
        { by: 'a', say: "Okay, okay. Get the tip. Come on." },
      ] },
    ],

    [GLOAT]: [
      { id: 'ce.g-task1', when: T(), turns: [
        { beat: '{a} holds the tip up high, so the teams still working can see it.' },
        { by: 'a', say: "Good luck, everybody! You're going to need it!" },
        { by: 'b', say: "Why would you say that to them?" },
        { by: 'a', say: "What? I said good luck." },
        { by: 'b', say: "You said they'd need it. They heard that part." },
      ] },
      { id: 'ce.g-task2', when: T(), turns: [
        { by: 'a', say: "Oh, is that still going badly over there? That's so sad. Anyway, bye!" },
        { by: 'b', say: "Stop it. Come on." },
        { beat: 'Somebody behind them yells something at them.' },
        { by: 'b', say: "Keep walking. Don't turn around." },
      ] },
      { id: 'ce.g-task3', when: T(), turns: [
        { by: 'a', say: "Should we do a little victory lap? Right past everybody?" },
        { by: 'b', say: "No. Absolutely not. We have to go." },
        { by: 'a', say: "Just a small one." },
        { by: 'b', say: "Walk. Now." },
      ] },
      { id: 'ce.g-mat1', when: { at: 'mat' }, turns: [
        { beat: 'From the Chill Zone, {a} watches the next team stagger in.' },
        { by: 'a', say: "Look at them. They look terrible." },
        { by: 'b', say: "We looked exactly like that an hour ago." },
        { by: 'a', say: "Nobody saw that." },
      ] },
      { id: 'ce.g-mat2', when: { at: 'mat' }, turns: [
        { by: 'a', say: "Can somebody bring us a cushion? We earned it." },
        { by: 'b', say: "We didn't even come first." },
        { by: 'a', say: "We still earned a cushion." },
      ] },
      { id: 'ce.g-any1', turns: [
        { by: 'a', say: "Do you think they saw that? I hope they saw that." },
        { by: 'b', say: "We just finished first at one thing. Calm down." },
        { by: 'a', say: "I'm calm. I'm very calm. I just hope they saw." },
      ] },
      { id: 'ce.g-any2', turns: [
        { by: 'a', say: "Should we wave? I want to wave at them." },
        { by: 'b', say: "Do not wave." },
        { beat: '{a} waves anyway. Nobody waves back.' },
      ] },
    ],

    [JINX]: [
      { id: 'ce.j-1', turns: [
        { by: 'a', say: "That's it. We're winning this whole thing. I can feel it." },
        { by: 'b', say: "Don't say that. Don't ever say that out loud." },
        { by: 'a', say: "Why? It's true." },
        { by: 'b', say: "Because every time you say something like that, it goes wrong." },
      ] },
      { id: 'ce.j-2', turns: [
        { by: 'a', say: "Honestly, I think the rest of this leg is going to be easy." },
        { by: 'b', say: "Why would you say that?" },
        { by: 'a', say: "Because it's true?" },
        { by: 'b', say: "Knock on wood. Knock on something. Right now." },
        { beat: '{a} can\'t find any wood, so {a.sub} knocks on {b}\'s head.' },
      ] },
      { id: 'ce.j-3', when: { relFam: 'family' }, turns: [
        { by: 'a', say: "I'm already planning what we're going to do with the money." },
        { by: 'b', say: "Don't. Don't do that yet." },
        { by: 'a', say: "Why not?" },
        { by: 'b', say: "Because we haven't won anything yet. Don't jinx it." },
      ] },
      { id: 'ce.j-4', when: { at: 'task' }, turns: [
        { by: 'a', say: "We're so far ahead. Nobody's catching us now." },
        { by: 'b', say: "There's a team right behind us." },
        { beat: 'There is a team right behind them.' },
        { by: 'a', say: "Okay. Okay, run, run!" },
      ] },
      { id: 'ce.j-5', turns: [
        { by: 'a', say: "Say it with me. Easiest leg ever." },
        { by: 'b', say: "No." },
        { by: 'a', say: "Why not?" },
        { by: 'b', say: "Because the last time you said that, we got lost for three hours." },
      ] },
      { id: 'ce.j-6', when: { relFam: 'romantic' }, turns: [
        { by: 'a', say: "We are the best team in this race. Admit it." },
        { by: 'b', say: "Don't make me say it. Every time we say it, something happens." },
        { by: 'a', say: "Nothing's going to happen." },
        { by: 'b', say: "Something always happens." },
      ] },
    ],
  },
};
