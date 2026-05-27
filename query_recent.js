const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const expenses = await sql`SELECT id, created_by, split_with, created_at FROM expenses WHERE group_id = 'org_3EHZGv83PHB3K8kNxDdANcAHAq6' ORDER BY created_at DESC LIMIT 5`;
  console.log(JSON.stringify(expenses, null, 2));
}
main().catch(console.error);
