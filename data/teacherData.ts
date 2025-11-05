
export interface Student {
    id: number;
    name: string;
    avatar: string;
    lastActive: string;
    overallScore: number;
}

export const studentData: Student[] = [
    { id: 1, name: 'Lana', avatar: 'https://i.pravatar.cc/150?img=47', lastActive: '2 hours ago', overallScore: 92 },
    { id: 2, name: 'Mike', avatar: 'https://i.pravatar.cc/150?img=68', lastActive: '5 hours ago', overallScore: 98 },
    { id: 3, name: 'Jin', avatar: 'https://i.pravatar.cc/150?img=32', lastActive: '1 day ago', overallScore: 88 },
    { id: 4, name: 'Jhon Rexell Pereira', avatar: '', lastActive: '30 mins ago', overallScore: 85 },
    { id: 5, name: 'Student E', avatar: '', lastActive: '3 days ago', overallScore: 76 },
    { id: 6, name: 'Student F', avatar: '', lastActive: '1 hour ago', overallScore: 89 },
];
