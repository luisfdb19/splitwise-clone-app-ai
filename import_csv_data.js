const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const csv = `Data,Descrição,Categoria,Custo,Moeda,Ellen Provesi Rampeloti,Luís Fernando Della Bruna
2026-01-05,Veg 2 dias,Mercado,63.83,BRL,-63.83,63.83
2026-01-15,Diesel + Jurere,Combustível,548.00,BRL,-274.00,274.00
2026-01-22,Da familia,Geral,41.00,BRL,-41.00,41.00
2026-01-23,Veg,Geral,21.42,BRL,-21.42,21.42
2026-01-27,Racao Mixi,Geral,249.44,BRL,-124.72,124.72
2026-02-02,fev-nov Passagem Europa Julho,Geral,503.05,BRL,-503.05,503.05
2026-02-04,Jan condaguagasluz,Casa - Outros,945.95,BRL,945.95,-945.95
2026-02-04,Remedios +feira+direto campo,Geral,132.90,BRL,66.45,-66.45
2026-02-04,28-04/fev,Geral,474.57,BRL,-237.29,237.29
2026-02-04,"Cobasi,diretocampo,mercadoserra",Geral,110.36,BRL,55.18,-55.18
2026-02-04,Farmacia SESI + Diesel Serra + Posto Serra + Janaina,Despesas médicas,459.12,BRL,-229.56,229.56
2026-02-04,Ellen P. pagou Luís F.,Pagamento,700.00,BRL,700.00,-700.00
2026-02-05,Riachuelo ellen,Geral,109.85,BRL,-109.85,109.85
2026-02-05,Almoco frango,Geral,34.89,BRL,-34.89,34.89
2026-02-08,Sattoru,Geral,179.30,BRL,-89.65,89.65
2026-02-08,Diesel Itj,Combustível,92.94,BRL,-46.47,46.47
2026-02-08,Sottili + Fd2Save CCultura + imperatriz,Geral,440.49,BRL,-220.25,220.25
2026-02-10,Almoço Zepellin,Jantar fora,30.00,BRL,-30.00,30.00
2026-02-18,Almoço Sesc,Jantar fora,23.39,BRL,-23.39,23.39
2026-02-19,Almoco orleans,Geral,33.24,BRL,-33.24,33.24
2026-02-20,Almoco studio,Jantar fora,21.00,BRL,-21.00,21.00
2026-02-21,angeloni,Geral,50.71,BRL,-25.35,25.35
2026-02-26,direto do campo,Geral,23.70,BRL,-11.85,11.85
2026-02-26,chilli+moochacho+uberflp shop,Jantar fora,143.95,BRL,-71.98,71.98
2026-03-01,Fev condaguagasluz,Casa - Outros,1080.30,BRL,1080.30,-1080.30
2026-03-02,fev-nov Passagem Europa Julho,Geral,503.05,BRL,-503.05,503.05
2026-03-02,Cafe,Jantar fora,15.90,BRL,-15.90,15.90
2026-03-03,Almoco posto rosso,Geral,85.31,BRL,-42.65,42.65
2026-03-04,Ellen P. pagou Luís F.,Pagamento,1787.00,BRL,1787.00,-1787.00
2026-03-06,Almoco sesc,Geral,25.00,BRL,-25.00,25.00
2026-03-08,Almoco itaguacu,Jantar fora,49.90,BRL,-49.90,49.90
2026-03-08,Bistek Mercado,Mercado,276.32,BRL,-138.16,138.16
2026-03-13,Ssrvidores,Geral,26.40,BRL,-26.40,26.40
2026-03-17,Almoco zeppelin,Geral,26.72,BRL,-26.72,26.72
2026-03-23,Feira,Jantar fora,28.00,BRL,14.00,-14.00
2026-03-23,Protetor splar,Geral,65.00,BRL,32.50,-32.50
2026-03-26,Almoco mamma veg,Mercado,25.00,BRL,-25.00,25.00
2026-04-01,Mar condaguagasluz,Casa - Outros,1000.02,BRL,1000.02,-1000.02
2026-04-02,fev-nov Passagem Europa Julho,Geral,503.05,BRL,-503.05,503.05
2026-04-06,Ubaia,Geral,392.00,BRL,196.00,-196.00
2026-04-06,Despesas luis>ellen,Geral,889.08,BRL,-444.54,444.54
2026-04-07,Ellen P. pagou Luís F.,Pagamento,997.00,BRL,997.00,-997.00
2026-04-07,Ovo,Geral,18.00,BRL,-9.00,9.00
2026-04-08,Almoco zeppelin,Geral,22.60,BRL,-22.60,22.60
2026-04-09,pao giovanna,Geral,12.00,BRL,6.00,-6.00
2026-04-09,almoco mamma veg,Mercado,24.00,BRL,-24.00,24.00
2026-04-12,janta,Jantar fora,172.70,BRL,-86.35,86.35
2026-04-13,Servidores,Geral,27.00,BRL,-27.00,27.00
2026-04-13,racao mixi,Geral,273.33,BRL,136.66,-136.66
2026-04-17,sushishop,Geral,108.95,BRL,-54.47,54.47
2026-04-19,Vo chica,Geral,25.10,BRL,-25.10,25.10
2026-04-20,moochacho ,Geral,51.00,BRL,-25.50,25.50
2026-04-25,direto do campo ,Geral,32.28,BRL,-16.14,16.14
2026-04-28,Depilex,Geral,98.70,BRL,-98.70,98.70
2026-04-30,iFood,Geral,66.36,BRL,-33.18,33.18
2026-05-01,Abr condaguagasluz,Casa - Outros,893.21,BRL,893.21,-893.21
2026-05-02,fev-nov Passagem Europa Julho,Geral,503.05,BRL,-503.05,503.05
2026-05-04,Mercado,Mercado,99.00,BRL,-49.50,49.50
2026-05-09,Roteador internet emprestado,TV/Telefone/Internet,560.00,BRL,560.00,-560.00
2026-05-11,Almoco servidores,Geral,19.50,BRL,-19.50,19.50
2026-05-14,Cafe estrada+ifood,Geral,136.08,BRL,68.04,-68.04
2026-05-14,Servidores almoco,Jantar fora,24.00,BRL,-24.00,24.00
2026-05-15,Protetor solar,Geral,156.24,BRL,78.12,-78.12
2026-05-15,Direto campo+mercado,Mercado,48.02,BRL,24.01,-24.01
2026-05-18,carne+direto campo+mercado,Mercado,184.81,BRL,92.40,-92.40
2026-05-23,servidores,Geral,29.41,BRL,-29.41,29.41
2026-05-23,Maiocondaguagas,Casa - Outros,776.70,BRL,776.70,-776.70
2026-05-26,Giassi e almoco e padeiro,Geral,240.03,BRL,-120.01,120.01
2026-05-26,AquecedorSabaoLouca,Geral,379.60,BRL,-189.80,189.80`;

async function main() {
  const lines = csv.trim().split('\n').slice(1);
  const groupId = 'org_3EHZGv83PHB3K8kNxDdANcAHAq6';
  const ellenId = 'ellen-provesi-rampeloti';
  const ellenName = 'Ellen Provesi Rampeloti';
  const luisId = 'luís-fernando-della-bruna';
  const luisName = 'Luís Fernando Della Bruna';

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Custom CSV parser handling quotes
    const cols = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuote = !inQuote;
      } else if (line[i] === ',' && !inQuote) {
        cols.push(cur);
        cur = '';
      } else {
        cur += line[i];
      }
    }
    cols.push(cur);

    if (cols.length < 7) continue;

    const date = cols[0];
    const desc = cols[1];
    const cat = cols[2];
    const cost = parseFloat(cols[3]);
    const ellenBal = parseFloat(cols[5]);
    const luisBal = parseFloat(cols[6]);

    let createdBy, splitWith;

    if (ellenBal > 0) {
      // Ellen is owed money, so Ellen paid
      createdBy = ellenId;
      splitWith = [{ id: luisId, name: luisName, splitAmount: ellenBal }];
    } else {
      // Luis is owed money, so Luis paid
      createdBy = luisId;
      splitWith = [{ id: ellenId, name: ellenName, splitAmount: luisBal }];
    }

    // Default 50% split percentage for visual, except payments
    let splitPercentage = 50;
    if (desc.includes('pagou')) {
      splitPercentage = 100;
    }

    try {
      await sql`
        INSERT INTO expenses (amount, description, group_id, split_percentage, split_with, created_by, created_at)
        VALUES (${cost}, ${desc}, ${groupId}, ${splitPercentage}, ${JSON.stringify(splitWith)}, ${createdBy}, ${date})
      `;
      console.log(`Inserted: ${desc} on ${date}`);
    } catch (err) {
      console.error('Failed to insert', desc, err);
    }
  }
}
main().catch(console.error);
