// Voice versions, batch 6b: the Hangout, typed (two Influencers on one name: keep, or cut for a reason). The other
// Influencer answers the line, so every version keeps its meaning and its question. Typed the way the voice types
// (batch4b.js). No brand names anywhere.
export const VOICES = [
  // ── keep: nothing against them ────────────────────────────────────────
  ['hangout.view.noBond.keep.m01', "Honestly, {c} hasn't done anything to either of us", {
    hype: "HONESTLY, {c} hasn't done ANYTHING to either of us!!", dry: "honestly, {c} hasn't done anything to either of us", blunt: "{c} hasn't done anything to us",
    goofy: "Honestly, {c} hasn't done anything to either of us!! {c} is basically a houseplant", shy: "Honestly, {c} hasn't really done anything to either of us", chill: "honestly, {c} hasn't done anything to either of us",
    catty: "Honestly, {c} hasn't done anything to either of us. Yet", diva: "Honestly, darling, {c} has done nothing to either of us", stoic: "{c} did nothing to us" }],
  ['hangout.view.noBond.keep.m02', "{c}? I don't see it. Do you?", {
    hype: "{c}?? I don't SEE it!! Do YOU??", dry: "{c}? i don't see it. do you", blunt: "{c}? Don't see it. You?",
    goofy: "{c}? I don't see it. Do you? I'm squinting. Still nothing", shy: "{c}? I don't really see it. Do you?", chill: "{c}? I don't see it. do you?",
    catty: "{c}? I don't see it. Do you? Convince me", diva: "{c}, darling? I don't see it. Do you?", stoic: "{c}? Don't see it" }],
  ['hangout.view.noBond.keep.m03', "Let's not waste a block on {c}", {
    hype: "Let's NOT waste a block on {c}!!", dry: "let's not waste a block on {c}", blunt: "Don't waste a block on {c}",
    goofy: "Let's not waste a block on {c}!! Blocks are precious. Like the last cookie", shy: "Let's not waste a block on {c}", chill: "let's not waste a block on {c}",
    catty: "Let's not waste a block on {c}. Save it for someone who matters", diva: "Let's not squander a block on {c}, darling", stoic: "Not a block on {c}" }],
  ['hangout.view.noBond.keep.m04', "What's your read on {c}?", {
    hype: "What's your READ on {c}??", dry: "what's your read on {c}", blunt: "Your read on {c}?",
    goofy: "What's your read on {c}? Mine is a picture book. A confusing one", shy: "What's your read on {c}?", chill: "what's your read on {c}?",
    catty: "What's your read on {c}? Be honest", diva: "What's your read on {c}, darling?", stoic: "{c}?" }],
  ['hangout.view.noBond.keep.m05', "I actually like {c}. Can we keep {c.obj} out of this?", {
    hype: "I ACTUALLY like {c}!! Can we keep {c.obj} OUT of this??", dry: "i actually like {c}. can we keep {c.obj} out of this", blunt: "I like {c}. Keep {c.obj} out of it",
    goofy: "I actually like {c}!! Can we keep {c.obj} out of this? Wrap {c.obj} in bubble wrap?", shy: "I actually like {c}. Can we keep {c.obj} out of this?", chill: "I actually like {c}. can we keep {c.obj} out of this?",
    catty: "I actually like {c}. Can we keep {c.obj} out of this? That's rare for me", diva: "I'm fond of {c}, darling. Can we keep {c.obj} out of this?", stoic: "I like {c}. Leave {c.obj} out" }],
  ['hangout.view.noBond.keep.01', "What about {c}?", {
    hype: "What about {c}??", dry: "what about {c}", blunt: "{c}?",
    goofy: "What about {c}? Just floating it. Like a balloon", shy: "What about {c}?", chill: "what about {c}?",
    catty: "What about {c}?", diva: "And {c}, darling?", stoic: "{c}?" }],
  ['hangout.view.noBond.keep.02', "I'm protecting {c}. Not negotiable", {
    hype: "I'm PROTECTING {c}!! NOT negotiable {e:muscle}", dry: "i'm protecting {c}. not negotiable", blunt: "{c} is protected. Final",
    goofy: "I'm protecting {c}!! Not negotiable. I'm a human shield. A soft one", shy: "I'm protecting {c}. Sorry, it's not negotiable", chill: "I'm protecting {c}. not negotiable",
    catty: "I'm protecting {c}. Not negotiable. Don't push it", diva: "I'm protecting {c}, darling. That's final", stoic: "Protecting {c}. Final" }],
  ['hangout.view.noBond.keep.03', "Not {c}. {c.Sub}'s been good to me", {
    hype: "NOT {c}!! {c.Sub}'s been SO good to me", dry: "not {c}. {c.sub}'s been good to me", blunt: "Not {c}. {c.Sub}'s good to me",
    goofy: "Not {c}!! {c.Sub}'s been good to me. {c.Sub} gave me a virtual hug once", shy: "Not {c}. {c.Sub}'s been really good to me", chill: "not {c}. {c.sub}'s been good to me",
    catty: "Not {c}. {c.Sub}'s been good to me. Few have", diva: "Not {c}, darling. {c.Sub}'s been good to me", stoic: "Not {c}. Good to me" }],
  ['hangout.view.noBond.keep.04', "Can we take {c} off the table? {c.Sub}'s not a threat to either of us", {
    hype: "Can we take {c} OFF THE TABLE?? {c.Sub}'s NOT a threat to either of us", dry: "can we take {c} off the table. {c.sub}'s not a threat to either of us", blunt: "Take {c} off the table. Not a threat",
    goofy: "Can we take {c} off the table? {c.Sub}'s not a threat to either of us. {c.Sub}'s a teddy bear", shy: "Can we take {c} off the table? {c.Sub}'s not a threat to either of us", chill: "can we take {c} off the table? {c.sub}'s not a threat to either of us",
    catty: "Can we take {c} off the table? {c.Sub}'s not a threat to either of us. Barely a factor", diva: "Can we set {c} aside, darling? {c.Sub}'s no threat to us", stoic: "{c}. Off the table. No threat" }],
  ['hangout.view.noBond.keep.05', "Where are you at with {c}?", {
    hype: "Where are you AT with {c}??", dry: "where are you at with {c}", blunt: "Where are you with {c}?",
    goofy: "Where are you at with {c}? Like, emotionally? Spiritually?", shy: "Where are you at with {c}?", chill: "where you at with {c}?",
    catty: "Where are you at with {c}? Honestly", diva: "Where do you stand with {c}, darling?", stoic: "You and {c}?" }],
  ['hangout.view.noBond.keep.06', "{c} has been nothing but sweet to me. I can't", {
    hype: "{c} has been NOTHING but sweet to me!! I CAN'T", dry: "{c} has been nothing but sweet to me. i can't", blunt: "{c}'s been sweet to me. Can't",
    goofy: "{c} has been nothing but sweet to me!! I can't. It'd be like kicking a kitten", shy: "{c} has been nothing but sweet to me. I can't", chill: "{c}'s been nothing but sweet to me. I can't",
    catty: "{c} has been nothing but sweet to me. I can't. Not this one", diva: "{c} has been nothing but sweet to me, darling. I can't", stoic: "{c}'s sweet to me. Can't" }],
  ['hangout.view.noBond.keep.07', "{c} is one of my closest in here honestly", {
    hype: "{c} is one of my CLOSEST in here honestly!!", dry: "{c} is one of my closest in here. honestly", blunt: "{c}'s one of my closest",
    goofy: "{c} is one of my closest in here honestly!! We're like two peas. In a pod", shy: "{c} is one of my closest in here, honestly", chill: "{c}'s one of my closest in here honestly",
    catty: "{c} is one of my closest in here honestly. I don't have many", diva: "{c} is one of my dearest in here, darling", stoic: "{c}'s close to me" }],
  ['hangout.view.noBond.keep.08', "I don't think {c} is coming for either of us", {
    hype: "I DON'T think {c} is coming for EITHER of us!!", dry: "i don't think {c} is coming for either of us", blunt: "{c} isn't coming for us",
    goofy: "I don't think {c} is coming for either of us!! {c} is coming for the snacks, maybe", shy: "I don't think {c} is coming for either of us", chill: "don't think {c}'s coming for either of us",
    catty: "I don't think {c} is coming for either of us. {c} wouldn't know how", diva: "I don't think {c} is coming for us, darling", stoic: "{c} isn't coming for us" }],
  ['hangout.view.noBond.keep.09', "{c} is a no for me. I'd never", {
    hype: "{c} is a NO for me!! I'd NEVER", dry: "{c} is a no for me. i'd never", blunt: "{c} is a no",
    goofy: "{c} is a no for me!! I'd never. Never ever. Not in a million snacks", shy: "{c} is a no for me. I'd never", chill: "{c}'s a no for me. I'd never",
    catty: "{c} is a no for me. I'd never. Pick again", diva: "{c} is a no for me, darling. Never", stoic: "{c}. No" }],
  ['hangout.view.noBond.keep.10', "What do we think about {c}?", {
    hype: "What do we THINK about {c}??", dry: "what do we think about {c}", blunt: "What about {c}?",
    goofy: "What do we think about {c}? I think {c} has nice hair. Next", shy: "What do we think about {c}?", chill: "what do we think about {c}?",
    catty: "What do we think about {c}? I know what I think", diva: "What do we think of {c}, darling?", stoic: "{c}?" }],
  ['hangout.view.noBond.keep.11', "{c} and I talk every day. I'd feel sick blocking {c}", {
    hype: "{c} and I talk EVERY DAY!! I'd feel SICK blocking {c}", dry: "{c} and i talk every day. i'd feel sick blocking {c}", blunt: "I talk to {c} daily. Can't block {c}",
    goofy: "{c} and I talk every day!! I'd feel sick blocking {c}. Like too-much-cake sick", shy: "{c} and I talk every day. I'd feel sick blocking {c}", chill: "{c} and I talk every day. I'd feel sick blocking {c}",
    catty: "{c} and I talk every day. I'd feel sick blocking {c}. That's a first for me", diva: "{c} and I talk every day, darling. I'd feel ill blocking {c}", stoic: "We talk daily. Can't block {c}" }],
  ['hangout.view.noBond.keep.12', "Right? It feels wrong even saying the name", {
    hype: "RIGHT?? It feels WRONG even saying the name!!", dry: "right. it feels wrong even saying the name", blunt: "Feels wrong saying it",
    goofy: "Right? It feels wrong even saying the name!! My mouth went 'no thank you'", shy: "Right? It feels wrong even saying the name", chill: "right? feels wrong even saying the name",
    catty: "Right? It feels wrong even saying the name. That's how you know", diva: "Right, darling? It feels wrong even saying the name", stoic: "Feels wrong" }],
  ['hangout.view.noBond.keep.13', "Let's keep {c}. I think {c} could be really loyal to us after this {e:eyes}", {
    hype: "Let's KEEP {c}!! {c} could be REALLY loyal to us after this {e:eyes}", dry: "let's keep {c}. i think {c} could be really loyal to us after this", blunt: "Keep {c}. {c} could be loyal after this",
    goofy: "Let's keep {c}!! I think {c} could be really loyal to us after this. Like a puppy {e:eyes}", shy: "Let's keep {c}. I think {c} could be really loyal to us after this {e:eyes}", chill: "let's keep {c}. I think {c} could be really loyal to us after this {e:eyes}",
    catty: "Let's keep {c}. {c} owes us after this. That's useful {e:eyes}", diva: "Let's keep {c}, darling. {c} would be loyal to us after this {e:eyes}", stoic: "Keep {c}. Loyal after" }],
  ['hangout.view.noBond.keep.14', "{c} is kind of harmless, right?", {
    hype: "{c} is KIND OF harmless, right??", dry: "{c} is kind of harmless. right", blunt: "{c}'s harmless, right?",
    goofy: "{c} is kind of harmless, right? Like a bunny. A bunny with a profile", shy: "{c} is kind of harmless, right?", chill: "{c}'s kind of harmless, right?",
    catty: "{c} is kind of harmless, right? Painfully harmless", diva: "{c} is rather harmless, isn't {c.sub}, darling?", stoic: "{c}'s harmless?" }],
  ['hangout.view.noBond.keep.15', "Nope. Next", {
    hype: "NOPE!! NEXT!!", dry: "nope. next", blunt: "No. Next",
    goofy: "Nope!! Next!! Next next next", shy: "Nope. Next", chill: "nope. next",
    catty: "Nope. Next", diva: "No, darling. Next", stoic: "Next" }],
  ['hangout.view.noBond.keep.16', "{c} has had my back in here. I'm not forgetting that", {
    hype: "{c} has HAD MY BACK in here!! I'm NOT forgetting that", dry: "{c} has had my back in here. i'm not forgetting that", blunt: "{c}'s had my back. Not forgetting",
    goofy: "{c} has had my back in here!! I'm not forgetting that. I wrote it on my hand", shy: "{c} has had my back in here. I'm not forgetting that", chill: "{c}'s had my back in here. not forgetting that",
    catty: "{c} has had my back in here. I'm not forgetting that. I never forget", diva: "{c} has had my back, darling. I won't forget that", stoic: "{c} had my back" }],
  // ── cut: something doesn't feel real ──────────────────────────────────
  ['hangout.view.fake.cut.01', "Can I be real? Something about {c} doesn't feel real to me", {
    hype: "Can I be REAL?? Something about {c} DOESN'T feel real to me", dry: "can i be real. something about {c} doesn't feel real to me", blunt: "{c} doesn't feel real",
    goofy: "Can I be real? Something about {c} doesn't feel real to me. Like a cardboard cutout", shy: "Can I be real? Something about {c} doesn't feel real to me", chill: "can I be real? something about {c} doesn't feel real to me",
    catty: "Can I be real? Something about {c} doesn't feel real to me. Never has {e:side}", diva: "May I be honest, darling? {c} doesn't feel real to me", stoic: "{c} doesn't feel real" }],
  ['hangout.view.fake.cut.02', "What's your read on {c}?", {
    hype: "What's your READ on {c}??", dry: "what's your read on {c}", blunt: "Your read on {c}?",
    goofy: "What's your read on {c}? My read has some missing pages", shy: "What's your read on {c}?", chill: "what's your read on {c}?",
    catty: "What's your read on {c}? Because mine isn't good", diva: "What's your read on {c}, darling?", stoic: "{c}?" }],
  ['hangout.view.fake.cut.03', "My gut says {c} is not who {c.sub} says {c.sub} is", {
    hype: "My GUT says {c} is NOT who {c.sub} says {c.sub} is!!", dry: "my gut says {c} is not who {c.sub} says {c.sub} is", blunt: "{c} isn't who {c.sub} says",
    goofy: "My gut says {c} is not who {c.sub} says {c.sub} is!! My gut is very loud right now", shy: "My gut says {c} might not be who {c.sub} says {c.sub} is", chill: "my gut says {c}'s not who {c.sub} says {c.sub} is",
    catty: "My gut says {c} is not who {c.sub} says {c.sub} is. My gut is never wrong", diva: "My instinct says {c} isn't who {c.sub} claims, darling", stoic: "{c} isn't who {c.sub} says" }],
  ['hangout.view.fake.cut.04', "Has {c} ever said one specific thing about {c.posAdj} life? One?", {
    hype: "Has {c} EVER said ONE specific thing about {c.posAdj} life?? ONE??", dry: "has {c} ever said one specific thing about {c.posAdj} life. one", blunt: "Has {c} said one real detail? One?",
    goofy: "Has {c} ever said one specific thing about {c.posAdj} life? One? Even a favorite cereal?", shy: "Has {c} ever said one specific thing about {c.posAdj} life? Just one?", chill: "has {c} ever said one specific thing about {c.posAdj} life? one?",
    catty: "Has {c} ever said one specific thing about {c.posAdj} life? One? I'll wait", diva: "Has {c} ever shared one real detail of {c.posAdj} life, darling? One?", stoic: "One detail from {c}? Ever?" }],
  ['hangout.view.fake.cut.05', "The answers are too rehearsed. Every time", {
    hype: "The answers are TOO rehearsed!! EVERY time", dry: "the answers are too rehearsed. every time", blunt: "Too rehearsed. Every time",
    goofy: "The answers are too rehearsed!! Every time. Like a robot reading a script", shy: "The answers are a bit too rehearsed. Every time", chill: "the answers are too rehearsed. every time",
    catty: "The answers are too rehearsed. Every time. Amateur hour", diva: "Too rehearsed, darling. Every single time", stoic: "Too rehearsed" }],
  ['hangout.view.fake.cut.06', "I don't believe {c}'s pictures. Not one of them", {
    hype: "I DON'T believe {c}'s pictures!! NOT ONE of them", dry: "i don't believe {c}'s pictures. not one of them", blunt: "{c}'s pictures are fake",
    goofy: "I don't believe {c}'s pictures!! Not one of them. That lighting is too perfect", shy: "I don't really believe {c}'s pictures. Not one of them", chill: "I don't believe {c}'s pictures. not one of them",
    catty: "I don't believe {c}'s pictures. Not one of them. Nobody looks like that", diva: "I don't believe {c}'s photos, darling. Not one", stoic: "{c}'s pictures. Not real" }],
  // ── cut: a threat ─────────────────────────────────────────────────────
  ['hangout.view.threat.cut.01', "Let's talk about {c}. {c.Sub}'s friends with literally everyone", {
    hype: "Let's TALK about {c}!! {c.Sub}'s friends with LITERALLY everyone", dry: "let's talk about {c}. {c.sub}'s friends with literally everyone", blunt: "{c}. Friends with everyone",
    goofy: "Let's talk about {c}!! {c.Sub}'s friends with literally everyone. Even the lamp likes {c.obj}", shy: "Let's talk about {c}. {c.Sub}'s friends with literally everyone", chill: "let's talk about {c}. {c.sub}'s friends with literally everyone",
    catty: "Let's talk about {c}. {c.Sub}'s friends with literally everyone. Suspicious", diva: "Let's discuss {c}, darling. {c.Sub}'s friends with everyone", stoic: "{c}. Friends with everyone" }],
  ['hangout.view.threat.cut.02', "I love {c} but {c.sub} is a huge threat", {
    hype: "I LOVE {c} but {c.sub} is a HUGE threat!!", dry: "i love {c} but {c.sub} is a huge threat", blunt: "Love {c}. Huge threat",
    goofy: "I love {c} but {c.sub} is a huge threat!! A huge lovable threat", shy: "I love {c}, but {c.sub} is a huge threat", chill: "love {c} but {c.sub}'s a huge threat",
    catty: "I love {c} but {c.sub} is a huge threat. Love only goes so far", diva: "I adore {c}, darling, but {c.sub} is a huge threat", stoic: "{c}. Huge threat" }],
  ['hangout.view.threat.cut.03', "{c} is running this game and nobody's saying it out loud", {
    hype: "{c} is RUNNING this game and NOBODY'S saying it out loud!!", dry: "{c} is running this game and nobody's saying it out loud. i'm saying it", blunt: "{c} runs this game. Nobody says it",
    goofy: "{c} is running this game and nobody's saying it out loud!! I'm saying it. Out loud. In text", shy: "{c} is kind of running this game, and nobody's saying it out loud", chill: "{c}'s running this game and nobody's saying it out loud",
    catty: "{c} is running this game and nobody's saying it out loud. Cowards", diva: "{c} is running this whole show, darling, and nobody says it", stoic: "{c} runs the game" }],
  ['hangout.view.threat.cut.04', "If {c} is ever an Influencer, neither of us is safe", {
    hype: "If {c} is EVER an Influencer, NEITHER of us is SAFE!!", dry: "if {c} is ever an influencer, neither of us is safe", blunt: "{c} as Influencer, we're done",
    goofy: "If {c} is ever an Influencer, neither of us is safe!! We'd be toast. Burnt toast", shy: "If {c} is ever an Influencer, neither of us is safe", chill: "if {c}'s ever an influencer, neither of us is safe",
    catty: "If {c} is ever an Influencer, neither of us is safe. Think about it", diva: "If {c} ever becomes an Influencer, darling, neither of us is safe", stoic: "{c} Influencer, we're done" }],
  ['hangout.view.threat.cut.05', "It's the smart move. It doesn't feel good, but it's smart", {
    hype: "It's the SMART move!! It doesn't FEEL good, but it's SMART", dry: "it's the smart move. it doesn't feel good. but it's smart", blunt: "Smart move. Doesn't feel good",
    goofy: "It's the smart move!! It doesn't feel good, but it's smart. Like eating vegetables", shy: "It's the smart move. It doesn't feel good, but it's smart", chill: "it's the smart move. doesn't feel good, but it's smart",
    catty: "It's the smart move. It doesn't feel good, but it's smart. Feelings don't win", diva: "It's the clever move, darling. It doesn't feel good, but it's smart", stoic: "Smart. Not good. Smart" }],
  ['hangout.view.threat.cut.06', "Can we talk about how good {c} is at this game?", {
    hype: "Can we TALK about how GOOD {c} is at this game??", dry: "can we talk about how good {c} is at this game", blunt: "{c} is good at this game",
    goofy: "Can we talk about how good {c} is at this game? Scary good. Ghost story good", shy: "Can we talk about how good {c} is at this game?", chill: "can we talk about how good {c} is at this game?",
    catty: "Can we talk about how good {c} is at this game? Too good", diva: "Can we discuss how good {c} is at this, darling?", stoic: "{c}'s too good" }],
  // ── cut: a grudge ─────────────────────────────────────────────────────
  ['hangout.view.grudge.cut.01', "Not gonna lie, {c} and I are not good right now", {
    hype: "Not gonna LIE, {c} and I are NOT good right now!!", dry: "not going to lie, {c} and i are not good right now", blunt: "{c} and I aren't good",
    goofy: "Not gonna lie, {c} and I are not good right now!! We're the opposite of good. We're bad", shy: "Not going to lie, {c} and I are not good right now", chill: "not gonna lie, {c} and I are not good right now",
    catty: "Not gonna lie, {c} and I are not good right now. At all", diva: "Not to lie, darling, {c} and I are not good right now", stoic: "{c} and I aren't good" }],
  ['hangout.view.grudge.cut.02', "Honestly {c} has been coming at me for days", {
    hype: "Honestly {c} has been COMING AT ME for DAYS!!", dry: "honestly {c} has been coming at me for days", blunt: "{c}'s been coming at me for days",
    goofy: "Honestly {c} has been coming at me for days!! Like a mosquito. An annoying mosquito", shy: "Honestly, {c} has been coming at me for days", chill: "honestly {c}'s been coming at me for days",
    catty: "Honestly {c} has been coming at me for days. I've noticed", diva: "Honestly, darling, {c} has been coming at me for days", stoic: "{c} has been coming at me" }],
  ['hangout.view.grudge.cut.03', "I can't keep playing next to {c}. I just can't", {
    hype: "I CAN'T keep playing next to {c}!! I just CAN'T", dry: "i can't keep playing next to {c}. i just can't", blunt: "Can't play next to {c}",
    goofy: "I can't keep playing next to {c}!! I just can't. We're oil and water. And the water is me", shy: "I can't keep playing next to {c}. I just can't", chill: "can't keep playing next to {c}. I just can't",
    catty: "I can't keep playing next to {c}. I just can't. Life's too short", diva: "I simply cannot keep playing next to {c}, darling", stoic: "Can't play next to {c}" }],
  ['hangout.view.grudge.cut.04', "{c} threw shade at me in Circle Chat. In front of everybody", {
    hype: "{c} threw SHADE at me in Circle Chat!! In front of EVERYBODY", dry: "{c} threw shade at me in circle chat. in front of everybody", blunt: "{c} threw shade at me in front of everyone",
    goofy: "{c} threw shade at me in Circle Chat!! In front of everybody. I needed sunglasses", shy: "{c} threw shade at me in Circle Chat. In front of everybody", chill: "{c} threw shade at me in circle chat. in front of everybody",
    catty: "{c} threw shade at me in Circle Chat. In front of everybody. Amateur shade, but still", diva: "{c} threw shade at me in Circle Chat, darling. In front of everyone", stoic: "{c} threw shade. Publicly" }],
  ['hangout.view.grudge.cut.05', "Not in a million years", {
    hype: "NOT in a MILLION years!!", dry: "not in a million years", blunt: "Never",
    goofy: "Not in a million years!! Not in a billion! Not in a gazillion!", shy: "Not in a million years", chill: "not in a million years",
    catty: "Not in a million years", diva: "Not in a million years, darling", stoic: "Never" }],
  ['hangout.view.grudge.cut.06', "I've tried to make peace with {c}. It didn't work", {
    hype: "I've TRIED to make peace with {c}!! It DIDN'T work", dry: "i've tried to make peace with {c}. it didn't work", blunt: "Tried peace with {c}. Didn't work",
    goofy: "I've tried to make peace with {c}!! It didn't work. I even offered a cookie", shy: "I've tried to make peace with {c}. It didn't work", chill: "tried to make peace with {c}. didn't work",
    catty: "I've tried to make peace with {c}. It didn't work. I'm done trying", diva: "I've tried to make peace with {c}, darling. It didn't work", stoic: "Tried peace. Failed" }],
  // ── cut: no connection ────────────────────────────────────────────────
  ['hangout.view.noBond.cut.01', "Real talk, I barely know {c}", {
    hype: "REAL TALK, I BARELY know {c}!!", dry: "real talk. i barely know {c}", blunt: "I barely know {c}",
    goofy: "Real talk, I barely know {c}!! I know {c}'s profile picture. That's it", shy: "Real talk, I barely know {c}", chill: "real talk, I barely know {c}",
    catty: "Real talk, I barely know {c}. That says something", diva: "Real talk, darling, I barely know {c}", stoic: "Barely know {c}" }],
  ['hangout.view.noBond.cut.02', "{c} is sweet but I don't have a connection there", {
    hype: "{c} is SWEET but I don't have a CONNECTION there!!", dry: "{c} is sweet but i don't have a connection there", blunt: "{c}'s sweet. No connection",
    goofy: "{c} is sweet but I don't have a connection there!! The wifi is down between us", shy: "{c} is sweet, but I don't have a connection there", chill: "{c}'s sweet but I don't have a connection there",
    catty: "{c} is sweet but I don't have a connection there. Sweet isn't enough", diva: "{c} is sweet, darling, but there's no connection", stoic: "{c}'s sweet. No connection" }],
  ['hangout.view.noBond.cut.03', "What has {c} actually said to you?", {
    hype: "What has {c} ACTUALLY said to you??", dry: "what has {c} actually said to you", blunt: "What's {c} said to you?",
    goofy: "What has {c} actually said to you? Anything? A hello? A wave?", shy: "What has {c} actually said to you?", chill: "what has {c} actually said to you?",
    catty: "What has {c} actually said to you? Because to me, nothing", diva: "What has {c} actually said to you, darling?", stoic: "What's {c} said to you?" }],
  ['hangout.view.noBond.cut.04', "If {c} left tomorrow, would either of us feel it?", {
    hype: "If {c} left TOMORROW, would EITHER of us feel it??", dry: "if {c} left tomorrow, would either of us feel it", blunt: "Would we feel it if {c} left?",
    goofy: "If {c} left tomorrow, would either of us feel it? Like a missing sock? Or not even that?", shy: "If {c} left tomorrow, would either of us feel it?", chill: "if {c} left tomorrow, would either of us feel it?",
    catty: "If {c} left tomorrow, would either of us feel it? Be honest", diva: "If {c} left tomorrow, darling, would we even notice?", stoic: "Would we feel it?" }],
  ['hangout.view.noBond.cut.05', "Me neither. That's a choice {c.sub} made", {
    hype: "Me NEITHER!! That's a CHOICE {c.sub} made", dry: "me neither. that's a choice {c.sub} made", blunt: "Me neither. {c.Sub} chose that",
    goofy: "Me neither!! That's a choice {c.sub} made. A bold, quiet choice", shy: "Me neither. That's a choice {c.sub} made", chill: "me neither. that's a choice {c.sub} made",
    catty: "Me neither. That's a choice {c.sub} made. Not a smart one", diva: "Nor I, darling. That was {c.posAdj} choice", stoic: "Me neither. {c.Sub} chose that" }],
  ['hangout.view.noBond.cut.06', "We protect the people who protect us. {c} isn't one of them", {
    hype: "We PROTECT the people who PROTECT us!! {c} ISN'T one of them", dry: "we protect the people who protect us. {c} isn't one of them", blunt: "We protect our own. {c} isn't",
    goofy: "We protect the people who protect us!! {c} isn't one of them. {c} is outside the fort", shy: "We protect the people who protect us. {c} isn't one of them", chill: "we protect the people who protect us. {c} isn't one of them",
    catty: "We protect the people who protect us. {c} isn't one of them. Simple", diva: "We protect those who protect us, darling. {c} isn't one of them", stoic: "We protect our own. Not {c}" }],
];
