import Phaser from 'phaser';
import { GameState } from '../state/GameState';

class AudioManagerClass {
  private scene: Phaser.Scene | null = null;
  private currentBgm: Phaser.Sound.BaseSound | null = null;
  private currentBgmKey: string | null = null;
  private sfxLocked: boolean = false;
  private initialized: boolean = false;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.initialized = true;
  }

  playBgm(key: string, loop: boolean = true, restartIfSame: boolean = false): void {
    if (!this.scene || !this.initialized) return;

    // If the same BGM is already playing and we don't want to restart, do nothing
    if (this.currentBgmKey === key && this.currentBgm && !restartIfSame) {
      return;
    }

    // Stop current BGM if different
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = null;
    }

    // Play new BGM
    this.currentBgm = this.scene.sound.add(key, {
      loop,
      volume: GameState.bgmVolume,
    });
    this.currentBgm.play();
    this.currentBgmKey = key;
  }

  switchBgm(newKey: string, fadeOutMs: number = 500, fadeInMs: number = 500): void {
    if (!this.scene || !this.initialized) return;

    if (this.currentBgmKey === newKey) return;

    if (this.currentBgm && 'setVolume' in this.currentBgm) {
      const webAudioSound = this.currentBgm as Phaser.Sound.WebAudioSound;

      // Fade out current BGM
      this.scene.tweens.add({
        targets: webAudioSound,
        volume: 0,
        duration: fadeOutMs,
        onComplete: () => {
          if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm.destroy();
            this.currentBgm = null;
          }
          this.startNewBgmWithFade(newKey, fadeInMs);
        },
      });
    } else {
      // No current BGM, just start new one
      this.startNewBgmWithFade(newKey, fadeInMs);
    }
  }

  private startNewBgmWithFade(key: string, fadeInMs: number): void {
    if (!this.scene) return;

    this.currentBgm = this.scene.sound.add(key, {
      loop: true,
      volume: 0,
    });
    this.currentBgm.play();
    this.currentBgmKey = key;

    if ('setVolume' in this.currentBgm) {
      this.scene.tweens.add({
        targets: this.currentBgm,
        volume: GameState.bgmVolume,
        duration: fadeInMs,
      });
    }
  }

  async playButtonSfx(): Promise<void> {
    if (!this.scene || !this.initialized || this.sfxLocked) {
      return Promise.resolve();
    }

    this.sfxLocked = true;

    return new Promise((resolve) => {
      const sfx = this.scene!.sound.add('sfx_button', {
        volume: GameState.sfxVolume,
      });

      sfx.once('complete', () => {
        sfx.destroy();
        this.sfxLocked = false;
        resolve();
      });

      // Fallback timeout in case 'complete' doesn't fire (for short sounds)
      const duration = (sfx as Phaser.Sound.WebAudioSound).duration || 0.5;
      setTimeout(() => {
        if (this.sfxLocked) {
          this.sfxLocked = false;
          resolve();
        }
      }, duration * 1000 + 100);

      sfx.play();
    });
  }

  setBgmVolume(volume: number): void {
    GameState.bgmVolume = volume;
    if (this.currentBgm && 'setVolume' in this.currentBgm) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(volume);
    }
  }

  setSfxVolume(volume: number): void {
    GameState.sfxVolume = volume;
  }

  isSfxLocked(): boolean {
    return this.sfxLocked;
  }

  getCurrentBgmKey(): string | null {
    return this.currentBgmKey;
  }
}

export const AudioManager = new AudioManagerClass();
