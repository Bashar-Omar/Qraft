import Link from "next/link";

import { PhaseCard } from "@/components/foundation/phase-card";
import { QrMotif } from "@/components/foundation/qr-motif";

const systemNotes = [
  ["PHASE", "02A / VISUAL STUDIO"],
  ["RUNTIME", "BROWSER-FIRST"],
  ["PERSISTENCE", "NO ACCOUNT"],
  ["DEPLOYMENT", "STATIC-EXPORT READY"],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero shell">
        <div className="hero__copy">
          <span className="mono-label accent-marker">QRAFT / SYSTEM / 02A</span>
          <h1>Craft codes that work.</h1>
          <p className="hero__lede">
            A privacy-first QR and barcode studio designed as a serious creative tool — precise,
            standards-aware, and built in the browser.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/generate">
              Open QR studio
            </Link>
            <Link className="button button--secondary" href="/guides">
              Architecture notes
            </Link>
          </div>
          <p className="hero__honesty">
            Phase 2A keeps the Core QR payloads and adds local designer rendering, Qraft-owned
            presets, gradients, module/eye styles and styled SVG/PNG export.
          </p>
        </div>

        <div className="hero-visual" aria-label="Qraft Visual Studio preview">
          <div className="hero-visual__toolbar">
            <span className="mono-label">QRAFT / LOCAL ENGINE</span>
            <span className="status-dot">DESIGNER / LIVE</span>
          </div>
          <div className="hero-visual__canvas">
            <div className="hero-visual__code">
              <QrMotif />
            </div>
            <div className="hero-visual__annotation">
              <span>CLIENT FIRST</span>
              <strong>02A</strong>
              <span>NO CLOUD DATA</span>
            </div>
          </div>
          <div className="hero-visual__footer">
            <span>STATIC EXPORT</span>
            <span>TYPE-SAFE</span>
            <span>ACCESSIBLE</span>
          </div>
        </div>
      </section>

      <section className="system-strip shell" aria-label="Visual Studio status">
        {systemNotes.map(([label, value]) => (
          <div className="system-strip__item" key={label}>
            <span className="mono-label">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="product-map shell">
        <div className="section-heading">
          <span className="mono-label accent-marker">PRODUCT / MAP</span>
          <h2>One studio. Four focused surfaces.</h2>
          <p>
            The interface grows by capability instead of becoming a dashboard full of unrelated
            generators.
          </p>
        </div>

        <div className="phase-grid">
          <PhaseCard
            description="Intent-first payload editing, styling, live preview, quality and export."
            eyebrow="01 / PRIMARY"
            href="/generate"
            status="LIVE"
            title="Generate"
          />
          <PhaseCard
            description="Camera or image decoding with a local inspector and explicit actions."
            eyebrow="05 / DECODER"
            href="/scan"
            status="PLANNED"
            title="Scan"
          />
          <PhaseCard
            description="CSV mapping, validation, bounded generation and ZIP/PDF output."
            eyebrow="07 / SCALE"
            href="/batch"
            status="PLANNED"
            title="Batch"
          />
          <PhaseCard
            description="Standards-aware explanations, architecture decisions and practical guides."
            eyebrow="DOCS / TRUST"
            href="/guides"
            status="ACTIVE"
            title="Guides"
          />
        </div>
      </section>

      <section className="architecture-band shell">
        <div>
          <span className="mono-label">ARCHITECTURE / CONTRACT</span>
          <h2>UI does not own the engines.</h2>
        </div>
        <div className="architecture-flow" aria-label="Architecture flow">
          <span>Payload</span>
          <i>→</i>
          <span>Use case</span>
          <i>→</i>
          <span>Port</span>
          <i>→</i>
          <span>Adapter</span>
          <i>→</i>
          <span>Artifact</span>
        </div>
      </section>
    </>
  );
}
