// apps/web/src/scenes/PredictScene.ts
import { UIContext, title, label, textInput, button, codeBlock, tableHeader, tableRow } from "../canvas/CanvasUI";
import { PredictPayload, predict } from "../lib/api";

type LocalState = {
  form: PredictPayload;
  loading: boolean;
  err?: string;
  resultText?: string;
};

const S: LocalState = {
  form: {
    adherence_pct: 90,
    age_years: 40,
    bmi: 22,
    fmd_regimen_type: "standard_fmd",
    hba1c: 5.6,
    meds_diabetes: 0,
    n_cycles: 4,
    sex: "M",
    weight_kg: 70,
  },
  loading: false,
};

export default async function PredictScene(ui: UIContext) {
  const { form } = S;

  title(ui, "Prediction", 24, 36);

  // left column form
  const baseX = 24;
  const baseY = 80;
  const W = 290;
  const H = 34;
  let y = baseY;

  label(ui, "adherence_pct", baseX, y - 14);
  textInput(ui, "adherence_pct", baseX, y, W, H, String(form.adherence_pct), v => (S.form.adherence_pct = Number(v) || 0), { numeric: true });
  y += 54;

  label(ui, "age_years", baseX, y - 14);
  textInput(ui, "age_years", baseX, y, W, H, String(form.age_years), v => (S.form.age_years = Number(v) || 0), { numeric: true });
  y += 54;

  label(ui, "bmi", baseX, y - 14);
  textInput(ui, "bmi", baseX, y, W, H, String(form.bmi), v => (S.form.bmi = Number(v) || 0), { numeric: true });
  y += 54;

  label(ui, "fmd_regimen_type", baseX, y - 14);
  textInput(ui, "fmd_regimen_type", baseX, y, W, H, form.fmd_regimen_type, v => (S.form.fmd_regimen_type = v || "standard_fmd"));
  y += 54;

  label(ui, "hba1c", baseX, y - 14);
  textInput(ui, "hba1c", baseX, y, W, H, String(form.hba1c), v => (S.form.hba1c = Number(v) || 0), { numeric: true });
  y += 54;

  label(ui, "meds_diabetes (0/1)", baseX, y - 14);
  textInput(ui, "meds_diabetes", baseX, y, W, H, String(form.meds_diabetes), v => (S.form.meds_diabetes = Number(v) ? 1 : 0), { numeric: true });
  y += 54;

  label(ui, "n_cycles", baseX, y - 14);
  textInput(ui, "n_cycles", baseX, y, W, H, String(form.n_cycles), v => (S.form.n_cycles = Number(v) || 0), { numeric: true });
  y += 54;

  label(ui, 'sex ("M" or "F")', baseX, y - 14);
  textInput(ui, "sex", baseX, y, W, H, form.sex, v => (S.form.sex = (v?.toUpperCase() === "F" ? "F" : "M")));
  y += 54;

  label(ui, "weight_kg", baseX, y - 14);
  textInput(ui, "weight_kg", baseX, y, W, H, String(form.weight_kg), v => (S.form.weight_kg = Number(v) || 0), { numeric: true });

  const predictClicked = button(ui, "predict_btn", baseX, y + 54, 140, 38, S.loading ? "Predicting..." : "Predict");
  if (predictClicked && !S.loading) {
    S.loading = true;
    S.err = undefined;
    ui.requestDraw();
    try {
      const res = await predict(S.form);
      S.resultText = JSON.stringify(res, null, 2);
    } catch (e: any) {
      S.err = e?.message || "Prediction failed";
      S.resultText = JSON.stringify(e?.response?.data ?? { error: S.err }, null, 2);
    } finally {
      S.loading = false;
      ui.requestDraw();
    }
  }

  // Right side: result panel
  const RX = baseX + 320;
  title(ui, "Result", RX, 36);

  if (S.err) {
    label(ui, `Error: ${S.err}`, RX, 68, "#ff8e8e");
  }

  const pretty = S.resultText ?? "{\n  /* submit to see result */\n}";
  codeBlock(ui, pretty, RX, 80, Math.min(600, ui.width - RX - 24), Math.min(300, ui.height - 120));

  // Optional: table that mirrors the form (just for clarity)
  const tableX = RX;
  const tableY = 400;
  const cols = ["Feature", "Value"];
  const colW = [220, 220];
  tableHeader(ui, cols, tableX, tableY, colW[0] + colW[1] + 20, colW);

  const rows: [string, string][] = Object.entries(S.form).map(([k, v]) => [k, String(v)]);
  let ry = tableY + 36;
  rows.slice(0, 10).forEach((r, i) => {
    tableRow(ui, r, tableX, ry, colW[0] + colW[1] + 20, colW, i % 2 === 1);
    ry += 34;
  });
}
