// Secret Base Desert, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/secret-base-desert.js: both sneak from the road to the hangar door
// between the searchlight sweeps; then both carry the glowing artifact out past the guards to the agent in dark glasses.
import { V, mergePools } from '../_kit.js';

const SN = { taskId: 'sneak-in' };
const AR = { taskId: 'artifact' };

const sneak = {
  'task-start.any': [
    { id: 'sbd2.sn-s5', when: SN, turns: [
      { beat: '{a} reads the nearest warning sign by moonlight. Under the skull there are three more, smaller skulls.' },
      { by: 'a', say: "It's a sign that's mostly skulls." },
      { by: 'b', say: "I think they mean it." },
      { by: 'a', say: "I think they mean it four times." },
    ] },
    { id: 'sbd2.sn-s6', when: SN, turns: [
      { by: 'b', say: "Hand signals. Fist means stop. Flat hand means go." },
      { by: 'a', say: "What does this mean?" },
      { beat: '{a} wiggles three fingers.' },
      { by: 'b', say: "That means you're not taking this seriously." },
    ] },
    { id: 'sbd2.sn-s7', when: SN, turns: [
      { beat: '{a} and {b} lie flat at the edge of the road, faces in the sand, as the first searchlight passes over their heads.' },
      { by: 'a', ...V("I've got sand in places sand should never go.", "Sand. Everywhere.", "Sand.", "There is SAND in places sand should NEVER go!", "I'm afraid there's sand in places sand should really never go.", "I am now part of the desert.") },
      { by: 'b', say: "Shh. Be the desert." },
    ] },
    { id: 'sbd2.sn-s8', when: SN, turns: [
      { by: 'b', say: "The fence buzzes louder when you're close. Listen for the buzz." },
      { by: 'a', say: "Everything buzzes out here. The bugs buzz. My ears buzz." },
      { by: 'b', say: "Then don't touch anything that buzzes." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'sbd2.sn-f5', when: SN, turns: [
      { beat: '{a} and {b} roll from sign to sign like two logs, freezing flat every time the light comes round, and roll right up to the hangar door.' },
      { by: 'b', say: "We rolled into a secret base." },
      { by: 'a', say: "I'm so dizzy. But I'm dizzy at the door." },
    ] },
    { id: 'sbd2.sn-f6', when: SN, turns: [
      { by: 'a', say: "The soldier's humming. While he hums, he's not looking." },
      { beat: 'Every time the soldier hums, they move. Every time he stops, they freeze. They reach the hangar door before his song ends.' },
      { by: 'b', say: "Hum, move, hum, move. We should thank him." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'sbd2.sn-a5', when: SN, turns: [
      { by: 'a', say: "The light catches us because our jackets are bright. Jackets off. Rub dirt on everything." },
      { by: 'b', say: "My face too?" },
      { by: 'a', say: "Especially your face. Your face glows." },
      { beat: 'Dark and dusty, they cross the whole field without the light ever stopping on them, and reach the hangar door.' },
    ] },
    { id: 'sbd2.sn-a6', when: SN, turns: [
      { beat: 'Marched back to the road again, {b} sits and counts the seconds between every sweep of the light out loud, three times through.' },
      { by: 'b', say: "Eleven seconds. Always eleven. We move for nine, we hide for two." },
      { beat: 'Nine seconds moving, two hiding, all the way across, and nobody sees them reach the door.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'sbd2.sn-t4', when: SN, turns: [
      { beat: '{a} is stuck in a gap under the fence, hips through, shoulders not, the wire buzzing a hand\'s width above {a.posAdj} back.' },
      { by: 'a', say: "I'm not stuck. I'm resting under a fence." },
      { by: 'b', say: "Breathe out! Make yourself thinner!" },
    ] },
    { id: 'sbd2.sn-t5', when: SN, turns: [
      { by: 'b', say: "Is that a soldier or a cactus?" },
      { by: 'a', say: "It hasn't moved in five minutes." },
      { by: 'b', say: "Neither have we. It's probably thinking the same thing." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'sbd2.sn-x4', when: SN, turns: [
      { beat: 'A searchlight lands on {a} mid-crawl. {a} freezes in a pose, arms out, one leg up, like a strange desert plant.' },
      { by: 'a', say: "I'm a plant. I've always been here." },
      { by: 'b', say: "Plants don't wear trainers! He's pointing at the road! Again!" },
    ] },
    { id: 'sbd2.sn-x5', when: SN, turns: [
      { beat: 'A dog trots out of the dark, sniffs {b}, and sits down beside {b}, barking happily, until a soldier comes to see why.' },
      { by: 'b', say: "It likes me! Why does it have to like me now?" },
      { by: 'a', say: "Back to the road! Say goodbye to the dog!" },
    ] },
  ],
  'task-done.any': [
    { id: 'sbd2.sn-dn4', when: SN, turns: [
      { by: 'a', say: "Should we knock?" },
      { by: 'b', say: "It's a secret base. You don't knock on a secret base." },
      { by: 'a', say: "I was raised to knock." },
    ] },
    { id: 'sbd2.sn-dn5', when: SN, turns: [
      { beat: 'Pressed against the hangar door, {b} turns and looks back across the field at the lights still sweeping it.' },
      { by: 'b', say: "We went through all that." },
      { by: 'a', say: "And we have to go back through it carrying something. Don't look." },
    ] },
    { id: 'sbd2.sn-dn6', when: SN, turns: [
      { by: 'b', say: "If they ask, we were never here." },
      { by: 'a', say: "There are cameras on every post." },
      { by: 'b', say: "Then we were here, but we were very quiet." },
    ] },
  ],
};

const artifact = {
  'task-start.any': [
    { id: 'sbd2.ar-s5', when: AR, turns: [
      { beat: '{b} lifts a sheet. Underneath is a big jar with something in it that blinks.' },
      { by: 'b', say: "Not that. Definitely not that." },
      { by: 'a', say: "Put the sheet back. Put it back and don't tell me what it was." },
    ] },
    { id: 'sbd2.ar-s6', when: AR, turns: [
      { by: 'a', say: "It's warm. Why is it warm?" },
      { by: 'b', say: "Maybe it's been in the sun." },
      { by: 'a', say: "We're inside. It's night. It's warm on its own." },
    ] },
    { id: 'sbd2.ar-s7', when: AR, turns: [
      { beat: '{a} and {b} each take one end of the artifact and lift. It\'s heavier than either of them expected, and very, very smooth.' },
      { by: 'b', ...V("It's like carrying a giant wet bar of soap.", "It's like a big bar of soap.", "Soap. Giant soap.", "It's like carrying a GIANT bar of SOAP!", "It's a little like carrying a giant, wet bar of soap.", "Somebody built a spaceship out of soap.") },
      { by: 'a', say: "Don't squeeze it. Soap goes flying when you squeeze it." },
    ] },
    { id: 'sbd2.ar-s8', when: AR, turns: [
      { by: 'b', say: "Which way is out? Every row of crates looks the same." },
      { by: 'a', say: "Follow the draught. The door lets in the cold." },
      { beat: 'They both lick a finger and hold it up in the dark, very seriously.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'sbd2.ar-f5', when: AR, turns: [
      { beat: '{a} and {b} slide the artifact onto a hand trolley from the hangar, push it slowly past a dozing guard, and wheel it right up to the fence.' },
      { by: 'b', say: "We stole a trolley too." },
      { by: 'a', say: "We borrowed a trolley." },
      { beat: 'The agent turns the artifact over in the dark, finds no mark on it, and hands them the tip.' },
    ] },
    { id: 'sbd2.ar-f6', when: AR, turns: [
      { by: 'a', say: "Put your coat over it. Both of us walk like we're carrying a cake to a party." },
      { beat: 'They carry the cake to the party, nodding to a guard on the way. He nods back. The agent takes it without a scratch.' },
      { by: 'b', say: "He nodded back! He thought we worked here!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'sbd2.ar-a5', when: AR, turns: [
      { by: 'b', say: "It hums louder when it's moving fast. That's what keeps giving us away. We have to walk it so slowly it falls asleep." },
      { beat: 'They walk it so slowly that the hum drops to a purr, then to nothing, and they pass two guards without a sound.' },
      { by: 'a', say: "It fell asleep. We put an alien thing to sleep." },
      { beat: 'The agent checks it, finds no scratch, and hands over the tip.' },
    ] },
    { id: 'sbd2.ar-a6', when: AR, turns: [
      { beat: 'Back in the hangar, {a} pads the artifact all over with socks, gloves and a scarf, and ties it all on with a shoelace.' },
      { by: 'a', say: "Now if we drop it, it lands on socks." },
      { beat: 'They don\'t drop it. Under all the socks, the agent finds it without a scratch, and hands over the tip.' },
      { by: 'b', say: "I'm not getting those socks back, am I?" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'sbd2.ar-t4', when: AR, turns: [
      { beat: '{a} and {b} are hiding behind a machine covered in a sheet, holding the artifact between them. The machine starts making a noise.' },
      { by: 'a', say: "What's it doing? Why is it waking up?" },
      { by: 'b', say: "Maybe it's jealous of the other glowing thing!" },
    ] },
    { id: 'sbd2.ar-t5', when: AR, turns: [
      { by: 'b', say: "My arms have gone to sleep." },
      { by: 'a', say: "Then wake them up! Quietly!" },
      { by: 'b', say: "How do you wake up arms quietly?" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'sbd2.ar-x4', when: AR, turns: [
      { beat: 'Ten steps from the agent, the artifact sneezes out a puff of green light. A siren starts up, and two guards walk them back to the hangar.' },
      { by: 'a', say: "It sneezed! It gave us away by sneezing!" },
      { by: 'b', say: "Put it back! Try again! And don't let it near any dust!" },
    ] },
    { id: 'sbd2.ar-x5', when: AR, turns: [
      { beat: 'The agent holds the artifact up to the moon, then points at a tiny chip on the edge, and hands it back without a word.' },
      { by: 'b', say: "That chip was already there!" },
      { by: 'a', say: "He doesn't believe us! Back to the crates!" },
    ] },
  ],
  'task-done.any': [
    { id: 'sbd2.ar-dn4', when: AR, turns: [
      { beat: 'The agent puts the artifact into a metal case, snaps it shut, and gets into a black car without saying a word.' },
      { by: 'a', say: "Where's he taking it?" },
      { by: 'b', say: "We'll never know. That's the point of him." },
    ] },
    { id: 'sbd2.ar-dn5', when: AR, turns: [
      { by: 'b', say: "My hands are glowing a bit. Are your hands glowing?" },
      { by: 'a', say: "A bit." },
      { by: 'b', say: "That'll wash off. Probably." },
    ] },
    { id: 'sbd2.ar-dn6', when: AR, turns: [
      { by: 'a', say: "I'm going to look at the sky differently now." },
      { by: 'b', say: "Differently how?" },
      { by: 'a', say: "Like it owes us a thank-you note." },
    ] },
  ],
};

export default mergePools(sneak, artifact);
