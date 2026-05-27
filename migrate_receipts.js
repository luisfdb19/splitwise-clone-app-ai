const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_data TEXT;`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_type VARCHAR(50);`;
  console.log("Migration successful!");
}

main().catch(console.error);
