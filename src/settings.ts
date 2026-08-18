import { App, PluginSettingTab, Setting } from "obsidian";
import { isMetricId, METRICS, METRIC_IDS, type MetricId } from "./metrics";
import { parsePositiveSafeInteger } from "./parser";
import type CountBlockPlugin from "./main";

export interface CountBlockSettings {
  defaultMetric: MetricId;
  defaultLimit: number | null;
}

export const DEFAULT_SETTINGS: CountBlockSettings = {
  defaultMetric: "words",
  defaultLimit: null
};

export class CountBlockSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CountBlockPlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName("Default metric")
      .setDesc("Used when a count block does not specify metric=…")
      .addDropdown((dropdown) => {
        for (const id of METRIC_IDS) dropdown.addOption(id, METRICS[id].label);
        dropdown.setValue(this.plugin.settings.defaultMetric).onChange(async (value) => {
          if (isMetricId(value)) {
            this.plugin.settings.defaultMetric = value;
            await this.plugin.saveSettingsAndRefresh();
          }
        });
      });

    new Setting(this.containerEl)
      .setName("Default limit")
      .setDesc("Optional positive integer. A block-level limit overrides it.")
      .addText((text) =>
        text
          .setPlaceholder("No limit")
          .setValue(this.plugin.settings.defaultLimit?.toString() ?? "")
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed === "") {
              this.plugin.settings.defaultLimit = null;
              await this.plugin.saveSettingsAndRefresh();
              return;
            }

            const parsed = parsePositiveSafeInteger(trimmed);
            if (parsed !== null) {
              this.plugin.settings.defaultLimit = parsed;
              await this.plugin.saveSettingsAndRefresh();
            }
          })
      );
  }
}
