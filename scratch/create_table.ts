import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require");

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS nicknames (
      user_id VARCHAR(255) PRIMARY KEY,
      nickname VARCHAR(255) NOT NULL
    )
  `;
  console.log("Nicknames table created or already exists.");
}

main().catch(console.error);
