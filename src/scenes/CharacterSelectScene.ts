import Phaser from 'phaser';
import { CHARACTER_SLIDE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { CHARACTERS, getCharacterIndex } from '../config/characters';
import { GameState } from '../state/GameState';
import { AudioManager } from '../audio/AudioManager';
import { InputLock } from '../utils/InputLock';
import { ImageButton } from '../ui/ImageButton';
import { NativeTextInput } from '../ui/NativeTextInput';
import { spawnRainbowBurst } from '../fx/RainbowBurst';
import { BackgroundScene } from './BackgroundScene';
import { OverlayScene } from './OverlayScene';

// Depth constants for proper layering
const DEPTH_CHARACTER = 20;      // Character portrait
const DEPTH_FRAME = 30;          // Frame border on top (masks character when sliding)
const DEPTH_UI = 40;             // Arrows, buttons, etc.

// Frame image is 350x576. The opaque black border ends 16px from each edge,
// followed by a 4px semi-transparent shadow that renders over the character.
// Mask starts at the shadow edge so character is flush with the black border.
const FRAME_WIDTH = 350;
const FRAME_HEIGHT = 576;
const CUTOUT_OFFSET = 16;
const INNER_WIDTH = FRAME_WIDTH - (CUTOUT_OFFSET * 2);   // 318
const INNER_HEIGHT = FRAME_HEIGHT - (CUTOUT_OFFSET * 2); // 544

export class CharacterSelectScene extends Phaser.Scene {
  private currentIndex: number = 0;
  private characterImage!: Phaser.GameObjects.Image;
  private leftArrowBtn!: ImageButton;
  private rightArrowBtn!: ImageButton;
  private selectBtn!: ImageButton;
  private nameInput!: NativeTextInput;
  private isAnimating: boolean = false;
  private characterMask!: Phaser.Display.Masks.GeometryMask;
  private maskGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    console.log('[CharacterSelectScene] create() called');
    this.isAnimating = false;

    // Register shutdown handler for cleanup
    this.events.on('shutdown', this.shutdown, this);

    // Show background without phone frame (we're "inside" the phone)
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    bgScene.setBackgroundVisible(true);
    bgScene.setPhoneFrameVisible(false);

    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.setMaximizeVisible(true);

    // Ensure BGM is playing
    if (AudioManager.getCurrentBgmKey() !== 'bgm_shuffle') {
      AudioManager.playBgm('bgm_shuffle', true, false);
    }

    // Get current character index
    this.currentIndex = getCharacterIndex(GameState.selectedCharacterId);
    if (this.currentIndex === -1) this.currentIndex = 0;

    // Title card
    this.add.image(
      LAYOUT.characterSelect.title.x,
      LAYOUT.characterSelect.title.y,
      'cs_title'
    ).setOrigin(0.5, 0.5).setDepth(DEPTH_UI);

    // Create geometry mask for the inner frame area (clips characters during slide)
    const frameX = LAYOUT.characterSelect.background.x;
    const frameY = LAYOUT.characterSelect.background.y;
    // Frame image top-left in world coords (origin 0.5, 0.5)
    const frameLeft = frameX - (FRAME_WIDTH / 2);
    const frameTop = frameY - (FRAME_HEIGHT / 2);
    // Inner cutout position: flush with the opaque black border edge
    const innerLeft = frameLeft + CUTOUT_OFFSET;
    const innerTop = frameTop + CUTOUT_OFFSET;

    this.maskGraphics = this.make.graphics({ x: 0, y: 0 });
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillRect(innerLeft, innerTop, INNER_WIDTH, INNER_HEIGHT);
    this.characterMask = this.maskGraphics.createGeometryMask();

    // Character portrait (middle layer) - masked to inner frame area
    const currentChar = CHARACTERS[this.currentIndex];
    this.characterImage = this.add.image(
      LAYOUT.characterSelect.portrait.x,
      LAYOUT.characterSelect.portrait.y,
      currentChar.selectKey
    );
    this.characterImage.setOrigin(0.5, 0.5);
    this.characterImage.setDepth(DEPTH_CHARACTER);
    this.characterImage.setMask(this.characterMask);

    // Frame overlay (on top of character)
    if (this.textures.exists('cs_frame')) {
      this.add.image(
        LAYOUT.characterSelect.background.x,
        LAYOUT.characterSelect.background.y,
        'cs_frame'
      ).setOrigin(0.5, 0.5).setDepth(DEPTH_FRAME);
    }

    // Text entry background (purple rectangle)
    if (this.textures.exists('cs_text_entry')) {
      this.add.image(
        LAYOUT.characterSelect.nameInputBg.x,
        LAYOUT.characterSelect.nameInputBg.y,
        'cs_text_entry'
      ).setOrigin(0.5, 0.5).setDepth(DEPTH_UI);
    }

    // Name input field (HTML input overlaid on purple background)
    const nameLayout = LAYOUT.characterSelect.nameInput;
    this.nameInput = new NativeTextInput({
      scene: this,
      x: nameLayout.x,
      y: nameLayout.y,
      width: nameLayout.width,
      height: nameLayout.height,
      padding: 10, // 10px internal padding from text_entry.png edges
      placeholder: 'Enter name...',
      maxLength: 12,
      initialValue: GameState.playerName,
      onChange: (value) => {
        GameState.playerName = value;
      },
    });

    // Left arrow button (with custom handling for slide animation)
    this.leftArrowBtn = new ImageButton({
      scene: this,
      x: LAYOUT.characterSelect.leftArrow.x,
      y: LAYOUT.characterSelect.leftArrow.y,
      texture: 'cs_left',
      callback: () => this.changeCharacter(-1),
      skipBurst: true, // Rainbow burst is spawned in changeCharacter
    });
    this.leftArrowBtn.image.setDepth(DEPTH_UI);

    // Right arrow button
    this.rightArrowBtn = new ImageButton({
      scene: this,
      x: LAYOUT.characterSelect.rightArrow.x,
      y: LAYOUT.characterSelect.rightArrow.y,
      texture: 'cs_right',
      callback: () => this.changeCharacter(1),
      skipBurst: true, // Rainbow burst is spawned in changeCharacter
    });
    this.rightArrowBtn.image.setDepth(DEPTH_UI);

    // Select button
    this.selectBtn = new ImageButton({
      scene: this,
      x: LAYOUT.characterSelect.selectButton.x,
      y: LAYOUT.characterSelect.selectButton.y,
      texture: 'cs_select',
      callback: () => this.onSelect(),
    });
    this.selectBtn.image.setDepth(DEPTH_UI);
  }

  private changeCharacter(direction: number): void {
    if (this.isAnimating) return;

    // Spawn burst on the arrow
    const arrowImage = direction < 0 ? this.leftArrowBtn.image : this.rightArrowBtn.image;
    spawnRainbowBurst(this, arrowImage);

    this.isAnimating = true;

    // Calculate new index with wrap-around
    const newIndex = (this.currentIndex + direction + CHARACTERS.length) % CHARACTERS.length;
    const newChar = CHARACTERS[newIndex];

    // Calculate positions for slide animation
    // Characters need to start/end FULLY outside the visible frame area
    // Add buffer to account for character width (origin is center)
    const frameX = LAYOUT.characterSelect.background.x;
    const innerHalfWidth = INNER_WIDTH / 2;
    const characterBuffer = 200; // Extra distance to ensure character is fully hidden

    const leftHidden = frameX - innerHalfWidth - characterBuffer;  // Fully hidden left
    const rightHidden = frameX + innerHalfWidth + characterBuffer; // Fully hidden right
    const centerX = LAYOUT.characterSelect.portrait.x;

    // direction > 0 means clicking right arrow, so new char comes from RIGHT
    // direction < 0 means clicking left arrow, so new char comes from LEFT
    const startX = direction > 0 ? rightHidden : leftHidden;
    const exitX = direction > 0 ? leftHidden : rightHidden;

    // Create new character image fully outside the frame (hidden by mask)
    const newImage = this.add.image(startX, LAYOUT.characterSelect.portrait.y, newChar.selectKey);
    newImage.setOrigin(0.5, 0.5);
    newImage.setDepth(DEPTH_CHARACTER);
    newImage.setMask(this.characterMask);

    // Animate both characters simultaneously - old exits, new enters
    this.tweens.add({
      targets: this.characterImage,
      x: exitX,
      duration: CHARACTER_SLIDE_MS,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.characterImage.destroy();
        this.characterImage = newImage;
        this.currentIndex = newIndex;
        this.isAnimating = false;
        InputLock.unlock();
      },
    });

    this.tweens.add({
      targets: newImage,
      x: centerX,
      duration: CHARACTER_SLIDE_MS,
      ease: 'Quad.easeInOut',
    });
  }

  private onSelect(): void {
    // Save selected character
    GameState.selectedCharacterId = CHARACTERS[this.currentIndex].id;

    // Transparent transition to level select (grid stays visible)
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transparentTransitionTo('LevelSelectScene');
  }

  shutdown(): void {
    this.leftArrowBtn.destroy();
    this.rightArrowBtn.destroy();
    this.selectBtn.destroy();
    this.nameInput.destroy();
    if (this.maskGraphics) {
      this.maskGraphics.destroy();
    }
  }
}
