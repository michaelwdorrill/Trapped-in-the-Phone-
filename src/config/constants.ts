// Game dimensions (portrait 9:16)
export const GAME_W = 540;
export const GAME_H = 960;

// Transition timing
export const FADE_MS = 1000;

// Background color
export const BG_COLOR = 0x0a0a2e;

// Phone screen cutout (transparent region of Background.png)
export const SCREEN_X = 68;
export const SCREEN_Y = 80;
export const SCREEN_W = 400;
export const SCREEN_H = 800;
export const SCREEN_L = 68;
export const SCREEN_T = 80;
export const SCREEN_R = 468;   // 68 + 400
export const SCREEN_B = 880;   // 80 + 800

// Vanishing / focal point (centered in phone screen)
export const FOCAL_X = 268;    // SCREEN_X + SCREEN_W / 2
export const FOCAL_Y = 385;    // aesthetic horizon inside screen rect

// Tunnel ring grid
export const TUNNEL_COLOR = 0x3CA2C8;          // cyan
export const TUNNEL_ACCENT = 0xDB4C77;         // magenta accent every Nth ring
export const TUNNEL_ACCENT_EVERY = 4;          // accent ring interval
export const RING_COUNT = 18;                  // 25% of original 70
export const RING_SCROLL_SPEED = 0.35;         // rings per second
export const DEPTH_EASE = 2.2;                 // exponential depth compression
export const FAR_W = 32;                       // ~SCREEN_W * 0.08
export const FAR_H = 48;                       // ~SCREEN_H * 0.06
export const TUNNEL_RIBS_TOP_BOTTOM = 5;       // vertical lines on top & bottom walls
export const TUNNEL_RIBS_LEFT_RIGHT = 7;       // horizontal lines on left & right walls

// Particles (grow-only, spiral radial drift outward, die on screen exit)
export const PARTICLE_COLORS = [0xF9C6D7, 0xDB4C77, 0x10559A, 0x3CA2C8];
export const PARTICLE_COVERAGE = 0.14;          // ~14% of canvas area
export const PARTICLE_MIN_R = 3;                // minimum radius in px
export const PARTICLE_MAX_R = 12;               // maximum radius in px
export const PARTICLE_SPAWN_INTERVAL_MS = 80;   // new batch every 80ms
export const PARTICLE_DRIFT_SPEED = 50;         // px/sec outward radial component
export const PARTICLE_ANGULAR_SPEED = 0.4;      // radians/sec spiral rotation

// Center light grid (bright animated grid at the vanishing point)
export const CENTER_GRID_COLS = 6;              // columns in the center light grid
export const CENTER_GRID_ROWS = 8;              // rows in the center light grid
export const CENTER_GRID_COLOR_A = 0x3CA2C8;    // cyan
export const CENTER_GRID_COLOR_B = 0xDB4C77;    // pink/magenta
export const CENTER_GRID_CYCLE_MS = 1200;       // time for one full diagonal wave cycle
export const CENTER_GRID_ALPHA = 0.85;          // base alpha for center grid squares

// Phone zoom-out transition
export const PHONE_ZOOM_OUT_MS = 800;           // duration of phone zoom-out animation
export const PHONE_ZOOM_IN_MS = 800;            // duration of phone zoom-in animation

// Transparent transition (no fade-to-black; elements fade over grid)
export const ELEMENT_FADE_MS = 400;             // ms for scene elements to fade in/out

// Cutscene timing
export const CUTSCENE_HOLD_MS = 8000;
export const CUTSCENE_WIPE_MS = 1000;

// Title card pulse animation
export const TITLE_PULSE_MIN = 0.98;
export const TITLE_PULSE_MAX = 1.03;
export const TITLE_PULSE_MS = 2200;

// Rainbow burst effect
export const BURST_DURATION_MS = 280;
export const BURST_DISTANCE_PX = 14;
export const BURST_SCALE_TO = 1.08;
export const BURST_ALPHA_FROM = 0.85;

// Character slide transition
export const CHARACTER_SLIDE_MS = 350;
