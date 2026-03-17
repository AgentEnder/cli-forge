import './tailwind.css';
import { applyBaseUrl } from '../utils/base-url';

export function Head() {
  return (
    <>
      <link rel="icon" type="image/svg+xml" href={applyBaseUrl('/logo.svg')} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </>
  );
}
