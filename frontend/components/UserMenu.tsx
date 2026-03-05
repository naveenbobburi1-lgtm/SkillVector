"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

interface UserMenuProps {
    username?: string;
    currentStatus?: string;
}

export default function UserMenu({ username = "User", currentStatus = "Member" }: UserMenuProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        removeToken();
        router.push("/login");
    };

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Area */}
            <div
                className="flex items-center gap-3 pl-2 border-l border-border/50 cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="hidden md:block text-right">
                    <div className="text-sm font-semibold text-text-main leading-none">{username}</div>
                    <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{currentStatus}</div>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 border-2 border-surface-1 shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                    <span className="text-sm font-bold text-white uppercase">{username.charAt(0)}</span>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-48 bg-surface-1 border border-border rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-2 border-b border-border md:hidden">
                        <p className="text-sm font-semibold text-text-main">{username}</p>
                        <p className="text-xs text-text-muted">{currentStatus}</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-2 flex items-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
