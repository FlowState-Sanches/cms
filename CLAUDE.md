@AGENTS.md

# FlowState CMS

CMS de exercícios (treinos) da Trilha de Aprendizado (FLOW-438). Professor verificado cadastra treinos; curador FlowState revisa e publica; o treino aparece no app sem nova build.

## Stack

Next.js 16 App Router, TypeScript strict, Tailwind CSS 4, Zod, React Hook Form, Vitest + Testing Library, Playwright, ESLint + Prettier. Node 24, npm.

## Como rodar

```bash
cp .env.example .env.local
npm install
npm run dev -- -p 3001   # a API usa a porta 3000
```

## Scripts

`lint`, `typecheck` (roda `next typegen` antes de `tsc --noEmit`, porque tipos de rota do App Router são gerados, não escritos), `test`, `test:watch`, `e2e`, `build`, `format`.

## Arquitetura: BFF fino sobre a API

O CMS não acessa banco nem regra de negócio. Toda autorização e regra de negócio vivem na API NestJS (`/api/v1/cms/trilha/*` para treinos, `/api/v1/cms/*` para a gestão operacional), fonte única para app e CMS. O CMS:

- Guarda o access token JWT em cookie `fs_cms_session` (`httpOnly`, `sameSite=lax`, `secure` em produção, `path=/`).
- Chama a API só a partir do servidor (Server Components e Server Actions), nunca do cliente.
- Reenvia `Authorization: Bearer <token>` nessas chamadas.
- Ao receber 401 da API, redireciona a `/sessao-expirada` (Route Handler que apaga o cookie e manda a `/login?expirada=1`). O cookie não é apagado direto no ponto do 401 porque o Next 16 só permite alterar cookies em Server Actions e Route Handlers, e a chamada pode vir de um Server Component durante o render.

**Regra inegociável: o token nunca chega ao JavaScript do navegador.** Qualquer código novo que precise do token roda no servidor.

## Decisões (D1..D6)

Ver lista em `README.md` (seção "Decisões de design"), fonte única para não divergir. Spec completo em `FlowState/docs/superpowers/specs/2026-09-23-cms-trilha-design.md` (pasta `docs` ao lado dos repos `api`, `app` e `cms`, fora deles).

Gestão operacional (painel, pessoas, admins, mídias): spec `FlowState/docs/superpowers/specs/2026-09-24-cms-gestao-design.md` (decisões G1..G4 e H1..H6). Rotas no grupo `src/app/(cms)/(admin)/`; cada página chama `isCurator()` antes de buscar dados.

## E2E (Playwright)

Pré-requisitos e o que o `globalSetup` faz: ver "E2E: pré-requisitos" em `README.md`. Resumo: API local rodando (migrations aplicadas) + Postgres no container docker `flowstate-postgres` + repo `api` como irmão (`../api`, ou `E2E_API_REPO_PATH`) + `npx playwright install chromium` uma vez.

## Convenções

- Rotas e copy em PT-BR, sem travessão. Entidades e colunas em inglês (padrão do módulo trilha na API).
- Erros da API vêm com `{ statusCode, message, code }`; o CMS traduz `code` para mensagem de formulário quando existir mapeamento, senão mostra `message`.
- `src/lib/env.ts` é a única porta de entrada para variáveis de ambiente; nunca ler `process.env` direto em outro lugar.
- `src/instrumentation.ts` valida o env quando o servidor sobe: sem `API_BASE_URL` válida, o log mostra `Configuração inválida` e toda requisição responde 500, em vez de o CMS parecer funcionar. Em Server Actions, só `ApiError` vira mensagem de formulário; qualquer outro erro é registrado no log do servidor e propagado para a fronteira de erro.
- Next 16 renomeou `middleware.ts` para `proxy.ts` (export `proxy`, não `middleware`). Ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- Antes de usar qualquer convenção do App Router que pareça familiar, confirme em `node_modules/next/dist/docs/` porque esta versão diverge do treinamento do modelo (cookies/params assíncronos, etc.).
