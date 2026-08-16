// @vitest-environment jsdom

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { createCountBlockEditorExtension } from "../src/editor-extension";

const defaults = { metric: "neis-bytes" as const, limit: null };

let view: EditorView | undefined;

afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.replaceChildren();
});

describe("count block editor extension", () => {
  it("can initialize an editor containing a count block", () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const doc = ["before", "````count metric=neis-bytes", "text", "````", "after"].join("\n");

    expect(() => {
      view = new EditorView({
        parent,
        state: EditorState.create({
          doc,
          selection: { anchor: doc.indexOf("text") },
          extensions: [createCountBlockEditorExtension(() => defaults)]
        })
      });
    }).not.toThrow();

    expect(parent.querySelector(".count-block-footer")?.textContent).toBe("NEIS bytes: 4");
  });

  it("keeps the editor footer mounted when the selection leaves the block", () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const doc = ["before", "````count", "text", "````", "after"].join("\n");

    view = new EditorView({
      parent,
      state: EditorState.create({
        doc,
        selection: { anchor: 0 },
        extensions: [createCountBlockEditorExtension(() => defaults)]
      })
    });

    expect(parent.querySelector(".count-block-footer")?.textContent).toBe("NEIS bytes: 4");

    view.dispatch({ selection: { anchor: doc.indexOf("text") } });
    expect(parent.querySelector(".count-block-footer")?.textContent).toBe("NEIS bytes: 4");

    view.dispatch({ selection: { anchor: doc.length } });
    expect(parent.querySelector(".count-block-footer")?.textContent).toBe("NEIS bytes: 4");
  });
});
