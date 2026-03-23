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

export interface WeeklyTask {
    week: number;
    focus: string;
    learning_objectives: string[];
    practice_tasks: string[];
}

export interface LearningPathStage {
    stage: string;
    phase: string;
    duration_months: number;
    duration_weeks: number;
    why_this_module: string;
    why_this_phase: string;
    topics: string[];
    focus: string[];
    skills: string[];
    resources: Resource[];
    projects: Project[];
    weekly_breakdown: WeeklyTask[];
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

export interface WeeklyTaskProgress {
    week_number: number;
    is_completed: boolean;
    completed_at: string | null;
}

export interface PhaseWeeklyProgress {
    phase_index: number;
    tasks: WeeklyTaskProgress[];
}
