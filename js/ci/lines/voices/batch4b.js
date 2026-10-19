// Voice versions, batch 4b: typed key lines (a group chat forming, checking in and planning the Ratings; a player
// defending themselves after a goodbye message; a welcome; a party post). Typed, so written the way that voice types:
// dry in lower case and no exclamation marks, hype in capitals, only the emoji the pools already use. These skip the
// register reshaping (ci/script.js) so they are voiced once. No brand names anywhere.
export const VOICES = [
  // ── a group chat forms ────────────────────────────────────────────────
  ['group.form.pitch.01', "Okay, I trust you two more than anyone in here. Hear me out", {
    hype: "OKAY!! I trust you two more than ANYONE in here. Hear me out {e:fire}", dry: "ok. i trust you two more than anyone in here. which isn't saying much. hear me out", blunt: "I trust you two most. Hear me out",
    goofy: "Okay!! I trust you two more than anyone in here. More than my own toaster. Hear me out {e:laugh}", shy: "Um, okay. I trust you two more than anyone in here. Can you hear me out?", chill: "ok so I trust you two more than anyone in here. hear me out, guys",
    catty: "Okay. You two are the only ones in here I trust. Don't make me regret it. Hear me out", diva: "Darlings. I trust you two above everyone in this building. Hear me out {e:sparkle}", stoic: "I trust you two. Listen" }],
  ['group.form.pitch.02', "Welcome to the most exclusive chat in The Circle {e:sparkle}", {
    hype: "WELCOME to the most EXCLUSIVE chat in The Circle!! {e:sparkle} {e:fire}", dry: "welcome to the most exclusive chat in the circle. membership: three", blunt: "Welcome. Most exclusive chat in The Circle",
    goofy: "Welcome to the most exclusive chat in The Circle!! There are snacks. There are no snacks {e:laugh}", shy: "Hi! Welcome to, um, the most exclusive chat in The Circle {e:sparkle}", chill: "welcome to the most exclusive chat in the circle, guys {e:sparkle}",
    catty: "Welcome to the most exclusive chat in The Circle. Everyone else wishes {e:side}", diva: "Welcome, darlings, to the most exclusive chat in The Circle {e:crown}", stoic: "Welcome. Exclusive chat" }],
  ['group.form.pitch.03', "I picked you both for a reason. I think we could run this place", {
    hype: "I picked you BOTH for a reason!! We could RUN this place {e:muscle}", dry: "i picked you both for a reason. i think we could run this place. or at least walk it", blunt: "I picked you for a reason. We could run this place",
    goofy: "I picked you both for a reason!! We could run this place. Like a lemonade stand but with power {e:laugh}", shy: "I picked you both for a reason. I think maybe we could run this place?", chill: "picked you both for a reason, guys. we could run this place",
    catty: "I picked you both for a reason. Together we could run this place. They'd never see it coming", diva: "I chose you both for a reason, darlings. We could rule this place {e:crown}", stoic: "I chose you. We could run this place" }],
  ['group.form.pitch.04', "Group chat time! I've been thinking about this for a day", {
    hype: "GROUP CHAT TIME!! I've been thinking about this ALL DAY {e:party}", dry: "group chat time. i've been thinking about this for a day. it's a whole thing", blunt: "Group chat. Been thinking about it for a day",
    goofy: "Group chat time!! I've been thinking about this for a day. Also about lunch. But mostly this {e:laugh}", shy: "Group chat time! I've been thinking about this for a day, sorry if it's a lot", chill: "group chat time. been thinking about this for a day, guys",
    catty: "Group chat time. I've been thinking about this for a day. You're welcome", diva: "Group chat time, darlings! I've been planning this for a day {e:sparkle}", stoic: "Group chat. Planned it for a day" }],
  ['group.form.pitch.05', "Real talk. Everybody in here is making alliances. We should too", {
    hype: "REAL TALK!! EVERYBODY is making alliances. We should TOO {e:fire}", dry: "real talk. everybody in here is making alliances. we should too. reluctantly", blunt: "Everyone's making alliances. We should too",
    goofy: "Real talk!! Everybody in here is making alliances. We should too! With matching hats {e:laugh}", shy: "Real talk. Everybody in here is making alliances. Maybe we should too?", chill: "real talk, guys. everyone's making alliances. we should too",
    catty: "Real talk. Everybody in here is making alliances. Ours would actually be good", diva: "Real talk, darlings. Everyone's forming alliances. We should too", stoic: "Everyone has alliances. We should too" }],
  ['group.form.name.01', "Every good alliance needs a name. I'm thinking {game}", {
    hype: "Every GOOD alliance needs a name!! I'm thinking {game} {e:fire}", dry: "every good alliance needs a name. i'm thinking {game}. it's fine", blunt: "We need a name. {game}",
    goofy: "Every good alliance needs a name!! I'm thinking {game}. I had eleven ideas and this beat all of them {e:laugh}", shy: "Every good alliance needs a name. Maybe {game}? If that's okay", chill: "every good alliance needs a name. thinking {game}",
    catty: "Every good alliance needs a name. I'm thinking {game}. It's better than anything they'd come up with", diva: "Every great alliance needs a name, darlings. {game} {e:crown}", stoic: "Name: {game}" }],
  ['group.form.name.02', "Okay so we're officially {game}", {
    hype: "Okay so we're OFFICIALLY {game}!! {e:party}", dry: "ok so we're officially {game}. no going back", blunt: "We're officially {game}",
    goofy: "Okay so we're officially {game}!! I'm getting it tattooed. On a sticker {e:laugh}", shy: "Okay so we're officially {game} {e:smile}", chill: "ok so we're officially {game}",
    catty: "Okay so we're officially {game}. Try to keep up", diva: "We are officially {game}, darlings {e:sparkle}", stoic: "Officially {game}" }],
  ['group.form.name.03', "{game}?", {
    hype: "{game}?? {e:fire}", dry: "{game}? just a thought", blunt: "{game}?",
    goofy: "{game}?? I'm already in love with it {e:laugh}", shy: "{game}? Only if you like it", chill: "{game}? thoughts?",
    catty: "{game}? Obviously the best option", diva: "{game}, darlings? {e:sparkle}", stoic: "{game}?" }],
  ['group.form.name.04', "Deal. And from now on this chat is called {game}", {
    hype: "DEAL!! And from now on this chat is called {game} {e:party}", dry: "deal. and from now on this chat is called {game}. it's the law", blunt: "Deal. This chat is {game}",
    goofy: "Deal!! And from now on this chat is called {game}. All in favor say snack {e:laugh}", shy: "Deal. And from now on this chat is called {game}, if that's okay", chill: "deal. this chat's called {game} now",
    catty: "Deal. From now on this chat is called {game}. Tell no one", diva: "Deal, darlings. This chat shall be called {game} {e:crown}", stoic: "Deal. {game}" }],
  ['group.form.name.05', "Introducing: {game}", {
    hype: "INTRODUCING: {game}!! {e:fire} {e:party}", dry: "introducing: {game}. hold your applause", blunt: "We're {game}",
    goofy: "Introducing: {game}!! Drumroll please {e:laugh}", shy: "Introducing, um, {game} {e:smile}", chill: "introducing: {game}",
    catty: "Introducing: {game}. The only chat that matters", diva: "Introducing, darlings: {game} {e:crown}", stoic: "{game}" }],
  ['group.form.declined.02', "No pressure! The door's open", {
    hype: "NO PRESSURE!! The door's WIDE open {e:heart}", dry: "no pressure. the door's open. it's a metaphorical door", blunt: "No pressure. Door's open",
    goofy: "No pressure!! The door's open. It's always open. I forgot to close it {e:laugh}", shy: "No pressure at all! The door's open", chill: "no pressure, the door's open",
    catty: "No pressure. The door's open. For now", diva: "No pressure, darling. The door is always open", stoic: "Door's open" }],
  // ── checking in ───────────────────────────────────────────────────────
  ['group.check.open.01', "{game} check-in! How's everybody holding up?", {
    hype: "{game} CHECK-IN!! How's EVERYBODY holding up?? {e:fire}", dry: "{game} check-in. how's everybody holding up. honestly", blunt: "{game} check-in. How is everyone?",
    goofy: "{game} check-in!! How's everybody holding up? I'm holding up a sandwich {e:laugh}", shy: "{game} check-in! How's everybody holding up? {e:heart}", chill: "{game} check-in. how's everybody holding up?",
    catty: "{game} check-in. How's everybody holding up? Anyone cracking?", diva: "{game} check-in, darlings! How are we holding up? {e:sparkle}", stoic: "{game}. Status?" }],
  ['group.check.open.02', "Emergency meeting, {game} {e:shock}", {
    hype: "EMERGENCY MEETING, {game}!! {e:shock} {e:shock}", dry: "emergency meeting, {game}. it's not a drill. probably", blunt: "Emergency meeting, {game}",
    goofy: "Emergency meeting, {game}!! Grab your helmets {e:shock}", shy: "Um, emergency meeting, {game}? {e:shock}", chill: "emergency meeting, {game} {e:shock}",
    catty: "Emergency meeting, {game}. Somebody's been talking {e:side}", diva: "An emergency meeting, darlings! {game}, gather {e:shock}", stoic: "{game}. Emergency" }],
  ['group.check.open.03', "Morning {game} {e:heart} Just checking we're all still good", {
    hype: "MORNING {game}!! {e:heart} Just checking we're ALL still good", dry: "morning {game}. just checking we're all still good. are we", blunt: "Morning {game}. We still good?",
    goofy: "Morning {game}!! {e:heart} Just checking we're all still good. And still awake {e:laugh}", shy: "Morning {game} {e:heart} Just checking we're all still good?", chill: "morning {game} {e:heart} we all still good?",
    catty: "Morning {game}. Just checking we're all still good. Nobody's been wandering?", diva: "Good morning, {game}, darlings {e:heart} Are we still good?", stoic: "Morning. Still good?" }],
  ['group.check.open.04', "Spill. Immediately", {
    hype: "SPILL!! IMMEDIATELY!! {e:eyes}", dry: "spill. immediately. i've been patient", blunt: "Spill. Now",
    goofy: "Spill!! Immediately!! Like juice on a carpet {e:laugh}", shy: "Okay, spill. If you want to", chill: "spill, guys",
    catty: "Spill. Immediately. I want every detail", diva: "Spill, darlings. Immediately {e:eyes}", stoic: "Spill" }],
  ['group.check.share.01', "Okay so I heard something in a private chat today. It's big", {
    hype: "Okay so I heard something in a private chat today!! It's BIG {e:shock}", dry: "ok so i heard something in a private chat today. it's big. sit down", blunt: "Heard something in a private chat. It's big",
    goofy: "Okay so I heard something in a private chat today. It's big. Like elephant big {e:shock}", shy: "Okay so I heard something in a private chat today. I think it's big", chill: "ok so I heard something in a private chat today. it's big",
    catty: "Okay so I heard something in a private chat today. It's big. And delicious", diva: "Darlings. I heard something in a private chat today. It's big {e:eyes}", stoic: "Heard something. Big" }],
  ['group.check.share.02', "Just so you know, people are talking about us", {
    hype: "Just so you KNOW, people are TALKING about us!! {e:eyes}", dry: "just so you know, people are talking about us. we're famous", blunt: "People are talking about us",
    goofy: "Just so you know, people are talking about us!! We're celebrities {e:laugh}", shy: "Just so you know, people are kind of talking about us", chill: "just so you know, people are talking about us",
    catty: "Just so you know, people are talking about us. Jealous, obviously", diva: "Just so you know, darlings, they're talking about us {e:sparkle}", stoic: "People are talking about us" }],
  ['group.check.share.03', "I can't say where I heard it, but trust me on this one", {
    hype: "I CAN'T say where I heard it, but TRUST ME on this one!!", dry: "can't say where i heard it. trust me on this one", blunt: "Can't say where. Trust me",
    goofy: "I can't say where I heard it, but trust me on this one!! My lips are sealed. With glue {e:laugh}", shy: "I can't say where I heard it, but please trust me on this one", chill: "can't say where I heard it, but trust me on this one",
    catty: "I can't say where I heard it. But trust me. I'm always right", diva: "I can't reveal my source, darlings. But trust me", stoic: "Can't say where. Trust me" }],
  ['group.check.share.04', "Somebody tried to get info out of me today. I gave them nothing", {
    hype: "Somebody tried to get info out of me today!! I gave them NOTHING {e:muscle}", dry: "somebody tried to get info out of me today. i gave them nothing. i'm a vault", blunt: "Someone fished for info today. Got nothing",
    goofy: "Somebody tried to get info out of me today!! I gave them nothing. Except a recipe {e:laugh}", shy: "Somebody tried to get info out of me today. I didn't tell them anything", chill: "somebody tried to get info out of me today. gave 'em nothing",
    catty: "Somebody tried to get info out of me today. Cute. I gave them nothing", diva: "Someone tried to pry today, darlings. I gave them nothing", stoic: "Someone fished. Got nothing" }],
  ['group.check.plan.01', "Ratings strategy. I think {c} is coming for us", {
    hype: "RATINGS STRATEGY!! I think {c} is COMING for us {e:fire}", dry: "ratings strategy. i think {c} is coming for us. rude", blunt: "Ratings. {c} is coming for us",
    goofy: "Ratings strategy!! I think {c} is coming for us. With a net {e:shock}", shy: "Ratings strategy. I think {c} might be coming for us", chill: "ratings strategy. I think {c}'s coming for us",
    catty: "Ratings strategy. {c} is coming for us. Let's go first", diva: "Ratings strategy, darlings. {c} is coming for us", stoic: "Ratings. {c} is coming" }],
  ['group.check.plan.02', "We need to stick together tonight. All of {game} rates {c} at the bottom", {
    hype: "We NEED to stick together tonight!! ALL of {game} rates {c} at the BOTTOM {e:muscle}", dry: "we need to stick together tonight. all of {game} rates {c} at the bottom. simple", blunt: "Stick together. All of {game} puts {c} last",
    goofy: "We need to stick together tonight!! Like glue! All of {game} rates {c} at the bottom", shy: "We need to stick together tonight. Can all of {game} put {c} at the bottom?", chill: "we gotta stick together tonight. all of {game} puts {c} at the bottom",
    catty: "We stick together tonight. All of {game} rates {c} at the bottom. No exceptions", diva: "Together tonight, darlings. All of {game} puts {c} at the bottom", stoic: "Together. {c} at the bottom" }],
  ['group.check.plan.03', "Not just you. {c} is the plan", {
    hype: "Not JUST you!! {c} is THE PLAN", dry: "not just you. {c} is the plan", blunt: "Not just you. {c} is the plan",
    goofy: "Not just you!! {c} is the plan. The whole plan. The plan's whole name {e:laugh}", shy: "Not just you. {c} is the plan", chill: "not just you. {c}'s the plan",
    catty: "Not just you. {c} is the plan. Keep up", diva: "Not just you, darling. {c} is the plan", stoic: "{c} is the plan" }],
  ['group.check.plan.04', "If we all put {c} low, {c} doesn't make it to the end", {
    hype: "If we ALL put {c} low, {c} DOESN'T make it to the end!!", dry: "if we all put {c} low, {c} doesn't make it to the end. math", blunt: "We all put {c} low, {c} is done",
    goofy: "If we all put {c} low, {c} doesn't make it to the end!! It's science {e:laugh}", shy: "If we all put {c} low, I don't think {c} makes it to the end", chill: "if we all put {c} low, {c} doesn't make it to the end",
    catty: "If we all put {c} low, {c} doesn't make it to the end. Shame", diva: "If we all put {c} low, darlings, {c}'s story ends", stoic: "All low on {c}. {c} is done" }],
  ['group.check.plan.05', "Real question. Can we trust {c}?", {
    hype: "REAL QUESTION!! Can we TRUST {c}?? {e:eyes}", dry: "real question. can we trust {c}. i have doubts", blunt: "Can we trust {c}?",
    goofy: "Real question!! Can we trust {c}? I trust {c} as far as I can throw a couch {e:eyes}", shy: "Real question. Can we trust {c}?", chill: "real question. can we trust {c}?",
    catty: "Real question. Can we trust {c}? I already know my answer {e:side}", diva: "A real question, darlings. Can we trust {c}?", stoic: "Trust {c}?" }],
  // ── planning the Ratings in a small chat ──────────────────────────────
  ['group.plan.pitch.01', "Okay you two. Ratings are tonight. Can we talk about {c}?", {
    hype: "Okay you two!! Ratings are TONIGHT. Can we talk about {c}?? {e:eyes}", dry: "ok you two. ratings are tonight. can we talk about {c}", blunt: "Ratings tonight. Let's talk about {c}",
    goofy: "Okay you two!! Ratings are tonight. Can we talk about {c}? Pull up a chair. A tiny chair {e:laugh}", shy: "Okay, you two. Ratings are tonight. Can we talk about {c}?", chill: "ok you two. ratings are tonight. can we talk about {c}?",
    catty: "Okay you two. Ratings are tonight. We need to talk about {c}", diva: "Darlings. Ratings are tonight. Let's discuss {c}", stoic: "Ratings tonight. {c}" }],
  ['group.plan.pitch.02', "Real talk, no feelings. Who's the biggest threat in here?", {
    hype: "REAL TALK, no feelings!! Who's the BIGGEST threat in here?? {e:fire}", dry: "real talk, no feelings. who's the biggest threat in here", blunt: "No feelings. Biggest threat?",
    goofy: "Real talk, no feelings!! Feelings are in the other room. Who's the biggest threat in here?", shy: "Real talk, no hard feelings. Who's the biggest threat in here?", chill: "real talk, no feelings. who's the biggest threat in here?",
    catty: "Real talk, no feelings. Who's the biggest threat in here? Besides me", diva: "No feelings, darlings. Who's the biggest threat?", stoic: "Biggest threat?" }],
  ['group.plan.pitch.03', "I made this chat because I trust you both. I think {c} is playing everyone", {
    hype: "I made this chat because I TRUST you both!! I think {c} is playing EVERYONE {e:eyes}", dry: "i made this chat because i trust you both. i think {c} is playing everyone. including us", blunt: "I trust you both. {c} is playing everyone",
    goofy: "I made this chat because I trust you both!! I think {c} is playing everyone. Like a fiddle. A sneaky fiddle", shy: "I made this chat because I trust you both. I think {c} might be playing everyone", chill: "made this chat 'cause I trust you both. I think {c}'s playing everyone",
    catty: "I made this chat because I trust you both. {c} is playing everyone. I can always tell {e:side}", diva: "I made this chat because I trust you both, darlings. {c} is playing everyone", stoic: "I trust you both. {c} is playing everyone" }],
  ['group.plan.pitch.04', "Before tonight. I want {c} at the bottom of all three of our lists", {
    hype: "Before tonight!! I want {c} at the BOTTOM of all three of our lists {e:muscle}", dry: "before tonight. i want {c} at the bottom of all three of our lists. thoughts", blunt: "Before tonight. {c} last on all three lists",
    goofy: "Before tonight!! I want {c} at the bottom of all three of our lists. The very bottom. The basement", shy: "Before tonight. Could we put {c} at the bottom of all three of our lists?", chill: "before tonight. want {c} at the bottom of all three of our lists",
    catty: "Before tonight. {c} at the bottom of all three of our lists. Agreed?", diva: "Before tonight, darlings. {c} at the bottom of all three lists", stoic: "{c}. Bottom. All three lists" }],
  ['group.plan.pitch.05', "Quick question before tonight. Do we want {c} as an Influencer?", {
    hype: "Quick question before tonight!! Do we WANT {c} as an Influencer??", dry: "quick question before tonight. do we want {c} as an influencer. i don't", blunt: "Do we want {c} as an Influencer?",
    goofy: "Quick question before tonight!! Do we want {c} as an Influencer? With a crown and everything? {e:crown}", shy: "Quick question before tonight. Do we want {c} as an Influencer?", chill: "quick question before tonight. do we want {c} as an influencer?",
    catty: "Quick question before tonight. Do we want {c} as an Influencer? Because I don't", diva: "A question before tonight, darlings. {c} as an Influencer? {e:crown}", stoic: "{c} as Influencer?" }],
  ['group.plan.agree.01', "I'm in. {c} at the bottom", {
    hype: "I'm IN!! {c} at the BOTTOM {e:muscle}", dry: "i'm in. {c} at the bottom", blunt: "In. {c} last",
    goofy: "I'm in!! {c} at the bottom. Bottom of the barrel {e:laugh}", shy: "Okay, I'm in. {c} at the bottom", chill: "I'm in. {c} at the bottom",
    catty: "I'm in. {c} at the bottom. Where {c} belongs", diva: "I'm in, darlings. {c} at the bottom", stoic: "In. {c} last" }],
  ['group.plan.agree.02', "Done. I've had a feeling about {c} for days", {
    hype: "DONE!! I've had a FEELING about {c} for DAYS", dry: "done. i've had a feeling about {c} for days", blunt: "Done. Had a feeling about {c} for days",
    goofy: "Done!! I've had a feeling about {c} for days. A tummy feeling {e:laugh}", shy: "Done. I've kind of had a feeling about {c} for days", chill: "done. had a feeling about {c} for days",
    catty: "Done. I've had a feeling about {c} for days. I'm always right", diva: "Done, darlings. I've sensed it about {c} for days", stoic: "Done. Knew about {c}" }],
  ['group.plan.agree.03', "Okay. I don't love it but it makes sense. I'm in", {
    hype: "Okay!! I don't LOVE it but it makes sense. I'm IN", dry: "ok. i don't love it but it makes sense. i'm in. sadly", blunt: "Don't love it. Makes sense. In",
    goofy: "Okay!! I don't love it but it makes sense. I'm in. Reluctantly. Like eating broccoli", shy: "Okay. I don't love it, but it makes sense. I'm in", chill: "ok. don't love it but it makes sense. I'm in",
    catty: "Okay. I don't love it, but it makes sense. I'm in", diva: "I don't adore it, darlings, but it makes sense. I'm in", stoic: "Makes sense. In" }],
  ['group.plan.agree.04', "Say less. {c} goes low", {
    hype: "SAY LESS!! {c} goes LOW {e:fire}", dry: "say less. {c} goes low", blunt: "{c} goes low",
    goofy: "Say less!! {c} goes low. Limbo low {e:laugh}", shy: "Say less. {c} goes low", chill: "say less. {c} goes low",
    catty: "Say less. {c} goes low. Very low", diva: "Say less, darling. {c} goes low", stoic: "{c} low" }],
  ['group.plan.agree.05', "Count me in. And nobody hears about this chat", {
    hype: "COUNT ME IN!! And NOBODY hears about this chat {e:handshake}", dry: "count me in. and nobody hears about this chat. ever", blunt: "In. Nobody hears about this",
    goofy: "Count me in!! And nobody hears about this chat. It's a secret. A secret secret {e:laugh}", shy: "Count me in. And nobody hears about this chat, okay?", chill: "count me in. nobody hears about this chat",
    catty: "Count me in. And nobody hears about this chat. I mean it", diva: "Count me in, darlings. This chat never happened", stoic: "In. Nobody hears" }],
  ['group.plan.decline.01', "I'm gonna rate how I rate. Sorry", {
    hype: "I'm gonna rate how I RATE!! Sorry!!", dry: "i'm going to rate how i rate. sorry. not very", blunt: "I rate how I rate",
    goofy: "I'm gonna rate how I rate!! Sorry!! I'm a free bird {e:laugh}", shy: "I think I'm going to rate how I rate. Sorry", chill: "gonna rate how I rate, guys. sorry",
    catty: "I'm going to rate how I rate. Sorry. Not sorry", diva: "I rate as I rate, darlings. Sorry", stoic: "I rate my way" }],
  ['group.plan.decline.02', "{c} has been good to me. I can't do that", {
    hype: "{c} has been SO good to me!! I CAN'T do that", dry: "{c} has been good to me. i can't do that", blunt: "{c}'s been good to me. Can't",
    goofy: "{c} has been good to me!! I can't do that. {c} gave me a virtual cookie", shy: "{c} has been really good to me. I can't do that, sorry", chill: "{c}'s been good to me. can't do that",
    catty: "{c} has been good to me. I can't do that. Find someone else", diva: "{c} has been good to me, darlings. I can't", stoic: "{c} was good to me. No" }],
  ['group.plan.decline.03', "I'm not comfortable ganging up on anybody", {
    hype: "I'm NOT comfortable ganging up on ANYBODY!!", dry: "i'm not comfortable ganging up on anybody. it's a whole thing with me", blunt: "I don't gang up on people",
    goofy: "I'm not comfortable ganging up on anybody!! I'm a lover, not a ganger {e:heart}", shy: "I'm not really comfortable ganging up on anybody. Sorry", chill: "not comfortable ganging up on anybody, guys",
    catty: "I'm not comfortable ganging up on anybody. I prefer to work alone", diva: "I don't gang up on people, darlings. It's beneath me", stoic: "I don't gang up" }],
  ['group.plan.decline.04', "I'll think about it", {
    hype: "I'll THINK about it!!", dry: "i'll think about it", blunt: "I'll think about it",
    goofy: "I'll think about it!! Thinking. Still thinking. My brain is buffering {e:laugh}", shy: "I'll think about it, okay?", chill: "I'll think about it",
    catty: "I'll think about it. Don't wait up", diva: "I'll consider it, darlings", stoic: "I'll think" }],
  ['group.plan.decline.05', "Not for me, sorry. I like to keep my ratings my own", {
    hype: "NOT for me, sorry!! I keep my ratings MY OWN", dry: "not for me, sorry. i like my ratings my own. like my snacks", blunt: "Not for me. My ratings are mine",
    goofy: "Not for me, sorry!! I like to keep my ratings my own. Like my sandwiches {e:laugh}", shy: "It's not for me, sorry. I like to keep my ratings my own", chill: "not for me, sorry. I keep my ratings my own",
    catty: "Not for me. My ratings are my own. Nobody tells me who to rate", diva: "Not for me, darlings. My ratings are my own", stoic: "No. My ratings are mine" }],
  ['group.plan.seal.01', "Okay. Tonight, {c} goes low. Nobody breaks", {
    hype: "OKAY!! Tonight, {c} goes LOW. NOBODY breaks {e:muscle}", dry: "ok. tonight {c} goes low. nobody breaks", blunt: "{c} goes low. Nobody breaks",
    goofy: "Okay!! Tonight, {c} goes low. Nobody breaks. Not even a little. Not even a crack", shy: "Okay. Tonight, {c} goes low. Nobody breaks, okay?", chill: "ok. tonight {c} goes low. nobody breaks",
    catty: "Okay. Tonight, {c} goes low. Nobody breaks. I'll know", diva: "Tonight, darlings, {c} goes low. Nobody breaks", stoic: "{c} low. Nobody breaks" }],
  ['group.plan.seal.02', "Love doing business with you", {
    hype: "LOVE doing business with you!! {e:handshake}", dry: "love doing business with you. truly", blunt: "Good doing business",
    goofy: "Love doing business with you!! We should get little briefcases {e:handshake}", shy: "I love doing business with you {e:handshake}", chill: "love doing business with you {e:handshake}",
    catty: "Love doing business with you. Smart people are rare in here", diva: "A pleasure doing business, darlings {e:handshake}", stoic: "Good business" }],
  ['group.plan.seal.03', "Deleting this from my memory now. See you at the ratings", {
    hype: "DELETING this from my memory NOW!! See you at the ratings {e:wink}", dry: "deleting this from my memory now. see you at the ratings", blunt: "Forgetting this. See you at the ratings",
    goofy: "Deleting this from my memory now!! Beep boop. See you at the ratings {e:laugh}", shy: "Deleting this from my memory now. See you at the ratings", chill: "deleting this from my memory now. see you at the ratings",
    catty: "Deleting this from my memory now. See you at the ratings {e:wink}", diva: "This conversation never happened, darlings. See you at the ratings", stoic: "Forgotten. See you at the ratings" }],
  ['group.plan.seal.04', "Okay. We stick to this. Good luck tonight", {
    hype: "OKAY!! We STICK to this. GOOD LUCK tonight {e:fire}", dry: "ok. we stick to this. good luck tonight", blunt: "We stick to this. Good luck",
    goofy: "Okay!! We stick to this. Like gum on a shoe. Good luck tonight {e:laugh}", shy: "Okay. We stick to this. Good luck tonight {e:heart}", chill: "ok. we stick to this. good luck tonight",
    catty: "Okay. We stick to this. Good luck tonight. Not that we'll need it", diva: "We stick to this, darlings. Good luck tonight {e:sparkle}", stoic: "We stick to it. Good luck" }],
  // ── the morning after a goodbye message ───────────────────────────────
  ['chat.defend.warm.01', "I know how that goodbye message sounded. Can I tell you my side?", {
    hype: "I KNOW how that goodbye message sounded!! Can I tell you MY side??", dry: "i know how that goodbye message sounded. can i tell you my side", blunt: "I know how that sounded. Let me give my side",
    goofy: "I know how that goodbye message sounded!! Can I tell you my side? It's a better side {e:sweat}", shy: "I know how that goodbye message sounded. Can I tell you my side? If that's okay", chill: "I know how that goodbye message sounded. can I tell you my side?",
    catty: "I know how that goodbye message sounded. Can I tell you my side? It's the true one", diva: "Darling, I know how that goodbye sounded. May I tell you my side?", stoic: "I know how it sounded. My side?" }],
  ['chat.defend.warm.02', "Are we good after this morning?", {
    hype: "Are we GOOD after this morning?? {e:heart}", dry: "are we good after this morning", blunt: "We good after this morning?",
    goofy: "Are we good after this morning?? Please say yes. I'll send a meme {e:sweat}", shy: "Are we good after this morning? {e:heart}", chill: "we good after this morning?",
    catty: "Are we good after this morning? We should be", diva: "Darling, are we good after this morning?", stoic: "We good?" }],
  ['chat.defend.warm.03', "Okay I have to ask. You don't actually think I'm a catfish, right?", {
    hype: "Okay I HAVE to ask!! You don't ACTUALLY think I'm a catfish, right?? {e:sweat}", dry: "ok i have to ask. you don't actually think i'm a catfish. right", blunt: "You don't think I'm a catfish, right?",
    goofy: "Okay I have to ask!! You don't actually think I'm a catfish, right? I'm barely even a person {e:laugh}", shy: "Okay, I have to ask. You don't actually think I'm a catfish, right?", chill: "ok I have to ask. you don't actually think I'm a catfish, right?",
    catty: "Okay, I have to ask. You don't actually think I'm a catfish, right? Please", diva: "Darling, I must ask. You don't think I'm a catfish, surely?", stoic: "You don't think I'm a catfish?" }],
  ['chat.defend.warm.04', "So that goodbye message was a lot {e:sweat}", {
    hype: "So that goodbye message was A LOT!! {e:sweat}", dry: "so that goodbye message was a lot", blunt: "That goodbye message was a lot",
    goofy: "So that goodbye message was a lot!! Like a whole soap opera {e:sweat}", shy: "So that goodbye message was a lot {e:sweat}", chill: "so that goodbye message was a lot {e:sweat}",
    catty: "So that goodbye message was a lot. Dramatic, even {e:side}", diva: "That goodbye was quite the performance, darling {e:sweat}", stoic: "That goodbye was a lot" }],
  ['chat.defend.warm.05', "Can we talk about what {c} said about me?", {
    hype: "Can we TALK about what {c} said about me??", dry: "can we talk about what {c} said about me", blunt: "Let's talk about what {c} said",
    goofy: "Can we talk about what {c} said about me?? I have notes. So many notes {e:sweat}", shy: "Can we talk about what {c} said about me?", chill: "can we talk about what {c} said about me?",
    catty: "Can we talk about what {c} said about me? Because it was a lot", diva: "Darling, can we discuss what {c} said about me?", stoic: "What {c} said. Can we talk?" }],
  ['chat.defend.warm.06', "Be honest. Did that video change how you see me?", {
    hype: "Be HONEST!! Did that video change how you see me??", dry: "be honest. did that video change how you see me", blunt: "Honest. Did that video change things?",
    goofy: "Be honest!! Did that video change how you see me? Am I a villain now? Do I need a cape? {e:sweat}", shy: "Be honest. Did that video change how you see me?", chill: "be honest. did that video change how you see me?",
    catty: "Be honest. Did that video change how you see me? It shouldn't", diva: "Be honest, darling. Did that video change how you see me?", stoic: "Did that video change things?" }],
  ['chat.defend.warm.07', "I just want to clear the air after that goodbye message", {
    hype: "I just want to CLEAR THE AIR after that goodbye message!!", dry: "i just want to clear the air after that goodbye message", blunt: "Clearing the air after that goodbye",
    goofy: "I just want to clear the air after that goodbye message!! I brought a fan {e:sweat}", shy: "I just want to clear the air after that goodbye message, if that's okay", chill: "just want to clear the air after that goodbye message",
    catty: "I just want to clear the air after that goodbye message. It was unfair", diva: "Darling, I simply want to clear the air after that goodbye", stoic: "Clearing the air" }],
  ['chat.defend.neutral.01', "I didn't deserve that goodbye message. Just saying", {
    hype: "I did NOT deserve that goodbye message!! Just saying!!", dry: "i didn't deserve that goodbye message. just saying", blunt: "Didn't deserve that goodbye",
    goofy: "I didn't deserve that goodbye message!! Just saying! Loudly! Into the void {e:sweat}", shy: "I don't think I deserved that goodbye message. Just saying", chill: "didn't deserve that goodbye message. just saying",
    catty: "I didn't deserve that goodbye message. Just saying. Bitter people say bitter things", diva: "I did not deserve that goodbye, darling. Just saying", stoic: "Didn't deserve that" }],
  ['chat.defend.neutral.02', "Just so you know, I'm real. Whatever {c} said", {
    hype: "Just so you KNOW, I'm REAL!! Whatever {c} said", dry: "just so you know, i'm real. whatever {c} said", blunt: "I'm real. Whatever {c} said",
    goofy: "Just so you know, I'm real!! One hundred percent person. Whatever {c} said {e:laugh}", shy: "Just so you know, I'm real. Whatever {c} said", chill: "just so you know, I'm real. whatever {c} said",
    catty: "Just so you know, I'm real. Whatever {c} said. {c} was guessing", diva: "Just so you know, darling, I'm real. Whatever {c} said", stoic: "I'm real" }],
  ['chat.defend.neutral.03', "Hey, about that goodbye video. I promise it's not what it sounded like", {
    hype: "Hey!! About that goodbye video. I PROMISE it's not what it sounded like", dry: "hey, about that goodbye video. it's not what it sounded like. promise", blunt: "That goodbye video. Not what it sounded like",
    goofy: "Hey!! About that goodbye video. I promise it's not what it sounded like. It sounded worse {e:sweat}", shy: "Hey, about that goodbye video. I promise it's not what it sounded like", chill: "hey, about that goodbye video. promise it's not what it sounded like",
    catty: "About that goodbye video. It's not what it sounded like. Promise", diva: "About that goodbye video, darling. It's not what it sounded like", stoic: "That video. Not what it sounded like" }],
  ['chat.defend.neutral.04', "I hope you don't believe what {c} said about me", {
    hype: "I HOPE you don't believe what {c} said about me!!", dry: "i hope you don't believe what {c} said about me", blunt: "Don't believe what {c} said",
    goofy: "I hope you don't believe what {c} said about me!! I'm very believable. Believe me {e:sweat}", shy: "I hope you don't believe what {c} said about me", chill: "hope you don't believe what {c} said about me",
    catty: "I hope you don't believe what {c} said about me. {c} isn't exactly reliable", diva: "I hope you don't believe {c}, darling", stoic: "Don't believe {c}" }],
  ['chat.defend.neutral.05', "So that goodbye was dramatic lol", {
    hype: "So that goodbye was DRAMATIC lol!!", dry: "so that goodbye was dramatic lol", blunt: "That goodbye was dramatic",
    goofy: "So that goodbye was dramatic lol!! Give it an award {e:laugh}", shy: "So that goodbye was kind of dramatic lol", chill: "so that goodbye was dramatic lol",
    catty: "So that goodbye was dramatic lol. Exit stage bitter", diva: "That goodbye was rather dramatic, darling lol", stoic: "Dramatic goodbye" }],
  ['chat.defend.cold.01', "I've been thinking about that goodbye all morning. It's just not true", {
    hype: "I've been thinking about that goodbye ALL MORNING!! It's just NOT TRUE", dry: "been thinking about that goodbye all morning. it's just not true", blunt: "That goodbye isn't true",
    goofy: "I've been thinking about that goodbye all morning!! It's just not true. Like a unicorn {e:sweat}", shy: "I've been thinking about that goodbye all morning. It's just not true", chill: "been thinking about that goodbye all morning. it's just not true",
    catty: "I've been thinking about that goodbye all morning. It's just not true. Not a word of it", diva: "That goodbye has haunted me all morning, darling. It's not true", stoic: "That goodbye isn't true" }],
  ['chat.defend.cold.02', "I need you to know I'm NOT a catfish. {c} has no idea what's real in here", {
    hype: "I NEED you to know I'm NOT a catfish!! {c} has NO idea what's real in here", dry: "i need you to know i'm not a catfish. {c} has no idea what's real in here", blunt: "I'm not a catfish. {c} has no idea",
    goofy: "I need you to know I'm NOT a catfish!! I'm not even a fish. {c} has no idea what's real in here {e:sweat}", shy: "I need you to know I'm not a catfish. {c} doesn't know what's real in here", chill: "need you to know I'm not a catfish. {c} has no idea what's real in here",
    catty: "I need you to know I'm NOT a catfish. {c} has no idea what's real in here. Never did", diva: "I am NOT a catfish, darling. {c} has no idea what's real", stoic: "Not a catfish. {c} doesn't know" }],
  ['chat.defend.cold.03', "Please don't listen to that goodbye video", {
    hype: "PLEASE don't listen to that goodbye video!!", dry: "please don't listen to that goodbye video", blunt: "Don't listen to that video",
    goofy: "Please don't listen to that goodbye video!! Cover your ears. La la la {e:sweat}", shy: "Please don't listen to that goodbye video", chill: "please don't listen to that goodbye video",
    catty: "Please don't listen to that goodbye video. Sore losers say anything", diva: "Please don't listen to that goodbye video, darling", stoic: "Don't listen to that video" }],
  ['chat.defend.cold.04', "{c} was bitter. You know that, right?", {
    hype: "{c} was BITTER!! You KNOW that, right??", dry: "{c} was bitter. you know that. right", blunt: "{c} was bitter",
    goofy: "{c} was bitter!! Like a lemon! You know that, right? {e:sweat}", shy: "{c} was bitter. You know that, right?", chill: "{c} was bitter. you know that, right?",
    catty: "{c} was bitter. You know that, right? Everyone knows that", diva: "{c} was bitter, darling. You know that", stoic: "{c} was bitter" }],
  ['chat.defend.cold.05', "Hey!! Just checking we're good after this morning {e:smile}", {
    hype: "HEY!! Just checking we're GOOD after this morning {e:smile} {e:heart}", dry: "hey. just checking we're good after this morning", blunt: "We good after this morning?",
    goofy: "Hey!! Just checking we're good after this morning. Like a wellness check. For friendship {e:smile}", shy: "Hey! Just checking we're okay after this morning {e:smile}", chill: "hey, just checking we're good after this morning {e:smile}",
    catty: "Hey. Just checking we're good after this morning. We are, right?", diva: "Darling! Just checking we're good after this morning {e:smile}", stoic: "We good?" }],
  // ── a welcome for somebody new ────────────────────────────────────────
  ['welcome.warm.01', "Hi {b}!! Welcome to The Circle {e:party} I had to be the first to say hi", {
    hype: "HI {b}!! WELCOME to The Circle {e:party} {e:party} I HAD to be the first to say hi", dry: "hi {b}. welcome to the circle. i had to be the first to say hi. it's my thing", blunt: "Hi {b}. Welcome. Wanted to be first",
    goofy: "Hi {b}!! Welcome to The Circle {e:party} I had to be the first to say hi. I ran. In my mind", shy: "Hi {b}! Welcome to The Circle {e:party} I wanted to be the first to say hi", chill: "hey {b}! welcome to the circle {e:party} had to be first to say hi",
    catty: "Hi {b}. Welcome to The Circle. I had to be the first to say hi. Before the others got to you", diva: "Hello, {b}, darling! Welcome to The Circle {e:sparkle} I had to be the first", stoic: "Hi {b}. Welcome" }],
  ['welcome.warm.02', "Welcome {b}! It's a lot in here at first, but you're gonna be great", {
    hype: "WELCOME {b}!! It's A LOT in here at first, but you're gonna be GREAT {e:fire}", dry: "welcome {b}. it's a lot in here at first. you'll be fine. probably great", blunt: "Welcome {b}. It's a lot. You'll be fine",
    goofy: "Welcome {b}!! It's a lot in here at first, but you're gonna be great. Like a duckling in a pond {e:heart}", shy: "Welcome {b}! It's a lot in here at first, but I think you're going to be great", chill: "welcome {b}! it's a lot in here at first, but you're gonna be great",
    catty: "Welcome {b}. It's a lot in here at first. Stick with me and you'll be great", diva: "Welcome, {b}, darling! It's a lot at first, but you'll be fabulous {e:sparkle}", stoic: "Welcome {b}. You'll be fine" }],
  ['welcome.warm.03', "Okay, the new person is here and they have a GREAT profile", {
    hype: "OKAY!! The new person is HERE and they have a GREAT profile {e:fire}", dry: "ok, the new person is here and they have a great profile. annoyingly", blunt: "New person's here. Great profile",
    goofy: "Okay!! The new person is here and they have a GREAT profile. Better than mine. Rude {e:laugh}", shy: "Okay, the new person is here and they have a really great profile", chill: "ok, the new person's here and they've got a great profile",
    catty: "Okay, the new person is here and they have a great profile. Competition", diva: "The new arrival is here, darlings, and the profile is GREAT {e:sparkle}", stoic: "New person. Good profile" }],
  ['welcome.warm.04', "Hey {b}! Just wanted you to know you've got a friend in here already", {
    hype: "HEY {b}!! Just wanted you to know you've got a FRIEND in here already {e:heart}", dry: "hey {b}. just so you know, you've got a friend in here already. it's me", blunt: "Hey {b}. You've got a friend in here",
    goofy: "Hey {b}!! Just wanted you to know you've got a friend in here already. It's me. Hi {e:heart}", shy: "Hey {b}! Just wanted you to know you've got a friend in here already {e:heart}", chill: "hey {b}! just wanted you to know you've got a friend in here already",
    catty: "Hey {b}. You've got a friend in here already. Choose your others carefully", diva: "Hello, {b}, darling. You already have a friend in here {e:heart}", stoic: "Hey {b}. You've got a friend" }],
  ['welcome.warm.05', "WELCOME {b}! What's your story? I need to know everything", {
    hype: "WELCOME {b}!! What's your STORY?? I need to know EVERYTHING {e:eyes}", dry: "welcome {b}. what's your story. i need to know everything. no pressure", blunt: "Welcome {b}. What's your story?",
    goofy: "WELCOME {b}!! What's your story? I need to know everything. Favorite cereal first {e:eyes}", shy: "Welcome {b}! What's your story? I'd love to know everything", chill: "welcome {b}! what's your story? tell me everything",
    catty: "Welcome {b}. What's your story? I need to know everything. For research", diva: "Welcome, {b}, darling! What's your story? Tell me everything {e:sparkle}", stoic: "Welcome {b}. Your story?" }],
  // ── a party photo on the Newsfeed ─────────────────────────────────────
  ['party.photo.m01', "Theme? Nailed it. Dance moves? Questionable {e:laugh}", {
    hype: "THEME?? NAILED IT!! Dance moves? Questionable {e:laugh} {e:fire}", dry: "theme: nailed it. dance moves: under review", blunt: "Nailed the theme. Dance moves, no",
    goofy: "Theme? Nailed it. Dance moves? Like a noodle in a washing machine {e:laugh}", shy: "Theme? I think I nailed it. Dance moves? Questionable {e:laugh}", chill: "theme? nailed it. dance moves? eh {e:laugh}",
    catty: "Theme? Nailed it. Dance moves? Still better than yours {e:side}", diva: "The theme? Nailed it, darlings. The choreography? Avant-garde {e:sparkle}", stoic: "Theme: nailed. Dancing: no" }],
  ['party.photo.m02', "Party mode: ON {e:party}", {
    hype: "PARTY MODE: ON!! {e:party} {e:fire}", dry: "party mode: on. technically", blunt: "Party mode on",
    goofy: "Party mode: ON {e:party} Snack mode: also on", shy: "Party mode: on {e:party}", chill: "party mode: on {e:party}",
    catty: "Party mode: on. Try to keep up {e:party}", diva: "Party mode: ON, darlings {e:sparkle}", stoic: "Party mode on" }],
  ['party.photo.m03', "Me pretending I can dance {e:sweat} {t:CircleParty}", {
    hype: "Me pretending I can DANCE!! {e:sweat} {t:CircleParty}", dry: "me pretending i can dance. the pretending is going badly {t:CircleParty}", blunt: "I can't dance {t:CircleParty}",
    goofy: "Me pretending I can dance. The floor is pretending too {e:sweat} {t:CircleParty}", shy: "Me pretending I can dance {e:sweat} {t:CircleParty}", chill: "me pretending I can dance {e:sweat} {t:CircleParty}",
    catty: "Me pretending I can dance. Still better than half of you {t:CircleParty}", diva: "Me, dancing like a star, darlings {e:sparkle} {t:CircleParty}", stoic: "Dancing. Badly {t:CircleParty}" }],
  ['party.photo.m04', "Dressed for the theme and I have regrets {e:laugh}", {
    hype: "Dressed for the THEME and I have REGRETS!! {e:laugh}", dry: "dressed for the theme. i have regrets", blunt: "Dressed for the theme. Regrets",
    goofy: "Dressed for the theme and I have regrets. So many regrets. Look at this hat {e:laugh}", shy: "Dressed for the theme and I have some regrets {e:laugh}", chill: "dressed for the theme and I have regrets {e:laugh}",
    catty: "Dressed for the theme. No regrets. Wish I could say the same for some of you {e:side}", diva: "Dressed for the theme, darlings. A bold choice {e:sparkle}", stoic: "Dressed for it. Regrets" }],
  ['party.photo.m05', "This party is better than any party I've been to in real life lol", {
    hype: "This party is BETTER than ANY party I've been to in real life lol {e:party}", dry: "this party is better than any party i've been to in real life. low bar", blunt: "Better than any real party I've been to",
    goofy: "This party is better than any party I've been to in real life lol. And I'm alone in a room {e:laugh}", shy: "This party is better than any party I've been to in real life lol", chill: "this party's better than any party I've been to in real life lol",
    catty: "This party is better than any party I've been to in real life. Fewer people I don't like", diva: "This party outshines every real one I've attended, darlings {e:sparkle}", stoic: "Best party yet" }],
  ['party.photo.m06', "Found my angle {e:sparkle}", {
    hype: "FOUND MY ANGLE!! {e:sparkle} {e:fire}", dry: "found my angle. took forty tries", blunt: "Found my angle",
    goofy: "Found my angle {e:sparkle} It's sideways. Don't ask", shy: "Found my angle, I think {e:sparkle}", chill: "found my angle {e:sparkle}",
    catty: "Found my angle. Every angle's my angle {e:sparkle}", diva: "Found my angle, darlings. Every one is good {e:crown}", stoic: "Angle found" }],
  ['party.photo.01', "Party of one but make it iconic {e:party}", {
    hype: "Party of ONE but make it ICONIC!! {e:party} {e:fire}", dry: "party of one. iconic, allegedly", blunt: "Party of one. Iconic",
    goofy: "Party of one but make it iconic {e:party} The one is me. I'm the party", shy: "Party of one, but make it iconic {e:party}", chill: "party of one but make it iconic {e:party}",
    catty: "Party of one but make it iconic. The best company {e:party}", diva: "A party of one, darlings. Iconic {e:crown}", stoic: "Party of one" }],
  ['party.photo.02', "Dressed up with nowhere to go {e:sparkle} {t:CircleParty}", {
    hype: "DRESSED UP with nowhere to go!! {e:sparkle} {t:CircleParty}", dry: "dressed up with nowhere to go. as usual {t:CircleParty}", blunt: "Dressed up. Nowhere to go {t:CircleParty}",
    goofy: "Dressed up with nowhere to go {e:sparkle} Going to the fridge. In style {t:CircleParty}", shy: "Dressed up with nowhere to go {e:sparkle} {t:CircleParty}", chill: "dressed up with nowhere to go {e:sparkle} {t:CircleParty}",
    catty: "Dressed up with nowhere to go. Still the best dressed {t:CircleParty}", diva: "Dressed to the nines with nowhere to go, darlings {e:sparkle} {t:CircleParty}", stoic: "Dressed up {t:CircleParty}" }],
  ['party.photo.03', "Tonight's look {e:fire}", {
    hype: "TONIGHT'S LOOK!! {e:fire} {e:fire}", dry: "tonight's look. you're welcome", blunt: "Tonight's look",
    goofy: "Tonight's look {e:fire} Mostly glitter and confidence", shy: "Tonight's look {e:fire}", chill: "tonight's look {e:fire}",
    catty: "Tonight's look. Take notes {e:fire}", diva: "Tonight's look, darlings {e:crown}", stoic: "Tonight's look" }],
  ['party.photo.04', "Who's still up?? {e:eyes}", {
    hype: "WHO'S STILL UP?? {e:eyes} {e:party}", dry: "who's still up. asking for me", blunt: "Who's still up?",
    goofy: "Who's still up?? {e:eyes} I'm up. My snacks are up", shy: "Is anyone still up? {e:eyes}", chill: "who's still up? {e:eyes}",
    catty: "Who's still up? Anyone worth talking to? {e:eyes}", diva: "Who's still awake, darlings? {e:eyes}", stoic: "Who's up?" }],
  ['party.photo.05', "Me and my props {e:laugh}", {
    hype: "Me and my PROPS!! {e:laugh} {e:party}", dry: "me and my props. a love story", blunt: "Me and my props",
    goofy: "Me and my props {e:laugh} We're a band now", shy: "Me and my props {e:laugh}", chill: "me and my props {e:laugh}",
    catty: "Me and my props. The props are carrying, honestly", diva: "Me and my props, darlings. My supporting cast {e:sparkle}", stoic: "Me. Props" }],
  ['party.photo.06', "Best party I've ever been to and I'm alone {e:party}", {
    hype: "BEST party I've EVER been to and I'm ALONE!! {e:party}", dry: "best party i've ever been to and i'm alone. says a lot", blunt: "Best party ever. Alone",
    goofy: "Best party I've ever been to and I'm alone {e:party} The lamp is my plus one", shy: "Best party I've ever been to, and I'm alone {e:party}", chill: "best party I've ever been to and I'm alone {e:party}",
    catty: "Best party I've ever been to and I'm alone. No coincidence {e:party}", diva: "The best party of my life, darlings, and I'm alone {e:sparkle}", stoic: "Best party. Alone" }],
];
