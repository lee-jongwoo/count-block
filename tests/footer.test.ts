// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { appendCountFooter } from "../src/footer";

describe("count footer", () => {
  it("renders the count as non-interactive text", () => {
    const parent = document.createElement("div");

    appendCountFooter(parent, {
      value: 1234,
      metricLabel: "Words",
      formattedValue: "1,234",
      formattedLimit: null,
      text: "Words: 1,234",
      overLimit: false,
      error: null
    });

    const value = parent.querySelector(".count-block-value");
    expect(value?.textContent).toBe("1,234");
    expect(value?.tagName).toBe("SPAN");
    expect(parent.querySelector("button")).toBeNull();
  });

  it("renders a selector only when the adapter supplies one", () => {
    const parent = document.createElement("div");
    const onChange = vi.fn();
    const presentation = {
      value: 2,
      metricLabel: "Words",
      formattedValue: "2",
      formattedLimit: null,
      text: "Words: 2",
      overLimit: false,
      error: null
    };

    appendCountFooter(parent, presentation, {
      metricSelector: {
        value: "words",
        options: [
          { value: "words", label: "Words" },
          { value: "characters", label: "Characters" }
        ],
        onChange
      }
    });
    const select = parent.querySelector<HTMLSelectElement>("select");
    select!.value = "characters";
    select!.dispatchEvent(new Event("change"));

    expect(onChange).toHaveBeenCalledWith("characters");
    expect(select?.options).toHaveLength(2);
    expect(select?.selectedOptions[0]?.textContent).toBe("Characters");
    expect(parent.querySelector(".count-block-value")?.textContent).toBe("2");
  });
});
