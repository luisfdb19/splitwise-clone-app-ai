import React from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-100 gap-4 sm:gap-0">
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

      <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-6">
        {/* Added new link for 'Your Groups' */}
        <Link
          href="/groups"
          className="text-sm sm:text-base text-gray-700 hover:text-gray-900 hover:underline"
        >
          Your Groups
        </Link>
        <Link
          href="/group"
          className="text-sm sm:text-base text-gray-700 hover:text-gray-900 hover:underline"
        >
          Create Group
        </Link>
        <Link
          href="/expense"
          className="text-sm sm:text-base text-gray-700 hover:text-gray-900 hover:underline"
        >
          Add Expense
        </Link>
        <Link
          href="/import"
          className="text-sm sm:text-base text-gray-700 hover:text-gray-900 hover:underline"
        >
          Importar
        </Link>
        <UserButton />
      </div>
    </nav>
  );
}
