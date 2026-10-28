import { describe, it, afterEach, expect } from "vitest";
import { resolveCssVariables } from "./resolveCssVariables";

const root = document.documentElement;

function setVars(element: HTMLElement, vars: Record<string, string>) {
  for (const [name, value] of Object.entries(vars)) {
    element.style.setProperty(name, value);
  }
}

describe("resolveCssVariables", () => {
  afterEach(() => {
    root.removeAttribute("style");
    document.body.innerHTML = "";
  });

  it("replaces var() references anywhere in a nested config", () => {
    setVars(root, { "--ink": "#1f2a44", "--accent": "#2f6fdd" });
    expect(
      resolveCssVariables({
        axis: { labelColor: "var(--ink)" },
        range: { category: ["var(--accent)", "#e8743b"] },
        title: { text: "untouched" },
      }),
    ).toEqual({
      axis: { labelColor: "#1f2a44" },
      range: { category: ["#2f6fdd", "#e8743b"] },
      title: { text: "untouched" },
    });
  });

  it("replaces references inside a longer string", () => {
    setVars(root, { "--font": "Inter" });
    expect(resolveCssVariables({ font: "var(--font), sans-serif" })).toEqual({
      font: "Inter, sans-serif",
    });
  });

  it("returns a number for a single var() that holds a number", () => {
    setVars(root, { "--size": "13px", "--opacity": "0.5" });
    expect(
      resolveCssVariables({
        fontSize: "var(--size)",
        opacity: "var(--opacity)",
        label: "size var(--size)",
      }),
    ).toEqual({ fontSize: 13, opacity: 0.5, label: "size 13px" });
  });

  it("uses fallbacks, including nested ones, for unset properties", () => {
    setVars(root, { "--b": "teal" });
    expect(
      resolveCssVariables({
        one: "var(--missing, red)",
        two: "var(--missing, var(--b, red))",
        three: "var(--missing, var(--also-missing, 12))",
      }),
    ).toEqual({ one: "red", two: "teal", three: 12 });
  });

  it("leaves a reference with no value and no fallback as it is", () => {
    expect(resolveCssVariables({ color: "var(--missing)" })).toEqual({
      color: "var(--missing)",
    });
  });

  it("reads inherited values from the given element", () => {
    const section = document.createElement("section");
    const child = document.createElement("div");
    section.append(child);
    document.body.append(section);
    setVars(root, { "--bg": "white" });
    setVars(section, { "--bg": "black" });

    expect(resolveCssVariables("var(--bg)")).toBe("white");
    expect(resolveCssVariables("var(--bg)", child)).toBe("black");
  });

  it("does not mutate its input and keeps non-plain values", () => {
    setVars(root, { "--ink": "black" });
    const fn = () => 1;
    const input = { axis: { labelColor: "var(--ink)" }, fn };
    const output = resolveCssVariables(input);
    expect(input.axis.labelColor).toBe("var(--ink)");
    expect(output.fn).toBe(fn);
    expect(output.axis).not.toBe(input.axis);
  });

  it("ignores `__proto__` keys", () => {
    const output = resolveCssVariables(
      JSON.parse('{"__proto__": {"polluted": true}}'),
    );
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
