// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-vote5.js — more doubts about the plan (n-vote4.js has the header)
// ══════════════════════════════════════════════════════════════════════
// Ids: 'ne.'.

export default {
  'story.vote.doubt.holds': [
    { id: 'ne.h1', when: { pair: true }, turns: [
      { by: 'a', say: "Okay, I'm just going to ask, are we sure about {target}?" },
      { by: 'b', say: "Why, did you hear something?" },
      { by: 'a', say: "No, nothing like that, it just feels too easy, and easy makes me nervous." },
      { by: 'b', say: "Easy is good. Easy means nobody gets hurt except {target}." },
      { by: 'a', say: "Yeah, I guess you're right." },
      { by: 'a', conf: "I'm going along with it, because if I start asking questions now, I'm the one who looks shady." },
    ] },
    { id: 'ne.h2', when: { pair: true }, turns: [
      { beat: "{a} sits down next to {b} {here} and doesn't say anything for a minute." },
      { by: 'b', say: "What's wrong?" },
      { by: 'a', say: "I keep thinking about {target}, about how {target} helped me on the first day." },
      { by: 'b', say: "That doesn't change the plan." },
      { by: 'a', say: "I know it doesn't, I'm not saying it does, I just feel bad." },
      { by: 'b', move: 'reassure' },
      { by: 'a', conf: "I'll do it, I'll write {target}, but I'm going to be thinking about that first day the whole time." },
    ] },
    { id: 'ne.h3', when: { pair: true, voice: ['schemer', 'calm', 'dry', 'competitive'] }, turns: [
      { by: 'a', say: "Just so we're clear, I think {target} is the wrong call, but I'm not going to fight it." },
      { by: 'b', say: "Then why say anything?" },
      { by: 'a', say: "So when it goes wrong, you remember I said it." },
      { by: 'b', move: 'dismiss' },
      { by: 'a', conf: "I'm going with the group tonight, because breaking from them now costs me more than it gets me, but I want it on record." },
    ] },
    { id: 'ne.h4', when: { pair: true, voice: ['anxious', 'emotional', 'earnest', 'warm'] }, turns: [
      { by: 'a', say: "Can I tell you something? I almost said no when they asked me about {target}." },
      { by: 'b', say: "Why didn't you?" },
      { by: 'a', say: "Because I didn't want everybody looking at me like I'm the problem." },
      { by: 'b', say: "You're not the problem." },
      { by: 'a', say: "I know, but I would have been if I'd said no." },
      { by: 'a', conf: "I'm writing {target}, and I hate it, and I'm doing it anyway, and I don't really know what that says about me." },
    ] },
    { id: 'ne.h5', when: { cast: 'solo' }, turns: [
      { by: 'a', conf: "My group decided on {target} in about thirty seconds, and nobody asked what I thought.", v: { loud: "My group picked {target} in like thirty seconds and nobody even asked me, which, okay, rude." } },
      { by: 'a', conf: "I'll go along with it tonight, but next time I'm making sure somebody asks me first." },
    ] },
    { id: 'ne.h6', when: { cast: 'solo' }, turns: [
      { by: 'a', conf: "I don't have a better name than {target}, and that's the only reason I'm going along with it.", v: { nerdy: "I ran through every other option, and none of them work, so I'm stuck with {target} like everybody else." } },
      { by: 'a', conf: "If somebody had come to me with a real plan, I might have listened, but nobody did." },
    ] },
  ],
  'story.vote.doubt.breaks': [
    { id: 'ne.b1', when: { pair: true, nice: false }, turns: [
      { by: 'b', say: "We're all good for tonight, yeah? {target}?" },
      { by: 'a', say: "Yeah, all good." },
      { by: 'b', say: "You don't sound very sure." },
      { by: 'a', say: "I'm sure, I just hate this part, that's all." },
      { by: 'b', say: "Everybody hates this part." },
      { by: 'a', conf: "My group thinks I'm on {target}, and I'm not, and the worst part is how easy it was to lie about it." },
    ] },
    { id: 'ne.b2', when: { pair: true }, turns: [
      { beat: "{b} finds {a} sitting alone {here}." },
      { by: 'b', say: "Everybody's looking for you. We're doing a final check on {target}." },
      { by: 'a', say: "I'll be there in a minute, I just needed some air." },
      { by: 'b', move: 'suspicious' },
      { by: 'a', say: "I'm fine, seriously, go, I'll be right behind you." },
      { by: 'a', conf: "I couldn't sit through another meeting about {target} and pretend I'm on board, because I'm not." },
    ] },
    { id: 'ne.b3', when: { pair: true, wrote: true, nice: false, voice: ['schemer', 'calm', 'dry', 'proud', 'competitive'] }, turns: [
      { by: 'b', say: "You know the plan is {target}, right?" },
      { by: 'a', say: "Of course I know the plan, I was in the meeting." },
      { by: 'b', say: "Okay, just checking." },
      { by: 'a', say: "Check all you want." },
      { by: 'a', conf: "They can check on me all day. I'm writing {wrote}, and none of them will know until the votes are read." },
    ] },
    { id: 'ne.b4', when: { pair: true, voice: ['anxious', 'emotional', 'warm', 'earnest'] }, turns: [
      { by: 'b', say: "Hey, are you okay? You look really pale." },
      { by: 'a', say: "I'm okay, I just... I don't know, I don't want to talk about it yet." },
      { by: 'b', say: "We're still on {target}, you know that, right?" },
      { by: 'a', say: "I know what the plan is." },
      { by: 'a', conf: "I couldn't say it to {b}, but I'm not writing {target}. I feel so guilty I could throw up, I just can't vote out someone I think is good for me." },
    ] },
    { id: 'ne.b5', when: { cast: 'solo' }, turns: [
      { by: 'a', conf: "Everybody in my group is so sure about {target}, and honestly that's what bothers me, because nobody's thinking about what happens after." },
      { by: 'a', conf: "So I'm thinking about it for them, and I'm voting the way that keeps me in this game.", v: { loud: "So I'm doing my own thing tonight, and they can be mad about it tomorrow." } },
    ] },
    { id: 'ne.b6', when: { cast: 'solo', wrote: true }, turns: [
      { by: 'a', conf: "I told my group I'd write {target}, and I meant it this morning, but a lot has changed since this morning.", v: { anxious: "I told everybody I'd write {target}, and now I'm going to write {wrote}, and I really hope I'm doing the right thing." } },
      { by: 'a', conf: "I'm writing {wrote}. If it backfires, at least it backfired because of something I chose." },
    ] },
    { id: 'ne.b7', when: { cast: 'solo', voice: ['tough', 'blunt', 'proud', 'competitive'] }, turns: [
      { by: 'a', conf: "My group didn't ask me about {target}, they just told me, like I'm going to do whatever they say." },
      { by: 'a', conf: "I'm not, and they're going to find that out tonight." },
    ] },
    { id: 'ne.b8', when: { pair: true, wrote: true }, turns: [
      { by: 'a', say: "Can I ask you something? What do you actually think of {wrote}?" },
      { by: 'b', say: "{wrote}? Why are you asking about {wrote}? It's {target} tonight." },
      { by: 'a', say: "No reason, I was just wondering." },
      { by: 'b', say: "Don't do anything stupid, okay?" },
      { by: 'a', say: "I won't." },
      { by: 'a', conf: "I asked one question about {wrote} and {b} looked at me like I'd lost my mind, so I'm definitely not telling {b} what I'm doing tonight." },
    ] },
  ],
};
