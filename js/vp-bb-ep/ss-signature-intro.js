// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-signature-intro.js — the season's signature, explained before it starts
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-11-02: "secret box isnt in the list of the available twist so i dont even know what it is the voice
// doesnt explain it too i thought i said all the twist have to be explained before they happen". On launch night,
// before the first housemate walks on, the host tells the people at home what this season's signature twist is and
// how it works (js/ss/twists.js SIGNATURES; the engine: js/ss/hidden-groups.js, js/ss/signatures.js, js/ss/hidden.js).
// The housemates are not told: the house finds out the way the real show's houses did.

/** Per signature: the rules panel's rows, and what the host says, each line opening one more row. */
export const SIGNATURE_INTRO = {
  'secret-box': {
    rows: [['THE BOX', 'three housemates live in a black glass cube in the living room'], ['THE WAY OUT', "find one housemate's secret and tell the Voice"],
      ['THE PRICE', 'the housemate they expose is nominated'], ['THREE WEEKS', 'then the rest walk in, and one of them walks in nominated']],
    lines: [
      'In the corner of the living room there is a black glass cube. We call it the Secret Box.',
      'Tonight, three of the people you are about to meet will not move into the house. They will live inside that box, a metre away from everybody. They will see and hear everything, and nobody in the house will know they are there.',
      "To get out, they have to find one housemate's secret, and tell the Voice. If they are right, they walk into the house at the next prime, and the housemate they exposed is nominated.",
      'They have three weeks. Whoever is still inside after that walks in anyway, and one of them walks in nominated.',
    ],
  },
  intruders: {
    rows: [['NEXT DOOR', 'three housemates live in a second house, at the end of a tunnel'], ['EVERY WEEK', 'they spy, steal the clue, and one of them comes in'],
      ['THE TUNNEL', 'if the house finds it, they all come in, and one is nominated'], ['THREE WEEKS', 'then whoever is left comes in']],
    lines: [
      'Next door to the House of Secrets there is a second, smaller house, and a tunnel between the two.',
      'Tonight, three of the people you are about to meet will go down that tunnel instead of into the house. The house does not know they exist.',
      'Every week they spy on the house, they steal the clue off the living-room table, and one of them walks in as a new housemate.',
      'If the house finds the tunnel first, they all come in at the next prime, and one of them is nominated. After three weeks, whoever is left comes in.',
    ],
  },
  'crystal-house': {
    rows: [['THE GARDEN', 'three housemates live in a glass house, in full view'], ['EVERY PRIME', 'the main house votes one of them in'],
      ['THREE WEEKS', 'any still inside come in, and one of them is nominated']],
    lines: [
      'In the garden of the House of Secrets there is a house made of glass.',
      'Tonight, three of the people you are about to meet will live in it, in full view of the main house, playing the same game from the other side of the glass.',
      'Every prime, the main house votes to let one of them in. After three weeks, any still inside come in, and one of them comes in nominated.',
    ],
  },
  hotel: {
    rows: [['NEXT DOOR', 'three housemates live in the hotel'], ['THE GALLERY', 'two hundred portraits, and three of them are real'],
      ['TWO WEEKS', 'then they walk in; the first face found walks in nominated']],
    lines: [
      'Next door to the House of Secrets there is a hotel, and tonight three of the people you are about to meet are checking into it instead of the house.',
      'In the house, there is a gallery of two hundred portraits. Three of those faces are theirs, and the house will be hunting for them.',
      'After two weeks the three walk in. If the house found any of their faces, the first one found walks in nominated.',
    ],
  },
  yacht: {
    rows: [['THE PIER', 'four housemates live on a yacht'], ['THE DECK', 'every secret they get right puts its holder up, one a week'],
      ['TWO WEEKS', 'then the four come aboard the house']],
    lines: [
      'At the pier, there is a yacht. Tonight, four of the people you are about to meet will live on it instead of in the house.',
      'From the deck they will investigate the house. Every secret they get right puts its holder up for nomination, one a week.',
      'After two weeks, the four of them come aboard the House of Secrets.',
    ],
  },
  masters: {
    rows: [['TWO OF THEM', 'chosen in secret by the Voice tonight'], ['EVERY WEEK', 'they add one housemate to the nominations'],
      ['UNMASKED', 'the power ends, and they are nominated themselves'], ['WRONG', 'a wrong accusation costs the accuser up to $2,500 a name']],
    lines: [
      'Tonight, the Voice will choose two of the people you are about to meet, in secret. They will be the Masters of the Nominations.',
      'Every week, the two of them add one more housemate to the nominations, and nobody knows who did it.',
      'If the house names them both in the confessional, the power ends, and the Masters are nominated themselves the next week.',
      'But a wrong accusation costs the accuser up to $2,500, paid to each of the two they named.',
    ],
  },
  thieves: {
    rows: [['TWO OF THEM', 'chosen in secret by the Voice tonight'], ['NOTHING', 'they start the season with an empty kitty'],
      ['EVERY WEEK', "they steal from the others' kitties"], ['UNMASKED', 'whoever names them both takes everything they have']],
    lines: [
      'Tonight, the Voice will choose two of the people you are about to meet, in secret. They will be the House Thieves.',
      "They start with an empty kitty, and every week they steal from everybody else's. The house will see the money go, but not who took it.",
      'Whoever names them both in the confessional takes everything the thieves have. A wrong accusation costs the accuser up to $2,500, paid to each of the two they named.',
    ],
  },
  'control-tower': {
    rows: [['TWICE', 'an elimination this season will not be what it looks like'], ['THE TOWER', 'a glass room above the house, with screens'],
      ['TWO WEEKS', 'they choose one nominee every week, then come back down']],
    lines: [
      'Twice this season, a housemate the house believes eliminated will not go home.',
      'They will climb to a glass tower above the house, where they can watch every room on its screens.',
      'For two weeks they choose one nominee every week, and the house will not know who is choosing. Then they come back down into the house.',
    ],
  },
};

// (a twist the setup screen started later: the words say when, instead of tonight)
const LATER = {
  masters: n => [`When only ${n} housemates are left, the Voice will choose two of them, in secret. They will be the Masters of the Nominations.`],
  thieves: n => [`When only ${n} housemates are left, the Voice will choose two of them, in secret. They will be the House Thieves.`],
  'control-tower': n => [`Twice this season, starting when ${n} housemates are left, a housemate the house believes eliminated will not go home.`],
};
function laterStart(sig, w) {
  const n = Number(sig?.startAt);
  if (!n || !LATER[sig.id]) return w;
  const rows = w.rows.map((r, i) => (i === 0 ? [`AT ${n} LEFT`, r[1].replace(/ tonight$/, ' then')] : r));
  return { rows, lines: [...LATER[sig.id](n), ...w.lines.slice(1)] };
}

/**
 * The screen after the cold open: the host explains the season's signature to the people at home. `sig` is the act's
 * `signature` ({ id, name }); null when the season has none or none of these words.
 */
export function ssSignatureIntroScreen(sig, host, base, studio) {
  const w0 = SIGNATURE_INTRO[sig?.id];
  if (!w0) return null;
  const w = laterStart(sig, w0);
  const name = sig.name || '';
  /** @type {any[]} */ const steps = [
    { k: 'host', by: host, t: "One more thing before we meet them. There is something the housemates don't know yet, and you are going to.", toast: ['THIS SEASON', '#e0b84a'] },
    { k: 'host', by: host, t: `This season's twist is ${name}.`, toast: [name.toUpperCase(), '#7c5cff'], shake: true, rule: 0 },
    ...w.lines.map((t, i) => ({ k: 'host', by: host, t, rule: Math.min(i + 1, w.rows.length), ahead: true })),
    { k: 'host', by: host, t: "Now, let's meet the first one.", rule: w.rows.length },
  ];
  return base('bb-ss-launch-signature', { ...studio, title: name, label: 'This Season', sub: 'The twist, explained', cast: [],
    rules: w.rows, rulesTitle: `${name.toUpperCase()} · HOW IT WORKS`, steps });
}
