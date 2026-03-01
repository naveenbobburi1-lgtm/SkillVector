"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, getToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";

interface Assignment {
  assignment_id: number;
  video_id: number;
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  description: string | null;
  duration_seconds: number;
  category: string | null;
  is_mandatory: boolean;
  due_date: string | null;
  completion_percent: number;
  is_completed: boolean;
  watched_seconds: number;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  async function fetchAssignments() {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAssignments(); }, []);

  function handleComplete() {
    fetchAssignments();
  }

  const filtered = assignments.filter((a) => {
    if (filter === "pending") return !a.is_completed;
    if (filter === "completed") return a.is_completed;
    return true;
  });

  const pendingCount = assignments.filter((a) => !a.is_completed).length;
  const completedCount = assignments.filter((a) => a.is_completed).length;
  const overallProgress = assignments.length > 0
    ? Math.round(assignments.reduce((sum, a) => sum + a.completion_percent, 0) / assignments.length)
    : 0;

  return (
    <div className="min-h-screen bg-background text-text-main">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-text-muted mt-1">Watch assigned videos to progress in your learning journey</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={assignments.length} icon="video_library" />
          <StatCard label="Pending" value={pendingCount} icon="pending" color="amber" />
          <StatCard label="Completed" value={completedCount} icon="check_circle" color="emerald" />
          <StatCard label="Avg Progress" value={`${overallProgress}%`} icon="trending_up" color="violet" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video List */}
          <div className={activeVideo ? "lg:w-96 flex-shrink-0" : "w-full"}>
            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-surface-2/50 rounded-full border border-border/50 mb-4 w-fit">
              {(["all", "pending", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors capitalize ${
                    filter === f
                      ? "bg-surface-1 text-text-main font-medium shadow-sm border border-border/50"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="bg-surface-1 border border-border rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-text-muted mb-2">video_library</span>
                <p className="text-text-muted text-sm">
                  {filter === "all" ? "No assignments yet" : `No ${filter} assignments`}
                </p>
              </div>
            ) : (
              <div className={`space-y-2 ${activeVideo ? "max-h-[70vh] overflow-y-auto pr-1" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"}`}>
                {filtered.map((a) => (
                  <button
                    key={a.assignment_id}
                    onClick={() => setActiveVideo(a)}
                    className={`w-full text-left bg-surface-1 border rounded-xl overflow-hidden transition-all hover:border-primary/40 ${
                      activeVideo?.assignment_id === a.assignment_id
                        ? "border-primary ring-1 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div className="relative w-28 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2">
                        {a.youtube_video_id && (
                          <img
                            src={`https://img.youtube.com/vi/${a.youtube_video_id}/mqdefault.jpg`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        {a.is_completed && (
                          <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {a.is_mandatory && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                              Required
                            </span>
                          )}
                          {a.category && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {a.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-border/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${a.is_completed ? "bg-emerald-500" : "bg-primary"}`}
                              style={{ width: `${a.completion_percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-text-muted w-8 text-right">{a.completion_percent}%</span>
                        </div>
                      </div>
                    </div>
                    {a.due_date && (
                      <div className="px-3 pb-2">
                        <span className="text-[10px] text-text-muted">
                          Due: {new Date(a.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Player */}
          {activeVideo && (
            <div className="flex-1 min-w-0">
              <div className="sticky top-20">
                <VideoPlayer
                  key={activeVideo.video_id}
                  assignmentId={activeVideo.assignment_id}
                  videoId={activeVideo.video_id}
                  youtubeVideoId={activeVideo.youtube_video_id}
                  title={activeVideo.title}
                  durationSeconds={activeVideo.duration_seconds}
                  onComplete={handleComplete}
                />
                {activeVideo.description && (
                  <div className="mt-4 p-4 bg-surface-1 border border-border rounded-xl">
                    <h4 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Description</h4>
                    <p className="text-sm text-text-main/75">{activeVideo.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color?: string }) {
  const colors: Record<string, string> = {
    amber: "text-amber-400 bg-amber-600/10 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-600/10 border-emerald-500/20",
    violet: "text-violet-400 bg-violet-600/10 border-violet-500/20",
  };
  const c = color ? colors[color] : "text-text-muted bg-surface-2 border-border";
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${c}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
