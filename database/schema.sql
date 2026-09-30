-- SIGM - Sistema Integrado de Gestão Hospitalar
-- Hospital Municipal Jonival Lucas
-- Todas as chaves primárias são UUID.

CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  perfil      TEXT NOT NULL CHECK (perfil IN ('admin','medico','enfermeiro','recepcao')),
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT NOT NULL,
  cpf              TEXT NOT NULL UNIQUE,
  cartao_sus       TEXT,
  data_nascimento  DATE,
  telefone         TEXT,
  endereco         TEXT,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Para bancos criados antes (adiciona os campos novos, se faltarem)
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS cartao_sus TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS endereco TEXT;

CREATE TABLE IF NOT EXISTS atendimentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id      UUID NOT NULL REFERENCES pacientes(id),
  profissional_id  UUID REFERENCES usuarios(id),
  status           TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','finalizado')),
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizado_em    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS prontuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id  UUID NOT NULL UNIQUE REFERENCES atendimentos(id),
  queixa          TEXT,
  diagnostico     TEXT,
  conduta         TEXT,
  prescricao      TEXT,
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leitos (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero  TEXT NOT NULL UNIQUE,
  setor   TEXT,
  status  TEXT NOT NULL DEFAULT 'livre' CHECK (status IN ('livre','ocupado'))
);

CREATE TABLE IF NOT EXISTS internacoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id   UUID NOT NULL REFERENCES pacientes(id),
  leito_id      UUID NOT NULL REFERENCES leitos(id),
  motivo        TEXT,
  data_entrada  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_alta     TIMESTAMPTZ
);
