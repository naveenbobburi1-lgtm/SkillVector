"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";

interface Video {
  id: number;
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  description: string | null;
  duration_seconds: number;
  category: string | null;
  created_at: string;
  assigned_count: number;
  completed_count: number;
  avg_completion: number;
  cheat_flag_count: number;
}

type ViewMode = "grid" | "list";
type SortBy = "newest" | "title" | "assigned" | "completion";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [showProgress, setShowProgress] = useState<number | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({ youtube_url: "", title: "", description: "", duration_seconds: 0, category: "" });
  const [creating, setCreating] = useState(false);

  const [assignMode, setAssignMode] = useState<"all" | "specific">("all");
  const [assignUserIds, setAssignUserIds] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [mandatory, setMandatory] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function createVideo(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, duration_seconds: form.duration_seconds || 0, category: form.category || null, description: form.description || null }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ youtube_url: "", title: "", description: "", duration_seconds: 0, category: "" });
        fetchVideos();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create video");
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  }

  async function deleteVideo(id: number) {
    if (!confirm("Delete this video and all related progress data?")) return;
    try {
      await fetch(`${API_BASE_URL}/admin/videos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchVideos();
    } catch (e) { console.error(e); }
  }

  async function assignVideo(videoId: number) {
    setAssigning(true);
    try {
      const body: any = { is_mandatory: mandatory };
      if (assignDueDate) body.due_date = assignDueDate;
      if (assignMode === "specific") {
        body.user_ids = assignUserIds.split(",").map((id) => parseInt(id.trim())).filter(Boolean);
      }
      const res = await fetch(`${API_BASE_URL}/admin/videos/${videoId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Assigned to ${data.assigned_count} users`);
        setShowAssign(null);
        fetchVideos();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to assign");
      }
    } catch (e) { console.error(e); }
    finally { setAssigning(false); }
  }

  async function fetchProgress(videoId: number) {
    setProgressLoading(true);
    setShowProgress(videoId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos/${videoId}/progress`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProgress(await res.json());
    } catch (e) { console.error(e); }
    finally { setProgressLoading(false); }
  }

  useEffect(() => { fetchVideos(); }, []);

  function formatDuration(s: number) {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // Filtering & Sorting
  const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean))) as string[];
  const filtered = videos
    .filter(v => categoryFilter === "all" || v.category === categoryFilter)
    .filter(v => !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "assigned") return b.assigned_count - a.assigned_count;
      if (sortBy === "completion") return b.avg_completion - a.avg_completion;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Video Management</h1>
          <p className="text-text-muted text-sm mt-1">{videos.length} videos · {videos.reduce((s, v) => s + v.assigned_count, 0)} total assignments</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-primary/15 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          Add Video
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="material-symbols-outlined text-text-dim absolute left-3 top-1/2 -translate-y-1/2 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-surface-1 border border-border text-text-main rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface-1 border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-surface-1 border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="title">Title A-Z</option>
          <option value="assigned">Most Assigned</option>
          <option value="completion">Highest Completion</option>
        </select>

        {/* View toggle */}
        <div className="flex bg-surface-2 border border-border rounded-xl overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-surface-1 text-text-main shadow-sm" : "text-text-dim hover:text-text-main"}`}>
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-surface-1 text-text-main shadow-sm" : "text-text-dim hover:text-text-main"}`}>
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>

      {/* Video Content */}
      {loading ? (
        <div className="text-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-1 border border-border rounded-2xl p-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-text-dim mb-3">video_library</span>
          <p className="text-text-muted">{videos.length === 0 ? "No videos yet. Add your first video assignment." : "No videos match your filters."}</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="bg-surface-1 border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all shadow-sm">
              <div className="relative aspect-video bg-surface-3">
                {v.youtube_video_id && <img src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" />}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[10px] text-white">{formatDuration(v.duration_seconds)}</div>
                {v.category && <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 rounded text-[10px] text-white font-medium">{v.category}</div>}
              </div>
              <div className="p-4 space-y-3">
                <h3 className="font-medium text-sm text-text-main line-clamp-2">{v.title}</h3>
                {v.description && <p className="text-xs text-text-dim line-clamp-2">{v.description}</p>}
                <div className="flex gap-3 text-[11px] text-text-dim">
                  <span>{v.assigned_count} assigned</span>
                  <span>{v.completed_count} completed</span>
                  <span>Avg {v.avg_completion}%</span>
                  {v.cheat_flag_count > 0 && <span className="text-red-500">⚠ {v.cheat_flag_count} flags</span>}
                </div>
                <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${v.assigned_count ? (v.completed_count / v.assigned_count) * 100 : 0}%` }} />
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button onClick={() => { setShowAssign(v.id); setAssignMode("all"); setAssignUserIds(""); setAssignDueDate(""); setMandatory(true); }} className="flex-1 py-2 text-xs bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-colors font-medium border border-primary/10">
                    Assign
                  </button>
                  <button onClick={() => fetchProgress(v.id)} className="flex-1 py-2 text-xs bg-surface-2 text-text-muted hover:bg-surface-3 rounded-xl transition-colors font-medium border border-border">
                    Progress
                  </button>
                  <button onClick={() => deleteVideo(v.id)} className="py-2 px-3 text-xs bg-surface-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-border">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-surface-1 border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border/50">
          {filtered.map((v) => (
            <div key={v.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2/30 transition-colors">
              <div className="relative w-28 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-3">
                {v.youtube_video_id && <img src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />}
                <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/70 rounded text-[9px] text-white">{formatDuration(v.duration_seconds)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">{v.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-text-dim">
                  {v.category && <span className="px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 text-[10px]">{v.category}</span>}
                  <span>{v.assigned_count} assigned</span>
                  <span>Avg {v.avg_completion}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${v.assigned_count ? (v.completed_count / v.assigned_count) * 100 : 0}%` }} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setShowAssign(v.id); setAssignMode("all"); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-primary transition-colors" title="Assign">
                    <span className="material-symbols-outlined text-lg">assignment</span>
                  </button>
                  <button onClick={() => fetchProgress(v.id)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-main transition-colors" title="View Progress">
                    <span className="material-symbols-outlined text-lg">monitoring</span>
                  </button>
                  <button onClick={() => deleteVideo(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-dim hover:text-red-500 transition-colors" title="Delete">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Video Modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Add Video Assignment">
          <form onSubmit={createVideo} className="space-y-4">
            <Field label="YouTube URL" required>
              <input type="url" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" required />
            </Field>
            <Field label="Title" required>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Video title" className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (seconds)">
                <input type="number" value={form.duration_seconds || ""} onChange={(e) => setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })} placeholder="300" className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
              </Field>
              <Field label="Category">
                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Tutorial" className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
              </Field>
            </div>
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional description..." className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none" />
            </Field>
            <button type="submit" disabled={creating} className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-sm shadow-primary/15">
              {creating ? "Creating..." : "Create Video"}
            </button>
          </form>
        </Modal>
      )}

      {/* Assign Video Modal */}
      {showAssign !== null && (
        <Modal onClose={() => setShowAssign(null)} title="Assign Video">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setAssignMode("all")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${assignMode === "all" ? "bg-primary text-white border-primary shadow-sm" : "bg-surface-2 text-text-muted border-border"}`}>All Users</button>
              <button onClick={() => setAssignMode("specific")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${assignMode === "specific" ? "bg-primary text-white border-primary shadow-sm" : "bg-surface-2 text-text-muted border-border"}`}>Specific Users</button>
            </div>
            {assignMode === "specific" && (
              <Field label="User IDs (comma-separated)">
                <input type="text" value={assignUserIds} onChange={(e) => setAssignUserIds(e.target.value)} placeholder="1, 2, 5" className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
              </Field>
            )}
            <Field label="Due Date (optional)">
              <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} className="w-4 h-4 rounded border-border bg-surface-2 text-primary focus:ring-primary accent-primary" />
              <span className="text-sm text-text-muted">Mandatory assignment</span>
            </label>
            <button onClick={() => assignVideo(showAssign)} disabled={assigning} className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-sm shadow-primary/15">
              {assigning ? "Assigning..." : "Assign Video"}
            </button>
          </div>
        </Modal>
      )}

      {/* Progress Modal */}
      {showProgress !== null && (
        <Modal onClose={() => setShowProgress(null)} title="Video Progress">
          {progressLoading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : progress.length === 0 ? (
            <p className="text-text-dim text-sm text-center py-8">No progress data yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {progress.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-surface-2 rounded-xl border border-border/50">
                  <div>
                    <p className="text-sm font-medium text-text-main">{p.username}</p>
                    <p className="text-[11px] text-text-dim">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.is_completed ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${p.completion_percent}%` }} />
                      </div>
                      <p className="text-[10px] text-text-dim mt-0.5">{p.completion_percent}%{p.is_completed && " ✓"}</p>
                    </div>
                    <div className="text-[10px] text-text-dim w-12">{Math.floor((p.watched_seconds || 0) / 60)}m</div>
                    {p.cheat_flags > 0 && (
                      <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">⚠ {p.cheat_flags}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-text-main">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-text-dim text-lg">close</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-xs text-text-dim mb-1 block font-medium">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
