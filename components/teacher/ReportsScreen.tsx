import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { ReportsTitleIcon } from '../icons';
import { ClassData } from './ClassroomScreen';
import { TeacherQuiz } from '../../data/teacherQuizzes';
import { ClassStudent } from '../../data/classStudentData';

declare global {
    interface Window {
        jspdf: any;
    }
}

const CustomSelect: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
    placeholder: string;
}> = ({ value, onChange, children, placeholder }) => {
    return (
        <div className="relative w-48">
            <select
                value={value}
                onChange={onChange}
                className="w-full appearance-none bg-brand-mid-purple border border-brand-light-purple/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-glow"
            >
                <option value="" disabled>{placeholder}</option>
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ value: string; label1: string; label2: string }> = ({ value, label1, label2 }) => (
    <div className="bg-brand-mid-purple/80 p-2 rounded-xl text-center flex flex-col justify-center items-center border border-brand-light-purple/30 min-h-[90px]">
        <span className="font-orbitron font-bold text-3xl text-white">{value}</span>
        <span className="text-xs text-gray-200 mt-1 leading-tight">{label1}</span>
        <span className="text-xs text-gray-300 leading-tight">{label2}</span>
    </div>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

interface ReportsScreenProps {
    reportsData: {
        singleQuizStudentScores: any[];
        allQuizzesStudentScores: any[];
    };
    classes: ClassData[];
    postedQuizzes: TeacherQuiz[];
    classRosters: Record<string, ClassStudent[]>;
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({ reportsData, classes, postedQuizzes, classRosters }) => {
    const { t } = useTranslations();
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedReportType, setSelectedReportType] = useState<'all' | 'per' | ''>('');
    const [selectedQuiz, setSelectedQuiz] = useState<string>('');
    const [showReport, setShowReport] = useState<boolean>(false);

    useEffect(() => {
        setShowReport(false);
        setSelectedQuiz('');
    }, [selectedClass]);

    useEffect(() => {
        setShowReport(false);
    }, [selectedReportType]);
    
    const isGenerateDisabled = !selectedClass || !selectedReportType || (selectedReportType === 'per' && !selectedQuiz);

    const handleGenerateReport = () => {
        if (!isGenerateDisabled) {
            setShowReport(true);
        }
    };

    const availableQuizzes = useMemo(() => {
        if (!selectedClass) return [];
        return postedQuizzes.filter(quiz =>
            quiz.postedToClasses?.some(c => c.id === selectedClass)
        );
    }, [postedQuizzes, selectedClass]);
    
    const classStudentNames = useMemo(() => {
        if (!selectedClass || !classRosters[selectedClass]) {
            return new Set<string>();
        }
        return new Set(classRosters[selectedClass].map(student => student.name));
    }, [selectedClass, classRosters]);

    const filteredAllQuizzesScores = useMemo(() => {
        if (!showReport || !classStudentNames.size) return [];
        return reportsData.allQuizzesStudentScores.filter(score => classStudentNames.has(score.name));
    }, [reportsData.allQuizzesStudentScores, classStudentNames, showReport]);

    const filteredSingleQuizScores = useMemo(() => {
        if (!showReport || !classStudentNames.size) return [];
        // This additionally filters by selected quiz for accuracy, assuming quizNumber matches quizId
        if (selectedReportType === 'per' && selectedQuiz) {
            return reportsData.singleQuizStudentScores.filter(score => classStudentNames.has(score.name) && String(score.quizNumber) === selectedQuiz);
        }
        return reportsData.singleQuizStudentScores.filter(score => classStudentNames.has(score.name));
    }, [reportsData.singleQuizStudentScores, classStudentNames, showReport, selectedReportType, selectedQuiz]);

    const reportQuizName = useMemo(() => selectedReportType === 'per' && selectedQuiz
        ? postedQuizzes.find(q => q.id.toString() === selectedQuiz)?.title
        : 'Quiz #2', [selectedReportType, selectedQuiz, postedQuizzes]);

    const singleQuizPerformance = useMemo(() => {
        if (filteredSingleQuizScores.length === 0) return { name: reportQuizName, number: reportQuizName?.split(' ')[1], average: 0, median: 0, passRate: 0, highest: 0, lowest: 0 };
        const scores = filteredSingleQuizScores.map(s => parseFloat(s.score));
        const sum = scores.reduce((a, b) => a + b, 0);
        const average = sum / scores.length;
        const sortedScores = [...scores].sort((a,b) => a-b);
        const mid = Math.floor(sortedScores.length / 2);
        const median = sortedScores.length % 2 === 0 ? (sortedScores[mid-1] + sortedScores[mid]) / 2 : sortedScores[mid];
        const passRate = (scores.filter(s => s >= 75).length / scores.length) * 100;
        return {
            name: reportQuizName,
            number: reportQuizName?.split(' ')[1] || '#?',
            average, median, passRate, highest: Math.max(...scores), lowest: Math.min(...scores),
        };
    }, [filteredSingleQuizScores, reportQuizName]);
    
    
    const allQuizzesPerformance = useMemo(() => {
        if (filteredAllQuizzesScores.length === 0) return { average: 0, median: 0, passRate: 0, highest: 0, lowest: 0 };
        const averages = filteredAllQuizzesScores.map(s => s.average);
        const totalAverage = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
        const sortedAverages = [...averages].sort((a, b) => a - b);
        let median;
        const mid = Math.floor(sortedAverages.length / 2);
        median = sortedAverages.length % 2 === 0 ? (sortedAverages[mid - 1] + sortedAverages[mid]) / 2 : sortedAverages[mid];
        const passRate = (filteredAllQuizzesScores.filter(s => s.average >= 75).length / filteredAllQuizzesScores.length) * 100;
        return { average: totalAverage, median, passRate, highest: Math.max(...averages), lowest: Math.min(...averages) };
    }, [filteredAllQuizzesScores]);

    const chartTitle = selectedReportType === 'per' && selectedQuiz
        ? `Scores for: ${postedQuizzes.find(q => q.id.toString() === selectedQuiz)?.title}`
        : 'Overall Student Performance';

    const chartData = selectedReportType === 'per'
      ? filteredSingleQuizScores.map(s => ({
          name: s.name.split(' ')[0],
          score: parseFloat(s.score)
        }))
      : filteredAllQuizzesScores.map(s => ({ name: s.name.split(' ')[0], score: s.average }));
        
    const handleDownloadChart = () => {
        const chartWidth = 800, chartHeight = 400, padding = 50, barPadding = 10;
        const barWidth = (chartWidth - 2 * padding) / chartData.length - barPadding;
        const usableHeight = chartHeight - 2 * padding;
        let svgContent = `<svg width="${chartWidth}" height="${chartHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Roboto', sans-serif;"><rect x="0" y="0" width="${chartWidth}" height="${chartHeight}" fill="#2c1250" />`;
        [0, 25, 50, 75, 100].forEach(label => {
            const yPos = chartHeight - padding - (label / 100) * usableHeight;
            svgContent += `<text x="${padding - 10}" y="${yPos + 4}" fill="#a0aec0" text-anchor="end" font-size="12">${label}%</text>`;
            if (label > 0) svgContent += `<line x1="${padding}" y1="${yPos}" x2="${chartWidth - padding}" y2="${yPos}" stroke="#4a5568" stroke-dasharray="2,2" />`;
        });
        svgContent += `<line x1="${padding}" y1="${chartHeight - padding}" x2="${chartWidth - padding}" y2="${chartHeight - padding}" stroke="#a0aec0" />`;
        chartData.forEach((item, index) => {
            const barHeight = (item.score / 100) * usableHeight, x = padding + index * (barWidth + barPadding) + barPadding / 2, y = chartHeight - padding - barHeight;
            svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#4b2a85" rx="2" /><text x="${x + barWidth / 2}" y="${y - 5}" fill="#ffffff" text-anchor="middle" font-size="12">${item.score.toFixed(0)}%</text><text x="${x + barWidth / 2}" y="${chartHeight - padding + 20}" fill="#cbd5e0" text-anchor="middle" font-size="12">${item.name}</text>`;
        });
        svgContent += `</svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' }), url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'student-performance-chart.svg';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const rankedAllQuizzesScores = useMemo(() => filteredAllQuizzesScores
        .sort((a: any, b: any) => b.average - a.average)
        .map((student: any, index: number) => ({ ...student, ranking: index + 1 })), [filteredAllQuizzesScores]);
        
    const rankedSingleQuizScores = useMemo(() => filteredSingleQuizScores
        .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
        .map((student, index) => ({ ...student, ranking: index + 1 })),
    [filteredSingleQuizScores]);

    const handleExportCSV = () => {
        let csvContent = "", rows: string[][] = [], headers: string[] = [];
        const selectedClassData = classes.find(c => c.id === selectedClass);
        const selectedClassName = selectedClassData ? `${selectedClassData.name} - ${selectedClassData.section}` : 'N/A';
        const generationDate = new Date().toLocaleDateString();
        let reportTypeString = "";
        if (selectedReportType === 'all') {
            reportTypeString = "All Quizzes";
            headers = ["Name", "Average Score (%)", "Overall Ranking"];
            rows = rankedAllQuizzesScores.map((student: any) => [`"${student.name}"`, student.average.toFixed(2), student.ranking.toString()]);
        } else {
            reportTypeString = reportQuizName || "Per Quiz";
            headers = ["Name", "Quiz #", "Score", "Ranking"];
            rows = rankedSingleQuizScores.map((student: any) => [`"${student.name}"`, selectedQuiz, `"${student.score}"`, student.ranking.toString()]);
        }
        csvContent += `"Report for:","${selectedClassName}"\n"Report Type:","${reportTypeString}"\n"Generated on:","${generationDate}"\n\n`;
        csvContent += headers.join(",") + "\n";
        rows.forEach(rowArray => { csvContent += rowArray.join(",") + "\n"; });
        const classNameForFile = selectedClassName.replace(/ /g, '_').replace(/-/g, '');
        let fileName = selectedReportType === 'all' ? `report_${classNameForFile}_all_quizzes.csv` : `report_${classNameForFile}_${reportQuizName?.replace(/ /g, '_').replace(/#/g, '') || 'quiz'}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url); link.setAttribute("download", fileName);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        const { jsPDF } = window.jspdf; const doc = new jsPDF();
        let head: string[][] = [], body: (string|number)[][] = [];
        const selectedClassData = classes.find(c => c.id === selectedClass);
        const selectedClassName = selectedClassData ? `${selectedClassData.name} - ${selectedClassData.section}` : 'N/A';
        const generationDate = new Date().toLocaleDateString();
        let reportTypeString = "";
        if (selectedReportType === 'all') {
            reportTypeString = "All Quizzes";
            head = [['Name', 'Average Score (%)', 'Overall Ranking']];
            body = rankedAllQuizzesScores.map((student: any) => [student.name, student.average.toFixed(2), student.ranking]);
        } else {
            reportTypeString = reportQuizName || "Per Quiz";
            head = [['Name', 'Quiz #', 'Score', 'Ranking']];
            body = rankedSingleQuizScores.map((student: any) => [student.name, selectedQuiz, student.score, student.ranking]);
        }
        doc.setFontSize(16); doc.text(`Report for: ${selectedClassName}`, 14, 20);
        doc.setFontSize(11); doc.setTextColor(100);
        doc.text(`Type: ${reportTypeString}`, 14, 28); doc.text(`Generated on: ${generationDate}`, 14, 34);
        (doc as any).autoTable({ startY: 40, head, body, theme: 'grid', styles: { fillColor: [75, 42, 133] }, headStyles: { fillColor: [44, 18, 80] } });
        const classNameForFile = selectedClassName.replace(/ /g, '_').replace(/-/g, '');
        let fileName = selectedReportType === 'all' ? `report_${classNameForFile}_all_quizzes.pdf` : `report_${classNameForFile}_${reportQuizName?.replace(/ /g, '_').replace(/#/g, '') || 'quiz'}.pdf`;
        doc.save(fileName);
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center mb-2">
                    <ReportsTitleIcon />
                    <h1 className="font-orbitron text-4xl font-bold">{t('reports')}</h1>
                </div>
                <p className="text-gray-300 mb-8 max-w-sm">{t('reportsDescription')}</p>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="font-bold text-lg text-blue-300">{t('classSection')}</label>
                        <CustomSelect value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} placeholder={t('chooseSection')}>
                            {classes.map(cls => <option key={cls.id} value={cls.id}>{`${cls.name} - ${cls.section}`}</option>)}
                        </CustomSelect>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="font-bold text-lg text-blue-300">{t('reportType')}</label>
                        <CustomSelect value={selectedReportType} onChange={(e) => { setSelectedReportType(e.target.value as any); setSelectedQuiz(''); }} placeholder={t('chooseReport')}>
                            <option value="all">{t('allQuizzes')}</option>
                            <option value="per">{t('perQuiz')}</option>
                        </CustomSelect>
                    </div>
                    {selectedReportType === 'per' && (
                         <div className="flex items-center justify-between transition-opacity duration-300">
                            <label className="font-bold text-lg text-blue-300">{t('perQuiz')}</label>
                            <CustomSelect value={selectedQuiz} onChange={(e) => setSelectedQuiz(e.target.value)} placeholder={t('selectAQuiz')}>
                                {availableQuizzes.map(quiz => <option key={quiz.id} value={String(quiz.id)}>{quiz.title}</option>)}
                            </CustomSelect>
                        </div>
                    )}
                </div>
                <div className="mt-6">
                    <button onClick={handleGenerateReport} disabled={isGenerateDisabled} className="w-full bg-brand-accent text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-opacity-90 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none">
                        {t('generateReport')}
                    </button>
                </div>
            </div>
            
            {showReport && (
                <div className="space-y-6">
                    {selectedReportType === 'all' ? (
                        <div className="grid grid-cols-3 gap-2">
                            <StatCard value="All" label1="Quizzes" label2="" />
                            <StatCard value={allQuizzesPerformance.average.toFixed(2)} label1="Average" label2="(%)" />
                            <StatCard value={allQuizzesPerformance.median.toFixed(2)} label1="Median" label2="(%)" />
                            <StatCard value={allQuizzesPerformance.passRate.toFixed(2)} label1="Pass Rate" label2="(%)" />
                            <StatCard value={allQuizzesPerformance.highest.toFixed(2)} label1="Highest" label2="(%)" />
                            <StatCard value={allQuizzesPerformance.lowest.toFixed(2)} label1="Lowest" label2="(%)" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            <StatCard value={singleQuizPerformance.number} label1={(singleQuizPerformance.name?.split(' ')[0] || 'Quiz')} label2={''} />
                            <StatCard value={singleQuizPerformance.average.toFixed(2)} label1="Average" label2="(%)" />
                            <StatCard value={String(singleQuizPerformance.median)} label1="Median" label2="(%)" />
                            <StatCard value={String(singleQuizPerformance.passRate)} label1="Pass Rate" label2="(%)" />
                            <StatCard value={String(singleQuizPerformance.highest)} label1="Highest" label2="(%)" />
                            <StatCard value={String(singleQuizPerformance.lowest)} label1="Lowest" label2="(%)" />
                        </div>
                    )}

                    <div>
                        <div className="bg-brand-mid-purple/80 rounded-xl p-4 border border-brand-light-purple/50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-gray-300">{chartTitle}</h3>
                                <button onClick={handleDownloadChart} aria-label="Download chart"><DownloadIcon /></button>
                            </div>
                            <div className="flex" style={{ height: '200px' }}>
                                <div className="flex flex-col justify-between text-xs text-gray-400 pr-2">
                                    <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                                </div>
                                <div className="flex-grow flex flex-col justify-end">
                                    <div className="flex-grow flex justify-around items-end border-l border-b border-gray-500/50 pl-2">
                                        {chartData.map((student, index) => (
                                            <div key={index} className="flex flex-col justify-end items-center h-full" style={{ flex: 1 }}>
                                                <span className="text-xs text-white mb-1">{student.score.toFixed(0)}%</span>
                                                <div className="w-4/5 bg-brand-light-purple rounded-t-md hover:bg-brand-glow transition-colors" style={{ height: `${student.score}%` }}></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-around items-start border-l border-transparent pl-2 mt-2">
                                        {chartData.map((student, index) => (
                                            <div key={index} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                                                <span className="text-xs text-gray-300 whitespace-nowrap">{student.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold text-xl text-white mb-4">Student Scores</h2>
                        {selectedReportType === 'all' ? (
                            <div className="bg-brand-mid-purple/80 rounded-xl p-4 border border-brand-light-purple/50 max-h-96 overflow-y-auto hide-scrollbar">
                                <table className="w-full text-sm text-left text-white">
                                    <thead className="sticky top-0 bg-brand-mid-purple z-10">
                                        <tr className="border-b-2 border-brand-light-purple/50 text-gray-300">
                                            <th className="py-2 pr-2 font-semibold">Name</th>
                                            <th className="py-2 px-2 font-semibold text-center">Average Score</th>
                                            <th className="py-2 pl-2 font-semibold text-center">Overall Ranking</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankedAllQuizzesScores.map((student: any, index: number) => (
                                            <tr key={index} className="border-b border-brand-light-purple/30 last:border-b-0">
                                                <td className="py-3 pr-2 font-semibold">{student.name}</td>
                                                <td className="py-3 px-2 text-center">{student.average.toFixed(2)}%</td>
                                                <td className="py-3 pl-2 text-center">{student.ranking}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-brand-mid-purple/80 rounded-xl p-4 border border-brand-light-purple/50 max-h-96 overflow-y-auto hide-scrollbar">
                                <table className="w-full text-sm text-left text-white">
                                    <thead className="sticky top-0 bg-brand-mid-purple z-10">
                                        <tr className="border-b-2 border-brand-light-purple/50 text-gray-300">
                                            <th className="py-2 pr-2 font-semibold">Name</th>
                                            <th className="py-2 px-2 font-semibold text-center">Quiz #</th>
                                            <th className="py-2 px-2 font-semibold text-center">Score</th>
                                            <th className="py-2 pl-2 font-semibold text-center">Ranking</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankedSingleQuizScores.map((student: any, index: number) => (
                                            <tr key={index} className="border-b border-brand-light-purple/30 last:border-b-0">
                                                <td className="py-3 pr-2 font-semibold">{student.name}</td>
                                                <td className="py-3 px-2 text-center">{selectedQuiz}</td>
                                                <td className="py-3 px-2 text-center">{student.score}</td>
                                                <td className="py-3 pl-2 text-center">{student.ranking}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="flex justify-center space-x-4 mt-6">
                            <button onClick={handleExportCSV} className="bg-blue-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors hover:bg-blue-500">
                                Export CSV
                            </button>
                            <button onClick={handleExportPDF} className="bg-brand-light-purple text-white font-semibold py-2 px-8 rounded-lg transition-colors hover:bg-brand-mid-purple">
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsScreen;