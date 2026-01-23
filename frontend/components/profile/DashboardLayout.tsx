"use client";

import React from "react";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 p-4 lg:p-8 animate-in fade-in duration-700">
            {children}
        </div>
    );
}
