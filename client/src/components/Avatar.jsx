// Circular member avatar: shows the uploaded photo if present, otherwise the
// first letter of the member's name in the existing avatar frame.
export default function Avatar({ member, size = 24 }) {
  const base = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };
  const initial = Array.from(member?.name?.trim() || '?')[0].toLocaleUpperCase();
  if (member?.avatar) {
    return (
      <img
        src={member.avatar}
        alt={member.name}
        style={{ ...base, objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <span
      style={{
        ...base,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.6),
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}
