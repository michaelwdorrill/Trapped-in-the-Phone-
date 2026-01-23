class InputLockClass {
  private _locked: boolean = false;

  isLocked(): boolean {
    return this._locked;
  }

  lock(): void {
    this._locked = true;
  }

  unlock(): void {
    this._locked = false;
  }
}

export const InputLock = new InputLockClass();
