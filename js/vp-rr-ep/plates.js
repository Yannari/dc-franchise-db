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
// already painted on the plate; `matPos` where the race's own mat is put down on one that has none.
//
// A stretch has `talk` plates (where its scenes are shot) and an `act` plate (doing the
// task, or riding): `path` is the route a team takes across it, `mode` how (walk, hop,
// climb, zip, swim, dive, para, ride, bungee), `prop` a cut-out that goes with them
// (a camel, a jet ski, the parachute), `fx` the particles of the work.
//
// `closed: true` is a space nobody else could be in (an elevator lobby, a stairwell, a sauna, a stall close-up):
// steps.js closedShot puts no other team behind a shot on it. A plate with no ground to stand on, or that does not
// read as its place, waits for the user's repaint (repaint() below; the jobs are in tools/rr-vp-jobs.json and in the
// user's Downloads/RidonculousRace-frames/edit/ with a prompt.txt per place). Plates out of use with a stand-in that
// fits and no job: arrive-9434797 (a column close-up), task-9441122 (a character on it), task-9441761 (tall grass,
// no ground), task-22412644 (a bare olive ground: the sewer talks on the sewer's ledge, the big apple at the park pond).

import { REPAINTED } from './repainted.js';

const p = (f, g = 90, x = [12, 88], more = {}) => ({ f, g, x, ...more });
// A plate out of use until the user repaints it (tools/rr-vp-jobs.json; the job is in their frames folder's edit/):
// its repaint once tools/rr-vp-repaints.py has found it in done/, its stand-in until then.
export const repaint = (f, then, meanwhile) => (REPAINTED.has(f) ? then : meanwhile);

export const RACE = {
  dir: 'race',
  gate: p('gate', 93, [8, 62]),
  cabin: p('cabin', 62, [8, 46], { seats: [[13.5, 62], [33, 62]] }),
  // two rows: by the cart at the front, down the aisle behind (the aisle's floor is higher in the picture)
  galley: p('galley', [87, 96], [26, 96], { rows: [{ g: 96, x: [24, 63] }, { g: 87, x: [63, 96] }] }),
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
    arrive: [p('arrive-9434588', 97, [14, 86])],
    props: { helmet: 'Empty purple helmet with chin strap-2', trolley: 'Teal zipline trolley with hand grips-5' },
    st: {
      'to-tower': { talk: [p('arrive-9434588', 97, [14, 86])] },
      tower: {
        talk: [p('task-9434810', 96, [8, 90])],
        sides: {
          stairs: { talk: [p('task-9434876', 93, [10, 70], { closed: true })],
            act: p('task-9434855', 95, [10, 90], { closed: true, mode: 'climb', path: [[33, 96], [60, 77], [35, 50], [62, 27]], fx: 'sweat' }) },
          skydeck: { talk: [repaint('task-9434868', p('task-9434868', 93, [8, 92], { closed: true }), p('task-9434876', 93, [10, 70], { closed: true }))],
            act: p('task-9434827', 70, [12, 88], { mode: 'walk', path: [[8, 52], [30, 53], [55, 53], [80, 52], [96, 50]], fx: 'wind' }) },
        },
      },
      zipline: { talk: [p('task-9434876', 93, [10, 70], { closed: true })],
        act: p('task-9435028', 0, [0, 0], { water: true, mode: 'zip', prop: 'trolley', path: [[24, 38], [38, 45], [52, 52], [66, 60]], fx: 'wind' }) },
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
      spices: { talk: [repaint('task-9435287', p('task-9435287', 93, [8, 92]), p('task-9435287', 99, [10, 90], { closed: true })),
          repaint('task-9435344', p('task-9435344', 93, [8, 92]), p('task-9435344', 99, [10, 90], { closed: true }))],
        act: repaint('task-9435287', p('task-9435287', 93, [8, 92], { mode: 'search', prop: 'jars', fx: 'spice' }),
          p('task-9435287', 99, [10, 90], { closed: true, mode: 'search', prop: 'jars', fx: 'spice' })) },
      camel: { talk: [p('present-9435572', 88, [10, 70])],
        act: p('present-9435500', 86, [10, 90], { mode: 'ride', prop: 'camel', path: [[-12, 86], [40, 85], [112, 86]], fx: 'dust' }) },
      stew: { talk: [repaint('task-9435484', p('task-9435484', 93, [8, 92]), p('task-9435484', 99, [8, 92], { closed: true }))],
        act: repaint('task-9435484', p('task-9435484', 93, [8, 92], { mode: 'eat', prop: 'stew', fx: 'steam' }),
          p('task-9435484', 99, [8, 92], { closed: true, mode: 'eat', prop: 'stew', fx: 'steam' })) },
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
      'cheese-raft': { talk: [p('task-9436302', 48, [4, 96])],
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
        act: p('task-9440800', 92, [10, 80], { closed: true, mode: 'sweat', prop: 'bucket', fx: 'steam' }) },
      'ice-river': { talk: [p('task-9440922', 94, [8, 96])],
        act: p('task-9440942', 0, [0, 0], { water: true, mode: 'hop', spots: [[14, 66], [32, 49], [72, 55], [86, 72]],
          path: [[14, 66], [32, 49], [72, 55], [86, 72]], fx: 'splash' }) },
      'town-cab': { talk: [p('present-9440796', 92, [6, 70])],
        act: p('present-9440796', 92, [6, 94], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 93], [50, 92], [114, 93]], fx: 'snow' }) },
      'air-guitar': { talk: [p('task-9441040', 93, [6, 70], { closed: true })],
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
      'village-run': { talk: [p('task-9441526', 93, [6, 94])] },
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
      'pirate-map': { talk: [p('task-9449549', 97, [6, 94]), p('task-9449621', 98, [6, 94], { closed: true })],
        act: p('task-9449549', 97, [6, 94], { mode: 'search', prop: 'map', fx: 'dust' }) },
      'jet-ski': { talk: [p('task-9449576', 94, [4, 60])],
        act: p('task-9449601', 0, [0, 0], { water: true, mode: 'ride', prop: 'jetski', path: [[-12, 86], [50, 84], [114, 84]], fx: 'splash' }) },
      doubloons: { talk: [p('task-9449601', 74, [10, 40], { spots: [[13, 73], [25, 74], [37, 74]] })],
        act: p('task-9449759', 0, [0, 0], { water: true, mode: 'dive', prop: 'doubloons', path: [[28, 44], [44, 58], [62, 46], [80, 64]], fx: 'bubbles', inset: 'IN THE BOAT' }) },
      'harbour-run': { talk: [p('present-9450014', 94, [10, 90])] },
      mat: { talk: [p('present-9449449', 88, [30, 96], { matPos: [60, 88] })] },
    },
  },
  'skyline-finale': {
    src: '27-skyline-finale', title: 'present-9450080', opener: p('present-9450040', 97, [20, 80]),
    arrive: [p('arrive-9450078', 98, [4, 96])],
    props: { taxi: 'Bright Yellow Cartoon Taxi Side View-2', briefcase: 'Cartoon briefcase with taped gold clue card-3', buoy: 'Orange-capped lattice navigation buoy-1' },
    st: {
      cab: { talk: [p('arrive-9450078', 98, [4, 96])],
        act: p('task-9450114', 97, [4, 96], { mode: 'ride', prop: 'taxi', path: [[-14, 97], [50, 96], [114, 97]] }) },
      'tower-stairs': { talk: [p('task-9450185', 96, [6, 94]), p('task-9450269', 97, [6, 30], { closed: true })],
        act: p('task-9450082', 95, [10, 90], { closed: true, mode: 'climb', path: [[34, 96], [60, 78], [30, 60], [60, 42], [34, 26]], fx: 'sweat' }) },
      park: { talk: [p('chill-9450538', 94, [16, 84])] },
      midmat: { talk: [p('chill-9450538', 94, [16, 84], { matPos: [50, 88], bronze: true })] },
      boathouse: { talk: [p('task-9450434', 86, [4, 84])] },
      buoys: { talk: [p('task-9450434', 86, [4, 84])],
        act: p('chill-9450523', 0, [0, 0], { water: true, mode: 'swim', prop: 'buoy', path: [[4, 92], [28, 86], [52, 84], [76, 86]], fx: 'splash' }) },
      footrace: { talk: [p('present-9450040', 97, [20, 80])],
        act: p('chill-9450538', 94, [16, 84], { mode: 'run', path: [[30, 94], [50, 94], [70, 94]], fx: 'dust' }) },
      mat: { talk: [p('present-9450040', 97, [20, 80], { matPos: [50, 95] })] },
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
        talk: [p('task-22410049', 96, [6, 60], { closed: true })],
        sides: {
          over: { talk: [p('task-22410049', 96, [6, 60], { closed: true })],
            act: p('present-22409867', 96, [6, 94], { mode: 'climb', path: [[40, 96], [46, 70], [52, 44], [56, 22]], fx: 'dust' }) },
          under: { talk: [p('task-22409901', 94, [10, 90]), p('task-22409944', 96, [6, 94])],
            act: p('task-22409957', 94, [6, 94], { mode: 'walk', prop: 'mummy', path: [[14, 94], [34, 94], [60, 92], [86, 94]], fx: 'darts' }) },
        },
      },
      'tomb-camel': { talk: [p('present-22410491', 94, [6, 60])],
        act: p('present-22410572', 92, [6, 94], { mode: 'ride', prop: 'camel', path: [[-12, 92], [40, 91], [112, 92]], fx: 'dust' }) },
      'reed-boat': { talk: [p('task-22410542', 97, [6, 94]), p('task-22410534', 97, [6, 94])],
        act: p('task-22410673', 0, [0, 0], { water: true, mode: 'ride', prop: 'reed', path: [[-12, 70], [40, 66], [112, 64]], fx: 'splash' }) },
      mat: { talk: [p('chill-22410379', 94, [40, 96], { matPos: [62, 92] })] },
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
      sewer: { talk: [p('task-22412499', 62, [6, 70])],
        act: p('task-22412499', 0, [0, 0], { water: true, mode: 'swim', prop: 'gator', path: [[4, 84], [30, 82], [56, 84], [80, 82]], fx: 'splash', inset: 'AT THE DRAIN' }) },
      'big-apple': { talk: [p('chill-22413471', 86, [20, 80])],
        act: p('chill-22413471', 86, [20, 80], { mode: 'bob', prop: 'apple', fx: 'splash' }) },
      mat: { talk: [p('chill-22413471', 86, [20, 80], { matPos: [50, 84] })] },
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
      'sheep-bungee': { talk: [p('task-22419968', 60, [10, 52], { spots: [[13, 64], [24, 60], [52, 54]] })],
        act: p('task-22419968', 60, [10, 52], { mode: 'bungee', prop: 'sheep', spots: [[13, 64], [24, 60], [52, 54]], path: [[56, 50], [80, 60], [86, 112], [80, 40]] }) },
      shearing: { talk: [p('task-22419762', 97, [6, 94]), p('task-22419761', 97, [6, 94])],
        act: p('task-22419762', 97, [6, 94], { mode: 'shear', prop: 'sheep', fx: 'wool' }) },
      mat: { talk: [p('People-Free Cartoon Campsite-2', 46, [44, 86], { matPos: [62, 47], scale: 0.75 })] },
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
  // ── batch 1 of the 46 places (LEGS.txt 05-08, 2026-10-19). `judge`: [prop, width/height of its cut-out], a local who
  // stands by the work and passes judgement; `pass`: a cut-out that swims past the one in the water; `flip`: a vehicle
  // drawn facing left, turned to face the way it goes. Jobs in the user's frames folder (edit/, tools/rr-vp-jobs.json)
  // switch on when they come back: repaint() below.
  'coast-palace': {
    src: '05-coast-palace', title: 'present-9436727', opener: p('present-9436927', 92, [40, 94]),
    arrive: [p('arrive-9436638', 96, [44, 96])],
    props: { shark: 'Cartoon Shark with Travel Tip Card-12', palace: 'Cartoon sand palace cutout-10', surfer: 'Blond Surfer Boy Cartoon Cutout-13',
      boat: 'Cream Speedboat with Cyan Windshield-9', ...(REPAINTED.has('train-carriage') ? { train: 'train-carriage' } : {}) },
    st: {
      // on the train along the coast (a ride once the train's cut-out comes back from edit/)
      'coast-train': { talk: [p('arrive-9436621', 96, [6, 94], { closed: true })],
        act: repaint('train-carriage', p('arrive-9436621', 96, [6, 94], { closed: true, mode: 'ride', prop: 'train', path: [[-20, 96], [50, 95], [120, 96]] }), undefined) },
      // the boat's deck off the cliffs is a job; meanwhile the beach looking out to sea
      shark: { talk: [repaint('task-shark-deck', p('task-shark-deck', 92, [6, 94]), p('arrive-9436638', 96, [44, 96]))],
        act: p('task-9436629', 0, [0, 0], { water: true, mode: 'swim', pass: 'shark', path: [[20, 82], [36, 84], [62, 84], [76, 82]], fx: 'splash', inset: 'ON THE BOAT' }) },
      'sand-palace': { talk: [p('task-9436921', 93, [6, 94]), p('task-9436639', 93, [6, 94])],
        act: p('task-9436921', 93, [6, 94], { mode: 'sculpt', prop: 'palace', judge: ['surfer', 0.97], fx: 'dust' }) },
      motorboat: { talk: [p('travel-9436860', 61, [10, 40], { scale: 0.6 })],
        act: p('task-9436826', 0, [0, 0], { water: true, mode: 'ride', prop: 'boat', path: [[-18, 86], [50, 84], [118, 86]], fx: 'splash' }) },
      mat: { talk: [p('chill-9436953', 78, [6, 94], { matPos: [50, 77] })] },
    },
  },
  'geyser-island': {
    src: '06-geyser-island', title: 'present-9437594', opener: p('travel-9437713', 92, [6, 94]),
    arrive: [p('travel-9437713', 92, [6, 94]), p('arrive-9436846', 70, [18, 94])],
    props: { bus: 'tour-bus', heli: 'helicopter', platter: 'meal-platter', fossil: 'fossil-in-ice' },
    st: {
      'park-bus': { talk: [p('arrive-9437123', 92, [46, 94])],
        act: p('travel-9437713', 92, [6, 94], { mode: 'ride', prop: 'bus', path: [[-20, 92], [50, 91], [120, 92]] }) },
      // through the geysers' steam to the local, to say the phrase back
      telephone: { talk: [p('task-9437137', 92, [6, 94])],
        act: p('task-9437137', 92, [6, 94], { mode: 'walk', path: [[8, 93], [30, 90], [56, 92], [84, 90]], fx: 'steam' }) },
      helicopter: { talk: [p('task-9437322', 90, [6, 94])],
        act: p('present-9437594', 0, [0, 0], { water: true, mode: 'ride', prop: 'heli', flip: true, path: [[-22, 36], [50, 32], [122, 28]] }) },
      'feast-fossil': {
        talk: [p('task-9437341', 76, [8, 60])],
        sides: {
          // the hut by the canyon river is a job; meanwhile the river bank in the canyon
          feast: { talk: [repaint('task-feast-hut', p('task-feast-hut', 92, [6, 94]), p('task-9437341', 76, [8, 60]))],
            act: repaint('task-feast-hut', p('task-feast-hut', 92, [6, 94], { mode: 'eat', prop: 'platter', fx: 'steam' }),
              p('task-9437341', 76, [8, 60], { mode: 'eat', prop: 'platter', fx: 'steam' })) },
          fossil: { talk: [p('task-9437332', 66, [6, 94])],
            act: p('task-9437548', 94, [24, 68], { closed: true, mode: 'chip', fx: 'ice' }) },
        },
      },
      mat: { talk: [p('chill-9437338', 88, [6, 94], { mat: [62, 86] }), p('chill-9436909', 86, [8, 94], { mat: [60, 85] })] },
    },
  },
  'carnival-rainforest': {
    src: '07-carnival-rainforest', title: 'present-9438215', opener: p('arrive-9437915', 88, [22, 82]),
    arrive: [p('arrive-9437915', 88, [22, 82])],
    props: { mitten: 'Ant-Crawling Red Oven Mitt-4', tail: 'Belt-mounted cyan and purple feather fan-6', head: 'Blue-Purple Feathered Carnival Headpiece-5',
      coconut: 'Cracked coconut reveals a travel tip-7', vine: 'Curving cartoon jungle vine-8', glider: 'Empty Coral-Striped Hang Glider-9',
      dancer: 'Feathered Purple Carnival Dancer-10' },
    st: {
      ants: { talk: [p('task-9437989', 92, [6, 94])],
        act: p('task-9438117', 92, [6, 94], { mode: 'mitten', prop: 'mitten', fx: 'ants' }) },
      // over the gorge on the vines; done, the coconut pile
      gorge: { talk: [p('task-9437972', 70, [36, 94]), p('task-9437837', 94, [6, 94])],
        act: p('task-9437835', 0, [0, 0], { water: true, mode: 'swing', prop: 'vine', path: [[14, 46], [30, 60], [50, 66], [70, 60], [86, 46]] }),
        act2: p('task-9437837', 94, [6, 94], { mode: 'search', prop: 'coconut', fx: 'dust' }) },
      costume: { talk: [p('task-9438128', 95, [6, 94])],
        act: p('task-9438128', 95, [6, 94], { mode: 'sew', prop: 'head', judge: ['dancer', 0.67], fx: 'sparkle' }) },
      glide: { talk: [p('task-9438189', 62, [46, 94])],
        act: p('present-9438171', 0, [0, 0], { water: true, mode: 'para', prop: 'glider', path: [[8, 18], [34, 36], [62, 56], [84, 74]] }) },
      mat: { talk: [p('chill-9438092', 84, [8, 84], { matPos: [46, 82] })] },
    },
  },
  'haunted-castle': {
    src: '08-haunted-castle', title: 'present-9438456', opener: p('present-9438407', 94, [8, 92]),
    arrive: [p('arrive-9438405', 94, [6, 94]), p('arrive-9438402', 92, [6, 78])],
    props: { coffin: 'coffin', horse: 'Dark Horse with Jagged Mane-3', vault: 'Gymnastics vault and springboard-2', beam: 'balance-beam', coach: 'gym-coach' },
    st: {
      'castle-road': { talk: [p('present-9438407', 94, [8, 92])],
        act: p('present-9438407', 94, [8, 92], { mode: 'ride', prop: 'taxi@red-sand-desert', path: [[-14, 95], [50, 94], [114, 95]] }) },
      // the coffin on its stand in the castle; pushed (a partner in it) out through the graveyard gate
      coffin: { talk: [p('task-9438457', 97, [6, 94], { closed: true, spots: [[13, 97], [87, 97], [24, 98], [76, 98]] })],
        act: p('task-9438461', 93, [6, 94], { mode: 'push', prop: 'coffin', path: [[8, 94], [32, 92], [58, 93], [82, 92]] }) },
      ride: { talk: [p('task-9438688', 94, [8, 90])],
        act: p('present-9438330', 86, [8, 92], { mode: 'ride', prop: 'horse', flip: true, path: [[-14, 86], [44, 84], [114, 86]] }) },
      gym: { talk: [p('task-9438652', 98, [6, 94])],
        act: p('task-9438665', 94, [6, 94], { mode: 'beam', prop: 'beam', judge: ['coach', 0.45] }) },
      'night-run': { talk: [p('present-9438407', 94, [8, 92])],
        act: p('present-9438407', 94, [8, 92], { mode: 'run', path: [[20, 94], [50, 94], [80, 94]] }) },
      // the night Chill Zone by the castle is a job; meanwhile the graveyard gate in the rain
      mat: { talk: [repaint('chill-night-mat', p('chill-night-mat', 92, [6, 94], { matPos: [50, 90] }), p('chill-9438461', 92, [6, 94], { matPos: [50, 92] }))] },
    },
  },
  // ── batch 2 (LEGS.txt 09, 10, 14, 15) ──
  'lei-island': {
    src: '09-lei-island', title: 'present-9439460', opener: p('present-9439148', 92, [6, 94]),
    arrive: [p('arrive-9439038', 92, [6, 94])],
    props: { ring: 'wedding-ring', hula: 'hula-costume', coals: 'hot-coals' },
    st: {
      'pier-taxi': { talk: [p('arrive-9439038', 92, [6, 94])],
        act: p('arrive-9439038', 92, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 93], [50, 92], [114, 93]] }) },
      // the ring thrown in the lagoon under the pier: the one who dives, the other on the pier
      'ring-dive': { talk: [p('task-9439428', 92, [6, 90])],
        act: p('task-9439101', 0, [0, 0], { water: true, mode: 'dive', prop: 'ring', path: [[12, 84], [30, 76], [52, 86], [78, 78]], fx: 'bubbles', inset: 'ON THE PIER' }) },
      // in grass skirts and leis, across the hot coals
      'fire-walk': { talk: [p('task-9439223', 76, [6, 94])],
        act: p('task-9439223', 86, [6, 94], { mode: 'coals', prop: 'hula', path: [[8, 86], [30, 86], [56, 86], [84, 86]], fx: 'embers' }) },
      'hut-run': { talk: [p('chill-9439397', 92, [6, 94])],
        act: p('chill-9439397', 92, [6, 94], { mode: 'run', path: [[14, 92], [50, 92], [86, 92]] }) },
      mat: { talk: [p('chill-9439226', 76, [28, 84], { mat: [47, 70] })] },
    },
  },
  'glass-tower-gulf': {
    src: '10-glass-tower-gulf', title: 'present-9439561', opener: p('arrive-9439667', 92, [6, 94]),
    arrive: [p('arrive-9439582', 95, [6, 64]), p('travel-9439785', 95, [6, 94])],
    props: { taxi: 'Yellow city taxi in profile-4', racket: 'Cream and red cartoon tennis racket-6', robot: 'Domed tennis ball launcher robot-5',
      gondola: 'Empty Window-Cleaning Gondola-3', ...(REPAINTED.has('squeegee-bucket') ? { squeegee: 'squeegee-bucket' } : {}) },
    st: {
      'tower-taxi': { talk: [p('arrive-9439709', 86, [22, 70])],
        act: p('present-9439562', 93, [6, 94], { mode: 'ride', prop: 'taxi', flip: true, path: [[-14, 94], [50, 93], [114, 94]] }) },
      'squeegee-serve': {
        talk: [p('task-9439713', 56, [8, 62], { scale: 0.8 })],
        sides: {
          // in the gondola on the tower's glass; the squeegee and its bucket are a job (edit/), meanwhile the glass alone
          squeegee: { talk: [p('task-9439718', 92, [14, 86], { closed: true })],
            act: p('task-9439718', 92, [14, 86], { closed: true, mode: 'squeegee', ...(REPAINTED.has('squeegee-bucket') ? { prop: 'squeegee' } : {}), fx: 'splash' }) },
          serve: { talk: [p('task-9439713', 56, [8, 62], { scale: 0.8 })],
            act: p('task-9439713', 56, [8, 62], { scale: 0.8, mode: 'serve', prop: 'racket', propW: 0.55, fx: 'sparkle' }) },
        },
      },
      'market-taxi': { talk: [p('travel-9439786', 96, [6, 94])],
        act: p('present-9439561', 94, [6, 94], { mode: 'ride', prop: 'taxi', flip: true, path: [[-14, 95], [50, 94], [114, 95]] }) },
      mat: { talk: [p('chill-9440146', 95, [6, 94], { matPos: [80, 94] })] },
    },
  },
  'swamp-prison': {
    src: '14-swamp-prison', title: 'present-9442102', opener: p('present-9442604', 95, [6, 94]),
    arrive: [p('arrive-9442029', 92, [6, 80])],
    props: { spoon: 'escape-spoon', raft: 'homemade-raft', guard: 'prison-guard' },
    st: {
      'bayou-taxi': { talk: [p('travel-9442134', 96, [6, 94])],
        act: p('present-9442604', 95, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 96], [50, 95], [114, 96]] }) },
      // locked in a cell: out by the spoon, a guard looking on
      'prison-cell': { talk: [p('task-9442108', 95, [28, 90], { closed: true }), p('task-9442206', 95, [8, 92], { closed: true })],
        act: p('task-9442257', 94, [10, 86], { closed: true, mode: 'spoon', prop: 'spoon', judge: ['guard', 0.43], fx: 'dust' }) },
      // the raft built on the bank; done, it sails down the river
      'swamp-raft': { talk: [p('task-9442380', 92, [6, 94])],
        act: p('task-9442380', 92, [6, 94], { mode: 'build', prop: 'raft', fx: 'logs' }),
        act2: p('task-9442410', 0, [0, 0], { water: true, mode: 'ride', prop: 'raft', path: [[-16, 82], [50, 80], [116, 82]], fx: 'splash' }) },
      mat: { talk: [p('chill-9442481', 76, [40, 96], { matPos: [68, 76] }), p('chill-9442555', 80, [32, 88], { matPos: [60, 80] })] },
    },
  },
  'outback-farm': {
    src: '15-outback-farm', title: 'present-9442701', opener: p('present-9442822', 92, [6, 94]),
    arrive: [p('present-9442822', 92, [6, 94])],
    props: { glider: 'Red-accented white glider-6', bunny: 'Seated grey lavender bunny with curly tail-4', albino: 'Stylized Albino Bunny with Red Eyes-3',
      sack: 'Wriggling Tied Burlap Sack-5', ...(REPAINTED.has('farmer') ? { farmer: 'farmer' } : {}), ...(REPAINTED.has('ute') ? { ute: 'ute' } : {}) },
    st: {
      // the ute is a job (edit/); meanwhile the safari jeep
      'ute-drive': { talk: [p('task-9442837', 94, [6, 94])],
        act: p('present-9442822', 92, [6, 94], { mode: 'ride', prop: REPAINTED.has('ute') ? 'ute' : 'jeep@savanna-falls', path: [[-16, 93], [50, 92], [116, 93]], fx: 'dust' }) },
      // ten rabbits loose in the wheat; the farmer is a job, meanwhile the sack stands by
      bunnies: { talk: [p('task-9442852', 94, [6, 94]), p('task-9442843', 94, [6, 94])],
        act: p('task-9442851', 94, [6, 94], { mode: 'chase', prop: 'bunny', judge: REPAINTED.has('farmer') ? ['farmer', 0.45] : ['sack', 0.9], fx: 'dust' }) },
      'valley-glide': { talk: [p('task-9442875', 90, [6, 94])],
        act: p('travel-9443065', 0, [0, 0], { water: true, mode: 'ride', prop: 'glider', path: [[-20, 46], [50, 40], [120, 34]] }) },
      mat: { talk: [p('present-9442909', 88, [12, 88], { mat: [41, 79] })] },
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
    (s.talk || []).forEach(add); add(s.act); add(s.act2);
    for (const side of Object.values(s.sides || {})) { (side.talk || []).forEach(add); add(side.act); add(side.act2); }
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
  return { talk: sd?.talk || s.talk || [], act: sd?.act ?? s.act ?? null, act2: sd?.act2 ?? s.act2 ?? null };
}

export const standable = plate => plate && plate.people !== false && !plate.water;
