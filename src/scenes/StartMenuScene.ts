import Phaser from 'phaser';
import { TITLE_PULSE_MIN, TITLE_PULSE_MAX, TITLE_PULSE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { AudioManager } from '../audio/AudioManager';
import { ImageButton } from '../ui/ImageButton';
import { BackgroundScene } from './BackgroundScene';
import { OverlayScene } from './OverlayScene';

export class StartMenuScene extends Phaser.Scene {
  private titleCard!: Phaser.GameObjects.Image;
  private startButton!: ImageButton;
  private settingsButton!: ImageButton;

  constructor() {
    super({ key: 'StartMenuScene' });
  }

  create(data?: { fromInside?: boolean }): void {
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    bgScene.setBackgroundVisible(true);

    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.setMaximizeVisible(true);

    // If returning from inside the phone, animate phone frame zooming in
    // Otherwise (first load / from cutscene), just show it normally
    if (data?.fromInside) {
      bgScene.startPhoneZoomIn();
    } else {
      bgScene.setPhoneFrameVisible(true);
    }

    // Ensure BGM is playing (don't restart if already playing)
    if (AudioManager.getCurrentBgmKey() !== 'bgm_trapped') {
      AudioManager.playBgm('bgm_trapped', true, false);
    }

    // Title card with pulse animation
    this.titleCard = this.add.image(
      LAYOUT.startMenu.title.x,
      LAYOUT.startMenu.title.y,
      'start_title'
    );
    this.titleCard.setOrigin(0.5, 0.5);

    // Pulse tween
    this.tweens.add({
      targets: this.titleCard,
      scaleX: { from: TITLE_PULSE_MIN, to: TITLE_PULSE_MAX },
      scaleY: { from: TITLE_PULSE_MIN, to: TITLE_PULSE_MAX },
      duration: TITLE_PULSE_MS / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Start game button
    this.startButton = new ImageButton({
      scene: this,
      x: LAYOUT.startMenu.startButton.x,
      y: LAYOUT.startMenu.startButton.y,
      texture: 'btn_startgame',
      callback: () => this.onStartGame(),
    });

    // Settings button
    this.settingsButton = new ImageButton({
      scene: this,
      x: LAYOUT.startMenu.settingsButton.x,
      y: LAYOUT.startMenu.settingsButton.y,
      texture: 'btn_settings',
      callback: () => this.onSettings(),
    });
  }

  private onStartGame(): void {
    console.log('[StartMenuScene] onStartGame called');
    // Switch BGM to shuffle
    AudioManager.switchBgm('bgm_shuffle', 500, 500);

    // Start phone zoom-out and transparent transition simultaneously
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;

    bgScene.startPhoneZoomOut();
    overlayScene.transparentTransitionTo('CharacterSelectScene');
  }

  private onSettings(): void {
    console.log('[StartMenuScene] onSettings called');
    GameState.returnSceneKey = 'StartMenuScene';

    // Start phone zoom-out and transparent transition simultaneously
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;

    bgScene.startPhoneZoomOut();
    overlayScene.transparentTransitionTo('SettingsScene');
  }

  shutdown(): void {
    this.startButton.destroy();
    this.settingsButton.destroy();
  }
}
