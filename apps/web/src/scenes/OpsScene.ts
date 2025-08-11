// apps/web/src/scenes/OpsScene.ts
import {
  UIContext, title, label, tableHeader, tableRow,
} from "../canvas/CanvasUI";
import { apiBase, getFeatureColumns, hasBasicAuth } from "../lib/api";

const Local = {
  features: [] as string[],
  loading: false,
  fetched: false,
  err: "" as string | undefined,
};

export default async function OpsScene(ui: UIContext) {
  title(ui, "Ops", 24, 36);

  label(ui, `API_BASE: ${apiBase}`, 26, 68);
  label(ui, `Has Basic: ${hasBasicAuth ? "yes" : "no"}`, 26, 92);

  if (!Local.fetched && !Local.loading) {
    Local.loading = true;
    try {
      Local.features = await getFeatureColumns();
      Local.err = undefined;
    } catch (e: any) {
      Local.err = e?.message || "Failed to load features";
    } finally {
      Local.loading = false;
      Local.fetched = true;
      ui.requestDraw();
    }
  }

  if (Local.err) {
    label(ui, Local.err, 26, 124, "#ff8e8e");
  }

  const x = 24;
  const y = 150;
  const cols = ["#", "Feature name"];
  const colW = [40, 400];

  tableHeader(ui, cols, x, y, colW[0] + colW[1] + 20, colW);

  let ty = y + 36;
  Local.features.forEach((name, i) => {
    tableRow(ui, [String(i + 1), name], x, ty, colW[0] + colW[1] + 20, colW, i % 2 === 1);
    ty += 34;
  });
}
