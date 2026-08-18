"use client";

import { useEffect, useState } from "react";
import { resolveViewMode, setViewModeInUrl } from "../lib/view-mode";

export type ViewMode = "community" | "technical";

const storageKey = "delaware-data-commons-view";

function applyMode(mode: ViewMode) {
  document.documentElement.dataset.viewMode = mode;
}

export function ViewModeSwitch() {
  const [mode, setMode] = useState<ViewMode>("community");
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      // The mode still works when browser storage is unavailable.
    }
    const initial = resolveViewMode(window.location.search, stored);

    applyMode(initial);
    const frame = window.requestAnimationFrame(() => setMode(initial));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function chooseMode(next: ViewMode) {
    setMode(next);
    applyMode(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Keep the current-page choice when browser storage is unavailable.
    }

    window.history.replaceState({}, "", setViewModeInUrl(window.location.href, next));

    setAnnouncement(
      next === "community"
        ? "Community view is on. Pages now use shorter, everyday explanations."
        : "Technical view is on. Pages now show detailed metadata and provenance.",
    );
  }

  return (
    <div className="view-switch-wrap">
      <div className="view-switch-copy">
        <strong>Choose your view</strong>
        <span className="community-only">Short explanations in everyday language</span>
        <span className="technical-only">Full metadata, methods, and provenance</span>
        <small>Same records; only the amount of detail changes.</small>
      </div>
      <fieldset className="view-switch">
        <legend className="sr-only">Choose how much detail to show</legend>
        <label className={mode === "community" ? "is-active" : ""}>
          <input
            type="radio"
            name="site-view-mode"
            value="community"
            checked={mode === "community"}
            onChange={() => chooseMode("community")}
          />
          <span>Community</span>
        </label>
        <label className={mode === "technical" ? "is-active" : ""}>
          <input
            type="radio"
            name="site-view-mode"
            value="technical"
            checked={mode === "technical"}
            onChange={() => chooseMode("technical")}
          />
          <span>Technical</span>
        </label>
      </fieldset>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
