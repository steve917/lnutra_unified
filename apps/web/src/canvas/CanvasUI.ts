// apps/web/src/canvas/CanvasUI.ts
// Minimal immediate-mode canvas UI: buttons, text, text inputs, table.
// Not a full framework—just enough to ship.

export type Theme = {
  bg: string;
  panel: string;
  text: string;
  subtext: string;
  accent: string;
  danger: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  codeBg: string;
};

export const theme: Theme = {
  bg: "#0f1221",
  panel: "#161a2a",
  text: "#eaf0ff",
  subtext: "#a5b0cf",
  accent: "#77b5ff",
  danger: "#ff6b6b",
  border: "#27304b",
  inputBg: "#0f1424",
  inputBorder: "#2c3552",
  inputFocus: "#80c0ff",
  codeBg: "#0c0f1c",
};

export type UIState = {
  mx: number;
  my: number;
  mouseDown: boolean;
  clicked: boolean;
  key?: string;
  keyCode?: string;
  ctrl: boolean;
  shift: boolean;
  focusedId?: string;
};

export type UIContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  t: Theme;
  state: UIState;
  requestDraw: () => void;
};

export function setupCtx(ctx: CanvasRenderingContext2D) {
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
}

export function clear(ui: UIContext) {
  const { ctx, width, height, t } = ui;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, width, height);
}

export function title(ui: UIContext, text: string, x: number, y: number) {
  const { ctx, t } = ui;
  ctx.fillStyle = t.text;
  ctx.font = "700 28px Inter, ui-sans-serif, system-ui";
  ctx.fillText(text, x, y);
  ctx.font = "14px ui-sans-serif, system-ui";
}

export function label(ui: UIContext, text: string, x: number, y: number, color = ui.t.subtext) {
  const { ctx } = ui;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function pill(ui: UIContext, text: string, x: number, y: number) {
  const { ctx, t } = ui;
  const padX = 8;
  const padY = 6;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 22;

  ctx.fillStyle = t.panel;
  roundRect(ctx, x, y - h / 2, w, h, 10);
  ctx.fill();

  ctx.strokeStyle = t.border;
  ctx.stroke();

  ctx.fillStyle = t.subtext;
  ctx.fillText(text, x + padX, y);
}

export function button(ui: UIContext, id: string, x: number, y: number, w: number, h: number, text: string): boolean {
  const { ctx, state, t } = ui;
  const hover = pointInRect(state.mx, state.my, x, y, w, h);
  ctx.fillStyle = hover ? "#1f2640" : t.panel;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();

  ctx.strokeStyle = hover ? t.accent : t.border;
  ctx.stroke();

  ctx.fillStyle = t.text;
  centerText(ctx, text, x, y, w, h);

  const clicked = state.clicked && hover;
  return clicked;
}

export function textInput(
  ui: UIContext,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  setValue: (s: string) => void,
  opts?: { placeholder?: string; numeric?: boolean }
) {
  const { ctx, state, t } = ui;
  const r = { x, y, w, h };
  const hover = pointInRect(state.mx, state.my, r.x, r.y, r.w, r.h);
  const focused = state.focusedId === id;

  ctx.fillStyle = t.inputBg;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();

  ctx.strokeStyle = focused ? t.inputFocus : hover ? t.accent : t.inputBorder;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 8);
  ctx.clip();

  ctx.fillStyle = value ? t.text : t.subtext;
  const pad = 10;
  const text = value || opts?.placeholder || "";
  ctx.fillText(text, x + pad, y + h / 2);

  ctx.restore();

  if (state.clicked && hover) {
    // focus
    state.focusedId = id;
  } else if (state.clicked && !hover && focused) {
    // blur
    state.focusedId = undefined;
  }

  if (focused && state.key !== undefined) {
    let out = value;
    if (state.key === "Backspace") {
      out = out.slice(0, -1);
    } else if (state.key.length === 1) {
      const ch = state.key;
      if (opts?.numeric) {
        if (/[\d\.\-]/.test(ch)) out += ch;
      } else {
        out += ch;
      }
    }
    setValue(out);
  }
}

export function tableHeader(ui: UIContext, cols: string[], x: number, y: number, w: number, colWidths: number[]) {
  const { ctx, t } = ui;
  ctx.fillStyle = t.panel;
  roundRect(ctx, x, y, w, 30, 10);
  ctx.fill();
  ctx.strokeStyle = t.border;
  ctx.stroke();
  ctx.fillStyle = t.subtext;
  let cx = x + 10;
  cols.forEach((c, i) => {
    ctx.fillText(c, cx, y + 15);
    cx += colWidths[i];
  });
}

export function tableRow(ui: UIContext, cells: string[], x: number, y: number, w: number, colWidths: number[], stripe = false) {
  const { ctx, t } = ui;
  ctx.fillStyle = stripe ? "#141a2c" : "#101527";
  roundRect(ctx, x, y, w, 30, 10);
  ctx.fill();

  ctx.strokeStyle = t.border;
  ctx.stroke();

  ctx.fillStyle = t.text;
  let cx = x + 10;
  cells.forEach((c, i) => {
    ctx.fillText(c, cx, y + 15);
    cx += colWidths[i];
  });
}

export function codeBlock(ui: UIContext, text: string, x: number, y: number, w: number, h: number) {
  const { ctx, t } = ui;
  ctx.fillStyle = t.codeBg;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = t.border;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  ctx.fillStyle = t.subtext;

  const pad = 10;
  const lineH = 18;
  const lines = text.split("\n");
  lines.slice(0, Math.floor(h / lineH) - 1).forEach((ln, i) => {
    ctx.fillText(ln, x + pad, y + pad + i * lineH + 8);
  });
  ctx.restore();
}

// Helpers
function pointInRect(px: number, py: number, x: number, y: number, w: number, h: number) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function centerText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number) {
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, x + (w - tw) / 2, y + h / 2);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
