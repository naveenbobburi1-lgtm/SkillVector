"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";

/* ─── Types ─── */
interface Video {
  id: number; title: string; youtube_url: string; category: string;
  duration_seconds: number; is_active: boolean; created_at: string;
  assigned_count?: number; completed_count?: number;
}

export default function AdminVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  /* modals */
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  /* create form */
  const [cTitle, setCTitle] = useState("");
  const [cUrl, setCUrl] = useState("");
  const [cCategory, setCCategory] = useState("");
  const [cDuration, setCDuration] = useState(0);
  const [creating, setCreating] = useState(false);

  /* assign form */
  const [assignMode, setAssignMode] = useState<"all" | "specific">("all");
  const [assignUserIds, setAssignUserIds] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignMandatory, setAssignMandatory] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* progress data */
  const [progressData, setProgressData] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  /* ─── CRUD ─── */
  async function handleCreate() {
    if (!cTitle || !cUrl) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: cTitle, youtube_url: cUrl, category: cCategory, duration_seconds: cDuration }),
      });
      if (res.ok) {
        setShowCreate(false); setCTitle(""); setCUrl(""); setCCategory(""); setCDuration(0);
        fetchVideos();
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this video?")) return;
    try {
      await fetch(`${API_BASE_URL}/admin/videos/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      fetchVideos();
    } catch (e) { console.error(e); }
  }

  async function handleAssign() {
    if (!selectedVideo) return;
    setAssigning(true); setAssignMsg(null);
    const body: any = { due_date: assignDueDate || null, is_mandatory: assignMandatory };
    if (assignMode === "specific") body.user_ids = assignUserIds.split(",").map((s) => Number(s.trim())).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos/${selectedVideo.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignMsg({ type: "success", text: `Assigned to ${data.assigned_count} user(s)` });
        fetchVideos();
        setTimeout(() => setShowAssign(false), 1200);
      } else {
        const e = await res.json().catch(() => ({}));
        setAssignMsg({ type: "error", text: e.detail || "Failed" });
      }
    } catch { setAssignMsg({ type: "error", text: "Network error" }); }
    finally { setAssigning(false); }
  }

  async function openProgress(v: Video) {
    setSelectedVideo(v); setShowProgress(true); setProgressLoading(true); setProgressData([]);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/videos/${v.id}/progress`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setProgressData(d.progress || []); }
    } catch (e) { console.error(e); }
    finally { setProgressLoading(false); }
  }

  /* ─── Helpers ─── */
  const categories = ["all", ...Array.from(new Set(videos.map((v) => v.category).filter(Boolean)))];

  const filtered = videos
    .filter((v) => (category === "all" || v.category === category))
    .filter((v) => !search || v.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "assigned") return (b.assigned_count || 0) - (a.assigned_count || 0);
      if (sort === "completion") return (b.completed_count || 0) - (a.completed_count || 0);
      return 0;
    });

  function ytThumb(url: string) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?#]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  }

  function fmtDuration(s: number) { return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`; }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 skeleton w-60" />
      <div className="flex gap-3">{[1,2,3].map(i => <div key={i} className="h-9 skeleton w-24" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 skeleton rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeInUp">
        <div>
          <h2 className="text-lg font-bold text-text-main">Video Library</h2>
          <p className="text-xs text-text-dim">{videos.length} video{videos.length !== 1 && "s"} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-violet-500 hover:from-primary-hover hover:to-violet-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20 hover:shadow-md">
          <span className="material-symbols-outlined text-base">add_circle</span>
          Create Video
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 animate-fadeInUp stagger-1">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-lg">search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos…"
            className="w-full bg-surface-1 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-1 bg-surface-1 border border-border rounded-xl">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                category === c ? "bg-primary/10 text-primary font-semibold" : "text-text-muted hover:text-text-main hover:bg-surface-2"
              }`}>{c === "all" ? "All" : c}</button>
          ))}
        </div>

        {/* Sort */}
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="bg-surface-1 border border-border rounded-xl px-3 py-2.5 text-xs text-text-main focus:outline-none focus:border-primary cursor-pointer">
          <option value="newest">Newest</option>
          <option value="title">Title</option>
          <option value="assigned">Most Assigned</option>
          <option value="completion">Most Completed</option>
        </select>

        {/* View Toggle */}
        <div className="flex gap-0.5 p-1 bg-surface-1 border border-border rounded-xl">
          {(["grid","list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`p-2 rounded-lg transition-all ${view === v ? "bg-primary/10 text-primary" : "text-text-dim hover:text-text-main"}`}>
              <span className="material-symbols-outlined text-lg">{v === "grid" ? "grid_view" : "view_list"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="bg-surface-1 border border-border rounded-2xl p-16 text-center shadow-sm animate-fadeIn">
          <span className="material-symbols-outlined text-5xl text-text-dim mb-3">video_library</span>
          <p className="text-text-muted font-medium">No videos found</p>
          <p className="text-text-dim text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* GRID VIEW */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((v, i) => {
            const thumb = ytThumb(v.youtube_url);
            const assignedP = (v.assigned_count || 0) > 0 ? Math.round(((v.completed_count || 0) / (v.assigned_count || 1)) * 100) : 0;
            return (
              <div key={v.id} className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm card-hover group animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                {/* Thumbnail */}
                <div className="relative h-40 bg-surface-3 overflow-hidden">
                  {thumb ? <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-text-dim">smart_display</span></div>}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm">{fmtDuration(v.duration_seconds)}</span>
                    {v.category && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/80 text-white backdrop-blur-sm">{v.category}</span>}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm ${v.is_active ? "bg-emerald-500/80 text-white" : "bg-red-500/80 text-white"}`}>
                      {v.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-text-main line-clamp-2 leading-snug">{v.title}</h3>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-[11px] text-text-dim">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">group</span>{v.assigned_count || 0} assigned</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span>{v.completed_count || 0} done</span>
                  </div>

                  {/* Progress Bar */}
                  {(v.assigned_count || 0) > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-text-dim">Completion</span>
                        <span className="text-[10px] font-semibold text-text-muted">{assignedP}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full animate-bar-grow" style={{ width: `${assignedP}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button onClick={() => openProgress(v)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary/5 text-primary hover:bg-primary/12 rounded-xl text-xs font-semibold transition-all border border-primary/10">
                      <span className="material-symbols-outlined text-sm">monitoring</span>Progress
                    </button>
                    <button onClick={() => { setSelectedVideo(v); setShowAssign(true); setAssignMsg(null); }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/5 text-blue-600 hover:bg-blue-500/12 rounded-xl text-xs font-semibold transition-all border border-blue-500/10">
                      <span className="material-symbols-outlined text-sm">assignment_add</span>Assign
                    </button>
                    <button onClick={() => handleDelete(v.id)}
                      className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && filtered.length > 0 && (
        <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[1fr_100px_80px_80px_80px_120px] gap-4 px-5 py-3 text-[10px] font-semibold text-text-dim uppercase tracking-wider border-b border-border">
            <span>Video</span><span className="text-center">Duration</span><span className="text-center">Assigned</span><span className="text-center">Done</span><span className="text-center">Status</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((v, i) => (
            <div key={v.id} className="grid grid-cols-[1fr_100px_80px_80px_80px_120px] gap-4 items-center px-5 py-3.5 border-b border-border/40 hover:bg-primary/[0.02] transition-colors animate-fadeInUp" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-9 rounded-lg bg-surface-3 overflow-hidden flex-shrink-0">
                  {ytThumb(v.youtube_url) ? <img src={ytThumb(v.youtube_url)!} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-sm text-text-dim">smart_display</span></div>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">{v.title}</p>
                  <p className="text-[10px] text-text-dim truncate">{v.category || "Uncategorized"}</p>
                </div>
              </div>
              <span className="text-xs text-text-muted text-center">{fmtDuration(v.duration_seconds)}</span>
              <span className="text-xs font-semibold text-text-main text-center">{v.assigned_count || 0}</span>
              <span className="text-xs font-semibold text-emerald-600 text-center">{v.completed_count || 0}</span>
              <div className="text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${v.is_active ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/12" : "bg-red-500/8 text-red-500 border border-red-500/12"}`}>{v.is_active ? "Active" : "Off"}</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openProgress(v)} className="p-1.5 rounded-lg hover:bg-primary/8 text-text-dim hover:text-primary transition-all" title="Progress">
                  <span className="material-symbols-outlined text-base">monitoring</span>
                </button>
                <button onClick={() => { setSelectedVideo(v); setShowAssign(true); setAssignMsg(null); }} className="p-1.5 rounded-lg hover:bg-blue-500/8 text-text-dim hover:text-blue-600 transition-all" title="Assign">
                  <span className="material-symbols-outlined text-base">assignment_add</span>
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-red-500/8 text-text-dim hover:text-red-500 transition-all" title="Delete">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Video Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary text-lg">video_call</span></div>
                <h3 className="text-base font-bold text-text-main">Create Video</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-main transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Title", value: cTitle, onChange: setCTitle, placeholder: "Video title…", icon: "title", type: "text" },
                { label: "YouTube URL", value: cUrl, onChange: setCUrl, placeholder: "https://youtube.com/watch?v=…", icon: "link", type: "text" },
                { label: "Category", value: cCategory, onChange: setCCategory, placeholder: "e.g. Python, JavaScript", icon: "category", type: "text" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-1.5">{f.label}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-base">{f.icon}</span>
                    <input value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder} type={f.type}
                      className="w-full bg-surface-1 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-1.5">Duration (seconds)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-base">timer</span>
                  <input type="number" value={cDuration} onChange={(e) => setCDuration(Number(e.target.value))} placeholder="300"
                    className="w-full bg-surface-1 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>
              {cUrl && ytThumb(cUrl) && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img src={ytThumb(cUrl)!} alt="Preview" className="w-full h-32 object-cover" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-border">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm text-text-muted hover:text-text-main rounded-xl hover:bg-surface-2 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!cTitle || !cUrl || creating}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-violet-500 hover:from-primary-hover hover:to-violet-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                {creating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">add_circle</span>}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Video Modal ── */}
      {showAssign && selectedVideo && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowAssign(false)}>
          <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text-main">Assign Video</h3>
                <p className="text-xs text-text-dim mt-0.5 truncate max-w-[300px]">{selectedVideo.title}</p>
              </div>
              <button onClick={() => setShowAssign(false)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-main transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-2">Target</label>
                <div className="flex gap-2">
                  {(["all", "specific"] as const).map((m) => (
                    <button key={m} onClick={() => setAssignMode(m)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                        assignMode === m ? "bg-primary/8 text-primary border-primary/15 shadow-sm" : "bg-surface-2 text-text-muted border-border"
                      }`}>
                      <span className="material-symbols-outlined text-sm">{m === "all" ? "groups" : "person"}</span>
                      {m === "all" ? "All Users" : "Specific"}
                    </button>
                  ))}
                </div>
              </div>
              {assignMode === "specific" && (
                <div>
                  <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-1.5">User IDs (comma-separated)</label>
                  <input value={assignUserIds} onChange={(e) => setAssignUserIds(e.target.value)} placeholder="1, 2, 3"
                    className="w-full bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-semibold block mb-1.5">Due Date</label>
                  <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full bg-surface-1 border border-border rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
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
              <button onClick={() => setShowAssign(false)} className="px-4 py-2.5 text-sm text-text-muted hover:text-text-main rounded-xl hover:bg-surface-2 transition-colors">Cancel</button>
              <button onClick={handleAssign} disabled={assigning}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-violet-500 hover:from-primary-hover hover:to-violet-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20 disabled:opacity-50 flex items-center gap-1.5">
                {assigning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">assignment_add</span>}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Progress Modal ── */}
      {showProgress && selectedVideo && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowProgress(false)}>
          <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text-main">Video Progress</h3>
                <p className="text-xs text-text-dim mt-0.5 truncate max-w-[400px]">{selectedVideo.title}</p>
              </div>
              <button onClick={() => setShowProgress(false)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-main transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto admin-scroll">
              {progressLoading ? (
                <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : progressData.length === 0 ? (
                <div className="py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-text-dim mb-3">pending</span>
                  <p className="text-text-dim text-sm">No one has started watching yet</p>
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 p-5 border-b border-border">
                    <div className="bg-surface-2 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-text-main">{progressData.length}</p>
                      <p className="text-[10px] text-text-dim uppercase tracking-wider">Viewers</p>
                    </div>
                    <div className="bg-surface-2 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-emerald-600">{progressData.filter((p: any) => p.is_completed).length}</p>
                      <p className="text-[10px] text-text-dim uppercase tracking-wider">Completed</p>
                    </div>
                    <div className="bg-surface-2 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-red-500">{progressData.reduce((s: number, p: any) => s + (p.cheat_flags || 0), 0)}</p>
                      <p className="text-[10px] text-text-dim uppercase tracking-wider">Flags</p>
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    {progressData.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-primary/[0.02] transition-colors animate-fadeInUp" style={{ animationDelay: `${i * 30}ms` }}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {p.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-main">{p.username || `User #${p.user_id}`}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden max-w-[200px]">
                              <div className={`h-full rounded-full ${p.is_completed ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-violet-400"}`} style={{ width: `${p.completion_percent}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-text-muted">{p.completion_percent}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-text-dim">{Math.floor(p.watched_seconds / 60)}m</span>
                          {p.is_completed && <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>}
                          {p.cheat_flags > 0 && (
                            <span className="text-[10px] text-red-500 bg-red-500/5 px-2 py-0.5 rounded-lg border border-red-500/12 font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">flag</span>{p.cheat_flags}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
