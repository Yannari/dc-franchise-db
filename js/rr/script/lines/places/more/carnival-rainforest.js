// Carnival Rainforest, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/carnival-rainforest.js: at the ants, a's hand goes in the mitten
// and b watches; the gorge is the vines, the river below and a mountain of coconuts; the costume is a headpiece and a
// tailpiece paraded for a judge who wants it big.
import { V, mergePools } from '../_kit.js';

const AN = { taskId: 'ants' };
const GO = { taskId: 'gorge' };
const CO = { taskId: 'costume' };

const ants = {
  'task-start.any': [
    { id: 'cvr2.an-s1', when: AN, turns: [
      { beat: 'The local holds the mitten up to the light. It is moving. The whole mitten is moving.' },
      { by: 'a', say: "Why is it breathing? Mittens don't breathe." },
      { by: 'b', say: "That's the ants. All of it is ants." },
    ] },
    { id: 'cvr2.an-s2', when: AN, turns: [
      { by: 'a', say: "Should I take my watch off?" },
      { by: 'b', say: "Why would you take your watch off?" },
      { by: 'a', say: "So they can't live in it." },
      { beat: '{a} takes the watch off and hands it to {b}, very solemnly, like a will.' },
    ] },
    { id: 'cvr2.an-s3', when: AN, turns: [
      { by: 'b', say: "Fast in, grab, fast out. Don't feel around. Don't make friends." },
      { by: 'a', say: "I wasn't planning on making friends with the ants." },
      { by: 'b', say: "You make friends with everything. I've seen you with pigeons." },
    ] },
    { id: 'cvr2.an-s4', when: AN, turns: [
      { beat: '{a} rolls a sleeve up to the elbow, then rolls it back down, then up again.' },
      { by: 'b', say: "Up or down? Commit." },
      { by: 'a', ...V("Down. No, up. Sleeves don't stop ants anyway.", "Up. Sleeves won't help.", "Up.", "DOWN! No, UP! Sleeves don't STOP ants!", "Up, I think. A sleeve won't stop them anyway.", "Neither. The sleeve is not the ants' problem.") },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cvr2.an-f1', when: AN, turns: [
      { beat: '{a} goes in, grabs and comes out in one movement, the tip pinched between two fingers.' },
      { by: 'b', say: "That was a magic trick. Do it again." },
      { by: 'a', say: "Never. Not for any money in the world." },
    ] },
    { id: 'cvr2.an-f2', when: AN, turns: [
      { by: 'a', say: "Got it. And only three of them got me. I counted." },
      { by: 'b', say: "Three's good! Three's nearly none!" },
      { by: 'a', say: "Three bullet ants is three bullets. It's not nearly none." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cvr2.an-a1', when: AN, turns: [
      { by: 'b', say: "Go in palm up. Scoop it like a spoon." },
      { by: 'a', say: "A spoon. In a mitten of ants. Okay." },
      { beat: '{a} scoops. The tip comes up in {a.posAdj} palm, with a small crowd of ants on top of it.' },
      { by: 'a', say: "Spoon! Spoon worked! Get them off!" },
    ] },
    { id: 'cvr2.an-a2', when: AN, turns: [
      { beat: 'Third try. {a} closes {a.posAdj} eyes and sings one loud note the whole time {a.posAdj} hand is in.' },
      { by: 'b', say: "What is that? What are you singing?" },
      { beat: 'The note stops. The hand comes out holding the tip.' },
      { by: 'a', say: "Nothing. It's just a noise for being brave." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cvr2.an-t1', when: AN, turns: [
      { by: 'a', say: "My hand's on fire. Is it on fire? Look at it." },
      { by: 'b', say: "It's not on fire. It's just very red. And slightly bigger." },
      { by: 'a', say: "Slightly bigger is not what I wanted to hear." },
    ] },
    { id: 'cvr2.an-t2', when: AN, turns: [
      { beat: '{a} is crouched over the mitten, hand hovering an inch above it, not moving.' },
      { by: 'b', say: "They can't come out. They're not allowed out." },
      { by: 'a', say: "Has anyone told them that?" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cvr2.an-x1', when: AN, turns: [
      { beat: '{a} comes out holding a folded leaf, sure it is the tip, and unfolds it in front of everybody.' },
      { by: 'b', say: "That's a leaf." },
      { by: 'a', say: "It felt like paper! Everything feels like paper when you're being stung! Again!" },
    ] },
    { id: 'cvr2.an-x2', when: AN, turns: [
      { beat: '{a} gets the tip between two fingers. One sting later, the fingers open on their own.' },
      { by: 'a', say: "My hand let go! I didn't tell it to!" },
      { by: 'b', say: "Then tell it to go back in!" },
    ] },
  ],
  'task-done.any': [
    { id: 'cvr2.an-dn1', when: AN, turns: [
      { beat: '{a} plunges {a.posAdj} hand into the bucket of ice and makes a noise like a kettle.' },
      { by: 'b', say: "Better?" },
      { by: 'a', say: "Ask me in a week." },
    ] },
    { id: 'cvr2.an-dn2', when: AN, turns: [
      { by: 'b', say: "Next is a gorge. With vines. You'll need both hands." },
      { by: 'a', say: "I've got one hand and one balloon." },
      { by: 'b', say: "Swing with the balloon. Maybe it'll float." },
    ] },
    { id: 'cvr2.an-dn3', when: AN, turns: [
      { by: 'a', say: "Say thank you to the ant lady." },
      { by: 'b', say: "Why would I thank her?" },
      { by: 'a', say: "So she doesn't make us do it again." },
      { beat: '{b} thanks her. She smiles and gently shakes the mitten at the next team.' },
    ] },
  ],
};

const gorge = {
  'task-start.any': [
    { id: 'cvr2.go-s1', when: GO, turns: [
      { beat: '{b} picks a vine, hangs off it with both feet up, and bounces.' },
      { by: 'a', say: "Is it strong?" },
      { by: 'b', say: "It's held me for four seconds. That's long enough to cross a gorge, right?" },
    ] },
    { id: 'cvr2.go-s2', when: GO, turns: [
      { by: 'a', say: "Swing on the way out. Let go on the way up. Not on the way back." },
      { by: 'b', say: "How do I know which way is which?" },
      { by: 'a', say: "The way out is the way with the scary drop under it." },
    ] },
    { id: 'cvr2.go-s3', when: GO, turns: [
      { beat: 'Far below, a racer climbs out of the river, wrings out a sock and starts back up the cliff.' },
      { by: 'a', say: "That's the bad ending." },
      { by: 'b', say: "That's the wet ending. It's not the worst ending." },
    ] },
    { id: 'cvr2.go-s4', when: GO, turns: [
      { by: 'b', say: "Do the jungle yell. You have to do the yell." },
      { by: 'a', say: "Does the yell help?" },
      { by: 'b', say: "No. But you'll regret not doing it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cvr2.go-f1', when: GO, turns: [
      { beat: '{a} swings across, lands on the far side, and catches the vine on its way back so {b} can grab it.' },
      { by: 'b', say: "You caught it for me! That's so thoughtful!" },
      { by: 'a', say: "Swing now before I drop it!" },
    ] },
    { id: 'cvr2.go-f2', when: GO, turns: [
      { beat: '{b} picks up a coconut, knocks on it like a door, and holds it to {b.posAdj} ear.' },
      { by: 'b', say: "Something's in there. Something's knocking back." },
      { beat: '{a} cracks it on a rock. The tip slides out, rolled up and dry.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cvr2.go-a1', when: GO, turns: [
      { by: 'a', say: "I keep letting go too soon. So this time I don't let go at all until my feet touch something." },
      { beat: '{a} swings out, hangs on far longer than looks sensible, and is dragged feet-first onto the far bank.' },
      { by: 'b', say: "That was not graceful! But you're there!" },
    ] },
    { id: 'cvr2.go-a2', when: GO, turns: [
      { beat: 'Sixty coconuts in, {b} gives up shaking and starts weighing them in each hand instead.' },
      { by: 'b', say: "This one's lighter. Paper's lighter than milk." },
      { beat: 'It is lighter. Inside is the tip.' },
      { by: 'a', say: "You weighed a coconut! You're a scientist!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cvr2.go-t1', when: GO, turns: [
      { by: 'a', say: "Every coconut sounds the same. Slosh, slosh, slosh." },
      { by: 'b', say: "We're looking for the one that goes 'rustle'." },
      { by: 'a', say: "I've never heard a coconut rustle in my life." },
    ] },
    { id: 'cvr2.go-t2', when: GO, turns: [
      { beat: '{b} stands at the top of the climb for the third time, dripping, holding a vine and not swinging.' },
      { by: 'b', say: "The river's very nice. I've met it twice." },
      { by: 'a', say: "Don't meet it a third time! Swing harder!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cvr2.go-x1', when: GO, turns: [
      { beat: '{a} swings, lands on the far edge on tiptoe, wobbles, and windmills slowly backwards into the gorge.' },
      { by: 'b', say: "You were there! You were actually there!" },
      { by: 'a', say: "I know! I said hello to it! Climbing back up!" },
    ] },
    { id: 'cvr2.go-x2', when: GO, turns: [
      { beat: '{b} cracks a coconut on a rock. Coconut milk sprays straight into {a}\'s face.' },
      { by: 'a', say: "Not that one, then." },
      { by: 'b', say: "Not that one. Next one. Close your mouth this time." },
    ] },
  ],
  'task-done.any': [
    { id: 'cvr2.go-dn1', when: GO, turns: [
      { by: 'a', say: "Should we tell the others it's on this side?" },
      { by: 'b', say: "There's a thousand coconuts on this side. That's not a clue." },
      { by: 'a', say: "Fair. Let's just leave quietly." },
    ] },
    { id: 'cvr2.go-dn2', when: GO, turns: [
      { beat: '{a} and {b} jog down the trail, each holding half a coconut.' },
      { by: 'b', say: "Why have we still got these?" },
      { by: 'a', say: "Snacks. We earned the snacks." },
    ] },
    { id: 'cvr2.go-dn3', when: GO, turns: [
      { by: 'b', say: "Next tip says costumes. Feathers and sequins." },
      { by: 'a', say: "After vines and a river? That's a holiday." },
      { by: 'b', say: "You haven't seen me with a glue gun." },
    ] },
  ],
};

const costume = {
  'task-start.any': [
    { id: 'cvr2.co-s1', when: CO, turns: [
      { beat: '{a} tries to bend the wire frame for the headpiece. It springs out of {a.posAdj} hands and across the tent.' },
      { by: 'a', say: "The wire doesn't want to be a hat." },
      { by: 'b', say: "Nobody asked it. Bend it again." },
    ] },
    { id: 'cvr2.co-s2', when: CO, turns: [
      { by: 'b', say: "Colour plan. Pink, gold and more pink." },
      { by: 'a', say: "What about green? There's lots of green." },
      { by: 'b', say: "We're in a rainforest. Everything's green. We need to stand out from the trees." },
    ] },
    { id: 'cvr2.co-s3', when: CO, turns: [
      { beat: 'Outside the tent, the judge dances past, glances in at their empty table, and frowns.' },
      { by: 'a', say: "She frowned at nothing. She frowned at our nothing." },
      { by: 'b', say: "Then let's make something worth frowning at." },
    ] },
    { id: 'cvr2.co-s4', when: CO, turns: [
      { by: 'a', say: "Do I have to wear the tail? It goes on the back of your trousers." },
      { by: 'b', say: "You wanted to be in a parade when you were six. Here's your parade." },
      { by: 'a', say: "Six-year-old me didn't know about the tail." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cvr2.co-f1', when: CO, turns: [
      { beat: '{a} and {b} come out of the tent and do a spin at exactly the same time. The tail and the headpiece flare out together.' },
      { beat: 'The judge claps her hands over her mouth, then hands over the tip.' },
      { by: 'b', say: "We didn't even practise the spin!" },
    ] },
    { id: 'cvr2.co-f2', when: CO, turns: [
      { by: 'a', say: "Step, shimmy, turn. Step, shimmy, turn." },
      { beat: '{a}\'s headpiece sways a full foot each way, and nothing falls off. The judge shrieks and gives them the tip.' },
      { by: 'b', say: "First go! Carnival royalty!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cvr2.co-a1', when: CO, turns: [
      { by: 'b', say: "She keeps looking at our feet. We need something on our feet." },
      { beat: '{b} glues feathers round both their ankles. On the next parade, every step flutters, and the judge cheers.' },
      { by: 'a', say: "Feather ankles! Who knew!" },
    ] },
    { id: 'cvr2.co-a2', when: CO, turns: [
      { beat: 'Back in the tent, {a} tapes the headpiece frame to a belt, so it can\'t tip forward.' },
      { by: 'a', say: "It can't fall off if it's part of my trousers." },
      { beat: 'It doesn\'t fall off. {a} dances like a maniac, and the judge finally hands over the tip.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cvr2.co-t1', when: CO, turns: [
      { by: 'b', say: "Where's the glue? Who had the glue last?" },
      { by: 'a', say: "Me. It's... in my hair. All of it is in my hair." },
      { by: 'b', say: "Then lean over. I'll glue feathers to your head." },
    ] },
    { id: 'cvr2.co-t2', when: CO, turns: [
      { beat: 'Every time {a} turns, the tailpiece knocks something off the table: sequins, scissors, a whole tray of feathers.' },
      { by: 'a', say: "I can't turn round. If I turn round, it's a disaster." },
      { by: 'b', say: "Then walk backwards. Everywhere. For ever." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cvr2.co-x1', when: CO, turns: [
      { beat: '{a} and {b} parade out. A gust of wind lifts the tailpiece like a sail and pulls {a} sideways into a bush.' },
      { by: 'b', say: "It was going so well!" },
      { by: 'a', say: "The tail took me! Back to the tent! Heavier tail!" },
    ] },
    { id: 'cvr2.co-x2', when: CO, turns: [
      { beat: 'The judge watches them dance, then does the same dance back at them, but much, much bigger.' },
      { by: 'a', say: "Is she showing us how it's done?" },
      { by: 'b', say: "She's showing us we're not doing it. Bigger. Go again." },
    ] },
  ],
  'task-done.any': [
    { id: 'cvr2.co-dn1', when: CO, turns: [
      { by: 'b', say: "We have to take them off. You can't fly a hang glider in a headpiece." },
      { by: 'a', say: "Watch me." },
      { by: 'b', say: "No. I'm not watching you do that." },
    ] },
    { id: 'cvr2.co-dn2', when: CO, turns: [
      { beat: '{a} and {b} walk out with sequins stuck to their faces, catching the sun like disco balls.' },
      { by: 'a', say: "We're sparkling. Look, we're sparkling." },
      { by: 'b', say: "We're going to be sparkling at the Chill Zone too. That stuff never comes off." },
    ] },
    { id: 'cvr2.co-dn3', when: CO, turns: [
      { by: 'a', say: "She hugged me. The judge hugged me." },
      { by: 'b', say: "She hugged everybody who passed." },
      { by: 'a', say: "Mine was a longer hug. I could tell." },
    ] },
  ],
};

export default mergePools(ants, gorge, costume);
