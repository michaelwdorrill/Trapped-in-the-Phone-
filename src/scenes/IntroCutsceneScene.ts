import Phaser from 'phaser';
import { GAME_W, GAME_H, CUTSCENE_HOLD_MS, CUTSCENE_WIPE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { InputLock } from '../utils/InputLock';
import { BackgroundScene } from './BackgroundScene';
import { OverlayScene } from './OverlayScene';

export class IntroCutsceneScene extends Phaser.Scene {
  private slides: Phaser.GameObjects.Image[] = [];
  private currentSlideIndex: number = 0;
  private isSkipping: boolean = false;
  private isEnding: boolean = false;

  constructor() {
    super({ key: 'IntroCutsceneScene' });
  }

  create(): void {
    this.isSkipping = false;
    this.isEnding = false;
    this.currentSlideIndex = 0;
    this.slides = [];

    // Hide background and maximize button
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    bgScene.setBackgroundVisible(false);

    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.setMaximizeVisible(false);

    // Create all slides (initially only first visible)
    const slideKeys = ['intro_1', 'intro_2', 'intro_3'];
    for (let i = 0; i < slideKeys.length; i++) {
      const slide = this.add.image(LAYOUT.cutscene.x, LAYOUT.cutscene.y, slideKeys[i]);
      slide.setOrigin(0.5, 0.5);
      slide.setVisible(i === 0);
      this.slides.push(slide);
    }

    // Set up skip listener
    this.input.on('pointerdown', this.onTap, this);

    // Start the slideshow - timer starts after fade-in is complete
    this.scheduleNextTransition();
  }

  private onTap(): void {
    // Only allow skip if cutscene has been seen before and no transition is active
    if (GameState.hasSeenIntroCutscene && !this.isSkipping && !this.isEnding && !InputLock.isLocked()) {
      this.skipCutscene();
    }
  }

  private skipCutscene(): void {
    this.isSkipping = true;
    this.tweens.killAll();
    this.time.removeAllEvents();

    // Transition to start menu
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transitionTo('StartMenuScene');
  }

  private scheduleNextTransition(): void {
    if (this.isSkipping || this.isEnding) return;

    // After showing current slide for CUTSCENE_HOLD_MS, move to next
    this.time.delayedCall(CUTSCENE_HOLD_MS, () => {
      if (this.isSkipping || this.isEnding) return;

      const nextIndex = this.currentSlideIndex + 1;

      if (nextIndex >= this.slides.length) {
        // No more slides, end the cutscene
        this.endCutscene();
      } else {
        // Fade to next slide
        this.fadeToSlide(nextIndex);
      }
    });
  }

  private fadeToSlide(nextIndex: number): void {
    if (this.isSkipping || this.isEnding) return;

    const currentSlide = this.slides[this.currentSlideIndex];
    const nextSlide = this.slides[nextIndex];

    // Set up next slide: visible but transparent, behind current slide
    nextSlide.setVisible(true);
    nextSlide.setAlpha(0);
    nextSlide.setDepth(0);
    currentSlide.setDepth(1);

    // Cross-fade: fade out current while fading in next
    this.tweens.add({
      targets: currentSlide,
      alpha: 0,
      duration: CUTSCENE_WIPE_MS,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: nextSlide,
      alpha: 1,
      duration: CUTSCENE_WIPE_MS,
      ease: 'Linear',
      onComplete: () => {
        if (this.isSkipping || this.isEnding) return;

        // Hide previous slide
        currentSlide.setVisible(false);
        currentSlide.setAlpha(1); // Reset for potential reuse
        this.currentSlideIndex = nextIndex;

        // Schedule next transition
        this.scheduleNextTransition();
      },
    });
  }

  private endCutscene(): void {
    if (this.isEnding) return;
    this.isEnding = true;

    // Mark cutscene as seen
    GameState.hasSeenIntroCutscene = true;

    // Lock input during transition
    InputLock.lock();

    // Get overlay scene reference BEFORE stopping this scene
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;

    // Create a black rectangle for fade transition
    const blackRect = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000);
    blackRect.setOrigin(0.5, 0.5);
    blackRect.setDepth(100);
    blackRect.setAlpha(0);

    // Fade to black
    this.tweens.add({
      targets: blackRect,
      alpha: 1,
      duration: CUTSCENE_WIPE_MS,
      ease: 'Linear',
      onComplete: () => {
        // Use the overlay scene to handle the transition (since it persists)
        overlayScene.completeWipeTransition('StartMenuScene');
      },
    });
  }

  shutdown(): void {
    this.input.off('pointerdown', this.onTap, this);
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
