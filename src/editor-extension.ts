import {
  RangeSetBuilder,
  StateField,
  type EditorState,
  type Extension
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
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
    const wrapper = document.createElement("div");
    wrapper.className = "count-block-footer-editor";

    const footer = document.createElement("div");
    footer.className = "count-block-footer";
    footer.textContent = this.presentation.text;
    footer.setAttribute("aria-live", "polite");

    if (this.presentation.overLimit) footer.classList.add("is-over-limit");
    if (this.presentation.error) {
      footer.classList.add("has-error");
      footer.setAttribute("data-count-block-error", this.presentation.error);
      footer.setAttribute("aria-label", `${this.presentation.text}. ${this.presentation.error}`);
      const error = document.createElement("span");
      error.className = "count-block-error";
      error.textContent = ` — ${this.presentation.error}`;
      footer.append(error);
    }

    wrapper.append(footer);
    return wrapper;
  }
}

function buildDecorations(
  state: EditorState,
  getDefaults: () => CountBlockDefaults
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const blocks = findCountBlocks(state.doc.toString(), getDefaults());

  for (const block of blocks) {
    const isBeingEdited = state.selection.ranges.some(
      ({ from, to }) => to >= block.from && from <= block.to
    );
    if (!isBeingEdited) continue;

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

export function createCountBlockEditorExtension(
  getDefaults: () => CountBlockDefaults
): Extension {
  return StateField.define<DecorationSet>({
    create: (state) => buildDecorations(state, getDefaults),
    update: (decorations, transaction) =>
      transaction.docChanged || transaction.selection !== undefined || transaction.reconfigured
        ? buildDecorations(transaction.state, getDefaults)
        : decorations,
    provide: (field) => EditorView.decorations.from(field)
  });
}
