'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardCheck, BarChart3, Shield, Map } from 'lucide-react';

const navItems = [
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/review', label: 'Review', icon: ClipboardCheck },
  { href: '/official-practice', label: 'Official', icon: Shield },
  { href: '/service-guide', label: 'Guide', icon: Map },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline">
                <span className="font-semibold text-gray-900 text-sm md:text-base leading-tight">AWS GenAI</span>
                <span className="text-gray-500 text-xs md:text-sm md:ml-2 leading-tight">AIP-C01</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-around px-1 py-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-0 ${
                  isActive
                    ? 'text-orange-600'
                    : 'text-gray-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
