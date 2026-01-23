import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants';

export interface NativeTextInputConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  placeholder?: string;
  maxLength?: number;
  initialValue?: string;
  fontSize?: number;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export class NativeTextInput {
  private scene: Phaser.Scene;
  private inputElement: HTMLInputElement;
  private gameX: number;
  private gameY: number;
  private gameWidth: number;
  private gameHeight: number;
  private onChange?: (value: string) => void;
  private onSubmit?: (value: string) => void;

  constructor(config: NativeTextInputConfig) {
    this.scene = config.scene;
    this.gameX = config.x;
    this.gameY = config.y;
    this.gameWidth = config.width;
    this.gameHeight = config.height;
    this.onChange = config.onChange;
    this.onSubmit = config.onSubmit;

    // Create the HTML input element
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.placeholder = config.placeholder ?? 'Enter name...';
    this.inputElement.maxLength = config.maxLength ?? 12;
    this.inputElement.value = config.initialValue ?? '';

    // Style the input
    const fontSize = config.fontSize ?? 24;
    this.inputElement.style.cssText = `
      position: absolute;
      font-family: Arial, sans-serif;
      font-size: ${fontSize}px;
      text-align: center;
      border: 3px solid #ffffff;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #ffffff;
      padding: 8px;
      outline: none;
      box-sizing: border-box;
      -webkit-appearance: none;
      appearance: none;
    `;

    // Add event listeners
    this.inputElement.addEventListener('input', this.handleInput.bind(this));
    this.inputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.inputElement.addEventListener('blur', this.handleBlur.bind(this));

    // Add to DOM
    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.inputElement);
    } else {
      document.body.appendChild(this.inputElement);
    }

    // Position the input
    this.updatePosition();

    // Listen for resize events to reposition
    this.scene.scale.on('resize', this.updatePosition, this);

    // Also update on scene update in case of scale changes
    this.scene.events.on('update', this.updatePosition, this);
  }

  private handleInput(): void {
    if (this.onChange) {
      this.onChange(this.inputElement.value);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.inputElement.blur();
      if (this.onSubmit) {
        this.onSubmit(this.inputElement.value);
      }
    }
  }

  private handleBlur(): void {
    // Optionally trigger onChange on blur
    if (this.onChange) {
      this.onChange(this.inputElement.value);
    }
  }

  updatePosition(): void {
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate scale factor
    const scaleX = canvasRect.width / GAME_W;
    const scaleY = canvasRect.height / GAME_H;

    // Calculate position relative to canvas
    // gameX and gameY are center coordinates, so adjust for that
    const screenX = canvasRect.left + (this.gameX - this.gameWidth / 2) * scaleX;
    const screenY = canvasRect.top + (this.gameY - this.gameHeight / 2) * scaleY;
    const screenWidth = this.gameWidth * scaleX;
    const screenHeight = this.gameHeight * scaleY;

    this.inputElement.style.left = `${screenX}px`;
    this.inputElement.style.top = `${screenY}px`;
    this.inputElement.style.width = `${screenWidth}px`;
    this.inputElement.style.height = `${screenHeight}px`;
    this.inputElement.style.fontSize = `${Math.floor(18 * Math.min(scaleX, scaleY))}px`;
  }

  getValue(): string {
    return this.inputElement.value;
  }

  setValue(value: string): void {
    this.inputElement.value = value;
  }

  focus(): void {
    this.inputElement.focus();
  }

  blur(): void {
    this.inputElement.blur();
  }

  setVisible(visible: boolean): void {
    this.inputElement.style.display = visible ? 'block' : 'none';
  }

  destroy(): void {
    this.scene.scale.off('resize', this.updatePosition, this);
    this.scene.events.off('update', this.updatePosition, this);
    this.inputElement.removeEventListener('input', this.handleInput.bind(this));
    this.inputElement.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.inputElement.removeEventListener('blur', this.handleBlur.bind(this));

    if (this.inputElement.parentNode) {
      this.inputElement.parentNode.removeChild(this.inputElement);
    }
  }
}
