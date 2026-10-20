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
        act: repaint('train-carriage', p('present-9436927', 92, [40, 94], { mode: 'ride', prop: 'train', path: [[-24, 92], [50, 91], [124, 92]] }), undefined) },
      // the boat's deck off the cliffs is a job; meanwhile the beach looking out to sea
      shark: { talk: [repaint('task-shark-deck', p('task-shark-deck', 90, [6, 94]), p('arrive-9436638', 96, [44, 96]))],
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
      mat: { talk: [repaint('chill-night-mat', p('chill-night-mat', 92, [6, 94], { mat: [40, 84] }), p('chill-9438461', 92, [6, 94], { matPos: [50, 92] }))] },
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
        act: p('task-9442851', 94, [6, 94], { mode: 'chase', prop: 'bunny', propW: 0.6, judge: REPAINTED.has('farmer') ? ['farmer', 0.55] : ['sack', 0.9], fx: 'dust' }) },
      'valley-glide': { talk: [p('task-9442875', 90, [6, 94])],
        act: p('travel-9443065', 0, [0, 0], { water: true, mode: 'ride', prop: 'glider', path: [[-20, 46], [50, 40], [120, 34]] }) },
      mat: { talk: [p('present-9442909', 88, [12, 88], { mat: [41, 79] })] },
    },
  },
  // ── batch 3 (LEGS.txt 16-19) ──
  'fjord-peaks': {
    src: '16-fjord-peaks', title: 'travel-9443418', opener: p('arrive-9443367', 84, [6, 94]),
    arrive: [p('arrive-9443367', 84, [6, 94])],
    props: { harness: 'bungee-harness', fish: 'native-fish', judges: 'dance-judges' },
    st: {
      // on the platform beside the train (a ride once the train's cut-out is back from Coast Palace's job)
      'junction-train': { talk: [p('arrive-9443358', 92, [6, 94])],
        act: repaint('train-carriage', p('travel-9443450', 90, [6, 94], { mode: 'ride', prop: 'train@coast-palace', path: [[-20, 90], [50, 89], [120, 90]] }), undefined) },
      'jump-dance': {
        talk: [p('chill-9443649', 90, [20, 80])],
        sides: {
          // off the bridge on the cord, a fish caught bare-handed at the bottom
          jump: { talk: [p('task-9443374', 84, [6, 94])],
            act: p('task-9443534', 86, [6, 94], { mode: 'bungee', prop: 'harness', propW: 0.8, fx: 'splash' }) },
          // the war dance on the stage, the elders judging
          dance: { talk: [p('task-9443648', 90, [20, 80])],
            act: p('task-9443382', 90, [6, 94], { mode: 'dance', prop: 'judges', propW: 1.3, fx: 'dust' }) },
        },
      },
      'lake-run': { talk: [p('task-9443766', 92, [6, 94])],
        act: p('task-9443766', 92, [6, 94], { mode: 'run', path: [[12, 92], [50, 92], [88, 92]], fx: 'dust' }) },
      mat: { talk: [p('chill-9443386', 82, [6, 70], { mat: [35, 79] }), p('chill-9443672', 82, [6, 80], { mat: [44, 79] })] },
    },
  },
  'prairie-ranch': {
    src: '17-prairie-ranch', title: 'present-9443998', opener: p('present-9444391', 92, [6, 94]),
    arrive: [p('arrive-9444012', 92, [6, 94])],
    props: { bull: 'Empty mechanical rodeo bull-6', timer: 'Red 00_08 Digital Timer-3', pot: 'Teal stockpot filled with pork and beans-5' },
    st: {
      'ranch-pickup': { talk: [p('arrive-9443918', 92, [6, 94])],
        act: p('arrive-9443918', 92, [6, 94], { mode: 'ride', prop: 'ute@outback-farm', path: [[-16, 93], [50, 92], [116, 93]], fx: 'dust' }) },
      // the beans table on the cliff top is a job (edit/); meanwhile the rocks by the cliff
      beans: { talk: [repaint('task-beans-table', p('task-beans-table', 92, [6, 94]), p('task-9444112', 94, [44, 94]))],
        act: repaint('task-beans-table', p('task-beans-table', 92, [6, 94], { mode: 'eat', prop: 'pot', propW: 0.9, fx: 'steam' }),
          p('task-9444112', 94, [44, 94], { mode: 'eat', prop: 'pot', propW: 0.9, fx: 'steam' })) },
      // eight seconds on the bull, the clock on the wall of the barn
      bull: { talk: [p('task-9444253', 95, [6, 94], { closed: true })],
        act: p('task-9444232', 95, [6, 94], { closed: true, mode: 'bull', prop: 'bull', under: true, judge: ['timer', 1.0], fx: 'dust' }) },
      'cliff-run': { talk: [p('present-9444391', 92, [6, 94])],
        act: p('present-9444391', 92, [6, 94], { mode: 'run', path: [[12, 92], [50, 92], [88, 92]], fx: 'dust' }) },
      mat: { talk: [p('chill-9444113', 56, [6, 62], { mat: [42, 54], scale: 0.7 })] },
    },
  },
  'ice-floe': {
    src: '18-ice-floe', title: 'present-9444530', opener: p('present-9445072', 92, [6, 94]),
    arrive: [p('arrive-9444551', 92, [24, 94])],
    props: { plane: 'Cartoon bush plane with snow skis-3', blocks: 'Cartoon cyan snow-ice building block-5', narwhal: 'Cartoon narwhal with a tapered tusk-8',
      local: 'Fur-hooded parka cartoon character-7', ring: 'Golden Cartoon Toss Ring-9', igloo: 'Pale Cyan Igloo Cutout-4', saw: 'Scalloped Ice Saw Cartoon Cutout-6' },
    st: {
      'tundra-hop': { talk: [p('arrive-9444551', 92, [24, 94])],
        act: p('present-9444732', 0, [0, 0], { water: true, mode: 'ride', prop: 'plane', path: [[-22, 54], [50, 48], [122, 42]] }) },
      // rings found in the snow, thrown at the narwhals' tusks in the open water
      narwhal: { talk: [p('task-9444662', 90, [6, 94])],
        act: p('task-9444731', 92, [6, 94], { mode: 'toss', prop: 'ring', propW: 0.45, fx: 'splash' }) },
      // blocks sawn and stacked: the igloo grows with the work, the local judging it
      igloo: { talk: [p('task-9445014', 93, [6, 94])],
        act: p('task-9444815', 56, [6, 94], { mode: 'saw', prop: 'igloo', judge: ['local', 0.6], fx: 'snow' }) },
      'floe-run': { talk: [p('task-9444662', 90, [6, 94])],
        act: p('task-9444662', 90, [6, 94], { mode: 'run', path: [[12, 90], [50, 90], [88, 90]], fx: 'snow' }) },
      // the ice Chill Zone is a job (edit/); meanwhile the igloo with the mat put down in front of it
      mat: { talk: [repaint('chill-ice-mat', p('chill-ice-mat', 90, [6, 94], { mat: [38, 56] }), p('chill-9444869', 94, [6, 94], { matPos: [50, 93] }))] },
    },
  },
  'dragon-isle': {
    src: '19-dragon-isle', title: 'travel-9445205', opener: p('task-9445378', 90, [6, 94]),
    arrive: [p('arrive-9445165', 78, [40, 94])],
    props: { textiles: 'Colorful woven textile stack-4', komodo: 'Stocky Komodo Dragon Side Profile-5', vial: 'Stylized green saliva vial-3' },
    st: {
      'isle-boat': { talk: [p('arrive-9445165', 78, [40, 94])],
        act: p('arrive-9445132', 0, [0, 0], { water: true, mode: 'ride', prop: 'boat@coast-palace', path: [[-18, 76], [44, 74], [118, 76]], fx: 'splash' }) },
      // the dragons under the stilt huts: a vial of drool, slowly
      venom: { talk: [p('task-9445378', 90, [6, 94])],
        act: p('task-9445138', 93, [6, 94], { mode: 'venom', prop: 'vial', propW: 0.38 }) },
      rugs: { talk: [p('task-9445351', 93, [6, 94])],
        act: p('task-9445496', 92, [22, 78], { mode: 'search', prop: 'textiles', fx: 'dust' }) },
      'hill-run': { talk: [p('travel-9445205', 92, [6, 60])],
        act: p('travel-9445205', 92, [6, 94], { mode: 'run', path: [[12, 92], [50, 92], [88, 92]], fx: 'dust' }) },
      mat: { talk: [p('chill-9445670', 88, [6, 94], { matPos: [50, 86] })] },
    },
  },
  // ── batch 4 (LEGS.txt 20-23) ──
  'neon-desert': {
    src: '20-neon-desert', title: 'present-9446140', opener: p('present-9445996', 90, [6, 94]),
    arrive: [p('arrive-9445777', 93, [6, 94])],
    props: { lion: 'Angular-maned cartoon lion on transparent background-6', remote: 'Charcoal remote transmitter with blue screen-4', flag: 'Clean red pennant on gray pole-5',
      cage: 'Empty magician cage with floor lever-8', buggy: 'Empty red-orange dune buggy-7', pennant: 'Red triangular course pennant-2' },
    st: {
      'strip-taxi': { talk: [p('arrive-9446147', 90, [6, 60])],
        act: p('present-9446140', 88, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 89], [50, 88], [114, 89]], fx: 'dust' }) },
      'buggy-magic': {
        talk: [p('task-9445874', 90, [6, 94])],
        sides: {
          // one drives the little buggy by remote round the course, the other grabs the flags
          buggy: { talk: [p('task-9445796', 92, [6, 60])],
            act: p('task-9445891', 94, [6, 94], { mode: 'remote', prop: 'buggy', propW: 0.9, judge: ['flag', 0.35], fx: 'dust' }) },
          // one locked in the cage with the lion, the other at the lever
          magic: { talk: [p('chill-9446241', 92, [6, 94])],
            act: p('task-9445798', 95, [6, 94], { mode: 'lever', prop: 'cage', propW: 1.4, judge: ['lion', 1.05] }) },
        },
      },
      'theatre-run': { talk: [p('task-9446122', 92, [6, 94])],
        act: p('task-9446122', 92, [6, 94], { mode: 'run', path: [[12, 92], [50, 92], [88, 92]], fx: 'dust' }) },
      mat: { talk: [p('chill-9446241', 92, [6, 94], { matPos: [50, 93] })] },
    },
  },
  'pyramid-coast': {
    src: '21-pyramid-coast', title: 'present-9446346', opener: p('present-9446663', 92, [6, 94]),
    arrive: [p('arrive-9446385', 94, [6, 94])],
    props: { flags: 'Green, orange, and red hand flags-5', peppers: 'Green, orange, and red pepper trio-6', canteen: 'Sage Green Milk Canteen Cutout-4',
      burro: 'Sleepy Grey Burro Prop-3' },
    st: {
      'cliff-taxi': { talk: [p('arrive-9446431', 92, [44, 94])],
        act: p('present-9446663', 92, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 93], [50, 92], [114, 93]], fx: 'dust' }) },
      // a pepper eaten at the cart and its flag waved; done, the jump off the cliff for the milk
      'pepper-cliff': { talk: [p('task-9446542', 94, [6, 94])],
        act: p('task-9446542', 94, [6, 94], { mode: 'eat', prop: 'peppers', propW: 0.75, judge: ['flags', 0.9], fx: 'steam' }),
        act2: p('task-9446588', 0, [0, 0], { water: true, mode: 'swim', prop: 'canteen', path: [[16, 46], [36, 54], [60, 50], [80, 58]], fx: 'bubbles', inset: 'ON THE CLIFF' }) },
      'burro-ride': { talk: [p('present-9446663', 92, [6, 94])],
        act: p('task-9446799', 94, [6, 94], { mode: 'ride', prop: 'burro', path: [[-12, 94], [44, 92], [112, 94]], fx: 'dust' }) },
      mat: { talk: [p('chill-9446872', 64, [8, 92], { mat: [33, 61], scale: 0.75 })] },
    },
  },
  'stilt-river': {
    src: '22-stilt-river', title: 'present-9447233', opener: p('arrive-9447023', 92, [30, 94]),
    arrive: [p('arrive-9447004', 92, [6, 94])],
    props: { catfish: 'Angular Whiskered Catfish-2', torch: 'Burning hand torch icon-4', branded: 'Cartoon catfish with globe-airplane emblem-1',
      boat: 'Reddish-Brown River Fishing Boat-3' },
    st: {
      'longtail-boat': { talk: [p('arrive-9447014', 79, [6, 94])],
        act: p('present-9447233', 0, [0, 0], { water: true, mode: 'ride', prop: 'boat', path: [[-18, 90], [50, 88], [118, 90]], fx: 'splash' }) },
      // a superteam: the teams meet on the track by the river, then wade into the shallows together and catch six
      // catfish by hand (the shallows are water: they swim it, nobody stands on it)
      catfish: { talk: [p('arrive-9447023', 92, [30, 94])],
        act: p('task-9447243', 0, [0, 0], { water: true, mode: 'swim', prop: 'catfish', path: [[8, 80], [30, 77], [56, 80], [82, 77]], fx: 'splash' }) },
      tunnels: { talk: [p('task-9447354', 92, [6, 94])],
        act: p('task-9447366', 94, [6, 94], { closed: true, mode: 'search', prop: 'torch', propW: 0.45, fx: 'dust' }) },
      'temple-run': { talk: [p('chill-9447520', 92, [6, 94])],
        act: p('chill-9447520', 92, [6, 94], { mode: 'run', path: [[12, 92], [50, 92], [88, 92]], fx: 'dust' }) },
      mat: { talk: [p('present-9447043', 90, [14, 86], { mat: [43, 88] })] },
    },
  },
  'frozen-mine': {
    src: '23-frozen-mine', title: 'present-9447601', opener: p('arrive-9447661', 92, [6, 94]),
    arrive: [p('arrive-9447661', 92, [6, 94])],
    props: { donbox: 'Centered Don Box cartoon machine-4', winch: 'Rugged winch reel with hanging harness-5', ball: 'Small red ball with seam arcs-6',
      yacht: 'Yellow ice yacht with globe sail-2' },
    st: {
      'lake-taxi': { talk: [p('arrive-9447691', 95, [6, 44])],
        act: p('arrive-9447661', 92, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 93], [50, 92], [114, 93]], fx: 'snow' }) },
      'ice-yacht': { talk: [p('task-9447726', 92, [6, 40])],
        act: p('task-9447678', 0, [0, 0], { water: true, mode: 'ride', prop: 'yacht', path: [[-18, 90], [50, 88], [118, 90]], fx: 'snow' }) },
      // lowered down the shaft on the winch to find the red ball
      borehole: { talk: [p('task-9447861', 95, [6, 94])],
        act: p('task-9447790', 0, [0, 0], { water: true, closed: true, mode: 'zip', prop: 'winch', path: [[50, 34], [50, 52], [50, 70], [50, 90]], fx: 'dust', inset: 'AT THE WINCH' }) },
      'sauna-run': { talk: [p('task-9447866', 94, [6, 60])],
        act: p('task-9447866', 94, [6, 94], { mode: 'run', path: [[12, 94], [40, 94], [60, 94]], fx: 'snow' }) },
      // the steam house is a job (edit/); meanwhile the sauna's benches with the mat put down
      mat: { talk: [repaint('chill-sauna-mat', p('chill-sauna-mat', 92, [6, 94], { closed: true, mat: [50, 75] }), p('chill-9447963', 96, [6, 70], { closed: true, matPos: [40, 95] }))] },
    },
  },
  // ── batch 5 (LEGS.txt 24, 25, 30, 31) ──
  'tea-hills': {
    src: '24-tea-hills', title: 'present-9448187', opener: p('present-9448586', 92, [6, 94]),
    arrive: [p('arrive-9448231', 92, [20, 94])],
    props: { basket: 'Empty Tea Harvesting Basket-7', full: 'Leaf-filled wicker tea basket-6', picker: 'Tea Plantation Lady in Purple Sari-5' },
    st: {
      'hill-jeep': { talk: [p('arrive-9448236', 90, [6, 94])],
        act: p('present-9448586', 92, [6, 94], { mode: 'ride', prop: 'jeep@savanna-falls', path: [[-16, 93], [50, 92], [116, 93]], fx: 'dust' }) },
      // leaves picked into the basket on the terraces; the old picker weighs it
      'tea-basket': { talk: [p('task-9448188', 95, [6, 94], { closed: true })],
        act: p('present-9448248', 92, [60, 94], { mode: 'pick', prop: 'full', propW: 0.75, judge: ['picker', 0.5], fx: 'leaves' }) },
      // aboard the little train in the hills and up to the front carriage
      'toy-train': { talk: [p('task-9448379', 88, [6, 94])],
        act: p('task-9448388', 92, [6, 94], { mode: 'walk', path: [[8, 92], [34, 92], [62, 92], [90, 92]], fx: 'steam' }) },
      mat: { talk: [p('chill-9448671', 92, [6, 94], { matPos: [72, 92] })] },
    },
  },
  'pampas-ranch': {
    src: '25-pampas-ranch', title: 'present-9449000', opener: p('arrive-9448812', 96, [6, 94]),
    arrive: [p('arrive-9448887', 92, [6, 70])],
    props: { horse: 'Angular brown ranch horse-6', emu: 'Lively cartoon emu in profile-7', instructor: 'Stylized tango instructor in red-8',
      bolas: 'Three-ball boleadoras with central knot-5' },
    st: {
      'academy-taxi': { talk: [p('task-9449003', 94, [6, 70])],
        act: p('task-9449201', 90, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 91], [50, 90], [114, 91]] }) },
      // the dance at the academy, the instructor watching
      tango: { talk: [p('task-9449004', 94, [6, 70])],
        act: p('task-9448962', 93, [6, 94], { closed: true, mode: 'dance', prop: 'instructor', propW: 0.6 }) },
      // the boleadoras thrown at the emu by the ranch fence
      emu: { talk: [p('task-9449177', 92, [6, 94])],
        act: p('task-9449177', 92, [6, 94], { mode: 'toss', prop: 'bolas', propW: 0.8, judge: ['emu', 0.6], fx: 'dust' }) },
      'emu-walk': { talk: [p('travel-9449305', 92, [6, 94])],
        act: p('present-9449278', 92, [6, 94], { mode: 'ride', prop: 'horse', flip: true, path: [[-12, 92], [44, 90], [112, 92]], fx: 'dust' }) },
      mat: { talk: [p('chill-9449230', 66, [6, 62], { mat: [52, 64], scale: 0.65 })] },
    },
  },
  'game-show-city': {
    src: '30-game-show-city', title: 'task-22411100', opener: p('arrive-22411016', 96, [6, 94]),
    arrive: [p('arrive-22411160', 90, [6, 94])],
    props: { ball: 'pinball', panda: 'panda', candy: 'candy-box' },
    st: {
      'bullet-train': { talk: [p('arrive-22411160', 90, [6, 94])],
        act: repaint('train-carriage', p('arrive-22411160', 90, [6, 94], { mode: 'ride', prop: 'train@coast-palace', path: [[-20, 90], [50, 89], [120, 90]] }), undefined) },
      // inside the giant ball, rolled round the table among the bumpers
      pinball: { talk: [p('task-22411046', 92, [6, 94])],
        act: p('task-22411122', 0, [0, 0], { water: true, mode: 'roll', prop: 'ball', path: [[10, 90], [25, 52], [48, 70], [64, 46], [86, 80]], fx: 'sparkle' }) },
      'neon-run': { talk: [p('arrive-22411160', 90, [6, 94])],
        act: p('arrive-22411160', 90, [6, 94], { mode: 'run', path: [[12, 90], [50, 90], [88, 90]] }) },
      mat: { talk: [p('chill-22411042', 92, [6, 70], { matPos: [36, 90] })] },
    },
  },
  'ice-river': {
    src: '31-ice-river', title: 'present-22411652', opener: p('present-22411651', 92, [6, 94]),
    arrive: [p('arrive-22411593', 86, [6, 94])],
    props: { sled: 'sled', bear: 'polar-bear' },
    st: {
      'river-hop': { talk: [p('arrive-22411593', 86, [6, 94])],
        act: p('present-22412013', 0, [0, 0], { water: true, mode: 'ride', prop: 'plane@ice-floe', path: [[-22, 54], [50, 48], [122, 42]] }) },
      'ice-floes': { talk: [p('task-22411751', 92, [40, 94])],
        act: p('task-22411646', 0, [0, 0], { water: true, mode: 'hop', spots: [[12, 85], [30, 62], [50, 78], [68, 58], [88, 74]],
          path: [[12, 85], [30, 62], [50, 78], [68, 58], [88, 74]], fx: 'splash' }) },
      // one pulls the sled, the other rides it, past the bear
      sled: { talk: [p('task-22411840', 92, [6, 90])],
        act: p('task-22411840', 92, [6, 94], { mode: 'ride', prop: 'sled', path: [[-14, 92], [50, 91], [114, 92]], fx: 'snow' }) },
      mat: { talk: [p('chill-22411602', 92, [6, 94], { matPos: [50, 92] })] },
    },
  },
  // ── batch 6 (LEGS.txt 33-36) ──
  'snow-peaks': {
    src: '33-snow-peaks', title: 'present-22413727', opener: p('present-22413612', 90, [6, 94]),
    arrive: [p('present-22413613', 92, [30, 94])],
    props: { goat: 'Angry mountain goat cartoon cutout-4', sausage: 'Giant Sausage Sled Cutout-2', grinder: 'Industrial Meat Grinder Cartoon Prop-3',
      pad: 'Total Drama arcade dance pad-1', ...(REPAINTED.has('cable-car') ? { cablecar: 'cable-car' } : {}) },
    st: {
      // the cable car is a job (edit/); meanwhile the zipline trolley on the cable
      'cable-car': { talk: [p('present-22413613', 92, [30, 94])],
        act: p('present-22413727', 0, [0, 0], { water: true, mode: 'zip', prop: REPAINTED.has('cable-car') ? 'cablecar' : 'trolley@home-city', path: [[10, 42], [50, 36], [90, 30]] }) },
      // the meat ground into a giant sausage, the goat glaring; done, down the slope on it
      sausage: { talk: [p('task-22413818', 92, [40, 94])],
        act: p('present-22413613', 92, [30, 94], { mode: 'build', prop: 'grinder', judge: ['goat', 0.9], fx: 'snow' }),
        act2: p('present-22413612', 0, [0, 0], { water: true, mode: 'ride', prop: 'sausage', path: [[-14, 66], [50, 80], [114, 92]], fx: 'snow' }) },
      // the slap dance on the shocking pads
      'slap-dance': { talk: [p('chill-22413853', 92, [6, 94])],
        act: p('task-22414020', 88, [20, 76], { mode: 'dance', fx: 'sparkle' }) },
      mat: { talk: [p('chill-22413855', 88, [6, 94], { matPos: [55, 84] })] },
    },
  },
  'jungle-ruins': {
    src: '34-jungle-ruins', title: 'present-22414265', opener: p('task-22414262', 90, [6, 94]),
    arrive: [p('arrive-22414257', 90, [6, 94])],
    props: { caterpillar: 'Complete Olive Green Caterpillar Character-3', ...(REPAINTED.has('canoe') ? { canoe: 'canoe' } : {}),
      ...(REPAINTED.has('golden-idol') ? { idol: 'golden-idol' } : {}) },
    st: {
      // the canoe is a job (edit/); meanwhile the raft
      'river-canoe': { talk: [p('arrive-22414257', 90, [6, 94])],
        act: p('task-22414389', 0, [0, 0], { water: true, mode: 'ride', prop: REPAINTED.has('canoe') ? 'canoe' : 'raft@savanna-falls', path: [[-16, 72], [50, 70], [116, 72]], fx: 'splash' }) },
      // through the jungle, the caterpillars in the way
      'jungle-trail': { talk: [p('task-22414793', 90, [6, 94])],
        act: p('task-22414456', 92, [44, 94], { mode: 'chase', prop: 'caterpillar', propW: 0.8, fx: 'dust' }) },
      // the one real golden treasure at the foot of the ruins (the idol is a job; meanwhile the search alone)
      'golden-idol': { talk: [p('task-22414655', 95, [6, 94], { closed: true })],
        act: p('task-22414655', 95, [6, 94], { closed: true, mode: 'search', ...(REPAINTED.has('golden-idol') ? { prop: 'idol', propW: 0.6 } : {}), fx: 'dust' }) },
      'ruin-climb': { talk: [p('task-22414262', 90, [6, 94])],
        act: p('present-22414265', 96, [10, 90], { mode: 'climb', path: [[50, 98], [54, 78], [57, 58], [60, 40]], fx: 'dust' }) },
      mat: { talk: [p('chill-22414582', 68, [14, 86], { matPos: [50, 66], scale: 0.75 })] },
    },
  },
  'glass-pyramid-city': {
    src: '35-glass-pyramid-city', title: 'present-22414919', opener: p('chill-22415411', 92, [6, 94]),
    arrive: [p('arrive-22414920', 92, [6, 94])],
    props: { torso: 'Stylized Marble Statue Torso-8', head: 'Detached cream marble statue head-5', legs: 'Seated marble statue legs and base-3',
      bear: 'Brown museum bear cutout-7' },
    st: {
      'museum-taxi': { talk: [p('arrive-22414920', 92, [6, 94])],
        act: p('arrive-22414920', 92, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 93], [50, 92], [114, 93]] }) },
      // the statue put back together, the loose bear watching
      'broken-statue': { talk: [p('task-22415179', 92, [6, 94], { closed: true })],
        act: p('task-22415175', 92, [6, 94], { closed: true, mode: 'build', prop: 'torso', propW: 0.8, judge: ['bear', 0.8], fx: 'dust' }) },
      // the museum runway is a job (edit/); meanwhile the museum hall
      runway: { talk: [repaint('task-museum-runway', p('task-museum-runway', 92, [6, 94], { closed: true }), p('task-22415034', 94, [6, 94], { closed: true }))],
        act: repaint('task-museum-runway', p('task-museum-runway', 92, [6, 94], { closed: true, mode: 'walk', path: [[10, 92], [50, 92], [90, 92]], fx: 'sparkle' }),
          p('task-22415170', 92, [6, 94], { closed: true, mode: 'walk', path: [[10, 92], [50, 92], [90, 92]], fx: 'sparkle' })) },
      mat: { talk: [p('task-22415208', 92, [6, 94], { matPos: [42, 90] })] },
    },
  },
  'fishing-cove': {
    src: '36-fishing-cove', title: 'present-22415793', opener: p('chill-22416099', 88, [6, 60]),
    arrive: [p('arrive-22415810', 90, [6, 60])],
    props: { boat: 'rowboat', cod: 'codfish', fisherman: 'fisherman-local', vinegar: 'vinegar-bottle' },
    st: {
      rowboat: { talk: [p('arrive-22415810', 90, [6, 60])],
        act: p('task-22415657', 0, [0, 0], { water: true, mode: 'ride', prop: 'boat', path: [[-16, 82], [50, 80], [116, 82]], fx: 'splash' }) },
      // the vinegar, the local's words, and the cod to kiss, the fisherman watching
      'welcome-rite': { talk: [p('arrive-22415967', 92, [6, 94])],
        act: p('arrive-22415967', 92, [6, 94], { mode: 'eat', prop: 'cod', propW: 0.7, judge: ['fisherman', 0.5], fx: 'splash' }) },
      'beach-run': { talk: [p('chill-22416099', 88, [6, 60])],
        act: p('chill-22416099', 88, [6, 60], { mode: 'run', path: [[10, 88], [32, 88], [56, 88]] }) },
      mat: { talk: [p('chill-22416099', 88, [6, 60], { matPos: [40, 84] })] },
    },
  },
  // ── batch 7 (LEGS.txt 37-40) ──
  'cliff-pool-isle': {
    src: '37-cliff-pool-isle', title: 'present-22416412', opener: p('arrive-22416267', 90, [6, 94]),
    arrive: [p('arrive-22416267', 90, [6, 94])],
    props: { sled: 'Tan two-person sled with red wheels', ...(REPAINTED.has('treasure-chest') ? { chest: 'treasure-chest' } : {}) },
    st: {
      'coast-minibus': { talk: [p('arrive-22416267', 90, [6, 94])],
        act: p('arrive-22416267', 90, [6, 94], { mode: 'ride', prop: 'bus@geyser-island', path: [[-20, 90], [50, 89], [120, 90]], fx: 'dust' }) },
      // off the falls into the lagoon for a little treasure chest (the chest is a job; meanwhile the dive alone)
      'falls-dive': { talk: [p('present-22416327', 92, [62, 94])],
        act: p('task-22416440', 0, [0, 0], { water: true, mode: 'dive', ...(REPAINTED.has('treasure-chest') ? { prop: 'chest' } : {}), path: [[14, 80], [34, 70], [56, 82], [78, 72]], fx: 'bubbles', inset: 'ON THE CLIFF' }) },
      // three runs down the wooden track in the sled
      bobsled: { talk: [p('chill-22416513', 92, [10, 94])],
        act: p('task-22416594', 0, [0, 0], { water: true, mode: 'ride', prop: 'sled', path: [[-14, 74], [50, 70], [114, 76]], fx: 'dust' }) },
      'pool-walk': { talk: [p('task-22416652', 92, [6, 94])],
        act: p('task-22416652', 92, [6, 94], { mode: 'run', path: [[12, 92], [50, 92], [88, 92]] }) },
      mat: { talk: [p('chill-22416513', 92, [10, 94], { matPos: [52, 90] })] },
    },
  },
  'twin-tower-bridge': {
    src: '38-twin-tower-bridge', title: 'present-22417609', opener: p('task-22417943', 92, [6, 94]),
    arrive: [p('arrive-22417628', 92, [6, 94])],
    props: { bus: 'Red Double-Decker Bus Side View-3', warden: 'Elderly tower warden in red uniform-4', kidnapper: 'Masked cloaked figure in magenta-trimmed hat-2' },
    st: {
      'double-decker': { talk: [p('arrive-22417628', 92, [6, 94])],
        act: p('task-22417943', 92, [6, 94], { mode: 'ride', prop: 'bus', path: [[-20, 93], [50, 92], [120, 93]] }) },
      // the fortress searched for the masked kidnapper's clues, the warden standing guard
      kidnapper: { talk: [p('task-22417886', 92, [6, 94], { closed: true })],
        act: p('task-22417886', 92, [6, 94], { closed: true, mode: 'search', prop: 'kidnapper', propW: 0.5, judge: ['warden', 0.45], fx: 'dust' }) },
      'crown-jewel': { talk: [p('task-22417892', 95, [6, 94], { closed: true })],
        act: p('task-22417865', 96, [6, 94], { closed: true, mode: 'search', fx: 'sparkle' }) },
      'fog-walk': { talk: [p('task-22417943', 92, [6, 94])],
        act: p('task-22417943', 92, [6, 94], { mode: 'run', path: [[12, 92], [50, 92], [88, 92]] }) },
      // the foggy street Chill Zone is a job (edit/); meanwhile the lamplit street
      mat: { talk: [repaint('chill-fog-mat', p('chill-fog-mat', 93, [6, 94], { mat: [49, 79] }), p('task-22417943', 92, [6, 94], { matPos: [50, 92] }))] },
    },
  },
  'marble-temple-hill': {
    src: '39-marble-temple-hill', title: 'present-22418524', opener: p('Ancient temple with empty stone steps', 92, [6, 94]),
    arrive: [p('Empty Temple Steps Amid Ancient Ruins', 90, [6, 94])],
    props: { highjump: 'Cartoon coral high-jump setup-1', wreath: 'Golden laurel wreath crown-2', hurdle: 'hurdle',
      ...(REPAINTED.has('chariot') ? { chariot: 'chariot' } : {}) },
    st: {
      'stadium-taxi': { talk: [p('Empty Temple Steps Amid Ancient Ruins', 90, [6, 94])],
        act: p('Empty Temple Steps Amid Ancient Ruins', 90, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 91], [50, 90], [114, 91]], fx: 'dust' }) },
      hurdles: { talk: [p('chill-22418530', 90, [6, 94])],
        act: p('task-22418528', 90, [6, 94], { mode: 'run', path: [[8, 90], [50, 90], [92, 90]], fx: 'dust' }) },
      // the bar cleared with a flip
      'high-jump': { talk: [p('chill-22418530', 90, [6, 94])],
        act: p('task-22418529', 92, [6, 94], { mode: 'beam', fx: 'dust' }) },
      'ancient-games': {
        talk: [p('task-22418324', 92, [6, 94])],
        sides: {
          // the chariot is a job (edit/); meanwhile on horseback
          chariot: { talk: [p('task-22418324', 92, [6, 94])],
            act: p('task-22418325', 92, [6, 94], { mode: 'ride', prop: REPAINTED.has('chariot') ? 'chariot' : 'horse@haunted-castle', flip: !REPAINTED.has('chariot'), path: [[-14, 92], [50, 91], [114, 92]], fx: 'dust' }) },
          // grappling in the ring, the laurel wreath waiting
          wrestle: { talk: [p('task-22418328', 92, [6, 94])],
            act: p('task-22418328', 92, [6, 94], { mode: 'wrestle', prop: 'wreath', propW: 0.5, fx: 'dust' }) },
        },
      },
      mat: { talk: [p('chill-22418530', 90, [6, 94], { matPos: [55, 84] })] },
    },
  },
  'secret-base-desert': {
    src: '40-secret-base-desert', title: 'present-22418960', opener: p('chill-22419058', 90, [6, 94]),
    arrive: [p('arrive-22418994', 94, [6, 94])],
    props: { soldier: 'Full-body cartoon soldier in olive uniform', artifact: 'alien-artifact' },
    st: {
      'desert-pickup': { talk: [p('chill-22419058', 90, [6, 94])],
        act: p('chill-22419058', 90, [6, 94], { mode: 'ride', prop: 'ute@outback-farm', path: [[-16, 91], [50, 90], [116, 91]], fx: 'dust' }) },
      // creeping past the guard to the fence
      'sneak-in': { talk: [p('task-22419058', 90, [6, 94])],
        act: p('task-22419058', 90, [6, 94], { mode: 'venom', prop: 'soldier', propW: 0.4, fx: 'dust' }) },
      artifact: { talk: [p('task-22419328', 92, [6, 94], { closed: true })],
        act: p('task-22419433', 94, [6, 94], { closed: true, mode: 'search', prop: 'artifact', propW: 0.5, fx: 'sparkle' }) },
      // the night desert Chill Zone is a job (edit/); meanwhile the desert by the base
      mat: { talk: [repaint('chill-desert-night-mat', p('chill-desert-night-mat', 90, [6, 94], { mat: [50, 58] }), p('task-22419058', 90, [6, 94], { matPos: [50, 88] }))] },
    },
  },
  // ── batch 8 (LEGS.txt 42-47) ──
  'fjord-sea': {
    src: '42-fjord-sea', title: 'arrive-22420234', opener: p('task-22420282', 93, [6, 94]),
    arrive: [p('task-22420282', 93, [6, 94])],
    props: { longship: 'longship', boat: 'longship', cannon: 'cannon', meatballs: 'meatball-pile' },
    st: {
      'shore-taxi': { talk: [p('task-22420282', 93, [6, 94])],
        act: p('task-22420280', 94, [6, 94], { mode: 'ride', prop: 'taxi@glass-tower-gulf', flip: true, path: [[-14, 95], [50, 94], [114, 95]], fx: 'dust' }) },
      // the longship put back together from the wreck pile; done, it sails across the fjord
      longship: { talk: [p('task-22420280', 93, [6, 94])],
        act: p('task-22420282', 93, [6, 94], { mode: 'build', prop: 'longship', fx: 'logs' }),
        act2: p('task-22420473', 0, [0, 0], { water: true, mode: 'ride', prop: 'boat', path: [[-18, 90], [50, 88], [118, 90]], fx: 'splash' }) },
      // meatballs loaded into the cannon on the shore and fired at the target out on the fjord
      'meatball-cannon': { talk: [p('task-22420282', 93, [6, 94])],
        act: p('task-22420280', 93, [6, 94], { mode: 'toss', prop: 'meatballs', propW: 0.5, judge: ['cannon', 0.8], fx: 'dust' }) },
      'buoy-row': { talk: [p('task-22420280', 93, [6, 94])],
        act: p('task-22420516', 0, [0, 0], { water: true, mode: 'ride', prop: 'boat', path: [[-18, 88], [50, 86], [118, 88]], fx: 'splash' }) },
      // the buoy finish is a job (edit/): a floating deck by the buoy; meanwhile the shore
      mat: { talk: [repaint('chill-buoy-mat', p('chill-buoy-mat', 85, [6, 94], { mat: [50, 74] }), p('task-22420282', 93, [6, 94], { matPos: [50, 92] }))] },
    },
  },
  'great-falls': {
    src: '43-great-falls', title: 'present-22421498', opener: p('present-22421490', 60, [6, 94]),
    arrive: [p('present-22421490', 60, [6, 94])],
    props: { boat: 'Empty white swan pedal boat-2', pole: 'Long brown balance pole-1', slots: 'slot-machine-v2', dress: 'wedding-dress' },
    st: {
      // pedalled away from the roar of the falls to the landing
      'swan-boat': { talk: [p('present-22421490', 60, [6, 94])],
        act: p('task-22421517', 0, [0, 0], { water: true, mode: 'ride', prop: 'boat', path: [[-18, 84], [50, 82], [118, 84]], fx: 'splash' }) },
      // the slot machine pulled until it lands three hearts; then the one dress on the rails
      'wedding-slots': { talk: [p('task-22421563', 96, [6, 94], { closed: true })],
        act: p('task-22421546', 95, [6, 94], { closed: true, mode: 'lever', prop: 'slots', propW: 1.1, judge: ['dress', 0.6] }),
        act2: p('task-22421563', 96, [6, 94], { closed: true, mode: 'search', prop: 'dress', propW: 0.6, fx: 'sparkle' }) },
      // the tightrope across the falls with a balance pole
      tightrope: { talk: [p('task-22421519', 50, [6, 94])],
        act: p('task-22421939', 77, [4, 96], { mode: 'walk', prop: 'pole', path: [[4, 77], [30, 77], [56, 77], [84, 77]], fx: 'wind' }) },
      // the rim deck with its booths is a job (edit/); meanwhile the landing beach
      mat: { talk: [repaint('chill-falls-mat', p('chill-falls-mat', 93, [6, 94], { mat: [56, 84] }), p('task-22421519', 50, [6, 94], { matPos: [50, 48] }))] },
    },
  },
  'bamboo-wall-hills': {
    src: '44-bamboo-wall-hills', title: 'present-22422729', opener: p('present-22422201', 90, [28, 94]),
    arrive: [p('arrive-22422216', 92, [30, 94])],
    props: { bowl: 'delicacy-bowl', gong: 'gong' },
    st: {
      'bamboo-bus': { talk: [p('arrive-22422216', 92, [30, 94])],
        act: p('present-22422201', 92, [6, 94], { mode: 'ride', prop: 'bus@geyser-island', path: [[-20, 93], [50, 92], [120, 93]], fx: 'dust' }) },
      // along the top of the wall before the gong sounds
      'wall-race': { talk: [p('task-22422301', 94, [6, 94])],
        act: p('task-22422384', 93, [6, 94], { mode: 'run', path: [[8, 93], [50, 93], [92, 93]], fx: 'dust' }),
        act2: p('task-22422303', 93, [6, 94], { mode: 'lever', prop: 'gong', propW: 0.9 }) },
      // the eating table is a job (edit/); meanwhile the counter of bowls
      delicacies: { talk: [p('task-22424807', 93, [6, 94])],
        act: repaint('task-eating-table', p('task-eating-table', 92, [6, 94], { closed: true, mode: 'eat', prop: 'bowl', fx: 'steam' }),
          p('task-22422501', 96, [6, 94], { closed: true, mode: 'eat', prop: 'bowl', fx: 'steam' })) },
      mat: { talk: [p('task-22422303', 93, [6, 94], { matPos: [50, 90] })] },
    },
  },
  'grass-savanna': {
    src: '45-grass-savanna', title: 'present-22423390', opener: p('present-22423205', 88, [6, 94]),
    arrive: [p('arrive-22422818', 92, [48, 96])],
    props: { crate: 'plum-crate', ball: 'Minimalist black-and-white soccer ball', bat: 'cricket-bat', gourd: 'gourd-on-post',
      ...(REPAINTED.has('zebra') ? { zebra: 'zebra' } : {}) },
    st: {
      'safari-jeep': { talk: [p('arrive-22422818', 92, [48, 96])],
        act: p('present-22423042', 72, [6, 94], { mode: 'ride', prop: 'ute@outback-farm', path: [[-16, 73], [50, 72], [116, 73]], fx: 'dust' }) },
      // plums into the crate, footballs kicked at the pickers
      plums: { talk: [p('arrive-22422915', 92, [6, 80])],
        act: p('task-22422865', 95, [6, 94], { mode: 'pick', prop: 'crate', propW: 0.7, judge: ['ball', 0.3], fx: 'dust' }) },
      // the gourds smashed off their posts with a cricket bat
      gourds: { talk: [p('present-22423205', 88, [6, 94])],
        act: p('task-22422938', 95, [6, 94], { mode: 'serve', prop: 'bat', propW: 0.55, fx: 'dust' }) },
      // tracking the animal through the tall grass (the zebra is a job; meanwhile the bird from the outback)
      safari: { talk: [p('task-22423089', 92, [6, 94])],
        act: p('task-22423157', 93, [6, 94], { mode: 'chase', prop: REPAINTED.has('zebra') ? 'zebra' : 'emu@red-outback', propW: 0.8, fx: 'dust' }) },
      mat: { talk: [p('chill-22423238', 90, [6, 94], { matPos: [56, 86] })] },
    },
  },
  'stone-head-island': {
    src: '46-stone-head-island', title: 'present-22424060', opener: p('present-22423539', 95, [6, 94]),
    arrive: [p('arrive-22423541', 95, [6, 94])],
    props: { eggs: 'colour-eggs', basket: 'Lavender Eggs in a Wicker Basket', condor: 'condor' },
    st: {
      'island-jeep': { talk: [p('arrive-22423541', 95, [6, 94])],
        act: p('present-22423539', 95, [6, 94], { mode: 'ride', prop: 'ute@outback-farm', path: [[-16, 96], [50, 95], [116, 96]], fx: 'dust' }) },
      // three painted eggs hunted among the stone heads
      eggs: { talk: [p('task-22423725', 95, [6, 94])],
        act: p('task-22423574', 92, [28, 96], { mode: 'search', prop: 'eggs', propW: 0.5, fx: 'sparkle' }) },
      // the eggs carried up the spire to the condor's nest
      'condor-nest': { talk: [p('task-22423652', 93, [6, 94])],
        act: p('task-22423848', 96, [20, 80], { mode: 'climb', prop: 'basket', path: [[50, 98], [53, 76], [49, 54], [52, 32]], fx: 'wind' }),
        act2: p('task-22423652', 93, [6, 94], { mode: 'toss', prop: 'basket', propW: 0.5, judge: ['condor', 0.9], fx: 'wind' }) },
      mat: { talk: [p('task-22423611', 92, [30, 96], { matPos: [64, 88] })] },
    },
  },
  badlands: {
    src: '47-badlands', title: 'arrive-22424402', opener: p('task-22424403', 93, [6, 94]),
    arrive: [p('arrive-22424402', 93, [6, 94])],
    props: { bone: 'dino-bone', skeleton: 'Stylized theropod skeleton cutout-1', pickaxe: 'pickaxe', barrel: 'oil-barrel', rig: 'Angular yellow auger rig-2' },
    st: {
      'hoodoo-pickup': { talk: [p('arrive-22424402', 93, [6, 94])],
        act: p('task-22424403', 93, [6, 94], { mode: 'ride', prop: 'ute@outback-farm', path: [[-16, 94], [50, 93], [116, 94]], fx: 'dust' }) },
      // bones dug out of the plain, then the dinosaur built from them
      dino: { talk: [p('Dinosaur skeleton among desert rocks-8', 93, [6, 94])],
        act: p('task-22424409', 93, [6, 94], { mode: 'search', prop: 'bone', propW: 0.6, fx: 'dust' }),
        act2: p('present-22424203', 93, [6, 94], { mode: 'build', prop: 'skeleton', fx: 'dust' }) },
      // digging at the drill site for the buried barrel
      'oil-barrel': { talk: [p('task-22424515', 93, [6, 94])],
        act: p('Empty quarry, jet, barrels, and drill rig-9', 94, [6, 94], { mode: 'chip', prop: 'pickaxe', judge: ['barrel', 0.45], fx: 'dust' }) },
      mat: { talk: [p('Lantern-Lit Fossil Campfire-1', 90, [14, 86], { matPos: [50, 87] })] },
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
