import { QraftLogo } from "@/components/brand/qraft-logo";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div>
          <QraftLogo className="site-footer__logo" />
          <p>Craft codes that work.</p>
        </div>
        <div className="site-footer__meta">
          <span>PHASE 04E / 2D + CATALOG</span>
          <a href={SITE.githubUrl} rel="noreferrer" target="_blank">
            PUBLIC REPOSITORY ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
