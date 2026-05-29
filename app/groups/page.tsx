'use client';

import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useOrganizationList, useUser } from '@clerk/nextjs';

type Group = {
  id: string;
  name: string;
  role: string;
  initials: string;
};

const GroupItem = ({
  name,
  role,
  initials,
  id,
}: {
  name: string;
  role: string;
  initials: string;
  id: string;
}) => (
  <Link href={`/group/${id}`}>
    <div className="flex items-center p-3 sm:p-4 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 hover:ring-purple-200 hover:shadow-md transition-all group">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-sm">
        {initials}
      </div>
      <div className="flex-grow ml-3 sm:ml-4 min-w-0">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{name}</h3>
        <p className="text-gray-400 text-xs mt-0.5">
          {role === 'org:admin' ? 'Administrador' : 'Membro'}
        </p>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
    </div>
  </Link>
);

const YourGroups = () => {
  const [groups, setGroups] = useState<Array<Group>>([]);
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: true,
  });
  const { user } = useUser();

  useEffect(() => {
    if (isLoaded && userMemberships.data) {
      const userGroups = userMemberships.data.map((membership) => {
        const name = membership.organization.name;
        const role = membership.role;
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase();
        return {
          id: membership.organization.id,
          name,
          role,
          initials,
        };
      });
      setGroups(userGroups);
    }
  }, [isLoaded, userMemberships.data]);

  if (!isLoaded || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seus Grupos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie seus grupos e veja suas despesas compartilhadas.
        </p>
      </div>

      <div className="space-y-2.5">
        {groups.map((group, index) => (
          <GroupItem key={index} {...group} id={group.id} />
        ))}
      </div>

      <Link href="/group" className="block mt-6">
        <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center py-3 rounded-xl shadow-sm font-semibold text-sm gap-2">
          <Plus className="w-4 h-4" />
          Criar Novo Grupo
        </Button>
      </Link>
    </div>
  );
};

export default YourGroups;
