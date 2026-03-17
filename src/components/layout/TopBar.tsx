'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FlaskConical, ClipboardCheck } from 'lucide-react';

const navItems = [
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/labs', label: 'Labs', icon: FlaskConical },
  { href: '/review', label: 'Review', icon: ClipboardCheck },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">AWS GenAI</span>
              <span className="text-gray-500 text-sm ml-2">AIP-C01</span>
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
  );
}
