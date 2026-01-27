import Phaser from 'phaser';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { AudioManager } from '../audio/AudioManager';
import { InputLock } from '../utils/InputLock';
import { ImageButton } from '../ui/ImageButton';
import { Slider } from '../ui/Slider';
import { BackgroundScene } from './BackgroundScene';
import { OverlayScene } from './OverlayScene';

export class SettingsScene extends Phaser.Scene {
  private backButton!: ImageButton;
  private musicSlider!: Slider;
  private sfxSlider!: Slider;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    console.log('[SettingsScene] create() called');
    // Show background and maximize button
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    bgScene.setBackgroundVisible(true);

    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.setMaximizeVisible(true);

    // Reset transition state and unlock input (safety net)
    overlayScene.resetTransitionState();
    InputLock.unlock();

    // Do NOT change BGM - keep whatever is playing

    // Header
    this.add.image(
      LAYOUT.settings.header.x,
      LAYOUT.settings.header.y,
      'settings_header'
    ).setOrigin(0.5, 0.5);

    // Music label
    this.add.image(
      LAYOUT.settings.musicLabel.x,
      LAYOUT.settings.musicLabel.y,
      'label_music'
    ).setOrigin(0.5, 0.5);

    // Music slider
    this.musicSlider = new Slider({
      scene: this,
      x: LAYOUT.settings.musicSliderBg.x,
      y: LAYOUT.settings.musicSliderBg.y,
      bgTexture: 'slider_bg',
      trackTexture: 'slider_track',
      knobTexture: 'slider_knob',
      initialValue: GameState.bgmVolume,
      onChange: (value) => {
        AudioManager.setBgmVolume(value);
      },
    });

    // SFX label
    this.add.image(
      LAYOUT.settings.sfxLabel.x,
      LAYOUT.settings.sfxLabel.y,
      'label_sfx'
    ).setOrigin(0.5, 0.5);

    // SFX slider
    this.sfxSlider = new Slider({
      scene: this,
      x: LAYOUT.settings.sfxSliderBg.x,
      y: LAYOUT.settings.sfxSliderBg.y,
      bgTexture: 'slider_bg',
      trackTexture: 'slider_track',
      knobTexture: 'slider_knob',
      initialValue: GameState.sfxVolume,
      onChange: (value) => {
        AudioManager.setSfxVolume(value);
      },
    });

    // Back button
    this.backButton = new ImageButton({
      scene: this,
      x: LAYOUT.settings.backButton.x,
      y: LAYOUT.settings.backButton.y,
      texture: 'btn_back',
      callback: () => this.onBack(),
    });
  }

  private onBack(): void {
    const returnScene = GameState.returnSceneKey || 'StartMenuScene';
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transitionTo(returnScene);
  }

  shutdown(): void {
    this.backButton.destroy();
    this.musicSlider.destroy();
    this.sfxSlider.destroy();
  }
}
