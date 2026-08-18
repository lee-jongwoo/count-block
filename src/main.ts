import { Plugin, type Editor } from "obsidian";
import { createCountBlockEditorExtension } from "./editor-extension";
import { isMetricId } from "./metrics";
import type { CountBlockDefaults } from "./parser";
import { enhanceCountBlocksInReadingView } from "./reading-view";
import {
  CountBlockSettingTab,
  DEFAULT_SETTINGS,
  type CountBlockSettings
} from "./settings";

export default class CountBlockPlugin extends Plugin {
  settings: CountBlockSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerMarkdownPostProcessor((element, context) => {
      enhanceCountBlocksInReadingView(element, context, this.getDefaults());
    });

    this.registerEditorExtension(createCountBlockEditorExtension(() => this.getDefaults()));

    this.addCommand({
      id: "insert",
      name: "Insert",
      editorCallback: (editor) => this.insertCountBlock(editor)
    });

    this.addSettingTab(new CountBlockSettingTab(this.app, this));
  }

  getDefaults(): CountBlockDefaults {
    return {
      metric: this.settings.defaultMetric,
      limit: this.settings.defaultLimit
    };
  }

  async saveSettingsAndRefresh(): Promise<void> {
    await this.saveData(this.settings);
    this.app.workspace.updateOptions();
  }

  private async loadSettings(): Promise<void> {
    const stored = (await this.loadData()) as Partial<CountBlockSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...stored };

    if (typeof this.settings.defaultMetric !== "string" || !isMetricId(this.settings.defaultMetric)) {
      this.settings.defaultMetric = DEFAULT_SETTINGS.defaultMetric;
    }
    if (
      this.settings.defaultLimit !== null &&
      (!Number.isSafeInteger(this.settings.defaultLimit) || this.settings.defaultLimit <= 0)
    ) {
      this.settings.defaultLimit = null;
    }
  }

  private insertCountBlock(editor: Editor): void {
    const selection = editor.getSelection();
    const fenceLength = Math.max(3, this.longestBacktickRun(selection) + 1);
    const fence = "`".repeat(fenceLength);
    const opening = `${fence}count metric=${this.settings.defaultMetric}`;
    if (selection.length === 0) {
      const cursor = editor.getCursor();
      editor.replaceSelection(`${opening}\n\n${fence}`);
      editor.setCursor({ line: cursor.line + 1, ch: 0 });
      return;
    }

    editor.replaceSelection(`${opening}\n${selection}\n${fence}`);
  }

  private longestBacktickRun(text: string): number {
    let longest = 0;
    for (const match of text.matchAll(/`+/gu)) longest = Math.max(longest, match[0].length);
    return longest;
  }
}
