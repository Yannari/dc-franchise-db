// The body, part two: a revolting plate (quick hits of 2 to 6 lines), talk of giving up the challenge or the race
// (scenes of 6 to 12), and a reaction that arrives late. Kept light and off-camera. a is the one it happens to.
import { V } from '../places/_kit.js';

const keys = (kind, endings) => [...endings.map(e => `${kind}.${e}`), `${kind}.any`];

export default {
  retire: [...keys('gross-out', ['keeps-it-down', 'vomits', 'chain-reaction']), ...keys('quit-talk', ['talked-back', 'quits-task', 'quits-race']),
    ...keys('delayed-reaction', ['kicks-in-late', 'kicks-in-helpfully'])],
  pools: {
    'gross-out.keeps-it-down': [
      { id: 'bg.gk1', turns: [
        { by: 'a', ...V("It's staying down. It's staying down. Don't talk to me.", "It's staying down. Don't talk.", "Staying down. Shh.", "It's STAYING DOWN! It's STAYING DOWN! Don't TALK to me!", "It's staying down, it's staying down. Just don't talk to me.", "It's staying down. By sheer force of will. Silence, please.") },
        { by: 'b', say: "I'm not saying a word. I'm barely breathing." },
        { by: 'a', say: "...Okay. It stayed down." },
      ] },
      { id: 'bg.gk2', turns: [
        { by: 'b', say: "How was it?" },
        { by: 'a', ...V("Like a sock that's been somewhere terrible. But it's gone.", "Like a sock. But it's gone.", "A sock. Gone now.", "Like a SOCK that's been somewhere TERRIBLE! But it's GONE!", "Like a sock that's been somewhere terrible. But it's gone now.", "Like a sock's whole life story. But I swallowed the ending.") },
        { by: 'b', say: "I'm so proud of you, and I'm never sharing a fork with you again." },
      ] },
    ],
    'gross-out.vomits': [
      { id: 'bg.gv1', turns: [
        { by: 'a', ...V("Bucket. Bucket. I need the bucket.", "Bucket. Now.", "Bucket.", "BUCKET! BUCKET! I need the BUCKET!", "Bucket, please, I need the bucket.", "Bucket. The bucket is my only friend now.") },
        { beat: '{a} turns green and makes it to the bucket just in time. The camera politely looks at the sky.' },
        { by: 'b', say: "Better out than in. Go again." },
      ] },
      { id: 'bg.gv2', turns: [
        { beat: '{a} gets halfway through, goes very pale, and runs for the bin behind the stall.' },
        { by: 'b', ...V("Take your time! Take all the time you need!", "Take your time.", "No rush.", "Take your TIME! Take ALL the time you NEED!", "Take your time, take all the time you need!", "Take your time! The bin isn't going anywhere!") },
        { by: 'a', say: "That didn't happen. Hand me the plate. Again." },
      ] },
    ],
    'gross-out.chain-reaction': [
      { id: 'bg.gc1', turns: [
        { beat: '{a} heaves. The person next to {a.obj} heaves. Then the person next to them.' },
        { by: 'b', ...V("Don't look at each other! Nobody look at anybody!", "Nobody look at anybody!", "Don't look!", "DON'T look at each other! NOBODY look at ANYBODY!", "Don't look at each other! Nobody look at anybody!", "Eyes forward, on your own plate, because it's contagious!") },
        { by: 'a', say: "Too late. Too late for all of us." },
      ] },
      { id: 'bg.gc2', turns: [
        { by: 'b', say: "Oh no. They've started a wave." },
        { beat: 'One by one, down the whole table, every racer goes green and runs for the bins.' },
        { by: 'a', ...V("I didn't mean to start it! It just happened!", "I didn't mean to start it!", "Not on purpose!", "I DIDN'T mean to START it! It just HAPPENED!", "I didn't mean to start it, it just happened!", "I didn't start it! I was merely the first domino!") },
      ] },
    ],
    'quit-talk.talked-back': [
      { id: 'bg.qt1', turns: [
        { by: 'a', ...V("I'm done with this one. I can't get it. I've tried and tried, and I can't.", "I'm done. I can't get it.", "Done. I can't.", "I'm DONE with this one! I CAN'T get it! I've TRIED and TRIED, and I CAN'T!", "I'm done with this one. I've tried and tried and I can't get it.", "I surrender. This one has won. I salute it and I'm leaving.") },
        { by: 'b', say: "If we walk away now, we sit out four hours. Four hours. We'd be out." },
        { by: 'a', say: "And if I keep trying, I keep failing." },
        { by: 'b', say: "Then fail again. Fail ten more times. One of them won't be a fail." },
        { beat: '{a} stares at it, breathes out, and picks it back up.' },
        { by: 'a', say: "Ten more. Then we talk again." },
        { by: 'b', say: "Deal." },
      ] },
      { id: 'bg.qt2', turns: [
        { by: 'a', say: "Let's just take the penalty. I want to stop. I want to sit down and stop." },
        { by: 'b', ...V("Look at me. Remember why we came. Remember what we said at home.", "Remember why we came.", "Remember what we said at home.", "Look at ME! REMEMBER why we came! Remember what we SAID at HOME!", "Look at me. Remember why we came here, and what we said at home.", "Look at me. Remember the speech you made in the kitchen?") },
        { by: 'a', say: "We said we'd never give up." },
        { by: 'b', say: "We said we'd never give up. Out loud. In front of everybody." },
        { by: 'a', say: "I hate it when you're right." },
        { beat: '{a} gets up and tries again. This time, it works.' },
      ] },
    ],
    'quit-talk.quits-task': [
      { id: 'bg.qq1', turns: [
        { by: 'a', say: "I'm sorry. I'm sorry, I can't do it. We take the penalty." },
        { by: 'b', ...V("Okay. It's okay. We take it. We sit and wait.", "Okay. We take it. We wait.", "Okay. We wait.", "OKAY! It's OKAY! We TAKE it! We SIT and WAIT!", "Okay. It's okay. We'll take the penalty and wait.", "Okay. We sit. We'll become very good at sitting.") },
        { by: 'a', say: "Four hours. We're going to lose because of me." },
        { by: 'b', say: "We might. Or every team behind us might have a worse day than us." },
        { beat: 'They sit together on a bench, and watch the other teams come and go.' },
        { by: 'a', say: "Thank you for not being angry." },
        { by: 'b', say: "I'll be angry later. Right now I'm just sitting." },
      ] },
      { id: 'bg.qq2', turns: [
        { by: 'b', say: "Are you sure? Once we take the penalty, there's no going back." },
        { by: 'a', ...V("I'm sure. I've got nothing left for this one. Nothing.", "I'm sure. Nothing left.", "Sure. Nothing left.", "I'm SURE! I've got NOTHING left for this one! NOTHING!", "I'm sure. I've got nothing left to give this one.", "I'm sure. This one has taken everything except my shoes.") },
        { beat: '{b} goes and tells a crew member. The clock starts.' },
        { by: 'b', say: "Four hours. What do you want to do with four hours?" },
        { by: 'a', say: "Sleep. And then feel bad about it." },
        { by: 'b', say: "Sleep first. Feel bad later. I'll wake you for the feeling bad." },
      ] },
    ],
    'quit-talk.quits-race': [
      { id: 'bg.qr1', turns: [
        { by: 'a', ...V("I want to go home. Not just this leg. I want to stop the race.", "I want to go home. Stop the race.", "I want to stop the race.", "I want to go HOME! Not just this LEG! I want to STOP the RACE!", "I want to go home. Not just this leg, I want to stop the race.", "I'm done racing. I want my own front door.") },
        { by: 'b', say: "Are you sure? Really sure? Sleep on it first." },
        { by: 'a', say: "I've slept on it three nights in a row. I'm sure." },
        { beat: '{b} is quiet for a long time. Then nods.' },
        { by: 'b', say: "Okay. Then we go home. Together." },
        { by: 'a', say: "I'm sorry. I'm so sorry." },
        { by: 'b', say: "Don't be. We got further than anybody thought we would." },
      ] },
      { id: 'bg.qr2', turns: [
        { by: 'b', say: "If you want to stop, we stop. I'm not going to make you." },
        { by: 'a', ...V("I don't want to let you down.", "I don't want to let you down.", "I'll let you down.", "I DON'T want to LET you DOWN!", "I don't want to let you down. That's the worst part.", "I don't want to be the reason. That's the heavy part.") },
        { by: 'b', say: "You're not letting me down. You're telling me the truth. That's different." },
        { by: 'a', say: "Then I want to stop. I want to go home." },
        { beat: 'They hold on to each other for a long moment, right there on the road.' },
        { by: 'b', say: "Then let's go home." },
      ] },
    ],
    'delayed-reaction.kicks-in-late': [
      { id: 'bg.dl1', turns: [
        { by: 'a', say: "Oh no. Oh no, whatever I ate earlier has just remembered me." },
        { by: 'b', ...V("Now? In the middle of the cab ride? Now?", "Now? In the cab?", "Now? Here?", "NOW? In the MIDDLE of the CAB RIDE? NOW?", "Now? In the middle of the cab ride?", "Now? It waited until now? That's very rude of it.") },
        { by: 'a', say: "Can we stop? Can we please stop somewhere?" },
        { by: 'b', say: "Excuse me, sir, could you pull over? Anywhere. Quickly." },
        { beat: 'The cab pulls over at a petrol station. They lose ten minutes and gain a lot of gratitude for petrol stations.' },
        { by: 'a', say: "I'm never eating anything again." },
      ] },
      { id: 'bg.dl2', turns: [
        { by: 'a', say: "My stomach is still doing somersaults. It's been an hour. Why is it still doing somersaults?" },
        { by: 'b', ...V("Because you had four helpings. Four. Nobody asked you to have four.", "You had four helpings.", "Four helpings. Nobody asked.", "Because you had FOUR helpings! FOUR! NOBODY asked you to have four!", "Because you had four helpings, and nobody asked you to.", "Because you had four helpings. You overachieved.") },
        { by: 'a', say: "I wanted to be sure." },
        { by: 'b', say: "And now you're sure." },
        { beat: '{a} spends the next ten minutes with {a.posAdj} head out of the cab window, breathing slowly.' },
        { by: 'a', say: "Very sure." },
      ] },
    ],
    'delayed-reaction.kicks-in-helpfully': [
      { id: 'bg.dh1', turns: [
        { by: 'a', say: "Is it me, or do I suddenly have a lot of energy?" },
        { by: 'b', ...V("It's the drink they gave us back there. The strong one.", "It's that drink. The strong one.", "The strong drink.", "It's the DRINK they gave us back there! The STRONG one!", "It's the drink they gave us back there, the strong one.", "It's the mystery drink. It's woken something up in you.") },
        { by: 'a', say: "I can hear colours. And I can run." },
        { by: 'b', say: "Then run! Run while you can hear colours!" },
        { beat: '{a} runs the next stretch at a speed {b} has never seen, talking the whole way.' },
        { by: 'b', say: "I need to find out what was in that drink." },
      ] },
      { id: 'bg.dh2', turns: [
        { by: 'b', say: "You're walking really fast all of a sudden." },
        { by: 'a', ...V("That thing the locals gave us to eat. I feel like I've been plugged in.", "That thing they gave us. I feel plugged in.", "That snack. I'm plugged in.", "That thing the LOCALS gave us! I feel like I've been PLUGGED IN!", "It's that thing the locals gave us to eat. I feel like I've been plugged in.", "The local snack. It's turned me into a small engine.") },
        { by: 'b', say: "So the food that scared us is now helping us?" },
        { by: 'a', say: "It's paying us back. For what it did to us." },
        { beat: 'They pass two teams on the next stretch, {a} leading the way, humming.' },
        { by: 'b', say: "I take back everything I said about that food." },
      ] },
    ],
  },
};
