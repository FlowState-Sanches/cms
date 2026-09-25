import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MediaPreview } from "./media-preview";

const session = { id: "s1", location: "Praia Mole", sessionDate: "2026-09-24" };

describe("MediaPreview", () => {
  it("foto vira <img> com alt descritivo", () => {
    render(
      <MediaPreview
        media={{ type: "photo", url: "https://s3.test/foto", thumbnailUrl: null, session }}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Foto da sessão em Praia Mole, 24/09/2026" }),
    ).toHaveAttribute("src", "https://s3.test/foto");
  });

  it("vídeo vira <video controls> com rótulo", () => {
    render(
      <MediaPreview
        media={{
          type: "video",
          url: "https://s3.test/video",
          thumbnailUrl: "https://s3.test/thumb",
          session,
        }}
      />,
    );
    const video = screen.getByLabelText("Vídeo da sessão em Praia Mole, 24/09/2026");
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("poster", "https://s3.test/thumb");
  });

  it("sem URL assinada avisa que o arquivo não está disponível", () => {
    render(<MediaPreview media={{ type: "photo", url: null, thumbnailUrl: null, session }} />);
    expect(screen.getByText("Arquivo indisponível para pré-visualização.")).toBeInTheDocument();
  });
});
