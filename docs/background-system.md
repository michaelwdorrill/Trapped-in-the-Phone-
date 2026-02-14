# Background System — Particles & Perspective Grid

Technical reference for the procedural background rendered by `BackgroundScene.ts`.

---

## Overview

The background is entirely procedural — no image assets. Every frame, a single `Phaser.GameObjects.Graphics` object draws three layers in order:

1. **Sky fill** — solid dark blue (`#0a0a2e`)
2. **Perspective grid** — scrolling horizontal lines + vertical fan lines
3. **Floating particles** — square particles that spawn, drift outward, and fade

The vanishing point / focal point for both the grid and particles sits at **(270, 385)** on the 540×960 canvas.

---

## Perspective Grid

### Coordinate System

The grid simulates a flat ground plane stretching from the camera toward the horizon. World-space uses a **Z-axis** running from `Z_NEAR = 1` (bottom of screen) to `Z_FAR = 300` (horizon). A perspective projection maps each Z value to a screen Y coordinate:

```
screenY = horizonY + viewDist / z
```

Where `viewDist = 300` controls the perceived depth. Small Z values (near the camera) produce large screenY values (bottom of screen); large Z values compress toward the horizon line at Y = 385.

### Horizontal Lines (Z-lines)

**160 horizontal lines** are evenly spaced in Z-space between `Z_NEAR` and `Z_FAR`. Because of perspective projection, lines near the horizon pack tightly together while lines near the bottom of the screen spread apart — exactly how a receding grid looks in real life.

Each frame, a **Z-offset** increments by `SCROLL_SPEED × deltaTime` (1.2 Z-units/sec). This shifts every line's Z position forward (toward the camera). When the offset exceeds one grid-cell spacing, it wraps back, creating **infinite forward motion** without any lines actually leaving the scene.

Lines closer to the viewer (larger `depth` factor) are drawn **thicker** (up to 10px) and more **opaque** (up to 0.58 alpha). Lines near the horizon thin out to ~2.5px at ~0.08 alpha, reinforcing the depth illusion.

An extra iteration range (`i = -1` to `HLINE_COUNT + 1`) ensures lines remain visible at the edges during scroll transitions with no popping.

### Vertical Lines (Fan Lines)

**14 vertical lines** fan outward from the vanishing point (270, 385) to evenly-spaced target positions along the bottom edge of the screen. The fan spans **24× the screen width** (12,960px total), so the outermost lines exit the visible area at steep angles — only the central portion is visible, giving natural edge falloff.

Each line is a simple stroke from `(VX, VY)` to `(targetX, GAME_H)`. Lines farther from center are drawn thinner and more transparent (alpha drops from 0.45 at center to 0.20 at edges), simulating atmospheric fade.

### Horizon Seam Mask

A 3px filled rectangle at the horizon line (Y = 384–387) with 0.20 alpha masks the sub-pixel gap where vertical line origins and the topmost horizontal lines don't perfectly align. This is invisible in practice but prevents a visible 1px artifact.

---

## Particle System

### Lifecycle

Each particle moves through three phases in sequence:

| Phase    | Behavior                         | Duration   |
|----------|----------------------------------|------------|
| **GROW** | Size scales linearly from 0 → full | ~1/3 cycle |
| **HOLD** | Full size, still drifting        | ~1/3 cycle |
| **SHRINK** | Size scales linearly from full → 0 | ~1/3 cycle |

The base cycle is **5000ms**, with a ±20% random jitter per particle (so cycles range from 4000–6000ms). When the shrink phase completes, the particle is removed from the array.

### Spawning

Particles spawn in **batches of up to 5**, triggered every **100ms**. A batch only spawns particles while the total on-screen particle area is below the **target coverage** of 8.8% of the canvas area (540 × 960 × 0.088 ≈ 45,619 px²). This self-regulates density: if many particles are alive, spawning pauses until enough fade out.

### Position & Distribution

Spawn positions are **center-biased** using a triangular distribution:

```typescript
x = focalX + (Math.random() + Math.random() - 1) * (GAME_W / 2)
y = focalY + (Math.random() + Math.random() - 1) * (GAME_H / 2)
```

Summing two `Math.random()` calls and subtracting 1 produces a triangular distribution centered at 0, making particles more likely to appear near the focal point (270, 385) and less likely at the screen edges.

### Drift

Each particle drifts **outward** from the focal point at a constant **40 px/sec**. The velocity vector is computed at spawn time:

```
direction = normalize(spawnPosition - focalPoint)
velocity  = direction × 40
```

This creates a gentle radial expansion from the center of the screen.

### Appearance

- **Shape**: filled squares (using `fillRect`)
- **Size**: random between 4px and 16px (diameter = 2× the radius constants)
- **Colors**: randomly chosen from the palette:
  - `#F9C6D7` (light pink)
  - `#DB4C77` (deep pink)
  - `#10559A` (blue)
  - `#3CA2C8` (cyan)
- **Alpha**: fixed at 0.85 for all particles
- Particles smaller than 0.5px (during grow/shrink transitions) are skipped to avoid rendering artifacts.

---

## Visibility Control

Other scenes call `setBackgroundVisible(true | false)` to show or hide the background. When hidden:
- The graphics object is set invisible
- All particles are cleared
- Spawn timer and grid offset reset

This ensures clean state when transitioning between scenes that do and don't use the background.

---

## Constants Reference

| Constant | Value | Purpose |
|----------|-------|---------|
| `BG_COLOR` | `0x0a0a2e` | Sky fill color |
| `PARTICLE_COLORS` | `[0xF9C6D7, 0xDB4C77, 0x10559A, 0x3CA2C8]` | Particle color palette |
| `PARTICLE_COVERAGE` | `0.088` | Target 8.8% screen area in particles |
| `PARTICLE_MIN_R` | `2` | Minimum particle radius (4px square) |
| `PARTICLE_MAX_R` | `8` | Maximum particle radius (16px square) |
| `PARTICLE_CYCLE_MS` | `5000` | Base grow+hold+shrink duration |
| `PARTICLE_SPAWN_INTERVAL_MS` | `100` | Time between spawn batches |
| `PARTICLE_DRIFT_PX_PER_SEC` | `40` | Outward drift speed |
| `PARTICLE_FOCAL_X` | `270` | Spawn origin & vanishing point X |
| `PARTICLE_FOCAL_Y` | `385` | Spawn origin & vanishing point Y |
| `GRID_LINE_COLOR` | `0x3CA2C8` | Cyan grid line color |
| `GRID_HLINE_COUNT` | `160` | Horizontal line count |
| `GRID_VLINE_COUNT` | `14` | Vertical fan line count |
| `GRID_SCROLL_SPEED` | `1.2` | Z-units per second forward |
| `GRID_Z_NEAR` | `1` | Closest Z (screen bottom) |
| `GRID_Z_FAR` | `300` | Farthest Z (horizon) |
| `GRID_VIEW_DIST` | `300` | Perspective projection constant |
