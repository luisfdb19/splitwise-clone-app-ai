const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const groupId = 'org_2n52wAEXK9iWqMv0hN0VjNnpF0l'; // I need to find the correct org_id for 'EL'. Let's fetch the first group id.
  const groups = await sql`SELECT DISTINCT group_id FROM expenses LIMIT 1`;
  const gid = groups[0].group_id;
  
  console.log("Using group ID:", gid);
  
  const expenses = await sql`
      SELECT id, amount, description, created_by, split_with, created_at, split_percentage
      FROM expenses
      WHERE group_id = ${gid}
      ORDER BY created_at DESC
  `;
  
  const nicknamesResult = await sql`SELECT user_id, nickname FROM nicknames`;
  const nicknameMap = new Map();
  nicknamesResult.forEach((n) => {
    nicknameMap.set(n.user_id, n.nickname);
  });

  const userMap = new Map();
  const canonicalIdMap = new Map();
  
  // Fake Clerk members based on what we saw earlier
  const memberships = [
    {
      publicUserData: { userId: 'user_3EGjbpJK0m5F9eeFrBNB5uGyqhE', firstName: 'Luis', lastName: 'Fernando', identifier: 'luisfdb@gmail.com' }
    },
    {
      publicUserData: { userId: 'user_3EH0XHO6PCOk6RhlydCi1zPECfH', firstName: 'Ellen', lastName: 'Provesi Rampeloti', identifier: 'ellenproramp@gmail.com' }
    }
  ];
  
  memberships.forEach((m) => {
    const name = `${m.publicUserData.firstName || ''} ${m.publicUserData.lastName || ''}`.trim();
    const userId = m.publicUserData.userId;
    const email = m.publicUserData.identifier;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    const resolvedName = nicknameMap.get(userId) || nicknameMap.get(email) || nicknameMap.get(slug) || name;
    
    if (userId) {
      userMap.set(userId, resolvedName);
      canonicalIdMap.set(userId, userId);
    }
    if (email) {
      userMap.set(email.toLowerCase(), resolvedName);
      canonicalIdMap.set(email.toLowerCase(), userId);
    }
    if (slug) {
      userMap.set(slug, resolvedName);
      canonicalIdMap.set(slug, userId);
    }
    const lowerName = name.toLowerCase();
    userMap.set(lowerName, resolvedName);
    canonicalIdMap.set(lowerName, userId);
  });

  const balanceMap = new Map();

  expenses.forEach((expense) => {
    if (expense.created_by) {
      userMap.set(expense.created_by, nicknameMap.get(expense.created_by) || userMap.get(expense.created_by) || 'Unknown');
    }
  });

  expenses.forEach((expense) => {
    expense.created_by_name = userMap.get(expense.created_by) || expense.created_by;
    
    expense.split_with.forEach((member) => {
      member.name = userMap.get(member.id) || userMap.get(member.name) || member.name;
    });

    const creatorSplit = expense.split_with.reduce(
      (sum, member) => sum + member.splitAmount, 0
    );

    const creatorId = canonicalIdMap.get(expense.created_by) || expense.created_by;
    const creatorName = userMap.get(creatorId) || 'Unknown';

    const creatorBalance = balanceMap.get(creatorId) || { amount: 0, name: creatorName };
    creatorBalance.amount += creatorSplit;
    balanceMap.set(creatorId, creatorBalance);

    expense.split_with.forEach((member) => {
      const canonicalMemberId = canonicalIdMap.get(member.id) || member.id;
      const memberBalance = balanceMap.get(canonicalMemberId) || { amount: 0, name: member.name };
      memberBalance.amount -= member.splitAmount;
      balanceMap.set(canonicalMemberId, memberBalance);
    });
  });

  const debtors = [];
  const creditors = [];

  balanceMap.forEach(({ amount, name }, id) => {
    if (amount < -0.01) debtors.push({ id, name, amount: Math.abs(amount) });
    if (amount > 0.01) creditors.push({ id, name, amount });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const balances = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const settledAmount = Math.min(debtor.amount, creditor.amount);
    
    balances.push({
      debtor: debtor.name,
      debtorId: debtor.id,
      creditor: creditor.name,
      creditorId: creditor.id,
      amount: settledAmount
    });
    
    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;
    
    if (debtor.amount < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  console.log("Calculated balances:");
  console.table(balances);
  
  console.log("Balance Map entries:");
  balanceMap.forEach((val, key) => console.log(key, val));
}

main().catch(console.error);
