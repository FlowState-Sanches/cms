# FlowState CMS

CMS de exercícios (treinos) da Trilha de Aprendizado e de gestão operacional do FlowState. Professor verificado cadastra treinos, o curador FlowState revisa e publica, e o treino publicado aparece no app sem nova build (FLOW-438, épico FLOW-373). O admin também acompanha a operação do dia (painel com aulas, eventos e mídias) e gere professores, alunos, fotógrafos, admins e mídias (épico GST).

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
                                 API NestJS /api/v1/cms/trilha/* e /api/v1/cms/*  ──> Postgres
Navegador ──PUT pré-assinado──────> S3 privado
```

O CMS não acessa banco nem regra de negócio diretamente. Toda autorização e regra de transição de status vive na API (fonte única para app e CMS). O CMS só monta a tela, valida formulário no cliente com o mesmo schema Zod do DTO, chama a API pelo servidor e guarda sessão em cookie.

**Regra fixa: o token de acesso nunca chega ao JavaScript do navegador.** Ele fica em cookie `fs_cms_session` (`httpOnly`, `sameSite=lax`, `secure` em produção, `path=/`), lido só em Server Components e Server Actions. Se a API responder 401, o usuário passa por `/sessao-expirada`, que apaga o cookie e o leva para `/login?expirada=1`.

## Decisões de design (D1..D6, do spec `2026-09-23-cms-trilha-design.md`)

- **D1**: professor verificado cria rascunho e submete; curador revisa e publica. O CMS reflete esse fluxo em duas telas (`treinos` do autor, `revisao` do curador).
- **D2** (substituída por G3 em 24/09): o papel `admin` era atribuído só por SQL. Hoje o admin concede e revoga `admin` pela tela `/admins`, para uma conta existente localizada por e-mail; a API recusa revogar a si mesmo e o último admin. `GET /acesso` continua decidindo o que a UI mostra (`canEdit`, `canCurate`).
- **D3**: MVP edita só treinos. Pilares são só leitura (vêm do código da API); não há tela de edição de pilar ou Flow Check no CMS.
- **D4**: vídeo de demonstração por upload direto do navegador a um S3 privado via URL pré-assinada (PUT). O CMS pede a URL ao servidor, o navegador faz o PUT, o servidor confirma.
- **D5**: existe uma única Trilha oficial; autoria é registrada por treino (`author`).
- **D6**: hospedagem prevista no Railway, mesmo padrão da API (`Dockerfile` + `railway.json`); deploy em si fica fora desta entrega.

## Gestão operacional (spec `2026-09-24-cms-gestao-design.md`)

Áreas só da curadoria (`canCurate`). O professor verificado continua vendo apenas Treinos; se abrir uma rota de gestão, vê "Acesso restrito", e a API responde 403.

| Rota | O que faz |
|---|---|
| `/` | Admin vai para `/painel`; professor para `/treinos`. |
| `/painel?mes=YYYY-MM&dia=YYYY-MM-DD` | Resumo de pessoas, métricas de aula, calendário do mês e agenda do dia. "Hoje" é o dia em `America/Sao_Paulo`. |
| `/professores`, `/professores/[id]` | Busca, filtros de verificação e status, verificar e remover verificação, bloquear. |
| `/alunos`, `/alunos/[id]` | Surfista (gratuito) e aluno (pago), filtros de plano e status, bloquear. |
| `/fotografos`, `/fotografos/[id]` | Totais, sessões recentes, atalho para as mídias, bloquear. |
| `/admins` | Conceder admin por e-mail e revogar. |
| `/midias`, `/midias/[id]` | Grade filtrável (dia, tipo, status, fotógrafo), pré-visualização pela URL assinada, remover (recusado com pedido pago). |

Como está montado:

- Rotas no grupo `src/app/(cms)/(admin)/`. O layout mostra `SemAcesso` para quem não é curadoria e cada página chama `isCurator()` antes de buscar dados, porque layout não impede a página de rodar.
- Cliente em `src/lib/api/admin-client.ts` e schemas em `src/lib/api/admin-schemas.ts`. Campo a mais na resposta é aceito; campo faltando derruba a página no `error.tsx` com "Resposta inesperada da API".
- Filtros e paginação são `<form method="get">` e `searchParams` (parâmetros em PT-BR: `q`, `pagina`, `status`, `plano`, `verificacao`, `tipo`, `dia`, `fotografo`). Valor inválido na URL é ignorado.
- Mutações são Server Actions com `revalidatePath`. Bloquear, revogar e remover pedem confirmação em `ConfirmAction`, que mostra a mensagem traduzida do `code` da API (`src/lib/api/errors.ts`).
- Conta bloqueada tem o login recusado com "Conta bloqueada. Fale com o suporte FlowState." e a sessão aberta cai na requisição seguinte.

## Variáveis de ambiente

Ver `.env.example`. `API_BASE_URL` é obrigatória e validada com Zod na primeira leitura (`src/lib/env.ts`); ausência ou valor que não é URL derruba a aplicação com mensagem clara em vez de falhar silenciosamente depois.

## E2E: pré-requisitos

`npm run e2e` (Playwright) sobe o próprio CMS (`npm run build && npm run start -p 3001`), mas depende de infraestrutura local que não é gerenciada pelo teste:

- **API rodando** em `API_BASE_URL` (padrão `http://localhost:3000/api/v1`), com as migrations já aplicadas, inclusive as da gestão (`users.blocked_at`, `cms_admin_events`). O teste não sobe nem reinicia a API.
- **Postgres no container docker `flowstate-postgres`** (mesmo container usado pela API local). O `globalSetup` (`e2e/setup/seed-users.ts`) roda `docker exec flowstate-postgres psql ...` para promover usuários; sem o container acessível por esse nome, o setup falha.
- **Repo da API como irmão do repo do CMS** (`../api` a partir da raiz do CMS), com um `.env` legível contendo `DB_USERNAME` e `DB_NAME` (usados só para montar o comando `psql`, nunca impressos). Se o layout local for outro, aponte o caminho com a variável `E2E_API_REPO_PATH`.
- **Chromium do Playwright instalado uma vez**: `npx playwright install chromium`.

O que o `globalSetup` faz antes dos testes:

1. Registra três usuários descartáveis via `POST /auth/register`: `e2e-prof-<timestamp>@flowstate.test` (papel professor), `e2e-admin-<timestamp>@flowstate.test` e `e2e-aluno-<timestamp>@flowstate.test` (surfista, sem papel extra).
2. Verifica o professor (`professor_profiles.verified = true` por SQL) e dá o papel `admin` ao segundo usuário (também por SQL). O surfista fica como está: é o alvo do bloqueio e da concessão de admin no cenário da gestão.
3. Grava as credenciais em `e2e/.auth/users.json` (gitignored, nunca aparece em log).

O cenário principal (professor cria e submete, admin publica) cria um treino de teste (código `E2E<sufixo>`) e o **arquiva ao final** via API, para não deixar debris na trilha local. Se a API local cair no meio da suíte, pode sobrar um treino de teste em `draft`/`review`/`published`; nesse caso, arquive manualmente pela tela do CMS ou por `POST /cms/trilha/treinos/:id/arquivar`.

O cenário da gestão (`e2e/cms-gestao.spec.ts`) roda em série: painel, remover e devolver a verificação do professor (conferindo o catálogo `GET /professors`), bloquear e desbloquear o surfista (login com `ACCOUNT_BLOCKED` e `GET /auth/me` com 401), conceder e revogar admin, autorrevogação recusada e 403 do professor nas rotas de gestão. O `afterAll` desbloqueia o surfista, devolve a verificação ao professor e revoga o admin do surfista, para uma suíte interrompida não deixar estado torto.
