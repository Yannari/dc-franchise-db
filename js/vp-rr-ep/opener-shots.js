// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/opener-shots.js — where each of Don's openers is shot
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-20: "it says don is inside a log cabin but theres no log cabin tell me when u need plate always".
// Every place's opener (lines/places/<id>.js 'don-opener.*') says where Don is; each is shot where it says:
//   f      a plate the place already has
//   job    a plate still to be made (tools/rr-vp-jobs.json, Downloads/RidonculousRace-frames/edit/): until it is back
//          (repainted.js), the opener doesn't air (write.js skips it) and the place's others do
//   deco   cut-outs Don is with ([key, x, y, w, opts]); one still to be made names its job in `need`
// An opener with no entry here is shot on the place's own opener plate.
import { REPAINTED } from './repainted.js';

const R = k => `${k}@race`;                    // a race-wide cut-out (assets/sets/rr/race/c-<k>.webp)
const HAMMOCK = x => ({ deco: [[R('hammock'), x, 92, 22]], need: ['hammock'] });

export const OPENER_SHOTS = {
  // ── shot on plates the place has ──
  'bdl.op1': { f: 'Dinosaur skeletons in a fossil display-7' }, 'bdl.op2': { f: 'arrive-22424402' }, 'bdl.op3': { f: 'Fossil dig site cleared-6' },
  'bwh.op1': { f: 'present-22422729' }, 'bwh.op2': { f: 'present-22422201' }, 'bwh.op3': { job: 'don-tea-room' },
  'cvr.op1': { f: 'present-9437791' }, 'cvr.op2': { f: 'present-9437791' }, 'cvr.op3': { f: 'present-9438215', ...HAMMOCK(34) },
  'cpi.op1': { f: 'arrive-22416267' }, 'cpi.op2': { f: 'arrive-22416267' }, 'cpi.op3': { f: 'arrive-22416267', ...HAMMOCK(30) },
  'cpl.op1': { f: 'task-shark-deck' }, 'cpl.op2': { f: 'task-shark-deck' }, 'cpl.op3': { f: 'present-9436927', deco: [[R('sunlounger'), 34, 92, 20]], need: ['sunlounger'] },
  'drg.op1': { f: 'travel-9445205' }, 'drg.op2': { f: 'travel-9445205' }, 'drg.op3': { f: 'travel-9445205', deco: [[R('lifeguard-chair'), 30, 94, 14]], need: ['lifeguard-chair'] },
  'dt.op7': { f: 'present-22425170' }, 'fmi.op1': { f: 'present-22425170' }, 'fmi.op2': { f: 'task-22425944' }, 'fmi.op3': { f: 'present-22425170' },
  'fsc.op1': { f: 'chill-22416099' }, 'fsc.op2': { f: 'chill-22416099' }, 'fsc.op3': { job: 'don-fish-kitchen' },
  'fjp.op1': { f: 'arrive-9443367' }, 'fjp.op2': { f: 'arrive-9443367' }, 'fjp.op3': { f: 'task-9443766' },
  'fjs.op1': { f: 'arrive-22420234' }, 'fjs.op2': { f: 'arrive-22420234' }, 'fjs.op3': { job: 'don-fjord-cabin' },
  'fzm.op1': { f: 'present-9447601' }, 'fzm.op2': { f: 'present-9447601' }, 'fzm.op3': { f: 'chill-sauna-mat' },
  'gsc.op1': { job: 'don-neon-crossing' }, 'gsc.op2': { f: 'arrive-22411160' }, 'gsc.op3': { job: 'don-capsule-hotel' },
  'gyi.op1': { f: 'task-9437137' }, 'gyi.op2': { f: 'travel-9437713' }, 'gyi.op3': { job: 'don-hot-spring' },
  'gpc.op1': { f: 'chill-22415411' }, 'gpc.op2': { f: 'chill-22415411' }, 'gpc.op3': { job: 'don-pavement-cafe' },
  'gtg.op1': { f: 'present-9439561' }, 'gtg.op2': { f: 'present-9439561' }, 'gtg.op3': { job: 'don-rooftop-pool' },
  'gsv.op1': { f: 'present-22423390' }, 'gsv.op2': { f: 'present-22423205' }, 'gsv.op3': { f: 'present-22423205', ...HAMMOCK(40) },
  'grf.op1': { f: 'present-22421498' }, 'grf.op2': { f: 'present-22421490' }, 'grf.op3': { job: 'don-honeymoon-suite' },
  'gwh.op1': { f: 'present-9440465' }, 'gwh.op2': { f: 'task-9440339' }, 'gwh.op3': { f: 'task-9440310' },
  'hcs.op1': { f: 'present-9438456' }, 'hcs.op2': { f: 'present-9438433' }, 'hcs.op3': { job: 'don-castle-hall' },
  'dt.op8': { f: 'arrive-9434588' }, 'hc.op1': { f: 'arrive-9434588' }, 'hc.op2': { f: 'arrive-9434588' }, 'hc.op3': { f: 'arrive-9434797' },
  'ifl.op1': { f: 'present-9444530' }, 'ifl.op2': { f: 'present-9445072' }, 'ifl.op3': { job: 'don-heated-tent' },
  'icr.op1': { f: 'task-22411751' }, 'icr.op2': { f: 'arrive-22411593' }, 'icr.op3': { job: 'don-log-cabin' },
  'itc.op1': { f: 'present-9435854' }, 'itc.op2': { f: 'present-9435854' }, 'itc.op3': { f: 'present-9435854' },
  'jgr.op1': { f: 'task-22414359' }, 'jgr.op2': { f: 'task-22414359' }, 'jgr.op3': { f: 'task-22414262', ...HAMMOCK(36) },
  'lei.op1': { f: 'present-9439148' }, 'lei.op2': { f: 'present-9439148' }, 'lei.op3': { f: 'present-9439148', ...HAMMOCK(32) },
  'mth.op1': { f: 'present-22418524' }, 'mth.op2': { f: 'Empty Temple Steps Amid Ancient Ruins' }, 'mth.op3': { f: 'Ancient temple with empty stone steps' },
  'nde.op1': { job: 'don-neon-strip' }, 'nde.op2': { job: 'don-neon-strip' }, 'nde.op3': { job: 'don-card-table' },
  'obf.op1': { f: 'present-9442701' }, 'obf.op2': { f: 'present-9442701' }, 'obf.op3': { f: 'present-9442822', deco: [[R('hay-bale'), 34, 92, 16]], need: ['hay-bale'] },
  'pmp.op1': { f: 'task-9449004' }, 'pmp.op2': { f: 'task-9449004' }, 'pmp.op3': { f: 'task-9449177' },
  'prr.op1': { f: 'present-9443998' }, 'prr.op2': { f: 'present-9444391' }, 'prr.op3': { f: 'present-9443998' },
  'pyc.op1': { f: 'present-9446346' }, 'pyc.op2': { f: 'present-9446346' }, 'pyc.op3': { f: 'present-9446715', ...HAMMOCK(36) },
  'rob.op1': { f: 'present-22419827' }, 'rob.op2': { f: 'arrive-22419610' }, 'rob.op3': { f: 'arrive-22419610', deco: [['ute@outback-farm', 70, 92, 26], [R('camping-chair'), 38, 92, 9]], need: ['camping-chair'] },
  'dt.op6': { f: 'present-9435500' }, 'rsd.op1': { f: 'present-9435500' }, 'rsd.op2': { f: 'present-9435572' }, 'rsd.op3': { f: 'task-9435287', deco: [[R('camping-chair'), 30, 93, 9]], need: ['camping-chair'] },
  'rn.op1': { f: 'present-9440796' }, 'rn.op2': { f: 'task-9441025' }, 'rn.op3': { f: 'present-9440799', deco: [[R('hot-tub'), 40, 94, 20]], need: ['hot-tub'] },
  'svf.op1': { f: 'present-9441413' }, 'svf.op2': { f: 'present-9441461' }, 'svf.op3': { f: 'present-9441461', deco: [['jeep', 40, 94, 26]] },
  'sbd.op1': { f: 'present-22418966' }, 'sbd.op2': { f: 'present-22418966' }, 'sbd.op3': { job: 'don-trailer-roof' },
  'dt.op9': { f: 'present-9450080' }, 'sky.op1': { f: 'present-9450080' }, 'sky.op2': { f: 'present-9450080' }, 'sky.op3': { f: 'present-9450080', deco: [[R('make-up-chair'), 36, 94, 12]], need: ['make-up-chair'] },
  'snp.op1': { f: 'present-22413727' }, 'snp.op2': { f: 'present-22413727' }, 'snp.op3': { job: 'don-mountain-hut' },
  'str.op1': { f: 'present-9447233' }, 'str.op2': { f: 'present-9447233' }, 'str.op3': { f: 'arrive-9447023', ...HAMMOCK(60) },
  'shi.op1': { f: 'present-22423539' }, 'shi.op2': { f: 'present-22423539' }, 'shi.op3': { f: 'task-22423725' },
  'swp.op1': { f: 'task-9442380' }, 'swp.op2': { f: 'task-9442380' }, 'swp.op3': { f: 'task-9442380', deco: [[R('rocking-chair'), 32, 92, 10]], need: ['rocking-chair'] },
  'tea.op1': { f: 'present-9448187' }, 'tea.op2': { f: 'present-9448586' }, 'tea.op3': { job: 'don-veranda' },
  'tms.op1': { f: 'present-22410404' }, 'tms.op2': { f: 'present-22410572' }, 'tms.op3': { job: 'don-palm-shade' },
  'tsh.op1': { f: 'present-22412488' }, 'tsh.op2': { f: 'present-22412601' }, 'tsh.op3': { f: 'chill-22413471' },
  'tri.op1': { f: 'task-9449601' }, 'tri.op2': { f: 'task-9449601' }, 'tri.op3': { f: 'present-9449351', ...HAMMOCK(40) },
  'ttb.op1': { f: 'present-22417609' }, 'ttb.op2': { f: 'Leafy empty zebra crossing-1' }, 'ttb.op3': { job: 'don-pub' },
};

/** Whether an opener can air yet: its plate and its cut-outs are all made. */
export function openerReady(id) {
  const s = OPENER_SHOTS[id];
  if (!s) return true;
  if (s.job && !REPAINTED.has(s.job)) return false;
  return (s.need || []).every(k => REPAINTED.has(k));
}
