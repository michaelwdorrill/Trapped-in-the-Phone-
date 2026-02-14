export interface CharacterData {
  id: string;
  selectKey: string;
  levelKey: string;
  selectUrl: string;
  levelUrl: string;
}

export const CHARACTERS: CharacterData[] = [
  {
    id: 'Char_1',
    selectKey: 'char1_select',
    levelKey: 'char1_level',
    selectUrl: 'Assets/Character/Char_1/CharSelect.png',
    levelUrl: 'Assets/Character/Char_1/LevelSelect.png',
  },
  {
    id: 'Char_2',
    selectKey: 'char2_select',
    levelKey: 'char2_level',
    selectUrl: 'Assets/Character/Char_2/CharSelect.png',
    levelUrl: 'Assets/Character/Char_2/LevelSelect.png',
  },
  {
    id: 'Char_3',
    selectKey: 'char3_select',
    levelKey: 'char3_level',
    selectUrl: 'Assets/Character/Char_3/CharSelect.png',
    levelUrl: 'Assets/Character/Char_3/LevelSelect.png',
  },
  {
    id: 'Char_4',
    selectKey: 'char4_select',
    levelKey: 'char4_level',
    selectUrl: 'Assets/Character/Char_4/CharSelect.png',
    levelUrl: 'Assets/Character/Char_4/LevelSelect.png',
  },
  {
    id: 'Char_5',
    selectKey: 'char5_select',
    levelKey: 'char5_level',
    selectUrl: 'Assets/Character/Char_5/CharSelect.png',
    levelUrl: 'Assets/Character/Char_5/LevelSelect.png',
  },
  {
    id: 'Char_6',
    selectKey: 'char6_select',
    levelKey: 'char6_level',
    selectUrl: 'Assets/Character/Char_6/CharSelect.png',
    levelUrl: 'Assets/Character/Char_6/LevelSelect.png',
  },
  {
    id: 'Char_7',
    selectKey: 'char7_select',
    levelKey: 'char7_level',
    selectUrl: 'Assets/Character/Char_7/CharSelect.png',
    levelUrl: 'Assets/Character/Char_7/LevelSelect.png',
  },
  {
    id: 'Char_8',
    selectKey: 'char8_select',
    levelKey: 'char8_level',
    selectUrl: 'Assets/Character/Char_8/CharSelect.png',
    levelUrl: 'Assets/Character/Char_8/LevelSelect.png',
  },
  {
    id: 'Char_9',
    selectKey: 'char9_select',
    levelKey: 'char9_level',
    selectUrl: 'Assets/Character/Char_9/CharSelect.png',
    levelUrl: 'Assets/Character/Char_9/LevelSelect.png',
  },
  {
    id: 'Char_10',
    selectKey: 'char10_select',
    levelKey: 'char10_level',
    selectUrl: 'Assets/Character/Char_10/CharSelect.png',
    levelUrl: 'Assets/Character/Char_10/LevelSelect.png',
  },
];

export function getCharacterById(id: string): CharacterData | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export function getCharacterIndex(id: string): number {
  return CHARACTERS.findIndex((c) => c.id === id);
}
