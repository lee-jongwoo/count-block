import { RangeSetBuilder, type Extension } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
  WidgetType
} from "@codemirror/view";
import { findCountBlocks, type CountBlockDefaults } from "./parser";
import { presentCount, type CountPresentation } from "./presentation";

class CountFooterWidget extends WidgetType {
  constructor(private readonly presentation: CountPresentation) {
    super();
  }

  eq(other: CountFooterWidget): boolean {
    return (
      this.presentation.text === other.presentation.text &&
      this.presentation.error === other.presentation.error &&
      this.presentation.overLimit === other.presentation.overLimit
    );
  }

  toDOM(): HTMLElement {
    const footer = document.createElement("div");
    footer.className = "count-block-footer count-block-footer-editor";
    footer.setText(this.presentation.text);
    footer.setAttribute("aria-live", "polite");

    if (this.presentation.overLimit) footer.addClass("is-over-limit");
    if (this.presentation.error) {
      footer.addClass("has-error");
      footer.setAttribute("data-count-block-error", this.presentation.error);
      footer.setAttribute("aria-label", `${this.presentation.text}. ${this.presentation.error}`);
      footer.createSpan({ cls: "count-block-error", text: ` — ${this.presentation.error}` });
    }

    return footer;
  }
}

class CountBlockViewPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(
    view: EditorView,
    private readonly getDefaults: () => CountBlockDefaults
  ) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.transactions.length > 0) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  private buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const blocks = findCountBlocks(view.state.doc.toString(), this.getDefaults());

    for (const block of blocks) {
      const isNearViewport = view.visibleRanges.some(
        ({ from, to }) => block.footerPosition >= from - 1000 && block.from <= to + 1000
      );
      if (!isNearViewport) continue;

      builder.add(
        block.footerPosition,
        block.footerPosition,
        Decoration.widget({
          block: true,
          side: 1,
          widget: new CountFooterWidget(presentCount(block.source, block.configuration))
        })
      );
    }

    return builder.finish();
  }
}

export function createCountBlockEditorExtension(
  getDefaults: () => CountBlockDefaults
): Extension {
  return ViewPlugin.fromClass(
    class extends CountBlockViewPlugin {
      constructor(view: EditorView) {
        super(view, getDefaults);
      }
    },
    { decorations: (plugin) => plugin.decorations }
  ).extension;
}
