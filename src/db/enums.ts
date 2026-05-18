export const TerrainCategory = {
  SUMMIT: 'SUMMIT',
  VALLEY: 'VALLEY',
  VILLAGE: 'VILLAGE',
  GLACIER: 'GLACIER',
  PASS: 'PASS',
  CAMPSITE: 'CAMPSITE',
  ROUTE: 'ROUTE',
  LAKE: 'LAKE',
} as const;

export type TerrainCategory = (typeof TerrainCategory)[keyof typeof TerrainCategory];

export const ExplorationStatus = {
  VISITED: 'VISITED',
  RESEARCHING: 'RESEARCHING',
  PLANNED: 'PLANNED',
  DREAM_EXPEDITION: 'DREAM_EXPEDITION',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;

export type ExplorationStatus = (typeof ExplorationStatus)[keyof typeof ExplorationStatus];

export const Difficulty = {
  EASY: 'EASY',
  MODERATE: 'MODERATE',
  STRENUOUS: 'STRENUOUS',
  TECHNICAL: 'TECHNICAL',
  EXTREME: 'EXTREME',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const FileType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  GPX: 'GPX',
  DOCUMENT: 'DOCUMENT',
  MAP: 'MAP',
} as const;

export type FileType = (typeof FileType)[keyof typeof FileType];
