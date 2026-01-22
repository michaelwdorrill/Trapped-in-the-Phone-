import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config/constants';

// Import all scenes
import { PreloadScene } from './scenes/PreloadScene';
import { BackgroundScene } from './scenes/BackgroundScene';
import { OverlayScene } from './scenes/OverlayScene';
import { LaunchScene } from './scenes/LaunchScene';
import { IntroCutsceneScene } from './scenes/IntroCutsceneScene';
import { StartMenuScene } from './scenes/StartMenuScene';
import { SettingsScene } from './scenes/SettingsScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    PreloadScene,
    BackgroundScene,
    OverlayScene,
    LaunchScene,
    IntroCutsceneScene,
    StartMenuScene,
    SettingsScene,
    CharacterSelectScene,
    LevelSelectScene,
  ],
  audio: {
    disableWebAudio: false,
  },
  input: {
    activePointers: 1,
  },
};

// Create the Phaser game instance
const game = new Phaser.Game(config);

// Export for potential external access
export { game };
