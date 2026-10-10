// Apply the seasonal palette when rendering member accents, without changing
// the saved colors or requiring existing family members to be edited.
export const MEMBER_COLORS = ['#32CD32', '#9370DB', '#FF7518', '#FF6347', '#9932CC', '#C71585'];

const PALETTE_COLORS = new Set([
  '#FF7518', '#FF4500', '#8B008B', '#4B0082', '#000000', '#228B22',
  '#556B2F', '#FF6347', '#8A2BE2', '#663399', '#E07B10', '#9400D3',
  '#6A0DAD', '#2F2F2F', '#2E8B57', '#6B8E23', '#FF8C69', '#9932CC',
  '#7B3DAA', '#D2691E', '#FFA500', '#C71585', '#800080', '#1C1C1C',
  '#32CD32', '#708090', '#FF7F50', '#9370DB', '#8B3A62',
]);

const LEGACY_COLORS = new Map(
  ['#AFD5C0', '#A9C3D5', '#A99CC6', '#EFBCC8', '#EC9DB8', '#BA82AD']
    .map((color, index) => [color, MEMBER_COLORS[index]])
);

export function memberColor(member) {
  const color = String(member?.color || '').trim().toUpperCase();
  if (PALETTE_COLORS.has(color)) return color;
  if (LEGACY_COLORS.has(color)) return LEGACY_COLORS.get(color);

  // IDs keep unrecognized custom colors stable between pages and reloads.
  const id = String(member?.id ?? '');
  let index = 0;
  for (let i = 0; i < id.length; i += 1) {
    index = (index * 31 + id.charCodeAt(i)) % MEMBER_COLORS.length;
  }
  return MEMBER_COLORS[index];
}
