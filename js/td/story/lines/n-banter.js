// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-banter.js — two friends replay the challenge: the jokes, not the result
// ══════════════════════════════════════════════════════════════════════
// The user's Disventure Camp read, 2026-10-10: the challenges there are full of side conversations
// ("Radio Tom, more like Radio Tomás. You accept call-ins?"). The finale's races and every challenge stay
// on their own screens, so the banter lands in the afternoon at camp, between two friends who were out there
// together. It's about how it felt and what was said, never a result the engine didn't produce.

export default {
  'chm.banter.any': [
    { id: 'nbn.1', turns: [
      { by: 'a', say: "Can we talk about the noise you made at {chal}? Because I've never heard a human being make that sound." },
      { by: 'b', say: "That was a war cry." },
      { by: 'a', say: "It was a goose, and it was a goose that was very, very scared." },
      { by: 'b', say: "It was a brave goose. Get it right." },
      { by: 'a', conf: "I don't remember anything else about {chal}. Just {b} making that noise. I'm going to remember it forever." },
    ] },
    { id: 'nbn.2', turns: [
      { by: 'b', say: "You were singing the whole way through {chal}. The whole way." },
      { by: 'a', say: "It helps me focus." },
      { by: 'b', say: "It helped me lose my mind. What was that, even?" },
      { by: 'a', say: "Nobody knows the song. I made it up. It's called 'Please Don't Let Me Fall'." },
      { by: 'b', say: "...Okay, that one's actually pretty good." },
      { by: 'b', conf: "I wanted to be mad at {a}. Then I caught myself humming it on the way back." },
    ] },
    { id: 'nbn.3', turns: [
      { by: 'a', say: "Be honest. At {chal}, when I said I had a plan, did you believe me?" },
      { by: 'b', say: "Not even a little. Did you have one?" },
      { by: 'a', say: "Not even a little." },
      { by: 'b', say: "That's the most honest thing anybody's said to me out here." },
      { by: 'a', conf: "{b} trusted me anyway, out there with no plan. That means more than the challenge did." },
    ] },
    { id: 'nbn.4', turns: [
      { by: 'b', say: "I'm still shaking from {chal}, honestly. Look at my hands." },
      { by: 'a', say: "You were so calm out there, though. I thought you were made of ice." },
      { by: 'b', say: "I was screaming on the inside the entire time. The entire time." },
      { by: 'a', say: "Well, it didn't show. You looked like a professional." },
      { by: 'b', say: "That's the nicest lie anyone's told me all week." },
      { by: 'b', conf: "{a} said I looked calm. I'm going to believe that, because the alternative is that everyone saw me nearly cry." },
    ] },
    { id: 'nbn.5', turns: [
      { by: 'a', say: "Okay, the moment at {chal} when we both went the wrong way at the same time?" },
      { by: 'b', say: "And then both went back the right way at the same time and crashed into each other?" },
      { by: 'a', say: "I've never felt more like I was in a cartoon." },
      { by: 'b', say: "We're in a cartoon every single day out here." },
      { by: 'a', conf: "It wasn't our best moment as a team. It was definitely our funniest one." },
    ] },
    { id: 'nbn.6', turns: [
      { by: 'b', say: "You know you talked the entire time at {chal}? Like, the whole entire time?" },
      { by: 'a', say: "I talk when I'm nervous." },
      { by: 'b', say: "Then you must have been terrified, because that was a podcast." },
      { by: 'a', say: "Did you at least enjoy the podcast?" },
      { by: 'b', say: "...Episode three was pretty good." },
      { by: 'b', conf: "{a} never stopped talking, and somehow it was the only thing keeping me going. Don't tell {a.obj} that." },
    ] },
  ],
};
