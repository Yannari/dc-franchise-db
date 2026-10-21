// Red Sand Desert's challenges, stage by stage (js/rr/places/red-sand-desert.js `stages`; director.js stageBeats).
//   the spices  the-alley -> sniff -> the-kiosk -> pay-up                     (All-In: both pick; nobody checks the five)
//   the stew    the-chef -> first-spoon -> half-bowl -> last-drop -> empty-bowl  (Botch or Watch: a eats, b watches)
// A wrong spice is a fail at the stall where it was grabbed: the team never finds out there, the stew tells them later.
// The merchant and the chef are the place's own locals (their avatars stand there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the spice corner ──
    { id: 'rsd.st.al1', when: at('spices', 'the-alley'), turns: [
      beat('The spice corner is a narrow alley of stalls under striped awnings, and every stall is heaped with open baskets of coloured powder.'),
      by('b', "It smells like the inside of a curry."),
      by('a', "Yeah, fifty curries. And we need five of them."),
    ] },
    { id: 'rsd.st.al2', when: at('spices', 'the-alley'), turns: [
      by('a', "Cumin, cinnamon, paprika, saffron and ginger. Say it back to me."),
      by('b', "Cumin, cinnamon, paprika, saffron and... something."),
      by('a', "Ginger. It was the last one. You had one second to remember it."),
    ] },
    { id: 'rsd.st.al3', when: at('spices', 'the-alley'), turns: [
      beat('{a} walks into the alley, takes one deep breath of it, and sneezes so hard that a merchant three stalls away says bless you.'),
      by('b', "Are you okay?"),
      by('a', "I'm fine. I just can't smell anything now. Which isn't great."),
    ] },
    { id: 'rsd.st.sn1', when: at('spices', 'sniff'), turns: [
      beat('{b} holds a pinch of orange powder under {a}\'s nose.'),
      by('b', "Paprika or not paprika?"),
      by('a', "Kind of sweet? I'm going to say paprika. But I'm guessing."),
    ] },
    { id: 'rsd.st.sn2', when: at('spices', 'sniff'), turns: [
      by('a', "Cinnamon I know. It smells like Christmas."),
      beat('{a} finds a basket of brown powder, sniffs it, and breaks into a huge smile.'),
      by('a', "That's it. That's Christmas. One down."),
    ] },
    { id: 'rsd.st.sn3', when: at('spices', 'sniff'), turns: [
      beat('They work their way down the stalls with their noses an inch from every basket, like a pair of very serious bloodhounds.'),
      by('b', "We look ridiculous."),
      by('a', "Everyone here does. We fit right in."),
    ] },
    { id: 'rsd.st.sn4', when: at('spices', 'sniff'), turns: [
      by('b', "Saffron is the expensive one, right? So it's the one in the tiniest pile."),
      by('a', "That's actually smart."),
      beat('Right at the back of a stall sits a tiny dish of red threads, guarded by a sign with a lot of zeroes on it.'),
      by('b', "That's it. Tiny little red threads. That's saffron."),
    ] },
    { id: 'rsd.st.ki1', when: at('spices', 'the-kiosk'), turns: [
      beat('At the merchant\'s kiosk, the baskets are lined up along the counter, and the merchant waits with a little scoop and a stack of paper bags.'),
      by('a', "We'll take this one, this one, that one, that one, and this one."),
      beat('The merchant fills five bags without a word and without a single hint about whether any of them are right.'),
    ] },
    { id: 'rsd.st.ki2', when: at('spices', 'the-kiosk'), turns: [
      by('b', "Last one. Ginger. Which one is ginger?"),
      by('a', "The pale one. Ginger's a root. Roots are pale."),
      by('b', "Is that true? Whatever, you sound sure. Grab it."),
    ] },
    { id: 'rsd.st.ki3', when: at('spices', 'the-kiosk'), turns: [
      beat('{a} points at each basket in turn, and {b} nods or shakes {b.posAdj} head, and between them they agree on five without a single argument.'),
      by('b', "That was weirdly easy."),
      by('a', "Don't say that. Something bad's coming. I can feel it."),
    ] },
    { id: 'rsd.st.pa1', when: at('spices', 'pay-up'), turns: [
      beat('The merchant ties up five little paper bags with string and hands them over with the next tip.'),
      by('b', "\"Just stew it.\" Oh no. They're cooking what we picked."),
      by('a', "And one of us has to eat it. I really hope we got them right."),
    ] },
    { id: 'rsd.st.pa2', when: at('spices', 'pay-up'), turns: [
      by('a', "Okay, five bags. Let's go before I start worrying about the yellow one."),
      by('b', "You're already worrying about it."),
      beat('{b} stuffs the bags into {b.posAdj} pockets, and they run out of the alley in a little cloud of orange dust.'),
    ] },
    { id: 'rsd.st.pa3', when: at('spices', 'pay-up'), turns: [
      beat('{a} pays, the merchant smiles for the first time all day, and five warm little bags land in {a}\'s hands.'),
      by('a', "Why's the merchant smiling? Is that a good smile or a bad smile?"),
      by('b', "I don't want to know. Let's just go."),
    ] },

    // ── the stew ──
    { id: 'rsd.st.ch1', when: at('stew', 'the-chef'), turns: [
      beat('The chef takes the five little bags from {a}, tips every one of them into a bubbling pot, and stirs without looking up.'),
      by('a', "The chef didn't even smell them first. Is that bad?"),
      by('b', "Doesn't matter. The chef's not the one eating it."),
    ] },
    { id: 'rsd.st.ch2', when: at('stew', 'the-chef'), turns: [
      by('b', "Remember, I can't help you. I'm not allowed to eat a single spoonful."),
      by('a', "You don't look very sad about that."),
      beat('The chef ladles a steaming bowl and sets it down on the bench in front of {a} with a heavy clunk.'),
    ] },
    { id: 'rsd.st.ch3', when: at('stew', 'the-chef'), turns: [
      beat('The restaurant sits all alone in the middle of the desert, under a red awning, with a clay oven and one very busy chef.'),
      by('a', "I'll be fine. I grew up on my dad's chilli. Nothing's worse than that."),
      by('b', "Don't jinx it."),
    ] },
    { id: 'rsd.st.fs1', when: at('stew', 'first-spoon'), turns: [
      beat('{a} lifts the first spoonful, blows on it for a very long time, and puts it in {a.posAdj} mouth.'),
      by('b', "Well?"),
      by('a', "It's... actually okay? Bit spicy. I don't trust it."),
    ] },
    { id: 'rsd.st.fs2', when: at('stew', 'first-spoon'), turns: [
      by('b', "Small spoonfuls. Don't think about it. Just keep it moving."),
      beat('{a} takes a spoonful, swallows, and nods slowly, the way someone nods when a waiter asks if everything is all right and it isn\'t.'),
      by('a', "It's fine. It's totally fine. Stop looking at me like that."),
    ] },
    { id: 'rsd.st.fs3', when: at('stew', 'first-spoon'), turns: [
      beat('{a} tastes the stew, stops, and stares off into the desert for a long moment.'),
      by('a', "I can taste the cinnamon, so we got one right at least."),
      by('b', "Okay, good. Keep going."),
    ] },
    { id: 'rsd.st.hb1', when: at('stew', 'half-bowl'), turns: [
      beat('Halfway down the bowl, the heat finally arrives. {a}\'s face goes pink, then red, and then a colour that doesn\'t have a name.'),
      by('b', "Breathe through your nose."),
      by('a', "My nose is on fire too!"),
    ] },
    { id: 'rsd.st.hb2', when: at('stew', 'half-bowl'), turns: [
      by('b', "You're doing so good. You're halfway."),
      by('a', "Halfway means there's still half left."),
      beat('{a} takes another spoonful anyway and keeps going.'),
    ] },
    { id: 'rsd.st.hb3', when: at('stew', 'half-bowl'), turns: [
      beat('{b} sits on {b.posAdj} hands at the end of the bench, because the rule is that the partner can\'t help, and {b} really, really wants to help.'),
      by('b', "Can I at least hold the bowl? That's not really helping."),
      by('a', "Yes it is. Sit down."),
    ] },
    { id: 'rsd.st.hb4', when: at('stew', 'half-bowl'), turns: [
      beat('Sweat runs down {a}\'s face in little rivers, and the chef, without being asked, sets a jug of water next to the bowl.'),
      by('a', "Oh, thank you. Thank you so much."),
      by('b', "Not too much water. You still need room for the stew."),
    ] },
    { id: 'rsd.st.ld1', when: at('stew', 'last-drop'), turns: [
      beat('There are only a few spoonfuls left. {a} gives up on the spoon, lifts the bowl with both hands, and starts to drink.'),
      by('b', "Go, go, go, go!"),
      beat('The bowl tips higher and higher, and then it comes down empty.'),
    ] },
    { id: 'rsd.st.ld2', when: at('stew', 'last-drop'), turns: [
      by('b', "Every last drop. The chef's watching."),
      beat('{a} runs a finger round the inside of the bowl and licks it clean, glaring at the chef the whole time.'),
      by('a', "Happy now?"),
    ] },
    { id: 'rsd.st.ld3', when: at('stew', 'last-drop'), turns: [
      beat('{a} scrapes the bottom of the bowl, gets the last orange smear onto the spoon, and swallows it with {a.posAdj} eyes shut tight.'),
      by('a', "That last bit was the worst bit. How?"),
      by('b', "But it's done. Look, it's empty."),
    ] },
    { id: 'rsd.st.eb1', when: at('stew', 'empty-bowl'), turns: [
      beat('The chef picks up the bowl, turns it upside down, and shakes it. Nothing falls out, so the chef hands over the tip.'),
      by('b', "You did it! I'm so proud of you."),
      by('a', "Thanks. Don't hug me. Everything hurts."),
    ] },
    { id: 'rsd.st.eb2', when: at('stew', 'empty-bowl'), turns: [
      by('b', "\"Make your way on foot to the Chill Zone.\" Can you run?"),
      by('a', "Yeah. Just don't stand in front of me."),
      beat('They set off across the sand, {a} still fanning {a.posAdj} mouth.'),
    ] },
    { id: 'rsd.st.eb3', when: at('stew', 'empty-bowl'), turns: [
      beat('The chef inspects the empty bowl, gives a small, approving nod, and slides the tip across the bench.'),
      by('a', "The chef nodded at me. I'll take it."),
      by('b', "Come on. Before another bowl shows up."),
    ] },
  ],

  'task-stage.fail': [
    // ── the spice corner: a wrong spice, grabbed and believed ──
    { id: 'rsd.sf.sn1', when: at('spices', 'sniff'), turns: [
      beat('{a} sniffs a basket of bright yellow powder and lights up.'),
      by('a', "Ginger. Definitely ginger. I'd know it anywhere."),
      beat('It is turmeric, and it will be in the stew.'),
    ] },
    { id: 'rsd.sf.sn2', when: at('spices', 'sniff'), turns: [
      by('b', "Is this paprika? It's red, and paprika's red."),
      by('a', "I don't know. Sure. Grab it."),
      beat('It is chilli powder, which is also red, and a great deal hotter.'),
    ] },
    { id: 'rsd.sf.sn3', when: at('spices', 'sniff'), turns: [
      beat('{b} has sniffed so many baskets that everything smells the same now, and in the end just picks the brown one nearest to {b.posAdj} hand.'),
      by('b', "Cumin. Probably. Let's call it cumin."),
      beat('It is not cumin.'),
    ] },
    { id: 'rsd.sf.ki1', when: at('spices', 'the-kiosk'), turns: [
      beat('There are two baskets of orange-red threads side by side on the counter, and {a} points at the cheaper one.'),
      by('a', "That one's saffron too, right? And it's cheaper."),
      beat('It is not the same thing, and the merchant says nothing at all.'),
    ] },
    { id: 'rsd.sf.ki2', when: at('spices', 'the-kiosk'), turns: [
      by('b', "Last one. It's either that brown one or that other brown one."),
      by('a', "Eeny, meeny, miny..."),
      beat('{a} picks the wrong brown one.'),
    ] },
    { id: 'rsd.sf.ki3', when: at('spices', 'the-kiosk'), turns: [
      beat('{a} and {b} argue over the last basket for a whole minute, and in the end {b} wins the argument.'),
      by('b', "Trust me. This is the one."),
      beat('{b} is wrong, but {b.sub} said it so firmly that neither of them will find out until the stew.'),
    ] },

    // ── the stew: anything that comes back up means a fresh bowl ──
    { id: 'rsd.sf.fs1', when: at('stew', 'first-spoon'), turns: [
      beat('{a} takes the very first spoonful, and {a.posAdj} whole face folds up like a deckchair.'),
      by('a', "Nope. No. Nope."),
      beat('{a} spits it straight back into the bowl. The chef takes the bowl away and calmly ladles a fresh one.'),
    ] },
    { id: 'rsd.sf.fs2', when: at('stew', 'first-spoon'), turns: [
      by('b', "What's wrong with it? You've only had one spoonful."),
      by('a', "I think the thing we thought was ginger wasn't ginger."),
      beat('The spoonful comes back out, and the chef sighs and starts the bowl over from the top.'),
    ] },
    { id: 'rsd.sf.hb1', when: at('stew', 'half-bowl'), turns: [
      beat('Halfway down the bowl, {a} goes very still, and then very pale, and then makes a run for the edge of the awning.'),
      by('b', "Oh no. Oh no, not halfway."),
      beat('When {a} comes back, there is a fresh, full bowl waiting on the bench.'),
    ] },
    { id: 'rsd.sf.hb2', when: at('stew', 'half-bowl'), turns: [
      by('a', "I'm fine. I'm fine. I'm..."),
      beat('{a} is not fine. Half a bowl of stew comes back up, and the chef, who has clearly seen this many times, brings a new one.'),
      by('b', "Oh no. From the start. I'm so sorry."),
    ] },
    { id: 'rsd.sf.hb3', when: at('stew', 'half-bowl'), turns: [
      beat('{b} jumps up to grab the bowl and finish it, and the chef points a ladle at {b.obj} without a word. {b} sits back down.'),
      by('a', "I can't. It's coming back. It's coming..."),
      beat('It comes back, and the chef ladles a fresh bowl.'),
    ] },
    { id: 'rsd.sf.ld1', when: at('stew', 'last-drop'), turns: [
      beat('With two spoonfuls left, {a} gags on the very last chunk of something, and the whole bowl\'s worth comes back.'),
      by('a', "Two spoonfuls! I was two spoonfuls away!"),
      beat('The chef sets down a brand-new, steaming, completely full bowl.'),
    ] },
    { id: 'rsd.sf.ld2', when: at('stew', 'last-drop'), turns: [
      by('b', "Tip it back, and get it all at once."),
      beat('{a} tips the bowl back, gets too much at once, and spends the next ten seconds coughing it all back up.'),
      by('a', "That was a terrible idea."),
    ] },
  ],
};
