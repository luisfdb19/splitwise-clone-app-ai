const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const expenses = await sql`SELECT id, created_by, split_with, created_at FROM expenses WHERE group_id = 'org_3EHZGv83PHB3K8kNxDdANcAHAq6' ORDER BY created_at DESC LIMIT 5`;
  console.log(JSON.stringify(expenses, null, 2));
}
main().catch(console.error);
