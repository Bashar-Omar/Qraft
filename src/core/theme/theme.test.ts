import { describe, expect, it } from "vitest";

import {
  isThemePreference,
  nextThemePreference,
  resolveTheme,
  type ThemePreference,
} from "./theme";

describe("theme domain", () => {
  it("validates only supported preferences", () => {
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("mint")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it.each<[ThemePreference, boolean, "light" | "dark"]>([
    ["system", false, "light"],
    ["system", true, "dark"],
    ["light", true, "light"],
    ["dark", false, "dark"],
  ])("resolves %s correctly", (preference, systemDark, expected) => {
    expect(resolveTheme(preference, systemDark)).toBe(expected);
  });

  it("cycles system → light → dark → system", () => {
    expect(nextThemePreference("system")).toBe("light");
    expect(nextThemePreference("light")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("system");
  });
});
