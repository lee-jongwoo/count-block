import { describe, expect, it } from "vitest";
import {
  createMetricOptionChange,
  findCountBlocks,
  parseCountBlockConfiguration,
  parseCountBlockSection,
  parseFenceOpening
} from "../src/parser";

const defaults = { metric: "neis-bytes" as const, min: null, limit: null };

describe("count block configuration", () => {
  it("parses block options", () => {
    expect(
      parseCountBlockConfiguration("metric=characters-no-spaces limit=1500", defaults)
    ).toEqual({
      metric: "characters-no-spaces",
      min: null,
      limit: 1500,
      errors: []
    });
  });

  it("reports invalid values without discarding valid defaults", () => {
    const config = parseCountBlockConfiguration("metric=nope limit=-2 surprise=yes", defaults);
    expect(config.metric).toBe("neis-bytes");
    expect(config.limit).toBeNull();
    expect(config.min).toBeNull();
    expect(config.errors).toEqual([
      "Unknown metric: nope",
      "Limit must be a positive integer",
      "Unknown option: surprise"
    ]);
  });

  it("rejects positive digit strings outside JavaScript's safe integer range", () => {
    const config = parseCountBlockConfiguration("limit=999999999999999999999999", defaults);
    expect(config.limit).toBeNull();
    expect(config.errors).toEqual(["Limit must be a positive integer"]);
  });

  it("parses min and max while keeping limit as an upper-bound alias", () => {
    expect(parseCountBlockConfiguration("min=200 max=500", defaults)).toEqual({
      metric: "neis-bytes",
      min: 200,
      limit: 500,
      errors: []
    });
    expect(parseCountBlockConfiguration("limit=500", defaults).limit).toBe(500);
  });

  it("inherits the default minimum and lets a block override it", () => {
    const withMinimum = { ...defaults, min: 200, limit: 500 };
    expect(parseCountBlockConfiguration("", withMinimum)).toMatchObject({
      min: 200,
      limit: 500,
      errors: []
    });
    expect(parseCountBlockConfiguration("min=100", withMinimum)).toMatchObject({
      min: 100,
      limit: 500,
      errors: []
    });
    expect(parseCountBlockConfiguration("min=600 max=700", withMinimum)).toMatchObject({
      min: 600,
      limit: 700,
      errors: []
    });
  });

  it("reports invalid and conflicting bounds", () => {
    expect(parseCountBlockConfiguration("min=0 max=abc", defaults).errors).toEqual([
      "Min must be a positive integer",
      "Max must be a positive integer"
    ]);
    expect(parseCountBlockConfiguration("min=600 max=500", defaults).errors).toEqual([
      "Min must not exceed max"
    ]);
    expect(parseCountBlockConfiguration("max=500 limit=400", defaults).errors).toEqual([
      "Use either max or limit, not both"
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

  it("does not inspect count-looking content inside an unclosed outer fence", () => {
    const document = ["````markdown", "```count", "not a block", "```"].join("\n");
    expect(findCountBlocks(document, defaults)).toEqual([]);
  });

  it("does not interpret count-looking content inside another fenced block", () => {
    const document = ["````markdown", "```count", "not a block", "```", "````"].join("\n");
    expect(findCountBlocks(document, defaults)).toEqual([]);
  });

  it("parses an exact rendered section through the shared block model", () => {
    const section = parseCountBlockSection(
      ["```count metric=words", "one two", "```"].join("\n"),
      defaults
    );

    expect(section?.source).toBe("one two");
    expect(section?.configuration.metric).toBe("words");
  });

  it("creates a focused metric edit without rewriting other options", () => {
    const document = ["before", "```count limit=10 metric=words", "one two", "```"].join("\n");
    const block = findCountBlocks(document, defaults)[0];
    const change = createMetricOptionChange(document, block, "characters");

    expect(document.slice(0, change.from) + change.insert + document.slice(change.to)).toBe(
      ["before", "```count limit=10 metric=characters", "one two", "```"].join("\n")
    );
  });

  it("inserts a metric option when the opening fence relies on defaults", () => {
    const document = ["```count limit=10", "text", "```"].join("\n");
    const block = findCountBlocks(document, defaults)[0];
    const change = createMetricOptionChange(document, block, "words");

    expect(document.slice(0, change.from) + change.insert + document.slice(change.to)).toBe(
      ["```count metric=words limit=10", "text", "```"].join("\n")
    );
  });

  it("edits the effective option when duplicate metrics are authored", () => {
    const document = ["```count metric=words metric=characters", "text", "```"].join("\n");
    const block = findCountBlocks(document, defaults)[0];
    const change = createMetricOptionChange(document, block, "utf8-bytes");

    expect(document.slice(0, change.from) + change.insert + document.slice(change.to)).toBe(
      ["```count metric=words metric=utf8-bytes", "text", "```"].join("\n")
    );
  });
});
