import Link from "next/link";

export default function NotFound() {
  return (
    <section className="placeholder-page shell">
      <span className="mono-label accent-marker">404 / NOT FOUND</span>
      <h1>This code path does not exist.</h1>
      <p>The route may have moved, or it may belong to a later Qraft phase.</p>
      <Link className="button button--primary" href="/">
        Return home
      </Link>
    </section>
  );
}
