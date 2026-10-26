// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/gametalk3.js — on the outside of the vote
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-06: "do they talk about being on the outside of the votes?" The morning
// after an eviction, somebody who voted against the house works out what that means. They
// know what everybody knows (the count the host read out) and their own vote, nothing more.
//
//   talk.outside  a voted to evict c, who stayed; {gone} left anyway; b is a's closest;
//                 {count} is the count as the host read it ("eight to five")

export default {
  'talk.outside': [
    { id: 'go.o1', presumes: ['vote'], room: 'bedroom', turns: [
      { beat: 'Bedroom, the morning after. {a} is sitting on the edge of the bed, not dressed yet. {b} comes in.' },
      { by: 'a', say: "{count}." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "I voted for {c} to go. I thought I was with the house." },
      { by: 'b', say: "You weren't." },
      { by: 'a', say: "Clearly. So who was I with?" },
      { by: 'b', say: "The ones who lost." },
      { by: 'a', dr: "{count}. I was on the wrong side of that, and everybody can count. They know some of us voted to keep {gone}. They're going to want to know who." },
    ] },
    { id: 'go.o2', presumes: ['vote'], room: 'kitchen', turns: [
      { beat: 'Kitchen, early. {a} is making toast nobody asked for. {b} leans on the counter.' },
      { by: 'b', say: "You look like you didn't sleep." },
      { by: 'a', say: "I didn't. I kept thinking about the vote." },
      { by: 'b', say: "What about it?" },
      { by: 'a', say: "{count}. I voted to evict {c}. So I'm one of the only people who didn't vote with the house." },
      { by: 'b', say: "You and a couple of other people." },
      { by: 'a', say: "And I don't even know who they are. That's what's killing me." },
      { by: 'a', dr: "Everybody else voted out {gone}. I didn't. If people figure out it was me, I'm in trouble next week." },
    ] },
    { id: 'go.o3', presumes: ['vote'], turns: [
      { beat: 'The backyard. {a} is lying flat on the grass. {b} sits down beside {a}.' },
      { by: 'b', say: "You voted to keep {gone}, didn't you?" },
      { by: 'a', say: "I'm not saying." },
      { by: 'b', say: "That means yes." },
      { by: 'a', say: "...Yes." },
      { by: 'b', say: "Then don't tell anyone else. Let them think you were with them." },
      { by: 'a', say: "And just smile at {c} all day?" },
      { by: 'b', say: "Yes. Smile, and say nothing." },
      { by: 'b', dr: "{a} voted the wrong way this week. As long as nobody finds out, {a} is fine. So nobody's going to find out from me." },
    ] },
    { id: 'go.o4', presumes: ['vote'], room: 'living-room', turns: [
      { beat: 'Living room. {a} is sitting very still, watching {c} laugh in the kitchen. {b} notices.' },
      { by: 'b', say: "Stop staring." },
      { by: 'a', say: "I voted to evict {c} last night. And {c} is still here." },
      { by: 'b', say: "Lots of people voted." },
      { by: 'a', say: "And most of them voted out {gone}. Nobody told me." },
      { by: 'b', say: "Maybe you weren't told on purpose." },
      { by: 'a', say: "That's what I'm afraid of." },
      { by: 'a', dr: "If the house made a plan and nobody told me, then I'm not in it. I need to fix that before the next plan is about me." },
    ] },
    { id: 'go.o5', presumes: ['vote'], room: 'bedroom', turns: [
      { beat: 'Bedroom, door shut. {a} pulls {b} in by the sleeve.' },
      { by: 'a', say: "How did you vote?" },
      { by: 'b', say: "We're not supposed to say." },
      { by: 'a', say: "I'll go first. I voted to keep {gone}." },
      { by: 'b', say: "...I'm not telling you mine." },
      { by: 'a', say: "{count}. If you were with them, just say so." },
      { by: 'b', say: "If I was with them, I'd be the one asking you questions." },
      { by: 'a', dr: "{b} wouldn't tell me. Either {b} is out here with me, or {b} knew all along. I need to find out which." },
    ] },
    { id: 'go.o6', presumes: ['vote'], room: 'kitchen', turns: [
      { beat: 'Kitchen. {a} is cleaning a counter that is already clean. {b} watches.' },
      { by: 'b', say: "It's clean." },
      { by: 'a', say: "I need something to do with my hands." },
      { by: 'b', say: "Is this about last night?" },
      { by: 'a', say: "I liked {gone}. And I didn't see it coming. Nobody even warned me." },
      { by: 'b', say: "Maybe nobody knew whose side you'd be on." },
      { by: 'a', say: "Well, now they know. I was on {gone}'s." },
      { by: 'a', dr: "Losing {gone} is bad. Finding out the whole house moved without me is worse." },
    ] },
    { id: 'go.o7', presumes: ['vote'], turns: [
      { beat: 'The backyard, by the pool. {a} is dangling both feet in the water. {b} sits down next to {a}.' },
      { by: 'a', say: "Do you think {c} knows how I voted?" },
      { by: 'b', say: "{c} can count. {count}. {c} knows somebody voted against {c}." },
      { by: 'a', say: "But not who." },
      { by: 'b', say: "Not yet." },
      { by: 'a', say: "So I need {c} to think it was somebody else." },
      { by: 'b', say: "Or you win HOH and it doesn't matter." },
      { by: 'b', dr: "{a} voted against {c}, and {c} is still here. If {c} works out who it was, {a} is in a lot of trouble." },
    ] },
    { id: 'go.o8', presumes: ['vote'], room: 'living-room', turns: [
      { beat: 'Living room, morning. Nobody has moved the cushions since the vote. {a} and {b} are back in the same seats.' },
      { by: 'a', say: "When the host read out '{count}', did my face do something?" },
      { by: 'b', say: "Your face did a lot of things." },
      { by: 'a', say: "Great." },
      { by: 'b', say: "Relax. I only noticed because I was watching you." },
      { by: 'a', say: "Why were you watching me?" },
      { by: 'b', say: "Because you and {gone} were close. I wanted to know if you saw it coming." },
      { by: 'a', say: "I didn't. Nobody said a word to me." },
      { by: 'a', dr: "Half the house knew {gone} was going home, and I found out when the host read it out. Nobody told me. That tells me exactly where I stand in here." },
    ] },
  ],
};
