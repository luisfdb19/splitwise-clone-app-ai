const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_data TEXT;`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_type VARCHAR(50);`;
  console.log("Migration successful!");
}

main().catch(console.error);
