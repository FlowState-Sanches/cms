import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const actions = vi.hoisted(() => ({
  requestVideoUploadAction: vi.fn(),
  confirmVideoAction: vi.fn(),
  removeVideoAction: vi.fn(),
}));
vi.mock("@/app/(cms)/treinos/actions", () => actions);

const upload = vi.hoisted(() => ({ putWithProgress: vi.fn() }));
vi.mock("@/lib/upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/upload")>();
  return { ...actual, putWithProgress: upload.putWithProgress };
});

import { VideoUploader } from "./video-uploader";

function makeFile(name: string, type: string, size: number): File {
  const file = new File(["conteudo"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VideoUploader", () => {
  it("arquivo inválido mostra mensagem e não chama a action", async () => {
    render(
      <VideoUploader trainingId="tecnico-t1" demoVideoUrl={null} canEdit />,
    );

    // `fireEvent` (não `userEvent.upload`) porque o input tem `accept`
    // restrito a vídeo: `userEvent` respeita o atributo e não deixaria
    // escolher um PNG. Aqui queremos testar a validação do próprio
    // componente, que também precisa cobrir esse caso (defesa em profundidade).
    const input = screen.getByLabelText("Enviar novo vídeo");
    fireEvent.change(input, {
      target: { files: [makeFile("foto.png", "image/png", 1000)] },
    });

    expect(
      await screen.findByText(
        "Envie um vídeo MP4, MOV ou WEBM de até 300 MB.",
      ),
    ).toBeInTheDocument();
    expect(actions.requestVideoUploadAction).not.toHaveBeenCalled();
  });

  it("envia vídeo válido: progresso, confirmação e mensagem de sucesso", async () => {
    const user = userEvent.setup();
    actions.requestVideoUploadAction.mockResolvedValue({
      ok: true,
      uploadUrl: "https://s3.example/upload",
      key: "trilha-content/tecnico-t1/abc.mp4",
      expiresIn: 900,
      headers: { "Content-Type": "video/mp4" },
    });
    actions.confirmVideoAction.mockResolvedValue({
      ok: true,
      id: "tecnico-t1",
    });

    let resolveUpload: () => void = () => {};
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    let progressCb: (ratio: number) => void = () => {};
    upload.putWithProgress.mockImplementation(
      (_url: string, _file: Blob, _headers: unknown, onProgress: (ratio: number) => void) => {
        progressCb = onProgress;
        return { promise: uploadPromise, abort: vi.fn() };
      },
    );

    render(
      <VideoUploader trainingId="tecnico-t1" demoVideoUrl={null} canEdit />,
    );

    await user.upload(
      screen.getByLabelText("Enviar novo vídeo"),
      makeFile("demo.mp4", "video/mp4", 1024),
    );

    await waitFor(() =>
      expect(actions.requestVideoUploadAction).toHaveBeenCalledWith(
        "tecnico-t1",
        "video/mp4",
        1024,
      ),
    );

    progressCb(0.5);
    const progress = await screen.findByRole("progressbar");
    await waitFor(() =>
      expect(progress).toHaveAttribute("aria-valuenow", "50"),
    );

    resolveUpload();

    await waitFor(() =>
      expect(actions.confirmVideoAction).toHaveBeenCalledWith(
        "tecnico-t1",
        "trilha-content/tecnico-t1/abc.mp4",
      ),
    );
    expect(await screen.findByText("Vídeo enviado.")).toBeInTheDocument();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("falha no envio mostra 'Tentar de novo' que reinicia o fluxo", async () => {
    const user = userEvent.setup();
    actions.requestVideoUploadAction.mockResolvedValue({
      ok: true,
      uploadUrl: "https://s3.example/upload",
      key: "k",
      expiresIn: 900,
      headers: {},
    });
    const failure = Promise.reject(new Error("upload_failed"));
    failure.catch(() => {}); // evita o unhandled rejection do próprio teste; o componente ainda aguarda essa mesma promise.
    upload.putWithProgress.mockReturnValue({
      promise: failure,
      abort: vi.fn(),
    });

    render(
      <VideoUploader trainingId="tecnico-t1" demoVideoUrl={null} canEdit />,
    );
    await user.upload(
      screen.getByLabelText("Enviar novo vídeo"),
      makeFile("demo.mp4", "video/mp4", 1024),
    );

    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    await user.click(retry);

    expect(screen.getByLabelText("Enviar novo vídeo")).toBeInTheDocument();
  });

  it("mostra Cancelar durante o envio e aborta o upload", async () => {
    const user = userEvent.setup();
    actions.requestVideoUploadAction.mockResolvedValue({
      ok: true,
      uploadUrl: "https://s3.example/upload",
      key: "k",
      expiresIn: 900,
      headers: {},
    });
    const abort = vi.fn();
    let rejectUpload: (error: Error) => void = () => {};
    const uploadPromise = new Promise<void>((_resolve, reject) => {
      rejectUpload = reject;
    });
    upload.putWithProgress.mockImplementation(() => ({
      promise: uploadPromise,
      abort: () => {
        abort();
        rejectUpload(new Error("upload_aborted"));
      },
    }));

    render(
      <VideoUploader trainingId="tecnico-t1" demoVideoUrl={null} canEdit />,
    );
    await user.upload(
      screen.getByLabelText("Enviar novo vídeo"),
      makeFile("demo.mp4", "video/mp4", 1024),
    );

    const cancelButton = await screen.findByRole("button", {
      name: "Cancelar",
    });
    await user.click(cancelButton);

    expect(abort).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByLabelText("Enviar novo vídeo")).toBeInTheDocument(),
    );
  });

  it("com demoVideoUrl mostra o player e Remover vídeo com confirmação", async () => {
    const user = userEvent.setup();
    actions.removeVideoAction.mockResolvedValue({
      ok: true,
      id: "tecnico-t1",
    });

    render(
      <VideoUploader
        trainingId="tecnico-t1"
        demoVideoUrl="https://cdn.example/video.mp4"
        canEdit
      />,
    );

    const video = document.querySelector("video");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("preload", "metadata");

    await user.click(screen.getByRole("button", { name: "Remover vídeo" }));
    expect(
      screen.getByText(/Remover o vídeo de demonstração/),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Confirmar remoção" }),
    );

    await waitFor(() =>
      expect(actions.removeVideoAction).toHaveBeenCalledWith("tecnico-t1"),
    );
    expect(router.refresh).toHaveBeenCalled();
  });

  it("sem permissão de edição não mostra controles de upload", () => {
    render(
      <VideoUploader
        trainingId="tecnico-t1"
        demoVideoUrl="https://cdn.example/video.mp4"
        canEdit={false}
      />,
    );

    expect(document.querySelector("video")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Enviar novo vídeo"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remover vídeo" }),
    ).not.toBeInTheDocument();
  });

  it("no celular o seletor de arquivo e a confirmação de remoção ocupam a largura toda", async () => {
    const user = userEvent.setup();
    render(
      <VideoUploader
        trainingId="tecnico-t1"
        demoVideoUrl="https://cdn.example/video.mp4"
        canEdit
      />,
    );
    expect(screen.getByLabelText("Enviar novo vídeo")).toHaveClass(
      "w-full",
      "file:w-full",
      "md:file:w-auto",
      "file:min-h-11",
    );
    await user.click(screen.getByRole("button", { name: "Remover vídeo" }));
    const confirm = screen.getByRole("button", { name: "Confirmar remoção" });
    expect(confirm).toHaveClass("min-h-11", "w-full", "md:w-auto");
    expect(confirm.parentElement).toHaveClass("flex-col", "md:flex-row");
  });
});
