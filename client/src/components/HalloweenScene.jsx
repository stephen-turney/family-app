import minecraftJackOLantern from '../assets/minecraft-jack-o-lantern.png';

function MinecraftJackOLantern({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="40" cy="150" rx="39" ry="6" fill="#1C1C1C" opacity=".25" />
      <image
        href={minecraftJackOLantern}
        xlinkHref={minecraftJackOLantern}
        width="80"
        height="150"
        transform="translate(80 0) scale(-1 1)"
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: 'pixelated' }}
      />
    </g>
  );
}

function GhastTentacle({ x, y, length, tilt }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <path d={`M0 0H6V${length}H0Z`} fill="#A3A3A3" />
      <path d={`m6 0 4-2v${length}l-4 2Z`} fill="#777777" />
      <path d="m0 0 4-2h6L6 0Z" fill="#C5C5C5" />
      <path d={`M0 7h3v7H0ZM3 ${length - 12}h3v8H3Z`} fill="#B8B8B8" />
      <path d={`M6 12h2v7H6ZM8 ${length - 10}h2v6H8Z`} fill="#858585" />
    </g>
  );
}

function MinecraftGhast({ x, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Keep positioning separate from the gentle floating animation. */}
      <g className="spooky-ghost">
        {/* Nine cuboid tentacles hang behind the cube's lower faces. */}
        {[
          [42, 59, 39, -8], [28, 66, 43, -12], [56, 66, 38, -22],
          [14, 73, 34, -14], [42, 73, 41, -18], [70, 73, 37, -26],
          [28, 80, 35, -10], [56, 80, 38, -22], [42, 87, 35, -16],
        ].map(([tx, ty, length, tilt], index) => (
          <GhastTentacle key={index} x={tx} y={ty} length={length} tilt={tilt} />
        ))}

        {/* Isometric, pixel-textured white cube and the reference's red face. */}
        <g transform="matrix(1 -.5 1 .5 0 21)">
          <path d="M0 0H42V42H0Z" fill="#ECECEC" />
          <path d="M0 0h12v3H0ZM18 3h12v3H18ZM36 0h6v3h-6ZM0 18h6v3H0ZM9 36h12v3H9ZM33 30h9v3h-9Z" fill="#F7F7F7" />
          <path d="M9 6h3v18H9ZM21 0h3v9h-3ZM27 15h3v18h-3ZM36 9h3v15h-3ZM18 30h3v12h-3Z" fill="#D8D6D6" />
          <path d="M12 15h6v3h-6ZM21 24h6v3h-6ZM30 33h6v3h-6Z" fill="#D4C9C9" />
        </g>
        <g transform="matrix(1 -.5 0 1 42 42)">
          <path d="M0 0H42V52H0Z" fill="#777777" />
          <path d="M0 3h3v12H0ZM12 0h9v3h-9ZM27 6h6v3h-6ZM36 21h6v12h-6ZM9 36h6v6H9ZM24 45h9v3h-9Z" fill="#828282" />
          <path d="M18 6h6v3h-6ZM33 3h6v3h-6ZM6 18h3v9H6ZM15 24h6v3h-6ZM27 30h6v3h-6ZM3 42h9v3H3ZM18 48h6v4h-6Z" fill="#6D6D6D" />
          <path d="M9 27h3v9H9ZM3 33h6v3H3ZM12 39h9v3h-9ZM30 39h6v3h-6Z" fill="#8B8B8B" />
        </g>
        <g transform="matrix(1 .5 0 1 0 21)">
          <path d="M0 0H42V52H0Z" fill="#B5B5B5" />
          <path d="M0 0h3v12H0ZM6 3h9v3H6ZM24 0h6v3h-6ZM36 6h6v12h-6ZM3 27h6v3H3ZM30 24h6v6h-6ZM12 45h6v7h-6Z" fill="#C2C2C2" />
          <path d="M9 9h6v3H9ZM27 6h6v3h-6ZM0 21h3v6H0ZM6 36h6v3H6ZM33 36h6v3h-6ZM24 48h6v4h-6Z" fill="#A3A3A3" />
          <path d="M12 21h3v9h-3ZM30 21h3v9h-3Z" fill="#A49C9C" />
          <path d="M6 15h9v3h3v6H6ZM27 15h9v3h3v6H27ZM18 30h6v3h3v15H15V33h3Z" fill="#242424" />
          <path d="M12 18h3v6h-3ZM30 18h6v6h-6ZM18 36h6v9h-6Z" fill="#C10D0D" />
          <path d="M0 45h6v3H0ZM33 45h9v3h-9Z" fill="#AAAAAA" />
        </g>
      </g>
    </g>
  );
}

function MinecraftEnderDragon({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="#08080B" strokeWidth="2" strokeLinejoin="miter">
      <ellipse cx="112" cy="180" rx="79" ry="7" fill="#1C1C1C" opacity=".25" stroke="none" />
      {/* Face into the garden, with the reference's angular wings and cube anatomy. */}
      <g transform="translate(223 0) scale(-1 1)">
        <path d="m105 75-38-41L8 5l21 50 27-3 8 23 22-7 14 24Z" fill="#111115" />
        <path d="m105 75-39-43L8 5l60 21 41 38Z" fill="#77777D" />
        <path d="M14 12 57 43 86 68M57 43l-1 9M68 35l-4 40M85 53l1 15" fill="none" stroke="#55555C" strokeWidth="4" />
        <path d="m139 76 29-43 42-28-12 53-25-6-5 23-22-5-9 23Z" fill="#08080B" />
        <path d="m133 72 31-43 46-24-37 35-32 42Z" fill="#9A9A9F" />
        <path d="M203 13 181 43 147 70M181 43l17 15M167 39l6 13M152 60l16 15" fill="none" stroke="#6F6F76" strokeWidth="4" />

        {/* The tail tapers through distinct block segments. */}
        <path d="m133 85 27 9 22 6 18-2 13-9 10-13-3 20-15 14-22 6-27-6-25-11Z" fill="#19191E" />
        <path d="m137 85 24 8 22 6 17-2 13-9 10-12" fill="none" stroke="#55555D" strokeWidth="3" />
        <path d="m157 94-2 14m24-8 2 15m18-17 5 11m9-19 6 5" fill="none" />
        <path d="m156 91 2-7 5 2-1 7m16 5 1-7 5 1-1 8m14-3 3-7 4-1-2 8" fill="#929299" strokeWidth="1" />

        {/* Four hanging cuboid legs beneath the long, faceted body. */}
        <path d="m104 94-2 24 7 12h13l-6-16 3-20m10 1 8 19 5 10h13l-7-15-4-19" fill="#111115" />
        <path d="m86 99-7 21 1 21h17l-3-20 10-19m19-3 1 23 9 17h18l-12-21-1-24" fill="#202025" />
        <path d="m86 106-6 16 2 13h6l-1-13 7-16m38 0 2 17 8 11h6l-9-15-1-13" fill="#39393F" stroke="none" />
        <path d="M80 136h17v5H80Zm53-2h18v5h-18Z" fill="#08080B" stroke="none" />
        <path d="M84 74 101 62h36l11 17-8 25H99L81 91Z" fill="#202025" />
        <path d="m84 74 17-12h36l-14 12Z" fill="#45454D" />
        <path d="M123 74h18l7 5-8 25h-17Z" fill="#111115" />
        <path d="M94 78h12v10H94Zm14 13h11v9h-11Zm23-11h8v11h-8Z" fill="#303036" stroke="none" />
        <path d="m92 67 1-11 7-3v10m15-1 1-11 7-2-1 13m13 1 2-10 6 3-2 11" fill="#929299" strokeWidth="1.5" />

        {/* Both pixel eyes sit level on one face, above the long cuboid muzzle. */}
        <path d="m57 75 27-10 17 12-19 20-27-5Z" fill="#19191E" />
        <path d="m61 75 24-9 9 7-28 11Z" fill="#45454D" />
        <path d="M23 74 35 65H79L67 74Z" fill="#393940" />
        <path d="m67 74 12-9v29l-12 9Z" fill="#08080B" />
        <path d="M23 74H67V103H23Z" fill="#151519" />
        <path d="m35 65-5-16 8-2 7 18Zm24 0 2-17 8-3-2 20Z" fill="#77777F" />
        <path d="m35 65-5-16 3-1 7 17Zm24 0 2-17 3-1-1 18Z" fill="#99999F" stroke="none" />

        <path d="m12 113 39 3 16-13-12 26H18Z" fill="#08080B" />
        <path d="m18 125 35-2 14-20v12l-12 19H18Z" fill="#29292F" />
        <path d="M7 96 23 88H67V110L51 119H7Z" fill="#111115" />
        <path d="m7 96 16-8h44l-16 8Z" fill="#303037" />
        <path d="m51 96 16-8v22l-16 9Z" fill="#08080B" />
        <path d="M12 101h6v4h-6Zm23 0h6v4h-6Z" fill="#020204" stroke="none" />
        <path d="M18 125h35v3H18Z" fill="#53535B" stroke="none" />

        <g stroke="none">
          <path d="M28 79h13v8H28ZM49 79h13v8H49Z" fill="#69277E" />
          <path d="M29 80h11v6H29ZM50 80h11v6H50Z" fill="#C15AE0" />
          <path d="M31 80h3v4h-3ZM52 80h3v4h-3Z" fill="#F0A2FF" />
        </g>
      </g>
    </g>
  );
}

function MinecraftCreeper({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#263B24" strokeWidth="2" strokeLinejoin="miter">
      <ellipse cx="54" cy="109" rx="49" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />
      <g transform="translate(117 0) scale(-1 1)">
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
      <path d="M30 92H47V99H30ZM51 92H70V99H51Z" fill="#4A5553" />
      <path d="m70 92 6-5v7l-6 5Z" fill="#303C3A" />
      <path d="M33 35H65V66H33Z" fill="#16A6A6" />
      <path d="m65 35 9-7v31l-9 7Z" fill="#0C727B" />
      <path d="M43 35h12v6H43Z" fill="#4E893C" stroke="none" />
      <path d="M21 35H33V49H21ZM65 35H77V49H65Z" fill="#16A6A6" />
      <path d="M5 43 15 36H31L21 43ZM77 43l10-7h10l-10 7Z" fill="#77B653" />
      <path d="M5 43H25V56H5ZM73 43H93V56H73Z" fill="#659C48" />
      <path d="m93 43 8-7v13l-8 7Z" fill="#467B36" />
      <path d="M31 3 40-4H72L63 3Z" fill="#77B653" />
      <path d="m63 3 9-7v32l-9 7Z" fill="#467B36" />
      <path d="M31 3H63V35H31Z" fill="#659C48" />
      <g stroke="none">
        <path d="M35 15h8v4h-8ZM51 15h8v4h-8Z" fill="#243426" />
        <path d="M43 23h12v4H43Z" fill="#354D2C" />
      </g>
    </g>
  );
}

function MinecraftSkeleton({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#42494B" strokeWidth="1.5" strokeLinejoin="miter">
      <ellipse cx="46" cy="99" rx="34" ry="6" fill="#1C1C1C" opacity=".25" stroke="none" />

      {/* Thin cuboid legs, hanging arms, and an open chest like the game model. */}
      <path d="M33 67H41V99H33ZM49 67H57V99H49Z" fill="#A3A7A6" />
      <path d="m41 67 4-3v32l-4 3Zm16 0 4-3v32l-4 3Z" fill="#798B93" />

      <path d="M42 43H49V64H42Z" fill="#949C9C" />
      <path d="m49 43 4-3v21l-4 3Z" fill="#6E7E85" />
      <path d="M22 34 26 31H33L29 34ZM61 34l4-3h7l-4 3Z" fill="#BCC0BE" />
      <path d="M22 34H29V68H22ZM61 34H68V68H61Z" fill="#A3A7A6" />
      <path d="m29 34 4-3v34l-4 3Zm39 0 4-3v34l-4 3Z" fill="#798B93" />

      <path d="M30 34 34 31H64L60 34Zm30 0 4-3v16l-4 3Z" fill="#798B93" />
      <path d="M30 34H60V50H52V54H48V50H42V54H36V50H30Z" fill="#A3A7A6" />
      <path d="M29 62 33 59H64L60 62Z" fill="#BCC0BE" />
      <path d="M29 62H60V69H29Z" fill="#A3A7A6" />
      <path d="m60 62 4-3v7l-4 3Z" fill="#798B93" />

      {/* A cube skull with rectangular eye sockets and mouth. */}
      <path d="M28 4 35 0H67L60 4Z" fill="#BCC0BE" />
      <path d="m60 4 7-4v29l-7 4Z" fill="#798B93" />
      <path d="M28 4H60V29H28Z" fill="#A3A7A6" />
      <g stroke="none">
        <path d="M32 16h8v4h-8ZM48 16h8v4h-8ZM32 24h24v5H32Z" fill="#171D1F" />
      </g>
      <path d="M28 29H60V33H28Z" fill="#A3A7A6" />
      <path d="m60 29 7-4v4l-7 4Z" fill="#798B93" />
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

      <MinecraftEnderDragon x={8} y={27} scale={.66} />
      <MinecraftCreeper x={176} y={48} />
      <Mushroom x={35} y={153} scale={.65} />

      <MinecraftJackOLantern x={312} y={17} />
      <MinecraftGhast x={451} y={37} scale={.96} />
      <Mushroom x={295} y={157} scale={.7} />

      <MinecraftZombie x={589} y={60} />
      <MinecraftSkeleton x={733} y={59} />
      <Mushroom x={821} y={158} scale={.5} />
    </svg>
  );
}
