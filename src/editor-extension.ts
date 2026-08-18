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
import { appendCountFooter } from "./footer";
import { isMetricId, METRICS, METRIC_IDS } from "./metrics";
import {
  createMetricOptionChange,
  findCountBlocks,
  type CountBlockDefaults,
  type CountBlockRange
} from "./parser";
import { presentCount, type CountPresentation } from "./presentation";

const lineDecorations = {
  middle: Decoration.line({ class: "count-block-editor-line" }),
  first: Decoration.line({
    class: "count-block-editor-line count-block-editor-line-first"
  }),
  last: Decoration.line({
    class: "count-block-editor-line count-block-editor-line-last"
  }),
  only: Decoration.line({
    class:
      "count-block-editor-line count-block-editor-line-first count-block-editor-line-last"
  })
};

class CountFooterWidget extends WidgetType {
  constructor(
    private readonly block: CountBlockRange,
    private readonly presentation: CountPresentation
  ) {
    super();
  }

  eq(other: CountFooterWidget): boolean {
    return (
      this.presentation.text === other.presentation.text &&
      this.presentation.error === other.presentation.error &&
      this.presentation.overLimit === other.presentation.overLimit &&
      this.block.from === other.block.from &&
      this.block.openingTo === other.block.openingTo
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = view.dom.ownerDocument.createElement("div");
    wrapper.className = "count-block-footer-editor";
    appendCountFooter(wrapper, this.presentation, {
      metricSelector: {
        value: this.block.configuration.metric,
        options: METRIC_IDS.map((value) => ({ value, label: METRICS[value].label })),
        onChange: (value) => {
          if (!isMetricId(value) || value === this.block.configuration.metric) return;
          const change = createMetricOptionChange(
            view.state.doc.toString(),
            this.block,
            value
          );
          view.dispatch({ changes: change });
        }
      }
    });
    return wrapper;
  }
}

function decorationForLine(first: boolean, last: boolean): Decoration {
  if (first && last) return lineDecorations.only;
  if (first) return lineDecorations.first;
  if (last) return lineDecorations.last;
  return lineDecorations.middle;
}

function buildDecorations(
  state: EditorState,
  getDefaults: () => CountBlockDefaults,
  isEnabled: (state: EditorState) => boolean
): DecorationSet {
  if (!isEnabled(state)) return Decoration.none;

  const builder = new RangeSetBuilder<Decoration>();
  const blocks = findCountBlocks(state.doc.toString(), getDefaults());

  for (const block of blocks) {
    for (let position = block.from; position <= block.to; ) {
      const line = state.doc.lineAt(position);
      builder.add(
        line.from,
        line.from,
        decorationForLine(line.from === block.from, line.to >= block.to)
      );
      if (line.to >= block.to) break;
      position = line.to + 1;
    }

    builder.add(
      block.footerPosition,
      block.footerPosition,
      Decoration.widget({
        block: true,
        side: 1,
        widget: new CountFooterWidget(
          block,
          presentCount(block.source, block.configuration)
        )
      })
    );
  }

  return builder.finish();
}

export interface CountBlockEditorExtensionOptions {
  isEnabled?: (state: EditorState) => boolean;
}

export function createCountBlockEditorExtension(
  getDefaults: () => CountBlockDefaults,
  options: CountBlockEditorExtensionOptions = {}
): Extension {
  const isEnabled = options.isEnabled ?? (() => true);

  return StateField.define<DecorationSet>({
    create: (state) => buildDecorations(state, getDefaults, isEnabled),
    update: (decorations, transaction) =>
      transaction.docChanged || transaction.reconfigured || transaction.effects.length > 0
        ? buildDecorations(transaction.state, getDefaults, isEnabled)
        : decorations,
    provide: (field) => EditorView.decorations.from(field)
  });
}
