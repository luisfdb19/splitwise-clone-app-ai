const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const expenses = await sql`SELECT DISTINCT created_by FROM expenses WHERE created_by LIKE 'user_%'`;
  console.log("Clerk IDs found:", expenses);
}
main().catch(console.error);
