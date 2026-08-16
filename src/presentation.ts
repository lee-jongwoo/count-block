import { METRICS } from "./metrics";
import type { CountBlockConfiguration } from "./parser";

export interface CountPresentation {
  value: number;
  text: string;
  overLimit: boolean;
  error: string | null;
}

const NUMBER_FORMATTER = new Intl.NumberFormat();

export function presentCount(source: string, config: CountBlockConfiguration): CountPresentation {
  const metric = METRICS[config.metric];
  const value = metric.count(source);
  const name = config.label ?? metric.label;
  const formattedValue = NUMBER_FORMATTER.format(value);
  const text = config.limit
    ? `${name}: ${formattedValue} / ${NUMBER_FORMATTER.format(config.limit)}`
    : `${name}: ${formattedValue}`;

  return {
    value,
    text,
    overLimit: config.limit !== null && value > config.limit,
    error: config.errors.length > 0 ? config.errors.join("; ") : null
  };
}
