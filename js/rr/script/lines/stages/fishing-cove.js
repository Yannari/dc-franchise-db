// Fishing Cove's challenge, stage by stage (js/rr/places/fishing-cove.js `stages`; director.js stageBeats).
//   the welcome rite  the-shack -> the-glass -> the-words -> kiss-the-cod -> honorary-locals   (All-In: both, every step)
// Spitting out the drink, a wrong word or pulling away from the fish means the rite again from the start. The old
// fisherman is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const T = 'welcome-rite';

export default {
  'task-stage.ok': [
    { id: 'fc.st.sh1', when: at(T, 'the-shack'), turns: [
      beat('Inside the little red shack, an old fisherman sits at a table with a bottle, two glasses and a very large, very dead cod.'),
      by('b', "Why is there a fish on the table?"),
      by('a', "I think we're about to find out."),
    ] },
    { id: 'fc.st.sh2', when: at(T, 'the-shack'), turns: [
      by('a', "Hello. We're here to be welcomed."),
      beat('The fisherman looks them up and down, grunts, and pours two glasses of something clear.'),
      by('b', "That doesn't look like water."),
    ] },
    { id: 'fc.st.gl1', when: at(T, 'the-glass'), turns: [
      beat('They lift their glasses, look at each other, and drink. It tastes exactly like vinegar.'),
      by('b', "Oh, that's horrible. That's so horrible."),
      by('a', "Don't spit. Swallow. Swallow it."),
    ] },
    { id: 'fc.st.gl2', when: at(T, 'the-glass'), turns: [
      by('a', "All of it. In one go."),
      beat('They both knock it back, shudder from head to toe, and put the glasses down empty.'),
      by('b', "My whole face is inside out."),
    ] },
    { id: 'fc.st.wd1', when: at(T, 'the-words'), turns: [
      beat('The fisherman leans forward and says a long sentence in the thick local dialect. It sounds like gravel in a bucket.'),
      by('a', "Could you say that one more time? Slowly?"),
      beat('The fisherman says it again, exactly as fast.'),
    ] },
    { id: 'fc.st.wd2', when: at(T, 'the-words'), turns: [
      by('b', "I think it was \"Long may your big jib draw.\""),
      by('a', "Long may your big jib draw."),
      beat('The fisherman nods, very slightly. That seems to be right.'),
    ] },
    { id: 'fc.st.kc1', when: at(T, 'kiss-the-cod'), turns: [
      beat('The fisherman picks up the cod and holds it out, lips first.'),
      by('b', "Oh no. Oh no, no, no."),
      by('a', "On three. Together. One, two..."),
      beat('They both kiss the cod. It is cold and wet and slimy.'),
    ] },
    { id: 'fc.st.kc2', when: at(T, 'kiss-the-cod'), turns: [
      by('a', "It's just a fish. It's just a quick kiss."),
      beat('{a} closes {a.posAdj} eyes and kisses the cod right on the mouth, and {b} does the same straight after.'),
      by('b', "I can still feel it. Why can I still feel it?"),
    ] },
    { id: 'fc.st.hl1', when: at(T, 'honorary-locals'), turns: [
      beat('The fisherman stands up, shakes their hands, and declares them honorary locals.'),
      by('b', "We're locals! We live here now!"),
      by('a', "We do not live here. Take the tip. Run."),
    ] },
    { id: 'fc.st.hl2', when: at(T, 'honorary-locals'), turns: [
      by('a', "That's the strangest welcome I've ever had."),
      by('b', "I'm going to taste that fish for a week."),
      beat('They run out of the shack and down the beach.'),
    ] },
  ],

  'task-stage.fail': [
    { id: 'fc.sf.gl1', when: at(T, 'the-glass'), turns: [
      beat('{b} takes one sip and spits it straight back into the glass.'),
      by('b', "I'm sorry! It's vinegar! It's actual vinegar!"),
      beat('The fisherman sighs and pours two fresh glasses. From the start.'),
    ] },
    { id: 'fc.sf.gl2', when: at(T, 'the-glass'), turns: [
      by('a', "I can do half. I can do half of it."),
      by('b', "It has to be all of it."),
      beat('{a} can\'t do all of it. The fisherman refills both glasses.'),
    ] },
    { id: 'fc.sf.wd1', when: at(T, 'the-words'), turns: [
      by('a', "Long... may your... big... fish... draw?"),
      beat('The fisherman shakes their head slowly and points back at the glasses. From the start.'),
      by('b', "Not fish. It wasn't fish."),
    ] },
    { id: 'fc.sf.wd2', when: at(T, 'the-words'), turns: [
      beat('{b} repeats the sentence, but with an accent from completely the wrong country.'),
      by('a', "Why do you sound like a pirate?"),
      beat('The fisherman is not impressed. Back to the vinegar.'),
    ] },
    { id: 'fc.sf.kc1', when: at(T, 'kiss-the-cod'), turns: [
      beat('{b} leans in to kiss the cod, gets a smell of it, and pulls away at the very last second.'),
      by('b', "I can't! It's looking at me!"),
      by('a', "It's dead! It can't look at anything!"),
    ] },
    { id: 'fc.sf.kc2', when: at(T, 'kiss-the-cod'), turns: [
      by('a', "Does a kiss on the cheek count?"),
      beat('It does not. The fisherman pours the vinegar again.'),
      by('b', "From the start? We have to drink that again?"),
    ] },
  ],
};
