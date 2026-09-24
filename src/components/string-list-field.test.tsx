import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import {
  emptyTrainingForm,
  type TrainingFormValues,
} from "@/lib/training-schema";
import { StringListField } from "./string-list-field";

function Harness({
  initial = ["Primeiro", "Segundo"],
  max = 8,
  readOnly = false,
}: {
  initial?: string[];
  max?: number;
  readOnly?: boolean;
}) {
  const form = useForm<TrainingFormValues>({
    defaultValues: {
      ...emptyTrainingForm("tecnico"),
      learnings: initial.map((value) => ({ value })),
    },
  });

  return (
    <form>
      <StringListField
        control={form.control}
        register={form.register}
        name="learnings"
        legend="Aprendizados"
        itemLabel="aprendizado"
        addLabel="Adicionar aprendizado"
        min={1}
        max={max}
        readOnly={readOnly}
      />
    </form>
  );
}

function values(): string[] {
  return screen
    .getAllByRole("textbox")
    .map((input) => (input as HTMLInputElement).value);
}

describe("StringListField", () => {
  it("renderiza cada item com label numerado dentro de um grupo", () => {
    render(<Harness />);

    expect(
      screen.getByRole("group", { name: "Aprendizados" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Aprendizado 1")).toHaveValue("Primeiro");
    expect(screen.getByLabelText("Aprendizado 2")).toHaveValue("Segundo");
  });

  it("adiciona item e move o foco para o novo campo", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole("button", { name: "Adicionar aprendizado" }),
    );

    const novo = screen.getByLabelText("Aprendizado 3");
    await waitFor(() => expect(novo).toHaveFocus());
    expect(novo).toHaveValue("");
  });

  it("remove item", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole("button", { name: "Remover aprendizado 1" }),
    );

    expect(values()).toEqual(["Segundo"]);
  });

  it("não permite remover abaixo do mínimo", () => {
    render(<Harness initial={["Único"]} />);

    expect(
      screen.getByRole("button", { name: "Remover aprendizado 1" }),
    ).toBeDisabled();
  });

  it("move item para cima e para baixo com botões rotulados", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["A", "B", "C"]} />);

    await user.click(
      screen.getByRole("button", { name: "Mover aprendizado 2 para cima" }),
    );
    expect(values()).toEqual(["B", "A", "C"]);

    await user.click(
      screen.getByRole("button", { name: "Mover aprendizado 2 para baixo" }),
    );
    expect(values()).toEqual(["B", "C", "A"]);

    expect(
      screen.getByRole("button", { name: "Mover aprendizado 1 para cima" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mover aprendizado 3 para baixo" }),
    ).toBeDisabled();
  });

  it("desabilita Adicionar ao atingir o máximo", () => {
    render(<Harness initial={["A", "B"]} max={2} />);

    expect(
      screen.getByRole("button", { name: "Adicionar aprendizado" }),
    ).toBeDisabled();
  });

  it("em modo somente leitura trava campos e botões", () => {
    render(<Harness readOnly />);

    expect(screen.getByLabelText("Aprendizado 1")).toHaveAttribute("readonly");
    expect(
      screen.getByRole("button", { name: "Adicionar aprendizado" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remover aprendizado 2" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mover aprendizado 2 para cima" }),
    ).toBeDisabled();
  });
});
