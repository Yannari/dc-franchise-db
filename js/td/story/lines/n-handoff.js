// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-handoff.js — walking in on the end of something
// ══════════════════════════════════════════════════════════════════════
// director.js chainScenes: two scenes run on from each other at one spot. When the first was a row
// (an argument, a blame, a confrontation), a, who has just walked up, asks b, who stayed, about it;
// c is the one who just left. Then the next conversation starts. Short: it's the seam between two
// scenes, not a scene. b only says what b just saw. Ids: 'nho.'.

export default {
  'handoff.tense': [
    { id: 'nho.t1', turns: [
      { by: 'a', say: "What was that about?" },
      { by: 'b', say: "Don't ask." },
      { by: 'a', say: "I'm asking." },
      { by: 'b', say: "{c} and I had a disagreement. It's fine. It's mostly fine." },
    ] },
    { id: 'nho.t2', turns: [
      { by: 'a', say: "Is {c} okay? {c} walked straight past me." },
      { by: 'b', say: "{c} will be fine. {c} just needs a minute." },
      { by: 'a', say: "And you?" },
      { by: 'b', say: "I need about a week. Sit down." },
    ] },
    { id: 'nho.t3', turns: [
      { by: 'a', say: "I could hear that from the other side of camp." },
      { by: 'b', say: "Great. So could everybody else, then." },
      { by: 'a', say: "Pretty much. You want to talk about it?" },
      { by: 'b', say: "No. Talk to me about literally anything else." },
    ] },
    { id: 'nho.t4', when: { voice: ['dry', 'calm'] }, turns: [
      { by: 'a', say: "You've got that look." },
      { by: 'b', say: "What look?" },
      { by: 'a', say: "The one people get right after they've talked to {c}." },
      { by: 'b', say: "...Yeah. That's fair." },
    ] },
    { id: 'nho.t5', when: { voice: ['warm', 'earnest', 'anxious'] }, turns: [
      { by: 'a', say: "Hey. I saw {c} leave. Are you two okay?" },
      { by: 'b', say: "Honestly, I don't know yet." },
      { by: 'a', say: "Do you want me to go after {c}?" },
      { by: 'b', say: "No. Stay. I'd rather have somebody here who isn't angry with me." },
    ] },
    { id: 'nho.t6', when: { voice: ['goofy', 'chaotic', 'teen'] }, turns: [
      { by: 'a', say: "Okay, I walked up at a really bad time, didn't I?" },
      { by: 'b', say: "The worst time." },
      { by: 'a', say: "Should I walk away and come back?" },
      { by: 'b', say: "No, it's fine, it's over. {c} won, probably." },
    ] },
  ],
};
