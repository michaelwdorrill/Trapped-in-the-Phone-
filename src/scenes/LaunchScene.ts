import Phaser from 'phaser';
import { LAYOUT } from '../config/layout';
import { AudioManager } from '../audio/AudioManager';
import { BackgroundScene } from './BackgroundScene';
import { OverlayScene } from './OverlayScene';

export class LaunchScene extends Phaser.Scene {
  private launched: boolean = false;

  constructor() {
    super({ key: 'LaunchScene' });
  }

  create(): void {
    this.launched = false;

    // Hide background and maximize button
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    bgScene.setBackgroundVisible(false);

    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.setMaximizeVisible(false);

    // Display launch screen image centered
    this.add.image(LAYOUT.launch.x, LAYOUT.launch.y, 'launch_screen');

    // Listen for any pointer down to start
    this.input.once('pointerdown', this.onLaunch, this);
  }

  private onLaunch(): void {
    if (this.launched) return;
    this.launched = true;

    // Start BGM if not already playing
    if (!AudioManager.getCurrentBgmKey()) {
      AudioManager.playBgm('bgm_trapped', true, false);
    }

    // Transition to intro cutscene
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transitionTo('IntroCutsceneScene');
  }
}
