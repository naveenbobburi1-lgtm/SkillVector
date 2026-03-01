"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "learning-path" | "tests" | "videos">("overview");
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  // Assign video modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignMandatory, setAssignMandatory] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUser(await res.json());
        else router.push("/admin/users");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchUser();
  }, [userId, token, router]);

  async function openAssignModal() {
    setShowAssignModal(true);
    setAssignMsg(null);
    setSelectedVideoId(null);
    setAssignDueDate("");
    setAssignMandatory(true);
    setVideosLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableVideos(data.videos || []);
      }
    } catch (e) { console.error(e); }
    finally { setVideosLoading(false); }
  }

  async function handleAssignVideo() {
    if (!selectedVideoId) return;
    setAssigning(true);
    setAssignMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos/${selectedVideoId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_ids: [Number(userId)],
          due_date: assignDueDate || null,
          is_mandatory: assignMandatory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignMsg({ type: "success", text: `Video assigned successfully (${data.assigned_count} new)` });
        // Refresh user data
        const res2 = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res2.ok) setUser(await res2.json());
        setTimeout(() => setShowAssignModal(false), 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        setAssignMsg({ type: "error", text: err.detail || "Failed to assign" });
      }
    } catch (e) {
      setAssignMsg({ type: "error", text: "Network error" });
    } finally { setAssigning(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <p className="text-text-muted">User not found.</p>;

  const profile = user.profile;
  const phases = user.phase_progress || [];
  const learningPath = user.learning_path?.learning_path || [];
  const tests = user.test_history || [];
  const videos = user.video_progress || [];

  const completedPhases = phases.filter((p: any) => p.is_completed).length;
  const totalPhases = phases.length || learningPath.length;
  const completionPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
  const testsPassed = tests.filter((t: any) => t.passed).length;
  const avgScore = tests.length > 0 ? Math.round(tests.reduce((s: number, t: any) => s + t.score, 0) / tests.length) : 0;
  const videosCompleted = videos.filter((v: any) => v.is_completed).length;

  const tabs = [
    { id: "overview", label: "Overview", icon: "person" },
    { id: "learning-path", label: "Learning Path", icon: "route" },
    { id: "tests", label: "Test History", icon: "quiz" },
    { id: "videos", label: "Videos", icon: "play_circle" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <button onClick={() => router.push("/admin/users")} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Users
      </button>

      <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{user.user.username?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-main">{user.user.username}</h1>
              {user.user.is_admin && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/8 text-primary border border-primary/15">Admin</span>}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${user.user.is_active ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/15" : "bg-red-500/8 text-red-600 border border-red-500/15"}`}>
                {user.user.is_active ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-sm text-text-muted mt-0.5">{user.user.email}</p>
            {user.user.created_at && <p className="text-xs text-text-dim mt-1">Joined {new Date(user.user.created_at).toLocaleDateString()}</p>}
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <MiniStat label="Path" value={`${completionPct}%`} icon="route" />
            <MiniStat label="Tests" value={`${testsPassed}/${tests.length}`} icon="quiz" />
            <MiniStat label="Videos" value={`${videosCompleted}/${videos.length}`} icon="play_circle" />
            <button
              onClick={openAssignModal}
              className="h-fit px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-primary/15 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">assignment_add</span>
              Assign Video
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2/70 rounded-full border border-border/50 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
              activeTab === t.id
                ? "bg-surface-1 text-text-main font-medium shadow-sm border border-border/50"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Info */}
          <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-4">Profile Information</h3>
            {profile ? (
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Desired Role" value={profile.desired_role} />
                <InfoItem label="Education" value={profile.education_level} />
                <InfoItem label="Location" value={profile.location} />
                <InfoItem label="Status" value={profile.current_status} />
                <InfoItem label="Learning Pace" value={profile.learning_pace} />
                <InfoItem label="Hours/Week" value={profile.hours_per_week} />
                <InfoItem label="Timeline" value={profile.timeline} />
                <InfoItem label="Income Target" value={profile.expected_income} />
              </div>
            ) : (
              <p className="text-text-dim text-sm italic">No profile set up yet</p>
            )}
          </div>

          {/* Skills & Certs */}
          <div className="space-y-6">
            <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-3">Skills</h3>
              {profile?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-primary/5 text-primary border border-primary/15">{s}</span>
                  ))}
                </div>
              ) : <p className="text-text-dim text-sm italic">No skills listed</p>}
            </div>

            {profile?.certifications?.length > 0 && (
              <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-3">Certifications</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.certifications.map((c: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/5 text-emerald-600 border border-emerald-500/15">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {profile?.preferred_industries?.length > 0 && (
              <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-3">Preferred Industries</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.preferred_industries.map((ind: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-blue-500/5 text-blue-600 border border-blue-500/15">{ind}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "learning-path" && (
        <div className="space-y-4">
          {/* Progress summary */}
          <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-main">Learning Path Progress</h3>
              <span className="text-sm font-bold text-primary">{completionPct}% Complete</span>
            </div>
            <div className="w-full h-3 bg-surface-3 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-text-muted">
              <span>{completedPhases} completed</span>
              <span>{phases.filter((p: any) => p.is_unlocked && !p.is_completed).length} in progress</span>
              <span>{phases.filter((p: any) => !p.is_unlocked).length} locked</span>
            </div>
          </div>

          {/* Phase cards */}
          {learningPath.length === 0 && phases.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-2xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-3xl text-text-dim mb-2">route</span>
              <p className="text-text-muted text-sm">No learning path generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(learningPath.length > 0 ? learningPath : phases).map((item: any, i: number) => {
                const progress = phases[i];
                const isCompleted = progress?.is_completed;
                const isUnlocked = progress?.is_unlocked;
                const testPassed = progress?.test_passed;
                const bestScore = progress?.best_score || 0;

                return (
                  <div key={i} className={`bg-surface-1 border rounded-2xl overflow-hidden transition-all shadow-sm ${
                    isCompleted ? "border-emerald-500/30" : isUnlocked ? "border-primary/30" : "border-border"
                  }`}>
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : isUnlocked
                            ? "bg-primary/8 text-primary border border-primary/15"
                            : "bg-surface-3 text-text-dim border border-border"
                        }`}>
                          {isCompleted ? <span className="material-symbols-outlined text-lg">check</span> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-text-main">{item.phase || `Phase ${i + 1}`}</h4>
                            {isCompleted && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/8 text-emerald-600 border border-emerald-500/15">Completed</span>}
                            {isUnlocked && !isCompleted && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/8 text-primary border border-primary/15">In Progress</span>}
                            {!isUnlocked && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-3 text-text-dim border border-border">Locked</span>}
                          </div>

                          {/* Phase duration & focus */}
                          {item.duration && <p className="text-xs text-text-dim mb-2">Duration: {item.duration}</p>}

                          {/* Topics */}
                          {item.topics && item.topics.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium mb-1.5">Topics</p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.topics.map((t: string, ti: number) => (
                                  <span key={ti} className="px-2 py-0.5 rounded-md text-xs bg-surface-2 text-text-muted border border-border/50">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {item.resources && item.resources.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium mb-1.5">Resources</p>
                              <div className="space-y-1">
                                {item.resources.map((r: any, ri: number) => (
                                  <div key={ri} className="flex items-center gap-2 text-xs">
                                    <span className="material-symbols-outlined text-sm text-text-dim">link</span>
                                    <span className="text-text-muted">{typeof r === "string" ? r : r.name || r.title || JSON.stringify(r)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Projects */}
                          {item.projects && item.projects.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium mb-1.5">Projects</p>
                              <div className="space-y-1">
                                {item.projects.map((p: any, pi: number) => (
                                  <div key={pi} className="flex items-center gap-2 text-xs">
                                    <span className="material-symbols-outlined text-sm text-primary">code</span>
                                    <span className="text-text-muted">{typeof p === "string" ? p : p.name || p.title || JSON.stringify(p)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Test Info */}
                          {(testPassed || bestScore > 0) && (
                            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                              {testPassed && (
                                <span className="flex items-center gap-1 text-xs text-emerald-600">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  Test Passed
                                </span>
                              )}
                              {bestScore > 0 && <span className="text-xs text-text-dim">Best Score: {bestScore}%</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "tests" && (
        <div className="bg-surface-1 border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-main">Test Attempts ({tests.length})</h3>
            {tests.length > 0 && <p className="text-xs text-text-dim mt-0.5">Average score: {avgScore}% · Passed: {testsPassed}/{tests.length}</p>}
          </div>
          {tests.length === 0 ? (
            <div className="p-12 text-center text-text-dim text-sm">No test attempts yet</div>
          ) : (
            <div className="divide-y divide-border/50">
              {tests.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      t.passed ? "bg-emerald-500/8 text-emerald-600" : "bg-red-500/8 text-red-600"
                    }`}>
                      {t.score}%
                    </div>
                    <div>
                      <p className="text-sm text-text-main">Phase {t.phase_index + 1}</p>
                      <p className="text-[10px] text-text-dim">{t.created_at ? new Date(t.created_at).toLocaleString() : ""}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    t.passed
                      ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/15"
                      : "bg-red-500/8 text-red-600 border border-red-500/15"
                  }`}>
                    {t.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "videos" && (
        <div className="bg-surface-1 border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-main">Video Progress ({videos.length})</h3>
              {videos.length > 0 && <p className="text-xs text-text-dim mt-0.5">Completed: {videosCompleted}/{videos.length}</p>}
            </div>
            <button
              onClick={openAssignModal}
              className="px-3 py-1.5 bg-primary/8 text-primary hover:bg-primary/15 rounded-lg text-xs font-medium transition-colors border border-primary/15 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Assign
            </button>
          </div>
          {videos.length === 0 ? (
            <div className="p-12 text-center text-text-dim text-sm">No video assignments yet</div>
          ) : (
            <div className="divide-y divide-border/50">
              {videos.map((v: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      v.is_completed ? "bg-emerald-500/8 text-emerald-600" : "bg-primary/8 text-primary"
                    }`}>
                      <span className="material-symbols-outlined text-lg">{v.is_completed ? "check_circle" : "play_circle"}</span>
                    </div>
                    <div>
                      <p className="text-sm text-text-main">Video #{v.video_id}</p>
                      <p className="text-[10px] text-text-dim">
                        Watched: {Math.floor(v.watched_seconds / 60)}m
                        {v.started_at && ` · Started ${new Date(v.started_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${v.is_completed ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${v.completion_percent}%` }} />
                    </div>
                    <span className="text-xs text-text-dim w-10 text-right">{v.completion_percent}%</span>
                    {v.cheat_flags > 0 && (
                      <span className="text-[10px] text-red-500 bg-red-500/5 px-2 py-0.5 rounded-full border border-red-500/15">
                        {v.cheat_flags} flags
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Video Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-surface-1 border border-border rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-text-main">Assign Video to {user.user.username}</h3>
                <p className="text-xs text-text-dim mt-0.5">Select a video and configure assignment</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-main transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {videosLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableVideos.length === 0 ? (
                <div className="text-center py-8 text-text-dim text-sm">
                  <span className="material-symbols-outlined text-3xl block mb-2">videocam_off</span>
                  No videos available. Create videos first in the Videos page.
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium block mb-2">Select Video</label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {availableVideos.map((v: any) => {
                        const alreadyAssigned = videos.some((vp: any) => vp.video_id === v.id);
                        return (
                          <button
                            key={v.id}
                            disabled={alreadyAssigned}
                            onClick={() => setSelectedVideoId(v.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                              selectedVideoId === v.id
                                ? "border-primary bg-primary/5"
                                : alreadyAssigned
                                ? "border-border bg-surface-2/50 opacity-50 cursor-not-allowed"
                                : "border-border hover:border-primary/30 hover:bg-surface-2/30"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selectedVideoId === v.id ? "bg-primary/10 text-primary" : "bg-surface-3 text-text-dim"
                            }`}>
                              <span className="material-symbols-outlined text-lg">play_circle</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-main truncate">{v.title}</p>
                              <p className="text-[10px] text-text-dim">
                                {v.category && `${v.category} · `}
                                {Math.floor(v.duration_seconds / 60)}min
                              </p>
                            </div>
                            {alreadyAssigned && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-500/8 px-2 py-0.5 rounded-full border border-emerald-500/15">Already assigned</span>
                            )}
                            {selectedVideoId === v.id && !alreadyAssigned && (
                              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium block mb-1.5">Due Date</label>
                      <input
                        type="date"
                        value={assignDueDate}
                        onChange={(e) => setAssignDueDate(e.target.value)}
                        className="w-full bg-surface-1 border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium block mb-1.5">Type</label>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setAssignMandatory(true)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                            assignMandatory
                              ? "bg-primary/8 text-primary border-primary/15"
                              : "bg-surface-2 text-text-muted border-border"
                          }`}
                        >Mandatory</button>
                        <button
                          onClick={() => setAssignMandatory(false)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                            !assignMandatory
                              ? "bg-primary/8 text-primary border-primary/15"
                              : "bg-surface-2 text-text-muted border-border"
                          }`}
                        >Optional</button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {assignMsg && (
                <div className={`p-3 rounded-xl text-sm ${
                  assignMsg.type === "success"
                    ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/15"
                    : "bg-red-500/8 text-red-600 border border-red-500/15"
                }`}>
                  {assignMsg.text}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-border">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssignVideo}
                disabled={!selectedVideoId || assigning}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-primary/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {assigning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base">assignment_add</span>
                )}
                Assign Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-text-main">{value || <span className="text-text-dim italic">—</span>}</p>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-center">
      <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      <p className="text-sm font-bold text-text-main mt-0.5">{value}</p>
      <p className="text-[10px] text-text-dim uppercase tracking-wider">{label}</p>
    </div>
  );
}
