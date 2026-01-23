import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { CHARACTERS } from '../config/characters';
import { AudioManager } from '../audio/AudioManager';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Show loading progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(170, 450, 200, 30);

    const loadingText = this.add.text(270, 420, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(175, 455, 190 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load all general assets
    for (const asset of ASSETS) {
      if (asset.type === 'image') {
        this.load.image(asset.key, asset.url);
      } else if (asset.type === 'audio') {
        this.load.audio(asset.key, asset.url);
      }
    }

    // Load character assets
    for (const char of CHARACTERS) {
      this.load.image(char.selectKey, char.selectUrl);
      this.load.image(char.levelKey, char.levelUrl);
    }
  }

  create(): void {
    // Start persistent scenes
    this.scene.launch('BackgroundScene');
    this.scene.launch('OverlayScene');

    // Initialize audio manager with overlay scene (persistent)
    const overlayScene = this.scene.get('OverlayScene');
    AudioManager.init(overlayScene);

    // Bring overlay to top
    this.scene.bringToTop('OverlayScene');

    // Start first content scene
    this.scene.start('LaunchScene');
  }
}
