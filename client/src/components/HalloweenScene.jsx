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

function MinecraftCreeper({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#263B24" strokeWidth="2" strokeLinejoin="miter">
      <ellipse cx="54" cy="109" rx="49" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      {/* Four cuboid feet, a narrow body, and the creeper's stepped face. */}
      <path d="M28 80 40 70H60V91L48 101H28ZM58 80 70 70H90V91L78 101H58Z" fill="#438C36" />
      <path d="M39 48H61V88H39Z" fill="#70BC48" />
      <path d="m61 48 12-10v40L61 88Z" fill="#438C36" />
      <g stroke="none">
        <path d="M39 55h7v8h-7ZM52 49h9v7h-9ZM48 68h8v8h-8ZM39 79h7v9h-7Z" fill="#97D367" />
        <path d="M46 59h7v9h-7ZM56 77h5v8h-5ZM65 50h5v11h-5Z" fill="#4D983A" />
      </g>
      <path d="M27 87H49v22H27ZM55 87H77v22H55Z" fill="#70BC48" />
      <path d="m49 87 10-8v22l-10 8Zm28 0 10-8v22l-10 8Z" fill="#438C36" />
      <path d="M27 102h22v7H27ZM55 102h22v7H55Z" fill="#355B30" stroke="none" />
      <path d="M31 89h7v7h-7ZM61 94h8v8h-8Z" fill="#97D367" stroke="none" />
      <path d="M30 10 42 0H82L70 10Z" fill="#97D367" />
      <path d="m70 10 12-10v40L70 50Z" fill="#438C36" />
      <path d="M30 10H70V50H30Z" fill="#70BC48" />
      <g stroke="none">
        <path d="M30 10h10v5H30ZM50 10h10v5H50ZM30 30h5v10h-5ZM65 35h5v10h-5Z" fill="#97D367" />
        <path d="M40 15h5v5h-5ZM60 15h10v5H60ZM30 45h10v5H30ZM75 10h5v10h-5ZM72 30h5v5h-5Z" fill="#4D983A" />
        <path d="M35 20H45V30H35ZM55 20H65V30H55ZM45 30h10v5h5v15h-5v-5H45v5h-5V35h5Z" fill="#17251A" />
      </g>
    </g>
  );
}

function MinecraftZombie({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#263B32" strokeWidth="2" strokeLinejoin="miter">
      <ellipse cx="49" cy="99" rx="46" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      {/* The classic green cube head, teal shirt, and purple trousers. */}
      <path d="M33 64H47V96H33ZM51 64H65V96H51Z" fill="#6550A1" />
      <path d="m65 64 9-7v32l-9 7Z" fill="#463777" />
      <path d="M33 80h6v12h-6ZM57 69h8v7h-8Z" fill="#7B66B5" stroke="none" />
      <path d="M30 92H47V99H30ZM51 92H70V99H51Z" fill="#4A5553" />
      <path d="m70 92 6-5v7l-6 5Z" fill="#303C3A" />
      <path d="M33 35H65V66H33Z" fill="#16A6A6" />
      <path d="m65 35 9-7v31l-9 7Z" fill="#0C727B" />
      <path d="M37 40h6v19h-6ZM51 59h14v7H51Z" fill="#28B9B4" stroke="none" />
      <path d="M43 35h12v6H43Z" fill="#4E893C" stroke="none" />
      <path d="M21 35H33V49H21ZM65 35H77V49H65Z" fill="#16A6A6" />
      <path d="M5 43 15 36H31L21 43ZM77 43l10-7h10l-10 7Z" fill="#77B653" />
      <path d="M5 43H25V56H5ZM73 43H93V56H73Z" fill="#659C48" />
      <path d="m93 43 8-7v13l-8 7Z" fill="#467B36" />
      <path d="M9 47h8v4H9ZM77 50h8v6h-8Z" fill="#77B653" stroke="none" />
      <path d="M31 3 40-4H72L63 3Z" fill="#77B653" />
      <path d="m63 3 9-7v32l-9 7Z" fill="#467B36" />
      <path d="M31 3H63V35H31Z" fill="#659C48" />
      <g stroke="none">
        <path d="M31 3h12v4H31ZM55 3h8v8h-8ZM31 23h4v8h-4ZM51 31h12v4H51Z" fill="#77B653" />
        <path d="M43 7h8v4h-8ZM35 11h4v4h-4ZM59 19h4v8h-4Z" fill="#4E893C" />
        <path d="M35 15h8v4h-8ZM51 15h8v4h-8Z" fill="#243426" />
        <path d="M43 23h12v4H43Z" fill="#354D2C" />
        <path d="M43 19h4v4h-4Z" fill="#83B65A" />
      </g>
    </g>
  );
}

function Skeleton({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#2F2F2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="46" cy="99" rx="34" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      {/* A friendly waving skeleton with a visible spine and rib cage. */}
      <path d="M46 32v36M31 41 20 55 10 42M61 41 73 54 82 38M39 73 34 85 30 96M53 73 58 85 62 96" fill="none" strokeWidth="8" />
      <path d="M46 32v36M31 41 20 55 10 42M61 41 73 54 82 38M39 73 34 85 30 96M53 73 58 85 62 96" fill="none" stroke="#F4EEDC" strokeWidth="5" />
      <path d="M31 41c8-5 22-5 30 0" fill="none" stroke="#F4EEDC" strokeWidth="5" />
      <g fill="none" stroke="#F4EEDC" strokeWidth="4">
        <path d="M33 46c2 4 8 5 13 4 5 1 11 0 13-4" />
        <path d="M33 53c3 4 8 5 13 4 5 1 10 0 13-4" />
        <path d="M36 60c3 3 7 4 10 3 3 1 7 0 10-3" />
      </g>
      <path d="M33 66c8 3 18 3 26 0l-3 10-10-4-10 4Z" fill="#F4EEDC" />
      <g fill="#F4EEDC">
        <circle cx="20" cy="55" r="3.5" />
        <circle cx="73" cy="54" r="3.5" />
        <circle cx="34" cy="85" r="3.5" />
        <circle cx="58" cy="85" r="3.5" />
        <path d="M30 94c-6 0-9 2-10 5h13l1-4M62 94c6 0 9 2 10 5H59l-1-4" />
        <path d="m9 43-5-5 2-3 4 3-2-8 3-1 3 10 2-4 3 2-5 8ZM80 39l-2-7 3-1 2 4 1-9 3 1-1 9 3-4 3 2-7 8Z" />
      </g>
      <path d="M27 16C27 5 35 0 46 0S65 5 65 16c0 8-4 12-9 14v5H36v-5c-5-2-9-6-9-14Z" fill="#F4EEDC" />
      <path d="M32 12c1-5 5-8 10-8" fill="none" stroke="#FFFFFF" strokeWidth="3" />
      <ellipse cx="37" cy="18" rx="5" ry="6" fill="#2F2F2F" stroke="none" />
      <ellipse cx="55" cy="18" rx="5" ry="6" fill="#2F2F2F" stroke="none" />
      <path d="m46 24-3 4h6Z" fill="#2F2F2F" stroke="none" />
      <path d="M37 31h18m-12 0v4m6-4v4" fill="none" strokeWidth="1.5" />
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
      <MinecraftCreeper x={176} y={48} />
      <Mushroom x={35} y={153} scale={.65} />

      <Pumpkin x={268} y={6} scale={.94} />
      <Ghost x={270} y={1} scale={.98} />
      <Mushroom x={295} y={157} scale={.7} />

      <MinecraftZombie x={589} y={60} />
      <Skeleton x={733} y={59} />
      <Mushroom x={821} y={158} scale={.5} />
    </svg>
  );
}
