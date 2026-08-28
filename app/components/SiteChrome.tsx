import { sitePath } from "../lib/site-path";
import { githubRepositoryUrl } from "../lib/github";
import { ViewModeSwitch } from "./ViewModeSwitch";

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="utility-bar">
        <div className="shell utility-inner">
          <span>Independent community data catalog</span>
          <span>Phase 0 + 1 public preview</span>
        </div>
      </div>
      <header className="site-header shell">
        <a className="brand" href={sitePath("/")} aria-label="Delaware Data Commons home">
          <span className="brand-mark" aria-hidden="true">DE</span>
          <span>
            <strong>Delaware Data Commons</strong>
            <small>Public evidence, made traceable</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href={sitePath("/datasets")}>Catalog</a>
          <a href={sitePath("/codebooks")}>Definitions</a>
          <a href={sitePath("/compare")}>Compare</a>
          <a href={sitePath("/status")}>Status</a>
          <a href={sitePath("/guides")}>Guides</a>
          <a href={sitePath("/contribute")}>Contribute</a>
          <a href={sitePath("/methods")}>Methods</a>
          <a href={sitePath("/about")}>About</a>
        </nav>
      </header>
      <div className="view-mode-bar">
        <div className="shell">
          <ViewModeSwitch />
          <noscript>
            <p className="mode-noscript">
              Community view is shown without JavaScript. Full source records remain available in the <a href={sitePath("/data/reviewed-intake.json")}>catalog JSON</a> and <a href={sitePath("/methods")}>Methods page</a>.
            </p>
          </noscript>
        </div>
      </div>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="shell footer-main">
        <div>
          <strong>Delaware Data Commons</strong>
          <p>An independent, community-oriented catalog of public data.</p>
        </div>
        <div>
          <h2>Explore</h2>
          <a href={sitePath("/datasets")}>Data catalog</a>
          <a href={sitePath("/codebooks")}>Data dictionaries</a>
          <a href={sitePath("/compare")}>Compare variables</a>
          <a href={sitePath("/status")}>Source status</a>
          <a href={sitePath("/guides")}>Guides</a>
          <a href={sitePath("/contribute")}>Share a correction</a>
        </div>
        <div>
          <h2>Project</h2>
          <a href={sitePath("/methods")}>Methods and limitations</a>
          <a href={sitePath("/about")}>About and governance</a>
          <a href={sitePath("/about#corrections")}>Report a correction</a>
          <a href={githubRepositoryUrl} target="_blank" rel="noreferrer">GitHub archive <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="shell footer-legal">
        <p>Source publishers remain authoritative. Catalog status is not an endorsement of fitness for use.</p>
        <p>Built for accessible, low-bandwidth public use.</p>
      </div>
    </footer>
  );
}
