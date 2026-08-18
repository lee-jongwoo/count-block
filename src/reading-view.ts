import type { MarkdownPostProcessorContext } from "obsidian";
import { appendCountFooter } from "./footer";
import {
  parseCountBlockConfiguration,
  parseCountBlockSection,
  type CountBlockDefaults
} from "./parser";
import { presentCount } from "./presentation";

function countCodeElements(root: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>("pre > code.language-count")
  );
  if (root.matches("pre > code.language-count")) elements.unshift(root);
  return elements;
}

export function enhanceCountBlocksInReadingView(
  root: HTMLElement,
  context: Pick<MarkdownPostProcessorContext, "getSectionInfo">,
  defaults: CountBlockDefaults
): void {
  if (root.closest(".markdown-source-view")) return;

  for (const code of countCodeElements(root)) {
    const pre = code.parentElement;
    if (!pre || pre.dataset.countBlockEnhanced === "true" || !pre.parentElement) continue;

    const sectionText = context.getSectionInfo(pre)?.text;
    const parsed = parseCountBlockSection(sectionText, defaults);
    const source = parsed?.source ?? (code.textContent ?? "").replace(/\n$/u, "");
    const configuration =
      parsed?.configuration ?? parseCountBlockConfiguration("", defaults);

    const wrapper = pre.ownerDocument.createElement("div");
    wrapper.className = "count-block count-block-reading";
    pre.before(wrapper);
    wrapper.append(pre);

    pre.dataset.countBlockEnhanced = "true";
    pre.classList.add("count-block-content");
    appendCountFooter(wrapper, presentCount(source, configuration));
  }
}
