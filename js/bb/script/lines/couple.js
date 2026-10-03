// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/couple.js — a showmance in the house (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/showmance.js and showmance-arcs.js. Only a formal
// showmance plays these (gs.showmances), so they are rare; a spark has its
// own pools in social.js.
//
//   couple.hiding       a and b keep it quiet; c notices (bedroom)            scene
//   couple.blind        b warns a about {partner}, a's other half             scene
//   couple.third        a has lost b to the relationship; c is a new friend    scene
//   couple.risk         b is on the block; a, b's partner, campaigns           loyal | guarded
//   couple.fight        a and b fight; c hears it (bedroom)                    scene
//   couple.vote         a and b vote as one; c pitched them both               scene
//   couple.defined      a asks b what they are (bedroom)                       scene
//   couple.underground  a and b hide it on a's plan; c watches                 scene
//   couple.apart        a and b campaign separately; c was asked by both        scene
//   couple.leak         a told b something; c, b's partner, repeated it         scene
//   couple.jealous      a is jealous of how b talks to c (kitchen)             scene
//   couple.pressure     b is on the block; a, b's partner, falls apart          scene

export default {
  'couple.hiding.scene': [
    { id: 'ch.1', turns: [{ by: 'a', say: "Nobody knows." }, { by: 'b', say: "Let's keep it that way." }, { beat: '{c} is across the room, pretending to look for a shirt.' }] },
    { id: 'ch.2', turns: [{ beat: '{a} and {b} arrive at breakfast separately and do not look at each other once.' }, { by: 'c', dr: "They're trying so hard to look like they're not together. It's obvious." }] },
    { id: 'ch.3', turns: [{ by: 'c', dr: "{a} and {b} never sit together. But they always leave the room together." }] },
    { id: 'ch.4', turns: [{ by: 'c', say: "So are you and {b} a thing?" }, { by: 'a', say: "{b}? We're just friends." }, { by: 'c', dr: "{a} saved {b} a seat thirty seconds later." }] },
    { id: 'ch.5', turns: [{ beat: '{c} walks back in for a water bottle. {a} and {b} spring apart.' }, { by: 'c', say: "Don't mind me." }] },
    { id: 'ch.6', turns: [{ by: 'b', say: "Should we tell people?" }, { by: 'a', say: "Not yet. It puts a target on both of us." }, { by: 'c', dr: "Too late. I heard." }] },
    { id: 'ch.7', turns: [{ by: 'c', dr: "{a} started a really loud conversation about laundry the second I walked in. Nobody talks about laundry that loudly." }] },
  ],
  'couple.blind.scene': [
    { id: 'cb.1', turns: [{ by: 'b', say: "I'm not asking you to break up with {partner}. I'm asking you to count." }, { by: 'a', say: "I heard the first part." }] },
    { id: 'cb.2', turns: [{ by: 'b', say: "{partner} has been saying things about you in other rooms." }, { by: 'a', say: "Like what?" }, { by: 'b', say: "Like..." }, { by: 'a', say: "No. I don't believe it." }] },
    { id: 'cb.3', turns: [{ by: 'a', dr: "{b} came to me with stories about {partner}. I know {partner}. I don't need {b}'s help." }] },
    { id: 'cb.4', turns: [{ by: 'b', say: "Just imagine making this decision without {partner}." }, { by: 'a', say: "There's no reason to imagine that." }, { beat: '{a} gets up and leaves.' }] },
    { id: 'cb.5', turns: [{ by: 'b', dr: "I tried to warn {a} about {partner}. {a} went straight to {partner} and said it was me." }] },
    { id: 'cb.6', turns: [{ by: 'b', say: "{partner} made the same promise to someone else." }, { by: 'a', say: "There'll be a reason for that." }, { by: 'b', dr: "With {partner}, there's always a reason." }] },
    { id: 'cb.7', turns: [{ by: 'b', dr: "You can't tell {a} anything about {partner}. I've stopped trying." }] },
  ],
  'couple.third.scene': [
    { id: 'ct.1', turns: [{ by: 'a', say: "I'm happy for you." }, { by: 'b', say: "Thanks! That means a lot." }, { by: 'a', dr: "I am happy for {b}. I just miss {b}." }] },
    { id: 'ct.2', turns: [{ by: 'a', say: "Can we catch up later?" }, { by: 'b', say: "Definitely. Later." }, { beat: '{b} goes upstairs. {a} does not ask again.' }] },
    { id: 'ct.3', turns: [{ by: 'a', dr: "{b} and I used to talk every night. Now {b} is always with someone else." }] },
    { id: 'ct.4', turns: [{ by: 'a', say: "So I'm the third wheel now?" }, { by: 'b', say: "Don't be silly!" }, { beat: '{b} leaves to find the other half of the couple.' }] },
    { id: 'ct.5', turns: [{ by: 'a', say: "Can I tell you something?" }, { by: 'b', say: "Of course." }, { beat: '{b} keeps glancing across the room.' }, { by: 'a', say: "...Never mind. It's not important." }] },
    { id: 'ct.6', when: { third: true }, turns: [{ by: 'c', say: "Want to sit with us tonight?" }, { by: 'a', say: "Yeah. I'd like that." }] },
    { id: 'ct.7', turns: [{ by: 'a', dr: "I'm not angry with {b}. I've just stopped saving {b} a seat." }] },
  ],
  'couple.risk.loyal': [
    { id: 'ck.l1', turns: [{ by: 'a', say: "Anyone who votes out {b} loses my vote too. I want everyone to hear that." }] },
    { id: 'ck.l2', turns: [{ by: 'a', dr: "People say I should keep my distance from {b} this week. No chance." }] },
    { id: 'ck.l3', turns: [{ by: 'b', say: "You're making us look like a pair." }, { by: 'a', say: "We are a pair." }] },
    { id: 'ck.l4', turns: [{ by: 'a', say: "Judge {b} as a player, not as half of a couple." }, { beat: '{a} goes from room to room saying it.' }] },
    { id: 'ck.l5', turns: [{ by: 'b', dr: "{a} is putting {a.posAdj} own game on the line for me. I won't forget that." }] },
    { id: 'ck.l6', turns: [{ by: 'a', dr: "If keeping {b} costs me, it costs me. I'm doing it anyway." }] },
  ],
  'couple.risk.guarded': [
    { id: 'ck.g1', turns: [{ by: 'a', say: "The votes are moving. I'm doing what I can." }, { by: 'b', say: "Are you?" }] },
    { id: 'ck.g2', turns: [{ by: 'b', say: "Who have you talked to?" }, { by: 'a', say: "Two people." }, { by: 'b', say: "And what did you ask them for?" }, { by: 'a', say: "...It's complicated." }] },
    { id: 'ck.g3', turns: [{ by: 'a', dr: "If I fight too hard for {b}, I'm next. I hate it. But it's true." }] },
    { id: 'ck.g4', turns: [{ by: 'b', dr: "{a} campaigns for me when I'm in the room. When I leave, I'm not so sure." }] },
    { id: 'ck.g5', turns: [{ by: 'a', say: "I'm doing everything I can." }, { by: 'b', dr: "Everything except asking anyone for a vote." }] },
    { id: 'ck.g6', turns: [{ by: 'a', dr: "I care about {b}. But I'm not going home for {b}." }] },
  ],
  'couple.fight.scene': [
    { id: 'cf.1', turns: [{ by: 'a', say: "You're playing me." }, { by: 'b', say: "Is this about us or about the game?" }, { by: 'a', say: "...I don't know any more." }] },
    { id: 'cf.2', turns: [{ beat: '{a} and {b} try to argue quietly. It does not last.' }, { by: 'b', say: "Don't shout at me!" }, { by: 'a', say: "I'm not shouting!" }] },
    { id: 'cf.3', when: { third: true }, turns: [{ by: 'c', dr: "{a} and {b} were 'whispering'. The whole bedroom heard every word. I took my pillow to the sofa." }] },
    { id: 'cf.4', turns: [{ by: 'b', say: "Why did you question us in front of everyone?" }, { by: 'a', say: "You made it public first!" }, { by: 'b', say: "Made what public?" }] },
    { id: 'cf.5', turns: [{ by: 'a', say: "I need a minute." }, { beat: '{a} walks out. {b} follows.' }, { by: 'b', say: "Don't walk away from me!" }] },
    { id: 'cf.6', turns: [{ by: 'b', dr: "{a} and I had our first real fight. In a house full of people. Brilliant." }] },
    { id: 'cf.7', turns: [{ by: 'a', say: "Who were you talking to all afternoon?" }, { by: 'b', say: "Does it matter?" }, { by: 'a', say: "It does to me." }] },
    { id: 'cf.8', turns: [{ by: 'a', dr: "I don't know if I'm angry about the game or about us. That's the problem." }] },
  ],
  'couple.vote.scene': [
    { id: 'cv.1', turns: [{ by: 'a', say: "Who are you voting for?" }, { by: 'b', say: "Same as you." }, { by: 'a', say: "You don't even know who I'm voting for." }, { by: 'b', say: "I know it's the same." }] },
    { id: 'cv.2', when: { third: true }, turns: [{ by: 'c', dr: "I made my case to {a}. Then to {b}. I got the same answer, almost word for word." }] },
    { id: 'cv.3', turns: [{ by: 'b', say: "I'll vote however you're voting." }, { by: 'a', say: "Are you sure?" }, { by: 'b', say: "Completely." }] },
    { id: 'cv.4', when: { third: true }, turns: [{ beat: '{c} pitches {a}. Before answering, {a} looks across the room at {b}.' }, { by: 'c', dr: "That conversation had three people in it." }] },
    { id: 'cv.5', when: { third: true }, turns: [{ by: 'c', say: "Where's your vote?" }, { by: 'b', say: "Talk to {a}." }, { by: 'c', dr: "So I'm pitching one vote, twice." }] },
    { id: 'cv.6', turns: [{ by: 'a', dr: "{b} and I talked it through and picked together. That's how we do it." }] },
    { id: 'cv.7', turns: [{ by: 'b', dr: "{a} and I vote as one. If you want one of us, you have to convince both." }] },
  ],
  'couple.defined.scene': [
    { id: 'cd.1', turns: [{ by: 'a', say: "So... what are we?" }, { by: 'b', say: "Together. Obviously." }, { beat: '{b} rolls over and goes back to sleep. {a} lies awake, smiling.' }] },
    { id: 'cd.2', turns: [{ by: 'a', say: "I need to know if this is a game thing." }, { by: 'b', say: "Are you serious?" }, { by: 'a', say: "...You look really offended." }, { by: 'b', say: "I am!" }] },
    { id: 'cd.3', turns: [{ by: 'a', say: "Can we just say it? Out loud?" }, { by: 'b', say: "Say what?" }, { by: 'a', say: "That this is real." }, { by: 'b', say: "This is real." }] },
    { id: 'cd.4', turns: [{ by: 'b', say: "I really like you, by the way." }, { by: 'a', say: "Wait. Say that again. Properly." }] },
    { id: 'cd.5', turns: [{ by: 'a', dr: "We finally said it out loud. Whatever happens at the next eviction, {b} and I are a real thing." }] },
    { id: 'cd.6', turns: [{ by: 'a', say: "I'm not doing the thing where we pretend." }, { by: 'b', say: "Good. Me neither." }] },
    { id: 'cd.7', turns: [{ by: 'b', dr: "{a} asked me what we are at two in the morning. It took {a} three tries. It was very cute." }] },
  ],
  'couple.underground.scene': [
    { id: 'cu.1', turns: [{ by: 'a', say: "New rules. Separate rooms at night. No saving seats. Thirty seconds between us leaving a room." }, { by: 'b', say: "Fine." }] },
    { id: 'cu.2', turns: [{ by: 'a', say: "To everyone else, we need to look like two separate votes." }, { by: 'b', say: "So I have to ignore you." }, { by: 'a', say: "In public." }, { by: 'b', say: "...Fine." }] },
    { id: 'cu.3', turns: [{ by: 'c', dr: "{a} and {b} left the kitchen thirty seconds apart. Three nights in a row. I timed it." }] },
    { id: 'cu.4', turns: [{ by: 'b', say: "How long do we have to do this for?" }, { by: 'a', say: "Until the numbers are right." }, { by: 'b', dr: "That's not an answer." }] },
    { id: 'cu.5', turns: [{ by: 'c', dr: "{a} and {b} never look at each other now. And they always end up in the same room within a minute." }] },
    { id: 'cu.6', turns: [{ by: 'a', dr: "{b} and I are pretending to be bored of each other. I'm good at it. {b} is terrible." }] },
    { id: 'cu.7', turns: [{ by: 'b', dr: "{a} says it's strategy. It feels like being asked to like {a} less." }] },
  ],
  'couple.apart.scene': [
    { id: 'cp.1', turns: [{ by: 'a', say: "If we walk in together, we're one conversation." }, { by: 'b', say: "So we split up." }, { by: 'a', say: "You take after dinner. I'll take before." }] },
    { id: 'cp.2', turns: [{ by: 'a', dr: "{b} and I split the house in half this week. Two campaigns. Nobody sees us together." }] },
    { id: 'cp.3', when: { third: true }, turns: [{ by: 'c', dr: "{a} asked me about the vote. An hour later {b} asked me the same thing. Separately. Interesting." }] },
    { id: 'cp.4', turns: [{ by: 'b', dr: "I disagreed with {a} about the vote in front of everyone. It was all for show. I think it worked." }] },
    { id: 'cp.5', turns: [{ by: 'a', say: "Remember, don't finish my sentences." }, { by: 'b', say: "I don't do that." }, { by: 'a', say: "You're doing it now." }] },
    { id: 'cp.6', turns: [{ by: 'b', dr: "Playing apart from {a} is harder than I thought. But people are taking us seriously as two players." }] },
    { id: 'cp.7', turns: [{ by: 'a', dr: "This week {b} and I aren't a couple in public. We're two separate votes. People can see the difference." }] },
  ],
  'couple.leak.scene': [
    { id: 'cl.1', turns: [{ by: 'a', dr: "I told {b} something at four o'clock. By nine, {c} was saying it back to me word for word." }] },
    { id: 'cl.2', turns: [{ by: 'a', say: "Don't repeat this." }, { by: 'b', say: "I won't." }, { by: 'a', dr: "{b} told exactly one person. The one {b} shares a bed with." }] },
    { id: 'cl.3', turns: [{ by: 'c', say: "So you think the vote's going to flip?" }, { by: 'a', say: "...Who told you that?" }, { by: 'a', dr: "Only {b} knew that." }] },
    { id: 'cl.4', turns: [{ by: 'a', dr: "Anything I tell {b}, {c} hears. I should have known." }] },
    { id: 'cl.5', turns: [{ by: 'a', dr: "I tested it. One wrong detail, told only to {b}. It came out of {c}'s mouth, wrong in the same way." }] },
    { id: 'cl.6', turns: [{ by: 'b', say: "I didn't tell anyone!" }, { by: 'a', say: "You told {c}." }, { by: 'b', say: "...That doesn't count." }] },
    { id: 'cl.7', turns: [{ by: 'a', dr: "Nothing I say to {b} stays with {b}. It goes straight to {c}." }] },
  ],
  'couple.jealous.scene': [
    { id: 'cj.1', turns: [{ by: 'a', say: "What were you two laughing about?" }, { by: 'b', say: "I honestly can't remember." }, { by: 'a', say: "Right." }] },
    { id: 'cj.2', turns: [{ by: 'a', dr: "{b} and {c} talked for an hour in the kitchen. I walked past four times. Not that I was counting." }] },
    { id: 'cj.3', turns: [{ beat: '{c} touches {b}\'s arm while making a point.' }, { by: 'a', dr: "I didn't like that." }] },
    { id: 'cj.4', turns: [{ by: 'a', say: "It's not about {c}." }, { by: 'b', say: "Okay." }, { by: 'a', say: "It's not." }, { by: 'b', say: "I said okay." }] },
    { id: 'cj.5', turns: [{ by: 'b', say: "{c} is just easy to talk to." }, { by: 'a', say: "Is {c}?" }] },
    { id: 'cj.6', turns: [{ by: 'c', dr: "{a} has been really cold with me all evening. I have no idea what I did." }] },
    { id: 'cj.7', turns: [{ by: 'b', dr: "{a} is jealous of {c}. Of {c}! We were talking about a competition." }] },
  ],
  'couple.pressure.scene': [
    { id: 'cq.1', turns: [{ by: 'a', dr: "{b} is on the block and I can't eat. I can't sit down. I just keep counting." }] },
    { id: 'cq.2', turns: [{ by: 'b', say: "Breathe. I'm the one on the block." }, { by: 'a', say: "I know. That's why I can't breathe." }] },
    { id: 'cq.3', turns: [{ by: 'a', say: "I'm fine." }, { by: 'b', say: "You've been crying." }, { by: 'a', say: "I'm fine." }] },
    { id: 'cq.4', turns: [{ by: 'b', dr: "I'm handling this better than {a} is. And {a} isn't even nominated." }] },
    { id: 'cq.5', when: { third: true }, turns: [{ by: 'c', dr: "{a} is falling apart over {b}'s nomination. People are noticing. Not in a good way." }] },
    { id: 'cq.6', turns: [{ by: 'a', dr: "I've been up since four running the numbers. On somebody else's eviction." }] },
    { id: 'cq.7', when: { third: true }, turns: [{ by: 'a', say: "Where's the vote? Have you heard anything?" }, { by: 'c', say: "Nothing new." }, { by: 'a', say: "You'd tell me, right?" }] },
    { id: 'cq.8', turns: [{ by: 'b', say: "You need to stop campaigning for me. You're scaring people." }, { by: 'a', say: "I can't stop." }] },
  ],
};
