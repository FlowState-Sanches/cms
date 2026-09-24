import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatDuration,
  formatNumber,
  formatRating,
  plural,
} from "./admin-labels";

describe("admin-labels", () => {
  it("plural usa singular só para 1 e separa milhar em pt-BR", () => {
    expect(plural(1, "aula", "aulas")).toBe("1 aula");
    expect(plural(0, "aula", "aulas")).toBe("0 aulas");
    expect(plural(1200, "mídia", "mídias")).toBe("1.200 mídias");
    expect(formatNumber(12345)).toBe("12.345");
  });

  it("formatBytes escolhe a unidade", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1,5 KB");
    expect(formatBytes(2516582)).toBe("2,4 MB");
  });

  it("formatDuration em minutos e segundos", () => {
    expect(formatDuration(42)).toBe("42 s");
    expect(formatDuration(65)).toBe("1 min 5 s");
    expect(formatDuration(120)).toBe("2 min");
  });

  it("formatRating com uma casa ou sem nota", () => {
    expect(formatRating(4.75)).toBe("4,8");
    expect(formatRating(null)).toBe("Sem nota");
  });
});
