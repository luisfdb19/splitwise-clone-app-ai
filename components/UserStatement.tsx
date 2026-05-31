'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  description: string;
  created_by: string;
  created_at?: string;
  split_with: {
    id: string;
    name: string;
    splitAmount: number;
  }[];
}

interface UserStatementProps {
  expenses: Expense[];
  currentUser: { id: string; fullName: string | null; firstName: string | null } | null | undefined;
}

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function UserStatement({ expenses, currentUser }: UserStatementProps) {
  const statement = useMemo(() => {
    if (!currentUser) return [];

    const normalizeStr = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const isMe = (nameOrId: string, userId?: string) => {
      if (userId && userId === currentUser.id) return true;
      if (nameOrId === currentUser.id) return true;
      
      const normalizedTarget = normalizeStr(nameOrId);
      if (currentUser.fullName && normalizedTarget === normalizeStr(currentUser.fullName)) return true;
      if (currentUser.firstName && normalizedTarget.includes(normalizeStr(currentUser.firstName))) return true;
      
      return false;
    };

    // Sort expenses chronologically (oldest first)
    const sortedExpenses = [...expenses].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });

    let runningBalance = 0;
    
    return sortedExpenses.map(expense => {
      // Creator gets credited for the sum of all splits (because split_percentage might be < 100%)
      const creatorSplit = expense.split_with.reduce((sum, member) => sum + member.splitAmount, 0);
      const amountCredited = isMe(expense.created_by) ? creatorSplit : 0;
      
      // User owes the sum of their split amounts
      const amountOwed = expense.split_with.reduce((sum, member) => {
        return sum + (isMe(member.name, member.id) ? member.splitAmount : 0);
      }, 0);
      
      const netImpact = amountCredited - amountOwed;
      runningBalance += netImpact;

      return {
        ...expense,
        netImpact,
        runningBalance
      };
    }).filter(item => Math.abs(item.netImpact) > 0.005).reverse(); // Remove 0 impact and reverse to show newest first
  }, [expenses, currentUser]);

  if (statement.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma movimentação encontrada para você neste grupo.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 shadow-sm mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">Seu Saldo Atual</p>
          <p className={`text-2xl font-bold ${statement[0].runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {statement[0].runningBalance >= 0 ? '+' : '-'} R$ {formatAmount(statement[0].runningBalance)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">
            {statement[0].runningBalance >= 0 ? 'Você tem a receber' : 'Você deve no total'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {statement.map((item) => {
          const isPositive = item.netImpact >= 0;
          return (
            <Card key={item.id} className="shadow-sm border-0 ring-1 ring-gray-200 overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-1">{item.description}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(item.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-sm sm:text-base font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : '-'} R$ {formatAmount(item.netImpact)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 font-medium">
                      Saldo: R$ {formatAmount(item.runningBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
