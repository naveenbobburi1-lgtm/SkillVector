"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserProfile, API_BASE_URL, getToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";

// New Components
import DashboardLayout from "@/components/profile/DashboardLayout";
import CareerNorthStar from "@/components/profile/CareerNorthStar";
import RoleRadar from "@/components/profile/RoleRadar";
import SkillDNAMatrix from "@/components/profile/SkillDNAMatrix";
import RealityGapBridge from "@/components/profile/RealityGapBridge";
import ActionCommand from "@/components/profile/ActionCommand";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Interaction State (Mocking simple alerts for now, full modals can be added later)
  const [showAddSkill, setShowAddSkill] = useState(false);

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

  const handleAddSkill = async () => {
    // For this iteration, we just redirect to setup or show a placeholder
    // In a real 'ActionCommand' flow, this would open a modal
    const skill = prompt("Enter a new skill vector to add:");
    if (skill && skill.trim()) {
      const token = getToken();
      try {
        const res = await fetch(`${API_BASE_URL}/add-skill`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ skill: skill.trim() }),
        });
        if (res.ok) {
          const updated = await res.json();
          setProfile((prev: any) => ({ ...prev, skills: updated.skills }));
        }
      } catch (e) { console.error(e); }
    }
  };

  const handleEditParams = () => {
    router.push("/profile/setup");
  };

  const handleGeneratePath = () => {
    router.push("/learning-path");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-main flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted font-mono animate-pulse">BOOTING NEURAL INTERFACE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-white pb-32">
      {/* Top Navigation Bar */}
      <Navbar activePage="profile" />

      <main className="max-w-[1600px] mx-auto">
        <DashboardLayout>

          {/* ROW 1: MISSION CONTROL HEADER (Full Width) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-12 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span className="text-xs font-mono text-success uppercase tracking-widest">System Online</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-main tracking-tight">
                Mission Control
              </h1>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="block text-[10px] text-text-dim uppercase font-bold tracking-wider">Sync Status</span>
                <span className="text-sm font-mono text-text-main">LAST SYNC: 2 MINS AGO</span>
              </div>
              <div className="h-10 w-[1px] bg-border"></div>
              <div>
                <span className="block text-[10px] text-text-dim uppercase font-bold tracking-wider">Profile ID</span>
                <span className="text-sm font-mono text-text-main">SV-{profile?.id ? profile.id.toString().padStart(6, '0') : '000000'}</span>
              </div>
            </div>
          </div>

          {/* ROW 2: CORE METRICS */}

          {/* North Star (Target) - Large */}
          <div className="col-span-1 md:col-span-2 lg:col-span-6 min-h-[280px]">
            <CareerNorthStar
              currentRole={profile?.current_status || "Explorer"}
              targetRole={profile?.desired_role || "Unset Goal"}
              velocity={profile?.learning_pace || "Moderate"}
              matchScore={72} // Mocked score for now, connected to backend later
            />
          </div>

          {/* Role Radar (Market Fit) - Medium */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 min-h-[280px]">
            <RoleRadar
              salaryMatch={85}
              demandMatch={92}
              skillMatch={65}
              futureGrowth={88}
            />
          </div>

          {/* Constraints / Stats - Medium */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 min-h-[280px] flex flex-col gap-6">
            {/* Mini Stat Cards */}
            <div className="glass-panel p-5 rounded-3xl flex-1 flex flex-col justify-center">
              <span className="text-xs font-bold text-text-dim uppercase tracking-wider mb-2">Weekly Bandwidth</span>
              <div className="text-3xl font-bold text-text-main">{profile?.hours_per_week} <span className="text-sm text-text-muted font-normal">hrs</span></div>
              <div className="w-full bg-surface-2 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="w-[60%] h-full bg-primary rounded-full"></div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl flex-1 flex flex-col justify-center">
              <span className="text-xs font-bold text-text-dim uppercase tracking-wider mb-2">Income Target</span>
              <div className="text-3xl font-bold text-text-main">{profile?.expected_income || "--"}</div>
              <div className="w-full bg-surface-2 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="w-[40%] h-full bg-success rounded-full"></div>
              </div>
            </div>
          </div>

          {/* ROW 3: DEEP DIVE */}

          {/* Skill DNA - Wide */}
          <div className="col-span-1 md:col-span-2 lg:col-span-8 min-h-[300px]">
            <SkillDNAMatrix skills={profile?.skills || []} />
          </div>

          {/* Reality Gap - Narrow */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[300px]">
            {/* Mocking missing skills for dev. In real app, pass data from Market API */}
            <RealityGapBridge missingSkills={["System Design", "Kubernetes", "GraphQL"]} />
          </div>

        </DashboardLayout>
      </main>

      <ActionCommand
        onAddSkill={handleAddSkill}
        onEditParams={handleEditParams}
        onGeneratePath={handleGeneratePath}
      />

    </div>
  );
}

