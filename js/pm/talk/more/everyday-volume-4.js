// pm/talk/more/everyday-volume-4.js — volume for the everyday kinds after pull
// and friendship (the user, 2026-10-22: "address the repeats by increasing the
// volume of the dialogue ALOT"). Same facts and gates as each kind's own file:
// chat · deep-chat · kiss (the engine's ending, `end`), argument (`cause`,
// `end`), vent ({pa} is the one moaned about), date (`spark`), keeping-open,
// comedy, comfort (`why` the comforted one is down), advice (`verdict`).

export const CHAT_VOLUME = {
  moves: {
    open: [
      { stage: "{a} and {b} are lying side by side on the daybeds.", turns: [['a', "Can we just stay here forever?"], ['b', "Until the next text, at least."]] },
      { stage: "{a} sits down on {b}'s lap on the swing seat.", turns: [['b', "Hello."], ['a', "Hello. I've missed you."], ['b', "You saw me twenty minutes ago."], ['a', "Twenty long minutes."]] },
      { stage: "{a} brings {b} a drink and curls up next to {b.obj}.", turns: [['b', "What's this for?"], ['a', "For being you. Drink it."]] },
      { stage: "{a} and {b} are in the pool, {a}'s arms round {b}'s neck.", turns: [['b', "You're going to drown us both."], ['a', "Then we'll go together. Romantic."]] },
      { stage: "{a} finds {b} on the terrace and sits down close.", turns: [['a', "There you are. I've been looking everywhere."], ['b', "I've been right here."], ['a', "I didn't look up here. I'm not a detective."]] },
      { stage: "{a} and {b} share a sunbed under the big umbrella.", turns: [['b', "This sunbed's too small for two."], ['a', "Then hold on to me."]] },
      { stage: "{a} and {b} sit together on the roof terrace, away from everyone.", turns: [['a', "Peace and quiet. Finally."], ['b', "Just us."], ['a', "Just us. And the cameras. And the microphone on my chest."]] },
      { stage: "{a} and {b} are making toast together in the kitchen.", turns: [['b', "You've burnt it."], ['a', "It's well done. There's a difference."]] },
      { stage: "{a} lies with {a.posAdj} head in {b}'s lap on the lawn.", turns: [['b', "Comfy?"], ['a', "Very. Don't move. Ever."]] },
      { stage: "{a} and {b} are holding hands on the swing seat, rocking slowly.", turns: [['a', "I like this. Just this."], ['b', "Me too."]] },
      { stage: "{a} and {b} sit on the edge of the pool, shoulder to shoulder.", turns: [['b', "Talk to me."], ['a', "About what?"], ['b', "Anything. I just like your voice."]] },
      { stage: "{a} sneaks up behind {b} and wraps {a.posAdj} arms round {b.obj}.", turns: [['b', "I knew it was you."], ['a', "How?"], ['b', "Nobody else in here hugs that badly."]] },
    ],
    catch: [
      { turns: [['a', "How's your day been? Tell me everything."], ['b', "Everything? I've been asleep for half of it."], ['a', "Then tell me about the other half."]] },
      { turns: [['b', "What have you been up to? I've barely seen you."], ['a', "Nothing. Being dragged into gossip. I escaped to come and find you."]] },
      { turns: [['a', "Did you sleep all right last night?"], ['b', "Better than you. You kicked me twice."], ['a', "I did not."], ['b', "You did. I've got the bruises."]] },
      { turns: [['b', "You seem happy today."], ['a', "I am happy today. Is that suspicious?"], ['b', "In here? Very."]] },
      { turns: [['a', "What did you and the others talk about earlier? You were all laughing."], ['b', "You, mostly."], ['a', "Me?"], ['b', "Good things. Mostly."]] },
      { turns: [['b', "I saw you laughing with the others earlier. What was so funny?"], ['a', "Honestly, I can't even remember. Someone fell over. It's always someone falling over."]] },
      { turns: [['a', "Have you eaten? You get grumpy when you haven't eaten."], ['b', "I'm not grumpy."], ['a', "You're a bit grumpy."]] },
    ],
    topic: [
      { turns: [['a', "What would we be doing right now if we were at home?"], ['b', "I'd be at work. You'd be texting me pictures of your lunch."], ['a', "That sounds like a lovely life."]] },
      { turns: [['b', "Do you ever think about what your family thinks of me?"], ['a', "All the time. They'll love you. They'll love you more than me. That's my worry."]] },
      { turns: [['a', "What's the first date we'd go on, on the outside?"], ['b', "Somewhere with food. Lots of food. And no cameras."], ['a', "And no microphones."], ['b', "And no microphones. I'm going to miss the microphones a bit."]] },
      { turns: [['b', "What's your favourite thing about us?"], ['a', "That I don't have to pretend. With you, I'm just me. A bit more tanned."]] },
      { turns: [['a', "Do you think we'd have met, if not for this place?"], ['b', "Probably not. We'd have walked past each other in the street."], ['a', "I'd have noticed you."], ['b', "You'd have been looking at your phone."]] },
      { turns: [['b', "What do you miss most about home?"], ['a', "My bed. My dog. Being able to go to the shop on my own. Not you, though. You're here."]] },
      { turns: [['a', "I've been thinking about what you said yesterday."], ['b', "Which bit?"], ['a', "The bit about being scared of getting hurt. I'm not going to hurt you."], ['b', "You can't promise that."], ['a', "I can try."]] },
      { turns: [['b', "What's the one thing you'd change about the villa?"], ['a', "More shade. And a door that locks. And a way to turn off the birds at six in the morning."]] },
      { turns: [['a', "Do you think we're moving too fast?"], ['b', "In here, a week's a year. We're right on time."]] },
      { turns: [['b', "What did you think of me on the first night? Honestly."], ['a', "That you were way out of my league."], ['b', "And now?"], ['a', "Still out of my league. You just haven't noticed."]] },
      { turns: [['a', "What would you want a normal Sunday to look like with me?"], ['b', "Lie-in. Big breakfast. Long walk. Back to bed."], ['a', "That's a lot of bed."], ['b', "It's a very good Sunday."]] },
      { turns: [['b', "Tell me something you've never told anyone in here."], ['a', "I'm scared of the dark. A bit. Not a lot. Just a bit."], ['b', "I'll hold your hand."]] },
    ],
    tangent: [
      { turns: [['a', "Okay, quick fire. Cats or dogs?"], ['b', "Dogs."], ['a', "Sea or pool?"], ['b', "Pool. Fewer fish."], ['a', "Me or the sunbed?"], ['b', "Can I think about it?"]] },
      { turns: [['b', "If you could have one superpower in here, what would it be?"], ['a', "Teleporting to the front of the shower queue."], ['b', "That's so specific."], ['a', "It's so needed."]] },
      { turns: [['a', "What song would play if they made a film about us?"], ['b', "Something cheesy. Something really, really cheesy."], ['a', "Perfect."]] },
      { turns: [['b', "Would you rather be really funny or really clever?"], ['a', "Funny. Clever people are always worried."], ['b', "You're funny and worried."], ['a', "The worst of both."]] },
      { turns: [['a', "Rate today out of ten."], ['b', "Eight."], ['a', "Only eight?"], ['b', "There was a moment at lunch when someone took the last yoghurt."]] },
      { turns: [['b', "What's the most romantic thing anyone's ever done for you?"], ['a', "Honestly? Brought me soup when I was ill. That's it. I'm very easy to please."]] },
    ],
    feel: [
      { when: { end: 'warm' }, turns: [['a', "I really like this. Us. I don't say it enough."], ['b', "You say it every day."], ['a', "Then I'll say it twice a day."]] },
      { when: { end: 'warm' }, turns: [['b', "Do you know what I like about you? You never make me feel stupid."], ['a', "You're not stupid."], ['b', "I know. You still never make me feel it."]] },
      { when: { end: 'warm' }, turns: [['a', "Every time I'm with you, the villa goes quiet. In my head, I mean."], ['b', "That's the nicest thing anyone's said to me in here."]] },
      { when: { end: 'warm' }, turns: [['b', "I'm really happy, you know. With you. In here. Right now."], ['a', "Me too. Let's not jinx it."]] },
      { when: { end: 'warm' }, turns: [['a', "I didn't think I'd find anything real in here. Then there was you."], ['b', "Stop. You'll make me cry in front of everyone."]] },
      { when: { end: 'warm' }, turns: [['b', "You make everything in here easier. I hope you know that."], ['a', "I know. You do the same for me."]] },
      { when: { end: 'easy' }, turns: [['a', "This is nice. Nothing big. Just nice."], ['b', "Nice is underrated."]] },
      { when: { end: 'easy' }, turns: [['b', "I could do this all day."], ['a', "We have done this all day."], ['b', "And I'd do it again."]] },
      { when: { end: 'easy' }, turns: [['a', "I like that we don't have to fill every silence."], ['b', "Me too. Most people in here never stop talking."]] },
      { when: { end: 'easy' }, turns: [['b', "Are you happy?"], ['a', "Right now? Very."], ['b', "Good. Me too."]] },
      { when: { end: 'easy' }, turns: [['a', "You're easy to be around. I mean that as a big compliment."], ['b', "I'll take it as one."]] },
      { when: { end: 'flat' }, turns: [['a', "You're quiet today."], ['b', "Am I? Just tired, I think."], ['a', "Okay."]] },
      { when: { end: 'flat' }, turns: [['b', "Is everything all right with us?"], ['a', "Yeah. Of course it is. Why?"], ['b', "No reason."]] },
      { when: { end: 'flat' }, turns: [['a', "We've not really talked properly today."], ['b', "We're talking now."], ['a', "Are we, though?"]] },
      { when: { end: 'flat' }, turns: [['b', "I feel like you're somewhere else today."], ['a', "I'm right here."], ['b', "Your body is."]] },
      { when: { end: 'flat' }, turns: [['a', "Do you still like me?"], ['b', "What kind of question is that?"], ['a', "A real one."], ['b', "Of course I do."]] },
    ],
    close: [
      { when: { end: 'warm' }, turns: [], beat: "{a} kisses {b} on the cheek and goes to get them both a drink." },
      { when: { end: 'warm' }, turns: [['b', "Don't go far."], ['a', "I'm never far."]] },
      { when: { end: 'warm' }, turns: [], beat: "They stay curled up together until someone shouts that dinner's ready." },
      { when: { end: 'warm' }, turns: [['a', "Love this. Love you. Don't tell anyone."], ['b', "Everyone knows."]] },
      { when: { end: 'easy' }, turns: [], beat: "They lie back in the sun, fingers linked, and say nothing for a while." },
      { when: { end: 'easy' }, turns: [['b', "Pool?"], ['a', "Pool."]] },
      { when: { end: 'easy' }, turns: [], beat: "{a} pulls {b} up off the sunbed, and they wander off together." },
      { when: { end: 'easy' }, turns: [['a', "Same time tomorrow?"], ['b', "Same time every day."]] },
      { when: { end: 'flat' }, turns: [], beat: "{b} goes inside first. {a} stays on the sunbed a little longer than {a} needs to." },
      { when: { end: 'flat' }, turns: [['a', "I'll see you at dinner, then."], ['b', "Yeah. See you at dinner."]] },
      { when: { end: 'flat' }, turns: [], beat: "They sit side by side, both looking at the pool, neither of them saying what they're thinking." },
    ],
  },
};

export const DEEP_VOLUME = {
  moves: {
    question: [
      { turns: [['a', "Can I ask you something serious?"], ['b', "Go on."], ['a', "When was the last time you felt really happy? Before in here?"]] },
      { turns: [['b', "What's the hardest thing you've ever been through?"], ['a', "That's a big question for a sunbed."], ['b', "I know. I'd like to know."]] },
      { turns: [['a', "Why did you really come in here? Not the answer you give everyone."]] },
      { turns: [['b', "Who's the person you'd call first if something went wrong?"], ['a', "That's hard. I don't think anyone's ever asked me that."]] },
      { turns: [['a', "What are you scared people will find out about you?"], ['b', "Wow. Okay. Straight in."], ['a', "You don't have to answer."]] },
      { turns: [['b', "Do you think you're easy to love?"], ['a', "That's a horrible question."], ['b', "I know. I've been asking myself the same thing."]] },
      { turns: [['a', "What did your last relationship teach you?"], ['b', "That I need to say what I want. Out loud. Before it's too late."]] },
      { turns: [['b', "What do you want people to say about you, when you're old?"], ['a', "That I was kind. And that I was funny at least once."]] },
    ],
    answer: [
      { when: { end: 'open' }, turns: [['b', "Honestly? I've always been the one who looks after everyone else. Nobody really looks after me. I didn't realise how much I wanted that until I came in here."], ['a', "I'll look after you."]] },
      { when: { end: 'open' }, turns: [['b', "My parents split up when I was young, and I spent years thinking it was something I'd done. I know it wasn't. Some days I still feel it."], ['a', "Thank you for telling me that."]] },
      { when: { end: 'open' }, turns: [['b', "I've been hurt before. Badly. I said I'd never let anyone in like that again. And then you came along, and I'm terrified, and I'm doing it anyway."]] },
      { when: { end: 'open' }, turns: [['b', "I'm not as confident as I look. Most days I'm just pretending, and hoping nobody notices."], ['a', "I noticed. I like you more for it."]] },
      { when: { end: 'open' }, turns: [['b', "I lost someone a couple of years ago. Someone close. I don't talk about it much. I'm talking about it now."], ['a', "I'm here. Take your time."]] },
      { when: { end: 'guarded' }, turns: [['b', "I don't really talk about that stuff. Can we talk about something else?"], ['a', "Of course. Whenever you're ready. If you're ever ready."]] },
      { when: { end: 'guarded' }, turns: [['b', "Ask me again another day. I'm not there yet."], ['a', "I'll ask again."], ['b', "I know you will."]] },
      { when: { end: 'guarded' }, turns: [['b', "It's a long story, and it's not a nice one. Maybe one day."], ['a', "One day's fine."]] },
      { when: { end: 'guarded' }, turns: [['b', "Why does everyone in here want to go so deep? Can't we just have a laugh?"], ['a', "We can have a laugh. I just want to know you."]] },
    ],
    mine: [
      { turns: [['a', "I'll tell you mine. I'm scared I'm too much for people. I always have been. I talk too loud, I feel too much."], ['b', "You're not too much. Not for me."]] },
      { turns: [['a', "Can I tell you something? I nearly didn't come in here. I was scared nobody would like me."], ['b', "Everybody likes you."], ['a', "That's not true. But thank you."]] },
      { turns: [['a', "For what it's worth, I've been there too. Not the same, but close. You're not on your own with it."]] },
      { turns: [['a', "My turn. I've never really been in love. Not properly. I think I've been waiting for it my whole life."]] },
    ],
    meaning: [
      { when: { end: 'open' }, turns: [['a', "I feel like I know you properly now. Not the villa version. You."], ['b', "That's the scariest and nicest thing at the same time."]] },
      { when: { end: 'open' }, turns: [['b', "I've never said any of that out loud before."], ['a', "Then I'm honoured. Really."]] },
      { when: { end: 'open' }, turns: [['a', "This changes things, doesn't it? Between us."], ['b', "I think it does. In a good way."]] },
      { when: { end: 'open' }, turns: [['b', "Thank you for listening. Most people just wait for their turn to talk."], ['a', "I wanted to hear all of it."]] },
      { when: { end: 'guarded' }, turns: [['a', "I'm not going anywhere. Whenever you want to talk, I'm here."], ['b', "I know. That helps."]] },
      { when: { end: 'guarded' }, turns: [['b', "I'm sorry I'm like this."], ['a', "Don't be sorry. You're allowed to keep some things for yourself."]] },
    ],
    close: [
      { when: { end: 'open' }, turns: [], beat: "{a} holds {b}'s hand, and they sit there for a long time without saying anything." },
      { when: { end: 'open' }, turns: [['b', "Can we just stay here a bit longer?"], ['a', "As long as you want."]] },
      { when: { end: 'guarded' }, turns: [], beat: "{b} changes the subject, and {a} lets {b.obj}." },
      { when: { end: 'guarded' }, turns: [['a', "Come on. Let's go and get a drink."], ['b', "Thank you."]] },
      { turns: [], beat: "They walk back to the others slowly, closer than when they sat down." },
    ],
  },
};

export const KISS_VOLUME = {
  moves: {
    open: [
      { stage: "{a} and {b} are lying on the daybeds, faces very close.", turns: [] },
      { stage: "{a} finds {b} by the pool and doesn't say a word.", turns: [] },
      { stage: "{a} and {b} are standing in the kitchen, waiting for the kettle, and not watching it.", turns: [] },
      { stage: "{a} pulls {b} onto the swing seat next to {a.obj}.", turns: [] },
      { stage: "{a} and {b} are in the pool, {a}'s arms round {b}.", turns: [] },
      { stage: "{a} and {b} are on the terrace, the music low.", turns: [] },
    ],
    lead: [
      { turns: [['a', "Come here."], ['b', "I'm already here."], ['a', "Closer."]] },
      { turns: [['b', "Why are you looking at me like that?"], ['a', "Like what?"], ['b', "Like you're about to do something."]] },
      { turns: [['a', "You've got something on your lip."], ['b', "Have I?"], ['a', "No."]] },
      { turns: [['b', "Are you going to kiss me or just stare?"], ['a', "I was getting there."]] },
      { turns: [['a', "I've wanted to do this all day."], ['b', "Then stop talking about it."]] },
      { turns: [['b', "Everyone's watching."], ['a', "Let them watch."]] },
    ],
    kiss: [
      { turns: [], beat: "{a} kisses {b}, slowly, and the rest of the villa goes on without them." },
      { turns: [], beat: "{b} leans in first. It's a long kiss." },
      { turns: [], beat: "They kiss, and when they stop, they're both laughing." },
      { turns: [], beat: "{a} kisses {b}, and somebody by the pool wolf-whistles." },
      { turns: [], beat: "It starts as a quick kiss and doesn't end as one." },
    ],
    after: [
      { when: { end: 'warm' }, turns: [['b', "I'll never get tired of that."], ['a', "Good. I'm not planning on stopping."]] },
      { when: { end: 'warm' }, turns: [['a', "Wow."], ['b', "Every time, you say wow."], ['a', "Every time, it's wow."]] },
      { when: { end: 'warm' }, turns: [['b', "You're a very good kisser. Don't let it go to your head."], ['a', "Too late."]] },
      { when: { end: 'easy' }, turns: [['a', "That was nice."], ['b', "Just nice?"], ['a', "Very nice. Extremely nice. The nicest."]] },
      { when: { end: 'easy' }, turns: [['b', "I like kissing you."], ['a', "I like being kissed by you."]] },
      { when: { end: 'first' }, turns: [['a', "We've been building up to that for days."], ['b', "Was it worth the wait?"], ['a', "Every second."]] },
      { when: { end: 'first' }, turns: [['b', "That was our first kiss."], ['a', "I know."], ['b', "I'm going to remember that."]] },
      { when: { end: 'off' }, turns: [['b', "Are you all right?"], ['a', "Yeah. Fine. Just tired."], ['b', "That kiss felt tired."]] },
      { when: { end: 'off' }, turns: [['a', "Sorry. I'm a bit distracted."], ['b', "By what?"], ['a', "Nothing. Honestly."]] },
    ],
    close: [
      { when: { end: 'warm' }, turns: [], beat: "They stay wrapped up together until the sun moves off the daybeds." },
      { when: { end: 'easy' }, turns: [], beat: "{b} rests {b.posAdj} head on {a}'s shoulder, smiling." },
      { when: { end: 'first' }, turns: [], beat: "They both try to act normal for the rest of the afternoon. They both fail." },
      { when: { end: 'off' }, turns: [], beat: "{a} gets up to go and get a drink, and takes a long time about it." },
    ],
  },
};

const ABOUT = ['jealous', 'envy', 'rival', 'stole', 'told'];
export const ARGUMENT_VOLUME = {
  moves: {
    start: [
      { when: { cause: 'jealous' }, turns: [['a', "I saw you with {about}. Everyone saw you with {about}. You were all over each other."], ['b', "We were talking."], ['a', "That wasn't talking. I know what talking looks like."]] },
      { when: { cause: 'jealous' }, turns: [['a', "Can you explain the last hour? Because from where I was sitting, it looked a lot like flirting with {about}."]] },
      { when: { cause: 'mismatch' }, turns: [['a', "I feel like I'm the only one trying here. Every time I say how I feel, you change the subject."], ['b', "That's not fair."]] },
      { when: { cause: 'mismatch' }, turns: [['a', "Do you even want this? Be honest. Because I'm all in, and I don't know where you are."]] },
      { when: { cause: 'stress' }, turns: [['a', "Can you just leave me alone for five minutes? Please?"], ['b', "What have I done?"], ['a', "Nothing! That's the point! I just need five minutes!"]] },
      { when: { cause: 'stress' }, turns: [['a', "I can't do this today. I can't do any of it. Not you, not them, not this villa."]] },
      { when: { cause: 'bicker' }, turns: [['a', "You left your towel on the floor again."], ['b', "It's a towel."], ['a', "It's every day. Every single day."]] },
      { when: { cause: 'bicker' }, turns: [['b', "You took my side of the bed again."], ['a', "There aren't sides."], ['b', "There are sides. You know there are sides."]] },
      { when: { cause: 'envy' }, turns: [['a', "You know I liked {about}. You knew from the first week. And you went ahead anyway."]] },
      { when: { cause: 'rival' }, turns: [['a', "Stay away from {about}. I mean it. I've seen how you look."], ['b', "I can talk to who I want."]] },
      { when: { cause: 'stole' }, turns: [['a', "You took {about} from me at that fire pit, and then you smiled at me at breakfast. How?"]] },
      { when: { cause: 'voted' }, turns: [['a', "You voted against me. You looked me in the eye at the fire pit and you voted against me."], ['b', "It was a vote. It wasn't about you."], ['a', "My name was on it."]] },
      { when: { cause: 'told' }, turns: [['a', "Why did you tell {about}? That was mine to tell. Mine."], ['b', "I thought {about} should know."]] },
      { when: { cause: 'clash' }, turns: [['a', "Every time I open my mouth, you've got something to say about it."], ['b', "Maybe stop saying things that need something said about them."]] },
      { when: { cause: 'clash' }, turns: [['b', "Do you have a problem with me?"], ['a', "Do you want the list?"]] },
    ],
    defend: [
      { when: { cause: ABOUT }, turns: [['b', "You're twisting it. You always twist it. I didn't do anything you're saying I did."]] },
      { when: { cause: 'mismatch' }, turns: [['b', "I'm trying. I'm just slower than you. That doesn't mean I don't care."]] },
      { when: { cause: 'stress' }, turns: [['b', "Don't take it out on me. I'm the one person in here who's on your side."]] },
      { when: { cause: 'bicker' }, turns: [['b', "It's a towel. A towel. Of all the things to argue about."]] },
      { when: { cause: 'voted' }, turns: [['b', "I had to pick someone. I picked the couple I believed in least. I'm sorry it was yours."]] },
      { when: { cause: 'clash' }, turns: [['b', "I've tried with you. Honestly, I've tried. You don't make it easy."]] },
      { turns: [['b', "You're not even listening to me. You've decided I'm wrong, and that's it."]] },
      { turns: [['b', "I'm not doing this with everyone watching. Can we talk about it later?"], ['a', "No. Now."]] },
    ],
    escalate: [
      { turns: [['a', "Don't walk away from me."], ['b', "Then stop shouting at me."], ['a', "I'm not shouting!"], ['b', "You're shouting."]] },
      { turns: [['b', "You always do this."], ['a', "Always? Name one other time."], ['b', "Do you want the list?"]] },
      { turns: [['a', "This is exactly what I was talking about. You never take anything seriously."], ['b', "And you take everything too seriously."]] },
      { turns: [['b', "Can we lower our voices? People can hear."], ['a', "Let them hear. I've got nothing to hide. Have you?"]] },
      { turns: [['a', "You've made me feel stupid, and I hate feeling stupid."], ['b', "I didn't make you feel anything."]] },
      { turns: [['b', "Why are you bringing that up? That was days ago."], ['a', "Because it never got sorted. Nothing ever gets sorted with you."]] },
      { turns: [['a', "Every time something goes wrong, it's somehow my fault."], ['b', "I never said that."], ['a', "You never have to."]] },
      { turns: [['b', "I'm done. I'm not doing this."], ['a', "You're always done when you're losing."]] },
      { turns: [['a', "Do you know what? Forget it. Forget I said anything."], ['b', "No. You started it. Finish it."]] },
      { turns: [['b', "This isn't even about the thing you're shouting about, is it?"], ['a', "Maybe not."]] },
    ],
    end: [
      { when: { end: 'make-up' }, turns: [['a', "I'm sorry. I got carried away."], ['b', "So did I."], ['a', "Can we start again?"], ['b', "Come here."]] },
      { when: { end: 'make-up' }, turns: [['b', "I hate arguing with you."], ['a', "I hate it more."], ['b', "It's not a competition."], ['a', "If it was, I'd win."]] },
      { when: { end: 'make-up' }, turns: [], beat: "Halfway through a sentence, {a} starts laughing, and then so does {b}, and it's over." },
      { when: { end: 'walk-off' }, turns: [['a', "I'm going. I can't talk to you right now."]], beat: "{a} walks off to the dressing room. {b} stays where {b} is." },
      { when: { end: 'walk-off' }, turns: [['b', "Fine. Go. I'll be here when you've calmed down."]], beat: "{a} goes, and doesn't look back." },
      { when: { end: 'walk-off' }, turns: [], beat: "{b} gets up and leaves mid-sentence, and the whole kitchen pretends not to have seen." },
      { when: { end: 'simmer' }, turns: [['a', "We'll talk about this later."], ['b', "Can't wait."]], beat: "Neither of them means it nicely." },
      { when: { end: 'simmer' }, turns: [], beat: "They go back to sitting next to each other, saying nothing, which is somehow worse." },
      { when: { end: 'simmer' }, turns: [['b', "Are we okay?"], ['a', "We're fine."]], beat: "They're not fine." },
    ],
  },
  notes: [
    { stage: "{a} and {b} have a short, sharp fight by the pool, and then avoid each other for an hour." },
    { stage: "{a} and {b} bicker about nothing in the kitchen, loudly." },
    { stage: "{a} snaps at {b} at dinner, and the whole table goes quiet." },
    { stage: "{a} and {b} have words on the terrace, and go to bed not speaking." },
    { stage: "A small comment turns into a big fight between {a} and {b}." },
  ],
};

export const VENT_VOLUME = {
  moves: {
    open: [
      { stage: "{a} drags {b} up to the roof terrace.", turns: [['a', "I need to vent. Can I vent?"], ['b', "Vent away."]] },
      { stage: "{a} sits down next to {b} and puts {a.posAdj} head in {a.posAdj} hands.", turns: [['b', "Uh oh. What's happened?"]] },
      { stage: "{a} finds {b} in the dressing room and shuts the door.", turns: [['a', "Can I say something, and you don't tell anyone?"], ['b', "Always."]] },
      { stage: "{a} flops onto the sunbed next to {b} with a huge sigh.", turns: [['b', "That was a big sigh."], ['a', "It's been a big day."]] },
      { stage: "{a} walks {b} to the far end of the garden.", turns: [['a', "I need to get something off my chest, and you're the only one I trust with it."]] },
    ],
    moan: [
      { turns: [['a', "{pa} hasn't asked me a single question about myself all day. Not one. I've asked about a hundred."]] },
      { turns: [['a', "Sometimes I feel like I'm in a couple on my own. {pa} is lovely. {pa} is just never really there."]] },
      { turns: [['a', "{pa} said something at lunch that's been bugging me all afternoon. It wasn't even mean. It just made me feel small."]] },
      { turns: [['a', "I don't know if {pa} actually likes me, or just likes not being single."]] },
      { turns: [['a', "{pa} keeps saying we're solid. I keep wondering how {pa} knows, because I don't."]] },
      { turns: [['a', "Every time someone new walks in, {pa} goes quiet. I notice. I always notice."]] },
      { turns: [['a', "I feel like I have to perform for {pa}. Be funny, be fun, be up for it. I'm tired."]] },
      { turns: [['a', "{pa} is great with everyone else. With me, it's like talking to a wall some days."]] },
    ],
    answer: [
      { turns: [['b', "Have you told {pa} any of this?"], ['a', "No. I don't want a fight."], ['b', "It sounds like you need one."]] },
      { turns: [['b', "I don't think that's you overthinking. I think that's real."]] },
      { turns: [['b', "You deserve someone who makes you feel like the best thing in here. Does {pa}?"], ['a', "Some days."]] },
      { turns: [['b', "Talk to {pa}. Honestly. It might be nothing, or it might be everything, and either way you'd know."]] },
      { turns: [['b', "I'm not going to tell you what to do. But I'm on your side, whatever you decide."]] },
      { turns: [['b', "Do you want me to say something to {pa}?"], ['a', "God, no."], ['b', "Then you'll have to."]] },
      { turns: [['b', "Everyone goes through this in here. The villa makes everything ten times bigger."]] },
    ],
    close: [
      { turns: [['a', "Thanks for listening. I feel better already."], ['b', "That's what I'm here for."]] },
      { turns: [], beat: "{a} wipes {a.posAdj} eyes, laughs at {a.ref}, and gets up." },
      { turns: [['b', "Go and talk to {pa}."], ['a', "In a minute."]] },
      { turns: [], beat: "{b} squeezes {a}'s hand, and they go back down together." },
    ],
  },
  notes: [
    { stage: "{a} vents to {b} about {pa}, and feels better for it." },
    { stage: "{a} tells {b} everything that's been bothering {a.obj} about {pa}." },
    { stage: "{a} vents to {b} on the roof terrace, away from everyone." },
    { stage: "{b} listens to {a} complain about {pa} for half an hour, and doesn't judge once." },
  ],
};

export const DATE_VOLUME = {
  moves: {
    setting: [
      { stage: "A table on the beach, with candles that keep going out in the breeze.", turns: [] },
      { stage: "A picnic blanket on a hill above the sea, with too much food for two people.", turns: [] },
      { stage: "A little restaurant terrace, just the two of them and a nervous waiter.", turns: [] },
      { stage: "A boat bobbing in a quiet bay, a cool box and two cushions.", turns: [] },
      { stage: "A rooftop with a view of the whole island, and two very full glasses.", turns: [] },
    ],
    open: [
      { turns: [['a', "This is so nice. Whose idea was this?"], ['b', "Not mine. I'm not this organised."]] },
      { turns: [['b', "I'm actually nervous. Is that stupid?"], ['a', "No. I'm nervous too. I've changed my mind about the food three times."]] },
      { turns: [['a', "So. A date. A real one."], ['b', "With real cutlery and everything."]] },
      { turns: [['b', "You look nice. Really nice."], ['a', "So do you. I made an effort."], ['b', "I can tell. Thank you."]] },
    ],
    talk: [
      { turns: [['a', "What do you actually want, from all this? Long term."], ['b', "Someone to come home to. That's it. That's all I've ever wanted."]] },
      { turns: [['b', "What's the most spontaneous thing you've ever done?"], ['a', "Come in here."], ['b', "That's cheating."], ['a', "It's true, though."]] },
      { turns: [['a', "Tell me about your family."], ['b', "Loud. Very loud. Everyone talks at once, and somehow everyone hears everything."]] },
      { turns: [['b', "What's your idea of a perfect weekend?"], ['a', "Nothing planned. A long breakfast. Somewhere new. Someone to share it with."]] },
      { turns: [['a', "Do you believe in love at first sight?"], ['b', "No. Second sight, maybe. Third, definitely."]] },
    ],
    end: [
      { when: { spark: true }, turns: [['a', "I don't want this to end."], ['b', "Then let's not go back yet."]] },
      { when: { spark: true }, turns: [['b', "This was perfect. You were perfect."], ['a', "Stop. You'll make me blush in front of the waiter."]] },
      { when: { spark: false }, turns: [['b', "That was nice. Thank you for asking me."], ['a', "Thank you for coming."]] },
      { when: { spark: false }, turns: [['a', "Well. That was lovely food."], ['b', "It was very lovely food."]] },
    ],
    close: [
      { turns: [], beat: "They go back to the villa, and everyone is waiting to hear all about it." },
      { turns: [], beat: "On the way back, {b} keeps glancing at {a}, and {a} keeps pretending not to notice." },
      { turns: [], beat: "They walk back into the villa together, and three people ask how it went at once." },
    ],
  },
};

export const KEEPING_OPEN_VOLUME = {
  moves: {
    lead: [
      { turns: [['b', "Can I ask you something? Where are we, you and me?"]] },
      { turns: [['b', "I need to know where your head's at. With us."]] },
    ],
    say: [
      { turns: [['a', "I like you. I really do. But I'm not ready to close off. I want to be honest with you about that."]] },
      { turns: [['a', "I don't want to lie to you. I'm keeping my options open. Just for now."]] },
      { turns: [['a', "It's early. For me, anyway. I want to see how things go before I close anything off."]] },
      { turns: [['a', "I'm not there yet. I wish I was, because you deserve that. I'm just not."]] },
    ],
    answer: [
      { turns: [['b', "Okay. Thanks for being honest. I don't love it, but thanks."]] },
      { turns: [['b', "Right. Okay. I'll keep mine open, then."], ['a', "That's fair."]] },
      { turns: [['b', "I'd rather know now than at a recoupling."], ['a', "That's why I said it."]] },
    ],
  },
};

export const COMEDY_VOLUME = {
  moves: {
    bit: [
      { stage: "{a} is giving the kitchen a tour of the villa, like a tour guide.", turns: [['a', "And on your left, the sunbed where three hearts were broken this week. Please keep your hands inside the villa at all times."]] },
      { stage: "{a} stands on a chair by the pool to make an announcement.", turns: [['a', "Ladies and gentlemen. I have lost a flip-flop. If anyone has seen a single flip-flop, please return it. There will be no reward."]] },
      { stage: "{a} is doing a nature documentary voice about the islanders on the lawn.", turns: [['a', "And here we see them, the villa couple, in their natural habitat. Sunbathing. Arguing about towels. Truly majestic."]] },
      { stage: "{a} holds a spoon like a microphone at the kitchen island.", turns: [['a', "Breaking news. Somebody has finished the good cereal and put the box back empty. The villa is in shock. More at six."]] },
      { stage: "{a} attempts to teach a dance class on the terrace. Nobody turns up but two islanders.", turns: [['a', "Okay, class. Step one: believe in yourself. Step two: I don't know step two."]] },
      { stage: "{a} narrates a game of volleyball like it's a final.", turns: [['a', "It's going up, it's going up, it's going over the wall. It's gone. We've lost another ball. That's three today."]] },
      { stage: "{a} is reviewing the villa's sunbeds out loud.", turns: [['a', "This one, four stars. Good shade. Bit wobbly. This one, two stars. It's attacked me twice."]] },
      { stage: "{a} has made a crown out of a towel and is sitting on the swing seat like a throne.", turns: [['a', "I'll be taking questions now. One at a time. Bring me a snack."]] },
      { stage: "{a} is doing very dramatic slow-motion running by the pool.", turns: [['a', "This is how I'm entering the next recoupling. Nobody stop me."]] },
      { stage: "{a} is giving a weather report from the lawn.", turns: [['a', "Today: hot. Tomorrow: hot. The day after: you'll never guess. Hot."]] },
      { stage: "{a} reads out the ingredients on a cereal box in a very serious voice.", turns: [['a', "Wheat. Sugar. More sugar. A vitamin I can't pronounce. Truly, a love story."]] },
      { stage: "{a} tries to do a cartwheel, gets halfway, and stays there.", turns: [['a', "I'm committing to this. This is the pose now. This is art."]] },
    ],
    tag: [
      { turns: [], beat: "The whole kitchen is in bits." },
      { turns: [], beat: "Even the ones trying to sunbathe are laughing." },
      { turns: [], beat: "Somebody throws a cushion at {a}, which only encourages {a.obj}." },
      { turns: [], beat: "{a} takes a bow, and gets a round of applause from exactly two people." },
    ],
  },
};

export const COMFORT_VOLUME = {
  moves: {
    find: [
      { stage: "{a} finds {b} sitting on the bathroom floor.", turns: [['a', "Hey. Can I come in?"], ['b', "You're already in."]] },
      { stage: "{a} spots {b} alone at the end of the garden, and goes straight over.", turns: [['a', "I saw you from the kitchen. Shove up."]] },
      { stage: "{a} sits down quietly next to {b} on the stairs.", turns: [['b', "I'm fine."], ['a', "I didn't ask."]] },
    ],
    why: [
      { when: { why: 'heartbreak' }, turns: [['b', "I thought it was going somewhere. I really did. And now I have to see it every day."]] },
      { when: { why: 'stress' }, turns: [['b', "It's just everything. The texts, the fire pits, never knowing. I can't switch off."]] },
      { when: { why: 'lonely' }, turns: [['b', "Everyone's got someone. I'm sitting here like a spare part."]] },
      { when: { why: 'guilt' }, turns: [['b', "I did something I'm not proud of. I can't stop thinking about it."]] },
      { when: { why: 'jealousy' }, turns: [['b', "Every time they laugh together, I feel sick. I hate being like this."]] },
      { when: { why: 'homesick' }, turns: [['b', "I just miss home. I miss normal. I miss being bored on my own sofa."]] },
    ],
    hold: [
      { turns: [['a', "Come here."]], beat: "{a} wraps {b} up in a hug and doesn't let go." },
      { turns: [['a', "You don't have to talk. I'll just sit here."], ['b', "Thank you."]] },
      { turns: [['a', "It's okay to not be okay in here. Everyone is, some days. They just hide it better."]] },
    ],
    lift: [
      { turns: [['a', "Do you want to hear something stupid that'll make you laugh?"], ['b', "Go on."], ['a', "I fell in the pool this morning. Fully dressed. Nobody saw. Until now."]] },
      { turns: [['a', "Let's go and get the biggest bowl of ice cream in this villa and eat it on the roof."], ['b', "That's the best idea anyone's had all week."]] },
    ],
    close: [
      { turns: [], beat: "{b} rests {b.posAdj} head on {a}'s shoulder, and they stay there for a long time." },
      { turns: [['b', "Thank you. I mean it."], ['a', "Always. Every time."]] },
      { turns: [], beat: "By the time they go back down, {b} is smiling again. Just about." },
    ],
  },
};

export const ADVICE_VOLUME = {
  moves: {
    open: [
      { stage: "{a} grabs {b} on the way past the kitchen.", turns: [['a', "Can I give you some advice? You can ignore it."], ['b', "I probably will. Go on."]] },
      { stage: "{a} sits down next to {b} on the swing seat.", turns: [['a', "Can I be honest with you about something?"], ['b', "You're always honest. Go on."]] },
    ],
    ask: [
      { turns: [['b', "What do you really think of {c}? Honestly. Not the nice version."]] },
      { turns: [['b', "Am I mad, with {c}? Tell me if I'm mad."]] },
      { turns: [['b', "You've watched me and {c}. What do you see?"]] },
    ],
    verdict: [
      { when: { verdict: 'good' }, turns: [['a', "I think {c} is good for you. You laugh more. You're calmer. That's what I see."]] },
      { when: { verdict: 'good' }, turns: [['a', "Honestly? I like {c}. I didn't at first. But {c} looks at you like you're the only one in here."]] },
      { when: { verdict: 'bad' }, turns: [['a', "I don't trust {c}. I'm sorry. Something about how {c} is when you're not around."]] },
      { when: { verdict: 'bad' }, turns: [['a', "I think you deserve more than {c} is giving you. That's all I'll say."]] },
      { when: { verdict: 'unsure' }, turns: [['a', "I don't know yet. {c} is hard to read. Give it a few more days."]] },
      { when: { verdict: 'unsure' }, turns: [['a', "Some days I think {c} is great for you, and some days I'm not sure. I'm being honest."]] },
    ],
    close: [
      { turns: [['b', "Thanks. I'll think about it."], ['a', "That's all I'm asking."]] },
      { turns: [], beat: "{b} goes quiet for a while, thinking it over." },
    ],
  },
};
