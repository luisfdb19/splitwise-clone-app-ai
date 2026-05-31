const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const result = await sql`
    SELECT id, description, amount, next_occurrence, current_installment, total_installments
    FROM recurring_expenses
    WHERE description ILIKE '%europa%'
  `;
  console.log("Recurring expenses matching 'europa':");
  console.table(result);
}

main().catch(console.error);
