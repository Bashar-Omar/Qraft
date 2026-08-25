import { QrMotif } from "@/components/foundation/qr-motif";

const types = ["URL", "Wi-Fi", "Contact", "WhatsApp", "Text", "More…"] as const;

export default function GeneratePage() {
  return (
    <section className="studio-page shell">
      <div className="page-intro">
        <span className="mono-label accent-marker">GENERATE / FOUNDATION SHELL</span>
        <h1>The studio architecture is in place.</h1>
        <p>
          Phase 1 will connect the payload registry, safe QR renderer, live preview and SVG/PNG
          exporters to this surface.
        </p>
      </div>

      <div className="studio-shell" data-testid="studio-shell">
        <aside className="studio-pane studio-pane--types">
          <div className="studio-pane__heading">
            <span className="mono-label">TYPE</span>
            <span className="phase-pill">SHELL</span>
          </div>
          <div className="type-list">
            {types.map((type, index) => (
              <div className={index === 0 ? "type-row is-active" : "type-row"} key={type}>
                <span>{type}</span>
                <span className="type-row__index">{String(index + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="studio-pane studio-pane--editor">
          <div className="studio-pane__heading">
            <span className="mono-label">CONTENT / URL</span>
            <span className="phase-pill">PHASE 1</span>
          </div>
          <div className="foundation-form" aria-hidden="true">
            <label>
              <span>Destination</span>
              <div className="foundation-input">https://</div>
            </label>
            <div className="foundation-segment">
              <span className="is-active">Content</span>
              <span>Style</span>
              <span>Quality</span>
            </div>
            <div className="foundation-note">
              <span className="mono-label">ARCHITECTURE FIRST</span>
              <p>
                This is deliberately not a fake generator. The real payload codec and renderer
                arrive behind typed ports in the next implementation step.
              </p>
            </div>
          </div>
        </section>

        <aside className="studio-pane studio-pane--preview">
          <div className="studio-pane__heading">
            <span className="mono-label">LIVE PREVIEW</span>
            <span className="phase-pill">NOT WIRED</span>
          </div>
          <div className="preview-stage">
            <QrMotif compact />
          </div>
          <div className="preview-meta">
            <span>FORMAT</span>
            <strong>QR / SAFE DEFAULTS</strong>
            <span>ENGINE</span>
            <strong>PHASE 1</strong>
          </div>
          <button className="button button--primary button--full" disabled type="button">
            Download available in Phase 1
          </button>
        </aside>
      </div>
    </section>
  );
}
