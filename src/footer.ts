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
    footer.createSpan({
      cls: "count-block-metric-label",
      text: presentation.metricLabel
    });
    return;
  }

  const control = footer.createSpan({ cls: "count-block-metric-control" });

  const select = control.createEl("select", {
    cls: "count-block-metric-select",
    attr: { "aria-label": "Count metric" }
  });
  for (const metric of selector.options) {
    select.createEl("option", { value: metric.value, text: metric.label });
  }
  select.value = selector.value;
  select.addEventListener("change", () => selector.onChange(select.value));
}

function appendCountValue(footer: HTMLElement, presentation: CountPresentation): void {
  footer.createSpan({
    cls: "count-block-value",
    text: presentation.formattedValue
  });
}

export function appendCountFooter(
  parent: HTMLElement,
  presentation: CountPresentation,
  options: CountFooterOptions = {}
): HTMLDivElement {
  const footer = parent.createDiv({
    cls: ["count-block-footer", options.className].filter(Boolean).join(" "),
    attr: { "aria-live": "polite" }
  });

  appendMetricControl(footer, presentation, options.metricSelector);

  footer.createSpan({ cls: "count-block-separator", text: ": " });

  appendCountValue(footer, presentation);

  if (presentation.formattedLimit !== null) {
    footer.createSpan({
      cls: "count-block-limit",
      text: ` / ${presentation.formattedLimit}`
    });
  }

  if (presentation.overLimit) footer.classList.add("is-over-limit");
  if (presentation.error) {
    footer.classList.add("has-error");
    footer.dataset.countBlockError = presentation.error;
    footer.setAttribute("aria-label", `${presentation.text}. ${presentation.error}`);

    footer.createSpan({
      cls: "count-block-error",
      text: ` — ${presentation.error}`
    });
  }

  return footer;
}
