// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/spine.js — the episode's spine: what every week airs
// ══════════════════════════════════════════════════════════════════════
//
// Scripts, not templates (manual §19.2). Each entry is one exchange: said out
// loud (say), a confessional (conf), a stage direction (beat). Parts: a, b, c,
// and tj (TJ Maxx, the host). The ENDING was decided by the engine before a
// word was picked; roles.js says who is who.
//
// TJ Maxx is a wacky MTV-2000s host (the user, 2026-10-14: Guy Fieri, Rob
// Dyrdek): loud, hyped, a nickname for everybody, delighted by chaos and
// wipeouts, with a real soft spot for anybody who fights and an outraged bit
// for quitters. Every line is his own; nothing is borrowed from a real host.
//
// The house rules for every line (docs/td-dialogue-style.md, the user's
// writing feedback): plain spoken English, joined thoughts, a reason said out
// loud, a confessional that says the feeling and why. Name the subject. Never
// a past the scene does not have.

export default {
  // ── move-in day ─────────────────────────────────────────────────────
  'arrival.reunion': [
    { id: 'ar.r1', turns: [
      { beat: '{a} drags a suitcase up the villa steps and stops dead at the sight of {b} by the pool.' },
      { by: 'a', say: 'No way. No way! {b}!' },
      { by: 'b', say: 'Get over here!' },
      { by: 'a', conf: "Seeing {b} walk in was a relief, honestly. We came from {show_a} together, so I've got at least one person in here who knows me." },
    ] },
    { id: 'ar.r2', turns: [
      { by: 'b', say: '{a}? Are you kidding me? You actually said yes to this?' },
      { by: 'a', say: 'Somebody from {show_a} had to show up and win it.' },
      { by: 'b', say: "Well, now there's two of us, so you're going to have to fight me for it." },
      { by: 'a', conf: "{b} and I go back. In a house full of strangers that matters, but I'm not going to pretend it guarantees anything." },
    ] },
    { id: 'ar.r3', turns: [
      { beat: '{a} and {b} spot each other across the deck and both start laughing.' },
      { by: 'a', say: "Okay, so the {show_a} people are sticking together, right? Tell me we're sticking together." },
      { by: 'b', say: "Obviously. Look around. Nobody here knows us." },
      { by: 'b', conf: "Everybody's going to see {a} and me hugging and think we're a team. And they'd be right, for now." },
    ] },
    { id: 'ar.r4', when: { band: 'cold' }, turns: [
      { by: 'a', say: 'Oh. {b}. Great.' },
      { by: 'b', say: "Don't look so happy to see me." },
      { by: 'a', conf: "Of all the people from {show_a} they could have brought, they brought {b}. We didn't exactly leave things on a good note." },
    ] },
  ],
  'arrival.strangers': [
    { id: 'ar.s1', turns: [
      { beat: 'The villa doors open and the cast floods in, bags everywhere, everyone talking at once.' },
      { by: 'a', say: "Okay, this place is insane. Is that a hot tub on the balcony?" },
      { by: 'b', say: "There's two. I already checked." },
      { by: 'a', conf: "I don't know a single person in here, which is scary, but it also means nobody's got a reason to come after me yet." },
    ] },
    { id: 'ar.s2', turns: [
      { by: 'a', say: "Hi, I'm {a}. I feel like I should know you from somewhere." },
      { by: 'b', say: "{b}. And no, I don't think so, but I'm about to know everybody's business by tonight." },
      { by: 'a', conf: 'First impressions in here are everything. {b} seems friendly, but friendly people are usually the ones you have to watch.' },
    ] },
    { id: 'ar.s3', turns: [
      { beat: '{a} throws a bag onto a top bunk before anybody else can claim it.' },
      { by: 'b', say: "Wow, you didn't even look at the other beds." },
      { by: 'a', say: "Top bunk, by the window. I've been planning that since the van." },
      { by: 'b', conf: "{a} grabbed a bed in under a minute. If that's how {a} plays the game, I'm going to keep an eye on {a.obj}." },
    ] },
  ],

  // ── the daily ───────────────────────────────────────────────────────
  'daily.solo': [
    { id: 'dy.s1', turns: [
      { by: 'tj', say: "And THAT, my beautiful maniacs, is a wrap on {game}! {a}! {b}! You two are untouchable tonight!" },
      { by: 'a', say: "Let's go! Let's go!" },
      { by: 'b', conf: "Winning means I'm safe, and in this house safe is worth more than any money they could hand me." },
      { by: 'c', conf: "Last place. Of course it was me. Now I have to go back to that villa and hope nobody's counting." },
    ] },
    { id: 'dy.s2', turns: [
      { by: 'tj', say: "{a} and {b}, take a bow, you just won {game}, and I am genuinely emotional about it." },
      { by: 'b', say: "Thank you, TJ. Seriously, thank you." },
      { by: 'c', say: "That was brutal. I couldn't feel my arms halfway through." },
      { by: 'a', conf: "I had to win today. I've been feeling the heat in that house since day one, and now nobody can touch me." },
    ] },
    { id: 'dy.s3', turns: [
      { by: 'tj', say: "Ladies and gentlemen, the champs of {game}! {a}! {b}! Everybody else, I love you, but you're in the danger zone, baby!" },
      { by: 'a', say: "I knew it. I knew I had that." },
      { by: 'c', conf: "Being last doesn't send you home. But it puts a big sign over your head that says easy target, and I hate that." },
    ] },
    { id: 'dy.s4', when: { register: 'competitor' }, turns: [
      { by: 'tj', say: "{a}, you just ate {game} for breakfast. Who taught you to move like that?" },
      { by: 'a', say: "Nobody. I just don't like losing." },
      { by: 'a', conf: "Some people come here to make friends. I came here to win dailies, and I'm going to keep doing it until they make me stop." },
    ] },
  ],
  'daily.pairs': [
    { id: 'dy.p1', turns: [
      { by: 'tj', say: "{a} and {b}! The dream team! You two just took {game} and you're both safe!" },
      { by: 'a', say: 'Partner! We did it!' },
      { by: 'b', say: "I told you we'd be good together." },
      { by: 'b', conf: "I didn't know {a} that well before today, but you learn a lot about somebody when you're both soaking wet and screaming at each other." },
    ] },
    { id: 'dy.p2', turns: [
      { by: 'tj', say: "Okay, okay, OKAY! {a} and {b} win {game}! That's teamwork, people. Write it down!" },
      { by: 'a', say: "Honestly, {b} carried that last part. I was done." },
      { by: 'b', say: "Shut up, you were amazing." },
      { by: 'a', conf: "Winning with {b} means I've got somebody in here who owes me a little, and I owe {b.obj} a little. That's how alliances start." },
    ] },
    { id: 'dy.p3', turns: [
      { by: 'tj', say: "Pair of the day: {a} and {b}! Everybody else, start sweating, because one of you is going in." },
      { by: 'b', say: "Yes! Yes! Don't even talk to me right now, I'm so happy." },
      { by: 'c', conf: "My partner and I were a mess today. Now I have to go back and hope the house is mad at somebody else." },
    ] },
  ],
  'daily.teams': [
    { id: 'dy.t1', turns: [
      { by: 'tj', say: "Team effort, team win! {a}, {b}, and the rest of you lovely lunatics on that side, you're all safe tonight!" },
      { by: 'a', say: "That's what happens when everybody actually pulls!" },
      { by: 'c', conf: "Half the house is safe and my team lost. That means the vote comes down to the people standing next to me, and I don't love those numbers." },
    ] },
    { id: 'dy.t2', turns: [
      { by: 'tj', say: "And the winning team is... {a} and {b}'s team! Group hug, people, I'm serious, group hug!" },
      { by: 'b', say: "Get in here, everybody!" },
      { by: 'c', conf: "Losing as a team is the worst, because everybody's going to look around and decide whose fault it was." },
    ] },
    { id: 'dy.t3', turns: [
      { by: 'tj', say: "Somebody get me a towel, I'm crying! {a}, {b}, your team takes it!" },
      { by: 'a', say: "I'm not even mad about how much that hurt." },
      { by: 'a', conf: "Team wins are great, but nobody remembers them. The vote is what people remember." },
    ] },
  ],

  // ── deliberation: the meetings ──────────────────────────────────────
  'meeting.united': [
    { id: 'mt.u1', turns: [
      { beat: '{a} pulls the group onto the balcony and slides the door shut.' },
      { by: 'a', say: "Okay. I think it's {target}. Is anybody going to fight me on that?" },
      { by: 'b', say: "No. {target} makes sense. I'm good with it." },
      { by: 'a', say: "Then we all say {target}, and nobody gets cute about it." },
      { by: 'a', conf: "When everybody in {alliance} agrees that fast, it either means the plan is good or somebody's lying to my face." },
    ] },
    { id: 'mt.u2', turns: [
      { by: 'a', say: "Everybody in. We've got about ten minutes before the others start wondering where we are." },
      { by: 'b', say: "Who are we thinking?" },
      { by: 'a', say: "{target}. If we don't do it now, we're going to regret it." },
      { by: 'b', say: "Done. I was hoping somebody would say it." },
    ] },
    { id: 'mt.u3', turns: [
      { by: 'a', say: "Look, we have the numbers, so let's just use them. {target} goes in." },
      { by: 'b', say: "I'm in. Should we tell anybody outside the group?" },
      { by: 'a', say: "No. Let them find out at the vote." },
      { by: 'b', conf: "{alliance} runs this house right now, and honestly it feels good to be on the inside of it." },
    ] },
    { id: 'mt.u4', when: { reason: 'theyGo' }, turns: [
      { by: 'a', say: "{target} looks scary in a daily, but the Arena is a different story. If we put {target} in, I really think {target} loses." },
      { by: 'b', say: "And if {target} wins?" },
      { by: 'a', say: "Then we deal with it. But I like the odds." },
    ] },
    { id: 'mt.u5', when: { reason: 'grudge' }, turns: [
      { by: 'a', say: "I'm not going to pretend this one isn't personal. I want {target} in." },
      { by: 'b', say: "Personal is fine. It still has to make sense." },
      { by: 'a', say: "It does make sense. {target} is coming for one of us sooner or later." },
      { by: 'b', conf: "{a} has been waiting for this. I just hope we're not using the whole alliance to settle one argument." },
    ] },
    { id: 'mt.u6', when: { reason: 'use' }, turns: [
      { by: 'a', say: "Hear me out. We put {target} in, and {target} calls out somebody we want gone anyway." },
      { by: 'b', say: "That's... actually kind of evil. I like it." },
      { by: 'a', conf: "You don't always have to send in the person you want gone. Sometimes you send in the person who'll do it for you." },
    ] },
  ],
  'meeting.pushback': [
    { id: 'mt.p1', turns: [
      { by: 'a', say: "So we're all good with {target}?" },
      { by: 'b', say: "I mean... I'll do it. I just don't love it." },
      { by: 'a', say: "What would you rather do?" },
      { by: 'b', say: "I don't know. I just think there's a bigger target and we're scared to say it." },
      { by: 'b', conf: "I'll vote with them this week. But if {a} keeps making every call, I'm going to start making my own." },
    ] },
    { id: 'mt.p2', turns: [
      { by: 'a', say: "It's {target}. That's the plan." },
      { by: 'b', say: "Is it the plan, or is it your plan?" },
      { by: 'a', say: "It's the plan that keeps all of us safe." },
      { by: 'b', say: "Fine. Fine. But I want a say next time." },
    ] },
    { id: 'mt.p3', turns: [
      { by: 'b', say: "{target}? Really? I thought we were going bigger this week." },
      { by: 'a', say: "Bigger gets us into a fight we can't win. {target} we can win." },
      { by: 'b', say: "Okay. I hear you. I just hope it doesn't come back to bite us." },
      { by: 'a', conf: "{b} is starting to question everything. I need {b.obj} to stay with us, because one person peeling off is how alliances die." },
    ] },
  ],
  'meeting.refusal': [
    { id: 'mt.r1', turns: [
      { by: 'a', say: "{target} goes in. That's where we're at." },
      { by: 'b', say: "No. I'm not doing that. {target} is my friend." },
      { by: 'a', say: "Your friend isn't in this alliance. We are." },
      { by: 'b', say: "Then count me out this week. I'll vote somebody else." },
      { by: 'a', conf: "{b} just told the whole group {b.sub}'d rather protect {target} than us. I heard it. Everybody heard it." },
    ] },
    { id: 'mt.r2', turns: [
      { by: 'b', say: "Before you say it, I know where you're going, and I can't write {target}'s name." },
      { by: 'a', say: "You can't, or you won't?" },
      { by: 'b', say: "Both. I made {target} a promise." },
      { by: 'b', conf: "Maybe that costs me with {alliance}. But if I break my word to {target}, nobody in here should ever trust me again." },
    ] },
    { id: 'mt.r3', turns: [
      { by: 'a', say: "Can we get one week where everybody's on the same page?" },
      { by: 'b', say: "Not if the page has {target} on it." },
      { by: 'a', say: "Unbelievable." },
      { by: 'a', conf: "If {b} won't vote with us when it matters, then I have to start asking what {b} is even doing in this group." },
    ] },
  ],
  'meeting.falseyes': [
    { id: 'mt.f1', turns: [
      { by: 'a', say: "Everybody good with {target}?" },
      { by: 'b', say: "Yeah. One hundred percent." },
      { by: 'a', say: "Perfect. Then that's done." },
      { by: 'b', conf: "I told {a} I'm voting {target}. I'm not voting {target}. {a} doesn't need to know that until it's too late to do anything about it." },
    ] },
    { id: 'mt.f2', turns: [
      { by: 'a', say: "Last chance. If anybody's got a problem with {target}, say it now." },
      { by: 'b', say: "No problem here. Let's do it." },
      { by: 'b', conf: "Saying yes in that room was the easy part. Watching {a}'s face when the votes come out is going to be the fun part." },
    ] },
    { id: 'mt.f3', turns: [
      { by: 'b', say: "I'm with you. {target}. Whatever you need." },
      { by: 'a', say: "That's what I like to hear." },
      { by: 'b', conf: "I'd love to vote with {alliance}. I'd love it even more to still be here in three weeks, so I'm doing what's right for me." },
    ] },
  ],

  // ── recruiting ──────────────────────────────────────────────────────
  'recruit.accepted': [
    { id: 'rc.a1', turns: [
      { by: 'a', say: "Hey, do you have a second? We're thinking {target} this week, and we could use you." },
      { by: 'b', say: "Who's we?" },
      { by: 'a', say: "Enough people that it's going to happen with or without you. I'd rather it was with you." },
      { by: 'b', say: "Okay. I'm in. I don't have anything against {target}, but I'm not going to be the odd one out either." },
    ] },
    { id: 'rc.a2', turns: [
      { by: 'a', say: "Can I be honest with you? You're not in anybody's crosshairs right now, and I'd like to keep it that way." },
      { by: 'b', say: "And what do you want for that?" },
      { by: 'a', say: "Your vote on {target}." },
      { by: 'b', say: "Deal. But you remember this." },
      { by: 'b', conf: "I'm a free agent, and free agents get approached. I'll take a deal when it keeps me safe." },
    ] },
    { id: 'rc.a3', turns: [
      { by: 'a', say: "I need one more vote on {target}. Can I count on you?" },
      { by: 'b', say: "Honestly? Yeah. {target} gets on my nerves anyway." },
      { by: 'a', conf: "{b} said yes way faster than I expected. Either {b} really can't stand {target}, or {b} is telling everybody yes." },
    ] },
  ],
  'recruit.refused': [
    { id: 'rc.r1', turns: [
      { by: 'a', say: "We're going {target}. Are you with us?" },
      { by: 'b', say: "No. Sorry. I'm not voting {target}." },
      { by: 'a', say: "You might want to think about which side you want to be on." },
      { by: 'b', say: "I have. That's why I said no." },
    ] },
    { id: 'rc.r2', turns: [
      { by: 'a', say: "I'll be quick. {target}. You in?" },
      { by: 'b', say: "I'm going to vote how I want this week. I don't owe your group anything." },
      { by: 'a', conf: "{b} just said no to the biggest group in the house. That's either really brave or really stupid, and we'll find out which." },
    ] },
    { id: 'rc.r3', turns: [
      { by: 'b', say: "Let me guess. You want {target}." },
      { by: 'a', say: "Is that a no?" },
      { by: 'b', say: "It's a no. Not this week, and not for your group." },
    ] },
  ],
  'recruit.hanging': [
    { id: 'rc.h1', turns: [
      { by: 'a', say: "So, are you with us on {target} or not?" },
      { by: 'b', say: "Let me think about it." },
      { by: 'a', say: "There isn't a lot of time to think." },
      { by: 'b', say: "Then I guess you'll find out at the vote." },
      { by: 'a', conf: "'Let me think about it' in this house means no. Or it means yes to somebody else." },
    ] },
    { id: 'rc.h2', turns: [
      { by: 'a', say: "We could really use your vote on {target}." },
      { by: 'b', say: "I hear you. I'm just keeping my options open." },
      { by: 'b', conf: "Everybody wants my vote this week, which is the best position to be in. I'm not giving it away for free." },
    ] },
    { id: 'rc.h3', turns: [
      { by: 'b', say: "Can I get back to you?" },
      { by: 'a', say: "Sure. Just don't take too long." },
      { by: 'a', conf: "I don't like maybes. A maybe at deliberation turns into a surprise at the vote." },
    ] },
  ],
  'recruit.false-yes': [
    { id: 'rc.f1', turns: [
      { by: 'a', say: "We're doing {target}. Can we count on you?" },
      { by: 'b', say: "Absolutely. You can count on me." },
      { by: 'b', conf: "I am not voting {target}. But I'm not going to tell that to a whole alliance's face, either." },
    ] },
    { id: 'rc.f2', turns: [
      { by: 'a', say: "{target}, this week. Are you good with that?" },
      { by: 'b', say: "Totally. Whatever you guys need." },
      { by: 'b', conf: "{target} is one of my people in here. I just smiled and said yes to the group trying to send {target} home. That's the game." },
    ] },
    { id: 'rc.f3', turns: [
      { by: 'b', say: "Say less. I'm with you." },
      { by: 'a', say: "Love that." },
      { by: 'b', conf: "{a} thinks I'm a sure vote. That's exactly what I want {a} to think." },
    ] },
  ],

  // ── campaigning in front of everybody ───────────────────────────────
  'plea.moved': [
    { id: 'pl.m1', turns: [
      { by: 'a', say: "{b}, I need you. Please. I've never once put your name out there." },
      { by: 'b', say: "I know. I know you haven't." },
      { by: 'a', say: "Then don't do this to me." },
      { by: 'b', conf: "I was going to vote {a}. Then {a} looked at me like that, and I just couldn't. I'm going to have to explain that to some people." },
    ] },
    { id: 'pl.m2', turns: [
      { by: 'a', say: "You and me have been good since the first night. That has to count for something." },
      { by: 'b', say: "It does. It counts." },
      { by: 'a', conf: "I don't beg. But I talked to {b} like my life depended on it, because it kind of did." },
    ] },
    { id: 'pl.m3', turns: [
      { by: 'a', say: "Just tell me straight. Are you voting for me?" },
      { by: 'b', say: "I was. I'm not now." },
      { by: 'a', say: "Thank you. Seriously. I won't forget it." },
    ] },
  ],
  'plea.held': [
    { id: 'pl.h1', turns: [
      { by: 'a', say: "{b}, come on. After everything, you're really going to vote for me?" },
      { by: 'b', say: "It's nothing personal. It's just how the numbers are this week." },
      { by: 'a', say: "It feels pretty personal from here." },
      { by: 'a', conf: "I thought {b} had my back. I found out today what {b}'s back is worth." },
    ] },
    { id: 'pl.h2', turns: [
      { by: 'a', say: "Can you at least tell me why?" },
      { by: 'b', say: "Because if I don't, I'm next. I'm sorry." },
      { by: 'b', conf: "Saying no to {a}'s face was horrible. I still did it, because I want to be here next week." },
    ] },
    { id: 'pl.h3', turns: [
      { by: 'a', say: "I'm asking you as a friend. Don't write my name down." },
      { by: 'b', say: "I wish I could help you. I can't this time." },
      { by: 'a', say: "Okay. I'll remember that." },
    ] },
  ],
  'leverage-threat.credible': [
    { id: 'lt.c1', turns: [
      { by: 'a', say: "Let me make this really simple. If I go in, I'm calling out {b}." },
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because you're the one I'd rather fight than anybody else in here." },
      { by: 'b', conf: "{a} has won in that Arena before. When {a} says that, you have to take it seriously." },
    ] },
    { id: 'lt.c2', turns: [
      { by: 'a', say: "Go ahead and vote me in. I'm not scared of the Arena. But {b}, you should be." },
      { by: 'b', say: "Is that supposed to scare me?" },
      { by: 'a', say: "It already does. I can see it." },
    ] },
    { id: 'lt.c3', turns: [
      { by: 'a', say: "Everybody in this room needs to hear this. If my name comes out, {b} is coming in with me." },
      { by: 'b', conf: "{a} just put a target on me in front of the whole house to save {a.ref}. It's smart. I hate it, but it's smart." },
    ] },
  ],
  'leverage-threat.bluff': [
    { id: 'lt.b1', turns: [
      { by: 'a', say: "You want to vote me in? Fine. But I'm taking {b} with me." },
      { by: 'b', say: "Okay." },
      { by: 'a', say: "Okay? That's it?" },
      { by: 'b', conf: "{a} has never won a thing in this game. I'm not going to lose sleep over that threat." },
    ] },
    { id: 'lt.b2', turns: [
      { by: 'a', say: "I'd think really hard before putting my name in, because {b}'s coming with me if you do." },
      { by: 'a', conf: "Am I actually good in the Arena? I have no idea. But they don't know that either." },
    ] },
    { id: 'lt.b3', turns: [
      { by: 'a', say: "Hey, {b}. If they put me in, guess who I'm calling out." },
      { by: 'b', say: "Is that supposed to make me nervous?" },
      { by: 'a', say: "It should." },
      { by: 'b', conf: "Talk is cheap. If {a} goes in, we'll see how {a} does against somebody who can actually fight." },
    ] },
  ],
  'outing.any': [
    { id: 'ou.1', turns: [
      { by: 'a', say: "Can everybody stop pretending for one second? {alliance} is real. {b} runs it. They've been deciding every vote." },
      { by: 'b', say: "That's ridiculous." },
      { by: 'a', say: "Is it? Then why do they always vote the same name?" },
      { beat: 'Nobody says anything. A couple of people look at {b}.' },
      { by: 'a', conf: "If I'm going down, I'm taking their secret down with me. Now the whole house knows who's in charge." },
    ] },
    { id: 'ou.2', turns: [
      { by: 'a', say: "I'm done keeping it quiet. {b} and the people in {alliance} have been running this house since the first week." },
      { by: 'b', say: "You're desperate, {a}. Everybody can see it." },
      { by: 'a', say: "I'm not desperate. I'm right." },
      { by: 'b', conf: "{a} just blew up our whole alliance in front of everybody. Now everybody's going to come for us, and I know exactly who to thank." },
    ] },
    { id: 'ou.3', turns: [
      { by: 'a', say: "You want to know why I'm the target? Ask {b}. Ask the people in {alliance}." },
      { beat: 'The room erupts. Three people start talking at once.' },
      { by: 'a', conf: "I knew about {alliance} for days. Saying it out loud was the only card I had left, so I played it." },
    ] },
  ],
  'volunteer.targeted': [
    { id: 'vo.t1', turns: [
      { by: 'a', say: "I'll make this easy for everybody. I'm going in. And I'm calling out {target}." },
      { beat: 'The room goes quiet. {target} looks up.' },
      { by: 'a', conf: "I didn't want to wait for the house to decide my fate. I want to go in there and take out the person I actually want gone." },
    ] },
    { id: 'vo.t2', turns: [
      { by: 'a', say: "Put me in. I want {target}, and I want {target} now." },
      { by: 'tj', say: "Whoa, whoa, WHOA. A volunteer? Somebody check my pulse, this is my favorite thing that's ever happened." },
      { by: 'a', conf: "Volunteering is a risk. If I lose, I look like an idiot. But if I win, everybody in this house remembers I chose this." },
    ] },
    { id: 'vo.t3', turns: [
      { by: 'a', say: "I've been waiting all week to say this. I'm volunteering, and {target}, you're coming with me." },
      { by: 'a', conf: "{target} has been running {target}'s mouth for days. I'd rather settle it in the Arena than listen to one more word." },
    ] },
  ],
  'volunteer.open': [
    { id: 'vo.o1', turns: [
      { by: 'a', say: "Nobody needs to vote. I'll go in." },
      { by: 'tj', say: "Hold the phone! We've got a volunteer! You're either a genius or completely nuts, and I respect both!" },
      { by: 'a', conf: "I haven't been in the Arena yet, and people have started saying I'm getting a free ride. So I'm going to shut that down myself." },
    ] },
    { id: 'vo.o2', turns: [
      { by: 'a', say: "I'll do it. Put my name down. I'm not scared of that place." },
      { by: 'a', conf: "Sometimes you have to show the house you're not afraid. This is me showing them." },
    ] },
    { id: 'vo.o3', turns: [
      { by: 'a', say: "Save your votes. I'm volunteering." },
      { beat: 'A few people exchange looks. Somebody whistles.' },
      { by: 'a', conf: "I know what I'm doing. You don't get respect in this game by hiding." },
    ] },
  ],

  // ── the call-out ────────────────────────────────────────────────────
  'callout.survive': [
    { id: 'co.s1', turns: [
      { by: 'tj', say: "{a}, my friend, the house has spoken. Now it's your turn. Who are you calling out?" },
      { by: 'a', say: "I'm calling out {b}." },
      { by: 'b', say: "Seriously?" },
      { by: 'a', conf: "I'm not going to lie, I picked {b} because I think I can beat {b.obj}. That's the whole reason. I want to stay." },
    ] },
    { id: 'co.s2', turns: [
      { by: 'tj', say: "Okay, {a}. Big moment. Who's coming with you?" },
      { by: 'a', say: "{b}. Sorry. It's nothing personal." },
      { by: 'b', say: "It always feels personal when it's you." },
      { by: 'b', conf: "{a} picked me because {a} thinks I'm the easiest fight. I'm going to make {a} regret that." },
    ] },
    { id: 'co.s3', turns: [
      { by: 'a', say: "I'm calling out {b}. I want to go home on my terms, and I don't think I'm going home." },
      { by: 'tj', say: "Oooh, the confidence! I love it! {b}, you're going in, buddy!" },
      { by: 'a', conf: "You pick the fight you can win. I'm not here to be a hero." },
    ] },
    { id: 'co.s4', when: { register: 'shy' }, turns: [
      { by: 'a', say: "I, um... I'm calling out {b}." },
      { by: 'tj', say: "Say it louder for the people in the back, champ!" },
      { by: 'a', say: "{b}. I'm calling out {b}." },
      { by: 'a', conf: "I hated saying it. But I want to stay here more than I want everybody to like me." },
    ] },
  ],
  'callout.grudge': [
    { id: 'co.g1', turns: [
      { by: 'tj', say: "{a}! Who's it gonna be?" },
      { by: 'a', say: "{b}. And {b} knows exactly why." },
      { by: 'b', say: "Here we go." },
      { by: 'a', conf: "This has been coming for a while. {b} put my name out there, so now {b} gets to fight me for it." },
    ] },
    { id: 'co.g2', turns: [
      { by: 'a', say: "{b}. You voted me in. So guess what, you're coming with me." },
      { by: 'b', say: "That's fine. I'll see you in there." },
      { by: 'tj', say: "Oh, this is SPICY. I need a minute. I need a snack. Somebody get me a snack." },
    ] },
    { id: 'co.g3', turns: [
      { by: 'a', say: "I'm calling out {b}, because I've had enough of {b} talking about me when I'm not in the room." },
      { by: 'b', conf: "{a} thinks this is about revenge. Fine. I don't mind going in there and proving {a.obj} wrong." },
    ] },
    { id: 'co.g4', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "{b}. It's you. It was always going to be you." },
      { by: 'b', say: "Bring it." },
      { by: 'a', say: "Oh, I'm bringing it. I've been waiting to bring it." },
      { by: 'a', conf: "I don't care if I win or lose. I care that {b} has to stand across from me and look me in the eye." },
    ] },
  ],
  'callout.prove': [
    { id: 'co.p1', turns: [
      { by: 'tj', say: "{a}, who's going in with you?" },
      { by: 'a', say: "I'm calling out {b}." },
      { beat: 'Somebody gasps. Everybody knows how good {b} is in the Arena.' },
      { by: 'a', conf: "Everybody thinks {b} is the best in here. If I want to be taken seriously, I have to beat the best." },
    ] },
    { id: 'co.p2', turns: [
      { by: 'a', say: "{b}. I want the strongest. If I'm going home, I'm not going home against somebody weak." },
      { by: 'tj', say: "Now THAT is a call-out! Sweet mercy, somebody's got guts tonight!" },
      { by: 'b', conf: "{a} wants to make a name off of me. I'm not going to make that easy." },
    ] },
    { id: 'co.p3', turns: [
      { by: 'a', say: "I'm calling out {b}. People keep saying I haven't proven myself. This is me proving myself." },
      { by: 'b', say: "Respect. But you're going to lose." },
      { by: 'a', say: "We'll see." },
    ] },
  ],
  'callout.avoid-beast': [
    { id: 'co.b1', turns: [
      { by: 'tj', say: "{a}, the floor is yours. Who are you calling out?" },
      { by: 'a', say: "{b}." },
      { by: 'a', conf: "Was there somebody I'd rather see go home? Sure. But I'm not stupid enough to call out the person who's undefeated in there." },
    ] },
    { id: 'co.b2', turns: [
      { by: 'a', say: "I'm calling out {b}. I'm not going in against a beast, I'm not crazy." },
      { by: 'b', say: "So I'm the easy one. Great. Thanks." },
      { by: 'b', conf: "{a} skipped the strongest person in the house and picked me. That tells me exactly what {a} thinks of me, and I'm going to use it." },
    ] },
    { id: 'co.b3', turns: [
      { by: 'a', say: "{b}. It makes the most sense." },
      { by: 'tj', say: "A strategic choice! Some might say a chicken choice. I'm not saying that. I'm just saying some might." },
      { by: 'a', conf: "Call it whatever you want. I want to wake up in that villa tomorrow." },
    ] },
  ],

  // ── the Arena ───────────────────────────────────────────────────────
  'arena.walkover': [
    { id: 'an.w1', turns: [
      { by: 'tj', say: "Welcome to the Arena, my dudes! Tonight's game is {game}, and somebody is getting on a plane. Let's GO!" },
      { beat: '{a} takes control almost right away and never gives it back.' },
      { by: 'tj', say: "And that's it! {a}, you are staying in this game! {b}, buddy, I'm sorry, but you're done." },
      { by: 'b', say: "{a} was better tonight. I can't argue with that." },
      { by: 'a', conf: "I came in there and I took care of business. Now everybody who put my name in can watch me walk back through that door." },
    ] },
    { id: 'an.w2', turns: [
      { by: 'tj', say: "Two players, one game, zero mercy. It's {game} time!" },
      { beat: 'It is over quickly. {b} never finds a way back in.' },
      { by: 'tj', say: "Clean, fast, and kind of beautiful. {a} wins it!" },
      { by: 'b', conf: "I gave it everything. It wasn't enough tonight, and that's going to hurt for a long time." },
    ] },
    { id: 'an.w3', turns: [
      { by: 'tj', say: "{a}, {b}, this is {game}, and only one of you is coming out of here with your bags still unpacked." },
      { beat: '{a} wins it without much of a fight.' },
      { by: 'a', say: "Let's go! That's what happens!" },
      { by: 'tj', say: "{b}, you were brave tonight. Brave and also, unfortunately, eliminated." },
    ] },
  ],
  'arena.upset': [
    { id: 'an.u1', turns: [
      { by: 'tj', say: "Okay, nobody in the house thought {a} could win this. Tonight's game is {game}. Prove 'em wrong or pack your bags!" },
      { beat: '{b} starts strong, but {a} hangs in and takes it at the end.' },
      { by: 'tj', say: "WHAT?! {a}! Did that just happen? Did everybody see that?!" },
      { by: 'a', say: "I told you! I told all of you!" },
      { by: 'b', conf: "I underestimated {a}. That's on me, and it's the worst mistake I've made in this game." },
    ] },
    { id: 'an.u2', turns: [
      { by: 'tj', say: "The odds say {b}. The house says {b}. But the Arena doesn't care what anybody says! It's {game}!" },
      { beat: '{a} wins it, and for a second nobody watching makes a sound.' },
      { by: 'tj', say: "Stop it. STOP IT. {a} just pulled off the upset of the season, and I am losing my mind!" },
      { by: 'a', conf: "Everybody counted me out. Everybody. Now they have to live with me for another week." },
    ] },
    { id: 'an.u3', turns: [
      { by: 'tj', say: "{game}. Big favorite versus big underdog. Let's find out what you're made of!" },
      { beat: '{a} wins. {b} sits down in the sand and stares at nothing.' },
      { by: 'b', say: "I don't even know what happened." },
      { by: 'tj', say: "What happened is {a} wanted it more, my friend. You're done." },
    ] },
  ],
  'arena.comeback': [
    { id: 'an.c1', turns: [
      { by: 'tj', say: "Welcome to the Arena! It's {game}! Let's get WEIRD!" },
      { beat: '{b} gets out in front and it looks over. Then {a} fights back.' },
      { by: 'tj', say: "Are you KIDDING me? {a} was dead! {a} was buried! And {a} just came back and won it!" },
      { by: 'a', conf: "Halfway through I thought it was over. Then I thought about walking back into that villa, and I found something I didn't know I had." },
    ] },
    { id: 'an.c2', turns: [
      { by: 'tj', say: "Tonight's game is {game}, and somebody's dream ends right here!" },
      { beat: '{a} is behind, way behind, and then not.' },
      { by: 'tj', say: "Oh, that was a COMEBACK, baby! {b}, you had it, and you let it slip. I'm sorry, you're done." },
      { by: 'b', say: "I had it. I had it in my hands." },
      { by: 'b', conf: "Losing like that is the worst way to go. I'm going to be replaying it for the rest of my life." },
    ] },
    { id: 'an.c3', turns: [
      { by: 'tj', say: "{game}! Two players, one Arena, and a whole lot of feelings! GO!" },
      { beat: '{b} looks like the winner, right up until {a} takes it away.' },
      { by: 'a', say: "Never count me out! Never!" },
      { by: 'tj', say: "{a}, you just gave me goosebumps. Actual goosebumps. Look at my arms!" },
    ] },
  ],

  // ── back to the villa ───────────────────────────────────────────────
  'return.faced': [
    { id: 'rt.f1', turns: [
      { beat: 'The villa door swings open and {a} walks in.' },
      { by: 'a', say: "Surprise. I'm still here." },
      { by: 'b', say: "{a}! Congrats... seriously." },
      { by: 'a', say: "Save it, {b}. I know you voted for me." },
      { by: 'a', conf: "I walked in, and the first thing I did was look at every single person who wrote my name down. They know I know." },
    ] },
    { id: 'rt.f2', turns: [
      { by: 'a', say: "Well? Nobody's going to say welcome back?" },
      { by: 'b', say: "Welcome back. Really." },
      { by: 'a', say: "You don't get to be happy I'm back, {b}. You tried to send me home." },
      { by: 'b', conf: "Voting {a} in and having {a} come back is the worst-case scenario. Now I'm sleeping across the room from somebody who wants revenge." },
    ] },
    { id: 'rt.f3', turns: [
      { beat: '{a} walks back into the villa, still covered in sand from the Arena.' },
      { by: 'a', say: "Miss me?" },
      { by: 'b', say: "We... yeah. Good job out there." },
      { by: 'a', conf: "The look on {b}'s face when I walked in was worth everything I went through tonight." },
    ] },
  ],
  'return.quiet': [
    { id: 'rt.q1', turns: [
      { beat: '{a} comes back to the villa late. The house is half asleep.' },
      { by: 'a', conf: "I won, and I'm back, and I'm exhausted. That's all I can think about right now.", v: { loud: ['I\'M BACK! Somebody wake up and congratulate me!'], soft: ['I just want to sleep for a week.'] } },
    ] },
    { id: 'rt.q2', turns: [
      { beat: '{a} walks in and drops onto the couch without a word.' },
      { by: 'a', conf: "{gone} is gone and I'm still here. I don't feel like celebrating. I feel like sleeping.", v: { sharp: ['One less person in my way.'] } },
    ] },
    { id: 'rt.q3', turns: [
      { beat: '{a} is back. A couple of people clap, not very loudly.' },
      { by: 'a', conf: "I'm still here. That's all that matters." },
    ] },
  ],
  // they put themselves in the Arena, and won
  'return.volunteered': [
    { id: 'rt.v1', turns: [
      { beat: '{a} walks back into the villa with sand still stuck to {a.posAdj} arms.' },
      { by: 'a', say: "Told you I wasn't scared.", v: { loud: ['TOLD YOU! I told ALL of you!'], soft: ['I did it. I actually did it.'] } },
      { by: 'a', conf: "Volunteering, going in, winning. I chose all of that, and I'd do it again tomorrow.", v: { sharp: ['Nobody calls me a free ride now.'] } },
    ] },
    { id: 'rt.v2', turns: [
      { by: 'a', say: "Anybody still think I'm scared of that place?", v: { sharp: ['Go on. Somebody tell me I don\'t belong here.'] } },
      { beat: 'Nobody says anything. Somebody passes {a} a drink.' },
      { by: 'a', conf: "I put myself in that Arena and took {gone} out with my own hands. That's a message to this whole house.", v: { soft: ['I\'m proud of myself. I don\'t say that a lot.'] } },
    ] },
    { id: 'rt.v3', turns: [
      { beat: '{a} comes in, drops the bag, and grins at the whole room.' },
      { by: 'a', conf: "I went in on my own terms and I'm back on my own terms. {gone} found out what happens when I volunteer.", v: { loud: ['Volunteered, won, and I\'d do it AGAIN!'] } },
    ] },
  ],
  // called out, and sent the one who called them home
  'return.calledout': [
    { id: 'rt.c1', turns: [
      { beat: '{a} walks back in. {gone} does not.' },
      { by: 'a', say: "{gone} picked me because {gone} thought I was easy. How'd that work out?", v: { loud: ['{gone} called ME out?! {gone} is on a plane!'], soft: ['I didn\'t want it to come to that. I\'m just glad I\'m still here.'] } },
      { by: 'a', conf: "Getting called out and sending the caller home is the best feeling in this game.", v: { sharp: ['Lesson for everybody. Pick your fights more carefully.'] } },
    ] },
    { id: 'rt.c2', turns: [
      { by: 'a', conf: "{gone} picked the wrong person. Everybody in this villa just learned that.", v: { odd: ['{gone} picked me as the easy one. I\'m a lot of things. Easy isn\'t one of them.'] } },
    ] },
    { id: 'rt.c3', turns: [
      { beat: 'The door opens and {a} walks in. A few people actually cheer.' },
      { by: 'a', say: "I'm back. {gone} isn't.", v: { soft: ['I made it. I really made it.'] } },
    ] },
  ],

  // ── the morning after ───────────────────────────────────────────────
  'morning-after.mourning': [
    { id: 'ma.m1', turns: [
      { beat: "{gone}'s bunk is stripped. {a} sits on the edge of it." },
      { by: 'a', say: "It doesn't feel real that {gone} is gone." },
      { by: 'b', say: "I know. I keep looking for {gone} at breakfast." },
      { by: 'a', conf: "{gone} was my person in here. Now I have to figure out who put {gone} in that Arena, and I'm going to." },
    ] },
    { id: 'ma.m2', turns: [
      { by: 'a', say: "Can I just say it? I'm really going to miss {gone}." },
      { by: 'b', say: "Me too. This house is different without {gone}." },
      { by: 'b', conf: "Losing {gone} hurts. But it also tells me who in this house doesn't care about the people I care about." },
    ] },
    { id: 'ma.m3', turns: [
      { by: 'a', say: "Did anybody even say goodbye properly?" },
      { by: 'b', say: "I don't think anybody could. It happened so fast." },
      { by: 'a', conf: "I keep telling myself it's a game, but {gone} was the first real friend I made here." },
    ] },
  ],
  'morning-after.alone': [
    { id: 'ma.a1', turns: [
      { beat: '{a} sits alone on the beach with a coffee nobody else made.' },
      { by: 'a', conf: "{gone} going home leaves me with nobody. Everybody else had their friend come back last night. Mine didn't." },
    ] },
    { id: 'ma.a2', turns: [
      { by: 'a', conf: "I woke up and forgot for a second that {gone} was gone. Then I remembered, and I didn't want to get out of bed." },
    ] },
    { id: 'ma.a3', turns: [
      { beat: '{a} folds the blanket {gone} left behind and puts it in a drawer.' },
      { by: 'a', conf: "I'm on my own now. That's fine. I'll play the rest of this for both of us." },
    ] },
  ],
  'morning-after.relief': [
    { id: 'ma.r1', turns: [
      { by: 'a', conf: "I'm not going to cry over {gone}. We never got along, and the house is quieter without {gone} in it." },
    ] },
    { id: 'ma.r2', turns: [
      { by: 'a', say: "Is it bad that I slept better last night?" },
      { by: 'b', say: "Don't say that out loud." },
      { by: 'a', conf: "I'm being honest. {gone} was a problem for me, and now {gone} is gone." },
    ] },
    { id: 'ma.r3', turns: [
      { by: 'a', conf: "Some people are sad about {gone}. I'm being polite about it, because I know who's watching. Inside I'm doing a little dance." },
    ] },
  ],

  // ── exits outside the vote ──────────────────────────────────────────
  'quit.any': [
    { id: 'qt.1', turns: [
      { by: 'a', say: "TJ, I'm done. I want to go home." },
      { by: 'tj', say: "Done? DONE? Buddy, I've seen people finish dailies with a broken toe, and you want to quit on a Tuesday?" },
      { by: 'a', say: "I can't do it anymore. I miss my family, I can't sleep, I'm done." },
      { by: 'tj', say: "Okay. I respect you as a human being. I do not respect you as a competitor. Go home." },
      { by: 'a', conf: "Everybody's going to call me a quitter. They can. I know what I needed, and it wasn't another week in that house." },
    ] },
    { id: 'qt.2', turns: [
      { by: 'tj', say: "I hear somebody wants to talk to me. Let me guess. You're homesick." },
      { by: 'a', say: "I'm really sorry, TJ. I need to leave." },
      { by: 'tj', say: "Don't apologize to me. Apologize to the person who would have killed for your spot in this game." },
      { by: 'a', conf: "TJ's speech hurt more than anything in that Arena could have. But I'm going home, and I'm okay with that." },
    ] },
    { id: 'qt.3', turns: [
      { by: 'a', say: "I want to go home." },
      { by: 'tj', say: "You know what we call that around here? We call that quitting. And I hate quitting. I hate it more than I hate cold pizza." },
      { by: 'a', say: "I know." },
      { by: 'tj', say: "Pack your stuff, champ. You were never going to be one." },
    ] },
  ],
  'medical.any': [
    { id: 'md.1', turns: [
      { beat: 'The medic finishes checking {a} and shakes their head.' },
      { by: 'tj', say: "{a}, the doctors say you're done, and I hate it. You didn't quit. Your body did. That's different, and everybody here knows it." },
      { by: 'a', conf: "I didn't get voted out, I didn't lose an elimination, and I'm still going home. That's the part that kills me." },
    ] },
    { id: 'md.2', turns: [
      { by: 'a', say: "Please, just tape it up. I can still go." },
      { by: 'tj', say: "Buddy, I love the fight, but I'm not letting you wreck yourself for a game. You're going home." },
      { by: 'a', conf: "I came here to win, and my body gave out before the house could do anything. I'll be back. I promise I'll be back." },
    ] },
    { id: 'md.3', turns: [
      { by: 'tj', say: "Medical says no. I'm so sorry, {a}." },
      { by: 'a', say: "I can't believe this is how it ends." },
      { by: 'a', conf: "Nobody beat me. That's what I'm holding onto." },
    ] },
  ],
  'disqualified.any': [
    { id: 'dq.1', turns: [
      { by: 'tj', say: "Everybody sit down. Last night, {gone} put hands on {a}, and that's the one rule I don't bend. {gone} is gone." },
      { by: 'a', conf: "I didn't want anybody sent home. But I also didn't deserve that, and the rules are the rules." },
    ] },
    { id: 'dq.2', turns: [
      { by: 'tj', say: "I love chaos. I love drama. I do not love violence. {gone} is out of this game, effective immediately." },
      { by: 'a', say: "I didn't even see it coming." },
      { by: 'a', conf: "One second we were yelling, and the next second it was something else. I'm just glad it's over." },
    ] },
    { id: 'dq.3', turns: [
      { by: 'tj', say: "Real talk, people. {gone} got physical with {a} last night. You do that, you go home. That's not a threat, it's a promise." },
      { by: 'a', conf: "The house is going to split on this. Some of them are going to say I started it. I didn't." },
    ] },
  ],
  'tj-house-meeting.any': [
    { id: 'tm.1', turns: [
      { by: 'tj', say: "I came to the villa on my day off, and I never come to the villa on my day off. {gone} is gone. Anybody else wants to throw a punch, you can throw it from the airport." },
      { by: 'a', conf: "TJ walking in the door was the scariest thing that's happened in here. Nobody said a word for an hour after he left." },
    ] },
    { id: 'tm.2', turns: [
      { by: 'tj', say: "Party's over, people. Party's actually over. {gone} broke the one rule, and now {gone} is packing. Keep your hands to yourselves." },
      { by: 'a', conf: "It's going to be really quiet at the next party. Which is fine with me." },
    ] },
    { id: 'tm.3', turns: [
      { by: 'tj', say: "Look at me. Everybody look at me. You can yell, you can cry, you can vote each other in. You don't touch each other. {gone} learned that the hard way." },
      { by: 'a', conf: "I've never seen TJ that serious. It actually kind of shook me." },
    ] },
  ],
};
