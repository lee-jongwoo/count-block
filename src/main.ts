import { Plugin, type Editor } from "obsidian";
import { createCountBlockEditorExtension } from "./editor-extension";
import { METRICS } from "./metrics";
import {
  parseConfigurationFromSection,
  type CountBlockDefaults
} from "./parser";
import { presentCount } from "./presentation";
import {
  CountBlockSettingTab,
  DEFAULT_SETTINGS,
  type CountBlockSettings
} from "./settings";

export default class CountBlockPlugin extends Plugin {
  settings: CountBlockSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor("count", (source, el, context) => {
      const section = context.getSectionInfo(el);
      const configuration = parseConfigurationFromSection(section?.text, this.getDefaults());
      const presentation = presentCount(source, configuration);

      el.addClass("count-block");
      el.createEl("pre", { cls: "count-block-content", text: source });
      const footer = el.createDiv({ cls: "count-block-footer", text: presentation.text });
      footer.setAttribute("aria-live", "polite");

      if (presentation.overLimit) footer.addClass("is-over-limit");
      if (presentation.error) {
        footer.addClass("has-error");
        footer.createSpan({ cls: "count-block-error", text: ` — ${presentation.error}` });
      }
    });

    this.registerEditorExtension(createCountBlockEditorExtension(() => this.getDefaults()));

    this.addCommand({
      id: "insert-count-block",
      name: "Insert count block",
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

    if (!(this.settings.defaultMetric in METRICS)) {
      this.settings.defaultMetric = DEFAULT_SETTINGS.defaultMetric;
    }
    if (
      this.settings.defaultLimit !== null &&
      (!Number.isInteger(this.settings.defaultLimit) || this.settings.defaultLimit <= 0)
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
