import Phaser from 'phaser';
import { LAYOUT } from '../config/layout';
import { getCharacterById } from '../config/characters';
import { GameState } from '../state/GameState';
import { InputLock } from '../utils/InputLock';
import { ImageButton } from '../ui/ImageButton';
import { BackgroundScene } from './BackgroundScene';
import { OverlayScene } from './OverlayScene';

export class LevelSelectScene extends Phaser.Scene {
  private settingsBtn!: ImageButton;
  private achievementsBtn!: ImageButton;
  private levelBtns: ImageButton[] = [];

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    // Show background and maximize button
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    bgScene.setBackgroundVisible(true);

    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.setMaximizeVisible(true);

    // Reset transition state and unlock input (safety net)
    overlayScene.resetTransitionState();
    InputLock.unlock();

    // BGM should already be playing (bgm_shuffle), don't restart

    // Title card
    this.add.image(
      LAYOUT.levelSelect.title.x,
      LAYOUT.levelSelect.title.y,
      'ls_title'
    ).setOrigin(0.5, 0.5);

    // Portrait frame
    this.add.image(
      LAYOUT.levelSelect.portraitFrame.x,
      LAYOUT.levelSelect.portraitFrame.y,
      'ls_frame'
    ).setOrigin(0.5, 0.5);

    // Character portrait (144x144, centered in 150x150 frame = 3px border)
    const selectedChar = getCharacterById(GameState.selectedCharacterId);
    if (selectedChar) {
      this.add.image(
        LAYOUT.levelSelect.portrait.x,
        LAYOUT.levelSelect.portrait.y,
        selectedChar.levelKey
      ).setOrigin(0.5, 0.5);
    }

    // Level buttons
    const levelConfigs = [
      { key: 'lvl1', pos: LAYOUT.levelSelect.level1 },
      { key: 'lvl2', pos: LAYOUT.levelSelect.level2 },
      { key: 'lvl3', pos: LAYOUT.levelSelect.level3 },
      { key: 'lvl4', pos: LAYOUT.levelSelect.level4 },
    ];

    for (const config of levelConfigs) {
      const btn = new ImageButton({
        scene: this,
        x: config.pos.x,
        y: config.pos.y,
        texture: config.key,
        callback: () => this.onLevelSelect(config.key),
      });
      this.levelBtns.push(btn);
    }

    // Settings button
    this.settingsBtn = new ImageButton({
      scene: this,
      x: LAYOUT.levelSelect.settingsButton.x,
      y: LAYOUT.levelSelect.settingsButton.y,
      texture: 'ls_settings',
      callback: () => this.onSettings(),
    });

    // Achievements button
    this.achievementsBtn = new ImageButton({
      scene: this,
      x: LAYOUT.levelSelect.achievementsButton.x,
      y: LAYOUT.levelSelect.achievementsButton.y,
      texture: 'ls_ach',
      callback: () => this.onAchievements(),
    });
  }

  private onLevelSelect(levelKey: string): void {
    // Stub - show coming soon message
    console.log(`Level selected: ${levelKey} - Coming soon!`);

    // Show temporary text feedback
    const text = this.add.text(270, 480, 'Coming Soon!', {
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: 450,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private onSettings(): void {
    GameState.returnSceneKey = 'LevelSelectScene';
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transitionTo('SettingsScene');
  }

  private onAchievements(): void {
    // Stub - show coming soon message
    console.log('Achievements - Coming soon!');

    const text = this.add.text(270, 480, 'Coming Soon!', {
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: 450,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  shutdown(): void {
    this.settingsBtn.destroy();
    this.achievementsBtn.destroy();
    for (const btn of this.levelBtns) {
      btn.destroy();
    }
    this.levelBtns = [];
  }
}
