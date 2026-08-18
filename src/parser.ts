import { isMetricId, type MetricId } from "./metrics";

export interface CountBlockDefaults {
  metric: MetricId;
  limit: number | null;
}

export interface CountBlockConfiguration {
  metric: MetricId;
  limit: number | null;
  label: string | null;
  errors: string[];
}

export interface CountBlockRange {
  from: number;
  to: number;
  bodyFrom: number;
  bodyTo: number;
  footerPosition: number;
  source: string;
  configuration: CountBlockConfiguration;
}

interface FenceOpening {
  marker: "`" | "~";
  length: number;
  info: string;
}

const OPTION_PATTERN = /([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^\s]+))/gy;

function parseAnyFenceOpening(line: string): FenceOpening | null {
  const match = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/u);
  if (!match) return null;

  const marker = match[1][0] as "`" | "~";
  const info = match[2].trim();
  if (marker === "`" && info.includes("`")) return null;

  return { marker, length: match[1].length, info };
}

export function parseFenceOpening(line: string): FenceOpening | null {
  const opening = parseAnyFenceOpening(line);
  if (!opening) return null;

  const match = opening.info.match(/^count(?:\s+(.*?))?\s*$/u);
  if (!match) return null;
  return { ...opening, info: match[1] ?? "" };
}

function closingFencePattern(opening: FenceOpening): RegExp {
  return new RegExp(`^\\s{0,3}${opening.marker}{${opening.length},}\\s*$`, "u");
}

function unescapeQuoted(value: string): string {
  return value.replace(/\\([\\"'])/gu, "$1");
}

function parseOptions(info: string): { values: Map<string, string>; errors: string[] } {
  const values = new Map<string, string>();
  const errors: string[] = [];
  let position = 0;

  while (position < info.length) {
    while (/\s/u.test(info[position] ?? "")) position += 1;
    if (position >= info.length) break;

    OPTION_PATTERN.lastIndex = position;
    const match = OPTION_PATTERN.exec(info);
    if (!match) {
      const end = info.slice(position).search(/\s/u);
      const token = end === -1 ? info.slice(position) : info.slice(position, position + end);
      errors.push(`Invalid option: ${token}`);
      position += Math.max(token.length, 1);
      continue;
    }

    const [, key, doubleQuoted, singleQuoted, unquoted] = match;
    const value = unescapeQuoted(doubleQuoted ?? singleQuoted ?? unquoted ?? "");
    if (values.has(key)) errors.push(`Duplicate option: ${key}`);
    values.set(key, value);
    position = OPTION_PATTERN.lastIndex;
  }

  return { values, errors };
}

export function parsePositiveSafeInteger(value: string): number | null {
  if (!/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseCountBlockConfiguration(
  info: string,
  defaults: CountBlockDefaults
): CountBlockConfiguration {
  const { values, errors } = parseOptions(info);
  let metric = defaults.metric;
  let limit = defaults.limit;
  const label = values.get("label")?.trim() || null;

  const metricValue = values.get("metric");
  if (metricValue) {
    if (isMetricId(metricValue)) metric = metricValue;
    else errors.push(`Unknown metric: ${metricValue}`);
  }

  const limitValue = values.get("limit");
  if (limitValue !== undefined) {
    const parsedLimit = parsePositiveSafeInteger(limitValue);
    if (parsedLimit === null) errors.push("Limit must be a positive integer");
    else limit = parsedLimit;
  }

  for (const key of values.keys()) {
    if (key !== "metric" && key !== "limit" && key !== "label") {
      errors.push(`Unknown option: ${key}`);
    }
  }

  return { metric, limit, label, errors };
}

function lineStarts(lines: string[]): number[] {
  const starts: number[] = [];
  let position = 0;
  for (const line of lines) {
    starts.push(position);
    position += line.length + 1;
  }
  return starts;
}

export function findCountBlocks(
  documentText: string,
  defaults: CountBlockDefaults
): CountBlockRange[] {
  const lines = documentText.split("\n");
  const starts = lineStarts(lines);
  const blocks: CountBlockRange[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const anyOpening = parseAnyFenceOpening(lines[index]);
    if (!anyOpening) continue;

    const closingPattern = closingFencePattern(anyOpening);
    let closingIndex = index + 1;
    while (closingIndex < lines.length && !closingPattern.test(lines[closingIndex])) {
      closingIndex += 1;
    }
    if (closingIndex >= lines.length) break;

    const countOpening = parseFenceOpening(lines[index]);
    if (countOpening) {
      const bodyFrom = starts[index] + lines[index].length + 1;
      const bodyTo = starts[closingIndex] - 1;
      const closingEnd = starts[closingIndex] + lines[closingIndex].length;
      blocks.push({
        from: starts[index],
        to: closingEnd,
        bodyFrom,
        bodyTo: Math.max(bodyFrom, bodyTo),
        footerPosition: closingEnd,
        source: lines.slice(index + 1, closingIndex).join("\n"),
        configuration: parseCountBlockConfiguration(countOpening.info, defaults)
      });
    }

    // Skipping every fenced block prevents count-looking content inside another
    // code fence from being interpreted as Markdown structure.
    index = closingIndex;
  }

  return blocks;
}

export function parseCountBlockSection(
  sectionText: string | undefined,
  defaults: CountBlockDefaults
): CountBlockRange | null {
  if (sectionText === undefined) return null;
  return findCountBlocks(sectionText, defaults).find((block) => block.from === 0) ?? null;
}
