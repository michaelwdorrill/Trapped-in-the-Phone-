import Phaser from 'phaser';
import { GAME_W, CHARACTER_SLIDE_MS } from '../config/constants';
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

export class CharacterSelectScene extends Phaser.Scene {
  private currentIndex: number = 0;
  private characterImage!: Phaser.GameObjects.Image;
  private leftArrowBtn!: ImageButton;
  private rightArrowBtn!: ImageButton;
  private selectBtn!: ImageButton;
  private nameInput!: NativeTextInput;
  private isAnimating: boolean = false;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    console.log('[CharacterSelectScene] create() called');
    this.isAnimating = false;

    // Show background and maximize button
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    bgScene.setBackgroundVisible(true);

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
    ).setOrigin(0.5, 0.5);

    // Name input field
    const nameLayout = LAYOUT.characterSelect.nameInput;
    this.nameInput = new NativeTextInput({
      scene: this,
      x: nameLayout.x,
      y: nameLayout.y,
      width: nameLayout.width,
      height: nameLayout.height,
      placeholder: 'Enter your name...',
      maxLength: 12,
      initialValue: GameState.playerName,
      onChange: (value) => {
        GameState.playerName = value;
      },
    });

    // Background frame
    this.add.image(
      LAYOUT.characterSelect.background.x,
      LAYOUT.characterSelect.background.y,
      'cs_bg'
    ).setOrigin(0.5, 0.5);

    // Character portrait
    const currentChar = CHARACTERS[this.currentIndex];
    this.characterImage = this.add.image(
      LAYOUT.characterSelect.portrait.x,
      LAYOUT.characterSelect.portrait.y,
      currentChar.selectKey
    );
    this.characterImage.setOrigin(0.5, 0.5);

    // Left arrow button (with custom handling for slide animation)
    this.leftArrowBtn = new ImageButton({
      scene: this,
      x: LAYOUT.characterSelect.leftArrow.x,
      y: LAYOUT.characterSelect.leftArrow.y,
      texture: 'cs_left',
      callback: () => this.changeCharacter(-1),
      skipBurst: true,
    });

    // Right arrow button
    this.rightArrowBtn = new ImageButton({
      scene: this,
      x: LAYOUT.characterSelect.rightArrow.x,
      y: LAYOUT.characterSelect.rightArrow.y,
      texture: 'cs_right',
      callback: () => this.changeCharacter(1),
      skipBurst: true,
    });

    // Select button
    this.selectBtn = new ImageButton({
      scene: this,
      x: LAYOUT.characterSelect.selectButton.x,
      y: LAYOUT.characterSelect.selectButton.y,
      texture: 'cs_select',
      callback: () => this.onSelect(),
    });
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

    // Create new character image off-screen
    const startX = direction > 0 ? GAME_W + 150 : -150;
    const newImage = this.add.image(startX, LAYOUT.characterSelect.portrait.y, newChar.selectKey);
    newImage.setOrigin(0.5, 0.5);

    // Slide out old image, slide in new image
    const exitX = direction > 0 ? -150 : GAME_W + 150;

    // Animate old image out
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

    // Animate new image in
    this.tweens.add({
      targets: newImage,
      x: LAYOUT.characterSelect.portrait.x,
      duration: CHARACTER_SLIDE_MS,
      ease: 'Quad.easeInOut',
    });
  }

  private onSelect(): void {
    // Save selected character
    GameState.selectedCharacterId = CHARACTERS[this.currentIndex].id;

    // Transition to level select
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transitionTo('LevelSelectScene');
  }

  shutdown(): void {
    this.leftArrowBtn.destroy();
    this.rightArrowBtn.destroy();
    this.selectBtn.destroy();
    this.nameInput.destroy();
  }
}
