// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-booth2.js — the booth, from what each voter's day was
// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js roleOf: the vote scenes that aired say who ran a plan and the case they made,
// who was in on it, who got pitched, who had doubts. a = the voter, {target} = the name they write.
//   booth2.lead.<case>   a ran tonight's plan (or the other side's) on {target}, and made this case:
//                        coming ({target}'s side is after {mark}; markMe when that's a), sank (cost
//                        them the challenge), idol (a thinks {target} has one), pair ({target} and
//                        {partner} vote as one), group ({target} is with {theirs}), grudge, threat,
//                        outsider (nobody is close to {target}), numbers (the easy name); .any
//   booth2.with.<case>   a was in on {leader}'s plan, and heard that case; .any
//   booth2.swing.yes     {pitcher} worked on a, and a said yes
//   booth2.doubt.<holds|breaks>  a had doubts about the plan: holds (writes it anyway), breaks
//                        (writes {target}, another name)
// Facts: band (a with {target}: friends / neutral / cold / enemies), ally (a and {target} share an
// alliance), sankT, merged, late. The spearheader is sure of it; a friend's vote is a sad one; an
// enemy's is a mean one. Ids: 'nb2.'.

const B = (id, conf, when, v) => ({ id, ...(when ? { when } : {}), turns: [{ by: 'a', conf, ...(v ? { v } : {}) }] });

export default {
  // ── the person who ran it ──
  'booth2.lead.any': [
    B('nb2.l1', "I put this vote together myself, and I'm not nervous about it, so it's {target}.", null, { anxious: "I put this whole vote together, so if it goes wrong, it's on me. It won't go wrong, so it's {target}.", cruel: "I built this vote from nothing, and tonight I get to watch it work, so it's {target}." }),
    B('nb2.l2', "Everybody in this vote is here because I asked them to be. {target}, this one's mine.", null, { warm: "I asked everybody to trust me on this. {target}, I'm sorry, but I'm not sorry about the plan." }),
    B('nb2.l3', "I've been working on this since lunch. {target}, you never even saw it.", { band: ['cold', 'enemies'] }),
    B('nb2.l4', "{target}, you're a good person, and I still spent the whole day making sure you go home. That's the game.", { band: 'friends' }, { emotional: "{target}, I really like you, and I spent all day getting people to vote you out. I hate this game so much." }),
    B('nb2.l5', "I don't need to hope it works. I counted it, so it's {target}.", null, { dry: "I counted it twice, and then I counted the people who said they'd count it, so it's {target}.", goofy: "I counted it on my fingers, and then on my toes, just in case, so it's {target}." }),
    B('nb2.l6', "If this goes the way I planned, nobody's going to forget whose idea it was, so it's {target}.", { merged: true }, { schemer: "When they talk about the turning point of this game, they're going to be talking about tonight, and about me, so it's {target}." }),
    B('nb2.l7', "We've been in an alliance together, {target}, and I'm still the one who called this. I'm sorry it had to be me.", { ally: true }),
  ],
  'booth2.lead.coming': [
    B('nb2.c1', "You were coming for me, {target}, and I heard about it first. So here we are.", { markMe: true }, { tough: "You came for me, {target}. You just came slower than I did." }),
    B('nb2.c2', "{target}'s people wanted {mark} gone tonight. That's not happening on my watch.", { markMe: false }),
    B('nb2.c3', "{target} was planning my exit. I just finished planning {target}'s first.", { markMe: true }, { dry: "{target} had a plan for me. I had a better one for {target}." }),
  ],
  'booth2.lead.sank': [
    B('nb2.s1', "We lost today, and I'm not losing again because of {target}. I said it out loud this afternoon and I'll say it here.", { sankT: true }),
    B('nb2.s2', "I told everybody we need to start winning, and winning starts with {target} going home.", { merged: false }, { competitive: "I hate losing more than I like anybody here. {target}, you cost us today." }),
    B('nb2.s3', "{target} tried, I know. But I'm the one who had to stand up and say it, so I'll say it one more time: {target}.", { band: ['friends', 'neutral'] }),
  ],
  'booth2.lead.idol': [
    B('nb2.i1', "I'm pretty sure you've got something in your bag, {target}. If you play it, fine. If you don't, you're gone.", null, { schemer: "{target} thinks nobody saw, but I saw, so play it or go home, {target}." }),
    B('nb2.i2', "You don't leave somebody with an idol in the game if you can help it, so it's {target}.", null, { anxious: "If {target} has that idol and plays it, I'm in so much trouble, but I'm still writing {target}." }),
  ],
  'booth2.lead.pair': [
    B('nb2.p1', "{target} and {partner} vote together every single time. Tonight I break that up, so it's {target}.", null, { cruel: "{target}, {partner} is going to be so lonely tomorrow. Bye, {target}." }),
    B('nb2.p2', "Two votes walking around camp as one person. I can only take one of them tonight, so it's {target}.", null, { goofy: "{target} and {partner} are basically one person with two hats. I'm taking one of the hats, so it's {target}." }),
    B('nb2.p3', "I like {target}. I just can't let {target} and {partner} make it to the end together.", { band: ['friends', 'neutral'] }),
  ],
  'booth2.lead.group': [
    B('nb2.g1', "{theirs} thinks it runs this camp. Tonight it loses one, so it's {target}.", null, { tough: "{theirs} can stay angry about it tomorrow, so it's {target}." }),
    B('nb2.g2', "Every vote, {theirs} sticks together. So every vote, I take one of them out. Starting with {target}.", null, { schemer: "{theirs} is strong as a group. One at a time, it's not, so it's {target}." }),
  ],
  'booth2.lead.grudge': [
    B('nb2.r1', "I could say this is strategy. It isn't. {target}, I just really, really want you gone.", null, { blunt: "Strategy has nothing to do with it. I can't stand you, {target}.", warm: "I wish I could say this was strategy. It's not, it's just that {target} has made me miserable." }),
    B('nb2.r2', "I've been waiting all day to write this name, and wow, that felt good. {target}.", { band: ['cold', 'enemies'] }, { cruel: "{target}. I'm going to frame this piece of paper." }),
    B('nb2.r3', "{target}, everything you said to me this week, this is my answer to all of it.", { band: 'enemies' }, { loud: "{target}, THIS is my answer! All of it!" }),
  ],
  'booth2.lead.threat': [
    B('nb2.t1', "{target} wins this game if we let {target} stay. So I made sure we don't let {target} stay.", null, { dry: "Nobody else wanted to say it, so I said it. {target} wins if {target} stays." }),
    B('nb2.t2', "Everybody's scared of {target}, and nobody wanted to be the one to do something about it. Well, I did, so it's {target}.", null, { tough: "Everybody's scared of {target}. Not me, so it's {target}." }),
    B('nb2.t3', "I like {target}, I really do. I'd just like it even more watching from the jury bench, so it's {target}.", { band: 'friends', late: true }),
  ],
  'booth2.lead.outsider': [
    B('nb2.o1', "Nobody is going to fight for {target} tonight, and I knew that when I picked the name, so it's {target}.", null, { warm: "I feel bad, because {target} doesn't really have anybody here. That's also why it's {target}." }),
    B('nb2.o2', "{target} hasn't let anybody in since day one. So nobody's going to miss {target} when {target}'s gone.", null, { cruel: "{target}, nobody here is going to cry about this. Not even a little." }),
  ],
  'booth2.lead.numbers': [
    B('nb2.n1', "{target} is the vote that gets everybody on the same page tonight, so I made it {target}.", null, { schemer: "The easy name keeps everybody calm, and calm people vote the way I want them to, so it's {target}." }),
    B('nb2.n2', "I didn't need a big reason. I needed a name everybody could agree on, and that's {target}.", null, { dry: "It's not personal, it's arithmetic, so it's {target}." }),
  ],

  // ── the people the plan was told to ──
  'booth2.with.any': [
    B('nb2.w1', "{leader} said {target}, and I trust {leader}. That's my whole reason.", null, { anxious: "{leader} said {target}. Please let {leader} be right about this.", tough: "{leader} called it. I'm backing {leader}, so it's {target}." }),
    B('nb2.w2', "When {leader} brought it up this afternoon, I didn't love it. I'm still doing it, so it's {target}.", { band: ['friends', 'neutral'] }),
    B('nb2.w3', "{leader} has a plan, and I'm part of the plan. {target}, nothing personal.", null, { goofy: "I'm just a humble soldier in {leader}'s army, and the army says {target}." }),
    B('nb2.w4', "If {leader} is wrong about this, I'm going to hear about it all week, so it's {target}.", null, { dry: "If this goes wrong, I'm blaming {leader}. Loudly, so it's {target}." }),
    B('nb2.w5', "{target}, we've been in it together, and I'm writing your name because {leader} asked me to. I feel sick.", { ally: true }, { cruel: "We were in an alliance, {target}, and now we're really not." }),
    B('nb2.w6', "{target}. {leader} owes me for this one.", null, { schemer: "{target}. And now {leader} owes me, which is worth more than this vote." }),
  ],
  'booth2.with.coming': [
    B('nb2.wc1', "{leader} told me {target}'s side was coming for {mark}. That's enough for me, so it's {target}.", { markMe: false, markLeader: false }),
    B('nb2.wc3', "{leader} found out {target}'s side was coming for {leader.obj}, and {leader} came to me first. I'm with {leader}. {target}.", { markLeader: true }),
    B('nb2.wc4', "If {target} wants {leader} gone, {target} has to get through me first, so it's {target}.", { markLeader: true }, { tough: "Nobody comes for {leader} while I'm around, so it's {target}.", goofy: "I guess I'm {leader}'s bodyguard now, and I'm not even getting paid. {target}." }),
    B('nb2.wc2', "{leader} found out {target} was coming for me. So yes, I'm very happy to write {target} tonight.", { markMe: true }, { tough: "You were coming for me, {target}? Bad idea, so it's {target}." }),
  ],
  'booth2.with.sank': [
    B('nb2.ws1', "{leader} said what everybody was thinking. We lost because of {target}. So, {target}.", { sankT: true }),
    B('nb2.ws2', "{leader} wants a stronger team, and so do I. Sorry, {target}.", { merged: false }, { warm: "{target}, you tried so hard today, and I'm still doing this. I'm sorry." }),
  ],
  'booth2.with.idol': [
    B('nb2.wi1', "{leader} thinks {target} has an idol. If {leader}'s right, we're flushing it. If not, {target} goes home, so it's {target}."),
  ],
  'booth2.with.pair': [
    B('nb2.wp1', "{leader} said if we don't split up {target} and {partner} now, we never will. I believe it, so it's {target}."),
    B('nb2.wp2', "{target} and {partner} are cute together. They're also two votes, and I can only fix one tonight. {target}.", null, { goofy: "{target}, I'm sorry to be the one who breaks up the happy couple. Okay, I'm a little bit not sorry." }),
  ],
  'booth2.with.group': [
    B('nb2.wg1', "{leader} said {theirs} has the numbers if we don't act tonight. So we're acting tonight, and it's {target}."),
  ],
  'booth2.with.grudge': [
    B('nb2.wr1', "{leader} really doesn't like {target}. Honestly? Me neither, so it's {target}.", { band: ['cold', 'enemies'] }),
    B('nb2.wr2', "This is {leader}'s vendetta, not mine. But I'm in {leader}'s corner, so it's {target}.", { band: ['neutral', 'friends'] }),
  ],
  'booth2.with.threat': [
    B('nb2.wt1', "{leader} said if we don't get {target} now, {target} wins. I looked around, and {leader}'s right, so it's {target}."),
    B('nb2.wt2', "I didn't want to be the one to go after {target}. {leader} did that part. I just have to write it, so it's {target}.", null, { anxious: "{target} is going to be so mad at me. I'm doing it anyway, so it's {target}." }),
  ],
  'booth2.with.outsider': [
    B('nb2.wo1', "{leader} said nobody's going to fight for {target}. I hate that {leader} is right about that, so it's {target}."),
  ],
  'booth2.with.numbers': [
    B('nb2.wn1', "{leader} said it's the safest vote for all of us, and I like being safe, so it's {target}."),
  ],

  // ── the swing ──
  'booth2.swing.yes': [
    B('nb2.y1', "{pitcher} came and found me this afternoon and asked for my vote. {pitcher} has it, so it's {target}.", null, { schemer: "{pitcher} asked nicely, and {pitcher} is going to remember that I said yes, so it's {target}." }),
    B('nb2.y2', "I could have gone either way tonight. {pitcher} made the better case, so it's {target}.", null, { dry: "Two sides came to me today. {pitcher}'s pitch was shorter, so it's {target}." }),
    B('nb2.y3', "I told {pitcher} yes, and I meant it. Sorry, {target}.", { band: ['friends', 'neutral'] }, { emotional: "{target}, I'm so sorry. I told {pitcher} I'd do it, and I'm doing it." }),
    B('nb2.y4', "{pitcher} needed one more vote. Well, here it is: {target}.", null, { goofy: "{pitcher} needed a hero. I am that hero, so it's {target}." }),
    B('nb2.y5', "Honestly? I said yes to {pitcher} because I'd rather be on the side that wins, so it's {target}.", null, { tough: "{pitcher} has the numbers, and I'm not stupid, so it's {target}." }),
  ],

  // ── the doubts ──
  'booth2.doubt.holds': [
    B('nb2.d1', "I said I wasn't sure about this, and I'm still not sure, but I'm doing it anyway. {target}.", null, { anxious: "I'm not sure, I'm really not sure, but it's {target}. Oh no." }),
    B('nb2.d2', "Part of me wants to write a different name. The rest of me wants to still be here tomorrow, so it's {target}."),
    B('nb2.d3', "{target}, I went back and forth about you all day. I hope I picked right.", { band: ['friends', 'neutral'] }, { warm: "{target}, I really tried to talk them out of it, and I couldn't. I'm so sorry." }),
    B('nb2.d4', "If this blows up, I'm going to say I had doubts. I did have doubts, so it's {target}."),
  ],
  'booth2.doubt.breaks': [
    B('nb2.k1', "They gave me a name this afternoon, and I couldn't write it. So it's {target} instead.", null, { anxious: "I just can't do what they asked me to do, so it's {target}." }),
    B('nb2.k2', "Everybody's going to know it was me. I'm okay with that, so it's {target}.", null, { tough: "Let them find out it was me, so it's {target}." }),
    B('nb2.k3', "I told them I had doubts, and nobody listened, so tonight I'm listening to myself instead. {target}."),
  ],
};
