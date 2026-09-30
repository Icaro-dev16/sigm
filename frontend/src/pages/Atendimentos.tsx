import { useEffect, useMemo, useState } from 'react';
import { api, iniciais } from '../api';
import Logo from '../Logo';

type Atend = {
  id: string; status: string; criado_em: string; finalizado_em: string | null;
  paciente_id: string; paciente_nome: string; profissional_nome: string | null;
  diagnostico: string | null;
};
type Form = { queixa: string; diagnostico: string; conduta: string; prescricao: string };
const vazio: Form = { queixa: '', diagnostico: '', conduta: '', prescricao: '' };
const campos: { chave: keyof Form; rotulo: string }[] = [
  { chave: 'queixa', rotulo: 'Queixa principal' },
  { chave: 'diagnostico', rotulo: 'Diagnóstico' },
  { chave: 'conduta', rotulo: 'Conduta' },
  { chave: 'prescricao', rotulo: 'Prescrição' },
];

const formatarData = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// remove acentos e deixa minúsculo, para a busca não depender disso
const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Atendimentos() {
  const [lista, setLista] = useState<Atend[]>([]);
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState<'todos' | 'aberto' | 'finalizado'>('todos');
  const [confirmando, setConfirmando] = useState(false);
  const [sel, setSel] = useState<Atend | null>(null);
  const [historico, setHistorico] = useState<Atend[]>([]);
  const [form, setForm] = useState<Form>(vazio);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  const carregar = async () => {
    try {
      setLista(await api<Atend[]>('/atendimentos'));
    } catch (e) {
      setErro((e as Error).message);
    }
  };
  useEffect(() => { carregar(); }, []);

  // filtra por nome, data (ex.: 29/09), situação ou profissional
  const filtrada = useMemo(() => {
    const termo = normalizar(busca.trim());
    return lista.filter((a) => {
      if (situacao !== 'todos' && a.status !== situacao) return false;
      if (!termo) return true;
      return normalizar(
        [a.paciente_nome, formatarData(a.criado_em), a.status, a.profissional_nome ?? ''].join(' ')
      ).includes(termo);
    });
  }, [lista, busca, situacao]);

  const contagem = {
    todos: lista.length,
    aberto: lista.filter((a) => a.status === 'aberto').length,
    finalizado: lista.filter((a) => a.status === 'finalizado').length,
  };
  const filtros: { id: 'todos' | 'aberto' | 'finalizado'; rotulo: string }[] = [
    { id: 'todos', rotulo: 'Todos' },
    { id: 'aberto', rotulo: 'Abertos' },
    { id: 'finalizado', rotulo: 'Finalizados' },
  ];

  const carregarHistorico = async (pacienteId: string) => {
    try {
      setHistorico(await api<Atend[]>(`/atendimentos?paciente_id=${pacienteId}`));
    } catch {
      setHistorico([]);
    }
  };

  const abrir = async (a: Atend) => {
    setErro(''); setOk(''); setConfirmando(false); setSel(a);
    carregarHistorico(a.paciente_id);
    try {
      const d = await api<any>(`/atendimentos/${a.id}`);
      setForm({
        queixa: d.queixa ?? '', diagnostico: d.diagnostico ?? '',
        conduta: d.conduta ?? '', prescricao: d.prescricao ?? '',
      });
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const salvar = async () => {
    if (!sel) return;
    setErro(''); setOk('');
    try {
      await api(`/atendimentos/${sel.id}/prontuario`, { method: 'PUT', body: JSON.stringify(form) });
      setOk('Prontuário salvo');
      carregarHistorico(sel.paciente_id);
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const finalizar = async () => {
    if (!sel) return;
    setErro(''); setOk('');
    try {
      const r = await api<any>(`/atendimentos/${sel.id}/finalizar`, { method: 'PATCH' });
      setSel({ ...sel, status: 'finalizado', finalizado_em: r.finalizado_em });
      setConfirmando(false);
      setOk('Atendimento finalizado');
      carregar();
      carregarHistorico(sel.paciente_id);
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  return (
    <div className="dois">
      <div className="cartao nao-imprimir">
        <h2>Atendimentos</h2>
        <div className="campo" style={{ marginBottom: 12 }}>
          <input
            type="search"
            placeholder="Pesquisar por nome, data (ex.: 29/09) ou situação"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="filtros" role="group" aria-label="Filtrar por situação">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              className={'pequeno' + (situacao === f.id ? '' : ' secundario')}
              aria-pressed={situacao === f.id}
              onClick={() => setSituacao(f.id)}
            >
              {f.rotulo} ({contagem[f.id]})
            </button>
          ))}
        </div>
        {lista.length === 0 && <p className="vazio">Nenhum atendimento. Abra um pela aba Pacientes.</p>}
        {lista.length > 0 && filtrada.length === 0 && (
          <p className="vazio">Nenhum atendimento encontrado para "{busca}".</p>
        )}
        {filtrada.map((a) => (
          <div key={a.id} className={'item' + (sel?.id === a.id ? ' sel' : '')} onClick={() => abrir(a)}>
            <span className="avatar">{iniciais(a.paciente_nome)}</span>
            <div className="info">
              <strong>{a.paciente_nome}</strong>
              <small>Atendido em {formatarData(a.criado_em)}</small>
            </div>
            <span className={'selo ' + a.status}>{a.status}</span>
          </div>
        ))}
        {!sel && erro && <div className="aviso erro">{erro}</div>}
      </div>

      <div>
        <div className="cartao">
          {!sel && <p className="vazio">Selecione um atendimento para ver o prontuário.</p>}
          {sel && (
            <>
              <div className="nao-imprimir">
              <div className="cartao-titulo">
                <h2>Prontuário – {sel.paciente_nome}</h2>
                <span className={'selo ' + sel.status}>{sel.status}</span>
              </div>
              <p style={{ margin: '0 0 14px' }}>
                <small>
                  Atendido em {formatarData(sel.criado_em)}
                  {sel.finalizado_em && ` · Finalizado em ${formatarData(sel.finalizado_em)}`}
                  {sel.profissional_nome && ` · ${sel.profissional_nome}`}
                </small>
              </p>
              <div className="campos-prontuario">
                {campos.map((c) => (
                  <div className="campo" key={c.chave}>
                    <label>{c.rotulo}</label>
                    <textarea rows={3} value={form[c.chave]} onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="acoes">
                <button onClick={salvar}>Salvar prontuário</button>
                <button className="secundario" onClick={() => window.print()}>Imprimir prontuário</button>
                {sel.status === 'aberto' && !confirmando && (
                  <button className="secundario" onClick={() => setConfirmando(true)}>Finalizar atendimento</button>
                )}
                {sel.status === 'aberto' && confirmando && (
                  <>
                    <span role="alert"><strong>Finalizar este atendimento?</strong></span>
                    <button className="verde" onClick={finalizar}>Sim, finalizar</button>
                    <button className="secundario" onClick={() => setConfirmando(false)}>Cancelar</button>
                  </>
                )}
              </div>
              {erro && <div className="aviso erro">{erro}</div>}
              {ok && <div className="aviso ok">{ok}</div>}
              </div>

              {/* Versão que aparece só na impressão */}
              <div className="so-impressao">
                <div className="impr-cab">
                  <Logo tamanho={56} />
                  <div>
                    <h1>Hospital Municipal Jonival Lucas</h1>
                    <p>Prefeitura de Morpará – BA · Prontuário de atendimento</p>
                  </div>
                </div>
                <div className="impr-dados">
                  <div><strong>Paciente:</strong> {sel.paciente_nome}</div>
                  <div><strong>Situação:</strong> {sel.status}</div>
                  <div><strong>Atendido em:</strong> {formatarData(sel.criado_em)}</div>
                  <div><strong>Finalizado em:</strong> {sel.finalizado_em ? formatarData(sel.finalizado_em) : '-'}</div>
                  <div><strong>Profissional:</strong> {sel.profissional_nome ?? '-'}</div>
                </div>
                {campos.map((c) => (
                  <div className="impr-secao" key={c.chave}>
                    <h3>{c.rotulo}</h3>
                    <p>{form[c.chave] || '-'}</p>
                  </div>
                ))}
                <div className="impr-assinatura">Assinatura do profissional</div>
              </div>
            </>
          )}
        </div>

        {sel && (
          <div className="cartao nao-imprimir">
            <div className="cartao-titulo">
              <h2>Histórico de visitas</h2>
              <small>{historico.length} {historico.length === 1 ? 'visita' : 'visitas'} ao hospital</small>
            </div>
            <div className="rolagem">
              <table>
                <thead>
                  <tr><th>Data</th><th>Situação</th><th>Diagnóstico</th></tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.id}>
                      <td>{formatarData(h.criado_em)}{h.id === sel.id && ' (atual)'}</td>
                      <td><span className={'selo ' + h.status}>{h.status}</span></td>
                      <td>{h.diagnostico || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
