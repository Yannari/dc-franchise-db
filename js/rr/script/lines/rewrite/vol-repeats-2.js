// More of the small pools that repeated within a season (measured 2026-10-21 over four ten-team seasons, after the
// fair share gave more teams their moments: the teams on the mat clapping, two teams in one plane row, overhearing a
// plan or mishearing one, oversharing, a souvenir left behind, a Head-to-Head, a gloat that backfires, a partner talked
// through it, a Boomerang nobody wants to use, an old argument, a clumsy goodbye, the airport rush, a crush teased and
// a pep talk that doesn't land, each from two or three scenes). The user: "try to avoid repeat the most you can add as
// many variants that you need". Said the way people talk: whole sentences, no stacked one-word lines.
// Who is who, from the scenes (js/rr/scenes/):
//   mat-crowd.applause: a and b arrive at the mat; c and d are already there, clapping.
//   plane-row.seatmates-talk: racers of two teams in one row, a and b one team, c and d the other.
//   overheard.learns-plan: a and b hear c and d plan their next move. overheard.mishears: a and b mishear it.
//   small-talk.overshare: a and b ask; c tells them far too much, d wishes c wouldn't.
//   souvenir.left: a and b alone; one of them nearly keeps something.
//   head-to-head: a and b beat c and d, close or easily.
//   gloat.backfires: a stops to gloat at c and d, and c and d go past.
//   manage-partner.distract: b is struggling; a talks b through it with something else to think about.
//   boomerang-found.torn: a and b have a Boomerang and don't want to use it.
//   old-wound.explodes: a and b, an old argument from before the race (one any two partners could have).
//   console.clumsy: a and b try to comfort c and d, who are going home, and say the wrong thing.
//   airport-crowd.scramble: several teams at the airport at once, a and b, c and d among them.
//   crush-noticed.teased: c teases a about b, whom a likes.
//   pep-talk.falls-flat: a tries to lift b, and it doesn't work.

export default {
  retire: [],
  pools: {
    'mat-crowd.applause': [
      { id: 'vr2.ma1', turns: [
        { beat: '{a} and {b} step onto the mat, and the teams already there start clapping for them.' },
        { by: 'b', say: "Wait, are they clapping for us?" },
        { by: 'c', say: "Of course we are. You were miles behind, and you still made it." },
        { by: 'a', say: "Honestly, I thought we were done about an hour ago." },
        { by: 'd', say: "So did we. That's why we're clapping." },
        { beat: '{a} laughs and sits down right there on the mat, finally able to breathe.' },
      ] },
      { id: 'vr2.ma2', turns: [
        { beat: 'Somebody on the mat starts clapping as {a} and {b} come in, and the others join in.' },
        { by: 'a', say: "Oh, stop it, you're going to make me cry." },
        { by: 'd', say: "Go on then, you've earned it." },
        { by: 'b', say: "We really didn't think we'd get here today." },
        { by: 'c', say: "Well, you did, so come and sit down with us." },
        { beat: 'They squeeze in beside {c} and {d}.' },
      ] },
      { id: 'vr2.ma3', turns: [
        { beat: 'A round of applause goes up from the teams on the mat as {a} and {b} come in.' },
        { by: 'b', say: "Why does everyone look so happy to see us?" },
        { by: 'c', say: "Because we've been watching the path for ages, hoping it'd be you." },
        { by: 'a', say: "That's really nice. I don't know what to say." },
        { by: 'd', say: "Say nothing. Just get a drink of water." },
        { beat: '{a} takes the bottle {d} holds out and drinks half of it in one go.' },
      ] },
    ],
    'plane-row.seatmates-talk': [
      { id: 'vr2.ps1', turns: [
        { beat: 'Two teams end up squashed into the same row, elbow to elbow.' },
        { by: 'c', say: "So what do you guys do when you're not running around the world?" },
        { by: 'a', say: "Normal stuff. Work, sleep, complain about work." },
        { by: 'd', say: "That sounds like a dream right now." },
        { by: 'b', say: "Ask me again in a week and I'll say the same thing." },
        { beat: 'They spend the rest of the flight swapping stories about their worst jobs.' },
      ] },
      { id: 'vr2.ps2', turns: [
        { by: 'b', say: "Can I ask you something without it being weird?" },
        { by: 'd', say: "Sure. Everything's weird on this plane anyway." },
        { by: 'b', say: "Do you ever get scared you'll go home next?" },
        { by: 'c', say: "Every single leg. Every time we land, I think, this is it." },
        { by: 'a', say: "Okay, good. I thought it was just us." },
        { beat: 'For a minute nobody talks, and it feels less lonely than it did.' },
      ] },
      { id: 'vr2.ps3', turns: [
        { by: 'a', say: "Do you want my peanuts? I can't eat them." },
        { by: 'c', say: "Are you sure? That's really kind." },
        { by: 'a', say: "I'm allergic, so you'd be doing me a favour." },
        { by: 'd', say: "Then you can have my dessert. It looks a bit sad, but it's yours." },
        { by: 'b', say: "This is the nicest trade I've seen on this whole race." },
        { beat: 'The two teams spend the rest of the flight sharing snacks.' },
      ] },
    ],
    'overheard.learns-plan': [
      { id: 'vr2.ol1', turns: [
        { beat: '{a} and {b} are waiting round the corner when they hear {c} and {d} talking.' },
        { by: 'c', say: "At the next Don Box, one of us grabs the tip and the other one just starts running. We read it on the way." },
        { by: 'b', say: "Did you hear that? They read it on the way." },
        { by: 'a', say: "Then so do we. Don't look round, just act normal." },
        { by: 'b', say: "I am acting normal. This is my normal face." },
        { beat: 'At the next Don Box, {a} grabs the tip while {b} is already running.' },
      ] },
      { id: 'vr2.ol2', turns: [
        { by: 'd', say: "Whoever's in front of us at the next challenge, we just follow them. Let them work it out." },
        { beat: 'Just behind them, {a} stops tying {a.posAdj} shoe and listens.' },
        { by: 'a', say: "They're going to follow whoever's in front." },
        { by: 'b', say: "Then we don't go in front. We let them go first and follow them." },
        { by: 'a', say: "That's either really clever or really stupid." },
        { by: 'b', say: "We'll find out which in about an hour." },
      ] },
      { id: 'vr2.ol3', turns: [
        { by: 'c', say: "We're running out of money, so from now on we walk everywhere we can." },
        { beat: '{b} nudges {a} and nods towards {c} and {d}.' },
        { by: 'b', say: "They're broke. They're going to be walking." },
        { by: 'a', say: "So if it's a long way, we pay for a ride and leave them behind." },
        { by: 'b', say: "I feel a bit bad about that." },
        { by: 'a', say: "Me too, but only a bit." },
      ] },
    ],
    'overheard.mishears': [
      { id: 'vr2.om1', when: { at: 'road' }, turns: [
        { by: 'b', say: "I'm sure they said the bridge. They're going to the bridge." },
        { by: 'a', say: "Which bridge? There are about four bridges." },
        { by: 'b', say: "The big one, obviously." },
        { beat: 'They run all the way to the big bridge. Nobody is there, and there is no Don Box.' },
        { by: 'a', say: "Are you sure they didn't say the ridge?" },
        { by: 'b', say: "...Okay, it could have been the ridge." },
      ] },
      { id: 'vr2.om2', turns: [
        { by: 'a', say: "They said the tip is under the red flag. I heard it really clearly." },
        { by: 'b', say: "Really clearly, from behind a wall, while everyone was shouting?" },
        { by: 'a', say: "Pretty clearly, then." },
        { beat: 'They find the red flag. Under it, there is nothing but a very surprised cat.' },
        { by: 'b', say: "Maybe they said bread flag." },
        { by: 'a', say: "Nobody says bread flag. Let's just go back." },
      ] },
      { id: 'vr2.om3', turns: [
        { by: 'b', say: "They said it closes at six. We've got loads of time." },
        { by: 'a', say: "Are you sure they didn't say it opens at six?" },
        { by: 'b', say: "Why would they say that?" },
        { beat: 'When they get there, a sign by the entrance says it opens at six.' },
        { by: 'a', say: "Because that's what it does." },
        { by: 'b', say: "Okay, I'm never listening in on anyone again." },
      ] },
    ],
    'small-talk.overshare': [
      { id: 'vr2.so1', turns: [
        { by: 'a', say: "So how are you two holding up?" },
        { by: 'c', say: "Honestly? I haven't slept properly in three days, and I cried in a bathroom this morning." },
        { by: 'd', say: "We said we weren't going to tell people that." },
        { by: 'c', say: "They asked!" },
        { by: 'b', say: "That's okay. I cried on the plane, if it helps." },
        { by: 'd', say: "It does, a little, actually." },
      ] },
      { id: 'vr2.so2', turns: [
        { by: 'b', say: "Nice shirt, by the way." },
        { by: 'c', say: "Thanks, it's my ex's. I took it when we broke up, and I've never given it back." },
        { by: 'd', say: "Please don't do the whole story again." },
        { by: 'c', say: "It's a good story. It's got a fire in it." },
        { by: 'a', say: "We actually have to go, but... a fire?" },
        { by: 'd', say: "Go. Save yourselves. It's a long one." },
      ] },
      { id: 'vr2.so3', turns: [
        { by: 'a', say: "Have you two known each other long?" },
        { by: 'c', say: "Since we were kids. {d} once bit me so hard I needed stitches." },
        { by: 'd', say: "I was four!" },
        { by: 'c', say: "I've still got the scar. Do you want to see it?" },
        { by: 'b', say: "No, that's okay, we believe you." },
        { beat: '{c} shows them the scar anyway.' },
      ] },
    ],
    'souvenir.left': [
      { id: 'vr2.sl1', turns: [
        { by: 'a', say: "Look at this little key ring. Isn't it cute?" },
        { by: 'b', say: "It's very cute. We also have no money." },
        { by: 'a', say: "It's only a tiny bit of money." },
        { by: 'b', say: "That tiny bit of money is our next ride." },
        { beat: '{a} looks at it for a long moment and hangs it back on the stand.' },
        { by: 'a', say: "Bye, key ring. I'll come back for you one day." },
      ] },
      { id: 'vr2.sl2', turns: [
        { beat: '{a} picks up a postcard from a rack and turns it over.' },
        { by: 'a', say: "I want to send one of these home, so they know we're still alive." },
        { by: 'b', say: "They're watching us on TV. They know we're still alive." },
        { by: 'a', say: "It's not the same as a postcard, though." },
        { by: 'b', say: "We'll send them a hundred postcards when this is over. Come on." },
        { beat: '{a} puts the postcard back and follows {b}.' },
      ] },
      { id: 'vr2.sl3', turns: [
        { by: 'b', say: "What have you got there?" },
        { by: 'a', say: "Just a little stone. I thought I could keep it, to remember this place." },
        { by: 'b', say: "You'll remember this place. You'll be telling people about it for years." },
        { by: 'a', say: "That's true. I'll never shut up about it." },
        { beat: '{a} puts the stone back exactly where it was.' },
        { by: 'b', say: "See? Now it's still here for the next person." },
      ] },
    ],
    'head-to-head.close': [
      { id: 'vr2.hc1', turns: [
        { beat: '{a} and {b} line up against {c} and {d}. It goes back and forth the whole way.' },
        { by: 'd', say: "Come on, come on, we're catching them!" },
        { by: 'a', say: "Don't look back, just keep going!" },
        { beat: 'At the very end, {a} and {b} get there a moment before the others.' },
        { by: 'c', say: "That was so close. I really thought we had you." },
        { by: 'b', say: "You nearly did. Good luck with the next one, honestly." },
      ] },
      { id: 'vr2.hc2', turns: [
        { by: 'c', say: "Okay, whoever loses this, no hard feelings, right?" },
        { by: 'a', say: "No hard feelings. Let's just go." },
        { beat: 'Neither team pulls ahead until the very last second, when {a} and {b} edge it.' },
        { by: 'd', say: "No! We were right there!" },
        { by: 'b', say: "I'm really sorry. That could have gone either way." },
        { by: 'c', say: "I know. Go on, before I change my mind about the hard feelings." },
      ] },
      { id: 'vr2.hc3', turns: [
        { beat: 'The Head-to-Head is so close that both teams stop and look round to see who won.' },
        { by: 'a', say: "Was that us? Did we get it?" },
        { by: 'c', say: "I think you did. By about a centimetre." },
        { by: 'b', say: "I'll take a centimetre." },
        { by: 'd', say: "Next time, it's our centimetre." },
        { beat: '{a} and {b} hurry off, still not quite sure how they won it.' },
      ] },
    ],
    'head-to-head.rout': [
      { id: 'vr2.hr1', turns: [
        { beat: '{a} and {b} finish the Head-to-Head before {c} and {d} are even halfway.' },
        { by: 'c', say: "Hang on, you're done already?" },
        { by: 'a', say: "Sorry. It just sort of went right for once." },
        { by: 'd', say: "Well, it went very wrong for us." },
        { by: 'b', say: "You'll get the next team, I'm sure of it." },
        { by: 'c', say: "Just go before I get even more embarrassed." },
      ] },
      { id: 'vr2.hr2', turns: [
        { by: 'd', say: "We've got this. We've practised this in our heads loads of times." },
        { beat: 'It turns out practising in your head is not enough. {a} and {b} win easily.' },
        { by: 'c', say: "Okay, that didn't go the way it went in my head." },
        { by: 'b', say: "It hardly ever does, honestly." },
        { by: 'a', say: "Good luck with the next round, though, we mean it." },
        { by: 'd', say: "Thanks. I think we're going to need it." },
      ] },
      { id: 'vr2.hr3', turns: [
        { by: 'a', say: "Ready? Go!" },
        { beat: 'It isn\'t a contest. {a} and {b} are done while {c} and {d} are still getting started.' },
        { by: 'd', say: "How did you do that so fast?" },
        { by: 'b', say: "I have no idea. We just didn't stop." },
        { by: 'c', say: "Well, can you stop now, so we can catch up?" },
        { by: 'a', say: "Sorry, we really have to go. Good luck!" },
      ] },
    ],
    'gloat.backfires': [
      { id: 'vr2.gb1', turns: [
        { by: 'a', say: "Look at them. They have no idea what they're doing." },
        { by: 'b', say: "Neither do we, and we're not doing it either." },
        { by: 'a', say: "I just want to enjoy this for a minute." },
        { beat: 'While {a} is enjoying it, {c} and {d} finally get it right and run past.' },
        { by: 'c', say: "Thanks for watching, guys!" },
        { by: 'b', say: "That's what you get for enjoying it." },
      ] },
      { id: 'vr2.gb2', turns: [
        { by: 'a', say: "Need some help over there? Oh, right, you can't have any." },
        { by: 'd', say: "Don't you have your own challenge to do?" },
        { by: 'b', say: "We do. Come on, we really do." },
        { by: 'a', say: "Hang on, I want to see how this ends." },
        { beat: 'It ends with {c} and {d} finishing first, while {a} is still watching.' },
        { by: 'b', say: "Well, now you know how it ends." },
      ] },
      { id: 'vr2.gb3', turns: [
        { by: 'a', say: "We are so far ahead of them it's not even funny." },
        { by: 'b', say: "Then why are we standing here talking about it?" },
        { by: 'a', say: "Because it's nice to say out loud." },
        { beat: 'Behind them, {c} and {d} come round the corner at a run, and go straight past.' },
        { by: 'd', say: "Not that far ahead anymore!" },
        { by: 'b', say: "Never say it out loud again. Ever." },
      ] },
    ],
    'manage-partner.distract': [
      { id: 'vr2.md1', turns: [
        { by: 'b', say: "I can't. I really can't do this." },
        { by: 'a', say: "Tell me what you're going to eat first when we get home." },
        { by: 'b', say: "What? Why are you asking me that right now?" },
        { by: 'a', say: "Just tell me, and keep going while you do." },
        { by: 'b', say: "A huge plate of pasta, with way too much cheese on it..." },
        { beat: 'By the time {b} has described the whole meal, it\'s done.' },
      ] },
      { id: 'vr2.md2', turns: [
        { by: 'a', say: "Remember that awful song we sang in the car on the way here?" },
        { by: 'b', say: "Please don't make me sing right now." },
        { by: 'a', say: "Just the first bit. Come on, with me." },
        { beat: '{a} starts singing, badly, and after a moment {b} joins in, even worse.' },
        { by: 'b', say: "Wait, did I just finish it?" },
        { by: 'a', say: "You did, and you sang the whole time. I'm very proud of you." },
      ] },
      { id: 'vr2.md3', turns: [
        { by: 'b', say: "My hands are shaking. I can't stop them shaking." },
        { by: 'a', say: "Okay, count backwards from fifty out loud for me." },
        { by: 'b', say: "Fifty, forty-nine, forty-eight... this is so stupid..." },
        { by: 'a', say: "It's working, though. Keep counting." },
        { beat: 'Somewhere around thirty-one, {b} realises the hard part is over.' },
        { by: 'b', say: "Okay. Okay, that actually worked." },
      ] },
    ],
    'boomerang-found.torn': [
      { id: 'vr2.bt1', turns: [
        { by: 'a', say: "So we've got a Boomerang now. What do we do with it?" },
        { by: 'b', say: "We use it. That's the whole point of having one." },
        { by: 'a', say: "On who, though? Everyone's been so nice to us." },
        { by: 'b', say: "That's exactly why it's hard. That's the game." },
        { by: 'a', say: "I don't think I like this part of the game." },
        { beat: '{a} tucks the Boomerang away, and neither of them says anything for a while.' },
      ] },
      { id: 'vr2.bt2', turns: [
        { by: 'b', say: "Whoever we send it to is going to hate us." },
        { by: 'a', say: "Not hate. Maybe be really annoyed for a day or two." },
        { by: 'b', say: "I'd hate us if it was me." },
        { by: 'a', say: "Okay, you'd hate us. But you'd also do it." },
        { by: 'b', say: "...Yeah. I probably would." },
        { beat: 'They look at the Boomerang for a long time before either of them moves.' },
      ] },
      { id: 'vr2.bt3', turns: [
        { beat: '{a} holds up the Boomerang like it might bite.' },
        { by: 'a', say: "I really wish we hadn't found this." },
        { by: 'b', say: "If we don't use it, somebody else will use theirs on us." },
        { by: 'a', say: "I know. That doesn't make it feel any better." },
        { by: 'b', say: "Let's decide at the board. Not now." },
        { by: 'a', say: "Fine. At the board. I'm still going to feel bad, though." },
      ] },
    ],
    'old-wound.explodes': [
      { id: 'vr2.ow1', turns: [
        { by: 'b', say: "This is just like that road trip. You wouldn't ask for directions then either." },
        { by: 'a', say: "Don't bring up the road trip." },
        { by: 'b', say: "We drove around for six hours because you wouldn't stop and ask!" },
        { by: 'a', say: "We found the place in the end, didn't we?" },
        { by: 'b', say: "At midnight! Everyone had gone home!" },
        { beat: 'The argument about the road trip goes on long after the race has moved on.' },
      ] },
      { id: 'vr2.ow2', turns: [
        { by: 'a', say: "You always do this. You did it at my birthday too." },
        { by: 'b', say: "That was one time, and I said sorry!" },
        { by: 'a', say: "You said sorry three days later!" },
        { by: 'b', say: "Because you didn't talk to me for three days!" },
        { beat: 'A few people nearby stop and stare. Neither of them notices.' },
        { by: 'a', say: "We're talking about this properly when we get home." },
      ] },
      { id: 'vr2.ow3', turns: [
        { by: 'b', say: "You never listen. You didn't listen when I said not to buy that car, either." },
        { by: 'a', say: "The car was a good car!" },
        { by: 'b', say: "It broke down on the way home from buying it!" },
        { by: 'a', say: "That was bad luck, not a bad car!" },
        { by: 'b', say: "It caught fire!" },
        { beat: 'It gets louder, and it isn\'t really about the car anymore.' },
      ] },
    ],
    'console.clumsy': [
      { id: 'vr2.cc1', turns: [
        { by: 'a', say: "Hey, we're really sorry you're going home." },
        { by: 'c', say: "Thanks. It's been a long day." },
        { by: 'b', say: "At least you don't have to do any more of these awful challenges." },
        { by: 'd', say: "We actually liked the challenges." },
        { beat: 'There is a long, uncomfortable pause.' },
        { by: 'a', say: "Okay, we're going to stop talking now. Take care." },
      ] },
      { id: 'vr2.cc2', turns: [
        { by: 'b', say: "You'll be home soon. That's nice, right?" },
        { by: 'c', say: "We'd rather be here, to be honest." },
        { by: 'a', say: "Yeah, but home has a proper bed, and real food." },
        { by: 'd', say: "And no million dollars." },
        { by: 'b', say: "...That's fair. Sorry. We're bad at this." },
        { by: 'c', say: "It's okay. Thanks for trying." },
      ] },
      { id: 'vr2.cc3', turns: [
        { by: 'a', say: "For what it's worth, we always thought you'd go further than us." },
        { by: 'd', say: "But we didn't." },
        { by: 'a', say: "No. You didn't. That came out wrong." },
        { by: 'b', say: "What we mean is, you were really good, and it's not fair." },
        { by: 'c', say: "That's better. Thanks." },
        { beat: '{a} gives {c} an awkward hug that goes on slightly too long.' },
      ] },
    ],
    'airport-crowd.scramble': [
      { id: 'vr2.as1', turns: [
        { beat: 'A gate change flashes up on the board, and every team in the terminal starts running at once.' },
        { by: 'a', say: "Which way? Which way is gate twelve?" },
        { by: 'c', say: "Stop following us!" },
        { by: 'b', say: "We're not following you, it's the only way to go!" },
        { by: 'd', say: "Then go faster, you're blocking the whole corridor!" },
        { beat: 'They all arrive at gate twelve at the same moment, completely out of breath.' },
      ] },
      { id: 'vr2.as2', turns: [
        { by: 'b', say: "There's a desk over there with no queue." },
        { by: 'd', say: "No, there isn't. We saw it first." },
        { by: 'a', say: "You can't call dibs on a desk." },
        { by: 'c', say: "We just did." },
        { beat: 'Both teams run for it, and a family with a pram gets there first.' },
        { by: 'b', say: "Well, nobody wins, then." },
      ] },
      { id: 'vr2.as3', turns: [
        { by: 'a', say: "Is that the last two seats on the early flight?" },
        { by: 'c', say: "It is, and it's ours." },
        { by: 'b', say: "We were in the queue first!" },
        { by: 'd', say: "You were in the wrong queue first!" },
        { beat: 'While they argue, the agent gives both seats to a man in a suit who was waiting quietly.' },
        { by: 'a', say: "Good. Great. Brilliant work, everyone." },
      ] },
    ],
    'crush-noticed.teased': [
      { id: 'vr2.ct1', turns: [
        { by: 'c', say: "You keep looking over there. Is it {b}?" },
        { by: 'a', say: "No. I'm looking at the view." },
        { by: 'c', say: "The view's the other way." },
        { by: 'a', say: "Can you please just drop it?" },
        { by: 'c', say: "I'll drop it when you stop going red." },
        { beat: '{a} turns away, which only makes it more obvious.' },
      ] },
      { id: 'vr2.ct2', turns: [
        { by: 'c', say: "Do you want me to save {b} a seat next to you later?" },
        { by: 'a', say: "Why would I want that?" },
        { by: 'c', say: "Oh, I don't know. Because you've talked about {b.obj} all day?" },
        { by: 'a', say: "I have not talked about {b.obj} all day." },
        { by: 'c', say: "You have, and it's very sweet." },
        { beat: '{a} puts {a.posAdj} head in {a.posAdj} hands and refuses to answer.' },
      ] },
      { id: 'vr2.ct3', turns: [
        { by: 'c', say: "{b} just smiled at you. Did you see?" },
        { by: 'a', say: "{b} was smiling at everyone." },
        { by: 'c', say: "Not like that. That was a you smile." },
        { by: 'a', say: "There's no such thing as a you smile." },
        { by: 'c', say: "There is, and you just got one." },
        { beat: '{a} tries very hard not to smile back, and fails.' },
      ] },
    ],
    'pep-talk.falls-flat': [
      { id: 'vr2.pf1', turns: [
        { by: 'a', say: "Come on, you've got this. Think about how proud everyone back home will be." },
        { by: 'b', say: "Everyone back home is watching me fail on TV." },
        { by: 'a', say: "They're watching you try, though, and that's what matters." },
        { by: 'b', say: "That really isn't helping right now." },
        { by: 'a', say: "Okay. I'll be quiet." },
        { beat: '{a} goes quiet. {b} gets it wrong again anyway.' },
      ] },
      { id: 'vr2.pf2', turns: [
        { by: 'a', say: "You're strong, you're fast, and you can do anything." },
        { by: 'b', say: "I've done this five times, and I've failed it five times." },
        { by: 'a', say: "Then the sixth time is the one." },
        { by: 'b', say: "That's not how numbers work." },
        { by: 'a', say: "Maybe not, but you never know." },
        { beat: 'The sixth time is not the one.' },
      ] },
      { id: 'vr2.pf3', turns: [
        { by: 'a', say: "Just imagine you've already done it. Picture it in your head." },
        { by: 'b', say: "All I can picture is me getting it wrong again." },
        { by: 'a', say: "Then picture it going right instead." },
        { by: 'b', say: "I'm trying, and it keeps going wrong in my head too." },
        { by: 'a', say: "Okay, maybe stop picturing things." },
        { beat: '{b} stops picturing things, and it still doesn\'t work.' },
      ] },
    ],

    // the confessional after a fight between the two of them (a is the one talking; b sits beside a)
    'int-feeling.angry': [
      { id: 'vr2.ia1', when: { cause: ['blame', 'snap'] }, turns: [
        { by: 'a', conf: "I'm trying to let it go, I really am, but I'm still annoyed." },
        { by: 'b', conf: "You've said that four times now." },
        { by: 'a', conf: "Because I'm still annoyed four times." },
      ] },
      { id: 'vr2.ia2', when: { cause: ['blame', 'snap'] }, turns: [
        { by: 'a', conf: "When we argue in the middle of a challenge, we just lose time, and that's what makes me angry." },
        { by: 'b', conf: "So you're not angry at me, you're angry at the clock?" },
        { by: 'a', conf: "I'm angry at both of you." },
      ] },
      { id: 'vr2.ia3', when: { cause: ['blame', 'snap'] }, turns: [
        { by: 'b', conf: "We had a bit of a fight back there." },
        { by: 'a', conf: "A bit? You yelled at me in front of everybody." },
        { by: 'b', conf: "Okay, more than a bit. I'm sorry." },
      ] },
      { id: 'vr2.ia4', when: { cause: ['blame', 'snap'] }, turns: [
        { by: 'a', conf: "I don't mind losing time. I mind being blamed for it when it wasn't my fault." },
        { by: 'b', conf: "It was a little bit your fault." },
        { by: 'a', conf: "See? This is exactly what I'm talking about." },
      ] },
      { id: 'vr2.ia5', when: { cause: 'old-wound' }, turns: [
        { by: 'a', conf: "Every time we get stressed, the same old argument comes back, and I'm so tired of it." },
        { by: 'b', conf: "Then maybe we should actually sort it out one day." },
        { by: 'a', conf: "Maybe. But not today. Today we're racing." },
      ] },
      { id: 'vr2.ia6', when: { cause: 'old-wound' }, turns: [
        { by: 'a', conf: "That fight had nothing to do with the race. It's been coming for years." },
        { by: 'b', conf: "Well, the race didn't help." },
        { by: 'a', conf: "No. The race really didn't help." },
      ] },
    ],
    'int-feeling.hurt': [
      { id: 'vr2.ih1', when: { cause: ['blame', 'snap', 'silent-treatment'] }, turns: [
        { by: 'a', conf: "It wasn't what was said that hurt. It was how it was said." },
        { by: 'b', conf: "I know. I shouldn't have said it like that." },
        { by: 'a', conf: "Thank you. That actually helps." },
      ] },
      { id: 'vr2.ih2', when: { cause: ['blame', 'snap', 'silent-treatment'] }, turns: [
        { by: 'a', conf: "I'm doing my best out there, and it doesn't feel like that's ever enough." },
        { by: 'b', conf: "It is enough. I just get scared, and it comes out wrong." },
        { by: 'a', conf: "Then tell me you're scared, not that I'm doing it wrong." },
      ] },
      { id: 'vr2.ih3', when: { cause: ['blame', 'snap', 'silent-treatment'] }, turns: [
        { by: 'a', conf: "We've barely said a word to each other since, and that's the worst part." },
        { by: 'b', conf: "I didn't know what to say." },
        { by: 'a', conf: "Sorry would have been a good start." },
      ] },
      { id: 'vr2.ih4', when: { cause: ['blame', 'snap', 'silent-treatment'] }, turns: [
        { by: 'a', conf: "I came on this race to spend time with you, not to get shouted at." },
        { by: 'b', conf: "I know. I'm going to do better." },
        { by: 'a', conf: "Okay. I'm going to hold you to that." },
      ] },
    ],

  },
};
