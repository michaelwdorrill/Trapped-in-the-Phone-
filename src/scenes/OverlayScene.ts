import Phaser from 'phaser';
import { FADE_MS, ELEMENT_FADE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { InputLock } from '../utils/InputLock';

export class OverlayScene extends Phaser.Scene {
  private maximizeBtn!: Phaser.GameObjects.Image;
  private isTransitioning: boolean = false;

  // DOM-based fade overlay (bypasses Phaser scene rendering issues)
  private fadeOverlay: HTMLDivElement | null = null;
  private nextSceneKey?: string;
  private nextSceneData?: object;

  constructor() {
    super({ key: 'OverlayScene' });
  }

  create(): void {
    // Create DOM-based fade overlay
    this.createFadeOverlay();

    // Create maximize/minimize button
    const texture = GameState.isMaximized ? 'btn_minimize' : 'btn_maximize';
    this.maximizeBtn = this.add.image(LAYOUT.maximize.x, LAYOUT.maximize.y, texture);
    this.maximizeBtn.setOrigin(0.5, 0.5);
    this.maximizeBtn.setDepth(1001);
    this.maximizeBtn.setInteractive({ useHandCursor: true });
    this.maximizeBtn.setVisible(false); // Hidden by default

    this.maximizeBtn.on('pointerdown', this.toggleMaximize, this);

  }

  private createFadeOverlay(): void {
    // Remove existing overlay if any
    if (this.fadeOverlay) {
      this.fadeOverlay.remove();
    }

    // Create a div that covers only the game canvas (not the container's black bars)
    this.fadeOverlay = document.createElement('div');
    this.fadeOverlay.id = 'fade-overlay';
    this.fadeOverlay.style.cssText = `
      position: absolute;
      background-color: black;
      opacity: 0;
      pointer-events: none;
      z-index: 9998;
      transition: opacity ${FADE_MS / 2}ms linear;
    `;

    // Add to game container
    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.fadeOverlay);
    }

    // Position overlay to match canvas
    this.updateOverlayPosition();

    // Listen for resize to keep overlay matched to canvas
    this.game.scale.on('resize', this.updateOverlayPosition, this);
  }

  private updateOverlayPosition = (): void => {
    if (!this.fadeOverlay) return;

    const canvas = this.game.canvas;
    const container = document.getElementById('game-container');
    if (!canvas || !container) return;

    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate offset of canvas within container
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    this.fadeOverlay.style.left = `${offsetX}px`;
    this.fadeOverlay.style.top = `${offsetY}px`;
    this.fadeOverlay.style.width = `${canvasRect.width}px`;
    this.fadeOverlay.style.height = `${canvasRect.height}px`;
  };

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

  // ── Fade-to-black transition (used for launch, cutscene, and cutscene→start) ──
  transitionTo(nextSceneKey: string, data?: object): void {
    console.log('[OverlayScene] transitionTo called:', nextSceneKey);

    // Prevent multiple simultaneous transitions
    if (this.isTransitioning) {
      console.log('[OverlayScene] Already transitioning, returning');
      return;
    }
    this.isTransitioning = true;

    // Lock input immediately
    InputLock.lock();

    // Store transition info
    this.nextSceneKey = nextSceneKey;
    this.nextSceneData = data;

    // Start fade out using DOM overlay
    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '1';

      // Listen for transition end
      this.fadeOverlay.addEventListener('transitionend', this.onFadeOutComplete, { once: true });
    }
  }

  private onFadeOutComplete = (): void => {
    console.log('[OverlayScene] DOM fade out complete');
    this.performSceneSwitch();
  };

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

    // Start fading in
    if (this.fadeOverlay) {
      // Small delay to ensure scene has rendered
      setTimeout(() => {
        if (this.fadeOverlay) {
          this.fadeOverlay.style.opacity = '0';

          // Listen for transition end
          this.fadeOverlay.addEventListener('transitionend', this.onFadeInComplete, { once: true });
        }
      }, 50);
    }
  }

  private onFadeInComplete = (): void => {
    console.log('[OverlayScene] DOM fade in complete, unlocking');
    this.isTransitioning = false;
    InputLock.unlock();
  };

  // ── Transparent transition (no fade-to-black; scene elements fade over grid) ──
  /**
   * Transition between post-start-screen scenes without going to black.
   * Uses camera alpha animated via requestAnimationFrame (bypasses Phaser
   * tween/timer systems which can stall during scene lifecycle changes).
   */
  transparentTransitionTo(nextSceneKey: string, data?: object): void {
    console.log('[OverlayScene] transparentTransitionTo called:', nextSceneKey);

    if (this.isTransitioning) {
      console.log('[OverlayScene] Already transitioning, returning');
      return;
    }
    this.isTransitioning = true;
    InputLock.lock();

    this.nextSceneKey = nextSceneKey;
    this.nextSceneData = data;

    // Content scenes list
    const contentScenes = [
      'StartMenuScene',
      'SettingsScene',
      'CharacterSelectScene',
      'LevelSelectScene',
    ];

    // Find the currently running content scene
    let foundScene: Phaser.Scene | null = null;
    for (const sceneKey of contentScenes) {
      const scene = this.scene.get(sceneKey);
      if (scene && this.scene.isActive(sceneKey)) {
        foundScene = scene;
        break;
      }
    }

    if (foundScene) {
      const cam = foundScene.cameras.main;
      if (cam) {
        console.log('[OverlayScene] Fading out camera for:', foundScene.scene.key);
        this.rafAnimateAlpha(cam, 1, 0, ELEMENT_FADE_MS, () => {
          console.log('[OverlayScene] Fade out complete');
          this.performTransparentSwitch();
        });
      } else {
        this.performTransparentSwitch();
      }
    } else {
      this.performTransparentSwitch();
    }
  }

  /**
   * Animate camera alpha using requestAnimationFrame — completely independent
   * of Phaser's tween/timer systems.
   */
  private rafAnimateAlpha(
    cam: Phaser.Cameras.Scene2D.Camera,
    from: number,
    to: number,
    durationMs: number,
    onComplete: () => void,
  ): void {
    const start = performance.now();
    cam.setAlpha(from);

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      cam.setAlpha(from + (to - from) * t);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(tick);
  }

  private performTransparentSwitch(): void {
    const contentScenes = [
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

    console.log('[OverlayScene] Transparent switch to:', this.nextSceneKey);
    if (!this.nextSceneKey) return;

    const targetKey = this.nextSceneKey;
    const targetData = this.nextSceneData;

    // Hook into the scene's create event to hide camera BEFORE first render.
    // On a restart, scene.start() may not run create() synchronously,
    // so we can't rely on cameras.main being ready right after the call.
    const targetScene = this.scene.get(targetKey);
    if (targetScene) {
      targetScene.events.once('create', () => {
        if (targetScene.cameras && targetScene.cameras.main) {
          targetScene.cameras.main.setAlpha(0);
          console.log('[OverlayScene] Camera hidden via create event for:', targetKey);
        }
      });
    }

    // Start the scene (triggers create synchronously on first run, or deferred on restart)
    this.scene.start(targetKey, targetData);

    // Also try to set it synchronously in case create() already ran
    if (targetScene && targetScene.cameras && targetScene.cameras.main) {
      targetScene.cameras.main.setAlpha(0);
    }

    // Wait for scene to be fully ready, then fade in
    // Use a small delay to ensure the create event has fired
    setTimeout(() => {
      this.fadeInNewScene();
    }, 32);
  }

  private fadeInNewScene(): void {
    if (!this.nextSceneKey) {
      this.finishTransparentTransition();
      return;
    }

    const newScene = this.scene.get(this.nextSceneKey);
    if (!newScene || !newScene.cameras || !newScene.cameras.main) {
      console.log('[OverlayScene] No camera found for fade-in, finishing');
      this.finishTransparentTransition();
      return;
    }

    const cam = newScene.cameras.main;
    // Force alpha to 0 right before animating (in case it was reset)
    cam.setAlpha(0);
    console.log('[OverlayScene] Fading in camera for:', this.nextSceneKey, 'alpha:', cam.alpha);

    this.rafAnimateAlpha(cam, 0, 1, ELEMENT_FADE_MS, () => {
      this.finishTransparentTransition();
    });
  }

  private finishTransparentTransition(): void {
    console.log('[OverlayScene] finishTransparentTransition');
    this.isTransitioning = false;
    InputLock.unlock();
  }

  // Called when transitioning from cutscene (which does its own wipe to black)
  fadeFromBlack(): void {
    console.log('[OverlayScene] fadeFromBlack called');

    // Set to full black and start fade in
    if (this.fadeOverlay) {
      this.fadeOverlay.style.transition = 'none';
      this.fadeOverlay.style.opacity = '1';
      // Force reflow
      this.fadeOverlay.offsetHeight;
      this.fadeOverlay.style.transition = `opacity ${FADE_MS / 2}ms linear`;
      this.isTransitioning = true;

      setTimeout(() => {
        if (this.fadeOverlay) {
          this.fadeOverlay.style.opacity = '0';
          this.fadeOverlay.addEventListener('transitionend', this.onFadeInComplete, { once: true });
        }
      }, 50);
    }
  }

  // Called by cutscene after its wipe-to-black completes
  completeWipeTransition(nextSceneKey: string): void {
    console.log('[OverlayScene] completeWipeTransition called:', nextSceneKey);

    // Set overlay to black instantly
    if (this.fadeOverlay) {
      this.fadeOverlay.style.transition = 'none';
      this.fadeOverlay.style.opacity = '1';
      // Force reflow
      this.fadeOverlay.offsetHeight;
      this.fadeOverlay.style.transition = `opacity ${FADE_MS / 2}ms linear`;
    }

    this.isTransitioning = true;

    // Stop the cutscene scene
    this.scene.stop('IntroCutsceneScene');

    // Start the new scene
    this.scene.start(nextSceneKey);
    console.log('[OverlayScene] Started scene:', nextSceneKey);

    // Start fade in
    setTimeout(() => {
      if (this.fadeOverlay) {
        this.fadeOverlay.style.opacity = '0';
        console.log('[OverlayScene] Starting DOM fade in from black');
        this.fadeOverlay.addEventListener('transitionend', this.onFadeInComplete, { once: true });
      }
    }, 50);
  }
}
