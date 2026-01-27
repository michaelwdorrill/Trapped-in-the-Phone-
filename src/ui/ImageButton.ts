import Phaser from 'phaser';
import { InputLock } from '../utils/InputLock';
import { AudioManager } from '../audio/AudioManager';
import { spawnRainbowBurst } from '../fx/RainbowBurst';

// Animation constants
const POP_SCALE = 1.15; // Scale up by 15% for pop effect
const POP_DURATION = 100; // Duration of scale up/down in ms

export interface ImageButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  texture: string;
  frame?: string;
  callback: () => void;
  skipBurst?: boolean;
  skipPop?: boolean; // Skip the pop animation (for arrows, etc.)
}

export class ImageButton {
  public image: Phaser.GameObjects.Image;
  private scene: Phaser.Scene;
  private callback: () => void;
  private skipBurst: boolean;
  private skipPop: boolean;

  constructor(config: ImageButtonConfig) {
    this.scene = config.scene;
    this.callback = config.callback;
    this.skipBurst = config.skipBurst ?? false;
    this.skipPop = config.skipPop ?? false;

    this.image = this.scene.add.image(config.x, config.y, config.texture, config.frame);
    this.image.setOrigin(0.5, 0.5);
    this.image.setInteractive({ useHandCursor: true });

    this.image.on('pointerdown', this.onPress, this);
  }

  private onPress(): void {
    if (InputLock.isLocked()) {
      return;
    }

    // Play button SFX
    AudioManager.playButtonSfx();

    // Rainbow burst effect
    if (!this.skipBurst) {
      spawnRainbowBurst(this.scene, this.image);
    }

    // Pop animation: scale up then back down, then execute callback
    if (this.skipPop) {
      // No pop animation, execute callback immediately (callback handles its own input locking)
      this.callback();
    } else {
      // Lock input for buttons with pop animation (transition buttons)
      InputLock.lock();
      // Scale up
      this.scene.tweens.add({
        targets: this.image,
        scaleX: POP_SCALE,
        scaleY: POP_SCALE,
        duration: POP_DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Scale back down
          this.scene.tweens.add({
            targets: this.image,
            scaleX: 1,
            scaleY: 1,
            duration: POP_DURATION,
            ease: 'Quad.easeIn',
            onComplete: () => {
              // Execute callback after animation completes
              this.callback();
            },
          });
        },
      });
    }
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
