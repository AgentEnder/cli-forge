/**
 * Fixed viewport background layers (behind content):
 * 1. Paper texture (subtle noise grain)
 *
 * Note: The grid pattern is applied via `bp-grid` on the content wrapper
 * in +Layout.tsx so it scrolls with page content. The base paper color
 * comes from the `html` element in tailwind.css.
 */
export function BlueprintBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      {/* Paper texture (subtle noise) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />
    </div>
  );
}
