import Phaser from 'phaser';
import { InputLock } from '../utils/InputLock';
import { AudioManager } from '../audio/AudioManager';
// import { spawnRainbowBurst } from '../fx/RainbowBurst';

// Animation constants
const POP_SCALE = 1.08; // Scale up by 8% for pop effect
const POP_DURATION = 80; // Duration of scale up/down in ms (fast pop)

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
  private isAnimating: boolean = false;

  constructor(config: ImageButtonConfig) {
    this.scene = config.scene;
    this.callback = config.callback;

    this.image = this.scene.add.image(config.x, config.y, config.texture, config.frame);
    this.image.setOrigin(0.5, 0.5);
    this.image.setInteractive({ useHandCursor: true });

    this.image.on('pointerdown', this.onPress, this);
  }

  private onPress(): void {
    console.log('[ImageButton] onPress called, locked:', InputLock.isLocked(), 'animating:', this.isAnimating);

    // Block if input is locked OR if we're already animating this button
    if (InputLock.isLocked() || this.isAnimating) {
      console.log('[ImageButton] Input locked or animating, ignoring');
      return;
    }

    // Play button SFX
    AudioManager.playButtonSfx();

    // Mark as animating to prevent double-clicks during pop
    this.isAnimating = true;
    console.log('[ImageButton] Starting pop animation');

    // Pop animation: scale up then back down, then execute callback
    // NO input locking here - callback handles its own locking if needed
    this.scene.tweens.add({
      targets: this.image,
      scaleX: POP_SCALE,
      scaleY: POP_SCALE,
      duration: POP_DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => {
        console.log('[ImageButton] Pop up complete, scaling back down');
        // Scale back down
        this.scene.tweens.add({
          targets: this.image,
          scaleX: 1,
          scaleY: 1,
          duration: POP_DURATION,
          ease: 'Quad.easeIn',
          onComplete: () => {
            console.log('[ImageButton] Pop animation complete, executing callback');
            this.isAnimating = false;
            // Execute callback after animation completes
            this.callback();
          },
        });
      },
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
