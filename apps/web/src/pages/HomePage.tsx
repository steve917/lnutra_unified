import { Link } from "react-router-dom";

export default function HomePage() {
  const shell: React.CSSProperties = {
    maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial"
  };
  const h1: React.CSSProperties = { fontSize: 36, fontWeight: 700, marginBottom: 12 };
  const p:  React.CSSProperties = { fontSize: 18, lineHeight: 1.5, color: "#444" };
  const row: React.CSSProperties = { display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" };
  const btn: React.CSSProperties = {
    display: "inline-block", padding: "12px 18px", borderRadius: 8, textDecoration: "none",
    border: "1px solid #2b60ff", background: "#2b60ff", color: "white", fontWeight: 600
  };
  const btn2: React.CSSProperties = { ...btn, background: "white", color: "#2b60ff" };

  return (
    <main style={shell}>
      <h1 style={h1}>L-Nutra FMD Predictor</h1>
      <p style={p}>
        Estimate expected changes in weight and HbA1c with the FMD regimen. Enter a few inputs,
        get a quick prediction, and export the result for your notes.
      </p>

      <div style={row}>
        <Link to="/predictor" style={btn}>Open Predictor</Link>
        <Link to="/ops" style={btn2} title="Internal dashboard (login required)">Ops Dashboard</Link>
      </div>

      <hr style={{ margin: "32px 0" }} />

      <section>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>How it works</h2>
        <ul style={{ color: "#444", lineHeight: 1.6 }}>
          <li>Inputs: age, sex, weight, BMI, HbA1c, regimen, cycles, adherence, diabetes meds.</li>
          <li>Outputs: predicted change in weight and HbA1c, plus a simple green/amber/red badge.</li>
          <li>All predictions are logged to the Ops dashboard for QA.</li>
        </ul>
      </section>
    </main>
  );
}
