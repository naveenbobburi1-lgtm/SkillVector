"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getUserProfile, getToken } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";

interface NavbarProps {
    activePage?: "learning-path" | "profile" | "market-insights" | "assignments";
}

export default function Navbar({ activePage }: NavbarProps) {
    const [profile, setProfile] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        async function fetchMinimalProfile() {
            // We just need username/status for the menu
            try {
                const token = getToken();
                if (!token) return;
                const data = await getUserProfile();
                setProfile(data);
            } catch (e) {
                // Silent fail/ignore if unauth (UserMenu handles fallback)
            }
        }
        fetchMinimalProfile();
    }, []);

    const navLinkClass = (page: string) => `px-4 py-1.5 rounded-full text-sm transition-colors ${activePage === page
            ? "font-bold text-text-main bg-surface-1 shadow-sm border border-border/50 cursor-default"
            : "font-medium text-text-muted hover:text-text-main"
        }`;

    return (
        <>
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border h-16 flex items-center justify-between px-4 lg:px-8 relative">
                <div className="flex items-center gap-4">
                    {/* MOBILE HAMBURGER BUTTON */}
                    <button 
                        className="md:hidden flex flex-col justify-center items-center w-6 h-6 z-[60] relative"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={`block w-5 h-[1.5px] bg-text-main transition-all duration-300 absolute ${mobileMenuOpen ? "rotate-45 block" : "-translate-y-[6px]"}`}></span>
                        <span className={`block w-5 h-[1.5px] bg-text-main transition-all duration-300 absolute ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}></span>
                        <span className={`block w-5 h-[1.5px] bg-text-main transition-all duration-300 absolute ${mobileMenuOpen ? "-rotate-45 block" : "translate-y-[6px]"}`}></span>
                    </button>
                    
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-white text-lg">hub</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight hidden sm:block">Skillvector</span>
                    </Link>
                </div>

                {/* Center Nav (Desktop) */}
                <div className="hidden md:flex items-center gap-1 p-1 bg-surface-2/50 rounded-full border border-border/50">
                    <Link href="/learning-path" className={navLinkClass("learning-path")}>Learning Path</Link>
                    <Link href="/assignments" className={navLinkClass("assignments")}>Assignments</Link>
                    <Link href="/profile" className={navLinkClass("profile")}>Neural Profile</Link>
                    <Link href="/market-insights" className={navLinkClass("market-insights")}>Market Insights</Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex h-8 w-8 rounded-full bg-surface-2 border border-border items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-lg text-text-muted group-hover:text-text-main transition-colors">notifications</span>
                    </div>

                    <UserMenu
                        username={profile?.username}
                        currentStatus={profile?.current_status}
                    />
                </div>
            </nav>

            {/* MOBILE MENU DROPDOWN */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-xl z-[40] border-t border-border flex flex-col pt-4 px-4 overflow-y-auto pb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-2">
                        <Link href="/learning-path" onClick={() => setMobileMenuOpen(false)} className={`p-4 rounded-xl flex items-center gap-3 ${activePage === "learning-path" ? "bg-primary/10 text-primary font-bold border border-primary/20" : "bg-surface-1 text-text-main font-semibold hover:bg-surface-2"}`}>
                            <span className="material-symbols-outlined">map</span>Learning Path
                        </Link>
                        <Link href="/assignments" onClick={() => setMobileMenuOpen(false)} className={`p-4 rounded-xl flex items-center gap-3 ${activePage === "assignments" ? "bg-primary/10 text-primary font-bold border border-primary/20" : "bg-surface-1 text-text-main font-semibold hover:bg-surface-2"}`}>
                            <span className="material-symbols-outlined">assignment</span>Assignments
                        </Link>
                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className={`p-4 rounded-xl flex items-center gap-3 ${activePage === "profile" ? "bg-primary/10 text-primary font-bold border border-primary/20" : "bg-surface-1 text-text-main font-semibold hover:bg-surface-2"}`}>
                            <span className="material-symbols-outlined">person</span>Neural Profile
                        </Link>
                        <Link href="/market-insights" onClick={() => setMobileMenuOpen(false)} className={`p-4 rounded-xl flex items-center gap-3 ${activePage === "market-insights" ? "bg-primary/10 text-primary font-bold border border-primary/20" : "bg-surface-1 text-text-main font-semibold hover:bg-surface-2"}`}>
                            <span className="material-symbols-outlined">query_stats</span>Market Insights
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
