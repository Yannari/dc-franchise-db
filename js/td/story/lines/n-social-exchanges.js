// Whole conversations for existing events. Roles and outcomes come from the simulator.
export default {
  "long.romance.flirt.any": [
    { id: "nrx.flirt1", place: "public", turns: [
      {"by":"a","say":"Can I sit here, or are you saving this spot for someone more impressive?","v":{"dry":"Is this seat free, or does sitting with you involve an interview?","warm":"Can I sit with you? I could use some company.","loud":"Tell me this spot isn't taken. I was trying to make an entrance."}},
      {"by":"b","say":"I was saving it for five minutes of peace. You have an ambitious opening.","v":{"dry":"I was hoping for quiet. This is a bold start.","warm":"You can sit. I'd like some quiet company, though.","loud":"An entrance? You're sitting down, not accepting a trophy."}},
      {"by":"a","say":"Okay. I can settle down."},
      {"by":"b","say":"You could have demonstrated that instead of announcing it."},
      {"beat":"{a} sits down. For a moment, neither speaks."},
      {"by":"b","say":"You can stop holding your breath. I said peaceful, not dead."},
      {"by":"a","say":"Good. I was starting to regret my whole approach."},
      {"by":"a","conf":"I wanted to look relaxed around {b}. Apparently my version of relaxed requires supervision."},
      {"by":"b","conf":"{a} actually tried being quiet because I asked. Then I missed the conversation. I'm choosing not to examine that."}
    ] },
    { id: "nrx.flirt2", place: "public", turns: [
      {"by":"b","say":"You look very pleased with yourself."},
      {"by":"a","say":"You came over. I'm taking that as a good sign."},
      {"by":"b","say":"I came over to see what you were smiling about."},
      {"by":"a","say":"Excellent. We have a very efficient system."},
      {"by":"b","say":"Does this work on people?"},
      {"by":"a","say":"You're still here."},
      {"by":"b","say":"I'm deciding whether that's a mistake."},
      {"by":"a","say":"Take your time. I like the company."},
      {"by":"b","conf":"That was such an obvious line. I had three perfectly good responses, and all I did was smile. Extremely disappointing work from me."}
    ] },
    { id: "nrx.flirt3", place: "public", turns: [
      {"by":"a","say":"I was going to say something charming, but I forgot it when you looked over."},
      {"by":"b","say":"You could just say hello."},
      {"by":"a","say":"Hello. That went much better in rehearsal."},
      {"by":"b","say":"You rehearsed?"},
      {"by":"a","say":"Please focus on how brave I was to admit that."},
      {"by":"b","say":"I am. It's giving you a lot of credit."},
      {"by":"a","say":"Can I try sitting next to you without rehearsing that too?"},
      {"by":"b","say":"Yes. You can even stay if the first sentence goes wrong."},
      {"by":"a","conf":"{b} saw the whole disaster and still made room. I like that more than I'd have liked delivering the perfect line."}
    ] }
  ],
  "long.romance.spark.any": [
    { id: "nrx.spark1", place: "public", turns: [
      {"by":"b","say":"Before we make this a thing, I have a question."},
      {"by":"a","say":"That sounded terrifyingly organized."},
      {"by":"b","say":"Do I get an honest answer when I ask about the game, or the answer you think will keep me happy?"},
      {"by":"a","say":"The honest one. Even if it makes this conversation longer."},
      {"by":"b","say":"Good. I want to like you without having to switch my brain off."},
      {"by":"a","say":"I was hoping you'd keep it on. I like talking to you."},
      {"by":"b","say":"Then yes. I want this to be a thing."},
      {"beat":"{a} reaches for {b.posAdj} hand, and {b} takes it."},
      {"by":"a","conf":"I expected to be asked whether I was serious. {b} asked whether I'd be honest when it was inconvenient. That made saying yes feel much bigger."},
      {"by":"b","conf":"I'm happy. I'm also aware we just gave the cameras an incredible amount of material. I'd like one minute before everyone starts having opinions."}
    ] },
    { id: "nrx.spark2", place: "public", turns: [
      {"by":"a","say":"I like you. I wanted to say it without turning it into a joke."},
      {"by":"b","say":"You look like holding the joke in is physically hurting you."},
      {"by":"a","say":"A little. Please answer before it gets worse."},
      {"by":"b","say":"I like you too. You can breathe now."},
      {"by":"a","say":"Great. Very cool. I had a much calmer reaction planned."},
      {"by":"b","say":"I prefer this one."},
      {"beat":"They sit closer, still smiling at each other."},
      {"by":"b","conf":"I didn't want a perfect speech. I wanted to know whether {a} meant it without an audience laughing. Now I know."},
      {"by":"a","conf":"If anyone asks, I handled that gracefully. If they show the footage, I have no further comment."}
    ] }
  ],
  "long.romance.moment.couple": [
    { id: "nrx.couple1", place: "public", turns: [
      {"by":"a","say":"Do you want company or a distraction?"},
      {"by":"b","say":"Company. But if you could be slightly distracting, that would help."},
      {"by":"a","say":"I can talk about how attractive I am."},
      {"by":"b","say":"I said slightly. That sounds like a full afternoon."},
      {"by":"a","say":"You have noticed, then."},
      {"by":"b","say":"I've noticed you're very easy to encourage."},
      {"by":"a","say":"I can also sit here and let you be upset."},
      {"by":"b","say":"Do that. Keep the terrible flirting available, though."},
      {"by":"b","conf":"{a} asked what I needed instead of telling me to cheer up. Then made an awful joke. Somehow that was exactly the right combination."}
    ] },
    { id: "nrx.couple2", place: "public", when: {"third":true}, turns: [
      {"by":"c","say":"Quick question. Am I interrupting a private conversation, or do you two just look like that now?"},
      {"by":"b","say":"Like what?"},
      {"by":"c","say":"Like I need to buy a ticket before I sit down."},
      {"by":"a","say":"You can sit down."},
      {"by":"c","say":"Thank you. Very generous of the romance department."},
      {"by":"b","say":"You could try being happy for us."},
      {"by":"c","say":"I can be happy for you and need someone to talk to. Those are compatible."},
      {"by":"a","say":"Fair. What do you want to talk about?"},
      {"by":"c","conf":"They made room. I was prepared to be extremely annoying about it, so honestly they got off lightly."}
    ] }
  ],
  "long.romance.moment.crush": [
    { id: "nrx.crush1", place: "public", turns: [
      {"by":"b","say":"You were about to say something."},
      {"by":"a","say":"I was deciding whether it was a good idea."},
      {"by":"b","say":"And the decision?"},
      {"by":"a","say":"Still under review."},
      {"by":"b","say":"You can ask me. I might even help with the review."},
      {"by":"a","say":"Would you want to sit with me for a while? Just us."},
      {"by":"b","say":"Yes. That one didn't need so much review."},
      {"by":"a","conf":"I nearly talked myself out of asking. Then {b} said yes like it was easy. I'd like to borrow that confidence for the next conversation."}
    ] }
  ],
  "long.romance.honeymoon.any": [
    { id: "nrx.honey1", place: "public", when: {"third":true}, turns: [
      {"by":"c","say":"I need to know whether I can still have an ordinary conversation with either of you."},
      {"by":"a","say":"Of course you can."},
      {"by":"c","say":"Good. {b}, stop looking at {a} for long enough to prove it."},
      {"by":"b","say":"I can listen and look at someone."},
      {"by":"c","say":"Then tell me what I just said."},
      {"by":"b","say":"Something extremely supportive about our relationship."},
      {"by":"a","say":"That's almost definitely wrong."},
      {"by":"c","say":"Thank you. At least one of you is still reachable."},
      {"by":"b","conf":"I heard every word. I just wanted to annoy {c}. Being this happy makes it very hard to look innocent."}
    ] },
    { id: "nrx.honey2", place: "public", turns: [
      {"by":"a","say":"I know this probably looks ridiculous from the outside."},
      {"by":"b","say":"I'm on the inside, and it looks a little ridiculous from here too."},
      {"by":"a","say":"Should I act less pleased when you sit down?"},
      {"by":"b","say":"Absolutely not. I worked hard on being this charming."},
      {"by":"a","say":"You asked if the seat was taken."},
      {"by":"b","say":"And look what happened. Excellent results."},
      {"by":"a","conf":"I'm aware we have become the people who laugh at things nobody else finds funny. I'd apologize, but {b} is about to say something else."}
    ] }
  ],
  "long.romance.jealous.any": [
    { id: "nrx.jealous1", place: "public", when: {"third":true}, turns: [
      {"by":"a","say":"Is there room for me in this conversation?"},
      {"by":"b","say":"Yes. You can sit here."},
      {"by":"c","say":"We were just talking."},
      {"by":"a","say":"I can see that. I'm trying not to make this unpleasant."},
      {"by":"b","say":"Then tell me what is bothering you without taking it out on {c}."},
      {"by":"a","say":"I wanted your attention. There. That's an embarrassing thing to say in front of everyone."},
      {"by":"c","say":"I can give you a minute. I'd appreciate not being treated like I stole something."},
      {"by":"a","say":"Okay. That's fair."},
      {"by":"a","conf":"I wanted {b} to notice I was upset without having to admit why. Unfortunately {b} asked, and I had to say the mortifying part out loud."}
    ] }
  ],
  "long.romance.fade.any": [
    { id: "nrx.fade1", place: "public", turns: [
      {"by":"a","say":"I don't want to keep calling this a relationship because ending it would be awkward."},
      {"by":"b","say":"It's going to be awkward. We still have to live here."},
      {"by":"a","say":"I know. I'd rather be awkward and honest than keep reassuring you about something I'm not feeling."},
      {"by":"b","say":"Thank you for telling me. I'm not ready to be cheerful about it."},
      {"by":"a","say":"You don't have to be. Do you want some space?"},
      {"by":"b","say":"Yes. And no big announcement to the camp. I want to tell people when I'm ready."},
      {"by":"b","conf":"It was a kind conversation. That doesn't make it painless. I still have to sit somewhere else and notice the empty spot."}
    ] }
  ],
  "long.romance.fade.soured": [
    { id: "nrx.soured1", place: "public", when: {"third":true}, turns: [
      {"by":"c","say":"Do you want me to leave you two alone?"},
      {"by":"b","say":"No. We're done talking."},
      {"by":"a","say":"You mean you're done answering."},
      {"by":"b","say":"I answered. You didn't like the answer."},
      {"by":"c","say":"Then I'm not going to make you repeat it for me."},
      {"by":"a","say":"Fine. But don't tell everyone we're perfectly fine."},
      {"by":"b","say":"I was not planning to. I'd like to get through the next five minutes first."},
      {"by":"a","conf":"I wanted an ending that made me feel less stupid for caring. There was not one."},
      {"by":"b","conf":"Now I have to be upset in a place where people can turn it into a discussion. I don't want to provide the discussion."}
    ] }
  ],
  "long.romance.rideordie.any": [
    { id: "nrx.ride1", place: "public", turns: [
      {"by":"b","say":"If we disagree about the game, do we get to say so?"},
      {"by":"a","say":"Yes. I'd rather argue with you than have you nod and resent me."},
      {"by":"b","say":"Good. Because I want us to get to the end, and I'm not promising to stop having opinions."},
      {"by":"a","say":"I like your opinions. I have concerns about how often they are about me."},
      {"by":"b","say":"That's what you get for being important to me."},
      {"by":"a","conf":"We want to reach the end together. That's going to take more than holding hands and assuming we have the same plan. I'm glad {b} said it."}
    ] }
  ],
  "long.romance.noticed.any": [
    { id: "nrx.notice1", place: "public", turns: [
      {"beat":"{a} watches {b} and {c} sit close together."},
      {"by":"a","conf":"I could make a joke about {b} and {c}, but I'm more interested in whether they tell each other things they don't tell me. Being a couple doesn't prove they share every plan. It gives me a very good reason to check."}
    ] }
  ],
  "long.romance.target.any": [
    { id: "nrx.target1", place: "public", turns: [
      {"by":"a","conf":"{b} and {c} have someone here who can reassure them without having to think about it. I want that advantage broken up. I still need people to agree with me, and walking over to complain that they are happy isn't much of a pitch."}
    ] }
  ],
  "long.romance.tri.confront": [
    { id: "nrx.triangle1", place: "public", when: {"third":true}, turns: [
      {"by":"a","say":"I need an answer about {c}. Not a joke, and not a question about why I'm upset."},
      {"by":"b","say":"I'm still trying to work out what I feel."},
      {"by":"a","say":"Then say that. Don't reassure me just to get through this conversation."},
      {"by":"b","say":"I like you. I'm also confused about {c}, and I know that's a horrible answer."},
      {"by":"a","say":"It is. It's still better than making me argue until you admit it."},
      {"by":"b","say":"What do you want me to do?"},
      {"by":"a","say":"Give me space. You don't get to ask me to make this easier for you."},
      {"by":"b","conf":"I wanted to explain without hurting {a}. That stopped being possible before I opened my mouth. Now I have to decide what I'm actually going to do."}
    ] }
  ],
  "long.crowd.banter.any": [
    { id: "nrx.group1", place: "public", turns: [
      {"by":"a","say":"If we were watching this instead of living it, who would be the hardest person to explain to someone?"},
      {"by":"b","say":"You. I'd need diagrams."},
      {"by":"c","say":"I'd start with the fact that you asked this question voluntarily."},
      {"by":"d","say":"Then we show them this conversation and let them work it out."},
      {"by":"a","say":"I was offering everyone a chance to talk about themselves."},
      {"by":"b","say":"You asked us to name someone confusing. We worked together beautifully."},
      {"by":"c","say":"Honestly, our most efficient team decision."},
      {"by":"a","conf":"I wanted an interesting group conversation. I got one. I should have specified that I wanted to enjoy it too."}
    ] },
    { id: "nrx.group2", place: "public", turns: [
      {"by":"a","say":"What is one thing you want people watching to understand about you?"},
      {"by":"b","say":"That I'm considerably more relaxed when nobody is pointing a camera at me."},
      {"by":"c","say":"I'd like them to know I'm trying, even when it looks bad."},
      {"by":"d","say":"I want them to give us some credit for living with each other."},
      {"by":"b","say":"That sounded aimed at someone."},
      {"by":"d","say":"It was generously aimed at everybody."},
      {"by":"a","say":"I was hoping for a sincere answer."},
      {"by":"c","say":"Mine was sincere. You can let it be sincere without making everyone else stop joking."},
      {"by":"c","conf":"I didn't want a big emotional scene. I wanted to say one true thing and still get to laugh with everyone afterward."}
    ] },
    { id: "nrx.group3", place: "public", turns: [
      {"by":"b","say":"Who do you think gives the best confessional?"},
      {"by":"a","say":"Me. I have an excellent working relationship with the camera."},
      {"by":"c","say":"The camera can't leave. That's a very forgiving relationship."},
      {"by":"d","say":"I bet {b} says something completely different once the door closes."},
      {"by":"b","say":"I'm not giving away the good material for free."},
      {"by":"a","say":"See? That's why mine are better. Generosity."},
      {"by":"c","say":"Volume. You mean volume."},
      {"by":"d","conf":"Now I want to watch everybody else in the booth. I also urgently want to know whether I've been giving the boring ones."}
    ] }
  ],
  "long.crowd.project.any": [
    { id: "nrx.project1", place: "public", turns: [
      {"by":"a","say":"We can get this done faster if everybody takes a job."},
      {"by":"b","say":"Excellent. What is your job?"},
      {"by":"a","say":"Making sure we agree on the jobs."},
      {"by":"c","say":"That's the part we're doing right now. Pick one for afterward."},
      {"by":"d","say":"I'll help {c}. {b}, do you want to work with {a}?"},
      {"by":"b","say":"I want {a} to ask instead of assigning me."},
      {"by":"a","say":"Would you help me?"},
      {"by":"b","say":"Yes. See how little time that took?"},
      {"by":"c","conf":"I'm glad we sorted that out. I didn't want our first completed task to be appointing a boss."}
    ] }
  ],
  "long.crowd.clash.any": [
    { id: "nrx.crowdclash1", place: "public", turns: [
      {"by":"a","say":"If you have a problem with what I said, answer me instead of looking around for support."},
      {"by":"b","say":"I'm looking around because you made it everybody's business."},
      {"by":"c","say":"We can all hear you. Neither of you needs to repeat it louder."},
      {"by":"a","say":"I'm asking for an answer."},
      {"by":"b","say":"You're asking for agreement. I answered, and you kept going."},
      {"by":"c","say":"Then say what you actually want from {b}."},
      {"by":"a","say":"I want to finish without being corrected."},
      {"by":"b","say":"You can finish. You don't get to decide whether I agree afterward."},
      {"by":"c","conf":"I thought I could calm them down by making them be specific. Now they are having a very specific argument. That's technically progress."}
    ] }
  ],
  "long.drama.clash.any": [
    { id: "nrx.clash1", place: "public", turns: [
      {"by":"a","say":"Can you stop making a face every time I speak?","v":{"dry":"Are you going to make that face every time I speak?","loud":"You could at least wait until I'm finished before making that face!","warm":"Could you tell me what you think instead of making that face?"}},
      {"by":"b","say":"Can you stop checking whether I approve?"},
      {"by":"a","say":"Everyone can see you doing it."},
      {"by":"b","say":"Then ask whether I disagree. You might get an answer you can use."},
      {"by":"a","say":"Fine. Do you disagree?"},
      {"by":"b","say":"Yes. I think you're deciding for people who haven't answered yet."},
      {"by":"a","say":"And you're very generously answering for them."},
      {"by":"b","conf":"I dislike being talked over. Apparently I dislike it enough to talk over someone else. I'm not thrilled that {a} noticed."}
    ] }
  ],
  "long.drama.dispute.any": [
    { id: "nrx.dispute1", place: "public", turns: [
      {"by":"a","say":"I said I could help. I didn't say you could decide how I spend the whole day."},
      {"by":"b","say":"I thought we had agreed."},
      {"by":"a","say":"You asked one question and added three jobs after I said yes."},
      {"by":"b","say":"Then tell me which part you're actually doing."},
      {"by":"a","say":"The part you asked me about. If you need more, ask."},
      {"by":"b","say":"Fine. Can you help with the rest?"},
      {"by":"a","say":"No. But I appreciate finally getting the choice."},
      {"by":"b","conf":"I genuinely thought we had a plan. {a} thought I had given an order. We're going to have an extremely literal conversation next time."}
    ] }
  ],
  "long.drama.fight.tense": [
    { id: "nrx.tense3", place: "public", when: {"third":true}, turns: [
      {"by":"a","say":"That's an interesting way to tell the story."},
      {"by":"b","say":"Then tell me which part you disagree with."},
      {"by":"a","say":"The part where you sound very reasonable and I sound difficult."},
      {"by":"b","say":"I can let you explain yourself. I can't promise the explanation will make you sound better."},
      {"by":"c","say":"Could you both stop addressing the room and talk to each other?"},
      {"by":"a","say":"I'm talking to {b}."},
      {"by":"b","say":"You're watching everyone else to see whether they laugh."},
      {"by":"c","say":"Nobody is laughing. You can stop waiting for it."},
      {"by":"a","conf":"That conversation would have gone a lot better without {c} announcing that my audience was not cooperating."}
    ] }
  ],
  "long.drama.fight.snap": [
    { id: "nrx.snap3", place: "public", turns: [
      {"by":"b","say":"You could have asked me before deciding I'd be fine with it."},
      {"by":"a","say":"I thought it was obvious!"},
      {"by":"b","say":"Then asking would have been a very short conversation."},
      {"by":"a","say":"Why does everything have to turn into an argument?"},
      {"by":"b","say":"Because you keep asking questions you don't want me to answer."},
      {"beat":"{a} takes a breath, but the next words still come out sharp."},
      {"by":"a","say":"Fine. Next time I'll ask. Are we done?"},
      {"by":"b","say":"For now. You don't get extra credit for sounding angry about it."},
      {"by":"b","conf":"I got the answer I wanted. I also got a very clear demonstration of how annoyed {a} was that I asked."}
    ] }
  ]
};
