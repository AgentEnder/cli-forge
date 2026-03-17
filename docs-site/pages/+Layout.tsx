import { SiGithub } from '@icons-pack/react-simple-icons';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { ForgeBackground } from '../components/ForgeBackground';
import { Link } from '../components/Link';
import { PagefindSearch } from '../components/PagefindSearch';
import type { NavigationItem } from '../server/utils/docs';
import { applyBaseUrl } from '../utils/base-url';

const GITHUB_URL = 'https://github.com/agentender/cli-forge';

const NAV_LINKS = [
  { label: 'Docs', href: '/docs' },
  { label: 'Examples', href: '/examples' },
  { label: 'API', href: '/api' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const pathname = pageContext.urlPathname;
  const navigation: NavigationItem[] =
    (pageContext as unknown as Record<string, unknown>).navigation as NavigationItem[] ?? [];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLandingPage = pathname === '/' || pathname === '';
  const showSidebar = !isLandingPage && navigation.length > 0;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-forge-bg text-forge-smoke relative">
      <ForgeBackground />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-forge-bg/95 backdrop-blur-sm border-b border-forge-iron-light relative">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <img
                src={applyBaseUrl('/logo.svg')}
                alt="CLI Forge"
                className="w-6 h-6"
              />
              <span className="text-sm font-semibold tracking-wider text-forge-flame-bright font-[Cinzel]">
                CLI Forge
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  active={pathname.startsWith(link.href)}
                  className="relative text-xs font-medium tracking-wider uppercase"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <PagefindSearch />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forge-ash hover:text-forge-flame-bright transition-colors"
              aria-label="GitHub"
            >
              <SiGithub size={18} />
            </a>
            <button
              className="md:hidden text-forge-ash hover:text-forge-flame-bright transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-14 left-0 right-0 bg-forge-bg border-b border-forge-iron-light max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="px-4 py-3 border-b border-forge-iron">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  active={pathname.startsWith(link.href)}
                  className="relative block py-2 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {navigation.length > 0 && (
              <div className="px-4 py-3">
                <SidebarContent navigation={navigation} pathname={pathname} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-screen-2xl mx-auto flex relative z-10">
        {/* Desktop sidebar */}
        {showSidebar && (
          <aside className="hidden md:block w-60 shrink-0 border-r border-forge-iron sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
            <SidebarContent navigation={navigation} pathname={pathname} />
          </aside>
        )}

        {/* Main content */}
        <main className={`flex-1 min-w-0 p-6 md:p-8 ${showSidebar ? '' : 'max-w-screen-xl mx-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navigation,
  pathname,
}: {
  navigation: NavigationItem[];
  pathname: string;
}) {
  return (
    <nav className="space-y-1">
      {navigation.map((section) => (
        <SidebarSection key={section.title} item={section} pathname={pathname} />
      ))}
    </nav>
  );
}

function SidebarSection({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path ? pathname === item.path || pathname.startsWith(item.path + '/') : false;
  const hasActiveChild = item.children?.some(
    (child) => child.path && (pathname === child.path || pathname.startsWith(child.path + '/'))
  );

  const [open, setOpen] = useState(isActive || !!hasActiveChild);

  if (!hasChildren) {
    return (
      <Link
        href={item.path ?? '#'}
        active={isActive}
        className="block py-1.5 px-2 text-sm rounded hover:bg-forge-bg-surface transition-colors"
      >
        {item.title}
      </Link>
    );
  }

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-forge-ash-dim hover:text-forge-ash transition-colors rounded hover:bg-forge-bg-surface/50"
      >
        <span>{item.title}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="ml-2 mt-0.5 border-l border-forge-iron pl-2 space-y-0.5">
          {item.children!.map((child) => {
            const childActive = child.path
              ? pathname === child.path || pathname.startsWith(child.path + '/')
              : false;
            return (
              <Link
                key={child.path ?? child.title}
                href={child.path ?? '#'}
                active={childActive}
                className="block py-1 px-2 text-sm rounded hover:bg-forge-bg-surface transition-colors"
              >
                {child.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
