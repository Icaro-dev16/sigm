import { Router } from 'express';
import { pool } from '../db';
import { autenticar, autorizar } from '../auth';

const router = Router();
router.use(autenticar);

// Mapa de leitos, com o nome do paciente internado (se houver)
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT l.id, l.numero, l.setor, l.status,
            i.id AS internacao_id, p.nome AS paciente_nome
       FROM leitos l
       LEFT JOIN internacoes i ON i.leito_id = l.id AND i.data_alta IS NULL
       LEFT JOIN pacientes p ON p.id = i.paciente_id
      ORDER BY l.numero`
  );
  res.json(rows);
});

// Internar paciente em um leito livre
router.post('/:id/internar', autorizar('admin', 'medico', 'enfermeiro'), async (req, res) => {
  const { paciente_id, motivo } = req.body ?? {};
  if (!paciente_id) return res.status(400).json({ erro: 'Escolha o paciente' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const leito = await client.query(`SELECT status FROM leitos WHERE id = $1 FOR UPDATE`, [req.params.id]);
    if (!leito.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Leito não encontrado' });
    }
    if (leito.rows[0].status !== 'livre') {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'Este leito está ocupado' });
    }

    const jaInternado = await client.query(
      `SELECT 1 FROM internacoes WHERE paciente_id = $1 AND data_alta IS NULL`,
      [paciente_id]
    );
    if (jaInternado.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'Este paciente já está internado' });
    }

    const { rows } = await client.query(
      `INSERT INTO internacoes (paciente_id, leito_id, motivo) VALUES ($1, $2, $3) RETURNING *`,
      [paciente_id, req.params.id, motivo ?? null]
    );
    await client.query(`UPDATE leitos SET status = 'ocupado' WHERE id = $1`, [req.params.id]);
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// Dar alta
router.post('/internacoes/:id/alta', autorizar('admin', 'medico'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE internacoes SET data_alta = NOW()
        WHERE id = $1 AND data_alta IS NULL RETURNING leito_id`,
      [req.params.id]
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Internação não encontrada ou já encerrada' });
    }
    await client.query(`UPDATE leitos SET status = 'livre' WHERE id = $1`, [rows[0].leito_id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

export default router;
