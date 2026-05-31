const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const result = await sql`
    SELECT id, description, amount, created_at, created_by, split_with
    FROM expenses
    WHERE description = 'fev-nov Passagem Europa Julho'
    ORDER BY created_at DESC
  `;
  console.log("Details for 'fev-nov Passagem Europa Julho':");
  result.forEach(r => console.log(r));
}

main().catch(console.error);
