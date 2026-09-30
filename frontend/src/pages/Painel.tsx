import { useEffect, useState } from 'react';
import { api, iniciais } from '../api';

type Atend = {
  id: string; status: string; criado_em: string;
  paciente_nome: string; profissional_nome: string | null;
};
type Leito = { id: string; status: string };
type Paciente = { id: string };
type Destino = 'pacientes' | 'atendimentos' | 'leitos';

const formatarData = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function Painel({ irPara }: { irPara: (aba: Destino) => void }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [atends, setAtends] = useState<Atend[]>([]);
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, a, l] = await Promise.all([
          api<Paciente[]>('/pacientes'),
          api<Atend[]>('/atendimentos'),
          api<Leito[]>('/leitos'),
        ]);
        setPacientes(p);
        setAtends(a);
        setLeitos(l);
      } catch (e) {
        setErro((e as Error).message);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const hoje = new Date().toLocaleDateString('pt-BR');
  const abertos = atends.filter((a) => a.status === 'aberto').length;
  const atendidosHoje = atends.filter((a) => new Date(a.criado_em).toLocaleDateString('pt-BR') === hoje).length;
  const livres = leitos.filter((l) => l.status === 'livre').length;
  const ocupados = leitos.length - livres;
  const taxa = leitos.length ? Math.round((ocupados / leitos.length) * 100) : 0;
  const recentes = [...atends]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, 5);

  if (carregando) return <div className="cartao"><p className="vazio">Carregando painel...</p></div>;

  return (
    <div>
      {erro && <div className="aviso erro" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="metricas">
        <div className="metrica azul">
          <span className="metrica-valor">{pacientes.length}</span>
          <span className="metrica-rotulo">Pacientes cadastrados</span>
        </div>
        <div className="metrica ambar">
          <span className="metrica-valor">{abertos}</span>
          <span className="metrica-rotulo">Atendimentos abertos</span>
        </div>
        <div className="metrica azul">
          <span className="metrica-valor">{atendidosHoje}</span>
          <span className="metrica-rotulo">Atendimentos hoje</span>
        </div>
        <div className="metrica verde">
          <span className="metrica-valor">{livres}</span>
          <span className="metrica-rotulo">Leitos livres</span>
        </div>
        <div className="metrica vermelho">
          <span className="metrica-valor">{ocupados}</span>
          <span className="metrica-rotulo">Leitos ocupados</span>
        </div>
      </div>

      <div className="dois">
        <div className="cartao">
          <div className="cartao-titulo">
            <h2>Ocupação dos leitos</h2>
            <button className="secundario pequeno" onClick={() => irPara('leitos')}>Ver leitos</button>
          </div>
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ fontSize: 28 }}>{taxa}%</strong>{' '}
            <small>{ocupados} de {leitos.length} leitos ocupados</small>
          </p>
          <div
            className="barra"
            role="progressbar"
            aria-label="Taxa de ocupação dos leitos"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={taxa}
          >
            <div className="barra-preenchida" style={{ width: `${taxa}%` }} />
          </div>
        </div>

        <div className="cartao">
          <div className="cartao-titulo">
            <h2>Últimos atendimentos</h2>
            <button className="secundario pequeno" onClick={() => irPara('atendimentos')}>Ver todos</button>
          </div>
          {recentes.length === 0 && <p className="vazio">Nenhum atendimento ainda.</p>}
          {recentes.map((a) => (
            <div key={a.id} className="recente">
              <div className="pessoa">
                <span className="avatar">{iniciais(a.paciente_nome)}</span>
                <div>
                  <strong>{a.paciente_nome}</strong>
                  <small>{formatarData(a.criado_em)}</small>
                </div>
              </div>
              <span className={'selo ' + a.status}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
