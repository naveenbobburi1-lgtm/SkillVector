export interface SkillItem {
    name: string;
    proficiency: "beginner" | "intermediate" | "advanced";
}

export interface UserProfileData {
    education_level?: string;
    current_status?: string;
    current_role?: string;
    current_industry?: string;
    location?: string;
    skills?: SkillItem[];
    desired_role?: string;
    preferred_industries?: string[];
    language?: string;
    learning_pace?: string;
    hours_per_week?: string;
    budget_sensitivity?: string;
    timeline?: string;
}
