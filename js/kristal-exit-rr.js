// Kristal-talKs exit interviews — a Ridonculous Race racer's own story, asked.
//
// The user, 2026-11-03: "theres no exit interview for the eliminated in ridonculous race". Built the way the Perfect
// Match interview was rebuilt (kristal-exit-pm.js; the user, 2026-10-30: "the answers are barely related to the
// question"): every question is about something that happened to the guest (exit-interview/rr-story.js), and every
// question carries its OWN answers, chosen by what happened and how they're taking the hour (g: soft · hot · hurt).
// A race has no vote: nobody here is asked who wrote their name down. At most four, after the opener.

const by = (bank, g) => (bank?.[g]?.length ? bank[g] : bank?.soft || []);
const Q = (q, a) => ({ q, a });
function hsh(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

// ── how it ended (asked first; each question with its own answers) ──
const EXIT = {
  'raced-last': [
    Q('Take me through the leg. Where did it get away from you?', {
      hot: ['We were ahead for half the leg. One wrong turn, one bad challenge, and suddenly everybody’s passing us.',
        'The challenge. We were stuck on it for hours while team after team walked past us.',
        'We got the worst of everything that day. The wrong ride, the hardest side, and nobody would help us.',
        'Bad luck, mostly. I’m not going to pretend we played it perfectly, but the luck was all against us.'],
      soft: ['We made one mistake early and spent the whole day trying to catch up. We just ran out of time.',
        'Honestly, the other teams were just better that day. We did everything we could.',
        'The first hour. We read the clue wrong, and we never got that time back.',
        'The flight. We got the later one, and from then on we were chasing everybody.',
        'A challenge we should have been good at. It just didn’t click, and the day went with it.'],
      hurt: ['We ran the last stretch as fast as we’ve ever run anything, and it still wasn’t enough.',
        'At the challenge. I couldn’t get it, and I could feel my partner watching me not get it.',
        'I keep going back over it. One wrong turn. That’s all it took.'] }),
    Q('When did you know you were going to be last?', {
      hot: ['When the last team passed us at the final challenge and didn’t even look back.',
        'The second we got in a slow taxi. I said it out loud, and I was right.',
        'When I saw how far ahead the others were at the airport. I didn’t say anything, but I knew.'],
      soft: ['Not until we saw Don. You always hope somebody else got more lost than you did.',
        'Halfway through the leg, I think. We just kept going anyway. You have to.',
        'At the last challenge. Everybody else had already gone, and we were still at it.',
        'Honestly, on the way to the mat. We were quiet the whole way there.'],
      hurt: ['I could see the mat. I could see Don standing there. And I knew before we got to him.',
        'When nobody else was at the challenge anymore. It went so quiet.'] }),
  ],
  'found-on-the-road': [
    Q('What was it like, seeing Don walking towards you on the road?', {
      hot: ['We were still fighting. We didn’t even know it was over until Don showed up.'],
      soft: ['When I saw him, I knew. It was almost a relief, honestly. We were so tired.'],
      hurt: ['I just sat down where I was. I couldn’t even stand up.'] }),
    Q('When did you realise everybody else had checked in?', {
      hot: ['When Don told us. Nobody tells you how far behind you are out there.'],
      soft: ['Hours before. We knew. We just wanted to finish it anyway.'],
      hurt: ['When it got dark and we hadn’t seen another team for hours.'] }),
  ],
  'cut-at-halfway': [
    Q('How close was it at the halfway mat?', {
      hot: ['A few minutes. That’s all it was, after the whole race.'],
      soft: ['Close. Closer than anybody expected us to get. I’m proud of that.'],
      hurt: ['Close enough that I’ll be thinking about every minute we lost for a long time.'] }),
    Q('You made the final. How does it feel, not getting to finish it?', {
      hot: ['We beat most of them all season, and it comes down to one stop. It isn’t fair.'],
      soft: ['We were the third best team in the world. I can live with that. Almost.'],
      hurt: ['It’s a strange kind of heartbreak. You’re so close you can almost see the finish line.'] }),
  ],
  walked: [
    Q('What was the moment you decided you were done?', {
      hot: ['When I realised the race was destroying us. No prize is worth that.'],
      soft: ['We talked about it for a long time. It was the right call for us, even if it doesn’t look like it.'],
      hurt: ['I couldn’t do one more day. I know I let my partner down.'] }),
    Q('Was it your call, or {p}’s?', {
      hot: ['Mine. And I’d make it again.'],
      soft: ['Both of ours, in the end. We decided together, like we decided everything.'],
      hurt: ['Mine. And I think about it every day.'] }),
  ],
  medical: [
    Q('First of all, how are you feeling now?', {
      hot: ['Fine. I wanted to keep going. The doctors didn’t give me a choice.'],
      soft: ['Better, honestly. I’m getting there. I’m just sorry I couldn’t finish it with my partner.'],
      hurt: ['Physically, better. The worst part is my partner had to stop too, because of me.'] }),
    Q('Did you want to keep going?', {
      hot: ['I’d have finished that race on one leg if they’d let me.'],
      soft: ['Yes. But it was the right call. I didn’t want to accept it at the time.'],
      hurt: ['More than anything. We were doing so well, and then one moment, and it was over.'] }),
  ],
};

// ── the two of them ──
const PARTNER = {
  solid: [
    Q('How are you and {p}, now it’s over?', {
      soft: ['Closer than when we started. You find out who someone really is when you’re both exhausted and lost. {p} was amazing.',
        'Honestly? Better than ever. We came home and talked about it for hours.',
        'We’re good. We’re really good. That’s the part of this I’m proudest of.'],
      hurt: ['I feel like I let {p} down. {p} keeps telling me I didn’t, but I feel it.',
        'We’re fine. I’m the one who’s struggling with it. {p} has been amazing about it.'],
      hot: ['We’re great. We were never the problem. Everything around us was.',
        'Solid. Nobody out there could get between us, and plenty of them tried.',
        'Perfect. I’d do it all again with {p} tomorrow.'] }),
    Q('What did racing with {p} teach you about {p}?', {
      soft: ['That {p} never gives up. Not once, not on the worst day. I already knew it, but now I’ve seen it.',
        'That {p} is funny when everything is going wrong. That got us through a lot.',
        'How patient {p} is. With me, mostly.'],
      hurt: ['That {p} was carrying more than I knew. I wish I’d seen it sooner.',
        'That {p} would do anything for me. I don’t know if I did enough back.'],
      hot: ['That {p} is tougher than everybody out there gave us credit for.',
        'That {p} doesn’t back down. From anybody. I love that.'] }),
  ],
  rocky: [
    Q('You and {p} had some fights out there. Where are you two now?', {
      soft: ['We said things we didn’t mean. We talked it all through on the way home, and we’re okay.',
        'We’re fine. Being that tired, that far from home, you’re going to snap sometimes.'],
      hurt: ['It’s still a bit raw. Watching it back is hard. But we’re getting there.',
        'We haven’t really talked about it yet. I think we both need a minute.'],
      hot: ['We fight. That’s how we work. Anyone who thinks that means we don’t love each other has never met us.',
        'We’re fine. The edit made it look worse than it was.'] }),
    Q('Watching it back, the fights with {p}. How does it look to you now?', {
      soft: ['Worse than it felt, honestly. We were tired and lost. We were never really angry at each other.'],
      hurt: ['It’s hard to watch. I didn’t know I sounded like that.'],
      hot: ['It looks like two people under more pressure than anybody at home can imagine.'] }),
  ],
  strained: [
    Q('You and {p} were at each other’s throats out there. Are you still talking?', {
      soft: ['We are. Just. It’s going to take some time, and that’s fine.'],
      hurt: ['Not really, no. I don’t know how we come back from some of what was said.'],
      hot: ['We’re talking. Whether we’re friends is another question.'] }),
    Q('Do you think you and {p} would have gone further if you’d got along?', {
      soft: ['Probably, yes. Every fight cost us time. I can see that now.'],
      hurt: ['I think about that all the time. I think it cost us the race.'],
      hot: ['Maybe. But I wasn’t the one starting them.'] }),
  ],
};

// ── what they did ──
const LEG_WON = [
  Q('You won a leg, in {where}. Take me back to that mat.', {
    soft: ['I still can’t believe it. Running onto that mat first, Don saying it. I’ll never forget it.'],
    hurt: ['It makes going home harder, honestly. We knew we could win, and we still went out.'],
    hot: ['That’s the team we really were. Everybody forgets that now.'] }),
  Q('You were first to the mat in {where}. When did you know you had it?', {
    soft: ['Not until we saw Don. You never know in this race until you’re standing on it.'],
    hurt: ['We didn’t. We thought we were last until the very end.'],
    hot: ['Halfway through the leg. We passed everybody, and we knew.'] }),
];
const RIVAL = {
  started: [
    Q('{rv} kept coming after you out there. What was that about?', {
      soft: ['I honestly don’t know. We tried to keep our heads down. I think we were just in their way.',
        'Some people need somebody to push against. We happened to be there.'],
      hurt: ['It got to me more than I let on. Every time we saw them, it started again.',
        'It wore me down. You’re already exhausted, and then that, every time.'],
      hot: ['They knew we were a threat. That’s all it ever was.',
        'They wanted a reaction, and they got one. I’m not sorry about that.'] }),
  ],
  mine: [
    Q('You and {rv} could not stand each other out there. Was it worth it?', {
      soft: ['Probably not, if I’m honest. It cost us energy we needed for the race.',
        'It made the race more fun, in a weird way. I don’t hate them. I don’t like them either.'],
      hurt: ['I wish I’d just ignored them. I let it get under my skin.',
        'No. I don’t like who I was when they were around.'],
      hot: ['Every second. Somebody had to say it to their faces.',
        'Yes. They needed somebody to stand up to them, and nobody else would.'] }),
  ],
};
const BOOMERANG = {
  known: [
    Q('{by} threw the Boomerang at you. Have you forgiven them?', {
      soft: ['It’s part of the race. I’d probably have done the same. Probably.'],
      hurt: ['It hurt. It sent us back when we’d worked so hard to get ahead.'],
      hot: ['No. And I want them to know I watched them do it.'] }),
  ],
  // (the team it hit is on the record, the one who threw it isn't)
  unknown: [
    Q('A Boomerang sent you back in {at}. How much did that cost you?', {
      soft: ['Everything, probably. But that’s the race. It could have been anybody.', 'A lot of time we didn’t have. We tried not to let it get to us.'],
      hurt: ['I think it cost us the race. I really do.', 'More than I can say. We never caught up after that.'],
      hot: ['The whole race. And whoever threw it knows exactly what they did.', 'Too much. I’d love five minutes alone with whoever did it.'] }),
  ],
  blind: [
    Q('Somebody hit you with a Blind Boomerang. Do you know who it was now?', {
      soft: ['I have a guess. I’d rather not say it until I know for sure.'],
      hurt: ['Not knowing was the worst part. You look at everybody differently after that.'],
      hot: ['I know exactly who it was. They know I know.'] }),
  ],
};
const FEAR = [
  Q('You faced a real fear out there. What was going on in your head?', {
    soft: ['Honestly, I was just trying to breathe. And I did it. I’m still proud of that.',
        'My partner’s voice. That’s all I could hear, and it was enough.',
        'Nothing, for once. I just did it before I could think about it.'],
    hurt: ['I nearly didn’t do it. I don’t know what it would have done to us if I hadn’t.',
        'That I was going to let everybody down. I still think about that moment.'],
    hot: ['That nobody was going to watch me quit on television.',
        'That I’d already come too far to stop at something like that.'] }),
];
const CRUSH = {
  other: [
    Q('There was something between you and {c} out there. What happened with that?', {
      soft: ['We’re talking. Let’s just say I’m going to be watching the rest of the race very closely.',
        'Something, maybe. It was nice to have somebody to look forward to seeing at the airport.',
        'I don’t know yet. Ask me when {c} gets home.'],
      hurt: ['I don’t know. It’s hard to tell what’s real when you’re that tired.',
        'I liked {c} a lot. I don’t know if it was the same for {c}.'],
      hot: ['A lot of people have opinions about that. None of them were there.',
        'I’m not saying anything until {c} is out of there. Then we’ll see.',
        'It was a moment. Moments happen on a race like that. Let’s leave it there.'] }),
  ],
  partner: [
    Q('Be honest with me. Is there something between you and {p}?', {
      soft: ['There might be. We’re figuring it out. Without cameras, this time.'],
      hurt: ['I don’t know anymore. I thought I knew.'],
      hot: ['That’s between me and {p}.'] }),
  ],
};

// ── a finalist ──
const FINAL = {
  won: [
    Q('You won the Ridonculous Race. With {p}. How does that feel?', {
      soft: ['I can’t describe it. All the way round the world, and we did it together. I’d do every second of it again with {p}.'],
      hot: ['Like proof. Everybody who wrote us off, I hope they watched that finish line.'],
      hurt: ['Strange, honestly. I keep waiting for somebody to tell me it was a mistake.'] }),
  ],
  second: [
    Q('Second, in the final. So close. How are you and {p} with that?', {
      soft: ['Proud. Second best team in the world. I’ll take that, and so will {p}.'],
      hurt: ['It’s going to take a while. We were right there.'],
      hot: ['We were the better team for most of that race. It came down to one leg.'] }),
  ],
};

/** The racer's own story, as questions and their answers: [[topic, q, a, extra], ...]. */
export function rrExchanges(r, { g, base, K, pick, used }) {
  const s = r.story;
  if (!s) return [];
  const out = [];
  const ask = (topic, pairs, f, who = null) => {
    if (!pairs?.length) return;
    const pair = pairs[hsh(`${K}|rr|${topic}`) % pairs.length];
    const q = pick([pair.q], `${K}|rr|${topic}|q`, f, null);
    const a = pick(by(pair.a, g), `${K}|rr|${topic}|a`, f, used);
    if (q && a) out.push([topic, q, a, who ? { who } : {}]);
  };
  const p = s.partner?.who || null;
  const f = { ...base, p };
  // how it ended, first
  if (r.kind !== 'finalist') ask('rr-exit', EXIT[r.kind] || EXIT['raced-last'], f);
  if (r.kind === 'finalist' && p) {
    if (r.placement === 1) ask('rr-final', FINAL.won, f, p);
    else if (r.placement === 2) ask('rr-final', FINAL.second, f, p);
  }
  // the two of them
  if (p) {
    const fights = s.partner.fights || 0;
    const shape = fights >= 3 && !s.partner.madeUp ? 'strained' : fights >= 2 ? 'rocky' : 'solid';
    if (!(r.kind === 'finalist' && r.placement === 1)) ask('rr-partner', PARTNER[shape], f, p);
  }
  // the crush, before anything else they did: it's what the fans asked about
  if (s.crush?.partner && p) ask('rr-crush', CRUSH.partner, f, p);
  else if (s.crush?.who) ask('rr-crush', CRUSH.other, { ...f, c: s.crush.who }, s.crush.who);
  // the Boomerang that hit them
  if (s.boomerang && out.length < 4) {
    if (s.boomerang.by?.length) ask('rr-boomerang', BOOMERANG.known, { ...f, by: s.boomerang.by.join(' and ') }, s.boomerang.by[0]);
    else if (s.boomerang.blind) ask('rr-boomerang', BOOMERANG.blind, f);
    else if (s.boomerang.place) ask('rr-boomerang', BOOMERANG.unknown, { ...f, at: s.boomerang.place });
    else ask('rr-boomerang', BOOMERANG.unknown.map(x => ({ ...x, q: 'A Boomerang sent you back. How much did that cost you?' })), f);
  }
  // the team they couldn't stand
  // (a team they clashed with more than once: one row isn't a rivalry)
  if (s.rival?.names?.length && s.rival.n >= 2 && out.length < 4) {
    ask('rr-rival', s.rival.theyStarted ? RIVAL.started : RIVAL.mine, { ...f, rv: s.rival.names.join(' and ') }, s.rival.names[0]);
  }
  // a leg they won
  if (s.won?.length && out.length < 4) ask('rr-leg-won', LEG_WON, { ...f, where: s.won.at(-1) });
  // a fear they faced
  if (s.fear && out.length < 4) ask('rr-fear', FEAR, f);
  return out.slice(0, 5);
}
