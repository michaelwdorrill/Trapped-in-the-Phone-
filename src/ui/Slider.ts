import Phaser from 'phaser';

export interface SliderConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  bgTexture: string;
  trackTexture: string;
  knobTexture: string;
  initialValue?: number;
  onChange: (value: number) => void;
}

export class Slider {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Image;
  private track: Phaser.GameObjects.Image;
  private knob: Phaser.GameObjects.Image;
  private onChange: (value: number) => void;

  private minX: number;
  private maxX: number;
  private isDragging: boolean = false;
  private value: number = 0.74;

  constructor(config: SliderConfig) {
    this.scene = config.scene;
    this.onChange = config.onChange;

    // Create track (bottom layer)
    this.track = this.scene.add.image(config.x, config.y, config.trackTexture);
    this.track.setOrigin(0.5, 0.5);

    // Create background (middle layer, renders above track)
    this.bg = this.scene.add.image(config.x, config.y, config.bgTexture);
    this.bg.setOrigin(0.5, 0.5);

    // Create knob
    this.knob = this.scene.add.image(config.x, config.y, config.knobTexture);
    this.knob.setOrigin(0.5, 0.5);

    // Calculate bounds based on track width
    const trackHalfWidth = this.track.width / 2;
    const knobHalfWidth = this.knob.width / 2;
    this.minX = config.x - trackHalfWidth + knobHalfWidth;
    this.maxX = config.x + trackHalfWidth - knobHalfWidth;

    // Set initial value
    const initialValue = config.initialValue ?? 0.74;
    this.setValue(initialValue);

    // Make knob interactive
    this.knob.setInteractive({ useHandCursor: true, draggable: true });

    // Make track/bg clickable
    this.track.setInteractive({ useHandCursor: true });
    this.bg.setInteractive({ useHandCursor: true });

    // Drag events on knob
    this.scene.input.on('drag', this.onDrag, this);
    this.knob.on('dragstart', () => {
      this.isDragging = true;
    });
    this.knob.on('dragend', () => {
      this.isDragging = false;
    });

    // Click on track/bg to move knob
    this.track.on('pointerdown', this.onTrackClick, this);
    this.bg.on('pointerdown', this.onTrackClick, this);
  }

  private onDrag(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    dragX: number
  ): void {
    if (gameObject !== this.knob) return;

    // Clamp knob position
    const clampedX = Phaser.Math.Clamp(dragX, this.minX, this.maxX);
    this.knob.x = clampedX;

    // Calculate and emit value
    this.value = (clampedX - this.minX) / (this.maxX - this.minX);
    this.onChange(this.value);
  }

  private onTrackClick(pointer: Phaser.Input.Pointer): void {
    if (this.isDragging) return;

    // Move knob to click position
    const clampedX = Phaser.Math.Clamp(pointer.x, this.minX, this.maxX);
    this.knob.x = clampedX;

    // Calculate and emit value
    this.value = (clampedX - this.minX) / (this.maxX - this.minX);
    this.onChange(this.value);
  }

  setValue(value: number): void {
    this.value = Phaser.Math.Clamp(value, 0, 1);
    this.knob.x = this.minX + this.value * (this.maxX - this.minX);
  }

  getValue(): number {
    return this.value;
  }

  setDepth(depth: number): void {
    this.track.setDepth(depth);
    this.bg.setDepth(depth + 1);
    this.knob.setDepth(depth + 2);
  }

  destroy(): void {
    this.scene.input.off('drag', this.onDrag, this);
    this.bg.destroy();
    this.track.destroy();
    this.knob.destroy();
  }
}
