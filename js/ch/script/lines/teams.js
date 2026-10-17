// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/teams.js — a Teams season: the team as the unit of loyalty
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-17-ch-teams-season-design.md. Teams by original show, champions against
// underdogs, vets against rookies, or a captains' draft; the losing team votes one of its own into the Arena, out loud;
// the winners name the opponent; an Arena winner their own team sent in can switch sides. Parts as roles.js gives
// them; {team} is the team the scene is about, {oppteam} the other side, {from}/{to} a move between teams.
//
// The house rules (§19): plain spoken English, the reason said, a confessional that says the feeling and why; never a
// past the teams do not have (two people on a team are not friends because of it); the vote is said out loud.

export default {
  // ── TJ names the teams ───────────────────────────────────────────────
  'teams-revealed.shows': [
    { id: 'tmr.s1', turns: [
      { by: 'tj', say: "Welcome to the Blue Lagoon, people! This season you don't play alone. You play for the show you came from." },
      { by: 'tj', say: "Look around. The people you came up with are your team now. {team}, over there. {oppteam}, over here." },
      { beat: 'The cast splits across the airstrip, old castmates finding each other.' },
      { by: 'tj', say: "Your team wins, your team is safe. Your team loses, your team votes one of its own into the Arena. Out loud. Have fun with that." },
      { by: 'a', say: "So we vote for our own people?" },
      { by: 'tj', say: "Every single week you lose, buddy." },
      { by: 'b', conf: "I came here with my old castmates, and TJ just told us we're going to have to turn on each other. Great." },
    ] },
    { id: 'tmr.s2', turns: [
      { by: 'tj', say: "Okay! Show pride, people! This season it's {team} against {oppteam}, and everybody plays for their show." },
      { by: 'a', say: "Finally. Some loyalty in this game." },
      { by: 'tj', say: "Loyalty? Oh, that's cute. The losing team votes one of its own in every week." },
      { by: 'b', conf: "Show against show sounds great until you remember who you have to vote for when you lose." },
    ] },
  ],
  'teams-revealed.champions': [
    { id: 'tmr.c1', turns: [
      { by: 'tj', say: "Welcome to the Blue Lagoon! Some of you have won before. Some of you never have. This season, that's the line." },
      { by: 'tj', say: "Champions, over here. Everybody else, you're the Underdogs, and you've got something to prove." },
      { by: 'b', say: "We've got everything to prove." },
      { by: 'a', say: "And we've got nothing to lose. Except the money." },
      { by: 'tj', say: "Lose a daily, and you vote one of your own into the Arena. Out loud. Champions included." },
      { by: 'b', conf: "Every one of them has a title. None of us do. That's the most motivated team you'll ever see." },
    ] },
  ],
  'teams-revealed.vets': [
    { id: 'tmr.v1', turns: [
      { by: 'tj', say: "Vets! Rookies! This season it's the people who know this game against the people who don't. Yet." },
      { by: 'a', say: "This is going to be easy." },
      { by: 'b', say: "That's what people say right before they lose." },
      { by: 'tj', say: "Lose a daily, and your team votes one of its own into the Arena. Out loud. In front of everybody." },
      { by: 'b', conf: "The vets think we're fresh meat. Fine. Fresh meat doesn't get tired." },
    ] },
  ],
  'teams-revealed.draft': [
    { id: 'tmr.d1', turns: [
      { by: 'tj', say: "This season you're on teams, and you don't pick them. Your captains do. {a}, {b}, step up." },
      { by: 'a', say: "Me? Okay. I've got a list." },
      { by: 'b', say: "Mine's shorter. Mine's better." },
      { by: 'tj', say: "Pick wisely, captains. Whoever you take, you might have to vote for." },
      { by: 'a', conf: "Every name I say out loud tells the house who I trust. Every name I don't, they'll remember." },
    ] },
  ],

  // ── a team finding out who it is ─────────────────────────────────────
  'team-reveal.shows': [
    { id: 'tmv.s1', turns: [
      { by: 'a', say: "Okay, {team}, bring it in." },
      { by: 'b', say: "Look at us. Back together." },
      { by: 'c', opt: 1, say: "Some of us were never together. Some of us couldn't stand each other." },
      { by: 'a', opt: 'c', say: "That was then. Right now we're one team." },
      { by: 'a', conf: "We came up together, so we know each other's tricks. That's a good team. It's also a team that knows exactly where to stab." },
    ] },
    { id: 'tmv.s2', turns: [
      { by: 'b', say: "{team}! Let's go!" },
      { by: 'a', say: "Save it for the daily." },
      { by: 'b', say: "I'm saving nothing. We're the best show here and everybody knows it." },
      { by: 'b', conf: "Being on a team with your old cast is like a reunion, if the reunion could send you home." },
    ] },
  ],
  'team-reveal.champions': [
    { id: 'tmv.c1', turns: [
      { by: 'a', say: "Alright, {team}. Everybody here knows how to win. Let's not forget how." },
      { by: 'b', say: "Nobody here is forgetting anything." },
      { by: 'a', conf: "A team of people who are used to being the best. That's strong. It's also a lot of egos in one room." },
    ] },
    { id: 'tmv.c2', turns: [
      { by: 'a', say: "{team}, listen. They think we're the easy side." },
      { by: 'b', say: "Then let's make them pay for it." },
      { by: 'c', opt: 1, say: "Every week." },
      { by: 'a', conf: "Nobody gave us a title. We're going to have to take one." },
    ] },
  ],
  'team-reveal.vets': [
    { id: 'tmv.v1', turns: [
      { by: 'a', say: "{team}, let's go. We know this game better than anybody here." },
      { by: 'b', say: "And they know nothing about it." },
      { by: 'a', conf: "Experience wins dailies. Hunger wins Arenas. We're going to need both." },
    ] },
    { id: 'tmv.v2', turns: [
      { by: 'a', say: "{team}. Nobody expects anything from us, so let's give them a shock." },
      { by: 'b', say: "First daily. Let's take it." },
      { by: 'a', conf: "The other side has been here before. We haven't. That means we're not tired of it yet." },
    ] },
  ],
  'team-reveal.draft': [
    { id: 'tmv.d1', turns: [
      { by: 'a', say: "{team}. I picked every one of you for a reason. Don't make me sorry." },
      { by: 'b', say: "What was my reason?" },
      { by: 'a', say: "You looked like you wouldn't quit." },
      { by: 'a', conf: "A captain's picks are a promise. If my team loses, everybody's going to look at who I picked." },
    ] },
  ],

  // ── the losing team before it votes ──────────────────────────────────
  'team-huddle.rally': [
    { id: 'tmh.r1', turns: [
      { by: 'a', say: "Okay, {team}. We lost. It happens. What doesn't happen is us tearing each other apart over it." },
      { by: 'b', say: "We still have to put somebody in." },
      { by: 'a', say: "I know. And whoever it is, the rest of us have their back in there. Deal?" },
      { by: 'c', opt: 1, say: "Deal." },
      { by: 'a', conf: "A team that loses and stays together is still a team. A team that loses and starts pointing fingers is a pile of people waiting to go home." },
    ] },
    { id: 'tmh.r2', turns: [
      { by: 'a', say: "Everybody sit down. We need to talk before tonight." },
      { by: 'b', say: "Is this the speech?" },
      { by: 'a', say: "It's the speech. We vote, we say it to each other's faces, and tomorrow we're still a team." },
      { by: 'b', conf: "{a} means it. I just don't think everybody on this team does." },
    ] },
  ],
  'team-huddle.hard': [
    { id: 'tmh.h1', turns: [
      { by: 'a', say: "Let's not make this complicated. We all know who's been dragging this team down." },
      { by: 'b', say: "Wow. Okay. Straight in." },
      { by: 'a', say: "I'm not going to pretend. Pretending is how we keep losing." },
      { by: 'c', opt: 1, conf: "{a} didn't say a name. Nobody needed one. Everybody knew who it was." },
      { by: 'a', conf: "Being captain means saying the thing everybody's thinking. Tonight that thing is a name." },
    ] },
  ],
  'team-only-one.any': [
    { id: 'tmo.1', turns: [
      { by: 'tj', say: "{team}, here's the problem. You've only got one person left who can go in this week. {a}, I'm sorry, buddy. No vote needed." },
      { by: 'a', say: "Yeah. I figured." },
      { by: 'a', conf: "No vote. No speech. My team just ran out of people, and I'm the one left standing in front." },
    ] },
  ],
  // ── after the team vote: the one going in, and their teammates ──────
  'team-after-vote.stung': [
    { id: 'tma.s1', turns: [
      { beat: '{a} finds {b} on the steps, and {c} walks out right behind.' },
      { by: 'a', say: "You didn't say my name. Thank you." },
      { by: 'b', say: "I wasn't going to." },
      { by: 'a', say: "{c} was." },
      { by: 'c', say: "It was a team vote. I voted for the team." },
      { by: 'a', say: "You voted for me. Say it how it was." },
      { by: 'c', say: "Fine. I voted for you." },
      { by: 'a', conf: "Getting voted in by the house is one thing. Getting voted in by your own team is like getting voted in by family." },
      { by: 'c', conf: "Somebody had to go. I'm not going to apologize for picking the person I picked." },
    ] },
    { id: 'tma.s2', turns: [
      { by: 'a', say: "My own team." },
      { by: 'b', say: "Not all of us." },
      { by: 'a', say: "Enough of you." },
      { by: 'c', say: "It wasn't personal." },
      { by: 'a', say: "It's always personal when it's your own team, {c}." },
      { by: 'b', conf: "{a} is going to come back from that Arena. And when that happens, {c} is going to wish {c.sub} had voted differently." },
    ] },
  ],
  'team-after-vote.any': [
    { id: 'tma.a1', turns: [
      { by: 'b', say: "I didn't vote for you." },
      { by: 'a', say: "I know. I heard." },
      { by: 'b', say: "For what it's worth, I think the team made a mistake." },
      { by: 'a', say: "It's worth a lot, actually." },
      { by: 'a', conf: "{b} was one of the only people on {team} who didn't say my name. I'm going to remember that, whatever team I end up on." },
    ] },
    { id: 'tma.a2', turns: [
      { by: 'b', say: "You going to be okay?" },
      { by: 'a', say: "I'm going to win. Then I'm going to think about who I'm playing for." },
      { by: 'b', say: "What does that mean?" },
      { by: 'a', say: "It means a team that votes you in doesn't get to own you." },
      { by: 'b', conf: "{a} just said out loud what everybody on this team is scared of." },
    ] },
  ],

  // ── a call-out in a Teams season (appended to the call-out pools: when teams stand) ──
  'callout.grudge+': [
    { id: 'cot.g1', when: { teams: true, sameTeam: true, votedMe: true }, turns: [
      { by: 'tj', say: "{a}, your own team put you here. Who's coming with you?" },
      { by: 'a', say: "{b}. You stood up and said my name, so you can stand next to me in there." },
      { by: 'b', say: "It was a team vote." },
      { by: 'a', say: "And this is a team call-out." },
      { by: 'a', conf: "My own team voted me in, and {b} was the loudest about it. If I'm going in, {b} is coming too." },
      { by: 'b', conf: "I voted with the team, and now I'm the one paying for it. Teams are great until they're not." },
    ] },
    { id: 'cot.g2', when: { teams: true, sameTeam: true }, turns: [
      { by: 'a', say: "I'm calling out {b}." },
      { beat: 'The whole team turns to look at them.' },
      { by: 'b', say: "We're on the same team." },
      { by: 'a', say: "We were. Tonight you voted like we weren't." },
      { by: 'a', conf: "Everybody expected me to pick somebody from the other side. My problem was never the other side." },
    ] },
  ],
  'callout.survive+': [
    { id: 'cot.s1', when: { teams: true, own: true }, turns: [
      { by: 'tj', say: "{a}, here's the twist. There's nobody left outside the winning team for you to pick. So you're picking one of them." },
      { by: 'a', say: "{b}." },
      { by: 'b', say: "We won today. We WON." },
      { by: 'a', say: "And I still need somebody to fight. Sorry." },
      { by: 'b', conf: "My team won the daily and I'm still going into the Arena. Nobody told me that could happen." },
    ] },
    { id: 'cot.s2', when: { teams: true, sameTeam: false }, turns: [
      { by: 'tj', say: "{a}, your team sent you here. Who's coming with you?" },
      { by: 'a', say: "{b}. If my team is losing somebody, so is yours." },
      { by: 'b', say: "That's fair, actually." },
      { by: 'a', conf: "My own team voted me in, so I'm not doing them any favors. But I'm not doing the other team any either." },
    ] },
  ],

  // ── switching sides ──────────────────────────────────────────────────
  'team-switch.any': [
    { id: 'tms.1', turns: [
      { by: 'tj', say: "{a}, you won, and you get a choice. Go back to {from}, the team that voted you in, or switch to {to}." },
      { by: 'a', say: "I'm switching." },
      { beat: 'Nobody on {from} says a word.' },
      { by: 'b', opt: 1, say: "Welcome to {to}." },
      { by: 'c', opt: 1, say: "Unbelievable." },
      { by: 'a', opt: 'c', say: "You voted me in. You don't get to be surprised." },
      { by: 'a', conf: "My old team sent me here. My new team didn't. That's the whole decision." },
    ] },
    { id: 'tms.2', turns: [
      { by: 'a', say: "TJ, I want to switch." },
      { by: 'tj', say: "Whoa! Say that again, louder, for the cameras!" },
      { by: 'a', say: "I'm going to {to}." },
      { by: 'c', opt: 1, say: "After everything?" },
      { by: 'a', opt: 'c', say: "After everything you did tonight, yes." },
      { by: 'c', opt: 1, conf: "We voted {a} in, {a.sub} won, and now {a.sub} is playing against us. We did this to ourselves." },
    ] },
  ],
  'team-fold.any': [
    { id: 'tmf.1', turns: [
      { by: 'tj', say: "{a}, {from} is down to just you. A team of one isn't a team, so you're joining {to}." },
      { by: 'a', say: "So I'm the last of {from}." },
      { by: 'b', say: "Welcome. Don't take it personally if we look at you funny." },
      { by: 'a', conf: "My whole team is gone, and now I'm the new kid on a team that's been voting together all season." },
    ] },
  ],
  'teams-break.any': [
    { id: 'tmb.a1', turns: [
      { by: 'tj', say: "Everybody! Gather round! I've got news. The teams are over. Done. Finished." },
      { beat: 'Nobody says anything for a second.' },
      { by: 'tj', say: "From now on it's every player for themselves. No team to protect you, no team to vote you in. Just you." },
      { by: 'a', say: "So all the people I was voting with are just... people now?" },
      { by: 'tj', say: "You got it, buddy." },
      { by: 'b', conf: "I spent the whole season trusting my team. Now every single one of them is a reason I might not win." },
    ] },
    { id: 'tmb.a2', turns: [
      { by: 'tj', say: "Okay, people. The teams got you this far. They're not getting you any further. As of right now, it's every player for themselves." },
      { by: 'a', say: "Finally." },
      { by: 'b', say: "Speak for yourself." },
      { by: 'a', conf: "I've been waiting for this all season. Some of my teammates were the people I wanted gone the most." },
    ] },
  ],
  'teams-break.one': [
    { id: 'tmb.o1', turns: [
      { by: 'tj', say: "People, there's only one team left standing, and one team isn't a competition. So the teams are over. Every player for themselves." },
      { by: 'a', say: "We won the war, and now we have to fight each other." },
      { by: 'a', conf: "We spent weeks wiping out the other team. Now there's nobody left to beat but the people standing next to me." },
    ] },
  ],

  // ── the team, between the dailies ────────────────────────────────────
  'team-last-stand.any': [
    { id: 'tml.1', turns: [
      { by: 'a', say: "Look around. This is it. This is all that's left of {team}." },
      { by: 'b', say: "Then we win the next one. That's all we can do." },
      { by: 'c', opt: 1, say: "And if we don't?" },
      { by: 'a', opt: 'c', say: "Then whoever goes in, goes in for all of us." },
      { by: 'b', conf: "Everybody in that house knows we're the next to go. Nothing makes a team closer than knowing it's about to disappear." },
    ] },
    { id: 'tml.2', turns: [
      { by: 'b', say: "There used to be a lot more of us." },
      { by: 'a', say: "There's enough of us." },
      { by: 'b', say: "Enough for what?" },
      { by: 'a', say: "Enough to make them nervous." },
      { by: 'a', conf: "{team} is small now. Small and angry is still dangerous." },
    ] },
  ],
  'team-poach.quiet': [
    { id: 'tmq.q1', turns: [
      { by: 'a', say: "Can I say something without you running back to {from} with it?" },
      { by: 'b', say: "Depends what it is." },
      { by: 'a', say: "If you ever get the chance, come over to {to}. We'd take care of you. Your team won't." },
      { by: 'b', say: "That's a lot to say to somebody on the other side." },
      { by: 'a', say: "I'm saying it to a friend." },
      { by: 'b', conf: "I didn't say yes. I didn't say no either. I just keep thinking about it." },
    ] },
  ],
  'team-poach.seen': [
    { id: 'tmq.s1', turns: [
      { by: 'a', say: "You'd fit in better with us. You know that, right?" },
      { by: 'b', say: "Keep your voice down." },
      { by: 'a', say: "Why? Is your team listening?" },
      { beat: '{c} is standing in the doorway.' },
      { by: 'c', say: "Yeah. Your team's listening." },
      { by: 'c', conf: "{b} is talking to the other side about switching. I'm not going to forget that at the next vote." },
    ] },
  ],
  'team-rift.owns': [
    { id: 'tmt.o1', turns: [
      { by: 'a', say: "Are you playing for {team}, or are you playing for {alt}?" },
      { by: 'b', say: "Both. Is that a problem?" },
      { by: 'a', say: "It's a problem when {alt} is on the other team." },
      { by: 'b', say: "{alt} is my friend. The team is the team. I can have both." },
      { by: 'a', say: "Not when it comes to a vote, you can't." },
      { by: 'a', conf: "{b} just told me to my face that the team comes second. I'm going to remember that when we lose." },
    ] },
  ],
  'team-rift.denies': [
    { id: 'tmt.d1', turns: [
      { by: 'a', say: "Everybody's seen you with {alt}. Every night." },
      { by: 'b', say: "So? We talk." },
      { by: 'a', say: "About what? About our votes?" },
      { by: 'b', say: "About nothing. You're paranoid." },
      { by: 'a', conf: "{b} says it's nothing. Nobody sits up every night with somebody from the other team to talk about nothing." },
    ] },
  ],

  // ── the vote, the daily and the final, in a Teams season ─────────────
  'cer-open.team': [
    { id: 'tmc.1', when: { own: false }, turns: [{ by: 'tj', say: "{team}, you lost today. So one of you is going into the Arena, and you're the ones who decide. Out loud. To each other's faces." }] },
    { id: 'tmc.2', when: { own: false }, turns: [{ by: 'tj', say: "Alright, {team}. This is the worst part of losing. Look at your teammates, and pick one. Out loud." }] },
    { id: 'tmc.3', when: { own: false }, turns: [{ by: 'tj', say: "{team}, it's your vote. Everybody else, sit back and enjoy the show. This is going to hurt." }] },
    { id: 'tmc.4', when: { own: true }, turns: [{ by: 'tj', say: "{team}, you won, and there's nobody else left to go in. So you vote one of your own. Out loud. Sorry, guys." }] },
  ],
  // the result of a team vote: the team has spoken, not the house (ceremony.js; the solo pools say "the house")
  'cer-result~teams.clear': [
    { id: 'tmr~.c1', turns: [
      { by: 'tj', say: "Your own team has spoken, with {count} votes. {a}, you're going into the Arena." },
      { by: 'a', say: "Yeah. I figured." },
      { by: 'a', conf: "Those were the people I've been eating with, training with, sleeping next to. And they all said my name." },
    ] },
    { id: 'tmr~.c2', turns: [
      { by: 'tj', say: "And that's {count} for {a}. Your team wants you in there, buddy. Tomorrow night you pick who goes in with you." },
      { by: 'a', conf: "I'm not going to cry about it. I'm going to win, and then I'm going to remember every one of those votes." },
    ] },
    { id: 'tmr~.c3', turns: [
      { by: 'tj', say: "{count} votes, all from your own side. {a}, you're going in." },
      { beat: 'Nobody on the team looks at {a}.' },
      { by: 'a', conf: "The other team didn't put me in the Arena. My team did. That's the part that hurts." },
    ] },
  ],
  'cer-result~teams.tie': [
    { id: 'tmr~.t1', turns: [
      { by: 'tj', say: "It's a TIE! Your team couldn't decide, so the winners break it. Winners? ... They've decided. {a}, it's you." },
      { by: 'a', conf: "Half my team wanted me in and half didn't. I'm going to find out which half was which." },
    ] },
  ],
  'daily~teams.teams': [
    { id: 'dyt.1', turns: [
      { by: 'tj', say: "{team} wins {game}! You're all safe! {oppteam}, I'm sorry, guys. You know what happens now." },
      { by: 'a', say: "Let's GO, {team}!" },
      { by: 'c', conf: "We lost, so tonight we turn on each other. That's the deal with teams, and nobody likes it." },
    ] },
    { id: 'dyt.2', turns: [
      { by: 'tj', say: "And that's {game}! {team}, take a bow! Everybody else, start doing math." },
      { by: 'b', say: "That's what a real team looks like!" },
      { by: 'c', conf: "Every week we lose, there's one less of us. You can feel the team getting smaller." },
    ] },
    { id: 'dyt.3', turns: [
      { by: 'tj', say: "{team} takes it! That's a team win, people! {oppteam}, you're voting tonight." },
      { by: 'a', say: "Safe! All of us!" },
      { by: 'c', conf: "Losing with my team means looking at the people I trust and picking one of them. I hate this part." },
    ] },
  ],
  'champions.team': [
    { id: 'cht.1', turns: [
      { beat: 'TJ stands at the finish arch with the totals in his hand. Nobody breathes.' },
      { by: 'tj', say: "Two days. Five checkpoints. And the team that takes the Blue Lagoon is... {team}!" },
      { by: 'a', say: "We did it! WE DID IT!" },
      { by: 'b', say: "Get in here, all of you!" },
      { by: 'tj', say: "You're the champions, every single one of you! And you split the money, equally!" },
      { by: 'a', conf: "We lost people. We switched sides. We fought each other at every vote. And we still won it as a team." },
    ] },
  ],
  'champion-reflect.team': [
    { id: 'crt.1', turns: [
      { by: 'a', conf: "Everybody says teams don't last on this show. Ours didn't always. But the ones who were left won it together." },
      { by: 'b', conf: "We voted each other into the Arena. We came back. We won. I'd do it all again with {team}." },
    ] },
  ],
};
