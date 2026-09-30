import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body ?? {};
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha' });

  const { rows } = await pool.query(
    `SELECT id, nome, perfil, senha_hash FROM usuarios WHERE email = $1 AND ativo = TRUE`,
    [String(email).toLowerCase().trim()]
  );
  const u = rows[0];
  if (!u || !(await bcrypt.compare(String(senha), u.senha_hash))) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }

  const usuario = { id: u.id, nome: u.nome, perfil: u.perfil };
  const token = jwt.sign(usuario, process.env.JWT_SECRET as string, { expiresIn: '8h' });
  res.json({ token, usuario });
});

export default router;
