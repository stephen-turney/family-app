import Avatar from './Avatar.jsx';

export default function MemberBadge({ member, selectable, dim, onClick }) {
  return (
    <span
      className={`badge ${selectable ? 'selectable' : ''} ${dim ? 'dim' : ''}`}
      onClick={onClick}
    >
      <span className="swatch" style={{ background: member.color }} />
      <Avatar member={member} size={20} />
      <span>{member.name}</span>
    </span>
  );
}
