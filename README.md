# FlowState CMS

CMS de exercícios (treinos) da Trilha de Aprendizado. Professor verificado cadastra treinos, o curador FlowState revisa e publica, e o treino publicado aparece no app sem nova build. Ticket FLOW-438 (épico FLOW-373).

## Stack

- Next.js 16 (App Router), TypeScript strict.
- Tailwind CSS 4 (tokens via `@theme` em `src/app/globals.css`, extraídos de `app/src/constants/theme.ts`).
- Zod para validação (env e schemas de formulário).
- React Hook Form + `@hookform/resolvers`.
- Vitest + Testing Library (unitário e componentes), Playwright (E2E local).
- Node 24, npm.

## Como rodar

```bash
cp .env.example .env.local
npm install
npm run dev -- -p 3001
```

A API roda em `http://localhost:3000`; o CMS sobe na porta `3001` para não colidir.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento. |
| `npm run build` | Build de produção (`output: 'standalone'`). |
| `npm start` | Sobe o build de produção. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Gera tipos de rota (`next typegen`) e roda `tsc --noEmit`. |
| `npm test` | Vitest (unitário). |
| `npm run test:watch` | Vitest em modo watch. |
| `npm run e2e` | Playwright (local, precisa da API e do Postgres locais). |
| `npm run format` | Prettier `--write`. |

## Arquitetura: CMS como BFF fino sobre a API

```
Navegador ──(cookie httpOnly)──> CMS Next.js (Server Components + Server Actions)
                                    │  Authorization: Bearer <token>
                                    ▼
                                 API NestJS /api/v1/cms/trilha/*  ──> Postgres
Navegador ──PUT pré-assinado──────> S3 privado
```

O CMS não acessa banco nem regra de negócio diretamente. Toda autorização e regra de transição de status vive na API (fonte única para app e CMS). O CMS só monta a tela, valida formulário no cliente com o mesmo schema Zod do DTO, chama a API pelo servidor e guarda sessão em cookie.

**Regra fixa: o token de acesso nunca chega ao JavaScript do navegador.** Ele fica em cookie `fs_cms_session` (`httpOnly`, `sameSite=lax`, `secure` em produção, `path=/`), lido só em Server Components e Server Actions. Se a API responder 401, o cookie é apagado e o usuário volta para `/login`.

## Decisões de design (D1..D6, do spec `2026-09-23-cms-trilha-design.md`)

- **D1**: professor verificado cria rascunho e submete; curador revisa e publica. O CMS reflete esse fluxo em duas telas (`treinos` do autor, `revisao` do curador).
- **D2**: papel `admin` existe só no banco, atribuído por SQL. O CMS não tem tela de gestão de papel; `GET /acesso` decide o que a UI mostra (`canEdit`, `canCurate`).
- **D3**: MVP edita só treinos. Pilares são só leitura (vêm do código da API); não há tela de edição de pilar ou Flow Check no CMS.
- **D4**: vídeo de demonstração por upload direto do navegador a um S3 privado via URL pré-assinada (PUT). O CMS pede a URL ao servidor, o navegador faz o PUT, o servidor confirma.
- **D5**: existe uma única Trilha oficial; autoria é registrada por treino (`author`).
- **D6**: hospedagem prevista no Railway, mesmo padrão da API (`Dockerfile` + `railway.json`); deploy em si fica fora desta entrega.

## Variáveis de ambiente

Ver `.env.example`. `API_BASE_URL` é obrigatória e validada com Zod na primeira leitura (`src/lib/env.ts`); ausência ou valor que não é URL derruba a aplicação com mensagem clara em vez de falhar silenciosamente depois.

## E2E: pré-requisitos

`npm run e2e` (Playwright) sobe o próprio CMS (`npm run build && npm run start -p 3001`), mas depende de infraestrutura local que não é gerenciada pelo teste:

- **API rodando** em `API_BASE_URL` (padrão `http://localhost:3000/api/v1`), com as migrations já aplicadas. O teste não sobe nem reinicia a API.
- **Postgres no container docker `flowstate-postgres`** (mesmo container usado pela API local). O `globalSetup` (`e2e/setup/seed-users.ts`) roda `docker exec flowstate-postgres psql ...` para promover usuários; sem o container acessível por esse nome, o setup falha.
- **Repo da API como irmão do repo do CMS** (`../api` a partir da raiz do CMS), com um `.env` legível contendo `DB_USERNAME` e `DB_NAME` (usados só para montar o comando `psql`, nunca impressos). Se o layout local for outro, aponte o caminho com a variável `E2E_API_REPO_PATH`.
- **Chromium do Playwright instalado uma vez**: `npx playwright install chromium`.

O que o `globalSetup` faz antes dos testes:

1. Registra dois usuários descartáveis via `POST /auth/register`: `e2e-prof-<timestamp>@flowstate.test` (papel professor) e `e2e-admin-<timestamp>@flowstate.test`.
2. Verifica o professor (`professor_profiles.verified = true` por SQL) e dá o papel `admin` ao segundo usuário (também por SQL), o mesmo caminho documentado em `api/src/modules/cms-trilha/CLAUDE.md`.
3. Grava as credenciais em `e2e/.auth/users.json` (gitignored, nunca aparece em log).

O cenário principal (professor cria e submete, admin publica) cria um treino de teste (código `E2E<sufixo>`) e o **arquiva ao final** via API, para não deixar debris na trilha local. Se a API local cair no meio da suíte, pode sobrar um treino de teste em `draft`/`review`/`published`; nesse caso, arquive manualmente pela tela do CMS ou por `POST /cms/trilha/treinos/:id/arquivar`.
