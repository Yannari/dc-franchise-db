// Rock North's own lines (js/rr/places/rock-north.js), 1:1 with the real leg ("I Love Ridonc & Roll"), in our own words:
//   the sauna       ten minutes, highest heat, coats on; makeup melting, a bucket of somebody else's sweat, a partner
//                   who steps out at minute nine and resets the clock.
//   the river       straight from the heat into the half-frozen river, floe to floe; a partner rides across on the
//                   other.
//   the air guitar  Botch or Watch on a real stage for a real crowd, until the appeal meter fills: stage fright, boos,
//                   then the moment it clicks.
// Gated on place / taskId. a does the Botch, b watches.
import { V, mergePools } from './_kit.js';

const P = { place: 'rock-north' };
const SA = { taskId: 'sauna' };
const IR = { taskId: 'ice-river' };
const AG = { taskId: 'air-guitar' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'rn.op1', when: P, turns: [
      { beat: 'Don stands in the snow in an enormous fur hat, his breath steaming.' },
      don("Rock North! Home of the northern lights, the world's loudest rock fans, and the coldest wind I've ever felt."),
      don("Teams will sweat in a sauna, cross a frozen river and rock out for a crowd, in that order."),
      { beat: 'His teeth are chattering.' },
      don("Can we wrap this up? My face has stopped working."),
    ] },
    { id: 'rn.op2', when: P, turns: [
      don("Welcome to Rock North, home of saunas, frozen rivers, and heavy metal. Lots of heavy metal."),
      { beat: 'A guitar riff blasts from a speaker behind him. He jumps.' },
      don("That's going to happen a lot today. Racers, your first Don Box is at the spa. Bring a towel. Bring two."),
    ] },
  ],
  'don-opener.bored': [
    { id: 'rn.op3', when: P, turns: [
      { beat: 'Don sits in a hot tub in the snow, completely relaxed, wearing sunglasses.' },
      don("Rock North. The teams will be having a terrible time. I'm having a lovely time."),
      don("Their first stop is the sauna. Mine is this hot tub, all day."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'rn.ar1', when: P, turns: [
      { beat: 'Snow covers everything. The trees, the roofs, the cars, all of it white and silent.' },
      { by: 'a', say: "It's like a snow globe. It's so beautiful." },
      { by: 'b', say: "And so cold." },
      { by: 'a', say: "I don't care. Look at it." },
    ] },
    { id: 'rn.ar2', when: P, turns: [
      { by: 'b', say: "Everyone here is wearing black. And band shirts." },
      { by: 'a', say: "I think everybody here is in a band." },
      { by: 'b', say: "I love it already." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'rn.ad1', when: P, turns: [
      { beat: '{a} steps out of the airport and the cold hits like a slap.' },
      { by: 'a', say: "My eyelashes are freezing. Can eyelashes freeze?" },
      { by: 'b', say: "Pull your hat down. Come on." },
    ] },
    { id: 'rn.ad2', when: P, turns: [
      { by: 'b', say: "We packed for a desert. We have shorts. We only have shorts." },
      { by: 'a', say: "Then we run. Running keeps you warm." },
      { by: 'b', say: "Okay. Run fast, then." },
    ] },
  ],
};

// ── the sauna ──
const sauna = {
  'don-demo.gag': [
    { id: 'rn.sa-d1', when: SA, turns: [
      don("In this All-In, both partners sit in a sauna at the highest heat for ten full minutes. With your clothes on. All of them."),
      { beat: 'He steps into the sauna in his fur coat. Thirty seconds later he steps out, bright red, steaming.' },
      don("Ten minutes. I did thirty seconds. That's a lot, actually. Then the river. Good luck!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'rn.sa-d2', when: SA, turns: [
      don("Two teams to a sauna. Step out before the ten minutes are up, and the clock starts again from zero."),
      don("Then it's straight into the river. Hot, then cold. It's very good for your skin, I'm told."),
      { beat: 'He touches his own cheek and smiles.' },
    ] },
  ],
  'task-start.any': [
    { id: 'rn.sa-s1', when: SA, turns: [
      { beat: '{a} and {b} squeeze onto the wooden bench, coats zipped to the chin. The heat hits them at once.' },
      { by: 'a', say: "Ten minutes. We can do ten minutes." },
      { by: 'b', ...V("It's been ten seconds and I'm already melting.", "Ten seconds and I'm melting.", "Already melting.", "It's been TEN SECONDS and I'm ALREADY MELTING!", "It's been ten seconds and I'm already melting.", "Ten seconds in and I'm soup.") },
    ] },
    { id: 'rn.sa-s2', when: SA, turns: [
      { by: 'b', say: "Why do we have to keep our coats on? Who decided that?" },
      { by: 'a', say: "I don't know. It's the rule." },
      { by: 'b', say: "Then I hate the rule." },
    ] },
    { id: 'rn.sa-s3', when: SA, turns: [
      { beat: 'Another team is already on the other bench, staring at the wall in silence.' },
      { by: 'a', say: "Hi. How long have you been in here?" },
      { by: 'b', say: "Don't make them talk. Talking makes it hotter." },
    ] },
    { id: 'rn.sa-s4', when: SA, turns: [
      { by: 'a', say: "Think about something cold. Snow. Ice." },
      { by: 'b', say: "It's not working." },
      { by: 'a', say: "Just breathe. Slowly. It's only ten minutes." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn.sa-f1', when: SA, turns: [
      { beat: '{a} and {b} sit perfectly still, eyes closed, breathing slowly, for the full ten minutes.' },
      { by: 'a', say: "I just closed my eyes and thought about snow." },
      { by: 'b', say: "Me too. It worked." },
    ] },
    { id: 'rn.sa-f2', when: SA, turns: [
      { by: 'b', ...V("Is that the bell? Is it over? Tell me it's over.", "Is it over?", "Over?", "Is that the BELL? Is it OVER? Tell me it's OVER!", "Is that the bell? Is it over? Please tell me it's over.", "The bell, which means freedom, it's over!") },
      { by: 'a', say: "It's over! Run! The river!" },
      { beat: 'They burst out of the sauna in a cloud of steam.' },
    ] },
    { id: 'rn.sa-f3', when: SA, turns: [
      { by: 'a', say: "This isn't that bad. It's like summer back home." },
      { by: 'b', say: "Where you're from is crazy." },
      { by: 'a', say: "We're used to it. Keep going." },
    ] },
    { id: 'rn.sa-f4', when: SA, turns: [
      { beat: '{a} and {b} play a word game the whole time to keep their minds off the heat.' },
      { by: 'b', say: "Something you'd find in a freezer. Go." },
      { by: 'a', say: "Ice cream. Wait, that's the bell! Ten minutes! We didn't even notice!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn.sa-a1', when: SA, turns: [
      { beat: 'Back on the bench for a second try, {b} sits right next to the door.' },
      { by: 'a', say: "Don't sit by the door. You'll just want to leave." },
      { by: 'b', say: "I'm not going to leave. I promise." },
    ] },
    { id: 'rn.sa-a2', when: SA, turns: [
      { by: 'b', say: "Talk to me. Distract me. Say anything." },
      { by: 'a', ...V("Okay. Tell me every flavour of ice cream you know.", "Every ice cream flavour you know.", "Ice cream flavours. Go.", "OKAY! Tell me EVERY flavour of ICE CREAM you know!", "Okay. Tell me every flavour of ice cream you know.", "Name every frozen dessert in the world.") },
      { by: 'b', say: "Vanilla. Chocolate. Strawberry. Mint. Is it ten minutes yet?" },
      { by: 'a', say: "Keep going. Name more." },
    ] },
    { id: 'rn.sa-a3', when: SA, turns: [
      { beat: 'This time {a} lies flat on the lowest bench, where it\'s a few degrees cooler.' },
      { by: 'a', say: "Heat rises. It's cooler down here." },
      { by: 'b', say: "Why didn't you say that the first time?" },
    ] },
    { id: 'rn.sa-a4', when: SA, turns: [
      { by: 'b', say: "Unzip your coat. It has to stay on, but it doesn't have to be zipped." },
      { by: 'a', say: "Are you sure that's allowed?" },
      { by: 'b', say: "Nobody said it isn't. Do it." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rn.sa-t1', when: SA, turns: [
      { beat: '{a} grabs the bucket of water from the corner and tips it over {a.posAdj} head.' },
      { by: 'a', say: "Oh, that's better. That's so much better." },
      { by: 'b', say: "That's for the stones. You'll get us in trouble." },
    ] },
    { id: 'rn.sa-t2', when: SA, turns: [
      { by: 'b', say: "I can't see. My sweat's gone into my eyes." },
      { by: 'a', ...V("Then keep them shut. Five more minutes. Shut your eyes.", "Shut your eyes. Five more.", "Eyes shut. Five minutes.", "Then KEEP them SHUT! FIVE more minutes!", "Then just keep them shut. Five more minutes.", "Close them. You don't need eyes to sit.") },
      { by: 'b', say: "Okay. Eyes shut. I'm sitting with my eyes shut." },
    ] },
    { id: 'rn.sa-t3', when: SA, turns: [
      { beat: 'The makeup is running down {b}\'s face in long dark streaks.' },
      { by: 'a', say: "Your face is melting." },
      { by: 'b', say: "It's just my makeup. I don't care." },
    ] },
  ],
  'task-done.any': [
    { id: 'rn.sa-dn1', when: SA, turns: [
      { beat: 'The timer rings. {a} and {b} stagger out into the snow, steam rising off their coats.' },
      { by: 'b', say: "Snow! Oh, that feels so good!" },
      { by: 'a', say: "The river. Don't stop. The river's next." },
    ] },
    { id: 'rn.sa-dn2', when: SA, turns: [
      { by: 'a', say: "Ten minutes. We did it. We survived the sauna." },
      { by: 'b', say: "And now we jump in a frozen river." },
      { by: 'a', say: "One thing at a time. Give me a second." },
    ] },
    { id: 'rn.sa-dn3', when: SA, turns: [
      { beat: '{a} and {b} roll in the snow outside the sauna, laughing.' },
      { by: 'b', say: "My whole body is tingling." },
      { by: 'a', say: "Mine too. Up! The river!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rn.sa-x1', when: SA, turns: [
      { beat: 'At nine minutes and forty seconds, {b} bolts for the door.' },
      { by: 'a', say: "No! Twenty seconds! There were twenty seconds left!" },
      { by: 'b', say: "I couldn't! I couldn't do twenty more seconds!" },
    ] },
    { id: 'rn.sa-x2', when: SA, turns: [
      { by: 'a', say: "I need air. I need a breath of air. One breath." },
      { beat: '{a} opens the door for one breath of air. The clock resets.' },
      { by: 'b', say: "Back to zero. We have to start again." },
    ] },
    { id: 'rn.sa-x3', when: SA, turns: [
      { beat: '{b} takes off {b.posAdj} coat without thinking. A crew member taps on the window.' },
      { by: 'b', say: "Oh no. Clothes on. I forgot. Clothes on." },
      { by: 'a', say: "Back to zero. Put the coat back on." },
    ] },
  ],
};

// ── the frozen river ──
const river = {
  'don-demo.gag': [
    { id: 'rn.ir-d1', when: IR, turns: [
      don("Straight from the sauna, teams must cross this half-frozen river to the Don Box on the far bank."),
      { beat: 'He steps onto an ice floe to demonstrate. It tips, and he windmills his arms, and steps back onto the bank.' },
      don("Floe to floe. Carefully. Very, very carefully. The water is just above freezing. I've been told. I didn't check."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'rn.ir-d2', when: IR, turns: [
      don("Hop the ice, or swim the gaps. Fall in, and you climb out on the near side and start again."),
      don("Both partners on the far bank, and the tip is yours."),
      { beat: 'A chunk of ice floats slowly past behind him.' },
    ] },
  ],
  'task-start.any': [
    { id: 'rn.ir-s1', when: IR, turns: [
      { beat: '{a} and {b} run straight from the sauna to the river bank, still steaming.' },
      { by: 'a', say: "Hot, then freezing. This is going to hurt." },
      { by: 'b', say: "Just go. Don't think about it." },
    ] },
    { id: 'rn.ir-s2', when: IR, turns: [
      { by: 'b', say: "Which floe first? They're all moving." },
      { by: 'a', say: "The big one. Always the big one. Big ones don't tip." },
      { by: 'b', say: "You don't know that." },
    ] },
    { id: 'rn.ir-s3', when: IR, turns: [
      { beat: '{a} dips a toe in the water and yanks it straight back out.' },
      { by: 'a', say: "Nope. Not swimming. We're hopping. We're definitely hopping." },
      { by: 'b', say: "Hopping it is." },
    ] },
    { id: 'rn.ir-s4', when: IR, turns: [
      { by: 'a', say: "Hold my hand. If one of us goes in, we both go in." },
      { by: 'b', say: "That's a terrible plan." },
      { by: 'a', say: "Fine. Then don't let go, and don't go in." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn.ir-f1', when: IR, turns: [
      { beat: '{a} and {b} hop from floe to floe, arms out for balance, without one slip.' },
      { by: 'b', say: "We did it! Dry! We're completely dry!" },
      { by: 'a', say: "Freezing, but dry." },
    ] },
    { id: 'rn.ir-f2', when: IR, turns: [
      { by: 'a', say: "It's like crossing a stream on stones." },
      { beat: 'They make it across in a dozen quick hops.' },
      { by: 'b', say: "That was actually fun." },
    ] },
    { id: 'rn.ir-f3', when: IR, turns: [
      { beat: '{b} climbs onto {a}\'s back, and {a} wades straight across through the shallow part.' },
      { by: 'b', say: "Is it cold? It looks cold." },
      { by: 'a', say: "Don't talk to me. My legs can't feel anything." },
    ] },
    { id: 'rn.ir-f4', when: IR, turns: [
      { by: 'b', say: "Follow the path the ice is making. See? It's like a road." },
      { beat: 'They follow the line of floes, and it carries them right to the far bank.' },
      { by: 'a', say: "That was so smart. How did you see that?" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn.ir-a1', when: IR, turns: [
      { beat: '{a} climbs out of the river, blue and shaking, and starts again.' },
      { by: 'a', say: "Th-that one t-tipped. I d-didn't see it." },
      { by: 'b', say: "This time, step where I step. Exactly where I step." },
    ] },
    { id: 'rn.ir-a2', when: IR, turns: [
      { by: 'b', say: "We're already wet. We've been in once. We might as well swim it." },
      { by: 'a', say: "You're right. We can't get any wetter." },
      { beat: 'They swim the last gap, gasping, and haul themselves out on the far bank.' },
    ] },
    { id: 'rn.ir-a3', when: IR, turns: [
      { beat: 'This time {a} tests every floe with one foot before trusting it.' },
      { by: 'b', say: "That's very slow." },
      { by: 'a', say: "I'm not going in again." },
    ] },
    { id: 'rn.ir-a4', when: IR, turns: [
      { by: 'a', say: "Small jumps. The big jumps tip them." },
      { by: 'b', say: "Small jumps. Okay." },
      { beat: 'Small jumps get them all the way across.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rn.ir-t1', when: IR, turns: [
      { beat: '{b} is standing on a floe in the middle of the river, which is slowly turning in circles.' },
      { by: 'b', say: "I'm spinning! I'm spinning and I can't stop!" },
      { by: 'a', say: "Jump when you're facing me! Wait for it! Now!" },
    ] },
    { id: 'rn.ir-t2', when: IR, turns: [
      { by: 'a', ...V("I can't feel my feet. I genuinely can't feel my feet.", "Can't feel my feet.", "Feet gone.", "I CAN'T FEEL my FEET! I GENUINELY can't feel my FEET!", "I honestly can't feel my feet anymore.", "My feet have frozen and left me.") },
      { by: 'b', say: "Don't think about them. Just jump." },
      { by: 'a', say: "Okay. Okay. Here I go." },
    ] },
    { id: 'rn.ir-t3', when: IR, turns: [
      { beat: 'Other teams are climbing out on the far bank. {a} and {b} are still on the first floe.' },
      { by: 'b', say: "Everyone's across but us." },
      { by: 'a', say: "Then let's go. Just us." },
    ] },
  ],
  'task-done.any': [
    { id: 'rn.ir-dn1', when: IR, turns: [
      { beat: '{a} and {b} reach the far bank and grab the tip from the Don Box with frozen fingers.' },
      { by: 'a', say: "C-cab downtown. To a c-concert." },
      { by: 'b', ...V("A warm concert, I hope. Please let it be warm.", "A warm one, I hope.", "Warm, please.", "A WARM concert, I hope! PLEASE let it be WARM!", "I hope it's a warm concert. Please let it be warm.", "A concert with heaters. Please. Heaters.") },
    ] },
    { id: 'rn.ir-dn2', when: IR, turns: [
      { by: 'b', say: "I'm never complaining about being hot again." },
      { by: 'a', say: "I'm never complaining about anything again." },
      { by: 'b', say: "We'll see." },
    ] },
    { id: 'rn.ir-dn3', when: IR, turns: [
      { beat: 'A crew member wraps {a} and {b} in silver blankets.' },
      { by: 'a', say: "Oh, that's so much better." },
      { by: 'b', say: "I can feel my hands again." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rn.ir-x1', when: IR, turns: [
      { beat: 'The floe tips, and {a} goes straight into the river with a shout.' },
      { by: 'a', say: "C-c-cold! It's so c-cold!" },
      { by: 'b', say: "Get out! Get out and start again! Quickly!" },
    ] },
    { id: 'rn.ir-x2', when: IR, turns: [
      { beat: '{b} jumps for the next floe and lands short. Splash.' },
      { by: 'b', ...V("That one moved! It moved away from me!", "It moved away!", "It moved!", "That one MOVED! It moved AWAY from me!", "That floe moved away from me, I swear!", "The ice fled from me!") },
      { by: 'a', say: "They all move! Watch them first!" },
    ] },
    { id: 'rn.ir-x3', when: IR, turns: [
      { beat: 'Two teams try to stand on the same floe at once, and all of them end up in the river.' },
      { by: 'a', say: "Why did you get on our floe?" },
      { by: 'b', say: "There was nowhere else to go!" },
    ] },
  ],
};

// ── the air guitar (Botch or Watch) ──
const airGuitar = {
  'don-demo.gag': [
    { id: 'rn.ag-d1', when: AG, turns: [
      don("In this Botch or Watch, whoever didn't do the last one plays air guitar for this crowd of rock fans. Fill the appeal meter, and you're done."),
      { beat: 'He strikes a rock pose and plays a few notes of air guitar. The meter doesn\'t move. Somebody boos.' },
      don("That's... they're just warming up. It's a tough crowd. It's a very tough crowd."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'rn.ag-d2', when: AG, turns: [
      don("Rock out. The crowd decides. Cheers fill the meter, boos empty it. Fill it to the top and head backstage to the Chill Zone."),
      don("Don't fill it, and you wait for the next song and try again."),
      { beat: 'Behind him, the crowd starts to chant.' },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'rn.ag-w1', when: AG, turns: [
      { by: 'b', say: "It's performing. That's you. You love being in front of people." },
      { by: 'a', say: "Singing, maybe. Not guitar." },
      { by: 'b', say: "It's pretend guitar. You'll be fine." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'rn.ag-w2', when: AG, turns: [
      { by: 'a', say: "I've been waiting my whole life for this. Give me the stage." },
      { by: 'b', say: "Have you ever played air guitar?" },
      { by: 'a', say: "All the time. In my bedroom. In the car. I'm ready." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'rn.ag-w3', when: AG, turns: [
      { by: 'a', say: "You're doing it. I don't perform." },
      { by: 'b', ...V("I don't perform either! I've never performed!", "I've never performed!", "I don't perform!", "I DON'T perform either! I've NEVER performed!", "I don't perform either, I've never performed in my life!", "I'm not a performer! I'm an audience!") },
      { by: 'a', say: "Then today's your first gig. Go." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'rn.ag-w4', when: AG, turns: [
      { by: 'b', say: "'Who wants to be a rock star?' Is it singing? Please don't let it be singing." },
      { by: 'a', say: "It's a concert. It's going to be something on a stage." },
      { by: 'b', say: "Then it's you. You love a stage." },
    ] },
  ],
  'task-start.any': [
    { id: 'rn.ag-s1', when: AG, turns: [
      { beat: '{a} walks out onto the stage. The crowd is huge, and loud, and not smiling.' },
      { by: 'a', say: "Hello, everybody." },
      { by: 'b', say: "Don't talk! Just play!" },
    ] },
    { id: 'rn.ag-s2', when: AG, turns: [
      { beat: 'The music starts, very loud, and {a} freezes with both hands in the air.' },
      { by: 'b', say: "Play! Play something! Anything!" },
      { by: 'a', say: "I don't know where the guitar is!" },
    ] },
    { id: 'rn.ag-s3', when: AG, turns: [
      { by: 'a', say: "What do I do? Do I jump? Do I kneel?" },
      { by: 'b', say: "All of it! Just do everything!" },
      { by: 'a', say: "Okay. Okay, everything." },
    ] },
    { id: 'rn.ag-s4', when: AG, turns: [
      { beat: '{a} picks up an invisible guitar, slings an invisible strap over {a.posAdj} shoulder and nods at the drummer.' },
      { by: 'b', say: "Yes! That's it! Look at you!" },
      { by: 'a', say: "I have no idea what I'm doing." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn.ag-f1', when: AG, turns: [
      { beat: '{a} slides across the stage on {a.posAdj} knees, head thrown back, and the crowd goes wild.' },
      { by: 'b', ...V("The meter! Look at the meter! It's full!", "The meter's full!", "Full meter!", "The METER! LOOK at the METER! It's FULL!", "Look at the meter! It's completely full!", "The meter overflows! They love you!") },
      { by: 'a', say: "I can't believe that worked!" },
    ] },
    { id: 'rn.ag-f2', when: AG, turns: [
      { by: 'b', say: "Where did that come from?" },
      { by: 'a', say: "I used to do it in my bedroom all the time." },
      { by: 'b', say: "I'm never making fun of you for that again." },
    ] },
    { id: 'rn.ag-f3', when: AG, turns: [
      { beat: '{a} jumps off the stage into the crowd, and the crowd catches {a.obj} and carries {a.obj} back.' },
      { by: 'a', say: "They caught me! They actually caught me!" },
      { by: 'b', say: "And the meter's full! Come on, backstage!" },
    ] },
    { id: 'rn.ag-f4', when: AG, turns: [
      { beat: '{a} plays one invisible note, and holds it, and holds it, and the whole crowd holds it too.' },
      { by: 'b', say: "That was amazing. They loved it." },
      { by: 'a', say: "I didn't even know what I was doing." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn.ag-a1', when: AG, turns: [
      { beat: 'The second song starts. This time {a} doesn\'t think, just plays.' },
      { by: 'b', say: "That's it! Don't think! Just play!" },
      { by: 'a', say: "I'm not thinking!" },
    ] },
    { id: 'rn.ag-a2', when: AG, turns: [
      { by: 'b', say: "Pull a face! Make a big face!" },
      { by: 'a', ...V("What face?", "What face?", "Which face?", "WHAT face?", "What face do you mean?", "Which face? I have several.") },
      { by: 'b', say: "Any face! Just make it big!" },
      { beat: '{a} screws up {a.posAdj} face and screams, and the meter shoots up.' },
    ] },
    { id: 'rn.ag-a3', when: AG, turns: [
      { beat: 'This time, {a} plays to one person in the front row: a big man in a leather jacket who hasn\'t smiled once.' },
      { by: 'a', say: "Okay. I'm playing for him." },
      { beat: 'The big man starts nodding. Then headbanging. The meter fills.' },
    ] },
    { id: 'rn.ag-a4', when: AG, turns: [
      { by: 'b', say: "Jump! Do the jump!" },
      { by: 'a', say: "I'll fall over!" },
      { by: 'b', say: "It doesn't matter! Just jump!" },
      { beat: '{a} jumps, falls over, and the crowd loves it.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rn.ag-t1', when: AG, turns: [
      { beat: '{a} is playing as hard as {a.sub} can, and the meter is barely moving.' },
      { by: 'a', say: "They hate me! They hate me so much!" },
      { by: 'b', say: "They don't hate you! They just don't love you yet!" },
    ] },
    { id: 'rn.ag-t2', when: AG, turns: [
      { beat: 'Somebody in the crowd shouts something. It doesn\'t sound like a compliment.' },
      { by: 'a', ...V("What did he say? What did he call me?", "What did he call me?", "What was that?", "What did he SAY? What did he CALL me?", "What did he just say? What did he call me?", "What insult was that? In what language?") },
      { by: 'b', say: "Don't listen! Play louder than him!" },
    ] },
    { id: 'rn.ag-t3', when: AG, turns: [
      { beat: '{a} stands frozen in the middle of the stage. The music plays on without {a.obj}.' },
      { by: 'b', say: "Breathe! Then play! Breathe and play!" },
      { by: 'a', say: "I can't! I don't know what to do!" },
    ] },
  ],
  'task-done.any': [
    { id: 'rn.ag-dn1', when: AG, turns: [
      { beat: 'The meter hits the top. Fireworks shoot up from the side of the stage.' },
      { by: 'a', say: "I did it! I actually did it!" },
      { by: 'b', ...V("Backstage! The Chill Zone's backstage!", "Backstage! Go!", "Backstage!", "BACKSTAGE! The CHILL ZONE'S backstage!", "Backstage, come on! The Chill Zone's backstage!", "To the backstage! Like real rock stars!") },
    ] },
    { id: 'rn.ag-dn2', when: AG, turns: [
      { by: 'b', say: "You were amazing. You were actually amazing." },
      { by: 'a', say: "I know. My heart is going so fast." },
      { by: 'b', say: "Come on. The Chill Zone." },
    ] },
    { id: 'rn.ag-dn3', when: AG, turns: [
      { beat: '{a} throws an invisible guitar pick into the crowd, and the front row screams.' },
      { by: 'b', say: "They loved you!" },
      { by: 'a', say: "That was the best thing I've ever done." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rn.ag-x1', when: AG, turns: [
      { beat: 'The song ends. The meter stops just short of the top. The crowd boos.' },
      { by: 'a', say: "So close! It was so close!" },
      { by: 'b', say: "Next song! You'll get it on the next song!" },
    ] },
    { id: 'rn.ag-x2', when: AG, turns: [
      { beat: '{a} trips over a speaker cable and falls flat on the stage. The meter drops to zero.' },
      { by: 'a', say: "No! I tripped!" },
      { by: 'b', say: "Get up! Keep playing!" },
    ] },
    { id: 'rn.ag-x3', when: AG, turns: [
      { beat: '{a} plays slow and gentle. The crowd boos.' },
      { by: 'b', say: "It's a rock concert! They want rock!" },
      { by: 'a', say: "Okay! Okay! Faster!" },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'rn.ag-v1', when: AG, turns: [
      { by: 'b', say: "That's my partner up there! That's my partner!" },
      { by: 'a', say: "Stop telling people! Just cheer!" },
      { by: 'b', say: "Sorry! Go on! You're doing great!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'rn.ag-v2', when: AG, turns: [
      { beat: '{b} watches from the side of the stage, hands over {b.posAdj} mouth.' },
      { by: 'b', say: "I can't watch. I can't watch. Is it going well?" },
      { by: 'a', say: "Open your eyes and find out!" },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'rn.ag-v3', when: AG, turns: [
      { beat: '{b} jumps up on stage and starts playing air drums behind {a}.' },
      { by: 'a', say: "You can't be up here! Only one of us plays!" },
      { beat: 'A stagehand walks {b} off the stage. Thirty minutes.' },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'rn.ag-v4', when: AG, turns: [
      { beat: '{b} stands perfectly still at the side of the stage, not wanting to put {a} off.' },
      { by: 'a', say: "Why are you so still? Cheer! The crowd copies you!" },
      { by: 'b', say: "Oh. Oh! Cheering!" },
    ] },
  ],
  'helped-botch.any': [
    { id: 'rn.ag-h1', when: AG, turns: [
      { beat: 'When the stagehand looks away, {b} turns the volume knob all the way up.' },
      { by: 'a', say: "Did you touch the sound desk?" },
      { by: 'b', say: "I didn't touch anything. Keep playing." },
    ] },
  ],
};

export default mergePools(place, sauna, river, airGuitar);
