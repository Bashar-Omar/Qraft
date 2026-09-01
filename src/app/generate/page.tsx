import { GenerateStudio } from "@/features/generator/components/generate-studio";

export default function GeneratePage() {
  return (
    <section className="studio-page shell">
      <div className="page-intro">
        <span className="mono-label accent-marker">GENERATE / QR + BARCODE</span>
        <h1>Build a code, not a compromise.</h1>
        <p>
          Choose the designer QR workspace for intent-first payloads or the barcode workspace for
          curated Code 128 and Data Matrix. Both render locally through Qraft-owned contracts,
          export the canonical artifact and keep content inside this browser.
        </p>
      </div>

      <GenerateStudio />
    </section>
  );
}
