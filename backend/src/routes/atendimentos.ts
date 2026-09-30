import { Router } from 'express';
import { pool } from '../db';
import { autenticar, autorizar } from '../auth';

const router = Router();
router.use(autenticar);

// Lista atendimentos (pode filtrar por status ou por paciente)
router.get('/', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const pacienteId = req.query.paciente_id ? String(req.query.paciente_id) : null;
  const { rows } = await pool.query(
    `SELECT a.id, a.status, a.criado_em, a.finalizado_em, a.paciente_id,
            p.nome AS paciente_nome, u.nome AS profissional_nome,
            pr.diagnostico
       FROM atendimentos a
       JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN usuarios u ON u.id = a.profissional_id
       LEFT JOIN prontuarios pr ON pr.atendimento_id = a.id
      WHERE ($1::text IS NULL OR a.status = $1::text)
        AND ($2::uuid IS NULL OR a.paciente_id = $2::uuid)
      ORDER BY a.criado_em DESC`,
    [status, pacienteId]
  );
  res.json(rows);
});

// Abre um atendimento para um paciente
router.post('/', autorizar('admin', 'medico', 'recepcao'), async (req, res) => {
  const { paciente_id } = req.body ?? {};
  if (!paciente_id) return res.status(400).json({ erro: 'paciente_id é obrigatório' });

  const profissional = req.user!.perfil === 'medico' ? req.user!.id : null;
  const { rows } = await pool.query(
    `INSERT INTO atendimentos (paciente_id, profissional_id) VALUES ($1, $2) RETURNING *`,
    [paciente_id, profissional]
  );
  res.status(201).json(rows[0]);
});

// Detalhe do atendimento com o prontuário
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.id, a.status, p.nome AS paciente_nome,
            pr.queixa, pr.diagnostico, pr.conduta, pr.prescricao
       FROM atendimentos a
       JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN prontuarios pr ON pr.atendimento_id = a.id
      WHERE a.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Atendimento não encontrado' });
  res.json(rows[0]);
});

// Cria ou atualiza o prontuário
router.put('/:id/prontuario', autorizar('admin', 'medico', 'enfermeiro'), async (req, res) => {
  const { queixa, diagnostico, conduta, prescricao } = req.body ?? {};
  const { rows } = await pool.query(
    `INSERT INTO prontuarios (atendimento_id, queixa, diagnostico, conduta, prescricao)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (atendimento_id) DO UPDATE
       SET queixa = EXCLUDED.queixa, diagnostico = EXCLUDED.diagnostico,
           conduta = EXCLUDED.conduta, prescricao = EXCLUDED.prescricao,
           atualizado_em = NOW()
     RETURNING *`,
    [req.params.id, queixa ?? null, diagnostico ?? null, conduta ?? null, prescricao ?? null]
  );
  res.json(rows[0]);
});

// Finaliza o atendimento
router.patch('/:id/finalizar', autorizar('admin', 'medico'), async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE atendimentos SET status = 'finalizado', finalizado_em = NOW()
      WHERE id = $1 AND status = 'aberto' RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Atendimento não encontrado ou já finalizado' });
  res.json(rows[0]);
});

export default router;