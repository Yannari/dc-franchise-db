// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/announce.js — TJ telling the house something it did not know
// ══════════════════════════════════════════════════════════════════════
//
// tj-double (season.js): tonight is a double elimination. The user, 2026-10-17: "sometimes I have a random double
// vote, double Arena, double elimination, but I never scheduled it, and I don't know where TJ announced it". He
// says it before anybody deliberates, to the whole house; a and b are the two most worried of those who can be
// voted in, x and y anybody else in the room. {count} is how many go into the Arena.
//   tj-double.any    an open week
//   tj-double.men    a men's week (only the guys can be voted in)
//   tj-double.women  a women's week
export default {
  'tj-double.any': [
    { id: 'tjd.1', turns: [
      { beat: 'TJ walks into the common room, and everybody stops talking.' },
      { by: 'tj', say: "Grab a seat, everybody. I have news, and you are not going to like it." },
      { by: 'tj', say: "Tonight is not one elimination. It's two. {count} of you are going into the Arena tonight." },
      { by: 'a', say: "Two? Tonight?" },
      { by: 'tj', say: "Two. You vote, somebody goes in. Then you vote again." },
      { by: 'b', say: "That changes everything." },
      { by: 'x', opt: 1, say: "Then nobody's safe." },
      { by: 'tj', say: "That's the idea. See you at the vote." },
      { by: 'a', conf: "Everything we planned this week was for one name. Now we need two, and everybody in this house knows it." },
    ] },
    { id: 'tjd.2', turns: [
      { by: 'tj', say: "Change of plans, people. This week is a double elimination." },
      { beat: 'The room goes very quiet.' },
      { by: 'b', say: "Since when?" },
      { by: 'tj', say: "Since right now." },
      { by: 'a', say: "So two of us go home tonight." },
      { by: 'tj', say: "Two of you go into the Arena tonight. Whether you go home is up to you." },
      { by: 'y', opt: 1, say: "I need to go talk to some people." },
      { by: 'a', conf: "With one vote, I could have hidden. With two votes, there's nowhere to hide in this house." },
    ] },
  ],
  'tj-double.men': [
    { id: 'tjd.m1', turns: [
      { beat: 'TJ claps his hands once in the middle of the common room.' },
      { by: 'tj', say: "Guys, this one is for you. It's a men's week, and it's a double elimination." },
      { by: 'tj', say: "Two guys go into the Arena tonight. Ladies, you're safe from the vote. Start counting, gentlemen." },
      { by: 'a', say: "Two of us. Tonight." },
      { by: 'b', say: "There aren't that many of us left." },
      { by: 'x', opt: 1, say: "Then everybody had better start talking." },
      { by: 'b', conf: "There aren't many guys left, and two of us are going in tonight. I'm almost certainly on somebody's list." },
    ] },
  ],
  'tj-double.women': [
    { id: 'tjd.f1', turns: [
      { beat: 'TJ claps his hands once in the middle of the common room.' },
      { by: 'tj', say: "Ladies, this one is for you. It's a women's week, and it's a double elimination." },
      { by: 'tj', say: "Two women go into the Arena tonight. Guys, you're safe from the vote. Ladies, start counting." },
      { by: 'a', say: "Two of us. Tonight." },
      { by: 'b', say: "There aren't that many of us left." },
      { by: 'x', opt: 1, say: "Then everybody had better start talking." },
      { by: 'b', conf: "There aren't many women left, and two of us are going in tonight. I'm almost certainly on somebody's list." },
    ] },
  ],
};
