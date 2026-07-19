// Persistent, bounded lessons learned from play. These tendencies modify how a
// contestant applies their existing stats; they never rewrite the base cast.
import { gs } from './core.js';
import { pStats } from './players.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
const round = v => Math.round(v * 100) / 100;
function fresh(name) { return { name, verification:0, caution:0, confidence:0, negotiation:0, withdrawal:0, idolAwareness:0, splitPreference:0, rejectionStreak:0, blindsides:0, successfulMoves:0, lastProcessedEp:0, history:[] }; }
export function getAdaptation(name) { if (!gs.adaptationProfiles) gs.adaptationProfiles={}; return gs.adaptationProfiles[name] || (gs.adaptationProfiles[name]=fresh(name)); }
function learnRate(name) { const s=pStats(name); return clamp(0.45+((s.strategic||5)+(s.intuition||5)-10)*0.035,0.3,0.9); }
function baselines(name) { const s=pStats(name); return { confidence:clamp(((s.boldness||5)+(s.strategic||5)-10)/35,-.14,.25), negotiation:clamp(((s.social||5)+(s.strategic||5)-10)/45,-.10,.20) }; }
function drift(value,target,rate=.07) { return value+(target-value)*rate; }
function note(p,ep,type,text) { p.history.push({ep,type,text}); if(p.history.length>20)p.history.splice(0,p.history.length-20); return {player:p.name,type,text}; }
function normalize(p) { p.verification=round(clamp(p.verification,0,.35)); p.caution=round(clamp(p.caution,0,1)); p.confidence=round(clamp(p.confidence,-1,1)); p.negotiation=round(clamp(p.negotiation,-1,1)); p.withdrawal=round(clamp(p.withdrawal,0,1)); p.idolAwareness=round(clamp(p.idolAwareness,0,1)); p.splitPreference=round(clamp(p.splitPreference,0,1)); }

export function updateAdaptationFromEpisode(ep={}) {
  if(!ep.num||!ep.votingLog?.length)return [];
  if(!gs._adaptationProcessedEpisodes)gs._adaptationProcessedEpisodes=[];
  if(gs._adaptationProcessedEpisodes.includes(ep.num))return ep.adaptationEvents||[];
  const names=[...new Set(ep.votingLog.map(v=>v.voter).filter(n=>n&&n!=='THE GAME'))], events=[];
  const successfulSplitMembers=new Set();
  (ep.splitVotePlans||[]).forEach(plan=>{ const idolHit=(ep.idolPlays||[]).some(play=>(play.player===plan.primary||play.playedFor===plan.primary)&&(play.votesNegated||0)>0); if(idolHit&&ep.eliminated===plan.secondary){ const alliance=(gs.namedAlliances||[]).find(a=>a.name===plan.alliance); (alliance?.members||[]).forEach(n=>successfulSplitMembers.add(n)); }});
  names.forEach(name=>{ const p=getAdaptation(name), rate=learnRate(name), base=baselines(name); p.withdrawal*=.92;p.caution*=.98;p.confidence=drift(p.confidence,base.confidence,.10);p.negotiation=drift(p.negotiation,base.negotiation,.06); const ballot=ep.votingLog.find(v=>v.voter===name&&!v.isExtraVote); const read=(ep.voteCommitmentDiagnostics||[]).find(r=>r.voter===name); const onBoot=ballot&&ep.eliminated&&ballot.voted===ep.eliminated; const assignedSplit=(ep.splitVotePlans||[]).some(plan=>[...(plan.primaryVoters||[]),...(plan.secondaryVoters||[]),...(plan.backupVoters||[])].includes(name));
    const reason=String(ballot?.reason||'').toLowerCase(); const intentional=assignedSplit||!!ballot?.planBreak||['protect-ally','self-preservation','private-preference-won','assigned-primary-idol-split','assigned-backup-idol-split'].includes(ballot?.lateTrigger)||/protect|refused to write|jury management|split vote|intentional/.test(reason);
    const understood=read?.predictedBallot===ep.eliminated; const tally=ep.votes||{}; const winning=Number(tally[ep.eliminated]||0); const ownTotal=Number(tally[ballot?.voted]||0); const closeLoss=!!ballot&&winning>0&&ownTotal>=winning-1;
    const idolInvalidated=(ep.idolPlays||[]).some(play=>(play.player===ballot?.voted||play.playedFor===ballot?.voted)&&(play.votesNegated||0)>0);
    if(ballot&&ep.eliminated&&!onBoot&&!intentional&&!understood&&!idolInvalidated){p.verification+=(closeLoss?.015:.04)*rate;p.caution+=(closeLoss?.025:.075)*rate;p.confidence-=(closeLoss?.015:.055)*rate;p.withdrawal+=(closeLoss?.005:.025)*rate;if(!closeLoss){p.blindsides++;events.push(note(p,ep.num,'blindside',`${name} genuinely misread the deciding vote and will verify numbers more carefully.`));}}
    else if(onBoot){p.successfulMoves++;p.confidence+=.035*rate;p.withdrawal-=.045*rate;}
    else if(understood||intentional||idolInvalidated){p.confidence+=.004*rate;p.withdrawal-=.015*rate;}
    if(successfulSplitMembers.has(name)){p.idolAwareness+=.16*rate;p.splitPreference+=.22*rate;events.push(note(p,ep.num,'split-success',`${name} saw a split vote defeat an idol and is more likely to recognize that option again.`));}
    else if((ep.idolPlays||[]).some(play=>(play.votesNegated||0)>0))p.idolAwareness+=.07*rate;
    normalize(p);p.lastProcessedEp=ep.num;
  });
  (ep.votePitches||[]).forEach(pitch=>{const organizer=getAdaptation(pitch.pitcher),rate=learnRate(pitch.pitcher),responses=pitch.responses||[],caught=responses.some(r=>r.catchesExaggeration),engaged=responses.some(r=>r.accepted||(r.acceptChance||0)>=.25||['protecting-target','strong-plan-not-replaced','numbers-confirmed','does-not-save-me'].includes(r.reason)),badPitch=!pitch.attemptedContacts||caught||responses.some(r=>r.reason==='impossible-numbers');if(pitch.success){organizer.negotiation+=.075*rate;organizer.confidence+=.055*rate;organizer.withdrawal-=.09*rate;organizer.rejectionStreak=0;events.push(note(organizer,ep.num,'pitch-worked',`${pitch.pitcher}'s pitch found traction; they gain confidence approaching people.`));}else if(engaged&&!badPitch){organizer.negotiation+=.018*rate;organizer.withdrawal-=.025*rate;organizer.rejectionStreak=Math.max(0,organizer.rejectionStreak-1);events.push(note(organizer,ep.num,'credible-pitch',`${pitch.pitcher}'s pitch was heard seriously but lost to circumstances; the attempt still builds experience.`));}else{organizer.rejectionStreak++;const diminishing=1/Math.sqrt(organizer.rejectionStreak);organizer.negotiation-=.04*rate*diminishing;organizer.withdrawal+=.045*rate*diminishing;events.push(note(organizer,ep.num,'pitch-stalled',`${pitch.pitcher}'s pitch failed to gain a serious foothold; repeated rejection has diminishing impact.`));}if(caught){organizer.caution+=.22*rate;events.push(note(organizer,ep.num,'lie-caught',`${pitch.pitcher}'s inflated numbers were challenged; they become less willing to bluff the count.`));}responses.forEach(r=>{const listener=getAdaptation(r.voter);listener.withdrawal-=r.accepted?.045:.018;if(r.catchesExaggeration)listener.verification+=.025*learnRate(r.voter);normalize(listener);});normalize(organizer);});
  gs._adaptationProcessedEpisodes.push(ep.num);ep.adaptationEvents=events;ep.adaptationSnapshot=Object.fromEntries(Object.entries(gs.adaptationProfiles||{}).map(([n,p])=>[n,{...p,history:[...(p.history||[])]}]));return events;
}
export const pitchInitiationModifier=name=>{const p=getAdaptation(name);return clamp(p.confidence*.06+p.negotiation*.08-p.withdrawal*.10,-.14,.12);};
export const approachBudgetModifier=name=>{const p=getAdaptation(name);return p.withdrawal>=.55?-1:(p.negotiation>=.55&&p.confidence>0?1:0);};
export const lieChanceModifier=name=>-clamp(getAdaptation(name).caution*.24,0,.24);
export const verificationModifier=name=>getAdaptation(name).verification;
export const learnedCaution=name=>getAdaptation(name).caution;
export const idolSuspicionModifier=name=>clamp(getAdaptation(name).idolAwareness*.10,0,.10);
export const splitVotePreference=name=>getAdaptation(name).splitPreference;
