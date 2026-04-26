// Rank 1–5 each get their own gradient + glow so the leaderboard reads at a
// glance. Rank 6+ falls back to plain text.
export const getRankNameClasses = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]';
    case 2:
      return 'bg-gradient-to-r from-slate-100 via-gray-300 to-zinc-400 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_8px_rgba(229,231,235,0.45)]';
    case 3:
      return 'bg-gradient-to-r from-orange-400 via-amber-600 to-rose-500 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_8px_rgba(249,115,22,0.45)]';
    case 4:
      return 'bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]';
    case 5:
      return 'bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_6px_rgba(232,121,249,0.4)]';
    default:
      return '';
  }
};

export const isTopRank = (rank: number): boolean => rank >= 1 && rank <= 5;

export const getRankMedal = (rank: number): string | null => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
};
