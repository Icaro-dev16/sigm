// Cria o banco (se não existir), as tabelas e os dados de teste.
// Rode com: npm run setup
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  const conexao = process.env.DATABASE_URL;
  if (!conexao) throw new Error('DATABASE_URL não está definida no arquivo .env');

  // 1) Cria o banco se ainda não existir
  const url = new URL(conexao);
  const nomeBanco = url.pathname.slice(1);
  url.pathname = '/postgres';
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  const existe = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [nomeBanco]);
  if (!existe.rowCount) {
    await admin.query(`CREATE DATABASE "${nomeBanco}"`);
    console.log(`Banco "${nomeBanco}" criado.`);
  }
  await admin.end();

  // 2) Cria as tabelas
  const db = new Client({ connectionString: conexao });
  await db.connect();
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Tabelas criadas.');

  // 3) Usuários de teste
  const usuarios = [
    ['Administrador', 'admin@sigm.com', 'admin123', 'admin'],
    ['Dra. Ana Souza', 'medico@sigm.com', 'medico123', 'medico'],
    ['Carlos Lima', 'enfermeiro@sigm.com', 'enfermeiro123', 'enfermeiro'],
    ['Marta Reis', 'recepcao@sigm.com', 'recepcao123', 'recepcao'],
  ];
  for (const [nome, email, senha, perfil] of usuarios) {
    await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [nome, email, await bcrypt.hash(senha, 10), perfil]
    );
  }

  // 4) Leitos
  const leitos = [['101', 'Enfermaria'], ['102', 'Enfermaria'], ['103', 'Enfermaria'], ['104', 'Enfermaria'], ['201', 'UTI'], ['202', 'UTI']];
  for (const [numero, setor] of leitos) {
    await db.query(`INSERT INTO leitos (numero, setor) VALUES ($1, $2) ON CONFLICT (numero) DO NOTHING`, [numero, setor]);
  }

  // 5) Pacientes fictícios
  const pacientes = [
    ['Maria das Graças Santos', '000.000.000-01', '700000000000001', '1958-03-14', '(75) 90000-0001', 'Rua da Matriz, 120, Centro, Morpará - BA'],
    ['José Carlos Oliveira', '000.000.000-02', '700000000000002', '1972-11-02', '(75) 90000-0002', 'Av. Beira Rio, 45, Morpará - BA'],
    ['Ana Beatriz Ferreira', '000.000.000-03', '700000000000003', '1995-07-21', '(75) 90000-0003', 'Rua São Francisco, 88, Morpará - BA'],
    ['Antônio Pereira Lima', '000.000.000-04', '700000000000004', '1949-01-30', '(75) 90000-0004', 'Travessa do Porto, 10, Morpará - BA'],
    ['Luciana Costa Andrade', '000.000.000-05', '700000000000005', '1988-09-09', '(75) 90000-0005', 'Rua Nova, 300, Morpará - BA'],
  ];
  for (const [nome, cpf, sus, nasc, tel, endereco] of pacientes) {
    await db.query(
      `INSERT INTO pacientes (nome, cpf, cartao_sus, data_nascimento, telefone, endereco)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (cpf) DO UPDATE
         SET cartao_sus = COALESCE(pacientes.cartao_sus, EXCLUDED.cartao_sus),
             endereco = COALESCE(pacientes.endereco, EXCLUDED.endereco)`,
      [nome, cpf, sus, nasc, tel, endereco]
    );
  }

  await db.end();
  console.log('Dados de teste inseridos. Pronto!');
}

main().catch((e) => {
  console.error('Erro no setup:', e.message);
  process.exit(1);
});
