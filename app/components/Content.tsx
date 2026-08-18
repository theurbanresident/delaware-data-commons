import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="inner-hero">
      <div className="shell inner-hero-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="inner-deck">{children}</div>
      </div>
    </header>
  );
}

export function Notice({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "caution" | "plain";
}) {
  return (
    <aside className={`notice notice-${tone}`}>
      <h2>{title}</h2>
      <div>{children}</div>
    </aside>
  );
}
