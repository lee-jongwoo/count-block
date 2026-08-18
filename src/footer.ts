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

function showCopyState(button: HTMLButtonElement, copied: boolean): void {
  const label = copied ? "Count copied" : "Could not copy count";
  button.dataset.copyState = copied ? "copied" : "error";
  button.setAttribute("aria-label", label);
  button.title = label;

  button.ownerDocument.defaultView?.setTimeout(() => {
    delete button.dataset.copyState;
    button.setAttribute("aria-label", `Copy count: ${button.textContent ?? ""}`);
  }, 1500);
}

function appendCopyButton(footer: HTMLElement, presentation: CountPresentation): void {
  const button = footer.ownerDocument.createElement("button");
  button.type = "button";
  button.className = "count-block-value";
  button.textContent = presentation.formattedValue;
  button.setAttribute("aria-label", `Copy count: ${presentation.formattedValue}`);
  button.addEventListener("click", () => {
    const clipboard = button.ownerDocument.defaultView?.navigator.clipboard;
    if (!clipboard) {
      showCopyState(button, false);
      return;
    }

    void clipboard.writeText(String(presentation.value)).then(
      () => showCopyState(button, true),
      () => showCopyState(button, false)
    );
  });
  footer.append(button);
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

  appendCopyButton(footer, presentation);

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
