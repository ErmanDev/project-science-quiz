export interface Badge {
  id: number;
  name: string;
  description: string;
  imgSrc: string;
  progress: number;
  goal: number;
}

export interface BadgeCategory {
  id: string;
  title: string;
  badges: Badge[];
}

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

export const badgeData: BadgeCategory[] = [
  {
    id: 'consistent_performer',
    title: 'Consistent Performer (Top 3 Leaderboard)',
    badges: [
      { id: 1, name: 'Bronze Challenger', description: 'Awarded for placing in the top 3 on any leaderboard (solo or team, quiz or overall) 5 times.', imgSrc: getNextImage(), progress: 3, goal: 5 },
      { id: 2, name: 'Silver Contender', description: 'Awarded for placing in the top 3 on any leaderboard 15 times.', imgSrc: getNextImage(), progress: 5, goal: 15 },
      { id: 3, name: 'Gold Guardian', description: 'Awarded for placing in the top 3 on any leaderboard 30 times.', imgSrc: getNextImage(), progress: 30, goal: 30 },
      { id: 4, name: 'Diamond Dominator', description: 'Awarded for placing in the top 3 on any leaderboard 50 times.', imgSrc: getNextImage(), progress: 31, goal: 50 },
    ],
  },
  {
    id: 'apex_achiever',
    title: 'Apex Achiever (Top 1 Leaderboard)',
    badges: [
      { id: 5, name: 'Bronze Victor', description: 'Awarded for placing 1st on any leaderboard (solo or team, quiz or overall) 3 times.', imgSrc: getNextImage(), progress: 1, goal: 3 },
      { id: 6, name: 'Silver Champion', description: 'Awarded for placing 1st on any leaderboard 10 times.', imgSrc: getNextImage(), progress: 10, goal: 10 },
      { id: 7, name: 'Gold Conqueror', description: 'Awarded for placing 1st on any leaderboard 25 times.', imgSrc: getNextImage(), progress: 11, goal: 25 },
      { id: 8, name: 'Diamond Deity', description: 'Awarded for placing 1st on any leaderboard 50 times.', imgSrc: getNextImage(), progress: 0, goal: 50 },
    ],
  },
  {
    id: 'quiz_milestone',
    title: 'Quiz Milestone Badges',
    badges: [
      { id: 9, name: 'First Flight', description: 'Awarded for answering your very first quiz question.', imgSrc: getNextImage(), progress: 1, goal: 1 },
      { id: 10, name: 'Adept Apprentice', description: 'Awarded for answering your 5th quiz.', imgSrc: getNextImage(), progress: 4, goal: 5 },
      { id: 11, name: 'Seasoned Solver', description: 'Awarded for answering your 10th quiz.', imgSrc: getNextImage(), progress: 8, goal: 10 },
      { id: 12, name: 'Veteran Voyager', description: 'Awarded for answering your 20th quiz.', imgSrc: getNextImage(), progress: 15, goal: 20 },
    ],
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score Badges',
    badges: [
      { id: 13, name: 'Flawless Start', description: 'Awarded for achieving your first perfect score in a quiz.', imgSrc: getNextImage(), progress: 1, goal: 1 },
      { id: 14, name: 'Precision Pundit', description: 'Awarded for achieving 5 perfect scores.', imgSrc: getNextImage(), progress: 2, goal: 5 },
      { id: 15, name: 'Immaculate Intellect', description: 'Awarded for achieving 10 perfect scores.', imgSrc: getNextImage(), progress: 0, goal: 10 },
      { id: 16, name: 'Zenith Genius', description: 'Awarded for achieving 20 perfect scores.', imgSrc: getNextImage(), progress: 0, goal: 20 },
    ],
  },
  {
    id: 'speed_responder',
    title: 'Speed Responder Badges',
    badges: [
      { id: 17, name: 'Swift Spark', description: 'Awarded for answering 10 questions correctly within 5 seconds each.', imgSrc: getNextImage(), progress: 10, goal: 10 },
      { id: 18, name: 'Rapid Reflex', description: 'Awarded for answering 50 questions correctly within 10 seconds each.', imgSrc: getNextImage(), progress: 23, goal: 50 },
      { id: 19, name: 'Calculated Sprint', description: 'Awarded for answering 100 questions correctly within 30 seconds each.', imgSrc: getNextImage(), progress: 45, goal: 100 },
    ],
  },
];
