import { METRICS } from "./metrics";
import type { CountBlockConfiguration } from "./parser";

export interface CountPresentation {
  value: number;
  metricLabel: string;
  formattedValue: string;
  formattedLimit: string | null;
  text: string;
  overLimit: boolean;
  error: string | null;
}

const NUMBER_FORMATTER = new Intl.NumberFormat();

export function presentCount(source: string, config: CountBlockConfiguration): CountPresentation {
  const metric = METRICS[config.metric];
  const value = metric.count(source);
  const formattedValue = NUMBER_FORMATTER.format(value);
  const formattedLimit = config.limit === null ? null : NUMBER_FORMATTER.format(config.limit);
  const text = config.limit
    ? `${metric.label}: ${formattedValue} / ${formattedLimit}`
    : `${metric.label}: ${formattedValue}`;

  return {
    value,
    metricLabel: metric.label,
    formattedValue,
    formattedLimit,
    text,
    overLimit: config.limit !== null && value > config.limit,
    error: config.errors.length > 0 ? config.errors.join("; ") : null
  };
}
