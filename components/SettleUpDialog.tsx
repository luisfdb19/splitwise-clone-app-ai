'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { addExpense } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Balance {
  debtor: string;
  creditor: string;
  amount: number;
}

interface SettleUpDialogProps {
  balances: Balance[];
  groupId: string;
}

export default function SettleUpDialog({ balances, groupId }: SettleUpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  if (!user || balances.length === 0) return null;

  // Find if current user owes anyone
  const myDebts = balances.filter(b => 
    b.debtor === user.id || 
    b.debtor === user.fullName || 
    (user.firstName && b.debtor.includes(user.firstName))
  );

  const handleSettle = async (debt: Balance) => {
    setLoading(true);
    try {
      // Create a payment expense where the debtor pays 100% for the creditor
      const expenseData = {
        amount: debt.amount,
        description: 'Payment',
        groupId: groupId,
        splitPercentage: 100, // Debtor pays 100% for the creditor
        splitWith: [{
          id: debt.creditor,
          name: debt.creditor,
        }],
        createdBy: debt.debtor, // The person who owes is the one paying
      };

      const result = await addExpense(expenseData);
      
      if (result.success) {
        toast({ title: 'Success', description: 'Debt settled successfully!' });
        setIsOpen(false);
        router.refresh();
      } else {
        toast({ title: 'Error', description: 'Failed to settle debt', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-500 hover:bg-teal-600 text-white">
          Settle Up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle Up</DialogTitle>
          <DialogDescription>
            Record a payment to settle your balances.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {myDebts.length > 0 ? (
            myDebts.map((debt, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Pay {debt.creditor}</p>
                  <p className="text-lg font-bold text-teal-600">R${debt.amount.toFixed(2)}</p>
                </div>
                <Button 
                  onClick={() => handleSettle(debt)} 
                  disabled={loading}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  {loading ? 'Processing...' : 'Record Payment'}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">You do not owe anything right now! 🎉</p>
          )}

          {myDebts.length === 0 && balances.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Other pending balances in the group:</p>
              {balances.filter(b => !myDebts.includes(b)).map((b, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span>{b.debtor} owes {b.creditor}</span>
                  <span className="font-medium">R${b.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
