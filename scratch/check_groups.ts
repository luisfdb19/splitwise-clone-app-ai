import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require");

async function main() {
  const result = await sql`SELECT DISTINCT group_id FROM expenses`;
  console.log(result);
}

main().catch(console.error);
