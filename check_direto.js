const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const result = await sql`
    SELECT id, description, amount, created_at, created_by
    FROM expenses
    WHERE description ILIKE '%Direto do campo%' AND amount = 19.99
    ORDER BY created_at DESC
  `;
  console.log("Details for 'Direto do campo':");
  result.forEach(r => console.log(r));
}

main().catch(console.error);
