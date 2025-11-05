import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { Question, MultipleChoiceQuestion, IdentificationQuestion, QuestionCategory } from '../../data/teacherQuizQuestions';
import { PencilIcon, TrashIcon } from '../icons';
import SelectQuestionFromVaultModal from './SelectQuestionFromVaultModal';
import { TeacherQuiz } from '../../data/teacherQuizzes';

type GameMode = 'Solo' | 'Team' | 'Classroom';
type GameCategory = 'Card' | 'Board' | 'Normal';

interface CreateQuizScreenProps {
    onBack: () => void;
    onSelectQuestions: (config: { name: string; mode: GameMode; category: GameCategory }) => void;
    onCreateQuizWithCards: (config: { name: string; mode: GameMode; category: 'Card' | 'Board' }, questions: Question[]) => void;
    quizToEdit?: TeacherQuiz | null;
    onUpdateQuiz?: (updatedData: { name: string; mode: GameMode; category: GameCategory }, cards: Question[]) => void;
    onAddCardToVault: (card: Question) => void;
}

const BackIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const ToggleButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 w-full
            ${isActive
                ? 'bg-gradient-to-r from-blue-500 to-brand-accent text-white shadow-glow'
                : 'bg-brand-deep-purple/50 text-gray-300 hover:bg-brand-deep-purple'
            }`}
    >
        {label}
    </button>
);

const SavedCardItem: React.FC<{ questionText: string; onEdit: () => void; onDelete: () => void; }> = ({ questionText, onEdit, onDelete }) => (
    <div className="bg-brand-deep-purple/50 p-3 rounded-lg border border-brand-light-purple/30 flex justify-between items-center">
        <p className="text-sm text-gray-200 truncate pr-4">{questionText}</p>
        <div className="flex space-x-2 flex-shrink-0">
            <button onClick={onEdit} className="p-1 text-blue-400 hover:text-white transition-colors" aria-label="Edit card"><PencilIcon className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-1 text-red-500 hover:text-red-400 transition-colors" aria-label="Delete card"><TrashIcon className="w-4 h-4" /></button>
        </div>
    </div>
);

const generateGridWithAnswer = (answer: string, size: number = 10): string[][] => {
    // 1. Initialize grid and clean answer
    const grid: (string | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = () => alphabet[Math.floor(Math.random() * alphabet.length)];
    const cleanAnswer = answer.toUpperCase().replace(/[^A-Z]/g, '');

    if (cleanAnswer.length === 0 || cleanAnswer.length > size * size) {
        // If no answer or answer too long, just fill with random letters
        return Array(size).fill(null).map(() => Array(size).fill('').map(randomLetter));
    }

    // 2. Define directions
    const directions = [
        { dr: 0, dc: 1 },   // Horizontal right
        { dr: 1, dc: 0 },   // Vertical down
        { dr: 1, dc: 1 },   // Diagonal down-right
        { dr: 1, dc: -1 },  // Diagonal down-left
        { dr: 0, dc: -1 },  // Horizontal left
        { dr: -1, dc: 0 },  // Vertical up
        { dr: -1, dc: -1 }, // Diagonal up-left
        { dr: -1, dc: 1 },  // Diagonal up-right
    ];

    // Shuffle directions to randomize placement
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    let placed = false;

    // 3. Try to place the word
    for (const { dr, dc } of directions) {
        const validStarts: { r: number, c: number }[] = [];
        // Find all valid starting positions for this direction
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const endR = r + (cleanAnswer.length - 1) * dr;
                const endC = c + (cleanAnswer.length - 1) * dc;
                if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
                    // Check if path is clear (always true for now on an empty grid)
                    validStarts.push({ r, c });
                }
            }
        }

        if (validStarts.length > 0) {
            // Pick a random start and place the word
            const { r, c } = validStarts[Math.floor(Math.random() * validStarts.length)];
            for (let i = 0; i < cleanAnswer.length; i++) {
                grid[r + i * dr][c + i * dc] = cleanAnswer[i];
            }
            placed = true;
            break; // Exit after successful placement
        }
    }

    if (!placed) {
        // Fallback: if no direction worked (highly unlikely for small words on empty grid), place horizontally
        if (cleanAnswer.length <= size) {
            const row = Math.floor(Math.random() * size);
            const startCol = Math.floor(Math.random() * (size - cleanAnswer.length + 1));
            for (let i = 0; i < cleanAnswer.length; i++) {
                grid[row][startCol + i] = cleanAnswer[i];
            }
        }
    }

    // 4. Fill the rest of the grid with random letters
    const finalGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            finalGrid[r][c] = grid[r][c] === null ? randomLetter() : grid[r][c]!;
        }
    }

    return finalGrid;
};


const CreateQuizScreen: React.FC<CreateQuizScreenProps> = ({ onBack, onSelectQuestions, onCreateQuizWithCards, quizToEdit, onUpdateQuiz, onAddCardToVault }) => {
    const { t } = useTranslations();
    const [quizName, setQuizName] = useState('');
    const [gameMode, setGameMode] = useState<GameMode>('Solo');
    const [gameCategory, setGameCategory] = useState<GameCategory>('Card');
    const [isSelectQuestionModalOpen, setSelectQuestionModalOpen] = useState(false);
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    const defaultCardState: Question = {
        id: 0,
        type: 'identification',
        question: '',
        answer: '',
        points: 10,
        timeLimit: 30,
        category: 'Earth and Space', // Default category
        imageUrl: undefined,
    };

    const [editorCard, setEditorCard] = useState<Question>(defaultCardState);
    const [quizCards, setQuizCards] = useState<Question[]>([]);
    const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
    const [fileName, setFileName] = useState<string>('No file chosen');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const gameModes: GameMode[] = ['Solo', 'Team', 'Classroom'];
    const allGameCategories: GameCategory[] = ['Card', 'Board', 'Normal'];
    const questionCategories: QuestionCategory[] = ['Earth and Space', 'Living Things and Their Environment', 'Matter', 'Force, Motion, and Energy'];

    const gameCategories = useMemo((): GameCategory[] => {
        if (gameMode === 'Classroom') {
            return ['Normal'];
        }
        // For Solo and Team, all categories are available.
        return allGameCategories;
    }, [gameMode]);
    
    const boardGrid = useMemo(() => {
        const answer = (editorCard.type === 'identification' && editorCard.answer)
            ? (editorCard as IdentificationQuestion).answer
            : '';
        return generateGridWithAnswer(answer);
    }, [editorCard]);

    useEffect(() => {
        if (!gameCategories.includes(gameCategory)) {
            setGameCategory(gameCategories[0]);
        }
    }, [gameCategories, gameCategory]);

    useEffect(() => {
        if (quizToEdit) {
            setQuizName(quizToEdit.title);
            setGameMode(quizToEdit.mode);
            const [category] = quizToEdit.type.split(' ');
            if (['Card', 'Board', 'Normal'].includes(category)) {
                setGameCategory(category as GameCategory);
            }
            if (quizToEdit.questions) {
                setQuizCards(quizToEdit.questions);
            }
        }
    }, [quizToEdit]);

    useEffect(() => {
        if (gameCategory === 'Board' && editorCard.type !== 'identification') {
            // When switching to Board, force question type to Identification
            const baseData = {
                id: editorCard.id || 0,
                question: editorCard.question,
                points: editorCard.points,
                category: editorCard.category,
                imageUrl: editorCard.imageUrl,
                timeLimit: editorCard.timeLimit,
            };
            setEditorCard({
                ...baseData,
                type: 'identification',
                answer: ''
            });
        }
    }, [gameCategory]);

    // Card Editor Handlers
    const handleEditorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'points' || name === 'timeLimit') {
            setEditorCard({ ...editorCard, [name]: parseInt(value, 10) || 0 });
        } else {
            setEditorCard({ ...editorCard, [name]: value });
        }
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as 'multiple-choice' | 'identification';
        if (newType === editorCard.type) return;

        const baseData = { ...editorCard, id: editorCard.id || 0 };

        if (newType === 'multiple-choice') {
            setEditorCard({
                ...baseData,
                type: 'multiple-choice',
                options: ['', '', '', ''],
                answer: ''
            });
        } else {
            setEditorCard({
                ...baseData,
                type: 'identification',
                answer: ''
            });
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        if (editorCard.type === 'multiple-choice') {
            const newOptions = [...(editorCard as MultipleChoiceQuestion).options];
            newOptions[index] = value;
            setEditorCard({ ...editorCard, options: newOptions });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditorCard({ ...editorCard, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setEditorCard({ ...editorCard, imageUrl: undefined });
        setFileName('No file chosen');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClearEditor = () => {
        setEditorCard(defaultCardState);
        setEditingCardIndex(null);
        setFileName('No file chosen');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSaveCard = () => {
        if (!editorCard.question.trim()) return;
        if (editorCard.type === 'identification' && !(editorCard as IdentificationQuestion).answer.trim()) return;

        const cardToSave = { ...editorCard, id: editorCard.id || Date.now() + Math.random() };

        if (editingCardIndex !== null) {
            const updatedCards = [...quizCards];
            updatedCards[editingCardIndex] = cardToSave;
            setQuizCards(updatedCards);
        } else {
            setQuizCards([...quizCards, cardToSave]);
            // Only add to vault if it's a brand new card being added to the quiz.
            onAddCardToVault(cardToSave);
        }
        handleClearEditor();
    };

    const handleEditCard = (index: number) => {
        setEditingCardIndex(index);
        setEditorCard(quizCards[index]);
        setFileName(quizCards[index].imageUrl ? 'image_preview.png' : 'No file chosen');
    };
    
    const handleDeleteCard = (index: number) => {
        setQuizCards(quizCards.filter((_, i) => i !== index));
        if (editingCardIndex === index) {
            handleClearEditor();
        }
    };
    
    const handleAddQuestionsFromVault = (selectedQuestions: Question[]) => {
        // Create new instances for this quiz, ensuring unique IDs within this quiz's context
        const newCards = selectedQuestions.map(q => ({
            ...q,
            id: Math.random() + Date.now(), // simple unique id generation
        }));
        setQuizCards(prev => [...prev, ...newCards]);
        setSelectQuestionModalOpen(false);
    };

    const handleProceed = () => {
        if (quizToEdit && onUpdateQuiz) {
            onUpdateQuiz({ name: quizName, mode: gameMode, category: gameCategory }, quizCards);
        } else if (gameCategory === 'Card' || gameCategory === 'Board') {
            onCreateQuizWithCards({ name: quizName, mode: gameMode, category: gameCategory as 'Card' | 'Board' }, quizCards);
        } else {
            onSelectQuestions({ name: quizName, mode: gameMode, category: gameCategory });
        }
    };
    
    const isMultipleChoice = editorCard.type === 'multiple-choice';

    return (
        <div className="relative h-full flex flex-col text-white">
            <div className="flex items-center mb-6 flex-shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back">
                    <BackIcon />
                </button>
                <h2 className="text-2xl font-bold ml-2">{quizToEdit ? "Edit Quiz" : t('createQuiz')}</h2>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-24">
                <div className="space-y-2">
                    <label className="font-orbitron font-bold text-lg">{t('quizNameLabel')}</label>
                    <input
                        type="text"
                        value={quizName}
                        onChange={(e) => setQuizName(e.target.value)}
                        placeholder={t('enterQuizNamePlaceholder')}
                        className="w-full bg-brand-deep-purple/50 border-2 border-brand-light-purple/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300"
                    />
                </div>
                <div className="space-y-2">
                    <label className="font-orbitron font-bold text-lg">{t('chooseGameMode')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {gameModes.map(mode => (
                            <ToggleButton 
                                key={mode}
                                label={t(`gameMode${mode}`)} 
                                isActive={gameMode === mode} 
                                onClick={() => setGameMode(mode)} 
                            />
                        ))}
                    </div>
                </div>
                {gameMode === 'Classroom' ? (
                     <div className="flex items-center justify-center h-64 bg-brand-deep-purple/50 rounded-lg border-2 border-dashed border-brand-light-purple/50">
                        <p className="text-3xl font-orbitron font-bold text-brand-glow animate-pulse">COMING SOON!!</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="font-orbitron font-bold text-lg">{t('chooseGameCategory')}</label>
                            <div className={`grid gap-2 ${gameCategories.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                                {gameCategories.map(category => (
                                    <ToggleButton 
                                        key={category}
                                        label={t(`gameCategory${category}`)} 
                                        isActive={gameCategory === category} 
                                        onClick={() => setGameCategory(category)} 
                                    />
                                ))}
                            </div>
                        </div>

                        {(gameCategory === 'Card' || gameCategory === 'Board') && (
                            <div className="space-y-6">
                                {/* Card/Board Preview */}
                                <div className="flex flex-col items-center">
                                    <h3 className="text-lg font-orbitron font-bold mb-4 text-brand-glow">
                                        {gameCategory === 'Board' ? 'Board Preview' : t('cardPreview')}
                                    </h3>

                                    {gameCategory === 'Board' ? (
                                        <div className="w-64 h-64 bg-brand-deep-purple/50 p-2 rounded-lg border-2 border-brand-light-purple/50 shadow-lg">
                                            <div className="grid grid-cols-10 gap-1 w-full h-full">
                                                {boardGrid.flat().map((letter, index) => (
                                                    <div key={index} className="flex items-center justify-center bg-brand-mid-purple/70 rounded-sm text-white font-mono text-xs aspect-square">
                                                        {letter}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-64 h-[25rem] perspective-[1000px] cursor-pointer group" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                                            <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                                                {/* Front Side */}
                                                <div className="absolute w-full h-full backface-hidden rounded-2xl border-4 border-yellow-400/50 p-4 flex flex-col bg-cover bg-center shadow-lg shadow-black/50" style={{ backgroundImage: "url('Image/bg.png')" }}>
                                                    <div className="absolute top-2 left-2 bg-black/50 px-3 py-1 rounded-full text-sm font-bold text-white">{editorCard.points || 0} pts</div>
                                                    <div className="absolute top-2 right-2 bg-black/50 px-3 py-1 rounded-full text-sm font-semibold text-white truncate max-w-[100px]">{editorCard.category || 'Category'}</div>
                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-purple-600/80 px-4 py-1 rounded-full text-sm font-bold text-white">{(editorCard.points || 0) * 10} XP</div>

                                                    <div className="flex-grow flex flex-col justify-between pt-8 pb-10">
                                                        <div className="w-full h-32 bg-black/30 rounded-lg flex items-center justify-center border border-yellow-300/50 overflow-hidden">
                                                            {editorCard.imageUrl ? (
                                                                <img src={editorCard.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-gray-400 text-xs text-center p-2">Image Preview</span>
                                                            )}
                                                        </div>
                                                        <div className="w-full bg-gradient-to-r from-blue-500/80 to-brand-accent/80 p-2 my-2 rounded-lg text-white font-semibold text-center text-sm">
                                                            <p>{editorCard.question || 'Your Question Here'}</p>
                                                        </div>
                                                        <div className="w-full bg-white/90 text-black text-center font-semibold p-2 rounded-lg text-sm">
                                                            {editorCard.type === 'identification' ? editorCard.answer : (editorCard as MultipleChoiceQuestion).answer || 'Correct Answer'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Back Side */}
                                                <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl border-4 border-yellow-400/50 overflow-hidden shadow-lg shadow-black/50">
                                                    <img src="Image/Backcard.png" className="w-full h-full object-cover" alt="Card Back" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-brand-deep-purple p-4 rounded-xl border border-brand-light-purple/30">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold mb-2 block">Upload Image (appears on front)</label>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => fileInputRef.current?.click()} className="bg-white text-gray-800 text-sm font-semibold py-2 px-4 rounded-lg border border-gray-300">Choose File</button>
                                                <button onClick={() => setSelectQuestionModalOpen(true)} className="bg-brand-light-purple text-white text-sm font-semibold py-2 px-4 rounded-lg border border-brand-glow">Select Question</button>
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold mb-1 block">Question</label>
                                            <textarea name="question" value={editorCard.question} onChange={handleEditorChange} rows={3} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold mb-1 block">Category</label>
                                            <select
                                                name="category"
                                                value={editorCard.category}
                                                onChange={handleEditorChange}
                                                className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300"
                                            >
                                                {questionCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-8">
                                                <label className="text-sm font-semibold mb-1 block">Mode</label>
                                                <select
                                                    name="type"
                                                    value={editorCard.type}
                                                    onChange={handleTypeChange}
                                                    className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-glow disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={gameCategory === 'Board'}
                                                >
                                                    <option value="identification">Identification</option>
                                                    <option value="multiple-choice">Multiple Choice</option>
                                                </select>
                                            </div>
                                            <div className="col-span-4">
                                                <label className="text-sm font-semibold mb-1 block">Points</label>
                                                <input type="number" name="points" value={editorCard.points} onChange={handleEditorChange} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-glow" />
                                            </div>
                                        </div>
                                        {isMultipleChoice ? (
                                            <div>
                                                <label className="text-sm font-semibold mb-1 block">Options & Correct Answer</label>
                                                <div className="space-y-2">
                                                    {(editorCard as MultipleChoiceQuestion).options.map((option, index) => (
                                                        <div key={index} className="flex items-center space-x-2">
                                                            <input type="radio" name="correctAnswer" value={option} checked={(editorCard as MultipleChoiceQuestion).answer === option} onChange={(e) => setEditorCard({...editorCard, answer: e.target.value})} className="accent-brand-glow" />
                                                            <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-1.5 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-glow" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-sm font-semibold mb-1 block">Correct Answer (Identification)</label>
                                                <input name="answer" value={(editorCard as IdentificationQuestion).answer} onChange={handleEditorChange} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow" />
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-sm font-semibold mb-1 block">Time Limit (seconds)</label>
                                            <input type="number" name="timeLimit" value={editorCard.timeLimit} onChange={handleEditorChange} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-glow" />
                                        </div>
                                        <div className="flex space-x-4 pt-2">
                                            <button onClick={handleClearEditor} className="w-full bg-brand-light-purple/80 text-white font-semibold py-2 rounded-lg transition-colors hover:bg-brand-light-purple">Clear Editor</button>
                                            <button onClick={handleSaveCard} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors hover:bg-blue-500">
                                                {editingCardIndex !== null ? 'Update Card' : 'Save Card'}
                                            </button>
                                        </div>
                                    </div>

                                    {quizCards.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-brand-light-purple/30">
                                            <h3 className="font-bold text-lg">Saved Cards</h3>
                                            <div className="space-y-2">
                                                {quizCards.map((card, index) => (
                                                    <SavedCardItem 
                                                        key={card.id} 
                                                        questionText={card.question} 
                                                        onEdit={() => handleEditCard(index)} 
                                                        onDelete={() => handleDeleteCard(index)} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <footer className="absolute bottom-0 left-0 right-0 p-4 bg-brand-deep-purple/80 backdrop-blur-sm border-t border-brand-light-purple/30">
                 <button
                    onClick={handleProceed}
                    disabled={!quizName.trim() || gameMode === 'Classroom'}
                    className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-500 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {quizToEdit
                        ? 'Update Quiz'
                        : (gameCategory === 'Card' || gameCategory === 'Board' ? 'Save Quiz' : t('selectQuestions'))}
                </button>
            </footer>
            
            <SelectQuestionFromVaultModal 
                isOpen={isSelectQuestionModalOpen}
                onClose={() => setSelectQuestionModalOpen(false)}
                onSelectQuestions={handleAddQuestionsFromVault}
                gameCategory={gameCategory}
            />
        </div>
    );
};

export default CreateQuizScreen;