const guideGroups = [
  {
    title: "Architecture",
    items: ["Ports & adapters", "Payload vs symbology", "Project file schema"],
  },
  {
    title: "QR quality",
    items: ["Error correction", "Quiet zones", "Logo occlusion"],
  },
  {
    title: "Print & export",
    items: ["SVG vs raster", "Physical sizing", "Batch output"],
  },
] as const;

export default function GuidesPage() {
  return (
    <section className="guides-page shell">
      <div className="page-intro">
        <span className="mono-label accent-marker">GUIDES / SYSTEM</span>
        <h1>Technical depth without technical clutter.</h1>
        <p>
          The implementation decisions and quality gates are versioned under <code>/docs</code>.
          Phase 1 now proves the curated Core QR payload contract; public-facing guides expand as
          the Visual Studio and quality systems come online.
        </p>
      </div>

      <div className="guide-grid">
        {guideGroups.map((group) => (
          <article className="guide-card" key={group.title}>
            <span className="mono-label">QRAFT / GUIDE SET</span>
            <h2>{group.title}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
