const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const duplicates = await sql`
    SELECT description, amount, created_at, COUNT(*)
    FROM expenses
    GROUP BY description, amount, created_at
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `;
  console.log("Potential duplicate expenses:");
  console.table(duplicates);
  
  const recurring = await sql`
    SELECT description, amount, COUNT(*)
    FROM recurring_expenses
    GROUP BY description, amount
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `;
  console.log("Potential duplicate recurring expenses:");
  console.table(recurring);
}

main().catch(console.error);
