// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-psy.js — the C-story: one person's inner life
// ══════════════════════════════════════════════════════════════════════
//
// td/story/psyche.js (header there). a is the person; b, when there, is the one person a trusts
// most. moment: lost ({lastBoot}, a's ally, went home last night) / votes (a's name came up last
// night) / bottom (nobody is really close to a) / quiet. Before the challenge: nothing here may
// know about tonight's vote. Ids: 'nps.'.

export default {
  // ── belong: wants to be liked, to have people; scared of being left out ──
  'psy.belong': [
    { id: 'nps.b1', when: { moment: 'lost', lastBoot: true }, turns: [
      { by: 'a', conf: "{lastBoot} was the first person here who sat with me at breakfast without me having to ask. I keep looking at the spot." },
      { by: 'a', conf: "I'm fine. I'm going to be fine. I just don't really know who I eat breakfast with now.", v: { tough: "Whatever, people leave. I'll find somebody else to sit with.", teen: "It's so stupid, but I keep turning around to tell {lastBoot} things." } },
    ] },
    { id: 'nps.b2', when: { moment: 'bottom' }, turns: [
      { beat: "Everybody's laughing at something by the fire. {a} laughs too, a second late, and then goes quiet." },
      { by: 'a', conf: "I've always been the person who gets along with everybody. Here, I get along with everybody and I'm close to nobody, and I didn't know those were different things until now." },
      { by: 'a', conf: "I'm going to fix it. I just need one person who'd notice if I was gone." },
    ] },
    { id: 'nps.b3', when: { moment: 'votes', pair: true }, turns: [
      { by: 'a', say: "Can I ask you something weird? Do people here like me?" },
      { by: 'b', say: "What? Of course they do." },
      { by: 'a', say: "Then why did my name come up last night?" },
      { by: 'b', say: "That's not about liking you. That's about the game." },
      { by: 'a', say: "It doesn't feel like the game. It feels like the cafeteria in eighth grade.", v: { grown: "It doesn't feel like a game. It feels like every office I've ever worked in." } },
      { by: 'b', say: "Well, you've got me. That's something." },
      { by: 'a', conf: "{b} said 'you've got me' like it was nothing. It was everything. I'm going to hold onto that." },
    ] },
    { id: 'nps.b4', when: { moment: 'quiet' }, turns: [
      { by: 'a', conf: "Back home I'm the one who organises everything. The parties, the group chats, all of it. Here, nobody needs me to organise anything, and I don't really know what I'm for." },
      { by: 'a', conf: "So I've been helping with chores. Not because I like chores. Because when you're helping, people talk to you.", v: { dry: "So I've been doing chores, and I hate chores, but chores are where the conversations happen." } },
    ] },
  ],

  // ── prove: wants to be taken seriously; scared of being the weak one ──
  'psy.prove': [
    { id: 'nps.p1', when: { moment: 'votes' }, turns: [
      { by: 'a', conf: "My name came up last night. Of course it did. I'm the one everybody thinks they can get rid of whenever they want." },
      { by: 'a', conf: "I've been the one people underestimate my whole life, and I've been the one proving them wrong my whole life. So, fine. Let's go again.", v: { anxious: "I keep telling myself it's fine. That I'll show them. I just really wish I didn't have to keep showing everybody." } },
    ] },
    { id: 'nps.p2', when: { moment: 'quiet', pair: true }, turns: [
      { by: 'b', say: "You've been up since before sunrise." },
      { by: 'a', say: "I've been practising knots. For the challenges." },
      { by: 'b', say: "You don't have to practise knots. Nobody practises knots." },
      { by: 'a', say: "Nobody else got picked last in the first challenge either." },
      { by: 'b', say: "That was days ago." },
      { by: 'a', say: "I know. I still remember everybody's face." },
      { by: 'a', conf: "I'm not going to be the reason we lose. I'd rather have rope burns on both hands than hear that again." },
    ] },
    { id: 'nps.p3', when: { moment: 'lost', lastBoot: true }, turns: [
      { by: 'a', conf: "{lastBoot} was the only person who ever picked me first for anything out here." },
      { by: 'a', conf: "Now {lastBoot} is gone, and I have to stop needing somebody to pick me. I have to start being somebody people want to pick." },
    ] },
    { id: 'nps.p4', when: { moment: 'bottom' }, turns: [
      { by: 'a', conf: "Everybody here has already decided what I am: the weak link, the easy vote." },
      { by: 'a', conf: "I'm not going to argue with them. I'm going to win something, and then I'm going to watch them try to explain it.", v: { warm: "I don't want to be bitter. I just want one day where somebody looks at me and thinks I'm useful." } },
    ] },
  ],

  // ── control: wants to run the game; scared of being found out ──
  'psy.control': [
    { id: 'nps.c1', when: { moment: 'votes' }, turns: [
      { by: 'a', conf: "My name came up last night. Not enough to send me home, but enough to tell me somebody's watching me." },
      { by: 'a', conf: "That's the part nobody tells you. The better you play, the more people see you playing. I have to start playing quieter.", v: { cruel: "Somebody here thinks they can outplay me, which is cute. I'd like to meet them properly." } },
    ] },
    { id: 'nps.c2', when: { moment: 'quiet' }, turns: [
      { beat: "{a} sits a little way from the others, watching who talks to who." },
      { by: 'a', conf: "I know where everybody here is going to be at noon. I know who sleeps next to who and who complains when the other one snores." },
      { by: 'a', conf: "People think strategy is talking, but it isn't, it's watching, and nobody here watches like I do.", v: { anxious: "I watch everybody because if I stop watching, I'll miss the thing that sends me home. It's exhausting, honestly." } },
    ] },
    { id: 'nps.c3', when: { moment: 'quiet', pair: true }, turns: [
      { by: 'b', say: "Do you ever just relax?" },
      { by: 'a', say: "I'm relaxing right now." },
      { by: 'b', say: "You're counting people." },
      { by: 'a', say: "I can relax and count at the same time." },
      { by: 'b', say: "That's not relaxing, that's a job." },
      { by: 'a', conf: "{b} is the only person here who sees how hard I'm working. I can't decide if that makes {b} the most useful person here or the most dangerous." },
    ] },
    { id: 'nps.c4', when: { moment: 'lost', lastBoot: true }, turns: [
      { by: 'a', conf: "I didn't see {lastBoot} going, and I'm supposed to be the one who sees everything." },
      { by: 'a', conf: "Somebody is running something I don't know about, and that scares me more than any vote ever could." },
    ] },
  ],

  // ── protect: wants to look after people; scared of being betrayed by them ──
  'psy.protect': [
    { id: 'nps.r1', when: { moment: 'lost', lastBoot: true }, turns: [
      { by: 'a', conf: "I promised {lastBoot} I'd keep {lastBoot} safe, back on the second day, and I meant it." },
      { by: 'a', conf: "And last night I couldn't. I keep running it back, every conversation, looking for the one I should have had.", v: { tough: "I failed. I'm not going to fail like that again, not for anybody I care about." } },
    ] },
    { id: 'nps.r2', when: { moment: 'quiet', pair: true }, turns: [
      { by: 'a', say: "You've been coughing all night. Here, take my blanket." },
      { by: 'b', say: "Then you'll be cold." },
      { by: 'a', say: "I've been cold before. Take it." },
      { by: 'b', say: "Why are you always doing stuff like this?" },
      { by: 'a', say: "Because somebody has to, and I'd rather it was me." },
      { by: 'a', conf: "My mum always said look after your people. I don't know if these are my people yet. But I'm going to act like they are until somebody proves they aren't." },
    ] },
    { id: 'nps.r3', when: { moment: 'votes' }, turns: [
      { by: 'a', conf: "Somebody I've been looking after wrote my name last night. I know they did, because I can count." },
      { by: 'a', conf: "I'm not going to stop helping people. I'm just going to start paying attention to who helps back." },
    ] },
    { id: 'nps.r4', when: { moment: 'bottom' }, turns: [
      { by: 'a', conf: "I spend all my time making sure everybody else is okay. I just realised nobody's asked me if I'm okay in about three days." },
      { by: 'a', conf: "That's fine, that's who I am. I just wish somebody here would do it once." },
    ] },
  ],

  // ── temper: wants to be respected; scared of losing it in front of everybody ──
  'psy.temper': [
    { id: 'nps.t1', when: { moment: 'quiet' }, turns: [
      { beat: "{a} is pounding a tent peg into the ground much harder than it needs." },
      { by: 'a', conf: "I know what people think. That I'm going to blow up. And I get it, I have, back home, a lot." },
      { by: 'a', conf: "So every time somebody here says something stupid, I count to five. Today I've counted to five about forty times.", v: { loud: "Every single time somebody here says something dumb, I count to five, and I'm running out of numbers." } },
    ] },
    { id: 'nps.t2', when: { moment: 'votes', pair: true }, turns: [
      { by: 'b', say: "You okay? You've been quiet." },
      { by: 'a', say: "I'm trying not to say anything I'll regret." },
      { by: 'b', say: "About last night?" },
      { by: 'a', say: "About the people who wrote my name and then said good morning to me like nothing happened." },
      { by: 'b', say: "That's fair. That's really fair." },
      { by: 'a', conf: "The old me would have flipped the breakfast table. The new me is going to smile and wait. The new me is so much scarier." },
    ] },
    { id: 'nps.t3', when: { moment: 'lost', lastBoot: true }, turns: [
      { by: 'a', conf: "{lastBoot} was the one who'd grab my arm when I was about to say something stupid. Now nobody's going to grab my arm." },
      { by: 'a', conf: "So I have to grab my own arm. That's going to be a lot harder than it sounds." },
    ] },
    { id: 'nps.t4', when: { moment: 'bottom' }, turns: [
      { by: 'a', conf: "Nobody here really wants me around. I can feel it, and when I feel it, I get angry, and when I get angry, it gets worse." },
      { by: 'a', conf: "So today I'm not getting angry. Today I'm being so nice it hurts." },
    ] },
  ],

  // ── redemption: back for another try; scared of making the same mistake ──
  'psy.redemption': [
    { id: 'nps.e1', when: { moment: 'quiet', past: 'blindsided' }, turns: [
      { by: 'a', conf: "Last time I trusted too fast. I told everybody everything, and I went home with a smile on my face, completely blindsided." },
      { by: 'a', conf: "This time I'm keeping my mouth shut and my eyes open. It's harder than it sounds. I really like talking.", v: { tough: "This time nobody gets the jump on me. Nobody." } },
    ] },
    { id: 'nps.e2', when: { moment: 'votes', past: ['final', 'early', 'blindsided', 'mid', 'none'] }, turns: [
      { by: 'a', conf: "My name came up last night, and for a second I was right back there, last time, watching the votes come out." },
      { by: 'a', conf: "But I'm still here. That's already better than last time. I'm going to keep counting it like that." },
    ] },
    { id: 'nps.e3', when: { moment: 'quiet', pair: true, past: ['final', 'early', 'blindsided', 'mid', 'none'] }, turns: [
      { by: 'b', say: "Is it weird, being back?" },
      { by: 'a', say: "Weird is one word. Everybody knows exactly how I lost last time." },
      { by: 'b', say: "So they think they know how to beat you." },
      { by: 'a', say: "They think they know how to beat the old me. That's the advantage." },
      { by: 'a', conf: "Coming back was the scariest thing I've ever done. Going home the same way twice would be worse." },
    ] },
    { id: 'nps.e4', when: { moment: 'lost', lastBoot: true, past: ['final', 'early', 'blindsided', 'mid', 'none'] }, turns: [
      { by: 'a', conf: "{lastBoot} going home last night felt like watching my own boot all over again. Same feeling. Same stomach drop." },
      { by: 'a', conf: "I can't save everybody, I'm finally learning that. I just have to make sure I'm still standing." },
    ] },
  ],

  // ── home: somebody waiting at home; scared of letting them down ──
  'psy.home': [
    { id: 'nps.h1', when: { moment: 'quiet' }, turns: [
      { beat: "{a} sits by the water, turning a small stone over and over." },
      { by: 'a', conf: "I found this on the first day, and it's the same colour as the sea outside my house back home. That's stupid, I know." },
      { by: 'a', conf: "Everybody here is twenty-two and doing this for fun. I'm doing this so somebody at home can have something I never had.", v: { dry: "Everyone else is here for the adventure, and I'm here for a mortgage. Very glamorous." } },
    ] },
    { id: 'nps.h2', when: { moment: 'votes' }, turns: [
      { by: 'a', conf: "My name came up last night, and all I could think about was having to explain it at home." },
      { by: 'a', conf: "I'm not going home early. I promised myself I'd last long enough for it to mean something." },
    ] },
    { id: 'nps.h3', when: { moment: 'quiet', pair: true }, turns: [
      { by: 'b', say: "You look a million miles away." },
      { by: 'a', say: "Just thinking about home. It's a birthday today, back there." },
      { by: 'b', say: "Whose?" },
      { by: 'a', say: "Somebody who's going to be very upset I missed it." },
      { by: 'b', say: "Then you'd better make it worth it." },
      { by: 'a', conf: "{b} didn't try to cheer me up, just told me to make it count. That's exactly what I needed to hear." },
    ] },
    { id: 'nps.h4', when: { moment: 'bottom' }, turns: [
      { by: 'a', conf: "I'm older than most of them, and they treat me like everybody's parent. Lovely to talk to, never invited to the meeting." },
      { by: 'a', conf: "Fine, parents know everything that goes on in a house, so I'll just keep listening." },
    ] },
  ],
};
