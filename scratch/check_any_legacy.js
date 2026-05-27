const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const expenses = await sql`SELECT id, split_with, description FROM expenses`;
  let legacyFound = false;
  
  expenses.forEach(e => {
    e.split_with.forEach(member => {
      if (!member.id.startsWith('user_')) {
        console.log(`Legacy ID found in expense "${e.description}" (ID: ${e.id}): Member ID: "${member.id}", Name: "${member.name}"`);
        legacyFound = true;
      }
    });
  });
  
  if (!legacyFound) {
    console.log("No legacy user IDs found in any split_with arrays!");
  }
}

main().catch(console.error);
