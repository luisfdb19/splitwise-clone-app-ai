'use server';

import { neon } from '@neondatabase/serverless';
import { clerkClient } from '@clerk/nextjs/server';

const sql = neon(process.env.DATABASE_URL!);

interface SplitMember {
  id: string;
  name: string;
}

interface NicknameRow {
  user_id: string;
  nickname: string;
}

interface ExpenseData {
  amount: number;
  description: string;
  groupId: string;
  splitPercentage: number;
  splitWith: SplitMember[];
  createdBy: string;
  createdAt?: string;
  receiptData?: string;
  receiptType?: string;
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
  created_by_name?: string;
  split_with: {
    id: string;
    name: string;
    splitAmount: number;
  }[];
  created_at?: string;
  split_percentage?: number;
  receipt_data?: string;
  receipt_type?: string;
}

export async function addExpense(expenseData: ExpenseData) {
  const {
    amount,
    description,
    groupId,
    splitPercentage,
    splitWith,
    createdBy,
    createdAt,
    receiptData,
    receiptType,
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

    // Insert the expense with optional date and receipts
    const dateValue = createdAt ? new Date(createdAt) : new Date();
    await sql`
      INSERT INTO expenses (
        amount, description, group_id, split_percentage, created_by, split_with, created_at, receipt_data, receipt_type
      )
      VALUES (
        ${amount}, ${description}, ${groupId}, ${splitPercentage}, ${createdBy}, ${JSON.stringify(
      splitWithInfo
    )}, ${dateValue}, ${receiptData || null}, ${receiptType || null}
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
      SELECT id, amount, description, created_by, split_with, created_at, split_percentage, receipt_data, receipt_type
      FROM expenses
      WHERE group_id = ${groupId}
      ORDER BY created_at DESC
    `) as Expense[];

    const balances: Balance[] = [];
    const balanceMap = new Map<string, { amount: number; name: string }>();

    // Fetch all nicknames
    const nicknamesResult = (await sql`SELECT user_id, nickname FROM nicknames`) as NicknameRow[];
    const nicknameMap = new Map<string, string>();
    nicknamesResult.forEach((n) => {
      nicknameMap.set(n.user_id, n.nickname);
    });

    // Build user mapping from all split members to map user IDs to names
    const userMap = new Map<string, string>();
    const canonicalIdMap = new Map<string, string>();
    if (currentUserId && currentUserName) {
      userMap.set(currentUserId, nicknameMap.get(currentUserId) || currentUserName);
      canonicalIdMap.set(currentUserId, currentUserId);
    }

    // Fetch actual organization members from Clerk to map names, emails, and slugs to nicknames
    try {
      const client = await clerkClient();
      const memberships = await client.organizations.getOrganizationMembershipList({
        organizationId: groupId,
      });
      memberships.data.forEach((m) => {
        const name = `${m.publicUserData?.firstName || ''} ${m.publicUserData?.lastName || ''}`.trim();
        const userId = m.publicUserData?.userId;
        const email = m.publicUserData?.identifier;
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const lowerName = name.toLowerCase();

        const resolvedName = nicknameMap.get(userId || '') || nicknameMap.get(email || '') || nicknameMap.get(slug) || name;

        if (userId) {
          userMap.set(userId, resolvedName);
          canonicalIdMap.set(userId, userId);
        }
        if (email) {
          userMap.set(email.toLowerCase(), resolvedName);
          if (userId) canonicalIdMap.set(email.toLowerCase(), userId);
        }
        if (slug) {
          userMap.set(slug, resolvedName);
          if (userId) canonicalIdMap.set(slug, userId);
        }
        if (lowerName) {
          userMap.set(lowerName, resolvedName);
          if (userId) canonicalIdMap.set(lowerName, userId);
        }
      });
    } catch (err) {
      console.error('Error fetching org members from Clerk:', err);
    }

    expenses.forEach((expense) => {
      expense.split_with.forEach((member) => {
        if (member.id) {
          userMap.set(member.id, nicknameMap.get(member.id) || member.name);
        }
      });
      // Also map creator
      if (expense.created_by) {
        userMap.set(expense.created_by, nicknameMap.get(expense.created_by) || userMap.get(expense.created_by) || 'Unknown');
      }
    });

    expenses.forEach((expense) => {
      // Map creator name
      expense.created_by_name = userMap.get(expense.created_by) || expense.created_by;
      
      // Update split member names in place
      expense.split_with.forEach((member) => {
        member.name = userMap.get(member.id) || userMap.get(member.name) || member.name;
      });

      const creatorSplit = expense.split_with.reduce(
        (sum: number, member: { splitAmount: number }) =>
          sum + member.splitAmount,
        0
      );

      const creatorId = canonicalIdMap.get(expense.created_by) || expense.created_by;
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
          const canonicalMemberId = canonicalIdMap.get(member.id) || member.id;
          const memberBalance = balanceMap.get(canonicalMemberId) || {
            amount: 0,
            name: member.name,
          };
          memberBalance.amount -= member.splitAmount;
          balanceMap.set(canonicalMemberId, memberBalance);
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
  createdBy?: string;
  createdAt?: string;
}) {
  const { amount, description, splitPercentage, splitWith, createdBy, createdAt } = expenseData;

  try {
    const splitAmount = (amount * (splitPercentage / 100)) / splitWith.length;

    const splitWithInfo = splitWith.map((member) => ({
      id: member.id,
      name: member.name,
      splitAmount: splitAmount,
    }));

    const dateValue = createdAt ? new Date(createdAt) : null;

    if (createdBy && dateValue) {
      await sql`
        UPDATE expenses
        SET amount = ${amount},
            description = ${description},
            split_percentage = ${splitPercentage},
            split_with = ${JSON.stringify(splitWithInfo)},
            created_by = ${createdBy},
            created_at = ${dateValue}
        WHERE id = ${expenseId}
      `;
    } else if (createdBy) {
      await sql`
        UPDATE expenses
        SET amount = ${amount},
            description = ${description},
            split_percentage = ${splitPercentage},
            split_with = ${JSON.stringify(splitWithInfo)},
            created_by = ${createdBy}
        WHERE id = ${expenseId}
      `;
    } else if (dateValue) {
      await sql`
        UPDATE expenses
        SET amount = ${amount},
            description = ${description},
            split_percentage = ${splitPercentage},
            split_with = ${JSON.stringify(splitWithInfo)},
            created_at = ${dateValue}
        WHERE id = ${expenseId}
      `;
    } else {
      await sql`
        UPDATE expenses
        SET amount = ${amount},
            description = ${description},
            split_percentage = ${splitPercentage},
            split_with = ${JSON.stringify(splitWithInfo)}
        WHERE id = ${expenseId}
      `;
    }

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

export async function saveNickname(userId: string, nickname: string, alternativeKeys: string[] = []) {
  try {
    await sql`
      INSERT INTO nicknames (user_id, nickname)
      VALUES (${userId}, ${nickname})
      ON CONFLICT (user_id)
      DO UPDATE SET nickname = ${nickname}
    `;
    for (const key of alternativeKeys) {
      if (key) {
        await sql`
          INSERT INTO nicknames (user_id, nickname)
          VALUES (${key}, ${nickname})
          ON CONFLICT (user_id)
          DO UPDATE SET nickname = ${nickname}
        `;
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error saving nickname:', error);
    return { success: false };
  }
}

export async function getNicknames() {
  try {
    const result = (await sql`SELECT user_id, nickname FROM nicknames`) as NicknameRow[];
    const map: { [key: string]: string } = {};
    result.forEach((row) => {
      map[row.user_id] = row.nickname;
    });
    return map;
  } catch (error) {
    console.error('Error fetching nicknames:', error);
    return {};
  }
}
