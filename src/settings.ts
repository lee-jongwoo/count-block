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
  defaultMin: number | null;
  defaultLimit: number | null;
}

export const DEFAULT_SETTINGS: CountBlockSettings = {
  defaultMetric: "words",
  defaultMin: null,
  defaultLimit: null
};

export class CountBlockSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CountBlockPlugin) {
    super(app, plugin);
  }

  private parseBound(value: string): number | null | undefined {
    const trimmed = value.trim();
    return trimmed === "" ? null : parsePositiveSafeInteger(trimmed) ?? undefined;
  }

  private boundError(key: "defaultMin" | "defaultLimit", value: string): string | undefined {
    const parsed = this.parseBound(value);
    if (parsed === undefined) return "Enter a positive integer or leave this blank.";

    const min = key === "defaultMin" ? parsed : this.plugin.settings.defaultMin;
    const max = key === "defaultLimit" ? parsed : this.plugin.settings.defaultLimit;
    return min !== null && max !== null && min > max
      ? "The default minimum cannot exceed the default maximum."
      : undefined;
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
        name: "Default minimum",
        desc: "Optional positive integer. A block-level min overrides it.",
        control: {
          type: "text",
          key: "defaultMin",
          placeholder: "No minimum",
          validate: (value) => this.boundError("defaultMin", value)
        }
      },
      {
        name: "Default maximum",
        desc: "Optional positive integer. A block-level max overrides it.",
        control: {
          type: "text",
          key: "defaultLimit",
          placeholder: "No maximum",
          validate: (value) => this.boundError("defaultLimit", value)
        }
      }
    ];
  }

  getControlValue(key: string): unknown {
    if (key === "defaultMetric") return this.plugin.settings.defaultMetric;
    if (key === "defaultMin") {
      return this.plugin.settings.defaultMin?.toString() ?? "";
    }
    if (key === "defaultLimit") {
      return this.plugin.settings.defaultLimit?.toString() ?? "";
    }
    return undefined;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === "defaultMetric" && typeof value === "string" && isMetricId(value)) {
      this.plugin.settings.defaultMetric = value;
    } else if (
      (key === "defaultMin" || key === "defaultLimit") &&
      typeof value === "string"
    ) {
      if (this.boundError(key, value)) return;
      this.plugin.settings[key] = this.parseBound(value) ?? null;
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
      .setName("Default minimum")
      .setDesc("Optional positive integer. A block-level min overrides it.")
      .addText((text) =>
        text
          .setPlaceholder("No minimum")
          .setValue(this.plugin.settings.defaultMin?.toString() ?? "")
          .onChange((value) => this.setControlValue("defaultMin", value))
      );

    new Setting(this.containerEl)
      .setName("Default maximum")
      .setDesc("Optional positive integer. A block-level max overrides it.")
      .addText((text) =>
        text
          .setPlaceholder("No maximum")
          .setValue(this.plugin.settings.defaultLimit?.toString() ?? "")
          .onChange((value) => this.setControlValue("defaultLimit", value))
      );
  }
}
