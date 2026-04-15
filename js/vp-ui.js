// ══════════════════════════════════════════════════════════════════════
// vp-ui.js — VP navigation, interaction, particles, search, reveal helpers
// ══════════════════════════════════════════════════════════════════════

export function vpAnimateTallies(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.vp-tally-num[data-target]').forEach((el, i) => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const duration = 600;
    const startTime = performance.now() + i * 200;
    function tick(now) {
      if (now < startTime) { requestAnimationFrame(tick); return; }
      const elapsed = now - startTime;
      current = Math.min(target, Math.round((elapsed / duration) * target));
      el.textContent = current;
      if (current < target) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

export function vpRevealNextPlacement(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const placements = JSON.parse(el.dataset.placements);
  const revealed = parseInt(el.dataset.revealed);
  if (revealed >= placements.length) return;

  // Reveal from last place (index 0, top slot) to winner (index N-1, bottom slot)
  const revealIdx = revealed;
  const playerName = placements[revealIdx];
  const isWinner = playerName === el.dataset.winner;
  const slot = document.getElementById(`${containerId}-slot-${revealIdx}`);
  if (!slot) return;

  const place = placements.length - revealIdx;
  const s = pStats(playerName);
  const totalPlayers = placements.length;
  // Use place + name + epNum for unique seed per player per episode — prevents repeats
  const _pck = (arr, sd) => arr[([...sd].reduce((a,c)=>a+c.charCodeAt(0),0) + place * 13 + revealIdx * 7) % arr.length];

  // Check if this player threw the challenge (viewer-only info)
  const _throwers = JSON.parse(el.dataset.throwers || '[]');
  const _threwIt = _throwers.includes(playerName);

  // Context-aware reason for each placement
  let flavor = '';
  if (_threwIt) {
    // Viewer knows they threw it — show the strategic reasoning
    const _threwReasons = [
      `Deliberately underperformed. The target on ${playerName}'s back was getting too heavy — winning again would've sealed ${pronouns(playerName).pos} fate.`,
      `Threw it. ${playerName} could've competed harder — chose not to. Looking weak is a strategy. The tribe doesn't know yet.`,
      `${playerName} pulled back on purpose. After recent wins, another immunity necklace would've painted a target ${pronouns(playerName).sub} couldn't survive. Smart? Maybe. Risky? Definitely.`,
    ];
    flavor = _pck(_threwReasons, playerName + 'throw');
  } else if (isWinner) {
    const winReasons = [];
    if (s.physical >= 8) winReasons.push(`Dominated physically \u2014 nobody was close.`);
    if (s.endurance >= 8) winReasons.push(`Outlasted everyone. Pure willpower.`);
    if (s.mental >= 8) winReasons.push(`Solved it faster than anyone expected.`);
    if (s.physical >= 6 && s.endurance >= 6) winReasons.push(`All-around performance \u2014 no weaknesses to exploit.`);
    winReasons.push(`Found another gear when it mattered most.`);
    winReasons.push(`Peaked at exactly the right time.`);
    winReasons.push(`When the pressure was highest, ${playerName} was the calmest one out there.`);
    flavor = _pck(winReasons, playerName + 'w' + place);
  } else if (place === totalPlayers) {
    // Last place
    const lastReasons = [
      `Fell behind early and never found a rhythm.`,
      `The challenge format exposed a real weakness.`,
      `Out of sync from the start. The pressure showed on ${playerName}'s face.`,
      `Struggled to keep pace. This wasn't ${playerName}'s kind of challenge.`,
    ];
    if (s.physical <= 4) lastReasons.push(`Physical challenges have never been ${playerName}'s strength. Today confirmed it.`);
    if (s.endurance <= 4) lastReasons.push(`Couldn't hold on. The body gave out before the will did.`);
    if (s.mental <= 4) lastReasons.push(`Lost focus at a critical moment. One mistake snowballed.`);
    lastReasons.push(`Gave everything. It just wasn't enough today.`);
    flavor = _pck(lastReasons, playerName + 'L' + place);
  } else {
    // Middle placements — large pool + placement-relative text to avoid repeats
    const isUpperHalf = place <= Math.ceil(totalPlayers / 2);
    const midReasons = [];

    // Upper half — closer to winning
    if (isUpperHalf) {
      midReasons.push(`So close. A few more seconds and the outcome could've been different.`);
      midReasons.push(`Pushed hard until the very end. Just couldn't close the gap.`);
      midReasons.push(`${playerName} was right there. The margin was razor-thin.`);
      midReasons.push(`Strong showing \u2014 but the winner was just a step ahead.`);
      midReasons.push(`Had the lead at one point. Then lost it. That's the game.`);
    }
    // Lower half — further from winning
    else {
      midReasons.push(`Started strong but faded when the challenge got harder.`);
      midReasons.push(`Stayed in longer than people expected. Still went out before the finish.`);
      midReasons.push(`Not ${playerName}'s best showing. The frustration was visible.`);
      midReasons.push(`Fought for every second but couldn't keep up with the top performers.`);
      midReasons.push(`The challenge moved too fast. ${playerName} was always half a step behind.`);
    }

    // Stat-driven additions (unique to this player)
    if (s.physical >= 7) midReasons.push(`${playerName}'s physical ability kept ${pronouns(playerName).obj} in contention, but the final stretch required something more.`);
    if (s.mental >= 7) midReasons.push(`Read the challenge well. Hands just couldn't keep up with the mind.`);
    if (s.endurance >= 7) midReasons.push(`Endurance wasn't the issue \u2014 it was the burst of speed at the end that ${playerName} couldn't match.`);
    if (s.boldness >= 8) midReasons.push(`Took a risky approach. It almost worked. Almost.`);
    if (s.temperament <= 3) midReasons.push(`Got frustrated and it cost ${pronouns(playerName).obj}. Composure matters in these moments.`);
    if (s.strategic >= 7) midReasons.push(`Played the challenge smart. But smart doesn't always beat fast.`);

    flavor = _pck(midReasons, playerName + 'M' + place);
  }

  slot.style.opacity = '1';
  slot.innerHTML = `
    <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted);width:24px">${place === 1 ? '\u{1F947}' : place}</span>
    ${rpPortrait(playerName)}
    <div style="flex:1">
      <span style="font-size:13px${isWinner ? ';color:var(--accent-gold);font-family:var(--font-display)' : ''}">${playerName}</span>
      ${isWinner ? `<span class="rp-brant-badge gold">IMMUNE</span>` : ''}
      ${_threwIt ? `<span class="rp-brant-badge" style="color:#f0883e;background:rgba(240,136,62,0.1);border-color:rgba(240,136,62,0.3)">THREW IT</span>` : ''}
      <div style="font-size:10px;color:${_threwIt ? '#f0883e' : 'var(--muted)'};margin-top:2px">${flavor}</div>
    </div>
  `;
  slot.style.animation = 'staggerIn 0.35s var(--ease-broadcast) both';
  if (isWinner) slot.style.boxShadow = '0 0 0 1px var(--accent-gold)';

  el.dataset.revealed = revealed + 1;

  // When the winner (last placement) is revealed, show the suspense cards
  if (isWinner) {
    const suspenseEl = document.getElementById('chal-suspense-' + containerId.replace('chal-reveal-', ''));
    if (suspenseEl) { suspenseEl.style.display = 'block'; suspenseEl.style.animation = 'staggerIn 0.5s var(--ease-broadcast) both'; }
  }
}

export function vpRevealAllPlacements(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const placements = JSON.parse(el.dataset.placements);
  const total = placements.length;
  el.dataset.revealed = '0';
  for (let i = 0; i < total; i++) {
    vpRevealNextPlacement(containerId);
  }
  // Also reveal suspense cards
  const suspenseEl = document.getElementById('chal-suspense-' + containerId.replace('chal-reveal-', ''));
  if (suspenseEl) suspenseEl.style.display = 'block';
}

export function vpRevealTribe(slotId, tribeName) {
  const nameEl = document.getElementById(`${slotId}-name`);
  const badgeEl = document.getElementById(`${slotId}-badge`);
  if (nameEl) {
    nameEl.textContent = tribeName;
    nameEl.style.color = tribeColor(tribeName);
  }
  if (badgeEl) badgeEl.style.display = '';
}

export function vpRevealAllTribes(revealId, slots) {
  slots.forEach(s => vpRevealTribe(s.slotId, s.name));
}
export function vpRevealAllTribesFromData(btn) {
  const data = btn.dataset.slots || '';
  data.split('|').forEach(entry => {
    const [slotId, name] = entry.split(':');
    if (slotId && name) vpRevealTribe(slotId, name);
  });
}

// Interactive reveal for individual reward challenge (last-to-first)
export function rcIndRevealNext(revealId) {
  const container = document.getElementById(revealId);
  if (!container) return;
  const total = parseInt(container.dataset.total);
  let revealed = parseInt(container.dataset.revealed);
  if (revealed >= total) return;
  const placements = JSON.parse(container.dataset.placements || '[]');
  const winner = container.dataset.winner;
  const companions = JSON.parse(container.dataset.companions || '[]');
  // Reveal from last place to first (slot 0 = last place, slot N-1 = winner)
  const slot = document.getElementById(`${revealId}-slot-${revealed}`);
  if (!slot) return;
  const rank = total - 1 - revealed; // actual placement rank
  const name = [...placements].reverse()[revealed];
  const isWinner = name === winner;
  const isCompanion = companions.includes(name);
  const isLast = rank === total - 1;
  slot.style.opacity = '1';
  slot.style.borderColor = isWinner ? 'rgba(240,165,0,0.4)' : 'rgba(139,148,158,0.2)';
  if (isWinner) slot.style.background = 'rgba(240,165,0,0.06)';
  // No SHARES badge during reveal — companion picks only shown in winner section after full reveal
  const badge = isWinner
    ? '<span style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(240,165,0,0.12);color:#f0a500;padding:2px 7px;border-radius:3px">REWARD</span>'
    : isLast
    ? '<span style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(218,54,51,0.10);color:#f85149;padding:2px 7px;border-radius:3px">LAST</span>'
    : '';
  slot.innerHTML = `
    <span style="font-size:11px;font-weight:800;color:${isWinner?'#f0a500':isLast?'#f85149':'#484f58'};min-width:20px;text-align:right;font-family:var(--font-mono)">${rank + 1}</span>
    ${typeof rpPortrait === 'function' ? rpPortrait(name, isWinner ? 'lg' : '') : ''}
    <span style="font-size:${isWinner?'14':'12'}px;font-weight:${isWinner?'700':'400'};color:${isWinner?'#f0a500':'#8b949e'}">${name}</span>
    ${badge}
  `;
  revealed++;
  container.dataset.revealed = revealed;
  const btn = document.getElementById(`${revealId}-btn`);
  if (btn) btn.textContent = revealed >= total ? 'All Revealed' : `REVEAL (${revealed}/${total})`;
  if (revealed >= total) {
    const winnerDiv = document.getElementById(`${revealId}-winner`);
    if (winnerDiv) winnerDiv.style.display = 'block';
  }
}
export function rcIndRevealAll(revealId) {
  const container = document.getElementById(revealId);
  if (!container) return;
  const total = parseInt(container.dataset.total);
  while (parseInt(container.dataset.revealed) < total) rcIndRevealNext(revealId);
}

// Ambassador meeting narrative — interactive beat-by-beat reveal
export function ambNarAdvance(narId) {
  const container = document.getElementById(narId);
  if (!container) return;
  const step = parseInt(container.dataset.step) || 0;
  const total = parseInt(container.dataset.total) || 0;
  if (step >= total) return;
  const beat = document.getElementById(`${narId}-beat-${step}`);
  if (beat) { beat.style.display = 'block'; setTimeout(() => beat.style.opacity = '1', 50); }
  container.dataset.step = String(step + 1);
  const btn = document.getElementById(`${narId}-btn`);
  if (btn) btn.textContent = step + 1 >= total ? 'MEETING COMPLETE' : 'CONTINUE';
  // Show outcome section when all narrative beats are revealed
  if (step + 1 >= total) {
    const outcomeDiv = document.getElementById(`${narId}-outcome`);
    if (outcomeDiv) outcomeDiv.style.display = 'block';
  }
}
export function ambNarRevealAll(narId) {
  const container = document.getElementById(narId);
  if (!container) return;
  const total = parseInt(container.dataset.total) || 0;
  while ((parseInt(container.dataset.step) || 0) < total) ambNarAdvance(narId);
}

// ── Triple Dog Dare sequential reveal ──
export function tddRevealNext(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const revealed = parseInt(page.dataset.tddRevealed) || 0;
  const deltas = JSON.parse(page.dataset.tddDeltas || '[]');
  if (revealed >= deltas.length) return;
  // Show the next item
  const el = document.querySelector('.' + uid + '-item[data-idx="' + revealed + '"]');
  if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  // Update freebie counters
  const fb = JSON.parse(page.dataset.tddFb || '{}');
  const d = deltas[revealed];
  for (const p in d) {
    fb[p] = (fb[p] || 0) + d[p];
    const cel = document.getElementById(uid + '-fb-' + p.replace(/[^a-zA-Z0-9]/g, '_'));
    if (cel) { cel.textContent = Math.max(0, fb[p]); cel.style.color = fb[p] <= 0 ? '#da3633' : 'var(--accent-gold)'; }
  }
  page.dataset.tddFb = JSON.stringify(fb);
  page.dataset.tddRevealed = revealed + 1;
}
export function tddRevealAll(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const deltas = JSON.parse(page.dataset.tddDeltas || '[]');
  while ((parseInt(page.dataset.tddRevealed) || 0) < deltas.length) tddRevealNext(uid);
}

// ── Say Uncle sequential reveal ──
export function suRevealNext(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const revealed = parseInt(page.dataset.suRevealed) || 0;
  const total = parseInt(page.dataset.suTotal) || 0;
  if (revealed >= total) return;
  const el = document.querySelector('.' + uid + '-item[data-idx="' + revealed + '"]');
  if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  page.dataset.suRevealed = revealed + 1;
  // Update counter if present
  const counter = document.getElementById(uid + '-counter');
  if (counter) counter.textContent = (revealed + 1) + '/' + total;
}
export function suRevealAll(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const total = parseInt(page.dataset.suTotal) || 0;
  while ((parseInt(page.dataset.suRevealed) || 0) < total) suRevealNext(uid);
}

// ── Phobia Factor sequential reveal ──
export function pfRevealNext(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const revealed = parseInt(page.dataset.pfRevealed) || 0;
  const total = parseInt(page.dataset.pfTotal) || 0;
  if (revealed >= total) return;
  const el = document.querySelector('.' + uid + '-item[data-idx="' + revealed + '"]');
  if (el) { el.style.display = 'block'; el.classList.add('pf-reveal-item'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  page.dataset.pfRevealed = revealed + 1;
}
export function pfRevealAll(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const total = parseInt(page.dataset.pfTotal) || 0;
  while ((parseInt(page.dataset.pfRevealed) || 0) < total) pfRevealNext(uid);
}

export function vpToggleSection(id) {
  const body = document.getElementById(id);
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? '' : 'none';
  const btn = body.previousElementSibling;
  if (btn) {
    const arrow = btn.querySelector('.rp-toggle-arrow');
    if (arrow) arrow.textContent = isHidden ? '\u25b2' : '\u25bc';
  }
}

export function vpGoTo(index) {
  if (index >= 0 && index < vpScreens.length) {
    vpCurrentScreen = index;
    renderVPScreen();
  }
}

// ── FTC jury vote sequential reveal ──
export const _ftcState = {}; // { [epNum]: { revealed: 0 } }

export function ftcRevealNext(epNum, total) {
  const state = _ftcState[epNum] || (_ftcState[epNum] = { revealed: 0 });
  const cards = document.querySelectorAll(`#ftc-cards-${epNum} .ftc-card`);
  if (state.revealed >= cards.length) return;

  const card = cards[state.revealed];
  card.style.display = 'flex';
  card.classList.add('tv-revealed', 'tv-latest');
  if (state.revealed > 0) cards[state.revealed - 1].classList.remove('tv-latest');

  // Update tally counter
  const voted = card.dataset.voted;
  if (voted) {
    const key = `ftc-cnt-${epNum}-${voted.replace(/\s+/g, '_')}`;
    const el = document.getElementById(key);
    if (el) el.textContent = parseInt(el.textContent || '0') + 1;
  }

  state.revealed++;
  if (state.revealed >= cards.length) {
    const finalEl = document.getElementById(`ftc-final-${epNum}`);
    if (finalEl) finalEl.style.display = 'block';
    const btn = document.getElementById(`ftc-btn-next-${epNum}`);
    if (btn) btn.disabled = true;
    // Now that all votes are revealed — highlight winner's counter in gold
    _ftcHighlightWinner(epNum);
  }
}

export function ftcRevealAll(epNum, total) {
  const cards = document.querySelectorAll(`#ftc-cards-${epNum} .ftc-card`);
  _ftcState[epNum] = { revealed: 0 };
  cards.forEach((card, i) => {
    card.style.display = 'flex';
    card.classList.add('tv-revealed');
    card.classList.remove('tv-latest');
    const voted = card.dataset.voted;
    if (voted) {
      const key = `ftc-cnt-${epNum}-${voted.replace(/\s+/g, '_')}`;
      const el = document.getElementById(key);
      if (el) {
        const cur = parseInt(el.textContent || '0');
        // Only count if not already counted
        if (cur === 0 || i === 0) el.textContent = parseInt(el.textContent || '0') + 1;
      }
    }
  });
  // Recount from scratch to avoid double-counting
  const counts = {};
  cards.forEach(card => {
    const v = card.dataset.voted;
    if (v) counts[v] = (counts[v] || 0) + 1;
  });
  Object.entries(counts).forEach(([name, count]) => {
    const el = document.getElementById(`ftc-cnt-${epNum}-${name.replace(/\s+/g, '_')}`);
    if (el) el.textContent = count;
  });
  const finalEl = document.getElementById(`ftc-final-${epNum}`);
  if (finalEl) finalEl.style.display = 'block';
  const btn = document.getElementById(`ftc-btn-next-${epNum}`);
  if (btn) btn.disabled = true;
  _ftcState[epNum].revealed = cards.length;
  _ftcHighlightWinner(epNum);
}

// Highlight winner's vote counter + cards in gold AFTER all votes revealed
export function _ftcHighlightWinner(epNum) {
  // Find all finalist counters and highlight the winner
  document.querySelectorAll(`[id^="ftc-cnt-${epNum}-"]`).forEach(el => {
    if (el.dataset.finalist === el.dataset.winner) {
      el.style.color = '#e3b341';
      el.style.textShadow = '0 0 10px rgba(227,179,65,0.3)';
    }
  });
  // Color winner vote cards gold, loser cards stay neutral
  document.querySelectorAll(`#ftc-cards-${epNum} .ftc-card`).forEach(card => {
    if (card.dataset.isWinnerVote === 'true') {
      card.style.borderColor = 'rgba(227,179,65,0.3)';
      card.style.background = 'rgba(227,179,65,0.03)';
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// VP ATMOSPHERIC PARTICLES
// ══════════════════════════════════════════════════════════════════════

export const _vpa = { canvas:null, ctx:null, particles:[], animId:null, profile:null, running:false,
  noMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches };

export const _vpaProfiles = {
  embers:         { count:50, colors:['#e8873a','#f0c040','#c45a1a','#ff6b2b'], size:[1.5,4], vx:[-0.3,0.3], vy:[-1.2,-0.3], life:[60,150], glow:true, opacity:[0.2,0.6], spawnY:'bottom' },
  'embers-subtle':{ count:25, colors:['#e8873a','#f0c040','#c45a1a'],          size:[1,3],   vx:[-0.2,0.2], vy:[-0.8,-0.2], life:[80,180], glow:true, opacity:[0.15,0.4], spawnY:'bottom' },
  slasher:        { count:30, colors:['#2d333b','#444c56','#1c2128','rgba(218,54,51,0.15)'], size:[2,6], vx:[-0.15,0.15], vy:[-0.3,0.1], life:[120,250], glow:false, opacity:[0.08,0.2], spawnY:'any' },
};

export function _vpaScreenProfile(screenId) {
  if (screenId === 'tribal' || screenId?.startsWith('tribal-')) return 'embers';
  if (screenId === 'ftc') return 'embers';
  if (screenId === 'votes' || screenId?.startsWith('votes-')) return 'embers-subtle';
  if (screenId === 'jury-vote' || screenId === 'jury-votes') return 'embers-subtle';
  if (screenId === 'grand-challenge' || screenId === 'final-cut' || screenId === 'benches') return 'embers-subtle';
  // Slasher Night: fog/mist on dark screens, clear on immunity (dawn breaks)
  if (screenId === 'slasher-announce' || screenId === 'slasher-rounds' || screenId === 'slasher-showdown' || screenId === 'slasher-elimination' || screenId === 'slasher-leaderboard') return 'slasher';
  return null;
}

export function _vpaSpawn(prof, canvas) {
  const p = _vpaProfiles[prof];
  const w = canvas.width, h = canvas.height;
  let y = Math.random() * h;
  if (p.spawnY === 'bottom') y = h - Math.random() * h * 0.2;
  else if (p.spawnY === 'top') y = Math.random() * h * 0.15;
  return {
    x: Math.random() * w, y,
    vx: p.vx[0] + Math.random() * (p.vx[1] - p.vx[0]),
    vy: p.vy[0] + Math.random() * (p.vy[1] - p.vy[0]),
    sz: p.size[0] + Math.random() * (p.size[1] - p.size[0]),
    color: p.colors[Math.floor(Math.random() * p.colors.length)],
    life: 0,
    maxLife: p.life[0] + Math.random() * (p.life[1] - p.life[0]),
    alpha: p.opacity[0] + Math.random() * (p.opacity[1] - p.opacity[0]),
    angle: Math.random() * Math.PI * 2,
    spin: p.confetti ? (Math.random() - 0.5) * 0.1 : 0,
  };
}

export function _vpaTick() {
  const { canvas, ctx, particles } = _vpa;
  const profName = _vpa.profile;
  const prof = profName ? _vpaProfiles[profName] : null;
  if (!canvas || !ctx) return;
  if (!prof) { _vpa.animId = requestAnimationFrame(_vpaTick); return; }
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Spawn up to target count
  while (particles.length < prof.count) {
    particles.push(_vpaSpawn(profName, canvas));
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life++;
    pt.x += pt.vx;
    pt.y += pt.vy;
    if (prof.gravity) pt.vy += prof.gravity;
    if (pt.spin) pt.angle += pt.spin;

    const r = pt.life / pt.maxLife;
    let a = pt.alpha;
    if (r < 0.2) a *= r / 0.2;
    else if (r > 0.7) a *= (1 - r) / 0.3;
    if (prof.pulse) a *= 0.5 + 0.5 * Math.sin(pt.life * 0.08 + pt.x * 0.01);

    if (pt.life >= pt.maxLife || pt.y < -20 || pt.y > h + 20 || pt.x < -20 || pt.x > w + 20) {
      particles.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = a;
    if (prof.confetti) {
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.angle);
      ctx.fillStyle = pt.color;
      ctx.fillRect(-pt.sz / 2, -pt.sz * 0.2, pt.sz, pt.sz * 0.4);
      ctx.restore();
    } else {
      if (prof.glow) { ctx.shadowBlur = pt.sz * 3; ctx.shadowColor = pt.color; }
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.sz, 0, Math.PI * 2);
      ctx.fill();
      if (prof.glow) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
    }
  }
  ctx.globalAlpha = 1;
  _vpa.animId = requestAnimationFrame(_vpaTick);
}

export function _vpaResize() {
  const c = _vpa.canvas;
  if (!c) return;
  const vp = document.getElementById('visual-player');
  if (!vp) return;
  const r = vp.getBoundingClientRect();
  c.style.width = (r.width - 172) + 'px';
  c.style.height = (r.height - 46) + 'px';
  c.width = r.width - 172;
  c.height = r.height - 46;
}

export function vpStartParticles() {
  if (_vpa.noMotion) return;
  const vp = document.getElementById('visual-player');
  if (!vp) return;
  let c = document.getElementById('vp-particle-canvas');
  if (!c) { c = document.createElement('canvas'); c.id = 'vp-particle-canvas'; vp.appendChild(c); }
  _vpa.canvas = c;
  _vpa.ctx = c.getContext('2d');
  _vpaResize();
  _vpa.running = true;
  vpUpdateParticleProfile();
  if (!_vpa.animId) _vpaTick();
}

export function vpStopParticles() {
  if (_vpa.animId) { cancelAnimationFrame(_vpa.animId); _vpa.animId = null; }
  _vpa.particles = [];
  _vpa.running = false;
  if (_vpa.canvas && _vpa.ctx) _vpa.ctx.clearRect(0, 0, _vpa.canvas.width, _vpa.canvas.height);
}

export function vpUpdateParticleProfile() {
  if (!_vpa.running) return;
  const cur = vpScreens[vpCurrentScreen];
  if (!cur) return;
  const next = _vpaScreenProfile(cur.id);
  if (next !== _vpa.profile) {
    _vpa.profile = next;
    _vpa.particles = [];
    if (_vpa.canvas && _vpa.ctx) _vpa.ctx.clearRect(0, 0, _vpa.canvas.width, _vpa.canvas.height);
  }
}

window.addEventListener('resize', () => { if (_vpa.running) _vpaResize(); });
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
  _vpa.noMotion = e.matches;
  if (e.matches) vpStopParticles();
});

export function renderVPScreen() {
  const content  = document.getElementById('vp-screen-content');
  const prevBtn  = document.getElementById('vp-prev-btn');
  const nextBtn  = document.getElementById('vp-next-btn');
  const epLabel  = document.getElementById('vp-nav-ep-label');
  const sidebar  = document.getElementById('vp-sidebar');
  const cur = vpScreens[vpCurrentScreen];

  // Nav bar
  prevBtn.disabled = vpCurrentScreen === 0;
  const isLast = vpCurrentScreen === vpScreens.length - 1;
  nextBtn.textContent = isLast ? 'Finish' : 'Continue →';
  nextBtn.className = 'rp-btn' + (isLast ? ' close' : '');
  nextBtn.onclick = isLast ? closeVisualPlayer : vpNext;
  if (epLabel) epLabel.innerHTML = `EP ${vpEpNum}  &mdash;  ${cur?.label || ''}`;

  // Sidebar
  if (sidebar) {
    sidebar.innerHTML = `<div class="rp-sidebar-ep">Episode ${vpEpNum}</div>` +
      vpScreens.map((s, i) =>
        `<button class="rp-sidebar-item ${i === vpCurrentScreen ? 'active' : i < vpCurrentScreen ? 'done' : ''}"
                 onclick="vpGoTo(${i})">${s.label}</button>`
      ).join('');
  }

  // Content — innerHTML is fully rebuilt each navigation, so any in-progress
  // vote reveal state is now stale. Clear it so reveals start fresh.
  Object.keys(_tvState).forEach(k => delete _tvState[k]);
  content.innerHTML = cur.html;
  document.querySelector('.rp-main').scrollTop = 0;
  vpUpdateParticleProfile();
  if (cur.id === 'votes' || cur.id?.startsWith('votes-')) {
    vpAnimateTallies('tv-results-' + vpEpNum);
  }
  // Slasher leaderboard: animate score bars + numbers
  if (cur.id === 'slasher-leaderboard') {
    const _slLb = document.getElementById('sl-leaderboard-' + vpEpNum);
    if (_slLb) {
      _slLb.querySelectorAll('.sl-score-bar').forEach(bar => { bar.style.width = bar.dataset.targetWidth; });
      vpAnimateTallies('sl-leaderboard-' + vpEpNum);
    }
  }
  // Fire torch snuff animation on post-twist screen (Second Life) or slasher elimination
  if (cur.id === 'post-twist' || cur.id === 'slasher-elimination') {
    const _slSnuff = document.querySelector(`#torch-snuff-sl-${vpEpNum} .torch-snuffed`);
    if (_slSnuff) torchSnuffFx(_slSnuff);
  }
}

export function openVisualPlayer(epNum) {
  // Fall back to most recent episode if called with null (e.g. after page reload)
  const num = epNum ?? gs?.episodeHistory?.slice(-1)[0]?.num;
  const epRecord = gs?.episodeHistory?.find(e => e.num === num);
  if (!epRecord) { alert('No episode data. Simulate an episode first.'); return; }
  vpCurrentScreen = 0;
  buildVPScreens(epRecord);
  document.getElementById('visual-player').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  renderVPScreen();
  vpStartParticles();
}

// ── VP Search ──
export let _vpSearchMatches = [];
export let _vpSearchIdx = -1;

export function vpToggleSearch() {
  const bar = document.getElementById('vp-search-bar');
  if (!bar) return;
  const visible = bar.style.display !== 'none';
  bar.style.display = visible ? 'none' : 'block';
  if (!visible) {
    const input = document.getElementById('vp-search-input');
    if (input) { input.value = ''; input.focus(); }
    vpSearchClear();
  } else {
    vpSearchClear();
  }
}

export function vpSearchClear() {
  const content = document.getElementById('vp-screen-content');
  if (!content) return;
  content.querySelectorAll('.vp-search-hl').forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
  _vpSearchMatches = [];
  _vpSearchIdx = -1;
  const counter = document.getElementById('vp-search-count');
  if (counter) counter.textContent = '';
}

export function vpSearchHighlight(query) {
  vpSearchClear();
  if (!query || query.length < 2) return;
  const content = document.getElementById('vp-screen-content');
  if (!content) return;

  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  const lowerQ = query.toLowerCase();
  textNodes.forEach(node => {
    const text = node.textContent;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(lowerQ);
    if (idx === -1) return;
    // Split and wrap match
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    const span = document.createElement('span');
    span.className = 'vp-search-hl';
    span.style.cssText = 'background:#f0a50066;color:#fff;border-radius:2px;padding:0 1px';
    span.textContent = match;
    const parent = node.parentNode;
    if (before) parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(span, node);
    if (after) parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
  });

  _vpSearchMatches = [...content.querySelectorAll('.vp-search-hl')];
  _vpSearchIdx = -1;
  const counter = document.getElementById('vp-search-count');
  if (counter) counter.textContent = _vpSearchMatches.length ? `${_vpSearchMatches.length} found` : 'no matches';
  if (_vpSearchMatches.length) vpSearchNext();
}

export function vpSearchNext() {
  if (!_vpSearchMatches.length) return;
  // Remove active highlight from previous
  if (_vpSearchIdx >= 0 && _vpSearchMatches[_vpSearchIdx]) {
    _vpSearchMatches[_vpSearchIdx].style.background = '#f0a50066';
  }
  _vpSearchIdx = (_vpSearchIdx + 1) % _vpSearchMatches.length;
  const el = _vpSearchMatches[_vpSearchIdx];
  el.style.background = '#f0a500cc';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const counter = document.getElementById('vp-search-count');
  if (counter) counter.textContent = `${_vpSearchIdx + 1}/${_vpSearchMatches.length}`;
}

export function vpSearchPrev() {
  if (!_vpSearchMatches.length) return;
  if (_vpSearchIdx >= 0 && _vpSearchMatches[_vpSearchIdx]) {
    _vpSearchMatches[_vpSearchIdx].style.background = '#f0a50066';
  }
  _vpSearchIdx = (_vpSearchIdx - 1 + _vpSearchMatches.length) % _vpSearchMatches.length;
  const el = _vpSearchMatches[_vpSearchIdx];
  el.style.background = '#f0a500cc';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const counter = document.getElementById('vp-search-count');
  if (counter) counter.textContent = `${_vpSearchIdx + 1}/${_vpSearchMatches.length}`;
}

// Ctrl+F override inside VP
document.addEventListener('keydown', e => {
  const vp = document.getElementById('visual-player');
  if (!vp || vp.style.display === 'none') return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    vpToggleSearch();
  }
});

export function closeVisualPlayer() {
  vpStopParticles();
  document.getElementById('visual-player').style.display = 'none';
  document.body.style.overflow = '';
}

export function vpNext() {
  if (vpCurrentScreen < vpScreens.length - 1) { vpCurrentScreen++; renderVPScreen(); }
}
export function vpPrev() {
  if (vpCurrentScreen > 0) { vpCurrentScreen--; renderVPScreen(); }
}
