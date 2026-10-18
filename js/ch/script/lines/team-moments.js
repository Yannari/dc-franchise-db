// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/team-moments.js — a Teams season's big moments, with both teams reacting (2026-10-17)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-17: "reactions to the dailies, defeat, victory, strategy, who to blame, vote, alliance, per team,
// like in Total Drama" and "get more reactions than that to a switch or a stay". teams.js files them: the Arena winner
// switching (in front of both teams) or staying, both teams after every team daily, the losing team's small groups
// settling on a name, a bloc forming inside a team.
//
// Rewritten the same day (the user: "You had my back until tonight. Tonight you had my name. What does that mean?
// Nobody talks this way. Write like a real human dialogue"): plain spoken English, a reply that answers the line
// before it, no punchline lines. The five voices change the tone, never the meaning: sharp is blunt, dry is
// understated, loud is big (whole sentences, not a string of shouts), soft is gentle, odd adds a small aside that
// still makes sense on a first read. Every variant passes the gate in lines/index.js (variantFails).

export default {
  // ── switching sides, both teams watching (more of team-switch.any; tms.1 and tms.2 are in teams.js) ──
  'team-switch.any+': [
    { id: 'tms.3', turns: [
      { by: 'tj', say: "{a}, you won, and it was your own team that put you in there. So are you going back to {from}, or are you switching to {to}?" },
      { by: 'a', say: "I'm switching to {to}.",
        v: { sharp: "I'm switching. {to}.", dry: "I'll take {to}, thanks.", loud: "I'm switching to {to}!", soft: "I think I'm going to switch to {to}.", odd: "I'm switching to {to}. Sorry, not sorry." } },
      { beat: 'Half the stand cheers. The other half just stares.' },
      { by: 'b', opt: 1, say: "Get over here! You deserve a team that actually wants you.",
        v: { sharp: "Come on over. You deserve a team that wants you.", dry: "Come on over. We actually want you here.", loud: "Get over here! You deserve a team that actually wants you!", soft: "Come over here. You deserve a team that actually wants you.", odd: "Get over here! We've got a spare bunk and a team that actually wants you." } },
      { by: 'd', opt: 1, say: "Seriously? You're leaving over one vote?",
        v: { sharp: "Seriously? Over one vote?", dry: "So that's it? Over one vote?", loud: "Are you serious? You're leaving over one vote?", soft: "Really? You're leaving over one vote?", odd: "Wait, you're leaving over one vote? That's it?" } },
      { by: 'a', opt: 'd', say: "You voted me into the Arena, {d}. I could have gone home tonight. So yeah, I'm leaving.",
        v: { sharp: "You voted me into the Arena, {d}. I could've gone home. So yes, I'm leaving.", dry: "You voted me into the Arena, {d}. I could have gone home tonight, so yes, I'm going.", loud: "You voted me into the Arena, {d}! I could have gone home tonight, so yeah, I'm leaving!", soft: "You voted me into the Arena, {d}. I could have gone home tonight. I'm sorry, but I'm leaving.", odd: "You voted me into the Arena, {d}. I could've been packing my bags right now. So yeah, I'm leaving." } },
      { by: 'x', opt: 1, say: "Welcome over. We're glad to have you.",
        v: { sharp: "Welcome over. Glad to have you.", dry: "Welcome over. We're glad to have you, honestly.", loud: "Welcome over! We're so glad to have you!", soft: "Welcome over. We're really glad to have you.", odd: "Welcome over. You can have the bed by the window." } },
      { by: 'c', opt: 1, say: "Fine. Go. We'll see you at the next daily.",
        v: { sharp: "Fine, go. See you at the next daily.", dry: "Fine, go. We'll see you at the next daily.", loud: "Fine, go! We'll see you at the next daily!", soft: "Okay. Go. We'll see you at the next daily.", odd: "Fine, go. We'll see who's laughing at the next daily." } },
      { by: 'a', conf: "Everybody on {from} thought I'd come crawling back after they voted me in. No way. I don't owe them anything now.",
        v: { sharp: "{from} thought I'd come crawling back after they voted me in. No way. I owe them nothing.", dry: "Everyone on {from} thought I'd come crawling back after they voted me in. They thought wrong.", loud: "Everybody on {from} thought I'd come crawling back after they voted me in. No way! I don't owe them anything now!", soft: "Everyone on {from} thought I'd come back after they voted me in. I just couldn't. I don't owe them anything now.", odd: "Everybody on {from} thought I'd come crawling back after they voted me in. I don't crawl, not for people who did that to me." } },
      { by: 'd', opt: 1, conf: "I voted with my team, and now we're down a player and they're up one. I kind of did that to us.",
        v: { sharp: "I voted with my team, and now we're down a player and they're up one. That's on me.", dry: "I voted with the team. Now we're down a player and they're up one. Great job, me.", loud: "I voted with my team, and now we're down a player and they're up one! I did that to us!", soft: "I voted with my team, and now we're down a player and they're up one. I feel like I did that to us.", odd: "I voted with my team, and now we're down a player and they're up one. Not my best plan." } },
    ] },
    { id: 'tms.4', turns: [
      { by: 'tj', say: "Big decision, {a}. Your own team voted you in, and you just sent somebody home. Which team do you want to play for now?" },
      { by: 'a', say: "{to}. I'd rather play with people who didn't vote me in.",
        v: { sharp: "{to}. I'd rather play with people who didn't vote me in.", dry: "{to}. I'll play with the people who didn't vote me in.", loud: "{to}! I'd rather play with people who didn't vote me in!", soft: "{to}, I think. I'd rather be with people who didn't vote me in.", odd: "{to}. Call me crazy, but I like teammates who don't vote me in." } },
      { by: 'c', opt: 1, say: "You're making a mistake. We would've had your back from now on.",
        v: { sharp: "Big mistake. We would've had your back from now on.", dry: "That's a mistake. We would've had your back from now on.", loud: "You're making a huge mistake! We would've had your back from now on!", soft: "I think you're making a mistake. We would've had your back from now on.", odd: "You're making a mistake. We were going to be really nice to you from now on." } },
      { by: 'a', opt: 'c', say: "Well, you had a funny way of showing it tonight.",
        v: { sharp: "Funny way of showing it tonight.", dry: "You had a funny way of showing it tonight.", loud: "Well, you had a funny way of showing it tonight!", soft: "You had a funny way of showing it tonight.", odd: "You had a really funny way of showing it tonight." } },
      { by: 'b', opt: 1, say: "Welcome to {to}. Over here we don't vote our own people in.",
        v: { sharp: "Welcome to {to}. We don't vote our own people in.", dry: "Welcome to {to}. We don't vote our own people in over here.", loud: "Welcome to {to}! Over here we don't vote our own people in!", soft: "Welcome to {to}. Over here we don't vote our own people in.", odd: "Welcome to {to}. House rule: we don't vote our own people in." } },
      { beat: '{a} crosses the sand and sits down with {to}.' },
      { by: 'c', opt: 1, conf: "People are going to say we pushed {a} away. Maybe we did. But now {a} has to beat us, and we know how {a} plays.",
        v: { sharp: "People will say we pushed {a} away. Fine. Now {a} has to beat us, and we know how {a} plays.", dry: "People will say we pushed {a} away. Maybe. Now {a} has to beat us, and we know how {a} plays.", loud: "People are going to say we pushed {a} away, and fine, maybe we did! But now {a} has to beat us, and we know how {a} plays!", soft: "People are going to say we pushed {a} away, and maybe we did. But now {a} has to beat us.", odd: "People will say we pushed {a} away. Maybe we did. Now {a} has to beat us, and we know all of {a}'s moves." } },
      { by: 'a', conf: "I walked into that Arena on one team and walked out on another. I've never felt more in control of my game.",
        v: { sharp: "I walked into that Arena on one team and out on another. I've never felt more in control.", dry: "Walked into the Arena on one team, walked out on another. I've never felt more in control of my game.", loud: "I walked into that Arena on one team and walked out on another! I've never felt more in control of my game!", soft: "I walked into that Arena on one team and walked out on another. I've honestly never felt more in control of my game.", odd: "I walked into that Arena on one team and walked out on another. Nobody saw that coming, including me." } },
    ] },
  ],

  // ── staying with the team that voted you in ──
  'team-stay.statement': [
    { id: 'tsy.s1', turns: [
      { by: 'tj', say: "{a}, {count} of your own team said your name tonight, and you just won. You can go back to {from}, or you can switch to {to}. Your call." },
      { by: 'a', say: "I'm staying with {from}.",
        v: { sharp: "I'm staying with {from}.", dry: "I'll stay with {from}.", loud: "I'm staying with {from}!", soft: "I'm going to stay with {from}.", odd: "I'm staying with {from}. I know, I'm surprised too." } },
      { beat: 'Nobody on {from} knows where to look.' },
      { by: 'd', opt: 1, say: "Even after we voted you in?",
        v: { sharp: "Even after we voted you in?", dry: "Even after we voted you in?", loud: "Even after we voted you in?", soft: "Really? Even after we voted you in?", odd: "Even after we voted you in? Are you sure?" } },
      { by: 'a', opt: 'd', say: "Especially after that. You're going to have to look at me every day now, {d}.",
        v: { sharp: "Especially after that. You get to look at me every day now, {d}.", dry: "Especially after that. Now you get to look at me every day, {d}.", loud: "Especially after that! You're going to have to look at me every single day, {d}!", soft: "Especially after that. You're going to have to look at me every day, {d}.", odd: "Especially after that. I'll be at breakfast every morning, {d}, right across from you." } },
      { by: 'c', opt: 1, say: "Our door was open, {a}. Remember that.",
        v: { sharp: "Our door was open, {a}. Remember that.", dry: "Our door was open, {a}. Just so you know.", loud: "Our door was open, {a}! Remember that!", soft: "Our door was open for you, {a}. Remember that.", odd: "Our door was open, {a}. It still is, if you change your mind." } },
      { by: 'b', opt: 1, say: "Welcome back. I mean that.",
        v: { sharp: "Welcome back. I mean it.", dry: "Welcome back. I actually mean that.", loud: "Welcome back! I really mean that!", soft: "Welcome back. I really mean that.", odd: "Welcome back. I mean that. Mostly." } },
      { by: 'a', conf: "Switching would've been the easy way out. Staying means the people who voted for me have to see me every day, and I like that better.",
        v: { sharp: "Switching was the easy way out. Staying means the people who voted me in see me every day. I like that better.", dry: "Switching would've been easy. Staying means the people who voted for me see me every day. I prefer that.", loud: "Switching would've been the easy way out! Staying means the people who voted for me have to see me every day, and I like that better!", soft: "Switching would've been the easy way out. Staying means the people who voted for me have to see me every day, and I think that's better.", odd: "Switching would've been easy. Staying means the people who voted for me see my face every single day. That's my revenge." } },
      { by: 'x', opt: 1, conf: "That's {count} of us who said {a}'s name, and {a} came back anyway. Either {a} is really loyal, or {a} is planning something.",
        v: { sharp: "That's {count} of us who voted {a} in, and {a} came back anyway. Really loyal, or planning something.", dry: "That's {count} of us who said {a}'s name, and {a} came back. Either really loyal, or planning something.", loud: "That's {count} of us who said {a}'s name, and {a} came back anyway! Either {a} is really loyal, or {a} is planning something!", soft: "That's {count} of us who said {a}'s name, and {a} still came back. Either {a} is really loyal, or {a} has a plan.", odd: "That's {count} of us who voted {a} in, and {a} came back anyway. I'd like to think it's loyalty, but I'm keeping an eye out." } },
    ] },
    { id: 'tsy.s2', turns: [
      { by: 'tj', say: "{a}! Stay with {from}, or switch to {to}? Everybody's waiting, buddy." },
      { by: 'a', say: "I'm not switching. {from} is still my team, even after tonight.",
        v: { sharp: "Not switching. {from} is still my team, even after tonight.", dry: "I'm not switching. {from} is still my team, even after tonight.", loud: "I'm not switching! {from} is still my team, even after tonight!", soft: "I'm not switching. {from} is still my team, even after tonight.", odd: "I'm not switching. {from} is my team, even if they have a weird way of showing it." } },
      { by: 'b', opt: 1, say: "Thank you. I know we didn't deserve that.",
        v: { sharp: "Thank you. We didn't deserve that.", dry: "Thanks. I know we didn't deserve that.", loud: "Thank you! I know we didn't deserve that!", soft: "Thank you. I know we didn't deserve that.", odd: "Thank you. Honestly, we didn't deserve that." } },
      { by: 'a', opt: 'b', say: "No, you didn't. Win the next daily and we'll call it even.",
        v: { sharp: "No, you didn't. Win the next daily and we're even.", dry: "You didn't. Win the next daily and we'll call it even.", loud: "No, you didn't! Win the next daily and we'll call it even!", soft: "No, you didn't. But win the next daily and we'll call it even.", odd: "Nope. Win the next daily and I'll forget the whole thing happened." } },
      { by: 'c', opt: 1, say: "Your loss. We would've been good to you.",
        v: { sharp: "Your loss. We'd have been good to you.", dry: "Your loss. We would've been good to you.", loud: "Your loss! We would've been good to you!", soft: "That's your loss. We would've been good to you.", odd: "Your loss. We would've been good to you, and we have the better snacks." } },
      { by: 'b', opt: 1, conf: "{a} could have walked over to {to} with everything we've ever talked about. {a} didn't, and I won't forget that.",
        v: { sharp: "{a} could have walked over to {to} with everything we've talked about. {a} didn't. I won't forget that.", dry: "{a} could've gone over to {to} with everything we've talked about. {a} didn't. I'll remember that.", loud: "{a} could have walked over to {to} with everything we've ever talked about! {a} didn't, and I won't forget that!", soft: "{a} could have walked over to {to} with everything we've ever talked about. {a} didn't, and I'll always remember that.", odd: "{a} could have walked over to {to} with every plan we've ever made. {a} didn't. I owe {a} one." } },
      { by: 'a', conf: "I'm not leaving my team because they panicked for one night. But they're going to have to earn my trust back.",
        v: { sharp: "I'm not leaving because they panicked for one night. But they have to earn my trust back.", dry: "I won't leave my team over one night of panic. They'll have to earn my trust back, though.", loud: "I'm not leaving my team because they panicked for one night! But they're going to have to earn my trust back!", soft: "I'm not leaving my team because they panicked for one night. But they're going to have to earn my trust back.", odd: "I'm not leaving my team because they panicked one night. Everybody panics. But they're earning my trust back from zero." } },
    ] },
  ],
  'team-stay.quiet': [
    { id: 'tsy.q1', turns: [
      { by: 'tj', say: "{a}, you can go back to {from} or join {to}. What's it going to be?" },
      { by: 'a', say: "{from}. I'm going back.",
        v: { sharp: "{from}. I'm going back.", dry: "{from}. I'm going back.", loud: "{from}! I'm going back!", soft: "{from}. I'm going back to them.", odd: "{from}. I'm going back. I left my towel over there anyway." } },
      { by: 'x', opt: 1, say: "Yes! Get back over here.",
        v: { sharp: "Good. Get back over here.", dry: "Good. Get back over here.", loud: "Yes! Get back over here!", soft: "Yay. Come back over here.", odd: "Yes! Get back over here, we saved your seat." } },
      { by: 'd', opt: 1, say: "So, no hard feelings about the vote?",
        v: { sharp: "No hard feelings about the vote?", dry: "So. No hard feelings about the vote?", loud: "So no hard feelings about the vote, right?", soft: "No hard feelings about the vote, I hope?", odd: "So, no hard feelings about the vote? Maybe a few?" } },
      { by: 'a', opt: 'd', say: "Ask me again after the next one.",
        v: { sharp: "Ask me after the next one.", dry: "Ask me again after the next vote.", loud: "Ask me again after the next one!", soft: "Ask me again after the next one, okay?", odd: "Ask me again after the next one. I'll know by then." } },
      { by: 'c', opt: 1, say: "The offer stands, {a}. Any time.",
        v: { sharp: "Offer stands, {a}. Any time.", dry: "The offer stands, {a}. Any time.", loud: "The offer stands, {a}! Any time!", soft: "The offer still stands, {a}. Any time.", odd: "The offer stands, {a}. Any time, day or night." } },
      { by: 'a', conf: "Not even half of {from} said my name. The rest of them have been good to me, and I'm not walking out on them over a few votes.",
        v: { sharp: "Not even half of {from} said my name. The rest have been good to me. I'm not walking out over a few votes.", dry: "Less than half of {from} said my name. The rest have been good to me. I won't walk out on them over a few votes.", loud: "Not even half of {from} said my name! The rest of them have been good to me, and I'm not walking out on them over a few votes!", soft: "Not even half of {from} said my name. The rest of them have been good to me, and I'm not walking out on them over a few votes.", odd: "Not even half of {from} voted for me. The rest have been good to me, so I'm sticking with them." } },
    ] },
    { id: 'tsy.q2', turns: [
      { by: 'tj', say: "Okay, {a}, decision time. Stay, or switch to {to}?" },
      { by: 'a', say: "I'm staying. That's not even a question.",
        v: { sharp: "Staying. Not even a question.", dry: "Staying. That's not really a question.", loud: "I'm staying! That's not even a question!", soft: "I'm staying. It's not even a question for me.", odd: "Staying. Was that even a question?" } },
      { by: 'b', opt: 1, say: "That's what I like to hear. Welcome back.",
        v: { sharp: "That's what I like to hear. Welcome back.", dry: "Good answer. Welcome back.", loud: "That's what I like to hear! Welcome back!", soft: "That's what I like to hear. Welcome back.", odd: "That's what I like to hear. Welcome back, we missed you for about an hour." } },
      { by: 'c', opt: 1, say: "Can't blame us for asking.",
        v: { sharp: "Can't blame us for asking.", dry: "Worth a shot.", loud: "Hey, you can't blame us for asking!", soft: "You can't blame us for asking.", odd: "Can't blame us for asking. We'll ask again next time." } },
      { by: 'a', conf: "I didn't even think about it. My team made a call, I won, and now we move on together. That's how a team works.",
        v: { sharp: "I didn't even think about it. My team made a call, I won, and we move on. That's a team.", dry: "Didn't even think about it. My team made a call, I won, we move on. That's how it works.", loud: "I didn't even think about it! My team made a call, I won, and now we move on together. That's how a team works!", soft: "I didn't even think about it. My team made a call, I won, and now we move on together. That's how a team works.", odd: "I didn't even think about it. My team made a call, I won, and now we move on. Bruised, but still a team." } },
    ] },
  ],

  // (both teams after a team daily, and the losers' vote talk: team-reactions.js, rewritten 2026-10-18)

  // ── a bloc inside a team ──
  'team-bloc.lost': [
    { id: 'tbl.l1', turns: [
      { by: 'a', say: "Listen. If {team} keeps losing, every vote stays inside this team, so we need to be the ones deciding it.",
        v: { sharp: "If {team} keeps losing, every vote stays inside this team. We need to be the ones deciding it.", dry: "If {team} keeps losing, every vote stays inside the team. We should be the ones deciding it.", loud: "Listen! If {team} keeps losing, every vote stays inside this team, so we need to be the ones deciding it!", soft: "Listen. If {team} keeps losing, every vote stays inside this team, so I think we need to be the ones deciding it.", odd: "Listen. If {team} keeps losing, every vote stays inside this team, so we'd better be the ones making the calls." } },
      { by: 'b', say: "You mean a group inside the team?",
        v: { sharp: "A group inside the team?", dry: "You mean a group inside the team.", loud: "You mean a group inside the team?", soft: "You mean like a group inside the team?", odd: "You mean a little team inside the team?" } },
      { by: 'a', say: "{alliance}. Just us. We never vote for each other, and we decide who the team goes after.",
        v: { sharp: "{alliance}. Just us. We never vote for each other, and we decide who the team goes after.", dry: "{alliance}. Just us. We never vote for each other, and we pick who the team goes after.", loud: "{alliance}, just us! We never vote for each other, and we decide who the team goes after!", soft: "{alliance}. Just us. We never vote for each other, and we decide who the team goes after.", odd: "{alliance}. Just us. We never vote for each other, and we quietly decide who the team goes after." } },
      { by: 'c', say: "I'm in. I'd rather be the one counting the votes than the one getting voted.",
        v: { sharp: "I'm in. Better to count the votes than get voted.", dry: "I'm in. I'd rather count the votes than get voted.", loud: "I'm in! I'd rather be the one counting the votes than the one getting voted!", soft: "I'm in. I'd rather be the one counting the votes than the one getting voted.", odd: "I'm in. I'd much rather be counting the votes than hearing my own name." } },
      { by: 'a', conf: "Right now the other team isn't the danger. The danger is everybody on {team} who isn't in {alliance}.",
        v: { sharp: "Right now the other team isn't the danger. It's everybody on {team} who isn't in {alliance}.", dry: "The other team isn't the danger right now. Everybody on {team} who isn't in {alliance} is.", loud: "Right now the other team isn't the danger! The danger is everybody on {team} who isn't in {alliance}!", soft: "Right now the other team isn't really the danger. The danger is everyone on {team} who isn't in {alliance}.", odd: "Right now the other team isn't the danger. The danger is sleeping in the beds next to us, on {team}, outside {alliance}." } },
    ] },
  ],
  'team-bloc.won': [
    { id: 'tbl.w1', turns: [
      { by: 'a', say: "We're winning right now, but it won't last forever. When we lose, I want to already know where my votes are.",
        v: { sharp: "We're winning now, but it won't last. When we lose, I want to know where my votes are.", dry: "We're winning right now. It won't last. When we lose, I want to already know where my votes are.", loud: "We're winning right now, but it won't last forever! When we lose, I want to already know where my votes are!", soft: "We're winning right now, but it won't last forever. When we lose, I want to already know where my votes are.", odd: "We're winning right now, but nobody wins forever. When we lose, I want to already know where my votes are." } },
      { by: 'b', say: "So, us.",
        v: { sharp: "So, us.", dry: "So, us.", loud: "So, us!", soft: "So, us?", odd: "So, us. Obviously." } },
      { by: 'a', say: "{alliance}. We stick together on {team}, and when that day comes, we vote together.",
        v: { sharp: "{alliance}. We stick together on {team}, and when that day comes, we vote together.", dry: "{alliance}. We stick together on {team}, and when it happens, we vote together.", loud: "{alliance}! We stick together on {team}, and when that day comes, we vote together!", soft: "{alliance}. We stick together on {team}, and when that day comes, we vote together.", odd: "{alliance}. We stick together on {team}, and when that day comes, we vote as one." } },
      { by: 'c', say: "Planning for a loss we haven't even had yet. I like it.",
        v: { sharp: "Planning for a loss we haven't had yet. I like it.", dry: "Planning for a loss we haven't had yet. I like it.", loud: "Planning for a loss we haven't even had yet? I like it!", soft: "Planning for a loss we haven't even had yet. I like that.", odd: "Planning for a loss we haven't even had yet. That's smart, and a little scary." } },
      { by: 'a', conf: "Every winning team thinks it's safe. Then they lose one daily and realize nobody ever talked about the vote. That won't be us.",
        v: { sharp: "Every winning team thinks it's safe. Then they lose one daily and nobody's talked about the vote. Not us.", dry: "Winning teams think they're safe. Then they lose one daily and realize nobody talked about the vote. Not us.", loud: "Every winning team thinks it's safe! Then they lose one daily and realize nobody ever talked about the vote. That won't be us!", soft: "Every winning team thinks it's safe. Then they lose one daily and realize nobody ever talked about the vote. That won't be us.", odd: "Every winning team thinks it's safe. Then they lose one daily and everyone's scrambling. We'll already have a plan." } },
    ] },
  ],
};
