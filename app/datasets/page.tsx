import type { Metadata } from "next";
import { CatalogExplorer } from "./CatalogExplorer";

export const metadata: Metadata = {
  title: "Data catalog",
  description: "Search Delaware-relevant public data sources by topic, access mode, and resource type.",
};

export const dynamic = "force-static";

export default function CatalogPage() {
  return (
    <main id="main-content">
      <header className="catalog-hero">
        <div className="shell">
          <p className="eyebrow">Delaware community data catalog</p>
          <h1 className="community-only">Find information for a Delaware question.</h1>
          <h1 className="technical-only">Search source records and imported metadata.</h1>
          <p className="community-only">
            Search by topic, place, or source. Each result explains what the information may help you do and what to check before using it.
          </p>
          <p className="technical-only">
            Search the reviewed intake from the Delaware SHIP resource guide. Every record is traceable to its workbook rows; every record still needs source-by-source verification.
          </p>
        </div>
      </header>
      <CatalogExplorer />
    </main>
  );
}
