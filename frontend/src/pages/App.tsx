import { useEffect, useState } from 'react';
import { Usuario, iniciais, nomePerfil } from './api';
import Logo from './Logo';
import Login from './pages/Login';
import Pacientes from './pages/Pacientes';
import Atendimentos from './pages/Atendimentos';
import Leitos from './pages/Leitos';
import Painel from './pages/Painel';

type Aba = 'painel' | 'pacientes' | 'atendimentos' | 'leitos';
type Tema = 'claro' | 'escuro';

// Usa a escolha salva; se não houver, segue a preferência do sistema
function temaInicial(): Tema {
  const salvo = localStorage.getItem('tema');
  if (salvo === 'claro' || salvo === 'escuro') return salvo;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

export default function App() {
  const salvo = localStorage.getItem('usuario');
  const [usuario, setUsuario] = useState<Usuario | null>(salvo ? JSON.parse(salvo) : null);
  const [aba, setAba] = useState<Aba>('painel');
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'escuro' ? 'dark' : 'light';
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(tema === 'escuro' ? 'claro' : 'escuro');

  const botaoTema = (flutuante = false) => (
    <button
      type="button"
      className={'tema' + (flutuante ? ' flutuante' : '')}
      onClick={alternarTema}
      aria-label={tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      <span aria-hidden="true">{tema === 'escuro' ? '☀️' : '🌙'}</span>
      {tema === 'escuro' ? 'Claro' : 'Escuro'}
    </button>
  );

  if (!usuario) {
    return (
      <>
        {botaoTema(true)}
        <Login onLogin={setUsuario} />
      </>
    );
  }

  const sair = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const abas: { id: Aba; titulo: string }[] = [
    { id: 'painel', titulo: 'Painel' },
    { id: 'pacientes', titulo: 'Pacientes' },
    { id: 'atendimentos', titulo: 'Atendimentos' },
    { id: 'leitos', titulo: 'Leitos' },
  ];

  return (
    <div>
      <header className="topo">
        <div className="marca">
          <Logo tamanho={42} />
          <div>
            <strong>Hospital Municipal Jonival Lucas</strong>
            <small>Sistema Integrado de Gestão Hospitalar</small>
          </div>
        </div>
        <div className="usuario">
          <span className="avatar">{iniciais(usuario.nome)}</span>
          <div className="usuario-texto">
            <strong>{usuario.nome}</strong>
            <small>{nomePerfil(usuario.perfil)}</small>
          </div>
          {botaoTema()}
          <button className="sair" onClick={sair}>Sair</button>
        </div>
      </header>

      <nav className="abas" aria-label="Seções do sistema">
        {abas.map((a) => (
          <button
            key={a.id}
            className={aba === a.id ? 'ativa' : ''}
            onClick={() => setAba(a.id)}
            aria-current={aba === a.id ? 'page' : undefined}
          >
            {a.titulo}
          </button>
        ))}
      </nav>

      <main>
        {aba === 'painel' && <Painel irPara={setAba} />}
        {aba === 'pacientes' && <Pacientes irParaAtendimentos={() => setAba('atendimentos')} />}
        {aba === 'atendimentos' && <Atendimentos />}
        {aba === 'leitos' && <Leitos />}
      </main>
    </div>
  );
}
