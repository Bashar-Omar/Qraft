import { GenerateStudio } from "@/features/generator/components/generate-studio";

export default function GeneratePage() {
  return (
    <section className="studio-page shell">
      <div className="page-intro">
        <span className="mono-label accent-marker">GENERATE / CORE QR</span>
        <h1>Build a code, not a compromise.</h1>
        <p>
          URL, Wi-Fi, Email, Phone, SMS and Text now run through the same Qraft-owned payload
          contracts, standards-first QR adapter, live local preview and real SVG/PNG export. No
          payload leaves this browser.
        </p>
      </div>

      <GenerateStudio />
    </section>
  );
}
