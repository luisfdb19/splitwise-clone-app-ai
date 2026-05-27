import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require");

async function main() {
  const amount = 781.14;
  const description = "Ajuste de saldo inicial";
  const groupId = "org_3EHZGv83PHB3K8kNxDdANcAHAq6";
  const splitPercentage = 100;
  const createdBy = "luís-fernando-della-bruna";
  const splitWith = [
    {
      id: "ellen-provesi-rampeloti",
      name: "Ellen Provesi Rampeloti",
      splitAmount: 781.14
    }
  ];

  await sql`
    INSERT INTO expenses (
      amount, description, group_id, split_percentage, created_by, split_with, created_at
    )
    VALUES (
      ${amount}, ${description}, ${groupId}, ${splitPercentage}, ${createdBy}, ${JSON.stringify(splitWith)}, '2026-01-01 12:00:00'
    )
  `;
  console.log("Adjustment expense inserted successfully!");
}

main().catch(console.error);
