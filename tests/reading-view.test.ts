// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { enhanceCountBlocksInReadingView } from "../src/reading-view";

const defaults = { metric: "neis-bytes" as const, limit: null };

describe("reading view enhancement", () => {
  it("enhances a native code block using the authored Markdown section", () => {
    const root = document.createElement("div");
    root.innerHTML = '<pre><code class="language-count">one two\n</code></pre>';
    const getSectionInfo = vi.fn(() => ({
      text: ["```count metric=words limit=1", "one two", "```"].join("\n")
    }));

    enhanceCountBlocksInReadingView(root, { getSectionInfo } as never, defaults);

    expect(root.querySelector(".count-block-reading pre > code")?.textContent).toBe("one two\n");
    expect(root.querySelector(".count-block-footer")?.textContent).toBe("Words: 2 / 1");
    expect(root.querySelector(".count-block-footer")?.classList.contains("is-over-limit")).toBe(
      true
    );
  });

  it("is idempotent when a postprocessor runs more than once", () => {
    const root = document.createElement("div");
    root.innerHTML = '<pre><code class="language-count">text\n</code></pre>';
    const context = {
      getSectionInfo: () => ({ text: ["```count", "text", "```"].join("\n") })
    };

    enhanceCountBlocksInReadingView(root, context as never, defaults);
    enhanceCountBlocksInReadingView(root, context as never, defaults);

    expect(root.querySelectorAll(".count-block-reading")).toHaveLength(1);
    expect(root.querySelectorAll(".count-block-footer")).toHaveLength(1);
  });

  it("does not alter code rendered inside Live Preview", () => {
    const sourceView = document.createElement("div");
    sourceView.className = "markdown-source-view";
    const root = sourceView.appendChild(document.createElement("div"));
    root.innerHTML = '<pre><code class="language-count">text\n</code></pre>';

    enhanceCountBlocksInReadingView(
      root,
      { getSectionInfo: () => null } as never,
      defaults
    );

    expect(root.querySelector(".count-block-reading")).toBeNull();
  });
});
