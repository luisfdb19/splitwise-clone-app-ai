const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const result = await sql`SELECT DISTINCT created_by FROM expenses`;
  console.log("Distinct creators:", result);
}

main().catch(console.error);
