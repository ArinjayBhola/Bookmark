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
