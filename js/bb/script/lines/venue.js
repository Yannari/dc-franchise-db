// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/venue.js — the building itself (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/venue.js. venue.atmos has one ending per house
// type (settings.js: bb-house, bb-compound, bb-resort, bb-manor), and its
// '.any' pool fits all four.
//
//   venue.shared      a and b end up in the same room              warm | cold
//   venue.corner      a and b find somewhere private; c saw them   hidden | exposed
//   venue.atmos       a and b, and the place they live in          house | compound | resort | manor
//   venue.overlooked  a has been left out all day; b notices       noticed | missed

export default {
  'venue.shared.warm': [
    { id: 'vs.w1', turns: [{ by: 'a', say: "Everyone else went to bed." }, { by: 'b', say: "Good. I like it when it's quiet." }] },
    { id: 'vs.w2', turns: [{ by: 'a', say: "What are you reading?" }, { by: 'b', say: "The back of a cereal box. Third time." }, { by: 'a', say: "Any good?" }, { by: 'b', say: "It gets better every time." }] },
    { id: 'vs.w3', turns: [{ by: 'a', say: "Can I sit here?" }, { by: 'b', say: "Course you can." }, { beat: 'They talk for an hour about nothing in particular.' }] },
    { id: 'vs.w4', turns: [{ by: 'a', say: "What would you be doing at home right now?" }, { by: 'b', say: "Sleeping. Or eating. Probably both." }] },
    { id: 'vs.w5', turns: [{ by: 'b', say: "I like talking to you. It's the only time I don't think about the game." }, { by: 'a', say: "Same." }] },
    { id: 'vs.w6', turns: [{ by: 'a', say: "Tell me something about you that nobody in here knows." }, { by: 'b', say: "I'm scared of birds." }, { by: 'a', say: "Birds?" }, { by: 'b', say: "All of them." }] },
    { id: 'vs.w7', turns: [{ by: 'a', say: "How are you actually doing?" }, { by: 'b', say: "Honestly? Tired. But I'm okay." }, { by: 'a', say: "Good. I'm glad." }] },
    { id: 'vs.w8', turns: [{ by: 'a', dr: "{b} and I talked for an hour today. Nothing about the game. That's how you build trust in here." }] },
    { id: 'vs.w9', turns: [{ by: 'a', say: "You're a good person to have around." }, { by: 'b', say: "So are you. Don't tell anyone." }] },
    { id: 'vs.w10', turns: [{ by: 'b', say: "Did you sleep last night?" }, { by: 'a', say: "Not much." }, { by: 'b', say: "Me neither. Want to just sit here for a bit?" }] },
    { id: 'vs.w11', turns: [{ by: 'a', say: "If we weren't in here, I think we'd be friends." }, { by: 'b', say: "We are friends." }] },
    { id: 'vs.w12', turns: [{ by: 'a', dr: "Everyone else left the room. {b} and I didn't. We didn't plan it." }] },
    { id: 'vs.w13', turns: [{ by: 'a', say: "Want a cup of tea?" }, { by: 'b', say: "Go on, then." }, { beat: '{a} makes two cups. They drink them slowly and talk about home.' }] },
    { id: 'vs.w14', turns: [{ by: 'b', say: "What's the first thing you'll eat when you get out?" }, { by: 'a', say: "Pizza. A whole one." }, { by: 'b', say: "Just for you?" }, { by: 'a', say: "Just for me." }] },
    { id: 'vs.w15', turns: [{ by: 'a', say: "I'm so bored." }, { by: 'b', say: "Me too. Want to play cards?" }, { by: 'a', say: "Only if you don't cheat this time." }] },
    { id: 'vs.w16', turns: [{ by: 'a', dr: "I always feel calmer after talking to {b}. We barely mention the game. That's the point." }] },
    { id: 'vs.w17', turns: [{ by: 'b', say: "You always know when I need someone to talk to." }, { by: 'a', say: "You're not that hard to read." }, { by: 'b', say: "Thanks. I think." }] },
    { id: 'vs.w18', turns: [{ by: 'a', say: "Do you ever just forget it's a game?" }, { by: 'b', say: "Sometimes. Then someone gets nominated and I remember." }] },
    { id: 'vs.w19', turns: [{ by: 'a', say: "I'm glad you're still here." }, { by: 'b', say: "So am I. Let's keep it that way." }] },
    { id: 'vs.w20', turns: [{ beat: '{a} and {b} sit together without saying much.' }, { by: 'a', dr: "I don't need to talk to {b} all the time. That's what I like about {b.obj}." }] },
    { id: 'vs.w21', turns: [{ by: 'b', say: "Tell me a story." }, { by: 'a', say: "About what?" }, { by: 'b', say: "Anything that isn't about this house." }] },
  ],
  'venue.shared.cold': [
    { id: 'vs.c1', turns: [{ by: 'a', say: "Have you eaten?" }, { by: 'b', say: "Yes." }, { by: 'a', say: "Okay." }, { beat: 'Neither of them gets up.' }] },
    { id: 'vs.c2', turns: [{ by: 'a', say: "Nice weather." }, { by: 'b', say: "We can't see outside." }, { by: 'a', say: "...Right." }] },
    { id: 'vs.c3', turns: [{ by: 'b', dr: "{a} sat down at the other end of the sofa. I'm not moving first. I was here first." }] },
    { id: 'vs.c4', turns: [{ by: 'a', say: "Are you going to be here long?" }, { by: 'b', say: "Are you?" }] },
    { id: 'vs.c5', when: { room: ['kitchen'] }, turns: [{ by: 'a', say: "Pass the salt?" }, { by: 'b', say: "Here." }, { beat: 'That is the whole conversation.' }] },
    { id: 'vs.c6', turns: [{ by: 'a', dr: "{b} and I talked about laundry for ten minutes. Anything to avoid talking about what happened." }] },
    { id: 'vs.c7', turns: [{ by: 'b', say: "We can just sit here. We don't have to talk." }, { by: 'a', say: "Good." }] },
    { id: 'vs.c8', turns: [{ by: 'a', dr: "Everyone's watching {b} and me sit here in silence. They'll read into it either way." }] },
    { id: 'vs.c9', turns: [{ by: 'b', say: "Are you okay?" }, { by: 'a', say: "Fine. You?" }, { by: 'b', say: "Fine." }, { by: 'b', dr: "We're both lying." }] },
    { id: 'vs.c10', turns: [{ by: 'a', say: "Is this seat taken?" }, { by: 'b', say: "No." }, { beat: '{a} sits down. {b} does not look up.' }] },
    { id: 'vs.c11', turns: [{ by: 'b', dr: "{a} walked in, saw me, and nearly walked straight back out. Nearly." }] },
  ],
  'venue.corner.hidden': [
    { id: 'vc.h1', turns: [{ by: 'a', say: "Who's your target this week?" }, { by: 'b', say: "You first." }, { by: 'a', say: "Same time?" }, { beat: 'They say the same name at the same time.' }] },
    { id: 'vc.h2', turns: [{ by: 'a', say: "What did the HOH tell you?" }, { by: 'b', say: "That I'm safe." }, { by: 'a', say: "Funny. I was told the same thing, word for word." }, { by: 'b', say: "Then one of us is being lied to." }] },
    { id: 'vc.h3', turns: [{ by: 'a', say: "Can I trust your vote this week?" }, { by: 'b', say: "Yes. As long as this stays between us." }, { by: 'a', say: "It stays between us." }] },
    { id: 'vc.h4', turns: [{ by: 'a', dr: "{b} and I finally got five minutes alone. We're on the same page. Nobody else needs to know." }] },
    { id: 'vc.h5', turns: [{ by: 'b', say: "We should go back separately." }, { by: 'a', say: "You go first. I'll wait a few minutes." }] },
    { id: 'vc.h6', turns: [{ by: 'a', say: "Quick, before someone comes in." }, { by: 'b', say: "Go." }, { by: 'a', say: "If either of us wins, the other one's safe. Deal?" }, { by: 'b', say: "Deal." }] },
    { id: 'vc.h7', turns: [{ by: 'b', say: "Nobody saw us come in here, right?" }, { by: 'a', say: "I don't think so." }, { by: 'b', say: "Good." }] },
    { id: 'vc.h8', turns: [{ by: 'a', say: "I don't want anyone else to know we talk." }, { by: 'b', say: "Nor do I. It's better that way." }] },
    { id: 'vc.h9', when: { third: true }, turns: [{ by: 'c', dr: "{a} came back first. {b} came back a few minutes later. I don't know what that was about, but it was something." }] },
    { id: 'vc.h10', turns: [{ by: 'a', dr: "There's one spot in this place nobody goes. That's where {b} and I talk." }] },
  ],
  'venue.corner.exposed': [
    { id: 'vc.e1', turns: [{ by: 'a', say: "There's nowhere private in this place." }, { by: 'b', say: "Then we keep it short." }, { by: 'a', say: "And quiet." }] },
    { id: 'vc.e2', turns: [{ by: 'b', dr: "{a} and I talked for two minutes. By dinner, everyone was asking what we'd talked about." }] },
    { id: 'vc.e3', turns: [{ by: 'a', say: "Everyone's watching us." }, { by: 'b', say: "Then laugh. Make it look like we're joking." }, { by: 'a', say: "Ha ha. Okay. Who's going this week?" }] },
    { id: 'vc.e4', turns: [{ by: 'a', say: "Can we talk somewhere?" }, { by: 'b', say: "Where? There's nowhere." }, { by: 'a', say: "Fine. Here, then. Quietly." }] },
    { id: 'vc.e5', turns: [{ by: 'a', dr: "You can't hide a conversation in here. Nobody heard what we said, but everybody saw us say it." }] },
    { id: 'vc.e6', when: { third: true }, turns: [{ by: 'c', dr: "{a} and {b} went off on their own. In here, that's basically a public announcement." }] },
  ],
  'venue.atmos.any': [
    { id: 'va.1', turns: [{ beat: 'The live feeds cut out for a minute.' }, { by: 'a', say: "Do you think they heard that?" }, { by: 'b', say: "They hear everything." }] },
    { id: 'va.2', turns: [{ beat: 'Lockdown is called. Everyone has to stay inside for an hour.' }, { by: 'a', say: "What do you think they're building out there?" }, { by: 'b', say: "Something I'm going to fall off." }] },
    { id: 'va.3', turns: [{ by: 'a', say: "What time is it?" }, { by: 'b', say: "No idea. There are no clocks in here." }, { by: 'a', say: "I hate that." }] },
    { id: 'va.4', turns: [{ beat: '{a} and {b} lie on the floor, staring at the ceiling.' }, { by: 'b', say: "Do you ever forget there are cameras?" }, { by: 'a', say: "Every day. Then I remember." }] },
    { id: 'va.5', turns: [{ by: 'a', say: "Someone's been in the Diary Room for ages." }, { by: 'b', say: "I noticed." }, { by: 'a', say: "Who is it?" }, { by: 'b', say: "No idea. That's what worries me." }] },
    { id: 'va.6', turns: [{ by: 'a', say: "I can't remember what day it is." }, { by: 'b', say: "Wednesday. I think." }, { by: 'a', say: "You think?" }, { by: 'b', say: "It might be Thursday." }] },
    { id: 'va.7', turns: [{ by: 'b', say: "Do you miss your phone?" }, { by: 'a', say: "Every second of every day." }] },
    { id: 'va.8', turns: [{ by: 'a', say: "I wonder what people at home think of me." }, { by: 'b', say: "Probably that you talk too much in the Diary Room." }, { by: 'a', say: "...Fair." }] },
    { id: 'va.9', turns: [{ beat: 'The lights go off at the usual time.' }, { by: 'a', say: "Night." }, { by: 'b', say: "Night. Don't plot anything." }, { by: 'a', say: "No promises." }] },
  ],
  'venue.atmos.house': [
    { id: 'vh.1', turns: [{ by: 'a', say: "This house is so quiet at night." }, { by: 'b', say: "Too quiet. You can hear every whisper." }] },
    { id: 'vh.2', turns: [{ by: 'a', say: "The HOH room door just closed." }, { by: 'b', say: "Who went in?" }, { by: 'a', say: "I didn't see." }, { by: 'b', say: "Neither did I. That's annoying." }] },
    { id: 'vh.3', turns: [{ by: 'a', say: "The backyard's open again." }, { by: 'b', say: "Finally. Two days stuck inside was too long." }] },
    { id: 'vh.4', turns: [{ by: 'a', say: "There's a camera in every room of this house. Even the bathroom." }, { by: 'b', say: "Don't remind me." }] },
    { id: 'vh.5', turns: [{ by: 'b', say: "Have you noticed everyone sits in the same seats every night?" }, { by: 'a', say: "Yep. And I know exactly why." }] },
    { id: 'vh.6', turns: [{ by: 'a', say: "I've learned which stairs creak." }, { by: 'b', say: "Why?" }, { by: 'a', say: "So I can hear who goes up to the HOH room at night." }] },
    { id: 'vh.7', turns: [{ by: 'a', say: "The house gets quieter every week." }, { by: 'b', say: "That's because there are fewer of us." }] },
    { id: 'vh.8', turns: [{ by: 'a', say: "Someone left the fridge open again." }, { by: 'b', say: "It's always the same person." }, { by: 'a', say: "Who?" }, { by: 'b', say: "I'm not saying. But you know." }] },
    { id: 'vh.9', turns: [{ by: 'a', say: "I hate the memory wall." }, { by: 'b', say: "Why?" }, { by: 'a', say: "Every week, another face goes grey." }] },
  ],
  'venue.atmos.compound': [
    { id: 'vm.1', turns: [{ by: 'a', say: "These lights are on all the time." }, { by: 'b', say: "I haven't slept properly in a week." }] },
    { id: 'vm.2', turns: [{ by: 'a', say: "There's nowhere to talk in here without being seen." }, { by: 'b', say: "So let's walk laps. At least nobody can hear us." }] },
    { id: 'vm.3', turns: [{ by: 'a', say: "The water's cold again." }, { by: 'b', say: "It's always cold." }, { by: 'a', say: "I miss hot showers more than I miss my bed." }] },
    { id: 'vm.4', turns: [{ by: 'b', say: "Someone's been scratching marks into the wall by the bunks." }, { by: 'a', say: "Counting days?" }, { by: 'b', say: "Counting something." }] },
    { id: 'vm.5', turns: [{ by: 'a', say: "The food's run out again." }, { by: 'b', say: "Split what's left?" }, { by: 'a', say: "Half each. Deal." }] },
    { id: 'vm.6', turns: [{ by: 'a', say: "I didn't think I'd miss a sofa this much." }, { by: 'b', say: "I'd do anything for a cushion." }] },
  ],
  'venue.atmos.resort': [
    { id: 'vr.1', turns: [{ by: 'a', say: "I could get used to this." }, { by: 'b', say: "Don't. People who get comfortable go home." }] },
    { id: 'vr.2', turns: [{ by: 'a', say: "It's so hot. I can't think." }, { by: 'b', say: "That's when people say things they shouldn't." }] },
    { id: 'vr.3', when: { room: ['backyard'] }, turns: [{ beat: '{a} and {b} float at opposite ends of the pool in the backyard.' }, { by: 'a', say: "Can you hear me?" }, { by: 'b', say: "Barely." }, { by: 'a', say: "Good. Neither can anyone else." }] },
    { id: 'vr.4', turns: [{ by: 'b', say: "This doesn't feel like a game out here." }, { by: 'a', say: "That's exactly why it's dangerous." }] },
    { id: 'vr.5', turns: [{ by: 'a', say: "Everyone's by the pool. Nobody's watching us." }, { by: 'b', say: "Then talk fast." }] },
    { id: 'vr.6', turns: [{ by: 'a', say: "Look at that sunset." }, { by: 'b', say: "I'm too busy looking at who's sitting with who." }] },
  ],
  'venue.atmos.manor': [
    { id: 'vn.1', turns: [{ by: 'a', say: "Did you hear that door?" }, { by: 'b', say: "Someone's in the east wing." }, { by: 'a', say: "Who?" }, { by: 'b', say: "I don't know. And I'm not going to check." }] },
    { id: 'vn.2', turns: [{ by: 'a', say: "This house is freezing." }, { by: 'b', say: "Come and sit by the fire." }] },
    { id: 'vn.3', turns: [{ by: 'b', say: "There are so many rooms in here. You could disappear for hours." }, { by: 'a', say: "People do. That's the problem." }] },
    { id: 'vn.4', turns: [{ by: 'a', say: "I got lost on the way to the bathroom again." }, { by: 'b', say: "Same. This place is a maze." }] },
    { id: 'vn.5', turns: [{ by: 'a', say: "Nobody ever goes in the library." }, { by: 'b', say: "Exactly. That's why we should talk there." }] },
    { id: 'vn.6', turns: [{ by: 'a', say: "This place creaks all night." }, { by: 'b', say: "I keep thinking it's someone walking around." }, { by: 'a', say: "Sometimes it is." }] },
  ],
  'venue.overlooked.noticed': [
    { id: 'vo.n1', turns: [{ by: 'b', say: "You've been quiet today." }, { by: 'a', say: "I'm fine." }, { beat: '{b} sits down next to {a} anyway.' }] },
    { id: 'vo.n2', turns: [{ by: 'b', say: "Want some company?" }, { by: 'a', say: "...Yeah. Actually, I do." }] },
    { id: 'vo.n3', turns: [{ by: 'a', dr: "Nobody had said a word to me all day. Then {b} came and sat with me. I won't forget that." }] },
    { id: 'vo.n4', turns: [{ by: 'b', say: "Come and sit with us." }, { by: 'a', say: "Are you sure?" }, { by: 'b', say: "Of course I'm sure." }] },
    { id: 'vo.n5', turns: [{ by: 'b', dr: "I realised nobody had spoken to {a} all day. That's not right. So I went and talked to {a.obj}." }] },
    { id: 'vo.n6', turns: [{ by: 'b', say: "Hey. How are you doing?" }, { by: 'a', say: "You're the first person to ask me that today." }] },
  ],
  'venue.overlooked.missed': [
    { id: 'vo.m1', turns: [{ by: 'a', dr: "I've been in every room today and in none of the conversations. Nobody asks me anything." }] },
    { id: 'vo.m2', turns: [{ by: 'a', dr: "Everybody agrees with me. Nobody asks me what I think." }] },
    { id: 'vo.m3', turns: [{ beat: '{a} eats alone while the rest of the house laughs in the next room.' }, { by: 'a', dr: "I'm not sad. I'm just... here." }] },
    { id: 'vo.m4', turns: [{ by: 'a', dr: "Nobody's noticed how little anyone has talked to me this week. Maybe that's good. Maybe it's not." }] },
    { id: 'vo.m5', turns: [{ by: 'a', dr: "People forget I'm here. In this game, that could save me. Or it could mean nobody fights for me." }] },
    { id: 'vo.m6', turns: [{ by: 'a', dr: "I said good morning to three people today. One of them said it back." }] },
  ],
};
