import { API_BASE_URL, getToken } from "./auth";

export interface MarketGapAnalysis {
    role: string;
    soc_code: string;
    insights: {
        market_required_skills: string[];
        missing_skills: string[];
        skill_coverage_percent: number;
    };
    onet_skills: string[];
    live_skills: { skill: string; listing_count: number }[];
}

export interface MarketOutlook {
    trending_skills: string[];
    role_growth: string;
    salary_insight: string;
    market_outlook: string;
    hot_sectors: string[];
}

export async function getMarketGapAnalysis(): Promise<MarketGapAnalysis> {
    const token = getToken();
    if (!token) throw new Error("No token found");

    try {
        const response = await fetch(`${API_BASE_URL}/market-insights-test`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server returned ${response.status}`);
        }

        return response.json();
    } catch (error: any) {
        console.error("Market gap analysis error:", error);
        throw new Error(error.message || "Failed to fetch market gap analysis. Please ensure the server is running.");
    }
}

export async function getMarketOutlook(): Promise<MarketOutlook> {
    const token = getToken();
    if (!token) throw new Error("No token found");

    try {
        const response = await fetch(`${API_BASE_URL}/profile-insights`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Server returned ${response.status}`);
        }

        return response.json();
    } catch (error: any) {
        console.error("Market outlook error:", error);
        throw new Error(error.message || "Failed to fetch market outlook. Please ensure the server is running.");
    }
}
