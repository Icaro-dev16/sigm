import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UsuarioToken {
  id: string;
  nome: string;
  perfil: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UsuarioToken;
    }
  }
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  try {
    req.user = jwt.verify(cabecalho.slice(7), process.env.JWT_SECRET as string) as unknown as UsuarioToken;
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

export function autorizar(...perfis: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !perfis.includes(req.user.perfil)) {
      return res.status(403).json({ erro: 'Seu perfil não tem permissão para esta ação' });
    }
    next();
  };
}
