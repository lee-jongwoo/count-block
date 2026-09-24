import { METRICS } from "./metrics";
import type { CountBlockConfiguration } from "./parser";

export interface CountPresentation {
  value: number;
  metricLabel: string;
  formattedValue: string;
  formattedLimit: string | null;
  comparison: string | null;
  text: string;
  belowMinimum: boolean;
  overLimit: boolean;
  error: string | null;
}

const NUMBER_FORMATTER = new Intl.NumberFormat();

export function presentCount(source: string, config: CountBlockConfiguration): CountPresentation {
  const metric = METRICS[config.metric];
  const value = metric.count(source);
  const formattedValue = NUMBER_FORMATTER.format(value);
  const formattedMin = config.min === null ? null : NUMBER_FORMATTER.format(config.min);
  const formattedLimit = config.limit === null ? null : NUMBER_FORMATTER.format(config.limit);
  const belowMinimum = config.min !== null && value < config.min;
  const overLimit = config.limit !== null && value > config.limit;
  const comparison = belowMinimum
    ? ` < ${formattedMin}`
    : overLimit
      ? ` > ${formattedLimit}`
      : formattedLimit !== null
        ? ` / ${formattedLimit}`
        : null;
  const text = `${metric.label}: ${formattedValue}${comparison ?? ""}`;

  return {
    value,
    metricLabel: metric.label,
    formattedValue,
    formattedLimit,
    comparison,
    text,
    belowMinimum,
    overLimit,
    error: config.errors.length > 0 ? config.errors.join("; ") : null
  };
}
