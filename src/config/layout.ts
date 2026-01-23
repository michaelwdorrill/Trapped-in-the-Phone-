// All coordinates are for 540x960 design space
// All UI images use origin at center (0.5, 0.5)

export const LAYOUT = {
  // Universal
  maximize: { x: 505, y: 925 },

  // Launch
  launch: { x: 270, y: 480 },

  // Start Menu
  startMenu: {
    title: { x: 270, y: 200 },
    startButton: { x: 270, y: 537 },
    settingsButton: { x: 270, y: 662 },
  },

  // Settings
  settings: {
    header: { x: 270, y: 200 },
    musicLabel: { x: 270, y: 400 },
    musicSliderBg: { x: 270, y: 475 },
    musicTrack: { x: 270, y: 475 },
    musicKnob: { x: 320, y: 475 },
    sfxLabel: { x: 270, y: 600 },
    sfxSliderBg: { x: 270, y: 675 },
    sfxTrack: { x: 270, y: 675 },
    sfxKnob: { x: 320, y: 675 },
    backButton: { x: 60, y: 925 },
  },

  // Cutscene
  cutscene: { x: 270, y: 480 },

  // Character Select
  characterSelect: {
    title: { x: 270, y: 96 },
    nameInput: { x: 270, y: 185, width: 280, height: 50 },
    background: { x: 270, y: 479 },
    portrait: { x: 270, y: 479 },
    leftArrow: { x: 44, y: 479 },
    rightArrow: { x: 496, y: 479 },
    selectButton: { x: 270, y: 854 },
  },

  // Level Select
  levelSelect: {
    title: { x: 182.5, y: 125 },
    portraitFrame: { x: 440, y: 125 },
    portrait: { x: 440, y: 125 },
    level1: { x: 150, y: 350 },
    level2: { x: 390, y: 350 },
    level3: { x: 150, y: 590 },
    level4: { x: 390, y: 590 },
    settingsButton: { x: 147, y: 897 },
    achievementsButton: { x: 357, y: 897 },
  },
};
