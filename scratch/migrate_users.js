const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_PKB5q9bygzEr@ep-fragrant-scene-ac94ikf6.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log("Fetching all expenses...");
  const expenses = await sql`SELECT id, created_by, split_with, description FROM expenses`;
  
  let updateCreatedByCount = 0;
  let updateSplitWithCount = 0;
  
  for (const exp of expenses) {
    let needsUpdate = false;
    let newCreatedBy = exp.created_by;
    
    // Check created_by
    if (exp.created_by === 'luís-fernando-della-bruna' || exp.created_by === 'luis-fernando-della-bruna') {
      newCreatedBy = 'user_3EGjbpJK0m5F9eeFrBNB5uGyqhE';
      needsUpdate = true;
      updateCreatedByCount++;
    } else if (exp.created_by === 'ellen-provesi-rampeloti') {
      newCreatedBy = 'user_3EH0XHO6PCOk6RhlydCi1zPECfH';
      needsUpdate = true;
      updateCreatedByCount++;
    }
    
    // Check split_with JSON array
    let newSplitWith = [...exp.split_with];
    let splitWithUpdated = false;
    
    newSplitWith = newSplitWith.map(member => {
      let updatedMember = { ...member };
      if (member.id === 'luís-fernando-della-bruna' || member.id === 'luis-fernando-della-bruna') {
        updatedMember.id = 'user_3EGjbpJK0m5F9eeFrBNB5uGyqhE';
        splitWithUpdated = true;
      } else if (member.id === 'ellen-provesi-rampeloti') {
        updatedMember.id = 'user_3EH0XHO6PCOk6RhlydCi1zPECfH';
        splitWithUpdated = true;
      }
      return updatedMember;
    });
    
    if (splitWithUpdated) {
      needsUpdate = true;
      updateSplitWithCount++;
    }
    
    if (needsUpdate) {
      console.log(`Updating expense ID: ${exp.id} ("${exp.description}")`);
      console.log(`  Created By: ${exp.created_by} -> ${newCreatedBy}`);
      console.log(`  Split With: ${JSON.stringify(exp.split_with)} -> ${JSON.stringify(newSplitWith)}`);
      
      await sql`
        UPDATE expenses 
        SET created_by = ${newCreatedBy}, 
            split_with = ${JSON.stringify(newSplitWith)}::jsonb 
        WHERE id = ${exp.id}
      `;
    }
  }
  
  console.log(`Migration finished.`);
  console.log(`Updated created_by for ${updateCreatedByCount} expenses.`);
  console.log(`Updated split_with for ${updateSplitWithCount} expenses.`);
}

main().catch(console.error);
