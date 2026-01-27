import Phaser from 'phaser';
import { GAME_W, GAME_H, FADE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { InputLock } from '../utils/InputLock';

export class OverlayScene extends Phaser.Scene {
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private maximizeBtn!: Phaser.GameObjects.Image;
  private isTransitioning: boolean = false;

  // Manual fade state (more reliable than tweens for parallel scenes)
  private fadeState: 'idle' | 'fading_out' | 'fading_in' = 'idle';
  private fadeProgress: number = 0;
  private nextSceneKey?: string;
  private nextSceneData?: object;

  constructor() {
    super({ key: 'OverlayScene' });
  }

  create(): void {
    // Create full-screen black rectangle for fade transitions
    this.fadeRect = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000);
    this.fadeRect.setOrigin(0.5, 0.5);
    this.fadeRect.setAlpha(0);
    this.fadeRect.setDepth(1000);

    // Create maximize/minimize button
    const texture = GameState.isMaximized ? 'btn_minimize' : 'btn_maximize';
    this.maximizeBtn = this.add.image(LAYOUT.maximize.x, LAYOUT.maximize.y, texture);
    this.maximizeBtn.setOrigin(0.5, 0.5);
    this.maximizeBtn.setDepth(1001);
    this.maximizeBtn.setInteractive({ useHandCursor: true });
    this.maximizeBtn.setVisible(false); // Hidden by default

    this.maximizeBtn.on('pointerdown', this.toggleMaximize, this);

    // Reset fade state
    this.fadeState = 'idle';
    this.fadeProgress = 0;
  }

  update(_time: number, delta: number): void {
    // Manual fade animation (more reliable than tweens for parallel scenes)
    if (this.fadeState === 'idle') return;

    const fadeSpeed = 2 / FADE_MS; // Complete fade in FADE_MS/2

    if (this.fadeState === 'fading_out') {
      this.fadeProgress += fadeSpeed * delta;
      if (this.fadeProgress >= 1) {
        this.fadeProgress = 1;
        this.fadeRect.setAlpha(1);
        console.log('[OverlayScene] Manual fade out complete');

        // Switch scenes
        this.performSceneSwitch();
      } else {
        this.fadeRect.setAlpha(this.fadeProgress);
      }
    } else if (this.fadeState === 'fading_in') {
      this.fadeProgress -= fadeSpeed * delta;
      if (this.fadeProgress <= 0) {
        this.fadeProgress = 0;
        this.fadeRect.setAlpha(0);
        this.fadeState = 'idle';
        console.log('[OverlayScene] Manual fade in complete, unlocking');
        this.isTransitioning = false;
        InputLock.unlock();
      } else {
        this.fadeRect.setAlpha(this.fadeProgress);
      }
    }
  }

  private performSceneSwitch(): void {
    // Content scenes list
    const contentScenes = [
      'LaunchScene',
      'IntroCutsceneScene',
      'StartMenuScene',
      'SettingsScene',
      'CharacterSelectScene',
      'LevelSelectScene',
    ];

    // Stop all content scenes except the next one
    for (const sceneKey of contentScenes) {
      if (sceneKey !== this.nextSceneKey) {
        try {
          this.scene.stop(sceneKey);
        } catch (e) {
          // Scene might not be running
        }
      }
    }

    // Start next scene
    console.log('[OverlayScene] Starting scene:', this.nextSceneKey);
    if (this.nextSceneKey) {
      this.scene.start(this.nextSceneKey, this.nextSceneData);
    }

    // CRITICAL: scene.start() makes OverlayScene inactive, so we must reactivate it
    this.ensureActive();

    // Start fading in
    this.fadeState = 'fading_in';
    console.log('[OverlayScene] Fade in started, fadeProgress:', this.fadeProgress);
  }

  private toggleMaximize(): void {
    GameState.isMaximized = !GameState.isMaximized;

    const container = document.getElementById('game-container');
    if (container) {
      if (GameState.isMaximized) {
        container.classList.add('maximized');
        this.maximizeBtn.setTexture('btn_minimize');
      } else {
        container.classList.remove('maximized');
        this.maximizeBtn.setTexture('btn_maximize');
      }

      // Refresh Phaser scale manager
      this.game.scale.refresh();
    }
  }

  setMaximizeVisible(visible: boolean): void {
    console.log('[OverlayScene] setMaximizeVisible:', visible);
    this.maximizeBtn.setVisible(visible);
  }

  // Called by content scenes to reset transition state after they're fully loaded
  resetTransitionState(): void {
    console.log('[OverlayScene] resetTransitionState called');
    this.isTransitioning = false;
  }

  // Ensure this scene is truly active and updating
  private ensureActive(): void {
    const sceneKey = 'OverlayScene';
    console.log('[OverlayScene] ensureActive - checking state');
    console.log('[OverlayScene] isActive:', this.scene.isActive(sceneKey));
    console.log('[OverlayScene] isPaused:', this.scene.isPaused(sceneKey));
    console.log('[OverlayScene] isSleeping:', this.scene.isSleeping(sceneKey));

    // Try multiple methods to ensure the scene is active
    if (this.scene.isSleeping(sceneKey)) {
      console.log('[OverlayScene] Waking scene');
      this.scene.wake(sceneKey);
    }
    if (this.scene.isPaused(sceneKey)) {
      console.log('[OverlayScene] Resuming scene');
      this.scene.resume(sceneKey);
    }
    if (!this.scene.isActive(sceneKey)) {
      console.log('[OverlayScene] Running scene');
      this.scene.run(sceneKey);
    }

    // Force the scene systems to be active
    this.sys.setActive(true);
    this.sys.setVisible(true);

    // Bring to top
    this.scene.bringToTop(sceneKey);

    console.log('[OverlayScene] After ensureActive - isActive:', this.scene.isActive(sceneKey));
  }

  transitionTo(nextSceneKey: string, data?: object): void {
    console.log('[OverlayScene] transitionTo called:', nextSceneKey);
    console.log('[OverlayScene] isTransitioning:', this.isTransitioning);
    console.log('[OverlayScene] fadeState:', this.fadeState);

    // Prevent multiple simultaneous transitions (but allow if we're stuck in fading_in)
    if (this.isTransitioning && this.fadeState !== 'fading_in') {
      console.log('[OverlayScene] Already transitioning, returning');
      return;
    }

    // Reset any stuck state
    this.isTransitioning = true;

    // Lock input immediately
    InputLock.lock();
    console.log('[OverlayScene] Input locked');

    // Ensure this scene is truly active for update() to run
    this.ensureActive();

    // Store transition info for manual fade
    this.nextSceneKey = nextSceneKey;
    this.nextSceneData = data;

    // Start manual fade out (handled in update())
    this.fadeState = 'fading_out';
    this.fadeProgress = this.fadeRect.alpha; // Start from current alpha
    console.log('[OverlayScene] Starting manual fade out, fadeProgress:', this.fadeProgress);
  }

  // Called when transitioning from cutscene (which does its own wipe to black)
  fadeFromBlack(): void {
    console.log('[OverlayScene] fadeFromBlack called');

    // Ensure overlay is truly active
    this.ensureActive();

    // Set to full black and start manual fade in
    this.fadeRect.setAlpha(1);
    this.fadeProgress = 1;
    this.fadeState = 'fading_in';
    this.isTransitioning = true;
    console.log('[OverlayScene] fadeFromBlack - starting manual fade in');
  }

  // Called by cutscene after its wipe-to-black completes
  completeWipeTransition(nextSceneKey: string): void {
    console.log('[OverlayScene] completeWipeTransition called:', nextSceneKey);

    // Reset transition flag
    this.isTransitioning = true; // Will be reset when fade completes

    // Ensure overlay is truly active BEFORE stopping/starting other scenes
    this.ensureActive();

    // Stop the cutscene scene
    this.scene.stop('IntroCutsceneScene');

    // Start the new scene
    this.scene.start(nextSceneKey);
    console.log('[OverlayScene] Started scene:', nextSceneKey);

    // Ensure overlay is STILL active after scene changes (scene.start can affect other scenes)
    this.ensureActive();

    // Set overlay to black and start manual fade in
    this.fadeRect.setAlpha(1);
    this.fadeProgress = 1;
    this.fadeState = 'fading_in';
    console.log('[OverlayScene] Starting manual fade in from black');
  }
}
