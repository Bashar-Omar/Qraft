const guideGroups = [
  {
    title: "Architecture",
    items: ["Ports & adapters", "Payload vs symbology", "Project file schema"],
  },
  {
    title: "QR quality",
    items: [
      "Error correction",
      "Quiet zones",
      "Contrast & inversion",
      "Logo safety",
      "Local self-test",
    ],
  },
  {
    title: "Print & export",
    items: ["SVG / PNG / JPEG / WebP", "Portable .qraft.json", "Physical sizing", "Batch output"],
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
          Phase 1 proves the curated Core QR payload contract; Phase 2A adds the Qraft-owned design
          model and browser-only designer adapter; Phase 2B adds explainable quality findings and an
          independent local artifact self-test; Phase 2C adds local logo preparation and
          occlusion/ECC guardrails; Phase 2D completes the Visual Studio with JPEG/WebP artifacts
          and versioned portable project import/export.
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
