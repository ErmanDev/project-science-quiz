// src/data/badges.ts
export interface Badge {
  id: number;
  name: string;
  description: string;
  imgSrc: string;        // kept for backward compatibility / fallback
  progress: number;
  goal: number;
  imageFile?: string;    // NEW: local filename, e.g., "bronze-challenger.png"
}

export interface BadgeCategory {
  id: string;
  title: string;
  badges: Badge[];
}

/**
 * Helper: turn a badge name into a kebab-cased filename (png by default).
 * "Bronze Challenger" -> "bronze-challenger.png"
 * You can change the extension if your assets are .svg/.webp, etc.
 */
const nameToFile = (name: string, ext: 'png' | 'svg' | 'webp' | 'jpg' | 'jpeg' = 'png') =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.${ext}`;

// Keep your existing placeholders as a fallback when a local file is missing
const placeholderImages = [
  'https://i.imgur.com/yC362h7.png',
  'https://i.imgur.com/P4Q25aJ.png',
  'https://i.imgur.com/gSnR4g1.png',
  'https://i.imgur.com/V9Xm1gD.png',
  'https://i.imgur.com/aO0VwLi.png',
  'https://i.imgur.com/uPjX5jM.png',
  'https://i.imgur.com/0FwZzfY.png',
  'https://i.imgur.com/sR4aG2b.png',
];

let imageCounter = 0;
const getNextImage = () => {
  const img = placeholderImages[imageCounter % placeholderImages.length];
  imageCounter++;
  return img;
};

/**
 * If some badges have non-standard filenames, override them here.
 * Example:
 * const explicitFiles: Record<number, string> = {
 *   1: 'leaderboard-top3-bronze.png',
 *   5: 'leaderboard-top1-bronze.svg',
 * };
 */
const explicitFiles: Record<number, string> = {};

// Convenience: add both imageFile (local) and keep imgSrc (remote fallback)
const withImage = (
  badge: Omit<Badge, 'imageFile'>,
  ext: 'png' | 'svg' | 'webp' | 'jpg' | 'jpeg' = 'png'
): Badge => {
  const file = explicitFiles[badge.id] ?? nameToFile(badge.name, ext);
  return { ...badge, imageFile: file };
};

export const badgeData: BadgeCategory[] = [
  {
    id: 'consistent_performer',
    title: 'Consistent Performer (Top 3 Leaderboard)',
    badges: [
      withImage({
        id: 1,
        name: 'Bronze Challenger',
        description:
          'Awarded for placing in the top 3 on any leaderboard (solo or team, quiz or overall) 5 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 5,
      }),
      withImage({
        id: 2,
        name: 'Silver Contender',
        description:
          'Awarded for placing in the top 3 on any leaderboard 15 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 15,
      }),
      withImage({
        id: 3,
        name: 'Gold Guardian',
        description:
          'Awarded for placing in the top 3 on any leaderboard 30 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 30,
      }),
      withImage({
        id: 4,
        name: 'Diamond Dominator',
        description:
          'Awarded for placing in the top 3 on any leaderboard 50 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 50,
      }),
    ],
  },
  {
    id: 'apex_achiever',
    title: 'Apex Achiever (Top 1 Leaderboard)',
    badges: [
      withImage({
        id: 5,
        name: 'Bronze Victor',
        description:
          'Awarded for placing 1st on any leaderboard (solo or team, quiz or overall) 3 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 3,
      }),
      withImage({
        id: 6,
        name: 'Silver Champion',
        description: 'Awarded for placing 1st on any leaderboard 10 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 10,
      }),
      withImage({
        id: 7,
        name: 'Gold Conqueror',
        description: 'Awarded for placing 1st on any leaderboard 25 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 25,
      }),
      withImage({
        id: 8,
        name: 'Diamond Deity',
        description: 'Awarded for placing 1st on any leaderboard 50 times.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 50,
      }),
    ],
  },
  {
    id: 'quiz_milestone',
    title: 'Quiz Milestone Badges',
    badges: [
      withImage({
        id: 9,
        name: 'First Flight',
        description:
          'Awarded for answering your very first quiz question.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 1,
      }),
      withImage({
        id: 10,
        name: 'Adept Apprentice',
        description: 'Awarded for answering your 5th quiz.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 5,
      }),
      withImage({
        id: 11,
        name: 'Seasoned Solver',
        description: 'Awarded for answering your 10th quiz.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 10,
      }),
      withImage({
        id: 12,
        name: 'Veteran Voyager',
        description: 'Awarded for answering your 20th quiz.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 20,
      }),
    ],
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score Badges',
    badges: [
      withImage({
        id: 13,
        name: 'Flawless Start',
        description:
          'Awarded for achieving your first perfect score in a quiz.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 1,
      }),
      withImage({
        id: 14,
        name: 'Precision Pundit',
        description: 'Awarded for achieving 5 perfect scores.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 5,
      }),
      withImage({
        id: 15,
        name: 'Immaculate Intellect',
        description: 'Awarded for achieving 10 perfect scores.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 10,
      }),
      withImage({
        id: 16,
        name: 'Zenith Genius',
        description: 'Awarded for achieving 20 perfect scores.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 20,
      }),
    ],
  },
  {
    id: 'speed_responder',
    title: 'Speed Responder Badges',
    badges: [
      withImage({
        id: 17,
        name: 'Swift Spark',
        description:
          'Awarded for answering 10 questions correctly within 5 seconds each.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 10,
      }),
      withImage({
        id: 18,
        name: 'Rapid Reflex',
        description:
          'Awarded for answering 50 questions correctly within 10 seconds each.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 50,
      }),
      withImage({
        id: 19,
        name: 'Calculated Sprint',
        description:
          'Awarded for answering 100 questions correctly within 30 seconds each.',
        imgSrc: getNextImage(),
        progress: 0,
        goal: 100,
      }),
    ],
  },
];
