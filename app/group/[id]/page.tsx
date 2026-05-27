'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Paperclip, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
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
import SettleUpDialog from '@/components/SettleUpDialog';
import AddExpenseDialog from '@/components/AddExpenseDialog';

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
  created_by_name?: string;
  split_with: {
    id: string;
    name: string;
    splitAmount: number;
  }[];
  created_at?: string;
  receipt_data?: string;
  receipt_type?: string;
}

const formatAmount = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toFixed(2);
};

export default function GroupPage() {
  const { id } = useParams();
  const { setActive } = useOrganizationList();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgReady, setOrgReady] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{data: string, type: string} | null>(null);
  const { toast } = useToast();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  // Fetch organization members to pass to AddExpenseDialog
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

  useEffect(() => {
    if (setActive && id) {
      setActive({ organization: id as string }).then(() => {
        setOrgReady(true);
      }).catch((err) => {
        console.error('Error setting active organization:', err);
        setOrgReady(true);
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

  const isAdmin = membership?.role === 'org:admin';

  const getInitials = (name: string): string => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (idStr: string): string => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-teal-500', 'bg-indigo-500'];
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) hash += idStr.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      const result = await deleteExpense(expenseId);
      if (result.success) {
        const { expenses: updatedExpenses, balances: updatedBalances } =
          await getGroupData(id as string, user?.id || '', user?.fullName || 'You');
        setExpenses(updatedExpenses);
        setBalances(updatedBalances);
        router.refresh();
      } else {
        toast({ title: 'Error', description: 'Failed to delete.' });
      }
    }
  };

  const isMe = (nameOrId: string) => {
    if (!user) return false;
    return nameOrId === user.id || 
           nameOrId === user.fullName || 
           (user.firstName && nameOrId.toLowerCase().includes(user.firstName.toLowerCase()));
  };

  const shortName = (name: string) => {
    if (isMe(name)) return 'você';
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0]} ${parts[parts.length-1][0]}.`;
    return name;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-md">
            {getInitials(organization.name)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-sm text-gray-500">{(organization as unknown as { membersCount: number }).membersCount} members</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            className="bg-teal-500 hover:bg-teal-600 text-white shadow-sm font-semibold gap-1.5"
            onClick={() => setIsAddExpenseOpen(true)}
          >
            Adicionar despesa
          </Button>
          <SettleUpDialog balances={balances} groupId={id as string} />
          <Link href="/groups">
            <Button variant="outline" className="bg-white">All Groups</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-white border shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Balances</h2>
            {balances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {balances.map((balance, index) => {
                  const amIDebtor = isMe(balance.debtor);
                  const amICreditor = isMe(balance.creditor);
                  
                  let text = '';
                  let amountClass = 'text-gray-900';
                  
                  if (amIDebtor) {
                    text = `você deve a ${shortName(balance.creditor)}`;
                    amountClass = 'text-red-500';
                  } else if (amICreditor) {
                    text = `${shortName(balance.debtor)} deve a você`;
                    amountClass = 'text-green-500';
                  } else {
                    text = `${shortName(balance.debtor)} deve a ${shortName(balance.creditor)}`;
                  }

                  return (
                    <Card key={index} className="shadow-sm border-0 ring-1 ring-gray-200">
                      <CardContent className="flex items-center p-4">
                        <div className={`h-12 w-12 ${getRandomColor(balance.debtor)} rounded-full mr-4 flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                          {getInitials(balance.debtor)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{text}</p>
                          <p className={`text-xl font-bold ${amountClass}`}>
                            R${formatAmount(balance.amount)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">🌟 Tudo zerado! Ninguém deve nada. 🎉</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Expenses</h2>
            {expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.map((expense) => {
                  const creatorIsMe = isMe(expense.created_by);
                  const creatorStr = shortName(expense.created_by_name || expense.created_by);
                  const isPayment = expense.description.toLowerCase().includes('pagou') || expense.description.toLowerCase().includes('payment') || expense.description.toLowerCase().includes('pagamento');
                  
                  // For a payment, the layout is slightly different
                  let lentText = '';
                  let lentAmount = '';
                  let lentClass = 'text-gray-500';
                  
                  if (!isPayment && expense.split_with.length > 0) {
                    const firstSplit = expense.split_with[0];
                    const splitIsMe = isMe(firstSplit.id) || isMe(firstSplit.name);
                    
                    if (creatorIsMe) {
                      lentText = `você emprestou a ${shortName(firstSplit.name)}`;
                      lentAmount = `R$${formatAmount(firstSplit.splitAmount)}`;
                      lentClass = 'text-green-500 font-medium';
                    } else if (splitIsMe) {
                      lentText = `${creatorStr} emprestou a você`;
                      lentAmount = `R$${formatAmount(firstSplit.splitAmount)}`;
                      lentClass = 'text-red-500 font-medium';
                    } else {
                      lentText = `${creatorStr} emprestou a ${shortName(firstSplit.name)}`;
                      lentAmount = `R$${formatAmount(firstSplit.splitAmount)}`;
                    }
                  } else if (isPayment) {
                    lentText = 'Pagamento';
                    lentAmount = `R$${formatAmount(expense.amount)}`;
                    lentClass = 'text-green-500 font-medium';
                  }

                  return (
                    <Card 
                      key={expense.id} 
                      className="shadow-sm hover:bg-gray-100 transition-colors border-0 ring-1 ring-gray-200 cursor-pointer"
                      onClick={() => {
                        setEditingExpense(expense);
                        setIsAddExpenseOpen(true);
                      }}
                    >
                      <CardContent className="flex items-center justify-between p-4 py-3">
                        <div className="flex items-center flex-grow">
                          <div className="flex flex-col items-center justify-center mr-4 w-12 flex-shrink-0 text-center">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              {expense.created_at ? new Date(expense.created_at).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : 'Mês'}
                            </span>
                            <span className="text-xl font-bold text-gray-700">
                              {expense.created_at ? new Date(expense.created_at).getDate() : '--'}
                            </span>
                          </div>
                          
                          <div className={`h-10 w-10 ${isPayment ? 'bg-teal-500' : getRandomColor(expense.description)} rounded-full mr-4 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm`}>
                            {getInitials(expense.description)}
                          </div>
                          
                          <div className="flex-grow min-w-0 pr-4">
                            <h3 className="font-semibold text-gray-900 truncate">{expense.description}</h3>
                            <div className="flex flex-col sm:flex-row sm:gap-6 mt-1">
                              <div className="text-xs">
                                <span className="text-gray-500">{creatorIsMe ? 'você' : creatorStr} pagou </span>
                                <span className="font-medium text-gray-900">R${formatAmount(expense.amount)}</span>
                              </div>
                              {lentText && (
                                <div className="text-xs">
                                  <span className="text-gray-500">{lentText} </span>
                                  <span className={lentClass}>{lentAmount}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {expense.receipt_data && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-teal-600 hover:bg-teal-50 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReceipt({ data: expense.receipt_data!, type: expense.receipt_type || 'image/jpeg' });
                              }}
                            >
                              <Paperclip size={18} />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExpense(expense.id);
                            }}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">💸 Nenhuma despesa ainda. Hora de rachar a conta! 🧾</p>
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

      <AddExpenseDialog
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        groupId={id as string}
        members={members}
        currentUser={user ? { id: user.id, fullName: user.fullName, firstName: user.firstName } : null}
        expenseToEdit={editingExpense}
        onSuccess={async () => {
          if (id && user) {
            const { expenses: updatedExpenses, balances: updatedBalances } = await getGroupData(
              id as string,
              user.id,
              user.fullName || 'You'
            );
            setExpenses(updatedExpenses);
            setBalances(updatedBalances);
            router.refresh();
          }
        }}
      />

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 rounded-xl shadow-2xl bg-white">
          <DialogHeader className="bg-gray-100 p-4 flex flex-row items-center justify-between space-y-0 border-b">
            <DialogTitle className="text-xl font-bold text-gray-800">Recibo</DialogTitle>
            <DialogClose asChild>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </DialogClose>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-y-auto bg-gray-50">
            {selectedReceipt?.type.includes('pdf') ? (
              <iframe
                src={selectedReceipt.data}
                className="w-full h-[70vh] border-0"
                title="Recibo PDF"
              />
            ) : (
              <img
                src={selectedReceipt?.data}
                alt="Recibo"
                className="max-w-full h-auto object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
