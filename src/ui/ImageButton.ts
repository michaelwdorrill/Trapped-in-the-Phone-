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

  private async onPress(): Promise<void> {
    if (InputLock.isLocked()) {
      return;
    }

    // Lock input during press handling
    InputLock.lock();

    // Play button SFX
    AudioManager.playButtonSfx();

    // Spawn rainbow burst behind the button
    if (!this.skipBurst) {
      spawnRainbowBurst(this.scene, this.image);
    }

    // Small delay to let burst start, then execute callback
    this.scene.time.delayedCall(50, () => {
      this.callback();
    });
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
