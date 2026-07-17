export interface ModelStats {
  modelName: string;
  totalEvaluations: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  averageConfidence: number;
  peakConfidence: number;
}

export async function calculateLeaderboardStats(): Promise<ModelStats[]> {
  try {
    const response = await fetch("/api/leaderboard");
    if (!response.ok) {
      throw new Error(`Failed to fetch server-aggregated leaderboard stats (Status ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching server-side leaderboard stats, falling back to client-side empty list:", error);
    return [];
  }
}
