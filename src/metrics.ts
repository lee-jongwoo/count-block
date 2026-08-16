export const METRIC_IDS = [
  "neis-bytes",
  "utf8-bytes",
  "words",
  "characters",
  "characters-no-spaces"
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

export interface MetricDefinition {
  id: MetricId;
  label: string;
  unit: string;
  count: (text: string) => number;
}

// These characters are deliberately treated as one byte by the reference
// NEIS counter even though most occupy two or three bytes in UTF-8.
export const NEIS_ONE_BYTE_EXCEPTIONS = new Set(
  Array.from("∞∑∏∫√∂∆πθΩαβγδεζηλμνξοπρστυφχψω·‘’“”")
);

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/gu, "\n");
}

export function countNeisBytes(text: string): number {
  let total = 0;

  for (const character of normalizeLineEndings(text)) {
    if (character === "\n") {
      total += 2;
      continue;
    }

    if (NEIS_ONE_BYTE_EXCEPTIONS.has(character)) {
      total += 1;
      continue;
    }

    const codePoint = character.codePointAt(0) ?? 0;
    total +=
      codePoint <= 0x7f
        ? 1
        : codePoint <= 0x7ff
          ? 2
          : codePoint <= 0xffff
            ? 3
            : 4;
  }

  return total;
}

export function countUtf8Bytes(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export function countWords(text: string): number {
  return text.match(/\S+/gu)?.length ?? 0;
}

export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function countCharactersWithoutSpaces(text: string): number {
  return Array.from(text.replace(/\s/gu, "")).length;
}

export const METRICS: Record<MetricId, MetricDefinition> = {
  "neis-bytes": {
    id: "neis-bytes",
    label: "NEIS bytes",
    unit: "bytes",
    count: countNeisBytes
  },
  "utf8-bytes": {
    id: "utf8-bytes",
    label: "UTF-8 bytes",
    unit: "bytes",
    count: countUtf8Bytes
  },
  words: {
    id: "words",
    label: "Words",
    unit: "words",
    count: countWords
  },
  characters: {
    id: "characters",
    label: "Characters",
    unit: "characters",
    count: countCharacters
  },
  "characters-no-spaces": {
    id: "characters-no-spaces",
    label: "Characters without spaces",
    unit: "characters",
    count: countCharactersWithoutSpaces
  }
};

export function isMetricId(value: string): value is MetricId {
  return METRIC_IDS.includes(value as MetricId);
}
