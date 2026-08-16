import { describe, expect, it } from "vitest";
import {
  findCountBlocks,
  parseCountBlockConfiguration,
  parseFenceOpening
} from "../src/parser";

const defaults = { metric: "neis-bytes" as const, limit: null };

describe("count block configuration", () => {
  it("parses block options, including quoted labels", () => {
    expect(
      parseCountBlockConfiguration(
        'metric=characters-no-spaces limit=1500 label="Career notes"',
        defaults
      )
    ).toEqual({
      metric: "characters-no-spaces",
      limit: 1500,
      label: "Career notes",
      errors: []
    });
  });

  it("reports invalid values without discarding valid defaults", () => {
    const config = parseCountBlockConfiguration("metric=nope limit=-2 surprise=yes", defaults);
    expect(config.metric).toBe("neis-bytes");
    expect(config.limit).toBeNull();
    expect(config.errors).toEqual([
      "Unknown metric: nope",
      "Limit must be a positive integer",
      "Unknown option: surprise"
    ]);
  });
});

describe("fenced count blocks", () => {
  it("recognizes backtick and tilde openings", () => {
    expect(parseFenceOpening("```count metric=words")?.length).toBe(3);
    expect(parseFenceOpening("  ~~~~count")?.marker).toBe("~");
    expect(parseFenceOpening("> ```count")).toBeNull();
  });

  it("extracts only the authored body and supports longer fences", () => {
    const document = [
      "before",
      "````count metric=utf8-bytes limit=10",
      "first",
      "```",
      "last",
      "````",
      "after"
    ].join("\n");
    const blocks = findCountBlocks(document, defaults);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].source).toBe("first\n```\nlast");
    expect(blocks[0].configuration.metric).toBe("utf8-bytes");
    expect(blocks[0].configuration.limit).toBe(10);
  });

  it("ignores an unclosed fence", () => {
    expect(findCountBlocks("```count\ntext", defaults)).toEqual([]);
  });
});
