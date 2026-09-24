import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({ PluginSettingTab: class {} }));

import { CountBlockSettingTab, DEFAULT_SETTINGS } from "../src/settings";
import type CountBlockPlugin from "../src/main";

function createTab() {
  const plugin = {
    settings: { ...DEFAULT_SETTINGS },
    saveSettingsAndRefresh: vi.fn().mockResolvedValue(undefined)
  };
  const tab = new CountBlockSettingTab({} as never, plugin as unknown as CountBlockPlugin);
  return { tab, plugin };
}

describe("default bounds settings", () => {
  it("saves the default minimum and exposes it in the settings panel", async () => {
    const { tab, plugin } = createTab();
    const definition = tab.getSettingDefinitions().find(
      (item) => "name" in item && item.name === "Default minimum"
    );

    expect(definition && "control" in definition ? definition.control : null).toMatchObject({
      type: "text",
      key: "defaultMin"
    });
    await tab.setControlValue("defaultMin", " 200 ");
    expect(plugin.settings.defaultMin).toBe(200);
    expect(tab.getControlValue("defaultMin")).toBe("200");
    expect(plugin.saveSettingsAndRefresh).toHaveBeenCalledOnce();
  });

  it("rejects a default minimum above the maximum", async () => {
    const { tab, plugin } = createTab();
    plugin.settings.defaultLimit = 100;

    await tab.setControlValue("defaultMin", "200");

    expect(plugin.settings.defaultMin).toBeNull();
    expect(plugin.saveSettingsAndRefresh).not.toHaveBeenCalled();
  });
});
