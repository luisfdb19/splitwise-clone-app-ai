const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const expenses = await sql`SELECT DISTINCT created_by FROM expenses WHERE created_by LIKE 'user_%'`;
  console.log("Clerk IDs found:", expenses);
}
main().catch(console.error);
