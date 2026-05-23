// enemies-patch.js — Galaxy Shooter enhancement module
// Drop into a <script> tag after your main game script.

// ---------------------------------------------------------------------------
// 1. ENEMY MOVEMENT PATTERNS
// ---------------------------------------------------------------------------

const EnemyPatterns = {
  /**
   * Oscillate the enemy left and right using a sine wave.
   * @param {Object} enemy  - must have x, baseX, amplitude, frequency
   * @param {number} time   - elapsed game time in seconds
   */
  sineWave(enemy, time) {
    const amplitude = enemy.amplitude ?? 80;
    const frequency = enemy.frequency ?? 1.2;
    enemy.x = (enemy.baseX ?? enemy.x) + Math.sin(time * frequency) * amplitude;
  },

  /**
   * Enemy periodically locks on to the player and dives straight at them.
   * @param {Object} enemy
   * @param {number} playerX
   * @param {number} playerY
   */
  diveBomb(enemy, playerX, playerY) {
    const DIVE_SPEED   = 6;
    const RETURN_SPEED = 2;

    // Initialise state on first call
    if (enemy.diveState === undefined) {
      enemy.diveState   = 'waiting'; // waiting | diving | returning
      enemy.diveTimer   = 0;
      enemy.diveCooldown = 2 + Math.random() * 2; // random wait before first dive
      enemy.diveTargetX = playerX;
      enemy.diveTargetY = playerY;
      enemy.baseX       = enemy.x;
      enemy.baseY       = enemy.y;
    }

    if (enemy.diveState === 'waiting') {
      enemy.diveTimer += 1 / 60;
      if (enemy.diveTimer >= enemy.diveCooldown) {
        enemy.diveState   = 'diving';
        enemy.diveTargetX = playerX;
        enemy.diveTargetY = playerY;
        enemy.diveTimer   = 0;
      }
    } else if (enemy.diveState === 'diving') {
      const dx   = enemy.diveTargetX - enemy.x;
      const dy   = enemy.diveTargetY - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < DIVE_SPEED) {
        enemy.diveState = 'returning';
      } else {
        enemy.x += (dx / dist) * DIVE_SPEED;
        enemy.y += (dy / dist) * DIVE_SPEED;
      }
    } else if (enemy.diveState === 'returning') {
      const dx   = enemy.baseX - enemy.x;
      const dy   = enemy.baseY - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < RETURN_SPEED) {
        enemy.x            = enemy.baseX;
        enemy.y            = enemy.baseY;
        enemy.diveState    = 'waiting';
        enemy.diveTimer    = 0;
        enemy.diveCooldown = 2 + Math.random() * 3;
      } else {
        enemy.x += (dx / dist) * RETURN_SPEED;
        enemy.y += (dy / dist) * RETURN_SPEED;
      }
    }
  },

  /**
   * Place enemy on a rotating circular formation around a shared centre.
   * @param {Object} enemy  - must have formationCenterX, formationCenterY, formationRadius
   * @param {number} index  - position index within the formation
   * @param {number} time   - elapsed game time in seconds
   */
  formation(enemy, index, time) {
    const cx      = enemy.formationCenterX ?? 400;
    const cy      = enemy.formationCenterY ?? 200;
    const radius  = enemy.formationRadius  ?? 120;
    const count   = enemy.formationCount   ?? 6;
    const speed   = enemy.formationSpeed   ?? 0.8; // radians per second
    const offset  = (2 * Math.PI / count) * index;
    const angle   = time * speed + offset;

    enemy.x = cx + Math.cos(angle) * radius;
    enemy.y = cy + Math.sin(angle) * radius;
  },

  /**
   * Sharp zigzag: enemy flips horizontal direction every fixed interval.
   * @param {Object} enemy  - must have x, speed (optional)
   * @param {number} time   - elapsed game time in seconds
   */
  zigzag(enemy, time) {
    const stepWidth  = enemy.zigzagWidth    ?? 60;  // pixels per half-cycle
    const stepSpeed  = enemy.zigzagSpeed    ?? 4;   // pixels per frame
    const period     = enemy.zigzagPeriod   ?? 0.6; // seconds per direction flip

    if (enemy.zigzagDir === undefined) {
      enemy.zigzagDir     = 1;
      enemy.zigzagTimer   = 0;
      enemy.zigzagOriginX = enemy.x;
    }

    enemy.zigzagTimer += 1 / 60;
    if (enemy.zigzagTimer >= period) {
      enemy.zigzagDir    *= -1;
      enemy.zigzagTimer   = 0;
    }

    enemy.x += enemy.zigzagDir * stepSpeed;

    // Soft clamp around origin so the pattern doesn't drift off-screen
    const delta = enemy.x - enemy.zigzagOriginX;
    if (Math.abs(delta) > stepWidth) {
      enemy.x = enemy.zigzagOriginX + Math.sign(delta) * stepWidth;
      enemy.zigzagDir *= -1;
    }
  }
};


// ---------------------------------------------------------------------------
// 2. BOSS AI
// ---------------------------------------------------------------------------

class BossAI {
  /**
   * @param {number} wave - current wave number, used to scale stats
   */
  constructor(wave) {
    const scale     = 1 + (wave - 1) * 0.25;
    this.wave       = wave;
    this.maxHP      = Math.floor(200 * scale);
    this.hp         = this.maxHP;
    this.speed      = 120 * scale;            // pixels per second
    this.width      = 90;
    this.height     = 60;
    this.x          = 400;
    this.y          = 80;

    // Movement phase tracking
    this.phase        = 'patrol';             // patrol | aggressive | enraged
    this.patrolDir    = 1;
    this.patrolTimer  = 0;

    // Shooting state
    this.shootTimer   = 0;
    this.shootCooldown = Math.max(0.5, 2.0 - wave * 0.15);

    // Visual effect: engine pulse
    this.enginePulse  = 0;

    // Enrage FX
    this.enrageFlash  = 0;
  }

  /**
   * Update boss logic each frame.
   * @param {number} dt      - delta time in seconds
   * @param {number} playerX - player's current X position
   */
  update(dt, playerX) {
    const hpRatio = this.hp / this.maxHP;

    // Determine phase
    if (hpRatio <= 0.30) {
      this.phase = 'enraged';
    } else if (hpRatio <= 0.60) {
      this.phase = 'aggressive';
    } else {
      this.phase = 'patrol';
    }

    // Movement
    if (this.phase === 'patrol') {
      // Simple left-right patrol
      this.x += this.patrolDir * this.speed * 0.5 * dt;
      if (this.x > 700 || this.x < 100) this.patrolDir *= -1;
    } else if (this.phase === 'aggressive') {
      // Track the player horizontally
      const diff = playerX - this.x;
      const step = this.speed * dt;
      this.x += Math.abs(diff) < step ? diff : Math.sign(diff) * step;
      // Bob vertically
      this.y = 80 + Math.sin(Date.now() / 500) * 20;
    } else if (this.phase === 'enraged') {
      // Fast horizontal tracking + stronger vertical bob
      const diff = playerX - this.x;
      const step = this.speed * 1.8 * dt;
      this.x += Math.abs(diff) < step ? diff : Math.sign(diff) * step;
      this.y = 70 + Math.sin(Date.now() / 250) * 30;
      this.enrageFlash = (this.enrageFlash + dt * 6) % (Math.PI * 2);
    }

    // Engine pulse animation
    this.enginePulse = (this.enginePulse + dt * 4) % (Math.PI * 2);

    // Shooting cooldown
    this.shootTimer += dt;
  }

  /**
   * Attempt to fire. Returns an array of bullet objects when ready, else [].
   * Each bullet: { x, y, vx, vy, radius, damage, color }
   */
  shoot() {
    if (this.shootTimer < this.shootCooldown) return [];
    this.shootTimer = 0;

    const bullets = [];
    const cx = this.x;
    const cy = this.y + this.height / 2;

    if (this.phase === 'patrol') {
      // Normal spread: 3-way fan
      [-0.3, 0, 0.3].forEach(angle => {
        bullets.push({
          x: cx, y: cy,
          vx: Math.sin(angle) * 220,
          vy: Math.cos(angle) * 220,
          radius: 5, damage: 10, color: '#ff4444'
        });
      });
    } else if (this.phase === 'aggressive') {
      // 5-way spread + aimed shot toward player
      for (let i = -2; i <= 2; i++) {
        const angle = i * 0.25;
        bullets.push({
          x: cx, y: cy,
          vx: Math.sin(angle) * 250,
          vy: Math.cos(angle) * 250,
          radius: 5, damage: 10, color: '#ff8800'
        });
      }
    } else {
      // Enraged: circular burst of 12 bullets
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        bullets.push({
          x: cx, y: cy,
          vx: Math.sin(angle) * 280,
          vy: Math.cos(angle) * 280,
          radius: 6, damage: 15, color: '#ff00ff'
        });
      }
    }

    return bullets;
  }

  /**
   * Draw the boss onto a canvas 2D context.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const x  = this.x;
    const y  = this.y;
    const hw = this.width  / 2;
    const hh = this.height / 2;

    ctx.save();
    ctx.translate(x, y);

    // Enrage tint overlay
    if (this.phase === 'enraged') {
      const alpha = 0.18 + 0.12 * Math.sin(this.enrageFlash);
      ctx.shadowColor = `rgba(255,0,128,${alpha * 3})`;
      ctx.shadowBlur  = 30;
    }

    // --- Central body ---
    const bodyGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    bodyGrad.addColorStop(0, this.phase === 'enraged' ? '#ff3366' : '#4466cc');
    bodyGrad.addColorStop(1, this.phase === 'enraged' ? '#990033' : '#112255');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(0, -hh);          // nose
    ctx.lineTo(hw * 0.6, hh);
    ctx.lineTo(-hw * 0.6, hh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // --- 4 wing struts ---
    const strutColor  = this.phase === 'enraged' ? '#ff6688' : '#2255aa';
    const strutAccent = this.phase === 'enraged' ? '#ff9900' : '#66aaff';
    const struts = [
      { x1: -hw * 0.4, y1: 0, x2: -hw * 1.1, y2: hh * 0.3 },
      { x1: -hw * 0.4, y1: 0, x2: -hw * 1.1, y2: -hh * 0.3 },
      { x1:  hw * 0.4, y1: 0, x2:  hw * 1.1, y2: hh * 0.3 },
      { x1:  hw * 0.4, y1: 0, x2:  hw * 1.1, y2: -hh * 0.3 }
    ];

    struts.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.strokeStyle = strutColor;
      ctx.lineWidth   = 5;
      ctx.stroke();
      ctx.strokeStyle = strutAccent;
      ctx.lineWidth   = 2;
      ctx.stroke();
    });

    // --- Engine glow (bottom) ---
    const pulse  = 0.7 + 0.3 * Math.sin(this.enginePulse);
    const glow   = ctx.createRadialGradient(0, hh, 0, 0, hh, 20 * pulse);
    glow.addColorStop(0, this.phase === 'enraged' ? 'rgba(255,60,0,0.9)' : 'rgba(80,160,255,0.9)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, hh, 20 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- HP bar (drawn in screen space, above the boss) ---
    const barW   = 120;
    const barH   = 8;
    const barX   = x - barW / 2;
    const barY   = y - hh - 18;
    const ratio  = Math.max(0, this.hp / this.maxHP);

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    const hpColor = ratio > 0.6 ? '#33ff66' : ratio > 0.3 ? '#ffaa00' : '#ff2222';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * ratio, barH);

    ctx.strokeStyle = '#aaa';
    ctx.lineWidth   = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // HP label
    ctx.fillStyle    = '#fff';
    ctx.font         = 'bold 10px monospace';
    ctx.textAlign    = 'center';
    ctx.fillText(`BOSS  ${this.hp} / ${this.maxHP}`, x, barY - 3);
  }

  /**
   * Apply damage to the boss.
   * @param  {number} amount
   * @returns {boolean} true if the boss is now dead
   */
  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }
}


// ---------------------------------------------------------------------------
// 3. COMBO SYSTEM
// ---------------------------------------------------------------------------

class ComboSystem {
  constructor() {
    this.count        = 0;   // consecutive kills
    this.timer        = 0;   // seconds remaining before combo resets
    this.comboTimeout = 2.5; // seconds between kills to maintain combo

    // Animation state for the combo display
    this._displayScale  = 0;
    this._displayAlpha  = 0;
    this._displayText   = '';
    this._popTimer      = 0;
    this._popDuration   = 0.35; // seconds for the pop-in
    this._fadeDuration  = 0.6;
  }

  /**
   * Register a kill and return the actual awarded points.
   * @param  {number} basePoints
   * @returns {number}
   */
  registerKill(basePoints) {
    this.count += 1;
    this.timer  = this.comboTimeout;

    const multiplier  = this.getMultiplier();
    const awarded     = basePoints * multiplier;

    // Trigger pop animation
    this._displayText   = multiplier > 1
      ? `x${multiplier}  COMBO!`
      : `+${awarded}`;
    this._popTimer      = 0;
    this._displayScale  = 0;
    this._displayAlpha  = 1;

    return awarded;
  }

  /**
   * Update combo decay timer. Call every frame with delta time in seconds.
   * @param {number} dt
   */
  update(dt) {
    if (this.count > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.count = 0;
        this.timer = 0;
      }
    }

    // Advance pop animation
    if (this._popTimer < this._popDuration + this._fadeDuration) {
      this._popTimer += dt;
    }

    if (this._popTimer <= this._popDuration) {
      // Ease-out scale from 0 → 1.4, then settle to 1.0
      const t = this._popTimer / this._popDuration;
      this._displayScale = 1.4 - 0.4 * t; // overshoots then settles
      this._displayAlpha = 1;
    } else {
      // Fade out
      const fadeElapsed = this._popTimer - this._popDuration;
      this._displayAlpha = Math.max(0, 1 - fadeElapsed / this._fadeDuration);
      this._displayScale = 1.0;
    }
  }

  /**
   * Draw the combo indicator near the top of the screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   */
  draw(ctx, canvasWidth) {
    if (this._displayAlpha <= 0 || !this._displayText) return;

    const cx = canvasWidth / 2;
    const cy = 60;

    ctx.save();
    ctx.globalAlpha = this._displayAlpha;
    ctx.translate(cx, cy);
    ctx.scale(this._displayScale, this._displayScale);

    // Shadow for legibility
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur  = 8;

    // Pick colour based on multiplier level
    const mult = this.getMultiplier();
    const colors = { 1: '#ffffff', 2: '#ffee44', 4: '#ff8800', 8: '#ff3366', 16: '#cc00ff' };
    ctx.fillStyle    = colors[mult] ?? '#ffffff';
    ctx.font         = `bold ${this.count >= 8 ? 36 : 28}px 'Arial Black', Arial, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._displayText, 0, 0);

    // Thin white outline
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth   = 1;
    ctx.strokeText(this._displayText, 0, 0);

    ctx.restore();
  }

  /**
   * Returns the current score multiplier based on combo count.
   * Steps: 1 → 2 → 4 → 8 → 16
   * @returns {number}
   */
  getMultiplier() {
    if (this.count >= 16) return 16;
    if (this.count >= 8)  return 8;
    if (this.count >= 4)  return 4;
    if (this.count >= 2)  return 2;
    return 1;
  }
}


// ---------------------------------------------------------------------------
// 4. WAVE MANAGER
// ---------------------------------------------------------------------------

class WaveManager {
  constructor() {
    this.currentWave = 0; // incremented by nextWave()
  }

  /**
   * Advance to the next wave and return an array of enemy spawn configs.
   * Each config: { type, x, y, pattern, patternParams, hp, points, delay }
   * @returns {Array<Object>}
   */
  nextWave() {
    this.currentWave += 1;
    const wave = this.currentWave;
    const diff = this.getDifficulty();

    if (this.isBossWave()) {
      // Boss wave: one boss + a small escort
      const spawns = [
        {
          type:        'boss',
          x:           400,
          y:           -60,
          pattern:     null,
          hp:          200 + wave * 50,
          points:      500 * wave,
          delay:       0,
          bossWave:    wave
        }
      ];
      const escortCount = Math.min(4, Math.floor(wave / 3));
      for (let i = 0; i < escortCount; i++) {
        spawns.push({
          type:    'escort',
          x:       150 + i * 160,
          y:       -30 - i * 20,
          pattern: 'formation',
          patternParams: {
            formationCenterX: 400,
            formationCenterY: 160,
            formationRadius:  100,
            formationCount:   escortCount,
            formationSpeed:   0.6 * diff.speed
          },
          hp:      20 + wave * 5,
          points:  100,
          delay:   1.5 + i * 0.3
        });
      }
      return spawns;
    }

    // Regular wave — mix of patterns based on wave number
    const spawns = [];
    const baseCount = 5 + wave * 2;

    for (let i = 0; i < baseCount; i++) {
      const col     = i % 5;
      const row     = Math.floor(i / 5);
      const x       = 100 + col * 150;
      const y       = -40 - row * 70;
      const pattern = this._pickPattern(wave, i);

      spawns.push({
        type:          'grunt',
        x,
        y,
        pattern,
        patternParams: this._patternParams(pattern, x, y, i, wave, diff),
        hp:            10 + wave * 3,
        points:        50 + wave * 10,
        delay:         i * 0.18            // stagger spawn
      });
    }

    return spawns;
  }

  /**
   * Returns true when the current wave is a boss wave (every 3rd wave).
   * @returns {boolean}
   */
  isBossWave() {
    return this.currentWave > 0 && this.currentWave % 3 === 0;
  }

  /**
   * Returns speed and fireRate multipliers for the current wave.
   * @returns {{ speed: number, fireRate: number }}
   */
  getDifficulty() {
    const wave = this.currentWave;
    // Speed grows quickly early, then tapers off; fire rate scales linearly
    const speed    = 1 + Math.log2(1 + wave) * 0.3;
    const fireRate = 1 + wave * 0.12;
    return { speed, fireRate };
  }

  // --- Private helpers ---

  /** Choose a pattern based on wave progression */
  _pickPattern(wave, index) {
    if (wave === 1) return 'sineWave'; // Tutorial wave: easy oscillation

    const patterns = ['sineWave', 'zigzag'];
    if (wave >= 2) patterns.push('diveBomb');
    if (wave >= 4) patterns.push('formation');

    // Alternate patterns across the formation for variety
    return patterns[index % patterns.length];
  }

  /** Build default patternParams for a given pattern type */
  _patternParams(pattern, x, y, index, wave, diff) {
    switch (pattern) {
      case 'sineWave':
        return {
          baseX:     x,
          amplitude: 60 + wave * 4,
          frequency: 1.0 + index * 0.05
        };
      case 'zigzag':
        return {
          zigzagWidth:  50 + wave * 3,
          zigzagSpeed:  3 * diff.speed,
          zigzagPeriod: Math.max(0.25, 0.7 - wave * 0.03)
        };
      case 'diveBomb':
        return {
          baseX:        x,
          baseY:        y,
          diveCooldown: Math.max(1, 3 - wave * 0.2)
        };
      case 'formation':
        return {
          formationCenterX: 400,
          formationCenterY: 180,
          formationRadius:  110,
          formationCount:   6,
          formationSpeed:   0.7 * diff.speed
        };
      default:
        return {};
    }
  }
}
