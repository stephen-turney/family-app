// Turn a surname into the household form: "smith" -> "The Smiths",
// "Jones" -> "The Joneses". Follows the common English convention for
// pluralizing family names:
//   - ends in s, x, z, ch, or sh  -> add "es"
//   - otherwise (including names ending in y, e.g. Kennedy)  -> add "s"
// The first letter is capitalized; the rest of the entry is preserved
// (so "McDonald" -> "The McDonalds").
export function pluralizeFamily(rawName) {
  const name = (rawName || '').trim();
  if (!name) return '';
  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  const lower = cap.toLowerCase();
  const addEs =
    lower.endsWith('s') ||
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('ch') ||
    lower.endsWith('sh');
  return `The ${cap}${addEs ? 'es' : 's'}`;
}
