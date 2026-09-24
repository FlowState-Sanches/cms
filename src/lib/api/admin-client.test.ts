import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authedRequest: vi.fn() }));
vi.mock("./client", () => ({ authedRequest: mocks.authedRequest }));

import { adminApi } from "./admin-client";
import {
  adminItemSchema,
  blockResultSchema,
  calendarDayDetailSchema,
  calendarMonthSchema,
  dashboardSummarySchema,
  professorDetailSchema,
  studentDetailSchema,
} from "./admin-schemas";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

beforeEach(() => {
  mocks.authedRequest.mockReset();
  mocks.authedRequest.mockResolvedValue({});
});

describe("adminApi: leituras", () => {
  it("summary", async () => {
    await adminApi.summary();
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      "/cms/dashboard/summary",
      dashboardSummarySchema,
    );
  });

  it("calendar e calendarDay", async () => {
    await adminApi.calendar("2026-09-01", "2026-09-30");
    await adminApi.calendarDay("2026-09-24");
    expect(mocks.authedRequest).toHaveBeenNthCalledWith(
      1,
      "/cms/calendar?from=2026-09-01&to=2026-09-30",
      calendarMonthSchema,
    );
    expect(mocks.authedRequest).toHaveBeenNthCalledWith(
      2,
      "/cms/calendar/day?date=2026-09-24",
      calendarDayDetailSchema,
    );
  });

  it("students monta a query na ordem do contrato", async () => {
    await adminApi.students({
      q: "ana",
      plan: "paid",
      status: "blocked",
      page: 2,
      limit: 20,
    });
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      "/cms/students?q=ana&plan=paid&status=blocked&page=2&limit=20",
      expect.anything(),
    );
  });

  it("professors envia verified=false", async () => {
    await adminApi.professors({ verified: false });
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      "/cms/professors?verified=false",
      expect.anything(),
    );
  });

  it("photographers sem filtro não manda query", async () => {
    await adminApi.photographers({});
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      "/cms/photographers",
      expect.anything(),
    );
  });

  it("media usa photographerId e os enums da API", async () => {
    await adminApi.media({
      date: "2026-09-24",
      photographerId: ID,
      type: "photo",
      status: "ready",
      page: 1,
      limit: 24,
    });
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      `/cms/media?date=2026-09-24&photographerId=${ID}&type=photo&status=ready&page=1&limit=24`,
      expect.anything(),
    );
  });

  it("codifica o id no caminho", async () => {
    await adminApi.student("a/b");
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      "/cms/students/a%2Fb",
      studentDetailSchema,
    );
  });
});

describe("adminApi: escritas", () => {
  it("setProfessorVerified faz PATCH com { verified }", async () => {
    await adminApi.setProfessorVerified(ID, true);
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      `/cms/professors/${ID}/verification`,
      professorDetailSchema,
      { method: "PATCH", body: { verified: true } },
    );
  });

  it("setBlocked escolhe block ou unblock", async () => {
    await adminApi.setBlocked(ID, true);
    await adminApi.setBlocked(ID, false);
    expect(mocks.authedRequest).toHaveBeenNthCalledWith(
      1,
      `/cms/users/${ID}/block`,
      blockResultSchema,
      { method: "PATCH" },
    );
    expect(mocks.authedRequest).toHaveBeenNthCalledWith(
      2,
      `/cms/users/${ID}/unblock`,
      blockResultSchema,
      { method: "PATCH" },
    );
  });

  it("grantAdmin faz POST com o e-mail e revokeAdmin faz DELETE", async () => {
    await adminApi.grantAdmin("nova@x.test");
    await adminApi.revokeAdmin(ID);
    expect(mocks.authedRequest).toHaveBeenNthCalledWith(
      1,
      "/cms/admins",
      adminItemSchema,
      { method: "POST", body: { email: "nova@x.test" } },
    );
    expect(mocks.authedRequest).toHaveBeenNthCalledWith(
      2,
      `/cms/admins/${ID}`,
      expect.anything(),
      { method: "DELETE" },
    );
  });

  it("removeMedia faz DELETE", async () => {
    await adminApi.removeMedia(ID);
    expect(mocks.authedRequest).toHaveBeenCalledWith(
      `/cms/media/${ID}`,
      expect.anything(),
      { method: "DELETE" },
    );
  });
});
