// ══════════════════════════════════════════════════════════════════════
// ci/faces.js — the faces a persona can wear (spec §4.6)
// ══════════════════════════════════════════════════════════════════════
//
// Every image in assets/guests, tagged by WHAT IT SHOWS. The folder prefixes
// (athlete-, crew-, fan-, senior-, vet-) are the makeover roles those images
// were drawn for on other shows — they say nothing about the face: most of
// "senior-" are women in their twenties. Read the picture, not the file name.
//
// First pass drafted by looking at all 84 on 2026-09-30. Correct it here:
//   presents  'woman' | 'man' | 'androgynous' — how the face reads at a glance
//   age       [lo, hi] — the ages it could pass for on a profile
//   vibe      a few words for the impression it gives
//   look      one line a person would use to describe it ("the one with the
//             braids"); photo prompts and lines read it
//   sameArt   other files of the SAME drawing — a season never uses both
//
// A catfish's face is chosen to fit the persona's age and look, never at
// random (pickFace).

const F = (id, presents, age, vibe, look, sameArt) =>
  ({ id, file: `assets/guests/${id}.png`, presents, age, vibe, look, ...(sameArt ? { sameArt } : {}) });

export const FACES = [
  F('athlete-blake', 'man', [18, 25], ['sly', 'edgy'], 'grey hood pulled up, black hair, a sly grin'),
  F('athlete-brett', 'man', [22, 30], ['easygoing', 'jock'], 'buzz cut, broad jaw, plain white tee'),
  F('athlete-chad', 'man', [24, 32], ['confident', 'polished'], 'swept brown hair, light stubble, navy button-down, a smirk'),
  F('athlete-clay', 'man', [20, 28], ['outdoorsy', 'cocky'], 'shaggy blond hair under a green cap, flushed cheeks, a compass on his vest'),
  F('athlete-cory', 'man', [22, 32], ['playful', 'loud'], 'curly black hair, full beard and mustache, mid-laugh'),
  F('athlete-curtis', 'man', [20, 28], ['nerdy', 'scheming'], 'round glasses, swept brown hair, a chipped tooth, hand on his chin', ['vet-curtis']),
  F('athlete-damon', 'man', [18, 26], ['edgy', 'punk'], 'spiky black hair shaved on one side, eyebrow and lip piercings, dark liner'),
  F('athlete-dusty', 'man', [20, 28], ['country', 'rowdy'], 'blond hair under a navy cap, red plaid shirt, a scuffed cheek'),
  F('athlete-evan', 'man', [18, 24], ['earnest', 'nervous'], 'swept red hair, wide eyes, a little soul patch'),
  F('athlete-hudson', 'man', [22, 30], ['flashy', 'party'], 'blond pompadour, bright blue eyes, a huge grin, a loud printed shirt'),
  F('athlete-jabari', 'man', [22, 30], ['cool', 'confident'], 'close-cropped hair, a stud earring, a slow knowing smile'),
  F('athlete-jordan', 'man', [18, 22], ['goofy', 'young'], 'curly brown hair under a green cap, braces, a big grin'),
  F('athlete-killian', 'man', [20, 28], ['awkward', 'unsure'], 'short curly hair, scratching his head, a lopsided frown'),
  F('athlete-lance', 'man', [22, 32], ['intense', 'serious'], 'slicked black hair, a hard stare, black track jacket', ['vet-lance']),
  F('athlete-travis', 'man', [28, 38], ['gym', 'smug'], 'headband over a buzz cut, a trimmed beard, navy shirt'),
  F('athlete-troy', 'man', [20, 28], ['laid-back', 'unsure'], 'shaggy light-brown hair, a tank top, a sideways glance'),
  F('athlete-wyatt', 'man', [20, 28], ['hyper', 'goofy'], 'buzz cut, a gap in his front teeth, an olive vest'),
  F('athlete-zach', 'man', [18, 24], ['frat', 'panicky'], 'curly hair under a red-and-white letter cap, mouth open in alarm'),
  F('crew-bryce', 'man', [22, 30], ['smooth', 'flirty'], 'swept brown hair, a hoop earring, a denim jacket, a half smile'),
  F('crew-jax', 'man', [22, 30], ['flirty', 'party'], 'bleached swoop of hair, a beard, a wink, a retro track jacket'),
  F('crew-keanu', 'man', [22, 32], ['bold', 'fierce'], 'long black hair tied back, tattooed shoulders, a big fierce grin'),
  F('crew-koa', 'man', [18, 26], ['sweet', 'calm'], 'black hair in a top bun, a green hoodie, a gentle smile'),
  F('crew-malakai', 'man', [20, 28], ['punk', 'sly'], 'a green mohawk, a pinned punk jacket, a sideways smirk'),
  F('crew-reef', 'man', [20, 28], ['surfer', 'laid-back'], 'long blond hair with a shell clip, open striped shirt, shading his eyes'),
  F('crew-rio', 'man', [20, 26], ['sunny', 'simple'], 'spiky blond hair, an orange tank top, an easy smile'),
  F('crew-roman', 'man', [20, 28], ['musical', 'friendly'], 'long wavy ginger hair in a ponytail, headphones round his neck'),
  F('crew-trey', 'man', [22, 30], ['cocky', 'athletic'], 'bleach-tipped high-top, a goatee, a hoop earring, letterman jacket'),
  F('crew-xavier', 'man', [28, 38], ['gentle', 'big'], 'shaved head, broad shoulders in a green tank, a shy smile'),
  F('crew-zane', 'man', [22, 32], ['nerdy', 'earnest'], 'round glasses, brown hair with a clip in it, a blue button shirt'),
  F('crew-zed', 'man', [18, 26], ['cocky', 'trouble'], 'messy black hair shaved at the side, a red hoodie, a wicked grin'),
  F('fan-casey', 'androgynous', [18, 26], ['grungy', 'chaotic'], 'long messy dark hair half up, a flannel shirt, a skull necklace, mid-yell'),
  F('fan-gabe', 'man', [25, 35], ['nervy', 'rugged'], 'square jaw, a dark beard, a tattooed arm, gritted teeth'),
  F('fan-jamie', 'man', [18, 22], ['shy', 'sweet'], 'brown bowl cut, pink cheeks, a sweater vest, a bashful smile'),
  F('fan-jessi', 'woman', [18, 24], ['grumpy', 'fierce'], 'black hair in two space buns, a scowl, a navy track jacket'),
  F('fan-kiki', 'woman', [20, 28], ['unimpressed', 'online'], 'long straight brown hair, a side-eye, phone in hand'),
  F('fan-lexi', 'woman', [20, 28], ['eager', 'overachiever'], 'blond ponytail, a salute, a scout shirt covered in badges'),
  F('fan-maddie', 'woman', [20, 28], ['bookish', 'warm'], 'big round glasses, long dark braids, a nervous smile'),
  F('fan-milo', 'man', [18, 24], ['nerdy', 'cheerful'], 'curly hair in two puffs, glasses, a gap-toothed grin, a green vest'),
  F('fan-nico', 'man', [18, 24], ['moody', 'emo'], 'messy black hair, tired eyes, a black hoodie, a sneer'),
  F('fan-nikki', 'woman', [20, 28], ['artsy', 'eccentric'], 'bleached quiff, painted lines on her face, a paintbrush in hand'),
  F('fan-oakley', 'androgynous', [18, 26], ['outdoorsy', 'cheerful'], 'sandy hair in a ponytail, freckles, a khaki field vest'),
  F('fan-parker', 'androgynous', [18, 24], ['calm', 'quiet'], 'shaggy black hair, a purple tee, a steady look'),
  F('fan-phoebe', 'woman', [18, 24], ['bubbly', 'loud'], 'ginger hair in two puffs, freckles, a huge open laugh'),
  F('fan-riley', 'androgynous', [20, 28], ['bookish', 'wry'], 'curly brown hair, round glasses, a green turtleneck'),
  F('fan-robin', 'androgynous', [20, 28], ['dry', 'suspicious'], 'straight black hair, a red jacket, narrowed eyes'),
  F('fan-sami', 'woman', [20, 28], ['goth', 'dry'], 'long black hair with a teal streak, a beauty mark, half-closed eyes'),
  F('fan-sonny', 'woman', [18, 26], ['glam', 'flirty'], 'long platinum hair, a polka-dot bow, pearls over a skull tee'),
  F('fan-toni', 'androgynous', [18, 24], ['grumpy', 'restless'], 'messy black hair, an ear stud, a white collar, a grimace'),
  F('senior-albert', 'man', [22, 30], ['gentle', 'nerdy'], 'floppy brown hair, green-tinted glasses, a shy smile'),
  F('senior-alma', 'woman', [22, 30], ['sultry', 'mysterious'], 'long black hair with purple streaks, heavy-lidded eyes, a pendant'),
  F('senior-arthur', 'man', [18, 25], ['odd', 'intense'], 'shaggy brown hair, a scarred cheek, homemade armor held with a safety pin'),
  F('senior-bea', 'woman', [20, 28], ['sweet', 'cute'], 'straight black hair with bangs, a drop earring, a heart on her tee'),
  F('senior-bonnie', 'woman', [20, 28], ['goth', 'playful'], 'black pigtails and bangs, winged liner, a spiked choker, ear piercings'),
  F('senior-gertrude', 'woman', [30, 45], ['cold', 'severe'], 'white-blond hair in a low braid, a flat stare, a black turtleneck'),
  F('senior-hazel', 'androgynous', [20, 28], ['sharp', 'cool'], 'dark blue hair swept over a shaved side, a plaid shirt, a smirk'),
  F('senior-hortense', 'woman', [18, 28], ['eerie', 'quiet'], 'long platinum hair, very pale skin, pale eyes, a lace collar'),
  F('senior-irene', 'woman', [20, 28], ['punk', 'loud'], 'spiky lime-green hair, neon eyeshadow, fishnet sleeves'),
  F('senior-irwin', 'man', [45, 62], ['gruff', 'rugged'], 'a bush hat with a band of teeth, a craggy lined face, a scowl'),
  F('senior-mabel', 'woman', [20, 30], ['bubbly', 'nerdy'], 'ginger hair in two buns, big glasses, freckles'),
  F('senior-maureen', 'woman', [20, 30], ['adventurous', 'bright'], 'an aviator cap with goggles, a brown ponytail, a big grin'),
  F('senior-midge', 'woman', [25, 40], ['sassy', 'diva'], 'big curly brown hair with a pink bow, hoop earrings, a pout'),
  F('senior-nona', 'woman', [25, 35], ['boho', 'warm'], 'wavy auburn hair under a flowered headscarf, rosy cheeks, laughing'),
  F('senior-oswald', 'man', [35, 52], ['mild', 'dad'], 'thinning hair, round glasses, a sweater vest, a mild smile'),
  F('senior-patricia', 'woman', [25, 40], ['unbothered', 'dry'], 'dark curls in a side puff, a half-lidded look, a green top'),
  F('senior-ralph', 'man', [25, 35], ['tough', 'grumpy'], 'a black flat-top, a sleeveless shirt, a glare'),
  F('senior-wally', 'man', [18, 25], ['slacker', 'goofy'], 'messy black hair, a gap-toothed grin, a green tee'),
  F('vet-barry', 'man', [20, 30], ['gamer', 'whiny'], 'messy brown hair, rectangular glasses, an orange hoodie, a controller'),
  F('vet-bradley', 'man', [18, 25], ['cocky', 'sporty'], 'spiky dark hair, a red hoodie, a sharp grin'),
  F('vet-clark', 'man', [22, 30], ['cocky', 'smug'], 'spiky brown hair, a smug look, pointing at himself'),
  F('vet-conrad', 'man', [18, 25], ['friendly', 'boyish'], 'messy brown hair, freckles, a purple hoodie'),
  F('vet-curtis', 'man', [20, 28], ['nerdy', 'scheming'], 'round glasses, swept brown hair, a chipped tooth, hand on his chin', ['athlete-curtis']),
  F('vet-desmond', 'man', [25, 35], ['cool', 'judgy'], 'a tall flat-top, a full beard, a gold earring, a grey hoodie'),
  F('vet-dwight-jr', 'man', [20, 28], ['hype', 'jock'], 'a red football jersey, a huge shouting grin'),
  F('vet-frank', 'man', [25, 35], ['blunt', 'working'], 'black hair, safety goggles, a hi-vis vest'),
  F('vet-gideon', 'man', [18, 24], ['posh', 'scheming'], 'ginger bowl cut, a monocle, an argyle sweater vest'),
  F('vet-gordon', 'man', [20, 30], ['loud', 'whiny'], 'brown bowl cut, glasses, a teal hoodie, mid-shout'),
  F('vet-lance', 'man', [22, 32], ['intense', 'serious'], 'slicked black hair, a hard stare, black track jacket', ['athlete-lance']),
  F('vet-martin', 'man', [22, 30], ['hippie', 'mellow'], 'long blond hair under a green bandana, round glasses, stubble'),
  F('vet-miller', 'man', [20, 28], ['jock', 'cocky'], 'flat blue-dyed hair, a letterman jacket, a big grin'),
  F('vet-norton', 'man', [25, 35], ['deadpan', 'pale'], 'black hair, dark circles, a black turtleneck, a flat stare'),
  F('vet-percy', 'man', [22, 30], ['smooth', 'smug'], 'swept brown hair, a half-lidded smile, a teal collared shirt'),
  F('vet-rex', 'man', [18, 25], ['brooding', 'grumpy'], 'shaggy black hair, a scowl, a black hoodie'),
  F('vet-silas', 'man', [25, 40], ['creepy', 'gaunt'], 'long straight black hair, a pale gaunt face, a trench coat'),
  F('vet-vincent', 'man', [30, 45], ['showman', 'charming'], 'a pompadour, a handlebar mustache, tinted glasses, a tan suit'),
];

const BY_ID = new Map(FACES.map(f => [f.id, f]));
export const faceById = id => BY_ID.get(id) || null;

/** Two ids are the same drawing (or the same id). */
export const sameArt = (a, b) => a === b || !!faceById(a)?.sameArt?.includes(b);

const words = s => new Set(String(s || '').toLowerCase().match(/[a-z]+/g) || []);

/** How well a face sells a persona: -Infinity when it cannot at all. */
export function faceFit(face, persona = {}) {
  const wants = persona.gender === 'm' ? 'man' : persona.gender === 'f' ? 'woman' : null;
  if (wants && face.presents !== wants && face.presents !== 'androgynous') return -Infinity;
  const age = persona.age ?? 26;
  const [lo, hi] = face.age;
  const out = age < lo ? lo - age : age > hi ? age - hi : 0;
  let s = -out * 2 - Math.abs(age - (lo + hi) / 2) * 0.1;
  if (face.presents === 'androgynous' && wants) s -= 0.5;
  const look = words(persona.look);
  for (const w of words(face.look)) if (look.has(w) && w.length > 3) s += 1;
  const vibe = new Set(persona.vibe || []);
  for (const v of face.vibe) if (vibe.has(v)) s += 1;
  return s;
}

/** The best face for a persona that nobody holds yet (nor its twin). Same
 *  answer every time: ties go to the id, so the author sees what plays. */
export function pickFace(persona = {}, taken = []) {
  const free = FACES.filter(f => !taken.some(t => sameArt(t, f.id)));
  return free.map(f => [f, faceFit(f, persona)]).filter(([, s]) => s > -Infinity)
    .sort((a, b) => b[1] - a[1] || a[0].id.localeCompare(b[0].id))[0]?.[0] || null;
}
