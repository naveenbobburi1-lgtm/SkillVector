import { API_BASE_URL, getToken } from "./auth";

export interface MarketGapAnalysis {
    role: string;
    soc_code: string;
    insights: {
        market_required_skills: string[];
        missing_skills: string[];
        skill_coverage_percent: number;
    };
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

    const response = await fetch(`${API_BASE_URL}/market-insights-test`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch market gap analysis");
    }

    return response.json();
}

export async function getMarketOutlook(): Promise<MarketOutlook> {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE_URL}/profile-insights`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch market outlook");
    }

    return response.json();
}
