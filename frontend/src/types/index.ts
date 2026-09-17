export interface DashboardData { readinessScore: number; scores: Record<string, number>; weeklyGoal: { completed: number; total: number }; streak: number; nextStep: string; recentActivity: string[] }
