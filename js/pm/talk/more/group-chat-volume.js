// pm/talk/more/group-chat-volume.js — more of the villa telling it (talk/group-chat.js).
// Season read 2026-10-25: the chats run after nearly every story beat, and a
// pool of two or three per movement played "Okay, but how did you feel? Not
// what you said" four times in one Casa episode. {x} is who it's about; {pa}
// only when taken. Nothing here names a past event the scene doesn't hold.
export const GROUP_CHAT_VOLUME = {
  moves: {
    gather: [
      { stage: "{a} climbs onto the end of the daybed, and the others sit up.", turns: [
        ['b', "Right. Spill."],
        ['a', "There's nothing to spill."],
        ['b', "There's always something to spill."],
      ] },
      { stage: "{a} finds the others in the kitchen.", turns: [
        ['b', "Look at your face. Sit down. I'm making you a tea."],
        ['a', "I don't want a tea."],
        ['b', "You're getting a tea."],
      ] },
      { stage: "In the bedroom, {b} pats the bed next to {a}.", turns: [
        ['b', "Go on, then. We heard there was a chat."],
        ['a', "Does nothing stay quiet in here?"],
        ['b', "Not for longer than four minutes."],
      ] },
      { stage: "{a} sits down on the edge of the pool, and the others swim over.", turns: [
        ['b', "Talk. Now."],
        ['a', "Can I at least get my feet wet first?"],
      ] },
      { stage: "{a} walks into the gym, where {b} is very much not working out.", turns: [
        ['b', "Thank God. I was about to have to actually exercise. What's happened?"],
      ] },
      { stage: "{a} and the others are on the stairs, out of everyone's way.", turns: [
        ['b', "Okay. Nobody can hear us here. Go."],
      ] },
    ],
    tell: [
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "So {x} pulled me. And I thought it'd be a two-minute thing, a hello, but {x} wanted to know everything. Where I'm from, what I want, what I'm doing with {pa}."],
        ['b', "What you're doing with {pa}? Bold."],
        ['a', "Very bold. And I didn't hate it, which is the worst part."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "{x} just came out with it. Said we'd be good together, and that I should at least think about it. Then got up and left, like it was nothing."],
        ['b', "And have you? Thought about it?"],
        ['a', "I've thought about nothing else for an hour."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "I told {x} straight away I'm with {pa}. And {x} said, I know, I'm not asking you to do anything, I just wanted you to know. Who says that?"],
        ['b', "Someone who knows exactly what they're doing."],
      ] },
    ],
    react: [
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "Did you like it? Being pulled?"],
        ['a', "Everyone likes being pulled."],
        ['b', "That's not what I asked."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "Okay, I'm going to be the annoying one. You're smiling. You've been smiling since you sat down."],
        ['a', "I'm not smiling."],
        ['b', "You're smiling right now."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "Honestly? {x} is trouble. I've watched {x} all week. {x} doesn't do anything by accident."],
        ['a', "You think it was a game?"],
        ['b', "I think you should be careful, that's all."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['b', "I'm so sorry. Honestly. I'd never have guessed. Not {x}."],
        ['a', "Me neither. That's what makes me feel stupid."],
        ['b', "You're not stupid. You trusted someone. That's not stupid."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['b', "Whatever you need tonight, you've got it. Do you want us there when you talk to {x}?"],
        ['a', "No. I need to do this one on my own."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['b', "From where we were sitting, you didn't do anything wrong. You just said what you felt."],
        ['a', "Then why do I feel like the bad guy?"],
        ['b', "Because you care. The bad guys don't sit here worrying about it."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['b', "Can I say something you won't like? You were both a bit much."],
        ['a', "Thanks."],
        ['b', "I'm on your side. I'm just also on the side of the truth."],
      ] },
      { when: { subj: 'knocked-back' }, turns: [
        ['b', "So {x} didn't say it back. That doesn't mean {x} won't. It means not yet."],
        ['a', "Not yet is still not."],
      ] },
      { when: { subj: 'knocked-back' }, turns: [
        ['b', "Honestly? Better a slow yes than a fast fake one."],
        ['a', "I'd have taken a fast fake one tonight."],
      ] },
      { when: { subj: 'shut-down' }, turns: [
        ['b', "At least {x} was honest. That's rarer than you think in here."],
        ['a', "I know. I just wanted honest to say something different."],
      ] },
      { when: { subj: 'shut-down' }, turns: [
        ['b', "You put yourself out there. Nobody can take that away from you, even if it didn't go your way."],
        ['a', "I'd like it to have gone my way."],
      ] },
      { when: { subj: 'celebrate' }, turns: [
        ['b', "I'm actually going to cry. Why am I crying? It's not even my relationship."],
        ['a', "Because you love me."],
        ['b', "Because I love you."],
      ] },
      { when: { subj: 'celebrate' }, turns: [
        ['b', "Did {x} do it nicely? Tell me {x} did it nicely."],
        ['a', "{x} did it really nicely."],
        ['b', "Good. Otherwise I'd have had words."],
      ] },
      { when: { subj: 'progress' }, turns: [
        ['b', "You two are getting serious. I can see it. You've stopped playing it cool."],
        ['a', "We were never playing it cool."],
        ['b', "You were trying. Badly."],
      ] },
      { when: { subj: 'progress' }, turns: [
        ['b', "So what happens now? Are you two, like, a thing a thing?"],
        ['a', "We're a thing. I don't know about a thing a thing."],
      ] },
    ],
    verdict: [
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "I'm going to sleep on it. If I still feel like this tomorrow, then I'll worry."],
        ['b', "And if you don't?"],
        ['a', "Then it was just a nice chat."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['a', "I'm not going to scream. I'm not going to make a scene. I'm just going to ask, and I'll know from {x}'s face."],
        ['b', "You always know from the face."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['a', "I'm not apologising first. Not this time."],
        ['b', "Someone has to."],
        ['a', "Then it can be {x}."],
      ] },
      { when: { subj: ['knocked-back', 'shut-down'] }, turns: [
        ['a', "Right. I'm going to put a face mask on, and then I'm going to be fine."],
        ['b', "That's the healthiest thing I've heard all week."],
      ] },
      { when: { subj: ['celebrate', 'progress'] }, turns: [
        ['a', "I don't want to jinx it. Can we all agree not to jinx it?"],
        ['b', "Nobody's jinxing anything. Somebody get the glasses."],
      ] },
    ],
    close: [
      { turns: [], beat: "Somebody calls from the kitchen that dinner's ready, and nobody moves." },
      { turns: [['b', "We're here. Whatever you decide."], ['a', "I know you are."]] },
      { turns: [], beat: "{a} lies back on the bed, {b} lies down next to {a}, and for a minute nobody says anything." },
      { when: { subj: ['celebrate', 'progress'] }, turns: [], beat: "{b} grabs {a}'s hands and jumps up and down, and the rest of them join in." },
      { when: { subj: ['found-out', 'row', 'knocked-back', 'shut-down'] }, turns: [['b', "Come on. Let's get you something to eat, and then you can decide whether to cry."], ['a', "Food first. Crying later."]] },
    ],
  },
};
