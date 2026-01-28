import Phaser from 'phaser';
import { FADE_MS } from '../config/constants';
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

    // Create a div that covers the game container
    this.fadeOverlay = document.createElement('div');
    this.fadeOverlay.id = 'fade-overlay';
    this.fadeOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
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

  transitionTo(nextSceneKey: string, data?: object): void {
    console.log('[OverlayScene] transitionTo called:', nextSceneKey);
    console.log('[OverlayScene] isTransitioning:', this.isTransitioning);

    // Prevent multiple simultaneous transitions
    if (this.isTransitioning) {
      console.log('[OverlayScene] Already transitioning, returning');
      return;
    }
    this.isTransitioning = true;

    // Lock input immediately
    InputLock.lock();
    console.log('[OverlayScene] Input locked');

    // Store transition info
    this.nextSceneKey = nextSceneKey;
    this.nextSceneData = data;

    // Start fade out using DOM overlay
    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '1';
      console.log('[OverlayScene] Starting DOM fade out');

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
          console.log('[OverlayScene] Starting DOM fade in');

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
