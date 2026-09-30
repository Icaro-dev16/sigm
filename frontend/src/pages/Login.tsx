import { useState, FormEvent } from 'react';
import { api, Usuario } from '../api';
import Logo from '../Logo';

export default function Login({ onLogin }: { onLogin: (u: Usuario) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      const d = await api<{ token: string; usuario: Usuario }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      localStorage.setItem('token', d.token);
      localStorage.setItem('usuario', JSON.stringify(d.usuario));
      onLogin(d.usuario);
    } catch (err) {
      setErro((err as Error).message);
    }
  };

  return (
    <div className="login-pagina">
      <div className="login-lado">
        <Logo tamanho={64} />
        <h1>Hospital Municipal Jonival Lucas</h1>
        <p>Sistema Integrado de Gestão Hospitalar</p>
      </div>
      <form className="login-form" onSubmit={entrar}>
        <h2>Acesse sua conta</h2>
        <div className="campo">
          <label>E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
        </div>
        <div className="campo">
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha" />
        </div>
        <button type="submit">Entrar</button>
        {erro && <div className="aviso erro">{erro}</div>}
      </form>
    </div>
  );
}
