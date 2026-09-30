import { useEffect, useState } from 'react';
import { api } from '../api';

type Leito = {
  id: string; numero: string; setor: string | null; status: string;
  internacao_id: string | null; paciente_nome: string | null;
};
type Paciente = { id: string; nome: string };

export default function Leitos() {
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [escolhido, setEscolhido] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const carregar = async () => {
    try {
      const [l, p] = await Promise.all([api<Leito[]>('/leitos'), api<Paciente[]>('/pacientes')]);
      setLeitos(l);
      setPacientes(p);
    } catch (e) {
      setErro((e as Error).message);
    }
  };
  useEffect(() => { carregar(); }, []);

  const internar = async (leitoId: string) => {
    setErro('');
    try {
      await api(`/leitos/${leitoId}/internar`, {
        method: 'POST',
        body: JSON.stringify({ paciente_id: escolhido[leitoId] }),
      });
    } catch (e) {
      setErro((e as Error).message);
    }
    carregar();
  };

  const darAlta = async (internacaoId: string) => {
    setErro('');
    setConfirmando(null);
    try {
      await api(`/leitos/internacoes/${internacaoId}/alta`, { method: 'POST' });
    } catch (e) {
      setErro((e as Error).message);
    }
    carregar();
  };

  const livres = leitos.filter((l) => l.status === 'livre').length;
  const ocupados = leitos.length - livres;

  return (
    <div className="cartao">
      <div className="cartao-titulo">
        <h2>Leitos e internações</h2>
        <div className="resumo">
          <span className="selo livre">{livres} livres</span>
          <span className="selo ocupado">{ocupados} ocupados</span>
        </div>
      </div>
      {erro && <div className="aviso erro" style={{ marginBottom: 14 }}>{erro}</div>}
      <div className="leitos">
        {leitos.map((l) => (
          <div key={l.id} className={'leito ' + l.status}>
            <div className="leito-topo">
              <strong>Leito {l.numero}</strong>
              <span className={'selo ' + l.status}>{l.status === 'livre' ? 'Livre' : 'Ocupado'}</span>
            </div>
            <small>{l.setor}</small>
            {l.status === 'livre' ? (
              <div className="linha-form">
                <select value={escolhido[l.id] ?? ''} onChange={(e) => setEscolhido({ ...escolhido, [l.id]: e.target.value })}>
                  <option value="">Escolha o paciente...</option>
                  {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <button className="verde" disabled={!escolhido[l.id]} onClick={() => internar(l.id)}>Internar</button>
              </div>
            ) : (
              <>
                <div className="leito-paciente">{l.paciente_nome}</div>
                {confirmando === l.id ? (
                  <div className="linha-form" role="alert">
                    <strong>Dar alta a {l.paciente_nome}?</strong>
                    <div className="acoes" style={{ marginTop: 0 }}>
                      <button className="verde pequeno" onClick={() => darAlta(l.internacao_id!)}>Sim, dar alta</button>
                      <button className="secundario pequeno" onClick={() => setConfirmando(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button className="secundario" onClick={() => setConfirmando(l.id)}>Dar alta</button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
