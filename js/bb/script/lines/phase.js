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
//   phase.leaned      veto days: a, the HOH, talks to b, the holder        heavy | straight | backdoor
//                     backdoor: the HOH WANTS it used; intent told (c, the backdoor target, named) | hint
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
    { id: 'ps2.d1', turns: [
      { by: 'a', say: "Congratulations. You really earned that." },
      { by: 'b', say: "Thank you." },
      { by: 'a', say: "I just want to make sure we're okay. We haven't really talked.", v: { anxious: "Sorry, I have to ask. Are we okay? I've been worried about it all day.", hard: "I'll be straight with you. I want to know where I stand." } },
      { by: 'b', say: "We're fine. Don't worry about it." },
      { by: 'a', dr: "{b} says we're fine. People say that right before they put you up.", v: { anxious: "{b} said we're fine, and I still can't relax. I don't believe it." } }] },
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
    { id: 'pw2.1', turns: [{ by: 'b', dr: "{a} has been HOH for four hours and already sounds different. I'll still go up there and ask for things, because that's the game. But I noticed, even if {a} hasn't." }] },
    { id: 'pw2.2', turns: [{ by: 'a', say: "As HOH, I think we should all clean the kitchen." }, { beat: 'The room goes quiet.' }, { by: 'b', dr: "\"As HOH\". That didn't take long." }] },
    { id: 'pw2.3', turns: [{ by: 'b', dr: "I'll be nice to {a} this week, because {a} has the key. But watching how {a} acts with a bit of power tells me a lot, and it's not good news." }] },
    { id: 'pw2.4', when: { room: ['kitchen'] }, turns: [{ beat: '{a} holds court in the kitchen. {b} watches from the doorway.' }, { by: 'b', dr: "{a} loves this. Maybe a bit too much." }] },
    { id: 'pw2.5', turns: [{ by: 'a', say: "Everyone's being so nice to me today." }, { by: 'b', say: "Wonder why." }, { by: 'a', say: "Because I'm lovely?" }, { by: 'b', say: "Sure. That must be it." }] },
    { id: 'pw2.6', turns: [{ by: 'b', dr: "Give some people a bit of power and they change straight away. {a} is one of those people. I'll still go up to that room and smile. That's the game. But I've noticed." }] },
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
    { id: 'pl2.h1', turns: [{ beat: "{a} finds {b} alone and sits down on the end of the bed." }, { by: 'a', say: "I know you're going to use it. But I have to ask." }, { by: 'b', say: "You don't have to ask." }, { by: 'a', say: "I do, though. If I don't ask and you don't use it, I'll spend the whole week wondering why I didn't." }, { by: 'b', say: "Then don't wonder. Stop worrying." }, { beat: "{b} gives {a} a hug." }, { by: 'a', dr: "A hug isn't a promise. But it's a lot better than nothing." }] },
    { id: 'pl2.h2', turns: [{ by: 'a', say: "You know what I'd do if it was the other way round." }, { by: 'b', say: "I know." }, { by: 'a', say: "I'd pull you off the block without even thinking about it." }, { by: 'b', say: "I know. You don't have to keep saying it." }, { by: 'a', say: "Sorry. I'm just scared." }, { by: 'b', dr: "I do know what {a} would do. That's the problem I've been thinking about all afternoon. If I use it, somebody else goes up, and that somebody is going to blame me." }] },
    { id: 'pl2.h3', turns: [{ by: 'a', say: "I'm not going to beg. Just think about it, okay?" }, { by: 'b', say: "I am thinking about it. I've thought about nothing else since the ceremony." }, { by: 'a', say: "And?" }, { by: 'b', say: "And I'm not ready to say anything yet." }, { by: 'a', say: "That's fair." }, { by: 'a', dr: "It isn't fair. I want an answer now. But you can't push {b}. Push {b} and {b} just digs in." }] },
    { id: 'pl2.h4', turns: [{ by: 'a', say: "We've been close since the start. I hope that counts." }, { by: 'b', say: "It counts." }, { by: 'a', say: "Enough?" }, { by: 'b', say: "...I'll tell you at the meeting." }, { by: 'a', say: "That's days away." }, { by: 'b', say: "I know. I'm sorry. I don't want to promise something and then not do it." }, { by: 'a', dr: "That's the most honest answer anyone's given me in here. I hate it." }] },
    { id: 'pl2.h5', turns: [{ beat: "{a} sits down next to {b}. Neither of them says anything for a while." }, { by: 'a', say: "Are you going to make me ask?" }, { by: 'b', say: "No. I know what you're going to ask." }, { by: 'a', say: "So?" }, { by: 'b', say: "So give me tonight. Please." }, { by: 'b', dr: "{a} is one of my closest friends in here. That's why this is so hard. Saving a friend is easy. Choosing who goes up instead isn't." }] },
    { id: 'pl2.h6', turns: [{ by: 'a', say: "Just tell me I'm not wasting my time." }, { by: 'b', say: "You're not wasting your time." }, { by: 'a', say: "Okay. That's all I needed." }, { by: 'b', say: "Is it?" }, { by: 'a', say: "No. But I'll take it." }, { by: 'a', dr: "That's not a yes. But it's close. I might actually sleep tonight." }] },
    { id: 'pl2.h7', turns: [{ by: 'a', say: "I trust you. Whatever you decide." }, { by: 'b', say: "Don't say that. It makes it harder." }, { by: 'a', say: "Why?" }, { by: 'b', say: "Because if I don't use it, you'll still trust me, and I'll feel terrible." }, { by: 'a', say: "Then use it." }, { by: 'b', say: "...I walked straight into that." }, { by: 'b', dr: "{a} is good at this. Really good. I have to make sure our friendship isn't the only thing I'm thinking about." }] },
    { id: 'pl2.h8', turns: [{ by: 'b', say: "You don't even need to ask." }, { by: 'a', say: "I know. I'm asking anyway." }, { by: 'b', say: "Then ask." }, { by: 'a', say: "Will you use it on me?" }, { by: 'b', say: "I want to. I really do. I just need to know who goes up instead." }, { by: 'a', say: "And if it's someone you like?" }, { by: 'b', say: "Then I've got a bad night ahead of me." }, { by: 'a', dr: "\"I want to\" isn't \"I will\". But I believe {b} wants to. That counts for something." }] },
  ],
  'phase.lobby.pleading': [
    { id: 'pl2.p1', turns: [{ by: 'a', say: "I know we're not close. But I'd owe you." }, { by: 'b', say: "Owe me what, exactly?" }, { by: 'a', say: "Whatever you want. A vote. Safety, if I ever win HOH." }, { by: 'b', say: "I'll think about it." }, { by: 'a', say: "That's all I'm asking." }, { by: 'a', dr: "{b} said {b.sub}'d think about it. I could tell from the first sentence it wasn't going to work. But I couldn't just sit there and not try." }] },
    { id: 'pl2.p2', turns: [{ by: 'a', say: "I'm not asking you to like me. I'm asking you to save me." }, { by: 'b', say: "That's a big ask." }, { by: 'a', say: "I know. If you use it, I'm in your debt for the rest of the game." }, { by: 'b', say: "And if I don't?" }, { by: 'a', say: "Then I'll understand. I won't be happy. But I'll understand." }, { by: 'b', dr: "Saving somebody I barely know means putting up somebody I do know. {a} hasn't thought about that part." }] },
    { id: 'pl2.p3', turns: [{ beat: "{a} knocks on the door frame. It's the fourth time today." }, { by: 'a', say: "Sorry. Have you got a minute?" }, { by: 'b', say: "We talked an hour ago." }, { by: 'a', say: "I know. I thought of something I forgot to say." }, { by: 'b', say: "Go on, then." }, { by: 'b', dr: "The first time {a} came to find me was fine. The fourth time was too many. Being desperate doesn't make anyone want to save you." }] },
    { id: 'pl2.p4', turns: [{ by: 'a', say: "If you save me, I'll vote however you want for the rest of the game." }, { by: 'b', say: "That's a lot to promise." }, { by: 'a', say: "I mean it." }, { by: 'b', say: "I know you do. That's what worries me." }, { by: 'a', say: "Why does that worry you?" }, { by: 'b', say: "Because people who promise everything usually can't keep any of it." }, { by: 'a', dr: "I've got nothing to offer {b} except a promise. So I offered a really big one. It might have been too big." }] },
    { id: 'pl2.p5', turns: [{ by: 'a', say: "Can I be honest with you?" }, { by: 'b', say: "Please." }, { by: 'a', say: "I've got no deal to offer you. No alliance. Nothing." }, { by: 'b', say: "Then why should I use it on you?" }, { by: 'a', say: "Because I'd never forget it. And I'd never put you up." }, { by: 'b', say: "Never's a long time in here." }, { by: 'a', dr: "All I had to give {b} was a promise. I hope it was enough. I don't think it was." }] },
    { id: 'pl2.p6', turns: [{ by: 'a', say: "Can we talk about the veto?" }, { by: 'b', say: "We talked about it this morning." }, { by: 'a', say: "Can we talk about it again?" }, { by: 'b', say: "Nothing's changed since this morning." }, { by: 'a', say: "Something might have. You might have." }, { by: 'b', say: "...Five minutes." }, { by: 'b', dr: "Five minutes turned into forty. I haven't changed my mind. I'm just tired." }] },
    { id: 'pl2.p7', turns: [{ by: 'b', say: "Why should I use it on you?" }, { by: 'a', say: "Because I'd be loyal to you." }, { by: 'b', say: "You've never been loyal to me before." }, { by: 'a', say: "I've never had a reason to be. Nobody's ever saved me before." }, { by: 'b', say: "That's not a great argument." }, { by: 'a', say: "It's the only one I've got." }, { by: 'b', dr: "At least it was honest. I'll give {a} that." }] },
    { id: 'pl2.p8', turns: [{ by: 'a', say: "I'll be quick. I know you're not going to use it on me." }, { by: 'b', say: "I haven't decided." }, { by: 'a', say: "You have. It's okay. I just wanted to ask you to your face." }, { by: 'b', say: "Why?" }, { by: 'a', say: "So I don't spend the rest of the game wondering if I should have." }, { by: 'a', dr: "I know {b} isn't going to save me. I had to try. I'd hate myself if I didn't." }] },
  ],
  'phase.weighs.scene': [
    { id: 'pg2.1', turns: [{ by: 'b', say: "Have you decided?" }, { by: 'a', say: "Not yet." }, { by: 'b', say: "The meeting's tomorrow." }, { by: 'a', say: "I know when the meeting is." }, { by: 'b', say: "I'm just asking." }, { by: 'a', dr: "I'm the only person this week with a completely free choice. Everyone keeps reminding me. I hate it." }] },
    { id: 'pg2.2', turns: [{ by: 'a', say: "Can I ask what happens if I use it?" }, { by: 'b', say: "You know what happens. I name someone else." }, { by: 'a', say: "And whoever that is would be angry with me, not you." }, { by: 'b', say: "They'd be angry with both of us." }, { by: 'a', say: "They'd be angrier with me." }, { by: 'a', dr: "If I use it, {b} is annoyed with me. If I don't, whoever stays up there is angry with me. There's no good option." }] },
    { id: 'pg2.3', turns: [{ by: 'a', say: "What happens if I use it?" }, { by: 'b', say: "Then I name a replacement." }, { by: 'a', say: "Who?" }, { by: 'b', say: "You don't need to worry about that." }, { by: 'a', say: "That's why I'm asking. I'd like to know who I'm putting up." }, { by: 'b', say: "You wouldn't be putting anyone up. I would." }, { by: 'a', dr: "That's what {b} would say. It's not what the house would say." }] },
    { id: 'pg2.4', turns: [{ by: 'b', say: "What are you going to do?" }, { by: 'a', say: "Everyone keeps asking me that." }, { by: 'b', say: "Because everyone wants to know." }, { by: 'a', say: "Well, I'll tell everyone at the same time. At the meeting." }, { by: 'b', say: "You don't know yet, do you?" }, { by: 'a', say: "...No." }, { by: 'a', dr: "I don't know yet. I've been pretending I do, because when people think you've decided, they leave you alone." }] },
    { id: 'pg2.5', turns: [{ by: 'a', say: "Can I ask you something, {b}? Off the record?" }, { by: 'b', say: "Nothing's off the record in here." }, { by: 'a', say: "Fine. On the record, then. If I use it, do I go up next week?" }, { by: 'b', say: "Not because of that." }, { by: 'a', say: "So maybe because of something else." }, { by: 'b', say: "That's the best answer you'll get today." }, { by: 'a', dr: "A maybe from the HOH is worse than a no. At least you can plan around a no." }] },
    { id: 'pg2.6', turns: [{ by: 'b', say: "You've been quiet all day." }, { by: 'a', say: "I've been thinking." }, { by: 'b', say: "About the veto?" }, { by: 'a', say: "About the veto. I've changed my mind three times." }, { by: 'b', say: "And where are you now?" }, { by: 'a', say: "Ask me in an hour." }, { by: 'a', dr: "I've changed my mind about the veto three times today. I'll probably change it again tonight." }] },
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
    { id: 'pt2.l1', turns: [{ by: 'a', say: "I've wanted {c} gone since week one." }, { by: 'b', say: "Why?" }, { by: 'a', say: "Because {c} has been playing everyone from the start, and nobody's noticed." }, { by: 'b', say: "I've noticed some of it." }, { by: 'a', say: "Then you've noticed more than most. You're the first person I've said this to who can actually do something about it." }, { by: 'b', dr: "{a} has clearly been holding on to that for a long time. I'm going to listen. I'm also going to remember how long {a} kept quiet about it." }] },
    { id: 'pt2.l2', turns: [{ beat: "{a} closes the door and sits down on the end of the bed." }, { by: 'a', say: "I'm going to say a name, and I want you to really think about it." }, { by: 'b', say: "Okay." }, { by: 'a', say: "{c}." }, { by: 'b', say: "That's not the first time I've heard it." }, { by: 'a', say: "It's the first time from me. And I've been waiting a long time to say it." }, { by: 'a', dr: "I've been waiting weeks for someone with power to come after {c}. Now {b} has the keys." }] },
    { id: 'pt2.l3', turns: [{ by: 'a', say: "You don't owe me anything. But if you're looking at {c}, so am I. I have been for a while." }, { by: 'b', say: "How long's a while?" }, { by: 'a', say: "Long enough that I've stopped believing a word {c} says." }, { by: 'b', say: "What did {c} do?" }, { by: 'a', say: "Nothing I can prove. That's the problem with {c}. Nothing ever sticks." }, { by: 'b', dr: "\"Nothing I can prove.\" I've heard that before. But {a} isn't wrong about {c}." }] },
    { id: 'pt2.l4', turns: [{ by: 'b', say: "Why do you hate {c} so much?" }, { by: 'a', say: "I don't hate {c}. I just don't trust {c}. I never have." }, { by: 'b', say: "That's not a reason to put someone on the block." }, { by: 'a', say: "Isn't it? It's the reason everyone goes up." }, { by: 'b', say: "...Fair point." }, { by: 'a', dr: "I don't need {b} to hate {c}. I just need {b} to stop trusting {c}. That's a much smaller ask." }] },
    { id: 'pt2.l6', turns: [{ by: 'a', say: "I'll be honest. I've never liked how {c} plays." }, { by: 'b', say: "Since when?" }, { by: 'a', say: "Since the first week. I've just been waiting for the right person to tell." }, { by: 'b', say: "So why tell me?" }, { by: 'a', say: "Because you're the first HOH I'd trust to actually do something about it." }, { by: 'b', dr: "That was flattery. It was also probably true." }] },
    { id: 'pt2.l7', turns: [{ by: 'a', say: "Can I tell you something about {c}?" }, { by: 'b', say: "Is this going to take long?" }, { by: 'a', say: "It's taken me weeks to work out. I'll keep it short." }, { beat: "{a} talks for twenty minutes." }, { by: 'b', say: "That was a lot of weeks." }, { by: 'b', dr: "{a} has clearly had {c} in mind for a long time. That's either useful, or a reason to be careful with {a}." }] },
    { id: 'pt2.l5', turns: [{ by: 'b', say: "Who do you think is the biggest threat in here?" }, { by: 'a', say: "Honestly?" }, { by: 'b', say: "That's why I'm asking." }, { by: 'a', say: "{c}. It's been {c} from the start." }, { by: 'b', say: "You never said." }, { by: 'a', say: "You never had the power to do anything about it." }, { by: 'a', dr: "I've known {c} is dangerous since the start. This was my chance to say it to the right person." }] },
  ],
  'phase.targets.new': [
    { id: 'pt2.n1', turns: [{ by: 'a', say: "{c} would put you up next week. I'd bet on it." }, { by: 'b', say: "How do you know?" }, { by: 'a', say: "{c} has been asking about you all week." }, { by: 'b', say: "Asking what?" }, { by: 'a', say: "Who you're close to. Who you'd put up. The things you ask when you're planning something." }, { by: 'b', dr: "I can't tell if {a} is looking out for me or pointing me somewhere convenient." }] },
    { id: 'pt2.n2', turns: [
      { by: 'a', say: "A few people have told me they're worried about {c}." },
      { by: 'b', say: "Who?" },
      { by: 'a', say: "I can't say. They told me in private." },
      { by: 'b', say: "So it's you.", v: { soft: "Is it really other people, or is it you?", hard: "It's you. Just say it's you." } },
      { by: 'a', say: "It's not just me. Just think about it." },
      { by: 'b', dr: "When somebody says 'a few people', it usually means them. I'll still think about {c}, though." }] },
    { id: 'pt2.n3', turns: [{ by: 'a', say: "If you're thinking about {c}, I'm with you." }, { by: 'b', say: "I didn't say I was." }, { by: 'a', say: "I'm just saying. If you are." }, { by: 'b', say: "And if I'm not?" }, { by: 'a', say: "Then forget I said anything." }, { by: 'b', say: "I can't forget it now. That's the point, isn't it?" }, { by: 'a', dr: "I didn't need {b} to agree out loud. I just needed the name in {b}'s head." }] },
    { id: 'pt2.n4', turns: [{ by: 'a', say: "Has {c} said anything to you this week?" }, { by: 'b', say: "Not much. Why?" }, { by: 'a', say: "That's what worries me. {c} has gone very quiet." }, { by: 'b', say: "Quiet isn't a crime." }, { by: 'a', say: "In here it usually means a plan." }, { by: 'a', dr: "I only started worrying about {c} this week. But now I've started, I can't stop." }] },
    { id: 'pt2.n6', turns: [{ by: 'a', say: "Can I give you a name to think about?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "{c}. Just think about it. That's all." }, { by: 'b', say: "Why {c}?" }, { by: 'a', say: "Because nobody's thinking about {c}. That's exactly how people get to the end." }, { by: 'b', dr: "It's not a bad argument. I just wish I knew why {a} came up here to make it." }] },
    { id: 'pt2.n7', turns: [{ by: 'a', say: "I don't want to tell you who to put up." }, { by: 'b', say: "But you're going to." }, { by: 'a', say: "I'm going to tell you who I'd worry about. {c}." }, { by: 'b', say: "Okay. Noted." }, { by: 'a', say: "That's it? Noted?" }, { by: 'b', say: "That's what you get today." }, { by: 'a', dr: "I don't know if {b} will listen. But {c} is a problem, and somebody had to say it to the HOH." }] },
    { id: 'pt2.n5', turns: [
      { by: 'a', say: "Can I say something about {c}? I think {c} is dangerous.", v: { hard: "You need to look at {c}. I'm serious.", soft: "I don't want to tell you what to do. I'm just worried about {c}." } },
      { by: 'b', say: "Why {c}? {c} hasn't done anything to me." },
      { by: 'a', say: "Not yet. {c} talks to everybody, and {c} doesn't owe you anything." },
      { by: 'b', say: "Okay. I'll think about it." },
      { by: 'b', dr: "{a} came up here just to talk about {c}. Maybe {a} is right. But I want to know why {a} wants {c} gone so badly." }] },
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
    { id: 'pd2.1', turns: [{ beat: "{a} and {b} end up alone together for the first time since the nominations." }, { by: 'b', say: "This is awkward." }, { by: 'a', say: "It doesn't have to be." }, { by: 'b', say: "People are being really nice to you this week." }, { by: 'a', say: "They're being nice to both of us." }, { by: 'b', say: "Not the same kind of nice." }, { by: 'a', dr: "Nobody's told me how they're voting. But I can tell. People are being nicer to {b} than to me, and {b} has noticed too." }] },
    { id: 'pd2.2', turns: [{ by: 'a', say: "Can I ask you a weird question?" }, { by: 'b', say: "Sure." }, { by: 'a', say: "Has anyone told you how they're voting?" }, { by: 'b', say: "No. You?" }, { by: 'a', say: "No. But people keep bringing me cups of tea." }, { by: 'b', say: "People keep sitting next to me." }, { by: 'b', dr: "The house has already split. Half of them keep bringing {a} tea. The other half keep finding reasons to sit with me." }] },
    { id: 'pd2.3', turns: [{ by: 'b', say: "How are you holding up?" }, { by: 'a', say: "I've been reading every look anyone gives me." }, { by: 'b', say: "Me too. It's exhausting." }, { by: 'a', say: "Did you see how quiet it went at dinner?" }, { by: 'b', say: "I thought that was about you." }, { by: 'a', say: "I thought it was about you." }, { by: 'a', dr: "It's too early for anyone to say how they're voting. So we're both reading every look, and getting them wrong." }] },
    { id: 'pd2.4', turns: [{ beat: "At breakfast, the same people sit together as always. Nobody mentions the vote." }, { by: 'a', say: "You saw that, right?" }, { by: 'b', say: "Who's sitting where? Yeah." }, { by: 'a', say: "It doesn't have to mean anything." }, { by: 'b', say: "It always means something." }, { by: 'b', dr: "Nobody has to say it. I can see who's sitting where." }] },
    { id: 'pd2.5', turns: [{ by: 'a', say: "{b}, can I ask you something?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "Do you think it's me or you?" }, { by: 'b', say: "I honestly don't know." }, { by: 'a', say: "Me neither. Can I ask you not to campaign against me?" }, { by: 'b', say: "I'll campaign for me. I won't campaign against you." }, { by: 'a', dr: "That's a fair deal. I'll believe it when I see it." }] },
    { id: 'pd2.6', turns: [{ by: 'b', say: "No hard feelings, whatever happens." }, { by: 'a', say: "No hard feelings." }, { by: 'b', say: "I mean it. I'm not going to trash you to anybody." }, { by: 'a', say: "Same." }, { by: 'a', dr: "That's easy to say this early in the week. Ask us again the night before the vote." }] },
    { id: 'pd2.7', turns: [{ by: 'a', say: "Mind if I sit here?" }, { by: 'b', say: "Go ahead." }, { by: 'a', say: "Thanks." }, { by: 'b', say: "This is weird, isn't it?" }, { by: 'a', say: "Being nice to each other?" }, { by: 'b', say: "Being nice to each other when only one of us is staying." }, { by: 'a', dr: "{b} and I are on the block together. We're being polite. We both know only one of us is staying." }] },
    { id: 'pd2.8', turns: [{ by: 'a', say: "You're going to be fine. People like you." }, { by: 'b', say: "People like you more." }, { by: 'a', say: "That's not true." }, { by: 'b', say: "It is. I've been watching who people sit with at dinner." }, { by: 'b', dr: "{a} has more friends in here than me. I'm going to have to work really hard this week." }] },
    { id: 'pd2.9', turns: [{ by: 'a', say: "Good luck this week." }, { by: 'b', say: "You too. I mean it." }, { by: 'a', say: "Do you?" }, { by: 'b', say: "...Mostly." }, { by: 'a', say: "Mostly is fine. Mostly is more than I'd get from anyone else." }, { by: 'a', dr: "\"Mostly.\" That's about as honest as it gets on the block." }] },
  ],
  'phase.leaned.heavy': [
    { id: 'pk2.h1', turns: [{ by: 'a', say: "It's your veto. Obviously." }, { by: 'b', say: "Obviously." }, { by: 'a', say: "I'm just saying, think about next week." }, { by: 'b', say: "What about next week?" }, { by: 'a', say: "Next week you'll want friends. That's all." }, { by: 'b', dr: "That wasn't advice. That was a warning." }] },
    { id: 'pk2.h2', turns: [{ by: 'a', say: "Remember who isn't on the block this week. And why." }, { by: 'b', say: "I remember." }, { by: 'a', say: "Good." }, { by: 'b', say: "Is that all you called me up here for?" }, { by: 'a', say: "That's all I needed to say." }, { by: 'b', dr: "I didn't win this veto to do what {a} tells me. But I heard it. Anyone would have heard it." }] },
    { id: 'pk2.h3', turns: [{ by: 'a', say: "If you use it, I'll have to put someone else up. Someone you like, probably." }, { by: 'b', say: "Is that a threat?" }, { by: 'a', say: "It's just how it works." }, { by: 'b', say: "Who?" }, { by: 'a', say: "I haven't decided. I'd rather not have to." }, { by: 'b', dr: "So if I use it, somebody I like goes up, and {a} makes sure everyone knows it was my fault." }] },
    { id: 'pk2.h4', turns: [{ by: 'a', say: "How are you feeling about the veto?" }, { by: 'b', say: "Fine. Still thinking." }, { by: 'a', say: "Think about who's had your back this week." }, { by: 'b', say: "You have." }, { by: 'a', say: "I have. And I'd like to keep having it." }, { by: 'b', dr: "{a} didn't ask me to keep the nominations. {a} just explained what happens to people who make {a.posAdj} week difficult." }] },
    { id: 'pk2.h5', turns: [{ by: 'a', say: "I'd really like the nominations to stay the same." }, { by: 'b', say: "I know." }, { by: 'a', say: "I'd remember it if they did." }, { by: 'b', say: "And if they didn't?" }, { by: 'a', say: "I'd remember that too." }, { by: 'b', dr: "Either way, {a} remembers. That doesn't leave me much of a choice." }] },
    { id: 'pk2.h6', turns: [{ by: 'a', say: "Shut the door, would you?" }, { beat: "{b} shuts the door." }, { by: 'a', say: "I'm not going to tell you what to do with the veto." }, { by: 'b', say: "But?" }, { by: 'a', say: "But if you use it, I lose a nominee I picked for a reason. And I have to pick a new one." }, { by: 'b', say: "I understand." }, { by: 'a', say: "I hope so." }, { by: 'b', dr: "I came out of that conversation knowing exactly what using the veto would cost me." }] },
  ],
  'phase.leaned.straight': [
    { id: 'pk2.s1', turns: [{ by: 'a', say: "I'd like you not to use it. But it's your call." }, { by: 'b', say: "Do you really mean that?" }, { by: 'a', say: "I do." }, { by: 'b', say: "Even if I use it on somebody you want gone?" }, { by: 'a', say: "Even then. I'd be annoyed. I'd get over it." }, { by: 'b', dr: "I didn't expect that from an HOH. I believe {a}. Mostly." }] },
    { id: 'pk2.s2', turns: [{ by: 'a', say: "Use it if you need to. I'd rather you were honest with me." }, { by: 'b', say: "Are you sure? Most HOHs would be leaning on me right now." }, { by: 'a', say: "Just tell me before the meeting. Don't let me find out in front of everyone." }, { by: 'b', say: "That's fair. I'll tell you first." }, { by: 'b', dr: "{a} meant that. It made me trust {a} more." }] },
    { id: 'pk2.s3', turns: [{ by: 'a', say: "I'm not going to pressure you." }, { by: 'b', say: "Thank you." }, { by: 'a', say: "I just wanted you to know what I'm hoping for." }, { by: 'b', say: "Which is?" }, { by: 'a', say: "That nothing changes. But if it does, it does." }, { by: 'b', dr: "{a} didn't push me. Which, weirdly, makes me want to do what {a} wants." }] },
    { id: 'pk2.s4', turns: [{ by: 'a', say: "I'll say it once and then I'll leave it alone. I'd like the nominations to stay the same." }, { by: 'b', say: "Okay." }, { by: 'a', say: "That's it. That's all I'm going to say." }, { by: 'b', say: "Really?" }, { by: 'a', say: "Really. It's your veto. You won it." }, { by: 'a', dr: "I told {b} what I want and then I left it. It's {b}'s decision. I'm not going to push." }] },
    { id: 'pk2.s5', turns: [{ by: 'a', say: "Sorry, I shouldn't even be asking." }, { by: 'b', say: "It's fine. I'd ask too." }, { by: 'a', say: "Would you?" }, { by: 'b', say: "Of course. Your whole week depends on it." }, { by: 'a', say: "So does the week of everyone on the block." }, { by: 'b', dr: "{a} could have leaned on me and didn't. I won't forget that." }] },
    { id: 'pk2.s6', turns: [{ by: 'a', say: "Can I tell you what I'm hoping for?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "I'm hoping it stays the same. But I'm not going to pressure you." }, { by: 'b', say: "Thanks. Everyone else has." }, { by: 'a', say: "I bet. Sorry." }, { by: 'b', dr: "{a} asked me nicely and didn't push. Now I feel like I owe {a} something." }] },
  ],
  // a backdoor week: the empty chair is the whole plan, so the HOH wants the veto used
  'phase.leaned.backdoor': [
    { id: 'pk2.b1', when: { intent: 'told', third: true }, turns: [{ beat: "HOH room. {a} locks the door before saying a word." }, { by: 'a', say: "Use it." }, { by: 'b', say: "Sorry?" }, { by: 'a', say: "The veto. I want you to use it. Take somebody down, I don't mind who." }, { by: 'b', say: "Why would the HOH want their own nominations broken up?" }, { by: 'a', say: "Because then I need a replacement. And the replacement is {c}." }, { by: 'b', say: "...{c} has no idea." }, { by: 'a', say: "{c} isn't supposed to." }, { by: 'b', dr: "So the whole week was built for one empty chair, and I'm the one holding the key to it. {a} trusted me with that. I hope I don't regret knowing it." }] },
    { id: 'pk2.b2', when: { intent: 'told', third: true }, turns: [{ by: 'b', say: "Go on, then. Lean on me. Everybody else has." }, { by: 'a', say: "I'm not going to lean on you. I'm going to ask you to use it." }, { by: 'b', say: "You want it used?" }, { by: 'a', say: "I need it used. {c} goes up in the empty chair, and there's no veto left to save {c}." }, { by: 'b', say: "That's cold." }, { by: 'a', say: "That's a backdoor. Are you in?" }, { by: 'b', say: "...I'm in." }, { by: 'a', dr: "If {b} keeps the nominations the same, my whole week falls apart. So I told {b} everything. That's a risk. Not telling {b} was a bigger one." }] },
    { id: 'pk2.b3', when: { intent: 'told', third: true }, turns: [{ beat: "HOH room. {a} hands {b} a drink and sits down on the bed." }, { by: 'a', say: "You're going to use it on Monday." }, { by: 'b', say: "Am I?" }, { by: 'a', say: "On whoever you like. Then I name {c}." }, { by: 'b', say: "{c} thinks this is a safe week." }, { by: 'a', say: "Everybody who gets backdoored thinks they're safe. That's how it works." }, { by: 'b', dr: "I came up here expecting to be told to keep the nominations the same. Instead {a} asked me to blow them up, on purpose. I didn't see that coming, and neither will {c}." }] },
    { id: 'pk2.b4', turns: [{ by: 'b', say: "So. The veto." }, { by: 'a', say: "Do what you want with it." }, { by: 'b', say: "Really? Every HOH wants the nominations to stay the same." }, { by: 'a', say: "Not this one. If you want to use it, use it. I'll be fine." }, { by: 'b', say: "You'd have to name a replacement." }, { by: 'a', say: "I know." }, { by: 'b', dr: "{a} didn't care at all whether I used the veto. An HOH who doesn't care about the veto already knows who goes up next." }] },
    { id: 'pk2.b5', turns: [{ by: 'a', say: "I'm not going to tell you what to do with the veto." }, { by: 'b', say: "That's a first." }, { by: 'a', say: "If you use it, you use it. I'd understand." }, { by: 'b', say: "You'd understand. You wouldn't be upset?" }, { by: 'a', say: "Not even a little." }, { by: 'b', say: "Huh." }, { by: 'b', dr: "{a} practically held the door open for me to use it. Nobody holds a door open unless they want you to walk through it. Somebody's going up in that empty chair, and {a} already knows who." }] },
    { id: 'pk2.b6', turns: [{ beat: "{a} catches {b} on the stairs." }, { by: 'a', say: "About the veto. You don't owe me anything." }, { by: 'b', say: "Meaning?" }, { by: 'a', say: "Meaning if you want to take somebody down, go for it. I won't hold it against you." }, { by: 'b', say: "That's very generous." }, { by: 'a', say: "I'm a generous person." }, { by: 'a', dr: "I need that veto used. If I beg, {b} works out why. So I made it sound like I don't care either way, which is the opposite of the truth." }] },
  ],
  'phase.chair.scene': [
    { id: 'pc2.1', turns: [{ by: 'a', say: "Can I ask you something straight?" }, { by: 'b', say: "Sure." }, { by: 'a', say: "If the veto gets used, who goes up?" }, { by: 'b', say: "I'm not going to talk about that before the meeting." }, { by: 'a', say: "Not even to say it isn't me?" }, { by: 'b', say: "Not even that." }, { by: 'a', dr: "I've gone back over every conversation I've had with {b}. Not one promise of safety. Not one." }] },
    { id: 'pc2.2', turns: [{ by: 'a', say: "Can I make you breakfast?" }, { by: 'b', say: "...Sure." }, { by: 'a', say: "Eggs? I can do eggs." }, { by: 'b', say: "Eggs are fine." }, { by: 'a', say: "So how are you feeling about the veto meeting?" }, { by: 'b', say: "There it is." }, { by: 'b', dr: "{a} has never made me breakfast before. I know what this is." }] },
    { id: 'pc2.3', turns: [{ by: 'a', say: "Am I safe if the veto gets used?" }, { by: 'b', say: "Let's not talk about that yet." }, { by: 'a', say: "When can we talk about it?" }, { by: 'b', say: "After the meeting." }, { by: 'a', say: "After the meeting, it's too late." }, { by: 'b', say: "I know." }, { by: 'a', dr: "That's not a yes. And \"I know\" is even worse." }] },
    { id: 'pc2.4', turns: [{ by: 'b', say: "You okay? You've been quiet." }, { by: 'a', say: "I'm fine. Just tired." }, { by: 'b', say: "You know you can talk to me." }, { by: 'a', say: "I know." }, { beat: "{a} doesn't." }, { by: 'a', dr: "I really hope the veto doesn't get used. I can't say that to {b} without {b} asking why." }] },
    { id: 'pc2.5', turns: [{ beat: "{a} walks in on {b} in the middle of a conversation. {b} changes the subject straight away." }, { by: 'a', say: "Sorry. Am I interrupting?" }, { by: 'b', say: "No, no. We were just talking about dinner." }, { by: 'a', say: "Dinner." }, { by: 'b', say: "Dinner." }, { by: 'a', dr: "The second I walked in, the conversation stopped. Nobody goes quiet like that about dinner." }] },
    { id: 'pc2.6', turns: [{ by: 'a', say: "If you need a replacement, it's not going to be me, is it?" }, { by: 'b', say: "I haven't decided anything." }, { by: 'a', say: "That's not a no." }, { by: 'b', say: "It's not a yes either." }, { by: 'a', say: "So I should be worried." }, { by: 'b', say: "Everybody off the block should be a bit worried. That's how it works." }, { by: 'a', dr: "A bit worried. I'm a lot worried." }] },
    { id: 'pc2.7', turns: [{ by: 'a', say: "Who's the replacement going to be? If it happens?" }, { by: 'b', say: "Why does everyone keep asking me that?" }, { by: 'a', say: "Because there's an empty chair, and everyone's scared it's theirs." }, { by: 'b', say: "It might not get used." }, { by: 'a', say: "It might." }, { by: 'a', dr: "There's an empty chair waiting if the veto gets used. I've got a horrible feeling it's got my name on it." }] },
    { id: 'pc2.8', turns: [{ by: 'a', say: "Do you need help with anything? Cleaning? Anything?" }, { by: 'b', say: "I'm fine, thanks." }, { by: 'a', say: "Laundry? I'm good at laundry." }, { by: 'b', say: "You're the third person to offer me laundry today." }, { by: 'a', say: "...Oh." }, { by: 'b', dr: "Everyone who's scared of being the replacement is suddenly very helpful." }] },
    { id: 'pc2.9', turns: [
      { by: 'a', say: "Has anyone said my name? For the block?" },
      { by: 'b', say: "No. Nobody's said anything about you." },
      { by: 'a', say: "Nobody at all?" },
      { by: 'b', say: "Nobody. Are you worried?" },
      { by: 'a', say: "A little.", v: { anxious: "Yes. I can't stop thinking about it." } },
      { by: 'a', dr: "Nobody has said my name, and that scares me more. Nobody would, until it was too late." }] },
    { id: 'pc2.10', turns: [{ by: 'a', say: "Whatever happens with the veto, we're good, right?" }, { by: 'b', say: "We'll see what happens." }, { by: 'a', say: "That's not very reassuring." }, { by: 'b', say: "It's not meant to be anything. I just don't know yet." }, { by: 'a', dr: "\"We'll see what happens.\" That's what you say to somebody right before you put them up." }] },
  ],
};
