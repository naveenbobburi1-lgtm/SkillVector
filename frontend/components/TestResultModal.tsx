"use client";

interface TestResult {
    question: string;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation: string;
}

interface TestResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    results: TestResult[];
    nextPhaseUnlocked: boolean;
    isLastPhase?: boolean;
}

export default function TestResultModal({
    isOpen,
    onClose,
    score,
    passed,
    correctCount,
    totalQuestions,
    results,
    nextPhaseUnlocked,
    isLastPhase = false
}: TestResultModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-surface-1 border-2 border-border rounded-2xl max-w-4xl w-full p-6 my-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header with Score */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center h-24 w-24 rounded-full mb-4 animate-in zoom-in-50 duration-500 ${
                        passed ? "bg-success/10" : "bg-error/10"
                    }`}>
                        <span className={`material-symbols-outlined text-6xl ${
                            passed ? "text-success" : "text-error"
                        }`}>
                            {passed ? "check_circle" : "cancel"}
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-text-main mb-2">
                        {passed ? (isLastPhase ? "🎉 Path Completed!" : "Congratulations!") : "Keep Trying!"}
                    </h2>
                    <p className="text-lg text-text-muted mb-4">
                        You scored <span className="font-bold text-text-main">{score}%</span> ({correctCount}/{totalQuestions} correct)
                    </p>
                    {passed ? (
                        isLastPhase ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-lg">
                                <span className="material-symbols-outlined text-success">emoji_events</span>
                                <span className="text-success font-medium">You've completed the entire learning path!</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-lg">
                                <span className="material-symbols-outlined text-success">lock_open</span>
                                <span className="text-success font-medium">Next phase unlocked!</span>
                            </div>
                        )
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/20 rounded-lg">
                            <span className="material-symbols-outlined text-warning">lock</span>
                            <span className="text-warning font-medium">Need 70% to pass. Try again!</span>
                        </div>
                    )}
                </div>

                {/* Results Breakdown */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    <h3 className="text-sm font-bold text-text-dim uppercase tracking-wider sticky top-0 bg-surface-1 py-2">
                        Answer Review
                    </h3>
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-xl border-2 ${
                                result.is_correct
                                    ? "border-success/20 bg-success/5"
                                    : "border-error/20 bg-error/5"
                            }`}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    result.is_correct ? "bg-success/20" : "bg-error/20"
                                }`}>
                                    <span className={`material-symbols-outlined text-base ${
                                        result.is_correct ? "text-success" : "text-error"
                                    }`}>
                                        {result.is_correct ? "check" : "close"}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-mono text-text-dim mb-1">Question {index + 1}</p>
                                    <p className="text-text-main font-medium mb-2">{result.question}</p>
                                    
                                    {!result.is_correct && (
                                        <div className="space-y-1 text-sm mt-3">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-error text-base">close</span>
                                                <span className="text-text-muted">Your answer: <span className="font-medium">Option {result.user_answer + 1}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-success text-base">check</span>
                                                <span className="text-text-muted">Correct answer: <span className="font-medium text-success">Option {result.correct_answer + 1}</span></span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {result.explanation && (
                                        <div className="mt-3 p-3 bg-surface-2/50 rounded-lg border border-border/50">
                                            <p className="text-xs text-text-dim uppercase tracking-wider font-bold mb-1">Explanation</p>
                                            <p className="text-sm text-text-muted leading-relaxed">{result.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-border">
                    {!passed && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Retry Test
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${passed ? "flex-1" : ""} px-6 py-3 bg-surface-2 hover:bg-surface-3 text-text-main rounded-xl font-medium transition-colors`}
                    >
                        {passed ? (isLastPhase ? "View Completed Path" : "Continue Learning") : "Review Material"}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: var(--surface-2);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                }
            `}</style>
        </div>
    );
}
