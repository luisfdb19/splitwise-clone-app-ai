const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const expenses = await sql`SELECT split_with, created_by FROM expenses WHERE group_id = 'org_3EHZGv83PHB3K8kNxDdANcAHAq6' LIMIT 50`;
  
  const userMap = new Map();
  expenses.forEach(e => {
    e.split_with.forEach(member => {
      userMap.set(member.id, member.name);
    });
  });

  console.log("Users in group:");
  userMap.forEach((name, id) => {
    console.log(`${id}: ${name}`);
  });
}

main().catch(console.error);
