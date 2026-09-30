import { Router } from 'express';
import { pool } from '../db';
import { autenticar, autorizar } from '../auth';

const router = Router();
router.use(autenticar);

// Lista/busca pacientes por nome, CPF ou cartão do SUS (parcial)
router.get('/', async (req, res) => {
  const busca = String(req.query.busca ?? '').trim();
  const { rows } = await pool.query(
    `SELECT id, nome, cpf, cartao_sus, telefone, endereco,
            to_char(data_nascimento, 'DD/MM/YYYY') AS data_nascimento
       FROM pacientes
      WHERE $1::text = ''
         OR nome ILIKE '%' || $1::text || '%'
         OR cpf LIKE '%' || $1::text || '%'
         OR cartao_sus LIKE '%' || $1::text || '%'
      ORDER BY nome
      LIMIT 100`,
    [busca]
  );
  res.json(rows);
});

// Cadastra paciente
router.post('/', autorizar('admin', 'recepcao', 'medico'), async (req, res) => {
  const { nome, cpf, cartao_sus, data_nascimento, telefone, endereco } = req.body ?? {};
  if (!nome || !cpf) return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });

  const sus = cartao_sus ? String(cartao_sus).replace(/\D/g, '') : '';
  if (sus && sus.length !== 15) {
    return res.status(400).json({ erro: 'O cartão do SUS deve ter 15 números' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO pacientes (nome, cpf, cartao_sus, data_nascimento, telefone, endereco)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, cpf, cartao_sus, telefone, endereco`,
      [
        String(nome).trim(),
        String(cpf).trim(),
        sus || null,
        data_nascimento || null,
        telefone ? String(telefone).trim() : null,
        endereco ? String(endereco).trim() : null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Já existe paciente com este CPF' });
    throw e;
  }
});

export default router;
