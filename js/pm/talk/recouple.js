// ══════════════════════════════════════════════════════════════════════
// pm/talk/recouple.js — {a} stands up at the recoupling and picks {b}
// ══════════════════════════════════════════════════════════════════════
//
// How the show does it: the islander stands, talks about this person without
// saying who, then gives the name, and the fire pit reacts. Why {a} picks {b}
// is the engine's (`reason`: connection · attraction · safety · loyalty — a
// safety pick never claims a spark). `stoleFrom`: {b} was {c}'s, and {a} took
// {b}; `reclaim`: {a} is taking back {a.posAdj} own partner. `justMet`: one of
// them walked in today. A ceremony: always shown whole (`tiered: false`).
//   stand     {a} gets up
//   speech    why — the long turn, never the name
//   name      the name, and the gap before it
//   react     {b}, and the fire pit
import { build } from './build.js';

const GIRL = { bGender: 'f' };
const BOY = { bGender: 'm' };

export const RECOUPLE_PICK = build('recouple-pick', {
  tiered: false,
  plans: {
    featured: ['stand?', 'speech', 'name', 'react'],
    short: ['speech', 'name', 'react'],
  },
  moves: {
    stand: [
      { turns: [], beat: "{a} stands up, smooths {a.posAdj} outfit down, and takes a long breath." },
      { turns: [], beat: "{a} gets up, and the whole fire pit goes quiet." },
      { turns: [['a', "Right. Okay. Here goes."]], beat: "{a} stands up, hands shaking a little." },
      { turns: [], beat: "{a} stands, looks along the benches, and smiles at someone." },
      // Still on {a.posAdj} feet from the no a minute ago (afterNo): nobody stands up twice.
      { when: { afterNo: true }, turns: [], beat: "{a} is still standing. {a} takes a breath and looks along the benches again." },
      { when: { afterNo: true }, turns: [['a', "Give me a second."]], beat: "Nobody on the benches says a word." },
    ],

    speech: [
      // connection
      { when: { reason: 'connection' }, turns: [
        ['a', "The person I want to couple up with tonight is someone I can be completely myself around. From the first {~proper} chat we had, it was easy. We can talk about anything, we can sit in silence, and I've never once had to pretend to be someone I'm not."],
      ] },
      { when: { reason: 'connection', known: true }, turns: [
        ['a', "We've had our ups and downs in here, I'm not going to lie. There have been days where I didn't know where I stood. But every single time, we've talked it through, and every time I've come out the other side liking this person a bit more than before."],
      ] },
      { when: { reason: 'connection' }, turns: [
        ['a', "This person is the first one I want to talk to in the morning and the last one I want to see before I go to sleep. They make me laugh when I'm having a rubbish day, and they always know when something's wrong, even when I'm pretending it isn't."],
      ] },
      { when: { reason: 'connection' }, turns: [
        ['a', "I came in here not really knowing what I wanted. And then I met someone who just got me, straight away, without me having to explain anything. That doesn't happen very often, and I'm not going to let it go."],
      ] },
      { when: { reason: 'connection', rung: ['exclusive', 'official'] }, turns: [
        ['a', "I don't think I need to say very much, because everyone in this villa already knows. This person has had my heart for a while now, and nothing that's happened in here has changed that. If anything, it's made it stronger."],
      ] },
      { when: { reason: 'connection', reg: 'soft' }, turns: [
        ['a', "I'm going to try not to cry, but I'm not promising anything. This person has looked after me since I walked in. On the days I've been homesick, on the days I've been in my head, they've been there. I don't think they realise how much that's meant to me."],
      ] },
      { when: { reason: 'connection', reg: 'big' }, turns: [
        ['a', "Okay, so, the person I'm picking tonight is my favourite person in this whole villa, and I'm not even sorry to everyone else. We have the best time. We laugh about absolutely nothing. I'd pick this person a hundred times over."],
      ] },
      { when: { reason: 'connection', reg: 'dry' }, turns: [
        ['a', "I'm not very good at speeches, so I'll keep it short. The person I'm picking is the only one in here who laughs at my jokes. Including the bad ones. Especially the bad ones. That's rare, and I'm hanging on to it."],
      ] },
      { when: { reason: 'connection', reg: 'sharp' }, turns: [
        ['a', "I don't do soppy, so I'll just say it straight. The person I'm picking has been honest with me from day one, and in here that's worth more than anything. I trust them, and I don't trust many people."],
      ] },
      { when: { reason: 'connection', feels: 'strong' }, turns: [
        ['a', "I've been thinking about what to say all day, and everything I came up with sounded cheesy. So I'm just going to say it. I'm falling for this person. I didn't think it would happen this fast, and I didn't think it would happen in here, but it has."],
      ] },
      // attraction
      { when: { reason: 'attraction' }, turns: [
        ['a', "I'll be honest. The person I'm picking tonight caught my eye the second I saw them, and I haven't been able to stop looking since. We haven't had loads of deep chats yet, but there's something there, and I want to see where it goes."],
      ] },
      { when: { reason: 'attraction' }, turns: [
        ['a', "I'm going with my gut tonight. There's someone in this villa who gives me butterflies every time they walk past, and I'd be stupid to ignore that. I don't know where it'll go, but I want to find out."],
      ] },
      { when: { reason: 'attraction', reg: 'flirty' }, turns: [
        ['a', "The person I'm picking knows exactly who they are, because I haven't exactly been subtle. Every time we're in the same room, I forget what I'm saying. I think there's a real spark there, and I'm not going to sit on the bench and pretend I don't feel it."],
      ] },
      { when: { reason: 'attraction', early: true }, turns: [
        ['a', "It's early days, and I know that. But I've had one or two chats with this person, and they've stuck with me. I keep thinking about them after we've finished talking, and that's never a bad sign."],
      ] },
      { when: { reason: 'attraction', reg: 'nervy' }, turns: [
        ['a', "I'm so nervous, sorry. Okay. The person I'm picking is someone I really, really like, and I've been too scared to say it properly until now. So I'm saying it in front of everyone, which is probably the worst way to do it, but here we are."],
      ] },
      { when: { reason: 'attraction', reg: 'big' }, turns: [
        ['a', "I'm going to be honest, I've had my eye on this person since the very first day. Everyone knows. I've told everyone. I've told the kettle. So tonight I'm finally doing something about it."],
      ] },
      // safety
      { when: { reason: 'safety' }, turns: [
        ['a', "I'm going to be honest, because I think I owe it to this person. We haven't had that massive spark yet. But they've been nothing but kind to me since I walked in, and I would much rather build on something real than chase something that isn't there."],
      ] },
      { when: { reason: 'safety' }, turns: [
        ['a', "The person I'm picking is someone I trust. In here, that counts for a lot. We get on really well, we have a laugh, and I think, given a bit of time, it could turn into something more. I want to give it that time."],
      ] },
      { when: { reason: 'safety' }, turns: [
        ['a', "This person has been a really good friend to me in here. Probably one of my best friends. I don't know yet if it's anything more than that, but I'd like to find out, and I know I'll be looked after while I do."],
      ] },
      { when: { reason: 'safety', persona: 'game-player' }, turns: [
        ['a', "I think this person and I understand each other. We both know what we want out of this, and we both know how this place works. I think we'd be good together, and I think we'd look after each other."],
      ] },
      { when: { reason: 'safety', reg: 'dry' }, turns: [
        ['a', "I'm not going to stand here and pretend it's been fireworks, because everyone would know I was lying. But this person is the easiest person to be around in this villa, and right now, that's exactly what I need."],
      ] },
      // loyalty
      { when: { reason: 'loyalty' }, turns: [
        ['a', "I don't need to think about this one. People have tried to turn my head since the last recoupling, and it hasn't worked. I'm staying exactly where I am, because I'm happy where I am."],
      ] },
      { when: { reason: 'loyalty' }, turns: [
        ['a', "I said I'd stick by this person, and I meant it. Nothing that's happened in here has changed how I feel. If anything, it's made me more sure. So I'm not going to stand here and make a long speech, because everyone knows who it is."],
      ] },
      { when: { reason: 'loyalty', known: true }, turns: [
        ['a', "We've been through a lot, me and this person. Bombshells, fights, the lot. And every time, we've come back to each other. I'm not going anywhere, and I'm hoping they're not either."],
      ] },
      { when: { reason: 'loyalty', reg: 'soft' }, turns: [
        ['a', "This person makes me feel safe. Every night, no matter what's gone on in the day, I get to go to bed next to them, and everything's okay again. I'm not giving that up for anyone."],
      ] },
      // What the pick answers, from the stretch's stories (moments.js `cites`).
      // A plan said out loud today (threads.js pick-plan), and how it went.
      { when: { cites: 'plannedSteal' }, turns: [
        ['a', "I said earlier I'd do this, and I'm doing it. I know who I'm upsetting. I'd rather be honest about why than stand here pretending I fell head over heels since lunch."],
      ] },
      { when: { cites: 'plannedSteal' }, turns: [
        ['a', "I'm not going to dress this up. I've thought about it all day, and this is the pick that makes sense for me. Some people won't like it. That's fine."],
      ] },
      { when: { cites: 'plannedSafe' }, turns: [
        ['a', "I'm going to be honest about this pick, because everyone will work it out anyway. I'm picking someone I trust, and I'm picking them so I'm still here next week."],
      ] },
      { when: { cites: 'plannedSafe' }, turns: [
        ['a', "This isn't a fairytale. I know that, and so does the person I'm picking. We get on, we look after each other, and right now that's what I need."],
      ] },
      { when: { cites: 'plannedHeart' }, turns: [
        ['a', "I told one person today what I was going to do up here, and I've been shaking ever since. I've had my mind made up for days. I just needed to say it in front of everyone."],
      ] },
      { when: { cites: 'plannedHeart' }, turns: [
        ['a', "I've sat on this all day. I went over it with a friend this afternoon, and I came out of that chat knowing exactly who I'm standing up for. So here it is."],
      ] },
      { when: { cites: 'planChanged' }, turns: [
        ['a', "I came down here tonight meaning to do something completely different. I had it all worked out. Then I sat on that bench and looked across, and I couldn't do it."],
      ] },
      { when: { cites: 'planChanged' }, turns: [
        ['a', "Somebody on that bench knows what I said I was going to do today. I'm not doing it. Turns out I'm worse at playing this than I thought."],
      ] },
      // {b} said no to somebody else tonight, for {a}.
      { when: { cites: 'refusedFor' }, turns: [
        ['a', "Ten minutes ago, somebody stood up and asked for this person. In front of everyone. And they said no. For me. I've had a hard few days, and I'm not going to pretend I haven't. But I know where I stand now."],
      ] },
      { when: { cites: 'refusedFor' }, turns: [
        ['a', "I'll be honest, I wasn't sure about tonight. This week has been a lot. Then I watched this person say no to someone else, with the whole fire pit looking, and I didn't need to think any more."],
      ] },
      { when: { cites: 'refusedFor', feels: 'strong' }, turns: [
        ['a', "My hands are still shaking from what just happened. Somebody asked for the person I'm with, and they didn't even think about it. They just said no. So I'm not going to make them wait."],
      ] },
      // {b} was chased all stretch, and {a} is picking them
      { when: { cites: 'stoodBy' }, turns: [
        ['a', "Everyone in here has watched someone try it on with my partner this week. I've watched it too. It hasn't been easy. But I've also watched my partner come back to me every single time."],
      ] },
      { when: { cites: 'stoodBy' }, turns: [
        ['a', "It's been a hard few days. Somebody made it very clear what they wanted, and it wasn't me. But the person I'm with never once made me feel second. So I'm not going to make them feel second tonight."],
      ] },
      { when: { cites: 'stoodBy', feels: ['some', 'little'] }, turns: [
        ['a', "I'm not going to lie, I've wondered this week. I've watched somebody else go after my partner, and I've wondered if I was in the way. But I'm still here, and I'm going to find out properly."],
      ] },
      // {a} was chased all stretch, and is staying with {b}
      { when: { cites: 'heldOn' }, turns: [
        ['a', "I've had my head turned this week. I'm not going to stand here and lie about that. Somebody made their feelings very clear, and I listened. But I've thought about it every day, and every day I came back to the same person."],
      ] },
      { when: { cites: 'heldOn' }, turns: [
        ['a', "There's been a lot of noise around me this week. Chats I didn't ask for, people telling me what I should do. I'm going to ignore all of it and pick the person who's been sitting next to me through it."],
      ] },
      // {a} chased {b} all stretch
      { when: { cites: 'graftWon' }, turns: [
        ['a', "I've been chasing this person for days. Everyone's seen it. Some of you have told me to give up. I didn't, and I'm not starting tonight."],
      ] },
      { when: { cites: 'graftWon' }, turns: [
        ['a', "I said at the start of the week I was going to go for it, and I have. Every chat, every time I pulled them for five minutes. Tonight's the bit where I find out if it was worth it."],
      ] },
      // {a} has been going off {b}, and is picking them anyway
      { when: { cites: 'doubtStay' }, turns: [
        ['a', "I know I've been distant this week. Everyone's noticed, and the person I'm with has noticed most of all. I've done a lot of thinking, and I'm still choosing them, because I don't want to be the one who gives up."],
      ] },
      { when: { cites: 'doubtStay' }, turns: [
        ['a', "This week I haven't been the best partner. I went quiet, and I didn't explain why. That's not fair. So I'm standing up here to say it in front of everyone: I want to try again, properly."],
      ] },
      // {a} found out something about {b} this stretch, and is still picking them
      { when: { cites: 'told' }, turns: [
        ['a', "This week I found out something about this person that I didn't want to know. I've been angry. I'm still angry, a bit. But I'm not ready to throw it all away over one thing, so I'm giving them one more chance."],
      ] },
      { when: { cites: 'told' }, turns: [
        ['a', "I could stand up here and pick somebody else to make a point. Everyone knows what happened this week. But I don't want to make a point. I want to sort it out."],
      ] },
      // a steal
      { when: { stoleFrom: true, reclaim: false }, turns: [
        ['a', "I know this is going to cause drama, and I'm sorry for that, I really am. But I came in here to follow my heart, and if I don't do this tonight, I'll regret it for the rest of my life. The person I want is already coupled up, and I'm going to pick them anyway."],
      ] },
      { when: { stoleFrom: true, reclaim: false }, turns: [
        ['a', "I want to start by saying sorry to one person in particular, because they're not going to like this. But I've had a connection with someone in this villa for a while now, and I can't sit here and pretend I haven't. So I'm going to do something about it."],
      ] },
      { when: { stoleFrom: true, reclaim: false, justMet: true }, turns: [
        ['a', "I know I've only just walked in, and I know everyone's coupled up. But I've had a chat today that I can't stop thinking about, and I'd be lying to myself if I didn't take my chance tonight."],
      ] },
      { when: { reclaim: true }, turns: [
        ['a', "Someone tried to take the person I'm with away from me tonight. I'm not having that. I'm not losing them over one recoupling, so I'm taking them back."],
      ] },
      // {b}'s partner {c} is on the bench, still to choose (moments.js tookFrom):
      // said to the fire pit for what it is. {c} can still take {b} back.
      { when: { tookFrom: true, reason: ['connection', 'attraction'] }, turns: [
        ['a', "I know this is going to hurt someone sitting on that bench, and I'm sorry. I've thought about it all day. But I've had a connection with this person since I walked in, and if I sit down tonight and say nothing, I'll be lying to myself and to everyone else."],
      ] },
      { when: { tookFrom: true, reason: ['connection', 'attraction'] }, turns: [
        ['a', "Everybody here knows this person is already coupled up. I know it too. I'm picking them anyway, because every time we talk I forget there's anyone else in the villa, and I don't think that happens by accident."],
      ] },
      { when: { tookFrom: true, reason: ['connection', 'attraction'], known: true }, turns: [
        ['a', "We've had a few chats now, me and this person, and everybody's seen them. I'm not going to pretend tonight that they meant nothing. They meant a lot. So I'm doing something about it, even though I know who I'm upsetting."],
      ] },
      { when: { tookFrom: true, reason: 'safety' }, turns: [
        ['a', "I'm going to be honest about why I'm doing this. If I don't stand here and pick somebody tonight, I'm going home. The person I'm picking is coupled up, and I'm sorry to the person they're with. But I'd rather go home for trying than for sitting still."],
      ] },
      { when: { tookFrom: true, reason: 'safety' }, turns: [
        ['a', "My couple's over, and everybody knows it. So I've had to look at this room and think about who I actually get on with. It's someone who's already with somebody. I know that. I'm still picking them."],
      ] },
      { when: { tookFrom: true, reason: 'loyalty' }, turns: [
        ['a', "I'm not going to dress this up. The person I want is coupled up, and I've wanted them for days. I'm sorry to whoever this hurts, but I came in here to be honest, and this is me being honest."],
      ] },
      // Leaving one's own partner {c}, who is sitting right there.
      { when: { leftFrom: true }, turns: [
        ['a', "{c}, I need to say this to you first, before anyone else. You've been good to me in here. But I haven't felt it the way I should, and I think you know that. So tonight I'm going to follow what I do feel."],
      ] },
      { when: { leftFrom: true }, turns: [
        ['a', "This is the hardest thing I've had to do in here, because the person I'm coupled up with is sitting right there. I've tried. I really have. But there's someone else I can't stop thinking about, and it isn't fair on anyone if I pretend there isn't."],
      ] },
      { when: { leftFrom: true, reason: 'safety' }, turns: [
        ['a', "My couple hasn't worked. I'm not going to stand here and blame anyone for it, it just hasn't. So I'm picking someone I trust, and I'm sorry, {c}. I hope you understand why."],
      ] },
      { when: { leftFrom: true, reason: 'attraction' }, turns: [
        ['a', "I'm going to get some looks for this. I know I am. But since the last recoupling, someone else has turned my head, and I can't sit next to {c} tonight and act like they haven't."],
      ] },
      { when: { leftFrom: true, feels: 'strong' }, turns: [
        ['a', "Everybody's been asking me for days where my head's at, and I kept saying I didn't know. I do know. I've known for a while. I just didn't want to hurt {c}."],
      ] },
      // Turned down a minute ago by {c}, and choosing again.
      { when: { afterNo: true }, turns: [
        ['a', "Okay. That wasn't how I wanted tonight to go. I'm not going to pretend it was. But I'm still standing, and there's someone in here who has been good to me since day one."],
      ] },
      { when: { afterNo: true }, turns: [
        ['a', "Right. I'm a bit embarrassed, if I'm honest. But I'd rather have asked and heard no than sat down wondering. So I'm going to pick someone who's actually been there for me."],
      ] },
      { when: { afterNo: true, reason: 'loyalty' }, turns: [
        ['a', "I know what everyone's thinking. I went for someone else, and they said no, and now I'm turning back to my partner. I know how that looks. I'm still asking."],
      ] },
      { when: { afterNo: true, reason: 'safety' }, turns: [
        ['a', "I'm not going to lie to anyone. That hurt. But I'm not going home tonight because of it. There's someone in here I get on with, and I'm going to pick them."],
      ] },
      // Taking one's own partner back from {c}, who picked them earlier tonight.
      { when: { reclaimFrom: true }, turns: [
        ['a', "{c} has just stood up and said my partner's name like I wasn't even sitting here. Like we weren't a couple. So I'm going to say it straight back."],
      ] },
      { when: { reclaimFrom: true }, turns: [
        ['a', "I've watched one person stand up tonight and take the person I'm with. I'm not sitting down and letting that be the end of it. Whatever's been going on, we're a couple, and I'm taking them back."],
      ] },
      { when: { reclaimFrom: true }, turns: [
        ['a', "{c}, I like you. You know I like you. But you knew exactly who you were picking when you stood up, and so do I."],
      ] },
      { when: { reclaimFrom: true, feels: 'little' }, turns: [
        ['a', "I'm not going to stand here and say everything's perfect between us, because it isn't. But it's ours to sort out, not anyone else's. So I'm picking my partner back."],
      ] },
      { when: { reclaimFrom: true, feels: 'strong' }, turns: [
        ['a', "My heart's going so fast right now. Ten minutes ago I had someone, and then I watched somebody else stand up and take them. I'm not losing them like that."],
      ] },
      // just met
      { when: { justMet: true, stoleFrom: false }, turns: [
        ['a', "I've only been in this villa for a few hours, so I won't pretend I know everyone. But I had one chat today that made me want to know more. I don't know where it'll go. I just know I want to find out."],
      ] },
      { when: { justMet: true, stoleFrom: false }, turns: [
        ['a', "It's early, I know it's early. But there's someone here I clicked with straight away. We had a laugh, we had a {~proper} chat, and for the first time today I actually relaxed. That's the person I want to get to know."],
      ] },
    ],

    name: [
      { when: GIRL, turns: [['a', "So the girl I want to couple up with tonight is... {b}."]] },
      { when: BOY, turns: [['a', "So the boy I want to couple up with tonight is... {b}."]] },
      { when: GIRL, turns: [['a', "And that girl is {b}."]] },
      { when: BOY, turns: [['a', "And that boy is {b}."]] },
      { turns: [['a', "The person I want to couple up with is {b}."]] },
      { turns: [['a', "So, I want to couple up with... {b}."]] },
      { when: { reason: 'loyalty' }, turns: [['a', "It's {b}. It was always going to be {b}."]] },
      { when: { rung: ['exclusive', 'official'] }, turns: [['a', "{b}, it's you. It's always been you."]] },
      { when: { stoleFrom: true, reclaim: false }, turns: [['a', "The person I want to couple up with is {b}. Sorry, {c}."]] },
      { when: { reg: 'big' }, turns: [['a', "It's {b}! Obviously it's {b}! Come here!"]] },
      { when: { reg: 'nervy' }, turns: [['a', "It's... it's {b}. Sorry. It's {b}."]] },
      { turns: [['a', "{b}, would you come and join me?"]] },
      { when: { tookFrom: true }, turns: [['a', "The person I want to couple up with tonight is {b}. I'm sorry, {c}."]] },
      { when: { tookFrom: true }, turns: [['a', "And that person is {b}."]], beat: "{c} looks straight at {b}." },
      { when: { tookFrom: true, reason: 'safety' }, turns: [['a', "So I'm picking {b}. {c}, it's not about you."]] },
      { when: { leftFrom: true }, turns: [['a', "So the person I want to couple up with tonight is {b}. I'm sorry, {c}."]] },
      { when: { leftFrom: true }, turns: [['a', "It's {b}."]], beat: "{c} looks down at {c.posAdj} hands." },
      { when: { afterNo: true }, turns: [['a', "So I'm going to couple up with {b}."]] },
      { when: { afterNo: true }, turns: [['a', "{b}. Would you come and stand with me?"]] },
      { when: { reclaimFrom: true }, turns: [['a', "So I'm picking {b}. Again."]] },
      { when: { reclaimFrom: true }, turns: [['a', "{b}. Come back over here."]] },
      { when: { reclaimFrom: true }, turns: [['a', "It's {b}. It was always {b}."]] },
    ],

    react: [
      { when: { stoleFrom: false }, turns: [], beat: "{b} gets up and walks straight into {a.posAdj} arms, and the fire pit cheers." },
      { when: { stoleFrom: false }, turns: [['b', "Stop it. Come here."]], beat: "{b} hugs {a} for a long time before they sit down together." },
      { when: { stoleFrom: false, reason: ['connection', 'loyalty'] }, turns: [['b', "That was so lovely. You're going to make me cry."]], beat: "They sit down together, holding hands." },
      { when: { stoleFrom: false, reason: 'safety' }, turns: [], beat: "{b} smiles, a little politely, and sits down next to {a}." },
      { when: { stoleFrom: false, reason: 'attraction' }, turns: [['b', "I didn't know you felt like that."], ['a', "Well, now you do."]], beat: "{b} laughs and goes red." },
      { when: { stoleFrom: false, rung: ['exclusive', 'official'] }, turns: [], beat: "The fire pit cheers before {a} has even finished saying the name." },
      { when: { stoleFrom: false, justMet: true }, turns: [['b', "I wasn't expecting that."], ['a', "Good surprise?"], ['b', "Very good surprise."]] },
      { when: { stoleFrom: true, reclaim: false }, turns: [], beat: "There's a gasp along the benches. {b} looks at {c}, then gets up and goes to {a}. {c} stares straight ahead." },
      { when: { stoleFrom: true, reclaim: false }, turns: [['c', "Wow. Okay."]], beat: "{b} walks over to {a} without once looking at {c}." },
      { when: { stoleFrom: true, reclaim: false }, turns: [], beat: "The whole fire pit turns to look at {c}. {c} manages a small, tight smile and says nothing." },
      { when: { stoleFrom: true, reclaim: false }, turns: [['c', "You couldn't have told me first?"]], beat: "Nobody answers. {b} sits down next to {a}." },
      { when: { reclaim: true }, turns: [], beat: "{b} practically runs over, and the fire pit erupts." },
      { when: { reclaim: true }, turns: [['b', "I knew you'd come back for me."], ['a', "Always."]] },
      // {c} is on the bench, watching their partner walk to somebody else.
      { when: { tookFrom: true }, turns: [['c', "Are you serious?"]], beat: "{b} gets up slowly and walks over to {a}, and doesn't look at {c} on the way past." },
      { when: { tookFrom: true }, turns: [], beat: "The whole fire pit turns to look at {c}. {c} keeps very still and stares at the fire." },
      { when: { tookFrom: true }, turns: [['c', "Wow. Okay. I've still got to stand up, haven't I."]], beat: "{b} sits down next to {a} and looks at the floor." },
      { when: { tookFrom: true }, turns: [['b', "I didn't know you were going to do that."], ['a', "I know. Sorry."]], beat: "{c} watches them sit down together and doesn't say a word." },
      { when: { tookFrom: true, feels: 'strong' }, turns: [], beat: "{b} hesitates for a long second, looking at {c}, before walking over to {a}. Somebody on the bench breathes out." },
      // {c} has just been left, in front of everyone.
      { when: { leftFrom: true }, turns: [['c', "Fair enough."]], beat: "{b} walks over to {a}. {c} nods once and keeps looking at the fire." },
      { when: { leftFrom: true }, turns: [], beat: "{b} goes over to {a}. Nobody on the bench quite knows where to look, so most of them look at {c}." },
      { when: { leftFrom: true }, turns: [['c', "Good luck. I mean it."]], beat: "{a} can't look at {c} as {b} sits down." },
      { when: { leftFrom: true, feels: 'strong' }, turns: [], beat: "{b} gets up and goes to {a}. {c} watches {b} go, then wipes {c.posAdj} eyes before anyone can see." },
      // Turned down, then picked second: {b} knows it.
      { when: { afterNo: true }, turns: [], beat: "{b} gets up and walks over, a little slower than usual, and gives {a} a hug." },
      { when: { afterNo: true }, turns: [['b', "Come here."]], beat: "{b} hugs {a}, and doesn't look at {c} once." },
      { when: { afterNo: true, reason: 'loyalty' }, turns: [['b', "We'll talk later."], ['a', "I know."]], beat: "They sit down together, not touching." },
      // {c}, who picked {b} earlier tonight, watches them go back.
      { when: { reclaimFrom: true }, turns: [['c', "Well. It was worth a try."]], beat: "{b} walks back across to {a} and sits down." },
      { when: { reclaimFrom: true }, turns: [], beat: "{b} gets up from next to {c} and walks back to {a}. {c} is left on the end of the bench on {c.posAdj} own." },
      { when: { reclaimFrom: true }, turns: [['b', "Sorry."], ['c', "Don't be. I knew."]], beat: "{b} goes back to {a}, and this time {a} takes {b.posAdj} hand." },
      { when: { reclaimFrom: true }, turns: [['c', "Fair enough."]], beat: "The fire pit claps, but not loudly. Everyone is looking at {c}." },
    ],
  },
  notes: [],
});
