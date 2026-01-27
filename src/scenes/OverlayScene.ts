import Phaser from 'phaser';
import { GAME_W, GAME_H, FADE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { InputLock } from '../utils/InputLock';

export class OverlayScene extends Phaser.Scene {
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private maximizeBtn!: Phaser.GameObjects.Image;
  private isTransitioning: boolean = false;

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

    // Stop all content scenes (not persistent ones)
    const contentScenes = [
      'LaunchScene',
      'IntroCutsceneScene',
      'StartMenuScene',
      'SettingsScene',
      'CharacterSelectScene',
      'LevelSelectScene',
    ];
    for (const sceneKey of contentScenes) {
      if (sceneKey !== nextSceneKey) {
        try {
          this.scene.stop(sceneKey);
        } catch (e) {
          // Scene might not be running
        }
      }
    }
    console.log('[OverlayScene] Stopped content scenes');

    // Start next scene directly - no fade for debugging
    console.log('[OverlayScene] Starting scene:', nextSceneKey);
    this.scene.start(nextSceneKey, data);
    console.log('[OverlayScene] scene.start called');

    // Unlock after brief delay
    this.time.delayedCall(100, () => {
      console.log('[OverlayScene] Unlocking input, resetting isTransitioning');
      this.isTransitioning = false;
      InputLock.unlock();
    });
  }

  // Called when transitioning from cutscene (which does its own wipe to black)
  fadeFromBlack(): void {
    // Set to full black first
    this.fadeRect.setAlpha(1);

    // Fade out
    this.tweens.add({
      targets: this.fadeRect,
      alpha: 0,
      duration: FADE_MS,
      ease: 'Linear',
      onComplete: () => {
        InputLock.unlock();
      },
    });

    // Fallback: ensure unlock happens even if tween fails
    this.time.delayedCall(FADE_MS + 100, () => {
      InputLock.unlock();
    });
  }

  // Called by cutscene after its wipe-to-black completes
  completeWipeTransition(nextSceneKey: string): void {
    console.log('[OverlayScene] completeWipeTransition called:', nextSceneKey);

    // Reset transition flag (in case transitionTo set it)
    this.isTransitioning = false;

    // Stop the cutscene scene
    this.scene.stop('IntroCutsceneScene');

    // Start the new scene
    this.scene.start(nextSceneKey);
    console.log('[OverlayScene] Started scene:', nextSceneKey);

    // Set overlay to black and fade out
    this.fadeRect.setAlpha(1);

    // Unlock input after fade completes
    this.tweens.add({
      targets: this.fadeRect,
      alpha: 0,
      duration: FADE_MS,
      ease: 'Linear',
      onComplete: () => {
        console.log('[OverlayScene] Fade complete, unlocking');
        InputLock.unlock();
      },
    });

    // Fallback: ensure unlock happens even if tween fails
    this.time.delayedCall(FADE_MS + 100, () => {
      console.log('[OverlayScene] Fallback unlock');
      InputLock.unlock();
    });
  }
}
