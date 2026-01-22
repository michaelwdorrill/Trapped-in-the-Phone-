import { AudioManager } from '../audio/AudioManager';

class InputLockClass {
  private _transitionLocked: boolean = false;

  get transitionLocked(): boolean {
    return this._transitionLocked;
  }

  set transitionLocked(value: boolean) {
    this._transitionLocked = value;
  }

  isLocked(): boolean {
    return this._transitionLocked || AudioManager.isSfxLocked();
  }

  lock(): void {
    this._transitionLocked = true;
  }

  unlock(): void {
    this._transitionLocked = false;
  }
}

export const InputLock = new InputLockClass();
