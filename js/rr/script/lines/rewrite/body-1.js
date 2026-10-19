// The body, part one, rewritten to the standard: knocks and twists, a food that disagrees, running out of energy.
// Kept light and off-camera, the way the show plays it. a is the one it happens to, b the partner.
import { V } from '../places/_kit.js';

const keys = (kind, endings) => [...endings.map(e => `${kind}.${e}`), `${kind}.any`];

export default {
  retire: [...keys('injury', ['minor', 'carried', 'serious']), ...keys('illness', ['pushes-through', 'blind-from-spice']),
    ...keys('exhaustion', ['collapse', 'second-wind'])],
  pools: {
    'injury.minor': [
      { id: 'bd.im1', turns: [
        { beat: '{a} catches a foot on something and goes down on one knee.' },
        { by: 'b', ...V("Are you okay? Talk to me. Are you okay?", "Are you okay?", "Okay? Talk to me.", "Are you OKAY? Talk to me! Are you OKAY?", "Are you okay? Talk to me, are you okay?", "Are you okay? Say something. Anything.") },
        { by: 'a', say: "I'm fine. It's just a scrape. It looks worse than it is." },
        { by: 'b', say: "Let me see it." },
        { by: 'a', say: "It's a scrape, {b}. People get scrapes." },
        { beat: 'A medic puts a plaster on it. Ten minutes later, they\'re moving again.' },
      ] },
      { id: 'bd.im2', turns: [
        { by: 'a', say: "Ow. Ow. I think I twisted my ankle a little bit." },
        { by: 'b', ...V("A little bit? Can you walk on it?", "Can you walk on it?", "Walk on it?", "A LITTLE bit? Can you WALK on it?", "A little bit? Can you still walk on it?", "A little bit? How little? Can it still be an ankle?") },
        { by: 'a', say: "I can walk on it. Slowly." },
        { by: 'b', say: "Then lean on me. We'll go slowly together." },
        { beat: 'They limp on, {a}\'s arm around {b}\'s shoulders.' },
        { by: 'a', say: "This is very cosy." },
        { by: 'b', say: "It's very slow." },
      ] },
    ],
    'injury.carried': [
      { id: 'bd.ic1', turns: [
        { by: 'a', say: "I can't put any weight on it. I'm sorry. I just can't." },
        { by: 'b', ...V("Then get on my back. Come on, up you get.", "Then get on my back.", "On my back. Up.", "Then get on my BACK! Come ON, up you GET!", "Then get on my back. Come on, up you get.", "Then climb aboard. I'm a bus now.") },
        { by: 'a', say: "You can't carry me all the way there." },
        { by: 'b', say: "Watch me." },
        { beat: '{b} carries {a} the rest of the way, red in the face, refusing to stop.' },
        { by: 'a', say: "I'll never forget this. Never." },
      ] },
      { id: 'bd.ic2', turns: [
        { by: 'b', say: "How far is it?" },
        { by: 'a', ...V("Half a mile. Put me down, I'll hop.", "Half a mile. I'll hop.", "Half a mile. I'll hop it.", "HALF a MILE! Put me DOWN, I'll HOP!", "It's about half a mile. Put me down, I can hop.", "Half a mile. I'll hop. Like a determined rabbit.") },
        { by: 'b', say: "You're not hopping half a mile." },
        { by: 'a', say: "Then you'll be carrying me half a mile." },
        { by: 'b', say: "Then I'll carry you half a mile." },
        { beat: 'It takes fifteen minutes, three rests and a lot of complaining from both of them.' },
      ] },
    ],
    'injury.serious': [
      { id: 'bd.is1', turns: [
        { beat: '{a} goes down and doesn\'t get up straight away. A medic jogs over.' },
        { by: 'b', ...V("What's wrong? What did they say?", "What did they say?", "What's wrong?", "What's WRONG? What did they SAY?", "What's wrong? What did they say?", "What's the verdict? Tell me it's nothing.") },
        { by: 'a', say: "They want to take me to get it looked at properly." },
        { by: 'b', say: "Then go. Go and get it looked at." },
        { by: 'a', say: "We'll lose an hour. Maybe more." },
        { by: 'b', say: "I don't care about the hour. I care about you being okay." },
      ] },
      { id: 'bd.is2', turns: [
        { by: 'a', say: "I heard something go. I really don't think I can carry on like this." },
        { by: 'b', ...V("Then we stop. The race can wait. Let them look at it.", "Then we stop. Let them look.", "We stop. Let them look.", "Then we STOP! The race can WAIT! Let them LOOK at it!", "Then we stop for now. The race can wait. Let them look at it.", "Then we pause. The race isn't going anywhere. Well, it is, but still.") },
        { beat: 'The medics strap it up and give {a} a long talk about resting it.' },
        { by: 'a', say: "They said we can go on if I'm careful." },
        { by: 'b', say: "Then you're going to be the most careful person on this race." },
        { by: 'a', say: "I've never been careful in my life." },
      ] },
    ],
    'illness.pushes-through': [
      { id: 'bd.ip1', turns: [
        { by: 'b', say: "You've gone a funny colour." },
        { by: 'a', ...V("I'm fine. It was something I ate. I'll be fine in a minute.", "Something I ate. I'll be fine.", "Something I ate. Fine.", "I'm FINE! It was something I ATE! I'll be FINE in a MINUTE!", "I'm fine, it was just something I ate. I'll be okay in a minute.", "I'm fine. My stomach is lodging a complaint. I'm ignoring it.") },
        { by: 'b', say: "Do you need to stop?" },
        { by: 'a', say: "If I stop, I won't start again. Keep walking. Just keep walking." },
        { beat: '{a} keeps walking, one hand on {a.posAdj} stomach, jaw set.' },
        { by: 'b', say: "You're the toughest person I know. And the greenest." },
      ] },
      { id: 'bd.ip2', turns: [
        { by: 'a', say: "I feel awful. I feel really awful." },
        { by: 'b', ...V("Sit for one minute. One minute, and some water.", "One minute. And water.", "Sit. Water. One minute.", "Sit for ONE minute! ONE minute, and some WATER!", "Sit down for one minute, and have some water.", "Sit. One minute. Water. Doctor's orders. I'm the doctor.") },
        { by: 'a', say: "We don't have a minute." },
        { by: 'b', say: "We have a minute. We don't have you passing out in a cab." },
        { beat: '{a} sits for a minute, drinks the water, and gets back up looking slightly less grey.' },
        { by: 'a', say: "Okay. I can do this. I can do this slowly." },
      ] },
    ],
    'illness.blind-from-spice': [
      { id: 'bd.ib1', turns: [
        { by: 'a', ...V("My eyes! I touched my eyes! Why did I touch my eyes?", "I touched my eyes. Why?", "My eyes. Why did I touch them?", "My EYES! I TOUCHED my EYES! WHY did I touch my EYES?", "My eyes! I touched my eyes after the peppers, why did I do that?", "My eyes! I rubbed pepper into them! I've betrayed my own face!") },
        { by: 'b', say: "Don't touch them again! Water! Somebody get water!" },
        { by: 'a', say: "I can't see anything. Everything's blurry and on fire." },
        { beat: 'It takes three bottles of water and fifteen minutes before {a} can see properly again.' },
        { by: 'b', say: "How many fingers am I holding up?" },
        { by: 'a', say: "Enough. Put them down." },
      ] },
      { id: 'bd.ib2', turns: [
        { by: 'b', say: "Why are you crying? Are you okay?" },
        { by: 'a', ...V("It's the chilli. I'm not crying. The chilli is crying through me.", "It's the chilli. Not crying.", "Chilli. Not crying.", "It's the CHILLI! I'm NOT crying! The CHILLI is crying THROUGH me!", "It's the chilli. I'm not crying, it's the chilli.", "I'm not crying. The pepper is weeping. Through my face.") },
        { by: 'b', say: "Here. Milk. They said milk helps." },
        { by: 'a', say: "Where did you get milk?" },
        { by: 'b', say: "A very kind lady with a cow. Don't ask. Drink." },
        { beat: '{a} drinks the milk and slowly stops looking like {a.sub}\'s been told terrible news.' },
      ] },
    ],
    'exhaustion.collapse': [
      { id: 'bd.ec1', turns: [
        { beat: '{a} sits down on the side of the road and doesn\'t get up.' },
        { by: 'b', ...V("Come on. We've got to keep going. Come on.", "Come on. Keep going.", "Up. Come on.", "Come ON! We've GOT to keep GOING! Come ON!", "Come on, we've got to keep going. Please.", "Rise up, the road is waiting for us!") },
        { by: 'a', say: "Five minutes. I just need five minutes. My legs aren't listening." },
        { by: 'b', say: "We don't have five minutes." },
        { by: 'a', say: "Then we'll have to borrow some." },
        { beat: '{b} sits down next to {a}. They take the five minutes. Then ten. Then they get going.' },
      ] },
      { id: 'bd.ec2', turns: [
        { by: 'a', say: "I can't. I've got nothing left. Nothing." },
        { by: 'b', ...V("You've got something. You always find something.", "You always find something.", "You'll find something.", "You've GOT something! You ALWAYS find something!", "You've got something left. You always find something.", "You've got something. Dig. There's always a bit at the bottom.") },
        { by: 'a', say: "Not this time. My legs have gone." },
        { by: 'b', say: "Then rest, eat this, and we'll go in twenty minutes." },
        { beat: '{a} eats the last cereal bar slowly, lying flat on the grass, looking at the sky.' },
        { by: 'a', say: "Twenty minutes. Then I'll be a person again." },
      ] },
    ],
    'exhaustion.second-wind': [
      { id: 'bd.es1', turns: [
        { by: 'b', say: "You look like you're about to fall over." },
        { by: 'a', ...V("I was. And then I saw that team behind us, and I'm not falling over for them.", "I was. Then I saw that team behind us.", "I was. Then I saw who's behind us.", "I WAS! And then I SAW that team behind us, and I'm NOT falling over for THEM!", "I was. Then I saw that team behind us, and I'm not falling over for them.", "I was. Then spite arrived. Spite is a great fuel.") },
        { by: 'b', say: "Spite?" },
        { by: 'a', say: "Pure spite. Let's go." },
        { beat: '{a} sets off at a run, and {b} has to sprint to keep up.' },
        { by: 'b', say: "Where was this an hour ago?" },
      ] },
      { id: 'bd.es2', turns: [
        { by: 'a', say: "Okay. Okay. I've just decided I'm not tired anymore." },
        { by: 'b', ...V("You can't just decide that.", "You can't decide that.", "That's not how it works.", "You CAN'T just DECIDE that!", "You can't just decide that you're not tired.", "That's not how bodies work. Bodies don't take orders.") },
        { by: 'a', say: "Watch me. I'm deciding. I'm full of energy. I'm a racehorse." },
        { by: 'b', say: "You're a very tired racehorse." },
        { by: 'a', say: "A racehorse who wants a million dollars. Come on!" },
        { beat: 'Against every law of nature, {a} picks up the pace and keeps it.' },
      ] },
    ],
  },
};
