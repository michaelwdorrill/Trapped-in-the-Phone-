import Phaser from 'phaser';
import { GAME_W, CUTSCENE_HOLD_MS, CUTSCENE_WIPE_MS } from '../config/constants';
import { LAYOUT } from '../config/layout';
import { GameState } from '../state/GameState';
import { BackgroundScene } from './BackgroundScene';
import { OverlayScene } from './OverlayScene';

export class IntroCutsceneScene extends Phaser.Scene {
  private slides: Phaser.GameObjects.Image[] = [];
  private currentSlideIndex: number = 0;
  private isSkipping: boolean = false;
  private timeline: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'IntroCutsceneScene' });
  }

  create(): void {
    this.isSkipping = false;
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

    // Start the slideshow
    this.startSlideshow();
  }

  private onTap(): void {
    // Only allow skip if cutscene has been seen before
    if (GameState.hasSeenIntroCutscene && !this.isSkipping) {
      this.skipCutscene();
    }
  }

  private skipCutscene(): void {
    this.isSkipping = true;

    // Cancel any ongoing timeline
    if (this.timeline) {
      this.timeline.remove();
      this.timeline = null;
    }

    // Transition to start menu
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transitionTo('StartMenuScene');
  }

  private startSlideshow(): void {
    // Show slide 1 for CUTSCENE_HOLD_MS
    this.time.delayedCall(CUTSCENE_HOLD_MS, () => {
      if (this.isSkipping) return;
      this.wipeToSlide(1);
    });
  }

  private wipeToSlide(slideIndex: number): void {
    if (this.isSkipping || slideIndex >= this.slides.length) {
      // End of cutscene
      this.endCutscene();
      return;
    }

    const currentSlide = this.slides[this.currentSlideIndex];
    const nextSlide = this.slides[slideIndex];

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
        const rawValue = tween.getValue();
        const value = Math.floor(rawValue ?? 0);
        nextSlide.setCrop(0, 0, value, nextSlide.height);
      },
      onComplete: () => {
        if (this.isSkipping) return;

        // Hide previous slide
        currentSlide.setVisible(false);
        this.currentSlideIndex = slideIndex;

        // Show current slide for CUTSCENE_HOLD_MS, then wipe to next
        this.time.delayedCall(CUTSCENE_HOLD_MS, () => {
          if (this.isSkipping) return;
          this.wipeToSlide(slideIndex + 1);
        });
      },
    });
  }

  private endCutscene(): void {
    if (this.isSkipping) return;

    // Mark cutscene as seen
    GameState.hasSeenIntroCutscene = true;

    // Transition to start menu
    const overlayScene = this.scene.get('OverlayScene') as OverlayScene;
    overlayScene.transitionTo('StartMenuScene');
  }

  shutdown(): void {
    this.input.off('pointerdown', this.onTap, this);
    if (this.timeline) {
      this.timeline.remove();
      this.timeline = null;
    }
  }
}
