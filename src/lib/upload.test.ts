import { afterEach, describe, expect, it, vi } from "vitest";
import { putWithProgress } from "./upload";

type ProgressListener = (event: { lengthComputable: boolean; loaded: number; total: number }) => void;

class FakeXHR {
  status = 0;
  upload: { onprogress: ProgressListener | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  headers: Record<string, string> = {};
  sentBody: unknown;
  aborted = false;

  open = vi.fn();

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  send(body: unknown) {
    this.sentBody = body;
  }

  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

/**
 * `vi.stubGlobal` com uma função construtora que devolve o fake: uma classe
 * comum não caberia aqui porque cada teste precisa da MESMA instância de
 * `FakeXHR` que ele já tem em mãos, para disparar os eventos manualmente.
 */
function stubXHR(fake: FakeXHR): void {
  function FakeXHRConstructor(this: unknown) {
    return fake;
  }
  vi.stubGlobal(
    "XMLHttpRequest",
    FakeXHRConstructor as unknown as typeof XMLHttpRequest,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("putWithProgress", () => {
  it("reporta progresso e resolve em status 2xx", async () => {
    const fake = new FakeXHR();
    stubXHR(fake);
    const onProgress = vi.fn();

    const handle = putWithProgress(
      "https://s3.example/upload",
      new Blob(["conteudo"]),
      { "Content-Type": "video/mp4" },
      onProgress,
    );

    fake.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    fake.status = 200;
    fake.onload?.();

    await expect(handle.promise).resolves.toBeUndefined();
    expect(onProgress).toHaveBeenCalledWith(0.5);
    expect(fake.headers["Content-Type"]).toBe("video/mp4");
  });

  it("rejeita com upload_failed quando o status não é 2xx (ex.: 403)", async () => {
    const fake = new FakeXHR();
    stubXHR(fake);

    const handle = putWithProgress(
      "https://s3.example/upload",
      new Blob(["conteudo"]),
      {},
      vi.fn(),
    );

    fake.status = 403;
    fake.onload?.();

    await expect(handle.promise).rejects.toThrow("upload_failed");
  });

  it("abort rejeita com upload_aborted", async () => {
    const fake = new FakeXHR();
    stubXHR(fake);

    const handle = putWithProgress(
      "https://s3.example/upload",
      new Blob(["conteudo"]),
      {},
      vi.fn(),
    );

    handle.abort();

    await expect(handle.promise).rejects.toThrow("upload_aborted");
    expect(fake.aborted).toBe(true);
  });
});
