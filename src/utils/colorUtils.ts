export const getAvatarColor = (str: string) => {
  const colors = [
    '#f87171', // Red
    '#fb923c', // Orange
    '#fbbf24', // Yellow
    '#a3e635', // Lime
    '#4ade80', // Green
    '#34d399', // Emerald
    '#2dd4bf', // Teal
    '#22d3ee', // Cyan
    '#38bdf8', // Light Blue
    '#60a5fa', // Blue
    '#818cf8', // Indigo
    '#a78bfa', // Violet
    '#c084fc', // Purple
    '#e879f9', // Fuchsia
    '#f472b6', // Pink
    '#fb7185'  // Rose
  ];
  let hash = 0;
  if (!str) return colors[0];
  
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return colors[hash % colors.length];
};
