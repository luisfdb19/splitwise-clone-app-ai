'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import { getGroupData, deleteExpense, updateExpense } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupMembers from '@/components/GroupMembers';
import GroupSettings from '@/components/GroupSettings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  split_percentage?: number;
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

  // State for editing expense
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editSplitPercentage, setEditSplitPercentage] = useState<string>('');
  const [editSplitWith, setEditSplitWith] = useState<{ id: string; name: string }[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  // Fetch organization members to allow selection on editing split
  useEffect(() => {
    async function fetchOrgMembers() {
      if (organization) {
        try {
          const memberships = await organization.getMemberships();
          const membersList = memberships.data.map((m) => ({
            id: m.publicUserData.userId ?? '',
            name: `${m.publicUserData.firstName ?? ''} ${
              m.publicUserData.lastName ?? ''
            }`.trim(),
          }));
          setMembers(membersList);
        } catch (err) {
          console.error('Error fetching memberships:', err);
        }
      }
    }
    if (orgLoaded && organization) {
      fetchOrgMembers();
    }
  }, [organization, orgLoaded]);

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

  const getGroupedExpenses = (expensesList: Expense[]) => {
    const groupsMap = new Map<string, Expense[]>();
    expensesList.forEach((expense) => {
      const date = expense.created_at
        ? new Date(expense.created_at).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Sem data';
      if (!groupsMap.has(date)) {
        groupsMap.set(date, []);
      }
      groupsMap.get(date)!.push(expense);
    });

    const grouped: { date: string; items: Expense[] }[] = [];
    groupsMap.forEach((items, date) => {
      grouped.push({ date, items });
    });
    return grouped;
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

  const handleSaveEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    if (!editAmount || !editDescription || !editSplitPercentage || editSplitWith.length === 0) {
      toast({
        title: 'Error 🚨',
        description: 'Please fill in all fields and select at least one member to split with.',
        variant: 'destructive',
      });
      return;
    }

    const result = await updateExpense(editingExpense.id, {
      amount: parseFloat(editAmount),
      description: editDescription,
      splitPercentage: parseFloat(editSplitPercentage),
      splitWith: editSplitWith,
    });

    if (result.success) {
      toast({
        title: 'Expense Updated! 🎉',
        description: 'Your changes have been successfully saved.',
      });
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      // Refresh data
      const { expenses: updatedExpenses, balances: updatedBalances } =
        await getGroupData(id as string, user?.id || '', user?.fullName || 'You');
      setExpenses(updatedExpenses);
      setBalances(updatedBalances);
      router.refresh();
    } else {
      toast({
        title: 'Error 🚨',
        description: 'Failed to update expense. Please try again.',
        variant: 'destructive',
      });
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
            <h2 className="text-2xl font-semibold mb-6">Expenses</h2>
            {expenses.length > 0 ? (
              getGroupedExpenses(expenses).map((group) => (
                <div key={group.date} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                      {group.date}
                    </span>
                    <div className="h-px bg-gray-100 flex-grow" />
                  </div>
                  <div className="space-y-4">
                    {group.items.map((expense) => (
                      <Card key={expense.id} className="hover:shadow-md transition-shadow">
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
                                ${formatAmount(expense.amount)} · {expense.split_with.map((s) => s.name).join(', ')}
                              </p>
                              <p className="text-xs text-gray-500">
                                Split type: Percentage{' '}
                                {(
                                  (expense.split_with[0]?.splitAmount / expense.amount) *
                                  100
                                ).toFixed(2)}
                                %
                              </p>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-3">
                              <Pencil
                                className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                                size={20}
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setEditAmount(expense.amount.toString());
                                  setEditDescription(expense.description);
                                  setEditSplitPercentage(expense.split_percentage ? expense.split_percentage.toString() : '50');
                                  setEditSplitWith(expense.split_with.map((m) => ({ id: m.id, name: m.name })));
                                  setIsEditDialogOpen(true);
                                }}
                              />
                              <Trash2
                                className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
                                size={20}
                                onClick={() => handleDeleteExpense(expense.id)}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
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

      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update details for this expense and adjust the split.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditExpense} className="space-y-4">
            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="What did you pay for?"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-splitPercentage">Split Percentage</Label>
              <Input
                id="edit-splitPercentage"
                type="number"
                placeholder="Enter percentage to split"
                value={editSplitPercentage}
                onChange={(e) => setEditSplitPercentage(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Split with</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                {members.map((member) => {
                  const isChecked = editSplitWith.some((m) => m.id === member.id);
                  return (
                    <div key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-member-${member.id}`}
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setEditSplitWith(editSplitWith.filter((m) => m.id !== member.id));
                          } else {
                            setEditSplitWith([...editSplitWith, member]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`edit-member-${member.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {member.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GroupPage;
