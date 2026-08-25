"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  DEFAULT_THEME_PREFERENCE,
  isThemePreference,
  resolveTheme,
  THEME_PREFERENCES,
  type ThemePreference,
} from "@/core/theme/theme";

const STORAGE_KEY = "qraft-theme";
const THEME_CHANGE_EVENT = "qraft:theme-preference-change";

function getPreferenceSnapshot(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(saved) ? saved : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

function getServerPreferenceSnapshot(): ThemePreference {
  return DEFAULT_THEME_PREFERENCE;
}

function subscribePreference(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleLocalChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleLocalChange);
  };
}

function writePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The preference still applies for this page even if persistence is unavailable.
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function getSystemDarkSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSystemDarkSnapshot() {
  return false;
}

function subscribeSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    onStoreChange();
  };

  media.addEventListener("change", handleChange);

  return () => {
    media.removeEventListener("change", handleChange);
  };
}

function applyResolvedTheme(resolvedTheme: "light" | "dark") {
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribePreference,
    getPreferenceSnapshot,
    getServerPreferenceSnapshot,
  );

  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemDarkSnapshot,
    getServerSystemDarkSnapshot,
  );

  const resolvedTheme = resolveTheme(preference, systemDark);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  const selectPreference = (next: ThemePreference) => {
    writePreference(next);
    applyResolvedTheme(resolveTheme(next, getSystemDarkSnapshot()));
  };

  return (
    <div className="theme-toggle" aria-label="Color theme">
      {THEME_PREFERENCES.map((theme) => (
        <button
          aria-pressed={preference === theme}
          className="theme-toggle__option"
          key={theme}
          onClick={() => selectPreference(theme)}
          type="button"
        >
          {theme}
        </button>
      ))}
    </div>
  );
}
