const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const duplicates = await sql`
    SELECT description, amount, COUNT(*)
    FROM expenses
    WHERE description LIKE '%(1/%' OR description LIKE '%(2/%' OR description LIKE '%(3/%'
    GROUP BY description, amount
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `;
  console.log("Recurring expenses duplicates:");
  console.table(duplicates);
  
  const allReccuring = await sql`
    SELECT id, description, amount, created_at
    FROM expenses
    WHERE description LIKE '%(1/%'
    ORDER BY description
  `;
  console.log("All generated recurring expenses (1/x):");
  console.table(allReccuring);
}

main().catch(console.error);
