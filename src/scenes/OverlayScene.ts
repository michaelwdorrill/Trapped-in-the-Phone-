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
    this.maximizeBtn.setVisible(visible);
  }

  transitionTo(nextSceneKey: string, data?: object): void {
    // Prevent multiple simultaneous transitions
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Lock input immediately
    InputLock.lock();

    // Set to black instantly
    this.fadeRect.setAlpha(1);

    // Stop all content scenes
    const contentScenes = [
      'LaunchScene',
      'IntroCutsceneScene',
      'StartMenuScene',
      'SettingsScene',
      'CharacterSelectScene',
      'LevelSelectScene',
    ];

    for (const sceneKey of contentScenes) {
      try {
        this.scene.stop(sceneKey);
      } catch (e) {
        // Ignore errors from stopping inactive scenes
      }
    }

    // Start next scene
    this.scene.start(nextSceneKey, data);

    // Fade from black using time-based approach
    let elapsed = 0;
    const fadeStep = () => {
      elapsed += 16; // ~60fps
      const progress = Math.min(elapsed / FADE_MS, 1);
      this.fadeRect.setAlpha(1 - progress);

      if (progress < 1) {
        this.time.delayedCall(16, fadeStep);
      } else {
        this.fadeRect.setAlpha(0);
        this.isTransitioning = false;
        InputLock.unlock();
      }
    };

    // Start fade out after a brief moment
    this.time.delayedCall(50, fadeStep);
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
    // Stop the cutscene scene
    this.scene.stop('IntroCutsceneScene');

    // Start the new scene
    this.scene.start(nextSceneKey);

    // Set overlay to black and fade out
    this.fadeRect.setAlpha(1);

    // Unlock input after fade completes
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
}
