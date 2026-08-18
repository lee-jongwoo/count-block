// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { appendCountFooter } from "../src/footer";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("count footer interactions", () => {
  it("copies the unformatted numeric value", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
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
    parent.querySelector<HTMLButtonElement>(".count-block-value")!.click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("1234"));
    expect(parent.querySelector(".count-block-value")?.getAttribute("aria-label")).toBe(
      "Count copied"
    );
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
