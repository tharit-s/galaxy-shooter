// Galaxy Shooter Enhancement Module - polish-patch.js
// Self-contained particle system, screen shake, audio engine, and power-up manager.

// ─────────────────────────────────────────────────────────────────────────────
// 1. PARTICLE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

class Particle {
  constructor(x, y, vx, vy, color, size, life, gravity = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.gravity = gravity;
    this.alpha = 1;
  }

  update(dt) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 3;
      const life = 0.5 + Math.random() * 1.0;
      const gravity = 0.05 + Math.random() * 0.05;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, gravity));
    }
  }

  spawnTrail(x, y, color, vx, vy) {
    const spreadVx = vx * 0.1 + (Math.random() - 0.5) * 0.5;
    const spreadVy = vy * 0.1 + (Math.random() - 0.5) * 0.5;
    const size = 1 + Math.random() * 1.5;
    const life = 0.1;
    this.particles.push(new Particle(x, y, spreadVx, spreadVy, color, size, life, 0));
  }

  spawnPickup(x, y, color) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      const vx = Math.cos(angle) * speed * 0.5;
      const vy = -Math.abs(Math.sin(angle) * speed) - 1;
      const size = 1.5 + Math.random() * 2;
      const life = 0.6 + Math.random() * 0.6;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, -0.02));
    }
  }

  spawnBossExplosion(x, y) {
    const colors = ['#ff00ff', '#ff8800', '#ffff00', '#ffffff'];
    const count = 60;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 4 + Math.random() * 6;
      const life = 1.0 + Math.random() * 1.5;
      const gravity = 0.02 + Math.random() * 0.04;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, gravity));
    }
    // Secondary wave for screen-covering effect
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 12;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 4;
      const life = 0.8 + Math.random() * 0.8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 0.01));
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SCREEN SHAKE
// ─────────────────────────────────────────────────────────────────────────────

class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  shake(intensity, duration) {
    // Only override if new shake is stronger
    if (intensity >= this.intensity || this.elapsed >= this.duration) {
      this.intensity = intensity;
      this.duration = duration / 1000; // convert ms to seconds
      this.elapsed = 0;
    }
  }

  update(dt) {
    if (this.elapsed < this.duration) {
      this.elapsed += dt;
      const progress = this.elapsed / this.duration;
      const currentIntensity = this.intensity * (1 - progress); // linear decay
      this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
  }

  reset(ctx) {
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. WEB AUDIO ENGINE
// ─────────────────────────────────────────────────────────────────────────────

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.droneOscillator = null;
    this.droneGain = null;
    this._initialized = false;

    // Attempt to create context immediately; browsers may require user gesture
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._buildGraph();
      this._initialized = true;
    } catch (e) {
      // Will be initialized on first user interaction via resume()
    }
  }

  _buildGraph() {
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  resume() {
    if (!this._initialized) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._buildGraph();
        this._initialized = true;
      } catch (e) {
        return;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _playTone(freq, type, duration, gainValue, freqEnd = null) {
    if (!this._initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 0.01), now + duration);
    }

    gainNode.gain.setValueAtTime(gainValue, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playShoot() {
    this._playTone(880, 'square', 0.08, 0.08);
  }

  playEnemyDeath() {
    this._playTone(400, 'sawtooth', 0.2, 0.3, 150);
  }

  playPlayerHit() {
    if (!this._initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sawtooth noise burst at 150Hz
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const distortion = this.ctx.createWaveShaper();

    // Create distortion curve for noise-like effect
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    distortion.curve = curve;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(distortion);
    distortion.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.31);
  }

  playBossHit() {
    this._playTone(220, 'sine', 0.15, 0.5, 100);
  }

  playPowerUp() {
    if (!this._initialized || !this.ctx) return;
    // C-E-G-C arpeggio (C4=261.63, E4=329.63, G4=392, C5=523.25)
    const notes = [261.63, 329.63, 392.0, 523.25];
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const startTime = now + i * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.11);
    });
  }

  playBossDeath() {
    if (!this._initialized || !this.ctx) return;
    // Dramatic 4-note descending fanfare
    const notes = [
      { freq: 880, freqEnd: 440, duration: 0.3, gain: 0.5, type: 'sawtooth' },
      { freq: 660, freqEnd: 330, duration: 0.3, gain: 0.5, type: 'sawtooth' },
      { freq: 440, freqEnd: 220, duration: 0.4, gain: 0.6, type: 'sawtooth' },
      { freq: 220, freqEnd: 55,  duration: 0.8, gain: 0.7, type: 'sawtooth' },
    ];
    const now = this.ctx.currentTime;
    let offset = 0;
    notes.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const startTime = now + offset;

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(note.freqEnd, 0.01), startTime + note.duration);

      gainNode.gain.setValueAtTime(note.gain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + note.duration + 0.01);

      offset += note.duration * 0.6;
    });
  }

  playLevelUp() {
    if (!this._initialized || !this.ctx) return;
    // Triumphant ascending arpeggio
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const startTime = now + i * 0.08;
      const duration = i === notes.length - 1 ? 0.5 : 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0.35, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    });
  }

  startBackgroundDrone() {
    if (!this._initialized || !this.ctx) return;
    if (this.droneOscillator) return; // already running

    this.droneOscillator = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();

    this.droneOscillator.type = 'sine';
    this.droneOscillator.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.droneGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 2.0);

    this.droneOscillator.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOscillator.start();
  }

  stopBackgroundDrone() {
    if (!this.droneOscillator || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
    this.droneGain.gain.linearRampToValueAtTime(0, now + 1.0);
    this.droneOscillator.stop(now + 1.01);
    this.droneOscillator = null;
    this.droneGain = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POWER-UP MANAGER
// ─────────────────────────────────────────────────────────────────────────────

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'shield' | 'spread' | 'speed'
    this.vy = 2;
    this.rotation = 0;
    this.rotationSpeed = 0.02;
    this.pulseTime = 0;
    this.radius = 16;
    this.collected = false;

    const colorMap = {
      shield: '#4488ff',
      spread: '#ffff00',
      speed:  '#00ff44',
    };
    const labelMap = {
      shield: 'S',
      spread: 'W',
      speed:  'V',
    };
    this.color = colorMap[type] || '#ffffff';
    this.label = labelMap[type] || '?';
  }

  update(dt) {
    this.y += this.vy * dt * 60 * 0.016; // normalize to ~60fps feel at dt=1/60
    this.rotation += this.rotationSpeed;
    this.pulseTime += dt * 3;
  }

  draw(ctx) {
    if (this.collected) return;

    const pulse = 0.5 + 0.5 * Math.sin(this.pulseTime);
    const glowRadius = this.radius + 4 + pulse * 6;
    const glowAlpha = 0.25 + pulse * 0.25;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Outer glow
    const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, glowRadius);
    gradient.addColorStop(0, this.color + 'aa');
    gradient.addColorStop(1, this.color + '00');
    ctx.globalAlpha = glowAlpha;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main circle
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color + '33';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner highlight ring
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
    ctx.strokeStyle = this.color + '88';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${this.radius}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, 0, 0);

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  isOffScreen(canvasHeight) {
    return this.y - this.radius > (canvasHeight || 1000);
  }
}

class PowerUpManager {
  constructor() {
    this.powerUps = [];
    this.types = ['shield', 'spread', 'speed'];
  }

  trySpawn(x, y) {
    if (Math.random() > 0.15) return null;
    const type = this.types[Math.floor(Math.random() * this.types.length)];
    const powerUp = new PowerUp(x, y, type);
    this.powerUps.push(powerUp);
    return powerUp;
  }

  update(dt) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.update(dt);
      if (pu.collected || pu.isOffScreen()) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const pu of this.powerUps) {
      pu.draw(ctx);
    }
  }

  checkCollision(playerBounds) {
    if (!playerBounds) return null;
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      if (pu.collected) continue;

      const puBounds = pu.getBounds();
      const overlapX =
        playerBounds.x < puBounds.x + puBounds.width &&
        playerBounds.x + playerBounds.width > puBounds.x;
      const overlapY =
        playerBounds.y < puBounds.y + puBounds.height &&
        playerBounds.y + playerBounds.height > puBounds.y;

      if (overlapX && overlapY) {
        pu.collected = true;
        this.powerUps.splice(i, 1);
        return pu.type;
      }
    }
    return null;
  }
}
