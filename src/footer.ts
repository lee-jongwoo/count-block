import type { CountPresentation } from "./presentation";

export interface CountFooterMetricOption {
  value: string;
  label: string;
}

export interface CountFooterMetricSelector {
  value: string;
  options: readonly CountFooterMetricOption[];
  onChange: (value: string) => void;
}

export interface CountFooterOptions {
  className?: string;
  metricSelector?: CountFooterMetricSelector;
}

function appendMetricControl(
  footer: HTMLElement,
  presentation: CountPresentation,
  selector: CountFooterMetricSelector | undefined
): void {
  if (!selector) {
    const label = footer.ownerDocument.createElement("span");
    label.className = "count-block-metric-label";
    label.textContent = presentation.metricLabel;
    footer.append(label);
    return;
  }

  const control = footer.ownerDocument.createElement("span");
  control.className = "count-block-metric-control";

  const select = footer.ownerDocument.createElement("select");
  select.className = "count-block-metric-select";
  select.setAttribute("aria-label", "Count metric");
  for (const metric of selector.options) {
    const option = footer.ownerDocument.createElement("option");
    option.value = metric.value;
    option.textContent = metric.label;
    select.append(option);
  }
  select.value = selector.value;
  select.addEventListener("change", () => selector.onChange(select.value));
  control.append(select);
  footer.append(control);
}

function appendCountValue(footer: HTMLElement, presentation: CountPresentation): void {
  const value = footer.ownerDocument.createElement("span");
  value.className = "count-block-value";
  value.textContent = presentation.formattedValue;
  footer.append(value);
}

export function appendCountFooter(
  parent: HTMLElement,
  presentation: CountPresentation,
  options: CountFooterOptions = {}
): HTMLDivElement {
  const footer = parent.ownerDocument.createElement("div");
  footer.className = ["count-block-footer", options.className].filter(Boolean).join(" ");
  footer.setAttribute("aria-live", "polite");

  appendMetricControl(footer, presentation, options.metricSelector);

  const separator = parent.ownerDocument.createElement("span");
  separator.className = "count-block-separator";
  separator.textContent = ": ";
  footer.append(separator);

  appendCountValue(footer, presentation);

  if (presentation.formattedLimit !== null) {
    const limit = parent.ownerDocument.createElement("span");
    limit.className = "count-block-limit";
    limit.textContent = ` / ${presentation.formattedLimit}`;
    footer.append(limit);
  }

  if (presentation.overLimit) footer.classList.add("is-over-limit");
  if (presentation.error) {
    footer.classList.add("has-error");
    footer.dataset.countBlockError = presentation.error;
    footer.setAttribute("aria-label", `${presentation.text}. ${presentation.error}`);

    const error = parent.ownerDocument.createElement("span");
    error.className = "count-block-error";
    error.textContent = ` — ${presentation.error}`;
    footer.append(error);
  }

  parent.append(footer);
  return footer;
}
