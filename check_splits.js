const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const exps = await sql`
    SELECT id, description, amount, jsonb_array_length(split_with) as num_splits, split_with
    FROM expenses
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log("Recent expenses with split_with lengths:");
  exps.forEach(e => {
    console.log(`${e.description} ($${e.amount}) -> splits: ${e.num_splits}`);
    console.log(JSON.stringify(e.split_with));
  });
}

main().catch(console.error);
