"use client";

import { useEffect, useRef, useState } from "react";
import { sitePath } from "../lib/site-path";

const links = [
  ["/datasets", "Catalog"],
  ["/open-data", "Delaware Open Data"],
  ["/codebooks", "Definitions"],
  ["/compare", "Compare"],
  ["/status", "Status"],
  ["/guides", "Guides"],
  ["/contribute", "Contribute"],
  ["/methods", "Methods"],
  ["/about", "About"],
] as const;

export function PrimaryNavigation() {
  const [enhanced, setEnhanced] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigation = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Keep every link available until the interactive control is ready.
    const frame = window.requestAnimationFrame(() => setEnhanced(true));
    const close = () => setExpanded(false);
    window.addEventListener("popstate", close);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("popstate", close);
    };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !toggle.current?.getClientRects().length || !(event.target instanceof Node) || !navigation.current?.contains(event.target)) return;
      event.preventDefault();
      setExpanded(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [expanded]);

  return (
    <nav
      ref={navigation}
      className="primary-navigation"
      aria-label="Primary navigation"
      data-enhanced={enhanced}
      data-expanded={expanded}
    >
      {enhanced ? (
        <button
          ref={toggle}
          className="navigation-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="primary-navigation-links"
          onClick={() => setExpanded((open) => !open)}
        >
          <span>Menu</span>
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
      ) : null}
      <div className="navigation-links" id="primary-navigation-links">
        {links.map(([path, label]) => (
          <a key={path} href={sitePath(path)} onClick={() => setExpanded(false)}>{label}</a>
        ))}
      </div>
    </nav>
  );
}
