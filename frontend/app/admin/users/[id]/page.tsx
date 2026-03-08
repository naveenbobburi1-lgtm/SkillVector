"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";

/* ─── Ring Chart ─── */
function RingChart({ percent, size = 48, stroke = 4, color = "var(--primary)" }: { percent: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={o}
        style={{ transition: "stroke-dashoffset 1.2s ease-out" }} className="chart-ring" />
    </svg>
  );
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "learning-path" | "tests" | "videos">("overview");
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
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
      const res = await fetch(`${API_BASE_URL}/admin/videos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setAvailableVideos(data.videos || []); }
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
        body: JSON.stringify({ user_ids: [Number(userId)], due_date: assignDueDate || null, is_mandatory: assignMandatory }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignMsg({ type: "success", text: `Assigned! (${data.assigned_count} new)` });
        const res2 = await fetch(`${API_BASE_URL}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res2.ok) setUser(await res2.json());
        setTimeout(() => setShowAssignModal(false), 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        setAssignMsg({ type: "error", text: err.detail || "Failed to assign" });
      }
    } catch { setAssignMsg({ type: "error", text: "Network error" }); }
    finally { setAssigning(false); }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-6 w-32 skeleton" />
      <div className="h-28 skeleton" />
      <div className="h-10 w-96 skeleton" />
      <div className="h-64 skeleton" />
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="material-symbols-outlined text-4xl text-text-dim">person_off</span>
      <p className="text-text-muted text-sm">User not found</p>
    </div>
  );

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
    { id: "overview" as const, label: "Overview", icon: "person", count: null },
    { id: "learning-path" as const, label: "Learning Path", icon: "route", count: totalPhases },
    { id: "tests" as const, label: "Tests", icon: "quiz", count: tests.length },
    { id: "videos" as const, label: "Videos", icon: "play_circle", count: videos.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.push("/admin/users")} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors group animate-fadeIn">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        Back to Users
      </button>

      {/* User Header Card */}
      <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm animate-fadeInUp">
        {/* Gradient banner */}
        <div className="h-16 bg-gradient-to-r from-primary/15 via-violet-400/10 to-cyan-400/10" />
        <div className="px-6 pb-6 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center shadow-lg shadow-primary/20 border-4 border-surface-1">
              <span className="text-2xl font-bold text-white">{user.user.username?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-text-main">{user.user.username}</h1>
                {user.user.is_admin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/15">
                    <span className="material-symbols-outlined text-[11px]">shield</span>Admin
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  user.user.is_active ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/12" : "bg-red-500/8 text-red-500 border border-red-500/12"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${user.user.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                  {user.user.is_active ? "Active" : "Disabled"}
                </span>
              </div>
              <p className="text-sm text-text-muted mt-0.5">{user.user.email}</p>
              {user.user.created_at && <p className="text-[11px] text-text-dim mt-0.5">Member since {new Date(user.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>}
            </div>

            {/* KPI Rings + Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <KpiRing label="Path" value={completionPct} suffix="%" color="#7c3aed" />
              <KpiRing label="Tests" value={tests.length > 0 ? Math.round((testsPassed / tests.length) * 100) : 0} suffix="%" color="#059669" />
              <KpiRing label="Videos" value={videos.length > 0 ? Math.round((videosCompleted / videos.length) * 100) : 0} suffix="%" color="#2563eb" />
              <button onClick={openAssignModal} className="h-11 px-4 bg-gradient-to-r from-primary to-violet-500 hover:from-primary-hover hover:to-violet-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">assignment_add</span>
                Assign Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-1 rounded-2xl border border-border shadow-sm w-fit animate-fadeInUp stagger-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
              activeTab === t.id
                ? "bg-primary/10 text-primary font-semibold shadow-sm"
                : "text-text-muted hover:text-text-main hover:bg-surface-2"
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold ${
                activeTab === t.id ? "bg-primary text-white" : "bg-surface-3 text-text-dim"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm card-hover">
            <h3 className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">badge</span>
              Profile Information
            </h3>
            {profile ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Desired Role", value: profile.desired_role, icon: "work" },
                  { label: "Education", value: profile.education_level, icon: "school" },
                  { label: "Location", value: profile.location, icon: "location_on" },
                  { label: "Status", value: profile.current_status, icon: "info" },
                  { label: "Learning Pace", value: profile.learning_pace, icon: "speed" },
                  { label: "Hours/Week", value: profile.hours_per_week, icon: "schedule" },
                  { label: "Timeline", value: profile.timeline, icon: "calendar_today" },
                  { label: "Income Target", value: profile.expected_income, icon: "payments" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-text-dim text-sm mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[10px] text-text-dim uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm text-text-main font-medium">{item.value || <span className="text-text-dim italic font-normal">—</span>}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-text-dim mb-2">person_add</span>
                <p className="text-text-dim text-sm">No profile set up yet</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* Skills */}
            <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm card-hover">
              <h3 className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">psychology</span>
                Skills ({profile?.skills?.length || 0})
              </h3>
              {profile?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s: any, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/5 text-primary border border-primary/12 animate-scaleIn" style={{ animationDelay: `${i * 30}ms` }}>{typeof s === "object" ? s.name : s}</span>
                  ))}
                </div>
              ) : <p className="text-text-dim text-sm italic">No skills listed</p>}
            </div>

            {profile?.certifications?.length > 0 && (
              <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm card-hover">
                <h3 className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.certifications.map((c: any, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/5 text-emerald-600 border border-emerald-500/12">{typeof c === "object" ? `${c.title} — ${c.issuer}` : c}</span>
                  ))}
                </div>
              </div>
            )}

            {profile?.preferred_industries?.length > 0 && (
              <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm card-hover">
                <h3 className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">domain</span>
                  Industries
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.preferred_industries.map((ind: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/5 text-blue-600 border border-blue-500/12">{ind}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEARNING PATH */}
      {activeTab === "learning-path" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Progress summary */}
          <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text-main">Learning Path Progress</h3>
                <p className="text-[11px] text-text-dim mt-0.5">
                  {completedPhases} completed · {phases.filter((p: any) => p.is_unlocked && !p.is_completed).length} in progress · {phases.filter((p: any) => !p.is_unlocked).length} locked
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RingChart percent={completionPct} size={52} stroke={5} color="var(--primary)" />
                <span className="text-lg font-bold text-primary">{completionPct}%</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>

          {/* Phase Timeline */}
          {learningPath.length === 0 && phases.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-2xl p-16 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-text-dim mb-3">route</span>
              <p className="text-text-muted">No learning path generated yet</p>
              <p className="text-text-dim text-xs mt-1">The user needs to complete profile setup first</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-3">
                {(learningPath.length > 0 ? learningPath : phases).map((item: any, i: number) => {
                  const progress = phases[i];
                  const isCompleted = progress?.is_completed;
                  const isUnlocked = progress?.is_unlocked;
                  const testPassed = progress?.test_passed;
                  const bestScore = progress?.best_score || 0;

                  return (
                    <div key={i} className="relative pl-14 animate-fadeInUp" style={{ animationDelay: `${i * 80}ms` }}>
                      {/* Timeline dot */}
                      <div className={`absolute left-[18px] top-6 w-[19px] h-[19px] rounded-full border-[3px] z-10 ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-200"
                          : isUnlocked
                          ? "bg-primary border-primary/30 animate-pulse"
                          : "bg-surface-3 border-border"
                      }`}>
                        {isCompleted && (
                          <span className="material-symbols-outlined text-white text-[11px] flex items-center justify-center h-full">check</span>
                        )}
                      </div>

                      <div className={`bg-surface-1 border rounded-2xl overflow-hidden shadow-sm card-hover ${
                        isCompleted ? "border-emerald-500/25" : isUnlocked ? "border-primary/25" : "border-border"
                      }`}>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Phase {i + 1}</span>
                                {isCompleted && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/8 text-emerald-600 border border-emerald-500/12">Completed</span>}
                                {isUnlocked && !isCompleted && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/8 text-primary border border-primary/12">In Progress</span>}
                                {!isUnlocked && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-3 text-text-dim border border-border">Locked</span>}
                              </div>
                              <h4 className="font-semibold text-text-main text-[15px]">{item.phase || `Phase ${i + 1}`}</h4>
                            </div>
                            {item.duration && (
                              <span className="flex items-center gap-1 text-[11px] text-text-dim bg-surface-2 px-2 py-1 rounded-lg">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {item.duration}
                              </span>
                            )}
                          </div>

                          {/* Topics */}
                          {item.topics?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[9px] text-text-dim uppercase tracking-[0.15em] font-semibold mb-1.5">Topics</p>
                              <div className="flex flex-wrap gap-1">
                                {item.topics.map((t: string, ti: number) => (
                                  <span key={ti} className="px-2 py-0.5 rounded-md text-[11px] bg-surface-2 text-text-muted border border-border/50 font-medium">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {item.resources?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[9px] text-text-dim uppercase tracking-[0.15em] font-semibold mb-1.5">Resources</p>
                              <div className="space-y-1">
                                {item.resources.map((r: any, ri: number) => (
                                  <div key={ri} className="flex items-center gap-2 text-[11px] text-text-muted hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-xs">link</span>
                                    <span>{typeof r === "string" ? r : r.name || r.title || JSON.stringify(r)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Projects */}
                          {item.projects?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[9px] text-text-dim uppercase tracking-[0.15em] font-semibold mb-1.5">Projects</p>
                              <div className="space-y-1">
                                {item.projects.map((p: any, pi: number) => (
                                  <div key={pi} className="flex items-center gap-2 text-[11px]">
                                    <span className="material-symbols-outlined text-xs text-primary">code</span>
                                    <span className="text-text-muted">{typeof p === "string" ? p : p.name || p.title || JSON.stringify(p)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Test Info */}
                          {(testPassed || bestScore > 0) && (
                            <div className="flex items-center gap-3 pt-3 border-t border-border/50 mt-3">
                              {testPassed && (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                  <span className="material-symbols-outlined text-sm">verified</span>
                                  Test Passed
                                </span>
                              )}
                              {bestScore > 0 && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                                  bestScore >= 80 ? "bg-emerald-500/8 text-emerald-600" : bestScore >= 60 ? "bg-amber-500/8 text-amber-600" : "bg-red-500/8 text-red-500"
                                }`}>Best: {bestScore}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TESTS */}
      {activeTab === "tests" && (
        <div className="animate-fadeIn">
          {/* Summary bar */}
          {tests.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-5">
              <SummaryCard label="Total Attempts" value={tests.length} icon="quiz" color="violet" />
              <SummaryCard label="Passed" value={testsPassed} icon="check_circle" color="emerald" />
              <SummaryCard label="Avg Score" value={`${avgScore}%`} icon="analytics" color="blue" />
            </div>
          )}

          <div className="bg-surface-1 border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-main">Test History</h3>
              <span className="text-xs text-text-dim">{testsPassed}/{tests.length} passed</span>
            </div>
            {tests.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-4xl text-text-dim mb-3">quiz</span>
                <p className="text-text-dim text-sm">No test attempts yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {tests.map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-primary/[0.02] transition-colors animate-fadeInUp" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        t.passed ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15" : "bg-red-500/10 text-red-500 border border-red-500/15"
                      }`}>{t.score}%</div>
                      <div>
                        <p className="text-sm font-medium text-text-main">Phase {t.phase_index + 1}</p>
                        <p className="text-[11px] text-text-dim">{t.created_at ? new Date(t.created_at).toLocaleString() : ""}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[11px] font-semibold ${
                      t.passed ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/12" : "bg-red-500/8 text-red-500 border border-red-500/12"
                    }`}>{t.passed ? "Passed" : "Failed"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIDEOS */}
      {activeTab === "videos" && (
        <div className="animate-fadeIn">
          {videos.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-5">
              <SummaryCard label="Assigned" value={videos.length} icon="assignment" color="violet" />
              <SummaryCard label="Completed" value={videosCompleted} icon="check_circle" color="emerald" />
              <SummaryCard label="Flagged" value={videos.reduce((s: number, v: any) => s + (v.cheat_flags || 0), 0)} icon="flag" color="rose" />
            </div>
          )}

          <div className="bg-surface-1 border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-main">Video Progress</h3>
              <button onClick={openAssignModal} className="px-3 py-1.5 bg-primary/8 text-primary hover:bg-primary/15 rounded-lg text-xs font-semibold transition-colors border border-primary/12 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span>Assign
              </button>
            </div>
            {videos.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-4xl text-text-dim mb-3">videocam_off</span>
                <p className="text-text-dim text-sm">No video assignments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {videos.map((v: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-primary/[0.02] transition-colors animate-fadeInUp" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        v.is_completed ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15" : "bg-primary/8 text-primary border border-primary/12"
                      }`}>
                        <span className="material-symbols-outlined text-lg">{v.is_completed ? "check_circle" : "play_circle"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-main">Video #{v.video_id}</p>
                        <p className="text-[11px] text-text-dim">
                          {Math.floor(v.watched_seconds / 60)}m watched
                          {v.started_at && ` · ${new Date(v.started_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-28 h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full animate-bar-grow ${v.is_completed ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-violet-400"}`} style={{ width: `${v.completion_percent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-text-muted w-10 text-right">{v.completion_percent}%</span>
                      {v.cheat_flags > 0 && (
                        <span className="text-[10px] text-red-500 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/12 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">flag</span>
                          {v.cheat_flags}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Assign Video Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowAssignModal(false)}>
          <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text-main">Assign Video</h3>
                <p className="text-xs text-text-dim mt-0.5">To {user.user.username}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-main transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto admin-scroll">
              {videosLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableVideos.length === 0 ? (
                <div className="text-center py-10 text-text-dim text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2">videocam_off</span>
                  No videos available. Create videos first.
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-2">Select Video</label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto admin-scroll pr-1">
                      {availableVideos.map((v: any) => {
                        const assigned = videos.some((vp: any) => vp.video_id === v.id);
                        return (
                          <button key={v.id} disabled={assigned} onClick={() => setSelectedVideoId(v.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                              selectedVideoId === v.id ? "border-primary bg-primary/5 shadow-sm" : assigned ? "border-border bg-surface-2/50 opacity-40 cursor-not-allowed" : "border-border hover:border-primary/30 hover:bg-surface-2/30"
                            }`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedVideoId === v.id ? "bg-primary/15 text-primary" : "bg-surface-3 text-text-dim"}`}>
                              <span className="material-symbols-outlined text-lg">play_circle</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-main truncate">{v.title}</p>
                              <p className="text-[10px] text-text-dim">{v.category && `${v.category} · `}{Math.floor(v.duration_seconds / 60)}min</p>
                            </div>
                            {assigned && <span className="text-[10px] text-emerald-600 bg-emerald-500/8 px-2 py-0.5 rounded-full border border-emerald-500/12 font-medium">Assigned</span>}
                            {selectedVideoId === v.id && !assigned && <span className="material-symbols-outlined text-primary">check_circle</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-1.5">Due Date</label>
                      <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)}
                        className="w-full bg-surface-1 border border-border text-text-main rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-1.5">Type</label>
                      <div className="flex gap-2 mt-0.5">
                        {[true, false].map((val) => (
                          <button key={String(val)} onClick={() => setAssignMandatory(val)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                              assignMandatory === val ? "bg-primary/8 text-primary border-primary/15 shadow-sm" : "bg-surface-2 text-text-muted border-border"
                            }`}>{val ? "Mandatory" : "Optional"}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {assignMsg && (
                <div className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 animate-scaleIn ${
                  assignMsg.type === "success" ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/12" : "bg-red-500/8 text-red-500 border border-red-500/12"
                }`}>
                  <span className="material-symbols-outlined text-lg">{assignMsg.type === "success" ? "check_circle" : "error"}</span>
                  {assignMsg.text}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-border">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2.5 text-sm text-text-muted hover:text-text-main transition-colors rounded-xl hover:bg-surface-2">Cancel</button>
              <button onClick={handleAssignVideo} disabled={!selectedVideoId || assigning}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-violet-500 hover:from-primary-hover hover:to-violet-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                {assigning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-base">assignment_add</span>}
                Assign Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helper components ─── */
function KpiRing({ label, value, suffix = "", color }: { label: string; value: number; suffix?: string; color: string }) {
  const size = 50, stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={o} style={{ transition: "stroke-dashoffset 1.2s ease-out" }} className="chart-ring" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-text-main">{value}{suffix}</span>
      </div>
      <span className="text-[9px] text-text-dim uppercase tracking-wider font-semibold">{label}</span>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    violet: "bg-primary/8 text-primary border-primary/12",
    emerald: "bg-emerald-500/8 text-emerald-600 border-emerald-500/12",
    blue: "bg-blue-500/8 text-blue-600 border-blue-500/12",
    rose: "bg-rose-500/8 text-rose-500 border-rose-500/12",
  };
  return (
    <div className="bg-surface-1 border border-border rounded-2xl p-4 card-hover animate-scaleIn">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <div>
          <p className="text-xl font-bold text-text-main">{value}</p>
          <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">{label}</p>
        </div>
      </div>
    </div>
  );
}
