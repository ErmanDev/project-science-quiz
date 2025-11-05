
export interface Message {
    id: number;
    title: string;
    preview: string;
    content: string;
    sender: string;
    date: string;
    classId?: string;
}

export const getMessages = (t: (key: string) => string): Message[] => [
    {
        id: 1,
        title: t('announcement'),
        preview: t('announcementDetail'),
        content: "Attention all students!\n\nThere will be a mandatory quiz on Life Science tomorrow, covering all topics from Cell Biology to Genetics. The quiz will be available from 9:00 AM to 5:00 PM. Please make sure to complete it within the given timeframe. \n\nGood luck!",
        sender: "Mr. Armstrong",
        date: "Oct 25, 2023"
    },
    {
        id: 2,
        title: "Project Deadline Reminder",
        preview: "Just a reminder that the physics project...",
        content: "Just a reminder that the physics project on Newtonian Mechanics is due this Friday. Please submit your work through the portal. Late submissions will have a penalty.",
        sender: "Ms. Curie",
        date: "Oct 24, 2023"
    },
    {
        id: 3,
        title: "Team Rankings Update",
        preview: "Congratulations to Team Nebula for...",
        content: "Congratulations to Team Nebula for reaching the top of the team leaderboards this week! Keep up the great work. All other teams, let's see if you can catch up!",
        sender: "SciQuest Admin",
        date: "Oct 23, 2023"
    },
    {
        id: 4,
        title: "New Badges Available!",
        preview: "Unlock new badges by completing the...",
        content: "We've just released a new set of 'Apex Achiever' badges. Check the badges screen to see how you can unlock them by topping the leaderboards. Happy questing!",
        sender: "SciQuest Admin",
        date: "Oct 22, 2023"
    },
    {
        id: 5,
        title: "Classroom Maintenance",
        preview: "The virtual classroom will be down for...",
        content: "The virtual classroom will be down for scheduled maintenance on Saturday from 2:00 AM to 4:00 AM. Please plan your study sessions accordingly.",
        sender: "IT Department",
        date: "Oct 21, 2023"
    },
];
