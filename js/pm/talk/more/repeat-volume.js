// pm/talk/more/repeat-volume.js — the pools a single episode drew from more
// than once and heard twice (measured 2026-10-25: three seasons, every line
// heard a second time in the same episode under another cast). Each kind keeps
// its own file's rules; this only widens the pools.
const NG = { guessed: false };

// The receipt game: every wrong guess used to protest with one line.
export const RECEIPT_VOLUME = {
  moves: {
    answer: [
      { when: NG, turns: [['b', "Me? I haven't done anything! Why me?"]] },
      { when: NG, turns: [['b', "What? No! What have I ever done to you?"], ['a', "Nothing. That's what makes it suspicious."]] },
      { when: NG, turns: [['b', "I'm genuinely offended. I've been an angel."], ['a', "That's exactly what someone guilty would say."]] },
      { when: NG, turns: [['b', "Wrong. So wrong. You're so wrong it's embarrassing."], ['a', "Then why are you laughing?"], ['b', "Because you're wrong!"]] },
      { when: NG, turns: [['b', "Not me. Look at my face. This is an innocent face."], ['a', "It's a very guilty innocent face."]] },
      { when: NG, turns: [], beat: "{b} throws {b.posAdj} hands up. Somewhere on the bench, the real one doesn't move a muscle." },
    ],
  },
};

// The final's films: four couples watch the same kinds of chapter.
export const JOURNEY_REACT_VOLUME = {
  moves: {
    watch: [
      { when: { of: 'night-one' }, turns: [['a', "Look at us. We didn't have a clue."], ['b', "I had one clue. I liked your smile."], ['a', "That's not a clue. That's a compliment."]] },
      { when: { of: 'night-one' }, turns: [['b', "I nearly didn't step forward that night."], ['a', "You what?"], ['b', "I'm joking. Mostly. I was terrified."]] },
      { when: { of: ['met', 'date-met'] }, turns: [['b', "Your first words to me. Do you remember them?"], ['a', "Please don't make me hear them again."], ['b', "Too late. Here they come."]] },
      { when: { of: ['met', 'date-met'] }, turns: [['a', "I was trying so hard to be interesting."], ['b', "You were interesting. You were also talking very fast."]] },
      { when: { of: 'coupled' }, turns: [['a', "Look how sure you look."], ['b', "I wasn't. I was faking it."], ['a', "You faked it very well."]] },
      { when: { of: 'coupled' }, turns: [['b', "I remember my legs going when you said my name."], ['a', "I remember your face. You looked so relieved."], ['b', "I was so relieved."]] },
      { when: { of: 'first-kiss' }, turns: [['b', "I can't believe they filmed that."], ['a', "They film everything."], ['b', "Still. That was private. Private on a daybed in front of everyone."]] },
      { when: { of: 'first-kiss' }, turns: [['a', "I'd been waiting days for that."], ['b', "Days? You'd been waiting days?"], ['a', "Don't look so pleased with yourself."]] },
      { when: { of: 'date' }, turns: [['b', "That was the day I stopped playing it cool."], ['a', "You were playing it cool?"], ['b', "Very badly, apparently."]] },
      { when: { of: 'date' }, turns: [['a', "I didn't want that date to end."], ['b', "It had to. They had to drive us back."], ['a', "I'd have walked."]] },
      { when: { of: 'challenge' }, stage: "They're both in tears laughing.", turns: [['b', "Who let us do that? Who allowed it?"], ['a', "We volunteered. That's the worst part."]] },
      { when: { of: 'challenge' }, turns: [['a', "That's going to be on the internet forever."], ['b', "Good. I want our grandkids to see it."]] },
      { when: { of: 'love' }, turns: [['a', "Listen to how scared I sound."], ['b', "You sound brave. That's what I heard. Brave."]] },
      { when: { of: 'row' }, turns: [['a', "I'd take back half of what I said there."], ['b', "Only half?"], ['a', "The other half I meant. And you know it."]] },
      { when: { of: 'tested' }, turns: [['a', "That week nearly broke us."], ['b', "Nearly. It didn't."], ['a', "No. It didn't."]] },
      { when: { of: 'at-risk' }, turns: [['b', "I've never held anyone's hand that tight."], ['a', "I couldn't feel my fingers for an hour after."]] },
    ],
    say: [
      { turns: [['b', "It goes so fast. Watching it like that, it goes so fast."], ['a', "It didn't feel fast at the time."]] },
      { turns: [['a', "I'd forgotten half of that."], ['b', "I hadn't forgotten any of it."]] },
      { turns: [['b', "I love that they kept that in."], ['a', "I love that you're crying about it."], ['b', "I'm not crying. It's the light."]] },
    ],
  },
};

// Casa's return, night after night, the same two walk-ins.
export const CASA_RETURN_VOLUME = {
  moves: {
    words: [
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, turns: [['a', "I told you I'd come back. I said it at the gate."], ['b', "I know you did. I still checked the steps every five minutes."]] },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, turns: [['b', "You came back on your own."], ['a', "There was never any other way I was coming back."]] },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, turns: [['a', "Did you sleep?"], ['b', "Not really. Did you?"], ['a', "Not at all. Come here."]] },
      { when: { of: 'stayed', choice: 'stick', taken: true }, turns: [['a', "If {pa} walks in with someone, I want everyone to know I didn't. That's all I've got left to hold on to."]] },
      { when: { of: 'stayed', choice: 'stick', taken: true }, turns: [['a', "I've rehearsed both faces. The happy one and the other one. I don't know which one I'm going to need."]] },
    ],
  },
};

// The Casa walk-in, said by every arrival of the night.
export const ENTRANCE_VOLUME = {
  moves: {
    hello: [
      { when: { split: true }, turns: [['a', "Hi! I'm {a}. I've been told there are some very loyal people in here. Let's see about that."]] },
      { when: { split: true }, turns: [['a', "Hello, everyone. I'm {a}. Don't worry, I'm not here to cause trouble. Unless trouble wants a chat."]] },
      { when: { split: true }, turns: [['a', "Hi. I'm {a}. I've only got a few days, so I'm going to have to be quick about it."]] },
      { when: { split: true }, turns: [['a', "Right, I'm {a}. Who's coupled up and who's actually coupled up? There's a difference."]] },
    ],
    land: [
      { when: { split: true }, turns: [], beat: "Somebody coughs. Somebody else very suddenly needs a drink." },
      { when: { split: true }, turns: [], beat: "A few of them laugh. One of them doesn't laugh at all." },
    ],
  },
};

// Night one's debrief: every new couple, the same opener.
export const DEBRIEF_VOLUME_3 = {
  moves: {
    night: [
      { stage: "Night one. {b} drags {a} into the dressing room the second the coupling is over.", turns: [['b', "Right. Door shut. Tell me everything."]] },
      { stage: "The first night, late. {a} and {b} are the last two on the terrace.", turns: [['b', "Are you happy? Honestly happy?"]] },
      { stage: "Night one. {a} and {b} whisper across the gap between their beds.", turns: [['b', "Are you awake? I can't sleep. How do you feel about tonight?"]] },
    ],
  },
};

// Casa: pining for the one in the other villa.
export const CASA_MISS_VOLUME = {
  moves: {
    miss: [
      { when: { of: 'aches' }, turns: [
        ['a', "Is it bad that I keep looking at the door? Like {about} is going to walk through it any minute."],
        ['b', "No. It's not bad."],
        ['a', "It's a bit sad."],
        ['b', "It's a bit sad. But it's not bad."],
      ] },
      { when: { of: 'aches' }, turns: [
        ['a', "Somebody made a joke at breakfast that {about} would have loved, and I turned round to tell {about}, and there was nobody there."],
        ['b', "Oh, that's horrible."],
        ['a', "I laughed on my own like a weirdo."],
      ] },
      { when: { of: 'worries' }, turns: [
        ['a', "Every time someone mentions the other villa, my stomach drops. I don't even know what I'm scared of. I just am."],
        ['b', "You're scared because you care. That's all it is."],
      ] },
      { when: { of: 'tears' }, turns: [
        ['a', "I'm fine. I'm fine. I just need a minute where nobody's being nice to me, or I'm going to cry."],
        ['b', "Too late. I'm being nice to you."],
        ['a', "Oh, here we go."],
      ] },
    ],
    friend: [
      { turns: [
        ['b', "Whatever happens over there, you've been yourself the whole time over here. That's all you can do."],
        ['a', "It doesn't feel like enough."],
        ['b', "It's enough. It has to be."],
      ] },
      { turns: [
        ['b', "Do you want my honest opinion? {about} would be mad to walk back in with anyone else."],
        ['a', "People are mad in Casa, though."],
        ['b', "Not {about}. I don't think so."],
      ] },
      { turns: [
        ['b', "Come on. No more sad talk. You're coming in the pool, and you're going to have fun, and {about} can hear about it later."],
        ['a', "Five minutes of fun."],
        ['b', "Ten. Minimum."],
      ] },
    ],
  },
};

// Lights out, after a day in a story.
export const BED_CHAT_VOLUME = {
  moves: {
    talk: [
      { when: { story: 'doubt', of: ['after-row', 'distant'] }, turns: [
        ['a', "Are we okay?"],
        ['b', "I don't know. Ask me tomorrow."],
        ['a', "I'm asking now."],
        ['b', "Then I don't know now."],
      ] },
      { when: { story: 'doubt', of: ['after-row', 'distant'] }, turns: [
        ['b', "You're right on the edge of the bed."],
        ['a', "So are you."],
        ['b', "Yeah."],
      ] },
      { when: { story: 'progress' }, turns: [
        ['b', "I've never shared a bed with someone and actually slept before."],
        ['a', "Is that a compliment?"],
        ['b', "It's the biggest compliment I've got."],
      ] },
      { when: { story: 'progress' }, turns: [
        ['a', "What are you thinking about?"],
        ['b', "Honestly? How much I don't want this to end."],
        ['a', "It's not ending."],
        ['b', "I know. I'm just thinking it."],
      ] },
      { when: { of: 'warm' }, turns: [
        ['b', "Tell me something nobody else in here knows."],
        ['a', "I like you more than I let on."],
        ['b', "That's not a secret. Everyone knows that."],
        ['a', "Then I've got nothing."],
      ] },
      { when: { of: 'warm' }, turns: [
        ['a', "Today was a good day."],
        ['b', "Today was a really good day."],
        ['a', "Can tomorrow be a good day too?"],
        ['b', "I'll see what I can do."],
      ] },
    ],
  },
};
