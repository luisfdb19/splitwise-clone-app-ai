'use server';

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface SplitMember {
  id: string;
  name: string;
}

interface ExpenseData {
  amount: number;
  description: string;
  groupId: string;
  splitPercentage: number;
  splitWith: SplitMember[];
  createdBy: string;
}

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

export async function addExpense(expenseData: ExpenseData) {
  const {
    amount,
    description,
    groupId,
    splitPercentage,
    splitWith,
    createdBy,
  } = expenseData;

  try {
    // Calculate split amount for each member
    const splitAmount = (amount * (splitPercentage / 100)) / splitWith.length;

    // Create a JSON object with member information and split amounts
    const splitWithInfo = splitWith.map((member) => ({
      id: member.id,
      name: member.name,
      splitAmount: splitAmount,
    }));

    // Insert the expense
    await sql`
      INSERT INTO expenses (
        amount, description, group_id, split_percentage, created_by, split_with
      )
      VALUES (
        ${amount}, ${description}, ${groupId}, ${splitPercentage}, ${createdBy}, ${JSON.stringify(
      splitWithInfo
    )}
      )
    `;

    return { success: true };
  } catch (error) {
    console.error('Error adding expense:', error);
    return { success: false };
  }
}

export async function getGroupData(groupId: string, currentUserId: string, currentUserName: string) {
  try {
    const expenses = (await sql`
      SELECT id, amount, description, created_by, split_with, created_at, split_percentage
      FROM expenses
      WHERE group_id = ${groupId}
      ORDER BY created_at DESC
    `) as Expense[];

    const balances: Balance[] = [];
    const balanceMap = new Map<string, { amount: number; name: string }>();

    // Build user mapping from all split members to map user IDs to names
    const userMap = new Map<string, string>();
    if (currentUserId && currentUserName) {
      userMap.set(currentUserId, currentUserName);
    }
    expenses.forEach((expense) => {
      expense.split_with.forEach((member) => {
        if (member.id && member.name) {
          userMap.set(member.id, member.name);
        }
      });
    });

    expenses.forEach((expense) => {
      const creatorSplit =
        expense.amount -
        expense.split_with.reduce(
          (sum: number, member: { splitAmount: number }) =>
            sum + member.splitAmount,
          0
        );

      const creatorId = expense.created_by;
      const creatorName = userMap.get(creatorId) || 'Unknown';

      // Update creator's balance
      const creatorBalance = balanceMap.get(creatorId) || {
        amount: 0,
        name: creatorName,
      };
      creatorBalance.amount += creatorSplit;
      balanceMap.set(creatorId, creatorBalance);

      // Update split members' balances
      expense.split_with.forEach(
        (member: { id: string; name: string; splitAmount: number }) => {
          const memberBalance = balanceMap.get(member.id) || {
            amount: 0,
            name: member.name,
          };
          memberBalance.amount -= member.splitAmount;
          balanceMap.set(member.id, memberBalance);
        }
      );
    });

    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];

    balanceMap.forEach(({ amount, name }) => {
      if (amount < -0.01) debtors.push({ name, amount: Math.abs(amount) });
      if (amount > 0.01) creditors.push({ name, amount });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      
      const settledAmount = Math.min(debtor.amount, creditor.amount);
      
      balances.push({
        debtor: debtor.name,
        creditor: creditor.name,
        amount: settledAmount
      });
      
      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;
      
      if (debtor.amount < 0.01) d++;
      if (creditor.amount < 0.01) c++;
    }

    return { expenses, balances };
  } catch (error) {
    console.error('Error fetching group data:', error);
    return { expenses: [], balances: [] };
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    await sql`
      DELETE FROM expenses
      WHERE id = ${expenseId}
    `;
    return { success: true };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { success: false };
  }
}

export async function updateExpense(expenseId: string, expenseData: {
  amount: number;
  description: string;
  splitPercentage: number;
  splitWith: SplitMember[];
}) {
  const { amount, description, splitPercentage, splitWith } = expenseData;

  try {
    const splitAmount = (amount * (splitPercentage / 100)) / splitWith.length;

    const splitWithInfo = splitWith.map((member) => ({
      id: member.id,
      name: member.name,
      splitAmount: splitAmount,
    }));

    await sql`
      UPDATE expenses
      SET amount = ${amount},
          description = ${description},
          split_percentage = ${splitPercentage},
          split_with = ${JSON.stringify(splitWithInfo)}
      WHERE id = ${expenseId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error updating expense:', error);
    return { success: false };
  }
}

interface ImportedExpense {
  amount: number;
  description: string;
  groupId: string;
  splitPercentage: number;
  splitWith: { id: string; name: string; splitAmount: number }[];
  createdBy: string;
  date: string;
}

export async function importExpenses(expenses: ImportedExpense[]) {
  try {
    let importedCount = 0;
    for (const expense of expenses) {
      await sql`
        INSERT INTO expenses (
          amount, description, group_id, split_percentage, created_by, split_with, created_at
        )
        VALUES (
          ${expense.amount}, ${expense.description}, ${expense.groupId},
          ${expense.splitPercentage}, ${expense.createdBy},
          ${JSON.stringify(expense.splitWith)}, ${expense.date}
        )
      `;
      importedCount++;
    }
    return { success: true, count: importedCount };
  } catch (error) {
    console.error('Error importing expenses:', error);
    return { success: false, count: 0 };
  }
}
