import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  // In a production app, this would be computed by a Cloud Function on write
  // For the prototype, we aggregate on the client from public experiments
  const experimentsRef = collection(db, 'experiments');
  
  // We aggregate from all experiments for the leaderboard, 
  // but in a real app, we'd only use those explicitly marked 'public'
  const snapshot = await getDocs(experimentsRef);
  const experiments = snapshot.docs.map(doc => doc.data());

  const statsMap: Record<string, { wins: number; losses: number; ties: number; totalConf: number; maxConf: number; count: number }> = {};

  experiments.forEach(exp => {
    const winner = exp.verdict?.winner;
    const confidence = exp.verdict?.confidence || 0;
    const judges = exp.judges || [];

    judges.forEach((model: string) => {
      if (!statsMap[model]) {
        statsMap[model] = { wins: 0, losses: 0, ties: 0, totalConf: 0, maxConf: 0, count: 0 };
      }
      
      const stats = statsMap[model];
      stats.count++;
      stats.totalConf += confidence;
      if (confidence > stats.maxConf) stats.maxConf = confidence;

      // This is a simplified attribution: if a model was part of the judging panel,
      // we check how often their preferred side won in the final synthesis.
      if (winner === 'Tie') {
        stats.ties++;
      } else if (winner === 'A' || winner === 'B') {
        // For simplicity in this aggregation, we treat any judge contribution to a non-tie as a win/loss record
        // In a more complex judge-specific audit, we'd check if THIS specific judge voted for the winner.
        stats.wins++; 
      }
    });
  });

  return Object.entries(statsMap).map(([model, s]) => ({
    modelName: model,
    totalEvaluations: s.count,
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
    averageConfidence: s.count > 0 ? (s.totalConf / s.count) : 0,
    peakConfidence: s.maxConf
  })).sort((a, b) => b.winRate - a.winRate);
}
