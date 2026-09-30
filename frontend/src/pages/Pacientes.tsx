import { useEffect, useState } from 'react';
import { api, iniciais, formatarSus } from '../api';

type Paciente = {
  id: string; nome: string; cpf: string; cartao_sus: string | null;
  telefone: string | null; endereco: string | null; data_nascimento: string | null;
};
const formVazio = { nome: '', cpf: '', cartao_sus: '', data_nascimento: '', telefone: '', endereco: '' };
type Campo = keyof typeof formVazio;

/* ---------- Máscaras e validações ---------- */
const digitos = (v: string) => v.replace(/\D/g, '');

const mascaraCpf = (v: string) => {
  const d = digitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

// 000 0000 0000 0000
const mascaraSus = (v: string) => {
  const d = digitos(v).slice(0, 15);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 11), d.slice(11, 15)].filter(Boolean).join(' ');
};

// (00) 0000-0000 ou (00) 00000-0000
const mascaraTelefone = (v: string) => {
  const d = digitos(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function cpfValido(v: string): boolean {
  const c = digitos(v);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (base: number) => {
    let soma = 0;
    for (let i = 0; i < base; i++) soma += Number(c[i]) * (base + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

function validar(f: typeof formVazio): Partial<Record<Campo, string>> {
  const e: Partial<Record<Campo, string>> = {};
  if (!f.nome.trim()) e.nome = 'Informe o nome completo.';
  if (!f.cpf) e.cpf = 'Informe o CPF.';
  else if (!cpfValido(f.cpf)) e.cpf = 'CPF inválido. Confira os 11 números.';
  if (f.cartao_sus && digitos(f.cartao_sus).length !== 15) e.cartao_sus = 'O cartão do SUS tem 15 números.';
  if (f.telefone && ![10, 11].includes(digitos(f.telefone).length)) e.telefone = 'Informe DDD + número (10 ou 11 números).';
  return e;
}

const estiloErro = { color: 'var(--vermelho-texto)', fontSize: 12, marginTop: 4, display: 'block' } as const;

export default function Pacientes({ irParaAtendimentos }: { irParaAtendimentos: () => void }) {
  const [lista, setLista] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(formVazio);
  const [tocado, setTocado] = useState<Partial<Record<Campo, boolean>>>({});
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  const erros = validar(form);
  const temErro = Object.keys(erros).length > 0;
  const mostrar = (c: Campo) => (tocado[c] ? erros[c] : undefined);
  const tocar = (c: Campo) => setTocado((t) => ({ ...t, [c]: true }));

  const carregar = async (termo = busca) => {
    try {
      // se a busca for só números/pontuação (CPF ou SUS), procura pelos dígitos
      const t = /^[\d.\-\s]+$/.test(termo.trim()) ? digitos(termo) : termo.trim();
      setLista(await api<Paciente[]>(`/pacientes?busca=${encodeURIComponent(t)}`));
    } catch (e) {
      setErro((e as Error).message);
    }
  };
  useEffect(() => { carregar(''); }, []);

  const cadastrar = async () => {
    setErro(''); setOk('');
    setTocado({ nome: true, cpf: true, cartao_sus: true, telefone: true });
    if (temErro) return;
    try {
      await api('/pacientes', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          nome: form.nome.trim(),
          cpf: digitos(form.cpf),
          cartao_sus: digitos(form.cartao_sus),
          telefone: digitos(form.telefone),
        }),
      });
      setForm(formVazio);
      setTocado({});
      setOk('Paciente cadastrado com sucesso');
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const abrirAtendimento = async (id: string) => {
    setErro(''); setOk('');
    try {
      await api('/atendimentos', { method: 'POST', body: JSON.stringify({ paciente_id: id }) });
      irParaAtendimentos();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  return (
    <div>
      <div className="cartao">
        <h2>Cadastrar paciente</h2>
        <div className="grade">
          <div className="campo largo">
            <label htmlFor="nome">Nome completo *</label>
            <input
              id="nome"
              autoComplete="off"
              value={form.nome}
              aria-invalid={!!mostrar('nome')}
              onBlur={() => tocar('nome')}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            {mostrar('nome') && <span style={estiloErro} role="alert">{mostrar('nome')}</span>}
          </div>
          <div className="campo">
            <label htmlFor="cpf">CPF *</label>
            <input
              id="cpf"
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
              value={form.cpf}
              aria-invalid={!!mostrar('cpf')}
              onBlur={() => tocar('cpf')}
              onChange={(e) => setForm({ ...form, cpf: mascaraCpf(e.target.value) })}
            />
            {mostrar('cpf') && <span style={estiloErro} role="alert">{mostrar('cpf')}</span>}
          </div>
          <div className="campo">
            <label htmlFor="sus">Cartão do SUS</label>
            <input
              id="sus"
              placeholder="000 0000 0000 0000"
              inputMode="numeric"
              autoComplete="off"
              maxLength={18}
              pattern="\d{3} \d{4} \d{4} \d{4}"
              value={form.cartao_sus}
              aria-invalid={!!mostrar('cartao_sus')}
              onBlur={() => tocar('cartao_sus')}
              onChange={(e) => setForm({ ...form, cartao_sus: mascaraSus(e.target.value) })}
            />
            {mostrar('cartao_sus') && <span style={estiloErro} role="alert">{mostrar('cartao_sus')}</span>}
          </div>
          <div className="campo">
            <label htmlFor="nasc">Data de nascimento</label>
            <input
              id="nasc"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.data_nascimento}
              onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="tel">Telefone</label>
            <input
              id="tel"
              type="tel"
              placeholder="(00) 00000-0000"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              value={form.telefone}
              aria-invalid={!!mostrar('telefone')}
              onBlur={() => tocar('telefone')}
              onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
            />
            {mostrar('telefone') && <span style={estiloErro} role="alert">{mostrar('telefone')}</span>}
          </div>
          <div className="campo largo">
            <label htmlFor="end">Endereço</label>
            <input
              id="end"
              placeholder="Rua, número, bairro, cidade"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </div>
        </div>
        <div className="acoes">
          <button className="verde" onClick={cadastrar} disabled={!form.nome || !form.cpf}>Cadastrar paciente</button>
        </div>
        {erro && <div className="aviso erro">{erro}</div>}
        {ok && <div className="aviso ok">{ok}</div>}
      </div>

      <div className="cartao">
        <div className="cartao-titulo">
          <h2>Pacientes cadastrados</h2>
          <div className="busca">
            <input
              placeholder="Buscar por nome, CPF ou cartão do SUS"
              aria-label="Buscar paciente por nome, CPF ou cartão do SUS"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && carregar()}
            />
            <button onClick={() => carregar()}>Buscar</button>
          </div>
        </div>
        <div className="rolagem">
          <table>
            <thead>
              <tr><th>Paciente</th><th>CPF</th><th>Cartão do SUS</th><th>Nascimento</th><th>Telefone</th><th></th></tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="pessoa">
                      <span className="avatar">{iniciais(p.nome)}</span>
                      <div>
                        <strong>{p.nome}</strong>
                        <small>{p.endereco ?? 'Endereço não informado'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{mascaraCpf(p.cpf)}</td>
                  <td>{formatarSus(p.cartao_sus)}</td>
                  <td>{p.data_nascimento ?? '-'}</td>
                  <td>{p.telefone ? mascaraTelefone(p.telefone) : '-'}</td>
                  <td><button className="secundario pequeno" onClick={() => abrirAtendimento(p.id)}>Abrir atendimento</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && <p className="vazio">Nenhum paciente encontrado.</p>}
        </div>
      </div>
    </div>
  );
}
