'use client';

import React from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/groups', label: 'Grupos', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation - top bar */}
      <nav className="hidden sm:flex justify-between items-center p-4 bg-gray-100">
        <Link href="/" className="flex items-center space-x-2">
          <img
            src="/mixi.png"
            alt="Mixiwise Logo"
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="font-bold text-xl" style={{ color: '#6200EA' }}>
            Mixiwise
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base hover:text-gray-900 hover:underline transition-colors ${
                isActive(item.href) ? 'text-purple-600 font-semibold' : 'text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <UserButton />
        </div>
      </nav>

      {/* Mobile Navigation - top bar (simplified) */}
      <nav className="flex sm:hidden justify-between items-center px-4 py-3 bg-gray-100 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <img
            src="/mixi.png"
            alt="Mixiwise Logo"
            className="h-7 w-7 rounded-full object-cover"
          />
          <span className="font-bold text-lg" style={{ color: '#6200EA' }}>
            Mixiwise
          </span>
        </Link>
        <UserButton />
      </nav>

      {/* Mobile Navigation - bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-lg transition-colors ${
                  active
                    ? 'text-purple-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area padding for iPhones with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
