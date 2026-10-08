// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-vote4.js — doubts about the plan, before the vote
// ══════════════════════════════════════════════════════════════════════
//
// director.js voteTalk 3b: a member the engine marked unsure of their bloc's plan (voting.js
// reliability: tentative, drifting, reservations from the start).
//   story.vote.doubt.holds   a has doubts about voting {target} and goes along with it anyway;
//                            b (a friend in the bloc) is who a tells, or nobody (a solo confessional)
//   story.vote.doubt.breaks  a has doubts and is going to write another name ({wrote}, fact wrote);
//                            a never tells b that, only the camera
// Ids: 'nf.'.

export default {
  'story.vote.doubt.holds': [
    { id: 'nf.h1', when: { pair: true }, turns: [
      { beat: "{a} catches {b} on the way back {here}." },
      { by: 'a', say: "Can I be honest? I'm not totally sure about {target}.", v: { anxious: "Can I be honest for a second? I'm really not sure about {target}, and it's making me sick.", blunt: "I'm going to be honest, I don't love the {target} plan." } },
      { by: 'b', say: "What's wrong with it?" },
      { by: 'a', say: "Nothing, really, I just like {target}, and it feels like we're picking the easy name instead of the right one." },
      { by: 'b', move: 'reassure' },
      { by: 'a', move: 'agree.reluctant' },
      { by: 'a', conf: "I'm going to write {target}, because that's the plan and I'm not going to be the one who breaks it, but I don't feel good about it.", v: { warm: "I'll write {target}, but I'm going to feel bad about it all night, because {target} has been so nice to me." } },
    ] },
    { id: 'nf.h2', when: { pair: true }, turns: [
      { by: 'b', say: "You've been quiet all afternoon. What's going on?" },
      { by: 'a', say: "I just keep thinking, what if {target} isn't the right call? What if we regret it?" },
      { by: 'b', say: "We've been over this. It's the only name everybody agrees on." },
      { by: 'a', say: "I know, I know, I'm not changing anything, I'm just saying it out loud." },
      { by: 'b', conf: "{a} has doubts, which is normal, but I'm going to keep a close eye on {a} until the votes are read." },
    ] },
    { id: 'nf.h3', when: { cast: 'solo' }, turns: [
      { by: 'a', conf: "Everybody's on {target}, and I said I was too, but I've got this feeling in my stomach that we're making a mistake.", v: { calm: "I don't love the {target} plan, but I said I'd go with it, so I'm going with it.", schemer: "I've got doubts about {target}, but going against my own group tonight would cost me more than it's worth." } },
      { by: 'a', conf: "I'm still writing {target}. I'd just feel a lot better if I knew why my gut is so loud right now." },
    ] },
  ],
  'story.vote.doubt.breaks': [
    { id: 'nf.b1', when: { pair: true, nice: false }, turns: [
      { by: 'b', say: "Hey, you're still good with {target} tonight, right?" },
      { by: 'a', say: "Yeah. Yeah, of course.", v: { anxious: "Yeah! I mean, yeah. Of course. Why wouldn't I be?", calm: "Yeah, of course I am." } },
      { by: 'b', say: "Okay, because you've been acting a little weird." },
      { by: 'a', say: "I'm just tired, I promise, it's been a long day." },
      { by: 'b', move: 'suspicious' },
      { by: 'a', conf: "I just lied to {b}'s face. I'm not voting {target} tonight, and nobody in my group knows it yet." },
    ] },
    { id: 'nf.b2', when: { pair: true, wrote: true }, turns: [
      { beat: "{a} and {b} are alone {here}. {a} keeps looking back toward camp." },
      { by: 'a', say: "Do you ever think we're voting out the wrong person?" },
      { by: 'b', say: "What do you mean? We all agreed on {target}." },
      { by: 'a', say: "I know we did. Forget it, I'm just overthinking it." },
      { by: 'b', say: "You sure?" },
      { by: 'a', say: "I'm sure." },
      { by: 'a', conf: "Everybody thinks it's {target} tonight, but I'm writing {wrote}, and if it works, it changes everything.", v: { schemer: "My group is on {target}. I'm on {wrote}. By the time they figure that out, it'll be too late.", warm: "I feel awful, because my group trusts me, but I really think {wrote} is the right vote, so that's what I'm writing." } },
    ] },
    { id: 'nf.b3', when: { cast: 'solo' }, turns: [
      { by: 'a', conf: "My group thinks I'm with them on {target}, and I let them think that, because I'm not ready to fight about it.", v: { loud: "My group wants {target}, and I nodded along, but honestly? I'm done doing what I'm told." } },
      { by: 'a', conf: "Tonight I'm going my own way. I just hope I'm not the only one." },
    ] },
    { id: 'nf.b4', when: { cast: 'solo', wrote: true }, turns: [
      { by: 'a', conf: "The plan is {target}, everybody keeps telling me the plan is {target}, and I keep saying okay.", v: { anxious: "Everybody keeps saying {target}, and I keep saying okay, and my hands are literally shaking." } },
      { by: 'a', conf: "I'm writing {wrote}. If I'm wrong about this, I'm the next one going home, so I'd better not be wrong." },
    ] },
  ],
};
