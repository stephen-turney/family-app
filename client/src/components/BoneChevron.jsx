import { useTheme } from './ThemeProvider.jsx';

const BONE_PATH = 'M 2 -2 C -1 -6 -5 -3 -3 0 C -5 3 -1 6 2 2 L 14 2 C 17 6 21 3 19 0 C 21 -3 17 -6 14 -2 Z';

// Two rounded bones meet at the point of a familiar date-navigation chevron.
export default function BoneChevron({ direction }) {
  const { isSpooky } = useTheme();
  if (!isSpooky) {
    return (
      <svg className="daynav-arrow" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <path
          d={direction === 'next' ? 'M13 8 L23 18 L13 28' : 'M23 8 L13 18 L23 28'}
          fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className="daynav-arrow bone-chevron" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <g transform={direction === 'next' ? 'translate(36 0) scale(-1 1)' : undefined}>
        <path className="chevron-bone" d={BONE_PATH} transform="translate(11 18) rotate(-45)" />
        <path className="chevron-bone" d={BONE_PATH} transform="translate(11 18) rotate(45)" />
      </g>
    </svg>
  );
}
