"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="placeholder-page shell">
      <span className="mono-label accent-marker">SYSTEM / ERROR</span>
      <h1>The interface hit an unexpected state.</h1>
      <p>No user payload should be included in production error telemetry.</p>
      <button className="button button--primary" onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}
