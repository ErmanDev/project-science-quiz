import React, { useState, useEffect, useRef } from 'react';
import { Question, MultipleChoiceQuestion, IdentificationQuestion, QuestionCategory } from '../../data/teacherQuizQuestions';
import { useTranslations } from '../../hooks/useTranslations';

interface EditQuestionModalProps {
    isOpen: boolean;
    question: Question | null;
    onClose: () => void;
    onSave: (question: Question) => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({ isOpen, question, onClose, onSave }) => {
    const { t } = useTranslations();
    const [formData, setFormData] = useState<Question | null>(null);
    const [fileName, setFileName] = useState<string>('No file chosen');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (question) {
            setFormData(JSON.parse(JSON.stringify(question)));
             if (question.imageUrl) {
                setFileName('image_preview.png'); // Placeholder for existing images
            } else {
                setFileName('No file chosen');
            }
        }
    }, [question]);

    if (!isOpen || !formData) return null;

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'points' || name === 'timeLimit') {
            setFormData({ ...formData, [name]: parseInt(value, 10) || 0 });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as 'multiple-choice' | 'identification';
        if (newType === formData!.type) return;

        const baseData = {
            id: formData!.id,
            question: formData!.question,
            points: formData!.points,
            category: formData!.category,
            imageUrl: formData!.imageUrl,
            timeLimit: formData!.timeLimit,
        };

        if (newType === 'multiple-choice') {
            setFormData({
                ...baseData,
                type: 'multiple-choice',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                answer: 'Option A'
            });
        } else { // identification
            setFormData({
                ...baseData,
                type: 'identification',
                answer: ''
            });
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        if (formData.type === 'multiple-choice') {
            const newOptions = [...(formData as MultipleChoiceQuestion).options];
            newOptions[index] = value;
            setFormData({ ...formData, options: newOptions });
        }
    };
    
    const handleAnswerChange = (value: string) => {
        if (formData.type === 'multiple-choice') {
            setFormData({ ...formData, answer: value });
        } else {
             setFormData({ ...formData, answer: value });
        }
    }

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData({ ...formData, imageUrl: undefined });
        setFileName('No file chosen');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSave = () => {
        if (formData) {
            onSave(formData);
        }
    };

    const isNewQuestion = formData.id === 0;
    const isMultipleChoice = formData.type === 'multiple-choice';
    const questionCategories: QuestionCategory[] = ['Earth and Space', 'Living Things and Their Environment', 'Matter', 'Force, Motion, and Energy'];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="relative w-full max-w-lg bg-brand-mid-purple rounded-2xl p-6 flex flex-col backdrop-blur-md border border-brand-light-purple/50 text-white"
                onClick={(e) => e.stopPropagation()}
            >
                 <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold font-orbitron mb-4">{isNewQuestion ? "Add Card" : "Edit Card"}</h2>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar">
                     <div>
                        <label className="text-sm font-semibold mb-2 block">Upload Image (appears on front)</label>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleImageUploadClick}
                                className="bg-gray-200 text-gray-800 dark:bg-brand-deep-purple dark:text-gray-200 text-sm font-semibold py-2 px-4 rounded-lg border border-gray-300 dark:border-brand-light-purple/50 hover:bg-gray-300 dark:hover:bg-brand-deep-purple/50"
                            >
                                Choose File
                            </button>
                            <span className="text-sm text-gray-400 truncate">{fileName}</span>
                        </div>
                        {formData.imageUrl && (
                            <div className="relative w-28 mt-4">
                                <img src={formData.imageUrl} alt="Preview" className="rounded-lg w-full h-auto" />
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                                    aria-label="Remove image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-semibold mb-1 block">Question</label>
                        <textarea name="question" value={formData.question} onChange={handleTextChange} rows={3} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300" />
                    </div>
                    
                    <div>
                        <label className="text-sm font-semibold mb-1 block">Mode</label>
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleTypeChange}
                                className="col-span-6 w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-glow"
                            >
                                <option value="multiple-choice">Multiple Choice</option>
                                <option value="identification">Identification</option>
                            </select>
                            <input type="number" name="points" value={formData.points} onChange={handleTextChange} className="col-span-3 w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-glow" />
                            <input type="number" name="timeLimit" value={formData.timeLimit || ''} onChange={handleTextChange} className="col-span-3 w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-glow" />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-semibold mb-1 block">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleTextChange}
                            className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300"
                        >
                            {questionCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {isMultipleChoice ? (
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Options & Correct Answer</label>
                            <div className="space-y-2">
                                {(formData as MultipleChoiceQuestion).options.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input type="radio" name="correctAnswer" value={option} checked={(formData as MultipleChoiceQuestion).answer === option} onChange={(e) => handleAnswerChange(e.target.value)} className="accent-brand-glow" />
                                        <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-1.5 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-glow" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-semibold mb-1 block">{`Correct Answer (${(formData as IdentificationQuestion).type})`}</label>
                            <input name="answer" value={(formData as IdentificationQuestion).answer} onChange={handleTextChange} className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300" />
                        </div>
                    )}
                </div>

                <div className="flex space-x-4 mt-6">
                    <button onClick={onClose} className="w-full bg-brand-light-purple/80 text-white font-semibold py-2 rounded-lg transition-colors hover:bg-brand-light-purple">
                        Clear Editor
                    </button>
                    <button onClick={handleSave} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors hover:bg-blue-500">
                        Save Card
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditQuestionModal;