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
      { beat: '{a} comes down the plane steps and stops dead at the sight of {b} on the tarmac.' },
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
      { beat: '{a} and {b} spot each other across the airstrip and both start laughing.' },
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
  // The villa, seen for the first time (after the first daily): the doors open, the bed grab.
  'villa-reveal.any': [
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
      { by: 'tj', say: "And THAT, my beautiful maniacs, is a wrap on {game}! {a}! {b}! You two are untouchable at the vote!" },
      { by: 'a', say: "Let's go! Let's go!" },
      { by: 'b', conf: "Winning means I'm safe, and in this house safe is worth more than any money they could hand me." },
      { by: 'c', conf: "Last place. Of course it was me. Now I have to go back to that villa and hope nobody's counting." },
    ] },
    { id: 'dy.s2', turns: [
      { by: 'tj', say: "{a} and {b}, take a bow, you just won {game}, and I am genuinely emotional about it." },
      { by: 'b', say: "Thank you, TJ. Seriously, thank you." },
      { by: 'c', say: "That was brutal. I'm completely wiped out." },
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
      { by: 'tj', say: "Okay, okay, OKAY! {a} and {b} win {game}! That's teamwork, people!" },
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
      { by: 'tj', say: "Team effort, team win! {a}, {b}, and the rest of you lovely lunatics on that side, you're all safe at the vote!" },
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
      { by: 'a', say: "{target} looks scary in a daily, but the Arena is different. If we put {target.obj} in, I really think {target.sub} loses." },
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
      { by: 'a', say: "Hear me out. We put {target} in, and whoever gets called out is somebody we want gone anyway." },
      { by: 'b', say: "That's... actually kind of evil. I like it." },
      { by: 'a', conf: "We don't have to beat everybody ourselves. If {target} goes in, the call-out might send home somebody we want gone anyway." },
    ] },
    // written long from the start (the long cut, 2026-10-15)
    { id: 'mt.u7', turns: [
      { by: 'a', say: "Before anybody else gets here, I want to say it out loud. {target}." },
      { by: 'b', say: "I was going to say the same thing." },
      { by: 'c', opt: 1, say: "Same. I've been thinking it since the daily." },
      { by: 'a', say: "Good. Then it's easy. We just need everybody to stay quiet until the vote." },
      { by: 'b', say: "What about the people outside the group? Do we tell anyone?" },
      { by: 'a', say: "Only the ones who'd vote {target} anyway. Nobody who'd run to {target} with it." },
      { by: 'x', opt: 1, say: "I know two who would. I'll talk to them." },
      { by: 'a', opt: 'x', say: "Carefully. Don't say it's us. Say it's what everybody's saying." },
      { by: 'b', say: "And if {target} asks us straight out?" },
      { by: 'a', say: "Then we haven't decided yet. Same as always." },
      { by: 'a', conf: "Everybody agreeing this fast is the easy part. Keeping it quiet for a whole day in this house is the hard part." },
    ] },
    { id: 'mt.u8', turns: [
      { beat: 'The group gets together one at a time, so nobody notices them all leave at once.' },
      { by: 'b', say: "Okay, we're all here. Who is it?" },
      { by: 'a', say: "I think it's {target}. But I want to hear everybody first." },
      { by: 'c', opt: 1, say: "{target}. It makes sense." },
      { by: 'x', opt: 1, say: "{target} for me too." },
      { by: 'b', say: "Then it's {target}." },
      { by: 'a', say: "Then it's {target}. Nobody changes their mind tomorrow, okay? If you've got a problem, say it now." },
      { by: 'b', say: "Nobody's got a problem." },
      { by: 'b', conf: "I like that {a} asked everybody. Most people in here just tell you who you're voting for." },
    ] },
  ],
  'meeting.pushback': [
    { id: 'mt.p1', turns: [
      { by: 'a', say: "So we're all good with {target}?" },
      { by: 'b', say: "I mean... I'll do it. I just don't like it." },
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
      { by: 'a', conf: "{b} is starting to question everything. I need {b.obj} to stay with us, because if one person starts voting on their own, the whole group falls apart." },
    ] },
    { id: 'mt.p4', turns: [
      { by: 'a', say: "Everybody okay with {target}?" },
      { by: 'b', say: "Okay is a strong word." },
      { by: 'a', say: "Then give me a better one." },
      { by: 'b', say: "I don't have a better name. I have a bad feeling about this one." },
      { by: 'c', opt: 1, say: "Feelings don't win votes." },
      { by: 'b', say: "No, but they've kept me alive in here so far." },
      { by: 'a', say: "Then trust me this one time." },
      { by: 'b', conf: "I'm going along with it. If it goes wrong, everybody in that room is going to hear about it from me." },
    ] },
    { id: 'mt.p5', turns: [
      { by: 'b', say: "Can I say something before we lock it in?" },
      { by: 'a', say: "Go ahead." },
      { by: 'b', say: "Every week it's somebody you pick. I'm not saying it's wrong. I'm saying I notice." },
      { by: 'a', say: "Somebody has to pick. You want to do it?" },
      { by: 'b', say: "Maybe next week I will." },
      { by: 'a', say: "Fine. This week it's {target}." },
      { by: 'a', conf: "{b} wants a turn running things. That's how alliances start falling apart." },
    ] },
    { id: 'mt.p6', turns: [
      { by: 'a', say: "{target}. Are we good?" },
      { by: 'b', say: "We're good. I'm just not happy about it." },
      { by: 'a', say: "Nobody's happy. That's not the point." },
      { by: 'b', say: "I know what the point is. I'm allowed to not like it." },
      { by: 'a', say: "You are. Just vote the way we said." },
      { by: 'b', conf: "I'll do it. But I'm keeping count of every vote I didn't want to make." },
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
      { by: 'b', say: "Before you say it, I know where you're going, and I can't vote for {target}." },
      { by: 'a', say: "You can't, or you won't?" },
      { by: 'b', say: "Both. I made {target} a promise." },
      { by: 'b', conf: "Maybe that costs me with {alliance}. But if I break my word to {target}, nobody in here should ever trust me again." },
    ] },
    { id: 'mt.r3', turns: [
      { by: 'a', say: "It's {target}. Can we get one week where everybody's on the same page?", keep: ['page'] },
      { by: 'b', say: "Not if the page has {target} on it." },
      { by: 'a', say: "Unbelievable." },
      { by: 'a', conf: "If {b} won't vote with us when it matters, then I have to start asking why we keep {b.obj} in this group." },
    ] },
    { id: 'mt.r4', turns: [
      { by: 'a', say: "So we're all good with {target}?" },
      { by: 'b', say: "No. I'm not good with it." },
      { by: 'a', say: "Since when?" },
      { by: 'b', say: "Since you picked somebody I actually like. Pick anybody else and I'm there." },
      { by: 'a', say: "It doesn't work like that. We vote together or we don't have an alliance." },
      { by: 'b', say: "Then this week we vote apart." },
      { by: 'c', opt: 1, say: "Can we not do this right now?" },
      { by: 'a', say: "We're doing it right now, because the vote is tomorrow." },
      { by: 'b', conf: "I'll vote with {alliance} on almost anything. Not on {target}." },
      { by: 'a', conf: "One person saying no is how an alliance starts to come apart. I have to keep an eye on {b}." },
    ] },
    { id: 'mt.r5', turns: [
      { by: 'a', say: "I think it has to be {target}. Everybody agree?" },
      { by: 'c', opt: 1, say: "I'm fine with it." },
      { by: 'b', say: "I'm not. Sorry. I'm not saying that name." },
      { by: 'a', say: "Okay. Then tell me who you want instead." },
      { by: 'b', say: "I don't have a name. I just know it isn't {target}." },
      { by: 'a', say: "That's not a plan. That's a feeling." },
      { by: 'b', say: "Then it's a feeling. I'm still not doing it." },
      { by: 'a', conf: "{b} wants the protection of the group without doing the hard part. That can't last." },
      { by: 'b', conf: "I know I just made things awkward. I'd rather be awkward than vote for {target}." },
    ] },
    { id: 'mt.r6', turns: [
      { by: 'a', say: "Let's keep this quick. {target}. Everybody in?" },
      { by: 'b', say: "Can I say something first?" },
      { by: 'a', say: "Go ahead." },
      { by: 'b', say: "{target} is one of my closest friends in here. I can't be one of the names that sends {target} in." },
      { by: 'a', say: "So you're out this week." },
      { by: 'b', say: "On this vote, yes. Not on the group." },
      { by: 'a', say: "It's kind of the same thing." },
      { by: 'b', say: "It's not, and you know it's not." },
      { by: 'a', conf: "I respect loyalty. I just wish {b}'s loyalty was to us first." },
      { by: 'b', conf: "If {alliance} can't handle me saying no once, then it was never much of an alliance." },
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
      { by: 'a', say: "It's {target} this week. Are you with us?" },
      { by: 'b', say: "I'm with you. {target}. Whatever you need." },
      { by: 'a', say: "That's what I like to hear." },
      { by: 'b', conf: "I'd like to vote with {alliance}, but I want to still be here in three weeks, so I'm doing what's best for me." },
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
      { by: 'b', conf: "I'm not in any group, so everybody comes to me for votes. If a deal keeps me safe, I'll take it." },
    ] },
    { id: 'rc.a3', turns: [
      { by: 'a', say: "I need one more vote on {target}. Can I count on you?" },
      { by: 'b', say: "Honestly? Yeah. {target} gets on my nerves anyway." },
      { by: 'a', conf: "{b} said yes way faster than I expected. Either {target} really is that hated, or everybody's getting the same yes." },
    ] },
    // turn 0: the ask; turn 1: the answer (the voice overlay maps them by meaning)
    { id: 'rc.a4', turns: [
      { by: 'a', say: "You've been floating between groups, and I get it. But this week I need to know. {target}?" },
      { by: 'b', say: "Yeah. I'll do {target}." },
      { by: 'a', say: "Thank you. I mean it." },
      { by: 'b', conf: "I've been staying out of both groups, but {a} just made me pick a side." },
    ] },
    { id: 'rc.a5', turns: [
      { by: 'a', say: "One vote. That's all I'm asking. {target}." },
      { by: 'b', say: "Fine. But I'm doing this once." },
      { by: 'a', conf: "{b} said yes, but I'm not counting on it until I hear it at the vote." },
    ] },
    { id: 'rc.a6', turns: [
      { by: 'a', say: "We're short one vote on {target}. You'd be doing us a big favour." },
      { by: 'b', say: "And you'd owe me one. Deal." },
      { by: 'b', conf: "Now the biggest group in the house owes me one, and I'm going to use that later." },
    ] },
    // written long from the start (the long cut, 2026-10-15)
    { id: 'rc.a7', turns: [
      { by: 'a', say: "Can I talk to you for a minute? Just us." },
      { by: 'b', say: "That's never a good sign." },
      { by: 'a', say: "It's not bad. I want to know if you'd vote {target} this week." },
      { by: 'b', say: "Why are you asking me? We've barely talked." },
      { by: 'a', say: "That's why. Nobody would guess you're with us, so nobody comes after you for it." },
      { by: 'b', say: "And what do I get?" },
      { by: 'a', say: "You get one less person in this house who wants you gone. That's {target}, not me." },
      { by: 'b', say: "Okay. {target}. But this doesn't make us friends." },
      { by: 'a', say: "That's fine. I don't need a friend. I need a vote." },
      { by: 'b', conf: "{a} came to me because nobody would suspect it. That's smart, and it means {a} is better at this than I thought." },
    ] },
    { id: 'rc.a8', turns: [
      { by: 'a', say: "Hey. Before everybody starts asking you, I wanted to ask you first." },
      { by: 'b', say: "Ask me what?" },
      { by: 'a', say: "{target}. Tonight. I've got most of the votes already, and I'd like yours too." },
      { by: 'b', say: "Most? How many is most?" },
      { by: 'a', say: "Enough that it happens either way. I'd rather you were on the side that wins." },
      { by: 'b', say: "That's a little bit of a threat." },
      { by: 'a', say: "It's not a threat. It's just the numbers. I'm telling you because I like you." },
      { by: 'b', say: "Fine. {target}. I'm not going to fight a vote that's already decided." },
      { by: 'b', conf: "I don't love being told what's already decided. But {a} came to me first, and in this house that counts for something." },
    ] },
    { id: 'rc.a9', turns: [
      { by: 'b', say: "You keep looking at me. What is it?" },
      { by: 'a', say: "I want to vote {target}, and I want you with me." },
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because if it's just my group, it looks like a group thing. If you're in too, it looks like the house decided." },
      { by: 'b', say: "So I'm cover." },
      { by: 'a', say: "You're a vote. And next time you need one, you know where to come." },
      { by: 'b', say: "I'm going to hold you to that." },
      { by: 'a', say: "I'd be disappointed if you didn't." },
      { by: 'b', say: "Okay. {target}." },
      { by: 'a', conf: "{b} and I aren't close. But {b} owes me now, and in a few weeks that's going to matter more than close." },
    ] },
    { id: 'rc.a10', turns: [
      { by: 'a', say: "I'm not going to dress this up. I need your vote on {target}." },
      { by: 'b', say: "Well, at least you're honest." },
      { by: 'a', say: "Would you rather I pretended I wanted to hang out?" },
      { by: 'b', say: "No. Why {target}?" },
      { by: 'a', say: "Because {target} can win this whole thing if we keep waiting. I'd rather do it now, while {target} is still beatable in the Arena." },
      { by: 'b', say: "And if {target} wins in there?" },
      { by: 'a', say: "Then {target} knows who voted, and so does everybody else. We'd all be in it together." },
      { by: 'b', say: "That's not as comforting as you think it is." },
      { by: 'a', say: "I know. But I'd rather go down with a group than alone." },
      { by: 'b', say: "Okay. I'm in." },
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
    { id: 'rc.r4', turns: [
      { by: 'a', say: "Can we count on you for {target}?" },
      { by: 'b', say: "No. I've got my own reasons, and they don't match yours." },
      { by: 'a', conf: "That's two people who've said no to us this week. Something's shifting in this house." },
    ] },
    { id: 'rc.r5', turns: [
      { by: 'a', say: "Last chance to get on the right side. {target}." },
      { by: 'b', say: "Funny, I was about to say the same thing to you." },
      { by: 'b', conf: "{a} thinks the big group gets to decide everything. Not with my vote." },
    ] },
    { id: 'rc.r6', turns: [
      { by: 'a', say: "Hey. {target} this week. Are you in?" },
      { by: 'b', say: "I'm out. Sorry." },
      { by: 'a', say: "Okay. Remember you said that." },
    ] },
  ],
  'recruit.hanging': [
    { id: 'rc.h1', turns: [
      { by: 'a', say: "So, are you with us on {target} or not?" },
      { by: 'b', say: "Let me think about it." },
      { by: 'a', say: "There isn't a lot of time to think." },
      { by: 'b', say: "Then I guess you'll find out at the vote." },
      { by: 'a', conf: "When somebody says they'll think about it, it usually means no, or they already told somebody else yes." },
    ] },
    { id: 'rc.h2', turns: [
      { by: 'a', say: "We could really use your vote on {target}." },
      { by: 'b', say: "I hear you. I'm just keeping my options open." },
      { by: 'b', conf: "Everybody wants my vote this week, which is the best position to be in. I'm not giving it away for free." },
    ] },
    { id: 'rc.h3', turns: [
      { by: 'b', say: "Can I get back to you?" },
      { by: 'a', say: "Sure. Just don't take too long." },
      { by: 'a', conf: "I hate a maybe. It means I won't know where that vote is going until it's too late." },
    ] },
    { id: 'rc.h4', turns: [
      { by: 'a', say: "Are you with us on {target}? I need a yes or a no." },
      { by: 'b', say: "You'll get one. Just not right now." },
      { by: 'a', conf: "Everybody in this house is holding out for a better offer. I just hope ours is the best one." },
    ] },
    { id: 'rc.h5', turns: [
      { by: 'a', say: "Can I count on you for {target}?" },
      { by: 'b', say: "Ask me again tonight." },
      { by: 'b', conf: "Two different groups asked me today. I'm going to let them both sweat a little." },
    ] },
    { id: 'rc.h6', turns: [
      { by: 'a', say: "So? {target}?" },
      { by: 'b', say: "I'm still thinking." },
      { by: 'a', say: "Think faster." },
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
      { by: 'b', conf: "{target} is one of my people in here, and I just smiled and said yes to the group trying to send {target.obj} home." },
    ] },
    { id: 'rc.f3', turns: [
      { by: 'b', say: "Say less. I'm with you." },
      { by: 'a', say: "Good." },
      { by: 'b', conf: "{a} thinks I'm a sure vote. That's exactly what I want {a} to think." },
    ] },
    { id: 'rc.f4', turns: [
      { by: 'a', say: "{target} this week. You're good with it?" },
      { by: 'b', say: "Yep. Locked in." },
      { by: 'b', conf: "I told {a} yes, but I'm voting for somebody else." },
    ] },
    { id: 'rc.f5', turns: [
      { by: 'a', say: "I need you on {target}. Are you with me?" },
      { by: 'b', say: "Of course I'm with you." },
      { by: 'b', conf: "Saying yes was easier than explaining why it's a no. {a} will figure it out at the vote." },
    ] },
  ],

  // ── campaigning in front of everybody ───────────────────────────────
  'plea.moved': [
    { id: 'pl.m1', turns: [
      { by: 'a', say: "{b}, I need you. Please. I've never once put your name out there.", keep: ['never'] },
      { by: 'b', say: "I know. I know you haven't." },
      { by: 'a', say: "Then don't do this to me." },
      { by: 'b', conf: "I was going to vote {a}. Then {a} looked at me like that, and I just couldn't. I'm going to have to explain that to some people." },
    ] },
    { id: 'pl.m2', turns: [
      { by: 'a', say: "You and me have been good since the first night. That has to count for something.", keep: ['count'] },
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
      { by: 'a', conf: "I thought {b} had my back. I was wrong." },
    ] },
    { id: 'pl.h2', turns: [
      { by: 'a', say: "Can you at least tell me why?" },
      { by: 'b', say: "Because if I don't, I'm next. I'm sorry." },
      { by: 'b', conf: "Saying no to {a}'s face was horrible. I still did it, because I want to be here next week." },
    ] },
    { id: 'pl.h3', turns: [
      { by: 'a', say: "I'm asking you as a friend. Don't say my name at the vote." },
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
      { by: 'b', conf: "Talk is cheap. If {a} goes in, we'll see how that goes against somebody who can actually fight." },
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
      { by: 'b', say: "You're desperate, {a}. Everybody can see it.", keep: ['desperat'] },
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
      { by: 'a', say: "Put me in. I want {target}, and I want it this week." },
      { by: 'tj', say: "Whoa, whoa, WHOA. A volunteer? Somebody check my pulse, this is my favorite thing that's ever happened." },
      { by: 'a', conf: "Volunteering is a risk. If I lose, I look like an idiot. But if I win, everybody in this house remembers I chose this." },
    ] },
    { id: 'vo.t3', turns: [
      { by: 'a', say: "I've been waiting all week to say this. I'm volunteering, and {target}, you're coming with me." },
      { by: 'a', conf: "{target} has been talking about me for days. I'd rather settle it in the Arena than listen to one more word." },
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
    { id: 'co.s1', when: { volunteer: false }, turns: [
      { by: 'tj', say: "{a}, my friend, the house has spoken. Now it's your turn. Who are you calling out?" },
      { by: 'a', say: "I'm calling out {b}." },
      { by: 'b', say: "Seriously?" },
      { by: 'a', conf: "I'm not going to lie, I picked {b} because I think I can beat {b.obj}. That's the whole reason. I want to stay." },
    ] },
    { id: 'co.s2', turns: [
      { by: 'tj', say: "Okay, {a}. Big moment. Who's coming with you?" },
      { by: 'a', say: "{b}. Sorry. It's nothing personal." },
      { by: 'b', say: "It feels pretty personal to me." },
      { by: 'b', conf: "{a} picked me as the easiest fight. I'm going to make {a.obj} regret that." },
    ] },
    { id: 'co.s3', turns: [
      { by: 'a', say: "I'm calling out {b}. I want to go home on my terms, and I don't think I'm going home." },
      { by: 'tj', say: "Okay! {b}, you're going in, buddy!" },
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
    { id: 'co.g1', when: { votedMe: true }, turns: [
      { by: 'tj', say: "{a}! Who's it gonna be?" },
      { by: 'a', say: "{b}. And {b} knows exactly why." },
      { by: 'b', say: "Here we go." },
      { by: 'a', conf: "This has been coming for a while. {b} put my name out there, so now we settle it in here." },
    ] },
    { id: 'co.g2', when: { votedMe: true }, turns: [
      { by: 'a', say: "{b}. You voted me in. So guess what, you're coming with me." },
      { by: 'b', say: "That's fine. I'll see you in there." },
      { by: 'tj', say: "Oh, this is SPICY. Everybody heard that, right?" },
    ] },
    { id: 'co.g3', turns: [
      { by: 'a', say: "I'm calling out {b}, because I've had enough of the talking about me when I'm not in the room." },
      { by: 'b', conf: "{a} thinks this is about revenge. Fine. I don't mind going in there and proving {a.obj} wrong." },
    ] },
    { id: 'co.g4', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "{b}. It's you. It was always going to be you." },
      { by: 'b', say: "Bring it.", keep: ['bring it'] },
      { by: 'a', say: "Oh, I'm bringing it. I've been waiting to bring it." },
      { by: 'a', conf: "I don't care if I win or lose. I care that {b} has to stand across from me and look me in the eye." },
    ] },
    // a grudge that is not about the vote: they just do not get along
    { id: 'co.g5', turns: [
      { by: 'tj', say: "{a}, the moment of truth. Who's going in with you?" },
      { by: 'a', say: "{b}. We don't get along, and I'd rather settle it in there than keep pretending in the villa." },
      { by: 'b', say: "Finally, something we agree on." },
      { by: 'b', conf: "{a} and I were always going to end up here. At least now it's out in the open." },
    ] },
    { id: 'co.g6', turns: [
      { by: 'a', say: "I'm calling out {b}. I'm not going to stand here and pretend I like you." },
      { by: 'tj', say: "Honesty! Brutal, beautiful honesty! I love this job!" },
      { by: 'a', conf: "If I'm going in, I'm taking the person I can't stand with me. At least I'll enjoy it." },
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
      { by: 'tj', say: "A strategic choice! You picked the one you think you can beat. Okay!" },
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
      { by: 'a', conf: "I came in there and I took care of business. Now everybody who wanted me gone can watch me walk back through that door." },
    ] },
    { id: 'an.w2', turns: [
      { by: 'tj', say: "Two players, one game, zero mercy. It's {game} time!" },
      { beat: 'It\'s over fast. {b} never finds a way back in.' },
      { by: 'tj', say: "Clean, fast, and kind of beautiful. {a} wins it!" },
      { by: 'b', conf: "I gave it everything. It wasn't enough tonight, and that's going to hurt for a long time." },
    ] },
    { id: 'an.w3', turns: [
      { by: 'tj', say: "{a}, {b}, this is {game}, and only one of you is coming out of here with your bags still unpacked." },
      { beat: '{a} wins it without much of a fight.' },
      { by: 'a', say: "Let's go! That's what happens!" },
      { by: 'tj', say: "{b}, you were brave tonight. It just wasn't enough." },
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
      { beat: '{a} falls way behind, then fights back and wins.' },
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
      { by: 'a', conf: "I walked in, and the first thing I did was look at every single person who said my name. They know I know." },
    ] },
    { id: 'rt.f2', turns: [
      { by: 'a', say: "Well? Nobody's going to say welcome back?" },
      { by: 'b', say: "Welcome back. Really." },
      { by: 'a', say: "You don't get to be happy I'm back, {b}. You tried to send me home." },
      { by: 'b', conf: "Voting {a} in and watching {a.obj} come back is the worst thing that could happen. Now I'm sleeping across the room from somebody who wants revenge." },
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
      { by: 'a', say: "{gone} picked me as the easy one. That didn't work out.", v: { loud: ['{gone} called ME out?! {gone} is on a plane!'], soft: ['I didn\'t want it to come to that. I\'m just glad I\'m still here.'] } },
      { by: 'a', conf: "Getting called out and sending the caller home is the best feeling in this game.", v: { sharp: ['Lesson for everybody. Pick your fights more carefully.'] } },
    ] },
    { id: 'rt.c2', turns: [
      { by: 'a', conf: "{gone} picked the wrong person. Everybody in this villa just learned that.", v: { odd: ['{gone} thought I\'d be easy. I wasn\'t.'] } },
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
      { beat: '{a} sits alone on the beach with a coffee.' },
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
      { by: 'a', conf: "I'm being honest. {gone} was a problem for me, and that's over now." },
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
      { by: 'tj', say: "Pack your stuff. You're done." },
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
    // written long from the start (the long cut, 2026-10-16): TJ says it to their face, in front of the house
    { id: 'dq.4', turns: [
      { beat: 'TJ walks into the villa the next morning without knocking. Everybody knows why he is there.' },
      { by: 'tj', say: "Everybody in the common room. Now." },
      { by: 'tj', say: "{b}. Last night you put your hands on {a}." },
      { by: 'b', say: "TJ, it got out of hand. I'm sorry. It won't happen again." },
      { by: 'tj', say: "You're right. It won't. Because you're going home." },
      { by: 'b', say: "Please. One mistake." },
      { by: 'tj', say: "One mistake is the rule. You know the rule. Pack your bags." },
      { by: 'a', conf: "I didn't want anybody to go home like this. But I'm not going to pretend it was okay." },
    ] },
    { id: 'dq.5', turns: [
      { by: 'tj', say: "I watched the footage from last night. All of it." },
      { by: 'b', say: "Then you saw {a} start it." },
      { by: 'tj', say: "I saw {a} run their mouth. I saw you put your hands on somebody. Those are not the same thing." },
      { by: 'b', say: "So that's it?" },
      { by: 'tj', say: "That's it. You're disqualified. The car is outside." },
      { by: 'a', say: "{b}, I'm sorry it went this way." },
      { by: 'b', say: "No you're not." },
      { by: 'a', conf: "{b} is never going to forgive me for this, and half the house is going to blame me. That's my week now." },
    ] },
    { id: 'dq.6', turns: [
      { beat: 'The whole house is lined up in the common room. TJ is not smiling.' },
      { by: 'tj', say: "I love this show. I love the drama. I love the yelling. What I don't love is violence." },
      { by: 'tj', say: "{b}, you crossed the line last night. You're out. Effective immediately." },
      { by: 'b', say: "I can't believe this." },
      { by: 'tj', say: "Believe it, buddy. Say your goodbyes." },
      { by: 'a', conf: "I keep replaying it. One second we were arguing, and the next second it wasn't an argument any more." },
    ] },
  ],
  // ── the house, after an expulsion (party.js expelledGoodbye / expelledAftermath) ──
  'expelled-goodbye.tears': [
    { id: 'xg.t1', turns: [
      { beat: '{a} is packing in the bedroom. {b} sits on the bed and watches.' },
      { by: 'b', say: "I can't believe you're actually leaving." },
      { by: 'a', say: "Me neither. One stupid second." },
      { by: 'c', opt: 1, say: "We'll finish this for you. I promise." },
      { by: 'a', say: "Don't do anything stupid because of me. Promise me that instead." },
      { by: 'b', say: "I promise." },
      { beat: '{a} zips the bag shut. {b} hugs {a} for a long time.' },
      { by: 'a', conf: "I came here to win and I'm leaving in a car with my bag on my lap. I'll be thinking about last night for the rest of my life." },
    ] },
    { id: 'xg.t2', turns: [
      { by: 'b', say: "Do you need help with your stuff?" },
      { by: 'a', say: "I need help not crying in front of everybody." },
      { by: 'b', say: "Cry. Nobody's going to judge you." },
      { by: 'a', say: "Half of them are happy I'm going." },
      { by: 'c', opt: 1, say: "Not us. Never us." },
      { by: 'a', say: "I know. That's why this is hard." },
      { by: 'b', conf: "{a} was my person in here. Now I've got to play the rest of this without {a.obj}." },
    ] },
    { id: 'xg.t3', turns: [
      { beat: 'The car is waiting outside. {a} stops at the door and turns round.' },
      { by: 'a', say: "I'm sorry, everybody. I let you down." },
      { by: 'b', say: "You didn't let me down. Go home. Call your family." },
      { by: 'a', say: "Win this for me, okay?" },
      { by: 'b', say: "Okay." },
      { beat: 'The door shuts. The house stands there in silence for a minute.' },
      { by: 'b', conf: "I'm angry at {a}, and I miss {a} already. Both things are true." },
    ] },
  ],
  'expelled-goodbye.angry': [
    { id: 'xg.a1', turns: [
      { by: 'a', say: "This is a joke. {target} gets to stay, and I go home?" },
      { by: 'b', say: "You put your hands on somebody. You knew the rule." },
      { by: 'a', say: "{target} pushed me to it. Everybody saw it." },
      { by: 'c', opt: 1, say: "Calm down. Don't make it worse on your way out." },
      { by: 'a', opt: 'c', say: "Worse? How does it get worse?" },
      { by: 'b', say: "Just go home and cool off. Please." },
      { by: 'a', conf: "{target} played me. {target} knew exactly how to get under my skin, and I let it happen. I'll never forgive that." },
    ] },
    { id: 'xg.a2', turns: [
      { beat: '{a} throws clothes into a bag. {b} picks them up off the floor and folds them.' },
      { by: 'a', say: "Leave them." },
      { by: 'b', say: "I'm helping." },
      { by: 'a', say: "I don't want help. I want to stay." },
      { by: 'b', say: "I know. I'm sorry." },
      { by: 'a', say: "Watch {target} for me. Don't let {target} get comfortable." },
      { by: 'b', conf: "{a} is gone, and {target} is still here. I don't know how I'm supposed to look at {target} after this." },
    ] },
    { id: 'xg.a3', turns: [
      { by: 'a', say: "Tell {target} this isn't over." },
      { by: 'b', say: "It kind of is. You're going home." },
      { by: 'a', say: "Then you make sure it isn't over. For me." },
      { by: 'b', say: "I'm not fighting anybody for you." },
      { by: 'a', say: "I'm not asking you to fight. I'm asking you to send {target} into the Arena." },
      { by: 'b', conf: "The last thing {a} asked me for was revenge. I don't know if I can give {a} that." },
    ] },
  ],
  'expelled-blame.heated': [
    { id: 'xb.h1', turns: [
      { by: 'a', say: "I hope you're happy." },
      { by: 'b', say: "Happy? Somebody attacked me." },
      { by: 'a', say: "You pushed {gone} and pushed {gone} until something happened. You wanted this." },
      { by: 'b', say: "Nobody made {gone} do anything." },
      { by: 'a', say: "Keep telling yourself that. I'll be telling everybody else the truth." },
      { by: 'b', say: "Go ahead. TJ saw the tape." },
      { by: 'a', conf: "{gone} is gone because of {b}. Every vote from now on, I'm saying {b}'s name." },
    ] },
    { id: 'xb.h2', turns: [
      { beat: 'In the kitchen, {a} slams a cupboard shut when {b} walks in.' },
      { by: 'b', say: "Say it. You've been wanting to all morning." },
      { by: 'a', say: "You got my best friend sent home." },
      { by: 'b', say: "Your best friend got physical." },
      { by: 'a', say: "Because you wouldn't shut up." },
      { by: 'b', say: "That's not on me." },
      { by: 'b', conf: "I'm the one who got shoved, and somehow I'm the bad guy. That's this house for you." },
    ] },
    { id: 'xb.h3', turns: [
      { by: 'a', say: "Don't sit with us." },
      { by: 'b', say: "It's a big table." },
      { by: 'a', say: "Not big enough. Not today." },
      { by: 'b', say: "You know I didn't make {gone} do that." },
      { by: 'a', say: "I know you smiled when TJ said it." },
      { by: 'a', conf: "Maybe {b} didn't start it. {b} didn't stop it either. That's enough for me." },
    ] },
  ],
  'expelled-blame.calm': [
    { id: 'xb.c1', turns: [
      { by: 'a', say: "Can we talk about last night?" },
      { by: 'b', say: "If you're going to blame me, just say it." },
      { by: 'a', say: "I'm not blaming you. I'm just sad." },
      { by: 'b', say: "Me too, honestly. I didn't want anybody to go home." },
      { by: 'a', say: "I know. I just need some time before we're okay." },
      { by: 'a', conf: "It's not {b}'s fault. I know that. It still feels like it is." },
    ] },
    { id: 'xb.c2', turns: [
      { by: 'a', say: "{gone} was my closest friend in here." },
      { by: 'b', say: "I know. I'm sorry." },
      { by: 'a', say: "Are you?" },
      { by: 'b', say: "I'm sorry it went that far. I'm not sorry I'm still here." },
      { by: 'a', say: "Fair enough." },
      { by: 'b', conf: "{a} wants somebody to be angry at. I'm the easiest person to be angry at right now." },
    ] },
    { id: 'xb.c3', turns: [
      { beat: '{a} finds {b} out by the pool.' },
      { by: 'a', say: "I'm not going to yell at you. I just want to know what happened." },
      { by: 'b', say: "We were arguing. Then {gone} shoved me, and then everything happened at once." },
      { by: 'a', say: "Did you say something?" },
      { by: 'b', say: "I said a lot of things. None of them were worth getting sent home for." },
      { by: 'a', conf: "I believe {b}. I just wish I didn't have to." },
    ] },
  ],
  'expelled-victim.shaken': [
    { id: 'xv.s1', turns: [
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I don't know. My hands are still shaking." },
      { by: 'b', say: "Sit down. I'll get you some water." },
      { by: 'a', say: "Everybody's looking at me like I did something." },
      { by: 'b', say: "You didn't. You got hurt. That's all." },
      { by: 'a', conf: "I didn't want anybody sent home. And now I'm the reason somebody was, and the whole house knows it." },
    ] },
    { id: 'xv.s2', turns: [
      { by: 'a', say: "I keep seeing it when I close my eyes." },
      { by: 'b', say: "It's over. {gone} is gone." },
      { by: 'a', say: "That's what makes it worse. I didn't want this." },
      { by: 'b', say: "I know you didn't. I'll stick with you this week." },
      { by: 'a', conf: "{b} is the only one who's checked on me today. I'm going to remember that." },
    ] },
    { id: 'xv.s3', turns: [
      { by: 'a', conf: "One night out, and somebody is gone because of a fight with me. I'm going to have a target on my back for a long time." },
    ] },
  ],
  'expelled-victim.relieved': [
    { id: 'xv.r1', turns: [
      { by: 'b', say: "How are you feeling?" },
      { by: 'a', say: "Honestly? Safer." },
      { by: 'b', say: "You can't say that out loud in here." },
      { by: 'a', say: "I'm saying it to you. {gone} has been after me since day one." },
      { by: 'b', say: "Just don't look happy about it in front of everybody." },
      { by: 'a', conf: "I'm not glad it happened. I'm glad I don't have to sleep down the hall from {gone} any more." },
    ] },
    { id: 'xv.r2', turns: [
      { by: 'a', conf: "I'm not going to cry about {gone} going home. {gone} made my life miserable in here. Now it's over, and I can play the game." },
    ] },
    { id: 'xv.r3', turns: [
      { by: 'b', say: "You're smiling." },
      { by: 'a', say: "Am I?" },
      { by: 'b', say: "A little. Don't." },
      { by: 'a', say: "Okay. I'll stop. But I'm not sad." },
      { by: 'b', conf: "{a} needs to be careful. If the house thinks {a} is happy about this, {a} is next." },
    ] },
  ],
  'tj-house-meeting.any': [
    { id: 'tm.1', turns: [
      { by: 'tj', say: "I came to the villa on my day off, and I never come to the villa on my day off. {gone} is gone. Anybody else wants to throw a punch, you can throw it from the airport." },
      { by: 'a', conf: "TJ walking in the door was the scariest thing that's happened in here. Nobody said a word for an hour after he left." },
    ] },
    { id: 'tm.2', turns: [
      { by: 'tj', say: "Party's over, people. {gone} broke the one rule we have, and now {gone.sub} has to pack. Keep your hands to yourselves." },
      { by: 'a', conf: "It's going to be really quiet at the next party. Which is fine with me." },
    ] },
    { id: 'tm.3', turns: [
      { by: 'tj', say: "Look at me. Everybody look at me. You can yell, you can cry, you can vote each other in. You don't touch each other. {gone} learned that the hard way." },
      { by: 'a', conf: "I've never seen TJ that serious. It actually kind of shook me." },
    ] },
  ],
};
