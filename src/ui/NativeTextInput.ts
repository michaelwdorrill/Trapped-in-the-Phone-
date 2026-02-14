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
  padding?: number; // Internal padding from edges
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

// Unique ID counter for input elements
let inputIdCounter = 0;

export class NativeTextInput {
  private scene: Phaser.Scene;
  private inputElement: HTMLInputElement;
  private styleElement: HTMLStyleElement;
  private inputId: string;
  private gameX: number;
  private gameY: number;
  private gameWidth: number;
  private gameHeight: number;
  private padding: number;
  private onChange?: (value: string) => void;
  private onSubmit?: (value: string) => void;

  // Bound event handlers (stored so we can remove them later)
  private boundHandleInput: () => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleBlur: () => void;
  private boundUpdatePosition: () => void;
  private boundHandleOutsideClick: (e: Event) => void;

  constructor(config: NativeTextInputConfig) {
    this.scene = config.scene;
    this.gameX = config.x;
    this.gameY = config.y;
    this.gameWidth = config.width;
    this.gameHeight = config.height;
    this.padding = config.padding ?? 0;
    this.onChange = config.onChange;
    this.onSubmit = config.onSubmit;

    // Generate unique ID for this input
    this.inputId = `native-text-input-${inputIdCounter++}`;

    // Create the HTML input element
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.id = this.inputId;
    this.inputElement.placeholder = config.placeholder ?? 'Enter name...';
    this.inputElement.maxLength = config.maxLength ?? 12;
    this.inputElement.value = config.initialValue ?? '';

    // Style the input - transparent so Phaser background shows through
    // Uses PressStart2P pixel font
    const fontSize = config.fontSize ?? 16;
    this.inputElement.style.cssText = `
      position: absolute;
      font-family: 'PressStart2P', monospace;
      font-size: ${fontSize}px;
      text-align: center;
      border: none;
      border-radius: 0;
      background-color: transparent;
      color: #ffffff;
      padding: 0;
      outline: none;
      box-sizing: border-box;
      -webkit-appearance: none;
      appearance: none;
      line-height: 1.2;
    `;

    // Create style element for placeholder pseudo-element (can't be done inline)
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      #${this.inputId}::placeholder {
        color: #999999;
        opacity: 1;
      }
      #${this.inputId}::-webkit-input-placeholder {
        color: #999999;
      }
      #${this.inputId}::-moz-placeholder {
        color: #999999;
        opacity: 1;
      }
    `;
    document.head.appendChild(this.styleElement);

    // Create bound handlers (so we can remove them later)
    this.boundHandleInput = this.handleInput.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleBlur = this.handleBlur.bind(this);
    this.boundUpdatePosition = this.updatePosition.bind(this);
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);

    // Add event listeners
    this.inputElement.addEventListener('input', this.boundHandleInput);
    this.inputElement.addEventListener('keydown', this.boundHandleKeyDown);
    this.inputElement.addEventListener('blur', this.boundHandleBlur);

    // Listen for clicks/touches outside the input to blur it (dismisses mobile keyboard)
    document.addEventListener('touchstart', this.boundHandleOutsideClick, true);
    document.addEventListener('mousedown', this.boundHandleOutsideClick, true);

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
    this.scene.scale.on('resize', this.boundUpdatePosition);

    // Also update on scene update in case of scale changes
    this.scene.events.on('update', this.boundUpdatePosition);
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

  private handleOutsideClick(event: Event): void {
    // If click/touch is outside the input, blur it to dismiss keyboard
    if (event.target !== this.inputElement) {
      this.inputElement.blur();
    }
  }

  updatePosition(): void {
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const container = document.getElementById('game-container');

    // Calculate scale factor
    const scaleX = canvasRect.width / GAME_W;
    const scaleY = canvasRect.height / GAME_H;

    // Calculate inner dimensions (accounting for padding on each side)
    const innerWidth = this.gameWidth - (this.padding * 2);
    const innerHeight = this.gameHeight - (this.padding * 2);

    // Calculate position relative to game canvas (not container)
    // gameX and gameY are center coordinates, so adjust for that
    const canvasX = (this.gameX - innerWidth / 2) * scaleX;
    const canvasY = (this.gameY - innerHeight / 2) * scaleY;
    const screenWidth = innerWidth * scaleX;
    const screenHeight = innerHeight * scaleY;

    // Get canvas offset within the container (due to CENTER_BOTH scaling)
    let offsetX = 0;
    let offsetY = 0;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      offsetX = canvasRect.left - containerRect.left;
      offsetY = canvasRect.top - containerRect.top;
    }

    this.inputElement.style.left = `${canvasX + offsetX}px`;
    this.inputElement.style.top = `${canvasY + offsetY}px`;
    this.inputElement.style.width = `${screenWidth}px`;
    this.inputElement.style.height = `${screenHeight}px`;

    // Scale font size with canvas, using PressStart2P which is a pixel font
    const baseFontSize = 14;
    this.inputElement.style.fontSize = `${Math.floor(baseFontSize * Math.min(scaleX, scaleY))}px`;
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
    // Remove Phaser event listeners
    this.scene.scale.off('resize', this.boundUpdatePosition);
    this.scene.events.off('update', this.boundUpdatePosition);

    // Remove DOM event listeners
    this.inputElement.removeEventListener('input', this.boundHandleInput);
    this.inputElement.removeEventListener('keydown', this.boundHandleKeyDown);
    this.inputElement.removeEventListener('blur', this.boundHandleBlur);
    document.removeEventListener('touchstart', this.boundHandleOutsideClick, true);
    document.removeEventListener('mousedown', this.boundHandleOutsideClick, true);

    // Remove input element from DOM
    if (this.inputElement.parentNode) {
      this.inputElement.parentNode.removeChild(this.inputElement);
    }

    // Remove style element from DOM
    if (this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
  }
}
