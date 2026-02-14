import Phaser from 'phaser';
import {
  GAME_W, GAME_H, BG_COLOR,
  SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H,
  FOCAL_X, FOCAL_Y,
  TUNNEL_COLOR, TUNNEL_ACCENT, TUNNEL_ACCENT_EVERY,
  RING_COUNT, RING_SCROLL_SPEED, DEPTH_EASE,
  FAR_W, FAR_H,
  TUNNEL_RIBS_TOP_BOTTOM, TUNNEL_RIBS_LEFT_RIGHT,
  PARTICLE_COLORS, PARTICLE_COVERAGE,
  PARTICLE_MIN_R, PARTICLE_MAX_R,
  PARTICLE_SPAWN_INTERVAL_MS, PARTICLE_DRIFT_SPEED,
  PARTICLE_ANGULAR_SPEED,
  CENTER_GRID_COLS, CENTER_GRID_ROWS,
  CENTER_GRID_COLOR_A, CENTER_GRID_COLOR_B,
  CENTER_GRID_CYCLE_MS, CENTER_GRID_ALPHA,
  PHONE_ZOOM_OUT_MS, PHONE_ZOOM_IN_MS,
} from '../config/constants';

// ── Particle (grow-only, spiral radial drift) ────────────────────
interface Particle {
  angle: number;   // current angle from focal point (radians)
  dist: number;    // current distance from focal point
  radialV: number; // radial outward speed (px/sec)
  angularV: number; // angular speed (rad/sec)
  size: number;
  maxSize: number;
  color: number;
  age: number;
  growDur: number;
}

// ── Near-rect edges (full canvas) ──────────────────────────────────
const NEAR_L = 0;
const NEAR_R = GAME_W;
const NEAR_T = 0;
const NEAR_B = GAME_H;

// ── Far-rect edges (derived once) ──────────────────────────────────
const FAR_L = FOCAL_X - FAR_W / 2;
const FAR_R_EDGE = FOCAL_X + FAR_W / 2;
const FAR_T = FOCAL_Y - FAR_H / 2;
const FAR_B_EDGE = FOCAL_Y + FAR_H / 2;

export class BackgroundScene extends Phaser.Scene {
  private screenGfx!: Phaser.GameObjects.Graphics;
  private phoneSprite!: Phaser.GameObjects.Image;

  private particles: Particle[] = [];
  private isVisible: boolean = false;

  /** Whether the phone frame is shown (true on start menu, false once "inside") */
  private phoneFrameVisible: boolean = true;
  /** Whether a geometry mask is currently applied */
  private isMasked: boolean = false;

  /** Zoom-out animation state */
  private isZoomingOut: boolean = false;
  private zoomOutProgress: number = 0;
  private zoomOutCallback: (() => void) | null = null;

  /** Zoom-in animation state */
  private isZoomingIn: boolean = false;
  private zoomInProgress: number = 0;
  private zoomInCallback: (() => void) | null = null;

  private targetArea!: number;
  private spawnTimer: number = 0;
  private ringOffset: number = 0;
  private timeMs: number = 0;

  constructor() {
    super({ key: 'BackgroundScene' });
  }

  create(): void {
    this.targetArea = GAME_W * GAME_H * PARTICLE_COVERAGE;

    // Graphics for all screen-space effects — NO mask
    // The phone frame's opaque bezel handles clipping visually.
    this.screenGfx = this.add.graphics();
    this.screenGfx.setDepth(0);
    this.isMasked = false;

    // Phone frame overlay (on top of everything)
    this.phoneSprite = this.add.image(0, 0, 'start_bg')
      .setOrigin(0, 0)
      .setDepth(10);

    this.screenGfx.setVisible(false);
    this.phoneSprite.setVisible(false);

    this.isVisible = false;
    this.phoneFrameVisible = true;
    this.isZoomingOut = false;
    this.zoomOutProgress = 0;
    this.zoomOutCallback = null;
    this.isZoomingIn = false;
    this.zoomInProgress = 0;
    this.zoomInCallback = null;
    this.particles = [];
    this.spawnTimer = 0;
    this.ringOffset = 0;
    this.timeMs = 0;
  }

  // ── Public API ──────────────────────────────────────────────────────
  setBackgroundVisible(visible: boolean): void {
    this.isVisible = visible;
    this.screenGfx.setVisible(visible);
    this.phoneSprite.setVisible(visible && this.phoneFrameVisible);
    if (!visible) {
      this.particles = [];
      this.spawnTimer = 0;
      this.ringOffset = 0;
      this.timeMs = 0;
      this.isZoomingOut = false;
      this.zoomOutProgress = 0;
      this.zoomOutCallback = null;
      this.isZoomingIn = false;
      this.zoomInProgress = 0;
      this.zoomInCallback = null;
    }
  }

  /** Show or hide the phone frame overlay */
  setPhoneFrameVisible(visible: boolean): void {
    this.phoneFrameVisible = visible;
    this.phoneSprite.setVisible(this.isVisible && visible);
    if (visible) {
      // Reset phone sprite transform
      this.phoneSprite.setScale(1);
      this.phoneSprite.setPosition(0, 0);
      this.phoneSprite.setAlpha(1);
    }
    // Never apply a mask — the phone frame image itself acts as the clip
    if (this.isMasked) {
      this.screenGfx.clearMask();
      this.isMasked = false;
    }
  }

  /**
   * Start the phone zoom-out animation. The phone frame scales up until
   * only the transparent screen area covers the canvas, then calls back.
   */
  startPhoneZoomOut(onComplete?: () => void): void {
    if (this.isZoomingOut || this.isZoomingIn) return;
    this.isZoomingOut = true;
    this.zoomOutProgress = 0;
    this.zoomOutCallback = onComplete || null;
  }

  /**
   * Start the phone zoom-in animation. The phone frame scales from
   * zoomed-out back to normal position.
   */
  startPhoneZoomIn(onComplete?: () => void): void {
    if (this.isZoomingOut || this.isZoomingIn) return;
    // Show the phone sprite at its fully-zoomed-out state first
    this.phoneFrameVisible = true;
    this.phoneSprite.setVisible(this.isVisible);
    this.isZoomingIn = true;
    this.zoomInProgress = 0;
    this.zoomInCallback = onComplete || null;
    // Position at fully zoomed-out state (progress=1 of zoom-out)
    this.applyPhoneZoomTransform(1);
  }

  // ── Update ──────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (!this.isVisible) return;
    const dtSec = delta / 1000;
    this.timeMs += delta;

    // Handle zoom-out animation
    if (this.isZoomingOut) {
      this.zoomOutProgress += delta / PHONE_ZOOM_OUT_MS;
      if (this.zoomOutProgress >= 1) {
        this.zoomOutProgress = 1;
        this.isZoomingOut = false;
        this.setPhoneFrameVisible(false);
        if (this.zoomOutCallback) {
          const cb = this.zoomOutCallback;
          this.zoomOutCallback = null;
          cb();
        }
      }
      const t = 1 - Math.pow(1 - this.zoomOutProgress, 2); // ease-out
      this.applyPhoneZoomTransform(t);
    }

    // Handle zoom-in animation
    if (this.isZoomingIn) {
      this.zoomInProgress += delta / PHONE_ZOOM_IN_MS;
      if (this.zoomInProgress >= 1) {
        this.zoomInProgress = 1;
        this.isZoomingIn = false;
        // Reset to normal
        this.phoneSprite.setScale(1);
        this.phoneSprite.setPosition(0, 0);
        this.phoneSprite.setAlpha(1);
        if (this.zoomInCallback) {
          const cb = this.zoomInCallback;
          this.zoomInCallback = null;
          cb();
        }
      } else {
        // Reverse: go from t=1 (fully zoomed out) to t=0 (normal)
        const eased = Math.pow(this.zoomInProgress, 2); // ease-in
        this.applyPhoneZoomTransform(1 - eased);
      }
    }

    // Scroll tunnel rings OUTWARD (from center toward edges)
    this.ringOffset += RING_SCROLL_SPEED * dtSec;
    if (this.ringOffset >= 1) this.ringOffset -= 1;

    // Advance particles
    this.updateParticles(dtSec);

    // Staggered particle spawning
    this.spawnTimer += delta;
    if (this.spawnTimer >= PARTICLE_SPAWN_INTERVAL_MS) {
      this.spawnTimer -= PARTICLE_SPAWN_INTERVAL_MS;
      this.spawnParticleBatch();
    }

    // ── Draw everything ───────────────────────────────────────────────
    this.screenGfx.clear();
    this.drawSkyFill();
    this.drawScreenPulse();
    this.drawCenterLight();
    this.drawTunnelGrid();
    this.drawParticles();
  }

  // ── Phone zoom transform (shared by zoom-in and zoom-out) ─────────
  private applyPhoneZoomTransform(t: number): void {
    const targetScale = Math.max(GAME_W / SCREEN_W, GAME_H / SCREEN_H);
    const scale = 1 + (targetScale - 1) * t;

    const screenCenterX = SCREEN_X + SCREEN_W / 2;
    const screenCenterY = SCREEN_Y + SCREEN_H / 2;

    this.phoneSprite.setScale(scale);
    this.phoneSprite.setOrigin(0, 0);
    const offsetX = (GAME_W / 2) - screenCenterX * scale;
    const offsetY = (GAME_H / 2) - screenCenterY * scale;
    this.phoneSprite.setPosition(offsetX, offsetY);
    this.phoneSprite.setAlpha(1 - t * 0.8);
  }

  // ── Sky fill ──────────────────────────────────────────────────────
  private drawSkyFill(): void {
    this.screenGfx.fillStyle(BG_COLOR, 1);
    this.screenGfx.fillRect(0, 0, GAME_W, GAME_H);
  }

  // ── Screen pulse + abstract pattern ───────────────────────────────
  private drawScreenPulse(): void {
    const pulse = (Math.sin(this.timeMs * 0.002) + 1) / 2;
    const r = Math.round(0x3C + (0xDB - 0x3C) * pulse);
    const g = Math.round(0xA2 + (0x4C - 0xA2) * pulse);
    const b = Math.round(0xC8 + (0x77 - 0xC8) * pulse);
    const color = (r << 16) | (g << 8) | b;
    this.screenGfx.fillStyle(color, 0.04);
    this.screenGfx.fillRect(0, 0, GAME_W, GAME_H);

    // Sparse scanlines
    for (let y = 0; y < GAME_H; y += 4) {
      const scanAlpha = 0.015 + Math.sin(y * 0.3 + this.timeMs * 0.001) * 0.01;
      if (scanAlpha > 0) {
        this.screenGfx.fillStyle(0x000000, scanAlpha);
        this.screenGfx.fillRect(0, y, GAME_W, 1);
      }
    }
  }

  // ── Center light grid (spiral pattern) ──────────────────────────────
  private drawCenterLight(): void {
    const cellW = FAR_W / CENTER_GRID_COLS;
    const cellH = FAR_H / CENTER_GRID_ROWS;
    const phase = (this.timeMs / CENTER_GRID_CYCLE_MS) * Math.PI * 2;

    // Center of the grid
    const gridCenterCol = (CENTER_GRID_COLS - 1) / 2;
    const gridCenterRow = (CENTER_GRID_ROWS - 1) / 2;

    for (let row = 0; row < CENTER_GRID_ROWS; row++) {
      for (let col = 0; col < CENTER_GRID_COLS; col++) {
        // Spiral pattern: angle from center + distance from center
        const dx = col - gridCenterCol;
        const dy = row - gridCenterRow;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Spiral: color depends on angle + distance, animated by phase
        const spiralVal = angle + dist * 0.8 - phase;
        const wave = (Math.sin(spiralVal) + 1) / 2;

        const rA = (CENTER_GRID_COLOR_A >> 16) & 0xFF;
        const gA = (CENTER_GRID_COLOR_A >> 8) & 0xFF;
        const bA = CENTER_GRID_COLOR_A & 0xFF;
        const rB = (CENTER_GRID_COLOR_B >> 16) & 0xFF;
        const gB = (CENTER_GRID_COLOR_B >> 8) & 0xFF;
        const bB = CENTER_GRID_COLOR_B & 0xFF;

        const cr = Math.round(rA + (rB - rA) * wave);
        const cg = Math.round(gA + (gB - gA) * wave);
        const cb = Math.round(bA + (bB - bA) * wave);
        const color = (cr << 16) | (cg << 8) | cb;

        const cx = (col + 0.5) / CENTER_GRID_COLS;
        const cy = (row + 0.5) / CENTER_GRID_ROWS;
        const edgeDist = Math.max(Math.abs(cx - 0.5), Math.abs(cy - 0.5)) * 2;
        const alpha = CENTER_GRID_ALPHA - edgeDist * 0.2;

        const x = FAR_L + col * cellW;
        const y = FAR_T + row * cellH;

        this.screenGfx.fillStyle(color, alpha);
        this.screenGfx.fillRect(Math.round(x), Math.round(y),
          Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    // Bright glow halo
    const glowLayers = 4;
    for (let i = glowLayers; i >= 1; i--) {
      const expand = i * 4;
      const glowAlpha = 0.06 / i;
      this.screenGfx.fillStyle(0x8888FF, glowAlpha);
      this.screenGfx.fillRect(
        FAR_L - expand, FAR_T - expand,
        FAR_W + expand * 2, FAR_H + expand * 2
      );
    }
  }

  // ── Tunnel ring grid (no imperfections) ───────────────────────────
  private drawTunnelGrid(): void {
    // Draw corner spine lines + wall rib lines
    this.drawSpines();
    this.drawWallRibs();

    // Draw rings from far to near
    for (let i = RING_COUNT; i >= 0; i--) {
      // Outward scroll: subtract offset so rings move from center toward edges
      let rawT = (i - this.ringOffset) / RING_COUNT;
      if (rawT < 0) rawT += 1;

      const te = Math.pow(rawT, DEPTH_EASE);

      const xL = Math.round(NEAR_L + (FAR_L - NEAR_L) * te);
      const xR = Math.round(NEAR_R + (FAR_R_EDGE - NEAR_R) * te);
      const yT = Math.round(NEAR_T + (FAR_T - NEAR_T) * te);
      const yB = Math.round(NEAR_B + (FAR_B_EDGE - NEAR_B) * te);

      const depth = rawT;
      const alpha = 0.50 - depth * 0.42;
      const lineW = 2.5 - depth * 2.0;

      const isAccent = (i % TUNNEL_ACCENT_EVERY === 0);
      const ringColor = isAccent ? TUNNEL_ACCENT : TUNNEL_COLOR;
      const ringAlpha = isAccent ? Math.min(alpha * 1.3, 0.65) : alpha;

      this.screenGfx.lineStyle(Math.max(lineW, 0.5), ringColor, ringAlpha);
      this.screenGfx.beginPath();
      // Draw clean rectangle — no imperfections
      this.screenGfx.moveTo(xL, yT);
      this.screenGfx.lineTo(xR, yT);
      this.screenGfx.lineTo(xR, yB);
      this.screenGfx.lineTo(xL, yB);
      this.screenGfx.closePath();
      this.screenGfx.strokePath();
    }

    // Center floor line
    this.screenGfx.lineStyle(1, TUNNEL_COLOR, 0.25);
    this.screenGfx.beginPath();
    this.screenGfx.moveTo(FOCAL_X, NEAR_B);
    this.screenGfx.lineTo(FOCAL_X, FAR_B_EDGE);
    this.screenGfx.strokePath();
  }

  // ── Tunnel corner spine lines ─────────────────────────────────────
  private drawSpines(): void {
    const spines = [
      [NEAR_L, NEAR_T, FAR_L, FAR_T],
      [NEAR_R, NEAR_T, FAR_R_EDGE, FAR_T],
      [NEAR_L, NEAR_B, FAR_L, FAR_B_EDGE],
      [NEAR_R, NEAR_B, FAR_R_EDGE, FAR_B_EDGE],
    ];

    this.screenGfx.lineStyle(1.5, TUNNEL_COLOR, 0.35);
    for (const [x1, y1, x2, y2] of spines) {
      this.screenGfx.beginPath();
      this.screenGfx.moveTo(x1, y1);
      this.screenGfx.lineTo(x2, y2);
      this.screenGfx.strokePath();
    }
  }

  // ── Wall rib lines ────────────────────────────────────────────────
  private drawWallRibs(): void {
    // Top wall ribs
    for (let i = 1; i <= TUNNEL_RIBS_TOP_BOTTOM; i++) {
      const frac = i / (TUNNEL_RIBS_TOP_BOTTOM + 1);
      const nearX = NEAR_L + frac * (NEAR_R - NEAR_L);
      const farX = FAR_L + frac * (FAR_R_EDGE - FAR_L);
      const spread = Math.abs(frac - 0.5) * 2;
      const alpha = 0.28 - spread * 0.12;
      this.screenGfx.lineStyle(1, TUNNEL_COLOR, alpha);
      this.screenGfx.beginPath();
      this.screenGfx.moveTo(nearX, NEAR_T);
      this.screenGfx.lineTo(farX, FAR_T);
      this.screenGfx.strokePath();
    }

    // Bottom wall ribs
    for (let i = 1; i <= TUNNEL_RIBS_TOP_BOTTOM; i++) {
      const frac = i / (TUNNEL_RIBS_TOP_BOTTOM + 1);
      const nearX = NEAR_L + frac * (NEAR_R - NEAR_L);
      const farX = FAR_L + frac * (FAR_R_EDGE - FAR_L);
      const spread = Math.abs(frac - 0.5) * 2;
      const alpha = 0.28 - spread * 0.12;
      this.screenGfx.lineStyle(1, TUNNEL_COLOR, alpha);
      this.screenGfx.beginPath();
      this.screenGfx.moveTo(nearX, NEAR_B);
      this.screenGfx.lineTo(farX, FAR_B_EDGE);
      this.screenGfx.strokePath();
    }

    // Left wall ribs
    for (let i = 1; i <= TUNNEL_RIBS_LEFT_RIGHT; i++) {
      const frac = i / (TUNNEL_RIBS_LEFT_RIGHT + 1);
      const nearY = NEAR_T + frac * (NEAR_B - NEAR_T);
      const farY = FAR_T + frac * (FAR_B_EDGE - FAR_T);
      const spread = Math.abs(frac - 0.5) * 2;
      const alpha = 0.28 - spread * 0.12;
      this.screenGfx.lineStyle(1, TUNNEL_COLOR, alpha);
      this.screenGfx.beginPath();
      this.screenGfx.moveTo(NEAR_L, nearY);
      this.screenGfx.lineTo(FAR_L, farY);
      this.screenGfx.strokePath();
    }

    // Right wall ribs
    for (let i = 1; i <= TUNNEL_RIBS_LEFT_RIGHT; i++) {
      const frac = i / (TUNNEL_RIBS_LEFT_RIGHT + 1);
      const nearY = NEAR_T + frac * (NEAR_B - NEAR_T);
      const farY = FAR_T + frac * (FAR_B_EDGE - FAR_T);
      const spread = Math.abs(frac - 0.5) * 2;
      const alpha = 0.28 - spread * 0.12;
      this.screenGfx.lineStyle(1, TUNNEL_COLOR, alpha);
      this.screenGfx.beginPath();
      this.screenGfx.moveTo(NEAR_R, nearY);
      this.screenGfx.lineTo(FAR_R_EDGE, farY);
      this.screenGfx.strokePath();
    }
  }

  // ── Particles (grow-only, spiral radial drift) ─────────────────────
  private drawParticles(): void {
    for (const p of this.particles) {
      const t = Math.min(p.age / p.growDur, 1);
      const size = Phaser.Math.Linear(p.size, p.maxSize, t);
      if (size < 0.5) continue;
      const px = FOCAL_X + Math.cos(p.angle) * p.dist;
      const py = FOCAL_Y + Math.sin(p.angle) * p.dist;
      this.screenGfx.fillStyle(p.color, 0.90);
      this.screenGfx.fillRect(px - size / 2, py - size / 2, size, size);
    }
  }

  private updateParticles(dtSec: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dtSec * 1000;
      // Spiral motion: radial outward + angular rotation
      p.dist += p.radialV * dtSec;
      p.angle += p.angularV * dtSec;

      // Compute screen position for bounds check
      const px = FOCAL_X + Math.cos(p.angle) * p.dist;
      const py = FOCAL_Y + Math.sin(p.angle) * p.dist;

      // Die when leaving the full canvas (not the phone screen)
      if (px < -20 || px > GAME_W + 20 ||
          py < -20 || py > GAME_H + 20) {
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnParticleBatch(): void {
    let area = this.currentParticleArea();
    let batchLeft = 5;
    while (area < this.targetArea && batchLeft-- > 0) {
      const p = this.makeParticle();
      this.particles.push(p);
      area += p.maxSize * p.maxSize;
    }
  }

  private currentParticleArea(): number {
    let sum = 0;
    for (const p of this.particles) {
      const t = Math.min(p.age / p.growDur, 1);
      const size = Phaser.Math.Linear(p.size, p.maxSize, t);
      sum += size * size;
    }
    return sum;
  }

  private makeParticle(): Particle {
    const minSize = PARTICLE_MIN_R * 2;
    const maxSize = PARTICLE_MAX_R * 2;

    // Center-biased spawning (triangular distribution around focal point)
    const x = FOCAL_X + (Math.random() + Math.random() - 1) * (GAME_W / 2);
    const y = FOCAL_Y + (Math.random() + Math.random() - 1) * (GAME_H / 2);
    const cx = Phaser.Math.Clamp(x, 0, GAME_W);
    const cy = Phaser.Math.Clamp(y, 0, GAME_H);

    // Compute initial polar coords relative to focal point
    const dx = cx - FOCAL_X;
    const dy = cy - FOCAL_Y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Spiral: radial outward + angular rotation
    // Randomize direction (CW or CCW) for variety
    const angDir = Math.random() < 0.5 ? 1 : -1;
    const angularV = PARTICLE_ANGULAR_SPEED * angDir *
      Phaser.Math.FloatBetween(0.6, 1.4);

    const growDur = Phaser.Math.FloatBetween(1500, 2500);

    return {
      angle,
      dist,
      radialV: PARTICLE_DRIFT_SPEED,
      angularV,
      size: minSize,
      maxSize: Phaser.Math.FloatBetween(minSize, maxSize),
      color: Phaser.Utils.Array.GetRandom(PARTICLE_COLORS),
      age: 0,
      growDur,
    };
  }
}
