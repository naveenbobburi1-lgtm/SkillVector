"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getUserProfile, getToken } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";

interface NavbarProps {
    activePage?: "learning-path" | "profile" | "market-insights";
}

export default function Navbar({ activePage }: NavbarProps) {
    const [profile, setProfile] = useState<any>(null);

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
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border h-16 flex items-center justify-between px-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-white text-lg">hub</span>
                </div>
                <span className="font-bold text-lg tracking-tight">Skillvector</span>
            </Link>

            {/* Center Nav (Desktop) */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-surface-2/50 rounded-full border border-border/50">
                <Link href="/learning-path" className={navLinkClass("learning-path")}>Learning Path</Link>
                <Link href="/profile" className={navLinkClass("profile")}>Neural Profile</Link>
                <Link href="/market-insights" className={navLinkClass("market-insights")}>Market Insights</Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-lg text-text-muted group-hover:text-text-main transition-colors">notifications</span>
                </div>

                <UserMenu
                    username={profile?.username}
                    currentStatus={profile?.current_status}
                />
            </div>
        </nav>
    );
}
