import harvestSprites from '../assets/thanksgiving/thanksgiving-sprites.png';

// Keep the generated art intact and show one cell of its transparent 3×3 sheet.
const POSITIONS = {
  turkey: '0% 0%', pumpkin: '50% 0%', pie: '100% 0%',
  leaves: '0% 50%', corn: '50% 50%', basket: '100% 50%',
  acorn: '0% 100%', cranberries: '50% 100%', cornucopia: '100% 100%',
};

export default function ThanksgivingSprite({ name = 'pumpkin', className = '' }) {
  return (
    <span
      className={`thanksgiving-sprite ${className}`}
      aria-hidden="true"
      style={{ backgroundImage: `url(${harvestSprites})`, backgroundPosition: POSITIONS[name] || POSITIONS.pumpkin }}
    />
  );
}
