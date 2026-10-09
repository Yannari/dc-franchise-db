// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-chm3.js — more of the challenge moments that air most and had the fewest takes
// ══════════════════════════════════════════════════════════════════════
// Read across three played seasons (2026-10-09): Alejandro's sabotage played as the same scene three
// episodes running (two:false had two entries), and the pact pool ran dry inside one episode.
// two:false = a's sabotage hit the OTHER team, so b is a teammate who benefited from it.

export default {
  'chm.sabotage.any': [
    { id: 'nc3.b1', when: { two: false }, turns: [
      { beat: "{b} waits until the rest of the team has gone ahead, then falls into step beside {a}." },
      { by: 'b', say: "What happened to the other team at {chal} didn't happen by itself, did it?" },
      { by: 'a', say: "Things go wrong out there all the time." },
      { by: 'b', say: "Not right after you've been standing next to them, they don't." },
      { by: 'a', say: "And who did that help? Us. You're welcome, by the way." },
      { by: 'b', say: "I didn't say thank you." },
      { by: 'a', say: "You didn't say you were going to tell anybody, either." },
      { by: 'b', conf: "{a} is right, I'm not telling anybody, because it won us {chal}. But I know {a} will do that to anybody, and one day the anybody is me." },
    ] },
    { id: 'nc3.b2', when: { two: false, merged: false }, turns: [
      { by: 'b', say: "The other team is losing their minds over what happened at {chal}." },
      { by: 'a', say: "Accidents happen." },
      { by: 'b', say: "Funny how the accident happened right next to you." },
      { by: 'a', say: "Are you going to tell them?" },
      { by: 'b', say: "Tell them what? That my team won? No." },
      { by: 'a', say: "Then we don't have a problem." },
      { by: 'b', say: "We don't have a problem yet." },
      { by: 'b', conf: "We won, and I should be happy. I just keep thinking that someone who'll cheat for the team will cheat the team the minute it suits them." },
    ] },
    { id: 'nc3.b3', when: { two: true }, turns: [
      { beat: "{b} is still picking dirt out of {b.posAdj} hair from {chal} when {a} walks past, grinning." },
      { by: 'b', say: "Don't smile at me. I know that was you." },
      { by: 'a', say: "What was me?" },
      { by: 'b', say: "My stuff was fine when I started. Then you were standing behind me, and then it wasn't." },
      { by: 'a', say: "Maybe you should learn to check your own stuff." },
      { by: 'b', say: "Maybe you should learn that people talk." },
      { by: 'a', say: "Let them. Who's going to believe the person who came last?" },
      { by: 'b', conf: "{a} cost me {chal} on purpose and then laughed about it. I can't prove it, but I don't need proof to write a name down." },
    ] },
  ],
  'chm.pact.any': [
    { id: 'nc3.k1', when: { two: true }, turns: [
      { beat: "{a} and {b} are the last two still cleaning off what's left of {chal}." },
      { by: 'b', say: "You know, you didn't have to wait for me back there." },
      { by: 'a', say: "I know. I wanted to." },
      { by: 'b', say: "Why?" },
      { by: 'a', say: "Because if it was me stuck out there, I'd want somebody to wait. I figured that somebody might as well be you." },
      { by: 'b', say: "Okay. Then from now on, we wait for each other, at challenges and at votes." },
      { by: 'a', say: "Deal." },
      { by: 'b', conf: "I didn't plan on making an alliance today. I planned on surviving {chal}. Somehow I did both." },
    ] },
    { id: 'nc3.k2', when: { two: true }, turns: [
      { by: 'a', say: "Can I say something without it being weird?" },
      { by: 'b', say: "That depends on what it is." },
      { by: 'a', say: "Out there, at {chal}, you were the only one I trusted. I'd like that to keep going." },
      { by: 'b', say: "Like an alliance?" },
      { by: 'a', say: "Like an alliance, yeah. Just two people, no big speech." },
      { by: 'b', say: "No big speech. I can do that." },
      { by: 'a', conf: "There's a difference between people you like and people you'd trust with your game. Today {b} moved from one to the other." },
    ] },
    { id: 'nc3.k3', when: { two: true, voice: ['schemer', 'cruel', 'proud', 'blunt'] }, turns: [
      { by: 'a', say: "What we said at {chal}, I want to know it wasn't just adrenaline talking." },
      { by: 'b', say: "It wasn't." },
      { by: 'a', say: "Good, because I don't make deals twice. If you break this one, there won't be another." },
      { by: 'b', say: "Is that a threat?" },
      { by: 'a', say: "It's the terms. You can take them or leave them." },
      { by: 'b', say: "...I'll take them." },
      { by: 'b', conf: "{a} has a funny way of starting a friendship. But I'd rather have {a} with me than against me, and now I know where I stand." },
    ] },
  ],
  'chm.taunt.any': [
    { id: 'nc3.t1', when: { two: true }, turns: [
      { beat: "{a} is still doing the victory dance from {chal} when {b} walks into the middle of it." },
      { by: 'b', say: "You can stop now. We all saw." },
      { by: 'a', say: "Did you see the part where I won? Because I can do it again, slower." },
      { by: 'b', say: "Please don't." },
      { by: 'a', say: "Too late. Watch the footwork." },
      { by: 'b', conf: "{a} beat me and then made sure the whole camp knew it. Next time I win something, I'm doing the dance too, right in {a}'s face." },
    ] },
    { id: 'nc3.t2', when: { two: false }, turns: [
      { by: 'b', say: "Did you have to wave at them on the way out?" },
      { by: 'a', say: "They were waving at me first." },
      { by: 'b', say: "They were not waving. They were shaking their fists." },
      { by: 'a', say: "It's still waving, technically." },
      { by: 'b', conf: "{a} won us {chal} and then made sure the other team will hate us for a week. I'm thrilled and a bit worried, at the same time." },
    ] },
  ],
};
