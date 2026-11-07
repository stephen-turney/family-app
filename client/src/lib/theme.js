// Keep existing installations on their current look until a theme is chosen.
export function resolveTheme(value) {
  return value === 'default' || value === 'thanksgiving' ? value : 'spooky';
}

export const DEFAULT_MEMBER_COLORS = ['#AFD5C0', '#A9C3D5', '#A99CC6', '#EFBCC8', '#EC9DB8', '#BA82AD'];
export const MEMBER_COLORS = ['#32CD32', '#9370DB', '#FF7518', '#FF6347', '#9932CC', '#C71585'];
export const THANKSGIVING_MEMBER_COLORS = ['#7D8537', '#B78A32', '#CF7028', '#AB3F42', '#9A653E', '#8C586B'];

export function memberColors(theme) {
  if (theme === 'thanksgiving') return THANKSGIVING_MEMBER_COLORS;
  return theme === 'default' ? DEFAULT_MEMBER_COLORS : MEMBER_COLORS;
}

const THANKSGIVING_PALETTE = new Set([...THANKSGIVING_MEMBER_COLORS, '#000000']);
const HARVEST_COLORS = new Map(
  [DEFAULT_MEMBER_COLORS, MEMBER_COLORS].flatMap((colors) =>
    colors.map((color, index) => [color, THANKSGIVING_MEMBER_COLORS[index]])
  )
);

const PALETTE_COLORS = new Set([
  '#FF7518', '#FF4500', '#8B008B', '#4B0082', '#000000', '#228B22',
  '#556B2F', '#FF6347', '#8A2BE2', '#663399', '#E07B10', '#9400D3',
  '#6A0DAD', '#2F2F2F', '#2E8B57', '#6B8E23', '#FF8C69', '#9932CC',
  '#7B3DAA', '#D2691E', '#FFA500', '#C71585', '#800080', '#1C1C1C',
  '#32CD32', '#708090', '#FF7F50', '#9370DB', '#8B3A62',
]);

const LEGACY_COLORS = new Map(
  DEFAULT_MEMBER_COLORS
    .map((color, index) => [color, MEMBER_COLORS[index]])
);

export function memberColor(member, theme = 'spooky') {
  const color = String(member?.color || '').trim().toUpperCase();
  if (theme === 'default') {
    // Show the actual saved color; switching themes never rewrites family data.
    if (/^#[0-9A-F]{6}$/.test(color)) return color;
  } else if (theme === 'thanksgiving') {
    if (THANKSGIVING_PALETTE.has(color)) return color;
    if (HARVEST_COLORS.has(color)) return HARVEST_COLORS.get(color);
  } else {
    if (PALETTE_COLORS.has(color)) return color;
    if (LEGACY_COLORS.has(color)) return LEGACY_COLORS.get(color);
  }

  const colors = memberColors(theme);
  // IDs keep unrecognized custom colors stable between pages and reloads.
  const id = String(member?.id ?? '');
  let index = 0;
  for (let i = 0; i < id.length; i += 1) {
    index = (index * 31 + id.charCodeAt(i)) % colors.length;
  }
  return colors[index];
}
