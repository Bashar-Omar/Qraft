import Link from "next/link";

import { QraftLogo } from "@/components/brand/qraft-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PRIMARY_NAV, SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner shell">
        <Link className="brand-link" href="/" aria-label="Qraft home">
          <QraftLogo />
        </Link>

        <nav aria-label="Primary navigation" className="site-nav">
          {PRIMARY_NAV.map((item) => (
            <Link className="site-nav__link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <ThemeToggle />
          <a className="github-link" href={SITE.githubUrl} rel="noreferrer" target="_blank">
            GitHub
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}
