import { useState } from 'react';
import completionKnife from '../assets/completion-knife.svg';

const SPLATTER_PATTERNS = [
  {
    splashes: 'M66 27l4 5 7-3-2 7 6 4-7 2-1 7-5-5-6 2 2-7-5-4 7-2Z M29 70c4-5 11-2 10 3s-7 8-11 4-2-5 1-7Z',
    drops: [[83, 24, 3], [47, 85, 3.5], [20, 60, 2.5]],
  },
  {
    splashes: 'M71 63l5 3 6-4-1 7 6 4-7 2-2 7-4-6-7 1 3-6-5-5 6-1Z M23 35c3-5 10-4 11 1s-5 9-10 6-4-4-1-7Z',
    drops: [[85, 52, 3], [61, 84, 3.5], [18, 24, 2.5]],
  },
  {
    splashes: 'M34 67l5 4 6-3-1 6 6 4-7 2-2 7-4-6-7 2 2-7-5-4 6-2Z M73 29c5-3 10 2 7 7s-9 5-11 0 0-5 4-7Z',
    drops: [[23, 84, 3], [85, 43, 3.5], [57, 73, 2.5]],
  },
  {
    splashes: 'M74 41l3 6 7-1-4 6 5 5-7-1-3 7-3-6-7-1 5-4-2-6 6 2Z M49 77c2-6 11-6 12-1s-4 10-9 7-5-3-3-6Z',
    drops: [[87, 31, 3], [37, 88, 3.5], [68, 73, 2.5]],
  },
  {
    splashes: 'M21 57l5 4 6-3-2 7 6 4-7 1-2 7-4-6-6 2 2-7-5-3 6-2Z M69 72c4-5 11-3 12 2s-6 9-11 6-4-5-1-8Z',
    drops: [[17, 43, 3], [84, 61, 3.5], [48, 83, 2.5]],
  },
  {
    splashes: 'M57 70l5 4 6-3-1 6 6 4-7 2-2 6-4-5-7 1 3-6-5-4 6-2Z M78 23c5-3 10 2 8 7s-9 6-12 1 0-6 4-8Z',
    drops: [[84, 46, 3], [37, 79, 3.5], [73, 88, 2.5]],
  },
];

export default function CompletionMark() {
  // Mounted only for a checked row: rechecking picks again, while ordinary
  // rerenders and background refreshes keep the current pattern steady.
  const [patternIndex] = useState(() => Math.floor(Math.random() * SPLATTER_PATTERNS.length));
  const pattern = SPLATTER_PATTERNS[patternIndex];

  return (
    <>
      <span className="completion-splatter" data-pattern={patternIndex}>
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="#D10B16">
          <path d={pattern.splashes} />
          {pattern.drops.map(([x, y, radius], index) => (
            <circle key={index} cx={x} cy={y} r={radius} />
          ))}
        </svg>
      </span>
      <img className="completion-knife" src={completionKnife} alt="" />
      <span className="completion-entry" />
    </>
  );
}
