const STORAGE_KEYS = {
  BGM_VOLUME: 'trapped_bgmVolume',
  SFX_VOLUME: 'trapped_sfxVolume',
  HAS_SEEN_INTRO: 'trapped_hasSeenIntroCutscene',
  SELECTED_CHARACTER: 'trapped_selectedCharacter',
  PLAYER_NAME: 'trapped_playerName',
};

class GameStateClass {
  private _selectedCharacterId: string = 'Char_1';
  private _returnSceneKey: string | null = null;
  private _bgmVolume: number = 0.74;
  private _sfxVolume: number = 0.74;
  private _hasSeenIntroCutscene: boolean = false;
  private _isMaximized: boolean = false;
  private _playerName: string = '';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const bgmVol = localStorage.getItem(STORAGE_KEYS.BGM_VOLUME);
      if (bgmVol !== null) {
        this._bgmVolume = parseFloat(bgmVol);
      }

      const sfxVol = localStorage.getItem(STORAGE_KEYS.SFX_VOLUME);
      if (sfxVol !== null) {
        this._sfxVolume = parseFloat(sfxVol);
      }

      const hasSeenIntro = localStorage.getItem(STORAGE_KEYS.HAS_SEEN_INTRO);
      if (hasSeenIntro !== null) {
        this._hasSeenIntroCutscene = hasSeenIntro === 'true';
      }

      const selectedChar = localStorage.getItem(STORAGE_KEYS.SELECTED_CHARACTER);
      if (selectedChar !== null) {
        this._selectedCharacterId = selectedChar;
      }

      const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      if (playerName !== null) {
        this._playerName = playerName;
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }

  private saveToStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  get selectedCharacterId(): string {
    return this._selectedCharacterId;
  }

  set selectedCharacterId(value: string) {
    this._selectedCharacterId = value;
    this.saveToStorage(STORAGE_KEYS.SELECTED_CHARACTER, value);
  }

  get returnSceneKey(): string | null {
    return this._returnSceneKey;
  }

  set returnSceneKey(value: string | null) {
    this._returnSceneKey = value;
  }

  get bgmVolume(): number {
    return this._bgmVolume;
  }

  set bgmVolume(value: number) {
    this._bgmVolume = Math.max(0, Math.min(1, value));
    this.saveToStorage(STORAGE_KEYS.BGM_VOLUME, this._bgmVolume.toString());
  }

  get sfxVolume(): number {
    return this._sfxVolume;
  }

  set sfxVolume(value: number) {
    this._sfxVolume = Math.max(0, Math.min(1, value));
    this.saveToStorage(STORAGE_KEYS.SFX_VOLUME, this._sfxVolume.toString());
  }

  get hasSeenIntroCutscene(): boolean {
    return this._hasSeenIntroCutscene;
  }

  set hasSeenIntroCutscene(value: boolean) {
    this._hasSeenIntroCutscene = value;
    this.saveToStorage(STORAGE_KEYS.HAS_SEEN_INTRO, value.toString());
  }

  get isMaximized(): boolean {
    return this._isMaximized;
  }

  set isMaximized(value: boolean) {
    this._isMaximized = value;
  }

  get playerName(): string {
    return this._playerName;
  }

  set playerName(value: string) {
    this._playerName = value;
    this.saveToStorage(STORAGE_KEYS.PLAYER_NAME, value);
  }
}

export const GameState = new GameStateClass();
