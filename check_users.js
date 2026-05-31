const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_pAIFo5tLlb6O@ep-fragrant-scene-ac94ikf6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const nicknames = await sql`SELECT * FROM nicknames`;
  console.log("Nicknames table:");
  console.table(nicknames);
  
  const distinctCreators = await sql`SELECT DISTINCT created_by FROM expenses`;
  console.log("Distinct created_by in expenses:");
  console.table(distinctCreators);
  
  const distinctSplitWith = await sql`
    SELECT DISTINCT jsonb_array_elements(split_with)->>'id' as split_id, jsonb_array_elements(split_with)->>'name' as split_name
    FROM expenses
  `;
  console.log("Distinct split_with in expenses:");
  console.table(distinctSplitWith);
}

main().catch(console.error);
