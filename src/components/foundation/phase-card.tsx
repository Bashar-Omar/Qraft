import Link from "next/link";

type PhaseCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  status: string;
};

export function PhaseCard({ eyebrow, title, description, href, status }: PhaseCardProps) {
  return (
    <Link className="phase-card" href={href}>
      <div className="phase-card__top">
        <span className="mono-label">{eyebrow}</span>
        <span className="phase-pill">{status}</span>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <span className="phase-card__arrow" aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
