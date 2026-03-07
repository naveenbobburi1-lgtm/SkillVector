"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LearningPathResponse } from "./types";
import { API_BASE_URL, getToken, removeToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import TestModal from "@/components/TestModal";
import TestResultModal from "@/components/TestResultModal";
import AIAssistant from "@/components/AIAssistant";

export default function LearningPathPage() {
  const router = useRouter();
  const [data, setData] = useState<LearningPathResponse | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Test modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [currentTestPhase, setCurrentTestPhase] = useState<number | null>(null);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  
  // Test result state
  const [showResultModal, setShowResultModal] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Fetch Learning Path
        const pathRes = await fetch(`${API_BASE_URL}/generate-path`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (pathRes.status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        if (!pathRes.ok) throw new Error("Failed to fetch learning path");
        const pathJson = await pathRes.json();
        setData(pathJson);

        // Fetch Phase Progress
        const progressRes = await fetch(`${API_BASE_URL}/phase-progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData.progress || []);
        }

        // Fetch Profile for Nav
        const profileRes = await fetch(`${API_BASE_URL}/user-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          setProfile(profileJson);
        }

      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleTakeTest = async (phaseIndex: number) => {
    setTestLoading(true);
    setCurrentTestPhase(phaseIndex);
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/phase-test/${phaseIndex}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load test");
      }

      const testData = await res.json();
      console.log("Test data loaded:", testData.questions?.length, "questions");
      
      if (!testData.questions || testData.questions.length === 0) {
        throw new Error("No test questions received");
      }
      
      setTestQuestions(testData.questions);
      setShowTestModal(true);
    } catch (err: any) {
      console.error("Test loading error:", err);
      alert(err.message || "Failed to load test");
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmitTest = async (answers: number[]) => {
    if (currentTestPhase === null) return;

    const token = getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/submit-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phase_index: currentTestPhase,
          answers,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit test");
      }

      const result = await res.json();
      console.log("Test result received:", result);
      
      setTestResult(result);
      setShowTestModal(false);
      
      // Small delay to ensure modal transition
      setTimeout(() => {
        setShowResultModal(true);
      }, 100);

      // Refresh progress
      const progressRes = await fetch(`${API_BASE_URL}/phase-progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData.progress || []);
      }
    } catch (err: any) {
      console.error("Test submission error:", err);
      alert(err.message || "Failed to submit test");
    }
  };

  const getPhaseProgress = (index: number) => {
    const foundProgress = progress.find((p) => p.phase_index === index);
    
    // If no progress data exists, unlock Phase 1 by default
    if (!foundProgress && progress.length === 0 && index === 0) {
      return {
        is_unlocked: true,
        is_completed: false,
        test_passed: false,
        best_score: 0,
      };
    }
    
    return foundProgress || {
      is_unlocked: false,
      is_completed: false,
      test_passed: false,
      best_score: 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-main font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center animate-spin">
            <span className="material-symbols-outlined text-white text-lg">hub</span>
          </div>
          <p className="text-text-muted animate-pulse">Generating your personalized path...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-text-main font-sans flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-text-muted">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalPhases = data.learning_path.length;
  const completedPhases = progress.filter((p) => p.is_completed).length;
  const allPhasesCompleted = totalPhases > 0 && completedPhases === totalPhases;

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-white">
      <Navbar activePage="learning-path" />

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-10">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary uppercase tracking-wider">
                AI Generated
              </span>
              <span className="text-xs font-mono font-bold text-text-dim uppercase tracking-wider">
                {data?.meta?.level ?? "Beginner"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-main tracking-tight mb-4">
              {data.meta.goal} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Path</span>
            </h1>
            <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
              Personalized roadmap generated based on your goal to become a {data.meta.goal}.
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-surface-1 border border-border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
            <div>
              <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-1">Estimated Velocity</h3>
              <div className="text-3xl font-bold text-text-main">{data.meta.duration_months} Months</div>
              <p className="text-xs text-text-muted mt-2">At {data.meta.weekly_time_hours} hours/week pace</p>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-between items-end">
              <div>
                <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-1">Target</h3>
                <div className="text-xl font-bold text-text-main">{data.meta.goal}</div>
              </div>
              <div className="h-10 w-10 bg-surface-2 rounded-lg flex items-center justify-center border border-border">
                <span className="material-symbols-outlined text-success">trending_up</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="relative border-l-2 border-border ml-4 md:ml-10 space-y-12 pb-12">
          {/* Overall Progress Bar */}
          <div className="pl-8 md:pl-12 mb-4">
            <div className="bg-surface-1 border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
                  Overall Progress
                </h3>
                <span className="text-sm font-bold text-text-main">{completedPhases} / {totalPhases} Phases</span>
              </div>
              <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500 rounded-full"
                  style={{ width: `${totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0}%` }}
                ></div>
              </div>
              {allPhasesCompleted && (
                <p className="text-xs text-success mt-2 font-medium">All phases completed!</p>
              )}
            </div>
          </div>
          {data.learning_path.map((phase: any, index: number) => {
            const phaseProgress = getPhaseProgress(index);
            const isLocked = !phaseProgress.is_unlocked;
            const isCompleted = phaseProgress.is_completed;

            return (
              <div key={index} className={`relative pl-8 md:pl-12 ${isLocked ? "opacity-60" : ""}`}>
                {/* Node */}
                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-background ${
                  isCompleted ? "bg-success shadow-[0_0_0_4px_rgba(34,197,94,0.2)]" :
                  !isLocked ? "bg-primary shadow-[0_0_0_4px_rgba(124,58,237,0.2)]" :
                  "bg-surface-2"
                }`}></div>

                {/* Content Grid */}
                <div className="flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h2 className="text-2xl font-bold text-text-main">
                           {phase.phase || phase.stage}
                        </h2>
                        {isLocked && <span className="px-2 py-1 rounded text-xs font-bold bg-surface-2 text-text-dim flex items-center gap-1 flex-shrink-0">
                          <span className="material-symbols-outlined text-sm">lock</span>
                          LOCKED
                        </span>}
                        {isCompleted && <span className="px-2 py-1 rounded text-xs font-bold bg-success/10 text-success flex items-center gap-1 flex-shrink-0">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          COMPLETED
                        </span>}
                        {!isLocked && !isCompleted && <span className="px-2 py-1 rounded text-xs font-bold bg-primary text-white flex-shrink-0">IN PROGRESS</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">schedule</span>
                          {phase.duration_weeks || phase.duration_months * 4} Weeks
                        </div>
                        {phaseProgress.best_score > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-warning">trophy</span>
                            <span>Best Score: {phaseProgress.best_score}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Test Button - Made more prominent and always visible */}
                    {!isLocked && (
                      <button
                        onClick={() => handleTakeTest(index)}
                        disabled={testLoading}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 relative z-20 ${
                          isCompleted
                            ? "bg-surface-2 hover:bg-surface-3 text-text-main border-2 border-border"
                            : "bg-warning hover:bg-warning/90 text-white shadow-lg hover:shadow-2xl"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="material-symbols-outlined text-xl text-black">quiz</span>
                        <span className="text-black">{testLoading ? "Loading..." : (isCompleted ? "Retake Test" : "Take Test")}</span>
                      </button>
                    )}
                  </div>

                  {/* Why this phase */}
                  <div className="bg-surface-2/50 border border-border rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">psychology</span>
                      Why this phase?
                    </h3>
                    <p className="text-text-main text-sm leading-relaxed italic">
                      "{phase.why_this_phase || phase.why_this_module || "This phase is essential for building the foundational skills required for your target role."}"
                    </p>
                  </div>

                  {/* Weekly Breakdown */}
                  {phase.weekly_breakdown && phase.weekly_breakdown.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider">Week-by-Week Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {phase.weekly_breakdown?.map((week: any, wIndex: number) => (
                          <div key={wIndex} className="bg-surface-1 border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{week.week}</span>
                              </div>
                              <h4 className="text-sm font-bold text-text-main">{week.focus}</h4>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1">Objectives</p>
                                <ul className="space-y-1">
                                  {week.learning_objectives?.slice(0, 2).map((obj: string, oIndex: number) => (
                                    <li key={oIndex} className="text-xs text-text-muted flex items-start gap-1">
                                      <span className="material-symbols-outlined text-xs text-primary mt-0.5">check</span>
                                      <span>{obj}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics & Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-3">Key Topics</h3>
                      <ul className="space-y-2">
                        {phase.topics?.map((topic: string, tIndex: number) => (
                          <li key={tIndex} className="flex items-start gap-2 text-sm text-text-muted">
                            <span className="material-symbols-outlined text-base text-primary mt-0.5">check_circle</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-3">Skills Acquired</h3>
                      <div className="flex flex-wrap gap-2">
                        {phase.skills?.map((skill: string, sIndex: number) => (
                          <span key={sIndex} className="px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-medium text-text-muted hover:text-text-main hover:border-primary/50 transition-colors cursor-default">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resources Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-2">Curated Resources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phase.resources?.map((resource: any, rIndex: number) => (
                        <a key={rIndex} href={resource.link} target="_blank" rel="noopener noreferrer" className="group flex flex-col p-4 bg-surface-1 border border-border rounded-xl hover:border-primary/50 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              resource.type === 'Course' ? 'bg-blue-500/10 text-blue-500' :
                              resource.type === 'Article' ? 'bg-green-500/10 text-green-500' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>{resource.type}</span>
                            <span className="material-symbols-outlined text-sm text-text-muted group-hover:text-primary transition-colors">open_in_new</span>
                          </div>
                          <h4 className="text-sm font-bold text-text-main mb-1 line-clamp-2 group-hover:text-primary transition-colors">{resource.title}</h4>
                          <p className="text-xs text-text-muted mt-auto pt-2 border-t border-border/50">{resource.platform}</p>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-2">Hands-on Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {phase.projects?.map((project: any, pIndex: number) => (
                        <div key={pIndex} className="bg-surface-1 border border-border rounded-xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-surface-2 flex items-center justify-center text-success">
                                <span className="material-symbols-outlined text-lg">code_blocks</span>
                              </div>
                              <h4 className="text-sm font-bold text-text-main">{project.title}</h4>
                            </div>
                            {project.difficulty && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                project.difficulty === 'Easy' ? 'bg-success/10 text-success' :
                                project.difficulty === 'Medium' ? 'bg-warning/10 text-warning' :
                                'bg-error/10 text-error'
                              }`}>{project.difficulty}</span>
                            )}
                          </div>
                          <p className="text-sm text-text-muted">{project.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Learning Path Completed Banner */}
        {allPhasesCompleted && (
          <div className="relative overflow-hidden bg-gradient-to-br from-success/10 via-primary/5 to-success/10 border-2 border-success/30 rounded-2xl p-8 md:p-12 text-center">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-4 left-8 text-6xl">🎉</div>
              <div className="absolute top-8 right-12 text-5xl">🏆</div>
              <div className="absolute bottom-4 left-1/4 text-4xl">⭐</div>
              <div className="absolute bottom-6 right-1/4 text-5xl">🚀</div>
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-success/20 border-2 border-success/40 mx-auto">
                <span className="material-symbols-outlined text-5xl text-success">emoji_events</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-text-main">
                Learning Path <span className="text-transparent bg-clip-text bg-gradient-to-r from-success to-primary">Completed!</span>
              </h2>
              <p className="text-lg text-text-muted max-w-xl mx-auto">
                Congratulations! You've successfully completed all {totalPhases} phases of your learning path. 
                You've demonstrated mastery across every topic.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link
                  href="/profile"
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <span className="material-symbols-outlined">person</span>
                  View Profile
                </Link>
                <Link
                  href="/market-insights"
                  className="px-6 py-3 bg-surface-2 hover:bg-surface-3 text-text-main rounded-xl font-bold transition-all flex items-center gap-2 border border-border"
                >
                  <span className="material-symbols-outlined">query_stats</span>
                  Market Insights
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Test Modal */}
      {showTestModal && currentTestPhase !== null && (
        <TestModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          phaseIndex={currentTestPhase}
          phaseName={data.learning_path[currentTestPhase]?.stage || `Phase ${currentTestPhase + 1}`}
          questions={testQuestions}
          onSubmit={handleSubmitTest}
        />
      )}

      {/* Test Result Modal */}
      {showResultModal && testResult && (
        <TestResultModal
          isOpen={showResultModal}
          onClose={() => {
            setShowResultModal(false);
            setTestResult(null);
          }}
          score={testResult.score}
          passed={testResult.passed}
          correctCount={testResult.correct_count}
          totalQuestions={testResult.total_questions}
          results={testResult.results}
          nextPhaseUnlocked={testResult.next_phase_unlocked}
          isLastPhase={currentTestPhase === data.learning_path.length - 1}
        />
      )}

      {/* AI Assistant */}
      <AIAssistant learningPath={data} />
    </div>
  );
}
