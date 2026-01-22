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
    // Only allow skip if cutscene has been seen before
    if (GameState.hasSeenIntroCutscene && !this.isSkipping && !this.isEnding) {
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
        // Wipe to next slide
        this.wipeToSlide(nextIndex);
      }
    });
  }

  private wipeToSlide(nextIndex: number): void {
    if (this.isSkipping || this.isEnding) return;

    const currentSlide = this.slides[this.currentSlideIndex];
    const nextSlide = this.slides[nextIndex];

    // Position next slide and make visible, but crop it initially
    nextSlide.setVisible(true);
    nextSlide.setCrop(0, 0, 0, nextSlide.height);

    // Animate crop width from 0 to full width (wipe from left)
    this.tweens.addCounter({
      from: 0,
      to: GAME_W,
      duration: CUTSCENE_WIPE_MS,
      ease: 'Linear',
      onUpdate: (tween) => {
        const value = Math.floor(tween.getValue() ?? 0);
        nextSlide.setCrop(0, 0, value, nextSlide.height);
      },
      onComplete: () => {
        if (this.isSkipping || this.isEnding) return;

        // Hide previous slide and clear crop on new slide
        currentSlide.setVisible(false);
        nextSlide.setCrop();
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

    // Create a black rectangle for wipe transition
    const blackRect = this.add.rectangle(0, GAME_H / 2, 0, GAME_H, 0x000000);
    blackRect.setOrigin(0, 0.5);
    blackRect.setDepth(100);

    // Wipe black in from left
    this.tweens.add({
      targets: blackRect,
      width: GAME_W,
      duration: CUTSCENE_WIPE_MS,
      ease: 'Linear',
      onComplete: () => {
        // Start the new scene first, then stop this one
        this.scene.start('StartMenuScene');
        this.scene.stop('IntroCutsceneScene');

        // Fade out the overlay's black rectangle
        overlayScene.fadeFromBlack();
      },
    });
  }

  shutdown(): void {
    this.input.off('pointerdown', this.onTap, this);
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
