export interface Resource {
    type: "Course" | "Article" | "Book" | "Video";
    title: string;
    platform: string;
    link: string;
}

export interface Project {
    title: string;
    description: string;
}

export interface LearningPathStage {
    stage: string;
    duration_months: number;
    why_this_module: string;
    topics: string[];
    focus: string[];
    skills: string[];
    resources: Resource[];
    projects: Project[];
}

export interface MetaData {
    goal: string;
    duration_months: number;
    weekly_time_hours: number;
    level: string;
}

export interface LearningPathResponse {
    meta: MetaData;
    learning_path: LearningPathStage[];
}
