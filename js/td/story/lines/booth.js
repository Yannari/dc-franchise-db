// ══════════════════════════════════════════════════════════════════════
// td/story/lines/booth.js — every voter, in the booth, saying why
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "we need to understand the reasoning of their votes, so we need
// to see all the votes, not just 2 or 3". DC shows each voter at the urn giving their
// reason with attitude ("Looks like it's time for you to head back to the convent.").
// td/story/tribal.js sorts each ballot's engine reason into WHY it was cast:
//   plan    following the group or the numbers        weak    the weak link / lost the challenge
//   threat  too strong, too liked, running the game    grudge  personal
//   flip    breaking from their own group              strike  heard {target} was coming for them
//   shield  keeping someone else safe                  self    {target} is the voter's pick, and
//                                                              the voter is the one going home
// a = the voter, {target} = who they wrote. Facts: register, band (a's bond with {target}),
// group / {group} (the plan's name, when a's group had one), sankT ({target} had the team's
// lowest score today), merged, late. One line, a's own words: it is a's confessional.

const L = (id, conf, when) => ({ id, ...(when ? { when } : {}), turns: [{ by: 'a', conf }] });

export default {
  'booth.plan': [
    L('bt.p1', "{target}. That's the plan, and I'm sticking to it."),
    L('bt.p2', "Everybody I trust is writing {target}. So I'm writing {target}."),
    L('bt.p3', "{group} said {target}. When the group says a name, you write the name.", { group: true }),
    L('bt.p4', "I don't love it. But the numbers are on {target}, and I'm not going to be the one who screws it up.", null),
    L('bt.p5', "Sorry, {target}. It's not personal. It's just where the votes are.", { band: ['friends', 'neutral'] }),
    L('bt.p6', "We agreed on {target}. If I flip now, I'm the next {target}.", null),
    L('bt.p7', "{target}. Done. Easy. Next.", { register: ['schemer', 'cool', 'competitor'] }),
    L('bt.p8', "I'm voting {target} because my people are voting {target}. That's the whole reason. That's enough.", { register: ['plain', 'competitor'] }),
    L('bt.p9', "I really hope this is the right call. {target}.", { register: ['sweet', 'shy'] }),
    L('bt.p10', "My hand's literally shaking. {target}. Okay. It's done.", { register: ['sweet', 'shy'] }),
    L('bt.p11', "{target}, you're a good person. That's why it has to be tonight, before I like you any more.", { band: 'friends' }),
    L('bt.p12', "Honestly? I don't even have a problem with {target}. But I've got a problem with going home, so.", null),
    L('bt.p13', "I'm writing {target} and I'm not losing sleep over it.", { register: ['fiery', 'schemer'] }),
    L('bt.p14', "{group} has stuck together this far. We're not breaking now. {target}.", { group: true }),
    L('bt.p15', "{target}. The plan was set this afternoon and I don't change plans at the last minute.", { register: ['cool', 'competitor', 'plain'] }),
    L('bt.p16', "Everyone said {target}, so here I am, writing {target}. Peer pressure works.", { register: ['plain', 'sweet'] }),
    L('bt.p17', "I'm doing what I said I'd do. {target}. People can trust my vote, and that's worth more than anything.", { register: ['plain', 'sweet', 'competitor'] }),
    L('bt.p18', "{target}. I'll say sorry on the way out. Probably.", { register: ['fiery', 'cool'] }),
    L('bt.p19', "Not my favourite vote. Still my vote. {target}.", null),
    L('bt.p20', "If I'm wrong about this, at least I'm wrong with everyone else. {target}.", null),
    L('bt.p21', "{target}. My group made the call. I made my peace with it on the walk over here.", { group: true }),
    L('bt.p22', "Sticking with the numbers. {target}.", { merged: true }),
    L('bt.p23', "This late in the game, you don't freelance. {target}.", { late: true }),
    L('bt.p24', "{target}, I'm sorry. I really am. I hope you get it.", { register: ['sweet', 'shy'], band: ['friends', 'neutral'] }),
    L('bt.p25', "{target}, nothing against you. Everything for me.", { register: ['schemer', 'cool'] }),
    L('bt.p26', "We talked about it. We counted twice. {target}.", null),
    L('bt.p27', "I just want tonight to go the way we planned. {target}. Please go the way we planned.", { register: ['sweet', 'shy', 'plain'] }),
    L('bt.p28', "{target}. I'm a team player. Tonight the team says {target}.", { merged: false }),
    L('bt.p29', "I'll write {target}, and tomorrow I'll find out if I was in the right group.", null),
    L('bt.p30', "{target}. Majority. Moving on.", { register: ['competitor', 'cool'] }),
  ],
  'booth.weak': [
    L('bt.w1', "{target}. We can't keep losing, and you were dead last today.", { sankT: true }),
    L('bt.w2', "Tribe comes first. {target} is the weakest link and everybody knows it.", { merged: false }),
    L('bt.w3', "{target}, you tried. Trying isn't enough out here.", null),
    L('bt.w4', "I want to win challenges. {target} doesn't help me win challenges. Simple.", { register: ['competitor', 'fiery'] }),
    L('bt.w5', "It's nothing personal, {target}. We just need people who can pull their weight.", { register: ['plain', 'sweet', 'competitor'] }),
    L('bt.w6', "{target}. I saw today. Everybody saw today.", { sankT: true }),
    L('bt.w7', "We lost because of {target}. I'm not going to pretend we didn't.", { sankT: true, register: ['fiery', 'competitor', 'plain'] }),
    L('bt.w8', "A strong team gets to the merge. {target} isn't making us strong.", { merged: false }),
    L('bt.w9', "Sorry, {target}. If we lose again, it'll be my name. Better yours tonight.", null),
    L('bt.w10', "{target}. Not because you're a bad person. Because you're a slow one.", { register: ['fiery', 'schemer'] }),
    L('bt.w11', "I feel bad. I do. {target} tries so hard. But we need to start winning.", { register: ['sweet', 'shy'] }),
    L('bt.w12', "Weakest player, easiest vote. {target}.", { register: ['schemer', 'cool'] }),
    L('bt.w13', "Every time we lose, it's because of somebody. Today it was {target}.", { sankT: true }),
    L('bt.w14', "{target}, you can cheer us on from home. We'll need it.", { register: ['schemer', 'fiery'], merged: false }),
  ],
  'booth.threat': [
    L('bt.t1', "{target}. You're too good at this, and that's a compliment."),
    L('bt.t2', "If {target} makes it to the end, {target} wins. So {target} doesn't make it to the end.", null),
    L('bt.t3', "Everyone likes {target}. Everyone. That's exactly the problem.", null),
    L('bt.t4', "{target}, you're running this game from behind the curtain. I see you. Bye.", { register: ['schemer', 'cool', 'fiery'] }),
    L('bt.t5', "I'd rather take my shot at {target} now than watch {target} take everyone else out later.", null),
    L('bt.t6', "{target} keeps winning. I'm tired of watching {target} win.", { register: ['competitor', 'fiery'] }),
    L('bt.t7', "Big threat, big move. {target}.", { merged: true }),
    L('bt.t8', "{target}, you're my biggest threat out here. Nothing personal. Actually, a little personal.", { register: ['fiery', 'competitor', 'schemer'] }),
    L('bt.t9', "{target} has too many friends. Friends turn into jury votes.", { late: true }),
    L('bt.t10', "I like {target}. I'd hate to lose to {target} at the end even more.", { band: 'friends' }),
    L('bt.t11', "Sorry, {target}. You're amazing at this game. That's why.", { register: ['sweet', 'plain', 'shy'] }),
    L('bt.t12', "This is the one. If we don't get {target} now, we never will.", null),
    L('bt.t13', "{target}. The smartest person out here. Which means the most dangerous.", { register: ['cool', 'schemer'] }),
    L('bt.t14', "Everybody's scared of {target} and nobody says it. I'm saying it with a pen.", { register: ['fiery', 'competitor'] }),
  ],
  'booth.grudge': [
    L('bt.g1', "{target}. You know what you did."),
    L('bt.g2', "I have wanted to write this name since day one. {target}. Finally.", { band: ['enemies', 'cold'] }),
    L('bt.g3', "{target}, you've been rubbing me the wrong way since we got here. Enjoy the trip home.", { register: ['fiery', 'schemer'] }),
    L('bt.g4', "Something about {target} just feels off. I'm not ignoring it any more.", { register: ['cool', 'plain', 'shy'] }),
    L('bt.g5', "{target}. This one's for me.", { band: ['enemies', 'cold'] }),
    L('bt.g6', "Bye, {target}. Don't let the door hit you.", { register: ['fiery', 'schemer'], band: ['enemies', 'cold'] }),
    L('bt.g7', "I don't trust {target}. I've never trusted {target}. Tonight I don't have to.", null),
    L('bt.g8', "{target}, it was never going to be anyone else.", { band: 'enemies' }),
    L('bt.g9', "I'm not proud of it, but this is personal. {target}.", { register: ['sweet', 'shy', 'plain'] }),
    L('bt.g10', "{target}, this is for every single thing you said to me out here.", { band: ['enemies', 'cold'] }),
    L('bt.g11', "{target}. I'd say it's strategy. It's not. I just really don't like you.", { register: ['fiery', 'competitor'] }),
    L('bt.g12', "There's a lot of reasons I could give. The real one is I can't stand {target}.", null),
  ],
  'booth.flip': [
    L('bt.f1', "Everyone thinks I'm writing someone else tonight. I'm writing {target}."),
    L('bt.f2', "My group's going one way. I'm going this way. {target}.", null),
    L('bt.f3', "I know what I said this afternoon. I'm saying something else now. {target}.", null),
    L('bt.f4', "{target}. If this works, I'm a genius. If it doesn't, I'm going home.", { register: ['schemer', 'fiery', 'competitor'] }),
    L('bt.f5', "I can't believe I'm doing this. {target}. Oh my gosh. Okay.", { register: ['sweet', 'shy'] }),
    L('bt.f6', "Time to make a move. {target}.", { register: ['cool', 'competitor', 'plain'] }),
    L('bt.f7', "Sorry, everybody. I've got my own plan. {target}.", null),
    L('bt.f8', "Loyalty to my group doesn't get me to the end. This does. {target}.", { register: ['schemer', 'cool'] }),
    L('bt.f9', "The plan was a name I couldn't write. So I'm writing {target}.", null),
    L('bt.f10', "Watch this. {target}.", { register: ['fiery', 'schemer'] }),
  ],
  'booth.strike': [
    L('bt.s1', "{target} was coming after me. I found out. Now I'm coming after {target} first."),
    L('bt.s2', "You don't organise against me and expect me to sit there. {target}.", { register: ['fiery', 'schemer', 'competitor'] }),
    L('bt.s3', "I heard my name came out of {target}'s mouth. So {target}'s name is coming out of my pen.", null),
    L('bt.s4', "{target}, you should have been quieter.", { register: ['cool', 'schemer'] }),
    L('bt.s5', "I didn't want to do this. {target} made me. {target} started it.", { register: ['sweet', 'shy', 'plain'] }),
    L('bt.s6', "Somebody told me {target} wants me gone. I believe them. {target}.", null),
  ],
  'booth.shield': [
    L('bt.sh1', "If I write {target}, my person stays safe. That's all that matters tonight."),
    L('bt.sh2', "{target} goes so someone I care about doesn't. That's the trade.", null),
    L('bt.sh3', "{target}. Better {target} than the person I'm protecting.", null),
    L('bt.sh4', "I'm not voting for {target}. I'm voting for my friend staying. Same thing, tonight.", { register: ['sweet', 'plain', 'shy'] }),
    L('bt.sh5', "The name everyone wanted was my ally's. I'm putting {target}'s down instead and hoping enough people join me.", null),
  ],
  'booth.self': [
    L('bt.x1', "{target}. If I'm going home, I'm taking a vote with me."),
    L('bt.x2', "I think it might be me tonight. If it is, at least my last vote says {target}.", null),
    L('bt.x3', "{target}. I'm still here, I'm still fighting, and I'm writing {target}.", { register: ['fiery', 'competitor'] }),
    L('bt.x4', "Please, please, please let this be enough. {target}.", { register: ['sweet', 'shy'] }),
    L('bt.x5', "{target}. I've done everything I can today. The rest isn't up to me.", { register: ['plain', 'cool'] }),
    L('bt.x6', "Everybody thinks I'm the easy vote. {target}. Let's see.", { register: ['schemer', 'cool', 'competitor'] }),
    L('bt.x7', "{target}. And if it's me tonight, it was a good run.", null),
    L('bt.x8', "I talked to everyone. I think I talked to everyone. {target}.", { register: ['sweet', 'shy', 'plain'] }),
  ],
};
