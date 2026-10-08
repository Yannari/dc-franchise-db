// ══════════════════════════════════════════════════════════════════════
// td/story/lines/life.js — friendships, schemes and idols, as scenes
// ══════════════════════════════════════════════════════════════════════
//
// Long versions of the engine's moments (td/script/lines/friend.js, life.js, plot.js,
// reads.js, adv.js and idol.js headers):
//   friend.bond.any        {a} and {b} get closer.
//   friend.goof.any        something dumb that turns into a friendship.
//   friend.comfort.any     {a} looks after {b}, who is having a bad time.
//   friend.open.any        {a} opens up to {b}.
//   friend.rideordie.any   {a} and {b} would go to the end for each other.
//   friend.drift.any       {a} quietly pulls away from {b}, a close friend.
//   friend.laugh.any       {a} makes the camp laugh ({b} and {c} among them).
//   plot.lie.<believed|rejected>  {a} lies to {b} about {target}.
//   plot.whisper.spread    {a} plants doubts about {target} with {b}.
//   plot.majority.<fooled|refused>  {a} sells {b} a fake vote on {target}.
//   read.played.<deep|plain>  {a} works on {b}, who comes away trusting {a} more; only {a}'s
//                          confessional says it was a play.
//   read.orchestrate.<unseen|setup>  {a} moves a piece through {b} without {b} knowing why.
//   drama.stir.<bold|sly>  {a} sets {b} and {c} against each other.
//   adv.search.any         {a} sneaks off to look for an idol and comes back empty-handed.
//   adv.found.idol         {a} finds a Hidden Immunity Idol, alone with the camera.
//   idol.confide.any       {a}, who holds an idol, tells {b} about it.
// Nobody invents a past: no relatives, no "remember when", only what the scene shows.

export default {
  'long.friend.bond.any': [
    { id: 'lf.b1', place: 'water', turns: [
      { beat: "{a} and {b} are {here}, with nothing to do for once." },
      { by: 'b', say: "Can I ask you something weird?" },
      { by: 'a', say: "Weird is all we've got out here." },
      { by: 'b', say: "Do you actually like it here? Like, apart from the money?" },
      { by: 'a', say: "Honestly? Some days. Today's a good day." },
      { by: 'b', say: "Why's today a good day?" },
      { by: 'a', say: "Nobody's yelled at me yet. And I'm sitting here with you, not doing anything. That's a win." },
      { by: 'b', say: "That's a pretty low bar." },
      { by: 'a', say: "Out here? It's a really high bar." },
      { by: 'b', conf: "I didn't come here to make friends. That's what everyone says. I think I might have made one anyway." },
    ] },
    { id: 'lf.b2', place: 'work', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "Do you want help with that?" },
      { by: 'b', say: "You don't have to." },
      { by: 'a', say: "I know. I want to." },
      { beat: "They work side by side {here} for a while without talking." },
      { by: 'b', say: "This is nice. Not talking, I mean. In a good way." },
      { by: 'a', say: "I know what you mean. Everybody out here talks all the time." },
      { by: 'b', say: "And it's always about who's going home." },
      { by: 'a', say: "Let's not talk about that. Let's just do this." },
      { by: 'a', conf: "{b} is easy to be around. That's rare out here. I'm going to keep {b} close, and not for the game." },
    ] },
    { id: 'lf.b3', place: 'aside', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'b', say: "You're different when it's just us, you know that?" },
      { by: 'a', say: "Different how?" },
      { by: 'b', say: "Less... everything. You stop doing the thing." },
      { by: 'a', say: "What thing?" },
      { by: 'b', say: "The thing where you're always working out what everybody's going to do." },
      { by: 'a', say: "...Huh. Maybe I don't need to work you out." },
      { by: 'b', say: "That's either a compliment or an insult." },
      { by: 'a', say: "It's a compliment. Don't tell anyone." },
      { by: 'a', conf: "I don't do friends out here. Friends are a weakness. {b} is my one weakness. I'm allowed one." },
    ] },
    { id: 'lf.b4', place: 'fire', when: { register: ['fiery', 'competitor'] }, turns: [
      { by: 'a', say: "You're alright, you know that?" },
      { by: 'b', say: "Wow. Is that you being nice?" },
      { by: 'a', say: "Don't push it." },
      { by: 'b', say: "No, I want to enjoy it. It might never happen again." },
      { by: 'a', say: "It definitely won't if you keep talking." },
      { by: 'b', say: "You're alright too." },
      { by: 'a', say: "Yeah, I know." },
      { by: 'b', conf: "{a} yells at everybody. {a} doesn't yell at me. I've decided that means we're friends." },
    ] },
  ],
  'long.friend.goof.any': [
    { id: 'lf.g1', place: 'public', turns: [
      { beat: "{a} has found a stick {here} and decided it's a sword." },
      { by: 'a', say: "En garde!" },
      { by: 'b', say: "What? No. I'm busy." },
      { by: 'a', say: "Pick up a stick and defend yourself!" },
      { by: 'b', say: "I'm not going to—" },
      { beat: "{a} pokes {b} in the arm with the stick." },
      { by: 'b', say: "Okay. OKAY. You asked for this." },
      { beat: "It goes on for ten minutes. Both of them lose." },
      { by: 'b', conf: "We're adults. We had a stick fight. I've never had more fun out here." },
    ] },
    { id: 'lf.g2', place: 'eat', turns: [
      { by: 'a', say: "Bet you can't fit five of these in your mouth." },
      { by: 'b', say: "Bet I can fit six." },
      { by: 'a', say: "Go on, then." },
      { beat: "{b} gets to four, then starts laughing, and it all comes back out." },
      { by: 'a', say: "That's disgusting!" },
      { by: 'b', say: "You made me laugh!" },
      { by: 'a', say: "That counts as a loss!" },
      { by: 'a', conf: "That was the stupidest thing we've done out here. I want to do it again tomorrow." },
    ] },
    { id: 'lf.g3', place: 'sleep', turns: [
      { beat: "Late, in the {quarters}. Somebody's started whispering in a silly voice." },
      { by: 'a', say: "Goodnight, {b}." },
      { by: 'b', say: "Goodnight, {a}." },
      { by: 'a', say: "Goodnight, the bug on the ceiling." },
      { by: 'b', say: "Goodnight, the weird smell." },
      { by: 'a', say: "Goodnight, the other weird smell." },
      { beat: "They both lose it. Somebody across the room throws a pillow." },
      { by: 'b', conf: "Out here you don't get to be a kid very often. Last night, for about ten minutes, we were." },
    ] },
  ],
  'long.friend.comfort.any': [
    { id: 'lf.c1', place: 'aside', turns: [
      { beat: "{b} has gone off {here} on {b.posAdj} own. {a} follows, after a minute." },
      { by: 'a', say: "Hey. Mind if I sit?" },
      { by: 'b', say: "I'm fine." },
      { by: 'a', say: "Okay. I'll sit anyway." },
      { by: 'b', say: "...It's just a lot. All of it. Everyone's always watching you." },
      { by: 'a', say: "Yeah. It's a lot." },
      { by: 'b', say: "You're not going to tell me it gets better?" },
      { by: 'a', say: "I don't know if it does. But I'll sit here till you feel like going back." },
      { by: 'b', conf: "{a} didn't try to fix it. {a} just sat there. That helped more than anything anyone's said out here." },
    ] },
    { id: 'lf.c2', place: 'sleep', when: { register: ['fiery', 'competitor'] }, turns: [
      { by: 'a', say: "Okay. Who did it?" },
      { by: 'b', say: "Who did what?" },
      { by: 'a', say: "Who made you look like that? Tell me and I'll handle it." },
      { by: 'b', say: "Nobody. It's just a bad day." },
      { by: 'a', say: "Then I'll handle the day." },
      { by: 'b', say: "You can't fight a day." },
      { by: 'a', say: "Watch me." },
      { beat: "{b} laughs, which is the first time all afternoon." },
      { by: 'a', conf: "I'm not good at the soft stuff. I'm good at making somebody laugh when they're about to cry. That's close enough." },
    ] },
  ],
  'long.friend.open.any': [
    { id: 'lf.o1', place: 'water', turns: [
      { by: 'a', say: "Can I tell you something I haven't told anybody here?" },
      { by: 'b', say: "Of course." },
      { by: 'a', say: "I'm not as confident as I act. Like, at all." },
      { by: 'b', say: "Seriously? You walk around like you own the place." },
      { by: 'a', say: "Yeah. That's the act." },
      { by: 'b', say: "Well, it's a good act." },
      { by: 'a', say: "Thanks. Don't tell anyone it's an act." },
      { by: 'b', conf: "{a} just told me the truth about {a.ref}. People don't do that out here unless they trust you. I'm not going to waste it." },
    ] },
  ],
  'long.friend.rideordie.any': [
    { id: 'lf.r1', place: 'secret', turns: [
      { by: 'a', say: "Promise me something." },
      { by: 'b', say: "Depends what it is." },
      { by: 'a', say: "If it ever comes down to you or me, we tell each other first. Before anyone else." },
      { by: 'b', say: "And then what?" },
      { by: 'a', say: "And then we figure it out. Together. Like we've done everything else." },
      { by: 'b', say: "That's a big promise." },
      { by: 'a', say: "You're a big deal to me out here." },
      { by: 'b', say: "...Okay. I promise." },
      { by: 'b', conf: "Everybody out here has a deal with somebody. {a} and me don't have a deal. We have each other. That's stronger." },
    ] },
    { id: 'lf.r2', place: 'aside', when: { merged: true }, turns: [
      { by: 'b', say: "So it's everybody for themselves now." },
      { by: 'a', say: "Not for us." },
      { by: 'b', say: "You say that now." },
      { by: 'a', say: "I'll say it at the final vote too. I've had your back since we got here. I'm not stopping because the teams are gone." },
      { by: 'b', say: "And if they come after me?" },
      { by: 'a', say: "Then they come after both of us." },
      { by: 'b', conf: "The merge is when people find out who their friends really are. I found out mine a long time ago." },
    ] },
  ],
  'long.friend.drift.any': [
    { id: 'lf.d1', place: 'public', turns: [
      { beat: "{b} saves {a} a seat {here}, like always. {a} sits somewhere else." },
      { by: 'b', say: "{a}? There's a spot here." },
      { by: 'a', say: "I'm good here, thanks." },
      { by: 'b', say: "...Okay." },
      { beat: "{b} looks at the empty spot for a while." },
      { by: 'a', conf: "{b} hasn't done anything wrong. It's just that being close to {b} makes me look like half of a pair. And pairs get split up." },
      { by: 'b', conf: "Something changed. I don't know what. I don't know if I'm allowed to ask." },
    ] },
    { id: 'lf.d2', place: 'aside', when: { register: ['sweet', 'shy', 'plain'] }, turns: [
      { by: 'b', say: "Are you mad at me?" },
      { by: 'a', say: "No! No. Why would I be mad?" },
      { by: 'b', say: "We used to talk all the time. Now you're always busy." },
      { by: 'a', say: "Everybody's busy. It's the game." },
      { by: 'b', say: "Right. The game." },
      { by: 'a', say: "It's not you. I promise." },
      { by: 'b', conf: "\"It's not you.\" That's what people say when it's you." },
    ] },
  ],
  'long.friend.laugh.any': [
    { id: 'lf.l1', place: 'fire', when: { venue: ['hosted-camp', 'film-lot', 'world-tour'] }, turns: [
      { beat: "{a} is doing impressions {here}. It's going very well." },
      { by: 'a', say: "Okay, okay, who's this? \"Campers! Today's challenge will be EXTREMELY dangerous!\"" },
      { by: 'b', say: "Oh my god. That's {host}." },
      { by: 'c', say: "Do it again. Do the hair thing." },
      { by: 'a', say: "I'm not doing the hair thing." },
      { by: 'c', say: "Do the hair thing!" },
      { beat: "{a} does the hair thing. Everyone loses it." },
      { by: 'c', conf: "{a} made the whole camp laugh tonight. Even the people who can't stand each other. That's a weird kind of power." },
    ] },
  ],

  'long.plot.lie.believed': [
    { id: 'lp.l1', place: 'secret', turns: [
      { by: 'a', say: "Can I tell you something? You have to promise not to make a big deal of it." },
      { by: 'b', say: "That's how you know it's going to be a big deal." },
      { by: 'a', say: "{target} has been asking people if they'd vote you out. I heard it myself." },
      { by: 'b', say: "{target}? Are you serious?" },
      { by: 'a', say: "I wasn't going to say anything. But if it was me, I'd want to know." },
      { by: 'b', say: "...Thank you. I owe you." },
      { by: 'a', say: "You don't owe me anything. Just watch your back." },
      { by: 'a', conf: "{target} never said a word about {b}. But {b} believes it now, and {b} thinks I'm the one person looking out for {b.obj}." },
      { by: 'b', conf: "I can't believe {target}. I really thought we were fine." },
    ] },
  ],
  'long.plot.lie.rejected': [
    { id: 'lp.l2', place: 'aside', turns: [
      { by: 'a', say: "I don't want to stir anything up, but {target} has been talking about you." },
      { by: 'b', say: "Has {target}, though?" },
      { by: 'a', say: "I heard it." },
      { by: 'b', say: "Funny. {target} said the same thing about you an hour ago." },
      { by: 'a', say: "...What?" },
      { by: 'b', say: "I'm kidding. But you should see your face." },
      { by: 'b', say: "I've known {target} longer than I've known you. Nice try." },
      { by: 'b', conf: "{a} wants me to turn on {target}. I'm not stupid. When somebody comes to you with gossip, the gossip is about them." },
    ] },
  ],
  'long.plot.whisper.spread': [
    { id: 'lp.w1', place: 'aside', turns: [
      { by: 'a', say: "Have you noticed {target} is always somewhere else when the plans get made?" },
      { by: 'b', say: "I hadn't, actually." },
      { by: 'a', say: "And then somehow always knows the plan. Every time." },
      { by: 'b', say: "That is weird." },
      { by: 'a', say: "I'm not saying anything. I'm just saying it's weird." },
      { by: 'b', say: "No, it is weird. Huh." },
      { by: 'a', conf: "I didn't tell {b} to do anything. I just gave {b} something to think about. People do the rest on their own." },
    ] },
  ],
  'long.plot.majority.fooled': [
    { id: 'lp.m1', place: 'secret', turns: [
      { by: 'a', say: "It's done. {target} tonight. I've got the numbers." },
      { by: 'b', say: "How many?" },
      { by: 'a', say: "Enough. Everybody I've talked to is in. You're the last person I needed." },
      { by: 'b', say: "I don't know. {target} hasn't done anything to me." },
      { by: 'a', say: "Then don't do it for you. Do it so you're on the right side of the vote." },
      { by: 'b', say: "...Okay. If everyone's in, I'm in." },
      { by: 'a', conf: "\"Everybody's in.\" I've got about two people. But once {b} thinks it's a majority, {b} makes it one." },
    ] },
  ],
  'long.plot.majority.refused': [
    { id: 'lp.m2', place: 'aside', turns: [
      { by: 'a', say: "We're voting {target}. Everyone's in. You in?" },
      { by: 'b', say: "Who's everyone?" },
      { by: 'a', say: "Everyone who matters." },
      { by: 'b', say: "Name them." },
      { by: 'a', say: "I'm not going to list names out here." },
      { by: 'b', say: "Then you don't have the numbers." },
      { by: 'b', conf: "If you had the votes, you wouldn't need mine. {a} is selling a majority that doesn't exist yet." },
    ] },
  ],
  'long.read.played.any': [
    { id: 'lp.p1', place: 'aside', turns: [
      { by: 'a', say: "You're one of the only people here I really trust, you know that?" },
      { by: 'b', say: "Really? You never say stuff like that." },
      { by: 'a', say: "I don't say it to people I don't mean it to." },
      { by: 'b', say: "That's... really nice. Thank you." },
      { by: 'a', say: "So if you hear anything, about me, about anyone, come to me first. Okay?" },
      { by: 'b', say: "Of course." },
      { by: 'a', conf: "{b} just agreed to be my ears. All it cost me was a compliment. They're free, and they work every time." },
      { by: 'b', conf: "Finally, someone out here I can actually trust." },
    ] },
    { id: 'lp.p2', place: 'work', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Here, let me do that. You've been working all morning." },
      { by: 'b', say: "Oh! Thanks." },
      { by: 'a', say: "You do so much for this team and nobody ever notices." },
      { by: 'b', say: "I mean, somebody has to." },
      { by: 'a', say: "And I noticed. Just so you know. I see it." },
      { by: 'b', say: "Thank you. Seriously." },
      { by: 'a', conf: "Twenty seconds of carrying a bucket and {b} will vote however I ask. I should do chores more often." },
    ] },
  ],
  'long.read.orchestrate.any': [
    { id: 'lp.o1', place: 'secret', turns: [
      { by: 'a', say: "Do me a favour. Next time you're with the others, say you think things have been way too quiet lately. That's all." },
      { by: 'b', say: "Why?" },
      { by: 'a', say: "Just say it. Trust me." },
      { by: 'b', say: "That's it? Just that it's too quiet?" },
      { by: 'a', say: "That's it." },
      { by: 'b', say: "...Okay. Weird, but okay." },
      { by: 'a', conf: "{b} has no idea what that one sentence is going to do. That's what makes {b} perfect for it." },
    ] },
  ],
  'long.drama.stir.any': [
    { id: 'lp.s1', place: 'public', when: { lost: true }, turns: [
      { by: 'a', say: "{b}, I wasn't going to say anything, but {c} said you were the reason we lost." },
      { by: 'c', say: "I did NOT say that!" },
      { by: 'b', say: "Did you, though?" },
      { by: 'c', say: "I said it was a bad day for all of us!" },
      { by: 'a', say: "That's not how it sounded." },
      { by: 'b', say: "Wow, {c}. Okay." },
      { by: 'c', say: "{a}, what is wrong with you?" },
      { by: 'a', conf: "I didn't lie. I just picked the meanest way to say it. Now they'll fight each other, and nobody's looking at me." },
    ] },
    { id: 'lp.s2', place: 'aside', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Can I ask you something? Is everything okay between you and {c}?" },
      { by: 'b', say: "Yeah. Why?" },
      { by: 'a', say: "No reason. {c} just seemed a little... cold about you this morning. Probably nothing." },
      { by: 'b', say: "Cold how?" },
      { by: 'a', say: "Forget it. I shouldn't have said anything." },
      { by: 'b', say: "No. Tell me." },
      { by: 'a', conf: "\"Forget it\" is the best way to make somebody remember something forever." },
    ] },
  ],

  'long.adv.search.any': [
    { id: 'lp.i1', place: 'secret', turns: [
      { beat: "{a} slips off to {place} when nobody's looking and starts turning things over." },
      { by: 'a', conf: "Everybody says there's an idol out here. Everybody's looking. I'm just looking harder." },
      { beat: "Nothing under the rocks. Nothing in the hollow log. Nothing behind the sign." },
      { by: 'a', conf: "Okay. Nothing. Again. If anyone asks, I went for a walk. A very long, very dirty walk." },
    ] },
  ],
  'long.adv.found.idol': [
    { id: 'lp.f1', place: 'secret', turns: [
      { beat: "{a} is on {a.posAdj} own at {place}. Something is wedged where it shouldn't be." },
      { by: 'a', conf: "Oh my god. Oh my god. Is that what I think it is?" },
      { beat: "{a} pulls it out, looks around three times, and shoves it into {a.posAdj} pocket." },
      { by: 'a', conf: "It's a Hidden Immunity Idol. I have a Hidden Immunity Idol. Nobody can know. Nobody. Not even the people I trust. Especially not them." },
    ] },
    { id: 'lp.f2', place: 'secret', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', conf: "I wasn't even looking for it! I tripped, and there it was!" },
      { by: 'a', conf: "Okay. Okay. Breathe. Don't tell anyone. Don't make a face. I'm really bad at not making a face." },
    ] },
    { id: 'lp.f3', place: 'secret', when: { register: ['schemer', 'cool', 'competitor'] }, turns: [
      { by: 'a', conf: "Found it. Three days of looking, and here it is." },
      { by: 'a', conf: "Now the fun part: everyone thinks I'm the easy vote. Let them think it right up until the night they try." },
    ] },
  ],
  'long.idol.confide.any': [
    { id: 'lp.c1', place: 'secret', turns: [
      { by: 'a', say: "I need to tell you something, and you can't tell anyone. I mean anyone." },
      { by: 'b', say: "Okay, you're scaring me." },
      { by: 'a', say: "I've got an idol." },
      { by: 'b', say: "...You WHAT?" },
      { by: 'a', say: "Shh! I found it. I've had it for a bit." },
      { by: 'b', say: "And you're telling me? Why?" },
      { by: 'a', say: "Because if they come after me, I need somebody who knows. And I trust you." },
      { by: 'b', say: "I won't say a word." },
      { by: 'b', conf: "{a} just trusted me with the biggest secret in this game. I'm honoured. I'm also now the second most important person in camp." },
    ] },
  ],
};
