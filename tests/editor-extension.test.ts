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

  it("only adds an editor footer while the block source is being edited", () => {
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

    expect(parent.querySelector(".count-block-footer")).toBeNull();

    view.dispatch({ selection: { anchor: doc.indexOf("text") } });
    expect(parent.querySelector(".count-block-footer")?.textContent).toBe("NEIS bytes: 4");
  });
});
