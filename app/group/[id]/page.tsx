'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import { getGroupData, deleteExpense } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupMembers from '@/components/GroupMembers';
import GroupSettings from '@/components/GroupSettings';

// Define interfaces for Balance and Expense
interface Balance {
  debtor: string;
  creditor: string;
  amount: number;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  created_by: string;
  split_with: {
    id: string;
    name: string;
    splitAmount: number;
  }[];
  created_at?: string;
}

// Add this utility function at the top of the file, outside the component
const formatAmount = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toFixed(2);
};

function GroupPage() {
  const { id } = useParams();
  const { setActive } = useOrganizationList();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgReady, setOrgReady] = useState(false);
  const { toast } = useToast();

  // Set the active organization based on the URL id
  useEffect(() => {
    if (setActive && id) {
      setActive({ organization: id as string }).then(() => {
        setOrgReady(true);
      }).catch((err) => {
        console.error('Error setting active organization:', err);
        setOrgReady(true); // still mark ready so we can show error
      });
    }
  }, [setActive, id]);

  useEffect(() => {
    async function fetchData() {
      if (id && user) {
        const { expenses, balances } = await getGroupData(
          id as string,
          user.id,
          user.fullName || 'You'
        );
        setExpenses(expenses);
        setBalances(balances);
        setLoading(false);
      }
    }
    if (userLoaded && orgReady) {
      fetchData();
    }
  }, [id, user, userLoaded, orgReady]);

  if (!orgLoaded || !userLoaded || loading || !orgReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Check admin role from the active membership
  const isAdmin = membership?.role === 'org:admin';

  const groupDescription =
    "View and manage the details of your group. You can see the group's name, balances, and expenses. As an admin, you can also manage members and settings.";

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Error 🚨',
        description: 'Only admins can delete expenses. 🚫',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this expense?'
    );
    if (confirmed) {
      const result = await deleteExpense(expenseId);
      if (result.success) {
        // Refresh the page data
        const { expenses: updatedExpenses, balances: updatedBalances } =
          await getGroupData(id as string, user?.id || '', user?.fullName || 'You');
        setExpenses(updatedExpenses);
        setBalances(updatedBalances);
        router.refresh(); // Refresh the page to update any server-side rendered content
      } else {
        toast({ title: 'Failed to delete expense. Please try again.' });
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
            {getInitials(organization.name)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            <p className="text-sm text-gray-500">{(organization as unknown as { membersCount: number }).membersCount} members</p>
          </div>
        </div>

        <Link href="/groups">
          <Button className="bg-purple-600 text-white px-4 py-2 rounded-md">
            All Groups
          </Button>
        </Link>
      </div>

      <p className="text-gray-600 mb-8">{groupDescription}</p>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Balances</h2>
            {balances.length > 0 ? (
              balances.map((balance, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="flex items-center p-6">
                    <div
                      className={`h-10 w-10 ${getRandomColor()} rounded-full mr-4 flex items-center justify-center text-white font-semibold flex-shrink-0`}
                    >
                      {getInitials(balance.debtor)}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {balance.debtor} owes {balance.creditor}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        ${formatAmount(balance.amount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-600">
                🌟 No outstanding balances. Everyone&apos;s all squared up! 🎉
              </p>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Expenses</h2>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <Card key={expense.id} className="mb-4">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center">
                      <div
                        className={`h-10 w-10 ${getRandomColor()} rounded-full mr-4 flex items-center justify-center text-white font-semibold`}
                      >
                        {getInitials(expense.description)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{expense.description}</h3>
                        <p className="text-sm text-gray-600">
                          ${formatAmount(expense.amount)} ·
                          {expense.split_with.map((s) => s.name).join(', ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Split type: Percentage{' '}
                          {(
                            (expense.split_with[0]?.splitAmount / expense.amount) *
                            100
                          ).toFixed(2)}
                          %
                        </p>
                        {expense.created_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(expense.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Trash2
                        className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
                        size={20}
                        onClick={() => handleDeleteExpense(expense.id)}
                      />
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-600">
                💸 No expenses yet. Time to split some bills! 🧾
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <GroupMembers isAdmin={isAdmin} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <GroupSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default GroupPage;
