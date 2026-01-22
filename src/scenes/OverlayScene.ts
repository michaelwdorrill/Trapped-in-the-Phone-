import Phaser from 'phaser';
import { GAME_W, GAME_H, FADE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { InputLock } from '../utils/InputLock';

export class OverlayScene extends Phaser.Scene {
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private maximizeBtn!: Phaser.GameObjects.Image;

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

  async transitionTo(nextSceneKey: string, data?: object): Promise<void> {
    // Lock input immediately
    InputLock.lock();

    // Fade to black
    await this.fadeIn();

    // Stop all content scenes (except Background and Overlay)
    const contentScenes = [
      'LaunchScene',
      'IntroCutsceneScene',
      'StartMenuScene',
      'SettingsScene',
      'CharacterSelectScene',
      'LevelSelectScene',
    ];

    for (const sceneKey of contentScenes) {
      if (this.scene.isActive(sceneKey)) {
        this.scene.stop(sceneKey);
      }
    }

    // Start next scene
    this.scene.start(nextSceneKey, data);

    // Fade from black
    await this.fadeOut();

    // Unlock input
    InputLock.unlock();
  }

  private fadeIn(): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: this.fadeRect,
        alpha: 1,
        duration: FADE_MS,
        ease: 'Linear',
        onComplete: () => resolve(),
      });
    });
  }

  private fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: this.fadeRect,
        alpha: 0,
        duration: FADE_MS,
        ease: 'Linear',
        onComplete: () => resolve(),
      });
    });
  }
}
