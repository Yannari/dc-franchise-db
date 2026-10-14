// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/more-week.js — wider pools for the week's strategy (added, never replacing)
// ══════════════════════════════════════════════════════════════════════
//
// Written against docs/bb-dialogue-style.md. The read of 2026-10-13 aired a backdoor plan and a
// group lobby twice in four weeks: three backdoor entries and six lobbies were not enough.
// Roles as in hohweek.js ({a} the HOH, {b} the confidant, {c} {d} the nominees, {e} the backdoor
// target) and groups3.js ({a} the nominee lobbying, {b} {c} {d} the voters, {target} the other nominee).

export default {
  'talk.hohweek.plan.backdoor': [
    { id: 'hw.pb4', room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} has drawn the plan on the back of the HOH letter with a lip liner.' },
      { by: 'b', say: "What am I looking at?" },
      { by: 'a', say: "Monday. {c} and {d} on the block. Veto. One of them comes down. {e} goes up. Thursday, {e} goes home." },
      { by: 'b', say: "And if nobody uses the veto?" },
      { by: 'a', say: "Then I make sure somebody uses the veto." },
      { by: 'b', say: "You can't make sure of that." },
      { by: 'a', say: "Watch me." },
      { by: 'b', dr: "{a} drew a backdoor in lip liner. I've never been so scared of a piece of makeup." },
    ] },
    { id: 'hw.pb5', room: 'hoh-room', turns: [
      { by: 'b', say: "So it's {c} and {d}?" },
      { by: 'a', say: "For now." },
      { by: 'b', say: "'For now.'" },
      { by: 'a', say: "For now. Then it isn't." },
      { by: 'b', say: "...Oh. You're going after {e}." },
      { by: 'a', say: "I didn't say that." },
      { by: 'b', say: "You didn't have to." },
      { by: 'a', say: "Then don't say it either. Not to anybody. Not to {c}, not to {d}, not to your pillow." },
      { by: 'a', dr: "If {e} hears the word backdoor before Monday, {e} plays in the veto like a lion. So nobody says the word." },
    ] },
    { id: 'hw.pb6', room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} is lying on the floor, staring at the ceiling, while {b} sits on the bed.' },
      { by: 'a', say: "Can I tell you the scary version?" },
      { by: 'b', say: "There's a scary version?" },
      { by: 'a', say: "I don't nominate {e}. I nominate {c} and {d}, I pray the veto gets used, and {e} goes up in the replacement chair." },
      { by: 'b', say: "And if it doesn't get used, you've wasted your HOH." },
      { by: 'a', say: "And if it does, {e} is gone and never saw it coming." },
      { by: 'b', say: "That is the scary version." },
      { by: 'a', dr: "Nominating {e} straight up is safe. And {e} wins the veto, and then I've made an enemy for nothing. So, the scary version." },
    ] },
  ],
  'story.target.lobby.group': [
    { id: 'gl3.7', room: 'bedroom', presumes: ['noms'], turns: [
      { beat: '{a} sits down on the end of a bed where {b}, {c} and {d} are mid-conversation. The conversation stops.' },
      { by: 'a', say: "Don't stop on my account." },
      { by: 'b', say: "We were just..." },
      { by: 'a', say: "Talking about me. It's fine. Can I talk about me too?" },
      { by: 'c', say: "...Sure." },
      { by: 'a', say: "Here's the thing nobody's saying. {target} has a group in this house. I don't. So whoever keeps {target} is keeping a group. Whoever keeps me is keeping one person who owes them." },
      { by: 'd', say: "Owes them what?" },
      { by: 'a', say: "Whatever they want. Name it." },
      { by: 'b', dr: "{a} walked into a conversation about {a} and turned it into a pitch. I've got to respect that." },
    ] },
    { id: 'gl3.8', presumes: ['noms'], turns: [
      { by: 'a', say: "I'm going to do my campaign to all three of you at once, because I'm tired." },
      { by: 'b', say: "Honestly? Respect." },
      { by: 'a', say: "Keep me." },
      { by: 'c', say: "That's it?" },
      { by: 'a', say: "Keep me, and I'll owe you. That's the whole speech." },
      { by: 'd', say: "Okay, that's actually the best one I've heard today." },
      { by: 'c', say: "It's the shortest one I've heard today." },
      { by: 'a', say: "Same thing." },
      { by: 'd', dr: "Five people have pitched me today, and the one who said eleven words is the one I remember." },
    ] },
    { id: 'gl3.9', presumes: ['noms'], turns: [
      { by: 'b', say: "We should probably tell you where we're at." },
      { by: 'a', say: "Please." },
      { by: 'c', say: "We haven't decided." },
      { by: 'a', say: "All three of you haven't decided?" },
      { by: 'd', say: "Two of us haven't decided. One of us is leaning." },
      { by: 'a', say: "Leaning which way?" },
      { by: 'd', say: "...Towards keeping you." },
      { by: 'a', say: "Okay. Okay. I can work with leaning." },
      { by: 'a', dr: "One leaning my way and two maybes. That's more than I had this morning." },
    ] },
    { id: 'gl3.10', presumes: ['noms'], turns: [
      { beat: 'The kitchen. {a} slides three plates of toast across the counter to {b}, {c} and {d}.' },
      { by: 'b', say: "Is this a bribe?" },
      { by: 'a', say: "It's breakfast." },
      { by: 'c', say: "It's a breakfast bribe." },
      { by: 'a', say: "It's a breakfast that also happens to come from somebody who'd like to still be here on Friday." },
      { by: 'd', say: "...It's good toast." },
      { by: 'a', say: "Thank you. Think about it." },
      { by: 'c', dr: "Will toast change anybody's vote? Probably not. But people remember who fed them." },
    ] },
  ],
};
