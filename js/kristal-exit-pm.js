// Kristal-talKs exit interviews — a Perfect Match islander's own story, asked.
//
// The user, 2026-10-30, on "Did you find what you came for?" answered "I was the
// realest person in that villa and that's why I'm gone": "the podcast barely asks
// interesting questions and the answers are barely related to the question. Is
// she still in love with Dante? Come back to her adventure in the show: her
// couple, her fights, her friendship, her triangle, her drama."
//
// Every question here is about something that happened to the guest
// (exit-interview/pm-story.js), and every question carries its OWN answers: a
// pair is chosen, then its answer by what the guest feels about it (the
// record's numbers, read as words) and how they're taking the hour (g: soft ·
// hot · hurt). Two questions sharing one answer bank is how "What did you want
// to say?" got "I have, mostly." A guest is asked at most four, the most
// dramatic first.

const LOVE = 6, FOND = 3;
const level = v => (v >= LOVE ? 'love' : v >= FOND ? 'fond' : 'not');
const by = (bank, g) => (Array.isArray(bank) ? bank : bank?.[g]?.length ? bank[g] : bank?.soft || []);
const Q = (q, a) => ({ q, a });

// ── how they went ──
const EXIT = {
  unfair: [
    Q('You and {with} were one of the strongest couples in there, and the villa sent you home over couples who had barely started. How angry are you?', {
      hot: ['Furious. They were scared of us, so they got rid of us. That’s all that was.'],
      hurt: ['I’m more hurt than angry. I thought those people were my friends.'],
      soft: ['I’m angry, but I get it. We were a threat. You don’t vote out the couple that’s falling apart.'] }),
    Q('Be honest with me. Did the villa get it wrong, sending you and {with} home?', {
      hot: ['Yes, and they know it. Some of them couldn’t look at me when I left.'],
      hurt: ['Yes. I keep thinking about who wrote our names down. I hugged some of them every morning.'],
      soft: ['Yes, I think they did. But it’s their vote, and they used it. I’d rather go out strong than stay in something fake.'] }),
  ],
  stays: {
    love: [
      Q('You’ve walked out, and {p} is still in there. How does that feel?', {
        soft: ['It’s horrible. I keep looking for {p} next to me. But I want {p} to stay as long as possible. I’ll be waiting.'],
        hurt: ['Awful. I can’t stop thinking about who’s going to pull {p} for a chat tomorrow.'],
        hot: ['I’ll be fine, as long as nobody in there tries anything with {p}. They know who I mean.'] }),
      Q('Will you wait for {p}?', {
        soft: ['Of course I will. I’ll be at the airport with a sign.'], hurt: ['Yes. I just hope {p} waits for me too.'],
        hot: ['Yes. And anyone who thinks {p} is single now is wrong.'] }),
    ],
    fond: [
      Q('You’ve walked out, and {p} is still in there. How does that feel?', {
        soft: ['Strange. We were getting somewhere. I hope we get to find out where, on the outside.'],
        hurt: ['Lonely. I didn’t realise how much I leaned on {p} until I was in the car without {p}.'] }),
      Q('Will you wait for {p}?', {
        soft: ['I’d like to. We never got to find out what we could be.'], hurt: ['I want to. I don’t know if {p} will wait for me, though.'],
        hot: ['If {p} waits for me, I’ll wait for {p}. Simple.'] }),
    ],
    not: [
      Q('You’ve walked out, and {p} is still in there. How does that feel?', {
        soft: ['Honestly? It’s fine. {p} and I were friends more than anything. I hope {p} finds someone.'],
        hot: ['It’s fine. We both knew it wasn’t really going anywhere.'] }),
      Q('Will you wait for {p}?', {
        soft: ['No. And I don’t think {p} wants me to. We were better as friends.'], hot: ['No. There’s nothing to wait for.'] }),
    ],
  },
  together: {
    love: [Q('You and {p} left together. Does that make it easier?', {
      soft: ['So much easier. I’d rather leave with {p} than stay without {p}. We’re going home together.'],
      hurt: ['It does. I don’t know what I’d have done if I’d walked out on my own.'] })],
    fond: [Q('You and {p} left together. What happens to you two now?', {
      soft: ['Now we find out what we are without cameras. I’m excited, actually.'], hurt: ['I don’t know. I hope we keep going. I’m scared it was just the villa.'] })],
    not: [Q('You and {p} left together. What happens to you two now?', {
      soft: ['We’ll stay friends. We were always better as friends, if I’m honest.'], hot: ['Nothing, I don’t think. We were never really a couple.'] })],
  },
  single: [
    Q('You left on your own. Did you ever find your person in there?', {
      soft: ['I don’t think so. I made friends I’ll have forever. My person wasn’t in that villa.'],
      hurt: ['I thought I had. I was wrong. That’s the bit that hurts.'],
      hot: ['No. And I’m not going to pretend somebody did just to make it a better story.'] }),
    Q('Being single in that villa looked really hard. Was it?', {
      soft: ['Harder than I thought. Every recoupling, you’re waiting to see if anyone stands up for you.'],
      hurt: ['Yes. Watching everyone else pair off night after night. It gets to you.'],
      hot: ['Only because the villa played it safe. Nobody wanted to take a risk on me.'] }),
    Q('What would you do differently if you went back in?', {
      soft: ['I’d say how I feel sooner. I waited too long for everything.'], hurt: ['I’d protect myself a bit more. I gave too much, too quickly.'],
      hot: ['Nothing. I was myself. If that wasn’t enough for them, that’s on them.'] }),
  ],
};

// ── their couple ──
const COUPLE = {
  love: [
    Q('Let’s talk about {p}. Are you in love?', {
      soft: ['Yes. I’m in love with {p}. I’m not embarrassed to say it.'], hurt: ['Yes. That’s why tonight hurts so much.'],
      hot: ['Yes. And anyone who said it was fake can watch us on the outside.'] }),
    Q('Be honest with me. Are you in love with {p}?', {
      soft: ['I am. I didn’t come in looking for it, and I found it anyway.'], hurt: ['Yes. I didn’t say it enough in there. I wish I had.'],
      hot: ['Yes. Next question.'] }),
  ],
  fond: [Q('Let’s talk about {p}. Where were you two, really, by the end?', {
    soft: ['I really liked {p}. I don’t know if it was love yet. I think it could have got there.'],
    hurt: ['I liked {p} more than {p} knew. I just never found the right moment to say it.'],
    hot: ['Somewhere good. We didn’t get the time we needed, that’s all.'] })],
  not: [Q('Let’s talk about {p}. Were you ever really into each other?', {
    soft: ['Honestly? We were friends who shared a bed. I think we both knew it.'],
    hot: ['No. We were together because it was safe. Everybody could see it.'],
    hurt: ['I wanted to be. It just never happened.'] })],
  said: [Q('You and {p} said I love you in there. Did you mean it?', {
    love: ['Every word. I’d say it again right now.'], fond: ['I meant it when I said it. I need to know what it means out here, though.'],
    not: ['I thought I did. I’m not sure any more.'] })],
};

// ── the ex, or the one they wanted ──
const EX = {
  love: [
    Q('Before {p}, there was {ex}. Be honest with me. Are you still in love with {ex}?', {
      soft: ['Yes. I’m not going to sit here and lie. I never stopped.'], hurt: ['Yes. And it was horrible watching {ex} with someone else every day.'],
      hot: ['Yes, and {ex} knows it. That’s all I’m going to say.'] }),
    Q('I have to ask about {ex}. Is there still something there?', {
      soft: ['There’s a lot there. Part of me will always love {ex}. I don’t know what to do with that yet.'],
      hurt: ['Everything’s still there. That’s the problem.'], hot: ['Yes. Everyone knows there is.'] }),
  ],
  fond: [Q('I have to ask about {ex}. Is there still something there?', {
    soft: ['A little. You don’t just switch it off because you’ve moved beds. But I’m not waiting for it.'],
    hurt: ['A bit. More than I’d like. I’m working on it.'], hot: ['Maybe. That’s between me and {ex}.'] })],
  crush: [
    Q('Everybody could see it. Was it {x} you really wanted?', {
      soft: ['Yes. It was always {x}. I just never got my chance.'], hurt: ['Yes. And watching {x} with someone else was the hardest part of the whole thing.'],
      hot: ['Yes. And if I’d had one more recoupling, it would have been {x}.'] }),
    Q('Can I say what everyone was thinking? You liked {x}.', {
      soft: ['I did. I should have said it out loud weeks ago.'], hurt: ['I did. I still do. I never told {x}.'],
      hot: ['I did. I’m not going to pretend I didn’t.'] }),
  ],
};

// ── the night it happened to them ──
const DRAMA = {
  turnedOn: [
    Q('{by} sat you down and told you {by} wanted to get to know {for}. What went through your head?', {
      soft: ['That at least {by} was honest. It still broke my heart.'], hurt: ['That I’d done something wrong. I spent the whole night going over every day, looking for it.'],
      hot: ['That {by} had been planning it for days, and I was the last to know. And {for}, really?'] }),
    Q('Have you forgiven {by} for going for {for}?', {
      soft: ['Mostly. I’d rather {by} was honest with me than sneaking around.'], hurt: ['Not yet. I don’t know when I will.'],
      hot: ['No. And I don’t think {for} is going to make {by} happy either.'] }),
  ],
  turnedOnSolo: [Q('{by} told you {by} wanted to get to know someone else. What went through your head?', {
    soft: ['That at least {by} was honest. It still hurt.'], hurt: ['That it was my fault somehow. It wasn’t, but that’s what I thought.'],
    hot: ['That I’d wasted my time. Simple as that.'] })],
  robbed: [
    Q('{by} took {took} from you at the recoupling. Have you forgiven {by}?', {
      soft: ['Mostly. It’s the game. I just wish {by} had talked to me first.'], hurt: ['Not yet. I sat there and smiled, and inside I was falling apart.'],
      hot: ['No. {by} knew exactly what {by} was doing.'] }),
    Q('At that recoupling, {by} stood up and picked {took}. What did you want to say?', {
      soft: ['Honestly? Nothing. I was too shocked to say anything.'], hurt: ['I wanted to ask {took} why. I still want to ask.'],
      hot: ['A lot of things. I’m glad I didn’t say them on camera.'] }),
  ],
  stole: [
    Q('You took {took} from {from} at the fire pit. Any regrets?', {
      soft: ['No regrets about {took}. I do feel bad about how it happened for {from}.'], hurt: ['I knew it would hurt {from}. I did it anyway, because I had to follow how I felt.'],
      hot: ['None. I went for what I wanted. That’s what you’re in there for.'] }),
    Q('How do you think {from} felt when you picked {took}?', {
      soft: ['Awful, probably. I should have talked to {from} first. I didn’t, and I’m sorry for that.'], hurt: ['Horrible. I think about it a lot.'],
      hot: ['Probably the way I felt every day watching them together.'] }),
  ],
  cheatedOn: [
    Q('You found out about {by} from someone else. When did you know it was over?', {
      soft: ['The second I heard it. I gave {by} the chance to explain, but I already knew.'], hurt: ['I didn’t, for a while. I kept making excuses for {by}.'],
      hot: ['The minute I heard it. I don’t do second chances for that.'] }),
    Q('What went through your head when you heard what {by} had done?', {
      soft: ['That I wanted to hear it from {by}, not from someone else.'], hurt: ['That everyone knew before me. That was the worst bit.'],
      hot: ['That I’d been made to look stupid in front of the whole villa.'] }),
  ],
  endedBy: [Q('{by} told you you were better as friends. Did you see that coming?', {
    soft: ['A bit. It still hurt to hear. I’m glad {by} was honest.'], hurt: ['No. I thought we were fine. I really thought we were fine.'],
    hot: ['I saw it coming. I just wanted {by} to have the guts to say it sooner.'] })],
};

// ── who they fought with ──
const FIGHT = {
  q: { other: ['You and {f} clashed more than anyone in there. What was it really about?', 'Every time I turned on the show, you and {f} were going at it. Why?'],
    partner: ['You and {f} rowed a lot for a couple. What was going on?'],
    // One row, not a feud.
    otherOnce: ['You and {f} had a real row in there. What was it about?'], partnerOnce: ['You and {f} had a big row. What happened?'] },
  a: {
    partner: { soft: ['We cared, that’s what it was. You don’t fight like that with someone you don’t care about.'],
      hurt: ['I think we were scared of losing each other, and it came out as fighting.'],
      hot: ['We’re both stubborn. Neither of us was ever going to back down first.'] },
    partnerCold: { soft: ['We just didn’t work, and it came out in the end.'], hot: ['We were never right for each other. That was obvious to everyone.'],
      hurt: ['I kept trying to make it work. It didn’t.'] },
    jealous: { soft: ['Jealousy, mostly. I’m not proud of it.'], hot: ['{f} couldn’t handle me talking to anyone else. That’s what every row was about.'] },
    clash: { soft: ['We’re just too alike. We both want to be heard, and there wasn’t room for both of us.', 'Honestly? We rubbed each other up the wrong way from day one. No big reason.'],
      hot: ['{f} acted one way to people’s faces and another behind their backs. I called it.', 'I couldn’t stand how fake {f} was, and I said so.'],
      hurt: ['I tried with {f}. I really did. It never worked.'] },
    stole: { soft: ['{f} took someone from me. It’s hard to be friends after that.'], hot: ['{f} took someone from me and then wanted to be friends. No.'] },
    voted: { soft: ['{f} voted against me. I don’t forget that sort of thing quickly.'], hot: ['{f} put my name down. That’s where it started and that’s where it ends.'] },
    told: { soft: ['{f} told something that wasn’t {f}’s to tell. That’s what it was about.'], hot: ['{f} went running with my business. I’ll never trust {f} again.'] },
    envy: { soft: ['I liked who {f} was with. I didn’t handle it well.'], hot: ['{f} had what I wanted, and didn’t even appreciate it.'] },
    rival: { soft: ['{f} kept going after someone I was with. I wasn’t going to sit back and watch.'], hot: ['{f} wouldn’t leave my partner alone. Simple as that.'] },
    // The other side of a row about something the guest did.
    'stole-theirs': { soft: ['{f} never forgave me for the recoupling. I understand why.'], hot: ['I picked who I wanted. {f} couldn’t let it go.'] },
    'voted-theirs': { soft: ['I voted against {f}. It wasn’t personal, but {f} took it that way.'], hot: ['I voted against {f}, and {f} made sure I paid for it.'] },
    'told-theirs': { soft: ['I told someone something about {f} that they deserved to know. {f} never forgave me.'], hot: ['I told the truth about {f}. {f} didn’t like it.'] },
    'jealous-theirs': { soft: ['{f} didn’t like me talking to other people. I didn’t think I was doing anything wrong.'], hot: ['{f} was jealous every time I spoke to someone. I couldn’t breathe.'] },
    'envy-theirs': { soft: ['I think {f} liked who I was with. It made everything awkward.'], hot: ['{f} wanted what I had. Everyone could see it.'] },
    'rival-theirs': { soft: ['{f} thought I was after {f}’s partner. I wasn’t, really.'], hot: ['{f} was paranoid about me and {f}’s partner. That’s {f}’s problem.'] },
  },
};

// ── their friend ──
const FRIEND = [
  Q('Who was your person in there? Not romantically. The one who got you through.', {
    soft: ['{bf}. Every time. {bf} got me through the worst days in there.'], hurt: ['{bf}. I didn’t even get to say a real goodbye.'],
    hot: ['{bf}. The only one in there I’d trust with anything.'] }),
  Q('Who are you going to miss most from the villa?', {
    soft: ['{bf}. Without question. I’d have gone home a lot earlier, in my head, without {bf}.'], hurt: ['{bf}. I miss {bf} already.'],
    hot: ['{bf}. Everyone else can stay in there as long as they like.'] }),
];

function hsh(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

/**
 * The guest's story as exchanges ([topic, q, a, extra]), most dramatic first,
 * at most four. `pick(bank, key, f, used)` is kristal-exit.js's.
 */
export function pmExchanges(r, { g, base, K, used, pick }) {
  const s = r.story;
  if (!s) return [];
  const out = [];
  // One question and ITS answers. `tone` is which answer bank: the mood, or a feeling level.
  const ask = (topic, pairs, f, who = null, tone = g) => {
    if (!pairs?.length) return;
    const pair = pairs[hsh(`${K}|pm|${topic}`) % pairs.length];
    const q = pick([pair.q], `${K}|pm|${topic}|q`, f, null);
    const a = pick(by(pair.a, tone), `${K}|pm|${topic}|a`, f, used);
    if (q && a) out.push([topic, q, a, who ? { who } : {}]);
  };
  const p = s.partner?.who || null;
  // Told they're better as friends by the one they left beside: friends is what they were.
  const pl = !s.partner ? null : s.endedBy === p ? 'not' : level(s.partner.feel);
  // 1. How they went.
  if (s.unfair?.with) ask('pm-exit', EXIT.unfair, { ...base, with: s.unfair.with }, s.unfair.with);
  else if (p && s.partner.stays) ask('pm-exit', EXIT.stays[pl], { ...base, p }, p);
  else if (p) ask('pm-exit', EXIT.together[pl], { ...base, p }, p);
  else ask('pm-exit', EXIT.single, base);
  // 2. The night that happened to them.
  const d = s.turnedOn ? (s.turnedOn.for ? ['turnedOn', { by: s.turnedOn.by, for: s.turnedOn.for }] : ['turnedOnSolo', { by: s.turnedOn.by }])
    : s.robbed ? ['robbed', { by: s.robbed.by, took: s.robbed.took }]
      : s.cheatedOn?.by ? ['cheatedOn', { by: s.cheatedOn.by }]
        : s.endedBy ? ['endedBy', { by: s.endedBy }]
          : s.stole ? ['stole', { took: s.stole.took, from: s.stole.from }] : null;
  if (d) ask('pm-drama', DRAMA[d[0]], { ...base, ...d[1] }, d[1].by || d[1].took);
  // 3. The ex they still feel for, or the one they really wanted.
  if (p && s.ex && s.ex.feel >= 4 && s.ex.who !== s.turnedOn?.by && s.ex.who !== s.endedBy) {
    ask('pm-ex', EX[level(s.ex.feel) === 'love' ? 'love' : 'fond'], { ...base, ex: s.ex.who, p }, s.ex.who);
  } else if (s.crush) ask('pm-ex', EX.crush, { ...base, x: s.crush }, s.crush);
  // 4. Their couple: how they really feel about who they were with.
  // (Not when the way they went has already said it was nothing.)
  if (p && out.length < 4 && pl !== 'not') {
    if (s.loveSaid) ask('pm-couple', COUPLE.said, { ...base, p }, p, pl);
    else ask('pm-couple', COUPLE[pl], { ...base, p }, p);
  }
  // 5. Their fight.
  // (A row with the partner they never felt for says nothing the couple question hasn't.)
  if (s.fight && out.length < 4 && !(s.fight.partner && pl === 'not' && s.fight.who === p)) {
    const c = s.fight.cause && !s.fight.mine ? `${s.fight.cause}-theirs` : s.fight.cause;
    const kind = s.fight.partner ? ((s.fight.feel ?? 0) >= FOND ? 'partner' : 'partnerCold') : FIGHT.a[c] ? c : 'clash';
    const qs = FIGHT.q[(s.fight.partner ? 'partner' : 'other') + (s.fight.n >= 2 ? '' : 'Once')];
    ask('pm-fight', qs.map(q => Q(q, FIGHT.a[kind])), { ...base, f: s.fight.who }, s.fight.who);
  }
  // 6. Their friend.
  if (s.bestFriend && out.length < 4) ask('pm-friend', FRIEND, { ...base, bf: s.bestFriend }, s.bestFriend);
  return out.slice(0, 4);
}
