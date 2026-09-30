import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { pool } from './db';
import authRouter from './routes/auth';
import pacientesRouter from './routes/pacientes';
import atendimentosRouter from './routes/atendimentos';
import leitosRouter from './routes/leitos';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/saude', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/pacientes', pacientesRouter);
app.use('/atendimentos', atendimentosRouter);
app.use('/leitos', leitosRouter);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Atualiza o banco automaticamente ao ligar (campos novos do cadastro de pacientes)
async function prepararBanco() {
  await pool.query(
    `ALTER TABLE pacientes
       ADD COLUMN IF NOT EXISTS cartao_sus TEXT,
       ADD COLUMN IF NOT EXISTS endereco TEXT`
  );
  const exemplos = [
    ['000.000.000-01', '700000000000001', 'Rua da Matriz, 120, Centro, Morpará - BA'],
    ['000.000.000-02', '700000000000002', 'Av. Beira Rio, 45, Morpará - BA'],
    ['000.000.000-03', '700000000000003', 'Rua São Francisco, 88, Morpará - BA'],
    ['000.000.000-04', '700000000000004', 'Travessa do Porto, 10, Morpará - BA'],
    ['000.000.000-05', '700000000000005', 'Rua Nova, 300, Morpará - BA'],
  ];
  for (const [cpf, sus, endereco] of exemplos) {
    await pool.query(
      `UPDATE pacientes
          SET cartao_sus = COALESCE(cartao_sus, $2), endereco = COALESCE(endereco, $3)
        WHERE cpf = $1`,
      [cpf, sus, endereco]
    );
  }
}

const porta = Number(process.env.PORT || 3000);
prepararBanco()
  .then(() => app.listen(porta, () => console.log(`SIGM backend rodando em http://localhost:${porta}`)))
  .catch((e) => {
    console.error('Erro ao preparar o banco:', e.message);
    process.exit(1);
  });
