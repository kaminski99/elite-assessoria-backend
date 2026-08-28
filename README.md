# Elite Assessoria — Backend

API REST em Node.js + Express + PostgreSQL para a plataforma Elite Assessoria
(gestão de clínicas médicas com a IA de triagem "Lanna" via WhatsApp).

## Stack

- Node.js + Express
- PostgreSQL (driver `pg`, sem ORM)
- Autenticação: JWT (`jsonwebtoken`) + senha com hash (`bcryptjs`)
- Hospedagem: Railway · Deploy via GitHub

## Estrutura de pastas

```
src/
  routes/          rotas Express (uma por recurso)
  controllers/      lógica de cada rota (validação + resposta)
  models/          acesso ao banco (queries SQL)
  middleware/
    auth.js        autenticação JWT + chave opcional da Lanna
  db/
    connection.js  pool de conexão com o PostgreSQL
    migrations.js  criação das tabelas
  utils/
    asyncHandler.js utilitário para não repetir try/catch nas rotas
index.js           ponto de entrada (Express app)
package.json
.env.example
```

## Rodando localmente

```bash
npm install
cp .env.example .env
# edite o .env com sua DATABASE_URL local (ou do Railway) e um JWT_SECRET
npm run migrate   # cria as tabelas
npm run dev       # sobe o servidor com nodemon em http://localhost:3000
```

### Criando a primeira clínica

O escopo original não previa uma rota de cadastro de clínica, mas ela é
necessária: sem uma clínica com senha, ninguém consegue fazer login. Use:

```bash
curl -X POST http://localhost:3000/api/clinicas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Clínica Bem Estar","plano":"Pro","whatsapp":"11999990000","senha":"minhasenha123"}'
```

Resposta: `{ id, nome, plano, whatsapp, criado_em }`. Guarde o `id` — é o
`clinica_id` usado em todas as outras rotas.

### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"clinica_id": 1, "senha": "minhasenha123"}'
```

Resposta: `{ token, clinica: { id, nome, plano } }`. Use o token nas rotas
protegidas: header `Authorization: Bearer <token>`. Expira em 24h.

## Autenticação e quem acessa o quê

- **Painel da clínica (frontend)**: faz login em `/api/login` e usa o token
  JWT em todas as rotas de leitura/gestão (dashboard, agendamentos, pacientes,
  triagens). Por segurança, a clínica sempre é identificada pelo `clinica_id`
  contido no token — não pelo parâmetro `clinica_id` da URL, mesmo que o
  frontend continue enviando esse parâmetro.
- **Lanna (bot de WhatsApp)**: não faz login como uma clínica, então as rotas
  que ela chama ficam abertas por padrão: `GET /api/disponibilidade`,
  `POST /api/agendar`, `POST /api/triagens` e `POST /api/conversas`. O escopo
  original citava só as duas primeiras como públicas, mas as duas últimas
  também são "chamadas pela Lanna" — deixei as quatro no mesmo grupo por
  consistência. Se quiser travar esse grupo, defina `LANNA_API_KEY` no `.env`
  e passe o mesmo valor no header `x-lanna-key` em toda chamada da Lanna;
  sem essa variável definida, elas continuam abertas como no pedido original.

## Rotas

Todas as respostas são JSON. Erros seguem o formato `{ "erro": "mensagem em português" }`.

### Autenticação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/clinicas` | pública | Cria uma clínica (`nome`, `senha` obrigatórios; `plano`, `whatsapp` opcionais) |
| POST | `/api/login` | pública | `{ clinica_id, senha }` → `{ token, clinica }` |

### Agendamentos

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/disponibilidade?data=&clinica_id=` | pública (Lanna) | Horários livres no dia |
| POST | `/api/agendar` | pública (Lanna) | Cria agendamento (`status: Pendente`) + cria/atualiza paciente |
| GET | `/api/agendamentos?data=` | JWT | Lista agendamentos da clínica (filtra por data se enviada) |
| PUT | `/api/agendamentos/:id/confirmar` | JWT | Muda status para `Confirmado` |
| PUT | `/api/agendamentos/:id/cancelar` | JWT | Muda status para `Cancelado` |

`POST /api/agendar` — body:

```json
{
  "clinica_id": 1,
  "paciente_nome": "Ana Souza",
  "paciente_telefone": "11988887777",
  "servico": "Consulta de rotina",
  "convenio": "Unimed",
  "data": "2026-08-28",
  "hora": "09:00",
  "origem": "lanna"
}
```

Regras aplicadas: campos obrigatórios (`clinica_id`, `paciente_nome`,
`paciente_telefone`, `servico`, `data`, `hora`); horário precisa estar dentro
do funcionamento (seg-sex 08h-18h, sáb 08h-12h, dom fechado); se o horário já
estiver ocupado por outro agendamento não cancelado, retorna `409`.

### Pacientes

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/pacientes` | JWT | Lista pacientes da clínica |
| GET | `/api/pacientes/:id/historico` | JWT | Dados do paciente + todos os agendamentos dele |

### Triagens

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/triagens` | JWT | Lista triagens com status `Pendente` |
| POST | `/api/triagens` | pública (Lanna) | Cria triagem quando o lead não confirma horário |
| PUT | `/api/triagens/:id/aprovar` | JWT | Aprova a triagem e cria o agendamento |

`PUT /api/triagens/:id/aprovar` — body (não estava especificado no escopo
original; é necessário informar o horário escolhido para o agendamento):

```json
{ "data": "2026-08-28", "hora": "14:00" }
```

### Conversas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/conversas` | pública (Lanna) | Registra uma interação da Lanna (`clinica_id`, `paciente_nome`, `paciente_telefone` obrigatórios; `tipo`, `mensagem` opcionais) |

### Dashboard

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/dashboard?data=` | JWT | `{ consultas_hoje, atendidos_ia, pacientes_fila, taxa_confirmacao }` |

- `consultas_hoje`: agendamentos do dia que não estão cancelados
- `atendidos_ia`: conversas registradas pela Lanna nesse dia
- `pacientes_fila`: triagens pendentes de aprovação
- `taxa_confirmacao`: % de agendamentos do dia com status `Confirmado`

## Modelo de dados

```
clinicas      (id, nome, plano, whatsapp, senha_hash, criado_em)
pacientes     (id, clinica_id, nome, telefone, convenio, status, criado_em)
agendamentos  (id, clinica_id, paciente_nome, paciente_telefone, servico,
               convenio, data, hora, status, origem, criado_em)
triagens      (id, clinica_id, paciente_nome, paciente_telefone, servico,
               status, criado_em)
conversas     (id, clinica_id, paciente_nome, paciente_telefone, tipo,
               mensagem, criado_em)
```

Duas colunas foram acrescentadas ao esquema pedido, ambas necessárias para o
sistema funcionar:

- `clinicas.senha_hash` — sem ela não há como autenticar (`POST /api/login`
  exige uma senha para comparar).
- `conversas.mensagem` — o corpo de `POST /api/conversas` do escopo original
  inclui `mensagem`, mas a tabela `conversas` não tinha coluna para
  guardá-la; sem essa coluna o conteúdo da conversa se perderia.

`pacientes` tem uma constraint `UNIQUE (clinica_id, telefone)`: isso é o que
permite `POST /api/agendar` "criar ou atualizar" o paciente automaticamente.

## Deploy no Railway

1. **Suba este projeto para o GitHub** (repositório próprio ou dentro do
   monorepo do frontend, desde que a raiz do serviço no Railway aponte para
   esta pasta).

2. **Crie um projeto no Railway** → "New Project" → "Deploy from GitHub repo"
   → selecione o repositório.

3. **Adicione o PostgreSQL**: dentro do projeto, "New" → "Database" →
   "Add PostgreSQL". O Railway cria o banco e expõe a variável `DATABASE_URL`
   automaticamente para os outros serviços do mesmo projeto.

4. **Configure as variáveis de ambiente** no serviço do backend (aba
   "Variables"):
   - `DATABASE_URL` → referencie a variável do plugin PostgreSQL
     (`${{Postgres.DATABASE_URL}}` no seletor de referência do Railway, ou
     cole a "Postgres Connection URL" manualmente)
   - `JWT_SECRET` → uma string longa e aleatória (ex: gerada com
     `openssl rand -hex 32`)
   - `PORT` → o Railway já injeta a própria porta automaticamente; não é
     obrigatório definir, mas pode deixar `3000` como fallback (o código já
     usa `process.env.PORT || 3000`)
   - `LANNA_API_KEY` → opcional, só se quiser travar as rotas da Lanna

5. **Rode as migrações** depois do primeiro deploy. Duas opções:
   - Pelo próprio Railway: aba "Settings" do serviço → defina um comando de
     deploy único, ou abra um shell do serviço (Railway CLI: `railway run
     npm run migrate`).
   - Local, apontando para o banco do Railway: copie a `DATABASE_URL` do
     plugin PostgreSQL para o seu `.env` local e rode `npm run migrate` da
     sua máquina.

6. **Deploy automático**: qualquer push no branch conectado dispara um novo
   build/deploy no Railway. O Railway detecta o `package.json` e roda
   `npm install` seguido de `npm start` automaticamente.

7. **Teste**: acesse a URL pública gerada pelo Railway
   (`https://seu-servico.up.railway.app/`) — deve responder
   `{"status":"ok","servico":"Elite Assessoria API"}`.

8. **Conecte o frontend**: aponte as chamadas `fetch`/`axios` do
   `clinica_medflow.html` (ou de onde for consumir a API) para essa URL do
   Railway, usando o token retornado por `/api/login` nas rotas protegidas.

## Notas de segurança

- Senhas de clínica nunca são armazenadas em texto puro — apenas o hash
  (`bcryptjs`, custo 10).
- Tokens JWT expiram em 24h; o frontend deve tratar `401` refazendo o login.
- Todas as rotas que recebem `:id` verificam que o registro pertence à
  clínica do token antes de retornar ou alterar qualquer dado — isso evita
  que uma clínica veja ou edite dados de outra.
