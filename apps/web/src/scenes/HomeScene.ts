// apps/web/src/scenes/HomeScene.ts
import { UIContext, title, label, pill } from "../canvas/CanvasUI";

export default function HomeScene(ui: UIContext) {
  title(ui, "L-Nutra Predictor", 24, 36);
  label(ui, "Everything on this app is rendered on Canvas. Use the nav to try Predictions or view Ops data.", 26, 72);
  pill(ui, "Canvas UI • Fast • Minimal", 28, 110);
}
