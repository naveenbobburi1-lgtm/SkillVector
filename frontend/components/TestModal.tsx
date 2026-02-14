"use client";

import { useState } from "react";

interface Question {
    question: string;
    options: string[];
    difficulty: string;
}

interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    phaseIndex: number;
    phaseName: string;
    questions: Question[];
    onSubmit: (answers: number[]) => void;
}

export default function TestModal({ isOpen, onClose, phaseIndex, phaseName, questions, onSubmit }: TestModalProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSelectAnswer = (answerIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = answerIndex;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = async () => {
        // Check if all questions answered
        if (answers.includes(-1)) {
            alert("Please answer all questions before submitting!");
            return;
        }

        setIsSubmitting(true);
        await onSubmit(answers);
        setIsSubmitting(false);
    };

    const question = questions[currentQuestion];
    const answeredCount = answers.filter(a => a !== -1).length;
    const progress = (answeredCount / questions.length) * 100;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case "easy": return "text-success bg-success/10";
            case "medium": return "text-warning bg-warning/10";
            case "hard": return "text-error bg-error/10";
            default: return "text-text-dim bg-surface-2";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-surface-1 border-2 border-border rounded-2xl max-w-3xl w-full p-6 my-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative z-50">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">Phase {phaseIndex + 1} Test</h2>
                        <p className="text-sm text-text-muted mt-1">{phaseName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-surface-2 flex items-center justify-center transition-colors"
                        disabled={isSubmitting}
                    >
                        <span className="material-symbols-outlined text-text-muted">close</span>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-muted">Progress: {answeredCount} / {questions.length}</span>
                        <span className="text-text-main font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question */}
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-sm font-mono font-bold text-text-dim">Q{currentQuestion + 1}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getDifficultyColor(question.difficulty)}`}>
                                    {question.difficulty}
                                </span>
                            </div>
                            <h3 className="text-lg font-medium text-text-main leading-relaxed">
                                {question.question}
                            </h3>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {question.options.map((option, index) => {
                            const isSelected = answers[currentQuestion] === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSelectAnswer(index)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                        isSelected
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-surface-2/50 hover:bg-surface-2 hover:border-border/80"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                            isSelected ? "border-primary bg-primary" : "border-border bg-transparent"
                                        }`}>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-white text-sm">check</span>
                                            )}
                                        </div>
                                        <span className="text-text-main">{option}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-border gap-4">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className="px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text-main rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Previous
                    </button>

                    <div className="flex gap-2 flex-wrap justify-center">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestion(idx)}
                                className={`h-2 rounded-full transition-all ${
                                    idx === currentQuestion
                                        ? "w-8 bg-primary"
                                        : answers[idx] !== -1
                                        ? "w-2 bg-success"
                                        : "w-2 bg-surface-3"
                                }`}
                            ></button>
                        ))}
                    </div>

                    {currentQuestion < questions.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg"
                        >
                            Next
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || answeredCount < questions.length}
                            className="px-6 py-3 bg-success hover:bg-success/90 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center shadow-xl hover:shadow-2xl hover:scale-105"
                            style={{ minWidth: '140px' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Submitting...
                                </>
                            ) : (
                                <span className="text-black">
                                    <span className="material-symbols-outlined text-xl text-black">check_circle</span>
                                    Submit Test
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Pass/Fail Info */}
                <div className="mt-4 bg-surface-2/50 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span className="material-symbols-outlined text-primary text-base">info</span>
                        {currentQuestion === questions.length - 1 ? (
                            <span className="text-success font-bold">This is the last question! Click Submit Test when ready.</span>
                        ) : (
                            <span>You need <strong className="text-text-main">70% or higher</strong> to pass and unlock the next phase.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
