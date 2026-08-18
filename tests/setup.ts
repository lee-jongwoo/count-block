// Obsidian adds these helpers to every DOM node at runtime. Recreate the
// subset used by the plugin when tests run in jsdom.
if (typeof Node !== "undefined") {
  Node.prototype.createEl = function <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options: DomElementInfo | string = {}
  ): HTMLElementTagNameMap[K] {
    const element = this.ownerDocument!.createElement(tag);
    const normalized = typeof options === "string" ? { cls: options } : options;

    if (normalized.cls) {
      const classes = Array.isArray(normalized.cls)
        ? normalized.cls
        : normalized.cls.split(/\s+/u);
      element.classList.add(...classes.filter(Boolean));
    }
    if (normalized.text !== undefined) element.append(normalized.text);
    if (normalized.attr) {
      for (const [name, value] of Object.entries(normalized.attr)) {
        if (value !== null) element.setAttribute(name, String(value));
      }
    }
    if (normalized.value !== undefined) element.setAttribute("value", normalized.value);

    this.appendChild(element);
    return element;
  };

  Node.prototype.createDiv = function (
    options?: DomElementInfo | string
  ): HTMLDivElement {
    return this.createEl("div", options);
  };

  Node.prototype.createSpan = function (
    options?: DomElementInfo | string
  ): HTMLSpanElement {
    return this.createEl("span", options);
  };
}
