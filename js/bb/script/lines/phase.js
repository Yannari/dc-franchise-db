// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/phase.js — each part of the week (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/phases.js: the stretch before the HOH comp, the day
// after it, the days on the block, the veto days. Plain talk.
//
//   phase.open        before HOH: a and b, everyone still equal           scene
//   phase.prepos      before HOH: a asks b to agree a target, c (not there) scene
//   phase.scramble    HOH day: a goes to see b, the new HOH               desperate | respect
//   phase.power       HOH day: b watches a, the HOH, change               scene
//   phase.isolation   on the block: a, a nominee; b keeps away             scene
//   phase.relief      after noms: a and b are safe; {target} a nominee     scene
//   phase.lobby       veto days: a, a nominee, asks b, the veto holder     hopeful | pleading
//   phase.weighs      veto days: a holds the veto; b is the HOH            scene
//   phase.last-equal  before HOH: a, b and c                               scene
//   phase.outgoing    before HOH: a was HOH last week; b has a grudge      scene
//   phase.hoh-room    HOH day: a the HOH; b invited up; c left out         scene
//   phase.targets     HOH day: a gives b, the HOH, a name: c (not there)   long | new
//   phase.reckons     on the block: a counts votes; b is one a needs       scene
//   phase.sides       on the block: a and b, the two nominees              scene
//   phase.leaned      veto days: a, the HOH, talks to b, the holder        heavy | straight
//   phase.chair       veto days: a could be the replacement; b is the HOH  scene

export default {
  'phase.open.scene': [
    { id: 'po.1', turns: [{ by: 'a', say: "Last morning where nobody's in charge." }, { by: 'b', say: "Enjoy it. By tonight someone's got the keys." }] },
    { id: 'po.2', turns: [{ by: 'a', say: "Who do you want to win HOH today?" }, { by: 'b', say: "Honestly? Me." }, { by: 'a', say: "Apart from you." }, { by: 'b', say: "...Still me." }] },
    { id: 'po.3', turns: [{ by: 'a', dr: "Right now, nobody has any power. In a few hours, somebody will. I'd like it to be me." }] },
    { id: 'po.4', turns: [{ by: 'b', say: "Are you nervous about the comp?" }, { by: 'a', say: "A bit. Are you?" }, { by: 'b', say: "I can't eat." }] },
    { id: 'po.5', turns: [{ beat: '{a} and {b} make breakfast while the house waits for the competition.' }, { by: 'b', say: "If you win, who goes up?" }, { by: 'a', say: "Ask me after I win." }] },
    { id: 'po.6', turns: [{ by: 'a', say: "If I win, you're safe. You know that." }, { by: 'b', say: "Same for you." }] },
    { id: 'po.7', turns: [{ by: 'a', dr: "Everyone's being really nice this morning. That's because nobody knows who's going to win yet." }] },
    { id: 'po.8', turns: [{ by: 'b', say: "I hate this bit. The waiting." }, { by: 'a', say: "At least nobody's on the block yet." }, { by: 'b', say: "Yet." }] },
    { id: 'po.9', turns: [{ by: 'a', say: "What do you think the comp will be?" }, { by: 'b', say: "Something that makes me fall over, probably." }] },
    { id: 'po.10', turns: [{ by: 'a', dr: "This is the one time every week when we're all equal. It never lasts long." }] },
  ],
  'phase.prepos.scene': [
    { id: 'pp2.1', turns: [{ by: 'a', say: "If either of us wins, {c} goes up. Agreed?" }, { by: 'b', say: "Agreed. Does anyone else know?" }, { by: 'a', say: "Not yet." }] },
    { id: 'pp2.2', turns: [{ by: 'a', say: "I'm not saying I'll win. I'm saying if I do, {c} goes up." }, { by: 'b', say: "And if I win?" }, { by: 'a', say: "Then I hope you'd do the same." }] },
    { id: 'pp2.3', turns: [{ by: 'a', dr: "Nobody's got any power yet. That's the best time to agree on a target." }] },
    { id: 'pp2.4', turns: [{ by: 'a', say: "Can we agree on one thing before the comp?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "{c}. Whoever wins puts {c} up." }, { by: 'b', say: "Deal." }] },
    { id: 'pp2.5', turns: [{ by: 'b', say: "Why {c}?" }, { by: 'a', say: "Because if {c} wins, one of us is going up." }, { by: 'b', say: "...Fair enough." }] },
    { id: 'pp2.6', turns: [{ by: 'a', dr: "I've told three people the same thing about {c} today. If any of them wins, I've done my job." }] },
    { id: 'pp2.7', turns: [{ by: 'a', say: "Promise me. If you win, {c} goes up." }, { by: 'b', say: "I promise. Does it work both ways?" }, { by: 'a', say: "It works both ways." }] },
  ],
  'phase.scramble.desperate': [
    { id: 'ps2.d1', turns: [{ by: 'a', say: "Congratulations! Seriously, well done." }, { by: 'b', say: "Thanks." }, { by: 'a', say: "So... are we good?" }, { by: 'b', say: "We're good." }, { by: 'a', dr: "{b} said we're good. I don't believe a word of it." }] },
    { id: 'ps2.d2', when: { early: false }, turns: [{ by: 'b', dr: "{a} has barely spoken to me in weeks. Now I've won, {a} wants to talk for forty minutes. Funny, that." }] },
    { id: 'ps2.d3', turns: [{ by: 'a', say: "I just want you to know, I've never once said your name." }, { by: 'b', say: "Okay." }, { by: 'a', say: "I mean it." }, { by: 'b', say: "I said okay." }] },
    { id: 'ps2.d4', turns: [{ by: 'a', dr: "I was up those stairs before {b} had even stopped celebrating. I'm not proud of it. I'm scared." }] },
    { id: 'ps2.d5', turns: [{ by: 'a', say: "Whatever you need this week, I'm here." }, { by: 'b', say: "Where were you last week?" }, { by: 'a', say: "...Busy." }] },
    { id: 'ps2.d6', turns: [{ by: 'a', say: "I know we haven't talked much." }, { by: 'b', say: "We haven't talked at all." }, { by: 'a', say: "I'd like to change that." }, { by: 'b', say: "This week. Right." }] },
    { id: 'ps2.d7', turns: [{ by: 'b', dr: "Everyone who ignored me last week is suddenly my best friend. I'm not stupid." }] },
  ],
  'phase.scramble.respect': [
    { id: 'ps2.r1', turns: [{ by: 'a', say: "I don't need anything from you this week. I just wanted to say well done." }, { by: 'b', say: "That's the first time anyone's said that without asking for something." }] },
    { id: 'ps2.r2', turns: [{ by: 'a', say: "Can I see the room?" }, { by: 'b', say: "Come in. You're the first one up." }, { by: 'a', say: "I'm always first." }] },
    { id: 'ps2.r3', turns: [{ by: 'b', dr: "{a} was the first person through my door. That's not nothing. I'll remember it." }] },
    { id: 'ps2.r4', turns: [{ by: 'a', say: "You deserved that win." }, { by: 'b', say: "Thank you. Stay for a bit?" }, { beat: '{a} stays for an hour. Nothing is promised.' }] },
    { id: 'ps2.r5', turns: [{ by: 'a', say: "Enjoy it. You earned it." }, { by: 'b', say: "And you're not worried?" }, { by: 'a', say: "Should I be?" }, { by: 'b', say: "No. You shouldn't." }] },
    { id: 'ps2.r6', turns: [{ by: 'a', dr: "I went up to congratulate {b}. We talked for an hour about everybody except us. We're fine." }] },
    { id: 'ps2.r7', turns: [{ by: 'a', say: "Big week for you." }, { by: 'b', say: "Big week for all of us." }, { by: 'a', say: "Yeah, but you're the one making the decisions." }] },
  ],
  'phase.power.scene': [
    { id: 'pw2.1', turns: [{ by: 'b', dr: "{a} has been HOH for four hours and already sounds different. I noticed. I don't think {a} has." }] },
    { id: 'pw2.2', turns: [{ by: 'a', say: "As HOH, I think we should all clean the kitchen." }, { beat: 'The room goes quiet.' }, { by: 'b', dr: "\"As HOH\". That didn't take long." }] },
    { id: 'pw2.3', turns: [{ by: 'b', dr: "Watching {a} today tells me a lot about how {a} would play with nothing. It's not good news." }] },
    { id: 'pw2.4', when: { room: ['kitchen'] }, turns: [{ beat: '{a} holds court in the kitchen. {b} watches from the doorway.' }, { by: 'b', dr: "{a} loves this. Maybe a bit too much." }] },
    { id: 'pw2.5', turns: [{ by: 'a', say: "Everyone's being so nice to me today." }, { by: 'b', say: "Wonder why." }, { by: 'a', say: "Because I'm lovely?" }, { by: 'b', say: "Sure. That must be it." }] },
    { id: 'pw2.6', turns: [{ by: 'b', dr: "Give some people a bit of power and they change straight away. {a} is one of those people." }] },
    { id: 'pw2.7', turns: [{ by: 'a', dr: "I know people are watching how I act this week. I'm trying to stay the same. It's harder than it sounds." }] },
  ],
  'phase.isolation.scene': [
    { id: 'pi.1', when: { room: ['kitchen'] }, turns: [{ beat: '{a} sits down at the kitchen table. One by one, everyone else finds a reason to leave.' }, { by: 'a', dr: "Nobody's being mean. They just don't want to be seen sitting with me." }] },
    { id: 'pi.2', turns: [{ by: 'a', say: "Want to sit with me?" }, { by: 'b', say: "I was just about to go and shower, sorry." }, { by: 'a', dr: "{b} showered an hour ago." }] },
    { id: 'pi.3', turns: [{ by: 'a', dr: "Being on the block means being on your own in a house full of people. I learned that fast." }] },
    { id: 'pi.4', turns: [{ by: 'a', say: "You've barely said two words to me since the ceremony." }, { by: 'b', say: "I've been busy." }, { by: 'a', say: "Doing what?" }, { by: 'b', say: "...Things." }] },
    { id: 'pi.5', turns: [{ by: 'a', dr: "{b} was my closest friend in here before nominations. Since then, {b} can't look at me." }] },
    { id: 'pi.6', turns: [{ beat: '{a} walks into the room. The conversation stops.' }, { by: 'a', say: "Don't stop on my account." }, { beat: 'Nobody starts again.' }] },
    { id: 'pi.7', turns: [{ by: 'b', dr: "I feel bad avoiding {a}. But I can't be seen with {a} this week. It'll put a target on me too." }] },
    { id: 'pi.8', turns: [{ by: 'a', dr: "Everyone's being very careful around me. Like I'm already gone." }] },
    { id: 'pi.9', turns: [{ by: 'a', say: "Hey, {b}." }, { by: 'b', say: "Oh, hi. Sorry, I've got to..." }, { beat: '{b} leaves without finishing the sentence.' }] },
    { id: 'pi.10', turns: [{ by: 'a', dr: "It's so quiet when you're on the block. People stop telling you things." }] },
  ],
  'phase.relief.scene': [
    { id: 'pv2.1', turns: [{ by: 'b', say: "It's not us." }, { by: 'a', say: "Shh. Don't say it out loud." }, { by: 'b', say: "I know. But it's not us." }] },
    { id: 'pv2.2', turns: [{ by: 'a', dr: "I'm so relieved I wasn't nominated. I feel bad for being relieved. But I'm still relieved." }] },
    { id: 'pv2.3', when: { room: ['kitchen'] }, turns: [{ beat: 'Somebody puts music on. {a} and {b} dance in the kitchen.' }, { by: 'a', dr: "Then I remembered two people in this house can't enjoy it. I turned it down." }] },
    { id: 'pv2.4', when: { known: true }, turns: [{ by: 'b', say: "I should go and talk to {target}." }, { by: 'a', say: "Yeah. You should." }, { by: 'b', say: "What do I even say?" }] },
    { id: 'pv2.5', turns: [{ by: 'a', say: "Another week safe." }, { by: 'b', say: "Don't get comfortable." }, { by: 'a', say: "I'm not. I'm just breathing." }] },
    { id: 'pv2.6', turns: [{ by: 'a', dr: "Safe for another week. I'm not going to celebrate in front of the nominees, though. I'm not a monster." }] },
    { id: 'pv2.7', when: { known: true }, turns: [{ by: 'b', dr: "I'm glad it's not me. I feel horrible that it's {target}." }] },
    { id: 'pv2.8', turns: [{ by: 'a', say: "Are you okay?" }, { by: 'b', say: "Yeah. Just glad it wasn't me." }, { by: 'a', say: "Me too." }] },
    { id: 'pv2.9', turns: [{ by: 'b', say: "We have to be careful how we act this week." }, { by: 'a', say: "Agreed. No celebrating." }] },
    { id: 'pv2.10', turns: [{ by: 'a', dr: "My name didn't come up on that screen. I slept properly last night for the first time in days." }] },
  ],
  'phase.lobby.hopeful': [
    { id: 'pl2.h1', turns: [{ by: 'a', say: "I know you're going to use it. But I have to ask." }, { by: 'b', say: "Stop worrying." }, { beat: '{b} gives {a} a hug.' }] },
    { id: 'pl2.h2', turns: [{ by: 'a', say: "You know what I'd do if it was the other way round." }, { by: 'b', say: "I know." }, { by: 'b', dr: "I do know. That's the problem I've been thinking about all afternoon." }] },
    { id: 'pl2.h3', turns: [{ by: 'a', say: "I'm not going to beg. Just think about it, okay?" }, { by: 'b', say: "I am thinking about it." }] },
    { id: 'pl2.h4', turns: [{ by: 'a', say: "We've been close since the start. I hope that counts." }, { by: 'b', say: "It counts." }, { by: 'a', say: "Enough?" }, { by: 'b', say: "...I'll tell you at the meeting." }] },
    { id: 'pl2.h5', turns: [{ by: 'b', dr: "{a} is one of my closest friends in here. That's why this decision is so hard." }] },
    { id: 'pl2.h6', turns: [{ by: 'a', say: "Just tell me I'm not wasting my time." }, { by: 'b', say: "You're not wasting your time." }, { by: 'a', dr: "That's not a yes. But it's close." }] },
    { id: 'pl2.h7', turns: [{ by: 'a', say: "I trust you. Whatever you decide." }, { by: 'b', say: "Don't say that. It makes it harder." }] },
    { id: 'pl2.h8', turns: [{ by: 'b', say: "You don't even need to ask." }, { by: 'a', say: "I know. I'm asking anyway." }] },
  ],
  'phase.lobby.pleading': [
    { id: 'pl2.p1', turns: [{ by: 'a', say: "I know we're not close. But I'd owe you." }, { by: 'b', say: "I'll think about it." }, { by: 'a', dr: "{b} said {b.sub}'d think about it. I could tell from the first sentence it wasn't going to work." }] },
    { id: 'pl2.p2', turns: [{ by: 'a', say: "I'm not asking you to like me. I'm asking you to save me." }, { by: 'b', say: "That's a big ask." }, { by: 'a', say: "I know." }] },
    { id: 'pl2.p3', turns: [{ by: 'b', dr: "{a} has come to find me four times today. The first time was fine. The fourth time was too many." }] },
    { id: 'pl2.p4', turns: [{ by: 'a', say: "If you save me, I'll vote however you want for the rest of the game." }, { by: 'b', say: "That's a lot to promise." }, { by: 'a', say: "I mean it." }, { by: 'b', say: "I know you do. That's what worries me." }] },
    { id: 'pl2.p5', turns: [{ by: 'a', dr: "I've got nothing to offer {b} except a promise. So I'm offering a really big promise." }] },
    { id: 'pl2.p6', turns: [{ by: 'a', say: "Can we talk about the veto?" }, { by: 'b', say: "We talked about it this morning." }, { by: 'a', say: "Can we talk about it again?" }] },
    { id: 'pl2.p7', turns: [{ by: 'b', say: "Why should I use it on you?" }, { by: 'a', say: "Because I'd be loyal to you." }, { by: 'b', say: "You've never been loyal to me before." }] },
    { id: 'pl2.p8', turns: [{ by: 'a', dr: "I know {b} isn't going to save me. I had to try. I'd hate myself if I didn't." }] },
  ],
  'phase.weighs.scene': [
    { id: 'pg2.1', turns: [{ by: 'a', dr: "I'm the only person this week with a completely free choice. And I hate it." }] },
    { id: 'pg2.2', turns: [{ by: 'a', dr: "If I use it, {b} is angry with me. If I don't, whoever stays up there is angry with me. There's no good option." }] },
    { id: 'pg2.3', turns: [{ by: 'a', say: "What happens if I use it?" }, { by: 'b', say: "Then I name a replacement." }, { by: 'a', say: "Who?" }, { by: 'b', say: "You don't need to worry about that." }, { by: 'a', dr: "That answer made me worry about it a lot." }] },
    { id: 'pg2.4', turns: [{ by: 'a', dr: "Everyone keeps asking me what I'm going to do. I don't know yet. I'm just pretending I do." }] },
    { id: 'pg2.5', turns: [{ by: 'a', say: "Can I ask you something, {b}? Off the record?" }, { by: 'b', say: "Nothing's off the record in here." }] },
    { id: 'pg2.6', turns: [{ by: 'a', dr: "I've changed my mind about the veto three times today. I'll probably change it again tonight." }] },
  ],
  'phase.last-equal.scene': [
    { id: 'pq2.1', turns: [{ by: 'a', say: "If I win, you two are safe." }, { by: 'b', say: "Same." }, { by: 'c', say: "Same. Obviously." }, { by: 'a', dr: "Nobody asked about the replacement nominee. I noticed." }] },
    { id: 'pq2.2', turns: [{ by: 'a', say: "Where's the vote going if nothing changes?" }, { by: 'b', say: "Probably the same way as last week." }, { by: 'c', say: "Don't be so sure." }] },
    { id: 'pq2.3', turns: [{ beat: '{a}, {b} and {c} play cards before the competition.' }, { by: 'b', say: "If I win, you're both safe." }, { by: 'c', say: "And if one of us wins the veto?" }, { by: 'b', say: "Then we're all fine." }] },
    { id: 'pq2.4', turns: [{ by: 'c', say: "What's the worst thing that could happen today?" }, { by: 'a', say: "Somebody we don't trust wins." }, { by: 'b', say: "So, most people." }] },
    { id: 'pq2.5', turns: [{ by: 'b', say: "Who's going to win?" }, { by: 'a', say: "One of us, hopefully." }, { by: 'c', say: "And if not?" }, { by: 'a', say: "Then we've got a problem." }] },
    { id: 'pq2.6', turns: [{ by: 'a', dr: "{b}, {c} and I all promised each other safety this morning. Let's see who keeps it." }] },
    { id: 'pq2.7', turns: [{ by: 'c', say: "Let's agree. Whoever wins doesn't put the other two up." }, { by: 'a', say: "Agreed." }, { by: 'b', say: "Agreed." }] },
    { id: 'pq2.8', turns: [{ by: 'b', say: "I can't eat before comps." }, { by: 'c', say: "I eat more before comps." }, { by: 'a', say: "That explains a lot." }] },
    { id: 'pq2.9', turns: [{ by: 'a', dr: "We all said we'd keep each other safe. I noticed {c} said it a bit quieter than the rest of us." }] },
  ],
  'phase.outgoing.scene': [
    { id: 'pu2.1', turns: [{ by: 'a', dr: "I can't play in the HOH comp today. I have to sit and watch someone else decide my week." }] },
    { id: 'pu2.2', turns: [{ by: 'a', dr: "Last week I had my own room. This week I'm back in a bunk, and a lot of people are angry with me." }] },
    { id: 'pu2.3', turns: [{ by: 'b', dr: "{a} put me up last week. Now {a} can't play and can't protect anyone. My turn." }] },
    { id: 'pu2.4', turns: [{ by: 'b', say: "Enjoying your first day back downstairs?" }, { by: 'a', say: "Don't." }, { by: 'b', say: "I'm just asking." }] },
    { id: 'pu2.5', turns: [{ by: 'a', dr: "Everyone remembers who I nominated. And I'm the only person who can't win safety today." }] },
    { id: 'pu2.6', turns: [{ beat: '{a} carries a bag of clothes down from the HOH room.' }, { by: 'b', say: "Need a hand?" }, { by: 'a', say: "No, thanks." }, { by: 'b', dr: "I wasn't offering to be nice." }] },
    { id: 'pu2.7', turns: [{ by: 'a', say: "Whoever wins, please don't come after me." }, { by: 'b', say: "Why not? You came after us." }] },
    { id: 'pu2.8', turns: [{ by: 'b', dr: "I've been waiting all week for {a} to be ordinary again. Today's the day." }] },
    { id: 'pu2.9', turns: [{ by: 'a', dr: "Being HOH was great. Being the ex-HOH is the worst job in the house." }] },
  ],
  'phase.hoh-room.scene': [
    { id: 'ph2.1', turns: [{ beat: 'The whole house crowds into the HOH room to look at the photos. An hour later, only {a} and {b} are still up there.' }, { by: 'c', dr: "I left after the photos. {b} didn't." }] },
    { id: 'ph2.2', turns: [{ by: 'a', say: "You can stay, {b}. Everyone else, out!" }, { by: 'b', say: "Really?" }, { by: 'a', say: "Really. Get comfy." }] },
    { id: 'ph2.3', turns: [{ by: 'c', dr: "I went up for the photos and left before the letter. I noticed who stayed. I wasn't one of them." }] },
    { id: 'ph2.4', turns: [{ by: 'a', dr: "I've got more close friends today than I did yesterday. Funny how that works." }] },
    { id: 'ph2.5', turns: [{ by: 'b', say: "This room is amazing." }, { by: 'a', say: "Stay as long as you want." }, { by: 'b', say: "Careful. I might never leave." }] },
    { id: 'ph2.6', turns: [{ by: 'a', say: "Want to see the letter from home?" }, { by: 'b', say: "Only if you want to show me." }, { beat: '{a} reads it out loud. They both get a bit emotional.' }] },
    { id: 'ph2.7', turns: [{ by: 'c', dr: "Everyone else got invited to stay. I got a smile and a nod. I know what that means." }] },
    { id: 'ph2.8', turns: [{ by: 'a', say: "I didn't want to be up here on my own tonight." }, { by: 'b', say: "You're not on your own." }] },
    { id: 'ph2.9', turns: [{ by: 'a', dr: "The people who stay in the HOH room are the people I trust. Everyone knows that. That's why they all want to stay." }] },
    { id: 'ph2.10', turns: [{ by: 'b', say: "I'm going to steal one of these snacks." }, { by: 'a', say: "Take two. You're my favourite." }] },
  ],
  'phase.targets.long': [
    { id: 'pt2.l1', turns: [{ by: 'a', say: "I've wanted {c} gone since week one." }, { by: 'b', say: "Why?" }, { by: 'a', say: "Because {c} has been playing everyone since day one." }] },
    { id: 'pt2.l2', turns: [{ by: 'a', dr: "I've been waiting weeks for someone with power to come after {c}. Now {b} has the keys." }] },
    { id: 'pt2.l3', turns: [{ by: 'a', say: "You don't owe me anything. But if you're looking at {c}, so am I. And I have been for a while." }] },
    { id: 'pt2.l4', turns: [{ by: 'b', say: "Why do you hate {c} so much?" }, { by: 'a', say: "I don't hate {c}. I just don't trust {c}. I never have." }] },
    { id: 'pt2.l6', turns: [{ by: 'a', say: "I'll be honest. I've never liked how {c} plays." }, { by: 'b', say: "Since when?" }, { by: 'a', say: "Since the first week. I've just been waiting for the right person to tell." }] },
    { id: 'pt2.l7', turns: [{ by: 'b', dr: "{a} has clearly had {c} in mind for a long time. That's either useful, or a reason to be careful with {a}." }] },
    { id: 'pt2.l5', turns: [{ by: 'a', dr: "Ever since the first week, I've known {c} is dangerous. This is my chance to say it to the right person." }] },
  ],
  'phase.targets.new': [
    { id: 'pt2.n1', turns: [{ by: 'a', say: "{c} would put you up next week. I'd bet on it." }, { by: 'b', say: "How do you know?" }, { by: 'a', say: "{c} has been watching you all week. I'm pretty sure." }] },
    { id: 'pt2.n2', turns: [{ by: 'a', say: "Several people are worried about {c}." }, { by: 'b', say: "Who's several people?" }, { by: 'a', say: "Just... people. I've got to go." }] },
    { id: 'pt2.n3', turns: [{ by: 'a', say: "If you're thinking about {c}, I'm with you." }, { by: 'b', say: "I didn't say I was." }, { by: 'a', say: "I'm just saying. If you are." }] },
    { id: 'pt2.n4', turns: [{ by: 'a', dr: "I only started worrying about {c} this week. But now I've started, I can't stop." }] },
    { id: 'pt2.n6', turns: [{ by: 'a', say: "Can I give you a name to think about?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "{c}. Just think about it. That's all." }] },
    { id: 'pt2.n7', turns: [{ by: 'a', dr: "I don't know if {b} will listen. But {c} is a problem, and somebody had to say it to the HOH." }] },
    { id: 'pt2.n5', turns: [{ by: 'b', dr: "{a} came up here to tell me about {c}. I'm going to think about it. I'm also going to think about why {a} wants {c} gone." }] },
  ],
  'phase.reckons.scene': [
    { id: 'pr2.1', turns: [{ by: 'a', dr: "I've counted the votes twice. I don't like the number either time. I need {b}." }] },
    { id: 'pr2.2', turns: [{ by: 'a', dr: "Last night I stopped being upset and started being useful. I made a list of who I need to talk to." }] },
    { id: 'pr2.3', turns: [{ by: 'a', dr: "Right now, the votes send me home. I've got a few days to change that." }] },
    { id: 'pr2.4', turns: [{ by: 'a', dr: "{b} is the first person I need to talk to. {b} won't look me in the eye." }] },
    { id: 'pr2.5', turns: [{ beat: '{a} sits on the bed, counting on {a.posAdj} fingers.' }, { by: 'a', dr: "Three. I need three people to change their minds. Starting with {b}." }] },
    { id: 'pr2.6', turns: [{ by: 'a', dr: "Some people have made up their minds. Some haven't. I'm going after the ones who haven't." }] },
    { id: 'pr2.7', turns: [{ by: 'a', dr: "I keep going over who's with me and who isn't. The list isn't long enough." }] },
    { id: 'pr2.8', turns: [{ by: 'a', dr: "I've got a plan. It starts with {b}. If {b} says no, I'm in trouble." }] },
    { id: 'pr2.9', turns: [{ by: 'a', dr: "Panicking won't save me. Talking to the right people might." }] },
    { id: 'pr2.10', turns: [{ by: 'a', dr: "I know who I've got and who I haven't. The difference is about two people. I can do two people." }] },
  ],
  'phase.sides.scene': [
    { id: 'pd2.1', turns: [{ by: 'a', dr: "Nobody's told me how they're voting. But I can tell. People are being nicer to {b} than to me." }] },
    { id: 'pd2.2', turns: [{ by: 'b', dr: "The house has already split. Half of them are bringing {a} food. Half of them are avoiding me. Or the other way round. I can't tell which." }] },
    { id: 'pd2.3', turns: [{ by: 'a', dr: "It's too early for anyone to say how they're voting. So I'm reading every look and every word." }] },
    { id: 'pd2.4', turns: [{ beat: 'At breakfast, the same people sit together as always. Nobody mentions the vote.' }, { by: 'b', dr: "Nobody has to say it. I can see who's sitting where." }] },
    { id: 'pd2.5', turns: [{ by: 'a', say: "{b}, can I ask you something?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "Do you think it's me or you?" }, { by: 'b', say: "I honestly don't know." }] },
    { id: 'pd2.6', turns: [{ by: 'b', say: "No hard feelings, whatever happens." }, { by: 'a', say: "No hard feelings." }, { by: 'a', dr: "That's easy to say on a Tuesday." }] },
    { id: 'pd2.7', turns: [{ by: 'a', dr: "{b} and I are on the block together. We're being polite. We both know only one of us is staying." }] },
    { id: 'pd2.8', turns: [{ by: 'b', dr: "{a} has more friends in here than me. I'm going to have to work really hard this week." }] },
    { id: 'pd2.9', turns: [{ by: 'a', say: "Good luck this week." }, { by: 'b', say: "You too. I mean it." }, { by: 'a', say: "Do you?" }, { by: 'b', say: "...Mostly." }] },
  ],
  'phase.leaned.heavy': [
    { id: 'pk2.h1', turns: [{ by: 'a', say: "It's your veto. Obviously." }, { by: 'b', say: "Obviously." }, { by: 'a', say: "I'm just saying, think about next week." }, { by: 'b', dr: "That wasn't advice. That was a warning." }] },
    { id: 'pk2.h2', turns: [{ by: 'a', say: "Remember who isn't on the block this week. And why." }, { by: 'b', say: "I remember." }, { by: 'a', say: "Good." }] },
    { id: 'pk2.h3', turns: [{ by: 'a', say: "If you use it, I'll have to put someone else up. Someone you like, probably." }, { by: 'b', say: "Is that a threat?" }, { by: 'a', say: "It's just how it works." }] },
    { id: 'pk2.h4', turns: [{ by: 'b', dr: "{a} didn't ask me to keep the nominations. {a} just explained what happens to people who make {a.posAdj} week difficult." }] },
    { id: 'pk2.h5', turns: [{ by: 'a', say: "I'd really like the nominations to stay the same." }, { by: 'b', say: "I know." }, { by: 'a', say: "I'd remember it if they did." }, { by: 'b', say: "And if they didn't?" }, { by: 'a', say: "I'd remember that too." }] },
    { id: 'pk2.h6', turns: [{ by: 'b', dr: "I came out of that conversation knowing exactly what using the veto would cost me." }] },
  ],
  'phase.leaned.straight': [
    { id: 'pk2.s1', turns: [{ by: 'a', say: "I'd like you not to use it. But it's your call." }, { by: 'b', say: "Do you really mean that?" }, { by: 'a', say: "I do." }] },
    { id: 'pk2.s2', turns: [{ by: 'a', say: "Use it if you need to. I'd rather you were honest with me." }, { by: 'b', dr: "{a} meant that. It made me trust {a} more." }] },
    { id: 'pk2.s3', turns: [{ by: 'a', say: "I'm not going to pressure you." }, { by: 'b', say: "Thank you." }, { by: 'a', say: "I just wanted you to know what I'm hoping for." }] },
    { id: 'pk2.s4', turns: [{ by: 'a', dr: "I told {b} what I want and then I left it. It's {b}'s decision. I'm not going to push." }] },
    { id: 'pk2.s5', turns: [{ by: 'a', say: "Sorry, I shouldn't even be asking." }, { by: 'b', say: "It's fine. I'd ask too." }] },
    { id: 'pk2.s6', turns: [{ by: 'b', dr: "{a} asked me nicely and didn't push. Now I feel like I owe {a} something." }] },
  ],
  'phase.chair.scene': [
    { id: 'pc2.1', turns: [{ by: 'a', dr: "If the veto gets used, someone has to go up. I've gone through every conversation with {b}. Not one promise of safety." }] },
    { id: 'pc2.2', turns: [{ by: 'a', say: "Can I make you breakfast?" }, { by: 'b', say: "...Sure." }, { by: 'b', dr: "{a} has never made me breakfast before. I know what this is." }] },
    { id: 'pc2.3', turns: [{ by: 'a', say: "Am I safe if the veto gets used?" }, { by: 'b', say: "Let's not talk about that yet." }, { by: 'a', dr: "That's not a yes." }] },
    { id: 'pc2.4', turns: [{ by: 'a', dr: "I really hope the veto doesn't get used. I can't say that to anyone without them asking why." }] },
    { id: 'pc2.5', turns: [{ beat: '{a} walks into the HOH room. {b} changes the subject straight away.' }, { by: 'a', dr: "{b} changed the subject the second I walked in. I think I know what they were talking about." }] },
    { id: 'pc2.6', turns: [{ by: 'a', say: "If you need a replacement, it's not going to be me, is it?" }, { by: 'b', say: "I haven't decided anything." }, { by: 'a', say: "That's not a no." }] },
    { id: 'pc2.7', turns: [{ by: 'a', dr: "There's an empty chair waiting if the veto gets used. I've got a horrible feeling it's got my name on it." }] },
    { id: 'pc2.8', turns: [{ by: 'a', say: "Do you need help with anything? Cleaning? Anything?" }, { by: 'b', say: "I'm fine, thanks." }, { by: 'b', dr: "Everyone who's scared of being the replacement is suddenly very helpful." }] },
    { id: 'pc2.9', turns: [{ by: 'a', dr: "Nobody's said my name. That's what scares me. Nobody would, until it's too late." }] },
    { id: 'pc2.10', turns: [{ by: 'a', say: "Whatever happens with the veto, we're good, right?" }, { by: 'b', say: "We'll see what happens." }, { by: 'a', dr: "We'll see what happens. Brilliant." }] },
  ],
};
