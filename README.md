# SIGM – Sistema Integrado de Gestão Hospitalar

Hospital fictício de Morpará, Bahia. Projeto de faculdade.

**Tecnologias:** React + TypeScript (frontend), Node.js + TypeScript + Express (backend), PostgreSQL com chaves UUID, autenticação JWT + bcrypt.

**Funcionalidades:** login com perfis (admin, médico, enfermeiro, recepção), cadastro e busca de pacientes, atendimentos com prontuário, leitos com internação e alta.

---

## COMO RODAR (5 passos)

Pré-requisitos: Node.js e PostgreSQL instalados. Anote a senha do usuário `postgres`.

### 1) Configurar o backend
Abra um terminal na pasta `backend` e rode:

    copy .env.example .env

Abra o arquivo `.env` e troque `SUASENHA` pela senha do seu PostgreSQL.

### 2) Instalar e criar o banco
Ainda na pasta `backend`:

    npm install
    npm run setup

O `setup` cria o banco `sigm`, as tabelas e os dados de teste.

### 3) Ligar o backend
    npm run dev

Deixe esse terminal aberto. Deve aparecer: "SIGM backend rodando em http://localhost:3000".

### 4) Ligar o frontend
Abra OUTRO terminal, na pasta `frontend`:

    npm install
    npm run dev

### 5) Abrir no navegador
Acesse http://localhost:5173

## Usuários de teste
| Perfil | E-mail | Senha |
|---|---|---|
| Admin | admin@sigm.com | admin123 |
| Médico | medico@sigm.com | medico123 |
| Enfermeiro | enfermeiro@sigm.com | enfermeiro123 |
| Recepção | recepcao@sigm.com | recepcao123 |

## Fluxo de demonstração
1. Entre como **recepcao**, cadastre um paciente e clique em **Abrir atendimento**.
2. Entre como **medico**, abra o atendimento, preencha o prontuário, salve e finalize.
3. Na aba **Leitos**, interne um paciente e depois dê alta.

## Permissões
- Cadastrar paciente: admin, recepção, médico
- Abrir atendimento: admin, médico, recepção
- Editar prontuário: admin, médico, enfermeiro
- Finalizar atendimento e dar alta: admin, médico
- Internar: admin, médico, enfermeiro

## Regras de negócio
- Leito só recebe paciente se estiver livre.
- Paciente não pode ter duas internações abertas.
- Internar e dar alta são operações transacionais.
- CPF é único por paciente.

## Estrutura
    database/schema.sql        tabelas (UUID)
    backend/src/               servidor, rotas e script de setup
    frontend/src/pages/        telas (Login, Pacientes, Atendimentos, Leitos)
