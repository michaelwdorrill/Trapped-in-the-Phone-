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
];

export function getCharacterById(id: string): CharacterData | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export function getCharacterIndex(id: string): number {
  return CHARACTERS.findIndex((c) => c.id === id);
}
