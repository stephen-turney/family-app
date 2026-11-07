import Avatar from './Avatar.jsx';
import { memberColor } from '../lib/theme.js';
import { useTheme } from './ThemeProvider.jsx';

export default function MemberBadge({ member, selectable, dim, onClick }) {
  const { theme } = useTheme();
  return (
    <span
      className={`badge ${selectable ? 'selectable' : ''} ${dim ? 'dim' : ''}`}
      onClick={onClick}
    >
      <span className="swatch" style={{ background: memberColor(member, theme) }} />
      <Avatar member={member} size={20} />
      <span>{member.name}</span>
    </span>
  );
}
