// pm/lines/voices/batch4.js — see index.js. [entry id, exact line, { voice: line }]
//
// Batch 4: friendship scenes, every tag. From here on a line gets all twenty tags
// a cast actually leads with (measured: earnest calm loud warm schemer blunt dry
// anxious flirty bossy quiet cruel tough competitive theatrical nerdy goofy
// chaotic ditzy proud), so the speaker's OWN tag answers, not its family.
// Between friends, flirty is charm, never a come-on (TD's guard).
const T = (text, v) => ['*', text, v];

export const BATCH4 = [
  T('Go on, then. Tell me something good.', {
    earnest: "Go on, then. Tell me something good. I need it.", warm: "Go on, then. Tell me something nice.", calm: "Tell me something good.", quiet: "Tell me something good.",
    dry: "Go on, then. Something good. If there is anything.", nerdy: "Tell me one good thing. Just one data point.", loud: "Go on! Tell me something good!", blunt: "Tell me something good. Now.",
    tough: "Go on. Something good.", competitive: "Go on. Top my day.", chaotic: "Something good! Anything! Go!", schemer: "Go on. Tell me something good. Something useful.",
    cruel: "Go on, then. Tell me something good, if you can manage it.", bossy: "Tell me something good. That's an order.", proud: "Tell me something good. Besides me.", flirty: "Go on, then. Say something nice to me.",
    anxious: "Can you tell me something good? I need it right now.", goofy: "Go on. Tell me something good. Puppies. Anything.", ditzy: "Tell me something good! Oh, wait, what's good?", theatrical: "Tell me something good! Rescue me from this day!" }),
  T("The sun's out and you've got me.", {
    earnest: "The sun's out, and you've got me. That's two good things.", warm: "The sun's out, and you've got me. Always.", calm: "Sun's out. You've got me.", quiet: "Sun. Me.",
    dry: "The sun's out, and you've got me. Lucky you.", nerdy: "The sun's out, and you've got me. Statistically, a good day.", loud: "The sun's out, and you've got ME!", blunt: "Sun's out. You've got me.",
    tough: "Sun's out. You've got me. Sorted.", competitive: "The sun's out, and you've got the best friend in here.", chaotic: "The sun's out! You've got me! What more do you want?", schemer: "The sun's out, and you've got me on your side.",
    cruel: "The sun's out, and you've got me. More than most can say.", bossy: "The sun's out and you've got me. Be grateful.", proud: "The sun's out, and you've got me. That's plenty.", flirty: "The sun's out, and you've got me. What else could you want?",
    anxious: "The sun's out, and… you've got me? Is that good?", goofy: "The sun's out, and you've got me. And my sunburn.", ditzy: "The sun's out! And… me! You've got me!", theatrical: "The sun shines, and you have ME! What more could anyone ask?" }),
  T("I'd better go and find {pa} before {pa} sends out a search party.", {
    earnest: "I should go and find {pa}. {pa} will be wondering.", warm: "I'd better go and find {pa}. I've missed {pa.obj}.", calm: "I'll go and find {pa}.", quiet: "Better find {pa}.",
    dry: "I'd better find {pa} before there's a search party.", nerdy: "I'd better find {pa}. I've been gone forty minutes.", loud: "Right! Better find {pa} before {pa} sends out a search party!", blunt: "Going to find {pa}.",
    tough: "Better go find {pa}.", competitive: "I'd better get back to {pa} before someone else does.", chaotic: "Oh no, {pa}! I forgot! Search party!", schemer: "I'd better get back to {pa}. Don't want questions.",
    cruel: "I'd better find {pa} before {pa} starts sulking.", bossy: "Right. I'm going to find {pa}.", proud: "I'd better find {pa}. {pa} can't cope without me.", flirty: "I'd better go and find {pa}. Can't keep {pa.obj} waiting.",
    anxious: "I should find {pa}. What if {pa} thinks I'm avoiding {pa.obj}?", goofy: "I'd better find {pa} before {pa} puts up posters.", ditzy: "Wait, where's {pa}? I'd better go and find {pa.obj}!", theatrical: "I must go! {pa} will be lost without me!" }),
  T('Go.', {
    earnest: "Go. Say hi.", warm: "Go on, go. Have fun.", calm: "Go.", quiet: "Go.", dry: "Go. Before the search party.", nerdy: "Go. Logically, you should.",
    loud: "Go! Go on!", blunt: "Go.", tough: "Go on.", competitive: "Go. Quick.", chaotic: "Go, go, go!", schemer: "Go. I'll cover for you.",
    cruel: "Go. Don't keep the warden waiting.", bossy: "Go. Now.", proud: "Go. I'll be fine on my own.", flirty: "Go on. Don't keep {pa} waiting.",
    anxious: "Go. Do you want me to come?", goofy: "Go. Fly, little bird.", ditzy: "Go! Wait, where?", theatrical: "Go! Away with you!" }),
  T("I'm going to go and shower before the queue starts.", {
    earnest: "I'm going to shower before the queue starts.", warm: "I'm going to grab a shower before it gets busy.", calm: "I'll shower before the queue.", quiet: "Shower. Before the queue.",
    dry: "Going to shower before the stampede.", nerdy: "Shower now. The queue peaks in about ten minutes.", loud: "Shower! Before everyone else gets there!", blunt: "Shower. Before the queue.",
    tough: "Shower. Before the queue.", competitive: "I'm beating everyone to the shower.", chaotic: "Shower! Quick! Before the queue!", schemer: "I'm getting the shower before the queue starts. Timing.",
    cruel: "Shower, before the others use all the hot water.", bossy: "Right. Shower. Nobody else is going first.", proud: "Shower. This doesn't happen by accident.", flirty: "I'm going to get gorgeous before the queue starts.",
    anxious: "I should shower before the queue. I hate rushing.", goofy: "I'm going to shower before the queue. Wish me luck.", ditzy: "I'm going to shower! Is there a queue?", theatrical: "To the shower, before the hordes descend!" }),
  T('Good luck with that.', {
    earnest: "Good luck. Honestly.", warm: "Good luck with that.", calm: "Good luck.", quiet: "Good luck.", dry: "Good luck with that.", nerdy: "Good luck. The odds aren't great.",
    loud: "Good luck with THAT!", blunt: "Not happening.", tough: "Good luck.", competitive: "Good luck. I'll beat you there.", chaotic: "Good luck! You'll need it!", schemer: "Good luck with that.",
    cruel: "Good luck with that. You'll need it.", bossy: "Good luck. Be quick.", proud: "Good luck. I already went.", flirty: "Good luck with that.",
    anxious: "Good luck. Let me know if it's free.", goofy: "Good luck. Godspeed.", ditzy: "Good luck! With what?", theatrical: "Good luck! May the water be hot!" }),
  T('Can I ask you for advice about my couple?', {
    earnest: "Can I ask you for advice about my couple? I trust you.", warm: "Can I ask you something about my couple?", calm: "Can I get your advice about my couple?", quiet: "Can I ask about my couple?",
    dry: "Can I get your advice about my couple?", nerdy: "Can I get your opinion on something? It's about my couple.", loud: "I need advice! About my couple!", blunt: "Advice. About my couple.",
    tough: "Need your advice on something.", competitive: "Can I ask you something about my couple?", chaotic: "Help! Advice! About my couple!", schemer: "Can I ask your advice about my couple? Quietly.",
    cruel: "Can I ask you about my couple? You won't judge.", bossy: "I need your advice. About my couple.", proud: "Can I ask you something about my couple?", flirty: "Can I ask you for advice about my couple?",
    anxious: "Can I ask you about my couple? I'm worried.", goofy: "Can I get your advice about my couple? Agony aunt hours.", ditzy: "Can I ask you about my couple? I'm a bit confused.", theatrical: "I need your wisdom! About my couple!" }),
  T("How do you know if someone's actually into you?", {
    earnest: "How do you know if someone's actually into you?", warm: "How do you know if someone really likes you?", calm: "How do you tell if someone's really into you?", quiet: "How do you know if someone's into you?",
    dry: "How do you actually know someone's into you?", nerdy: "What are the signs someone's really into you?", loud: "How do you know if someone's ACTUALLY into you?!", blunt: "How do you know if someone's into you?",
    tough: "How do you know if someone's into you? Properly?", competitive: "How do you know if you're the one they really want?", chaotic: "How do you know if someone's into you? Is there a test?", schemer: "How can you tell if someone's actually into you, or playing it?",
    cruel: "How do you know if someone's into you, or just bored?", bossy: "Tell me how you know if someone's into you.", proud: "How do you know if someone's really into you? Not that people aren't.", flirty: "How do you know if someone's really into you?",
    anxious: "How do you know if someone's actually into you? I can never tell.", goofy: "How do you know if someone's into you? Do they leave flowers?", ditzy: "How do you know if someone's into you? Is it obvious?", theatrical: "How does anyone ever know if someone's truly into them?" }),
  T("They make time for you. Even in here. Especially in here.", {
    earnest: "They make time for you. Even in here. Especially in here.", warm: "They make time for you. Even in here, they find you.", calm: "They make time for you. Even here.", quiet: "They make time for you.",
    dry: "They make time for you. Even in a villa with nothing to do.", nerdy: "They make time for you. In here, time is the only thing that counts.", loud: "They make time for you! Even in here!", blunt: "They make time for you.",
    tough: "They make time. Simple.", competitive: "They pick you over everyone else. Every time.", chaotic: "They make time! Even in here! Especially here!", schemer: "They make time for you. Watch who they find first.",
    cruel: "They make time for you. If they don't, there's your answer.", bossy: "They make time for you. If they don't, you walk.", proud: "They make time for you. Like people do for me.", flirty: "They come and find you. Every time.",
    anxious: "They make time for you. Even in here. Do they?", goofy: "They make time for you. Even if it's just the toothbrushing queue.", ditzy: "They make time for you! I think that's it.", theatrical: "They make time for you! Even here! Especially here!" }),
  T('I owe you one.', {
    earnest: "I owe you one. Really.", warm: "I owe you one. Thank you.", calm: "I owe you one.", quiet: "I owe you.", dry: "I owe you one.", nerdy: "I owe you one. I'm keeping count.",
    loud: "I owe you one! Big time!", blunt: "I owe you.", tough: "I owe you.", competitive: "I owe you one. I'll pay it back double.", chaotic: "I owe you one! Or ten!", schemer: "I owe you one. I won't forget.",
    cruel: "I owe you one. Don't get used to it.", bossy: "I owe you one. Remind me.", proud: "I owe you one. Rare, that.", flirty: "I owe you one. I'll make it worth it.",
    anxious: "I owe you one. I feel bad.", goofy: "I owe you one. IOU, one favour.", ditzy: "I owe you one! What did you do again?", theatrical: "I owe you my life!" }),
  T('You owe me about six.', {
    earnest: "You owe me a few, to be fair.", warm: "You owe me about six. I don't mind.", calm: "You owe me about six.", quiet: "About six.", dry: "You owe me about six.", nerdy: "You owe me six. I've been counting.",
    loud: "You owe me about SIX!", blunt: "You owe me six.", tough: "You owe me six.", competitive: "Six. You owe me six.", chaotic: "Six! At least six! Maybe seven!", schemer: "You owe me about six. I'll collect.",
    cruel: "You owe me about six. I keep a list.", bossy: "You owe me six. I'll be collecting.", proud: "You owe me about six. I'm very generous.", flirty: "You owe me about six. I'll think of ways.",
    anxious: "You owe me a few. Not that I'm counting.", goofy: "You owe me about six. Seven with interest.", ditzy: "You owe me… six? Or something?", theatrical: "You owe me six! A debt of honour!" }),
  T("Come on, I'm starving.", {
    earnest: "Come on, I'm starving.", warm: "Come on, I'm starving. Come with me.", calm: "I'm starving. Come on.", quiet: "Hungry. Come on.", dry: "I'm starving. Come on.", nerdy: "I'm starving. I haven't eaten since breakfast.",
    loud: "Come ON, I'm starving!", blunt: "I'm starving. Come on.", tough: "Starving. Come on.", competitive: "Come on, before everyone eats it all.", chaotic: "I'm starving! Food! Now!", schemer: "Come on. I'm starving. We can talk on the way.",
    cruel: "Come on. I'm starving, and you're slow.", bossy: "Kitchen. Now. I'm starving.", proud: "Come on, I'm starving. Even I need to eat.", flirty: "Come on, I'm starving. Keep me company.",
    anxious: "I'm starving. Will you come with me?", goofy: "Come on, I'm starving. I could eat a horse.", ditzy: "I'm starving! When did I last eat?", theatrical: "I am starving! I may faint!" }),
  T("You're always starving.", {
    earnest: "You're always starving.", warm: "You're always starving, you.", calm: "You're always starving.", quiet: "Always starving.", dry: "You're always starving.", nerdy: "You're always starving. It's a pattern.",
    loud: "You're ALWAYS starving!", blunt: "You're always starving.", tough: "Always.", competitive: "You're always starving.", chaotic: "Always! You're always starving!", schemer: "You're always starving.",
    cruel: "You're always starving. Bottomless pit.", bossy: "You're always starving. Eat more at breakfast.", proud: "You're always starving.", flirty: "You're always starving.",
    anxious: "You're always starving. Are you eating enough?", goofy: "You're always starving. You're a bottomless pit.", ditzy: "Are you always starving?", theatrical: "You are perpetually starving!" }),
  T('And you always come with me.', {
    earnest: "And you always come with me.", warm: "And you always come with me.", calm: "And you always come.", quiet: "And you come.", dry: "And you always come with me.", nerdy: "And you come with me every single time.",
    loud: "And you ALWAYS come with me!", blunt: "And you always come.", tough: "And you come.", competitive: "And you always come. So you're starving too.", chaotic: "And you always come! Every time!", schemer: "And you always come with me. Interesting.",
    cruel: "And you always tag along.", bossy: "And you always come. So come on.", proud: "And you always come with me. Can't blame you.", flirty: "And you always come with me.",
    anxious: "And you always come with me. You don't mind, do you?", goofy: "And you always come. You're my snack buddy.", ditzy: "And you always come! Wait, do you?", theatrical: "And yet you always follow me!" }),
  T('Right, come on. The others are waiting.', {
    earnest: "Come on. The others are waiting for us.", warm: "Come on, the others are waiting.", calm: "Come on. They're waiting.", quiet: "They're waiting.", dry: "Come on. The others are waiting.", nerdy: "Come on. We said we'd be five minutes. It's been twenty.",
    loud: "Come ON! The others are waiting!", blunt: "Come on. They're waiting.", tough: "Come on. Up.", competitive: "Come on, we're last.", chaotic: "Come on, come on, come on! Everyone's waiting!", schemer: "Come on. We don't want them talking without us.",
    cruel: "Come on. Even the slow ones are there already.", bossy: "Right. Up. The others are waiting.", proud: "Come on. They can't start without me.", flirty: "Come on, they're waiting. You can lie here later.",
    anxious: "Come on, the others are waiting. They'll think we're rude.", goofy: "Come on. The others are waiting. They've probably started a search party.", ditzy: "Come on! Wait, where are the others?", theatrical: "Come! The others await!" }),
  T("Two minutes. I'm comfortable.", {
    earnest: "Two minutes. I'm really comfortable.", warm: "Two more minutes. It's so nice here.", calm: "Two minutes.", quiet: "Two minutes.", dry: "Two minutes. I'm comfortable.", nerdy: "Two minutes. I've found the perfect angle.",
    loud: "Two minutes! I'm comfy!", blunt: "Two minutes.", tough: "Two minutes.", competitive: "Two minutes. I'll still beat you there.", chaotic: "Two minutes! Or three! It's so comfy!", schemer: "Two minutes. Let them wait.",
    cruel: "Two minutes. They can wait.", bossy: "Two minutes. Then I'll come.", proud: "Two minutes. Worth waiting for.", flirty: "Two minutes. Join me?",
    anxious: "Two minutes? Is that okay?", goofy: "Two minutes. I've become one with the sunbed.", ditzy: "Two minutes! I'm so comfy!", theatrical: "Two minutes! I cannot leave this perfect spot!" }),
  T("Promise me we'll still do this when we're out.", {
    earnest: "Promise me we'll still do this when we're out.", warm: "Promise me we'll still do this when we're home.", calm: "We'll still do this when we're out.", quiet: "We'll still do this? Outside?",
    dry: "We're still doing this when we're out. Promise.", nerdy: "Promise me we'll still do this when we're out. Weekly.", loud: "Promise me we'll still do this when we're out!", blunt: "We do this outside. Promise.",
    tough: "We still do this outside. Yeah?", competitive: "Promise me we'll still do this when we're out. Best friends.", chaotic: "Promise me! Outside! We still do this!", schemer: "Promise me we'll still do this when we're out. Just us.",
    cruel: "Promise we'll still do this outside. I don't like many people.", bossy: "We're doing this when we're out. Promise me.", proud: "Promise me we'll still do this. You won't find better.", flirty: "Promise me we'll still do this when we're out.",
    anxious: "Promise me we'll still do this when we're out? You won't drift?", goofy: "Promise me we'll still do this outside. Same sunbed, different country.", ditzy: "We'll still do this when we're out, right?", theatrical: "Swear to me we'll still do this on the outside!" }),
  T('Every week.', {
    earnest: "Every week. I promise.", warm: "Every single week.", calm: "Every week.", quiet: "Every week.", dry: "Every week.", nerdy: "Every week. I'll put it in my calendar.",
    loud: "Every week! At least!", blunt: "Every week.", tough: "Every week.", competitive: "Every week. More than anyone.", chaotic: "Every week! Every day!", schemer: "Every week.",
    cruel: "Every week. Whether you like it or not.", bossy: "Every week. No excuses.", proud: "Every week. You're lucky.", flirty: "Every week.",
    anxious: "Every week. If you still want to.", goofy: "Every week. Tuesdays. Bring snacks.", ditzy: "Every week! What day is it?", theatrical: "Every week! Forever!" }),
  T("You're a good friend, you know.", {
    earnest: "You're a really good friend. You know that?", warm: "You're such a good friend. You know that?", calm: "You're a good friend.", quiet: "Good friend, you.",
    dry: "You're a good friend, you know.", nerdy: "You're a good friend. One of the best I've had.", loud: "You're SUCH a good friend!", blunt: "You're a good friend.",
    tough: "You're solid. Good friend.", competitive: "You're the best friend in here. By a mile.", chaotic: "You're a good friend! The best!", schemer: "You're a good friend. I don't say that about many.",
    cruel: "You're a good friend. Which is rare in here.", bossy: "You're a good friend. Remember that.", proud: "You're a good friend. You've got good taste.", flirty: "You're a good friend. My favourite.",
    anxious: "You're a good friend. I don't know what I'd do without you.", goofy: "You're a good friend. Ten out of ten. Would befriend again.", ditzy: "You're a good friend! The best!", theatrical: "You are the best friend anyone could ask for!" }),
  T("So are you. Now stop, or I'll cry.", {
    earnest: "So are you. Stop, or I'll cry.", warm: "So are you. Stop it, you'll make me cry.", calm: "So are you.", quiet: "So are you.",
    dry: "So are you. Stop now.", nerdy: "So are you. Now stop before this gets emotional.", loud: "So are you! Stop it, I'll cry!", blunt: "So are you. Stop.",
    tough: "So are you. Don't get soft on me.", competitive: "So are you. Second best.", chaotic: "So are you! Stop! I'm crying!", schemer: "So are you. Don't tell anyone I said that.",
    cruel: "So are you. Don't let it go to your head.", bossy: "So are you. Now stop.", proud: "So are you. Almost as good as me.", flirty: "So are you. Stop it, you're making me blush.",
    anxious: "So are you. Stop, or I'll cry, and I don't want to cry on camera.", goofy: "So are you. Stop, or I'll cry. Ugly crying.", ditzy: "So are you! Am I crying?", theatrical: "So are you! Stop, or the tears will flow!" }),
  T("You know you're allowed to be sad in here, right?", {
    earnest: "You know you're allowed to be sad in here, right?", warm: "You're allowed to be sad in here. You know that?", calm: "It's okay to be sad in here.", quiet: "You can be sad, you know.",
    dry: "You are allowed to be sad in here.", nerdy: "Being sad in here is completely normal, you know.", loud: "You're allowed to be sad in here! It's okay!", blunt: "You can be sad. It's fine.",
    tough: "You're allowed to be sad. Doesn't make you weak.", competitive: "Being sad isn't losing. You know that, right?", chaotic: "You can be sad! Be sad! It's allowed!", schemer: "You can be sad in here. Just pick who sees it.",
    cruel: "You're allowed to be sad, you know. Everyone's noticed anyway.", bossy: "You're allowed to be sad. So be sad. I'm here.", proud: "You're allowed to be sad in here. Even I am, sometimes.", flirty: "You're allowed to be sad in here, you know.",
    anxious: "You're allowed to be sad in here. I am, all the time.", goofy: "You're allowed to be sad in here. Sad's allowed. It's in the rules.", ditzy: "Are you allowed to be sad in here? Yes! You are!", theatrical: "You're allowed to be sad! Weep if you must!" }),
  T("I know. I just don't want to be sad on camera.", {
    earnest: "I know. I just don't want to be sad on camera.", warm: "I know. I just don't want my family seeing me sad.", calm: "I know. Not on camera, though.", quiet: "Not on camera.",
    dry: "I know. I'd just rather not do it on camera.", nerdy: "I know. I just don't want the whole country watching me cry.", loud: "I know! I just don't want to cry on camera!", blunt: "I know. Not on camera.",
    tough: "I know. Not on camera.", competitive: "I know. I just don't want anyone seeing me down.", chaotic: "I know! But the cameras! Everywhere!", schemer: "I know. I just don't want them seeing it.",
    cruel: "I know. I'm not giving them the satisfaction.", bossy: "I know. I just won't do it on camera.", proud: "I know. I just don't do sad on camera.", flirty: "I know. I'd rather look good on camera.",
    anxious: "I know. I'm just scared of how it'll look.", goofy: "I know. My crying face isn't camera-ready.", ditzy: "I know. Wait, is that camera on?", theatrical: "I know. But not for the cameras, never for the cameras!" }),
  T("Is it bad that I sometimes want a break from my couple?", {
    earnest: "Is it bad that I sometimes want a break from my couple?", warm: "Is it bad I need a break from my couple sometimes?", calm: "Is it bad to want a break from my couple?", quiet: "Bad to want a break? From my couple?",
    dry: "Is it bad that I want a break from my couple sometimes?", nerdy: "Is it normal to want time apart from my couple?", loud: "Is it bad that I need a break from my couple sometimes?!", blunt: "Sometimes I need a break from my couple. Bad?",
    tough: "Sometimes I need a break from my couple. That's normal, yeah?", competitive: "Is it bad I want a break from my couple? Everyone else is all over each other.", chaotic: "Is it bad I want a break from my couple? I just need air!", schemer: "Is it bad that I want a break? Just between us.",
    cruel: "Is it bad I want a break from my couple? They're a lot.", bossy: "I need a break from my couple sometimes. Is that bad?", proud: "Is it bad I want a break? I need my own space.", flirty: "Is it bad I want a break from my couple sometimes?",
    anxious: "Is it bad that I want a break from my couple? Does that mean something's wrong?", goofy: "Is it bad I want a break from my couple? Even I need a break from me.", ditzy: "Is it bad I want a break from my couple? Is that a thing?", theatrical: "Is it terrible that I need a break from my couple?" }),
  T("No. That's what I'm for.", {
    earnest: "No. That's what I'm here for.", warm: "No. That's what I'm here for, silly.", calm: "No. That's what I'm for.", quiet: "No. I'm here.",
    dry: "No. That's what I'm for.", nerdy: "No. That's literally what friends are for.", loud: "No! That's what I'm for!", blunt: "No. That's what I'm for.",
    tough: "Nah. That's what I'm here for.", competitive: "No. I'm the best break in the villa.", chaotic: "No! That's what I'm for! Come here!", schemer: "No. That's what I'm for. Come and talk.",
    cruel: "No. That's what I'm for. They'd drive anyone mad.", bossy: "No. That's what I'm for. Sit.", proud: "No. That's what I'm for. Best company in here.", flirty: "No. That's what I'm for.",
    anxious: "No. That's what I'm for. Is it okay that I'm for that?", goofy: "No. That's what I'm for. Professional escape.", ditzy: "No! That's what I'm for, I think!", theatrical: "No! That is what I exist for!" }),
  T("If you need me, you know where I am.", {
    earnest: "If you need me, you know where I am.", warm: "If you need me, you know where I am. Any time.", calm: "You know where I am.", quiet: "You know where I am.",
    dry: "If you need me, you know where I am.", nerdy: "If you need me, I'll be exactly where I always am.", loud: "If you need me, you know where I am!", blunt: "Need me, find me.",
    tough: "Need me, you know where I am.", competitive: "If you need me, I'm here. Always first.", chaotic: "If you need me! You know where! Somewhere!", schemer: "If you need me, you know where I am. I'll keep my ears open.",
    cruel: "If you need me, you know where I am. Don't make a habit of it.", bossy: "If you need me, come and find me. Don't hesitate.", proud: "If you need me, I'm on my sunbed. As always.", flirty: "If you need me, you know where I am.",
    anxious: "If you need me, you know where I am. Please come and find me.", goofy: "If you need me, you know where I am. Horizontal.", ditzy: "If you need me… where am I usually?", theatrical: "If you need me, I am always, always here!" }),
  T('On that sunbed, all day.', {
    earnest: "On that sunbed, all day.", warm: "On that sunbed, all day. Saving you a spot.", calm: "On that sunbed.", quiet: "The sunbed.",
    dry: "On that sunbed. All day.", nerdy: "On that sunbed, from ten until dinner.", loud: "On that sunbed all day!", blunt: "Sunbed.",
    tough: "Sunbed. All day.", competitive: "On the best sunbed. All day.", chaotic: "On that sunbed! Or the pool! Somewhere!", schemer: "On that sunbed. Watching.",
    cruel: "On that sunbed, all day. Where else?", bossy: "On that sunbed. Don't let anyone take it.", proud: "On my sunbed, all day.", flirty: "On that sunbed, all day. Looking good.",
    anxious: "On that sunbed, all day. Unless I'm needed.", goofy: "On that sunbed, all day. I'm basically furniture.", ditzy: "On a sunbed! Which one is mine?", theatrical: "On that sunbed, all day, like royalty!" }),
  T('Right. I\'m going to get ready. Come and do my hair?', {
    earnest: "I'm going to get ready. Will you do my hair?", warm: "I'm going to get ready. Come and do my hair?", calm: "Getting ready. Do my hair?", quiet: "Do my hair?",
    dry: "Getting ready. Do my hair?", nerdy: "Getting ready. Can you do my hair? You're better at it.", loud: "Getting ready! Come and do my hair!", blunt: "Do my hair.",
    tough: "Getting ready. Do my hair.", competitive: "Getting ready. Do my hair so I look best tonight.", chaotic: "Getting ready! Hair! Help!", schemer: "Come and do my hair. We can talk.",
    cruel: "Getting ready. Do my hair, you're better at it than me. Just about.", bossy: "Getting ready. You're doing my hair.", proud: "Getting ready. Come and do my hair. Make it perfect.", flirty: "Getting ready. Come and do my hair?",
    anxious: "Getting ready. Would you do my hair? I always mess it up.", goofy: "Getting ready. Come and do my hair. It's an emergency.", ditzy: "Getting ready! Can you do my hair? I forgot how.", theatrical: "I must get ready! Come and do my hair!" }),
  T('Only if you do mine.', {
    earnest: "Only if you do mine.", warm: "Only if I can do yours after.", calm: "Only if you do mine.", quiet: "If you do mine.",
    dry: "Only if you do mine.", nerdy: "Fair trade. You do mine.", loud: "Only if you do mine!", blunt: "You do mine.",
    tough: "You do mine.", competitive: "Only if you do mine better.", chaotic: "Only if you do mine! Swap!", schemer: "Only if you do mine.",
    cruel: "Only if you do mine. Properly, this time.", bossy: "Only if you do mine first.", proud: "Only if you do mine. It's harder.", flirty: "Only if you do mine.",
    anxious: "Only if you do mine? If you don't mind.", goofy: "Only if you do mine. Hair swap.", ditzy: "Only if you do mine! Wait, mine's done?", theatrical: "Only if you return the favour!" }),
  T("Double date when we get out? Us, {pa} and {pb}.", {
    earnest: "Double date when we get out? Us, {pa} and {pb}.", warm: "Double date when we're out? You, me, {pa} and {pb}.", calm: "Double date when we're out? Us, {pa}, {pb}.", quiet: "Double date? Outside?",
    dry: "Double date when we're out. Us, {pa} and {pb}.", nerdy: "When we get out: double date. Us, {pa} and {pb}.", loud: "DOUBLE DATE when we get out! Us, {pa} and {pb}!", blunt: "Double date. Outside. Us, {pa}, {pb}.",
    tough: "Double date when we're out. Us four.", competitive: "Double date when we get out. Best couples in here.", chaotic: "Double date! Outside! Us, {pa}, {pb}! Yes!", schemer: "Double date when we're out. Us, {pa} and {pb}.",
    cruel: "Double date when we're out. If {pb} lasts that long.", bossy: "Double date when we get out. It's happening.", proud: "Double date when we're out. We'll be the best-looking table.", flirty: "Double date when we get out? Us, {pa} and {pb}.",
    anxious: "Double date when we get out? If we're still together, I mean.", goofy: "Double date when we get out? Us, {pa}, {pb}, and a big pizza.", ditzy: "Double date when we get out! With {pa} and… {pb}!", theatrical: "A double date, on the outside! Us, {pa} and {pb}!" }),
  T("{pb} would love that. {pb} loves you.", {
    earnest: "{pb} would love that. {pb} really likes you.", warm: "{pb} would love that. {pb} adores you.", calm: "{pb} would love that.", quiet: "{pb} would love that.",
    dry: "{pb} would love that. {pb} likes you more than me.", nerdy: "{pb} would love that. {pb} talks about you constantly.", loud: "{pb} would LOVE that! {pb} loves you!", blunt: "{pb} would love it.",
    tough: "{pb}'s in. {pb} rates you.", competitive: "{pb} would love that. {pb} likes you almost as much as me.", chaotic: "{pb} would love that! {pb} loves you! Everyone loves you!", schemer: "{pb} would love that. {pb} likes you a lot.",
    cruel: "{pb} would love that. {pb} likes everyone.", bossy: "{pb} would love that. Done.", proud: "{pb} would love that. Of course {pb} likes my friends.", flirty: "{pb} would love that. {pb} loves you.",
    anxious: "{pb} would love that. I think. Yeah.", goofy: "{pb} would love that. {pb} would marry you if I let {pb.obj}.", ditzy: "{pb} would love that! {pb} loves everyone!", theatrical: "{pb} would adore that! {pb} worships you!" }),
  T('Everyone loves me.', {
    earnest: "That's nice of {pb}.", warm: "Aw. Everyone's lovely.", calm: "Everyone loves me.", quiet: "Everyone does.",
    dry: "Everyone loves me. It's a burden.", nerdy: "Everyone loves me. Statistically.", loud: "Everyone LOVES me!", blunt: "Everyone loves me.",
    tough: "Of course they do.", competitive: "Everyone loves me. Most in the villa.", chaotic: "Everyone loves me! Everyone!", schemer: "Everyone loves me. That's the idea.",
    cruel: "Everyone loves me. Some more than others.", bossy: "Everyone loves me. Naturally.", proud: "Everyone loves me. Obviously.", flirty: "Everyone loves me. Can you blame them?",
    anxious: "Everyone loves me? Really?", goofy: "Everyone loves me. I'm a delight.", ditzy: "Everyone loves me? Aw!", theatrical: "Everyone adores me! As they should!" }),
  T('They do, to be fair.', {
    earnest: "They do, honestly.", warm: "They do. You're easy to love.", calm: "They do.", quiet: "They do.",
    dry: "They do, to be fair. Annoyingly.", nerdy: "They do. I've noticed it.", loud: "They do! Everyone loves you!", blunt: "They do.",
    tough: "They do.", competitive: "They do. Second to me.", chaotic: "They do! It's mad!", schemer: "They do, to be fair. Useful.",
    cruel: "They do, to be fair. No idea why.", bossy: "They do. Don't let it go to your head.", proud: "They do. Almost as much as me.", flirty: "They do, to be fair. Can't blame them.",
    anxious: "They do. Everyone loves you.", goofy: "They do, to be fair. It's sickening.", ditzy: "They do? They do!", theatrical: "They do! The whole villa adores you!" }),
  T("I told {b} because {b} deserved to know. And because it doesn't hurt me if that couple goes.", {
    earnest: "I told {b} because {b} deserved to know. And I'll be honest, it doesn't hurt me if that couple goes.", warm: "I told {b} because {b} deserved to know. And if that couple goes, well, that's not my problem.",
    calm: "I told {b}. {b} deserved to know, and it doesn't hurt me if that couple goes.", quiet: "{b} deserved to know. And it doesn't hurt me.", dry: "I told {b} because {b} deserved to know. Also, that couple going costs me nothing.",
    nerdy: "{b} deserved to know. And, practically, that couple going doesn't hurt my position.", loud: "I told {b} because {b} deserved to know! And if that couple goes, so what?", blunt: "{b} deserved to know. And that couple going suits me.",
    tough: "{b} needed to know. If that couple goes, not my loss.", competitive: "I told {b}. {b} deserved to know, and one less couple is one less threat.", chaotic: "I told {b}! {b} deserved to know! And if that couple goes, whatever!",
    schemer: "I told {b} because {b} deserved to know. And because that couple going works out nicely for me.", cruel: "I told {b} because {b} deserved to know. And if it blows that couple up, I won't cry.", bossy: "I told {b}. {b} needed to know, and that couple going is fine by me.",
    proud: "I told {b} because I'm honest. And that couple going doesn't hurt me one bit.", flirty: "I told {b}. {b} deserved to know. And if that couple goes, more options for me.", anxious: "I told {b} because {b} deserved to know. And, I mean, it doesn't hurt me if they go. Is that awful?",
    goofy: "I told {b} because {b} deserved to know. And if that couple goes, I won't be at the funeral.", ditzy: "I told {b} because {b} should know! And if they go, well, they go.", theatrical: "I told {b}! {b} deserved the truth! And if that couple falls, so be it!" }),
];
