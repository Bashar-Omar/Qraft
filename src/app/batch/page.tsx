export default function BatchPage() {
  return (
    <section className="placeholder-page shell">
      <span className="mono-label accent-marker">BATCH / PHASE 07</span>
      <h1>Scale generation without freezing the UI.</h1>
      <p>
        CSV mapping, validation, bounded concurrency and worker-backed export belong here after the
        single-code pipeline is proven.
      </p>
      <div className="placeholder-panel">
        <span className="mono-label">PLANNED PIPELINE</span>
        <strong>CSV → Validate → Queue → Render → ZIP / PDF</strong>
        <p>User records remain local by default.</p>
      </div>
    </section>
  );
}
