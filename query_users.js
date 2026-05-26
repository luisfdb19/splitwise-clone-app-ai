const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const expenses = await sql`SELECT split_with, created_by FROM expenses WHERE group_id = 'org_3EHZGv83PHB3K8kNxDdANcAHAq6' LIMIT 50`;
  
  const userMap = new Map();
  expenses.forEach(e => {
    e.split_with.forEach(member => {
      userMap.set(member.id, member.name);
    });
  });

  console.log("Users in group:");
  userMap.forEach((name, id) => {
    console.log(`${id}: ${name}`);
  });
}

main().catch(console.error);
