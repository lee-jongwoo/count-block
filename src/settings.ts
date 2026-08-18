import {
  App,
  PluginSettingTab,
  Setting,
  type SettingDefinitionItem
} from "obsidian";
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

  getSettingDefinitions(): SettingDefinitionItem<keyof CountBlockSettings>[] {
    return [
      {
        name: "Default metric",
        desc: "Used when a count block does not specify metric=…",
        control: {
          type: "dropdown",
          key: "defaultMetric",
          options: Object.fromEntries(
            METRIC_IDS.map((id) => [id, METRICS[id].label])
          )
        }
      },
      {
        name: "Default limit",
        desc: "Optional positive integer. A block-level limit overrides it.",
        control: {
          type: "text",
          key: "defaultLimit",
          placeholder: "No limit",
          validate: (value) =>
            value.trim() === "" || parsePositiveSafeInteger(value) !== null
              ? undefined
              : "Enter a positive integer or leave this blank."
        }
      }
    ];
  }

  getControlValue(key: string): unknown {
    if (key === "defaultMetric") return this.plugin.settings.defaultMetric;
    if (key === "defaultLimit") {
      return this.plugin.settings.defaultLimit?.toString() ?? "";
    }
    return undefined;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === "defaultMetric" && typeof value === "string" && isMetricId(value)) {
      this.plugin.settings.defaultMetric = value;
    } else if (key === "defaultLimit" && typeof value === "string") {
      const trimmed = value.trim();
      const parsed = trimmed === "" ? null : parsePositiveSafeInteger(trimmed);
      if (trimmed !== "" && parsed === null) return;
      this.plugin.settings.defaultLimit = parsed;
    } else {
      return;
    }

    await this.plugin.saveSettingsAndRefresh();
  }

  // Fallback for Obsidian versions older than 1.13.0.
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
