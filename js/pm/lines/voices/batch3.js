// pm/lines/voices/batch3.js — see index.js. [entry id, exact line, { voice: line }]
//
// Batch 3: the friendship and everyday chat a season plays most after the short
// replies (each 35-55 times in six seasons). Every line keeps its meaning, so the
// reply after it still answers it whichever voice the opener came out in.
// Families for everyone, then the tags that air most (earnest, calm, warm,
// schemer, blunt, anxious, bossy, quiet, cruel, tough, goofy).
export const BATCH3 = [
  ['*', 'Come on. Dinner.', {
    sharp: 'Dinner. Move.', dry: 'Dinner. Come on.', loud: 'DINNER! Come on!', soft: "Come on, it's dinner. I saved you a seat.", odd: 'Dinner! Food! Come on!',
    earnest: "Come on, it's dinner.", calm: "Dinner's ready. Come on.", warm: "Come on, you. Dinner's up.", blunt: 'Dinner. Now.', bossy: 'Up. Dinner. Now.',
    anxious: "Come on, it's dinner. We'll be late.", quiet: 'Dinner.', cruel: "Dinner. Try to keep up.", tough: 'Food. Come on.', goofy: 'Dinner! Chop chop!' }],
  ['*', 'In the middle of summer?', {
    sharp: 'In the middle of summer? Really?', dry: 'In the middle of summer. Sure.', loud: 'In the middle of summer?!', soft: 'In the middle of summer? Are you okay?', odd: 'In the middle of summer? You\'re a mystery.',
    earnest: 'In the middle of summer?', calm: 'In the middle of summer?', blunt: 'It\'s summer.', bossy: 'It\'s the middle of summer. Get a grip.', cruel: 'In the middle of summer? Dramatic.',
    goofy: 'In the middle of summer? Were you born in a fridge?' }],
  ['*', 'We should get ready soon.', {
    sharp: 'We need to get ready. Soon.', dry: 'We should probably get ready.', loud: 'We need to get ready! Soon!', soft: 'We should get ready soon, I think.', odd: 'Getting ready time is approaching.',
    earnest: 'We should get ready soon.', calm: "We've got time, but we should get ready soon.", warm: "Come on, we should get ready soon. I'll do your hair.", blunt: 'Get ready. Soon.', bossy: 'Right. Getting ready. Ten minutes.',
    anxious: "We should get ready soon. We're going to be late.", quiet: 'Getting ready soon?', tough: 'We should move.', goofy: 'We should get ready soon. Or never. Never works.' }],
  ['*', "Right. I'm going to go and find my partner.", {
    sharp: "Right. Partner. Off I go.", dry: "Right. Better go and find my partner.", loud: "Right! I'm off to find my partner!", soft: "Right. I'm going to go and find my partner. Thanks for this.", odd: 'Right. Partner hunt. Wish me luck.',
    earnest: "Right. I'm going to go and find my partner.", calm: "Right. I'll go and find my partner.", warm: "Right, I'd better go and find my partner. This was nice.", blunt: "I'm off. Partner.", bossy: "Right. I'm going. Partner's waiting.",
    anxious: "Right. I should go and find my partner. Before they wonder.", quiet: 'Going to find my partner.', tough: "Right. Off to find my partner.", goofy: 'Right. Off to find my other half. Hopefully the better half.' }],
  ['*', 'Go on. Say hi from me.', {
    sharp: 'Go on. Say hi.', dry: 'Go on. Say hi from me.', loud: 'Go on! Tell them I said hi!', soft: 'Go on. Say hi from me. Have fun.', odd: 'Go on. Tell them I said hello. Loudly.',
    earnest: 'Go on. Say hi from me.', warm: 'Go on, then. Give them a hug from me.', blunt: 'Go on. Bye.', bossy: 'Go on. Off you go.', cruel: 'Go on. Don\'t keep them waiting.', goofy: 'Go on. Tell them I said hi and that I\'m better.' }],
  ['*', 'Carry me.', {
    sharp: 'Carry me. Go on.', dry: 'Carry me.', loud: 'Carry me! Piggyback!', soft: 'Will you carry me? Please?', odd: 'Carry me. I\'ve forgotten how legs work.',
    calm: 'Carry me.', warm: 'Carry me? Pretty please?', blunt: 'Carry me.', bossy: 'Carry me. That\'s an order.', anxious: 'Can you carry me? I\'m so tired.', quiet: 'Carry me.', goofy: 'Carry me. Like a princess. Or a sack of potatoes.' }],
  ['*', "We're still arguing, by the way.", {
    sharp: "We're still arguing, by the way. Don't think we're not.", dry: "We're still arguing, by the way.", loud: "Don't think we're done arguing, by the way!", soft: "We're still arguing, by the way. Just so you know.", odd: "We're still arguing, by the way. Officially.",
    earnest: "We're still arguing, by the way.", calm: "We're still arguing, by the way. Just quietly.", blunt: "Still arguing, by the way.", bossy: "We're still arguing. Don't forget.", cruel: "We're still arguing, by the way. I haven't forgiven you.",
    goofy: "We're still arguing, by the way. I'm winning." }],
  ['*', "I'd rather {b} hears it from a friend than finds out the hard way.", {
    sharp: "I'd rather {b} hears it from me than gets blindsided.", dry: "Better {b} hears it from a friend than finds out the hard way.", loud: "{b} needs to hear it from a friend, not find out the hard way!", soft: "I'd rather {b} hears it from a friend. It'd hurt more the other way.", odd: "If {b} finds out the hard way, that's worse. Friend delivery is better.",
    earnest: "I'd rather {b} hears it from a friend than finds out the hard way.", calm: "Better it comes from a friend. {b} deserves that.", warm: "I'd rather {b} hears it from someone who cares. Not the hard way.", blunt: "{b} should hear it from a friend. Not the hard way.",
    schemer: "If {b} hears it from me first, I'm the one who told the truth.", anxious: "I'd rather {b} hears it from a friend. I just don't know how to say it.", bossy: "{b} hears it from a friend. That's how it's going to go." }],
  ['*', 'Thanks for this. I needed it.', {
    sharp: 'Thanks. I needed that.', dry: 'Thanks for this. Needed it.', loud: 'Thanks for this! I really needed it!', soft: 'Thanks for this. I really needed it.', odd: 'Thanks for this. My battery\'s charged.',
    earnest: 'Thank you for this. I needed it.', calm: 'Thanks. That helped.', warm: 'Thanks for this. You always know.', blunt: 'Thanks. Needed it.', anxious: 'Thanks for this. I was in a bad way.', quiet: 'Thanks. Needed that.', tough: 'Cheers. Needed that.', goofy: 'Thanks for this. I owe you a sunbed.' }],
  ['*', 'Any time. I mean that.', {
    sharp: 'Any time.', dry: 'Any time. I mean it.', loud: 'Any time! Seriously, any time!', soft: 'Any time. I mean that.', odd: 'Any time. Twenty-four hours.',
    earnest: 'Any time. I really mean that.', calm: 'Any time.', warm: 'Any time at all. You know where I am.', blunt: 'Any time.', bossy: 'Any time. Come to me first.', schemer: 'Any time. You know you can trust me.',
    goofy: 'Any time. Open all hours.' }],
  ['*', "You didn't save me a seat at dinner.", {
    sharp: "You didn't save me a seat. Noted.", dry: "No seat for me at dinner, then.", loud: "You didn't save me a seat at dinner!", soft: "You didn't save me a seat at dinner. I'm a bit hurt.", odd: "You didn't save me a seat at dinner. I ate standing like a horse.",
    earnest: "You didn't save me a seat at dinner.", calm: "You didn't save me a seat at dinner.", blunt: "No seat at dinner. Thanks.", bossy: "Next time, you save me a seat.", cruel: "You didn't save me a seat. Clearly I'm not a priority.",
    anxious: "You didn't save me a seat at dinner. Is everything okay?", goofy: "You didn't save me a seat. I've been betrayed." }],
  ['*', "Can I tell you something and you won't say anything?", {
    sharp: "I'm going to tell you something. It stays between us.", dry: "Can I tell you something? Between us.", loud: "Okay, I have to tell you something, but you can't say anything!", soft: "Can I tell you something, and you won't say anything?", odd: "Can I tell you a secret? A real one.",
    earnest: "Can I tell you something? I need you to keep it to yourself.", calm: "Can I tell you something? Just between us.", blunt: "I'm telling you something. Keep it quiet.", bossy: "I'm telling you something, and it doesn't leave this sunbed.",
    schemer: "Can I trust you with something?", anxious: "Can I tell you something? You won't say anything, will you?", quiet: "Can I tell you something?", tough: "Keep this to yourself, yeah?" }],
  ['*', 'Same time tomorrow, then.', {
    sharp: 'Same time tomorrow.', dry: 'Same time tomorrow, then.', loud: 'Same time tomorrow!', soft: 'Same time tomorrow, then?', odd: 'Same time tomorrow. It\'s in the diary.',
    warm: 'Same time tomorrow? I\'ll look forward to it.', bossy: 'Same time tomorrow. Don\'t be late.', goofy: 'Same time tomorrow. Same sunbed.' }],
  ['*', 'Same time tomorrow.', {
    sharp: 'Done.', dry: 'Same time tomorrow.', loud: 'Same time tomorrow! Deal!', soft: 'Same time tomorrow. Definitely.', odd: 'Same time tomorrow. Synchronise watches.',
    warm: 'Wouldn\'t miss it.', bossy: 'Same time. Be there.', goofy: 'Same time tomorrow. Bring snacks.' }],
  ['*', 'Right. Pool?', {
    sharp: 'Pool. Now.', dry: 'Right. Pool?', loud: 'Right! Pool! Let\'s go!', soft: 'Right. Pool?', odd: 'Right. Pool? Cannonball?',
    calm: 'Pool?', warm: 'Right. Pool? Come on.', bossy: 'Right. Pool. Come on.', anxious: 'Pool? If you want.', goofy: 'Last one in the pool is a soggy biscuit.' }],
  ['*', 'Pool.', {
    sharp: 'Pool.', dry: 'Pool.', loud: 'POOL!', soft: 'Pool. Yes.', odd: 'Pool. Race you.',
    warm: 'Pool. Let\'s go.', bossy: 'Pool.', goofy: 'Pool. Cannonball.' }],
  ['*', 'Same sunbed later?', {
    sharp: 'Same sunbed later. Don\'t let anyone take it.', dry: 'Same sunbed later?', loud: 'Same sunbed later? Yes?', soft: 'Same sunbed later?', odd: 'Same sunbed later? It knows our shape now.',
    warm: 'Same sunbed later? I\'ll save it.', bossy: 'Same sunbed later. I\'ll save it.', anxious: 'Same sunbed later? If you\'re not busy?', goofy: 'Same sunbed later? It\'s basically ours legally.' }],
  ['*', "Promise me we'll still do this on the outside.", {
    sharp: "We're still doing this on the outside. Promise me.", dry: "We're still doing this on the outside, yes?", loud: "Promise me we'll still do this on the outside!", soft: "Promise me we'll still do this on the outside.", odd: "Promise me we'll still do this outside. Pinky promise.",
    earnest: "Promise me we'll still do this on the outside. I mean it.", calm: "We'll still do this on the outside, won't we?", warm: "Promise me we'll still do this when we're home.", blunt: "Promise we'll still do this outside.", bossy: "We're doing this on the outside. Promise me.",
    anxious: "Promise me we'll still do this on the outside? You won't forget me?", quiet: "We'll still do this outside?", goofy: "Promise me we'll still do this outside. Same sunbed, different country." }],
  ['*', "Obviously. You're stuck with me now.", {
    sharp: "Obviously. You're stuck with me.", dry: "Obviously. You're stuck with me now.", loud: "Obviously! You're never getting rid of me!", soft: "Obviously. You're stuck with me now.", odd: "Obviously. You're stuck with me. I'm like glitter.",
    earnest: "Of course. You're stuck with me now.", warm: "Obviously. You're stuck with me for life.", blunt: "Obviously.", bossy: "Obviously. Don't even ask.", goofy: "Obviously. You're stuck with me. No returns." }],
  ['*', "I'm glad you're in here.", {
    sharp: "I'm glad you're in here.", dry: "I'm glad you're in here.", loud: "I'm so glad you're in here!", soft: "I'm really glad you're in here.", odd: "I'm glad you're in here. You're my favourite surprise.",
    earnest: "I'm really glad you're in here. Honestly.", calm: "I'm glad you're here.", warm: "I'm so glad you're in here with me.", blunt: "Glad you're here.", anxious: "I'm so glad you're in here. I'd be a mess without you.", quiet: "Glad you're here.", goofy: "I'm glad you're in here. Who else would laugh at my jokes?" }],
  ['*', "Me too. It'd be a lot worse without you.", {
    sharp: "Me too. It'd be worse without you.", dry: "Same. It'd be a lot worse without you.", loud: "Me too! It'd be awful without you!", soft: "Me too. It'd be a lot worse without you.", odd: "Me too. It'd be a lot worse without you. And quieter.",
    earnest: "Me too. Honestly, it'd be a lot worse without you.", warm: "Me too. I don't know what I'd do without you.", blunt: "Same. Worse without you.", goofy: "Me too. You're my emergency contact." }],
  ['*', "I'm glad I've got you in here.", {
    sharp: "I'm glad I've got you in here.", dry: "Glad I've got you in here.", loud: "I'm so glad I've got you in here!", soft: "I'm really glad I've got you in here.", odd: "I'm glad I've got you in here. You're my person.",
    earnest: "I'm glad I've got you in here. I mean that.", warm: "I'm so glad I've got you in here.", blunt: "Glad I've got you.", anxious: "I'm so glad I've got you. I'd be lost.", goofy: "Glad I've got you in here. Every villa needs a sidekick." }],
  ['*', "Me too. It'd be a lot harder without you.", {
    sharp: "Me too. It'd be harder without you.", dry: "Same. It'd be a lot harder without you.", loud: "Me too! It'd be so much harder!", soft: "Me too. It'd be a lot harder without you.", odd: "Me too. I'd be talking to the plants.",
    earnest: "Me too. It'd be so much harder without you.", warm: "Me too. You make it easier.", blunt: "Same. Harder without you.", goofy: "Me too. I'd be talking to the plants." }],
  ['*', "Don't tell anyone how soft I am.", {
    sharp: "Don't you dare tell anyone how soft I am.", dry: "Don't tell anyone how soft I am.", loud: "Don't tell anyone how soft I am! I mean it!", soft: "Don't tell anyone how soft I am, okay?", odd: "Don't tell anyone how soft I am. I have a reputation.",
    earnest: "Don't tell anyone how soft I am.", calm: "Keep it between us. How soft I am.", blunt: "Not a word about how soft I am.", bossy: "Not a word to anyone about this.", tough: "Not a word. I've got a reputation.", goofy: "Don't tell anyone how soft I am. I'm a big softie." }],
  ['*', "I won't. Everyone knows anyway.", {
    sharp: "I won't. They all know anyway.", dry: "I won't. Everyone knows anyway.", loud: "I won't! Everyone knows already!", soft: "I won't. Everyone knows anyway, though.", odd: "I won't. It's written on your face.",
    warm: "I won't. Everyone knows anyway, and they love you for it.", blunt: "Everyone knows already.", cruel: "I won't. Everyone already knows.", goofy: "I won't. It's on a banner in the kitchen." }],
  ['*', "You're one of my favourite people in here, you know that?", {
    sharp: "You're one of my favourite people in here. Don't let it go to your head.", dry: "You're one of my favourite people in here, you know that?", loud: "You're one of my favourite people in here! You know that?", soft: "You're one of my favourite people in here, you know that?", odd: "You're one of my favourite people in here. Top three. Maybe top two.",
    earnest: "You're honestly one of my favourite people in here.", warm: "You know you're one of my favourite people in here, right?", blunt: "You're one of my favourites in here.", bossy: "You're one of my favourite people in here. Remember that.", goofy: "You're one of my favourite people in here. Top five, easy." }],
  ['*', 'Only one of?', {
    sharp: 'Only one of?', dry: 'Only one of?', loud: 'ONLY one of?!', soft: 'Only one of? Aw.', odd: 'Only one of? I demand a recount.',
    competitive: 'Only one of? Who\'s above me?', proud: 'Only one of? Surely the top.', goofy: 'Only one of? I want a trophy.' }],
  ['*', 'You always know what to say.', {
    sharp: 'You always know what to say.', dry: 'You always know what to say.', loud: 'You always know exactly what to say!', soft: 'You always know what to say.', odd: 'You always know what to say. It\'s like magic.',
    earnest: 'You always know what to say. Thank you.', warm: 'You always know what to say to me.', blunt: 'You always know what to say.', anxious: 'You always know what to say. I never do.', goofy: 'You always know what to say. Do you have a script?' }],
  ['*', 'Not always. Just to you.', {
    sharp: 'Not always. Just to you.', dry: 'Not always. Just to you.', loud: 'Not always! Just to you!', soft: 'Not always. Just to you.', odd: 'Not always. Just to you. You bring it out.',
    warm: 'Not always. Just to you.', schemer: 'Not always. Just to the people who matter.', goofy: 'Not always. Ask the plants.' }],
  ['*', "Come on. Everyone's in the pool.", {
    sharp: "Come on. Everyone's in. You're the only one not.", dry: "Everyone's in the pool. Come on.", loud: "Come on! Everyone's in the pool!", soft: "Come on, everyone's in the pool.", odd: "Come on. Everyone's in the pool. It's a pool party.",
    warm: "Come on, everyone's in the pool. Come and join us.", bossy: "Pool. Everyone's in. Up.", anxious: "Come on, everyone's in the pool. We'll look weird.", goofy: "Come on. Everyone's in the pool. Even the inflatable." }],
  ['*', "I'll be in in a minute.", {
    sharp: "In a minute.", dry: "I'll be in in a minute.", loud: "I'll be in in a minute! Go!", soft: "I'll be in in a minute, promise.", odd: "I'll be in in a minute. Just warming up. Spiritually.",
    calm: "I'll be in in a minute.", warm: "Go on. I'll be in in a minute.", blunt: "In a minute.", anxious: "I'll be in in a minute. It looks cold.", quiet: "In a minute.", goofy: "I'll be in in a minute. Lowering the water level, slowly." }],
  ['*', "Let's not tell anyone we spent the whole afternoon gossiping.", {
    sharp: "Nobody needs to know we spent all afternoon gossiping.", dry: "Let's not mention the whole afternoon of gossiping.", loud: "We spent the WHOLE afternoon gossiping! Nobody can know!", soft: "Let's not tell anyone we spent the whole afternoon gossiping.", odd: "Let's not tell anyone we spent the afternoon gossiping. Professional secret.",
    warm: "Let's keep our gossip afternoon between us.", schemer: "Everything we said this afternoon stays with us.", blunt: "We never gossiped. Got it?", bossy: "Not a word about this afternoon.", anxious: "Let's not tell anyone we spent all afternoon gossiping. Please.", goofy: "Let's not tell anyone. We were 'sunbathing'." }],
  ['*', 'Is it weird that I tell you everything?', {
    sharp: 'Is it weird I tell you everything?', dry: 'Is it weird that I tell you everything?', loud: 'Is it weird that I literally tell you everything?', soft: 'Is it weird that I tell you everything?', odd: 'Is it weird that I tell you everything? Like, everything?',
    earnest: 'Is it weird that I tell you everything?', warm: 'Is it weird I tell you everything? I just trust you.', anxious: 'Is it weird that I tell you everything? Am I too much?', quiet: 'Is it weird I tell you everything?', goofy: 'Is it weird that I tell you everything? Even the toenail story?' }],
  ['*', "A bit. Don't stop, though.", {
    sharp: "A bit. Don't stop.", dry: "A bit. Don't stop, though.", loud: "A bit! Don't stop, though!", soft: "A bit. Don't stop, though.", odd: "A bit. Keep going. I love it.",
    warm: "Not weird. Don't ever stop.", blunt: "A bit. Keep doing it.", goofy: "A bit. Don't stop. I live for it." }],
  ['*', 'Ten more minutes.', {
    sharp: 'Ten minutes.', dry: 'Ten more minutes.', loud: 'Ten more minutes! Please!', soft: 'Ten more minutes? Please?', odd: 'Ten more minutes. Fifteen. Twenty.',
    calm: 'Ten more minutes.', warm: 'Ten more minutes. It\'s too nice here.', bossy: 'Ten more minutes. Then we go.', anxious: 'Ten more minutes? Is that okay?', goofy: 'Ten more minutes. Snooze button.' }],
  ['*', 'Ten. Then we go.', {
    sharp: 'Ten. Then we go.', dry: 'Ten. Then we go.', loud: 'Ten! Then we go!', soft: 'Ten. Then we go, okay?', odd: 'Ten. I\'m counting.',
    bossy: 'Ten. And I\'m timing it.', goofy: 'Ten. And then I drag you.' }],
  ['*', "I've missed talking to you like this.", {
    sharp: "I've missed this. Talking.", dry: "I've missed talking to you like this.", loud: "I've missed talking to you like this!", soft: "I've really missed talking to you like this.", odd: "I've missed this. Our little chats.",
    earnest: "I've missed talking to you like this. Honestly.", warm: "I've missed you. Talking like this.", anxious: "I've missed talking to you like this. I thought we'd drifted.", goofy: "I've missed talking to you like this. Our podcast was on a break." }],
  ['*', "We're in the same villa.", {
    sharp: "We're in the same villa.", dry: "We're in the same villa.", loud: "We're in the same villa!", soft: "We're in the same villa, silly.", odd: "We're in the same villa. Twenty metres away.",
    warm: "We're in the same villa, you muffin.", goofy: "We're in the same villa. I can see you from here." }],
  ['*', "I'm glad we talked.", {
    sharp: "I'm glad we talked.", dry: "Glad we talked.", loud: "I'm so glad we talked!", soft: "I'm really glad we talked.", odd: "I'm glad we talked. I feel lighter.",
    earnest: "I'm really glad we talked. Thank you.", calm: "I'm glad we talked.", warm: "I'm so glad we talked. Come here.", blunt: "Glad we talked.", anxious: "I'm so glad we talked. I was dreading it.", goofy: "I'm glad we talked. Therapy session over." }],
  ['*', 'Me too. Properly glad.', {
    sharp: 'Me too.', dry: 'Me too. Properly glad.', loud: 'Me too! So glad!', soft: 'Me too. Really glad.', odd: 'Me too. Glad squared.',
    warm: 'Me too. Really, really glad.', goofy: 'Me too. Glad times a hundred.' }],
  ['*', "I'd be lost in here without you.", {
    sharp: "I'd be lost in here without you.", dry: "I'd be lost in here without you.", loud: "I'd be completely lost in here without you!", soft: "I'd be lost in here without you.", odd: "I'd be lost in here without you. Literally. I get lost going to the kitchen.",
    earnest: "I'd honestly be lost in here without you.", warm: "I'd be lost without you in here. You know that.", anxious: "I'd be so lost in here without you.", goofy: "I'd be lost in here without you. I need a guide." }],
  ['*', "You'd be fine.", {
    sharp: "You'd be fine.", dry: "You'd be fine.", loud: "You'd be fine!", soft: "You'd be fine. You're stronger than you think.", odd: "You'd be fine. You'd make friends with a sunbed.",
    calm: "You'd be fine.", warm: "You'd be fine. But I'm glad you don't have to be.", blunt: "You'd be fine.", goofy: "You'd be fine. You'd adopt a lizard." }],
  ['*', "I'd be fine and bored.", {
    sharp: "Fine and bored.", dry: "I'd be fine. And bored.", loud: "I'd be fine and SO bored!", soft: "I'd be fine and bored. And lonely.", odd: "I'd be fine and bored. Talking to my reflection.",
    goofy: "I'd be fine and bored. Narrating my own life." }],
  ['*', 'Right. Back to it.', {
    sharp: 'Right. Back to it.', dry: 'Right. Back to it.', loud: 'Right! Back to it!', soft: 'Right. Back to it, then.', odd: 'Right. Back to the grind. The sunbathing grind.',
    bossy: 'Right. Back to it. Come on.', goofy: 'Right. Back to the important work of lying down.' }],
  ['*', 'Back to it.', {
    sharp: 'Back to it.', dry: 'Back to it.', loud: 'Back to it!', soft: 'Back to it.', odd: 'Back to it. Duty calls.' }],
  ['*', "Right, I'm starving. Kitchen?", {
    sharp: "Kitchen. I'm starving.", dry: "Right, I'm starving. Kitchen?", loud: "I'm STARVING! Kitchen!", soft: "I'm starving. Kitchen?", odd: "Right, I'm starving. Kitchen? I'll make a sandwich tower.",
    warm: "I'm starving. Kitchen? I'll make you something.", bossy: "Kitchen. Now. I'm starving.", anxious: "I'm starving. Kitchen? If you're hungry too?", goofy: "I'm starving. Kitchen? I could eat a sunbed." }],
  ['*', 'Kitchen.', {
    sharp: 'Kitchen.', dry: 'Kitchen.', loud: 'KITCHEN!', soft: 'Kitchen. Yes.', odd: 'Kitchen. Lead the way.',
    goofy: 'Kitchen. To the snacks.' }],
  ['*', "I'm really glad we met.", {
    sharp: "I'm glad we met. Really.", dry: "I'm really glad we met.", loud: "I'm SO glad we met!", soft: "I'm really glad we met.", odd: "I'm really glad we met. Best thing about this place.",
    earnest: "I'm really glad we met. I mean that.", calm: "I'm really glad we met.", warm: "I'm so glad we met. You know that?", blunt: "Glad we met.", anxious: "I'm really glad we met. I wasn't sure I'd find anyone.", goofy: "I'm really glad we met. Fate, probably." }],
  ['*', "Stop it. You'll make me cry.", {
    sharp: "Stop it. You'll make me cry.", dry: "Stop. You'll make me cry.", loud: "Stop it! You'll make me cry!", soft: "Stop it. You'll make me cry.", odd: "Stop it. My face is leaking.",
    tough: "Stop. I don't cry.", warm: "Stop it, you'll make me cry. Come here.", goofy: "Stop it. My mascara can't take this." }],
  ['*', "I didn't expect to like {b} this much. It's annoying, actually. I had a whole plan.", {
    sharp: "I didn't expect to like {b} this much. I had a plan, and {b} ruined it.", dry: "I didn't expect to like {b} this much. Annoying. I had a plan.", loud: "I didn't expect to like {b} this much! I had a whole plan!", soft: "I didn't expect to like {b} this much. I had a whole plan, and now look.", odd: "I didn't expect to like {b} this much. I had a plan. It's in the bin now.",
    earnest: "I didn't expect to like {b} this much. Honestly. I had a whole plan.", calm: "I didn't expect to like {b} this much. Plans change.", schemer: "I had a whole plan. {b} wasn't in it. Now {b} is.", blunt: "I like {b}. I didn't plan to.", anxious: "I didn't expect to like {b} this much. It's scary, actually.", flirty: "I didn't expect to like {b} this much. I had a plan. {b} ruined it, and I don't mind." }],
  ['*', "You'll still talk to me outside, won't you?", {
    sharp: "You're still talking to me outside. Right?", dry: "You'll still talk to me outside, won't you?", loud: "You'll still talk to me outside, won't you?!", soft: "You'll still talk to me outside, won't you?", odd: "You'll still talk to me outside? Even when I'm not tanned?",
    earnest: "You'll still talk to me outside, won't you?", anxious: "You'll still talk to me outside? You won't forget me?", bossy: "You're still talking to me outside. That's decided.", goofy: "You'll still talk to me outside? I'll send you memes." }],
  ['*', "I'll be sick of you by the first week.", {
    sharp: "I'll be sick of you in a week.", dry: "I'll be sick of you by the first week.", loud: "I'll be sick of you by the first week!", soft: "I'll be sick of you by the first week. Not really.", odd: "I'll be sick of you by day three.",
    cruel: "I'll be sick of you by the first week. Maybe sooner.", warm: "I'll be sick of you in a week. And I'll still call.", goofy: "I'll be sick of you by the first week. Then I'll miss you." }],
  ['*', "Obviously it's a yes.", {
    sharp: "It's a yes.", dry: "Obviously it's a yes.", loud: "Obviously it's a yes!", soft: "Of course it's a yes.", odd: "It's a yes. A huge one.",
    warm: "Of course it's a yes, you idiot.", goofy: "It's a yes. Yes with sprinkles." }],
  ['*', "I think I'm starting to really like {pa}.", {
    sharp: "I'm starting to really like {pa}. Don't make it a thing.", dry: "I think I'm starting to really like {pa}.", loud: "I think I'm actually starting to really like {pa}!", soft: "I think I'm starting to really like {pa}.", odd: "I think I'm starting to really like {pa}. Weird, right?",
    earnest: "I think I'm really starting to like {pa}.", calm: "I think I'm starting to really like {pa}.", schemer: "I'm starting to like {pa}. Properly. That wasn't the plan.", blunt: "I like {pa}. A lot.", anxious: "I think I'm starting to really like {pa}. What if it goes wrong?", quiet: "I like {pa}. Really like.", flirty: "I'm really starting to like {pa}. Like, really." }],
  ['*', "How's it going with {pb}?", {
    sharp: "How's it going with {pb}? Honestly.", dry: "So. How's it going with {pb}?", loud: "So! How's it going with {pb}?!", soft: "How's it going with {pb}?", odd: "So. How's it going with {pb}? I want the gossip.",
    earnest: "How's it going with {pb}? Really?", calm: "How's it going with {pb}?", warm: "How's it going with {pb}? Are you happy?", blunt: "You and {pb}. How's it going?", schemer: "How's it really going with {pb}?", goofy: "How's it going with {pb}? Give me a weather report." }],
  ['*', "Good. Really good. I'm scared of how good.", {
    sharp: "Good. Really good. Too good.", dry: "Good. Really good. Worryingly good.", loud: "Good! Really good! It's scary!", soft: "Good. Really good. I'm scared of how good.", odd: "Good. Really good. Suspiciously good.",
    earnest: "Good. Really good. Honestly, I'm a bit scared.", calm: "Good. Really good.", anxious: "Good. Really good. Which means something's going to go wrong.", goofy: "Good. Really good. Waiting for the twist." }],
  ['*', "Is {pb} being nice to you? Really nice?", {
    sharp: "Is {pb} being nice to you? Because if not, I'll have a word.", dry: "Is {pb} being nice to you? Really?", loud: "Is {pb} being nice to you? Really nice?!", soft: "Is {pb} being nice to you? Really nice?", odd: "Is {pb} being nice to you? On a scale of one to ten?",
    warm: "Is {pb} looking after you? Properly?", bossy: "Is {pb} treating you right? I'm asking.", tough: "Is {pb} treating you right? Say the word.", blunt: "Is {pb} good to you?", goofy: "Is {pb} being nice to you? Or do I need to glare?" }],
  ['*', "I've not seen you all day. Is {pb} keeping you busy?", {
    sharp: "I've not seen you all day. {pb} keeping you busy?", dry: "Haven't seen you all day. {pb} keeping you busy?", loud: "I've not seen you ALL day! Is {pb} keeping you busy?", soft: "I've not seen you all day. Is {pb} keeping you busy?", odd: "I've not seen you all day. Has {pb} kidnapped you?",
    warm: "I've missed you today. Is {pb} keeping you busy?", cruel: "Remember me? Or has {pb} got you on a lead?", goofy: "I've not seen you all day. Has {pb} hidden you somewhere?" }],
  ['*', "Sorry. I'll make it up to you.", {
    sharp: "Sorry. I'll make it up to you.", dry: "Sorry. I'll make it up to you.", loud: "Sorry! I'll make it up to you!", soft: "Sorry. I'll make it up to you, promise.", odd: "Sorry. I'll make it up to you. With snacks.",
    warm: "Sorry. I'll make it up to you, I promise.", goofy: "Sorry. I'll make it up to you. I'll do your hair." }],
  ['*', "Don't let me forget to put sun cream on.", {
    sharp: "Remind me. Sun cream.", dry: "Don't let me forget sun cream.", loud: "Don't let me forget sun cream! I'll burn!", soft: "Don't let me forget to put sun cream on.", odd: "Don't let me forget sun cream. I go lobster.",
    bossy: "Remind me about sun cream. That's your job now.", anxious: "Don't let me forget sun cream. I burn so easily.", goofy: "Don't let me forget sun cream. I turn into a tomato." }],
  ['*', "I won't. I'll nag you.", {
    sharp: "I won't. I'll nag you.", dry: "I won't. I'll nag.", loud: "I won't! I'll nag you all day!", soft: "I won't. I'll remind you.", odd: "I won't. I'll set an alarm. A human alarm.",
    warm: "I won't. I'll do your back, too.", bossy: "I won't. I'll make you.", goofy: "I won't. I'll nag you like your {~mum}." }],
  ['*', 'Me too. Come here.', {
    sharp: 'Me too. Come here.', dry: 'Me too. Come here.', loud: 'Me too! Come here!', soft: 'Me too. Come here.', odd: 'Me too. Come here. Hug of peace.',
    warm: 'Me too. Come here, you.', goofy: 'Me too. Come here. Make-up hug.' }],
  ['*', 'Right. I need a drink. Do you want one?', {
    sharp: 'I need a drink. You want one?', dry: 'Right. I need a drink. You?', loud: 'Right! I need a drink! Want one?', soft: 'I need a drink. Do you want one?', odd: 'Right. Drink time. Want one?',
    warm: 'I need a drink. I\'ll get you one too.', bossy: 'Drink. I\'m getting you one.', goofy: 'Right. I need a drink. Want one? Large, obviously.' }],
  ['*', "You've been quiet all morning.", {
    sharp: "You've been quiet all morning. What's going on?", dry: "You've been quiet all morning.", loud: "You've been SO quiet all morning!", soft: "You've been quiet all morning. Are you okay?", odd: "You've been quiet all morning. Suspiciously quiet.",
    warm: "You've been quiet all morning. Talk to me.", bossy: "You've been quiet all morning. Out with it.", blunt: "You've been quiet. What's wrong?", goofy: "You've been quiet all morning. Did someone steal your voice?" }],
];
