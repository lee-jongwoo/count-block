import { describe, expect, it } from "vitest";
import {
  countCharacters,
  countCharactersWithoutSpaces,
  countNeisBytes,
  countUtf8Bytes,
  countWords,
  METRIC_IDS
} from "../src/metrics";

describe("NEIS byte counting", () => {
  it.each([
    ["", 0],
    ["ABC 123!", 8],
    ["가나다", 9],
    ["A\n가", 6],
    ["A\r\n가", 6],
    ["A\r가", 6],
    ["😀", 4],
    ["π∆·‘”", 5],
    ["é", 2],
    ["가", 6]
  ])("counts %j as %i bytes", (text, expected) => {
    expect(countNeisBytes(text)).toBe(expected);
  });

  it("keeps standard UTF-8 counting separate from NEIS exceptions", () => {
    expect(countUtf8Bytes("π")).toBe(2);
    expect(countNeisBytes("π")).toBe(1);
  });
});

describe("general metrics", () => {
  it("presents broadly useful text metrics before specialized byte metrics", () => {
    expect(METRIC_IDS).toEqual([
      "words",
      "characters",
      "characters-no-spaces",
      "utf8-bytes",
      "neis-bytes"
    ]);
  });

  it("counts whitespace-separated words", () => {
    expect(countWords(" one\t둘\nthree ")).toBe(3);
  });

  it("counts Unicode code points rather than UTF-16 code units", () => {
    expect(countCharacters("A😀가")).toBe(3);
  });

  it("removes Unicode whitespace for the no-spaces metric", () => {
    expect(countCharactersWithoutSpaces(" A\t😀\n가\u00a0")).toBe(3);
  });
});
