// Circular member avatar: shows the uploaded photo if present, otherwise the
// member's emoji in a circle.
export default function Avatar({ member, size = 24 }) {
  const base = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };
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
        fontSize: Math.round(size * 0.72),
        lineHeight: 1,
      }}
    >
      {member?.emoji}
    </span>
  );
}
