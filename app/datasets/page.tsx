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
          <h1>Find a source you can explain and check.</h1>
          <p>
            Search the reviewed intake from the Delaware SHIP resource guide. Every record is traceable to its workbook rows; every record still needs source-by-source verification.
          </p>
        </div>
      </header>
      <CatalogExplorer />
    </main>
  );
}
