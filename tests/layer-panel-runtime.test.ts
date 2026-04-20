import test from "node:test";
import assert from "node:assert/strict";

test("LayerPanel and PropertiesPanel modules should load without throwing", async () => {
  const layerPanelModule = await import(
    "../packages/sdk-react/src/components/LayerPanel.js"
  );
  const propertiesPanelModule = await import(
    "../packages/sdk-react/src/components/PropertiesPanel.js"
  );

  assert.equal(typeof layerPanelModule.LayerPanel, "function");
  assert.equal(typeof propertiesPanelModule.PropertiesPanel, "function");
});
