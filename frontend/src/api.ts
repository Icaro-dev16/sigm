export type Usuario = { id: string; nome: string; perfil: string };

export async function api<T = any>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const resposta = await fetch('/api' + caminho, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opcoes.headers || {}),
    },
  });
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(dados?.erro || 'Erro na requisição');
  return dados as T;
}

// Iniciais para o círculo do avatar (ignora títulos como "Dra.")
export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter((p) => p && !p.endsWith('.'))
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function nomePerfil(perfil: string): string {
  const nomes: Record<string, string> = {
    admin: 'Administrador',
    medico: 'Médico(a)',
    enfermeiro: 'Enfermeiro(a)',
    recepcao: 'Recepção',
  };
  return nomes[perfil] ?? perfil;
}

// 700000000000001 -> 700 0000 0000 0001
export function formatarSus(sus: string | null): string {
  if (!sus) return '-';
  const d = sus.replace(/\D/g, '');
  if (d.length !== 15) return sus;
  return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)} ${d.slice(11)}`;
}
