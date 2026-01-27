export interface AssetEntry {
  key: string;
  url: string;
  type: 'image' | 'audio';
}

export const ASSETS: AssetEntry[] = [
  // Launch
  { key: 'launch_screen', url: 'Assets/Launch/LaunchScreen.png', type: 'image' },

  // Start screen
  { key: 'start_bg', url: 'Assets/Start_Screen/Background.png', type: 'image' },
  { key: 'start_title', url: 'Assets/Start_Screen/TitleCard.png', type: 'image' },
  { key: 'btn_startgame', url: 'Assets/Start_Screen/StartGame.png', type: 'image' },
  { key: 'btn_settings', url: 'Assets/Start_Screen/Settings.png', type: 'image' },
  { key: 'btn_maximize', url: 'Assets/Start_Screen/Maximize.png', type: 'image' },
  { key: 'btn_minimize', url: 'Assets/Start_Screen/Minimize.png', type: 'image' },

  // Settings
  { key: 'settings_header', url: 'Assets/Settings/Header.png', type: 'image' },
  { key: 'label_music', url: 'Assets/Settings/Music_Volume_Header.png', type: 'image' },
  { key: 'label_sfx', url: 'Assets/Settings/SFX_Volume_Header.png', type: 'image' },
  { key: 'slider_bg', url: 'Assets/Settings/Slider_Bar_Background.png', type: 'image' },
  { key: 'slider_track', url: 'Assets/Settings/Slider_Bar.png', type: 'image' },
  { key: 'slider_knob', url: 'Assets/Settings/Slider_Dot.png', type: 'image' },
  { key: 'btn_back', url: 'Assets/Settings/Back.png', type: 'image' },

  // Cutscene slides
  { key: 'intro_1', url: 'Assets/Cutscene_Slides/Intro/1.png', type: 'image' },
  { key: 'intro_2', url: 'Assets/Cutscene_Slides/Intro/2.png', type: 'image' },
  { key: 'intro_3', url: 'Assets/Cutscene_Slides/Intro/3.png', type: 'image' },

  // Character select
  { key: 'cs_title', url: 'Assets/Character_Select/Select_Character_Title_Card.png', type: 'image' },
  { key: 'cs_bg', url: 'Assets/Character_Select/Character_Background.png', type: 'image' },
  { key: 'cs_frame', url: 'Assets/Character_Select/Character_Frame.png', type: 'image' },
  { key: 'cs_text_entry', url: 'Assets/Character_Select/Text_Entry.png', type: 'image' },
  { key: 'cs_left', url: 'Assets/Character_Select/Left_arrow.png', type: 'image' },
  { key: 'cs_right', url: 'Assets/Character_Select/Right_arrow.png', type: 'image' },
  { key: 'cs_select', url: 'Assets/Character_Select/Select_Character.png', type: 'image' },

  // Level select
  { key: 'ls_title', url: 'Assets/Level_Select/Title_Card.png', type: 'image' },
  { key: 'ls_frame', url: 'Assets/Level_Select/Character_Portrait_Frame.png', type: 'image' },
  { key: 'lvl1', url: 'Assets/Level_Select/Level_1.png', type: 'image' },
  { key: 'lvl2', url: 'Assets/Level_Select/Level_2.png', type: 'image' },
  { key: 'lvl3', url: 'Assets/Level_Select/Level_3.png', type: 'image' },
  { key: 'lvl4', url: 'Assets/Level_Select/Level_4.png', type: 'image' },
  { key: 'ls_settings', url: 'Assets/Level_Select/Settings_Button.png', type: 'image' },
  { key: 'ls_ach', url: 'Assets/Level_Select/Achievements_Button.png', type: 'image' },

  // Audio
  { key: 'bgm_trapped', url: 'Assets/Audio/Music/Trapped_in_the_Phone!.mp3', type: 'audio' },
  { key: 'bgm_shuffle', url: 'Assets/Audio/Music/Level_Select_Shuffle.mp3', type: 'audio' },
  { key: 'sfx_button', url: 'Assets/Audio/SFX/button-pressed-38129.mp3', type: 'audio' },
];
