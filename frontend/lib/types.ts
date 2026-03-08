export interface SkillItem {
    name: string;
    proficiency: "beginner" | "intermediate" | "advanced";
}

export interface UserProfileData {
    age?: number;
    phone?: string;
    education_level?: string;
    current_status?: string;
    current_role?: string;
    current_industry?: string;
    location?: string;
    skills?: SkillItem[];
    certifications?: { title: string; issuer: string }[];
    desired_role?: string;
    preferred_industries?: string[];
    expected_income?: string;
    relocation?: boolean;
    language?: string;
    learning_pace?: string;
    hours_per_week?: string;
    learning_format?: string[];
    budget_sensitivity?: string;
    timeline?: string;
}
