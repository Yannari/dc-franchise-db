// The chats in six voices (user, 2026-09-30: "matching their personality or
// their catfish personality"). Data only. Each entry is `when: { register }`
// and wins most draws for a speaker with that register (ci/register.js). For
// a catfish the register is the PERSONA's while the cover holds
// (ci/cover.js shownRegister), so the messages sound like the character.
// The voice lives in a's messages; b answers in plain words, and a's asides
// stay out of it (they are the real person, whatever the profile sounds like).
//   warm    caring, checks in, "sending love"
//   hype    loud, all energy, "LET'S GO"
//   dry     deadpan, understated, a little sarcastic
//   formal  full sentences, polite, no slang
//   flirty  teasing, "hey you"
//   blunt   straight to it, no padding
const V = (key, byRegister) => ({
  [key]: Object.entries(byRegister).flatMap(([register, list]) => list.map((turns, i) => ({
    id: `${key}.v.${register}${i + 1}`, when: { register },
    turns: turns.map(([by, text, kind = by === 'a' ? 'send' : 'send']) => ({ by, [kind]: text })),
  }))),
});

export const CHAT_VOICES = {
  ...V('chat.bond.warm', {
    warm: [
      [['a', "Hiii! I just wanted to check in on you today. How's your heart doing in there? {e:heart}"], ['b', "Honestly? Better now. Nobody's asked me that all week"], ['a', "Well I'm asking. And I'm not going anywhere {e:hug}"]],
      [['a', "Can I just say, every time your name pops up I smile. That's all. That's the message {e:smile}"], ['b', "Okay you just made my whole day"], ['a', "Good! That was the plan {e:heart}"]],
    ],
    hype: [
      [['a', "YOOO it's my favorite person in the whole building! What's the vibe today?? {e:fire}"], ['b', "Vibes are good now that you're here lol"], ['a', "LET'S GOOO we're gonna have the best day {e:party}"]],
      [['a', "Okay I just did 50 jumping jacks for no reason and I need to tell SOMEBODY {e:muscle}"], ['b', "Why is this the funniest thing I've heard all day"], ['a', "Because I'm a legend. Obviously {e:crown}"]],
    ],
    dry: [
      [['a', "Update from my apartment. I made toast. It went fine. Big day"], ['b', "Wow. Congrats on the toast"], ['a', "Thank you. It's been a journey"]],
      [['a', "So I've decided you're one of about two normal people in here. Don't make it weird"], ['b', "Honored. Who's the other one?"], ['a', "Still deciding. You're safe for now"]],
    ],
    formal: [
      [['a', "Good afternoon. I realized we haven't really talked, and I'd like to change that. How has your week been?"], ['b', "Wow, that's so polite lol. It's been good! Better now"], ['a', "I'm glad to hear it. I'd like to know you better"]],
      [['a', "I wanted to tell you that I appreciated what you said in Circle Chat earlier. It was kind"], ['b', "Oh thank you! That means a lot"], ['a', "You're welcome. I mean it sincerely"]],
    ],
    flirty: [
      [['a', "Hey you. I've been waiting all day for a good reason to message you {e:wink}"], ['b', "And what's the reason?"], ['a', "You. You're the reason {e:side}"]],
      [['a', "Okay be honest, are you this charming with everybody or is it just me? {e:eyes}"], ['b', "Lol only the special ones"], ['a', "Knew it {e:wink}"]],
    ],
    blunt: [
      [['a', "Real talk. I like you. I don't like a lot of people in here. So that's something"], ['b', "Haha thank you. I think?"], ['a', "It's a compliment. Take it"]],
      [['a', "I'm not good at small talk so I'll just say it. You seem real. I respect that"], ['b', "Appreciate that honestly"], ['a', "Good. Keep being real"]],
    ],
  }),
  ...V('chat.bond.neutral', {
    warm: [
      [['a', "Hey you! Just wanted to say hi and hope you're doing okay {e:heart}"], ['b', "Hi! I'm okay. Tired lol"], ['a', "Rest up, okay? I'm here if you need anything"]],
      [['a', "How are you holding up today? Honestly?"], ['b', "Honestly just okay. Long day"], ['a', "Sending you a big hug either way {e:hug}"]],
    ],
    hype: [
      [['a', "WHAT'S GOOD! Quick check in, how are we feeling?? {e:fire}"], ['b', "We're alright haha"], ['a', "Alright is a start! Let's get you to AMAZING"]],
      [['a', "Okay I'm bored and you're my first victim. Entertain me {e:laugh}"], ['b', "Lol I'm not that interesting today"], ['a', "Everybody's interesting! Try harder"]],
    ],
    dry: [
      [['a', "Hi. Just checking you still exist"], ['b', "Barely"], ['a', "Same. Solidarity"]],
      [['a', "I have nothing to say but I've been staring at the wall for an hour so. Hi"], ['b', "Lol hi"], ['a', "Great talk"]],
    ],
    formal: [
      [['a', "Hello. I hope your day is going well"], ['b', "It's alright. Thanks for asking!"], ['a', "Of course. Let me know if you'd like to talk later"]],
      [['a', "I wanted to reach out and say hello. We should speak more often"], ['b', "Yeah we should!"], ['a', "Agreed. Enjoy your evening"]],
    ],
    flirty: [
      [['a', "Hey stranger. Long time no chat {e:wink}"], ['b', "Lol it's been like a day"], ['a', "A day too long if you ask me"]],
      [['a', "Just wanted to see your name light up on my screen. That's all {e:smile}"], ['b', "Haha okay hi"], ['a', "Hi {e:wink}"]],
    ],
    blunt: [
      [['a', "Checking in. We should talk more. That's it"], ['b', "Haha okay, agreed"], ['a', "Good. Later"]],
      [['a', "I don't know you that well yet. Figured I'd fix that. What's your deal"], ['b', "Lol my deal? I'm just vibing"], ['a', "Fair. I'll take it"]],
    ],
  }),
  ...V('chat.bond.cold', {
    warm: [
      [['a', "Hi! I just wanted to reach out, I feel like we haven't connected yet {e:heart}"], ['b', "Oh. Hey"], ['a', "Well, my door is always open. Okay, bye for now!"]],
      [['a', "Hey, I hope everything's okay with you. You seemed quiet today"], ['b', "I'm fine"], ['a', "Okay. Well I'm here if that changes"]],
    ],
    hype: [
      [['a', "HEYYY let's be friends! Right now! Today! {e:party}"], ['b', "Lol okay that's a lot"], ['a', "Too much? Too much. Got it. I'll take it down to a seven"]],
      [['a', "Wanna hear the funniest thing that happened in my apartment today??"], ['b', "Maybe later?"], ['a', "Oh. Okay! Later! Totally!"]],
    ],
    dry: [
      [['a', "Hi. This is me trying"], ['b', "Okay"], ['a', "Cool. Good effort from both of us"]],
      [['a', "So. Weather in here's consistent"], ['b', "Yep"], ['a', "Glad we had this"]],
    ],
    formal: [
      [['a', "Hello. I'd like to get to know you better, if you're open to it"], ['b', "Sure I guess"], ['a', "Very well. Perhaps another time"]],
      [['a', "I realize we haven't spoken much. I'd like to change that"], ['b', "Mhm"], ['a', "I'll leave it there for now. Take care"]],
    ],
    flirty: [
      [['a', "Hey you. Thought I'd come say hi {e:wink}"], ['b', "Hi"], ['a', "Tough crowd today huh"]],
      [['a', "You're a mystery and I love a mystery {e:eyes}"], ['b', "I'm really not that mysterious"], ['a', "Okay. Noted. Mystery solved I guess"]],
    ],
    blunt: [
      [['a', "I'll be honest. I don't get you yet"], ['b', "Okay?"], ['a', "Just saying. Talk later"]],
      [['a', "Are we cool? You've been short with me"], ['b', "We're fine"], ['a', "Doesn't feel fine. Whatever"]],
    ],
  }),
  ...V('chat.checkin.warm', {
    warm: [
      [['a', "Hey, I saw the ratings. I just want you to know I see you, and I'm here {e:heart}"], ['b', "I didn't know how much I needed that"], ['a', "Always. We've got each other {e:hug}"]],
      [['a', "How are you really doing? Not the Circle Chat answer. The real one"], ['b', "Honestly? Not great. But this helps"], ['a', "Then I'll keep checking in. Every day if I have to"]],
    ],
    hype: [
      [['a', "Hey! Ratings don't mean ANYTHING! You're a star and tomorrow's a new day {e:sparkle}"], ['b', "Okay I actually smiled at that"], ['a', "That's what I'm here for! Let's GO"]],
      [['a', "I heard today was rough. Guess what? We're bouncing back. Starting NOW {e:muscle}"], ['b', "Lol okay coach"], ['a', "Coach is right! Coach is always right!"]],
    ],
    dry: [
      [['a', "Saw the ratings. They're dumb. You're not"], ['b', "That's weirdly comforting"], ['a', "I'm weirdly comforting. It's a gift"]],
      [['a', "Checking in because you seemed off. You don't have to perform for me"], ['b', "Thanks. Really"], ['a', "Anytime. I'll be here being unimpressed by everyone else"]],
    ],
    formal: [
      [['a', "I wanted to check on you after the ratings. How are you feeling?"], ['b', "A little hurt honestly"], ['a', "That's understandable. For what it's worth, I rated you highly"]],
      [['a', "I hope you're taking care of yourself. The results were difficult for many of us"], ['b', "Thank you. They really were"], ['a', "Please reach out if you need to talk"]],
    ],
    flirty: [
      [['a', "Hey you. Don't let the ratings get to that pretty head of yours {e:wink}"], ['b', "Lol I'm trying"], ['a', "Try harder. You're way too good for the bottom half"]],
      [['a', "Checking on my favorite person. You good? {e:heart}"], ['b', "I am now"], ['a', "That's what I like to hear"]],
    ],
    blunt: [
      [['a', "The ratings were wrong about you. Period"], ['b', "Thanks. Needed that"], ['a', "Don't thank me. It's just true"]],
      [['a', "You okay? Don't lie"], ['b', "Not really. But I will be"], ['a', "Good. And if somebody's messing with you, tell me"]],
    ],
  }),
  ...V('chat.ally.warm', {
    warm: [
      [['a', "I trust you. Like, really trust you. Can we promise to look out for each other? {e:handshake}"], ['b', "Yes. A hundred percent yes"], ['a', "Okay. You and me. Whatever happens {e:heart}"]],
      [['a', "I feel safe talking to you, and that's rare in here. Can we be a team?"], ['b', "I was hoping you'd ask"], ['a', "Then it's official {e:hug}"]],
    ],
    hype: [
      [['a', "Okay I'm just gonna say it. You and me? ALLIANCE. Unstoppable {e:fire}"], ['b', "Lol I'm in. Let's do it"], ['a', "LET'S GOOO! Team us!"]],
      [['a', "I need a ride or die in here and I'm choosing YOU {e:muscle}"], ['b', "Honored lol. Done"], ['a', "This is the best decision I've made all week!"]],
    ],
    dry: [
      [['a', "Proposal. We don't stab each other. Seems efficient"], ['b', "Lol deal"], ['a', "Great. Very romantic. Handshake emoji {e:handshake}"]],
      [['a', "I've done the math and you're the least likely to betray me. Wanna make it official"], ['b', "That's the nicest mean thing ever. Yes"], ['a', "Glad we agree"]],
    ],
    formal: [
      [['a', "I'd like to propose that we protect each other going forward. I think we'd work well together"], ['b', "I agree. Let's do it"], ['a', "Excellent. You have my word"]],
      [['a', "I believe you're trustworthy, and I value that. Would you consider an alliance?"], ['b', "Absolutely"], ['a', "Then we have an understanding"]],
    ],
    flirty: [
      [['a', "So what if you and I just... stuck together? Like, officially {e:wink}"], ['b', "Is this an alliance or a date lol"], ['a', "Why not both {e:side}"]],
      [['a', "I want you on my side. And maybe a little closer {e:eyes}"], ['b', "Lol okay I'm in"], ['a', "Perfect. Partners in crime"]],
    ],
    blunt: [
      [['a', "Let's work together. I protect you, you protect me. Deal?"], ['b', "Deal"], ['a', "Good. Nobody else needs to know"]],
      [['a', "You're solid. I want you with me. Yes or no"], ['b', "Yes"], ['a', "Done"]],
    ],
  }),
  ...V('chat.flirt.warm', {
    warm: [
      [['a', "Can I tell you something? Talking to you is the best part of my day {e:heart}"], ['b', "Stop, you're gonna make me blush"], ['a', "Good. You deserve to blush"]],
      [['a', "I keep thinking about what it'll be like to finally meet you {e:smile}"], ['b', "Same. I think about it a lot"], ['a', "Okay now I'm smiling at a screen like a fool"]],
    ],
    hype: [
      [['a', "Not gonna lie, you might be the hottest profile in the Circle {e:fire}{e:fire}"], ['b', "LOL you're too much"], ['a', "Too much? I'm just getting started!"]],
      [['a', "When we get out of here, first date is on me. Big date. Fireworks {e:party}"], ['b', "Fireworks?? Okay I'm in"], ['a', "LET'S GOOO"]],
    ],
    dry: [
      [['a', "I'd say you're cute but I'm trying to play it cool. So. You're fine"], ['b', "Just fine?"], ['a', "Extremely fine. Don't let it go to your head"]],
      [['a', "Just so you know, I don't compliment people. So this is big. You're great"], ['b', "Wow. Taking a screenshot"], ['a', "Please don't. I have a reputation"]],
    ],
    formal: [
      [['a', "I find you genuinely charming. I hope that's not too forward"], ['b', "Not at all. I feel the same"], ['a', "Then I'm very glad I said it"]],
      [['a', "I would very much like to take you to dinner when this is over"], ['b', "I would love that"], ['a', "Then it's settled. I'll hold you to it"]],
    ],
    flirty: [
      [['a', "Hey trouble {e:wink} I can't stop smiling at your messages"], ['b', "Trouble? Me? Never"], ['a', "Mmhm. Definitely trouble. The good kind {e:side}"]],
      [['a', "If I could send you one thing right now it wouldn't be a message {e:kiss}"], ['b', "Oh stop it {e:hearteyes}"], ['a', "Make me {e:wink}"]],
    ],
    blunt: [
      [['a', "I like you. Like like. Figured you should know"], ['b', "Oh wow. Okay. I like you too"], ['a', "Great. That was easier than I thought"]],
      [['a', "Not gonna play games. You're my favorite person in here and I'm into you"], ['b', "That's so refreshing honestly"], ['a', "Life's short. Circle's shorter"]],
    ],
  }),
  ...V('chat.flirt.neutral', {
    warm: [
      [['a', "You've got the sweetest energy, you know that? {e:smile}"], ['b', "Aw thank you"], ['a', "I mean it! Okay, I'll let you go"]],
      [['a', "I hope we get to hang out for real one day {e:heart}"], ['b', "Yeah that'd be fun"], ['a', "It would! Okay, talk soon"]],
    ],
    hype: [
      [['a', "Okay your last picture? Fire. Just saying {e:fire}"], ['b', "Haha thanks"], ['a', "Anytime! Keep 'em coming!"]],
      [['a', "Is it just me or are we the best duo in here?? {e:clap}"], ['b', "Lol maybe"], ['a', "Maybe is a yes in my book!"]],
    ],
    dry: [
      [['a', "Your profile pic is objectively decent. Just an observation"], ['b', "Lol thanks I guess"], ['a', "You're welcome. Don't make it weird"]],
      [['a', "Thinking about you. Mostly because there's nothing else to think about in here"], ['b', "Wow flattering"], ['a', "I try"]],
    ],
    formal: [
      [['a', "I think you're lovely. I wanted you to know"], ['b', "That's sweet, thank you"], ['a', "Of course. Have a nice night"]],
      [['a', "You've made this experience much brighter for me"], ['b', "Aw. Thank you"], ['a', "I mean it. Goodnight"]],
    ],
    flirty: [
      [['a', "You up? Asking for me {e:wink}"], ['b', "Lol I'm up. What's up"], ['a', "Just wanted an excuse to talk to you"]],
      [['a', "Okay so when are you going to admit you're into me {e:side}"], ['b', "Lol when you admit it first"], ['a', "Touché {e:wink}"]],
    ],
    blunt: [
      [['a', "I think you're attractive. Carry on"], ['b', "Lol okay thanks"], ['a', "That's all"]],
      [['a', "Are you flirting with me or is that just how you type"], ['b', "Hmm maybe both"], ['a', "Noted"]],
    ],
  }),
  ...V('chat.pitch.warm', {
    warm: [
      [['a', "I don't usually ask for anything, but I'm scared about tonight. Could you keep me high? {e:pray}"], ['b', "Of course. You're up top for me"], ['a', "Thank you. You're the best {e:heart}"]],
      [['a', "Whatever happens tonight, I'm putting you near the top. I hope you'll do the same for me"], ['b', "Already planned on it"], ['a', "That means everything {e:hug}"]],
    ],
    hype: [
      [['a', "Ratings tonight! Let's put each other UP THERE, you in?? {e:fire}"], ['b', "I'm in! Top two let's go"], ['a', "TEAM US! Influencers here we come!"]],
      [['a', "Okay game plan: you rate me high, I rate you high, we run this place {e:crown}"], ['b', "Love the plan"], ['a', "Best plan ever! Obviously!"]],
    ],
    dry: [
      [['a', "Ratings tonight. I'd prefer not to be blocked. If that's convenient"], ['b', "Lol I got you"], ['a', "Appreciated. Very normal of you"]],
      [['a', "Transactional question. Do I have your top spot? Asking for my survival"], ['b', "Top two for sure"], ['a', "Great. Survival secured. Probably"]],
    ],
    formal: [
      [['a', "Before tonight's ratings, I'd like to ask for your support. I'll return it"], ['b', "You have it"], ['a', "Thank you. I won't forget it"]],
      [['a', "I'd be grateful if you could place me highly tonight. You'll be near the top of mine"], ['b', "Same here, don't worry"], ['a', "I appreciate that very much"]],
    ],
    flirty: [
      [['a', "So... am I number one on your list tonight? {e:wink}"], ['b', "Maybe lol"], ['a', "Maybe better mean yes {e:side}"]],
      [['a', "Rate me high and I'll make it worth your while {e:wink}"], ['b', "Oh really? How?"], ['a', "Guess you'll find out {e:eyes}"]],
    ],
    blunt: [
      [['a', "Ratings tonight. I need you to put me high. I'll do the same. Deal?"], ['b', "Deal"], ['a', "Good. Don't forget"]],
      [['a', "I'm asking straight. Top three for me tonight?"], ['b', "Yeah I got you"], ['a', "Thanks. Same for you"]],
    ],
  }),
};
