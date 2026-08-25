export default function ScanPage() {
  return (
    <section className="placeholder-page shell">
      <span className="mono-label accent-marker">SCAN / PHASE 05</span>
      <h1>Decode without uploading the image.</h1>
      <p>
        Camera and image decoding are intentionally deferred until the native BarcodeDetector →
        ZXing fallback boundary is implemented and tested.
      </p>
      <div className="placeholder-panel">
        <span className="mono-label">PLANNED CONTRACT</span>
        <strong>Camera → Decoder Port → Inspector</strong>
        <p>No URL will ever auto-open from a scan result.</p>
      </div>
    </section>
  );
}
