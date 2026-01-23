import Phaser from 'phaser';
import { InputLock } from '../utils/InputLock';
import { AudioManager } from '../audio/AudioManager';
import { spawnRainbowBurst } from '../fx/RainbowBurst';

export interface ImageButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  texture: string;
  frame?: string;
  callback: () => void;
  skipBurst?: boolean;
}

export class ImageButton {
  public image: Phaser.GameObjects.Image;
  private scene: Phaser.Scene;
  private callback: () => void;
  private skipBurst: boolean;

  constructor(config: ImageButtonConfig) {
    this.scene = config.scene;
    this.callback = config.callback;
    this.skipBurst = config.skipBurst ?? false;

    this.image = this.scene.add.image(config.x, config.y, config.texture, config.frame);
    this.image.setOrigin(0.5, 0.5);
    this.image.setInteractive({ useHandCursor: true });

    this.image.on('pointerdown', this.onPress, this);
  }

  private onPress(): void {
    if (InputLock.isLocked()) {
      return;
    }

    // Play button SFX (fire and forget)
    AudioManager.playButtonSfx();

    // Spawn rainbow burst behind the button
    if (!this.skipBurst) {
      spawnRainbowBurst(this.scene, this.image);
    }

    // Execute callback immediately - it will handle locking via transition
    this.callback();
  }

  setVisible(visible: boolean): this {
    this.image.setVisible(visible);
    return this;
  }

  setTexture(texture: string, frame?: string): this {
    this.image.setTexture(texture, frame);
    return this;
  }

  setDepth(depth: number): this {
    this.image.setDepth(depth);
    return this;
  }

  setPosition(x: number, y: number): this {
    this.image.setPosition(x, y);
    return this;
  }

  destroy(): void {
    this.image.off('pointerdown', this.onPress, this);
    this.image.destroy();
  }
}
