// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/social.js — the house getting close and falling out (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/social.js. Each event keeps its casting, weight and
// consequences; the ENDING is what it decided before a word was picked.
//
//   social.alliance    social-alliance-forms    a and b agree to look out for each other
//                      formed
//   social.trust       social-late-night-trust  a opens up to b, late
//                      deep (a means it to the bone: both remember) | warm
//   social.paranoia    social-paranoia          a starts to doubt b
//                      wrong (b was loyal all along) | founded
//   social.rumour      social-rumour            a plants a story with b about c (not in the room)
//                      lands | caught
//   social.spark       social-showmance-spark   a and b, something starting
//                      spark | something
//   social.grudge      social-grudge-hardens    a decides b has to go (b is not in the room)
//                      hardens; `reason` says what b did: betrayal | vote | lie |
//                      humiliation | promise | left-out | house | plan
//   social.adrift      social-drifting-out      a, outside every plan, reaches for b
//                      adrift

export default {
  // ── an alliance, said out loud ─────────────────────────────────────
  'social.alliance.formed': [
    { id: 'sa.f1', turns: [
      { beat: '{a} and {b} are the last two awake.' },
      { by: 'a', say: "Can I ask you something? Are we actually looking out for each other?" },
      { by: 'b', say: "I thought we already were." },
      { by: 'a', say: "Then let's say it. Properly." },
      { by: 'b', say: "Okay. You and me. Who else needs to know?" },
      { by: 'a', say: "Nobody. Yet." },
    ] },
    { id: 'sa.f2', turns: [
      { by: 'a', say: "I'm not asking you to pick a side." },
      { by: 'b', say: "You kind of are." },
      { by: 'a', say: "...Okay, I kind of am." },
      { by: 'b', say: "Fine. I pick yours." },
    ] },
    { id: 'sa.f3', turns: [
      { by: 'b', say: "Are you trying to make something with me?" },
      { by: 'a', say: "Is it that obvious?" },
      { by: 'b', say: "You've said three names and watched my face every time." },
      { by: 'a', say: "And?" },
      { by: 'b', say: "And yes. Let's do it." },
    ] },
    { id: 'sa.f4', turns: [
      { by: 'b', say: "Who do you actually trust in here?" },
      { beat: '{a} looks at the door before answering.' },
      { by: 'a', say: "You. That's the list." },
      { by: 'b', say: "Short list." },
      { by: 'a', say: "Short lists last longer." },
    ] },
    { id: 'sa.f5', turns: [
      { by: 'a', say: "Here's my pitch. We tell each other everything. Every name, every conversation." },
      { by: 'b', say: "Everything?" },
      { by: 'a', say: "Everything that matters for the game." },
      { by: 'b', say: "Deal. Starting now." },
    ] },
    { id: 'sa.f6', turns: [
      { by: 'a', say: "I need one person in here who'll tell me if my name comes up." },
      { by: 'b', say: "And you'd do the same for me?" },
      { by: 'a', say: "The second I hear it." },
      { beat: 'They shake on it quickly, while nobody is looking.' },
    ] },
    { id: 'sa.f7', when: { early: true }, turns: [
      { by: 'a', say: "It's early, I know. But I'd rather have one real person than ten maybes." },
      { by: 'b', say: "Funny. I was going to say the exact same thing." },
      { by: 'a', say: "Then we're already on the same page." },
    ] },
    { id: 'sa.f8', turns: [
      { by: 'b', say: "Everyone's pairing up. Have you noticed?" },
      { by: 'a', say: "I've noticed. I don't want to be the one left over." },
      { by: 'b', say: "Then don't be. Pair up with me." },
      { by: 'b', dr: "I didn't plan to make an alliance today. I'm glad I did." },
    ] },
    { id: 'sa.f9', turns: [
      { by: 'a', say: "You've never once lied to me in here. That's rare." },
      { by: 'b', say: "That's not a high bar." },
      { by: 'a', say: "In this house it's the highest bar there is. Work with me." },
      { by: 'b', say: "...Okay. I'm in." },
    ] },
    { id: 'sa.f10', turns: [
      { by: 'a', say: "What would you call us? If we were an alliance?" },
      { by: 'b', say: "We're not naming it." },
      { by: 'a', say: "Why not?" },
      { by: 'b', say: "Because named alliances get found out. Unnamed ones win." },
      { by: 'a', dr: "Fine. No name. But it's real." },
    ] },
    { id: 'sa.f11', turns: [
      { by: 'a', say: "If I win HOH, you're safe. Simple as that." },
      { by: 'b', say: "And if I win?" },
      { by: 'a', say: "Then I'd like the same." },
      { by: 'b', say: "You've got it." },
    ] },
    { id: 'sa.f12', when: { room: ['backyard'] }, turns: [
      { beat: '{a} and {b} are lying on the hammock in the backyard, speaking quietly.' },
      { by: 'b', say: "Is this an alliance meeting?" },
      { by: 'a', say: "It's two people on a hammock." },
      { by: 'b', say: "That's what every alliance meeting looks like." },
    ] },
    { id: 'sa.f13', when: { late: true }, turns: [
      { by: 'a', say: "There's not many of us left. And nobody's looking at us together." },
      { by: 'b', say: "That's the best place to be." },
      { by: 'a', say: "So let's stay there. Together." },
    ] },
    { id: 'sa.f14', turns: [
      { by: 'a', say: "You're smart. I'm smart. People are going to notice that eventually." },
      { by: 'b', say: "So we should stick together before they do." },
      { by: 'a', say: "Exactly what I was going to say." },
    ] },
    { id: 'sa.f15', turns: [
      { by: 'b', say: "I've been watching you. You don't say much, but you see everything." },
      { by: 'a', say: "So do you." },
      { by: 'b', say: "Then let's compare notes. Every night." },
      { by: 'a', dr: "That's the best offer I've had in this house. I'm taking it." },
    ] },
    { id: 'sa.f16', turns: [
      { by: 'a', say: "Pinky swear it's just us." },
      { by: 'b', say: "We're adults." },
      { by: 'a', say: "Pinky swear." },
      { by: 'b', say: "...Fine. Pinky swear." },
    ] },
  ],

  // ── a late-night confidence ────────────────────────────────────────
  'social.trust.deep': [
    { id: 'st.d1', turns: [
      { by: 'a', say: "Can I tell you something I haven't told anyone in here?" },
      { by: 'b', say: "Of course." },
      { by: 'a', say: "I almost didn't come. I nearly said no the day before." },
      { by: 'b', say: "I'm really glad you didn't." },
      { by: 'b', dr: "That wasn't game talk. That was real. I'm keeping it to myself." },
    ] },
    { id: 'st.d2', turns: [
      { beat: 'Two in the morning. Everyone else is asleep.' },
      { by: 'a', say: "This week's been really hard for me." },
      { by: 'b', say: "I know. I could tell." },
      { by: 'a', say: "You could?" },
      { by: 'b', say: "You stopped making jokes. You always make jokes." },
    ] },
    { id: 'st.d3', turns: [
      { by: 'a', say: "Promise me this stays between us." },
      { by: 'b', say: "I promise." },
      { by: 'a', say: "I'm scared the people at home won't recognise me when they watch this." },
      { beat: '{b} doesn\'t say anything. {b} just takes {a}\'s hand.' },
    ] },
    { id: 'st.d4', turns: [
      { by: 'a', say: "I don't open up to people. Ever. I don't know why I'm doing it now." },
      { by: 'b', say: "Maybe because you know I won't use it against you." },
      { by: 'a', say: "...Yeah. I believe that." },
    ] },
    { id: 'st.d5', turns: [
      { by: 'a', say: "Can I be honest about something? I miss home so much it hurts." },
      { by: 'b', say: "Tell me about it. All of it." },
      { beat: 'They talk until it is nearly morning.' },
    ] },
    { id: 'st.d6', turns: [
      { by: 'a', say: "Whatever happens in the game, I need you to know this part was real." },
      { by: 'b', say: "Which part?" },
      { by: 'a', say: "This. Us, talking like this." },
      { by: 'b', say: "It's real for me too." },
    ] },
    { id: 'st.d7', turns: [
      { by: 'a', say: "I've been through some stuff this year. It's why I applied, really." },
      { by: 'b', say: "You don't have to tell me." },
      { by: 'a', say: "I want to. You're the first person in here I want to tell." },
      { by: 'a', dr: "I said more to {b} tonight than I've said to anyone in a year." },
    ] },
    { id: 'st.d8', turns: [
      { by: 'b', say: "You're different at night, you know." },
      { by: 'a', say: "Different how?" },
      { by: 'b', say: "Honest." },
      { by: 'a', say: "...Don't tell anyone. I've got a reputation." },
    ] },
    { id: 'st.d9', turns: [
      { by: 'a', say: "If you ever need to put me up, tell me first. That's all I ask." },
      { by: 'b', say: "I'm not going to put you up." },
      { by: 'a', say: "I know. But if you ever do. Tell me first." },
      { by: 'b', say: "I promise." },
    ] },
    { id: 'st.d10', when: { room: ['kitchen'] }, turns: [
      { beat: '{a} and {b} sit on the kitchen floor with their backs against the cupboards, sharing one blanket.' },
      { by: 'a', say: "I'm scared I'm not good enough at this." },
      { by: 'b', say: "At the game?" },
      { by: 'a', say: "At any of it." },
      { by: 'b', say: "You're better at it than you think. Trust me." },
    ] },
    { id: 'st.d11', turns: [
      { by: 'a', say: "Can I tell you the real reason I'm here?" },
      { by: 'b', say: "Only if you want to." },
      { by: 'a', say: "I wanted to prove I could do something hard. Something nobody thought I'd do." },
      { by: 'b', say: "You're doing it." },
    ] },
    { id: 'st.d12', turns: [
      { by: 'a', say: "I don't cry. Ever. I'm about to, and I need you to not tell anyone." },
      { by: 'b', say: "Tell anyone what? I'm not even here." },
      { by: 'a', dr: "{b} didn't ask a single question. Just sat with me until I'd stopped. I'm not going to forget that." },
    ] },
    { id: 'st.d13', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Everyone thinks I'm angry all the time. I'm not. I'm scared all the time. It just comes out loud." },
      { by: 'b', say: "I know. I've always known." },
    ] },
    { id: 'st.d14', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Everybody in here gets the act. You're getting the real me. That doesn't happen." },
      { by: 'b', say: "How do I know this isn't the act?" },
      { by: 'a', say: "Because the act would have a better line than that." },
    ] },
    { id: 'st.d15', when: { register: 'shy' }, turns: [
      { by: 'a', say: "I'm not good at talking. But I'm good at talking to you." },
      { by: 'b', say: "Then keep talking. I'm not going anywhere." },
    ] },
  ],
  'social.trust.warm': [
    { id: 'st.w1', when: { room: ['kitchen'] }, turns: [
      { beat: 'Everyone else has gone to bed. {a} and {b} are still at the kitchen table.' },
      { by: 'a', say: "Tell me about where you grew up." },
      { by: 'b', say: "Honestly? It's really boring." },
      { by: 'a', say: "Good. I could do with some boring." },
    ] },
    { id: 'st.w2', turns: [
      { by: 'a', say: "Do you miss anything from outside?" },
      { by: 'b', say: "My bed. Real coffee. Silence. In that order." },
      { by: 'a', say: "Real coffee is a strong third." },
    ] },
    { id: 'st.w3', turns: [
      { by: 'a', say: "No game talk tonight. Deal?" },
      { by: 'b', say: "Deal. What do we talk about, then?" },
      { by: 'a', say: "Literally anything else." },
      { beat: 'They end up arguing about pizza toppings for forty minutes.' },
    ] },
    { id: 'st.w4', turns: [
      { by: 'b', say: "What's the first thing you'll do when you get out?" },
      { by: 'a', say: "Order a ridiculous amount of food and not share any of it." },
      { by: 'b', say: "Respect." },
    ] },
    { id: 'st.w5', turns: [
      { by: 'a', say: "I'm glad you're in here." },
      { by: 'b', say: "That's random." },
      { by: 'a', say: "It's late. Random is allowed." },
      { by: 'b', say: "...I'm glad you're in here too." },
    ] },
    { id: 'st.w6', turns: [
      { by: 'a', say: "Do you ever forget there are cameras?" },
      { by: 'b', say: "Only at night. Like now." },
      { by: 'a', say: "Same. It's the only time this place feels normal." },
    ] },
    { id: 'st.w7', turns: [
      { by: 'b', say: "What were you like at school?" },
      { by: 'a', say: "Loud. Annoying. Always in trouble." },
      { by: 'b', say: "So, exactly the same." },
      { by: 'a', say: "Rude. Accurate. But rude." },
    ] },
    { id: 'st.w8', when: { room: ['backyard'] }, turns: [
      { beat: '{a} and {b} lie in the backyard looking up at the sky.' },
      { by: 'a', say: "You can almost forget we're locked in here." },
      { by: 'b', say: "Almost." },
      { by: 'a', say: "Then let's almost forget, for a bit." },
    ] },
    { id: 'st.w9', turns: [
      { by: 'a', say: "Can I ask you something personal?" },
      { by: 'b', say: "Depends how personal." },
      { by: 'a', say: "Who do you miss most?" },
      { by: 'b', say: "My friends. The ones who'll be screaming at the TV right now." },
    ] },
    { id: 'st.w10', turns: [
      { by: 'b', say: "I didn't think I'd like you, honestly. When we first walked in." },
      { by: 'a', say: "Wow. Thanks." },
      { by: 'b', say: "I was wrong. That's the whole point of the story." },
      { by: 'a', say: "Okay. That's a better story." },
    ] },
    { id: 'st.w11', turns: [
      { by: 'b', say: "What's the best meal you've ever had?" },
      { by: 'a', say: "Don't. I'm starving." },
      { by: 'b', say: "Describe it. Slowly." },
      { by: 'a', say: "You're a monster." },
    ] },
    { id: 'st.w12', turns: [
      { by: 'a', say: "Do you think people at home like us?" },
      { by: 'b', say: "I think they like you. I think they're confused by me." },
      { by: 'a', say: "Confused is a type of like." },
    ] },
    { id: 'st.w13', when: { register: 'competitor', room: ['kitchen'] }, turns: [
      { by: 'a', say: "Arm wrestle. Right now. Settle it." },
      { by: 'b', say: "Settle what?" },
      { by: 'a', say: "Doesn't matter. Arm wrestle." },
      { beat: 'They arm wrestle on the kitchen counter. It takes far longer than either of them expected.' },
    ] },
    { id: 'st.w14', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I made you a little friendship bracelet out of a hair tie. Don't laugh." },
      { by: 'b', say: "I'm not laughing. I'm wearing it." },
    ] },
    { id: 'st.w15', when: { register: 'cool' }, turns: [
      { by: 'b', say: "You never really switch off, do you?" },
      { by: 'a', say: "I'm switched off right now." },
      { by: 'b', say: "You're counting the people in the room." },
      { by: 'a', say: "...Old habits." },
    ] },
  ],

  // ── paranoia ──────────────────────────────────────────────────────
  // b is the one a starts to doubt. "wrong": b was loyal; "founded": the doubt is earned.
  'social.paranoia.wrong': [
    { id: 'sp.w1', turns: [
      { by: 'a', dr: "{b} looked at me weird at breakfast. Not normal weird. Weird weird. I've been thinking about it all day." },
      { beat: 'Across the room, {b} is making {a} a cup of tea.' },
    ] },
    { id: 'sp.w2', turns: [
      { by: 'a', say: "Are we okay? Honestly?" },
      { by: 'b', say: "Of course we are. Why?" },
      { by: 'a', say: "You've been quiet with me." },
      { by: 'b', say: "I've been tired. That's it. I promise." },
      { by: 'a', dr: "That's exactly what you'd say if something was wrong." },
    ] },
    { id: 'sp.w3', turns: [
      { by: 'a', dr: "Nobody's checked in with me all afternoon. Not even {b}. Especially not {b}. Something's going on." },
      { beat: '{b} is asleep on the couch, and has been all afternoon.' },
    ] },
    { id: 'sp.w4', turns: [
      { by: 'a', say: "Who were you talking to in the bedroom?" },
      { by: 'b', say: "Nobody. I was folding laundry." },
      { by: 'a', say: "For an hour?" },
      { by: 'b', say: "There's a lot of laundry!" },
    ] },
    { id: 'sp.w5', turns: [
      { by: 'a', dr: "I keep counting the votes and they don't add up. The only way they don't add up is if {b} is lying to me." },
    ] },
    { id: 'sp.w6', turns: [
      { by: 'a', say: "{b}'s being weird with me. Has anyone else noticed?" },
      { by: 'b', say: "I'm right here." },
      { by: 'a', say: "...I know." },
      { by: 'b', dr: "I have done nothing. Nothing! And somehow I'm on trial." },
    ] },
    { id: 'sp.w7', turns: [
      { by: 'a', dr: "{b} hugged me goodnight. {b} never hugs me goodnight. Why is {b} hugging me goodnight?" },
    ] },
    { id: 'sp.w8', turns: [
      { by: 'a', say: "You'd tell me if you'd heard my name, right?" },
      { by: 'b', say: "You'd be the first to know. You know that." },
      { by: 'a', say: "Do I?" },
      { by: 'b', say: "...You should." },
    ] },
    { id: 'sp.w9', turns: [
      { by: 'a', dr: "Everyone says I'm overthinking it. Maybe I am. I'd rather that than get blindsided." },
      { beat: 'Meanwhile {b} is telling somebody else how much {b} trusts {a}.' },
    ] },
    { id: 'sp.w10', turns: [
      { by: 'a', say: "Why did you stop talking when I walked in?" },
      { by: 'b', say: "We were talking about you. Because we were worried about you." },
      { by: 'a', say: "...Oh." },
      { by: 'a', dr: "I still don't trust it." },
    ] },
    { id: 'sp.w11', turns: [{ by: 'a', dr: "{b} saved me a seat at dinner. Why would {b} save me a seat? What does {b} know?" }] },
    { id: 'sp.w12', turns: [
      { by: 'a', say: "You've been really nice to me today." },
      { by: 'b', say: "I'm always nice to you." },
      { by: 'a', say: "Exactly. Suspiciously consistent." },
      { by: 'b', say: "Do you hear yourself?" },
    ] },
    { id: 'sp.w13', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "If you're going to turn on me, just do it now!" },
      { by: 'b', say: "Turn on you? I've been defending you all day!" },
      { by: 'a', say: "...Oh." },
    ] },
    { id: 'sp.w14', when: { register: 'shy' }, turns: [{ by: 'a', dr: "I don't know why I can't believe {b} likes me. Maybe because nobody in here usually does." }] },
    { id: 'sp.w15', when: { register: 'schemer' }, turns: [{ by: 'a', dr: "If I were {b}, I'd be lying to me right now. So {b} must be lying to me. That's just logic." }] },
  ],
  'social.paranoia.founded': [
    { id: 'sp.f1', turns: [
      { by: 'a', dr: "{b} has been on the other side of every door I walk through today. That's not an accident." },
    ] },
    { id: 'sp.f2', turns: [
      { by: 'a', say: "Where were you last night?" },
      { by: 'b', say: "Asleep." },
      { by: 'a', say: "Your bed was empty at one." },
      { by: 'b', say: "Bathroom." },
      { by: 'a', dr: "For forty minutes. Sure." },
    ] },
    { id: 'sp.f3', turns: [
      { by: 'a', dr: "{b} keeps asking me who I'm voting for. If we were really close, {b} would already know." },
    ] },
    { id: 'sp.f4', turns: [
      { by: 'a', say: "You've been different with me this week." },
      { by: 'b', say: "I haven't." },
      { by: 'a', say: "You have. And I'd rather you just told me why." },
      { by: 'b', say: "There's nothing to tell." },
      { by: 'a', dr: "{b} is hiding something. I can tell." },
    ] },
    { id: 'sp.f5', turns: [
      { beat: '{a} watches {b} leave the HOH room for the third time today.' },
      { by: 'a', dr: "Third visit. Third. Either {b} is very fond of that bed, or {b} is making a deal I'm not in." },
    ] },
    { id: 'sp.f6', turns: [
      { by: 'a', say: "Just tell me if something's changed between us." },
      { by: 'b', say: "Nothing's changed." },
      { by: 'a', say: "Then why can't you look at me?" },
    ] },
    { id: 'sp.f7', turns: [
      { by: 'a', dr: "The vote count only works if {b} is with me. And I don't think {b} is with me any more." },
    ] },
    { id: 'sp.f8', turns: [
      { by: 'a', say: "I heard my name in the bedroom earlier." },
      { by: 'b', say: "People say everyone's name." },
      { by: 'a', say: "In your voice?" },
      { beat: '{b} doesn\'t answer straight away. {a} doesn\'t need to hear any more.' },
    ] },
    { id: 'sp.f9', turns: [
      { by: 'a', dr: "I've been wrong about people in here before. I really don't think I'm wrong about {b}." },
    ] },
    { id: 'sp.f10', turns: [
      { by: 'a', say: "Who've you been talking to?" },
      { by: 'b', say: "Everyone. That's the game." },
      { by: 'a', say: "Everyone except me, lately." },
    ] },
    { id: 'sp.f11', turns: [{ by: 'a', dr: "{b} keeps ending conversations the second I walk into the room. I'm not imagining that. Nobody imagines that." }] },
    { id: 'sp.f12', when: { early: false }, turns: [
      { by: 'a', say: "Who did you vote for last week? Honestly." },
      { by: 'b', say: "You know who I voted for." },
      { by: 'a', say: "I know who you told me you voted for." },
      { beat: '{b} doesn\'t answer.' },
    ] },
    { id: 'sp.f13', when: { register: 'cool' }, turns: [{ by: 'a', dr: "The votes don't add up unless {b} lied to me. So {b} lied to me." }] },
    { id: 'sp.f14', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Stop. Just stop pretending, {b}." },
      { by: 'b', say: "Pretending what?" },
      { by: 'a', say: "That you're still with me!" },
    ] },
    { id: 'sp.f15', when: { register: 'sweet' }, turns: [{ by: 'a', dr: "I don't want it to be true about {b}. I really don't. But I'm not stupid." }] },
  ],

  // ── a rumour: a plants it with b, about c (not in the room) ─────────
  'social.rumour.lands': [
    { id: 'sr.l1', turns: [
      { by: 'a', say: "I'm only telling you because I'd want to know." },
      { by: 'b', say: "Tell me what?" },
      { by: 'a', say: "{c} has been putting your name forward. As a target." },
      { by: 'b', say: "...{c} said that? Word for word?" },
      { by: 'a', say: "Word for word." },
      { by: 'a', dr: "Almost word for word. I changed one word." },
    ] },
    { id: 'sr.l2', turns: [
      { by: 'a', say: "Don't react. Just listen." },
      { by: 'b', say: "Okay..." },
      { by: 'a', say: "{c} called you fake. In front of people." },
      { by: 'b', dr: "{c}? I'd never have guessed. Maybe that's the point." },
    ] },
    { id: 'sr.l3', turns: [
      { by: 'a', say: "Watch {c} tonight. Just watch." },
      { by: 'b', say: "Watch for what?" },
      { by: 'a', say: "You'll see. I've already said too much." },
      { beat: '{b} spends the evening watching {c} closely.' },
    ] },
    { id: 'sr.l4', turns: [
      { by: 'a', say: "You know {c} has a final two with someone, right? And it isn't you." },
      { by: 'b', say: "That's not true." },
      { by: 'a', say: "Ask {c}. See how fast the answer comes." },
      { by: 'b', dr: "I won't ask. I don't think I want to hear the answer." },
    ] },
    { id: 'sr.l5', turns: [
      { by: 'a', say: "I probably shouldn't say this." },
      { by: 'b', say: "Then why are you saying it?" },
      { by: 'a', say: "Because {c} is saying worse about you, and you deserve to know." },
      { by: 'a', dr: "It's easy to get people suspicious. You just have to pick the right person to tell." },
    ] },
    { id: 'sr.l6', turns: [
      { by: 'a', say: "{c} laughed when your name came up. Like, properly laughed." },
      { by: 'b', say: "Laughed how?" },
      { by: 'a', say: "Like you were a joke." },
      { by: 'b', say: "Right. Good to know where I stand." },
    ] },
    { id: 'sr.l7', turns: [
      { by: 'a', say: "I'm not trying to start anything." },
      { by: 'b', say: "But?" },
      { by: 'a', say: "But {c} told me you're the easiest vote in the house." },
      { by: 'b', dr: "Easiest vote. Okay. Let's see how easy I am." },
    ] },
    { id: 'sr.l8', turns: [
      { by: 'a', say: "Has {c} asked you about me?" },
      { by: 'b', say: "No. Why?" },
      { by: 'a', say: "Because {c} keeps asking me about you. Like {c} is building a case." },
      { by: 'b', say: "...That's weird. That's really weird." },
    ] },
  ],
  'social.rumour.caught': [
    { id: 'sr.c1', turns: [
      { by: 'a', say: "So {c} said you were a floater." },
      { by: 'b', say: "Where did you hear that?" },
      { by: 'a', say: "Around." },
      { by: 'b', say: "Around where? Who was there? What were the exact words?" },
      { by: 'a', say: "...Maybe I misunderstood." },
    ] },
    { id: 'sr.c2', turns: [
      { by: 'a', say: "I just think you should know what {c} has been saying." },
      { by: 'b', say: "Okay." },
      { beat: 'The second {a} walks off, {b} goes straight to find {c}.' },
      { by: 'b', dr: "When someone tells me something like that, I check it. And I ask myself why they told me." },
    ] },
    { id: 'sr.c3', turns: [
      { by: 'a', say: "{c} said something really nasty about you." },
      { by: 'b', say: "{c} would never use those words. I know how {c} talks." },
      { by: 'a', say: "Well, that's what I heard." },
      { by: 'b', say: "Why are you trying to start something, {a}?" },
    ] },
    { id: 'sr.c4', turns: [
      { by: 'a', say: "Don't trust {c}. That's all I'm saying." },
      { by: 'b', say: "Funny. {c} has never once told me not to trust you." },
      { by: 'a', say: "..." },
      { by: 'b', dr: "So now I'm watching {a}, not {c}." },
    ] },
    { id: 'sr.c5', turns: [
      { by: 'a', say: "Apparently {c} has been talking about you behind your back." },
      { by: 'b', say: "Apparently? According to who?" },
      { by: 'a', say: "I can't say." },
      { by: 'b', say: "Then I can't believe it." },
    ] },
    { id: 'sr.c6', turns: [
      { by: 'a', say: "{c} is coming after you. I'm just warning you." },
      { by: 'b', say: "{c} sat with me for an hour last night. We're fine." },
      { by: 'a', say: "That's what {c} wants you to think." },
      { by: 'b', dr: "No. That's what {a} wants me to think. Big difference." },
    ] },
    { id: 'sr.c7', turns: [
      { by: 'a', say: "I'm only telling you because I care about you." },
      { by: 'b', say: "You've spoken to me twice since we got here." },
      { by: 'a', say: "...I care quietly." },
      { by: 'b', say: "Sure you do." },
    ] },
    { id: 'sr.c8', turns: [
      { by: 'a', say: "Did you hear what {c} said about you?" },
      { by: 'b', say: "No, and I don't want to. Not from you." },
      { by: 'a', say: "Wow. Okay." },
      { by: 'b', dr: "{a} has been stirring things up all week. Now I know it's been {a} the whole time." },
    ] },
  ],

  // ── a spark ───────────────────────────────────────────────────────
  'social.spark.spark': [
    { id: 'sk.s1', turns: [
      { beat: 'Somebody asks {a} and {b} what they have been talking about all day. They look at each other. Neither of them answers.' },
      { by: 'a', dr: "I don't know what's happening. I just know I keep ending up wherever {b} is." },
    ] },
    { id: 'sk.s2', turns: [
      { by: 'a', say: "You've got something on your face." },
      { by: 'b', say: "Where?" },
      { beat: '{a} wipes it away with a thumb, and takes a little longer than strictly needed.' },
      { by: 'b', say: "...Thanks." },
    ] },
    { id: 'sk.s3', turns: [
      { by: 'a', say: "Stop making me laugh, I'm trying to be serious." },
      { by: 'b', say: "You're never serious." },
      { by: 'a', say: "I am with you. Sometimes." },
      { by: 'b', dr: "Sometimes. I'll take sometimes." },
    ] },
    { id: 'sk.s4', when: { room: ['backyard'] }, turns: [
      { beat: '{a} rests a hand on {b}\'s shoulder while they talk. It stays there long enough for two people across the yard to notice.' },
      { by: 'b', dr: "Okay. So that happened." },
    ] },
    { id: 'sk.s5', turns: [
      { by: 'a', say: "Can I sit here?" },
      { by: 'b', say: "There's a whole couch." },
      { by: 'a', say: "I know. I want to sit here." },
      { by: 'b', say: "...Then sit here." },
    ] },
    { id: 'sk.s6', turns: [
      { by: 'b', say: "Are you flirting with me?" },
      { by: 'a', say: "Would it be a problem if I was?" },
      { by: 'b', say: "I haven't decided." },
      { by: 'a', say: "Let me know." },
    ] },
    { id: 'sk.s7', turns: [
      { by: 'a', say: "Goodnight." },
      { by: 'b', say: "Goodnight." },
      { beat: 'Neither of them moves.' },
      { by: 'a', say: "...You're supposed to go to bed now." },
      { by: 'b', say: "So are you." },
    ] },
    { id: 'sk.s8', when: { room: ['backyard'] }, turns: [
      { by: 'a', dr: "I came here to play a game, not to catch feelings. I'm aware of how this looks." },
      { beat: 'Out in the backyard, {a} is braiding {b}\'s hair on the couch.' },
    ] },
    { id: 'sk.s9', turns: [
      { by: 'b', say: "People are starting to talk about us." },
      { by: 'a', say: "What are they saying?" },
      { by: 'b', say: "That there's an \"us\"." },
      { by: 'a', say: "Is there?" },
      { by: 'b', say: "...Maybe." },
    ] },
    { id: 'sk.s10', turns: [
      { by: 'a', say: "I saved you the last pancake." },
      { by: 'b', say: "You saved me the last pancake?" },
      { by: 'a', say: "Don't make it a whole thing." },
      { by: 'b', dr: "It is a whole thing. In this house, saving somebody food means something." },
    ] },
    { id: 'sk.s11', turns: [
      { by: 'b', say: "You keep looking at me." },
      { by: 'a', say: "You keep catching me." },
      { by: 'b', say: "Maybe I'm looking too." },
    ] },
    { id: 'sk.s12', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "I don't do this. I don't do feelings in here." },
      { by: 'b', say: "Then what's this?" },
      { by: 'a', say: "...Annoying. This is annoying." },
    ] },
    { id: 'sk.s13', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Do you... want to sit with me tonight? For the movie?" },
      { by: 'b', say: "We don't have a movie." },
      { by: 'a', say: "Then for whatever we do instead." },
      { by: 'b', say: "I'd like that." },
    ] },
    { id: 'sk.s14', when: { register: 'schemer' }, turns: [
      { by: 'a', dr: "I told myself {b} was a strategic move. It's been a week. I'm not sure that's true any more, and I hate it." },
    ] },
  ],
  'social.spark.something': [
    { id: 'sk.o1', turns: [
      { by: 'a', say: "You're easy to talk to, you know that?" },
      { by: 'b', say: "So are you." },
      { by: 'a', say: "Good. Let's keep talking, then." },
    ] },
    { id: 'sk.o2', turns: [
      { by: 'a', say: "I like this. Hanging out with you." },
      { by: 'b', say: "Me too. As friends?" },
      { by: 'a', say: "...Sure. As friends." },
      { by: 'a', dr: "\"As friends\". I said it. Did I mean it? Ask me next week." },
    ] },
    { id: 'sk.o3', turns: [
      { beat: '{a} whispers something to {b}, and {b} bursts out laughing.' },
      { by: 'b', say: "Stop it!" },
      { by: 'a', say: "Never." },
    ] },
    { id: 'sk.o4', turns: [
      { by: 'b', say: "Why are you smiling like that?" },
      { by: 'a', say: "No reason." },
      { by: 'b', say: "There's always a reason." },
      { by: 'a', say: "Then figure it out." },
    ] },
    { id: 'sk.o5', turns: [
      { by: 'a', say: "Want to work out together tomorrow?" },
      { by: 'b', say: "At seven? Are you serious?" },
      { by: 'a', say: "I'll make you coffee first." },
      { by: 'b', say: "...Fine. Seven." },
    ] },
    { id: 'sk.o6', turns: [
      { by: 'a', dr: "I don't know what {b} and I are. Friends. Maybe more. Maybe a terrible idea. Probably all three." },
    ] },
  ],

  // ── a grudge hardens: a decides about b (not in the room) ─────────
  'social.grudge.hardens': [
    { id: 'sg.h1', turns: [
      { by: 'a', dr: "I'm done giving {b} the benefit of the doubt. I'm not asking for an explanation any more. I'm asking if the votes are there." },
    ] },
    { id: 'sg.h2', turns: [
      { beat: '{a} is perfectly friendly to {b} over dinner.' },
      { by: 'a', dr: "The next time I have any power in this house, {b} is going up. Until then, I'm being nice. It's easier." },
    ] },
    { id: 'sg.h3', turns: [
      { by: 'a', dr: "\"I'm over it\", I keep telling people. I'm not over it. I'm making a list, and {b} is at the top." },
    ] },
    { id: 'sg.h4', turns: [
      { by: 'a', dr: "I've gone over it a hundred times. What {b} did, who helped, who knew. I know exactly when I'm taking the shot." },
    ] },
    { id: 'sg.h5', turns: [
      { beat: '{a} watches {b} laughing across the room.' },
      { by: 'a', dr: "Laugh while you can. That's all I'm going to say." },
    ] },
    { id: 'sg.h6', turns: [
      { by: 'a', dr: "People think I've let it go because I've stopped talking about it. I haven't. I've made up my mind." },
    ] },
    { id: 'sg.h7', turns: [
      { by: 'a', dr: "{b} said sorry, sort of. That's not a real apology, and I'm not accepting it." },
    ] },
    { id: 'sg.h8', turns: [
      { by: 'a', dr: "I don't hate {b}. I just need {b} out of this house more than I need almost anything else." },
    ] },
    { id: 'sg.h9', when: { room: ['backyard'] }, turns: [
      { beat: '{a} sits alone on the backyard steps, staring at nothing in particular.' },
      { by: 'a', dr: "Some things I can forgive. What {b} did isn't one of them." },
    ] },
    { id: 'sg.h10', turns: [
      { by: 'a', dr: "Every time {b} walks past me, I smile. I'm just waiting for my chance." },
    ] },
    { id: 'sg.h11', when: { late: true }, turns: [
      { by: 'a', dr: "There aren't many weeks left. I'm not leaving here without making sure {b} leaves first." },
    ] },
    { id: 'sg.h12', when: { early: false }, turns: [
      { by: 'a', dr: "I've been patient for weeks. Patient is over. {b} goes the second I can make it happen." },
    ] },
    // what b did
    { id: 'sg.r1', when: { reason: 'betrayal' }, turns: [{ by: 'a', dr: "I trusted {b} with everything. {b} turned on me the first chance {b} got. That doesn't get forgiven in here." }] },
    { id: 'sg.r2', when: { reason: 'betrayal' }, turns: [{ by: 'a', dr: "You don't get to betray me and then smile at me over breakfast. {b} is going to learn that." }] },
    { id: 'sg.r3', when: { reason: 'betrayal' }, turns: [{ by: 'a', dr: "{b} chose the other side. Fine. I'm choosing too. I'm choosing {b} going home." }] },
    { id: 'sg.r4', when: { reason: 'vote' }, turns: [{ by: 'a', dr: "{b} helped put me on that block. I've smiled about it for days. I'm done smiling." }] },
    { id: 'sg.r5', when: { reason: 'vote' }, turns: [{ by: 'a', dr: "{b} put me in that chair. I'm going to put {b} in it. That's just fair." }] },
    { id: 'sg.r6', when: { reason: 'vote' }, turns: [{ by: 'a', dr: "Being on that block wasn't a game move to me. It was personal, and {b} did it." }] },
    { id: 'sg.r7', when: { reason: 'lie' }, turns: [{ by: 'a', dr: "{b} lied to my face. Looked me in the eye and lied. I can forgive almost anything in this game. Not that." }] },
    { id: 'sg.r8', when: { reason: 'lie' }, turns: [{ by: 'a', dr: "I don't believe anything {b} says to me any more. I'm done listening." }] },
    { id: 'sg.r9', when: { reason: 'lie' }, turns: [{ by: 'a', dr: "{b} plays both sides and thinks nobody notices. I noticed. I'm going to make sure everybody notices." }] },
    { id: 'sg.r10', when: { reason: 'humiliation' }, turns: [{ by: 'a', dr: "{b} embarrassed me in front of the whole house. The whole house. I haven't forgotten a single word." }] },
    { id: 'sg.r11', when: { reason: 'humiliation' }, turns: [{ by: 'a', dr: "{b} made me look like a fool in front of everybody. I'm going to make {b} look like a fool on eviction night." }] },
    { id: 'sg.r12', when: { reason: 'humiliation' }, turns: [{ by: 'a', dr: "People still bring up what {b} said to me. Every time they do, I get a little more sure." }] },
    { id: 'sg.r13', when: { reason: 'promise' }, turns: [{ by: 'a', dr: "{b} gave me {b.posAdj} word. In this house, your word is all you've got. I can't trust {b}'s any more." }] },
    { id: 'sg.r14', when: { reason: 'promise' }, turns: [{ by: 'a', dr: "We had a deal. I kept my side. {b} didn't. It's that simple." }] },
    { id: 'sg.r15', when: { reason: 'promise' }, turns: [{ by: 'a', dr: "{b} broke a promise to me. So I've made one to myself: {b} goes before I do." }] },
    { id: 'sg.r16', when: { reason: 'left-out' }, turns: [{ by: 'a', dr: "{b} held a meeting about the vote and didn't invite me. Fine. I'll hold one about {b} and not invite {b} either." }] },
    { id: 'sg.r17', when: { reason: 'left-out' }, turns: [{ by: 'a', dr: "{b} keeps deciding things without me, like I don't matter. I've still got a vote." }] },
    { id: 'sg.r18', when: { reason: 'house' }, turns: [{ by: 'a', dr: "Is it petty to want {b} out because of the mess? Maybe. Do I care? Not even a little." }] },
    { id: 'sg.r19', when: { reason: 'house' }, turns: [{ by: 'a', dr: "{b} has made living here miserable. Every single day. I want to live in this house without {b} in it." }] },
    { id: 'sg.r20', when: { reason: 'plan' }, turns: [{ by: 'a', dr: "{b} is planning to come after me. I know it. So I'm going to get there first." }] },
    { id: 'sg.r21', when: { reason: 'plan' }, turns: [{ by: 'a', dr: "I heard {b}'s plan, and I know I'm in it. So now I'm going after {b}." }] },
    { id: 'sg.h13', turns: [{ by: 'a', dr: "{b} thinks we're fine. We are not fine. We are very far from fine." }] },
    { id: 'sg.h14', turns: [{ by: 'a', dr: "I used to argue with {b}. I've stopped. There's no point. I've decided {b} has to go." }] },
    { id: 'sg.h15', turns: [
      { beat: '{a} passes {b} in the hallway and says good morning, warmly.' },
      { by: 'a', dr: "Enjoy your mornings in here, {b}. You won't have many more." },
    ] },
    { id: 'sg.h16', turns: [{ by: 'a', dr: "I'm not looking for an apology from {b} any more. I'm looking for four votes." }] },
    { id: 'sg.rs1', when: { register: 'schemer' }, turns: [{ by: 'a', dr: "I don't get angry. I make plans. And {b} is at the centre of my next one." }] },
    { id: 'sg.rs2', when: { register: 'schemer' }, turns: [{ by: 'a', dr: "I'll smile at {b}, I'll help {b} with the dishes, and I'll write {b}'s name down the first chance I get." }] },
    { id: 'sg.rf1', when: { register: 'fiery' }, turns: [{ by: 'a', dr: "Every time I see {b}'s face I want to scream. So I'm going to do the next best thing. Vote." }] },
    { id: 'sg.rf2', when: { register: 'fiery' }, turns: [{ by: 'a', dr: "People keep telling me to calm down about {b}. I am calm. This is me calm. You don't want to see the other version." }] },
    { id: 'sg.ry1', when: { register: 'shy' }, turns: [{ by: 'a', dr: "I don't usually hold grudges. But {b} has made me into somebody who does, and I'm not sure I'm sorry." }] },
    { id: 'sg.rw1', when: { register: 'sweet' }, turns: [{ by: 'a', dr: "I gave {b} chance after chance. I'm a nice person. I'm not a doormat." }] },
    { id: 'sg.rw2', when: { register: 'sweet' }, turns: [{ by: 'a', dr: "It actually hurts me to say this. {b} has to go. I'll be sad about it. I'll still do it." }] },
    { id: 'sg.rc1', when: { register: 'competitor' }, turns: [{ by: 'a', dr: "Next comp, I'm not playing for safety. I'm playing for {b}'s name on that screen." }] },
    { id: 'sg.rk1', when: { register: 'cool' }, turns: [{ by: 'a', dr: "It's not personal. Well, it is personal. But it's also good game. {b} goes next time I can make it happen." }] },
  ],

  // ── drifting out: a, outside every plan, reaches for b ─────────────
  'social.adrift.adrift': [
    { id: 'sd.a1', turns: [
      { by: 'a', say: "If there's a plan, I need to be in the room when it's made." },
      { by: 'b', say: "There's no plan." },
      { by: 'a', say: "There's always a plan. I'm just never in the room." },
      { by: 'b', say: "...Okay. Sit down. I'll tell you what I know." },
    ] },
    { id: 'sd.a2', turns: [
      { by: 'a', say: "Where's the vote? I've asked two people and got two shrugs." },
      { by: 'b', say: "You really don't know?" },
      { by: 'a', say: "Nobody tells me anything." },
      { by: 'b', say: "Okay. Here's where it is." },
    ] },
    { id: 'sd.a3', turns: [
      { by: 'a', dr: "I just realised I haven't had a single game conversation all day. That's bad. I need to fix it." },
      { by: 'a', say: "{b}, got a minute? Tell me what I've missed." },
    ] },
    { id: 'sd.a4', turns: [
      { by: 'a', say: "Is there room for one more in whatever you've got going?" },
      { by: 'b', say: "What makes you think I've got something going?" },
      { by: 'a', say: "Everybody has something going. Except me." },
      { by: 'b', say: "...Let's talk." },
    ] },
    { id: 'sd.a5', turns: [
      { by: 'a', say: "Everyone's friendly. Nobody's honest. Will you be honest with me?" },
      { by: 'b', say: "About what?" },
      { by: 'a', say: "About whether I'm next." },
      { by: 'b', say: "You're not next. But you're not safe either." },
    ] },
    { id: 'sd.a6', turns: [
      { by: 'a', dr: "Everybody likes me, but nobody needs me. That's how people go home in here." },
      { by: 'a', say: "{b}. We should work together." },
      { by: 'b', say: "Where's this come from?" },
      { by: 'a', say: "Survival." },
    ] },
  ],
};
