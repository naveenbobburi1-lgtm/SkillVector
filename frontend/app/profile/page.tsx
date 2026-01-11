"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserProfile, API_BASE_URL, getToken } from "@/lib/auth";
import InsightsCard from "@/components/profile/InsightsCard";

export default function ProfilePage() {
  const router = useRouter();

  // Mock State for "Control Panel" feel
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add Skill State
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  // Add Certification State
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [addingCertLoading, setAddingCertLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getUserProfile();

        if (!data.is_complete) {
          router.push("/profile/setup");
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  async function handleAddSkill() {
    if (!newSkillName.trim()) return;
    setAddingLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/add-skill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skill: newSkillName }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => ({
          ...prev,
          skills: data.skills,
        }));
        setNewSkillName("");
        setIsAddingSkill(false);
      } else {
        alert("Failed to add skill");
      }
    } catch (e) {
      console.error(e);
      alert("Error adding skill");
    } finally {
      setAddingLoading(false);
    }
  }

  async function handleAddCert() {
    if (!newCertName.trim() || !newCertIssuer.trim()) return;
    setAddingCertLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/add-certification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCertName, issuer: newCertIssuer }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => ({
          ...prev,
          certifications: data.certifications,
        }));
        setNewCertName("");
        setNewCertIssuer("");
        setIsAddingCert(false);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to add certification");
      }
    } catch (e) {
      console.error(e);
      alert("Error adding certification");
    } finally {
      setAddingCertLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-main font-sans flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-surface-1/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-lg">hub</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Skillvector</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
          <Link href="/learning-path" className="hover:text-primary transition-colors">Learning Path</Link>
          <Link href="/profile" className="text-text-main font-semibold">Profile</Link>
          <Link href="/market-insights" className="hover:text-primary transition-colors">Market Insights</Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg text-text-muted hover:text-text-main transition-colors">notifications</span>
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-border/50">
            <div className="hidden md:block text-right">
              <div className="text-sm font-semibold text-text-main leading-none">{profile?.username || "User"}</div>
              <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{profile?.current_status || "Member"}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 border-2 border-surface-1 shadow-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white uppercase">{(profile?.username || "U").charAt(0)}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">
              Neural Profile
            </h1>
            <p className="text-text-muted max-w-xl">
              Configure your digital twin. Our AI uses this data to map highly optimized career trajectories.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-dim flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
              SYNCED
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Identity & Status (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Identity Card */}
            <section className="bg-surface-1 border border-border rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

              <div className="flex items-start justify-between mb-6">
                <div className="h-20 w-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center relative overflow-hidden">
                  <span className="material-symbols-outlined text-4xl text-text-dim">person</span>
                </div>
                <Link href="/profile/setup" className="text-xs font-medium text-primary hover:text-primary-hover uppercase tracking-wider border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">
                  Edit
                </Link>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block mb-1">Full Name</label>
                  <div className="text-lg font-medium text-text-main">{profile?.username || "User"}</div>
                  <div className="text-sm text-text-muted">{profile?.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block mb-1">Status</label>
                    <div className="flex items-center gap-2 text-sm text-text-main">
                      <span className="material-symbols-outlined text-base text-info">school</span>
                      {profile?.current_status || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block mb-1">Location</label>
                    <div className="flex items-center gap-2 text-sm text-text-main">
                      <span className="material-symbols-outlined text-base text-warning">location_on</span>
                      {profile?.location || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Profile Completeness - "System Health" style */}
            <section className="bg-surface-1 border border-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">data_usage</span>
                Profile Density
              </h3>

              <div className="relative pt-2 pb-6">
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-text-main">100%</span>
                  <span className="text-sm text-text-muted mb-1">vectors mapped</span>
                </div>
                <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-success w-[100%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-text-muted p-3 rounded-lg bg-surface-2/50 border border-border/50">
                  <span className="material-symbols-outlined text-success">check_circle</span>
                  <span>Basic Details</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted p-3 rounded-lg bg-surface-2/50 border border-border/50">
                  <span className="material-symbols-outlined text-success">check_circle</span>
                  <span>Skills & Experience</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted p-3 rounded-lg bg-surface-2/50 border border-border/50">
                  <span className="material-symbols-outlined text-success">check_circle</span>
                  <span>Goals & Constraints</span>
                </div>
              </div>
            </section>
          </div>

          {/* Middle/Right Column: Skills & Preferences (8 cols) */}
          <div className="lg:col-span-8 space-y-6">


            {/* Skills Matrix */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Skills (2 Cols) */}
              <div className="md:col-span-2 bg-surface-1 border border-border rounded-2xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">memory</span>
                    Skill Matrix
                  </h3>

                  {isAddingSkill ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                      <input
                        type="text"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="e.g. Docker"
                        className="h-8 px-3 rounded-lg bg-surface-2 border border-border text-sm text-text-main focus:outline-none focus:border-primary w-32 md:w-48"
                        onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                      />
                      <button
                        onClick={handleAddSkill}
                        disabled={addingLoading}
                        className="h-8 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        {addingLoading ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : "Add"}
                      </button>
                      <button
                        onClick={() => setIsAddingSkill(false)}
                        className="h-8 px-3 bg-surface-2 hover:bg-surface-3 text-text-muted text-xs font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingSkill(true)}
                      className="h-8 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Skill
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Technical Skills Category */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-text-dim uppercase tracking-wider">Primary Skills</p>
                    <div className="space-y-3">
                      {profile?.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill: string, index: number) => (
                          <div key={index} className="group flex items-center justify-between p-4 bg-surface-2 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-info"></div>
                              <span className="text-text-main font-medium">{skill}</span>
                            </div>
                            <span className="text-xs text-text-muted bg-surface-1 px-2 py-1 rounded">Verified</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-text-muted italic">No skills added yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Certifications Category */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-text-dim uppercase tracking-wider">Certifications</p>
                      {!isAddingCert && (
                        <button
                          onClick={() => setIsAddingCert(true)}
                          className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          Add
                        </button>
                      )}
                    </div>

                    {isAddingCert && (
                      <div className="bg-surface-2 border border-border rounded-xl p-3 space-y-3 animate-in fade-in zoom-in duration-200">
                        <input
                          type="text"
                          value={newCertName}
                          onChange={(e) => setNewCertName(e.target.value)}
                          placeholder="Certificate Name (e.g. AWS SAA)"
                          className="w-full h-8 px-3 rounded-lg bg-surface-1 border border-border text-sm text-text-main focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          value={newCertIssuer}
                          onChange={(e) => setNewCertIssuer(e.target.value)}
                          placeholder="Issuer (e.g. Amazon)"
                          className="w-full h-8 px-3 rounded-lg bg-surface-1 border border-border text-sm text-text-main focus:outline-none focus:border-primary"
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleAddCert}
                            disabled={addingCertLoading}
                            className="h-7 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center flex-1"
                          >
                            {addingCertLoading ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : "Add"}
                          </button>
                          <button
                            onClick={() => setIsAddingCert(false)}
                            className="h-7 px-3 bg-surface-1 hover:bg-surface-3 text-text-muted text-xs font-medium rounded-lg transition-colors flex-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {profile?.certifications && profile.certifications.length > 0 ? (
                        profile.certifications.map((cert: any, index: number) => (
                          <div key={index} className="group flex items-center justify-between p-4 bg-surface-2 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-success"></div>
                              <span className="text-text-main font-medium">{cert.title}</span>
                            </div>
                            <span className="text-xs text-text-muted bg-surface-1 px-2 py-1 rounded">{cert.issuer}</span>
                          </div>
                        ))
                      ) : (
                        !isAddingCert && <div className="text-sm text-text-muted italic">No certifications added.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights (1 Col) */}
              <div className="md:col-span-1">
                <InsightsCard />
              </div>
            </section>

            {/* Goals & Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Targeting */}
              <section className="bg-surface-1 border border-border rounded-2xl p-6">
                <h3 className="text-base font-bold text-text-main mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">target</span>
                  Career Targeting
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block mb-2">Desired Role</label>
                    <div className="p-3 bg-surface-2 border border-border rounded-lg text-text-main text-sm">
                      {profile?.desired_role || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block mb-2">Income Target</label>
                    <div className="w-full bg-surface-2 rounded-full h-2 mb-2">
                      {/* Visual flair only, no real calculation yet */}
                      <div className="bg-success h-2 rounded-full w-[50%]"></div>
                    </div>
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Target</span>
                      <span>{profile?.expected_income || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Learning Constraints */}
              <section className="bg-surface-1 border border-border rounded-2xl p-6">
                <h3 className="text-base font-bold text-text-main mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-warning">tune</span>
                  Learning Parameters
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Weekly Availability</span>
                    <span className="text-sm font-medium text-text-main">{profile?.hours_per_week || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Preferred Mode</span>
                    <span className="flex items-center gap-1 text-sm font-medium text-text-main">
                      <span className="material-symbols-outlined text-base">laptop_chromebook</span>
                      {(profile?.learning_format && profile.learning_format.length > 0) ? profile.learning_format[0] : "Online"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Budget Sensitivity</span>
                    <span className="text-sm font-medium text-text-main">{profile?.budget_sensitivity || "N/A"}</span>
                  </div>

                  {/* Extended Details (New) */}
                  <div className="pt-4 border-t border-border mt-4 space-y-4">
                    <p className="text-xs font-semibold text-text-dim uppercase tracking-wider">Additional Preferences</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-text-muted block">Language</span>
                        <span className="text-sm font-medium text-text-main">{profile?.language || "English"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted block">Relocation</span>
                        <span className="text-sm font-medium text-text-main">{profile?.relocation || "No"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted block">Education</span>
                        <span className="text-sm font-medium text-text-main">{profile?.education_level || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted block">Pace</span>
                        <span className="text-sm font-medium text-text-main">{profile?.learning_pace || "Standard"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-text-muted block mb-2">Preferred Industries</span>
                      <div className="flex flex-wrap gap-2">
                        {profile?.preferred_industries && profile.preferred_industries.length > 0 ? (
                          profile.preferred_industries.map((ind: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-surface-2 rounded text-xs text-text-main border border-border">
                              {ind}
                            </span>
                          ))
                        ) : <span className="text-sm text-text-muted italic">None selected</span>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border mt-4">
                    <Link href="/profile/setup" className="block w-full text-center py-2 rounded-lg border border-border text-xs font-medium text-text-muted hover:text-text-main hover:bg-surface-2 transition-colors">
                      Adjust Parameters
                    </Link>
                  </div>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
