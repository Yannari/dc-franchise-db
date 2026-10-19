// The team's heart, rewritten to the standard (scenes of 6 to 12 lines): making up after a snap, a dating team
// breaking up or getting back together, missing home, and the call home. a is the one it happens to.
import { V } from '../places/_kit.js';

const keys = (kind, endings) => [...endings.map(e => `${kind}.${e}`), `${kind}.any`];

export default {
  retire: [...keys('makeup', ['apology', 'laugh-it-off', 'grand-gesture']), ...keys('breakup', ['ends-it', 'not-yet']),
    ...keys('back-together', ['kiss', 'almost']), ...keys('homesick', ['misses-home', 'partner-lifts', 'wants-out']),
    ...keys('call-home', ['joy', 'bad-news'])],
  pools: {
    'makeup.apology': [
      { id: 'ph.ma1', turns: [
        { by: 'a', ...V("I'm sorry. I said things I didn't mean. Well, I meant some of them. But not like that.", "I'm sorry. I didn't mean it like that.", "Sorry. Not like that.", "I'm SORRY! I said things I didn't MEAN! Well, SOME of them. But not like THAT!", "I'm sorry. I said things I didn't mean. Some I did, but not like that.", "I'm sorry. My mouth ran ahead of my brain, and my brain is slow.") },
        { by: 'b', say: "Which ones did you mean?" },
        { by: 'a', say: "The one about the map. You really are bad with maps." },
        { by: 'b', say: "That's fair. I'm sorry too. I was horrible." },
        { by: 'a', say: "You were a little horrible." },
        { beat: 'They hug, awkwardly, with their backpacks still on, and it still counts.' },
      ] },
      { id: 'ph.ma2', turns: [
        { by: 'b', say: "Can we talk?" },
        { by: 'a', ...V("Yeah. I've been wanting to say sorry for an hour. I just didn't know how to start.", "Yeah. I've wanted to say sorry for an hour.", "Yeah. Sorry. For an hour now.", "YEAH! I've been WANTING to say sorry for an HOUR! I just didn't know how to START!", "Yeah. I've been wanting to say sorry for an hour, I just didn't know how to start.", "Yes. I've been rehearsing an apology since the last bridge.") },
        { by: 'b', say: "You just did start." },
        { by: 'a', say: "Then I'm sorry. I don't want to do this race fighting you." },
        { by: 'b', say: "Me neither. It's the worst part. Worse than the camel." },
        { by: 'a', say: "Nothing's worse than the camel." },
      ] },
    ],
    'makeup.laugh-it-off': [
      { id: 'ph.ml1', turns: [
        { by: 'a', say: "Did you really call me a walking traffic jam?" },
        { by: 'b', ...V("I did. In front of the whole crew.", "I did. In front of everyone.", "In front of the whole crew.", "I DID! In front of the WHOLE CREW!", "I did. In front of the whole crew, too.", "I did. It's my best insult. I've been saving it.") },
        { beat: '{a} tries to keep a straight face, and fails.' },
        { by: 'a', say: "That's actually really good." },
        { by: 'b', say: "I know. I was proud of it even while I was mad." },
        { by: 'a', say: "I'm using it on you next time." },
      ] },
      { id: 'ph.ml2', turns: [
        { by: 'b', say: "We just had a screaming match next to a fruit stall." },
        { by: 'a', ...V("And the man gave us a free orange to make us stop.", "And the man gave us an orange to stop.", "We got a free orange out of it.", "And the man gave us a FREE ORANGE to make us STOP!", "And the man gave us a free orange just to make us stop.", "And we were paid in citrus to be quiet.") },
        { beat: 'They look at each other, and both burst out laughing.' },
        { by: 'b', say: "Split the orange?" },
        { by: 'a', say: "Split the orange." },
        { by: 'b', say: "Best fight we've ever had." },
      ] },
    ],
    'makeup.grand-gesture': [
      { id: 'ph.mg1', turns: [
        { beat: '{a} disappears for a minute and comes back holding a bunch of slightly squashed flowers.' },
        { by: 'b', ...V("Where did you get flowers? We're in the middle of nowhere.", "Where did you get flowers?", "Flowers? From where?", "Where did you GET flowers? We're in the MIDDLE of NOWHERE!", "Where did you even get flowers? We're in the middle of nowhere.", "Flowers? Out here? Did you grow them?") },
        { by: 'a', say: "From a lady by the road. I gave her my sunglasses for them." },
        { by: 'b', say: "You love those sunglasses." },
        { by: 'a', say: "I love you more. And I'm sorry." },
        { beat: '{b} takes the flowers and holds them like they\'re the most precious thing on the race.' },
      ] },
      { id: 'ph.mg2', turns: [
        { by: 'a', say: "I'm carrying your bag for the rest of the leg. Both bags. No arguments." },
        { by: 'b', ...V("You hate carrying bags. You complain when you carry your own.", "You hate carrying bags.", "You hate bags.", "You HATE carrying bags! You COMPLAIN when you carry your OWN!", "You hate carrying bags. You complain about your own.", "You and bags are mortal enemies.") },
        { by: 'a', say: "Exactly. That's how you know I'm sorry." },
        { beat: '{a} shoulders both bags and staggers off down the road, refusing all help.' },
        { by: 'b', say: "Okay. Okay, I forgive you. You can give me one back." },
        { by: 'a', say: "No. This is my apology. I'm going to suffer it properly." },
      ] },
    ],
    'breakup.ends-it': [
      { id: 'ph.be1', turns: [
        { by: 'a', ...V("I don't think this is working. Us. I don't mean the race. I mean us.", "This isn't working. Us. Not the race.", "It's not working. Us.", "I DON'T think this is WORKING! US! Not the RACE! US!", "I don't think this is working. Not the race, I mean us.", "This isn't working. Not the racing. The us part.") },
        { by: 'b', say: "You're breaking up with me? Now? In the middle of a race?" },
        { by: 'a', say: "I didn't plan it for now. It just got too loud to ignore." },
        { by: 'b', say: "We still have to finish this leg together." },
        { by: 'a', say: "I know. We'll finish it. As a team. Just not as us." },
        { beat: 'They walk on, side by side, a careful distance apart.' },
      ] },
      { id: 'ph.be2', turns: [
        { by: 'b', say: "You've been different since the start of the race." },
        { by: 'a', ...V("I've been seeing us. All day, every day, with no breaks. And we're not good, {b}.", "I've been seeing us. We're not good.", "We're not good, {b}.", "I've been SEEING us! All DAY, every DAY! And we're NOT GOOD, {b}!", "I've been seeing us all day, every day, with no breaks. And we're not good, {b}.", "This race is a mirror. And the mirror says we're over.") },
        { by: 'b', say: "So that's it?" },
        { by: 'a', say: "That's it. I'm sorry. I really am." },
        { beat: '{b} nods once, and looks away for a long time.' },
        { by: 'b', say: "Let's just get to the mat." },
      ] },
    ],
    'breakup.not-yet': [
      { id: 'ph.bn1', turns: [
        { by: 'a', say: "We need to talk about us." },
        { by: 'b', ...V("Not here. Not now. Please. Let's get through the race first.", "Not here. After the race.", "Not now. After.", "NOT here! NOT now! PLEASE! Let's get through the RACE first!", "Not here, not now, please. Let's just get through the race first.", "Not now. Let's survive the race, then we can not-survive us.") },
        { by: 'a', say: "And then?" },
        { by: 'b', say: "And then we talk. Properly. I promise." },
        { beat: '{a} nods. It isn\'t settled, but it\'s parked.' },
        { by: 'a', say: "After the race, then." },
      ] },
      { id: 'ph.bn2', turns: [
        { by: 'b', say: "Are we breaking up? Is that what's happening right now?" },
        { by: 'a', ...V("I don't know. I don't know what's happening. I'm tired, and I'm angry, and I don't know.", "I don't know. I'm tired and angry.", "I don't know. I'm tired.", "I DON'T KNOW! I'm TIRED, and I'm ANGRY, and I DON'T KNOW!", "I don't know. I honestly don't. I'm tired, and I'm angry, and I don't know.", "I don't know. My heart is buffering.") },
        { by: 'b', say: "Then don't decide now. Decide when you're not tired." },
        { by: 'a', say: "I'm always tired on this race." },
        { by: 'b', say: "Then decide at home." },
        { beat: 'They walk on together, not holding hands, but not apart either.' },
      ] },
    ],
    'back-together.kiss': [
      { id: 'ph.bk1', turns: [
        { by: 'a', say: "You know what's stupid? I forgot why we broke up." },
        { by: 'b', ...V("You left the window open in winter. For a week.", "You left the window open. For a week.", "The window. In winter.", "You left the WINDOW OPEN in WINTER! For a WEEK!", "You left the window open, in winter, for a week.", "The window. Open. In winter. A whole week. Icicles.") },
        { by: 'a', say: "That was a very stupid reason to break up." },
        { by: 'b', say: "It was a very cold week." },
        { by: 'a', say: "I'll close every window for the rest of my life." },
        { beat: '{b} laughs, and kisses {a}, right there in the middle of everything.' },
      ] },
      { id: 'ph.bk2', turns: [
        { by: 'b', say: "This race has been the best time we've had together in years." },
        { by: 'a', ...V("We've been fighting since the first leg.", "We've been fighting since leg one.", "We've done nothing but fight.", "We've been FIGHTING since the FIRST LEG!", "We've been fighting since the very first leg.", "We've fought on every continent available.") },
        { by: 'b', say: "And making up after every single one." },
        { by: 'a', say: "That's true. We're very good at the making-up part." },
        { by: 'b', say: "So let's just skip to that part." },
        { beat: 'They kiss. A nearby crew member pretends to be extremely interested in a camera battery.' },
      ] },
    ],
    'back-together.almost': [
      { id: 'ph.bl1', turns: [
        { by: 'a', say: "Do you ever think about... us? Back then?" },
        { by: 'b', ...V("All the time. Is that bad?", "All the time.", "All the time. Bad?", "ALL the time! Is that BAD?", "All the time, honestly. Is that bad?", "Constantly. It's my second job.") },
        { by: 'a', say: "No. Me too." },
        { beat: 'They lean in, and then the tip box beeps, and the moment\'s gone.' },
        { by: 'b', say: "Later?" },
        { by: 'a', say: "Later. Definitely later." },
      ] },
      { id: 'ph.bl2', turns: [
        { by: 'b', say: "You're looking at me the way you used to." },
        { by: 'a', ...V("I'm not looking at you any way. I'm looking at the sunset.", "I'm looking at the sunset.", "Just the sunset.", "I'm NOT looking at you ANY way! I'm looking at the SUNSET!", "I'm not looking at you any way. I'm just looking at the sunset.", "That's not you I'm looking at. That's a very nice sunset behind you.") },
        { by: 'b', say: "The sunset's behind you." },
        { by: 'a', say: "...Okay. Maybe I'm looking at you a little." },
        { beat: 'For a moment, neither of them says anything. Then {b} hands {a} the map.' },
        { by: 'b', say: "Let's finish the race first. Then we'll see." },
      ] },
    ],
    'homesick.misses-home': [
      { id: 'ph.hm1', turns: [
        { by: 'a', ...V("I miss my bed. My own bed, with my own pillow.", "I miss my own bed.", "My bed. I miss it.", "I MISS my BED! My OWN bed, with my OWN pillow!", "I really miss my bed. My own bed, with my own pillow.", "I miss my bed. I'd marry my bed if it asked.") },
        { by: 'b', say: "You've got a very nice airline blanket." },
        { by: 'a', say: "It's the size of a napkin." },
        { by: 'b', say: "It's a very nice napkin." },
        { by: 'a', say: "I miss the dog. I miss making toast. I miss knowing where I am." },
        { beat: '{b} doesn\'t make a joke this time, and just sits closer.' },
      ] },
      { id: 'ph.hm2', turns: [
        { by: 'a', say: "What time is it at home right now?" },
        { by: 'b', ...V("Dinner time, I think. Everybody's sitting down to eat.", "Dinner time. Everyone's eating.", "Dinner time, at home.", "DINNER time, I think! EVERYBODY'S sitting down to EAT!", "It's dinner time back home, I think. Everyone's sitting down to eat.", "Dinner time. Somewhere, a potato is being mashed without us.") },
        { by: 'a', say: "Without us." },
        { by: 'b', say: "They'll be talking about us. Watching for us." },
        { by: 'a', say: "I hope so. I really hope so." },
        { beat: '{a} looks out of the window for a long time without saying anything else.' },
      ] },
    ],
    'homesick.partner-lifts': [
      { id: 'ph.hp1', turns: [
        { by: 'a', say: "I just want to go home. I'm so tired, and I just want to go home." },
        { by: 'b', ...V("Then think about going home with the money. Think about walking in the door with it.", "Think about going home with the money.", "Picture going home a winner.", "Then THINK about going home with the MONEY! Think about walking in the DOOR with it!", "Then think about going home with the money. Picture walking in the door with it.", "Picture going home rich. Walking in. Everybody screaming.") },
        { by: 'a', say: "Everybody would scream." },
        { by: 'b', say: "Everybody would scream, and cry, and make you a cake." },
        { by: 'a', say: "A big cake?" },
        { by: 'b', say: "The biggest cake. But only if we keep going." },
      ] },
      { id: 'ph.hp2', turns: [
        { by: 'b', say: "Hey. You're thinking about home again." },
        { by: 'a', ...V("I can't stop. Every time I close my eyes, I'm back there.", "I can't stop.", "Every time I close my eyes.", "I CAN'T STOP! Every time I CLOSE my EYES, I'm BACK there!", "I can't stop. Every time I close my eyes, I'm back there.", "I can't. My brain keeps buying tickets home.") },
        { by: 'b', say: "Then I'll be home for now. Talk to me like I'm home." },
        { by: 'a', say: "That's a very weird thing to say." },
        { by: 'b', say: "And it made you smile. So it worked." },
        { beat: '{a} leans {a.posAdj} head on {b}\'s shoulder for the rest of the flight.' },
      ] },
    ],
    'homesick.wants-out': [
      { id: 'ph.hw1', turns: [
        { by: 'a', ...V("I want to stop. I want to go home. I mean it this time.", "I want to stop. I mean it.", "I want to go home. I mean it.", "I want to STOP! I want to go HOME! I MEAN it this time!", "I want to stop. I want to go home, and I mean it this time.", "I want out. I'm handing in my notice to this race.") },
        { by: 'b', say: "You said that yesterday." },
        { by: 'a', say: "And I meant it yesterday. I mean it more today." },
        { by: 'b', say: "One more leg. Just one. If you still want out tomorrow, we'll talk." },
        { beat: '{a} doesn\'t answer, but doesn\'t stop walking either.' },
        { by: 'a', say: "One more leg." },
      ] },
      { id: 'ph.hw2', turns: [
        { by: 'a', say: "What if we just... didn't get on the next plane?" },
        { by: 'b', ...V("Then we'd be two people stuck in a strange country with no money.", "We'd be stuck here with no money.", "Stuck. Broke. Abroad.", "Then we'd be TWO people STUCK in a STRANGE country with NO MONEY!", "Then we'd be two people stuck somewhere strange with no money.", "Then we'd live here. Become locals. Sell oranges.") },
        { by: 'a', say: "At least we'd stop running." },
        { by: 'b', say: "You don't want to stop running. You want to stop hurting. That's different." },
        { beat: '{a} goes quiet, because {b} is right.' },
        { by: 'a', say: "How do you always know?" },
      ] },
    ],
    'call-home.joy': [
      { id: 'ph.cj1', turns: [
        { by: 'a', ...V("Hi! Hi, it's me! Can you hear me? It's really me!", "Hello, it's me! Can you hear me?", "It's me! Can you hear me?", "HI! HI, it's ME! Can you HEAR me? It's REALLY me!", "Hello, it's me! Can you hear me okay?", "Hello! It's me, from the other side of the world!") },
        { beat: 'There\'s screaming on the other end of the line. Happy screaming.' },
        { by: 'a', say: "Everybody's there. Everybody's in the kitchen." },
        { by: 'b', say: "Put it on speaker! Hi, everybody!" },
        { beat: 'They both hold the phone between them, laughing and crying at the same time.' },
        { by: 'a', say: "Best prize ever. Better than money." },
      ] },
      { id: 'ph.cj2', turns: [
        { by: 'b', say: "They've been watching every leg. Every single one." },
        { by: 'a', ...V("They watched us lose the map? They saw that?", "They saw us lose the map?", "They saw the map thing?", "They WATCHED us lose the MAP? They SAW that?", "They watched us lose the map? They actually saw that?", "They saw the map disaster? Our shame is international.") },
        { by: 'b', say: "And they said they're proud of us anyway." },
        { by: 'a', say: "Proud of us? Even after the map?" },
        { by: 'b', say: "Even after the map." },
        { beat: '{a} has to turn away for a minute, and wipes {a.posAdj} eyes on {a.posAdj} sleeve.' },
      ] },
    ],
    'call-home.bad-news': [
      { id: 'ph.cb1', turns: [
        { by: 'a', say: "What do you mean, in hospital? Since when?" },
        { beat: '{a} listens for a long time. {b} watches {a.posAdj} face change.' },
        { by: 'b', ...V("What is it? Is everyone okay?", "What is it? Everyone okay?", "What happened?", "What IS it? Is EVERYONE okay?", "What is it? Is everybody okay?", "What is it? Tell me. Slowly.") },
        { by: 'a', say: "Grandpa had a fall. They say he's fine. They didn't want to worry me." },
        { by: 'b', say: "He's fine. They said he's fine." },
        { by: 'a', say: "Then why do I feel like I should be there?" },
      ] },
      { id: 'ph.cb2', turns: [
        { by: 'a', ...V("The dog's sick. They didn't want to tell me, but the dog's really sick.", "The dog's sick. Really sick.", "The dog's sick.", "The DOG'S sick! They didn't WANT to tell me, but the dog's REALLY sick!", "The dog's sick. They didn't want to tell me, but it's really sick.", "The dog is ill. My best friend is ill and I'm on a camel.") },
        { by: 'b', say: "Oh no. Is the vet with it?" },
        { by: 'a', say: "Yeah. They say there's nothing I could do even if I was there." },
        { by: 'b', say: "Then let's do something here. Let's win this for the dog." },
        { beat: '{a} nods, and hangs up the phone very gently.' },
        { by: 'a', say: "For the dog." },
      ] },
    ],
  },
};
