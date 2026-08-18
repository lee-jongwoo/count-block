import type { CountPresentation } from "./presentation";

export interface CountFooterOptions {
  className?: string;
}

export function appendCountFooter(
  parent: HTMLElement,
  presentation: CountPresentation,
  options: CountFooterOptions = {}
): HTMLDivElement {
  const footer = parent.ownerDocument.createElement("div");
  footer.className = ["count-block-footer", options.className].filter(Boolean).join(" ");
  footer.textContent = presentation.text;
  footer.setAttribute("aria-live", "polite");

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
