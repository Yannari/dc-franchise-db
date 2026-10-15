// ══════════════════════════════════════════════════════════════════════
// voices/batch4.js — the most-aired turns that still spoke in nobody's voice
// ══════════════════════════════════════════════════════════════════════
//
// Ranked by air time over ten seasons (the unvoiced work list): the meetings'
// middle turns, the recruits' asks and answers, the returns, the dailies'
// winners, the kitchen, the homesick night, the call-outs with a reason. Every
// turn gets all five families (sharp, dry, loud, soft, odd), so any speaker
// finds a voice. A turn that ANSWERS keeps answering the same thing, and a turn
// that is answered keeps saying what the answer needs.
export default {
  'bp.4': {
    1: {
      sharp: ["{b} was the group's call. I just happened to be the one saying it.", "Don't put {b} on me. That name came from the group. I'm just the mouth."],
      dry: ["For the record, {b} was a group decision. I was just the first to say it.", "My alliance picked {b}. I read the name out. That's the whole story."],
      loud: ["That wasn't my call! The group said {b}, so I said {b}!", "Look, I'm with my people. My people said {b}. Done."],
      soft: ["I feel bad saying {b}. But it was the group's name, not mine.", "I didn't want it to be {b}. The group did, and I owe them."],
      odd: ["I'm basically a messenger. Don't shoot the messenger. It was the alliance.", "I just said what the group told me to say, like a very sweaty parrot."],
      schemer: ["Let the house think it was me. It was the group, and the group owes me for taking the heat."],
    },
  },
  'mt.u3': {
    1: {
      sharp: ["Done. Do we let anybody else in on it, or keep it tight?", "Good. And outside this room? Do they get to know?"],
      dry: ["Fine by me. Are we telling anybody else, or not?", "Sure. Question, though. Does anyone outside the group hear about this?"],
      loud: ["I'm in! Do we tell people, or what?", "Easy. Yes. Do the others get a heads-up?"],
      soft: ["Okay. I'm with you. Should we warn anybody, though?", "Yeah, okay. Do we tell anybody else? I don't know how this part works."],
      odd: ["In. Very in. Do we tell the others, or is this a secret-secret?", "I'm in. Is this an everybody-knows thing or a pinky-promise thing?"],
    },
    2: {
      sharp: ["No. They find out at the vote.", "Nobody. If they don't know, they can't fight it."],
      dry: ["No. They'll hear it at the vote, same as everybody.", "No point. The vote will tell them."],
      loud: ["No way! They find out at the vote!", "Nope. Let it hit them at the vote."],
      soft: ["I'd rather not. It's easier on everybody if it just happens at the vote.", "No. If we tell people, somebody gets hurt early."],
      odd: ["No. It's a surprise party, except the party is a vote.", "Nope. Big reveal. Like a magic trick, but meaner."],
    },
    3: {
      sharp: ["{alliance} has the numbers, and I'm in it. Everybody else can sweat.", "Being in {alliance} this week means I'm not the one sweating. I like that."],
      dry: ["{alliance} has the votes, and I'm in {alliance}. That's all that matters this week.", "It's nice to be in the group that decides things, for a change."],
      loud: ["{alliance} runs this place! And I'm IN it! Let's go!", "We've got the numbers, and I'm on the right side of them. Feels great."],
      soft: ["I've been on the outside before. Being in {alliance} feels safe, and I didn't know how much I needed that.", "For once I'm not the one worrying. {alliance} has my back."],
      odd: ["{alliance} is the cool table, and I'm sitting at it. Middle school me is crying.", "I'm in the popular group! I have never once been in the popular group!"],
    },
  },
  'mt.u4': {
    0: {
      sharp: ["{target} puts on a show in the dailies. The Arena is one on one, and {target} folds one on one.", "Everybody's afraid of {target}. I'm not. Put {target} in and {target} goes home."],
      dry: ["{target}'s daily record looks good, but the Arena's different. I think {target} loses in there.", "{target} looks good in the dailies, but the Arena is different. I think {target} goes home."],
      loud: ["Forget the dailies! {target} in the Arena? {target} loses. I'd bet on it.", "{target} talks big, but put {target} in that Arena and {target} is done."],
      soft: ["I know {target} looks strong, but I really don't think {target} wins in the Arena.", "I've watched {target} under pressure. If we put {target} in, I think {target} loses."],
      odd: ["{target} is great at dailies. The Arena is a different game, and I don't think {target} can do it.", "Hear me out: {target} in the Arena? {target} has no chance."],
    },
    1: {
      sharp: ["And when {target} wins? Then what?", "Sure. And if you're wrong?"],
      dry: ["And if {target} wins anyway?", "What's the plan if {target} wins?"],
      loud: ["And if {target} WINS? Then we're dead!", "What if {target} comes back swinging?"],
      soft: ["But what if {target} wins? Then {target} knows we did it.", "And if {target} comes back? I don't want to be on that list."],
      odd: ["And if {target} wins? Asking for me. I'm the friend.", "Okay, but plot twist: {target} wins. Then what?"],
    },
    2: {
      sharp: ["Then we handle it. I don't make bets I lose.", "Then we figure it out. But I really like our odds."],
      dry: ["Then we deal with it. I'd still take those odds.", "Then we've got a problem. I don't think we will."],
      loud: ["Then we deal with it! But {target} won't win!", "Then we fight. But I'm telling you, I like this."],
      soft: ["Then we deal with it together. But I really think it works.", "Then we figure it out. I trust this one, though."],
      odd: ["Then we panic, as a team. But I like our chances.", "Then we hide. Kidding. Mostly. I like the odds."],
    },
  },
  'rc.a2': {
    0: {
      sharp: ["You're safe right now. I can keep it that way, if you let me.", "Nobody's said your name yet. I'd like to make sure nobody does."],
      dry: ["Here's where you stand. Nobody's targeting you, and I can keep it like that.", "Your name hasn't come up. I'd like to keep it out of the conversation."],
      loud: ["Straight up? Nobody's after you. And I can make sure it stays that way.", "You're good right now. I can keep you good."],
      soft: ["I'll be honest, I'd hate to see your name come up. Right now it hasn't, and I want to keep it that way.", "You're safe right now, and I'd really like to help keep it like that."],
      odd: ["Good news: nobody's after you. I can keep it that way.", "Honestly? You're invisible right now. Great invisible. I'd like to keep you invisible."],
    },
    1: {
      sharp: ["And what's that going to cost me?", "Nothing's free in here. What's the price?"],
      dry: ["And what do I owe you for it?", "And the catch is?"],
      loud: ["Okay. What's the catch?", "What do you want? Just say it."],
      soft: ["That's nice. What do you need from me, though?", "Okay. What would you want back?"],
      odd: ["What's the price? I have three granola bars and a good attitude.", "And what do I have to give you? Please say not my snacks."],
    },
    2: {
      sharp: ["One vote. {target}.", "{target}. Your vote. That's all."],
      dry: ["Your vote. On {target}.", "Just say {target} at the vote."],
      loud: ["Vote {target}. That's it!", "{target}. Your vote. Easy."],
      soft: ["Just your vote on {target}. That's all I'm asking.", "Vote {target} with us. That's it, I promise."],
      odd: ["Your vote on {target}. Snacks not required.", "{target}. You say it, I keep you safe."],
    },
  },
  'rc.a3': {
    2: {
      sharp: ["{b} said yes before I finished asking. Either {b} hates {target}, or {b} says yes to everybody. I'll find out which.", "That yes came way too fast. {b} is either with me on {target}, or {b} is with everybody."],
      dry: ["That was a very quick yes from {b}. Quick yeses make me nervous.", "{b} agreed instantly. Either {b} really wants {target} out, or {b} gives that answer to everyone."],
      loud: ["{b} said yes in like two seconds! That's either great or really bad!", "Too easy. {b} either hates {target} or {b} is lying to my face."],
      soft: ["I want to believe {b}. But that yes came really fast, and I've been burned before.", "{b} said yes so fast. I hope it's because of {target}, and not because {b} says yes to everybody."],
      odd: ["{b} said yes faster than I say yes to pizza. Nobody's that fast.", "I asked, {b} said yes, I blinked. Either {b} really doesn't like {target}, or something is up."],
    },
  },
  'rc.a4': {
    2: {
      sharp: ["Good. I won't forget it.", "Smart choice. Thank you."],
      dry: ["Thanks. Really.", "Okay. Thank you."],
      loud: ["Yes! Thank you! You won't regret it!", "That's what I needed! Thank you!"],
      soft: ["Thank you so much. Seriously.", "Thank you. That means a lot to me."],
      odd: ["Thank you! I'd hug you, but this is a business meeting.", "You're a hero. A small, voting hero."],
    },
    3: {
      sharp: ["Floating is great until somebody corners you. {a} cornered me, so I picked.", "I liked staying in the middle. {a} made me pick."],
      dry: ["You can float until somebody asks you straight out. {a} asked.", "I couldn't stay in the middle forever. {a} made sure of that."],
      loud: ["I was happy floating! Then {a} goes and makes me pick a side!", "{a} put me on the spot, so now I've picked. Done floating, I guess."],
      soft: ["I hate picking sides. {a} asked me so directly I couldn't say no.", "I didn't want to choose. But {a} looked right at me, and I chose."],
      odd: ["I was happy staying out of it. Then {a} made me choose.", "Floating was nice. Then {a} made me pick a side."],
    },
  },
  'rc.a6': {
    1: {
      sharp: ["Fine. And you owe me. Remember that.", "Deal. You owe me one, and I will collect."],
      dry: ["Deal. That's one favour you owe me.", "Okay. Put it on my tab. You owe me."],
      loud: ["Deal! But you owe me big!", "Okay, I'm in! You owe me one!"],
      soft: ["Okay, deal. Just remember me when I need it.", "Deal. And maybe you'll be there for me next time?"],
      odd: ["Deal! I'm writing it on my hand. You owe me one.", "Fine. That's one favour. I accept favours and cookies."],
    },
    2: {
      sharp: ["The big group owes me now. I'll pick the moment I collect.", "One vote now buys me a lot of safety later. Good trade."],
      dry: ["A favour from the biggest group in the house is worth a lot. I'll use it later.", "I gave a vote. I got a favour. I'll cash it in when I need it."],
      loud: ["They owe me now! And I'm collecting the second I need it!", "The biggest group in the house owes me one. I'll take that."],
      soft: ["I helped them. Hopefully they help me when it's my turn.", "Maybe being kind now means they'll remember me later."],
      odd: ["The whole group owes me one now. I'm going to remind them. A lot.", "Somebody owes me a favour! I feel like a mob boss. A nice one."],
    },
  },
  'rc.a5': {
    2: {
      sharp: ["{b} is on board this week. Next week, we'll see.", "{b} said yes. In here, a yes lasts about a week."],
      dry: ["{b} is with us this week. That's as far as any promise goes in here.", "{b} said yes, for now. I'll take for now."],
      loud: ["{b} is in! For this week, anyway. That's all I need!", "Got {b}! Just for now, but I'll take it!"],
      soft: ["{b} said yes. I hope it lasts longer than a week, but I'm not counting on it.", "{b} agreed. Nobody promises anything past this week in here."],
      odd: ["{b} is on board! For this week, anyway.", "{b} said yes, and I'm choosing to enjoy it before it expires."],
    },
  },
  'ma.a2': {
    0: {
      sharp: ["Waking up without {gone} here is strange. I keep looking at {gone}'s bed.", "For a second this morning I forgot {gone} was gone. Then I saw the empty bed."],
      dry: ["I woke up, looked over, and {gone}'s bed was empty. It took me a second.", "It's quiet without {gone}. I didn't expect that to hit me this hard."],
      loud: ["I woke up and said {gone}'s name like an idiot. {gone} wasn't there.", "This morning sucked. {gone} is gone, and I hate it."],
      soft: ["I woke up and went to say good morning to {gone} before I remembered. I just lay there for a while.", "I don't want to get out of bed. {gone} isn't here anymore, and the house feels wrong."],
      odd: ["I made two coffees this morning. Habit. {gone} isn't here to drink one.", "I woke up and started telling {gone} about my dream. Nobody was there. That was sad."],
    },
  },
  'dy.s2': {
    1: {
      sharp: ["Thanks, TJ. I needed that one.", "Thank you. That one was mine."],
      dry: ["Thanks, TJ. Appreciate it.", "Thank you. That was a long one."],
      loud: ["THANK you, TJ! Let's go!", "Yes! Thank you! Woo!"],
      soft: ["Thank you, TJ. You have no idea how much I needed that.", "Oh my gosh. Thank you. Thank you so much."],
      odd: ["Thank you, TJ! I'd like to thank my arms, my legs, and my mom.", "Thank you! Is there a speech? I prepared a speech."],
    },
    2: {
      sharp: ["That was brutal. Next time I'm not holding anything back.", "I ran out of gas. That won't happen again."],
      dry: ["That was rough. I was done about halfway through.", "Brutal. I checked out early."],
      loud: ["That was BRUTAL! I'm dead!", "I can't feel anything! That was insane!"],
      soft: ["That was so hard. I had nothing left by the end.", "That was so hard. I really tried, though."],
      odd: ["I have nothing left. Not a thing.", "I gave up halfway through. Part of me did, anyway."],
    },
  },
  'ep.1': {
    2: {
      dry: ["I don't know. I'm scared, honestly.", "Not sure. I'm terrified."],
      soft: ["I don't know. I'm so scared.", "I'm scared. I really am."],
      odd: ["I don't know. My knees have been shaking since lunch.", "I don't know. I'm scared. Like, cartoon scared."],
    },
    4: {
      dry: ["{a} stayed with me until I calmed down. I owe {a} a good fight.", "I wasn't okay tonight. {a} stayed until I was. I'm going in for both of us."],
      loud: ["{a} talked me down tonight. Now I'm going in there for both of us!", "{a} stayed up with me. I'm not letting {a} down tomorrow."],
      soft: ["{a} didn't leave me alone tonight. I'm doing this for both of us.", "I couldn't breathe, and {a} just stayed. I'm going in there for {a} too."],
      odd: ["{a} sat with me all night. I'm doing this for both of us.", "{a} stayed up with me until I stopped hyperventilating. That's friendship. Tomorrow's for both of us."],
    },
  },
  'rt.f2': {
    0: {
      sharp: ["Wow. Not one welcome back. Noted.", "So nobody's happy to see me. Good to know."],
      dry: ["Tough crowd. No welcome back?", "So... no welcome back, then."],
      loud: ["HELLO? I'm back! Somebody say something!", "Nobody's going to say welcome back? Really?"],
      soft: ["I'm back. Is anybody... glad?", "Hey. I'm back. Anyone?"],
      odd: ["I'm back! Hold your applause. Seriously, you're holding it a lot.", "Ta-da! That was the part where you clap."],
    },
    2: {
      sharp: ["Don't, {b}. You said my name. You don't get to smile at me now.", "Cute, {b}. You voted me in. Save the welcome."],
      dry: ["You voted me in, {b}. Skip the welcome.", "Thanks, {b}. You were also the one trying to send me home."],
      loud: ["Don't even, {b}! You tried to send me home!", "Welcome back? You put me in there, {b}!"],
      soft: ["That's hard to hear from you, {b}. You tried to send me home.", "I wish I could believe you, {b}. But you voted me in."],
      odd: ["That's sweet, {b}. Also, you tried to send me home. Two things can be true.", "Welcome back, says the person who voted me in. Love that, {b}."],
    },
    3: {
      sharp: ["I voted {a} in and {a} won. Now {a} sleeps ten feet from me with a grudge. I need a new plan.", "Worst case. {a} is back, {a} knows, and I'm the obvious target now."],
      dry: ["Voting somebody in only works if they lose. {a} didn't. Now I have a problem across the room.", "{a} came back. I voted for {a}. Those two facts don't go well together."],
      loud: ["{a} came back! I voted for {a}! This is the worst thing that could've happened!", "{a} is back and {a} is coming for me. Great. Love it."],
      soft: ["I keep looking over at {a}. {a} wants revenge, and honestly I don't blame {a}.", "I voted {a} in and {a} came back. I'm not going to sleep tonight."],
      odd: ["I voted {a} into a fight and {a} won it. I'm sleeping with one eye open.", "{a} came back. I'm officially scared."],
    },
  },
  'rt.f1': {
    3: {
      sharp: ["Save it, {b}. I heard you say my name.", "Don't, {b}. I heard you."],
      dry: ["Save it, {b}. I know how you voted.", "Thanks, {b}. I also know you voted for me."],
      loud: ["Oh, stop it, {b}! You voted for me!", "Save it! I know you voted me in, {b}!"],
      soft: ["Please don't, {b}. I know you voted for me.", "You don't have to pretend, {b}. I know it was you."],
      odd: ["Save it, {b}. I have a list, and you're on the list.", "Aw, {b}. You voted for me. I remember. I remember everything."],
    },
  },
  'dy.p2': {
    1: {
      sharp: ["Give {b} the credit for the end. I was spent.", "Credit to {b}. I had nothing left at the end."],
      dry: ["To be fair, {b} did the last part. I was out of gas.", "{b} carried the finish. I was done."],
      loud: ["{b} carried me at the end! I was DEAD!", "That was all {b} at the end! I had nothing!"],
      soft: ["Honestly, {b} saved us. I had nothing left.", "{b} got us over the line. I'm so grateful."],
      odd: ["{b} carried that last part like I was groceries.", "I stopped being a person around the end. {b} did the rest."],
    },
    2: {
      sharp: ["Please. You were great, and you know it.", "Don't do that. You were amazing."],
      dry: ["Stop. You were great.", "That's not true. You were really good."],
      loud: ["Shut UP, you were awesome!", "Are you kidding? You crushed it!"],
      soft: ["No way. You were amazing. I mean it.", "Stop it, you were incredible."],
      odd: ["Shut up. You were a machine. A beautiful, sweaty machine.", "You were amazing. I'm putting it in my diary."],
    },
  },
  'kb.1': {
    1: {
      dry: ["Me. I was hungry.", "That was me. Hungry."],
      loud: ["Me! I was starving!", "I did! I was hungry!"],
      soft: ["Oh. That was me. Sorry, I was so hungry.", "I did. I'm sorry, I was starving."],
      odd: ["Me. I have a fast metabolism and no regrets.", "I did. The eggs called to me."],
    },
    3: {
      sharp: ["They're eggs, {a}. Get over it.", "Relax, {a}. It's eggs."],
      dry: ["{a}. It's eggs.", "It was eggs, {a}. We'll survive."],
      loud: ["They're EGGS, {a}! Calm down!", "Chill! It's just eggs!"],
      soft: ["I'm sorry, okay? It's just eggs, {a}.", "{a}, please. It's only eggs."],
      odd: ["They're eggs, {a}. The chickens will make more.", "It's eggs, {a}. Nobody died. Except, technically, the eggs."],
    },
  },
  'sp.2': {
    0: {
      sharp: ["You're very distracting. I'm trying to play a game here.", "Do you know how distracting you are? Because I think you do."],
      dry: ["You're a little distracting, you know.", "You're distracting. I keep losing my train of thought."],
      loud: ["You're SO distracting! It's a problem!", "Can you stop being so distracting? I'm trying to focus!"],
      soft: ["You're kind of distracting. In a good way.", "You're distracting, you know. I can't focus when you're around."],
    },
    1: {
      sharp: ["Good. It was meant as one.", "I know. It's on purpose."],
      dry: ["Noted. Compliment accepted.", "I'm going to assume that's a compliment."],
      loud: ["I'll take it!", "Ha! That's a compliment, right?"],
      odd: ["Thank you. I've been practicing.", "Is that a compliment? I'm framing it."],
    },
    2: {
      dry: ["{a} called me distracting. I've thought about it eleven times since.", "I keep replaying {a} saying I was distracting."],
      loud: ["{a} said I'm distracting! What does that even MEAN?!", "{a} thinks I'm distracting! I'm not going to sleep tonight!"],
      soft: ["{a} said I was distracting, and I haven't stopped smiling.", "I can't stop thinking about what {a} said."],
      odd: ["{a} said I was distracting. I'm going to be weird about this for days.", "Distracting! Me! I'm adding it to my résumé."],
    },
  },
  'rt.c2': {
    0: {
      sharp: ["{gone} thought I was the easy pick. {gone} was wrong, and now everybody knows it.", "Pick me again. See what happens. Ask {gone}."],
      dry: ["{gone} picked me. That was a mistake, and now the whole villa knows it.", "{gone} chose wrong. Simple as that."],
      loud: ["{gone} picked the WRONG person! Let that be a lesson!", "Anybody else want to call me out? Ask {gone} how it went!"],
      soft: ["I feel for {gone}. But {gone} picked me thinking I'd lose, and I didn't.", "I'm not happy {gone} is gone. But {gone} shouldn't have picked me."],
    },
  },
  'ag.1': {
    2: {
      sharp: ["Seriously. And we don't give second chances.", "Yes. And don't make me look bad for vouching for you."],
      dry: ["Yes, seriously. Just don't make it a mistake.", "Really. Try not to make us regret it."],
      loud: ["Yes! Just don't screw us over!", "Seriously! You're in! Don't blow it!"],
      soft: ["Seriously. We trust you. Please don't make us regret that.", "Yes. We really want you. Just be good to us."],
      odd: ["Seriously! There's a handshake. I'll teach you later. Don't make us regret it.", "Yes. Welcome. There are rules. Rule one: don't make us regret it."],
    },
  },
  'ag.2': {
    2: {
      sharp: ["Just like that. Don't waste it.", "When I say you're in, you're in."],
      dry: ["Yep. That's it.", "That's all it takes."],
      loud: ["Just like that! Welcome in!", "Yep! You're in!"],
      soft: ["Just like that. We're glad you're here.", "Yes. You've earned it."],
      odd: ["Just like that. No paperwork.", "Boom. You're in. There's no ceremony. I wanted a ceremony."],
    },
  },
  'hs.c2': {
    0: {
      sharp: ["Ignore me. I'm being stupid.", "Sorry. This is stupid. I don't usually do this."],
      dry: ["Sorry. I'm being so stupid.", "Sorry. This is stupid."],
      loud: ["Ugh, sorry! I'm being so stupid!", "I'm fine! I'm being stupid. Sorry."],
      soft: ["Sorry. I feel so stupid. I don't know why I'm crying.", "I'm sorry. I'm being stupid."],
      odd: ["Sorry. My face is leaking. I feel stupid.", "Don't look at me. I feel so stupid."],
    },
    1: {
      dry: ["You're not being stupid. Everybody cries in here eventually.", "It's not stupid. This place gets to everybody."],
      loud: ["Stop! You're not stupid! Everybody cries in this house!", "Hey! Not stupid! I cried yesterday!"],
      soft: ["You're not being stupid at all. Everybody cries in here.", "Hey, don't say that. We all cry in here."],
      odd: ["You're not stupid. I cried over a sandwich on day two.", "Crying is allowed. I cried at a pool noodle once."],
    },
    3: {
      dry: ["{a} is having a hard time. Somebody should look out for {a}. Might as well be me.", "Nobody else noticed {a} was struggling. I did."],
      loud: ["{a} is hurting and nobody in this house even noticed! So I'm on it.", "I'm looking after {a}. Somebody has to."],
      soft: ["{a} is really struggling. I'm going to make sure {a} isn't alone.", "My heart hurts for {a}. I'll look after {a}."],
      odd: ["{a} needs a buddy, and I'm volunteering. I'm a great buddy. Ask my plants.", "I'm {a}'s emotional support person now. Unqualified, but here."],
    },
  },
  'hs.c3': {
    0: {
      sharp: ["Come on. Walk with me. Get out of this house for a bit.", "Up. We're going for a walk."],
      dry: ["Want to take a walk? Get some air?", "Walk? It's quieter out there."],
      loud: ["Come on, let's get out of here for a bit! Walk!", "Let's go for a walk! Fresh air!"],
      soft: ["Do you want to go for a walk? Just us, away from everybody?", "Come walk with me? Just for a bit."],
      odd: ["Walk? I know where the good rock is. Best rock on the beach.", "Let's go for a walk. I'll show you where I hide my snacks."],
    },
  },
  'pb.3': {
    0: {
      sharp: ["Go on. Say it to my face.", "Just say it."],
      dry: ["Go ahead. I know what you're going to say.", "Say it. Get it over with."],
      loud: ["Go on! Say it!", "Just SAY it already!"],
      soft: ["Go ahead. I know. Just say it.", "You can say it. I already know."],
      odd: ["Go ahead. Say it. I've prepared a face.", "Let me guess. Go on. Hit me."],
    },
  },
  'rt.c1': {
    2: {
      dry: ["{gone} called me out and went home. That's the best way to win one of these.", "Called out, and the caller goes home. Hard to beat that."],
      loud: ["Called out and sent the caller home! There's no better feeling!", "{gone} called me out and {gone} is gone! Best feeling ever!"],
      soft: ["I won't lie, sending {gone} home after {gone} picked me feels good. I feel a little bad saying that.", "I'm proud of myself. {gone} picked me, and I proved {gone} wrong."],
      odd: ["Getting called out and winning is the best. {gone} picked me and lost.", "{gone} picked me and lost. That's karma."],
    },
  },
  'ep.3': {
    0: {
      sharp: ["The night before the Arena drags. {a} is making it shorter. I owe {a} one.", "Nobody sleeps before the Arena. At least I have {a}."],
      dry: ["The night before the Arena is long. {a} made it a bit shorter.", "Having {a} here tonight helps more than I expected."],
      soft: ["I didn't want to be alone tonight, and {a} didn't let me be.", "This is the longest night of my life. {a} is making it okay."],
      odd: ["The night before the Arena feels like it will never end. {a} is making it better.", "{a} is keeping me company tonight. I'm counting ceiling tiles, and {a} is counting them with me."],
    },
  },
  'rq.o3': {
    0: {
      sharp: ["Why me? I want a real answer.", "Explain it. Why me?"],
      dry: ["I'd just like to know why. Why me?", "Help me understand. Why me?"],
      loud: ["Why ME? Just tell me why!", "I want to know why! Why me?"],
      soft: ["I just need to know why. Why was it me?", "Why me? I thought we were okay."],
      odd: ["Why me? Was it the snoring? I've been told it's the snoring.", "I have one question, and it's why. Why me?"],
    },
    1: {
      sharp: ["You're a threat. Be flattered.", "Because you're dangerous. That's a compliment, by the way."],
      dry: ["You're a threat. That's really all it was.", "Because you'd beat me later. Take it as a compliment."],
      loud: ["Because you're a threat! That's a compliment!", "You're dangerous! That's why!"],
      odd: ["You're a threat. Honestly, that's a compliment.", "You're scary. In a good way."],
    },
  },
  'mt.p1': {
    0: {
      sharp: ["So it's {target}. Everybody good?", "{target}. Any objections? Good."],
      dry: ["So, {target}. Everybody okay with that?", "We're agreed on {target}?"],
      loud: ["So it's {target}! Everybody in?", "{target}, right? We good?"],
      soft: ["So is everybody okay with {target}?", "Are we all comfortable with {target}?"],
      odd: ["So... {target}? Raise your hand if yes. Not literally. Somebody might see.", "{target}. All in favour, say nothing suspicious."],
    },
    2: {
      sharp: ["Then what's your plan? Go on.", "Okay. Got a better idea?"],
      dry: ["So what would you do instead?", "What's the alternative?"],
      loud: ["Then what do you want to do?!", "Okay, so what's your idea?"],
      soft: ["What would you rather do? I'm listening.", "Okay. What feels right to you?"],
      odd: ["Okay, pitch me. I'm very open-minded, for the next minute.", "Okay, so what would you do? Lay it on me."],
    },
    3: {
      sharp: ["I don't know. I think we're avoiding the real threat because we're scared of it.", "There's a bigger name, and everybody's too scared to say it."],
      dry: ["I'm not sure. I just think we're avoiding the obvious bigger target.", "I don't have a name. I just think we're going small because we're scared."],
      loud: ["I don't know! There's a bigger target and we're all chickening out!", "We're scared! There's a bigger name and nobody wants to say it!"],
      soft: ["I don't know. It just feels like we're scared to go after the bigger target.", "I don't have an answer. I just think there's somebody bigger, and we're afraid."],
      odd: ["I don't know. There's a much bigger threat, and we're voting out somebody small.", "There's a bigger target, and we're going after an easy one because the big one fights back."],
    },
    4: {
      sharp: ["I'll go along this week. If {a} keeps calling every shot, I'll start calling my own.", "This week I vote with the group. After that, {a} doesn't get to decide everything."],
      dry: ["I'll vote with the group this week. But {a} can't keep making every call.", "Fine, this week. If {a} keeps running everything, I'll start running my own game."],
      loud: ["I'll do it this week. But {a} isn't my boss!", "One more week of {a} calling the shots. Then I'm doing my own thing."],
      soft: ["I'll vote with them this week, because I care about them. But {a} has to start listening.", "I don't want to cause trouble. But if {a} keeps deciding everything, I'll have to."],
      odd: ["I'll vote with them. But {a} is not the boss of this group. Nobody made {a} boss.", "This week, yes. Next week, I'm my own boss. I'll even make a little hat."],
    },
  },
  'mt.p3': {
    0: {
      sharp: ["{target}? That's it? I thought we had more nerve than that.", "{target}? We're playing scared."],
      dry: ["{target}? I thought we were aiming higher this week.", "Really, {target}? I thought we were going bigger."],
      loud: ["{target}?! I thought we were going big this week!", "Come on, {target}? Go bigger!"],
      soft: ["{target}? Oh. I thought we were going after somebody bigger.", "Really? {target}? I thought we agreed to go bigger."],
      odd: ["{target}? That's an easy one. I thought we were going after somebody big.", "{target}? That's way too small for all this planning."],
    },
    1: {
      sharp: ["Bigger is a fight we lose. {target} is one we win.", "Go bigger and we lose. {target} is the smart move."],
      dry: ["Bigger is a fight we might lose. {target} we can win.", "We can beat {target}. Bigger, I'm not sure."],
      loud: ["Bigger gets us killed! {target}, we can beat!", "We go bigger, we lose! {target}, we win!"],
      soft: ["Bigger means a fight we could lose. {target} keeps us safe.", "I just don't want us losing. {target} is a fight we can win."],
      odd: ["Going bigger means a real fight. {target} is an easier one.", "The big ones fight back. {target} we can beat."],
    },
    3: {
      sharp: ["{b} is asking too many questions. I need {b.obj} quiet and on our side.", "{b} is drifting away from us. If {b} goes, the whole group could go."],
      dry: ["{b} is pushing back more and more. If {b} leaves, the whole group goes with {b.obj}.", "{b} is questioning everything. I need to keep {b.obj} with us."],
      loud: ["{b} is questioning everything! I can't lose {b} now!", "If {b} walks, we're done. I need {b.obj} with us."],
      soft: ["I can tell {b} is unhappy. I need to make {b.obj} feel heard, or {b} walks.", "{b} has doubts, and I get it. But I can't lose {b}."],
      odd: ["{b} is asking a lot of questions. That's never a good sign.", "{b} is having doubts. I need to fix that before the vote."],
    },
  },
  'py.b5': {
    0: {
      sharp: ["My group is solid. But one bad week and I'm out. I know how this works.", "I'm in a good group. I also know groups turn on people fast."],
      dry: ["I like my group. I just always feel one bad week away from the outside.", "I'm in a group. I also know how quickly that can change."],
      soft: ["I love my group. I'm just always scared I'm one mistake away from losing them.", "I feel safe with them. Mostly. There's always that little worry."],
      odd: ["My group is great. I'm just always one bad day from eating lunch alone.", "I'm in a group! For now. I keep checking that I'm still in it."],
    },
  },
  'af.1': {
    4: {
      sharp: ["{alliance}. And if that name leaves this room, I'll know who said it.", "{alliance}. Nobody outside this room. Ever."],
      dry: ["{alliance}. And that stays in this room.", "We're {alliance}. Nobody else hears it."],
      loud: ["{alliance}! But nobody else hears it!", "{alliance}. Keep it in this room!"],
      soft: ["How about {alliance}? Just for us. Nobody else.", "{alliance}. That's ours. Nobody else gets it."],
      odd: ["{alliance}. It's a secret. Like a secret handshake, but a name.", "{alliance}! Whisper it. Actually, don't say it at all."],
    },
  },
  'rq.o1': {
    2: {
      sharp: ["At least you own it.", "Honest. I'll give you that."],
      dry: ["Well. At least you're honest.", "Okay. Honest, at least."],
      loud: ["Wow. At least you said it!", "Okay! At least you're not lying!"],
      soft: ["At least you're honest with me. That's something.", "Okay. Thank you for being honest."],
      odd: ["At least you're honest. Brutally honest.", "Honesty! That's rare in here."],
    },
  },
  'af.2': {
    2: {
      sharp: ["Then it's official. Us, and we pick who else gets in.", "Good. Just us. We decide who joins."],
      dry: ["Then let's make it official. Us, and we'll see who else.", "Okay. Just us. We'll add people carefully."],
      soft: ["Then let's do it. Us, and maybe somebody else we trust.", "Okay. It's us. We'll find the right people."],
      odd: ["Then it's official! Us, and we'll see who else we let in.", "It's us. We'll find more people later."],
    },
  },
  'fg.3': {
    0: {
      sharp: ["Don't you dare walk away from me!", "We're not done. Don't walk away!"],
      dry: ["Don't walk away. We're not finished.", "Walking away? Really?"],
      loud: ["HEY! Don't walk away from me!", "Get back here! Don't walk away!"],
      soft: ["Please don't walk away. Just talk to me!", "Don't walk away from me! I'm trying here!"],
      odd: ["Don't walk away! That's my move! I walk away!", "Hey! Come back! I wasn't finished yelling!"],
    },
  },
  'co.s3': {
    0: {
      sharp: ["I'm calling out {b}. I pick the fight I can win, and that's {b}.", "{b}. I like my odds against {b}, and that's all this is."],
      dry: ["I'm calling out {b}. It's the fight I think I win.", "{b}. I like my chances against {b}."],
      loud: ["{b}! I'm calling out {b}, and I'm not going home!", "I'm calling out {b}! I'm staying!"],
      soft: ["I'm calling out {b}. I'm sorry. I want to stay, and this is how I stay.", "{b}. I'm sorry. I just want to be here next week."],
      odd: ["{b}! I've thought about it for at least four minutes. I'm calling out {b}.", "I'm calling out {b}, and I'm going to win, and I'm going to be humble about it."],
    },
  },
  'mt.p2': {
    1: {
      sharp: ["Is that the group's plan, or yours?", "Whose plan is that, exactly?"],
      dry: ["Is that the plan, or your plan?", "Did we decide that, or did you?"],
      loud: ["Wait, is that THE plan or YOUR plan?", "Who decided that? You?"],
      soft: ["Is that what we all want, or what you want?", "Did everybody agree to that, or just you?"],
      odd: ["Is that the plan, or the plan you made in the shower?", "Is that a group plan or a you plan? Asking for the group."],
    },
    2: {
      sharp: ["It's the plan that keeps us safe. You're welcome.", "It's the one that keeps you safe. So yes, it's the plan."],
      dry: ["It's the plan that keeps everybody here safe.", "It's the one that protects all of us."],
      loud: ["It's the plan that keeps us alive!", "It's the plan that keeps all of us here!"],
      soft: ["It's the plan that keeps all of us safe. I promise.", "I'm just trying to protect all of us."],
      odd: ["It's the plan where none of us go home. That's my favourite kind of plan.", "It's the plan that keeps us safe. Safe plans are the best plans."],
    },
  },
  'rq.o2': {
    0: {
      sharp: ["You said my name. Out loud. In front of the whole house.", "In front of everybody, you said my name."],
      dry: ["You said my name in front of the whole house.", "That was my name you said out loud."],
      loud: ["You said my NAME! In front of EVERYBODY!", "Out loud! In front of everybody! My name!"],
      soft: ["You said my name in front of everybody. That really hurt.", "In front of all of them. You said my name."],
      odd: ["You said my name out loud, in front of everybody, like it was nothing.", "My name. Out loud. With an audience. Rude."],
    },
    1: {
      dry: ["It's a game, {a}. I played it.", "It's the game, {a}."],
      loud: ["It's a GAME, {a}! I'm playing it!", "It's a game! That's what we do here!"],
      soft: ["I'm sorry, {a}. It's a game. I had to play it.", "It's not personal, {a}. It's the game."],
      odd: ["It's a game, {a}. I'm just playing it.", "It's a game! I'm a game player! That's what I'm doing!"],
    },
    2: {
      sharp: ["Then you'll understand when I play it back.", "Good. Then you won't cry when I do it to you."],
      dry: ["Then you won't mind when I do the same.", "Fine. Then I'm playing it too."],
      soft: ["Okay. Then don't be hurt when I play it back.", "Then I guess I'm playing too now."],
      odd: ["Great. Then you won't mind when it's my turn to say your name.", "Cool. I also like games. Watch this."],
    },
  },
  'ep.2': {
    0: {
      sharp: ["Sleep. You need to be sharp tomorrow.", "Go to bed. Tomorrow you need everything."],
      dry: ["You should sleep. Tomorrow's a big day.", "Try to get some sleep."],
      loud: ["Go to sleep! You need your energy!", "Bed! Now! Tomorrow you go to war!"],
      odd: ["Sleep. I'm told it's good for you. I've never tried it.", "Go to sleep. Count sheep. Or opponents. Count opponents."],
    },
  },
  'hs.c1': {
    3: {
      sharp: ["They'd want you to stay and win. You know that.", "They didn't send you here to quit."],
      dry: ["They'd tell you to stay. You know they would.", "Your family would tell you to keep going."],
      loud: ["They'd want you to keep fighting! You know that!", "They'd be yelling at the TV for you to stay!"],
      soft: ["They'd want you to keep going. They're so proud of you.", "They'd want you to stay. I know they would."],
    },
  },
  'dy.p1': {
    2: {
      sharp: ["Told you. We're good together.", "Like I said. We work."],
      dry: ["I did say we'd work well together.", "Told you we'd be good."],
      loud: ["I TOLD you we'd be good!", "See?! We're unstoppable!"],
      soft: ["I knew we'd be good together.", "I told you! We're so good together."],
      odd: ["I told you! We're like peanut butter and jelly, but sweatier.", "Called it. We're a dream team. I dreamed it."],
    },
    3: {
      sharp: ["I didn't know {a} before today. Now I know {a} doesn't quit. That's useful.", "Today I learned {a} is good under pressure. I'll remember that."],
      dry: ["I barely knew {a} this morning. A few hours of screaming at each other fixed that.", "You learn a lot about somebody in a daily. {a} turned out to be pretty great."],
      loud: ["I didn't know {a} at all this morning! Now {a}'s my partner in crime!", "{a} and I were screaming at each other the whole time, and it worked!"],
      soft: ["I didn't know {a} before today. Now I really like {a}.", "Being soaking wet and yelling at each other is a weird way to make a friend. It worked."],
      odd: ["I met {a} properly today. We were both soaking wet and yelling at each other, and now we're friends.", "{a} and I bonded today. Through screaming. It's beautiful, if you don't listen."],
    },
  },
  'co.p2': {
    0: {
      sharp: ["{b}. If I'm going home, it's against the best. Not some easy pick.", "{b}. I want the strongest person in here."],
      dry: ["{b}. If I'm going out, it'll be against the strongest.", "I'm calling out {b}. I'd rather beat the best."],
      loud: ["{b}! Give me the strongest! I'm not picking somebody weak!", "{b}! I want the best! Let's go!"],
      soft: ["{b}. I want to prove myself against the best. No easy way out.", "I'm calling out {b}. If I lose, I want to lose to somebody great."],
      odd: ["{b}. Go big or go home. Hopefully just the first one.", "{b}! I want the final boss!"],
    },
  },
  'co.g5': {
    1: {
      sharp: ["{b}. We can't stand each other. Let's settle it.", "{b}. I'm done pretending we're fine."],
      dry: ["{b}. We don't get along. Let's just settle it in the Arena.", "{b}. We both know why. Might as well settle it."],
      loud: ["{b}! We don't get along, so let's settle it!", "{b}! No more pretending! Let's go!"],
      soft: ["{b}. We've never gotten along, and I'm tired of pretending.", "I'm calling out {b}. I'd rather settle this than keep faking it."],
      odd: ["{b}! We don't get along, so let's not get along in the Arena.", "{b}. We've been fake-smiling for weeks. My face hurts."],
    },
  },
  'dc.2': {
    0: {
      sharp: ["Nobody expected that from me. Good. Let them wonder what else I can do.", "Everybody underestimated me. Not anymore."],
      dry: ["I don't think anybody saw that coming. Including me.", "That surprised a lot of people. Me included."],
      loud: ["Did you SEE that?! Nobody thought I could do that!", "I did that! ME! Nobody saw it coming!"],
      soft: ["I honestly didn't think I could do that. I'm so proud of myself.", "I surprised myself today. That felt really good."],
    },
  },
  'ov.2': {
    1: {
      sharp: ["We get {a} in before {a} catches on. That's it.", "{a} goes in before {a} knows what hit {a.obj}."],
      dry: ["We need {a} in before {a} works it out.", "The timing matters. {a} goes in before {a} figures it out."],
      loud: ["We get {a} in before {a} figures it out, done!", "Just get {a} in! Fast!"],
      soft: ["I feel bad, but we have to get {a} in before {a} figures it out.", "It has to be {a}, before {a} notices."],
      odd: ["{a} goes in before {a} figures it out. Like a surprise party, but bad.", "Get {a} in quick. {a} has headphones in, {a} can't hear a thing."],
    },
  },
  'dk.2': {
    0: {
      sharp: ["Everybody saw me choke. I can already hear my name in the votes.", "I fell apart in front of the whole house. They smell blood now."],
      dry: ["I fell apart today. Everybody saw it. Now they think I'm weak.", "Bad day, and everybody saw it. People are already talking."],
      loud: ["I choked! In front of everybody! Now they all think I'm weak!", "Everybody saw me fall apart today. I'm so mad at myself."],
      soft: ["I fell apart today, and everybody saw. I can feel them looking at me differently.", "I just want to hide. Everybody saw me crumble."],
    },
  },
  'ov.1': {
    1: {
      sharp: ["...it's {a}. {a} is too dangerous to keep.", "...{a} goes this week. No question."],
      dry: ["...it has to be {a}. {a}'s too much of a threat.", "...{a} is the biggest danger. It's {a}."],
      loud: ["...{a}! It has to be {a} this week!", "...no, it's {a}. {a} is way too dangerous."],
      soft: ["...I don't like it, but it has to be {a}.", "...{a} is too dangerous. I hate it, but it's {a}."],
      odd: ["...{a}. {a} is way too dangerous.", "...it's {a}. {a} is too scary to keep around."],
    },
  },
  'af.3': {
    2: {
      sharp: ["Done.", "Deal. And nobody breaks it."],
      dry: ["Agreed.", "Fine by me."],
      soft: ["Deal. I'm so glad.", "Yes. Deal."],
      odd: ["Deal! Pinky swear!", "Deal. I'd spit-shake, but gross."],
    },
  },
  'co.g3': {
    0: {
      sharp: ["{b}. You love talking about me when I'm not around. Talk to me now.", "I'm calling out {b}. Say it to my face in there."],
      dry: ["{b}. You talk about me a lot when I'm not in the room. Let's settle it.", "I'm calling out {b}. I've heard what {b} says behind my back."],
      loud: ["{b}! I'm sick of you talking about me behind my back!", "{b}! You want to talk about me? Talk in the Arena!"],
      soft: ["{b}. I've heard what you say about me when I'm not there. It hurts.", "I'm calling out {b}. I'm tired of hearing what {b} says about me."],
      odd: ["{b}! You talk about me so much, I figured you'd want a closer look.", "{b}. You're my biggest fan behind my back. Come say hi."],
    },
  },
  'kb.3': {
    1: {
      sharp: ["There are forty cups in this kitchen.", "Pick another one. There are forty."],
      dry: ["There are about forty cups.", "We have forty cups, give or take."],
      loud: ["There are like FORTY cups!", "It's one of FORTY cups!"],
      soft: ["I'm sorry, there are like forty cups, I didn't think.", "Sorry! There are like forty cups, I just grabbed one."],
    },
  },
  'py.c3': {
    0: {
      sharp: ["I want to know every name before anybody says it. That's control.", "No vote happens in this house without me knowing first."],
      dry: ["My goal is to know every vote before it happens.", "If I don't know the name before the vote, I've done something wrong."],
      loud: ["I want to know the name before TJ does. Every week!", "Nobody surprises me at a vote. Nobody!"],
      soft: ["I just never want to be blindsided. I want to know before TJ does.", "Being surprised at a vote is my nightmare. So I'll always know."],
    },
  },
  'dl.2': {
    0: {
      sharp: ["Are you coming after me? Be honest.", "Can I trust you not to come after me? Yes or no."],
      dry: ["Can I trust you not to come for me?", "Are you going to come after me?"],
      loud: ["Straight up, are you coming after me?", "Can I trust you not to come after me or what?"],
      soft: ["Can I trust you not to come after me? I really need to know.", "Please tell me you're not coming after me."],
      odd: ["Are you going to come after me? Blink twice for no.", "Can I trust you not to come after me? Pinky trust?"],
    },
    2: {
      sharp: ["Deal.", "Done. Don't make me regret it."],
      dry: ["Fine. Done.", "Agreed."],
      loud: ["Done! Deal!", "Yes! Done!"],
      soft: ["I promise. Done.", "Done. Thank you."],
    },
  },
  'mt.r3': {
    0: {
      sharp: ["It's {target}. Can we have one week where everybody is on the same page?", "It's {target}. Is it too much to ask for everybody to be on the same page once?"],
      dry: ["It's {target}. Can we get one week where we're all on the same page?", "It's {target}. Just once, can we be on the same page?"],
      loud: ["It's {target}! Can we have ONE week where everybody's on the same PAGE?!", "It's {target}! One week! Same page! Please!"],
      soft: ["It's {target}. Can we please have one week where we're all on the same page?", "It's {target}. I just want one week where we're all on the same page."],
      odd: ["It's {target}. Can we get one week where we're all on the same page? Same book, even?", "It's {target}. One week. Same page. I'll bring the page."],
    },
    2: {
      sharp: ["Unreal.", "You're kidding me."],
      dry: ["Great. Wonderful.", "Of course."],
      loud: ["UNBELIEVABLE!", "Are you serious?!"],
      soft: ["I can't believe this.", "Really? Really?"],
      odd: ["Wow. Incredible. Applause.", "Cool. Cool cool cool."],
    },
    3: {
      sharp: ["If {b} won't vote with us when it counts, {b} isn't one of us.", "{b} is either with us or in the way. Right now {b} is in the way."],
      dry: ["If {b} won't vote with us when it matters, I'm not sure what {b} is doing in this group.", "If {b} won't vote with us, then what are we even doing? {b} needs to decide."],
      loud: ["{b} won't vote with us?! Then why is {b} even here?!", "If {b} can't vote with us, {b} can get out!"],
      soft: ["It hurts that {b} won't vote with us. I'm starting to wonder if {b} was ever really with us.", "I want {b} in this group. But {b} has to show up when it matters."],
      odd: ["If {b} won't vote with us, {b} is only in this group on paper.", "{b} keeps not voting with us. I'm starting to think {b} is a spy. A bad spy."],
    },
  },
  'pb.1': {
    1: {
      dry: ["That was my best.", "I was doing my best. Really."],
      loud: ["I was doing my BEST!", "I gave it my best!"],
      soft: ["I was trying my best! I really was!", "I did my best, I swear!"],
      odd: ["That was my best! My best is just slower than your best!", "That was my best! My best is a light jog!"],
    },
    2: {
      sharp: ["Then your best isn't good enough.", "Your best cost us the daily."],
      dry: ["Your best lost us the daily, though.", "Well, your best cost us."],
      loud: ["Your best LOST us the daily!", "Then your best isn't enough!"],
      odd: ["Then your best needs a better best.", "Your best lost us. Maybe try a different best."],
    },
  },
  'co.g6': {
    0: {
      sharp: ["{b}. I don't like you. I never have.", "I'm calling out {b}. I'm done pretending."],
      dry: ["{b}. I'm not going to pretend I like you.", "I'm calling out {b}. We both know I can't stand {b}."],
      loud: ["{b}! I don't like you! Never have!", "I'm calling out {b}, and I'm not faking a smile about it!"],
      soft: ["{b}. I'm sorry, but I'm not going to pretend we're friends.", "I'm calling out {b}. I can't keep pretending I like you."],
      odd: ["{b}. I don't like you, and I've been very brave about hiding it.", "{b}! I've been pretending to like you for weeks. Pretending is exhausting."],
    },
  },
};
