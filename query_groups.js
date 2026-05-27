const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const groups = await sql`SELECT DISTINCT group_id FROM expenses LIMIT 10`;
  console.log("Groups with expenses:", groups);
}

main().catch(console.error);
