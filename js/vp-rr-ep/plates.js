// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/plates.js — every place's painted plates, where people can stand
// ══════════════════════════════════════════════════════════════════════
//
// The user's edited plates (Downloads/RidonculousRace-frames/done/<nn-place>), copied to
// assets/sets/rr/<place>/<file>.webp by tools/rr-vp-plates.py, mapped to the place
// library's stretches (js/rr/places/*.js, each stretch's `plate` text).
//
// A plate says where FEET go, in % of the 16:9 frame: `g` is the ground line (or a
// [top, bottom] band) and `x` the stretch of it that is walkable. `water: true` is a
// plate nobody stands on: people in it swim, dive, ride or fly. `spots` are the only
// places to stand (stepping stones, a dock, a cliff top). `mat` is a Chill Zone mat
// already painted on the plate.
//
// A stretch has `talk` plates (where its scenes are shot) and an `act` plate (doing the
// task, or riding): `path` is the route a team takes across it, `mode` how (walk, hop,
// climb, zip, swim, dive, para, ride, bungee), `prop` a cut-out that goes with them
// (a camel, a jet ski, the parachute), `fx` the particles of the work.

const p = (f, g = 90, x = [12, 88], more = {}) => ({ f, g, x, ...more });

export const RACE = {
  dir: 'race',
  gate: p('gate', 93, [8, 62]),
  cabin: p('cabin', 62, [8, 46], { seats: [[13.5, 62], [33, 62]] }),
  galley: p('galley', 96, [26, 96]),
  sky: p('sky', 0, [0, 0], { people: false }),
  runway: p('runway', 97, [6, 60]),
  map: 'worldmap',
  confess: 'confess',
  logo: 'logo',
  props: ['c-donbox', 'c-donbox-tip', 'c-tip', 'c-tip-gold', 'c-boomerang', 'c-mat', 'plane', 'don'],
};

export const PLACE_PLATES = {
  'home-city': {
    src: '02-home-city', title: 'present-9434583', opener: p('arrive-9434588', 97, [14, 86]),
    arrive: [p('arrive-9434797', 95, [30, 92])],
    props: { helmet: 'Empty purple helmet with chin strap-2', trolley: 'Teal zipline trolley with hand grips-5' },
    st: {
      'to-tower': { talk: [p('arrive-9434588', 97, [14, 86]), p('arrive-9434797', 95, [30, 92])] },
      tower: {
        talk: [p('task-9434810', 96, [8, 90])],
        sides: {
          stairs: { talk: [p('task-9434876', 93, [10, 70])],
            act: p('task-9434855', 95, [10, 90], { mode: 'climb', path: [[62, 96], [44, 78], [66, 60], [44, 44], [64, 28]], fx: 'sweat' }) },
          skydeck: { talk: [p('task-9434868', 96, [10, 60])],
            act: p('task-9434827', 70, [12, 88], { mode: 'walk', path: [[8, 52], [30, 53], [55, 53], [80, 52], [96, 50]], fx: 'wind' }) },
        },
      },
      zipline: { talk: [p('task-9434876', 93, [10, 70])],
        act: p('task-9435028', 0, [0, 0], { water: true, mode: 'zip', prop: 'trolley', path: [[12, 32], [30, 41], [48, 51], [66, 60]], fx: 'wind' }) },
      mat: { talk: [p('travel-9435166', 95, [6, 94])] },
    },
  },
  'red-sand-desert': {
    src: '03-red-sand-desert', title: 'present-9435500', opener: p('present-9435572', 88, [10, 70]),
    arrive: [p('arrive-9435432', 96, [8, 92])],
    props: { camel: 'camel', taxi: 'taxi', jars: 'spice-jars', merchant: 'spice-merchant', stew: 'stew-bowl', chef: 'desert-chef' },
    st: {
      taxi: { talk: [p('arrive-9435299', 93, [22, 92]), p('travel-9435869', 95, [60, 96])],
        act: p('arrive-9435392', 95, [6, 94], { mode: 'ride', prop: 'taxi', path: [[-14, 96], [50, 96], [114, 96]] }) },
      spices: { talk: [p('task-9435287', 99, [10, 90]), p('task-9435344', 99, [10, 90])],
        act: p('task-9435287', 99, [10, 90], { mode: 'search', prop: 'jars', fx: 'spice' }) },
      camel: { talk: [p('present-9435572', 88, [10, 70])],
        act: p('present-9435500', 86, [10, 90], { mode: 'ride', prop: 'camel', path: [[-12, 86], [40, 85], [112, 86]], fx: 'dust' }) },
      stew: { talk: [p('task-9435484', 99, [8, 92])],
        act: p('task-9435484', 99, [8, 92], { mode: 'eat', prop: 'stew', fx: 'steam' }) },
      run: { talk: [p('task-9435630', 93, [12, 70])] },
      mat: { talk: [p('chill-9434778', 74, [6, 96], { mat: [46, 70] }), p('chill-9434777', 76, [6, 96], { mat: [18, 74] })] },
    },
  },
  'iron-tower-city': {
    src: '04-iron-tower-city', title: 'present-9435854', opener: p('present-9436193', 97, [8, 92]),
    arrive: [p('arrive-9435958', 94, [8, 70])],
    props: { pad: 'Angry Bonneted Baby Sketch Pad-4', cheese: 'Giant golden cheese wheel-1', skull: 'Muted tan cartoon catacomb skull-5' },
    st: {
      'tower-cab': { talk: [p('travel-9436558', 97, [6, 94])],
        act: p('travel-9436549', 96, [6, 94], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 97], [50, 96], [114, 97]] }) },
      caricature: { talk: [p('task-9435855', 95, [8, 92]), p('present-9435854', 95, [8, 92])],
        act: p('task-9435855', 95, [8, 92], { mode: 'draw', prop: 'pad', fx: 'sparkle' }) },
      'catacomb-walk': { talk: [p('task-9436001', 90, [10, 88])] },
      catacombs: { talk: [p('task-9436279', 96, [6, 94])],
        act: p('task-9436279', 96, [6, 94], { mode: 'search', prop: 'skull', fx: 'dust' }) },
      'cheese-raft': { talk: [p('task-9436302', 96, [6, 94])],
        act: p('task-9436198', 0, [0, 0], { water: true, mode: 'ride', prop: 'cheese', path: [[-12, 84], [45, 82], [112, 80]], fx: 'splash' }) },
      mat: { talk: [p('chill-9436288', 82, [6, 94], { mat: [50, 78] })] },
    },
  },
  'great-wall-hills': {
    src: '11-great-wall-hills', title: 'present-9440465', opener: p('task-9440558', 96, [8, 92]),
    arrive: [p('arrive-9440243', 93, [40, 96])],
    props: { skewers: 'Cartoon Deep-Fried Bug Skewers-3', vendor: 'Elderly food vendor character cutout-7', rickshaw: 'Empty red-seated cartoon rickshaw-5',
      chute: 'Inflated tandem parachute canopy cutout-4', plane: 'Total Drama single-prop plane-6' },
    st: {
      'gwh-cab': { talk: [p('task-9440318', 96, [6, 94])],
        act: p('present-9440266', 95, [4, 96], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 96], [50, 95], [114, 96]] }) },
      skydive: { talk: [p('task-9440310', 94, [6, 94])],
        act: p('task-9440310', 94, [6, 94], { mode: 'para', prop: 'chute', path: [[30, 8], [42, 40], [52, 94]] }) },
      skewers: { talk: [p('task-9440339', 97, [6, 94]), p('task-9440338', 97, [6, 94])],
        act: p('task-9440339', 97, [6, 94], { mode: 'eat', prop: 'skewers', fx: 'steam' }) },
      rickshaw: { talk: [p('task-9440527', 92, [6, 94]), p('task-9440758', 93, [6, 80])],
        act: p('task-9440527', 92, [6, 94], { mode: 'ride', prop: 'rickshaw', path: [[-14, 93], [50, 92], [114, 93]], fx: 'dust' }) },
      'wall-walk': { talk: [p('task-9440558', 96, [8, 92]), p('task-9440571', 96, [8, 92])],
        act: p('task-9440641', 96, [8, 92], { mode: 'climb', path: [[30, 98], [46, 80], [60, 64], [74, 50]] }) },
      mat: { talk: [p('chill-9440467', 74, [10, 90], { mat: [50, 71] })] },
    },
  },
  'rock-north': {
    src: '12-rock-north', title: 'present-9440796', opener: p('present-9440799', 94, [30, 96]),
    arrive: [p('present-9440799', 94, [30, 96])],
    props: { crowd: 'air-guitar-crowd', meter: 'appeal-meter', bucket: 'sauna-bucket' },
    st: {
      'spa-cab': { talk: [p('present-9440799', 94, [30, 96])],
        act: p('present-9440799', 94, [30, 96], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 95], [50, 94], [114, 95]], fx: 'snow' }) },
      sauna: { talk: [p('task-9440922', 94, [8, 96])],
        act: p('task-9440800', 92, [10, 80], { mode: 'sweat', prop: 'bucket', fx: 'steam' }) },
      'ice-river': { talk: [p('task-9440922', 94, [8, 96])],
        act: p('task-9440942', 0, [0, 0], { water: true, mode: 'hop', spots: [[14, 66], [32, 49], [72, 55], [86, 72]],
          path: [[14, 66], [32, 49], [72, 55], [86, 72]], fx: 'splash' }) },
      'town-cab': { talk: [p('present-9440796', 92, [6, 70])],
        act: p('present-9440796', 92, [6, 94], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 93], [50, 92], [114, 93]], fx: 'snow' }) },
      'air-guitar': { talk: [p('task-9441040', 93, [6, 70]), p('task-9441122', 98, [6, 94])],
        act: p('task-9441025', 83, [30, 70], { mode: 'guitar', prop: 'crowd', fx: 'notes' }) },
      mat: { talk: [p('chill-9441059', 92, [6, 94]), p('chill-9441025', 83, [12, 88], { mat: [50, 81] })] },
    },
  },
  'savanna-falls': {
    src: '13-savanna-falls', title: 'present-9441413', opener: p('present-9441461', 95, [36, 96]),
    arrive: [p('arrive-9441427', 96, [6, 94]), p('arrive-9441458', 96, [40, 96])],
    props: { jeep: 'Empty Safari Jeep Side View-4', raft: 'Empty yellow inflatable rafting boat-2', rhino: 'Gray Side-Profile Cartoon Rhinoceros-5',
      camera: 'Yellow cartoon waterproof camera-3' },
    st: {
      jeep: { talk: [p('task-9441526', 93, [6, 94])],
        act: p('present-9441461', 94, [6, 96], { mode: 'ride', prop: 'jeep', path: [[-16, 95], [50, 94], [116, 95]], fx: 'dust' }) },
      'falls-selfie': { talk: [p('task-9441526', 93, [6, 94])],
        act: p('task-9441568', 0, [0, 0], { water: true, mode: 'swim', prop: 'camera', path: [[8, 92], [30, 90], [52, 86], [70, 84]], fx: 'splash' }) },
      rhino: { talk: [p('task-9441524', 97, [6, 94])],
        act: p('task-9441524', 97, [6, 94], { mode: 'photo', prop: 'rhino', fx: 'flash' }) },
      'village-run': { talk: [p('task-9441526', 93, [6, 94]), p('task-9441761', 99, [8, 92])] },
      mat: { talk: [p('chill-9441823', 88, [6, 70]), p('chill-9441911', 88, [6, 60])] },
    },
  },
  'treasure-isles': {
    src: '26-treasure-isles', title: 'present-9449351', opener: p('present-9450014', 94, [10, 90]),
    arrive: [p('arrive-9449512', 92, [6, 94]), p('arrive-9449521', 97, [6, 94])],
    props: { doubloons: 'Drawstring pouch with spilled doubloons-8', jetski: 'Red angular jet ski cutout-3', map: 'Rolled Treasure Map with Globe and Flag-5',
      mask: 'Yellow Diving Mask and Snorkel-9' },
    st: {
      'museum-cab': { talk: [p('arrive-9449521', 97, [6, 94])],
        act: p('travel-9449534', 97, [6, 94], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 98], [50, 97], [114, 98]] }) },
      'pirate-map': { talk: [p('task-9449549', 97, [6, 94]), p('task-9449621', 98, [6, 94])],
        act: p('task-9449549', 97, [6, 94], { mode: 'search', prop: 'map', fx: 'dust' }) },
      'jet-ski': { talk: [p('task-9449576', 94, [4, 60])],
        act: p('task-9449601', 0, [0, 0], { water: true, mode: 'ride', prop: 'jetski', path: [[-12, 86], [50, 84], [114, 84]], fx: 'splash' }) },
      doubloons: { talk: [p('task-9449601', 74, [10, 40], { spots: [[13, 73], [25, 74], [37, 74]] })],
        act: p('task-9449759', 0, [0, 0], { water: true, mode: 'dive', prop: 'doubloons', path: [[28, 44], [44, 58], [62, 46], [80, 64]], fx: 'bubbles', inset: 'IN THE BOAT' }) },
      'harbour-run': { talk: [p('present-9450014', 94, [10, 90])] },
      mat: { talk: [p('present-9449449', 88, [30, 96], { mat: [60, 88] })] },
    },
  },
  'skyline-finale': {
    src: '27-skyline-finale', title: 'present-9450080', opener: p('present-9450040', 97, [20, 80]),
    arrive: [p('arrive-9450078', 98, [4, 96])],
    props: { taxi: 'Bright Yellow Cartoon Taxi Side View-2', briefcase: 'Cartoon briefcase with taped gold clue card-3', buoy: 'Orange-capped lattice navigation buoy-1' },
    st: {
      cab: { talk: [p('arrive-9450078', 98, [4, 96])],
        act: p('task-9450114', 97, [4, 96], { mode: 'ride', prop: 'taxi', path: [[-14, 97], [50, 96], [114, 97]] }) },
      'tower-stairs': { talk: [p('task-9450185', 96, [6, 94]), p('task-9450269', 97, [6, 30])],
        act: p('task-9450082', 95, [10, 90], { mode: 'climb', path: [[34, 96], [60, 78], [30, 60], [60, 42], [34, 26]], fx: 'sweat' }) },
      park: { talk: [p('chill-9450538', 94, [16, 84])] },
      midmat: { talk: [p('chill-9450538', 94, [16, 84], { mat: [50, 88], bronze: true })] },
      boathouse: { talk: [p('task-9450434', 86, [4, 84])] },
      buoys: { talk: [p('task-9450434', 86, [4, 84])],
        act: p('chill-9450523', 0, [0, 0], { water: true, mode: 'swim', prop: 'buoy', path: [[4, 92], [28, 86], [52, 84], [76, 86]], fx: 'splash' }) },
      footrace: { talk: [p('present-9450040', 97, [20, 80])],
        act: p('chill-9450538', 94, [16, 84], { mode: 'run', path: [[30, 90], [50, 92], [70, 94]], fx: 'dust' }) },
      mat: { talk: [p('present-9450040', 97, [20, 80], { mat: [50, 95], gold: true })] },
    },
  },
  'tomb-sands': {
    src: '29-tomb-sands', title: 'present-22410404', opener: p('arrive-22410042', 95, [30, 96]),
    arrive: [p('arrive-22410042', 95, [30, 96])],
    props: { camel: 'camel', croc: 'crocodile', mummy: 'mummy', reed: 'reed-boat' },
    st: {
      'tomb-cab': { talk: [p('present-22410572', 92, [6, 94])],
        act: p('present-22410572', 92, [6, 94], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 93], [50, 92], [114, 93]], fx: 'dust' }) },
      pyramid: {
        talk: [p('task-22410049', 96, [6, 60])],
        sides: {
          over: { talk: [p('task-22410049', 96, [6, 60])],
            act: p('present-22409867', 96, [6, 94], { mode: 'climb', path: [[40, 96], [46, 70], [52, 44], [56, 22]], fx: 'dust' }) },
          under: { talk: [p('task-22409901', 94, [10, 90]), p('task-22409944', 96, [6, 94])],
            act: p('task-22409957', 94, [6, 94], { mode: 'walk', prop: 'mummy', path: [[14, 94], [34, 94], [60, 92], [86, 94]], fx: 'darts' }) },
        },
      },
      'tomb-camel': { talk: [p('present-22410491', 94, [6, 60])],
        act: p('present-22410572', 92, [6, 94], { mode: 'ride', prop: 'camel', path: [[-12, 92], [40, 91], [112, 92]], fx: 'dust' }) },
      'reed-boat': { talk: [p('task-22410542', 97, [6, 94]), p('task-22410534', 97, [6, 94])],
        act: p('task-22410673', 0, [0, 0], { water: true, mode: 'ride', prop: 'reed', path: [[-12, 70], [40, 66], [112, 64]], fx: 'splash' }) },
      mat: { talk: [p('chill-22410379', 94, [40, 96], { mat: [62, 92] })] },
    },
  },
  'torch-statue-harbour': {
    src: '32-torch-statue-harbour', title: 'present-22412488', opener: p('present-22412601', 96, [40, 96]),
    arrive: [p('arrive-22412323', 46, [6, 46])],
    props: { carriage: 'baby-carriage', apple: 'giant-apple', gator: 'sewer-alligator' },
    st: {
      'harbour-boat': { talk: [p('arrive-22412323', 46, [6, 46])],
        act: p('present-22413470', 0, [0, 0], { water: true, mode: 'ride', prop: 'raft@savanna-falls', path: [[-12, 90], [50, 88], [114, 88]], fx: 'splash' }) },
      'statue-climb': { talk: [p('present-22412601', 96, [40, 96])],
        act: p('task-22412320', 0, [0, 0], { water: true, mode: 'climb', prop: 'carriage', path: [[52, 96], [52, 76], [51, 50], [50, 26]] }) },
      sewer: { talk: [p('task-22412644', 92, [6, 80])],
        act: p('task-22412499', 0, [0, 0], { water: true, mode: 'swim', prop: 'gator', path: [[4, 84], [30, 82], [56, 84], [80, 82]], fx: 'splash', inset: 'AT THE DRAIN' }) },
      'big-apple': { talk: [p('task-22412644', 92, [6, 80])],
        act: p('task-22412644', 92, [6, 80], { mode: 'bob', prop: 'apple', fx: 'splash' }) },
      mat: { talk: [p('chill-22413471', 86, [20, 80], { mat: [50, 84] })] },
    },
  },
  'red-outback': {
    src: '41-red-outback', title: 'present-22419827', opener: p('arrive-22419610', 90, [6, 94]),
    arrive: [p('arrive-22419610', 90, [6, 94])],
    props: { emu: 'emu', shears: 'shears', sheep: 'sheep' },
    st: {
      'outback-drive': { talk: [p('arrive-22420087', 90, [6, 94])],
        act: p('present-22419609', 86, [6, 94], { mode: 'ride', prop: 'jeep@savanna-falls', path: [[-16, 88], [50, 86], [116, 86]], fx: 'dust' }) },
      'emu-catch': { talk: [p('task-22419889', 94, [6, 94])],
        act: p('task-22419889', 94, [6, 94], { mode: 'chase', prop: 'emu', fx: 'dust' }) },
      'emu-ride': { talk: [p('present-22419827', 94, [6, 94])],
        act: p('present-22419697', 92, [6, 94], { mode: 'ride', prop: 'emu', path: [[-12, 92], [44, 90], [112, 92]], fx: 'dust' }) },
      'sheep-bungee': { talk: [p('task-22419968', 44, [4, 40], { spots: [[12, 44], [23, 42], [34, 40]] })],
        act: p('task-22419968', 44, [4, 40], { mode: 'bungee', prop: 'sheep', spots: [[12, 44], [23, 42], [34, 40]], path: [[40, 38], [80, 60], [86, 112], [80, 40]] }) },
      shearing: { talk: [p('task-22419762', 97, [6, 94]), p('task-22419761', 97, [6, 94])],
        act: p('task-22419762', 97, [6, 94], { mode: 'shear', prop: 'sheep', fx: 'wool' }) },
      mat: { talk: [p('People-Free Cartoon Campsite-2', 46, [44, 86], { mat: [62, 47], scale: 0.75 })] },
    },
  },
  'fire-mountain-isle': {
    src: '48-fire-mountain-isle', title: 'present-22425124', opener: p('task-22425944', 90, [36, 96]),
    arrive: [p('task-22425944', 90, [36, 96])],
    props: { raft: 'log-raft', statue: 'log-statue', pineapple: 'pineapple' },
    st: {
      jungle: { talk: [p('task-22426442', 92, [20, 80])] },
      'lava-falls': {
        talk: [p('task-22425944', 90, [36, 96])],
        sides: {
          lava: { talk: [p('task-22425117', 94, [6, 80])],
            act: p('task-22426413', 0, [0, 0], { water: true, mode: 'hop', spots: [[19, 46], [27.5, 59], [55.5, 45], [68.5, 59]],
              path: [[19, 46], [27.5, 59], [55.5, 45], [68.5, 59]], fx: 'embers' }) },
          falls: { talk: [p('task-22425199', 92, [6, 94])],
            act: p('task-22425199', 92, [6, 94], { mode: 'walk', prop: 'raft', path: [[14, 90], [34, 86], [60, 84], [86, 82]], fx: 'splash' }) },
        },
      },
      lagoon: { talk: [p('task-22425118', 46, [10, 90])],
        act: p('task-22425972', 0, [0, 0], { water: true, mode: 'swim', path: [[16, 72], [34, 75], [56, 77], [82, 72]], fx: 'splash', inset: 'ON THE SHORE' }) },
      statue: { talk: [p('task-22426261', 95, [6, 94])],
        act: p('task-22426261', 95, [6, 94], { mode: 'build', prop: 'statue', fx: 'logs' }) },
      climb: { talk: [p('task-22425117', 94, [6, 80])],
        act: p('present-22426355', 96, [6, 94], { mode: 'climb', path: [[20, 98], [40, 70], [52, 46], [58, 30]], fx: 'embers' }) },
      mat: { talk: [p('chill-22425933', 86, [10, 92])] },
    },
  },
};

// All the plate files a place needs (the asset copier and the tests read this)
export function placeFiles(id) {
  const pl = PLACE_PLATES[id];
  if (!pl) return [];
  const out = new Set([pl.title]);
  const add = x => { if (x?.f) out.add(x.f); };
  add(pl.opener);
  (pl.arrive || []).forEach(add);
  for (const s of Object.values(pl.st)) {
    (s.talk || []).forEach(add); add(s.act);
    for (const side of Object.values(s.sides || {})) { (side.talk || []).forEach(add); add(side.act); }
  }
  return [...out];
}

export const slugFile = f => String(f).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const plateUrl = (placeId, f) => `assets/sets/rr/${placeId}/${slugFile(f)}.webp`;
export const raceUrl = f => `assets/sets/rr/race/${f}.webp`;
// a cut-out: 'camel' is this place's, 'taxi@red-sand-desert' borrows another place's
export function propUrl(placeId, key) {
  const [k, at] = String(key).split('@');
  return `assets/sets/rr/${at || placeId}/c-${k}.webp`;
}
export function propFiles(id) {
  return Object.entries(PLACE_PLATES[id]?.props || {}).map(([k, f]) => ({ key: k, file: f }));
}

// The plates a stretch is shot on. `role`: 'talk' or 'act'; `n` picks among several
// (every plate of a place in use: the director's nth scene there gets the nth plate).
export function stretchPlates(placeId, stretchId, side = null) {
  const pl = PLACE_PLATES[placeId];
  const s = pl?.st?.[stretchId];
  if (!s) return null;
  const sd = side && s.sides?.[side];
  return { talk: sd?.talk || s.talk || [], act: sd?.act ?? s.act ?? null };
}

export const standable = plate => plate && plate.people !== false && !plate.water;
