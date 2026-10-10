function Pumpkin({ x, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="112" cy="162" rx="76" ry="9" fill="#1C1C1C" opacity=".25" />
      <path d="M106 73c-4-12 1-22 11-27l10 7c-9 4-12 11-9 20" fill="#6B8E23" stroke="#556B2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M112 75c-29-18-62-4-67 25-6 30 10 57 38 61 11 2 21 0 29-3 11 5 23 5 36 1 27-8 39-32 32-60-7-28-41-41-68-24Z" fill="#FF7518" stroke="#2F2F2F" strokeWidth="3" strokeLinejoin="round" />
      <path d="M93 75c-15 9-22 25-20 45 1 17 8 31 19 39" stroke="#D2691E" strokeWidth="3" strokeLinecap="round" />
      <path d="M132 74c15 10 22 26 20 44-1 18-8 32-18 42" stroke="#D2691E" strokeWidth="3" strokeLinecap="round" />
      <path d="M111 80c-10 18-11 46-2 72" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" />
      <path d="m82 110 12-13 7 15Z" fill="#2F2F2F" stroke="#2F2F2F" strokeWidth="2" strokeLinejoin="round" />
      <path d="m124 112 8-15 11 13Z" fill="#2F2F2F" stroke="#2F2F2F" strokeWidth="2" strokeLinejoin="round" />
      <path d="m106 119 6-8 7 9Z" fill="#2F2F2F" stroke="#2F2F2F" strokeWidth="2" strokeLinejoin="round" />
      <path d="M82 128c15 12 45 14 62-1-6 23-44 29-62 1Z" fill="#2F2F2F" stroke="#2F2F2F" strokeWidth="2" strokeLinejoin="round" />
      <path d="m102 136 1 7 9 1 1-7" fill="#FFA500" />
      <path d="M53 109c-2 11 0 20 4 26" stroke="#FF8C69" strokeWidth="3" strokeLinecap="round" opacity=".8" />
    </g>
  );
}

function Ghost({ x, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Keep positioning separate from the gentle floating animation. */}
      <g className="spooky-ghost">
        <path d="M194 112c0-31 12-50 36-51 25-1 40 20 39 49l5 30c-7 5-13 1-18-5-4 9-13 12-20 4-6 10-15 9-22 1-8 7-16 7-23 0Z" fill="#9370DB" stroke="#663399" strokeWidth="3" strokeLinejoin="round" />
        <path d="M202 100c1-15 7-25 17-29" stroke="#FF8C69" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="216" cy="99" rx="4" ry="6" fill="#2F2F2F" />
        <ellipse cx="243" cy="99" rx="4" ry="6" fill="#2F2F2F" />
        <path d="M222 113c4 6 11 6 15 0" stroke="#2F2F2F" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="207" cy="111" rx="6" ry="3.5" fill="#FF8C69" />
        <ellipse cx="252" cy="111" rx="6" ry="3.5" fill="#FF8C69" />
        <path d="M193 111c-6 0-11-4-14-9M270 109c6-1 11-6 13-12" stroke="#9370DB" strokeWidth="8" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Frankenstein({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#2F2F2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="44" cy="109" rx="43" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      <path d="m29 81-2 20 15 1 3-18 3 18 15-1-2-20Z" fill="#4B0082" />
      <path d="M26 99c-7 1-9 5-8 9h25v-8M49 100v8h25c1-4-3-8-11-9" fill="#1C1C1C" />
      <path d="M24 59c-8 2-12 8-14 17l12 5 11-14M64 59c9 1 15 8 18 17l-12 5-12-13" fill="#663399" />
      <path d="M10 75c-7 0-9 7-4 11 4 3 10 2 14-2l2-5M82 75c7 0 9 7 4 11-4 3-10 2-14-2l-2-5" fill="#32CD32" />
      <path d="M25 57c11-7 27-7 39 0l5 31c-16 5-35 5-50 0Z" fill="#663399" />
      <path d="m28 55 15 14 17-14-6 23-11-7-10 8Z" fill="#9370DB" />
      <path d="M37 48v12l7 8 8-8V48" fill="#32CD32" />
      <circle cx="44" cy="79" r="2.2" fill="#FFA500" stroke="none" />
      <circle cx="44" cy="87" r="2.2" fill="#FFA500" stroke="none" />
      <path d="M15 44h10M63 44h11" stroke="#8A2BE2" strokeWidth="5" />
      <path d="M12 40h5v8h-5ZM73 40h5v8h-5Z" fill="#708090" stroke="#2F2F2F" strokeWidth="2" />
      <path d="M23 12c13-4 29-4 42 0l1 34c0 11-10 16-22 16S22 56 22 47Z" fill="#32CD32" />
      <path d="M22 24V11c15-4 30-4 44 0v13l-9-3-3 5-8-6-8 5-6-4Z" fill="#1C1C1C" />
      <path d="m50 29 11 1m-9-4-1 6m6-5-1 6" stroke="#228B22" strokeWidth="1.7" />
      <path d="m29 35 8-1m12 0 8 1" strokeWidth="2" />
      <ellipse cx="34" cy="41" rx="3" ry="4.5" fill="#2F2F2F" stroke="none" />
      <ellipse cx="53" cy="41" rx="3" ry="4.5" fill="#2F2F2F" stroke="none" />
      <path d="M34 51c5 6 14 6 19 0" fill="none" />
      <ellipse cx="28" cy="48" rx="4" ry="2.5" fill="#FF8C69" stroke="none" />
      <ellipse cx="59" cy="48" rx="4" ry="2.5" fill="#FF8C69" stroke="none" />
    </g>
  );
}

function Vampire({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#2F2F2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="54" cy="109" rx="49" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      <path d="M39 58 13 54 1 102c10-5 17-4 23 4 10-6 18-7 29 0 11-7 20-6 29 0 7-8 13-9 24-4L95 54 70 58Z" fill="#1C1C1C" />
      <path d="m23 65-8 31 27-13M85 65l8 31-27-13" stroke="#663399" fill="none" strokeWidth="2" />
      <path d="m40 90-3 15 15 1 2-13 2 13 15-1-3-15" fill="#4B0082" />
      <path d="M36 102c-7 0-10 3-10 7h26v-5M57 104v5h26c0-4-4-7-12-7" fill="#1C1C1C" />
      <path d="M39 61h30l7 36H32Z" fill="#9370DB" />
      <path d="m39 61 15 22 15-22" fill="#FF8C69" />
      <path d="m47 71 7 4 7-4v10l-7-4-7 4Z" fill="#C71585" strokeWidth="1.5" />
      <path d="m48 64-7-1L17 44l11 30 19 4M60 64l7-1 24-19-11 30-19 4" fill="#C71585" />
      <path d="M47 50v12l7 8 7-8V50" fill="#FF8C69" />
      <path d="m33 29-12-8 4 18 11 7M75 29l12-8-4 18-11 7" fill="#FF7F50" />
      <path d="M30 32c0-17 9-25 24-25s24 8 24 25c0 17-9 30-24 30S30 49 30 32Z" fill="#FF8C69" />
      <path d="M30 33c-2-19 7-29 24-29s27 10 24 29L67 19 54 30 42 19Z" fill="#1C1C1C" />
      <path d="m39 35 8-2m14 0 8 2" fill="none" strokeWidth="2" />
      <ellipse cx="43" cy="40" rx="3" ry="4" fill="#2F2F2F" stroke="none" />
      <ellipse cx="65" cy="40" rx="3" ry="4" fill="#2F2F2F" stroke="none" />
      <path d="M42 48c6 9 18 9 24 0Z" fill="#2F2F2F" strokeWidth="1.5" />
      <path d="m44 49 3 7 3-7m9 0 3 7 3-7" fill="#FF8C69" stroke="none" />
      <ellipse cx="35" cy="46" rx="4" ry="2.5" fill="#FF6347" stroke="none" />
      <ellipse cx="73" cy="46" rx="4" ry="2.5" fill="#FF6347" stroke="none" />
    </g>
  );
}

function Zombie({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#2F2F2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="49" cy="99" rx="46" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      <path d="m36 75-4 19 15 1 3-14 8 13 13-5-10-19Z" fill="#4B0082" />
      <path d="M32 91c-7-1-12 3-11 8h25v-7M60 90l4 8 23-5c-1-5-8-6-16-5" fill="#1C1C1C" />
      <path d="M30 48 12 56 8 46c-2-5-9-2-8 3l2 16c1 4 5 5 9 4l23-9M66 48l17 13 9-4c5-2 8 5 3 8l-13 7c-3 1-5 0-8-2L60 59" fill="#2E8B57" />
      <path d="M33 47c9-5 23-5 32 0l10 14-11 6 3 13-12-3-6 6-6-5-12 4 2-17-12-4Z" fill="#7B3DAA" />
      <path d="m43 45 7 13 10-13" fill="#6B8E23" />
      <path d="m50 60 1 10m-8-3 5 2m8-1 6-3" fill="none" stroke="#8A2BE2" strokeWidth="1.8" />
      <path d="m35 71 7-2 4 8-9 1Z" fill="#8A2BE2" strokeWidth="1.5" />
      <path d="m35 71 11 5m-8-7 3 8" fill="none" strokeWidth="1.3" />
      <path d="M28 16c2-13 18-19 34-12 13 5 16 20 9 33-3 10-17 17-30 13-12-3-17-17-13-34Z" fill="#2E8B57" />
      <path d="M27 19c-3-8 1-15 10-18l1 7 9-8 2 8 12-4 6 8-10-1-5 5-8-6-7 8Z" fill="#4B0082" strokeWidth="2" />
      <path d="m35 24 9-2m12-1 9 3" fill="none" strokeWidth="2" />
      <ellipse cx="40" cy="30" rx="3" ry="4.5" fill="#2F2F2F" stroke="none" />
      <circle cx="61" cy="30" r="6" fill="#FF8C69" strokeWidth="1.7" />
      <circle cx="63" cy="31" r="2.3" fill="#2F2F2F" stroke="none" />
      <path d="M37 40c9 7 18 8 26-1l-2 9c-9 5-18 0-24-8Z" fill="#2F2F2F" strokeWidth="1.5" />
      <path d="m42 42 1 4 5 1-1-4m9-1-1 4 4-1 1-4" fill="#FF8C69" stroke="none" />
      <path d="m30 34 7 2m-6-4-1 4m5-3-1 4" fill="none" stroke="#556B2F" strokeWidth="1.5" />
      <ellipse cx="69" cy="39" rx="4" ry="2.5" fill="#FF8C69" stroke="none" />
    </g>
  );
}

function Spider({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#2F2F2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="46" cy="99" rx="34" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      <path d="M46 3v19" stroke="#8A2BE2" strokeWidth="1.5" opacity=".7" />
      {/* Four softly bent legs on each side. */}
      <g fill="none" stroke="#9370DB" strokeWidth="3">
        <path d="M28 48C16 40 13 30 4 35L-5 22" />
        <path d="M26 55C9 47 3 47-2 55L-6 67" />
        <path d="M23 64C10 64 1 67 1 76L-3 88" />
        <path d="M26 73C17 79 17 91 10 95L5 98" />
        <path d="M64 48C76 40 79 30 88 35L97 22" />
        <path d="M66 55C83 47 89 47 94 55L98 67" />
        <path d="M69 64C82 64 91 67 91 76L95 88" />
        <path d="M66 73C75 79 75 91 82 95L87 98" />
      </g>
      <ellipse cx="46" cy="65" rx="29" ry="27" fill="#7B3DAA" />
      <path d="M32 79c6 7 15 9 23 5" fill="none" stroke="#8A2BE2" strokeWidth="3" opacity=".65" />
      <ellipse cx="46" cy="45" rx="24" ry="23" fill="#9370DB" />
      <ellipse cx="37" cy="42" rx="8.5" ry="10.5" fill="#FF8C69" strokeWidth="1.7" />
      <ellipse cx="55" cy="42" rx="8.5" ry="10.5" fill="#FF8C69" strokeWidth="1.7" />
      <circle cx="39" cy="44" r="3.5" fill="#2F2F2F" stroke="none" />
      <circle cx="53" cy="44" r="3.5" fill="#2F2F2F" stroke="none" />
      <circle cx="40" cy="43" r="1.2" fill="#FF8C69" stroke="none" />
      <circle cx="54" cy="43" r="1.2" fill="#FF8C69" stroke="none" />
      <path d="M40 57c4 5 10 5 14 0" fill="none" />
      <ellipse cx="29" cy="55" rx="4" ry="2.5" fill="#FF8C69" stroke="none" />
      <ellipse cx="63" cy="55" rx="4" ry="2.5" fill="#FF8C69" stroke="none" />
    </g>
  );
}

function Bat({ x, y, scale = 1, rotate = 0 }) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      d="M-26 0c7-7 14-10 21-9l5 7 5-7c7-1 14 2 21 9-7-1-9 4-10 9-5-5-10-3-16 3-6-6-11-8-16-3-1-5-3-10-10-9Z"
      fill="#9370DB" stroke="#8A2BE2" strokeWidth="1.5" strokeLinejoin="round"
    />
  );
}

function Star({ x, y, size = 8 }) {
  return (
    <path transform={`translate(${x} ${y}) scale(${size / 8})`} d="m0-11 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#FFA500" />
  );
}

function Mushroom({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} strokeWidth="2" strokeLinejoin="round">
      <path d="M-4-5-6 13c4 2 8 2 12 0L4-5Z" fill="#FF8C69" stroke="#663399" />
      <path d="M-18-3c1-11 9-19 18-19S17-14 18-3c-10 4-26 4-36 0Z" fill="#9370DB" stroke="#8A2BE2" />
      <circle cx="-8" cy="-9" r="3" fill="#FF8C69" stroke="none" />
      <circle cx="4" cy="-14" r="3.5" fill="#FF8C69" stroke="none" />
      <circle cx="11" cy="-6" r="2.5" fill="#FF8C69" stroke="none" />
    </g>
  );
}

// A panoramic Halloween garden, with its main pair kept in the mobile crop.
export default function HalloweenScene({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 860 180"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      {/* The sky stays transparent so the banner's purple gradient shines through. */}
      <path d="M594 17c-14 1-24 12-23 25 1 13 12 22 25 20 7-1 12-5 15-10-12 3-24-5-25-17-1-7 2-13 8-18Z" fill="#FFA500" stroke="#FF7518" strokeWidth="2" strokeLinejoin="round" />
      <Star x={36} y={29} size={6} />
      <Star x={146} y={27} />
      <Star x={186} y={68} size={5} />
      <Star x={309} y={25} size={6} />
      <Star x={432} y={39} size={7} />
      <Star x={547} y={93} size={5} />
      <Star x={670} y={28} size={6} />
      <Star x={716} y={97} size={7} />
      <Star x={833} y={22} size={5} />
      <g fill="#FFA500" opacity=".85">
        <circle cx="20" cy="104" r="2.5" />
        <circle cx="170" cy="49" r="2" />
        <circle cx="204" cy="22" r="2" />
        <circle cx="275" cy="104" r="2.5" />
        <circle cx="348" cy="49" r="2" />
        <circle cx="477" cy="23" r="2" />
        <circle cx="577" cy="81" r="2.5" />
        <circle cx="711" cy="57" r="2" />
        <circle cx="843" cy="117" r="2.5" />
      </g>
      <Bat x={70} y={44} scale={.75} rotate={-10} />
      <Bat x={270} y={45} scale={.9} rotate={8} />
      <Bat x={534} y={31} scale={.65} rotate={-10} />
      <Bat x={734} y={31} scale={.9} rotate={8} />
      <Bat x={826} y={45} scale={.6} rotate={-12} />

      {/* Soft hills and curly pumpkin vines give the scene a continuous ground. */}
      <path d="M0 154c75-25 129 4 210-7s115-20 200-2 124-7 204-6 153 25 246 6v35H0Z" fill="#663399" opacity=".55" />
      <path d="M0 170c89-17 122 13 205-3s115 1 203 2 124-15 206-5 158 7 246-6v22H0Z" fill="#1C1C1C" opacity=".55" />
      <g stroke="#6B8E23" strokeWidth="3" strokeLinecap="round" opacity=".9">
        <path d="M0 164c20-9 31-10 43-3 12 8 20 1 19-7-1-7-11-9-14-3" />
        <path d="M200 167c19-9 38-8 49-2 13 8 22 4 20-4-1-7-11-9-14-3" />
        <path d="M554 167c19-9 38-8 49-2 13 8 22 4 20-4-1-7-11-9-14-3" />
        <path d="M790 165c13-9 27-8 36-2 13 8 22 4 20-4-1-7-11-9-14-3" />
      </g>
      <g fill="#6B8E23" stroke="#556B2F" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M29 160c-12-1-18-8-17-16 11 0 18 5 17 16Z" />
        <path d="M234 165c1-11 7-17 16-16-1 11-7 17-16 16Z" />
        <path d="M581 164c-12-1-18-8-17-16 11 0 18 5 17 16Z" />
        <path d="M809 162c1-11 7-17 16-16-1 11-7 17-16 16Z" />
      </g>

      <Frankenstein x={67} y={48} />
      <Vampire x={176} y={48} />
      <Mushroom x={35} y={153} scale={.65} />

      <Pumpkin x={268} y={6} scale={.94} />
      <Ghost x={270} y={1} scale={.98} />
      <Mushroom x={295} y={157} scale={.7} />

      <Zombie x={589} y={60} />
      <Spider x={733} y={59} />
      <Mushroom x={821} y={158} scale={.5} />
    </svg>
  );
}
