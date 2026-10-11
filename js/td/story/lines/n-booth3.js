// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-booth3.js — the booth, from the truth of the ballot
// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js truthOf: what the engine actually decided (its reason, with the names and the
// details in it), who the voter is to the name they write, and what the alliances wanted tonight.
// The user, 2026-10-10: "the vote reasoning is too vague and not voice flavoured, and doesn't
// represent the relationship, the episode, the alliance or the strategy".
//
// a = the voter, {target} = the name they write. booth3.<case>, by what the engine decided:
//   strike   {warner} told a that {target} was organizing against a; a hits first
//   coming   a felt the vote coming their way and decided {target} was behind it
//   between  a is in {group} and {other}; they wanted different names, a went with {group}
//   break    a's {other} wanted {wanted}; a won't write it and writes {target}
//   shield   a is protecting {keep}; {target} takes the vote instead
//   weak     {target} keeps costing the team (area: {area} is where; sankT: today's loss)
//   threat   tkind: jury / social / game / strong / overdue
//   grudge   real dislike, built up      gut   a doesn't trust {target}, can't say why
//   plan     the group's name ({group} when named, {leader} when a ran with somebody's plan)
//   any      the relationship lines when the case has nothing for it, and pact breaks
// rel (a to {target}): pact (a broke a final-three promise to {target}), ally (same alliance:
// {mine}), close (bond 3+), enemy (bond -3 or worse), cold (below 0), plain. Every entry asks for
// one, so a friend's vote never sounds like a stranger's. Ids: 'nb3.'.

const B = (id, conf, when, v) => ({ id, when, turns: [{ by: 'a', conf, ...(v ? { v } : {}) }] });
const FR = ['close', 'ally'], PL = ['plain', 'cold'];

export default {
  // ── warned, and hitting first ──
  'booth3.strike': [
    B('nb3.k1', "{warner} came to me this afternoon and told me {target} was putting my name around. I'm not waiting to find out if it's true, so it's {target}.", { rel: PL, warner: true },
      { anxious: "{warner} told me {target} was going after me, and I haven't been able to breathe since, so I'm writing {target} before {target} writes me.", tough: "{warner} told me {target} was coming for me. Bad idea, {target}." }),
    B('nb3.k2', "If {warner} is right about you, {target}, this saves me. If {warner} is wrong, I'll feel bad tomorrow, but I'll still be here.", { rel: PL, warner: true },
      { dry: "{warner} says you're after me, {target}. I'd rather apologize to you than say goodbye to everyone else." }),
    B('nb3.k3', "{warner} told me you've been going after me, {target}, and I've wanted you gone since the first week, so honestly, thank you for making it easy.", { rel: ['enemy'], warner: true },
      { cruel: "You went after me, {target}, and {warner} told me all about it. Enjoy the trip home." }),
    B('nb3.k4', "You're supposed to be my friend, {target}, and {warner} says you've been working on my vote all day. I didn't want to believe it, but I'm not risking it.", { rel: FR, warner: true },
      { emotional: "{warner} told me what you've been saying, {target}, and I had to walk it off for ten minutes, and now I'm writing your name.", warm: "I wanted {warner} to be wrong about you, {target}. I just can't bet my game on it." }),
  ],
  'booth3.coming': [
    B('nb3.c1', "My name has been floating around all day, and every time I looked up, {target} was the one talking. So it's {target}.", { rel: PL },
      { schemer: "Everybody was too careful around me today, and the most careful one was {target}, so it's {target}.", anxious: "Everybody went quiet when I walked up today, and {target} went quietest, so it's {target}." }),
    B('nb3.c2', "I'm not going to sit here and wait for my own name to get read out. {target} is the one pushing it, so {target} goes first.", { rel: PL },
      { tough: "If somebody's coming for me, I'm going for them first, and that's {target}.", calm: "I could be wrong, and I'd rather be wrong this way than the other way, so it's {target}." }),
    B('nb3.c3', "You've hated me since day one, {target}, and I could feel tonight being your night, so I made it mine.", { rel: ['enemy'] },
      { blunt: "You were always going to vote me out, {target}, so I'm just doing it first." }),
    B('nb3.c4', "I think my name is on your paper tonight, {target}, and that hurts more than I'm going to let anyone see, so it's yours on mine.", { rel: FR },
      { emotional: "I really hope I'm wrong about you, {target}, because if I'm right, you were never really my friend." }),
  ],

  // ── two alliances, one vote ──
  'booth3.between': [
    B('nb3.b1', "{other} wanted a different name tonight, and {group} wanted {target}. I can only be loyal to one of them, so it's {target}.", { rel: PL, group: true, other: true },
      { schemer: "{other} and {group} both think I'm theirs. Tonight {group} gets my vote and {other} gets a story, so it's {target}.", anxious: "{other} is going to be so mad at me tomorrow, but {group} said {target}, and {group} has the numbers." }),
    B('nb3.b2', "I've been in {other} and {group} at the same time, and tonight that stopped working, so I picked {group}, and {group} picked {target}.", { rel: PL, group: true, other: true },
      { dry: "Being in two alliances is fine right up until they disagree, and tonight they disagreed, so it's {target}.", goofy: "Two alliances, one pencil. The pencil goes with {group}, so it's {target}." }),
    B('nb3.b3', "If I go with {other} tonight, {group} finds out by tomorrow, and I'd rather lose {other}, so it's {target}.", { rel: ['plain', 'cold', 'enemy'], group: true, other: true },
      { competitive: "{group} gets me further than {other} does, so I'm going with {group}. {target}." }),
    B('nb3.b4', "{group} wants you gone, {target}, and we're friends, and I'm still going with {group}, because {other} can't protect either of us.", { rel: FR, group: true, other: true },
      { warm: "I'm so sorry, {target}. {group} has the numbers tonight, and if I stand with you, we both go." }),
  ],
  'booth3.break': [
    B('nb3.x1', "{other} wants {wanted} gone tonight, and I'm not writing {wanted}. {target} is my name, and if they're angry, they're angry.", { rel: PL, other: true, wanted: true },
      { blunt: "{other} said {wanted}. I said no, so it's {target}.", anxious: "{other} told me {wanted}, and I just couldn't do it, so I'm writing {target} and hoping nobody counts." }),
    B('nb3.x2', "Everybody thinks {other} is voting as one tonight, so this is me going off on my own. {target}.", { rel: PL, other: true },
      { chaotic: "{other} had a whole plan, and I'm not in the mood for a plan, so it's {target}.", schemer: "Let {other} split the vote. I'd rather be the one nobody saw coming, so it's {target}." }),
    B('nb3.x3', "{other} wanted {wanted}, but I've been waiting all game to write you, {target}, and I'm not wasting the chance.", { rel: ['enemy'], other: true, wanted: true },
      { cruel: "{other} can vote for whoever they want. I'm voting for the one I can't stand, so it's {target}." }),
    B('nb3.x4', "{other} wanted {wanted}, and I couldn't do it, so this goes to you, {target}, and I hate that it does because I like you.", { rel: FR, other: true, wanted: true }),
  ],

  // ── protecting somebody ──
  'booth3.shield': [
    B('nb3.s1', "Half this camp wanted {keep} tonight, and I won't let that happen, so the vote goes somewhere else, and that's {target}.", { rel: PL, keep: true },
      { warm: "I'm not losing {keep}. Not tonight, and not like this, so it's {target}.", tough: "Anybody who comes for {keep} comes through me, so it's {target}." }),
    B('nb3.s2', "I don't have anything against you, {target}. I just need the votes off {keep}, and you're where they go.", { rel: PL, keep: true },
      { dry: "Nothing personal, {target}. {keep} is just more personal, so it's {target}." }),
    B('nb3.s3', "Keeping {keep} safe and getting rid of you, {target}, in one vote. Best night I've had out here.", { rel: ['enemy'], keep: true },
      { cruel: "I get to save {keep} and send you home, {target}. That's my two favourite things." }),
    B('nb3.s4', "It's you or {keep} tonight, {target}, and you're my friend, but {keep} is more than that, so I'm sorry.", { rel: FR, keep: true },
      { emotional: "I've been dreading this all day, {target}. It's you or {keep}, and I can't lose {keep}." }),
  ],

  // ── costing the team ──
  'booth3.weak': [
    B('nb3.w1', "We lost again today, and {target} was the reason, and I can't keep pretending otherwise, so it's {target}.", { rel: PL, sankT: true },
      { competitive: "I watched us lose today because of {target}, and I'm not watching that again, so it's {target}.", warm: "{target} tried today, I know. Trying just isn't winning, so it's {target}." }),
    B('nb3.w2', "Every time a challenge needs {area}, we lose, and every time, it's {target} we're waiting for, so it's {target}.", { rel: PL, area: true },
      { dry: "Whenever the challenge involves {area}, I already know how it ends, so it's {target}.", bossy: "I've been keeping track. {area}, {target}, and a loss, every time, so it's {target}." }),
    B('nb3.w3', "If we want to win the next one, we need to be stronger, and {target} makes us weaker, so it's {target}.", { rel: PL, merged: false },
      { blunt: "We're losing, and {target} is the weakest one we have, so it's {target}.", goofy: "I like {target}. I just like winning more, and {target} and winning don't seem to know each other, so it's {target}." }),
    B('nb3.w4', "You cost us today, {target}, and you've been nothing but a pain since we got here, so this one's easy.", { rel: ['enemy'] },
      { cruel: "You lost us the challenge, {target}, and you're annoying, so this is the easiest vote I'll ever write." }),
    B('nb3.w5', "You're my friend, {target}, but we keep losing, and I can't keep picking you over the whole team, so it's you.", { rel: FR },
      { emotional: "I love you, {target}, I really do, but we can't lose another challenge, and I'm so sorry.", earnest: "I'd rather tell you to your face that it's because of the challenges than have you think it was anything else, {target}." }),
  ],

  // ── too dangerous to keep ──
  'booth3.threat': [
    B('nb3.t1', "If {target} gets to the end, the jury hands {target} the money, and everybody in that room knows it, so it's {target}.", { rel: PL, tkind: 'jury' },
      { schemer: "I'm not sitting next to {target} at the end, because I lose that, so it's {target}.", dry: "I've done the jury math, and the answer keeps coming out {target}, so it's {target}." }),
    B('nb3.t2', "Everybody likes {target}, and that's exactly the problem, because a person everybody likes doesn't lose a vote, so it's {target}.", { rel: PL, tkind: 'social' },
      { cruel: "{target} has been charming everybody since day one, and I'm not falling for it, so it's {target}." }),
    B('nb3.t3', "{target} has been behind every vote out here, and nobody else wants to say it, so I'm saying it with this. {target}.", { rel: PL, tkind: 'game' },
      { nerdy: "If you map out every vote so far, the line runs straight back to {target}, so it's {target}.", blunt: "{target} is running this game, and I'm done letting {target} run it, so it's {target}." }),
    B('nb3.t4', "{target} wins challenges, and someone who wins challenges can't be voted out, so it's now or never. {target}.", { rel: PL, tkind: 'strong', merged: true },
      { competitive: "I want to beat {target}, and the only way I beat {target} is right here, so it's {target}." }),
    B('nb3.t5', "{target}'s name keeps coming up, and sooner or later the name that keeps coming up is the one that goes, so it's {target}.", { rel: PL, tkind: 'overdue' },
      { calm: "Everybody's been circling {target} for a while, and tonight we all land, so it's {target}." }),
    B('nb3.t6', "{target} is the most dangerous person left, and the longer I wait, the harder it gets, so it's {target}.", { rel: PL },
      { anxious: "Every day {target} stays, my odds go down, and I can't take another day of that, so it's {target}." }),
    B('nb3.t7', "You're my friend, {target}, and you're also the person most likely to beat me, and I can only care about one of those tonight.", { rel: FR },
      { warm: "I'll cheer for you from wherever I end up, {target}, but I can't let you win this, so I'm writing you down.", schemer: "The best friend I've got out here is also the biggest threat, {target}, and you know I'm not letting that slide." }),
    B('nb3.t8', "You're dangerous, {target}, and I can't stand you, so for once strategy and how I feel agree.", { rel: ['enemy'] },
      { dry: "Strategy says {target}, my gut says {target}, and for once they get along, so it's {target}." }),
  ],

  // ── personal ──
  'booth3.grudge': [
    B('nb3.g1', "I could tell you this is about strategy, but it's not. {target} has gotten under my skin since the day we got here, and now I get to do something about it.", { rel: ['enemy', 'cold'] },
      { loud: "{target}, you've been driving me up the wall for weeks, and tonight I get the last word!", warm: "I don't usually hold grudges, but {target} is the exception, so it's {target}." }),
    B('nb3.g2', "Every argument we've had, {target}, this is my answer to all of them, and it's the only one you won't get to talk back to.", { rel: ['enemy'] },
      { blunt: "We don't get along, {target}, and we were never going to, so it's you.", cruel: "I'm writing your name in my best handwriting, {target}, so the host can read it nice and clearly." }),
    B('nb3.g3', "We don't really talk, {target}, and the little we do talk is bad, so I'm not going to miss you.", { rel: PL },
      { quiet: "{target} and I don't get along, and that's all there is to it, so it's {target}." }),
    B('nb3.g4', "We used to be close, {target}, and somewhere in the last few days that stopped, and this is what's left of it.", { rel: FR },
      { emotional: "I don't know when we stopped being friends, {target}, but we did, and I'm writing your name." }),
  ],
  'booth3.gut': [
    B('nb3.u1', "I can't point to one thing {target} did. Something just doesn't sit right with me, and I've learned to listen to that, so it's {target}.", { rel: PL },
      { calm: "Nothing {target} has said is wrong, exactly. It just doesn't add up, so it's {target}.", nerdy: "I can't prove it, which bothers me, but the pattern's there, so it's {target}." }),
    B('nb3.u2', "{target} smiles at me every morning and I have no idea what {target} is thinking, and that's enough of a reason, so it's {target}.", { rel: PL },
      { anxious: "{target} is way too nice to me, and that scares me, so it's {target}.", dry: "{target} is very friendly. I don't trust friendly, so it's {target}." }),
    B('nb3.u3', "I've never trusted you, {target}, and nothing you did this week changed my mind, so it's you.", { rel: ['enemy'] },
      { tough: "I've had my eye on you since day one, {target}, and I didn't like what I saw." }),
    B('nb3.u4', "I want to trust you, {target}, and I can't, and I've tried, so I'm going with the feeling instead of with you.", { rel: FR },
      { earnest: "You've been good to me, {target}, but something's off, and I'd rather be wrong than blindsided." }),
  ],

  // ── the group's name ──
  'booth3.plan': [
    B('nb3.p1', "{group} agreed on {target} this afternoon, and I said I'd be there, so I'm here, and it's {target}.", { rel: PL, group: true },
      { earnest: "I gave {group} my word, and I don't break my word, so it's {target}.", schemer: "{group} thinks this is their plan. Fine, let them think that, so it's {target}." }),
    B('nb3.p2', "{leader} said {target}, and {leader} has been right every time so far, so I'm not going to start doubting {leader} tonight.", { rel: PL, leader: true },
      { anxious: "{leader} said {target}, so I'm writing {target}, and please let {leader} be right.", tough: "{leader} made the call and I'm backing it, so it's {target}." }),
    B('nb3.p3', "Everybody's voting {target} tonight, and I'm not going to be the one vote that sticks out, so it's {target}.", { rel: PL, most: true },
      { dry: "I checked, and everybody's writing {target}. I don't do group projects, but I'll do this one.", goofy: "Everybody's writing {target}, and I'm not about to be the weird one, so {target}." }),
    B('nb3.p4', "{group} gets one person closer to the end tonight, and I get rid of somebody I don't like, so everybody wins except {target}.", { rel: ['enemy'], group: true },
      { cruel: "{group} picked {target}, and honestly, it's like they read my mind." }),
    B('nb3.p5', "Nobody had to talk me into this one, {target}, because I've wanted you gone for a while.", { rel: ['enemy'] },
      { blunt: "This was the easiest vote of the game, {target}. Bye." }),
    B('nb3.p6', "{group} chose you, {target}, and we're friends, so I fought it for as long as I could, and then I lost, and now I'm writing it.", { rel: FR, group: true },
      { warm: "I tried to talk {group} out of you, {target}. I'm still writing your name, and I'm sorry." }),
    B('nb3.p7', "You're one of the people I trust most out here, {target}, and I'm still writing your name, because I can't be the only one who doesn't.", { rel: FR, most: true },
      { emotional: "Everybody's voting for you, {target}, and if I don't, they'll come for me next. I'm sorry, I'm so sorry." }),
  ],

  // ── the strategy the engine played, in the voter's words ──
  'booth3.organized': [
    B('nb3.o1', "I put this vote together myself, and I counted {locked} votes before I walked in here, so it's {target}.", { rel: PL, locked: true },
      { schemer: "{locked} votes, all of them mine, and {target} has no idea, so it's {target}.", anxious: "I've counted {locked} votes three times now, and I still feel sick, so it's {target}." }),
    B('nb3.o2', "Nobody else was going to make this move, so I made it, and I spent the whole day getting people on board. {target}.", { rel: PL },
      { competitive: "Somebody had to make a move tonight, and I'd rather it was me, so it's {target}.", dry: "I organized a vote. It turns out I'm good at it, so it's {target}." }),
    B('nb3.o3', "I spent all day getting people to write your name, {target}, and I enjoyed every minute of it.", { rel: ['enemy'] },
      { cruel: "I built this whole vote around you, {target}. Consider it a compliment." }),
    B('nb3.o4', "I'm the one who put this together, {target}, and you're my friend, and I want you to know it was me and not somebody else.", { rel: FR },
      { warm: "I did this, {target}, nobody else. If you're going to be mad at somebody, be mad at me." }),
  ],
  'booth3.joined': [
    B('nb3.j1', "{pitcher} came to me with {target} this afternoon, and once I saw the numbers were there, I was in, so it's {target}.", { rel: PL, pitcher: true },
      { anxious: "{pitcher} said the votes were there, and I really hope {pitcher} counted right, so it's {target}.", schemer: "{pitcher} thinks I joined {pitcher}'s plan. I joined the winning side, so it's {target}." }),
    B('nb3.j2', "I didn't come up with this one. {pitcher} did, and {pitcher} made a good enough case that I'm writing {target}.", { rel: PL, pitcher: true },
      { blunt: "It's {pitcher}'s plan, and it's a good one, so it's {target}." }),
    B('nb3.j3', "{pitcher} asked if I'd vote {target}, and I didn't even let {pitcher} finish the sentence.", { rel: ['enemy'], pitcher: true },
      { tough: "{pitcher} wanted {target} gone, and so did I, so that was a short conversation." }),
    B('nb3.j4', "{pitcher} talked me into this, {target}, and I let it happen, and you didn't deserve that from me.", { rel: FR, pitcher: true },
      { emotional: "I said yes to {pitcher}, {target}, and I've regretted it every minute since, and I'm still writing it." }),
  ],
  'booth3.overplay': [
    B('nb3.v1', "{target} was whispering at me the whole time we sat down tonight, and everybody saw it, so I'm writing {target} before {target} talks me into anything else.", { rel: PL },
      { dry: "{target} whispered so loudly at this vote that I heard the whole plan, so it's {target}.", bossy: "If you're going to scheme at the vote, {target}, at least do it quietly, so it's {target}." }),
    B('nb3.v2', "{target} tried to work the room tonight, right in front of everyone, and that told me everything, so it's {target}.", { rel: PL },
      { schemer: "You never scramble in front of the whole room, {target}, and you just did, so it's {target}." }),
    B('nb3.v3', "You were whispering to my friends right in front of me tonight, {target}, and that was a mistake.", { rel: ['enemy'] }),
    B('nb3.v4', "I came in here ready to protect you, {target}, and then you started whispering to everybody but me, so it's you.", { rel: FR }),
  ],
  'booth3.shifted': [
    B('nb3.f1', "I walked in tonight ready to write {alt}, but by the time we sat down, everybody had moved to {target}, so I moved too.", { rel: PL, alt: true },
      { anxious: "It was {alt} this afternoon, and then it wasn't, and I've stopped trying to keep up, so it's {target}.", dry: "The plan was {alt}, then it was {target}, and I'm writing the one that's winning." }),
    B('nb3.f2', "{alt} was my name until about an hour ago. Then the numbers changed, and I'm not going down with the old plan, so it's {target}.", { rel: PL, alt: true },
      { competitive: "I don't care whose name it was this morning. I care whose name it is now, so it's {target}." }),
    B('nb3.f3', "It was going to be {alt}, and when it turned into you, {target}, I didn't exactly fight it.", { rel: ['enemy'], alt: true }),
    B('nb3.f4', "This was supposed to be {alt}, {target}, and somewhere today it turned into you, and I couldn't stop it.", { rel: FR, alt: true },
      { warm: "I wanted it to stay on {alt}, {target}. I'm sorry it didn't." }),
  ],
  'booth3.held': [
    B('nb3.h1', "Somebody tried to get me onto {alt} at the last minute, and it didn't add up, so I'm sticking with what I said, and it's {target}.", { rel: PL, alt: true },
      { calm: "I heard the pitch for {alt}, and I thought about it, and nothing changed, so it's {target}.", schemer: "A late switch to {alt} sounds great until it fails, so it's {target}." }),
    B('nb3.h2', "I thought about writing {alt} for about a minute, and then I remembered I gave my word, so it's {target}.", { rel: PL, alt: true },
      { earnest: "I said {target}, and I'm a person who means what I say, so {alt} will have to wait.", anxious: "Everybody kept whispering {alt} at me, and I nearly changed it, and I didn't. {target}." }),
    B('nb3.h3', "There was talk of {alt} tonight, but I've wanted you gone too long, {target}, to switch now.", { rel: ['enemy'], alt: true }),
    B('nb3.h4', "I looked for any way to make it {alt} instead of you, {target}, and there wasn't one.", { rel: FR, alt: true },
      { emotional: "I tried so hard to make it {alt}, {target}. I couldn't, and I'm sorry." }),
  ],
  'booth3.mixup': [
    B('nb3.m1', "I'm pretty sure this is the name we all agreed on, so here it goes. {target}.", { rel: [...PL, 'enemy', 'close', 'ally', 'pact'] },
      { ditzy: "We said {target}, right? I'm almost sure we said {target}, so it's {target}.", anxious: "I went over the plan in my head about ten times, and I think it's {target}. I'm, like, eighty percent sure." }),
    B('nb3.m2', "Everybody said the name so fast this afternoon, but I'm fairly certain it was {target}, so it's {target}.", { rel: [...PL, 'enemy', 'close', 'ally', 'pact'] },
      { goofy: "There was a lot of whispering today and most of it was in my bad ear, but I'm going with {target}." }),
  ],

  // ── the relationship, whatever the case, and the promises broken ──
  'booth3.any': [
    B('nb3.n1', "You told me something real out here, {target}, something I'd been through too, and I'm still writing your name. I don't know what that makes me.", { kindred: true, kin: 'heavy' },
      { emotional: "You trusted me with the worst thing that ever happened to you, {target}, because it happened to me too. And I'm writing your name. I'm so sorry." , cruel: "We bonded, {target}. It was sweet. This is a game." }),
    B('nb3.n2', "Out of everybody here, {target}, you're the one who actually gets me, and that's exactly why I can't take you to the end.", { kindred: true },
      { schemer: "The person who understands me best is the most dangerous person here, {target}, so it's you.", warm: "I found somebody out here who gets me, {target}, and now I'm voting them out. This game is the worst." }),
    B('nb3.n3', "We're from the same place, {target}, and I'll buy you a drink back home, but tonight it's you.", { kindred: true, kin: 'home' },
      { goofy: "Home's going to be so awkward now, {target}. Sorry in advance, and also, see you at the supermarket." }),
    B('nb3.a1', "We made a final three deal, {target}, and I meant it when I said it. It's just that I need to get to the end more than I need the deal.", { rel: 'pact', band: ['friends', 'neutral'] },
      { schemer: "We had a deal to go to the final three, {target}, and I had a better one with everybody else, so it's you.", emotional: "I promised you we'd go to the end together, {target}, and I'm breaking it, and I'll never forgive myself." }),
    B('nb3.a2', "I told you the end, {target}, just you and me, and now I'm writing your name, and I'm going to have to look at you while they read it.", { rel: 'pact', band: ['friends', 'neutral'] },
      { anxious: "I promised you the final three, {target}, and I can't keep it, and I'm going to throw up.", blunt: "I said final three, {target}. I lied, so it's you." }),
    B('nb3.a8', "We had a final three deal, {target}, and you've treated me like I wasn't part of it for days, so I'm not part of it anymore.", { rel: 'pact', band: ['cold', 'enemies'] },
      { blunt: "Our deal ended the day you stopped acting like my partner, {target}, so it's you.", cruel: "We had a final three deal, {target}. Had." }),
    B('nb3.a9', "I made a promise to you, {target}, and I made it before I knew what you were like, so I'm taking it back tonight.", { rel: 'pact', band: ['cold', 'enemies'] },
      { calm: "That final three deal made sense once, {target}. It doesn't anymore." }),
    B('nb3.a3', "We're both in {mine}, {target}, and I never thought I'd write your name, but here we are.", { rel: 'ally', mine: true },
      { cruel: "{mine} just got one person smaller, {target}.", warm: "{mine} was supposed to be all of us at the end, {target}, and I'm so sorry it isn't." }),
    B('nb3.a4', "{mine} was meant to protect both of us, {target}, but tonight it can only protect one of us, and I'm the one holding the pen.", { rel: 'ally', mine: true },
      { dry: "I'm in {mine} with you, {target}. Was, anyway, so it's you." }),
    B('nb3.a5', "You're my friend, {target}, and I'm still doing it, and I'll explain it to you properly when this is all over.", { rel: FR },
      { warm: "I'm so sorry, {target}. I'll make it up to you after the show, I promise.", tough: "You'd do the same to me, {target}. I hope you would, anyway." }),
    B('nb3.a6', "I can't stand you, {target}, and that's the whole reason, and I don't need another one.", { rel: ['enemy'] },
      { cruel: "Bye, {target}. I'm not going to miss a single thing about you.", loud: "I have waited SO long to write your name, {target}, and I am writing it BIG!" }),
    B('nb3.a7', "{target} is the name that makes the most sense tonight, and I've thought about it all day, so it's {target}.", { rel: PL },
      { dry: "I thought about this all day, and the answer was {target} the whole time.", anxious: "I've changed my mind four times today, and I'm landing on {target}, and I'm not changing it again." }),
  ],
};
