// ══════════════════════════════════════════════════════════════════════
// td/script/lines/alliance.js — talking game, cracks, and alliances forming
// ══════════════════════════════════════════════════════════════════════
//
// talk.game.any      — {a} and {b} talk strategy (strategicTalk). Nothing is
//                      promised; they compare reads.
// talk.approach.outside — {a}, outside or at the bottom of their alliance, sounds
//                      out {b}, who is not in it, about another path (strategicApproach).
// talk.approach.inside  — {b} is in the same alliance: {a} sounds {b} out about
//                      the two of them, for when the group falls apart.
// alliance.crack.any — inside {group}, {a} starts to doubt {b}.
// alliance.form.<ending> — {group} is born, and the scene ends on its name
//   (the viewer's title card). 'pitch': {a} recruits {b} (and {c} when
//   third: true; anyone past them is {more}). 'couple': {a} and {b} have been
//   close all game. 'enemy': they share an enemy, {target}. 'survival': both on
//   the bottom. 'struggle': both nearly went home at a vote. 'coach': {a} is the
//   coach of {b}.
// Optional names: {more}, and the context reasons. Ids: 'al.'.
const GAME = [
  { id: 'al.g1', turns: [
    { beat: '{a} and {b} are sitting on a log, splitting the last of the trail mix.' },
    { by: 'a', say: "Okay. Real talk. Who's running this place?" },
    { by: 'b', say: "Honestly? Nobody. That's the scary part." },
    { by: 'a', say: "Somebody always is. They're just good at hiding it." },
    { by: 'b', say: "Great. Now I'm going to be paranoid all night." },
  ] },
  { id: 'al.g2', turns: [
    { by: 'a', say: "Can I ask you something? Where's your head at?" },
    { by: 'b', say: "About the game? Everywhere. Why, where's yours?" },
    { by: 'a', say: "Same place. I just wanted to know I'm not the only one panicking." },
    { by: 'b', say: "You're definitely not the only one." },
  ] },
  { id: 'al.g3', when: { threat: true }, turns: [
    { by: 'a', say: "We have to talk about {threat}." },
    { by: 'b', say: "Do we? {threat}'s winning us challenges." },
    { by: 'a', say: "For now. And then one day there are no more teams, and {threat} wins everything." },
    { by: 'b', say: "...Okay, yeah. That's a problem." },
    { by: 'a', say: "Not today. But soon." },
  ] },
  { id: 'al.g4', when: { rival: true }, turns: [
    { by: 'a', say: "Be honest. Does {rival} ever talk about me?" },
    { by: 'b', say: "Do you want the honest answer or the nice answer?" },
    { by: 'a', say: "Ugh. The honest one." },
    { by: 'b', say: "Yeah. A lot. And not nicely." },
    { by: 'a', say: "Right. Good to know where I stand." },
  ] },
  { id: 'al.g5', when: { lastBoot: true }, turns: [
    { by: 'b', say: "I still don't get why {lastBoot} went." },
    { by: 'a', say: "Because {lastBoot} was talking to everyone, and everyone noticed." },
    { by: 'b', say: "So we just don't talk to anyone?" },
    { by: 'a', say: "No. We talk to the right people. Like each other." },
  ] },
  { id: 'al.g6', when: { weak: true, merged: false }, turns: [
    { by: 'a', say: "If we lose again, it's {weak}. Right?" },
    { by: 'b', say: "Probably. Unless somebody does something stupid." },
    { by: 'a', say: "Somebody always does something stupid." },
    { by: 'b', say: "Then let's make sure it's not us." },
  ] },
  { id: 'al.g7', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Want to know what I've figured out?" },
    { by: 'b', say: "Do I have a choice?" },
    { by: 'a', say: "Everyone here thinks they're in the majority. They can't all be right." },
    { by: 'b', say: "So who's wrong?" },
    { by: 'a', say: "That's what we're going to find out. Together, I hope." },
  ] },
  { id: 'al.g8', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm sick of everyone whispering. Let's just say it. What's the plan?" },
    { by: 'b', say: "Shh! There's no plan. Not yet." },
    { by: 'a', say: "Then let's MAKE one!" },
    { by: 'b', say: "Quietly. Let's make one quietly." },
  ] },
  { id: 'al.g9', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Have you noticed who sits with who at dinner?" },
    { by: 'b', say: "Not really. Should I have?" },
    { by: 'a', say: "Watch where the votes go. That's the real alliance, right there." },
    { by: 'b', say: "You're kind of scary, you know that?" },
  ] },
  { id: 'al.g10', turns: [
    { beat: '{a} and {b} are supposed to be collecting water. They are not collecting water.' },
    { by: 'b', say: "We should probably fill these." },
    { by: 'a', say: "In a minute. Who do you trust here? Like, actually trust?" },
    { by: 'b', say: "Short list. You're on it." },
    { by: 'a', say: "Good. You're on mine too." },
  ] },
  { id: 'al.g11', turns: [
    { by: 'a', say: "Okay, let's go through everyone. Who's with who?" },
    { by: 'b', say: "Right now? Ask me again tomorrow, it'll all be different." },
    { by: 'a', say: "That's why I'm asking today." },
    { by: 'b', say: "Fine. Get comfortable. This is going to take a while." },
  ] },
];

const APPROACH = [
  { id: 'al.p1', when: { allied: true }, turns: [
    { by: 'a', say: "Can I tell you something, and you won't run off and repeat it?" },
    { by: 'b', say: "Depends what it is." },
    { by: 'a', say: "I'm not happy where I am in this game. I think I'm at the bottom of my group." },
    { by: 'b', say: "And you're telling ME this because...?" },
    { by: 'a', say: "Because I'd rather be on the top of something new." },
  ] },
  { id: 'al.p2', turns: [
    { beat: '{a} waits until {b} is alone, then sits down next to {b.obj}.' },
    { by: 'a', say: "We don't really talk, do we?" },
    { by: 'b', say: "Not really. Why?" },
    { by: 'a', say: "Maybe we should. Things are changing, and I'd like to have some options." },
    { by: 'b', say: "Options. Okay. I'm listening." },
  ] },
  { id: 'al.p3', when: { allied: true }, turns: [
    { by: 'b', say: "Aren't you supposed to be with your people right now?" },
    { by: 'a', say: "My people aren't exactly treating me like one of their people." },
    { by: 'b', say: "Ouch." },
    { by: 'a', say: "Yeah. So I'm looking around. Just looking." },
  ] },
  { id: 'al.p4', when: { register: 'schemer', allied: true }, turns: [
    { by: 'a', say: "I'm going to be honest, because I think you'd see through anything else." },
    { by: 'b', say: "Flattery. Great start." },
    { by: 'a', say: "My group's going to cut me loose eventually. When they do, I want somewhere to land." },
    { by: 'b', say: "And you think that's me." },
    { by: 'a', say: "I think it could be." },
  ] },
  { id: 'al.p5', when: { rival: true }, turns: [
    { by: 'a', say: "Can I ask you something? Do you trust {rival}?" },
    { by: 'b', say: "Not really. Why?" },
    { by: 'a', say: "Neither do I. And {rival} has way too much say over what happens to me." },
    { by: 'b', say: "So what are you thinking?" },
    { by: 'a', say: "I'm thinking we keep talking." },
  ] },
  { id: 'al.p6', when: { register: 'shy', allied: true }, turns: [
    { by: 'a', say: "Um. Hi. Can I talk to you about the game? I'm not very good at this part." },
    { by: 'b', say: "Nobody's good at this part. Go on." },
    { by: 'a', say: "I don't think my group cares about me that much. I'd like to have someone who does." },
    { by: 'b', say: "That's actually really honest. Okay. Let's talk." },
  ] },
  { id: 'al.p7', turns: [
    { by: 'a', say: "Hypothetically. If I needed somewhere to go, would there be a spot for me?" },
    { by: 'b', say: "Hypothetically?" },
    { by: 'a', say: "Hypothetically." },
    { by: 'b', say: "Hypothetically, maybe. Come back when it's not hypothetical." },
  ] },
  { id: 'al.p8', when: { merged: true }, turns: [
    { by: 'a', say: "Now that the teams are gone, I don't have to stick with my old team, right?" },
    { by: 'b', say: "That's kind of the point of a merge." },
    { by: 'a', say: "Then I'd like to get to know you better. Game-wise." },
    { by: 'b', say: "Game-wise. Okay. Sure." },
  ] },
  { id: 'al.p9', when: { allied: true }, turns: [
    { by: 'b', say: "Why do you keep looking over at your group like that?" },
    { by: 'a', say: "Because I'm checking they're not looking over at me." },
    { by: 'b', say: "That doesn't sound like a very happy group." },
    { by: 'a', say: "It isn't. Which is why I'm over here, talking to you." },
  ] },
  { id: 'al.p10', turns: [
    { beat: '{a} offers to help {b} carry firewood, which {a} has never done before.' },
    { by: 'b', say: "Okay, what do you want?" },
    { by: 'a', say: "Can't I just be helpful?" },
    { by: 'b', say: "No. Nobody here is just helpful." },
    { by: 'a', say: "Fine. I want to know if you'd ever work with me. Down the line." },
    { by: 'b', say: "Down the line. Maybe. Keep carrying." },
  ] },
  { id: 'al.p11', when: { threat: true }, turns: [
    { by: 'a', say: "Can I be honest? Everybody's too busy cheering for {threat} to think straight." },
    { by: 'b', say: "And you're not?" },
    { by: 'a', say: "I'm thinking about what happens when {threat} doesn't need us anymore." },
    { by: 'b', say: "Huh. That's actually a good point." },
  ] },
  { id: 'al.p12', when: { register: 'fiery', allied: true }, turns: [
    { by: 'a', say: "I'm going to be blunt. My alliance is useless and I'm shopping around." },
    { by: 'b', say: "Wow. Very subtle." },
    { by: 'a', say: "I don't do subtle. Are you interested or not?" },
    { by: 'b', say: "Maybe. Don't shout about it." },
  ] },
  { id: 'al.p13', turns: [
    { by: 'a', say: "If things went bad for me, would you be someone I could come to?" },
    { by: 'b', say: "Things going bad for you? Since when?" },
    { by: 'a', say: "Not yet. I'm just planning ahead." },
    { by: 'b', say: "Okay. Then yeah. Maybe. Ask me again when it happens." },
  ] },
  { id: 'al.p14', when: { band: 'friends', allied: true, alliedB: true }, turns: [
    { by: 'a', say: "We get along really well, right?" },
    { by: 'b', say: "Of course we do." },
    { by: 'a', say: "So why are we in different alliances? That's so dumb." },
    { by: 'b', say: "...Okay, it is a bit dumb." },
    { by: 'a', say: "Let's think about fixing that." },
  ] },
  { id: 'al.p15', when: { allied: false }, turns: [
    { by: 'a', say: "Can I ask you something? Is it obvious I don't have an alliance?" },
    { by: 'b', say: "Kind of, yeah." },
    { by: 'a', say: "Great. So, do you want to fix that with me, or should I keep asking around?" },
    { by: 'b', say: "Don't ask around. Let's talk." },
  ] },
  { id: 'al.p16', when: { allied: false }, turns: [
    { by: 'a', say: "Everybody's paired up except me. It's like gym class all over again." },
    { by: 'b', say: "That's rough." },
    { by: 'a', say: "So pick me. Before somebody else does." },
    { by: 'b', say: "Nobody else is going to pick you." },
    { by: 'a', say: "Exactly, so you'd be getting a bargain." },
    { by: 'b', say: "...Fine. Let's talk later." },
  ] },
  { id: 'al.p17', when: { allied: false }, turns: [
    { beat: '{a} sits down next to {b} at the edge of camp.' },
    { by: 'a', say: "I've been on my own this whole time. I'm done with that." },
    { by: 'b', say: "And you came to me because...?" },
    { by: 'a', say: "Because you're the only one who hasn't looked at me like I'm the next vote." },
    { by: 'b', say: "Fair enough. I'm listening." },
  ] },
  { id: 'al.p18', when: { allied: false, alliedB: true }, turns: [
    { by: 'a', say: "Your group seems pretty solid." },
    { by: 'b', say: "It's alright. Why?" },
    { by: 'a', say: "Is there room in it? For one more?" },
    { by: 'b', say: "That's not just my decision." },
    { by: 'a', say: "Then put in a good word. Please." },
  ] },
  { id: 'al.p19', when: { allied: false, register: 'schemer' }, turns: [
    { by: 'a', say: "Everyone thinks I'm alone out here. That makes me the perfect secret weapon." },
    { by: 'b', say: "A secret weapon for who?" },
    { by: 'a', say: "For whoever's smart enough to pick me up. Like you." },
    { by: 'b', say: "Smooth. I'll think about it." },
  ] },
];

const APPROACH_INSIDE = [
  { id: 'al.i1', turns: [
    { by: 'a', say: "Can I say something about our group without you running off to tell everyone?" },
    { by: 'b', say: "Depends what it is." },
    { by: 'a', say: "I don't think it lasts. And when it falls apart, I want to know you and I are still okay." },
    { by: 'b', say: "That's a dark thought." },
    { by: 'a', say: "It's a realistic one." },
  ] },
  { id: 'al.i2', turns: [
    { by: 'a', say: "Do you ever feel like we're the bottom of the group?" },
    { by: 'b', say: "All the time." },
    { by: 'a', say: "Then maybe the bottom should look out for each other. Quietly." },
    { by: 'b', say: "Quietly. Yeah. I like that." },
  ] },
  { id: 'al.i3', turns: [
    { beat: '{a} waits until the rest of the alliance is out of earshot.' },
    { by: 'a', say: "Okay. Between us. Who in our group do you actually trust?" },
    { by: 'b', say: "That's a dangerous question." },
    { by: 'a', say: "I know. That's why I'm only asking you." },
    { by: 'b', say: "...You. Mostly you." },
  ] },
  { id: 'al.i4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Our alliance is going to eat itself eventually. They always do." },
    { by: 'b', say: "Wow. Cheerful." },
    { by: 'a', say: "When it happens, I'd like to be standing next to you, not across from you." },
    { by: 'b', say: "Noted. I'll think about it." },
  ] },
  { id: 'al.i5', turns: [
    { by: 'b', say: "Why are we whispering? We're in the same alliance." },
    { by: 'a', say: "Exactly. Which is why nobody else in it should hear this." },
    { by: 'b', say: "Okay, now I'm nervous." },
    { by: 'a', say: "Don't be. I just want a backup plan. And I want it to be you." },
  ] },
  { id: 'al.i6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm sick of the others making every decision for us." },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "Fine. But you feel it too, right?" },
    { by: 'b', say: "...Yeah. I feel it." },
    { by: 'a', say: "Then we stick together. Inside the group, and outside it." },
  ] },
];

const CRACK = [
  { id: 'al.c1', turns: [
    { by: 'a', conf: "{b} and I are both in {group}. So why does {b} keep having conversations I'm not part of?" },
    { by: 'a', conf: "I'm not paranoid. I'm paying attention. There's a difference." },
  ] },
  { id: 'al.c2', turns: [
    { by: 'a', say: "Where were you this morning?" },
    { by: 'b', say: "Getting water. Why?" },
    { by: 'a', say: "Took you a long time." },
    { by: 'b', say: "It's a long walk. What's your problem?" },
    { by: 'a', conf: "{b} was gone for an hour. Nobody needs an hour to get water. {group} has a leak." },
  ] },
  { id: 'al.c3', turns: [
    { by: 'b', say: "Hey, you okay? You've been quiet." },
    { by: 'a', say: "I'm fine." },
    { by: 'b', say: "You don't seem fine." },
    { by: 'a', say: "Then maybe you should ask yourself why." },
    { beat: '{a} walks off. {b} looks confused.' },
  ] },
  { id: 'al.c4', turns: [
    { by: 'a', say: "Are we still good? You and me, in {group}?" },
    { by: 'b', say: "Of course. Why would you even ask that?" },
    { by: 'a', say: "Because you've been acting different." },
    { by: 'b', say: "I've been acting tired. There's a difference." },
    { by: 'a', conf: "I want to believe {b}. I really do. I'm just not sure I can." },
  ] },
  { id: 'al.c5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If you're going to flip on {group}, just tell me now." },
    { by: 'b', say: "What?! Where did that even come from?" },
    { by: 'a', say: "From watching you all day!" },
    { by: 'b', say: "You're being crazy." },
    { by: 'a', say: "Maybe. Or maybe I'm right." },
  ] },
  { id: 'al.c6', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{b} told me one thing about the vote this morning. Then told someone else something different." },
    { by: 'a', conf: "I'm not saying anything yet. I'm just watching {b} a lot more closely." },
  ] },
  { id: 'al.c7', turns: [
    { by: 'a', say: "I told you something yesterday. Just you." },
    { by: 'b', say: "Okay...?" },
    { by: 'a', say: "And today somebody else knew it." },
    { by: 'b', say: "It wasn't me!" },
    { by: 'a', say: "Then who was it?" },
  ] },
  { id: 'al.c8', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I love {group}. I do. But {b} has been really distant with me." },
    { by: 'a', conf: "I hope I'm wrong about this. I really hope I'm wrong." },
  ] },
];

const FORM_PITCH = [
  { id: 'al.f1', when: { third: false }, turns: [
    { beat: '{a} pulls {b} away from the others, where nobody can hear them.' },
    { by: 'a', say: "Okay. I'll keep this short. Everyone here is making alliances, and we're not in any of them." },
    { by: 'b', say: "Speak for yourself." },
    { by: 'a', say: "Fine. Then are you in one?" },
    { by: 'b', say: "...No." },
    { by: 'a', say: "Then we start our own. We'll call it {group}." },
    { by: 'b', say: "{group}. Okay. I'm in." },
  ] },
  { id: 'al.f2', when: { third: true, more: false }, turns: [
    { by: 'a', say: "Thanks for coming. Both of you." },
    { by: 'c', say: "Is this a secret meeting? It feels like a secret meeting." },
    { by: 'a', say: "It's an alliance. Us three. We vote together, we protect each other." },
    { by: 'b', say: "Why us three?" },
    { by: 'a', say: "Because none of us are anyone's first choice right now. Together, we're everybody's problem." },
    { by: 'c', say: "Okay, I like that. What do we call it?" },
    { by: 'a', say: "{group}." },
  ] },
  { id: 'al.f3', when: { third: false }, turns: [
    { by: 'a', say: "I've been watching who's working with who. And I think you and I should be working together." },
    { by: 'b', say: "That's a big jump from 'hi'." },
    { by: 'a', say: "I don't have time for 'hi'. Are you in or not?" },
    { by: 'b', say: "In what, exactly?" },
    { by: 'a', say: "{group}. Our alliance. As of right now." },
    { by: 'b', say: "Fine. I'm in. But I want a say in things." },
  ] },
  { id: 'al.f4', when: { third: true, more: false }, turns: [
    { beat: '{a}, {b} and {c} huddle together at the far end of camp.' },
    { by: 'b', say: "So what's this about?" },
    { by: 'a', say: "This is about the three of us making it further than everybody else." },
    { by: 'c', say: "I'm listening." },
    { by: 'a', say: "We stick together, we vote together. Nobody outside this circle knows about it." },
    { by: 'b', say: "Does it have a name?" },
    { by: 'a', say: "It does now. {group}." },
  ] },
  { id: 'al.f5', when: { register: 'schemer', third: false }, turns: [
    { by: 'a', say: "Let me explain how this works. You need protection. I need numbers." },
    { by: 'b', say: "That's very romantic." },
    { by: 'a', say: "It's not romance, it's an alliance. {group}. Take it or leave it." },
    { by: 'b', say: "...I'll take it." },
    { by: 'a', conf: "{group} is officially born. And I'm officially in charge of it. They just don't know that second part." },
  ] },
  { id: 'al.f6', when: { more: true, third: true }, turns: [
    { by: 'a', say: "Okay, everyone's here. Me, you, {c}, and {more}." },
    { by: 'b', say: "That's a lot of people for a secret." },
    { by: 'a', say: "Exactly. That's a lot of votes." },
    { by: 'c', say: "So what are we?" },
    { by: 'a', say: "We're {group}. And we're the biggest thing in this game." },
  ] },
  { id: 'al.f7', when: { register: 'sweet', third: false }, turns: [
    { by: 'a', say: "I don't want to do this game alone. Do you?" },
    { by: 'b', say: "Honestly? No. It's exhausting." },
    { by: 'a', say: "Then let's not. Let's be an alliance. A real one. {group}." },
    { by: 'b', say: "{group}. I love it." },
    { beat: 'They hug it out.' },
  ] },
  { id: 'al.f8', when: { third: false }, turns: [
    { by: 'b', say: "Why did you drag me all the way out here?" },
    { by: 'a', say: "Because I want to make an alliance, and I want it to be with you." },
    { by: 'b', say: "Seriously? You could've just asked at camp." },
    { by: 'a', say: "Where everyone can hear? No way. So, are you in?" },
    { by: 'b', say: "Yeah. I'm in." },
    { by: 'a', say: "Then welcome to {group}." },
  ] },
  { id: 'al.f9', when: { third: true, more: false }, turns: [
    { by: 'a', say: "I've been watching you two. You're the only ones here who make sense to me." },
    { by: 'b', say: "Is that a compliment?" },
    { by: 'c', say: "I think it's a compliment." },
    { by: 'a', say: "It's an offer. The three of us, voting together. Starting now." },
    { by: 'b', say: "Okay, I'm in. Does it have a name?" },
    { by: 'a', say: "{group}." },
    { by: 'c', say: "{group}. Love it." },
  ] },
  { id: 'al.f10', when: { more: true, third: true }, turns: [
    { beat: '{a} waits until {b}, {c} and {more} have all crept down to the meeting spot.' },
    { by: 'b', say: "This is a lot of people for a secret meeting." },
    { by: 'a', say: "Which is exactly why nobody will be able to touch us." },
    { by: 'c', say: "So we're an alliance? All of us?" },
    { by: 'a', say: "All of us. {group}." },
  ] },
  { id: 'al.f11', when: { more: true, third: true }, turns: [
    { by: 'a', say: "Okay, everybody listen. Me, {b}, {c} and {more}. Count us." },
    { by: 'c', say: "That's... actually a majority." },
    { by: 'a', say: "Exactly. If we stick together, we decide every vote from now on." },
    { by: 'b', say: "And what are we called?" },
    { by: 'a', say: "{group}. Hands in." },
    { beat: 'Everyone puts a hand in.' },
  ] },
  { id: 'al.f12', when: { third: false }, turns: [
    { beat: '{a} and {b} are on firewood duty together, which is the only privacy anyone gets around here.' },
    { by: 'a', say: "I've been thinking. We should be a team. Like, officially." },
    { by: 'b', say: "Over a pile of sticks? Romantic." },
    { by: 'a', say: "I'm serious. Everyone else has someone. We should have each other." },
    { by: 'b', say: "Okay. Fine. But we need a name." },
    { by: 'a', say: "{group}." },
    { by: 'b', say: "{group}. Done. Now grab that log." },
  ] },
  { id: 'al.f13', when: { third: false }, turns: [
    { by: 'b', say: "Why are you looking at me like you're about to propose?" },
    { by: 'a', say: "Because I kind of am. An alliance. You and me." },
    { by: 'b', say: "That's a relief. I thought it was something weirder." },
    { by: 'a', say: "So is that a yes?" },
    { by: 'b', say: "That's a yes. What are we called?" },
    { by: 'a', say: "{group}." },
  ] },
  { id: 'al.f14', when: { third: true, more: false }, turns: [
    { by: 'b', say: "Why are the three of us hiding behind a tree?" },
    { by: 'a', say: "Because what I'm about to say can't leave this tree." },
    { by: 'c', say: "Okay, that's dramatic. Go on." },
    { by: 'a', say: "We vote together. Every time. Nobody outside the three of us knows." },
    { by: 'b', say: "I'm in." },
    { by: 'c', say: "Me too. Name?" },
    { by: 'a', say: "{group}." },
  ] },
  { id: 'al.f15', when: { third: true, more: false }, turns: [
    { by: 'a', say: "I'll get straight to it. I want an alliance, and I want it to be you two." },
    { by: 'c', say: "Why us?" },
    { by: 'a', say: "Because you two actually keep your word. That's rare out here." },
    { by: 'b', say: "Okay. Flattery works on me. I'm in." },
    { by: 'c', say: "Fine, me too." },
    { by: 'a', say: "Then we're {group}." },
  ] },
];
const FORM_COUPLE = [
  { id: 'al.k1', turns: [
    { by: 'a', say: "You know we're basically an alliance already, right?" },
    { by: 'b', say: "I mean, we do everything together." },
    { by: 'a', say: "So let's just make it official." },
    { by: 'b', say: "Do official alliances get names?" },
    { by: 'a', say: "Ours does. {group}." },
    { by: 'b', say: "{group}. Okay, I like it." },
  ] },
  { id: 'al.k2', turns: [
    { by: 'a', say: "I trust you more than anybody here." },
    { by: 'b', say: "Same. It's not even close." },
    { by: 'a', say: "Then let's stop pretending we're not a team. {group}. You and me." },
    { by: 'b', say: "You and me." },
  ] },
  { id: 'al.k3', turns: [
    { beat: '{a} and {b} are lying in the grass, watching the clouds.' },
    { by: 'b', say: "Can I tell you something weird? You're the best part of this whole thing." },
    { by: 'a', say: "That's not weird. You're mine too." },
    { by: 'b', say: "So... alliance?" },
    { by: 'a', say: "Alliance. We need a name." },
    { by: 'b', say: "{group}." },
    { by: 'a', say: "Perfect." },
  ] },
  { id: 'al.k4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, everybody already thinks we're a team. Let's just be one." },
    { by: 'b', say: "Is that you asking me to be in an alliance?" },
    { by: 'a', say: "Yes! Obviously! Keep up!" },
    { by: 'b', say: "Fine. What do we call it?" },
    { by: 'a', say: "{group}. Done. Decided." },
  ] },
  { id: 'al.k5', turns: [
    { by: 'b', say: "We should probably have a name for whatever this is." },
    { by: 'a', say: "Whatever what is?" },
    { by: 'b', say: "Us. Sticking together. Voting together. You know." },
    { by: 'a', say: "Oh. {group}?" },
    { by: 'b', say: "{group}. Yeah. That works." },
  ] },
  { id: 'al.k6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "We've been working together all game. Let's make it real." },
    { by: 'b', say: "It already feels real." },
    { by: 'a', say: "Then let's give it a name. {group}." },
    { by: 'b', say: "{group}. You and me." },
    { by: 'a', conf: "{b} is the only person here I'd actually take to the end. Don't tell anyone I said that." },
  ] },
];
const FORM_ENEMY = [
  { id: 'al.e1', turns: [
    { by: 'a', say: "Can I say something kind of mean?" },
    { by: 'b', say: "Please do." },
    { by: 'a', say: "I can't stand {target}." },
    { by: 'b', say: "Oh, thank goodness. I thought it was just me." },
    { by: 'a', say: "So what if we did something about it? Together. Call it {group}." },
    { by: 'b', say: "{group}. I like the sound of that." },
  ] },
  { id: 'al.e2', turns: [
    { by: 'b', say: "Did you hear what {target} said at breakfast?" },
    { by: 'a', say: "I heard. I'm still annoyed about it." },
    { by: 'b', say: "{target} has to go." },
    { by: 'a', say: "Agreed. And we're the ones who are going to make it happen. {group}, starting now." },
  ] },
  { id: 'al.e3', turns: [
    { by: 'a', say: "We don't have a lot in common. But we both have a {target} problem." },
    { by: 'b', say: "That we do." },
    { by: 'a', say: "Then let's team up until it's solved." },
    { by: 'b', say: "And after?" },
    { by: 'a', say: "We'll figure that out. For now, we're {group}." },
  ] },
  { id: 'al.e4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If I have to listen to {target} for one more day, I'm going to lose it." },
    { by: 'b', say: "Then let's make sure you don't have to." },
    { by: 'a', say: "Wait, are you serious?" },
    { by: 'b', say: "Dead serious. You, me, and one goal: {target} goes home." },
    { by: 'a', say: "Deal! We'll call it {group}." },
  ] },
  { id: 'al.e5', turns: [
    { by: 'a', conf: "Turns out {b} hates {target} as much as I do. Maybe more." },
    { by: 'a', say: "So we're doing this?" },
    { by: 'b', say: "We're doing this. {group}, against {target}." },
  ] },
  { id: 'al.e6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Here's what I know. {target} doesn't like you. {target} doesn't like me." },
    { by: 'b', say: "That's not exactly a secret." },
    { by: 'a', say: "So the smart thing is for us to stick together before {target} picks us off." },
    { by: 'b', say: "Okay. Fine. What's the alliance called?" },
    { by: 'a', say: "{group}." },
  ] },
];
const FORM_SURVIVAL = [
  { id: 'al.s1', turns: [
    { by: 'a', say: "Have you noticed nobody tells us anything?" },
    { by: 'b', say: "I noticed. I thought it was just me." },
    { by: 'a', say: "It's both of us. We're on the outside." },
    { by: 'b', say: "So what do we do?" },
    { by: 'a', say: "We stop being on the outside alone. {group}. Us two." },
    { by: 'b', say: "{group}. Okay. Better than nothing." },
  ] },
  { id: 'al.s2', turns: [
    { beat: '{a} finds {b} sitting by {b.ref}, away from everybody else.' },
    { by: 'a', say: "Everybody's got somebody here except us." },
    { by: 'b', say: "Thanks for reminding me." },
    { by: 'a', say: "I'm not reminding you. I'm asking. Want to have somebody?" },
    { by: 'b', say: "...Yeah. I do." },
    { by: 'a', say: "Then we're {group} now." },
  ] },
  { id: 'al.s3', turns: [
    { by: 'b', say: "I think I'm next." },
    { by: 'a', say: "Funny. I think I'm next." },
    { by: 'b', say: "We can't both be next." },
    { by: 'a', say: "We can if we don't do something. {group}. You and me. We look out for each other." },
    { by: 'b', say: "Deal." },
  ] },
  { id: 'al.s4', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um, I don't really have anyone here. Do you?" },
    { by: 'b', say: "Not really." },
    { by: 'a', say: "Would you want to... be a team? We could call it {group}." },
    { by: 'b', say: "{group}. Yeah. I'd like that a lot." },
  ] },
  { id: 'al.s5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm done being everyone's easy vote." },
    { by: 'b', say: "Same. Totally done." },
    { by: 'a', say: "Then we team up and make them work for it. {group}." },
    { by: 'b', say: "{group}. Let's go." },
  ] },
  { id: 'al.s6', turns: [
    { by: 'a', conf: "Nobody wants me in their alliance. So I made my own. With {b}, who also has nobody." },
    { by: 'a', conf: "{group}. It's small. But it's ours." },
  ] },
];
const FORM_STRUGGLE = [
  { id: 'al.t1', turns: [
    { by: 'a', say: "We both almost went home. Do you realise that?" },
    { by: 'b', say: "Trust me, I realise it every night." },
    { by: 'a', say: "Then let's make sure neither of us gets that close again. {group}. You and me." },
    { by: 'b', say: "{group}. Deal." },
  ] },
  { id: 'al.t2', turns: [
    { by: 'b', say: "How many votes did you get last time?" },
    { by: 'a', say: "Too many. You?" },
    { by: 'b', say: "Same." },
    { by: 'a', say: "Then we should stick together. People who almost went home are the only ones who get it." },
    { by: 'b', say: "Okay. Let's do it. What do we call it?" },
    { by: 'a', say: "{group}." },
  ] },
  { id: 'al.t3', turns: [
    { by: 'a', conf: "When your name gets read out at a vote, you find out who your friends are." },
    { by: 'a', say: "{b}, you've been there too. So let's be {group}. The people who aren't going home." },
    { by: 'b', say: "I like that. {group}." },
  ] },
  { id: 'al.t4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "They tried to get rid of both of us. And they failed." },
    { by: 'b', say: "Barely." },
    { by: 'a', say: "Barely counts! Now we get our revenge. Together. {group}." },
    { by: 'b', say: "{group}. I'm in." },
  ] },
  { id: 'al.t5', turns: [
    { by: 'b', say: "I keep thinking about the last vote." },
    { by: 'a', say: "Me too. They came so close." },
    { by: 'b', say: "To both of us." },
    { by: 'a', say: "So let's make it harder for them next time. {group}. We stick together." },
  ] },
  { id: 'al.t6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "You and I were both targets. That tells me who the majority wants gone." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And people the majority wants gone should be working together. {group}." },
    { by: 'b', say: "Makes sense. {group}." },
  ] },
];
const FORM_COACH = [
  { id: 'al.h1', turns: [
    { by: 'a', say: "All those training sessions. You know they weren't just about the challenges, right?" },
    { by: 'b', say: "I kind of figured." },
    { by: 'a', say: "Then let's make it official. {group}. I've got your back, and you've got mine." },
    { by: 'b', say: "{group}. Deal, coach." },
  ] },
  { id: 'al.h2', turns: [
    { by: 'b', say: "You've helped me more than anyone here." },
    { by: 'a', say: "Because you're worth helping. Want to make it a real alliance?" },
    { by: 'b', say: "With my coach? Is that even allowed?" },
    { by: 'a', say: "Nobody said it isn't. We'll call it {group}." },
  ] },
  { id: 'al.h3', turns: [
    { by: 'a', say: "I've put a lot of work into you. I'd hate to see someone vote you out." },
    { by: 'b', say: "Me too, honestly." },
    { by: 'a', say: "Then let's protect the investment. {group}. You and me." },
    { by: 'b', say: "{group}. I'm in." },
  ] },
  { id: 'al.h4', turns: [
    { by: 'b', say: "Are we just practising today, or...?" },
    { by: 'a', say: "Today we're talking about the game. I want us to be an alliance." },
    { by: 'b', say: "Seriously? Yes. Absolutely." },
    { by: 'a', say: "Then that's {group}." },
  ] },
  { id: 'al.h5', turns: [
    { by: 'a', conf: "{b} is my best student. Maybe my best friend here, too." },
    { by: 'a', say: "{b}, I want us to be {group}. Officially." },
    { by: 'b', say: "Officially. I love that." },
  ] },
  { id: 'al.h6', turns: [
    { by: 'b', say: "I keep getting better because of you." },
    { by: 'a', say: "And I keep getting votes because of you. Let's make it a team. {group}." },
    { by: 'b', say: "{group}. Let's do it." },
  ] },
];

export default {
  'talk.game.any': GAME,
  'talk.approach.outside': APPROACH,
  'talk.approach.inside': APPROACH_INSIDE,
  'alliance.crack.any': CRACK,
  'alliance.form.pitch': FORM_PITCH,
  'alliance.form.couple': FORM_COUPLE,
  'alliance.form.enemy': FORM_ENEMY,
  'alliance.form.survival': FORM_SURVIVAL,
  'alliance.form.struggle': FORM_STRUGGLE,
  'alliance.form.coach': FORM_COACH,
};

export const GUARANTEED = {
  'alliance.crack.any': ['group'],
  'alliance.form.pitch': ['group'],
  'alliance.form.couple': ['group'],
  'alliance.form.enemy': ['group'],
  'alliance.form.survival': ['group'],
  'alliance.form.struggle': ['group'],
  'alliance.form.coach': ['group'],
};
