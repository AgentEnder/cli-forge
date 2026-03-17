/**
 * Ambient background effects for the Blacksmith's Forge theme.
 *
 * - Rising ember particles (subtle orange dots drifting upward)
 * - Metal grain texture (SVG noise at very low opacity)
 * - Forge glow (radial gradient from below, as if a furnace burns out of frame)
 *
 * All animations respect prefers-reduced-motion.
 */
export function ForgeBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
      {/* Forge glow from below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[50vh]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,100,20,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Secondary glow */}
      <div
        className="absolute bottom-0 left-0 w-[40vw] h-[30vh]"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 100%, rgba(200,60,10,0.04) 0%, transparent 60%)',
        }}
      />

      {/* Metal grain texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Rising embers */}
      {EMBERS.map((ember, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: ember.left,
            bottom: 0,
            width: ember.size,
            height: ember.size,
            background:
              'radial-gradient(circle, #ffaa44 0%, #ff6600 40%, transparent 70%)',
            animation: `ember-rise ${ember.duration}s linear infinite`,
            animationDelay: `${ember.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

const EMBERS = [
  { left: '5%', size: 3, duration: 8, delay: 0 },
  { left: '18%', size: 2, duration: 10, delay: 2.5 },
  { left: '35%', size: 4, duration: 7, delay: 1 },
  { left: '48%', size: 2, duration: 9, delay: 3.5 },
  { left: '62%', size: 3, duration: 8.5, delay: 0.5 },
  { left: '78%', size: 2, duration: 11, delay: 4 },
  { left: '90%', size: 3, duration: 7.5, delay: 1.5 },
];
