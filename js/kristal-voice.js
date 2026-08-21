// The voices of Kristal-talKs.
//
// Design: docs/superpowers/specs/2026-08-21-kristal-talks-v2-design.md
//
// v1 had twelve generic answer lines shared across sixty episodes — no names,
// no numbers, no memory — and read as a template by the third card. This file
// is the fix: one VOICE STYLE per guest, derived from archetype and stats, and
// every bank written with FACT SLOTS so the answers touch the record the way
// Kristal's questions always did.
//
// ── STATS PICK TEXT, NEVER OUTCOMES ──
//
// Thresholds on stats are used here exactly as the house rules permit: to
// select narration. Nothing in this file touches a listener count, a tier or
// a follower — the parity test in tests/kristal.test.js holds that door shut.
//
// ── NO SLOT PRINTS EMPTY ──
//
// A variant is only eligible when every {slot} it names has a value. A bank
// where nothing is eligible falls back to the style's plain lines, which use
// no slots at all. "undefined, Kristal. undefined votes." can never print.

// Deterministic pick — the same episode reads the same way forever.
function hash(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pickFrom = (list, key) => list && list.length ? list[hash(key) % list.length] : null;

const SLOT_RE = /\{(\w+)\}/g;
const slotsOf = t => [...String(t).matchAll(SLOT_RE)].map(m => m[1]);
const fill = (t, facts) => String(t).replace(SLOT_RE, (_, k) => facts[k] ?? '');

/** Pick a variant whose every slot is fillable; fall back to slotless lines. */
function pickFilled(bank, key, facts) {
  const ok = (bank || []).filter(t => slotsOf(t).every(k => facts[k] !== undefined
    && facts[k] !== null && facts[k] !== ''));
  const line = pickFrom(ok.length ? ok : (bank || []).filter(t => !slotsOf(t).length), key);
  return line ? fill(line, facts) : '';
}

// ── the styles ──────────────────────────────────────────────────────────
//
// Priority order matters: a villain with temperament 1 is a hothead first,
// and anyone with mental 2 rambles whatever the archetype says.

export const STYLES = ['rambler', 'hothead', 'bomb', 'chaos', 'analyst',
  'charmer', 'earnest', 'deadpan'];

export function styleOf({ archetype = '', stats = {} } = {}) {
  const s = stats || {};
  if ((s.mental ?? 5) <= 2) return 'rambler';
  if (archetype === 'hothead' || (s.temperament ?? 5) <= 2) return 'hothead';
  if (archetype === 'villain' || archetype === 'schemer') return 'bomb';
  if (archetype === 'chaos-agent' || archetype === 'wildcard') return 'chaos';
  if (archetype === 'mastermind' || (s.strategic ?? 5) >= 8) return 'analyst';
  if (archetype === 'social-butterfly' || archetype === 'showmancer'
    || (s.social ?? 5) >= 8) return 'charmer';
  if (archetype === 'hero' || archetype === 'loyal-soldier'
    || (s.loyalty ?? 5) >= 8) return 'earnest';
  if (archetype === 'floater' || archetype === 'goat' || (s.social ?? 5) <= 3) return 'deadpan';
  return (s.strategic ?? 5) >= 6 ? 'analyst' : (s.social ?? 5) >= 6 ? 'charmer' : 'deadpan';
}

// A style is only the cadence fallback. The actual voice keeps the exact
// archetype and every extreme stat, so two people who share a cadence do not
// collapse into the same speaker.
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

export function voiceOf({ archetype = '', stats = {} } = {}) {
  const values = Object.fromEntries(STAT_KEYS.map(k => [k,
    Number.isFinite(Number(stats?.[k])) ? Number(stats[k]) : 5]));
  const traits = STAT_KEYS.flatMap(k => values[k] >= 8 ? [`high-${k}`]
    : values[k] <= 3 ? [`low-${k}`] : []);
  return { archetype: archetype || 'custom', cadence: styleOf({ archetype, stats: values }),
    stats: values, traits };
}

// Exact archetypes contribute worldview. These are short additions rather
// than complete canned answers: the subject of the question still comes from
// the record, while the archetype changes what the guest notices about it.
const ARCHETYPE_LAYER = {
  mastermind: {
    win: 'I was always trying to leave myself more than one path forward.',
    out: 'My mistake was building a plan that worked on paper after the relationships had already changed.',
    conflict: 'I kept treating the disagreement like a problem to solve when it had become personal.',
    bts: 'Most of my game happened in small conversations that only made sense when you put them together.',
  },
  schemer: {
    win: 'I made short-term deals and knew which ones I was actually prepared to keep.',
    out: 'Eventually too many people had compared the different promises I made them.',
    conflict: 'We both knew the relationship was useful before either of us believed it was trustworthy.',
    bts: 'The episodes showed the flips, but not how long I spent preparing somewhere else to land.',
  },
  hothead: {
    win: 'I played emotionally, but emotion also told people exactly where I stood.',
    out: 'Once I felt cornered, I reacted before I understood what the room was doing.',
    conflict: 'I let the argument become more important than the decision underneath it.',
    bts: 'There was usually a long buildup before the reaction that made the episode.',
  },
  'challenge-beast': {
    win: 'Winning challenges gave me options, but it also meant I rarely got to look harmless.',
    out: 'Once I was vulnerable, nobody wanted to give me another chance to win safety.',
    bts: 'Training and recovery shaped more of my routine than the episodes had time to show.',
  },
  'social-butterfly': {
    win: 'The casual conversations were my information network; they were never just small talk.',
    out: 'I confused being liked with people being willing to risk their games for me.',
    conflict: 'I tried to keep everyone comfortable for so long that the honest conversation came too late.',
    bts: 'A lot of my strategy looked like friendship because the friendship was part of the strategy.',
  },
  'loyal-soldier': {
    win: 'Keeping my word made me predictable, but it also made people willing to build plans with me.',
    out: 'I stayed loyal after that loyalty stopped being good for my position.',
    conflict: 'What hurt was not the move itself; it was realizing the promise meant more to me than it did to them.',
    bts: 'I had opportunities to change sides. I chose not to, and that choice was part of my game.',
  },
  wildcard: {
    win: 'I changed direction quickly, which was risky but made it difficult to plan around me.',
    out: 'Eventually my flexibility looked like unreliability to everyone else.',
    conflict: 'I acted on instinct, then had to explain a decision I had barely explained to myself.',
    bts: 'Some choices looked random because the quick calculation behind them never made the episode.',
  },
  'chaos-agent': {
    win: 'I created uncertainty on purpose because settled groups did not leave much room for me.',
    out: 'The disruption stopped being useful once everyone agreed I was the common problem.',
    conflict: 'I pushed the tension because it benefited me, and then lost control of where it went.',
    bts: 'Not every argument was accidental; sometimes I needed people looking at each other instead of me.',
  },
  floater: {
    win: 'Staying flexible let me work with the majority without pretending I controlled it.',
    out: 'I stayed out of danger, but I also waited too long to build something that belonged to me.',
    conflict: 'I avoided choosing a side until both sides stopped trusting me.',
    bts: 'My game was mostly listening, adjusting and knowing when not to become the subject of the room.',
  },
  underdog: {
    win: 'Being underestimated gave me time, but I still had to do something useful with it.',
    out: 'I spent so much time surviving the immediate danger that I never secured the round after it.',
    conflict: 'I was used to defending my place in the game, so I sometimes heard disagreement as dismissal.',
    bts: 'The difficult days mattered because surviving them changed how the others saw me.',
  },
  hero: {
    win: 'I wanted to win without becoming someone I would dislike afterward.',
    out: 'I knew the principled choice was not always the safest one, and I made it anyway.',
    conflict: 'I was defending someone else, but I can admit I made the situation harder by assuming I was morally right.',
    bts: 'Some decisions only make sense if you understand who I felt responsible for protecting.',
  },
  villain: {
    win: 'I was willing to be the visible threat if it meant other people were reacting to my game.',
    out: 'I made enemies openly and eventually gave them enough common ground to work together.',
    conflict: 'I knew I was escalating it. At the time, I believed backing down would cost me more.',
    bts: 'The confrontations were real, but so were the smaller relationships that kept me safe afterward.',
  },
  goat: {
    win: 'People underestimated how much information reaches the person nobody considers dangerous.',
    out: 'I let other people define my role and waited too long to show that I had a game of my own.',
    conflict: 'I avoided confrontation so completely that people started making decisions for me.',
    bts: 'I understood more than I said, but understanding something privately is not the same as acting on it.',
  },
  'perceptive-player': {
    win: 'Reading the room early gave me time to respond before a plan became fixed.',
    out: 'I noticed the warning signs and then talked myself out of trusting them.',
    conflict: 'I could tell their explanation was incomplete, but knowing that did not tell me what they were hiding.',
    bts: 'Small changes in tone and routine told me more than the formal strategy meetings did.',
  },
  showmancer: {
    win: 'My closest relationship was emotional and strategic at the same time; separating those would be dishonest.',
    out: 'Once everyone treated us as one unit, either of us being dangerous made both of us vulnerable.',
    conflict: 'I was protecting a relationship as well as a game, and that made compromise much harder.',
    romance: 'What we felt was real, even when the choices around it were strategic.',
    bts: 'The relationship included ordinary, quiet moments that explain more than the dramatic scenes do.',
  },
};

// Stats contribute the substance of an answer. High and low values are both
// voices: low strategy or social skill should be audible, not treated as an
// absence of characterization.
const STAT_LAYER = {
  out: {
    'high-strategic': 'I understood the plan, but I kept checking whether it still made sense instead of whether the people were still committed to it.',
    'low-strategic': 'I did not have a real backup once the vote moved. I kept asking the same people for a different answer.',
    'high-social': 'I thought my relationships would turn into votes when I needed them. Most did, but not enough.',
    'low-social': 'I stayed close to too few people, so when I needed help there was no deeper relationship to call on.',
    'high-loyalty': 'I protected people because I had given them my word, even after that stopped helping my game.',
    'low-loyalty': 'I changed sides often enough that everyone could imagine me doing it to them next.',
    'high-boldness': 'I pushed the move too openly and gave the opposition a clear reason to organize.',
    'low-boldness': 'I waited for someone else to begin the move I needed, and nobody did.',
    'high-intuition': 'I felt the room change and convinced myself not to trust the feeling.',
    'low-intuition': 'I missed the warning signs because people kept speaking to me as if everything were normal.',
    'low-temperament': 'I let one argument define the entire round, and people voted based on how that made them feel.',
    'high-temperament': 'I stayed calm, but that also made people think I was comfortable when I should have been asking harder questions.',
    'high-physical': 'Challenge strength kept me safe before, but the first vulnerable round gave everyone the same opportunity.',
    'high-endurance': 'I had relied on being able to outlast the danger physically. That round required relationships instead.',
  },
  win: {
    'high-strategic': 'I kept several possible endgames open until I knew which one I could actually reach.',
    'low-strategic': 'I did not map out the whole season. I focused on the next decision and leaned on people I trusted.',
    'high-social': 'People shared information with me because our relationships felt personal, not transactional.',
    'low-social': 'I was never the center of the room, so I learned to work through a few dependable relationships.',
    'high-loyalty': 'Keeping my commitments limited some options, but it made the commitments I did offer valuable.',
    'low-loyalty': 'I treated every agreement as something that had to keep earning its place in my game.',
    'high-boldness': 'When the safe option would only delay the danger, I took the larger risk.',
    'low-boldness': 'I rarely needed credit for a move. Staying underestimated was more useful.',
    'high-intuition': 'I often felt a shift before anyone confirmed it, and this time I acted on that feeling.',
    'high-physical': 'Winning when I needed safety gave the rest of my game time to work.',
    'high-endurance': 'Being able to last through difficult challenges gave me control over a few crucial rounds.',
  },
  conflict: {
    'high-loyalty': 'I expected the same loyalty I was offering, and I took the difference personally.',
    'low-loyalty': 'I understood why they chose themselves because I would have done the same thing.',
    'high-social': 'I kept trying to preserve the relationship after the strategic trust had already gone.',
    'low-social': 'I avoided the direct conversation until both of us were relying on assumptions.',
    'low-temperament': 'Once I felt attacked, I stopped listening for the part that might have been true.',
    'high-temperament': 'I stayed controlled in the moment, but being calm did not mean I was unaffected.',
    'high-intuition': 'I knew their explanation was incomplete; I just misread what they were protecting.',
    'low-intuition': 'I believed the first explanation because I did not see what had already changed underneath it.',
  },
  romance: {
    'high-loyalty': 'Once I committed to the relationship, protecting it became part of every decision I made.',
    'low-loyalty': 'The relationship was real, but I never believed it removed our responsibility to play separate games.',
    'high-social': 'We understood each other quickly, and that closeness made it impossible to look like two independent players.',
    'low-social': 'It was one of the few relationships where I felt completely comfortable, which made me depend on it too much.',
  },
  bts: {
    'high-mental': 'I spent a lot of time organizing information and replaying conversations before I acted.',
    'low-mental': 'I processed the game by talking it through, so the shorter edit made some decisions look more sudden than they were.',
    'high-strategic': 'Most plans went through several quiet versions before the decisive conversation viewers saw.',
    'low-strategic': 'A lot of my decisions came from immediate conversations rather than a season-long plan.',
    'high-social': 'The everyday conversations were how I maintained relationships and learned where the room was moving.',
    'low-social': 'I spoke most openly with a small circle, so much of my game happened away from the larger group.',
    'high-physical': 'The preparation, soreness and recovery between challenges affected more of the social game than viewers could see.',
    'high-endurance': 'Long challenge days changed who had energy left to talk strategy afterward, and that rarely made the episode.',
  },
  life: {
    'low-temperament': 'I reacted quickly and publicly before I had worked out what I was actually feeling.',
    'high-temperament': 'I processed most of it privately, which people sometimes mistook for not caring.',
    'high-mental': 'I kept trying to understand it before allowing myself to feel it, and that only worked for so long.',
    'low-mental': 'It took time and several conversations before I could put the experience into words.',
    'high-social': 'I got through it by letting people close to me know when I needed support.',
    'low-social': 'My instinct was to withdraw, and learning to ask for help was part of getting better.',
  },
};

// ── the answer banks ────────────────────────────────────────────────────
//
// Topic groups: win, out (a loss or a boot — {placement} carries which),
// conflict ({rival}), romance ({partner}), bts, life, response ({quotedName}).
// Two to four variants per style per group; slots ground them in the record.

const A = {
  bomb: {
    win: [
      'I won {season}, and some people still call it luck. I had {votes} votes cast against me across the season and kept finding a way through. That wasn’t an accident.',
      'I didn’t need everyone to like me. I needed to understand what they wanted and make sure voting me out felt worse than keeping me.',
      'I’m proud of the win. I made mistakes, but when the game turned against me, I didn’t disappear.',
    ],
    out: [
      'I finished in {placement} place because I made myself impossible to ignore. That gave me influence, but it also gave everyone a reason to compare notes.',
      'By the time I left {season}, I had received {votes} votes across the game. I survived the earlier ones and got too comfortable thinking I could do it again.',
      'I went out in {placement} place. I was angry, but the move made sense for them. I would have been difficult to beat at the end.',
    ],
    conflict: [
      '{rival} and I wanted control of the same room. Once we both realized that, every conversation became a contest.',
      'People want me to say {rival} and I are completely fine now. We’re civil, but that isn’t the same thing.',
      'I said things about {rival} that were unfair. I can own that without pretending the underlying conflict wasn’t real.',
    ],
    romance: [
      '{partner} knew I was playing hard, and I knew they had their own game. The relationship was real, but neither of us stopped being a player.',
      'People say I used {partner}. I understand why it looked that way, but they made their own decisions and challenged me more than viewers saw.',
    ],
    bts: [
      'The episodes showed the arguments, but not always the conversations afterward. I apologized more than the edit suggested, even when I still thought I was right.',
      'A lot of my quieter relationships were missing. Without those conversations, some of my votes looked much more sudden than they felt in the game.',
    ],
    life: [
      'You want the version I didn’t post? It was worse and better than the internet decided, in that order.',
      'Everyone had a take on my year. None of them were in the room for any of it, and I’m done being polite about that.',
    ],
    response: [
      'I heard what {quotedName} said. It’s a confident version of events, but it leaves out the decisions they made before I reacted.',
      '{quotedName} is entitled to remember it that way. I remember a conversation where we both knew the trust was already gone.',
    ],
  },
  analyst: {
    win: [
      'People call parts of it luck, and some of them were. But earning {jury} jury votes came from keeping several paths open until I knew which one I needed.',
      'I felt the game shift in my favor a few rounds before the finale. I still had to get there, but that was when the endgame became realistic.',
      'I tried to make every decision solve more than one problem: improve my position, protect a relationship and leave me another option if it failed.',
    ],
    out: [
      'I understood the threat, but I acted one round too late. That timing error is the simplest explanation for my {placement}-place finish.',
      'I treated {rival} as predictable because that made my plan easier. They weren’t, and I didn’t adapt quickly enough.',
      'I received {votes} votes across the season. Each one was information, but I didn’t always interpret that information correctly.',
    ],
    conflict: [
      '{rival} and I valued different things. I kept treating the conflict like a strategic problem when, for them, it had become personal.',
      'My mistake with {rival} was assuming they would choose the move I considered optimal. They had different priorities, and I should have accounted for that.',
    ],
    romance: [
      'My connection with {partner} wasn’t planned. Once it happened, I had to consider how it affected both of our games.',
      'It was real, and it sometimes helped us strategically. Those two things can be true at the same time.',
    ],
    bts: [
      'The episodes compressed a lot of planning into one decisive conversation. Most moves took several smaller talks and a lot of checking where people stood.',
      'Viewers saw the final plan, but not every version we abandoned first. That made some decisions look cleaner than they actually were.',
    ],
    life: [
      'The year went to plan, which makes terrible television, which is why nobody covered it accurately.',
      'It happened, I processed it, I moved. People think that’s cold. It’s just fast.',
    ],
    response: [
      '{quotedName}’s version makes sense from their perspective, but they’re working with information I deliberately kept from them.',
      'I listened to the episode. I agree with their timeline; I disagree with what they think motivated me.',
    ],
  },
  hothead: {
    win: [
      'I won, and I’m proud of that. I’m also still frustrated by how some people treated me along the way. Winning didn’t erase it.',
      'I felt pushed throughout {season}, so I pushed back. Sometimes that helped my game, and sometimes I made things harder for myself.',
    ],
    out: [
      'I received {votes} votes across the season, and some came from people I had protected. That’s the part I had trouble accepting.',
      'I told everyone I was fine with {placement} place, but I wasn’t. I thought I had more game left to play.',
    ],
    conflict: [
      '{rival} knew exactly what would upset me, and I kept giving them the reaction they wanted. I wish I had handled that differently.',
      'I’m still waiting for an honest conversation with {rival}. I don’t need a public apology; I need them to stop pretending nothing happened.',
    ],
    romance: [
      '{partner} and I were real, but everyone else had to consider us strategically. I hated that at the time, although now I understand why they did.',
    ],
    bts: [
      'The edit showed me losing my temper, but often skipped the slower buildup. That context doesn’t excuse every reaction, but it does explain some of them.',
      'I had calm conversations too. They weren’t as dramatic, so viewers mostly remember the arguments.',
    ],
    life: [
      'The year was difficult, and I didn’t handle every part of it well. I’m trying to be honest about that instead of getting defensive.',
      'I’m in a better place now. I’ve found healthier ways to deal with the anger instead of letting it decide what I say.',
    ],
    response: [
      'I heard {quotedName}. My first reaction was anger, but the real issue is that their version leaves out why I stopped trusting them.',
    ],
  },
  charmer: {
    win: [
      'Winning {season} was wonderful. Seeing people like {rival}, who had every reason to doubt me, respect the game afterward meant a lot too.',
      'Everyone says the social game isn’t a real game until it beats them. Then suddenly it’s all anyone wants to talk about.',
    ],
    out: [
      'My relationships helped me reach {placement} place, but eventually people realized those same relationships could make me dangerous at the end.',
      'I had {votes} votes cast against me across the season. Being well liked bought me time, but it couldn’t protect me forever.',
    ],
    conflict: [
      '{rival} and I could make each other laugh and furious in the same conversation. That made the conflict more complicated than it looked.',
      'I don’t hate {rival}. We don’t need to be friends, but I can understand why they played the way they did.',
    ],
    romance: [
      'I knew the cameras were watching, but my feelings for {partner} weren’t something I could switch off for the game.',
      '{partner} is part of my past now. I can appreciate what we had without pretending it was meant to last forever.',
    ],
    bts: [
      'A lot of the everyday humor was cut. Those lighter moments explain why people trusted each other even after difficult votes.',
      'Everyone was kinder and messier than the edited episodes had time to show. The relationships were rarely as simple as the story made them look.',
    ],
    life: [
      'The year? Busy, beautiful, occasionally on fire. I read everything people wrote and kept only the compliments.',
      'Life’s good. The people who mattered showed up and the people who didn’t made great cautionary tales.',
    ],
    response: [
      'I’m glad {quotedName} talked about it. I don’t agree with their whole version, but at least we’re finally having the conversation.',
    ],
  },
  earnest: {
    win: [
      'I still feel a bit guilty about winning {season}, honestly. A lot of good people had to lose for that to happen and I sat with that.',
      'I didn’t outplay anyone. I just kept my word the whole way, and it turned out keeping your word IS a strategy.',
    ],
    out: [
      'Going out in {placement} place hurt, I won’t pretend otherwise. I respected the move, but it took time before I could separate that from how betrayed I felt.',
      'I knew the vote was coming. I could have fought dirtier. I decided who I wanted to be instead, and I’d decide it again.',
    ],
    conflict: [
      'Me and {rival}… look, I don’t think {rival} is a bad person. I think the game makes good people do loud things.',
      'I’ve forgiven {rival}. I know that’s a boring answer. It took real work, which is the un-boring part.',
    ],
    romance: [
      'What {partner} and I had was real. Whatever happened after, nobody gets to take the real part away.',
    ],
    bts: [
      'The episodes had less room for the quiet kindness between us. People checked on each other after difficult days, even when they were on opposite sides of the game.',
    ],
    life: [
      'It’s been a lot, honestly. Some of it wonderful, some of it I’m still carrying. I’m okay — genuinely, not press-release okay.',
      'The people who mattered showed up. That’s the whole story, and it’s better than the drama.',
    ],
    response: [
      'I heard what {quotedName} said, and I’m not going to return fire. I’ll just say: I remember it differently, and I sleep well.',
    ],
  },
  deadpan: {
    win: [
      'I won. People keep asking how it felt. It felt like winning.',
      'Everyone had a strategy. Mine was fewer words. Worked.',
    ],
    out: [
      '{placement} place. I wanted to go farther, but I understand why they didn’t let me.',
      'They voted me out because keeping me no longer helped their games. It was disappointing, not mysterious.',
    ],
    conflict: [
      '{rival} raised their voice. I shut down. Neither response helped the conversation.',
      'The feud with {rival} was mostly a failure to communicate. Neither of us made much effort to fix it.',
    ],
    romance: [
      'People made a lot of assumptions about me and {partner}. We were close. Not every close relationship needs a bigger label.',
    ],
    bts: [
      'Most of the quiet strategy was cut. I talked more than the episodes suggest, just not usually in large groups.',
    ],
    life: [
      'It happened, it’s handled, and I’m sleeping fine. Next question.',
      'Life’s quieter than the show. That took some getting used to. Then it took some being grateful for.',
    ],
    response: [
      '{quotedName} remembers it differently. I don’t think either of us is going to change the other person’s mind.',
    ],
  },
  chaos: {
    win: [
      'Honestly, I changed my mind a lot in {season}. That made me hard to predict, but it also meant I had to keep repairing relationships. Somehow, I did enough of that to win.',
      'I didn’t follow one perfect plan. I reacted to what was happening, took a few risks and got lucky when I needed to. I can admit that now.',
    ],
    out: [
      'I went out in {placement} place because people stopped knowing what I would do next. That was useful early on and dangerous later.',
      'They called me unpredictable, and they weren’t wrong. I just didn’t realize how exhausting that had become for everyone else.',
    ],
    conflict: [
      'Things with {rival} got out of hand. We both kept pushing because neither of us wanted to be the first person to back down.',
      'I probably started more of it than I admitted at the time. {rival} still knew exactly how to keep it going.',
    ],
    romance: [
      '{partner} and I surprised each other. We were very different, but in that environment that gave us somewhere to breathe.',
    ],
    bts: [
      'A lot of the quieter conversations were cut. I looked completely impulsive on screen, but I did check in with people before some of those decisions.',
    ],
    life: [
      'It has been messy. I made a few decisions too quickly, then had to slow down and work out what I actually wanted.',
    ],
    response: [
      'I heard what {quotedName} said. Some of it was fair, but they left out the part where we were both contributing to the mess.',
    ],
  },
  rambler: {
    win: [
      'The win still feels strange. I keep thinking about all the small conversations that got me there, because it wasn’t one move. It was a lot of little things adding up.',
      'People focus on the finale, but I think I won much earlier, when the others started trusting me with information they weren’t sharing with each other.',
    ],
    out: [
      'The vote that sent me out was confusing because I thought the target had shifted. Looking back, I was hearing what I wanted to hear instead of checking the numbers.',
      'I can explain how I ended up in {placement} place, but it starts a few rounds earlier. I let one bad read shape every decision after it.',
    ],
    conflict: [
      '{rival} and I had been irritating each other for a while before the big argument. The argument was just the first time everyone else saw it.',
    ],
    romance: [
      '{partner} and I connected quickly, which was comforting and also made us an obvious pair. We knew that; we just didn’t know how to hide it.',
    ],
    bts: [
      'What viewers missed was how much time we spent talking through decisions before challenges. The episode makes everything look sudden, but it rarely felt sudden to us.',
    ],
    life: [
      'This year has been complicated. I keep wanting to tell it in order, but the honest version is that some good things and some difficult things happened at the same time.',
    ],
    response: [
      'I listened to {quotedName}’s episode. I understand why they remember it that way, but there’s a lot of context missing from their version.',
    ],
  },
};

// ── Kristal ─────────────────────────────────────────────────────────────
//
// She presses differently depending on who is in the chair — a charmer gets
// out-charmed, an analyst gets audited — which is the sass made mechanical.

const PRESS = {
  bomb: [
    'That sounds good, but it doesn’t answer the question. What actually happened?',
    'I’ve heard the public version. What were you thinking in the moment?',
  ],
  analyst: [
    'Walk me through that decision. Who did you think was with you?',
    'That’s the conclusion. How did you get there?',
  ],
  hothead: [
    'Take a second. What part of it still makes you angry?',
    'I hear that you’re angry. I’m asking who you felt betrayed by.',
  ],
  charmer: [
    'You’re making it sound easy. What was the part you couldn’t charm your way through?',
    'That’s a very polished answer. Give me the less polished one.',
  ],
  earnest: [
    'I believe you’ve made peace with it. What did it feel like when it happened?',
    'You can forgive someone and still be honest about what they did. What happened?',
  ],
  deadpan: [
    'Can you give me a little more than that?',
    'What are you leaving out?',
  ],
  chaos: [
    'Hold on. Before we go somewhere else, answer the question I asked.',
    'We’ll come back to that. First, what actually made you do it?',
  ],
  rambler: [
    'Let me stop you there. What’s the short version?',
    'There’s a lot of context. What was the moment that changed things?',
  ],
};

// The crack: the second answer, after the press, where the fact lands.
const CRACK = {
  bomb: [
    'Fine. I knew {rival} was pulling away, but confronting them would have exposed how little control I had. So I acted like I wasn’t worried.',
    'The honest answer is that some of those {votes} votes were personal. I pushed people too hard, and eventually they had a chance to respond.',
  ],
  analyst: [
    'I thought I had the numbers until {rival} moved. Once I realized it, I decided not to start a fight I couldn’t win. That choice protected my jury relationships, but it cost me control.',
    'I made one important read based on loyalty instead of self-interest. In {season}, that was enough to undo the rest of my plan.',
  ],
  hothead: [
    'What still bothers me is that it was {rival}. I defended them when other people warned me, so I’m angry at them and at myself for not listening.',
  ],
  charmer: [
    'Honestly, it wasn’t all charm. I knew what {rival} was doing, but staying friendly kept me included long enough to find another option.',
    'The less polished version is that {rival} got under my skin. I kept smiling because I didn’t want them to know how worried I was.',
  ],
  earnest: [
    'At the time, it felt like {rival} looked me in the eye and lied to me. I trusted them as a friend, not just as an ally, and that’s why it hurt.',
  ],
  deadpan: [
    '{rival} made the move. Most of us knew it, but saying it aloud would have forced us to choose a side.',
  ],
  chaos: [
    'The short version is that I took the risk on purpose. I didn’t know exactly how it would end, but it wasn’t an accident.',
  ],
  rambler: [
    'The short version is that I stopped trusting {rival}, but I kept trying to explain away the warning signs because I needed them in the game.',
  ],
};

// A press on THE YEAR cannot crack about the season — the first live read
// had a catch-up guest confessing about vote counts nobody had asked about.
const CRACK_LIFE = {
  bomb: ['The honest answer is that I made the first move. I didn’t expect the reaction to become as big as it did, but I can’t pretend I had nothing to do with it.'],
  analyst: ['I saw some of it coming and made plans for it. What I didn’t understand was how different it would feel once it was actually happening.'],
  hothead: ['I wasn’t okay for a while. I kept saying I was angry because that was easier than admitting I was hurt.'],
  charmer: ['I smiled through a lot of it. That helped me get through the day, but it also kept people from realizing when I needed help.'],
  earnest: ['At the time I kept telling everyone I was fine. I wasn’t. I’m doing better now, but getting here took longer than I admitted.'],
  deadpan: ['It was difficult for a while. It’s better now. I don’t have a cleverer way to say it.'],
  chaos: ['I reacted before I understood what I was feeling. Some choices helped and some made everything harder, but at least I know that now.'],
  rambler: ['The short version is that it hurt more than I let people see. I kept talking around it because saying that plainly felt harder.'],
};

const COLD_OPEN = {
  debrief: [
    'Welcome back to Kristal-talKs. My guest tonight is {guest}, and we’re going back through their time on {season}. Thanks for being here.',
    'If you watched {season}, you know tonight’s guest left us with a few questions. {guest}, welcome to the podcast.',
    'Today I’m joined by {guest}. We’re talking about the decisions we saw, the conversations we didn’t and what they think of it all now.',
  ],
  life: [
    'Today’s episode is a little different. {guest} is here to talk about what life has looked like since the show and what they haven’t said publicly yet.',
    'A lot has been said about {guest} this year. Today, they get to tell the story in their own words. Welcome back.',
  ],
  returning: [
    '{guest} is back for appearance number {visit}. A lot has changed since our last conversation, so let’s catch up.',
    'Welcome back, {guest}. Last time we spoke, there were still a few unfinished conversations. Let’s see where they stand now.',
  ],
};

// ── rapid fire ──────────────────────────────────────────────────────────
//
// EVERY ANSWER IS WRITTEN FOR ITS QUESTION. The first version kept one answer
// pool per style and drew from it blind, so "Best liar you ever shared a room
// with?" could be answered "In a heartbeat." — twice, in one episode, with no
// name in sight. Now each question carries its own answers (fact-slotted, so
// the liar question actually names {rival} when the record has one) plus
// optional per-style overrides where the register earns a signature line.

const RAPID = [
  { q: 'Best liar you ever shared a room with?',
    a: ['{rival}. They could make a lie sound completely reasonable.', 'Probably me. I was better at it than I expected.', '{winner}. They knew when to tell the truth and when not to.'],
    s: { deadpan: ['{rival}.', 'Me.'], earnest: ['I hate saying it… {rival}.'],
      bomb: ['{rival}. They could tell you exactly what you wanted to hear.'] } },
  { q: 'Most overrated move in your season?',
    a: ['The move everyone calls a blindside. Most of us knew it was coming.', 'The move {winner} made near the end. It worked, but the edit made it look much harder than it was.', 'One of mine, honestly. It looked intentional because it happened to work.'],
    s: { analyst: ['The move people call strategic was mostly a close vote that happened to break the right way.'] } },
  { q: 'One word for the jury.',
    a: ['Bitter.', 'Generous.', 'Confused.'],
    s: { earnest: ['Fair.'], bomb: ['Inconsistent.'], chaos: ['Unpredictable.'] } },
  { q: 'Who cried the most off camera?',
    a: ['Everyone had a difficult day eventually.', 'Me, probably. I’m not embarrassed about it.', 'I shouldn’t say. It was {rival}.'],
    s: { hothead: ['Possibly me. I was angry and overwhelmed at the same time.'] } },
  { q: 'Would you return tomorrow?',
    a: ['In a heartbeat.', 'Yes, but I would play very differently.', 'My family would hate it, but I probably would.'],
    s: { deadpan: ['I would say no now. Ask me again when casting calls.'], chaos: ['Yes. I clearly didn’t learn enough the first time.'] } },
  { q: 'Rate your own edit out of ten.',
    a: ['Four. It missed too much of my game.', 'Eight. I didn’t always like it, but most of it was fair.', 'Six. It explains the {placement}-place finish, but not how I got there.'],
    s: { chaos: ['Six. Confusing, but honestly so was I.'], charmer: ['Nine. They understood which angles worked for me.'] } },
  { q: 'Who do you still talk to?',
    a: ['{partner}. We talk almost every day.', 'About half the cast. Some relationships lasted and some didn’t.', 'A small group. The full cast chat did not survive.'],
    s: { deadpan: ['Only a few people, which suits me.'] } },
  { q: 'One rule you’d add to the game?',
    a: ['No strategy conversations after midnight. Everyone needs sleep.', 'A time limit on private conversations. {rival} could disappear for hours.', 'Give the person who cooks a small advantage. It is harder work than people admit.'],
    s: { analyst: ['Reveal the vote count immediately. People play differently when they cannot hide behind uncertainty.'] } },
  { q: 'Delete one twist from history.',
    a: ['The one that contributed to my elimination. I’m biased.', 'Anything that removes a player without a vote.', 'The twist that had the least room for players to adapt.'],
    s: { chaos: ['I wouldn’t delete one. I’d probably add another, which explains a lot.'] } },
  { q: 'Unfinished business?',
    a: ['One honest conversation with {rival}.', 'I still want another chance to win.', 'Less than I used to have, but not none.'],
    s: { earnest: ['There is one person I never got to say a proper goodbye to.'] } },
];

const SUBJECT_COMMENTS = [
  'I was not in the room to answer any of this. Noted.',
  'Interesting episode. Interesting choices. Interesting that my name carried the whole hour.',
  'Enjoy the listens. My lawyer enjoyed them too.',
  'Half of that is not how it happened and the half that is sounds worse out of context.',
];

const LISTENER_COMMENTS = {
  close: ['knew every word of this already and it STILL got me', 'the chair never stood a chance 🤍', 'called them right after this dropped. we talked for two hours'],
  friend: ['ok this was actually a great listen', 'the rapid fire took me OUT', 'they sound exactly like this in real life, for the record'],
  rival: ['a very generous retelling', 'fascinating what got left out', 'the press was the only honest minute of the hour'],
};

// ── the composers ───────────────────────────────────────────────────────

const bank = (style, group) => (A[style] && A[style][group]) || A.deadpan[group] || [];

function answerFor(voice, style, group, key, facts, index) {
  const statGroup = group === 'response' ? 'conflict' : group;
  const traitBank = (voice?.traits || [])
    .map(trait => STAT_LAYER[statGroup]?.[trait])
    .filter(Boolean);
  // Alternate layers across the conversation. The first substantive answer
  // exposes stats; the next returns to cadence. This keeps both audible.
  const useTraits = traitBank.length && index % 2 === 0;
  const core = pickFilled(useTraits ? traitBank : bank(style, group), `${key}|core`, facts)
    || pickFilled(bank(style, group), `${key}|fallback`, facts);
  const archetypeLine = ARCHETYPE_LAYER[voice?.archetype]?.[group];
  // The first answer carries the exact archetype's worldview. Later answers
  // do not repeat it, which keeps the transcript conversational.
  return [core, index === 0 ? archetypeLine : ''].filter(Boolean).join(' ');
}

/**
 * Write the whole transcript for one episode.
 *
 * `ep` carries id/kind/topics/facts/style/tier; `prior` is the earlier episode
 * this one answers (continuity), if any; `visit` is which appearance this is.
 * Pure text — nothing here reads or writes a number the follower model uses.
 */
export function composeEpisode(ep, { words = {}, prior = null, visit = 1 } = {}) {
  const voice = ep.voice || {
    ...voiceOf({ archetype: ep.archetype || '', stats: ep.stats || {} }),
    cadence: ep.style || styleOf({ archetype: ep.archetype || '', stats: ep.stats || {} }),
  };
  const style = voice.cadence || ep.style || 'deadpan';
  const facts = ep.facts || {};
  const groupOf = t => t.id === 'the-win' ? 'win'
    : (t.id === 'the-loss' || t.id === 'the-boot' || t.id === 'the-target') ? 'out'
      : t.id === 'the-rivalry' ? 'conflict'
        : (t.id === 'the-showmance' || t.id === 'the-breakup') ? 'romance'
          : t.id === 'the-life' ? 'life' : 'bts';

  // Cold open: returning guests get recognised before anything else.
  const coBank = visit > 1 ? COLD_OPEN.returning : COLD_OPEN[ep.kind] || COLD_OPEN.debrief;
  const coldOpen = fill(pickFrom(coBank, ep.id + '|cold') || '', {
    ...facts, guest: ep.guestName, visit: String(visit),
  });

  // Continuity: the response exchange leads, because that is how Kristal
  // would open — with the clip.
  const topics = [...ep.topics];
  if (prior) topics.unshift({ id: 'the-response', about: prior.guest, quoted: prior });

  const pressBudget = ep.tier === 'viral' ? 2 : 1;
  let pressed = 0;
  // Juiciest first for the press decision, original order for reading.
  const juice = { 'the-response': 5, 'the-breakup': 4, 'the-rivalry': 3, 'the-target': 2 };
  const pressOn = new Set(topics
    .filter(t => (juice[t.id] || 0) > 0)
    .sort((a, b) => (juice[b.id] || 0) - (juice[a.id] || 0))
    .slice(0, pressBudget).map(t => t.id));
  if (!pressOn.size && topics.length) pressOn.add(topics[0].id);

  const exchanges = topics.slice(0, 4).map((t, i) => {
    const group = t.id === 'the-response' ? 'response' : groupOf(t);
    const f = { ...facts,
      about: t.about ? (facts.rivalName || t.about) : facts.rival,
      quotedName: t.quoted ? t.quoted.guestName : undefined };
    const q = t.id === 'the-response'
      ? fill(pickFrom([
        'Before we start, I want to play something {quotedName} said earlier this week: “{quote}” What do you think they got wrong?',
        '{quotedName} was here earlier and said, “{quote}” You’ve had time to hear it. What’s your response?',
      ], ep.id + '|rq'), { ...f, quote: t.quoted._lastCrack || t.quoted._lastAnswer || '' })
      : fill(pickFrom(QUESTIONS[t.id] || QUESTIONS['behind-the-scenes'], `${ep.id}|q|${i}`) || '', {
        ...f, players: words.players || 'players', player: words.player || 'player',
        exit: words.exit || 'voted out', season: facts.season,
      });
    const x = { topic: t.id, q,
      a: answerFor(voice, style, group, `${ep.id}|a|${i}`, f, i) };
    if (pressOn.has(t.id)) {
      const crackBank = t.id === 'the-life' ? CRACK_LIFE[style] : CRACK[style];
      x.press = pickFrom(PRESS[style], `${ep.id}|p|${i}`);
      x.crack = pickFilled(crackBank || [], `${ep.id}|c|${i}`, f);
      if (x.crack) pressed++;
      else { delete x.press; delete x.crack; }
    }
    return x;
  }).filter(x => x.q && x.a);

  // Rapid fire: four questions, seeded so an episode never repeats one, each
  // answered from ITS OWN bank — style override first, then the question's
  // general answers, with fact eligibility so {rival} lines need a rival.
  const start = hash(ep.id + '|rf') % RAPID.length;
  const rapid = Array.from({ length: 4 }, (_, i) => {
    const item = RAPID[(start + i * 3) % RAPID.length];
    const styled = pickFilled(item.s?.[style] || [], `${ep.id}|rfs|${i}`, facts);
    return { q: item.q,
      a: styled || pickFilled(item.a, `${ep.id}|rfa|${i}`, facts) || item.a[0] };
  });

  // What the clip everyone shares actually says — the last crack, or the
  // loudest answer. Continuity quotes read from here.
  const crackX = exchanges.filter(x => x.crack).pop();
  ep._lastCrack = crackX ? crackX.crack : null;
  ep._lastAnswer = exchanges.length ? exchanges[exchanges.length - 1].a : null;

  return { coldOpen, exchanges, rapid, pressed };
}

// Kristal's questions, kept from v1 and extended — hers were never the
// shallow half.
const QUESTIONS = {
  'the-win': [
    'You won {season}, but no winning game is perfect. What was the mistake that came closest to costing you?',
    'When people summarize your win, what part of your game do they usually miss?',
    'Was there a point when you knew you could win, or did you not believe it until the final vote?',
  ],
  'the-loss': [
    'Looking back, when do you think the game slipped away from you?',
    'The jury chose someone else. What would you change if you could replay one decision?',
  ],
  'the-boot': [
    'Let’s go back to the night you were {exit}. What did you understand too late?',
    'Who first made you realize the vote had turned against you?',
  ],
  'the-rivalry': [
    'You and {about} clashed throughout the season. What started it?',
    'How different was your relationship with {about} from what viewers saw?',
    'Even at your worst with {about}, was there any respect underneath the conflict?',
  ],
  'the-showmance': [
    'When did you realize your connection with {about} was becoming more than part of the game?',
    'Other {players} saw you and {about} as a pair. How much did that affect the way you played?',
  ],
  'the-breakup': [
    'You and {about} left the season together, but the relationship ended later. What changed outside the game?',
    'When you think about {about} now, what do you understand that you didn’t understand then?',
  ],
  'the-target': [
    'Your name came up repeatedly. When did you realize how often the other {players} were targeting you, and how did you keep surviving?',
  ],
  'the-life': [
    'A lot has happened this year. What do you want people to understand about it?',
    'Where does the story really begin for you?',
  ],
  'behind-the-scenes': [
    'What important part of your experience didn’t make it into the episodes?',
    'Before rapid fire, what is one thing viewers would understand differently if they had seen more of it?',
  ],
};

/** Listener comments: the graph decides who shows up; the subject always does
 *  on a viral episode — they were not in the room. */
export function episodeComments(ep, { ties = [], names = {} } = {}) {
  const out = [];
  if (ep.tier === 'viral' && ep.mentioned) {
    out.push({ slug: ep.mentioned, name: ep.mentionedName || names[ep.mentioned] || ep.mentioned,
      relation: 'subject', text: pickFrom(SUBJECT_COMMENTS, ep.id + '|subj') });
  }
  const ranked = ties.slice().sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  for (const t of ranked) {
    if (out.length >= 3) break;
    if (t.slug === ep.mentioned || t.slug === ep.guest) continue;
    const relation = t.weight >= 3 ? 'close' : t.weight > 0 ? 'friend' : 'rival';
    if (relation === 'rival' && hash(`${ep.id}|${t.slug}|skip`) % 2) continue;
    out.push({ slug: t.slug, name: names[t.slug] || t.slug, relation,
      text: pickFrom(LISTENER_COMMENTS[relation], `${ep.id}|lc|${t.slug}`) });
  }
  return out;
}
