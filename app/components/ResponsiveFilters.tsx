"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ResponsiveFilters({ panelId, children }: { panelId: string; children: ReactNode }) {
  const [enhanced, setEnhanced] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Leave the form visible until its disclosure control can respond.
    const frame = window.requestAnimationFrame(() => setEnhanced(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const element = container.current;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !toggle.current?.getClientRects().length) return;
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
      toggle.current?.focus();
    }
    element?.addEventListener("keydown", handleKeyDown);
    return () => element?.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

  return (
    <div
      ref={container}
      className="responsive-filters"
      data-enhanced={enhanced}
      data-expanded={expanded}
    >
      {enhanced ? (
        <button
          ref={toggle}
          className="filter-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
        >
          <span>Search and filters</span>
          <span aria-hidden="true">{expanded ? "Hide filters" : "Show filters"}</span>
        </button>
      ) : null}
      <div className="responsive-filter-content" id={panelId}>
        {children}
      </div>
    </div>
  );
}
