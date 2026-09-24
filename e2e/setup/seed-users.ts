import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Seed de usuários E2E (FLOW-438 / Task B7).
 *
 * Roda uma única vez, no `globalSetup` do Playwright, antes de qualquer
 * teste. Cria dois usuários descartáveis diretamente na API local
 * (`POST /auth/register`), promove um a professor verificado e o outro a
 * admin por SQL direto no container docker `flowstate-postgres` (mesmo
 * caminho documentado em `api/src/modules/cms-trilha/CLAUDE.md`), e grava as
 * credenciais em `e2e/.auth/users.json` (gitignored) para os specs lerem.
 *
 * Nunca imprime senha ou token nos logs.
 */

const API_BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

const POSTGRES_CONTAINER =
  process.env.E2E_POSTGRES_CONTAINER ?? "flowstate-postgres";

// Repo da API é irmão do repo do CMS em ambiente local (`FlowState/api` e
// `FlowState/cms`). `E2E_API_REPO_PATH` permite apontar para outro lugar se
// o layout local divergir.
const API_REPO_PATH =
  process.env.E2E_API_REPO_PATH ?? path.resolve(__dirname, "../../../api");

const AUTH_DIR = path.resolve(__dirname, "..", ".auth");
const USERS_FILE = path.join(AUTH_DIR, "users.json");

export type SeedUser = {
  email: string;
  password: string;
  name: string;
  userId: string;
};

export type SeedUsersFile = {
  professor: SeedUser;
  admin: SeedUser;
};

function readDbEnvVars(): { username: string; database: string } {
  const envPath = path.join(API_REPO_PATH, ".env");
  const raw = readFileSync(envPath, "utf8");
  const lines = raw.split("\n");
  const values: Record<string, string> = {};
  for (const line of lines) {
    const match = /^(DB_USERNAME|DB_NAME)=(.*)$/.exec(line.trim());
    const key = match?.[1];
    const value = match?.[2];
    if (key && value !== undefined) {
      values[key] = value.trim();
    }
  }
  return {
    username: values.DB_USERNAME ?? "flowstate",
    database: values.DB_NAME ?? "flowstate",
  };
}

/** Roda um comando SQL dentro do container docker local via `psql`. Nunca loga o resultado. */
function runSql(sql: string): void {
  const { username, database } = readDbEnvVars();
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      POSTGRES_CONTAINER,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      username,
      "-d",
      database,
      "-c",
      sql,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}

async function register(input: {
  name: string;
  email: string;
  password: string;
  roles?: string[];
}): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Falha ao registrar usuário de seed (${response.status}): ${body}`,
    );
  }
  const data = (await response.json()) as { user: { id: string } };
  return data.user.id;
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Falha ao logar usuário de seed (${response.status})`);
  }
  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

/** Cria a linha em `professor_profiles` (nasce lazy no primeiro `PATCH /professors/me`). */
async function ensureProfessorProfileRow(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/professors/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bio: "Perfil de teste E2E (FLOW-438)." }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Falha ao criar professor_profiles de seed (${response.status}): ${body}`,
    );
  }
}

function randomPassword(): string {
  return `E2e${Math.random().toString(36).slice(2, 12)}!9`;
}

export default async function globalSetup(): Promise<void> {
  const stamp = Date.now();
  const professorEmail = `e2e-prof-${stamp}@flowstate.test`;
  const adminEmail = `e2e-admin-${stamp}@flowstate.test`;
  const professorPassword = randomPassword();
  const adminPassword = randomPassword();

  const professorId = await register({
    name: "Professor E2E",
    email: professorEmail,
    password: professorPassword,
    roles: ["professor"],
  });

  const adminId = await register({
    name: "Admin E2E",
    email: adminEmail,
    password: adminPassword,
  });

  const professorToken = await login(professorEmail, professorPassword);
  await ensureProfessorProfileRow(professorToken);

  runSql(
    `UPDATE professor_profiles SET verified = true WHERE user_id = (SELECT id FROM users WHERE email = '${professorEmail}');`,
  );
  runSql(
    `UPDATE users SET roles = array_append(roles, 'admin') WHERE email = '${adminEmail}' AND NOT ('admin' = ANY(roles));`,
  );

  const users: SeedUsersFile = {
    professor: {
      email: professorEmail,
      password: professorPassword,
      name: "Professor E2E",
      userId: professorId,
    },
    admin: {
      email: adminEmail,
      password: adminPassword,
      name: "Admin E2E",
      userId: adminId,
    },
  };

  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}
