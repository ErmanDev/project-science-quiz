
export interface ClassStudent {
    id: number;
    name: string;
    level: number;
    streak: number;
    accuracy: string;
    lastActive: string;
}

export const classStudentData: ClassStudent[] = [
    {
        id: 1,
        name: 'Jhon Rexell Pereira',
        level: 4,
        streak: 12,
        accuracy: '85%',
        lastActive: 'Today'
    },
    {
        id: 2,
        name: 'Neil Jordan Moron',
        level: 3,
        streak: 5,
        accuracy: '72%',
        lastActive: 'Today'
    },
    {
        id: 3,
        name: 'Joemari Atencio',
        level: 2,
        streak: 3,
        accuracy: '68%',
        lastActive: '3 days ago'
    },
    {
        id: 4,
        name: 'Maria Santos',
        level: 3,
        streak: 12,
        accuracy: '85%',
        lastActive: 'Today'
    },
    {
        id: 5,
        name: 'Juan Dela Cruz',
        level: 2,
        streak: 5,
        accuracy: '72%',
        lastActive: 'Yesterday'
    },
     {
        id: 6,
        name: 'Lana del Rey',
        level: 5,
        streak: 15,
        accuracy: '91%',
        lastActive: 'Today'
    },
    {
        id: 7,
        name: 'Mike Johnson',
        level: 5,
        streak: 11,
        accuracy: '88%',
        lastActive: 'Today'
    },
];
